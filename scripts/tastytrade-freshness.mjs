// Broker session context, shared by quote valuations and quote-derived direction.
const MAX_AGE_MS = 12 * 60 * 60 * 1000;
const nyDate = (at) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date(at));
const timestamp = (value) => typeof value === "string" ? Date.parse(value) : NaN;

export function completedSession(session, now) {
  if (session?.state !== "Closed") return null;
  // On a non-trading day the current session has no times; use the broker's
  // previous session, which also handles holidays and shortened sessions.
  const candidates = [session, session["previous-session"]].map((item) => ({
    open: timestamp(item?.["open-at"]), close: timestamp(item?.["close-at"]),
  })).filter(({ open, close }) => Number.isFinite(open) && Number.isFinite(close) &&
    open < close && close <= now.getTime());
  const nextOpen = timestamp(session["next-session"]?.["open-at"]);
  const currentOpen = timestamp(session["open-at"]);
  const latestOpen = Math.max(...[currentOpen, nextOpen].filter((at) => at <= now.getTime()));
  const latest = candidates.sort((a, b) => b.close - a.close)[0];
  // A newer session must not be bypassed by a contradictory Closed response.
  return latest && !(latestOpen > latest.close) ? latest : null;
}

export function usableEvidence(at, now, session) {
  if (!Number.isFinite(at) || at > now.getTime() + 60_000) return false;
  if (now.getTime() - at <= MAX_AGE_MS) return true;
  const completed = completedSession(session, now);
  return Boolean(completed && at >= completed.open && nyDate(at) === nyDate(completed.close));
}

export function retainedSessionLabel(at, now, session) {
  if (now.getTime() - at <= MAX_AGE_MS || !usableEvidence(at, now, session)) return null;
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York",
    weekday: "short", month: "2-digit", day: "2-digit" }).format(new Date(at));
}
