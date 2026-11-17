package com.wheelwright.evidence.v2.research;

import java.time.LocalDate;
import static com.wheelwright.evidence.v2.research.ResearchCandidate.*;

/** Focused contract checks runnable with javac/java; no provider or database. */
public final class ResearchCandidateChecks {
    static void check(boolean ok, String message) { if (!ok) throw new AssertionError(message); }
    static final EvidenceRef REF = new EvidenceRef("fixture", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "2026-11-16T00:00:00Z");
    static Request base() {return new Request("AAA",123,"test-universe",
        new AnnualMetrics(new LocalDate[]{LocalDate.parse("2020-12-31"),LocalDate.parse("2021-12-31"),LocalDate.parse("2022-12-31"),LocalDate.parse("2023-12-31"),LocalDate.parse("2024-12-31"),LocalDate.parse("2025-12-31")},new double[]{2,3,4,5,6,7},new double[]{10,11,12,13,14,15},"NUMERIC",REF),
        new FilingCoverage("accession",LocalDate.parse("2025-12-31"),true,true,REF),
        new PriceContext(80,100,120,LocalDate.parse("2026-11-16"),REF),
        new SpreadEvidence(true,true,true,true,true,true,REF));}
    public static void main(String[] args) {
        Assessment cat = ResearchCandidateRehearsal.cat(), clx = ResearchCandidateRehearsal.clx();
        check(cat.holds().contains("EARNINGS_TRAJECTORY_DECLINE_REVIEW"),"CAT trajectory");
        check(Math.abs(cat.epsCagrPercent()-28.0675881)<0.001,"CAT six-year growth");
        check(Math.abs(cat.latestEpsGrowthPercent()+14.69387755)<0.001,"CAT latest reversal");
        check(Math.abs(cat.emaDistancePercent()+19.62)<0.01,"CAT completed-session EMA");
        check(cat.holds().contains("DELAYED_LEGS")&&cat.holds().contains("REQUIRED_GREEK_MISSING"),"CAT spread holds");
        check(clx.holds().contains("ANNUAL_FILING_METRIC_COVERAGE_UNRESOLVED"),"CLX missing annual facts");
        check(clx.quality().status()==Disposition.HELD,"CLX quality cannot pass");
        check(!cat.isTradeQualified()&&!clx.isTradeQualified(),"No false investment decision");
        Assessment empty = assess(base());
        check(empty.quality().status()==Disposition.NOT_COMPUTED&&empty.valuation().status()==Disposition.NOT_COMPUTED,
                "Complete trajectory alone must not produce quality or value");
        check(!empty.isTradeQualified(),"Even all-positive spread flags cannot certify a trade");
        Request missing = new Request("AAA",123,"test-universe",base().financials(),
                new FilingCoverage("accession",LocalDate.parse("2025-12-31"),false,true,REF),null,null);
        check(assess(missing).quality().status()==Disposition.HELD,"Missing metric cannot be zero/pass");
        Request badPrice = new Request("AAA",123,"test-universe",base().financials(),base().filingCoverage(),
                new PriceContext(0,100,120,LocalDate.parse("2026-11-16"),REF),null);
        check(assess(badPrice).holds().contains("PRICE_INPUT_INVALID"),"Zero price must hold");
        double[] input = {2,3,4,5,6,7};
        AnnualMetrics safe = new AnnualMetrics(new LocalDate[]{LocalDate.parse("2024-12-31"),LocalDate.parse("2025-12-31")},input,new double[]{10,11},"NUMERIC",REF);
        input[0] = 999;
        check(safe.dilutedEps()[0]==2,"Input alias must not mutate evidence");
        double[] copy=safe.dilutedEps();copy[0]=1000;
        check(safe.dilutedEps()[0]==2,"Output alias must not mutate evidence");
        Request badYears = new Request("AAA",123,"test-universe",
            new AnnualMetrics(new LocalDate[]{LocalDate.parse("2020-12-31"),LocalDate.parse("2022-12-31")},
                new double[]{2,4},new double[]{10,12},"NUMERIC",REF),base().filingCoverage(),null,null);
        check(assess(badYears).holds().contains("ANNUAL_PERIODS_INCOMPARABLE"),"Gap cannot produce CAGR");
        check(assess(badYears).epsCagrPercent()==null,"Gap must not yield numeric CAGR");
        try { new EvidenceRef("x","not-a-sha","2026-11-16"); throw new AssertionError("Digest validation"); }
        catch(IllegalArgumentException expected) { /* pass */ }
        System.out.println("16 focused research assessment checks passed");
    }
}
