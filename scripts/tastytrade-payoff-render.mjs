// Line-based terminal geometry only; domain supplies verified payoff semantics.
export function silhouette(position, { width = 31, ascii = false, color = false } = {}) {
  const profile = position.payoff;
  const ink = (s,code) => color && code ? `\x1b[${code}m${s}\x1b[22;97m` : s;
  if (!profile) return { text: ink("IC [?terms]","37"), unavailable: true };
  const [a,b,c,d] = profile.strikes;
  const span = d-a, lo = a-span*.15, hi = d+span*.15;
  // A fixed indicator cell keeps every row's actual plotting interval aligned.
  const count = width-1, index = value => Math.round((value-lo)/(hi-lo)*(count-1));
  const breaks = profile.strikes.map(index);
  // Reject collapsed or sub-cell wings/plateaux; never widen a wing aesthetically.
  const scale = (count-1)/(hi-lo);
  if (width < 10 || (b-a)*scale < 1 || (d-c)*scale < 1 || (c-b)*scale < 1 ||
      breaks.some((v,i)=>i>0 && v<=breaks[i-1])) {
    return { text: ink("IC [compressed]","93"), compressed: true, breaks, lo, hi };
  }
  // One diagonal is a legible transition cue, not a repeated-stroke height plot.
  // Keep each wing's full proportional interval: amber shoulders connect its
  // single midpoint diagonal to the low/high rails. Only the true plateau is green.
  const putSlope = index((a+b)/2), callSlope = index((c+d)/2);
  const cells = Array.from({length:count},(_,i)=>{
    const x = lo+(hi-lo)*i/(count-1);
    if (i === putSlope) return {char:ascii?"/":"╱",code:"93"};
    if (i === callSlope) return {char:ascii?"\\":"╲",code:"93"};
    if (x<a) return {char:"_",code:profile.leftTail<0?"91":"97"};
    if (x<b) return {char:i<putSlope?"_":ascii?"-":"‾",code:"93"};
    if (x<=c) return {char:ascii?"-":"‾",code:"92"};
    if (x<=d) return {char:i<callSlope?ascii?"-":"‾":"_",code:"93"};
    return {char:"_",code:profile.rightTail<0?"91":"97"};
  });
  let markerIndex = null;
  if (Number.isFinite(position.spot.value)) {
    const value = position.spot.value;
    markerIndex = value<lo ? 0 : value>hi ? count-1 : index(value);
    cells[markerIndex] = {char: value<lo ? ascii?"<":"←" : value>hi ? ascii?">":"→" : ascii?"v":"▼",code:"96"};
  }
  const prefix = profile.unequal ? ascii ? "U" : "≠" : " ";
  return { text: ink(prefix,profile.unequal?"93":null)+cells.map(c=>ink(c.char,c.code)).join(""),
    breaks, markerIndex, lo, hi };
}
