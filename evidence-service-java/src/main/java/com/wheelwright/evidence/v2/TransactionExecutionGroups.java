package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;

/** Qualified execution projection of Account-owned ledger observations, not an Order or P/L engine. */
public final class TransactionExecutionGroups {
    private TransactionExecutionGroups() {}
    public record Period(String from,String through,String timeZone,String startInclusive,String endExclusive,String requestedCutoff) {}
    public record Coverage(String status,String scannedThrough,String observedFrom,String observedThrough,String traversal,
                           String snapshotConsistency,String lifetimeCoverage,boolean negativeConclusionSupported,int unknownExecutionTimes) {}
    /** Backend-established bounds only; never populated from a request or inferred from first/last trades. */
    record VerifiedWindow(String accountId,Instant from,Instant through) {}
    public record Cash(String status,String value,String currency,String method) {}
    public record Leg(String transactionId,String symbol,String sourceAction,String executedAt,String sourceTransactionDate,
                      String quantity,String price,Map<String,Object> provenance) {}
    public record Group(String sourceOrderId,List<String> underlyingSymbols,String classification,String firstExecutedAt,String lastExecutedAt,
                        String fillCompleteness,String groupingBasis,Cash reportedGrossCashFlow,List<Leg> reportedExecutions,List<String> qualifications) {}
    public record Counts(int closingOrderGroups,int openingOrderGroups,int mixedOrderGroups,int unresolvedOrderGroups) {}

    @SuppressWarnings("unchecked")
    static Map<String,Object> project(Map<String,Object> history,String from,String through,String timeZone,int limit,String cursor,
                                     boolean policy,Instant now,ObjectMapper json)throws Exception {
        return project(history,from,through,timeZone,limit,cursor,policy,now,json,null);
    }
    @SuppressWarnings("unchecked")
    static Map<String,Object> project(Map<String,Object> history,String from,String through,String timeZone,int limit,String cursor,
                                     boolean policy,Instant now,ObjectMapper json,VerifiedWindow verified)throws Exception {
        if(!"TASTYTRADE".equals(history.get("provider")))throw new UnsupportedOperationException("execution-time source unavailable");
        var zone=ZoneId.of(timeZone);var start=LocalDate.parse(from).atStartOfDay(zone).toInstant();
        var end=LocalDate.parse(through).plusDays(1).atStartOfDay(zone).toInstant();
        var cutoff=now.isBefore(end)?now:end;
        if(!start.isBefore(end))throw new IllegalArgumentException("invalid execution period");
        var period=new Period(from,through,timeZone,start.toString(),end.toString(),cutoff.toString());
        var rows=(List<Map<String,Object>>)history.get("transactions");
        var reversed=new HashSet<String>();for(var row:rows)if(row.get("reversesSourceId")!=null)reversed.add(row.get("reversesSourceId").toString());
        var grouped=new TreeMap<String,List<Map<String,Object>>>();int unknown=0;
        for(var row:rows) {
            if(!Objects.equals(history.get("accountId"),row.get("accountId")))throw new IllegalArgumentException("foreign transaction scope");
            if(!"TRADE".equals(row.get("kind")))continue;
            if(row.get("executedAt")==null){unknown++;continue;}
            var executed=OffsetDateTime.parse(row.get("executedAt").toString()).toInstant();
            if(executed.isBefore(start)||!executed.isBefore(end)||executed.isAfter(cutoff))continue;
            var key=row.get("orderId");
            String identity=key==null?"unassociated:"+row.get("transactionId"):"order:"+key;
            grouped.computeIfAbsent(identity,k->new ArrayList<>()).add(row);
        }
        var groups=new ArrayList<Group>();
        for(var entry:grouped.entrySet())groups.add(group(entry.getValue(),reversed,entry.getKey().startsWith("order:")));
        groups.sort(Comparator.comparing(Group::lastExecutedAt).reversed().thenComparing(g->Objects.toString(g.sourceOrderId(),"")));
        int closing=0,opening=0,mixed=0,unresolved=0;
        for(var group:groups)switch(group.classification()){case "CLOSING"->closing++;case "OPENING"->opening++;case "MIXED"->mixed++;default->unresolved++;}
        String signature=BrokerageArtifacts.sha(json.writeValueAsBytes(List.of(history.get("accountId"),from,through,timeZone,limit,policy,groups)));
        int offset=0;
        if(cursor!=null)try {
            String[] parts=new String(Base64.getUrlDecoder().decode(cursor),StandardCharsets.UTF_8).split(":",-1);
            if(parts.length!=2||!parts[0].equals(signature)||!parts[1].matches("[0-9]{1,8}"))throw new IllegalArgumentException();
            offset=Integer.parseInt(parts[1]);if(offset<=0||offset>=groups.size())throw new IllegalArgumentException();
        }catch(Exception e){throw new TransactionHistory.InvalidCursor();}
        int last=Math.min(offset+limit,groups.size());
        // A complete provider traversal through an upper cutoff does not establish a lower coverage bound.
        boolean verifiedPeriod=verified!=null&&Objects.equals(verified.accountId(),history.get("accountId"))&&
                !verified.from().isAfter(start)&&!verified.through().isBefore(cutoff)&&!cutoff.isBefore(start)&&
                Boolean.TRUE.equals(history.get("complete"))&&unknown==0;
        var coverage=new Coverage(verifiedPeriod?"VERIFIED_TO_CUTOFF":"PERIOD_COMPLETENESS_NOT_ESTABLISHED",(String)history.get("requestedThrough"),
                (String)history.get("observedFrom"),(String)history.get("observedThrough"),(String)history.get("providerTraversal"),
                (String)history.get("providerSnapshotConsistency"),(String)history.get("lifetimeCoverage"),verifiedPeriod&&closing==0&&mixed==0&&unresolved==0,unknown);
        var result=new LinkedHashMap<String,Object>();
        for(String key:List.of("requestId","accountId","provider","environment","evidenceMode","freshness","acquisitionOutcome","checkedAt"))result.put(key,history.get(key));
        result.put("queryMode",policy?"POLICY":"RETAINED_ONLY");result.put("view","execution-groups");result.put("period",period);result.put("coverage",coverage);
        result.put("counts",new Counts(closing,opening,mixed,unresolved));result.put("groups",groups.subList(offset,last));result.put("pageComplete",last==groups.size());
        result.put("nextCursor",last==groups.size()?null:Base64.getUrlEncoder().withoutPadding().encodeToString((signature+":"+last).getBytes(StandardCharsets.UTF_8)));
        result.put("qualifications",List.of("Counts describe source-reported execution groups in the selected Account/instant interval, not strategy association or full Order status.",
                "Execution time, source transaction date, order submission and acquisition clocks are distinct. No Order submission date is supplied by this transaction projection.",
                (verifiedPeriod?"Verified backend source bounds cover this selected interval through the cutoff only. A negative is limited to that verified scope.":"No verified lower coverage bound exists for this source scan. An empty result cannot establish no executions. Last observed transaction date is not an end-of-coverage assertion."),
                "Reported transaction cash flow is not realized P/L, monthly P/L, premium earned or account performance. Deposits are not trade executions."));
        return result;
    }
    private static Group group(List<Map<String,Object>> rows,Set<String> reversed,boolean associated) {
        rows.sort(Comparator.comparing(r->OffsetDateTime.parse(r.get("executedAt").toString()).toInstant()));
        var actions=new HashSet<String>();var legs=new ArrayList<Leg>();boolean conflict=false,known=true;String currency=null;BigDecimal gross=BigDecimal.ZERO;
        for(var row:rows) {
            String action=Objects.toString(row.get("sourceAction"),"").strip().toUpperCase(Locale.ROOT).replace(' ','_');
            actions.add(Set.of("BUY_TO_CLOSE","SELL_TO_CLOSE").contains(action)?"CLOSING":Set.of("BUY_TO_OPEN","SELL_TO_OPEN").contains(action)?"OPENING":"UNKNOWN");
            if(row.get("reversesSourceId")!=null||reversed.contains(Objects.toString(row.get("sourceTransactionId"),"")))conflict=true;
            if(row.get("value")==null||row.get("currency")==null)known=false;
            else {String c=row.get("currency").toString();if(currency!=null&&!currency.equals(c))known=false;currency=c;gross=gross.add(new BigDecimal(row.get("value").toString()));}
            @SuppressWarnings("unchecked") var provenance=(Map<String,Object>)row.get("provenance");
            legs.add(new Leg((String)row.get("transactionId"),(String)row.get("symbol"),(String)row.get("sourceAction"),(String)row.get("executedAt"),
                    (String)row.get("transactionDate"),(String)row.get("quantity"),(String)row.get("price"),provenance));
        }
        String classification=conflict||!associated||actions.contains("UNKNOWN")?"UNRESOLVED":actions.size()>1?"MIXED":actions.iterator().next();
        var cash=new Cash(conflict?"CONFLICT":known?"QUALIFIED":"UNAVAILABLE",known&&!conflict?gross.toPlainString():null,known?currency:null,"SUM_REPORTED_TRANSACTION_VALUES_NOT_PNL");
        return new Group(associated?(String)rows.getFirst().get("orderId"):null,rows.stream().map(r->(String)r.get("underlyingSymbol")).filter(Objects::nonNull).distinct().sorted().toList(),classification,rows.getFirst().get("executedAt").toString(),rows.getLast().get("executedAt").toString(),
                "NOT_ESTABLISHED_BY_TRANSACTIONS",associated?"ACCOUNT_BROKER_ORDER_ID":"UNASSOCIATED_SOURCE_TRANSACTION",cash,List.copyOf(legs),List.of(
                "Only reported executions in this interval are included; other fills/legs can exist. No complete-fill status, Order purpose or Position association is inferred.",
                "Closing/opening classification uses source open/close actions, never buy/sell alone or strike geometry. Mixed/unknown/reversed records are not confirmed exits.",
                "Gross cash flow sums explicit broker-reported transaction values in one known currency before fees; no contract multiplier or opening basis is inferred."));
    }
}
