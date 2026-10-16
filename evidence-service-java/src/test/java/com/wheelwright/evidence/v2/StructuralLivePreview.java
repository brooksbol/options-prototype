package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.annotation.*;
import java.nio.file.*;
import java.math.BigDecimal;
import java.time.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.util.*;

/** Test-only disposable retained evidence. Actual accepted controllers/services;
 * no production acquisition beans/configuration and no external provider contact. */
public class StructuralLivePreview {
    static Path directory;
    static final String TOKEN=UUID.randomUUID().toString();
    static final ObjectMapper JSON=new ObjectMapper();
    @org.springframework.boot.test.context.TestConfiguration
    @EnableAutoConfiguration
    @Import({AccountsController.class,PositionsController.class})
    static class Preview {
        @Bean(destroyMethod="close") SqliteEvidenceStore store()throws Exception{return new SqliteEvidenceStore(directory.resolve("preview.sqlite3").toString());}
        @Bean AccountDirectory accounts(SqliteEvidenceStore store)throws Exception{var a=new AccountDirectory(store,"");a.bind("demo-fidelity","FIDELITY","SYNTHETIC01");a.bind("demo-tasty","TASTYTRADE","SYNTHETIC02");return a;}
        @Bean UserDirectory users(SqliteEvidenceStore store,AccountDirectory accounts)throws Exception{return new UserDirectory(store,accounts);}
        @Bean BearerAuthenticator auth(UserDirectory users,AccountDirectory accounts)throws Exception{var grants=new ArrayList<String>();for(var a:accounts.list()){grants.add("account.read:"+a.id());grants.add("account.positions.read:"+a.id());}return new BearerAuthenticator(users,TOKEN+"=preview:"+String.join("|",grants));}
        @Bean PositionReadService positions(SqliteEvidenceStore store,ObjectMapper json)throws Exception{return new PositionReadService(store,json);}
    }
    static PositionSnapshot.Constituent option(String key,String root,String expiry,String right,String strike,int quantity){
        var id=new OptionIdentity(root,expiry,right,new BigDecimal(strike));
        return new PositionSnapshot.Constituent("holding-"+FidelityPositions.digest(key),id.nativeSymbol(),"SYNTHETIC", "Options","SYNTHETIC",new BigDecimal(quantity),null,null,null,null,expiry,List.of());
    }
    static class Definitions extends TastytradeClient {
        final Map<String,OptionIdentity> identities=new HashMap<>();
        Definitions(){super("synthetic-id","synthetic-secret","synthetic-refresh",URI.create("http://127.0.0.1:1"),HttpClient.newHttpClient());}
        @Override public Set<String> contractDefinitions(List<DefinitionSubject> subjects,DefinitionSink sink)throws Exception{
            var attempted=new HashSet<String>();for(var s:subjects){attempted.add(s.holdingId());var id=identities.get(s.symbol());var option=JSON.createObjectNode();var data=option.putObject("data");
                data.put("symbol",s.symbol());data.put("instrument-type","Equity Option");data.put("underlying-symbol",id.root());data.put("option-type",id.right());data.put("strike-price",id.strike().toPlainString());data.put("expiration-date",id.expiration());data.put("expires-at",id.expiration()+"T20:15:00Z");data.put("option-chain-type","Standard");data.put("shares-per-contract",100);sink.accept(s,"OPTION",JSON.writeValueAsBytes(option));
                var underlying=JSON.createObjectNode();var u=underlying.putObject("data");u.put("symbol",id.root());u.put("instrument-type","Equity");u.put("listed-market","ARCX");if(!id.root().equals("MISSING"))u.put("is-index",id.root().equals("SPX"));sink.accept(s,"UNDERLYING",JSON.writeValueAsBytes(underlying));
            }return attempted;
        }
    }
    static void seed(SqliteEvidenceStore store,AccountDirectory accounts,PositionReadService service)throws Exception{
        var associations=new PositionAssociations(store,JSON);var source=new Definitions();var definitions=new ContractDefinitionAcquisition(store,JSON,source);var users=new UserDirectory(store,accounts);
        String expiry=LocalDate.now(ZoneId.of("America/New_York")).plusDays(35).toString();
        for(var account:accounts.list()){
            var held=new ArrayList<PositionSnapshot.Constituent>();var packages=new ArrayList<List<PositionSnapshot.Constituent>>();
            if(account.brokerAssociation().broker().equals("TASTYTRADE")){
                var ic=List.of(option("ic-lp","XLE",expiry,"P","59",3),option("ic-sp","XLE",expiry,"P","59.5",-3),option("ic-sc","XLE",expiry,"C","64.5",-3),option("ic-lc","XLE",expiry,"C","65",3));held.addAll(ic);packages.add(ic);
                var modified=List.of(option("mod-lp","QQQ",expiry,"P","450",1),option("mod-sp","QQQ",expiry,"P","455",-1),option("mod-sc","QQQ",expiry,"C","465",-2),option("mod-lc","QQQ",expiry,"C","470",1));held.addAll(modified);packages.add(modified);
                var vertical=List.of(option("vert-lp","XLF",expiry,"P","52",1),option("vert-sp","XLF",expiry,"P","52.5",-1));held.addAll(vertical);packages.add(vertical);
            }else{
                held.add(option("single","XLE",expiry,"C","90",-1));held.add(option("unsupported","SPX",expiry,"P","5000",-1));held.add(option("missing","MISSING",expiry,"C","20",1));held.add(option("expired","OLD",LocalDate.now().minusDays(1).toString(),"P","1",-1));
                held.add(new PositionSnapshot.Constituent("holding-"+FidelityPositions.digest("shares"),"XLE","SYNTHETIC unassociated shares","Stocks","Cash",new BigDecimal("100"),null,null,null,null,null,List.of()));
            }
            String snapshot="synthetic-"+UUID.randomUUID(),time=Instant.now().toString();var observation=account.brokerAssociation().broker().equals("TASTYTRADE")?new PositionSnapshot.Observation("TASTYTRADE","PRODUCTION",UUID.randomUUID().toString(),time,time,TastytradeHoldings.VERSION,"REQUESTED_ACCOUNT_FULL_HOLDINGS"):null;
            service.admit(new PositionSnapshot(account.id(),account.brokerAssociation().accountNumber(),account.alias(),snapshot,LocalDate.now(ZoneOffset.UTC).toString(),time,"SYNTHETIC-retained-evidence.json",FidelityPositions.digest(JSON.writeValueAsString(held)),null,List.copyOf(held),List.of(),0,observation));
            for(var h:held)if(h.kind().equals("Options"))source.identities.put(h.contract(),OptionIdentity.of(h));
            definitions.acquire(account.id(),snapshot,"synthetic-definition-seed");String author=users.bootstrap("synthetic-author-"+account.alias(),Set.of("account.positions.associate:"+account.id()));
            for(var pack:packages){
                boolean split=pack.getFirst().contract().startsWith("XLE");
                for(int unit:split?List.of(2,1):List.of(0)){
                    var allocations=pack.stream().map(h->new PositionAssociations.Allocation(h.holdingId(),split?Integer.toString(unit*h.quantity().signum()):h.quantity().toPlainString())).toList();
                    associations.create(new PositionAssociations.Input(account.id(),snapshot,UUID.randomUUID().toString(),"ASSERT",null,allocations,"THESE_ALLOCATIONS_FORM_ONE_CURRENT_MANAGED_OPTION_POSITION"),author);
                }
            }
        }
    }
    public static void main(String[] args)throws Exception{
        Path ready=Path.of(args[0]);directory=ready.getParent();var app=new SpringApplication(Preview.class);
        var context=(ServletWebServerApplicationContext)app.run("--server.address=127.0.0.1","--server.port=0","--spring.main.banner-mode=off","--logging.level.root=WARN","--spring.config.location=optional:file:"+directory.resolve("absent.properties"));
        try{seed(context.getBean(SqliteEvidenceStore.class),context.getBean(AccountDirectory.class),context.getBean(PositionReadService.class));
            JSON.writeValue(ready.toFile(),Map.of("base","http://127.0.0.1:"+context.getWebServer().getPort(),"token",TOKEN,"fixture","synthetic-option-structure-v2"));
        }catch(Exception e){context.close();throw e;}
    }
}
