package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/** Authenticated User -> explicitly authorized Account -> transaction history. */
@RestController
public class TransactionsController {
    private final TransactionHistory history;
    private final AccountDirectory accounts;
    private final BearerAuthenticator auth;
    private final ObjectMapper json;
    public TransactionsController(TransactionHistory history,AccountDirectory accounts,BearerAuthenticator auth,ObjectMapper json) {
        this.history=history;this.accounts=accounts;this.auth=auth;this.json=json;
    }
    @GetMapping({"/v2/accounts/{accountId}/transactions","/v2/accounts/{accountId}/transactions/{transactionId}"})
    public ResponseEntity<String> read(@PathVariable String accountId,@PathVariable(required=false) String transactionId,
            @RequestBody(required=false) byte[] body,HttpServletRequest request)throws Exception {
        var headers=Collections.list(request.getHeaders("X-Request-Id"));String supplied=headers.size()==1?headers.getFirst().trim():"";
        boolean bad=headers.size()>1||!supplied.isEmpty()&&!HeldQuoteDiscoveryItem.validUuid(supplied);
        String id=!bad&&!supplied.isEmpty()?supplied:UUID.randomUUID().toString();
        if(!auth.configured())return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"authentication is not configured");
        var user=auth.authenticate(request.getHeader("Authorization"));
        if(user.isEmpty())return problem(ProblemCode.UNAUTHENTICATED,id,"missing or invalid Bearer credential");
        if(!user.get().hasGrant("account.transactions.read:"+accountId))return problem(ProblemCode.FORBIDDEN,id,"caller lacks Account history authority");
        if(bad||!AccountDirectory.validId(accountId)||transactionId!=null&&!HeldQuoteDiscoveryItem.validUuid(transactionId)||body!=null&&body.length!=0||request.getQueryString()!=null&&!request.getQueryString().isEmpty())
            return problem(ProblemCode.INVALID_REQUEST,id,"canonical identities required; GET query/body unsupported");
        try {
            if(accounts.get(accountId).isEmpty())return problem(ProblemCode.NOT_FOUND,id,"Account not found");
            var result=history.read(accountId,id);
            if(transactionId!=null) {
                var items=(List<?>)result.get("transactions");Object found=null;
                for(Object item:items)if(item instanceof Map<?,?> row&&transactionId.equals(row.get("transactionId")))found=item;
                if(found==null)return problem(ProblemCode.NOT_FOUND,id,"transaction not found in selected Account");
                result.remove("transactions");result.put("transaction",found);
            }
            String content=json.writeValueAsString(result);
            if(content.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>BrokerageArtifacts.MAX_BYTES)return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"complete history exceeds response capacity");
            return ResponseEntity.ok().header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(MediaType.APPLICATION_JSON).body(content);
        }catch(UnsupportedOperationException e){return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"transaction source unavailable for selected Account");}
        catch(java.sql.SQLException e){return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"history storage unavailable");}
        catch(Exception e){return problem(ProblemCode.INTERNAL_ERROR,id,"history read failed");}
    }
    private ResponseEntity<String> problem(ProblemCode code,String id,String detail)throws Exception {
        var b=ResponseEntity.status(code.status()).header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(MediaType.APPLICATION_PROBLEM_JSON);
        if(code==ProblemCode.UNAUTHENTICATED)b.header("WWW-Authenticate","Bearer");
        return b.body(json.writeValueAsString(ProblemDetails.of(code,id,detail,code==ProblemCode.INVALID_REQUEST?List.of(new ProblemDetails.InvalidParam("request",detail)):null)));
    }
}
