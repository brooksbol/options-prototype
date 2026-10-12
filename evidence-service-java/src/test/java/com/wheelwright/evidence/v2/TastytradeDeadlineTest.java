package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;

class TastytradeDeadlineTest {
    @TempDir Path temp;
    enum Mode { GOOD, BEFORE_HEADERS, HOLDINGS_STALL, OAUTH_STALL, TRICKLE, OVERSIZED, SHARED_DEADLINE }
    static final Duration DEADLINE=Duration.ofMillis(800);
    /** Raw peer observes client EOF rather than inferring cancellation from a returned failure. */
    static class Provider implements AutoCloseable {
        final ServerSocket listener=new ServerSocket(0,50,InetAddress.getLoopbackAddress());
        final ExecutorService workers=Executors.newCachedThreadPool();
        final byte[] good;
        final CountDownLatch stalled=new CountDownLatch(1),cancelled=new CountDownLatch(1);
        final AtomicInteger activeStalls=new AtomicInteger(),holdingsRequests=new AtomicInteger();
        final AtomicReference<Throwable> failure=new AtomicReference<>();
        volatile Mode mode=Mode.GOOD;
        Provider()throws Exception {
            good=Files.readAllBytes(Path.of("src/test/resources/tastytrade/xle-api.json"));
            workers.submit(()->{while(!listener.isClosed())try{var socket=listener.accept();workers.submit(()->serve(socket));}catch(IOException e){if(!listener.isClosed())failure.set(e);}});
        }
        URI base(){return URI.create("http://localhost:"+listener.getLocalPort());}
        void serve(Socket socket) {
            try(socket) {
                socket.setSoTimeout(4000);var in=socket.getInputStream();var out=socket.getOutputStream();
                var header=new ByteArrayOutputStream();int ch;
                while((ch=in.read())!=-1){header.write(ch);if(header.toString(StandardCharsets.US_ASCII).endsWith("\r\n\r\n"))break;}
                String request=header.toString(StandardCharsets.US_ASCII);
                for(String line:request.split("\r\n"))if(line.toLowerCase().startsWith("content-length:"))in.readNBytes(Integer.parseInt(line.substring(15).trim()));
                boolean oauth=request.startsWith("POST /oauth/token ");if(!oauth)holdingsRequests.incrementAndGet();
                Mode current=mode;
                boolean stall=(oauth&&current==Mode.OAUTH_STALL)||(!oauth&&SetOfStalls(current));
                if(stall) {
                    activeStalls.incrementAndGet();
                    Thread trickle=null;
                    try {
                        if(current!=Mode.BEFORE_HEADERS) {
                            out.write("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 100000000\r\n\r\n{".getBytes(StandardCharsets.US_ASCII));out.flush();
                        }
                        if(current==Mode.TRICKLE){trickle=Thread.startVirtualThread(()->{try{while(true){Thread.sleep(30);out.write(' ');out.flush();}}catch(Exception ignored){}});}
                        stalled.countDown();
                        // Client must actually cancel/close the abandoned exchange. A server-side timeout is failure.
                        assertThat(in.read()).isEqualTo(-1);
                        cancelled.countDown();
                    }finally{if(trickle!=null){trickle.interrupt();trickle.join(1000);}activeStalls.decrementAndGet();}
                    return;
                }
                if(current==Mode.SHARED_DEADLINE)Thread.sleep(550);
                byte[] body=oauth?"{\"access_token\":\"fake-access-never-publish\"}".getBytes(StandardCharsets.UTF_8):good;
                if(!oauth&&current==Mode.OVERSIZED)body=new byte[BrokerageArtifacts.MAX_BYTES+1];
                out.write(("HTTP/1.1 200 OK\r\nConnection: close\r\nContent-Type: application/json\r\nContent-Length: "+body.length+"\r\n\r\n").getBytes(StandardCharsets.US_ASCII));out.write(body);out.flush();
            }catch(Throwable e){if(!(e instanceof SocketException))failure.compareAndSet(null,e);}
        }
        static boolean SetOfStalls(Mode m){return m==Mode.BEFORE_HEADERS||m==Mode.HOLDINGS_STALL||m==Mode.TRICKLE;}
        TastytradeClient client(HttpClient http){return new TastytradeClient("fake-client-id","fake-client-secret-never-publish","fake-refresh-never-publish",base(),http,DEADLINE);}
        void assertCancelled()throws Exception {
            assertThat(cancelled.await(2,TimeUnit.SECONDS)).as("peer EOF proves abandoned exchange stopped").isTrue();
            long until=System.nanoTime()+TimeUnit.SECONDS.toNanos(1);
            while(activeStalls.get()!=0&&System.nanoTime()<until)Thread.sleep(5);
            assertThat(activeStalls.get()).isZero();assertThat(failure.get()).isNull();
        }
        public void close()throws Exception{listener.close();workers.shutdownNow();assertThat(workers.awaitTermination(5,TimeUnit.SECONDS)).isTrue();}
    }
    @ParameterizedTest @EnumSource(value=Mode.class,names={"BEFORE_HEADERS","HOLDINGS_STALL","OAUTH_STALL","TRICKLE"})
    void deadlineCancelsPeerPreservesSnapshotAndPermitsRecovery(Mode mode)throws Exception {
        try(var provider=new Provider();var http=HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build();var store=new SqliteEvidenceStore(temp.resolve("deadline.db").toString())) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("tt1","TASTYTRADE","TTTEST01");var positions=new PositionReadService(store,new ObjectMapper());
            var service=new PositionAcquisition(store,accounts,positions,provider.client(http));
            var good=service.acquire(id,"good");assertThat(good.status()).isEqualTo("ACCEPTED");
            provider.mode=mode;long start=System.nanoTime();
            var failed=service.acquire(id,"timeout");
            assertThat(failed.status()).isEqualTo("FAILED");assertThat(failed.artifactId()).isNull();
            assertThat(Duration.ofNanos(System.nanoTime()-start)).isLessThan(Duration.ofSeconds(2));
            provider.assertCancelled();
            assertThat(positions.read(id,"read",Instant.now()).orElseThrow().snapshotId()).isEqualTo(good.snapshotId());
            provider.mode=Mode.GOOD;
            assertThat(service.acquire(id,"recovered").status()).isEqualTo("ACCEPTED");
        }
    }
    @Test void stalledAcquisitionReleasesMonitorForWaitingAcquisition()throws Exception {
        try(var provider=new Provider();var http=HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build();var store=new SqliteEvidenceStore(temp.resolve("concurrent.db").toString());var callers=Executors.newFixedThreadPool(2)) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("tt1","TASTYTRADE","TTTEST01");
            var service=new PositionAcquisition(store,accounts,new PositionReadService(store,new ObjectMapper()),provider.client(http));
            provider.mode=Mode.HOLDINGS_STALL;
            var first=callers.submit(()->service.acquire(id,"stalled"));
            assertThat(provider.stalled.await(2,TimeUnit.SECONDS)).isTrue();
            provider.mode=Mode.GOOD;
            var second=callers.submit(()->service.acquire(id,"waiting"));
            assertThat(first.get(2,TimeUnit.SECONDS).status()).isEqualTo("FAILED");
            assertThat(second.get(2,TimeUnit.SECONDS).status()).isEqualTo("ACCEPTED");provider.assertCancelled();
        }
    }
    @Test void oauthAndHoldingsShareOneDeadlineRatherThanEachReceivingFreshBudget()throws Exception {
        try(var provider=new Provider();var http=HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build()) {
            provider.mode=Mode.SHARED_DEADLINE;long start=System.nanoTime();
            assertThatThrownBy(()->provider.client(http).holdings("TTTEST01")).hasMessage("brokerage acquisition unavailable");
            assertThat(Duration.ofNanos(System.nanoTime()-start)).isLessThan(Duration.ofMillis(1050));
            assertThat(provider.holdingsRequests.get()).isEqualTo(1);
        }
    }
    @Test void sizeLimitStillFailsPromptly()throws Exception {
        try(var provider=new Provider();var http=HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build()) {
            provider.mode=Mode.OVERSIZED;
            assertThatThrownBy(()->provider.client(http).holdings("TTTEST01")).hasMessage("brokerage acquisition unavailable");
        }
    }
}
