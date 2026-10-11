/* reticle-cursor — playground for the page's global reticle; autopilot reticle on touch screens */
(function () {
  var ID = 'reticle-cursor';
  var SNAP = 'a, button, [role=slider], [role=tab], input, summary, [data-snap]';

  Lib.register(ID, {
    hint: 'Move the mouse over the targets: brackets snap around controls, shrink when you press, and pick up labels from data-cursor.',
    notes: [
      'Only on <code>(pointer: fine)</code> without reduced motion, and only after the intro; touch keeps the system cursor',
      'Idle box ±11 px (22 px), pressed ±7 px (14 px); snapped box = the target’s rect expanded by 6 px',
      'Corners ease with <code>k = 1 − exp(−24·dt)</code>, dt clamped to 50 ms; the 3 px dot follows the raw pointer with no lag',
      'Label = the target’s <code>data-cursor</code>, else a default only when not snapped; pill sits centred 10 px under the box',
      'Everything moves with <code>translate3d</code>; the only layout read is the hovered element’s <code>getBoundingClientRect</code>'
    ],
    simplified: 'The reticle is the page’s real one. On touch screens the stage runs an autopilot copy so you can still see the behaviour.',
    css: [
      '.d-reticle-cursor .rc { position: absolute; inset: 0; container-type: inline-size; padding: clamp(18px, 4.5cqw, 40px); display: grid; grid-template-rows: auto 1fr auto; gap: 18px; }',
      '.d-reticle-cursor .rc-top { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; color: rgb(255 255 255 / .45); }',
      '.d-reticle-cursor .rc-top b { font-weight: 500; color: #f97316; }',
      '.d-reticle-cursor .rc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(14px, 3cqw, 28px); min-height: 0; }',
      '.d-reticle-cursor .rc-col { display: flex; flex-direction: column; gap: 16px; justify-content: center; min-width: 0; }',
      '.d-reticle-cursor .rc-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }',
      '.d-reticle-cursor .rc-btn { padding: 12px 18px; border-radius: 999px; transition: transform .2s var(--ease-out), background .3s, border-color .3s, color .3s; }',
      '.d-reticle-cursor .rc-btn:active { transform: scale(.97); }',
      '.d-reticle-cursor .rc-pri { background: #fff; color: #000; } .d-reticle-cursor .rc-pri:hover { background: #f97316; }',
      '.d-reticle-cursor .rc-gho { border: 1px solid rgb(255 255 255 / .3); color: rgb(255 255 255 / .85); } .d-reticle-cursor .rc-gho:hover { border-color: #fff; color: #fff; }',
      '.d-reticle-cursor .rc-ico { width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .3); display: grid; place-items: center; font-size: 12px; color: rgb(255 255 255 / .8); }',
      '.d-reticle-cursor .rc-btn[disabled] { opacity: .35; cursor: not-allowed; }',
      '.d-reticle-cursor [role=tablist] { display: flex; gap: 20px; }',
      '.d-reticle-cursor [role=tab] { position: relative; padding: 8px 0; color: rgb(255 255 255 / .45); }',
      '.d-reticle-cursor [role=tab][aria-selected=true] { color: #fff; }',
      '.d-reticle-cursor [role=tab]::after { content: ""; position: absolute; left: 0; right: 0; bottom: 2px; height: 1px; background: #f97316; transform: scaleX(0); transform-origin: left; transition: transform .3s var(--ease-out); }',
      '.d-reticle-cursor [role=tab][aria-selected=true]::after { transform: scaleX(1); }',
      '.d-reticle-cursor .rc-range { display: grid; gap: 8px; color: rgb(255 255 255 / .45); }',
      '.d-reticle-cursor .rc-range span { display: flex; justify-content: space-between; } .d-reticle-cursor .rc-range output { color: rgb(255 255 255 / .9); }',
      '.d-reticle-cursor input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 28px; background: transparent; margin: 0; touch-action: none; }',
      '.d-reticle-cursor input[type=range]::-webkit-slider-runnable-track { height: 1px; background: rgb(255 255 255 / .3); }',
      '.d-reticle-cursor input[type=range]::-moz-range-track { height: 1px; background: rgb(255 255 255 / .3); }',
      '.d-reticle-cursor input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; margin-top: -7px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px rgb(249 115 22 / .25); }',
      '.d-reticle-cursor input[type=range]::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 50%; background: #fff; }',
      '.d-reticle-cursor .rc-link { color: rgb(255 255 255 / .8); text-decoration: none; position: relative; padding: 6px 0; align-self: flex-start; }',
      '.d-reticle-cursor .rc-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: 2px; height: 1px; background: rgb(255 255 255 / .7); transform: scaleX(0); transform-origin: left; transition: transform .3s var(--ease-out); }',
      '.d-reticle-cursor .rc-link:hover::after, .d-reticle-cursor .rc-link:focus-visible::after { transform: scaleX(1); }',
      '.d-reticle-cursor .rc-link .ar { display: inline-block; color: #f97316; transition: transform .3s var(--ease-out); } .d-reticle-cursor .rc-link:hover .ar { transform: translate(2px, -2px); }',
      '.d-reticle-cursor .rc-tiles { display: grid; grid-template-rows: 1.3fr 1fr; gap: 12px; min-height: 0; }',
      '.d-reticle-cursor .rc-tile { position: relative; border-radius: 10px; border: 1px solid rgb(255 255 255 / .1); overflow: hidden; min-height: 70px; }',
      '.d-reticle-cursor .rc-tile .label { position: absolute; left: 12px; bottom: 10px; color: rgb(255 255 255 / .8); text-shadow: 0 1px 14px rgb(0 0 0 / .8); }',
      '.d-reticle-cursor .rc-tile .label i { display: block; font-style: normal; color: rgb(255 255 255 / .45); }',
      '.d-reticle-cursor .t1 { background: radial-gradient(60% 80% at 70% 90%, rgb(249 115 22 / .7), transparent 70%), radial-gradient(40% 40% at 72% 68%, #fed7aa, transparent 70%), linear-gradient(#0a0705, #1c0e05); }',
      '.d-reticle-cursor .t2 { background: repeating-linear-gradient(115deg, rgb(255 255 255 / .05) 0 2px, transparent 2px 14px), linear-gradient(135deg, #161616, #050505); }',
      '.d-reticle-cursor .t2::after { content: ""; position: absolute; left: 50%; top: 50%; border: 9px solid transparent; border-left: 14px solid rgb(255 255 255 / .85); transform: translate(-30%, -50%); }',
      '.d-reticle-cursor .rc-bar { display: flex; flex-wrap: wrap; gap: 6px 20px; color: rgb(255 255 255 / .45); border-top: 1px solid rgb(255 255 255 / .1); padding-top: 12px; }',
      '.d-reticle-cursor .rc-bar b { font-weight: 500; color: rgb(255 255 255 / .9); }',
      '.d-reticle-cursor .rc-note { color: rgb(255 255 255 / .7); display: flex; gap: 8px; align-items: center; }',
      '.d-reticle-cursor .rc-note::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #f97316; flex: none; }',
      '.d-reticle-cursor .ap { position: absolute; inset: 0; pointer-events: none; z-index: 5; }',
      '.d-reticle-cursor .ap i { position: absolute; left: 0; top: 0; width: 7px; height: 7px; border: 0 solid rgb(255 255 255 / .9); filter: drop-shadow(0 0 3px rgb(0 0 0 / .6)); }',
      '.d-reticle-cursor .ap i:nth-child(1) { border-width: 1px 0 0 1px; } .d-reticle-cursor .ap i:nth-child(2) { border-width: 1px 1px 0 0; } .d-reticle-cursor .ap i:nth-child(3) { border-width: 0 0 1px 1px; } .d-reticle-cursor .ap i:nth-child(4) { border-width: 0 1px 1px 0; }',
      '.d-reticle-cursor .ap b { position: absolute; left: -1.5px; top: -1.5px; width: 3px; height: 3px; border-radius: 50%; background: #fff; }',
      '.d-reticle-cursor .ap span { position: absolute; left: 0; top: 0; padding: 4px 10px; border-radius: 999px; background: rgb(0 0 0 / .6); color: rgb(255 255 255 / .9); white-space: nowrap; } .d-reticle-cursor .ap span:empty { display: none; }',
      '@container (max-width: 520px) { .d-reticle-cursor .rc-grid { grid-template-columns: 1fr; grid-template-rows: auto 1fr; } .d-reticle-cursor .rc-tiles { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; } .d-reticle-cursor .rc-btn { padding: 12px 14px; } .d-reticle-cursor .rc-col { gap: 12px; } .d-reticle-cursor .rc-dis { display: none; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var auto = !ctx.fine && !ctx.reduced;
      var note = ctx.reduced ? 'Reticle is off under reduced motion; targets still work' : !ctx.fine ? 'Desktop only (fine pointer). Autopilot preview' : '';
      stage.innerHTML =
        '<div class="rc"><div class="rc-top label">' + (note ? '<span class="rc-note">' + note + '</span>' : '<span>Playground · <b>' + 'move your mouse' + '</b></span><span>Dot 3 px · corners 7 px</span>') + '</div>' +
        '<div class="rc-grid"><div class="rc-col">' +
        '<div class="rc-row"><button type="button" class="rc-btn rc-pri label">Primary</button><button type="button" class="rc-btn rc-gho label">Ghost</button>' +
        '<button type="button" class="rc-ico" aria-label="Close">✕</button><button type="button" class="rc-btn rc-gho label rc-dis" disabled>Disabled</button></div>' +
        '<div role="tablist" aria-label="Playground tabs" class="label"><button type="button" role="tab" class="label" aria-selected="true" tabindex="0">Specification</button><button type="button" role="tab" class="label" aria-selected="false" tabindex="-1">About</button></div>' +
        '<label class="rc-range label"><span>Exposure <output>+0.0</output></span><input type="range" min="-20" max="20" value="0" data-cursor="Drag" aria-label="Exposure"></label>' +
        '<a class="rc-link label" href="https://github.com/Wrexist/molindesign/blob/main/.claude/skills/reticle-cursor/SKILL.md" target="_blank" rel="noopener noreferrer" data-cursor="Open">Read the skill <span class="ar" aria-hidden="true">↗</span></a>' +
        '</div><div class="rc-tiles"><div class="rc-tile t1" data-cursor="View"><span class="label"><i>data-cursor</i>View</span></div>' +
        '<div class="rc-tile t2" data-cursor="Play"><span class="label"><i>data-cursor</i>Play</span></div></div></div>' +
        '<div class="rc-bar label" aria-live="off"><span>Target <b class="o-t">none</b></span><span>Label <b class="o-l">—</b></span><span>Box <b class="o-b">22 px</b></span></div></div>';

      var oT = stage.querySelector('.o-t'), oL = stage.querySelector('.o-l'), oB = stage.querySelector('.o-b');
      var range = stage.querySelector('input[type=range]'), out = stage.querySelector('output');
      var tabs = Array.prototype.slice.call(stage.querySelectorAll('[role=tab]'));
      range.addEventListener('input', function () { var v = range.value / 10; out.textContent = (v >= 0 ? '+' : '') + v.toFixed(1); });
      function sel(t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; }); }
      tabs.forEach(function (t) {
        t.addEventListener('click', function () { sel(t); });
        t.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault(); var n = tabs[(tabs.indexOf(t) + 1) % 2]; sel(n); n.focus();
        });
      });
      function describe(t, lab, down) {
        oT.textContent = t ? (t.getAttribute('role') || t.tagName.toLowerCase()) + (t.disabled ? ' (disabled, no snap)' : '') : 'none';
        var l = t && t.getAttribute('data-cursor') || (!t || t.disabled ? lab && lab.getAttribute('data-cursor') : '') || '';
        oL.textContent = l || '—';
        if (t && !t.disabled) { var r = t.getBoundingClientRect(); oB.textContent = Math.round(r.width + 12) + ' × ' + Math.round(r.height + 12) + ' px'; }
        else oB.textContent = down ? '14 px (pressed)' : '22 px';
      }
      var down = false;
      function onMove(e) { if (e.pointerType !== 'mouse') return; describe(e.target.closest(SNAP), e.target.closest('[data-cursor]'), down); }
      function onDown(e) { if (e.pointerType !== 'mouse') return; down = true; onMove(e); }
      function onUp(e) { down = false; onMove(e); }
      stage.addEventListener('pointermove', onMove); stage.addEventListener('pointerdown', onDown); stage.addEventListener('pointerup', onUp);
      stage.addEventListener('pointerleave', function () { describe(null, null, false); });

      // autopilot reticle for coarse pointers: same maths, scoped to the stage
      var ap = null, lp = null, tId = 0;
      if (auto) {
        ap = ctx.el('div', 'ap'); ap.setAttribute('aria-hidden', 'true');
        ap.innerHTML = '<i></i><i></i><i></i><i></i><b></b><span class="label"></span>';
        stage.appendChild(ap);
        var cs = ap.querySelectorAll('i'), dot = ap.querySelector('b'), pill = ap.querySelector('span');
        var targets = [stage.querySelector('.rc-pri'), stage.querySelector('.rc-tile.t1'), range, stage.querySelector('.rc-ico'), stage.querySelector('.rc-tile.t2'), tabs[1], stage.querySelector('.rc-link')];
        var box = [40, 40, 62, 62], goal = [0, 0, 0, 0], m = { x: 60, y: 60, tx: 60, ty: 60 }, step = -1, hold = 0, pressT = 0;
        lp = ctx.loop(function (dt) {
          hold -= dt;
          var sr = stage.getBoundingClientRect();
          if (hold <= 0) { step = (step + 1) % targets.length; hold = 1.6; pressT = .9; }
          var tgt = targets[step], r = tgt.getBoundingClientRect();
          var snap = tgt.matches(SNAP);
          m.tx = r.left - sr.left + r.width * (snap ? .5 : .62); m.ty = r.top - sr.top + r.height * .5;
          m.x = ctx.damp(m.x, m.tx, 7, dt); m.y = ctx.damp(m.y, m.ty, 7, dt);
          var near = Math.hypot(m.tx - m.x, m.ty - m.y) < 18;
          var pressed = near && hold < pressT && hold > pressT - .18;
          var gg = pressed ? 7 : 11, sn = near && snap;
          goal[0] = sn ? r.left - sr.left - 6 : m.x - gg; goal[1] = sn ? r.top - sr.top - 6 : m.y - gg;
          goal[2] = sn ? r.right - sr.left + 6 : m.x + gg; goal[3] = sn ? r.bottom - sr.top + 6 : m.y + gg;
          var k = 1 - Math.exp(-24 * dt);
          for (var i = 0; i < 4; i++) box[i] += (goal[i] - box[i]) * k;
          var P = [[box[0], box[1]], [box[2] - 7, box[1]], [box[0], box[3] - 7], [box[2] - 7, box[3] - 7]];
          for (var j = 0; j < 4; j++) cs[j].style.transform = 'translate3d(' + P[j][0] + 'px,' + P[j][1] + 'px,0)';
          dot.style.transform = 'translate3d(' + m.x + 'px,' + m.y + 'px,0)';
          var txt = near ? tgt.getAttribute('data-cursor') || '' : '';
          if (pill.textContent !== txt) pill.textContent = txt;
          pill.style.transform = 'translate3d(' + ((box[0] + box[2]) / 2) + 'px,' + (box[3] + 10) + 'px,0) translateX(-50%)';
          if (tId !== step && near) { tId = step; describe(snap ? tgt : null, tgt.closest('[data-cursor]'), false); }
        });
      }

      return {
        start: function () { if (lp) lp.start(); },
        stop: function () { if (lp) lp.stop(); }
      };
    }
  });
})();
