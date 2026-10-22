package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Native-ID and exact reported-fill/ledger specimens, explicitly synthetic. No live broker or Position inference. */
class PortfolioFillEvidenceTest {
 @TempDir Path directory;
 String retain(PortfolioRepository repo,String account,byte[] bytes)throws Exception{String id=UUID.randomUUID().toString();try(var c=repo.connection();var q=c.prepareStatement("INSERT INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,id);q.setString(3,BrokerageArtifacts.sha(bytes));q.setString(4,"application/json");q.setInt(5,bytes.length);q.setBytes(6,bytes);q.setString(7,"2026-10-14T19:21:00Z");q.executeUpdate();}return id;}
 @Test void reportedCashNeedsNoInventedMultiplierAndCorrectionsDoNotNeedASecondRead()throws Exception{
  try(var db=new SqliteEvidenceStore(directory.resolve("source.sqlite3").toString())){
   var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());String account=accounts.bind("tt","TASTYTRADE","TEST1234");var repo=new PortfolioRepository(db,JSON);var fixture=JSON.readTree(Files.readString(Path.of("../scripts/fixtures/tt-live-economic-observed.json")));var raw=fixture.path("orders").get(2).deepCopy();((ObjectNode)raw).put("id","101");var page=obj().put("context","/accounts/TEST1234/orders");page.set("data",obj().set("items",array().add(raw)));page.set("pagination",obj().put("page-offset",0).put("total-pages",1).put("total-items",1));String orderArtifact=retain(repo,account,JSON.writeValueAsBytes(page));try(var c=repo.connection()){new PortfolioOrderSources(repo).admit(c,accounts.get(account).orElseThrow(),orderArtifact,true);}
   var order=repo.list(Kind.ORDER,Set.of(account)).getFirst();var leg=order.value().path("legs").get(0);var fill=leg.path("fills").get(0);assertThat(fill.path("multiplier").isNull()).isTrue();String symbol=repo.get(leg.at("/instrument/href").asText()).orElseThrow().value().path("symbol").asText();
   var transaction=obj().put("id",201).put("account-number","TEST1234").put("transaction-date","2026-10-14").put("transaction-type","Trade").put("action","Buy to Open").put("order-id",101).put("symbol",symbol).put("instrument-type","Equity Option").put("currency","USD").put("quantity",fill.path("quantity").asText()).put("price",fill.path("price").asText()).put("executed-at",fill.path("executedAt").asText()).put("value","49").put("value-effect","Debit").put("net-value","50.02").put("net-value-effect","Debit").put("is-estimated-fee",false);var txpage=obj();txpage.set("data",obj().set("items",array().add(transaction)));String txArtifact=retain(repo,account,JSON.writeValueAsBytes(txpage)),transactionId=UUID.randomUUID().toString(),observation=UUID.randomUUID().toString();var normalized=JSON.valueToTree(TastytradeTransactions.normalize(transaction,"TEST1234"));
   try(var c=repo.connection()){
    try(var q=c.prepareStatement("INSERT INTO account_transaction_observation VALUES (?,?,?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,observation);q.setString(3,transactionId);q.setString(4,"synthetic");q.setString(5,txArtifact);q.setInt(6,1);q.setString(7,"2026-10-14T19:21:00Z");q.setNull(8,java.sql.Types.VARCHAR);q.setString(9,normalized.toString());q.executeUpdate();}
    try(var q=c.prepareStatement("INSERT INTO account_transaction VALUES (?,?,?,?)")){q.setString(1,account);q.setString(2,transactionId);q.setString(3,"TASTYTRADE|PRODUCTION|201");q.setString(4,observation);q.executeUpdate();}
    new PortfolioFillEvidence(repo).refresh(c,accounts.get(account).orElseThrow());
   }
   var first=repo.get(order.uri()).orElseThrow().value();var cash=first.at("/legs/0/fills/0/cashFlow");assertThat(cash.path("value").asText()).isEqualTo("-49");assertThat(cash.path("origin").asText()).isEqualTo("BROKER_REPORTED");assertThat(first.at("/legs/0/fills/0/fees/value").asText()).isEqualTo("1.02");assertThat(first.at("/legs/0/fills/0/multiplier").isNull()).isTrue();assertThat(first.path("associations")).isEmpty();assertThat(repo.list(Kind.POSITION,Set.of(account))).isEmpty();
   // Newly constructed authorization falsifier: transaction-derived dollars require the transaction grant,
   // even when the independently reported Order fill remains readable.
   var current=repo.get(order.uri()).orElseThrow();
   for(boolean transactions:List.of(false,true)){
    var grants=new HashSet<String>();grants.add("account.orders.read:"+account);if(transactions)grants.add("account.transactions.read:"+account);
    var projected=PortfolioAuthorization.project(current,new BearerAuthenticator.Principal("reader",grants));
    assertThat(projected.at("/legs/0/fills/0/price")).isEqualTo(first.at("/legs/0/fills/0/price"));
    assertThat(projected.at("/legs/0/fills/0/executedAt")).isEqualTo(first.at("/legs/0/fills/0/executedAt"));
    for(String metric:List.of("cashFlow","fees")){
     var value=projected.at("/legs/0/fills/0/"+metric);
     if(transactions)assertThat(value.path("value")).isEqualTo(first.at("/legs/0/fills/0/"+metric+"/value"));
     else{assertThat(value.path("status").asText()).isEqualTo("REDACTED");assertThat(value.path("value").isNull()).isTrue();assertThat(value.path("asOf").isNull()).isTrue();assertThat(value.path("currency").isNull()).isTrue();}
    }
   }
   try(var c=repo.connection()){new PortfolioFillEvidence(repo).refresh(c,accounts.get(account).orElseThrow());}assertThat(repo.get(order.uri()).orElseThrow().value()).isEqualTo(first);
   // The existing owner appends a new original/observation and advances its mutable pointer.
   transaction.put("value","50").put("net-value","51.02");append(repo,account,transaction,transactionId,observation);try(var c=repo.connection()){new PortfolioFillEvidence(repo).refresh(c,accounts.get(account).orElseThrow());}assertThat(repo.get(order.uri()).orElseThrow().value().at("/legs/0/fills/0/cashFlow/value").asText()).isEqualTo("-50");
   var reversal=obj().put("id",202).put("account-number","TEST1234").put("transaction-date","2026-10-14").put("transaction-type","Money Movement").put("transaction-sub-type","Reversal").put("currency","USD").put("reverses-id",201).put("value","50").put("value-effect","Credit").put("net-value","51.02").put("net-value-effect","Credit");append(repo,account,reversal,UUID.randomUUID().toString(),null);try(var c=repo.connection()){new PortfolioFillEvidence(repo).refresh(c,accounts.get(account).orElseThrow());}var conflict=repo.get(order.uri()).orElseThrow().value();assertThat(conflict.at("/legs/0/fills/0/cashFlow/status").asText()).isEqualTo("CONFLICT");assertThat(conflict.at("/legs/0/fills/0/cashFlow/value").isNull()).isTrue();

  }
 }
 void append(PortfolioRepository repo,String account,ObjectNode raw,String transaction,String previous)throws Exception{
  var page=obj().put("context","/accounts/TEST1234/transactions");page.set("data",obj().set("items",array().add(raw)));page.set("pagination",obj().put("page-offset",0).put("total-pages",1).put("total-items",1));byte[] bytes=JSON.writeValueAsBytes(page);String artifact=retain(repo,account,bytes),observation=UUID.randomUUID().toString();var normalized=TastytradeTransactions.normalize(TastytradeTransactions.page(bytes,"TEST1234",0).items().getFirst(),"TEST1234");
  try(var c=repo.connection()){
   try(var q=c.prepareStatement("INSERT INTO account_transaction_observation VALUES (?,?,?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,observation);q.setString(3,transaction);q.setString(4,BrokerageArtifacts.sha(JSON.writeValueAsBytes(raw)));q.setString(5,artifact);q.setInt(6,1);q.setString(7,"2026-10-14T19:21:00Z");q.setString(8,previous);q.setString(9,JSON.writeValueAsString(normalized));q.executeUpdate();}
   try(var q=c.prepareStatement("INSERT INTO account_transaction VALUES (?,?,?,?) ON CONFLICT(account,source_key) DO UPDATE SET current_observation_id=excluded.current_observation_id")){q.setString(1,account);q.setString(2,transaction);q.setString(3,"TASTYTRADE|PRODUCTION|"+raw.path("id").asText());q.setString(4,observation);q.executeUpdate();}
  }
 }
 @Test void sourceJsonKeepsDecimalPrecisionAndRejectsDuplicateFacts()throws Exception{
  assertThat(JSON.readTree("{\"price\":1.5000000000000001}").path("price").decimalValue().toPlainString()).isEqualTo("1.5000000000000001");assertThatThrownBy(()->JSON.readTree("{\"price\":1,\"price\":2}")).isInstanceOf(com.fasterxml.jackson.core.JsonProcessingException.class);
 }
}
