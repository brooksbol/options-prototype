package com.wheelwright.evidence.v2;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
class PortfolioCapitalHistoryTest {
 @TempDir Path temp;
 class Fixture implements AutoCloseable {
  final SqliteEvidenceStore store;final AccountDirectory accounts;final BrokerageArtifacts artifacts;final PortfolioCapitalHistory service;
  final BearerAuthenticator auth;final MockMvc mvc;final String a,b;
  Fixture()throws Exception {
   store=new SqliteEvidenceStore(temp.resolve("capital.db").toString());accounts=new AccountDirectory(store,"");a=accounts.bind("pts","A1");b=accounts.bind("other","B2");
   var mapper=new ObjectMapper();artifacts=new BrokerageArtifacts(store,mapper,new PositionReadService(store,mapper),accounts);service=new PortfolioCapitalHistory(store,artifacts);
   auth=new BearerAuthenticator(new UserDirectory(store,accounts),"reader=reader:account.read:"+a+"|account.artifacts.read:"+a+",positions=positions:account.positions.read:"+a+",admin=admin:users.admin");
   mvc=MockMvcBuilders.standaloneSetup(new PortfolioCapitalController(accounts,service,auth,mapper)).build();
  }
  void add(String kind,String text)throws Exception {add(a,kind,text);}
  void add(String account,String kind,String text)throws Exception {
   String broker=account.equals(a)?"A1":"B2",name=kind.equals("BALANCES")?"Balances_for_Account_"+broker+".csv":"summary.csv";
   assertThat(artifacts.ingest(account,name,kind,text.getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString()).status()).isEqualTo("ACCEPTED");
  }
  PortfolioCapitalHistory.Read read()throws Exception {return service.read(a,"request",auth.authenticate("Bearer reader").orElseThrow());}
  public void close()throws Exception {store.close();}
 }
 static String balances(String time,String amount){return "Name,Balance,Day change\nTotal account value,"+amount+",0\n\nDate downloaded 08/20/2026 "+time+" ET\n";}
 static String summary(String time,String mtm){return summaryFor("A1",time,mtm);}
 static String summaryFor(String broker,String time,String mtm){return "Fidelity Investments - Option Summary "+broker+"\nQuote data as of 08/20/2026.\nSymbol,Description,Strategy,Expiration & Strike,Quantity,Market value\nXLE,Shares,Covered Call,Shares,100,9000\nXLE,Call,Covered Call,XLE AUG 21 2026 $90 CALL,-1,"+mtm+"\n\nDate downloaded 08/20/2026 "+time+" ET\n";}
 @Test void ratifiedArithmeticExactDecimalsSourceDatesAndNoReadWrites()throws Exception {
  try(var f=new Fixture()) {
   f.add("BALANCES",balances("2:06 PM","116300.23"));f.add("OPTION_SUMMARY",summary("2:06 PM","-2660.00"));
   long before=f.store.getConnection().createStatement().executeQuery("SELECT count(*) FROM brokerage_artifact").getLong(1);
   var r=f.read();assertThat(r.observations()).singleElement().satisfies(o->{
    assertThat(o.portfolioCapital()).isEqualByComparingTo("118960.23");assertThat(o.totalAccountValue()).isEqualByComparingTo("116300.23");
    assertThat(o.shortOptionMtm()).isEqualByComparingTo("-2660");assertThat(o.exportMinute()).isEqualTo("2026-08-20T14:06-04:00");
    assertThat(o.balances().receivedAt()).doesNotStartWith("2026-08-20");assertThat(o.balances().sourceRows()).containsExactly(2);
    assertThat(o.optionSummaries().getFirst().sourceRows()).containsExactly(5);assertThat(o.status()).isEqualTo("COMPOSITE");
   });assertThat(f.read()).isEqualTo(r);
   assertThat(f.store.getConnection().createStatement().executeQuery("SELECT count(*) FROM brokerage_artifact").getLong(1)).isEqualTo(before);
  }
 }
 @Test void missingAndDifferentMinuteNeverBecomeZeroOrNearestPair()throws Exception {
  try(var f=new Fixture()) {
   f.add("BALANCES",balances("2:06 PM","116300.23"));f.add("OPTION_SUMMARY",summary("2:07 PM","-2660"));
   assertThat(f.read().observations()).singleElement().satisfies(o->{assertThat(o.portfolioCapital()).isNull();assertThat(o.shortOptionMtm()).isNull();assertThat(o.status()).isEqualTo("UNMATCHED_EXPORT_MINUTE");});
   f.add("OPTION_SUMMARY",summary("2:06 PM","--"));assertThat(f.read().observations()).singleElement().satisfies(o->{assertThat(o.portfolioCapital()).isNull();assertThat(o.status()).isEqualTo("INSUFFICIENT_SOURCE_EVIDENCE");});
  }
 }
 @Test void conflictingSameMinuteFailsClosedAndDifferentMinutesRemainDistinct()throws Exception {
  try(var f=new Fixture()) {
   f.add("BALANCES",balances("2:06 PM","100000"));f.add("OPTION_SUMMARY",summary("2:06 PM","-100"));f.add("OPTION_SUMMARY",summary("2:06 PM","-200"));
   f.add("BALANCES",balances("2:07 PM","99999"));f.add("OPTION_SUMMARY",summary("2:07 PM","-120"));
   var o=f.read().observations();assertThat(o).hasSize(2);assertThat(o.getFirst().status()).isEqualTo("AMBIGUOUS_EXPORT_MINUTE");assertThat(o.getFirst().portfolioCapital()).isNull();assertThat(o.getFirst().optionSummaries()).hasSize(2);assertThat(o.getLast().portfolioCapital()).isEqualByComparingTo("100119");
  }
 }
 @Test void explicitCompleteNoShortOptionsIsZeroButUnrecognizedGeometryIsUnknown()throws Exception {
  try(var f=new Fixture()) {
   f.add("BALANCES",balances("2:06 PM","100000"));f.add("OPTION_SUMMARY",summary("2:06 PM","-200").replace(",-1,-200",",1,200"));
   assertThat(f.read().observations().getFirst().shortOptionMtm()).isEqualByComparingTo("0");
   f.add("BALANCES",balances("2:07 PM","99999"));f.add("OPTION_SUMMARY",summary("2:07 PM","-200").replace("XLE AUG 21 2026 $90 CALL","UNKNOWN OPTION"));
   assertThat(f.read().observations().getLast().portfolioCapital()).isNull();
  }
 }
 @Test void authenticationAccountGrantsValidationAndNoAdminBypass()throws Exception {
  try(var f=new Fixture()) {
   for(String token:List.of("reader","positions","admin")) {
    assertThat(f.mvc.perform(get("/v2/portfolio-capital-observations").param("accountId",f.b).header("Authorization","Bearer "+token)).andReturn().getResponse().getStatus()).isEqualTo(403);
   }
   assertThat(f.mvc.perform(get("/v2/portfolio-capital-observations").param("accountId",f.a)).andReturn().getResponse().getStatus()).isEqualTo(401);
   for(String suffix:List.of("","?accountId=","?accountId="+f.a+"&accountId="+f.a,"?accountId="+f.a+"&extra=x"))
    assertThat(f.mvc.perform(get("/v2/portfolio-capital-observations"+suffix).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(422);
   assertThat(f.mvc.perform(get("/v2/portfolio-capital-observations").param("accountId",f.a).content("{}").header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(422);
   var response=f.mvc.perform(get("/v2/portfolio-capital-observations").param("accountId",f.a).header("Authorization","Bearer reader")).andReturn().getResponse();
   assertThat(response.getStatus()).isEqualTo(200);assertThat(response.getHeader("Cache-Control")).isEqualTo("private, no-store");assertThat(response.getContentAsString()).contains("\"observations\":[]");
  }
 }
 @Test void nonFidelityValidationIncludesAccountDetails()throws Exception {
  try(var f=new Fixture()) {
   String account=f.accounts.bind("synthetic-tt","TASTYTRADE","TTSYNTHETIC01");
   var mapper=new ObjectMapper();
   var auth=new BearerAuthenticator(new UserDirectory(f.store,f.accounts),
       "capital-reader=capital-reader:account.artifacts.read:"+account);
   var mvc=MockMvcBuilders.standaloneSetup(new PortfolioCapitalController(f.accounts,f.service,auth,mapper)).build();
   String requestId="11111111-1111-4111-8111-111111111111";
   var response=mvc.perform(get("/v2/portfolio-capital-observations").param("accountId",account)
       .header("Authorization","Bearer capital-reader").header("X-Request-Id",requestId)).andReturn().getResponse();
   assertThat(response.getStatus()).isEqualTo(422);
   assertThat(response.getContentType()).startsWith("application/problem+json");
   assertThat(response.getHeader("X-Request-Id")).isEqualTo(requestId);
   assertThat(response.getHeader("Cache-Control")).isEqualTo("private, no-store");
   var problem=mapper.readTree(response.getContentAsString());
   assertThat(problem.path("status").asInt()).isEqualTo(422);
   assertThat(problem.path("code").asText()).isEqualTo("INVALID_REQUEST");
   assertThat(problem.path("detail").asText()).isEqualTo("Fidelity evidence required");
   assertThat(problem.path("requestId").asText()).isEqualTo(requestId);
   assertThat(problem.path("invalidParams").isArray()).isTrue();
   assertThat(problem.path("invalidParams").size()).isEqualTo(1);
   assertThat(problem.path("invalidParams").get(0).path("name").asText()).isEqualTo("accountId");
   assertThat(problem.path("invalidParams").get(0).path("reason").asText()).isEqualTo("Fidelity Account required");
  }
 }
 @Test void mixedOrUnknownSourceScopeNeverDisclosesFinancialProjection()throws Exception {
  try(var f=new Fixture()) {
   f.add("BALANCES",balances("2:06 PM","100000"));f.add("OPTION_SUMMARY",summary("2:06 PM","-200"));
   // A retained accepted record with unknown/mixed source scope must still fail closed.
   String mixed=summary("2:06 PM","-200")+"Fidelity Investments - Option Summary B2\n";
   try(var q=f.store.getConnection().prepareStatement("UPDATE brokerage_artifact SET payload=?,sha256=? WHERE artifact_id IN (SELECT artifact_id FROM brokerage_import WHERE file_type='OPTION_SUMMARY')")) {
    q.setBytes(1,mixed.getBytes(StandardCharsets.UTF_8));q.setString(2,FidelityPositions.digest(mixed));q.executeUpdate();
   }
   assertThatThrownBy(f::read).isInstanceOf(SecurityException.class);
   assertThat(f.mvc.perform(get("/v2/portfolio-capital-observations").param("accountId",f.a).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(403);
  }
 }
}
