/* autoplay-scroll-film — scene uniforms windowed with smoothstep, steerable autoscroll, click-to-start gate + blur prologue. */
(function () {
  'use strict';
  var ID = 'autoplay-scroll-film';
  var E = 'cubic-bezier(.25,1,.5,1)';
  var css = `
& { container-type: inline-size; }
& .cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
& .story { position: absolute; left: 28px; right: 28px; bottom: 84px; margin: 0; font-stretch: 125%; font-size: clamp(22px, 4.4cqi, 44px); line-height: 1.06; letter-spacing: -.025em; color: #FAF5F0; pointer-events: none; }
& .story span { position: absolute; left: 0; bottom: 0; max-width: 14em; opacity: 0; filter: blur(12px); transform: scale(.96); transform-origin: 0 100%;
  transition: opacity 1.4s ${E}, filter 1s ${E}, transform 1s ${E}; }
& .story span.show { opacity: 1; filter: blur(0); transform: none; transition: opacity 1.4s ${E}, filter 1.9s ${E}, transform 1s ${E}; }
& .story i { font-style: italic; color: #f97316; }
& .gate { position: absolute; inset: 0; z-index: 4; display: grid; place-items: center; align-content: center; gap: 22px; text-align: center; padding: 24px; background: #000; transition: background 3s ${E}; }
& .gate.go { background: transparent; pointer-events: none; }
& .pro { margin: 0; font-size: clamp(14px, 2.2cqi, 19px); letter-spacing: .02em; color: rgb(255 255 255 / .8); font-style: italic; }
& .pro b { font-weight: 400; display: inline-block; opacity: 0; filter: blur(12px); transform: scale(.8); }
& .gate.in .pro b { opacity: 1; filter: blur(0); transform: none; transition: opacity 1.68s ${E} calc(var(--d) * .05s), filter 2.28s ${E} calc(.3s + var(--d) * .05s), transform 1.2s ${E} calc(.3s + var(--d) * .05s); }
& .ttl { margin: 0; font-stretch: 125%; font-weight: 400; font-size: clamp(34px, 8cqi, 76px); line-height: 1; letter-spacing: -.03em; color: #FAF5F0; display: flex; justify-content: center; }
& .ttl s { text-decoration: none; display: inline-block; overflow: hidden; padding-bottom: .08em; }
& .ttl s b { display: inline-block; font-weight: 400; transform: translate3d(0, 105%, 0); }
& .gate.in .ttl s b { transform: none; transition: transform 1.7s ${E} calc(.9s + var(--c) * .1s); }
& .go-btn { position: relative; width: 108px; height: 108px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .5); color: #fff; opacity: 0; transition: opacity 1s ${E} 2.4s, border-color .3s; }
& .gate.in .go-btn { opacity: 1; }
& .go-btn:hover { border-color: #f97316; }
& .go-btn::before { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 10px solid #fff; opacity: 0; animation: asf-rip 2s ease-out infinite; }
@keyframes asf-rip { from { transform: scale(0); opacity: .35; } to { transform: scale(1); opacity: 0; } }
& .gate.go > * { opacity: 0 !important; filter: blur(8px); transition: opacity 1.4s ${E}, filter 1s ${E} !important; }
& .hud { position: absolute; left: 18px; right: 18px; bottom: 16px; z-index: 3; display: flex; align-items: center; gap: 14px; }
& .hud button { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .18); color: #fff; display: grid; place-items: center; font-size: 13px; background: rgb(0 0 0 / .4); transition: border-color .2s, color .2s; }
& .hud button:hover, & .hud button[aria-pressed="true"] { border-color: #f97316; color: #f97316; }
& .segs { flex: 1; display: flex; gap: 6px; }
& .segs i { position: relative; flex: 1; height: 2px; background: rgb(255 255 255 / .15); overflow: hidden; }
& .segs i b { position: absolute; inset: 0; background: #FAF5F0; transform-origin: left; transform: scaleX(0); }
& .spd { color: rgb(255 255 255 / .6); min-width: 64px; text-align: right; }
& .spd.slow { color: #f97316; }
& .tip { position: absolute; top: 24px; left: 28px; right: 28px; margin: 0; display: flex; justify-content: space-between; color: rgb(255 255 255 / .45); pointer-events: none; z-index: 2; }
@container (max-width: 560px) { & .tip span:last-child { display: none; } & .story { bottom: 76px; left: 20px; } }
@media (prefers-reduced-motion: reduce) {
  & .pro b, & .ttl s b { filter: none !important; transform: none !important; }
  & .story span { filter: none !important; transform: none !important; transition: opacity .6s !important; }
  & .go-btn::before { animation: none; }
  & .go-btn, & .gate.in .go-btn { transition: opacity .6s; }
  & .gate.in .pro b, & .gate.in .ttl s b { transition: opacity 1s !important; }
}
`.replace(/&/g, '.d-' + ID);

  // scene table: ui.from/to = window of the scene's own progress in which its text may show
  var SCENES = [
    { text: 'It begins with a <i>single</i> thread.', ui: [0, .6] },
    { text: 'Held to the light, it <i>glows</i>.', ui: [.1, .8], easing: function (x) { return x * x; } },
    { text: 'Turned, it starts to <i>spin</i>.', ui: [0, .95] },
    { text: 'Woven, it becomes <i>cloth</i>.', ui: [.1, .9] },
    { text: 'Every tale is <i>spun</i> this way.', ui: [.1, 1.01] }
  ];
  var SCENE_SEC = 6;

  Lib.register(ID, {
    hint: 'Click to start. Hold to slow to 0.2×, ← → steer, scroll the page to boost',
    notes: [
      'One uniform per scene, <code>0..1</code>; effects are smoothstep windows on it, e.g. glow <code>smoothstep(.55, 1)</code>, weave <code>smoothstep(.275, .8)</code>',
      'Double smoothing: page lerp <code>.1</code>, then <code>shown = damp(shown, target, 12, dt)</code> for the uniforms',
      'Press-and-hold: after <code>50 ms</code> the target speed multiplier drops to <code>0.2</code>; scroll velocity boosts up to <code>×3</code>',
      'Prologue letters: blur 12 px, scale .8, scrambled delays <code>i·.05 s</code>, opacity 1.68 s, filter 2.28 s, ease <code>(.25,1,.5,1)</code>',
      'Text visibility comes from the scene\'s <code>ui.from/to</code> window, never from timers'
    ],
    simplified: 'A Canvas 2D thread replaces the TSL shaders and the page scroll height is virtual; 6 s per scene instead of 50 s, no Lenis or audio.',
    css: css,
    mount: function (stage, ctx) {
      var clamp = ctx.clamp, lerp = ctx.lerp, reduced = ctx.reduced, coarse = !ctx.fine;
      var n = SCENES.length;
      var line = 'Every story begins with one thread.';
      stage.innerHTML =
        '<canvas class="cv" aria-hidden="true"></canvas>' +
        '<p class="tip label"><span>Scene <b class="accent sn">01</b> / 0' + n + '</span><span>Hold anywhere to slow down</span></p>' +
        '<p class="story" aria-live="polite">' + SCENES.map(function (s) { return '<span>' + s.text + '</span>'; }).join('') + '</p>' +
        '<div class="hud"><button type="button" class="back" aria-label="Play backwards">◀</button><button type="button" class="pp" aria-label="Pause">❚❚</button>' +
        '<button type="button" class="fwd" aria-label="Play forwards" aria-pressed="true">▶</button>' +
        '<div class="segs" aria-hidden="true">' + SCENES.map(function () { return '<i><b></b></i>'; }).join('') + '</div><span class="spd label">1.0×</span></div>' +
        '<div class="gate"><p class="pro" aria-label="' + line + '">' + line.split('').map(function (ch, i) {
          return ch === ' ' ? ' ' : '<b aria-hidden="true" style="--d:' + ((i * 7 + 3) % 10) + '">' + ch + '</b>';
        }).join('') + '</p><h4 class="ttl" aria-label="Spin a Tale">' + 'Spin a Tale'.split('').map(function (ch, i) {
          return '<s aria-hidden="true"><b style="--c:' + i + '">' + (ch === ' ' ? '&nbsp;' : ch) + '</b></s>';
        }).join('') + '</h4><button type="button" class="go-btn label">' + (coarse ? 'Tap to<br>begin' : 'Click to<br>start') + '</button></div>';
      var q = function (s) { return stage.querySelector(s); };
      var cv = q('.cv'), g = cv.getContext('2d'), gate = q('.gate'), spd = q('.spd'), sn = q('.sn');
      var texts = stage.querySelectorAll('.story span'), fills = stage.querySelectorAll('.segs b');
      var bBack = q('.back'), bPP = q('.pp'), bFwd = q('.fwd');

      var started = false, playing = false, dir = 1, mult = 1, multT = 1, boost = 1, target = 0, shown = 0;
      var holdTimer = 0, timers = [], size = null, time = 0, vNow = 0, sp = new Array(n).fill(0);
      var dust = []; for (var i = 0; i < 70; i++) dust.push([Math.random(), Math.random(), .2 + Math.random() * .8]);
      var ss = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
      var V = 600;
      function shape(u, m3, m4, m5, out) {
        var x = (u * 2 - 1) * 1.55, y = .12 * Math.sin(u * 10 + time * .8);
        var a = u * Math.PI * 8 + time * .25, r = .12 + .62 * u;
        x = lerp(x, r * Math.cos(a), m3); y = lerp(y, r * Math.sin(a) * .92, m3);
        var rows = 14, row = u * rows, ri = Math.min(rows - 1, Math.floor(row)), f = row - ri, sx = ri % 2 ? -1 : 1;
        var wx = (f * 2 - 1) * sx * 1.05, wy = (ri / (rows - 1) - .5) * 1.15 + .022 * Math.sin(f * Math.PI * 26 + ri);
        x = lerp(x, wx, m4); y = lerp(y, wy, m4);
        var b = u * Math.PI * 12 + time * .4, rr = .55 + .05 * Math.sin(u * Math.PI * 60);
        out[0] = lerp(x, rr * Math.cos(b), m5); out[1] = lerp(y, rr * Math.sin(b), m5);
      }
      var tmp = [0, 0];
      function render() {
        if (!size) size = ctx.fitCanvas(cv, stage, 2);
        var W = size.w, H = size.h;
        g.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
        g.fillStyle = '#000203'; g.fillRect(0, 0, W, H);
        var e2 = SCENES[1].easing(sp[1]);
        var draw = ss(0, .7, sp[0]), glow = ss(.55, 1, e2), m3 = ss(.1, .8, sp[2]), m4 = ss(.275, .8, sp[3]), m5 = ss(.2, .9, sp[4]);
        var S = Math.min(W * .3, H * .36), cx = W / 2, cy = H * .44;
        g.fillStyle = 'rgba(250,245,240,1)';
        for (var d = 0; d < dust.length; d++) {
          var p = dust[d], yy = ((p[1] - time * .01 * p[2]) % 1 + 1) % 1;
          g.globalAlpha = (.08 + glow * .25) * p[2] * draw; g.fillRect(p[0] * W, yy * H, 1.4, 1.4);
        }
        var cnt = Math.floor(V * draw);
        if (cnt < 2) { g.globalAlpha = 1; return; }
        for (var pass = 0; pass < 2; pass++) {
          g.beginPath();
          for (var k = 0; k < cnt; k++) {
            shape(k / (V - 1), m3, m4, m5, tmp);
            var px = cx + tmp[0] * S, py = cy + tmp[1] * S + pass * 3;
            if (k) g.lineTo(px, py); else g.moveTo(px, py);
          }
          var o = Math.round(lerp(245, 249, glow)), gg = Math.round(lerp(245, 115, glow)), bb = Math.round(lerp(240, 22, glow));
          g.strokeStyle = 'rgb(' + o + ',' + gg + ',' + bb + ')';
          g.globalAlpha = pass ? .14 : .92;
          g.lineWidth = pass ? 1 : 1 + glow * .8;
          g.shadowColor = 'rgba(249,115,22,.9)'; g.shadowBlur = pass ? 0 : glow * 18;
          g.stroke();
        }
        g.shadowBlur = 0; g.globalAlpha = 1;
        if (draw < 1 && cnt > 1) {
          shape((cnt - 1) / (V - 1), m3, m4, m5, tmp);
          g.fillStyle = '#f97316'; g.beginPath(); g.arc(cx + tmp[0] * S, cy + tmp[1] * S, 2.5, 0, 6.283); g.fill();
        }
      }

      var shownScene = -1, shownText = -1;
      function sync() {
        var cur = Math.min(n - 1, Math.floor(shown));
        for (var i = 0; i < n; i++) sp[i] = clamp(shown - i, 0, 1);
        if (reduced) for (var j = 0; j < n; j++) sp[j] = j <= cur ? 1 : 0;
        var local = shown - cur, txt = -1;
        if (started && local >= SCENES[cur].ui[0] && local <= SCENES[cur].ui[1]) txt = cur;
        if (reduced && started) txt = cur;
        if (txt !== shownText) { shownText = txt; texts.forEach(function (t, i) { t.classList.toggle('show', i === txt); }); }
        if (cur !== shownScene) { shownScene = cur; sn.textContent = '0' + (cur + 1); }
        fills.forEach(function (f, i) { f.style.transform = 'scaleX(' + (reduced ? (i <= cur && started ? 1 : 0) : sp[i]).toFixed(3) + ')'; });
      }
      function setDir(d) {
        dir = d; playing = true; bFwd.setAttribute('aria-pressed', d > 0); bBack.setAttribute('aria-pressed', d < 0);
        bPP.textContent = '❚❚'; bPP.setAttribute('aria-label', 'Pause');
      }
      function setPlaying(on) {
        playing = on; bPP.textContent = on ? '❚❚' : '▶'; bPP.setAttribute('aria-label', on ? 'Pause' : 'Play');
        if (!on) { bFwd.setAttribute('aria-pressed', 'false'); bBack.setAttribute('aria-pressed', 'false'); }
        else setDir(dir);
      }
      var lp = ctx.loop(function (dt) {
        time += dt;
        if (started && !reduced) {
          var fast = Math.abs(vNow) > .03;
          if (fast) { dir = vNow > 0 ? 1 : -1; if (!playing) setPlaying(true); }
          boost = ctx.damp(boost, fast ? 1 + Math.min(2, Math.abs(vNow) * 6) : 1, 12, dt);
          mult = ctx.damp(mult, multT, 14, dt);
          if (playing) target = clamp(target + dir * mult * boost * dt / SCENE_SEC, 0, n);
          if (playing && (target >= n || (target <= 0 && dir < 0))) setPlaying(false);
          var shownSpd = playing ? mult * boost : 0;
          spd.textContent = (dir < 0 && playing ? '−' : '') + shownSpd.toFixed(1) + '×';
          spd.classList.toggle('slow', multT < 1);
        }
        shown = reduced ? target : ctx.damp(shown, target, 12, dt);
        if (Math.abs(shown - target) < 1e-4) shown = target;
        sync(); render();
      });

      function begin() {
        if (started) return;
        started = true; gate.classList.add('go');
        timers.push(setTimeout(function () { gate.style.display = 'none'; }, 2000));
        if (reduced) { target = .999; spd.textContent = 'Stills'; bPP.hidden = true; return; }
        setDir(1);
      }
      q('.go-btn').addEventListener('click', begin);
      bPP.addEventListener('click', function () { setPlaying(!playing); });
      function step(d) {
        if (reduced) { target = clamp(Math.floor(target) + d, 0, n - 1) + .999; return; }
        setDir(d);
      }
      bFwd.addEventListener('click', function () { step(1); });
      bBack.addEventListener('click', function () { step(-1); });
      stage.addEventListener('keydown', function (e) {
        if (!started) return;
        if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
        else if (e.key === 'Escape') setPlaying(false);
      });
      function holdOn(e) {
        if (!started || reduced || e.target.closest('button')) return;
        clearTimeout(holdTimer); holdTimer = setTimeout(function () { multT = .2; }, 50);
      }
      function holdOff() { clearTimeout(holdTimer); multT = 1; }
      stage.addEventListener('pointerdown', holdOn);
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { stage.addEventListener(t, holdOff); });

      function reset() {
        timers.forEach(clearTimeout); timers = [];
        started = false; playing = false; target = shown = 0; dir = 1; multT = mult = boost = 1;
        gate.style.display = ''; gate.classList.remove('go', 'in'); bPP.hidden = false;
        spd.textContent = '1.0×'; shownText = -2;
        timers.push(setTimeout(function () { void gate.offsetWidth; gate.classList.add('in'); }, 120));
      }
      var ro = new ResizeObserver(function () { size = null; });
      reset();
      return {
        start: function () { ro.observe(stage); lp.start(); },
        stop: function () {
          lp.stop(); ro.disconnect(); holdOff(); vNow = 0;
          timers.forEach(clearTimeout); timers = [];
          if (started) gate.style.display = 'none'; else gate.classList.add('in');
        },
        scroll: function (p, v) { vNow = v; },
        replay: reset
      };
    }
  });
})();
