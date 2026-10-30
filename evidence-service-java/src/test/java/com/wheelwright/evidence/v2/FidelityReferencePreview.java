package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.v2.portfolio.*;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import java.time.Clock;

/** Explicit approved public-reference-only provider profile on the protected retained copy. */
@TestConfiguration
@Import(TalkRetainedPreview.Preview.class)
class FidelityReferencePreview {
 @Bean TastytradeClient publicReferenceClient(@Value("${TASTYTRADE_CLIENT_ID:}")String id,@Value("${TASTYTRADE_CLIENT_SECRET:}")String secret,@Value("${TASTYTRADE_REFRESH_TOKEN:}")String refresh){return new TastytradeClient(id,secret,refresh);}
 @Bean PortfolioFidelityReferences publicReferences(PortfolioRepository repository,AccountDirectory accounts,TastytradeClient publicReferenceClient){return new PortfolioFidelityReferences(repository,accounts,publicReferenceClient,true,Clock.systemUTC());}
}
