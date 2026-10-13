package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.nio.charset.*;
import java.nio.ByteBuffer;
import java.security.MessageDigest;
import java.sql.*;
import java.time.*;
import java.time.format.*;
import java.util.*;
import java.util.regex.Pattern;

/** Read-only v1 Portfolio Capital projection. No acquisition, storage, or daily resampling.
 * Pair only unique, identical reported export minutes. These are two-source composites,
 * never atomic brokerage snapshots. Different-minute sources are never paired by proximity.
 */
@Component
public class PortfolioCapitalHistory {
    public static final String MEASURE = "PORTFOLIO_CAPITAL_V1";
    public record Source(String artifactId, String sha256, String receivedAt, String fileType,
            String exportedAt, String timestampPrecision, String quoteDate, List<Integer> sourceRows) {}
    public record Observation(String accountId, String evidenceDate, String exportMinute,
            String status, BigDecimal portfolioCapital, BigDecimal totalAccountValue,
            BigDecimal shortOptionMtm, Source balances, List<Source> optionSummaries,
            List<String> qualifications) {}
    public record Read(String requestId, String accountId, String measure, String formula,
            String pairingBasis, String historyCoverage, int balanceArtifacts, int optionSummaryArtifacts,
            List<Observation> observations) {}
    private record Parsed(Source source, BigDecimal value, String failure) {}
    private final String url;
    private final BrokerageArtifacts artifacts;
    @Autowired
    public PortfolioCapitalHistory(SqliteEvidenceStore store, BrokerageArtifacts artifacts) throws SQLException {
        this.url=store.getConnection().getMetaData().getURL(); this.artifacts=artifacts;
    }
    private static final Pattern DOWNLOADED=Pattern.compile("Date downloaded (\\d{2}/\\d{2}/\\d{4}) (\\d{1,2}:\\d{2} [AP]M) ET");
    private static final DateTimeFormatter EXPORT=DateTimeFormatter.ofPattern("MM/dd/uuuu h:mm a",Locale.US).withResolverStyle(ResolverStyle.STRICT);
    private static final Pattern OPTION=Pattern.compile("(?:\\w+\\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\\s+\\d{1,2}\\s+\\d{4}\\s+\\$?[\\d.]+\\s+(?:CALL|PUT)|-?[A-Z]+\\d{6}[CP][\\d.]+)",Pattern.CASE_INSENSITIVE);
    public Read read(String account, String requestId, BearerAuthenticator.Principal caller) throws Exception {
        var parsed=new ArrayList<Parsed>(); long bytes=0;
        // Pin originals and accepted processing metadata to one committed SQLite read view.
        try(var c=DriverManager.getConnection(url)) {
            c.setAutoCommit(false);
            try(var q=c.prepareStatement("SELECT b.*,i.file_type,i.original_filename FROM brokerage_artifact b JOIN brokerage_import i USING(account,artifact_id) WHERE b.account=? AND i.status='ACCEPTED' AND i.file_type IN ('BALANCES','OPTION_SUMMARY') ORDER BY b.artifact_id,i.import_id")) {
                q.setString(1,account); var seen=new HashSet<String>();
                try(var rs=q.executeQuery()) {while(rs.next()) {
                    String id=rs.getString("artifact_id"); if(!seen.add(id))continue;
                    byte[] payload=rs.getBytes("payload"); bytes+=payload.length;
                    if(bytes>32L*1024*1024||seen.size()>10000)throw new SQLException("capacity exceeded");
                    String hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(payload));
                    if(!hash.equals(rs.getString("sha256")))throw new SQLException("retained hash mismatch");
                    var scope=artifacts.sourceScopes(account,rs.getString("original_filename"),payload);
                    // Do not project unknown/mixed source originals through a weaker read boundary.
                    if(!scope.established()||scope.accountIds().stream().anyMatch(a->!caller.hasGrant("account.artifacts.read:"+a)))
                        throw new SecurityException("source scope not authorized");
                    if(!scope.accountIds().equals(Set.of(account)))throw new SecurityException("single Account source required");
                    parsed.add(parse(id,hash,rs.getString("received_at"),rs.getString("file_type"),payload));
                }}
            }
            c.commit();
        }
        var summaries=new HashMap<String,List<Parsed>>(); var balances=new HashMap<String,List<Parsed>>();
        for(var p:parsed)if(p.source.exportedAt()!=null) {
            var target=p.source.fileType().equals("BALANCES")?balances:summaries;
            target.computeIfAbsent(p.source.exportedAt(),k->new ArrayList<>()).add(p);
        }
        var result=new ArrayList<Observation>(); int summaryCount=0;
        for(var b:parsed) {
            if(b.source.fileType().equals("OPTION_SUMMARY")){summaryCount++;continue;}
            String time=b.source.exportedAt();var matches=summaries.getOrDefault(time,List.of());
            String status=b.failure;
            if(status==null)status=balances.get(time).size()!=1||matches.size()>1?"AMBIGUOUS_EXPORT_MINUTE":matches.isEmpty()?"UNMATCHED_EXPORT_MINUTE":matches.getFirst().failure;
            BigDecimal mtm=status==null?matches.getFirst().value:null;
            BigDecimal pc=status==null?b.value.subtract(mtm):null;
            result.add(new Observation(account,time==null?null:time.substring(0,10),time,status==null?"COMPOSITE":status,
                pc,b.value,mtm,b.source,matches.stream().map(p->p.source).toList(),List.of(
                    "Two-source calculation; identical reported export minute does not establish an atomic brokerage observation.",
                    "Export timestamps have MINUTE precision in America/New_York; quote time and import time are separate.",
                    "No historical knowledge replay, daily completeness, interpolation, or broker NAV claim.")));
        }
        result.sort(Comparator.comparing(Observation::exportMinute,Comparator.nullsLast(Comparator.naturalOrder())).thenComparing(o->o.balances.artifactId));
        return new Read(requestId,account,MEASURE,"totalAccountValue - shortOptionMtm","UNIQUE_IDENTICAL_EXPORT_MINUTE_COMPOSITE","UNKNOWN",
            result.size(),summaryCount,List.copyOf(result));
    }
    private static Parsed parse(String id,String hash,String received,String type,byte[] bytes) {
        String time=null,quoteDate=null;var lines=new ArrayList<Integer>(); BigDecimal value=null;String failure=null;
        try {
            String text=StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString().replaceFirst("^\\uFEFF", "");
            var rows=FidelityPositions.csv(text);int dates=0;
            for(var row:rows)if(row.size()==1) {
                var quote=Pattern.compile("Quote data as of (\\d{2}/\\d{2}/\\d{4})[.]").matcher(row.getFirst().trim());
                if(quote.matches())quoteDate=LocalDate.parse(quote.group(1),DateTimeFormatter.ofPattern("MM/dd/uuuu")).toString();
            }
            for(var row:rows)if(row.size()==1) {var m=DOWNLOADED.matcher(row.getFirst().trim());if(m.matches()) {
                var local=LocalDateTime.parse(m.group(1)+" "+m.group(2),EXPORT);
                var offsets=ZoneId.of("America/New_York").getRules().getValidOffsets(local);
                if(offsets.size()!=1)throw new IllegalArgumentException("ambiguous timestamp");
                time=local.atOffset(offsets.getFirst()).format(DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mmxxx"));dates++;
            }}
            if(dates!=1)throw new IllegalArgumentException("missing/conflicting export timestamp");
            if(type.equals("BALANCES")) {
                for(int i=0;i<rows.size();i++)if(!rows.get(i).isEmpty()&&rows.get(i).getFirst().trim().equalsIgnoreCase("Total account value")) {
                    if(value!=null)throw new IllegalArgumentException("conflicting totals");
                    value=money(rows.get(i).get(1));lines.add(i+1);
                }
                if(value==null)throw new IllegalArgumentException("missing total");
            } else {
                int header=-1;List<String> cols=null;
                for(int i=0;i<rows.size();i++)if(rows.get(i).containsAll(List.of("Symbol","Expiration & Strike","Quantity","Market value"))) {
                    if(header>=0)throw new IllegalArgumentException("multiple summaries");header=i;cols=rows.get(i);
                }
                if(header<0)throw new IllegalArgumentException("missing summary header");
                value=BigDecimal.ZERO;int holdings=0;
                for(int i=header+1;i<rows.size();i++) {
                    var row=rows.get(i);if(row.isEmpty()||row.stream().allMatch(String::isBlank))continue;
                    if(row.size()==1)break;
                    if(row.size()<cols.size())throw new IllegalArgumentException("truncated row");
                    String contract=row.get(cols.indexOf("Expiration & Strike")).trim();
                    BigDecimal quantity=money(row.get(cols.indexOf("Quantity")));
                    if(!contract.equalsIgnoreCase("Shares")&&!OPTION.matcher(contract).matches())throw new IllegalArgumentException("unrecognized option geometry");
                    holdings++;
                    if(!contract.equalsIgnoreCase("Shares")&&quantity.signum()<0) {
                        var mtm=money(row.get(cols.indexOf("Market value")));
                        if(mtm.signum()>0)throw new IllegalArgumentException("positive short liability");
                        value=value.add(mtm);lines.add(i+1);
                    }
                }
                if(holdings==0)throw new IllegalArgumentException("missing holdings");
            }
        } catch(Exception e) {value=null;failure="INSUFFICIENT_SOURCE_EVIDENCE";}
        return new Parsed(new Source(id,hash,received,type,time,"MINUTE",quoteDate,List.copyOf(lines)),value,failure);
    }
    private static BigDecimal money(String value) {
        String s=value.trim().replace("$","").replace(",","");
        if(!s.matches("[+-]?(?:[0-9]+(?:\\.[0-9]+)?|\\.[0-9]+)"))throw new IllegalArgumentException("missing numeric evidence");
        return new BigDecimal(s);
    }
}
