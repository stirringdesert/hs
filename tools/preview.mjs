#!/usr/bin/env node
// Builds a self-contained copy of the site in _preview/ for a private
// claude.ai Artifact preview, so a design change can be looked at before it
// goes to main (and so to the live site).
//
//   FONT_KEY=... node tools/preview.mjs        build + copy, fonts decrypted
//   node tools/preview.mjs --key-file path     same, key read from a file
//   node tools/preview.mjs --pages-only        skip assets (for quick updates
//                                              when only HTML/CSS/JS changed)
//
// Root links like href="/bio/" are rewritten to relative ones
// ("../bio/index.html"), because an Artifact is not served from a domain root.
// It also writes _preview/files.json: the `files` map for the Artifact
// publish call (the site lives under site/, the page itself is a frame with a
// Back / Home bar around it).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_preview');
const args = process.argv.slice(2);
const pagesOnly = args.includes('--pages-only');
const keyFileArg = args.indexOf('--key-file');

// Same folders the deploy workflow leaves out.
const SKIP = new Set(['.git', '.github', '_site', '_preview', 'build', 'content', 'tools', 'README.md', '.gitignore', 'CNAME']);

let key = process.env.FONT_KEY || '';
if (keyFileArg !== -1) key = fs.readFileSync(args[keyFileArg + 1], 'utf8').trim();

// 1. Build the pages.
execFileSync(process.execPath, [path.join(ROOT, 'build', 'build.mjs')], { stdio: 'inherit' });

// 2. Decrypt the fonts (into the working tree; *.woff2 is git-ignored).
const fontDir = path.join(ROOT, 'assets', 'fonts');
for (const f of fs.readdirSync(fontDir).filter((f) => f.endsWith('.woff2.enc'))) {
  const out = path.join(fontDir, f.replace(/\.enc$/, ''));
  if (fs.existsSync(out)) continue;
  if (!key) { console.warn(`No FONT_KEY: ${f} not decrypted, the preview falls back to a system font.`); continue; }
  execFileSync('openssl', ['enc', '-d', '-aes-256-cbc', '-pbkdf2', '-iter', '200000', '-in', path.join(fontDir, f), '-out', out, '-pass', 'env:FONT_KEY'],
    { env: { ...process.env, FONT_KEY: key } });
}

// 3. Copy the site into _preview/site/, rewriting root links in HTML.
// _preview/index.html is a small frame around it (see shell() below) with a fixed
// Back / Home bar, so you can never get stuck inside the preview.
if (!pagesOnly) fs.rmSync(OUT, { recursive: true, force: true });
const SITE = path.join(OUT, 'site');
const files = [];

function relLink(url, depth) {
  const m = url.match(/^\/([^?#]*)([?#].*)?$/);
  let p = m[1];
  const rest = m[2] || '';
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return '../'.repeat(depth) + p + rest;
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const rel = path.relative(ROOT, path.join(dir, name));
    if (SKIP.has(rel) || name.endsWith('.enc') || name.endsWith('.md') || name.startsWith('.')) continue;
    const abs = path.join(ROOT, rel);
    if (fs.statSync(abs).isDirectory()) { walk(abs); continue; }
    const isAsset = rel.startsWith('assets' + path.sep);
    const isText = /\.(css|js)$/.test(name);
    files.push(rel);
    if (pagesOnly && isAsset && !isText) continue; // already published, kept
    const dest = path.join(SITE, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (name.endsWith('.html')) {
      const depth = rel.split(path.sep).length - 1;
      let html = fs.readFileSync(abs, 'utf8').replace(
        /\b(href|src|data-src|poster)="(\/(?!\/)[^"]*)"/g,
        (_, a, url) => `${a}="${relLink(url, depth)}"`)
        .replace(/\bsrcset="([^"]+)"/g, (_, list) => `srcset="${list.replace(/(^|,\s*)(\/(?!\/)[^\s,]+)/g, (__, sep, url) => sep + relLink(url, depth))}"`);
      // The remembered-language redirect on the home page uses root paths ("/de/"),
      // which would leave the preview. Make them relative and compare full URLs.
      html = html.replace(/m = (\{[^}]*\});/, (_, json) => {
        const m = JSON.parse(json);
        for (const k of Object.keys(m)) m[k] = relLink(m[k], depth);
        return `m = ${JSON.stringify(m)};`;
      }).replace('m[l] !== location.pathname', 'new URL(m[l], location.href).pathname !== location.pathname');
      // Link handling for the preview (see pageScript() below).
      html = html.replace('</body>', `<script src="${'../'.repeat(depth)}assets/js/preview.js"></script>\n</body>`);
      fs.writeFileSync(dest, html);
    } else {
      fs.copyFileSync(abs, dest);
    }
  }
}
walk(ROOT);

const posix = (rel) => rel.split(path.sep).join('/');
const pageList = files.map(posix).filter((f) => f.endsWith('.html'));
fs.writeFileSync(path.join(OUT, 'index.html'), shell());
fs.mkdirSync(path.join(SITE, 'assets', 'js'), { recursive: true });
fs.writeFileSync(path.join(SITE, 'assets', 'js', 'preview.js'), pageScript(pageList));
files.push(path.join('assets', 'js', 'preview.js'));

const map = {};
for (const rel of files.sort()) {
  const isAsset = rel.startsWith('assets' + path.sep);
  if (pagesOnly && isAsset && !/\.(css|js)$/.test(rel)) continue;
  map['site/' + posix(rel)] = path.join(SITE, rel);
}
fs.writeFileSync(path.join(OUT, 'files.json'), JSON.stringify(map, null, 2));
console.log(`Preview ready: ${OUT}/index.html (+${Object.keys(map).length} files, map in _preview/files.json)`);

// The frame page: a thin bar (Back, Home, page name, light/dark-safe) above the site.
// Links that can't work inside the preview show a short note instead of leaving it.
function shell() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Site preview</title>
<style>
  :root { --bar: #141414; --fg: #f2f2f2; --muted: #9a9a9a; --line: #2a2a2a; --btn: #222; }
  @media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) { --bar: #f4f4f4; --fg: #111; --muted: #666; --line: #ddd; --btn: #e6e6e6; } }
  :root[data-theme="light"] { --bar: #f4f4f4; --fg: #111; --muted: #666; --line: #ddd; --btn: #e6e6e6; }
  html, body { margin: 0; height: 100%; background: #000; }
  body { display: flex; flex-direction: column; font: 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .bar { flex: none; display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: var(--bar); color: var(--fg); border-bottom: 1px solid var(--line); min-height: 32px; }
  .bar button { font: inherit; color: var(--fg); background: var(--btn); border: 0; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
  .bar button:hover { filter: brightness(1.25); }
  .bar .where { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; flex: 1; }
  .bar .tag { color: var(--muted); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; flex: none; }
  iframe { flex: 1; width: 100%; border: 0; background: #000; }
  .note { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); max-width: calc(100% - 32px); box-sizing: border-box;
          background: var(--bar); color: var(--fg); border: 1px solid var(--line); border-radius: 8px; padding: 10px 14px; opacity: 0; pointer-events: none; transition: opacity .2s; }
  .note.show { opacity: 1; }
  .note a { color: inherit; }
  .note b { font-weight: 600; word-break: break-all; }
</style>
</head>
<body>
<div class="bar">
  <button type="button" id="back" aria-label="Back">&larr; Back</button>
  <button type="button" id="home">Home</button>
  <span class="where" id="where"></span>
  <span class="tag">Preview</span>
</div>
<iframe id="site" src="site/index.html" title="Site preview"></iframe>
<script>
(function () {
  var frame = document.getElementById('site');
  var where = document.getElementById('where');
  // Each site page reports its address when it has loaded (assets/js/preview.js).
  // Back walks this list itself: browser history doesn't work inside the viewer.
  var visited = [], goingBack = false;
  window.addEventListener('message', function (e) {
    if (e.source !== frame.contentWindow || !e.data || typeof e.data.previewPath !== 'string') return;
    where.textContent = e.data.previewPath;
    var href = e.data.previewHref;
    if (goingBack) { goingBack = false; visited[visited.length - 1] = href; }
    else if (visited[visited.length - 1] !== href) visited.push(href);
  });
  document.getElementById('home').onclick = function () { frame.src = 'site/index.html'; };
  document.getElementById('back').onclick = function () {
    if (visited.length < 2) return;
    visited.pop();
    goingBack = true;
    frame.src = visited[visited.length - 1];
  };
})();
</script>
</body>
</html>
`;
}

// Runs inside every site page of the preview. The preview viewer can't leave its frame
// or open new tabs, so links to other sites, email links and pages that aren't part of
// the preview show a short note instead of doing nothing.
function pageScript(pages) {
  return `(function () {
  var PAGES = ${JSON.stringify(pages)};
  var me = document.currentScript && document.currentScript.src;
  if (!me) return;
  var base = me.replace(/assets\\/js\\/preview\\.js.*$/, '');
  function sitePath(href) {
    if (href.indexOf(base) !== 0) return null;
    var p = href.slice(base.length).split(/[?#]/)[0];
    if (p === '' || p.slice(-1) === '/') p += 'index.html';
    return p;
  }
  window.addEventListener('load', function () {
    try { parent.postMessage({ previewPath: '/' + (sitePath(location.href) || '').replace(/index\\.html$/, ''), previewHref: location.href.split('#')[0] }, '*'); } catch (e) {}
  });

  var note, timer;
  function say(text, detail) {
    if (!note) {
      note = document.createElement('div');
      note.setAttribute('role', 'status');
      note.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483647;max-width:calc(100% - 32px);box-sizing:border-box;'
        + 'background:#fff;color:#000;border-radius:8px;padding:10px 14px;font:13px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.4);transition:opacity .2s;pointer-events:none';
      document.body.appendChild(note);
    }
    note.textContent = text;
    if (detail) { var b = document.createElement('b'); b.style.cssText = 'display:block;word-break:break-all;font-weight:600'; b.textContent = detail; note.appendChild(b); }
    note.style.opacity = '1';
    clearTimeout(timer); timer = setTimeout(function () { note.style.opacity = '0'; }, 5000);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var raw = a.getAttribute('href') || '';
    if (raw.charAt(0) === '#') return;
    var href = a.href;
    if (/^(mailto|tel):/i.test(href)) { e.preventDefault(); say('Email/phone link (works on the live site):', raw.replace(/^[a-z]+:/i, '')); return; }
    var p = sitePath(href);
    if (p === null) { e.preventDefault(); say('Link to another site (works on the live site):', href); return; }
    if (/\\.html$/.test(p) && PAGES.indexOf(p) === -1) { e.preventDefault(); say('This page is not in the preview yet.'); }
  }, true);
})();
`;
}
