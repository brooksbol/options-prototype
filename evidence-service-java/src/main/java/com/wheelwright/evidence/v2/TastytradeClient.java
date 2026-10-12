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
    private static String encode(String value){return URLEncoder.encode(value,StandardCharsets.UTF_8);}
    public byte[] holdings(String account) throws Exception {
        if(!configured()||!account.matches("[A-Za-z0-9]+"))throw new IllegalStateException("brokerage acquisition unavailable");
        long expires=System.nanoTime()+deadline.toNanos();
        try {
            String form="grant_type=refresh_token&client_id="+encode(clientId)+"&client_secret="+encode(clientSecret)+"&refresh_token="+encode(refreshToken);
            var oauth=HttpRequest.newBuilder(base.resolve("/oauth/token")).timeout(Duration.ofSeconds(10))
                    .header("Content-Type","application/x-www-form-urlencoded").header("Accept","application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(form)).build();
            var tokenReply=receive(oauth,65536,expires);
            if(tokenReply.statusCode()!=200)throw new IllegalStateException();
            var tokenJson=TastytradeHoldings.document(tokenReply.body());
            var tokenField=tokenJson.get("access_token");
            if(tokenField==null||!tokenField.isTextual()||!tokenField.asText().matches("[A-Za-z0-9._~+/-]{1,16384}={0,2}"))throw new IllegalStateException();
            String token=tokenField.asText();
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
