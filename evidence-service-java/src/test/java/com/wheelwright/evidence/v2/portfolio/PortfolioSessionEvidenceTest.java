package com.wheelwright.evidence.v2.portfolio;

import org.junit.jupiter.api.Test;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static org.assertj.core.api.Assertions.*;

class PortfolioSessionEvidenceTest {
 @Test void acceptedWeekendHolidayAndResumptionCasesRetainTheQuotesOwnClock()throws Exception{
  var session=(com.fasterxml.jackson.databind.node.ObjectNode)JSON.readTree("{\"state\":\"Closed\",\"previous-session\":{\"open-at\":\"2026-10-09T13:30:00Z\",\"close-at\":\"2026-10-09T20:00:00Z\"},\"next-session\":{\"open-at\":\"2026-10-12T13:30:00Z\"}}");var rows=array();
  for(String now:List.of("2026-10-09T21:00:00Z","2026-10-10T14:00:00Z","2026-10-11T14:00:00Z","2026-10-12T12:00:00Z","2026-10-12T14:00:00Z")){
   var n=Instant.parse(now);String actual=PortfolioSessionEvidence.freshness(Instant.parse("2026-10-09T20:00:00Z"),n,session);String expected=now.equals("2026-10-09T21:00:00Z")?"CURRENT":now.equals("2026-10-12T14:00:00Z")?"STALE":"RETAINED_SESSION";assertThat(actual).isEqualTo(expected);rows.add(obj().put("at","2026-10-09T20:00:00Z").put("now",now).put("actual",actual).set("session",session));
  }
  var sunday=Instant.parse("2026-10-11T14:00:00Z");for(var context:List.of(session,session.deepCopy().put("state","Open"),obj())){
   String at=context.equals(session)?"2026-10-08T20:00:00Z":"2026-10-09T20:00:00Z";assertThat(PortfolioSessionEvidence.freshness(Instant.parse(at),sunday,context)).isEqualTo("STALE");rows.add(obj().put("at",at).put("now",sunday.toString()).put("actual","STALE").set("session",context));
  }
  var holiday=session.deepCopy();((com.fasterxml.jackson.databind.node.ObjectNode)holiday.path("previous-session")).put("open-at","2026-10-08T13:30:00Z").put("close-at","2026-10-08T17:00:00Z");assertThat(PortfolioSessionEvidence.freshness(Instant.parse("2026-10-08T17:00:00Z"),sunday,holiday)).isEqualTo("RETAINED_SESSION");rows.add(obj().put("at","2026-10-08T17:00:00Z").put("now",sunday.toString()).put("actual","RETAINED_SESSION").set("session",holiday));
  assertThat(PortfolioSessionEvidence.freshness(sunday.plusSeconds(61),sunday,session)).isEqualTo("UNKNOWN");assertThat(PortfolioSessionEvidence.freshness(null,sunday,session)).isEqualTo("UNKNOWN");
  var observation=obj().put("observedAt","2026-10-09T20:00:00Z").put("receivedAt","2026-10-11T13:59:00Z");observation.set("evidence",array());var mid=metric(new java.math.BigDecimal("1.25"),"PRICE","USD","2026-10-09T20:00:00Z","SOURCE_MID","QUALIFIED",array(),"CURRENT_MARKET");observation.set("mid",mid);var ref=source("00000000-0000-4000-8000-000000000001","00000000-0000-4000-8000-000000000002","/data",null,sunday.toString(),"TASTYTRADE");var qualified=PortfolioSessionEvidence.qualify(observation,sunday,Optional.of(new PortfolioSessionEvidence.Context(session,ref,sunday)));assertThat(qualified.path("freshness").asText()).isEqualTo("RETAINED_SESSION");assertThat(qualified.at("/mid/asOf")).isEqualTo(mid.path("asOf"));assertThat(qualified.at("/mid/evidence")).hasSize(1);assertThat(observation.path("evidence")).isEmpty();assertThat(PortfolioSessionEvidence.qualify(observation,sunday,Optional.of(new PortfolioSessionEvidence.Context(session,ref,sunday.minus(Duration.ofHours(13))))).path("freshness").asText()).isEqualTo("STALE");
  Files.createDirectories(Path.of("build/portfolio-session-parity"));Files.writeString(Path.of("build/portfolio-session-parity/results.json"),rows.toPrettyString());
 }
 @Test void sessionSourceRejectsForeignScopeAndMissingContext()throws Exception{
  assertThatThrownBy(()->PortfolioSessionEvidence.validate("{\"data\":{}}".getBytes())).isInstanceOf(IllegalArgumentException.class);
  assertThatThrownBy(()->PortfolioSessionEvidence.validate("{\"context\":\"/accounts/x\",\"data\":{\"state\":\"Closed\"}}".getBytes())).isInstanceOf(IllegalArgumentException.class);
  assertThatThrownBy(()->PortfolioSessionEvidence.validate("{\"data\":{\"state\":\"Closed\",\"account-number\":\"foreign\"}}".getBytes())).isInstanceOf(IllegalArgumentException.class);
 }
}
