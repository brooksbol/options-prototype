package com.wheelwright.evidence.v2;
import com.wheelwright.evidence.db.SqliteEvidenceStore.DirectQuoteRow;
final class HeldQuoteFixtures {
    static final String FACTS="""
        {"last":{"price":671.23,"size":9007199254740993,"sourceEventAt":"2001-01-01T00:00:00.123456789123Z"},
         "bid":{"price":671.20,"size":0,"venue":"","sourceEventAt":"2001-01-01T00:00:00Z"},
         "ask":{"price":671.25,"size":10,"venue":"Q","sourceEventAt":"2001-01-01T00:00:01Z"},
         "open":670,"high":672,"low":669,"close":670.61,"previousClose":670.61,
         "volume":9007199254740993,"reportedChange":0.62,"reportedChangePercent":0.62,"averageVolume":10,
         "fiftyTwoWeekHigh":700,"fiftyTwoWeekLow":400,"description":"source\\ttext","exchange":"Q"}
        """;
    static DirectQuoteRow row(String symbol,String facts){return new DirectQuoteRow(symbol,"22222222-2222-4222-8222-222222222222","ETF",facts,"tradier","SANDBOX","33333333-3333-4333-8333-333333333333","old-epoch","CLOSED","2001-01-01","regular","2001-01-01T00:00:02.123456789123Z","2001-01-01T00:00:03Z");}
}
