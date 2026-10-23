package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Mock brokerage transport, real admission/selection/read-through. Never contacts a brokerage. */
class PortfolioPageAcquisitionTest {
 @TempDir Path directory;
 @Test void selectedPageDefinesQuoteSubjectsAndReusePartition()throws Exception {
  var f=new PortfolioSourcePackageTest();f.directory=directory;f.setup();try{
   var inventory=array();for(int i=0;i<1000;i++)inventory.add(obj().put("account-number","TEST1234").put("symbol","SYN"+i).put("underlying-symbol","SYN"+i).put("instrument-type","Equity").put("quantity","1").put("quantity-direction","Long"));f.holdings(inventory);
   var client=mock(TastytradeClient.class);when(client.configured()).thenReturn(true);var requests=new ArrayList<List<String>>();
   when(client.marketData(anyList(),anyList())).thenAnswer(call->{List<String> equities=call.getArgument(0);List<String> options=call.getArgument(1);assertThat(options).isEmpty();requests.add(List.copyOf(equities));var quotes=array();for(String symbol:equities)quotes.add(obj().put("symbol",symbol).put("instrument-type","Equity").put("bid","99").put("ask","101").put("mid","100").put("updated-at",Instant.now().toString()));return JSON.writeValueAsBytes(f.page(quotes,"/market-data/by-type"));});
   when(client.equitySession()).thenThrow(new IllegalStateException("Synthetic unavailable session"));
   var reads=new PortfolioReadService(f.repo,f.sources);reads.marketAcquisition(new PortfolioMarketAcquisition(f.repo,f.accounts,client,true,Duration.ofSeconds(30),Clock.systemUTC()));
   var auth=TestAuthentication.auth("owner=user:account.positions.read:"+f.account+"|account.market.read:"+f.account+"|market.read|reference.read,restricted=user2:account.positions.read:"+f.account);
   var mvc=MockMvcBuilders.standaloneSetup(new PortfolioController(reads,auth,f.accounts)).build();
   var restricted=mvc.perform(get("/v2/positions?limit=5").header("Authorization","Bearer restricted")).andReturn().getResponse();assertThat(restricted.getStatus()).isEqualTo(200);assertThat(requests).isEmpty();
   var first=mvc.perform(get("/v2/positions?limit=5").header("Authorization","Bearer owner")).andReturn().getResponse();assertThat(first.getStatus()).isEqualTo(200);var body=JSON.readTree(first.getContentAsString());assertThat(body.path("items")).hasSize(5);assertThat(requests).hasSize(1);assertThat(requests.getFirst()).hasSize(5);
   mvc.perform(get("/v2/positions?limit=5").header("Authorization","Bearer owner")).andReturn();assertThat(requests).hasSize(1);
   var next=mvc.perform(get(body.at("/next/href").asText()).header("Authorization","Bearer owner")).andReturn().getResponse();assertThat(next.getStatus()).isEqualTo(200);assertThat(requests).hasSize(2);assertThat(requests.get(1)).hasSize(5).doesNotContainAnyElementsOf(requests.getFirst());
   var expanded=mvc.perform(get("/v2/positions?projection=expanded&limit=20&include=currentConstruction").header("Authorization","Bearer owner")).andReturn().getResponse();assertThat(expanded.getStatus()).isEqualTo(200);assertThat(requests).hasSize(3);assertThat(requests.get(2)).hasSize(20);verify(client,never()).holdings(anyString());verify(client,never()).orders(anyString(),any());
  }finally{f.close();}
 }
}
