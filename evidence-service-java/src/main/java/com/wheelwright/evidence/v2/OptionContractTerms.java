package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;

/** Contract identity is not deliverable proof. Standard terms require a retained instrument record. */
final class OptionContractTerms {
    record Identity(String root, String expiration, String right, BigDecimal strike) {}
    record Terms(Identity identity, String underlying, BigDecimal shares, java.time.Instant expiresAt, String sourceFile, String sha256, int sourceItem) {}
    private static final Pattern OCC=Pattern.compile("([A-Z][A-Z0-9.]{0,9}) +(\\d{6})([CP])(\\d{8})");
    private static final Pattern FIDELITY=Pattern.compile("-?([A-Z][A-Z0-9.]*?)(\\d{6})([CP])(\\d+(?:\\.\\d+)?)");
    static Identity identity(PositionSnapshot.Constituent h) {return identity(h.contract(), h.expiration());}
    static Identity identity(String contract,String expiration) {
        var occ=OCC.matcher(contract);var fidelity=FIDELITY.matcher(contract);
        boolean encoded=occ.matches();var match=encoded?occ:fidelity;
        if(!encoded&&!fidelity.matches())return null;
        try {
            String date="20"+match.group(2).substring(0,2)+"-"+match.group(2).substring(2,4)+"-"+match.group(2).substring(4,6);
            LocalDate.parse(date);if(!date.equals(expiration))return null;
            BigDecimal strike=new BigDecimal(match.group(4));if(encoded)strike=strike.movePointLeft(3);
            if(strike.signum()<=0)return null;
            return new Identity(match.group(1),date,match.group(3),strike.stripTrailingZeros());
        }catch(RuntimeException e){return null;}
    }
    static Map<Identity,Terms> read(PositionSnapshot.InstrumentEvidence source) {
        if(source==null)return Map.of();
        var result=new HashMap<Identity,Terms>();var duplicates=new HashSet<Identity>();
        try {
            if(source.payload()==null||source.payload().length()>16*1024*1024||source.sourceFile()==null||source.sourceFile().isBlank()||
                    !FidelityPositions.digest(source.payload()).equals(source.sha256()))return Map.of();
            var mapper=new ObjectMapper().enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
                    .enable(com.fasterxml.jackson.core.StreamReadFeature.STRICT_DUPLICATE_DETECTION.mappedFeature());
            var root=mapper.readTree(source.payload());var items=root.isArray()?root:root.path("data").path("items");
            if(!items.isArray())return Map.of();int index=0;
            for(var item:items) {
                index++;
                var id=identity(item.path("symbol").asText(),item.path("expiration-date").asText());
                if(id==null)continue;
                // Duplicate/conflicting source records never quietly pick a winner.
                if(result.containsKey(id)||duplicates.contains(id)){duplicates.add(id);result.remove(id);continue;}
                if(!item.path("instrument-type").asText().equals("Equity Option")||
                        !item.path("option-chain-type").asText().equals("Standard")||
                        !item.path("underlying-symbol").asText().equals(id.root())||
                        !item.path("option-type").asText().equals(id.right())||
                        new BigDecimal(item.path("strike-price").asText()).compareTo(id.strike())!=0||
                        new BigDecimal(item.path("shares-per-contract").asText()).compareTo(new BigDecimal("100"))!=0) {
                    duplicates.add(id);continue;
                }
                java.time.Instant expiresAt=null;
                if(item.hasNonNull("expires-at")) {
                    var expiry=java.time.OffsetDateTime.parse(item.path("expires-at").asText());
                    if(!expiry.toLocalDate().toString().equals(id.expiration())){duplicates.add(id);continue;}
                    expiresAt=expiry.toInstant();
                }
                result.put(id,new Terms(id,id.root(),new BigDecimal("100"),expiresAt,source.sourceFile(),source.sha256(),index));
            }
            return Map.copyOf(result);
        }catch(Exception e){return Map.of();}
    }
}
