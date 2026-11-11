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

// ---------- Languages ----------
// The first language in site.json lives at the site root (/bio/), every other one
// under its own prefix (/ru/bio/). Texts come from translation files next to the
// English ones: site.<lang>.json (menu, labels), bio.<lang>.md,
// voice.<lang>.json, theater/<slug>.<lang>.md. A missing translation falls back to
// English and is listed after the build, so nothing breaks while a translation is unfinished.
const LANGS = site.languages?.length ? site.languages : [{ code: 'en', label: 'EN' }];
const DEFAULT = LANGS[0].code;
const prefix = (lang) => (lang === DEFAULT ? '' : `/${lang}`);
const untranslated = [];

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
// Translation values replace English ones. Lists of objects (menu, contact links)
// are merged item by item, so a translation only needs the fields it changes.
function merge(base, over) {
  if (over === undefined) return base;
  if (Array.isArray(base) && Array.isArray(over) && base.every(isObj)) return base.map((b, i) => merge(b, over[i]));
  if (isObj(base) && isObj(over)) {
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = merge(base[k], over[k]);
    return out;
  }
  return over;
}
function translationJson(file, lang) {
  if (lang === DEFAULT) return undefined;
  const t = file.replace(/\.json$/, `.${lang}.json`);
  if (fs.existsSync(path.join(CONTENT, t))) return readJson(t);
  untranslated.push(`content/${t}`);
  return undefined;
}
// A .md file plus its translation: front matter fields in the translation replace the
// English ones, and its text replaces the English text (if it has any).
function readMd(file, lang) {
  const base = parseFrontMatter(readText(file), `content/${file}`);
  if (lang === DEFAULT) return base;
  const t = file.replace(/\.md$/, `.${lang}.md`);
  if (!fs.existsSync(path.join(CONTENT, t))) { untranslated.push(`content/${t}`); return base; }
  const tr = parseFrontMatter(readText(t), `content/${t}`);
  return { data: { ...base.data, ...tr.data }, body: tr.body.trim() ? tr.body : base.body };
}

// Site settings in one language, with menu links pointing into that language.
function siteIn(lang) {
  const s = merge(site, lang === DEFAULT ? undefined : translationJson('site.json', lang));
  return { ...s, lang, home: prefix(lang) + '/', nav: s.nav.map((n) => ({ ...n, url: readingUrl(n.url, lang) || localUrl(n.url, lang) })) };
}

// A play with a reading page (content/pages/*.html with `play:` in its front matter):
// its menu link goes straight to the text in the visitor's language.
const readingPages = fs.readdirSync(path.join(CONTENT, 'pages')).filter((f) => f.endsWith('.html')).map((f) => {
  const { data } = parseFrontMatter(readText(`pages/${f}`), `content/pages/${f}`);
  return data.play ? { play: data.play, lang: data.lang || 'en', url: `/${f.replace(/\.html$/, '')}/` } : null;
}).filter(Boolean);
function readingUrl(url, lang) {
  const m = url.match(/^\/([a-z0-9-]+\/[a-z0-9-]+)\/$/);
  if (!m) return null;
  const pages = readingPages.filter((r) => r.play === m[1]);
  return (pages.find((r) => r.lang === lang) || pages.find((r) => r.lang === 'en') || {}).url || null;
}

// Pages that exist in every language. Filled in below, before any page is built.
const localRoutes = new Set(['/', '/bio/', '/voice/', '/contact/']);
const localUrl = (url, lang) => {
  const [p, hash = ''] = url.split('#');
  return localRoutes.has(p) ? prefix(lang) + p + (hash ? '#' + hash : '') : url;
};
// Point site links inside page text (e.g. "[contact](/contact/)") into the same language.
const localizeLinks = (html, lang) =>
  lang === DEFAULT ? html : html.replace(/href="(\/[^"]*)"/g, (_, u) => `href="${attr(localUrl(u.replace(/&amp;/g, '&'), lang))}"`);
// The same page in every language, for the language switch and hreflang tags.
const alternatesOf = (p) => LANGS.map((l) => ({ code: l.code, label: l.label, href: prefix(l.code) + p }));

// ---------- Theater + playwriting ----------
function loadSection(dir, lang) {
  const folder = path.join(CONTENT, dir);
  return fs.readdirSync(folder)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && !/\.[a-z]{2}\.md$/.test(f)) // x.ru.md = translation
    .map((f) => {
      const slug = f.replace(/\.md$/, '');
      const where = `content/${dir}/${f}`;
      if (!/^[a-z0-9-]+$/.test(slug)) problems.push(`${where}: file name should be lowercase letters, numbers and dashes only`);
      const { data, body } = readMd(`${dir}/${f}`, lang);
      need(data.title, 'title', where);
      needAsset(data.video, where);
      needAsset(data.image, where);
      if (data.trailer) { need(data.trailer_image, 'trailer_image', where); needAsset(data.trailer_image, where); }
      if (data.hidden) return null;
      return {
        slug,
        url: `${prefix(lang)}/${dir}/${slug}/`,
        title: data.title,
        order: data.order ?? 999,
        video: data.video,
        sound: data.sound === true || data.sound === 'true',
        image: data.image,
        imageAlt: data.image_alt || '',
        trailer: data.trailer ? { embed: data.trailer, image: data.trailer_image, url: data.trailer_url, duration: data.trailer_duration } : null,
        summaryHtml: (data.summary || []).map((s) => inline(String(s))),
        linksHtml: (data.links || []).map((s) => inline(String(s), { linkClass: '' })).join(''),
        bodyHtml: markdown(body),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

for (const [dir, cfg] of Object.entries(site.sections)) {
  if (cfg.has_index) localRoutes.add(`/${dir}/`);
  for (const it of loadSection(dir, DEFAULT)) localRoutes.add(it.url);
}

const sectionItems = {};

function buildLanguage(lang) {
  const s = siteIn(lang);
  const ui = s.ui;
  const page = (p, opts) => emit(prefix(lang) + p, C.layout(s, {
    ...opts, path: prefix(lang) + p, lang, alternates: alternatesOf(p), main: localizeLinks(opts.main, lang),
  }));

  // ---------- Home ----------
  page('/', {
    bodyClass: 'home',
    chrome: false,
    before: lang === DEFAULT ? C.langPicker(alternatesOf('/')) : '',
    head: lang === DEFAULT ? C.langPickerHead(alternatesOf('/')) : '',
    mainClass: 'home-main',
    main: C.homeView(s, alternatesOf('/')),
  });

  // ---------- Bio ----------
  {
    const { data, body } = readMd('bio.md', lang);
    need(data.title, 'title', 'content/bio.md');
    needAsset(data.photo, 'content/bio.md');
    const photo = data.photo
      ? `<div class="bio-photo"><img src="${attr(data.photo)}" alt="${attr(data.photo_alt || s.name)}" width="${data.photo_width || 1024}" height="${data.photo_height || 1536}"></div>\n`
      : '';
    page('/bio/', {
      title: ui.titles.bio, bodyClass: 'bio',
      main: `${photo}<div class="bio-text">
  ${C.pageTitle(data.title)}
${markdown(body).map((b) => '  ' + b).join('\n')}
</div>`,
    });
  }

  // ---------- Voice ----------
  {
    const base = readJson('voice.json');
    const tr = translationJson('voice.json', lang);
    // In a translation, "roles" maps the English character name to translated fields.
    const v = merge(base, tr ? { ...tr, roles: undefined } : undefined);
    v.roles = (base.roles || []).map((r) => ({ ...r, ...(tr?.roles?.[r.character] || {}) }));
    const where = 'content/voice.json';
    needAsset(v.demo?.file, where);
    v.roles.forEach((r, i) => {
      need(r.character, 'character', `${where} role #${i + 1}`);
      need(r.title, 'title', `${where} role #${i + 1}`);
      need(r.image, 'image', `${where} role #${i + 1}`);
      needAsset(r.image, `${where} role #${i + 1} (${r.character})`);
    });
    const cta = inline(v.cta, { linkClass: 'accent' });
    const parts = [
      `<section class="demo">
${C.demoHead(v.demo.title, v.demo.file, ui)}
${C.player(v.demo.file, ui)}
  <p class="bookings">${cta}</p>
</section>`,
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
    parts.push('', `<p class="bookings bottom-cta">${cta}</p>`);   // same paragraph style as the line under the player
    page('/voice/', { title: ui.titles.voice, bodyClass: 'voice', main: parts.join('\n') });
  }

  // ---------- Theater + playwriting ----------
  for (const [dir, cfg] of Object.entries(s.sections)) {
    const items = loadSection(dir, lang);
    if (lang === DEFAULT) sectionItems[dir] = items;
    if (cfg.has_index) {
      page(`/${dir}/`, {
        title: cfg.page_title, bodyClass: 'theater',
        main: `${C.pageTitle(cfg.title)}\n${C.split(C.workList(items, null))}`,
      });
    }
    for (const it of items) {
      page(`/${dir}/${it.slug}/`, {
        title: it.title, bodyClass: 'theater',
        before: it.video ? C.bgVideo(it.video, { sound: it.sound }) : it.image ? C.bgImage(it.image, it.imageAlt) : '',
        main: `${C.pageTitle(cfg.title)}\n${C.split(C.workList(items, it.slug), C.detail(it.trailer
          ? [C.trailer({ ...it.trailer, label: ui.trailer || 'Trailer' }), ...it.bodyHtml]
          : it.bodyHtml))}`,
      });
    }
  }

  // ---------- Contact ----------
  page('/contact/', {
    title: ui.titles.contact, bodyClass: 'contact',
    main: `${C.label(esc(s.contact.label), { tag: 'h1' })}
<div class="contact-list">
${s.contact.links.map((l) => {
      if (l.copy) return '  ' + C.copyEmail(l.copy, { label: l.short || 'E-mail', ui });
      const ext = /^https?:/.test(l.url);
      const text = l.short
        ? `<span class="long">${esc(l.label)}</span><span class="short">${esc(l.short)}</span>`
        : esc(l.label);
      return `  <a href="${attr(l.url)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
    }).join('\n')}
</div>`,
  });
}

for (const l of LANGS) buildLanguage(l.code);

// ---------- Free-form HTML pages (legal pages, play text) ----------
// Play reading pages (front matter `play:`) are one page per language already, so the
// language switch links them to each other and their menu points into their language.
// Legal pages exist once, in German, under the default language's menu.
const freePages = fs.readdirSync(path.join(CONTENT, 'pages')).filter((f) => f.endsWith('.html')).map((f) => {
  const slug = f.replace(/\.html$/, '');
  const { data, body } = parseFrontMatter(readText(`pages/${f}`), `content/pages/${f}`);
  return { f, slug, data, body };
});
for (const { f, slug, data, body: raw } of freePages) {
  let body = raw;
  let bodyClass = data.body_class || 'page';
  let before = '';
  const lang = data.lang || DEFAULT;
  const isReading = Boolean(data.play);
  const s = isReading && LANGS.some((l) => l.code === lang) ? siteIn(lang) : siteIn(DEFAULT);
  let alternates = null;
  if (isReading) {
    const siblings = freePages.filter((p) => p.data.play === data.play);
    alternates = LANGS.map((l) => {
      const p = siblings.find((x) => (x.data.lang || DEFAULT) === l.code);
      return p && { code: l.code, label: l.label, href: `/${p.slug}/` };
    }).filter(Boolean);
  }
  if (data.pdf) {
    needAsset(data.pdf, `content/pages/${f}`);
    const label = data.pdf_label || 'Download PDF';
    if (data.play) {
      // On top: the play's playwriting section in the page's language, with the
      // read links replaced by the download button
      const [dir, playSlug] = data.play.split('/');
      const cfg = s.sections[dir];
      const tFile = path.join(CONTENT, dir, `${playSlug}.${lang}.md`);
      const t = fs.existsSync(tFile) ? parseFrontMatter(fs.readFileSync(tFile, 'utf8'), tFile) : null;
      const items = (sectionItems[dir] || []).map((it) => {
        if (it.slug !== playSlug) return { ...it, url: localUrl(it.url, lang) };
        const tr = t ? {
          title: t.data.title || it.title,
          summaryHtml: (t.data.summary || []).map((x) => inline(String(x))),
          bodyHtml: markdown(t.body),
        } : {};
        // The other languages' reading pages, shown on the right of the title row
        const others = (alternates || []).filter((a) => a.code !== lang)
          .map((a) => `<a href="${attr(a.href)}" hreflang="${a.code}" lang="${a.code}">${esc(a.label.toLowerCase())}</a>`).join('');
        return { ...it, ...tr, url: `/${slug}/`, asideHtml: others, linksHtml: `<a class="play-dl-btn" href="${attr(data.pdf)}" download>${esc(label)}</a>` };
      });
      const cur = items.find((it) => it.slug === playSlug);
      if (!cur) problems.push(`content/pages/${f}: play "${data.play}" not found`);
      else {
        const pageTitle = (t && t.data.page_title) || cfg.title;
        body = `${C.pageTitle(pageTitle)}\n${C.split(C.workList(items, playSlug), C.detail(cur.bodyHtml))}\n${body}`;
        bodyClass = 'theater reading';
        // The play's photo sits behind the top of the page and fades out as the text begins (fun.js)
        if (cur.image) before = C.bgImage(cur.image, cur.imageAlt);
      }
    }
  }
  emit(`/${slug}/`, C.layout(s, {
    path: `/${slug}/`, title: data.title, lang, bodyClass, alternates, before,
    description: data.description,
    // Reading pages remember "lights on" before anything is drawn, so the page doesn't flash black
    head: bodyClass === 'theater reading' ? C.READ_LIGHT_BOOT : '',
    // mailto links become copy-to-clipboard buttons (keeps the address away from spam bots)
    main: body.replace(/\s+$/, '').replace(/<a [^>]*href="mailto:([^"]+)"[^>]*>[^<]*<\/a>/g, (_, a) => C.copyEmail(a, { extraClass: 'link', ui: s.ui })),
  }));
}

// ---------- Style guide (not linked from the menu, hidden from search engines) ----------
emit('/styleguide/', styleguide(siteIn(DEFAULT), C));

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
if (untranslated.length) {
  console.log(`Not translated yet (English is shown instead):\n${[...new Set(untranslated)].map((u) => '  - ' + u).join('\n')}`);
}
