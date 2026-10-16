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
    private final ContractDefinitionAcquisition definitions;
    public PositionAcquisitionController(PositionAcquisition service,AccountDirectory accounts,BearerAuthenticator auth,ObjectMapper mapper){this(service,accounts,auth,mapper,null);}
    @org.springframework.beans.factory.annotation.Autowired
    public PositionAcquisitionController(PositionAcquisition service,AccountDirectory accounts,BearerAuthenticator auth,ObjectMapper mapper,ContractDefinitionAcquisition definitions) {
        this.service=service;this.accounts=accounts;this.auth=auth;this.mapper=mapper;this.definitions=definitions;
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
        String mode=request.getParameter("mode"),snapshot=request.getParameter("snapshotId");
        if(mode!=null)return definitions(accountId,mode,snapshot,body,request,bad,id);
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
    private ResponseEntity<String> definitions(String account,String mode,String snapshot,byte[] body,HttpServletRequest request,boolean bad,String id)throws Exception {
        if(bad||!AccountDirectory.validId(account)||!mode.equals("contract-terms")||snapshot==null||snapshot.isBlank()||snapshot.length()>256||body!=null&&body.length>0)return problem(ProblemCode.INVALID_REQUEST,id,"contract-terms requires exact Account/snapshot and no body");
        for(String key:Collections.list(request.getParameterNames()))if(!Set.of("accountId","mode","snapshotId").contains(key)||request.getParameterValues(key).length!=1)return problem(ProblemCode.INVALID_REQUEST,id,"unknown or repeated selector");
        if(accounts.get(account).isEmpty())return problem(ProblemCode.NOT_FOUND,id,"Account not found");
        if(definitions==null||!definitions.configured())return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"contract acquisition unavailable");
        try{return response(200,id,MediaType.APPLICATION_JSON,definitions.acquire(account,snapshot,id));}
        catch(NoSuchElementException e){return problem(ProblemCode.NOT_FOUND,id,"snapshot not found in Account");}
        catch(java.sql.SQLException e){return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"contract storage unavailable");}
        catch(Exception e){return problem(ProblemCode.INTERNAL_ERROR,id,"contract acquisition failed; retained evidence preserved");}
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
