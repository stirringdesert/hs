#!/usr/bin/env node
// Builds every HTML page of harrysergeev.com from the content/ folder.
//
//   node build/build.mjs            write pages into the site folder (next to assets/)
//   node build/build.mjs --check    build in memory and report problems, write nothing
//
// See README.md for how the content files work.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontMatter, markdown, inline, escapeHtml as esc, escapeAttr as attr } from './lib.mjs';
import * as C from './components.mjs';
import { styleguide } from './styleguide.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const MANIFEST = path.join(ROOT, 'build', 'generated-files.txt');
const CHECK = process.argv.includes('--check');

const problems = [];
const pages = new Map(); // output path (relative, e.g. "theater/index.html") -> html

const readText = (p) => fs.readFileSync(path.join(CONTENT, p), 'utf8');
const readJson = (p) => {
  try { return JSON.parse(readText(p)); }
  catch (e) { throw new Error(`content/${p} is not valid JSON: ${e.message}`); }
};

// Make sure files that pages point to (images, videos, audio) exist.
function needAsset(url, where) {
  if (!url || /^(https?:|mailto:)/.test(url) || !url.startsWith('/assets/')) return;
  if (!fs.existsSync(path.join(ROOT, url))) problems.push(`${where}: file not found: ${url}`);
}
function need(value, field, where) {
  if (value === undefined || value === '' || value === null) problems.push(`${where}: "${field}" is missing`);
}

function emit(urlPath, html) {
  const rel = urlPath.replace(/^\//, '') + 'index.html';
  pages.set(rel, html);
}

const site = readJson('site.json');

// ---------- Home ----------
emit('/', C.layout(site, {
  path: '/',
  bodyClass: 'home',
  chrome: false,
  before: '  ' + C.clock(),
  main: `<a class="home-name" href="/">${esc(site.name)}</a>
<nav class="home-nav" aria-label="Main">
${site.nav.map((n) => `  <a href="${attr(n.url)}">${esc(n.label)}</a>`).join('\n')}
</nav>`,
}));

// ---------- Bio ----------
{
  const { data, body } = parseFrontMatter(readText('bio.md'), 'content/bio.md');
  need(data.title, 'title', 'content/bio.md');
  needAsset(data.photo, 'content/bio.md');
  const photo = data.photo
    ? `<div class="bio-photo"><img src="${attr(data.photo)}" alt="${attr(data.photo_alt || site.name)}" width="${data.photo_width || 1024}" height="${data.photo_height || 1536}"></div>\n`
    : '';
  emit('/bio/', C.layout(site, {
    path: '/bio/', title: 'Bio', bodyClass: 'bio',
    main: `${photo}<div class="bio-text">
  ${C.pageTitle(data.title)}
${markdown(body).map((b) => '  ' + b).join('\n')}
</div>`,
  }));
}

// ---------- Voice ----------
{
  const v = readJson('voice.json');
  const where = 'content/voice.json';
  needAsset(v.demo?.file, where);
  (v.roles || []).forEach((r, i) => {
    need(r.character, 'character', `${where} role #${i + 1}`);
    need(r.title, 'title', `${where} role #${i + 1}`);
    need(r.image, 'image', `${where} role #${i + 1}`);
    needAsset(r.image, `${where} role #${i + 1} (${r.character})`);
  });
  const cta = inline(v.cta, { linkClass: 'accent' });
  const parts = [
    C.label(cta),
    C.pageTitle(v.demo.title),
    C.player(v.demo.file),
    '',
    C.pageTitle(v.works_title, 'works-title'),
    C.label(esc(v.works_label)),
    C.workGrid(v.roles),
  ];
  if (v.audiobooks) {
    parts.push('', `<section class="audiobooks">
  ${C.label(esc(v.audiobooks.label))}
  <div class="text">
${v.audiobooks.text.map((t) => `    <p>${inline(t, { linkClass: 'accent' })}</p>`).join('\n')}
  </div>
</section>`);
  }
  parts.push('', C.label(cta, { extraClass: 'bottom-cta' }));
  emit('/voice/', C.layout(site, { path: '/voice/', title: 'Voice acting', bodyClass: 'voice', main: parts.join('\n') }));
}

// ---------- Theater + playwriting ----------
function loadSection(dir) {
  const folder = path.join(CONTENT, dir);
  return fs.readdirSync(folder)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && !/\.[a-z]{2}\.md$/.test(f)) // x.ru.md = translation
    .map((f) => {
      const slug = f.replace(/\.md$/, '');
      const where = `content/${dir}/${f}`;
      if (!/^[a-z0-9-]+$/.test(slug)) problems.push(`${where}: file name should be lowercase letters, numbers and dashes only`);
      const { data, body } = parseFrontMatter(fs.readFileSync(path.join(folder, f), 'utf8'), where);
      need(data.title, 'title', where);
      needAsset(data.video, where);
      if (data.hidden) return null;
      return {
        slug,
        url: `/${dir}/${slug}/`,
        title: data.title,
        order: data.order ?? 999,
        video: data.video,
        summaryHtml: (data.summary || []).map((s) => inline(String(s))),
        linksHtml: (data.links || []).map((s) => inline(String(s), { linkClass: '' })).join(''),
        bodyHtml: markdown(body),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

const sectionItems = {};
for (const [dir, cfg] of Object.entries(site.sections)) {
  const items = loadSection(dir);
  sectionItems[dir] = items;
  if (cfg.has_index) {
    emit(`/${dir}/`, C.layout(site, {
      path: `/${dir}/`, title: cfg.page_title, bodyClass: 'theater',
      main: `${C.pageTitle(cfg.title)}\n${C.split(C.workList(items, null))}`,
    }));
  }
  for (const it of items) {
    emit(it.url, C.layout(site, {
      path: it.url, title: it.title, bodyClass: 'theater',
      before: it.video ? C.bgVideo(it.video) : '',
      main: `${C.pageTitle(cfg.title)}\n${C.split(C.workList(items, it.slug), C.detail(it.bodyHtml))}`,
    }));
  }
}

// ---------- Contact ----------
emit('/contact/', C.layout(site, {
  path: '/contact/', title: 'Contact', bodyClass: 'contact',
  main: `${C.label(esc(site.contact.label), { tag: 'h1' })}
<div class="contact-list">
${site.contact.links.map((l) => {
    if (l.copy) return '  ' + C.copyEmail(l.copy, { label: l.short || 'E-mail' });
    const ext = /^https?:/.test(l.url);
    const text = l.short
      ? `<span class="long">${esc(l.label)}</span><span class="short">${esc(l.short)}</span>`
      : esc(l.label);
    return `  <a href="${attr(l.url)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
  }).join('\n')}
</div>`,
}));

// ---------- Free-form HTML pages (legal pages, play text) ----------
for (const f of fs.readdirSync(path.join(CONTENT, 'pages')).filter((f) => f.endsWith('.html'))) {
  const slug = f.replace(/\.html$/, '');
  const { data, body: raw } = parseFrontMatter(readText(`pages/${f}`), `content/pages/${f}`);
  let body = raw;
  let bodyClass = data.body_class || 'page';
  if (data.pdf) {
    // Play pages: download button next to the last line of the play (desktop)
    needAsset(data.pdf, `content/pages/${f}`);
    const label = data.pdf_label || 'Download PDF';
    const last = body.lastIndexOf('</div>');
    body = body.slice(0, last) + '  ' + C.playDownload(data.pdf, label, { end: true }) + '\n' + body.slice(last);
    if (data.play) {
      // On top: the play's playwriting section in the page's language, with the
      // read links replaced by the download button
      const [dir, playSlug] = data.play.split('/');
      const cfg = site.sections[dir];
      const lang = data.lang || 'en';
      const tFile = path.join(CONTENT, dir, `${playSlug}.${lang}.md`);
      const t = fs.existsSync(tFile) ? parseFrontMatter(fs.readFileSync(tFile, 'utf8'), tFile) : null;
      const items = (sectionItems[dir] || []).map((it) => {
        if (it.slug !== playSlug) return it;
        const tr = t ? {
          title: t.data.title || it.title,
          summaryHtml: (t.data.summary || []).map((x) => inline(String(x))),
          bodyHtml: markdown(t.body),
        } : {};
        return { ...it, ...tr, url: `/${slug}/`, linksHtml: `<a class="play-dl-btn" href="${attr(data.pdf)}" download>${esc(label)}</a>` };
      });
      const cur = items.find((it) => it.slug === playSlug);
      if (!cur) problems.push(`content/pages/${f}: play "${data.play}" not found`);
      else {
        const pageTitle = (t && t.data.page_title) || cfg.title;
        body = `${C.pageTitle(pageTitle)}\n${C.split(C.workList(items, playSlug), C.detail(cur.bodyHtml))}\n${body}`;
        bodyClass = 'theater reading';
      }
    }
  }
  emit(`/${slug}/`, C.layout(site, {
    path: `/${slug}/`, title: data.title, lang: data.lang || 'en', bodyClass,
    description: data.description,
    // mailto links become copy-to-clipboard buttons (keeps the address away from spam bots)
    main: body.replace(/\s+$/, '').replace(/<a [^>]*href="mailto:([^"]+)"[^>]*>[^<]*<\/a>/g, (_, a) => C.copyEmail(a, { extraClass: 'link' })),
  }));
}

// ---------- Style guide (not linked from the menu, hidden from search engines) ----------
emit('/styleguide/', styleguide(site, C));

// ---------- Write ----------
if (problems.length) {
  console.error('Problems found:\n' + problems.map((p) => '  - ' + p).join('\n'));
  process.exit(1);
}
if (CHECK) {
  console.log(`OK: ${pages.size} pages would be built.`);
  process.exit(0);
}

const previous = fs.existsSync(MANIFEST) ? fs.readFileSync(MANIFEST, 'utf8').split('\n').filter(Boolean) : [];
let written = 0;
for (const [rel, html] of pages) {
  const out = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== html) { fs.writeFileSync(out, html); written++; }
}
// Remove pages that were generated before but no longer have content (e.g. a deleted production).
let removed = 0;
for (const rel of previous) {
  if (pages.has(rel)) continue;
  const out = path.join(ROOT, rel);
  if (fs.existsSync(out)) {
    fs.unlinkSync(out);
    removed++;
    try { fs.rmdirSync(path.dirname(out)); } catch {}
  }
}
fs.writeFileSync(MANIFEST, [...pages.keys()].sort().join('\n') + '\n');
console.log(`Built ${pages.size} pages (${written} changed${removed ? `, ${removed} removed` : ''}).`);
