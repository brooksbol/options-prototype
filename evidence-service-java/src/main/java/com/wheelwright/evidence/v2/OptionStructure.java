package com.wheelwright.evidence.v2;

import java.math.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Snapshot-bound open-option construction. No geometry grouping or lifecycle inference. */
public final class OptionStructure {
    private OptionStructure() {}
    public record Point(BigDecimal underlyingPrice,BigDecimal value) {}
    public record Geometry(String basis,List<Point> knots,BigDecimal leftSlope,BigDecimal rightSlope,List<BigDecimal> strikes) {}
    public record Range(String kind,BigDecimal lower,BigDecimal upper) {}
    public record Collateral(String kind,String symbol,BigDecimal quantity,String currency) {}
    public record TermsSource(String sourceFile,String sha256,int sourceItem) {}
    public record Position(String positionId,String sourcePositionId,String identityBasis,String membership,
            String underlying,BigDecimal quantity,String expiration,Long dte,String firstOpeningFillAt,
            String strategy,int complexity,Geometry geometry,Range range,List<Collateral> collateral,
            List<String> holdingIds,List<TermsSource> termsSources,List<String> qualifications) {}
    public record Read(String requestId,String accountId,String broker,String snapshotId,String evidenceDate,String recordedAt,
            String evaluatedAt,String sourceFile,String sourceSha256,String artifactId,List<Position> positions,
            List<String> refreshReasons,List<String> qualifications) {}

    public static Read project(PositionSnapshot snapshot,String requestId,Instant now) {
        var held=new LinkedHashMap<String,PositionSnapshot.Constituent>();
        for(var h:snapshot.holdings())if(held.put(h.holdingId(),h)!=null)throw new IllegalArgumentException("duplicate holding");
        FidelityPositions.validateAssociations(snapshot.associations(),held.keySet());
        var terms=OptionContractTerms.read(snapshot.instrumentEvidence());
        var positions=new ArrayList<Position>();var allocated=new HashSet<String>();var refresh=new ArrayList<String>();
        LocalDate today=now.atZone(ZoneId.of("America/New_York")).toLocalDate();
        for(var a:snapshot.associations()) {
            var parts=a.holdingIds().stream().map(held::get).toList();allocated.addAll(a.holdingIds());
            add(snapshot,a.positionId(),"EXPLICIT_SNAPSHOT_ASSOCIATION",a.authority(),parts,terms,today,now,positions,refresh);
        }
        for(var h:held.values())if(!allocated.contains(h.holdingId()))
            add(snapshot,"position-"+h.holdingId().substring(8),"OBSERVED_CONTRACT_AND_CUSTODY",null,List.of(h),terms,today,now,positions,refresh);
        positions.sort(Comparator.comparingInt(Position::complexity).reversed()
                .thenComparing(Position::firstOpeningFillAt,Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Position::underlying,Comparator.nullsLast(Comparator.naturalOrder())).thenComparing(Position::positionId));
        return new Read(requestId,snapshot.account(),snapshot.observation()==null?"FIDELITY":"TASTYTRADE",snapshot.snapshotId(),
                snapshot.evidenceDate(),snapshot.recordedAt(),now.toString(),snapshot.sourceFile(),snapshot.sourceSha256(),snapshot.artifactId(),
                List.copyOf(positions),List.copyOf(new LinkedHashSet<>(refresh)),List.of(
                "Retained nonzero option inventory, not a brokerage-current or confirmed-open lifecycle assertion.",
                "Expiration uses a qualified exact expiration instant when present, otherwise a prior New York calendar date; same-day cutoff is unknown without terms. No executed close is inferred.",
                "Explicit whole-holding snapshot membership only; no inferred brokerage membership, opening timestamp or occurrence continuity.",
                "Geometry is gross expiration intrinsic value before opening premium, basis, fees and execution effects; not current P/L.",
                "Qualified spot, option quote age and management evaluation are unavailable in this bounded construction view."));
    }
    private static void add(PositionSnapshot snapshot,String sourceId,String basis,String authority,List<PositionSnapshot.Constituent> parts,
            Map<OptionContractTerms.Identity,OptionContractTerms.Terms> terms,LocalDate today,Instant now,List<Position> out,List<String> refresh) {
        var expirations=new TreeMap<String,List<PositionSnapshot.Constituent>>();
        for(var h:parts) {
            if(!"Options".equals(h.kind())||h.quantity().signum()==0)continue;
            var identity=OptionContractTerms.identity(h);var contract=identity==null?null:terms.get(identity);
            if(h.expiration()!=null&&LocalDate.parse(h.expiration()).isBefore(today)||contract!=null&&contract.expiresAt()!=null&&!now.isBefore(contract.expiresAt())) {
                if(snapshot.observation()==null)refresh.add("EXPIRED_OPTIONS_IN_RETAINED_FIDELITY_SNAPSHOT");continue;
            }
            expirations.computeIfAbsent(h.expiration()==null?"UNKNOWN:"+h.holdingId():h.expiration(),k->new ArrayList<>()).add(h);
        }
        for(var e:expirations.entrySet()) {
            var options=e.getValue();var notes=new ArrayList<String>();
            if(expirations.size()>1)notes.add("Explicit association split by expiration for display; no shared lifecycle asserted.");
            // Non-option collateral is usable only in an unsplit explicit association.
            long originalExpirations=parts.stream().filter(h->"Options".equals(h.kind())&&h.quantity().signum()!=0)
                    .map(h->h.expiration()==null?"UNKNOWN:"+h.holdingId():h.expiration()).distinct().count();
            var collateral=authority!=null&&originalExpirations==1?parts.stream().filter(h->!"Options".equals(h.kind())&&h.quantity().signum()>0).toList():List.<PositionSnapshot.Constituent>of();
            out.add(position(snapshot.account(),sourceId,basis,authority,options,collateral,terms,today,notes));
        }
    }
    private static Position position(String account,String sourceId,String basis,String authority,List<PositionSnapshot.Constituent> options,
            List<PositionSnapshot.Constituent> collateral,Map<OptionContractTerms.Identity,OptionContractTerms.Terms> terms,LocalDate today,List<String> notes) {
        var ids=options.stream().map(OptionContractTerms::identity).toList();
        String symbol=ids.stream().anyMatch(Objects::isNull)||ids.stream().map(OptionContractTerms.Identity::root).distinct().count()!=1?null:ids.getFirst().root();
        if(symbol!=null&&!symbol.matches("[A-Z.]+")&&!ids.stream().allMatch(terms::containsKey))symbol=null;
        String expiry=options.getFirst().expiration();Long dte=expiry==null?null:ChronoUnit.DAYS.between(today,LocalDate.parse(expiry));
        BigInteger units=BigInteger.ZERO;
        for(var h:options)try{units=units.gcd(h.quantity().abs().toBigIntegerExact());}catch(ArithmeticException e){units=BigInteger.ZERO;break;}
        BigDecimal quantity=units.signum()>0?new BigDecimal(units):null;
        var verified=ids.stream().allMatch(id->id!=null&&terms.containsKey(id));
        var sources=verified?ids.stream().map(terms::get).map(t->new TermsSource(t.sourceFile(),t.sha256(),t.sourceItem())).toList():List.<TermsSource>of();
        var actual=new ArrayList<Collateral>();
        for(var h:collateral)if(symbol!=null&&h.contract().equals(symbol)&&Set.of("Stocks","ETFs").contains(h.kind()))
            actual.add(new Collateral("SHARES",symbol,h.quantity(),null));
        boolean understoodCollateral=actual.size()==collateral.size();
        Geometry geometry=verified&&symbol!=null&&quantity!=null&&understoodCollateral?geometry(options,ids,actual):null;
        String strategy=geometry==null?(options.size()==1?"SINGLE_OPTION":"UNKNOWN"):classify(options,ids,actual);
        int complexity=switch(strategy){case "IRON_CONDOR"->4;case "PUT_CREDIT_VERTICAL","CALL_CREDIT_VERTICAL"->2;case "NONSTANDARD"->options.size();default->1;};
        Range range=geometry==null?null:range(strategy,ids,options);
        if(authority==null)notes.add("Managed membership unknown; individual option inventory fallback.");
        else notes.add("Membership is explicit and snapshot-bound; authority: "+authority);
        if(geometry==null)notes.add("Payoff unavailable: complete compatible instrument terms and associated constituents are not established.");
        notes.add("First opening fill unavailable; no snapshot-date substitution.");
        // Current construction changes get a new display identity; proportional partial reductions do not.
        String signature=options.stream().map(h->{var identity=OptionContractTerms.identity(h);
            return (identity==null?h.contract():identity.toString())+":"+(quantity==null?h.quantity():h.quantity().divide(quantity)).stripTrailingZeros().toPlainString();
        }).sorted().reduce("",(a,b)->a+"|"+b);
        String id="option-position-"+FidelityPositions.digest(account+"|"+sourceId+"|"+signature).substring(0,24);
        return new Position(id,sourceId,basis,authority==null?"UNKNOWN":"EXPLICIT_SNAPSHOT_ASSOCIATION",symbol,quantity,expiry,dte,null,
                strategy,complexity,geometry,range,List.copyOf(actual),options.stream().map(PositionSnapshot.Constituent::holdingId).toList(),sources,List.copyOf(notes));
    }
    private static Geometry geometry(List<PositionSnapshot.Constituent> options,List<OptionContractTerms.Identity> terms,List<Collateral> collateral) {
        var strikes=terms.stream().map(OptionContractTerms.Identity::strike).distinct().sorted().toList();
        BigDecimal shares=collateral.stream().map(Collateral::quantity).reduce(BigDecimal.ZERO,BigDecimal::add);
        var knots=new ArrayList<Point>();BigDecimal left=shares,right=shares;
        for(int i=0;i<options.size();i++) {
            BigDecimal coefficient=options.get(i).quantity().multiply(new BigDecimal("100"));
            if(terms.get(i).right().equals("P"))left=left.subtract(coefficient);else right=right.add(coefficient);
        }
        for(var x:strikes) {
            BigDecimal value=x.multiply(shares);
            for(int i=0;i<options.size();i++) {
                var t=terms.get(i);BigDecimal intrinsic=(t.right().equals("C")?x.subtract(t.strike()):t.strike().subtract(x)).max(BigDecimal.ZERO);
                value=value.add(intrinsic.multiply(options.get(i).quantity()).multiply(new BigDecimal("100")));
            }
            knots.add(new Point(x,value));
        }
        return new Geometry("GROSS_EXPIRATION_INTRINSIC_BEFORE_PREMIUM",List.copyOf(knots),left,right,strikes);
    }
    private static String classify(List<PositionSnapshot.Constituent> h,List<OptionContractTerms.Identity> t,List<Collateral> collateral) {
        if(h.size()==1)return "SINGLE_OPTION";
        if(!collateral.isEmpty())return "NONSTANDARD";
        var order=new ArrayList<Integer>();for(int i=0;i<h.size();i++)order.add(i);
        order.sort(Comparator.comparing(i->t.get(i).strike()));
        boolean equal=h.stream().map(x->x.quantity().abs().stripTrailingZeros()).distinct().count()==1;
        String rights=order.stream().map(i->t.get(i).right()).reduce("",String::concat);
        String signs=order.stream().map(i->h.get(i).quantity().signum()>0?"+":"-").reduce("",String::concat);
        if(equal&&t.stream().map(OptionContractTerms.Identity::strike).distinct().count()==h.size()) {
            if(rights.equals("PPCC")&&signs.equals("+--+"))return "IRON_CONDOR";
            if(rights.equals("PP")&&signs.equals("+-"))return "PUT_CREDIT_VERTICAL";
            if(rights.equals("CC")&&signs.equals("-+"))return "CALL_CREDIT_VERTICAL";
        }
        return "NONSTANDARD";
    }
    private static Range range(String strategy,List<OptionContractTerms.Identity> ids,List<PositionSnapshot.Constituent> options) {
        var shortStrikes=new ArrayList<BigDecimal>();
        for(int i=0;i<options.size();i++)if(options.get(i).quantity().signum()<0)shortStrikes.add(ids.get(i).strike());
        shortStrikes.sort(Comparator.naturalOrder());
        return switch(strategy) {
            case "IRON_CONDOR"->new Range("SHORT_STRIKE_INTERVAL",shortStrikes.getFirst(),shortStrikes.getLast());
            case "PUT_CREDIT_VERTICAL"->new Range("AT_OR_ABOVE_SHORT_STRIKE",shortStrikes.getFirst(),null);
            case "CALL_CREDIT_VERTICAL"->new Range("AT_OR_BELOW_SHORT_STRIKE",null,shortStrikes.getFirst());
            default->null;
        };
    }
}
