/* char-split-scroll-reveal: vanilla split engine (chars / words / lines) + four presets, once-only trigger, hover re-roll, revert. */
(function () {
  var ID = 'char-split-scroll-reveal';
  var OUT = 'cubic-bezier(.165,.84,.44,1)';      // ≈ GSAP power3.out
  var INOUT = 'cubic-bezier(.76,0,.24,1)';       // ≈ GSAP power3.inOut
  var P3D = 'perspective(300px) ';
  var PRESETS = {
    '2d':     { name: '2D rise', from: 'translateY(105%)', to: 'translateY(0%)', out: 'translateY(-105%)', each: 0.02 },
    'x_2d':   { name: 'X slide', from: 'translateX(-105%)', to: 'translateX(0%)', out: 'translateX(105%)', each: 0.015 },
    '3d':     { name: '3D rise', from: P3D + 'translateY(105%) rotateX(20deg)', to: P3D + 'translateY(0%) rotateX(0deg)', out: P3D + 'translateY(-105%) rotateX(0deg)', each: 0.015 },
    'simple': { name: 'Fade', fade: true, each: 0.05 }
  };
  var MODE_EACH = { words: 0.06, lines: 0.1 };   // demo values for word/line targets
  var TEXT = 'Every letter earns its entrance.';

  function split(el, text) {
    el.textContent = '';
    el.setAttribute('aria-label', text);
    var words = [], chars = [];
    text.split(' ').forEach(function (w, wi) {
      var ws = document.createElement('span'); ws.className = 'w'; ws.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < w.length; i++) {
        var c = document.createElement('span'); c.className = 'c'; c.textContent = w[i];
        ws.appendChild(c); chars.push(c);
      }
      words.push(ws); el.appendChild(ws);
      if (wi < text.split(' ').length - 1) el.appendChild(document.createTextNode(' '));
    });
    // group words into lines by measured offsetTop, then wrap each line in a mask
    var rows = [], top = null;
    words.forEach(function (w) {
      if (top === null || Math.abs(w.offsetTop - top) > 4) { rows.push([]); top = w.offsetTop; }
      rows[rows.length - 1].push(w);
    });
    el.textContent = '';
    var lines = rows.map(function (row) {
      var mask = document.createElement('span'); mask.className = 'ln'; mask.setAttribute('aria-hidden', 'true');
      var inner = document.createElement('span'); inner.className = 'li';
      row.forEach(function (w, i) { if (i) inner.appendChild(document.createTextNode(' ')); inner.appendChild(w); });
      mask.appendChild(inner); el.appendChild(mask);
      return inner;
    });
    return { chars: chars, words: words, lines: lines };
  }
  function revert(el, text) { el.textContent = text; el.removeAttribute('aria-label'); }

  Lib.register(ID, {
    hint: 'Pick a preset, press Replay, hover the nav words',
    notes: [
      'Presets: <code>2d</code> y 105% → 0, stagger .02 · <code>x_2d</code> x −105%, stagger .015 · <code>3d</code> + rotationX 20 with <code>perspective: 300px</code> · <code>simple</code> fade, stagger .05',
      'Every entrance is 1.4 s <code>power3.out</code>; exits are .8 s, stagger .01, <code>power3.inOut</code>',
      'Fires once: start = <code>top+=map(h/vh, 0..1, .3..0)×100% bottom</code>, capped at 30%, 0 if already on screen',
      'Hover re-roll: chars out .3 s, then a fresh copy in .3 s (~0.6 s total); ignore re-entry while running',
      'Keep the stagger total under ~0.8 s (else <code>stagger: {amount: .6}</code>), <code>aria-label</code> the full string, and revert the split once it finishes'
    ],
    simplified: 'Web Animations API instead of GSAP + split-type; power3 approximated with cubic-bezier quart curves. The once-only trigger is the stage entering view, not ScrollTrigger. Word and line staggers (.06 / .1 s) are demo values.',
    css: [
      '.d-' + ID + ' { display: grid; grid-template-rows: auto 1fr auto; padding: 22px 24px 18px; gap: 12px; --fs: 64px; }',
      '.d-' + ID + ' .top { display: flex; justify-content: space-between; gap: 12px; color: rgb(255 255 255 / .45); }',
      '.d-' + ID + ' .top .accent { color: #f97316; }',
      '.d-' + ID + ' .mid { align-self: center; display: grid; gap: calc(var(--fs) * .45); }',
      '.d-' + ID + ' h4 { margin: 0; font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: var(--fs); line-height: 1.02; letter-spacing: -.035em; color: #fff; max-width: 13ch; }',
      '.d-' + ID + ' h4.pending { opacity: 0; }',
      '.d-' + ID + ' .ln { display: block; overflow: hidden; clip-path: inset(0); padding-block: .1em; margin-bottom: -.2em; }',
      '.d-' + ID + ' .ln:first-child { margin-top: -.1em; } .d-' + ID + ' .ln:last-child { margin-bottom: -.1em; }',
      '.d-' + ID + ' .li { display: block; }',
      '.d-' + ID + ' .w, .d-' + ID + ' .c { display: inline-block; vertical-align: top; white-space: pre; }',
      '.d-' + ID + ' h4:not(.animated) .c, .d-' + ID + ' h4:not(.animated) .li { will-change: transform; backface-visibility: hidden; }',
      '.d-' + ID + ' nav { display: flex; gap: 28px; flex-wrap: wrap; }',
      '.d-' + ID + ' nav button { font-family: Archivo, sans-serif; font-stretch: 112%; font-size: 15px; letter-spacing: .02em; color: rgb(255 255 255 / .7); padding: 8px 0; display: inline-flex; gap: 8px; align-items: baseline; }',
      '.d-' + ID + ' nav button i { font-style: normal; font-size: 10px; color: #f97316; letter-spacing: .1em; }',
      '.d-' + ID + ' nav button:hover, .d-' + ID + ' nav button:focus-visible { color: #fff; }',
      '.d-' + ID + ' nav .ln { display: inline-block; vertical-align: top; }',
      '.d-' + ID + ' .ctrl { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 18px; border-top: 1px solid rgb(255 255 255 / .1); padding-top: 12px; }',
      '.d-' + ID + ' .seg { display: inline-flex; flex-wrap: wrap; gap: 4px; }',
      '.d-' + ID + ' .seg button { padding: 7px 11px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .15); color: rgb(255 255 255 / .6); transition: background .3s, color .3s, border-color .3s; }',
      '.d-' + ID + ' .seg button:hover { color: #fff; border-color: rgb(255 255 255 / .45); }',
      '.d-' + ID + ' .seg button[aria-pressed="true"] { background: #fff; color: #000; border-color: #fff; }',
      '.d-' + ID + ' .read { color: rgb(255 255 255 / .45); min-height: 1.4em; }',
      '.d-' + ID + ' .read b { color: rgb(255 255 255 / .9); font-weight: 500; }',
      '.d-' + ID + ' .read b.accent { color: #f97316; }',
      '@media (max-width: 640px) { .d-' + ID + ' { padding: 18px 16px 14px; } .d-' + ID + ' .read { width: 100%; } }'
    ].join('\n'),
    mount: function (stage, ctx) {
      var el = ctx.el;
      var preset = '3d', mode = 'chars', started = false, state = 'idle', token = 0, anims = [], ro, rtimer = 0;
      var top = el('div', 'top label', '<span><span class="accent">Split engine</span> · once-only reveal</span><span class="pr">Preset 3D rise</span>');
      var mid = el('div', 'mid');
      var h = el('h4', ctx.reduced ? '' : 'pending'); h.textContent = TEXT;
      var nav = el('nav'); nav.setAttribute('aria-label', 'Hover re-roll sample');
      ['Work', 'Studio', 'Contact'].forEach(function (w, i) {
        var b = el('button', ''); b.type = 'button';
        b.innerHTML = '<i>0' + (i + 1) + '</i><span class="t" aria-label="' + w + '">' + w + '</span>';
        nav.appendChild(b);
        var t = b.querySelector('.t'), busy = false;
        function reroll() {
          if (busy || ctx.reduced) return;
          busy = true;
          t.textContent = ''; var m = el('span', 'ln'); m.setAttribute('aria-hidden', 'true'); t.appendChild(m);
          var cs = w.split('').map(function (ch) { var c = el('span', 'c'); c.textContent = ch; m.appendChild(c); return c; });
          var last;
          cs.forEach(function (c, j) {
            last = c.animate([{ transform: 'translateY(0%)' }, { transform: 'translateY(-105%)' }], { duration: 300, delay: j * 10, easing: INOUT, fill: 'both' });
          });
          last.onfinish = function () {
            var fin;
            cs.forEach(function (c, j) {
              c.getAnimations().forEach(function (a) { a.cancel(); });
              fin = c.animate([{ transform: 'translateY(105%)' }, { transform: 'translateY(0%)' }], { duration: 300, delay: j * 20, easing: OUT, fill: 'both' });
            });
            fin.onfinish = function () { t.textContent = w; busy = false; };
          };
        }
        b.addEventListener('pointerenter', reroll);
        b.addEventListener('focus', reroll);
      });
      mid.appendChild(h); mid.appendChild(nav);
      var ctrl = el('div', 'ctrl');
      var segP = el('div', 'seg label'); segP.setAttribute('role', 'group'); segP.setAttribute('aria-label', 'Preset');
      var segM = el('div', 'seg label'); segM.setAttribute('role', 'group'); segM.setAttribute('aria-label', 'Split by');
      var read = el('p', 'read label'); read.setAttribute('aria-live', 'polite'); read.style.margin = '0';
      Object.keys(PRESETS).forEach(function (k) {
        var b = el('button', '', PRESETS[k].name); b.type = 'button'; b.dataset.k = k;
        b.setAttribute('aria-pressed', k === preset ? 'true' : 'false');
        b.addEventListener('click', function () { preset = k; sync(segP, k); top.querySelector('.pr').textContent = 'Preset ' + PRESETS[k].name; play(true); });
        segP.appendChild(b);
      });
      ['chars', 'words', 'lines'].forEach(function (k) {
        var b = el('button', '', k); b.type = 'button'; b.dataset.k = k;
        b.setAttribute('aria-pressed', k === mode ? 'true' : 'false');
        b.addEventListener('click', function () { mode = k; sync(segM, k); play(true); });
        segM.appendChild(b);
      });
      function sync(seg, k) { seg.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === k ? 'true' : 'false'); }); }
      var left = el('div', 'seg'); left.style.gap = '10px'; left.appendChild(segP); left.appendChild(segM);
      ctrl.appendChild(left); ctrl.appendChild(read);
      stage.appendChild(top); stage.appendChild(mid); stage.appendChild(ctrl);

      function fit() {
        var r = stage.getBoundingClientRect();
        var fs = Math.max(30, Math.min(r.width * 0.088, r.height * 0.15, 104));
        stage.style.setProperty('--fs', fs.toFixed(1) + 'px');
      }
      function kill() { token++; anims.forEach(function (a) { a.cancel(); }); anims = []; }
      function targets(s) { return mode === 'chars' ? s.chars : mode === 'words' ? s.words : s.lines; }
      function staggerFor(n) {
        var each = mode === 'chars' ? PRESETS[preset].each : MODE_EACH[mode];
        var capped = n > 1 && (n - 1) * each > 0.8;
        if (capped) each = 0.6 / (n - 1);
        return { each: each, capped: capped };
      }
      function frames(p, phase) {
        if (p.fade) return phase === 'in' ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
        return phase === 'in' ? [{ transform: p.from }, { transform: p.to }] : [{ transform: p.to }, { transform: p.out }];
      }
      function runIn(tok) {
        var s = split(h, TEXT), list = targets(s), p = PRESETS[preset], st = staggerFor(list.length);
        h.classList.remove('pending', 'animated');
        read.innerHTML = '<b>' + list.length + ' ' + mode + '</b> × ' + st.each.toFixed(3) + ' s' + (st.capped ? ' (amount .6)' : '') + ' · 1.4 s · DOM <b>split</b>';
        state = 'in';
        var last;
        list.forEach(function (t, i) {
          last = t.animate(frames(p, 'in'), { duration: 1400, delay: i * st.each * 1000, easing: OUT, fill: 'both' });
          anims.push(last);
        });
        if (last) last.onfinish = function () {
          if (tok !== token) return;
          anims = []; revert(h, TEXT); h.classList.add('animated'); state = 'done';
          read.innerHTML = '<b>' + list.length + ' ' + mode + '</b> · done · DOM <b class="accent">reverted</b> to one text node';
        };
      }
      function play(withOut) {
        if (ctx.reduced) {
          kill(); revert(h, TEXT);
          h.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease' });
          read.innerHTML = 'Reduced motion: <b>no split, no tween</b> · text static';
          return;
        }
        kill(); var tok = token;
        if (withOut && state !== 'idle') {
          var s = split(h, TEXT), list = targets(s), p = PRESETS[preset], last;
          h.classList.remove('animated'); state = 'out';
          read.innerHTML = 'Out · .8 s · stagger .01 · <b>power3.inOut</b>';
          list.forEach(function (t, i) {
            last = t.animate(frames(p, 'out'), { duration: 800, delay: i * 10, easing: INOUT, fill: 'both' });
            anims.push(last);
          });
          last.onfinish = function () { if (tok !== token) return; anims = []; runIn(tok); };
        } else runIn(tok);
      }

      ro = new ResizeObserver(function () {
        fit();
        clearTimeout(rtimer);
        // resplit on resize: a split line layout is only valid for the width it was measured at
        rtimer = setTimeout(function () { if (state === 'in' || state === 'out') play(false); }, 160);
      });
      fit();
      if (ctx.reduced) read.innerHTML = 'Reduced motion: <b>no split, no tween</b> · text static';
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (state === 'in') play(false); });

      return {
        start: function () {
          ro.observe(stage);
          if (!started) { started = true; play(false); }   // once-only entrance
        },
        stop: function () {
          ro.disconnect(); clearTimeout(rtimer);
          if (state === 'in' || state === 'out') { kill(); revert(h, TEXT); h.classList.add('animated'); h.classList.remove('pending'); state = 'done'; }
        },
        replay: function () { started = true; play(true); }
      };
    }
  });
})();
