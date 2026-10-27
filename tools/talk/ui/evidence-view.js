// Presentation only: exact source lexemes and backend units/statuses; no financial arithmetic.
export function evidenceView(raw) {
  let value;
  try { value = JSON.parse(raw, (_key, item, context) => typeof item === 'number'
    ? { lexeme: context?.source ?? null } : item); }
  catch { return { rows: [['Result', raw]], qualifications: [] }; }
  const text = item => item == null ? 'Unavailable' : typeof item === 'object'
    ? Object.hasOwn(item, 'lexeme') ? item.lexeme ?? 'Inspect exact source' : 'Inspect source' : String(item);
  const rows = [], qualifications = [];
  const add = (label, item, unit) => rows.push([label, text(item) + (unit ? ` · ${unit}` : '')]);
  if (Array.isArray(value.accounts)) {
    for (const account of value.accounts) {
      add(account.nickname, account.broker);
      if (Array.isArray(account.holdings)) {
        add(`${account.nickname} inventory read`, account.complete ? 'Complete retained read' : 'Incomplete or restricted');
        qualifications.push(...(account.warnings ?? []).map(w => w.code));
        for (const problem of account.problems ?? []) add(`${account.nickname} access`, problem.code === 'FORBIDDEN' ? 'Holdings access denied' : problem.title ?? problem.code);
        for (const holding of account.holdings) {
          add(`${account.nickname} · ${holding.sourceInstrument?.identifier ?? 'Instrument unavailable'}`, holding.quantity,
            [holding.unit, holding.side].filter(Boolean).join(' · '));
          add('Source date', holding.observedAt ?? holding.observationDate);
        }
        if (account.complete && !account.holdings.length) add(`${account.nickname} holdings`, 'No retained rows returned; live custody not established');
      }
    }
    if (value.count !== undefined) add('Authorized Account count', value.count);
    qualifications.push('Authorized visibility; not proof of ownership or complete brokerage coverage.');
  }
  if (value.outcome) add('Read outcome', value.outcome);
  if (value.code) { add('Problem', value.code); add('Status', value.status); }
  const source = value.evidence?.source ?? value.evidence;
  if (source?.subject) {
    add('Subject', source.subject.symbol); add('Instrument type', source.subject.securityType);
    for (const side of ['bid', 'ask', 'last']) if (source.facts?.[side]) {
      add(`${side} price`, source.facts[side].price, 'source price units');
      add(`${side} displayed size`, source.facts[side].size, 'source units, not guaranteed depth');
      add(`${side} source event time`, source.facts[side].sourceEventAt);
    }
    for (const key of ['volume', 'averageVolume']) add(key, source.facts?.[key], 'provider-reported');
    add('Provider', source.provenance?.provider); add('Source environment', source.provenance?.environment);
    add('Received', source.provenance?.receivedAt);
    qualifications.push('Retained evidence; receipt time is not observation time or proof of currentness. Currency/size units are not inferred.');
  }
  for (const position of value.evidence?.items ?? []) {
    if (!position.evaluation) continue;
    add('Position lifecycle status', position.state);
    for (const holding of position.included?.holdings ?? []) {
      add('Observed instrument', holding.sourceInstrument?.identifier);
      add('Observed quantity', holding.quantity, holding.unit);
      add('Observation date', holding.observationDate);
      for (const key of ['reportedMarketValue', 'reportedOpenPl']) {
        const metric = holding[key];
        if (metric) add(key, metric.value, [metric.currency ?? metric.unit, metric.status, metric.method].filter(Boolean).join(' · '));
      }
    }
    for (const key of ['marketValue', 'realizedNetPl', 'netUnrealizedPl']) {
      const metric = position.evaluation[key];
      if (metric) add(key, metric.value, [metric.currency ?? metric.unit, metric.status].filter(Boolean).join(' · '));
    }
    qualifications.push(...(position.warnings ?? []).map(warning => warning.code));
  }
  for (const observation of value.evidence?.observations ?? []) {
    if (!Array.isArray(observation.fields)) continue;
    add('Balance Account', value.account?.nickname);
    add('Balance broker', observation.broker);
    add('Source environment', observation.environment);
    add('Observed', observation.source?.observedAt);
    add('Observation date', observation.source?.observationDate);
    add('Exported', observation.source?.exportedAt);
    add('Received', observation.source?.receivedAt);
    for (const field of observation.fields)
      add(field.brokerField, field.value, [observation.currency ?? observation.unit, field.status].filter(Boolean).join(' · '));
  }
  qualifications.push(...(value.evidence?.qualifications ?? []));
  if (value.evidence?.measurements) for (const [name, metric] of Object.entries(value.evidence.measurements))
    add(name, metric.value, [metric.unit, metric.status].filter(Boolean).join(' · '));
  if (!rows.length) rows.push(['Evidence', 'Detailed source is available below.']);
  for (const field of ['qualification', 'sourceQualification', 'scope']) if (value[field]) qualifications.push(value[field]);
  if (value.dataClassification) qualifications.unshift(value.dataClassification);
  return { rows, qualifications: [...new Set(qualifications)] };
}
