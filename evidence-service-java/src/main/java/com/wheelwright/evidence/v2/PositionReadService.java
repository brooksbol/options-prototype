package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.sql.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** No provider or client-state dependency; one committed immutable snapshot per read. */
@Component
public class PositionReadService {
    private final String url;
    private final ObjectMapper mapper;
    @org.springframework.beans.factory.annotation.Autowired
    public PositionReadService(SqliteEvidenceStore store, ObjectMapper mapper) throws SQLException {
        this(store.getConnection().getMetaData().getURL(), mapper);
    }
    public PositionReadService(String url, ObjectMapper mapper) { this.url = url; this.mapper = mapper; }
    public boolean admit(PositionSnapshot snapshot) throws Exception {
        if (!AccountDirectory.validId(snapshot.account())) throw new IllegalArgumentException("canonical Account ID required");
        try (var c = DriverManager.getConnection(url)) {
            c.setAutoCommit(false);
            try {
                boolean changed = admit(c, snapshot);
                c.commit(); return changed;
            } catch (Exception e) { c.rollback(); throw e; }
        }
    }
    /** Caller owns the transaction, allowing snapshot and acquisition outcome to commit together. */
    boolean admit(Connection c, PositionSnapshot snapshot) throws Exception {
        if (!AccountDirectory.validId(snapshot.account())) throw new IllegalArgumentException("canonical Account ID required");
        try (var q = c.prepareStatement("SELECT payload_json FROM account_position_snapshot WHERE account=? LIMIT 1")) {
            q.setString(1, snapshot.account());
            try (var rs = q.executeQuery()) {
                if (rs.next() && !mapper.readValue(rs.getString(1), PositionSnapshot.class).brokerAccount().equals(snapshot.brokerAccount()))
                    throw new IllegalArgumentException("account alias already bound to another broker account");
            }
        }
        int changed;
        try (var q = c.prepareStatement("INSERT OR IGNORE INTO account_position_snapshot VALUES (?, ?, ?, ?, ?)")) {
            q.setString(1, snapshot.account()); q.setString(2, snapshot.snapshotId());
            q.setString(3, snapshot.evidenceDate()); q.setString(4, snapshot.recordedAt());
            q.setString(5, mapper.writeValueAsString(snapshot)); changed = q.executeUpdate();
        }
        return changed != 0;
    }
    public Optional<PositionSnapshot.Read> read(String account, String requestId, Instant now) throws Exception {
        return read(account, null, requestId, now);
    }
    /** Separate semantic projection preserves the accepted comprehensive inventory representation. */
    public Optional<OptionStructure.Read> readOpenOptions(String account,String requestId,Instant now) throws Exception {
        try(var c=DriverManager.getConnection(url)) {
            try(var p=c.createStatement()){p.execute("PRAGMA query_only=ON");}c.setAutoCommit(false);
            try(var q=c.prepareStatement("SELECT payload_json FROM account_position_snapshot WHERE account=? ORDER BY evidence_date DESC, recorded_at DESC, snapshot_id DESC LIMIT 1")) {
                q.setString(1,account);
                try(var rs=q.executeQuery()) {
                    if(!rs.next())return Optional.empty();
                    var snapshot=mapper.readValue(rs.getString(1),PositionSnapshot.class);
                    if(!account.equals(snapshot.account()))throw new IllegalStateException("snapshot Account mismatch");
                    return Optional.of(OptionStructure.project(snapshot,requestId,now));
                }
            }
        }
    }
    public Optional<PositionSnapshot.Read> read(String account, String snapshotId, String requestId, Instant now) throws Exception {
        try (var c = DriverManager.getConnection(url)) {
            try (var p = c.createStatement()) { p.execute("PRAGMA query_only=ON"); }
            c.setAutoCommit(false);
            try (var q = c.prepareStatement(snapshotId == null ? "SELECT payload_json FROM account_position_snapshot WHERE account=? ORDER BY evidence_date DESC, recorded_at DESC, snapshot_id DESC LIMIT 1"
                    : "SELECT payload_json FROM account_position_snapshot WHERE account=? AND snapshot_id=?")) {
                q.setString(1, account);
                if (snapshotId != null) q.setString(2, snapshotId);
                try (var rs = q.executeQuery()) {
                    if (!rs.next()) return Optional.empty();
                    var snapshot = mapper.readValue(rs.getString(1), PositionSnapshot.class);
                    if (!account.equals(snapshot.account()) || snapshotId != null && !snapshotId.equals(snapshot.snapshotId()))
                        throw new IllegalArgumentException("inconsistent retained snapshot identity");
                    return Optional.of(project(snapshot, requestId, now, snapshot.observation() == null ? PositionMarketEvidence.read(c, snapshot, mapper) : Map.of()));
                }
            }
        }
    }
    Map<String,PositionMarketEvidence.ReportedUnderlying> reportedUnderlyingSymbols(String account,String snapshotId)throws Exception {
        try(var c=DriverManager.getConnection(url)) {
            try(var p=c.createStatement()){p.execute("PRAGMA query_only=ON");}c.setAutoCommit(false);
            try(var q=c.prepareStatement("SELECT payload_json FROM account_position_snapshot WHERE account=? AND snapshot_id=?")) {
                q.setString(1,account);q.setString(2,snapshotId);
                try(var rs=q.executeQuery()){if(!rs.next())return Map.of();var s=mapper.readValue(rs.getString(1),PositionSnapshot.class);
                    return s.observation()==null?PositionMarketEvidence.underlyingSymbols(c,s,mapper):Map.of();}
            }
        }
    }
    /** One complete committed read view. Metadata only; no market enrichment or provider dependency. */
    public List<PositionSnapshot.ObservationSummary> observations(Set<String> authorizedAccounts, String requestId) throws Exception {
        var result = new ArrayList<PositionSnapshot.ObservationSummary>();
        long sourceBytes = 0; // Engineering memory budget; exceeding it fails the whole read, never truncates.

        if (authorizedAccounts.isEmpty()) return List.of();
        try (var c = DriverManager.getConnection(url)) {
            try (var p = c.createStatement()) { p.execute("PRAGMA query_only=ON"); }
            c.setAutoCommit(false);
            try (var q = c.prepareStatement("SELECT length(CAST(payload_json AS BLOB)) AS payload_bytes, payload_json FROM account_position_snapshot WHERE account=? ORDER BY evidence_date DESC, recorded_at DESC, snapshot_id DESC")) {
                for (String account : new TreeSet<>(authorizedAccounts)) {
                    q.setString(1, account);
                    try (var rs = q.executeQuery()) { while (rs.next()) {
                        sourceBytes += rs.getLong("payload_bytes");
                        if (sourceBytes > 32L * 1024 * 1024 || result.size() >= 10000)
                            throw new SQLException("complete catalog exceeds response capacity");
                        var snapshot = mapper.readValue(rs.getString("payload_json"), PositionSnapshot.class);
                        if (!account.equals(snapshot.account())) throw new IllegalStateException("snapshot Account mismatch");
                        result.add(PositionSnapshot.ObservationSummary.of(snapshot, requestId));
                    } }
                }
            }
        }
        return List.copyOf(result);
    }
    public static PositionSnapshot.Read project(PositionSnapshot s, String requestId, Instant now) {
        return project(s, requestId, now, Map.of());
    }
    private static PositionSnapshot.Read project(PositionSnapshot s, String requestId, Instant now, Map<String, PositionMarketEvidence.Facts> market) {
        var holdings = new LinkedHashMap<String, PositionSnapshot.Constituent>();
        for (var h : s.holdings()) if (holdings.put(h.holdingId(), h) != null)
            throw new IllegalArgumentException("duplicate held identity");
        FidelityPositions.validateAssociations(s.associations(), holdings.keySet());
        var positions = new ArrayList<PositionSnapshot.Position>(); var allocated = new HashSet<String>();
        for (var a : s.associations()) {
            var parts = a.holdingIds().stream().map(holdings::get).toList(); allocated.addAll(a.holdingIds());
            positions.add(position(a.positionId(), a.label(), "EXPLICIT_SNAPSHOT_ASSOCIATION", a.program(), a.authority(), parts, now, market));
        }
        for (var h : s.holdings()) if (!allocated.contains(h.holdingId()))
            positions.add(position("position-" + h.holdingId().substring(8), h.contract(),
                    "OBSERVED_CONTRACT_AND_CUSTODY", null, null, List.of(h), now, market));
        if (positions.stream().map(PositionSnapshot.Position::positionId).distinct().count() != positions.size())
            throw new IllegalArgumentException("conflicting Position identity");
        var qualifications = new ArrayList<>(PositionSnapshot.observationQualifications(s));
        qualifications.addAll(s.observation() != null ? List.of(
                "Historical inventory projected at inspection time: DTE uses evaluatedAt, not historical evaluation replay.",
                "Retained tastytrade holdings observation; request start and response receipt bound acquisition, not atomic broker event time or live state.",
                "JSON sourceRows are one-based data.items indices. Evidence date is the UTC receipt date, not an opening or event date.",
                "Occurrence continuity and opening economics unresolved. Working orders, Program membership and executable valuation unknown. No geometry-based grouping.",
                "Quantity and contract identity are observed facts; no complete transaction-history claim.") : List.of(
                "Historical inventory projected at inspection time: DTE uses evaluatedAt. Fidelity enrichment may use subsequently retained same-export-date evidence with separate provenance; no historical knowledge replay or historical valuation capability.",
                "Historical broker snapshot, not live account state. Export date precision is one day; no lifecycle events are inferred.",
                "Position identity names observed contract/custody inventory or an explicit snapshot-bound association; it does not establish lifecycle continuity.",
                "Bid/ask and option margin requirements use an accepted same-day Option Summary only, with separate row provenance; date precision does not establish current executable prices. Strategy presentation never counts inventory.",
                "Option Greeks, capital allocation, close policy and working orders are unavailable. Margin requirements are broker-reported quantities, not market value, allocation or deployable capital.",
                "Market value and open P/L are broker-reported, not executable close proceeds. No account NAV or deployable-capital claim.",
                "Program membership is unknown unless explicitly associated in this snapshot. No association is inherited from a symbol or earlier snapshot."));
        return new PositionSnapshot.Read(requestId, s.account(), s.accountName(), s.snapshotId(),
                s.evidenceDate(), s.recordedAt(), s.sourceFile(), s.sourceSha256(), s.artifactId(), now.toString(),
                s.excludedNonPositionRows(), List.copyOf(positions), "UNKNOWN", List.copyOf(qualifications), s.observation(), PositionSnapshot.context(s), "INSPECTION_TIME");
    }
    private static PositionSnapshot.Position position(String id, String label, String basis, String program,
            String authority, List<PositionSnapshot.Constituent> holdings, Instant now, Map<String, PositionMarketEvidence.Facts> market) {
        BigDecimal pl = BigDecimal.ZERO, value = BigDecimal.ZERO, delta = BigDecimal.ZERO;
        var legs = new ArrayList<PositionSnapshot.Leg>();
        for (var h : holdings) {
            // Equity sensitivity to its own underlying. Never extend this to bonds/options or beta weighting.
            BigDecimal d = List.of("Stocks", "ETFs").contains(h.kind()) ? h.quantity() : null;
            pl = FidelityPositions.sum(pl, h.openPl()); value = FidelityPositions.sum(value, h.marketValue());
            delta = FidelityPositions.sum(delta, d);
            Long dte = h.expiration() == null ? null : ChronoUnit.DAYS.between(
                    now.atZone(ZoneId.of("America/New_York")).toLocalDate(), LocalDate.parse(h.expiration()));
            String state = h.quantity().signum() < 0 ? (h.kind().equals("Options") ? "SHORT / obligation reported" : "SHORT reported")
                    : h.kind().equals("Options") ? "LONG / right reported" : "LONG reported";
            if (dte != null && dte < 0) state += "; past expiry, resolution unknown";
            var quote = market.get(h.contract());
            BigDecimal requirement = quote != null && h.kind().equals("Options") && quote.reportedQuantity() != null &&
                    quote.reportedQuantity().compareTo(h.quantity()) == 0 ? quote.requirement() : null;
            var enriched = quote == null ? h : new PositionSnapshot.Constituent(h.holdingId(), h.contract(), h.description(), h.kind(), h.custody(), h.quantity(),
                    h.openPl(), h.marketValue(), quote.bid(), quote.ask(), h.expiration(), h.sourceRows());
            legs.add(new PositionSnapshot.Leg(enriched, dte, d, state, requirement, quote == null ? null : quote.provenance()));
        }
        // Deltas in different underlying units are not additive.
        if (holdings.stream().map(PositionSnapshot.Constituent::contract).distinct().count() > 1) delta = null;
        var notes = new ArrayList<String>();
        if (pl == null) notes.add("Open P/L incomplete: one or more constituents lack broker-reported P/L; no partial total shown.");
        if (delta == null) notes.add("Share-equivalent delta unavailable for this Position; option Greeks/compatible sensitivity basis not established.");
        if (program == null) notes.add("Program association unknown.");
        return new PositionSnapshot.Position(id, label, basis, program, authority, pl, value, delta, legs.size() == 1 ? legs.getFirst().capitalRequirement() : null,
                List.copyOf(legs), List.copyOf(notes));
    }
}
