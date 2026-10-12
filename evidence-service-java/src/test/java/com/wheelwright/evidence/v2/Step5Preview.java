package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.annotation.*;
import java.nio.file.*;
import java.net.*;
import java.net.http.HttpClient;
import java.util.*;

/** Engineering-only fixture preview. No application scan, operational database or real provider. */
public class Step5Preview {
    static Path directory;
    static HttpServer broker;
    static final String BEARER=UUID.randomUUID().toString();
    @org.springframework.boot.test.context.TestConfiguration
    @EnableAutoConfiguration
    @Import({AccountsController.class,PositionsController.class,PositionAcquisitionController.class})
    static class Preview {
        @Bean(destroyMethod="close") SqliteEvidenceStore store()throws Exception {return new SqliteEvidenceStore(directory.resolve("preview.sqlite3").toString());}
        @Bean AccountDirectory accounts(SqliteEvidenceStore store)throws Exception {var a=new AccountDirectory(store,"");a.bind("tt1","TASTYTRADE","TTTEST01");return a;}
        @Bean UserDirectory users(SqliteEvidenceStore store,AccountDirectory accounts)throws Exception {return new UserDirectory(store,accounts);}
        @Bean BearerAuthenticator auth(UserDirectory users,AccountDirectory accounts)throws Exception {
            String id=accounts.list().getFirst().id();return new BearerAuthenticator(users,BEARER+"=fixture-preview:account.read:"+id+"|account.positions.read:"+id+"|account.positions.acquire:"+id);
        }
        @Bean PositionReadService positions(SqliteEvidenceStore store,ObjectMapper mapper)throws Exception{return new PositionReadService(store,mapper);}
        @Bean TastytradeClient client(){return new TastytradeClient("preview-client","preview-secret","preview-refresh",URI.create("http://127.0.0.1:"+broker.getAddress().getPort()),HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build());}
        @Bean PositionAcquisition acquisitions(SqliteEvidenceStore store,AccountDirectory accounts,PositionReadService positions,TastytradeClient client)throws Exception{return new PositionAcquisition(store,accounts,positions,client);}
    }
    public static void main(String[] args)throws Exception {
        Path ready=Path.of(args[0]);directory=ready.getParent();
        broker=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        byte[] fixture=Files.readAllBytes(Path.of("src/test/resources/tastytrade/xle-api.json"));
        broker.createContext("/oauth/token",x->{var b="{\"access_token\":\"preview-access\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8);x.getRequestBody().readAllBytes();x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(200,b.length);x.getResponseBody().write(b);x.close();});
        broker.createContext("/accounts/TTTEST01/positions",x->{x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(200,fixture.length);x.getResponseBody().write(fixture);x.close();});
        broker.start();Runtime.getRuntime().addShutdownHook(new Thread(()->broker.stop(0)));
        var app=new SpringApplication(Preview.class);
        var context=(ServletWebServerApplicationContext)app.run("--server.address=127.0.0.1","--server.port=0","--spring.main.banner-mode=off","--logging.level.root=WARN","--spring.config.location=optional:file:"+directory.resolve("absent.properties"));
        var account=context.getBean(AccountDirectory.class).list().getFirst().id();
        var attempt=context.getBean(PositionAcquisition.class).acquire(account,UUID.randomUUID().toString());
        if(!attempt.status().equals("ACCEPTED"))throw new IllegalStateException("fixture preview failed");
        new ObjectMapper().writeValue(ready.toFile(),Map.of("base","http://127.0.0.1:"+context.getWebServer().getPort(),"token",BEARER));
    }
}
