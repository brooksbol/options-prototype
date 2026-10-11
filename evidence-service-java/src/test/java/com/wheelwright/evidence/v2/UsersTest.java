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

class UsersTest {
    @TempDir Path temp;
    @Test void userIdentityManyToManyAndExplicitAdministratorBoundary()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("users.sqlite3").toString())) {
            var mapper=new ObjectMapper();String url=store.getConnection().getMetaData().getURL();
            var accounts=new AccountDirectory(url);String pts=accounts.bind("pts","A1"),sawdust=accounts.bind("sawdust","B2");
            var users=new UserDirectory(url);
            String first="account.read:"+pts+"|account.positions.read:"+pts+"|account.artifacts.read:"+pts+"|account.read:"+sawdust+"|account.positions.read:"+sawdust;
            var auth=new BearerAuthenticator(users,"alpha=first:"+first+",rotation=first:quote.read,beta=second:account.read:"+pts+"|account.positions.read:"+pts+",denied=admin,root=operator:users.admin");
            String one=auth.authenticate("Bearer alpha").orElseThrow().userId(),two=auth.authenticate("Bearer beta").orElseThrow().userId();
            assertThat(one).matches("usr_[a-f0-9]{32}").isNotEqualTo(pts).isNotEqualTo(sawdust).isNotEqualTo(two);
            assertThat(auth.authenticate("Bearer "+one)).isEmpty();
            assertThat(auth.authenticate("Bearer "+pts)).isEmpty();
            assertThat(auth.authenticate("Bearer rotation").orElseThrow()).isEqualTo(auth.authenticate("Bearer alpha").orElseThrow());
            assertThat(users.get(one).orElseThrow().accountAccess()).hasSize(2);
            assertThat(users.get(two).orElseThrow().accountAccess()).hasSize(1);
            var positions=new PositionReadService(store,mapper);var artifacts=new BrokerageArtifacts(url,mapper,positions);
            byte[] source=PositionsTest.csv(PositionsTest.BODY,"Oct-05-2026").getBytes(java.nio.charset.StandardCharsets.UTF_8);
            artifacts.ingest(pts,"positions.csv","POSITIONS",source,"request");artifacts.ingest(sawdust,"positions.csv","POSITIONS",source,"request");
            var mvc=MockMvcBuilders.standaloneSetup(new UsersController(users,auth,mapper),new AccountsController(accounts,auth,mapper),new PositionsController(accounts,positions,auth,mapper),new ArtifactsController(artifacts,auth,mapper)).build();
            for(String path:List.of("/v2/me","/v2/users","/v2/users/"+one))assertThat(mvc.perform(get(path)).andReturn().getResponse().getStatus()).isEqualTo(401);
            for(String path:List.of("/v2/users","/v2/users/"+one,"/v2/users/"+two)) {
                assertThat(mvc.perform(get(path).header("Authorization","Bearer alpha").header("X-Admin","true")).andReturn().getResponse().getStatus()).isEqualTo(403);
                assertThat(mvc.perform(get(path).header("Authorization","Bearer denied")).andReturn().getResponse().getStatus()).isEqualTo(403);
                assertThat(mvc.perform(get(path).header("Authorization","Bearer root")).andReturn().getResponse().getStatus()).isEqualTo(200);
            }
            var me=mvc.perform(get("/v2/me").header("Authorization","Bearer alpha").header("X-User-Id",two)).andReturn().getResponse();
            assertThat(mapper.readTree(me.getContentAsString()).path("user").path("id").asText()).isEqualTo(one);
            assertThat(me.getHeader("Cache-Control")).isEqualTo("private, no-store");assertThat(me.getHeader("X-Request-Id")).isNotBlank();
            assertThat(mvc.perform(get("/v2/me?userId="+two).header("Authorization","Bearer alpha")).andReturn().getResponse().getStatus()).isEqualTo(422);
            assertThat(mvc.perform(get("/v2/users/first").header("Authorization","Bearer root")).andReturn().getResponse().getStatus()).isEqualTo(422);
            for(String token:List.of("alpha","beta"))assertThat(mvc.perform(get("/v2/positions?accountId="+pts).header("Authorization","Bearer "+token)).andReturn().getResponse().getStatus()).isEqualTo(200);
            assertThat(mvc.perform(get("/v2/positions?accountId="+sawdust).header("Authorization","Bearer beta")).andReturn().getResponse().getStatus()).isEqualTo(403);
            var scoped=mvc.perform(get("/v2/positions").header("Authorization","Bearer beta")).andReturn().getResponse();
            assertThat(mapper.readTree(scoped.getContentAsString()).path("snapshots")).hasSize(1);
            var adminAccounts=mvc.perform(get("/v2/accounts").header("Authorization","Bearer root")).andReturn().getResponse();
            assertThat(mapper.readTree(adminAccounts.getContentAsString()).path("accounts")).isEmpty();
            var all=mvc.perform(get("/v2/users").header("Authorization","Bearer root")).andReturn().getResponse();
            assertThat(mapper.readTree(all.getContentAsString()).path("users")).hasSize(4);
            assertThat(all.getContentAsString()).doesNotContain("bootstrap_subject","Bearer","credential","alpha","rotation");
            accounts.rename(pts,"treasury","Treasury");assertThat(auth.authenticate("Bearer alpha").orElseThrow().userId()).isEqualTo(one);
            users.bootstrap(one,Set.of());
            assertThat(mvc.perform(get("/v2/positions?accountId="+pts).header("Authorization","Bearer rotation")).andReturn().getResponse().getStatus()).isEqualTo(403);
            String admin=auth.authenticate("Bearer root").orElseThrow().userId();users.bootstrap(admin,Set.of());
            assertThat(mvc.perform(get("/v2/users").header("Authorization","Bearer root")).andReturn().getResponse().getStatus()).isEqualTo(403);
        }
    }
    @Test void identitySurvivesRestartRotationAndFailClosedConfiguration()throws Exception {
        String path=temp.resolve("restart.sqlite3").toString(),userId;
        try(var store=new SqliteEvidenceStore(path)) {
            var users=new UserDirectory(store.getConnection().getMetaData().getURL());
            var auth=new BearerAuthenticator(users,"old=bootstrap:quote.read");userId=auth.authenticate("Bearer old").orElseThrow().userId();
            assertThatThrownBy(()->users.bootstrap("other",Set.of("account.read:pts"))).isInstanceOf(IllegalArgumentException.class);
            assertThatThrownBy(()->users.bootstrap("acct_"+"a".repeat(32),Set.of())).isInstanceOf(IllegalArgumentException.class);
            assertThatThrownBy(()->users.bootstrap(userId,Set.of("account.read:acct_"+"b".repeat(32)))).isInstanceOf(java.sql.SQLException.class);
            assertThat(auth.authenticate("Bearer old").orElseThrow().hasGrant("quote.read")).isTrue();
            assertThatThrownBy(()->new BearerAuthenticator(users,"same=one,same=two")).isInstanceOf(IllegalArgumentException.class);
        }
        try(var store=new SqliteEvidenceStore(path)) {
            var users=new UserDirectory(store.getConnection().getMetaData().getURL());
            var rotated=new BearerAuthenticator(users,"new="+userId+":quote.read");
            assertThat(rotated.authenticate("Bearer new").orElseThrow().userId()).isEqualTo(userId);
            assertThat(rotated.authenticate("Bearer old")).isEmpty();
            var registered=new BearerAuthenticator(users,"again=bootstrap:quote.read");
            assertThat(registered.authenticate("Bearer again").orElseThrow().userId()).isEqualTo(userId);
            try(var q=store.getConnection().createStatement()){q.execute("DROP TABLE v2_user_account");}
            assertThat(registered.authenticate("Bearer again")).isEmpty();
        }
    }
}
