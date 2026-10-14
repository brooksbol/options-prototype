// Line-based terminal geometry only; domain supplies verified payoff semantics.
function spotGlyph(char, ascii) {
  if (char === '_') return ascii ? 'v' : '▼';
  if (['╱','╲','/','\\'].includes(char)) return ascii ? '*' : '◆';
  return ascii ? '^' : '▲';
}
export function silhouette(position, { width = 31, ascii = false, color = false } = {}) {
  const profile = position.payoff;
  const ink = (s,code) => color && code ? `\x1b[${code}m${s}\x1b[22;97m` : s;
  const label = position.strategy === "Bull Put Credit Spread" ? "BP" : position.strategy === "Bear Call Credit Spread" ? "BC" : "IC";
  if (!profile) return { text: ink(`${label} [?terms]`,"37"), unavailable: true };
  if (profile.strikes.length === 2) return vertical(position, { width, ascii, color });
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
    if (x<a) return {char:"_",code:profile.leftTail<0?"2;91":"97"};
    if (x<b) return {char:i<putSlope?"_":ascii?"-":"‾",code:"93"};
    if (x<=c) return {char:ascii?"-":"‾",code:"92"};
    if (x<=d) return {char:i<callSlope?ascii?"-":"‾":"_",code:"93"};
    return {char:"_",code:profile.rightTail<0?"2;91":"97"};
  });
  let markerIndex = null, spotRegionCode = null;
  if (Number.isFinite(position.spot.value)) {
    const value = position.spot.value;
    markerIndex = value<lo ? 0 : value>hi ? count-1 : index(value);
    spotRegionCode = value<lo ? (profile.leftTail<0?"2;91":"97") : value>hi ? (profile.rightTail<0?"2;91":"97") : cells[markerIndex].code;
    cells[markerIndex] = {char: value<lo ? ascii?"<":"←" : value>hi ? ascii?">":"→" : spotGlyph(cells[markerIndex].char,ascii),code:"96"};
  }
  const prefix = profile.unequal ? ascii ? "U" : "≠" : " ";
  return { text: ink(prefix,profile.unequal?"93":null)+cells.map(c=>ink(c.char,c.code)).join(""),
    breaks, markerIndex, spotRegionCode, lo, hi };
}

// Same linear strike axis and single transition cue as the condor graphic.
function vertical(position, { width, ascii, color }) {
  const p = position.payoff, [a,b] = p.strikes, span = b-a;
  const viewport = verticalViewport(position, { width });
  const { lo, hi } = viewport, count = width-1;
  const index = value => Math.round((value-lo)/(hi-lo)*(count-1));
  const breaks = [index(a),index(b)], slope = index((a+b)/2);
  const ink = (s,code) => color ? `\x1b[${code}m${s}\x1b[22;97m` : s;
  if (width < 10 || span*(count-1)/(hi-lo) < 1-1e-8 || breaks[1] <= breaks[0]) return { text: ink("Spread [compressed]","93"), compressed:true };
  const bull = p.strategy === "put";
  const cells = Array.from({length:count},(_,i)=>{
    const x = lo+(hi-lo)*i/(count-1), high = bull ? i>slope : i<slope;
    if(i===slope) return {char:bull ? ascii?"/":"╱" : ascii?"\\":"╲",code:"93"};
    return {char:high ? ascii?"-":"‾" : "_",code:x<a ? bull?"2;91":"92" : x>b ? bull?"92":"2;91" : "93"};
  });
  let markerIndex = null, spotRegionCode = null;
  if(Number.isFinite(position.spot.value)) {
    const v=position.spot.value;
    markerIndex=v<lo ? 0 : v>hi ? count-1 : index(v);
    spotRegionCode = v<lo ? (bull?"2;91":"92") : v>hi ? (bull?"92":"2;91") : cells[markerIndex].code;
    cells[markerIndex]={char:v<lo ? ascii?"<":"←" : v>hi ? ascii?">":"→" : spotGlyph(cells[markerIndex].char,ascii),code:"96"};
  }
  const prefix = viewport.referenceKind === "strike fallback" ? "?" : viewport.limited ? "~" : " ";
  return {text:(prefix === " " ? prefix : ink(prefix,"93"))+cells.map(c=>ink(c.char,c.code)).join(""),
    breaks,markerIndex,spotRegionCode,lo,hi,viewport};
}

// Presentation policy only. IC keeps its existing four-strike axis unchanged.
// Two outer cells on the adverse side preserve the loss rail. Width is linear;
// cap its total span at 29 spread-widths so the transition is never sub-cell.
export function verticalViewport(position, { width = 31 } = {}) {
  const [a,b] = position.payoff.strikes, w=b-a, intervals=width-2;
  const bull=position.payoff.strategy === "put";
  const entry=position.entryReference?.value;
  const verified=Number.isFinite(entry) && entry>0;
  const anchor=verified ? entry : bull ? b+4*w : Math.max(a/2,a-4*w);
  const radius=Math.max(Math.abs(anchor-a),Math.abs(anchor-b))/(1-4/intervals);
  const maxSpan=w*intervals;
  let lo=anchor-radius, hi=anchor+radius;
  const limited=hi-lo>maxSpan;
  if(limited) {
    // Correct transition resolution outranks centering a very distant entry.
    lo=bull ? a-2*w : b+2*w-maxSpan;hi=lo+maxSpan;
  }
  const clipped=lo<0;lo=Math.max(0,lo);
  return {lo,hi,anchor,referenceKind:verified ? "pre-entry candle" : "strike fallback",
    limited:limited || clipped};
}
