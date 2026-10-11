/* kinetic-variable-type: alternating-parity wght/wdth morph driven by pointer X through a quickTo-style smoother + slot-roll intro. */
(function () {
  var ID = 'kinetic-variable-type';
  var WORD = 'STRETCH';
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  // map source axes (F37 Judge: wght up to 1000, wdth 60–150) into Archivo VF (wght 100–900, wdth 62–125), linearly
  var mw = function (w) { return 100 + (w - 100) * 800 / 900; };
  var md = function (d) { return 62 + (d - 60) * 63 / 90; };
  var REST = { w: 700, d: 100 };
  var quart = function (t) { return 1 - Math.pow(1 - t, 4); };          // power3.out
  // gsap.quickTo stand-in: every call restarts a short tween from the current value to the new target
  function quickTo(v0, dur) {
    var q = { v: v0, from: v0, to: v0, t: 1, dur: dur };
    q.set = function (x) { if (x === q.to) return; q.from = q.v; q.to = x; q.t = 0; };
    q.tick = function (dt) { if (q.t >= 1) return false; q.t = Math.min(1, q.t + dt / q.dur); q.v = lerp(q.from, q.to, quart(q.t)); return true; };
    return q;
  }

  Lib.register(ID, {
    hint: 'Move the pointer across the word, or drag the slider',
    notes: [
      'Even letters go <code>wght 1000 / wdth 60</code> → <code>700 / 150</code>; odd letters do the mirror, so total width barely changes',
      'Rest state <code>wght 700 / wdth 100</code>; re-settle .8 s easeOutQuart <code>cubic-bezier(.165,.84,.44,1)</code>',
      '<code>quickTo</code> duration .2 s for a CTA button, .4 s for a full-width headline (pointer X ÷ width)',
      'Slot-roll intro: <code>yPercent 100 → −300</code>, 1.8 s <code>power3.inOut</code>, stagger .1, then drop the clones',
      'Reduced motion or coarse pointer: no roll, no pointer morph; <code>aria-label</code> the word, chars <code>aria-hidden</code>'
    ],
    simplified: 'Archivo stands in for F37 Judge: source wght 100–1000 maps linearly to Archivo 100–900 and wdth 60–150 to 62–125, so the extremes are softer. If Archivo fails to load, weight uses font-weight and width is faked with scaleX. Roll clones show random letters before landing on the real one.',
    css: [
      '.d-' + ID + ' { display: grid; grid-template-rows: auto 1fr auto; padding: 22px 24px 18px; --fs: 120px; }',
      '.d-' + ID + ' .hud { display: flex; justify-content: space-between; gap: 12px; color: rgb(255 255 255 / .56); }',
      '.d-' + ID + ' .hud .accent { color: #f97316; }',
      '.d-' + ID + ' .hud .vals { text-align: right; }',
      '.d-' + ID + ' .hud b { font-weight: 500; color: rgb(255 255 255 / .9); }',
      '.d-' + ID + ' .area { display: grid; place-items: center; min-width: 0; }',
      '.d-' + ID + ' h4 { margin: 0; font-family: Archivo, sans-serif; font-size: var(--fs); line-height: .86; color: #fff; white-space: nowrap; user-select: text; letter-spacing: 0; }',
      '.d-' + ID + ' h4 ::selection { background: #f97316; color: #000; }',
      '.d-' + ID + ' .ln { display: inline-block; overflow: hidden; padding: .08em .1em; margin: -.08em -.1em; vertical-align: top; }',
      '.d-' + ID + ' .is-done .ln { overflow: visible; }',
      '.d-' + ID + ' .ch { display: inline-block; position: relative; vertical-align: top; font-weight: var(--fw, 700); font-variation-settings: "wght" var(--wght), "wdth" var(--wdth); }',
      '.d-' + ID + ' .ch .col { position: absolute; left: 0; top: 100%; display: flex; flex-direction: column; }',
      '.d-' + ID + ' .ch .col span { display: block; }',
      '.d-' + ID + ' .fake .ch { transform-origin: 50% 50%; }',
      '.d-' + ID + ' .ctrl { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; border-top: 1px solid rgb(255 255 255 / .1); padding-top: 12px; color: rgb(255 255 255 / .56); }',
      '.d-' + ID + ' .ctrl label { display: flex; align-items: center; gap: 12px; flex: 1 1 260px; }',
      '.d-' + ID + ' input[type=range] { flex: 1; accent-color: #f97316; height: 28px; touch-action: pan-x; }',
      '.d-' + ID + ' .ctrl .src { flex: 1 1 200px; text-align: right; }',
      '@media (max-width: 640px) { .d-' + ID + ' { padding: 18px 16px 14px; } .d-' + ID + ' .hud { flex-direction: column; gap: 6px; } .d-' + ID + ' .hud .vals { text-align: left; } .d-' + ID + ' .ctrl .src { text-align: left; } }'
    ].join('\n'),
    mount: function (stage, ctx) {
      var el = ctx.el;
      var hud = el('div', 'hud label', '<span><span class="accent">Variable font</span> · alternate parity</span><span class="vals"></span>');
      var vals = hud.querySelector('.vals');
      var area = el('div', 'area');
      var h = el('h4', 'display'); h.setAttribute('aria-label', WORD);
      area.appendChild(h);
      var ctrl = el('div', 'ctrl label',
        '<label><span>Morph</span><input type="range" min="0" max="1000" value="0" aria-label="Morph progress, 0 to 1"></label>' +
        '<span class="src">Font check…</span>');
      var range = ctrl.querySelector('input'), src = ctrl.querySelector('.src');
      stage.appendChild(hud); stage.appendChild(area); stage.appendChild(ctrl);

      var chars = [], fake = false, intro = false, rollAnims = [], ro, autoT = -1;
      var P = quickTo(0, 0.4);          // pointer progress, headline smoother .4 s
      var L = quickTo(0, 0.8);          // live amount: 0 = rest 700/100, 1 = pointer-driven
      var dirty = true;

      function detectFont() {
        var a = el('span', '', 'STRETCH'); a.style.cssText = 'position:absolute;visibility:hidden;font-size:40px;font-family:Archivo,monospace';
        var b = el('span', '', 'STRETCH'); b.style.cssText = 'position:absolute;visibility:hidden;font-size:40px;font-family:monospace';
        stage.appendChild(a); stage.appendChild(b);
        var same = Math.abs(a.offsetWidth - b.offsetWidth) < 1;
        a.remove(); b.remove();
        fake = same; h.classList.toggle('fake', fake);
        src.textContent = fake ? 'Archivo not loaded · width faked with scaleX' : 'Archivo VF · wght 100–900 · wdth 62–125';
        dirty = true;
      }
      function build(withClones) {
        h.innerHTML = ''; chars = [];
        var ln = el('span', 'ln'); ln.setAttribute('aria-hidden', 'true');
        WORD.split('').forEach(function (c) {
          var s = el('span', 'ch'); s.textContent = c;
          if (withClones) {
            var col = el('span', 'col');
            for (var k = 0; k < 3; k++) { var g = el('span'); g.textContent = k === 2 ? c : WORD[(Math.random() * WORD.length) | 0]; col.appendChild(g); }
            s.appendChild(col);
          }
          ln.appendChild(s); chars.push(s);
        });
        h.appendChild(ln);
        dirty = true; apply();
      }
      function apply() {
        var p = P.v, l = L.v;
        var ew = lerp(REST.w, lerp(1000, 700, p), l), ed = lerp(REST.d, lerp(60, 150, p), l);
        var ow = lerp(REST.w, lerp(700, 1000, p), l), od = lerp(REST.d, lerp(150, 60, p), l);
        chars.forEach(function (c, i) {
          var even = i % 2 === 0, w = mw(even ? ew : ow), d = md(even ? ed : od);
          c.style.setProperty('--wght', w.toFixed(0));
          c.style.setProperty('--wdth', d.toFixed(1));
          if (fake) { c.style.setProperty('--fw', String(Math.round(w / 100) * 100)); c.style.transform = intro ? '' : 'scaleX(' + (d / 90).toFixed(3) + ')'; }
          else { c.style.removeProperty('--fw'); if (!intro) c.style.transform = ''; }
        });
        vals.innerHTML = 'p <b>' + p.toFixed(2) + '</b> · even <b>' + Math.round(ew) + '/' + Math.round(ed) + '</b> · odd <b>' + Math.round(ow) + '/' + Math.round(od) + '</b>';
      }
      function fit() {
        var r = area.getBoundingClientRect();
        var fs = Math.min(r.width / (WORD.length * 0.78), r.height * 0.62, 220);
        stage.style.setProperty('--fs', Math.max(36, fs).toFixed(1) + 'px');
      }
      function roll() {
        rollAnims.forEach(function (a) { a.cancel(); }); rollAnims = [];
        P.set(0); P.v = 0; L.v = 0; L.to = 0; L.t = 1;
        intro = true; h.classList.remove('is-done');
        build(true);
        var last;
        chars.forEach(function (c, i) {
          last = c.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(-300%)' }],
            { duration: 1800, delay: i * 100, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'both' });
          rollAnims.push(last);
        });
        last.onfinish = function () {
          rollAnims = []; intro = false; build(false); h.classList.add('is-done');
          if (!ctx.fine && !ctx.reduced) autoT = 0;        // coarse pointer: one slow auto 0→1 demonstration
        };
      }

      // input: pointer X over the whole stage (fine pointers), slider for keyboard / touch
      function onMove(e) {
        if (ctx.reduced || intro || e.pointerType !== 'mouse') return;
        var r = stage.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        P.set(p); L.set(1); autoT = -1;
        range.value = Math.round(p * 1000);
      }
      function onLeave(e) { if (e.pointerType === 'mouse' && document.activeElement !== range) L.set(0); }
      range.addEventListener('input', function () { if (intro) return; autoT = -1; P.set(range.value / 1000); L.set(1); });
      range.addEventListener('blur', function () { L.set(0); });
      stage.addEventListener('pointermove', onMove);
      stage.addEventListener('pointerleave', onLeave);

      var lp = ctx.loop(function (dt) {
        if (autoT >= 0) {
          autoT += dt;
          var k = Math.min(autoT / 2.4, 1), s = Math.sin(k * Math.PI);
          P.set(Math.round(s * 100) / 100); L.set(autoT < 2.4 ? 1 : 0);
          if (autoT > 2.4) autoT = -1;
        }
        var a = P.tick(dt), b = L.tick(dt);
        if (a || b || dirty) { dirty = false; apply(); }
      });

      ro = new ResizeObserver(fit);
      detectFont(); fit();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { detectFont(); fit(); });
      var played = false;
      if (ctx.reduced) { build(false); h.classList.add('is-done'); }
      else build(false);

      return {
        start: function () {
          ro.observe(area); lp.start();
          if (!played && !ctx.reduced) { played = true; roll(); }
        },
        stop: function () {
          ro.disconnect(); lp.stop(); autoT = -1;
          if (intro) { rollAnims.forEach(function (a) { a.cancel(); }); rollAnims = []; intro = false; build(false); h.classList.add('is-done'); }
        },
        replay: function () { if (ctx.reduced) { P.set(0); L.set(0); range.value = 0; return; } played = true; range.value = 0; roll(); }
      };
    }
  });
})();
