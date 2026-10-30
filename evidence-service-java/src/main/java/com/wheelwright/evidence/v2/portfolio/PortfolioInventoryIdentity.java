package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wheelwright.evidence.v2.PositionSnapshot;
import com.wheelwright.evidence.v2.FidelityPositions;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Broker-coded identity is source evidence, not lifecycle or global instrument equivalence. */
public final class PortfolioInventoryIdentity {
 private PortfolioInventoryIdentity(){}
 private static final Pattern DESCRIPTION=Pattern.compile("^(PUT|CALL)\\s+\\(([A-Z.]+)\\).*?([A-Z]{3})\\s+(\\d{1,2})\\s+(\\d{2}|\\d{4})\\s+\\$?(\\d+(?:\\.\\d+)?)(?:\\s.*)?$",Pattern.CASE_INSENSITIVE);
 public static ObjectNode identify(ObjectNode holding,PositionSnapshot.Constituent source,String broker){
  String nativeId=holding.at("/sourceInstrument/identifier").asText();var n=obj().put("nativeIdentifier",nativeId).put("basis","BROKER_REPORTED_IDENTITY").put("variant","OTHER").put("label",nativeId).putNull("symbol").putNull("underlyingSymbol").putNull("maturity");
  if(source!=null){n.put("description",source.description()).put("custody",source.custody());
   if(source.kind().equals("Options")){
    n.put("variant","OPTION");if(broker.equals("FIDELITY"))fidelityOption(n,source);
   }else if(Set.of("Stocks","ETFs").contains(source.kind())&&nativeId.matches("[A-Z][A-Z0-9./^-]{0,31}"))n.put("variant","SHARES").put("symbol",nativeId).put("underlyingSymbol",nativeId);
   else if(source.kind().equals("Bonds/Fixed income")){n.put("variant","FIXED_INCOME");if(nativeId.matches("912797[A-Z0-9]{3}"))n.put("variant","TREASURY_BILL").put("label","US Treasury bill");
    // A date alone may be issuance, coupon, receipt or another source event; its role must be explicit.
    var dates=new TreeSet<String>();boolean invalidMaturity=false;
    var m=Pattern.compile("\\b(?:DUE|MATURES|MATURITY(?: DATE)?)\\s*:?\\s+(\\d{1,2}/\\d{1,2}/\\d{4})(?![0-9])",Pattern.CASE_INSENSITIVE).matcher(source.description());
    while(m.find())try{dates.add(LocalDate.parse(m.group(1),DateTimeFormatter.ofPattern("M/d/uuuu").withResolverStyle(java.time.format.ResolverStyle.STRICT)).toString());}catch(java.time.DateTimeException ignored){invalidMaturity=true;}
    if(!invalidMaturity&&dates.size()==1)n.put("maturity",dates.first());
   }
  }
  if(holding.path("kind").asText().equals("CASH"))n.put("variant","CASH").put("label","Reported cash");
  if(broker.equals("FIDELITY")&&holding.path("sourceUnit").asText().contains("Broker category Cash")&&nativeId.matches("[A-Z]{5}\\*\\*"))n.put("variant","MONEY_MARKET").put("label",nativeId.substring(0,5)).put("symbol",nativeId.substring(0,5)).put("basis","BROKER_FUND_SYMBOL_WITH_SOURCE_ANNOTATION");
  return n;
 }
 private static void fidelityOption(ObjectNode n,PositionSnapshot.Constituent source){
  var parsed=FidelityPositions.optionSymbol(source.contract());if(parsed==null)return;
  try{
   var date=parsed.expiration();var strike=parsed.strike();if(strike.signum()<0||source.expiration()!=null&&!source.expiration().equals(date.toString()))return;
   String right=parsed.right(),root=parsed.underlying();var d=DESCRIPTION.matcher(source.description());
   if(d.matches()){
    String year=d.group(5).length()==2?"20"+d.group(5):d.group(5);var stated=LocalDate.parse(d.group(3).toUpperCase(Locale.US)+" "+d.group(4)+" "+year,new java.time.format.DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("MMM d uuuu").toFormatter(Locale.US).withResolverStyle(java.time.format.ResolverStyle.STRICT));
    if(!d.group(1).equalsIgnoreCase(right)||!d.group(2).equalsIgnoreCase(root)||!stated.equals(date)||new BigDecimal(d.group(6)).compareTo(strike)!=0){n.put("basis","CONFLICTING_SOURCE_IDENTITY");return;}
   }
   n.put("underlyingSymbol",root).put("symbol",root).put("label",root).put("basis","FIDELITY_OPTION_CODE");var terms=obj().put("underlyingSymbol",root).put("right",right).put("expiration",date.toString()).put("strike",decimal(strike)).putNull("multiplier").put("qualification","PARTIAL_SOURCE_TERMS").put("adjustment","UNKNOWN").put("settlement","UNKNOWN");n.set("terms",terms);
  }catch(java.time.DateTimeException|NumberFormatException ignored){}
 }
}
