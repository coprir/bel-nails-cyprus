(function () {
  'use strict';

  /* ==========================================================================
     PORTFOLIO DATA
     ----------------------------------------------------------------------
     Empty by design: no Bel Nails portfolio photography is publicly available
     yet (verified against @belnails.cy on Instagram, which has one "opening
     soon" post and no published nail-art gallery). Every interactive feature
     below — filters, the style quiz, wishlist, "Inspire Me", the full-screen
     viewer — is fully wired to this array and will light up automatically
     the moment real, tagged photos are added.

     Add entries like this:
     {
       id: 'design-01',
       src: 'images/portfolio/design-01.jpg',
       alt: 'Short almond nails, glossy nude',
       style: ['minimal', 'classic'],       // see FACETS.style values below
       shape: 'almond',                     // see FACETS.shape values
       length: 'short',                     // see FACETS.length values
       finish: 'glossy',                    // see FACETS.finish values
       color: ['nude'],                     // see FACETS.color values
       artStyle: 'minimal',                 // see ART_STYLE_OPTIONS values
       service: 'Gel-X',                    // Acrylic | Builder Gel | Gel-X
       priceLabel: ''                       // e.g. '€35' once pricing is confirmed
     }
     ========================================================================== */
  var portfolioItems = [];

  /* ==========================================================================
     OPTION DEFINITIONS
     ========================================================================== */

  var MOOD_OPTIONS = [
    { value: 'minimal', label: 'Minimal', icon: 'icon-line-art' },
    { value: 'clean-girl', label: 'Clean Girl', icon: 'icon-check' },
    { value: 'classic', label: 'Classic', icon: 'icon-crescent' },
    { value: 'luxury', label: 'Luxury', icon: 'icon-gem' },
    { value: 'glam', label: 'Glam', icon: 'icon-sparkle' },
    { value: 'cute', label: 'Cute', icon: 'icon-flower' },
    { value: 'bold', label: 'Bold', icon: 'icon-swirl' },
    { value: 'artistic', label: 'Artistic', icon: 'icon-cube' },
    { value: 'romantic', label: 'Romantic', icon: 'icon-flower' },
    { value: 'seasonal', label: 'Seasonal', icon: 'icon-sparkle' }
  ];

  var SHAPE_OPTIONS = [
    { value: 'almond', label: 'Almond' },
    { value: 'oval', label: 'Oval' },
    { value: 'square', label: 'Square' },
    { value: 'squoval', label: 'Squoval' },
    { value: 'coffin', label: 'Coffin' },
    { value: 'stiletto', label: 'Stiletto' }
  ];

  var LENGTH_OPTIONS = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' },
    { value: 'extra-long', label: 'Extra Long' }
  ];

  var FINISH_OPTIONS = [
    { value: 'glossy', label: 'Glossy' },
    { value: 'matte', label: 'Matte' },
    { value: 'chrome', label: 'Chrome' },
    { value: 'french', label: 'French' },
    { value: 'glitter', label: 'Glitter' },
    { value: 'pearl', label: 'Pearl' },
    { value: 'metallic', label: 'Metallic' },
    { value: 'cat-eye', label: 'Cat Eye' }
  ];

  var COLOR_OPTIONS = [
    { value: 'nude', label: 'Nude' },
    { value: 'pink', label: 'Pink' },
    { value: 'red', label: 'Red' },
    { value: 'black', label: 'Black' },
    { value: 'brown', label: 'Brown' },
    { value: 'blue', label: 'Blue' },
    { value: 'purple', label: 'Purple' },
    { value: 'green', label: 'Green' },
    { value: 'metallic', label: 'Metallic' }
  ];

  var ART_STYLE_OPTIONS = [
    { value: 'french', label: 'French', icon: 'icon-crescent' },
    { value: 'minimal', label: 'Minimal', icon: 'icon-line-art' },
    { value: 'floral', label: 'Floral', icon: 'icon-flower' },
    { value: 'abstract', label: 'Abstract', icon: 'icon-swirl' },
    { value: 'chrome', label: 'Chrome', icon: 'icon-sparkle' },
    { value: 'rhinestones', label: 'Rhinestones', icon: 'icon-gem' },
    { value: '3d', label: '3D', icon: 'icon-cube' },
    { value: 'animal-print', label: 'Animal Print', icon: 'icon-paw' },
    { value: 'line-art', label: 'Line Art', icon: 'icon-line-art' },
    { value: 'no-art', label: 'No Nail Art', icon: 'icon-ban' }
  ];

  var QUIZ_STEPS = [
    { key: 'mood', options: MOOD_OPTIONS },
    { key: 'shape', options: SHAPE_OPTIONS },
    { key: 'length', options: LENGTH_OPTIONS },
    { key: 'finish', options: FINISH_OPTIONS },
    { key: 'color', options: COLOR_OPTIONS },
    { key: 'artStyle', options: ART_STYLE_OPTIONS }
  ];

  var FACETS = [
    { key: 'style', options: [
      { value: 'minimal', label: 'Minimal' },
      { value: 'glam', label: 'Glam' },
      { value: 'classic', label: 'Classic' },
      { value: 'bold', label: 'Bold' },
      { value: 'cute', label: 'Cute' },
      { value: 'luxury', label: 'Luxury' }
    ]},
    { key: 'shape', options: SHAPE_OPTIONS },
    { key: 'color', options: COLOR_OPTIONS, swatch: true },
    { key: 'finish', options: FINISH_OPTIONS },
    { key: 'length', options: LENGTH_OPTIONS }
  ];

  var COLOR_HEX = {
    nude: '#e3c9b6', pink: '#e8a0bb', red: '#af182e', black: '#1a1512',
    brown: '#6b4a3a', blue: '#5c7aa0', purple: '#7b5ea7', green: '#5c7a5e',
    metallic: 'linear-gradient(135deg,#cf9b3f,#e7e7ea,#a9772a)'
  };

  /* Loosely maps the 10-value quiz mood to the 6-value portfolio "style" facet */
  var MOOD_TO_STYLE = {
    minimal: 'minimal', 'clean-girl': 'minimal', classic: 'classic',
    luxury: 'luxury', glam: 'glam', cute: 'cute', bold: 'bold',
    artistic: 'glam', romantic: 'cute', seasonal: 'bold'
  };

  /* ==========================================================================
     STORAGE HELPERS
     ========================================================================== */

  var SAVED_KEY = 'belnails:savedLooks';
  var HANDOFF_KEY = 'belnails:bookingLook';

  function readSaved() {
    try {
      return JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
    } catch (e) { return []; }
  }
  function writeSaved(list) {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function isSaved(id) {
    return readSaved().some(function (l) { return l.id === id; });
  }
  function toggleSaved(look) {
    var list = readSaved();
    var idx = list.findIndex(function (l) { return l.id === look.id; });
    if (idx > -1) { list.splice(idx, 1); } else { list.unshift(look); }
    writeSaved(list);
    renderSavedBadge();
    renderDrawer();
    syncHeartButtons();
    return idx === -1;
  }
  function removeSaved(id) {
    writeSaved(readSaved().filter(function (l) { return l.id !== id; }));
    renderSavedBadge();
    renderDrawer();
    syncHeartButtons();
  }

  function setHandoff(look) {
    try { sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(look)); } catch (e) {}
    renderBookingLookCard();
  }
  function getHandoff() {
    try { return JSON.parse(sessionStorage.getItem(HANDOFF_KEY)); } catch (e) { return null; }
  }
  function clearHandoff() {
    try { sessionStorage.removeItem(HANDOFF_KEY); } catch (e) {}
    renderBookingLookCard();
  }

  /* ==========================================================================
     ICON HELPER
     ========================================================================== */

  function iconSvg(id, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '"><use href="#' + id + '"></use></svg>';
  }

  function labelFor(list, value) {
    var found = list.filter(function (o) { return o.value === value; })[0];
    return found ? found.label : value;
  }

  /* ==========================================================================
     REVEAL ON SCROLL
     ========================================================================== */

  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });

    /* Editorial line-by-line reveal (brand statement, etc.) — same trigger,
       but each line gets a small stagger relative to its siblings. */
    document.querySelectorAll('.reveal-line').forEach(function (el) {
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
        return c.classList.contains('reveal-line');
      });
      var index = siblings.indexOf(el);
      el.style.transitionDelay = (index * 90) + 'ms';
    });
    var lineIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          lineIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.reveal-line').forEach(function (el) { lineIo.observe(el); });
  }

  /* ==========================================================================
     HEADER + MOBILE MENU
     ========================================================================== */

  /* ==========================================================================
     CUSTOM CURSOR — desktop / fine-pointer only, built entirely here so no
     page markup is needed. Disabled on touch and prefers-reduced-motion.
     ========================================================================== */

  function initCursor() {
    var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    document.documentElement.classList.add('has-custom-cursor');

    var dot = document.createElement('div');
    dot.className = 'bn-cursor-dot';
    var ring = document.createElement('div');
    ring.className = 'bn-cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var dotX = 0, dotY = 0, ringX = 0, ringY = 0;
    var visible = false;

    function loop() {
      ringX += (dotX - ringX) * 0.2;
      ringY += (dotY - ringY) * 0.2;
      ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.addEventListener('mousemove', function (e) {
      dotX = e.clientX; dotY = e.clientY;
      dot.style.transform = 'translate(' + dotX + 'px,' + dotY + 'px) translate(-50%,-50%)';
      if (!visible) { visible = true; ring.classList.add('is-visible'); }
    });
    document.addEventListener('mouseleave', function () { ring.classList.remove('is-visible'); });

    document.addEventListener('mouseover', function (e) {
      var labelTarget = e.target.closest && e.target.closest('[data-cursor]');
      var interactive = e.target.closest && e.target.closest('a, button, input, select, textarea, [role="button"], .option-card, .facet-pill, .mood-chip, .tryon-card, .portfolio-item');
      if (labelTarget) {
        ring.textContent = labelTarget.dataset.cursor.toUpperCase();
        ring.classList.add('is-label');
        ring.classList.remove('is-expanded');
      } else if (interactive) {
        ring.textContent = '';
        ring.classList.add('is-expanded');
        ring.classList.remove('is-label');
      }
    });
    document.addEventListener('mouseout', function (e) {
      var toInteractive = e.relatedTarget && e.relatedTarget.closest &&
        e.relatedTarget.closest('a, button, input, select, textarea, [role="button"], [data-cursor], .option-card, .facet-pill, .mood-chip, .tryon-card, .portfolio-item');
      if (!toInteractive) {
        ring.classList.remove('is-expanded', 'is-label');
        ring.textContent = '';
      }
    });
  }

  /* ==========================================================================
     LOADING SCREEN — home page only, once per browser session.
     ========================================================================== */

  function initLoader() {
    if (document.body.dataset.page !== 'home') return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || sessionStorage.getItem('belnails:loaded')) return;

    var loader = document.createElement('div');
    loader.className = 'bn-loader';
    loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML =
      '<span class="bn-loader__word">Bel Nails</span>' +
      '<span class="bn-loader__word bn-loader__word--sub">Cyprus</span>';
    document.body.appendChild(loader);
    document.body.style.overflow = 'hidden';

    function dismiss() {
      loader.classList.add('is-hidden');
      document.body.style.overflow = '';
      try { sessionStorage.setItem('belnails:loaded', '1'); } catch (e) {}
      setTimeout(function () { loader.remove(); }, 550);
    }
    var timer = setTimeout(dismiss, 1100);
    loader.addEventListener('click', function () { clearTimeout(timer); dismiss(); });
  }

  /* ==========================================================================
     SUBTLE CURSOR PARALLAX — [data-parallax] elements drift slightly toward
     the pointer. Fine-pointer + motion-safe only.
     ========================================================================== */

  function initParallax() {
    var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var els = document.querySelectorAll('[data-parallax]');
    if (!fine || reduced || !els.length) return;

    document.addEventListener('mousemove', function (e) {
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      var dx = (e.clientX - cx) / cx, dy = (e.clientY - cy) / cy;
      els.forEach(function (el) {
        el.style.transform = 'translate(' + (dx * -10) + 'px,' + (dy * -8) + 'px)';
      });
    });
  }

  function initHeader() {
    var header = document.getElementById('siteHeader');
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('mobileMenu');

    window.addEventListener('scroll', function () {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    }, { passive: true });

    toggle.addEventListener('click', function () {
      var open = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });

    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    var page = document.body.dataset.page;
    if (page) {
      document.querySelectorAll('[data-nav-page="' + page + '"]').forEach(function (a) {
        a.classList.add('is-active');
      });
    }
  }

  /* ==========================================================================
     PORTFOLIO — facets, grid, wishlist, viewer, inspire me
     ========================================================================== */

  var activeFilters = {}; // { style: Set, shape: Set, ... }
  FACETS.forEach(function (f) { activeFilters[f.key] = new Set(); });

  var currentGridItems = [];

  function buildFacetPills() {
    FACETS.forEach(function (facet) {
      var group = document.querySelector('.facet-group[data-facet="' + facet.key + '"]');
      if (!group) return;
      facet.options.forEach(function (opt) {
        var pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'facet-pill';
        pill.dataset.facet = facet.key;
        pill.dataset.value = opt.value;
        var swatchHtml = '';
        if (facet.swatch) {
          var bg = COLOR_HEX[opt.value] || opt.value;
          swatchHtml = '<span class="facet-swatch" style="background:' + bg + '"></span>';
        }
        pill.innerHTML = swatchHtml + '<span>' + opt.label + '</span>';
        pill.addEventListener('click', function () {
          toggleFacet(facet.key, opt.value, pill);
        });
        group.appendChild(pill);
      });
    });
  }

  function toggleFacet(facetKey, value, pillEl) {
    var set = activeFilters[facetKey];
    if (set.has(value)) { set.delete(value); pillEl.classList.remove('is-active'); }
    else { set.add(value); pillEl.classList.add('is-active'); }
    renderPortfolioGrid();
    renderActiveCombo();
  }

  function clearFacets() {
    FACETS.forEach(function (f) { activeFilters[f.key].clear(); });
    document.querySelectorAll('.facet-pill.is-active').forEach(function (p) { p.classList.remove('is-active'); });
    renderPortfolioGrid();
    renderActiveCombo();
  }

  function hasActiveFilters() {
    return FACETS.some(function (f) { return activeFilters[f.key].size > 0; });
  }

  function renderActiveCombo() {
    var el = document.getElementById('activeCombo');
    var clearBtn = document.getElementById('clearFiltersBtn');
    if (!hasActiveFilters()) { el.hidden = true; clearBtn.hidden = true; return; }
    var parts = [];
    FACETS.forEach(function (f) {
      activeFilters[f.key].forEach(function (v) { parts.push(labelFor(f.options, v)); });
    });
    el.innerHTML = 'Showing designs matching <strong>' + parts.join(' + ') + '</strong>';
    el.hidden = false;
    clearBtn.hidden = false;
  }

  function matchesFilters(item) {
    return FACETS.every(function (f) {
      var set = activeFilters[f.key];
      if (set.size === 0) return true;
      var val = item[f.key];
      if (Array.isArray(val)) return val.some(function (v) { return set.has(v); });
      return set.has(val);
    });
  }

  function renderPortfolioGrid() {
    var grid = document.getElementById('portfolioGrid');
    if (!grid) return;
    var items = portfolioItems.filter(matchesFilters);
    currentGridItems = items;
    grid.innerHTML = '';

    if (items.length === 0) {
      var filtered = hasActiveFilters();
      var empty = document.createElement('div');
      empty.className = 'portfolio-empty';
      empty.innerHTML =
        '<div class="icon-circle">' + iconSvg('icon-camera') + '</div>' +
        '<h3>' + (filtered ? 'No designs match yet' : 'New work is being added') + '</h3>' +
        '<p>' + (filtered
          ? 'We don\'t have a tagged design for that combination yet — follow along on Instagram, or try a different mix of filters.'
          : 'Follow @belnails.cy on Instagram to see the latest nail designs, or check back here soon.') + '</p>' +
        '<a class="btn btn--outline-ink btn--sm" href="https://www.instagram.com/belnails.cy/" target="_blank" rel="noopener">View on Instagram</a>';
      grid.appendChild(empty);
      return;
    }

    items.forEach(function (item, index) {
      grid.appendChild(buildPortfolioCard(item, index));
    });
  }

  function buildPortfolioCard(item, index) {
    var wrap = document.createElement('figure');
    wrap.className = 'portfolio-card';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'portfolio-item';
    btn.setAttribute('aria-label', 'View ' + (item.alt || item.id));
    btn.innerHTML = item.src
      ? '<img src="' + item.src + '" alt="' + (item.alt || '') + '" loading="lazy">'
      : '<div class="portfolio-empty" style="padding:2.5rem 1rem">' + iconSvg('icon-camera') + '</div>';
    btn.addEventListener('click', function () { openViewer(item); });

    var num = typeof index === 'number' ? String(index + 1).padStart(3, '0') : null;
    var caption = document.createElement('figcaption');
    caption.innerHTML = (num ? '<span class="portfolio-card__num">BN / ' + num + '</span> ' : '') +
      (labelFor(FACETS[0].options, (item.style || [])[0] || '') || item.service || '');
    if (item.src) btn.appendChild(caption);

    var heart = document.createElement('button');
    heart.type = 'button';
    heart.className = 'wishlist-heart' + (isSaved(item.id) ? ' is-saved' : '');
    heart.dataset.id = item.id;
    heart.setAttribute('aria-label', 'Save this design to My Saved Looks');
    heart.innerHTML = iconSvg('icon-heart');
    heart.addEventListener('click', function (e) {
      e.stopPropagation();
      var saved = toggleSaved(lookFromItem(item));
      heart.classList.toggle('is-saved', saved);
    });

    wrap.appendChild(btn);
    wrap.appendChild(heart);
    return wrap;
  }

  function syncHeartButtons() {
    document.querySelectorAll('.wishlist-heart').forEach(function (h) {
      h.classList.toggle('is-saved', isSaved(h.dataset.id));
    });
  }

  function lookFromItem(item) {
    return {
      id: item.id,
      type: 'portfolio',
      title: labelFor(FACETS[0].options, (item.style || [])[0] || '') || 'Bel Nails design',
      img: item.src || null,
      meta: {
        shape: item.shape, length: item.length, finish: item.finish,
        color: (item.color || [])[0], artStyle: item.artStyle
      },
      service: item.service || null,
      ts: Date.now()
    };
  }

  /* ---- Inspire Me ---- */

  function initInspire() {
    var btn = document.getElementById('inspireBtn');
    if (!btn) return;
    var panel = document.getElementById('inspirePanel');
    var title = document.getElementById('inspireTitle');
    var body = document.getElementById('inspireBody');
    var bookBtn = document.getElementById('inspireBookBtn');

    btn.addEventListener('click', function () {
      panel.classList.remove('is-visible');
      void panel.offsetWidth; // restart animation
      var pool = currentGridItems.length ? currentGridItems : portfolioItems;
      var pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;

      if (pick) {
        title.textContent = 'This could be your next set.';
        body.textContent = (labelFor(FACETS[0].options, (pick.style || [])[0]) || 'This design') +
          ' — ' + (pick.priceLabel || 'ask for pricing') + '.';
        bookBtn.onclick = function (e) { e.preventDefault(); handoffAndBook(lookFromItem(pick)); };
      } else {
        title.textContent = "We're still building the portfolio.";
        body.textContent = "There isn't a photographed design to show yet — follow @belnails.cy on Instagram for the newest work, or use Find Your Style to describe what you're after.";
        bookBtn.onclick = function (e) {
          e.preventDefault();
          window.location.href = 'style-finder.html';
        };
      }
      panel.classList.add('is-visible');
    });
  }

  /* ---- Full-screen viewer ---- */

  var viewerIndex = -1;

  function openViewer(item) {
    var pool = currentGridItems.length ? currentGridItems : portfolioItems;
    viewerIndex = pool.indexOf(item);
    if (viewerIndex === -1) { pool = [item]; viewerIndex = 0; }
    renderViewer(pool[viewerIndex], pool);
    document.getElementById('viewer').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeViewer() {
    document.getElementById('viewer').classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function renderViewer(item, pool) {
    var img = document.getElementById('viewerImage');
    img.innerHTML = item.src
      ? '<img src="' + item.src + '" alt="' + (item.alt || '') + '">'
      : iconSvg('icon-camera');

    document.getElementById('viewerEyebrow').textContent = item.src ? 'Design' : 'Photo coming soon';
    document.getElementById('viewerTitle').textContent = labelFor(FACETS[0].options, (item.style || [])[0]) || 'Bel Nails design';
    document.getElementById('viewerStyle').textContent = (item.style || []).map(function (s) { return labelFor(FACETS[0].options, s); }).join(', ') || '—';
    document.getElementById('viewerShape').textContent = labelFor(SHAPE_OPTIONS, item.shape) || '—';
    document.getElementById('viewerFinish').textContent = labelFor(FINISH_OPTIONS, item.finish) || '—';
    document.getElementById('viewerColor').textContent = (item.color || []).map(function (c) { return labelFor(COLOR_OPTIONS, c); }).join(', ') || '—';
    document.getElementById('viewerService').textContent = item.service || '—';
    document.getElementById('viewerPrice').textContent = item.priceLabel || 'Ask for pricing';

    document.getElementById('viewerBookBtn').onclick = function () {
      closeViewer();
      handoffAndBook(lookFromItem(item));
    };

    document.getElementById('viewerPrev').style.visibility = pool.length > 1 ? 'visible' : 'hidden';
    document.getElementById('viewerNext').style.visibility = pool.length > 1 ? 'visible' : 'hidden';
  }

  function stepViewer(dir) {
    var pool = currentGridItems.length ? currentGridItems : portfolioItems;
    if (!pool.length) return;
    viewerIndex = (viewerIndex + dir + pool.length) % pool.length;
    renderViewer(pool[viewerIndex], pool);
  }

  function initViewer() {
    if (!document.getElementById('viewer')) return;
    document.getElementById('viewerClose').addEventListener('click', closeViewer);
    document.getElementById('viewerPrev').addEventListener('click', function () { stepViewer(-1); });
    document.getElementById('viewerNext').addEventListener('click', function () { stepViewer(1); });

    document.addEventListener('keydown', function (e) {
      if (!document.getElementById('viewer').classList.contains('is-open')) return;
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowLeft') stepViewer(-1);
      if (e.key === 'ArrowRight') stepViewer(1);
    });

    var startX = null;
    var stage = document.querySelector('.viewer-body');
    stage.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) stepViewer(dx > 0 ? -1 : 1);
      startX = null;
    });
  }

  /* ==========================================================================
     NAIL STYLE CONFIGURATOR (quiz)
     ========================================================================== */

  var STEP_KEYS = QUIZ_STEPS.map(function (s) { return s.key; }).concat(['result']);
  var quizAnswers = {};
  var stepIndex = 0;

  function optionSwatchHtml(stepKey, opt) {
    switch (stepKey) {
      case 'mood':
        return '<span class="art-icon">' + iconSvg(opt.icon) + '</span>';
      case 'shape':
        return '<span class="shape-swatch shape-swatch--' + opt.value + '"></span>';
      case 'length':
        return '<span class="length-swatch length-swatch--' + opt.value + '"></span>';
      case 'finish':
        return '<span class="finish-swatch finish-swatch--' + opt.value + '"></span>';
      case 'color':
        var bg = COLOR_HEX[opt.value];
        return '<span class="color-swatch" style="background:' + bg + '"></span>';
      case 'artStyle':
        return '<span class="art-icon">' + iconSvg(opt.icon) + '</span>';
      default:
        return '';
    }
  }

  function buildConfigurator() {
    var progress = document.getElementById('configuratorProgress');
    if (!progress) return;
    QUIZ_STEPS.forEach(function (s, i) {
      var seg = document.createElement('div');
      seg.className = 'configurator-progress__seg';
      seg.dataset.index = i;
      seg.innerHTML = '<span></span>';
      progress.appendChild(seg);
    });

    // option grids
    QUIZ_STEPS.forEach(function (step) {
      var grid = document.querySelector('.option-grid[data-options="' + step.key + '"]');
      step.options.forEach(function (opt) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'option-card';
        card.dataset.value = opt.value;
        card.innerHTML = optionSwatchHtml(step.key, opt) + '<span class="option-card__label">' + opt.label + '</span>';
        card.addEventListener('click', function () { selectOption(step.key, opt.value, grid, card); });
        grid.appendChild(card);
      });
    });

    document.getElementById('configuratorBack').addEventListener('click', function () {
      if (stepIndex > 0) goToStep(stepIndex - 1);
    });

    document.getElementById('saveLookBtn').addEventListener('click', saveCurrentQuizLook);
    document.getElementById('bookLookBtn').addEventListener('click', function () {
      handoffAndBook(lookFromQuiz());
    });
    var shareBtn = document.getElementById('shareLookBtn');
    if (shareBtn) shareBtn.addEventListener('click', function () { shareLook(lookFromQuiz(), shareBtn); });
    document.getElementById('restartQuizBtn').addEventListener('click', function () {
      quizAnswers = {};
      currentLookNumber = null;
      document.querySelectorAll('.option-card.is-selected').forEach(function (c) { c.classList.remove('is-selected'); });
      goToStep(0);
    });

    updateProgress();
  }

  function selectOption(stepKey, value, grid, card) {
    quizAnswers[stepKey] = value;
    grid.querySelectorAll('.option-card').forEach(function (c) { c.classList.remove('is-selected'); });
    card.classList.add('is-selected');
    setTimeout(function () {
      if (stepIndex < STEP_KEYS.length - 2) goToStep(stepIndex + 1);
      else renderResult();
    }, 260);
  }

  function goToStep(index) {
    stepIndex = index;
    document.querySelectorAll('.configurator-step').forEach(function (el) {
      el.classList.toggle('is-active', el.dataset.step === STEP_KEYS[index]);
    });
    document.getElementById('configuratorBack').classList.toggle('is-visible', index > 0);
    updateProgress();
  }

  function updateProgress() {
    document.querySelectorAll('.configurator-progress__seg').forEach(function (seg) {
      var i = Number(seg.dataset.index);
      seg.classList.toggle('is-done', i < stepIndex);
      seg.classList.toggle('is-current', i === stepIndex);
    });
  }

  function scoreItem(item) {
    var score = 0;
    if (quizAnswers.shape && item.shape === quizAnswers.shape) score += 2;
    if (quizAnswers.length && item.length === quizAnswers.length) score += 1;
    if (quizAnswers.finish && item.finish === quizAnswers.finish) score += 2;
    if (quizAnswers.color && (item.color || []).indexOf(quizAnswers.color) > -1) score += 2;
    if (quizAnswers.artStyle && item.artStyle === quizAnswers.artStyle) score += 1;
    var mappedStyle = MOOD_TO_STYLE[quizAnswers.mood];
    if (mappedStyle && (item.style || []).indexOf(mappedStyle) > -1) score += 2;
    return score;
  }

  var currentLookNumber = null;

  function renderResult() {
    goToStep(STEP_KEYS.length - 1);

    if (!currentLookNumber) currentLookNumber = String(Math.floor(Math.random() * 899) + 1).padStart(3, '0');
    var numEl = document.getElementById('resultLookNumber');
    if (numEl) numEl.textContent = 'Look / ' + currentLookNumber;

    var summary = document.getElementById('resultSummary');
    summary.innerHTML = QUIZ_STEPS.map(function (s) {
      if (!quizAnswers[s.key]) return '';
      return '<span class="result-chip">' + labelFor(s.options, quizAnswers[s.key]) + '</span>';
    }).join('');

    var grid = document.getElementById('resultGrid');
    grid.innerHTML = '';
    var ranked = portfolioItems.map(function (i) { return { item: i, score: scoreItem(i) }; })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 6)
      .map(function (r) { return r.item; });

    currentGridItems = ranked;

    if (!ranked.length) {
      var empty = document.createElement('div');
      empty.className = 'portfolio-empty';
      empty.style.gridColumn = '1 / -1';
      empty.innerHTML =
        '<div class="icon-circle">' + iconSvg('icon-sparkle') + '</div>' +
        '<h3>Your look is ready to book</h3>' +
        '<p>We don\'t have a photographed match for this exact combination yet, but your preferences are saved below — the studio can bring this look to life once you\'re booked in.</p>';
      grid.appendChild(empty);
      return;
    }
    ranked.forEach(function (item, index) { grid.appendChild(buildPortfolioCard(item, index)); });
  }

  function lookFromQuiz() {
    var titleParts = [labelFor(MOOD_OPTIONS, quizAnswers.mood), labelFor(SHAPE_OPTIONS, quizAnswers.shape)].filter(Boolean);
    return {
      id: 'quiz-' + Date.now(),
      type: 'quiz',
      title: titleParts.join(' ') || 'Your Bel Nails look',
      img: null,
      meta: {
        mood: quizAnswers.mood, shape: quizAnswers.shape, length: quizAnswers.length,
        finish: quizAnswers.finish, color: quizAnswers.color, artStyle: quizAnswers.artStyle
      },
      service: null,
      ts: Date.now()
    };
  }

  function saveCurrentQuizLook() {
    toggleSaved(lookFromQuiz());
    var btn = document.getElementById('saveLookBtn');
    var original = btn.textContent;
    btn.textContent = 'Saved ✓';
    setTimeout(function () { btn.textContent = original; }, 1600);
  }

  /* Real Web Share API where available (mobile browsers, some desktop);
     falls back to copying a short text summary to the clipboard. Never a
     fake "shared!" toast if neither API is actually available. */
  function shareLook(look, btn) {
    var text = 'My Bel Nails look: ' + look.title + (metaSummary(look) ? ' (' + metaSummary(look) + ')' : '');
    if (navigator.share) {
      navigator.share({ title: 'Bel Nails', text: text, url: location.origin + '/style-finder.html' }).catch(function () {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        if (!btn) return;
        var original = btn.textContent;
        btn.textContent = 'Copied ✓';
        setTimeout(function () { btn.textContent = original; }, 1600);
      }).catch(function () {});
    }
  }

  /* ==========================================================================
     BOOKING HANDOFF
     ========================================================================== */

  function metaSummary(look) {
    if (!look || !look.meta) return '';
    return Object.keys(look.meta).filter(function (k) { return look.meta[k]; })
      .map(function (k) { return look.meta[k]; }).join(' · ');
  }

  /* handoffAndBook is called from portfolio.html, style-finder.html,
     try-on.html and the saved-looks drawer (any page), as well as from
     booking.html itself. It always stores the look in sessionStorage; if
     the booking form isn't on the current page it navigates to
     booking.html, which reads the handoff back out on load. */
  /* Pre-fills the booking form's service select + message from a handed-off
     look. Called both right after handoffAndBook on booking.html itself,
     and on booking.html's own page load (after a cross-page handoff, the
     form doesn't exist yet at the moment handoffAndBook ran). */
  function applyHandoffToForm(look) {
    var select = document.getElementById('bkService');
    if (select && look.service) {
      var opt = Array.prototype.find.call(select.options, function (o) { return o.value === look.service; });
      if (opt) select.value = look.service;
    }
    var message = document.getElementById('bkMessage');
    var summary = metaSummary(look);
    if (message && summary && !message.value) {
      message.value = 'I’d like to book this look: ' + look.title + (summary ? ' (' + summary + ')' : '');
    }
  }

  function handoffAndBook(look) {
    setHandoff(look);
    var form = document.getElementById('bookingForm');
    if (!form) {
      window.location.href = 'booking.html';
      return;
    }
    applyHandoffToForm(look);
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
  }

  function renderBookingLookCard() {
    var card = document.getElementById('bookingLookCard');
    if (!card) return;
    var look = getHandoff();
    if (!look) { card.classList.remove('is-visible'); return; }
    document.getElementById('bookingLookSummary').textContent = look.title + (metaSummary(look) ? ' — ' + metaSummary(look) : '');
    card.classList.add('is-visible');
  }

  /* ==========================================================================
     SERVICES — editorial numbered rows (hover on desktop, tap on mobile)
     ========================================================================== */

  function initServiceRows() {
    document.querySelectorAll('.service-row__toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.service-row');
        var open = !row.classList.contains('is-open');
        document.querySelectorAll('.service-row.is-open').forEach(function (r) {
          if (r !== row) { r.classList.remove('is-open'); }
        });
        row.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  function initBooking() {
    renderBookingLookCard();
    var clearBtn = document.getElementById('bookingLookClear');
    if (clearBtn) clearBtn.addEventListener('click', clearHandoff);

    var existingHandoff = getHandoff();
    if (existingHandoff) applyHandoffToForm(existingHandoff);

    /* .book-service-btn lives on services.html, a different page from the
       booking form — always hand off through handoffAndBook rather than
       touching #bkService directly. */
    document.querySelectorAll('.book-service-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var map = { acrylic: 'Acrylic', 'builder-gel': 'Builder Gel', 'gel-x': 'Gel-X' };
        var label = map[btn.dataset.service] || null;
        handoffAndBook({
          id: 'service-' + btn.dataset.service,
          type: 'service',
          title: (label || 'Service') + ' enquiry',
          img: null,
          meta: {},
          service: label,
          ts: Date.now()
        });
      });
    });

    var backBtn = document.getElementById('bookingSentBack');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        document.getElementById('bookingSent').hidden = true;
        document.getElementById('bookingForm').hidden = false;
      });
    }

    var form = document.getElementById('bookingForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var look = getHandoff();
      var lines = [
        'Name: ' + f.name.value,
        'Email/Phone: ' + f.contact.value,
        'Service: ' + f.service.value,
        'Preferred date: ' + (f.date.value || 'Flexible'),
        look ? 'Attached look: ' + look.title + (metaSummary(look) ? ' (' + metaSummary(look) + ')' : '') : null,
        'Message: ' + (f.message.value || '—')
      ].filter(Boolean).join('%0D%0A');

      var subject = encodeURIComponent('Appointment request — ' + f.name.value);
      // PLACEHOLDER: replace with Bel Nails' confirmed booking email address
      var mailto = 'mailto:hello@belnails.cy?subject=' + subject + '&body=' + lines;
      window.location.href = mailto;

      revealBookingSent(f.service.value, f.date.value);
    });
  }

  /* Shows the honest post-submit state: we opened an email draft, we did
     not actually book anything. Optionally offers a real "Add to Calendar"
     link for the visitor's own reminder, framed as unconfirmed. */
  function revealBookingSent(service, dateValue) {
    var wrap = document.getElementById('bookingForm');
    var sent = document.getElementById('bookingSent');
    if (!wrap || !sent) return;
    wrap.hidden = true;
    sent.hidden = false;
    sent.scrollIntoView({ behavior: 'smooth', block: 'center' });

    var calBtn = document.getElementById('addToCalendarBtn');
    if (!calBtn) return;
    if (!dateValue) { calBtn.hidden = true; return; }
    var ymd = dateValue.replace(/-/g, '');
    var title = encodeURIComponent('Bel Nails — requested appointment (unconfirmed): ' + service);
    var details = encodeURIComponent('Requested via belnails.cy — pending confirmation from Bel Nails.');
    calBtn.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + title +
      '&dates=' + ymd + '/' + ymd + '&details=' + details;
    calBtn.hidden = false;
  }

  /* ==========================================================================
     SAVED LOOKS DRAWER
     ========================================================================== */

  function renderSavedBadge() {
    var count = readSaved().length;
    ['savedBadge', 'bottomSavedBadge'].forEach(function (id) {
      var badge = document.getElementById(id);
      if (!badge) return;
      badge.textContent = String(count);
      badge.classList.toggle('is-visible', count > 0);
    });
  }

  function renderDrawer() {
    var body = document.getElementById('drawerBody');
    var list = readSaved();
    if (!list.length) {
      body.innerHTML = '<div class="drawer-empty">' + iconSvg('icon-heart') +
        '<p>Nothing saved yet. Heart a design in the Lookbook, or save a look from Design Your Set.</p></div>';
      return;
    }
    body.innerHTML = '';
    list.forEach(function (look) {
      var card = document.createElement('div');
      card.className = 'saved-card';
      card.innerHTML =
        '<div class="saved-card__thumb">' + (look.img ? '<img src="' + look.img + '" alt="">' : iconSvg('icon-camera')) + '</div>' +
        '<div class="saved-card__body"><h4>' + look.title + '</h4><p>' + (metaSummary(look) || (look.service || '')) + '</p></div>' +
        '<div class="saved-card__actions">' +
        '<button class="btn btn--ghost" data-action="book" style="font-size:.72rem">Book</button>' +
        '<span class="saved-card__remove" data-action="remove" role="button" tabindex="0" aria-label="Remove">' + iconSvg('icon-close') + '</span>' +
        '</div>';
      card.querySelector('[data-action="book"]').addEventListener('click', function () {
        closeDrawer();
        handoffAndBook(look);
      });
      card.querySelector('[data-action="remove"]').addEventListener('click', function () {
        removeSaved(look.id);
      });
      body.appendChild(card);
    });
    var viewAll = document.createElement('a');
    viewAll.href = 'collection.html';
    viewAll.className = 'btn btn--ghost drawer-viewall';
    viewAll.textContent = 'View full collection';
    body.appendChild(viewAll);
  }

  /* ==========================================================================
     YOUR COLLECTION — dedicated saved-looks page
     ========================================================================== */

  function initCollectionPage() {
    var grid = document.getElementById('collectionGrid');
    var emptyState = document.getElementById('collectionEmpty');
    if (!grid || !emptyState) return;

    function render() {
      var list = readSaved();
      emptyState.hidden = list.length > 0;
      grid.hidden = list.length === 0;
      grid.innerHTML = '';

      list.forEach(function (look) {
        var card = document.createElement('article');
        card.className = 'collection-card';
        card.innerHTML =
          '<div class="collection-card__media">' + (look.img ? '<img src="' + look.img + '" alt="">' : iconSvg('icon-camera')) + '</div>' +
          '<div class="collection-card__body">' +
          '<h3>' + look.title + '</h3>' +
          '<p>' + (metaSummary(look) || (look.service || '')) + '</p>' +
          '<div class="collection-card__actions">' +
          '<button class="btn btn--outline-ink btn--sm" data-action="book" data-cursor="book">Book This Look</button>' +
          '<button class="btn btn--ghost" data-action="share">Share</button>' +
          '<span class="collection-card__remove" data-action="remove" role="button" tabindex="0" aria-label="Remove from collection">' + iconSvg('icon-close') + '</span>' +
          '</div></div>';
        card.querySelector('[data-action="book"]').addEventListener('click', function () { handoffAndBook(look); });
        card.querySelector('[data-action="share"]').addEventListener('click', function (e) { shareLook(look, e.currentTarget); });
        card.querySelector('[data-action="remove"]').addEventListener('click', function () { removeSaved(look.id); render(); });
        grid.appendChild(card);
      });
    }

    render();
  }

  function openDrawer() {
    document.getElementById('savedDrawer').classList.add('is-open');
    document.getElementById('drawerOverlay').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    document.getElementById('savedDrawer').classList.remove('is-open');
    document.getElementById('drawerOverlay').classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function initDrawer() {
    document.getElementById('openSavedBtn').addEventListener('click', function () {
      renderDrawer();
      openDrawer();
    });
    document.getElementById('closeDrawerBtn').addEventListener('click', closeDrawer);
    document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.getElementById('savedDrawer').classList.contains('is-open')) closeDrawer();
    });
  }

  /* ==========================================================================
     TRY YOUR LOOK — design picker + live camera preview
     ----------------------------------------------------------------------
     No AR nail overlay: that would require real hand-tracking/segmentation,
     which isn't something to fake. This gives a genuine live camera feed
     (nothing recorded, uploaded or sent anywhere) alongside a selected
     design or custom colour, so the pattern is real end-to-end.
     ========================================================================== */

  var TRYON_STYLE_FILTERS = [{ value: 'all', label: 'All' }].concat(FACETS[0].options);
  var tryonActiveFilter = 'all';
  var tryonSelection = null; // { kind: 'item', item } | { kind: 'color', hex, label }
  var tryonStream = null;

  function buildTryOnFilters() {
    var row = document.getElementById('tryonFilters');
    TRYON_STYLE_FILTERS.forEach(function (opt) {
      var pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'tryon-filter-pill' + (opt.value === 'all' ? ' is-active' : '');
      pill.textContent = opt.label;
      pill.addEventListener('click', function () {
        tryonActiveFilter = opt.value;
        row.querySelectorAll('.tryon-filter-pill').forEach(function (p) { p.classList.remove('is-active'); });
        pill.classList.add('is-active');
        renderTryonList();
      });
      row.appendChild(pill);
    });
  }

  function renderTryonList() {
    var list = document.getElementById('tryonList');
    var items = portfolioItems.filter(function (item) {
      return tryonActiveFilter === 'all' || (item.style || []).indexOf(tryonActiveFilter) > -1;
    });
    list.innerHTML = '';

    if (!items.length) {
      var empty = document.createElement('div');
      empty.className = 'tryon-list-empty';
      empty.innerHTML = portfolioItems.length
        ? "No designs tagged “" + labelFor(TRYON_STYLE_FILTERS, tryonActiveFilter) + "” yet."
        : 'Designs will appear here once Bel Nails photography is added — use Custom Colour in the meantime.';
      list.appendChild(empty);
      return;
    }

    items.forEach(function (item) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'tryon-card';
      var swatchColor = COLOR_HEX[(item.color || [])[0]] || 'var(--blush)';
      card.innerHTML =
        '<span class="tryon-card__swatch" style="background:' + (item.src ? '' : swatchColor) + '">' +
        (item.src ? '<img src="' + item.src + '" alt="">' : iconSvg('icon-sparkle')) + '</span>' +
        '<span class="tryon-card__body"><strong>' + (labelFor(FACETS[0].options, (item.style || [])[0]) || 'Design') +
        '</strong><span>' + (item.priceLabel || 'Ask for pricing') + '</span></span>' +
        '<span class="tryon-card__heart' + (isSaved(item.id) ? ' is-saved' : '') + '" role="button" aria-label="Save this design">' + iconSvg('icon-heart') + '</span>';

      card.querySelector('.tryon-card__heart').addEventListener('click', function (e) {
        e.stopPropagation();
        var saved = toggleSaved(lookFromItem(item));
        e.currentTarget.classList.toggle('is-saved', saved);
      });
      card.addEventListener('click', function () { selectTryonItem(item, card); });
      list.appendChild(card);
    });
  }

  function clearTryonSelectionStyles() {
    document.querySelectorAll('.tryon-card.is-selected').forEach(function (c) { c.classList.remove('is-selected'); });
    document.querySelectorAll('.tryon-quick-pick.is-selected').forEach(function (c) { c.classList.remove('is-selected'); });
  }

  function selectTryonItem(item, cardEl) {
    clearTryonSelectionStyles();
    if (cardEl) cardEl.classList.add('is-selected');
    tryonSelection = { kind: 'item', item: item };

    var name = labelFor(FACETS[0].options, (item.style || [])[0]) || 'Bel Nails design';
    document.getElementById('tryonSelectionName').textContent = name;
    document.getElementById('tryonSelectionDesc').textContent =
      [labelFor(SHAPE_OPTIONS, item.shape), labelFor(FINISH_OPTIONS, item.finish)].filter(Boolean).join(' · ') || 'Selected from the Bel Nails portfolio.';

    var dotColor = COLOR_HEX[(item.color || [])[0]] || '#9c1245';
    updateTryonIndicator(dotColor, name);
    updateTryonPrice(item.priceLabel || 'Ask for pricing', item.service || '');
  }

  function selectTryonColor(hex, label, pickEl) {
    clearTryonSelectionStyles();
    if (pickEl) pickEl.classList.add('is-selected');
    tryonSelection = { kind: 'color', hex: hex, label: label };

    document.getElementById('tryonSelectionName').textContent = label + ' — custom colour';
    document.getElementById('tryonSelectionDesc').textContent = 'Your own colour choice, previewed live on camera.';
    updateTryonIndicator(hex, label);
    updateTryonPrice('Ask for pricing', 'Colour match in studio');
  }

  function updateTryonIndicator(color, label) {
    var indicator = document.getElementById('tryonSelectedIndicator');
    document.getElementById('tryonSelectedDot').style.background = color;
    document.getElementById('tryonSelectedLabel').textContent = label;
    indicator.hidden = false;
  }

  function updateTryonPrice(price, meta) {
    var card = document.getElementById('tryonPriceCard');
    document.getElementById('tryonPriceLabel').textContent = price;
    document.getElementById('tryonPriceMeta').textContent = meta;
    card.hidden = false;
  }

  function initTryOnTabs() {
    document.querySelectorAll('.tryon-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tryon-tab').forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        document.querySelectorAll('.tryon-panel').forEach(function (p) {
          p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab);
        });
      });
    });
  }

  function initTryOnCustomColor() {
    var picker = document.getElementById('tryonColorPicker');
    var hexSwatch = document.getElementById('tryonHexSwatch');
    var hexValue = document.getElementById('tryonHexValue');
    var picksRow = document.getElementById('tryonQuickPicks');

    function applyHex(hex) {
      hexSwatch.style.background = hex;
      hexValue.textContent = hex.toUpperCase();
    }

    picker.addEventListener('input', function () {
      applyHex(picker.value);
      selectTryonColor(picker.value, 'Custom colour');
    });

    COLOR_OPTIONS.forEach(function (opt) {
      var hex = COLOR_HEX[opt.value];
      var pick = document.createElement('button');
      pick.type = 'button';
      pick.className = 'tryon-quick-pick';
      pick.style.background = hex;
      pick.setAttribute('aria-label', opt.label);
      pick.title = opt.label;
      pick.addEventListener('click', function () {
        applyHex(/^#/.test(hex) ? hex : picker.value);
        if (/^#/.test(hex)) picker.value = hex;
        selectTryonColor(hex, opt.label, pick);
      });
      picksRow.appendChild(pick);
    });
  }

  function initTryOnCamera() {
    var video = document.getElementById('tryonVideo');
    var emptyState = document.getElementById('tryonCameraEmpty');
    var enableBtn = document.getElementById('tryonEnableBtn');
    var stopBtn = document.getElementById('tryonStopBtn');
    var hint = document.getElementById('tryonCameraHint');

    enableBtn.addEventListener('click', function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        hint.textContent = "Your browser doesn't support camera access here.";
        return;
      }
      enableBtn.disabled = true;
      enableBtn.textContent = 'Requesting camera…';
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then(function (stream) {
          tryonStream = stream;
          video.srcObject = stream;
          video.hidden = false;
          emptyState.hidden = true;
          stopBtn.hidden = false;
        })
        .catch(function () {
          enableBtn.disabled = false;
          enableBtn.innerHTML = iconSvg('icon-scan') + ' Enable Camera';
          hint.textContent = 'Camera access was blocked or unavailable — you can still browse designs and book without it.';
        });
    });

    stopBtn.addEventListener('click', function () {
      if (tryonStream) tryonStream.getTracks().forEach(function (t) { t.stop(); });
      tryonStream = null;
      video.hidden = true;
      video.srcObject = null;
      stopBtn.hidden = true;
      emptyState.hidden = false;
      enableBtn.disabled = false;
      enableBtn.innerHTML = iconSvg('icon-scan') + ' Enable Camera';
      hint.textContent = 'Requires camera permission · AR nail overlay coming soon';
    });
  }

  function initTryOnBooking() {
    document.getElementById('tryonBookBtn').addEventListener('click', function (e) {
      if (!tryonSelection) return; // let the default booking.html anchor handle it
      e.preventDefault();
      if (tryonSelection.kind === 'item') {
        handoffAndBook(lookFromItem(tryonSelection.item));
      } else {
        handoffAndBook({
          id: 'custom-color-' + Date.now(),
          type: 'quiz',
          title: tryonSelection.label + ' (custom colour)',
          img: null,
          meta: { color: tryonSelection.hex },
          service: null,
          ts: Date.now()
        });
      }
    });
  }

  function initTryOn() {
    if (!document.getElementById('tryonFilters')) return;
    buildTryOnFilters();
    renderTryonList();
    initTryOnTabs();
    initTryOnCustomColor();
    initTryOnCamera();
    initTryOnBooking();
  }

  /* ==========================================================================
     INIT
     ========================================================================== */

  document.addEventListener('DOMContentLoaded', function () {
    var footerYear = document.getElementById('footerYear');
    if (footerYear) footerYear.textContent = new Date().getFullYear();

    initHeader();
    initReveal();
    initCursor();
    initParallax();
    initLoader();

    buildFacetPills();
    renderPortfolioGrid();
    initInspire();
    initViewer();
    var clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFacets);

    buildConfigurator();
    initTryOn();

    initServiceRows();
    initBooking();
    initDrawer();
    initCollectionPage();
    renderSavedBadge();
  });
})();
