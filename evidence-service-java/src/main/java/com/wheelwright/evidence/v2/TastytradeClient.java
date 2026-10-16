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

    public record DefinitionSubject(String holdingId,String symbol,String underlying) {}
    @FunctionalInterface public interface DefinitionSink { void accept(DefinitionSubject subject,String kind,byte[] bytes)throws Exception; }

    /** Explicit bounded metadata acquisition using the existing OAuth/security boundary.
     * No holdings/orders contact. Retention callback runs outside provider-error handling. */
    public Set<String> contractDefinitions(List<DefinitionSubject> subjects,DefinitionSink sink)throws Exception {
        if(!configured())throw new IllegalStateException("contract acquisition unavailable");
        long expires=System.nanoTime()+deadline.toNanos();String token=accessToken(expires);
        var options=new HashMap<String,byte[]>();var equities=new HashMap<String,byte[]>();var attempted=new LinkedHashSet<String>();long totalBytes=0;
        for(var subject:subjects) {
            if(System.nanoTime()>=expires)break;
            if(!subject.symbol().matches("[A-Z][A-Z0-9.]{0,9} +[0-9]{6}[CP][0-9]{8}")||!subject.underlying().matches("[A-Z][A-Z0-9.]{0,9}"))continue;
            attempted.add(subject.holdingId());
            byte[] option=options.get(subject.symbol());
            if(option==null){option=definition("/instruments/equity-options/"+encode(subject.symbol()).replace("+","%20"),token,expires);if(option!=null){totalBytes+=option.length;if(totalBytes>BrokerageArtifacts.MAX_BYTES)break;options.put(subject.symbol(),option);}}
            if(option==null)continue;sink.accept(subject,"OPTION",option);
            byte[] equity=equities.get(subject.underlying());
            if(equity==null){equity=definition("/instruments/equities/"+encode(subject.underlying()),token,expires);if(equity!=null){totalBytes+=equity.length;if(totalBytes>BrokerageArtifacts.MAX_BYTES)break;equities.put(subject.underlying(),equity);}}
            if(equity!=null)sink.accept(subject,"UNDERLYING",equity);
        }
        return Set.copyOf(attempted);
    }
    private byte[] definition(String path,String token,long expires) {
        try {
            var request=HttpRequest.newBuilder(base.resolve(path)).timeout(deadline).header("Accept","application/json")
                    .header("User-Agent","Wheelwright/option-contract-v1").header("Authorization","Bearer "+token).GET().build();
            var reply=receive(request,BrokerageArtifacts.MAX_BYTES,expires);
            if(reply.statusCode()!=200||!reply.headers().firstValue("Content-Type").orElse("").matches("(?i)application/json(?:\\s*;.*)?"))return null;
            byte[] bytes=reply.body();String content=new String(bytes,StandardCharsets.UTF_8);
            for(String secret:List.of(clientId,clientSecret,refreshToken,token))if(content.contains(secret))return null;
            if(!safeDocument(TastytradeHoldings.document(bytes),List.of(clientId,clientSecret,refreshToken,token)))return null;
            return bytes;
        }catch(InterruptedException e){Thread.currentThread().interrupt();return null;}
        catch(Exception e){return null;}
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
