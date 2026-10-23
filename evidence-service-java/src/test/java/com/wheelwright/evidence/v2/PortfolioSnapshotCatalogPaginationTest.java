package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Stream;
import static org.assertj.core.api.Assertions.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Newly constructed end-to-end source admission/HTTP walks; not Kiro's unavailable original probes. */
class PortfolioSnapshotCatalogPaginationTest {
 @TempDir Path directory;
 PortfolioCollectionCorrectionTest f;
 @BeforeEach void setup()throws Exception {f=new PortfolioCollectionCorrectionTest();f.directory=directory;f.setup();}
 @AfterEach void close()throws Exception {f.close();}
 static Stream<Arguments> cases(){return Stream.of(false,true).flatMap(multi->Stream.of("id","-id").flatMap(sort->Stream.of(1,2,3,50).map(limit->Arguments.of(multi,sort,limit))));}
 void cuts(String account,int count)throws Exception {
  String source=account.equals(f.account)?"A1":"B2";
  for(int i=1;i<=count;i++)assertThat(f.artifacts.ingest(account,"synthetic-cut-"+i+".csv","POSITIONS",PositionsTest.csv(PortfolioCollectionCorrectionTest.stock(source,i),"Oct-05-2026").getBytes(java.nio.charset.StandardCharsets.UTF_8),UUID.randomUUID().toString()).status()).isEqualTo("ACCEPTED");
 }
 List<String> populate(boolean multiple)throws Exception {
  var accounts=new ArrayList<>(List.of(f.account,f.second));Collections.sort(accounts);
  if(multiple){cuts(accounts.get(0),5);cuts(accounts.get(1),2);}else cuts(f.account,7);
  return multiple?accounts:List.of(f.account);
 }
 static String key(JsonNode n){return n.at("/account/href").asText()+":"+n.path("snapshotId").asText();}
 static List<String> keys(JsonNode items){var result=new ArrayList<String>();items.forEach(n->result.add(key(n)));return result;}
 String query(String sort,int limit,String account){return "/v2/holdings?view=observations&sort="+sort+(limit==50?"":"&limit="+limit)+(account==null?"":"&accountId="+account);}
 ObjectNode walk(String query,JsonNode reference,String name)throws Exception {
  var pages=array();var concatenated=array();var seen=new HashSet<String>();var urls=new HashSet<String>();String next=query,stop="NEXT_NULL";
  while(next!=null){
   if(!urls.add(next)||pages.size()>reference.size()+1){stop="CURSOR_CYCLE";break;}
   var response=f.read(next);var page=obj().put("request",next);page.set("response",response);pages.add(page);
   for(var item:response.path("items")){if(!seen.add(key(item)))stop="DUPLICATE";concatenated.add(item.deepCopy());}
   next=response.path("next").isNull()?null:response.at("/next/href").asText();
   if(next!=null){
    assertThat(f.read(next)).isEqualTo(f.read(next)); // replay exact continuation on unchanged source
    String encoded=Arrays.stream(java.net.URI.create(next).getRawQuery().split("&")).filter(part->part.startsWith("cursor=")).findFirst().orElseThrow().substring(7);String token=java.net.URLDecoder.decode(encoded,java.nio.charset.StandardCharsets.UTF_8);
    String[] payload=new String(Base64.getUrlDecoder().decode(token.split("\\.")[0]),java.nio.charset.StandardCharsets.UTF_8).split("\n",2);assertThat(payload).hasSize(2);assertThat(payload[1]).isEqualTo(key(response.path("items").get(response.path("items").size()-1)));
   }
  }
  var record=obj().put("standing","NEWLY_CONSTRUCTED_SYNTHETIC_SOURCE_HTTP_WALK_NOT_KIRO_OR_LIVE_BROKER_PROBE").put("termination",stop).put("expectedCount",reference.size()).put("actualCount",concatenated.size());record.set("reference",reference);record.set("pages",pages);record.set("concatenated",concatenated);
  var out=Path.of("build/catalog-pagination");Files.createDirectories(out);Files.writeString(out.resolve(name+".json"),record.toPrettyString());return record;
 }
 @ParameterizedTest(name="multipleAccounts={0},sort={1},limit={2}") @MethodSource("cases")
 void everyRetainedCutIsReachable(boolean multiple,String sort,int limit)throws Exception {
  var owners=populate(multiple);String account=multiple?null:f.account;
  var reference=f.read(query(sort,200,account)).path("items");assertThat(reference).hasSize(7);assertThat(keys(reference)).doesNotHaveDuplicates();assertThat(reference).allSatisfy(c->assertThat(c.path("evidenceDate").asText()).isEqualTo("2026-10-05"));
  var first=f.read(query(sort,limit,account));assertThat(f.read(query(sort,limit,account))).isEqualTo(first); // same evidence and controller: stable cursor and first page
  var walked=walk(query(sort,limit,account),reference,"walk-"+(multiple?"multi":"single")+"-"+sort+"-"+limit);
  assertThat(walked.path("termination").asText()).isEqualTo("NEXT_NULL");assertThat(walked.path("concatenated")).isEqualTo(reference);assertThat(walked.path("actualCount").asInt()).isEqualTo(7);
  assertThat(walked.path("pages").get(walked.path("pages").size()-1).at("/response/next").isNull()).isTrue();
  if(multiple&&(limit==3||limit==2&&sort.equals("id"))){boolean boundaryInsidePage=false;for(var page:walked.path("pages")){var accounts=new HashSet<String>();page.at("/response/items").forEach(c->accounts.add(c.at("/account/href").asText()));boundaryInsidePage|=accounts.size()>1;}assertThat(boundaryInsidePage).isTrue();}
 }
 @Test void fiveCutsWithPageTwoRemainReachable()throws Exception {
  cuts(f.account,5);var reference=f.read(query("id",200,f.account)).path("items");var walked=walk(query("id",2,f.account),reference,"five-cuts-limit-two");assertThat(walked.path("concatenated")).isEqualTo(reference);assertThat(walked.path("actualCount").asInt()).isEqualTo(5);
 }
 @Test void catalogHistoryAndLatestDefaultKeepIndependentSelections()throws Exception {
  var owners=populate(true);var reference=f.read(query("id",200,null)).path("items");var byAccount=new HashMap<String,String>();
  for(var cut:reference){var holdings=f.read(cut.at("/holdings/href").asText());assertThat(holdings.path("items")).hasSize(1);assertThat(holdings.at("/items/0/snapshotId")).isEqualTo(cut.path("snapshotId"));assertThat(holdings.at("/items/0/account/href")).isEqualTo(cut.at("/account/href"));String uri=cut.at("/account/href").asText();String selected=holdings.at("/items/0/quantity").asText();if(Integer.parseInt(selected)==(uri.endsWith(owners.get(0))?5:2))byAccount.put(uri,cut.path("snapshotId").asText());}
  var current=f.read("/v2/holdings?limit=200").path("items");assertThat(current).hasSize(2);for(var holding:current)assertThat(holding.path("snapshotId").asText()).isEqualTo(byAccount.get(holding.at("/account/href").asText()));
 }
 @Test void restrictedVisibilityAndScopedCursorsStayFailClosed()throws Exception {
  var owners=populate(true);String allowed=owners.get(0),denied=owners.get(1);f.authorize(allowed);
  for(String sort:List.of("id","-id"))for(int limit:List.of(1,2,3,50)){
   var reference=f.read(query(sort,200,null)).path("items");assertThat(reference).hasSize(5);assertThat(reference).allSatisfy(c->assertThat(c.at("/account/href").asText()).isEqualTo("/v2/accounts/"+allowed));var walked=walk(query(sort,limit,null),reference,"restricted-"+sort+"-"+limit);assertThat(walked.path("concatenated")).isEqualTo(reference);
  }
  var first=f.read(query("id",1,null));String next=first.at("/next/href").asText();f.status(next+"&accountId="+allowed,"owner",422);f.status(next,"other",422);f.status("/v2/holdings?view=observations&accountId="+denied,"owner",403);
  var selected=f.read(query("id",200,allowed)).at("/items/0/snapshotId").asText();f.status("/v2/holdings?accountId="+denied+"&snapshotId="+selected,"owner",403);assertThat(f.read("/v2/holdings").path("items")).hasSize(1);
 }
}
