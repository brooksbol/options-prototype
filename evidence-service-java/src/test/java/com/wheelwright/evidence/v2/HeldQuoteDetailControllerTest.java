package com.wheelwright.evidence.v2;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.AcquisitionWorker;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import java.util.*;
import java.nio.file.*;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
@SpringBootTest(properties={"evidence.db.path=:memory:","tradier.api-key=test-key","wheelwright.v2.auth.tokens=read=reader:quote.read,acquire=acquirer:quote.acquire"})
@AutoConfigureMockMvc
class HeldQuoteDetailControllerTest {
 @Autowired MockMvc mvc; @Autowired SqliteEvidenceStore store;
 @MockitoBean DirectQuoteSource source; @MockitoBean AcquisitionWorker worker; @MockitoSpyBean TradierAdapter adapter;
 static final ObjectMapper JSON=new ObjectMapper(); static final List<Object> specimens=new ArrayList<>();
 @BeforeEach void reset() throws Exception {store.clearDirectQuotes();clearInvocations(source,worker,adapter);doThrow(new AssertionError("provider contact")).when(adapter).getQuotes(anyList());doThrow(new AssertionError("provider contact")).when(adapter).getQuotes(anyList(),any());doThrow(new AssertionError("source contact")).when(source).acquire(any(),any());doThrow(new AssertionError("worker contact")).when(worker).start(any());}
 @AfterEach void pure(){verifyNoInteractions(source,worker,adapter);}
 @AfterAll static void specimens() throws Exception {var file=Path.of("build/held-quote-detail-specimens.json");Files.createDirectories(file.getParent());Files.writeString(file,JSON.writeValueAsString(specimens));}
 void check(String path,String credential,byte[] body,int status,String code) throws Exception {
  var before=store.getDirectQuote("SPY");
  var request=get(path).header("X-Request-Id","11111111-1111-4111-8111-111111111111");if(credential!=null)request.header("Authorization","Bearer "+credential);if(body!=null)request.content(body);
  var result=mvc.perform(request).andReturn().getResponse();assertThat(result.getStatus()).isEqualTo(status);assertThat(result.getHeader("Cache-Control")).isEqualTo("private, no-store");assertThat(result.getHeader("ETag")).isNull();
  var payload=JSON.readTree(result.getContentAsString());assertThat(result.getHeader("X-Request-Id")).isEqualTo("11111111-1111-4111-8111-111111111111");
  if(code!=null){assertThat(payload.path("code").asText()).isEqualTo(code);assertThat(payload.path("requestId").asText()).isEqualTo(result.getHeader("X-Request-Id"));}
  else {assertThat(payload.has("requestId")).isFalse();assertThat(payload.path("observationId").asText()).isNotEqualTo(result.getHeader("X-Request-Id"));}
  assertThat(store.getDirectQuote("SPY")).isEqualTo(before);
  specimens.add(Map.of("status",status,"payload",payload));
 }
 @Test void completeOldUnenrolledRetainedHoldingAndCanonicalCodecIdentity() throws Exception {
  for(String s:new String[]{"SPY","BRK/B","BRK_2FB","^SPX"}){store.setDirectQuote(HeldQuoteFixtures.row(s,HeldQuoteFixtures.FACTS));check("/v2/quotes/"+PathSymbolCodec.encode(s),"read",null,200,null);assertThat(store.getDirectQuote(s)).isEqualTo(HeldQuoteFixtures.row(s,HeldQuoteFixtures.FACTS));}
 }
 @Test void absenceCorruptionAndSecurityAreDistinct() throws Exception {
  store.setChainForExpiration("LEGACY", "2026-10-09", "{\"underlying\":{\"last\":1}}", "2000-01-01T00:00:00Z");
  check("/v2/quotes/LEGACY","read",null,404,"NOT_FOUND");
  check("/v2/quotes/SPY",null,null,401,"UNAUTHENTICATED");check("/v2/quotes/SPY","acquire",null,403,"FORBIDDEN");check("/v2/quotes/SPY","read",null,404,"NOT_FOUND");
  store.setDirectQuote(HeldQuoteFixtures.row("SPY", "{\"open\":1,\"bid\":{\"price\":1,\"sourceEventAt\":\"asksize\"}}"));check("/v2/quotes/SPY","read",null,500,"INTERNAL_ERROR");
  check("/v2/quotes/spy","read",null,422,"INVALID_REQUEST");check("/v2/quotes/BRK_41","read",null,422,"INVALID_REQUEST");check("/v2/quotes/SPY?symbol=QQQ","read",null,422,"INVALID_REQUEST");check("/v2/quotes/SPY","read",new byte[]{1},422,"INVALID_REQUEST");check("/v2/quotes/BRK_","acquire",null,403,"FORBIDDEN");
 }
 @Test void unavailableStorageAndAuthConfigurationAre503() throws Exception {
  var unavailable=mock(SqliteEvidenceStore.class);
  when(unavailable.readHeldDirectQuote(anyString())).thenThrow(new SqliteEvidenceStore.HeldReadUnavailableException(new java.sql.SQLException("secret")));
  for(var auth:List.of(new BearerAuthenticator("read=reader:quote.read"),new BearerAuthenticator(""))){
   var standalone=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new HeldQuotesController(unavailable,auth,JSON)).build();
   var r=standalone.perform(get("/v2/quotes/SPY").header("Authorization","Bearer read")).andReturn().getResponse();assertThat(r.getStatus()).isEqualTo(503);assertThat(r.getContentAsString()).doesNotContain("secret");specimens.add(Map.of("status",503,"payload",JSON.readTree(r.getContentAsString())));
  }
 }
 @Test void correlationValidationAndStoredRequiredFields() throws Exception {
  var result=mvc.perform(get("/v2/quotes/SPY").header("Authorization","Bearer read").header("X-Request-Id","not-id")).andReturn().getResponse();assertThat(result.getStatus()).isEqualTo(422);assertThat(result.getHeader("X-Request-Id")).matches("[0-9a-f-]{36}");
  for(String column:new String[]{"observation_id","security_type","environment","acquisition_id","acquisition_phase","received_at","committed_at","regular_session_date"}){store.setDirectQuote(HeldQuoteFixtures.row("SPY",HeldQuoteFixtures.FACTS));try(var ps=store.getConnection().prepareStatement("UPDATE direct_quote SET "+column+"=? WHERE symbol='SPY'")){ps.setString(1,"malformed");ps.executeUpdate();}check("/v2/quotes/SPY","read",null,500,"INTERNAL_ERROR");}
  store.setDirectQuote(HeldQuoteFixtures.row("SPY",HeldQuoteFixtures.FACTS));
  try(var ps=store.getConnection().prepareStatement("UPDATE direct_quote SET facts_json=? WHERE symbol='SPY'")){
   ps.setBytes(1,"{\"open\":1}".getBytes(java.nio.charset.StandardCharsets.UTF_8));ps.executeUpdate();
  }
  check("/v2/quotes/SPY","read",null,500,"INTERNAL_ERROR");
 }
}
