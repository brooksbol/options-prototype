package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * {@code POST /v2/quotes} — synchronize canonical direct-quote evidence for 1–30 named
 * underlying subjects (ratified contract / OAS).
 *
 * <p>Request-wide handling order (contract §21, §22): media type (415) → body parse (400) →
 * authentication (401) → authorization grant (403) → X-Request-Id validity (422) → request
 * validation (422) → capability availability (503) → per-subject acquisition (200). No
 * provider work occurs on any 4xx/5xx request-wide failure.
 *
 * <p>Per the existing project convention there is no {@code @ControllerAdvice}; this
 * controller handles its own errors and emits RFC 9457 {@code application/problem+json}.
 * Every response (success or problem) carries the {@code X-Request-Id} correlation header.
 */
@RestController
public class V2QuotesController {

    /** OAS RequestedSubject.symbol pattern. */
    private static final Pattern SYMBOL_PATTERN = Pattern.compile("^[A-Za-z^][A-Za-z0-9.^/_-]*$");
    private static final int MAX_SUBJECTS = 30;
    private static final int MAX_SYMBOL_LENGTH = 32;
    private static final String REQUEST_ID_HEADER = "X-Request-Id";

    private final DirectQuoteService service;
    private final BearerAuthenticator authenticator;
    private final ObjectMapper mapper;
    private final Clock clock;

    @org.springframework.beans.factory.annotation.Autowired
    public V2QuotesController(DirectQuoteService service, BearerAuthenticator authenticator) {
        this(service, authenticator, new ObjectMapper(), Clock.systemUTC());
    }

    V2QuotesController(DirectQuoteService service, BearerAuthenticator authenticator,
                       ObjectMapper mapper, Clock clock) {
        this.service = service;
        this.authenticator = authenticator;
        this.mapper = mapper;
        this.clock = clock;
    }

    @PostMapping(path = "/v2/quotes")
    public ResponseEntity<?> acquireQuotes(
            @RequestBody(required = false) byte[] rawBody,
            HttpServletRequest http) {

        // Correlation id resolution. An INVALID supplied id is request-wide 422; a valid id is
        // echoed; an absent id is generated. We resolve this early so every error carries a
        // valid X-Request-Id, but an invalid supplied id generates one for the error response
        // and reports INVALID_REQUEST (contract §20, §21).
        String supplied = http.getHeader(REQUEST_ID_HEADER);
        String requestId;
        boolean suppliedInvalid = false;
        if (supplied == null || supplied.isBlank()) {
            requestId = UUID.randomUUID().toString();
        } else if (isValidUuid(supplied.trim())) {
            requestId = supplied.trim();
        } else {
            requestId = UUID.randomUUID().toString();
            suppliedInvalid = true;
        }

        // 415 — media type must be application/json.
        if (!isJsonContentType(http.getContentType())) {
            return problem(ProblemCode.UNSUPPORTED_MEDIA_TYPE, requestId,
                "Content-Type must be application/json");
        }

        // Invalid supplied correlation id → 422 (no provider work).
        if (suppliedInvalid) {
            return problem(ProblemCode.INVALID_REQUEST, requestId,
                "X-Request-Id must be a valid UUID",
                List.of(new ProblemDetails.InvalidParam(REQUEST_ID_HEADER,
                    "not a valid UUID")));
        }

        // 400 — body must be present and parse as the request schema. Unknown properties are
        // rejected (AcquireQuotesRequest uses ignoreUnknown=false), surfaced as malformed.
        if (rawBody == null || rawBody.length == 0) {
            return problem(ProblemCode.MALFORMED_REQUEST, requestId, "request body is required");
        }
        AcquireQuotesRequest request;
        try {
            request = mapper.readValue(rawBody, AcquireQuotesRequest.class);
        } catch (Exception e) {
            return problem(ProblemCode.MALFORMED_REQUEST, requestId,
                "request body is not valid JSON for this operation");
        }
        if (request == null) {
            return problem(ProblemCode.MALFORMED_REQUEST, requestId, "request body is required");
        }

        // Authentication (401) BEFORE authorization and BEFORE any provider work.
        if (!authenticator.configured()) {
            // Fail closed: no approved authenticator configuration → capability cannot serve
            // credential-bearing traffic (contract §22). Never authenticate anonymously.
            return problem(ProblemCode.CAPABILITY_UNAVAILABLE, requestId,
                "authentication is not configured");
        }
        Optional<BearerAuthenticator.Principal> principal =
            authenticator.authenticate(http.getHeader("Authorization"));
        if (principal.isEmpty()) {
            return problem(ProblemCode.UNAUTHENTICATED, requestId,
                "missing or invalid Bearer credential");
        }

        // Determine effective mode now (needed for authorization) — but validate request shape
        // first so a malformed mode is a 422, not an authorization decision on a bad value.
        List<ProblemDetails.InvalidParam> violations = new ArrayList<>();
        AcquireQuotesRequest.Mode mode = request.effectiveMode();

        // Authorization (403): quote.acquire always; quote.force additionally for FORCE.
        if (!principal.get().hasGrant(BearerAuthenticator.GRANT_ACQUIRE)) {
            return problem(ProblemCode.FORBIDDEN, requestId,
                "caller lacks the " + BearerAuthenticator.GRANT_ACQUIRE + " grant");
        }
        if (mode == AcquireQuotesRequest.Mode.FORCE
                && !principal.get().hasGrant(BearerAuthenticator.GRANT_FORCE)) {
            return problem(ProblemCode.FORBIDDEN, requestId,
                "FORCE requires the " + BearerAuthenticator.GRANT_FORCE + " grant");
        }

        // 422 — semantic request validation: subjects cardinality, symbol shape, canonical
        // duplicate detection. Preserve requested order in the canonicalized list.
        List<AcquireQuotesRequest.RequestedSubject> subjects = request.subjects();
        if (subjects == null || subjects.isEmpty()) {
            violations.add(new ProblemDetails.InvalidParam("/subjects", "at least one subject is required"));
            return problem(ProblemCode.INVALID_REQUEST, requestId, "invalid subjects", violations);
        }
        if (subjects.size() > MAX_SUBJECTS) {
            violations.add(new ProblemDetails.InvalidParam("/subjects",
                "at most " + MAX_SUBJECTS + " subjects are permitted"));
            return problem(ProblemCode.INVALID_REQUEST, requestId, "invalid subjects", violations);
        }

        List<AcquireQuotesRequest.RequestedSubject> canonical = new ArrayList<>(subjects.size());
        Set<String> seen = new LinkedHashSet<>();
        for (int i = 0; i < subjects.size(); i++) {
            AcquireQuotesRequest.RequestedSubject s = subjects.get(i);
            String symbol = s == null ? null : s.symbol();
            if (symbol == null || symbol.isEmpty()) {
                violations.add(new ProblemDetails.InvalidParam("/subjects/" + i + "/symbol",
                    "symbol is required"));
                continue;
            }
            if (symbol.length() > MAX_SYMBOL_LENGTH || !SYMBOL_PATTERN.matcher(symbol).matches()) {
                violations.add(new ProblemDetails.InvalidParam("/subjects/" + i + "/symbol",
                    "symbol is malformed"));
                continue;
            }
            String upper = symbol.toUpperCase(java.util.Locale.ROOT);
            if (!seen.add(upper)) {
                violations.add(new ProblemDetails.InvalidParam("/subjects/" + i + "/symbol",
                    "duplicate canonical subject: " + upper));
                continue;
            }
            // Preserve requested subject identity (canonical uppercase) in request order.
            canonical.add(new AcquireQuotesRequest.RequestedSubject(upper));
        }
        if (!violations.isEmpty()) {
            // Any malformed symbol or canonical duplicate invalidates the entire request (no
            // provider work, no partial result).
            return problem(ProblemCode.INVALID_REQUEST, requestId, "invalid subjects", violations);
        }

        // Operation start — synchronous. 200 is returned only after every subject has a
        // terminal result (contract §18).
        String startedAt = Instant.now(clock).toString();
        List<SubjectAcquisitionResult> results;
        try {
            results = service.acquire(canonical, mode);
        } catch (DirectQuoteService.CapabilityUnavailableException e) {
            return problem(ProblemCode.CAPABILITY_UNAVAILABLE, requestId, e.getMessage());
        } catch (RuntimeException e) {
            // Failure before any trustworthy per-subject reconciliation is request-wide 500 and
            // must not claim subject fulfillment (contract §21).
            return problem(ProblemCode.INTERNAL_ERROR, requestId, "internal error");
        }
        String completedAt = Instant.now(clock).toString();

        AcquireQuotesResponse body = new AcquireQuotesResponse(
            requestId, mode, startedAt, completedAt, results);
        return ResponseEntity.ok()
            .header(REQUEST_ID_HEADER, requestId)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body);
    }

    private ResponseEntity<ProblemDetails> problem(ProblemCode code, String requestId, String detail) {
        return problem(code, requestId, detail, null);
    }

    private ResponseEntity<ProblemDetails> problem(ProblemCode code, String requestId, String detail,
                                                   List<ProblemDetails.InvalidParam> invalidParams) {
        ProblemDetails pd = ProblemDetails.of(code, requestId, detail, invalidParams);
        return ResponseEntity.status(code.status())
            .header(REQUEST_ID_HEADER, requestId)
            .contentType(MediaType.APPLICATION_PROBLEM_JSON)
            .body(pd);
    }

    private static boolean isJsonContentType(String contentType) {
        if (contentType == null) return false;
        try {
            MediaType mt = MediaType.parseMediaType(contentType);
            return mt.isCompatibleWith(MediaType.APPLICATION_JSON);
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean isValidUuid(String value) {
        try {
            // UUID.fromString is lenient about some malformed inputs; require canonical 36-char form.
            if (value.length() != 36) return false;
            UUID parsed = UUID.fromString(value);
            return parsed.toString().equalsIgnoreCase(value);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
