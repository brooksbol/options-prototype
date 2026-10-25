package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.v2.portfolio.*;
import java.net.*;
import java.net.http.*;
import java.time.Instant;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Local read-only real-evidence audit. Outputs coverage/status aggregates ONLY.
 * No bootstrap, ingestion, synchronization, provider, raw record or financial value output. */
public final class RetainedCoverageAudit {
    static final HttpClient HTTP=HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build();
    static com.fasterxml.jackson.databind.JsonNode get(String base,String path) throws Exception {
        var response=HTTP.send(HttpRequest.newBuilder(URI.create(base+path))
            .header("Authorization","Bearer "+System.getenv("WW_API_TOKEN")).GET().build(),HttpResponse.BodyHandlers.ofString());
        if(response.statusCode()!=200)throw new IllegalStateException("authorized-read-unavailable");
        return JSON.readTree(response.body());
    }
    public static void main(String[] args) {
        try {
            var result=obj();
            var quotes=get("http://127.0.0.1:3100","/v2/quotes");int read=0,qualified=0,unavailable=0;
            for(var item:quotes.path("items")) {
                var source=get("http://127.0.0.1:3100","/v2/quotes/"+PathSymbolCodec.encode(item.at("/subject/symbol").asText()));
                var assessed=QuoteLiquidityMeasurements.assess(source,"local-audit");read++;
                if(assessed.at("/measurements/observedSideDifference/status").asText().equals("QUALIFIED"))qualified++;else unavailable++;
            }
            result.put("realHeldQuotesRead",read).put("backendSideMeasurementsQualified",qualified).put("backendSideMeasurementsUnavailable",unavailable);
            // Existing API authentication establishes the User; permissions are read from its existing store.
            var me=get("http://127.0.0.1:55834","/v2/me");String id=me.at("/user/id").asText(me.path("id").asText());
            String url="jdbc:sqlite:file:"+args[0]+"?mode=ro";
            var grants=new UserDirectory(url).grants(id).orElseThrow();
            var principal=new BearerAuthenticator.Principal(id,grants);
            var scope=new TreeSet<String>();for(String grant:grants)if(grant.startsWith("account.positions.read:"))scope.add(grant.substring("account.positions.read:".length()));
            var repo=new PortfolioRepository(url,JSON);
            var service=new PortfolioReadService(repo,new PortfolioSources(repo,JSON,new AccountDirectory(url)));
            int positions=0,evaluated=0,failures=0;var statuses=new TreeMap<String,Map<String,Integer>>();
            for(var document:repo.list(Kind.POSITION,scope)) {
                positions++;
                try {
                    var view=service.read(document,principal,Instant.now());evaluated++;
                    var fields=view.path("evaluation").fields();
                    while(fields.hasNext()) {var entry=fields.next();String status=entry.getValue().path("status").asText();
                        if(Set.of("KNOWN","QUALIFIED","INCOMPLETE","UNAVAILABLE","CONFLICT","REDACTED","SUPPORTED","UNSUPPORTED").contains(status))
                            statuses.computeIfAbsent(entry.getKey(),k->new TreeMap<>()).merge(status,1,Integer::sum);
                    }
                } catch(Exception failure) {failures++;}
            }
            result.put("authorizedPositionResources",positions).put("retainedBackendEvaluations",evaluated).put("evaluationFailures",failures);
            result.set("financialStatusCoverage",JSON.valueToTree(statuses));
            result.put("protectedValuesExported",false).put("providerAcquisitionCalled",false).put("grantBootstrapCalled",false);
            System.out.println(JSON.writeValueAsString(result));
        } catch(Exception failure) {
            System.out.println("{\"auditIncomplete\":true,\"errorClass\":\""+failure.getClass().getSimpleName()+"\",\"protectedValuesExported\":false}");
            System.exit(1);
        }
    }
}
