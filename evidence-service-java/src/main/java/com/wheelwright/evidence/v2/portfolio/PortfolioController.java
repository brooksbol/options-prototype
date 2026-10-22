package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

@RestController
public final class PortfolioController {
 private final PortfolioReadService service;private final BearerAuthenticator auth;private final AccountDirectory accounts;private final byte[] cursorKey=new byte[32];
 public PortfolioController(PortfolioReadService service,BearerAuthenticator auth,AccountDirectory accounts){this.service=service;this.auth=auth;this.accounts=accounts;new SecureRandom().nextBytes(cursorKey);}
 @GetMapping({"/v2/positions","/v2/positions/{positionId}","/v2/constructions","/v2/constructions/{constructionId}","/v2/constructions/models","/v2/constructions/models/{modelId}","/v2/constructions/models/{modelId}/versions/{versionId}","/v2/orders","/v2/orders/{orderId}","/v2/instruments","/v2/instruments/{instrumentId}","/v2/market-observations","/v2/market-observations/{observationId}","/v2/holdings","/v2/holdings/{holdingId}","/v2/positions/{positionId}/audit","/v2/positions/{positionId}/audit/{auditId}","/v2/accounts/{accountId}/inventory-reconciliation"})
 public ResponseEntity<JsonNode> get(HttpServletRequest request,@RequestBody(required=false) byte[] body)throws Exception {
  var ids=Collections.list(request.getHeaders("X-Request-Id"));String supplied=ids.size()==1?ids.getFirst().trim():"";boolean badCorrelation=ids.size()>1||!supplied.isEmpty()&&!validUuid(supplied);String id=!badCorrelation&&!supplied.isEmpty()?supplied:UUID.randomUUID().toString();
  if(!auth.configured())return problem(503,"CAPABILITY_UNAVAILABLE",id,"Authentication unavailable");var identity=auth.authenticate(request.getHeader("Authorization"));if(identity.isEmpty())return problem(401,"UNAUTHENTICATED",id,"Missing or invalid Bearer credential");var caller=identity.get();
  String path=request.getRequestURI();Kind kind=kind(path);String account=request.getParameter("accountId");boolean recon=path.endsWith("/inventory-reconciliation");if(recon)account=path.split("/")[3];
  if(account!=null&&!caller.hasGrant(kind==Kind.MARKET_OBSERVATION?"account.market.read:"+account:PortfolioAuthorization.grant(kind,account)))return problem(403,"FORBIDDEN",id,"Account capability required");
  if(recon&&!caller.hasGrant("account.holdings.read:"+account))return problem(403,"FORBIDDEN",id,"Account holdings capability required for custody reconciliation");
  boolean collection=isCollection(path);Set<String> parameters=collection?params(kind,path):Set.of();
  if(body!=null&&body.length>0||badCorrelation)return problem(422,"INVALID_REQUEST",id,"Invalid correlation header or GET body");
  for(String name:request.getParameterMap().keySet())if(!parameters.contains(name)||request.getParameterValues(name).length!=1)return problem(422,"INVALID_REQUEST",id,"Unknown or repeated query parameter");
  if(account!=null&&!AccountDirectory.validId(account))return problem(422,"INVALID_REQUEST",id,"Canonical Account ID required");
  if(Set.of(Kind.MODEL,Kind.MODEL_VERSION,Kind.INSTRUMENT,Kind.MARKET_OBSERVATION).contains(kind)&&!caller.hasGrant(PortfolioAuthorization.grant(kind,null)))return problem(403,"FORBIDDEN",id,"Reference or market capability required");
  boolean selectorsValid=false;
  try{
   String projection=Optional.ofNullable(request.getParameter("projection")).orElse("summary"),sort=Optional.ofNullable(request.getParameter("sort")).orElse("id");if(!Set.of("uri","summary","expanded").contains(projection)||!Set.of("id","-id").contains(sort))return problem(422,"INVALID_REQUEST",id,"Invalid projection or sort");
   int limit=50;try{if(request.getParameter("limit")!=null)limit=Integer.parseInt(request.getParameter("limit"));}catch(NumberFormatException e){return problem(422,"INVALID_REQUEST",id,"Invalid limit");}if(limit<1||limit>200)return problem(422,"INVALID_REQUEST",id,"Limit outside1..200");
   Set<String> includes=new LinkedHashSet<>();if(request.getParameter("include")!=null){includes.addAll(Arrays.asList(request.getParameter("include").split(",",-1)));if(!Set.of("currentConstruction","constituents","modelVersion","holdingSummaries","orderSummaries").containsAll(includes))return problem(422,"INVALID_REQUEST",id,"Invalid include");}
   String brokerGroup=request.getParameter("brokerGroupId");if(brokerGroup!=null&&(brokerGroup.isBlank()||brokerGroup.length()>1024))return problem(422,"INVALID_REQUEST",id,"Invalid broker group selector");
   String state=request.getParameter("state");if(state!=null&&!Set.of("OPEN","CLOSED","UNRESOLVED").contains(state))return problem(422,"INVALID_REQUEST",id,"Invalid state");
   String exposure=request.getParameter("exposureStatus");if(exposure!=null&&!Set.of("OBSERVED","ZERO_OBSERVED","UNKNOWN","RETAINED","SUPERSEDED_INTERPRETATION").contains(exposure))return problem(422,"INVALID_REQUEST",id,"Invalid exposure status");
   String snapshot=request.getParameter("snapshotId"),view=request.getParameter("view");if(snapshot!=null&&(account==null||snapshot.isBlank()||view!=null)||view!=null&&(!view.equals("observations")||request.getParameter("projection")!=null))return problem(422,"INVALID_REQUEST",id,"Invalid snapshot/view selection");
   String signature=signature(request,caller);String after="";if(request.getParameter("cursor")!=null){String[] decoded=decode(request.getParameter("cursor"));if(!decoded[0].equals(signature))return problem(422,"INVALID_REQUEST",id,"Cursor scope changed");after=decoded[1];}
   for(String selector:List.of("positionId","instrumentId")){String value=request.getParameter(selector);if(value!=null&&!validUuid(value))return problem(422,"INVALID_REQUEST",id,"Canonical resource GUID required");}
   var parts=path.split("/");if(!collection&&!recon&&Set.of(Kind.POSITION,Kind.CONSTRUCTION,Kind.ORDER,Kind.INSTRUMENT,Kind.HOLDING,Kind.MARKET_OBSERVATION).contains(kind)&&!validUuid(parts[3]))return problem(422,"INVALID_REQUEST",id,"Canonical resource GUID required");
   if(kind==Kind.AUDIT&&(!validUuid(parts[3])||!collection&&!validUuid(parts[5])))return problem(422,"INVALID_REQUEST",id,"Canonical audit and Position GUID required");
   selectorsValid=true;Document filteredPosition=null;String requestedPosition=request.getParameter("positionId");
   if(requestedPosition!=null){var subject=service.find("/v2/positions/"+requestedPosition);if(subject.isEmpty()||subject.get().kind()!=Kind.POSITION||!PortfolioAuthorization.canRead(caller,subject.get())||account!=null&&!account.equals(subject.get().account()))return problem(404,"NOT_FOUND",id,"Position not found in authorized scope");filteredPosition=subject.get();}
   var knownAccounts=Set.of(Kind.MODEL,Kind.MODEL_VERSION,Kind.INSTRUMENT).contains(kind)?List.<AccountDirectory.Account>of():accounts.list();var scope=new TreeSet<String>();for(var a:knownAccounts)if(!Set.of(Kind.MODEL,Kind.MODEL_VERSION,Kind.INSTRUMENT,Kind.MARKET_OBSERVATION).contains(kind)&&caller.hasGrant(PortfolioAuthorization.grant(kind,a.id()))||kind==Kind.MARKET_OBSERVATION&&caller.hasGrant("account.market.read:"+a.id()))scope.add(a.id());if(account!=null){if(accounts.get(account).isEmpty())return problem(404,"NOT_FOUND",id,"Account not found");scope.retainAll(Set.of(account));}
   var sourceScope=new TreeSet<>(scope);if(filteredPosition!=null)sourceScope.retainAll(Set.of(filteredPosition.account()));Document selected=null;
   if(!collection&&!recon&&!Set.of(Kind.MODEL,Kind.MODEL_VERSION,Kind.INSTRUMENT).contains(kind)){var resource=service.find(path);if(resource.isEmpty()||!PortfolioAuthorization.canRead(caller,resource.get()))return problem(404,"NOT_FOUND",id,"Resource not found in authorized scope");selected=resource.get();if(selected.account()==null)sourceScope.clear();else sourceScope.retainAll(Set.of(selected.account()));}
   boolean currentEvaluation=kind==Kind.POSITION&&!recon&&!projection.equals("uri")&&(selected==null||!selected.value().path("state").asText().equals("CLOSED"));
   var orderWarnings=array();if(kind==Kind.ORDER||currentEvaluation||kind==Kind.CONSTRUCTION&&includes.contains("orderSummaries")){var orderScope=new TreeSet<String>();for(String a:sourceScope)if(caller.hasGrant("account.orders.read:"+a))orderScope.add(a);orderWarnings.addAll(service.synchronizeOrders(orderScope));}service.synchronize(sourceScope);
   var marketScope=new TreeSet<String>();if((currentEvaluation||kind==Kind.MARKET_OBSERVATION&&collection)&&caller.hasGrant("market.read"))for(String a:sourceScope)if(caller.hasGrant("account.market.read:"+a))marketScope.add(a);
   var marketWarnings=service.synchronizeMarket(marketScope);for(var sourceWarning:orderWarnings){var w=(ObjectNode)sourceWarning;if(kind==Kind.ORDER)w.set("affected",array().add(collection?"/items":""));else if(kind==Kind.CONSTRUCTION)w.set("affected",array().add("/included/orders"));marketWarnings.add(w);}Instant now=Instant.now();
   if(recon){var value=service.reconciliation(account,now);PortfolioAuthorization.sanitizeRepresentation(value,caller);return ok(value,id);}
   if(kind==Kind.AUDIT){var parent=service.find("/v2/positions/"+parts[3]);if(parent.isEmpty()||!caller.hasGrant("account.positions.audit.read:"+parent.get().account()))return problem(404,"NOT_FOUND",id,"Position audit not found in authorized scope");scope.retainAll(Set.of(parent.get().account()));}
   if(!collection){
    var d=service.find(path);if(d.isEmpty()||!PortfolioAuthorization.canRead(caller,d.get()))return problem(404,"NOT_FOUND",id,"Resource not found in authorized scope");var value=service.read(d.get(),caller,now);if(!marketWarnings.isEmpty())((ArrayNode)value.path("warnings")).addAll(marketWarnings);return ok(value,id);
   }
   var items=new ArrayList<ObjectNode>();
   if(view!=null){for(var x:service.snapshots(scope)){var value=(ObjectNode)x;PortfolioAuthorization.sanitizeRepresentation(value,caller);items.add(value);}}
   else for(var d:service.list(kind,scope)){
    if(!PortfolioAuthorization.canRead(caller,d))continue;
    if(brokerGroup!=null&&!brokerGroup.equals(d.value().path("brokerGroupId").asText()))continue;
    if(state!=null&&!d.value().path("state").asText().equals(state))continue;
    if(snapshot!=null&&!snapshot.equals(d.snapshot()))continue;
    if(request.getParameter("symbol")!=null&&!request.getParameter("symbol").equals(d.value().path("symbol").asText()))continue;
    if(request.getParameter("instrumentId")!=null&&!d.value().at("/instrument/href").asText().equals("/v2/instruments/"+request.getParameter("instrumentId")))continue;
    if(exposure!=null&&(d.value().path("state").asText().equals("CLOSED")||!d.value().at("/exposure/status").asText().equals(exposure)))continue;
    String positionId=request.getParameter("positionId");if(path.contains("/audit"))positionId=path.split("/")[3];
    if(positionId!=null&&!matchesPosition(d,positionId))continue;
    ObjectNode n=projection.equals("uri")?obj():service.expand(d,caller,now,includes);if(projection.equals("uri"))n.set("self",link(d.uri()));else if(projection.equals("summary")&&kind==Kind.POSITION)n.remove(List.of("stateEvidence","sourceIdentifiers","orders","audit"));items.add(n);
   }
   if(snapshot!=null&&!service.snapshotExists(account,snapshot))return problem(404,"NOT_FOUND",id,"Snapshot not found in authorized Account");
   items.sort(Comparator.comparing(PortfolioController::key));if(sort.startsWith("-"))Collections.reverse(items);final String last=after;boolean reverse=sort.startsWith("-");items.removeIf(n->!last.isEmpty()&&(reverse?key(n).compareTo(last)>=0:key(n).compareTo(last)<=0));
   boolean more=items.size()>limit;var values=array();items.stream().limit(limit).forEach(values::add);var result=obj();if(view==null)result.put("projection",projection);else result.put("view",view);result.set("items",values);var responseWarnings=kind==Kind.ORDER?service.sourceWarnings(scope):array();for(var originalWarning:marketWarnings){var w=originalWarning.deepCopy();var affected=array();for(var pointer:w.path("affected")){String value=pointer.asText();affected.add(value.startsWith("/evaluation")?"/items":value);}((ObjectNode)w).set("affected",affected);responseWarnings.add(w);}result.set("warnings",responseWarnings);if(more){String token=encode(signature,key(items.get(limit-1)));var query=new LinkedHashMap<String,String>();request.getParameterMap().forEach((k,v)->{if(!k.equals("cursor"))query.put(k,v[0]);});query.put("cursor",token);result.set("next",link(path+"?"+query.entrySet().stream().map(e->enc(e.getKey())+"="+enc(e.getValue())).collect(java.util.stream.Collectors.joining("&"))));}else result.putNull("next");return ok(result,id);
  }catch(IllegalArgumentException e){return selectorsValid?problem(500,"INTERNAL_ERROR",id,"Portfolio representation unavailable"):problem(422,"INVALID_REQUEST",id,"Invalid resource selector or cursor");}catch(java.sql.SQLException e){return problem(503,"CAPABILITY_UNAVAILABLE",id,"Portfolio storage unavailable");}catch(Exception e){return problem(500,"INTERNAL_ERROR",id,"Portfolio representation unavailable");}
 }
 private boolean matchesPosition(Document d,String id)throws Exception{
  String uri="/v2/positions/"+id;if(d.value().at("/position/href").asText().equals(uri))return true;
  for(var association:d.value().path("associations")){
   String target=association.at("/target/href").asText();if(association.path("targetKind").asText().equals("POSITION")&&target.equals(uri))return true;
   if(association.path("targetKind").asText().equals("CONSTRUCTION")){var construction=service.find(target);if(construction.isPresent()&&construction.get().kind()==Kind.CONSTRUCTION&&Objects.equals(construction.get().account(),d.account())&&construction.get().value().at("/position/href").asText().equals(uri))return true;}
  }return false;
 }
 private static String key(JsonNode n){return n.has("snapshotId")&&n.has("holdings")?n.at("/account/href").asText()+":"+n.path("snapshotId").asText():n.at("/self/href").asText();}
 private static Kind kind(String p){if(p.endsWith("inventory-reconciliation"))return Kind.POSITION;if(p.contains("/audit"))return Kind.AUDIT;if(p.contains("/constructions/models/"))return p.contains("/versions/")?Kind.MODEL_VERSION:Kind.MODEL;if(p.equals("/v2/constructions/models"))return Kind.MODEL;return switch(p.split("/")[2]){case "positions"->Kind.POSITION;case "constructions"->Kind.CONSTRUCTION;case "orders"->Kind.ORDER;case "instruments"->Kind.INSTRUMENT;case "holdings"->Kind.HOLDING;default->Kind.MARKET_OBSERVATION;};}
 private static boolean isCollection(String p){return Set.of("/v2/positions","/v2/constructions","/v2/constructions/models","/v2/orders","/v2/instruments","/v2/market-observations","/v2/holdings").contains(p)||p.endsWith("/audit");}
 private static Set<String> params(Kind kind,String path){var ps=new HashSet<>(Set.of("projection","limit","cursor","sort"));switch(kind){case POSITION->{ps.addAll(Set.of("accountId","state","include","exposureStatus"));}case CONSTRUCTION->{ps.addAll(Set.of("accountId","positionId","include"));}case ORDER->{ps.addAll(Set.of("accountId","positionId","brokerGroupId"));}case HOLDING->{ps.addAll(Set.of("accountId","snapshotId","view"));}case INSTRUMENT->ps.add("symbol");case MARKET_OBSERVATION->ps.addAll(Set.of("accountId","instrumentId"));default->{}}return ps;}
 private static boolean validUuid(String x){return x!=null&&x.matches("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");}
 private String signature(HttpServletRequest r,BearerAuthenticator.Principal p)throws Exception{var fields=new TreeMap<String,String>();r.getParameterMap().forEach((k,v)->{if(!k.equals("cursor"))fields.put(k,v[0]);});return hash(p.userId()+new TreeSet<>(p.grants())+r.getRequestURI()+fields);}
 private static String hash(String s)throws Exception{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));}
 private String encode(String scope,String last)throws Exception{String payload=Base64.getUrlEncoder().withoutPadding().encodeToString((scope+"\n"+last).getBytes(StandardCharsets.UTF_8));return payload+"."+mac(payload);}
 private String[] decode(String cursor)throws Exception{var parts=cursor.split("\\.",-1);if(parts.length!=2||!MessageDigest.isEqual(parts[1].getBytes(StandardCharsets.UTF_8),mac(parts[0]).getBytes(StandardCharsets.UTF_8)))throw new IllegalArgumentException();var text=new String(Base64.getUrlDecoder().decode(parts[0]),StandardCharsets.UTF_8).split("\n",2);if(text.length!=2)throw new IllegalArgumentException();return text;}
 private String mac(String payload)throws Exception{var m=Mac.getInstance("HmacSHA256");m.init(new SecretKeySpec(cursorKey,"HmacSHA256"));return Base64.getUrlEncoder().withoutPadding().encodeToString(m.doFinal(payload.getBytes(StandardCharsets.UTF_8)));}
 private static String enc(String x){return java.net.URLEncoder.encode(x,StandardCharsets.UTF_8);}
 private ResponseEntity<JsonNode> ok(JsonNode n,String id){return ResponseEntity.ok().header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(MediaType.APPLICATION_JSON).body(n);}
 private ResponseEntity<JsonNode> problem(int status,String code,String id,String detail){
  var fixed=ProblemCode.valueOf(code);if(fixed.status()!=status)throw new IllegalArgumentException("Problem status/code mismatch");
  JsonNode n=JSON.valueToTree(ProblemDetails.of(fixed,id,detail,fixed==ProblemCode.INVALID_REQUEST?List.of(new ProblemDetails.InvalidParam("request",detail)):null));
  var response=ResponseEntity.status(status).header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(MediaType.APPLICATION_PROBLEM_JSON);if(status==401)response.header("WWW-Authenticate","Bearer");return response.body(n);
 }
}
