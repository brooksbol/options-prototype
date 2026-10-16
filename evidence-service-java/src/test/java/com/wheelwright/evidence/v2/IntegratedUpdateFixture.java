package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.*;
import jakarta.servlet.*;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.annotation.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;

/** Isolated engineering installation fixture. No production scan/configuration/credentials or live adapters. */
public class IntegratedUpdateFixture {
    static Path directory;
    static TransactionHistoryTest broker;
    static final String TOKEN=UUID.randomUUID().toString();
    static final List<String> events=new ArrayList<>();
    static final Instant BASE=Instant.parse("2026-10-15T18:00:00Z");
    static String fidelityAccount;
    static final Clock CLOCK=new Clock() {
        public ZoneId getZone(){return ZoneOffset.UTC;}
        public Clock withZone(ZoneId zone){return this;}
        public Instant instant(){return BASE.plusSeconds(Files.exists(directory.resolve("fail-quotes"))?600:0);}
    };
    static synchronized void event(String value) {
        events.add(value);
        try{new ObjectMapper().writeValue(directory.resolve("trace.json").toFile(),Map.of("events",List.copyOf(events)));}catch(Exception e){throw new IllegalStateException(e);}
    }
    @org.springframework.boot.test.context.TestConfiguration
    @EnableAutoConfiguration
    @Import({PortfolioCapitalController.class,AccountsController.class,UsersController.class,ArtifactsController.class,PositionsController.class,PositionAcquisitionController.class,TransactionsController.class,MarketEvidenceSubjectsController.class})
    static class Fixture {
        @Bean(destroyMethod="close") SqliteEvidenceStore store()throws Exception{return new SqliteEvidenceStore(directory.resolve("fixture.sqlite3").toString());}
        @Bean AccountDirectory accounts(SqliteEvidenceStore store)throws Exception {var a=new AccountDirectory(store,"");a.bind("tt1","TASTYTRADE","TTTEST01");a.bind("pts","FIDELITY",fidelityAccount);return a;}
        @Bean UserDirectory users(SqliteEvidenceStore store,AccountDirectory a)throws Exception{return new UserDirectory(store,a);}
        @Bean BearerAuthenticator auth(UserDirectory users,AccountDirectory a)throws Exception {
            var grants=new ArrayList<>(List.of("quote.acquire","quote.read","quote.force"));
            for(var account:a.list()) {
                for(String g:List.of("account.read","account.positions.read","account.transactions.read"))grants.add(g+":"+account.id());
                if(account.brokerAssociation().broker().equals("TASTYTRADE"))grants.add("account.positions.acquire:"+account.id());
                else for(String g:List.of("account.artifacts.read","account.artifacts.write"))grants.add(g+":"+account.id());
            }
            return new BearerAuthenticator(users,TOKEN+"=integrated-fixture:"+String.join("|",grants)+",empty-scope=empty-fixture:quote.acquire,read-only=read-fixture:quote.read");
        }
        @Bean PositionReadService positions(SqliteEvidenceStore store,ObjectMapper json)throws Exception{return new PositionReadService(store,json);}
        @Bean BrokerageArtifacts artifacts(SqliteEvidenceStore store,ObjectMapper json,PositionReadService p,AccountDirectory a)throws Exception{return new BrokerageArtifacts(store,json,p,a);}
        @Bean TastytradeClient client(){return broker.client();}
        @Bean PositionAcquisition acquisition(SqliteEvidenceStore store,AccountDirectory a,PositionReadService p,TastytradeClient client)throws Exception{return new PositionAcquisition(store,a,p,client);}
        @Bean PortfolioCapitalHistory capital(SqliteEvidenceStore store,BrokerageArtifacts artifacts)throws Exception{return new PortfolioCapitalHistory(store,artifacts);}
        @Bean TransactionHistory history(SqliteEvidenceStore store,AccountDirectory a)throws Exception{return broker.history(store,a,Duration.ofMinutes(5),true);}
        @Bean MarketEvidenceSubjects subjects(SqliteEvidenceStore store,AccountDirectory a,PositionReadService p,BearerAuthenticator auth) {
            return new MarketEvidenceSubjects(store,a,p,auth.authenticate("Bearer "+TOKEN).orElseThrow().userId());
        }
        @Bean ProviderAuthorityManager manager() {
            var cache=new ResponseCache();var pacer=new RequestPacer(119,200);
            var adapter=new TradierAdapter("synthetic-no-network","http://127.0.0.1:1",cache,pacer);
            var manager=new ProviderAuthorityManager(new ProviderAuthority("prod","production",adapter,cache,pacer),null);manager.markSingleAuthorityActiveForLegacy();return manager;
        }
        @Bean DirectQuoteService quotes(SqliteEvidenceStore store,ProviderAuthorityManager manager) {
            DirectQuoteSource source=new DirectQuoteSource() {
                public boolean contactAvailable(){return true;}
                public BatchResult acquire(List<String> symbols,String request) {
                    event("FETCH "+String.join(",",symbols));var result=new LinkedHashMap<String,SubjectUpstream>();
                    for(String s:symbols) {
                        boolean fail=Files.exists(directory.resolve("fail-quotes"))&&s.equals("EWZ");
                        var raw=new RawQuote(ResolvedSubject.SecurityType.ETF,"Synthetic "+s,"ARCA",100.0,1L,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null);
                        result.put(s,new SubjectUpstream(fail?UpstreamStatus.FAILED:UpstreamStatus.VERIFIED,fail?null:raw,"tradier",QuoteProvenance.Environment.PRODUCTION,UUID.randomUUID().toString(),"prod","1","fixture-"+request,QuoteProvenance.AcquisitionPhase.REGULAR_USABLE,"2026-10-15",fail?null:CLOCK.instant().minusSeconds(1).toString(),fail?"Synthetic quote failure":null));
                    }
                    return new BatchResult(result);
                }
            };
            return new DirectQuoteService(source,manager,store,new QuoteAcquisitionPolicy(60,true,true),CLOCK);
        }
        @Bean V2QuotesController quoteController(DirectQuoteService s,BearerAuthenticator a,ObjectMapper j){return new V2QuotesController(s,a,j,CLOCK);}
        @Bean Filter trace() {return (request,response,chain)->{var r=(jakarta.servlet.http.HttpServletRequest)request;event("HTTP "+r.getMethod()+" "+r.getRequestURI());chain.doFilter(request,response);};}
    }
    public static void main(String[] args)throws Exception {
        Path ready=Path.of(args[0]);directory=ready.getParent();
        fidelityAccount="UPDATESYNTH"+Integer.toUnsignedString(directory.toString().hashCode(),16).toUpperCase(Locale.ROOT);
        broker=new TransactionHistoryTest();broker.start();
        byte[] positions=Files.readAllBytes(Path.of("src/test/resources/tastytrade/xle-api.json"));
        broker.server.createContext("/accounts/TTTEST01/positions",x->{event("SYNC_HOLDINGS");x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(Files.exists(directory.resolve("fail-holdings"))?503:200,positions.length);x.getResponseBody().write(positions);x.close();});
        Runtime.getRuntime().addShutdownHook(new Thread(()->broker.stop()));
        var app=new SpringApplication(Fixture.class);
        var context=(ServletWebServerApplicationContext)app.run("--server.address=127.0.0.1","--server.port=0","--spring.main.banner-mode=off","--logging.level.root=WARN","--spring.config.location=optional:file:"+directory.resolve("absent.properties"));
        var store=context.getBean(SqliteEvidenceStore.class);store.initUniverse(List.of("EWZ"));store.setMonitoredSymbols(List.of("EWZ"));
        String holdings=PositionsTest.csv(fidelityAccount+",Synthetic PTS,ETFs,SPY,Shares,2,200,--,Cash\n","Oct-15-2026");
        String activity="Run Date,Action,Symbol,Description,Quantity,Price ($),Commission ($),Fees ($),Amount ($),Settlement Date\n10/14/2026,YOU SOLD,SPY,Synthetic shares,-2,1.2345678901234567,-0.10,-0.02,2.3491357802469134,10/15/2026\n10/15/2026,CASH TRANSFER,,Synthetic deposit,,,,,250.00,\n";
        var files=List.of(Map.of("name","positions-"+fidelityAccount+".csv","content",holdings),Map.of("name","History_for_Account_"+fidelityAccount+".csv","content",activity));
        new ObjectMapper().writeValue(ready.toFile(),Map.of("base","http://127.0.0.1:"+context.getWebServer().getPort(),"token",TOKEN,"fixture","integrated-update-v1","sourceFiles",files));
        Files.setPosixFilePermissions(ready,java.nio.file.attribute.PosixFilePermissions.fromString("rw-------"));
    }
}
