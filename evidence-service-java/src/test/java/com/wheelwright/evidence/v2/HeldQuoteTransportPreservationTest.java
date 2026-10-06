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
class HeldQuoteTransportPreservationTest {
    @Configuration(proxyBeanMethods = false)
    @EnableAutoConfiguration
    @Import({GovernedDecisionController.class, HeldQuotesController.class, SubjectProbe.class})
    static class Fixture {
        @Bean SqliteEvidenceStore store() { return mock(SqliteEvidenceStore.class); }
        @Bean BearerAuthenticator auth() { return new BearerAuthenticator("read=reader:quote.read"); }
        @Bean WebServerFactoryCustomizer<TomcatServletWebServerFactory> transport(
                @Value("${probe.passthrough:false}") boolean passthrough) {
            return factory -> {
                if (passthrough) factory.addConnectorCustomizers(
                        connector -> connector.setEncodedSolidusHandling("passthrough"));
            };
        }
    }
    @RestController
    static class SubjectProbe {
        // Routing probe only: no held-read runtime or endpoint-specific parsing workaround.
        @GetMapping("/v2/quotes/{symbol}")
        String symbol(@PathVariable String symbol) { return symbol; }
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
    @Test void encodedSolidusReachesOneSubjectAndDecodesExactlyOnce() throws Exception {
        try (var context = start(true)) {
            for (String encoded : new String[]{"BRK%2FB", "BRK%2fB", "A%2F%2FB", "A%2F.%2FB", "A%2F..%2FB"}) {
                var result = get(context, "/v2/quotes/" + encoded, false);
                assertThat(result.statusCode()).isEqualTo(200);
                assertThat(result.body()).isEqualTo(encoded.replace("%2F", "/").replace("%2f", "/"));
            }
            assertThat(get(context, "/v2/quotes/BRK%252FB", false).body()).isEqualTo("BRK%2FB");
        }
    }
    @Test void sharedPassthroughMustPreserveExistingRouteInterpretationAndSecurity() throws Exception {
        try (var baseline = start(false); var candidate = start(true)) {
            for (boolean authenticated : new boolean[]{false, true}) {
                for (String path : new String[]{"/v2/quotes"}) {
                    assertThat(get(candidate, path, authenticated).statusCode())
                            .as("existing held collection route %s, authenticated=%s", path, authenticated)
                            .isEqualTo(get(baseline, path, authenticated).statusCode());
                }
            }
            // Existing actual controller, not a simulated legacy route.
            String path = "/api/governed-decision/A%2FB";
            int original = get(baseline, path, false).statusCode();
            int changed = get(candidate, path, false).statusCode();
            var baselineStore = baseline.getBean(SqliteEvidenceStore.class);
            var candidateStore = candidate.getBean(SqliteEvidenceStore.class);
            verify(baselineStore, never()).getGovernedDecision(anyString());
            verify(candidateStore).getGovernedDecision("A/B");
            assertThat(changed).as("existing Decision route must retain baseline interpretation (baseline=%s)", original)
                    .isEqualTo(original);
            verify(candidateStore, never()).getGovernedDecision("A%2FB");
        }
    }
}
