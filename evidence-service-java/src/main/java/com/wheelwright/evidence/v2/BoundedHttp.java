package com.wheelwright.evidence.v2;
import java.net.http.*;import java.util.*;import java.util.concurrent.*;import java.nio.ByteBuffer;
/** Existing complete-body byte/deadline transport shared by source and backend composition. */
public final class BoundedHttp {
 private BoundedHttp(){}
    /** Timed wait covers headers AND body. No worker wraps a blocking send; cancellation reaches
     * both the HTTP exchange and its body subscription, including a late onSubscribe race. */
    public static HttpResponse<byte[]> receive(HttpClient http,HttpRequest request,int max,long expires) throws Exception {
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
