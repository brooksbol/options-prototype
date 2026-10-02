// One-shot, read-only DXLink Greek snapshot for held option contracts.
// A missing or old Greek leaves direction unknown; it never changes trade economics.

const GREEK_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const SNAPSHOT_TIMEOUT_MS = 5_000;
const FIELDS = ["eventType", "eventSymbol", "time", "delta"];

function optionKey(symbol) {
  const match = /^([A-Za-z0-9.]+)\s+(\d{6}[CP]\d{8})$/.exec(symbol);
  return match ? `${match[1]}${match[2]}` : null;
}

function acceptedEndpoint(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === "wss:" && url.hostname.endsWith(".dxfeed.com") &&
      url.username === "" && url.password === "" && url.search === "" && url.hash === "";
  } catch { return false; }
}

export async function readHeldGreeks({ symbols, loadInstrument, loadQuoteToken,
  WebSocketImpl = WebSocket, now = new Date(), timeoutMs = SNAPSHOT_TIMEOUT_MS }) {
  if (!Array.isArray(symbols) || symbols.length === 0 || symbols.length > 100 ||
      symbols.some((symbol) => !optionKey(symbol)) ||
      typeof loadInstrument !== "function" || typeof loadQuoteToken !== "function" ||
      !(now instanceof Date) || !Number.isFinite(now.getTime())) return [];

  const unique = [...new Set(symbols)];
  const definitions = await Promise.all(unique.map((symbol) => loadInstrument(symbol)));
  const byStreamer = new Map();
  for (let i = 0; i < unique.length; i++) {
    const item = definitions[i]?.data;
    const streamer = item?.["streamer-symbol"];
    if (optionKey(item?.symbol) !== optionKey(unique[i]) ||
        typeof streamer !== "string" || !/^\.[A-Za-z0-9.:]+$/.test(streamer) ||
        byStreamer.has(streamer)) return [];
    byStreamer.set(streamer, unique[i]);
  }
  const auth = (await loadQuoteToken())?.data;
  if (typeof auth?.token !== "string" || !auth.token ||
      !acceptedEndpoint(auth["dxlink-url"])) return [];

  return new Promise((resolve) => {
    let socket;
    const observed = new Map();
    let finished = false;
    let subscribed = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try { socket?.close(); } catch { /* Snapshot already complete. */ }
      resolve([...observed.values()]);
    };
    const timer = setTimeout(finish, timeoutMs);
    const send = (message) => {
      if (!finished && socket?.readyState === 1) socket.send(JSON.stringify(message));
    };
    try {
      socket = new WebSocketImpl(auth["dxlink-url"]);
      socket.addEventListener("open", () => send({ type: "SETUP", channel: 0,
        version: "0.1-DXF-JS/0.3.0", keepaliveTimeout: 60, acceptKeepaliveTimeout: 60 }));
      socket.addEventListener("error", finish);
      socket.addEventListener("close", finish);
      socket.addEventListener("message", ({ data }) => {
        if (finished) return;
        let message;
        try { message = JSON.parse(data); } catch { return; }
        if (message.type === "AUTH_STATE" && message.state === "UNAUTHORIZED") {
          send({ type: "AUTH", channel: 0, token: auth.token });
        } else if (message.type === "AUTH_STATE" && message.state === "AUTHORIZED") {
          send({ type: "CHANNEL_REQUEST", channel: 3, service: "FEED",
            parameters: { contract: "AUTO" } });
        } else if (message.type === "CHANNEL_OPENED" && message.channel === 3) {
          send({ type: "FEED_SETUP", channel: 3, acceptAggregationPeriod: 0.1,
            acceptDataFormat: "COMPACT", acceptEventFields: { Greeks: FIELDS } });
        } else if (message.type === "FEED_CONFIG" && message.channel === 3 && !subscribed) {
          subscribed = true;
          send({ type: "FEED_SUBSCRIPTION", channel: 3, reset: true,
            add: [...byStreamer.keys()].map((symbol) => ({ type: "Greeks", symbol })) });
        } else if (message.type === "FEED_DATA" && message.channel === 3 &&
                   Array.isArray(message.data)) {
          const data = message.data;
          for (let i = 0; i < data.length; i++) {
            if (data[i] !== "Greeks" || !Array.isArray(data[i + 1])) continue;
            const values = data[++i];
            for (let offset = 0; offset + FIELDS.length <= values.length; offset += FIELDS.length) {
              const [eventType, streamer, at, delta] = values.slice(offset, offset + FIELDS.length);
              const symbol = byStreamer.get(streamer);
              if (eventType !== "Greeks" || !symbol || typeof at !== "number" ||
                  typeof delta !== "number" || !Number.isFinite(at) ||
                  !Number.isFinite(delta) || Math.abs(delta) > 1 ||
                  at > now.getTime() + 60_000 || now.getTime() - at > GREEK_MAX_AGE_MS) continue;
              const previous = observed.get(symbol);
              if (!previous || at >= previous.updatedAt) observed.set(symbol, {
                symbol, delta, updatedAt: at });
            }
          }
          if (observed.size === unique.length) finish();
        }
      });
    } catch { finish(); }
  });
}
