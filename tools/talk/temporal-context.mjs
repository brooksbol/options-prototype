/** Trusted runtime metadata. Calendar anchors are not brokerage observation clocks or financial findings. */
function calendar(instant,timeZone) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{
    timeZone,weekday:'long',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZoneName:'longOffset'
  }).formatToParts(instant).map(part=>[part.type,part.value]));
  const date=`${parts.year}-${parts.month}-${parts.day}`;
  const yesterday=new Date(`${date}T12:00:00Z`);yesterday.setUTCDate(yesterday.getUTCDate()-1);
  return {timeZone,date,weekday:parts.weekday,localTime:`${parts.hour}:${parts.minute}:${parts.second}`,utcOffset:parts.timeZoneName,
    today:{from:date,through:date},yesterday:{from:yesterday.toISOString().slice(0,10),through:yesterday.toISOString().slice(0,10)},
    monthToDate:{from:`${parts.year}-${parts.month}-01`,through:date,cutoffAt:instant.toISOString()}};
}
export function temporalContext({clock=()=>new Date(),operatorTimeZone=Intl.DateTimeFormat().resolvedOptions().timeZone,marketTimeZone='America/New_York'}={}) {
  const instant=clock();if(!(instant instanceof Date)||!Number.isFinite(instant.getTime()))throw new Error('Trusted clock unavailable.');
  const operator=calendar(instant,operatorTimeZone),market=calendar(instant,marketTimeZone);
  return {turnStartedAt:instant.toISOString(),operator,market,calendarDatesDiffer:operator.date!==market.date,
    defaultRelativeDateZone:'OPERATOR',qualification:'Relative calendar anchors at operator-turn start. Use the operator zone unless the operator explicitly requests the market calendar. Preserve explicit source/execution/receipt clocks separately. Backend period queries establish actual instant boundaries and coverage; current-day/month results are only through the reported cutoff.'};
}
export function temporalInstructions(context) {
  return '\nTRUSTED CURRENT TURN TIME (runtime supplied; supersedes earlier conversation date assumptions):\n'+JSON.stringify(context)+
    '\nResolve relative dates from this turn context, never a retained source date, previous answer, runtime startup date or model training date. Calendar dates and source coverage are separate. When operator/market dates differ, state the selected timezone and preserve the distinction. Do not describe a partially elapsed day/month as a completed period.';
}
