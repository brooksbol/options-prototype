package com.wheelwright.evidence.v2;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.*;
import java.util.*;

/** Retained admitted Fidelity activity only; row identity is NOT broker-event identity. */
final class FidelityTransactions {
    private FidelityTransactions() {}
    static Map<String,Object> normalize(Map<String,String> row,String account) {
        var r=new LinkedHashMap<String,Object>();
        for(String k:List.of("sourceTransactionId","executedAt","sourceCreatedAt","sourceSubType","underlyingSymbol","instrumentType","multiplier","orderId","reversesSourceId","otherCharge","estimatedFee"))r.put(k,null);
        String action=row.get("Action");if(action==null||action.isBlank())throw new IllegalArgumentException("missing activity action");
        r.put("transactionDate",date(row.get("Run Date")));r.put("settlementDate",date(row.get("Settlement Date")));
        r.put("kind","OTHER");r.put("sourceType","Fidelity Activity");r.put("action",safe(action,account));r.put("sourceAction",safe(action,account));
        r.put("symbol",safe(row.get("Symbol"),account));r.put("description",safe(row.get("Description"),account));
        r.put("currency",null); // Dollar-labelled CSV columns do not establish a currency code.
        r.put("quantity",decimal(row,"Quantity"));r.put("price",decimal(row,"Price ($)"));r.put("value",null);
        r.put("netCash",decimal(row,"Amount ($)"));r.put("commission",decimal(row,"Commission ($)"));r.put("fees",decimal(row,"Fees ($)"));
        r.put("commissionStatus",r.get("commission")==null?"NOT_REPORTED":"REPORTED");r.put("feesStatus",r.get("fees")==null?"NOT_REPORTED":"REPORTED_TOTAL");
        var components=new LinkedHashMap<String,String>();for(String key:List.of("clearing-fees","regulatory-fees","proprietary-index-option-fees","currency-conversion-fees"))components.put(key,null);
        r.put("feeComponents",components);r.put("normalization",r.get("netCash")==null?"QUALIFIED":"SUPPORTED");r.put("sourceIdentityStatus","ROW_EQUIVALENCE_ONLY");return r;
    }
    private static String date(String s) {
        if(s==null||s.isBlank())return null;
        return LocalDate.parse(s.replace('-','/'),DateTimeFormatter.ofPattern("M/d/uuuu").withResolverStyle(ResolverStyle.STRICT)).toString();
    }
    private static String decimal(Map<String,String> row,String key) {
        String s=row.get(key);if(s==null||s.isBlank()||s.equals("--"))return null;
        s=s.replace(",","");if(!s.matches("-?[0-9]+(?:\\.[0-9]+)?"))throw new IllegalArgumentException("invalid activity decimal");
        var d=new BigDecimal(s);if(d.precision()>40||d.scale()>16)throw new IllegalArgumentException("activity decimal capacity");return d.toPlainString();
    }
    private static String safe(String s,String account){return s==null||s.isBlank()?null:s.replace(account,"[account]");}
}
