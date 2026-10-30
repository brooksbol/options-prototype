package com.wheelwright.evidence.v2.portfolio;
import com.fasterxml.jackson.databind.JsonNode;
import com.wheelwright.evidence.v2.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;

/** An explicit inventory view of the Positions collection, not a new lifecycle resource. */
@org.springframework.stereotype.Component
public final class TacticalInventoryController {
 private final PortfolioTacticalInventory inventory;private final BearerAuthenticator auth;private final AccountDirectory accounts;private final Clock clock;
 @org.springframework.beans.factory.annotation.Autowired
 public TacticalInventoryController(PortfolioTacticalInventory inventory,BearerAuthenticator auth,AccountDirectory accounts){this(inventory,auth,accounts,Clock.systemUTC());}
 public TacticalInventoryController(PortfolioTacticalInventory inventory,BearerAuthenticator auth,AccountDirectory accounts,Clock clock){this.inventory=inventory;this.auth=auth;this.accounts=accounts;this.clock=clock;}
 public ResponseEntity<JsonNode> get(HttpServletRequest request,@RequestBody(required=false)byte[] body)throws Exception{
  String id=UUID.randomUUID().toString();var ids=Collections.list(request.getHeaders("X-Request-Id"));if(ids.size()==1&&validUuid(ids.getFirst().trim()))id=ids.getFirst().trim();
  if(!auth.configured())return problem(503,ProblemCode.CAPABILITY_UNAVAILABLE,id,"Authentication unavailable");var who=auth.authenticate(request.getHeader("Authorization"));if(who.isEmpty())return problem(401,ProblemCode.UNAUTHENTICATED,id,"Missing or invalid Bearer credential");var caller=who.get();
  if(body!=null&&body.length>0||ids.size()>1||ids.size()==1&&!ids.getFirst().isBlank()&&!validUuid(ids.getFirst().trim()))return problem(422,ProblemCode.INVALID_REQUEST,id,"Invalid request body or correlation");
  for(var name:request.getParameterMap().keySet())if(!Set.of("view","accountId","underlying").contains(name)||request.getParameterValues(name).length!=1)return problem(422,ProblemCode.INVALID_REQUEST,id,"Unknown or repeated inventory selector");
  String account=request.getParameter("accountId"),underlying=request.getParameter("underlying");if(account!=null&&!AccountDirectory.validId(account)||underlying!=null&&!underlying.matches("[A-Z0-9^][A-Z0-9.^/-]{0,31}"))return problem(422,ProblemCode.INVALID_REQUEST,id,"Canonical inventory selector required");
  if(account!=null&&!caller.hasGrant("account.read:"+account))return problem(403,ProblemCode.FORBIDDEN,id,"Account metadata capability required");if(account!=null&&accounts.get(account).isEmpty())return problem(404,ProblemCode.NOT_FOUND,id,"Account not found");
  try{var result=inventory.read(account,underlying,id,caller,clock.instant());return ResponseEntity.ok().header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(MediaType.APPLICATION_JSON).body(result);}
  catch(java.sql.SQLException|IllegalStateException e){return problem(503,ProblemCode.CAPABILITY_UNAVAILABLE,id,e instanceof IllegalStateException&&e.getMessage()!=null&&e.getMessage().startsWith("Complete tactical inventory exceeds")?"Complete selected tactical inventory exceeds100000 bytes":"Complete selected tactical inventory unavailable; narrow scope or inspect retained source details");}
  catch(Exception e){return problem(500,ProblemCode.INTERNAL_ERROR,id,"Tactical inventory representation unavailable");}
 }
 private static boolean validUuid(String v){return v.matches("[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}");}
 private static ResponseEntity<JsonNode> problem(int status,ProblemCode code,String id,String detail){JsonNode body=PortfolioJson.JSON.valueToTree(ProblemDetails.of(code,id,detail,code==ProblemCode.INVALID_REQUEST?List.of(new ProblemDetails.InvalidParam("request",detail)):null));var r=ResponseEntity.status(status).header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(MediaType.APPLICATION_PROBLEM_JSON);if(status==401)r.header("WWW-Authenticate","Bearer");return r.body(body);}
}
