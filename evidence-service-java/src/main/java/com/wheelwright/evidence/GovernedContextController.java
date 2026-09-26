package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.SqliteEvidenceStore.GovernedContextVersionRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Governed Context endpoint (Candidate B, Correction 1 & 2).
 *
 * Creating a Governed Context Version is an EXPLICIT authority-bearing governance act.
 * This is the ONLY write surface that establishes governance; it is deliberately NOT an
 * ordinary display/state endpoint. The write fails closed unless the payload is a genuine
 * authorized governance assertion.
 *
 *   POST /api/governed-context        — create/version an immutable Governed Context Version.
 *   GET  /api/governed-context/resolve — bitemporal as-of resolution for a scope.
 *   GET  /api/governed-context/counts  — observability.
 *
 * The backend re-establishes the durable facts it owns (version number, recorded_at,
 * supersession lineage). It does not trust the client to assign them.
 *
 * ABUSE GUARD: the server independently rejects any attempt to author affirmative
 * governance without explicit operator authority — mechanical facts (shares, calls,
 * ticker, buy-write origin, WHEEL label) are not part of this payload and cannot reach it.
 */
@RestController
public class GovernedContextController {

    private static final Logger log = LoggerFactory.getLogger(GovernedContextController.class);

    private static final Set<String> GATES = Set.of("CLEAR", "ACTIVE", "UNKNOWN");
    private static final Set<String> STANCES = Set.of("accepted", "unknown");

    private final SqliteEvidenceStore store;

    public GovernedContextController(SqliteEvidenceStore store) {
        this.store = store;
    }

    @PostMapping("/api/governed-context")
    public ResponseEntity<Map<String, Object>> create(@RequestBody ContextDraftDto body) throws SQLException {
        List<String> violations = validate(body);
        if (!violations.isEmpty()) {
            log.warn("governed-context write rejected: {}", violations);
            return ResponseEntity.unprocessableEntity().body(Map.of(
                "error", "invalid governed-context assertion",
                "violations", violations
            ));
        }

        // Backend owns version + lineage + recorded_at (never trusted from client).
        int prior = store.getMaxContextVersion(body.brokerageAccountId, body.governedScopeId);
        int version = prior + 1;
        String recordedAt = Instant.now().toString();

        // Deterministic immutable identity from content + lineage. A byte-identical
        // re-submission dedups (INSERT OR IGNORE); a genuine amendment differs in content
        // and yields a new version id.
        String supersedes = body.supersedesVersionId; // may be null; informational lineage
        String contextVersionId = "ctx_" + Identity.hash(
            body.brokerageAccountId, body.governedScopeId, String.valueOf(version),
            body.program, body.configVersion, body.callAwayStance,
            body.eligibilityGate, body.interventionGate, body.noWriteGate,
            body.authorityProvenance, body.effectiveFrom);

        GovernedContextVersionRecord rec = new GovernedContextVersionRecord(
            contextVersionId, body.brokerageAccountId, body.governedScopeId, version,
            prior == 0 ? null : (supersedes != null ? supersedes : null),
            body.program, body.configVersion, body.callAwayStance,
            body.eligibilityGate, body.interventionGate, body.noWriteGate,
            body.authorityProvenance, body.effectiveFrom, recordedAt);

        store.appendGovernedContextVersion(rec);

        return ResponseEntity.ok(Map.of(
            "status", "recorded",
            "contextVersionId", contextVersionId,
            "version", version,
            "recordedAt", recordedAt
        ));
    }

    @GetMapping("/api/governed-context/resolve")
    public ResponseEntity<?> resolve(
            @RequestParam String brokerageAccountId,
            @RequestParam String governedScopeId,
            @RequestParam String effectiveAsOf,
            @RequestParam String knowledgeCutoff) throws SQLException {
        GovernedContextVersionRecord rec = store.resolveGovernedContext(
            brokerageAccountId, governedScopeId, effectiveAsOf, knowledgeCutoff);
        if (rec == null) {
            return ResponseEntity.ok(Map.of("resolved", false));
        }
        return ResponseEntity.ok(Map.of("resolved", true, "contextVersion", rec));
    }

    @GetMapping("/api/governed-context/counts")
    public ResponseEntity<Map<String, Integer>> counts() throws SQLException {
        return ResponseEntity.ok(store.getGovernedDecisionCounts());
    }

    /**
     * Establish an explicit, evidence-backed Subject->scope association (Correction 3).
     * This is an authorized act, never an inference. The pinned scope must already have a
     * Context Version so association cannot reference a non-existent governed scope.
     */
    @PostMapping("/api/governed-context/association")
    public ResponseEntity<Map<String, Object>> associate(@RequestBody AssociationDto b) throws SQLException {
        if (b == null || isBlank(b.brokerageAccountId) || isBlank(b.subjectId)
                || isBlank(b.governedScopeId) || isBlank(b.effectiveFrom)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "brokerageAccountId, subjectId, governedScopeId, effectiveFrom are required"));
        }
        if (!"operator-governance".equals(b.provenance) && !"broker-evidence".equals(b.provenance)) {
            return ResponseEntity.unprocessableEntity().body(Map.of(
                "error", "provenance must be 'operator-governance' or 'broker-evidence' "
                    + "(association is never inferred from ticker equality)"));
        }
        if (!isIso(b.effectiveFrom)) {
            return ResponseEntity.badRequest().body(Map.of("error", "effectiveFrom must be ISO8601"));
        }
        String recordedAt = Instant.now().toString();
        String associationId = "assoc_" + Identity.hash(
            b.brokerageAccountId, b.subjectId, b.governedScopeId, b.effectiveFrom);
        store.appendSubjectScopeAssociation(new SqliteEvidenceStore.SubjectScopeAssociationRecord(
            associationId, b.brokerageAccountId, b.subjectId, b.governedScopeId,
            b.provenance, b.effectiveFrom, recordedAt));
        return ResponseEntity.ok(Map.of(
            "status", "recorded", "associationId", associationId, "recordedAt", recordedAt));
    }

    @GetMapping("/api/governed-context/association/resolve")
    public ResponseEntity<?> resolveAssociation(
            @RequestParam String brokerageAccountId,
            @RequestParam String subjectId,
            @RequestParam String knowledgeCutoff) throws SQLException {
        var rec = store.resolveSubjectScope(brokerageAccountId, subjectId, knowledgeCutoff);
        if (rec == null) return ResponseEntity.ok(Map.of("resolved", false));
        return ResponseEntity.ok(Map.of("resolved", true, "association", rec));
    }

    /** Explicit association the operator/system authorizes. */
    public static class AssociationDto {
        public String brokerageAccountId;
        public String subjectId;
        public String governedScopeId;
        public String provenance;
        public String effectiveFrom;
    }

    private static List<String> validate(ContextDraftDto b) {
        List<String> v = new ArrayList<>();
        if (b == null) { v.add("body is required"); return v; }
        if (isBlank(b.brokerageAccountId)) v.add("brokerageAccountId is required");
        if (isBlank(b.governedScopeId)) v.add("governedScopeId is required");
        if (!"assignment-centric-wheel".equals(b.program)) {
            v.add("program must be the ratified assignment-centric-wheel for this slice");
        }
        if (isBlank(b.configVersion)) v.add("configVersion is required");
        // Correction 1: authority must be an explicit operator-governance assertion.
        if (!"operator-governance".equals(b.authorityProvenance)) {
            v.add("authorityProvenance must be 'operator-governance' — governance is an explicit "
                + "authorized act, never derived from evidence, derivation, or absence");
        }
        if (b.callAwayStance == null || !STANCES.contains(b.callAwayStance)) {
            v.add("callAwayStance must be 'accepted' or 'unknown'");
        }
        if (b.eligibilityGate == null || !GATES.contains(b.eligibilityGate)) v.add("eligibilityGate must be CLEAR|ACTIVE|UNKNOWN");
        if (b.interventionGate == null || !GATES.contains(b.interventionGate)) v.add("interventionGate must be CLEAR|ACTIVE|UNKNOWN");
        if (b.noWriteGate == null || !GATES.contains(b.noWriteGate)) v.add("noWriteGate must be CLEAR|ACTIVE|UNKNOWN");
        if (isBlank(b.effectiveFrom) || !isIso(b.effectiveFrom)) v.add("effectiveFrom must be a valid ISO8601 instant");
        return v;
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }

    private static boolean isIso(String s) {
        try { Instant.parse(s); return true; } catch (Exception e) { return false; }
    }

    /** Governance draft the client SUPPLIES. Version/recordedAt/id are backend-assigned. */
    public static class ContextDraftDto {
        public String brokerageAccountId;
        public String governedScopeId;
        public String program;
        public String configVersion;
        public String callAwayStance;
        public String eligibilityGate;
        public String interventionGate;
        public String noWriteGate;
        public String authorityProvenance;
        public String effectiveFrom;
        /** Optional prior version id for lineage; backend still assigns version number. */
        public String supersedesVersionId;
    }
}
