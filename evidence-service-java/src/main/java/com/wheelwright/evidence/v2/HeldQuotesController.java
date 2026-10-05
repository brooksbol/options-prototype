package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/** GET only. Deliberately has no provider, worker, acquisition or Decision dependency. */
@RestController
public class HeldQuotesController {
    private static final Logger LOG = LoggerFactory.getLogger(HeldQuotesController.class);
    private final SqliteEvidenceStore store;
    private final BearerAuthenticator authenticator;
    private final ObjectMapper mapper;

    public HeldQuotesController(SqliteEvidenceStore store, BearerAuthenticator authenticator,
                                ObjectMapper mapper) {
        this.store = store;
        this.authenticator = authenticator;
        this.mapper = mapper;
    }

    public record HeldQuotesReadResponse(String requestId, List<HeldQuoteDiscoveryItem> items) {}

    @GetMapping("/v2/quotes")
    public ResponseEntity<String> list(@RequestBody(required = false) byte[] body,
                                       HttpServletRequest request) {
        List<String> ids = Collections.list(request.getHeaders("X-Request-Id"));
        String supplied = ids.size() == 1 ? ids.getFirst().trim() : "";
        boolean invalidId = ids.size() > 1 ||
                (!supplied.isEmpty() && !HeldQuoteDiscoveryItem.validUuid(supplied));
        String id = !invalidId && !supplied.isEmpty() ? supplied : UUID.randomUUID().toString();
        LOG.debug("Held quote read request {}", id);
        if (!authenticator.configured())
            return problem(ProblemCode.CAPABILITY_UNAVAILABLE, id, "authentication is not configured", null);
        var principal = authenticator.authenticate(request.getHeader("Authorization"));
        if (principal.isEmpty())
            return problem(ProblemCode.UNAUTHENTICATED, id, "missing or invalid Bearer credential", null);
        if (!principal.get().hasGrant(BearerAuthenticator.GRANT_READ))
            return problem(ProblemCode.FORBIDDEN, id, "caller lacks quote.read", null);

        List<ProblemDetails.InvalidParam> invalid = new ArrayList<>();
        if (invalidId) invalid.add(new ProblemDetails.InvalidParam("X-Request-Id", "must be a single UUID"));
        // Decode query names ourselves; servlet parameter APIs can also parse form bodies.
        String query = request.getQueryString();
        if (query != null && !query.isEmpty()) {
            var names = new java.util.LinkedHashSet<String>();
            for (String parameter : query.split("&", -1)) {
                String name = parameter.split("=", 2)[0];
                try { name = java.net.URLDecoder.decode(name, java.nio.charset.StandardCharsets.UTF_8); }
                catch (IllegalArgumentException e) { name = "<invalid-encoding>"; }
                names.add(name);
            }
            for (String name : names)
                invalid.add(new ProblemDetails.InvalidParam("query." + name, "query parameters are unsupported"));
        }
        if (body != null && body.length > 0)
            invalid.add(new ProblemDetails.InvalidParam("body", "GET body is unsupported"));
        if (!invalid.isEmpty()) return problem(ProblemCode.INVALID_REQUEST, id, "invalid read request", invalid);

        try {
            var items = new ArrayList<HeldQuoteDiscoveryItem>();
            for (var row : store.listHeldDirectQuotes()) items.add(HeldQuoteDiscoveryItem.from(row));
            // Pre-serialize the entire validated inventory before Spring commits HTTP success.
            String json = mapper.writeValueAsString(new HeldQuotesReadResponse(id, List.copyOf(items)));
            return response(200, id, MediaType.APPLICATION_JSON, json);
        } catch (SqliteEvidenceStore.HeldReadUnavailableException e) {
            LOG.warn("Held quote read unavailable request {}", id);
            return problem(ProblemCode.CAPABILITY_UNAVAILABLE, id, "held storage unavailable", null);
        } catch (Exception e) {
            // Do not log SQL, raw data or exception messages; request correlation is sufficient.
            LOG.warn("Held quote read failed request {}", id);
            return problem(ProblemCode.INTERNAL_ERROR, id, "held quote read failed", null);
        }
    }

    private ResponseEntity<String> problem(ProblemCode code, String id, String detail,
                                            List<ProblemDetails.InvalidParam> invalid) {
        try {
            String json = mapper.writeValueAsString(ProblemDetails.of(code, id, detail, invalid));
            var response = response(code.status(), id, MediaType.APPLICATION_PROBLEM_JSON, json);
            if (code == ProblemCode.UNAUTHENTICATED)
                return ResponseEntity.status(code.status()).headers(response.getHeaders())
                        .header("WWW-Authenticate", "Bearer").body(json);
            return response;
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("cannot serialize problem", e);
        }
    }

    private ResponseEntity<String> response(int status, String id, MediaType type, String json) {
        return ResponseEntity.status(status).header("X-Request-Id", id)
                .header("Cache-Control", "private, no-store").contentType(type).body(json);
    }
}
