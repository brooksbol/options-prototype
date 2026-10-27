package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.sun.net.httpserver.HttpServer;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.net.*;
import java.net.http.*;
import java.sql.*;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class TransactionHistoryTest {
    @TempDir Path temp;
    final ObjectMapper json=new ObjectMapper();
    HttpServer server;List<ObjectNode> rows;AtomicInteger requests=new AtomicInteger(),oauth=new AtomicInteger();int failPage=-1;
    boolean duplicate=false,wrongAccount=false,secret=false,changedTotal=false,overBudget=false;String endAt;
    @BeforeEach void start()throws Exception {
        rows=fromCsv(Path.of("../docs/design/ww-history-specimens-2026-10-15/synthetic-reference.csv"));
        server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/oauth/token",x->{oauth.incrementAndGet();var b="{\"access_token\":\"fake-history-access\"}".getBytes();x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(200,b.length);x.getResponseBody().write(b);x.close();});
        server.createContext("/accounts/TTTEST01/transactions",x->{
            requests.incrementAndGet();String query=x.getRequestURI().getRawQuery();var params=new HashMap<String,String>();for(String part:query.split("&")){var kv=part.split("=",2);params.put(kv[0],URLDecoder.decode(kv[1],StandardCharsets.UTF_8));}
            assertThat(params.keySet()).containsExactlyInAnyOrder("per-page","page-offset","sort","end-at");assertThat(params.get("sort")).isEqualTo("Asc");
            assertThat(x.getRequestHeaders().getFirst("Authorization")).isEqualTo("Bearer fake-history-access");
            String end=params.get("end-at");if(endAt==null)endAt=end;assertThat(end).isEqualTo(endAt);
            int page=Integer.parseInt(params.get("page-offset"));var root=json.createObjectNode();var items=root.putObject("data").putArray("items");
            int pages=(rows.size()+6)/7;
            for(int i=page*7;i<Math.min(rows.size(),page*7+7);i++) {var node=rows.get(i).deepCopy();if(wrongAccount)node.put("account-number","OTHER01");if(duplicate&&i==7)node.put("id",1);items.add(node);}
            if(secret)root.put("secret","fake-client-secret");
            root.put("context","/accounts/TTTEST01/transactions");var p=root.putObject("pagination");p.put("page-offset",page);p.put("total-pages",overBudget?101:pages);p.put("total-items",rows.size()+(changedTotal&&page>0?1:0));p.put("current-item-count",items.size());
            byte[] bytes=json.writeValueAsBytes(root);x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(page==failPage?500:200,bytes.length);x.getResponseBody().write(bytes);x.close();
        });server.start();
    }
    @AfterEach void stop(){server.stop(0);}
    TastytradeClient client(){return new TastytradeClient("fake-client-id","fake-client-secret","fake-refresh",URI.create("http://127.0.0.1:"+server.getAddress().getPort()),HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build());}
    TransactionHistory history(SqliteEvidenceStore s,AccountDirectory a,Duration reuse,boolean enabled)throws Exception {return new TransactionHistory(s.getConnection().getMetaData().getURL(),a,client(),json,enabled,reuse,Clock.fixed(Instant.parse("2026-10-15T18:00:00Z"),ZoneOffset.UTC));}
    @SuppressWarnings("unchecked") List<Map<String,Object>> tx(Map<String,Object> response){return (List<Map<String,Object>>)response.get("transactions");}
    int count(SqliteEvidenceStore store,String table)throws Exception {try(var q=store.getConnection().createStatement();var rs=q.executeQuery("SELECT count(*) FROM "+table)){return rs.getInt(1);}}
    @Test void paginatedAllKindsExactMoneyStableIdentitySourceRetentionCorrectionReversalAndFailure()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("history.db").toString())) {
            var accounts=new AccountDirectory(store,"");String account=accounts.bind("tt1","TASTYTRADE","TTTEST01");var h=history(store,accounts,Duration.ZERO,true);
            var first=h.read(account,UUID.randomUUID().toString());assertThat(first.get("complete")).isEqualTo(true);assertThat(first.get("recordCount")).isEqualTo(21);
            assertThat(requests.get()).isEqualTo(3);assertThat(oauth.get()).isEqualTo(1);assertThat(count(store,"account_history_page")).isEqualTo(3);
            assertThat(tx(first).stream().filter(r->r.get("kind").equals("MONEY_MOVEMENT"))).hasSize(3);
            assertThat(tx(first).stream().filter(r->r.get("kind").equals("MONEY_MOVEMENT"))).allSatisfy(r->{assertThat(r.get("commission")).isNull();assertThat(r.get("orderId")).isNull();});
            var ids=tx(first).stream().map(r->r.get("transactionId")).toList();
            var repeated=h.read(account,UUID.randomUUID().toString());assertThat(tx(repeated).stream().map(r->r.get("transactionId")).toList()).isEqualTo(ids);
            assertThat(count(store,"account_transaction_observation")).isEqualTo(21);assertThat(count(store,"brokerage_artifact")).isEqualTo(3);
            rows.get(1).put("commission","2.00");rows.get(1).put("net-value","147.88");rows.get(20).put("reverses-id",2);
            var changed=h.read(account,UUID.randomUUID().toString());assertThat(count(store,"account_transaction")).isEqualTo(21);assertThat(count(store,"account_transaction_observation")).isEqualTo(23);
            assertThat(tx(changed).stream().filter(r->r.get("sourceTransactionId").equals("2")).findFirst().orElseThrow().get("correctionStatus")).isEqualTo("CHANGED_OBSERVATION");
            assertThat(tx(changed).stream().filter(r->r.get("sourceTransactionId").equals("21")).findFirst().orElseThrow().get("reversalStatus")).isEqualTo("LINKED");
            failPage=2;var failed=h.read(account,UUID.randomUUID().toString());assertThat(failed.get("complete")).isEqualTo(false);assertThat(failed.get("evidenceMode")).isEqualTo("RETAINED");assertThat(tx(failed)).isEqualTo(tx(changed));
            assertThat(count(store,"account_transaction_observation")).isEqualTo(23);
            assertThat(json.writeValueAsString(failed)).doesNotContain("TTTEST01","fake-client-secret","fake-history-access");
        }
    }
    @Test void reuseDisabledPolicyMissingSourceEmptyAndRestart()throws Exception {
        String path=temp.resolve("reuse.db").toString();String account;
        try(var store=new SqliteEvidenceStore(path)) {
            var accounts=new AccountDirectory(store,"");account=accounts.bind("tt1","TASTYTRADE","TTTEST01");
            var disabled=history(store,accounts,Duration.ofMinutes(5),false).read(account,UUID.randomUUID().toString());assertThat(disabled.get("complete")).isEqualTo(false);assertThat(requests.get()).isZero();
            var h=history(store,accounts,Duration.ofMinutes(5),true);h.read(account,UUID.randomUUID().toString());h.read(account,UUID.randomUUID().toString());assertThat(requests.get()).isEqualTo(3);
        }
        try(var store=new SqliteEvidenceStore(path)) {
            var accounts=new AccountDirectory(store,"");assertThat(history(store,accounts,Duration.ofMinutes(5),false).read(account,UUID.randomUUID().toString()).get("complete")).isEqualTo(true);
            rows.clear();var empty=history(store,accounts,Duration.ZERO,true).read(account,UUID.randomUUID().toString());
            assertThat(empty.get("recordCount")).isEqualTo(21); // Absence never deletes earlier ledger observations.
        }
        try(var store=new SqliteEvidenceStore(temp.resolve("empty.db").toString())) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("tt1","TASTYTRADE","TTTEST01");
            var empty=history(store,accounts,Duration.ZERO,true).read(id,UUID.randomUUID().toString());assertThat(empty.get("recordCount")).isEqualTo(0);assertThat(empty.get("complete")).isEqualTo(true);
        }
    }
    @Test void sourceFailuresCannotPublishAndOriginalsAreRetainedBeforeInvalidInterpretation()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("bad.db").toString())) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("tt1","TASTYTRADE","TTTEST01");var h=history(store,accounts,Duration.ZERO,true);
            duplicate=true;assertThat(h.read(id,UUID.randomUUID().toString()).get("complete")).isEqualTo(false);assertThat(count(store,"account_transaction")).isZero();assertThat(count(store,"brokerage_artifact")).isEqualTo(2);
            duplicate=false;wrongAccount=true;assertThat(h.read(id,UUID.randomUUID().toString()).get("complete")).isEqualTo(false);assertThat(count(store,"account_transaction")).isZero();
            wrongAccount=false;secret=true;int originals=count(store,"brokerage_artifact");assertThat(h.read(id,UUID.randomUUID().toString()).get("complete")).isEqualTo(false);assertThat(count(store,"brokerage_artifact")).isEqualTo(originals);
            secret=false;rows.get(0).remove("id");assertThat(h.read(id,UUID.randomUUID().toString()).get("complete")).isEqualTo(false);
        }
    }
    @Test void numericJsonMoneyAndPriceNeverPassThroughFloatingPoint()throws Exception {
        String wire="""
            {"data":{"items":[{"account-number":"TTTEST01","id":90071992547409931234,
              "transaction-date":"2026-10-15","transaction-type":"Trade","currency":"USD",
              "price":1.5000000000000001,"net-value":9007199254740993.1234567890123456,"net-value-effect":"Credit"}]},
              "pagination":{"page-offset":0,"total-pages":1,"total-items":1,"current-item-count":1}}
            """;
        var row=TastytradeTransactions.normalize(TastytradeTransactions.page(wire.getBytes(StandardCharsets.UTF_8),"TTTEST01",0).items().getFirst(),"TTTEST01");
        assertThat(row.get("sourceTransactionId")).isEqualTo("90071992547409931234");assertThat(row.get("price")).isEqualTo("1.5000000000000001");assertThat(row.get("netCash")).isEqualTo("9007199254740993.1234567890123456");
        var tiny=TastytradeTransactions.normalize(TastytradeTransactions.page(wire.replace("1.5000000000000001","1e-16").getBytes(StandardCharsets.UTF_8),"TTTEST01",0).items().getFirst(),"TTTEST01");assertThat(tiny.get("price")).isEqualTo("0.0000000000000001");
    }
    @Test void changingPageTotalsCapacityAndUnknownMoneyEffectsNeverPublish()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("inconsistent.db").toString())) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("tt1","TASTYTRADE","TTTEST01");var h=history(store,accounts,Duration.ZERO,true);
            changedTotal=true;assertThat(h.read(id,UUID.randomUUID().toString()).get("complete")).isEqualTo(false);assertThat(count(store,"account_transaction")).isZero();assertThat(count(store,"brokerage_artifact")).isEqualTo(2);
            changedTotal=false;overBudget=true;assertThat(h.read(id,UUID.randomUUID().toString()).get("complete")).isEqualTo(false);assertThat(count(store,"account_transaction")).isZero();
            overBudget=false;rows.get(0).remove("net-value-effect");assertThat(h.read(id,UUID.randomUUID().toString()).get("complete")).isEqualTo(false);assertThat(count(store,"account_transaction")).isZero();
        }
    }
    @Test void concurrentReadsReuseOneScanAndAtoBtoAChangesRemainObserved()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("concurrent.db").toString())) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("tt1","TASTYTRADE","TTTEST01");var h=history(store,accounts,Duration.ofMinutes(5),true);
            try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)) {
                var a=pool.submit(()->h.read(id,UUID.randomUUID().toString()));var b=pool.submit(()->h.read(id,UUID.randomUUID().toString()));
                assertThat(a.get().get("complete")).isEqualTo(true);assertThat(b.get().get("complete")).isEqualTo(true);assertThat(requests.get()).isEqualTo(3);
            }
            var original=rows.get(0).deepCopy();var noReuse=history(store,accounts,Duration.ZERO,true);
            rows.get(0).put("description","Changed source observation");noReuse.read(id,UUID.randomUUID().toString());rows.set(0,original);
            var restored=noReuse.read(id,UUID.randomUUID().toString());assertThat(count(store,"account_transaction")).isEqualTo(21);assertThat(count(store,"account_transaction_observation")).isEqualTo(23);
            assertThat(tx(restored).stream().filter(r->r.get("sourceTransactionId").equals("1")).findFirst().orElseThrow().get("correctionStatus")).isEqualTo("CHANGED_OBSERVATION");
        }
    }
    @Test void modelAAccountNestingValidationAndNoAdminOrHoldingsBypass()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("auth.db").toString())) {
            var accounts=new AccountDirectory(store,"");String id=accounts.bind("tt1","TASTYTRADE","TTTEST01"),other=accounts.bind("tt2","TASTYTRADE","OTHER01");
            var auth=new BearerAuthenticator(new UserDirectory(store,accounts),"allowed=a:account.read:"+id+"|account.transactions.read:"+id+",admin=b:users.admin,holdings=c:account.positions.read:"+id+",other=d:account.transactions.read:"+other);
            var mvc=MockMvcBuilders.standaloneSetup(new TransactionsController(history(store,accounts,Duration.ofMinutes(5),true),accounts,auth,json)).build();String path="/v2/accounts/"+id+"/transactions";
            assertThat(mvc.perform(get(path)).andReturn().getResponse().getStatus()).isEqualTo(401);
            for(String token:List.of("admin","holdings","other"))assertThat(mvc.perform(get(path).header("Authorization","Bearer "+token)).andReturn().getResponse().getStatus()).isEqualTo(403);
            assertThat(requests.get()).isZero();
            assertThat(mvc.perform(get(path).queryParam("limit","1").header("Authorization","Bearer allowed")).andReturn().getResponse().getStatus()).isEqualTo(422);
            assertThat(requests.get()).isZero();
            var response=mvc.perform(get(path).header("Authorization","Bearer allowed")).andReturn().getResponse();assertThat(response.getStatus()).isEqualTo(200);assertThat(response.getHeader("Cache-Control")).isEqualTo("private, no-store");
            var result=json.readTree(response.getContentAsString());String txId=result.path("transactions").get(0).path("transactionId").asText();
            assertThat(mvc.perform(get(path+"/"+txId).header("Authorization","Bearer allowed")).andReturn().getResponse().getStatus()).isEqualTo(200);
            assertThat(mvc.perform(get("/v2/accounts/"+other+"/transactions/"+txId).header("Authorization","Bearer other")).andReturn().getResponse().getStatus()).isEqualTo(404);
        }
    }
    @Test void privateCsvReferenceExercisesAll21RowsWithoutClaimingLiveApiEquivalence()throws Exception {
        String path=System.getProperty("realFilePath","");Assumptions.assumeTrue(!path.isBlank());
        byte[] bytes=Files.readAllBytes(Path.of(path));assertThat(BrokerageArtifacts.sha(bytes)).isEqualTo("4987a78b44aa39f007167bdcd72825b8579f4bbf15a7ae6d8e5e5a47462d7958");
        var csv=FidelityPositions.csv(new String(bytes,StandardCharsets.UTF_8));var header=csv.getFirst();var api=fromCsv(Path.of(path));assertThat(api).hasSize(21);
        for(int i=0;i<api.size();i++) {
            var normalized=TastytradeTransactions.normalize(api.get(i),"TTTEST01");var source=csv.get(i+1);
            assertThat(new BigDecimal((String)normalized.get("netCash"))).isEqualByComparingTo(new BigDecimal(source.get(header.indexOf("Total"))));
            assertThat(normalized.get("commission")==null).isEqualTo(source.get(header.indexOf("Commissions")).equals("--"));
        }
    }

    @Test void fidelityRetainedImportIdentityExactMoneyMissingFieldsAndNoAcquisition()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("fidelity.db").toString())) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("pts","FIDELITY","SYNTHETIC01");
            var artifacts=new BrokerageArtifacts(store,json,new PositionReadService(store,json),accounts);
            String header="Run Date,Action,Symbol,Description,Quantity,Price ($),Commission ($),Fees ($),Amount ($),Settlement Date\n";
            String body="10/14/2026,YOU SOLD,DEMO,Demo shares,-2,1.2345678901234567,-0.10,-0.02,2.3491357802469134,10/15/2026\n";
            var result=artifacts.ingest(id,"History_for_Account_SYNTHETIC01.csv","ACTIVITY",(header+body+body).getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());assertThat(result.status()).isEqualTo("ACCEPTED");
            var h=history(store,accounts,Duration.ZERO,true);var first=h.read(id,UUID.randomUUID().toString());assertThat(first.get("recordCount")).isEqualTo(2);assertThat(first.get("complete")).isEqualTo(true);
            assertThat(first.get("freshness")).isEqualTo("UNVERIFIED");assertThat(first.get("asOf")).isNull();assertThat(first.get("checkedAt")).isNull();assertThat(first.get("lastImportedAt")).isNotNull();
            assertThat(tx(first)).allSatisfy(r->{assertThat(r.get("sourceTransactionId")).isNull();assertThat(r.get("sourceIdentityStatus")).isEqualTo("ROW_EQUIVALENCE_ONLY");assertThat(r.get("currency")).isNull();assertThat(r.get("netCash")).isEqualTo("2.3491357802469134");assertThat(r.get("fees")).isEqualTo("-0.02");});
            var ids=tx(first).stream().map(r->r.get("transactionId")).toList();assertThat(tx(h.read(id,UUID.randomUUID().toString())).stream().map(r->r.get("transactionId")).toList()).isEqualTo(ids);assertThat(requests.get()).isZero();assertThat(oauth.get()).isZero();
            String sparse="Run Date,Action,Symbol,Amount ($)\n10/15/2026,CASH TRANSFER,,25.00\n";
            assertThat(artifacts.ingest(id,"History_for_Account_SYNTHETIC01 (2).csv","ACTIVITY",sparse.getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString()).status()).isEqualTo("ACCEPTED");
            var later=h.read(id,UUID.randomUUID().toString());assertThat(later.get("recordCount")).isEqualTo(3);
            var cash=tx(later).stream().filter(r->r.get("action").equals("CASH TRANSFER")).findFirst().orElseThrow();assertThat(cash.get("commission")).isNull();assertThat(cash.get("fees")).isNull();assertThat(cash.get("orderId")).isNull();
            assertThat(count(store,"account_history_attempt")).isZero();
        }
    }
    List<ObjectNode> fromCsv(Path path)throws Exception {
        var csv=FidelityPositions.csv(Files.readString(path));var h=csv.getFirst();var result=new ArrayList<ObjectNode>();int id=0;var orders=new LinkedHashMap<String,Integer>();
        for(var row:csv.subList(1,csv.size())) {
            if(row.stream().allMatch(String::isBlank))continue;
            var n=json.createObjectNode();n.put("id",++id);n.put("account-number","TTTEST01");
            String date=row.get(h.indexOf("Date"));if(date.matches(".*[+-][0-9]{4}$"))date=date.substring(0,date.length()-2)+":"+date.substring(date.length()-2);
            n.put("transaction-date",date.substring(0,10));n.put("executed-at",date);n.put("currency",row.get(h.indexOf("Currency")));n.put("transaction-type",row.get(h.indexOf("Type")));n.put("transaction-sub-type",row.get(h.indexOf("Sub Type")));
            String action=row.get(h.indexOf("Sub Type"));n.put("action",action);n.put("description","Reference fixture transaction");
            for(String[] f:List.of(new String[]{"symbol","Symbol"},new String[]{"instrument-type","Instrument Type"},new String[]{"quantity","Quantity"},new String[]{"price","Average Price"})) {String v=row.get(h.indexOf(f[1]));if(!v.isBlank())n.put(f[0],v);}
            if(!row.get(h.indexOf("Order #")).isBlank())n.put("order-id",orders.computeIfAbsent(row.get(h.indexOf("Order #")),k->orders.size()+1)); // Preserve grouping without retaining private IDs.
            for(String[] f:List.of(new String[]{"value","Value"},new String[]{"net-value","Total"},new String[]{"commission","Commissions"},new String[]{"clearing-fees","Fees"})) {
                String v=row.get(h.indexOf(f[1]));if(v.equals("--")||v.isBlank())continue;var d=new BigDecimal(v);n.put(f[0],d.abs().toPlainString());n.put(f[0]+"-effect",d.signum()<0?"Debit":"Credit");
            }
            for(String key:List.of("regulatory-fees","proprietary-index-option-fees","currency-conversion-fees")){n.put(key,"0.00");n.put(key+"-effect","Debit");}
            result.add(n);
        }
        return result;
    }
    @Test void boundedRetainedQueryNeverAcquiresAndCursorBindsScopeAndEvidence()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("bounded.db").toString())) {
            var accounts=new AccountDirectory(store,"");String account=accounts.bind("fixture","TASTYTRADE","TTTEST01");var h=history(store,accounts,Duration.ZERO,true);
            var empty=h.retained(account,"r",null,null,null,3,null);assertThat(tx(empty)).isEmpty();assertThat(requests.get()).isZero();
            h.read(account,"r");int acquired=requests.get();
            var first=h.retained(account,"r",null,null,null,3,null);assertThat(tx(first)).hasSize(3);assertThat(first.get("pageComplete")).isEqualTo(false);assertThat(first.get("matchedRecordCount")).isEqualTo(21);
            var second=h.retained(account,"r",null,null,null,3,(String)first.get("nextCursor"));assertThat(tx(second)).hasSize(3);assertThat(tx(first).stream().map(r->r.get("transactionId"))).doesNotContainAnyElementsOf(tx(second).stream().map(r->r.get("transactionId")).toList());
            assertThatThrownBy(()->h.retained(account,"r",null,null,null,4,(String)first.get("nextCursor"))).isInstanceOf(IllegalArgumentException.class);
            String symbol=(String)tx(first).stream().filter(r->r.get("symbol")!=null).findFirst().orElseThrow().get("symbol");
            var selected=h.retained(account,"r",symbol,null,null,100,null);assertThat(tx(selected)).allSatisfy(r->assertThat(r.get("symbol")).isEqualTo(symbol));assertThat(requests.get()).isEqualTo(acquired);
            rows.get(1).put("commission","2.00");h.read(account,"r");
            assertThatThrownBy(()->h.retained(account,"r",null,null,null,3,(String)first.get("nextCursor"))).isInstanceOf(IllegalArgumentException.class);
            var auth=new BearerAuthenticator(new UserDirectory(store,accounts),"reader=reader:account.transactions.read:"+account);
            var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new TransactionsController(h,accounts,auth,json)).build();
            int before=requests.get();var response=mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/v2/accounts/"+account+"/transactions?mode=retained&limit=3").header("Authorization","Bearer reader")).andReturn().getResponse();
            assertThat(response.getStatus()).isEqualTo(200);assertThat(requests.get()).isEqualTo(before);
            java.nio.file.Files.createDirectories(Path.of("build/reports/transactions"));java.nio.file.Files.writeString(Path.of("build/reports/transactions/bounded.json"),response.getContentAsString());
            for(String query:List.of("?limit=1","?mode=retained&limit=0","?mode=retained&from=bad","?mode=retained&limit=1&limit=2","?mode=retained&unknown=1"))
                assertThat(mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/v2/accounts/"+account+"/transactions"+query).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(422);
        }
    }

}
