package com.wheelwright.evidence.v2;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.JSON;

/** Inherits authentication, quote.read, codec, strict decoding and safe problems. No provider dependency. */
@RestController
public final class QuoteLiquidityController {
    private final HeldQuotesController held;
    public QuoteLiquidityController(HeldQuotesController held) { this.held=held; }
    @GetMapping("/v2/quotes/{symbol}/liquidity")
    public ResponseEntity<String> read(@PathVariable("symbol") String symbol,
            @RequestBody(required=false) byte[] body,HttpServletRequest request) throws Exception {
        var response=held.show(symbol,body,request);
        if(response.getStatusCode().value()!=200)return response;
        try {
            var result=QuoteLiquidityMeasurements.assess(JSON.readTree(response.getBody()),response.getHeaders().getFirst("X-Request-Id"));
            return ResponseEntity.status(200).headers(response.getHeaders()).body(JSON.writeValueAsString(result));
        } catch (Exception failure) {
            return ResponseEntity.status(500).header("X-Request-Id",response.getHeaders().getFirst("X-Request-Id"))
                .header("Cache-Control","private, no-store").contentType(org.springframework.http.MediaType.APPLICATION_PROBLEM_JSON)
                .body(JSON.writeValueAsString(ProblemDetails.of(ProblemCode.INTERNAL_ERROR,response.getHeaders().getFirst("X-Request-Id"),"held quote measurement unavailable")));
        }
    }
}
