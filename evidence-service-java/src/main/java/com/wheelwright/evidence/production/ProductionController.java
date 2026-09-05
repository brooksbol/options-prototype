package com.wheelwright.evidence.production;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Production assessment endpoint.
 *
 * POST /api/production/assess
 *
 * Accepts a Fidelity Activity History CSV and returns the authoritative
 * monthly cash production assessment. Stateless — no persistence.
 */
@RestController
public class ProductionController {

    private final FidelityActivityParser parser = new FidelityActivityParser();
    private final ProductionAssessor assessor = new ProductionAssessor();

    @PostMapping("/api/production/assess")
    public ResponseEntity<?> assess(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "period", required = false) String periodParam
    ) {
        try {
            // Parse CSV
            InputStream input = file.getInputStream();
            List<FidelityActivityRow> rows = parser.parse(input);

            if (rows.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "No transaction rows found in the uploaded file"
                ));
            }

            // Determine period
            YearMonth period;
            if (periodParam != null && !periodParam.isBlank()) {
                period = YearMonth.parse(periodParam);
            } else {
                period = assessor.detectPeriod(rows);
            }

            // Assess
            ProductionAssessment assessment = assessor.assess(rows, period);

            // Map to response DTO
            return ResponseEntity.ok(toResponse(assessment));

        } catch (FidelityActivityParser.FidelityParseException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to parse Fidelity Activity History CSV: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Production assessment failed: " + e.getMessage()
            ));
        }
    }

    private ProductionResponse toResponse(ProductionAssessment a) {
        return new ProductionResponse(
            a.period().toString(),
            a.periodDescription(),
            a.status().name(),
            a.issues().stream().map(i -> new ProductionResponse.IssueDto(
                i.type().name(), i.description(), i.potentialImpact()
            )).toList(),
            a.knownCashProduction(),
            a.unresolvedPotentialProduction(),
            a.realizedCapitalErosion(),
            a.netStrategyResult(),
            a.productionBreakdown().entrySet().stream()
                .collect(Collectors.toMap(e -> e.getKey().name(), Map.Entry::getValue)),
            a.erosionEvents().stream().map(e -> new ProductionResponse.ErosionEventDto(
                e.date(), e.symbol(), e.amount(), e.description()
            )).toList(),
            new ProductionResponse.SummaryDto(
                a.transactionSummary().included(),
                a.transactionSummary().excluded(),
                a.transactionSummary().uncertain(),
                a.transactionSummary().notApplicable()
            ),
            a.transactions().stream().map(t -> new ProductionResponse.TransactionDto(
                t.id(), t.date(), t.action(), t.symbol(), t.amount(), t.role(),
                t.components().stream().map(c -> new ProductionResponse.ComponentDto(
                    c.type().name(),
                    c.source() != null ? c.source().name() : null,
                    c.amount(), c.confidence().name(), c.derivation()
                )).toList()
            )).toList(),
            a.dispositionResults().stream().map(d -> new ProductionResponse.DispositionResultDto(
                d.dispositionFingerprint(), d.contractActivityKey(), d.symbol(), d.date(), d.dispositionAction(),
                d.kind() != null ? d.kind().name() : null,
                d.quantity(), d.salePricePerShare(), d.netSaleProceeds(),
                d.attributableAcquisitionCash(), d.realizedAppreciation(),
                d.realizedErosion(), d.state().name(), d.provenance()
            )).toList()
        );
    }
}
