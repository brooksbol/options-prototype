package com.wheelwright.evidence;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * StatusController must report the TRUE runtime provider profile derived from the base-url,
 * never a hardcoded label. Durable consumers (opportunity-history provenance) depend on this
 * being truthful — we must not persist environment="sandbox" while running Production.
 */
class StatusEnvironmentTest {

    @Test
    void productionBaseUrlYieldsProduction() {
        assertEquals("production", StatusController.deriveEnvironment("https://api.tradier.com/v1"));
    }

    @Test
    void sandboxBaseUrlYieldsSandbox() {
        assertEquals("sandbox", StatusController.deriveEnvironment("https://sandbox.tradier.com/v1"));
    }

    @Test
    void unknownBaseUrlYieldsUnknown() {
        assertEquals("unknown", StatusController.deriveEnvironment("https://example.com/v1"));
        assertEquals("unknown", StatusController.deriveEnvironment(null));
    }

    @Test
    void caseInsensitive() {
        assertEquals("production", StatusController.deriveEnvironment("HTTPS://API.TRADIER.COM/v1"));
    }
}
