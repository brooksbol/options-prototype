package com.wheelwright.evidence.v2;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.annotation.*;
import java.nio.file.*;
import java.util.*;
/** Test-only preview, actual retained DB COPY; no provider, scheduler or operational settings. */
public class CapitalHistoryPreview {
 static Path directory;
 static final String TOKEN=UUID.randomUUID().toString();
 @org.springframework.boot.test.context.TestConfiguration
 @EnableAutoConfiguration
 @Import({AccountsController.class,PositionsController.class,PortfolioCapitalController.class})
 static class Preview {
  @Bean(destroyMethod="close") SqliteEvidenceStore store() throws Exception {return new SqliteEvidenceStore(directory.resolve("preview.sqlite3").toString());}
  @Bean AccountDirectory accounts(SqliteEvidenceStore store) throws Exception {return new AccountDirectory(store,"");}
  @Bean UserDirectory users(SqliteEvidenceStore store,AccountDirectory accounts) throws Exception {return new UserDirectory(store,accounts);}
  @Bean BearerAuthenticator auth(UserDirectory users,AccountDirectory accounts) throws Exception {
   String pts=accounts.list().stream().filter(a->a.alias().equals("pts")).findFirst().orElseThrow().id();
   var user=users.list().stream().filter(u->u.accountAccess().stream().anyMatch(a->a.accountId().equals(pts)&&a.metadataRead()&&a.artifactsRead())).findFirst().orElseThrow();
   var grants=users.grants(user.id()).orElseThrow();
   // Bind an ephemeral preview credential to the same User and EXACT existing grants.
   return new BearerAuthenticator(users,TOKEN+"="+user.id()+":"+String.join("|",grants));
  }
  @Bean PositionReadService positions(SqliteEvidenceStore store,ObjectMapper mapper) throws Exception {return new PositionReadService(store,mapper);}
  @Bean BrokerageArtifacts artifacts(SqliteEvidenceStore store,ObjectMapper mapper,PositionReadService positions,AccountDirectory accounts) throws Exception {return new BrokerageArtifacts(store,mapper,positions,accounts);}
  @Bean PortfolioCapitalHistory capital(SqliteEvidenceStore store,BrokerageArtifacts artifacts) throws Exception {return new PortfolioCapitalHistory(store,artifacts);}
 }
 public static void main(String[] args) throws Exception {
  Path ready=Path.of(args[0]);directory=ready.getParent();
  var app=new SpringApplication(Preview.class);
  var context=(ServletWebServerApplicationContext)app.run("--server.address=127.0.0.1","--server.port=0","--spring.main.banner-mode=off","--logging.level.root=WARN","--spring.config.location=optional:file:"+directory.resolve("absent.properties"));
  new ObjectMapper().writeValue(ready.toFile(),Map.of("base","http://127.0.0.1:"+context.getWebServer().getPort(),"token",TOKEN,"fixture","actual-retained-copy"));
 }
}
