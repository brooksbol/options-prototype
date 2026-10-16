package com.wheelwright.evidence.v2;

import java.math.*;
import java.util.*;

/** Presentation-independent, exact, independently qualified v2 conclusions. */
final class StructuralModel {
    private StructuralModel() {}
    record Fact<T>(String status,T value,List<String> evidenceIds,List<String> reasons) {
        static <T> Fact<T> known(T value,List<String> refs){return new Fact<>("ESTABLISHED",value,List.copyOf(refs),List.of());}
        static <T> Fact<T> unknown(String reason){return new Fact<>("UNKNOWN",null,List.of(),List.of(reason));}
        static <T> Fact<T> unavailable(String status,String reason,List<String> refs){return new Fact<>(status,null,List.copyOf(refs),List.of(reason));}
    }
    record Rational(String numerator,String denominator) {
        static Rational of(BigDecimal d) {
            BigInteger n=d.unscaledValue(),den=BigInteger.ONE;
            if(d.scale()>=0)den=BigInteger.TEN.pow(d.scale());else n=n.multiply(BigInteger.TEN.pow(-d.scale()));
            BigInteger gcd=n.gcd(den);return new Rational(n.divide(gcd).toString(),den.divide(gcd).toString());
        }
    }
    record Underlying(String symbol,String priceCurrency) {}
    record Expiration(String date,String expiresAt) {}
    record Terms(String contractKey,String underlyingSymbol,String expiration,String right,String quotedStrike,
            String priceMultiplier,String deliverableShares,String deliverableCash,String exerciseAmount,String currency,String adjustment,String settlement) {}
    record Constituent(String holdingId,String observedContract,String custody,String signedQuantity,String observedHoldingQuantity,List<String> quantityReasons,List<String> allocationEvidenceIds,Fact<Terms> terms) {}
    record Membership(String status,String basis,List<String> evidenceIds,List<String> reasons) {}
    record Strategy(String kind,int optionLegCount,int complexityRank) {}
    record Knot(Rational underlyingPrice,Rational terminalValue) {}
    record Payoff(String basis,String quantityBasis,String currency,String domainMinimum,List<Knot> knots,Rational rightTailSlope,boolean includesAssociatedShares) {}
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    record Range(String kind,String lower,String upper,String boundary,String direction) {
        Range(String kind,String lower,String upper){this(kind,lower,upper,null,null);}
        static Range halfLine(String boundary,String direction){return new Range("SHORT_STRIKE_HALF_LINE",null,null,boundary,direction);}
    }
    record Evidence(String evidenceId,String kind,String recordId,String artifactId,String sha256,List<Integer> sourceRows,
            String sourceEffectiveAt,String sourceDate,String recordedAt,String acquisitionStartedAt,String acquisitionReceivedAt) {}
    record Position(String subjectId,List<String> inventoryPositionIds,String associationId,Fact<Void> identity,Membership membership,
            List<Constituent> constituents,Fact<Underlying> underlying,Fact<Expiration> expiration,Long remainingDte,Fact<Void> openingFillAt,
            Fact<String> units,Fact<Strategy> strategy,Fact<Payoff> payoff,Fact<Range> range,Fact<List<Object>> collateral,List<String> qualifications) {}
    record Snapshot(String snapshotId,String evidenceDate,String recordedAt,PositionSnapshot.Observation observation,PositionSnapshot.ObservationContext observationContext) {}
    record Account(String accountId,String availability,Snapshot snapshot,String evidenceSetId,String evidenceQualification,List<Position> structures,
            List<Evidence> evidence,List<String> excludedExpiredHoldingIds,List<String> refreshReasons,List<String> qualifications) {}
    record CollectionRead(String requestId,String view,String evaluatedAt,String evaluationBasis,String interpretationVersion,List<Account> accounts) {}
}
