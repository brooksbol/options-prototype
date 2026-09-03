package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.SqliteEvidenceStore.EvaluationEpochRecord;
import com.wheelwright.evidence.db.SqliteEvidenceStore.SymbolObservationRecord;
import com.wheelwright.evidence.db.SqliteEvidenceStore.SurfaceObservationRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Opportunity-History endpoint — POST /api/opportunity-history
 *
 * Durable, append-only, idempotent record of Decision-evaluation OUTCOMES.
 *
 * ARCHITECTURE (B-1, explicitly transitional): the browser is the current authoritative
 * Decision evaluator and therefore the emitter. The Evidence Appliance owns the durable
 * historical record. When Decision migrates server-side (PL-ARCH-06), the emitter moves;
 * this schema/history survives unchanged.
 *
 * IDEMPOTENCY: all rows use deterministic ids + INSERT OR IGNORE. Browser retries,
 * remounts, multiple tabs, or duplicate clients cannot create duplicate historical facts.
 *
 * POLICY-NEUTRAL: stores raw Decision/evidence facts (evaluation state + winner economics
 * under a recorded policy version). Never a usefulness/membership score.
 *
 * HTTP BOUNDARY CONTRACT (PL-DEPLOY-02-DEF01): winner economics are transported as a NESTED
 * `winner` object matching the frontend domain shape
 * ({delta, strike, mid, spreadPercent, openInterest, volume, yieldAnnualized, posture}),
 * mapped here into the flat persistence columns. Prior to this repair the DTO declared flat
 * `bestX` fields that never matched the emitted nested object, so Jackson silently dropped all
 * winner economics (they persisted as NULL). See docs/parking-lot-3.md PL-DEPLOY-02-DEF01.
 *
 * INGESTION INVARIANT (PL-DEPLOY-02-DEF01, semantic): an observation state whose semantics
 * require winner economics must not be durably accepted as a valid complete observation when
 * those economics are absent. This controller enforces that by rejecting a batch that carries
 * a winner-required surface state with a missing/incomplete winner, and by making such
 * contract violations observable (counter + log) rather than silently degrading.
 *
 * GET /api/opportunity-history/counts — row counts for observability.
 */
@RestController
public class OpportunityHistoryController {

    private static final Logger log = LoggerFactory.getLogger(OpportunityHistoryController.class);

    /**
     * Surface states whose semantics REQUIRE winner economics. Mirrors the frontend
     * QUALIFYING_SURFACE_STATES (opportunity-fact.ts). Kept as an explicit constant so the
     * ingestion invariant is enforced at the durable boundary independent of the emitter.
     */
    private static final Set<String> WINNER_REQUIRED_STATES = Set.of(
        "QUALIFIED_ACTIONABLE",
        "QUALIFIED_EDGE",
        "EVALUATED_WAIT",
        "EVALUATED_WIDE_SPREAD"
    );

    /** Observability: count of rejected batches due to a winner-required/economics-absent contract violation. */
    private final AtomicLong contractViolations = new AtomicLong(0);

    private final SqliteEvidenceStore store;

    public OpportunityHistoryController(SqliteEvidenceStore store) {
        this.store = store;
    }

    @PostMapping("/api/opportunity-history")
    public ResponseEntity<Map<String, Object>> append(@RequestBody BatchRequest body) throws SQLException {
        if (body == null || body.epoch == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "epoch is required"));
        }

        // PROVENANCE BOUNDARY (PL-PROV-FAILOVER blocker #6, review 3): the provenance of an
        // opportunity-history observation must be the EXACT provenance of the evidence the
        // Decision evaluated. Inferring a single "epoch environment" from the CURRENT mutable
        // evidence table is NOT authoritative — the current table may have advanced, mixed, or
        // been overwritten since the Decision ran, and a global-epoch inference cannot be
        // subject-accurate. Until exact per-subject/per-chain retrieval provenance is carried
        // with the Decision result (immutable generation provenance or the chain retrieval
        // identities already associated with the evaluated evidence), we persist 'unknown'
        // rather than MANUFACTURE provenance. This never invents an environment and never
        // teaches the frontend provider semantics.
        //
        // (The durable path — immutable generation provenance vs. subject/chain retrieval
        // identities — is a design decision recorded for the architecture step, deliberately
        // NOT hacked in here.)
        // Both HALVES of the provenance pair are untrusted from the client (review-5 #2). Just
        // as environment is backend-established 'unknown', the PROVIDER identity must be too —
        // persisting a browser-asserted provider (e.g. "appliance"/"tradier") would preserve one
        // half of an untrusted provenance pair. Until authoritative backend evidence provenance
        // exists, BOTH are the explicit non-provenance value 'unknown'.
        String evidenceProvider = "unknown";
        String evidenceEnvironment = "unknown";
        EvaluationEpochRecord epoch = new EvaluationEpochRecord(
            body.epoch.epochId, body.epoch.startedAt, body.epoch.policyVersion,
            body.epoch.evidenceGeneration, body.epoch.sessionDate, body.epoch.sessionPosture,
            evidenceProvider, evidenceEnvironment, body.epoch.symbolsEvaluated,
            body.epoch.emitter == null ? "browser" : body.epoch.emitter
        );

        List<SymbolObservationRecord> symbolObs = new ArrayList<>();
        if (body.symbolObservations != null) {
            for (SymbolObs o : body.symbolObservations) {
                symbolObs.add(new SymbolObservationRecord(
                    o.observationId, o.epochId, o.symbol, o.symbolState, o.observedAt));
            }
        }

        List<SurfaceObservationRecord> surfaceObs = new ArrayList<>();
        if (body.surfaceObservations != null) {
            for (SurfaceObs o : body.surfaceObservations) {
                // Ingestion invariant: a winner-required state must carry complete winner economics.
                // Never silently persist a winner-required surface as a "complete" row with null economics.
                boolean winnerRequired = o.evaluationState != null
                    && WINNER_REQUIRED_STATES.contains(o.evaluationState);
                if (winnerRequired && !isCompleteWinner(o.winner)) {
                    long n = contractViolations.incrementAndGet();
                    log.warn("opportunity-history contract violation (#{}): winner-required state '{}' "
                            + "for {} {} {} carried missing/incomplete winner economics; batch rejected "
                            + "(epoch={})",
                        n, o.evaluationState, o.strategy, o.symbol, o.expiration, epoch.epochId());
                    return ResponseEntity.unprocessableEntity().body(Map.of(
                        "error", "winner-required state missing winner economics",
                        "evaluationState", o.evaluationState,
                        "symbol", o.symbol == null ? "" : o.symbol,
                        "expiration", o.expiration == null ? "" : o.expiration,
                        "strategy", o.strategy == null ? "" : o.strategy,
                        "contractViolations", n
                    ));
                }

                WinnerDto w = o.winner;
                surfaceObs.add(new SurfaceObservationRecord(
                    o.observationId, o.epochId, o.symbol, o.expiration, o.dte, o.strategy,
                    o.evaluationState, o.chainRetrievedAt, o.observedAt,
                    w == null ? null : w.delta,
                    w == null ? null : w.strike,
                    w == null ? null : w.mid,
                    w == null ? null : w.spreadPercent,
                    w == null ? null : w.openInterest,
                    w == null ? null : w.volume,
                    w == null ? null : w.yieldAnnualized,
                    w == null ? null : w.posture));
            }
        }

        store.appendOpportunityHistory(epoch, symbolObs, surfaceObs);

        return ResponseEntity.ok(Map.of(
            "status", "recorded",
            "epochId", epoch.epochId(),
            "symbolObservations", symbolObs.size(),
            "surfaceObservations", surfaceObs.size()
        ));
    }

    @GetMapping("/api/opportunity-history/counts")
    public ResponseEntity<Map<String, Integer>> counts() throws SQLException {
        return ResponseEntity.ok(store.getOpportunityHistoryCounts());
    }

    /**
     * A winner is complete when the nested object is present and all economics fields the
     * persistence schema records are non-null. Missing any required field is a contract
     * violation for a winner-required state (never silently stored).
     */
    private static boolean isCompleteWinner(WinnerDto w) {
        return w != null
            && w.delta != null
            && w.strike != null
            && w.mid != null
            && w.spreadPercent != null
            && w.openInterest != null
            && w.volume != null
            && w.yieldAnnualized != null
            && w.posture != null && !w.posture.isBlank();
    }

    // --- Request DTOs (Jackson-bound) ---

    public static class BatchRequest {
        public EpochDto epoch;
        public List<SymbolObs> symbolObservations;
        public List<SurfaceObs> surfaceObservations;
    }

    public static class EpochDto {
        public String epochId;
        public String startedAt;
        public String policyVersion;
        public Integer evidenceGeneration;
        public String sessionDate;
        public String sessionPosture;
        public String provider;
        public String environment;
        public int symbolsEvaluated;
        public String emitter;
    }

    public static class SymbolObs {
        public String observationId;
        public String epochId;
        public String symbol;
        public String symbolState;
        public String observedAt;
    }

    public static class SurfaceObs {
        public String observationId;
        public String epochId;
        public String symbol;
        public String expiration;
        public int dte;
        public String strategy;
        public String evaluationState;
        public String chainRetrievedAt;
        public String observedAt;
        /**
         * Winner economics — nested object matching the frontend domain shape. Present iff the
         * evaluationState is a qualifying/wait/wide-spread state; null otherwise (non-winner
         * states persist null economics).
         */
        public WinnerDto winner;
    }

    /**
     * Nested winner economics transported from the frontend. Field names match the frontend
     * WinnerEconomics interface exactly (opportunity-fact.ts) so Jackson binds them; they are
     * mapped into the flat persistence columns by the controller.
     */
    public static class WinnerDto {
        public Double delta;
        public Double strike;
        public Double mid;
        public Double spreadPercent;
        public Integer openInterest;
        public Integer volume;
        public Double yieldAnnualized;
        public String posture;
    }
}
