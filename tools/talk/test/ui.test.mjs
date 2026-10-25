import test from 'node:test';
import assert from 'node:assert/strict';

test('expired UI session stops submissions, preserves visible evidence and requires explicit reload', async () => {
  const elements = new Map();
  function element() {
    return { listeners: {}, children: [], value: '', disabled: false, hidden: true,
      append(...items) { this.children.push(...items); }, replaceChildren() {}, scrollIntoView() {},
      remove() {}, focus() {}, removeAttribute(name) { this[name] = false; },
      addEventListener(name, callback) { this.listeners[name] = callback; } };
  }
  const originalFetch = globalThis.fetch;
  let posts = 0;
  globalThis.document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, element()); return elements.get(id);
  }, createElement: element, createTextNode: text => ({ textContent: text }) };
  globalThis.fetch = async (_path, options) => options ? (posts++, new Response('PRIVATE-ERROR-CANARY', { status: 403 })) :
    new Response(JSON.stringify({ csrf: 'synthetic-session', tools: [] }));
  try {
    await import('../ui/app.js?expired-session');
    const evidence = element(); document.getElementById('messages').children.push(evidence);
    elements.get('message').value = 'Hello.';
    await elements.get('composer').listeners.submit({ preventDefault() {} });
    assert.equal(posts, 1);
    assert.equal(elements.get('send').disabled, true);
    assert.equal(elements.get('new').disabled, true);
    assert.equal(elements.get('message').disabled, true);
    assert.equal(elements.get('reload').hidden, false);
    assert.ok(elements.get('messages').children.includes(evidence));
    elements.get('message').value = 'Do not silently resubmit this.';
    await elements.get('composer').listeners.submit({ preventDefault() {} });
    assert.equal(posts, 1);
    assert.match(elements.get('messages').children.at(-1).children[1].children[0].textContent, /session changed or expired/);
  } finally { delete globalThis.document; globalThis.fetch = originalFetch; }
});
