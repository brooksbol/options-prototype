package com.wheelwright.evidence;

/**
 * Deterministic, non-cryptographic identity hashing for durable idempotency keys.
 *
 * FNV-1a 32-bit over a length-prefixed, injectively-joined encoding of the parts, so no
 * part can alias another. Matches the browser's deterministic-id discipline
 * (opportunity-history/identity.ts) closely enough that a backend-computed id is stable
 * and duplicate-safe. Not a security primitive.
 */
public final class Identity {

    private Identity() {}

    public static String hash(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            String s = (p == null) ? "\u0000" : p;
            sb.append(s.length()).append(':').append(s).append('|');
        }
        String input = sb.toString();
        int h = 0x811c9dc5;
        for (int i = 0; i < input.length(); i++) {
            h ^= input.charAt(i);
            h *= 0x01000193;
        }
        return Integer.toUnsignedString(h, 36);
    }
}
