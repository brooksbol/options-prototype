package com.wheelwright.evidence.v2;
import org.junit.jupiter.api.Test;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.JSON;
import static org.assertj.core.api.Assertions.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.mockito.Mockito.*;
import org.springframework.http.*;

class QuoteLiquidityTest {
    @Test void exactPriceUnitsMissingSidesAndNonSimultaneousClocksRemainQualified() throws Exception {
        var source=JSON.readTree("{\"facts\":{\"bid\":{\"price\":1.00000000000000000001},\"ask\":{\"price\":1.00000000000000000003}}}");
        var result=QuoteLiquidityMeasurements.assess(source,"request");
        assertThat(result.at("/measurements/observedSideDifference/value").decimalValue()).isEqualByComparingTo("0.00000000000000000002");
        assertThat(result.path("currentness").asText()).isEqualTo("NOT_ESTABLISHED");
        assertThat(result.path("sideTimeBasis").asText()).isEqualTo("ALIGNMENT_NOT_ESTABLISHED");
        assertThat(result.at("/measurements/observedSideDifference/unit").asText()).isEqualTo("SOURCE_PRICE_UNIT");
        for(String facts:new String[]{"{}","{\"bid\":{\"price\":2},\"ask\":{\"price\":1}}"})
            assertThat(QuoteLiquidityMeasurements.assess(JSON.readTree("{\"facts\":"+facts+"}"),"r").at("/measurements/observedSideDifference/value").isNull()).isTrue();
    }
    @Test void percentFormulaZeroMidpointAndSourceClocksRemainExplicit() throws Exception {
        var source=JSON.readTree("{\"facts\":{\"bid\":{\"price\":99,\"sourceEventAt\":\"2026-10-06T12:00:00Z\"},\"ask\":{\"price\":101,\"sourceEventAt\":\"2026-10-06T12:00:00Z\"}}}");
        var result=QuoteLiquidityMeasurements.assess(source,"request");
        assertThat(result.at("/measurements/relativeSideDifference/value").decimalValue()).isEqualByComparingTo("2");
        assertThat(result.path("sideTimeBasis").asText()).isEqualTo("SAME_RECORDED_SOURCE_INSTANT");
        assertThat(result.path("source")).isEqualTo(source);
        var zero=QuoteLiquidityMeasurements.assess(JSON.readTree("{\"facts\":{\"bid\":{\"price\":0},\"ask\":{\"price\":0}}}"),"r");
        assertThat(zero.at("/measurements/relativeSideDifference/value").isNull()).isTrue();
        assertThat(zero.at("/measurements/observedSideDifference/value").decimalValue()).isEqualByComparingTo("0");
    }
    @Test void failedMeasurementSerializationUsesSafeCorrelatedProblem() throws Exception {
        var held=mock(HeldQuotesController.class);
        when(held.show(anyString(),any(),any())).thenReturn(ResponseEntity.ok().header("X-Request-Id","correlation").body("invalid PRIVATE-ERROR-CANARY"));
        var mvc=MockMvcBuilders.standaloneSetup(new QuoteLiquidityController(held)).build();
        var response=mvc.perform(get("/v2/quotes/SPY/liquidity")).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(500);
        assertThat(response.getHeader("X-Request-Id")).isEqualTo("correlation");
        assertThat(response.getContentAsString()).contains("INTERNAL_ERROR").doesNotContain("PRIVATE-ERROR-CANARY");
    }
    @Test void inheritedReadDenialAndCorrelationSurviveSubresource() throws Exception {
        var held=mock(HeldQuotesController.class);
        when(held.show(anyString(),any(),any())).thenReturn(ResponseEntity.status(403).header("X-Request-Id","correlation").body("{\"code\":\"FORBIDDEN\"}"));
        var mvc=MockMvcBuilders.standaloneSetup(new QuoteLiquidityController(held)).build();
        var response=mvc.perform(get("/v2/quotes/SPY/liquidity")).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(403);assertThat(response.getHeader("X-Request-Id")).isEqualTo("correlation");
    }
}
