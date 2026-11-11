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

  // The big name starts exactly on top of the small one, then grows into place
  function grow(on) {
    if (!close || reduce.matches || !close.animate) return;
    var a = open.getBoundingClientRect(), b = close.getBoundingClientRect();
    if (!b.width) return;
    var from = 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + (a.width / b.width) + ')';
    var arrow = close.querySelector('svg');
    if (anim) anim.forEach(function (x) { x.cancel(); });
    var t = { duration: ms(on ? '--menu-in' : '--menu-out'), easing: ease, fill: 'both' };
    var frames = [{ transform: from }, { transform: 'none' }];
    var turn = [{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }];
    if (!on) { frames.reverse(); turn.reverse(); }
    anim = [close.animate(frames, t), arrow.animate(turn, t)];
    if (on) anim[0].finished.then(function () { anim.forEach(function (x) { x.cancel(); }); anim = null; }).catch(function () {});
  }
  function set(on) {
    var r = open.getBoundingClientRect();
    menu.style.setProperty('--mx', (r.left + r.width / 2) + 'px');
    menu.style.setProperty('--my', (r.top + r.height / 2) + 'px');
    document.body.classList.toggle('menu-open', on);
    open.setAttribute('aria-expanded', on ? 'true' : 'false');
    grow(on);
    if (!on && anim) anim[0].finished.then(function () { anim.forEach(function (x) { x.cancel(); }); anim = null; }).catch(function () {});
    setTimeout(function () { (on ? close || menu : open).focus({ preventScroll: true }); }, 0);
  }
  function plainClick(e) { return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button); }
  open.addEventListener('click', function (e) { if (plainClick(e)) { e.preventDefault(); set(true); } });
  if (close) close.addEventListener('click', function (e) { if (plainClick(e)) { e.preventDefault(); set(false); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) set(false);
  });
  // Coming back with the Back button can restore the page with the menu still open
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { document.body.classList.remove('menu-open'); open.setAttribute('aria-expanded', 'false'); }
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
  if (!e.viewTransition || v !== 'contract' || document.body.classList.contains('home')) return;
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
// lit if it shows the same one (the check runs in <head>, see STAGE_BOOT in components.mjs).
(function () {
  var stage = document.querySelector('.bg-video video, .bg-video img, .bio-photo img');
  window.addEventListener('pagehide', function () {
    try { var src = stage ? stage.getAttribute('src') : ''; sessionStorage.setItem('stage', src.slice(src.indexOf('assets/'))); } catch (e) {}
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
