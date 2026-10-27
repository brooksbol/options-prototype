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
  let balanceSummary;
  if (Array.isArray(value.evidence?.observations)) {
    const evidence = value.evidence, selection = evidence.selection ?? {};
    const observation = evidence.observations.length === 1 ? evidence.observations[0] : undefined;
    const fields = observation?.fields ?? [];
    const byName = key => fields.find(f => f.brokerField === key);
    const money = field => {
      if (!field || field.status !== 'REPORTED') return 'Unavailable';
      if (field.reportedDisplay?.includes('$')) return field.reportedDisplay;
      const exact = text(field.value);
      const [whole,fraction] = exact.split('.');
      return observation.currency === 'USD' ? '$' + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction === undefined ? '' : '.' + fraction) : exact;
    };
    const requested = observation?.broker === 'TASTYTRADE' ? [
      ['Options buying power','derivative-buying-power'], ['Equity buying power','equity-buying-power'],
      ['Settled cash','cash-balance'], ['Maintenance requirement','maintenance-requirement']
    ] : [
      ['Available without additional margin impact','Available without margin impact'],
      ...([['Reported margin debit','Margin debit'], ['Reported margin credit','Margin credit'],
        ['Margin credit/debit · reported','Margin credit/debit']].filter(([,key]) => byName(key))),
      ['Options collateral reserved', byName('Cash reserved for options strategies') ? 'Cash reserved for options strategies' : 'Cash reserved for options'],
      ['Settled cash','Settled cash']
    ];
    const source = observation?.source;
    const at = source?.exportedAt ?? source?.observedAt;
    const day = at?.slice(0,10);
    const date = day ? new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z')) : 'Source time unavailable';
    const historical = day && day < (selection.readAt ?? new Date().toISOString()).slice(0,10);
    balanceSummary = {
      title: `${value.account?.nickname ?? 'Account'} · Margin & buying power`,
      subtitle: `${observation?.broker ?? value.account?.broker ?? ''} · Retained balance from ${date}`,
      badge: historical ? 'Historical' : 'Retained · currentness unverified',
      facts: observation ? requested.slice(0,6).map(([label,key]) => ({label,value:money(byName(key)),status:byName(key)?.status ?? 'MISSING'})) : [],
      note: observation ? `This is retained evidence, not today's buying power. ${selection.mode === 'latest-source' ? 'Latest known source time' : 'Selected source time'}: ${date}. ${selection.mode !== 'latest-source' ? 'Exact artifact read; later Account sources were not compared.' : text(selection.unknownSourceTimeCount) !== '0' && selection.unknownSourceTimeCount != null ? 'Some retained source times are unknown; chronology is incomplete.' : 'No later source-dated balance is retained.'}` :
        `No single qualified balance selected (${selection.status ?? 'unscoped history'}). No financial amount established.${selection.latestKnownSourceTime ? ' Latest known source time: ' + selection.latestKnownSourceTime + '.' : ''}`,
      details: [
        ['Selection',selection.status], ['Selected source time',selection.selectedSourceTime],
        ['Latest known source time',selection.latestKnownSourceTime], ['Requested source at or after',selection.sourceAtOrAfter],
        ['Unknown source clocks',selection.unknownSourceTimeCount], ['Read at',selection.readAt],
        ['Observed',source?.observedAt], ['Exported',source?.exportedAt], ['Received',source?.receivedAt],
        ['Source artifact',source?.artifactId], ['Source SHA-256',source?.sha256],
        ...fields.map(field => [field.brokerField,`${money(field)} · ${field.status} · ${field.sourceLocator ?? 'source location unavailable'}`])
      ].filter(([,item]) => item !== undefined && item !== null).map(([label,item]) => [label,text(item)])
    };
  }
  qualifications.push(...(value.evidence?.qualifications ?? []));
  if (value.evidence?.measurements) for (const [name, metric] of Object.entries(value.evidence.measurements))
    add(name, metric.value, [metric.unit, metric.status].filter(Boolean).join(' · '));
  if (!rows.length) rows.push(['Evidence', 'Detailed source is available below.']);
  for (const field of ['qualification', 'sourceQualification', 'scope']) if (value[field]) qualifications.push(value[field]);
  if (value.dataClassification) qualifications.unshift(value.dataClassification);
  return { rows, qualifications: [...new Set(qualifications)], ...(balanceSummary ? {balanceSummary} : {}) };
}
