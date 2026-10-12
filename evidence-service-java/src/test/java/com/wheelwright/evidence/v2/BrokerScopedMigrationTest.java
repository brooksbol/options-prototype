package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.db.DatabaseManager;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class BrokerScopedMigrationTest {
    @TempDir Path temp;
    static final String ACCOUNT="acct_"+"a".repeat(32), USER="usr_"+"b".repeat(32);
    static final List<String> TABLES=List.of("brokerage_account","v2_user","v2_user_account","brokerage_artifact","brokerage_import","brokerage_evidence_row","brokerage_ledger_observation","account_position_snapshot");
    void legacy(Path path) throws Exception {
        try(var c=DriverManager.getConnection("jdbc:sqlite:"+path);var q=c.createStatement()) {
            q.execute("PRAGMA foreign_keys=ON");
            q.execute("CREATE TABLE _migrations(id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
            // Use the real Account/grant schemas as they existed immediately before 018.
            for(String name:List.of("015_account_position_snapshot.sql","016_canonical_account_identity.sql","017_user_account_authority.sql")) {
                String sql=Files.readString(Path.of("src/main/resources/db/migrations",name));
                sql=String.join("\n",sql.lines().filter(line->!line.stripLeading().startsWith("--")).toList());
                for(String statement:sql.split(";"))if(!statement.isBlank())q.execute(statement);
            }
            try(var files=Files.list(Path.of("src/main/resources/db/migrations"))) {
                for(var file:files.filter(p->p.getFileName().toString().compareTo("018_")<0).toList())
                    q.execute("INSERT INTO _migrations VALUES ('"+file.getFileName()+"','before')");
            }
            q.execute("INSERT INTO brokerage_account VALUES ('"+ACCOUNT+"','pts','Personal Treasury','000A1','legacy-namespace')");
            q.execute("INSERT INTO v2_user VALUES ('"+USER+"','operator','Operator',0,1,0,0)");
            q.execute("INSERT INTO v2_user_account VALUES ('"+USER+"','"+ACCOUNT+"',1,1,1,1)");
            q.execute("INSERT INTO brokerage_artifact VALUES ('"+ACCOUNT+"','artifact','hash','text/csv',3,x'efbbbf','before')");
            q.execute("INSERT INTO brokerage_import VALUES ('"+ACCOUNT+"','import','artifact','original.csv','POSITIONS','before','ACCEPTED','preserved')");
            q.execute("INSERT INTO brokerage_evidence_row VALUES ('"+ACCOUNT+"','artifact',1,'POSITIONS','{}')");
            q.execute("INSERT INTO brokerage_ledger_observation VALUES ('"+ACCOUNT+"','row',1,'artifact','{}')");
            q.execute("INSERT INTO account_position_snapshot VALUES ('"+ACCOUNT+"','snapshot','2026-10-11','before','{\"holdingId\":\"unchanged\"}')");
        }
    }
    Map<String,List<List<String>>> contents(Connection c) throws Exception {
        var result=new TreeMap<String,List<List<String>>>();
        for(String table:TABLES) {
            String columns=table.equals("brokerage_account") ? "account_id,alias,display_name,broker_account,identity_namespace" : "*";
            var rows=new ArrayList<List<String>>();
            try(var q=c.createStatement();var rs=q.executeQuery("SELECT "+columns+" FROM "+table+" ORDER BY 1,2")) {
                while(rs.next()) {
                    var values=new ArrayList<String>();
                    for(int i=1;i<=rs.getMetaData().getColumnCount();i++)values.add(HexFormat.of().formatHex(rs.getBytes(i)));
                    rows.add(values);
                }
            }
            result.put(table,rows);
        }
        return result;
    }
    @Test void migrationPreservesEveryAccountGrantEvidenceAndSnapshotValueAndForeignKey() throws Exception {
        var path=temp.resolve("migration.sqlite3");legacy(path);
        Map<String,List<List<String>>> before;
        try(var c=DriverManager.getConnection("jdbc:sqlite:"+path)){before=contents(c);}
        try(var c=DatabaseManager.open(path.toString())) {
            assertThat(contents(c)).isEqualTo(before);
            try(var q=c.createStatement();var rs=q.executeQuery("SELECT broker FROM brokerage_account")){assertThat(rs.getString(1)).isEqualTo("FIDELITY");}
            try(var q=c.createStatement();var rs=q.executeQuery("PRAGMA foreign_key_check")){assertThat(rs.next()).isFalse();}
            var directory=new AccountDirectory(c.getMetaData().getURL());
            assertThat(directory.bind("tt1","TASTYTRADE","000A1")).isNotEqualTo(ACCOUNT);
            assertThat(directory.identityNamespace(ACCOUNT)).isEqualTo("legacy-namespace");
            try(var q=c.createStatement();var rs=q.executeQuery("PRAGMA foreign_key_list(v2_user_account)")) {
                var parents=new HashSet<String>();while(rs.next())parents.add(rs.getString("table"));
                assertThat(parents).containsExactlyInAnyOrder("v2_user","brokerage_account");
            }
        }
        try(var c=DatabaseManager.open(path.toString());var q=c.createStatement();var rs=q.executeQuery("SELECT count(*) FROM _migrations WHERE id='018_broker_scoped_accounts.sql'")) {
            assertThat(rs.getInt(1)).isEqualTo(1);
        }
    }
    @Test void failureAfterGrantTableDropRollsBackAllRowsAndMigrationTracking() throws Exception {
        var path=temp.resolve("rollback.sqlite3");legacy(path);
        Map<String,List<List<String>>> before;
        try(var c=DriverManager.getConnection("jdbc:sqlite:"+path);var q=c.createStatement()) {
            before=contents(c);q.execute("CREATE TABLE brokerage_account_step3(injected_failure TEXT)");
        }
        assertThatThrownBy(()->{try(var ignored=DatabaseManager.open(path.toString())){}}).isInstanceOf(SQLException.class);
        try(var c=DriverManager.getConnection("jdbc:sqlite:"+path);var q=c.createStatement()) {
            assertThat(contents(c)).isEqualTo(before);
            try(var rs=q.executeQuery("SELECT count(*) FROM _migrations WHERE id='018_broker_scoped_accounts.sql'")){assertThat(rs.getInt(1)).isZero();}
            try(var rs=q.executeQuery("PRAGMA foreign_key_check")){assertThat(rs.next()).isFalse();}
            q.execute("DROP TABLE brokerage_account_step3");
        }
        try(var c=DatabaseManager.open(path.toString())){assertThat(contents(c)).isEqualTo(before);}
    }
}
