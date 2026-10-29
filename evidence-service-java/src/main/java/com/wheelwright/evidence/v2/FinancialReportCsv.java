package com.wheelwright.evidence.v2;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
/** CSV representation of an existing governed result. Copies results; performs no financial calculation. */
final class FinancialReportCsv {
 record Export(String filename,String content,String sha256){}
 private FinancialReportCsv(){}
 static String text(JsonNode n){return n==null||n.isNull()||n.isMissingNode()?"":n.asText();}
 static String cell(String value,boolean numeric){String safe=value==null?"":value;if(!numeric&&safe.matches("(?s)^[\\s\\p{Cc}\\p{Cf}\\p{Z}]*[=+@-].*"))safe="'"+safe;return "\""+safe.replace("\"","\"\"")+"\"";}
 static void row(StringBuilder out,List<String> values,Set<Integer> numbers){for(int i=0;i<values.size();i++){if(i>0)out.append(',');out.append(cell(values.get(i),numbers.contains(i)&&values.get(i).matches("-?[0-9]+(?:\\.[0-9]+)?")));}out.append("\r\n");}
 static String amount(JsonNode pnl){String value=text(pnl.path("value"));if(value.isEmpty())return "";return text(pnl.path("currency")).equals("USD")?new BigDecimal(value).setScale(2,RoundingMode.HALF_UP).toPlainString():value;}
 static String safeName(String alias){return alias.replaceAll("[^A-Za-z0-9_-]","_");}
 static Optional<Export> result(String filename,StringBuilder csv){String content=csv.toString();byte[] bytes=content.getBytes(StandardCharsets.UTF_8);return bytes.length>100000?Optional.empty():Optional.of(new Export(filename,content,BrokerageArtifacts.sha(bytes)));}
 static Optional<Export> balances(JsonNode report,String alias){
  if(report.path("observations").size()!=1)return Optional.empty();var observation=report.path("observations").get(0);var source=observation.path("source");var csv=new StringBuilder();
  row(csv,List.of("Account","Broker","Currency","Unit","Broker field","Meaning","Status","Reported amount","Reported display","Source observed at","Source date","Source exported at","Source received at","Currentness","History coverage"),Set.of());
  for(var field:observation.path("fields"))row(csv,List.of(alias,text(observation.path("broker")),text(observation.path("currency")),text(observation.path("unit")),text(field.path("brokerField")),text(field.path("meaning")),text(field.path("status")),text(field.path("value")),text(field.path("reportedDisplay")),text(source.path("observedAt")),text(source.path("observationDate")),text(source.path("exportedAt")),text(source.path("receivedAt")),text(report.path("currentness")),text(report.path("historyCoverage"))),Set.of(7));
  return result(safeName(alias)+"-retained-balance.csv",csv);
 }
 static Optional<Export> closedTrades(JsonNode report,String alias,boolean firstPage){
  if(!firstPage||!report.path("view").asText().equals("closed-trades")||!report.path("nextCursor").isNull()||!report.path("pageComplete").asBoolean())return Optional.empty();var csv=new StringBuilder();var p=report.path("period");var t=report.path("totals");
  row(csv,List.of("Account","Period from","Period through","Time zone","Metric","Trade","Closed at","Net P/L","Currency","Accounting amount","Result status","Outcome","Winners","Losers","Coverage status","Qualification","Coverage details","Trade qualification","Provider","Environment"),Set.of());
  for(var trade:report.path("trades")){var pnl=trade.path("netPnl");row(csv,List.of(alias,text(p.path("from")),text(p.path("through")),text(p.path("timeZone")),text(report.path("metric")),text(trade.path("label")),text(trade.path("closingExecutedAt")),amount(pnl),text(pnl.path("currency")),text(pnl.path("value")),text(pnl.path("status")),text(pnl.path("outcome")),"","",text(report.at("/coverage/status")),text(report.path("qualification")),report.path("coverage").toString(),trade.path("qualifications").toString(),text(report.path("provider")),text(report.path("environment"))),Set.of(7,9));}
  var pnl=t.path("netPnl");row(csv,List.of(alias,text(p.path("from")),text(p.path("through")),text(p.path("timeZone")),text(report.path("metric")),"TOTAL","",amount(pnl),text(pnl.path("currency")),text(pnl.path("value")),text(pnl.path("status")),text(pnl.path("outcome")),text(t.path("winners")),text(t.path("losers")),text(report.at("/coverage/status")),text(report.path("qualification")),report.path("coverage").toString(),"",text(report.path("provider")),text(report.path("environment"))),Set.of(7,9,12,13));
  return result(safeName(alias)+"-closed-trades-"+text(p.path("from"))+"-"+text(p.path("through"))+".csv",csv);
 }
 static ObjectNode metadata(Export e,String href,com.fasterxml.jackson.databind.ObjectMapper json){var n=json.createObjectNode();n.put("href",href+"&format=csv&expectedSha256="+e.sha256()).put("sha256",e.sha256()).put("filename",e.filename()).put("mediaType","text/csv");return n;}
}
