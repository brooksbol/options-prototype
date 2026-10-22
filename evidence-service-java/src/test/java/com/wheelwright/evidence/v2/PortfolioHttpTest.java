package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import java.nio.file.Path;
import java.net.*;
import java.net.http.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

/** Real loopback HTTP and persisted User grants; temp database, no operational app or provider. */
class PortfolioHttpTest {
 @TempDir Path directory;
 @Configuration(proxyBeanMethods=false) @EnableAutoConfiguration
 @Import({PortfolioController.class,PortfolioRepository.class,PortfolioReadService.class,PortfolioSources.class})
 static class Fixture {
  @Bean SqliteEvidenceStore store(@Value("${probe.database}")String path)throws Exception{return new SqliteEvidenceStore(path);}
  @Bean AccountDirectory accounts(SqliteEvidenceStore store)throws Exception{var a=new AccountDirectory(store.getConnection().getMetaData().getURL());a.bind("fixture","A1");a.bind("other","B1");return a;}
  @Bean UserDirectory users(SqliteEvidenceStore store,AccountDirectory accounts)throws Exception{return new UserDirectory(store,accounts);}
  @Bean BearerAuthenticator auth(UserDirectory users,AccountDirectory accounts)throws Exception{String a=accounts.list().stream().filter(x->x.brokerAssociation().accountNumber().equals("A1")).findFirst().orElseThrow().id(),b=accounts.list().stream().filter(x->x.brokerAssociation().accountNumber().equals("B1")).findFirst().orElseThrow().id();return new BearerAuthenticator(users,"a=first:account.positions.read:"+a+"|account.holdings.read:"+a+"|account.positions.audit.read:"+a+"|reference.read|market.read,b=second:account.positions.read:"+b+"|account.holdings.read:"+b+",posonly=reader:account.positions.read:"+a+",bare=bare:quote.read");}
 }
 HttpResponse<String> get(ServletWebServerApplicationContext c,String path,String token)throws Exception{return HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+c.getWebServer().getPort()+path)).header("Authorization","Bearer "+token).GET().build(),HttpResponse.BodyHandlers.ofString());}
 @Test void actualServerProtectsDirectCollectionHistoryAndSnapshotReads()throws Exception{
  var app=new SpringApplication(Fixture.class);app.setDefaultProperties(Map.of("server.address","127.0.0.1","server.port","0","probe.database",directory.resolve("temp.sqlite3").toString(),"spring.main.banner-mode","off","logging.level.root","ERROR","spring.config.location","optional:file:"+directory.resolve("absent.properties")));
  try(var c=(ServletWebServerApplicationContext)app.run()){
   var db=c.getBean(SqliteEvidenceStore.class);var accounts=c.getBean(AccountDirectory.class);String account=accounts.list().stream().filter(a->a.brokerAssociation().accountNumber().equals("A1")).findFirst().orElseThrow().id();var mapper=c.getBean(ObjectMapper.class);var positions=new PositionReadService(db,mapper);var artifacts=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),mapper,positions);artifacts.ingest(account,"source.csv","POSITIONS",PositionsTest.csv(PositionsTest.BODY,"Oct-05-2026").getBytes(java.nio.charset.StandardCharsets.UTF_8),UUID.randomUUID().toString());
   var response=get(c,"/v2/positions?projection=expanded","a");assertThat(response.statusCode()).as(response.body()).isEqualTo(200);assertThat(response.headers().firstValue("Cache-Control")).contains("private, no-store");var p=mapper.readTree(response.body()).path("items").get(0);String uri=p.at("/self/href").asText();assertThat(get(c,uri,"b").statusCode()).isEqualTo(404);assertThat(get(c,"/v2/positions?accountId="+account,"b").statusCode()).isEqualTo(403);assertThat(get(c,"/v2/positions","bare").body()).doesNotContain(p.path("id").asText());
   var catalog=get(c,"/v2/holdings?view=observations","a");assertThat(catalog.statusCode()).isEqualTo(200);String selected=mapper.readTree(catalog.body()).path("items").get(0).at("/holdings/href").asText();assertThat(get(c,selected,"a").statusCode()).isEqualTo(200);assertThat(get(c,selected,"b").statusCode()).isEqualTo(403);var audit=get(c,uri+"/audit?projection=expanded","a");assertThat(audit.statusCode()).as(audit.body()).isEqualTo(200);assertThat(mapper.readTree(audit.body()).path("items").size()).isEqualTo(1);String auditUri=mapper.readTree(audit.body()).path("items").get(0).at("/self/href").asText();assertThat(get(c,auditUri,"b").statusCode()).isEqualTo(404);
   var deniedReconciliation=get(c,"/v2/accounts/"+account+"/inventory-reconciliation","posonly");assertThat(deniedReconciliation.statusCode()).isEqualTo(403);assertThat(deniedReconciliation.body()).doesNotContain("balances","residual","/v2/holdings/");assertThat(get(c,"/v2/accounts/"+account+"/inventory-reconciliation","a").statusCode()).isEqualTo(200);
   assertThat(get(c,"/v2/positions?projection=expanded&include=currentConstruction,holdingSummaries","a").statusCode()).isEqualTo(200);assertThat(get(c,"/v2/positions?projection=summary&limit=0","a").statusCode()).isEqualTo(422);assertThat(get(c,"/v2/orders","no-such-token").statusCode()).isEqualTo(401);
  }
 }
}
