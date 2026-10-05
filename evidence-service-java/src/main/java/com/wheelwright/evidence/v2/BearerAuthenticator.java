package com.wheelwright.evidence.v2;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Bearer-to-principal authentication + grant authorization for API v2 (contract §22).
 *
 * <p>The ratified OAS advertises Bearer authentication only. A TLS-protected configured
 * credential establishes a caller identity (principal). Authorization is separate:
 * acquisition requires the {@code quote.acquire} grant; {@code FORCE} additionally requires
 * {@code quote.force}.
 *
 * <p>Configuration format (property {@code wheelwright.v2.auth.tokens}): a comma-separated
 * list of {@code token=principal:grant1|grant2} entries. For example:
 * {@code wheelwright.v2.auth.tokens=sekret=cli:quote.acquire|quote.force,ro=web:quote.acquire}.
 * This representation is a mechanical engineering choice; it selects no cloud identity
 * provider and advertises no bypass. There is NO trusted-local or anonymous mode.
 *
 * <p><b>Fail closed.</b> When no token configuration is present the authenticator rejects
 * every credential ({@link #configured()} is false), so a deployed operation cannot run with
 * an open or anonymous security posture (contract §22). Callers must surface
 * {@code CAPABILITY_UNAVAILABLE} / {@code UNAUTHENTICATED} rather than proceeding.
 */
@Component
public class BearerAuthenticator {

    /** The acquisition grant required for any {@code POST /v2/quotes}. */
    public static final String GRANT_ACQUIRE = "quote.acquire";
    /** The additional grant required when {@code mode=FORCE}. */
    public static final String GRANT_FORCE = "quote.force";

    /** Independent held-evidence read grant; acquire/force never imply it. */
    public static final String GRANT_READ = "quote.read";

    private final Map<String, Principal> byToken = new HashMap<>();

    public BearerAuthenticator(
            @Value("${wheelwright.v2.auth.tokens:}") String tokenConfig) {
        if (tokenConfig != null && !tokenConfig.isBlank()) {
            for (String entry : tokenConfig.split(",")) {
                String trimmed = entry.trim();
                if (trimmed.isEmpty()) continue;
                int eq = trimmed.indexOf('=');
                if (eq <= 0 || eq == trimmed.length() - 1) continue;
                String token = trimmed.substring(0, eq).trim();
                String spec = trimmed.substring(eq + 1).trim();
                int colon = spec.indexOf(':');
                String name = colon >= 0 ? spec.substring(0, colon).trim() : spec.trim();
                Set<String> grants = new LinkedHashSet<>();
                if (colon >= 0 && colon < spec.length() - 1) {
                    for (String g : spec.substring(colon + 1).split("\\|")) {
                        String gt = g.trim();
                        if (!gt.isEmpty()) grants.add(gt);
                    }
                }
                if (!token.isEmpty() && !name.isEmpty()) {
                    byToken.put(token, new Principal(name, Set.copyOf(grants)));
                }
            }
        }
    }

    /**
     * Whether any approved authentication configuration exists. When false the capability
     * must fail closed; it must never authenticate anonymously.
     */
    public boolean configured() {
        return !byToken.isEmpty();
    }

    /**
     * Resolve the principal for a raw {@code Authorization} header value, or empty when the
     * header is missing, not a Bearer credential, or does not match a configured token.
     */
    public Optional<Principal> authenticate(String authorizationHeader) {
        if (authorizationHeader == null) return Optional.empty();
        String prefix = "Bearer ";
        if (authorizationHeader.length() <= prefix.length()
                || !authorizationHeader.regionMatches(true, 0, prefix, 0, prefix.length())) {
            return Optional.empty();
        }
        String token = authorizationHeader.substring(prefix.length()).trim();
        if (token.isEmpty()) return Optional.empty();
        return Optional.ofNullable(byToken.get(token));
    }

    /** An authenticated caller identity and its grants. */
    public record Principal(String name, Set<String> grants) {
        public boolean hasGrant(String grant) {
            return grants.contains(grant);
        }
    }
}
