package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/** Pure held read. Exact account grant checked before storage access. */
@RestController
public class AccountBalancesController {
    private final AccountDirectory accounts;
    private final AccountBalanceObservations service;
    private final BearerAuthenticator auth;
    private final ObjectMapper mapper;
    public AccountBalancesController(AccountDirectory accounts, AccountBalanceObservations service, BearerAuthenticator auth, ObjectMapper mapper) {
        this.accounts = accounts; this.service = service; this.auth = auth; this.mapper = mapper;
    }
    @GetMapping("/v2/account-balance-observations")
    public ResponseEntity<String> read(@RequestParam(required=false) String accountId,
            @RequestParam(required=false) String artifactId,
            @RequestBody(required = false) byte[] body, HttpServletRequest request) throws Exception {
        var ids = Collections.list(request.getHeaders("X-Request-Id"));
        String supplied = ids.size() == 1 ? ids.getFirst().trim() : "";
        boolean badId = ids.size() > 1 || !supplied.isEmpty() && !HeldQuoteDiscoveryItem.validUuid(supplied);
        String id = !badId && !supplied.isEmpty() ? supplied : UUID.randomUUID().toString();
        if (!auth.configured()) return problem(ProblemCode.CAPABILITY_UNAVAILABLE, id, "authentication is not configured", null);
        var caller = auth.authenticate(request.getHeader("Authorization"));
        if (caller.isEmpty()) return problem(ProblemCode.UNAUTHENTICATED, id, "missing or invalid Bearer credential", null);
        if (accountId != null && !accountId.isBlank() && request.getParameterValues("accountId").length == 1 && !caller.get().hasGrant("account.artifacts.read:" + accountId))
            return problem(ProblemCode.FORBIDDEN, id, "caller lacks account-scoped artifact read authority", null);
        var invalid = new ArrayList<ProblemDetails.InvalidParam>();
        if (badId) invalid.add(new ProblemDetails.InvalidParam("X-Request-Id", "must be a single UUID"));
        if (accountId != null && !AccountDirectory.validId(accountId)) invalid.add(new ProblemDetails.InvalidParam("accountId", "canonical Account ID required"));
        if (artifactId != null && !HeldQuoteDiscoveryItem.validUuid(artifactId)) invalid.add(new ProblemDetails.InvalidParam("artifactId", "UUID required"));
        if (body != null && body.length > 0) invalid.add(new ProblemDetails.InvalidParam("body", "GET body unsupported"));
        if (accountId == null) invalid.add(new ProblemDetails.InvalidParam("accountId", "required"));
        for (String name : Collections.list(request.getParameterNames()))
            if (!Set.of("accountId", "artifactId").contains(name) || request.getParameterValues(name).length != 1)
                invalid.add(new ProblemDetails.InvalidParam(name, "unknown or repeated query parameter"));
        if (!invalid.isEmpty()) return problem(ProblemCode.INVALID_REQUEST, id, "invalid read request", invalid);
        try {
            var account=accounts.get(accountId);
            if(account.isEmpty())return problem(ProblemCode.NOT_FOUND,id,"Account not found",null);
            if(!Set.of("FIDELITY","TASTYTRADE").contains(account.get().brokerAssociation().broker()))
                return problem(ProblemCode.INVALID_REQUEST,id,"unsupported balance dialect",List.of(new ProblemDetails.InvalidParam("accountId","supported brokerage required")));
            return response(200,id,MediaType.APPLICATION_JSON,service.read(accountId,artifactId,id,caller.get()));
        } catch (SecurityException e) {
            return problem(ProblemCode.FORBIDDEN,id,"source scope not authorized",null);
        } catch (java.sql.SQLException e) {
            return problem(ProblemCode.CAPABILITY_UNAVAILABLE, id, "Balance evidence storage unavailable", null);
        } catch (Exception e) {
            return problem(ProblemCode.INTERNAL_ERROR, id, "Balance evidence read failed", null);
        }
    }
    private ResponseEntity<String> problem(ProblemCode code, String id, String detail,
            List<ProblemDetails.InvalidParam> invalid) throws Exception {
        var response = response(code.status(), id, MediaType.APPLICATION_PROBLEM_JSON,
                ProblemDetails.of(code, id, detail, invalid));
        return code == ProblemCode.UNAUTHENTICATED ? ResponseEntity.status(code.status()).headers(response.getHeaders())
                .header("WWW-Authenticate", "Bearer").body(response.getBody()) : response;
    }
    private ResponseEntity<String> response(int status, String id, MediaType type, Object value) throws Exception {
        return ResponseEntity.status(status).header("X-Request-Id", id).header("Cache-Control", "private, no-store")
                .contentType(type).body(mapper.writeValueAsString(value));
    }
}
