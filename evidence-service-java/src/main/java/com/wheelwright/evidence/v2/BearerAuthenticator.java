package com.wheelwright.evidence.v2;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/** Bearer credentials identify immutable Users. Permissions come from backend User state.
 * Server bootstrap format: token=user-ID-or-bootstrap-subject:explicit-permissions.
 * Bootstrap subjects are server-only registration keys, never Account identity or REST IDs.
 * Multiple credentials for one User have the same permissions. No anonymous/local bypass.
 */
@Component
public class BearerAuthenticator {

    /** The acquisition grant required for any {@code POST /v2/quotes}. */
    public static final String GRANT_ACQUIRE = "quote.acquire";
    /** The additional grant required when {@code mode=FORCE}. */
    public static final String GRANT_FORCE = "quote.force";

    /** Independent held-evidence read grant; acquire/force never imply it. */
    public static final String GRANT_READ = "quote.read";

    private final Map<String, String> byToken = new HashMap<>();
    private final UserDirectory users;

    @org.springframework.beans.factory.annotation.Autowired
    public BearerAuthenticator(UserDirectory users,
            @Value("${wheelwright.v2.auth.tokens:}") String tokenConfig) throws java.sql.SQLException {
        this.users=users;
        var credentials=new HashMap<String,String>();
        var permissions=new HashMap<String,Set<String>>();
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
                    String prior=credentials.put(token,name);
                    if(prior!=null&&!prior.equals(name))throw new IllegalArgumentException("credential maps to multiple Users");
                    permissions.computeIfAbsent(name,k->new LinkedHashSet<>()).addAll(grants);
                }
            }
        }
        // Permission configuration belongs to a User, not to an individual credential.
        var effective=new HashMap<String,Set<String>>();
        for(var subject:permissions.entrySet()) {
            String userId=users.bootstrap(subject.getKey(),subject.getValue());
            effective.computeIfAbsent(userId,k->new LinkedHashSet<>()).addAll(subject.getValue());
            for(var credential:credentials.entrySet())if(credential.getValue().equals(subject.getKey()))byToken.put(credential.getKey(),userId);
        }
        for(var entry:effective.entrySet())users.bootstrap(entry.getKey(),entry.getValue());
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
        String userId=byToken.get(token);
        if(userId==null)return Optional.empty();
        try { return users.grants(userId).map(grants->new Principal(userId,grants)); }
        catch(java.sql.SQLException e){return Optional.empty();} // Authorization storage failure closes access.
    }

    /** An authenticated caller identity and its grants. */
    public record Principal(String userId, Set<String> grants) {
        public boolean hasGrant(String grant) {
            return grants.contains(grant);
        }
    }
}
