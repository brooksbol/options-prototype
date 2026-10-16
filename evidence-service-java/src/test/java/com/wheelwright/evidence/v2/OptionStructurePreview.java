package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.annotation.*;
import java.nio.file.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/** Real candidate controllers/domain/storage, synthetic evidence, no acquisition beans. */
public class OptionStructurePreview {
    static Path directory;
    static final String TOKEN=UUID.randomUUID().toString();
    @org.springframework.boot.test.context.TestConfiguration
    @EnableAutoConfiguration
    @Import({AccountsController.class,PositionsController.class})
    static class Preview {
        @Bean(destroyMethod="close") SqliteEvidenceStore store() throws Exception {return new SqliteEvidenceStore(directory.resolve("preview.sqlite3").toString());}
        @Bean AccountDirectory accounts(SqliteEvidenceStore store) throws Exception {
            var a=new AccountDirectory(store,"");a.bind("demo-fidelity","DEMO01");a.bind("demo-tasty","TASTYTRADE","DEMO02");return a;
        }
        @Bean UserDirectory users(SqliteEvidenceStore store,AccountDirectory accounts)throws Exception{return new UserDirectory(store,accounts);}
        @Bean BearerAuthenticator auth(UserDirectory users,AccountDirectory accounts)throws Exception {
            var grants=new ArrayList<String>();for(var a:accounts.list()){grants.add("account.read:"+a.id());grants.add("account.positions.read:"+a.id());}
            return new BearerAuthenticator(users,TOKEN+"=option-preview:"+String.join("|",grants));
        }
        @Bean PositionReadService positions(SqliteEvidenceStore store,ObjectMapper mapper)throws Exception{return new PositionReadService(store,mapper);}
    }
    public static void main(String[] args)throws Exception {
        Path ready=Path.of(args[0]);directory=ready.getParent();
        var app=new SpringApplication(Preview.class);
        var context=(ServletWebServerApplicationContext)app.run("--server.address=127.0.0.1","--server.port=0","--spring.main.banner-mode=off","--logging.level.root=WARN",
                "--spring.config.location=optional:file:"+directory.resolve("absent.properties"));
        var accounts=context.getBean(AccountDirectory.class);var service=context.getBean(PositionReadService.class);
        for(var account:accounts.list()) {
            var holdings=new ArrayList<PositionSnapshot.Constituent>();var associations=new ArrayList<PositionSnapshot.Association>();
            if(account.brokerAssociation().broker().equals("TASTYTRADE")) {
                holdings.addAll(OptionStructureTest.condor(3));
                associations.add(new PositionSnapshot.Association("position-"+"a".repeat(24),"Synthetic condor",holdings.stream().map(PositionSnapshot.Constituent::holdingId).toList(),null,"Synthetic explicit whole-package association"));
                var modified=new ArrayList<PositionSnapshot.Constituent>();
                for(var h:OptionStructureTest.condor(1))modified.add(new PositionSnapshot.Constituent(h.holdingId()+"-modified",h.contract().replace("SPY","QQQ"),h.description(),h.kind(),h.custody(),h.holdingId().equals("holding-sc")?new BigDecimal("-2"):h.quantity(),null,null,null,null,h.expiration(),h.sourceRows()));
                holdings.addAll(modified);associations.add(new PositionSnapshot.Association("position-"+"b".repeat(24),"Synthetic ratio",modified.stream().map(PositionSnapshot.Constituent::holdingId).toList(),null,"Synthetic explicit modified structure"));
                var vertical=List.of(OptionStructureTest.option("vl","XLF","2026-11-27","P","52",1),OptionStructureTest.option("vs","XLF","2026-11-27","P","52.5",-1));
                holdings.addAll(vertical);associations.add(new PositionSnapshot.Association("position-"+"c".repeat(24),"Synthetic vertical",vertical.stream().map(PositionSnapshot.Constituent::holdingId).toList(),null,"Synthetic explicit vertical"));
            } else {
                var call=OptionStructureTest.option("call","XLE","2026-11-20","C","90",-1);
                var shares=new PositionSnapshot.Constituent("holding-shares","XLE","Synthetic shares","Stocks","Cash",new BigDecimal("100"),null,null,null,null,null,List.of(2));
                holdings.addAll(List.of(call,shares));associations.add(new PositionSnapshot.Association("position-"+"d".repeat(24),"Synthetic collateral",List.of(call.holdingId(),shares.holdingId()),null,"Synthetic associated actual shares"));
                holdings.add(OptionStructureTest.option("adjusted","ETHA1","2026-11-20","C","20.5",-1));
                holdings.add(OptionStructureTest.option("expired","EXPIRED","2026-01-01","P","1",-1));
                holdings.add(new PositionSnapshot.Constituent("holding-bond","912TEST","Synthetic Treasury","Bonds/Fixed income","Cash",new BigDecimal("1000"),null,null,null,null,null,List.of(3)));
            }
            var evidence=OptionStructureTest.instruments(holdings.stream().filter(h->!h.contract().contains("ETHA1")).toList());
            var observation=account.brokerAssociation().broker().equals("TASTYTRADE")?new PositionSnapshot.Observation("TASTYTRADE","PRODUCTION","synthetic",Instant.now().toString(),Instant.now().toString(),TastytradeHoldings.VERSION,"REQUESTED_ACCOUNT_FULL_HOLDINGS"):null;
            service.admit(new PositionSnapshot(account.id(),account.brokerAssociation().accountNumber(),account.alias(),"synthetic-structure", "2026-10-16",Instant.now().toString(),"synthetic-position-evidence.csv","a".repeat(64),null,holdings,associations,0,observation,evidence));
        }
        new ObjectMapper().writeValue(ready.toFile(),Map.of("base","http://127.0.0.1:"+context.getWebServer().getPort(),"token",TOKEN,"fixture","synthetic-option-structure-v1"));
    }
}
