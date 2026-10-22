package com.wheelwright.evidence.v2;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import java.net.*;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;

/** Loopback transport only. Does not prove live brokerage availability or financial normalization. */
class PortfolioMarketAcquisitionTest {
 @Test void boundedTypedMarketReadUsesBackendCredentialAndRejectsSecretBearingResponses()throws Exception{
  var calls=new AtomicInteger();var unsafe=new AtomicBoolean();var credentials=new AtomicBoolean(true);var query=new AtomicReference<String>();
  var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/oauth/token",x->{var bytes="{\"access_token\":\"private-access-token\"}".getBytes(StandardCharsets.UTF_8);x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(200,bytes.length);x.getResponseBody().write(bytes);x.close();});
  server.createContext("/market-data/by-type",x->{calls.incrementAndGet();query.set(x.getRequestURI().getRawQuery());credentials.set(credentials.get()&&x.getRequestMethod().equals("GET")&&"Bearer private-access-token".equals(x.getRequestHeaders().getFirst("Authorization")));var bytes=(unsafe.get()?"{\"data\":{\"items\":[]},\"diagnostic\":\"private-access-token\"}":"{\"data\":{\"items\":[]}}").getBytes(StandardCharsets.UTF_8);x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(200,bytes.length);x.getResponseBody().write(bytes);x.close();});server.start();
  try{
   var client=new TastytradeClient("synthetic-client", "synthetic-secret", "synthetic-refresh",URI.create("http://127.0.0.1:"+server.getAddress().getPort()),HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build());
   assertThat(new String(client.marketData(List.of("XLF"),List.of("XLF   261127P00052500")),StandardCharsets.UTF_8)).isEqualTo("{\"data\":{\"items\":[]}}");assertThat(credentials).isTrue();assertThat(query.get()).isEqualTo("equity[]=XLF&equity-option[]=XLF+++261127P00052500");
   for(var bad:List.of(List.of("XLF","XLF"),List.of("../orders"),Collections.nCopies(101,"XLF")))assertThatThrownBy(()->client.marketData(bad,List.of())).isInstanceOf(IllegalStateException.class).hasMessage("market acquisition unavailable");
   assertThatThrownBy(()->client.marketData(List.of(),List.of("XLF?account=OTHER"))).isInstanceOf(IllegalStateException.class);assertThat(calls).hasValue(1);
   unsafe.set(true);assertThatThrownBy(()->client.marketData(List.of("XLF"),List.of())).isInstanceOf(IllegalStateException.class).hasMessage("market acquisition unavailable");
  }finally{server.stop(0);}
 }
}
