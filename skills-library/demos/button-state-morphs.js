/* button-state-morphs — four specimens: async save, copy → check, hold to delete, toggle + disabled */
(function () {
  var ID = 'button-state-morphs';
  var P = '.d-' + ID + ' ';
  var EO = 'cubic-bezier(.23,1,.32,1)';
  var SVG = {
    spin: '<svg class="bsm-spin" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/><path d="M14 8a6 6 0 0 0-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    check: '<svg class="bsm-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pathLength="20"/></svg>',
    copy: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    alert: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.8v3.6M8 10.9v.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    trash: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4.5h11M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4 4.5l.7 8.6a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9l.7-8.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  Lib.register(ID, {
    hint: 'Save (try “Fail next”), copy the command, press and hold Delete, toggle Follow. Keyboard: Tab, then Space or Enter; hold Space to delete.',
    notes: [
      'Press: <code>:active { transform: scale(.97) }</code>, <b>160 ms</b> ease-out-quad, never on <code>:disabled</code> (Linear ships exactly this)',
      'All labels sit in one grid cell, so idle → “Saving…” → “Saved” never changes the width; swaps are <b>200 ms</b> ease-out with a 2 px blur',
      'Spinner only after a <b>200 ms</b> show-delay, then visible at least <b>500 ms</b>; status goes to a polite live region',
      'Copy shows an inline check for <b>2 s</b>, not a toast; the check draws over 250 ms',
      'Hold to delete: <code>clip-path</code> fill, <b>1.5 s linear</b> while held, <b>200 ms ease-out</b> back on release; commit on <code>transitionend</code>, then Undo'
    ],
    simplified: 'The save request is simulated with a random 700–1300 ms delay; clipboard falls back to execCommand when the async API is blocked.',
    css: [
      '.d-button-state-morphs { container-type: inline-size; }',
      P + '.bsm { position: absolute; inset: 0; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 1px; background: rgb(255 255 255 / .09); }',
      P + '.bsm-c { position: relative; background: #000; display: flex; flex-direction: column; padding: 16px 18px; min-width: 0; min-height: 0; }',
      P + '.bsm-s { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 0; }',
      P + '.bsm-cap { margin: 0; display: flex; gap: 10px; align-items: baseline; } ' + P + '.bsm-cap i { font-style: normal; color: #f97316; }',
      P + '.bsm-cap b { font-weight: 500; color: rgb(255 255 255 / .85); } ' + P + '.bsm-cap span { color: rgb(255 255 255 / .58); letter-spacing: .1em; text-transform: none; }',
      /* shared button */
      P + '.bsm-b { position: relative; display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: 0 18px; border-radius: 10px; font-family: Archivo, sans-serif; font-size: 14px; font-weight: 500; letter-spacing: -.005em; white-space: nowrap; overflow: hidden; touch-action: manipulation; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none;',
      '  transition: transform .16s cubic-bezier(.25,.46,.45,.94), background-color .16s cubic-bezier(.25,.46,.45,.94), color .16s, border-color .16s, opacity .16s; }',
      P + '.bsm-b:not(:disabled):not([aria-disabled="true"]):is(:active, [data-pressed]) { transform: scale(.97); }',
      P + '.bsm-b:disabled { opacity: .5; cursor: not-allowed; }',
      P + '.bsm-b:focus-visible { outline: none; box-shadow: 0 0 0 2px #000, 0 0 0 4px #f97316; }',
      P + '.bsm-pri { background: #fff; color: #000; } @media (hover: hover) { ' + P + '.bsm-pri:not([aria-disabled="true"]):hover { background: rgb(255 255 255 / .88); } }',
      P + '.bsm-sec { background: rgb(255 255 255 / .06); color: rgb(255 255 255 / .9); border: 1px solid rgb(255 255 255 / .14); } @media (hover: hover) { ' + P + '.bsm-sec:not(:disabled):hover { background: rgb(255 255 255 / .1); } }',
      P + '.bsm-b svg { width: 16px; height: 16px; flex: none; }',
      /* width-stable label stack */
      P + '.bsm-stack { display: grid; } ' + P + '.bsm-stack > * { grid-area: 1 / 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; opacity: 0; transform: translateY(7px) scale(.96); filter: blur(2px); transition: opacity .2s ' + EO + ', transform .2s ' + EO + ', filter .2s ' + EO + '; }',
      P + '.bsm-stack > .out { transform: translateY(-7px) scale(.96); }',
      P + '[data-state="idle"] [data-for="idle"], ' + P + '[data-state="pending"] [data-for="idle"], ' + P + '[data-state="loading"] [data-for="loading"], ' + P + '[data-state="success"] [data-for="success"], ' + P + '[data-state="error"] [data-for="error"], ' + P + '[aria-pressed="false"] [data-for="off"], ' + P + '[aria-pressed="true"] [data-for="on"], ' + P + '[data-state="deleted"] [data-for="deleted"], ' + P + '[data-state="ready"] [data-for="ready"] { opacity: 1; transform: none; filter: none; }',
      P + '.bsm-spin { animation: bsm-rot .7s linear infinite; } @keyframes bsm-rot { to { transform: rotate(360deg); } }',
      P + '.paused .bsm-spin { animation-play-state: paused; }',
      P + '.bsm-check path { stroke-dasharray: 20; stroke-dashoffset: 20; transition: stroke-dashoffset .25s ease-out .08s; }',
      P + '[data-state="success"] .bsm-check path, ' + P + '[data-state="deleted"] .bsm-check path, ' + P + '[data-copied="true"] .bsm-check path, ' + P + '[aria-pressed="true"] .bsm-check path { stroke-dashoffset: 0; }',
      P + '.bsm-save[data-state="error"], ' + P + '.bsm-save[data-state="error"]:hover { background: rgb(255 255 255 / .06); color: #fff; box-shadow: inset 0 0 0 1px rgb(249 115 22 / .7); }',
      P + '.bsm-status { margin: 0; min-height: 1.4em; color: rgb(255 255 255 / .5); text-align: center; }',
      P + '.bsm-status.err { color: #f97316; }',
      P + '.bsm-fail { display: inline-flex; align-items: center; gap: 8px; padding: 6px 2px; color: rgb(255 255 255 / .5); }',
      P + '.bsm-fail i { width: 26px; height: 15px; border-radius: 99px; background: rgb(255 255 255 / .16); position: relative; transition: background-color .16s; }',
      P + '.bsm-fail i::after { content: ""; position: absolute; top: 2px; left: 2px; width: 11px; height: 11px; border-radius: 50%; background: #fff; transition: transform .16s cubic-bezier(.25,.46,.45,.94); }',
      P + '.bsm-fail[aria-pressed="true"] { color: rgb(255 255 255 / .85); } ' + P + '.bsm-fail[aria-pressed="true"] i { background: #f97316; } ' + P + '.bsm-fail[aria-pressed="true"] i::after { transform: translateX(11px); }',
      /* copy chip */
      P + '.bsm-code { display: inline-flex; align-items: center; gap: 4px; padding: 4px 4px 4px 14px; border-radius: 12px; background: rgb(255 255 255 / .05); border: 1px solid rgb(255 255 255 / .1); max-width: 100%; }',
      P + '.bsm-code code { background: none; padding: 0; color: rgb(255 255 255 / .85); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } ' + P + '.bsm-code code::before { content: "$ "; color: rgb(255 255 255 / .35); }',
      P + '.bsm-icon { width: 36px; min-height: 36px; padding: 0; border-radius: 8px; color: rgb(255 255 255 / .7); flex: none; } @media (hover: hover) { ' + P + '.bsm-icon:hover { background: rgb(255 255 255 / .08); color: #fff; } }',
      P + '.bsm-icon .bsm-stack > * { transform: scale(.8); } ' + P + '.bsm-icon .bsm-stack > .out { transform: scale(.8); }',
      P + '.bsm-icon[data-copied="false"] [data-for="copy"], ' + P + '.bsm-icon[data-copied="true"] [data-for="done"] { opacity: 1; transform: none; filter: none; } ' + P + '.bsm-icon[data-copied="true"] { color: #fff; }',
      /* hold to delete */
      P + '.bsm-row { display: flex; align-items: center; gap: 10px; width: min(250px, 100%); padding: 9px 12px; border-radius: 10px; background: rgb(255 255 255 / .04); color: rgb(255 255 255 / .85); font-size: 13px; transition: opacity .3s, filter .3s; }',
      P + '.bsm-row small { margin-left: auto; color: rgb(255 255 255 / .58); font-size: 12px; } ' + P + '.bsm-row.gone { opacity: .3; filter: blur(.5px); } ' + P + '.bsm-row.gone span { text-decoration: line-through; }',
      P + '.bsm-hold-wrap { display: flex; align-items: center; gap: 8px; }',
      P + '.bsm-hold { -webkit-touch-callout: none; } ' + P + '.bsm-hold .bsm-fill { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; background: #f97316; color: #000; clip-path: inset(0 100% 0 0); transition: clip-path .2s ease-out; pointer-events: none; }',
      P + '.bsm-hold.holding .bsm-fill { clip-path: inset(0 0 0 0); transition: clip-path 1.5s linear; }',
      P + '.bsm-hold[data-state="deleted"] .bsm-fill { opacity: 0; transition: opacity .2s; }',
      P + '.bsm-undo { min-height: 40px; padding: 0 12px; opacity: 0; transform: translateX(-6px); pointer-events: none; transition: opacity .2s ' + EO + ', transform .2s ' + EO + ', color .16s; color: rgb(255 255 255 / .8); border-radius: 10px; }',
      P + '.bsm-undo.on { opacity: 1; transform: none; pointer-events: auto; } ' + P + '.bsm-undo:focus-visible { outline: none; box-shadow: 0 0 0 2px #f97316; }',
      /* toggle */
      P + '.bsm-tg { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }',
      P + '.bsm-follow[aria-pressed="true"] { background: #fff; color: #000; border-color: #fff; }',
      P + '.bsm-vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }',
      '@container (max-width: 560px) { ' + P + '.bsm { grid-template-columns: 1fr; grid-template-rows: repeat(4, 1fr); } ' + P + '.bsm-c { padding: 10px 14px; flex-direction: row; align-items: center; gap: 12px; } ' + P + '.bsm-cap { flex-direction: column; gap: 2px; width: 34%; flex: none; } ' + P + '.bsm-cap span { display: none; } ' + P + '.bsm-s { gap: 6px; align-items: flex-end; } ' + P + '.bsm-row { display: none; } ' + P + '.bsm-status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; } ' + P + '.bsm-tg { flex-wrap: nowrap; gap: 8px; } ' + P + '.bsm-tg .bsm-b { padding: 0 12px; } ' + P + '.bsm-b { min-height: 38px; padding: 0 14px; font-size: 13px; } ' + P + '.bsm-code { padding-left: 10px; } ' + P + '.bsm-code code { font-size: 12px; } }',
      '@media (prefers-reduced-motion: reduce) { ' + P + '.bsm-stack > *, ' + P + '.bsm-stack > .out, ' + P + '.bsm-icon .bsm-stack > * { transform: none !important; filter: none !important; } ' + P + '.bsm-b:is(:active, [data-pressed]) { transform: none !important; filter: brightness(.9); } ' + P + '.bsm-spin { display: none; } ' + P + '.bsm-check path { transition: none; } ' + P + '.bsm-undo { transform: none; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var cell = function (n, name, rule, body) {
        return '<div class="bsm-c"><p class="label bsm-cap"><i>' + String(n).padStart(2, '0') + '</i><b>' + name + '</b><span>' + rule + '</span></p><div class="bsm-s">' + body + '</div></div>';
      };
      stage.innerHTML = '<div class="bsm">' +
        cell(1, 'Async save', 'width-stable · 200 ms show-delay',
          '<button type="button" class="bsm-b bsm-pri bsm-save" data-state="idle"><span class="bsm-stack">' +
            '<span data-for="idle">Save changes</span>' +
            '<span data-for="loading" aria-hidden="true">' + SVG.spin + 'Saving…</span>' +
            '<span data-for="success" aria-hidden="true">' + SVG.check + 'Saved</span>' +
            '<span data-for="error" aria-hidden="true">' + SVG.alert + 'Retry</span></span></button>' +
          '<p class="bsm-status label" aria-live="polite">2 unsaved changes</p>' +
          '<button type="button" class="bsm-fail label" aria-pressed="false"><i aria-hidden="true"></i>Fail next</button>') +
        cell(2, 'Copy → check', 'inline, 2 s, no toast',
          '<div class="bsm-code"><code class="mono">npm i number-flow</code>' +
          '<button type="button" class="bsm-b bsm-icon" data-copied="false" aria-label="Copy install command"><span class="bsm-stack"><span data-for="copy">' + SVG.copy + '</span><span data-for="done">' + SVG.check + '</span></span></button></div>' +
          '<p class="bsm-status label bsm-cstat" aria-live="polite">Click to copy</p>') +
        cell(3, 'Hold to delete', '1.5 s linear · 200 ms back',
          '<div class="bsm-row"><span>launch-notes.md</span><small>24 KB</small></div>' +
          '<div class="bsm-hold-wrap"><button type="button" class="bsm-b bsm-sec bsm-hold" data-state="ready" aria-describedby="bsm-hold-d">' +
            '<span class="bsm-stack"><span data-for="ready">' + SVG.trash + 'Hold to delete</span><span data-for="deleted" aria-hidden="true">' + SVG.check + 'Deleted</span></span>' +
            '<span class="bsm-fill" aria-hidden="true">' + SVG.trash + 'Hold to delete</span></button>' +
          '<button type="button" class="bsm-undo label" tabindex="-1">Undo</button></div>' +
          '<p class="bsm-vh" id="bsm-hold-d">Press and hold for 1.5 seconds to delete launch-notes.md</p><p class="bsm-vh bsm-hstat" aria-live="polite"></p>') +
        cell(4, 'Toggle', 'aria-pressed · disabled has no press',
          '<div class="bsm-tg"><button type="button" class="bsm-b bsm-sec bsm-follow" aria-pressed="false"><span class="bsm-stack"><span data-for="off">Follow</span><span data-for="on" aria-hidden="true">' + SVG.check + 'Following</span></span></button>' +
          '<button type="button" class="bsm-b bsm-sec" disabled>Archived</button></div>' +
          '<p class="bsm-status label bsm-fstat" aria-live="polite">Not following</p>') +
        '</div>';

      var $ = function (s) { return stage.querySelector(s); };
      var timers = [];
      var later = function (fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; };
      var clearAll = function () { timers.forEach(clearTimeout); timers = []; };

      // mark the label that is leaving so it exits upward while the new one rises in
      var KEYS = { 'aria-pressed': { 'true': 'on', 'false': 'off' }, 'data-copied': { 'true': 'done', 'false': 'copy' }, 'data-state': { pending: 'idle' } };
      function swapState(btn, attr, next) {
        var prev = btn.getAttribute(attr), map = KEYS[attr] || {};
        if (prev === next) return;
        var from = map[prev] || prev, to = map[next] || next;
        btn.querySelectorAll('.bsm-stack > *').forEach(function (s) {
          var on = s.dataset.for === to;
          s.classList.toggle('out', s.dataset.for === from && !on);
          s.setAttribute('aria-hidden', on ? 'false' : 'true');
        });
        btn.setAttribute(attr, next);
      }
      // press mirror: touch + Space key get the same .97 as :active
      stage.addEventListener('pointerdown', function (e) { var b = e.target.closest('.bsm-b'); if (b) b.setAttribute('data-pressed', ''); });
      var unpress = function () { stage.querySelectorAll('[data-pressed]').forEach(function (b) { b.removeAttribute('data-pressed'); }); };
      stage.addEventListener('pointerup', unpress); stage.addEventListener('pointercancel', unpress); stage.addEventListener('pointerleave', unpress);
      stage.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && e.target.classList.contains('bsm-b')) e.target.setAttribute('data-pressed', ''); });
      stage.addEventListener('keyup', unpress);

      /* 1 — async save */
      var save = $('.bsm-save'), status = $('.bsm-status'), fail = $('.bsm-fail'), shownAt = 0;
      function setSave(s, msg, err) {
        swapState(save, 'data-state', s);
        var busy = s === 'pending' || s === 'loading';
        save.setAttribute('aria-disabled', busy ? 'true' : 'false');
        save.setAttribute('aria-busy', busy ? 'true' : 'false');
        if (msg != null) { status.textContent = msg; status.classList.toggle('err', !!err); }
      }
      save.addEventListener('click', function () {
        var s = save.getAttribute('data-state');
        if (s === 'pending' || s === 'loading') return;           // no duplicate submits
        var willFail = fail.getAttribute('aria-pressed') === 'true';
        setSave('pending', null);
        var net = 700 + Math.random() * 600, done = false;
        later(function () { if (!done) { setSave('loading', 'Saving…'); shownAt = performance.now(); } }, 200);
        later(function () {
          done = true;
          var wait = save.getAttribute('data-state') === 'loading' ? Math.max(0, 500 - (performance.now() - shownAt)) : 0;
          later(function () {
            if (willFail) {
              setSave('error', 'Couldn’t save. Retry?', true);
              if (!ctx.reduced) save.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(0)' }], { duration: 300, easing: 'ease-out' });
            } else {
              setSave('success', 'All changes saved');
              later(function () { setSave('idle', null); }, 2000);
            }
          }, wait);
        }, net);
      });
      fail.addEventListener('click', function () { fail.setAttribute('aria-pressed', fail.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); });

      /* 2 — copy */
      var copyBtn = $('.bsm-icon'), cstat = $('.bsm-cstat'), copyT = 0, text = 'npm i number-flow';
      function fallbackCopy() {
        var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok;
      }
      function copied(ok) {
        if (!ok) { cstat.textContent = 'Press ⌘C / Ctrl+C to copy'; var r = document.createRange(); r.selectNodeContents($('.bsm-code code')); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); return; }
        if (copyBtn.getAttribute('data-copied') !== 'true') swapState(copyBtn, 'data-copied', 'true');
        cstat.textContent = 'Copied to clipboard';
        clearTimeout(copyT);
        copyT = later(function () { swapState(copyBtn, 'data-copied', 'false'); cstat.textContent = 'Click to copy'; }, 2000);
      }
      copyBtn.addEventListener('click', function () {
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { copied(true); }, function () { copied(fallbackCopy()); });
        else copied(fallbackCopy());
      });

      /* 3 — hold to delete */
      var hold = $('.bsm-hold'), fill = $('.bsm-fill'), undo = $('.bsm-undo'), row = $('.bsm-row'), hstat = $('.bsm-hstat'), holding = false, undoT = 0;
      function startHold() { if (hold.getAttribute('data-state') !== 'ready') return; holding = true; hold.classList.add('holding'); }
      function endHold() { if (!holding) return; holding = false; hold.classList.remove('holding'); }
      fill.addEventListener('transitionend', function (e) {
        if (e.propertyName !== 'clip-path' || !holding) return;
        holding = false; hold.classList.remove('holding');
        swapState(hold, 'data-state', 'deleted'); row.classList.add('gone');
        hstat.textContent = 'launch-notes.md deleted. Undo available for 5 seconds.';
        undo.classList.add('on'); undo.tabIndex = 0;
        clearTimeout(undoT); undoT = later(restore, 5000);
      });
      function restore() {
        clearTimeout(undoT);
        swapState(hold, 'data-state', 'ready'); row.classList.remove('gone');
        var hadFocus = document.activeElement === undo;
        undo.classList.remove('on'); undo.tabIndex = -1;
        if (hadFocus) hold.focus();
      }
      undo.addEventListener('click', function () { restore(); hstat.textContent = 'Restored launch-notes.md'; });
      hold.addEventListener('pointerdown', function (e) { if (e.button !== 0) return; try { hold.setPointerCapture(e.pointerId); } catch (x) {} startHold(); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { hold.addEventListener(t, endHold); });
      hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      hold.addEventListener('keydown', function (e) { if (e.key !== ' ' && e.key !== 'Enter') return; e.preventDefault(); if (!e.repeat) startHold(); });
      hold.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); endHold(); } });
      hold.addEventListener('blur', endHold);

      /* 4 — toggle */
      var follow = $('.bsm-follow'), fstat = $('.bsm-fstat');
      follow.addEventListener('click', function () {
        var on = follow.getAttribute('aria-pressed') !== 'true';
        swapState(follow, 'aria-pressed', on ? 'true' : 'false');
        fstat.textContent = on ? 'Following · updates on' : 'Not following';
      });

      return {
        start: function () { stage.classList.remove('paused'); },
        stop: function () {
          stage.classList.add('paused'); endHold(); unpress();
          // settle every async state so nothing is left mid-flight
          clearAll(); clearTimeout(copyT);
          var s = save.getAttribute('data-state'); if (s !== 'idle' && s !== 'error') setSave('idle', s === 'success' ? null : '2 unsaved changes');
          if (copyBtn.getAttribute('data-copied') === 'true') { swapState(copyBtn, 'data-copied', 'false'); cstat.textContent = 'Click to copy'; }
          if (hold.getAttribute('data-state') === 'deleted') restore();
        }
      };
    }
  });
})();
