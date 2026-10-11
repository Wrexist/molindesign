/* premium-micro-details — a specimen sheet of small craft details, each one live */
(function () {
  var ID = 'premium-micro-details';

  Lib.register(ID, {
    hint: 'Hover, focus (Tab) and press each specimen. Every cell is one detail from the checklist.',
    notes: [
      'One entrance ease <code>cubic-bezier(.23,1,.32,1)</code>; enter .6–1.1 s, exit .2–.35 s; stagger 40–90 ms; animate only transform, opacity, filter, clip-path',
      'Press feedback <code>scale(.97)</code> on buttons (.95 on big hotspots); arrows nudge on hover: → +x, ← −x, ↗ up-right, 300 ms',
      'Ping dot: ping ring 2.2 s + glowing core, hidden under reduced motion; scroll hint = 36 px hairline with a sliding 12 px segment',
      'Numbers spring, they don’t tween: digit columns at stiffness 260, damping 30, mass .6',
      'Text over imagery gets <code>text-shadow: 0 1px 14px rgb(0 0 0/.8)</code>, not a box; hit targets ≥ 44 px on coarse pointers'
    ],
    simplified: 'Shown as isolated specimens; fonts, metadata and PWA items from the checklist are not visual and are left out.',
    css: [
      '.d-premium-micro-details { container-type: inline-size; }',
      '.d-premium-micro-details .pm { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 1fr); gap: 1px; background: rgb(255 255 255 / .1); }',
      '.d-premium-micro-details .pm-c { position: relative; background: #000; display: flex; flex-direction: column; padding: 16px; min-width: 0; min-height: 0; }',
      '.d-premium-micro-details .pm-s { flex: 1; display: grid; place-items: center; min-height: 0; }',
      '.d-premium-micro-details .pm-cap { margin: 0; display: flex; flex-direction: column; gap: 3px; }',
      '.d-premium-micro-details .pm-cap b { font-weight: 500; color: rgb(255 255 255 / .85); } .d-premium-micro-details .pm-cap span { color: rgb(255 255 255 / .56); letter-spacing: .12em; text-transform: none; }',
      '.d-premium-micro-details .pm-n { position: absolute; top: 14px; left: 16px; margin: 0; color: #f97316; }',
      /* 1 underline */
      '.d-premium-micro-details .pm-ul { position: relative; text-decoration: none; color: rgb(255 255 255 / .8); padding: 8px 0; font-size: 15px; }',
      '.d-premium-micro-details .pm-ul::after { content: ""; position: absolute; left: 0; right: 0; bottom: 4px; height: 1px; background: rgb(255 255 255 / .7); transform: scaleX(0); transform-origin: left; transition: transform .3s cubic-bezier(.23,1,.32,1); }',
      '.d-premium-micro-details .pm-ul:hover, .d-premium-micro-details .pm-ul:focus-visible { color: #fff; } .d-premium-micro-details .pm-ul:hover::after, .d-premium-micro-details .pm-ul:focus-visible::after { transform: scaleX(1); }',
      /* 2 arrows */
      '.d-premium-micro-details .pm-arr { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }',
      '.d-premium-micro-details .pm-arr button { padding: 6px 0; color: rgb(255 255 255 / .8); } .d-premium-micro-details .pm-arr button:hover { color: #fff; }',
      '.d-premium-micro-details .pm-arr .ar { display: inline-block; color: #f97316; transition: transform .3s cubic-bezier(.23,1,.32,1); margin: 0 .4em; }',
      '.d-premium-micro-details .a-r:hover .ar, .d-premium-micro-details .a-r:focus-visible .ar { transform: translateX(4px); }',
      '.d-premium-micro-details .a-l:hover .ar, .d-premium-micro-details .a-l:focus-visible .ar { transform: translateX(-4px); }',
      '.d-premium-micro-details .a-u:hover .ar, .d-premium-micro-details .a-u:focus-visible .ar { transform: translate(2px, -2px); }',
      /* 3 press */
      '.d-premium-micro-details .pm-press { padding: 13px 22px; border-radius: 999px; background: #fff; color: #000; transition: transform .2s cubic-bezier(.23,1,.32,1), background .3s; }',
      '.d-premium-micro-details .pm-press:hover { background: #f97316; } .d-premium-micro-details .pm-press:active { transform: scale(.97); }',
      '.d-premium-micro-details .pm-pc { display: grid; gap: 10px; justify-items: center; } .d-premium-micro-details .pm-cnt { color: rgb(255 255 255 / .56); }',
      /* 4 ping */
      '.d-premium-micro-details .pm-ping { display: flex; align-items: center; gap: 12px; color: rgb(255 255 255 / .85); }',
      '.d-premium-micro-details .pm-dot { position: relative; width: 10px; height: 10px; }',
      '.d-premium-micro-details .pm-dot i { position: absolute; inset: 0; border-radius: 50%; background: #f97316; box-shadow: 0 0 14px rgb(249 115 22 / .9); }',
      '.d-premium-micro-details .pm-dot::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: rgb(249 115 22 / .6); animation: pm-ping 2.2s cubic-bezier(0,0,.2,1) infinite; }',
      '@keyframes pm-ping { 75%, 100% { transform: scale(2.6); opacity: 0; } }',
      /* 5 scroll hint */
      '.d-premium-micro-details .pm-hint { display: flex; flex-direction: column; align-items: center; gap: 10px; color: rgb(255 255 255 / .6); }',
      '.d-premium-micro-details .pm-tick { position: relative; width: 1px; height: 36px; overflow: hidden; background: rgb(255 255 255 / .15); }',
      '.d-premium-micro-details .pm-tick i { position: absolute; left: 0; right: 0; top: 0; height: 12px; background: rgb(255 255 255 / .8); animation: pm-tick 1.6s ease-in-out infinite; }',
      '@keyframes pm-tick { from { transform: translateY(-12px); } to { transform: translateY(36px); } }',
      '.d-premium-micro-details.paused .pm-dot::before, .d-premium-micro-details.paused .pm-tick i { animation-play-state: paused; }',
      /* 6 spring digits */
      '.d-premium-micro-details .pm-dig { display: flex; align-items: baseline; gap: 8px; }',
      '.d-premium-micro-details .pm-num { display: inline-flex; font-family: Archivo, sans-serif; font-stretch: 125%; font-size: clamp(26px, 4.2cqw, 40px); font-variant-numeric: tabular-nums; color: #fff; letter-spacing: -.02em; }',
      '.d-premium-micro-details .pm-col { position: relative; display: inline-block; width: .7em; height: 1.15em; overflow: hidden; line-height: 1.15em; }',
      '.d-premium-micro-details .pm-col .strip { position: absolute; left: 0; right: 0; top: 0; display: flex; flex-direction: column; text-align: center; }',
      '.d-premium-micro-details .pm-col .strip span { height: 1.15em; }',
      '.d-premium-micro-details .pm-dig .label { color: rgb(255 255 255 / .56); }',
      /* 7 legibility */
      '.d-premium-micro-details .pm-img { position: absolute; inset: 0; background: radial-gradient(40% 50% at 30% 40%, #fff, transparent 70%), radial-gradient(60% 70% at 75% 45%, #fdba74, transparent 75%), linear-gradient(160deg, #fed7aa, #f97316 55%, #7c2d12); }',
      '.d-premium-micro-details .pm-leg { position: relative; z-index: 1; display: grid; gap: 6px; text-align: center; color: #fff; font-size: 15px; }',
      '.d-premium-micro-details .pm-leg .sh { text-shadow: 0 1px 14px rgb(0 0 0 / .8), 0 0 2px rgb(0 0 0 / .4); }',
      '.d-premium-micro-details .c7 .pm-cap { position: relative; z-index: 1; } .d-premium-micro-details .c7 .pm-cap b, .d-premium-micro-details .c7 .pm-cap span, .d-premium-micro-details .c7 .pm-n { color: #fff; text-shadow: 0 1px 14px rgb(0 0 0 / .8); }',
      /* 8 target */
      '.d-premium-micro-details .pm-tgt { position: relative; width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .4); display: grid; place-items: center; font-size: 11px; color: rgb(255 255 255 / .85); transition: border-color .3s, transform .2s cubic-bezier(.23,1,.32,1); }',
      '.d-premium-micro-details .pm-tgt::before { content: ""; position: absolute; inset: -11px; border-radius: 50%; border: 1px dashed rgb(249 115 22 / .7); }',
      '.d-premium-micro-details .pm-tgt:hover { border-color: #fff; } .d-premium-micro-details .pm-tgt:active { transform: scale(.95); }',
      '.d-premium-micro-details .pm-tw { display: flex; align-items: center; gap: 22px; } .d-premium-micro-details .pm-tw .label { color: rgb(255 255 255 / .5); line-height: 1.6; }',
      '@container (max-width: 640px) { .d-premium-micro-details .pm { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(4, 1fr); } .d-premium-micro-details .pm-cap span { display: none; } .d-premium-micro-details .pm-c { padding: 10px 12px; } .d-premium-micro-details .pm-n { top: 10px; left: 12px; } .d-premium-micro-details .pm-press { padding: 12px 16px; } .d-premium-micro-details .pm-arr { flex-direction: row; gap: 10px; } .d-premium-micro-details .pm-arr .t { display: none; } .d-premium-micro-details .pm-tw .label { display: none; } .d-premium-micro-details .pm-cnt { display: none; } .d-premium-micro-details .pm-ul { font-size: 13px; } }',
      '@media (prefers-reduced-motion: reduce) { .d-premium-micro-details .pm-dot::before { display: none; } .d-premium-micro-details .pm-tick i { animation: none; transform: translateY(12px); } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var cell = function (n, cls, body, name, rule) {
        return '<div class="pm-c ' + cls + '"><p class="label pm-n">' + String(n).padStart(2, '0') + '</p><div class="pm-s">' + body + '</div>' +
          '<p class="label pm-cap"><b>' + name + '</b><span>' + rule + '</span></p></div>';
      };
      stage.innerHTML = '<div class="pm">' +
        cell(1, 'c1', '<a class="pm-ul" href="https://github.com/Wrexist/molindesign/blob/main/.claude/skills/premium-micro-details/SKILL.md" target="_blank" rel="noopener noreferrer">Read the case study</a>', 'Underline grow', '1 px bar, scaleX 0→1 on hover + focus') +
        cell(2, 'c2', '<div class="pm-arr label"><button type="button" class="a-r label"><span class="t">Next</span><span class="ar" aria-hidden="true">→</span></button>' +
          '<button type="button" class="a-l label"><span class="ar" aria-hidden="true">←</span><span class="t">Back</span></button><button type="button" class="a-u label"><span class="t">Open</span><span class="ar" aria-hidden="true">↗</span></button></div>', 'Arrow nudge', '→ +x · ← −x · ↗ up-right · 300 ms') +
        cell(3, 'c3', '<div class="pm-pc"><button type="button" class="pm-press label">Press me</button><span class="label pm-cnt" aria-live="polite">Pressed 0×</span></div>', 'Press .97', ':active scale(.97), never a bounce') +
        cell(4, 'c4', '<span class="pm-ping label"><span class="pm-dot" aria-hidden="true"><i></i></span>Live</span>', 'Ping dot', '2.2 s ring, hidden on reduced motion') +
        cell(5, 'c5', '<span class="pm-hint label" aria-hidden="true"><span class="pm-tick"><i></i></span>Scroll</span>', 'Scroll hint', '36 px hairline · 12 px segment') +
        cell(6, 'c6', '<span class="pm-dig"><span class="pm-num" role="img" aria-label="Speed"></span><span class="label">km/h</span></span>', 'Spring digits', 'stiffness 260 · damping 30 · mass .6') +
        cell(7, 'c7', '<div class="pm-img" aria-hidden="true"></div><div class="pm-leg label"><span>No shadow</span><span class="sh">Text-shadow</span></div>', 'Legibility', '0 1px 14px rgb(0 0 0/.8), no box') +
        cell(8, 'c8', '<div class="pm-tw"><button type="button" class="pm-tgt" aria-label="Dismiss (44 px hit area)">✕</button><span class="label">24 px glyph<br>44 px hit area</span></div>', '44 px target', 'pad the hit area, not the glyph') +
        '</div>';

      var cnt = stage.querySelector('.pm-cnt'), presses = 0;
      stage.querySelector('.pm-press').addEventListener('click', function () { presses++; cnt.textContent = 'Pressed ' + presses + '×'; });
      // spring digits
      var num = stage.querySelector('.pm-num'), cols = [];
      for (var c = 0; c < 3; c++) {
        var col = ctx.el('span', 'pm-col'), strip = ctx.el('span', 'strip');
        for (var d = 0; d < 10; d++) strip.appendChild(ctx.el('span', '', String(d)));
        col.appendChild(strip); num.appendChild(col); cols.push({ strip: strip, x: 0, v: 0, goal: 0 });
      }
      var vals = [120, 248, 96, 312, 187, 350, 64], vi = 0, acc = 0;
      function setVal(v) {
        num.setAttribute('aria-label', v + ' km/h');
        String(v).padStart(3, '0').split('').forEach(function (dg, i) { cols[i].goal = -(+dg); });
      }
      function paint() { cols.forEach(function (cl) { cl.strip.style.transform = 'translateY(' + (cl.x * 1.15).toFixed(4) + 'em)'; }); }
      setVal(vals[0]); cols.forEach(function (cl) { cl.x = cl.goal; }); paint();
      var lp = ctx.loop(function (dt) {
        acc += dt;
        if (acc > 2.2) { acc = 0; vi = (vi + 1) % vals.length; setVal(vals[vi]); if (ctx.reduced) cols.forEach(function (cl) { cl.x = cl.goal; cl.v = 0; }); }
        if (!ctx.reduced) cols.forEach(function (cl) {
          for (var k = 0; k < 4; k++) { var h = dt / 4, a = (-260 * (cl.x - cl.goal) - 30 * cl.v) / .6; cl.v += a * h; cl.x += cl.v * h; }
        });
        paint();
      });

      return {
        start: function () { stage.classList.remove('paused'); lp.start(); },
        stop: function () { lp.stop(); stage.classList.add('paused'); }
      };
    }
  });
})();
