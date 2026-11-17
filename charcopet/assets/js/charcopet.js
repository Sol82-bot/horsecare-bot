/* CharcoPet landing page — interactions.
   No dependencies. Every block guards for its own elements, so the file can be
   loaded safely on a page that only uses part of the markup. */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  /* ---------- Site header: shadow, smart hide, mobile menu ---------- */
  var header = $('#header'), subnav = $('#cpSubnav'), burger = $('#burger'), menu = $('#menu');
  var lastY = window.scrollY, hidden = false;

  function setHeaderHidden(state) {
    if (!header || hidden === state) return;
    hidden = state;
    header.classList.toggle('is-hidden', state);
    root.style.setProperty('--cp-header-offset', state ? '0px' : '');
  }

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 10);
    if (subnav) {
      // Where the bar sits in the normal flow = bottom of the block before it.
      // (offsetTop of a sticky element reports its *stuck* position, so it can't be used.)
      var before = subnav.previousElementSibling;
      var naturalTop = before ? before.offsetTop + before.offsetHeight : 0;
      var stuckAt = naturalTop - (hidden || !header ? 0 : header.offsetHeight);
      var past = y >= stuckAt - 1;
      subnav.classList.toggle('is-stuck', past);
      var menuOpen = menu && menu.classList.contains('open');
      // Once the product bar takes over, the site header steps aside on the way
      // down and comes back as soon as the visitor scrolls up.
      if (!menuOpen) {
        if (!past || y < lastY - 6) setHeaderHidden(false);
        else if (y > lastY + 6) setHeaderHidden(true);
      }
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger && menu) {
    var closeMenu = function () {
      menu.classList.remove('open'); burger.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu');
    };
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.classList.toggle('active', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- In-page navigation: scroll-spy ---------- */
  var links = $$('#cpSubnavLinks a');
  var targets = links.map(function (a) { return doc.getElementById(a.getAttribute('href').slice(1)); });
  if (links.length && 'IntersectionObserver' in window) {
    var setActive = function (id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        if (on) {
          a.setAttribute('aria-current', 'true');
          var box = a.parentElement;
          if (box.scrollWidth > box.clientWidth) {
            box.scrollTo({ left: a.offsetLeft - box.offsetLeft - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
          }
        } else {
          a.removeAttribute('aria-current');
        }
      });
    };
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    targets.forEach(function (t) { if (t) spy.observe(t); });
    // nothing highlighted while the visitor is still on the hero
    var hero = $('.cp-hero');
    if (hero) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && entries[0].intersectionRatio > 0.5) setActive('');
      }, { threshold: [0.5] }).observe(hero);
    }
  }

  /* ---------- Dose guide (2 ml/kg, 30 ml per syringe, 2 syringes per carton) ---------- */
  var range = $('#cpWeight');
  if (range) {
    var ML_PER_KG = 2, SYRINGE_ML = 30, PER_CARTON = 2, MAX_BARRELS = 4;
    var outKg = $('#cpWeightOut'), outMl = $('#cpMl'), outSyr = $('#cpSyringeText'), outCarton = $('#cpCartonText');
    var barrels = $('#cpBarrels'), presets = $$('.cp-presets button');
    var fmt = function (n) { return (Math.round(n * 10) / 10).toString(); };
    var plural = function (n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); };

    var ticks = '';
    for (var i = 1; i < 15; i++) {
      var x = 30 + (148 / 15) * i, long = i % 5 === 0;
      ticks += '<path d="M' + x.toFixed(1) + ' 7v' + (long ? 7 : 4) + '"/>';
    }
    var barrelSvg =
      '<svg class="cp-barrel" viewBox="0 0 260 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="2" y="14" width="18" height="8" rx="3"/><rect x="20" y="11" width="6" height="14" rx="2"/>' +
      '<rect class="cp-barrel__gel" x="29" y="9.5" width="148" height="17" rx="2" fill="#414042" stroke="none"/>' +
      '<rect x="26" y="7" width="154" height="22" rx="4"/>' +
      '<g stroke-width="1" opacity=".55">' + ticks + '</g>' +
      '<path d="M181 2v32" stroke-width="3"/><rect x="183" y="13" width="60" height="10" rx="2"/><path d="M245 7v22" stroke-width="3"/>' +
      '</svg>';
    if (barrels) {
      var html = '';
      for (var b = 0; b < MAX_BARRELS; b++) html += barrelSvg;
      barrels.innerHTML = html;
    }
    var barrelEls = $$('.cp-barrel', barrels);

    var update = function () {
      var kg = parseFloat(range.value);
      var ml = kg * ML_PER_KG;
      var full = Math.floor(ml / SYRINGE_ML);
      var rest = Math.round((ml - full * SYRINGE_ML) * 10) / 10;
      var syringes = full + (rest > 0 ? 1 : 0);
      var cartons = Math.ceil(syringes / PER_CARTON);
      var spare = cartons * PER_CARTON - syringes;

      range.style.setProperty('--p', ((kg - range.min) / (range.max - range.min) * 100).toFixed(2) + '%');
      range.setAttribute('aria-valuetext', fmt(kg) + ' kilograms, ' + fmt(ml) + ' millilitres');
      outKg.innerHTML = fmt(kg) + '<small>kg</small>';
      outMl.textContent = fmt(ml);

      var parts = [];
      if (full) parts.push(plural(full, 'full syringe'));
      if (rest) parts.push(fmt(rest) + ' ml from ' + (full ? 'another' : 'one syringe'));
      outSyr.textContent = parts.join(' + ');
      outCarton.textContent = plural(cartons, 'carton') + ' cover' + (cartons === 1 ? 's' : '') + ' this dose' +
        (spare ? ', with ' + (spare === 1 ? 'one syringe' : spare + ' syringes') + ' to spare.' : '.');

      barrelEls.forEach(function (el, idx) {
        var f = Math.max(0, Math.min(1, (ml - idx * SYRINGE_ML) / SYRINGE_ML));
        el.style.setProperty('--f', f.toFixed(3));
        el.classList.toggle('is-empty', f === 0);
      });
      presets.forEach(function (btn) { btn.setAttribute('aria-pressed', String(parseFloat(btn.dataset.kg) === kg)); });
    };
    range.addEventListener('input', update);
    presets.forEach(function (btn) {
      btn.addEventListener('click', function () { range.value = btn.dataset.kg; update(); });
    });
    update();
  }

  /* ---------- Videos: inline in the card, pop-up player, or placeholder while data-video is empty ---------- */
  var dialog = $('#cpVideoDialog'), dialogBody = $('#cpVideoBody');

  function playInline(frame, src, title) {
    if (frame.classList.contains('is-playing')) return;
    var v = doc.createElement('video');
    v.className = 'cp-video__inline';
    v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('playsinline', ''); v.setAttribute('aria-label', title);
    var stop = function () { frame.classList.remove('is-playing'); if (v.parentNode) v.parentNode.removeChild(v); };
    v.addEventListener('ended', stop);       // back to the cover when the film is over (or cannot be played)
    v.addEventListener('error', stop);
    frame.appendChild(v); frame.classList.add('is-playing');
    var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
  }

  $$('.cp-video__frame').forEach(function (frame) {
    var btn = $('.cp-video__start', frame) || frame;
    var soon = $('.cp-video__soon', frame);
    var title = frame.dataset.videoTitle || 'CharcoPet video';
    btn.addEventListener('click', function () {
      var src = (frame.dataset.video || '').trim();
      if (!src) {
        // Not supplied yet — acknowledge the click instead of doing nothing.
        if (soon && !reduceMotion && soon.animate) {
          soon.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
        }
        return;
      }
      if (frame.dataset.play === 'inline') { playInline(frame, src, title); return; }
      if (!dialog || !dialog.showModal) { window.open(src, '_blank', 'noopener'); return; }
      if (/\.(mp4|webm|mov)(\?|$)/i.test(src)) {
        var v = doc.createElement('video');
        v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true; v.setAttribute('aria-label', title);
        dialogBody.replaceChildren(v);
      } else {
        var f = doc.createElement('iframe');
        f.src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1';
        f.title = title; f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true;
        dialogBody.replaceChildren(f);
      }
      dialog.showModal();
    });
    btn.setAttribute('aria-label', (frame.dataset.video || '').trim() ? 'Play video: ' + title : title + ' (video coming soon)');
  });
  if (dialog) {
    var closeDialog = function () { dialog.close(); };
    var closeBtn = $('.cp-video-dialog__close', dialog);
    if (closeBtn) closeBtn.addEventListener('click', closeDialog);
    dialog.addEventListener('click', function (e) { if (e.target === dialog) closeDialog(); });
    dialog.addEventListener('close', function () { dialogBody.replaceChildren(); });
  }

  /* ---------- FAQ: open the reference list when a citation is followed ---------- */
  $$('.cp-faq__body sup a').forEach(function (a) {
    a.addEventListener('click', function () {
      var refs = $('#faq-refs');
      if (refs) refs.open = true;
    });
  });

  var year = $('#cpYear');
  if (year) year.textContent = new Date().getFullYear();
})();
