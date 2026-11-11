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

  if (reduce) return;   // everything below is motion that follows the pointer

  // ---- Contact links drift toward the cursor ----
  if (finePointer) {
    document.querySelectorAll('.contact-list > *').forEach(function (el) {
      el.classList.add('magnetic');
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (x * .12).toFixed(1) + 'px,' + (y * .2).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  if (!finePointer) return;   // the custom cursor only makes sense with a mouse

  // ---- Custom cursor ----
  // A big soft disc that inverts what's under it. Over anything clickable it shrinks
  // to a small dot, so the exact spot you're pointing at is clear even on small links.
  // It sits exactly at the pointer (no trailing lag), so aiming stays precise.
  var cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursor);
  var x = -100, y = -100, queued = false;
  function draw() { queued = false; cursor.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    root.classList.add('has-cursor');
    var t = e.target.closest && e.target.closest('a, button, [role="slider"], input, label, summary');
    cursor.classList.toggle('is-link', !!t);
    if (!queued) { queued = true; requestAnimationFrame(draw); }
  }, { passive: true });
  document.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); });
  document.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); });
  document.documentElement.addEventListener('mouseleave', function () { root.classList.remove('has-cursor'); });
  // Over a video embed the browser draws its own cursor; hide ours there.
  document.addEventListener('pointerover', function (e) {
    cursor.classList.toggle('is-hidden', e.target.tagName === 'IFRAME');
  });
})();
