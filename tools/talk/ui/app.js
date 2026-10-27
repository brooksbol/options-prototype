import { evidenceView } from './evidence-view.js';
// Preserve backend number lexemes; unwrap only the SDK/MCP text envelope.
export function resultText(result) {
  if (typeof result !== 'string') return String(result ?? '');
  try {
    const envelope = JSON.parse(result);
    if (envelope?.type === 'text' && typeof envelope.text === 'string') return envelope.text;
  } catch {}
  return result;
}

if (typeof document !== 'undefined') {
const $ = id => document.getElementById(id);
let csrf;
let metadataOnly = false;
async function post(path, body) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Talk-CSRF': csrf }, body: JSON.stringify(body) });
  if ([401, 403].includes(response.status)) {
    csrf = undefined;
    for (const id of ['message', 'send', 'new']) $(id).disabled = true;
    $('reload')?.removeAttribute('hidden');
    throw new Error('This preview session changed or expired. Reload to start a new conversation.');
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}
function message(role, text) {
  const article = document.createElement('article'); article.className = role;
  const label = document.createElement('h3'); label.textContent = role === 'user' ? 'YOU' : 'TALK';
  const content = document.createElement('div'); content.className = 'text';
  for (const part of text.split(/(\*\*[^*]+\*\*)/g)) {
    if (part.startsWith('**') && part.endsWith('**')) {
      const strong = document.createElement('strong'); strong.textContent = part.slice(2, -2); content.append(strong);
    } else content.append(document.createTextNode(part));
  }
  article.append(label, content); $('messages').append(article); article.scrollIntoView({ block: 'end' });
  return article;
}
try {
  const info = await fetch('/api/status').then(r => r.json()); csrf = info.csrf;
  $('profile').textContent = info.profile;
  metadataOnly = info.profile === 'Authorized real Account metadata only';
  if (info.profile === 'Authorized real retained evidence') {
    $('notice').textContent = 'Real retained Account and market evidence under existing backend permissions. Balances, positions and quotes may be historical. Reads only; no brokerage acquisition or trades. Conversation context stays local; authorized tool results reach the configured OpenAI API with tracing and response storage disabled.';
    $('footnote').textContent = 'Authorized retained-data preview · Source dates govern currentness';
  }
  if (metadataOnly) {
    $('notice').textContent = 'Real authorized Account nicknames, broker labels and count only. Do not enter holdings, balances, Account numbers or credentials. Financial tools are not admitted; each turn starts a fresh local session.';
    $('footnote').textContent = 'Restricted metadata profile · No financial-record disclosure';
  }
  $('tools').replaceChildren();
  for (const server of info.tools) for (const tool of server.tools) {
    const item = document.createElement('div'); item.className = 'tool'; item.textContent = tool.name;
    item.title = tool.description; $('tools').append(item);
  }
  $('status').textContent = metadataOnly ? 'Ready · authorized Account metadata only' : info.profile === 'Authorized real retained evidence' ? 'Ready · real retained evidence' : 'Ready · synthetic data only';
} catch { $('status').textContent = 'Connection unavailable'; }
$('composer').addEventListener('submit', async event => {
  event.preventDefault(); const text = $('message').value.trim(); if (!text || !csrf) return;
  $('welcome')?.remove(); message('user', text); $('message').value = '';
  $('send').disabled = true; $('new').disabled = true; $('status').textContent = 'Thinking with the SDK…';
  try {
    const answer = await post('/api/chat', { message: text });
    const article = message('assistant', answer.text || answer.error);
    for (const tool of answer.tools ?? []) {
      const raw = resultText(tool.result);
      const view = evidenceView(raw);
      const card = document.createElement('section'); card.className = 'evidence-card';
      if (view.balanceSummary) {
        card.classList.add('balance-card');
        const balance = view.balanceSummary;
        const title = document.createElement('h3'); title.textContent = balance.title; card.append(title);
        const subtitle = document.createElement('p'); subtitle.className = 'balance-source'; subtitle.textContent = balance.subtitle; card.append(subtitle);
        const badge = document.createElement('span'); badge.className = 'balance-badge'; badge.textContent = balance.badge; card.append(badge);
        const facts = document.createElement('div'); facts.className = 'balance-facts';
        for (const fact of balance.facts) {
          const row = document.createElement('div');
          const label = document.createElement('span'); label.textContent = fact.label;
          const amount = document.createElement('strong'); amount.textContent = fact.value;
          row.append(label,amount); facts.append(row);
        }
        card.append(facts);
        const note = document.createElement('p'); note.className = 'evidence-notes'; note.textContent = balance.note; card.append(note);
        const details = document.createElement('details');
        const summary = document.createElement('summary'); summary.textContent = 'Historical source details'; details.append(summary);
        let loaded = false;
        details.addEventListener('toggle',()=>{
          if (!details.open || loaded) return;
          loaded = true;
          const list = document.createElement('dl');
          for (const [label,value] of balance.details) {
            const key = document.createElement('dt'); key.textContent = label;
            const cell = document.createElement('dd'); cell.textContent = value; list.append(key,cell);
          }
          details.append(list);
        });
        card.append(details);
      } else {
        const title = document.createElement('h4'); title.textContent = tool.isError ? 'Backend problem' : 'Backend findings'; card.append(title);
        const table = document.createElement('dl');
        for (const [label,value] of view.rows) {
          const key = document.createElement('dt'); key.textContent = label;
          const cell = document.createElement('dd'); cell.textContent = value; table.append(key,cell);
        }
        card.append(table);
        const notes = document.createElement('p'); notes.className = 'evidence-notes'; notes.textContent = view.qualifications.join(' · '); card.append(notes);
        const details = document.createElement('details');
        const summary = document.createElement('summary'); summary.textContent = 'Source details'; details.append(summary);
        let loaded = false;
        details.addEventListener('toggle',()=>{if(details.open&&!loaded){loaded=true;const pre=document.createElement('pre');pre.textContent=raw;details.append(pre);}});
        card.append(details);
      }
      article.insertBefore(card, article.querySelector('.text'));

    }
    if (answer.tools?.length) {
      const label = document.createElement('h4'); label.className = 'commentary-label'; label.textContent = 'Talk’s analysis';
      article.insertBefore(label, article.querySelector('.text'));
    }
    $('status').textContent = answer.error ? 'Commentary failed · completed results retained' : (metadataOnly ? 'Ready · fresh local session each turn' : 'Ready · local context retained');
  } catch (error) { message('assistant', error.message); $('status').textContent = 'Request failed'; }
  finally { $('send').disabled = !csrf; $('new').disabled = !csrf; if (csrf) $('message').focus(); }
});
$('message').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('composer').requestSubmit(); }
});
$('new').addEventListener('click', async () => {
  try { await post('/api/reset', {}); $('messages').replaceChildren(); $('status').textContent = 'New conversation · local history cleared'; $('message').focus(); }
  catch (error) { $('status').textContent = error.message; }
});
$('reload')?.addEventListener('click', () => location.reload());
}
