/* interruptible-css-transitions — the same toast stack driven by @keyframes (jumps) vs transitions (retargets mid-flight) */
(function () {
  var ID = 'interruptible-css-transitions';
  var P = '.d-interruptible-css-transitions ';
  var WORDS = ['Brief saved', 'Invite sent', 'Export ready', 'Comment added', 'Link copied', 'File synced', 'Draft restored', 'Reminder set'];

  Lib.register(ID, {
    hint: 'Press “Add 3 fast” (or spam “Add toast”). The left stack jumps into place; the right one glides, even when you interrupt it.',
    notes: [
      'Keyframes can’t change their end value mid-run; a transition retargets from wherever the element is now',
      'Enter without keyframes: insert with <code>data-mounted="false"</code>, flip it after the first frame (Sonner), or use <code>@starting-style</code>',
      'Keep keyframes for one-shots that end in removal (Sonner’s 200 ms swipe-out) and loops (spinners)',
      'During a drag set <code>transition:none</code> and write <code>transform</code> on the element; restore the transition with the release target',
      'Timing by purpose: UI ease-out under 300 ms, Sonner 400 ms <code>ease</code>, Vaul .5 s <code>cubic-bezier(.32,.72,0,1)</code>; reduced motion = opacity only'
    ],
    simplified: 'Both lanes use the same 400 ms ease and stack math, so the only difference is the engine. Drag hand-off is shown in the drag-sheet-drawer and stacked-toasts demos.',
    css: [
      '.d-interruptible-css-transitions { container-type: inline-size; display: flex; flex-direction: column; }',
      P + '.it-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 20px; padding: clamp(18px, 3.4cqw, 30px) clamp(18px, 3.4cqw, 30px) 0; }',
      P + '.it-head .label { margin: 0; color: #f97316; } ' + P + '.it-btns { display: flex; flex-wrap: wrap; gap: 8px; }',
      P + '.it-btns button { padding: 10px 16px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .16); background: rgb(255 255 255 / .03); color: rgb(255 255 255 / .85); font-size: 13px; transition: border-color .2s, background .2s, transform .16s cubic-bezier(.23,1,.32,1); }',
      P + '.it-btns button:hover { border-color: rgb(255 255 255 / .5); color: #fff; } ' + P + '.it-btns button:active { transform: scale(.97); } ' + P + '.it-btns .it-hot, ' + P + '.it-btns .it-hot:hover { background: #fff; color: #000; border-color: #fff; font-weight: 500; }',
      P + '.it-lanes { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: clamp(10px, 2cqw, 18px); padding: clamp(14px, 2.6cqw, 22px) clamp(18px, 3.4cqw, 30px) clamp(18px, 3.4cqw, 30px); min-height: 0; }',
      P + '.it-lane { position: relative; overflow: hidden; border-radius: 12px; border: 1px solid rgb(255 255 255 / .1); background: radial-gradient(rgb(255 255 255 / .06) 1px, transparent 1.5px) 0 0 / 18px 18px, #060606; }',
      P + '.it-lane.it-tr { border-color: rgb(249 115 22 / .35); }',
      P + '.it-cap { position: absolute; left: 16px; top: 14px; right: 16px; margin: 0; } ' + P + '.it-cap b { display: block; color: #fff; font-weight: 500; margin-bottom: 4px; text-transform: none; letter-spacing: 0; font-size: 13px; font-family: "Geist Mono", ui-monospace, monospace; } ' + P + '.it-cap span { color: rgb(255 255 255 / .45); text-transform: none; letter-spacing: 0; font-size: 12px; font-family: "Geist Mono", ui-monospace, monospace; }',
      P + '.it-tr .it-cap b { color: #f97316; }',
      P + '.it-g { position: absolute; left: 16px; right: 16px; top: 62px; pointer-events: none; } ' + P + '.it-gl { position: absolute; right: 16px; top: 14px; margin: 0; color: rgb(255 255 255 / .35); }',
      P + '.it-t { position: absolute; left: 16px; right: 16px; bottom: 16px; z-index: var(--z); transform: translateY(calc(var(--i) * -14px)) scale(calc(1 - var(--i) * .05)); }',
      P + '.it-t[data-visible=false] { opacity: 0; }',
      P + '.it-card { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 8px; background: #0f0f0f; border: 1px solid rgb(255 255 255 / .13); box-shadow: 0 10px 28px -8px rgb(0 0 0 / .9); font-size: 13px; color: rgb(255 255 255 / .9); }',
      P + '.it-card i { width: 6px; height: 6px; border-radius: 50%; background: rgb(255 255 255 / .5); flex: none; } ' + P + '.it-tr .it-card i { background: #f97316; }',
      P + '.it-card em { margin-left: auto; font-style: normal; color: rgb(255 255 255 / .4); font-family: "Geist Mono", ui-monospace, monospace; font-size: 11px; }',
      /* keyframes lane: position changes instantly, only the entrance is animated */
      P + '.it-kf .it-card { animation: it-enter .4s ease both; }',
      '@keyframes it-enter { from { transform: translateY(100%); opacity: 0; } to { transform: none; opacity: 1; } }',
      /* transitions lane: one transition covers enter AND every later re-stack */
      P + '.it-tr .it-t { transition: transform .4s ease, opacity .4s ease; }',
      P + '.it-tr .it-t[data-mounted=false] { transform: translateY(100%); opacity: 0; }',
      P + '.it-rm { margin: -6px 0 0; padding: 0 16px 14px; color: rgb(255 255 255 / .5); font-size: 12px; text-align: center; }',
      '@container (max-width: 560px) { ' + P + '.it-lanes { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; } ' + P + '.it-head .label { width: 100%; } }',
      '@media (prefers-reduced-motion: reduce) { ' + P + '.it-kf .it-card { animation: it-fade .15s ease both; } ' + P + '.it-tr .it-t { transition: opacity .15s ease; } ' + P + '.it-tr .it-t[data-mounted=false] { transform: translateY(calc(var(--i) * -14px)); } }',
      '@keyframes it-fade { from { opacity: 0; } to { opacity: 1; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      stage.innerHTML =
        '<div class="it-head"><p class="label">[ Same stack, two engines ]</p><div class="it-btns">' +
        '<button type="button" class="it-hot" data-n="3">Add 3 fast</button><button type="button" data-n="1">Add toast</button><button type="button" data-n="0">Clear</button></div></div>' +
        '<div class="it-lanes">' +
        '<div class="it-lane it-kf" role="group" aria-label="Keyframes"><p class="it-cap label"><b>@keyframes</b><span>enter animated · position jumps</span></p><p class="it-gl label" aria-hidden="true">y · last 1.5 s</p><canvas class="it-g" aria-hidden="true"></canvas></div>' +
        '<div class="it-lane it-tr" role="group" aria-label="Transitions"><p class="it-cap label"><b>transition</b><span>transform .4s ease · retargets</span></p><p class="it-gl label" aria-hidden="true">y · last 1.5 s</p><canvas class="it-g" aria-hidden="true"></canvas></div>' +
        '</div>' + (ctx.reduced ? '<p class="it-rm">Reduced motion is on: both lanes only fade, so the difference is muted.</p>' : '');
      var lanes = [stage.querySelector('.it-kf'), stage.querySelector('.it-tr')].map(function (el) { return { el: el, items: [], tr: el.classList.contains('it-tr'), cv: el.querySelector('.it-g'), lab: el.querySelector('.it-gl'), tracks: new Map() }; });
      var n = 0, timers = [], played = false;
      function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); }

      function layout(L) {
        L.items.forEach(function (t, i) {
          t.style.setProperty('--i', i); t.style.setProperty('--z', 10 - i);
          t.dataset.visible = i < 3;
        });
        while (L.items.length > 5) L.items.pop().remove();
      }
      function add() {
        n++;
        var label = WORDS[(n - 1) % WORDS.length], num = (n < 10 ? '0' : '') + n;
        lanes.forEach(function (L) {
          var t = document.createElement('div');
          t.className = 'it-t';
          t.innerHTML = '<div class="it-card"><i aria-hidden="true"></i>' + label + '<em>Nº ' + num + '</em></div>';
          if (L.tr) t.dataset.mounted = 'false';
          L.items.unshift(t); L.el.appendChild(t); layout(L);
          if (L.tr) requestAnimationFrame(function () { requestAnimationFrame(function () { t.dataset.mounted = 'true'; }); });
        });
      }
      function burst(k) { for (var i = 0; i < k; i++) later(add, i * 90); }
      function clear() { timers.forEach(clearTimeout); timers = []; lanes.forEach(function (L) { L.items.forEach(function (t) { t.remove(); }); L.items = []; }); }
      stage.querySelectorAll('.it-btns button').forEach(function (b) {
        b.addEventListener('click', function () { var k = +b.dataset.n; if (!k) clear(); else burst(k); });
      });
      function intro() { later(add, 250); later(function () { burst(3); }, 1300); }

      // live trace: each card's top edge over the last 1.5 s (steps = jumps, curves = retargeted transitions)
      var WIN = 1.5;
      var loop = ctx.loop(function (dt, t) {
        lanes.forEach(function (L) {
          var lr = L.el.getBoundingClientRect(), gh = lr.height - 62 - 130;
          L.cv.style.display = L.lab.style.display = gh < 40 ? 'none' : '';
          if (gh < 40) return;
          L.cv.style.height = gh + 'px';
          var f = ctx.fitCanvas(L.cv, L.cv), g = L.cv.getContext('2d');
          L.items.slice(0, 3).forEach(function (el) {
            var tr = L.tracks.get(el); if (!tr) { tr = []; L.tracks.set(el, tr); }
            tr.push([t, el.firstChild.getBoundingClientRect().top - lr.top]);                   // the card, incl. its own keyframe
          });
          g.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); g.clearRect(0, 0, f.w, f.h);
          g.strokeStyle = 'rgb(255 255 255 / .08)'; g.lineWidth = 1;
          for (var k = 1; k < 4; k++) { g.beginPath(); g.moveTo(0, Math.round(f.h * k / 4) + .5); g.lineTo(f.w, Math.round(f.h * k / 4) + .5); g.stroke(); }
          var lo = lr.height - 140, hi = lr.height;                               // card tops live in the bottom ~140 px
          L.tracks.forEach(function (tr, el) {
            while (tr.length && t - tr[0][0] > WIN) tr.shift();
            if (!tr.length) { L.tracks.delete(el); return; }
            g.beginPath();
            tr.forEach(function (s, i) {
              var x = f.w - (t - s[0]) / WIN * f.w, yv = ctx.clamp((s[1] - lo) / (hi - lo), 0, 1) * (f.h - 4) + 2;
              if (i) g.lineTo(x, yv); else g.moveTo(x, yv);
            });
            g.strokeStyle = L.tr ? '#f97316' : 'rgb(255 255 255 / .7)'; g.lineWidth = 1.5; g.stroke();
          });
        });
      });

      return {
        start: function () { loop.start(); if (!played) { played = true; intro(); } },
        stop: function () { loop.stop(); timers.forEach(clearTimeout); timers = []; },
        replay: function () { clear(); intro(); }
      };
    }
  });
})();
