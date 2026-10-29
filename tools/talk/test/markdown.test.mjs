import test from 'node:test';
import assert from 'node:assert/strict';
import {renderMarkdown} from '../ui/markdown.js';

test('conversation headings, tables, lists, code and emphasis become semantic HTML',()=>{
 const html=renderMarkdown('### `fixture` — Fidelity\n\nSource date: **October 19, 2026**.\n\n| Instrument | Side | Quantity |\n|---|---|---|\n| FIXTURE | Long | 100 shares |\n\n### Other Accounts\n- `restricted`: **Holdings access denied (403)**.\n\n1. First\n2. Second\n\n```text\nexample\n```');
 for(const tag of ['h3','code','strong','table','thead','tbody','ul','ol','pre'])assert.match(html,new RegExp('<'+tag+'[ >]'));
 assert.doesNotMatch(html,/###|\|---/);assert.match(html,/100 shares/);assert.match(html,/Holdings access denied \(403\)/);
});
test('model Markdown cannot create active HTML, remote images, scripts or links',()=>{
 const html=renderMarkdown('<script>alert(1)</script>\n<img src="https://private.example/track" onerror="alert(1)">\n\n![private](https://private.example/track)\n[click](javascript:alert(1))\n[click](https://private.example/)\n<https://private.example/>\n\n&lpar; **0.00** <iframe src="/api/status"></iframe>');
 assert.doesNotMatch(html,/<(?:script|img|iframe|a)\b/i);assert.match(html,/&lt;script&gt;/);assert.match(html,/<strong>0.00<\/strong>/);
});

test('empty placeholder tables do not render, while unavailable rows with meaningful labels survive',()=>{
 assert.equal(renderMarkdown('| Trade | Closed | Net P/L |\n|---|---|---|\n| | | |\n| — | — | — |\n| | | |\n| | | |\n| | | |').trim(),'');
 assert.match(renderMarkdown('| Trade | P/L |\n|---|---|\n| ABC | — |'),/<table>/);
 assert.match(renderMarkdown('Result unavailable.\n\n| Trade | P/L |\n|---|---|\n| | |'),/Result unavailable/);
 assert.doesNotMatch(renderMarkdown('Result unavailable.\n\n| Trade | P/L |\n|---|---|\n| | |'),/<table>/);
});

test('decoded entity and format-only empty tables disappear with their orphan analysis heading',()=>{
 const empty='### Analysis\n\n| A | B | C | D | E | F |\n|---|---|---|---|---|---|\n| &nbsp; | &#160; | &#x200B; | **&nbsp;** | ` ` | &#x2060; |';
 assert.equal(renderMarkdown(empty).trim(),'');
 assert.match(renderMarkdown('| Name | Value |\n|---|---|\n| ZERO | 0 |'),/>0<\/td>/);
 assert.match(renderMarkdown('### Note\n\nMeaningful explanation.\n\n|A|B|\n|-|-|\n|&nbsp;|&#160;|'),/Meaningful explanation/);
});
