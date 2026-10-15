package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.core.StreamReadFeature;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

/** Brokerage evidence only. Never identifies strategies or computes trading P/L. */
public final class TastytradeTransactions {
    private TastytradeTransactions() {}
    private static final ObjectMapper JSON=JsonMapper.builder()
            .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS,DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS)
            .enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION).build();
    static JsonNode document(byte[] bytes)throws Exception{return JSON.readTree(bytes);}
    public record Page(List<JsonNode> items,int offset,int pages,int total) {}
    public static Page page(byte[] bytes,String account,int expected) throws Exception {
        var root=document(bytes);
        if(root==null||!root.isObject()||!root.path("data").path("items").isArray())throw invalid();
        if(root.hasNonNull("context")&&!root.path("context").asText().equals("/accounts/"+account+"/transactions"))throw invalid();
        var p=root.path("pagination");
        int offset=integer(p,"page-offset"),pages=integer(p,"total-pages"),total=integer(p,"total-items");
        if(offset!=expected||pages<0||total<0||pages==0&&total!=0||pages>0&&offset>=pages)throw invalid();
        var items=new ArrayList<JsonNode>();
        for(var item:root.path("data").path("items")) {
            if(!item.isObject()||!account.equals(text(item,"account-number",true)))throw invalid();
            items.add(item);
        }
        if(p.has("current-item-count")&&integer(p,"current-item-count")!=items.size())throw invalid();
        return new Page(List.copyOf(items),offset,pages,total);
    }
    static IllegalArgumentException invalid(){return new IllegalArgumentException("invalid transaction evidence");}
    static int integer(JsonNode n,String k) {
        var v=n.get(k);if(v==null||!v.isIntegralNumber()||!v.canConvertToInt()||v.intValue()<0)throw invalid();return v.intValue();
    }
    static String text(JsonNode n,String k,boolean required) {
        var v=n.get(k);if(v==null||v.isNull()){if(required)throw invalid();return null;}
        if(!v.isTextual()||v.asText().length()>4096||required&&v.asText().isBlank())throw invalid();return v.asText();
    }
    static String identifier(JsonNode n,String key,boolean required) {
        var v=n.get(key);if(v==null||v.isNull()){if(required)throw invalid();return null;}
        String s=v.isIntegralNumber()?v.asText():v.isTextual()?v.asText():"";
        if(!s.matches("[0-9]{1,40}"))throw invalid();return s;
    }
    static String decimal(JsonNode n,String k) {
        var v=n.get(k);if(v==null||v.isNull())return null;
        if(!v.isNumber()&&!v.isTextual())throw invalid();
        String s=v.isNumber()?v.decimalValue().toPlainString():v.asText();if(!s.matches("-?[0-9]+(?:\\.[0-9]+)?"))throw invalid();
        BigDecimal d=new BigDecimal(s);if(d.precision()>40||d.scale()>16)throw invalid();return d.toPlainString();
    }
    static String money(JsonNode n,String k) {
        String s=decimal(n,k);if(s==null)return null;
        var d=new BigDecimal(s);String effect=text(n,k+"-effect",false);
        if(d.signum()==0)return s;
        if("Debit".equals(effect))return d.abs().negate().toPlainString();
        if("Credit".equals(effect)&&d.signum()>0)return s;
        throw invalid();
    }
    private static String instant(JsonNode n,String key) {
        String s=text(n,key,false);if(s!=null)OffsetDateTime.parse(s);return s;
    }
    public static Map<String,Object> normalize(JsonNode n,String brokerAccount) {
        var r=new LinkedHashMap<String,Object>();
        r.put("sourceTransactionId",identifier(n,"id",true));r.put("sourceIdentityStatus","BROKER_TRANSACTION_ID");
        String date=text(n,"transaction-date",true);LocalDate.parse(date);
        r.put("transactionDate",date);r.put("executedAt",instant(n,"executed-at"));r.put("settlementDate",null);
        r.put("sourceCreatedAt",instant(n,"created-at"));
        String type=text(n,"transaction-type",true),sub=text(n,"transaction-sub-type",false),action=text(n,"action",false);
        r.put("kind",type.equals("Trade")?"TRADE":type.equals("Money Movement")?"MONEY_MOVEMENT":"OTHER");
        r.put("sourceType",safe(type,brokerAccount));r.put("sourceSubType",safe(sub,brokerAccount));r.put("action",safe(action==null?sub:action,brokerAccount));r.put("sourceAction",safe(action,brokerAccount));
        for(String[] field:List.of(new String[]{"symbol","symbol"},new String[]{"underlyingSymbol","underlying-symbol"},new String[]{"instrumentType","instrument-type"},new String[]{"description","description"}))r.put(field[0],safe(text(n,field[1],false),brokerAccount));
        String currency=text(n,"currency",true);if(!currency.matches("[A-Z]{3}"))throw invalid();r.put("currency",currency);
        for(String key:List.of("quantity","price"))r.put(key,decimal(n,key));
        r.put("multiplier",null); // Not supplied by this endpoint; never infer equity-option 100.
        r.put("orderId",identifier(n,"order-id",false));r.put("reversesSourceId",identifier(n,"reverses-id",false));
        r.put("value",money(n,"value"));r.put("netCash",money(n,"net-value"));r.put("commission",money(n,"commission"));
        r.put("commissionStatus",r.get("commission")==null?"NOT_REPORTED":"REPORTED");
        var fees=new LinkedHashMap<String,String>();BigDecimal sum=BigDecimal.ZERO;int reported=0;
        for(String key:List.of("clearing-fees","regulatory-fees","proprietary-index-option-fees","currency-conversion-fees")) {
            String amount=money(n,key);fees.put(key,amount);if(amount!=null){sum=sum.add(new BigDecimal(amount));reported++;}
        }
        r.put("feeComponents",fees);r.put("fees",reported==0?null:sum.toPlainString());r.put("feesStatus",reported==4?"REPORTED_COMPONENTS_COMPLETE":reported==0?"NOT_REPORTED":"PARTIALLY_REPORTED");
        r.put("otherCharge",money(n,"other-charge"));
        var estimated=n.get("is-estimated-fee");if(estimated!=null&&!estimated.isNull()&&!estimated.isBoolean())throw invalid();
        r.put("estimatedFee",estimated==null||estimated.isNull()?null:estimated.booleanValue());
        r.put("normalization",r.get("netCash")==null?"QUALIFIED":"SUPPORTED");
        return r;
    }
    private static String safe(String s,String account){return s==null?null:s.replace(account,"[account]");}
}
