// Line-based terminal geometry only; domain supplies verified payoff semantics.
export function silhouette(position, { width = 31, ascii = false, color = false } = {}) {
  const profile = position.payoff;
  const ink = (s,code) => color && code ? `\x1b[${code}m${s}\x1b[22;97m` : s;
  if (!profile) return { text: ink("IC [?terms]","37"), unavailable: true };
  const [a,b,c,d] = profile.strikes;
  const span = d-a, lo = a-span*.1, hi = d+span*.1;
  // A fixed indicator cell keeps every row's actual plotting interval aligned.
  const count = width-1, index = value => Math.round((value-lo)/(hi-lo)*(count-1));
  const breaks = profile.strikes.map(index);
  // Reject collapsed or sub-cell wings/plateaux; never widen a wing aesthetically.
  const scale = (count-1)/(hi-lo);
  if (width < 10 || (b-a)*scale < 1 || (d-c)*scale < 1 || (c-b)*scale < 1 ||
      breaks.some((v,i)=>i>0 && v<=breaks[i-1])) {
    return { text: ink("IC [compressed]","93"), compressed: true, breaks, lo, hi };
  }
  const cells = Array.from({length:count},(_,i)=>{
    const x = lo+(hi-lo)*i/(count-1);
    if (x<a) return {char:"_",code:profile.leftTail<0?"91":"97"};
    if (x<b) return {char:ascii?"/":"╱",code:"93"};
    if (x<=c) return {char:ascii?"-":"‾",code:"92"};
    if (x<=d) return {char:ascii?"\\":"╲",code:"93"};
    return {char:"_",code:profile.rightTail<0?"91":"97"};
  });
  let markerIndex = null;
  if (position.spot.value !== null && !position.spot.stale) {
    const value = position.spot.value;
    markerIndex = value<lo ? 0 : value>hi ? count-1 : index(value);
    cells[markerIndex] = {char: value<lo ? ascii?"<":"←" : value>hi ? ascii?">":"→" : ascii?"v":"▼",code:"96"};
  }
  const prefix = profile.unequal ? ascii ? "U" : "≠" : " ";
  return { text: ink(prefix,profile.unequal?"93":null)+cells.map(c=>ink(c.char,c.code)).join(""),
    breaks, markerIndex, lo, hi };
}
