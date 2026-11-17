package com.wheelwright.evidence.v2.research;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Provisional, retained-data candidate assessment; NOT a BQS score, valuation,
 * investment recommendation, broker order or live acquisition capability.
 * The caller owns original evidence and supplies its immutable references.
 * Pure calculation: no networking, filesystem, clocks, or mutable shared state.
 */
public final class ResearchCandidate {
    private ResearchCandidate() {}

    public enum Disposition { OBSERVED, NOT_COMPUTED, HELD }

    public record EvidenceRef(String source, String sha256, String capturedAt) {
        public EvidenceRef {
            if (source == null || source.isBlank() ||
                sha256 == null || !sha256.matches("[0-9a-fA-F]{64}") ||
                capturedAt == null || capturedAt.isBlank())
                throw new IllegalArgumentException("immutable evidence reference required");
        }
    }
    public record AnnualMetrics(double[] dilutedEps, double[] revenue,
                                String outcome, EvidenceRef evidence) {
        public AnnualMetrics {
            dilutedEps = dilutedEps == null ? null : dilutedEps.clone();
            revenue = revenue == null ? null : revenue.clone();
            Objects.requireNonNull(evidence);
            Objects.requireNonNull(outcome);
        }
        @Override public double[] dilutedEps() { return dilutedEps == null ? null : dilutedEps.clone(); }
        @Override public double[] revenue() { return revenue == null ? null : revenue.clone(); }
    }
    public record PriceContext(double close, double ema50, double yearHigh,
                               LocalDate completedSession, EvidenceRef evidence) {
        public PriceContext { Objects.requireNonNull(completedSession); Objects.requireNonNull(evidence); }
    }
    public record FilingCoverage(String latestApplicableAnnualAccession,
                                 LocalDate annualReportEnd, boolean revenuePresent,
                                 boolean epsPresent, EvidenceRef evidence) {
        public FilingCoverage { Objects.requireNonNull(annualReportEnd); Objects.requireNonNull(evidence); }
    }
    public record SpreadEvidence(boolean bothLegsIndividuallyIdentified,
                                 boolean bothLegsCurrent, boolean sourceClocksAligned,
                                 boolean requiredGreeksPresent, boolean eventCoverageEstablished,
                                 boolean economicTermsVerified, EvidenceRef evidence) {
        public SpreadEvidence { Objects.requireNonNull(evidence); }
    }
    public record Request(String symbol, long cik, String universeId,
                          AnnualMetrics financials, FilingCoverage filingCoverage,
                          PriceContext price, SpreadEvidence spread) {
        public Request {
            if (symbol == null || !symbol.matches("[A-Z.]{1,8}") || cik <= 0 ||
                universeId == null || universeId.isBlank())
                throw new IllegalArgumentException("issuer, symbol and universe identity required");
            Objects.requireNonNull(financials);
            Objects.requireNonNull(filingCoverage);
        }
    }
    public record Dimension(Disposition status, String explanation) {}
    public record Assessment(String symbol, long cik, String universeId,
                             Dimension quality, Dimension valuation,
                             Dimension dislocation, Dimension spread,
                             Double epsCagrPercent, Double latestEpsGrowthPercent,
                             Double emaDistancePercent, Double highDrawdownPercent,
                             List<String> holds) {
        public Assessment { holds = List.copyOf(holds); }
        public boolean isTradeQualified() {
            return holds.isEmpty() && quality.status() == Disposition.OBSERVED &&
                valuation.status() == Disposition.OBSERVED &&
                dislocation.status() == Disposition.OBSERVED &&
                spread.status() == Disposition.OBSERVED;
        }
    }

    public static Assessment assess(Request r) {
        List<String> holds = new ArrayList<>();
        FilingCoverage f = r.filingCoverage();
        if (f.latestApplicableAnnualAccession() == null || f.latestApplicableAnnualAccession().isBlank() ||
                !f.revenuePresent() || !f.epsPresent()) holds.add("ANNUAL_FILING_METRIC_COVERAGE_UNRESOLVED");
        AnnualMetrics a = r.financials();
        Double epsCagr = null, latestYoY = null;
        double[] eps = a.dilutedEps();
        if (eps != null && eps.length >= 2 && finitePositive(eps[0]) && finitePositive(eps[eps.length-1])) {
            epsCagr = (Math.pow(eps[eps.length-1]/eps[0], 1.0/(eps.length-1))-1)*100;
            if (finitePositive(eps[eps.length-2]))
                latestYoY = 100*(eps[eps.length-1]/eps[eps.length-2]-1);
        }
        if (!"NUMERIC".equals(a.outcome()) || epsCagr == null)
            holds.add("FINANCIAL_METRIC_NOT_COMPARABLE");
        if (latestYoY != null && latestYoY < 0) holds.add("EARNINGS_TRAJECTORY_DECLINE_REVIEW");
        // Trajectory is evidence, not a complete business-quality determination.
        Dimension quality = new Dimension(holds.contains("ANNUAL_FILING_METRIC_COVERAGE_UNRESOLVED") ||
                holds.contains("FINANCIAL_METRIC_NOT_COMPARABLE") ? Disposition.HELD : Disposition.NOT_COMPUTED,
                "Trajectory observed; cash flow, leverage, sector-specific durability and adoption remain unqualified");
        Dimension valuation = new Dimension(Disposition.NOT_COMPUTED,
                "No defensible intrinsic-value or peer-relative financial assessment adopted");
        Double distance = null, drawdown = null;
        Dimension dislocation = new Dimension(Disposition.NOT_COMPUTED, "No qualified completed-session price cut");
        if (r.price() != null) {
            PriceContext p = r.price();
            if (finitePositive(p.close()) && finitePositive(p.ema50()) && finitePositive(p.yearHigh())) {
                distance = 100*(p.close()/p.ema50()-1);
                drawdown = 100*(p.close()/p.yearHigh()-1);
                dislocation = new Dimension(Disposition.OBSERVED,
                        "Completed-session price dislocation; not intrinsic-value evidence");
            } else {
                holds.add("PRICE_INPUT_INVALID");
                dislocation = new Dimension(Disposition.HELD, "Invalid or missing price denominators");
            }
        }
        Dimension spread = new Dimension(Disposition.NOT_COMPUTED, "No qualifying executable spread evidence");
        if (r.spread() != null) {
            SpreadEvidence s = r.spread();
            if (!s.bothLegsIndividuallyIdentified()) holds.add("CONTRACT_TERMS_UNVERIFIED");
            if (!s.bothLegsCurrent()) holds.add("DELAYED_LEGS");
            if (!s.sourceClocksAligned()) holds.add("SIDE_ALIGNMENT_UNKNOWN");
            if (!s.requiredGreeksPresent()) holds.add("REQUIRED_GREEK_MISSING");
            if (!s.eventCoverageEstablished()) holds.add("EVENT_COVERAGE_UNKNOWN");
            if (!s.economicTermsVerified()) holds.add("SPREAD_ECONOMICS_UNVERIFIED");
            spread = new Dimension(holds.stream().anyMatch(x -> x.equals("DELAYED_LEGS") ||
                    x.equals("SIDE_ALIGNMENT_UNKNOWN") || x.equals("REQUIRED_GREEK_MISSING") ||
                    x.equals("CONTRACT_TERMS_UNVERIFIED") || x.equals("EVENT_COVERAGE_UNKNOWN") ||
                    x.equals("SPREAD_ECONOMICS_UNVERIFIED")) ? Disposition.HELD : Disposition.NOT_COMPUTED,
                    "Observed chain evidence cannot by itself establish trade eligibility");
        }
        return new Assessment(r.symbol(), r.cik(), r.universeId(), quality, valuation, dislocation,
                spread, epsCagr, latestYoY, distance, drawdown, holds);
    }

    private static boolean finitePositive(double v) { return Double.isFinite(v) && v > 0; }
}
