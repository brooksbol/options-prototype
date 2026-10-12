package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.Path;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class AccountsTest {
    @TempDir Path temp;
    @Test void legacyMigrationPreservesBytesHistorySnapshotsAndHoldingIdentity()throws Exception {
        String path=temp.resolve("legacy.sqlite3").toString();var mapper=new ObjectMapper();String artifactId,holdingId;
        try(var store=new SqliteEvidenceStore(path)) {
            var accounts=new AccountDirectory(store.getConnection().getMetaData().getURL());String id=accounts.bind("pts","A1");
            var positions=new PositionReadService(store,mapper);
            var artifacts=new BrokerageArtifacts(store.getConnection().getMetaData().getURL(),mapper,positions);
            var source=PositionsTest.csv(PositionsTest.BODY,"Oct-05-2026");
            artifactId=artifacts.ingest(id,"positions.csv","POSITIONS",source.getBytes(java.nio.charset.StandardCharsets.UTF_8),"request").artifactId();
            try(var q=store.getConnection().createStatement()){q.execute("DELETE FROM account_position_snapshot");}
            var legacy=FidelityPositions.parse(id,"A1","positions.csv",source,PositionsTest.NOW.plusSeconds(1).toString(),List.of(),"pts");
            holdingId=legacy.holdings().getFirst().holdingId();positions.admit(legacy);
            artifacts.ingest(id,"History_for_Account_A1.csv","ACTIVITY","Run Date,Action,Symbol,Amount ($)\n10/05/2026,YOU BOUGHT,SPY,-100\n".getBytes(java.nio.charset.StandardCharsets.UTF_8),"request");
            var c=store.getConnection();c.setAutoCommit(false);
            try(var q=c.createStatement()) {
                q.execute("PRAGMA defer_foreign_keys=ON");
                q.execute("DROP TABLE v2_user_account");
                q.execute("DROP TABLE v2_user");
                q.execute("DELETE FROM _migrations WHERE id='017_user_account_authority.sql'");
                q.execute("DELETE FROM _migrations WHERE id='018_broker_scoped_accounts.sql'");
                q.execute("DROP TABLE brokerage_account");
                q.execute("CREATE TABLE brokerage_account(account TEXT PRIMARY KEY,broker_account TEXT NOT NULL UNIQUE)");
                q.execute("INSERT INTO brokerage_account VALUES ('pts','A1')");
                for(String table:List.of("brokerage_artifact","brokerage_import","brokerage_evidence_row","brokerage_ledger_observation","account_position_snapshot"))q.execute("UPDATE "+table+" SET account='pts'");
                q.execute("UPDATE account_position_snapshot SET payload_json=json_set(payload_json,'$.account','pts')");
                q.execute("DROP INDEX brokerage_artifact_global_identity");
                q.execute("DELETE FROM _migrations WHERE id='016_canonical_account_identity.sql'");
            }
            c.commit();c.setAutoCommit(true);
        }
        try(var store=new SqliteEvidenceStore(path)) {
            var accounts=new AccountDirectory(store.getConnection().getMetaData().getURL());String id=accounts.list().getFirst().id();
            assertThat(id).matches("acct_[a-f0-9]{32}");
            var positions=new PositionReadService(store,mapper);var artifacts=new BrokerageArtifacts(store.getConnection().getMetaData().getURL(),mapper,positions);
            assertThat(artifacts.owner(artifactId)).contains(id);assertThat(artifacts.inventory(id,"request").artifacts()).hasSize(2);
            assertThat(positions.read(id,"request",PositionsTest.NOW).orElseThrow().accountId()).isEqualTo(id);
            assertThat(positions.read(id,"request",PositionsTest.NOW).orElseThrow().positions().getFirst().constituents().getFirst().holding().holdingId()).isEqualTo(holdingId);
            artifacts.retry(id,artifactId,null,null,"request");
            assertThat(positions.read(id,"request",PositionsTest.NOW).orElseThrow().positions().getFirst().constituents().getFirst().holding().holdingId()).isEqualTo(holdingId);
            try(var q=store.getConnection().createStatement();var rows=q.executeQuery("SELECT COUNT(*) FROM brokerage_ledger_observation")){assertThat(rows.getInt(1)).isEqualTo(1);}
            try(var q=store.getConnection().createStatement();var rows=q.executeQuery("PRAGMA foreign_key_check")){assertThat(rows.next()).isFalse();}
        }
    }
    @Test void generatedIdentityRenameRestartAuthorizationAndIndependentResources()throws Exception {
        String path=temp.resolve("accounts.sqlite3").toString(),id,artifactId,positionId;
        var mapper=new ObjectMapper();
        try(var store=new SqliteEvidenceStore(path)) {
            var accounts=new AccountDirectory(store.getConnection().getMetaData().getURL());
            id=accounts.bind("pts","A1");String other=accounts.bind("sawdust","B2");
            assertThat(id).matches("acct_[a-f0-9]{32}").doesNotContain("pts","A1");
            assertThat(accounts.bind("pts","A1")).isEqualTo(id);
            assertThatThrownBy(()->accounts.bind("pts","OTHER")).isInstanceOf(IllegalArgumentException.class);
            var positions=new PositionReadService(store,mapper);
            var artifacts=new BrokerageArtifacts(store.getConnection().getMetaData().getURL(),mapper,positions);
            var admitted=artifacts.ingest(id,"positions.csv","POSITIONS",PositionsTest.csv(PositionsTest.BODY,"Oct-05-2026").getBytes(java.nio.charset.StandardCharsets.UTF_8),"request");
            artifactId=admitted.artifactId();positionId=positions.read(id,"request",PositionsTest.NOW).orElseThrow().positions().getFirst().positionId();
            artifacts.ingest(other,"other.csv","POSITIONS",PositionsTest.csv(PositionsTest.BODY,"Oct-05-2026").getBytes(java.nio.charset.StandardCharsets.UTF_8),"request");
            var auth=TestAuthentication.auth("owner=user:account.read:"+id+"|account.positions.read:"+id+"|account.artifacts.read:"+id+",none=no-access:quote.read,alias=alias-user");
            var mvc=MockMvcBuilders.standaloneSetup(new AccountsController(accounts,auth,mapper),new PositionsController(accounts,positions,auth,mapper),new ArtifactsController(artifacts,auth,mapper)).build();
            var inventory=mvc.perform(get("/v2/accounts").header("Authorization","Bearer owner")).andReturn().getResponse();
            var json=mapper.readTree(inventory.getContentAsString());
            assertThat(json.path("accounts")).hasSize(1);assertThat(json.path("accounts").get(0).path("id").asText()).isEqualTo(id);
            assertThat(mvc.perform(get("/v2/accounts/"+id).header("Authorization","Bearer none")).andReturn().getResponse().getStatus()).isEqualTo(403);
            assertThat(mvc.perform(get("/v2/accounts/pts").header("Authorization","Bearer alias")).andReturn().getResponse().getStatus()).isEqualTo(403);
            assertThat(mvc.perform(get("/v2/positions?accountId=pts").header("Authorization","Bearer alias")).andReturn().getResponse().getStatus()).isEqualTo(403);
            assertThat(mvc.perform(get("/v2/artifacts?accountId=pts").header("Authorization","Bearer alias")).andReturn().getResponse().getStatus()).isEqualTo(422);
            assertThat(mvc.perform(get("/v2/accounts/pts/positions").header("Authorization","Bearer owner")).andReturn().getResponse().getStatus()).isEqualTo(404);
            for(String route:List.of("/v2/positions?accountId="+other,"/v2/artifacts?accountId="+other,"/v2/artifacts/"+artifactId))
                assertThat(mvc.perform(get(route).header("Authorization","Bearer none")).andReturn().getResponse().getStatus()).isEqualTo(403);
            var unfiltered=mvc.perform(get("/v2/artifacts").header("Authorization","Bearer owner")).andReturn().getResponse();
            assertThat(mapper.readTree(unfiltered.getContentAsString()).path("artifacts")).hasSize(1);
            var authorized=mvc.perform(get("/v2/positions").header("Authorization","Bearer owner")).andReturn().getResponse();
            assertThat(mapper.readTree(authorized.getContentAsString()).path("snapshots")).hasSize(1);
            assertThat(mapper.readTree(authorized.getContentAsString()).path("snapshots").get(0).path("accountId").asText()).isEqualTo(id);
            var empty=mvc.perform(get("/v2/positions").header("Authorization","Bearer none")).andReturn().getResponse();
            assertThat(mapper.readTree(empty.getContentAsString()).path("snapshots")).isEmpty();
            accounts.rename(id,"treasury","Personal Treasury");
            assertThat(accounts.get(id).orElseThrow().alias()).isEqualTo("treasury");
            assertThat(artifacts.owner(artifactId)).contains(id);
            assertThat(mvc.perform(get("/v2/artifacts/"+artifactId).header("Authorization","Bearer owner")).andReturn().getResponse().getStatus()).isEqualTo(200);
            assertThat(positions.read(id,"request",PositionsTest.NOW).orElseThrow().positions().getFirst().positionId()).isEqualTo(positionId);
            var retry=artifacts.retry(id,artifactId,null,null,"request");assertThat(retry.status()).isEqualTo("ACCEPTED");
            assertThat(positions.read(id,"request",PositionsTest.NOW).orElseThrow().positions().getFirst().positionId()).isEqualTo(positionId);
        }
        try(var store=new SqliteEvidenceStore(path)) {
            var accounts=new AccountDirectory(store.getConnection().getMetaData().getURL());
            assertThat(accounts.get(id).orElseThrow().alias()).isEqualTo("treasury");
            assertThat(accounts.bind("treasury","A1")).isEqualTo(id);
            assertThat(accounts.bind("pts","A1")).isEqualTo(id);
            assertThat(accounts.get(id).orElseThrow().alias()).isEqualTo("treasury");
            var positions=new PositionReadService(store,mapper);
            assertThat(positions.read(id,"request",PositionsTest.NOW).orElseThrow().positions().getFirst().positionId()).isEqualTo(positionId);
        }
    }
}
