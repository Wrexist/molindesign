/* origin-aware-popovers — toolbar with dropdowns, a share popover and grouped tooltips, all placed inside the stage with flip + shift */
(function () {
  var ID = 'origin-aware-popovers', P = '.d-' + ID + ' ';
  function svg(p) { return '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  var IC = {
    link: svg('<path d="M6.6 9.4l2.8-2.8M7.2 4.6l1-1a2.6 2.6 0 013.7 3.7l-1 1M8.8 11.4l-1 1a2.6 2.6 0 01-3.7-3.7l1-1"/>'),
    bell: svg('<path d="M4.5 10.5V7a3.5 3.5 0 017 0v3.5l1 1.5h-9zM6.8 13.5h2.4"/>'),
    archive: svg('<rect x="2.5" y="3" width="11" height="3" rx="1"/><path d="M3.5 6v6.5h9V6M6.5 8.5h3"/>'),
    dots: svg('<circle cx="4" cy="8" r=".6" fill="currentColor"/><circle cx="8" cy="8" r=".6" fill="currentColor"/><circle cx="12" cy="8" r=".6" fill="currentColor"/>'),
    check: svg('<path d="M3.5 8.5l3 3 6-7"/>'),
    chev: '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 6.5l3 3 3-3"/></svg>',
    copy: svg('<rect x="5.5" y="5.5" width="7" height="7" rx="1.5"/><path d="M3.5 10.5v-6a1 1 0 011-1h6"/>'),
    branch: svg('<circle cx="5" cy="4" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="6" r="1.5"/><path d="M5 5.5v5M11 7.5c0 2-6 1.5-6 3"/>'),
    dup: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><path d="M6 13h5.5a1.5 1.5 0 001.5-1.5V6"/>'),
    trash: svg('<path d="M3.5 4.5h9M6.5 4.5V3h3v1.5M4.5 4.5l.7 8.5h5.6l.7-8.5"/>')
  };
  var ST = {
    backlog: svg('<circle cx="8" cy="8" r="5.5" stroke-dasharray="1.8 1.9"/>'),
    todo: svg('<circle cx="8" cy="8" r="5.5"/>'),
    progress: svg('<circle cx="8" cy="8" r="5.5" stroke="#f97316"/><path d="M8 4.6a3.4 3.4 0 010 6.8z" fill="#f97316" stroke="none"/>'),
    done: svg('<circle cx="8" cy="8" r="5.5" fill="rgb(255 255 255 / .85)" stroke="none"/><path d="M5.6 8.2l1.7 1.7 3.2-3.6" stroke="#000"/>'),
    canceled: svg('<circle cx="8" cy="8" r="5.5" stroke="rgb(255 255 255 / .45)"/><path d="M6.2 6.2l3.6 3.6M9.8 6.2l-3.6 3.6" stroke="rgb(255 255 255 / .45)"/>')
  };
  function bars(n) { var s = ''; for (var i = 0; i < 3; i++) s += '<rect x="' + (3 + i * 3.6) + '" y="' + (10 - i * 2.5) + '" width="2.4" height="' + (3 + i * 2.5) + '" rx=".6" fill="currentColor" opacity="' + (i < n ? 1 : .25) + '" stroke="none"/>'; return svg(s); }
  var PR = { none: svg('<path d="M4 8h1.6M7.2 8h1.6M10.4 8H12"/>'), urgent: svg('<rect x="2.5" y="2.5" width="11" height="11" rx="2.5" fill="#f97316" stroke="none"/><path d="M8 5v3.6M8 10.6v.4" stroke="#000" stroke-width="1.6"/>'), high: bars(3), medium: bars(2), low: bars(1) };
  var STATUS = [['backlog', 'Backlog'], ['todo', 'Todo'], ['progress', 'In progress'], ['done', 'Done'], ['canceled', 'Canceled']];
  var PRIO = [['none', 'No priority'], ['urgent', 'Urgent'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']];

  var css = [
    '& { --k: 1; container-type: inline-size; font-size: 13px; color: rgb(255 255 255 / .9); }',
    '.op-app { position: absolute; inset: 0; display: flex; flex-direction: column; background: radial-gradient(90% 70% at 70% 0%, rgb(249 115 22 / .07), transparent 60%), #070707; }',
    '.op-top, .op-bot { display: flex; align-items: center; gap: 6px; padding: 14px 18px; }',
    '.op-top { border-bottom: 1px solid rgb(255 255 255 / .07); } .op-bot { margin-top: auto; border-top: 1px solid rgb(255 255 255 / .07); }',
    '.op-crumb { color: rgb(255 255 255 / .45); margin-right: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .op-crumb b { color: rgb(255 255 255 / .85); font-weight: 500; }',
    '.op-ib, .op-btn, .op-chip { display: inline-flex; align-items: center; gap: 7px; height: 32px; border-radius: 8px; color: rgb(255 255 255 / .7); transition: background .15s, color .15s; white-space: nowrap; }',
    '.op-ib { width: 32px; justify-content: center; } .op-btn { padding: 0 12px; border: 1px solid rgb(255 255 255 / .14); color: #fff; }',
    '.op-chip { padding: 0 10px 0 8px; border: 1px solid rgb(255 255 255 / .1); background: rgb(255 255 255 / .03); color: rgb(255 255 255 / .85); }',
    '.op-ib:hover, .op-btn:hover, .op-chip:hover, [aria-expanded=true].op-ib, [aria-expanded=true].op-btn, [aria-expanded=true].op-chip { background: rgb(255 255 255 / .08); color: #fff; }',
    '.op-chip .op-cv { color: rgb(255 255 255 / .4); }',
    '.op-body { padding: clamp(18px, 4cqw, 40px) 22px 0; }',
    '.op-id { color: rgb(255 255 255 / .4); margin: 0 0 10px; }',
    '.op-h { margin: 0 0 10px; font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; letter-spacing: -.02em; font-size: clamp(22px, 4.4cqw, 40px); line-height: 1.05; color: #fff; }',
    '.op-p { margin: 0 0 18px; max-width: 46ch; color: rgb(255 255 255 / .55); font-size: 14px; line-height: 1.55; }',
    '.op-props { display: flex; flex-wrap: wrap; gap: 8px; }',
    '.op-slow { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 4px; color: rgb(255 255 255 / .6); }',
    '.op-sw { width: 26px; height: 15px; border-radius: 9px; background: rgb(255 255 255 / .15); position: relative; transition: background .2s; }',
    '.op-sw::after { content: ""; position: absolute; left: 2px; top: 2px; width: 11px; height: 11px; border-radius: 50%; background: #fff; transition: transform .2s cubic-bezier(.23,1,.32,1); }',
    '[aria-pressed=true] .op-sw { background: #f97316; } [aria-pressed=true] .op-sw::after { transform: translateX(11px); }',
    '.op-hud { display: flex; align-items: center; gap: 10px; margin-right: auto; margin-left: 8px; color: rgb(255 255 255 / .45); min-width: 0; }',
    '.op-hud b { color: #fff; font-weight: 500; white-space: nowrap; } .op-hud .op-hl { white-space: nowrap; }',
    '.op-bar { width: 64px; height: 2px; background: rgb(255 255 255 / .12); overflow: hidden; flex: none; } .op-bar i { display: block; height: 100%; background: #f97316; transform-origin: left; transform: scaleX(0); }',
    '.op-layer { position: absolute; inset: 0; pointer-events: none; z-index: 5; }',
    '.op-pop { position: absolute; left: 0; top: 0; pointer-events: auto; transform-origin: var(--origin, 50% 0); --s0: .95; animation: dop-in calc(160ms * var(--k)) cubic-bezier(.23,1,.32,1) both; }',
    '.op-pop[hidden] { display: none; }',
    '.op-pop[data-state=closed] { animation: dop-out calc(120ms * var(--k)) ease both; pointer-events: none; }',
    '.op-pop[data-side=bottom] { --sx: 0px; --sy: -8px; } .op-pop[data-side=top] { --sx: 0px; --sy: 8px; } .op-pop[data-side=right] { --sx: -8px; --sy: 0px; } .op-pop[data-side=left] { --sx: 8px; --sy: 0px; }',
    '.op-menu, .op-share { min-width: 200px; padding: 4px; border-radius: 10px; background: rgb(20 20 20 / .94); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); border: 1px solid rgb(255 255 255 / .1); box-shadow: 0 16px 40px -8px rgb(0 0 0 / .7), 0 2px 6px rgb(0 0 0 / .4); outline: none; }',
    '.op-mh { padding: 8px 8px 6px; color: rgb(255 255 255 / .4); }',
    '.op-it { display: flex; align-items: center; gap: 9px; height: 32px; padding: 0 8px; border-radius: 6px; color: rgb(255 255 255 / .8); cursor: default; outline: none; user-select: none; }',
    '.op-it[data-highlighted] { background: rgb(255 255 255 / .08); color: #fff; }',
    '.op-it[aria-disabled=true] { color: rgb(255 255 255 / .3); }',
    '.op-it .op-k { margin-left: auto; padding-left: 16px; color: rgb(255 255 255 / .35); font-size: 12px; font-variant-numeric: tabular-nums; }',
    '.op-it .op-ck { margin-left: auto; color: #fff; display: none; } .op-it[aria-checked=true] .op-ck { display: block; } .op-it[aria-checked=true] .op-k { display: none; }',
    '.op-sep { height: 1px; margin: 4px -4px; background: rgb(255 255 255 / .08); }',
    '.op-share { width: 280px; padding: 14px; }',
    '.op-share h5 { margin: 0 0 4px; font-size: 14px; font-weight: 500; color: #fff; } .op-share p { margin: 0 0 12px; color: rgb(255 255 255 / .5); font-size: 12.5px; line-height: 1.45; }',
    '.op-row { display: flex; gap: 6px; } .op-in { flex: 1; min-width: 0; height: 32px; padding: 0 10px; border-radius: 7px; border: 1px solid rgb(255 255 255 / .12); background: rgb(0 0 0 / .4); color: rgb(255 255 255 / .8); font: inherit; font-size: 12.5px; outline: none; }',
    '.op-in:focus { border-color: #f97316; } .op-cp { height: 32px; padding: 0 12px; border-radius: 7px; background: #fff; color: #000; font-weight: 500; font-size: 12.5px; flex: none; }',
    '.op-tip { --s0: .96; padding: 6px 9px; border-radius: 7px; background: #f2f2f2; color: #0a0a0a; font-size: 12px; font-weight: 500; white-space: nowrap; box-shadow: 0 6px 20px rgb(0 0 0 / .5); }',
    '.op-tip kbd { font: inherit; margin-left: 8px; color: rgb(0 0 0 / .45); }',
    '.op-tip[data-state=instant-open] { animation: none; }',
    '.op-origin { position: absolute; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%; background: #f97316; box-shadow: 0 0 0 4px rgb(249 115 22 / .25), 0 0 14px #f97316; opacity: 0; z-index: 30; }',
    '.op-toast { position: absolute; left: 50%; bottom: 68px; transform: translateX(-50%); padding: 8px 14px; border-radius: 999px; background: rgb(255 255 255 / .1); border: 1px solid rgb(255 255 255 / .12); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); color: #fff; font-size: 12.5px; white-space: nowrap; opacity: 0; transition: opacity .2s, transform .3s cubic-bezier(.23,1,.32,1); pointer-events: none; z-index: 6; }',
    '.op-toast.on { opacity: 1; transform: translateX(-50%) translateY(-4px); }',
  ].join('\n').replace(/([^{}]+)\{([^{}]*)\}/g, function (m, sel, body) {
    return sel.split(',').map(function (x) { x = x.trim(); return x === '&' ? '.d-' + ID : P + x; }).join(', ') + ' {' + body + '}';
  }) +
    '\n@container (max-width: 560px) { ' + P + '.op-hud .op-hl, ' + P + '.op-crumb .op-ws, ' + P + '.op-slow .t { display: none; } ' + P + '.op-p { font-size: 13px; } }' +
    '\n@media (prefers-reduced-motion: reduce) { ' + P + '.op-pop { animation-name: dop-fade; animation-duration: calc(100ms * var(--k)); } ' + P + '.op-pop[data-state=closed] { animation-name: dop-fade-out; } }' +
    '\n@keyframes dop-in { from { opacity: 0; transform: translate(var(--sx, 0), var(--sy, 0)) scale(var(--s0)); } }' +
    '\n@keyframes dop-out { to { opacity: 0; transform: scale(var(--s0)); } }' +
    '\n@keyframes dop-fade { from { opacity: 0; } } @keyframes dop-fade-out { to { opacity: 0; } }';

  Lib.register(ID, {
    hint: 'Open Status, Priority, Share and ⋯ (it flips up and shifts in). Hover the top icons slowly, then sweep across them. Turn on Slow ×5 to see the origin.',
    notes: [
      'Origin = trigger centre projected onto the near edge; enter <code>fade + scale .95 + 8 px slide away from the trigger</code>, exit fade + scale only',
      'Collision: flip to the opposite side if it overflows, then shift along the edge with an 8 px pad, all inside the stage',
      'Tooltip group (Radix): first opens after <b>700 ms</b>; within <b>300 ms</b> of the last closing the next is <code>instant-open</code> and skips its animation',
      'Exit before unmount: <code>data-state="closed"</code> plays the keyframes, the node hides on its own <code>animationend</code>',
      'Menus open on pointerdown (mouse), Enter/Space/↓ (keyboard); roving focus, typeahead (1 s), Esc returns focus'
    ],
    simplified: 'One flip and shift pass instead of Floating UI middleware, no scroll lock or modal outside-pointer blocking, and no hoverable tooltip grace hull. Durations are the house 160/120 ms, not shadcn’s 150 ms.',
    css: css,
    mount: function (stage, ctx) {
      var uid = 0, status = 'progress', prio = 'high', k = 1, toastT = 0;
      function chip(cls, ic, txt, label) { return '<button type="button" class="op-chip ' + cls + '" aria-haspopup="menu" aria-expanded="false" aria-label="' + label + '">' + ic + '<span class="op-cv-t">' + txt + '</span><span class="op-cv">' + IC.chev + '</span></button>'; }
      stage.innerHTML = '<div class="op-app" tabindex="-1">' +
        '<div class="op-top"><span class="op-crumb label">Molin <span class="op-ws">› Motion</span> › <b>MOL-142</b></span>' +
        '<button type="button" class="op-ib" data-tip="Copy link" data-kbd="⌘L" aria-label="Copy link">' + IC.link + '</button>' +
        '<button type="button" class="op-ib" data-tip="Subscribe" aria-label="Subscribe">' + IC.bell + '</button>' +
        '<button type="button" class="op-ib" data-tip="Archive" data-kbd="E" aria-label="Archive">' + IC.archive + '</button>' +
        '<button type="button" class="op-btn op-sharebtn" aria-haspopup="dialog" aria-expanded="false" data-tip="Share with people">Share</button></div>' +
        '<div class="op-body"><p class="op-id label">MOL-142 · Components</p><h4 class="op-h">Popovers that grow from their trigger</h4>' +
        '<p class="op-p">Every menu, popover and tooltip here is placed on a side, flips when there is no room and scales from the point nearest its trigger.</p>' +
        '<div class="op-props">' + chip('op-st', ST.progress, 'In progress', 'Status') + chip('op-pr', PR.high, 'High', 'Priority') + '</div></div>' +
        '<div class="op-bot"><button type="button" class="op-slow label" aria-pressed="false"><span class="op-sw" aria-hidden="true"></span><span class="t">Slow ×5</span><span class="sr" hidden>Slow motion</span></button>' +
        '<div class="op-hud label" aria-hidden="true"><span class="op-hl">Tooltip</span><b class="op-hs">idle</b><span class="op-bar"><i></i></span></div>' +
        '<button type="button" class="op-ib op-more" aria-haspopup="menu" aria-expanded="false" aria-label="More actions" data-tip="More actions">' + IC.dots + '</button></div></div>' +
        '<div class="op-layer"><span class="op-origin"></span></div><div class="op-toast" role="status" aria-live="polite"></div>';
      var $ = function (s) { return stage.querySelector(s); };
      var layer = $('.op-layer'), originDot = $('.op-origin'), hudS = $('.op-hs'), hudBar = $('.op-bar i'), toast = $('.op-toast');
      var open = null;   // the one open menu/popover {trigger, node, close}

      /* ---------- placement (flip, then shift; origin toward trigger) ---------- */
      function place(trigger, node, side, align, offset) {
        var b = layer.getBoundingClientRect(), t = trigger.getBoundingClientRect(), pad = 8;
        var w = node.offsetWidth, h = node.offsetHeight;
        var opp = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
        var room = { top: t.top - b.top, bottom: b.bottom - t.bottom, left: t.left - b.left, right: b.right - t.right };
        var need = function (s) { return (s === 'top' || s === 'bottom' ? h : w) + offset + pad; };
        if (room[side] < need(side) && room[opp[side]] > room[side]) side = opp[side];
        var vert = side === 'top' || side === 'bottom', x, y;
        if (vert) { y = side === 'bottom' ? t.bottom + offset : t.top - offset - h; x = align === 'start' ? t.left : align === 'end' ? t.right - w : t.left + t.width / 2 - w / 2; }
        else { x = side === 'right' ? t.right + offset : t.left - offset - w; y = t.top + t.height / 2 - h / 2; }
        x = Math.min(Math.max(x, b.left + pad), b.right - pad - w); y = Math.min(Math.max(y, b.top + pad), b.bottom - pad - h);
        var cx = ctx.clamp(t.left + t.width / 2 - x, 0, w), cy = ctx.clamp(t.top + t.height / 2 - y, 0, h);
        var ox = vert ? cx : side === 'right' ? 0 : w, oy = vert ? (side === 'bottom' ? 0 : h) : cy;
        node.style.left = (x - b.left) + 'px'; node.style.top = (y - b.top) + 'px';
        node.style.setProperty('--origin', ox + 'px ' + oy + 'px');
        node.dataset.side = side; node.dataset.align = align;
        return { x: x - b.left + ox, y: y - b.top + oy };
      }
      function showOrigin(p) {
        if (k === 1) return;
        originDot.style.left = p.x + 'px'; originDot.style.top = p.y + 'px';
        originDot.getAnimations().forEach(function (a) { a.cancel(); });
        originDot.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 1, offset: .6 }, { opacity: 0, transform: 'scale(.6)' }], { duration: 1400, easing: 'ease-out' });
      }
      /* ---------- presence: exit keyframes finish before hiding ---------- */
      function present(node, show, instant) {
        clearTimeout(node._t);
        if (node._done) { node.removeEventListener('animationend', node._done); node._done = null; }
        if (show) { node.hidden = false; return; }
        if (node.hidden) return;
        node.dataset.state = 'closed';
        var name = getComputedStyle(node).animationName;
        if (instant || name === 'none') { node.hidden = true; return; }
        function done(e) {
          if (e && (e.target !== node || name.indexOf(e.animationName) < 0)) return;
          node.removeEventListener('animationend', done); node._done = null; clearTimeout(node._t);
          if (node.dataset.state === 'closed') node.hidden = true;
        }
        node._done = done; node.addEventListener('animationend', done); node._t = setTimeout(done, 300 * k + 100);
      }

      /* ---------- tooltips with a delay group ---------- */
      var group = { delayed: true, skipT: 0, cur: null }, tipTimer = 0, quietFocus = false;
      function hud(text, from, to, ms) {
        hudS.textContent = text;
        hudBar.style.transition = 'none'; hudBar.style.transform = 'scaleX(' + from + ')';
        if (ms) { void hudBar.offsetWidth; hudBar.style.transition = 'transform ' + ms + 'ms linear'; hudBar.style.transform = 'scaleX(' + to + ')'; }
      }
      stage.querySelectorAll('[data-tip]').forEach(function (btn) {
        var tip = ctx.el('div', 'op-pop op-tip'); tip.id = 'op-tip-' + (++uid); tip.setAttribute('role', 'tooltip'); tip.hidden = true;
        tip.innerHTML = btn.dataset.tip + (btn.dataset.kbd ? '<kbd>' + btn.dataset.kbd + '</kbd>' : '');
        layer.appendChild(tip);
        function show(instant) {
          if (open) return;
          if (group.cur && group.cur !== hide) group.cur(true);
          group.cur = hide; clearTimeout(group.skipT); group.delayed = false;
          present(tip, true); showOrigin(place(btn, tip, 'top', 'center', 6));
          tip.dataset.state = instant ? 'instant-open' : 'delayed-open';
          btn.setAttribute('aria-describedby', tip.id);
          hud(tip.dataset.state, 1, 1, 0);
        }
        function hide(switching) {
          clearTimeout(tipTimer); tipTimer = 0;
          if (group.cur !== hide) return;
          group.cur = null; btn.removeAttribute('aria-describedby');
          present(tip, false, switching === true);
          clearTimeout(group.skipT);
          group.skipT = setTimeout(function () { group.delayed = true; hud('idle', 0, 0, 0); }, 300);
          hud('skip window', 1, 0, 300);
        }
        btn._hideTip = hide;
        btn.addEventListener('pointermove', function (e) {
          if (e.pointerType === 'touch' || tipTimer || group.cur === hide || open) return;
          if (group.delayed) { hud('waiting 700 ms', 0, 1, 700); tipTimer = setTimeout(function () { tipTimer = 0; show(false); }, 700); }
          else show(true);
        });
        btn.addEventListener('pointerleave', function () { if (tipTimer) { clearTimeout(tipTimer); tipTimer = 0; hud('idle', 0, 0, 0); } hide(); });
        btn.addEventListener('pointerdown', function () { hide(); });
        btn.addEventListener('focus', function () { if (!quietFocus && btn.matches(':focus-visible')) show(true); });
        btn.addEventListener('blur', function () { hide(); });
      });
      function hideTips() { if (group.cur) group.cur(true); clearTimeout(tipTimer); tipTimer = 0; }

      /* ---------- dropdown menus ---------- */
      function closeOpen(restore) {
        if (!open) return;
        var o = open; open = null;
        o.trigger.setAttribute('aria-expanded', 'false'); o.trigger.removeAttribute('aria-controls');
        present(o.node, false);
        document.removeEventListener('pointerdown', onOutside, true);
        if (restore) { quietFocus = true; o.trigger.focus({ preventScroll: true }); quietFocus = false; }
      }
      function onOutside(e) { if (open && !open.node.contains(e.target) && !open.trigger.contains(e.target)) closeOpen(false); }
      function opened(trigger, node, side, align, offset) {
        hideTips();
        open = { trigger: trigger, node: node, side: side, align: align, offset: offset };
        trigger.setAttribute('aria-expanded', 'true'); trigger.setAttribute('aria-controls', node.id);
        present(node, true); showOrigin(place(trigger, node, side, align, offset)); node.dataset.state = 'open';
        document.addEventListener('pointerdown', onOutside, true);
      }
      function menu(trigger, opts) {
        var node = ctx.el('div', 'op-pop op-menu'); node.id = 'op-m-' + (++uid); node.hidden = true;
        node.setAttribute('role', 'menu'); node.setAttribute('aria-label', opts.label); node.tabIndex = -1;
        node.innerHTML = (opts.head ? '<div class="op-mh label" aria-hidden="true">' + opts.head + '</div>' : '') + opts.items.map(function (it, i) {
          if (it === '-') return '<div class="op-sep" role="separator"></div>';
          return '<div class="op-it" role="' + (opts.radio ? 'menuitemradio' : 'menuitem') + '" tabindex="-1" data-v="' + it[0] + '"' +
            (it[3] ? ' aria-disabled="true"' : '') + '>' + it[2] + '<span>' + it[1] + '</span>' +
            (opts.radio ? '<span class="op-k">' + (i + 1) + '</span><span class="op-ck">' + IC.check + '</span>' : it[4] ? '<span class="op-k">' + it[4] + '</span>' : '') + '</div>';
        }).join('');
        layer.appendChild(node);
        var items = Array.prototype.slice.call(node.querySelectorAll('.op-it'));
        var live = function () { return items.filter(function (n) { return n.getAttribute('aria-disabled') !== 'true'; }); };
        var buf = '', bufT = 0;
        function hl(n) { items.forEach(function (x) { if (x !== n) x.removeAttribute('data-highlighted'); }); if (n) { n.setAttribute('data-highlighted', ''); n.focus({ preventScroll: true }); } else node.focus({ preventScroll: true }); }
        function sync() { if (opts.radio) items.forEach(function (n) { n.setAttribute('aria-checked', n.dataset.v === opts.value() ? 'true' : 'false'); }); }
        function show(byKey) {
          if (open && open.node === node) return closeOpen(false);
          closeOpen(false); sync(); items.forEach(function (x) { x.removeAttribute('data-highlighted'); });
          opened(trigger, node, opts.side, opts.align, 4);
          if (byKey) hl(node.querySelector('[aria-checked=true]') || live()[0]); else node.focus({ preventScroll: true });
        }
        function pick(n) { if (!n || n.getAttribute('aria-disabled') === 'true') return; opts.pick(n.dataset.v, n); closeOpen(true); }
        trigger.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button === 0 && !e.ctrlKey) { e.preventDefault(); show(false); } });
        trigger.addEventListener('click', function (e) { if (e.detail && trigger._pt !== 'mouse') show(false); });
        trigger.addEventListener('pointerdown', function (e) { trigger._pt = e.pointerType; }, true);
        trigger.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); if (e.key === 'ArrowDown' && open && open.node === node) return; show(true); } });
        node.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var n = e.target.closest('.op-it'); if (n && n.getAttribute('aria-disabled') !== 'true' && !n.hasAttribute('data-highlighted')) hl(n); });
        node.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && open && open.node === node) hl(null); });
        node.addEventListener('click', function (e) { pick(e.target.closest('.op-it')); });
        node.addEventListener('keydown', function (e) {
          var L = live(), cur = L.indexOf(document.activeElement);
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); hl(L[cur < 0 ? (e.key === 'ArrowDown' ? 0 : L.length - 1) : ctx.clamp(cur + (e.key === 'ArrowDown' ? 1 : -1), 0, L.length - 1)]); }
          else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); hl(L[e.key === 'Home' ? 0 : L.length - 1]); }
          else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(document.activeElement.closest('.op-it')); }
          else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeOpen(true); }
          else if (e.key === 'Tab') { e.preventDefault(); closeOpen(true); }
          else if (opts.radio && /^[1-9]$/.test(e.key) && L[+e.key - 1]) { e.preventDefault(); pick(items[+e.key - 1]); }
          else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            clearTimeout(bufT); buf += e.key.toLowerCase(); bufT = setTimeout(function () { buf = ''; }, 1000);
            var s = buf.split('').every(function (c) { return c === buf[0]; }) ? buf[0] : buf;
            var start = Math.max(cur, 0), order = L.slice(start).concat(L.slice(0, start));
            if (s.length === 1) order = order.filter(function (n) { return n !== L[cur]; });
            var hit = order.filter(function (n) { return n.textContent.trim().toLowerCase().indexOf(s) === 0; })[0];
            if (hit) hl(hit);
          }
        });
      }
      function say(t) { toast.textContent = t; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('on'); }, 1600); }
      var stBtn = $('.op-st'), prBtn = $('.op-pr');
      menu(stBtn, { label: 'Status', head: 'Change status', radio: true, side: 'bottom', align: 'start', value: function () { return status; },
        items: STATUS.map(function (s) { return [s[0], s[1], ST[s[0]]]; }),
        pick: function (v, n) { status = v; stBtn.firstChild.outerHTML = ST[v]; stBtn.querySelector('.op-cv-t').textContent = n.querySelector('span').textContent; say('Status → ' + n.querySelector('span').textContent); } });
      menu(prBtn, { label: 'Priority', head: 'Set priority', radio: true, side: 'bottom', align: 'start', value: function () { return prio; },
        items: PRIO.map(function (s) { return [s[0], s[1], PR[s[0]]]; }),
        pick: function (v, n) { prio = v; prBtn.firstChild.outerHTML = PR[v]; prBtn.querySelector('.op-cv-t').textContent = n.querySelector('span').textContent; say('Priority → ' + n.querySelector('span').textContent); } });
      menu($('.op-more'), { label: 'More actions', side: 'bottom', align: 'end',
        items: [['id', 'Copy issue ID', IC.copy, 0, '⌘.'], ['branch', 'Copy git branch', IC.branch, 0, '⌘⇧.'], ['dup', 'Duplicate', IC.dup], '-', ['del', 'Delete…', IC.trash, 1]],
        pick: function (v, n) { say(v === 'dup' ? 'Duplicated MOL-142' : 'Copied ' + (v === 'id' ? 'MOL-142' : 'mol-142-popovers')); } });

      /* ---------- share popover (role=dialog, non-modal) ---------- */
      var shareBtn = $('.op-sharebtn'), share = ctx.el('div', 'op-pop op-share');
      share.id = 'op-share'; share.hidden = true; share.setAttribute('role', 'dialog'); share.setAttribute('aria-label', 'Share issue');
      share.innerHTML = '<h5>Share MOL-142</h5><p>Anyone in Molin with the link can view and comment.</p><div class="op-row"><input class="op-in" readonly value="molin.app/issue/MOL-142" aria-label="Issue link"><button type="button" class="op-cp">Copy</button></div>';
      layer.appendChild(share);
      shareBtn.addEventListener('click', function () {
        if (open && open.node === share) return closeOpen(false);
        closeOpen(false); opened(shareBtn, share, 'bottom', 'end', 6); share.querySelector('.op-in').focus({ preventScroll: true });
      });
      share.querySelector('.op-cp').addEventListener('click', function (e) { e.currentTarget.textContent = 'Copied'; say('Link copied'); setTimeout(function () { closeOpen(true); }, 350); });
      share.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeOpen(true); } });
      share.addEventListener('focusout', function (e) { if (open && open.node === share && e.relatedTarget && !share.contains(e.relatedTarget) && e.relatedTarget !== shareBtn) closeOpen(false); });
      stage.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideTips(); });

      var slow = $('.op-slow');
      slow.addEventListener('click', function () { k = k === 1 ? 5 : 1; stage.style.setProperty('--k', k); slow.setAttribute('aria-pressed', k > 1 ? 'true' : 'false'); });
      var ro = new ResizeObserver(function () { if (open) place(open.trigger, open.node, open.side, open.align, open.offset); hideTips(); });
      return {
        start: function () { ro.observe(stage); },
        stop: function () { ro.disconnect(); closeOpen(false); hideTips(); clearTimeout(group.skipT); clearTimeout(toastT); group.delayed = true; hud('idle', 0, 0, 0); }
      };
    }
  });
})();
