package com.wheelwright.evidence.v2;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.net.*;
import java.net.http.*;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.Flow;

/** Backend-only OAuth; no token cache, credentials in URLs, redirects or upstream diagnostics. */
@Component
public class TastytradeClient {
    private final String clientId,clientSecret,refreshToken;
    private final URI base;
    private final HttpClient http;
    private final Duration deadline;
    @org.springframework.beans.factory.annotation.Autowired
    public TastytradeClient(@Value("${wheelwright.tastytrade.client-id:}") String clientId,
            @Value("${wheelwright.tastytrade.client-secret:}") String clientSecret,
            @Value("${wheelwright.tastytrade.refresh-token:}") String refreshToken) {
        this(clientId,clientSecret,refreshToken,URI.create("https://api.tastyworks.com"),
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NEVER).build());
    }
    // Package-private for local fake-provider verification only. Production authority is fixed above.
    TastytradeClient(String clientId,String clientSecret,String refreshToken,URI base,HttpClient http) {
        this(clientId,clientSecret,refreshToken,base,http,Duration.ofSeconds(10));
    }
    TastytradeClient(String clientId,String clientSecret,String refreshToken,URI base,HttpClient http,Duration deadline) {
        if(deadline.isNegative()||deadline.isZero())throw new IllegalArgumentException("positive deadline required");
        this.deadline=deadline;
        this.clientId=clientId;this.clientSecret=clientSecret;this.refreshToken=refreshToken;this.base=base;this.http=http;
    }
    public boolean configured(){return !clientId.isBlank()&&!clientSecret.isBlank()&&!refreshToken.isBlank();}
    @FunctionalInterface public interface TransactionPageSink { void accept(int offset,byte[] bytes) throws Exception; }

    /** One OAuth exchange and bounded full traversal. Sink retains each safe page before interpretation. */
    public void transactions(String account,String endAt,TransactionPageSink sink) throws Exception {
        if(!configured()||!account.matches("[A-Za-z0-9]+"))throw new IllegalStateException("transaction acquisition unavailable");
        java.time.Instant.parse(endAt);
        long expires=System.nanoTime()+deadline.toNanos();int total=-1,pages=-1,count=0,bytesRead=0;
        try {
            String token=accessToken(expires);
            for(int offset=0;offset<100;offset++) {
                String path="/accounts/"+account+"/transactions?per-page=250&page-offset="+offset+"&sort=Asc&end-at="+encode(endAt);
                var request=HttpRequest.newBuilder(base.resolve(path)).timeout(deadline)
                        .header("Accept","application/json").header("User-Agent","Wheelwright/transaction-history-v1")
                        .header("Authorization","Bearer "+token).GET().build();
                var reply=receive(request,BrokerageArtifacts.MAX_BYTES,expires);
                if(reply.statusCode()!=200||!reply.headers().firstValue("Content-Type").orElse("").matches("(?i)application/json(?:\\s*;.*)?"))throw new IllegalStateException();
                byte[] bytes=reply.body();bytesRead=Math.addExact(bytesRead,bytes.length);
                if(bytesRead>BrokerageArtifacts.MAX_BYTES)throw new IllegalStateException();
                String text=new String(bytes,StandardCharsets.UTF_8);
                for(String secret:List.of(clientId,clientSecret,refreshToken,token))if(text.contains(secret))throw new IllegalStateException();
                if(!safeDocument(TastytradeHoldings.document(bytes),List.of(clientId,clientSecret,refreshToken,token)))throw new IllegalStateException();
                sink.accept(offset,bytes);
                var page=TastytradeTransactions.page(bytes,account,offset);
                if(offset==0){total=page.total();pages=page.pages();if(pages>100||total>25000)throw new IllegalStateException();}
                if(total!=page.total()||pages!=page.pages())throw new IllegalStateException();
                count=Math.addExact(count,page.items().size());
                if(offset>=Math.max(1,pages)-1) {if(count!=total)throw new IllegalStateException();return;}
                if(page.items().isEmpty())throw new IllegalStateException();
            }
            throw new IllegalStateException(); // Budget exhaustion is failure, never truncated success.
        }catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException("transaction acquisition unavailable");}
        catch(Exception e){throw new IllegalStateException("transaction acquisition unavailable");}
    }
    @FunctionalInterface public interface OrderPageSink { void accept(int offset,byte[] bytes) throws Exception; }

    /** Accepted tt Orders pagination, backend-owned and read-only. Safe originals reach the
     * sink before semantic validation; a later failure never reports truncated success. */
    public void orders(String account,OrderPageSink sink)throws Exception { orderPages(account,sink,"orders"); }
    public void complexOrders(String account,OrderPageSink sink)throws Exception { orderPages(account,sink,"complex-orders"); }
    private void orderPages(String account,OrderPageSink sink,String family)throws Exception {
        if(!configured()||!account.matches("[A-Za-z0-9]+"))throw new IllegalStateException("Order acquisition unavailable");
        long expires=System.nanoTime()+deadline.toNanos();int expectedPages=-1,expectedItems=-1,count=0,size=0;var identities=new HashSet<String>();
        try {
            String token=accessToken(expires);
            for(int offset=0;offset<100;offset++){
                var request=HttpRequest.newBuilder(base.resolve("/accounts/"+account+"/"+family+"?per-page=100&page-offset="+offset)).timeout(deadline)
                    .header("Accept","application/json").header("User-Agent","Wheelwright/foundational-Order-evidence-v1").header("Authorization","Bearer "+token).GET().build();
                var reply=receive(request,BrokerageArtifacts.MAX_BYTES,expires);
                if(reply.statusCode()!=200||!reply.headers().firstValue("Content-Type").orElse("").matches("(?i)application/json(?:\\s*;.*)?"))throw new IllegalStateException();
                byte[] bytes=reply.body();size=Math.addExact(size,bytes.length);if(size>BrokerageArtifacts.MAX_BYTES)throw new IllegalStateException();
                var root=TastytradeHoldings.document(bytes);if(!safeDocument(root,List.of(clientId,clientSecret,refreshToken,token)))throw new IllegalStateException();
                sink.accept(offset,bytes);
                var page=root.path("pagination");var items=root.at("/data/items");String context=root.path("context").asText();
                if(!items.isArray()||!context.isBlank()&&!context.equals("/accounts/"+account+"/"+family))throw new IllegalStateException();
                for(String field:List.of("page-offset","total-pages","total-items"))if(!page.path(field).isIntegralNumber()||page.path(field).asInt(-1)<0)throw new IllegalStateException();
                int pages=page.path("total-pages").asInt(),total=page.path("total-items").asInt();if(page.path("page-offset").asInt()!=offset||pages>100||total>10000)throw new IllegalStateException();
                if(offset==0){expectedPages=pages;expectedItems=total;}else if(pages!=expectedPages||total!=expectedItems)throw new IllegalStateException();
                for(var item:items)if(!item.path("account-number").asText().equals(account)||item.path("id").isNull()||item.path("id").isMissingNode()||item.path("id").asText().isBlank()||!identities.add(item.path("id").asText()))throw new IllegalStateException();
                count=Math.addExact(count,items.size());if(System.nanoTime()>expires)throw new IllegalStateException();
                if(offset+1>=Math.max(1,pages)){if(count!=total||pages==0&&count!=0)throw new IllegalStateException();return;}if(items.isEmpty())throw new IllegalStateException();
            }
            throw new IllegalStateException();
        }catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException("Order acquisition unavailable");}
        catch(Exception e){throw new IllegalStateException("Order acquisition unavailable");}
    }

    /** Supported market reads only. Reuses the accepted tt typed-symbol request shape;
     * no Account authority, transaction mutation, streaming session or arbitrary URL capability. */
    public byte[] marketData(List<String> equities,List<String> equityOptions)throws Exception {
        if(equities==null||equityOptions==null||equities.size()+equityOptions.size()==0||equities.size()+equityOptions.size()>100)throw new IllegalStateException("market acquisition unavailable");
        var query=new ArrayList<String>();var seen=new HashSet<String>();
        for(String symbol:equities){if(symbol==null||!symbol.matches("[A-Z][A-Z0-9.]{0,9}")||!seen.add("equity:"+symbol))throw new IllegalStateException("market acquisition unavailable");query.add("equity[]="+encode(symbol));}
        for(String symbol:equityOptions){if(symbol==null||!symbol.matches("[A-Z0-9.]{1,6} {0,5}[0-9]{6}[CP][0-9]{8}")||!seen.add("option:"+symbol))throw new IllegalStateException("market acquisition unavailable");query.add("equity-option[]="+encode(symbol));}
        if(!configured())throw new IllegalStateException("market acquisition unavailable");
        long expires=System.nanoTime()+deadline.toNanos();
        try{
            String token=accessToken(expires);
            var request=HttpRequest.newBuilder(base.resolve("/market-data/by-type?"+String.join("&",query))).timeout(deadline).header("Accept","application/json").header("Authorization","Bearer "+token).GET().build();
            var reply=receive(request,BrokerageArtifacts.MAX_BYTES,expires);
            if(reply.statusCode()!=200||!reply.headers().firstValue("Content-Type").orElse("").matches("(?i)application/json(?:\\s*;.*)?"))throw new IllegalStateException();
            var bytes=reply.body();var secrets=List.of(clientId,clientSecret,refreshToken,token);String content=new String(bytes,StandardCharsets.UTF_8);for(String secret:secrets)if(content.contains(secret))throw new IllegalStateException();
            if(!safeDocument(TastytradeHoldings.document(bytes),secrets))throw new IllegalStateException();
            return bytes;
        }catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException("market acquisition unavailable");}
        catch(Exception e){throw new IllegalStateException("market acquisition unavailable");}
    }

    /** Read-only current equities session context; never a historical price substitute. */
    public byte[] equitySession()throws Exception {
        if(!configured())throw new IllegalStateException("session acquisition unavailable");
        long expires=System.nanoTime()+deadline.toNanos();
        try{
            String token=accessToken(expires);
            var request=HttpRequest.newBuilder(base.resolve("/market-time/equities/sessions/current")).timeout(deadline).header("Accept","application/json").header("Authorization","Bearer "+token).GET().build();
            var reply=receive(request,BrokerageArtifacts.MAX_BYTES,expires);
            if(reply.statusCode()!=200||!reply.headers().firstValue("Content-Type").orElse("").matches("(?i)application/json(?:\\s*;.*)?"))throw new IllegalStateException();
            var bytes=reply.body();var secrets=List.of(clientId,clientSecret,refreshToken,token);String content=new String(bytes,StandardCharsets.UTF_8);for(String secret:secrets)if(content.contains(secret))throw new IllegalStateException();
            if(!safeDocument(TastytradeHoldings.document(bytes),secrets))throw new IllegalStateException();return bytes;
        }catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException("session acquisition unavailable");}
        catch(Exception e){throw new IllegalStateException("session acquisition unavailable");}
    }

    /** Read-only compact reference for one validated underlying; no universal securities scan. */
    public byte[] compactOptionChain(String underlying)throws Exception {
        if(underlying==null||!underlying.matches("[A-Z][A-Z0-9.]{0,9}"))throw new IllegalStateException("reference acquisition unavailable");
        if(!configured())throw new IllegalStateException("reference acquisition unavailable");
        long expires=System.nanoTime()+deadline.toNanos();
        try{
            String token=accessToken(expires);
            var request=HttpRequest.newBuilder(base.resolve("/option-chains/"+encode(underlying)+"/compact")).timeout(deadline).header("Accept","application/json").header("Authorization","Bearer "+token).GET().build();
            var reply=receive(request,BrokerageArtifacts.MAX_BYTES,expires);
            if(reply.statusCode()!=200||!reply.headers().firstValue("Content-Type").orElse("").matches("(?i)application/json(?:\\s*;.*)?"))throw new IllegalStateException();
            var bytes=reply.body();var secrets=List.of(clientId,clientSecret,refreshToken,token);String content=new String(bytes,StandardCharsets.UTF_8);for(String secret:secrets)if(content.contains(secret))throw new IllegalStateException();
            if(!safeDocument(TastytradeHoldings.document(bytes),secrets))throw new IllegalStateException();return bytes;
        }catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException("reference acquisition unavailable");}
        catch(Exception e){throw new IllegalStateException("reference acquisition unavailable");}
    }

    /** Explicit held contract definitions; bounded accepted tt batch request. */
    public byte[] optionDefinitions(List<String> symbols)throws Exception {
        if(symbols==null||symbols.isEmpty()||symbols.size()>100||new HashSet<>(symbols).size()!=symbols.size())throw new IllegalStateException("reference acquisition unavailable");
        var query=new ArrayList<String>();for(String symbol:symbols){if(symbol==null||!symbol.matches("[A-Z0-9.]{1,6} {0,5}[0-9]{6}[CP][0-9]{8}"))throw new IllegalStateException("reference acquisition unavailable");query.add("symbol[]="+encode(symbol));}
        if(!configured())throw new IllegalStateException("reference acquisition unavailable");
        long expires=System.nanoTime()+deadline.toNanos();
        try{
            String token=accessToken(expires);
            var request=HttpRequest.newBuilder(base.resolve("/instruments/equity-options?with-expired=true&"+String.join("&",query))).timeout(deadline).header("Accept","application/json").header("Authorization","Bearer "+token).GET().build();
            var reply=receive(request,BrokerageArtifacts.MAX_BYTES,expires);
            if(reply.statusCode()!=200||!reply.headers().firstValue("Content-Type").orElse("").matches("(?i)application/json(?:\\s*;.*)?"))throw new IllegalStateException();
            var bytes=reply.body();var secrets=List.of(clientId,clientSecret,refreshToken,token);String content=new String(bytes,StandardCharsets.UTF_8);for(String secret:secrets)if(content.contains(secret))throw new IllegalStateException();
            if(!safeDocument(TastytradeHoldings.document(bytes),secrets))throw new IllegalStateException();return bytes;
        }catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException("reference acquisition unavailable");}
        catch(Exception e){throw new IllegalStateException("reference acquisition unavailable");}
    }

    @FunctionalInterface public interface OptionDefinitionSink {void accept(String symbol,byte[] bytes)throws Exception;}
    /** Accepted bounded single-contract fallback: four concurrent reads, one OAuth token,
     * one overall transport deadline. Missing members are reported, never synthesized. */
    public Set<String> optionDefinitionFallback(List<String> symbols,OptionDefinitionSink sink)throws Exception {
        if(symbols==null||symbols.isEmpty()||symbols.size()>100||new HashSet<>(symbols).size()!=symbols.size()||!configured())throw new IllegalStateException("reference acquisition unavailable");
        for(String symbol:symbols)if(symbol==null||!symbol.matches("[A-Z0-9.]{1,6} {0,5}[0-9]{6}[CP][0-9]{8}"))throw new IllegalStateException("reference acquisition unavailable");
        long expires=System.nanoTime()+deadline.toNanos();String token=accessToken(expires);var failed=new TreeSet<String>();
        try(var executor=java.util.concurrent.Executors.newFixedThreadPool(4)){
            var futures=new LinkedHashMap<String,java.util.concurrent.Future<byte[]>>();
            for(String symbol:symbols)futures.put(symbol,executor.submit(()->{
                var request=HttpRequest.newBuilder(base.resolve("/instruments/equity-options/"+pathSegment(symbol))).timeout(deadline).header("Accept","application/json").header("Authorization","Bearer "+token).GET().build();
                var reply=receive(request,256*1024,expires);if(reply.statusCode()!=200||!reply.headers().firstValue("Content-Type").orElse("").matches("(?i)application/json(?:\\s*;.*)?"))throw new IllegalStateException("reference acquisition unavailable");
                var bytes=reply.body();var secrets=List.of(clientId,clientSecret,refreshToken,token);String content=new String(bytes,StandardCharsets.UTF_8);for(String secret:secrets)if(content.contains(secret))throw new IllegalStateException("reference acquisition unavailable");if(!safeDocument(TastytradeHoldings.document(bytes),secrets))throw new IllegalStateException("reference acquisition unavailable");return bytes;
            }));
            for(var entry:futures.entrySet())try{sink.accept(entry.getKey(),entry.getValue().get());}catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException("reference acquisition unavailable");}catch(Exception unavailable){failed.add(entry.getKey());}
        }return Set.copyOf(failed);
    }

    private static String pathSegment(String value){return URLEncoder.encode(value,StandardCharsets.UTF_8).replace("+","%20");}

    private static String encode(String value){return URLEncoder.encode(value,StandardCharsets.UTF_8);}

    /** Fresh OAuth access token via refresh-token exchange. No durable cache; the
     * token is scoped to a single acquisition and is passed to the secret-exclusion
     * screen so it can never survive into a retained artifact or diagnostic. */
    private String accessToken(long expires) throws Exception {
        String form="grant_type=refresh_token&client_id="+encode(clientId)+"&client_secret="+encode(clientSecret)+"&refresh_token="+encode(refreshToken);
        var oauth=HttpRequest.newBuilder(base.resolve("/oauth/token")).timeout(Duration.ofSeconds(10))
                .header("Content-Type","application/x-www-form-urlencoded").header("Accept","application/json")
                .POST(HttpRequest.BodyPublishers.ofString(form)).build();
        var tokenReply=receive(oauth,65536,expires);
        if(tokenReply.statusCode()!=200)throw new IllegalStateException();
        var tokenJson=TastytradeHoldings.document(tokenReply.body());
        var tokenField=tokenJson.get("access_token");
        if(tokenField==null||!tokenField.isTextual()||!tokenField.asText().matches("[A-Za-z0-9._~+/-]{1,16384}={0,2}"))throw new IllegalStateException();
        return tokenField.asText();
    }

    public byte[] holdings(String account) throws Exception {
        if(!configured()||!account.matches("[A-Za-z0-9]+"))throw new IllegalStateException("brokerage acquisition unavailable");
        long expires=System.nanoTime()+deadline.toNanos();
        try {
            String token=accessToken(expires);
            var request=HttpRequest.newBuilder(base.resolve("/accounts/"+account+"/positions")).timeout(Duration.ofSeconds(10))
                    .header("Accept","application/json").header("Authorization","Bearer "+token).GET().build();
            var reply=receive(request,BrokerageArtifacts.MAX_BYTES,expires);
            if(reply.statusCode()!=200||!reply.headers().firstValue("Content-Type").orElse("").matches("(?i)application/json(?:\\s*;.*)?"))throw new IllegalStateException();
            // Exact source bytes are retained only after a secret-exclusion check. OAuth responses never are.
            byte[] bytes=reply.body(); String content=new String(bytes,StandardCharsets.UTF_8);
            for(String secret:List.of(clientId,clientSecret,refreshToken,token))if(content.contains(secret))throw new IllegalStateException();
            if(!safeDocument(TastytradeHoldings.document(bytes),List.of(clientId,clientSecret,refreshToken,token)))throw new IllegalStateException();
            return bytes;
        }catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException("brokerage acquisition unavailable");}
        catch(Exception e){throw new IllegalStateException("brokerage acquisition unavailable");}
    }

    /** Requested Account settled cash only; margin and buying-power fields are retained but not modeled. */
    public byte[] settledCashBalance(String account) throws Exception {
        if(!configured()||!account.matches("[A-Za-z0-9]+"))throw new IllegalStateException("cash observation unavailable");
        long expires=System.nanoTime()+deadline.toNanos();
        try {
            String token=accessToken(expires);
            var request=HttpRequest.newBuilder(base.resolve("/accounts/"+account+"/balances?currency=USD")).timeout(Duration.ofSeconds(10))
                    .header("Accept","application/json").header("Authorization","Bearer "+token).GET().build();
            var reply=receive(request,BrokerageArtifacts.MAX_BYTES,expires);
            if(reply.statusCode()!=200||!reply.headers().firstValue("Content-Type").orElse("").matches("(?i)application/json(?:\\s*;.*)?"))throw new IllegalStateException();
            // Exact source bytes are retained only after a secret-exclusion check. OAuth responses never are.
            byte[] bytes=reply.body(); String content=new String(bytes,StandardCharsets.UTF_8);
            for(String secret:List.of(clientId,clientSecret,refreshToken,token))if(content.contains(secret))throw new IllegalStateException();
            if(!safeDocument(TastytradeHoldings.document(bytes),List.of(clientId,clientSecret,refreshToken,token)))throw new IllegalStateException();
            return bytes;
        }catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException("cash observation unavailable");}
        catch(Exception e){throw new IllegalStateException("cash observation unavailable");}
    }

    /** Read-only per-underlying volatility metrics (tastytrade {@code /market-metrics}).
     *
     * <p>INTERIM v1 market-data read. Deliberately SEPARATE from {@link #holdings} and
     * equally hardened: fresh single-use OAuth token, redirects disabled, one bounded
     * monotonic deadline covering OAuth + the metrics GET through complete body
     * consumption, bounded body, and the same secret-exclusion screen before any bytes
     * are returned. This widens the client to market data (the holdings path's narrow
     * "positions only" contract is left untouched).
     *
     * @param symbols underlying symbols; each must match {@code [A-Z][A-Z0-9.]*}. The
     *                caller is responsible for batching to a safe URL length.
     * @return raw response bytes (JSON), suitable for {@link MarketMetrics#parse}.
     */
    public byte[] marketMetrics(List<String> symbols) throws Exception {
        if(!configured())throw new IllegalStateException("market-metrics acquisition unavailable");
        if(symbols==null||symbols.isEmpty())throw new IllegalStateException("market-metrics acquisition unavailable");
        for(String s:symbols)if(s==null||!s.matches("[A-Z][A-Z0-9.]{0,9}"))throw new IllegalStateException("market-metrics acquisition unavailable");
        long expires=System.nanoTime()+deadline.toNanos();
        try {
            String token=accessToken(expires);
            String query=String.join(",",symbols.stream().map(TastytradeClient::encode).toList());
            var request=HttpRequest.newBuilder(base.resolve("/market-metrics?symbols="+query)).timeout(Duration.ofSeconds(10))
                    .header("Accept","application/json").header("Authorization","Bearer "+token).GET().build();
            var reply=receive(request,BrokerageArtifacts.MAX_BYTES,expires);
            if(reply.statusCode()!=200||!reply.headers().firstValue("Content-Type").orElse("").matches("(?i)application/json(?:\\s*;.*)?"))throw new IllegalStateException();
            byte[] bytes=reply.body(); String content=new String(bytes,StandardCharsets.UTF_8);
            for(String secret:List.of(clientId,clientSecret,refreshToken,token))if(content.contains(secret))throw new IllegalStateException();
            if(!safeDocument(TastytradeHoldings.document(bytes),List.of(clientId,clientSecret,refreshToken,token)))throw new IllegalStateException();
            return bytes;
        }catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException("market-metrics acquisition unavailable");}
        catch(Exception e){throw new IllegalStateException("market-metrics acquisition unavailable");}
    }
    private static boolean safeDocument(com.fasterxml.jackson.databind.JsonNode node,List<String> secrets) {
        if(node==null)return false;
        if(node.isTextual())for(String secret:secrets)if(node.textValue().contains(secret))return false;
        if(node.isObject()) {
            var fields=node.fields();while(fields.hasNext()) {
                var field=fields.next();
                String key=field.getKey().toLowerCase(Locale.ROOT).replace("-","_");
                if(key.contains("token")||key.contains("secret")||key.contains("password")||key.contains("authorization")||key.contains("credential"))return false;
                if(!safeDocument(field.getValue(),secrets))return false;
            }
        }else if(node.isArray())for(var child:node)if(!safeDocument(child,secrets))return false;
        return true;
    }
    /** Timed wait covers headers AND body. No worker wraps a blocking send; cancellation reaches
     * both the HTTP exchange and its body subscription, including a late onSubscribe race. */
    private HttpResponse<byte[]> receive(HttpRequest request,int max,long expires) throws Exception {
        long remaining=expires-System.nanoTime();
        if(remaining<=0)throw new TimeoutException();
        var body=new LimitedBody(max);
        var exchange=http.sendAsync(request,info->body);
        boolean complete=false;
        try {
            remaining=expires-System.nanoTime();
            if(remaining<=0)throw new TimeoutException();
            var response=exchange.get(remaining,TimeUnit.NANOSECONDS);
            complete=true;
            return response;
        }finally {
            if(!complete) {
                body.cancel();
                exchange.cancel(true);
            }
        }
    }
    private static final class LimitedBody implements HttpResponse.BodySubscriber<byte[]> {
        private final int max;
        private final CompletableFuture<byte[]> result=new CompletableFuture<>();
        private final java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream();
        private Flow.Subscription subscription;
        private boolean finished;
        LimitedBody(int max){this.max=max;}
        public CompletionStage<byte[]> getBody(){return result;}
        public synchronized void onSubscribe(Flow.Subscription s) {
            if(finished||subscription!=null){s.cancel();return;}
            subscription=s;s.request(Long.MAX_VALUE);
        }
        public synchronized void onNext(List<ByteBuffer> items) {
            if(finished)return;
            long incoming=0;for(var b:items)incoming+=b.remaining();
            if(incoming>max-bytes.size()){cancel();return;}
            for(var b:items){byte[] part=new byte[b.remaining()];b.get(part);bytes.writeBytes(part);}
        }
        public synchronized void onError(Throwable e){cancel();}
        public synchronized void onComplete() {
            if(finished)return;
            finished=true;result.complete(bytes.toByteArray());bytes.reset();
        }
        synchronized void cancel() {
            if(finished)return;
            finished=true;
            if(subscription!=null)subscription.cancel();
            bytes.reset();result.completeExceptionally(new IllegalStateException("brokerage acquisition unavailable"));
        }
    }
}
