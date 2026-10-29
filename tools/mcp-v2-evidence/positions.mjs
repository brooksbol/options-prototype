import { canonicalAccountId } from '../../scripts/ww-accounts.mjs';
import { UUID, readBackend, problemResult } from './backend.mjs';

// One monotonic resource-read budget stays below the enclosing45second MCP budget.
function resourceBudget(config){const end=performance.now()+(config.timeoutMs??40000);return()=>{const remaining=Math.floor(end-performance.now());if(remaining<=0)throw new Error('Position evidence deadline exceeded.');return{...config,timeoutMs:remaining};};}

// Resolve a nickname through authenticated backend discovery; never infer ownership/grants.
export async function inspectPositions({ account, state, cursor, projection = 'tactical', includeInactive = false }, config) {
  const resourceConfig=resourceBudget(config);
  const inventory = await readBackend('/v2/accounts', config);
  if (inventory.error) return problemResult(inventory.error);
  if (inventory.data?.requestId !== inventory.requestId || !Array.isArray(inventory.data.accounts))
    throw new Error('Invalid authorized Account discovery.');
  const matches = inventory.data.accounts.filter(item => item.alias === account);
  if (matches.length !== 1) return { isError: true, content: [{ type: 'text', text: JSON.stringify({
    outcome: 'unavailable', requestId: inventory.requestId,
    explanation: 'Exact Account nickname unavailable in authenticated discovery; no Position read performed.',
    availableAccounts: inventory.data.accounts.map(item => ({ nickname: item.alias, broker: item.brokerAssociation?.broker })) }) }] };
  const selected = matches[0];
  if (!canonicalAccountId(selected.id)) throw new Error('Invalid canonical Account ID.');
  if(!['tactical','expanded'].includes(projection))throw new Error('Unsupported Position projection.');
  const query = new URLSearchParams({ accountId: selected.id, projection, limit: '5' });
  if(projection==='expanded')query.set('include','currentConstruction,holdingSummaries');
  if(!includeInactive&&state===undefined)query.set('exposureStatus','OBSERVED,UNKNOWN,RETAINED,UNRECORDED_NONCLOSED');
  if (state !== undefined) query.set('state', state);
  if (cursor !== undefined) query.set('cursor', cursor);
  const result = await readBackend('/v2/positions?' + query, resourceConfig());
  if (result.error) return problemResult(result.error);
  if (!Array.isArray(result.data?.items) || result.data.items.some(item => !UUID.test(item.id ?? '') ||
      item.account?.href !== '/v2/accounts/' + selected.id)) throw new Error('Invalid Position scope.');
  let nextCursor = null;
  if (result.data.next != null) {
    const next = new URL(result.data.next.href, config.base);
    if (next.origin !== new URL(config.base).origin || next.pathname !== '/v2/positions' ||
        next.searchParams.get('accountId') !== selected.id || !next.searchParams.get('cursor'))
      throw new Error('Invalid Position continuation scope.');
    for(const [key,value]of query)if(key!=='cursor'&&next.searchParams.get(key)!==value)throw new Error('Position continuation changed selectors.');
    nextCursor = next.searchParams.get('cursor');
  }
  return { content: [{ type: 'text', text: JSON.stringify({ requestId: result.requestId, nextCursor,
    ...(config.syntheticFixture ? { dataClassification: 'SYNTHETIC_FIXTURE',
      sourceQualification: 'Invented development records, not real brokerage holdings or live provider data. Broker environment labels describe the simulated source.' } : {}),
    account: { nickname: selected.alias, broker: selected.brokerAssociation?.broker },
    qualification: 'Current monitoring scope explicitly selects OBSERVED,UNKNOWN,RETAINED,UNRECORDED_NONCLOSED exposure predicates (UNRECORDED_NONCLOSED means missing exposure on a non-CLOSED lifecycle, not established custody) unless inactive or explicit lifecycle evidence is requested; this is not an OPEN lifecycle assumption. Compact tactical results copy backend evaluations; candidate Model matches do not establish opening occurrence, governed capital or CSP collateral. Backend Position read from its selected Account evaluation graph, not an inventory of all history or independent held market quotes. Missing linked market evidence does not prove that no separate retained quote exists. Missing historical fields do not prove no other historical source exists. Preserve financial statuses, missing values, source dates and warnings. A holdings observation is not proof of an opening transaction, current fill, or trading recommendation. If nextCursor is non-null this page is incomplete; repeat with the same Account/state and that opaque cursor. Backend OPEN/CLOSED state is lifecycle, not proof of current custody or freshness.',
    evidence: result.data }) }] };
}

// Exact, deliberate single-Position evidence inspection; never an Account history dump.
export async function inspectPositionDetails({account,positionId},config){
 const resourceConfig=resourceBudget(config);
 if(!UUID.test(positionId??''))throw new Error('Canonical Position ID required.');
 const inventory=await readBackend('/v2/accounts',config);if(inventory.error)return problemResult(inventory.error);
 if(inventory.data?.requestId!==inventory.requestId||!Array.isArray(inventory.data.accounts))throw new Error('Invalid Account discovery.');
 const matches=inventory.data.accounts.filter(a=>a.alias===account);if(matches.length!==1||!canonicalAccountId(matches[0].id))return {isError:true,content:[{type:'text',text:'Exact authorized Account nickname required.'}]};
 const selected=matches[0],path='/v2/positions/'+positionId,result=await readBackend(path,resourceConfig());if(result.error)return problemResult(result.error,account);
 if(result.data?.self?.href!==path||result.data.account?.href!=='/v2/accounts/'+selected.id)throw new Error('Invalid Position detail scope.');
 const href=result.data.currentConstruction?.href;if(typeof href!=='string'||!href.startsWith('/v2/constructions/')||!UUID.test(href.slice('/v2/constructions/'.length)))throw new Error('Invalid Construction reference.');
 const construction=await readBackend(href,resourceConfig());if(construction.error)return problemResult(construction.error,account);
 if(construction.data?.self?.href!==href||construction.data.position?.href!==path||construction.data.account?.href!=='/v2/accounts/'+selected.id)throw new Error('Invalid Construction detail scope.');
 return {content:[{type:'text',text:JSON.stringify({requestId:result.requestId,account:{nickname:selected.alias,broker:selected.brokerAssociation?.broker},evidence:result.data,construction:construction.data,qualification:'Exact selected Position and its current immutable Construction, under backend permissions. Detail is not complete Account history or proof of current custody. Preserve source clocks, unknowns and qualifications.'})}]};
}
