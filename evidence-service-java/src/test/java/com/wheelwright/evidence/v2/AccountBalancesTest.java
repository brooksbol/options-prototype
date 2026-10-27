package com.wheelwright.evidence.v2;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
class AccountBalancesTest {
 @TempDir Path temp;
 static final String RECEIVED="2026-10-27T16:00:00Z";
 static String source(String account){return """
 {"data":{"account-number":"%s","currency":"USD","cash-balance":"101.230000000001",
 "equity-buying-power":"2000.02","derivative-buying-power":"1000.01","used-derivative-buying-power":"99.99",
 "maintenance-requirement":"95.32","margin-equity":"777.77","pending-margin-interest":"0",
 "updated-at":"2026-10-26T13:20:00Z","snapshot-date":"2026-10-26","private-unmodeled":"PRIVATE-CANARY"}}
 """.formatted(account);}
 static String retain(SqliteEvidenceStore store,String account,String body,String type,String name)throws Exception {
  byte[] bytes=body.getBytes(StandardCharsets.UTF_8);String id=UUID.randomUUID().toString();String hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
  try(var q=store.getConnection().prepareStatement("INSERT INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)");var i=store.getConnection().prepareStatement("INSERT INTO brokerage_import VALUES (?,?,?,?,?,?,?,?)")) {
   q.setString(1,account);q.setString(2,id);q.setString(3,hash);q.setString(4,type.equals("BALANCES")?"text/csv":"application/json");q.setInt(5,bytes.length);q.setBytes(6,bytes);q.setString(7,RECEIVED);q.executeUpdate();
   i.setString(1,account);i.setString(2,UUID.randomUUID().toString());i.setString(3,id);i.setString(4,name);i.setString(5,type);i.setString(6,RECEIVED);i.setString(7,"ACCEPTED");i.setString(8,"Synthetic test acquisition");i.executeUpdate();
  }return id;
 }
 class Fixture implements AutoCloseable {
  final SqliteEvidenceStore store;final AccountBalanceObservations service;final BearerAuthenticator auth;final MockMvc mvc;final String tt,fid;
  Fixture()throws Exception {
   store=new SqliteEvidenceStore(temp.resolve(UUID.randomUUID()+".db").toString());var accounts=new AccountDirectory(store,"");tt=accounts.bind("orchard","TASTYTRADE","SYNTHETIC02");fid=accounts.bind("harbor","FIDELITY","SYNTHETIC01");
   var mapper=new ObjectMapper();var artifacts=new BrokerageArtifacts(store,mapper,new PositionReadService(store,mapper),accounts);service=new AccountBalanceObservations(store,artifacts,accounts);
   auth=new BearerAuthenticator(new UserDirectory(store,accounts),"reader=reader:account.artifacts.read:"+tt+"|account.artifacts.read:"+fid+",positions=positions:account.positions.read:"+tt+",admin=admin:users.admin");mvc=MockMvcBuilders.standaloneSetup(new AccountBalancesController(accounts,service,auth,mapper)).build();
  }
  AccountBalanceObservations.Read read(String account)throws Exception{return service.read(account,null,"request",auth.authenticate("Bearer reader").orElseThrow());}
  public void close()throws Exception{store.close();}
 }
 @Test void distinctCashAndBuyingPowerPrecisionProvenanceAndNoRawDisclosures()throws Exception {
  try(var f=new Fixture()) {
   String id=retain(f.store,f.tt,source("SYNTHETIC02"),"API_BALANCES","tastytrade-balances.json");var result=f.read(f.tt);var o=result.observations().getFirst();
   assertThat(o.source().artifactId()).isEqualTo(id);assertThat(o.source().observedAt()).isEqualTo("2026-10-26T13:20:00Z");assertThat(o.source().receivedAt()).isEqualTo(RECEIVED);
   var fields=new HashMap<String,AccountBalanceObservations.Field>();o.fields().forEach(x->fields.put(x.brokerField(),x));
   assertThat(fields.get("cash-balance").value()).isEqualByComparingTo("101.230000000001");assertThat(fields.get("derivative-buying-power").value()).isEqualByComparingTo("1000.01");assertThat(fields.get("equity-buying-power").value()).isEqualByComparingTo("2000.02");assertThat(fields.get("reg-t-margin-requirement").status()).isEqualTo("MISSING");assertThat(fields.get("pending-margin-interest").value()).isEqualByComparingTo("0");
   assertThat(result.currentness()).isEqualTo("NOT_ESTABLISHED");assertThat(new ObjectMapper().writeValueAsString(result)).doesNotContain("SYNTHETIC02","PRIVATE-CANARY");assertThat(f.read(f.tt)).isEqualTo(result);
   var response=f.mvc.perform(get("/v2/account-balance-observations").param("accountId",f.tt).header("Authorization","Bearer reader").header("X-Request-Id","11111111-1111-4111-8111-111111111111")).andReturn().getResponse();
   assertThat(response.getStatus()).isEqualTo(200);
   java.nio.file.Files.createDirectories(Path.of("build/reports/balances"));
   java.nio.file.Files.writeString(Path.of("build/reports/balances/tastytrade.json"),response.getContentAsString());
  }
 }
 @Test void invalidAndMissingAreNotZeroFutureClockFailsClosedNegativeCashIsNotDebt()throws Exception {
  var o=AccountBalanceObservations.tastytrade("account","SYNTHETIC02","id","hash",RECEIVED,source("SYNTHETIC02").replace("1000.01","NaN").replace("101.230000000001","-12.34").replace("2026-10-26T13:20:00Z","2099-01-01T00:00:00Z").getBytes(StandardCharsets.UTF_8));assertThat(o.source().observedAt()).isNull();assertThat(o.source().timeStatus()).isEqualTo("INVALID_SOURCE_INSTANT");
  assertThat(o.fields().stream().filter(x->x.brokerField().equals("derivative-buying-power")).findFirst().orElseThrow().status()).isEqualTo("INVALID");assertThat(o.fields().stream().filter(x->x.brokerField().equals("cash-balance")).findFirst().orElseThrow().value()).isEqualByComparingTo("-12.34");
 }
 @Test void fidelityAWMIDiffersFromSettledAndDuplicateNeverWins()throws Exception {
  try(var f=new Fixture()) {
   retain(f.store,f.fid,"Name,Balance,Day change\nAvailable without margin impact,$0.00,0\nSettled cash,1923.15,0\nMargin buying power,17242.78,0\nCash reserved for options strategies,10300,0\nMargin credit/debit,0,0\nMargin credit/debit,1,0\n", "BALANCES","Balances_for_Account_SYNTHETIC01.csv");var o=f.read(f.fid).observations().getFirst();assertThat(o.currency()).isNull();assertThat(o.unit()).isEqualTo("SOURCE_MONETARY_UNIT");
   assertThat(o.fields()).anySatisfy(x->{assertThat(x.brokerField()).isEqualTo("Available without margin impact");assertThat(x.value()).isEqualByComparingTo("0");});assertThat(o.fields()).anySatisfy(x->{assertThat(x.brokerField()).isEqualTo("Margin credit/debit");assertThat(x.status()).isEqualTo("AMBIGUOUS");assertThat(x.value()).isNull();});
  }
 }
 @Test void authCorrelationExactSelectorsNoAdminBypassAndEmptyIsNotZero()throws Exception {
  try(var f=new Fixture()) {
   for(String token:List.of("positions","admin"))assertThat(f.mvc.perform(get("/v2/account-balance-observations").param("accountId",f.tt).header("Authorization","Bearer "+token)).andReturn().getResponse().getStatus()).isEqualTo(403);
   assertThat(f.mvc.perform(get("/v2/account-balance-observations").param("accountId",f.tt)).andReturn().getResponse().getStatus()).isEqualTo(401);
   for(String query:List.of("","?accountId=","?accountId="+f.tt+"&accountId="+f.tt,"?accountId="+f.tt+"&latest=true","?accountId="+f.tt+"&artifactId=bad"))assertThat(f.mvc.perform(get("/v2/account-balance-observations"+query).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(422);
   var r=f.mvc.perform(get("/v2/account-balance-observations").param("accountId",f.tt).header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(r.getStatus()).isEqualTo(200);assertThat(r.getHeader("Cache-Control")).isEqualTo("private, no-store");assertThat(r.getHeader("X-Request-Id")).isNotBlank();assertThat(r.getContentAsString()).contains("\"observations\":[]");assertThatThrownBy(()->f.service.read(f.tt,null,"r",f.auth.authenticate("Bearer positions").orElseThrow())).isInstanceOf(SecurityException.class);
  }
 }
 @Test void foreignOriginalAndCorruptedHashFailWholeRead()throws Exception {
  try(var f=new Fixture()){retain(f.store,f.tt,source("FOREIGN"),"API_BALANCES","tastytrade-balances.json");assertThatThrownBy(()->f.read(f.tt)).isInstanceOf(SecurityException.class);try(var q=f.store.getConnection().createStatement()){q.executeUpdate("UPDATE brokerage_artifact SET sha256='bad'");}assertThatThrownBy(()->f.read(f.tt)).isInstanceOf(java.sql.SQLException.class);}
 }
 @Test void capacityFailsWithoutPartialDataAndCorrelationIsSafe()throws Exception {
  try(var f=new Fixture()) {
   for(int n=0;n<201;n++)retain(f.store,f.tt,source("SYNTHETIC02").replace("777.77",Integer.toString(n)),"API_BALANCES","tastytrade-balances.json");
   var r=f.mvc.perform(get("/v2/account-balance-observations").param("accountId",f.tt).header("Authorization","Bearer reader")).andReturn().getResponse();
   assertThat(r.getStatus()).isEqualTo(503);assertThat(r.getContentAsString()).doesNotContain("1000.01","SYNTHETIC02","observations");
   for(String header:List.of("bad","11111111-1111-4111-8111-111111111111")) {
    var request=get("/v2/account-balance-observations").param("accountId",f.tt).header("Authorization","Bearer reader").header("X-Request-Id",header);
    if(!header.equals("bad"))request.header("X-Request-Id",header);
    assertThat(f.mvc.perform(request).andReturn().getResponse().getStatus()).isEqualTo(422);
   }
  }
 }
 @Test void fidelityExportMinuteIsNotFactObservationAndDuplicateTimestampFailsClosed()throws Exception {
  String body="Name,Balance,Day change\nAvailable without margin impact,123,0\n\nDate downloaded 10/26/2026 2:06 PM ET\n";
  try(var f=new Fixture()) {
   retain(f.store,f.fid,body,"BALANCES","Balances_for_Account_SYNTHETIC01.csv");
   var response=f.mvc.perform(get("/v2/account-balance-observations").param("accountId",f.fid).header("Authorization","Bearer reader")).andReturn().getResponse();
   assertThat(response.getStatus()).isEqualTo(200);
   java.nio.file.Files.createDirectories(Path.of("build/reports/balances"));java.nio.file.Files.writeString(Path.of("build/reports/balances/fidelity.json"),response.getContentAsString());
  }
  var o=AccountBalanceObservations.fidelity("a","id","hash",RECEIVED,body.getBytes(StandardCharsets.UTF_8));
  assertThat(o.source().exportedAt()).isEqualTo("2026-10-26T14:06-04:00");assertThat(o.source().observedAt()).isNull();
  var bad=AccountBalanceObservations.fidelity("a","id","hash",RECEIVED,(body+"Date downloaded 10/26/2026 2:07 PM ET\n").getBytes(StandardCharsets.UTF_8));assertThat(bad.source().exportedAt()).isNull();assertThat(bad.source().timeStatus()).isEqualTo("INVALID_EXPORT_TIME");
 }
 @Test void artifactSelectorCannotCrossAccountAndRejectedImportsAreNotObservations()throws Exception {
  try(var f=new Fixture()){String id=retain(f.store,f.tt,source("SYNTHETIC02"),"API_BALANCES","tastytrade-balances.json");assertThat(f.service.read(f.fid,id,"r",f.auth.authenticate("Bearer reader").orElseThrow()).observations()).isEmpty();try(var q=f.store.getConnection().createStatement()){q.executeUpdate("UPDATE brokerage_import SET status='REJECTED'");}assertThat(f.read(f.tt).observations()).isEmpty();}
 }
}
