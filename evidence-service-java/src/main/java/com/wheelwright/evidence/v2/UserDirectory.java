package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.sql.*;
import java.util.*;

/** Fixed backend capabilities and many-to-many Account access; no ownership inference. */
@Component
public class UserDirectory {
    public static final String ADMIN="users.admin";
    public record AccountAccess(String accountId,boolean metadataRead,boolean positionsRead,boolean artifactsRead,boolean artifactsWrite,boolean positionsAcquire) {}
    public record User(String id,String displayName,boolean administrator,List<AccountAccess> accountAccess) {}
    private final String url;
    @Autowired
    public UserDirectory(SqliteEvidenceStore store,AccountDirectory accounts)throws SQLException {
        this(store.getConnection().getMetaData().getURL());
    }
    public UserDirectory(String url){this.url=url;}
    public static boolean validId(String id){return id!=null&&id.matches("usr_[a-f0-9]{32}");}
    private Connection connect()throws SQLException {
        var c=DriverManager.getConnection(url);
        try(var q=c.createStatement()){q.execute("PRAGMA foreign_keys=ON");}
        return c;
    }
    /** Explicit server bootstrap, never a client claim. Replaces configured User permissions. */
    public String bootstrap(String subject,Set<String> grants)throws SQLException {
        if(subject==null||subject.isBlank()||subject.length()>128||AccountDirectory.validId(subject))throw new IllegalArgumentException("User subject required");
        var access=new TreeMap<String,Set<String>>();
        for(String g:grants) {
            if(Set.of(ADMIN,"quote.read","quote.acquire","quote.force").contains(g))continue;
            int colon=g.indexOf(':');
            if(colon<0||!Set.of("account.read","account.positions.read","account.artifacts.read","account.artifacts.write","account.positions.acquire").contains(g.substring(0,colon))||!AccountDirectory.validId(g.substring(colon+1)))
                throw new IllegalArgumentException("unsupported backend User permission");
            access.computeIfAbsent(g.substring(colon+1),k->new HashSet<>()).add(g.substring(0,colon));
        }
        try(var c=connect()) {
            c.setAutoCommit(false);
            try {
                String id=null;
                try(var q=c.prepareStatement("SELECT user_id FROM v2_user WHERE bootstrap_subject=? OR user_id=?")) {
                    q.setString(1,subject);q.setString(2,subject);try(var rs=q.executeQuery()){if(rs.next())id=rs.getString(1);}
                }
                if(id==null) {
                    if(subject.startsWith("usr_"))throw new IllegalArgumentException("unknown canonical User ID");
                    id="usr_"+UUID.randomUUID().toString().replace("-","");
                    try(var q=c.prepareStatement("INSERT INTO v2_user VALUES (?,?,?,0,0,0,0)")) {
                        q.setString(1,id);q.setString(2,subject);q.setString(3,subject);q.executeUpdate();
                    }
                }
                try(var q=c.prepareStatement("UPDATE v2_user SET administrator=?,quote_read=?,quote_acquire=?,quote_force=? WHERE user_id=?")) {
                    q.setBoolean(1,grants.contains(ADMIN));q.setBoolean(2,grants.contains("quote.read"));q.setBoolean(3,grants.contains("quote.acquire"));q.setBoolean(4,grants.contains("quote.force"));q.setString(5,id);q.executeUpdate();
                }
                try(var q=c.prepareStatement("DELETE FROM v2_user_account WHERE user_id=?")){q.setString(1,id);q.executeUpdate();}
                try(var q=c.prepareStatement("INSERT INTO v2_user_account (user_id,account_id,metadata_read,positions_read,artifacts_read,artifacts_write,positions_acquire) VALUES (?,?,?,?,?,?,?)")) {
                    for(var a:access.entrySet()) {
                        q.setString(1,id);q.setString(2,a.getKey());q.setBoolean(3,a.getValue().contains("account.read"));q.setBoolean(4,a.getValue().contains("account.positions.read"));
                        q.setBoolean(5,a.getValue().contains("account.artifacts.read"));q.setBoolean(6,a.getValue().contains("account.artifacts.write"));q.setBoolean(7,a.getValue().contains("account.positions.acquire"));q.executeUpdate();
                    }
                }
                c.commit();return id;
            }catch(Exception e){c.rollback();throw e;}
        }
    }
    public Optional<User> get(String id)throws SQLException {
        if(!validId(id))return Optional.empty();
        try(var c=connect();var q=c.prepareStatement("SELECT * FROM v2_user WHERE user_id=?")) {
            q.setString(1,id);try(var rs=q.executeQuery()) {
                if(!rs.next())return Optional.empty();
                var access=new ArrayList<AccountAccess>();
                try(var a=c.prepareStatement("SELECT * FROM v2_user_account WHERE user_id=? ORDER BY account_id")) {
                    a.setString(1,id);try(var rows=a.executeQuery()){while(rows.next())access.add(new AccountAccess(rows.getString("account_id"),rows.getBoolean("metadata_read"),rows.getBoolean("positions_read"),rows.getBoolean("artifacts_read"),rows.getBoolean("artifacts_write"),rows.getBoolean("positions_acquire")));}
                }
                return Optional.of(new User(id,rs.getString("display_name"),rs.getBoolean("administrator"),List.copyOf(access)));
            }
        }
    }
    public List<User> list()throws SQLException {
        var users=new ArrayList<User>();
        try(var c=connect();var q=c.prepareStatement("SELECT user_id FROM v2_user ORDER BY user_id");var rs=q.executeQuery()) {
            while(rs.next())users.add(get(rs.getString(1)).orElseThrow());
        }
        return List.copyOf(users);
    }
    public Optional<Set<String>> grants(String id)throws SQLException {
        try(var c=connect()) {
            c.setAutoCommit(false); // One committed authorization snapshot per authentication.
            var result=new HashSet<String>();
            try(var q=c.prepareStatement("SELECT * FROM v2_user WHERE user_id=?")) {
                q.setString(1,id);try(var rs=q.executeQuery()) {
                    if(!rs.next())return Optional.empty();
                    if(rs.getBoolean("administrator"))result.add(ADMIN);
                    if(rs.getBoolean("quote_read"))result.add("quote.read");
                    if(rs.getBoolean("quote_acquire"))result.add("quote.acquire");
                    if(rs.getBoolean("quote_force"))result.add("quote.force");
                }
            }
            try(var q=c.prepareStatement("SELECT * FROM v2_user_account WHERE user_id=?")) {
                q.setString(1,id);try(var rs=q.executeQuery()){while(rs.next()) {
                    String account=rs.getString("account_id");
                    if(rs.getBoolean("metadata_read"))result.add("account.read:"+account);
                    if(rs.getBoolean("positions_read"))result.add("account.positions.read:"+account);
                    if(rs.getBoolean("artifacts_read"))result.add("account.artifacts.read:"+account);
                    if(rs.getBoolean("artifacts_write"))result.add("account.artifacts.write:"+account);
                    if(rs.getBoolean("positions_acquire"))result.add("account.positions.acquire:"+account);
                }}
            }
            return Optional.of(Set.copyOf(result));
        }
    }
}
