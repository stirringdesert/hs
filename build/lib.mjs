// Small helpers for the site builder: front matter, a tiny Markdown subset, HTML escaping.
// No dependencies, so the build runs anywhere Node 18+ is installed.

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&(?!(#\d+|#x[0-9a-f]+|[a-z]+);)/gi, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Escape text that goes inside an attribute (always escape every &).
export function escapeAttr(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Parse a file with optional front matter:
 *   ---
 *   title: Iran Conference
 *   order: 3
 *   summary:
 *     - Premiered on Nov 22, 2019
 *   ---
 *   Body text...
 * Supports `key: value` and lists of plain values. Numbers and true/false are converted.
 */
export function parseFrontMatter(text, file = '') {
  text = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return { data: {}, body: text };
  const end = text.indexOf('\n---', 4);
  if (end === -1) throw new Error(`${file}: front matter starts with --- but never closes`);
  const head = text.slice(4, end);
  const body = text.slice(text.indexOf('\n', end + 1) + 1);
  const data = {};
  let listKey = null;
  head.split('\n').forEach((line, i) => {
    if (!line.trim() || line.trim().startsWith('#')) return;
    const item = line.match(/^\s+-\s?(.*)$/);
    if (item) {
      if (!listKey) throw new Error(`${file}: line ${i + 2} is a list item without a "key:" above it`);
      data[listKey].push(scalar(item[1]));
      return;
    }
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) throw new Error(`${file}: can't read front matter line ${i + 2}: "${line}"`);
    if (kv[2] === '') { data[kv[1]] = []; listKey = kv[1]; }
    else { data[kv[1]] = scalar(kv[2]); listKey = null; }
  });
  return { data, body };
}

function scalar(v) {
  v = v.trim();
  if (/^".*"$/.test(v) || /^'.*'$/.test(v)) return v.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}

/**
 * Inline Markdown: [text](url), **bold**, *italic*. A single line break inside a
 * paragraph becomes <br>. External links open in a new tab.
 */
export function inline(md, { linkClass = 'link' } = {}) {
  let s = escapeHtml(md);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
    const ext = /^https?:\/\//.test(url);
    const cls = linkClass ? ` class="${linkClass}"` : '';
    const dl = /^\/assets\/.*\.pdf$/i.test(url) ? ' download' : ''; // local PDFs download instead of opening
    return `<a${cls} href="${escapeAttr(url.replace(/&amp;/g, '&'))}"${ext ? ' target="_blank" rel="noopener"' : ''}${dl}>${text}</a>`;
  });
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>');
  s = s.replace(/\n/g, '<br>');
  return s;
}

/**
 * Block Markdown: paragraphs separated by blank lines, "## Heading", "### Heading".
 * Lines starting with "<" are treated as raw HTML blocks and passed through.
 */
export function markdown(md, opts = {}) {
  return md
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((block) => {
      const h = block.match(/^(#{1,4})\s+(.*)$/);
      if (h) return `<h${h[1].length}>${inline(h[2], opts)}</h${h[1].length}>`;
      if (block.trimStart().startsWith('<')) return block;
      return `<p>${inline(block, opts)}</p>`;
    });
}
