package com.wheelwright.evidence.v2;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class ClosedTradeReportTest extends ExecutionFixtures {
 Map<String,Object> transaction(String id,String order,String action,String at,String quantity,String net,boolean estimate){var r=row(id,order,action,at,net);r.put("netCash",net);r.put("quantity",quantity);r.put("estimatedFee",estimate);return r;}
 @SuppressWarnings("unchecked")List<ClosedTradeReport.Trade> trades(Map<String,Object> r){return (List<ClosedTradeReport.Trade>)r.get("trades");}
 Map<String,Object> report(List<Map<String,Object>> rows)throws Exception{return ClosedTradeReport.project(history(rows),"2026-10-01","2026-10-29","America/Denver",10,null,true,now,json);}
 @Test void P1P3P4P5P7_knownRoundTripIncludesEarlierOpeningAndAllReportedNetChargesWithoutDepositOrOpenCreditProfit()throws Exception{
  var open=transaction("open","opening","Sell to Open","2026-09-30T14:00:00Z","1","99.00",false);
  var close=transaction("close","closing","Buy to Close","2026-10-15T14:00:00Z","1","-21.25",false);
  var deposit=transaction("deposit",null,null,"2026-10-10T14:00:00Z","1","1000",false);deposit.put("kind","MONEY_MOVEMENT");deposit.put("symbol",null);
  var unclosed=transaction("unclosed","another","Sell to Open","2026-10-28T14:00:00Z","1","200",false);unclosed.put("symbol","OTHER");
  var r=report(List.of(open,close,deposit,unclosed));assertThat(trades(r)).hasSize(1);var t=trades(r).getFirst();assertThat(t.netPnl().value()).isEqualTo("77.75");assertThat(t.netPnl().outcome()).isEqualTo("WIN");assertThat(t.openingTransactions()).containsExactly("open");
  var totals=(ClosedTradeReport.Totals)r.get("totals");assertThat(totals.netPnl().value()).isEqualTo("77.75");assertThat(totals.winners()).isEqualTo(1);assertThat(totals.losers()).isEqualTo(0);assertThat(r).doesNotContainKeys("unrealizedPnl","accountPerformance");
 }
 @Test void estimatedFeesRemainReportedAndAreNotReplacedByZeroOrDropped()throws Exception{
  var r=report(List.of(transaction("o","one","Sell to Open","2026-09-30T14:00:00Z","1","9.50",true),transaction("c","two","Buy to Close","2026-10-29T13:30:00Z","1","-5.25",true)));
  assertThat(trades(r).getFirst().netPnl().value()).isEqualTo("4.25");assertThat(trades(r).getFirst().netPnl().status()).isEqualTo("QUALIFIED_ESTIMATED_FEES");assertThat(((ClosedTradeReport.Totals)r.get("totals")).netPnl().status()).isEqualTo("QUALIFIED_ESTIMATED_FEES");
 }
 @Test void P2P6_multipleCohortsPartialCloseMissingNetAndReversalsWithholdRowsAndTotalsWithoutFifoGuessing()throws Exception{
  for(String specimen:List.of("multiple","partial","missing-net","reversal")){
   var o=transaction("o","open","Sell to Open","2026-09-30T14:00:00Z","1","9",false);var c=transaction("c","close","Buy to Close","2026-10-29T13:30:00Z","1","-3",false);var rows=new ArrayList<Map<String,Object>>(List.of(o,c));
   if(specimen.equals("multiple"))rows.add(transaction("o2","other-open","Sell to Open","2026-09-29T14:00:00Z","1","8",false));
   if(specimen.equals("partial"))c.put("quantity","0.5");if(specimen.equals("missing-net"))c.put("netCash",null);
   if(specimen.equals("reversal")){var reverse=transaction("rev","reversal",null,"2026-10-29T13:31:00Z","1","3",false);reverse.put("reversesSourceId","c");rows.add(reverse);}
   var r=report(rows);assertThat(((ClosedTradeReport.Totals)r.get("totals")).netPnl().value()).as(specimen).isNull();assertThat(((ClosedTradeReport.Totals)r.get("totals")).winners()).isNull();
  }
 }
 @Test void totalsAreBackendOwnedAndWinnersLosersDoNotNetOutMissingEvidence()throws Exception{
  var rows=new ArrayList<Map<String,Object>>();for(int n=0;n<2;n++){var o=transaction("o"+n,"open"+n,"Sell to Open","2026-09-30T14:00:00Z","1",n==0?"10":"2",false);o.put("symbol","SYM"+n);var c=transaction("c"+n,"close"+n,"Buy to Close","2026-10-29T13:30:00Z","1","-5",false);c.put("symbol","SYM"+n);rows.add(o);rows.add(c);}
  var totals=(ClosedTradeReport.Totals)report(rows).get("totals");assertThat(totals.netPnl().value()).isEqualTo("2");assertThat(totals.winners()).isEqualTo(1);assertThat(totals.losers()).isEqualTo(1);
 }
 @Test void mixedCurrenciesWithholdTotalsAndAlreadyNetChargesAreNotSubtractedTwice()throws Exception {
  var rows=new ArrayList<Map<String,Object>>();for(int n=0;n<2;n++){
   var o=transaction("o"+n,"open"+n,"Sell to Open","2026-09-30T14:00:00Z","1","10.00",false);var c=transaction("c"+n,"close"+n,"Buy to Close","2026-10-29T13:30:00Z","1","-5.00",false);
   for(var r:List.of(o,c)){r.put("symbol","SYM"+n);r.put("currency",n==0?"USD":"EUR");r.put("commission","123.45");r.put("fees","67.89");}rows.add(o);rows.add(c);
  }
  var result=report(rows);assertThat(trades(result)).allSatisfy(t->assertThat(t.netPnl().value()).isEqualTo("5.00"));assertThat(((ClosedTradeReport.Totals)result.get("totals")).netPnl().value()).isNull();
 }
 @Test void cursorIsBoundToPeriodModeEvidenceAndWholeTrades()throws Exception {
  var rows=new ArrayList<Map<String,Object>>();for(int n=0;n<2;n++){var o=transaction("o"+n,"open"+n,"Sell to Open","2026-09-30T14:00:00Z","1","10",false);var c=transaction("c"+n,"close"+n,"Buy to Close","2026-10-29T13:30:00Z","1","-5",false);o.put("symbol","S"+n);c.put("symbol","S"+n);rows.add(o);rows.add(c);}
  var first=ClosedTradeReport.project(history(rows),"2026-10-01","2026-10-29","America/Denver",1,null,true,now,json);String cursor=(String)first.get("nextCursor");assertThat(trades(first)).hasSize(1);assertThat(((ClosedTradeReport.Totals)first.get("totals")).matchedTrades()).isEqualTo(2);
  var second=ClosedTradeReport.project(history(rows),"2026-10-01","2026-10-29","America/Denver",1,cursor,true,now,json);assertThat(trades(second)).hasSize(1);assertThat(second.get("nextCursor")).isNull();assertThat(trades(second).getFirst().id()).isNotEqualTo(trades(first).getFirst().id());
  assertThatThrownBy(()->ClosedTradeReport.project(history(rows),"2026-10-01","2026-10-29","America/Denver",1,cursor,false,now,json)).isInstanceOf(TransactionHistory.InvalidCursor.class);
 }
 @Test void equivalentQuantityScalesMatchWithoutChangingSourcePrecision()throws Exception {
  var open=transaction("open","opening","Sell to Open","2026-09-30T14:00:00Z","1","10.005",true);
  var close=transaction("close","closing","Buy to Close","2026-10-29T13:30:00Z","1.000","-5.001",true);
  var result=report(List.of(open,close));assertThat(trades(result).getFirst().netPnl().value()).isEqualTo("5.004");
  assertThat(open.get("quantity")).isEqualTo("1");assertThat(close.get("quantity")).isEqualTo("1.000");
 }
}
