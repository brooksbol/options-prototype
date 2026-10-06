package com.wheelwright.evidence.v2;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;
class StrictHeldQuoteDecoderTest {
    @Test void completeFactsRetainPrecisionAndIdentity() throws Exception {
        var q=StrictHeldQuoteDecoder.decode(HeldQuoteFixtures.row("SPY",HeldQuoteFixtures.FACTS),"SPY");
        assertThat(q.path("facts").path("volume").bigIntegerValue().toString()).isEqualTo("9007199254740993");
        assertThat(q.path("facts").path("last").path("sourceEventAt").asText()).endsWith("123456789123Z");
        assertThat(q.path("facts").path("bid").path("venue").asText()).isEmpty();
        assertThat(new ObjectMapper().writeValueAsString(q)).contains("671.20");
    }
    @Test void requiredPresentOptionalTypesShapesDomainsAndTimestampsAreStrict() throws Exception {
        String[] invalid={"null","[]","{}","{\"previousClose\":1}","{\"last\":{\"price\":0}}","{\"last\":1}","{\"last\":{\"size\":1}}",
            "{\"last\":{\"price\":\"1\"}}","{\"last\":{\"price\":-1}}","{\"last\":{\"price\":1,\"size\":1.5}}",
            "{\"last\":{\"price\":1,\"sourceEventAt\":\"prevclose\"}}","{\"bid\":{\"price\":1,\"venue\":false}}",
            "{\"open\":1,\"volume\":null}","{\"open\":1,\"volume\":-1}","{\"open\":1,\"reportedChange\":\"1\"}",
            "{\"open\":1,\"description\":0}","{\"open\":1,\"close\":null}","{\"open\":1,\"open\":2}","{\"open\":1} {}",
            "{\"open\":1,\"last\":{\"price\":1,\"sourceEventAt\":\"2001-02-29T00:00:00Z\"}}"};
        for(String facts:invalid)assertThatThrownBy(()->StrictHeldQuoteDecoder.decode(HeldQuoteFixtures.row("SPY",facts),"SPY")).as(facts).isInstanceOf(Exception.class);
        assertThatThrownBy(()->StrictHeldQuoteDecoder.decode(HeldQuoteFixtures.row("SPY",HeldQuoteFixtures.FACTS),"QQQ")).isInstanceOf(Exception.class);
        for(String facts:new String[]{"{\"open\":1,\"volume\":1.0}","{\"bid\":{\"price\":0},\"open\":1}","{\"open\":1,\"description\":\"\",\"future\":{\"value\":null}}"})
            assertThat(StrictHeldQuoteDecoder.decode(HeldQuoteFixtures.row("SPY",facts),"SPY")).isNotNull();
    }
}
