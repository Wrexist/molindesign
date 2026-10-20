/* #field: Night field test. gated-stage-scroll (3 stages on native scroll via m.pin, ruler HUD, XP once per stage)
   + hold-to-advance (commit-hold ring, 500 ms resume grace, keyboard + click alternative)
   + instanced-grass-and-snow-parallax (WebGL2 instanced grass, footprint height-map snow; Canvas 2D silhouette fallback)
   + device-agnostic-input-actions (MOVE/SHOOT over keyboard, polled gamepads, touch virtual pad, glyph swap). */
(function () {
  var dead = function (v, d) { d = d || .1; return Math.abs(v) < d ? 0 : Math.sign(v) * Math.min(1, (Math.abs(v) - d) / (1 - d)); };
  var GLYPH = { keyboard: ['WASD / Arrows', 'Space'], gamepad: ['L-stick / D-pad', 'Ⓐ'], touch: ['Stick', 'Shoot button'] };
  var STEPS = [
    ['Walk in', '−100 lux and falling. The 24 MP sensor reads a meadow at nine at night as grass, not grain: ISO 102 400 when you need it.'],
    ['The snow line', 'Weather sealed, 40 hours on one battery. Long enough to wait for the light. Your tracks fill in behind you.'],
    ['Five fireflies', 'Move the finder and shoot. Five frames at f/1.4 and the field test is done.']
  ];
  var C = 2 * Math.PI * 46;

  Site.section('field', {
    css: `
#field { height: 300vh; }
#field .fd-stage { position: sticky; top: 0; height: 100vh; height: 100svh; overflow: hidden; }
#field canvas.fd-gl { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
#field .fd-dim { position: absolute; inset: 0; background: rgb(13 13 12 / .74); backdrop-filter: grayscale(1); -webkit-backdrop-filter: grayscale(1); clip-path: circle(150% at 50% 60%); transition: clip-path 1.1s var(--ease-io), opacity .3s; pointer-events: none; }
#field .fd-dim.off { clip-path: circle(0% at 50% 60%); }
#field .fd-scrim { position: absolute; inset: 0 0 auto; height: 60%; background: linear-gradient(rgb(13 13 12 / .82), rgb(13 13 12 / 0)); pointer-events: none; }
#field .fd-flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
#field .fd-flash.go { animation: fd-flash .35s ease-out; }
@keyframes fd-flash { 0% { opacity: .55; } 100% { opacity: 0; } }
#field .fd-top { position: absolute; z-index: 3; left: 0; right: 0; top: calc(var(--nav-h) + 1.6rem); display: flex; justify-content: space-between; gap: 2rem; pointer-events: none; }
#field .fd-copy { max-width: 52rem; }
#field .kicker { margin-bottom: 1.6rem; }
#field h2 { font-size: 4.4rem; }
#field .fd-steps { position: relative; margin-top: 2rem; min-height: 10rem; }
#field .fd-step { position: absolute; inset: 0 auto auto 0; opacity: 0; transform: translateY(.8rem); transition: opacity .5s var(--ease-out), transform .5s var(--ease-out); }
#field .fd-step.on { opacity: 1; transform: none; position: relative; }
#field .fd-step h3 { font-size: 2rem; font-stretch: 125%; letter-spacing: -.01em; margin: .4rem 0 .6rem; }
#field .fd-step p { color: var(--p70); max-width: 40rem; }
#field .fd-step .label { color: var(--p45); }
#field .fd-step .lock { color: var(--signal); }
#field .fd-xp { align-self: flex-start; flex: none; display: inline-flex; align-items: center; gap: .8rem; padding: 1rem 1.5rem; border-radius: 999px; border: 1px solid #ffffff1a; background: #0006; backdrop-filter: saturate(120%) blur(14px); -webkit-backdrop-filter: saturate(120%) blur(14px); }
#field .fd-xp i { width: 1.4rem; height: 1.4rem; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff, var(--paper) 40%, #9c978c); }
#field .fd-xp b { font-weight: 500; font-size: 1.5rem; } #field .fd-xp span { opacity: .6; }
#field .fd-xp.xp-ripple { animation: fd-xp 1.8s ease-out; }
@keyframes fd-xp { 12% { border-color: #ffc832e6; box-shadow: 0 0 14px #ffbe28b3, 0 0 30px #ffaa004d; background: #fffffff2; color: var(--ink); } 100% { } }
#field .fd-gate { position: absolute; z-index: 4; left: 50%; bottom: 11rem; transform: translate(-50%, 1rem); display: grid; justify-items: center; gap: 1rem; opacity: 0; visibility: hidden; transition: opacity .3s, transform .3s var(--ease-out), visibility 0s .3s; text-align: center; }
#field .fd-gate.on { opacity: 1; visibility: visible; transform: translate(-50%, 0); transition-delay: 0s; }
#field .fd-ring { position: relative; width: 10.4rem; height: 10.4rem; border-radius: 50%; display: grid; place-items: center; touch-action: none; -webkit-touch-callout: none; user-select: none; -webkit-user-select: none; background: rgb(13 13 12 / .55); }
#field .fd-ring svg { position: absolute; inset: 0; transform: rotate(-90deg); }
#field .fd-ring circle { fill: none; stroke-width: 2; }
#field .fd-ring .bgc { stroke: var(--p15); } #field .fd-ring .pc { stroke: var(--signal); stroke-dasharray: ${C.toFixed(2)}; stroke-dashoffset: ${C.toFixed(2)}; }
#field .fd-ring.reset .pc { transition: stroke-dashoffset .3s cubic-bezier(.25,.46,.45,.94); }
#field .fd-ring .lb { transition: opacity .3s; } #field .fd-ring.pressed .lb { opacity: 0; transition-duration: .2s; }
#field .fd-gate .alt { color: var(--p70); text-decoration: underline; text-underline-offset: .4rem; text-decoration-color: var(--p45); padding: .8rem; font-size: 1.3rem; }
#field .fd-gate .alt:hover { color: var(--paper); text-decoration-color: var(--signal); }
#field .fd-gate .why { color: var(--p45); }
#field .fd-ruler { position: absolute; z-index: 3; left: 0; right: 0; bottom: 0; height: 9rem; padding-bottom: 1.6rem; }
#field .fd-ticks { position: absolute; left: 50%; bottom: 3.4rem; height: 2.4rem; width: calc(100 * 1.2rem); background: repeating-linear-gradient(90deg, var(--p45) 0 1px, transparent 1px 1.2rem); -webkit-mask: linear-gradient(transparent 55%, #000 55%); mask: linear-gradient(transparent 55%, #000 55%); will-change: transform; }
#field .fd-ticks b { position: absolute; bottom: 0; width: 1px; height: 2.4rem; background: var(--paper); }
#field .fd-ticks span { position: absolute; bottom: 2.8rem; transform: translateX(-50%); white-space: nowrap; color: var(--p45); }
#field .fd-rwin { position: absolute; left: 0; right: 0; bottom: 0; height: 9rem; overflow: hidden; -webkit-mask: linear-gradient(90deg, transparent, #000 25%, #000 75%, transparent); mask: linear-gradient(90deg, transparent, #000 25%, #000 75%, transparent); pointer-events: none; }
#field .fd-ind { position: absolute; left: 50%; bottom: 3.2rem; width: 2px; height: 3.4rem; margin-left: -1px; background: var(--signal); }
#field .fd-read { position: absolute; left: 50%; bottom: .9rem; transform: translateX(-50%); font-size: 1.3rem; }
#field .fd-jump { position: absolute; right: var(--gap-x); bottom: 1.2rem; display: flex; gap: .4rem; }
#field .fd-jump button { min-width: 3.6rem; min-height: 3.6rem; border-radius: 999px; border: 1px solid var(--p15); color: var(--p70); font-family: var(--f-mono); font-size: 1.1rem; }
#field .fd-jump button[aria-current="step"] { border-color: var(--signal); color: var(--paper); }
#field .fd-play { position: absolute; z-index: 2; inset: 0; outline: none; }
#field .fd-play:focus-visible { box-shadow: inset 0 0 0 2px var(--signal); }
#field .fd-game { position: absolute; z-index: 3; left: var(--gap-x); right: var(--gap-x); bottom: 10rem; display: none; justify-content: space-between; align-items: end; gap: 1.6rem; pointer-events: none; }
#field.game .fd-game { display: flex; }
#field .fd-legend { display: flex; flex-wrap: wrap; gap: .6rem 1.4rem; color: var(--p70); }
#field .fd-legend kbd { margin-left: .6rem; color: var(--paper); }
#field .fd-count { font-size: 2.4rem; font-stretch: 125%; } #field .fd-count small { font-size: 1.1rem; color: var(--p45); letter-spacing: .2em; margin-left: .6rem; }
#field .fd-game .btn { pointer-events: auto; }
#field .fd-reticle { position: absolute; z-index: 2; left: 0; top: 0; width: 7.2rem; height: 7.2rem; margin: -3.6rem 0 0 -3.6rem; pointer-events: none; display: none; }
#field.game .fd-reticle { display: block; }
#field .fd-reticle i { position: absolute; width: 1.4rem; height: 1.4rem; border: 0 solid var(--paper); }
#field .fd-reticle i:nth-child(1) { left: 0; top: 0; border-width: 2px 0 0 2px; } #field .fd-reticle i:nth-child(2) { right: 0; top: 0; border-width: 2px 2px 0 0; }
#field .fd-reticle i:nth-child(3) { left: 0; bottom: 0; border-width: 0 0 2px 2px; } #field .fd-reticle i:nth-child(4) { right: 0; bottom: 0; border-width: 0 2px 2px 0; }
#field .fd-reticle b { position: absolute; left: 50%; top: 50%; width: 4px; height: 4px; margin: -2px; border-radius: 50%; background: var(--signal); }
#field .fd-reticle.hot i { border-color: var(--signal); }
#field .fd-fly { position: absolute; z-index: 1; left: 0; top: 0; width: 1rem; height: 1rem; margin: -.5rem; border-radius: 50%; background: #fff6d8; box-shadow: 0 0 1.2rem .4rem rgb(255 236 170 / .55); pointer-events: none; transition: opacity .6s, background-color .2s; }
#field .fd-fly.got { background: var(--signal); opacity: 0; }
#field .fd-fly[hidden] { display: none; }
#field .fd-pad { position: absolute; z-index: 4; left: var(--gap-x); right: var(--gap-x); bottom: 15rem; display: none; justify-content: space-between; align-items: end; pointer-events: none; }
#field.game.touch .fd-pad { display: flex; }
#field .fd-stick { position: relative; width: 11rem; height: 11rem; border-radius: 50%; border: 1px solid var(--p45); background: rgb(13 13 12 / .45); touch-action: none; pointer-events: auto; }
#field .fd-stick i { position: absolute; left: 50%; top: 50%; width: 4.4rem; height: 4.4rem; margin: -2.2rem; border-radius: 50%; background: var(--p90); }
#field .fd-shoot { width: 8rem; height: 8rem; border-radius: 50%; border: 2px solid var(--paper); background: rgb(255 77 31 / .25); touch-action: none; pointer-events: auto; -webkit-user-select: none; user-select: none; }
#field .fd-shoot.on { background: var(--signal); }
@media (min-width: 768px) { #field h2 { font-size: 7.2rem; } #field .fd-game { bottom: 11rem; } }
@media (max-width: 767px) { #field .fd-game { bottom: 9.4rem; } #field.game.touch .fd-legend { display: none; } #field .fd-rwin { right: 13rem; } #field .fd-ind, #field .fd-read { left: calc(50% - 6.5rem); } #field .fd-gate { bottom: 10rem; } }
@media (prefers-reduced-motion: reduce) { #field .fd-dim, #field .fd-step, #field .fd-gate { transition: opacity .3s; } #field .fd-flash.go { animation: none; } }`,
    mount: function (root, ctx) {
      var R = ctx.reduced, el = ctx.el, pad2 = function (n) { return String(n).padStart(2, '0'); };
      root.insertAdjacentHTML('beforeend',
        '<div class="fd-stage"><canvas class="fd-gl" aria-hidden="true"></canvas><div class="fd-scrim"></div><div class="fd-flies" aria-hidden="true"></div>' +
        '<div class="fd-dim" aria-hidden="true"></div><div class="fd-flash" aria-hidden="true"></div>' +
        '<div class="fd-play" tabindex="-1" role="application" aria-label="Play area. Move the viewfinder with W A S D or the arrow keys, press Space to shoot a firefly, Escape to leave." hidden></div>' +
        '<div class="fd-reticle" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b></div>' +
        '<div class="fd-top wrap"><div class="fd-copy"><p class="kicker"><span>06</span>Field test</p><h2 class="display">Night <span class="serif">field</span> test.</h2>' +
        '<div class="fd-steps" aria-live="polite">' + STEPS.map(function (s, i) {
          return '<article class="fd-step"><p class="label"><span class="mono">Stage ' + pad2(i + 1) + ' / 03</span>' + (i ? ' · <span class="lock">Locked</span>' : '') + '</p><h3>' + s[0] + '</h3><p>' + s[1] + '</p></article>';
        }).join('') + '</div></div>' +
        '<p class="fd-xp label" aria-live="polite"><i aria-hidden="true"></i><b class="mono">0</b><span>XP</span></p></div>' +
        '<div class="fd-gate"><button type="button" class="fd-ring" aria-label="' + (R ? 'Unlock the snow line' : 'Hold to unlock the snow line') + '">' +
        '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="bgc" cx="50" cy="50" r="46"/><circle class="pc" cx="50" cy="50" r="46"/></svg><span class="lb label">' + (R ? 'Unlock' : 'Tap / Hold') + '</span></button>' +
        '<p class="why label">Stages 02–03 are locked</p>' + (R ? '' : '<button type="button" class="alt">Unlock without holding</button>') + '<span class="sr-only fd-sr" aria-live="polite"></span></div>' +
        '<div class="fd-game"><p class="fd-legend label"></p><p class="fd-count display" aria-live="polite"><b class="mono">0</b>/5<small>fireflies</small></p></div>' +
        '<div class="fd-pad" aria-hidden="true"><div class="fd-stick" data-cursor="Drag"><i></i></div><button type="button" tabindex="-1" class="fd-shoot label">Shoot</button></div>' +
        '<div class="fd-ruler"><div class="fd-rwin" aria-hidden="true"><div class="fd-ticks">' +
        ['-100', '-66', '-33', '0'].map(function (v, i) { var x = [0, 34, 67, 100][i] * 1.2; return '<b style="left:' + x + 'rem"></b><span class="label" style="left:' + x + 'rem">' + v + ' LUX</span>'; }).join('') +
        '</div></div><div class="fd-ind" aria-hidden="true"></div><p class="fd-read mono" aria-hidden="true">-100 LUX</p>' +
        '<div class="fd-jump">' + ['-100', '-66', '-33'].map(function (v, i) { return '<button type="button" aria-label="Go to stage ' + v + ' LUX">' + pad2(i + 1) + '</button>'; }).join('') + '</div></div></div>');
      var $ = function (s) { return root.querySelector(s); };
      var stageEl = $('.fd-stage'), canvas = $('.fd-gl'), dim = $('.fd-dim'), flash = $('.fd-flash'), play = $('.fd-play'), ret = $('.fd-reticle');
      var steps = [].slice.call(root.querySelectorAll('.fd-step')), xpEl = $('.fd-xp'), xpN = $('.fd-xp b'), gate = $('.fd-gate'), ring = $('.fd-ring'), pc = $('.fd-ring .pc'), sr = $('.fd-sr');
      var legend = $('.fd-legend'), countN = $('.fd-count b'), ticks = $('.fd-ticks'), readEl = $('.fd-read'), jumps = [].slice.call(root.querySelectorAll('.fd-jump button'));
      var fliesBox = $('.fd-flies'), stick = $('.fd-stick'), knob = $('.fd-stick i'), shootB = $('.fd-shoot');

      /* ---------- gated stages (native scroll: m.pin picks the stage, the gate only locks content) ---------- */
      var stage = 0, sp = 0, pin = 0, unlocked = false, gateShown = false, live = false, awarded = new Set(), xpVal = 0, xpAnim = null;
      function scrollToStage(i) {
        var top = root.getBoundingClientRect().top + window.scrollY, len = root.offsetHeight - innerHeight;
        window.scrollTo({ top: top + len * (i / 3 + (i ? .04 : 0)), behavior: R ? 'auto' : 'smooth' });
      }
      jumps.forEach(function (b, i) { b.addEventListener('click', function () { scrollToStage(i); }); });
      function award(i) { // +100 per stage, once (gated-stage-scroll)
        if (awarded.has(i)) return; awarded.add(i);
        var from = xpVal, to = awarded.size * 100, t0 = performance.now();
        xpEl.classList.remove('xp-ripple'); void xpEl.offsetWidth; xpEl.classList.add('xp-ripple');
        ctx.audio.tone(660 + 110 * awarded.size, .18, .15);
        cancelAnimationFrame(xpAnim);
        if (R) { xpVal = to; xpN.textContent = to; return; }
        (function up(now) { var t = Math.min((now - t0) / 2000, 1), e = 1 - (1 - t) * (1 - t); xpVal = Math.round(from + (to - from) * e); xpN.textContent = xpVal; if (t < 1) xpAnim = requestAnimationFrame(up); })(t0);
      }
      function setStage(i) {
        stage = i;
        steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
        jumps.forEach(function (b, k) { if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
        if (live && (i === 0 || unlocked)) award(i);
        ctx.bg.set({ aperture: .3, warmth: .04, energy: i === 2 ? .3 : .12, focus: 1 });
        dim.classList.toggle('off', unlocked || i === 0);
        syncGame();
      }
      function unlock() {
        if (unlocked) return; unlocked = true;
        dim.classList.add('off'); gate.classList.remove('on'); gateShown = false;
        steps.forEach(function (s) { var l = s.querySelector('.lock'); if (l) l.textContent = 'Open'; });
        sr.textContent = 'Unlocked'; ctx.audio.tone(990, .3, .2);
        ctx.toast('Snow line unlocked', { description: 'Stages 02 and 03 are open. +100 XP for each.', type: 'success' });
        if (stage === 0) scrollToStage(1); else award(stage);
        syncGame();
      }
      root.querySelector('.alt') && root.querySelector('.alt').addEventListener('click', unlock);
      ctx.palette.add({ id: 'field-unlock', title: 'Unlock the night field test', group: 'Actions', keywords: 'field hold gate stage', run: function () { unlock(); } });

      /* hold-to-advance: commit-hold 3 s, rAF timestamps, resume grace 500 ms, pointer capture, Space/Enter hold */
      var H = { down: false, start: 0, lastP: 0, lastUp: -1e9, pid: null, p: 0, said: 0 }, DUR = 3;
      function hp() { return Math.min((performance.now() - H.start) / 1000 / DUR, 1); }
      function press(e) {
        if (H.down || unlocked) return; if (e.preventDefault) e.preventDefault();
        H.down = true; H.pid = e.pointerId; H.said = 0;
        var now = performance.now(), gap = now - H.lastUp, resume = H.lastP > 0 && gap < 500 ? H.lastP * (1 - gap / 500) : 0;
        H.start = now - resume * DUR * 1000;
        if (typeof H.pid === 'number') { try { ring.setPointerCapture(H.pid); } catch (err) {} }
        ring.classList.add('pressed'); ring.classList.remove('reset'); ctx.audio.click(.3);
      }
      function release(e) {
        if (!H.down || (e && e.pointerId !== undefined && e.pointerId !== H.pid)) return;
        H.down = false; H.lastP = hp(); H.lastUp = performance.now(); H.p = 0;
        ring.classList.remove('pressed'); ring.classList.add('reset'); pc.style.strokeDashoffset = C; dim.style.opacity = '';
      }
      function holdTick() {
        if (!H.down) return;
        var p = hp(); H.p = p;
        pc.style.strokeDashoffset = (C * (1 - p)).toFixed(2);
        if (stage > 0) dim.style.opacity = (1 - .6 * p * p * (3 - 2 * p)).toFixed(3);
        var q = Math.floor(p * 4); if (q > H.said && q < 4) { H.said = q; sr.textContent = 'Hold… ' + q * 25 + '%'; }
        if (p >= 1) { H.down = false; H.lastP = 0; ring.classList.remove('pressed'); dim.style.opacity = ''; unlock(); }
      }
      if (R) ring.addEventListener('click', unlock); // reduced motion: a single press, no ring animation
      else {
        ring.addEventListener('pointerdown', function (e) { if (e.button === 0 || e.pointerType !== 'mouse') press(e); });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { ring.addEventListener(t, release); });
        ring.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press({ pointerId: 'kb' }); } });
        ring.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release({ pointerId: 'kb' }); } });
        ring.addEventListener('blur', function () { release(); });
      }
      document.addEventListener('visibilitychange', function () { if (document.hidden) release(); });

      /* ---------- snow height map: a 2D canvas painted with footprints, healed over time ---------- */
      var SN = { cx: 0, cz: 0, hs: 5, size: 256 }, hm = el('canvas'); hm.width = hm.height = SN.size;
      var hctx = hm.getContext('2d'); hctx.fillStyle = '#fff'; hctx.fillRect(0, 0, SN.size, SN.size);
      var foot = 1, stepAcc = 0, upAcc = 0, hmDirty = true;
      function stamp(x, z, dx, dz) {
        var k = SN.size / (SN.hs * 2), px = (x - SN.cx + SN.hs) * k, py = (z - SN.cz + SN.hs) * k, l = Math.hypot(dx, dz) || 1, side = foot * .16 * k;
        px += -dz / l * side; py += dx / l * side; foot = -foot;
        hctx.save(); hctx.globalCompositeOperation = 'multiply'; hctx.translate(px, py); hctx.rotate(Math.atan2(dz, dx)); hctx.scale(1, .55);
        var r = .35 * k, gr = hctx.createRadialGradient(0, 0, 0, 0, 0, r);
        gr.addColorStop(0, 'rgb(40,40,40)'); gr.addColorStop(.6, 'rgb(120,120,120)'); gr.addColorStop(1, 'rgb(255,255,255)');
        hctx.fillStyle = gr; hctx.beginPath(); hctx.arc(0, 0, r, 0, 7); hctx.fill(); hctx.restore(); hmDirty = true;
      }

      /* ---------- WebGL2 meadow (one instanced draw for all LOD rings) ---------- */
      var tier = ctx.tier || { tier: 0, dpr: 1, webgl2: false }, gl = null, prog = {}, buf = {}, tex = null, total = 0;
      var TILES = tier.tier >= 3 ? [.12, .32, .7] : tier.tier === 2 ? [.15, .4, .8] : [.22, .6, 1.2], RINGS = [[0, 11], [10, 31], [30, 48]], WIDTH = [2, 5, 10];
      var NOISE = 'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}' +
        'float fogK(float d){return smoothstep(16.,44.,d);}';
      var GRASS_VS = '#version 300 es\nlayout(location=0) in vec2 aV;layout(location=1) in vec3 aI;uniform mat4 uVP;uniform vec2 uPlayer;uniform vec2 uCenter;uniform vec3 uCam;uniform float uTime;uniform vec3 uTile;uniform vec3 uWidth;uniform vec3 uSnow;' +
        'out float vH;out float vSeed;out float vFog;out float vGlow;' + NOISE +
        'void main(){int ring=int(aI.z+.5);float tile=uTile[ring];vec2 w=uCenter+aI.xy;vec2 cell=floor(w/tile);vec2 j=vec2(hash(cell),hash(cell+vec2(17.23,91.7)))-.5;' +
        'vec2 root=w-mod(w,tile)+j*tile;float seed=hash(cell+3.71);float cl=.65*vnoise(root*.4)+.35*vnoise(root*.8+7.);float clump=pow(smoothstep(.45,.8,cl),1.8);' + // snap + jitter, clumps
        'float h=mix(.55,1.25,clump)*.55*(.8+.4*seed);float wd=mix(.85,1.12,clump)*.035*uWidth[ring];float stiff=mix(1.,.55,clump);float vy=aV.y;' +
        'vec2 sd=abs(root-uSnow.xy)-uSnow.z;float snowM=smoothstep(-.2,.5,max(sd.x,sd.y)+(seed-.5)*.7);float d=length(root-uCenter);float fade=1.-pow(clamp(d/48.,0.,1.),5.);h*=fade*snowM;wd*=fade;' +
        'float yaw=vnoise(root*.8)*6.2831+seed*3.;vec3 side=vec3(cos(yaw),0.,sin(yaw))*aV.x*wd*(1.-vy*.85)*.5;' +
        'vec2 n=vec2(vnoise(root*.15+vec2(uTime*.6,uTime*.25)),vnoise(root*.26+vec2(-uTime*.4,uTime*.5)+5.));float bend=clamp((.45+(n.y*2.-1.)+(n.x*2.-1.)*.15)*.3*stiff*2.4,-1.,1.);' + // wind from noise
        'float a=bend*pow(vy,3.)+(seed-.5)*.5*vy;vec2 wdir=normalize(vec2(.8,-.6));vec3 p=vec3(root.x,0.,root.y)+side+vec3(wdir.x*sin(a),cos(a),wdir.y*sin(a))*vy*h;' +
        'vec2 to=p.xz-uPlayer;float dl=length(to);if(dl<1.)p.xz+=.3*(to/max(dl,1e-3))*vy*(1.-dl);' + // player push, r = 1 m
        'vH=vy;vSeed=seed;vFog=fogK(distance(p,uCam));vGlow=clamp(1.-length(root-uPlayer)/3.,0.,1.);gl_Position=uVP*vec4(p,1.);}';
      var GRASS_FS = '#version 300 es\nprecision highp float;in float vH;in float vSeed;in float vFog;in float vGlow;out vec4 o;' +
        'void main(){vec3 tip=vec3(.36,.41,.5)*(.6+.4*vSeed);vec3 c=mix(vec3(.012,.016,.024),tip,pow(vH,1.3))+vec3(1.,.302,.122)*vGlow*vH*.45;float f=vFog;o=vec4(c*(1.-f),1.-f);}';
      var PLANE_VS = '#version 300 es\nlayout(location=0) in vec2 aV;uniform mat4 uVP;uniform vec4 uRect;uniform float uY;out vec3 vW;out vec2 vUv;' +
        'void main(){vUv=aV*.5+.5;vW=vec3(uRect.x+aV.x*uRect.z,uY,uRect.y+aV.y*uRect.w);gl_Position=uVP*vec4(vW,1.);}';
      var GROUND_FS = '#version 300 es\nprecision highp float;in vec3 vW;in vec2 vUv;uniform vec3 uCam;uniform vec2 uPlayer;out vec4 o;' + NOISE +
        'void main(){float r=length(vW.xz-uPlayer);vec3 c=vec3(.016,.02,.03)*(.8+.4*vnoise(vW.xz*.7))+vec3(1.,.302,.122)*(.08*exp(-r*.9)+smoothstep(.05,0.,abs(r-1.))*.6);' +
        'float f=fogK(distance(vW,uCam));o=vec4(c*(1.-f),1.-f);}';
      // simplified from parallax occlusion: the height map gives a normal (moonlit relief) and darkens pressed snow
      var SNOW_FS = '#version 300 es\nprecision highp float;in vec3 vW;in vec2 vUv;uniform vec3 uCam;uniform sampler2D tH;uniform float uTexel;uniform vec2 uPlayer;out vec4 o;' + NOISE +
        'float Hh(vec2 uv){return texture(tH,uv).r;}void main(){vec2 uv=vUv;float h=Hh(uv);float e=uTexel*1.5;float hx=Hh(uv+vec2(e,0))-Hh(uv-vec2(e,0)),hz=Hh(uv+vec2(0,e))-Hh(uv-vec2(0,e));' +
        'vec3 n=normalize(vec3(-hx*6.,1.,-hz*6.));float l=.45+.7*max(dot(n,normalize(vec3(-.5,.7,-.4))),0.);vec3 c=mix(vec3(.2,.24,.32),vec3(.62,.67,.76),h)*l*(.88+.12*vnoise(vW.xz*1.7));' +
        'vec2 ed=abs(vUv-.5)*2.;float edge=smoothstep(1.,.78+.14*vnoise(vW.xz*2.3),max(ed.x,ed.y));float r=length(vW.xz-uPlayer);c+=vec3(1.,.302,.122)*smoothstep(.05,0.,abs(r-1.))*.6;' +
        'float f=fogK(distance(vW,uCam));float a=edge*(1.-f);o=vec4(c*a,a);}';
      function compile(vs, fs) {
        var p = gl.createProgram();
        [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) {
          var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh);
          if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); gl.attachShader(p, sh);
        });
        gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < n; i++) { var nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
        return { p: p, u: u };
      }
      if (tier.webgl2 && tier.tier > 0) {
        try {
          gl = canvas.getContext('webgl2', { antialias: tier.tier >= 2, alpha: true, premultipliedAlpha: true });
          if (gl) {
            prog.grass = compile(GRASS_VS, GRASS_FS); prog.ground = compile(PLANE_VS, GROUND_FS); prog.snow = compile(PLANE_VS, SNOW_FS);
            var bl = []; for (var s = 0; s <= 4; s++) bl.push(-1, s / 4, 1, s / 4);
            var inst = [];
            RINGS.forEach(function (r, id) { var t = TILES[id]; for (var x = -r[1]; x <= r[1]; x += t) for (var z = -r[1]; z <= r[1]; z += t) { var d = Math.hypot(x, z); if (d >= r[0] && d <= r[1]) inst.push(x, z, id); } });
            total = inst.length / 3;
            buf.grass = gl.createVertexArray(); gl.bindVertexArray(buf.grass);
            var b1 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bl), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            var b2 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inst), gl.STATIC_DRAW); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(1, 1);
            buf.quad = gl.createVertexArray(); gl.bindVertexArray(buf.quad);
            var b3 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b3); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.bindVertexArray(null);
            tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hm);
          }
        } catch (e) { if (window.console) console.warn('[field] WebGL2 init failed, using 2D', e); gl = null; }
      }
      var c2 = gl ? null : (function () { var cv = el('canvas', 'fd-gl'); cv.setAttribute('aria-hidden', 'true'); canvas.replaceWith(cv); canvas = cv; return cv.getContext('2d'); })();

      /* ---------- camera + projection ---------- */
      var W = 1, Hh = 1, FOV = 50 * Math.PI / 180, cam = { e: [0, 2.4, 28], l: [0, .5, 16], f: [0, 0, -1], r: [1, 0, 0], u: [0, 1, 0] }, VP = null;
      function mul(a, b) { var o = new Float32Array(16); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
      function nrm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
      function crs(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
      function viewProj() {
        var e = cam.e, z = nrm([e[0] - cam.l[0], e[1] - cam.l[1], e[2] - cam.l[2]]), x = nrm(crs([0, 1, 0], z)), y = crs(z, x);
        cam.f = [-z[0], -z[1], -z[2]]; cam.r = x; cam.u = y;
        var V = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
        var t = 1 / Math.tan(FOV / 2), n = .1, f = 120;
        return mul([t / (W / Hh), 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0], V);
      }
      // 2D fallback uses a level pinhole camera at cam.e looking down -z
      function project(x, y, z) {
        if (gl) {
          var v = [x, y, z, 1], o = [0, 0, 0, 0];
          for (var i = 0; i < 4; i++) for (var k = 0; k < 4; k++) o[i] += VP[k * 4 + i] * v[k];
          if (o[3] <= .01) return null; return [(o[0] / o[3] * .5 + .5) * W, (.5 - o[1] / o[3] * .5) * Hh];
        }
        var dz = cam.e[2] - z, f = Hh * .9; if (dz < .3) return null;
        return [W / 2 + (x - cam.e[0]) * f / dz, Hh * .55 + (cam.e[1] - y) * f / dz];
      }
      function groundAt(sx, sy) {
        if (!gl) { var f = Hh * .9, dy = sy - Hh * .55; if (dy < 4) return null; var dz = cam.e[1] * f / dy; return { x: cam.e[0] + (sx - W / 2) * dz / f, z: cam.e[2] - dz }; }
        var nx = sx / W * 2 - 1, ny = 1 - sy / Hh * 2, t = Math.tan(FOV / 2), a = W / Hh;
        var d = [0, 1, 2].map(function (i) { return cam.f[i] + cam.r[i] * nx * t * a + cam.u[i] * ny * t; });
        if (d[1] > -1e-3) return null; var k = -cam.e[1] / d[1]; return { x: cam.e[0] + d[0] * k, z: cam.e[2] + d[2] * k };
      }

      /* ---------- device-agnostic input actions ---------- */
      var keys = new Set(), vgp = { axes: [0, 0], buttons: [{ value: 0 }] }, pads = [], device = ctx.fine ? 'keyboard' : 'touch', actionsOn = false;
      var A = { mx: 0, my: 0, shoot: false, was: false };
      var k = function (c) { return keys.has(c) ? 1 : 0; };
      function pollPads() {
        pads.length = 0; var list = navigator.getGamepads ? navigator.getGamepads() : [];
        for (var i = 0; i < list.length; i++) if (list[i]) pads.push(list[i]);
      }
      var axis = function (i) { return pads.reduce(function (s, p) { return s + (p.axes[i] || 0); }, 0); };
      var btn = function (i) { return pads.some(function (p) { return p.buttons[i] && p.buttons[i].value > .5; }) ? 1 : 0; };
      function readActions() { // strongest binding wins
        pollPads();
        var cands = [[k('KeyD') - k('KeyA'), k('KeyS') - k('KeyW')], [k('ArrowRight') - k('ArrowLeft'), k('ArrowDown') - k('ArrowUp')],
          [dead(axis(0)), dead(axis(1))], [btn(15) - btn(14), btn(13) - btn(12)], [vgp.axes[0], vgp.axes[1]]], best = [0, 0];
        cands.forEach(function (v, i) { var m = Math.hypot(v[0], v[1]); if (i !== 2 && i !== 4 && m > 1) v = [v[0] / m, v[1] / m]; if (Math.hypot(v[0], v[1]) > Math.hypot(best[0], best[1])) best = v; });
        A.mx = best[0]; A.my = best[1];
        var padIn = btn(0) || Math.abs(dead(axis(0))) + Math.abs(dead(axis(1))) > 0 || btn(12) || btn(13) || btn(14) || btn(15);
        if (padIn) setDevice('gamepad');
        A.was = A.shoot; A.shoot = !!(k('Space') || k('Enter') || btn(0) || vgp.buttons[0].value);
        return A.shoot && !A.was;
      }
      function setDevice(d) { if (d === device) return; device = d; renderGlyphs(); }
      function renderGlyphs() {
        var g = GLYPH[device];
        legend.innerHTML = '<span>Move<kbd>' + g[0] + '</kbd></span><span>Shoot<kbd>' + g[1] + '</kbd></span>';
        root.classList.toggle('touch', device === 'touch' || !ctx.fine);
      }
      function clearHeld() { keys.clear(); vgp.axes[0] = vgp.axes[1] = 0; vgp.buttons[0].value = 0; A.shoot = A.was = false; knob.style.transform = ''; shootB.classList.remove('on'); }
      var CODES = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'];
      play.addEventListener('keydown', function (e) {
        if (!actionsOn) return;
        if (e.key === 'Escape') { play.blur(); return; }
        if (CODES.indexOf(e.code) < 0) return;
        e.preventDefault(); keys.add(e.code); setDevice('keyboard');
      });
      play.addEventListener('keyup', function (e) { keys.delete(e.code); });
      play.addEventListener('blur', clearHeld);
      play.addEventListener('pointerdown', function (e) {
        if (!actionsOn) return;
        if (e.pointerType === 'touch') { setDevice('touch'); return; }
        play.focus({ preventScroll: true }); setDevice('keyboard');
        var r = stageEl.getBoundingClientRect(); RX = e.clientX - r.left; RY = e.clientY - r.top; // click moves the finder there
      });
      var stickId = null, sx = 0, sy = 0;
      stick.addEventListener('pointerdown', function (e) { if (!actionsOn) return; e.preventDefault(); stickId = e.pointerId; try { stick.setPointerCapture(stickId); } catch (err) {} var r = stick.getBoundingClientRect(); sx = r.left + r.width / 2; sy = r.top + r.height / 2; moveStick(e); setDevice('touch'); });
      function moveStick(e) {
        if (e.pointerId !== stickId) return;
        var dx = (e.clientX - sx) / 45, dy = (e.clientY - sy) / 45, m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
        vgp.axes[0] = dx; vgp.axes[1] = dy; knob.style.transform = 'translate(' + (dx * 30).toFixed(1) + 'px,' + (dy * 30).toFixed(1) + 'px)';
      }
      function endStick(e) { if (e.pointerId !== stickId) return; stickId = null; vgp.axes[0] = vgp.axes[1] = 0; knob.style.transform = ''; }
      stick.addEventListener('pointermove', moveStick); stick.addEventListener('pointerup', endStick); stick.addEventListener('pointercancel', endStick);
      shootB.addEventListener('pointerdown', function (e) { if (!actionsOn) return; e.preventDefault(); try { shootB.setPointerCapture(e.pointerId); } catch (err) {} vgp.buttons[0].value = 1; vgp.buttons[0].latch = true; shootB.classList.add('on'); setDevice('touch'); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { shootB.addEventListener(t, function () { vgp.buttons[0].release = true; shootB.classList.remove('on'); }); });

      /* ---------- the mini game: five fireflies ---------- */
      var flies = [], caught = 0, RX = 0, RY = 0, P = { x: 0, z: 22, px: 0, pz: 22 }, T = 0;
      function resetGame() {
        fliesBox.innerHTML = ''; flies = []; caught = 0; countN.textContent = '0';
        for (var i = 0; i < 5; i++) {
          var d = el('i', 'fd-fly'); fliesBox.appendChild(d);
          flies.push({ el: d, bx: -4 + i * 2 + Math.sin(i * 7.3), bz: -4 + (i % 3) * 2.2, by: .7 + (i % 2) * .5, ph: i * 1.7, got: false, x: 0, y: 0, z: 0 });
        }
        RX = W / 2; RY = Hh * .6;
      }
      function syncGame() {
        var on = live && stage === 2 && unlocked;
        if (on !== actionsOn) { actionsOn = on; if (!on) clearHeld(); }   // the action map is enabled only while stage 03 is on screen
        root.classList.toggle('game', on);
        play.hidden = !on; play.tabIndex = on ? 0 : -1;
        fliesBox.hidden = !(stage === 2);
      }
      function shoot() {
        if (R) flash.classList.remove('go'); else { flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); }
        ctx.audio.shutter();
        var best = null, bd = Math.max(46, Math.min(W, Hh) * .08);
        flies.forEach(function (f) { if (f.got || !f.s) return; var d = Math.hypot(f.s[0] - RX, f.s[1] - RY); if (d < bd) { bd = d; best = f; } });
        if (!best) return;
        best.got = true; best.el.classList.add('got'); caught++; countN.textContent = caught;
        if (caught < 5) ctx.toast('Firefly ' + caught + ' of 5', { description: 'Locked at f/1.4, ISO 51 200. Frame kept.', type: 'info', duration: 2200 });
        else {
          ctx.toast('Field test passed', { description: 'Five for five in the dark. That is the LF‑1.', type: 'success', action: { label: 'Play again', onClick: resetGame } });
          ctx.audio.tone(1320, .4, .2);
        }
      }

      /* ---------- simulation + draw ---------- */
      function pathFor() { // where the explorer walks in stages 01–02 (scroll-driven), or follows the finder in 03
        if (stage === 0) { var z = 20 - 14 * sp; return { x: 2.2 * Math.sin(z * .3), z: z }; }
        if (stage === 1) { var z2 = 6 - 12 * sp; return { x: 1.6 * Math.sin(z2 * .5 + T * (R ? 0 : .3)), z: z2 }; }
        var g = actionsOn ? groundAt(RX, RY) : null;
        return g ? { x: ctx.clamp(g.x, -9, 9), z: ctx.clamp(g.z, -9, 5) } : { x: P.x, z: P.z };
      }
      function update(dt) {
        if (!R) T += dt;
        if (actionsOn) {
          var fire = readActions(), sp2 = Math.min(W, Hh) * .55;
          RX = ctx.clamp(RX + A.mx * sp2 * dt, 24, W - 24); RY = ctx.clamp(RY + A.my * sp2 * dt, Hh * .3, Hh - 120);
          if (fire && caught < 5) shoot();
          if (vgp.buttons[0].release) { vgp.buttons[0].value = 0; vgp.buttons[0].release = false; }
        }
        var t = pathFor(), lam = R ? 30 : 4;
        P.px = P.x; P.pz = P.z; P.x = ctx.damp(P.x, t.x, lam, dt); P.z = ctx.damp(P.z, t.z, lam, dt);
        var vx = (P.x - P.px) / Math.max(dt, 1e-3), vz = (P.z - P.pz) / Math.max(dt, 1e-3), spd = Math.hypot(vx, vz);
        var onSnow = Math.abs(P.x - SN.cx) < SN.hs && Math.abs(P.z - SN.cz) < SN.hs;
        if (onSnow && spd > .3) { stepAcc += spd * dt; if (stepAcc > .42) { stepAcc = 0; stamp(P.x, P.z, vx, vz); } }
        upAcc += dt * 1000;
        if (upAcc >= 100) { // heal + upload at most every 100 ms
          hctx.globalCompositeOperation = 'source-over'; hctx.fillStyle = 'rgba(255,255,255,' + (.35 * upAcc * .001).toFixed(4) + ')'; hctx.fillRect(0, 0, SN.size, SN.size);
          if (gl) { gl.bindTexture(gl.TEXTURE_2D, tex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, hm); }
          upAcc = 0; hmDirty = true;
        }
        var game = stage === 2, ce = game ? [0, 3.2, 8.5] : [P.x, 2.4, P.z + 6.5], cl = game ? [0, .3, -3] : [P.x, .5, P.z - 6];
        var cl2 = R ? 30 : 3; cam.e = cam.e.map(function (v, i) { return ctx.damp(v, ce[i], cl2, dt); }); cam.l = cam.l.map(function (v, i) { return ctx.damp(v, cl[i], cl2, dt); });
        if (gl) VP = viewProj();
        // fireflies: slow noise drift, projected to the DOM; reticle turns hot when one is in range
        var hot = false;
        flies.forEach(function (f) {
          var tt = T * (R ? 0 : 1);
          f.x = f.bx + Math.sin(tt * .5 + f.ph) * .9; f.z = f.bz + Math.cos(tt * .37 + f.ph * 1.3) * .7; f.y = f.by + Math.sin(tt * 1.3 + f.ph) * .2;
          f.s = project(f.x, f.y, f.z);
          if (!f.s || f.got) { if (!f.got) f.el.style.opacity = 0; } else { f.el.style.opacity = (R ? .9 : .6 + .4 * Math.sin(T * 3 + f.ph * 2)).toFixed(2); }
          if (f.s) f.el.style.transform = 'translate3d(' + f.s[0].toFixed(1) + 'px,' + f.s[1].toFixed(1) + 'px,0)';
          if (f.s && !f.got && Math.hypot(f.s[0] - RX, f.s[1] - RY) < Math.max(46, Math.min(W, Hh) * .08)) hot = true;
        });
        ret.style.transform = 'translate3d(' + RX.toFixed(1) + 'px,' + RY.toFixed(1) + 'px,0)'; ret.classList.toggle('hot', hot);
      }
      function drawGL() {
        gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
        var cx = cam.l[0], cz = cam.l[2] + 4;
        var g = prog.ground; gl.useProgram(g.p); gl.bindVertexArray(buf.quad);
        gl.uniformMatrix4fv(g.u.uVP, false, VP); gl.uniform4f(g.u.uRect, cx, cz, 60, 60); gl.uniform1f(g.u.uY, 0); gl.uniform3fv(g.u.uCam, cam.e); gl.uniform2f(g.u.uPlayer, P.x, P.z);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        var s = prog.snow; gl.useProgram(s.p);
        gl.uniformMatrix4fv(s.u.uVP, false, VP); gl.uniform4f(s.u.uRect, SN.cx, SN.cz, SN.hs, SN.hs); gl.uniform1f(s.u.uY, .01); gl.uniform3fv(s.u.uCam, cam.e);
        gl.uniform1f(s.u.uTexel, 1 / SN.size); gl.uniform2f(s.u.uPlayer, P.x, P.z); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(s.u.tH, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        var q = prog.grass; gl.useProgram(q.p); gl.bindVertexArray(buf.grass);
        gl.uniformMatrix4fv(q.u.uVP, false, VP); gl.uniform2f(q.u.uPlayer, P.x, P.z); gl.uniform2f(q.u.uCenter, cx, cz); gl.uniform3fv(q.u.uCam, cam.e);
        gl.uniform1f(q.u.uTime, T); gl.uniform3fv(q.u.uTile, TILES); gl.uniform3fv(q.u.uWidth, WIDTH); gl.uniform3f(q.u.uSnow, SN.cx, SN.cz, SN.hs);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 10, total); // all three rings in one draw call
        gl.bindVertexArray(null);
      }
      var shade = document.createElement('canvas'); shade.width = shade.height = SN.size;
      function ih(a, b) { var h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
      function draw2d(dpr) { // tier 0 / no WebGL2: silhouette grass in three depth layers, same snow height map
        var c = c2, hor = Hh * .55; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, Hh);
        var gr = c.createLinearGradient(0, hor - 30, 0, Hh); gr.addColorStop(0, 'rgba(13,15,20,0)'); gr.addColorStop(.12, 'rgba(10,12,16,.9)'); gr.addColorStop(1, '#060708');
        c.fillStyle = gr; c.fillRect(0, hor - 30, W, Hh);
        var a = project(SN.cx - SN.hs, 0, SN.cz - SN.hs), b = project(SN.cx + SN.hs, 0, SN.cz - SN.hs), d = project(SN.cx + SN.hs, 0, SN.cz + SN.hs), e = project(SN.cx - SN.hs, 0, SN.cz + SN.hs);
        if (a && b && d && e) { // snow patch: shaded height map inside its projected trapezoid
          if (hmDirty) { var sc = shade.getContext('2d'); sc.drawImage(hm, 0, 0); sc.globalCompositeOperation = 'multiply'; sc.fillStyle = '#5d6c84'; sc.fillRect(0, 0, SN.size, SN.size); sc.globalCompositeOperation = 'source-over'; hmDirty = false; }
          c.save(); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath(); c.clip();
          c.globalAlpha = .9; c.drawImage(shade, Math.min(e[0], a[0]), a[1], Math.max(d[0], b[0]) - Math.min(e[0], a[0]), e[1] - a[1]); c.restore(); c.globalAlpha = 1;
        }
        var pp = project(P.x, 0, P.z);
        var sky = c.createLinearGradient(0, hor - Hh * .3, 0, hor); sky.addColorStop(0, 'rgba(40,52,72,0)'); sky.addColorStop(1, 'rgba(40,52,72,.35)'); c.fillStyle = sky; c.fillRect(0, hor - Hh * .3, W, Hh * .3);
        [[.06, '#262c38', 8], [.3, '#1b2029', 7], [.8, '#12151c', 6]].forEach(function (L, li) { // silhouette layers placed by screen depth
          var base = hor + 4 + L[0] * (Hh - hor), dz = cam.e[1] * Hh * .9 / (base - hor), hpx = Math.min(1.3 * Hh * .9 / dz, Hh * .32);
          c.fillStyle = L[1]; c.beginPath(); c.moveTo(0, base); var wz = cam.e[2] - dz, inZ = Math.abs(wz - SN.cz) < SN.hs;
          for (var x = -L[2]; x <= W + L[2]; x += L[2]) {
            var i = Math.round(x / L[2]), r1 = ih(i, li), wind = R ? .25 : .25 + .35 * Math.sin(T * 1.4 + x * .01 + li);
            var wx = cam.e[0] + (x - W / 2) * dz / (Hh * .9), h = inZ && Math.abs(wx - SN.cx) < SN.hs ? 0 : hpx * (.5 + .8 * r1), lean = wind * h * .5;
            if (pp && li === 1) { var dx = x - pp[0]; if (Math.abs(dx) < 60) lean += Math.sign(dx) * (60 - Math.abs(dx)) * .4; }
            c.lineTo(x - L[2] * .5, base); c.quadraticCurveTo(x + lean * .3, base - h * .6, x + lean, base - h); c.lineTo(x + L[2] * .5, base);
          }
          c.lineTo(W, base); c.closePath(); c.fill();
        });
        if (pp) { c.strokeStyle = '#ff4d1f'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(pp[0], pp[1], 26, 7, 0, 0, 7); c.stroke(); c.fillStyle = '#ece8df'; c.beginPath(); c.arc(pp[0], pp[1], 3, 0, 7); c.fill(); }
      }
      function frame(dt) {
        var fit = ctx.fitCanvas(canvas, stageEl, Math.min(tier.dpr || 1, 1.5));
        if (fit.w !== W || fit.h !== Hh) { var first = W === 1; W = fit.w; Hh = fit.h; if (first) { RX = W / 2; RY = Hh * .6; } }
        holdTick(); update(dt);
        if (gl) drawGL(); else draw2d(fit.dpr);
        var lux = Math.round(-100 + pin * 100);
        ticks.style.transform = 'translate3d(' + (-pin * 120).toFixed(2) + 'rem,0,0)';
        if (readEl.textContent !== lux + ' LUX') readEl.textContent = lux + ' LUX';
        var want = !unlocked && (stage > 0 || (gateShown ? sp > .9 : sp > .95)); // hysteresis: show at .95, hide below .9
        if (want !== gateShown) { gateShown = want; gate.classList.toggle('on', want); if (!want) release(); }
      }
      var lp = ctx.loop(frame);
      resetGame(); renderGlyphs(); setStage(0);
      return {
        start: function () { live = true; ctx.bg.set({ aperture: .3, warmth: .04, energy: .12, focus: 1 }); setStage(stage); lp.start(); },
        stop: function () { live = false; lp.stop(); release(); syncGame(); },
        scroll: function (m) {
          pin = m.pin; var i = Math.min(2, Math.floor(pin * 3)); sp = ctx.clamp(pin * 3 - i, 0, 1);
          if (i !== stage) setStage(i);
        }
      };
    }
  });
})();
