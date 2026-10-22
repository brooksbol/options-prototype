package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.core.StreamReadFeature;
import com.fasterxml.jackson.databind.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.regex.Pattern;

/** Bounded inventory interpretation. Never recognizes strategies, openings or occurrences. */
public final class TastytradeHoldings {
    public static final String VERSION = "tastytrade-holdings-v1";
    private static final Pattern OPTION = Pattern.compile("([A-Z][A-Z0-9.]{0,9}) +([0-9]{6})([CP])([0-9]{8})");
    private static final ObjectMapper JSON = new ObjectMapper().enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
            .enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION.mappedFeature());
    private TastytradeHoldings() {}
    static JsonNode document(byte[] bytes) throws Exception {
        return JSON.readTree(bytes);
    }
    static JsonNode items(byte[] bytes) throws Exception {
        var root = document(bytes);
        if (root == null || !root.isObject() || !root.path("data").path("items").isArray()) throw invalid();
        // A partial response must never replace a complete retained holdings observation.
        var pagination = root.get("pagination");
        if (pagination != null && !pagination.isNull()) {
            if (!pagination.isObject() || !pagination.path("total-pages").isIntegralNumber() || !pagination.path("total-pages").canConvertToInt() ||
                    pagination.path("total-pages").intValue() > 1 || pagination.path("total-pages").intValue() < 0 ||
                    !pagination.path("page-offset").isIntegralNumber() || !pagination.path("page-offset").canConvertToInt() || pagination.path("page-offset").intValue() != 0)
                throw invalid();
        }
        return root.path("data").path("items");
    }
    private static IllegalArgumentException invalid() { return new IllegalArgumentException("invalid holdings observation"); }
    private static String text(JsonNode item,String key) {
        var v=item.get(key); if(v==null||!v.isTextual()||v.textValue().isBlank())throw invalid(); return v.textValue();
    }
    /** Disclosure recognizes the whole supported envelope; admission intentionally remains independent.
     * Supported field names follow the provider's List Account Positions schema. New fields are
     * retained/admitted as before, but cannot establish complete original-source disclosure scope.
     */
    static boolean sourceAccount(byte[] bytes,String brokerAccount) {
        try {
            var root=document(bytes);
            if(!onlyFields(root,Set.of("data","context","pagination")) ||
                    !onlyFields(root.path("data"),Set.of("items")))return false;
            if(root.has("context") && (!root.path("context").isTextual() ||
                    !root.path("context").textValue().equals("/accounts/"+brokerAccount+"/positions")))return false;
            var pagination=root.get("pagination");
            if(pagination!=null && !pagination.isNull()) {
                if(!onlyFields(pagination,Set.of("per-page","page-offset","item-offset","total-items","total-pages","current-item-count")))return false;
                for(var value:pagination)if(!value.isIntegralNumber()||!value.canConvertToInt()||value.intValue()<0)return false;
            }
            for(var item:items(bytes)) {
                if(!onlyFields(item,Set.of("account-number","symbol","instrument-type","quantity","quantity-direction",
                        "underlying-symbol","expires-at","close-price","average-open-price","average-yearly-market-close-price",
                        "average-daily-market-close-price","mark","mark-price","multiplier","cost-effect","is-suppressed",
                        "is-frozen","restricted-quantity","fixing-price","deliverable-type","realized-day-gain",
                        "realized-day-gain-effect","realized-day-gain-date","realized-today","realized-today-effect",
                        "realized-today-date","created-at","updated-at","order-id")) ||
                        !text(item,"account-number").equals(brokerAccount))return false;
                for(String required:Set.of("account-number","symbol","instrument-type","quantity","quantity-direction"))
                    if(!item.hasNonNull(required))return false;
                // No field in this supported item schema contains a nested document or array.
                var fields=item.fields();
                while(fields.hasNext()) {
                    var field=fields.next();
                    if(!sourceValue(field.getKey(),field.getValue()))return false;
                }
            }
            return true;
        }catch(Exception e){return false;}
    }
    private static boolean sourceValue(String key,JsonNode value) {
        if(value.isNull())return !Set.of("account-number","symbol","instrument-type","quantity","quantity-direction").contains(key);
        return switch(key) {
            case "account-number" -> value.isTextual(); // Exact owner match is checked separately.
            case "symbol" -> value.isTextual() && (OPTION.matcher(value.textValue()).matches() || value.textValue().matches("[A-Z][A-Z0-9./-]{0,19}"));
            case "underlying-symbol" -> value.isTextual() && value.textValue().matches("[A-Z][A-Z0-9./-]{0,19}");
            case "instrument-type" -> value.isTextual() && Set.of("Equity","Equity Option").contains(value.textValue());
            case "quantity-direction" -> value.isTextual() && Set.of("Long","Short").contains(value.textValue());
            case "cost-effect","realized-day-gain-effect","realized-today-effect" -> value.isTextual() && Set.of("Credit","Debit","None").contains(value.textValue());
            case "is-suppressed","is-frozen" -> value.isBoolean();
            case "deliverable-type" -> value.isTextual() && value.textValue().equals("Equity");
            case "order-id" -> value.isIntegralNumber() && value.canConvertToLong() && value.longValue()>=0;
            case "expires-at","created-at","updated-at" -> {
                if(!value.isTextual())yield false;
                OffsetDateTime.parse(value.textValue());yield true;
            }
            case "realized-day-gain-date","realized-today-date" -> {
                if(!value.isTextual())yield false;
                LocalDate.parse(value.textValue());yield true;
            }
            default -> { // Remaining recognized fields are numeric observations, never free text.
                if(!value.isNumber()&&!value.isTextual())yield false;
                new BigDecimal(value.asText());yield true;
            }
        };
    }
    private static boolean onlyFields(JsonNode node,Set<String> allowed) {
        if(node==null||!node.isObject())return false;
        var fields=node.fieldNames();while(fields.hasNext())if(!allowed.contains(fields.next()))return false;
        return true;
    }
    public static PositionSnapshot parse(byte[] bytes, AccountDirectory.Account account, String namespace,
            String artifactId, String hash, PositionSnapshot.Observation observation) throws Exception {
        var items=items(bytes); var holdings=new ArrayList<PositionSnapshot.Constituent>();
        var identities=new HashSet<String>(); int index=0,excluded=0;
        for(var item:items) {
            index++;
            if(!item.isObject()||!text(item,"account-number").equals(account.brokerAssociation().accountNumber()))throw invalid();
            String symbol=text(item,"symbol"),type=text(item,"instrument-type"),direction=text(item,"quantity-direction");
            if(item.hasNonNull("currency")&&!item.path("currency").asText().equals("USD"))throw invalid(); // Supported US-equity profile cannot silently relabel another reported currency.
            if(!Set.of("Long","Short").contains(direction))throw invalid();
            var quantityNode=item.get("quantity");
            if(quantityNode==null||(!quantityNode.isNumber()&&!quantityNode.isTextual()))throw invalid();
            BigDecimal quantity;
            try { quantity=new BigDecimal(quantityNode.asText()); }catch(Exception e){throw invalid();}
            if(quantity.signum()<0||quantity.precision()>30||Math.abs(quantity.scale())>12)throw invalid();
            if(direction.equals("Short"))quantity=quantity.negate();
            String expiry=null,kind;
            if(type.equals("Equity Option")) {
                var option=OPTION.matcher(symbol); if(!option.matches()||quantity.stripTrailingZeros().scale()>0)throw invalid();
                var day=option.group(2);
                var date=LocalDate.of(2000+Integer.parseInt(day.substring(0,2)),Integer.parseInt(day.substring(2,4)),Integer.parseInt(day.substring(4,6)));
                if(new BigDecimal(option.group(4)).signum()<=0)throw invalid();
                expiry=date.toString(); kind="Options";
                if(item.hasNonNull("expires-at")&&!OffsetDateTime.parse(text(item,"expires-at")).toLocalDate().equals(date))throw invalid();
                if(item.hasNonNull("underlying-symbol")&&!text(item,"underlying-symbol").equals(option.group(1)))throw invalid();
            } else if(type.equals("Equity")&&symbol.matches("[A-Z][A-Z0-9./-]{0,19}"))kind="Stocks";
            else throw invalid(); // Futures, crypto, cash and unsupported instruments need separate semantics.
            if(quantity.signum()==0){excluded++;continue;} // Observed zero inventory is not proof of an executed close.
            String custody="BROKER_REPORTED";
            String id="holding-"+FidelityPositions.digest(namespace+"|TASTYTRADE|"+type+"|"+symbol+"|"+custody);
            if(!identities.add(id))throw invalid();
            holdings.add(new PositionSnapshot.Constituent(id,symbol,type,kind,custody,quantity,null,null,null,null,expiry,List.of(index)));
        }
        String received=observation.receivedAt();
        return new PositionSnapshot(account.id(),account.brokerAssociation().accountNumber(),account.displayName(),
                "snapshot-"+observation.acquisitionId(),Instant.parse(received).atOffset(ZoneOffset.UTC).toLocalDate().toString(),received,
                "tastytrade-positions.json",hash,artifactId,List.copyOf(holdings),List.of(),excluded,observation);
    }
}
