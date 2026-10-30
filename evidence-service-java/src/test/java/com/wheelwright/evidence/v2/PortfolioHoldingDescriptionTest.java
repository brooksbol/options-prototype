package com.wheelwright.evidence.v2;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.Test;import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;import java.nio.charset.StandardCharsets;import java.time.Instant;import java.util.*;
import static org.assertj.core.api.Assertions.*;import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;
class PortfolioHoldingDescriptionTest {
 @TempDir Path directory;
 @Test void exactPrivateDescriptionDoesNotCreateSymbolOrForeignAccountAssociation()throws Exception{
  try(var db=new SqliteEvidenceStore(directory.resolve("descriptions.sqlite3").toString())){
   var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());var artifacts=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),JSON,new PositionReadService(db,JSON));var repo=new PortfolioRepository(db,JSON);var sources=new PortfolioSources(repo,JSON,accounts);
   String a=accounts.bind("pine","A1"),b=accounts.bind("birch","B1");
   for(var entry:Map.of(a,"A1,Pine,Stocks,OPAQUE001,Pine reported name,10,100,1,Cash\n",b,"B1,Birch,Stocks,OPAQUE001,Birch private name,20,200,2,Cash\n").entrySet())assertThat(artifacts.ingest(entry.getKey(),"positions.csv","POSITIONS",PositionsTest.csv(entry.getValue(),"Oct-05-2026").getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString()).status()).isEqualTo("ACCEPTED");
   sources.refresh(Set.of(a,b));var reader=new PortfolioReadService(repo,sources);var context=new PortfolioReadService.ReadContext();var caller=new BearerAuthenticator.Principal("reader",Set.of("account.holdings.read:"+a));var holding=repo.list(Kind.HOLDING,Set.of(a)).getFirst();var read=reader.read(holding,caller,Instant.parse("2026-10-29T16:00:00Z"),context);
   assertThat(read.path("sourceDescription").asText()).isEqualTo("Pine reported name");assertThat(read.at("/sourceInstrument/identifier").asText()).isEqualTo("OPAQUE001");assertThat(read.toString()).doesNotContain("Birch private name");assertThat(holding.value().has("sourceDescription")).isFalse();
   var altered=holding.value().deepCopy();((com.fasterxml.jackson.databind.node.ObjectNode)altered.path("sourceInstrument")).put("identifier","MISMATCH");assertThat(reader.read(new Document(Kind.HOLDING,holding.uri(),a,altered,holding.snapshot(),holding.sourceKey()),caller,Instant.now(),context).has("sourceDescription")).isFalse();
  }
 }
}
