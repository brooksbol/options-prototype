package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
public class PositionAssociationsController {
    private final PositionAssociations service;private final BearerAuthenticator auth;private final ObjectMapper json;
    public PositionAssociationsController(PositionAssociations service,BearerAuthenticator auth,ObjectMapper json){this.service=service;this.auth=auth;this.json=json;}
    private String correlation(HttpServletRequest request) {
        var ids=Collections.list(request.getHeaders("X-Request-Id"));String s=ids.size()==1?ids.getFirst().trim():"";
        return ids.size()<2&&!s.isEmpty()&&HeldQuoteDiscoveryItem.validUuid(s)?s:UUID.randomUUID().toString();
    }
    private boolean validRequest(HttpServletRequest r) {
        var ids=Collections.list(r.getHeaders("X-Request-Id"));return r.getParameterMap().isEmpty()&&ids.size()<=1&&(ids.isEmpty()||ids.getFirst().isBlank()||HeldQuoteDiscoveryItem.validUuid(ids.getFirst().trim()));
    }
    @PostMapping("/v2/position-associations")
    public ResponseEntity<String> create(@RequestBody(required=false) byte[] body,HttpServletRequest request)throws Exception {
        String id=correlation(request);
        if(!auth.configured())return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"authentication unavailable");
        var caller=auth.authenticate(request.getHeader("Authorization"));if(caller.isEmpty())return problem(ProblemCode.UNAUTHENTICATED,id,"missing or invalid Bearer credential");
        if(request.getContentType()==null||!request.getContentType().matches("(?i)application/json(?:\\s*;.*)?"))return problem(ProblemCode.UNSUPPORTED_MEDIA_TYPE,id,"JSON required");
        JsonNode tree;try{tree=ContractEvidence.document(body);}catch(Exception e){return problem(ProblemCode.MALFORMED_REQUEST,id,"malformed JSON");}
        if(tree==null||!tree.isObject())return problem(ProblemCode.INVALID_REQUEST,id,"assertion object required");
        String account=tree.path("accountId").asText();
        if(!caller.get().hasGrant("account.positions.associate:"+account))return problem(ProblemCode.FORBIDDEN,id,"caller lacks Account association authority");
        if(!validRequest(request))return problem(ProblemCode.INVALID_REQUEST,id,"unknown query or invalid correlation");
        try {
            for(String field:List.of("accountId","snapshotId","submissionId","action","declaration"))if(!tree.path(field).isTextual())throw new IllegalArgumentException("string required");
            if(!tree.has("supersedesAssociationId")||!tree.path("supersedesAssociationId").isNull()&&!tree.path("supersedesAssociationId").isTextual())throw new IllegalArgumentException("nullable supersession field required");
            if(!tree.path("allocations").isArray())throw new IllegalArgumentException("allocations required");
            for(var part:tree.path("allocations"))if(!part.path("holdingId").isTextual()||!part.path("signedQuantity").isTextual())throw new IllegalArgumentException("allocation strings required");
            var strict=json.copy().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).disable(MapperFeature.ALLOW_COERCION_OF_SCALARS);
            var input=strict.treeToValue(tree,PositionAssociations.Input.class);PositionAssociations.valid(input);
            var result=service.create(input,caller.get().userId());
            var response=respond(result.added()?201:200,id,Map.of("requestId",id,"association",result.association()));
            return result.added()?ResponseEntity.status(201).headers(response.getHeaders()).header("Location","/v2/position-associations/"+result.association().associationId()).body(response.getBody()):response;
        }catch(NoSuchElementException e){return problem(ProblemCode.NOT_FOUND,id,"no retained snapshot");}
        catch(IllegalArgumentException|com.fasterxml.jackson.core.JsonProcessingException e){return problem(ProblemCode.INVALID_REQUEST,id,"invalid assertion or allocation; current snapshot and conserved whole quantities required");}
        catch(java.sql.SQLException e){return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"association storage unavailable");}
        catch(Exception e){return problem(ProblemCode.INTERNAL_ERROR,id,"association operation failed");}
    }
    @GetMapping("/v2/position-associations/{associationId}")
    public ResponseEntity<String> read(@PathVariable String associationId,@RequestBody(required=false)byte[] body,HttpServletRequest request)throws Exception {
        String id=correlation(request);
        if(!auth.configured())return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"authentication unavailable");
        var caller=auth.authenticate(request.getHeader("Authorization"));if(caller.isEmpty())return problem(ProblemCode.UNAUTHENTICATED,id,"missing or invalid Bearer credential");
        try {
            var owner=service.owner(associationId);if(owner.isEmpty())return problem(ProblemCode.NOT_FOUND,id,"association not found");
            if(!caller.get().hasGrant("account.positions.read:"+owner.get()))return problem(ProblemCode.FORBIDDEN,id,"caller lacks Account Position read authority");
            if(!validRequest(request)||body!=null&&body.length>0)return problem(ProblemCode.INVALID_REQUEST,id,"GET body/query or invalid correlation");
            return respond(200,id,Map.of("requestId",id,"association",service.get(associationId).orElseThrow()));
        }catch(java.sql.SQLException e){return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"association storage unavailable");}
        catch(Exception e){return problem(ProblemCode.INTERNAL_ERROR,id,"association read failed");}
    }
    private ResponseEntity<String> problem(ProblemCode code,String id,String detail)throws Exception {
        var headers=new HttpHeaders();headers.set("X-Request-Id",id);headers.set("Cache-Control","private, no-store");headers.setContentType(MediaType.APPLICATION_PROBLEM_JSON);if(code==ProblemCode.UNAUTHENTICATED)headers.set("WWW-Authenticate","Bearer");
        return ResponseEntity.status(code.status()).headers(headers).body(json.writeValueAsString(ProblemDetails.of(code,id,detail,code==ProblemCode.INVALID_REQUEST?List.of(new ProblemDetails.InvalidParam("request",detail)):null)));
    }
    private ResponseEntity<String> respond(int status,String id,Object value)throws Exception{return ResponseEntity.status(status).header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(MediaType.APPLICATION_JSON).body(json.writeValueAsString(value));}
}
