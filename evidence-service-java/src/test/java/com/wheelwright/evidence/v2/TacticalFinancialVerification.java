package com.wheelwright.evidence.v2;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import java.nio.file.*;import java.time.*;import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
/** Explicit engineer-local replay. Retained copy only; no provider, app workers or SDK/model. */
public final class TacticalFinancialVerification {
 public static void main(String[] args){try{if(args.length==4&&(args[3].equals("serve")||args[3].equals("public-reference-serve")))serve(args);else run(args);}catch(Exception e){System.out.println("{\"verification\":\"RETAINED_FINANCIAL_REPLAY\",\"completed\":false}");System.exit(1);}}
 static void serve(String[] args)throws Exception{
  var original=Path.of(args[1]).toRealPath();var directory=Path.of(args[2]).toRealPath();String user=Objects.requireNonNull(System.getenv("WW_VERIFY_USER_ID"));if(new UserDirectory("jdbc:sqlite:file:"+original+"?mode=ro").get(user).isEmpty())throw new IllegalArgumentException();
  TalkRetainedPreview.directory=directory;TalkRetainedPreview.accountSource=original;TalkRetainedPreview.userId=user;TalkRetainedPreview.token=UUID.randomUUID().toString();
  boolean publicReferences=args[3].equals("public-reference-serve");if(publicReferences&&!"PRINCIPAL_APPROVED_FIDELITY_PUBLIC_REFERENCE_READS_20261029".equals(System.getenv("WW_VERIFY_PUBLIC_REFERENCE_POLICY")))throw new IllegalArgumentException();
  var app=new org.springframework.boot.SpringApplication(publicReferences?FidelityReferencePreview.class:TalkRetainedPreview.Preview.class);app.setDefaultProperties(Map.of("server.port","0","server.address","127.0.0.1","spring.main.banner-mode","off","logging.level.root","ERROR"));var context=(org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext)app.run();
  if((!publicReferences&&!context.getBeansOfType(TastytradeClient.class).isEmpty())||!context.getBeansOfType(PortfolioMarketAcquisition.class).isEmpty()||!context.getBeansOfType(PortfolioOrderAcquisition.class).isEmpty()){context.close();throw new IllegalArgumentException();}
  if(publicReferences&&!context.getBean(TastytradeClient.class).configured()){context.close();throw new IllegalArgumentException();}
  var ready=obj().put("base","http://127.0.0.1:"+context.getWebServer().getPort()).put("token",TalkRetainedPreview.token).put("profile","AUTHORIZED_REAL_RETAINED_READS").put("providerBeans",publicReferences).put("publicReferenceProviderOnly",publicReferences);write(directory.resolve("ready.json"),ready);
 }
 static void run(String[] args)throws Exception{
  if(args.length!=3)throw new IllegalArgumentException();var copy=Path.of(args[0]).toRealPath();var original=Path.of(args[1]).toRealPath();var output=Path.of(args[2]).toRealPath();
  if(Files.isSameFile(copy,original)||!Files.getPosixFilePermissions(copy).equals(java.nio.file.attribute.PosixFilePermissions.fromString("rw-------")))throw new IllegalArgumentException();
  String account=Objects.requireNonNull(System.getenv("WW_VERIFY_ACCOUNT_ID")),user=Objects.requireNonNull(System.getenv("WW_VERIFY_USER_ID"));var grants=new UserDirectory("jdbc:sqlite:file:"+original+"?mode=ro").grants(user).orElseThrow();var principal=new BearerAuthenticator.Principal(user,grants);for(String g:List.of("account.positions.read:"+account,"account.holdings.read:"+account,"account.orders.read:"+account,"account.market.read:"+account,"market.read","reference.read"))if(!principal.hasGrant(g))throw new IllegalArgumentException();
  var before=JSON.readTree(Files.readString(output.resolve("talk-tactical.json")));var now=Instant.parse(before.at("/items/0/evaluation/evaluatedAt").asText());
  try(var store=new SqliteEvidenceStore(copy.toString())){var accounts=new AccountDirectory(store,"");if(!accounts.get(account).orElseThrow().alias().equals("tt1"))throw new IllegalArgumentException();var repo=new PortfolioRepository(store,JSON);var source=new PortfolioSources(repo,JSON,accounts);source.refresh(Set.of(account));var reader=new PortfolioReadService(repo,source);var context=new PortfolioReadService.ReadContext();var items=array();
   for(var p:reader.page(PortfolioRepository.Kind.POSITION,Set.of(account),Map.of("exposureStatus","OBSERVED,UNKNOWN,RETAINED,UNRECORDED_NONCLOSED"),"",false,200))items.add(reader.tactical(p,principal,now,context));var result=obj().put("projection","tactical");result.set("items",items);result.putNull("next");result.set("warnings",array());write(output.resolve("candidate-tactical.json"),result);
   var orders=array();int nativeLinks=0;for(var o:repo.list(PortfolioRepository.Kind.ORDER,Set.of(account))){var v=reader.read(o,principal,now);if(v.has("brokerGroupStructure")){nativeLinks++;orders.add(v);}}write(output.resolve("candidate-linked-orders.json"),orders);
   System.out.println(JSON.writeValueAsString(obj().put("verification","RETAINED_FINANCIAL_REPLAY").put("completed",true).put("rows",items.size()).put("ordersWithNativeGroupLinks",nativeLinks).put("productionWritten",false).put("providerRequests",0).put("modelRequests",0)));
  }
 }
 static void write(Path p,com.fasterxml.jackson.databind.JsonNode value)throws Exception{Files.writeString(p,JSON.writeValueAsString(value));Files.setPosixFilePermissions(p,java.nio.file.attribute.PosixFilePermissions.fromString("rw-------"));}
}
