package com.wheelwright.evidence.db;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.assertj.core.api.Assertions.*;
class HeldQuoteDetailStoreTest {
 @TempDir Path temp;
 static SqliteEvidenceStore.DirectQuoteRow row(int v){return new SqliteEvidenceStore.DirectQuoteRow("SPY",String.format("00000000-0000-4000-8000-%012d",v),v%2==0?"ETF":"EQUITY","{\"open\":"+v+"}","provider-"+v,v%2==0?"PRODUCTION":"SANDBOX","acquisition-"+v,"epoch-"+v,"phase-"+v,"session-"+v,"feed-"+v,"receipt-"+v,"commit-"+v);}
 @Test void fullRowIsolationUnderCommitRollbackAndReplacement() throws Exception {
  var store=new SqliteEvidenceStore(temp.resolve("detail.db").toString());var executor=Executors.newSingleThreadExecutor();
  try{
   store.setDirectQuote(row(1));var writer=store.getConnection();writer.setAutoCommit(false);store.setDirectQuote(row(2));assertThat(store.readHeldDirectQuote("SPY")).contains(row(1));writer.rollback();writer.setAutoCommit(true);assertThat(store.readHeldDirectQuote("SPY")).contains(row(1));
   writer.setAutoCommit(false);store.setDirectQuote(row(3));writer.commit();writer.setAutoCommit(true);assertThat(store.readHeldDirectQuote("SPY")).contains(row(3));assertThat(store.readHeldDirectQuote("ABSENT")).isEmpty();
   var done=new AtomicBoolean();var task=executor.submit(()->{try{for(int v=4;v<=200;v++)store.setDirectQuote(row(v));}catch(Exception e){throw new RuntimeException(e);}finally{done.set(true);}});
   int reads=0;do{var r=store.readHeldDirectQuote("SPY").orElseThrow();int v=Integer.parseInt(r.observationId().substring(24));assertThat(r).isEqualTo(row(v));reads++;}while(!done.get()||reads<30);
   task.get(10,TimeUnit.SECONDS);assertThat(store.readHeldDirectQuote("SPY")).contains(row(200));
   try(var s=writer.createStatement()){s.execute("DROP TABLE direct_quote");}assertThatThrownBy(()->store.readHeldDirectQuote("SPY")).isInstanceOf(java.sql.SQLException.class).isNotInstanceOf(SqliteEvidenceStore.HeldReadUnavailableException.class);
  }finally{executor.shutdownNow();store.close();}
  assertThatThrownBy(()->store.readHeldDirectQuote("SPY")).isInstanceOf(SqliteEvidenceStore.HeldReadUnavailableException.class);
 }
}
