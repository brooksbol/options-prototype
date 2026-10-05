package com.wheelwright.evidence.v2;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Backend-owned configurable direct-quote acquisition policy (contract §11, Doc 76 §22).
 *
 * <p>These are the ONLY configurable acquisition-policy parameters in this slice. They
 * change fulfillment decisions, never observation facts, authority fencing, failure truth,
 * or downstream admissibility. The only request-level semantic override is {@code FORCE};
 * no request field changes these settings.
 *
 * <p>Product defaults (overridable by deployment/operator configuration):
 * <ul>
 *   <li>active-session maximum successful-upstream-contact age: 60 seconds;</li>
 *   <li>latest-completed-session reuse: enabled;</li>
 *   <li>explicit off-hours provider contact: enabled.</li>
 * </ul>
 *
 * <p>Setting the active contact age to zero disables positive-age reuse. Disabling
 * off-hours contact also prevents a {@code FORCE} upstream attempt when the market is closed
 * (contract §13, §14): there is no separate request override of the contact restriction.
 */
@Component
public class QuoteAcquisitionPolicy {

    private final long activeContactAgeSeconds;
    private final boolean completedSessionReuseEnabled;
    private final boolean offHoursContactEnabled;

    public QuoteAcquisitionPolicy(
            @Value("${wheelwright.v2.quote.active-contact-age-seconds:60}") long activeContactAgeSeconds,
            @Value("${wheelwright.v2.quote.completed-session-reuse-enabled:true}") boolean completedSessionReuseEnabled,
            @Value("${wheelwright.v2.quote.off-hours-contact-enabled:true}") boolean offHoursContactEnabled) {
        this.activeContactAgeSeconds = Math.max(0, activeContactAgeSeconds);
        this.completedSessionReuseEnabled = completedSessionReuseEnabled;
        this.offHoursContactEnabled = offHoursContactEnabled;
    }

    public long activeContactAgeSeconds() {
        return activeContactAgeSeconds;
    }

    public boolean completedSessionReuseEnabled() {
        return completedSessionReuseEnabled;
    }

    public boolean offHoursContactEnabled() {
        return offHoursContactEnabled;
    }
}
