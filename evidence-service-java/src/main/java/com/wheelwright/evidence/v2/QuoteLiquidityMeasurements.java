package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Observed underlying-side arithmetic only. No ranking, execution or freshness judgment. */
public final class QuoteLiquidityMeasurements {
    private QuoteLiquidityMeasurements() {}
    public static ObjectNode assess(JsonNode source, String requestId) {
        var result=obj().put("requestId",requestId).put("scope","RETAINED_UNDERLYING_QUOTED_MARKET_ONLY");
        result.set("source",source.deepCopy());
        result.put("currentness","NOT_ESTABLISHED");
        var measures=obj();result.set("measurements",measures);
        var facts=source.path("facts");
        var bid=facts.at("/bid/price");var ask=facts.at("/ask/price");
        var absolute=obj().putNull("value").put("unit","SOURCE_PRICE_UNIT").put("status","UNAVAILABLE")
            .put("origin","BACKEND_CALCULATED").put("method","RETAINED_ASK_MINUS_BID");
        var relative=obj().putNull("value").put("unit","PERCENT").put("status","UNAVAILABLE")
            .put("origin","BACKEND_CALCULATED").put("method","100*(ASK-BID)/MIDPOINT")
            .put("rounding","DECIMAL128: 34 significant digits, HALF_EVEN");
        measures.set("observedSideDifference",absolute);measures.set("relativeSideDifference",relative);
        var warnings=array();result.set("qualifications",warnings);
        if(!bid.isNumber()||!ask.isNumber()) warnings.add("BID_OR_ASK_MISSING");
        else {
            BigDecimal b=bid.decimalValue(),a=ask.decimalValue();
            if(b.signum()<0||a.signum()<0||a.compareTo(b)<0) warnings.add("INVALID_OR_CROSSED_SIDES");
            else {
                BigDecimal difference=a.subtract(b),midpoint=a.add(b).divide(BigDecimal.valueOf(2));
                absolute.put("value",difference).put("status","QUALIFIED");
                if(midpoint.signum()>0) relative.put("value",difference.multiply(BigDecimal.valueOf(100)).divide(midpoint,MathContext.DECIMAL128)).put("status","QUALIFIED");
                else warnings.add("ZERO_MIDPOINT");
            }
        }
        String bt=facts.at("/bid/sourceEventAt").asText(""),at=facts.at("/ask/sourceEventAt").asText("");
        result.put("sideTimeBasis",!bt.isEmpty()&&bt.equals(at)?"SAME_RECORDED_SOURCE_INSTANT":"ALIGNMENT_NOT_ESTABLISHED");
        warnings.add("No currentness, executable depth, options liquidity, cross-subject ranking or provider coverage is established.");
        warnings.add("Source price currency and displayed-size units are not inferred. Independent side observations need not be simultaneous.");
        return result;
    }
}
