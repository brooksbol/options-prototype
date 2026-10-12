package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.stereotype.Component;
import java.sql.*;
import java.time.Instant;
import java.security.MessageDigest;
import java.util.*;

/** One explicit acquisition at a time; immutable source first, atomic snapshot/outcome second. */
@Component
public class PositionAcquisition {
    public record Result(String requestId,String accountId,String acquisitionId,String status,String artifactId,
            String snapshotId,String startedAt,String receivedAt,String completedAt,String result) {}
    private final String url;
    private final AccountDirectory accounts;
    private final PositionReadService positions;
    private final TastytradeClient client;
    @org.springframework.beans.factory.annotation.Autowired
    public PositionAcquisition(SqliteEvidenceStore store,AccountDirectory accounts,PositionReadService positions,
            TastytradeClient client)throws SQLException {
        this(store.getConnection().getMetaData().getURL(),accounts,positions,client);
    }
    PositionAcquisition(String url,AccountDirectory accounts,PositionReadService positions,TastytradeClient client) {
        this.url=url;this.accounts=accounts;this.positions=positions;this.client=client;
    }
    // Fixed fractional width preserves chronological ordering in the existing TEXT snapshot index.
    private static String timestamp(){return new java.time.format.DateTimeFormatterBuilder().appendInstant(9).toFormatter().format(Instant.now());}
    private Connection connect()throws SQLException {
        var c=DriverManager.getConnection(url);
        try(var q=c.createStatement()){q.execute("PRAGMA foreign_keys=ON");q.execute("PRAGMA busy_timeout=5000");}
        return c;
    }
    public boolean configured(){return client.configured();}
    public synchronized Result acquire(String accountId,String requestId)throws Exception {
        var account=accounts.get(accountId).orElseThrow();
        if(!account.brokerAssociation().broker().equals("TASTYTRADE"))throw new IllegalArgumentException("unsupported brokerage");
        String id=UUID.randomUUID().toString(),started=timestamp(),received=null,artifact=null,hash=null;
        byte[] bytes;
        try {bytes=client.holdings(account.brokerAssociation().accountNumber());received=timestamp();}
        catch(Exception e){return finish(requestId,accountId,id,"FAILED",null,null,started,null);}
        hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        artifact=UUID.nameUUIDFromBytes((accountId+"|"+hash).getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString();
        // Retain before interpretation. Every response, including repeated content, has its own observation boundary.
        try(var c=connect()) {
            c.setAutoCommit(false);
            try(var existing=c.prepareStatement("SELECT artifact_id FROM brokerage_artifact WHERE account=? AND sha256=?")) {
                existing.setString(1,accountId);existing.setString(2,hash);
                try(var rows=existing.executeQuery()){if(rows.next())artifact=rows.getString(1);}
            }
            try(var q=c.prepareStatement("INSERT OR IGNORE INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)");
                var a=c.prepareStatement("INSERT INTO brokerage_import VALUES (?,?,?,?,?,?,?,?)")) {
                q.setString(1,accountId);q.setString(2,artifact);q.setString(3,hash);q.setString(4,"application/json");q.setInt(5,bytes.length);q.setBytes(6,bytes);q.setString(7,received);q.executeUpdate();
                a.setString(1,accountId);a.setString(2,id);a.setString(3,artifact);a.setString(4,"tastytrade-positions.json");a.setString(5,"API_POSITIONS");a.setString(6,received);a.setString(7,"PENDING");a.setString(8,"Retained response; acquisition not yet reconciled.");a.executeUpdate();
                c.commit();
            }catch(Exception e){c.rollback();throw e;}
        }
        PositionSnapshot snapshot;
        try {
            var observation=new PositionSnapshot.Observation("TASTYTRADE","PRODUCTION",id,started,received,TastytradeHoldings.VERSION,"REQUESTED_ACCOUNT_FULL_HOLDINGS");
            snapshot=TastytradeHoldings.parse(bytes,account,accounts.identityNamespace(accountId),artifact,hash,observation);
        }catch(Exception e){return finish(requestId,accountId,id,"REJECTED",artifact,null,started,received);}
        return finish(requestId,accountId,id,"ACCEPTED",artifact,snapshot,started,received);
    }
    private Result finish(String requestId,String account,String id,String status,String artifact,PositionSnapshot snapshot,
            String started,String received)throws Exception {
        String completed=timestamp();
        String result=status.equals("ACCEPTED")?"Holdings observation admitted. Occurrence, opening economics, orders and Program applicability unresolved.":
                "Acquisition not admitted. Previous successful holdings observation preserved; freshness has not advanced.";
        try(var c=connect()) {
            c.setAutoCommit(false);
            try {
                if(snapshot!=null)positions.admit(c,snapshot);
                try(var q=c.prepareStatement("INSERT INTO brokerage_position_acquisition (acquisition_id,account,artifact_id,started_at,received_at,completed_at,status,interpretation_version) VALUES (?,?,?,?,?,?,?,?)")) {
                    q.setString(1,id);q.setString(2,account);q.setString(3,artifact);q.setString(4,started);q.setString(5,received);q.setString(6,completed);q.setString(7,status);q.setString(8,TastytradeHoldings.VERSION);q.executeUpdate();
                }
                if(artifact!=null)try(var q=c.prepareStatement("UPDATE brokerage_import SET status=?,result=? WHERE account=? AND import_id=?")) {
                    q.setString(1,status);q.setString(2,result);q.setString(3,account);q.setString(4,id);q.executeUpdate();
                }
                c.commit();
            }catch(Exception e){c.rollback();throw e;}
        }
        return new Result(requestId,account,id,status,artifact,snapshot==null?null:snapshot.snapshotId(),started,received,completed,result);
    }
}
