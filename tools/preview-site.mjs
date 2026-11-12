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
// A read-only GitHub token (no permissions, public repositories only) lets the tag check
// the build status often: without one GitHub allows 60 checks an hour per connection.
// It only goes inside password-locked pages, never into a plain file.
const API_TOKEN = PASSWORD ? (process.env.PREVIEW_API_TOKEN || '') : '';
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
const BUILD = { run: Number(process.env.PREVIEW_RUN_ID || 0), at: new Date().toISOString() };
const TAG = tagScript(changes);
const TAG_URL = '/_preview.js?v=' + crypto.createHash('sha1').update(TAG).digest('hex').slice(0, 8);

const liveFont = (name) => `${LIVE}/assets/fonts/${name}`;

function prepare(html) {
  html = html.replace(/href="\/assets\/fonts\/([^"?]+\.woff2)[^"]*"/g, (_, f) => `href="${liveFont(f)}"`);
  html = html.replace(/<meta name="robots"[^>]*>\s*/g, '');
  html = html.replace(/<head>/i, '<head>\n<meta name="robots" content="noindex, nofollow">');
  const token = API_TOKEN ? `<script>window.__pvApi = ${JSON.stringify(API_TOKEN)};</script>\n` : '';
  html = html.replace(/<\/body>/i, `${token}<script src="${TAG_URL}"></script>\n</body>`);
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
  return '(function () {\n  var D = ' + JSON.stringify(data) + ', B = ' + JSON.stringify(BUILD) + ', LIVE = ' + JSON.stringify(LIVE) + ';\n' + tagClient() + '})();\n';
}

// Runs on every preview page. Plain text (String.raw), so no template escaping is needed.
function tagClient() { return String.raw`
  // All runs of both workflows in one request (public GitHub API, no login).
  var RUNS = 'https://api.github.com/repos/stirringdesert/hs/actions/runs?per_page=10';
  var LOADED = Date.now();
  var n = D.included.length;
  function plural(k) { var a = k % 10, b = k % 100; return a === 1 && b !== 11 ? 'изменение' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'изменения' : 'изменений'; }
  function time(iso) { if (!iso) return ''; var d = new Date(iso), now = new Date();
    var t = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return d.toDateString() === now.toDateString() ? t : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' ' + t; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function short(t, k) { return t.length > k ? t.slice(0, k - 1).replace(/\s+\S*$/, '').replace(/[\s,.;:]+$/, '') + '…' : t; }

  // Quiet, small pills: dark glass, muted text. The coloured dot carries the state.
  var css = '#pv-tag{position:fixed;right:12px;top:12px;z-index:2147483646;display:flex;gap:6px;align-items:center;font:11px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#ddd}'
    + '#pv-tag .pv-pill{font:inherit;color:#cfcfcf;background:rgba(24,24,24,.72);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:4px 9px;cursor:pointer;text-decoration:none;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);transition:color .2s,border-color .2s,box-shadow .2s}'
    + '#pv-tag .pv-pill:hover{color:#fff;border-color:rgba(255,255,255,.3)}'
    + '#pv-tag .pv-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:6px;vertical-align:1px;background:#2f9e44}'
    + '#pv-tag[data-s=busy] .pv-dot{background:#f08c00;animation:pv-pulse 1s ease-in-out infinite alternate}'
    + '#pv-tag[data-s=new] .pv-dot{background:#4dabf7}'
    + '#pv-tag[data-s=unknown] .pv-dot{background:#777}'
    + '#pv-tag .pv-live.glow{color:#fff;border-color:#2f9e44;animation:pv-glow 1.6s ease-in-out infinite alternate}'
    + '@keyframes pv-pulse{from{opacity:1}to{opacity:.25}}'
    + '@keyframes pv-glow{from{box-shadow:0 0 0 0 rgba(47,158,68,.0)}to{box-shadow:0 0 10px 2px rgba(47,158,68,.7)}}'
    + '#pv-tag .pv-panel{position:absolute;right:0;top:30px;width:min(320px,calc(100vw - 24px));box-sizing:border-box;background:#1b1b1b;border:1px solid #333;border-radius:10px;padding:12px 14px;display:none;font-size:12px;color:#fff}'
    + '#pv-tag.open .pv-panel{display:block}'
    + '@media (min-width:700px){#pv-tag{right:180px}}'
    + '#pv-tag p{margin:0 0 8px}#pv-tag ul{margin:0 0 10px;padding-left:18px}#pv-tag li{margin:3px 0}'
    + '#pv-tag .pv-muted{color:#9a9a9a}#pv-tag .pv-panel a{color:#ffd84d}#pv-tag .pv-state p{margin-bottom:6px}#pv-tag .pv-state{margin-bottom:10px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function list(items) { return '<ul>' + items.map(function (c) { return '<li>' + esc(c.title) + ' <span class="pv-muted">(' + [c.author, c.when ? 'изменено ' + time(c.when) : ''].filter(Boolean).map(esc).join(', ') + ')</span></li>'; }).join('') + '</ul>'; }
  var live = LIVE + location.pathname + location.hash;
  var tag = document.createElement('div'); tag.id = 'pv-tag';
  tag.innerHTML = '<div class="pv-panel"><div class="pv-state"></div>'
    + '<p><b>Превью, ещё не на сайте.</b> ' + (n ? 'Сайт плюс ' + n + ' ' + plural(n) + ', ' + (n === 1 ? 'которое ждёт' : 'которые ждут') + ' публикации:' : 'Сейчас ничего не ждёт публикации, всё как на сайте.') + '</p>'
    + (n ? list(D.included) : '')
    + (D.skipped.length ? '<p class="pv-muted">Пока не показано (конфликтует с другим изменением, исправляется):</p>' + list(D.skipped) : '')
    + '</div>'
    + '<a class="pv-pill pv-live" href="' + esc(live) + '" target="_blank" rel="noopener" title="Открыть эту страницу на сайте">сайт ↗</a>'
    + '<button type="button" class="pv-pill pv-btn" aria-expanded="false"><span class="pv-dot"></span><span class="pv-label"></span></button>';
  document.body.appendChild(tag);
  var btn = tag.querySelector('.pv-btn'), stateEl = tag.querySelector('.pv-state'), labelEl = tag.querySelector('.pv-label'), liveBtn = tag.querySelector('.pv-live');
  btn.addEventListener('click', function () {
    if (tag.getAttribute('data-s') === 'new') { location.reload(); return; }
    var o = tag.classList.toggle('open'); btn.setAttribute('aria-expanded', o);
  });

  // What a run is about: a waiting change's title, or for a push to main the title of
  // the published change (second paragraph of the merge commit).
  function what(run) {
    if (run.event === 'push') {
      var parts = ((run.head_commit && run.head_commit.message) || run.display_title || '').split(/\n\s*\n/);
      return /^Merge pull request/.test(parts[0]) && parts[1] ? parts[1].split('\n')[0] : parts[0].split('\n')[0];
    }
    return run.display_title || 'изменения';
  }
  function fmt(secs) { return secs < 60 ? secs + ' сек' : Math.floor(secs / 60) + ' мин ' + (secs % 60) + ' сек'; }

  // States, shown on the button and in the panel:
  //   публикуется    a change is being published to the live site (Deploy workflow running)
  //   собирается     the preview is being built (Update preview workflow running)
  //   обновляется    built; the preview site is about to serve it
  //   готово         the preview serves a newer version: a click reloads
  //   превью · N     nothing happening
  // When a publication finishes while the page is open, the panel says so and the "сайт"
  // button glows until the next change starts or the page is left.
  var built = 'Эта версия превью собрана в ' + time(B.at) + '.';
  var pause = 0, timer = 0, liveLine = '', dismissed = {};
  var clocks = {};  // element class -> start time, ticked every second
  function show(s, text, label) {
    tag.setAttribute('data-s', s);
    stateEl.innerHTML = liveLine + '<p>' + text + '</p>';
    labelEl.textContent = label || ('превью' + (n ? ' · ' + n : ''));
    tick();
  }
  function tick() {
    for (var k in clocks) { var el = stateEl.querySelector('.' + k);
      if (el) el.textContent = fmt(Math.max(0, Math.round((Date.now() - clocks[k]) / 1000))); }
  }
  setInterval(tick, 1000);
  function glow(on) { liveBtn.classList.toggle('glow', on); }

  function check() {
    if (document.hidden || Date.now() < pause) return;
    var opts = { cache: 'no-cache' };
    if (window.__pvApi) opts.headers = { Authorization: 'Bearer ' + window.__pvApi };
    fetch(RUNS, opts).then(function (r) {
      if (r.status === 401 && window.__pvApi) { window.__pvApi = null; return null; } // token expired: go on without it
      if (r.status === 403 || r.status === 429) {
        pause = Date.now() + 300000;
        show('unknown', '<b>Статус на паузе.</b> GitHub ограничил число проверок, продолжу через 5 минут. ' + built, 'статус на паузе');
        return false;
      }
      return r.ok ? r.json() : null;
    }).then(function (j) {
      if (j === false) return;
      var runs = (j && j.workflow_runs) || [];
      var pv = runs.filter(function (r) { return r.name === 'Update preview site'; })[0];
      var lv = runs.filter(function (r) { return r.name === 'Deploy to GitHub Pages'; })[0];
      clocks = {}; liveLine = '';
      var label = null;
      if (lv && lv.status !== 'completed') {
        clocks['pv-t-live'] = new Date(lv.run_started_at || lv.created_at).getTime();
        liveLine = '<p><b>Публикуется на сайт:</b> «' + esc(what(lv)) + '». Идёт <span class="pv-t-live"></span>.</p>';
        label = 'публикуется: ' + short(what(lv), 26);
        glow(false);
      } else if (lv && lv.conclusion === 'success' && new Date(lv.updated_at).getTime() > LOADED - 5000) {
        // A preview build that started after the publication finished is "something new":
        // it ends the glow. (The rebuild that the publication itself starts doesn't.)
        if (pv && pv.status !== 'completed' && new Date(pv.created_at) > new Date(lv.updated_at)) dismissed[lv.id] = true;
        if (!dismissed[lv.id]) { liveLine = '<p><b>Сайт обновлён:</b> «' + esc(what(lv)) + '» уже на сайте. <a href="' + esc(live) + '">Открыть ↗</a></p>'; glow(true); }
        else glow(false);
      }
      if (!pv) return show(label ? 'busy' : 'unknown', built, label);
      var q = '«' + esc(what(pv)) + '»';
      if (pv.status !== 'completed') {
        clocks['pv-t-pv'] = new Date(pv.run_started_at || pv.created_at).getTime();
        return show('busy', '<b>Собирается превью:</b> ' + q + '. Идёт <span class="pv-t-pv"></span>. ' + built, label || 'собирается: ' + short(what(pv), 26));
      }
      if (pv.id === B.run || pv.conclusion !== 'success' || new Date(pv.updated_at) < new Date(B.at))
        return show(label ? 'busy' : 'ok', '<b>Превью актуально.</b> ' + built, label);
      // Built; ready once the preview site actually serves it.
      fetch('/_preview.js?check=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) {
        if (t.indexOf('"run":' + pv.id) !== -1)
          show(label ? 'busy' : 'new', '<b>Превью готово:</b> ' + q + '. <a href="javascript:location.reload()">Обновите страницу</a>, чтобы увидеть.', label || 'готово · обновить');
        else
          show('busy', '<b>Обновляется превью:</b> ' + q + '. Собрано, вот-вот появится. ' + built, label || 'обновляется: ' + short(what(pv), 26));
      }).catch(function () {});
    }).catch(function () { show('unknown', built); });
  }
  // GitHub is asked every 5 s while something is happening, every 15 s otherwise
  // (unchanged answers don't count toward its hourly limit); the timers tick locally.
  function schedule() { clearTimeout(timer); timer = setTimeout(function () { check(); schedule(); }, tag.getAttribute('data-s') === 'busy' ? 5000 : 15000); }
  show('unknown', built);
  check();
  schedule();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
`; }
