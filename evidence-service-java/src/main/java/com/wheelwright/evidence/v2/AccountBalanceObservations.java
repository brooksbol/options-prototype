package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.JsonNode;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.charset.*;
import java.security.MessageDigest;
import java.sql.*;
import java.time.*;
import java.util.*;
import java.util.regex.Pattern;

/** Pure retained-source projection. Broker balance dialects remain distinct; no capacity policy. */
@Component
public class AccountBalanceObservations {
    public record Field(String brokerField, String meaning, String status, BigDecimal value, String sourceLocator) {}
    public record Source(String artifactId, String sha256, String fileType, String receivedAt,
                         String observedAt, String observationDate, String exportedAt, String timeStatus) {}
    public record Observation(String accountId, String broker, String environment, String currency,
                              String unit, Source source, List<Field> fields) {}
    public record Read(String requestId, String accountId, String currentness, String historyCoverage,
                       List<Observation> observations, List<String> qualifications) {}
    private final String url;
    private final BrokerageArtifacts artifacts;
    private final AccountDirectory accounts;
    private static final Map<String,String> TT = Map.ofEntries(
        Map.entry("cash-balance", "BROKER_REPORTED_SETTLED_CASH"),
        Map.entry("equity-buying-power", "BROKER_REPORTED_EQUITY_BUYING_POWER"),
        Map.entry("derivative-buying-power", "BROKER_REPORTED_OPTIONS_BUYING_POWER"),
        Map.entry("day-trading-buying-power", "BROKER_REPORTED_DAY_TRADING_BUYING_POWER"),
        Map.entry("margin-equity", "BROKER_REPORTED_MARGIN_EQUITY"),
        Map.entry("maintenance-requirement", "BROKER_REPORTED_MAINTENANCE_REQUIREMENT"),
        Map.entry("reg-t-margin-requirement", "BROKER_REPORTED_REG_T_REQUIREMENT"),
        Map.entry("maintenance-excess", "BROKER_REPORTED_MAINTENANCE_EXCESS"),
        Map.entry("futures-margin-requirement", "BROKER_REPORTED_FUTURES_REQUIREMENT"),
        Map.entry("used-derivative-buying-power", "BROKER_REPORTED_USED_OPTIONS_BUYING_POWER"),
        Map.entry("pending-margin-interest", "BROKER_REPORTED_PENDING_MARGIN_INTEREST"),
        Map.entry("cash-available-to-withdraw", "BROKER_REPORTED_WITHDRAWABLE_CASH"),
        Map.entry("net-liquidating-value", "BROKER_REPORTED_NET_LIQUIDATING_VALUE"));
    private static final Set<String> FIDELITY = Set.of("Available without margin impact", "Settled cash",
        "Available to trade (all settled)", "Margin buying power", "Non-margin buying power",
        "Cash reserved for options strategies", "Cash reserved for options", "Margin credit/debit",
        "Margin debit", "Margin credit", "Total account value", "Cash & credits", "Cash & margin credits",
        "Accrued interest", "Margin interest accrued");
    private static final Pattern DECIMAL = Pattern.compile("[+-]?(?:[0-9]+(?:\\.[0-9]+)?|\\.[0-9]+)");
    @org.springframework.beans.factory.annotation.Autowired
    public AccountBalanceObservations(SqliteEvidenceStore store, BrokerageArtifacts artifacts, AccountDirectory accounts) throws SQLException {
        this(store.getConnection().getMetaData().getURL(),artifacts,accounts);
    }
    AccountBalanceObservations(String url, BrokerageArtifacts artifacts, AccountDirectory accounts) {
        this.url=url; this.artifacts=artifacts; this.accounts=accounts;
    }
    public Read read(String account, String artifactId, String requestId, BearerAuthenticator.Principal caller) throws Exception {
        if(!caller.hasGrant("account.artifacts.read:"+account))throw new SecurityException();
        var owner=accounts.get(account).orElseThrow();
        var observations=new ArrayList<Observation>(); long bytes=0;
        try(var c=DriverManager.getConnection(url)) {
            c.setAutoCommit(false);
            try(var q=c.prepareStatement("SELECT b.*,i.file_type,i.original_filename FROM brokerage_artifact b JOIN brokerage_import i USING(account,artifact_id) WHERE b.account=? AND i.status='ACCEPTED' AND i.file_type IN ('BALANCES','API_BALANCES') AND (? IS NULL OR b.artifact_id=?) ORDER BY b.received_at,b.artifact_id,i.import_id")) {
                q.setString(1,account);q.setString(2,artifactId);q.setString(3,artifactId);var seen=new HashSet<String>();
                try(var rs=q.executeQuery()){while(rs.next()) {
                    String id=rs.getString("artifact_id");if(!seen.add(id))continue;
                    byte[] payload=rs.getBytes("payload");bytes+=payload.length;
                    if(bytes>32L*1024*1024||seen.size()>200)throw new SQLException("balance read capacity exceeded");
                    String hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(payload));
                    if(!hash.equals(rs.getString("sha256")))throw new SQLException("retained hash mismatch");
                    var scope=artifacts.sourceScopes(account,rs.getString("original_filename"),payload);
                    if(!scope.established()||!scope.accountIds().equals(Set.of(account)))throw new SecurityException();
                    String type=rs.getString("file_type");String broker=owner.brokerAssociation().broker();
                    if(broker.equals("TASTYTRADE")&&type.equals("API_BALANCES"))
                        observations.add(tastytrade(account,owner.brokerAssociation().accountNumber(),id,hash,rs.getString("received_at"),payload));
                    else if(broker.equals("FIDELITY")&&type.equals("BALANCES"))
                        observations.add(fidelity(account,id,hash,rs.getString("received_at"),payload));
                    else throw new SQLException("unsupported source dialect");
                }}
            }
            c.commit();
        }
        return new Read(requestId,account,"NOT_ESTABLISHED","UNKNOWN",List.copyOf(observations),List.of(
            "Retained accepted originals only; no provider acquisition or claim of current buying power after trades.",
            "Broker-specific fields are independent reported quantities; missing or invalid is unknown, never zero.",
            "Receipt order is not source-time order. No latest/current selection or atomic cut with holdings or fills.",
            "Buying power is not cash, margin requirement is not debt, used buying power is not per-put collateral.",
            "No strategy eligibility, actual margin borrowing, order preview, Operating Regime allocation or deploy recommendation established.",
            "Up to 200 originals / 32 MiB; capacity failure returns no partial collection. artifactId selects one retained original."));
    }
    static Observation tastytrade(String account,String brokerAccount,String id,String hash,String received,byte[] payload)throws Exception {
        if(!TastytradeCashBalance.sourceAccount(payload,brokerAccount))throw new SecurityException();
        var data=TastytradeHoldings.document(payload).path("data");
        String currency=data.path("currency").asText();
        if(!currency.matches("[A-Z]{3}"))throw new IllegalArgumentException("invalid source currency");
        String observed=null,day=null,timeStatus="UNKNOWN";
        try {var instant=Instant.parse(data.path("updated-at").asText());
            if(!instant.isAfter(Instant.parse(received).plusSeconds(60))){observed=instant.toString();timeStatus="SOURCE_INSTANT";}
            else timeStatus="INVALID_SOURCE_INSTANT";
        }catch(DateTimeException invalid){if(data.hasNonNull("updated-at"))timeStatus="INVALID_SOURCE_INSTANT";}
        try {day=LocalDate.parse(data.path("snapshot-date").asText()).toString();}catch(DateTimeException ignored){}
        var fields=new ArrayList<Field>();
        for(String key:new TreeSet<>(TT.keySet()))fields.add(field(key,TT.get(key),data.get(key),"/data/"+key));
        return new Observation(account,"TASTYTRADE","PRODUCTION",currency,"MONEY",
            new Source(id,hash,"API_BALANCES",received,observed,day,null,timeStatus),List.copyOf(fields));
    }
    private static Field field(String key,String meaning,JsonNode raw,String locator) {
        if(raw==null||raw.isNull())return new Field(key,meaning,"MISSING",null,locator);
        BigDecimal value=null;
        try {if(!raw.isTextual()&&!raw.isNumber())throw new IllegalArgumentException();value=decimal(raw.asText());}
        catch(IllegalArgumentException invalid){return new Field(key,meaning,"INVALID",null,locator);}
        return new Field(key,meaning,"REPORTED",value,locator);
    }
    private static BigDecimal decimal(String raw) {
        if(raw.length()>80||!DECIMAL.matcher(raw).matches())throw new IllegalArgumentException();
        var number=new BigDecimal(raw);if(number.precision()>30||Math.abs(number.scale())>12)throw new IllegalArgumentException();return number;
    }
    static Observation fidelity(String account,String id,String hash,String received,byte[] payload)throws Exception {
        String text=StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(payload)).toString().replaceFirst("^\\uFEFF", "");
        var rows=FidelityPositions.csv(text);if(rows.isEmpty())throw new IllegalArgumentException();
        var header=rows.getFirst();int label=0,balance=header.indexOf("Balance");
        if(balance<0)throw new IllegalArgumentException();
        var fields=new TreeMap<String,Field>();
        for(int n=1;n<rows.size();n++) {
            var row=rows.get(n);if(row.isEmpty())continue;String key=row.get(label).trim();if(!FIDELITY.contains(key))continue;
            String locator="row:"+(n+1)+"/Balance";Field value;
            try {if(row.size()<=balance)throw new IllegalArgumentException();
                String raw=row.get(balance).trim().replace("$","").replace(",","");
                if(raw.startsWith("(")&&raw.endsWith(")"))raw="-"+raw.substring(1,raw.length()-1);
                value=new Field(key,"FIDELITY_REPORTED_BALANCE","REPORTED",decimal(raw),locator);
            }catch(IllegalArgumentException invalid){value=new Field(key,"FIDELITY_REPORTED_BALANCE","INVALID",null,locator);}
            if(fields.containsKey(key))value=new Field(key,"FIDELITY_REPORTED_BALANCE","AMBIGUOUS",null,null);
            fields.put(key,value);
        }
        String exported=null,timeStatus="UNKNOWN";
        var dates=new ArrayList<String>();
        for(var row:rows)if(row.size()==1) {
            var match=Pattern.compile("Date downloaded (\\d{2}/\\d{2}/\\d{4}) (\\d{1,2}:\\d{2} [AP]M) ET").matcher(row.getFirst().trim());
            if(match.matches())dates.add(match.group(1)+" "+match.group(2));
        }
        if(dates.size()==1)try {
            var format=java.time.format.DateTimeFormatter.ofPattern("MM/dd/uuuu h:mm a",Locale.US).withResolverStyle(java.time.format.ResolverStyle.STRICT);
            var local=LocalDateTime.parse(dates.getFirst(),format);var offsets=ZoneId.of("America/New_York").getRules().getValidOffsets(local);
            if(offsets.size()==1){exported=local.atOffset(offsets.getFirst()).toString();timeStatus="EXPORT_MINUTE";}else timeStatus="INVALID_EXPORT_TIME";
        }catch(DateTimeException invalid){timeStatus="INVALID_EXPORT_TIME";}
        else if(dates.size()>1)timeStatus="INVALID_EXPORT_TIME";
        // Export time is distinct from fact observation time; currency is not explicit in this dialect.
        return new Observation(account,"FIDELITY","BROKER_EXPORT",null,"SOURCE_MONETARY_UNIT",
            new Source(id,hash,"BALANCES",received,null,null,exported,timeStatus),List.copyOf(fields.values()));
    }
}
