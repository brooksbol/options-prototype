package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.v2.portfolio.OptionInventoryReader;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
public final class OptionInventoryController {
    private final OptionInventoryReader reader;
    private final AccountDirectory accounts;
    private final BearerAuthenticator auth;
    private final ObjectMapper json;
    public OptionInventoryController(OptionInventoryReader reader,AccountDirectory accounts,BearerAuthenticator auth,ObjectMapper json) {
        this.reader=reader;this.accounts=accounts;this.auth=auth;this.json=json;
    }
    @GetMapping("/v2/option-inventory")
    public ResponseEntity<String> read(@RequestParam(required=false) String accountId,@RequestParam(required=false) String right,
            @RequestParam(required=false) String side,@RequestBody(required=false) byte[] body,HttpServletRequest request)throws Exception {
        var correlations=Collections.list(request.getHeaders("X-Request-Id"));
        String supplied=correlations.size()==1?correlations.getFirst().strip():"";
        boolean bad=correlations.size()>1||!supplied.isEmpty()&&!HeldQuoteDiscoveryItem.validUuid(supplied);
        String id=!bad&&!supplied.isEmpty()?supplied:UUID.randomUUID().toString();
        if(!auth.configured())return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"authentication is not configured");
        var caller=auth.authenticate(request.getHeader("Authorization"));
        if(caller.isEmpty())return problem(ProblemCode.UNAUTHENTICATED,id,"missing or invalid Bearer credential");
        if(accountId!=null&&!caller.get().hasGrant("account.read:"+accountId))return problem(ProblemCode.FORBIDDEN,id,"Account metadata scope not authorized");
        if(bad||accountId!=null&&!AccountDirectory.validId(accountId)||right!=null&&!Set.of("PUT","CALL").contains(right)||side!=null&&!Set.of("SHORT","LONG").contains(side)||body!=null&&body.length>0)
            return problem(ProblemCode.INVALID_REQUEST,id,"invalid option inventory selector");
        for(String name:Collections.list(request.getParameterNames()))if(!Set.of("accountId","right","side").contains(name)||request.getParameterValues(name).length!=1)
            return problem(ProblemCode.INVALID_REQUEST,id,"unknown or repeated query parameter");
        try {
            if(accountId!=null&&accounts.get(accountId).isEmpty())return problem(ProblemCode.NOT_FOUND,id,"Account not found");
            var value=reader.read(accountId,right,side,id,caller.get());String content=json.writeValueAsString(value);
            if(content.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>200000)return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"bounded inventory capacity exceeded");
            return ResponseEntity.ok().header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(MediaType.APPLICATION_JSON).body(content);
        }catch(IllegalStateException e){return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"bounded inventory capacity exceeded");}
        catch(java.sql.SQLException e){return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"inventory storage unavailable");}
        catch(Exception e){return problem(ProblemCode.INTERNAL_ERROR,id,"option inventory unavailable");}
    }
    private ResponseEntity<String> problem(ProblemCode code,String id,String detail)throws Exception {
        var result=ResponseEntity.status(code.status()).header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(MediaType.APPLICATION_PROBLEM_JSON);
        if(code==ProblemCode.UNAUTHENTICATED)result.header("WWW-Authenticate","Bearer");
        return result.body(json.writeValueAsString(ProblemDetails.of(code,id,detail,code==ProblemCode.INVALID_REQUEST?List.of(new ProblemDetails.InvalidParam("query","valid singleton Account/right/side selectors required")):null)));
    }
}
