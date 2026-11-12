#!/usr/bin/env node
// Turns a built copy of the site into the shared preview website
// (preview.harrysergeev.com). The preview workflow builds "live site + every
// waiting change" in a separate folder, then calls
//
//   PREVIEW_PASSWORD=... node tools/preview-site.mjs <built-site-folder> <output-folder> <changes.json>
//
// What it does:
// - copies the site (the same files the live deploy publishes), except the fonts:
//   the preview repository is public and the font files are licensed, so the
//   preview loads them from the live site instead (GitHub Pages allows that),
// - keeps search engines out (robots.txt + noindex on every page),
// - locks every page with the password, if one is set: the page text is
//   encrypted (AES-GCM, key from the password via PBKDF2) and only unlocks in the
//   browser. The password is asked once per device and remembered.
//   Images and videos are not encrypted, but nothing outside the preview links to them.
// - adds a small "preview" tag with the list of waiting changes and a link to
//   the same page on the live site.
//
// changes.json: { "included": [{ "number", "title", "author" }], "skipped": [...] }

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [src, out, changesFile] = process.argv.slice(2);
if (!src || !out) { console.error('usage: preview-site.mjs <src> <out> [changes.json]'); process.exit(1); }
const DOMAIN = 'preview.harrysergeev.com';
const LIVE = 'https://harrysergeev.com';
const PASSWORD = process.env.PREVIEW_PASSWORD || '';
const ITER = 150000;
const SALT = crypto.randomBytes(16);
const KEY = PASSWORD ? crypto.pbkdf2Sync(PASSWORD, SALT, ITER, 32, 'sha256') : null;
const changes = changesFile && fs.existsSync(changesFile)
  ? JSON.parse(fs.readFileSync(changesFile, 'utf8')) : { included: [], skipped: [] };

// Same things the live deploy leaves out, plus files that only make sense on the live site.
const SKIP_TOP = new Set(['.git', '.github', '_site', '_preview', 'build', 'content', 'tools', '.claude', 'team',
  'README.md', 'CLAUDE.md', 'DESIGN-PHILOSOPHY.md', '.gitignore', 'CNAME', 'robots.txt', 'sitemap.xml', 'node_modules']);

// The tag script changes with every build, so its address does too: otherwise browsers
// keep showing an old copy for up to 10 minutes (GitHub Pages caching).
const TAG = tagScript(changes);
const TAG_URL = '/_preview.js?v=' + crypto.createHash('sha1').update(TAG).digest('hex').slice(0, 8);

const liveFont = (name) => `${LIVE}/assets/fonts/${name}`;

function prepare(html) {
  html = html.replace(/href="\/assets\/fonts\/([^"?]+\.woff2)[^"]*"/g, (_, f) => `href="${liveFont(f)}"`);
  html = html.replace(/<meta name="robots"[^>]*>\s*/g, '');
  html = html.replace(/<head>/i, '<head>\n<meta name="robots" content="noindex, nofollow">');
  html = html.replace(/<\/body>/i, `<script src="${TAG_URL}"></script>\n</body>`);
  return KEY ? lock(html) : html;
}

function lock(html) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const data = Buffer.concat([c.update(html, 'utf8'), c.final(), c.getAuthTag()]);
  const b = (x) => x.toString('base64');
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>превью</title>
<style>html,body{margin:0;height:100%;background:#000;color:#f2f2f2;font:16px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
form{display:none;position:absolute;inset:0;margin:auto;width:min(280px,calc(100% - 32px));height:max-content}
form.show{display:block}input,button{font:inherit;box-sizing:border-box;width:100%;padding:10px 12px;border-radius:8px;border:1px solid #333;background:#111;color:#fff;margin-top:8px}
button{background:#f2f2f2;color:#000;border:0;cursor:pointer}.err{color:#ff8a8a;min-height:1.4em;font-size:14px}</style></head>
<body><form id="f"><div>превью · пароль</div><input id="p" type="password" autocomplete="current-password" autofocus><button>открыть</button><div class="err" id="e"></div></form>
<script>
(function () {
  var S = "${b(SALT)}", IV = "${b(iv)}", D = "${b(data)}", N = ${ITER};
  function bytes(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
  function open(pw) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey'])
      .then(function (k) { return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(S), iterations: N, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['decrypt']); })
      .then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(IV) }, k, bytes(D)); })
      .then(function (buf) {
        try { localStorage.setItem('preview-pw', pw); } catch (e) {}
        var html = new TextDecoder().decode(buf);
        document.open(); document.write(html); document.close();
      });
  }
  var f = document.getElementById('f');
  function ask(msg) { document.getElementById('e').textContent = msg || ''; f.className = 'show'; document.getElementById('p').focus(); }
  f.onsubmit = function (ev) { ev.preventDefault(); open(document.getElementById('p').value).catch(function () { ask('неверный пароль'); }); };
  var saved = null; try { saved = localStorage.getItem('preview-pw'); } catch (e) {}
  if (saved) open(saved).catch(function () { ask(); }); else ask();
})();
</script></body></html>
`;
}

function copy(dir, rel = '') {
  for (const name of fs.readdirSync(dir)) {
    const r = rel ? `${rel}/${name}` : name;
    if ((!rel && SKIP_TOP.has(name)) || name.endsWith('.enc') || name.startsWith('.')) continue;
    if (name.endsWith('.md')) continue;
    const abs = path.join(dir, name);
    const dest = path.join(out, r);
    if (fs.statSync(abs).isDirectory()) { copy(abs, r); continue; }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (/\.(woff2?|ttf|otf)$/.test(name)) continue; // licensed fonts: loaded from the live site
    if (name.endsWith('.html')) fs.writeFileSync(dest, prepare(fs.readFileSync(abs, 'utf8')));
    else if (name.endsWith('.css')) fs.writeFileSync(dest, fs.readFileSync(abs, 'utf8')
      .replace(/url\((["']?)(?:\.\.\/fonts\/|\/assets\/fonts\/)([^"')?]+)[^"')]*\1\)/g, (_, q, f) => `url("${liveFont(f)}")`));
    else fs.copyFileSync(abs, dest);
  }
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
copy(src);
fs.writeFileSync(path.join(out, '_preview.js'), TAG);
fs.writeFileSync(path.join(out, 'CNAME'), DOMAIN + '\n');
fs.writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log(`Preview${KEY ? ' (password locked)' : ' (no password set)'}: ${changes.included.length} waiting change(s) included, ${changes.skipped.length} skipped.`);

// The small tag in the top right corner. Plain system font and colors on purpose: it is a
// tool, not part of the site's design.
function tagScript(data) {
  return `(function () {
  var D = ${JSON.stringify(data)};
  var n = D.included.length;
  function plural(k) { var a = k % 10, b = k % 100; return a === 1 && b !== 11 ? 'изменение' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'изменения' : 'изменений'; }
  var css = '#pv-tag{position:fixed;right:12px;top:12px;z-index:2147483646;font:12px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff}'
    + '#pv-tag button{font:inherit;color:#000;background:#ffd84d;border:0;border-radius:999px;padding:6px 11px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.35)}'
    + '#pv-tag .pv-panel{position:absolute;right:0;top:36px;width:min(320px,calc(100vw - 24px));box-sizing:border-box;background:#1b1b1b;border:1px solid #333;border-radius:10px;padding:12px 14px;display:none}'
    + '#pv-tag.open .pv-panel{display:block}'
    + '#pv-tag p{margin:0 0 8px}#pv-tag ul{margin:0 0 10px;padding-left:18px}#pv-tag li{margin:3px 0}'
    + '#pv-tag .pv-muted{color:#9a9a9a}#pv-tag a{color:#ffd84d}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function list(items) { return '<ul>' + items.map(function (c) { return '<li>' + esc(c.title) + (c.author ? ' <span class="pv-muted">(' + esc(c.author) + ')</span>' : '') + '</li>'; }).join('') + '</ul>'; }
  var live = '${LIVE}' + location.pathname + location.hash;
  var html = '<div class="pv-panel">'
    + '<p><b>Превью, ещё не на сайте.</b> ' + (n ? 'Сайт плюс ' + n + ' ' + plural(n) + ', ' + (n === 1 ? 'которое ждёт' : 'которые ждут') + ' публикации:' : 'Сейчас ничего не ждёт публикации, всё как на сайте.') + '</p>'
    + (n ? list(D.included) : '')
    + (D.skipped.length ? '<p class="pv-muted">Пока не показано (конфликтует с другим изменением, исправляется):</p>' + list(D.skipped) : '')
    + '<a href="' + esc(live) + '">открыть эту страницу на сайте &rarr;</a></div>'
    + '<button type="button" aria-expanded="false">превью' + (n ? ' · ' + n : '') + '</button>';
  var tag = document.createElement('div'); tag.id = 'pv-tag'; tag.innerHTML = html;
  document.body.appendChild(tag);
  var btn = tag.querySelector('button');
  btn.addEventListener('click', function () { var o = tag.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
})();
`;
}
