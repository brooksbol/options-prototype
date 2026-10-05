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

        // Body parse in two stages so JSON SYNTAX errors and SEMANTIC value errors map to the
        // ratified codes (contract §21): malformed JSON → 400 MALFORMED_REQUEST; syntactically
        // valid JSON carrying an unsupported semantic value (e.g. an unknown mode) → 422
        // INVALID_REQUEST.
        if (rawBody == null || rawBody.length == 0) {
            return problem(ProblemCode.MALFORMED_REQUEST, requestId, "request body is required");
        }
        // Stage 1 — structural parse. A failure here is genuinely malformed JSON (400).
        com.fasterxml.jackson.databind.JsonNode root;
        try {
            root = mapper.readTree(rawBody);
        } catch (Exception e) {
            return problem(ProblemCode.MALFORMED_REQUEST, requestId,
                "request body is not valid JSON");
        }
        if (root == null || root.isNull() || !root.isObject()) {
            return problem(ProblemCode.MALFORMED_REQUEST, requestId,
                "request body must be a JSON object");
        }
        // Stage 1b — WIRE-TYPE VALIDATION of supplied values, before any binding.
        //
        // Jackson's binder silently COERCES scalars (e.g. a boolean or number `symbol`/`mode`
        // into a string), so a wrong-typed field could otherwise be laundered into valid
        // acquisition intent. We therefore reject JSON whose supplied node types violate the
        // ratified request schema (subjects: array of objects; symbol: string; mode: string)
        // BEFORE binding. Per the ratified status mappings a wrong-typed subject/mode is an
        // INVALID REQUEST → 422 INVALID_REQUEST (NOT 400); only unparseable JSON / a non-object
        // body is 400 MALFORMED_REQUEST (handled above). Value violations on correctly-typed
        // input (symbol pattern/length, cardinality, duplicates, unsupported mode enum value,
        // explicit null mode) are likewise 422 and checked here or later.
        List<ProblemDetails.InvalidParam> wireTypeViolations = validateWireTypes(root);
        if (!wireTypeViolations.isEmpty()) {
            return problem(ProblemCode.INVALID_REQUEST, requestId, "invalid request",
                wireTypeViolations);
        }
        // Stage 1c — `mode` VALUE check (on a correctly-typed string, or explicit null):
        //   - explicit {"mode": null} is NOT omission and is invalid (omission defaults ORDINARY);
        //   - a present string whose value is not a supported enum member is invalid.
        // Both are 422 INVALID_REQUEST.
        com.fasterxml.jackson.databind.JsonNode modeNode = root.get("mode");
        if (modeNode != null && (modeNode.isNull() || !isSupportedMode(modeNode.asText()))) {
            return problem(ProblemCode.INVALID_REQUEST, requestId, "unsupported mode",
                List.of(new ProblemDetails.InvalidParam("/mode",
                    "mode must be one of ORDINARY or FORCE")));
        }
        // Stage 2 — bind to the request schema. Supplied types are already proven to match the
        // wire schema, so binding cannot coerce a wrong-typed field into intent. Unknown
        // properties remain rejected (ignoreUnknown=false) and surface as malformed (400); any
        // residual binding failure is a malformed-request condition.
        AcquireQuotesRequest request;
        try {
            request = mapper.treeToValue(root, AcquireQuotesRequest.class);
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
            results = service.acquire(canonical, mode, requestId);
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

    /**
     * Validate the JSON TYPES of supplied request fields against the ratified wire schema,
     * BEFORE binding, so Jackson's scalar→string coercion cannot launder a wrong-typed field
     * into valid acquisition intent (e.g. a boolean {@code symbol} that would coerce to a
     * pattern-passing string).
     *
     * <p>Returns the list of wire-type violations found (empty when every SUPPLIED node has a
     * schema-conformant JSON type). These are {@code 422 INVALID_REQUEST} violations per the
     * ratified status mappings — a wrong-typed subject/mode is an invalid request, not malformed
     * JSON. This method checks only supplied-node TYPES (subjects: array; each subject: object;
     * symbol: string; mode: string); presence/cardinality/pattern/duplicate/enum-value and the
     * explicit-null-mode case are handled elsewhere, also as {@code 422}.
     */
    private List<ProblemDetails.InvalidParam> validateWireTypes(
            com.fasterxml.jackson.databind.JsonNode root) {
        List<ProblemDetails.InvalidParam> violations = new ArrayList<>();
        // subjects: when supplied non-null, MUST be a JSON array (OAS: type array).
        com.fasterxml.jackson.databind.JsonNode subjectsNode = root.get("subjects");
        if (subjectsNode != null && !subjectsNode.isNull() && !subjectsNode.isArray()) {
            violations.add(new ProblemDetails.InvalidParam("/subjects",
                "subjects must be a JSON array"));
            return violations; // cannot inspect items of a non-array
        }
        if (subjectsNode != null && subjectsNode.isArray()) {
            for (int i = 0; i < subjectsNode.size(); i++) {
                com.fasterxml.jackson.databind.JsonNode item = subjectsNode.get(i);
                // Each subject MUST be a JSON object (OAS: RequestedSubject type object).
                if (item == null || !item.isObject()) {
                    violations.add(new ProblemDetails.InvalidParam("/subjects/" + i,
                        "each subject must be a JSON object"));
                    continue;
                }
                // symbol: when supplied non-null, MUST be a JSON string (OAS: type string). A
                // number, boolean, array, or object symbol is a wire-type violation and must
                // never be coerced to a string.
                com.fasterxml.jackson.databind.JsonNode symbolNode = item.get("symbol");
                if (symbolNode != null && !symbolNode.isNull() && !symbolNode.isTextual()) {
                    violations.add(new ProblemDetails.InvalidParam("/subjects/" + i + "/symbol",
                        "symbol must be a JSON string"));
                }
            }
        }
        // mode: when supplied non-null, MUST be a JSON string (OAS: type string enum). A
        // non-string mode (e.g. a number/boolean/array) is a wire-type violation.
        com.fasterxml.jackson.databind.JsonNode modeNode = root.get("mode");
        if (modeNode != null && !modeNode.isNull() && !modeNode.isTextual()) {
            violations.add(new ProblemDetails.InvalidParam("/mode", "mode must be a JSON string"));
        }
        return violations;
    }

    /** Whether a supplied mode string names a supported acquisition mode (case-sensitive, per OAS enum). */
    private static boolean isSupportedMode(String value) {
        for (AcquireQuotesRequest.Mode m : AcquireQuotesRequest.Mode.values()) {
            if (m.name().equals(value)) return true;
        }
        return false;
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
