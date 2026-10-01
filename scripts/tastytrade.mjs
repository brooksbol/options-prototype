#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

// This experimental CLI has only allowlisted broker reads and no broker-write capability.
export const PRODUCTION_BASE_URL = "https://api.tastyworks.com";
const USER_AGENT = "wheelwright-tastytrade-cli/0.2";
const REQUIRED = ["TASTYTRADE_CLIENT_ID", "TASTYTRADE_CLIENT_SECRET", "TASTYTRADE_REFRESH_TOKEN"];
const ENV_FILE = new URL("../.env", import.meta.url);
const PAGE_SIZE = 100;
const MAX_PAGES = 100;

const HELP = `Usage: tt <command> [options]

Read-only production tastytrade command-line utility.
Credentials: TASTYTRADE_CLIENT_ID, TASTYTRADE_CLIENT_SECRET, TASTYTRADE_REFRESH_TOKEN
(export them or set them in this repository's private .env file).

Commands:
  accounts         List accessible accounts
  positions        Show positions and complex orders for one account
  help             Show this help

Options:
  -h, --help       Show help

Run 'tt <command> --help' for command-specific help.`;

const ACCOUNTS_HELP = `Usage: tt accounts

List accounts accessible to the authenticated production customer.`;

const POSITIONS_HELP = `Usage: tt positions [--account <account-number>]

Show broker positions and all pages of complex orders for one production account.
If you have one accessible account, it is selected automatically.
With multiple accounts, specify --account <account-number>.
Positions and orders are separate broker evidence; no protection verdict is inferred.`;

class CliError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}

export function parseCommand(argv) {
  if (argv.length === 0 || (argv.length === 1 && ["help", "-h", "--help"].includes(argv[0]))) {
    return { kind: "help", text: HELP };
  }
  if (argv[0] === "accounts") {
    if (argv.length === 1) return { kind: "accounts" };
    if (argv.length === 2 && ["-h", "--help"].includes(argv[1])) return { kind: "help", text: ACCOUNTS_HELP };
    throw new CliError(`Invalid accounts arguments.\n${ACCOUNTS_HELP}`, 2);
  }
  if (argv[0] === "positions") {
    if (argv.length === 2 && ["-h", "--help"].includes(argv[1])) return { kind: "help", text: POSITIONS_HELP };
    if (argv.length === 1) return { kind: "positions" };
    if (argv.length !== 3 || argv[1] !== "--account" || !/^[A-Za-z0-9]+$/.test(argv[2])) {
      throw new CliError(`Invalid positions arguments.\n${POSITIONS_HELP}`, 2);
    }
    return { kind: "positions", account: argv[2] };
  }
  throw new CliError("Unknown command or option.\nUsage: tt <command> [options]\nRun 'tt --help' for help.", 2);
}

export function credentials(env, readFile = readFileSync) {
  const values = Object.fromEntries(REQUIRED.map((key) => [key, env[key]]));
  if (REQUIRED.some((key) => !values[key]?.trim())) {
    let fileValues = {};
    try {
      fileValues = parseEnv(readFile(ENV_FILE, "utf8"));
    } catch (error) {
      if (error?.code !== "ENOENT") throw new CliError("Cannot read the local .env credential file");
    }
    for (const key of REQUIRED) values[key] = values[key]?.trim() ? values[key] : fileValues[key];
  }
  const missing = REQUIRED.filter((key) => !values[key]?.trim());
  if (missing.length) throw new CliError(`Missing environment variables: ${missing.join(", ")}`);
  return values;
}

async function request(fetchImpl, path, options, step) {
  let response;
  try {
    response = await fetchImpl(`${PRODUCTION_BASE_URL}${path}`, {
      ...options,
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...options.headers },
    });
  } catch {
    throw new CliError(`${step}: network error or redirect blocked`);
  }
  if (!response.ok) {
    if (step === "Positions" && response.status === 404) {
      throw new CliError("Account not found (HTTP 404). Check --account or run 'tt accounts'.");
    }
    if (step === "OAuth" && [400, 401, 403].includes(response.status)) {
      let code;
      try { code = (await response.json())?.error?.code; } catch { /* Ignore untrusted error body. */ }
      const detail = code === "invalid_credentials" ? " (invalid_credentials)" : "";
      throw new CliError(`OAuth authentication failed (HTTP ${response.status})${detail}. Sandbox and production OAuth credentials are separate; verify these are production credentials.`);
    }
    throw new CliError(`${step}: HTTP ${response.status}`);
  }
  try { return await response.json(); } catch { throw new CliError(`${step}: malformed JSON response`); }
}

async function authenticate(fetchImpl, values) {
  const body = await request(fetchImpl, "/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "refresh_token", client_id: values.TASTYTRADE_CLIENT_ID,
      client_secret: values.TASTYTRADE_CLIENT_SECRET, refresh_token: values.TASTYTRADE_REFRESH_TOKEN }),
  }, "OAuth");
  if (typeof body?.access_token !== "string" || !body.access_token.trim()) {
    throw new CliError("OAuth: malformed response (missing access_token)");
  }
  return body.access_token;
}

function brokerGet(fetchImpl, resource, account, token) {
  let path;
  if (resource === "accounts") path = "/customers/me/accounts";
  else if (["positions", "complex-orders"].includes(resource) && /^[A-Za-z0-9]+$/.test(account)) {
    path = `/accounts/${encodeURIComponent(account)}/${resource}`;
  } else throw new CliError("Unsupported broker read");
  return (pageOffset) => request(fetchImpl,
    resource === "complex-orders" ? `${path}?page-offset=${pageOffset}&per-page=${PAGE_SIZE}` : path,
    { method: "GET", headers: { Authorization: `Bearer ${token}` } },
    resource === "accounts" ? "Accounts" : resource === "positions" ? "Positions" : "Complex orders");
}

function safeField(value, fallback = "—") {
  return (typeof value === "string" || typeof value === "number") && String(value).trim()
    ? String(value).replace(/[\x00-\x1f\x7f]/g, " ").trim().slice(0, 120)
    : fallback;
}

function orderTimestamp(value) {
  if (typeof value === "string" && !/^\d+$/.test(value)) return safeField(value);
  const milliseconds = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(milliseconds)) throw new CliError("Complex orders: malformed update timestamp");
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) throw new CliError("Complex orders: malformed update timestamp");
  return date.toISOString();
}

function accountItems(body) {
  const items = body?.data?.items;
  if (!Array.isArray(items)) throw new CliError("Accounts: malformed response (missing data.items)");
  const page = body?.pagination;
  if (page && ((Number.isInteger(page["total-pages"]) && page["total-pages"] > 1) ||
      (Number.isInteger(page["total-items"]) && page["total-items"] > items.length))) {
    throw new CliError("Accounts: retrieval incomplete");
  }
  if (!items.length) throw new CliError("Accounts: authenticated, but no accounts were returned");
  for (const item of items) {
    const account = item?.account;
    if (typeof account?.["account-number"] !== "string" || !/^[A-Za-z0-9]+$/.test(account["account-number"])) {
      throw new CliError("Accounts: malformed response (missing account-number)");
    }
  }
  return items;
}

export function renderAccounts(body) {
  const items = accountItems(body);
  const lines = items.map((item) => {
    const account = item.account;
    return [safeField(account["account-number"]),
      safeField(account.nickname, safeField(account["account-type-name"], "unnamed")),
      safeField(item["authority-level"], "unknown authority")].join("  ");
  });
  return `tastytrade production: authenticated\naccounts: ${items.length}\n${lines.join("\n")}`;
}

export function renderPositions(body, account) {
  const items = body?.data?.items;
  if (!Array.isArray(items)) throw new CliError("Positions: malformed response (missing data.items)");
  const page = body?.pagination;
  if (page && ((Number.isInteger(page["total-pages"]) && page["total-pages"] > 1) ||
      (Number.isInteger(page["total-items"]) && page["total-items"] > items.length))) {
    throw new CliError("Positions: retrieval incomplete");
  }
  const lines = [`positions: ${items.length}`];
  for (const item of items) {
    if (!item || typeof item !== "object" || item["account-number"] !== account ||
        typeof item.symbol !== "string" || !item.symbol.trim() ||
        !((typeof item.quantity === "string" && item.quantity.trim()) ||
          (typeof item.quantity === "number" && Number.isFinite(item.quantity))) ||
        typeof item["quantity-direction"] !== "string" || !item["quantity-direction"].trim()) {
      throw new CliError("Positions: malformed position or wrong account in response");
    }
    const parts = [safeField(item.symbol), safeField(item["instrument-type"], "unknown instrument"),
      safeField(item["quantity-direction"]), safeField(item.quantity)];
    if (item["average-open-price"] != null) parts.push(`average open ${safeField(item["average-open-price"])}`);
    if (item["updated-at"] != null) parts.push(`updated ${safeField(item["updated-at"])}`);
    lines.push(parts.join("  "));
  }
  return lines.join("\n");
}

export async function readComplexOrders(getPage) {
  let expectedPages;
  let expectedItems;
  const items = [];
  for (let offset = 0; offset < MAX_PAGES; offset++) {
    const body = await getPage(offset);
    const page = body?.pagination;
    const chunk = body?.data?.items;
    if (!Array.isArray(chunk) || !page || !Number.isInteger(page["page-offset"]) ||
        !Number.isInteger(page["total-pages"]) || !Number.isInteger(page["total-items"]) ||
        page["page-offset"] !== offset || page["total-pages"] < 0 || page["total-items"] < 0) {
      throw new CliError("Complex orders: malformed pagination or response; retrieval incomplete");
    }
    if (expectedPages === undefined) {
      expectedPages = page["total-pages"];
      expectedItems = page["total-items"];
      if (expectedPages > MAX_PAGES) throw new CliError("Complex orders: page limit exceeded; retrieval incomplete");
    } else if (page["total-pages"] !== expectedPages || page["total-items"] !== expectedItems) {
      throw new CliError("Complex orders: result changed during pagination; retrieval incomplete");
    }
    items.push(...chunk);
    if (offset + 1 >= expectedPages || expectedPages === 0) {
      if (items.length !== expectedItems || (expectedPages === 0 && items.length !== 0)) {
        throw new CliError("Complex orders: pagination count mismatch; retrieval incomplete");
      }
      const ids = items.map((item) => item?.id);
      if (ids.some((id) => id == null) || new Set(ids.map(String)).size !== ids.length) {
        throw new CliError("Complex orders: duplicate or missing order identity; retrieval incomplete");
      }
      return { items, pages: expectedPages };
    }
  }
  throw new CliError("Complex orders: page limit exceeded; retrieval incomplete");
}

function renderOrder(order, role) {
  if (!order || typeof order !== "object" || !Array.isArray(order.legs)) {
    throw new CliError("Complex orders: malformed component order");
  }
  const parts = [role, `#${safeField(order.id, "unknown")}`, safeField(order.status, "unknown status"),
    safeField(order["order-type"], "unknown type")];
  if (order.price != null) parts.push(`price ${safeField(order.price)} ${safeField(order["price-effect"], "")}`.trim());
  if (order["stop-trigger"] != null) parts.push(`stop trigger ${safeField(order["stop-trigger"])}`);
  parts.push(safeField(order["time-in-force"], "unknown TIF"));
  if (order["updated-at"] != null) parts.push(`updated ${orderTimestamp(order["updated-at"])}`);
  const lines = [`  ${parts.join("  ")}`];
  for (const leg of order.legs) {
    if (!leg || typeof leg !== "object") throw new CliError("Complex orders: malformed leg");
    lines.push(`    ${safeField(leg.action, "unknown action")}  ${safeField(leg.quantity, "unknown quantity")}  ${safeField(leg.symbol, "unknown symbol")}`);
  }
  return lines.join("\n");
}

export function renderComplexOrders(account, result, retrievedAt) {
  const lines = [`tastytrade production: account ${account}`, `complex orders: ${result.items.length} (complete; ${result.pages} ${result.pages === 1 ? "page" : "pages"})`,
    `retrieved-at: ${retrievedAt}`];
  for (const item of result.items) {
    if (!item || typeof item !== "object" || !Array.isArray(item.orders) || !item.id) {
      throw new CliError("Complex orders: malformed complex order");
    }
    lines.push(`#${safeField(item.id)}  ${safeField(item.type, "unknown type")}`);
    if (item["trigger-order"]) lines.push(renderOrder(item["trigger-order"], "trigger"));
    for (const order of item.orders) lines.push(renderOrder(order, "component"));
    if (item["related-orders"] != null) {
      if (!Array.isArray(item["related-orders"])) throw new CliError("Complex orders: malformed related orders");
      for (const related of item["related-orders"]) {
        if (!related || typeof related !== "object") throw new CliError("Complex orders: malformed related order");
        lines.push(`  related #${safeField(related.id, "unknown")}  ${safeField(related.status, "unknown status")}`);
      }
    }
  }
  return lines.join("\n");
}

export async function main(argv = process.argv.slice(2), { env = process.env, readFile = readFileSync,
  fetchImpl = fetch, out = console.log, err = console.error, now = () => new Date() } = {}) {
  try {
    const command = parseCommand(argv);
    if (command.kind === "help") { out(command.text); return 0; }
    const values = credentials(env, readFile);
    const token = await authenticate(fetchImpl, values);
    if (command.kind === "accounts") {
      out(renderAccounts(await brokerGet(fetchImpl, "accounts", undefined, token)()));
    } else {
      let account = command.account;
      if (!account) {
        const items = accountItems(await brokerGet(fetchImpl, "accounts", undefined, token)());
        if (items.length !== 1) throw new CliError("Multiple accounts available; run 'tt accounts' and specify --account <account-number>.", 2);
        account = items[0].account["account-number"];
      }
      const positions = renderPositions(await brokerGet(fetchImpl, "positions", account, token)(), account);
      const result = await readComplexOrders(brokerGet(fetchImpl, "complex-orders", account, token));
      const orders = renderComplexOrders(account, result, now().toISOString());
      out([`tastytrade production: account ${account}`, positions,
        orders.split("\n").slice(1).join("\n")].join("\n"));
    }
    return 0;
  } catch (error) {
    err(error instanceof CliError ? error.message : "Unexpected response or internal error");
    return error instanceof CliError ? error.exitCode : 1;
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exitCode = await main();
}
