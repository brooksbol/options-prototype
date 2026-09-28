package com.wheelwright.evidence;

import com.wheelwright.evidence.continuity.ContinuityAssessment;
import com.wheelwright.evidence.continuity.ContinuityEngine;
import com.wheelwright.evidence.continuity.ContinuityInputs;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.SqliteEvidenceStore.ContinuityAssessmentRecord;
import com.wheelwright.evidence.production.FidelityActivityRow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Bounded option-obligation continuity endpoint (ADR-022 / Doc 70).
 *
 * The backend OWNS the evidence-to-cohort continuity assessment. The browser Decision
 * evaluator CONSUMES the persisted verdict; it must not reconstruct continuity from a series
 * key, local CSV, or an associationEstablished flag (Doc 70 §1).
 *
 *   POST /api/continuity/assess   — compute (fail-closed) the whole-quantity continuity
 *                                    assessment from posted History rows + opening anchor +
 *                                    accepted completeness premise + quiet-day Positions
 *                                    observation, and durably persist the result.
 *   GET  /api/continuity/resolve  — bitemporal as-of resolution of the latest assessment.
 *
 * This endpoint never fabricates completeness, ordering, or an endpoint holdings timestamp.
 * It returns an explicit verdict + blockers; a non-affirmative verdict is a first-class,
 * durable outcome (the Decision fails closed rather than inventing membership).
 */
@RestController
public class ContinuityController {

    private static final Logger log = LoggerFactory.getLogger(ContinuityController.class);

    private final SqliteEvidenceStore store;
    private final ContinuityEngine engine = new ContinuityEngine();

    public ContinuityController(SqliteEvidenceStore store) {
        this.store = store;
    }

    @PostMapping("/api/continuity/assess")
    public ResponseEntity<Map<String, Object>> assess(@RequestBody AssessDto b) throws SQLException {
        // Structural intake validation (required authority-bearing fields). Semantic
        // fail-closed decisions (missing completeness, non-quiet day, unsupported rows) are the
        // engine's job and produce a durable non-affirmative verdict, not a 4xx.
        List<String> missing = new ArrayList<>();
        if (b == null) { missing.add("body"); }
        else {
            if (isBlank(b.brokerageAccountId)) missing.add("brokerageAccountId");
            if (isBlank(b.underlying)) missing.add("underlying");
            if (!"CALL".equals(b.optionType) && !"PUT".equals(b.optionType)) missing.add("optionType(CALL|PUT)");
            if (isBlank(b.expiration) || !isIsoDate(b.expiration)) missing.add("expiration(ISO date)");
            if (b.openingQuantity == null || b.openingQuantity <= 0) missing.add("openingQuantity(>0)");
            if (isBlank(b.openingDate) || !isIsoDate(b.openingDate)) missing.add("openingDate(ISO date)");
        }
        if (!missing.isEmpty()) {
            return ResponseEntity.unprocessableEntity().body(Map.of(
                "error", "continuity assess requires a complete opening anchor", "missing", missing));
        }

        LocalDate quietDay = parseDateOrNull(b.quietDay);
        List<FidelityActivityRow> rows = toActivityRows(b.historyRows);

        ContinuityInputs inputs = new ContinuityInputs(
            b.brokerageAccountId, b.underlying, b.optionType, b.strike == null ? 0.0 : b.strike,
            LocalDate.parse(b.expiration), b.openingQuantity, LocalDate.parse(b.openingDate),
            Boolean.TRUE.equals(b.historyCompleteThroughQuietDay), quietDay,
            rows, b.positionsShortQuantityOnQuietDay,
            Boolean.TRUE.equals(b.positionsIdentifiesSeries), ContinuityEngine.ADMISSION_RULE_VERSION);

        ContinuityAssessment a = engine.assess(inputs);

        // Durable, deterministic, append-only. effective_from is the endpoint/economic cut
        // (quiet day when present, else the opening date); recorded_at is backend time.
        String effectiveFrom = (a.quietDay() != null ? a.quietDay() : b.openingDate) + "T00:00:00Z";
        String recordedAt = Instant.now().toString();
        String assessmentId = "ooca_" + a.evidenceHash().replace("ceh_", "") + "_" + a.admissionRuleVersion();

        ContinuityAssessmentRecord rec = new ContinuityAssessmentRecord(
            assessmentId, b.brokerageAccountId, b.governedScopeId, b.underlying, b.optionType,
            b.strike == null ? 0.0 : b.strike, b.expiration, b.openingQuantity, a.verdict().name(),
            a.reconciledQuantity(), toJsonArray(a.blockers()), a.admissionRuleVersion(),
            a.acceptedCompleteness(), a.quietDay(), a.evidenceHash(), effectiveFrom, recordedAt);
        store.appendContinuityAssessment(rec);

        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("status", "assessed");
        body.put("assessmentId", assessmentId);
        body.put("verdict", a.verdict().name());
        body.put("affirmative", a.isAffirmative());
        body.put("openingQuantity", a.openingQuantity());
        body.put("reconciledQuantity", a.reconciledQuantity());
        body.put("blockers", a.blockers());
        body.put("admissionRuleVersion", a.admissionRuleVersion());
        body.put("acceptedCompleteness", a.acceptedCompleteness());
        body.put("quietDay", a.quietDay());
        body.put("evidenceHash", a.evidenceHash());
        body.put("effectiveFrom", effectiveFrom);
        body.put("recordedAt", recordedAt);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/api/continuity/resolve")
    public ResponseEntity<?> resolve(
            @RequestParam String brokerageAccountId,
            @RequestParam String underlying,
            @RequestParam String optionType,
            @RequestParam double strike,
            @RequestParam String expiration,
            @RequestParam String effectiveAsOf,
            @RequestParam String knowledgeCutoff) throws SQLException {
        ContinuityAssessmentRecord rec = store.resolveContinuityAssessment(
            brokerageAccountId, underlying, optionType, strike, expiration, effectiveAsOf, knowledgeCutoff);
        if (rec == null) return ResponseEntity.ok(Map.of("resolved", false));
        return ResponseEntity.ok(Map.of("resolved", true, "assessment", rec));
    }

    @GetMapping("/api/continuity/counts")
    public ResponseEntity<Map<String, Integer>> counts() throws SQLException {
        return ResponseEntity.ok(store.getGovernedDecisionCounts());
    }

    // --- mapping helpers ---

    private static List<FidelityActivityRow> toActivityRows(List<HistoryRowDto> dtos) {
        List<FidelityActivityRow> out = new ArrayList<>();
        if (dtos == null) return out;
        for (HistoryRowDto d : dtos) {
            out.add(new FidelityActivityRow(
                parseDateOrNull(d.runDate), d.action == null ? "" : d.action,
                d.symbol == null ? "" : d.symbol, d.description == null ? "" : d.description,
                d.type == null ? "" : d.type, bd(d.price), bd(d.quantity), bd(d.commission),
                bd(d.fees), bd(d.accruedInterest), bd(d.amount), bd(d.cashBalance),
                parseDateOrNull(d.settlementDate)));
        }
        return out;
    }

    private static BigDecimal bd(Double v) { return v == null ? null : BigDecimal.valueOf(v); }

    private static LocalDate parseDateOrNull(String s) {
        if (s == null || s.isBlank()) return null;
        try { return LocalDate.parse(s.trim()); } catch (Exception e) { return null; }
    }

    private static String toJsonArray(List<String> items) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append('"').append(items.get(i).replace("\\", "\\\\").replace("\"", "\\\"")).append('"');
        }
        return sb.append("]").toString();
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }

    private static boolean isIsoDate(String s) {
        try { LocalDate.parse(s); return true; } catch (Exception e) { return false; }
    }

    /** Assessment request. History rows are raw; the backend admits each semantically. */
    public static class AssessDto {
        public String brokerageAccountId;
        public String governedScopeId;   // optional opaque cohort scope, if already established
        public String underlying;
        public String optionType;        // CALL | PUT
        public Double strike;
        public String expiration;        // ISO date
        public Integer openingQuantity;  // whole governed Q
        public String openingDate;       // ISO date
        public Boolean historyCompleteThroughQuietDay;
        public String quietDay;          // ISO date P
        public Integer positionsShortQuantityOnQuietDay;
        public Boolean positionsIdentifiesSeries;
        public List<HistoryRowDto> historyRows;
    }

    /** One raw Fidelity History row as posted by the browser (never pre-filtered). */
    public static class HistoryRowDto {
        public String runDate;           // ISO date
        public String action;
        public String symbol;
        public String description;
        public String type;
        public Double price;
        public Double quantity;
        public Double commission;
        public Double fees;
        public Double accruedInterest;
        public Double amount;
        public Double cashBalance;
        public String settlementDate;    // ISO date
    }
}
