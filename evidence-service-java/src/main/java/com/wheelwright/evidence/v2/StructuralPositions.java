package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.*;
import java.sql.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import static com.wheelwright.evidence.v2.StructuralModel.*;

/** Current snapshot construction, independent of prices/opening economics and client presentation. */
final class StructuralPositions {
    private final PositionAssociations store;private final ObjectMapper json;
    StructuralPositions(String url,ObjectMapper json){this.store=new PositionAssociations(url,json);this.json=json;}
    CollectionRead read(Set<String> authorized,String request,Instant now)throws Exception {
        var result=new ArrayList<Account>();
        try(var c=store.connect(true)){c.setAutoCommit(false);
            for(var account:new TreeSet<>(authorized)) {
                var snapshot=store.snapshot(c,account,null);
                result.add(snapshot==null?new Account(account,"NO_RETAINED_SNAPSHOT",null,null,"UNAVAILABLE",List.of(),List.of(),List.of(),List.of(),List.of("NO_RETAINED_SNAPSHOT")):project(c,snapshot,now));
            }
        }
        return new CollectionRead(request,"option-structure",now.toString(),"RETAINED_INSPECTION","option-structure-v1",List.copyOf(result));
    }
    private Account project(Connection c,PositionSnapshot s,Instant now)throws Exception {
        var held=new LinkedHashMap<String,PositionSnapshot.Constituent>();for(var h:s.holdings())if(held.put(h.holdingId(),h)!=null)throw new SQLException("duplicate inventory identity");
        var facts=new HashMap<String,ContractEvidence.Facts>();var evidence=new LinkedHashMap<String,Evidence>();
        String snapshotRef="snapshot:"+s.snapshotId();
        evidence.put(snapshotRef,new Evidence(snapshotRef,"HOLDINGS_SNAPSHOT",s.snapshotId(),s.artifactId(),s.sourceSha256(),List.of(),null,s.evidenceDate(),s.recordedAt(),s.observation()==null?null:s.observation().startedAt(),s.observation()==null?null:s.observation().receivedAt()));
        var active=store.active(c,s.account(),s.snapshotId());var sum=new HashMap<String,BigDecimal>();var conflicts=new HashSet<String>();
        for(var a:active) {
            String ref="association:"+a.associationId();evidence.put(ref,new Evidence(ref,"EXPLICIT_ASSOCIATION",a.associationId(),null,null,List.of(),null,s.evidenceDate(),a.recordedAt(),null,null));
            var unique=new HashSet<String>();
            for(var p:a.allocations()) {
                var h=held.get(p.holdingId());BigDecimal q;
                try{q=new BigDecimal(p.signedQuantity());}catch(RuntimeException e){conflicts.addAll(a.allocations().stream().map(PositionAssociations.Allocation::holdingId).toList());continue;}
                if(h==null||!h.kind().equals("Options")||q.signum()!=h.quantity().signum()||q.signum()==0||q.stripTrailingZeros().scale()>0||!unique.add(p.holdingId()))conflicts.add(p.holdingId());
                sum.merge(p.holdingId(),q.abs(),BigDecimal::add);
            }
        }
        for(var p:sum.entrySet())if(!held.containsKey(p.getKey())||p.getValue().compareTo(held.get(p.getKey()).quantity().abs())>0)conflicts.add(p.getKey());
        // Ambiguity propagates across the entire connected allocation component.
        boolean changed;do{changed=false;for(var a:active)if(a.allocations().stream().anyMatch(p->conflicts.contains(p.holdingId())))for(var p:a.allocations())changed|=conflicts.add(p.holdingId());}while(changed);
        var excluded=new ArrayList<String>();var options=new LinkedHashMap<String,PositionSnapshot.Constituent>();LocalDate today=now.atZone(ZoneId.of("America/New_York")).toLocalDate();
        for(var h:held.values())if(h.kind().equals("Options")&&h.quantity().signum()!=0) {
            if(h.quantity().stripTrailingZeros().scale()>0)conflicts.add(h.holdingId());
            var f=ContractEvidence.read(c,s,h);facts.put(h.holdingId(),f);for(var e:f.evidence())evidence.put(e.evidenceId(),e);
            if(h.expiration()!=null&&LocalDate.parse(h.expiration()).isBefore(today)||f.expiresAt()!=null&&!now.isBefore(f.expiresAt()))excluded.add(h.holdingId());else options.put(h.holdingId(),h);
        }
        var rows=new ArrayList<Position>();var used=new HashMap<String,BigDecimal>();
        for(var a:active)if(a.allocations().stream().noneMatch(p->conflicts.contains(p.holdingId()))) {
            var parts=new ArrayList<PositionSnapshot.Constituent>();boolean complete=true;
            for(var p:a.allocations()) {
                var h=options.get(p.holdingId());if(h==null){complete=false;continue;}
                parts.add(withQuantity(h,new BigDecimal(p.signedQuantity())));
            }
            // A partially expired assertion cannot silently create a reduced strategy.
            if(!complete||parts.isEmpty())continue;
            if(parts.stream().map(PositionSnapshot.Constituent::expiration).distinct().count()!=1)continue;
            for(var h:parts)used.merge(h.holdingId(),h.quantity(),BigDecimal::add);
            rows.add(position(s,a.associationId(),parts,facts,false,today,snapshotRef));
        }
        for(var h:options.values()) {
            var residual=h.quantity().subtract(used.getOrDefault(h.holdingId(),BigDecimal.ZERO));
            if(residual.signum()!=0)rows.add(position(s,null,List.of(withQuantity(h,residual)),facts,conflicts.contains(h.holdingId()),today,snapshotRef));
        }
        rows.sort(Comparator.comparing(Position::subjectId));
        var qualifications=new ArrayList<String>(List.of("Retained option construction; no live-brokerage state assertion.","Occurrence/opening, current valuation, market quote age and management are unavailable.","Payoff covers verified allocated option components, before premium/basis/fees; no cash/share collateral inferred.","Snapshot association applicability is not inherited by a later snapshot."));
        if(s.observation()==null)qualifications.addAll(RetainedStructuralHistory.fidelity(c,s.account(),json).qualifications());
        boolean known=rows.stream().allMatch(p->p.membership().status().equals("ESTABLISHED")&&p.payoff().status().equals("ESTABLISHED")&&p.strategy().status().equals("ESTABLISHED"));
        String set=FidelityPositions.digest(s.snapshotId()+"|"+evidence.keySet()+"|option-structure-v1");
        return new Account(s.account(),"RETAINED",new Snapshot(s.snapshotId(),s.evidenceDate(),s.recordedAt(),s.observation(),PositionSnapshot.context(s)),set,!conflicts.isEmpty()?"CONFLICTING":known?"QUALIFIED":"INCOMPLETE",List.copyOf(rows),List.copyOf(evidence.values()),List.copyOf(excluded),s.observation()==null&&!excluded.isEmpty()?List.of("EXPIRED_OPTIONS_IN_RETAINED_FIDELITY_SNAPSHOT"):List.of(),List.copyOf(qualifications));
    }
    private static PositionSnapshot.Constituent withQuantity(PositionSnapshot.Constituent h,BigDecimal q){return new PositionSnapshot.Constituent(h.holdingId(),h.contract(),h.description(),h.kind(),h.custody(),q,h.openPl(),h.marketValue(),h.bid(),h.ask(),h.expiration(),h.sourceRows());}
    private Position position(PositionSnapshot s,String association,List<PositionSnapshot.Constituent> parts,Map<String,ContractEvidence.Facts> facts,boolean conflict,LocalDate today,String snapshotRef) {
        parts=parts.stream().sorted(Comparator.comparing((PositionSnapshot.Constituent h)->{var id=OptionIdentity.of(h);return id==null?BigDecimal.ZERO:id.strike();}).thenComparing(PositionSnapshot.Constituent::contract).thenComparing(PositionSnapshot.Constituent::holdingId)).toList();
        List<String> refs=List.of(association==null?snapshotRef:"association:"+association);var legs=new ArrayList<Constituent>();
        boolean whole=parts.stream().allMatch(h->h.quantity().stripTrailingZeros().scale()<=0);
        for(var h:parts){
            boolean integer=h.quantity().stripTrailingZeros().scale()<=0;
            String observed=s.holdings().stream().filter(source->source.holdingId().equals(h.holdingId())).findFirst().orElseThrow().quantity().toPlainString();
            legs.add(new Constituent(h.holdingId(),h.contract(),h.custody(),integer?h.quantity().toBigIntegerExact().toString():null,observed,integer?List.of():List.of("NON_WHOLE_OBSERVED_OPTION_QUANTITY"),refs,facts.get(h.holdingId()).terms()));
        }
        var ids=parts.stream().map(OptionIdentity::of).toList();
        boolean equivalent=ids.stream().anyMatch(Objects::isNull)||ids.stream().distinct().count()!=ids.size();
        boolean termsKnown=legs.stream().allMatch(h->h.terms().status().equals("ESTABLISHED"));
        boolean sameUnderlying=termsKnown&&legs.stream().map(h->h.terms().value().underlyingSymbol()).distinct().count()==1;
        Fact<Underlying> underlying=parts.size()==1?facts.get(parts.getFirst().holdingId()).underlying():sameUnderlying?Fact.known(new Underlying(legs.getFirst().terms().value().underlyingSymbol(),"USD"),legs.stream().flatMap(h->h.terms().evidenceIds().stream()).distinct().toList()):Fact.unknown("UNDERLYING_NOT_ESTABLISHED");
        String expiry=parts.getFirst().expiration();Instant exact=parts.stream().map(h->facts.get(h.holdingId()).expiresAt()).filter(Objects::nonNull).min(Comparator.naturalOrder()).orElse(null);
        Fact<Expiration> expiration=expiry==null?Fact.unknown("EXPIRATION_NOT_ESTABLISHED"):Fact.known(new Expiration(expiry,exact==null?null:exact.toString()),refs);
        BigInteger count=BigInteger.ZERO;if(whole)for(var h:parts)count=count.gcd(h.quantity().abs().toBigIntegerExact());
        Fact<String> units=equivalent||conflict||!whole?Fact.unavailable(conflict?"CONFLICTING":"UNKNOWN",!whole?"NON_WHOLE_OBSERVED_OPTION_QUANTITY":"ALLOCATION_ENCODING_AMBIGUOUS",refs):Fact.known(count.toString(),refs);
        Fact<Payoff> payoff=sameUnderlying&&whole?Fact.known(payoff(parts,ids),legs.stream().flatMap(h->h.terms().evidenceIds().stream()).distinct().toList()):Fact.unknown("COMPLETE_PHYSICAL_TERMS_NOT_ESTABLISHED");
        Fact<Strategy> strategy=Fact.unknown("QUALIFIED_CONSTRUCTION_NOT_ESTABLISHED");Fact<Range> range=Fact.unknown("STANDARD_RANGE_NOT_ESTABLISHED");
        if(sameUnderlying&&whole&&!equivalent&&!conflict) {
            String kind=classify(parts,ids);strategy=Fact.known(new Strategy(kind,parts.size(),parts.size()),refs);
            if(kind.equals("PUT_CREDIT_VERTICAL"))range=Fact.known(Range.halfLine(ids.get(1).strike().toPlainString(),"AT_OR_ABOVE"),refs);
            if(kind.equals("CALL_CREDIT_VERTICAL"))range=Fact.known(Range.halfLine(ids.get(0).strike().toPlainString(),"AT_OR_BELOW"),refs);
            if(kind.equals("IRON_CONDOR"))range=Fact.known(new Range("SHORT_STRIKE_INTERVAL",ids.get(1).strike().toPlainString(),ids.get(2).strike().toPlainString()),refs);
        }
        var inventory=new LinkedHashSet<String>();for(var h:parts) {
            var original=s.associations().stream().filter(a->a.holdingIds().contains(h.holdingId())).findFirst();inventory.add(original.map(PositionSnapshot.Association::positionId).orElse("position-"+h.holdingId().substring(8)));
        }
        return new Position("structure-"+FidelityPositions.digest(s.snapshotId()+"|"+(association==null?parts.getFirst().holdingId():association)).substring(0,24),List.copyOf(inventory),association,
            Fact.unknown("OCCURRENCE_NOT_ESTABLISHED"),new Membership(association==null?conflict?"CONFLICTING":"UNKNOWN":"ESTABLISHED",association==null?"UNASSOCIATED_INVENTORY":"EXPLICIT_ASSOCIATION",refs,association==null?List.of(conflict?"ALLOCATION_CLAIMS_CONFLICT":"NO_CURRENT_MANAGED_ASSOCIATION"):List.of()),
            List.copyOf(legs),underlying,expiration,expiry==null?null:ChronoUnit.DAYS.between(today,LocalDate.parse(expiry)),Fact.unknown("OPENING_ATTRIBUTION_NOT_IMPLEMENTED"),units,strategy,payoff,range,Fact.unknown("COLLATERAL_ASSOCIATION_NOT_ESTABLISHED"),List.of("Current assertion/holding scope only; no occurrence continuity.",equivalent?"Strategy units/classification withheld for equivalent held contracts.":"Opening cash and market prices do not participate in structural payoff."));
    }
    private static String classify(List<PositionSnapshot.Constituent> parts,List<OptionIdentity> ids) {
        if(parts.size()==1)return "SINGLE_OPTION";
        if(parts.size()==4&&ids.stream().map(OptionIdentity::strike).distinct().count()==4&&ids.get(0).right().equals("P")&&ids.get(1).right().equals("P")&&ids.get(2).right().equals("C")&&ids.get(3).right().equals("C")&&ids.get(0).strike().compareTo(ids.get(1).strike())<0&&ids.get(1).strike().compareTo(ids.get(2).strike())<0&&ids.get(2).strike().compareTo(ids.get(3).strike())<0&&parts.get(0).quantity().signum()>0&&parts.get(1).quantity().signum()<0&&parts.get(2).quantity().signum()<0&&parts.get(3).quantity().signum()>0&&parts.stream().map(h->h.quantity().abs()).distinct().count()==1)return "IRON_CONDOR";
        if(parts.size()==2&&ids.get(0).right().equals(ids.get(1).right())&&ids.get(0).strike().compareTo(ids.get(1).strike())<0&&parts.get(0).quantity().abs().compareTo(parts.get(1).quantity().abs())==0){
            if(ids.get(0).right().equals("P")&&parts.get(0).quantity().signum()>0&&parts.get(1).quantity().signum()<0)return "PUT_CREDIT_VERTICAL";
            if(ids.get(0).right().equals("C")&&parts.get(0).quantity().signum()<0&&parts.get(1).quantity().signum()>0)return "CALL_CREDIT_VERTICAL";
        }
        return "NONSTANDARD";
    }
    private static Payoff payoff(List<PositionSnapshot.Constituent> parts,List<OptionIdentity> ids) {
        var strikes=new TreeSet<BigDecimal>();strikes.add(BigDecimal.ZERO);for(var id:ids)strikes.add(id.strike());var knots=new ArrayList<Knot>();BigDecimal tail=BigDecimal.ZERO;
        for(int i=0;i<parts.size();i++)if(ids.get(i).right().equals("C"))tail=tail.add(parts.get(i).quantity().multiply(new BigDecimal("100")));
        for(var x:strikes) {
            BigDecimal total=BigDecimal.ZERO;
            for(int i=0;i<parts.size();i++){var id=ids.get(i);var intrinsic=(id.right().equals("C")?x.subtract(id.strike()):id.strike().subtract(x)).max(BigDecimal.ZERO);total=total.add(intrinsic.multiply(parts.get(i).quantity()).multiply(new BigDecimal("100")));}
            knots.add(new Knot(Rational.of(x),Rational.of(total)));
        }
        return new Payoff("GROSS_EXPIRATION_EXERCISE_VALUE_BEFORE_PREMIUM_AND_BASIS","TOTAL_CURRENT_ALLOCATED_QUANTITIES","USD","0",List.copyOf(knots),Rational.of(tail),false);
    }
}
