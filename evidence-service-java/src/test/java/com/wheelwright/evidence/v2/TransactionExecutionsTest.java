package com.wheelwright.evidence.v2;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

/** Controlled broker facts. Invented IDs/contracts/cash; not the Principal's real brokerage records. */
class ExecutionFixtures {
 final ObjectMapper json=new ObjectMapper();final String account="acct_"+"a".repeat(32);
 final Instant now=Instant.parse("2026-10-29T14:11:00Z");
 Map<String,Object> row(String id,String order,String action,String at,String amount){
  var r=new LinkedHashMap<String,Object>();r.put("accountId",account);r.put("transactionId",id);r.put("sourceTransactionId",id);r.put("orderId",order);r.put("sourceAction",action);r.put("executedAt",at);r.put("transactionDate",at==null?"2026-10-29":at.substring(0,10));r.put("kind","TRADE");r.put("value",amount);r.put("currency","USD");r.put("symbol","FIXTURE 261120P00010000");r.put("underlyingSymbol","FIXTURE");r.put("quantity","1");r.put("price","0.5");r.put("provenance",Map.of("artifactId","fixture-original","rowNumber",1));return r;
 }
 Map<String,Object> history(List<Map<String,Object>> rows){
  var h=new LinkedHashMap<String,Object>();h.put("requestId",UUID.randomUUID().toString());h.put("accountId",account);h.put("provider","TASTYTRADE");h.put("environment","PRODUCTION");h.put("transactions",rows);h.put("complete",true);h.put("requestedThrough",now.toString());h.put("observedFrom","2026-10-01");h.put("observedThrough","2026-10-29");h.put("providerTraversal","COMPLETE_AT_LAST_SUCCESS");h.put("providerSnapshotConsistency","UNVERIFIED");h.put("lifetimeCoverage","UNKNOWN");return h;
 }
 Map<String,Object> view(Map<String,Object> history,String from,String through)throws Exception{return TransactionExecutionGroups.project(history,from,through,"America/Denver",10,null,true,now,json);}
 @SuppressWarnings("unchecked") List<TransactionExecutionGroups.Group> groups(Map<String,Object> v){return (List<TransactionExecutionGroups.Group>)v.get("groups");}
}
class TransactionExecutionsTest extends ExecutionFixtures {
 @Test void E2E3E4_executionClockNotSubmissionAndNativeOrderNotLegCount()throws Exception {
  var close1=row("one","8001","Sell to Close","2026-10-29T09:30:04-04:00","60.01");close1.put("sourceCreatedAt","2026-10-14T14:00:00-04:00");
  var close2=row("two","8001","Buy to Close","2026-10-29T13:30:04Z","-65.23");
  var open1=row("three","8002","Buy to Open","2026-10-28T14:00:00Z","-25");var open2=row("four","8002","Sell to Open","2026-10-28T14:00:00Z","40");
  var older=row("five","8003","Buy to Close","2026-10-27T14:00:00Z","-10");var h=history(List.of(close1,close2,open1,open2,older));
  var today=view(h,"2026-10-29","2026-10-29");assertThat(groups(today)).hasSize(1);var group=groups(today).getFirst();
  assertThat(group.sourceOrderId()).isEqualTo("8001");assertThat(group.classification()).isEqualTo("CLOSING");assertThat(group.reportedExecutions()).hasSize(2);assertThat(group.reportedGrossCashFlow().value()).isEqualTo("-5.22");assertThat(group.fillCompleteness()).isEqualTo("NOT_ESTABLISHED_BY_TRANSACTIONS");
  assertThat(((TransactionExecutionGroups.Counts)today.get("counts")).closingOrderGroups()).isEqualTo(1);
  assertThat(groups(view(h,"2026-10-28","2026-10-28"))).singleElement().satisfies(g->assertThat(g.classification()).isEqualTo("OPENING"));
  assertThat(groups(view(h,"2026-10-27","2026-10-27"))).singleElement().satisfies(g->assertThat(g.sourceOrderId()).isEqualTo("8003"));
 }
 @Test void E1E5E7_unknownCoverageMixedMissingActionAndUnassociatedFillsNeverBecomeZeroOrExits()throws Exception {
  var stale=history(List.of());stale.put("requestedThrough","2026-10-15T12:00:00Z");stale.put("complete",false);
  assertThat(((TransactionExecutionGroups.Coverage)view(stale,"2026-10-29","2026-10-29").get("coverage")).negativeConclusionSupported()).isFalse();
  var rows=List.of(row("a","mixed","Buy to Close","2026-10-29T14:00:00Z","-1"),row("b","mixed","Sell to Open","2026-10-29T14:00:00Z","2"),row("c",null,"Sell to Close","2026-10-29T14:00:00Z","3"),row("d","unknown","Sell","2026-10-29T14:00:00Z","4"),row("e","no-time","Buy to Close",null,"-1"));
  var result=view(history(rows),"2026-10-29","2026-10-29");var counts=(TransactionExecutionGroups.Counts)result.get("counts");assertThat(counts.closingOrderGroups()).isZero();assertThat(counts.mixedOrderGroups()).isEqualTo(1);assertThat(counts.unresolvedOrderGroups()).isEqualTo(2);assertThat(((TransactionExecutionGroups.Coverage)result.get("coverage")).unknownExecutionTimes()).isEqualTo(1);
 }
 @Test void E6_verifiedBackendBoundsPermitOnlyScopedNegativeNeverFirstLastTradeDateInference()throws Exception {
  var h=history(List.of());var start=Instant.parse("2026-10-29T06:00:00Z");
  var result=TransactionExecutionGroups.project(h,"2026-10-29","2026-10-29","America/Denver",10,null,true,now,json,new TransactionExecutionGroups.VerifiedWindow(account,start,now));
  assertThat(((TransactionExecutionGroups.Coverage)result.get("coverage")).negativeConclusionSupported()).isTrue();
  assertThat(((TransactionExecutionGroups.Coverage)view(h,"2026-10-29","2026-10-29").get("coverage")).negativeConclusionSupported()).isFalse();
 }
 @Test void P3P4P6P8_depositsOpeningCreditsAndMissingBasisDoNotBecomePnlAndScopeDoesNotLeak()throws Exception {
  var deposit=row("d",null,null,"2026-10-29T14:00:00Z","900");deposit.put("kind","MONEY_MOVEMENT");
  var opening=row("o","order","Sell to Open","2026-10-29T14:00:00Z","20");var h=history(List.of(deposit,opening));
  var result=view(h,"2026-10-01","2026-10-29");assertThat(groups(result)).singleElement().satisfies(g->{assertThat(g.classification()).isEqualTo("OPENING");assertThat(g.reportedGrossCashFlow().value()).isEqualTo("20");assertThat(g.reportedGrossCashFlow().method()).contains("NOT_PNL");});
  assertThat(result).doesNotContainKeys("pnl","realizedPnl","unrealizedPnl","accountPerformance");
  opening.put("accountId","foreign");assertThatThrownBy(()->view(h,"2026-10-01","2026-10-29")).isInstanceOf(IllegalArgumentException.class);
 }
 @Test void periodBoundariesHandleDstAndDifferentOperatorMarketDatesWithoutMovingExecutions()throws Exception {
  var h=history(List.of(row("t","o","Buy to Close","2026-10-30T05:30:00Z","-1")));
  var denver=view(h,"2026-10-29","2026-10-29"); // now fixture precedes this execution, so excluded by cutoff.
  assertThat(groups(denver)).isEmpty();
  var futureNow=Instant.parse("2026-10-30T06:00:00Z");
  assertThat(groups(TransactionExecutionGroups.project(h,"2026-10-29","2026-10-29","America/Denver",10,null,false,futureNow,json))).hasSize(1);
  assertThat(groups(TransactionExecutionGroups.project(h,"2026-10-29","2026-10-29","America/New_York",10,null,false,futureNow,json))).isEmpty();
  var dst=TransactionExecutionGroups.project(history(List.of()),"2026-11-01","2026-11-01","America/Denver",10,null,false,Instant.parse("2026-11-03T00:00:00Z"),json);
  var period=(TransactionExecutionGroups.Period)dst.get("period");assertThat(Duration.between(Instant.parse(period.startInclusive()),Instant.parse(period.endExclusive())).toHours()).isEqualTo(25);
 }
 @Test void reversedRowsAndMixedCurrencyCannotEstablishClosingCashOrPackageAndGroupsPageWithoutSplittingLegs()throws Exception {
  var first=row("a","one","Buy to Close","2026-10-29T14:00:00Z","-1");var reversal=row("b","one","Sell to Close","2026-10-29T14:00:00Z","1");reversal.put("reversesSourceId","a");
  var h=history(List.of(first,reversal,row("c","two","Buy to Close","2026-10-29T13:00:00Z","-2")));
  var result=TransactionExecutionGroups.project(h,"2026-10-29","2026-10-29","America/Denver",1,null,false,now,json);assertThat(groups(result)).singleElement().satisfies(g->{assertThat(g.classification()).isEqualTo("UNRESOLVED");assertThat(g.reportedExecutions()).hasSize(2);assertThat(g.reportedGrossCashFlow().value()).isNull();});
  var next=TransactionExecutionGroups.project(h,"2026-10-29","2026-10-29","America/Denver",1,(String)result.get("nextCursor"),false,now,json);assertThat(groups(next)).singleElement().satisfies(g->assertThat(g.sourceOrderId()).isEqualTo("two"));
 }
}
