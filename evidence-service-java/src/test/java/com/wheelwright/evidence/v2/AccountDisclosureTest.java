package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.Path;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

class AccountDisclosureTest {
    @TempDir Path temp;

    @Test void ordinaryMetadataOmitsNumbersWithoutChangingInternalBindingsOrGrants() throws Exception {
        try (var store = new SqliteEvidenceStore(temp.resolve("accounts.sqlite3").toString())) {
            var directory = new AccountDirectory(store, "");
            String first = directory.bind("alpha", "FIDELITY", "SYNTHETIC987654321");
            String second = directory.bind("beta", "TASTYTRADE", "SYNTHETIC123456789");
            var users = new UserDirectory(store, directory);
            var auth = new BearerAuthenticator(users,
                    "first=one:account.read:" + first + ",second=two:account.read:" + second + ",empty=empty,admin=admin:users.admin");
            var mapper = new ObjectMapper();
            var mvc = MockMvcBuilders.standaloneSetup(new AccountsController(directory, auth, mapper)).build();
            for (String token : List.of("first", "second")) {
                String allowed = token.equals("first") ? first : second;
                String denied = token.equals("first") ? second : first;
                for (String path : List.of("/v2/accounts", "/v2/accounts/" + allowed)) {
                    var response = mvc.perform(get(path).header("Authorization", "Bearer " + token)).andReturn().getResponse();
                    assertThat(response.getStatus()).isEqualTo(200);
                    assertThat(response.getContentAsString()).doesNotContain("accountNumber", "SYNTHETIC", denied);
                    var root = mapper.readTree(response.getContentAsString());
                    var account = path.equals("/v2/accounts") ? root.path("accounts").get(0) : root.path("account");
                    assertThat(account.path("id").asText()).isEqualTo(allowed);
                    assertThat(account.path("alias").asText()).isEqualTo(token.equals("first") ? "alpha" : "beta");
                    assertThat(account.path("brokerAssociation").size()).isEqualTo(1);
                    assertThat(account.path("brokerAssociation").path("broker").asText()).isEqualTo(token.equals("first") ? "FIDELITY" : "TASTYTRADE");
                    assertThat(response.getHeader("Cache-Control")).isEqualTo("private, no-store");
                    assertThat(response.getHeader("Location")).isNull();
                    var capture = mapper.createObjectNode().put("path", path).put("status", 200);
                    capture.set("body", root);
                    var headers = mapper.createObjectNode();
                    for (String header : List.of("Content-Type", "Cache-Control", "X-Request-Id"))
                        headers.put(header, response.getHeader(header));
                    capture.set("headers", headers);
                    var output = Path.of("build/account-disclosure-responses");
                    java.nio.file.Files.createDirectories(output);
                    java.nio.file.Files.writeString(output.resolve(token + (path.equals("/v2/accounts") ? "-list.json" : "-detail.json")), capture.toString());
                }
                var forbidden = mvc.perform(get("/v2/accounts/" + denied).header("Authorization", "Bearer " + token)).andReturn().getResponse();
                assertThat(forbidden.getStatus()).isEqualTo(403);
                assertThat(forbidden.getContentAsString()).doesNotContain("SYNTHETIC", "accountNumber", denied);
                assertThat(forbidden.getHeader("Location")).isNull();
                var invalid = mvc.perform(get("/v2/accounts?accountNumber=SYNTHETIC987654321").header("Authorization", "Bearer " + token)).andReturn().getResponse();
                assertThat(invalid.getStatus()).isEqualTo(422);
                assertThat(invalid.getContentAsString()).doesNotContain("SYNTHETIC987654321");
            }
            for (String token : List.of("empty", "admin")) {
                var response = mvc.perform(get("/v2/accounts").header("Authorization", "Bearer " + token)).andReturn().getResponse();
                assertThat(response.getStatus()).isEqualTo(200);
                assertThat(mapper.readTree(response.getContentAsString()).path("accounts")).isEmpty();
            }
            for (String path : List.of("/v2/accounts", "/v2/accounts/" + first)) {
                assertThat(mvc.perform(get(path)).andReturn().getResponse().getStatus()).isEqualTo(401);
                assertThat(mvc.perform(get(path).header("Authorization", "Bearer invalid")).andReturn().getResponse().getStatus()).isEqualTo(401);
            }
            assertThat(directory.get(first).orElseThrow().brokerAssociation().accountNumber()).isEqualTo("SYNTHETIC987654321");
        }
    }

    @Test void projectionCannotDiscloseShortMissingOrMalformedInternalNumbers() throws Exception {
        var mapper = new ObjectMapper();
        for (String number : Arrays.asList(null, "", "A", "1234", "12345", "bad\nreference", " 123456", "SYNTHETIC987654321")) {
            var internal = new AccountDirectory.Account("acct_" + "a".repeat(32), "alpha", "Alpha",
                    new AccountDirectory.BrokerAssociation("FIDELITY", number));
            var projected = mapper.readTree(mapper.writeValueAsString(AccountsController.AccountMetadata.from(internal)));
            assertThat(projected.path("brokerAssociation")).isEqualTo(mapper.readTree("{\"broker\":\"FIDELITY\"}"));
        }
    }
}
