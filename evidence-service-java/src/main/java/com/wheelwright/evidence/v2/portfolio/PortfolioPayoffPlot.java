package com.wheelwright.evidence.v2.portfolio;
import com.fasterxml.jackson.databind.JsonNode;import com.fasterxml.jackson.databind.node.ObjectNode;import java.math.BigDecimal;import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
/** Backend sample points of the existing exact affine geometry; clients scale pixels, never compute money. */
public final class PortfolioPayoffPlot {
 private PortfolioPayoffPlot(){}
 public static void apply(ObjectNode evaluation){
  var payoff=evaluation.path("payoff");if(!payoff.path("status").asText().equals("QUALIFIED")||!payoff.path("geometry").isObject())return;var g=(ObjectNode)payoff.path("geometry");var boundaries=g.path("boundaries");if(boundaries.isEmpty())return;
  var xs=new TreeSet<BigDecimal>();for(var point:boundaries){var p=number(point.path("price"));if(p==null||p.signum()<0)return;xs.add(p);}
  if(established(evaluation.path("spot"))&&evaluation.at("/spot/unit").asText().equals("PRICE")&&evaluation.at("/spot/currency").equals(g.path("priceCurrency"))){var spot=number(evaluation.at("/spot/value"));if(spot!=null&&spot.signum()>=0)xs.add(spot);}
  boolean financial=Set.of("GROSS_PL","ESTIMATED_PL").contains(g.path("valueKind").asText());
  if(financial)for(var root:g.path("breakEvenPrices")){var v=price(root);if(v!=null&&v.signum()>=0)xs.add(v);}
  BigDecimal low=xs.first(),high=xs.last(),span=high.subtract(low),pad=span.signum()>0?span.multiply(new BigDecimal("0.15")):low.abs().multiply(new BigDecimal("0.15")).max(BigDecimal.ONE);low=low.subtract(pad).max(BigDecimal.ZERO);high=high.add(pad);var prices=new TreeSet<BigDecimal>();prices.add(low);for(var point:boundaries)prices.add(number(point.path("price")));prices.add(high);if(financial)for(var root:g.path("breakEvenPrices")){var v=price(root);if(v!=null&&v.compareTo(low)>=0&&v.compareTo(high)<=0)prices.add(v);}var points=array();
  for(var price:prices){BigDecimal value=null;for(var segment:g.path("segments")){BigDecimal lower=number(segment.path("lower")),upper=number(segment.path("upper")),slope=number(segment.path("slope")),intercept=number(segment.path("intercept"));if(lower==null||slope==null||intercept==null)return;if(price.compareTo(lower)>=0&&(upper==null||price.compareTo(upper)<=0)){value=slope.multiply(price).add(intercept);break;}}if(value==null)return;points.add(obj().put("price",decimal(price)).put("value",decimal(value)));}
  g.set("displayPoints",points);
  if(financial){var markers=array();for(var root:g.path("breakEvenPrices")){var coordinate=price(root);if(coordinate==null||coordinate.signum()<0)continue;boolean approximate=root.isObject();String label=approximate?"≈"+decimal(coordinate.setScale(4,java.math.RoundingMode.HALF_UP)):decimal(coordinate);markers.add(obj().put("price",decimal(coordinate)).put("label",label).put("approximate",approximate));}g.set("breakEvenMarkers",markers);}
  if(financial){var regions=array();for(int i=1;i<points.size();i++){var a=points.get(i-1);var b=points.get(i);var av=number(a.path("value"));var bv=number(b.path("value"));int sign=av.add(bv).signum();if(sign==0)continue;var polygon=array().add(obj().put("price",a.path("price").asText()).put("value","0")).add(a.deepCopy()).add(b.deepCopy()).add(obj().put("price",b.path("price").asText()).put("value","0"));regions.add(obj().put("kind",sign<0?"LOSS":"PROFIT").set("points",polygon));}g.set("financialRegions",regions);
   if(established(evaluation.path("spot"))&&evaluation.at("/spot/currency").equals(g.path("priceCurrency"))){var spot=number(evaluation.at("/spot/value"));if(spot!=null&&spot.signum()>=0){var v=value(g,spot);if(v!=null)g.set("spotPoint",obj().put("price",decimal(spot)).put("value",decimal(v)));}}
  }
 }
 private static BigDecimal price(JsonNode n){if(n.isObject()){var numerator=number(n.path("numerator"));var denominator=number(n.path("denominator"));return numerator==null||denominator==null||denominator.signum()==0?null:numerator.divide(denominator,java.math.MathContext.DECIMAL128);}return number(n);}
 private static BigDecimal value(JsonNode g,BigDecimal price){for(var s:g.path("segments")){var hi=number(s.path("upper"));if(price.compareTo(number(s.path("lower")))>=0&&(hi==null||price.compareTo(hi)<=0))return number(s.path("slope")).multiply(price).add(number(s.path("intercept")));}return null;}
}
