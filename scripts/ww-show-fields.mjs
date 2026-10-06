// The sole public show projection/catalog/semantic field registry. No I/O or client initialization.
const priceMeaning = "Source-reported nonnegative price in the instrument's applicable unit; currency/lot conventions are not inferred.";
const sizeMeaning = "Source-reported size; provider unit conventions are preserved, not assumed to be shares or lots.";
const instantMeaning = "Original RFC 3339 UTC instant. Terminal presentation uses local time; TSV/JSONL retain the original timestamp. Absence is not inferred from other clocks.";
const missing = "Absent optional evidence is '-' on a terminal, an empty TSV cell, and omitted in JSONL. Genuine zero and empty source strings remain values.";
const entries = [
 ['symbol','subject.symbol','SYMBOL','Canonical uppercase subject identity.','Identity is canonical, never the path-codec token.'],
 ['type','subject.securityType','TYPE','Wheelwright security type.','Public EQUITY, ETF, INDEX, OTHER; wire OTHER_UNDERLYING maps to OTHER.'],
 ['last','facts.last.price','LAST','Last reported trade price.',priceMeaning],
 ['lastSize','facts.last.size','LAST SIZE','Last reported trade size.',sizeMeaning],
 ['lastSourceEventAt','facts.last.sourceEventAt','LAST SOURCE EVENT','Provider last-trade event time.',instantMeaning],
 ['bid','facts.bid.price','BID','Reported bid price.',priceMeaning],
 ['bidSize','facts.bid.size','BID SIZE','Reported displayed bid size.',sizeMeaning],
 ['bidVenue','facts.bid.venue','BID VENUE','Provider-reported bid venue.','Venue is optional source text, not independently resolved.'],
 ['bidSourceEventAt','facts.bid.sourceEventAt','BID SOURCE EVENT','Provider bid event time.',instantMeaning],
 ['ask','facts.ask.price','ASK','Reported ask price.',priceMeaning],
 ['askSize','facts.ask.size','ASK SIZE','Reported displayed ask size.',sizeMeaning],
 ['askVenue','facts.ask.venue','ASK VENUE','Provider-reported ask venue.','Venue is optional source text, not independently resolved.'],
 ['askSourceEventAt','facts.ask.sourceEventAt','ASK SOURCE EVENT','Provider ask event time.',instantMeaning],
 ...['open','high','low','close','previousClose'].map(name=>[name,`facts.${name}`,name==='previousClose'?'PREVIOUS CLOSE':name.toUpperCase(),`Reported ${name==='previousClose'?'previous close':name} price.`,priceMeaning+' No separate event time is supplied for this fact; do not substitute another price.']),
 ['volume','facts.volume','VOLUME','Provider-reported daily volume.','Nonnegative integer; period and unit conventions come from the source, not a Wheelwright estimate.'],
 ['reportedChange','facts.reportedChange','REPORTED CHANGE','Provider-reported absolute price change.','Signed applicable price units; not computed from last/previous close by Wheelwright.'],
 ['reportedChangePercent','facts.reportedChangePercent','CHANGE %','Provider-reported percentage-point change.','Percentage points: 0.62 means +0.62%, not 62%. Never derived from another fact.'],
 ['averageVolume','facts.averageVolume','AVERAGE VOLUME','Provider-reported average daily volume.','Nonnegative integer; averaging window is not independently established.'],
 ['fiftyTwoWeekHigh','facts.fiftyTwoWeekHigh','52 WEEK HIGH','Provider-reported 52-week high.',priceMeaning+' Source-defined range, not recomputed.'],
 ['fiftyTwoWeekLow','facts.fiftyTwoWeekLow','52 WEEK LOW','Provider-reported 52-week low.',priceMeaning+' Source-defined range, not recomputed.'],
 ['description','facts.description','DESCRIPTION','Provider-reported instrument description.','Optional source text, not a Wheelwright issuer lookup.'],
 ['exchange','facts.exchange','EXCHANGE','Provider-reported instrument exchange.','Optional source text; distinct from side-specific venues.'],
 ['observationId','observationId','OBSERVATION ID','Identity of the accepted observation.','UUID preserved from the canonical holding; distinct from HTTP correlation and acquisition identity.'],
 ['provider','provenance.provider','PROVIDER','Observation source provider.','Persisted source identity, independent of the currently active provider.'],
 ['environment','provenance.environment','ENVIRONMENT','Provider data environment.','PRODUCTION or SANDBOX; not CLI/server deployment environment.'],
 ['acquisitionId','provenance.acquisitionId','ACQUISITION ID','Accepted upstream attempt identity.','Persisted UUID; the held read creates no acquisition.'],
 ['authorityEpoch','provenance.authorityEpoch','AUTHORITY EPOCH','Acquisition authority/fencing identity.','Opaque persisted authority value, not a credential or current eligibility decision.'],
 ['acquisitionPhase','provenance.acquisitionPhase','ACQUISITION PHASE','Session classification at upstream contact.','REGULAR_USABLE, PRE_MARKET, POST_MARKET, CLOSED or UNKNOWN; not freshness, suitability or a source event time.'],
 ['regularSessionDate','provenance.regularSessionDate','REGULAR SESSION DATE','Applicable US regular-session date.','Optional canonical calendar date; never timezone-shifted or reconstructed.'],
 ['feedIdentity','provenance.feedIdentity','FEED IDENTITY','Persisted source-feed identity.','Optional source identity; do not invent a regular-session/feed label when absent.'],
 ['receivedAt','provenance.receivedAt','RECEIVED','Wheelwright evidence receipt time.',instantMeaning+' Not the market event time.'],
 ['committedAt','provenance.committedAt','COMMITTED','Canonical evidence acceptance time.',instantMeaning+' Not read/response time.'],
];
const prices = new Set(['last','bid','ask','open','high','low','close','previousClose','fiftyTwoWeekHigh','fiftyTwoWeekLow']);
const integers = new Set(['lastSize','bidSize','askSize','volume','averageVolume']);
export const SHOW_FIELDS = Object.freeze(entries.map(([name,path,heading,description,meaning]) => {
 const kind = name.endsWith('At') ? 'instant' : name === 'regularSessionDate' ? 'date'
  : name === 'reportedChangePercent' ? 'percent' : name === 'reportedChange' ? 'change'
  : prices.has(name) ? 'price' : integers.has(name) ? 'integer' : 'value';
 const valueType = ['percent','change','price','integer'].includes(kind) ? 'number'
  : kind === 'instant' || kind === 'date' ? kind : 'text';
 return Object.freeze({name,path,heading,description,
  meaning: `${meaning} ${missing} Exact filter/sort type: ${valueType}.`,
  extract:q=>path.split('.').reduce((v,k)=>v?.[k],q),kind,valueType});
}));
export const SHOW_FIELD_BY_NAME = new Map(SHOW_FIELDS.map(f=>[f.name,f]));
export const SHOW_DEFAULT = ['symbol','type','last','reportedChangePercent','bid','ask','receivedAt','provider','environment'].map(n=>SHOW_FIELD_BY_NAME.get(n));
export function showFieldManual() {return SHOW_FIELDS.map(f=>`${f.name}\n    ${f.description}\n    Source: ${f.path}. ${f.meaning}\n`).join('\n');}
