// Bundled locally; model text cannot introduce HTML, images or active links.
import MarkdownIt from '../node_modules/markdown-it/dist/browser/markdown-it.esm.min.mjs';

const markdown = new MarkdownIt({ html: false, breaks: true, linkify: false, typographer: false });
markdown.disable(['image', 'link', 'autolink']);
export function renderMarkdown(text) {
  const tokens=markdown.parse(String(text??''),{});
  for(let i=0;i<tokens.length;i++) {
    if(tokens[i].type!=='table_open')continue;
    let end=i+1;while(end<tokens.length&&tokens[end].type!=='table_close')end++;
    let body=false,meaningful=false;
    for(const token of tokens.slice(i,end)){if(token.type==='tbody_open')body=true;if(body&&token.type==='inline'&&token.content.replace(/[\s\u00a0\u200b—–\-_*`]/g,''))meaningful=true;}
    if(!meaningful){tokens.splice(i,end-i+1);i--;}
  }
  return markdown.renderer.render(tokens,markdown.options,{});
}
