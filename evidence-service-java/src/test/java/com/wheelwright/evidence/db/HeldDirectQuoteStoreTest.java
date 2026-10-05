package com.wheelwright.evidence.db;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.assertj.core.api.Assertions.*;

/** LQ14: real WAL file, independent reader, shared writer's uncommitted state excluded. */
class HeldDirectQuoteStoreTest {
    @TempDir Path temp;
    static SqliteEvidenceStore.DirectQuoteRow row(String symbol, int version) {
        return new SqliteEvidenceStore.DirectQuoteRow(symbol,
            String.format("00000000-0000-4000-8000-%012d",version), "ETF", "{}",
            "provider-"+version, "SANDBOX", "acquisition", "epoch", "CLOSED",null,null,
            "2000-01-01T00:00:00Z", "2000-01-01T00:00:01Z");
    }
    @Test void writerTransactionCommitAndRollbackCannotLeak() throws Exception {
        var store=new SqliteEvidenceStore(temp.resolve("quotes.db").toString());
        try {
            store.setDirectQuote(row("SPY",1));
            var conn=store.getConnection(); conn.setAutoCommit(false);
            store.setDirectQuote(row("SPY",2)); store.setDirectQuote(row("NEW",2));
            assertThat(store.listHeldDirectQuotes()).hasSize(1);
            assertThat(store.listHeldDirectQuotes().getFirst().provider()).isEqualTo("provider-1");
            conn.rollback(); conn.setAutoCommit(true);
            assertThat(store.listHeldDirectQuotes().getFirst().provider()).isEqualTo("provider-1");
            conn.setAutoCommit(false); store.setDirectQuote(row("SPY",3)); conn.commit(); conn.setAutoCommit(true);
            assertThat(store.listHeldDirectQuotes().getFirst().provider()).isEqualTo("provider-3");
        } finally {store.close();}
        assertThatThrownBy(store::listHeldDirectQuotes).isInstanceOf(SqliteEvidenceStore.HeldReadUnavailableException.class);
    }
    @Test void concurrentReplacementAndTransientSubjectsAreCompleteCommittedItems() throws Exception {
        var store=new SqliteEvidenceStore(temp.resolve("concurrent.db").toString());
        var executor=Executors.newSingleThreadExecutor();
        try {
            store.setDirectQuote(row("AAA",0)); store.setDirectQuote(row("SPY",0));
            var started=new CountDownLatch(1); var done=new AtomicBoolean();
            var writer=executor.submit(() -> {
                started.countDown();
                try {
                    for(int i=1;i<=150;i++) {
                        store.setDirectQuote(row("SPY",i)); store.setDirectQuote(row("TRANSIENT",i));
                        try(var s=store.getConnection().createStatement()){s.executeUpdate("DELETE FROM direct_quote WHERE symbol='TRANSIENT'");}
                    }
                } catch(Exception e){throw new RuntimeException(e);} finally{done.set(true);}
            });
            started.await(); int reads=0;
            do {
                var rows=store.listHeldDirectQuotes();
                assertThat(rows.stream().map(SqliteEvidenceStore.HeldDirectQuoteRow::symbol).toList()).contains("AAA","SPY").doesNotHaveDuplicates().isSorted();
                for(var row:rows) {
                    int version=Integer.parseInt(row.observationId().substring(24));
                    assertThat(row.provider()).isEqualTo("provider-"+version);
                    assertThat(row.environment()).isEqualTo("SANDBOX");
                    assertThat(row.receivedAt()).isEqualTo("2000-01-01T00:00:00Z");
                    assertThat(row.committedAt()).isEqualTo("2000-01-01T00:00:01Z");
                }
                reads++;
            } while(!done.get() || reads<20);
            writer.get(10,TimeUnit.SECONDS);
            assertThat(store.listHeldDirectQuotes().get(1).provider()).isEqualTo("provider-150");
        } finally {executor.shutdownNow();store.close();}
    }
    @Test void missingTableIsEnumerationFailureAndMemoryStoreIsPrivate() throws Exception {
        var first=new SqliteEvidenceStore(":memory:"); var second=new SqliteEvidenceStore(":memory:");
        try {
            first.setDirectQuote(row("SPY",1));
            assertThat(second.listHeldDirectQuotes()).isEmpty();
            try(var s=first.getConnection().createStatement()){s.execute("DROP TABLE direct_quote");}
            assertThatThrownBy(first::listHeldDirectQuotes).isInstanceOf(java.sql.SQLException.class)
                .isNotInstanceOf(SqliteEvidenceStore.HeldReadUnavailableException.class);
        } finally {first.close();second.close();}
    }
}
