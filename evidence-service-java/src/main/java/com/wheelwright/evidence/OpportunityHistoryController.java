package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.SqliteEvidenceStore.EvaluationEpochRecord;
import com.wheelwright.evidence.db.SqliteEvidenceStore.SymbolObservationRecord;
import com.wheelwright.evidence.db.SqliteEvidenceStore.SurfaceObservationRecord;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
 * GET /api/opportunity-history/counts — row counts for observability.
 */
@RestController
public class OpportunityHistoryController {

    private final SqliteEvidenceStore store;

    public OpportunityHistoryController(SqliteEvidenceStore store) {
        this.store = store;
    }

    @PostMapping("/api/opportunity-history")
    public ResponseEntity<Map<String, Object>> append(@RequestBody BatchRequest body) throws SQLException {
        if (body == null || body.epoch == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "epoch is required"));
        }

        EvaluationEpochRecord epoch = new EvaluationEpochRecord(
            body.epoch.epochId, body.epoch.startedAt, body.epoch.policyVersion,
            body.epoch.evidenceGeneration, body.epoch.sessionDate, body.epoch.sessionPosture,
            body.epoch.provider, body.epoch.environment, body.epoch.symbolsEvaluated,
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
                surfaceObs.add(new SurfaceObservationRecord(
                    o.observationId, o.epochId, o.symbol, o.expiration, o.dte, o.strategy,
                    o.evaluationState, o.chainRetrievedAt, o.observedAt,
                    o.bestDelta, o.bestStrike, o.bestMid, o.bestSpreadPct,
                    o.bestOpenInterest, o.bestVolume, o.bestYieldAnnual, o.bestPosture));
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
        public Double bestDelta;
        public Double bestStrike;
        public Double bestMid;
        public Double bestSpreadPct;
        public Integer bestOpenInterest;
        public Integer bestVolume;
        public Double bestYieldAnnual;
        public String bestPosture;
    }
}
