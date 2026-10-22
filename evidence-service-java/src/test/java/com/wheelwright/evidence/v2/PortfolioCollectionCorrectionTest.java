package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** NEWLY CONSTRUCTED falsifiers, not Kiro's unavailable original probes. Synthetic local sources only. */
class PortfolioCollectionCorrectionTest {
 @TempDir Path directory;
 final ObjectMapper mapper=new ObjectMapper();SqliteEvidenceStore db;AccountDirectory accounts;String account,second;BrokerageArtifacts artifacts;PortfolioRepository repo;PortfolioReadService reads;PortfolioSources sources;MockMvc mvc;
 @BeforeEach void setup()throws Exception {
  db=new SqliteEvidenceStore(directory.resolve("fixture.sqlite3").toString());accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());account=accounts.bind("fixture","A1");second=accounts.bind("fixture-two","B2");
  var positions=new PositionReadService(db,mapper);artifacts=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),mapper,positions);repo=spy(new PortfolioRepository(db,mapper));sources=spy(new PortfolioSources(repo,mapper,accounts));reads=spy(new PortfolioReadService(repo,sources));
  authorize(account,second);
 }
 void authorize(String... scope){
  var grants=new ArrayList<String>(List.of("reference.read","market.read"));for(String a:scope)for(String grant:List.of("account.positions.read:","account.holdings.read:","account.orders.read:"))grants.add(grant+a);
  var auth=TestAuthentication.auth("owner=user:"+String.join("|",grants)+",other=other-user:quote.read");mvc=MockMvcBuilders.standaloneSetup(new PortfolioController(reads,auth,accounts)).build();
 }
 @AfterEach void close()throws Exception {db.close();}
 void ingest(String body,String day)throws Exception {var result=artifacts.ingest(account,"synthetic-"+day+".csv","POSITIONS",PositionsTest.csv(body,day).getBytes(java.nio.charset.StandardCharsets.UTF_8),UUID.randomUUID().toString());assertThat(result.status()).as(result.toString()).isEqualTo("ACCEPTED");}
 JsonNode read(String path)throws Exception {var response=mvc.perform(get(path).header("Authorization","Bearer owner")).andReturn().getResponse();assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(200);return mapper.readTree(response.getContentAsString());}
 @Test void defaultHoldingsSelectOnlyLatestAccountSnapshot()throws Exception {
  ingest(PositionsTest.BODY,"Oct-05-2026");ingest(PositionsTest.BODY,"Oct-06-2026");var result=read("/v2/holdings?limit=200");var snapshots=new HashSet<String>();result.path("items").forEach(h->snapshots.add(h.path("snapshotId").asText()));assertThat(snapshots).hasSize(1);assertThat(result.path("items")).allSatisfy(h->assertThat(h.path("observationDate").asText()).isEqualTo("2026-10-06"));
 }
 @Test void onlyRequestedMembersAreExpanded()throws Exception {
  ingest(PositionsTest.BODY,"Oct-05-2026");read("/v2/positions?projection=uri");clearInvocations(reads,sources,repo);var result=read("/v2/positions?projection=expanded&limit=1");assertThat(result.path("items")).hasSize(1);assertThat(mockingDetails(reads).getInvocations().stream().filter(i->i.getMethod().getName().equals("expand")).count()).isEqualTo(1);
 }
 final java.util.concurrent.atomic.AtomicLong sqlReads=new java.util.concurrent.atomic.AtomicLong(),sqlRows=new java.util.concurrent.atomic.AtomicLong();
 Object measured(Object target,Class<?> type){return java.lang.reflect.Proxy.newProxyInstance(type.getClassLoader(),new Class<?>[]{type},(proxy,method,args)->{
  Object value;try{value=method.invoke(target,args);}catch(java.lang.reflect.InvocationTargetException error){throw error.getCause();}
  if(method.getName().equals("executeQuery"))sqlReads.incrementAndGet();
  if(type==java.sql.ResultSet.class&&method.getName().equals("next")&&Boolean.TRUE.equals(value))sqlRows.incrementAndGet();
  if(method.getReturnType()==java.sql.PreparedStatement.class)return measured(value,java.sql.PreparedStatement.class);
  if(method.getReturnType()==java.sql.ResultSet.class)return measured(value,java.sql.ResultSet.class);
  return value;
 });}
 @Test void complexityTracksPageSizeWithOneAccountWideReconciliation()throws Exception {
  doAnswer(call->measured(call.callRealMethod(),java.sql.Connection.class)).when(repo).connection();
  var measurements=mapper.createArrayNode();
  for(int population:List.of(10,100,1000)){
   var rows=new StringBuilder();for(int i=0;i<population;i++)rows.append("A1,Synthetic,Stocks,SYN").append(i).append(",Synthetic inventory,1,100,--,Cash\n");
   ingest(rows.toString(),population==10?"Oct-05-2026":population==100?"Oct-06-2026":"Oct-07-2026");
   sources.refresh(Set.of(account));read("/v2/positions?projection=uri&limit=1");
   for(String projection:List.of("summary","expanded"))for(int limit:List.of(5,20)){
    clearInvocations(reads,repo,sources);sqlReads.set(0);sqlRows.set(0);long start=System.nanoTime();var value=read("/v2/positions?"+(projection.equals("summary")?"":"projection="+projection+"&")+"limit="+limit+(projection.equals("expanded")?"&include=currentConstruction":""));long elapsed=(System.nanoTime()-start)/1_000_000;
    int expected=Math.min(limit,population);assertThat(value.path("items")).hasSize(expected);
    long expansions=mockingDetails(reads).getInvocations().stream().filter(i->i.getMethod().getName().equals("expand")).count();assertThat(expansions).isEqualTo(expected);
    verify(reads,times(1)).reconciliation(eq(account),any());
    long fullPositionLists=mockingDetails(repo).getInvocations().stream().filter(i->i.getMethod().getName().equals("list")&&i.getArguments()[0]==PortfolioRepository.Kind.POSITION).count();assertThat(fullPositionLists).as("Only the Account-wide invariant needs the whole Position population").isEqualTo(1); // one Account-wide invariant, independent of page size
    assertThat(sqlReads.get()).as("Statement count is bounded by page size, not portfolio population").isLessThanOrEqualTo(50+3L*expected);assertThat(sqlRows.get()).as("One Account-wide linear inventory/construction pass plus page details and retained source signatures").isLessThanOrEqualTo(4L*population+500);
    var row=mapper.createObjectNode().put("population",population).put("pageSize",limit).put("projection",projection).put("expandedItems",expansions).put("reconciliations",1).put("sourceNormalizationChecks",mockingDetails(sources).getInvocations().stream().filter(i->i.getMethod().getName().equals("refresh")).count()).put("fullPositionReads",fullPositionLists).put("repositorySelects",sqlReads.get()).put("repositoryRowsRead",sqlRows.get()).put("millis",elapsed);measurements.add(row);
   }
  }
  var output=Path.of("build/product-conformance");Files.createDirectories(output);Files.writeString(output.resolve("complexity.json"),measurements.toPrettyString());
  var plans=mapper.createArrayNode();try(var c=repo.connection();var q=c.prepareStatement("EXPLAIN QUERY PLAN SELECT c.* FROM portfolio_resource p CROSS JOIN portfolio_resource c ON c.uri=json_extract(p.payload_json,'$.currentConstruction.href') AND c.kind='CONSTRUCTION' AND c.account_id=p.account_id WHERE p.kind='POSITION' AND p.account_id=? AND json_extract(p.payload_json,'$.state')!='CLOSED' AND (p.source_snapshot IS NULL OR p.source_snapshot=?) ORDER BY c.uri")){q.setString(1,account);q.setString(2,"");try(var r=q.executeQuery()){while(r.next())plans.add(r.getString("detail"));}}assertThat(plans.toString()).contains("uri=?");Files.writeString(output.resolve("reconciliation-query-plan.json"),plans.toPrettyString());
 }

 @Test void routingErrorsUseTheV2ProblemEnvelope()throws Exception {
  var app=new org.springframework.boot.SpringApplication(PortfolioHttpTest.Fixture.class);app.setDefaultProperties(Map.of("server.address","127.0.0.1","server.port","0","probe.database",directory.resolve("routing.sqlite3").toString(),"spring.main.banner-mode","off","logging.level.root","ERROR","spring.config.location","optional:file:"+directory.resolve("absent.properties")));
  try(var server=(org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext)app.run()){
   var http=java.net.http.HttpClient.newHttpClient();var results=mapper.createArrayNode();
   for(String path:List.of("/v2/no-such-resource","/v2/positions")){
    var builder=java.net.http.HttpRequest.newBuilder(java.net.URI.create("http://127.0.0.1:"+server.getWebServer().getPort()+path)).header("Authorization","Bearer a").header("X-Request-Id","11111111-1111-4111-8111-111111111111");
    var response=http.send(path.endsWith("positions")?builder.POST(java.net.http.HttpRequest.BodyPublishers.noBody()).build():builder.GET().build(),java.net.http.HttpResponse.BodyHandlers.ofString());
    results.add(mapper.createObjectNode().put("path",path).put("status",response.statusCode()).put("contentType",response.headers().firstValue("content-type").orElse("")).put("body",response.body()));
   }
   var output=Path.of("build/product-conformance");Files.createDirectories(output);Files.writeString(output.resolve("routing-probes.json"),results.toPrettyString());
   for(int i=0;i<results.size();i++)assertThat(results.get(i).path("status").asInt()).isEqualTo(i==0?404:405);
   String origin="http://127.0.0.1:"+server.getWebServer().getPort();
   for(String token:List.of("", "invalid")){
    var r=http.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(origin+"/v2/no-such-resource")).header("Authorization","Bearer "+token).GET().build(),java.net.http.HttpResponse.BodyHandlers.ofString());assertThat(r.statusCode()).isEqualTo(401);assertThat(r.headers().firstValue("www-authenticate")).contains("Bearer");assertThat(r.body()).doesNotContain("no-such-resource");
   }
   var malformed=http.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(origin+"/v2/no-such-resource")).header("Authorization","Bearer a").header("X-Request-Id","invalid").GET().build(),java.net.http.HttpResponse.BodyHandlers.ofString());assertThat(malformed.statusCode()).isEqualTo(422);assertThat(malformed.headers().firstValue("x-request-id").orElseThrow()).matches("[0-9a-f-]{36}");
   var method=http.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(origin+"/v2/positions")).header("Authorization","Bearer a").POST(java.net.http.HttpRequest.BodyPublishers.noBody()).build(),java.net.http.HttpResponse.BodyHandlers.ofString());assertThat(method.headers().firstValue("allow").orElseThrow()).contains("GET","HEAD","OPTIONS");assertThat(method.headers().firstValue("cache-control")).contains("private, no-store");
   var legacy=http.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(origin+"/api/no-such-resource")).GET().build(),java.net.http.HttpResponse.BodyHandlers.ofString());assertThat(legacy.statusCode()).isEqualTo(404);assertThat(legacy.headers().firstValue("content-type").orElse("")).doesNotStartWith("application/problem+json");
   for(var result:results){assertThat(result.path("contentType").asText()).startsWith("application/problem+json");assertThat(mapper.readTree(result.path("body").asText()).path("requestId").asText()).isEqualTo("11111111-1111-4111-8111-111111111111");}
  }
 }

 static String stock(String source,int quantity){return source+",Synthetic,Stocks,SPY,Synthetic shares,"+quantity+",100,--,Cash\n";}
 JsonNode status(String path,String token,int expected)throws Exception {var r=mvc.perform(get(path).header("Authorization","Bearer "+token)).andReturn().getResponse();assertThat(r.getStatus()).as(r.getContentAsString()).isEqualTo(expected);return mapper.readTree(r.getContentAsString());}
 @Test void oneSnapshotOneAccountAndIndependentLatestAcrossAccounts()throws Exception {
  ingest(stock("A1",100),"Oct-05-2026");assertThat(read("/v2/holdings").path("items")).hasSize(1);
  ingest(stock("A1",75),"Oct-06-2026");assertThat(artifacts.ingest(second,"second.csv","POSITIONS",PositionsTest.csv(stock("B2",20),"Oct-07-2026").getBytes(java.nio.charset.StandardCharsets.UTF_8),UUID.randomUUID().toString()).status()).isEqualTo("ACCEPTED");
  var all=read("/v2/holdings?limit=200");assertThat(all.path("items")).hasSize(2);var totals=new HashMap<String,String>();all.path("items").forEach(h->totals.put(h.at("/account/href").asText(),h.path("quantity").asText()));assertThat(totals).containsEntry("/v2/accounts/"+account,"75").containsEntry("/v2/accounts/"+second,"20");assertThat(read("/v2/holdings?accountId="+account).path("items")).hasSize(1);
 }
 @Test void historicalSnapshotRemainsSelectableWithoutCurrentDoubleCounting()throws Exception {
  ingest(stock("A1",100),"Oct-05-2026");ingest(stock("A1",75),"Oct-06-2026");var catalog=read("/v2/holdings?view=observations&accountId="+account);assertThat(catalog.path("items")).hasSize(2);
  for(var cut:catalog.path("items")){var selected=read(cut.at("/holdings/href").asText());assertThat(selected.path("items")).hasSize(1);assertThat(selected.at("/items/0/snapshotId")).isEqualTo(cut.path("snapshotId"));assertThat(selected.at("/items/0/quantity").asText()).isEqualTo(cut.path("evidenceDate").asText().equals("2026-10-05")?"100":"75");}
  assertThat(repo.list(PortfolioRepository.Kind.HOLDING,Set.of(account))).hasSize(2);assertThat(read("/v2/holdings?accountId="+account).path("items")).hasSize(1);
 }
 @Test void partialLatestCutDoesNotBorrowOlderQuantityAndHasWarnings()throws Exception {
  ingest(stock("A1",100),"Oct-05-2026");ingest("A1,Synthetic,Stocks,SPY,Unknown quantity,,--,--,Cash\n","Oct-06-2026");
  var latest=read("/v2/holdings?accountId="+account);assertThat(latest.path("items")).hasSize(1);assertThat(latest.at("/items/0/quantity").isNull()).isTrue();assertThat(latest.at("/items/0/snapshotCoverage").asText()).isEqualTo("PARTIAL");assertThat(latest.path("warnings")).isNotEmpty();assertThat(repo.list(PortfolioRepository.Kind.HOLDING,Set.of(account))).hasSize(2);
 }
 @Test void failedImportRetainsPriorSuccessWithoutCallingItFresh()throws Exception {
  ingest(stock("A1",100),"Oct-05-2026");var before=read("/v2/holdings?accountId="+account);var failure=artifacts.ingest(account,"invalid.csv","POSITIONS","invalid header\n".getBytes(java.nio.charset.StandardCharsets.UTF_8),UUID.randomUUID().toString());assertThat(failure.status()).isEqualTo("REJECTED");var after=read("/v2/holdings?accountId="+account);assertThat(after.path("items")).isEqualTo(before.path("items"));assertThat(after.path("warnings").toString()).contains("SOURCE_CONFLICT");
 }
 @Test void accountGrantsAndCrossAccountSnapshotRemainFailClosed()throws Exception {
  ingest(stock("A1",100),"Oct-05-2026");assertThat(artifacts.ingest(second,"b.csv","POSITIONS",PositionsTest.csv(stock("B2",20),"Oct-07-2026").getBytes(java.nio.charset.StandardCharsets.UTF_8),UUID.randomUUID().toString()).status()).isEqualTo("ACCEPTED");
  var b=read("/v2/holdings?accountId="+second);String bSnapshot=b.at("/items/0/snapshotId").asText();status("/v2/holdings?accountId="+account+"&snapshotId="+bSnapshot,"owner",404);assertThat(status("/v2/holdings","other",200).path("items")).isEmpty();status("/v2/holdings?accountId="+account,"other",403);String detail=b.at("/items/0/self/href").asText();status(detail,"other",404);
 }
 @Test void paginationIsUniqueStableAndRejectsChangedCurrentCut()throws Exception {
  var rows=new StringBuilder();for(int i=0;i<10;i++)rows.append("A1,Synthetic,Stocks,SYN").append(i).append(",Shares,1,100,--,Cash\n");ingest(rows.toString(),"Oct-05-2026");
  var expected=read("/v2/holdings?accountId="+account+"&limit=200");var ids=new LinkedHashSet<String>();String next="/v2/holdings?accountId="+account+"&limit=2";int pages=0;while(next!=null){var page=read(next);for(var item:page.path("items"))assertThat(ids.add(item.path("id").asText())).isTrue();next=page.path("next").isNull()?null:page.at("/next/href").asText();assertThat(++pages).isLessThanOrEqualTo(5);}assertThat(ids).hasSize(10);assertThat(expected.path("items")).extracting(x->x.path("id").asText()).containsExactlyElementsOf(ids);
  var first=read("/v2/holdings?accountId="+account+"&limit=2");ingest(rows.toString(),"Oct-06-2026");status(first.at("/next/href").asText(),"owner",422);var newest=read("/v2/holdings?accountId="+account+"&sort=-id&limit=200");var sorted=new ArrayList<String>();newest.path("items").forEach(h->sorted.add(h.path("id").asText()));assertThat(sorted).isSortedAccordingTo(Comparator.reverseOrder());
 }
 @Test void emptyLatestSecuritiesCutDoesNotFallBackToOlderCustody()throws Exception {
  String tt=accounts.bind("empty-native","TASTYTRADE","EMPTY1234");authorize(account,second,tt);var client=mock(TastytradeClient.class);var one=mapper.createObjectNode().put("account-number","EMPTY1234").put("symbol","SPY").put("underlying-symbol","SPY").put("instrument-type","Equity").put("quantity",1).put("quantity-direction","Long");
  var root=mapper.createObjectNode();root.set("data",mapper.createObjectNode().set("items",mapper.createArrayNode().add(one)));root.set("pagination",mapper.createObjectNode().put("page-offset",0).put("total-pages",1).put("total-items",1));byte[] initial=mapper.writeValueAsBytes(root);root.set("data",mapper.createObjectNode().set("items",mapper.createArrayNode()));((com.fasterxml.jackson.databind.node.ObjectNode)root.path("pagination")).put("total-items",0);
  when(client.holdings("EMPTY1234")).thenReturn(initial,mapper.writeValueAsBytes(root)).thenThrow(new IllegalStateException("Synthetic failed acquisition"));when(client.settledCashBalance("EMPTY1234")).thenThrow(new IllegalStateException("Companion cash unavailable"));var acquisition=new PositionAcquisition(db,accounts,new PositionReadService(db,mapper),client);
  assertThat(acquisition.acquire(tt,UUID.randomUUID().toString()).status()).isEqualTo("ACCEPTED");assertThat(read("/v2/holdings?accountId="+tt).path("items")).hasSize(1);assertThat(acquisition.acquire(tt,UUID.randomUUID().toString()).status()).isEqualTo("ACCEPTED");var empty=read("/v2/holdings?accountId="+tt);assertThat(empty.path("items")).isEmpty();assertThat(empty.path("warnings")).isNotEmpty();assertThat(read("/v2/holdings?view=observations&accountId="+tt).path("items")).hasSize(2);assertThat(acquisition.acquire(tt,UUID.randomUUID().toString()).status()).isEqualTo("FAILED");var retained=read("/v2/holdings?accountId="+tt);assertThat(retained.path("items")).isEmpty();assertThat(retained.path("warnings").toString()).contains("SOURCE_CONFLICT");assertThat(read("/v2/holdings?view=observations&accountId="+tt).path("items")).hasSize(2);
 }

}
