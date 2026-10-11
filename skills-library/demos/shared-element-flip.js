/* shared-element-flip — card → detail with one travelling element (FLIP + radius/child correction), shuffle reorder, View Transitions engine */
(function () {
  var ID = 'shared-element-flip';
  var ITEMS = [
    { n: 'Ember', k: 'Table lamp', d: 'Hand-blown glass over a warm filament. The glow sits low, like coals.', s: [['Material', 'Opal glass'], ['Light', '2200 K'], ['Edition', '40']] },
    { n: 'Basalt', k: 'Stool', d: 'Cast from one block, then honed until the stone feels like felt.', s: [['Material', 'Basalt'], ['Height', '45 cm'], ['Edition', '12']] },
    { n: 'Halo', k: 'Wall mirror', d: 'A single ring of brushed steel that frames the room instead of you.', s: [['Material', 'Steel'], ['Diameter', '80 cm'], ['Edition', '24']] },
    { n: 'Drift', k: 'Vase', d: 'Thrown thin and fired twice, so the glaze pools toward the foot.', s: [['Material', 'Stoneware'], ['Height', '31 cm'], ['Edition', '60']] },
    { n: 'Quartz', k: 'Bowl', d: 'Turned from smoked quartz resin; light passes through the rim.', s: [['Material', 'Resin'], ['Width', '22 cm'], ['Edition', '90']] },
    { n: 'Noon', k: 'Pendant', d: 'An aluminium dome that throws a hard, clean circle on the table.', s: [['Material', 'Aluminium'], ['Width', '48 cm'], ['Edition', '30']] }
  ];
  var EASE_CSS = 'cubic-bezier(.4,0,.1,1)', DUR = 450;   // Motion defaultLayoutTransition
  function bezier(x1, y1, x2, y2) {
    function a(p, q) { return 1 - 3 * q + 3 * p; } function b(p, q) { return 3 * q - 6 * p; } function c(p) { return 3 * p; }
    function f(t, p, q) { return ((a(p, q) * t + b(p, q)) * t + c(p)) * t; }
    function d(t, p, q) { return 3 * a(p, q) * t * t + 2 * b(p, q) * t + c(p); }
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var t = x; for (var i = 0; i < 8; i++) { var s = d(t, x1, x2); if (Math.abs(s) < 1e-6) break; t -= (f(t, x1, x2) - x) / s; }
      return f(Math.min(1, Math.max(0, t)), y1, y2);
    };
  }
  var ease = bezier(.4, 0, .1, 1);

  Lib.register(ID, {
    hint: 'Open a card, close with Esc or ✕. Shuffle reorders. Switch the engine to View Transitions and compare the “01” chip.',
    notes: [
      'Motion’s default layout transition, read in source: <code>0.45 s</code>, <code>ease [0.4, 0, 0.1, 1]</code>; FLIP turns the size change into <code>translate + scale</code>',
      'Radius correction: write <code>r/scaleX px / r/scaleY px</code> every frame so the eye sees 14 → 20 px, never a stretched corner',
      'Children counter-scale <code>scale(1/sx, 1/sy)</code>, so the “01” chip stays crisp. View Transitions snapshot it as a bitmap, so it stretches there',
      'Shuffle measures every card, reorders the DOM, then plays <code>translate → none</code> with an 18 ms stagger, and retargets cleanly if you tap again mid-flight',
      'Detail is a dialog: focus goes to Close, the grid is <code>inert</code>, Esc closes and focus returns to the card. Reduced motion uses a 200 ms fade'
    ],
    simplified: 'The radius/child correction is a 30-line rAF version of Motion’s projection tree, without nested-parent scale or the layoutId crossfade. The View Transitions engine runs only in browsers that ship startViewTransition (otherwise FLIP).',
    css: [
      '.d-shared-element-flip { container-type: inline-size; background: radial-gradient(90% 70% at 50% 0%, #0d0c0b, #000 70%); }',
      '.d-shared-element-flip .sf-ui { position: absolute; inset: 0; display: flex; flex-direction: column; }',
      '.d-shared-element-flip .sf-bar { display: flex; align-items: center; gap: 10px; padding: 18px 22px 14px; }',
      '.d-shared-element-flip .sf-ttl0 { color: rgb(255 255 255 / .62); margin-right: auto; white-space: nowrap; }',
      '.d-shared-element-flip .sf-seg { display: inline-flex; padding: 3px; border-radius: 999px; background: rgb(255 255 255 / .06); border: 1px solid rgb(255 255 255 / .08); }',
      '.d-shared-element-flip .sf-seg button { padding: 7px 12px; border-radius: 999px; color: rgb(255 255 255 / .62); transition: background-color .25s, color .25s; }',
      '.d-shared-element-flip .sf-seg button[aria-checked=true] { background: #fff; color: #000; }',
      '.d-shared-element-flip .sf-seg button:disabled { opacity: .35; cursor: not-allowed; }',
      '.d-shared-element-flip .sf-btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .18); color: rgb(255 255 255 / .9); transition: border-color .2s, transform .15s cubic-bezier(.23,1,.32,1); }',
      '.d-shared-element-flip .sf-btn:hover { border-color: rgb(255 255 255 / .5); } .d-shared-element-flip .sf-btn:active { transform: scale(.97); }',
      '.d-shared-element-flip .sf-btn svg { width: 13px; height: 13px; }',
      '.d-shared-element-flip .sf-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); gap: 10px; padding: 0 22px 22px; transition: opacity .4s, filter .4s; }',
      '.d-shared-element-flip .sf-bar { transition: opacity .3s; }',
      '.d-shared-element-flip .dim .sf-grid { opacity: .16; filter: blur(3px); } .d-shared-element-flip .dim .sf-bar { opacity: 0; }',
      '.d-shared-element-flip .sf-card { position: relative; min-height: 0; border-radius: 14px; text-align: left; isolation: isolate; }',
      '.d-shared-element-flip .sf-art, .d-shared-element-flip .sf-dart { position: absolute; inset: 0; border-radius: 14px; overflow: hidden; background: #111; }',
      '.d-shared-element-flip .sf-art::after { content: ""; position: absolute; inset: 50% 0 0; background: linear-gradient(transparent, rgb(0 0 0 / .6)); pointer-events: none; }',
      '.d-shared-element-flip .sf-img { position: absolute; inset: 0; transition: transform .8s cubic-bezier(.23,1,.32,1); }',
      '.d-shared-element-flip .sf-card:hover .sf-img { transform: scale(1.05); }',
      '.d-shared-element-flip .sf-chip { position: absolute; left: 12px; top: 12px; padding: 4px 8px; border-radius: 999px; background: rgb(0 0 0 / .45); color: #fff; transform-origin: 0 0; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }',
      '.d-shared-element-flip .sf-ct { position: absolute; left: 14px; bottom: 12px; right: 14px; display: flex; flex-direction: column; gap: 2px; pointer-events: none; }',
      '.d-shared-element-flip .sf-name { display: inline-block; align-self: flex-start; font-family: Archivo, sans-serif; font-stretch: 125%; font-size: clamp(15px, 2.3cqw, 20px); line-height: 1.1; color: #fff; transform-origin: 0 0; }',
      '.d-shared-element-flip .sf-kind { color: rgb(255 255 255 / .62); }',
      '.d-shared-element-flip .i0 { background: radial-gradient(60% 55% at 50% 78%, #f97316 0%, rgb(249 115 22 / .35) 35%, transparent 70%), radial-gradient(30% 20% at 50% 70%, #ffd6b0, transparent 70%), linear-gradient(#141210, #070605); }',
      '.d-shared-element-flip .i1 { background: repeating-linear-gradient(0deg, rgb(255 255 255 / .035) 0 1px, transparent 1px 7px), radial-gradient(45% 40% at 50% 55%, #3a3836, #121110 70%), #0b0b0b; }',
      '.d-shared-element-flip .i1::after { content: ""; position: absolute; left: 33%; right: 33%; top: 38%; bottom: 15%; border-radius: 12px 12px 5px 5px; background: linear-gradient(90deg, #191817, #4d4946 42%, #23211f); box-shadow: 0 22px 30px rgb(0 0 0 / .7); }',
      '.d-shared-element-flip .i2 { background: radial-gradient(circle at 50% 50%, transparent 0 27%, rgb(255 255 255 / .85) 28% 29%, transparent 30.5%), radial-gradient(70% 70% at 50% 50%, #26231f, #090908 75%); }',
      '.d-shared-element-flip .i3 { background: linear-gradient(160deg, #3b3632 0%, #14110f 45%, #050505 100%), #111; }',
      '.d-shared-element-flip .i3::after { content: ""; position: absolute; left: 38%; right: 38%; top: 24%; bottom: 14%; border-radius: 40% 40% 18% 18%; background: linear-gradient(90deg, #2a2522, #6b625b 45%, #1c1916); }',
      '.d-shared-element-flip .i4 { background: conic-gradient(from 210deg at 50% 60%, #0d0d0d, #2b2622, #0d0d0d, #3a2a1e, #0d0d0d); }',
      '.d-shared-element-flip .i4::after { content: ""; position: absolute; left: 22%; right: 22%; top: 52%; height: 22%; border-radius: 0 0 999px 999px; background: linear-gradient(#8f857c, #2a2622); box-shadow: 0 0 40px rgb(249 115 22 / .25); }',
      '.d-shared-element-flip .i5 { background: radial-gradient(38% 30% at 50% 82%, rgb(255 244 230 / .9), transparent 70%), linear-gradient(#0c0c0c, #050505); }',
      '.d-shared-element-flip .i5::after { content: ""; position: absolute; left: 30%; right: 30%; top: 22%; height: 22%; border-radius: 999px 999px 0 0; background: linear-gradient(#d8d4cf, #6f6a64); }',
      '.d-shared-element-flip .sf-det { position: absolute; inset: 0; z-index: 5; }',
      '.d-shared-element-flip .sf-det[hidden] { display: none; }',
      '.d-shared-element-flip .sf-scrim { position: absolute; inset: 0; background: rgb(0 0 0 / .7); opacity: 0; transition: opacity .35s; }',
      '.d-shared-element-flip .open .sf-scrim { opacity: 1; }',
      '.d-shared-element-flip .sf-dart { inset: 58px auto 22px 22px; width: calc(56% - 22px); border-radius: 20px; transform-origin: 0 0; }',
      '.d-shared-element-flip .sf-dart .sf-chip { left: 16px; top: 16px; }',
      '.d-shared-element-flip .sf-body { position: absolute; left: calc(56% + 22px); right: 26px; top: 58px; bottom: 22px; display: flex; flex-direction: column; }',
      '.d-shared-element-flip .sf-body .sf-name { font-size: clamp(30px, 5.6cqw, 58px); line-height: 1; font-weight: 400; margin: 4px 0 0; }',
      '.d-shared-element-flip .sf-k { color: #f97316; margin: 0; }',
      '.d-shared-element-flip .sf-p { font-size: 14px; line-height: 1.6; color: rgb(255 255 255 / .75); margin: 16px 0 14px; max-width: 34ch; }',
      '.d-shared-element-flip .sf-row { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-top: 1px solid rgb(255 255 255 / .1); }',
      '.d-shared-element-flip .sf-row:last-child { border-bottom: 1px solid rgb(255 255 255 / .1); }',
      '.d-shared-element-flip .sf-row dt { color: rgb(255 255 255 / .58); } .d-shared-element-flip .sf-row dd { margin: 0; font-size: 13px; color: rgb(255 255 255 / .9); }',
      '.d-shared-element-flip dl { margin: 0; }',
      '.d-shared-element-flip .sf-in { opacity: 0; transform: translateY(10px); }',
      '.d-shared-element-flip .open .sf-in { opacity: 1; transform: none; transition: opacity .5s cubic-bezier(.23,1,.32,1), transform .5s cubic-bezier(.23,1,.32,1); }',
      '.d-shared-element-flip .closing .sf-in { opacity: 0; transform: none; transition: opacity .15s; }',
      '.d-shared-element-flip .sf-close { position: absolute; right: 16px; top: 12px; z-index: 2; padding: 10px 14px; border-radius: 999px; color: rgb(255 255 255 / .8); opacity: 0; transition: opacity .3s, color .2s; }',
      '.d-shared-element-flip .open .sf-close { opacity: 1; } .d-shared-element-flip .sf-close:hover { color: #fff; }',
      '.d-shared-element-flip .sf-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }',
      '@container (max-width: 560px) {',
      '  .d-shared-element-flip .sf-ttl0 { display: none; } .d-shared-element-flip .sf-bar { padding: 16px 16px 12px; justify-content: space-between; }',
      '  .d-shared-element-flip .sf-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); padding: 0 16px 16px; gap: 8px; }',
      '  .d-shared-element-flip .sf-dart { inset: 56px 16px auto 16px; width: auto; height: 38%; }',
      '  .d-shared-element-flip .sf-body { left: 18px; right: 18px; top: calc(38% + 72px); bottom: 14px; }',
      '  .d-shared-element-flip .sf-p { margin: 8px 0 12px; font-size: 13px; line-height: 1.5; }',
      '  .d-shared-element-flip dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 12px; }',
      '  .d-shared-element-flip .sf-row, .d-shared-element-flip .sf-row:last-child { flex-direction: column; gap: 4px; padding: 9px 0 0; border-bottom: 0; }',
      '  .d-shared-element-flip .sf-row dd { font-size: 12.5px; }',
      '}',
      '@media (prefers-reduced-motion: reduce) { .d-shared-element-flip .sf-in, .d-shared-element-flip .open .sf-in { transform: none; transition: opacity .2s; } .d-shared-element-flip .sf-det { transition: opacity .2s; } .d-shared-element-flip .sf-card:hover .sf-img { transform: none; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var hasVT = typeof document.startViewTransition === 'function';
      var pad = function (i) { return (i < 9 ? '0' : '') + (i + 1); };
      stage.innerHTML =
        '<div class="sf-ui"><div class="sf-bar">' +
        '<span class="label sf-ttl0">Objects · 06</span>' +
        '<div class="sf-seg label" role="radiogroup" aria-label="Animation engine">' +
        '<button type="button" role="radio" aria-checked="true" data-e="flip">FLIP</button>' +
        '<button type="button" role="radio" aria-checked="false" tabindex="-1" data-e="vt"' + (hasVT ? '' : ' disabled title="Not supported in this browser"') + '>View T.</button></div>' +
        '<button type="button" class="sf-btn label sf-shuf"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M1 4h3.5c2 0 3 1 4 3.5S10.5 12 12.5 12H15M12.5 10 15 12l-2.5 2M1 12h3.5c1 0 1.7-.3 2.3-.9M9.2 4.9c.6-.6 1.3-.9 2.3-.9H15M12.5 2 15 4l-2.5 2"/></svg>Shuffle</button>' +
        '</div><div class="sf-grid">' +
        ITEMS.map(function (it, i) {
          return '<button type="button" class="sf-card" data-i="' + i + '" aria-haspopup="dialog">' +
            '<span class="sf-art"><span class="sf-img i' + i + '"></span><span class="sf-chip label" aria-hidden="true">' + pad(i) + '</span></span>' +
            '<span class="sf-ct"><span class="sf-name">' + it.n + '</span><span class="sf-kind label">' + it.k + '</span></span></button>';
        }).join('') +
        '</div></div>' +
        '<div class="sf-det" hidden><div class="sf-scrim"></div>' +
        '<div role="dialog" aria-modal="true" aria-labelledby="sf-h">' +
        '<button type="button" class="sf-close label">Close ✕</button>' +
        '<div class="sf-dart"><span class="sf-img"></span><span class="sf-chip label" aria-hidden="true"></span></div>' +
        '<div class="sf-body"><p class="sf-k label sf-in"></p><h4 class="sf-name" id="sf-h"></h4><p class="sf-p sf-in"></p><dl class="sf-in"></dl></div>' +
        '</div></div><p class="sf-live" aria-live="polite"></p>';

      var ui = stage.querySelector('.sf-ui'), grid = stage.querySelector('.sf-grid'), bar = stage.querySelector('.sf-bar'), det = stage.querySelector('.sf-det');
      var dart = det.querySelector('.sf-dart'), dimg = dart.querySelector('.sf-img'), dchip = dart.querySelector('.sf-chip');
      var dname = det.querySelector('.sf-name'), dk = det.querySelector('.sf-k'), dp = det.querySelector('.sf-p'), ddl = det.querySelector('dl');
      var closeBtn = det.querySelector('.sf-close'), live = stage.querySelector('.sf-live');
      var engBtns = Array.prototype.slice.call(stage.querySelectorAll('.sf-seg button'));
      var engine = 'flip', openCard = null, busy = false, rafs = [], anims = [], timers = [], vtStyle = null;

      function setEngine(b) {
        if (b.disabled) return;
        engine = b.dataset.e;
        engBtns.forEach(function (x) { var on = x === b; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
      }
      engBtns.forEach(function (b) {
        b.addEventListener('click', function () { setEngine(b); });
        b.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault(); var o = engBtns[engBtns[0] === b ? 1 : 0]; if (!o.disabled) { setEngine(o); o.focus(); }
        });
      });

      /* ---- FLIP morph with radius + child correction ---- */
      function morph(node, from, to, o) {
        var sx = from.width / to.width, sy = from.height / to.height;
        if (o.uniform) sx = sy = from.height / to.height;
        var dx = from.left - to.left, dy = from.top - to.top, t0 = performance.now(), slot = rafs.length;
        function apply(e) {
          var k = 1 - e, ax = 1 + (sx - 1) * k, ay = 1 + (sy - 1) * k;
          node.style.transform = 'translate(' + dx * k + 'px,' + dy * k + 'px) scale(' + ax + ',' + ay + ')';
          if (o.r0 != null) { var r = o.r0 + (o.r1 - o.r0) * e; node.style.borderRadius = (r / ax) + 'px / ' + (r / ay) + 'px'; }
          (o.kids || []).forEach(function (c) { c.style.transform = 'scale(' + 1 / ax + ',' + 1 / ay + ')'; });
        }
        function frame(now) {
          var p = Math.min((now - t0) / DUR, 1);
          apply(o.reverse ? 1 - ease(p) : ease(p));
          if (p < 1) rafs[slot] = requestAnimationFrame(frame); else { rafs[slot] = 0; node._finish = null; if (o.done) o.done(); }
        }
        node._finish = function () { apply(o.reverse ? 0 : 1); if (o.done) o.done(); };
        apply(o.reverse ? 1 : 0);
        rafs[slot] = requestAnimationFrame(frame);
      }
      function clearMorph(n) { n.style.transform = ''; n.style.borderRadius = ''; }

      function fill(i) {
        var it = ITEMS[i];
        dimg.className = 'sf-img i' + i; dchip.textContent = pad(i);
        dk.textContent = 'Nº ' + pad(i) + ' — ' + it.k; dname.textContent = it.n; dp.textContent = it.d;
        ddl.innerHTML = it.s.map(function (r) { return '<div class="sf-row"><dt class="label">' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('');
      }
      function onKey(e) {
        if (e.key === 'Escape' && openCard) { e.preventDefault(); close(); }
        else if (e.key === 'Tab' && openCard) { e.preventDefault(); closeBtn.focus(); }   // single control: trap
      }
      function staggerIn() {
        det.querySelectorAll('.sf-in').forEach(function (n, j) { n.style.transitionDelay = ctx.reduced ? '0s' : (0.12 + j * 0.05) + 's'; });
      }

      function open(card) {
        if (busy || openCard) return;
        var i = +card.dataset.i; openCard = card; busy = true;
        var art = card.querySelector('.sf-art'), nm = card.querySelector('.sf-name');
        fill(i); staggerIn();
        grid.inert = true; bar.inert = true; stage.addEventListener('keydown', onKey);
        if (ctx.reduced) {
          det.hidden = false; card.style.visibility = 'hidden'; det.style.opacity = 0; det.offsetWidth;
          det.style.transition = 'opacity .2s'; det.style.opacity = 1; det.classList.add('open'); ui.classList.add('dim');
          busy = false; closeBtn.focus({ preventScroll: true }); return;
        }
        if (engine === 'vt') return vtSwap(art, nm, dart, dname, function () {
          card.style.visibility = 'hidden'; det.hidden = false; det.offsetWidth; det.classList.add('open'); ui.classList.add('dim');
        }, 14, 20, function () { busy = false; closeBtn.focus({ preventScroll: true }); });
        var a = art.getBoundingClientRect(), n = nm.getBoundingClientRect();
        det.hidden = false; det.offsetWidth;
        var b = dart.getBoundingClientRect(), m = dname.getBoundingClientRect();
        card.style.visibility = 'hidden';
        det.classList.add('open'); ui.classList.add('dim');
        morph(dname, n, m, { uniform: true });
        morph(dart, a, b, { r0: 14, r1: 20, kids: [dchip], done: function () { clearMorph(dart); clearMorph(dname); dchip.style.transform = ''; busy = false; } });
        closeBtn.focus({ preventScroll: true });
      }
      function close() {
        if (!openCard || busy) return;
        var card = openCard, art = card.querySelector('.sf-art'), nm = card.querySelector('.sf-name');
        busy = true; stage.removeEventListener('keydown', onKey);
        function finish() {
          dart.style.visibility = dname.style.visibility = '';
          det.hidden = true; det.classList.remove('open', 'closing'); det.style.opacity = ''; det.style.transition = '';
          clearMorph(dart); clearMorph(dname); dchip.style.transform = '';
          card.style.visibility = ''; grid.inert = false; bar.inert = false; openCard = null; busy = false;
          card.focus({ preventScroll: true });
        }
        ui.classList.remove('dim');
        if (ctx.reduced) { det.style.opacity = 0; timers.push(setTimeout(finish, 200)); return; }
        det.classList.add('closing'); det.classList.remove('open');
        if (engine === 'vt') return vtSwap(dart, dname, art, nm, function () {
          dart.style.visibility = dname.style.visibility = 'hidden'; card.style.visibility = '';   // scrim keeps fading live
        }, 20, 14, finish);
        var a = art.getBoundingClientRect(), n = nm.getBoundingClientRect();
        var b = dart.getBoundingClientRect(), m = dname.getBoundingClientRect();
        morph(dname, n, m, { uniform: true, reverse: true });
        morph(dart, a, b, { r0: 14, r1: 20, kids: [dchip], reverse: true, done: finish });
      }

      /* ---- View Transitions engine: names just-in-time, root not captured, crop + radius on the group ---- */
      function vtCSS() {
        vtStyle = document.createElement('style');
        vtStyle.textContent = ':root{view-transition-name:none}' +
          '::view-transition-group(*){animation-duration:' + DUR + 'ms;animation-timing-function:' + EASE_CSS + '}' +
          '::view-transition-group(sf-art){overflow:clip}' +
          '::view-transition-old(sf-art),::view-transition-new(sf-art){width:100%;height:100%;object-fit:cover}';
        document.head.appendChild(vtStyle);
      }
      function vtDone() { if (vtStyle) { vtStyle.remove(); vtStyle = null; } }
      function vtSwap(fromArt, fromName, toArt, toName, update, r0, r1, done) {
        vtCSS();
        fromArt.style.viewTransitionName = 'sf-art'; fromName.style.viewTransitionName = 'sf-ttl';
        var t;
        try {
          t = document.startViewTransition(function () {
            fromArt.style.viewTransitionName = ''; fromName.style.viewTransitionName = '';
            update();
            toArt.style.viewTransitionName = 'sf-art'; toName.style.viewTransitionName = 'sf-ttl';
          });
        } catch (e) { fromArt.style.viewTransitionName = fromName.style.viewTransitionName = ''; update(); vtDone(); done(); return; }
        t.ready.then(function () {
          document.documentElement.animate({ borderRadius: [r0 + 'px', r1 + 'px'] }, { duration: DUR, easing: EASE_CSS, pseudoElement: '::view-transition-group(sf-art)' });
        }).catch(function () {});
        t.finished.catch(function () {}).then(function () { toArt.style.viewTransitionName = ''; toName.style.viewTransitionName = ''; vtDone(); done(); });
      }

      /* ---- shuffle (FLIP list reorder, or VT with one name per card) ---- */
      function cards() { return Array.prototype.slice.call(grid.children); }
      function shuffle() {
        if (busy || openCard) return;
        var list = cards(), order = list.slice(), focused = document.activeElement;
        do { for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; } }
        while (order.every(function (c, k) { return c === list[k]; }));
        function reorder() { order.forEach(function (c) { grid.appendChild(c); }); if (focused && list.indexOf(focused) >= 0) focused.focus({ preventScroll: true }); }
        live.textContent = 'Shuffled: ' + order.map(function (c) { return ITEMS[c.dataset.i].n; }).join(', ');
        if (ctx.reduced) { reorder(); grid.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 200 }); return; }
        if (engine === 'vt') {
          busy = true; vtCSS();
          list.forEach(function (c) { c.style.viewTransitionName = 'sf-c' + c.dataset.i; });
          var t = document.startViewTransition(reorder);
          t.finished.catch(function () {}).then(function () { list.forEach(function (c) { c.style.viewTransitionName = ''; }); vtDone(); busy = false; });
          return;
        }
        var first = new Map(); list.forEach(function (c) { first.set(c, c.getBoundingClientRect()); });  // includes in-flight transforms
        anims.forEach(function (a) { a.cancel(); }); anims = [];
        reorder();
        cards().forEach(function (c, k) {
          var a = first.get(c), b = c.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
          if (Math.abs(dx) < .5 && Math.abs(dy) < .5) return;
          anims.push(c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
            { duration: DUR, easing: EASE_CSS, delay: k * 18, fill: 'backwards' }));
        });
      }

      grid.addEventListener('click', function (e) { var c = e.target.closest('.sf-card'); if (c) open(c); });
      stage.querySelector('.sf-shuf').addEventListener('click', shuffle);
      closeBtn.addEventListener('click', close);
      det.querySelector('.sf-scrim').addEventListener('click', close);

      function settle() {   // jump every running animation to its end state
        rafs.forEach(function (r) { if (r) cancelAnimationFrame(r); }); rafs = [];
        [dart, dname].forEach(function (n) { if (n._finish) { var f = n._finish; n._finish = null; f(); } });
        anims.forEach(function (a) { a.cancel(); }); anims = [];
        timers.forEach(clearTimeout); timers = [];
        vtDone();
      }
      return {
        start: function () {},
        stop: function () {
          settle();
          if (openCard) { busy = false; var c = openCard; det.hidden = true; det.classList.remove('open', 'closing'); det.style.opacity = '';
            c.style.visibility = ''; ui.classList.remove('dim'); grid.inert = false; bar.inert = false; openCard = null; stage.removeEventListener('keydown', onKey); }
          busy = false;
        }
      };
    }
  });
})();
