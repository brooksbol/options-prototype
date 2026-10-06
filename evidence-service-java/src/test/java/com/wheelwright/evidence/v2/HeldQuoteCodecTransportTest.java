package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.GovernedDecisionController;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/** Real installed Tomcat/Spring transport gate. No provider, database or worker starts. */
class HeldQuoteCodecTransportTest {
    @Configuration(proxyBeanMethods = false)
    @EnableAutoConfiguration
    @Import({GovernedDecisionController.class, HeldQuotesController.class})
    static class Fixture {
        @Bean SqliteEvidenceStore store() { return mock(SqliteEvidenceStore.class); }
        @Bean BearerAuthenticator auth() { return new BearerAuthenticator("read=reader:quote.read"); }
        @Bean WebServerFactoryCustomizer<TomcatServletWebServerFactory> transport(
                @Value("${probe.passthrough:false}") boolean passthrough) {
            return factory -> {
                factory.addConnectorCustomizers(connector -> org.assertj.core.api.Assertions.assertThat(connector.getEncodedSolidusHandling()).isEqualTo("reject"));
            };
        }
    }
    private ServletWebServerApplicationContext start(boolean passthrough) {
        SpringApplication app = new SpringApplication(Fixture.class);
        app.setDefaultProperties(Map.of("server.port", "0", "probe.passthrough", passthrough,
                "spring.main.banner-mode", "off", "logging.level.root", "ERROR"));
        return (ServletWebServerApplicationContext) app.run();
    }
    private HttpResponse<String> get(ServletWebServerApplicationContext context, String path,
                                     boolean authenticated) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:"
                + context.getWebServer().getPort() + path)).GET();
        if (authenticated) builder.header("Authorization", "Bearer read");
        return HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }
    @Test void canonicalTokensBindExactlyOnceUnderUnchangedContainerDefaults() throws Exception {
        try (var context = start(false)) {
            var store = context.getBean(SqliteEvidenceStore.class);
            var json = new com.fasterxml.jackson.databind.ObjectMapper();
            for (String symbol : new String[]{"SPY", "BRK/B", "BRK_2FB", "^SPX", "A/./B", "A/../B", "A//B"}) {
                when(store.readHeldDirectQuote(symbol)).thenReturn(java.util.Optional.of(HeldQuoteFixtures.row(symbol,HeldQuoteFixtures.FACTS)));
                var result = get(context, "/v2/quotes/" + PathSymbolCodec.encode(symbol), true);
                assertThat(result.statusCode()).isEqualTo(200);
                assertThat(json.readTree(result.body()).path("subject").path("symbol").asText()).isEqualTo(symbol);
                assertThat(result.headers().firstValue("Cache-Control")).contains("private, no-store");
                verify(store).readHeldDirectQuote(symbol);
            }
            clearInvocations(store);
            for (String token : new String[]{"spy", "BRK_", "BRK_2", "BRK_2fB", "BRK_41", "BRK_2E", "BRK_25"})
                assertThat(get(context, "/v2/quotes/" + token, true).statusCode()).isEqualTo(422);
            assertThat(get(context, "/v2/quotes/BRK_", false).statusCode()).isEqualTo(401);
            assertThat(get(context, "/v2/quotes/BRK%2FB", true).statusCode()).isEqualTo(400);
            assertThat(get(context, "/v2/quotes/BRK%252FB", true).statusCode()).isEqualTo(422);
            assertThat(get(context, "/api/governed-decision/A%2FB", false).statusCode()).isEqualTo(400);
            verifyNoInteractions(store);
            assertThat(get(context, "/api/governed-decision/A_2FB", false).statusCode()).isEqualTo(404);
            verify(store).getGovernedDecision("A_2FB");
            assertThat(get(context, "/v2/quotes", false).statusCode()).isEqualTo(401);
            assertThat(get(context, "/v2/quotes", true).statusCode()).isEqualTo(200);
            assertThat(get(context, "/v2/quotes?symbol=SPY", true).statusCode()).isEqualTo(422);
        }
    }
}
