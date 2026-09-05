package com.wheelwright.evidence.production;

import java.math.BigDecimal;

/**
 * Backend-authoritative interpreted economic result for ONE realized disposition event
 * (currently: a called-away covered-call/buy-write share sale — ASSIGNED_CALL_STOCK_SALE).
 *
 * This is the single semantic owner of "what happened economically in this specific
 * disposition." The frontend consumes and renders this; it must not reconstruct realized
 * disposition economics (net proceeds, appreciation/erosion, basis resolution) itself.
 *
 * Vocabulary discipline ("basis for what purpose?"): {@code attributableAcquisitionCash} is
 * the proportional net Fidelity acquisition cash for the eligible attributable shares. It is
 * NOT a tax-lot basis or a universal accounting basis, and must not be labeled as such.
 *
 * Nullable economic fields are populated only when defensibly established from evidence.
 * When they cannot be, {@code state} is PARTIAL or UNRESOLVED and the fields remain null —
 * the result never fabricates a value.
 */
public record DispositionResult(
    /**
     * Disposition FINGERPRINT — the NormalizedTransaction content fingerprint of the disposition
     * (sale) event. Deterministic trace/dedup value only. Per ADR-016 it names only the guarantees
     * it has: it is NOT guaranteed unique (two distinct disposition occurrences may legitimately
     * share it), NOT evidence-row identity, NOT broker-event identity, and NOT durable domain
     * identity. Do not treat equality of this value as identity of the disposition.
     */
    String dispositionFingerprint,
    /**
     * Authoritative association target for this disposition: the current OCC contract/activity
     * grouping key relating the called-away disposition to option contract activity (e.g.
     * "-BNO260904C54"), matching the consumer's grouping key exactly. The BACKEND establishes this
     * association from evidence. Null when the association cannot be uniquely established — in which
     * case {@code state} is UNRESOLVED and no realized economics are attached. The consumer performs
     * a direct contractActivityKey lookup only; it must NOT re-derive the association from economic
     * attributes. Per ADR-016 this is NOT ratified as durable lifecycle/episode identity and does
     * not declare that the backend owns a durable "episode" entity.
     */
    String contractActivityKey,
    /** Underlying symbol. */
    String symbol,
    /**
     * Broker run/processing date for the disposition evidence (normalized Fidelity Run Date),
     * ISO string. This is NOT necessarily the economic "as of" date or the settlement date; those
     * temporal semantics are distinct and not asserted here (ADR-015/ADR-016).
     */
    String date,
    /**
     * Raw Fidelity action text of the disposition (sale) event, preserved for operator-visible
     * provenance. This lets the consumer render the disposition as a constituent event of the
     * episode FROM the authoritative association — rather than independently re-correlating a raw
     * sale row to the episode by economic attributes (ADR-016). Nullable.
     */
    String dispositionAction,
    /** Structural disposition kind (e.g., ASSIGNED_CALL_STOCK_SALE). */
    FidelityTransactionKind kind,
    /** Disposed share quantity (absolute). */
    BigDecimal quantity,
    /** Sale execution price per share (for an assigned call, corresponds to strike). Nullable. */
    BigDecimal salePricePerShare,
    /** Net sale proceeds — actual Fidelity net cash for this disposition. Nullable if unavailable. */
    BigDecimal netSaleProceeds,
    /** Attributable acquisition cash for the disposed shares (proportional net cash). Null when unresolved. */
    BigDecimal attributableAcquisitionCash,
    /** Realized appreciation (proceeds &gt; attributable cash). Null unless resolved and positive. */
    BigDecimal realizedAppreciation,
    /** Realized erosion (proceeds &lt; attributable cash). Null unless resolved and negative. */
    BigDecimal realizedErosion,
    /** Economic-resolution / completeness state for this disposition's realized economics. */
    DispositionEconomicState state,
    /**
     * Traceable provenance TEXT (not a structurally-typed provenance object). A human/debugging
     * consumer can read the evidence references it carries (dispositionFingerprint,
     * contractActivityKey/association status, economic derivation). The structured, machine-usable
     * fields above ({@code dispositionFingerprint}, {@code contractActivityKey}) augment this text.
     */
    String provenance
) {
    /**
     * Completeness of a disposition's REALIZED share-leg economics. Distinct from, and
     * narrower than, the global production ReconciliationStatus.
     */
    public enum DispositionEconomicState {
        /** Proceeds known AND attributable acquisition economics defensibly resolved. */
        RESOLVED,
        /** Proceeds known but attributable acquisition economics unresolved (BASIS_UNKNOWN). */
        PARTIAL,
        /** Proceeds themselves unavailable/unattributable. */
        UNRESOLVED
    }
}
