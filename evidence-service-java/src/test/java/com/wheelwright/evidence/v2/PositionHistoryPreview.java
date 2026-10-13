package com.wheelwright.evidence.v2;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.annotation.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
/** Test-only retained-state preview: no provider beans, operational configuration or operational database. */
public class PositionHistoryPreview {
 static Path directory;
 static final String TOKEN=UUID.randomUUID().toString();
 @org.springframework.boot.test.context.TestConfiguration
 @EnableAutoConfiguration
 @Import({AccountsController.class,PositionsController.class})
 static class Preview {
  @Bean(destroyMethod="close") SqliteEvidenceStore store() throws Exception {return new SqliteEvidenceStore(directory.resolve("preview.sqlite3").toString());}
  @Bean AccountDirectory accounts(SqliteEvidenceStore store) throws Exception {var a=new AccountDirectory(store,"");a.bind("pts","SYNTHETIC01");return a;}
  @Bean UserDirectory users(SqliteEvidenceStore store,AccountDirectory accounts) throws Exception {return new UserDirectory(store,accounts);}
  @Bean BearerAuthenticator auth(UserDirectory users,AccountDirectory accounts) throws Exception {String id=accounts.list().getFirst().id();return new BearerAuthenticator(users,TOKEN+"=history-preview:account.read:"+id+"|account.positions.read:"+id);}
  @Bean PositionReadService positions(SqliteEvidenceStore store,ObjectMapper mapper) throws Exception {return new PositionReadService(store,mapper);}
 }
 public static void main(String[] args) throws Exception {
  Path ready=Path.of(args[0]);directory=ready.getParent();
  var app=new SpringApplication(Preview.class);
  var context=(ServletWebServerApplicationContext)app.run("--server.address=127.0.0.1","--server.port=0","--spring.main.banner-mode=off","--logging.level.root=WARN","--spring.config.location=optional:file:"+directory.resolve("absent.properties"));
  var accounts=context.getBean(AccountDirectory.class);String account=accounts.list().getFirst().id();
  var artifacts=new BrokerageArtifacts(context.getBean(SqliteEvidenceStore.class),context.getBean(ObjectMapper.class),context.getBean(PositionReadService.class),accounts);
  for(boolean later:List.of(false,true)) {
   String body="SYNTHETIC01,Synthetic PTS,ETFs,ETHA,Shares,"+(later?"66":"200.123456789012")+",100,--,Cash\n"+
    "SYNTHETIC01,Synthetic PTS,Options,-SPY261016P550,Put,"+(later?"-1":"-2")+",-100,--,Cash\n"+
    (later?"SYNTHETIC01,Synthetic PTS,Options,-ETHA1261016C20.5,Adjusted root,-2,-10,--,Cash\n":"SYNTHETIC01,Synthetic PTS,Options,-ARKK261009P90,Put,-1,-10,--,Cash\n");
   var csv=PositionsTest.csv(body,later?"Oct-11-2026":"Sep-28-2026");
   var result=artifacts.ingest(account,later?"synthetic-later.csv":"synthetic-earlier.csv","POSITIONS",csv.getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());
   if(!result.status().equals("ACCEPTED"))throw new IllegalStateException("synthetic admission failed");
  }
  new ObjectMapper().writeValue(ready.toFile(),Map.of("base","http://127.0.0.1:"+context.getWebServer().getPort(),"token",TOKEN,"accountId",account,"fixture","synthetic-history-v1"));
 }
}
