package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;

/** Narrow, auditable whole-package round trips. No FIFO, tax lots, Position governance or partial-lot allocation. */
final class ClosedTradeReport {
    private ClosedTradeReport() {}
    record Pnl(String status,String value,String currency,String outcome,String method) {}
    record Trade(String id,String label,String closingExecutedAt,String status,Pnl netPnl,List<String> openingTransactions,
                 List<String> closingTransactions,List<String> qualifications) {}
    record Totals(Pnl netPnl,Integer winners,Integer losers,Integer breakEven,int matchedTrades,int unavailableTrades) {}
    @SuppressWarnings("unchecked")
    static Map<String,Object> project(Map<String,Object> history,String from,String through,String zone,int limit,String cursor,
                                     boolean policy,Instant now,ObjectMapper json)throws Exception {
        var activity=TransactionExecutionGroups.project(history,from,through,zone,25000,null,policy,now,json);
        var groups=(List<TransactionExecutionGroups.Group>)activity.get("groups");var all=(List<Map<String,Object>>)history.get("transactions");
        var byOrder=new LinkedHashMap<String,List<Map<String,Object>>>();
        for(var r:all)if("TRADE".equals(r.get("kind"))&&r.get("orderId")!=null)byOrder.computeIfAbsent(r.get("orderId").toString(),k->new ArrayList<>()).add(r);
        var trades=new ArrayList<Trade>();int wins=0,losses=0,flat=0,matched=0,unavailable=0;BigDecimal total=BigDecimal.ZERO;String currency=null;boolean estimated=false;
        for(var group:groups) {
            if(group.classification().equals("OPENING"))continue;
            var close=byOrder.get(group.sourceOrderId());var candidates=new ArrayList<List<Map<String,Object>>>();
            if(group.classification().equals("CLOSING")&&close!=null&&close.stream().allMatch(r->inPeriod(r,from,through,zone,now)))for(var entry:byOrder.entrySet())
                if(!entry.getKey().equals(group.sourceOrderId())&&matches(entry.getValue(),close,all))candidates.add(entry.getValue());
            String label=group.underlyingSymbols().isEmpty()?"Reported closing group":String.join(" / ",group.underlyingSymbols());
            String id=UUID.nameUUIDFromBytes((history.get("accountId")+":reported-close:"+group.sourceOrderId()).getBytes(StandardCharsets.UTF_8)).toString();
            Pnl pnl=new Pnl("UNAVAILABLE",null,null,"UNAVAILABLE","OPEN_CLOSE_ASSOCIATION_NOT_ESTABLISHED");List<String> openingIds=List.of();String state="PROVISIONAL_GROUPING";
            var notes=new ArrayList<String>();
            if(candidates.size()==1) {
                var open=candidates.getFirst();openingIds=open.stream().map(r->r.get("transactionId").toString()).toList();var linked=new ArrayList<>(open);linked.addAll(close);
                var currencies=new HashSet<String>();BigDecimal net=BigDecimal.ZERO;boolean known=true,feeEstimate=false;
                for(var r:linked){if(r.get("netCash")==null||r.get("currency")==null)known=false;else{currencies.add(r.get("currency").toString());net=net.add(new BigDecimal(r.get("netCash").toString()));}if(!Boolean.FALSE.equals(r.get("estimatedFee")))feeEstimate=true;}
                if(known&&currencies.size()==1) {
                    String c=currencies.iterator().next();pnl=new Pnl(feeEstimate?"QUALIFIED_ESTIMATED_FEES":"QUALIFIED",net.toPlainString(),c,net.signum()>0?"WIN":net.signum()<0?"LOSS":"BREAK_EVEN","SUM_REPORTED_NET_CASH_FOR_UNIQUE_WHOLE_PACKAGE_ROUND_TRIP");
                    state="MATCHED_REPORTED_ROUND_TRIP";matched++;if(net.signum()>0)wins++;else if(net.signum()<0)losses++;else flat++;
                    if(currency!=null&&!currency.equals(c))currency="MIXED";else if(currency==null)currency=c;total=total.add(net);estimated|=feeEstimate;
                    notes.add("Exact native contracts, quantities and opposite open/close actions match one earlier opening Order group. No other retained transaction touches those contracts; no FIFO or partial allocation is assumed.");
                    notes.add("Net values are already broker-reported after charges; commissions/fees are not subtracted again. Missing fee components are never assumed zero.");
                    if(feeEstimate)notes.add("The broker flags fees as estimated or does not establish final-fee status. Net P/L is as reported, not final tax accounting.");
                }else{unavailable++;notes.add("Matched reported execution packages lack compatible known net-cash/currency values.");}
            }else{unavailable++;notes.add("No unique whole-package round trip is established. Missing openings, multiple cohorts, partial closes, reversals, other same-contract events or period-straddling closes require reconciliation; no accounting allocation is invented.");}
            trades.add(new Trade(id,label,group.lastExecutedAt(),state,pnl,openingIds,group.reportedExecutions().stream().map(TransactionExecutionGroups.Leg::transactionId).toList(),List.copyOf(notes)));
        }
        boolean totalsKnown=!trades.isEmpty()&&unavailable==0&&!"MIXED".equals(currency);
        Pnl totalPnl=totalsKnown?new Pnl(estimated?"QUALIFIED_ESTIMATED_FEES":"QUALIFIED",total.toPlainString(),currency,total.signum()>0?"WIN":total.signum()<0?"LOSS":"BREAK_EVEN","SUM_MATCHED_REPORTED_CLOSED_TRADE_NET_PNL"):
                new Pnl("UNAVAILABLE",null,null,"UNAVAILABLE","UNRESOLVED_TRADES_OR_CURRENCY_OR_EMPTY_COVERAGE");
        String signature=BrokerageArtifacts.sha(json.writeValueAsBytes(List.of(history.get("accountId"),from,through,zone,limit,policy,trades)));
        int offset=0;if(cursor!=null)try{String[] p=new String(Base64.getUrlDecoder().decode(cursor),StandardCharsets.UTF_8).split(":",-1);if(p.length!=2||!p[0].equals(signature)||!p[1].matches("[0-9]{1,8}"))throw new IllegalArgumentException();offset=Integer.parseInt(p[1]);if(offset<=0||offset>=trades.size())throw new IllegalArgumentException();}catch(Exception e){throw new TransactionHistory.InvalidCursor();}
        int end=Math.min(offset+limit,trades.size());var result=new LinkedHashMap<String,Object>();
        for(String key:List.of("requestId","accountId","provider","environment","evidenceMode","freshness","acquisitionOutcome","checkedAt","queryMode","period","coverage"))result.put(key,activity.get(key));
        result.put("view","closed-trades");result.put("metric","REPORTED_CLOSED_ROUND_TRIP_NET_PNL");result.put("totals",new Totals(totalPnl,totalsKnown?wins:null,totalsKnown?losses:null,totalsKnown?flat:null,matched,unavailable));
        result.put("trades",trades.subList(offset,end));result.put("pageComplete",end==trades.size());result.put("nextCursor",end==trades.size()?null:Base64.getUrlEncoder().withoutPadding().encodeToString((signature+":"+end).getBytes(StandardCharsets.UTF_8)));
        result.put("qualification","Reported matched closed trades only, recognized on completion of the reported closing executions. This is not total Account return, unrealized P/L, tax-lot accounting, or proof of complete period brokerage coverage. Opening executions outside the period are included in basis. Unmatched rows and totals remain unavailable; estimated fee status is preserved.");return result;
    }
    private static boolean inPeriod(Map<String,Object> row,String from,String through,String zone,Instant now) {
        if(row.get("executedAt")==null)return false;var instant=OffsetDateTime.parse(row.get("executedAt").toString()).toInstant();var date=instant.atZone(ZoneId.of(zone)).toLocalDate();return !date.isBefore(LocalDate.parse(from))&&!date.isAfter(LocalDate.parse(through))&&!instant.isAfter(now);
    }
    private static String action(Map<String,Object> r){return Objects.toString(r.get("sourceAction"),"").toUpperCase(Locale.ROOT).replace(' ','_');}
    private static Map<String,BigDecimal> quantities(List<Map<String,Object>> rows,boolean opening) {
        var q=new TreeMap<String,BigDecimal>();
        for(var r:rows){String a=action(r);String side=opening?a.equals("BUY_TO_OPEN")?"LONG":a.equals("SELL_TO_OPEN")?"SHORT":null:a.equals("SELL_TO_CLOSE")?"LONG":a.equals("BUY_TO_CLOSE")?"SHORT":null;
            if(side==null||r.get("symbol")==null||r.get("quantity")==null||r.get("executedAt")==null||r.get("reversesSourceId")!=null)return null;
            var n=new BigDecimal(r.get("quantity").toString());if(n.signum()<=0)return null;q.merge(r.get("symbol")+"|"+side,n,BigDecimal::add);}
        return q;
    }
    private static boolean matches(List<Map<String,Object>> opening,List<Map<String,Object>> closing,List<Map<String,Object>> all) {
        var o=quantities(opening,true);var c=quantities(closing,false);if(o==null||c==null||!o.equals(c))return false;
        var lastOpen=opening.stream().map(r->OffsetDateTime.parse(r.get("executedAt").toString()).toInstant()).max(Comparator.naturalOrder()).orElseThrow();
        var firstClose=closing.stream().map(r->OffsetDateTime.parse(r.get("executedAt").toString()).toInstant()).min(Comparator.naturalOrder()).orElseThrow();if(lastOpen.isAfter(firstClose))return false;
        var included=new HashSet<String>();var symbols=new HashSet<String>();var sourceIds=new HashSet<String>();var orders=new HashSet<String>();
        for(var rs:List.of(opening,closing))for(var r:rs){included.add(r.get("transactionId").toString());orders.add(r.get("orderId").toString());symbols.add(r.get("symbol").toString());sourceIds.add(Objects.toString(r.get("sourceTransactionId"),""));}
        for(var r:all)if(!included.contains(r.get("transactionId").toString())&&(symbols.contains(r.get("symbol"))||orders.contains(r.get("orderId"))||sourceIds.contains(r.get("reversesSourceId"))))return false;
        return true;
    }
}
