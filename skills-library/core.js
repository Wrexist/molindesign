/* Motion Library core.
 *
 * Demo contract (see demos/README.md):
 *   Lib.register('skill-id', {
 *     hint: 'One line telling the viewer what to do',
 *     notes: ['3–5 numbers or rules worth stealing'],
 *     simplified: 'What this demo leaves out compared with the SKILL.md',
 *     css: '.d-skill-id … { }',          // optional, injected once
 *     mount(stage, ctx) {                 // called once, the first time the stage is near the viewport
 *       return { start(), stop(), scroll(p, v), replay(), destroy() }   // all optional
 *     }
 *   });
 */
(function () {
  'use strict';

  var REPO = 'https://github.com/Wrexist/molindesign/blob/main/.claude/skills/';
  var reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
  var fineMQ = matchMedia('(pointer: fine)');
  var skills = window.SKILLS || [];
  var defs = {};
  var records = {};

  /* ---------------- helpers ---------------- */
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var damp = function (a, b, lambda, dt) { return lerp(a, b, 1 - Math.exp(-lambda * dt)); };
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function loop(fn) {
    var raf = 0, last = 0, running = false;
    function tick(t) {
      raf = requestAnimationFrame(tick);
      var dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016;
      last = t;
      fn(dt, t / 1000);
    }
    return {
      start: function () { if (!running) { running = true; last = 0; raf = requestAnimationFrame(tick); } },
      stop: function () { running = false; cancelAnimationFrame(raf); },
      get running() { return running; }
    };
  }
  function fitCanvas(canvas, box, maxDpr) {
    var r = box.getBoundingClientRect();
    var d = Math.min(window.devicePixelRatio || 1, maxDpr || 2);
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (canvas.width !== Math.round(w * d) || canvas.height !== Math.round(h * d)) {
      canvas.width = Math.round(w * d); canvas.height = Math.round(h * d);
    }
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    return { w: w, h: h, dpr: d };
  }
  var injected = {};
  function css(id, text) {
    if (!text || injected[id]) return;
    injected[id] = true;
    var s = document.createElement('style');
    s.dataset.demo = id;
    s.textContent = text;
    document.head.appendChild(s);
  }

  /* ---------------- audio (web-audio-soundscape) ---------------- */
  var audio = {
    on: false, ctx: null, out: null, _noise: null, _listeners: [], _hoverAt: -9,
    ensure: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        this.out = this.ctx.createGain();
        this.out.gain.value = 0;
        this.out.connect(this.ctx.destination);
      }
      return this.ctx;
    },
    noise: function () {
      var c = this.ensure(); if (!c) return null;
      if (!this._noise) {
        var len = 2 * c.sampleRate;
        this._noise = c.createBuffer(2, len, c.sampleRate);
        for (var ch = 0; ch < 2; ch++) {
          var d = this._noise.getChannelData(ch);
          for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        }
      }
      return this._noise;
    },
    toggle: function (force) {
      var next = typeof force === 'boolean' ? force : !this.on;
      var c = this.ensure(); if (!c) return;
      c.resume();
      this.on = next;
      this.out.gain.setTargetAtTime(next ? 1 : 0, c.currentTime, 0.04);
      this._listeners.forEach(function (fn) { try { fn(next); } catch (e) {} });
    },
    onChange: function (fn) { this._listeners.push(fn); },
    // hover whoosh: band-passed noise, throttled to one per .6 s
    whoosh: function (gain) {
      if (!this.on || !this.ctx) return;
      var c = this.ctx, t = c.currentTime;
      if (t - this._hoverAt < 0.6) return;
      this._hoverAt = t;
      var src = c.createBufferSource(); src.buffer = this.noise();
      var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(1800, t); bp.frequency.linearRampToValueAtTime(4200, t + 0.41);
      var g = c.createGain(); g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain || 0.05, t + 0.06); g.gain.setTargetAtTime(0, t + 0.06, 0.0875);
      src.connect(bp).connect(g).connect(this.out);
      src.start(t, Math.random()); src.stop(t + 0.8);
    }
  };

  /* ---------------- public API ---------------- */
  var Lib = window.Lib = {
    clamp: clamp, lerp: lerp, damp: damp, el: el, loop: loop, fitCanvas: fitCanvas, css: css, audio: audio,
    get reduced() { return reducedMQ.matches; },
    get fine() { return fineMQ.matches; },
    register: function (id, def) {
      defs[id] = def;
      if (def && def.css) css(id, def.css);
      if (records[id]) fillInfo(records[id]);
    }
  };

  /* ---------------- build the page ---------------- */
  var cats = [];
  skills.forEach(function (s) { if (cats.indexOf(s.cat) < 0) cats.push(s.cat); });
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var sourceUrl = function (src) {
    var first = src.split(' · ')[0].trim();
    if (first.indexOf('shopify.com') === 0) return 'https://www.shopify.com/editions/spring2026';
    // package names are not hostnames: send them to the library's own site, or its npm page
    var sites = { sonner: 'https://sonner.emilkowal.ski', vaul: 'https://vaul.emilkowal.ski' };
    if (sites[first]) return sites[first];
    if (first.indexOf('.') < 0) return 'https://www.npmjs.com/package/' + encodeURIComponent(first);
    return 'https://' + first;
  };

  var skillsRoot = document.getElementById('skills');
  var indexList = document.getElementById('index-list');
  var filtersEl = document.getElementById('filters');
  document.getElementById('hero-count').textContent = skills.length;
  document.getElementById('meta-count').textContent = skills.length;
  document.getElementById('hero-n').textContent = skills.length;
  var sourceSet = {};
  skills.forEach(function (s) { s.source.split(' · ').forEach(function (x) { sourceSet[x.trim()] = 1; }); });
  document.getElementById('meta-sources').textContent = Object.keys(sourceSet).length;
  document.querySelector('.rail-of').textContent = '/ ' + skills.length;

  skills.forEach(function (s, i) { s.n = i + 1; });

  cats.forEach(function (cat) {
    var list = skills.filter(function (s) { return s.cat === cat; });
    var head = el('header', 'cat-head');
    head.dataset.cat = cat;
    head.innerHTML = '<h2 class="display">' + cat + '</h2><span class="label">' + pad(list.length) + ' techniques</span>';
    skillsRoot.appendChild(head);

    list.forEach(function (s) {
      var li = el('li');
      li.dataset.id = s.id; li.dataset.cat = s.cat;
      li.innerHTML = '<a href="#' + s.id + '"><span class="num label">' + pad(s.n) + '</span><span class="t">' + s.title +
        '</span><span class="c label">' + s.cat + '</span><span class="arr" aria-hidden="true">→</span></a>';
      indexList.appendChild(li);

      var art = el('article', 'skill');
      art.id = s.id; art.dataset.cat = s.cat;
      art.setAttribute('aria-labelledby', 'h-' + s.id);
      art.innerHTML =
        '<div class="skill-info">' +
          '<p class="label meta"><span class="accent">Nº ' + pad(s.n) + ' / ' + skills.length + '</span><span>' + s.cat + '</span></p>' +
          '<h3 class="display" id="h-' + s.id + '"><span class="lib-mask"><span class="lib-line">' + s.title + '</span></span></h3>' +
          '<p class="short rise">' + s.short + '.</p>' +
          '<p class="hint label rise" hidden></p>' +
          '<ol class="notes rise" hidden></ol>' +
          '<p class="simplified rise" hidden></p>' +
          '<details class="rise"><summary class="label ulink">Full skill summary</summary><p class="desc">' + s.desc + '</p></details>' +
          '<div class="links label rise">' +
            '<a class="ulink" href="' + REPO + s.id + '/SKILL.md" target="_blank" rel="noopener noreferrer"><span class="ar">↗</span>SKILL.md</a>' +
            '<a class="ulink" href="' + sourceUrl(s.source) + '" target="_blank" rel="noopener noreferrer"><span class="ar">↗</span>' + s.source + '</a>' +
          '</div>' +
          '<div class="actions label rise">' +
            '<button type="button" class="act" data-copy="prompt"><span class="act-t">Copy prompt</span></button>' +
            '<button type="button" class="act" data-copy="link"><span class="act-t">Copy link</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="stage-wrap">' +
          '<div class="stage" data-demo="' + s.id + '" role="group" aria-label="Live demo: ' + s.title + '"><p class="stage-msg label">Loading demo…</p></div>' +
          '<div class="stage-corners" aria-hidden="true"><span></span><span></span><span></span><span></span></div>' +
          '<div class="stage-bar label"><span class="state">Waiting</span><button type="button" class="replay ulink" hidden>Replay ↺</button></div>' +
        '</div>';
      skillsRoot.appendChild(art);

      records[s.id] = {
        s: s, art: art, stage: art.querySelector('.stage'), wrap: art.querySelector('.stage-wrap'),
        state: art.querySelector('.state'), replayBtn: art.querySelector('.replay'),
        inst: null, mounted: false, live: false, visible: false, failed: false
      };
    });
  });

  /* ---------------- copy prompt / link ---------------- */
  var PAGE_URL = location.origin + location.pathname.replace(/index\.html$/, '');
  function promptFor(s) {
    return 'Apply the `' + s.id + '` skill (.claude/skills/' + s.id + '/SKILL.md) to this site: ' +
      s.short.charAt(0).toLowerCase() + s.short.slice(1) + '. Follow its numbers and accessibility rules, and keep a prefers-reduced-motion fallback.';
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = el('textarea'); ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); } catch (e) { reject(e); }
      ta.remove();
    });
  }
  skillsRoot.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.act');
    if (!b) return;
    var s = records[b.closest('.skill').id].s;
    var text = b.dataset.copy === 'prompt' ? promptFor(s) : PAGE_URL + '#' + s.id;
    var t = b.querySelector('.act-t'), was = b.dataset.copy === 'prompt' ? 'Copy prompt' : 'Copy link';
    copyText(text).then(function () { t.textContent = 'Copied ✓'; b.classList.add('done'); },
      function () { t.textContent = 'Press Ctrl+C'; window.prompt('Copy this:', text); })
      .then(function () { clearTimeout(b._t); b._t = setTimeout(function () { t.textContent = was; b.classList.remove('done'); }, 1600); });
  });

  function fillInfo(r) {
    var d = defs[r.s.id]; if (!d) return;
    var hint = r.art.querySelector('.hint');
    if (d.hint) { hint.textContent = d.hint; hint.hidden = false; }
    var notes = r.art.querySelector('.notes');
    if (d.notes && d.notes.length) {
      notes.innerHTML = d.notes.map(function (n) { return '<li><span>' + n + '</span></li>'; }).join('');
      notes.hidden = false;
    }
    var simp = r.art.querySelector('.simplified');
    if (d.simplified) { simp.textContent = 'Demo vs skill: ' + d.simplified; simp.hidden = false; }
    var msg = r.stage.querySelector('.stage-msg');
    if (msg && !r.mounted) msg.textContent = 'Scroll here to start';
  }

  /* ---------------- mounting & visibility ---------------- */
  function setState(r, text, live) {
    r.state.textContent = text;
    r.wrap.classList.toggle('is-live', !!live);
  }
  function fail(r, err) {
    r.failed = true;
    r.stage.innerHTML = '<p class="stage-msg label">This demo could not run here: ' + String(err && err.message || err).slice(0, 120) + '</p>';
    setState(r, 'Unavailable', false);
    if (window.console) console.error('[demo ' + r.s.id + ']', err);
  }
  function mount(r) {
    if (r.mounted || r.failed) return;
    var d = defs[r.s.id];
    if (!d) { if (loaderDone) { r.stage.querySelector('.stage-msg').textContent = 'Demo missing'; setState(r, 'Missing', false); } return; }
    r.mounted = true;
    r.stage.innerHTML = '';
    r.stage.classList.add('d-' + r.s.id);
    try {
      r.inst = d.mount(r.stage, {
        id: r.s.id, reduced: reducedMQ.matches, fine: fineMQ.matches, audio: audio,
        loop: loop, fitCanvas: fitCanvas, el: el, clamp: clamp, lerp: lerp, damp: damp
      }) || {};
    } catch (e) { fail(r, e); return; }
    if (typeof r.inst.replay === 'function') {
      r.replayBtn.hidden = false;
      r.replayBtn.onclick = function () { try { r.inst.replay(); } catch (e) { fail(r, e); } };
    }
    setState(r, 'Paused', false);
  }
  function start(r) {
    if (r.live || r.failed || !r.mounted) return;
    r.live = true; setState(r, 'Live', true);
    try { r.inst.start && r.inst.start(); } catch (e) { fail(r, e); }
  }
  function stop(r) {
    if (!r.live) return;
    r.live = false; setState(r, 'Paused', false);
    try { r.inst.stop && r.inst.stop(); } catch (e) { fail(r, e); }
  }

  var nearIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) mount(records[e.target.dataset.demo]); });
  }, { rootMargin: '60% 0px' });
  var liveIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var r = records[e.target.dataset.demo];
      r.visible = e.isIntersecting;
      if (!loaderDone) return;
      if (e.isIntersecting) { mount(r); start(r); } else stop(r);
    });
  }, { threshold: 0.2 });
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('revealed'); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.15 });

  Object.keys(records).forEach(function (id) {
    var r = records[id];
    nearIO.observe(r.stage); liveIO.observe(r.stage);
    revealIO.observe(r.art.querySelector('.skill-info'));
  });
  document.querySelectorAll('.cat-head').forEach(function (h) { revealIO.observe(h); });

  document.addEventListener('visibilitychange', function () {
    Object.keys(records).forEach(function (id) {
      var r = records[id];
      if (document.hidden) stop(r); else if (r.visible && loaderDone) start(r);
    });
  });

  /* ---------------- filters & search ---------------- */
  var activeCat = 'All';
  ['All'].concat(cats).forEach(function (c) {
    var n = c === 'All' ? skills.length : skills.filter(function (s) { return s.cat === c; }).length;
    var b = el('button', 'chip label', c + '<span class="n">' + n + '</span>');
    b.type = 'button'; b.setAttribute('aria-pressed', c === 'All' ? 'true' : 'false');
    b.addEventListener('click', function () {
      activeCat = c;
      filtersEl.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      applyFilter();
    });
    filtersEl.appendChild(b);
  });
  var search = document.getElementById('search');
  search.addEventListener('input', applyFilter);
  function applyFilter() {
    var q = search.value.trim().toLowerCase();
    var shown = 0;
    skills.forEach(function (s) {
      var hay = (s.title + ' ' + s.id + ' ' + s.cat + ' ' + s.desc + ' ' + s.source).toLowerCase();
      var ok = (activeCat === 'All' || s.cat === activeCat) && (!q || hay.indexOf(q) >= 0);
      records[s.id].art.hidden = !ok;
      indexList.querySelector('[data-id="' + s.id + '"]').hidden = !ok;
      if (ok) shown++;
    });
    document.querySelectorAll('.cat-head').forEach(function (h) {
      h.hidden = !skills.some(function (s) { return s.cat === h.dataset.cat && !records[s.id].art.hidden; });
    });
    document.getElementById('empty').hidden = shown > 0;
  }

  /* ---------------- drawer (slide-over-drawer) ---------------- */
  var drawer = document.getElementById('drawer');
  var lastFocus = null;
  var tabs = Array.prototype.slice.call(drawer.querySelectorAll('[role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var i = (tabs.indexOf(t) + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      selectTab(tabs[i]); tabs[i].focus();
    });
  });
  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.getElementById('main').inert = true;
    requestAnimationFrame(function () { requestAnimationFrame(function () { drawer.classList.add('open'); }); });
    drawer.querySelector('.close').focus();
  }
  function closeDrawer() {
    if (drawer.hidden) return;
    drawer.classList.remove('open');
    document.getElementById('main').inert = false;
    setTimeout(function () { drawer.hidden = true; }, reducedMQ.matches ? 200 : 500);
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('[data-drawer]').forEach(function (b) { b.addEventListener('click', openDrawer); });
  drawer.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeDrawer); });

  /* ---------------- keyboard: Esc, Shift+G grid ---------------- */
  var grid = document.getElementById('grid-overlay');
  grid.innerHTML = new Array(13).join('<i></i>');
  addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
    var tag = (e.target.tagName || '').toLowerCase();
    if (e.shiftKey && (e.key === 'G' || e.key === 'g') && tag !== 'input' && tag !== 'textarea') grid.hidden = !grid.hidden;
  });

  /* ---------------- sound toggle ---------------- */
  var soundBtn = document.getElementById('sound-toggle');
  soundBtn.addEventListener('click', function () { audio.toggle(); });
  audio.onChange(function (on) { soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  document.addEventListener('pointerover', function (e) {
    var t = e.target.closest && e.target.closest('.ulink, .chip, .index-list a');
    if (t && (!e.relatedTarget || !t.contains(e.relatedTarget))) audio.whoosh(0.04);
  });

  /* ---------------- reticle cursor ---------------- */
  var reticle = document.getElementById('reticle');
  var rDot = reticle.querySelector('.r-dot');
  var rCorners = reticle.querySelectorAll('.r-c');
  var rLabel = reticle.querySelector('.r-label');
  var cur = { x: -100, y: -100, shown: false, down: false, hover: null, labelEl: null, native: false };
  var box = [-120, -120, -80, -80], goal = [0, 0, 0, 0];
  var reticleOn = false;
  function enableReticle() {
    reticleOn = fineMQ.matches && !reducedMQ.matches;
    document.documentElement.classList.toggle('reticle', reticleOn);
    if (!reticleOn) reticle.style.opacity = '0';
  }
  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    cur.x = e.clientX; cur.y = e.clientY; cur.shown = true;
    var t = e.target;
    cur.hover = t.closest ? t.closest('a, button, [role=slider], [role=tab], input, summary, [data-snap]') : null;
    cur.labelEl = t.closest ? t.closest('[data-cursor]') : null;
    cur.native = !!(t.closest && t.closest('[data-native-cursor]'));
  }, { passive: true });
  addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') cur.down = true; }, { passive: true });
  addEventListener('pointerup', function () { cur.down = false; }, { passive: true });
  document.addEventListener('pointerleave', function () { cur.shown = false; });
  addEventListener('blur', function () { cur.shown = false; });
  function tickReticle(dt) {
    if (!reticleOn) return;
    var h = cur.hover;
    var r = h && h.isConnected && !h.disabled ? h.getBoundingClientRect() : null;
    var g = cur.down ? 7 : 11;
    goal[0] = r ? r.left - 6 : cur.x - g; goal[1] = r ? r.top - 6 : cur.y - g;
    goal[2] = r ? r.right + 6 : cur.x + g; goal[3] = r ? r.bottom + 6 : cur.y + g;
    var k = 1 - Math.exp(-24 * dt);
    for (var i = 0; i < 4; i++) box[i] += (goal[i] - box[i]) * k;
    reticle.style.opacity = cur.shown && !cur.native ? '1' : '0';
    rDot.style.transform = 'translate3d(' + cur.x + 'px,' + cur.y + 'px,0)';
    var pts = [[box[0], box[1]], [box[2] - 7, box[1]], [box[0], box[3] - 7], [box[2] - 7, box[3] - 7]];
    for (var j = 0; j < 4; j++) rCorners[j].style.transform = 'translate3d(' + pts[j][0] + 'px,' + pts[j][1] + 'px,0)';
    var txt = (h && h.getAttribute('data-cursor')) || (!r && cur.labelEl ? cur.labelEl.getAttribute('data-cursor') : '') || '';
    if (rLabel.textContent !== txt) rLabel.textContent = txt;
    rLabel.style.transform = 'translate3d(' + ((box[0] + box[2]) / 2) + 'px,' + (box[3] + 10) + 'px,0) translateX(-50%)';
  }
  fineMQ.addEventListener && fineMQ.addEventListener('change', enableReticle);
  reducedMQ.addEventListener && reducedMQ.addEventListener('change', enableReticle);

  /* ---------------- global frame loop: scroll metrics, rail, reticle ---------------- */
  var rail = document.getElementById('rail');
  var railNum = document.getElementById('rail-num');
  var railName = document.getElementById('rail-name');
  var railFill = document.getElementById('rail-fill');
  var railVel = document.getElementById('rail-vel');
  var lastY = scrollY, vel = 0, currentId = null;
  var ids = Object.keys(records);
  var main = loop(function (dt) {
    var y = scrollY, vh = innerHeight;
    var raw = dt > 0 ? (y - lastY) / dt / 3000 : 0;
    lastY = y;
    vel = damp(vel, clamp(raw, -1, 1), 8, dt);
    document.documentElement.style.setProperty('--vel', vel.toFixed(3));

    var current = null;
    for (var i = 0; i < ids.length; i++) {
      var r = records[ids[i]];
      if (r.art.hidden) continue;
      var rect = r.art.getBoundingClientRect();
      if (rect.top < vh * 0.5) current = r;
      if (r.live && r.inst && typeof r.inst.scroll === 'function') {
        // progress of the STAGE through the viewport: 0 = its top meets the bottom edge, 1 = its bottom meets the top edge
        var sr = r.stage.getBoundingClientRect();
        var p = clamp((vh - sr.top) / (vh + sr.height), 0, 1);
        try { r.inst.scroll(p, vel); } catch (e) { fail(r, e); }
      }
    }
    var idxRect = indexList.getBoundingClientRect();
    rail.classList.toggle('on', idxRect.top < vh * 0.6);
    var id = current ? current.s.id : null;
    if (id !== currentId) {
      currentId = id;
      railNum.innerHTML = '<span class="roll">' + (current ? pad(current.s.n) : '00') + '</span>';
      railName.textContent = current ? current.s.title : 'Index';
    }
    var max = document.documentElement.scrollHeight - vh;
    railFill.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
    railVel.textContent = (vel >= 0 ? ' ' : '') + vel.toFixed(2);
    tickReticle(dt);
  });

  /* ---------------- cinematic loader ---------------- */
  var loaderEl = document.getElementById('loader');
  var loaderSvg = document.getElementById('loader-svg');
  var fillRect = document.getElementById('ld-fill');
  var band = document.getElementById('ld-band');
  var countEl = document.querySelector('#loader-count .digits');
  var noteEl = document.getElementById('loader-note');
  var loaderDone = false;
  var seen = false;
  try { seen = sessionStorage.getItem('molin-library:loader-seen') === '1'; } catch (e) {}
  var speed = seen ? 2.5 : 1;
  document.body.classList.add('is-loading');

  // rolling digit columns
  var cols = [];
  for (var c = 0; c < 3; c++) {
    var col = el('span', 'col'); var strip = el('span', 'strip');
    for (var dgt = 0; dgt < 10; dgt++) strip.appendChild(el('span', '', String(dgt)));
    col.appendChild(strip); countEl.appendChild(col); cols.push(col);
  }
  function showCount(v) {
    var digits = String(v).padStart(3, '0').split('').map(Number);
    var lead = v >= 100 ? 0 : v >= 10 ? 1 : 2;
    cols.forEach(function (col, i) {
      col.firstChild.style.transform = 'translateY(' + (-digits[i]) + 'em)';
      col.classList.toggle('dim', i < lead);
    });
    loaderSvg.setAttribute('aria-valuenow', v);
  }

  // real progress = demo scripts settled + fonts ready
  var total = skills.length + 1, settled = 0;
  function settle() { settled++; }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(settle, settle);
  skills.forEach(function (s) {
    var sc = document.createElement('script');
    sc.src = 'demos/' + s.id + '.js';
    sc.async = false;
    sc.onload = settle;
    sc.onerror = function () { settle(); };
    document.body.appendChild(sc);
  });

  // theatrical progress, never ahead of real progress (cinematic-loader rule)
  var fake = 0, shown = 0, startedAt = performance.now();
  function fakeTick() {
    var late = fake > 0.85;
    fake = Math.min(fake + (late ? 0.01 + 0.03 * Math.random() : 0.03 + 0.12 * Math.random()), 1);
    if (fake < 1) setTimeout(fakeTick, ((late ? 180 : 60) + Math.random() * (Math.random() < 0.15 ? 700 : 260)) / speed);
  }
  setTimeout(fakeTick, 300 / speed);

  var loadLoop = loop(function (dt) {
    var real = settled / total;
    var target = Math.min(fake, real >= 1 ? 1 : 0.9 * real);
    if (performance.now() - startedAt > 9000) target = Math.max(target, real >= 0.5 ? 1 : target);
    shown = damp(shown, target, 6, dt);
    if (target >= 1 && shown > 0.995) shown = 1;
    var yv = 240 * (1 - shown);
    fillRect.setAttribute('y', yv); fillRect.setAttribute('height', 240 - yv);
    band.setAttribute('transform', 'translate(0 ' + (yv - 20) + ')');
    band.setAttribute('opacity', Math.min(1, shown * 25) * (shown < 1 ? 1 : 0));
    showCount(Math.round(shown * 100));
    if (shown >= 1) { loadLoop.stop(); exitLoader(); }
  });

  function exitLoader() {
    try { sessionStorage.setItem('molin-library:loader-seen', '1'); } catch (e) {}
    var finish = function () {
      loaderEl.remove();
      document.body.classList.remove('is-loading');
      loaderDone = true;
      document.querySelector('.hero').classList.add('revealed');
      enableReticle();
      ids.forEach(function (id) { var r = records[id]; if (r.visible) { mount(r); start(r); } });
      if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
    };
    if (reducedMQ.matches) {
      loaderEl.style.transition = 'opacity .8s ease';
      loaderEl.classList.add('out'); loaderEl.style.opacity = '0';
      setTimeout(finish, 800);
      return;
    }
    // fly-through: punch the word out of a black plate, then zoom into the "I"
    var NS = 'http://www.w3.org/2000/svg';
    var defsEl = loaderSvg.querySelector('defs');
    var mask = document.createElementNS(NS, 'mask');
    mask.setAttribute('id', 'ld-cut'); mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', '-50000'); mask.setAttribute('y', '-50000'); mask.setAttribute('width', '100000'); mask.setAttribute('height', '100000');
    mask.innerHTML = '<rect x="-50000" y="-50000" width="100000" height="100000" fill="#fff"/><text x="500" y="200" text-anchor="middle" class="ld-text" fill="#000">MOTION</text>';
    defsEl.appendChild(mask);
    var plate = document.createElementNS(NS, 'rect');
    plate.setAttribute('x', '-50000'); plate.setAttribute('y', '-50000'); plate.setAttribute('width', '100000'); plate.setAttribute('height', '100000');
    plate.setAttribute('fill', '#000'); plate.setAttribute('mask', 'url(#ld-cut)');
    loaderSvg.appendChild(plate);
    var lit = loaderSvg.querySelector('.ld-lit');
    var ghost = loaderSvg.querySelector('.ld-ghost');
    var cx = 500, cy = 130;
    try { var ext = lit.getExtentOfChar(4); cx = ext.x + ext.width / 2; cy = ext.y + ext.height / 2; } catch (e) {}
    loaderEl.classList.add('out');
    loaderEl.style.background = 'transparent';
    ghost.style.opacity = '0';
    var page = document.getElementById('main');
    page.style.transformOrigin = '50% 30vh';
    page.animate([{ transform: 'scale(.86)', filter: 'blur(8px) brightness(.45)' }, { transform: 'none', filter: 'none' }],
      { duration: 1800 / speed, delay: 900 / speed, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
    document.getElementById('loader-count').animate([{ opacity: 1 }, { opacity: 0, transform: 'translate(-50%, 8px)', filter: 'blur(4px)' }],
      { duration: 500, easing: 'ease-in', fill: 'forwards' });
    noteEl.style.opacity = '0';
    var vb0 = { cx: 500, cy: 120, w: 1000 }, w1 = 0.6, t0 = performance.now(), dur = 2100 / speed;
    var lastW = vb0.w;
    function frame(now) {
      var t = clamp((now - t0) / dur, 0, 1);
      var z = t < 0.18 ? -0.06 * Math.sin((t / 0.18) * Math.PI / 2) : -0.06 + 1.06 * Math.pow((t - 0.18) / 0.82, 2.2);
      z = clamp(z, -0.06, 1);
      var w = Math.exp(lerp(Math.log(vb0.w), Math.log(w1), Math.max(z, 0))) * (z < 0 ? 1 - z : 1);
      var k = clamp(z / 0.82, 0, 1);
      var x = lerp(vb0.cx, cx, k), y = lerp(vb0.cy, cy, k);
      var h = w * innerHeight / innerWidth;
      loaderSvg.setAttribute('viewBox', (x - w / 2) + ' ' + (y - h / 2) + ' ' + w + ' ' + h);
      lit.style.opacity = String(clamp(1 - t * 2.4, 0, 1));
      lastW = w;
      if (t < 1) requestAnimationFrame(frame); else finish();
    }
    requestAnimationFrame(frame);
  }

  noteEl.textContent = seen ? 'Welcome back' : 'Loading ' + skills.length + ' live demos';
  main.start();
  loadLoop.start();
})();
