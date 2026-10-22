import {readFileSync,writeFileSync} from 'node:fs';
import {projectLive} from '../../../scripts/tastytrade-live-domain.mjs';
import {liveEvidence} from '../../../scripts/tastytrade-fixtures.mjs';
import {deriveEvaluation} from './derive-tt-examples.mjs';
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url)));
const b=read('./examples/resources.json'),r=n=>b.resources[b.names[n]].value,raw=read('./examples/source-artifact.json');
const observed=read('../../../scripts/fixtures/tt-live-economic-observed.json');observed.now=new Date(observed.now);
for(const [file,input,key] of [['tt-live-equivalence.json',liveEvidence,'live'],['tt-live-expanded-parity.json',observed,'observed']]){
 const f=read('./examples/'+file);raw.ttSource??={};raw.ttSource[key]=input;
 for(const row of f.positions){const p=projectLive(input).positions.find(p=>p.symbol===row.symbol),base={account:r('covered-call').account,artifact:b.externalReferences[2],underlying:r('parity-'+row.symbol)?.self??r('underlying').self};base.artifact={href:b.externalReferences[2].href};row.evaluation=deriveEvaluation(p,input,base,key);row.quote={optionOldestEpochMs:p.market.oldest,freshness:p.market.stale?'STALE':'CURRENT',valuationMethod:p.market.valuationSource,unit:'PER_UNDERLYING_UNIT',packageMultiplier:String(p.multiplier)};
 }
 writeFileSync(new URL('./examples/'+file,import.meta.url),JSON.stringify(f,null,2)+'\n');
}
writeFileSync(new URL('./examples/source-artifact.json',import.meta.url),JSON.stringify(raw,null,2)+'\n');
