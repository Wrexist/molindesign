/* clip-path-camera-wipes — scroll-scrubbed horizontal slit reveal + drag slide wipe with counter-parallax and scale settle. */
(function () {
  'use strict';
  var ID = 'clip-path-camera-wipes';
  var css = `
& { container-type: inline-size; background: #000; }
& .lb { position: absolute; inset: 0; z-index: 1; touch-action: pan-y; cursor: grab; outline: none; }
& .lb.drag { cursor: grabbing; }
& .sl { position: absolute; inset: 0; overflow: hidden; visibility: hidden; }
& .sl .img { position: absolute; inset: 0; will-change: transform; }
& .cap { position: absolute; left: 28px; bottom: 24px; z-index: 2; pointer-events: none; }
& .cap .label { margin: 0 0 8px; color: rgb(255 255 255 / .6); }
& .cap h4 { margin: 0; font-stretch: 125%; font-weight: 400; font-size: clamp(26px, 5.4cqi, 56px); line-height: 1; letter-spacing: -.03em; color: #fff; text-shadow: 0 2px 30px rgb(0 0 0 / .4); }
& .ctl { position: absolute; right: 22px; bottom: 22px; z-index: 3; display: flex; align-items: center; gap: 10px; }
& .ctl button { width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .3); background: rgb(0 0 0 / .35); backdrop-filter: blur(8px); color: #fff; transition: border-color .2s; }
& .ctl button:hover { border-color: #f97316; }
& .ctl .n { color: rgb(255 255 255 / .8); min-width: 64px; text-align: center; }
& .hro { position: absolute; inset: 0; z-index: 2; display: grid; place-items: center; align-content: center; text-align: center; pointer-events: none; }
& .hro .t { display: flex; font-stretch: 125%; font-weight: 400; font-size: clamp(44px, 12cqi, 132px); line-height: .9; letter-spacing: -.04em; color: #fff; }
& .hro .t span { display: block; overflow: hidden; padding: 0 .01em .06em; } & .hro .t b { display: block; font-weight: 400; }
& .hro .sub { margin: 18px 0 0; color: rgb(255 255 255 / .55); }
& .hint { position: absolute; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 10px; color: rgb(255 255 255 / .55); margin: 0; pointer-events: none; }
& .tk { position: relative; width: 1px; height: 36px; overflow: hidden; background: rgb(255 255 255 / .15); }
& .tk b { position: absolute; left: 0; top: 0; width: 1px; height: 12px; background: #fff; animation: cpw-tk 1.6s ease-in-out infinite; }
@keyframes cpw-tk { from { transform: translateY(-12px); } to { transform: translateY(36px); } }
& .ln { position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: #f97316; z-index: 2; pointer-events: none; box-shadow: 0 0 12px rgb(249 115 22 / .9); }
& .dh { position: absolute; left: 50%; top: 24px; transform: translateX(-50%); z-index: 3; margin: 0; color: rgb(255 255 255 / .7); pointer-events: none; transition: opacity .6s; white-space: nowrap; }
@container (max-width: 560px) { & .cap { left: 20px; bottom: 82px; } & .ctl { left: 20px; right: 20px; justify-content: space-between; } }
@media (prefers-reduced-motion: reduce) { & .tk b { animation: none; transform: translateY(12px); } }
`.replace(/&/g, '.d-' + ID);

  var ART = [
    ['Halden', 'Architecture', 'radial-gradient(circle at 62% 55%, #fff3e6 0 2.6%, #f97316 3% 4.4%, rgb(249 115 22 / .35) 8%, transparent 30%), linear-gradient(180deg, transparent 55.6%, rgb(249 115 22 / .5) 55.8%, transparent 56.4%), linear-gradient(180deg, #2e2e2e 0%, #151515 55.8%, #050505 56%, #0c0c0c 100%)'],
    ['Northbound', 'Film', 'repeating-linear-gradient(100deg, rgb(255 255 255 / .1) 0 1px, transparent 1px 18px), radial-gradient(90% 80% at 20% 10%, #4a4a4a, #0b0b0b 70%)'],
    ['Solace', 'Identity', 'conic-gradient(from 200deg at 46% 62%, #070707, #f97316 10%, #070707 22%, #e8e8e8 30%, #070707 44%, #070707)'],
    ['Low Tide', 'Spatial', 'radial-gradient(120% 60% at 50% 110%, rgb(255 255 255 / .55), transparent 60%), repeating-radial-gradient(circle at 50% 120%, rgb(255 255 255 / .08) 0 2px, transparent 2px 22px), #050505'],
    ['Ember', 'Campaign', 'radial-gradient(30% 30% at 30% 40%, #fff, transparent 60%), radial-gradient(70% 60% at 70% 70%, #c2410c, transparent 70%), linear-gradient(135deg, #151515, #000)']
  ];
  var p3out = function (t) { return 1 - Math.pow(1 - t, 3); };
  var map = function (v, a, b, c, d) { return c + (d - c) * ((v - a) / (b - a)); };

  Lib.register(ID, {
    hint: 'Scroll the page to open the slit, then drag the image sideways (or use the arrows)',
    notes: [
      'Slit: <code>polygon(0 50%,100% 50%,100% 50%,0 50%)</code> → full rect; same 4 points both ends so it interpolates cleanly',
      'Scrubbed over <code>end: \'+=100%\'</code> with <code>scrub: 1</code> (about 1 s catch-up); title lifts <code>yPercent −120</code> to opacity .15',
      'Letters drop 150%, staggered from the centre with <code>amount .25</code>, ending at <code>+=90%</code>',
      'Slide wipe: <code>val += (mx − val)·.1</code>; neighbours clip with <code>inset()</code>, images counter-slide ±25% and settle <code>scale 1.2 → 1</code> while the outgoing slide zooms to 1.4',
      'Commit past 300 px with a .8 s power3.out tween to ±W, else spring back to 0'
    ],
    simplified: 'Plain rAF instead of GSAP/ScrollTrigger and @use-gesture; there is no wheel input (it would trap the page), and the slit runs at every width, where the source gates it to ≥ 1200 px.',
    css: css,
    mount: function (stage, ctx) {
      var clamp = ctx.clamp, reduced = ctx.reduced, N = ART.length;
      var word = 'CAMERA';
      stage.innerHTML = '<div class="lb" tabindex="0" role="group" aria-roledescription="carousel" aria-label="Case studies, use left and right arrow keys" data-cursor="Drag">' +
        ART.map(function (a, i) { return '<div class="sl" aria-hidden="true"><div class="img" style="background:' + a[2] + '"></div></div>'; }).join('') + '</div>' +
        '<div class="cap"><p class="label"></p><h4></h4></div>' +
        '<div class="ctl"><button type="button" class="pv" aria-label="Previous case">←</button><span class="n label"></span><button type="button" class="nx" aria-label="Next case">→</button></div>' +
        '<p class="dh label">← Drag →</p><i class="ln" aria-hidden="true"></i>' +
        '<div class="hro" aria-hidden="true"><div class="t">' + word.split('').map(function (c) { return '<span><b>' + c + '</b></span>'; }).join('') + '</div><p class="sub label">A hero that opens like a slit</p></div>' +
        '<p class="hint label" aria-hidden="true"><span>Scroll</span><i class="tk"><b></b></i></p>';
      var q = function (s) { return stage.querySelector(s); };
      var cap = q('.cap'), ctl = q('.ctl'), lb = q('.lb'), slides = stage.querySelectorAll('.sl'), imgs = stage.querySelectorAll('.sl .img'), hero = q('.hro'), title = q('.hro .t');
      var letters = stage.querySelectorAll('.hro .t b'), sub = q('.hro .sub'), hint = q('.hint'), line = q('.ln'), capL = q('.cap .label'), capH = q('.cap h4'), num = q('.n'), dh = q('.dh');
      var open = reduced ? 1 : 0, openT = reduced ? 1 : 0, idx = 0, val = 0, mx = 0, W = 1, drag = null, tween = null, dragged = false;
      var pad = function (n) { return String(n).padStart(2, '0'); };
      function caption() {
        capL.textContent = 'Case ' + pad(idx + 1) + ' · ' + ART[idx][1];
        capH.textContent = ART[idx][0]; num.textContent = pad(idx + 1) + ' / ' + pad(N);
        if (!reduced) capH.animate([{ opacity: 0, transform: 'translateY(30%)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 700, easing: 'cubic-bezier(.23,1,.32,1)' });
      }
      function at(o) { return (idx + o + N) % N; }
      function wipe() {
        var p = Math.min(1, Math.abs(val) / W), pi = at(-1), ni = at(1);
        slides.forEach(function (s, i) {
          var vis = i === idx || i === pi || i === ni;
          s.style.visibility = vis ? 'visible' : 'hidden';
          s.style.zIndex = i === idx ? 1 : 2;
        });
        slides[pi].style.clipPath = 'inset(0 ' + clamp(map(val, 0, W, 100, 0), 0, 100) + '% 0 0)';
        slides[ni].style.clipPath = 'inset(0 0 0 ' + clamp(map(val, 0, -W, 100, 0), 0, 100) + '%)';
        slides[idx].style.clipPath = 'none';
        var sc = map(p, 0, 1, 1.2, 1);
        imgs[pi].style.transform = 'translate(' + clamp(map(val, 0, W, -25, 0), -25, 0) + '%,0) scale(' + sc + ')';
        imgs[ni].style.transform = 'translate(' + clamp(map(val, 0, -W, 25, 0), 0, 25) + '%,0) scale(' + sc + ')';
        imgs[idx].style.transform = 'scale(' + map(p, 0, 1, 1, 1.4) + ')';
      }
      function commit(dir) {   // dir +1 = reveal previous (drag right), −1 = next
        if (tween) return;
        if (reduced) {
          idx = at(-dir); caption(); slides[idx].animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }); return;
        }
        tween = { from: mx, to: dir * W, t: 0, dir: dir };
      }
      function slit(dt) {
        open = reduced ? 1 : ctx.damp(open, openT, 4, dt);
        if (Math.abs(open - openT) < 1e-4) open = openT;
        var a = 50 - 50 * open, b = 50 + 50 * open;
        lb.style.clipPath = open >= .999 ? 'none' : 'polygon(0% ' + a + '%,100% ' + a + '%,100% ' + b + '%,0% ' + b + '%)';
        line.style.opacity = reduced ? 0 : (open < .02 ? 1 : Math.max(0, 1 - open * 4)) * .9;
        title.style.transform = 'translateY(' + (-120 * open) + '%)';
        hero.style.opacity = reduced ? 0 : 1 - .85 * open;
        hero.style.visibility = open > .99 ? 'hidden' : 'visible';
        sub.style.opacity = 1 - open * 2;
        hint.style.opacity = open > .01 ? 0 : 1;
        var lp = open / .9, nL = letters.length, c = (nL - 1) / 2;
        letters.forEach(function (l, i) {
          var off = Math.abs(i - c) / c * .25, k = clamp((lp - off) / .75, 0, 1);
          l.style.transform = 'translateY(' + (150 * k) + '%)'; l.style.opacity = 1 - .85 * k;
        });
        dh.style.opacity = open > .95 && !dragged ? 1 : 0;
        lb.style.pointerEvents = open > .9 ? 'auto' : 'none';
        var ui = clamp((open - .6) / .4, 0, 1);
        cap.style.opacity = ui; ctl.style.opacity = ui; ctl.style.visibility = ui > 0 ? 'visible' : 'hidden';
      }
      var lp = ctx.loop(function (dt) {
        W = stage.clientWidth || 1;
        slit(dt);
        if (tween) {
          tween.t = Math.min(1, tween.t + dt / .8);
          mx = tween.from + (tween.to - tween.from) * p3out(tween.t);
        }
        val += (mx - val) * (1 - Math.exp(-6.3 * dt));     // ≈ .1 per frame at 60 fps
        if (tween && tween.t >= 1 && Math.abs(val - mx) < W * .004) {
          idx = at(-tween.dir); val = mx = 0; tween = null; caption();
        }
        if (!tween && !drag && Math.abs(val - mx) < .05) val = mx;
        wipe();
      });
      lb.addEventListener('pointerdown', function (e) {
        if (tween) return;
        drag = { x: e.clientX, y: e.clientY, mx: mx, id: e.pointerId, on: false };
      });
      lb.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var dx = e.clientX - drag.x;
        if (!drag.on && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - drag.y)) { drag.on = true; try { lb.setPointerCapture(drag.id); } catch (err) {} lb.classList.add('drag'); dragged = true; }
        if (drag.on) mx = reduced ? 0 : clamp(drag.mx + dx, -W, W);
        if (drag.on && reduced) drag.dx = dx;
      });
      function up() {
        if (!drag) return;
        var was = drag; drag = null; lb.classList.remove('drag');
        if (!was.on) return;
        var moved = reduced ? (was.dx || 0) : mx, th = Math.min(300, W * .28);
        if (Math.abs(moved) > th) commit(moved > 0 ? 1 : -1); else mx = 0;
      }
      lb.addEventListener('pointerup', up); lb.addEventListener('pointercancel', up);
      lb.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); commit(1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); commit(-1); }
      });
      q('.pv').addEventListener('click', function () { commit(1); });
      q('.nx').addEventListener('click', function () { commit(-1); });
      caption(); wipe(); slit(0);
      return {
        start: function () { lp.start(); },
        stop: function () { lp.stop(); drag = null; if (tween) { idx = at(-tween.dir); tween = null; val = mx = 0; caption(); wipe(); } },
        scroll: function () {
          if (reduced) return;
          var r = stage.getBoundingClientRect(), vh = innerHeight;
          openT = clamp(((vh - r.top) / (vh + r.height) - .36) / .2, 0, 1);
        }
      };
    }
  });
})();
