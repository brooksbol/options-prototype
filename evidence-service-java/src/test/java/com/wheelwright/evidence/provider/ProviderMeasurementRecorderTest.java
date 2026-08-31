package com.wheelwright.evidence.provider;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

class ProviderMeasurementRecorderTest {

    @Test
    void recordsSameSequenceLifecycleForSuccessfulAndExceptionalTasks() throws Exception {
        RequestPacer pacer = new RequestPacer(1000, 10);
        try {
            assertEquals("ok", pacer.submit(() -> "ok"));
            assertThrows(Exception.class, () -> pacer.submit(() -> {
                throw new IllegalStateException("expected");
            }));

            var page = awaitEvents(pacer, 2);
            assertEquals(0, page.eventsDropped());
            assertEquals(0, page.recorderErrors());
            assertEquals(2, page.events().size());

            var success = page.events().get(0);
            assertEquals(1, success.sequence());
            assertTrue(success.success());
            assertNull(success.exceptionClass());
            assertNotNull(success.dequeuedAtMonotonicNs());
            assertNotNull(success.paceWaitStartNs());
            assertNotNull(success.paceWaitEndNs());
            assertNotNull(success.callableStartNs());
            assertNotNull(success.callableCompleteNs());
            assertTrue(success.enqueuedAtMonotonicNs() <= success.dequeuedAtMonotonicNs());
            assertTrue(success.dequeuedAtMonotonicNs() <= success.paceWaitStartNs());
            assertTrue(success.paceWaitStartNs() <= success.paceWaitEndNs());
            assertTrue(success.paceWaitEndNs() <= success.callableStartNs());
            assertTrue(success.callableStartNs() <= success.callableCompleteNs());

            var failure = page.events().get(1);
            assertEquals(2, failure.sequence());
            assertFalse(failure.success());
            assertEquals(IllegalStateException.class.getName(), failure.exceptionClass());
            assertNotNull(failure.callableCompleteNs());
        } finally {
            pacer.shutdown();
        }
    }

    @Test
    void appliesCursorAndReportsBoundedRetentionLoss() throws Exception {
        var recorder = new ProviderMeasurementRecorder(2);
        RequestPacer pacer = new RequestPacer(1000, 10, recorder);
        try {
            pacer.submit(() -> 1);
            pacer.submit(() -> 2);
            pacer.submit(() -> 3);

            var page = awaitEvents(pacer, 2);
            assertEquals(1, page.eventsDropped());
            assertEquals(2L, page.oldestRetainedSequence());
            assertEquals(3L, page.newestRetainedSequence());
            assertEquals(List.of(2L, 3L), page.events().stream().map(e -> e.sequence()).toList());

            var afterTwo = pacer.getMeasurementEvents(2, 100);
            assertEquals(1, afterTwo.events().size());
            assertEquals(3, afterTwo.events().get(0).sequence());
        } finally {
            pacer.shutdown();
        }
    }

    @Test
    void recordsHttpTimingStatusEndpointClassAndRawRateLimitHeadersWithoutSecrets() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/markets/options/expirations", exchange -> {
            byte[] body = "{\"expirations\":{\"date\":[\"2026-09-18\"]}}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("X-Ratelimit-Allowed", "120");
            exchange.getResponseHeaders().add("X-Ratelimit-Used", "41");
            exchange.getResponseHeaders().add("X-Ratelimit-Available", "79");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();

        RequestPacer pacer = new RequestPacer(1000, 10);
        try {
            String baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
            TradierAdapter adapter = new TradierAdapter("test-secret", baseUrl, new ResponseCache(), pacer);
            adapter.getExpirations("SPY");

            var event = awaitEvents(pacer, 1).events().get(0);
            assertEquals("expirations", event.endpointClass());
            assertEquals(200, event.httpStatus());
            assertNotNull(event.httpStartNs());
            assertNotNull(event.httpCompleteNs());
            assertTrue(event.httpStartNs() <= event.httpCompleteNs());
            assertEquals("120", header(event, "x-ratelimit-allowed"));
            assertEquals("41", header(event, "x-ratelimit-used"));
            assertEquals("79", header(event, "x-ratelimit-available"));
            assertFalse(event.toString().contains("test-secret"));
            assertFalse(event.toString().contains("Authorization"));
            assertFalse(event.toString().contains("SPY"));
        } finally {
            pacer.shutdown();
            server.stop(0);
        }
    }

    private static String header(ProviderMeasurementRecorder.ProviderMeasurementEvent event, String name) {
        return event.rateLimitHeaders().entrySet().stream()
            .filter(e -> e.getKey().equalsIgnoreCase(name))
            .flatMap(e -> e.getValue().stream())
            .findFirst().orElse(null);
    }

    private static ProviderMeasurementRecorder.MeasurementPage awaitEvents(RequestPacer pacer, int count)
            throws InterruptedException {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(2);
        ProviderMeasurementRecorder.MeasurementPage page;
        do {
            page = pacer.getMeasurementEvents(0, 100);
            if (page.events().size() >= count) return page;
            Thread.sleep(5);
        } while (System.nanoTime() < deadline);
        fail("timed out waiting for " + count + " measurement events");
        return page;
    }
}
