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
