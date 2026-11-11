// harrysergeev.com — interaction layer (styles in assets/css/fun.css).
// Each block is independent: delete one and the rest keep working.

(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lang = (root.lang || 'en').slice(0, 2);
  var T = {
    en: { dark: 'dark', light: 'light', theme: 'Color mode', close: 'Close', play: 'Play trailer' },
    de: { dark: 'dunkel', light: 'hell', theme: 'Farbmodus', close: 'Schließen', play: 'Trailer abspielen' },
    ru: { dark: 'тёмная', light: 'светлая', theme: 'Тема', close: 'Закрыть', play: 'Смотреть трейлер' },
  }[lang] || {};

  // ---- Light / dark switch (test) ----
  // Two words, like the language switch next to it: "dark light", the current one white.
  // It is added after every language switch (home page corner and the menu).
  function isLight() { return root.getAttribute('data-theme') === 'light'; }
  function setTheme(light) {
    if (light) root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
    try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) {}
    document.querySelectorAll('.theme-switch button').forEach(function (b) {
      b.setAttribute('aria-pressed', (b.dataset.theme === 'light') === light ? 'true' : 'false');
    });
  }
  var spots = document.querySelectorAll('.lang-switch');
  if (!spots.length) spots = document.querySelectorAll('.menu');
  spots.forEach(function (spot) {
    var box = document.createElement('div');
    box.className = 'theme-switch';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', T.theme || 'Color mode');
    ['dark', 'light'].forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'theme-toggle-text';
      b.dataset.theme = k;
      b.textContent = T[k] || k;
      b.setAttribute('aria-pressed', (k === 'light') === isLight() ? 'true' : 'false');
      b.addEventListener('click', function () { setTheme(k === 'light'); });
      box.appendChild(b);
    });
    if (spot.classList.contains('menu')) spot.appendChild(box);
    else spot.insertAdjacentElement('afterend', box);
  });

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
    dlg.addEventListener('close', function () { frame.textContent = ''; });          // stops the video
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
        dlg.showModal();
      });
    });
  })();

  // ---- Play page photo: fixed at the top like the videos, fading out as the text starts ----
  // It is fully gone when the first chapter number is as far from the top of the
  // screen as it is from its first paragraph.
  (function () {
    var bg = document.querySelector('.bg-image');
    var first = document.querySelector('.play-scene h2');
    if (!bg || !first) return;
    var para = first.nextElementSibling;
    var end = 1, queued = false;
    function measure() {
      var h = first.getBoundingClientRect();
      var gap = para ? para.getBoundingClientRect().top - h.bottom : 20;
      end = Math.max(1, h.top + window.scrollY - gap);   // scroll position where it's gone
      update();
    }
    function update() {
      queued = false;
      var t = Math.min(1, Math.max(0, window.scrollY / end));
      bg.style.setProperty('--fade', (1 - t).toFixed(3));
    }
    bg.classList.add('scroll-fade');
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
