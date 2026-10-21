package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Existing same-day Option Summary source mapping reused without margin/basis/reservation inference. */
class PortfolioFidelityFactsTest {
 @TempDir Path directory;
 @Test void capitalFactsRequireExactUniqueQuantityAndKeepTheirOwnOriginalAndDayPrecision()throws Exception{
  for(String specimen:List.of("supported","other-day","other-quantity","duplicate-custody"))try(var db=new SqliteEvidenceStore(directory.resolve(specimen+".sqlite3").toString())){
   var mapper=new ObjectMapper();var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());String account=accounts.bind("test","A1");var artifacts=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),mapper,new PositionReadService(db,mapper));
   String body="A1,Test PTS,ETFs,ETHA,Adjusted shares,66,3600,-5,Cash\nA1,Test PTS,Options,-ETHA1261016C20.5,Adjusted call,-2,-16,120,Cash\n";if(specimen.equals("duplicate-custody"))body+="A1,Test PTS,Options,-ETHA1261016C20.5,Adjusted call,-2,-16,120,Margin\n";
   artifacts.ingest(account,"positions.csv","POSITIONS",PositionsTest.csv(body,"Oct-05-2026").getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());String summary="Fidelity Investments - Option Summary A1\nQuote data as of "+(specimen.equals("other-day")?"10/04/2026":"10/05/2026")+".\nSymbol,Description,Strategy,Expiration & Strike,Quantity,Bid,Ask,Margin requirements\nETHA1,ETHA,Covered Call,Shares (ETHA),66,56.27,56.33,0\nETHA1,Adjusted call,Covered Call,ETHA1 OCT 16 2026 $20.50 CALL (ADJ),"+(specimen.equals("other-quantity")?"-1":"-2")+",--,--,40.86\n";
   var imported=artifacts.ingest(account,"summary.csv","OPTION_SUMMARY",summary.getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());assertThat(imported.status()).isEqualTo("ACCEPTED");var repo=new PortfolioRepository(db,mapper);new PortfolioSources(repo,mapper,accounts).refresh(Set.of(account));
   for(var holding:repo.list(Kind.HOLDING,Set.of(account)))if(holding.value().path("unit").asText().equals("CONTRACT")){var metric=holding.value().path("reportedCapitalRequirement");if(specimen.equals("supported")){assertThat(metric.path("value").asText()).isEqualTo("40.86");assertThat(metric.path("origin").asText()).isEqualTo("BROKER_REPORTED");assertThat(metric.path("asOf").isNull()).isTrue();assertThat(metric.path("evidence").get(0).at("/artifact/href").asText()).endsWith(imported.artifactId());assertThat(metric.path("evidence").get(0).path("observationPrecision").asText()).isEqualTo("DAY");assertThat(metric.path("assumptions").toString()).contains("no intraday timestamp");}else assertThat(metric.path("value").isNull()).as(specimen).isTrue();}
   for(var position:repo.list(Kind.POSITION,Set.of(account))){
    assertThat(position.value().path("sourceIdentifiers")).isNotEmpty();
    for(var alias:position.value().path("sourceIdentifiers"))assertThat(alias.path("identifier").asText()).isIn("ETHA","-ETHA1261016C20.5");
    assertThat(position.value().path("id").asText()).isNotEqualTo(position.sourceKey());
   }
   for(var instrument:repo.list(Kind.INSTRUMENT,Set.of()))assertThat(instrument.value().toString()).doesNotContain("ACCOUNT_SOURCE","/v2/artifacts/","/v2/accounts/");
   for(var construction:repo.list(Kind.CONSTRUCTION,Set.of(account)))for(var leaf:PortfolioJson.leaves(construction.value().path("composition")))if(leaf.path("kind").asText().equals("OPTION")){if(specimen.equals("supported"))assertThat(leaf.at("/economics/reportedCapitalRequirement/value").asText()).isEqualTo("40.86");assertThat(construction.value().at("/recognition/status").asText()).isEqualTo("UNCLASSIFIED");}
  }
 }
}
