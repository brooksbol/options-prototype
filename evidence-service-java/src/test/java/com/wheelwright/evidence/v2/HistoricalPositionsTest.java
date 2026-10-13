package com.wheelwright.evidence.v2;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
class HistoricalPositionsTest {
 @TempDir Path temp;
 final ObjectMapper mapper=new ObjectMapper();
 static final Instant NOW=Instant.parse("2026-10-12T12:00:00Z");
 class Fixture implements AutoCloseable {
  final SqliteEvidenceStore store; final AccountDirectory accounts; final PositionReadService service; final MockMvc mvc; final String a,b,empty;
  Fixture() throws Exception {
   store=new SqliteEvidenceStore(temp.resolve("history.db").toString());accounts=new AccountDirectory(store,"");
   a=accounts.bind("pts","A1");b=accounts.bind("other","B2");empty=accounts.bind("empty","E3");service=new PositionReadService(store,mapper);
   var auth=new BearerAuthenticator(new UserDirectory(store,accounts),"reader=reader:account.read:"+a+"|account.positions.read:"+a+"|account.positions.read:"+empty+",foreign=foreign:account.positions.read:"+b+",admin=admin:users.admin");
   mvc=MockMvcBuilders.standaloneSetup(new PositionsController(accounts,service,auth,mapper)).build();
  }
  PositionSnapshot snapshot(String account,String broker,String quantity,String date,String recorded) {
   return FidelityPositions.parse(account,broker,"fixture.csv",PositionsTest.csv(broker+",Fixture,ETFs,ETHA,Shares,"+quantity+",100,--,Cash\n"+broker+",Fixture,Options,-ETHA1261016C20.5,Adjusted call,-2,-10,--,Cash\n",date),recorded,List.of(),account);
  }
  public void close() throws Exception {store.close();}
 }
 @Test void catalogSelectionLatestPrecisionAndDurability() throws Exception {
  String account,id;
  try(var f=new Fixture()) {
   var old=f.snapshot(f.a,"A1","200.123456789012","Sep-28-2026","2026-10-11T12:00:00Z");
   var sameDay=f.snapshot(f.a,"A1","199","Sep-28-2026","2026-10-11T12:01:00Z");
   var latest=f.snapshot(f.a,"A1","66","Oct-11-2026","2026-10-11T12:02:00Z");
   assertThat(f.service.admit(old)).isTrue();assertThat(f.service.admit(old)).isFalse();f.service.admit(latest);f.service.admit(sameDay);
   var catalog=f.service.observations(Set.of(f.a),"request");
   assertThat(catalog).extracting(PositionSnapshot.ObservationSummary::snapshotId).containsExactly(latest.snapshotId(),sameDay.snapshotId(),old.snapshotId());
   assertThat(catalog).allSatisfy(s->{assertThat(s.accountId()).isEqualTo(f.a);assertThat(s.holdingCount()).isEqualTo(2);assertThat(s.observationContext().evidenceDatePrecision()).isEqualTo("DAY");assertThat(s.qualifications().toString()).contains("not established brokerage chronology");});
   var selected=f.service.read(f.a,old.snapshotId(),"request",NOW).orElseThrow();
   assertThat(selected.positions().getFirst().constituents().getFirst().holding().quantity()).isEqualByComparingTo("200.123456789012");
   assertThat(selected.positions().get(1).constituents().getFirst().holding().contract()).isEqualTo("-ETHA1261016C20.5");
   assertThat(selected.positions().get(1).constituents().getFirst().dte()).isEqualTo(4L);
   assertThat(selected.evaluationBasis()).isEqualTo("INSPECTION_TIME");assertThat(selected.qualifications().toString()).contains("subsequently retained","no historical knowledge replay");
   assertThat(f.service.read(f.a,"request",NOW).orElseThrow().snapshotId()).isEqualTo(latest.snapshotId());
   var response=f.mvc.perform(get("/v2/positions").param("view","observations").param("accountId",f.a).header("Authorization","Bearer reader")).andReturn().getResponse();
   assertThat(response.getStatus()).isEqualTo(200);Files.createDirectories(Path.of("build"));Files.writeString(Path.of("build/historical-catalog.json"),response.getContentAsString());
   var selectedResponse=f.mvc.perform(get("/v2/positions").param("accountId",f.a).param("snapshotId",old.snapshotId()).header("Authorization","Bearer reader")).andReturn().getResponse();
   assertThat(selectedResponse.getStatus()).isEqualTo(200);Files.writeString(Path.of("build/historical-selected.json"),selectedResponse.getContentAsString());
   account=f.a;id=old.snapshotId();
  }
  try(var store=new SqliteEvidenceStore(temp.resolve("history.db").toString())) {assertThat(new PositionReadService(store,mapper).read(account,id,"restart",NOW).orElseThrow().positions().getFirst().constituents().getFirst().holding().quantity()).isEqualByComparingTo("200.123456789012");}
 }
 @Test void accountIsolationAdministratorAndMissingAreFailClosed() throws Exception {
  try(var f=new Fixture()) {
   var foreign=f.snapshot(f.b,"B2","999","Oct-11-2026",NOW.toString());f.service.admit(foreign);
   for(String token:List.of("reader","admin")) {
    assertThat(f.mvc.perform(get("/v2/positions").param("view","observations").param("accountId",f.b).header("Authorization","Bearer "+token)).andReturn().getResponse().getStatus()).isEqualTo(403);
    var json=mapper.readTree(f.mvc.perform(get("/v2/positions").param("view","observations").header("Authorization","Bearer "+token)).andReturn().getResponse().getContentAsString());assertThat(json.path("observations").size()).isZero();
   }
   for(String snapshot:List.of(foreign.snapshotId(),"missing"))assertThat(f.mvc.perform(get("/v2/positions").param("accountId",f.a).param("snapshotId",snapshot).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(404);
   assertThat(f.mvc.perform(get("/v2/positions").param("view","observations")).andReturn().getResponse().getStatus()).isEqualTo(401);
  }
 }
 @Test void invalidFormsAndEmptyVersusMissing() throws Exception {
  try(var f=new Fixture()) {
   for(String suffix:List.of("&view=", "&view=latest", "&snapshotId=", "&view=observations&snapshotId=x", "&view=observations&view=observations", "&snapshotId=x&snapshotId=x", "&extra=x", "&accountId="+f.a))assertThat(f.mvc.perform(get("/v2/positions?accountId="+f.a+suffix).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).as(suffix).isEqualTo(422);
   assertThat(f.mvc.perform(get("/v2/positions?snapshotId=x").header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(422);
   assertThat(f.mvc.perform(get("/v2/positions?view=observations").content("{}").header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(422);
   var none=f.mvc.perform(get("/v2/positions").param("accountId",f.empty).param("view","observations").header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(none.getStatus()).isEqualTo(200);assertThat(mapper.readTree(none.getContentAsString()).path("observations").size()).isZero();
   var s=FidelityPositions.parse(f.a,"A1","empty.csv",PositionsTest.csv("A1,Fixture,Cash,SPAXX,Cash,,100,--,Cash\n","Oct-11-2026"),NOW.toString(),List.of());f.service.admit(s);
   var selected=f.mvc.perform(get("/v2/positions").param("accountId",f.a).param("snapshotId",s.snapshotId()).header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(selected.getStatus()).isEqualTo(200);assertThat(selected.getHeader("Cache-Control")).isEqualTo("private, no-store");assertThat(mapper.readTree(selected.getContentAsString()).path("snapshots").get(0).path("positions").size()).isZero();
  }
 }
 @Test void historicalGroupingIsSnapshotBoundAndCatalogCountsConstituentsOnce() throws Exception {
  try(var f=new Fixture()) {
   var plain=FidelityPositions.parse(f.a,"A1","group.csv",PositionsTest.csv(PositionsTest.BODY,"Sep-28-2026"),NOW.toString(),List.of());
   var association=new PositionSnapshot.Association("position-aaaaaaaaaaaaaaaaaaaaaaaa","Explicit spread",plain.holdings().subList(2,4).stream().map(PositionSnapshot.Constituent::holdingId).toList(),null,"test operator");
   var grouped=FidelityPositions.parse(f.a,"A1","group.csv",PositionsTest.csv(PositionsTest.BODY,"Sep-28-2026"),NOW.toString(),List.of(association));
   f.service.admit(grouped);f.service.admit(f.snapshot(f.a,"A1","66","Oct-11-2026",NOW.plusSeconds(1).toString()));
   var selected=f.service.read(f.a,grouped.snapshotId(),"request",NOW).orElseThrow();
   assertThat(selected.positions()).hasSize(3);assertThat(selected.positions().getFirst().identityBasis()).isEqualTo("EXPLICIT_SNAPSHOT_ASSOCIATION");
   assertThat(selected.positions().stream().flatMap(p->p.constituents().stream()).map(l->l.holding().holdingId())).doesNotHaveDuplicates().hasSize(4);
   assertThat(f.service.observations(Set.of(f.a),"request")).filteredOn(s->s.snapshotId().equals(grouped.snapshotId())).singleElement().satisfies(s->assertThat(s.holdingCount()).isEqualTo(4));
   assertThat(f.service.read(f.a,"request",NOW).orElseThrow().positions()).noneMatch(p->p.identityBasis().equals("EXPLICIT_SNAPSHOT_ASSOCIATION"));
  }
 }
 @Test void catalogTieBreakAndCapacityFailureNeverTruncateSuccess() throws Exception {
  try(var f=new Fixture()) {
   var first=f.snapshot(f.a,"A1","100","Oct-11-2026",NOW.toString());var second=f.snapshot(f.a,"A1","101","Oct-11-2026",NOW.toString());
   f.service.admit(first);f.service.admit(second);
   assertThat(f.service.observations(Set.of(f.a),"request")).extracting(PositionSnapshot.ObservationSummary::snapshotId).containsExactlyElementsOf(List.of(first.snapshotId(),second.snapshotId()).stream().sorted(Comparator.reverseOrder()).toList());
   try(var q=f.store.getConnection().prepareStatement("INSERT INTO account_position_snapshot(account,snapshot_id,evidence_date,recorded_at,payload_json) VALUES(?,?,?,?,?)")) {
    q.setString(1,f.a);q.setString(2,"capacity-fixture");q.setString(3,"2026-09-28");q.setString(4,NOW.toString());q.setString(5," ".repeat(33*1024*1024));q.executeUpdate();
   }
   var response=f.mvc.perform(get("/v2/positions").param("accountId",f.a).param("view","observations").header("Authorization","Bearer reader")).andReturn().getResponse();
   assertThat(response.getStatus()).isEqualTo(503);assertThat(response.getContentAsString()).doesNotContain("observations",first.snapshotId(),second.snapshotId());
  }
 }
 @Test void allAccountOrderingAndPureRetainedState() throws Exception {
  try(var f=new Fixture()) {
   f.service.admit(f.snapshot(f.a,"A1","100","Oct-11-2026",NOW.toString()));f.service.admit(f.snapshot(f.b,"B2","200","Oct-11-2026",NOW.toString()));
   String before;try(var q=f.store.getConnection().createStatement();var rs=q.executeQuery("SELECT group_concat(payload_json) FROM account_position_snapshot")){before=rs.getString(1);}
   assertThat(f.service.observations(Set.of(f.b,f.a),"request")).extracting(PositionSnapshot.ObservationSummary::accountId).isSorted();
   f.service.read(f.a,"request",NOW);try(var q=f.store.getConnection().createStatement();var rs=q.executeQuery("SELECT group_concat(payload_json) FROM account_position_snapshot")){assertThat(rs.getString(1)).isEqualTo(before);}
  }
 }
}
