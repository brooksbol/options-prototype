package com.wheelwright.evidence.provider;

import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Owns the provider-availability lifecycle and the single active acquisition
 * authority (PL-PROV-FAILOVER Layer 1 control plane).
 *
 * Responsibilities established in this step (isolated authorities + fence epoch):
 *   - Hold a required production authority and an OPTIONAL sandbox authority.
 *   - Expose exactly ONE active authority at a time (invariant I4: single
 *     acquisition authority; multiple bindings may exist).
 *   - Maintain a monotonic fence epoch that every acquisition lease will bind to
 *     (used by step 3 fencing) and that an atomic authority transition increments.
 *
 * NOT wired to live transitions yet: {@link #activateDegraded()} /
 * {@link #activateProduction()} exist and are unit-tested, but the acquisition
 * worker does not yet call them and NO sandbox evidence may be written to the
 * durable plane until the atomic lease (step 3) + provenance/partitioning
 * (step 4) + provenance-bearing representation (step 5) are complete.
 */
public final class ProviderAuthorityManager {

    /**
     * Provider-availability lifecycle (working, non-ratified names —
     * see PL-PROV-FAILOVER). Distinct from Market Session state (orthogonal, I12).
     */
    public enum Lifecycle {
        /**
         * Startup state: production is the PREFERRED authority but its health has NOT been
         * established this process (PL-PROV-FAILOVER correction). Production is not trusted
         * merely because the process started or was trusted previously. The control plane
         * MUST validate it via representative probing — even while ordinary acquisition is
         * session-BLOCKED — before treating production as active. Never NORMAL.
         */
        PRODUCTION_UNVERIFIED,
        PRODUCTION_ACTIVE,
        DEGRADED_SANDBOX,
        PRODUCTION_PROBING,
        ACQUISITION_SUSPENDED
    }

    private final ProviderAuthority production;   // required
    private final ProviderAuthority sandbox;      // optional (null when no sandbox creds)

    /**
     * The active authority AND its fence epoch, held together as ONE immutable value in
     * ONE atomic reference (PL-PROV-FAILOVER atomicity correction). A lease reads this
     * single reference once, so it can never observe an inconsistent (authority, epoch)
     * pair — the exact race that two separate volatile reads permitted. Every authority
     * transition swaps the WHOLE binding atomically (new authority + incremented epoch
     * together), so a lease is either fully before or fully after a transition, never
     * torn across it.
     */
    private record Binding(ProviderAuthority authority, long epoch) {}

    private final AtomicReference<Binding> binding;
    private final AtomicReference<Lifecycle> lifecycle;

    /**
     * The production authority epoch for which a current, normalized production PRIMARY chain
     * has been durably committed — i.e. the epoch at which operational evidence restoration
     * actually completed. 0 means "no production-epoch primary chain has committed yet"
     * (PL-PROV-FAILOVER: authority recovery is NOT evidence restoration).
     *
     * <p>Why this exists: {@link #activateProduction()} flips the active authority (and the
     * operator MUST see failback happen automatically), but at that instant the newest durable
     * evidence is still whatever the prior degraded authority last wrote. Presenting NORMAL on
     * authority activation alone would falsely imply fresh production evidence exists (violating
     * I11 / I3). Evidence availability is therefore derived from BOTH the active authority AND
     * whether a primary chain has been committed under the CURRENT production epoch — the
     * restoration boundary Codex identified. A subsequent re-degrade (or a later failback to a
     * NEW epoch) leaves this pointing at an old epoch, so evidenceAvailability() correctly reads
     * DEGRADED again until fresh production evidence commits under the new epoch.
     *
     * <p>This is an in-memory derived signal (fact: "a current-epoch production primary chain
     * committed"), not new durable state — durable rows already carry environment + provenance
     * (migrations 005/006); this only remembers the epoch of the latest qualifying commit so
     * the trust projection can be derived without a query on the status hot path.
     *
     * <p><b>Initialized to 0 and NEVER seeded at construction.</b> An earlier version seeded
     * this to the initial epoch to make normal boot report NORMAL — but that asserted trust
     * (production evidence is current) as an unobserved construction-time assumption, which is
     * exactly false in tonight's target scenario (restart while production is 401 and the
     * session is BLOCKED). Restoration is established ONLY by an explicit, fresh, non-cache,
     * post-transition PRIMARY production commit under the current epoch (see
     * {@link #markProductionEvidenceRestored(long)}), never by process construction.
     */
    private final AtomicLong restoredProductionEpoch = new AtomicLong(0L);

    /**
     * Shared authoritative observer (PL-PROV-FAILOVER observer correction). The manager
     * owns it, binds it to every authority's pacer, and appends control events for
     * authority/fence transitions so an observer can reconstruct authority boundaries and
     * usable-evidence transitions. Never null after construction.
     */
    private final ObservationRecorder observer;

    public ProviderAuthorityManager(ProviderAuthority production, ProviderAuthority sandbox) {
        this(production, sandbox, new ObservationRecorder());
    }

    public ProviderAuthorityManager(ProviderAuthority production, ProviderAuthority sandbox,
                                    ObservationRecorder observer) {
        if (production == null) {
            throw new IllegalArgumentException("production authority is required");
        }
        this.production = production;
        this.sandbox = sandbox;
        this.observer = observer;
        this.binding = new AtomicReference<>(new Binding(production, 1L));
        // Start UNVERIFIED, not PRODUCTION_ACTIVE: production is the preferred authority but its
        // health is NOT established by construction. The control plane must validate it (even
        // while BLOCKED) before it is treated as active. restoredProductionEpoch stays 0 — no
        // production evidence is current until an explicit fresh primary commit says so.
        this.lifecycle = new AtomicReference<>(Lifecycle.PRODUCTION_UNVERIFIED);

        // Bind the shared observer to each authority's isolated pacer.
        production.bindObserver(observer);
        if (sandbox != null) {
            sandbox.bindObserver(observer);
        }
        observer.appendControl(ObservationRecorder.RecordType.AUTHORITY_TRANSITION,
            production.id(), currentEpoch(), null, "initial binding (production unverified)");
    }

    /**
     * Single-authority legacy/back-compat mode: start production ACTIVE and treat evidence as
     * settled at the initial epoch. This is used ONLY by the single-adapter, no-failover worker
     * constructor (the pre-failover deployment / existing tests), where there is no sandbox, no
     * epoch advancement, and no degraded-mode concept — so production-availability validation
     * does not apply and behavior must remain exactly as before failover existed.
     *
     * <p>The default (failover-aware) construction path deliberately starts
     * {@code PRODUCTION_UNVERIFIED} and never seeds restoration. This method is the ONLY place
     * startup trust is asserted, and it is confined to the single-authority mode where there is
     * no other authority to fail over to and no verification concept.
     */
    public synchronized void markSingleAuthorityActiveForLegacy() {
        lifecycle.set(Lifecycle.PRODUCTION_ACTIVE);
        restoredProductionEpoch.set(binding.get().epoch());
    }

    /** The shared authoritative observer (measurement plane). */
    public ObservationRecorder observer() { return observer; }

    /** A guarded mutation that may throw a checked SQLException. */
    @FunctionalInterface
    public interface GuardedMutation {
        void apply() throws java.sql.SQLException;
    }

    /** Authority-sensitive side effects that must run ONLY while the lease is still current. */
    @FunctionalInterface
    public interface CurrentAuthorityEffect {
        void run();
    }

    /**
     * Atomically commit ONE durable write IFF the lease is still current — validation, the
     * SQL mutation, AND all authority-sensitive post-SQL side effects run INSIDE the SAME
     * transition synchronization boundary (review-3 finding #5). Because authority transitions
     * are synchronized on this same monitor, a transition cannot interleave: once a transition
     * is effective, neither the durable write NOR any current-authority accounting (acquisition
     * totals, changed-symbol counts, publication-dirty flag, hysteresis reset) can be performed
     * by a stale lease.
     *
     * This is INTERMEDIATE: it records a {@code STORE_MUTATION_APPLIED} record correlated to
     * the lease's logical operation id — NOT a terminal verdict. Exactly one terminal outcome
     * is recorded separately via {@link #recordTerminalOutcome} at the end of the logical op.
     *
     * @param authoritySensitiveEffect side effects (e.g. counters) run only when current, under lock.
     * @return true if applied (lease current); false if fenced (nothing applied, no accounting).
     */
    public synchronized boolean commitIfCurrent(AcquisitionLease lease, String subject,
                                                String operationKind, GuardedMutation mutation,
                                                CurrentAuthorityEffect authoritySensitiveEffect)
            throws java.sql.SQLException {
        boolean current = lease != null && binding.get().epoch() == lease.fenceEpoch();
        if (!current) {
            // Fenced: no write, no accounting. The DISCARDED attempted write must NOT vanish
            // from the observer (review-4 #3) — emit an intermediate STORE_MUTATION_FENCED
            // correlated to the same logical operation + subject. (The terminal verdict is
            // recorded separately by the caller.)
            if (lease != null) {
                observer.recordStoreMutationFenced(lease.operationId(), lease.authorityId(),
                    lease.fenceEpoch(), subject, operationKind);
            }
            return false;
        }
        mutation.apply();
        if (authoritySensitiveEffect != null) authoritySensitiveEffect.run();
        observer.recordStoreMutation(lease.operationId(), lease.authorityId(),
            lease.fenceEpoch(), subject, operationKind);
        return true;
    }

    /**
     * Record the SINGLE terminal logical outcome for a lease's acquisition, correlated to its
     * logical operation id + subject. Called exactly once per lease after all its intermediate
     * store mutations. {@code committed} true = the normalized, fenced, durable PRIMARY chain
     * (usable evidence) was written under a current lease. Fenced/rejected are the other two
     * terminal states.
     */
    public void recordTerminalOutcome(AcquisitionLease lease, String subject,
                                      ObservationRecorder.LogicalOutcome outcome) {
        if (lease == null) return;
        observer.recordLogicalOutcome(lease.operationId(), lease.authorityId(),
            lease.fenceEpoch(), subject, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, outcome);
    }

    /**
     * Run a provider-unusable CONTROL-STATE mutation (the current authority's failure-streak
     * counters) ONLY IF the lease is still current — inside the transition synchronization
     * boundary (review-5 #1). A provider-unusable completion from a STALE authority (its epoch
     * superseded by a transition) must NOT pollute the NEW authority's failure streak or
     * trigger a spurious transition. The completion remains observable (the caller still
     * records the terminal PROVIDER_UNUSABLE); only the control-state accounting is fenced.
     *
     * @return true if the lease was current and the control mutation ran; false if stale.
     */
    public synchronized boolean signalProviderUnusableIfCurrent(AcquisitionLease lease,
                                                                Runnable controlMutation) {
        boolean current = lease != null && binding.get().epoch() == lease.fenceEpoch();
        if (current && controlMutation != null) controlMutation.run();
        return current;
    }

    /** The currently active acquisition authority (never null). */
    public ProviderAuthority active() {
        return binding.get().authority();
    }

    public Lifecycle lifecycle() {
        return lifecycle.get();
    }

    /** Current fence epoch. Every acquisition lease binds to this value. */
    public long currentEpoch() {
        return binding.get().epoch();
    }

    /** True if the given epoch is still the current authority epoch (step-3 fencing). */
    public boolean isCurrentEpoch(long epoch) {
        return binding.get().epoch() == epoch;
    }

    private final AtomicLong provenanceSeq = new AtomicLong(0);

    /**
     * Atomically acquire a lease for one acquisition operation. Captures the active
     * authority AND the current fence epoch from a SINGLE atomic read of the binding, so
     * the (authority, epoch) pair is always internally consistent — a concurrent
     * transition is either fully observed (new authority + new epoch) or not at all (old
     * authority + old epoch, which validate() will later reject). The provenance identity
     * is derived from that same consistent snapshot.
     */
    public AcquisitionLease acquireLease() {
        Binding b = binding.get();
        ProviderAuthority a = b.authority();
        long epoch = b.epoch();
        long seq = provenanceSeq.incrementAndGet();
        String provenanceId = a.environment() + ":" + epoch + ":" + seq;
        // operationId correlates the lease's logical outcome (committed/fenced/rejected)
        // back to the acquisition it authorized. Captured atomically with the binding.
        String operationId = "acq-" + a.id() + "-" + epoch + "-" + seq;
        return new AcquisitionLease(a.id(), a.environment(), epoch, provenanceId, operationId, a.adapter());
    }

    /**
     * Validate that a lease is still current: its fence epoch must equal the current
     * authority epoch. A stale lease (superseded by a transition) must not affect any
     * durable write, symbol lifecycle, publication, control decision, or externally
     * meaningful telemetry.
     */
    public boolean validate(AcquisitionLease lease) {
        return lease != null && binding.get().epoch() == lease.fenceEpoch();
    }

    /** Whether a sandbox authority exists (degraded mode is possible only if so). */
    public boolean hasSandbox() {
        return sandbox != null;
    }

    public ProviderAuthority production() { return production; }
    public ProviderAuthority sandboxOrNull() { return sandbox; }

    /**
     * Atomically switch the active authority to sandbox (degraded). Increments the
     * fence epoch so any in-flight production-authority result is fenced out.
     * No-op-safe: if already degraded, returns false. Throws if no sandbox exists.
     *
     * Control-plane state change only. Callers remain responsible for the
     * step-3/4/5 gate: this does not by itself authorize any durable sandbox write.
     */
    public synchronized boolean activateDegraded() {
        if (sandbox == null) {
            throw new IllegalStateException("cannot activate degraded: no sandbox authority");
        }
        Binding current = binding.get();
        if (current.authority() == sandbox) {
            return false;
        }
        // Swap authority + epoch together in one atomic set (inside the transition lock).
        long newEpoch = current.epoch() + 1;
        binding.set(new Binding(sandbox, newEpoch));
        lifecycle.set(Lifecycle.DEGRADED_SANDBOX);
        observer.appendControl(ObservationRecorder.RecordType.FENCE_ADVANCED,
            sandbox.id(), newEpoch, null, "activateDegraded: active authority -> sandbox");
        return true;
    }

    /** Move into the PRODUCTION_PROBING hysteresis state (still serving from sandbox). */
    public synchronized void enterProbing() {
        if (binding.get().authority() == sandbox && sandbox != null) {
            lifecycle.set(Lifecycle.PRODUCTION_PROBING);
        }
    }

    /** Fall back to DEGRADED_SANDBOX when a recovery streak breaks. */
    public synchronized void abandonProbing() {
        if (binding.get().authority() == sandbox && sandbox != null) {
            lifecycle.set(Lifecycle.DEGRADED_SANDBOX);
        }
    }

    /**
     * Atomically switch the active authority back to production (failback).
     * Increments the fence epoch so any in-flight sandbox result is fenced out.
     * No-op-safe: if already production, returns false.
     */
    public synchronized boolean activateProduction() {
        Binding current = binding.get();
        if (current.authority() == production) {
            lifecycle.set(Lifecycle.PRODUCTION_ACTIVE);
            return false;
        }
        long newEpoch = current.epoch() + 1;
        binding.set(new Binding(production, newEpoch));
        lifecycle.set(Lifecycle.PRODUCTION_ACTIVE);
        observer.appendControl(ObservationRecorder.RecordType.FENCE_ADVANCED,
            production.id(), newEpoch, null, "activateProduction: active authority -> production (failback)");
        return true;
    }

    /**
     * Mark that neither provider can currently supply usable evidence. Does not
     * change the active binding (there is nothing usable to bind to); it records
     * the honest availability state for status/health projection.
     */
    public synchronized void suspend() {
        lifecycle.set(Lifecycle.ACQUISITION_SUSPENDED);
    }

    /**
     * Record that a normalized production PRIMARY chain committed under a current production
     * lease — the operational-evidence restoration boundary. Called from the acquisition
     * commit path ONLY when the committing lease's environment is production and its fence
     * epoch is still current. Idempotent and monotonic-safe: it records the epoch at which
     * fresh production evidence exists, which {@link #evidenceAvailability()} compares against
     * the current epoch to decide NORMAL vs DEGRADED. Never called while degraded (sandbox
     * commits do not restore production evidence).
     */
    public void markProductionEvidenceRestored(long productionEpoch) {
        restoredProductionEpoch.set(productionEpoch);
    }

    /** Test/diagnostic accessor: the epoch at which current production evidence last committed. */
    public long restoredProductionEpoch() {
        return restoredProductionEpoch.get();
    }

    /**
     * True when the active authority is production AND a normalized production primary chain
     * has committed under the CURRENT authority epoch — i.e. operational evidence restoration
     * has completed, not merely authority recovery.
     */
    public boolean productionEvidenceCurrent() {
        Binding b = binding.get();
        return b.authority() == production
            && lifecycle.get() == Lifecycle.PRODUCTION_ACTIVE
            && restoredProductionEpoch.get() == b.epoch();
    }

    /**
     * Operator-facing evidence-availability projection (Layer 3 consumes this, not source).
     *
     * <p>PL-PROV-FAILOVER separation of authority from evidence fitness: PRODUCTION_ACTIVE
     * authority is NORMAL only once fresh production evidence has committed under the current
     * production epoch ({@link #productionEvidenceCurrent()}). Between an (automatic, possibly
     * overnight) failback and that first current-epoch production primary-chain commit, the
     * appliance is still serving the prior degraded/stale evidence, so the honest projection
     * is DEGRADED — authority recovered, evidence not yet. This prevents authority recovery
     * from falsely implying fresh production evidence exists (I11/I3).
     */
    public String evidenceAvailability() {
        return switch (lifecycle.get()) {
            case PRODUCTION_ACTIVE -> productionEvidenceCurrent() ? "NORMAL" : "DEGRADED";
            // UNVERIFIED: production preferred but not yet validated this process. It is NOT
            // NORMAL. If a sandbox exists we can operate degraded; otherwise nothing usable is
            // established yet → UNAVAILABLE. Never assert NORMAL from an unverified start.
            case PRODUCTION_UNVERIFIED -> hasSandbox() ? "DEGRADED" : "UNAVAILABLE";
            case DEGRADED_SANDBOX, PRODUCTION_PROBING -> "DEGRADED";
            case ACQUISITION_SUSPENDED -> "UNAVAILABLE";
        };
    }

    /**
     * Establish production as the ACTIVE acquisition authority when it is ALREADY the active
     * binding but not yet active — i.e. from PRODUCTION_UNVERIFIED (startup) OR
     * ACQUISITION_SUSPENDED (production was bound but unusable, and either no sandbox exists or
     * sandbox was also unusable), after representative validation confirmed production usable.
     *
     * <p>This is the INITIAL verification / in-place recovery of the already-bound production
     * authority — NOT a failback from sandbox — so it does NOT change the binding or increment
     * the fence epoch. (A sandbox→production failback is {@link #activateProduction()}, which
     * DOES bump the epoch.) Evidence remains DEGRADED until an explicit fresh primary production
     * commit under this epoch establishes NORMAL.
     *
     * <p>No-op-safe: only transitions when production is the active binding and the lifecycle is
     * UNVERIFIED or SUSPENDED. Returns true if it performed the transition. This is the fix for
     * the suspended-production dead-end: a production-bound SUSPENDED authority can now recover
     * to PRODUCTION_ACTIVE on a sustained probe streak instead of resetting forever.
     */
    public synchronized boolean establishProductionVerified() {
        Lifecycle lc = lifecycle.get();
        boolean productionBound = binding.get().authority() == production;
        boolean eligible = productionBound
            && (lc == Lifecycle.PRODUCTION_UNVERIFIED || lc == Lifecycle.ACQUISITION_SUSPENDED);
        if (eligible) {
            lifecycle.set(Lifecycle.PRODUCTION_ACTIVE);
            String from = lc == Lifecycle.PRODUCTION_UNVERIFIED ? "unverified start" : "suspended";
            observer.appendControl(ObservationRecorder.RecordType.AUTHORITY_TRANSITION,
                production.id(), currentEpoch(), null,
                "production verified from " + from + " (evidence still degraded until a fresh production commit)");
            return true;
        }
        return false;
    }

    /**
     * True when the active acquisition authority has been ESTABLISHED and may perform ordinary
     * acquisition: production has been verified (PRODUCTION_ACTIVE) OR a verified sandbox is
     * serving (DEGRADED_SANDBOX / PRODUCTION_PROBING). It is FALSE for the two "not yet usable"
     * states — PRODUCTION_UNVERIFIED (startup, production not validated) and ACQUISITION_SUSPENDED
     * (no usable authority) — under which ordinary acquisition must not run; the control plane
     * must first establish an authority. (PL-PROV-FAILOVER: ordinary acquisition cannot run under
     * an unverified or suspended authority.)
     */
    public boolean acquisitionAuthorityEstablished() {
        return switch (lifecycle.get()) {
            case PRODUCTION_ACTIVE, DEGRADED_SANDBOX, PRODUCTION_PROBING -> true;
            case PRODUCTION_UNVERIFIED, ACQUISITION_SUSPENDED -> false;
        };
    }

    /**
     * True only in the fully-settled state: production is the active, verified authority AND a
     * fresh current-epoch production primary chain has been committed (evidence restored). This
     * is the single predicate used for both the operator-facing NORMAL projection and the
     * scheduler's "may stay quiet" decision — until settled, the control plane must keep
     * validating production, so scheduling stays responsive enough for the recovery-probe gate.
     */
    public boolean settledProduction() {
        return lifecycle.get() == Lifecycle.PRODUCTION_ACTIVE && productionEvidenceCurrent();
    }
}
