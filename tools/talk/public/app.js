const $ = id => document.getElementById(id);
let csrf;
async function post(path, body) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Talk-CSRF': csrf }, body: JSON.stringify(body) });
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
      const details = document.createElement('details'); details.open = true;
      const summary = document.createElement('summary'); summary.textContent = `Fixture result · ${tool.name}`;
      const pre = document.createElement('pre');
      let value = tool.result;
      for (let i = 0; i < 3; i++) {
        try { value = JSON.parse(typeof value === 'string' ? value : value.type === 'text' ? value.text : ''); }
        catch { break; }
      }
      pre.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      details.append(summary, pre); article.append(details);
    }
    $('status').textContent = answer.error ? 'Commentary failed · completed results retained' : 'Ready · local context retained';
  } catch (error) { message('assistant', error.message); $('status').textContent = 'Request failed'; }
  finally { $('send').disabled = false; $('new').disabled = false; $('message').focus(); }
});
$('message').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('composer').requestSubmit(); }
});
$('new').addEventListener('click', async () => {
  try { await post('/api/reset', {}); $('messages').replaceChildren(); $('status').textContent = 'New conversation · local history cleared'; $('message').focus(); }
  catch (error) { $('status').textContent = error.message; }
});
