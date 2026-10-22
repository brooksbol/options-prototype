package com.wheelwright.evidence.v2;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import java.net.*;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** External HTTP observations of bounded fallback, not a live brokerage test. */
class TastytradeReferenceFallbackTest {
 @Test void fourConcurrentSingleReadsReuseOneTokenAndDoNotManufactureFailedMembers()throws Exception{
  var symbols=new ArrayList<String>();for(int i=0;i<8;i++)symbols.add("SPY   261120C"+String.format(Locale.ROOT,"%08d",100000+i*1000));String missing=symbols.get(2);var tokens=new AtomicInteger();var calls=new AtomicInteger();var active=new AtomicInteger();var peak=new AtomicInteger();var barrier=new CountDownLatch(4);var executor=Executors.newFixedThreadPool(8);var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);server.setExecutor(executor);
  server.createContext("/oauth/token",x->{tokens.incrementAndGet();byte[] b="{\"access_token\":\"synthetic-access\"}".getBytes(StandardCharsets.UTF_8);x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(200,b.length);x.getResponseBody().write(b);x.close();});
  server.createContext("/instruments/equity-options/",x->{int count=active.incrementAndGet();peak.accumulateAndGet(count,Math::max);calls.incrementAndGet();barrier.countDown();try{barrier.await(2,TimeUnit.SECONDS);String symbol=x.getRequestURI().getPath().substring("/instruments/equity-options/".length());boolean valid=x.getRequestMethod().equals("GET")&&"Bearer synthetic-access".equals(x.getRequestHeaders().getFirst("Authorization"))&&symbols.contains(symbol);var root=obj();root.set("data",obj().put("symbol",symbol).put("instrument-type","Equity Option"));byte[] b=JSON.writeValueAsBytes(root);x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(!valid?400:symbol.equals(missing)?503:200,b.length);x.getResponseBody().write(b);}catch(Exception ignored){}finally{active.decrementAndGet();x.close();}});server.start();
  try{var client=new TastytradeClient("synthetic-client","synthetic-secret","synthetic-refresh",URI.create("http://127.0.0.1:"+server.getAddress().getPort()),HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build());var received=new TreeMap<String,byte[]>();var failed=client.optionDefinitionFallback(symbols,received::put);assertThat(failed).containsExactly(missing);assertThat(received).hasSize(7).doesNotContainKey(missing);for(var item:received.entrySet())assertThat(JSON.readTree(item.getValue()).at("/data/symbol").asText()).isEqualTo(item.getKey());assertThat(tokens).hasValue(1);assertThat(calls).hasValue(8);assertThat(peak).hasValue(4);assertThatThrownBy(()->client.optionDefinitions(List.of("../accounts/private"))).isInstanceOf(IllegalStateException.class);assertThat(tokens).hasValue(1);}
  finally{server.stop(0);executor.shutdownNow();}
 }
}
