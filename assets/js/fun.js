// harrysergeev.com — playful layer (styles in assets/css/fun.css).
// Each block is independent: delete one and the rest keep working.

(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;

  // ---- Light / dark switch (test). The choice is remembered in this browser. ----
  var themeBtn = document.querySelector('.theme-toggle');
  function syncThemeLabel() {
    if (!themeBtn) return;
    var light = root.getAttribute('data-theme') === 'light';
    themeBtn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
  }
  if (themeBtn) {
    syncThemeLabel();
    themeBtn.addEventListener('click', function () {
      var light = root.getAttribute('data-theme') !== 'light';
      if (light) root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
      try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) {}
      syncThemeLabel();
    });
  }

  // ---- Sound button on background videos ----
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

  // ---- Letters jump when you hover (or tap) the big name and page titles ----
  function bouncy(el) {
    if (el.children.length || el.dataset.bouncy) return;  // plain text only
    var text = el.textContent;
    el.dataset.bouncy = '1';
    el.setAttribute('aria-label', text);
    el.textContent = '';
    Array.prototype.forEach.call(text, function (c, i) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i);
      s.style.setProperty('--r', (Math.random() * 16 - 8).toFixed(1));
      s.textContent = c;
      el.appendChild(s);
    });
    el.classList.add('bouncy');
    function jump() {
      if (el.classList.contains('jump')) return;
      el.classList.add('jump');
      setTimeout(function () { el.classList.remove('jump'); }, 600 + text.length * 28);
    }
    el.addEventListener('mouseenter', jump);
    el.addEventListener('touchstart', jump, { passive: true });
  }
  if (!reduce) {
    document.querySelectorAll('.home-name, .page-title, .site-header .name').forEach(bouncy);
  }

  if (reduce) return;   // everything below is motion that follows the pointer

  // ---- Voice cards tilt toward the cursor ----
  if (finePointer) {
    document.querySelectorAll('.work').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5;
        var y = (e.clientY - r.top) / r.height - .5;
        card.classList.add('tilting');
        card.style.transform = 'rotateX(' + (-y * 10).toFixed(2) + 'deg) rotateY(' + (x * 12).toFixed(2) + 'deg) translateZ(0)';
      });
      card.addEventListener('mouseleave', function () {
        card.classList.remove('tilting');
        card.style.transform = '';
      });
    });

    // ---- Contact links drift toward the cursor ----
    document.querySelectorAll('.contact-list > *').forEach(function (el) {
      el.classList.add('magnetic');
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (x * .18).toFixed(1) + 'px,' + (y * .3).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  if (!finePointer) return;   // cursor and previews only make sense with a mouse

  // ---- Custom cursor: a dot that grows over anything clickable ----
  var cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursor);
  var mx = -100, my = -100, cx = -100, cy = -100;
  document.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    root.classList.add('has-cursor');
    var t = e.target.closest && e.target.closest('a, button, [role="slider"]');
    cursor.classList.toggle('is-link', !!t);
  });
  document.addEventListener('mousedown', function () { cursor.classList.add('is-down'); });
  document.addEventListener('mouseup', function () { cursor.classList.remove('is-down'); });
  document.addEventListener('mouseleave', function () { root.classList.remove('has-cursor'); });

  // ---- Floating preview next to menu items and productions ----
  var data = {};
  try { data = JSON.parse((document.getElementById('hover-previews') || {}).textContent || '{}'); } catch (e) {}
  var preview = document.createElement('div');
  preview.className = 'hover-preview';
  preview.setAttribute('aria-hidden', 'true');
  document.body.appendChild(preview);
  var px = -500, py = -500, current = null, tilt = 0, lastX = 0;

  function show(src) {
    if (current === src) { preview.classList.add('on'); return; }
    current = src;
    preview.textContent = '';
    var m;
    if (/\.(mp4|webm|mov)$/i.test(src)) {
      m = document.createElement('video');
      m.muted = true; m.loop = true; m.autoplay = true; m.playsInline = true;
      m.setAttribute('muted', ''); m.setAttribute('playsinline', '');
      m.src = src;
      m.play && m.play().catch(function () {});
    } else {
      m = document.createElement('img');
      m.alt = '';
      m.src = src;
    }
    preview.appendChild(m);
    preview.classList.add('on');
  }
  function hide() { preview.classList.remove('on'); }

  // The map uses site-root paths ("/theater/x/"). Work out where the site root is
  // from the stylesheet URL, so this also works in the preview copy, which isn't
  // served from a domain root.
  var css = document.querySelector('link[href*="assets/css/tokens.css"]');
  var base = css ? css.href.split('assets/css/')[0] : location.origin + '/';
  function siteKey(href) {
    if (href.indexOf(base) !== 0) return null;
    return '/' + href.slice(base.length).split(/[?#]/)[0].replace(/index\.html$/, '');
  }
  function media(src) { return base + src.replace(/^\//, ''); }
  document.querySelectorAll('.home-nav a, .nav-list a, .menu a, .header-nav a').forEach(function (a) {
    var key = siteKey(a.href);
    if (!key || !data[key]) return;
    if (a.getAttribute('aria-current') === 'page') return;  // no preview of the page you're on
    a.addEventListener('mouseenter', function () { show(media(data[key])); });
    a.addEventListener('mouseleave', hide);
  });
  // preload the images so the first hover isn't empty
  Object.keys(data).forEach(function (k) {
    if (!/\.(mp4|webm|mov)$/i.test(data[k])) { var i = new Image(); i.src = media(data[k]); }
  });

  // One animation loop moves both the cursor and the preview, with a little lag.
  function loop() {
    cx += (mx - cx) * .35; cy += (my - cy) * .35;
    cursor.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
    var nx = px + (mx + 40 - px) * .12, ny = py + (my - py) * .12;
    tilt += (((nx - lastX) * .6) - tilt) * .15;   // leans in the direction it moves
    tilt = Math.max(-12, Math.min(12, tilt));
    lastX = nx; px = nx; py = ny;
    var on = preview.classList.contains('on');
    preview.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) translate(0,-50%) scale(' + (on ? 1 : .6) + ') rotate(' + tilt.toFixed(2) + 'deg)';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
