package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.JsonNode;
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

/** Actual legacy parser fixture's missing sweep-fund units; synthetic source, no cash/NAV assumption. */
class PortfolioUnquantifiedCustodyTest {
 @TempDir Path directory;
 @Test void missingUnitsStayNullWhileReportedValueAndOriginalRemainIndependentlyInspectable()throws Exception{
  try(var db=new SqliteEvidenceStore(directory.resolve("custody.sqlite3").toString())){
   String url=db.getConnection().getMetaData().getURL();var accounts=new AccountDirectory(url);String account=accounts.bind("test","A1");var old=new PositionReadService(db,JSON);var artifacts=new BrokerageArtifacts(url,JSON,old);var imported=artifacts.ingest(account,"quantity-source.csv","POSITIONS",PositionsTest.csv(PositionsTest.BODY,"Oct-05-2026").getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());assertThat(imported.status()).isEqualTo("ACCEPTED");var repo=new PortfolioRepository(db,JSON);var sources=new PortfolioSources(repo,JSON,accounts);sources.refresh(Set.of(account));
   var holdings=repo.list(Kind.HOLDING,Set.of(account));assertThat(holdings).hasSize(5);var holding=holdings.stream().filter(h->h.value().path("quantity").isNull()).findFirst().orElseThrow();String[] source=PositionsTest.BODY.lines().filter(l->l.contains(",Cash,SPAXX**,")).findFirst().orElseThrow().split(",",-1);assertThat(source[5]).isEmpty();var actual=holding.value();assertThat(actual.path("quantity").isNull()).isTrue();assertThat(actual.path("side").asText()).isEqualTo("UNKNOWN");assertThat(actual.path("unit").asText()).isEqualTo("SOURCE_UNIT");assertThat(actual.path("kind").asText()).isEqualTo("SECURITY");assertThat(number(actual.at("/reportedMarketValue/value"))).isEqualByComparingTo(new java.math.BigDecimal(source[6]));assertThat(actual.at("/reportedMarketValue/asOf").isNull()).isTrue();assertThat(actual.at("/evidence/0/artifact/href").asText()).endsWith(imported.artifactId());
   assertThat(repo.get(actual.at("/instrument/href").asText()).orElseThrow().value().path("kind").asText()).isEqualTo("OTHER");for(var c:repo.list(Kind.CONSTRUCTION,Set.of(account)))for(var leaf:leaves(c.value().path("composition")))assertThat(leaf.at("/allocation/holding/href").asText()).isNotEqualTo(holding.uri());
   var summaries=new PortfolioReadService(repo,sources).snapshots(Set.of(account));assertThat(summaries.get(0).path("holdingCount").asInt()).isEqualTo(5);var reconciliation=new PortfolioReconciliation(repo).calculate(account,java.time.Instant.now());assertThat(reconciliation.path("coverage").asText()).isEqualTo("INCOMPLETE");assertThat(reconciliation.path("warnings").toString()).contains("HOLDING_RECONCILIATION_CONFLICT");assertThat(reconciliation.path("balances")).hasSize(4);
   try(var c=repo.connection()){var falseComplete=actual.deepCopy();falseComplete.put("snapshotCoverage","COMPLETE_REPORTED");assertThatThrownBy(()->repo.put(c,new Document(Kind.HOLDING,holding.uri(),account,falseComplete,holding.snapshot(),holding.sourceKey()))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Unknown held quantity");}
   sources.refresh(Set.of(account));assertThat(repo.get(holding.uri()).orElseThrow().value()).isEqualTo(actual);var output=Path.of("build/portfolio-responses");Files.createDirectories(output);var capture=obj().put("path",holding.uri()).put("caller","synthetic-unquantified-source-test");capture.set("body",actual);Files.writeString(output.resolve(UUID.randomUUID()+".json"),capture.toString());
  }
 }
}
