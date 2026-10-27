package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.Component;
import java.sql.*;
import java.time.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/** Account-owned evidence facade: originals first; complete admission atomically; failed refresh preserves. */
@Component
public class TransactionHistory {
    private final String url;
    private final AccountDirectory accounts;
    private final TastytradeClient client;
    private final ObjectMapper json;
    private final boolean enabled;
    private final Duration reuse;
    private final Clock clock;
    private final ConcurrentHashMap<String,Object> locks=new ConcurrentHashMap<>();
    private static final TypeReference<LinkedHashMap<String,Object>> MAP=new TypeReference<>() {};
    private record Pending(String sourceId,String hash,String artifact,String received,int row,Map<String,Object> payload) {}
    private record State(String checked,String endAt) {}
    @Autowired
    public TransactionHistory(SqliteEvidenceStore store,AccountDirectory accounts,TastytradeClient client,ObjectMapper json,
            @Value("${wheelwright.history.read-through-enabled:false}") boolean enabled,
            @Value("${wheelwright.history.reuse-seconds:300}") long seconds) throws SQLException {
        this(store.getConnection().getMetaData().getURL(),accounts,client,json,enabled,Duration.ofSeconds(seconds),Clock.systemUTC());
    }
    TransactionHistory(String url,AccountDirectory accounts,TastytradeClient client,ObjectMapper json,boolean enabled,Duration reuse,Clock clock) {
        if(reuse.isNegative()||reuse.compareTo(Duration.ofDays(1))>0)throw new IllegalArgumentException("invalid history reuse policy");
        this.url=url;this.accounts=accounts;this.client=client;this.json=json;this.enabled=enabled;this.reuse=reuse;this.clock=clock;
    }
    private Connection connect()throws SQLException {
        var c=DriverManager.getConnection(url);try(var q=c.createStatement()){q.execute("PRAGMA foreign_keys=ON");q.execute("PRAGMA busy_timeout=5000");}return c;
    }
    public Map<String,Object> read(String account,String requestId)throws Exception {
        synchronized(locks.computeIfAbsent(account,k->new Object())) {
            var binding=accounts.get(account).orElseThrow();
            if(binding.brokerAssociation().broker().equals("FIDELITY"))return readFidelity(binding,requestId);
            if(!binding.brokerAssociation().broker().equals("TASTYTRADE"))throw new UnsupportedOperationException();
            State before=state(account);boolean fresh=fresh(before),attempted=false;
            if(!fresh&&enabled&&client.configured()){attempted=true;acquire(binding);}
            return representation(account,requestId,attempted);
        }
    }

    public static final class InvalidCursor extends IllegalArgumentException {}

    /** Pure retained-source query: never invokes brokerage acquisition, even when read-through is enabled. */
    public Map<String,Object> retained(String account,String request,String symbol,String from,String through,int limit,String cursor)throws Exception {
        synchronized(locks.computeIfAbsent(account,k->new Object())) {
            var binding=accounts.get(account).orElseThrow();
            var result=binding.brokerAssociation().broker().equals("FIDELITY")?readFidelity(binding,request):
                    binding.brokerAssociation().broker().equals("TASTYTRADE")?representation(account,request,false):null;
            if(result==null)throw new UnsupportedOperationException();
            @SuppressWarnings("unchecked") var rows=(List<Map<String,Object>>)result.get("transactions");
            var selected=rows.stream().filter(row->symbol==null||symbol.equals(row.get("symbol")))
                    .filter(row->from==null||row.get("transactionDate")!=null&&from.compareTo((String)row.get("transactionDate"))<=0)
                    .filter(row->through==null||row.get("transactionDate")!=null&&through.compareTo((String)row.get("transactionDate"))>=0).toList();
            String signature=BrokerageArtifacts.sha(json.writeValueAsBytes(List.of(account,Objects.toString(symbol,""),Objects.toString(from,""),Objects.toString(through,""),limit,selected)));
            int offset=0;
            if(cursor!=null) {
                try {
                    String[] parts=new String(Base64.getUrlDecoder().decode(cursor),StandardCharsets.UTF_8).split(":",-1);
                    if(parts.length!=2||!parts[0].equals(signature)||!parts[1].matches("[0-9]{1,8}"))throw new IllegalArgumentException();
                    offset=Integer.parseInt(parts[1]);if(offset<=0||offset>=selected.size())throw new IllegalArgumentException();
                }catch(Exception e){throw new InvalidCursor();}
            }
            int end=Math.min(offset+limit,selected.size());
            result.put("transactions",selected.subList(offset,end));result.put("recordCount",end-offset);
            result.put("queryMode","RETAINED_ONLY");result.put("matchedRecordCount",selected.size());
            result.put("pageComplete",end==selected.size());
            result.put("nextCursor",end==selected.size()?null:Base64.getUrlEncoder().withoutPadding().encodeToString((signature+":"+end).getBytes(StandardCharsets.UTF_8)));
            var selection=new LinkedHashMap<String,Object>();selection.put("symbol",symbol);selection.put("from",from);selection.put("through",through);selection.put("limit",limit);result.put("selection",selection);
            result.put("qualification","Retained transaction observations only; no provider refresh. Page completeness is not lifetime brokerage completeness. Source actions, gross reported value, net cash and fees remain distinct. Matching a symbol does not associate an opening occurrence with a currently held construction. Fidelity identity is row equivalence, not broker-event identity. Missing evidence is not zero premium.");
            return result;
        }
    }

    private Map<String,Object> readFidelity(AccountDirectory.Account binding,String request)throws Exception {
        String account=binding.id();
        try(var c=connect()) {
            c.setAutoCommit(false);
            try {
                String lastImport=null;int sources=0;
                try(var q=c.prepareStatement("SELECT count(*),max(imported_at) FROM brokerage_import WHERE account=? AND file_type='ACTIVITY' AND status='ACCEPTED'")) {
                    q.setString(1,account);try(var rs=q.executeQuery()){rs.next();sources=rs.getInt(1);lastImport=rs.getString(2);}
                }
                var staged=new ArrayList<Pending>();
                try(var q=c.prepareStatement("SELECT l.*,a.received_at FROM brokerage_ledger_observation l JOIN brokerage_artifact a ON a.account=l.account AND a.artifact_id=l.first_artifact_id WHERE l.account=? ORDER BY l.row_hash,l.occurrence")) {
                    q.setString(1,account);try(var rs=q.executeQuery()){while(rs.next()) {
                        int sourceRow=0;
                        try(var line=c.prepareStatement("SELECT source_row FROM brokerage_evidence_row WHERE account=? AND artifact_id=? AND row_json=? ORDER BY source_row LIMIT 1 OFFSET ?")) {
                            line.setString(1,account);line.setString(2,rs.getString("first_artifact_id"));line.setString(3,rs.getString("row_json"));line.setInt(4,rs.getInt("occurrence")-1);
                            try(var r=line.executeQuery()){if(r.next())sourceRow=r.getInt(1);}
                        }
                        if(sourceRow==0)throw new IllegalArgumentException("retained activity lineage unavailable");
                        var raw=json.readValue(rs.getString("row_json"),new TypeReference<Map<String,String>>(){});
                        staged.add(new Pending("FIDELITY|PRODUCTION|"+rs.getString("row_hash")+"|"+rs.getInt("occurrence"),rs.getString("row_hash"),rs.getString("first_artifact_id"),rs.getString("received_at"),sourceRow,FidelityTransactions.normalize(raw,binding.brokerAssociation().accountNumber())));
                        if(staged.size()>25000)throw new IllegalArgumentException("history capacity");
                    }}
                }
                for(var p:staged)admitOne(c,account,p);
                var rows=load(c,account);boolean supported=rows.stream().allMatch(r->"SUPPORTED".equals(r.get("normalization")));
                var r=new LinkedHashMap<String,Object>();r.put("requestId",request);r.put("accountId",account);r.put("provider","FIDELITY");r.put("environment","PRODUCTION");
                r.put("asOf",null);r.put("checkedAt",null);r.put("lastImportedAt",lastImport);r.put("requestedFrom",null);r.put("requestedThrough",null);
                r.put("observedFrom",rows.isEmpty()?null:rows.getFirst().get("transactionDate"));r.put("observedThrough",rows.isEmpty()?null:rows.getLast().get("transactionDate"));
                r.put("evidenceMode",sources==0?"UNAVAILABLE":"RETAINED");r.put("freshness","UNVERIFIED");r.put("acquisitionOutcome","NOT_APPLICABLE");r.put("providerTraversal","NOT_APPLICABLE");r.put("providerSnapshotConsistency","UNVERIFIED");r.put("lifetimeCoverage","UNKNOWN");r.put("identityBasis","RETAINED_ROW_OBSERVATION");
                r.put("latestAttemptId",null);r.put("latestAttemptPages",0);r.put("normalization",supported?"SUPPORTED":"QUALIFIED");r.put("complete",sources>0&&supported);r.put("recordCount",rows.size());r.put("transactions",rows);
                if(json.writeValueAsBytes(r).length>BrokerageArtifacts.MAX_BYTES)throw new IllegalArgumentException("history capacity");c.commit();return r;
            }catch(Exception e){c.rollback();throw e;}
        }
    }

    private boolean fresh(State s){return s!=null&&!clock.instant().isBefore(Instant.parse(s.checked()))&&Duration.between(Instant.parse(s.checked()),clock.instant()).compareTo(reuse)<0;}
    private State state(String account)throws SQLException {
        try(var c=connect();var q=c.prepareStatement("SELECT checked_at,end_at FROM account_history_state WHERE account=?")) {
            q.setString(1,account);try(var r=q.executeQuery()){return r.next()?new State(r.getString(1),r.getString(2)):null;}
        }
    }
    private void acquire(AccountDirectory.Account account)throws Exception {
        String id=UUID.randomUUID().toString(),started=clock.instant().toString();
        try(var c=connect();var q=c.prepareStatement("INSERT INTO account_history_attempt(account,attempt_id,started_at,end_at,status) VALUES (?,?,?,?,'PENDING')")) {
            q.setString(1,account.id());q.setString(2,id);q.setString(3,started);q.setString(4,started);q.executeUpdate();
        }
        var pending=new ArrayList<Pending>();var identities=new HashSet<String>();int[] pages={0};
        boolean accepted=false;
        try {
            client.transactions(account.brokerAssociation().accountNumber(),started,(offset,bytes)-> {
                String received=clock.instant().toString();String artifact=retain(account.id(),id,offset,bytes,received);pages[0]++;
                var page=TastytradeTransactions.page(bytes,account.brokerAssociation().accountNumber(),offset);
                int row=0;
                for(var item:page.items()) {
                    row++;var payload=TastytradeTransactions.normalize(item,account.brokerAssociation().accountNumber());String source=(String)payload.get("sourceTransactionId");
                    if(!identities.add(source))throw new IllegalArgumentException("repeated source transaction");
                    pending.add(new Pending("TASTYTRADE|PRODUCTION|"+source,BrokerageArtifacts.sha(item.toString().getBytes(StandardCharsets.UTF_8)),artifact,received,row,payload));
                    if(pending.size()>25000)throw new IllegalArgumentException("history capacity");
                }
            });
            // Leave room for public lineage/context. Exact serialized-response cap is also checked before admission.
            if(json.writeValueAsBytes(pending.stream().map(Pending::payload).toList()).length>BrokerageArtifacts.MAX_BYTES/2)throw new IllegalArgumentException("history capacity");
            admit(account.id(),id,started,pending,pages[0]);accepted=true;
        }catch(Exception ignored) {
            // Source/SQL/transport diagnostics never disclose private broker identifiers or payloads.
        }finally {
            if(!accepted)try(var c=connect();var q=c.prepareStatement("UPDATE account_history_attempt SET status='FAILED',completed_at=?,pages=? WHERE account=? AND attempt_id=?")) {
                q.setString(1,clock.instant().toString());q.setInt(2,pages[0]);q.setString(3,account.id());q.setString(4,id);q.executeUpdate();
                try(var imports=c.prepareStatement("UPDATE brokerage_import SET status='REJECTED',result='History scan incomplete; prior admitted evidence preserved' WHERE account=? AND import_id LIKE ?")) {imports.setString(1,account.id());imports.setString(2,id+"-%");imports.executeUpdate();}
            }
        }
    }
    private String retain(String account,String attempt,int offset,byte[] bytes,String received)throws Exception {
        String hash=BrokerageArtifacts.sha(bytes),artifact=UUID.randomUUID().toString();
        try(var c=connect()) {
            c.setAutoCommit(false);
            try {
                try(var q=c.prepareStatement("SELECT artifact_id FROM brokerage_artifact WHERE account=? AND sha256=?")) {
                    q.setString(1,account);q.setString(2,hash);try(var r=q.executeQuery()){if(r.next())artifact=r.getString(1);}
                }
                try(var q=c.prepareStatement("INSERT OR IGNORE INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)")) {
                    q.setString(1,account);q.setString(2,artifact);q.setString(3,hash);q.setString(4,"application/json");q.setInt(5,bytes.length);q.setBytes(6,bytes);q.setString(7,received);q.executeUpdate();
                }
                try(var q=c.prepareStatement("INSERT INTO brokerage_import VALUES (?,?,?,?,?,?,'PENDING','Retained history page; admission pending')")) {
                    q.setString(1,account);q.setString(2,attempt+"-"+offset);q.setString(3,artifact);q.setString(4,"tastytrade-transactions-"+offset+".json");q.setString(5,"API_TRANSACTIONS");q.setString(6,received);q.executeUpdate();
                }
                try(var q=c.prepareStatement("INSERT INTO account_history_page VALUES (?,?,?,?,?)")) {
                    q.setString(1,account);q.setString(2,attempt);q.setInt(3,offset);q.setString(4,artifact);q.setString(5,received);q.executeUpdate();
                }
                c.commit();return artifact;
            }catch(Exception e){c.rollback();throw e;}
        }
    }
    private void admit(String account,String attempt,String end,List<Pending> rows,int pages)throws Exception {
        try(var c=connect()) {
            c.setAutoCommit(false);
            try {
                for(var p:rows)admitOne(c,account,p);
                String checked=clock.instant().toString();
                try(var q=c.prepareStatement("INSERT INTO account_history_state VALUES (?,?,?,?) ON CONFLICT(account) DO UPDATE SET accepted_attempt_id=excluded.accepted_attempt_id,checked_at=excluded.checked_at,end_at=excluded.end_at")) {
                    q.setString(1,account);q.setString(2,attempt);q.setString(3,checked);q.setString(4,end);q.executeUpdate();
                }
                try(var q=c.prepareStatement("UPDATE account_history_attempt SET status='ACCEPTED',completed_at=?,pages=? WHERE account=? AND attempt_id=?")) {
                    q.setString(1,checked);q.setInt(2,pages);q.setString(3,account);q.setString(4,attempt);q.executeUpdate();
                }
                try(var q=c.prepareStatement("UPDATE brokerage_import SET status='ACCEPTED',result='Complete transaction scan admitted; lifetime coverage unknown' WHERE account=? AND import_id LIKE ?")) {
                    q.setString(1,account);q.setString(2,attempt+"-%");q.executeUpdate();
                }
                // Capacity includes retained rows not present in this scan. Roll back the new projection if too large.
                if(json.writeValueAsBytes(load(c,account)).length>BrokerageArtifacts.MAX_BYTES-65536)throw new IllegalArgumentException("history capacity");
                c.commit();
            }catch(Exception e){c.rollback();throw e;}
        }
    }
    private void admitOne(Connection c,String account,Pending p)throws Exception {
        String key=p.sourceId(),transaction=UUID.randomUUID().toString(),previous=null,oldHash=null;
        try(var q=c.prepareStatement("SELECT t.transaction_id,t.current_observation_id,o.content_hash FROM account_transaction t JOIN account_transaction_observation o ON o.account=t.account AND o.observation_id=t.current_observation_id WHERE t.account=? AND t.source_key=?")) {
            q.setString(1,account);q.setString(2,key);try(var r=q.executeQuery()){if(r.next()){transaction=r.getString(1);previous=r.getString(2);oldHash=r.getString(3);}}
        }
        if(p.hash().equals(oldHash))return;
        String observation=UUID.randomUUID().toString();
        try(var q=c.prepareStatement("INSERT INTO account_transaction_observation VALUES (?,?,?,?,?,?,?,?,?)")) {
            q.setString(1,account);q.setString(2,observation);q.setString(3,transaction);q.setString(4,p.hash());q.setString(5,p.artifact());q.setInt(6,p.row());q.setString(7,p.received());q.setString(8,previous);q.setString(9,json.writeValueAsString(p.payload()));q.executeUpdate();
        }
        try(var q=c.prepareStatement("INSERT INTO account_transaction VALUES (?,?,?,?) ON CONFLICT(account,source_key) DO UPDATE SET current_observation_id=excluded.current_observation_id")) {
            q.setString(1,account);q.setString(2,transaction);q.setString(3,key);q.setString(4,observation);q.executeUpdate();
        }
    }
    private List<Map<String,Object>> load(Connection c,String account)throws Exception {
        var rows=new ArrayList<Map<String,Object>>();var sourceIds=new HashMap<String,String>();
        try(var q=c.prepareStatement("SELECT t.transaction_id,o.*,a.sha256 FROM account_transaction t JOIN account_transaction_observation o ON o.account=t.account AND o.observation_id=t.current_observation_id JOIN brokerage_artifact a ON a.account=o.account AND a.artifact_id=o.artifact_id WHERE t.account=?")) {
            q.setString(1,account);try(var rs=q.executeQuery()){while(rs.next()) {
                var row=json.readValue(rs.getString("payload_json"),MAP);row.put("transactionId",rs.getString("transaction_id"));row.put("accountId",account);
                var provenance=new LinkedHashMap<String,Object>();
                for(String[] f:List.of(new String[]{"artifactId","artifact_id"},new String[]{"sha256","sha256"},new String[]{"observationId","observation_id"},new String[]{"receivedAt","received_at"},new String[]{"previousObservationId","previous_observation_id"}))provenance.put(f[0],rs.getString(f[1]));
                provenance.put("rowNumber",rs.getInt("source_row"));row.put("provenance",provenance);
                row.put("correctionStatus",rs.getString("previous_observation_id")==null?"NONE_OBSERVED":"CHANGED_OBSERVATION");
                sourceIds.put((String)row.get("sourceTransactionId"),(String)row.get("transactionId"));rows.add(row);if(rows.size()>25000)throw new IllegalArgumentException("history capacity");
            }}
        }
        for(var row:rows) {
            Object reverse=row.get("reversesSourceId");String target=reverse==null?null:sourceIds.get(reverse);
            row.put("reversesTransactionId",target);row.put("reversalStatus",reverse==null?"NONE_REPORTED":target==null?"UNRESOLVED":"LINKED");
        }
        rows.sort(Comparator.comparing((Map<String,Object> r)->(String)r.get("transactionDate"))
                .thenComparing(r->r.get("executedAt")==null?Instant.MIN:OffsetDateTime.parse((String)r.get("executedAt")).toInstant())
                .thenComparing(r->(String)r.get("transactionId")));
        return rows;
    }
    private Map<String,Object> representation(String account,String request,boolean attempted)throws Exception {
        try(var c=connect()) {
            c.setAutoCommit(false);
            State state=null;try(var q=c.prepareStatement("SELECT checked_at,end_at FROM account_history_state WHERE account=?")) {
                q.setString(1,account);try(var rs=q.executeQuery()){if(rs.next())state=new State(rs.getString(1),rs.getString(2));}
            }
            String status=null,attempt=null;int pages=0;
            try(var q=c.prepareStatement("SELECT attempt_id,status,pages FROM account_history_attempt WHERE account=? ORDER BY started_at DESC,rowid DESC LIMIT 1")) {
                q.setString(1,account);try(var rs=q.executeQuery()){if(rs.next()){attempt=rs.getString(1);status=rs.getString(2);pages=rs.getInt(3);}}
            }
            var rows=load(c,account);var r=new LinkedHashMap<String,Object>();boolean reusable=fresh(state)||attempted&&"ACCEPTED".equals(status);
            r.put("requestId",request);r.put("accountId",account);r.put("provider","TASTYTRADE");r.put("environment","PRODUCTION");
            r.put("asOf",state==null?null:state.endAt());r.put("checkedAt",state==null?null:state.checked());r.put("requestedFrom",null);r.put("requestedThrough",state==null?null:state.endAt());
            r.put("observedFrom",rows.isEmpty()?null:rows.getFirst().get("transactionDate"));r.put("observedThrough",rows.isEmpty()?null:rows.getLast().get("transactionDate"));
            r.put("evidenceMode",state==null?"UNAVAILABLE":attempted&&"ACCEPTED".equals(status)?"ACQUIRED":"RETAINED");
            r.put("freshness",state==null?"UNAVAILABLE":reusable?"REUSABLE":"STALE");
            boolean complete=state!=null&&reusable&&!"FAILED".equals(status)&&!"PENDING".equals(status);
            r.put("acquisitionOutcome",complete?attempted?"COMPLETE":"REUSED":status==null?"UNAVAILABLE":"INCOMPLETE");
            r.put("providerTraversal",state==null?"INCOMPLETE":"COMPLETE_AT_LAST_SUCCESS");r.put("providerSnapshotConsistency","UNVERIFIED");r.put("lifetimeCoverage","UNKNOWN");
            r.put("lastImportedAt",null);r.put("identityBasis","BROKER_TRANSACTION_ID");r.put("latestAttemptId",attempt);r.put("latestAttemptPages",pages);
            boolean normalized=rows.stream().allMatch(row->"SUPPORTED".equals(row.get("normalization")));
            r.put("normalization",normalized?"SUPPORTED":"QUALIFIED");r.put("complete",complete&&normalized);r.put("recordCount",rows.size());r.put("transactions",rows);
            c.commit();return r;
        }
    }
}
