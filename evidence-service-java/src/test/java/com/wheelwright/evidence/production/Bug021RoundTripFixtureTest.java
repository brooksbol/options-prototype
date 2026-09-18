package com.wheelwright.evidence.production;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

/**
 * BUG-021 backend → Product round-trip fixtures (fourth amendment, fix #4).
 *
 * This test drives specimens through the REAL production HTTP path (`ProductionController.assess`
 * with a MockMultipartFile) and serializes the actual `ProductionResponse` — the exact JSON the
 * browser receives — to shared fixtures under `options-prototype/tests/fixtures/bug021/`. The
 * frontend test `episode-derivation-backend-roundtrip.test.ts` then loads these fixtures and drives
 * them through the real `deriveEpisodeChapters`, asserting the Product presentation matches the
 * backend `optionCloseResults`. This replaces the prior "test HTTP output and hand-built frontend
 * DTOs separately" approach with a genuine backend→Product round-trip (no divergence possible
 * because both sides use the SAME backend output).
 *
 * The test also asserts the backend statuses here so a fixture can never be regenerated with the
 * wrong verdict without failing.
 */
class Bug021RoundTripFixtureTest {

    private final ProductionController controller = new ProductionController();
    private final ObjectMapper mapper = new ObjectMapper();

    // Resolve the sibling frontend repo's fixtures dir from the backend module working dir.
    private static final Path FIXTURE_DIR =
        Path.of("..", "options-prototype", "tests", "fixtures", "bug021");

    private static final String HEADER =
        "Run Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),"
        + "Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date\n";

    private ProductionResponse assess(String csv, String period) throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "activity.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));
        ResponseEntity<?> resp = controller.assess(file, period);
        assertEquals(200, resp.getStatusCode().value(), "assess should return 200 for a valid CSV");
        assertInstanceOf(ProductionResponse.class, resp.getBody());
        return (ProductionResponse) resp.getBody();
    }

    private void writeFixture(String name, ProductionResponse response) throws Exception {
        Files.createDirectories(FIXTURE_DIR);
        Path out = FIXTURE_DIR.resolve(name);
        mapper.writerWithDefaultPrettyPrinter().writeValue(out.toFile(), response);
        assertTrue(Files.exists(out), "fixture written: " + out);
    }

    private OptionCloseResult.OptionCloseStatus statusOf(ProductionResponse r, String occ, String date) {
        return r.optionCloseResults().stream()
            .filter(o -> occ.equals(o.contractKey()) && date.equals(o.date()))
            .map(o -> OptionCloseResult.OptionCloseStatus.valueOf(o.status()))
            .findFirst().orElseThrow(() -> new AssertionError("no close result for " + occ + " " + date));
    }

    // --- Specimen A: covered but residual uncertain → DETERMINISTIC_PARTIAL (not COMPLETE) ---
    // STO 2 (outstanding [2,2]); a prior unknown-quantity BTC widens to [0,2]... but that would be
    // UNRESOLVED. To exercise COVERED-BUT-NOT-COMPLETE we need min≥q with residualMax>0, i.e. an
    // outstanding range like [1,2] at the close. Construct it: STO 2, then a KNOWN BTC of 1
    // (outstanding→[1,1])? that's exact. The genuine [1,2] arises when one opening qty is known and
    // another is uncertain-in-max only via same-day; simplest deterministic [1,2]: STO 1 (known) +
    // STO 1 same-day-ambiguous with a competing event → max+1 only. We instead use the cleanest
    // real driver: STO 2 then a prior terminal ASSIGNMENT of UNKNOWN quantity leaves [0,2]... also
    // unresolved. The precise covered-not-complete case is min≥q AND max>q: e.g. outstanding [1,2],
    // close 1. That requires min=1,max=2. Achieve with: STO 2, prior BTC of KNOWN 1 (→[1,1]) is
    // exact; to get [1,2] we combine a known opening (+1 both) with an opening whose upper bound is
    // widened by same-day ambiguity (+1 max only). See buildCoveredNotComplete().
    @Test
    @DisplayName("round-trip A: covered-but-uncertain close is DETERMINISTIC_PARTIAL, not COMPLETE")
    void fixtureCoveredNotComplete() throws Exception {
        String occ = "-EWY260821P150";
        String desc = "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)";
        StringBuilder csv = new StringBuilder(HEADER);
        // Coverage endpoints (unrelated contracts) so period coverage is not the issue.
        csv.append(stoRow("07/01/2026", "-GSG260821P32",
            "PUT (GSG) ISHARES S&P GSCI AUG 21 26 $32 (100 SHS)", "-1", "50.00"));
        // A CLEAN known opening of 1 on Jul 3 (no same-day sibling) → contributes [1,1] (min AND max).
        csv.append(stoRow("07/03/2026", occ, desc, "-1", "150.00"));
        // TWO openings of 1 each on Jul 5: they share the date with each other, so each is same-day-
        // ambiguous for the SAME contract and contributes to MAX ONLY (+1 max each), not the
        // guaranteed lower bound. After Jul 5 the recognized outstanding before a later close is
        // [1,3]: min stays 1 (only the clean Jul 3 opening is guaranteed), max rises to 3.
        csv.append(stoRow("07/05/2026", occ, desc, "-1", "150.00"));
        csv.append(stoRow("07/05/2026", occ, desc, "-1", "150.00"));
        // Close of quantity 1 against outstanding [1,3]: min=1≥1 (definitely covered) but
        // residualMax = 3−1 = 2 > 0, so a residual MAY remain → covered, NOT complete retirement.
        csv.append(btcRow("07/20/2026", occ, desc, "1", "-40.00"));
        csv.append(stoRow("07/31/2026", "-BNO260814P50",
            "PUT (BNO) UNITED STS BRENT OIL AUG 14 26 $50 (100 SHS)", "-1", "50.00"));

        ProductionResponse r = assess(csv.toString(), "2026-07");
        assertEquals(OptionCloseResult.OptionCloseStatus.DETERMINISTIC_PARTIAL, statusOf(r, occ, "2026-07-20"),
            "min≥q with residualMax>0 is a covered close with uncertain residual — DETERMINISTIC_PARTIAL, not COMPLETE");
        writeFixture("covered-not-complete.json", r);
    }

    // --- Specimen B: prior same-day-ambiguous close must not manufacture a definite outstanding ---
    @Test
    @DisplayName("round-trip B: prior same-day-ambiguous close leaves a later close UNRESOLVED")
    void fixtureSameDayPropagation() throws Exception {
        String occ = "-EWY260821P150";
        String desc = "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)";
        StringBuilder csv = new StringBuilder(HEADER);
        csv.append(stoRow("07/01/2026", "-GSG260821P32",
            "PUT (GSG) ISHARES S&P GSCI AUG 21 26 $32 (100 SHS)", "-1", "50.00"));
        csv.append(stoRow("07/03/2026", occ, desc, "-2", "300.00"));    // outstanding [2,2]
        // A prior BTC of 1 that shares its date with a competing opening for the same contract →
        // its consumption ordering is unestablished (same-day ambiguous) → later state uncertain.
        csv.append(btcRow("07/10/2026", occ, desc, "1", "-20.00"));
        csv.append(stoRow("07/10/2026", occ, desc, "-1", "150.00"));    // competing same-day event
        csv.append(btcRow("07/20/2026", occ, desc, "2", "-40.00"));     // later close
        csv.append(stoRow("07/31/2026", "-BNO260814P50",
            "PUT (BNO) UNITED STS BRENT OIL AUG 14 26 $50 (100 SHS)", "-1", "50.00"));

        ProductionResponse r = assess(csv.toString(), "2026-07");
        assertEquals(OptionCloseResult.OptionCloseStatus.UNRESOLVED, statusOf(r, occ, "2026-07-20"),
            "a prior same-day-ambiguous close must not manufacture a definite outstanding for a later close");
        writeFixture("same-day-propagation.json", r);
    }

    // --- Specimen C: partial assignment then BTC of the residual → DETERMINISTIC_COMPLETE ---
    @Test
    @DisplayName("round-trip C: partial assignment then BTC of the residual is COMPLETE")
    void fixturePartialAssignmentThenComplete() throws Exception {
        String occ = "-EWY260821P150";
        String desc = "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)";
        StringBuilder csv = new StringBuilder(HEADER);
        csv.append(stoRow("07/01/2026", "-GSG260821P32",
            "PUT (GSG) ISHARES S&P GSCI AUG 21 26 $32 (100 SHS)", "-1", "50.00"));
        csv.append(stoRow("07/03/2026", occ, desc, "-2", "300.00"));         // outstanding [2,2]
        csv.append(assignedRow("07/10/2026", occ, desc, "1"));               // → [1,1]
        csv.append(btcRow("07/20/2026", occ, desc, "1", "-40.00"));          // retires the 1 residual
        csv.append(stoRow("07/31/2026", "-BNO260814P50",
            "PUT (BNO) UNITED STS BRENT OIL AUG 14 26 $50 (100 SHS)", "-1", "50.00"));

        ProductionResponse r = assess(csv.toString(), "2026-07");
        assertEquals(OptionCloseResult.OptionCloseStatus.DETERMINISTIC_COMPLETE, statusOf(r, occ, "2026-07-20"),
            "partial assignment leaves exactly 1 outstanding; BTC 1 definitely retires it — COMPLETE");
        writeFixture("partial-assignment-complete.json", r);
    }

    // --- CSV row builders (Fidelity Activity shape; option symbols carry a leading space) ---

    private String stoRow(String date, String occ, String desc, String qty, String amount) {
        return date + ",YOU SOLD OPENING TRANSACTION " + desc + " (Cash)," + q(" " + occ) + ","
            + q(desc) + ",Cash,1.50," + q(qty) + ",0.65,0.03,,\"" + amount + "\","
            + "90000.00," + date + "\n";
    }
    private String btcRow(String date, String occ, String desc, String qty, String amount) {
        return date + ",YOU BOUGHT CLOSING TRANSACTION " + desc + " (Cash)," + q(" " + occ) + ","
            + q(desc) + ",Cash,0.40," + q(qty) + ",0.65,0.01,,\"" + amount + "\","
            + "90000.00," + date + "\n";
    }
    private String expiredRow(String date, String occ, String desc, String qty) {
        return date + ",EXPIRED " + desc + " as of " + date + " (Cash)," + q(" " + occ) + ","
            + q(desc) + ",Cash,," + q(qty) + ",,,,0.00,90000.00,\n";
    }
    private String assignedRow(String date, String occ, String desc, String qty) {
        return date + ",ASSIGNED as of " + date + " " + desc + " (Cash)," + q(" " + occ) + ","
            + q(desc) + ",Cash,," + q(qty) + ",,,,0.00,90000.00,\n";
    }
    private String q(String s) { return "\"" + s + "\""; }
}
