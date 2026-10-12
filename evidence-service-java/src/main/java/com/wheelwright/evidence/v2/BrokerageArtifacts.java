package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.Component;
import java.nio.*;
import java.nio.charset.*;
import java.security.MessageDigest;
import java.sql.*;
import java.time.Instant;
import java.util.*;

/** Immutable exact-byte source retention and bounded admission, never a history-completeness claim. */
@Component
public class BrokerageArtifacts {
    public static final int MAX_BYTES = 16 * 1024 * 1024;
    public record Attempt(String importId, String originalFilename, String fileType, String importedAt,
            String status, String result, SourcePeriod sourcePeriod) {}
    public record SourcePeriod(String startDate, String endDate, String meaning) {}
    public record Metadata(String artifactId, String accountId, String sha256, String contentType,
            long sizeBytes, String receivedAt, List<Attempt> imports) {}
    public record Inventory(String requestId, String accountId, String brokerAccount, String historyCoverage,
            List<Metadata> artifacts) {}
    public record Processed(String requestId, String artifactId, String importId, boolean newlyPersisted,
            String status, String result) {}
    private final String url;
    private final ObjectMapper mapper;
    private final PositionReadService positions;
    private final AccountDirectory accounts;
    @Autowired
    public BrokerageArtifacts(SqliteEvidenceStore store, ObjectMapper mapper, PositionReadService positions,
            AccountDirectory accounts) throws Exception {
        this(store.getConnection().getMetaData().getURL(), mapper, positions, accounts);
    }
    public BrokerageArtifacts(String url, ObjectMapper mapper, PositionReadService positions) {
        this(url,mapper,positions,new AccountDirectory(url));
    }
    private BrokerageArtifacts(String url,ObjectMapper mapper,PositionReadService positions,AccountDirectory accounts) {
        this.url=url;this.mapper=mapper;this.positions=positions;this.accounts=accounts;
    }
    public AccountDirectory accounts() { return accounts; }
    public Optional<String> owner(String artifactId) throws SQLException {
        try(var c=DriverManager.getConnection(url);var q=c.prepareStatement("SELECT account FROM brokerage_artifact WHERE artifact_id=?")) {
            q.setString(1,artifactId);try(var rs=q.executeQuery()){return rs.next()?Optional.of(rs.getString(1)):Optional.empty();}
        }
    }
    public String bindAccount(String alias,String brokerAccount)throws SQLException { return accounts.bind(alias,brokerAccount); }
    public String brokerAccount(String account)throws SQLException {
        return accounts.get(account).map(a->a.brokerAssociation().accountNumber()).orElse(null);
    }
    /** Completeness is independent of semantic processing success and Account grants. */
    public record SourceScope(boolean established, Set<String> accountIds) {
        public SourceScope { accountIds = Set.copyOf(accountIds); }
        static SourceScope unknown() { return new SourceScope(false, Set.of()); }
    }
    /** Inspect retained bytes on every disclosure; never infer single-owner scope from silence. */
    public SourceScope sourceScopes(String owner, String filename, byte[] bytes) throws SQLException {
        var sourceAccount=accounts.get(owner);
        if(sourceAccount.isPresent()&&sourceAccount.get().brokerAssociation().broker().equals("TASTYTRADE")) {
            String hash;
            try {hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));}
            catch(Exception e){return SourceScope.unknown();}
            // Scope for empty inventory requires backend acquisition provenance, not silence in content.
            try(var c=DriverManager.getConnection(url);var q=c.prepareStatement("SELECT 1 FROM brokerage_position_acquisition a JOIN brokerage_artifact b ON a.account=b.account AND a.artifact_id=b.artifact_id WHERE a.account=? AND b.sha256=? LIMIT 1")) {
                q.setString(1,owner);q.setString(2,hash);
                try(var rs=q.executeQuery()) {if(rs.next()&&TastytradeHoldings.sourceAccount(bytes,sourceAccount.get().brokerAssociation().accountNumber()))return new SourceScope(true,Set.of(owner));}
            }
            return SourceScope.unknown();
        }
        if (!sourceAccount.map(a -> a.brokerAssociation().broker().equals("FIDELITY")).orElse(false))
            return SourceScope.unknown();
        Set<String> brokerIds;
        try {
            String text = StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString();
            brokerIds = sourceBrokerIds(filename, FidelityPositions.csv(text.replaceFirst("^\\uFEFF", "")));
        } catch (CharacterCodingException | IllegalArgumentException e) {
            return SourceScope.unknown();
        }
        if (brokerIds.isEmpty()) return SourceScope.unknown();
        var scopes = new HashSet<String>(); scopes.add(owner);
        try (var c = DriverManager.getConnection(url); var q = c.prepareStatement("SELECT account_id FROM brokerage_account WHERE broker='FIDELITY' AND broker_account=?")) {
            for (String brokerId : brokerIds) {
                q.setString(1, brokerId);
                try (var rs = q.executeQuery()) {
                    if (!rs.next()) return SourceScope.unknown();
                    scopes.add(rs.getString(1));
                }
            }
        }
        return new SourceScope(true, scopes);
    }
    private static final List<String> POSITION_COLUMNS = List.of("Account number", "Account name", "Investment type",
            "Symbol", "Description", "Quantity", "Current value", "Total gain/loss dollar", "Type");
    private static final List<String> SUMMARY_COLUMNS = List.of("Symbol", "Strategy", "Expiration & Strike", "Quantity");
    private static final List<String> ACTIVITY_COLUMNS = List.of("Run Date", "Action", "Symbol", "Amount ($)");
    private static final List<String> BALANCE_COLUMNS = List.of("Balance", "Day change");
    private static final java.util.regex.Pattern SUMMARY_ACCOUNT = java.util.regex.Pattern.compile("Fidelity Investments - Option Summary ([A-Z0-9]+)");
    private static final java.util.regex.Pattern NAMED_ACCOUNT = java.util.regex.Pattern.compile("(History|Balances)_for_Account_([A-Z0-9]+)(?:[- (].*)?\\.csv");

    /** Only the existing Fidelity envelopes establish attribution; values are not financially parsed. */
    private static Set<String> sourceBrokerIds(String filename, List<List<String>> rows) {
        int first = 0;
        while (first < rows.size() && rows.get(first).stream().allMatch(String::isBlank)) first++;
        if (first == rows.size()) return Set.of();
        var initial = rows.get(first).stream().map(String::trim).toList();
        var ids = new HashSet<String>();
        boolean positions = initial.containsAll(POSITION_COLUMNS);
        boolean summary = summaryAccount(initial) != null;
        var named = NAMED_ACCOUNT.matcher(filename);
        boolean activity = initial.containsAll(ACTIVITY_COLUMNS);
        boolean balances = initial.containsAll(BALANCE_COLUMNS);
        if (!positions && !summary) {
            if (initial.contains("Account number") || !named.matches() || !(activity && named.group(1).equals("History") || balances && named.group(1).equals("Balances")))
                return Set.of();
            ids.add(named.group(2));
        }
        List<String> header = summary ? null : initial;
        if (header != null && new HashSet<>(header).size() != header.size()) return Set.of();
        boolean footer = false, sawHeader = !summary;
        for (int i = summary ? first : first + 1; i < rows.size(); i++) {
            var row = rows.get(i);
            if (row.stream().allMatch(String::isBlank)) continue;
            // Provenance markers take precedence over data, metadata and footer shapes.
            // Padding or quoting must never turn another Account section into ordinary data.
            if (row.stream().anyMatch(value -> value.contains("Fidelity Investments - Option Summary"))) {
                String sectionAccount = summaryAccount(row);
                if (!summary || footer || sectionAccount == null) return Set.of();
                ids.add(sectionAccount);
                continue;
            }
            if (row.size() == 1) {
                String value = row.getFirst().trim();
                if (summary && !footer && value.startsWith("Quote data as of ")) continue;
                if (sourceFooter(value)) { footer = true; continue; }
                return Set.of();
            }
            if (footer) return Set.of(); // Never ignore trailing Account rows after a disclaimer.
            var labels = row.stream().map(String::trim).toList();
            if (summary && labels.containsAll(SUMMARY_COLUMNS)) {
                if (new HashSet<>(labels).size() != labels.size() || labels.contains("Account number")) return Set.of();
                header = labels; sawHeader = true; continue;
            }
            if (header == null || row.size() < header.size()
                    || row.subList(header.size(), row.size()).stream().anyMatch(v -> !v.isBlank())) return Set.of();
            if (positions) {
                String account = row.get(header.indexOf("Account number")).trim();
                if (!account.matches("[A-Z0-9]+")) return Set.of();
                ids.add(account);
            }
        }
        return sawHeader ? Set.copyOf(ids) : Set.of();
    }
    private static String summaryAccount(List<String> row) {
        var values = row.stream().filter(value -> !value.isBlank()).map(String::trim).toList();
        if (values.size() != 1) return null;
        var section = SUMMARY_ACCOUNT.matcher(values.getFirst());
        return section.matches() ? section.group(1) : null;
    }
    private static boolean sourceFooter(String value) {
        // Existing Fidelity export footers; an arbitrary unclassified record is not a footer.
        return List.of("Date downloaded ", "The data and information in this spreadsheet ",
                "informational purposes only,", "recommendation for any security or insurance product ",
                "exported and is subject to change.", "purposes. For more information on the data ",
                "Brokerage services are provided by Fidelity ", "Financial Services LLC",
                "Fidelity Insurance Agency, Inc.,", "*Options trading entails ",
                "Your positions, whenever possible,", "There are additional costs associated with option strategies ",
                "*Option Summary does not exclude wash sales ", "Fidelity Brokerage Services LLC,")
                .stream().anyMatch(value::startsWith);
    }
    public static String sha(byte[] bytes) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
    public Processed ingest(String account, String filename, String type, byte[] bytes, String requestId) throws Exception {
        if (brokerAccount(account) == null) throw new IllegalArgumentException("backend account binding missing");
        if (filename == null || filename.isBlank() || filename.length() > 255 || filename.contains("/") || filename.contains("\\") ||
                filename.chars().anyMatch(c -> c < 32 || c == 127)) throw new IllegalArgumentException("invalid original filename");
        if (!Set.of("POSITIONS", "BALANCES", "ACTIVITY", "OPTION_SUMMARY").contains(type)) throw new IllegalArgumentException("unsupported file type");
        if (bytes.length == 0 || bytes.length > MAX_BYTES) throw new IllegalArgumentException("CSV size must be 1..16777216 bytes");
        String hash = sha(bytes), id = UUID.randomUUID().toString(), now = Instant.now().toString(); boolean added;
        String importId = UUID.randomUUID().toString();
        // Commit source before parsing. A malformed CSV remains auditable and retryable.
        try (var c = DriverManager.getConnection(url)) {
            c.setAutoCommit(false);
            try (var q = c.prepareStatement("INSERT OR IGNORE INTO brokerage_artifact VALUES (?, ?, ?, 'text/csv', ?, ?, ?)")) {
                q.setString(1, account); q.setString(2, id); q.setString(3, hash); q.setInt(4, bytes.length);
                q.setBytes(5, bytes); q.setString(6, now); added = q.executeUpdate() != 0;
            }
            try (var q = c.prepareStatement("SELECT artifact_id FROM brokerage_artifact WHERE account=? AND sha256=?")) {
                q.setString(1, account); q.setString(2, hash); try (var rs = q.executeQuery()) { rs.next(); id = rs.getString(1); }
            }
            try (var q = c.prepareStatement("INSERT INTO brokerage_import VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 'source retained; processing pending')")) {
                q.setString(1, account); q.setString(2, importId); q.setString(3, id); q.setString(4, filename);
                q.setString(5, type); q.setString(6, now); q.executeUpdate();
            }
            c.commit();
        }
        return process(account, id, filename, type, requestId, added, importId);
    }
    public Processed retry(String account, String id, String filename, String type, String requestId) throws Exception {
        return process(account, id, filename, type, requestId, false, null);
    }
    private Processed process(String account, String id, String filename, String type, String requestId, boolean added, String existingImportId) throws Exception {
        var metadata = metadata(account, id).orElseThrow();
        if (filename == null || filename.isBlank()) filename = metadata.imports().isEmpty() ? "retained.csv" : metadata.imports().getLast().originalFilename();
        if (type == null) type = metadata.imports().isEmpty() ? "UNKNOWN" : metadata.imports().getLast().fileType();
        String importId = existingImportId == null ? UUID.randomUUID().toString() : existingImportId;
        if (existingImportId == null) try (var c = DriverManager.getConnection(url); var q = c.prepareStatement("INSERT INTO brokerage_import VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 'source retained; processing pending')")) {
            q.setString(1, account); q.setString(2, importId); q.setString(3, id); q.setString(4, filename);
            q.setString(5, type); q.setString(6, Instant.now().toString()); q.executeUpdate();
        }
        String status = "ACCEPTED", result;
        try {
            if (!accounts.get(account).map(a -> a.brokerAssociation().broker().equals("FIDELITY")).orElse(false))
                throw new IllegalArgumentException("unsupported brokerage evidence processing");
            var decoder = StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT).onUnmappableCharacter(CodingErrorAction.REPORT);
            String text = decoder.decode(ByteBuffer.wrap(content(account, id).orElseThrow())).toString();
            if (type.equals("POSITIONS")) {
                var s = FidelityPositions.parse(account, brokerAccount(account), filename, text, Instant.now().toString(), List.of(), accounts.identityNamespace(account));
                s = new PositionSnapshot(s.account(), s.brokerAccount(), s.accountName(), s.snapshotId(), s.evidenceDate(),
                        s.recordedAt(), s.sourceFile(), s.sourceSha256(), id, s.holdings(), s.associations(), s.excludedNonPositionRows());
                positions.admit(s);
                result = "Position snapshot admitted: " + s.snapshotId() + "; source date " + s.evidenceDate() + "; " + s.holdings().size() + " holdings; ledger unchanged";
            } else {
                // Only Positions currently has row-level multi-account attribution.
                // Preserve other mixed originals, but never admit unscoped rows.
                var scope = sourceScopes(account, filename, content(account, id).orElseThrow());
                if (!scope.established() || !scope.accountIds().equals(Set.of(account)))
                    throw new IllegalArgumentException("unsupported mixed-account row attribution");
                result = admitRows(account, id, filename, type, text);
            }
        } catch (Exception e) {
            status = "REJECTED";
            // Do not echo source data, SQL, credentials or parse payloads.
            result = "Source retained; evidence processing failed. Check CSV format, account attribution and export date. Prior admitted evidence preserved.";
        }
        try (var c = DriverManager.getConnection(url); var q = c.prepareStatement("UPDATE brokerage_import SET status=?, result=? WHERE account=? AND import_id=?")) {
            q.setString(1, status); q.setString(2, result); q.setString(3, account); q.setString(4, importId); q.executeUpdate();
        }
        return new Processed(requestId, id, importId, added, status, result);
    }
    private String admitRows(String account, String id, String filename, String type, String text) throws Exception {
        String broker = brokerAccount(account);
        var rows = FidelityPositions.csv(text.replaceFirst("^\uFEFF", ""));
        int header = -1;
        for (int i = 0; i < rows.size(); i++) {
            var row = rows.get(i);
            if (type.equals("ACTIVITY") && row.containsAll(List.of("Run Date", "Action", "Symbol", "Amount ($)")) ||
                type.equals("BALANCES") && row.containsAll(List.of("Balance", "Day change")) ||
                type.equals("OPTION_SUMMARY") && row.containsAll(List.of("Symbol", "Strategy", "Expiration & Strike", "Quantity"))) { header = i; break; }
        }
        if (header < 0) throw new IllegalArgumentException("unsupported export shape");
        // Some Fidelity exports omit account identity in content. Preserve the filename attribution explicitly.
        if (type.equals("OPTION_SUMMARY") ? !text.contains("Option Summary " + broker) :
                !filename.matches("(?:History|Balances)_for_Account_" + broker + "(?:[- (].*)?\\.csv"))
            throw new IllegalArgumentException("account attribution mismatch");
        var headers = rows.get(header); var occurrences = new HashMap<String, Integer>();
        int count = 0, newRows = 0, matches = 0;
        try (var c = DriverManager.getConnection(url)) {
            c.setAutoCommit(false);
            try (var evidence = c.prepareStatement("INSERT OR IGNORE INTO brokerage_evidence_row VALUES (?, ?, ?, ?, ?)");
                 var ledger = c.prepareStatement("INSERT OR IGNORE INTO brokerage_ledger_observation VALUES (?, ?, ?, ?, ?)")) {
                for (int i = header + 1; i < rows.size(); i++) {
                    var row = rows.get(i);
                    if (row.stream().allMatch(String::isBlank)) { if (count > 0) break; else continue; }
                    if (row.getFirst().startsWith("The data") || row.getFirst().startsWith("*") || row.getFirst().startsWith("Date downloaded")) break;
                    if (row.size() < headers.size()) throw new IllegalArgumentException("truncated source row");
                    var observed = new TreeMap<String, String>();
                    for (int col = 0; col < headers.size(); col++) observed.put(headers.get(col), row.get(col).trim());
                    String json = mapper.writeValueAsString(observed);
                    if (type.equals("ACTIVITY")) {
                        java.time.LocalDate.parse(observed.get("Run Date").replace('-', '/'), java.time.format.DateTimeFormatter.ofPattern("M/d/uuuu")
                                .withResolverStyle(java.time.format.ResolverStyle.STRICT));
                        if (observed.get("Action").isBlank()) throw new IllegalArgumentException("missing action");
                        String hash = FidelityPositions.digest(json); int occurrence = occurrences.merge(hash, 1, Integer::sum);
                        ledger.setString(1, account); ledger.setString(2, hash); ledger.setInt(3, occurrence);
                        ledger.setString(4, id); ledger.setString(5, json);
                        if (ledger.executeUpdate() != 0) newRows++; else matches++;
                    }
                    evidence.setString(1, account); evidence.setString(2, id); evidence.setInt(3, i + 1);
                    evidence.setString(4, type); evidence.setString(5, json); evidence.executeUpdate(); count++;
                }
                if (count == 0 && !type.equals("ACTIVITY")) throw new IllegalArgumentException("empty supported evidence");
                c.commit();
            } catch (Exception e) { c.rollback(); throw e; }
        }
        return count + " broker evidence rows admitted; ledger observations added=" + newRows + ", exact matches=" + matches +
                ". History coverage UNKNOWN; corrections and lifecycle reconciliation not established." +
                (type.equals("OPTION_SUMMARY") ? " Broker strategy presentation is not Position identity or share-ownership authority." :
                        " Account attribution uses original filename (content omits account identifier).");
    }
    public Inventory inventory(String account, String requestId) throws Exception {
        var artifacts = new ArrayList<Metadata>();
        try (var c = DriverManager.getConnection(url); var q = c.prepareStatement("SELECT artifact_id FROM brokerage_artifact WHERE account=? ORDER BY received_at, artifact_id")) {
            q.setString(1, account); try (var rs = q.executeQuery()) { while (rs.next()) artifacts.add(metadata(account, rs.getString(1)).orElseThrow()); }
        }
        return new Inventory(requestId, account, brokerAccount(account), "UNKNOWN", List.copyOf(artifacts));
    }
    public Optional<Metadata> metadata(String account, String id) throws Exception {
        try (var c = DriverManager.getConnection(url); var q = c.prepareStatement("SELECT * FROM brokerage_artifact WHERE account=? AND artifact_id=?")) {
            q.setString(1, account); q.setString(2, id);
            try (var rs = q.executeQuery()) {
                if (!rs.next()) return Optional.empty();
                var imports = new ArrayList<Attempt>();
                try (var p = c.prepareStatement("SELECT * FROM brokerage_import WHERE account=? AND artifact_id=? ORDER BY imported_at, import_id")) {
                    p.setString(1, account); p.setString(2, id);
                    try (var attempts = p.executeQuery()) { while (attempts.next()) imports.add(new Attempt(attempts.getString("import_id"), attempts.getString("original_filename"),
                            attempts.getString("file_type"), attempts.getString("imported_at"), attempts.getString("status"), attempts.getString("result"), sourcePeriod(attempts.getString("result")))); }
                }
                return Optional.of(new Metadata(id, account, rs.getString("sha256"), rs.getString("content_type"), rs.getLong("size_bytes"), rs.getString("received_at"), List.copyOf(imports)));
            }
        }
    }
    public Optional<byte[]> content(String account, String id) throws SQLException {
        try (var c = DriverManager.getConnection(url); var q = c.prepareStatement("SELECT payload FROM brokerage_artifact WHERE account=? AND artifact_id=?")) {
            q.setString(1, account); q.setString(2, id); try (var rs = q.executeQuery()) { return rs.next() ? Optional.of(rs.getBytes(1)) : Optional.empty(); }
        }
    }
    private static SourcePeriod sourcePeriod(String result) {
        var date = java.util.regex.Pattern.compile("source date (\\d{4}-\\d{2}-\\d{2})").matcher(result);
        return date.find() ? new SourcePeriod(date.group(1), date.group(1), "SNAPSHOT_EXPORT_DATE; day precision, not history coverage") : null;
    }
}
