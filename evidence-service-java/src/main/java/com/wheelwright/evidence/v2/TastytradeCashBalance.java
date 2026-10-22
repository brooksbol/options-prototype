package com.wheelwright.evidence.v2;

import java.math.BigDecimal;
import java.time.*;
import java.util.Set;

/** Reported USD settled cash. No margin, buying-power, reservation or tax-lot interpretation. */
public final class TastytradeCashBalance {
 private TastytradeCashBalance(){}
 public static boolean sourceAccount(byte[] bytes,String account){
  try{var root=TastytradeHoldings.document(bytes);var fields=root.fieldNames();while(fields.hasNext())if(!Set.of("data","context").contains(fields.next()))return false;var data=root.path("data");if(!data.isObject()||!data.path("account-number").isTextual()||!data.path("account-number").asText().equals(account))return false;for(var value:data)if(value.isContainerNode())return false;String context=root.path("context").asText();return context.isBlank()||context.equals("/accounts/{account_number}/balances")||context.equals("/accounts/"+account+"/balances");}catch(Exception e){return false;}
 }
 public static PositionSnapshot.CashObservation parse(byte[] bytes,String account,String artifact,String received)throws Exception{
  if(!sourceAccount(bytes,account))throw new IllegalArgumentException("cash source Account scope unavailable");var data=TastytradeHoldings.document(bytes).path("data");if(!data.path("currency").asText().equals("USD"))throw new IllegalArgumentException("requested USD cash currency not reported");BigDecimal balance=null;
  if(data.hasNonNull("cash-balance")){var raw=data.path("cash-balance");if(!raw.isTextual()&&!raw.isNumber())throw new IllegalArgumentException("reported cash scalar required");balance=new BigDecimal(raw.asText());if(balance.precision()>30||Math.abs(balance.scale())>12)throw new IllegalArgumentException("unsupported reported cash precision");}
  String observed=null,day=null;try{var clock=Instant.parse(data.path("updated-at").asText());if(!clock.isAfter(Instant.parse(received).plusSeconds(60)))observed=clock.toString();}catch(DateTimeException ignored){}
  try{day=LocalDate.parse(data.path("snapshot-date").asText()).toString();}catch(DateTimeException ignored){}
  return new PositionSnapshot.CashObservation(balance==null?"INCOMPLETE":"OBSERVED",balance,"USD",artifact,received,observed,day);
 }
}
