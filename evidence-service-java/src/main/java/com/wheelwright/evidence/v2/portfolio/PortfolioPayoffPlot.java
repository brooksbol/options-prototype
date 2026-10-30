package com.wheelwright.evidence.v2.portfolio;
import com.fasterxml.jackson.databind.node.ObjectNode;import java.math.BigDecimal;import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
/** Backend sample points of the existing exact affine geometry; clients scale pixels, never compute money. */
public final class PortfolioPayoffPlot {
 private PortfolioPayoffPlot(){}
 public static void apply(ObjectNode evaluation){
  var payoff=evaluation.path("payoff");if(!payoff.path("status").asText().equals("QUALIFIED")||!payoff.path("geometry").isObject())return;var g=(ObjectNode)payoff.path("geometry");var boundaries=g.path("boundaries");if(boundaries.isEmpty())return;
  var xs=new TreeSet<BigDecimal>();for(var point:boundaries){var p=number(point.path("price"));if(p==null||p.signum()<0)return;xs.add(p);}
  if(established(evaluation.path("spot"))&&evaluation.at("/spot/unit").asText().equals("PRICE")&&evaluation.at("/spot/currency").equals(g.path("priceCurrency"))){var spot=number(evaluation.at("/spot/value"));if(spot!=null&&spot.signum()>=0)xs.add(spot);}
  BigDecimal low=xs.first(),high=xs.last(),span=high.subtract(low),pad=span.signum()>0?span.multiply(new BigDecimal("0.15")):low.abs().multiply(new BigDecimal("0.15")).max(BigDecimal.ONE);low=low.subtract(pad).max(BigDecimal.ZERO);high=high.add(pad);var prices=new TreeSet<BigDecimal>();prices.add(low);for(var point:boundaries)prices.add(number(point.path("price")));prices.add(high);var points=array();
  BigDecimal observed=established(evaluation.path("spot"))&&evaluation.at("/spot/unit").asText().equals("PRICE")&&evaluation.at("/spot/currency").equals(g.path("priceCurrency"))?number(evaluation.at("/spot/value")):null;
  if(observed!=null&&(!PortfolioMoneyness.qualifiedClock(evaluation,evaluation.path("spot"))||observed.signum()<=0))observed=null;
  if(observed!=null)prices.add(observed);
  for(var price:prices){BigDecimal value=null;for(var segment:g.path("segments")){BigDecimal lower=number(segment.path("lower")),upper=number(segment.path("upper")),slope=number(segment.path("slope")),intercept=number(segment.path("intercept"));if(lower==null||slope==null||intercept==null)return;if(price.compareTo(lower)>=0&&(upper==null||price.compareTo(upper)<=0)){value=slope.multiply(price).add(intercept);break;}}if(value==null)return;points.add(obj().put("price",decimal(price)).put("value",decimal(value)));}
  g.remove("spotPoint");if(observed!=null)for(var point:points)if(number(point.path("price")).compareTo(observed)==0)g.set("spotPoint",point.deepCopy());
  g.set("displayPoints",points);
 }
}
