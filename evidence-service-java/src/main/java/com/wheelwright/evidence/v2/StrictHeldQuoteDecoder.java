package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wheelwright.evidence.db.SqliteEvidenceStore.DirectQuoteRow;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

/** Strict persisted representation boundary. No acquisition mapper, defaults or repairs. */
public final class StrictHeldQuoteDecoder {
    private static final ObjectMapper JSON = new ObjectMapper()
        .enable(JsonParser.Feature.STRICT_DUPLICATE_DETECTION)
        .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
        .enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS)
        .enable(DeserializationFeature.USE_BIG_INTEGER_FOR_INTS)
        .configure(com.fasterxml.jackson.databind.cfg.JsonNodeFeature.STRIP_TRAILING_BIGDECIMAL_ZEROES, false);
    private static final Set<String> TYPES = Set.of("EQUITY", "ETF", "INDEX", "OTHER_UNDERLYING");
    private static final Set<String> PHASES = Set.of("REGULAR_USABLE", "PRE_MARKET", "POST_MARKET", "CLOSED", "UNKNOWN");
    private StrictHeldQuoteDecoder() {}
    public static ObjectNode decode(DirectQuoteRow row, String expected) throws Exception {
        if (row == null || !expected.equals(row.symbol()) || !PathSymbolCodec.decode(PathSymbolCodec.encode(row.symbol())).equals(expected)) fail();
        uuid(row.observationId()); uuid(row.acquisitionId());
        nonempty(row.provider()); nonempty(row.authorityEpoch());
        if (!TYPES.contains(row.securityType()) || !Set.of("PRODUCTION", "SANDBOX").contains(row.environment()) || !PHASES.contains(row.acquisitionPhase())) fail();
        time(row.receivedAt()); time(row.committedAt());
        if (row.regularSessionDate() != null) date(row.regularSessionDate());
        JsonNode facts = JSON.readTree(row.factsJson());
        validateFacts(facts);
        ObjectNode observation = JSON.createObjectNode();
        observation.put("observationId", row.observationId());
        observation.putObject("subject").put("symbol", row.symbol()).put("securityType", row.securityType());
        observation.set("facts", facts);
        ObjectNode p = observation.putObject("provenance");
        p.put("provider",row.provider()).put("environment",row.environment())
            .put("acquisitionId",row.acquisitionId()).put("authorityEpoch",row.authorityEpoch())
            .put("acquisitionPhase",row.acquisitionPhase()).put("receivedAt",row.receivedAt()).put("committedAt",row.committedAt());
        if (row.regularSessionDate()!=null) p.put("regularSessionDate",row.regularSessionDate());
        if (row.feedIdentity()!=null) p.put("feedIdentity",row.feedIdentity());
        return observation;
    }
    static void validateFacts(JsonNode f) {
        if (f==null || !f.isObject()) fail();
        boolean bearing=false;
        for(String name:new String[]{"last","bid","ask"}) if(f.has(name)) {
            JsonNode side=f.get(name);
            if (!side.isObject() || !side.has("price")) fail();
            bearing |= number(side.get("price"),true,false).signum()>0;
            if(side.has("size")) number(side.get("size"),true,true);
            if(!name.equals("last") && side.has("venue")) text(side.get("venue"));
            if(side.has("sourceEventAt")) time(text(side.get("sourceEventAt")));
        }
        for(String name:new String[]{"open","high","low","close","previousClose","fiftyTwoWeekHigh","fiftyTwoWeekLow"}) if(f.has(name)) {
            BigDecimal price=number(f.get(name),true,false);
            if(Set.of("open","high","low","close").contains(name)) bearing |= price.signum()>0;
        }
        for(String name:new String[]{"volume","averageVolume"}) if(f.has(name)) number(f.get(name),true,true);
        for(String name:new String[]{"reportedChange","reportedChangePercent"}) if(f.has(name)) number(f.get(name),false,false);
        for(String name:new String[]{"description","exchange"}) if(f.has(name)) text(f.get(name));
        if(!bearing) fail();
    }
    private static BigDecimal number(JsonNode n,boolean nonnegative,boolean integer) {
        if(n==null || !n.isNumber()) fail();
        BigDecimal value=n.decimalValue();
        if(nonnegative && value.signum()<0) fail();
        if(integer) try {value.toBigIntegerExact();} catch(ArithmeticException e){fail();}
        return value;
    }
    private static String text(JsonNode n) { if(n==null || !n.isTextual()) fail(); return n.textValue(); }
    private static void nonempty(String s) {if(s==null || s.isEmpty()) fail();}
    private static void uuid(String s) {if(!HeldQuoteDiscoveryItem.validUuid(s)) fail();}
    private static void date(String s) {if(s==null || !s.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}")) fail(); LocalDate.parse(s);}
    private static void time(String s) {
        if(s==null || !s.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}[Tt][0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]+)?Z")) fail();
        // Validate calendar/time while retaining the entire original fractional representation.
        LocalDateTime.parse(s.substring(0,19).replace('t','T'));
    }
    private static void fail() {throw new IllegalArgumentException("invalid canonical quote representation");}
}
