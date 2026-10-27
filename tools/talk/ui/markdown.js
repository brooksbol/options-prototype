// Bundled locally; model text cannot introduce HTML, images or active links.
import MarkdownIt from '../node_modules/markdown-it/dist/browser/markdown-it.esm.min.mjs';

const markdown = new MarkdownIt({ html: false, breaks: true, linkify: false, typographer: false });
markdown.disable(['image', 'link', 'autolink']);
export function renderMarkdown(text) {
  return markdown.render(String(text ?? ''));
}
