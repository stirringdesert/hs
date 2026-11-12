// Menu: the name (with its arrow) opens a full-screen copy of the home page; the big
// name in the menu closes it. The black of the menu spreads from the name like a
// growing shadow (style.css, .menu), and at the same time the small name grows into
// the big one (and shrinks back on close).
(function () {
  var open = document.querySelector('.site-header > .menu-toggle');
  var menu = document.getElementById('menu');
  if (!open || !menu) return;
  var close = menu.querySelector('.menu-toggle.is-close');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var css = getComputedStyle(document.documentElement);
  function ms(name) { return parseFloat(css.getPropertyValue(name)) * 1000 || 500; }
  var ease = 'cubic-bezier(.6, 0, .25, 1)';
  var anim = null;

  // One name that grows and shrinks: the menu's big name starts exactly on top of the
  // small one (scaled down, so the letters stay sharp) and grows into place, while the
  // small one is hidden. Closing runs in reverse. Only transforms move, so it stays smooth.
  function grow(on, done) {
    if (anim) { anim.forEach(function (x) { x.cancel(); }); anim = null; }
    if (!close || reduce.matches || !close.animate) { done(); return; }
    var a = open.getBoundingClientRect(), b = close.getBoundingClientRect();
    if (!b.width) { done(); return; }
    var k = parseFloat(getComputedStyle(open).fontSize) / parseFloat(getComputedStyle(close).fontSize);
    var dx = a.left - b.left, dy = a.top + a.height / 2 - b.top - b.height * k / 2;
    // The arrows have their own sizes, so the big arrow also starts exactly on the small one
    var box = close.querySelector('.menu-arrow'), svg = box.querySelector('svg');
    var sa = open.querySelector('.menu-arrow').getBoundingClientRect(), ba = box.getBoundingClientRect();
    var s = sa.width / (ba.width * k);
    var ax = (sa.left - b.left - dx) / k - (ba.left - b.left), ay = (sa.top - b.top - dy) / k - (ba.top - b.top);
    var t = { duration: ms(on ? '--menu-in' : '--menu-out'), easing: ease, fill: 'both' };
    var name = [{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')' }, { transform: 'none' }];
    var size = [{ transform: 'translate(' + ax + 'px,' + ay + 'px) scale(' + s + ')' }, { transform: 'none' }];
    var turn = [{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }];
    if (!on) { name.reverse(); size.reverse(); turn.reverse(); }
    var mine = anim = [close.animate(name, t), box.animate(size, t), svg.animate(turn, t)];
    mine[0].finished.then(function () {
      if (anim !== mine) return;
      done();
      mine.forEach(function (x) { x.cancel(); });
      anim = null;
    }).catch(function () {});
  }
  // The small name uses the big name's letter spacing, scaled down, so that when one
  // takes over from the other the letters sit exactly in the same place.
  function matchTracking() {
    if (!close) return;
    var k = parseFloat(getComputedStyle(open).fontSize) / parseFloat(getComputedStyle(close).fontSize);
    var ls = parseFloat(getComputedStyle(close).letterSpacing);
    if (k && !isNaN(ls)) open.style.letterSpacing = (ls * k).toFixed(3) + 'px';
  }
  matchTracking();
  window.addEventListener('resize', matchTracking);
  var keyboard = false;   // move focus only for keyboard users (a tap must not leave a ring)
  function set(on) {
    var r = open.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    menu.style.setProperty('--mx', x + 'px');
    menu.style.setProperty('--my', y + 'px');
    menu.style.setProperty('--grow', (far / 65 + .5).toFixed(2));   // solid black reaches 65 px of the 100 px radius
    var body = document.body;
    body.classList.toggle('menu-open', on);
    body.classList.toggle('menu-closing', !on);
    open.setAttribute('aria-expanded', on ? 'true' : 'false');
    grow(on, function () { if (!on) body.classList.remove('menu-closing'); });
    if (keyboard) setTimeout(function () { (on ? close || menu : open).focus({ preventScroll: true }); }, 0);
  }
  function plainClick(e) { return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button); }
  open.addEventListener('click', function (e) { if (plainClick(e)) { e.preventDefault(); keyboard = e.detail === 0; set(true); } });
  if (close) close.addEventListener('click', function (e) { if (plainClick(e)) { e.preventDefault(); keyboard = e.detail === 0; set(false); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { keyboard = true; set(false); }
  });
  // Coming back with the Back button can restore the page with the menu still open
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { document.body.classList.remove('menu-open', 'menu-closing'); open.setAttribute('aria-expanded', 'false'); }
  });
})();

// Leaving the home page or the open menu: the next page plays the shrinking version
// of the menu animation (style.css, .vt-contract).
window.addEventListener('pageswap', function (e) {
  if (!e.viewTransition) return;
  var from = document.body.classList.contains('home') || document.body.classList.contains('menu-open');
  try { sessionStorage.setItem('vt', from ? 'contract' : ''); } catch (x) {}
});
window.addEventListener('pagereveal', function (e) {
  var v = '';
  try { v = sessionStorage.getItem('vt'); sessionStorage.removeItem('vt'); } catch (x) {}
  if (!e.viewTransition) return;
  // Only the menu animation plays between pages; every other page change is instant
  if (v !== 'contract' || document.body.classList.contains('home')) { e.viewTransition.skipTransition(); return; }
  var root = document.documentElement;
  root.classList.add('vt-contract');
  e.viewTransition.finished.finally(function () { root.classList.remove('vt-contract'); });
});

// Scrolled pages: the sticky name gets its soft shadow (style.css, .scrolled). On
// phones the About photo stays until the text reaches the top, then fades away.
(function () {
  var root = document.documentElement;
  var photo = document.querySelector('.bio-photo');
  var text = document.querySelector('.bio-text .page-title') || document.querySelector('.bio-text');
  var phone = window.matchMedia('(max-width: 900px)');
  var queued = false;
  function update() {
    queued = false;
    root.classList.toggle('scrolled', window.scrollY > 8);
    if (photo && text) {
      var f = 1;
      if (phone.matches) {
        var top = text.getBoundingClientRect().top, h = window.innerHeight;
        var start = h * .3, end = 60;   // fully gone when the text reaches the name
        f = Math.min(1, Math.max(0, (top - end) / (start - end)));
      }
      photo.style.setProperty('--fade', f.toFixed(3));
    }
  }
  window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  update();
})();

// Background photo or video: remember it when leaving, so the next page can keep it
// lit if it shows the same one (the check runs in <head>, see stageBoot in components.mjs).
(function () {
  var stage = document.querySelector('.bg-video video, .bg-video img, .bio-photo img');
  window.addEventListener('pagehide', function () {
    try { var src = stage ? stage.getAttribute('src') : ''; sessionStorage.setItem('stage', src.slice(src.indexOf('assets/')).split('?')[0]); } catch (e) {}
  });
})();

// Demo audio player: play/pause, seek by click, drag or arrow keys, volume.
(function () {
  var PLAY = 'M5.379 1.292C4.968 1.033 4.449 1.017 4.023 1.251 3.598 1.486 3.334 1.933 3.333 2.419V13.581C3.334 14.067 3.598 14.514 4.023 14.749 4.449 14.983 4.968 14.967 5.379 14.708L14.215 9.127C14.602 8.883 14.836 8.457 14.836 8 14.836 7.543 14.602 7.117 14.215 6.873Z';
  var PAUSE = 'M4 2h3v12H4zM9 2h3v12H9z';
  // iPhones and iPads don't let pages change the volume: hide the slider there.
  var probe = document.createElement('audio');
  try { probe.volume = .5; } catch (e) {}
  if (probe.volume !== .5) document.documentElement.classList.add('no-volume');
  document.querySelectorAll('.player').forEach(function (p) {
    var audio = p.querySelector('audio');
    var btn = p.querySelector('.player-play');
    var path = btn.querySelector('path');
    var bar = p.querySelector('.bar');
    var fill = bar.querySelector('i');
    var now = p.querySelector('.time .now');
    var total = p.querySelector('.time .total');
    var mute = p.querySelector('.player-mute');
    var vol = p.querySelector('.player-volume');
    var dragging = false;
    function fmt(s) { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
    function show(t) {
      var pct = audio.duration ? t / audio.duration * 100 : 0;
      fill.style.width = pct + '%';
      now.textContent = fmt(t);
      bar.setAttribute('aria-valuenow', Math.round(pct));
      bar.setAttribute('aria-valuetext', fmt(t));
    }
    btn.addEventListener('click', function () { audio.paused ? audio.play() : audio.pause(); });
    audio.addEventListener('play', function () { path.setAttribute('d', PAUSE); btn.setAttribute('aria-label', p.getAttribute('data-pause') || 'Pause audio'); });
    audio.addEventListener('pause', function () { path.setAttribute('d', PLAY); btn.setAttribute('aria-label', p.getAttribute('data-play') || 'Play audio'); });
    audio.addEventListener('timeupdate', function () { if (!dragging) show(audio.currentTime); });
    function setTotal() { if (audio.duration && total) total.textContent = '/ ' + fmt(audio.duration); }
    audio.addEventListener('loadedmetadata', setTotal);
    setTotal();
    function at(x) {
      var r = bar.getBoundingClientRect();
      return Math.max(0, Math.min(1, (x - r.left) / r.width)) * (audio.duration || 0);
    }
    bar.addEventListener('pointerdown', function (e) {
      if (!audio.duration) return;
      dragging = true;
      bar.classList.add('dragging');
      bar.setPointerCapture(e.pointerId);
      show(at(e.clientX));
    });
    bar.addEventListener('pointermove', function (e) { if (dragging) show(at(e.clientX)); });
    function end(e) {
      if (!dragging) return;
      dragging = false;
      bar.classList.remove('dragging');
      audio.currentTime = at(e.clientX);
    }
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', function () { dragging = false; bar.classList.remove('dragging'); });
    bar.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { audio.currentTime += 5; e.preventDefault(); }
      if (e.key === 'ArrowLeft') { audio.currentTime -= 5; e.preventDefault(); }
      if (e.key === ' ') { btn.click(); e.preventDefault(); }
    });
    function syncVol() {
      var v = audio.muted ? 0 : audio.volume;
      vol.value = v;
      vol.style.setProperty('--v', v * 100 + '%');
      mute.setAttribute('aria-pressed', audio.muted || audio.volume === 0 ? 'true' : 'false');
    }
    if (vol) {
      vol.addEventListener('input', function () { audio.volume = +vol.value; audio.muted = +vol.value === 0; syncVol(); });
      mute.addEventListener('click', function () {
        if (audio.muted || audio.volume === 0) { audio.muted = false; if (audio.volume === 0) audio.volume = 1; }
        else audio.muted = true;
        syncVol();
      });
      syncVol();
    }
  });
})();

// "Time in Munich" clock
(function () {
  var els = document.querySelectorAll('[data-clock]');
  if (!els.length) return;
  function tick() {
    var t = new Date().toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });
    els.forEach(function (el) { el.textContent = t; });
  }
  tick();
  setInterval(tick, 15000);
})();

// Email buttons: the address is stored reversed + base64 (see copyEmail in
// build/components.mjs). A click copies it and briefly shows "Copied".
(function () {
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var t = document.createElement('textarea');
      t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t);
      ok ? resolve() : reject();
    });
  }
  document.querySelectorAll('.copy-email[data-e]').forEach(function (btn) {
    var addr = atob(btn.getAttribute('data-e')).split('').reverse().join('');
    if (btn.hasAttribute('data-show')) btn.textContent = addr;
    var label = btn.textContent, timer;
    btn.addEventListener('click', function () {
      copy(addr).then(function () {
        btn.textContent = btn.getAttribute('data-copied') || 'Copied';
        clearTimeout(timer);
        timer = setTimeout(function () { btn.textContent = label; }, 1500);
      }, function () { window.prompt('Email address:', addr); });
    });
  });
})();

// Languages: remember the language a visitor picks (first-visit picker or the
// EN / DE / RU switch), so the home page opens in it next time.
(function () {
  function remember(code) { try { localStorage.setItem('lang', code); } catch (e) {} }
  document.querySelectorAll('.lang-switch a[data-lang], .lang-picker a[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () { remember(a.getAttribute('data-lang')); });
  });
  var picker = document.querySelector('.lang-picker');
  if (!picker || !document.documentElement.classList.contains('choose-lang')) return;
  // While the picker is open, the page behind it can't be reached with Tab.
  var behind = [].filter.call(document.body.children, function (el) { return el !== picker && el.tagName !== 'SCRIPT'; });
  behind.forEach(function (el) { el.inert = true; });
  // Picking a language: the big words shrink into the small switch at the bottom of the
  // home page while the black lifts. The same language just reveals this page; another
  // one then opens that home page, which has the switch in the same place.
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  picker.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      var code = a.getAttribute('data-lang'), href = a.getAttribute('href');
      var same = code === root.lang;
      var time = reduce ? 0 : 500;
      root.classList.add('lang-chosen');
      picker.querySelectorAll('a').forEach(function (big) {
        var small = document.querySelector('.home-main .lang-switch a[data-lang="' + big.getAttribute('data-lang') + '"]');
        if (!small || reduce || !big.animate) return;
        var b = big.getBoundingClientRect(), t = small.getBoundingClientRect();
        var k = t.height / b.height;
        var on = big.getAttribute('data-lang') === code;
        big.animate([
          { transform: 'none' },
          { transform: 'translate(' + (t.left - b.left) + 'px,' + (t.top + t.height / 2 - b.top - b.height * k / 2) + 'px) scale(' + k + ')',
            color: getComputedStyle(root).getPropertyValue(on ? '--color-fg' : '--color-muted').trim() }
        ], { duration: time, easing: 'cubic-bezier(.6, 0, .25, 1)', fill: 'forwards' });
      });
      setTimeout(function () {
        if (!same) { location.href = href; return; }
        behind.forEach(function (el) { el.inert = false; });
        root.classList.remove('choose-lang', 'lang-chosen');
      }, time);
    });
  });
})();
