package com.wheelwright.evidence.v2.portfolio;
import org.junit.jupiter.api.Test;import java.time.Instant;
import static org.assertj.core.api.Assertions.*;import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
class PortfolioPayoffPlotTest {
 @Test void samplesPreserveSlopingTailAndExactAuthoritativeAffineValueWithoutBasisOrRiskInference(){
  var e=obj();e.set("spot",unknown("PRICE",Instant.EPOCH.toString(),"MARKET_OBSERVATION_MISSING"));var p=obj().put("status","QUALIFIED");var g=obj().put("valueKind","TERMINAL_VALUE").put("priceCurrency","USD");g.set("boundaries",array().add(obj().put("price","100").put("value","10000")));g.set("segments",array().add(obj().put("lower","0").put("upper","100").put("slope","100").put("intercept","0")).add(obj().put("lower","100").putNull("upper").put("slope","0").put("intercept","10000")));p.set("geometry",g);e.set("payoff",p);PortfolioPayoffPlot.apply(e);assertThat(g.path("displayPoints")).hasSize(3);assertThat(g.at("/displayPoints/0/price").asText()).isEqualTo("85");assertThat(g.at("/displayPoints/0/value").asText()).isEqualTo("8500");assertThat(g.at("/displayPoints/2/value").asText()).isEqualTo("10000");assertThat(g.path("valueKind").asText()).isEqualTo("TERMINAL_VALUE");
 }
 @Test void noSamplesAreManufacturedForUnsupportedOrEmptyGeometry(){var e=obj();e.set("payoff",obj().put("status","UNSUPPORTED").putNull("geometry"));PortfolioPayoffPlot.apply(e);assertThat(e.at("/payoff/geometry").isNull()).isTrue();}
}
