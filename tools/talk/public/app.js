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
  $('tools').replaceChildren();
  for (const server of info.tools) for (const tool of server.tools) {
    const item = document.createElement('div'); item.className = 'tool'; item.textContent = tool.name;
    item.title = tool.description; $('tools').append(item);
  }
  $('status').textContent = 'Ready · synthetic data only';
} catch { $('status').textContent = 'Connection unavailable'; }
$('composer').addEventListener('submit', async event => {
  event.preventDefault(); const text = $('message').value.trim(); if (!text || !csrf) return;
  $('welcome')?.remove(); message('user', text); $('message').value = '';
  $('send').disabled = true; $('new').disabled = true; $('status').textContent = 'Thinking with the SDK…';
  try {
    const answer = await post('/api/chat', { message: text });
    const article = message('assistant', answer.text || answer.error);
    for (const tool of answer.tools ?? []) {
      const details = document.createElement('details');
      details.open = !!answer.error || (tool.result?.length ?? 0) < 2000;
      const summary = document.createElement('summary'); summary.textContent = `${tool.isError ? 'Backend problem' : 'Backend result'} · synthetic · ${tool.name}`;
      const pre = document.createElement('pre');
      pre.textContent = resultText(tool.result);
      details.append(summary, pre); article.insertBefore(details, article.querySelector('.text'));
    }
    $('status').textContent = answer.error ? 'Commentary failed · completed results retained' : 'Ready · local context retained';
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
