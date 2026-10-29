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
            @RequestParam(defaultValue="all") String selection, @RequestParam(required=false) String sourceAtOrAfter,
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
        if (!Set.of("all","latest-source").contains(selection) || artifactId!=null&&!selection.equals("all") || sourceAtOrAfter!=null&&!selection.equals("latest-source")) invalid.add(new ProblemDetails.InvalidParam("selection","all or latest-source; sourceAtOrAfter requires latest-source; artifactId requires all"));
        if(sourceAtOrAfter!=null)try{java.time.Instant.parse(sourceAtOrAfter);}catch(java.time.DateTimeException e){invalid.add(new ProblemDetails.InvalidParam("sourceAtOrAfter","unambiguous ISO instant required"));}
        if (body != null && body.length > 0) invalid.add(new ProblemDetails.InvalidParam("body", "GET body unsupported"));
        if (accountId == null) invalid.add(new ProblemDetails.InvalidParam("accountId", "required"));
        for (String name : Collections.list(request.getParameterNames()))
            if (!Set.of("accountId", "artifactId", "selection", "sourceAtOrAfter", "format", "expectedSha256").contains(name) || request.getParameterValues(name).length != 1)
                invalid.add(new ProblemDetails.InvalidParam(name, "unknown or repeated query parameter"));
        String format=request.getParameter("format"),expected=request.getParameter("expectedSha256");
        if(format!=null&&!format.equals("csv")||expected!=null&&(format==null||!expected.matches("[a-f0-9]{64}"))||format!=null&&expected==null)invalid.add(new ProblemDetails.InvalidParam("format","csv requires expectedSha256 from the governed report"));
        if (!invalid.isEmpty()) return problem(ProblemCode.INVALID_REQUEST, id, "invalid read request", invalid);
        try {
            var account=accounts.get(accountId);
            if(account.isEmpty())return problem(ProblemCode.NOT_FOUND,id,"Account not found",null);
            if(!Set.of("FIDELITY","TASTYTRADE").contains(account.get().brokerAssociation().broker()))
                return problem(ProblemCode.INVALID_REQUEST,id,"unsupported balance dialect",List.of(new ProblemDetails.InvalidParam("accountId","supported brokerage required")));
            var result=mapper.valueToTree(service.read(accountId,artifactId,selection,sourceAtOrAfter,id,caller.get()));
            var export=FinancialReportCsv.balances(result,account.get().alias());
            if(format!=null){if(export.isEmpty()||!export.get().sha256().equals(expected))return problem(ProblemCode.INVALID_REQUEST,id,"report changed or is not exportable; refresh the governed report",null);var file=export.get();return ResponseEntity.ok().header("X-Request-Id",id).header("Cache-Control","private, no-store").header("Content-Disposition","attachment; filename=\""+file.filename()+"\"").header("X-Content-SHA256",file.sha256()).contentType(MediaType.parseMediaType("text/csv;charset=UTF-8")).body(file.content());}
            if(export.isPresent()){String href="/v2/account-balance-observations?accountId="+accountId+"&artifactId="+result.at("/observations/0/source/artifactId").asText();((com.fasterxml.jackson.databind.node.ObjectNode)result).set("csv",FinancialReportCsv.metadata(export.get(),href,mapper));}
            return response(200,id,MediaType.APPLICATION_JSON,result);
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
