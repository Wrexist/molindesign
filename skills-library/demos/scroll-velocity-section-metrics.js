/* scroll-velocity-section-metrics — smoothed clamped velocity, per-section progress/transition/screenOffset, scroll-kicked particles. */
(function () {
  'use strict';
  var ID = 'scroll-velocity-section-metrics';
  var css = `
& { container-type: inline-size; font-variant-numeric: tabular-nums; }
& .cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
& .vp { position: absolute; left: 28px; top: 54px; bottom: 54px; width: 38%; border: 1px solid rgb(255 255 255 / .14); border-radius: 10px; overflow: hidden; background: rgb(255 255 255 / .015); }
& .vp::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed rgb(249 115 22 / .45); }
& .vp-in { position: absolute; left: 0; right: 0; top: 0; will-change: transform; }
& .card { position: absolute; left: 10%; right: 10%; border-radius: 8px; border: 1px solid rgb(255 255 255 / .16); background: linear-gradient(160deg, rgb(255 255 255 / .07), rgb(255 255 255 / .01));
  display: flex; flex-direction: column; justify-content: space-between; padding: 14px;
  opacity: calc(1 - max(var(--t, 0), -1 * var(--t, 0))); transform: translate3d(0, calc(var(--t, 0) * 6%), 0) skewY(calc(var(--v, 0) * -4deg)); }
& .card b { font-stretch: 125%; font-weight: 400; font-size: clamp(18px, 3.2cqi, 30px); line-height: 1; letter-spacing: -.02em; color: #fff; }
& .card .label { color: rgb(255 255 255 / .5); }
& .card.on { border-color: rgb(249 115 22 / .6); }
& .vp-cap { position: absolute; left: 28px; top: 26px; margin: 0; color: rgb(255 255 255 / .45); }
& .pn { position: absolute; right: 28px; top: 26px; bottom: 26px; left: calc(38% + 64px); display: flex; flex-direction: column; gap: 14px; color: rgb(255 255 255 / .5); }
& .vel { padding: 14px 16px; border-radius: 12px; border: 1px solid rgb(255 255 255 / .1); background: rgb(0 0 0 / .55); backdrop-filter: blur(10px); }
& .vel-top { display: flex; justify-content: space-between; align-items: baseline; }
& .vnum { font-stretch: 125%; font-size: clamp(24px, 4cqi, 40px); color: #fff; letter-spacing: -.02em; line-height: 1.1; }
& .vtrack { position: relative; height: 4px; margin-top: 10px; background: rgb(255 255 255 / .1); border-radius: 2px; }
& .vtrack::before { content: ""; position: absolute; left: 50%; top: -4px; bottom: -4px; width: 1px; background: rgb(255 255 255 / .5); }
& .vfill { position: absolute; top: 0; bottom: 0; left: 50%; width: 50%; background: #f97316; transform-origin: left; transform: scaleX(0); border-radius: 2px; }
& .tbl { flex: 1; display: flex; flex-direction: column; justify-content: space-around; padding: 6px 16px; border-radius: 12px; border: 1px solid rgb(255 255 255 / .1); background: rgb(0 0 0 / .55); backdrop-filter: blur(10px); }
& .sr { display: grid; grid-template-columns: 26px 1fr; gap: 4px 10px; align-items: center; }
& .sr > .label:first-child { grid-row: span 3; color: #fff; }
& .sr.on > .label:first-child { color: #f97316; }
& .m { display: grid; grid-template-columns: 86px 1fr 50px; gap: 8px; align-items: center; }
& .m em { font-style: normal; text-align: right; color: rgb(255 255 255 / .85); }
& .bar { position: relative; height: 3px; background: rgb(255 255 255 / .1); }
& .bar i { position: absolute; top: 0; bottom: 0; left: 0; width: 100%; background: rgb(255 255 255 / .8); transform-origin: left; transform: scaleX(0); }
& .bar.c i { left: 50%; width: 50%; background: #f97316; }
& .bar.c::before { content: ""; position: absolute; left: 50%; top: -3px; bottom: -3px; width: 1px; background: rgb(255 255 255 / .4); }
@container (max-width: 620px) {
  & .vp { left: 16px; right: 16px; width: auto; top: 44px; bottom: auto; height: 38%; }
  & .vp-cap { left: 16px; top: 18px; }
  & .card { left: 6%; right: 6%; }
  & .pn { left: 16px; right: 16px; top: calc(38% + 58px); bottom: 14px; gap: 8px; }
  & .vel { padding: 8px 12px; } & .vnum { font-size: 22px; }
  & .tbl { padding: 4px 12px; }
  & .sr { grid-template-columns: 22px 1fr 1fr 1fr; gap: 10px; }
  & .sr > .label:first-child { grid-row: auto; }
  & .m { grid-template-columns: 1fr; gap: 3px; font-size: 8.5px; letter-spacing: .12em; }
  & .m em { text-align: left; order: 2; } & .m .bar { order: 3; }
}
`.replace(/&/g, '.d-' + ID);

  Lib.register(ID, {
    hint: 'Scroll the page, slowly then fast — watch the signals and the particles',
    notes: [
      'Velocity: <code>raw = clamp(Δy / frameMs · .32, −1, 1)</code>, attack <code>1 − e<sup>−14·dt</sup></code>, raw decays at <code>e<sup>−10·dt</sup></code>, dead zone .01',
      '<code>progress = (vh − top) / (vh + height)</code>; <code>transition</code> runs −1 entering → 0 on stage → +1 gone',
      '<code>screenOffset = (vh·.5 − anchor centre) / vh</code>; metrics come from cached rects, never a per-frame layout read',
      'Splats only when <code>|v| ≥ .018</code>, strength <code>v·K·clamp(dt·60, .25, 2)</code>, sideways sway <code>sin(t·1.7 + i·1.91)·|x|·.28</code>',
      'Clamp what it drives: ≤ 4° skew, ≤ 6 vh shift; reduced motion forces <code>v = 0</code>'
    ],
    simplified: 'Canvas 2D particles stand in for the GPU fluid sim, and the splat colour is the orange accent instead of an HSL cycle; the mini-page scroll is mapped from your page scroll.',
    css: css,
    mount: function (stage, ctx) {
      var clamp = ctx.clamp, reduced = ctx.reduced;
      var NAMES = ['Arrival', 'Feature', 'Outro'];
      stage.innerHTML = '<canvas class="cv" aria-hidden="true"></canvas><p class="vp-cap label">Virtual viewport · 3 sections</p>' +
        '<div class="vp" aria-hidden="true"><div class="vp-in">' + NAMES.map(function (n, i) {
          return '<div class="card"><span class="label">Section 0' + (i + 1) + '</span><b>' + n + '</b><span class="label">--transition</span></div>';
        }).join('') + '</div></div>' +
        '<div class="pn label"><div class="vel"><div class="vel-top"><span>Velocity −1..1</span><span class="hint">Scroll faster</span></div><div class="vnum">+0.00</div><div class="vtrack"><i class="vfill"></i></div></div>' +
        '<div class="tbl">' + NAMES.map(function (n, i) {
          return '<div class="sr"><span class="label">S' + (i + 1) + '</span>' +
            '<div class="m"><span>progress</span><span class="bar"><i></i></span><em>0.000</em></div>' +
            '<div class="m"><span>transition</span><span class="bar c"><i></i></span><em>0.000</em></div>' +
            '<div class="m"><span>offset</span><span class="bar c"><i></i></span><em>0.000</em></div></div>';
        }).join('') + '</div></div>';
      var q = function (s) { return stage.querySelector(s); };
      var cv = q('.cv'), g = cv.getContext('2d'), vp = q('.vp'), vin = q('.vp-in'), vnum = q('.vnum'), vfill = q('.vfill'), hintEl = q('.hint');
      var cards = stage.querySelectorAll('.card'), srs = stage.querySelectorAll('.sr');
      var size = null, VH = 0, secs = [], range = 0, P = 0, y = 0, time = 0, off = null;
      // cached layout (re-measured only on resize)
      function measure() {
        size = ctx.fitCanvas(cv, stage, 2);
        var sb = stage.getBoundingClientRect(), vb = vp.getBoundingClientRect();
        off = { x: vb.left - sb.left, y: vb.top - sb.top, w: vb.width };
        VH = vb.height;
        var h = VH * .78, gap = VH * .3, top = VH * .55;
        secs = [];
        cards.forEach(function (c, i) { c.style.top = top + 'px'; c.style.height = h + 'px'; secs.push({ docTop: top, height: h }); top += h + gap; });
        range = top - gap + VH * .55 - VH;
        vin.style.height = (top + VH) + 'px';
      }
      // 1. smoothed scroll velocity (exact constants)
      var GAIN = .32, SMOOTH = 14, DECAY = 10, DEAD = .01, raw = 0, v = 0, lastT = 0, lastY = 0, lastEv = 0;
      function sampleVelocity(yy) {
        var now = performance.now();
        if (!lastT) { lastT = lastEv = now; lastY = yy; return v; }
        var dt = Math.min((now - lastT) / 1000, 1 / 30); lastT = now;
        var d = yy - lastY, frameMs = Math.min(Math.max(now - lastEv, 8), 80); lastEv = now; lastY = yy;
        if (Math.abs(d) >= DEAD) raw = clamp(d / frameMs * GAIN, -1, 1);
        v += (raw - v) * (1 - Math.exp(-dt * SMOOTH));
        raw *= Math.exp(-dt * DECAY);
        return v;
      }
      // particles
      var N = 520, px = new Float32Array(N), py = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N), heat = new Float32Array(N);
      function seed() { for (var i = 0; i < N; i++) { px[i] = Math.random() * size.w; py[i] = Math.random() * size.h; vx[i] = vy[i] = heat[i] = 0; } }
      var diss = .9;
      var ss = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
      var fmt = function (n) { return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(3); };
      var last = [];
      function frame(dt) {
        if (!size) { measure(); seed(); }
        time += dt;
        y = P * range;
        var vv = reduced ? 0 : sampleVelocity(y);
        if (Math.abs(vv) < 1e-4) vv = 0;
        vin.style.transform = 'translate3d(0,' + (-y).toFixed(1) + 'px,0)';
        vnum.textContent = (vv >= 0 ? '+' : '−') + Math.abs(vv).toFixed(2);
        vfill.style.transform = 'scaleX(' + vv.toFixed(3) + ')';
        hintEl.style.opacity = Math.abs(vv) > .05 ? 0 : 1;
        // 2. section metrics from cached rects
        var rects = [];
        secs.forEach(function (s, i) {
          var top = s.docTop - y, bottom = top + s.height, sMin = Math.min(s.height, VH);
          var progress = clamp((VH - top) / (VH + s.height), 0, 1);
          var entering = -Math.max(0, top - (VH - sMin)) / sMin;
          var exiting = 1 - clamp(bottom / Math.min(s.height, VH * 1), 0, 1);
          var transition = clamp(entering + exiting, -1, 1);
          var screenOffset = (VH * .5 - (top + s.height * .5)) / VH;
          var vals = [Math.round(progress * 1e3) / 1e3, Math.round(transition * 1e3) / 1e3, Math.round(screenOffset * 1e3) / 1e3];
          var key = vals.join() + (reduced ? '' : vv.toFixed(3));
          if (last[i] !== key) {                     // publish only when changed
            last[i] = key;
            cards[i].style.setProperty('--t', reduced ? 0 : vals[1]);
            cards[i].style.opacity = reduced ? String(1 - Math.abs(vals[1])) : '';
            cards[i].style.setProperty('--v', vv.toFixed(3));
            var bars = srs[i].querySelectorAll('.bar i'), ems = srs[i].querySelectorAll('em');
            bars[0].style.transform = 'scaleX(' + vals[0] + ')';
            bars[1].style.transform = 'scaleX(' + vals[1] + ')';
            bars[2].style.transform = 'scaleX(' + clamp(vals[2], -1, 1) + ')';
            ems[0].textContent = vals[0].toFixed(3); ems[1].textContent = fmt(vals[1]); ems[2].textContent = fmt(vals[2]);
            var on = Math.abs(vals[1]) < .5;
            srs[i].classList.toggle('on', on); cards[i].classList.toggle('on', on);
          }
          if (transition > -1 && transition < 1) rects.push([off.x + off.w / 2, off.y + top + s.height / 2, off.w * .8, s.height]);
        });
        // 3. scroll-kicked disturbance
        var W = size.w, H = size.h, k = clamp(dt * 60, .25, 2);
        diss = ctx.damp(diss, .9 + .08 * ss(.02, .3, Math.abs(vv)), 5, dt);
        if (Math.abs(vv) >= .018) {
          rects.slice(0, 8).forEach(function (r, ri) {
            var sway = Math.sin(time * 1.7 + ri * 1.91) * Math.abs(vv) * .28;
            var R = clamp(Math.min(r[2], r[3]) * .045, 9, 23) * 7;
            for (var i = 0; i < N; i++) {
              var dx = px[i] - r[0], dy = py[i] - r[1], d2 = dx * dx + dy * dy;
              if (d2 > R * R * 4) continue;
              var f = Math.exp(-d2 / (R * R)) * vv * 9 * k;
              vy[i] -= f * 2.2; vx[i] += (sway * 40 + dx * .02) * Math.abs(f) * .12; heat[i] = Math.min(1, heat[i] + Math.abs(f) * .2);
            }
          });
        }
        g.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        var dk = Math.pow(diss, dt * 60);
        for (var i = 0; i < N; i++) {
          if (!reduced) {
            vx[i] += Math.sin(py[i] * .012 + time * .3) * .02; vy[i] += Math.cos(px[i] * .01 + time * .25) * .02;
            vx[i] *= dk; vy[i] *= dk;
            px[i] = (px[i] + vx[i] * k + W) % W; py[i] = (py[i] + vy[i] * k + H) % H;
            heat[i] *= Math.exp(-dt * 1.4);
          }
          var h = heat[i];
          g.fillStyle = h > .05 ? 'rgba(249,115,22,' + (.25 + h * .7).toFixed(3) + ')' : 'rgba(255,255,255,.22)';
          var sz = 1.2 + h * 1.6;
          g.fillRect(px[i] - sz / 2, py[i] - sz / 2, sz, sz);
        }
      }
      var lp = ctx.loop(frame);
      var ro = new ResizeObserver(function () { size = null; last = []; });
      return {
        start: function () { ro.observe(stage); lastT = 0; lp.start(); },
        stop: function () { lp.stop(); ro.disconnect(); },
        scroll: function () {
          var r = stage.getBoundingClientRect(), vh = innerHeight;
          P = clamp(((vh - r.top) / (vh + r.height) - .15) / .7, 0, 1);
        }
      };
    }
  });
})();
