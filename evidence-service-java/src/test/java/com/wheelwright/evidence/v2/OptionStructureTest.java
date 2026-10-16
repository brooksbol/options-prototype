package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class OptionStructureTest {
    static final Instant NOW=Instant.parse("2026-10-16T18:00:00Z");
    static final String ACCOUNT="acct_"+"1".repeat(32),ASSOCIATION="position-"+"a".repeat(24);
    @TempDir Path temp;
    static PositionSnapshot.Constituent option(String id,String root,String expiry,String right,String strike,int quantity) {
        String contract="-"+root+expiry.substring(2).replace("-","")+right+strike;
        return new PositionSnapshot.Constituent("holding-"+id,contract,"Synthetic option","Options","Cash",BigDecimal.valueOf(quantity),null,null,null,null,expiry,List.of(2));
    }
    static List<PositionSnapshot.Constituent> condor(int quantity) {
        return List.of(option("lp","SPY","2026-11-20","P","500",quantity),option("sp","SPY","2026-11-20","P","510",-quantity),
                option("sc","SPY","2026-11-20","C","550",-quantity),option("lc","SPY","2026-11-20","C","560",quantity));
    }
    static PositionSnapshot.InstrumentEvidence instruments(List<PositionSnapshot.Constituent> holdings) throws Exception {
        var records=new ArrayList<Map<String,Object>>();
        for(var h:holdings) {
            if(!h.kind().equals("Options"))continue;var t=OptionContractTerms.identity(h);
            records.add(Map.of("symbol",t.root()+" "+t.expiration().substring(2).replace("-","")+t.right()+String.format("%08d",t.strike().movePointRight(3).longValueExact()),
                    "expiration-date",t.expiration(),"strike-price",t.strike().toPlainString(),"option-type",t.right(),"underlying-symbol",t.root(),
                    "instrument-type","Equity Option","option-chain-type","Standard","shares-per-contract",100));
        }
        String raw=new ObjectMapper().writeValueAsString(records);
        return new PositionSnapshot.InstrumentEvidence("synthetic-instruments.json",FidelityPositions.digest(raw),raw);
    }
    static PositionSnapshot snapshot(List<PositionSnapshot.Constituent> holdings,boolean associated,boolean withTerms) throws Exception {
        var associations=associated?List.of(new PositionSnapshot.Association(ASSOCIATION,"Explicit synthetic package",holdings.stream().map(PositionSnapshot.Constituent::holdingId).toList(),null,"Synthetic operator association")):List.<PositionSnapshot.Association>of();
        return new PositionSnapshot(ACCOUNT,"SYNTHETIC","Synthetic","snapshot-test","2026-10-16",NOW.toString(),"synthetic.csv","a".repeat(64),null,
                holdings,associations,0,null,withTerms?instruments(holdings):null);
    }
    static OptionStructure.Read project(PositionSnapshot s){return OptionStructure.project(s,"test",NOW);}
    @Test void explicitMembershipAndTermsConstructCondorWithoutMarketPrices() throws Exception {
        var p=project(snapshot(condor(3),true,true)).positions().getFirst();
        assertThat(p.strategy()).isEqualTo("IRON_CONDOR");assertThat(p.quantity()).isEqualByComparingTo("3");
        assertThat(p.geometry().knots().stream().map(OptionStructure.Point::value)).containsExactly(new BigDecimal("-3000"),BigDecimal.ZERO,BigDecimal.ZERO,new BigDecimal("-3000"));
        assertThat(p.range().lower()).isEqualByComparingTo("510");assertThat(p.range().upper()).isEqualByComparingTo("550");
        assertThat(p.termsSources()).hasSize(4);assertThat(p.firstOpeningFillAt()).isNull();assertThat(p.collateral()).isEmpty();
        assertThat(p.dte()).isEqualTo(35);
    }
    @Test void matchingContractsNeverEstablishMembershipAndMissingTermsNeverBecomeGeometry() throws Exception {
        var matching=project(snapshot(condor(1),false,true));assertThat(matching.positions()).hasSize(4);
        assertThat(matching.positions()).allMatch(p->p.membership().equals("UNKNOWN"));
        assertThat(project(snapshot(condor(1),true,false)).positions().getFirst().geometry()).isNull();
    }
    @Test void partialQuantityRetainsDisplayIdentityButStrikeExpiryAndExplicitOccurrenceChangeIt() throws Exception {
        var first=project(snapshot(condor(3),true,true)).positions().getFirst();
        var partial=project(snapshot(condor(1),true,true)).positions().getFirst();assertThat(partial.positionId()).isEqualTo(first.positionId());
        var adjusted=new ArrayList<>(condor(1));adjusted.set(3,option("lc","SPY","2026-11-20","C","565",1));
        assertThat(project(snapshot(adjusted,true,true)).positions().getFirst().positionId()).isNotEqualTo(first.positionId());
        var split=new ArrayList<>(condor(1));split.set(3,option("lc","SPY","2026-12-18","C","560",1));
        var reads=project(snapshot(split,true,true));assertThat(reads.positions()).hasSize(2);assertThat(reads.positions()).noneMatch(p->p.strategy().equals("IRON_CONDOR"));
        var old=snapshot(condor(1),true,true);var reopened=new PositionSnapshot(old.account(),old.brokerAccount(),old.accountName(),"new",old.evidenceDate(),old.recordedAt(),old.sourceFile(),old.sourceSha256(),null,old.holdings(),
                List.of(new PositionSnapshot.Association("position-"+"b".repeat(24),"New explicitly established occurrence",old.associations().getFirst().holdingIds(),null,"New occurrence evidence")),0,null,old.instrumentEvidence());
        assertThat(project(reopened).positions().getFirst().positionId()).isNotEqualTo(first.positionId());
        assertThat(partial.firstOpeningFillAt()).isNull(); // No opening or lifecycle claim manufactured.
    }
    @Test void unequalRatiosAreActualNonstandardGeometryNotAForcedCondor() throws Exception {
        var h=new ArrayList<>(condor(1));h.set(2,option("sc","SPY","2026-11-20","C","550",-2));
        var p=project(snapshot(h,true,true)).positions().getFirst();
        assertThat(p.strategy()).isEqualTo("NONSTANDARD");assertThat(p.geometry().rightSlope()).isEqualByComparingTo("-100");
        assertThat(p.range()).isNull();assertThat(p.geometry().knots().getLast().value()).isEqualByComparingTo("-2000");
    }
    @Test void expiredAndNonOptionsExcludedAndOnlyConcreteFidelityReasonRefreshes() throws Exception {
        var h=new ArrayList<>(condor(1));h.add(option("expired","XLE","2026-10-15","C","90",-1));
        h.add(new PositionSnapshot.Constituent("holding-shares","XLE","Shares","Stocks","Cash",new BigDecimal("100"),null,null,null,null,null,List.of(8)));
        h.add(option("zero","XLE","2026-11-20","C","100",0));
        var read=project(snapshot(h,false,false));assertThat(read.positions()).hasSize(4);
        assertThat(read.refreshReasons()).containsExactly("EXPIRED_OPTIONS_IN_RETAINED_FIDELITY_SNAPSHOT");
        assertThat(project(snapshot(condor(1),false,false)).refreshReasons()).isEmpty();
    }
    @Test void overlappingAssociationsFailClosedAndAdjustedTermsRemainUnknown() throws Exception {
        var s=snapshot(condor(1),true,true);var a=s.associations().getFirst();
        var bad=new PositionSnapshot(s.account(),s.brokerAccount(),s.accountName(),s.snapshotId(),s.evidenceDate(),s.recordedAt(),s.sourceFile(),s.sourceSha256(),null,s.holdings(),List.of(a,new PositionSnapshot.Association("position-"+"b".repeat(24),"Overlap",a.holdingIds(),null,"Test")),0);
        assertThatThrownBy(()->project(bad)).hasMessageContaining("multiply allocated");
        var adjusted=snapshot(List.of(option("adjusted","ETHA1","2026-11-20","C","20.5",-1)),false,false);
        assertThat(project(adjusted).positions().getFirst().geometry()).isNull();assertThat(project(adjusted).positions().getFirst().underlying()).isNull();
        var invalid=s.instrumentEvidence();String raw=invalid.payload().replace("Standard","Adjusted");
        var invalidSnapshot=new PositionSnapshot(s.account(),s.brokerAccount(),s.accountName(),s.snapshotId(),s.evidenceDate(),s.recordedAt(),s.sourceFile(),s.sourceSha256(),null,s.holdings(),s.associations(),0,null,
                new PositionSnapshot.InstrumentEvidence("adjusted.json",FidelityPositions.digest(raw),raw));
        assertThat(project(invalidSnapshot).positions().getFirst().geometry()).isNull();
    }
    @Test void actualAssociatedSharesAreCollateralAndAffectPayoff() throws Exception {
        var shares=new PositionSnapshot.Constituent("holding-stock","XLE","Shares","Stocks","Cash",new BigDecimal("66"),null,null,null,null,null,List.of(2));
        var s=snapshot(List.of(option("call","XLE","2026-11-20","C","90",-1),shares),true,true);
        var p=project(s).positions().getFirst();assertThat(p.collateral()).hasSize(1);assertThat(p.collateral().getFirst().quantity()).isEqualByComparingTo("66");
        assertThat(p.geometry().leftSlope()).isEqualByComparingTo("66");assertThat(p.geometry().rightSlope()).isEqualByComparingTo("-34");
    }
    @Test void termHashDuplicatesAndExactExpirationCannotBeIgnored() throws Exception {
        var h=List.of(option("today","SPY","2026-10-16","C","550",-1));var s=snapshot(h,false,true);
        var mapper=new ObjectMapper();var records=(com.fasterxml.jackson.databind.node.ArrayNode)mapper.readTree(s.instrumentEvidence().payload());
        ((com.fasterxml.jackson.databind.node.ObjectNode)records.get(0)).put("expires-at","2026-10-16T17:59:00Z");
        String raw=records.toString();
        var expired=new PositionSnapshot(s.account(),s.brokerAccount(),s.accountName(),s.snapshotId(),s.evidenceDate(),s.recordedAt(),s.sourceFile(),s.sourceSha256(),null,s.holdings(),s.associations(),0,null,
                new PositionSnapshot.InstrumentEvidence("exact.json",FidelityPositions.digest(raw),raw));
        assertThat(project(expired).positions()).isEmpty();
        assertThat(OptionContractTerms.read(new PositionSnapshot.InstrumentEvidence("bad.json","0".repeat(64),raw))).isEmpty();
        records.add(records.get(0).deepCopy());raw=records.toString();
        assertThat(OptionContractTerms.read(new PositionSnapshot.InstrumentEvidence("duplicate.json",FidelityPositions.digest(raw),raw))).isEmpty();
    }
    @Test void actualHttpViewUsesRetainedStatePreservesInventoryAndEnforcesAccountGrants() throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("fixture.sqlite").toString())) {
            var mapper=new ObjectMapper();var service=new PositionReadService(store,mapper);service.admit(snapshot(condor(1),true,true));
            var mvc=MockMvcBuilders.standaloneSetup(new PositionsController(org.mockito.Mockito.mock(AccountDirectory.class),service,
                    TestAuthentication.auth("reader=reader:account.positions.read:"+ACCOUNT),mapper)).build();
            var r=mvc.perform(get("/v2/positions").param("view","open-options").param("accountId",ACCOUNT).header("Authorization","Bearer reader")).andReturn().getResponse();
            assertThat(r.getStatus()).isEqualTo(200);assertThat(r.getHeader("Cache-Control")).isEqualTo("private, no-store");
            assertThat(mapper.readTree(r.getContentAsString()).path("optionSnapshots").get(0).path("positions").get(0).path("geometry").isNull()).isFalse();
            assertThat(r.getContentAsString()).doesNotContain("payload","brokerAccount","SYNTHETIC");
            assertThat(service.read(ACCOUNT,"r",NOW).orElseThrow().positions()).hasSize(1);
            var denied=mvc.perform(get("/v2/positions").param("view","open-options").param("accountId","acct_"+"2".repeat(32)).header("Authorization","Bearer reader")).andReturn().getResponse();
            assertThat(denied.getStatus()).isEqualTo(403);
            assertThat(mvc.perform(get("/v2/positions").param("view","open-options").param("accountId",ACCOUNT).param("snapshotId","x").header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(422);
            Files.writeString(Path.of("build/option-structure-specimen.json"),r.getContentAsString());
        }
    }
}
