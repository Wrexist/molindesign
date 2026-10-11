/* ui-motion-principles — five side-by-side comparisons (avoid vs prefer) the viewer can play, slow down and interrupt */
(function () {
  var ID = 'ui-motion-principles';
  var P = '.d-' + ID + ' ';
  var EO = 'cubic-bezier(.23,1,.32,1)';
  var MENU = '<span class="ump-trig">Options <i aria-hidden="true">⌄</i></span><span class="ump-menu"><b>Rename…</b><b>Duplicate</b><b>Move to…</b></span>';
  var TABS = [
    { id: 'easing', name: 'Easing', rule: 'Enter and exit with ease-out. Same 300 ms: ease-in starts slow and feels late.',
      kind: 'menu', bad: { e: 'ease-in', d: 300, v: 'ease-in · 300 ms' }, good: { e: EO, d: 300, v: 'cubic-bezier(.23,1,.32,1) · 300 ms' } },
    { id: 'duration', name: 'Duration', rule: 'Keep UI motion under 300 ms. 180 ms reads as a response, 400 ms as lag.',
      kind: 'menu', bad: { e: EO, d: 400, v: 'ease-out · 400 ms' }, good: { e: EO, d: 180, v: 'ease-out · 180 ms' } },
    { id: 'origin', name: 'Origin', rule: 'Grow out of the trigger and start at .9+ (here .93), never from scale(0) at the centre.',
      kind: 'pop', bad: { e: EO, d: 250, s: 0, o: '50% 50%', f: 1, v: 'scale(0) · origin centre' }, good: { e: EO, d: 250, s: .93, o: '0% 100%', f: 0, v: 'scale(.93) + fade · origin trigger' } },
    { id: 'interrupt', name: 'Interrupt', rule: 'Anything reversible uses transitions: they retarget mid-flight. Keyframes restart and jump.',
      kind: 'sheet', bad: { e: EO, d: 500, v: '@keyframes in / out' }, good: { e: EO, d: 500, v: 'transition: transform' } },
    { id: 'frequency', name: 'Frequency', rule: 'Keyboard and hundred-times-a-day actions get no animation. Hold ↓ and watch the left list lag.',
      kind: 'list', bad: { e: EO, d: 200, v: '200 ms slide per key' }, good: { e: EO, d: 0, v: 'instant' } }
  ];
  var ITEMS = ['Inbox', 'My issues', 'Projects', 'Views', 'Settings'];

  Lib.register(ID, {
    hint: 'Pick a principle, press Play (or Slow ×4). On Frequency, use ↑ ↓ or the arrow keys.',
    notes: [
      'UI motion under <b>300 ms</b>; interactions ≤ <b>200 ms</b>. Observed: Linear <code>.1s</code>/<code>.16s</code>/<code>.25s</code>, Geist popover <code>.2s</code>, overlay <code>.3s</code>',
      'Enter/exit with <b>ease-out</b>, a real curve: <code>cubic-bezier(.23,1,.32,1)</code> (Linear’s ease-out-quint); ease-in is not for UI',
      'Origin at the trigger; scale from ≥ <b>.9</b> (Emil .93, Geist overlay .96), never 0; press <b>.97</b>',
      'Transitions retarget, keyframes restart; reversible state must be a transition',
      'Never animate keyboard-driven or very frequent actions (⌘K, arrow highlight, context menus); Linear highlights fade in <code>0s</code>, out <code>.15s</code>'
    ],
    simplified: 'Each pane isolates one variable; real components combine them. Under reduced motion the panes only fade, and the value captions carry the difference.',
    css: [
      '.d-ui-motion-principles { container-type: inline-size; }',
      P + '.ump { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 14px clamp(14px, 3cqw, 26px) 14px; gap: 12px; }',
      P + '.ump-tabs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; margin: 0 -4px; padding: 2px 4px; touch-action: pan-x; } ' + P + '.ump-tabs::-webkit-scrollbar { display: none; }',
      P + '.ump-tabs button { flex: none; min-height: 34px; padding: 0 12px; border-radius: 999px; color: rgb(255 255 255 / .5); transition: color .16s, background-color .16s; }',
      P + '.ump-tabs button[aria-selected="true"] { background: rgb(255 255 255 / .1); color: #fff; } @media (hover: hover) { ' + P + '.ump-tabs button:hover { color: #fff; } }',
      P + '.ump-tabs button i { font-style: normal; color: #f97316; margin-right: 6px; }',
      P + '.ump-panes { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-height: 0; }',
      P + '.ump-pane { display: flex; flex-direction: column; gap: 8px; min-width: 0; min-height: 0; }',
      P + '.ump-head { display: flex; align-items: center; gap: 8px; color: rgb(255 255 255 / .5); margin: 0; } ' + P + '.ump-good .ump-head { color: #f97316; }',
      P + '.ump-head svg { width: 12px; height: 12px; }',
      P + '.ump-frame { position: relative; flex: 1; min-height: 0; border-radius: 12px; border: 1px solid rgb(255 255 255 / .09); background: rgb(255 255 255 / .02); overflow: hidden; }',
      P + '.ump-good .ump-frame { border-color: rgb(249 115 22 / .25); }',
      P + '.ump-val { margin: 0; font-size: 11px; color: rgb(255 255 255 / .6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      /* menu + popover specimen */
      P + '.ump-spec { position: absolute; left: 50%; top: 50%; width: min(200px, calc(100% - 24px)); height: min(184px, calc(100% - 24px)); transform: translate(-50%, -50%); }',
      P + '.ump-trig { position: absolute; left: 0; top: 0; display: inline-flex; gap: 6px; align-items: center; height: 30px; padding: 0 12px; border-radius: 8px; background: rgb(255 255 255 / .08); border: 1px solid rgb(255 255 255 / .1); font-size: 13px; color: rgb(255 255 255 / .9); }',
      P + '.ump-trig i { font-style: normal; color: rgb(255 255 255 / .5); }',
      P + '.ump-menu { position: absolute; left: 0; top: 38px; width: min(170px, 100%); display: grid; padding: 4px; border-radius: 10px; background: #141414; border: 1px solid rgb(255 255 255 / .12); box-shadow: 0 12px 30px rgb(0 0 0 / .5); transform-origin: var(--o, 0% 0%);',
      '  opacity: 0; transform: translateY(-4px) scale(var(--s, .96)); transition: opacity calc(var(--d) * var(--k) * 1ms) var(--e), transform calc(var(--d) * var(--k) * 1ms) var(--e); }',
      P + '.ump-menu b { font-weight: 400; font-size: 13px; padding: 7px 10px; border-radius: 6px; color: rgb(255 255 255 / .85); } ' + P + '.ump-menu b:first-child { background: rgb(255 255 255 / .07); }',
      P + '.open .ump-menu { opacity: 1; transform: none; }',
      P + '.is-pop .ump-trig { top: auto; bottom: 0; } ' + P + '.is-pop .ump-menu { top: auto; bottom: 38px; transform: scale(var(--s)); } ' + P + '.is-pop.solid .ump-menu { opacity: 1; } ' + P + '.is-pop.open .ump-menu { transform: none; }',
      P + '.is-pop.solid:not(.open) .ump-menu { transition-property: transform; }',
      /* sheet specimen */
      P + '.ump-sheet { position: absolute; top: 10px; bottom: 10px; right: 10px; width: 68%; border-radius: 10px; background: #161616; border: 1px solid rgb(255 255 255 / .12); padding: 14px; display: grid; align-content: start; gap: 9px; transform: translateX(calc(100% + 14px)); }',
      P + '.ump-sheet i { display: block; height: 7px; border-radius: 4px; background: rgb(255 255 255 / .12); } ' + P + '.ump-sheet i:first-child { width: 55%; height: 9px; background: rgb(255 255 255 / .3); } ' + P + '.ump-sheet i:nth-child(3) { width: 80%; } ' + P + '.ump-sheet i:nth-child(4) { width: 65%; }',
      P + '.is-tr .ump-sheet { transition: transform calc(var(--d) * var(--k) * 1ms) var(--e); } ' + P + '.is-tr.open .ump-sheet { transform: none; }',
      P + '.is-kf.open .ump-sheet { animation: ump-in calc(var(--d) * var(--k) * 1ms) var(--e) forwards; } ' + P + '.is-kf.closing .ump-sheet { animation: ump-out calc(var(--d) * var(--k) * 1ms) var(--e) forwards; }',
      '@keyframes ump-in { from { transform: translateX(calc(100% + 14px)); } to { transform: none; } } @keyframes ump-out { from { transform: none; } to { transform: translateX(calc(100% + 14px)); } }',
      /* list specimen */
      P + '.ump-list { position: absolute; inset: 0; display: grid; grid-auto-rows: 1fr; }',
      P + '.ump-list > b { font-weight: 400; position: relative; z-index: 1; display: flex; align-items: center; padding: 0 12px; font-size: 13px; color: rgb(255 255 255 / .8); }',
      P + '.ump-hl { position: absolute; left: 0; right: 0; top: 0; height: 20%; border-radius: 8px; background: rgb(255 255 255 / .09); box-shadow: inset 2px 0 0 #f97316; transition: transform calc(var(--d) * var(--k) * 1ms) var(--e); }',
      /* bottom bar */
      P + '.ump-bar { display: flex; align-items: center; gap: 12px; }',
      P + '.ump-rule { flex: 1; margin: 0; font-size: 13.5px; line-height: 1.45; color: rgb(255 255 255 / .8); min-width: 0; }',
      P + '.ump-ctl { display: flex; gap: 8px; flex: none; }',
      P + '.ump-ctl button { min-height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .16); color: rgb(255 255 255 / .85); transition: transform .16s cubic-bezier(.25,.46,.45,.94), background-color .16s, color .16s, border-color .16s; touch-action: manipulation; }',
      P + '.ump-ctl button:active { transform: scale(.97); } ' + P + '.ump-ctl .ump-play { background: #fff; color: #000; border-color: #fff; } ' + P + '.ump-ctl [aria-pressed="true"] { border-color: #f97316; color: #f97316; }',
      P + '.ump-ctl .ump-arrow { width: 36px; padding: 0; } ' + P + '.ump-ctl .ump-arrow[hidden] { display: none; }',
      '@media (hover: hover) { ' + P + '.ump-ctl button:not(.ump-play):hover { color: #fff; border-color: rgb(255 255 255 / .4); } }',
      P + '.ump-note { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); margin: 0; color: rgb(255 255 255 / .4); }',
      '@container (max-width: 560px) { ' + P + '.ump-bar { flex-direction: column; align-items: stretch; gap: 10px; } ' + P + '.ump-rule { font-size: 12.5px; } ' + P + '.ump-ctl { justify-content: flex-end; } ' + P + '.ump-panes { gap: 8px; } ' + P + '.ump-menu b { padding: 6px 8px; font-size: 12px; } ' + P + '.ump-val { font-size: 10px; } ' + P + '.ump-menu { width: 100%; } }',
      /* reduced motion: every specimen only fades */
      P + '.rm .ump-menu, ' + P + '.rm .is-pop .ump-menu { transform: none !important; transition: opacity 150ms ease !important; } ' + P + '.rm .is-pop.solid:not(.open) .ump-menu { opacity: 0; }',
      P + '.rm .ump-sheet { transform: none !important; animation: none !important; opacity: 0; transition: opacity 150ms ease !important; } ' + P + '.rm .open .ump-sheet { opacity: 1; } ' + P + '.rm .ump-hl { transition: none !important; }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var X = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
      var V = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5l2.3 2.3L9.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      stage.innerHTML = '<div class="ump' + (ctx.reduced ? ' rm' : '') + '" style="--k:1">' +
        '<div class="ump-tabs label" role="tablist" aria-label="Motion principles">' + TABS.map(function (t, i) {
          return '<button type="button" role="tab" class="label" id="ump-t-' + t.id + '" aria-controls="ump-panel" aria-selected="' + (i ? 'false' : 'true') + '" tabindex="' + (i ? -1 : 0) + '"><i>' + String(i + 1).padStart(2, '0') + '</i>' + t.name + '</button>';
        }).join('') + '</div>' +
        '<div class="ump-panes" id="ump-panel" role="tabpanel" aria-labelledby="ump-t-easing"></div>' +
        '<div class="ump-bar"><p class="ump-rule" aria-live="polite"></p><div class="ump-ctl label">' +
          '<button type="button" class="label ump-arrow" data-move="-1" aria-label="Move highlight up" hidden>↑</button><button type="button" class="label ump-arrow" data-move="1" aria-label="Move highlight down" hidden>↓</button>' +
          '<button type="button" class="label" data-slow aria-pressed="false">Slow ×4</button><button type="button" class="label ump-play">Play ▶</button></div></div>' +
        '</div>';
      var root = stage.querySelector('.ump'), panes = stage.querySelector('.ump-panes'), rule = stage.querySelector('.ump-rule');
      var tabs = [].slice.call(stage.querySelectorAll('[role=tab]')), arrows = [].slice.call(stage.querySelectorAll('.ump-arrow'));
      var cur = 0, timers = [], k = 1, idx = 0, played = false;
      var later = function (fn, ms) { timers.push(setTimeout(fn, ms * k)); };
      var clear = function () { timers.forEach(clearTimeout); timers = []; };

      function frameHTML(t, side) {
        var c = t[side], style = '--d:' + c.d + ';--e:' + c.e + (c.s != null ? ';--s:' + c.s : '') + (c.o ? ';--o:' + c.o : '');
        var body = '', cls = 'ump-frame';
        if (t.kind === 'menu') body = MENU;
        if (t.kind === 'pop') { body = MENU.replace('Options', 'Share').replace('<b>Rename…</b>', '<b>Copy link</b>').replace('<b>Move to…</b>', ''); cls += ' is-pop' + (c.f ? ' solid' : ''); }
        if (t.kind === 'sheet') { body = '<span class="ump-sheet" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><p class="ump-note label">' + (side === 'bad' ? 'Keyframes' : 'Transition') + '</p>'; cls += side === 'bad' ? ' is-kf' : ' is-tr'; }
        if (t.kind === 'list') body = '<span class="ump-list"><span class="ump-hl" aria-hidden="true"></span>' + ITEMS.map(function (x) { return '<b>' + x + '</b>'; }).join('') + '</span>';
        if (t.kind !== 'sheet') body = '<span class="ump-spec">' + body + '</span>';
        return '<div class="ump-pane ump-' + side + '"><p class="ump-head label">' + (side === 'bad' ? X + 'Avoid' : V + 'Prefer') + '</p>' +
          '<div class="' + cls + '" style="' + style + '" aria-hidden="true">' + body + '</div><p class="ump-val mono">' + c.v + '</p></div>';
      }
      function frames() { return [].slice.call(panes.querySelectorAll('.ump-frame')); }
      function select(i, focus) {
        clear(); cur = i; idx = 0;
        tabs.forEach(function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); b.tabIndex = j === i ? 0 : -1; });
        if (focus) tabs[i].focus();
        var tl = tabs[i].parentNode, b = tabs[i]; // keep the tab visible without ever scrolling the page
        if (b.offsetLeft < tl.scrollLeft) tl.scrollLeft = b.offsetLeft - 4; else if (b.offsetLeft + b.offsetWidth > tl.scrollLeft + tl.clientWidth) tl.scrollLeft = b.offsetLeft + b.offsetWidth - tl.clientWidth + 4;
        var t = TABS[i];
        panes.setAttribute('aria-labelledby', 'ump-t-' + t.id);
        panes.innerHTML = frameHTML(t, 'bad') + frameHTML(t, 'good');
        rule.textContent = t.rule;
        arrows.forEach(function (a) { a.hidden = t.kind !== 'list'; });
      }
      function setOpen(on) { frames().forEach(function (f) { f.classList.toggle('open', on); }); }
      function move(d) {
        idx = ctx.clamp(idx + d, 0, ITEMS.length - 1);
        frames().forEach(function (f) { var hl = f.querySelector('.ump-hl'); hl.style.transform = 'translateY(' + idx * 100 + '%)'; });
      }
      function play() {
        clear();
        var t = TABS[cur];
        if (t.kind === 'menu' || t.kind === 'pop') {
          setOpen(false); void panes.offsetWidth;
          setOpen(true); later(function () { setOpen(false); }, Math.max(t.bad.d, t.good.d) + 900);
        } else if (t.kind === 'sheet') {
          // open, then interrupt with close at 40% of the way
          var fs = frames(); fs.forEach(function (f) { f.classList.remove('open', 'closing'); }); void panes.offsetWidth;
          fs.forEach(function (f) { f.classList.add('open'); });
          later(function () { fs.forEach(function (f) { f.classList.remove('open'); if (f.classList.contains('is-kf')) f.classList.add('closing'); }); }, t.good.d * .4);
          later(function () { fs.forEach(function (f) { f.classList.add('open'); f.classList.remove('closing'); }); }, t.good.d * .4 + 160);
        } else if (t.kind === 'list') {
          idx = 0; move(0);
          for (var s = 1; s <= 8; s++) (function (s) { later(function () { move(s <= 4 ? 1 : -1); }, s * 70); })(s);
        }
      }

      stage.querySelector('.ump-tabs').addEventListener('click', function (e) { var b = e.target.closest('[role=tab]'); if (b) select(tabs.indexOf(b)); });
      stage.querySelector('.ump-tabs').addEventListener('keydown', function (e) {
        var n = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (e.key === 'Home') { e.preventDefault(); select(0, true); } else if (e.key === 'End') { e.preventDefault(); select(TABS.length - 1, true); }
        else if (n) { e.preventDefault(); select((cur + n + TABS.length) % TABS.length, true); }
      });
      stage.querySelector('.ump-play').addEventListener('click', play);
      stage.querySelector('[data-slow]').addEventListener('click', function (e) {
        var b = e.currentTarget, on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false'); k = on ? 4 : 1; root.style.setProperty('--k', k);
      });
      arrows.forEach(function (a) { a.addEventListener('click', function () { move(+a.dataset.move); }); });
      // arrow keys drive both lists on the Frequency tab (not while a tab has focus: tabs use ←/→)
      stage.addEventListener('keydown', function (e) {
        if (TABS[cur].kind !== 'list' || e.target.closest('[role=tab]')) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); move(e.key === 'ArrowDown' ? 1 : -1); }
      });
      select(0);

      return {
        start: function () { if (!played && !ctx.reduced) { played = true; later(play, 600); } },
        stop: function () { clear(); frames().forEach(function (f) { f.classList.remove('open', 'closing'); }); },
        replay: play
      };
    }
  });
})();
