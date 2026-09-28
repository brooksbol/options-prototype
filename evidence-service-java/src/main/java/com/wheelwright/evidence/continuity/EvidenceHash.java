package com.wheelwright.evidence.continuity;

import com.wheelwright.evidence.production.FidelityActivityRow;

/**
 * Deterministic content hash of the admitted continuity evidence contract (Doc 70 §7).
 *
 * Binds the exact inputs an assessment consumed so a Decision can pin it and replay can
 * detect drift. Not cryptographic; FNV-1a over a length-prefixed injective encoding, adequate
 * for integrity/idempotency within the trusted single-operator boundary (matches the
 * frontend decision-bundle convention).
 */
final class EvidenceHash {

    private EvidenceHash() {}

    static String of(ContinuityInputs in) {
        StringBuilder sb = new StringBuilder();
        appendPart(sb, "v1");
        appendPart(sb, in.brokerageAccountId());
        appendPart(sb, in.underlying());
        appendPart(sb, in.optionType());
        appendPart(sb, String.valueOf(in.strike()));
        appendPart(sb, String.valueOf(in.expiration()));
        appendPart(sb, String.valueOf(in.openingQuantity()));
        appendPart(sb, String.valueOf(in.openingDate()));
        appendPart(sb, String.valueOf(in.historyCompleteThroughQuietDay()));
        appendPart(sb, String.valueOf(in.quietDay()));
        appendPart(sb, String.valueOf(in.positionsShortQuantityOnQuietDay()));
        appendPart(sb, String.valueOf(in.positionsIdentifiesSeries()));
        appendPart(sb, in.admissionRuleVersion());
        if (in.historyRows() != null) {
            for (FidelityActivityRow r : in.historyRows()) {
                appendPart(sb, String.valueOf(r.runDate()));
                appendPart(sb, r.action() == null ? "" : r.action());
                appendPart(sb, r.symbol() == null ? "" : r.symbol());
                appendPart(sb, r.description() == null ? "" : r.description());
                appendPart(sb, String.valueOf(r.quantity()));
                appendPart(sb, String.valueOf(r.settlementDate()));
            }
        }
        return "ceh_" + fnv1a(sb.toString());
    }

    private static void appendPart(StringBuilder sb, String s) {
        String v = s == null ? "\u0000" : s;
        sb.append(v.length()).append(':').append(v).append('|');
    }

    private static String fnv1a(String input) {
        int h = 0x811c9dc5;
        for (int i = 0; i < input.length(); i++) {
            h ^= input.charAt(i);
            h *= 0x01000193;
        }
        return Integer.toString(h & 0x7fffffff, 36);
    }
}
