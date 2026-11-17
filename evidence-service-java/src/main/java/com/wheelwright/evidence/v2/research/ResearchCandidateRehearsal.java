package com.wheelwright.evidence.v2.research;

import java.time.LocalDate;
import static com.wheelwright.evidence.v2.research.ResearchCandidate.*;

/**
 * Dated retained research rehearsal only: no live-provider access, ingestion or
 * persistent backend authority. Source references are from the 2026-11-17
 * Principal-supplied 69-company facts packet and BQS 4AM Round 2 report.
 */
public final class ResearchCandidateRehearsal {
    private ResearchCandidateRehearsal() {}
    private static final String UNIVERSE = "S&P 500 | 2026-11-17 (third-party roster)";
    private static final String CAPTURE = "2026-11-16T04:43:34.855778Z";

    static Assessment cat() {
        EvidenceRef sec = new EvidenceRef("SEC retained companyfacts CAT CIK0000018230",
                "0fe50d57bf90ee91f2997ca309353b4b86c2adc192ba9c469623ea7c2f52cfb7", CAPTURE);
        EvidenceRef sub = new EvidenceRef("SEC retained submissions CAT",
                "933788676d5d4a469ecc033ac3859adf2cbdaa7a086d06683b84f5d3b00b585e", CAPTURE);
        // Investigative market data are not newly admitted, original broker-wire evidence.
        EvidenceRef investigation = new EvidenceRef("Round 2 reconstructed broker research report",
                "6d63a7da26f9b416e9e861c507b6efdba8b500e7396624075e73b216ef93bb24", "2026-11-17 (report date)");
        return assess(new Request("CAT", 18230L, UNIVERSE,
                new AnnualMetrics(new double[]{5.46,11.83,12.64,20.12,22.05,18.81},
                    new double[]{41748000000d,50971000000d,59427000000d,67060000000d,64809000000d,67589000000d},
                    "NUMERIC", sec),
                new FilingCoverage("0000018230-26-000008",LocalDate.parse("2025-12-31"),true,true,sub),
                new PriceContext(570.49,709.75,1073.46,LocalDate.parse("2026-11-16"),investigation),
                new SpreadEvidence(true,false,false,false,false,false,investigation)));
    }
    static Assessment clx() {
        EvidenceRef sec = new EvidenceRef("SEC retained companyfacts CLX CIK0000021076",
                "f9b61f8b3fed2f3b2a75c062d778ff639e9a9467fbd186d3c1bf3d23d90ce5ce", CAPTURE);
        EvidenceRef sub = new EvidenceRef("SEC retained submissions CLX",
                "cf9fbf3c4678ec41a803f5425c95cbce75225619fc14313296b9a9fc1ae00828", CAPTURE);
        return assess(new Request("CLX",21076L,UNIVERSE,
                new AnnualMetrics(new double[]{7.36,5.58,3.73,1.20,2.25,6.52},
                    new double[]{6721000000d,7341000000d,7107000000d,7389000000d,7093000000d,7104000000d},
                    "NUMERIC",sec),
                new FilingCoverage("0000021076-26-000034",LocalDate.parse("2026-06-30"),false,false,sub),
                null,null));
    }
    public static String formatRow(Assessment a) {
        String quality = a.quality().status() == Disposition.HELD ? "HOLD (filing gap)" :
                a.holds().contains("EARNINGS_TRAJECTORY_DECLINE_REVIEW") ? "REVIEW (EPS trend)" : "UNASSESSED";
        String dislocation = a.emaDistancePercent() == null ? "UNASSESSED" :
                String.format(java.util.Locale.US,"%+.1f%% EMA50",a.emaDistancePercent());
        String spread = a.spread().status() == Disposition.HELD ? "HOLD" : "UNASSESSED";
        return String.format(java.util.Locale.US,"%-7s %-20s %-13s %-16s %-12s %s",
                a.symbol(),quality,"UNASSESSED",dislocation,spread,"NO TRADE");
    }
    public static void main(String[] args) {
        System.out.println("BQS research rehearsal | S&P 500 roster 2026-11-17 | price cut 2026-11-16");
        System.out.printf("%-7s %-20s %-13s %-16s %-12s %s%n",
                "SYMBOL","BUSINESS QUALITY","VALUATION","DISLOCATION","SPREAD","DECISION");
        for (Assessment a : new Assessment[]{cat(),clx()}) {
            System.out.println(formatRow(a));
            if (args.length > 0 && "--evidence".equals(args[0])) {
                System.out.printf("  EPS CAGR %.2f%%; latest reported YoY %s; holds %s%n",
                        a.epsCagrPercent(), a.latestEpsGrowthPercent(), a.holds());
            }
        }
    }
}
