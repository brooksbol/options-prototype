// Kiro independent-review scratch falsifiers for frozen a2ed63062edce5af65c1ea635ddfce97b520c475.
// Newly constructed by Kiro (not the earlier unsupplied Kiro probes). Synthetic inputs only:
// temporary SQLite, loopback HTTP, no credentials, broker read-through disabled, no live contact.
// Run from evidence-service-java/ with the existing test runtime classpath. Output is observation, not assertion.
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wheelwright.evidence.EvidenceServiceApplication;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.AccountDirectory;
import com.wheelwright.evidence.v2.BearerAuthenticator;
import com.wheelwright.evidence.v2.portfolio.PortfolioAuthorization;
import com.wheelwright.evidence.v2.portfolio.PortfolioJson;
import com.wheelwright.evidence.v2.portfolio.PortfolioMath;
import com.wheelwright.evidence.v2.portfolio.PortfolioOrderEvaluation;
import com.wheelwright.evidence.v2.portfolio.PortfolioRepository;
import com.wheelwright.evidence.v2.portfolio.PortfolioSources;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;

public class KiroProbe {
    static final HttpClient HTTP = HttpClient.newHttpClient();
    static String base;

    static void out(String probe, Object observed) { System.out.println("KIRO-PROBE " + probe + " :: " + observed); }

    static HttpResponse<String> send(String method, String path, String token, String body, String... headers) throws Exception {
        var b = HttpRequest.newBuilder(URI.create(base + path)).timeout(java.time.Duration.ofSeconds(60)).header("Authorization", "Bearer " + token);
        for (int i = 0; i < headers.length; i += 2) b.header(headers[i], headers[i + 1]);
        var publisher = body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body);
        return HTTP.send(b.method(method, publisher).build(), HttpResponse.BodyHandlers.ofString());
    }
    static JsonNode get(String path, String token) throws Exception {
        var r = send("GET", path, token, null);
        var n = r.body().isBlank() ? PortfolioJson.obj() : PortfolioJson.JSON.readTree(r.body());
        var wrapped = PortfolioJson.obj().put("httpStatus", r.statusCode());
        wrapped.set("body", n);
        return wrapped;
    }

    static final String HEADER = "Account number,Account name,Investment type,Symbol,Description,Quantity,Current value,Total gain/loss dollar,Type\n";
    static String csv(String body, String day) { return HEADER + body + "\n\"Date downloaded " + day + " at 3:48 p.m ET\"\n"; }
    static String body(int shares) {
        return "A1,Test PTS,ETFs,SPY,SPY shares," + shares + "," + (shares * 500) + ",20,Cash\n" +
               "A1,Test PTS,Options,-SPY261120C550,SPY call,-1,-100,--,Cash\n" +
               "A1,Test PTS,Options,-SPY261120C560,SPY call,1,50,4,Cash\n" +
               "A1,Test PTS,Cash,SPAXX**,Cash,,4000,,Cash\n";
    }
    static void upload(String account, String text, String name) throws Exception {
        var r = send("POST", "/v2/artifacts?accountId=" + account, "owner", text, "Content-Type", "text/csv",
                "Content-Disposition", "attachment; filename=" + name, "X-Brokerage-File-Type", "POSITIONS");
        var n = PortfolioJson.JSON.readTree(r.body());
        out("upload " + name, "http=" + r.statusCode() + " status=" + n.path("status").asText() + " detail=" + n.path("detail").asText(""));
    }

    static List<String> summarize(String label) throws Exception {
        var page = get("/v2/positions?projection=expanded&include=currentConstruction&limit=200", "owner");
        var ids = new ArrayList<String>();
        out(label + " positions http", page.path("httpStatus") + " count=" + page.at("/body/items").size());
        for (var p : page.at("/body/items")) {
            ids.add(p.at("/self/href").asText());
            var leaves = new ArrayList<String>();
            for (var leaf : PortfolioJson.leaves(p.at("/included/construction/composition")))
                leaves.add(leaf.path("kind").asText() + ":" + leaf.path("side").asText() + ":" + leaf.path("quantity").asText());
            var codes = new TreeSet<String>();
            for (var w : p.path("warnings")) codes.add(w.path("code").asText());
            out(label + " position", p.at("/self/href").asText() + " state=" + p.path("state").asText()
                    + " sourceIds=" + p.path("sourceIdentifiers") + " leaves=" + leaves
                    + " recognition=" + p.at("/included/construction/recognition/status").asText()
                    + " model=" + p.at("/included/construction/recognition/modelVersion/href").asText("null")
                    + " changeKind=" + p.at("/included/construction/changeKind").asText()
                    + " predecessorStatus=" + p.at("/included/construction/predecessorStatus").asText()
                    + " allocation=" + p.at("/allocation/status").asText()
                    + " gross=" + p.at("/evaluation/grossUnrealizedPl/status").asText()
                    + " openedAt=" + p.at("/evaluation/timeline/openedAt")
                    + " mgmt=" + p.at("/evaluation/management/associationStatus").asText()
                    + " warnings=" + codes);
        }
        return ids;
    }

    public static void main(String[] args) throws Exception {
        endToEnd();
        staticTransactionFeeProjection();
        staticOrderRedactionScan();
        System.out.println("KIRO-PROBE DONE");
        System.exit(0);
    }

    // ---------- E2E over the complete production Spring graph ----------
    static void endToEnd() throws Exception {
        Path temp = Files.createTempDirectory("kiro-review-probe");
        Path path = temp.resolve("probe.sqlite3");
        String account;
        try (var seed = new SqliteEvidenceStore(path.toString())) { account = new AccountDirectory(seed, "").bind("synthetic", "A1"); }
        String all = "account.read:" + account + "|account.positions.read:" + account + "|account.holdings.read:" + account
                + "|account.artifacts.read:" + account + "|account.artifacts.write:" + account + "|account.orders.read:" + account
                + "|account.positions.audit.read:" + account + "|account.transactions.read:" + account + "|account.market.read:" + account
                + "|reference.read|market.read|quote.read";
        String tokens = "owner=synthetic:" + all
                + ",auditonly=auditor:account.positions.audit.read:" + account
                + ",posonly=positions-reader:account.positions.read:" + account;
        var app = new SpringApplication(EvidenceServiceApplication.class);
        try (var context = (ServletWebServerApplicationContext) app.run("--spring.config.location=optional:file:" + temp.resolve("absent.properties"),
                "--server.address=127.0.0.1", "--server.port=0", "--evidence.db.path=" + path, "--universe.seed.path=", "--universe.disposition.path=",
                "--tradier.api-key=synthetic-loopback-only", "--tradier.base-url=http://127.0.0.1:9/v1", "--tradier.sandbox.api-key=", "--tradier.sandbox.base-url=",
                "--wheelwright.tastytrade.client-id=", "--wheelwright.tastytrade.client-secret=", "--wheelwright.tastytrade.refresh-token=",
                "--wheelwright.portfolio.orders.read-through-enabled=false", "--wheelwright.portfolio.market.read-through-enabled=false",
                "--wheelwright.history.read-through-enabled=false", "--wheelwright.v2.auth.tokens=" + tokens,
                "--spring.main.banner-mode=off", "--logging.level.root=ERROR")) {
            base = "http://127.0.0.1:" + context.getWebServer().getPort();

            // E1: same-expiration vertical + shares + cash from an actual production upload path.
            upload(account, csv(body(100), "Oct-05-2026"), "kiro-oct05.csv");
            var first = summarize("E1");
            out("E1 orders (owner)", get("/v2/orders?accountId=" + account, "owner").at("/body/items").size());

            // E2: audit with only account.positions.audit.read (no account.positions.read).
            String p0 = first.isEmpty() ? "/v2/positions/00000000-0000-0000-0000-000000000000" : first.get(0);
            var ownerAudit = get(p0 + "/audit", "owner");
            out("E2 owner audit", ownerAudit.path("httpStatus") + " items=" + ownerAudit.at("/body/items").size());
            var auditOnly = get(p0 + "/audit", "auditonly");
            out("E2 auditonly audit collection", auditOnly.path("httpStatus") + " items=" + auditOnly.at("/body/items").size()
                    + " first=" + auditOnly.at("/body/items/0"));
            String auditHref = ownerAudit.at("/body/items/0/self/href").asText("");
            if (!auditHref.isEmpty()) out("E2 auditonly audit detail", get(auditHref, "auditonly").path("httpStatus"));
            out("E2 auditonly position detail", get(p0, "auditonly").path("httpStatus"));
            out("E2 posonly audit collection", get(p0 + "/audit", "posonly").path("httpStatus"));

            // E3: Account reconciliation with positions.read only, versus holdings routes.
            var recon = get("/v2/accounts/" + account + "/inventory-reconciliation", "posonly");
            out("E3 posonly reconciliation http", recon.path("httpStatus") + " coverage=" + recon.at("/body/coverage").asText());
            for (var b : recon.at("/body/balances")) {
                var kinds = new TreeSet<String>();
                for (var e : b.at("/inventory/evidence")) kinds.add(e.path("kind").asText());
                out("E3 posonly balance", "unit=" + b.at("/inventory/unit").asText() + " side=" + b.at("/inventory/side").asText()
                        + " quantity=" + b.at("/inventory/quantity").asText() + " allocated=" + b.path("allocated").asText()
                        + " residual=" + b.path("residual").asText() + " holding=" + b.at("/inventory/holding/href").asText()
                        + " evidenceKinds=" + kinds);
            }
            out("E3 posonly holdings collection", get("/v2/holdings?accountId=" + account, "posonly").path("httpStatus"));
            String h0 = recon.at("/body/balances/0/inventory/holding/href").asText("");
            if (!h0.isEmpty()) out("E3 posonly holding detail", get(h0, "posonly").path("httpStatus"));

            // E4: repeated identical observation on a later day (qualified continuity).
            upload(account, csv(body(100), "Oct-06-2026"), "kiro-oct06.csv");
            var second = summarize("E4");
            out("E4 GUID set unchanged", new TreeSet<>(first).equals(new TreeSet<>(second)) + " before=" + first.size() + " after=" + second.size());
            out("E4 owner audit count p0", get(p0 + "/audit", "owner").at("/body/items").size());

            // E5: incompatible later quantity for the shares holding.
            upload(account, csv(body(200), "Oct-07-2026"), "kiro-oct07.csv");
            var third = summarize("E5");
            out("E5 positions before/after", second.size() + " -> " + third.size());
            var ownerRecon = get("/v2/accounts/" + account + "/inventory-reconciliation", "owner");
            for (var b : ownerRecon.at("/body/balances"))
                out("E5 owner balance", "unit=" + b.at("/inventory/unit").asText() + " q=" + b.at("/inventory/quantity").asText()
                        + " allocated=" + b.path("allocated").asText() + " status=" + b.path("status").asText());
            out("E5 owner reconciliation coverage", ownerRecon.at("/body/coverage").asText());

            // E6: an older-dated observation admitted afterwards must not roll current custody back.
            upload(account, csv(body(300), "Oct-04-2026"), "kiro-oct04.csv");
            var fourth = summarize("E6");
            out("E6 positions before/after", third.size() + " -> " + fourth.size());
            var latestRecon = get("/v2/accounts/" + account + "/inventory-reconciliation", "owner");
            for (var b : latestRecon.at("/body/balances"))
                out("E6 owner balance", "unit=" + b.at("/inventory/unit").asText() + " q=" + b.at("/inventory/quantity").asText() + " status=" + b.path("status").asText());

            // E7: Position state population reachable from actual sources.
            var states = new TreeMap<String, Integer>();
            for (var p : get("/v2/positions?limit=200", "owner").at("/body/items")) states.merge(p.path("state").asText(), 1, Integer::sum);
            out("E7 state histogram", states);
        }
    }

    // ---------- Static: transaction-derived fee survives an orders-only projection ----------
    static void staticTransactionFeeProjection() throws Exception {
        String acc = "acct_" + "a".repeat(32);
        var evOrder = PortfolioJson.source(acc, UUID.randomUUID().toString(), "/data/items/0", null, "2026-10-05T14:00:05Z", "TASTYTRADE");
        evOrder.put("requiredCapability", "account.orders.read:" + acc);
        var evTx = PortfolioJson.source(acc, UUID.randomUUID().toString(), "/data/items/3", "2026-10-05", "2026-10-06T00:00:00Z", "TASTYTRADE");
        evTx.put("requiredCapability", "account.transactions.read:" + acc).put("observedAt", "2026-10-05T14:00:00Z").put("observationPrecision", "INSTANT").put("timeAuthority", "SOURCE");
        evTx.set("authorityRecord", PortfolioJson.link("/v2/accounts/" + acc + "/transactions/" + UUID.randomUUID()));
        var evidence = PortfolioJson.array().add(evOrder).add(evTx);
        // Same shapes PortfolioFillEvidence.java:39-41 emits after a unique transaction match.
        var cash = PortfolioJson.metric(new BigDecimal("125"), "MONEY", "USD", "2026-10-05T14:00:00Z", "BROKER_TRANSACTION_VALUE_FOR_UNIQUE_EXACT_REPORTED_FILL", "QUALIFIED", evidence, "ORDER_EVIDENCE", "DOCUMENTED_HISTORY");
        cash.put("origin", "BROKER_REPORTED");
        var fees = PortfolioJson.metric(new BigDecimal("1.14"), "MONEY", "USD", "2026-10-05T14:00:00Z", "REPORTED_GROSS_LESS_FINAL_REPORTED_NET", "QUALIFIED", evidence, "ORDER_EVIDENCE", "DOCUMENTED_HISTORY");
        var fill = PortfolioJson.obj().put("quantity", "1").put("price", "1.25").put("executedAt", "2026-10-05T14:00:00Z").put("currency", "USD");
        fill.set("cashFlow", cash); fill.set("fees", fees); fill.set("evidence", PortfolioJson.array().add(evOrder.deepCopy()));
        var leg = PortfolioJson.obj().put("action", "SELL_TO_OPEN"); leg.set("fills", PortfolioJson.array().add(fill));
        String id = UUID.randomUUID().toString();
        var order = PortfolioJson.obj().put("id", id).put("status", "FILLED");
        order.set("self", PortfolioJson.link("/v2/orders/" + id)); order.set("account", PortfolioJson.link("/v2/accounts/" + acc));
        order.set("legs", PortfolioJson.array().add(leg)); order.set("associations", PortfolioJson.array()); order.set("warnings", PortfolioJson.array());
        order.set("evidence", PortfolioJson.array().add(evOrder.deepCopy()));
        var doc = new PortfolioRepository.Document(PortfolioRepository.Kind.ORDER, "/v2/orders/" + id, acc, order, null, null);
        for (var grants : List.of(Set.of("account.orders.read:" + acc), Set.of("account.orders.read:" + acc, "account.transactions.read:" + acc))) {
            var projected = PortfolioAuthorization.project(doc, new BearerAuthenticator.Principal("probe-user", grants));
            var kinds = new ArrayList<String>();
            for (var e : projected.at("/legs/0/fills/0/fees/evidence")) kinds.add(e.path("kind").asText() + "/" + e.path("requiredCapability").asText(""));
            out("T1 grants=" + new TreeSet<>(grants), "fees.status=" + projected.at("/legs/0/fills/0/fees/status").asText()
                    + " fees.value=" + projected.at("/legs/0/fills/0/fees/value") + " fees.evidence=" + kinds
                    + " cashFlow.value=" + projected.at("/legs/0/fills/0/cashFlow/value"));
        }
    }

    // ---------- Static: Order-derived opening facts versus a positions-only caller ----------
    static void staticOrderRedactionScan() throws Exception {
        var bundle = PortfolioJson.JSON.readTree(Files.readString(Path.of("../docs/reviews/api-v2-foundational-contract-2026-10-20/examples/resources.json")));
        var c = (ObjectNode) bundle.path("resources").path(bundle.at("/names/bwb").asText()).path("value").deepCopy();
        var now = Instant.parse("2026-10-20T18:00:00Z");
        String account = c.at("/account/href").asText().substring("/v2/accounts/".length());
        var p = PortfolioJson.obj().put("id", c.at("/position/href").asText().substring("/v2/positions/".length())).put("state", "UNRESOLVED");
        p.set("self", c.path("position")); p.set("account", c.path("account")); p.set("currentConstruction", c.path("self"));
        p.set("warnings", PortfolioJson.array()); p.putNull("orders"); p.set("audit", PortfolioJson.link(c.at("/position/href").asText() + "/audit"));
        var state = PortfolioJson.obj().put("status", "UNRESOLVED").putNull("establishedAt").put("completeness", "UNKNOWN"); state.set("evidence", PortfolioJson.array()); p.set("stateEvidence", state);
        var alloc = PortfolioJson.obj().put("status", "UNKNOWN"); alloc.set("affectedHoldingIds", PortfolioJson.array()); alloc.set("evidence", PortfolioJson.array()); p.set("allocation", alloc);
        p.set("evaluation", PortfolioMath.evaluate(c, Map.of(), now));
        var baseline = p.deepCopy();
        var opening = order(c, account, true); var working = order(c, account, false);
        PortfolioOrderEvaluation.apply(p, c, List.of(opening, working), now);
        out("T2 author view", "openedAt=" + p.at("/evaluation/timeline/openedAt") + " opening=" + p.at("/evaluation/openingCashFlow/value")
                + " payoff=" + p.at("/evaluation/payoff/geometry/valueKind").asText() + " boundaries=" + p.at("/evaluation/payoff/geometry/boundaries")
                + " profitTarget=" + p.at("/evaluation/management/profitTargetGrossPl/value") + " mgmtOrders=" + p.at("/evaluation/management/orders").size());
        for (var grants : List.of(Set.of("account.positions.read:" + account), Set.of("account.positions.read:" + account, "market.read", "reference.read"))) {
            var principal = new BearerAuthenticator.Principal("probe-user", grants);
            var projected = PortfolioAuthorization.project(new PortfolioRepository.Document(PortfolioRepository.Kind.POSITION, c.at("/position/href").asText(), account, p, null, null), principal);
            var control = PortfolioAuthorization.project(new PortfolioRepository.Document(PortfolioRepository.Kind.POSITION, c.at("/position/href").asText(), account, baseline, null, null), principal);
            String text = projected.toString(), controlText = control.toString();
            out("T2 grants=" + new TreeSet<>(grants), "fillDateLeak=" + (text.contains("2026-09-17") && !controlText.contains("2026-09-17"))
                    + " orderHrefLeak=" + (text.contains("/v2/orders/") && !controlText.contains("/v2/orders/"))
                    + " openedAt=" + projected.at("/evaluation/timeline/openedAt") + " originalDays=" + projected.at("/evaluation/timeline/originalDays/status").asText()
                    + " opening=" + projected.at("/evaluation/openingCashFlow/status").asText() + "/" + projected.at("/evaluation/openingCashFlow/asOf")
                    + " gross=" + projected.at("/evaluation/grossUnrealizedPl/status").asText() + " fees=" + projected.at("/evaluation/fees/status").asText()
                    + " payoff=" + projected.at("/evaluation/payoff/status").asText() + " range=" + projected.at("/evaluation/range")
                    + " mgmtAccess=" + projected.at("/evaluation/management/access").asText());
        }
        // Exact BWB coordinates from the same fixture without any Order input (basis comes from the fixture).
        var geometry = PortfolioMath.evaluate(c, Map.of(), now).at("/payoff/geometry");
        out("T3 BWB fixture geometry", "valueKind=" + geometry.path("valueKind").asText() + " boundaries=" + geometry.path("boundaries")
                + " lastSegment=" + geometry.path("segments").get(geometry.path("segments").size() - 1) + " firstSegment=" + geometry.path("segments").get(0)
                + " breakEvens=" + geometry.path("breakEvenPrices"));
    }

    // Mirrors PortfolioOrderEvaluationTest.order(...) shape, with distinctive 2026-09-17 fill clocks.
    static PortfolioRepository.Document order(ObjectNode c, String account, boolean opening) {
        String uri = "/v2/orders/" + UUID.randomUUID();
        var source = PortfolioJson.source(account, UUID.randomUUID().toString(), "/synthetic/verifiedActivity", null, "2026-10-20T17:00:00Z", "SYNTHETIC");
        source.put("requiredCapability", "account.orders.read:" + account);
        var evidence = PortfolioJson.array().add(source);
        var o = PortfolioJson.obj().put("status", opening ? "FILLED" : "WORKING").put("orderType", "LIMIT").put("priceEffect", "DEBIT");
        o.set("self", PortfolioJson.link(uri)); o.set("account", c.path("account")); o.set("evidence", evidence);
        var association = PortfolioJson.obj().put("status", "ESTABLISHED").put("targetKind", "CONSTRUCTION");
        association.set("target", c.path("self")); association.set("evidence", evidence);
        association.set("authority", PortfolioSources.authority(account, UUID.randomUUID().toString(), "RECONCILED_DOCUMENTED_ACTIVITY", "ESTABLISHED", evidence,
                List.of(uri, c.at("/self/href").asText()), "Kiro synthetic already-admitted predicate; not a broker assertion."));
        association.set("nodeIds", PortfolioJson.array()); o.set("associations", PortfolioJson.array().add(association));
        var legs = PortfolioJson.array(); int index = 0;
        for (var leaf : PortfolioJson.leaves(c.path("composition"))) {
            boolean buy = leaf.path("side").asText().equals("LONG");
            var leg = PortfolioJson.obj().put("action", opening ? (buy ? "BUY_TO_OPEN" : "SELL_TO_OPEN") : (buy ? "SELL_TO_CLOSE" : "BUY_TO_CLOSE"))
                    .put("requestedQuantity", leaf.path("quantity").asText()).put("fillsCoverage", "COMPLETE_REPORTED");
            leg.set("instrument", leaf.path("instrument"));
            var fills = PortfolioJson.array();
            if (opening) {
                String time = index++ == 0 ? "2026-09-17T13:31:07Z" : "2026-09-17T13:31:08Z";
                var price = PortfolioJson.number(leaf.at("/allocation/basis/value")).divide(PortfolioJson.number(leaf.path("quantity")).multiply(new BigDecimal("100")));
                var fill = PortfolioJson.obj().put("quantity", leaf.path("quantity").asText()).put("price", PortfolioJson.decimal(price)).put("multiplier", "100")
                        .put("priceUnit", "PER_UNDERLYING_UNIT").put("currency", "USD").put("executedAt", time);
                fill.set("evidence", evidence);
                fill.set("fees", PortfolioJson.metric(BigDecimal.ONE, "MONEY", "USD", time, "REPORTED_TEST_FEE", "QUALIFIED", evidence, "ORDER_EVIDENCE"));
                fills.add(fill);
            }
            leg.set("fills", fills);
            leg.set("filledQuantity", PortfolioJson.metric(opening ? PortfolioJson.number(leaf.path("quantity")) : BigDecimal.ZERO, "CONTRACT", null, "2026-10-20T17:00:00Z", "REPORTED", "QUALIFIED", evidence, "ORDER_EVIDENCE"));
            legs.add(leg);
        }
        o.set("legs", legs);
        var limit = new BigDecimal("0.5");
        if (opening) {
            var net = BigDecimal.ZERO;
            for (var leg : legs) for (var fill : leg.path("fills"))
                net = net.add(PortfolioJson.number(fill.path("price")).multiply(PortfolioJson.number(fill.path("quantity"))).multiply(leg.path("action").asText().startsWith("BUY") ? BigDecimal.ONE.negate() : BigDecimal.ONE));
            limit = net.abs(); o.put("priceEffect", net.signum() >= 0 ? "CREDIT" : "DEBIT");
        }
        o.set("limitPrice", PortfolioJson.metric(limit, "PRICE", "USD", "2026-10-20T17:00:00Z", "INSTRUCTION", "QUALIFIED", evidence, "ORDER_EVIDENCE"));
        o.set("stopTrigger", PortfolioJson.na("PRICE", null));
        o.set("priceConvention", PortfolioJson.obj().put("unit", "PER_UNDERLYING_UNIT").put("multiplier", "100").put("packageQuantity", "1"));
        return new PortfolioRepository.Document(PortfolioRepository.Kind.ORDER, uri, account, o, null, null);
    }
}
