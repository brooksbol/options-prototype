package com.wheelwright.evidence.v2;
import org.junit.jupiter.api.*;import org.junit.jupiter.api.io.TempDir;
import com.fasterxml.jackson.databind.*;import com.wheelwright.evidence.db.SqliteEvidenceStore;
import java.util.*;import java.nio.file.*;
import static org.assertj.core.api.Assertions.*;import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
class FinancialReportCsvTest {
 @TempDir Path temp;final ObjectMapper json=new ObjectMapper();
 @Test void realGovernedClosedResultsExportExactlyWithCentsAndAccountingPrecisionAndScopeRechecked()throws Exception {
  try(var db=new SqliteEvidenceStore(temp.resolve("export.db").toString())){
   var accounts=new AccountDirectory(db,"");String account=accounts.bind("fixture","TASTYTRADE","SYNTHETIC01"),other=accounts.bind("foreign","TASTYTRADE","SYNTHETIC02");var h=new ClosedTradeReportTest();var source=h.report(List.of(h.transaction("open","opening","Sell to Open","2026-09-30T14:00:00Z","1","10.005",true),h.transaction("close","closing","Buy to Close","2026-10-29T13:30:00Z","1","-5.001",true)));source.put("accountId",account);
   var history=mock(TransactionHistory.class);when(history.closedTrades(eq(account),anyString(),eq("2026-10-01"),eq("2026-10-29"),eq("America/Denver"),eq(100),isNull(),anyBoolean())).thenAnswer(call->new LinkedHashMap<>(source));
   var auth=new BearerAuthenticator(new UserDirectory(db,accounts),"reader=reader:account.transactions.read:"+account);var mvc=MockMvcBuilders.standaloneSetup(new TransactionsController(history,accounts,auth,json)).build();String path="/v2/accounts/"+account+"/transactions?mode=retained&view=closed-trades&from=2026-10-01&through=2026-10-29&timeZone=America%2FDenver&limit=100";
   var report=mvc.perform(get(java.net.URI.create(path)).header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(report.getStatus()).isEqualTo(200);var ref=json.readTree(report.getContentAsString()).path("csv");assertThat(ref.path("sha256").asText()).hasSize(64);
   var csv=mvc.perform(get(java.net.URI.create(ref.path("href").asText())).header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(csv.getStatus()).isEqualTo(200);assertThat(csv.getContentType()).startsWith("text/csv");assertThat(csv.getHeader("Content-Disposition")).isEqualTo("attachment; filename=\"fixture-closed-trades-2026-10-01-2026-10-29.csv\"");assertThat(csv.getHeader("X-Content-SHA256")).isEqualTo(BrokerageArtifacts.sha(csv.getContentAsByteArray()));assertThat(csv.getContentAsString()).contains("\"5.00\"","\"5.004\"","\"TOTAL\"","QUALIFIED_ESTIMATED_FEES").doesNotContain("openingTransactions","open\",\"close");
   Files.createDirectories(Path.of("build/reports/exports"));Files.write(Path.of("build/reports/exports/closed.csv"),csv.getContentAsByteArray());Files.writeString(Path.of("build/reports/exports/closed.json"),report.getContentAsString());
   assertThat(mvc.perform(get(java.net.URI.create(ref.path("href").asText().replace(ref.path("sha256").asText(),"0".repeat(64)))).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(422);
   assertThat(mvc.perform(get(java.net.URI.create(ref.path("href").asText().replace(account,other))).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(403);
   assertThat(mvc.perform(get(java.net.URI.create(ref.path("href").asText())).header("Authorization","Bearer wrong")).andReturn().getResponse().getStatus()).isEqualTo(401);
   assertThat(FinancialReportCsv.closedTrades(json.valueToTree(source),"fixture",false)).isEmpty();var partial=json.valueToTree(source);((com.fasterxml.jackson.databind.node.ObjectNode)partial).put("nextCursor","next");assertThat(FinancialReportCsv.closedTrades(partial,"fixture",true)).isEmpty();
  }
 }
 @Test void reportedBalancePreservesSourcePrecisionAndPinnedSourceAndDeniesOtherScopes()throws Exception{
  var h=new AccountBalancesTest();h.temp=temp;try(var f=h.new Fixture()){
   AccountBalancesTest.retain(f.store,f.tt,AccountBalancesTest.source("SYNTHETIC02"),"API_BALANCES","tastytrade-balances.json");var r=f.mvc.perform(get("/v2/account-balance-observations?accountId="+f.tt+"&selection=latest-source").header("Authorization","Bearer reader")).andReturn().getResponse();var link=json.readTree(r.getContentAsString()).at("/csv/href").asText();assertThat(link).contains("artifactId=").doesNotContain("latest-source");
   var file=f.mvc.perform(get(link).header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(file.getStatus()).isEqualTo(200);assertThat(file.getContentAsString()).contains("101.230000000001","NOT_ESTABLISHED").doesNotContain("SYNTHETIC02","PRIVATE-CANARY");assertThat(f.mvc.perform(get(link).header("Authorization","Bearer positions")).andReturn().getResponse().getStatus()).isEqualTo(403);
  }
 }
 @Test void csvEscapesQuotesAndNewlinesNeutralizesTextFormulaAndPreservesNegativeNumeric(){assertThat(FinancialReportCsv.cell("=1+1",false)).isEqualTo("\"'=1+1\"");assertThat(FinancialReportCsv.cell(" \t@SUM(1)",false)).startsWith("\"'");assertThat(FinancialReportCsv.cell("-37.01",true)).isEqualTo("\"-37.01\"");assertThat(FinancialReportCsv.cell("a,\"b\"\nc",false)).isEqualTo("\"a,\"\"b\"\"\nc\"");}
 @Test void unavailableResultsStayBlankRatherThanZeroAndOversizeExportIsNotOffered()throws Exception{var h=new ClosedTradeReportTest();var report=h.report(List.of(h.transaction("close","closing","Buy to Close","2026-10-29T13:30:00Z","1","-5",true)));var file=FinancialReportCsv.closedTrades(json.valueToTree(report),"fixture",true).orElseThrow();assertThat(file.content()).contains("UNAVAILABLE").doesNotContain("0.00");assertThat(FinancialReportCsv.result("fixture.csv",new StringBuilder("x".repeat(100001)))).isEmpty();}

}
