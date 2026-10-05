package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * HTTP-level acceptance tests for POST /v2/quotes against the ratified contract/OAS.
 *
 * <p>Provider contact is replaced by a deterministic {@link FakeDirectQuoteSource} so the
 * acceptance semantics (outcomes, held-state visibility, batching-by-identity, retained prior,
 * FORCE, auth, validation, X-Request-Id, order preservation, all-failure-still-200) are
 * validated WITHOUT live-provider access. Authority fencing is exercised through the REAL
 * {@link com.wheelwright.evidence.provider.ProviderAuthorityManager}: a stale captured epoch
 * returned by the fake source forces AUTHORITY_SUPERSEDED through the genuine commit fence.
 *
 * <p>Three configured principals (via wheelwright.v2.auth.tokens):
 * {@code acq} (quote.acquire + quote.force), {@code acqonly} (quote.acquire only),
 * {@code none} (no grants).
 */
@SpringBootTest(properties = {
    "evidence.db.path=:memory:",
    "tradier.api-key=test-key",
    "wheelwright.v2.auth.tokens=acq=cli:quote.acquire|quote.force,acqonly=web:quote.acquire,none=ro:"
})
@AutoConfigureMockMvc
class V2QuotesControllerTest {

    private static final String AUTH_FULL = "Bearer acq";
    private static final String AUTH_ACQUIRE_ONLY = "Bearer acqonly";
    private static final String AUTH_NO_GRANT = "Bearer none";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FakeDirectQuoteSource source;

    @Autowired
    private com.wheelwright.evidence.db.SqliteEvidenceStore store;

    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void resetSource() throws Exception {
        source.reset();
        // The in-memory store is a shared singleton across tests in this context; clear held
        // direct quotes so each specimen starts from a clean held state.
        store.clearDirectQuotes();
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        FakeDirectQuoteSource fakeDirectQuoteSource() {
            return new FakeDirectQuoteSource();
        }
    }

    // --- helpers -----------------------------------------------------------------------

    private static String body(String json) {
        return json;
    }

    private MvcResult postQuotes(String auth, String requestId, String json) throws Exception {
        var req = post("/v2/quotes").contentType(MediaType.APPLICATION_JSON).content(json);
        if (auth != null) req = req.header("Authorization", auth);
        if (requestId != null) req = req.header("X-Request-Id", requestId);
        return mockMvc.perform(req).andReturn();
    }

    private JsonNode json(MvcResult result) throws Exception {
        return mapper.readTree(result.getResponse().getContentAsString());
    }

    // --- Specimen 1: one newly acquired subject (+ held-state visibility, spec 20) ------

    @Test
    @DisplayName("Specimen 1 + 20: one NEWLY_ACQUIRED subject, visible to held-quote read before response")
    void oneNewlyAcquired() throws Exception {
        source.verified("SPY", rawLast(756.19));
        MvcResult r = postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");

        assertThat(r.getResponse().getStatus()).isEqualTo(200);
        JsonNode b = json(r);
        assertThat(b.get("mode").asText()).isEqualTo("ORDINARY");
        assertThat(b.get("requestId").asText()).isNotBlank();
        assertThat(r.getResponse().getHeader("X-Request-Id")).isEqualTo(b.get("requestId").asText());
        JsonNode res0 = b.get("results").get(0);
        assertThat(res0.get("outcome").asText()).isEqualTo("NEWLY_ACQUIRED");
        assertThat(res0.get("fulfilled").asBoolean()).isTrue();
        assertThat(res0.get("priorRetained").asBoolean()).isFalse();
        assertThat(res0.hasNonNull("failure")).isFalse();
        String observationId = res0.get("observation").get("observationId").asText();
        assertThat(observationId).isNotBlank();
        assertThat(res0.get("observation").get("facts").get("last").get("price").asDouble())
            .isEqualTo(756.19);

        // Spec 20: the accepted observation is authoritative held evidence (held-quote read).
        var held = source.store().getDirectQuote("SPY");
        assertThat(held).isNotNull();
        assertThat(held.observationId()).isEqualTo(observationId);
    }

    // --- Specimen 21: bid-only positive quote, no last ---------------------------------

    @Test
    @DisplayName("Specimen 21: strictly positive bid with no last is a valid NEWLY_ACQUIRED")
    void bidOnlyNoLast() throws Exception {
        source.verified("XLE", rawBidOnly(58.90));
        MvcResult r = postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"XLE\"}]}");
        JsonNode res0 = json(r).get("results").get(0);
        assertThat(res0.get("outcome").asText()).isEqualTo("NEWLY_ACQUIRED");
        JsonNode facts = res0.get("observation").get("facts");
        assertThat(facts.get("bid").get("price").asDouble()).isEqualTo(58.90);
        assertThat(facts.has("last")).isFalse(); // last remains ABSENT, never synthesized
    }

    // --- Specimen 22: previous-close/metadata-only => INVALID_UPSTREAM_EVIDENCE ---------

    @Test
    @DisplayName("Specimen 22: previous-close/metadata-only upstream evidence is INVALID_UPSTREAM_EVIDENCE")
    void prevCloseOnlyInvalid() throws Exception {
        source.verified("AAA", rawPrevCloseOnly(100.0));
        MvcResult r = postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"AAA\"}]}");
        JsonNode res0 = json(r).get("results").get(0);
        assertThat(res0.get("outcome").asText()).isEqualTo("INVALID_UPSTREAM_EVIDENCE");
        assertThat(res0.get("fulfilled").asBoolean()).isFalse();
        assertThat(res0.get("failure").get("code").asText()).isEqualTo("INVALID_UPSTREAM_EVIDENCE");
        assertThat(source.store().getDirectQuote("AAA")).isNull(); // no observation created
    }

    // --- Specimen 24: provider zero bid only => INVALID (zero is not price-bearing) ------

    @Test
    @DisplayName("Specimen 24: provider zero-bid-only does not certify a price-bearing observation")
    void zeroBidOnlyInvalid() throws Exception {
        source.verified("ZZZ", rawBidOnly(0.0));
        MvcResult r = postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"ZZZ\"}]}");
        JsonNode res0 = json(r).get("results").get(0);
        assertThat(res0.get("outcome").asText()).isEqualTo("INVALID_UPSTREAM_EVIDENCE");
        assertThat(source.store().getDirectQuote("ZZZ")).isNull();
    }

    // --- Specimen 3: multiple compatible new subjects -----------------------------------

    @Test
    @DisplayName("Specimen 3: multiple compatible subjects independently NEWLY_ACQUIRED (one batch)")
    void multipleNew() throws Exception {
        source.verified("SPY", rawLast(756.19));
        source.verified("QQQ", rawLast(698.41));
        source.verified("XLE", rawLast(58.99));
        MvcResult r = postQuotes(AUTH_FULL, null,
            "{\"subjects\":[{\"symbol\":\"SPY\"},{\"symbol\":\"QQQ\"},{\"symbol\":\"XLE\"}]}");
        JsonNode results = json(r).get("results");
        assertThat(results).hasSize(3);
        for (JsonNode res : results) {
            assertThat(res.get("outcome").asText()).isEqualTo("NEWLY_ACQUIRED");
        }
        // Spec 32 / batching: a single upstream batch carried all three (one acquire call).
        assertThat(source.batchCount()).isEqualTo(1);
        assertThat(source.lastBatch()).containsExactly("SPY", "QQQ", "XLE");
    }

    // --- Specimen 26: request order preservation ---------------------------------------

    @Test
    @DisplayName("Specimen 26: results preserve requested subject order")
    void orderPreserved() throws Exception {
        source.verified("QQQ", rawLast(1.0));
        source.verified("SPY", rawLast(2.0));
        source.verified("XLE", rawLast(3.0));
        MvcResult r = postQuotes(AUTH_FULL, null,
            "{\"subjects\":[{\"symbol\":\"XLE\"},{\"symbol\":\"SPY\"},{\"symbol\":\"QQQ\"}]}");
        JsonNode results = json(r).get("results");
        assertThat(results.get(0).get("subject").get("symbol").asText()).isEqualTo("XLE");
        assertThat(results.get(1).get("subject").get("symbol").asText()).isEqualTo("SPY");
        assertThat(results.get(2).get("subject").get("symbol").asText()).isEqualTo("QQQ");
    }

    // --- Specimen 5 / 32: provider partial batch + reconcile by identity ----------------

    @Test
    @DisplayName("Specimen 5 + 32: provider partial batch — matched NEWLY_ACQUIRED, missing UNMATCHED by identity")
    void providerPartialBatch() throws Exception {
        source.verified("SPY", rawLast(756.19));
        source.unmatched("BOGUS");
        MvcResult r = postQuotes(AUTH_FULL, null,
            "{\"subjects\":[{\"symbol\":\"SPY\"},{\"symbol\":\"BOGUS\"}]}");
        JsonNode results = json(r).get("results");
        // Reconciled by requested identity, not response position.
        assertThat(results.get(0).get("subject").get("symbol").asText()).isEqualTo("SPY");
        assertThat(results.get(0).get("outcome").asText()).isEqualTo("NEWLY_ACQUIRED");
        assertThat(results.get(1).get("subject").get("symbol").asText()).isEqualTo("BOGUS");
        assertThat(results.get(1).get("outcome").asText()).isEqualTo("UNMATCHED");
        assertThat(results.get(1).get("fulfilled").asBoolean()).isFalse();
        assertThat(results.get(1).get("priorRetained").asBoolean()).isFalse();
    }

    // --- Specimen 6: upstream failure, no prior ----------------------------------------

    @Test
    @DisplayName("Specimen 6: upstream failure with no prior — UPSTREAM_FAILED, observation null, priorRetained false")
    void upstreamFailureNoPrior() throws Exception {
        source.failed("SPY");
        MvcResult r = postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        JsonNode res0 = json(r).get("results").get(0);
        assertThat(res0.get("outcome").asText()).isEqualTo("UPSTREAM_FAILED");
        assertThat(res0.get("fulfilled").asBoolean()).isFalse();
        assertThat(res0.get("observation").isNull()).isTrue();
        assertThat(res0.get("priorRetained").asBoolean()).isFalse();
        assertThat(res0.get("failure").get("code").asText()).isEqualTo("UPSTREAM_FAILED");
    }

    // --- Specimen 7: upstream failure, prior retained ----------------------------------

    @Test
    @DisplayName("Specimen 7: upstream failure with prior — prior unchanged, priorRetained true, not fulfilled")
    void upstreamFailureWithPrior() throws Exception {
        // First succeed to establish held prior.
        source.verified("SPY", rawLast(756.19));
        postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        var priorRow = source.store().getDirectQuote("SPY");
        assertThat(priorRow).isNotNull();

        // Now a FORCE attempt fails; the prior must be retained unchanged.
        source.reset();
        source.failed("SPY");
        MvcResult r = postQuotes(AUTH_FULL, null,
            "{\"subjects\":[{\"symbol\":\"SPY\"}],\"mode\":\"FORCE\"}");
        JsonNode res0 = json(r).get("results").get(0);
        assertThat(res0.get("outcome").asText()).isEqualTo("UPSTREAM_FAILED");
        assertThat(res0.get("fulfilled").asBoolean()).isFalse();
        assertThat(res0.get("priorRetained").asBoolean()).isTrue();
        assertThat(res0.get("observation").get("observationId").asText())
            .isEqualTo(priorRow.observationId());
        // The held row is unchanged by the failed re-acquisition.
        assertThat(source.store().getDirectQuote("SPY").observationId())
            .isEqualTo(priorRow.observationId());
    }

    // --- Specimen 8: FORCE succeeds (real attempt, even when prior exists) ---------------

    @Test
    @DisplayName("Specimen 8: FORCE performs a real upstream attempt and yields NEWLY_ACQUIRED")
    void forceSucceeds() throws Exception {
        source.verified("SPY", rawLast(756.19));
        postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        String firstObs = source.store().getDirectQuote("SPY").observationId();

        source.reset();
        source.verified("SPY", rawLast(756.19)); // identical numbers
        MvcResult r = postQuotes(AUTH_FULL, null,
            "{\"subjects\":[{\"symbol\":\"SPY\"}],\"mode\":\"FORCE\"}");
        JsonNode res0 = json(r).get("results").get(0);
        assertThat(res0.get("outcome").asText()).isEqualTo("NEWLY_ACQUIRED");
        // FORCE made a real upstream attempt (not a reuse) ...
        assertThat(source.batchCount()).isEqualTo(1);
        // ... and identical numeric values still produce a NEW observation identity.
        assertThat(res0.get("observation").get("observationId").asText()).isNotEqualTo(firstObs);
    }

    // --- Specimen 17: authority fencing transition => AUTHORITY_SUPERSEDED ---------------

    @Test
    @DisplayName("Specimen 17: superseded acquisition authority yields AUTHORITY_SUPERSEDED, no NEWLY_ACQUIRED")
    void authoritySuperseded() throws Exception {
        // Fake source reports a STALE captured epoch (0); the real manager is at epoch 1, so
        // the genuine commit fence rejects the write.
        source.verifiedWithEpoch("SPY", rawLast(756.19), "0");
        MvcResult r = postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        JsonNode res0 = json(r).get("results").get(0);
        assertThat(res0.get("outcome").asText()).isEqualTo("AUTHORITY_SUPERSEDED");
        assertThat(res0.get("fulfilled").asBoolean()).isFalse();
        assertThat(source.store().getDirectQuote("SPY")).isNull(); // nothing committed
    }

    // --- Specimen 19: unsupported but well-formed subject ------------------------------

    @Test
    @DisplayName("Specimen 19: well-formed unsupported subject yields UNSUPPORTED_SUBJECT")
    void unsupportedSubject() throws Exception {
        source.unsupported("WEIRD");
        MvcResult r = postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"WEIRD\"}]}");
        JsonNode res0 = json(r).get("results").get(0);
        assertThat(res0.get("outcome").asText()).isEqualTo("UNSUPPORTED_SUBJECT");
        assertThat(res0.get("fulfilled").asBoolean()).isFalse();
    }

    // --- Specimen 25: mixed all-failure operation still returns 200 ---------------------

    @Test
    @DisplayName("Specimen 25: all-failure operation still returns 200 with terminal per-subject results")
    void allFailuresStill200() throws Exception {
        source.failed("SPY");
        source.unmatched("QQQ");
        MvcResult r = postQuotes(AUTH_FULL, null,
            "{\"subjects\":[{\"symbol\":\"SPY\"},{\"symbol\":\"QQQ\"}]}");
        assertThat(r.getResponse().getStatus()).isEqualTo(200);
        JsonNode results = json(r).get("results");
        assertThat(results.get(0).get("fulfilled").asBoolean()).isFalse();
        assertThat(results.get(1).get("fulfilled").asBoolean()).isFalse();
    }

    // --- Specimen 2: eligible held subject REUSED (no upstream contact) ------------------

    @Test
    @DisplayName("Specimen 2: eligible held subject is REUSED with same observation id, no upstream contact")
    void eligibleHeldReused() throws Exception {
        source.verified("SPY", rawLast(756.19));
        postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        String firstObs = source.store().getDirectQuote("SPY").observationId();
        int batchesAfterFirst = source.batchCount();

        // Second ORDINARY request: if the held evidence is reuse-eligible under current policy,
        // it is REUSED with the SAME observation id and no new upstream batch. (Eligibility
        // depends on live session phase; when not eligible this is NEWLY_ACQUIRED instead —
        // the focused service unit test deterministically covers both age/phase branches.)
        source.verified("SPY", rawLast(756.19));
        MvcResult r = postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        JsonNode res0 = json(r).get("results").get(0);
        String outcome = res0.get("outcome").asText();
        if (outcome.equals("REUSED")) {
            assertThat(res0.get("observation").get("observationId").asText()).isEqualTo(firstObs);
            assertThat(source.batchCount()).isEqualTo(batchesAfterFirst); // no new upstream call
        } else {
            assertThat(outcome).isEqualTo("NEWLY_ACQUIRED");
        }
    }

    // --- Request-wide errors ------------------------------------------------------------

    @Test
    @DisplayName("Specimen 14: malformed JSON body is 400 MALFORMED_REQUEST, no provider work")
    void malformedRequest() throws Exception {
        MvcResult r = postQuotes(AUTH_FULL, null, "{ not json");
        assertThat(r.getResponse().getStatus()).isEqualTo(400);
        JsonNode p = json(r);
        assertThat(p.get("code").asText()).isEqualTo("MALFORMED_REQUEST");
        assertThat(p.get("type").asText()).isEqualTo("urn:wheelwright:problem:malformed_request");
        assertThat(r.getResponse().getContentType()).contains("application/problem+json");
        assertThat(source.batchCount()).isZero();
    }

    @Test
    @DisplayName("Specimen 14b: invalid subject cardinality/shape/mode is 422 INVALID_REQUEST")
    void invalidSubjectShape() throws Exception {
        // empty subjects
        MvcResult empty = postQuotes(AUTH_FULL, null, "{\"subjects\":[]}");
        assertThat(empty.getResponse().getStatus()).isEqualTo(422);
        assertThat(json(empty).get("code").asText()).isEqualTo("INVALID_REQUEST");

        // malformed symbol
        MvcResult bad = postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"has space\"}]}");
        assertThat(bad.getResponse().getStatus()).isEqualTo(422);

        // unknown mode value => malformed JSON (enum parse failure) => 400
        MvcResult badMode = postQuotes(AUTH_FULL, null,
            "{\"subjects\":[{\"symbol\":\"SPY\"}],\"mode\":\"SUPER\"}");
        assertThat(badMode.getResponse().getStatus()).isEqualTo(400);
        assertThat(source.batchCount()).isZero();
    }

    @Test
    @DisplayName("Unknown request property is rejected (no silent policy assumption)")
    void unknownPropertyRejected() throws Exception {
        MvcResult r = postQuotes(AUTH_FULL, null,
            "{\"subjects\":[{\"symbol\":\"SPY\"}],\"ttl\":30}");
        assertThat(r.getResponse().getStatus()).isEqualTo(400);
        assertThat(source.batchCount()).isZero();
    }

    @Test
    @DisplayName("Specimen 18: duplicate canonical subject is 422 after case normalization, no provider work")
    void duplicateCanonicalSubject() throws Exception {
        MvcResult r = postQuotes(AUTH_FULL, null,
            "{\"subjects\":[{\"symbol\":\"spy\"},{\"symbol\":\"SPY\"}]}");
        assertThat(r.getResponse().getStatus()).isEqualTo(422);
        assertThat(json(r).get("code").asText()).isEqualTo("INVALID_REQUEST");
        assertThat(source.batchCount()).isZero();
    }

    @Test
    @DisplayName("31 subjects exceeds the 30-subject bound => 422")
    void tooManySubjects() throws Exception {
        StringBuilder sb = new StringBuilder("{\"subjects\":[");
        for (int i = 0; i < 31; i++) {
            if (i > 0) sb.append(',');
            sb.append("{\"symbol\":\"S").append(i).append("\"}");
        }
        sb.append("]}");
        MvcResult r = postQuotes(AUTH_FULL, null, sb.toString());
        assertThat(r.getResponse().getStatus()).isEqualTo(422);
        assertThat(source.batchCount()).isZero();
    }

    @Test
    @DisplayName("Specimen 15 + 31: unauthenticated is 401, no provider work")
    void unauthenticated() throws Exception {
        MvcResult r = postQuotes(null, null, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        assertThat(r.getResponse().getStatus()).isEqualTo(401);
        assertThat(json(r).get("code").asText()).isEqualTo("UNAUTHENTICATED");
        assertThat(source.batchCount()).isZero();

        MvcResult bad = postQuotes("Bearer nope", null, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        assertThat(bad.getResponse().getStatus()).isEqualTo(401);
        assertThat(source.batchCount()).isZero();
    }

    @Test
    @DisplayName("Specimen 16 + 31: caller lacking quote.acquire is 403, no provider work")
    void unauthorized() throws Exception {
        MvcResult r = postQuotes(AUTH_NO_GRANT, null, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        assertThat(r.getResponse().getStatus()).isEqualTo(403);
        assertThat(json(r).get("code").asText()).isEqualTo("FORBIDDEN");
        assertThat(source.batchCount()).isZero();
    }

    @Test
    @DisplayName("Specimen 30: FORCE without quote.force is 403, no provider work")
    void forceRequiresForceGrant() throws Exception {
        MvcResult r = postQuotes(AUTH_ACQUIRE_ONLY, null,
            "{\"subjects\":[{\"symbol\":\"SPY\"}],\"mode\":\"FORCE\"}");
        assertThat(r.getResponse().getStatus()).isEqualTo(403);
        assertThat(json(r).get("code").asText()).isEqualTo("FORBIDDEN");
        assertThat(source.batchCount()).isZero();

        // ... but ORDINARY with quote.acquire alone is permitted.
        source.verified("SPY", rawLast(756.19));
        MvcResult ok = postQuotes(AUTH_ACQUIRE_ONLY, null, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        assertThat(ok.getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("Unsupported media type is 415, no provider work")
    void unsupportedMediaType() throws Exception {
        MvcResult r = mockMvc.perform(post("/v2/quotes")
                .header("Authorization", AUTH_FULL)
                .contentType(MediaType.TEXT_PLAIN)
                .content("{\"subjects\":[{\"symbol\":\"SPY\"}]}"))
            .andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(415);
        assertThat(json(r).get("code").asText()).isEqualTo("UNSUPPORTED_MEDIA_TYPE");
        assertThat(source.batchCount()).isZero();
    }

    // --- X-Request-Id (specimens 27-29) -------------------------------------------------

    @Test
    @DisplayName("Specimen 27: a valid supplied X-Request-Id is echoed")
    void validRequestIdEchoed() throws Exception {
        source.verified("SPY", rawLast(1.0));
        String id = UUID.randomUUID().toString();
        MvcResult r = postQuotes(AUTH_FULL, id, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        assertThat(json(r).get("requestId").asText()).isEqualTo(id);
        assertThat(r.getResponse().getHeader("X-Request-Id")).isEqualTo(id);
    }

    @Test
    @DisplayName("Specimen 28: an absent X-Request-Id is generated (valid UUID)")
    void generatedRequestId() throws Exception {
        source.verified("SPY", rawLast(1.0));
        MvcResult r = postQuotes(AUTH_FULL, null, "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        String id = json(r).get("requestId").asText();
        assertThat(UUID.fromString(id).toString()).isEqualTo(id); // parses as canonical UUID
        assertThat(r.getResponse().getHeader("X-Request-Id")).isEqualTo(id);
    }

    @Test
    @DisplayName("Specimen 29: an invalid supplied X-Request-Id is 422 INVALID_REQUEST")
    void invalidRequestId() throws Exception {
        MvcResult r = postQuotes(AUTH_FULL, "not-a-uuid", "{\"subjects\":[{\"symbol\":\"SPY\"}]}");
        assertThat(r.getResponse().getStatus()).isEqualTo(422);
        assertThat(json(r).get("code").asText()).isEqualTo("INVALID_REQUEST");
        // A fresh valid correlation id is still present on the error.
        assertThat(UUID.fromString(json(r).get("requestId").asText())).isNotNull();
        assertThat(source.batchCount()).isZero();
    }

    // --- raw-quote fact builders --------------------------------------------------------

    private static DirectQuoteSource.RawQuote rawLast(double last) {
        return new DirectQuoteSource.RawQuote(
            ResolvedSubject.SecurityType.ETF, "desc", "ARCA",
            last, 100L, "2026-10-05T14:30:00Z",
            null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null);
    }

    private static DirectQuoteSource.RawQuote rawBidOnly(double bid) {
        return new DirectQuoteSource.RawQuote(
            ResolvedSubject.SecurityType.ETF, "desc", "ARCA",
            null, null, null,
            bid, 10L, "N", "2026-10-05T14:30:00Z",
            null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null);
    }

    private static DirectQuoteSource.RawQuote rawPrevCloseOnly(double prevClose) {
        return new DirectQuoteSource.RawQuote(
            ResolvedSubject.SecurityType.ETF, "desc", "ARCA",
            null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, prevClose, 1000L, 0.5, 0.5, 2000L, 120.0, 80.0);
    }
}
