#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { LiveError, maskAccount, renderLive } from "./tastytrade-live.mjs";
import { ScoutError, parseScout, selectSpecimens, buildScoutObservation } from "./tastytrade-scout.mjs";

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
  live             Summarize recognizable live trades for one account
  scout            Export one explicit option specimen observation as JSON
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

const LIVE_HELP = `Usage: tt live [--account <account-number>] [--tsv]

Show an indicative, read-only live-trade summary for one production account.
If you have one accessible account, it is selected automatically.
With multiple accounts, specify --account <account-number>.
Use --tsv for tab-separated, uncolored output suitable for redirection.
Unsupported or ambiguous holdings are not guessed; use tt positions for broker evidence.`;

const SCOUT_HELP = "Usage: tt scout ROOT --expiration YYYY-MM-DD --short-put-strike PRICE --widths W1,W2 --underlying-type equity|index\n\n" +
  "Export read-only production broker evidence for explicitly selected put credit verticals.\n" +
  "One root and one exact expiration/short strike per invocation; each width selects a lower-strike long put.\n" +
  "Output is JSON. Missing or stale quote evidence is explicit and exits nonzero.\n" +
  "No Exit Reliability score, package quote, ranking, or order capability.";

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
  if (argv[0] === "scout") {
    if (argv.length === 2 && ["-h", "--help"].includes(argv[1])) return { kind: "help", text: SCOUT_HELP };
    try { return parseScout(argv.slice(1)); }
    catch { throw new CliError("Invalid scout arguments.\n" + SCOUT_HELP, 2); }
  }
  if (argv[0] === "accounts") {
    if (argv.length === 1) return { kind: "accounts" };
    if (argv.length === 2 && ["-h", "--help"].includes(argv[1])) return { kind: "help", text: ACCOUNTS_HELP };
    throw new CliError(`Invalid accounts arguments.\n${ACCOUNTS_HELP}`, 2);
  }
  if (["positions", "live"].includes(argv[0])) {
    const kind = argv[0];
    const help = kind === "live" ? LIVE_HELP : POSITIONS_HELP;
    if (argv.length === 2 && ["-h", "--help"].includes(argv[1])) return { kind: "help", text: help };
    if (argv.length === 1) return { kind };
    if (kind === "live") {
      let account; let tsv = false;
      for (let index = 1; index < argv.length; index++) {
        if (argv[index] === "--tsv" && !tsv) tsv = true;
        else if (argv[index] === "--account" && !account &&
            /^[A-Za-z0-9]+$/.test(argv[index + 1] ?? "")) account = argv[++index];
        else throw new CliError(`Invalid live arguments.\n${LIVE_HELP}`, 2);
      }
      return { kind, ...(account ? { account } : {}), ...(tsv ? { tsv } : {}) };
    }
    if (argv.length !== 3 || argv[1] !== "--account" || !/^[A-Za-z0-9]+$/.test(argv[2])) {
      throw new CliError(`Invalid ${kind} arguments.\n${help}`, 2);
    }
    return { kind, account: argv[2] };
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
    if (["Positions", "Orders", "Complex orders"].includes(step) && response.status === 404) {
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
  else if (["positions", "complex-orders", "orders"].includes(resource) && /^[A-Za-z0-9]+$/.test(account)) {
    path = `/accounts/${encodeURIComponent(account)}/${resource}`;
  } else if (resource === "equity-option-quotes") {
    path = "/market-data/by-type";
  } else throw new CliError("Unsupported broker read");
  return (argument) => request(fetchImpl,
    ["complex-orders", "orders"].includes(resource) ? `${path}?page-offset=${argument}&per-page=${PAGE_SIZE}` :
      resource === "equity-option-quotes" && Array.isArray(argument) && argument.length > 0 && argument.length <= 100 &&
        argument.every((symbol) => typeof symbol === "string" && /^[A-Za-z0-9 .]+$/.test(symbol)) ?
        `${path}?${argument.map((symbol) => `equity-option[]=${encodeURIComponent(symbol)}`).join("&")}` :
      resource === "equity-option-quotes" ? (() => { throw new CliError("Unsupported quote request"); })() : path,
    { method: "GET", headers: { Authorization: `Bearer ${token}` } },
    resource === "accounts" ? "Accounts" : resource === "positions" ? "Positions" :
      resource === "orders" ? "Orders" : resource === "equity-option-quotes" ? "Quotes" : "Complex orders");
}

function scoutGet(fetchImpl, resource, root, token, argument) {
  if (!/^[A-Z][A-Z0-9.]{0,9}$/.test(root)) throw new CliError("Unsupported scout root");
  let path;
  if (resource === "chain") path = "/option-chains/" + encodeURIComponent(root);
  else if (resource === "metrics") path = "/market-metrics?symbols=" + encodeURIComponent(root);
  else if (resource === "underlying" && ["equity", "index"].includes(argument)) {
    path = "/market-data/by-type?" + argument + "[]=" + encodeURIComponent(root);
  } else if (resource === "quotes" && Array.isArray(argument) && argument.length > 0 &&
      argument.length <= 100 && argument.every((symbol) => typeof symbol === "string" &&
        /^[A-Za-z0-9 .]+$/.test(symbol))) {
    path = "/market-data/by-type?" + argument.map((symbol) =>
      "equity-option[]=" + encodeURIComponent(symbol)).join("&");
  } else throw new CliError("Unsupported scout read");
  return request(fetchImpl, path, { method: "GET", headers: { Authorization: "Bearer " + token } },
    "Scout " + resource);
}

export function quoteBatches(symbols) {
  if (!Array.isArray(symbols) || symbols.some((symbol) => typeof symbol !== "string") ||
      new Set(symbols).size !== symbols.length) throw new CliError("Scout: invalid quote symbols");
  const batches = [];
  for (let offset = 0; offset < symbols.length; offset += 100) batches.push(symbols.slice(offset, offset + 100));
  return batches;
}

function safeField(value, fallback = "—") {
  return (typeof value === "string" || typeof value === "number") && String(value).trim()
    ? String(value).replace(/[\x00-\x1f\x7f]/g, " ").trim().slice(0, 120)
    : fallback;
}

function optionRight(symbol) {
  const match = typeof symbol === "string" && /^[A-Za-z0-9.]+\s+\d{6}([CP])\d{8}$/.exec(symbol);
  return match ? (match[1] === "C" ? "Call" : "Put") : null;
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
    const parts = [safeField(item.symbol), safeField(item["instrument-type"], "unknown instrument")];
    if (item["instrument-type"] === "Equity Option") parts.push(optionRight(item.symbol) ?? "option type unknown");
    parts.push(safeField(item["quantity-direction"]), safeField(item.quantity));
    if (item["average-open-price"] != null) parts.push(`average open ${safeField(item["average-open-price"])}`);
    if (item["updated-at"] != null) parts.push(`updated ${safeField(item["updated-at"])}`);
    lines.push(parts.join("  "));
  }
  return lines.join("\n");
}

async function readPages(getPage, label) {
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
      throw new CliError(`${label}: malformed pagination or response; retrieval incomplete`);
    }
    if (expectedPages === undefined) {
      expectedPages = page["total-pages"];
      expectedItems = page["total-items"];
      if (expectedPages > MAX_PAGES) throw new CliError(`${label}: page limit exceeded; retrieval incomplete`);
    } else if (page["total-pages"] !== expectedPages || page["total-items"] !== expectedItems) {
      throw new CliError(`${label}: result changed during pagination; retrieval incomplete`);
    }
    items.push(...chunk);
    if (offset + 1 >= expectedPages || expectedPages === 0) {
      if (items.length !== expectedItems || (expectedPages === 0 && items.length !== 0)) {
        throw new CliError(`${label}: pagination count mismatch; retrieval incomplete`);
      }
      const ids = items.map((item) => item?.id);
      if (ids.some((id) => id == null) || new Set(ids.map(String)).size !== ids.length) {
        throw new CliError(`${label}: duplicate or missing order identity; retrieval incomplete`);
      }
      return { items, pages: expectedPages };
    }
  }
  throw new CliError(`${label}: page limit exceeded; retrieval incomplete`);
}

export const readComplexOrders = (getPage) => readPages(getPage, "Complex orders");
export const readOrders = (getPage) => readPages(getPage, "Orders");

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
    const right = optionRight(leg.symbol);
    lines.push(`    ${safeField(leg.action, "unknown action")}  ${safeField(leg.quantity, "unknown quantity")}  ${safeField(leg.symbol, "unknown symbol")}${right ? `  ${right}` : ""}`);
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
  fetchImpl = fetch, out = console.log, err = console.error, now = () => new Date(),
  stdoutIsTTY = process.stdout.isTTY } = {}) {
  try {
    const command = parseCommand(argv);
    if (command.kind === "help") { out(command.text); return 0; }
    const values = credentials(env, readFile);
    const token = await authenticate(fetchImpl, values);
    if (command.kind === "scout") {
      const timings = [];
      const timed = async (label, operation) => {
        const started_at_utc = now().toISOString();
        const result = await operation();
        timings.push({ resource: label, started_at_utc, received_at_utc: now().toISOString() });
        return result;
      };
      const chain = await timed("option_chain", () => scoutGet(fetchImpl, "chain", command.root, token));
      const specimens = selectSpecimens(chain, command);
      const symbols = [...new Set(specimens.flatMap((item) => item.legs.map((leg) => leg.contract.symbol)))];
      const quoteBodies = [];
      for (const batch of quoteBatches(symbols)) {
        quoteBodies.push(await timed("option_quotes", () => scoutGet(fetchImpl, "quotes", command.root, token, batch)));
      }
      const underlyingQuote = await timed("underlying_quote", () =>
        scoutGet(fetchImpl, "underlying", command.root, token, command.underlyingType));
      const metrics = await timed("market_metrics", () => scoutGet(fetchImpl, "metrics", command.root, token));
      const observation = buildScoutObservation({ selection: command, chain, metrics, underlyingQuote,
        quoteBatches: quoteBodies, timings, observedAt: now().toISOString() });
      out(JSON.stringify(observation, null, 2));
      return observation.status === "complete" ? 0 : 1;
    } else if (command.kind === "accounts") {
      out(renderAccounts(await brokerGet(fetchImpl, "accounts", undefined, token)()));
    } else {
      let account = command.account;
      if (!account) {
        const items = accountItems(await brokerGet(fetchImpl, "accounts", undefined, token)());
        if (items.length !== 1) throw new CliError("Multiple accounts available; run 'tt accounts' and specify --account <account-number>.", 2);
        account = items[0].account["account-number"];
      }
      const positionsBody = await brokerGet(fetchImpl, "positions", account, token)();
      if (command.kind === "positions") {
        const positions = renderPositions(positionsBody, account);
        const result = await readComplexOrders(brokerGet(fetchImpl, "complex-orders", account, token));
        const orders = renderComplexOrders(account, result, now().toISOString());
        out([`tastytrade production: account ${account}`, positions,
          orders.split("\n").slice(1).join("\n")].join("\n"));
      } else {
        // Validate holdings before further reads; never omit an unsupported live holding silently.
        renderPositions(positionsBody, account);
        const holdings = positionsBody.data.items;
        if (holdings.length === 0) {
          out(command.tsv ? renderLive({ account, holdings, orders: [], complexOrders: [], quotes: [],
            now: now(), format: "tsv" }) : `no live trades for account ${maskAccount(account)}`);
        } else {
          const orders = await readOrders(brokerGet(fetchImpl, "orders", account, token));
          const complex = await readComplexOrders(brokerGet(fetchImpl, "complex-orders", account, token));
          const symbols = [...new Set(holdings.map((item) => item.symbol))];
          if (symbols.length > 100) throw new CliError("Live: more than 100 held symbols; use tt positions");
          const quotes = await brokerGet(fetchImpl, "equity-option-quotes", undefined, token)(symbols);
          out(renderLive({ account, holdings, orders: orders.items, complexOrders: complex.items,
            quotes: quotes?.data?.items, now: now(),
            color: Boolean(!command.tsv && stdoutIsTTY && !Object.hasOwn(env, "NO_COLOR")),
            format: command.tsv ? "tsv" : "table" }));
        }
      }
    }
    return 0;
  } catch (error) {
    err(error instanceof CliError || error instanceof LiveError || error instanceof ScoutError ?
      error.message : "Unexpected response or internal error");
    return error instanceof CliError ? error.exitCode : 1;
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exitCode = await main();
}
