package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.annotation.*;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.sql.*;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.util.*;

/** Explicit Principal-authorized real retained-data preview. No provider/worker/acquisition beans.
 * Original stores stay mode=ro; existing projections may materialize only in a private backup.
 * Authentication resolves to the already authenticated operational User and LIVE original grants. */
public final class TalkRetainedPreview {
 static Path directory, accountSource;
 static String userId, token; static boolean recovery;
 static String ro(Path path){return "jdbc:sqlite:file:"+path.toAbsolutePath()+"?mode=ro";}
 static void backup(Path from,Path to)throws Exception {
  try(var c=DriverManager.getConnection(ro(from))){
   if(((org.sqlite.SQLiteConnection)c).getDatabase().backup("main",to.toString(),null)!=0)throw new SQLException("private backup unavailable");
  }
  Files.setPosixFilePermissions(to,PosixFilePermissions.fromString("rw-------"));
 }
 @TestConfiguration @EnableAutoConfiguration
 @Import({AccountsController.class,AccountBalancesController.class,PortfolioController.class,PortfolioTacticalInventory.class,TacticalInventoryController.class})
 static class Preview {
  @Bean(destroyMethod="close") SqliteEvidenceStore accountStore()throws Exception {
   var copy=directory.resolve("account-snapshot.sqlite3");String retained=System.getenv("WW_VERIFY_REFERENCE_COPY");var input=retained==null?accountSource:Path.of(retained).toRealPath();if(retained!=null&&!"PRINCIPAL_APPROVED_FIDELITY_PUBLIC_REFERENCE_READS_20261029".equals(System.getenv("WW_VERIFY_PUBLIC_REFERENCE_POLICY")))throw new IllegalArgumentException("approved public reference copy required");if(retained!=null&&(Files.isSameFile(input,accountSource)||!Files.getPosixFilePermissions(input).equals(PosixFilePermissions.fromString("rw-------"))))throw new IllegalArgumentException("isolated reference copy required");backup(input,copy);return new SqliteEvidenceStore(copy.toString());
  }
  @Bean AccountDirectory accounts(){return new AccountDirectory(ro(accountSource));}
  @Bean BearerAuthenticator auth()throws Exception {return BearerAuthenticator.existingUser(new UserDirectory(ro(accountSource)),token,userId);}
  @Bean BrokerageArtifacts artifacts(ObjectMapper mapper,SqliteEvidenceStore accountStore,AccountDirectory accounts)throws Exception{return recovery?new BrokerageArtifacts(accountStore,mapper,new PositionReadService(accountStore,mapper),accounts):new BrokerageArtifacts(ro(accountSource),mapper,new PositionReadService(ro(accountSource),mapper));}
  @Bean AccountBalanceObservations balances(BrokerageArtifacts artifacts,AccountDirectory accounts,SqliteEvidenceStore accountStore)throws Exception{return recovery?new AccountBalanceObservations(accountStore,artifacts,accounts):new AccountBalanceObservations(ro(accountSource),artifacts,accounts);}
  @Bean @org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name="wheelwright.recovery",havingValue="true") TastytradeClient recoveryClient(){return new TastytradeClient(System.getenv("TASTYTRADE_CLIENT_ID"),System.getenv("TASTYTRADE_CLIENT_SECRET"),System.getenv("TASTYTRADE_REFRESH_TOKEN"));}
  @Bean @org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name="wheelwright.recovery",havingValue="true") PositionAcquisition recoveryBalance(SqliteEvidenceStore accountStore,AccountDirectory accounts,ObjectMapper mapper,TastytradeClient client)throws Exception{return new PositionAcquisition(accountStore,accounts,new PositionReadService(accountStore,mapper),client);}
  @Bean PortfolioPublicMarket publicMarket(){return new PortfolioPublicMarket(recovery?"http://127.0.0.1:3100":"");}
  @Bean PortfolioRepository repository(SqliteEvidenceStore accountStore,ObjectMapper mapper)throws Exception{return new PortfolioRepository(accountStore,mapper);}
  @Bean PortfolioSources sources(PortfolioRepository repo,ObjectMapper mapper,AccountDirectory accounts){return new PortfolioSources(repo,mapper,accounts);}
  @Bean PortfolioReadService portfolio(PortfolioRepository repo,PortfolioSources sources){return new PortfolioReadService(repo,sources);}

 }

 public static void main(String[] args)throws Exception {
  if(args.length!=3||!"AUTHORIZED_REAL_RETAINED_READS".equals(System.getenv("WW_TALK_DISCLOSURE_PROFILE")))throw new IllegalStateException("explicit disclosure profile required");
  recovery="PRINCIPAL_AUTHORIZED_ARCHITECTURAL_RECOVERY_20261102".equals(System.getenv("WW_ARCHITECTURAL_RECOVERY"));
  directory=Path.of(args[0]).toAbsolutePath();accountSource=Path.of(args[1]).toAbsolutePath();
  Files.createDirectories(directory,PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
  String existing=System.getenv("WW_API_TOKEN");if(existing==null||existing.isBlank())throw new IllegalStateException("existing credential required");
  // Established operational identity, no credential values or financial payload printed.
  var response=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build().send(
   HttpRequest.newBuilder(URI.create((recovery?"http://127.0.0.1:3101":"http://127.0.0.1:55834")+"/v2/me")).timeout(Duration.ofSeconds(5)).header("Authorization","Bearer "+existing).GET().build(),HttpResponse.BodyHandlers.ofString());
  if(response.statusCode()!=200)throw new IllegalStateException("existing identity unavailable");
  var me=new ObjectMapper().readTree(response.body());userId=me.at("/user/id").asText(me.path("id").asText());
  if(new UserDirectory(ro(accountSource)).get(userId).isEmpty())throw new IllegalStateException("source identity mismatch");
  token=recovery?existing:UUID.randomUUID().toString();
  var app=new SpringApplication(Preview.class);app.setDefaultProperties(Map.of("server.port","0","server.address","127.0.0.1","spring.main.banner-mode","off","logging.level.root","ERROR","wheelwright.recovery",Boolean.toString(recovery)));
  var context=(ServletWebServerApplicationContext)app.run();
  boolean providers=context.getBeansOfType(TastytradeClient.class).size()>0||context.getBeansOfType(PortfolioMarketAcquisition.class).size()>0||context.getBeansOfType(PortfolioOrderAcquisition.class).size()>0;
  if(providers&&!recovery){context.close();throw new IllegalStateException("provider beans forbidden");}
  var ready=Path.of(args[2]);Files.writeString(ready,new ObjectMapper().writeValueAsString(Map.of("base","http://127.0.0.1:"+context.getWebServer().getPort(),"token",token,"profile","AUTHORIZED_REAL_RETAINED_READS","providerBeans",providers,"architecturalRecovery",recovery)));
  Files.setPosixFilePermissions(ready,PosixFilePermissions.fromString("rw-------"));
 }
}
