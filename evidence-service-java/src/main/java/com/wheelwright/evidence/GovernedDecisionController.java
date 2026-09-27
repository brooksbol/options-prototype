package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.SqliteEvidenceStore.GovernedDecisionRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Governed Decision endpoint (ADR-019 durable Lifecycle Decision Record).
 *
 * The browser is the authoritative Decision evaluator (DECIDE remains browser-side per
 * ADR-019); it emits an immutable Decision here for durable, account-partitioned,
 * idempotent storage. The Appliance owns the durable history and serves it back for
 * historical inspection and executable replay.
 *
 *   POST /api/governed-decision                    — append immutable Decision (idempotent).
 *   GET  /api/governed-decision/{decisionId}        — retrieve one Decision (replay input).
 *   GET  /api/governed-decision?account=..&subject=.. — subject Decision history.
 *   GET  /api/governed-decision/counts              — observability.
 *
 * The backend assigns recorded_at; it never mutates a historical row (INSERT OR IGNORE on
 * the browser-supplied deterministic decision_id).
 */
@RestController
public class GovernedDecisionController {

    private static final Logger log = LoggerFactory.getLogger(GovernedDecisionController.class);

    private final SqliteEvidenceStore store;

    public GovernedDecisionController(SqliteEvidenceStore store) {
        this.store = store;
    }

    @PostMapping("/api/governed-decision")
    public ResponseEntity<Map<String, Object>> append(@RequestBody DecisionDto body) throws SQLException {
        if (body == null || isBlank(body.decisionId) || isBlank(body.brokerageAccountId)
                || isBlank(body.subjectId)
                || isBlank(body.recommendation) || isBlank(body.inputBundleJson)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "decisionId, brokerageAccountId, subjectId, "
                    + "recommendation, and inputBundleJson are required"));
        }
        // ADR-021 §10: contextVersionId is OPTIONAL. A no-context UNRESOLVED Decision records
        // the explicit absence of governed context (never a fabricated one). But WHEN a context
        // is pinned, it must already exist durably — fail closed rather than persist a dangling
        // reference to a context that was never authored.
        if (!isBlank(body.contextVersionId)
                && store.getGovernedContextVersion(body.contextVersionId) == null) {
            return ResponseEntity.unprocessableEntity().body(Map.of(
                "error", "pinned contextVersionId does not exist; author governance first",
                "contextVersionId", body.contextVersionId));
        }

        String recordedAt = Instant.now().toString();
        GovernedDecisionRecord rec = new GovernedDecisionRecord(
            body.decisionId, body.brokerageAccountId, body.governedScopeId, body.subjectType,
            body.subjectId, body.symbol, isBlank(body.contextVersionId) ? null : body.contextVersionId,
            body.ruleId, body.evaluatorId, body.evaluatorVersion, body.recommendation,
            isBlank(body.programApplicability) ? "applicable" : body.programApplicability,
            body.reasoningJson == null ? "[]" : body.reasoningJson,
            body.unresolvedCausesJson == null ? "[]" : body.unresolvedCausesJson,
            body.predicateResultsJson == null ? "[]" : body.predicateResultsJson,
            body.inputBundleJson, body.bundleHash, body.decisionTime, recordedAt);

        store.appendGovernedDecision(rec);

        return ResponseEntity.ok(Map.of(
            "status", "recorded",
            "decisionId", body.decisionId,
            "recordedAt", recordedAt
        ));
    }

    @GetMapping("/api/governed-decision/{decisionId}")
    public ResponseEntity<?> get(@PathVariable String decisionId) throws SQLException {
        GovernedDecisionRecord rec = store.getGovernedDecision(decisionId);
        if (rec == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(rec);
    }

    @GetMapping("/api/governed-decision")
    public ResponseEntity<?> forSubject(
            @RequestParam String account,
            @RequestParam String subject) throws SQLException {
        List<GovernedDecisionRecord> rows = store.getGovernedDecisionsForSubject(account, subject);
        return ResponseEntity.ok(Map.of("decisions", rows));
    }

    @GetMapping("/api/governed-decision/counts")
    public ResponseEntity<Map<String, Integer>> counts() throws SQLException {
        return ResponseEntity.ok(store.getGovernedDecisionCounts());
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }

    /** Immutable Decision the browser emits. recorded_at is backend-assigned. */
    public static class DecisionDto {
        public String decisionId;
        public String brokerageAccountId;
        public String governedScopeId;
        public String subjectType;
        public String subjectId;
        public String symbol;
        public String contextVersionId;
        public String ruleId;
        public String evaluatorId;
        public String evaluatorVersion;
        public String recommendation;
        public String programApplicability;
        public String reasoningJson;
        public String unresolvedCausesJson;
        public String predicateResultsJson;
        public String inputBundleJson;
        public String bundleHash;
        public String decisionTime;
    }
}
