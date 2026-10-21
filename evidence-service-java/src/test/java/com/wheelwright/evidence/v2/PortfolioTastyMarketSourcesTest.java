package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Retained repository captured-shape quote fixture, explicit profile currency, no live source claims. */
class PortfolioTastyMarketSourcesTest {
 @TempDir Path directory;
 @Test void ownSourceClocksExactDecimalsAndAccountScopeSurviveNormalization()throws Exception{
  for(String defect:List.of("valid","clockMissing","crossed","currencyUnknown","duplicate","unrequested","foreignAccount"))try(var db=new SqliteEvidenceStore(directory.resolve(defect+".sqlite3").toString())){
   var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());String account=accounts.bind("tt","TASTYTRADE","TEST1234");var repo=new PortfolioRepository(db,JSON);
   var fixture=JSON.readTree(Files.readString(Path.of("../scripts/fixtures/tt-live-economic-observed.json")));var items=array();items.add(fixture.path("quotes").get(0).deepCopy());items.add(fixture.path("spotQuotes").get(0).deepCopy());String sourceClock=items.get(0).path("updated-at").asText();var currencies=new HashMap<String,String>();
   try(var connection=repo.connection()){
    for(var raw:items){String symbol=raw.path("symbol").asText(),id=UUID.nameUUIDFromBytes(("instrument:TASTYTRADE:"+symbol).getBytes(StandardCharsets.UTF_8)).toString(),uri="/v2/instruments/"+id;var instrument=obj().put("id",id).put("kind",raw.path("instrument-type").asText().equals("Equity")?"EQUITY":"OPTION").put("symbol",symbol).put("currency","USD").putNull("option");instrument.set("self",link(uri));instrument.set("brokerAliases",array());instrument.set("evidence",array());instrument.set("warnings",array());repo.put(connection,new Document(Kind.INSTRUMENT,uri,null,instrument,null,symbol));currencies.put(symbol,defect.equals("currencyUnknown")?null:"USD");}
    switch(defect){case "clockMissing"->((ObjectNode)items.get(0)).remove("updated-at");case "crossed"->((ObjectNode)items.get(0)).put("bid","1000");case "duplicate"->items.add(items.get(0).deepCopy());case "unrequested"->currencies.remove(items.get(1).path("symbol").asText());case "foreignAccount"->((ObjectNode)items.get(0)).put("account-number","FOREIGN123");default->{}}
    var root=obj();root.set("data",obj().set("items",items));byte[] bytes=JSON.writeValueAsBytes(root);String artifact=UUID.randomUUID().toString();
    try(var q=connection.prepareStatement("INSERT INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,artifact);q.setString(3,BrokerageArtifacts.sha(bytes));q.setString(4,"application/json");q.setInt(5,bytes.length);q.setBytes(6,bytes);q.setString(7,"2026-10-14T19:22:00Z");q.executeUpdate();}
    var adapter=new PortfolioTastyMarketSources(repo);
    if(Set.of("duplicate","unrequested","foreignAccount").contains(defect)){assertThatThrownBy(()->adapter.admit(connection,accounts.get(account).orElseThrow(),artifact,currencies)).isInstanceOf(IllegalArgumentException.class);assertThat(repo.list(connection,Kind.MARKET_OBSERVATION,Set.of(account))).isEmpty();continue;}
    adapter.admit(connection,accounts.get(account).orElseThrow(),artifact,currencies);var before=repo.list(connection,Kind.MARKET_OBSERVATION,Set.of(account));adapter.admit(connection,accounts.get(account).orElseThrow(),artifact,currencies);assertThat(repo.list(connection,Kind.MARKET_OBSERVATION,Set.of(account))).isEqualTo(before);assertThat(before).hasSize(2);
    for(var observation:before){var value=observation.value();String symbol=repo.get(connection,value.at("/instrument/href").asText()).orElseThrow().value().path("symbol").asText();var raw=items.get(symbol.equals(items.get(0).path("symbol").asText())?0:1);assertThat(value.path("receivedAt").asText()).isEqualTo("2026-10-14T19:22:00Z");assertThat(value.path("freshness").asText()).isEqualTo("UNKNOWN");assertThat(value.at("/evidence/0/requiredCapability").asText()).isEqualTo("account.market.read:"+account);
     if(defect.equals("currencyUnknown"))assertThat(value.at("/mid/value").isNull()).isTrue();else if(defect.equals("crossed")&&symbol.equals(items.get(0).path("symbol").asText()))assertThat(value.at("/mid/status").asText()).isEqualTo("CONFLICT");else assertThat(value.at("/mid/value").asText()).isEqualTo(raw.path("mid").asText());
     if(defect.equals("clockMissing")&&symbol.equals(items.get(0).path("symbol").asText())){assertThat(value.path("observedAt").isNull()).isTrue();assertThat(value.at("/mid/asOf").isNull()).isTrue();}else assertThat(value.path("observedAt").asText()).isEqualTo(raw.path("updated-at").asText());
     var capture=obj().put("path",observation.uri()).put("caller","synthetic-market-source-test");capture.set("body",value);Path output=Path.of("build/portfolio-responses");Files.createDirectories(output);Files.writeString(output.resolve(UUID.randomUUID()+".json"),capture.toString());
    }
   }
  }
 }
}
