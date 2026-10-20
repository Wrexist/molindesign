/* #hero — 01 · Halden LF-1
   masked-text-reveal (headline lines), kinetic-variable-type (letters), orbit-drag-reveal (lens cap),
   spring-input-physics (camera prop), hud-cinematic-ui (frame, readouts). */
(function () {
  var D2R = Math.PI / 180;
  var LINES = ['See in', 'the dark.'];
  var vib = function (p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  /* spring-input-physics: robust second-order dynamics (f, zeta, r) */
  function SOD(x0, f, z, r) {
    this.w = 2 * Math.PI * f; this.z = z; this.d = this.w * Math.sqrt(Math.abs(z * z - 1));
    this.k1 = z / (Math.PI * f); this.k2 = 1 / (this.w * this.w); this.k3 = r * z / this.w;
    this.y = x0; this.v = 0; this.xp = x0;
  }
  SOD.prototype.update = function (dt, x) {
    if (dt <= 0) return this.y;
    var xv = (x - this.xp) / dt, k1, k2; this.xp = x;
    if (this.w * dt < this.z) { k1 = this.k1; k2 = Math.max(this.k2, dt * dt / 2 + dt * this.k1 / 2, dt * this.k1); }
    else {
      var t1 = Math.exp(-this.z * this.w * dt), al = 2 * t1 * (this.z <= 1 ? Math.cos(dt * this.d) : Math.cosh(dt * this.d));
      var be = t1 * t1, t2 = dt / (1 + be - al); k1 = (1 - be) * t2; k2 = dt * t2;
    }
    this.y += this.v * dt;
    this.v += dt * (x + this.k3 * xv - this.y - k1 * this.v) / k2;
    return this.y;
  };

  var css = [
    '#hero { min-height: 100vh; min-height: 100svh; display: grid; overflow: clip; isolation: isolate; }',
    '#hero .h-in { position: relative; display: grid; grid-template-rows: auto 1fr auto; min-height: inherit; padding: calc(var(--nav-h) + 2rem) var(--gap-x) 2.8rem; }',
    /* HUD frame (hud-cinematic-ui) */
    '#hero .h-frame { position: absolute; inset: calc(var(--nav-h) + 1.2rem) calc(var(--gap-x) - 1.6rem) 1.6rem; pointer-events: none; opacity: 0; transform: scale(1.015); transition: opacity 1.4s var(--ease-out), transform 1.4s var(--ease-out); z-index: 0; }',
    '#hero.is-in .h-frame { opacity: 1; transform: none; }',
    '#hero .h-frame i { position: absolute; width: 2rem; height: 2rem; border: 0 solid var(--p45); }',
    '#hero .h-frame .tl { top: 0; left: 0; border-width: 1px 0 0 1px; } #hero .h-frame .tr { top: 0; right: 0; border-width: 1px 1px 0 0; }',
    '#hero .h-frame .bl { bottom: 0; left: 0; border-width: 0 0 1px 1px; } #hero .h-frame .br { bottom: 0; right: 0; border-width: 0 1px 1px 0; }',
    '#hero .h-top { position: relative; z-index: 3; display: flex; justify-content: space-between; align-items: flex-start; gap: 2.4rem; }',
    '#hero .h-top .kicker { margin: 0; flex: 0 1 36rem; }',
    '#hero .h-no { color: var(--signal); margin: 0 0 .6rem; }',
    '#hero .h-read { display: grid; grid-template-columns: auto auto; gap: .2rem 2rem; margin: 0; padding-right: 1.6rem; border-right: 1px solid var(--p15); text-align: right; }',
    '#hero .h-read dt { color: var(--p45); } #hero .h-read dd { margin: 0; text-transform: none; min-width: 9ch; color: var(--p90); font-family: var(--f-mono); font-size: 1.2rem; letter-spacing: .04em; font-variant-numeric: tabular-nums; }',
    '#hero .h-read .st { color: var(--signal); }',
    /* headline (masked-text-reveal + kinetic-variable-type) */
    '#hero .h-title { position: relative; z-index: 1; margin: 0; width: 100%; font-size: min(15rem, 14.6vw, 15svh); line-height: .9; font-weight: 700; letter-spacing: -.01em; color: var(--paper); user-select: text; text-shadow: 0 2px 24px rgb(0 0 0 / .55); }',
    '#hero .h-title .mask { padding: .06em .12em .14em; margin: -.06em -.12em -.14em; }',
    '#hero .h-title.is-done .mask { overflow: visible; }',
    '#hero .h-title .l2 { text-align: right; }',
    '#hero .h-title .w { display: inline-block; white-space: nowrap; }',
    '#hero .h-title .ch { display: inline-block; position: relative; vertical-align: top; font-variation-settings: "wght" 700, "wdth" 100; }',
    '#hero .h-title .ch .col { position: absolute; left: 0; top: 100%; display: flex; flex-direction: column; }',
    '#hero .h-title .serif { font-family: var(--f-serif); font-style: italic; font-weight: 400; font-stretch: 100%; letter-spacing: 0; }',
    '#hero .h-title ::selection { background: var(--signal); color: #fff; }',
    /* centre stage */
    '#hero .h-mid { position: relative; display: grid; justify-items: center; align-content: center; min-height: 0; }',
    '#hero .h-rig { position: relative; z-index: 2; width: min(46rem, 84vw, 50svh); aspect-ratio: 400 / 370; margin-top: -4svh; user-select: none; -webkit-user-select: none; }',
    '#hero .h-cam { position: absolute; left: 0; top: 0; width: 100%; height: auto; aspect-ratio: 400 / 240; overflow: visible; color: var(--p70); will-change: transform; filter: drop-shadow(0 3rem 4rem rgb(0 0 0 / .6)); }',
    '#hero .h-cap { transition: opacity .3s; }',
    '#hero .h-glow { opacity: 0; transition: opacity 1.2s var(--ease-out); }',
    '#hero.is-open .h-glow { opacity: 1; }',
    '#hero .h-flash { position: absolute; left: 50%; top: 33.7%; width: 46%; aspect-ratio: 1; margin: -23% 0 0 -23%; border-radius: 50%; background: radial-gradient(circle, #fff 0, rgb(255 255 255 / .5) 30%, transparent 70%); opacity: 0; pointer-events: none; mix-blend-mode: screen; }',
    /* arc slider (orbit-drag-reveal) */
    '#hero .h-arc { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }',
    '#hero .h-track { stroke-dasharray: 1 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.8s cubic-bezier(.77,0,.175,1) .4s; }',
    '#hero.is-in .h-track { stroke-dashoffset: 0; }',
    '#hero .h-ui { transition: opacity .4s var(--ease-out); }',
    '#hero.is-open .h-ui { opacity: 0; pointer-events: none; }',
    '#hero .h-handle { position: absolute; left: 0; top: 0; width: 4.4rem; height: 4.4rem; margin: -2.2rem 0 0 -2.2rem; padding: 0; border: 0; background: none; border-radius: 50%; touch-action: none; cursor: grab; z-index: 3; opacity: 0; transition: opacity .8s var(--ease-out) 1s; }',
    '#hero.is-in .h-handle { opacity: 1; } #hero.is-open .h-handle { opacity: 0; transition-delay: 0s; }',
    '#hero .h-handle:active { cursor: grabbing; }',
    '#hero .h-handle i { position: absolute; inset: 0; border-radius: 50%; pointer-events: none; }',
    '#hero .h-ring { border: 1px solid var(--p70); transition: transform .35s var(--ease-out), background-color .35s, border-color .2s; }',
    '#hero .h-handle:focus-visible { outline: none; } #hero .h-handle:focus-visible .h-ring { border-color: #fff; box-shadow: 0 0 0 3px rgb(255 77 31 / .45); }',
    '#hero .h-handle.grab .h-ring { transform: scale(1.7); background: rgb(255 255 255 / .1); }',
    '#hero .h-dot { inset: 1.6rem !important; background: var(--signal); box-shadow: 0 0 1.4rem rgb(255 77 31 / .9); }',
    '#hero .h-ping { border: 1px solid rgb(255 77 31 / .7); opacity: 0; }',
    '#hero .h-ghost { position: absolute; left: 0; top: 0; width: 4.4rem; height: 4.4rem; margin: -2.2rem 0 0 -2.2rem; border-radius: 50%; border: 1px solid var(--p45); opacity: 0; pointer-events: none; }',
    '#hero .h-ghost::after { content: ""; position: absolute; inset: 1.7rem; border-radius: 50%; background: var(--p90); }',
    '#hero .h-lab { position: absolute; left: 0; top: 0; margin: 0; color: var(--p90); white-space: nowrap; pointer-events: none; text-shadow: 0 1px 14px rgb(0 0 0 / .8); opacity: 0; transition: opacity .8s var(--ease-out) 1.2s; }',
    '#hero.is-in .h-lab { opacity: 1; } #hero .h-lab.dim { opacity: .5; transition-delay: 0s; } #hero.is-open .h-lab { opacity: 0; transition-delay: 0s; }',
    '#hero .h-done { position: absolute; left: 50%; bottom: 4%; transform: translateX(-50%); display: flex; gap: 1.6rem; align-items: center; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .6s var(--ease-out); }',
    '#hero.is-open .h-done { opacity: 1; pointer-events: auto; transition-delay: .5s; }',
    '#hero .h-done .label { color: var(--signal); }',
    /* bottom row */
    '#hero .h-bot { position: relative; z-index: 3; display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; gap: 2.4rem; }',
    '#hero .h-lede { margin: 0; max-width: 40rem; color: var(--p70); font-size: 1.6rem; line-height: 1.5; }',
    '#hero .h-lede b { color: var(--paper); font-weight: 500; }',
    '#hero .h-hint { display: grid; justify-items: center; gap: 1rem; color: var(--p45); text-decoration: none; transition: color .2s; } #hero .h-hint:hover { color: var(--paper); }',
    '#hero .h-hint i { position: relative; width: 1px; height: 3.6rem; background: var(--p15); overflow: hidden; }',
    '#hero .h-hint i::after { content: ""; position: absolute; left: 0; top: 0; width: 1px; height: 1.2rem; background: var(--paper); animation: hHint 1.6s cubic-bezier(.65,0,.35,1) infinite; }',
    '@keyframes hHint { from { transform: translateY(-1.2rem); } to { transform: translateY(3.6rem); } }',
    '#hero .h-buy { justify-self: end; display: grid; justify-items: end; gap: .8rem; }',
    '#hero .h-buy .label { color: var(--p45); }',
    '@media (max-width: 767px) {',
    '  #hero .h-in { padding-top: calc(var(--nav-h) + 2rem); padding-bottom: 2.4rem; }',
    '  #hero .h-read { grid-template-columns: auto; gap: 0; padding-right: 1rem; } #hero .h-read dt { display: none; }',
    '  #hero .h-top .kicker::after { display: none; }',
    '  #hero .h-title { font-size: min(15.4vw, 11svh); margin-top: 2.4rem; }\n  #hero .h-rig { margin-top: 1.6rem; }',
    '  #hero .h-bot { grid-template-columns: 1fr auto; } #hero .h-hint { display: none; }',
    '  #hero .h-lede { font-size: 1.5rem; }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  #hero .h-hint i::after { animation: none; transform: translateY(1.2rem); }',
    '  #hero .h-track { transition: none; stroke-dashoffset: 0; }',
    '  #hero .h-frame { transform: none; }',
    '}'
  ].join('\n');

  Site.section('hero', {
    css: css,
    mount: function (root, ctx) {
      var R0 = ctx.reduced, FINE = ctx.fine;
      var ticks = '';
      for (var k = 0; k < 60; k++) { var a = k * 6 * D2R; ticks += 'M' + (Math.cos(a) * 66).toFixed(1) + ' ' + (Math.sin(a) * 66).toFixed(1) + 'L' + (Math.cos(a) * 71).toFixed(1) + ' ' + (Math.sin(a) * 71).toFixed(1); }

      root.innerHTML =
        '<h1 class="sr-only">Halden LF‑1, a full-frame field camera for night photography</h1>' +
        '<div class="h-in">' +
        '<div class="h-frame" aria-hidden="true"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i></div>' +
        '<div class="h-top">' +
        '  <div><p class="label h-no rise">[ Nº 01 / 07 ]</p><p class="kicker rise"><span>01</span>Halden LF‑1</p></div>' +
        '  <dl class="h-read label rise" aria-label="Exposure readout">' +
        '    <dt>ISO</dt><dd class="r-iso">3200</dd><dt>Shutter</dt><dd class="r-sh">1/60 s</dd><dt>Aperture</dt><dd class="r-f">f/1.4</dd><dt>Lens</dt><dd class="r-st st">Cap on</dd>' +
        '  </dl>' +
        '</div>' +
        '<div class="h-mid">' +
        '  <h2 class="h-title display" aria-label="' + LINES.join(' ') + '"></h2>' +
        '  <div class="h-rig">' +
        '    <svg class="h-cam" viewBox="0 0 400 240" role="img" aria-label="The Halden LF‑1, front view' + '"><use href="#lf1"/>' +
        '      <circle class="h-glow" cx="200" cy="128" r="37" fill="none" stroke="var(--signal)" stroke-width="2" style="filter:drop-shadow(0 0 6px var(--signal))"/>' +
        '      <g class="h-cap" transform="translate(200 128)"><g class="h-cap-in">' +
        '        <circle r="71" fill="#121211" stroke="currentColor" stroke-width="1.4"/>' +
        '        <path d="' + ticks + '" stroke="currentColor" stroke-opacity=".35" stroke-width="1"/>' +
        '        <circle r="58" fill="url(#lf1-grain)" stroke="currentColor" stroke-opacity=".3"/>' +
        '        <rect x="-62" y="-7" width="12" height="14" rx="3" fill="#2a2a27" stroke="currentColor" stroke-opacity=".5"/><rect x="50" y="-7" width="12" height="14" rx="3" fill="#2a2a27" stroke="currentColor" stroke-opacity=".5"/>' +
        '        <text y="-2" text-anchor="middle" font-family="Archivo, sans-serif" font-size="11" font-weight="700" letter-spacing="5" fill="currentColor" opacity=".85">HALDEN</text>' +
        '        <text y="14" text-anchor="middle" font-family="Geist Mono, monospace" font-size="6.5" letter-spacing="2" fill="currentColor" opacity=".5">Ø 70 · LF‑1</text>' +
        '      </g></g>' +
        '    </svg>' +
        '    <div class="h-flash" aria-hidden="true"></div>' +
        '    <svg class="h-arc h-ui" aria-hidden="true"><defs><linearGradient id="h-fade" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
        '      <path class="h-track" pathLength="1" fill="none" stroke="url(#h-fade)" stroke-width="1"/>' +
        '      <path class="h-hintp" pathLength="1" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
        '      <path class="h-prog" pathLength="1" fill="none" stroke="var(--signal)" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
        '      <line class="h-tick" stroke="#fff" stroke-opacity=".7" stroke-width="1"/></svg>' +
        '    <div class="h-ghost h-ui" aria-hidden="true"></div>' +
        '    <button type="button" class="h-handle h-ui" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="Lens cap on" aria-label="Drag to take the lens cap off" data-cursor="Drag"><i class="h-ping"></i><i class="h-ring"></i><i class="h-dot"></i></button>' +
        '    <p class="label h-lab h-ui" aria-hidden="true">Drag to uncap</p>' +
        '    <div class="h-done"><span class="label">Lens open · f/1.4</span><button type="button" class="btn ghost small h-again">Cap it again</button></div>' +
        '  </div>' +
        '</div>' +
        '<div class="h-bot">' +
        '  <p class="h-lede rise">A 24 MP full-frame camera with a fixed <b>35 mm f/1.4</b>, made for the hours after sunset. ISO to 102 400, 412 g, sealed against weather. Built in Lysekil, Sweden.</p>' +
        '  <a class="h-hint label" href="#film" aria-label="Scroll to the film"><span>Scroll for the night</span><i aria-hidden="true"></i></a>' +
        '  <div class="h-buy rise"><span class="label">From SEK 18 900</span><a class="btn small" href="#buy" data-magnet>Reserve yours</a></div>' +
        '</div>' +
        '</div>';

      var $ = function (s) { return root.querySelector(s); };
      var title = $('.h-title'), rig = $('.h-rig'), cam = $('.h-cam'), cap = $('.h-cap'), capIn = $('.h-cap-in'), flash = $('.h-flash');
      var track = $('.h-track'), hintp = $('.h-hintp'), prog = $('.h-prog'), tick = $('.h-tick'), grad = $('#h-fade');
      var ghost = $('.h-ghost'), handle = $('.h-handle'), ping = $('.h-ping'), lab = $('.h-lab'), again = $('.h-again');
      var rIso = $('.r-iso'), rSh = $('.r-sh'), rF = $('.r-f'), rSt = $('.r-st');
      var clamp = ctx.clamp, fit = function (x, a, b) { return clamp((x - a) / (b - a), 0, 1); };

      /* ---------- kinetic-variable-type: build chars ---------- */
      var chars = [], intro = false, introDone = R0, rollAnims = [];
      function build(clones) {
        chars = []; title.innerHTML = '';
        var pool = LINES.join('').replace(/[\s.]/g, '');
        LINES.forEach(function (txt, li) {
          var mask = ctx.el('span', 'mask'), line = ctx.el('span', 'line l' + (li + 1));
          mask.setAttribute('aria-hidden', 'true');
          txt.split(' ').forEach(function (word, wi) {
            if (wi) line.appendChild(document.createTextNode(' '));
            var w = ctx.el('span', 'w');
            word.split('').forEach(function (c) {
              var s = ctx.el('span', 'ch'); s.textContent = c;
              if (clones) {
                var col = ctx.el('span', 'col');
                for (var q = 0; q < 3; q++) { var g = ctx.el('span'); g.textContent = q === 2 ? c : pool[(Math.random() * pool.length) | 0]; col.appendChild(g); }
                s.appendChild(col);
              }
              w.appendChild(s); chars.push(s);
            });
            line.appendChild(w);
          });
          mask.appendChild(line); title.appendChild(mask);
        });
        if (root.classList.contains('is-in')) title.classList.add('is-in');
        kin.dirty = true;
      }
      // pointer progress (P) and "live" amount (L), damped like gsap.quickTo(.4)
      var kin = { p: .5, pt: .5, l: 0, lt: 0, dirty: true, auto: -1 };
      function applyKin() {
        var p = kin.p, l = kin.l, lerp = ctx.lerp;
        // skill values wght 1000↔700 / wdth 60↔150, mapped into Archivo's range (wght ≤ 900, wdth 62–125)
        var ew = lerp(700, lerp(900, 600, p), l), ed = lerp(100, lerp(62, 125, p), l);
        var ow = lerp(700, lerp(600, 900, p), l), od = lerp(100, lerp(125, 62, p), l);
        for (var i = 0; i < chars.length; i++) {
          var even = i % 2 === 0;
          chars[i].style.fontVariationSettings = '"wght" ' + Math.round(even ? ew : ow) + ', "wdth" ' + (even ? ed : od).toFixed(1);
        }
      }
      function roll() {
        intro = true; title.classList.remove('is-done'); build(true);
        var last;
        chars.forEach(function (c, i) {
          last = c.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(-300%)' }],
            { duration: 1800, delay: 200 + i * 55, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'both' });
          rollAnims.push(last);
        });
        last.onfinish = endRoll;
      }
      function endRoll() {
        rollAnims.forEach(function (a) { try { a.cancel(); } catch (e) {} }); rollAnims = [];
        intro = false; introDone = true; build(false); title.classList.add('is-done');
        if (!FINE && !R0) kin.auto = 0;            // touch: one slow auto 0→1→0 demonstration
      }
      build(false);
      if (R0) title.classList.add('is-done');

      /* ---------- spring-input-physics + HUD readouts ---------- */
      var mouse = { x: 0, y: 0, px: 0, py: 0, has: false };
      var sx = new SOD(0, 1.35, .5, 1.25), sy = new SOD(0, 1.35, .5, 1.25);
      var push = { vx: 0, vy: 0, x: 0, y: 0, r: 0, vr: 0 }, lastEx = 0, lastEy = 0;
      var FSTOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16], SHUT = [8000, 4000, 2000, 1000, 500, 250, 125, 60, 30, 15, 8, 4];
      var ISOS = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200, 102400], lastRead = '';
      function readout(nx, ny) {
        var fi = Math.round(clamp((nx + 1) / 2, 0, 1) * (FSTOPS.length - 1)), si = Math.round(clamp((ny + 1) / 2, 0, 1) * (SHUT.length - 1));
        var N = FSTOPS[fi], t = 1 / SHUT[si];
        var iso = 3200 * Math.pow(N / 1.4, 2) * ((1 / 60) / t), best = ISOS[0];
        ISOS.forEach(function (v) { if (Math.abs(Math.log(v / iso)) < Math.abs(Math.log(best / iso))) best = v; });
        var key = fi + ':' + si; if (key === lastRead) return; lastRead = key;
        rIso.textContent = best.toLocaleString('sv-SE').replace(/\s/g, ' ');
        rSh.textContent = '1/' + SHUT[si] + ' s'; rF.textContent = 'f/' + N;
      }
      function onMove(e) {
        if (e.pointerType !== 'mouse') return;
        mouse.x = clamp(e.clientX / innerWidth * 2 - 1, -1, 1); mouse.y = clamp(e.clientY / innerHeight * 2 - 1, -1, 1); mouse.has = true;
        if (introDone && !R0) { kin.pt = (mouse.x + 1) / 2; kin.lt = 1; }
      }
      function onLeaveDoc() { kin.lt = 0; mouse.x = 0; mouse.y = 0; }

      /* ---------- orbit-drag-reveal ---------- */
      var G = {}, p = 0, vel = 0, mode = 'idle', samples = [], quarter = 0, kbd = false, committed = false, toasted = false;
      var interacted = false, hintCount = 0, timers = [], anims = [], commitT = 0, from = 0, crank = null;
      function layout() {
        var W = rig.clientWidth, H = rig.clientHeight;
        G.W = W; G.H = H; G.cx = W / 2; G.cy = W * .6 * 128 / 240;
        G.a0 = -138; G.a1 = -42; G.R = Math.min(W * .55, H - G.cy - 32);
        var a = pt(0), b = pt(1);
        var d = 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' A' + G.R.toFixed(1) + ' ' + G.R.toFixed(1) + ' 0 0 0 ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
        [track, hintp, prog].forEach(function (el) { el.setAttribute('d', d); });
        grad.setAttribute('x1', a.x); grad.setAttribute('y1', a.y); grad.setAttribute('x2', b.x); grad.setAttribute('y2', b.y);
        var th = G.a1 * D2R, ux = Math.cos(th), uy = -Math.sin(th);
        tick.setAttribute('x1', b.x - ux * 6); tick.setAttribute('y1', b.y - uy * 6); tick.setAttribute('x2', b.x + ux * 6); tick.setAttribute('y2', b.y + uy * 6);
        lab.style.transform = 'translate3d(' + G.cx.toFixed(1) + 'px,' + (G.cy + G.R + 14).toFixed(1) + 'px,0) translateX(-50%)';
        place();
      }
      function pt(t) { var th = (G.a0 + (G.a1 - G.a0) * t) * D2R; return { x: G.cx + G.R * Math.cos(th), y: G.cy - G.R * Math.sin(th) }; }
      function place() {
        var c = clamp(p, -.06, 1), q = pt(c);
        handle.style.transform = 'translate3d(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px,0)';
        prog.setAttribute('stroke-dashoffset', 1 - clamp(p, 0, 1));
        var pc = Math.round(clamp(p, 0, 1) * 100);
        handle.setAttribute('aria-valuenow', pc); handle.setAttribute('aria-valuetext', pc >= 100 ? 'Lens cap off' : pc === 0 ? 'Lens cap on' : pc + ' percent off');
        drawCap();
      }
      function drawCap() {
        var e = clamp(p, 0, 1), twist = fit(e, 0, .25), lift = fit(e, .15, 1); lift = 1 - Math.pow(1 - lift, 2);
        var dx = lift * 250, dy = -lift * 150 - Math.sin(lift * Math.PI) * 30, rot = twist * 40 + lift * 150, sc = 1 + lift * .18;
        cap.setAttribute('transform', 'translate(' + (200 + dx).toFixed(1) + ' ' + (128 + dy).toFixed(1) + ') rotate(' + rot.toFixed(1) + ') scale(' + sc.toFixed(3) + ')');
        cap.style.opacity = (1 - fit(e, .78, 1)).toFixed(3);
        rSt.textContent = e >= 1 ? 'Open' : e > .02 ? Math.round(e * 100) + ' %' : 'Cap on';
      }
      function fromPointer(e) {
        var b = rig.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
        var ang = Math.atan2(-(y - G.cy), x - G.cx) / D2R, mid = (G.a0 + G.a1) / 2;
        var dd = ((ang - mid + 540) % 360) - 180;
        if (Math.abs(dd) > 120) return null;
        var n = (dd + (G.a1 - G.a0) / 2) / (G.a1 - G.a0);   // 0 at a0 (lower left), 1 at a1 (lower right)
        return n < 0 ? Math.max(.25 * n, -.06) : Math.min(n, 1);
      }
      function setP(n) {
        p = n;
        var q = Math.floor(clamp(p, 0, 1) * 4);
        if (q !== quarter) { if (q > quarter) { vib(4); if (ctx.audio.on) ctx.audio.click(.15); } quarter = q; }
        if (crank) { var c = ctx.audio.ctx, k = Math.max(0, p); crank.g.gain.setTargetAtTime(.12 * Math.pow(k, .8), c.currentTime, .03); crank.s.playbackRate.setTargetAtTime(.85 + .5 * k, c.currentTime, .03); }
        place();
      }
      function startCrank() {
        var A = ctx.audio; if (!A.on || !A.ctx) return;
        var c = A.ctx, s = c.createBufferSource(), bp = c.createBiquadFilter(), gn = c.createGain();
        s.buffer = A.noise(); s.loop = true; bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 4; gn.gain.value = 0;
        s.connect(bp).connect(gn).connect(A.out); s.start(); crank = { s: s, g: gn };
      }
      function stopCrank() { if (!crank) return; try { var c = ctx.audio.ctx; crank.g.gain.setTargetAtTime(0, c.currentTime, .05); crank.s.stop(c.currentTime + .3); } catch (e) {} crank = null; }
      function touch() { if (!interacted) { interacted = true; clearHints(); } }
      handle.addEventListener('pointerenter', touch); handle.addEventListener('focus', touch);
      handle.addEventListener('pointerdown', function (e) {
        if (committed) return;
        touch(); kbd = false; e.preventDefault(); handle.focus({ preventScroll: true });
        try { handle.setPointerCapture(e.pointerId); } catch (er) {}
        mode = 'drag'; vel = 0; samples = []; handle.classList.add('grab'); lab.classList.add('dim'); startCrank();
      });
      handle.addEventListener('pointermove', function (e) {
        if (mode !== 'drag') return;
        var n = fromPointer(e); if (n == null) return;
        samples.push({ p: n, t: performance.now() }); if (samples.length > 5) samples.shift();
        setP(n);
        if (p >= .97) commit();
      });
      function release() {
        if (mode !== 'drag') return;
        handle.classList.remove('grab'); lab.classList.remove('dim'); stopCrank();
        var v = 0, s = samples;
        if (s.length > 1) v = (s[s.length - 1].p - s[0].p) / Math.max((s[s.length - 1].t - s[0].t) / 1000, .001);
        if (performance.now() - (s.length ? s[s.length - 1].t : 0) > 120) v = 0;
        if (v > 1.4 && p > .12) commit();                         // flick commit
        else { mode = R0 ? 'idle' : 'spring'; vel = 0; if (R0) setP(0); }
      }
      handle.addEventListener('pointerup', release); handle.addEventListener('pointercancel', release);
      handle.addEventListener('keydown', function (e) {
        if (committed) return;
        var k = e.key; kbd = true;
        if (k === 'ArrowRight' || k === 'ArrowUp') { e.preventDefault(); touch(); mode = 'idle'; setP(Math.min(1, Math.round((p + .1) * 10) / 10)); if (p >= .97) commit(); }
        else if (k === 'ArrowLeft' || k === 'ArrowDown') { e.preventDefault(); touch(); mode = 'idle'; setP(Math.max(0, Math.round((p - .1) * 10) / 10)); }
        else if (k === 'Home') { e.preventDefault(); mode = 'idle'; setP(0); }
        else if (k === 'Enter' || k === ' ' || k === 'End') { e.preventDefault(); touch(); commit(); }
      });
      again.addEventListener('click', function () { reset(); handle.focus({ preventScroll: true }); });

      function commit() {
        if (committed) return;
        committed = true; mode = 'commit'; commitT = 0; from = p; vib([12, 40, 24]); stopCrank();
        handle.classList.remove('grab'); lab.classList.remove('dim');
      }
      function finish() {
        mode = 'idle'; p = 1; place();
        var hadFocus = kbd && document.activeElement === handle;
        root.classList.add('is-open');
        handle.disabled = false; handle.inert = true; handle.setAttribute('aria-hidden', 'true');
        if (hadFocus) again.focus({ preventScroll: true });
        ctx.audio.shutter();
        if (!R0) flash.animate([{ opacity: 0 }, { opacity: .9, offset: .12 }, { opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.23,1,.32,1)' });
        if (!toasted) { toasted = true; ctx.toast('Lens cap off', { description: '35 mm at f/1.4, wide open. The night starts below.', type: 'success' }); }
      }
      function reset() {
        clearHints(); stopCrank(); committed = false; mode = 'idle'; p = 0; vel = 0; quarter = 0;
        root.classList.remove('is-open'); handle.inert = false; handle.removeAttribute('aria-hidden'); place();
      }

      /* onboarding hint: ghost rides the arc after 3 s, up to 3× every 5.5 s */
      function clearHints() { timers.forEach(clearTimeout); timers = []; anims.forEach(function (a) { try { a.cancel(); } catch (e) {} }); anims = []; }
      function hint() {
        if (interacted || committed || hintCount >= 3) return;
        hintCount++;
        if (R0) anims.push(lab.animate([{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }], { duration: 1600 }));
        else {
          var kf = [], N = 14, i, s0 = pt(0), e0 = pt(.85);
          kf.push({ offset: 0, opacity: 0, transform: 'translate3d(' + s0.x + 'px,' + s0.y + 'px,0)' });
          for (i = 0; i <= N; i++) {
            var u = i / N, s = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, q = pt(s * .85);
            kf.push({ offset: .15 + .55 * u, opacity: 1, transform: 'translate3d(' + q.x + 'px,' + q.y + 'px,0)' });
          }
          kf.push({ offset: .85, opacity: 1, transform: 'translate3d(' + e0.x + 'px,' + e0.y + 'px,0)' });
          kf.push({ offset: 1, opacity: 0, transform: 'translate3d(' + e0.x + 'px,' + e0.y + 'px,0)' });
          anims.push(ghost.animate(kf, { duration: 2600, easing: 'linear' }));
          anims.push(hintp.animate([{ strokeDashoffset: 1, offset: 0 }, { strokeDashoffset: 1, offset: .15 }, { strokeDashoffset: .15, opacity: 1, offset: .7 }, { strokeDashoffset: .15, opacity: 1, offset: .85 }, { strokeDashoffset: .15, opacity: 0 }], { duration: 2600 }));
          anims.push(ping.animate([{ transform: 'scale(1)', opacity: .9 }, { transform: 'scale(2.4)', opacity: 0 }], { duration: 1400, easing: 'cubic-bezier(.23,1,.32,1)' }));
          anims.push(tick.animate([{ stroke: '#fff' }, { stroke: '#ff4d1f', offset: .62 }, { stroke: '#ff4d1f', offset: .7 }, { stroke: '#fff' }], { duration: 2600 }));
        }
        timers.push(setTimeout(hint, 5500));
      }

      /* ---------- one loop: kinetic type, arc spring/commit, prop physics ---------- */
      var lp = ctx.loop(function (dt) {
        // arc
        if (mode === 'spring') {
          for (var i = 0; i < 2; i++) { var h = dt / 2, a = -170 * p - 26 * vel; vel += a * h; p += vel * h; }
          if (Math.abs(p) < .001 && Math.abs(vel) < .01) { p = 0; vel = 0; mode = 'idle'; }
          setP(p);
        } else if (mode === 'commit') {
          commitT += dt;
          var t = R0 ? 1 : clamp(commitT / .7, 0, 1);
          p = ctx.lerp(from, 1, 1 - Math.pow(1 - t, 3)); place();
          if (t >= 1) finish();
        }
        // kinetic type
        if (kin.auto >= 0) {
          kin.auto += dt; var k = Math.min(kin.auto / 2.4, 1);
          kin.pt = .5 + .5 * Math.sin(k * Math.PI * 2) * .9; kin.lt = kin.auto < 2.4 ? 1 : 0;
          if (kin.auto > 2.4) kin.auto = -1;
        }
        if (!intro) {
          var np = ctx.damp(kin.p, kin.pt, 1 / .12, dt), nl = ctx.damp(kin.l, kin.lt, 1 / .25, dt);
          if (Math.abs(np - kin.p) > 1e-4 || Math.abs(nl - kin.l) > 1e-4 || kin.dirty) { kin.p = np; kin.l = nl; kin.dirty = false; applyKin(); }
        }
        // prop physics (fine pointer only; rest pose under reduced motion)
        if (R0 || !FINE) return;
        var dragging = mode === 'drag';
        var tx = dragging ? 0 : mouse.x, ty = dragging ? 0 : mouse.y;
        var ex = sx.update(dt, tx), ey = sy.update(dt, ty);
        var mvx = (ex - lastEx) / dt, mvy = (ey - lastEy) / dt; lastEx = ex; lastEy = ey;
        // velocity push: strongest when the eased pointer is near the prop's centre
        var b = G.W ? 1 - clamp(Math.hypot(ex, ey * 1.4) / .9, 0, 1) : 0, damp = Math.exp(-dt * 2);
        push.vx = push.vx * damp + mvx * b * 260 * dt; push.vy = push.vy * damp + mvy * b * 160 * dt;
        push.vr = push.vr * damp + mvx * b * 9 * dt;
        push.x = clamp((push.x + push.vx * dt) * damp, -40, 40); push.y = clamp((push.y + push.vy * dt) * damp, -24, 24);
        push.r = clamp((push.r + push.vr * dt) * damp, -6, 6);
        cam.style.transform = 'perspective(900px) translate3d(' + (ex * 16 + push.x).toFixed(2) + 'px,' + (ey * 10 + push.y).toFixed(2) + 'px,0) rotateY(' + (ex * 9).toFixed(2) + 'deg) rotateX(' + (-ey * 7).toFixed(2) + 'deg) rotateZ(' + push.r.toFixed(2) + 'deg)';
        if (mouse.has) readout(ex, ey);
      });

      var ro = new ResizeObserver(layout);
      layout();
      if (R0) applyKin();

      return {
        start: function () {
          ro.observe(rig); lp.start();
          window.addEventListener('pointermove', onMove, { passive: true });
          document.documentElement.addEventListener('pointerleave', onLeaveDoc);
          if (root.classList.contains('is-in') && !interacted && !committed) timers.push(setTimeout(hint, hintCount ? 1500 : 3000));
        },
        stop: function () {
          lp.stop(); ro.disconnect(); clearHints(); stopCrank();
          window.removeEventListener('pointermove', onMove);
          document.documentElement.removeEventListener('pointerleave', onLeaveDoc);
          if (mode === 'drag') { handle.classList.remove('grab'); lab.classList.remove('dim'); mode = 'spring'; }
          if (mode === 'commit') finish();
          if (intro) endRoll();
        },
        enter: function () {
          root.classList.add('is-in'); title.classList.add('is-in');
          root.querySelectorAll('.rise').forEach(function (n, i) { n.style.transitionDelay = (.35 + i * .12) + 's'; n.classList.add('is-in'); });
          if (!R0) roll();
          if (!interacted) timers.push(setTimeout(hint, 3000));
        },
        scroll: function () {}
      };
    }
  });
})();
