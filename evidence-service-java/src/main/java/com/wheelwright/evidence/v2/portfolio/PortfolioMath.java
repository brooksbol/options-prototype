package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.math.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Complete-composition arithmetic. No lifecycle event, broker reservation or market price is inferred. */
public final class PortfolioMath {
    private PortfolioMath(){}
    public static ObjectNode evaluate(ObjectNode construction,Map<String,ObjectNode> observations,Instant now) {
        String at=now.toString();var e=obj().put("evaluatedAt",at);var xs=leaves(construction.path("composition"));var evidence=construction.path("evidence");var basisEvidence=array();boolean orderDependent=false;for(var x:xs){for(var ev:x.at("/allocation/basis/evidence"))basisEvidence.add(ev);for(var dep:x.at("/allocation/basis/dependencies"))if(dep.asText().equals("ORDER_EVIDENCE"))orderDependent=true;}
        for(String field:List.of("marketValue","grossUnrealizedPl","spot","openingCashFlow","estimatedClosingCashFlow","netUnrealizedPl"))e.set(field,unknown(field.equals("spot")?"PRICE":"MONEY",at,field.equals("openingCashFlow")?"BASIS_ATTRIBUTION_UNKNOWN":"MARKET_OBSERVATION_MISSING"));
        e.set("fees",unknown("MONEY",at,"HISTORY_INCOMPLETE"));e.set("realizedGrossPl",unknown("MONEY",at,"HISTORY_INCOMPLETE"));e.set("realizedNetPl",unknown("MONEY",at,"HISTORY_INCOMPLETE"));e.putNull("oldestMaterialObservationAt");e.put("freshness","UNKNOWN");
        var timeline=obj().putNull("openedAt").putNull("expiration").put("calendarZone","America/New_York").put("openingAccess","UNKNOWN");timeline.set("openingEvidence",array());timeline.set("remainingDays",na("DAY",at));timeline.set("originalDays",unknown("DAY",at,"OPENING_FILLS_UNAVAILABLE"));
        var expiries=new TreeSet<String>();for(var x:xs)if(x.path("kind").asText().equals("OPTION")&&!x.at("/terms/expiration").isNull()&&!x.at("/terms/expiration").isMissingNode())expiries.add(x.at("/terms/expiration").asText());
        if(expiries.size()==1){String expiry=expiries.first();timeline.put("expiration",expiry);timeline.set("remainingDays",metric(BigDecimal.valueOf(Math.max(0,ChronoUnit.DAYS.between(now.atZone(ZoneId.of("America/New_York")).toLocalDate(),LocalDate.parse(expiry)))),"DAY",null,at,"NY_CALENDAR_DAYS","QUALIFIED",evidence));}
        else if(!expiries.isEmpty())timeline.set("remainingDays",unknown("DAY",at,"VALUATION_UNSUPPORTED"));
        if(expiries.isEmpty())timeline.set("originalDays",na("DAY",at));e.set("timeline",timeline);
        var management=obj().put("access","VISIBLE").put("associationStatus","UNAVAILABLE").put("stopInterpretation","PROVISIONAL_NOT_EXECUTION_GUARANTEE").put("protectiveOrderEvidence","UNKNOWN").putNull("manualCheckpoint");management.set("orders",array());management.set("zeroGrossPl",metric(BigDecimal.ZERO,"MONEY","USD",at,"ZERO_REFERENCE","QUALIFIED",evidence));management.set("profitTargetGrossPl",unknown("MONEY",at,"ASSOCIATION_UNRESOLVED"));management.set("reportedStopThresholdGrossPl",unknown("MONEY",at,"ASSOCIATION_UNRESOLVED"));management.set("evidence",array());management.set("warningCodes",array().add("ASSOCIATION_UNRESOLVED"));e.set("management",management);
        if(xs.isEmpty()){
            // Retained closure does not keep the preceding contracts as current held exposure.
            e.set("marketValue",metric(BigDecimal.ZERO,"MONEY","USD",at,"EMPTY_HELD_COMPOSITION","QUALIFIED",evidence));
            for(String field:List.of("grossUnrealizedPl","netUnrealizedPl","openingCashFlow","estimatedClosingCashFlow","fees"))e.set(field,na("MONEY",at));e.set("spot",na("PRICE",at));
            management.set("profitTargetGrossPl",na("MONEY",at));management.set("reportedStopThresholdGrossPl",na("MONEY",at));management.set("warningCodes",array());
            var payoff=obj().put("status","UNSUPPORTED").putNull("geometry").put("evaluatedAt",at);payoff.set("assumptions",array());payoff.set("evidence",array());payoff.set("warningCodes",array().add("VALUATION_UNSUPPORTED"));e.set("payoff",payoff);
            var range=obj().put("status","UNSUPPORTED").put("kind","UNAVAILABLE").putNull("lower").putNull("upper").putNull("currency");range.set("evidence",array());range.set("warningCodes",array().add("VALUATION_UNSUPPORTED"));e.set("range",range);return e;
        }
        var currencies=new HashSet<String>();for(var x:xs){currencies.add(x.path("currency").asText());if(x.path("kind").asText().equals("OPTION")&&!x.at("/terms/currency").asText().equals(x.path("currency").asText()))currencies.add(x.at("/terms/currency").asText());}
        String currency=currencies.size()==1?currencies.iterator().next():null;
        BigDecimal opening=BigDecimal.ZERO,market=BigDecimal.ZERO,closing=BigDecimal.ZERO,fees=BigDecimal.ZERO;boolean basisKnown=true,quotesKnown=true,feesKnown=true;Instant oldest=null;
        for(var x:xs){String kind=x.path("kind").asText();int sign=x.path("side").asText().equals("LONG")?1:-1;var basis=x.at("/allocation/basis");
            if(!kind.equals("CASH")){if(established(basis))opening=opening.subtract(number(basis.get("value")).multiply(BigDecimal.valueOf(sign)));else basisKnown=false;}
            var fee=x.at("/economics/fees");if(established(fee))fees=fees.add(number(fee.get("value")));else feesKnown=false;
            BigDecimal value=null;
            if(kind.equals("CASH"))value=number(x.get("quantity"));
            else {var observation=observations.get(x.path("instrument").path("href").asText());if(observation!=null&&established(observation.path("mid"))&&observation.at("/mid/currency").asText().equals(currency)){value=number(observation.at("/mid/value")).multiply(number(x.get("quantity"))).multiply(BigDecimal.valueOf(sign));if(kind.equals("OPTION")){var multiplier=number(x.at("/terms/multiplier"));if(multiplier==null)value=null;else value=value.multiply(multiplier);}if(!observation.path("observedAt").isNull()){var instant=Instant.parse(observation.path("observedAt").asText());if(oldest==null||instant.isBefore(oldest))oldest=instant;}}}
            if(value==null)quotesKnown=false;else {market=market.add(value);if(!kind.equals("CASH"))closing=closing.add(value);}
        }
        if(currency==null){basisKnown=false;quotesKnown=false;feesKnown=false;for(String field:List.of("marketValue","grossUnrealizedPl","openingCashFlow","estimatedClosingCashFlow","netUnrealizedPl","fees"))e.set(field,unknown("MONEY",at,"MIXED_CURRENCY"));}
        if(basisKnown)e.set("openingCashFlow",metric(opening,"MONEY",currency,at,"SIGNED_ATTRIBUTED_OPENING_CASH_FLOW","QUALIFIED",basisEvidence,"OPENING_CASH_FLOW"));
        if(feesKnown)e.set("fees",metric(fees,"MONEY",currency,at,"ATTRIBUTED_REPORTED_FEES","QUALIFIED",evidence));
        if(quotesKnown){e.set("marketValue",metric(market,"MONEY",currency,at,"SIGNED_HELD_MIDPOINT_SUM","QUALIFIED",evidence,"CURRENT_MARKET"));e.set("estimatedClosingCashFlow",metric(closing,"MONEY",currency,at,"SIGNED_LIQUIDATION_MIDPOINT_SUM","QUALIFIED",evidence,"CURRENT_MARKET"));if(oldest!=null){e.put("oldestMaterialObservationAt",oldest.toString());e.put("freshness",oldest.isAfter(now.plusSeconds(60))?"UNKNOWN":oldest.isBefore(now.minusSeconds(43200))?"STALE":"CURRENT");}
            if(basisKnown){e.set("grossUnrealizedPl",metric(opening.add(closing),"MONEY",currency,at,"OPENING_PLUS_ESTIMATED_CLOSING","QUALIFIED",basisEvidence,"OPENING_CASH_FLOW","CURRENT_MARKET"));if(feesKnown)e.set("netUnrealizedPl",metric(opening.add(closing).subtract(fees),"MONEY",currency,at,"GROSS_LESS_ATTRIBUTED_FEES","QUALIFIED",basisEvidence,"OPENING_CASH_FLOW","CURRENT_MARKET"));}}
        var payoff=payoff(construction,now);e.set("payoff",payoff);var range=obj().put("status","UNSUPPORTED").put("kind","UNAVAILABLE").putNull("lower").putNull("upper").put("currency","USD");range.set("evidence",array());range.set("warningCodes",array().add("VALUATION_UNSUPPORTED"));
        if(!payoff.path("geometry").isNull()){
            var flats=new ArrayList<JsonNode>();var interior=new ArrayList<JsonNode>();for(var segment:payoff.at("/geometry/segments"))if(number(segment.path("slope")).signum()==0){flats.add(segment);if(number(segment.path("lower")).signum()>0&&!segment.path("upper").isNull())interior.add(segment);}
            // A unique contractual plateau may be a loss floor or a profit cap; neither implies desirability.
            JsonNode selected=interior.size()==1?interior.getFirst():flats.size()==1?flats.getFirst():null;
            if(selected!=null){boolean upperNull=selected.path("upper").isNull();var lower=number(selected.path("lower"));range.put("status","QUALIFIED").put("kind",upperNull?"LOWER_HALF_LINE":lower.signum()==0?"UPPER_HALF_LINE":"PLATEAU");if(upperNull||lower.signum()!=0)range.put("lower",decimal(lower));if(!upperNull)range.put("upper",selected.path("upper").asText());range.put("currency",currency);range.set("evidence",evidence.deepCopy());range.set("warningCodes",array());}
        }
        var underlyings=new HashSet<String>();for(var x:xs){if(x.path("kind").asText().equals("OPTION")&&!x.at("/terms/underlying/href").asText().isBlank())underlyings.add(x.at("/terms/underlying/href").asText());else if(x.path("kind").asText().equals("LONG_SHARES"))underlyings.add(x.at("/instrument/href").asText());}
        // Accepted tt live SPOT is the equity midpoint, never the last trade/mark.
        // Its own observation clock survives independently from the option package clock.
        if(underlyings.size()==1){var observation=observations.get(underlyings.iterator().next());if(observation!=null){var mid=observation.path("mid");var bid=number(observation.at("/bid/value"));var ask=number(observation.at("/ask/value"));var price=number(mid.path("value"));var clock=mid.path("asOf");boolean timely=!clock.isNull()&&!clock.isMissingNode()&&!Instant.parse(clock.asText()).isAfter(now.plusSeconds(60));if(established(mid)&&bid!=null&&ask!=null&&price!=null&&bid.compareTo(ask)<=0&&price.signum()>0&&price.compareTo(bid)>=0&&price.compareTo(ask)<=0&&timely&&mid.path("currency").asText().equals(currency))e.set("spot",mid.deepCopy());}}
        if(e.path("freshness").asText().equals("STALE"))for(String field:List.of("marketValue","estimatedClosingCashFlow","grossUnrealizedPl","netUnrealizedPl"))((ArrayNode)e.path(field).path("warningCodes")).add("STALE_MARKET_OBSERVATION");
        if(orderDependent)for(String field:List.of("openingCashFlow","grossUnrealizedPl","netUnrealizedPl"))((ArrayNode)e.path(field).path("dependencies")).add("ORDER_EVIDENCE");
        e.set("range",range);return e;
    }
    public static ObjectNode payoff(ObjectNode construction,Instant now){
        String at=now.toString();var result=obj().put("status","INCOMPLETE").putNull("geometry").put("evaluatedAt",at);result.set("assumptions",array());result.set("evidence",array());result.set("warningCodes",array().add("BASIS_ATTRIBUTION_UNKNOWN"));
        var xs=leaves(construction.path("composition"));var expiries=new HashSet<String>();var currencies=new HashSet<String>();var breaks=new TreeSet<BigDecimal>();breaks.add(BigDecimal.ZERO);String underlying=null;
        for(var x:xs){String kind=x.path("kind").asText();currencies.add(x.path("currency").asText());if(!established(x.at("/allocation/basis")))return result;if(!x.at("/allocation/basis/currency").asText().equals(x.path("currency").asText()))return unsupported(result,"MIXED_CURRENCY");
            if(kind.equals("OTHER"))return unsupported(result,"VALUATION_UNSUPPORTED");
            if(kind.equals("OPTION")){var t=x.path("terms");if(!t.path("payoffApplicability").asText().equals("STANDARD_EQUITY_INTRINSIC")||!t.path("adjustment").asText().equals("STANDARD")||!t.path("settlement").asText().equals("PHYSICAL")||t.path("deliverable").size()!=1||!t.at("/deliverable/0/kind").asText().equals("SHARES"))return unsupported(result,"VALUATION_UNSUPPORTED");
                var multiplier=number(t.path("multiplier"));var deliverable=number(t.at("/deliverable/0/quantity"));var strike=number(t.path("strike"));if(multiplier==null||deliverable==null||strike==null||multiplier.compareTo(deliverable)!=0)return unsupported(result,"INCOMPATIBLE_CONTRACT_TERMS");
                var u=t.path("underlying").path("href").asText();if(u.isBlank()||!t.at("/deliverable/0/instrument/href").asText().equals(u)||!t.path("currency").asText().equals(x.path("currency").asText()))return unsupported(result,"INCOMPATIBLE_CONTRACT_TERMS");if(underlying!=null&&!underlying.equals(u))return unsupported(result,"VALUATION_UNSUPPORTED");underlying=u;expiries.add(t.path("expiration").asText());breaks.add(strike);
            }else if(kind.equals("LONG_SHARES")){String u=x.path("instrument").path("href").asText();if(underlying!=null&&!underlying.equals(u))return unsupported(result,"VALUATION_UNSUPPORTED");underlying=u;}
        }
        if(currencies.size()>1)return unsupported(result,"MIXED_CURRENCY");if(expiries.size()!=1||underlying==null)return unsupported(result,"VALUATION_UNSUPPORTED");
        var geometry=obj();geometry.set("underlying",link(underlying));geometry.put("coordinate","UNDERLYING_PRICE").put("priceCurrency",currencies.iterator().next()).put("valueCurrency",currencies.iterator().next()).put("valueKind","GROSS_PL").put("quantityBasis","ALL_BOUND_CONSTITUENTS");geometry.set("horizon",obj().put("kind","COMMON_EXPIRATION").put("date",expiries.iterator().next()));
        var points=new ArrayList<>(breaks);var segments=array();var boundaries=array();var roots=array();var seenRoots=new HashSet<String>();
        for(int i=0;i<points.size();i++){
            var lo=points.get(i);var hi=i+1<points.size()?points.get(i+1):null;var sample=hi==null?lo.add(BigDecimal.ONE):lo.add(hi).divide(BigDecimal.valueOf(2));
            var slope=slope(xs,sample);var intercept=value(xs,sample).subtract(slope.multiply(sample));var seg=obj().put("lower",decimal(lo)).put("slope",decimal(slope)).put("intercept",decimal(intercept));if(hi==null)seg.putNull("upper");else seg.put("upper",decimal(hi));segments.add(seg);
            if(lo.signum()>0)boundaries.add(obj().put("price",decimal(lo)).put("value",decimal(value(xs,lo))));
            if(slope.signum()!=0){var n=intercept.negate();if(n.divide(slope,MathContext.DECIMAL128).compareTo(lo)>=0&&(hi==null||n.divide(slope,MathContext.DECIMAL128).compareTo(hi)<=0)){var root=exactQuotient(n,slope);if(seenRoots.add(root.toString()))roots.add(root);}}
        }
        geometry.set("segments",segments);geometry.set("boundaries",boundaries);geometry.set("breakEvenPrices",roots);result.put("status","QUALIFIED");result.set("geometry",geometry);var qualified=array();for(var x:xs){for(var ev:x.at("/allocation/basis/evidence"))qualified.add(ev);for(var ev:x.at("/terms/evidence"))qualified.add(ev);}result.set("evidence",qualified);result.set("assumptions",array().add("Common-expiration standard physical-deliverable intrinsic; disclosed attributed basis, gross before fees. No current executable price or lifecycle claim."));result.set("warningCodes",array());return result;
    }
    private static ObjectNode unsupported(ObjectNode n,String code){n.put("status","UNSUPPORTED");n.set("warningCodes",array().add(code));return n;}
    private static BigDecimal value(List<ObjectNode> xs,BigDecimal spot){var total=BigDecimal.ZERO;for(var x:xs){var q=number(x.path("quantity"));var basis=number(x.at("/allocation/basis/value"));int sign=x.path("side").asText().equals("LONG")?1:-1;BigDecimal value;switch(x.path("kind").asText()){
        case "CASH" -> value=q;
        case "LONG_SHARES" -> value=q.multiply(spot);
        default -> {var t=x.path("terms");var intrinsic=t.path("right").asText().equals("CALL")?spot.subtract(number(t.path("strike"))):number(t.path("strike")).subtract(spot);value=q.multiply(number(t.path("multiplier"))).multiply(intrinsic.max(BigDecimal.ZERO));}}
        total=total.add(value.subtract(basis).multiply(BigDecimal.valueOf(sign)));}return total;}
    private static BigDecimal slope(List<ObjectNode> xs,BigDecimal spot){var total=BigDecimal.ZERO;for(var x:xs){int sign=x.path("side").asText().equals("LONG")?1:-1;var q=number(x.path("quantity"));if(x.path("kind").asText().equals("LONG_SHARES"))total=total.add(q.multiply(BigDecimal.valueOf(sign)));else if(x.path("kind").asText().equals("OPTION")){var t=x.path("terms");int side=t.path("right").asText().equals("CALL")?1:-1;int cmp=spot.compareTo(number(t.path("strike")));if(cmp*side>0)total=total.add(q.multiply(number(t.path("multiplier"))).multiply(BigDecimal.valueOf(sign*side)));}}return total;}
    private static JsonNode exactQuotient(BigDecimal a,BigDecimal b){try{return TextNode.valueOf(decimal(a.divide(b)));}catch(ArithmeticException ignored){int scale=Math.max(a.scale(),b.scale());BigInteger n=a.movePointRight(scale).toBigIntegerExact(),d=b.movePointRight(scale).toBigIntegerExact();if(d.signum()<0){n=n.negate();d=d.negate();}var gcd=n.gcd(d);return obj().put("numerator",n.divide(gcd).toString()).put("denominator",d.divide(gcd).toString());}}
}
