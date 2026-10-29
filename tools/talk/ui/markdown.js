// Bundled locally; model text cannot introduce HTML, images or active links.
import MarkdownIt from '../node_modules/markdown-it/dist/browser/markdown-it.esm.min.mjs';

const markdown = new MarkdownIt({ html: false, breaks: true, linkify: false, typographer: false });
markdown.disable(['image', 'link', 'autolink']);
export function renderMarkdown(text) {
  const tokens=markdown.parse(String(text??''),{});let removedEmptyTable=false;
  for(let i=0;i<tokens.length;i++) {
    if(tokens[i].type!=='table_open')continue;
    let end=i+1;while(end<tokens.length&&tokens[end].type!=='table_close')end++;
    let body=false,meaningful=false;
    for(const token of tokens.slice(i,end)){if(token.type==='tbody_open')body=true;if(body&&token.type==='inline'&&(token.children??[token]).map(child=>['text','code_inline','inline'].includes(child.type)?child.content:'').join('').replace(/[\p{White_Space}\p{Cf}—–\-_*`]/gu,''))meaningful=true;}
    if(!meaningful){removedEmptyTable=true;tokens.splice(i,end-i+1);i--;}
  }
  // Suppress orphan headings left by removed empty tables; meaningful paragraphs/code survive.
  if(removedEmptyTable)for(let i=tokens.length-3;i>=0;i--)if(tokens[i]?.type==='heading_open'&&tokens[i+2]?.type==='heading_close'&&i+3===tokens.length)tokens.splice(i,3);
  return markdown.renderer.render(tokens,markdown.options,{});
}
