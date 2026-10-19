/* Halden LF-1 showcase — the shell.
 * Owns everything that is not a section: boot (GPU tier, renderer warm-up, loader), the fixed WebGL
 * background, scroll signals, section lifecycle, cursor, sound, toasts, ⌘K, nav menus, page
 * transitions and the "Show skills" lens. Sections plug in through Site.section (sections/README.md).
 */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
  var fineMQ = matchMedia('(hover: hover) and (pointer: fine)');
  var isIndex = !!document.getElementById('loader');

  /* ---------------- helpers ---------------- */
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var damp = function (a, b, lambda, dt) { return lerp(a, b, 1 - Math.exp(-lambda * dt)); };
  var map = function (v, a, b, c, d) { return lerp(c, d, clamp((v - a) / (b - a), 0, 1)); };
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
    s.dataset.section = id;
    s.textContent = text;
    document.head.appendChild(s);
  }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------------- gpu-tier-adaptive-quality ---------------- */
  function detectTier() {
    var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && !fineMQ.matches);
    var out = { tier: 0, dpr: 1, webgl2: false, mobile: mobile, renderer: 'none' };
    var c = document.createElement('canvas'), gl = null;
    var force = /[?&]tier=([0-3])/.exec(location.search);   // QA override, e.g. ?tier=2
    try { gl = c.getContext('webgl2', force ? {} : { failIfMajorPerformanceCaveat: true }); } catch (e) { gl = null; }
    if (!gl) return out;
    out.webgl2 = true;
    var r = '';
    try {
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      r = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    } catch (e) { r = ''; }
    out.renderer = r;
    var low = /swiftshader|llvmpipe|software|basic render|microsoft basic/i;
    var mid = /intel(?!.*(arc|iris xe))|mali-[4gt]|adreno.?[3-5]\d\d|powervr|apple gpu/i;
    var tex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
    if (low.test(r)) out.tier = 0;
    else if (mid.test(r) || tex < 8192) out.tier = 1;
    else out.tier = (navigator.hardwareConcurrency || 4) >= 8 ? 3 : 2;
    if (mobile) out.tier = Math.min(out.tier, 2);           // mobile cap
    if (/apple gpu/i.test(r) && !mobile) out.tier = 3;      // Apple Silicon reports a generic string
    var area = screen.width * screen.height * Math.pow(devicePixelRatio || 1, 2);
    if (force) out.tier = +force[1];
    out.dpr = [1, 1.25, 1.5, 2][out.tier];
    if (area > 3840 * 2160) out.dpr = Math.min(out.dpr, 1.5); // 4K+: resolution already high
    var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    return out;
  }

  /* ---------------- background bokeh field (scroll-scrubbed-webgl-sections + warm-up) ---------------- */
  var bg = (function () {
    var canvas = document.getElementById('bg');
    var target = { aperture: .45, warmth: .15, energy: .1, focus: .35 };
    var cur = { aperture: .45, warmth: .15, energy: .1, focus: .35 };
    var gl = null, prog = null, U = {}, ok = false;
    var VS = '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FS = [
      '#version 300 es', 'precision highp float;',
      'uniform vec2 uRes;uniform float uTime,uAperture,uWarmth,uEnergy,uFocus,uScroll;out vec4 o;',
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'vec3 tone(float w,float k){vec3 night=vec3(.23,.42,.85),dawn=vec3(1.,.55,.28),mid=vec3(.75,.5,.85);',
      ' return mix(mix(night,mid,smoothstep(.0,.6,w)),dawn,smoothstep(.45,1.,w))*(.75+.5*k);}',
      'void main(){vec2 uv=gl_FragCoord.xy/uRes.y;vec3 col=vec3(0.);',
      ' float t=uTime*(.02+.06*uEnergy);',
      ' for(int l=0;l<3;l++){float fl=float(l);float sc=mix(5.,11.,fl/2.)/(.6+uAperture);',
      '  vec2 q=uv*sc+vec2(t*(1.+fl)*.6,-uScroll*(.6+fl*.5));vec2 id=floor(q);vec2 f=fract(q)-.5;',
      '  float r=h(id+fl*7.);if(r<.72)continue;',
      '  vec2 off=(vec2(h(id+3.1),h(id+5.7))-.5)*.3;float d=length(f-off);',
      '  float rad=mix(.08,.2,h(id+9.))*(.6+.75*uAperture);float soft=mix(.25,.02,uFocus)*rad+.01;',
      '  float disc=smoothstep(rad,rad-soft,d)*(.55+.45*smoothstep(rad*.7,rad,d));',
      '  float tw=.6+.4*sin(uTime*(.4+r)+r*40.);',
      '  col+=tone(uWarmth+(h(id+1.3)-.5)*.3,h(id))*disc*tw*(.10+.08*fl)*(1.+uEnergy*1.5);}',
      ' vec2 c=gl_FragCoord.xy/uRes-.5;col+=tone(uWarmth,.2)*.06*exp(-dot(c,c)*3.);',
      ' col+=vec3(h(gl_FragCoord.xy+uTime)-.5)*.02;o=vec4(col,1.);}'
    ].join('\n');
    function compile(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    function init(tier) {
      if (!tier.webgl2 || tier.tier === 0) return false;
      try {
        gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
        if (!gl) return false;
        prog = gl.createProgram();
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
        gl.useProgram(prog);
        var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        ['uRes', 'uTime', 'uAperture', 'uWarmth', 'uEnergy', 'uFocus', 'uScroll'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
        canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); ok = false; });
        ok = true;
        resize(tier);
        return true;
      } catch (e) { if (window.console) console.warn('[bg] WebGL2 failed, using CSS fallback', e); ok = false; return false; }
    }
    function resize(tier) {
      if (!ok) return;
      // the bokeh is soft by design: render it at reduced resolution (cheap on every tier)
      var d = Math.min(tier.dpr, 1) * (tier.tier >= 3 ? .75 : .5);
      canvas.width = Math.max(1, Math.round(innerWidth * d)); canvas.height = Math.max(1, Math.round(innerHeight * d));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function draw(t, s) {
      if (!ok) return;
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, t); gl.uniform1f(U.uAperture, s.aperture); gl.uniform1f(U.uWarmth, s.warmth);
      gl.uniform1f(U.uEnergy, s.energy); gl.uniform1f(U.uFocus, s.focus);
      gl.uniform1f(U.uScroll, (window.scrollY || 0) / Math.max(1, innerHeight) * .25);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    // warm-up: render the extreme states a few hidden frames so the first scroll never compiles/janks
    function warmup() {
      if (!ok) return;
      var states = [{ aperture: 0, warmth: 0, energy: 0, focus: 1 }, { aperture: 1, warmth: 1, energy: 1, focus: 0 }, cur];
      for (var i = 0; i < 6; i++) draw(i * .1, states[i % 3]);
      gl.finish && gl.finish();
    }
    return {
      init: init, resize: resize, warmup: warmup,
      get ok() { return ok; },
      set: function (o) { for (var k in o) if (k in target) target[k] = clamp(+o[k] || 0, 0, 1); },
      tick: function (dt, t) {
        for (var k in cur) cur[k] = damp(cur[k], target[k], 2.5, dt);
        if (!Site.reduced) draw(t, cur); else if (!this._still) { draw(10, cur); }
      }
    };
  })();

  /* ---------------- audio (web-audio-soundscape + scroll-velocity-whoosh-audio) ---------------- */
  var audio = {
    on: false, ctx: null, out: null, _noise: null, _listeners: [], _hoverAt: -9, _bed: null, _muffled: false,
    ensure: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        this.lp = this.ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 18000;
        this.out = this.ctx.createGain(); this.out.gain.value = 0;
        this.out.connect(this.lp).connect(this.ctx.destination);
      }
      return this.ctx;
    },
    noise: function () {
      var c = this.ensure(); if (!c) return null;
      if (!this._noise) {
        var len = 2 * c.sampleRate;
        this._noise = c.createBuffer(2, len, c.sampleRate);
        for (var ch = 0; ch < 2; ch++) { var d = this._noise.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; }
      }
      return this._noise;
    },
    // the bed: wind (lowpassed noise, slow LFO) + a quiet two-sine drone + the scroll whoosh voice
    _startBed: function () {
      if (this._bed) return;
      var c = this.ctx, t = c.currentTime, bed = {};
      var src = c.createBufferSource(); src.buffer = this.noise(); src.loop = true;
      var wl = c.createBiquadFilter(); wl.type = 'lowpass'; wl.frequency.value = 420; wl.Q.value = .7;
      var wg = c.createGain(); wg.gain.value = .05;
      var lfo = c.createOscillator(); lfo.frequency.value = .07; var lg = c.createGain(); lg.gain.value = 220;
      lfo.connect(lg).connect(wl.frequency);
      src.connect(wl).connect(wg).connect(this.out);
      var dg = c.createGain(); dg.gain.value = .018;
      [55, 82.4].forEach(function (f) { var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(dg); o.start(t); (bed.osc = bed.osc || []).push(o); });
      dg.connect(this.out);
      // whoosh voice: band-passed noise whose gain + centre follow |scroll velocity|
      var ws = c.createBufferSource(); ws.buffer = this.noise(); ws.loop = true;
      var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .9; bp.frequency.value = 600;
      var lp2 = c.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 900;
      var vg = c.createGain(); vg.gain.value = 0;
      ws.connect(bp).connect(lp2).connect(vg).connect(this.out);
      src.start(t); lfo.start(t); ws.start(t);
      bed.src = [src, lfo, ws]; bed.vg = vg; bed.bp = bp; bed.lp = lp2;
      this._bed = bed;
    },
    velocity: function (v) {
      var b = this._bed; if (!b || !this.on) return;
      var a = Math.min(1, Math.abs(v)), t = this.ctx.currentTime;
      b.vg.gain.setTargetAtTime(a * a * .22, t, .08);
      b.bp.frequency.setTargetAtTime(500 + a * 2200, t, .1);
      b.lp.frequency.setTargetAtTime(900 + a * 5000, t, .1);
    },
    toggle: function (force) {
      var next = typeof force === 'boolean' ? force : !this.on;
      var c = this.ensure(); if (!c) return;
      c.resume();
      this.on = next;
      if (next) this._startBed();
      this.out.gain.setTargetAtTime(next ? 1 : 0, c.currentTime, .15);
      this._listeners.forEach(function (fn) { try { fn(next); } catch (e) {} });
    },
    onChange: function (fn) { this._listeners.push(fn); },
    // muffle filter: modals, hidden tab
    muffle: function (on) {
      this._muffled = on; if (!this.ctx) return;
      this.lp.frequency.setTargetAtTime(on ? 600 : 18000, this.ctx.currentTime, .12);
    },
    whoosh: function (gain) {
      if (!this.on || !this.ctx) return;
      var c = this.ctx, t = c.currentTime;
      if (t - this._hoverAt < .6) return;
      this._hoverAt = t;
      var src = c.createBufferSource(); src.buffer = this.noise();
      var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(1800, t); bp.frequency.linearRampToValueAtTime(4200, t + .41);
      var g = c.createGain(); g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain || .05, t + .06); g.gain.setTargetAtTime(0, t + .06, .0875);
      src.connect(bp).connect(g).connect(this.out);
      src.start(t, Math.random()); src.stop(t + .8);
    },
    click: function (gain) {
      if (!this.on || !this.ctx) return;
      var c = this.ctx, t = c.currentTime;
      var o = c.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(2400, t); o.frequency.exponentialRampToValueAtTime(800, t + .03);
      var g = c.createGain(); g.gain.setValueAtTime(gain || .04, t); g.gain.exponentialRampToValueAtTime(.0001, t + .04);
      o.connect(g).connect(this.out); o.start(t); o.stop(t + .05);
    },
    tone: function (freq, dur, gain) {
      if (!this.on || !this.ctx) return;
      var c = this.ctx, t = c.currentTime;
      var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq || 660;
      var g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain || .06, t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + (dur || .3));
      o.connect(g).connect(this.out); o.start(t); o.stop(t + (dur || .3) + .05);
    },
    // two-stage mechanical shutter: first curtain, second curtain
    shutter: function () {
      if (!this.on || !this.ctx) return;
      var c = this.ctx, self = this;
      [0, .075].forEach(function (d, i) {
        var t = c.currentTime + d;
        var s = c.createBufferSource(); s.buffer = self.noise();
        var hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = i ? 2600 : 1600;
        var g = c.createGain(); g.gain.setValueAtTime(i ? .22 : .3, t); g.gain.exponentialRampToValueAtTime(.0001, t + .045);
        s.connect(hp).connect(g).connect(self.out); s.start(t, Math.random()); s.stop(t + .06);
        var o = c.createOscillator(); o.frequency.setValueAtTime(i ? 190 : 140, t); o.frequency.exponentialRampToValueAtTime(60, t + .05);
        var og = c.createGain(); og.gain.setValueAtTime(.12, t); og.gain.exponentialRampToValueAtTime(.0001, t + .06);
        o.connect(og).connect(self.out); o.start(t); o.stop(t + .07);
      });
    }
  };

  /* ---------------- stacked-toasts ---------------- */
  var toast = (function () {
    var list = document.getElementById('toasts');
    var items = [], seq = 0, expanded = false, hiddenTab = false, pressing = false;
    var ICONS = {
      success: '<svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.86-9.81a.75.75 0 00-1.22-.88l-3.24 4.53-1.62-1.62a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.1l3.75-5.24z"/></svg>',
      error: '<svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"/></svg>',
      info: '<svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor"><circle cx="10" cy="10" r="4"/></svg>'
    };
    function spinner() { var s = '<div class="spin">'; for (var i = 0; i < 12; i++) s += '<i style="transform:rotate(' + (30 * i) + 'deg) translate(146%);animation-delay:' + (-1.2 + i * .1).toFixed(1) + 's"></i>'; return s + '</div>'; }
    function layout() {
      var live = items.filter(function (t) { return !t.removed; });
      var off = 0;
      items.slice().reverse().forEach(function (t, i) {
        // i counts from the newest (front) toast
        var idx = items.length - 1 - items.indexOf(t);
        t.node.style.setProperty('--i', idx);
        t.node.dataset.front = idx === 0 ? 'true' : 'false';
        t.node.dataset.hidden = idx >= 3 ? 'true' : 'false';
        if (!t.removed) { t.node.style.setProperty('--offset', off + 'px'); off += t.h + 14; }
      });
      var front = live[live.length - 1];
      if (front) list.style.height = (expanded ? off - 14 : front.h) + 'px';
      list.dataset.expanded = expanded && live.length > 1 ? 'true' : 'false';
      // collapsed: every toast takes the front toast's height
      items.forEach(function (t) { t.node.style.height = (!expanded && front && t !== front && !t.removed) ? front.h + 'px' : t.h + 'px'; });
    }
    function measure(t) { var prev = t.node.style.height; t.node.style.height = 'auto'; t.h = t.node.getBoundingClientRect().height; t.node.style.height = prev; }
    function render(t) {
      var o = t.opts;
      t.node.dataset.type = o.type || 'info';
      t.node.innerHTML = '<div class="toast-ic">' + (o.type === 'loading' ? spinner() : (ICONS[o.type] || ICONS.info)) + '</div>' +
        '<div class="toast-t"></div>' + (o.description ? '<div class="toast-d"></div>' : '') +
        (o.action ? '<button type="button" class="toast-a"></button>' : '');
      t.node.querySelector('.toast-t').textContent = t.title;
      if (o.description) t.node.querySelector('.toast-d').textContent = o.description;
      if (o.action) {
        var b = t.node.querySelector('.toast-a'); b.textContent = o.action.label;
        b.addEventListener('click', function (e) { o.action.onClick && o.action.onClick(e); if (!e.defaultPrevented) dismiss(t.id); });
      }
      measure(t);
    }
    function startTimer(t) {
      clearTimeout(t.timer);
      if (t.opts.type === 'loading' || t.opts.duration === Infinity) return;
      if (expanded || hiddenTab || pressing) return;
      t.started = Date.now();
      t.timer = setTimeout(function () { dismiss(t.id); }, t.remaining);
    }
    function pauseAll() { items.forEach(function (t) { if (t.timer) { clearTimeout(t.timer); t.timer = 0; t.remaining -= Date.now() - t.started; } }); }
    function resumeAll() { items.forEach(function (t) { if (!t.removed) startTimer(t); }); }
    function create(title, opts) {
      opts = opts || {};
      var t = { id: ++seq, title: title, opts: opts, h: 0, remaining: opts.duration || 4000, removed: false };
      t.node = el('li', 'toast'); t.node.setAttribute('role', opts.type === 'error' ? 'alert' : 'status');
      t.node.dataset.mounted = 'false';
      list.appendChild(t.node);
      render(t);
      items.push(t);
      if (items.length > 6) dismiss(items[0].id);
      layout();
      requestAnimationFrame(function () { requestAnimationFrame(function () { t.node.dataset.mounted = 'true'; }); });
      startTimer(t);
      swipe(t);
      audio.tone(880, .18, .03);
      return t.id;
    }
    function find(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; return null; }
    function update(id, opts) {
      var t = find(id); if (!t) return;
      if (opts.title) t.title = opts.title;
      t.opts = Object.assign({}, t.opts, opts); t.remaining = t.opts.duration || 4000;
      render(t); layout(); startTimer(t);
    }
    function dismiss(id) {
      var t = find(id); if (!t || t.removed) return;
      t.removed = true; clearTimeout(t.timer);
      t.node.dataset.removed = 'true';
      layout();
      setTimeout(function () { t.node.remove(); items.splice(items.indexOf(t), 1); layout(); if (!items.length) { expanded = false; list.style.height = ''; } }, 200);
    }
    function swipe(t) {
      var x0 = 0, t0 = 0, dx = 0, on = false;
      t.node.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button') || t.opts.type === 'loading') return;
        on = true; x0 = e.clientX; t0 = Date.now(); dx = 0; pressing = true; pauseAll();
        t.node.setPointerCapture(e.pointerId); t.node.dataset.swiping = 'true';
      });
      t.node.addEventListener('pointermove', function (e) {
        if (!on) return;
        var raw = e.clientX - x0;
        dx = raw > 0 ? raw : raw * .25 / (1 + Math.abs(raw) / 60) ; // wrong-way drag is damped
        t.node.style.setProperty('--sx', dx + 'px');
      });
      function end() {
        if (!on) return; on = false; pressing = false; t.node.dataset.swiping = 'false';
        var v = Math.abs(dx) / Math.max(1, Date.now() - t0);
        if (dx >= 45 || (dx > 0 && v > .11)) { t.node.style.setProperty('--dir', 1); t.node.dataset.swipeOut = '1'; dismiss(t.id); }
        else t.node.style.setProperty('--sx', '0px');
        resumeAll();
      }
      t.node.addEventListener('pointerup', end); t.node.addEventListener('pointercancel', end);
    }
    list.addEventListener('mouseenter', function () { expanded = true; pauseAll(); layout(); });
    list.addEventListener('mouseleave', function () { if (pressing) return; expanded = false; layout(); resumeAll(); });
    list.addEventListener('focusin', function () { expanded = true; pauseAll(); layout(); });
    list.addEventListener('focusout', function (e) { if (!list.contains(e.relatedTarget)) { expanded = false; layout(); resumeAll(); } });
    document.addEventListener('visibilitychange', function () { hiddenTab = document.hidden; if (hiddenTab) pauseAll(); else resumeAll(); });
    addEventListener('keydown', function (e) { if (e.altKey && (e.code === 'KeyT')) { var b = list.querySelector('.toast:last-child .toast-a') || list.querySelector('.toast:last-child'); if (b) { b.tabIndex = -1; b.focus(); } } });
    var api = function (title, opts) { return create(title, opts); };
    api.dismiss = dismiss; api.update = update;
    return api;
  })();

  /* ---------------- scroll signals (scroll-velocity-section-metrics) ---------------- */
  var scroll = { y: 0, lastY: 0, vel: 0, vh: innerHeight, vw: innerWidth };

  /* ---------------- section lifecycle ---------------- */
  var defs = {}, recs = [], booted = false, gateOpen = false;
  function measureRec(r) {
    // layout offsets, not getBoundingClientRect: <main> is scaled while the loader/cover runs
    var top = 0, n = r.root;
    while (n) { top += n.offsetTop; n = n.offsetParent; }
    r.top = top; r.h = r.root.offsetHeight;
  }
  function metrics(r) {
    var top = r.top - scroll.y, h = r.h, vh = scroll.vh;
    var m = r.m;
    m.offset = top; m.vh = vh; m.vw = scroll.vw; m.vel = scroll.vel;
    m.progress = clamp((vh - top) / (h + vh), 0, 1);
    m.pin = h > vh ? clamp(-top / (h - vh), 0, 1) : clamp((vh - top) / (h + vh), 0, 1);
    var bottom = top + h;
    m.transition = top > 0 ? -clamp(top / vh, 0, 1) : bottom < vh ? clamp((vh - bottom) / vh, 0, 1) : 0;
    return m;
  }
  function mountRec(r) {
    if (r.mounted || !defs[r.id]) return;
    r.mounted = true;
    var d = defs[r.id];
    css(r.id, d.css);
    try { r.inst = d.mount(r.root, Site) || {}; } catch (e) { r.inst = {}; if (window.console) console.error('[section ' + r.id + ']', e); }
    r.root.dataset.mounted = '';
    addTags(r.root);
    remeasure();
  }
  function setLive(r, on) {
    if (r.live === on || !r.mounted) return;
    r.live = on;
    try { on ? r.inst.start && r.inst.start() : r.inst.stop && r.inst.stop(); } catch (e) { if (window.console) console.error('[section ' + r.id + ']', e); }
  }
  function tryEnter(r) {
    if (r.entered || !gateOpen || !r.mounted) return;
    var top = r.top - scroll.y, vis = Math.min(scroll.vh, top + r.h) - Math.max(0, top);
    if (vis >= Math.min(r.h, scroll.vh) * .15) {
      r.entered = true;
      try { r.inst.enter && r.inst.enter(); } catch (e) { if (window.console) console.error(e); }
    }
  }
  function remeasure() {
    scroll.vh = innerHeight; scroll.vw = innerWidth; scroll.y = window.scrollY;
    recs.forEach(measureRec);
  }

  /* ---------------- frame ---------------- */
  var frame = loop(function (dt, t) {
    var y = window.scrollY;
    var raw = (y - scroll.lastY) / Math.max(dt, 1 / 240) / Math.max(1, scroll.vh) * .35; // ~1 at 3 viewports/s
    scroll.lastY = y; scroll.y = y;
    scroll.vel = clamp(damp(scroll.vel, clamp(raw, -1, 1), 6, dt), -1, 1);
    if (Math.abs(scroll.vel) < .0005) scroll.vel = 0;
    doc.style.setProperty('--vel', scroll.vel.toFixed(3));
    audio.velocity(scroll.vel);
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i], top = r.top - y;
      var near = top < scroll.vh * 2 && top + r.h > -scroll.vh;
      if (near && booted) mountRec(r);
      var on = top < scroll.vh && top + r.h > 0;
      if (r.mounted) {
        setLive(r, on && !document.hidden);
        if (r.live) { tryEnter(r); if (r.inst.scroll) { try { r.inst.scroll(metrics(r)); } catch (e) { if (window.console) console.error(e); r.inst.scroll = null; } } }
      }
    }
    if (bg.ok) bg.tick(dt, t);
    cursor.tick(dt);
    if (footRec) tryFoot();
  });
  var footRec = null;
  function tryFoot() {
    var b = footRec.getBoundingClientRect();
    if (gateOpen && b.top < scroll.vh * .85) { footRec.classList.add('is-in'); footRec = null; }
  }

  /* ---------------- reticle-cursor ---------------- */
  var cursor = (function () {
    var node = document.getElementById('cursor');
    if (!node) return { tick: function () {} };
    var label = node.querySelector('.r-label'), cs = node.querySelectorAll('.r-c');
    var px = -100, py = -100, x = -100, y = -100, w = 16, h = 16, tw = 16, th = 16, cx = -100, cy = -100, tx = -100, ty = -100, target = null, down = false, active = false;
    function enable() { active = fineMQ.matches && !reducedMQ.matches; doc.classList.toggle('has-reticle', active); }
    enable();
    fineMQ.addEventListener && fineMQ.addEventListener('change', enable);
    reducedMQ.addEventListener && reducedMQ.addEventListener('change', enable);
    addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY;
      if (x < -50) { x = px; y = py; cx = px; cy = py; }
      node.classList.add('is-on');
      var t = e.target.closest ? e.target.closest('a, button, [data-magnet], [data-cursor], input, [role="slider"], [role="tab"]') : null;
      var native = e.target.closest && e.target.closest('[data-native-cursor]');
      node.style.visibility = native ? 'hidden' : '';
      if (t !== target) {
        target = t;
        var lab = t && t.closest('[data-cursor]') ? t.closest('[data-cursor]').dataset.cursor : '';
        label.textContent = lab; node.classList.toggle('has-label', !!lab);
        if (t && audio.on && !t.matches('input')) audio.click(.012);
      }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { node.classList.remove('is-on'); });
    addEventListener('pointerdown', function () { down = true; });
    addEventListener('pointerup', function () { down = false; });
    return {
      tick: function (dt) {
        if (!active) return;
        x = px; y = py;
        if (target && target.isConnected && !target.matches('[data-cursor]:not(a):not(button)')) {
          var b = target.getBoundingClientRect();
          tx = b.left + b.width / 2; ty = b.top + b.height / 2; tw = b.width + 12; th = b.height + 12;
        } else { tx = px; ty = py; tw = 18; th = 18; }
        if (down) { tw *= .88; th *= .88; }
        cx = damp(cx, tx, 22, dt); cy = damp(cy, ty, 22, dt); w = damp(w, tw, 20, dt); h = damp(h, th, 20, dt);
        node.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
        var ox = cx - x, oy = cy - y, hw = w / 2, hh = h / 2;
        cs[0].style.transform = 'translate(' + (ox - hw) + 'px,' + (oy - hh) + 'px)';
        cs[1].style.transform = 'translate(' + (ox + hw - 8) + 'px,' + (oy - hh) + 'px)';
        cs[2].style.transform = 'translate(' + (ox - hw) + 'px,' + (oy + hh - 8) + 'px)';
        cs[3].style.transform = 'translate(' + (ox + hw - 8) + 'px,' + (oy + hh - 8) + 'px)';
      }
    };
  })();

  /* ---------------- command-palette-motion ---------------- */
  var palette = (function () {
    var root = document.getElementById('cmdk');
    var cmds = [];
    if (!root) return { add: function (c) { cmds.push(c); }, open: function () {} };
    var input = root.querySelector('.cmdk-input'), listEl = root.querySelector('.cmdk-list'), sizer = root.querySelector('.cmdk-sizer');
    var sel = 0, shown = [], lastFocus = null, closing = 0;
    // command-score-style ranking: contiguous > word-start > scattered; penalise gaps
    function score(str, q) {
      str = str.toLowerCase(); q = q.toLowerCase();
      if (!q) return 1;
      if (str.indexOf(q) === 0) return 1;
      var idx = str.indexOf(q);
      if (idx > 0) return /[\s\-:]/.test(str[idx - 1]) ? .9 : .8;
      var s = 0, pos = 0, gaps = 0;
      for (var i = 0; i < q.length; i++) {
        var f = str.indexOf(q[i], pos);
        if (f < 0) return 0;
        var ws = f === 0 || /[\s\-:]/.test(str[f - 1]);
        s += f === pos ? .9 : ws ? .8 : .17; gaps += f - pos; pos = f + 1;
      }
      return (s / q.length) * Math.pow(.999, gaps) * .7;
    }
    function render() {
      var q = input.value.trim();
      var groups = {};
      shown = [];
      cmds.forEach(function (c) {
        var sc = Math.max(score(c.title, q), c.keywords ? score(c.keywords, q) * .9 : 0);
        if (sc > 0) (groups[c.group] = groups[c.group] || []).push({ c: c, s: sc });
      });
      var order = Object.keys(groups).sort(function (a, b) {
        var ma = Math.max.apply(null, groups[a].map(function (x) { return x.s; })), mb = Math.max.apply(null, groups[b].map(function (x) { return x.s; }));
        return q ? mb - ma : 0;
      });
      var html = '';
      order.forEach(function (g) {
        var arr = groups[g]; if (q) arr.sort(function (a, b) { return b.s - a.s; });
        html += '<div role="presentation"><div class="cmdk-group label" aria-hidden="true">' + g + '</div><div role="group" aria-label="' + g + '">';
        arr.forEach(function (x) { html += '<div class="cmdk-item" role="option" id="cmdk-o' + shown.length + '" data-i="' + shown.length + '">' + x.c.title.replace(/[<>&]/g, '') + '</div>'; shown.push(x.c); });
        html += '</div></div>';
      });
      sizer.innerHTML = html || '<p class="cmdk-empty">No results for “' + q.replace(/[<>&]/g, '') + '”.</p>';
      select(0);
    }
    function select(i) {
      if (!shown.length) { input.removeAttribute('aria-activedescendant'); return; }
      sel = (i + shown.length) % shown.length;
      sizer.querySelectorAll('.cmdk-item').forEach(function (n) { n.setAttribute('aria-selected', +n.dataset.i === sel ? 'true' : 'false'); });
      var node = sizer.querySelector('#cmdk-o' + sel);
      input.setAttribute('aria-activedescendant', 'cmdk-o' + sel);
      if (node) node.scrollIntoView({ block: 'nearest' });
    }
    function run(i) {
      var c = shown[i]; if (!c) return;
      root.classList.add('is-bounce');
      setTimeout(function () { root.classList.remove('is-bounce'); close(); setTimeout(function () { c.run(); }, 10); }, 100);
    }
    function open() {
      if (!root.hidden && !closing) return;
      clearTimeout(closing); closing = 0;
      lastFocus = document.activeElement;
      // sections register their commands at mount: mount the rest now so every command is listed
      if (booted) recs.forEach(mountRec);
      root.hidden = false; input.value = ''; render();
      document.getElementById('main') && (document.getElementById('main').inert = true);
      lockScroll(true); audio.muffle(true);
      requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('is-open'); }); });
      input.focus();
    }
    function close() {
      if (root.hidden) return;
      root.classList.remove('is-open');
      document.getElementById('main') && (document.getElementById('main').inert = false);
      lockScroll(false); audio.muffle(false);
      closing = setTimeout(function () { root.hidden = true; closing = 0; }, 200);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    new ResizeObserver(function () { listEl.style.setProperty('--cmdk-list-height', sizer.offsetHeight + 'px'); }).observe(sizer);
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown' || (e.ctrlKey && (k === 'n' || k === 'j'))) { e.preventDefault(); select(e.metaKey ? shown.length - 1 : sel + 1); }
      else if (k === 'ArrowUp' || (e.ctrlKey && (k === 'p' || k === 'k'))) { e.preventDefault(); select(e.metaKey ? 0 : sel - 1); }
      else if (k === 'Home') { e.preventDefault(); select(0); }
      else if (k === 'End') { e.preventDefault(); select(shown.length - 1); }
      else if (k === 'Enter') { e.preventDefault(); run(sel); }
      else if (k === 'Escape') { e.preventDefault(); close(); }
      else if (k === 'Tab') e.preventDefault();
    });
    sizer.addEventListener('pointermove', function (e) { var n = e.target.closest('.cmdk-item'); if (n && +n.dataset.i !== sel) select(+n.dataset.i); });
    sizer.addEventListener('click', function (e) { var n = e.target.closest('.cmdk-item'); if (n) run(+n.dataset.i); });
    root.querySelector('[data-close]').addEventListener('click', close);
    addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); root.hidden || closing ? open() : close(); }
    });
    var btn = document.getElementById('cmdk-open'); if (btn) btn.addEventListener('click', open);
    return { add: function (c) { cmds = cmds.filter(function (x) { return x.id !== c.id; }); cmds.push(c); }, open: open, close: close };
  })();

  /* ---------------- scroll lock ---------------- */
  var locks = 0;
  function lockScroll(on) { locks = Math.max(0, locks + (on ? 1 : -1)); doc.classList.toggle('is-locked', locks > 0); }

  /* ---------------- nav menus (submenu-safe-triangle) ---------------- */
  function initMenus() {
    var triggers = document.querySelectorAll('.menu .menu-trigger');
    if (!triggers.length) return;
    var tri = el('div', 'safe-tri'); tri.hidden = true; document.body.appendChild(tri);
    var closeT = {};
    function sub(tr) { return tr.parentNode.querySelector(':scope > .sub'); }
    function open(tr, focusFirst) {
      var s = sub(tr); if (!s) return;
      // close siblings at the same level
      tr.closest('ul').querySelectorAll(':scope > li > .menu-trigger[aria-expanded="true"]').forEach(function (o) { if (o !== tr) close(o); });
      clearTimeout(closeT[tr.id]);
      tr.setAttribute('aria-expanded', 'true'); s.hidden = false;
      requestAnimationFrame(function () { s.classList.add('is-open'); });
      if (focusFirst) { var f = s.querySelector('[role="menuitem"]'); f && f.focus(); }
    }
    function close(tr) {
      var s = sub(tr); if (!s || tr.getAttribute('aria-expanded') !== 'true') return;
      s.querySelectorAll('.menu-trigger[aria-expanded="true"]').forEach(close);
      tr.setAttribute('aria-expanded', 'false'); s.classList.remove('is-open');
      setTimeout(function () { if (tr.getAttribute('aria-expanded') === 'false') s.hidden = true; }, 160);
    }
    function closeAll() { document.querySelectorAll('.menu > li > .menu-trigger').forEach(close); tri.hidden = true; }
    // safe triangle: from the pointer to the near edge of the open submenu; pointer inside it keeps the submenu open
    var last = { x: 0, y: 0 };
    function updateTri(e, tr) {
      var s = sub(tr); if (!s || s.hidden) { tri.hidden = true; return; }
      var b = s.getBoundingClientRect();
      var right = b.left >= last.x; // submenu is to the right (nested) or below (top level)
      var nested = tr.closest('.sub');
      var a = [e.clientX, e.clientY], p1, p2;
      if (nested) { p1 = [right ? b.left : b.right, b.top]; p2 = [right ? b.left : b.right, b.bottom]; }
      else { p1 = [b.left, b.top]; p2 = [b.right, b.top]; }
      tri.style.cssText = '--ax:' + a[0] + 'px;--ay:' + a[1] + 'px;--bx:' + p1[0] + 'px;--by:' + p1[1] + 'px;--cx:' + p2[0] + 'px;--cy:' + p2[1] + 'px';
      tri.hidden = false; tri._for = tr;
    }
    triggers.forEach(function (tr) {
      var li = tr.parentNode;
      tr.addEventListener('click', function () { tr.getAttribute('aria-expanded') === 'true' ? close(tr) : open(tr); });
      li.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') open(tr); });
      li.addEventListener('pointerleave', function (e) {
        if (e.pointerType !== 'mouse') return;
        last = { x: e.clientX, y: e.clientY };
        updateTri(e, tr);
        closeT[tr.id] = setTimeout(function () { if (!li.matches(':hover')) { close(tr); tri.hidden = true; } }, 320);
      });
      tr.addEventListener('keydown', function (e) {
        var nested = !!tr.closest('.sub');
        if ((!nested && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) || (nested && (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' '))) { e.preventDefault(); open(tr, true); }
      });
    });
    tri.addEventListener('pointermove', function (e) {
      // moving inside the triangle: keep the timer alive; it shrinks as the pointer advances
      if (tri._for) { clearTimeout(closeT[tri._for.id]); updateTri(e, tri._for); var t = tri._for; closeT[t.id] = setTimeout(function () { if (!t.parentNode.matches(':hover')) { close(t); tri.hidden = true; } }, 320); }
    });
    tri.addEventListener('pointerleave', function () { tri.hidden = true; });
    document.querySelectorAll('.sub').forEach(function (s) {
      s.addEventListener('keydown', function (e) {
        var items = Array.prototype.slice.call(s.querySelectorAll(':scope > li > [role="menuitem"]'));
        var i = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
        else if (e.key === 'Escape' || (e.key === 'ArrowLeft' && s.classList.contains('sub-2'))) {
          e.preventDefault(); e.stopPropagation(); var tr = s.parentNode.querySelector(':scope > .menu-trigger'); close(tr); tr.focus();
        } else if (e.key.length === 1 && /\S/.test(e.key)) {
          var k = e.key.toLowerCase();
          var n = items.slice(i + 1).concat(items.slice(0, i + 1)).find(function (x) { return x.textContent.trim().toLowerCase()[0] === k; });
          if (n) n.focus();
        }
      });
      s.addEventListener('click', function (e) { if (e.target.closest('a')) closeAll(); });
    });
    document.addEventListener('pointerdown', function (e) { if (!e.target.closest('.menu') && !e.target.closest('.safe-tri')) closeAll(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  }

  /* ---------------- gated-page-transitions ---------------- */
  var cover = document.getElementById('cover');
  function go(url) {
    if (!cover) { location.href = url; return; }
    store('halden:cover', '1');
    audio.whoosh(.06);
    cover.classList.remove('is-lifting', 'is-start');
    var main = document.getElementById('main');
    if (Site.reduced) { cover.style.opacity = '0'; cover.classList.add('is-covering'); requestAnimationFrame(function () { cover.style.transition = 'opacity .4s ease'; cover.style.opacity = '1'; }); setTimeout(function () { location.href = url; }, 420); return; }
    requestAnimationFrame(function () {
      cover.classList.add('is-covering');
      if (main) main.classList.add('is-pushed');
    });
    setTimeout(function () { location.href = url; }, 950);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-go]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault(); go(a.getAttribute('href'));
  });
  // back/forward cache: never come back to a covered page
  addEventListener('pageshow', function (e) { if (e.persisted && cover) { cover.className = 'cover'; var m = document.getElementById('main'); m && m.classList.remove('is-pushed'); } });

  /* ---------------- skill lens + coverage ---------------- */
  var SKILLS = window.SKILLS || [];
  var byId = {}; SKILLS.forEach(function (s) { byId[s.id] = s; });
  var WHERE = { hero: '01 Hero', film: '02 Story', anatomy: '03 Anatomy', lenses: '04 Lenses', journal: '05 Journal', field: '06 Field test', buy: '07 Buy', specs: 'Specs page', coverage: 'Whole page' };
  var SHELL = {
    'cinematic-loader': 'Loader', 'gpu-renderer-fallback-warmup': 'Boot', 'gpu-tier-adaptive-quality': 'Boot',
    'reticle-cursor': 'Cursor', 'web-audio-soundscape': 'Sound', 'scroll-velocity-whoosh-audio': 'Sound',
    'command-palette-motion': '⌘K', 'submenu-safe-triangle': 'Nav menu', 'stacked-toasts': 'Toasts',
    'gated-page-transitions': 'Page links', 'scroll-velocity-section-metrics': 'Scroll signals', 'scroll-scrubbed-webgl-sections': 'Background'
  };
  function libUrl(id) { return '../skills-library/#' + id; }
  function addTags(node) {
    if (!node || node.querySelector(':scope > .skill-tags') || !node.dataset.skills) return;
    var box = el('div', 'skill-tags'); box.setAttribute('aria-label', 'Skills used here');
    node.dataset.skills.split(',').forEach(function (id) {
      id = id.trim(); if (!id) return;
      var a = el('a', 'skill-tag'); a.href = libUrl(id); a.target = '_blank'; a.rel = 'noopener';
      a.textContent = byId[id] ? byId[id].title : id; a.tabIndex = doc.classList.contains('lens-on') ? 0 : -1;
      box.appendChild(a);
    });
    node.insertBefore(box, node.firstChild);
  }
  function setLens(on) {
    doc.classList.toggle('lens-on', on);
    var b = document.getElementById('lens-toggle'); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    document.querySelectorAll('.skill-tag').forEach(function (a) { a.tabIndex = on ? 0 : -1; });
    store('halden:lens', on ? '1' : '0');
  }
  function buildCoverage() {
    var list = document.getElementById('cov-list'); if (!list) return;
    var where = {};
    document.querySelectorAll('[data-skills]').forEach(function (n) {
      n.dataset.skills.split(',').forEach(function (id) { id = id.trim(); (where[id] = where[id] || []).push(WHERE[n.id] || n.id); });
    });
    Object.keys(SHELL).forEach(function (id) { (where[id] = where[id] || []).unshift(SHELL[id]); });
    var html = '';
    SKILLS.forEach(function (s, i) {
      var w = where[s.id] ? where[s.id].filter(function (v, j, a) { return a.indexOf(v) === j; }).join(' · ') : 'Not used yet';
      html += '<li><a href="' + libUrl(s.id) + '"><span class="n">' + String(i + 1).padStart(2, '0') + '</span><span class="t">' + s.title + '<span class="cat">' + s.cat + '</span></span><span class="w">' + w + '</span></a></li>';
    });
    list.innerHTML = html;
  }

  /* ---------------- loader (cinematic-loader) ---------------- */
  function runLoader(tasks, done) {
    var L = document.getElementById('loader');
    var fast = store('halden:loader-seen') === '1';
    var mark = L.querySelector('.loader-mark'), step = L.querySelector('.loader-step'), sr = L.querySelector('.loader-sr');
    var digits = L.querySelectorAll('.lc-d');
    // three 0–9 strips, each sprung toward its digit (stiffness 260, damping 30, mass .6)
    var strips = [];
    digits.forEach(function (d) {
      var s = el('span'); s.innerHTML = '0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9'; d.appendChild(s);
      strips.push({ node: s, d: d, x: 0, v: 0, target: 0 });
    });
    L.setAttribute('role', 'progressbar'); L.setAttribute('aria-valuemin', '0'); L.setAttribute('aria-valuemax', '100'); L.setAttribute('aria-label', 'Loading Halden LF-1');
    requestAnimationFrame(function () { L.classList.add('is-on'); });
    var real = 0, ready = false, fake = 0, shown = 0, stall = 0, finished = false, t0 = performance.now();
    var speed = fast ? 2.5 : 1;
    // run boot tasks one by one, reporting honest progress
    var i = 0;
    (function next() {
      if (i >= tasks.length) { ready = true; return; }
      var task = tasks[i]; step.textContent = task.label;
      setTimeout(function () {
        try { task.run(); } catch (e) { if (window.console) console.warn(e); }
        i++; real = i / tasks.length; next();
      }, 30);
    })();
    var lp = loop(function (dt) {
      if (performance.now() - t0 > 6000 && !ready) { L.classList.add('is-error'); step.textContent = 'Still loading…'; L.setAttribute('role', 'alert'); }
      if (stall > 0) stall -= dt;
      else if (Math.random() < dt * 9 * speed) {
        fake += fake < .85 ? .03 + Math.random() * .12 : .01 + Math.random() * .03;
        if (Math.random() < .06 && !fast) stall = .7;
      }
      var p = Math.min(fake, ready ? 1 : .9 * real);
      if (ready && fake >= 1) p = 1;
      shown = damp(shown, p, 7, dt); if (p === 1 && shown > .995) shown = 1;
      mark.style.setProperty('--p', shown.toFixed(4));
      var n = Math.round(shown * 100), str = String(n).padStart(3, '0');
      L.setAttribute('aria-valuenow', n);
      strips.forEach(function (s, k) {
        s.target = +str[k];
        var f = -260 * (s.x - s.target) - 30 * s.v; s.v += f / .6 * dt; s.x += s.v * dt;
        s.node.style.transform = 'translateY(' + (-s.x * 1.4) + 'em)';
        s.d.classList.toggle('dim', k < str.length - String(n).length);
      });
      if (shown === 1 && !finished) { finished = true; lp.stop(); exit(); }
    });
    lp.start();
    function exit() {
      store('halden:loader-seen', '1'); sr.textContent = 'Loaded';
      L.classList.add('is-out');
      if (reducedMQ.matches) {
        L.style.transition = 'opacity .8s ease'; L.style.opacity = '0';
        done();
        setTimeout(function () { L.classList.add('is-gone'); }, 820);
        return;
      }
      audio.whoosh(.08);
      // fly-through: exponential zoom into the lens (200,128 of 400×240), warp streaks around the silhouette
      var cv = L.querySelector('.loader-warp'), g = cv.getContext('2d');
      var size = fitCanvas(cv, L, 1.5);
      var streaks = []; for (var k = 0; k < 120; k++) streaks.push({ a: Math.random() * Math.PI * 2, r: Math.random(), l: .05 + Math.random() * .2 });
      mark.style.transformOrigin = '50% 53.3%';
      var T = fast ? 1.7 : 2.55, start = performance.now(), prevZ = 0, revealed = false;
      var fl = loop(function () {
        var t = (performance.now() - start) / 1000 / T;
        var z = t < .18 ? -.08 * Math.sin(t / .18 * Math.PI / 2) : -.08 + 1.08 * Math.pow((t - .18) / .82, 2);
        z = Math.min(z, 1);
        var scale = Math.exp(z * Math.log(60));
        mark.style.transform = 'scale(' + scale + ')';
        var vz = Math.max(0, z - prevZ) * 60; prevZ = z;
        g.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
        g.clearRect(0, 0, size.w, size.h);
        var cx = size.w / 2, cy = size.h / 2, R = Math.hypot(cx, cy);
        g.strokeStyle = 'rgba(236,232,223,.55)'; g.lineWidth = 1;
        g.beginPath();
        streaks.forEach(function (s) {
          s.r += vz * (.4 + s.l) * .05; if (s.r > 1.2) s.r = Math.random() * .2;
          var r0 = s.r * R, r1 = r0 + s.l * R * Math.min(1, vz * 2);
          g.moveTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0); g.lineTo(cx + Math.cos(s.a) * r1, cy + Math.sin(s.a) * r1);
        });
        g.stroke();
        if (t > .45 && !revealed) { revealed = true; done(); }
        if (t > .55) L.style.background = 'rgba(13,13,12,' + Math.max(0, 1 - (t - .55) / .35) + ')';
        if (t > .7) { mark.style.opacity = Math.max(0, 1 - (t - .7) / .25); cv.style.opacity = Math.max(0, 1 - (t - .7) / .3); }
        if (t >= 1) { fl.stop(); L.classList.add('is-gone'); }
      });
      fl.start();
    }
  }

  /* ---------------- public API ---------------- */
  var Site = window.Site = {
    clamp: clamp, lerp: lerp, damp: damp, map: map, el: el, loop: loop, fitCanvas: fitCanvas, css: css,
    audio: audio, toast: toast, bg: bg, palette: palette, lockScroll: lockScroll, go: go,
    tier: { tier: 0, dpr: 1, webgl2: false, mobile: false },
    get reduced() { return reducedMQ.matches; },
    get fine() { return fineMQ.matches; },
    section: function (id, def) { defs[id] = def; },
    boot: boot
  };

  function boot() {
    document.querySelectorAll('main > .sec').forEach(function (n) {
      recs.push({ id: n.id, root: n, mounted: false, live: false, entered: false, inst: null, m: {}, top: 0, h: 0 });
    });
    var foot = document.getElementById('coverage');
    if (foot) { addTags(foot); footRec = foot; }
    buildCoverage();
    initMenus();
    var grid = document.getElementById('grid-overlay');
    if (grid) grid.innerHTML = new Array(13).join('<i></i>');
    try { if (localStorage.getItem('isGrid') === '1' && grid) grid.hidden = false; } catch (e) {}
    addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (e.shiftKey && (e.key === 'G' || e.key === 'g') && tag !== 'input' && tag !== 'textarea' && grid) {
        grid.hidden = !grid.hidden; try { localStorage.setItem('isGrid', grid.hidden ? '0' : '1'); } catch (er) {}
      }
    });
    var lensBtn = document.getElementById('lens-toggle');
    if (lensBtn) lensBtn.addEventListener('click', function () { setLens(!doc.classList.contains('lens-on')); });
    if (store('halden:lens') === '1') setLens(true);
    var sb = document.getElementById('sound-toggle');
    if (sb) {
      sb.addEventListener('click', function () { audio.toggle(); });
      audio.onChange(function (on) { sb.setAttribute('aria-pressed', on ? 'true' : 'false'); sb.querySelector('.label').textContent = on ? 'Sound on' : 'Sound'; });
    }
    document.addEventListener('visibilitychange', function () { if (audio.ctx) audio.muffle(document.hidden); });

    // built-in commands
    var secs = [['hero', 'Top'], ['film', 'The story'], ['anatomy', 'Anatomy'], ['lenses', 'Lenses'], ['journal', 'Field journal'], ['field', 'Night field test'], ['buy', 'Buy'], ['coverage', 'How this page was built']];
    secs.forEach(function (s) {
      if (!document.getElementById(s[0])) return;
      palette.add({ id: 'go-' + s[0], title: s[1], group: 'Go to', keywords: s[0], run: function () { jump(s[0]); } });
    });
    palette.add({ id: 'specs', title: 'Full specs page', group: 'Go to', keywords: 'specifications table', run: function () { go('specs.html'); } });
    if (!isIndex) palette.add({ id: 'home', title: 'Back to the launch page', group: 'Go to', keywords: 'home index', run: function () { go('./'); } });
    palette.add({ id: 'sound', title: 'Toggle sound', group: 'Settings', keywords: 'audio mute music', run: function () { audio.toggle(); } });
    palette.add({ id: 'lens', title: 'Show or hide skill labels', group: 'Settings', keywords: 'skills lens debug', run: function () { setLens(!doc.classList.contains('lens-on')); } });
    palette.add({ id: 'grid', title: 'Toggle layout grid', group: 'Settings', keywords: 'columns shift g', run: function () { if (grid) grid.hidden = !grid.hidden; } });
    palette.add({ id: 'library', title: 'Open the Motion Library', group: 'Go to', keywords: 'skills demos', run: function () { location.href = '../skills-library/'; } });

    var tasks = [
      { label: 'Checking GPU', run: function () { Site.tier = detectTier(); doc.dataset.tier = Site.tier.tier; } },
      { label: 'Compiling shaders', run: function () { bg.init(Site.tier); } },
      { label: 'Warming up', run: function () { bg.warmup(); } },
      { label: 'Measuring', run: function () { remeasure(); } }
    ];
    function arrive() {
      booted = true;
      doc.classList.remove('is-loading');
      remeasure(); setTimeout(remeasure, 1900);
      frame.start();
      // gate: entrances only after the loader/cover has lifted
      setTimeout(function () { gateOpen = true; }, reducedMQ.matches ? 0 : 250);
    }
    if (isIndex && store('halden:cover') !== '1') {
      runLoader(tasks, arrive);
    } else {
      // arriving through a page transition (or a sub page): skip the long loader, lift the cover
      tasks.forEach(function (t) { try { t.run(); } catch (e) {} });
      var L = document.getElementById('loader'); if (L) L.classList.add('is-gone');
      store('halden:cover', '0');
      if (cover) {
        cover.classList.add('is-start');
        doc.classList.add('is-covered');
        booted = true; doc.classList.remove('is-loading'); remeasure(); frame.start();
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          cover.classList.remove('is-start'); cover.classList.add('is-lifting');
          doc.classList.remove('is-covered');
          var m = document.getElementById('main'); if (m) { m.style.transition = 'transform 1s var(--ease-io)'; setTimeout(function () { m.style.transition = ''; }, 1000); }
          setTimeout(function () { gateOpen = true; cover.className = 'cover'; }, reducedMQ.matches ? 300 : 700);
        }); });
      } else arrive();
    }
    var rt = 0;
    addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { remeasure(); bg.resize(Site.tier); }, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    new ResizeObserver(function () { remeasure(); }).observe(document.body);
    // hash links: smooth unless reduced motion
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (!t) return;
      e.preventDefault(); jump(t.id);
    });
  }
  function jump(id) {
    var t = document.getElementById(id); if (!t) return;
    // mount every section up to and including the target first, so the layout above it is final
    if (booted) { for (var i = 0; i < recs.length; i++) { mountRec(recs[i]); if (recs[i].id === id) break; } remeasure(); }
    var y = t.getBoundingClientRect().top + window.scrollY - (id === 'hero' ? 0 : 0);
    window.scrollTo({ top: Math.max(0, y), behavior: reducedMQ.matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
  }
  Site.jump = jump;
})();
