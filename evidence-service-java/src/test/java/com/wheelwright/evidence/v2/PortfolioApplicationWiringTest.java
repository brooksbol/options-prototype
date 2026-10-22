package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.JsonNode;
import com.wheelwright.evidence.EvidenceServiceApplication;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.PortfolioJson;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import java.net.*;
import java.net.http.*;
import java.nio.file.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

/** Production component graph and HTTP, isolated SQLite; no credentials or external provider contact. */
class PortfolioApplicationWiringTest {
 @TempDir Path temp;
 HttpClient http=HttpClient.newHttpClient();String base;
 HttpResponse<String> send(String method,String path,String token,String body,String... headers)throws Exception{
  var builder=HttpRequest.newBuilder(URI.create(base+path)).timeout(java.time.Duration.ofSeconds(15)).header("Authorization","Bearer "+token);for(int i=0;i<headers.length;i+=2)builder.header(headers[i],headers[i+1]);var response=http.send(builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body)).build(),HttpResponse.BodyHandlers.ofString());
  if(!path.endsWith("/content")){var capture=PortfolioJson.obj().put("path",path).put("method",method).put("status",response.statusCode()).put("caller","full-production-graph-"+token);capture.set("body",PortfolioJson.JSON.readTree(response.body()));var h=PortfolioJson.obj();for(String name:List.of("Content-Type","Cache-Control","X-Request-Id","WWW-Authenticate"))response.headers().firstValue(name).ifPresent(value->h.put(name,value));capture.set("headers",h);Files.createDirectories(Path.of("build/portfolio-responses"));Files.writeString(Path.of("build/portfolio-responses",UUID.randomUUID()+".json"),capture.toString());}return response;
 }
 JsonNode get(String path,String token,int status)throws Exception{var r=send("GET",path,token,null);assertThat(r.statusCode()).as(r.body()).isEqualTo(status);return PortfolioJson.JSON.readTree(r.body());}
 @Test void completeProductionGraphSharesUsersAccountsImportsAndFinancialResources()throws Exception{
  Path path=temp.resolve("actual-graph.sqlite3");String account,foreign;try(var seed=new SqliteEvidenceStore(path.toString())){var accounts=new AccountDirectory(seed,"");account=accounts.bind("synthetic","A1");foreign=accounts.bind("synthetic-foreign","B1");}
  String capabilities="account.read:"+account+"|account.positions.read:"+account+"|account.holdings.read:"+account+"|account.artifacts.read:"+account+"|account.artifacts.write:"+account+"|account.orders.read:"+account+"|account.positions.audit.read:"+account+"|account.transactions.read:"+account+"|account.market.read:"+account+"|reference.read|market.read|quote.read|users.admin";
  var app=new SpringApplication(EvidenceServiceApplication.class);
  try(var context=(ServletWebServerApplicationContext)app.run("--spring.config.location=optional:file:"+temp.resolve("absent.properties"),"--server.address=127.0.0.1","--server.port=0","--evidence.db.path="+path,"--universe.seed.path=","--universe.disposition.path=","--tradier.api-key=synthetic-loopback-only","--tradier.base-url=http://127.0.0.1:9/v1","--tradier.sandbox.api-key=","--tradier.sandbox.base-url=","--wheelwright.tastytrade.client-id=","--wheelwright.tastytrade.client-secret=","--wheelwright.tastytrade.refresh-token=","--wheelwright.portfolio.orders.read-through-enabled=false","--wheelwright.portfolio.market.read-through-enabled=false","--wheelwright.history.read-through-enabled=false","--wheelwright.v2.auth.tokens=owner=synthetic:"+capabilities+",other=foreign:account.positions.read:"+foreign+"|account.holdings.read:"+foreign,"--spring.main.banner-mode=off","--logging.level.root=ERROR")){
   base="http://127.0.0.1:"+context.getWebServer().getPort();var me=get("/v2/me","owner",200);String user=me.at("/user/id").asText();assertThat(UserDirectory.validId(user)).isTrue();get("/v2/users","owner",200);get("/v2/users/"+user,"owner",200);get("/v2/accounts","owner",200);get("/v2/accounts/"+account,"owner",200);get("/v2/users","other",403);
   String csv=PositionsTest.csv(PositionsTest.BODY.replace("B2,Sawdust,ETFs,QQQ,Other account,99,9999,999,Cash\n",""),"Oct-05-2026");var upload=send("POST","/v2/artifacts?accountId="+account,"owner",csv,"Content-Type","text/csv","Content-Disposition","attachment; filename=synthetic-positions.csv","X-Brokerage-File-Type","POSITIONS");assertThat(upload.statusCode()).as(upload.body()).isEqualTo(200);var processed=PortfolioJson.JSON.readTree(upload.body());assertThat(processed.path("status").asText()).isEqualTo("ACCEPTED");String artifact=processed.path("artifactId").asText();get("/v2/artifacts?accountId="+account,"owner",200);get("/v2/artifacts/"+artifact,"owner",200);var original=send("GET","/v2/artifacts/"+artifact+"/content","owner",null);assertThat(original.statusCode()).isEqualTo(200);assertThat(original.body()).isEqualTo(csv);var retry=send("POST","/v2/artifacts/"+artifact+"/imports","owner",null);assertThat(retry.statusCode()).as(retry.body()).isEqualTo(200);
   var positions=get("/v2/positions?projection=expanded&include=currentConstruction,modelVersion,holdingSummaries,orderSummaries","owner",200);assertThat(positions.path("items")).isNotEmpty();String position=positions.at("/items/0/self/href").asText();get(position,"owner",200);get(position,"other",404);get("/v2/holdings?view=observations","owner",200);get("/v2/accounts/"+account+"/inventory-reconciliation","owner",200);get("/v2/orders?accountId="+account,"owner",200);get("/v2/accounts/"+account+"/transactions","owner",200);get("/v2/market-observations?accountId="+account,"owner",200);get("/v2/constructions/models?projection=expanded","owner",200);get("/v2/instruments","owner",200);get("/v2/quotes","owner",200);get("/v2/me","unknown",401);
  }
 }
}
