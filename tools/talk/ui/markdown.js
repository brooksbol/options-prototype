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
    for(const token of tokens.slice(i,end)){if(token.type==='tbody_open')body=true;if(body&&token.type==='inline'&&(token.children??[token]).some(child=>child.type==='code_inline'?child.content.replace(/[\p{White_Space}\p{Cf}]/gu,''):['text','inline'].includes(child.type)&&child.content.replace(/[\p{White_Space}\p{Cf}—–\-_*`]/gu,'')))meaningful=true;}
    if(!meaningful){removedEmptyTable=true;tokens.splice(i,end-i+1);i--;}
  }
  // Remove structurally empty paragraphs/list items, including decoded entities and nested empty lists.
  const meaningful=token=>token.type==='code_inline'?token.content.replace(/[\p{White_Space}\p{Cf}]/gu,'').length>0:token.type==='inline'?(token.children??[]).some(meaningful):token.type==='text'?token.content.replace(/[\p{White_Space}\p{Cf}—–\-_*`]/gu,'').length>0:['fence','code_block'].includes(token.type)?token.content.trim().length>0:false;
  for(let i=tokens.length-1;i>=0;i--){
    if(!['paragraph_open','list_item_open','bullet_list_open','ordered_list_open'].includes(tokens[i].type))continue;
    let depth=1,end=i+1;while(end<tokens.length){depth+=tokens[end].nesting;if(depth===0)break;end++;}
    if(!tokens.slice(i+1,end).some(meaningful)){tokens.splice(i,end-i+1);removedEmptyTable=true;}
  }
  // An empty section can precede another real section; heading text is not section body.
  if(removedEmptyTable)for(let i=tokens.length-3;i>=0;i--)if(tokens[i]?.type==='heading_open'){
    const level=Number(tokens[i].tag.slice(1));let end=i+3;
    while(end<tokens.length&&!(tokens[end].type==='heading_open'&&Number(tokens[end].tag.slice(1))<=level))end++;
    let body=false;for(let j=i+3;j<end;j++){if(tokens[j].type==='heading_open'){j+=2;continue;}if(meaningful(tokens[j])){body=true;break;}}
    if(!body)tokens.splice(i,3);
  }
  return markdown.renderer.render(tokens,markdown.options,{});
}
