package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.sql.*;
import java.time.Instant;
import java.util.*;

/** Immutable authenticated current-snapshot assertions. No brokerage or lifecycle inference. */
@Component
public class PositionAssociations {
    record Allocation(String holdingId,String signedQuantity) {}
    record Input(String accountId,String snapshotId,String submissionId,String action,String supersedesAssociationId,List<Allocation> allocations,String declaration) {}
    record Association(String associationId,String accountId,String snapshotId,String action,String supersedesAssociationId,List<Allocation> allocations,String authority,String recordedAt,String submissionId) {}
    record Created(Association association,boolean added) {}
    private final String url;private final ObjectMapper json;
    @org.springframework.beans.factory.annotation.Autowired
    public PositionAssociations(SqliteEvidenceStore store,ObjectMapper json)throws SQLException{this(store.getConnection().getMetaData().getURL(),json);}
    PositionAssociations(String url,ObjectMapper json){this.url=url;this.json=json;}
    Connection connect(boolean readOnly)throws SQLException {
        var c=DriverManager.getConnection(url);
        try(var q=c.createStatement()){q.execute("PRAGMA foreign_keys=ON");q.execute("PRAGMA busy_timeout=5000");if(readOnly)q.execute("PRAGMA query_only=ON");}
        return c;
    }
    static void valid(Input i) {
        if(i==null||!AccountDirectory.validId(i.accountId())||i.snapshotId()==null||i.snapshotId().isBlank()||i.snapshotId().length()>256||
                !HeldQuoteDiscoveryItem.validUuid(i.submissionId())||i.allocations()==null||i.allocations().size()>128||
                !Set.of("ASSERT","WITHDRAW").contains(i.action()==null?"":i.action())||i.supersedesAssociationId()!=null&&!HeldQuoteDiscoveryItem.validUuid(i.supersedesAssociationId()))throw new IllegalArgumentException("invalid assertion");
        boolean asserting=i.action().equals("ASSERT");
        if(asserting!=!i.allocations().isEmpty()||!Objects.equals(i.declaration(),asserting?"THESE_ALLOCATIONS_FORM_ONE_CURRENT_MANAGED_OPTION_POSITION":"WITHDRAW_CURRENT_MEMBERSHIP_ASSERTION")||!asserting&&i.supersedesAssociationId()==null)throw new IllegalArgumentException("invalid assertion");
        var ids=new HashSet<String>();
        for(var a:i.allocations())if(a==null||a.holdingId()==null||a.holdingId().length()>128||!ids.add(a.holdingId())||a.signedQuantity()==null||!a.signedQuantity().matches("-?[1-9][0-9]{0,29}"))
            throw new IllegalArgumentException("duplicate or invalid allocation");
    }
    PositionSnapshot snapshot(Connection c,String account,String snapshotId)throws Exception {
        String sql=snapshotId==null?"SELECT payload_json FROM account_position_snapshot WHERE account=? ORDER BY evidence_date DESC,recorded_at DESC,snapshot_id DESC LIMIT 1":"SELECT payload_json FROM account_position_snapshot WHERE account=? AND snapshot_id=?";
        try(var q=c.prepareStatement(sql)){q.setString(1,account);if(snapshotId!=null)q.setString(2,snapshotId);
            try(var rs=q.executeQuery()){if(!rs.next())return null;var s=json.readValue(rs.getString(1),PositionSnapshot.class);if(!s.account().equals(account))throw new SQLException("snapshot ownership mismatch");return s;}}
    }
    List<Association> active(Connection c,String account,String snapshot)throws Exception {
        var rows=new ArrayList<Association>();
        try(var q=c.prepareStatement("SELECT a.payload_json FROM position_association a WHERE a.account=? AND a.snapshot_id=? AND NOT EXISTS (SELECT 1 FROM position_association b WHERE b.account=a.account AND b.supersedes_id=a.association_id) ORDER BY a.association_id")) {
            q.setString(1,account);q.setString(2,snapshot);try(var rs=q.executeQuery()){while(rs.next()){var a=json.readValue(rs.getString(1),Association.class);if(a.action().equals("ASSERT"))rows.add(a);}}
        }return List.copyOf(rows);
    }
    Optional<Association> get(Connection c,String id)throws Exception {
        try(var q=c.prepareStatement("SELECT payload_json FROM position_association WHERE association_id=?")){q.setString(1,id);try(var rs=q.executeQuery()){return rs.next()?Optional.of(json.readValue(rs.getString(1),Association.class)):Optional.empty();}}
    }
    public Optional<String> owner(String id)throws SQLException {
        try(var c=connect(true);var q=c.prepareStatement("SELECT account FROM position_association WHERE association_id=?")){q.setString(1,id);try(var rs=q.executeQuery()){return rs.next()?Optional.of(rs.getString(1)):Optional.empty();}}
    }
    public Optional<Association> get(String id)throws Exception{try(var c=connect(true)){return get(c,id);}}
    public synchronized Created create(Input input,String user)throws Exception {
        valid(input);String request=json.writeValueAsString(input);
        try(var c=connect(false)) {
            c.setAutoCommit(false);
            try {
                // Exact retry precedes latest-snapshot check; a later pull cannot invalidate committed identity.
                try(var q=c.prepareStatement("SELECT request_json,payload_json FROM position_association WHERE account=? AND author_user_id=? AND submission_id=?")) {
                    q.setString(1,input.accountId());q.setString(2,user);q.setString(3,input.submissionId());
                    try(var rs=q.executeQuery()){if(rs.next()){if(!rs.getString(1).equals(request))throw new IllegalArgumentException("submission reused");return new Created(json.readValue(rs.getString(2),Association.class),false);}}
                }
                var snapshot=snapshot(c,input.accountId(),null);if(snapshot==null)throw new NoSuchElementException();
                if(!snapshot.snapshotId().equals(input.snapshotId()))throw new IllegalArgumentException("selected snapshot is no longer current");
                var current=active(c,input.accountId(),snapshot.snapshotId());
                if(input.supersedesAssociationId()!=null&&!current.stream().anyMatch(a->a.associationId().equals(input.supersedesAssociationId())))throw new IllegalArgumentException("superseded assertion not active in this snapshot");
                var held=new HashMap<String,PositionSnapshot.Constituent>();for(var h:snapshot.holdings())held.put(h.holdingId(),h);
                if(input.action().equals("ASSERT"))validateAllocation(c,snapshot,input,held,current);
                var record=new Association(UUID.randomUUID().toString(),input.accountId(),snapshot.snapshotId(),input.action(),input.supersedesAssociationId(),List.copyOf(input.allocations()),"AUTHENTICATED_OPERATOR_ASSERTION",Instant.now().toString(),input.submissionId());
                try(var q=c.prepareStatement("INSERT INTO position_association (account,association_id,snapshot_id,author_user_id,submission_id,request_json,payload_json,supersedes_id) VALUES (?,?,?,?,?,?,?,?)")) {
                    q.setString(1,input.accountId());q.setString(2,record.associationId());q.setString(3,record.snapshotId());q.setString(4,user);q.setString(5,input.submissionId());q.setString(6,request);q.setString(7,json.writeValueAsString(record));q.setString(8,input.supersedesAssociationId());q.executeUpdate();
                }
                c.commit();return new Created(record,true);
            }catch(Exception e){c.rollback();throw e;}
        }
    }
    private void validateAllocation(Connection c,PositionSnapshot snapshot,Input input,Map<String,PositionSnapshot.Constituent> held,List<Association> active)throws Exception {
        var used=new HashMap<String,BigDecimal>();
        for(var a:active)if(!a.associationId().equals(input.supersedesAssociationId()))for(var part:a.allocations())used.merge(part.holdingId(),new BigDecimal(part.signedQuantity()).abs(),BigDecimal::add);
        String root=null,expiry=null;
        for(var p:input.allocations()) {
            var h=held.get(p.holdingId());var id=h==null?null:OptionIdentity.of(h);var q=new BigDecimal(p.signedQuantity());
            if(h==null||!h.kind().equals("Options")||h.quantity().signum()!=q.signum()||h.quantity().stripTrailingZeros().scale()>0||id==null||!id.root().matches("[A-Z.]+"))throw new IllegalArgumentException("unsupported holding binding");
            if(root!=null&&(!root.equals(id.root())||!expiry.equals(id.expiration())))throw new IllegalArgumentException("different underlying or expiration");
            var underlying=ContractEvidence.read(c,snapshot,h).underlying();
            if(!underlying.status().equals("ESTABLISHED")||!underlying.value().symbol().equals(id.root()))throw new IllegalArgumentException("qualified underlying unavailable");
            root=id.root();expiry=id.expiration();used.merge(h.holdingId(),q.abs(),BigDecimal::add);
            if(used.get(h.holdingId()).compareTo(h.quantity().abs())>0)throw new IllegalArgumentException("overlapping allocation");
        }
    }
}
