/* stacked-toasts — Sonner-pattern toaster: 14 px / 5 % stack, hover-expand on measured heights, velocity swipe, paused timers */
(function () {
  var ID = 'stacked-toasts';
  var GAP = 14, VISIBLE = 3, LIFE = 4000, SWIPE = 45, VEL = 0.11, UNMOUNT = 200;
  var P = '.d-stacked-toasts ';
  var SVG = function (d, c) { return '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="' + c + '"><path fill-rule="evenodd" clip-rule="evenodd" d="' + d + '"/></svg>'; };
  var ICON = {
    success: SVG('M10 18a8 8 0 100-16 8 8 0 000 16zm3.86-9.86a.75.75 0 00-1.22-.88l-3.24 4.5-1.62-1.62a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.1l3.75-5.2z', 'rgb(255 255 255 / .9)'),
    error: SVG('M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z', '#f97316')
  };
  var KIND = {
    default: { title: 'Brief saved to drafts', desc: 'Edited just now' },
    success: { type: 'success', title: 'Booking confirmed', desc: 'Thu 14 Nov, 10:00 · Studio B' },
    error: { type: 'error', title: 'Upload failed', desc: 'Over 50 MB. Try a lighter export.' },
    promise: { type: 'loading', title: 'Exporting case study…', promise: { type: 'success', title: 'Case study exported', desc: '24 pages · 18.2 MB' } },
    action: { title: 'Project archived', action: 'Undo' },
    restored: { type: 'success', title: 'Project restored', desc: 'Back in Active work' }
  };

  Lib.register(ID, {
    hint: 'Fire a few toasts, hover the stack to fan it out, swipe a toast down or right (or flick it). Alt+T focuses the stack, Esc collapses.',
    notes: [
      'Collapsed: each older toast <code>translateY(−14px·i) scale(1 − .05·i)</code>, clamped to the front toast’s height; 3 visible',
      'Expanded on hover: <code>offset = i·14 + Σ heights in front</code>, from heights measured on mount and re-measured when content changes',
      'All motion is <code>transition: transform/opacity/height 400ms</code> (default <code>ease</code>), so stacking is interruptible; only the 200 ms swipe-out is a keyframe',
      'Dismiss if <code>|Δ| ≥ 45px</code> or <code>|Δ|/ms &gt; 0.11</code> in an allowed direction; wrong-way drag is damped by <code>1/(1.5 + |Δ|/20)</code>',
      '4 s timers pause while hovered, pressed, or when the tab is hidden; wrapper is <code>aria-live="polite"</code>, Alt+T focuses the stack'
    ],
    simplified: 'One position (bottom-right; full width on small stages), no rich colours or theme switching, and the toast() observer API is a local function.',
    css: [
      '.d-stacked-toasts { container-type: inline-size; }',
      P + '.st-bg { position: absolute; inset: 0; background: radial-gradient(55% 60% at 88% 100%, rgb(249 115 22 / .12), transparent 70%), radial-gradient(rgb(255 255 255 / .07) 1px, transparent 1.5px) 0 0 / 22px 22px; -webkit-mask-image: linear-gradient(115deg, transparent 10%, #000 70%); mask-image: linear-gradient(115deg, transparent 10%, #000 70%); }',
      P + '.st-panel { position: absolute; left: clamp(20px, 4cqw, 40px); top: clamp(20px, 4cqw, 40px); width: min(46cqw, calc(100cqw - 356px - 84px)); }',
      P + '.st-panel .label.accent { margin: 0 0 12px; }',
      P + '.st-panel h4 { margin: 0 0 12px; font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: clamp(26px, 4.4cqw, 48px); line-height: 1; letter-spacing: -.02em; color: #fff; }',
      P + '.st-sub { margin: 0 0 22px; font-size: 14px; line-height: 1.5; color: rgb(255 255 255 / .55); max-width: 34ch; }',
      P + '.st-btns { display: flex; flex-wrap: wrap; gap: 8px; }',
      P + '.st-btns button { padding: 10px 16px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .16); background: rgb(255 255 255 / .03); color: rgb(255 255 255 / .85); font-size: 13px; transition: border-color .2s, background .2s, transform .16s cubic-bezier(.23,1,.32,1); }',
      P + '.st-btns button:hover { border-color: rgb(255 255 255 / .5); background: rgb(255 255 255 / .07); color: #fff; } ' + P + '.st-btns button:active { transform: scale(.97); }',
      P + '.st-status { margin: 18px 0 0; color: rgb(255 255 255 / .45); display: flex; align-items: center; gap: 8px; } ' + P + '.st-status b { font-weight: 500; color: rgb(255 255 255 / .9); }',
      P + '.st-status i { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px rgb(34 197 94 / .8); } ' + P + '.st-status i.off { background: #f97316; box-shadow: 0 0 8px rgb(249 115 22 / .8); }',
      P + '.st-region { position: absolute; right: 24px; bottom: 24px; width: min(356px, calc(100% - 48px)); z-index: 2; }',
      P + '.st-list { list-style: none; margin: 0; padding: 0; position: relative; outline: none; }',
      P + '.st-toast { --y: translateY(100%); position: absolute; right: 0; bottom: 0; width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 10px; padding: 16px; border-radius: 8px; background: #0b0b0b; border: 1px solid rgb(255 255 255 / .12); color: #fff; font-size: 13px; box-shadow: 0 12px 32px -8px rgb(0 0 0 / .8), inset 0 1px 0 rgb(255 255 255 / .04); z-index: var(--z); opacity: 0; transform: var(--y); touch-action: none; outline: none; overflow-wrap: anywhere; cursor: grab; transition: transform .4s, opacity .4s, height .4s, box-shadow .2s; }',
      P + '.st-toast:focus-visible { box-shadow: 0 12px 32px -8px rgb(0 0 0 / .8), 0 0 0 2px rgb(249 115 22 / .7); }',
      P + '.st-toast > * { transition: opacity .4s; }',
      P + '.st-close { position: absolute; left: 0; top: 0; width: 20px; height: 20px; padding: 0; transform: translate(-35%, -35%); display: grid; place-items: center; border-radius: 50%; border: 1px solid rgb(255 255 255 / .2); background: #0b0b0b; color: rgb(255 255 255 / .8); opacity: 0; z-index: 1; transition: opacity .1s, background .2s, border-color .2s; }',
      P + '.st-close::before { content: ""; position: absolute; inset: -10px; } ' + P + '.st-close:hover { background: #1f1f1f; border-color: rgb(255 255 255 / .35); }',
      P + '.st-toast:hover .st-close, ' + P + '.st-toast:focus-within .st-close { opacity: 1; } @media (hover: none) { ' + P + '.st-close { opacity: 1; } }',
      P + '.st-toast[data-mounted=true] { --y: translateY(0); opacity: 1; }',
      P + '.st-toast[data-expanded=false][data-front=false] { --y: translateY(calc(var(--i) * -14px)) scale(calc(1 - var(--i) * .05)); height: var(--front-h); }',
      P + '.st-toast[data-expanded=false][data-front=false] > * { opacity: 0; }',
      P + '.st-toast[data-visible=false] { opacity: 0; pointer-events: none; }',
      P + '.st-toast[data-mounted=true][data-expanded=true] { --y: translateY(calc(-1 * var(--offset))); height: var(--h); }',
      P + '.st-toast[data-expanded=true]::after { content: ""; position: absolute; left: 0; bottom: 100%; width: 100%; height: 15px; }',
      P + '.st-toast[data-removed=true][data-front=true][data-swipe-out=false] { --y: translateY(100%); opacity: 0; }',
      P + '.st-toast[data-removed=true][data-front=false][data-swipe-out=false][data-expanded=true] { --y: translateY(calc(-1 * var(--offset) + 100%)); opacity: 0; }',
      P + '.st-toast[data-removed=true][data-front=false][data-swipe-out=false][data-expanded=false] { --y: translateY(40%); opacity: 0; transition: transform .5s, opacity .2s; }',
      P + '.st-toast[data-swiping=true] { transform: var(--y) translateY(var(--sy, 0px)) translateX(var(--sx, 0px)); transition: none; cursor: grabbing; }',
      P + '.st-toast[data-swiping=true]::before { content: ""; position: absolute; left: -100%; right: -100%; top: 50%; height: 100%; transform: scaleY(3) translateY(-50%); z-index: -1; }',
      P + '.st-toast[data-swipe-out=true] { animation: .2s ease-out forwards; }',
      P + '.st-toast[data-dir=right] { animation-name: st-out-r; } ' + P + '.st-toast[data-dir=down] { animation-name: st-out-d; }',
      '@keyframes st-out-r { from { transform: var(--y) translateX(var(--sx)); opacity: 1; } to { transform: var(--y) translateX(calc(var(--sx) + 100%)); opacity: 0; } }',
      '@keyframes st-out-d { from { transform: var(--y) translateY(var(--sy)); opacity: 1; } to { transform: var(--y) translateY(calc(var(--sy) + 100%)); opacity: 0; } }',
      P + '.st-icon { position: relative; width: 16px; height: 16px; flex: none; display: flex; align-items: center; margin-left: -3px; }',
      P + '.st-toast[data-promise=true] .st-icon svg { animation: st-pop .3s ease forwards; } @keyframes st-pop { from { opacity: 0; transform: scale(.8); } to { opacity: 1; transform: none; } }',
      P + '.st-spinner { position: absolute; top: 50%; left: 50%; width: 16px; height: 16px; }',
      P + '.st-spinner i { position: absolute; left: -10%; top: -3.9%; width: 24%; height: 8%; border-radius: 6px; background: rgb(255 255 255 / .7); animation: st-spin 1.2s linear infinite; } @keyframes st-spin { from { opacity: 1; } to { opacity: .15; } }',
      P + '.st-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; pointer-events: none; }',
      P + '.st-title { font-weight: 500; line-height: 1.5; color: rgb(255 255 255 / .92); } ' + P + '.st-desc { line-height: 1.4; color: rgb(255 255 255 / .55); }',
      P + '.st-act { flex: none; height: 24px; padding: 0 9px; border-radius: 4px; background: #fff; color: #000; font-size: 12px; font-weight: 500; transition: opacity .4s, transform .16s cubic-bezier(.23,1,.32,1); } ' + P + '.st-act:active { transform: scale(.96); } ' + P + '.st-act:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }',
      '@container (max-width: 640px) { ' + P + '.st-panel { width: auto; right: 20px; } ' + P + '.st-sub { display: none; } ' + P + '.st-region { left: 16px; right: 16px; bottom: 16px; width: auto; } ' + P + '.st-btns button { padding: 9px 13px; } }',
      '@media (prefers-reduced-motion: reduce) { ' + P + '.st-toast, ' + P + '.st-toast > * { transition: opacity .15s ease !important; } ' + P + '.st-toast[data-swipe-out=true] { animation: st-fade .15s ease forwards !important; } ' + P + '.st-spinner i, ' + P + '.st-icon svg { animation: none !important; } }',
      '@keyframes st-fade { from { opacity: 1; } to { opacity: 0; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      stage.innerHTML =
        '<div class="st-bg" aria-hidden="true"></div>' +
        '<div class="st-panel"><p class="label accent">[ Toaster ]</p><h4>Calm, stacked<br>notifications</h4>' +
        '<p class="st-sub">Newest in front, older ones tucked behind. Hover to fan out, swipe to dismiss.</p>' +
        '<div class="st-btns">' + ['Default', 'Success', 'Error', 'Promise', 'Action'].map(function (k) {
          return '<button type="button" data-kind="' + k.toLowerCase() + '">' + k + '</button>'; }).join('') + '</div>' +
        '<p class="st-status label" aria-hidden="true"><i></i><span></span></p></div>' +
        '<section class="st-region" aria-label="Notifications alt+T" tabindex="-1" aria-live="polite" aria-relevant="additions text" aria-atomic="false">' +
        '<ol class="st-list" tabindex="-1"></ol></section>';
      var list = stage.querySelector('.st-list'), statusDot = stage.querySelector('.st-status i'), statusTxt = stage.querySelector('.st-status span');
      var toasts = [], seq = 0, timers = [], running = false, played = false;
      var hover = false, focusIn = false, interacting = false, expanded = false, prevFocus = null, drag = null;

      function later(fn, ms) { var id = setTimeout(function () { timers = timers.filter(function (x) { return x !== id; }); fn(); }, ms); timers.push(id); return id; }
      function measure(t) { var old = t.el.style.height; t.el.style.height = 'auto'; t.h = t.el.offsetHeight; t.el.style.height = old; }

      function layout() {
        var live = toasts.filter(function (t) { return !t.removed; });
        expanded = (hover || focusIn) && toasts.length > 1;
        list.style.setProperty('--front-h', (live[0] ? live[0].h : 0) + 'px');
        var acc = 0, hi = 0;
        toasts.forEach(function (t, i) {
          if (!t.removed) { t.off = hi * GAP + acc; acc += t.h; hi++; }
          var s = t.el.style, d = t.el.dataset;
          s.setProperty('--i', i); s.setProperty('--z', toasts.length - i);
          s.setProperty('--offset', t.off + 'px'); s.setProperty('--h', t.h + 'px');
          d.front = i === 0; d.visible = i + 1 <= VISIBLE; d.expanded = expanded;
        });
        syncTimers();
      }
      // timers pause while expanded (hover/focus), pressed, or the stage/tab is not live
      function syncTimers() {
        var paused = expanded || interacting || !running;
        toasts.forEach(function (t) {
          if (t.removed || t.type === 'loading') return;
          if (paused) { if (t.tid) { clearTimeout(t.tid); t.tid = 0; t.remaining -= Date.now() - t.at; } }
          else if (!t.tid) { t.at = Date.now(); t.tid = setTimeout(function () { t.tid = 0; dismiss(t); }, Math.max(0, t.remaining)); }
        });
        var n = toasts.filter(function (t) { return !t.removed; }).length;
        statusDot.className = paused && n ? 'off' : '';
        statusTxt.innerHTML = '<b>' + n + '</b> toast' + (n === 1 ? '' : 's') + ' · ' + (expanded ? 'expanded' : 'stacked') + ' · timers <b>' +
          (!n ? 'idle' : !paused ? 'running' : interacting ? 'paused (pressed)' : expanded ? 'paused (hover)' : 'paused (hidden)') + '</b>';
      }

      function fill(t) {
        var icon = t.type === 'loading' ? '<span class="st-spinner">' + Array.apply(null, Array(12)).map(function (_, i) {
          return '<i style="animation-delay:' + (-1.2 + i * .1).toFixed(1) + 's;transform:rotate(' + i * 30 + 'deg) translate(146%)"></i>'; }).join('') + '</span>' : ICON[t.type] || '';
        t.el.innerHTML = (t.type === 'loading' ? '' : '<button type="button" class="st-close" aria-label="Close toast"><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 1.5l7 7m0-7l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>') +
          (icon ? '<div class="st-icon">' + icon + '</div>' : '') +
          '<div class="st-content"><div class="st-title">' + t.title + '</div>' + (t.desc ? '<div class="st-desc">' + t.desc + '</div>' : '') + '</div>' +
          (t.action ? '<button type="button" class="st-act">' + t.action + '</button>' : '');
      }

      function add(kind) {
        var k = KIND[kind];
        var t = { id: ++seq, type: k.type || 'default', title: k.title, desc: k.desc, action: k.action, remaining: LIFE, removed: false, off: 0 };
        var li = document.createElement('li');
        li.className = 'st-toast'; li.tabIndex = 0;
        li.dataset.mounted = 'false'; li.dataset.removed = 'false'; li.dataset.swipeOut = 'false'; li.dataset.swiping = 'false';
        li.dataset.promise = !!k.promise;
        t.el = li; fill(t);
        toasts.unshift(t); list.prepend(li);
        measure(t); layout();
        requestAnimationFrame(function () { requestAnimationFrame(function () { li.dataset.mounted = 'true'; }); });
        bind(t);
        if (k.promise) { t.resolve = k.promise; t.rt = later(function () { resolve(t); }, 2000); }
        var extra = toasts.filter(function (x) { return !x.removed; }).slice(6);  // keep the DOM small
        extra.forEach(function (x) { dismiss(x); });
      }
      function resolve(t) {
        if (t.removed) return;
        t.type = t.resolve.type; t.title = t.resolve.title; t.desc = t.resolve.desc; t.resolve = null;
        fill(t); measure(t); layout();
      }

      function dismiss(t, dir) {
        if (t.removed) return;
        t.removed = true; clearTimeout(t.tid); t.tid = 0;
        t.el.dataset.removed = 'true';
        if (dir) { t.el.dataset.swipeOut = 'true'; t.el.dataset.dir = dir; }
        if (t.el.contains(document.activeElement)) list.focus({ preventScroll: true });
        layout();
        later(function () { unmount(t); }, UNMOUNT);
      }
      function unmount(t) {
        var i = toasts.indexOf(t); if (i < 0) return;
        toasts.splice(i, 1); t.el.remove();
        if (toasts.length <= 1) { hover = false; }
        layout();
      }

      function bind(t) {
        var li = t.el;
        li.addEventListener('click', function (e) {
          if (e.target.closest('.st-close')) dismiss(t);
          else if (e.target.closest('.st-act')) { dismiss(t); later(function () { add('restored'); }, 120); }
        });
        li.addEventListener('keydown', function (e) {
          if ((e.key === 'Delete' || e.key === 'Backspace') && e.target === li && t.type !== 'loading') { e.preventDefault(); dismiss(t); }
        });
        li.addEventListener('pointerdown', function (e) {
          if (e.button === 2 || t.type === 'loading' || t.removed || e.target.closest('button')) return;
          li.setPointerCapture(e.pointerId);
          drag = { t: t, x: e.clientX, y: e.clientY, t0: Date.now(), axis: null, amt: 0 };
          li.dataset.swiping = 'true';
        });
        li.addEventListener('pointermove', function (e) {
          if (!drag || drag.t !== t) return;
          var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
          if (!drag.axis && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
          if (!drag.axis) return;
          var a = drag.axis === 'x' ? dx : dy;
          if (a < 0) { var dd = a * (1 / (1.5 + Math.abs(a) / 20)); a = Math.abs(dd) < Math.abs(a) ? dd : a; }   // up/left not allowed: damped
          drag.amt = a;
          li.style.setProperty('--sx', (drag.axis === 'x' ? a : 0) + 'px');
          li.style.setProperty('--sy', (drag.axis === 'y' ? a : 0) + 'px');
        });
        function end() {
          if (!drag || drag.t !== t) return;
          var a = drag.amt, v = Math.abs(a) / Math.max(1, Date.now() - drag.t0), axis = drag.axis;
          drag = null;
          if (a > 0 && (Math.abs(a) >= SWIPE || v > VEL)) { dismiss(t, axis === 'x' ? 'right' : 'down'); return; }
          li.dataset.swiping = 'false';
          li.style.setProperty('--sx', '0px'); li.style.setProperty('--sy', '0px');
        }
        li.addEventListener('pointerup', end);
        li.addEventListener('pointercancel', end);
      }

      // toaster-level interaction state (expanded / interacting)
      list.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = true; layout(); } });
      list.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !interacting) { hover = false; layout(); } });
      list.addEventListener('pointerdown', function (e) { interacting = true; if (e.pointerType !== 'mouse') hover = true; layout(); });
      function up() { if (interacting) { interacting = false; layout(); } }
      list.addEventListener('pointerup', up); list.addEventListener('pointercancel', up);
      stage.addEventListener('pointerdown', function (e) { if (hover && !list.contains(e.target) && e.pointerType !== 'mouse') { hover = false; layout(); } });
      list.addEventListener('focusin', function (e) { if (!focusIn) { prevFocus = list.contains(e.relatedTarget) ? null : e.relatedTarget; focusIn = true; layout(); } });
      list.addEventListener('focusout', function (e) { if (!list.contains(e.relatedTarget)) { focusIn = false; layout(); } });
      list.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        focusIn = false; hover = false; layout();
        (prevFocus && prevFocus.isConnected ? prevFocus : stage.querySelector('.st-btns button')).focus({ preventScroll: true });
      });
      stage.querySelectorAll('.st-btns button').forEach(function (b) { b.addEventListener('click', function () { add(b.dataset.kind); }); });
      function onKey(e) { if (e.altKey && e.code === 'KeyT') { e.preventDefault(); list.focus({ preventScroll: true }); } }

      function intro() { [['success', 300], ['default', 1000], ['promise', 1700]].forEach(function (s) { later(function () { add(s[0]); }, s[1]); }); }
      layout();

      return {
        start: function () {
          running = true; document.addEventListener('keydown', onKey);
          toasts.forEach(function (t) { if (t.resolve && !t.rt) t.rt = later(function () { resolve(t); }, 1200); });
          if (!played) { played = true; intro(); }
          layout();
        },
        stop: function () {
          running = false; document.removeEventListener('keydown', onKey);
          timers.forEach(clearTimeout); timers = [];
          toasts.slice().forEach(function (t) { t.rt = 0; if (t.removed) unmount(t); });
          layout();
        },
        replay: function () {
          timers.forEach(clearTimeout); timers = [];
          toasts.slice().forEach(function (t) { dismiss(t); });
          later(intro, 450);
        }
      };
    }
  });
})();
