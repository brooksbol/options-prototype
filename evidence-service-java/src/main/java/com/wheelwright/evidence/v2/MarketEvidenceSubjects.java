package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

/** Backend-owned relevant subjects, not a client universe or an acquisition engine. */
@Component
public class MarketEvidenceSubjects {
    public record Subject(String symbol,List<String> sources) {}
    public record Coverage(String source,String accountId,String status,String snapshotId,String evidenceDate,String recordedAt,List<String> qualifications) {}
    public record Selection(String requestId,String selectedAt,String policy,boolean complete,List<Subject> subjects,List<Coverage> coverage) {}
    private final SqliteEvidenceStore store;
    private final AccountDirectory accounts;
    private final PositionReadService positions;
    private final Set<String> monitoringUsers;
    private static final Pattern TT_OPTION=Pattern.compile("([A-Z][A-Z0-9.]{0,9}) +[0-9]{6}[CP][0-9]{8}");
    private static final Pattern FIDELITY_OPTION=Pattern.compile("-?([A-Z.]+?)[0-9]{6}[CP][0-9]+(?:\\.[0-9]+)?");
    @Autowired
    public MarketEvidenceSubjects(SqliteEvidenceStore store,AccountDirectory accounts,PositionReadService positions,
            @Value("${wheelwright.market-evidence.monitoring-users:}") String users) {
        this.store=store;this.accounts=accounts;this.positions=positions;
        var ids=new HashSet<String>();
        if(!users.isBlank())for(String id:users.split(",",-1)) {id=id.trim();if(!UserDirectory.validId(id))throw new IllegalArgumentException("canonical monitoring User IDs required");ids.add(id);}
        monitoringUsers=Set.copyOf(ids);
    }
    public Selection select(BearerAuthenticator.Principal user,String request)throws Exception {
        var symbols=new TreeMap<String,Set<String>>();var coverage=new ArrayList<Coverage>();boolean complete=true;
        Instant selected=Instant.now();int holdings=0;
        for(var account:accounts.list()) {
            if(!user.hasGrant("account.positions.read:"+account.id()))continue;
            var read=positions.read(account.id(),request,selected);
            if(read.isEmpty()) {complete=false;coverage.add(new Coverage("HOLDINGS",account.id(),"UNAVAILABLE",null,null,null,List.of("No admitted holdings observation; absence is not an empty Account.")));continue;}
            var snapshot=read.get();var issues=new ArrayList<String>();var notes=new ArrayList<String>();int nonEquity=0;
            var reported=positions.reportedUnderlyingSymbols(account.id(),snapshot.snapshotId());
            for(var position:snapshot.positions())for(var leg:position.constituents()) {
                if(++holdings>25000)throw new IllegalStateException("selection capacity exceeded");
                var h=leg.holding();if(h.quantity()==null){issues.add("Holding quantity unavailable: "+h.holdingId());continue;}
                if(h.quantity().signum()==0)continue;
                if("Bonds/Fixed income".equals(h.kind())){nonEquity++;continue;} // Treasury/CUSIP has no equity underlying.
                String symbol=underlying(h,account.brokerAssociation().broker());
                if(symbol==null&&"FIDELITY".equals(account.brokerAssociation().broker())&&"Options".equals(h.kind())) {
                    var adjusted=Pattern.compile("-?([A-Z.]+[0-9]+)[0-9]{6}[CP][0-9]+(?:\\.[0-9]+)?").matcher(h.contract());
                    if(adjusted.matches()) {var identity=reported.get(adjusted.group(1));if(identity!=null){symbol=identity.symbol();notes.add("Adjusted option underlying explicitly reported by same-day broker summary; artifact "+identity.provenance().artifactId()+"; rows "+identity.provenance().sourceRows());}}
                }
                if(symbol==null){issues.add("Underlying identity unresolved: "+h.holdingId());continue;}
                symbols.computeIfAbsent(symbol,k->new TreeSet<>()).add("HOLDINGS");
            }
            if(!issues.isEmpty())complete=false;
            if(nonEquity>0)notes.add(nonEquity+" fixed-income holdings have no equity underlying; no stock-symbol acquisition requested.");
            notes.addAll(issues);if(issues.isEmpty())notes.add("Latest admitted retained holdings; brokerage freshness and atomic portfolio snapshot are not established.");
            coverage.add(new Coverage("HOLDINGS",account.id(),issues.isEmpty()?"AVAILABLE":"INCOMPLETE",snapshot.snapshotId(),snapshot.evidenceDate(),snapshot.recordedAt(),
                    List.copyOf(notes)));
        }
        var monitored=store.getMonitoredSymbols();String status;
        if(monitored.isEmpty())status="EMPTY";
        else if(monitoringUsers.isEmpty()){status="UNAVAILABLE";complete=false;}
        else if(!monitoringUsers.contains(user.userId()))status="NOT_AUTHORIZED";
        else {
            status="AVAILABLE";
            for(String raw:monitored) {
                String symbol=canonical(raw);if(symbol==null){status="INCOMPLETE";complete=false;continue;}
                symbols.computeIfAbsent(symbol,k->new TreeSet<>()).add("MONITORING");
            }
        }
        coverage.add(new Coverage("MONITORING",null,status,null,null,null,List.of(status.equals("UNAVAILABLE")?
                "Retained monitoring source has no configured User visibility binding; no symbols disclosed or silently assumed absent.":
                "Explicit last-declared monitoring membership; source freshness unknown. Visibility is configured in the backend; no holdings-only substitution.")));
        if(symbols.size()>10000)throw new IllegalStateException("selection capacity exceeded");
        return new Selection(request,selected.toString(),"AUTHORIZED_HOLDINGS_UNION_CONFIGURED_MONITORING",complete,
                symbols.entrySet().stream().map(e->new Subject(e.getKey(),List.copyOf(e.getValue()))).toList(),List.copyOf(coverage));
    }
    static String underlying(PositionSnapshot.Constituent h,String broker) {
        String symbol=h.contract();
        if("Options".equals(h.kind())) {
            var m=("TASTYTRADE".equals(broker)?TT_OPTION:FIDELITY_OPTION).matcher(symbol);
            if(!m.matches())return null;symbol=m.group(1);
        }
        return canonical(symbol);
    }
    private static String canonical(String symbol) {
        if(symbol==null)return null;
        String normalized=symbol.toUpperCase(Locale.ROOT);
        try{PathSymbolCodec.encode(normalized);return normalized;}catch(IllegalArgumentException e){return null;}
    }
}
