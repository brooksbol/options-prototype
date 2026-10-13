package com.wheelwright.evidence.v2;

import org.junit.jupiter.api.*;
import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;

/**
 * Verifies the interim tastytrade market-metrics read capability: parse-field
 * discipline (nullable, distinct methodologies, verbatim timestamp) and the
 * hardened client read (OAuth → metrics GET, secret-exclusion, symbol validation).
 * Uses a minimal raw-socket fake provider so no live tastytrade call is made.
 */
class MarketMetricsTest {

    // One EEM-shaped item mirroring the real /market-metrics response (0..1 scale,
    // two distinct methodology ranks, verbatim timestamp). A string-valued numeric
    // field is included to prove numeric-string coercion.
    private static final String BODY = """
        {"data":{"items":[
          {"symbol":"EEM",
           "implied-volatility-index-rank":0.316503391,
           "implied-volatility-index-rank-source":"tos",
           "tos-implied-volatility-index-rank":0.316503391,
           "tw-implied-volatility-index-rank":0.280560062,
           "implied-volatility-percentile":0.384341138,
           "implied-volatility-index":0.235869601,
           "historical-volatility-30-day":"21.83",
           "iv-hv-30-day-difference":1.81,
           "implied-volatility-updated-at":"2026-10-12T16:23:35.773Z"},
          {"symbol":"XLE",
           "implied-volatility-index-rank":0.0,
           "implied-volatility-index-rank-source":"tw",
           "tw-implied-volatility-index-rank":0.0}
        ]}}
        """;

    @Test
    void parsePreservesNullabilityDistinctMethodologiesAndVerbatimTimestamp() throws Exception {
        List<MarketMetrics> parsed = MarketMetrics.parse(BODY.getBytes(StandardCharsets.UTF_8));
        assertThat(parsed).hasSize(2);

        MarketMetrics eem = parsed.get(0);
        assertThat(eem.symbol()).isEqualTo("EEM");
        assertThat(eem.ivRank()).isEqualTo(0.316503391);
        assertThat(eem.ivRankSource()).isEqualTo("tos");
        // Distinct methodologies are NOT collapsed or averaged.
        assertThat(eem.ivRankTos()).isEqualTo(0.316503391);
        assertThat(eem.ivRankTw()).isEqualTo(0.280560062);
        assertThat(eem.ivRankTos()).isNotEqualTo(eem.ivRankTw());
        assertThat(eem.ivPercentile()).isEqualTo(0.384341138);
        assertThat(eem.ivIndex()).isEqualTo(0.235869601);
        // Numeric string coerced to Double.
        assertThat(eem.historicalVolatility30()).isEqualTo(21.83);
        assertThat(eem.ivHv30Difference()).isEqualTo(1.81);
        // Timestamp preserved verbatim (no normalization / no appended Z).
        assertThat(eem.ivUpdatedAt()).isEqualTo("2026-10-12T16:23:35.773Z");

        MarketMetrics xle = parsed.get(1);
        // Provider exact 0.0 is preserved as 0.0 (data), never promoted to absence.
        assertThat(xle.ivRank()).isEqualTo(0.0);
        assertThat(xle.ivRankTw()).isEqualTo(0.0);
        // Absent fields are null, never fabricated as 0.
        assertThat(xle.ivRankTos()).isNull();
        assertThat(xle.ivPercentile()).isNull();
        assertThat(xle.ivIndex()).isNull();
        assertThat(xle.historicalVolatility30()).isNull();
        assertThat(xle.ivHv30Difference()).isNull();
        assertThat(xle.ivUpdatedAt()).isNull();
    }

    @Test
    void parseEmptyOrShapelessBodyYieldsNoItems() throws Exception {
        assertThat(MarketMetrics.parse("{}".getBytes(StandardCharsets.UTF_8))).isEmpty();
        assertThat(MarketMetrics.parse("{\"data\":{\"items\":[]}}".getBytes(StandardCharsets.UTF_8))).isEmpty();
    }

    @Test
    void clientRejectsMalformedSymbolsWithoutCallingProvider() throws Exception {
        try (var provider = new FakeProvider(BODY); var http = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build()) {
            var client = provider.client(http);
            assertThatThrownBy(() -> client.marketMetrics(List.of("eem"))) // lowercase invalid
                    .hasMessage("market-metrics acquisition unavailable");
            assertThatThrownBy(() -> client.marketMetrics(List.of("A B"))) // space invalid
                    .hasMessage("market-metrics acquisition unavailable");
            assertThatThrownBy(() -> client.marketMetrics(List.of()))
                    .hasMessage("market-metrics acquisition unavailable");
            assertThat(provider.metricsRequests.get()).isZero();
        }
    }

    @Test
    void clientFetchesMetricsThroughOauthAndParses() throws Exception {
        try (var provider = new FakeProvider(BODY); var http = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build()) {
            byte[] body = provider.client(http).marketMetrics(List.of("EEM", "XLE"));
            List<MarketMetrics> parsed = MarketMetrics.parse(body);
            assertThat(parsed).extracting(MarketMetrics::symbol).containsExactly("EEM", "XLE");
            assertThat(provider.metricsRequests.get()).isEqualTo(1);
        }
    }

    @Test
    void clientRejectsResponseContainingASecret() throws Exception {
        // Response echoes the refresh token → secret-exclusion screen must reject it.
        String leak = "{\"data\":{\"items\":[{\"symbol\":\"EEM\",\"note\":\"fake-refresh-never-publish\"}]}}";
        try (var provider = new FakeProvider(leak); var http = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build()) {
            assertThatThrownBy(() -> provider.client(http).marketMetrics(List.of("EEM")))
                    .hasMessage("market-metrics acquisition unavailable");
        }
    }

    /** Minimal raw-socket provider: 200 JSON for OAuth and /market-metrics. */
    static class FakeProvider implements AutoCloseable {
        final ServerSocket listener = new ServerSocket(0, 50, InetAddress.getLoopbackAddress());
        final ExecutorService workers = Executors.newCachedThreadPool();
        final java.util.concurrent.atomic.AtomicInteger metricsRequests = new java.util.concurrent.atomic.AtomicInteger();
        final byte[] metricsBody;
        FakeProvider(String body) throws IOException {
            this.metricsBody = body.getBytes(StandardCharsets.UTF_8);
            workers.submit(() -> { while (!listener.isClosed()) try { var s = listener.accept(); workers.submit(() -> serve(s)); } catch (IOException ignored) {} });
        }
        URI base() { return URI.create("http://localhost:" + listener.getLocalPort()); }
        TastytradeClient client(HttpClient http) {
            return new TastytradeClient("fake-client-id", "fake-client-secret-never-publish", "fake-refresh-never-publish", base(), http, Duration.ofSeconds(5));
        }
        void serve(Socket socket) {
            try (socket) {
                socket.setSoTimeout(4000);
                var in = socket.getInputStream(); var out = socket.getOutputStream();
                var header = new ByteArrayOutputStream(); int ch;
                while ((ch = in.read()) != -1) { header.write(ch); if (header.toString(StandardCharsets.US_ASCII).endsWith("\r\n\r\n")) break; }
                String request = header.toString(StandardCharsets.US_ASCII);
                for (String line : request.split("\r\n")) if (line.toLowerCase().startsWith("content-length:")) in.readNBytes(Integer.parseInt(line.substring(15).trim()));
                boolean oauth = request.startsWith("POST /oauth/token ");
                if (!oauth) metricsRequests.incrementAndGet();
                byte[] body = oauth ? "{\"access_token\":\"fake-access-never-publish\"}".getBytes(StandardCharsets.UTF_8) : metricsBody;
                out.write(("HTTP/1.1 200 OK\r\nConnection: close\r\nContent-Type: application/json\r\nContent-Length: " + body.length + "\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
                out.write(body); out.flush();
            } catch (Throwable ignored) {}
        }
        public void close() throws Exception { listener.close(); workers.shutdownNow(); workers.awaitTermination(5, TimeUnit.SECONDS); }
    }
}
