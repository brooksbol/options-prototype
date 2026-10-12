package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
public class PositionAcquisitionController {
    private final PositionAcquisition service;
    private final AccountDirectory accounts;
    private final BearerAuthenticator auth;
    private final ObjectMapper mapper;
    public PositionAcquisitionController(PositionAcquisition service,AccountDirectory accounts,BearerAuthenticator auth,ObjectMapper mapper) {
        this.service=service;this.accounts=accounts;this.auth=auth;this.mapper=mapper;
    }
    @PostMapping("/v2/position-acquisitions")
    public ResponseEntity<String> acquire(@RequestParam(required=false) String accountId,@RequestBody(required=false) byte[] body,HttpServletRequest request)throws Exception {
        var ids=Collections.list(request.getHeaders("X-Request-Id"));
        String supplied=ids.size()==1?ids.getFirst().trim():"";
        boolean bad=ids.size()>1||!supplied.isEmpty()&&!HeldQuoteDiscoveryItem.validUuid(supplied);
        String id=!bad&&!supplied.isEmpty()?supplied:UUID.randomUUID().toString();
        if(!auth.configured())return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"authentication is not configured");
        var caller=auth.authenticate(request.getHeader("Authorization"));
        if(caller.isEmpty())return problem(ProblemCode.UNAUTHENTICATED,id,"missing or invalid Bearer credential");
        if(!caller.get().hasGrant("account.positions.acquire:"+accountId))return problem(ProblemCode.FORBIDDEN,id,"caller lacks account-scoped acquisition authority");
        if(bad||!AccountDirectory.validId(accountId)||body!=null&&body.length>0||!Collections.list(request.getParameterNames()).equals(List.of("accountId"))||request.getParameterValues("accountId")==null||request.getParameterValues("accountId").length!=1)
            return problem(ProblemCode.INVALID_REQUEST,id,"body unsupported; exactly one canonical accountId selector and single UUID correlation required");
        try {
            var account=accounts.get(accountId);
            if(account.isEmpty())return problem(ProblemCode.NOT_FOUND,id,"Account not found");
            if(!account.get().brokerAssociation().broker().equals("TASTYTRADE")||!service.configured())
                return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"brokerage acquisition unavailable");
            return response(200,id,MediaType.APPLICATION_JSON,service.acquire(accountId,id));
        }catch(java.sql.SQLException e){return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"acquisition storage unavailable; inspect retained evidence before retry");}
        catch(Exception e){return problem(ProblemCode.INTERNAL_ERROR,id,"acquisition failed; inspect retained evidence before retry");}
    }
    private ResponseEntity<String> problem(ProblemCode code,String id,String detail)throws Exception {
        var response=response(code.status(),id,MediaType.APPLICATION_PROBLEM_JSON,ProblemDetails.of(code,id,detail,
                code==ProblemCode.INVALID_REQUEST?List.of(new ProblemDetails.InvalidParam("request",detail)):null));
        return code==ProblemCode.UNAUTHENTICATED?ResponseEntity.status(code.status()).headers(response.getHeaders()).header("WWW-Authenticate","Bearer").body(response.getBody()):response;
    }
    private ResponseEntity<String> response(int status,String id,MediaType type,Object value)throws Exception {
        return ResponseEntity.status(status).header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(type).body(mapper.writeValueAsString(value));
    }
}
