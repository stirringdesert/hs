// harrysergeev.com — interaction layer (styles in assets/css/fun.css).
// Each block is independent: delete one and the rest keep working.

(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lang = (root.lang || 'en').slice(0, 2);
  var T = {
    en: { toLight: 'turn lights on', toDark: 'turn lights off', close: 'Close' },
    de: { toLight: 'licht an', toDark: 'licht aus', close: 'Schließen' },
    ru: { toLight: 'включить свет', toDark: 'выключить свет', close: 'Закрыть' },
  }[lang] || {};

  // ---- Sound button on background videos (only shown for videos with sound) ----
  document.querySelectorAll('.sound-toggle').forEach(function (btn) {
    var video = document.querySelector('.bg-video video');
    if (!video) { btn.remove(); return; }
    function sync() {
      var on = !video.muted;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
    }
    btn.addEventListener('click', function () {
      video.muted = !video.muted;
      if (!video.muted) { video.volume = 1; video.play().catch(function () {}); }
      sync();
    });
    sync();
  });

  // ---- Theater on phones: the description opens under the selected production ----
  // On wide screens the text sits in the right column. On narrow screens it moves
  // into the list, right under the production's name and dates, so the other
  // productions are pushed down, as if the name had been opened.
  (function () {
    var detail = document.querySelector('.split > .detail');
    var current = document.querySelector('.nav-list li.current');
    if (!detail || !current) return;
    var home = detail.parentNode;
    var mq = window.matchMedia('(max-width: 900px)');
    function place(animate) {
      if (mq.matches) {
        if (detail.parentNode === current) return;
        current.appendChild(detail);
        if (animate !== false && !reduce) {
          detail.classList.add('opening');
          requestAnimationFrame(function () { requestAnimationFrame(function () { detail.classList.remove('opening'); }); });
        }
      } else if (detail.parentNode !== home) {
        home.appendChild(detail);
      }
      document.body.classList.toggle('detail-inline', mq.matches);
    }
    place(true);
    (mq.addEventListener ? mq.addEventListener('change', function () { place(false); }) : mq.addListener(function () { place(false); }));
  })();

  // ---- Trailer: a picture that opens the player in a window the width of the content ----
  (function () {
    var tiles = document.querySelectorAll('.trailer[data-embed]');
    if (!tiles.length) return;
    var dlg = document.createElement('dialog');
    dlg.className = 'trailer-dialog';
    dlg.innerHTML = '<div class="trailer-frame"></div><button type="button" class="trailer-close">' + (T.close || 'Close') + '</button>';
    document.body.appendChild(dlg);
    var frame = dlg.querySelector('.trailer-frame');
    function close() { dlg.close(); }
    dlg.querySelector('.trailer-close').addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });  // click outside the video
    var bgv = document.querySelector('.bg-video video');
    dlg.addEventListener('close', function () {
      frame.textContent = '';                                   // stops the trailer
      document.body.classList.remove('trailer-open');
      if (bgv) bgv.play().catch(function () {});
    });
    tiles.forEach(function (tile) {
      tile.addEventListener('click', function (e) {
        if (!dlg.showModal) return;   // very old browsers just follow the link
        e.preventDefault();
        var src = tile.getAttribute('data-embed');
        var f = document.createElement('iframe');
        f.src = src + (src.indexOf('?') < 0 ? '?' : '&') + 'autoplay=1&dnt=1';
        f.allow = 'autoplay; fullscreen; picture-in-picture';
        f.allowFullscreen = true;
        f.title = tile.getAttribute('aria-label') || 'Trailer';
        frame.appendChild(f);
        if (bgv) bgv.pause();                                     // the background video rests meanwhile
        document.body.classList.add('trailer-open');
        dlg.showModal();
      });
    });
  })();

  // ---- Play page: photo that fades out, then a light/dark switch for reading ----
  // The photo is fixed at the top like the videos and is fully gone when the first
  // chapter number is as far from the top of the screen as from its first paragraph.
  // At that point a "turn lights on" button appears in the bottom-right corner. It
  // goes away when the second chapter begins and comes back when scrolling up. Light mode only lives
  // on the reading pages: the choice is remembered for them, every other page (and the menu) stays black.
  (function () {
    var first = document.querySelector('.play-scene h2');
    if (!first) return;
    var bg = document.querySelector('.bg-image');
    var para = first.nextElementSibling;
    // the second chapter: the next heading that is a number, like "2."
    var second = [].filter.call(document.querySelectorAll('.play-scene h2'), function (h) { return h !== first && /^\s*\d+\.?\s*$/.test(h.textContent); })[0];
    var end = 1, stop = 1, queued = false;

    var sw = document.createElement('div');
    sw.className = 'read-mode';
    sw.innerHTML = '<button type="button" class="theme-toggle-text"></button>';
    var btn = sw.firstChild;
    function label() { btn.textContent = root.getAttribute('data-theme') === 'light' ? (T.toDark || 'turn lights off') : (T.toLight || 'turn lights on'); }
    btn.addEventListener('click', function () {
      var on = root.getAttribute('data-theme') !== 'light';
      if (on) root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
      try { localStorage.setItem('hs-reading-lights', on ? 'on' : 'off'); } catch (e) {}
      label();
    });
    label();
    document.body.appendChild(sw);

    function measure() {
      var h = first.getBoundingClientRect();
      var gap = para ? para.getBoundingClientRect().top - h.bottom : 20;
      end = Math.max(1, h.top + window.scrollY - gap);   // scroll position where the photo is gone
      // the switch leaves when the second chapter number reaches the top of the screen
      stop = second ? second.getBoundingClientRect().top + window.scrollY : end + window.innerHeight;
      update();
    }
    function update() {
      queued = false;
      var y = window.scrollY;
      if (bg) bg.style.setProperty('--fade', (1 - Math.min(1, Math.max(0, y / end))).toFixed(3));
      // shown from where the photo is gone until the second chapter begins; back again when scrolling up
      sw.classList.toggle('on', y >= end - 2 && y < stop);
    }
    if (bg) bg.classList.add('scroll-fade');
    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    measure();
  })();

  if (reduce || !finePointer) return;   // the spotlight only makes sense with a mouse

  // ---- Spotlight: a soft pool of light follows the mouse across the dark stage ----
  // The normal arrow stays, so aiming at links works as usual.
  var light = document.createElement('div');
  light.className = 'spotlight';
  light.setAttribute('aria-hidden', 'true');
  document.body.appendChild(light);
  var x = 0, y = 0, queued = false;
  function draw() { queued = false; light.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    light.classList.add('on');
    if (!queued) { queued = true; requestAnimationFrame(draw); }
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { light.classList.remove('on'); });
})();
