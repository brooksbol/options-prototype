#!/usr/bin/env node

// Exploratory, production-only authenticated read. No endpoint or environment switch.
export const PRODUCTION_BASE_URL = "https://api.tastyworks.com";
const USER_AGENT = "wheelwright-tastytrade-hello/0.1";
const REQUIRED = [
  "TASTYTRADE_CLIENT_ID",
  "TASTYTRADE_CLIENT_SECRET",
  "TASTYTRADE_REFRESH_TOKEN",
];

class HelloError extends Error {}

async function request(fetchImpl, path, options, step) {
  let response;
  try {
    response = await fetchImpl(`${PRODUCTION_BASE_URL}${path}`, {
      ...options,
      redirect: "error", // Never forward credentials or a bearer token to another host.
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new HelloError(`${step}: network error or redirect blocked`);
  }

  if (!response.ok) {
    if (step === "OAuth" && (response.status === 400 || response.status === 401 || response.status === 403)) {
      let code;
      try {
        code = (await response.json())?.error?.code;
      } catch {
        // Error bodies are not reliable; never include one in CLI output.
      }
      const detail = code === "invalid_credentials" ? " (invalid_credentials)" : "";
      throw new HelloError(`OAuth authentication failed (HTTP ${response.status})${detail}. Sandbox and production OAuth credentials are separate; verify these are production credentials.`);
    }
    throw new HelloError(`${step}: HTTP ${response.status}`);
  }

  try {
    return await response.json();
  } catch {
    throw new HelloError(`${step}: malformed JSON response`);
  }
}

function safeField(value, fallback) {
  return typeof value === "string" && value.trim()
    ? value.replace(/[\x00-\x1f\x7f]/g, " ").trim().slice(0, 100)
    : fallback;
}

export function renderAccounts(body) {
  const items = body?.data?.items;
  if (!Array.isArray(items)) throw new HelloError("Accounts: malformed response (missing data.items)");
  if (items.length === 0) throw new HelloError("Accounts: authenticated, but no accounts were returned");

  const lines = items.map((item) => {
    const account = item?.account;
    if (!account || typeof account["account-number"] !== "string" || !account["account-number"].trim()) {
      throw new HelloError("Accounts: malformed response (missing account-number)");
    }
    return [
      safeField(account["account-number"], "unknown"),
      safeField(account.nickname, safeField(account["account-type-name"], "unnamed")),
      safeField(item["authority-level"], "unknown authority"),
    ].join("  ");
  });
  return `tastytrade production: authenticated\naccounts: ${items.length}\n${lines.join("\n")}`;
}

export async function main({ env = process.env, fetchImpl = fetch, out = console.log, err = console.error } = {}) {
  const missing = REQUIRED.filter((name) => !env[name]?.trim());
  if (missing.length) {
    err(`Missing environment variables: ${missing.join(", ")}`);
    return 1;
  }

  try {
    const tokenBody = await request(fetchImpl, "/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: env.TASTYTRADE_CLIENT_ID,
        client_secret: env.TASTYTRADE_CLIENT_SECRET,
        refresh_token: env.TASTYTRADE_REFRESH_TOKEN,
      }),
    }, "OAuth");
    const token = tokenBody?.access_token;
    if (typeof token !== "string" || !token.trim()) {
      throw new HelloError("OAuth: malformed response (missing access_token)");
    }

    const accounts = await request(fetchImpl, "/customers/me/accounts", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }, "Accounts");
    out(renderAccounts(accounts));
    return 0;
  } catch (error) {
    // Never print an HTTP body, thrown network exception, request, or token.
    err(error instanceof HelloError ? error.message : "Unexpected response or internal error");
    return 1;
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exitCode = await main();
}
