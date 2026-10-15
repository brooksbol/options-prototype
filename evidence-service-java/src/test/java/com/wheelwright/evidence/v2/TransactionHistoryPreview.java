package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.annotation.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

/** Test-only synthetic-provider preview. Never loads operational configuration or provider credentials. */
public class TransactionHistoryPreview {
    static Path directory;
    static final String TOKEN=UUID.randomUUID().toString();
    static TransactionHistoryTest fixture;
    @org.springframework.boot.test.context.TestConfiguration
    @EnableAutoConfiguration
    @Import({AccountsController.class,TransactionsController.class,UsersController.class})
    static class Preview {
        @Bean(destroyMethod="close") SqliteEvidenceStore store()throws Exception{return new SqliteEvidenceStore(directory.resolve("preview.sqlite3").toString());}
        @Bean AccountDirectory accounts(SqliteEvidenceStore store)throws Exception {
            var a=new AccountDirectory(store,"");a.bind("tt1","TASTYTRADE","TTTEST01");a.bind("pts","FIDELITY","SYNTHETIC01");return a;
        }
        @Bean UserDirectory users(SqliteEvidenceStore store,AccountDirectory accounts)throws Exception{return new UserDirectory(store,accounts);}
        @Bean BearerAuthenticator auth(UserDirectory users,AccountDirectory accounts)throws Exception {
            var grants=new ArrayList<String>();for(var a:accounts.list()){grants.add("account.read:"+a.id());grants.add("account.transactions.read:"+a.id());}
            return new BearerAuthenticator(users,TOKEN+"=transaction-preview:"+String.join("|",grants));
        }
        @Bean TransactionHistory history(SqliteEvidenceStore store,AccountDirectory accounts)throws Exception{return fixture.history(store,accounts,Duration.ofMinutes(5),true);}
    }
    public static void main(String[] args)throws Exception {
        Path ready=Path.of(args[0]);directory=ready.getParent();fixture=new TransactionHistoryTest();fixture.start();
        Runtime.getRuntime().addShutdownHook(new Thread(()->fixture.stop()));
        var app=new SpringApplication(Preview.class);
        var context=(ServletWebServerApplicationContext)app.run("--server.address=127.0.0.1","--server.port=0","--spring.main.banner-mode=off","--logging.level.root=WARN","--spring.config.location=optional:file:"+directory.resolve("absent.properties"));
        var accounts=context.getBean(AccountDirectory.class);var store=context.getBean(SqliteEvidenceStore.class);var mapper=context.getBean(ObjectMapper.class);
        var artifacts=new BrokerageArtifacts(store,mapper,new PositionReadService(store,mapper),accounts);
        String pts=accounts.list().stream().filter(a->a.alias().equals("pts")).findFirst().orElseThrow().id();
        String csv="Run Date,Action,Symbol,Description,Quantity,Price ($),Commission ($),Fees ($),Amount ($),Settlement Date\n"+
                "10/14/2026,YOU SOLD,DEMO,Demo shares,-2,1.2345678901234567,-0.10,-0.02,2.3491357802469134,10/15/2026\n"+
                "10/15/2026,CASH TRANSFER,,Synthetic deposit,,,,,250.00,\n";
        if(!artifacts.ingest(pts,"History_for_Account_SYNTHETIC01.csv","ACTIVITY",csv.getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString()).status().equals("ACCEPTED"))throw new IllegalStateException("synthetic admission failed");
        mapper.writeValue(ready.toFile(),Map.of("base","http://127.0.0.1:"+context.getWebServer().getPort(),"token",TOKEN,"fixture","synthetic-transactions-v1"));
        Files.setPosixFilePermissions(ready,java.nio.file.attribute.PosixFilePermissions.fromString("rw-------"));
    }
}
