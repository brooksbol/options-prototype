package com.wheelwright.evidence.v2;

import java.util.regex.Pattern;

/** Transport only. Neither function normalizes canonical identity or decodes recursively. */
public final class PathSymbolCodec {
    private static final Pattern SUBJECT = Pattern.compile("[A-Z^][A-Z0-9.^/_-]{0,31}");
    private static final Pattern TOKEN = Pattern.compile("(?:[A-Z]|_5E)(?:[A-Z0-9.-]|_(?:2F|5E|5F)){0,31}");
    private PathSymbolCodec() {}
    public static String encode(String symbol) {
        if (symbol == null || !SUBJECT.matcher(symbol).matches()) throw invalid();
        StringBuilder out = new StringBuilder();
        for (char c : symbol.toCharArray()) out.append(switch (c) {
            case '/' -> "_2F"; case '_' -> "_5F"; case '^' -> "_5E";
            default -> String.valueOf(c);
        });
        return out.toString();
    }
    public static String decode(String token) {
        if (token == null || !TOKEN.matcher(token).matches()) throw invalid();
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < token.length();) {
            char c = token.charAt(i++);
            if (c != '_') out.append(c);
            else {
                out.append(switch (token.substring(i, i + 2)) {
                    case "2F" -> '/'; case "5F" -> '_'; case "5E" -> '^';
                    default -> throw invalid();
                });
                i += 2;
            }
        }
        String symbol = out.toString();
        if (!encode(symbol).equals(token)) throw invalid();
        return symbol;
    }
    private static IllegalArgumentException invalid() { return new IllegalArgumentException("invalid path symbol"); }
}
