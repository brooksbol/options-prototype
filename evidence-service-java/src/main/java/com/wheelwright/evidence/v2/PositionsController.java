package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;

/** Pure held read. Exact account grant checked before storage access. */
@RestController
public class PositionsController {
    public record CollectionRead(String requestId,List<PositionSnapshot.Read> snapshots) {}
    public record ObservationCollection(String requestId,List<PositionSnapshot.ObservationSummary> observations) {}
    private final AccountDirectory accounts;
    private final PositionReadService service;
    private final BearerAuthenticator auth;
    private final ObjectMapper mapper;
    public PositionsController(AccountDirectory accounts, PositionReadService service, BearerAuthenticator auth, ObjectMapper mapper) {
        this.accounts = accounts; this.service = service; this.auth = auth; this.mapper = mapper;
    }
    @GetMapping("/v2/positions")
    public ResponseEntity<String> read(@RequestParam(required=false) String accountId,
            @RequestParam(required=false) String view, @RequestParam(required=false) String snapshotId,
            @RequestBody(required = false) byte[] body, HttpServletRequest request) throws Exception {
        var ids = Collections.list(request.getHeaders("X-Request-Id"));
        String supplied = ids.size() == 1 ? ids.getFirst().trim() : "";
        boolean badId = ids.size() > 1 || !supplied.isEmpty() && !HeldQuoteDiscoveryItem.validUuid(supplied);
        String id = !badId && !supplied.isEmpty() ? supplied : UUID.randomUUID().toString();
        if (!auth.configured()) return problem(ProblemCode.CAPABILITY_UNAVAILABLE, id, "authentication is not configured", null);
        var caller = auth.authenticate(request.getHeader("Authorization"));
        if (caller.isEmpty()) return problem(ProblemCode.UNAUTHENTICATED, id, "missing or invalid Bearer credential", null);
        if (accountId != null && !accountId.isBlank() && request.getParameterValues("accountId").length == 1 && !caller.get().hasGrant("account.positions.read:" + accountId))
            return problem(ProblemCode.FORBIDDEN, id, "caller lacks account-scoped Position read authority", null);
        var invalid = new ArrayList<ProblemDetails.InvalidParam>();
        if (badId) invalid.add(new ProblemDetails.InvalidParam("X-Request-Id", "must be a single UUID"));
        if (accountId != null && !AccountDirectory.validId(accountId)) invalid.add(new ProblemDetails.InvalidParam("accountId", "canonical Account ID required"));
        if (body != null && body.length > 0) invalid.add(new ProblemDetails.InvalidParam("body", "GET body unsupported"));
        if (view != null && !view.equals("observations")) invalid.add(new ProblemDetails.InvalidParam("view", "only observations is supported"));
        if (snapshotId != null && (snapshotId.isBlank() || accountId == null || view != null))
            invalid.add(new ProblemDetails.InvalidParam("snapshotId", "nonblank exact snapshotId requires accountId and excludes view"));
        for (String name : Collections.list(request.getParameterNames()))
            if (!Set.of("accountId", "view", "snapshotId").contains(name) || request.getParameterValues(name).length != 1)
                invalid.add(new ProblemDetails.InvalidParam(name, "unknown or repeated query parameter"));
        if (!invalid.isEmpty()) return problem(ProblemCode.INVALID_REQUEST, id, "invalid read request", invalid);
        try {
            if (view != null) {
                var authorized = new HashSet<String>();
                if (accountId != null) {
                    if (accounts.get(accountId).isEmpty()) return problem(ProblemCode.NOT_FOUND, id, "Account not found", null);
                    authorized.add(accountId);
                } else for (var a : accounts.list()) if (caller.get().hasGrant("account.positions.read:" + a.id())) authorized.add(a.id());
                return response(200, id, MediaType.APPLICATION_JSON, new ObservationCollection(id, service.observations(authorized, id)));
            }
            var snapshots=new ArrayList<PositionSnapshot.Read>();
            if(accountId!=null) {
                var result=snapshotId == null ? service.read(accountId,id,Instant.now()) : service.read(accountId,snapshotId,id,Instant.now());
                if(result.isEmpty())return problem(ProblemCode.NOT_FOUND,id,"no admitted Position snapshot for this account",null);
                snapshots.add(result.get());
            } else {
                for(var a:accounts.list())if(caller.get().hasGrant("account.positions.read:"+a.id()))
                    service.read(a.id(),id,Instant.now()).ifPresent(snapshots::add);
            }
            return response(200,id,MediaType.APPLICATION_JSON,new CollectionRead(id,List.copyOf(snapshots)));
        } catch (java.sql.SQLException e) {
            return problem(ProblemCode.CAPABILITY_UNAVAILABLE, id, "Position storage unavailable", null);
        } catch (Exception e) {
            return problem(ProblemCode.INTERNAL_ERROR, id, "Position read failed", null);
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
