package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/v2/accounts")
public class AccountsController {
    /** Ordinary metadata never carries the sensitive brokerage reference used internally. */
    public record BrokerMetadata(String broker) {}
    public record AccountMetadata(String id, String alias, String displayName, BrokerMetadata brokerAssociation) {
        static AccountMetadata from(AccountDirectory.Account account) {
            return new AccountMetadata(account.id(), account.alias(), account.displayName(),
                    new BrokerMetadata(account.brokerAssociation().broker()));
        }
    }
    public record Inventory(String requestId, List<AccountMetadata> accounts) {}
    public record Detail(String requestId, AccountMetadata account) {}
    private final AccountDirectory accounts;
    private final BearerAuthenticator auth;
    private final ObjectMapper mapper;
    public AccountsController(AccountDirectory accounts, BearerAuthenticator auth, ObjectMapper mapper) {
        this.accounts=accounts;this.auth=auth;this.mapper=mapper;
    }
    @GetMapping
    public ResponseEntity<String> list(@RequestBody(required=false) byte[] body,HttpServletRequest request)throws Exception {
        return read(null,body,request);
    }
    @GetMapping("/{accountId}")
    public ResponseEntity<String> detail(@PathVariable String accountId,@RequestBody(required=false) byte[] body,HttpServletRequest request)throws Exception {
        return read(accountId,body,request);
    }
    private ResponseEntity<String> read(String accountId,byte[] body,HttpServletRequest request)throws Exception {
        var ids=Collections.list(request.getHeaders("X-Request-Id"));
        String supplied=ids.size()==1?ids.getFirst().trim():"";
        boolean bad=ids.size()>1||!supplied.isEmpty()&&!HeldQuoteDiscoveryItem.validUuid(supplied);
        String id=!bad&&!supplied.isEmpty()?supplied:UUID.randomUUID().toString();
        if(!auth.configured())return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"authentication is not configured");
        var caller=auth.authenticate(request.getHeader("Authorization"));
        if(caller.isEmpty())return problem(ProblemCode.UNAUTHENTICATED,id,"missing or invalid Bearer credential");
        if(accountId!=null&&!caller.get().hasGrant("account.read:"+accountId))return problem(ProblemCode.FORBIDDEN,id,"caller lacks account-scoped metadata authority");
        if(bad||body!=null&&body.length>0||request.getQueryString()!=null&&!request.getQueryString().isEmpty()||accountId!=null&&!AccountDirectory.validId(accountId))
            return problem(ProblemCode.INVALID_REQUEST,id,"canonical Account ID required; query/body unsupported");
        try {
            if(accountId==null)return response(200,id,MediaType.APPLICATION_JSON,new Inventory(id,
                    accounts.list().stream().filter(a->caller.get().hasGrant("account.read:"+a.id())).map(AccountMetadata::from).toList()));
            var account=accounts.get(accountId);
            return account.isPresent()?response(200,id,MediaType.APPLICATION_JSON,new Detail(id,AccountMetadata.from(account.get()))):
                    problem(ProblemCode.NOT_FOUND,id,"account not found");
        }catch(java.sql.SQLException e){return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"account storage unavailable");}
    }
    private ResponseEntity<String> problem(ProblemCode code,String id,String detail)throws Exception {
        var r=response(code.status(),id,MediaType.APPLICATION_PROBLEM_JSON,ProblemDetails.of(code,id,detail,
                code==ProblemCode.INVALID_REQUEST?List.of(new ProblemDetails.InvalidParam("request",detail)):null));
        return code==ProblemCode.UNAUTHENTICATED?ResponseEntity.status(code.status()).headers(r.getHeaders()).header("WWW-Authenticate","Bearer").body(r.getBody()):r;
    }
    private ResponseEntity<String> response(int status,String id,MediaType type,Object value)throws Exception {
        return ResponseEntity.status(status).header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(type).body(mapper.writeValueAsString(value));
    }
}
