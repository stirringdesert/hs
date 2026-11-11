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
// publish call (every file except the home page, which is the page itself).

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

// 3. Copy, rewriting root links in HTML.
if (!pagesOnly) fs.rmSync(OUT, { recursive: true, force: true });
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
    if (SKIP.has(rel) || name.endsWith('.enc') || name.startsWith('.')) continue;
    const abs = path.join(ROOT, rel);
    if (fs.statSync(abs).isDirectory()) { walk(abs); continue; }
    const isAsset = rel.startsWith('assets' + path.sep);
    const isText = /\.(css|js)$/.test(name);
    if (pagesOnly && isAsset && !isText) continue; // already published, kept
    const dest = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (name.endsWith('.html')) {
      const depth = rel.split(path.sep).length - 1;
      const html = fs.readFileSync(abs, 'utf8').replace(
        /\b(href|src|data-src|poster)="(\/(?!\/)[^"]*)"/g,
        (_, a, url) => `${a}="${relLink(url, depth)}"`);
      // The home page's <title> names the Artifact.
      fs.writeFileSync(dest, rel === 'index.html' ? html.replace(/<title>[^<]*<\/title>/, '<title>Site preview</title>') : html);
    } else {
      fs.copyFileSync(abs, dest);
    }
    files.push(rel);
  }
}
walk(ROOT);

const map = {};
for (const rel of files.sort()) {
  if (rel === 'index.html') continue;
  const key = rel.split(path.sep).join('/');
  map[key] = path.join(OUT, rel);
}
fs.writeFileSync(path.join(OUT, 'files.json'), JSON.stringify(map, null, 2));
console.log(`Preview ready: ${OUT}/index.html (+${Object.keys(map).length} files, map in _preview/files.json)`);
