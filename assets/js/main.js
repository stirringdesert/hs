// Menu toggle. The open menu looks like the home page. Where the browser supports
// view transitions, the header name grows into the big name (and back on close).
(function () {
  var btn = document.querySelector('.menu-toggle');
  if (!btn) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function set(open) {
    function apply() {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (document.startViewTransition && !reduce.matches) document.startViewTransition(apply);
    else apply();
  }
  btn.addEventListener('click', function () { set(!document.body.classList.contains('menu-open')); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) set(false);
  });
  // Coming back with the browser's Back button can restore the page with the menu still open
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { document.body.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); }
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
  // Picking the language of this page just reveals it; the others navigate.
  picker.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (a.getAttribute('data-lang') !== document.documentElement.lang) return;
      e.preventDefault();
      document.documentElement.classList.add('lang-chosen');
      behind.forEach(function (el) { el.inert = false; });
      setTimeout(function () { document.documentElement.classList.remove('choose-lang', 'lang-chosen'); }, 500);
    });
  });
})();
