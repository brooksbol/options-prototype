package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.math.*;
import java.time.*;
import java.util.*;

/** Domain representation primitives. Decimal money never passes through binary floating point. */
public final class PortfolioJson {
    private PortfolioJson(){}
    public static final ObjectMapper JSON=new ObjectMapper();
    public static ObjectNode obj(){return JSON.createObjectNode();}
    public static ArrayNode array(){return JSON.createArrayNode();}
    public static ObjectNode link(String href){return obj().put("href",href);}
    public static ObjectNode metric(BigDecimal amount,String unit,String currency,String at,String method,String status,JsonNode evidence,String...dependencies) {
        var n=obj();if(amount==null)n.putNull("value");else n.put("value",decimal(amount));n.put("unit",unit);if(currency==null)n.putNull("currency");else n.put("currency",currency);
        n.put("status",status).put("origin",amount==null?"UNKNOWN":"WHEELWRIGHT_DERIVED").put("method",method);if(at==null)n.putNull("asOf");else n.put("asOf",at);
        n.set("assumptions",array());n.set("evidence",evidence==null?array():evidence.deepCopy());n.set("warningCodes",array());var deps=array();for(String d:dependencies)deps.add(d);n.set("dependencies",deps);return n;
    }
    public static ObjectNode unknown(String unit,String at,String code) {
        var n=metric(null,unit,Set.of("MONEY","PRICE").contains(unit)?"USD":null,at,"EVIDENCE_UNAVAILABLE","INCOMPLETE",null);((ArrayNode)n.get("warningCodes")).add(code);return n;
    }
    public static ObjectNode na(String unit,String at){return metric(null,unit,Set.of("MONEY","PRICE").contains(unit)?"USD":null,at,"NOT_APPLICABLE","NOT_APPLICABLE",null);}
    public static ObjectNode warning(String code,String affected,String known,String unknown) {
        var w=obj().put("code",code);w.set("affected",array().add(affected));w.set("establishedFacts",array().add(known));w.set("incompleteConclusions",array().add(unknown));w.set("evidence",array());w.set("remediation",array());return w;
    }
    public static String decimal(BigDecimal n){return n.stripTrailingZeros().toPlainString();}
    public static List<ObjectNode> leaves(JsonNode composition){var result=new ArrayList<ObjectNode>();if(composition.path("kind").asText().equals("GROUP"))for(var x:composition.path("children"))result.addAll(leaves(x));else if(composition.isObject())result.add((ObjectNode)composition);return result;}
    public static BigDecimal number(JsonNode n){return n.isTextual()?new BigDecimal(n.asText()):null;}
    public static boolean established(JsonNode m){return Set.of("ESTABLISHED","QUALIFIED").contains(m.path("status").asText())&&!m.path("value").isNull();}
    public static ObjectNode source(String account,String artifact,String row,String date,String received,String provider) {
        var n=obj().put("kind","ACCOUNT_SOURCE");n.set("account",link("/v2/accounts/"+account));n.put("requiredCapability","account.positions.read:"+account);n.set("artifact",link("/v2/artifacts/"+artifact));n.put("recordKey",row);n.set("locator",obj().put("kind",provider.equals("FIDELITY")?"CSV_ROW":"JSON_POINTER").put("value",row));n.put("provider",provider).put("environment","PRODUCTION");n.putNull("observedAt");n.put("observationPrecision",date==null?"UNKNOWN":"DAY");if(date==null)n.putNull("observationDate");else n.put("observationDate",date);n.put("receivedAt",received).put("timeAuthority",date==null?"UNKNOWN":"SOURCE");return n;
    }
}
