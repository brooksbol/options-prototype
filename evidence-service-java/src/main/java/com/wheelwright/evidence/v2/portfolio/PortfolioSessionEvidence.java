package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.*;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Reuses the accepted tt completed-session policy. Session receipt is never a quote event clock. */
public final class PortfolioSessionEvidence {
 private PortfolioSessionEvidence(){}
 private static final Duration MAX_AGE=Duration.ofHours(12);
 public record Context(JsonNode session,ObjectNode evidence,Instant received){public Context{Objects.requireNonNull(session);Objects.requireNonNull(evidence);Objects.requireNonNull(received);}}
 public static JsonNode validate(byte[] bytes)throws Exception{
  var root=JSON.readTree(bytes);String context=root.path("context").asText();var data=root.path("data");
  if(!data.isObject()||!data.path("state").isTextual()||data.path("state").asText().isBlank()||!context.isBlank()&&!context.equals("/market-time/equities/sessions/current")||root.findValue("account-number")!=null||root.findValue("account_number")!=null||root.findValue("accounts")!=null||data.has("instrument-collection")&&!data.path("instrument-collection").asText().equals("Equity"))throw new IllegalArgumentException("unsupported equity session source");
  return data;
 }
 public static Optional<Context> read(PortfolioRepository repo,String account,Instant now)throws Exception{
  try(var c=repo.connection();var q=c.prepareStatement("SELECT i.status,i.import_id,i.imported_at,a.artifact_id,a.payload FROM brokerage_import i JOIN brokerage_artifact a ON a.account=i.account AND a.artifact_id=i.artifact_id WHERE i.account=? AND i.file_type='API_MARKET_SESSION' ORDER BY i.imported_at DESC,i.import_id DESC LIMIT 1")){
   q.setString(1,account);try(var row=q.executeQuery()){
    if(!row.next()||!row.getString("status").equals("ACCEPTED"))return Optional.empty();var received=instant(row.getString("imported_at"));
    // A past Closed response cannot indefinitely qualify prices after another session could open.
    if(received==null||received.isAfter(now.plusSeconds(60))||received.isBefore(now.minus(MAX_AGE)))return Optional.empty();
    var session=validate(row.getBytes("payload"));var ref=source(account,row.getString("artifact_id"),"/data",null,received.toString(),"TASTYTRADE");ref.put("recordKey",row.getString("import_id")).put("requiredCapability","account.market.read:"+account).put("timeAuthority","BACKEND_RECEIPT");return Optional.of(new Context(session,ref,received));
   }
  }
 }
 public static String freshness(Instant at,Instant now,JsonNode session){
  if(at==null||at.isAfter(now.plusSeconds(60)))return "UNKNOWN";
  if(!at.isBefore(now.minus(MAX_AGE)))return "CURRENT";
  var completed=completedSession(session,now);return completed!=null&&!at.isBefore(completed[0])&&at.atZone(ZoneId.of("America/New_York")).toLocalDate().equals(completed[1].atZone(ZoneId.of("America/New_York")).toLocalDate())?"RETAINED_SESSION":"STALE";
 }
 private static Instant[] completedSession(JsonNode session,Instant now){
  if(session==null||!session.path("state").asText().equals("Closed"))return null;Instant[] latest=null;
  for(var item:List.of(session,session.path("previous-session"))){var open=instant(item.path("open-at").asText());var close=instant(item.path("close-at").asText());if(open!=null&&close!=null&&open.isBefore(close)&&!close.isAfter(now)&&(latest==null||close.isAfter(latest[1])))latest=new Instant[]{open,close};}
  if(latest==null)return null;for(var item:List.of(session,session.path("next-session"))){var open=instant(item.path("open-at").asText());if(open!=null&&!open.isAfter(now)&&open.isAfter(latest[1]))return null;}return latest;
 }
 public static ObjectNode qualify(ObjectNode observation,Instant now,Optional<Context> context){
  context=context.filter(c->!c.received().isAfter(now.plusSeconds(60))&&!c.received().isBefore(now.minus(MAX_AGE)));
  var value=observation.deepCopy();var session=context.map(Context::session).orElse(null);String status=freshness(instant(value.path("observedAt").asText()),now,session);value.put("freshness",status);
  value.put("session",session==null?"UNKNOWN":switch(session.path("state").asText()){case "Open"->"OPEN";case "Closed"->"CLOSED";case "PreMarket","Pre-market"->"PREMARKET";default->"OTHER";});
  if(status.equals("RETAINED_SESSION")&&context.isPresent()){
   var ref=context.get().evidence();((com.fasterxml.jackson.databind.node.ArrayNode)value.path("evidence")).add(ref);
   for(String field:List.of("mid","bid","ask","mark"))if(value.path(field).isObject()){
    var metric=(ObjectNode)value.path(field);((com.fasterxml.jackson.databind.node.ArrayNode)metric.path("evidence")).add(ref.deepCopy());((com.fasterxml.jackson.databind.node.ArrayNode)metric.path("assumptions")).add("Source quote retained from the latest completed equities session using separately received broker session context; session receipt is not quote event time.");
   }
  }return value;
 }
 private static Instant instant(String value){if(value==null)return null;try{return Instant.parse(value);}catch(java.time.DateTimeException ignored){return null;}}
}
