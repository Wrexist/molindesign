/* scroll-driven-chapters — scene table → rail ticks, picker, slot-roll counter, telemetry, timed beats. */
(function () {
  'use strict';
  var ID = 'scroll-driven-chapters';
  var css = `
& { container-type: inline-size; font-family: Archivo, system-ui, sans-serif; }
& .cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
& .vig { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 90% at 50% 45%, transparent 55%, rgb(0 0 0 / .75)); }
& .top { position: absolute; left: 28px; top: 26px; right: 28px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; pointer-events: none; }
& .sc { margin: 0; color: rgb(255 255 255 / .45); }
& .title { margin: 6px 0 0; font-stretch: 125%; font-weight: 400; font-size: clamp(22px, 4.2cqi, 40px); line-height: 1.05; letter-spacing: -.02em; color: #fff; overflow: hidden; height: 1.12em; }
& .title { position: relative; width: min(70cqi, 520px); }
& .title span { position: absolute; left: 0; top: 0; white-space: nowrap; }
& .hint { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; color: rgb(255 255 255 / .55); text-align: right; transition: opacity .6s; }
& .tk { position: relative; width: 1px; height: 36px; overflow: hidden; background: rgb(255 255 255 / .15); }
& .tk b { position: absolute; left: 0; top: 0; width: 1px; height: 12px; background: rgb(255 255 255 / .85); animation: sdc-tk 1.6s ease-in-out infinite; }
@keyframes sdc-tk { from { transform: translateY(-12px); } to { transform: translateY(36px); } }
& .beat { position: absolute; left: 28px; bottom: 92px; right: 28px; margin: 0; font-stretch: 125%; font-size: clamp(20px, 3.6cqi, 34px); line-height: 1.12; letter-spacing: -.02em; color: #fff; pointer-events: none; transition: opacity .35s, filter .35s; text-wrap: balance; }
& .beat .mk { display: block; overflow: hidden; padding-bottom: .1em; margin-bottom: -.1em; }
& .beat .ln { display: block; transform: translateY(110%); transition: transform .9s cubic-bezier(.23,1,.32,1); }
& .beat .l2 { font-style: italic; color: rgb(255 255 255 / .8); transition-delay: .08s; }
& .beat.show .ln { transform: none; }
& .beat.out { opacity: 0; filter: blur(8px); }
&.picking .beat { opacity: 0; }
& .hud { position: absolute; left: 20px; right: 20px; bottom: 18px; display: flex; align-items: center; gap: 16px; z-index: 3; }
& .pick { position: relative; flex: none; }
& .cbtn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .15); background: rgb(0 0 0 / .45); backdrop-filter: blur(12px); color: #fff; transition: border-color .2s; }
& .cbtn:hover { border-color: rgb(255 255 255 / .4); }
& .dot { width: 6px; height: 6px; border-radius: 50%; background: #f97316; box-shadow: 0 0 8px rgb(249 115 22 / .8); }
& .roll { position: relative; display: inline-block; height: 1.4em; width: 1.6em; overflow: hidden; }
& .roll span { position: absolute; left: 0; top: 0; }
& .of { color: rgb(255 255 255 / .45); }
& .chev { width: 8px; height: 8px; border: solid rgb(255 255 255 / .7); border-width: 1px 1px 0 0; transform: rotate(-45deg) translate(-1px, 1px); transition: transform .4s cubic-bezier(.23,1,.32,1); margin-left: 4px; }
& .cbtn[aria-expanded="true"] .chev { transform: rotate(90deg) translate(-2px, 2px); }
& .list { position: absolute; left: 0; bottom: 100%; margin: 0 0 12px; padding: 6px; list-style: none; min-width: 14rem; border-radius: 16px; border: 1px solid rgb(255 255 255 / .1); background: rgb(0 0 0 / .6); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); transform-origin: 20% 100%; transition: opacity .25s, transform .35s cubic-bezier(.23,1,.32,1); }
& .list[hidden] { display: block; visibility: hidden; opacity: 0; transform: translateY(8px) scale(.97); }
& .list button { display: flex; gap: 14px; width: 100%; padding: 10px 12px; border-radius: 12px; text-align: left; color: rgb(255 255 255 / .85); transition: background .2s; }
& .list button:hover, & .list button:focus-visible { background: rgb(255 255 255 / .1); outline: none; }
& .list button span:first-child { color: rgb(255 255 255 / .4); }
& .list button[aria-current="step"] span:first-child { color: #f97316; }
& .crail { position: relative; flex: 1; height: 1px; background: rgb(255 255 255 / .15); min-width: 40px; }
& .fill { position: absolute; inset: 0; background: rgb(255 255 255 / .85); transform-origin: left; transform: scaleX(0); }
& .crail i.t { position: absolute; top: -4px; width: 1px; height: 8px; background: rgb(255 255 255 / .35); }
& .crail i.t.on { background: #f97316; }
& .tele { margin: 0; flex: none; color: rgb(255 255 255 / .6); font-variant-numeric: tabular-nums; white-space: nowrap; }
& .tele b { color: #fff; font-weight: 500; }
@container (max-width: 620px) {
  & .tele { position: absolute; left: 0; bottom: 52px; font-size: 9.5px; }
  & .beat { bottom: 118px; left: 20px; }
  & .top { left: 20px; top: 22px; right: 20px; }
  & .hint span { display: none; }
}
@media (prefers-reduced-motion: reduce) { & .tk b { animation: none; transform: translateY(12px); } & .beat .ln, & .list { transition: opacity .3s; } & .beat .ln { transform: none; } }
`.replace(/&/g, '.d-' + ID);

  // single source of truth: [key, start t, title, camera {yaw, pitch, dist, fov°, f-stop, morph, accent}]
  var SCENES = [
    ['bay', 0, 'Bay', { yaw: .4, pitch: .32, dist: 9, fov: 74, f: 8, m: 0, a: .04 }],
    ['drive', .17, 'Roll-out', { yaw: 1.4, pitch: .05, dist: 6, fov: 54, f: 2.8, m: 0, a: .16 }],
    ['door', .34, 'Close detail', { yaw: 2.3, pitch: .2, dist: 3.1, fov: 24, f: 1.8, m: 0, a: .3 }],
    ['lift', .51, 'Overhead', { yaw: 3.2, pitch: 1.15, dist: 6, fov: 40, f: 4, m: .25, a: .22 }],
    ['grid', .68, 'Exploded grid', { yaw: 4.1, pitch: .72, dist: 7, fov: 46, f: 5.6, m: 1, a: .5 }],
    ['mark', .85, 'The mark', { yaw: 5.5, pitch: .28, dist: 9, fov: 15, f: 1.4, m: 0, a: 1 }]
  ];
  var END = 1;
  var BEATS = [
    [.04, .14, 'One timeline,', 'six named scenes.'],
    [.21, .31, 'Rail, ticks and picker', 'all read one table.'],
    [.38, .48, 'Focal length is computed', 'from the live field of view.'],
    [.72, .82, 'A chapter jump eases t,', 'it never cuts.'],
    [.9, 1.01, 'Scroll back up —', 'every beat replays.']
  ];

  Lib.register(ID, {
    hint: 'Scroll the page to scrub the film, or open the chapter picker',
    notes: [
      'One scene table <code>[[\'bay\',0],[\'drive\',t1],…]</code> feeds rail ticks, picker rows, the <code>03 / 06</code> counter and beats',
      'Rendered t chases target: <code>t += (target − t)·(1 − e<sup>−6·dt</sup>)</code> — weighty scrubbing, picker jumps glide',
      'Rail fill is <code>scaleX(t / END)</code> written from the loop; ticks are 8 px hairlines at <code>start / END · 100%</code>',
      'Telemetry reads the real camera: <code>mm = 18 / tan(fov / 2)</code>, f-stop and focus distance, tabular nums',
      'Beats: two lines of ≤ 9 words, masked enter, .35 s blur-out exit, <code>aria-live="polite"</code>'
    ],
    simplified: 'A Canvas 2D point cloud stands in for the 3D car, page scroll stands in for the captured wheel, and the explore/orbit mode is left out.',
    css: css,
    mount: function (stage, ctx) {
      var el = ctx.el, clamp = ctx.clamp, lerp = ctx.lerp, reduced = ctx.reduced;
      var pad = function (n) { return String(n).padStart(2, '0'); };
      stage.innerHTML =
        '<canvas class="cv" aria-hidden="true"></canvas><div class="vig"></div>' +
        '<div class="top"><div><p class="sc label">Scene <span class="accent">' + pad(1) + '</span></p><h4 class="title"><span>Bay</span></h4></div>' +
        '<p class="hint label"><span>Scroll the page</span><i class="tk"><b></b></i></p></div>' +
        '<p class="beat" aria-live="polite"><span class="mk"><span class="ln l1"></span></span><span class="mk"><span class="ln l2"></span></span></p>' +
        '<div class="hud"><div class="pick"><button type="button" class="cbtn label" aria-expanded="false" aria-controls="sdc-chapters">' +
        '<i class="dot"></i><span class="roll"><span>01</span></span><span class="of">/ ' + pad(SCENES.length) + '</span><i class="chev"></i></button>' +
        '<ul class="list label" id="sdc-chapters" hidden>' + SCENES.map(function (s, i) {
          return '<li><button type="button" data-i="' + i + '"><span>' + pad(i + 1) + '</span><span>' + s[2] + '</span></button></li>';
        }).join('') + '</ul></div>' +
        '<div class="crail" aria-hidden="true"><i class="fill"></i>' + SCENES.map(function (s) { return '<i class="t" style="left:' + (s[1] / END * 100) + '%"></i>'; }).join('') + '</div>' +
        '<p class="tele label" aria-hidden="true"></p></div>';
      var q = function (s) { return stage.querySelector(s); };
      var cv = q('.cv'), g = cv.getContext('2d'), btn = q('.cbtn'), list = q('.list'), roll = q('.roll'), fill = q('.fill');
      var ticks = stage.querySelectorAll('.crail .t'), rows = list.querySelectorAll('button'), tele = q('.tele');
      var titleEl = q('.title'), scNum = q('.sc .accent'), beatEl = q('.beat'), hint = q('.hint');

      // point cloud: fuzzy torus knot that can morph into a grid
      var N = 1100, pts = new Float32Array(N * 6), floor = [];
      for (var i = 0; i < N; i++) {
        var s = i / N * Math.PI * 2, r = Math.cos(3 * s) + 2, j = .22;
        pts[i * 6] = (r * Math.cos(2 * s) + (Math.random() - .5) * j) * .45;
        pts[i * 6 + 1] = (-Math.sin(3 * s) + (Math.random() - .5) * j) * .45;
        pts[i * 6 + 2] = (r * Math.sin(2 * s) + (Math.random() - .5) * j) * .45;
        pts[i * 6 + 3] = ((i % 33) - 16) * .17; pts[i * 6 + 4] = -.2; pts[i * 6 + 5] = (Math.floor(i / 33) - 16) * .17;
      }
      for (var a = -7; a <= 7; a++) for (var b = -7; b <= 7; b++) floor.push(a * .55, -1.55, b * .55);

      var t = 0, target = 0, lastSp = -1, spin = 0, scene = -1, beat = -1, size = null, timers = [], picker = false;
      var cam = { yaw: 0, pitch: 0, dist: 0, fov: 0, f: 0, m: 0, a: 0 };
      var smooth = function (x) { return x * x * (3 - 2 * x); };
      function camAt(tt) {
        var k = 0;
        while (k < SCENES.length - 1 && SCENES[k + 1][1] <= tt) k++;
        var A = SCENES[k][3], B = (SCENES[k + 1] || SCENES[k])[3];
        // hold each scene's camera, then glide to the next over the last 45% of the chapter
        var e = SCENES[k + 1] ? smooth(clamp(((tt - SCENES[k][1]) / (SCENES[k + 1][1] - SCENES[k][1]) - .55) / .45, 0, 1)) : 0;
        for (var key in cam) cam[key] = lerp(A[key], B[key], e);
        cam.yaw += tt * 1.4;
        return k;
      }
      function resize() { size = ctx.fitCanvas(cv, stage, 2); }

      function render() {
        if (!size) resize();
        var W = size.w, H = size.h, d = size.dpr;
        g.setTransform(d, 0, 0, d, 0, 0);
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        var yaw = cam.yaw + spin, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
        var fl = (H / 2) / Math.tan(cam.fov * Math.PI / 360), ox = W / 2, oy = H * .47, ap = .05 / cam.f;
        function proj(x, y, z) {
          var x1 = x * cy - z * sy, z1 = x * sy + z * cy;
          var y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp + cam.dist;
          return z2 > .2 ? [ox + x1 * fl / z2, oy - y2 * fl / z2, z2] : null;
        }
        g.fillStyle = 'rgba(255,255,255,.16)';
        for (var f = 0; f < floor.length; f += 3) {
          var pf = proj(floor[f], floor[f + 1], floor[f + 2]);
          if (pf) g.fillRect(pf[0], pf[1], 1.2, 1.2);
        }
        var m = smooth(cam.m), ph = (performance.now() / 9000) % 1;
        for (var n = 0; n < N; n++) {
          var o = n * 6, P = proj(lerp(pts[o], pts[o + 3], m), lerp(pts[o + 1], pts[o + 4], m), lerp(pts[o + 2], pts[o + 5], m));
          if (!P) continue;
          var coc = Math.min(14, Math.abs(P[2] - cam.dist) / P[2] * fl * ap), sz = 1.1 + coc;
          var al = clamp(1.5 / sz, .05, .95) * clamp(1.4 - P[2] / (cam.dist * 2), .25, 1);
          var hot = ((n / N + ph) % 1) < cam.a;
          g.fillStyle = hot ? 'rgba(249,115,22,' + al + ')' : 'rgba(255,255,255,' + al * .85 + ')';
          if (sz < 2.4) g.fillRect(P[0] - sz / 2, P[1] - sz / 2, sz, sz);
          else { g.beginPath(); g.arc(P[0], P[1], sz / 2, 0, 6.283); g.fill(); }
        }
      }

      function rollTo(el2, text, dir) {
        var old = el2.lastElementChild, nu = el(old.tagName.toLowerCase(), '', text);
        el2.appendChild(nu);
        if (reduced) { old.remove(); return; }
        var o = { duration: 550, easing: 'cubic-bezier(.23,1,.32,1)' };
        old.animate([{ transform: 'none' }, { transform: 'translateY(' + (-100 * dir) + '%)', opacity: 0 }], o).onfinish = function () { old.remove(); };
        nu.animate([{ transform: 'translateY(' + (100 * dir) + '%)' }, { transform: 'none' }], o);
      }
      function setScene(k) {
        var dir = k > scene ? 1 : -1;
        scene = k;
        rollTo(roll, pad(k + 1), dir);
        rollTo(titleEl, SCENES[k][2], dir);
        scNum.textContent = pad(k + 1);
        btn.setAttribute('aria-label', 'Chapter ' + (k + 1) + ' of ' + SCENES.length + ': ' + SCENES[k][2] + '. Choose a chapter');
        rows.forEach(function (r, i) { if (i === k) r.setAttribute('aria-current', 'step'); else r.removeAttribute('aria-current'); });
        ticks.forEach(function (tk, i) { tk.classList.toggle('on', i <= k); });
      }
      function setBeat(k) {
        beat = k;
        timers.forEach(clearTimeout); timers = [];
        var show = function () {
          beatEl.classList.remove('out', 'show');
          if (k < 0) { beatEl.querySelector('.l1').textContent = ''; beatEl.querySelector('.l2').textContent = ''; return; }
          beatEl.querySelector('.l1').textContent = BEATS[k][2];
          beatEl.querySelector('.l2').textContent = BEATS[k][3];
          void beatEl.offsetWidth; beatEl.classList.add('show');
        };
        if (beatEl.classList.contains('show') && !reduced) { beatEl.classList.add('out'); timers.push(setTimeout(show, 350)); } else show();
      }

      function frame(dt) {
        t = reduced ? target : ctx.damp(t, target, 6, dt);
        if (Math.abs(t - target) < 1e-4) t = target;
        if (!reduced) spin += dt * .05;
        var k = camAt(t);
        if (k !== scene) setScene(k);
        var bk = -1;
        BEATS.forEach(function (b, i) { if (t >= b[0] && t < b[1]) bk = i; });
        if (bk !== beat) setBeat(bk);
        fill.style.transform = 'scaleX(' + (t / END).toFixed(4) + ')';
        hint.style.opacity = t > .05 ? 0 : 1;
        var mm = 18 / Math.tan(cam.fov * Math.PI / 360), sec = Math.round(t * 96);
        tele.innerHTML = '<b>' + Math.round(mm) + '</b> mm · f/<b>' + cam.f.toFixed(1) + '</b> · Focus <b>' + cam.dist.toFixed(1) + '</b> m · ' + pad(Math.floor(sec / 60)) + ':' + pad(sec % 60);
        render();
      }
      var lp = ctx.loop(frame);

      function jump(k) { target = SCENES[k][1] + .002; if (reduced) t = target; }
      function openPicker(on) {
        picker = on;
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        list.hidden = !on; stage.classList.toggle('picking', on);
        if (on) (list.querySelector('[aria-current]') || rows[0]).focus();
      }
      btn.addEventListener('click', function () { openPicker(!picker); });
      rows.forEach(function (r) {
        r.addEventListener('click', function () { jump(+r.dataset.i); openPicker(false); btn.focus(); });
      });
      stage.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && picker) { openPicker(false); btn.focus(); e.stopPropagation(); return; }
        if (picker && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
          var arr = Array.prototype.slice.call(rows), i2 = arr.indexOf(document.activeElement);
          arr[(i2 + (e.key === 'ArrowDown' ? 1 : arr.length - 1)) % arr.length].focus(); e.preventDefault(); return;
        }
        if (!picker && document.activeElement === btn && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
          jump(clamp(scene + (e.key === 'ArrowRight' ? 1 : -1), 0, SCENES.length - 1)); e.preventDefault();
        }
      });
      function outside(e) { if (picker && !q('.pick').contains(e.target)) openPicker(false); }
      var ro = new ResizeObserver(function () { size = null; });

      return {
        start: function () { ro.observe(stage); document.addEventListener('pointerdown', outside); lp.start(); },
        stop: function () {
          lp.stop(); ro.disconnect(); document.removeEventListener('pointerdown', outside);
          timers.forEach(clearTimeout); timers = [];
          if (picker) openPicker(false);
        },
        scroll: function (p) {
          var r = stage.getBoundingClientRect(), vh = innerHeight;
          var sp = clamp((vh - r.top) / (vh + r.height), 0, 1);
          if (Math.abs(sp - lastSp) > 1e-4) { lastSp = sp; target = clamp((sp - .2) / .6, 0, 1) * END; }
        },
        replay: function () { jump(0); }
      };
    }
  });
})();
