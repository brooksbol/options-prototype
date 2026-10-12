package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.Component;
import java.sql.*;
import java.util.*;

/** Backend-generated identity; alias metadata never participates in authorization. */
@Component
public class AccountDirectory {
    public record BrokerAssociation(String broker, String accountNumber) {}
    public record Account(String id, String alias, String displayName, BrokerAssociation brokerAssociation) {}
    private final String url;
    public static boolean validId(String id) { return id != null && id.matches("acct_[a-f0-9]{32}"); }
    @Autowired
    public AccountDirectory(SqliteEvidenceStore store, @Value("${wheelwright.v2.accounts:}") String accounts) throws Exception {
        this(store.getConnection().getMetaData().getURL());
        for (String spec : accounts.split(",")) if (!spec.isBlank()) {
            var parts = spec.trim().split("=", -1);
            if (parts.length != 2) throw new IllegalArgumentException("invalid backend account configuration");
            var association = parts[1].split(":", -1);
            if (association.length == 1) bind(parts[0], association[0]);
            else if (association.length == 2) bind(parts[0], association[0], association[1]);
            else throw new IllegalArgumentException("invalid backend account configuration");
        }
    }
    public AccountDirectory(String url) { this.url = url; }
    public String bind(String alias, String brokerAccount) throws SQLException {
        return bind(alias, "FIDELITY", brokerAccount);
    }
    public String bind(String alias, String broker, String brokerAccount) throws SQLException {
        validAlias(alias);
        if (!Set.of("FIDELITY", "TASTYTRADE").contains(broker == null ? "" : broker) || brokerAccount == null ||
                !brokerAccount.matches(broker.equals("FIDELITY") ? "[A-Z0-9]+" : "[A-Za-z0-9]+"))
            throw new IllegalArgumentException("invalid broker identity");
        try (var c = DriverManager.getConnection(url)) {
            try (var q = c.prepareStatement("SELECT account_id, broker, broker_account FROM brokerage_account WHERE alias=?")) {
                q.setString(1,alias);
                try(var rs=q.executeQuery()){if(rs.next()) {
                    if(!broker.equals(rs.getString("broker")) || !brokerAccount.equals(rs.getString("broker_account")))throw new IllegalArgumentException("conflicting account binding");
                    return rs.getString("account_id");
                }}
            }
            // Startup registration cannot overwrite a backend alias rename. A stale
            // bootstrap alias for the same broker association still finds the same ID.
            try(var q=c.prepareStatement("SELECT account_id FROM brokerage_account WHERE broker=? AND broker_account=?")) {
                q.setString(1,broker);q.setString(2,brokerAccount);try(var rs=q.executeQuery()){if(rs.next())return rs.getString(1);}
            }
            String id = "acct_" + UUID.randomUUID().toString().replace("-", "");
            try (var q = c.prepareStatement("INSERT INTO brokerage_account (account_id,alias,display_name,broker_account,identity_namespace,broker) VALUES (?, ?, ?, ?, ?, ?)")) {
                q.setString(1,id); q.setString(2,alias); q.setString(3,alias); q.setString(4,brokerAccount); q.setString(5,id);
                q.setString(6,broker);
                q.executeUpdate();
            }
            return id;
        }
    }
    /** Administrative backend operation only; this slice exposes no Account write REST API. */
    public void rename(String id, String alias, String displayName) throws SQLException {
        if (!validId(id) || displayName == null || displayName.isBlank()) throw new IllegalArgumentException("invalid account metadata");
        validAlias(alias);
        try (var c=DriverManager.getConnection(url); var q=c.prepareStatement("UPDATE brokerage_account SET alias=?, display_name=? WHERE account_id=?")) {
            q.setString(1,alias); q.setString(2,displayName); q.setString(3,id);
            if (q.executeUpdate()!=1) throw new NoSuchElementException("account not found");
        }
    }
    private static void validAlias(String alias) {
        if (alias == null || !alias.matches("[a-z][a-z0-9-]{0,31}") || alias.startsWith("acct_")) throw new IllegalArgumentException("invalid account alias");
    }
    public List<Account> list() throws SQLException {
        var result=new ArrayList<Account>();
        try (var c=DriverManager.getConnection(url); var q=c.prepareStatement("SELECT * FROM brokerage_account ORDER BY alias"); var rs=q.executeQuery()) {
            while(rs.next()) result.add(new Account(rs.getString("account_id"),rs.getString("alias"),rs.getString("display_name"),
                    new BrokerAssociation(rs.getString("broker"),rs.getString("broker_account"))));
        }
        return List.copyOf(result);
    }
    public Optional<Account> get(String id) throws SQLException {
        if (!validId(id)) return Optional.empty();
        return list().stream().filter(a->a.id().equals(id)).findFirst();
    }
    public String identityNamespace(String id) throws SQLException {
        if (!validId(id)) throw new IllegalArgumentException("canonical Account ID required");
        try(var c=DriverManager.getConnection(url);var q=c.prepareStatement("SELECT identity_namespace FROM brokerage_account WHERE account_id=?")) {
            q.setString(1,id);try(var rs=q.executeQuery()){if(!rs.next())throw new NoSuchElementException("account not found");return rs.getString(1);}
        }
    }
}
