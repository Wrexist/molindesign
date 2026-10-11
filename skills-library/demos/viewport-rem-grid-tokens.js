/* viewport-rem-grid-tokens: a simulated viewport whose local "rem" follows the source breakpoints, 6/8/12 grid overlay, four easing tokens. */
(function () {
  var ID = 'viewport-rem-grid-tokens';
  var EASES = [
    ['easeInOutQuart', '.76,0,.24,1', 'covers, big moves · 1–1.2 s'],
    ['easeOutQuart', '.165,.84,.44,1', 'hovers, entrances · .4–.8 s'],
    ['easeInOutCubic', '.65,0,.35,1', 'secondary moves'],
    ['easeInOutQuad', '.45,0,.55,1', 'gentle drifts']
  ];
  // the two sites' html font-size rules
  function remSource(w) { return w < 768 ? 10 : w < 1200 ? w * 0.011111111 : w * 0.0052083333; }
  function remCont(w) { return w < 768 ? 10 : Math.max(w / 192, 8); }
  function cols(w) { return w < 768 ? 6 : w < 1200 ? 8 : 12; }
  function gapX(w) { return w < 768 ? 1.6 : w < 1200 ? 3.2 : 4; }
  var KEY = 'molin-library:isGrid';

  Lib.register(ID, {
    hint: 'Drag the viewport width across 768 and 1200 px, toggle the grid',
    notes: [
      'Source rem: <code>10px</code> below 768, <code>1.1111vw</code> from 768, <code>0.5208vw</code> from 1200 (= 10px at 1920)',
      'Not continuous: 1rem ≈ 13.3px at 1199 drops to 6.25px at 1200, so every token is re-specified per breakpoint; one comp? use <code>calc(100vw / 192)</code>',
      'Grid 6 / 8 / 12 columns, <code>--gap-x</code> 1.6 → 3.2 → 4rem; Shift+G toggles the overlay (try it on this page)',
      'Easing tokens: InOutQuart <code>.76,0,.24,1</code>, OutQuart <code>.165,.84,.44,1</code>, InOutCubic <code>.65,0,.35,1</code>, InOutQuad <code>.45,0,.55,1</code>',
      'Nothing faster than .4 s, big moves 1.2 s, no bounce; never disable zoom'
    ],
    simplified: 'The "viewport" is a scaled box inside the stage, so its rem is a local font-size set by a ResizeObserver, not the real html font-size. Breakpoint values beyond the gap and column count are demo values.',
    css: [
      '.d-' + ID + ' { display: grid; grid-template-rows: auto 1fr auto; gap: 12px; padding: 18px 20px 16px; }',
      '.d-' + ID + ' .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; color: rgb(255 255 255 / .45); }',
      '.d-' + ID + ' .bar label { display: flex; align-items: center; gap: 10px; flex: 1 1 220px; }',
      '.d-' + ID + ' input[type=range] { flex: 1; accent-color: #f97316; height: 26px; touch-action: pan-x; min-width: 90px; }',
      '.d-' + ID + ' .rd { color: rgb(255 255 255 / .9); min-width: 13ch; }',
      '.d-' + ID + ' .rd i { font-style: normal; color: #f97316; }',
      '.d-' + ID + ' .btn { padding: 7px 11px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .15); color: rgb(255 255 255 / .65); transition: background .4s, color .4s, border-color .4s; }',
      '.d-' + ID + ' .btn:hover { color: #fff; border-color: rgb(255 255 255 / .45); }',
      '.d-' + ID + ' .btn[aria-pressed="true"] { background: #fff; color: #000; border-color: #fff; }',
      '.d-' + ID + ' svg.chart { width: 120px; height: 34px; overflow: visible; flex: none; }',
      '.d-' + ID + ' .area { position: relative; min-height: 0; overflow: hidden; }',
      '.d-' + ID + ' .dev { position: absolute; left: 0; top: 0; transform-origin: 0 0; background: #0a0a0a; border: 1px solid rgb(255 255 255 / .14); overflow: hidden; color: #ededed; font-family: Archivo, sans-serif; }',
      '.d-' + ID + ' .dev .ov { position: absolute; inset: 0; display: grid; pointer-events: none; opacity: 0; transition: opacity .4s; }',
      '.d-' + ID + ' .dev.grid .ov { opacity: 1; }',
      '.d-' + ID + ' .dev .ov i { background: rgb(249 115 22 / .09); border-inline: 1px solid rgb(249 115 22 / .3); }',
      '.d-' + ID + ' .pg { position: relative; display: grid; height: 100%; align-content: space-between; row-gap: 1.6em; padding-block: 2.4em; }',
      '.d-' + ID + ' .mono { font-family: "Geist Mono", ui-monospace, monospace; font-size: 1.2em; letter-spacing: .04em; text-transform: uppercase; color: rgb(255 255 255 / .55); }',
      '.d-' + ID + ' .hd { margin: 0; font-weight: 400; font-stretch: 100%; line-height: 1; letter-spacing: -.03em; color: #fff; }',
      '.d-' + ID + ' .num { font-size: 16em; line-height: .8; font-weight: 300; letter-spacing: -.06em; color: rgb(255 255 255 / .12); margin: 0; }',
      '.d-' + ID + ' .cp { margin: 0; font-size: 1.4em; line-height: 1.3; color: rgb(255 255 255 / .7); }',
      '.d-' + ID + ' .dot-a { color: #f97316; }',
      '.d-' + ID + ' .eases { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }',
      '.d-' + ID + ' .ez { display: grid; grid-template-columns: 34px 1fr; gap: 4px 10px; align-items: center; border-top: 1px solid rgb(255 255 255 / .1); padding-top: 8px; }',
      '.d-' + ID + ' .ez svg { grid-row: span 2; width: 34px; height: 34px; overflow: visible; }',
      '.d-' + ID + ' .ez .n { color: rgb(255 255 255 / .85); font-size: 9.5px; letter-spacing: .14em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.d-' + ID + ' .ez .tr { position: relative; height: 10px; }',
      '.d-' + ID + ' .ez .tr::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: rgb(255 255 255 / .15); }',
      '.d-' + ID + ' .ez .tr b { position: absolute; top: 50%; left: 0; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; background: #f97316; box-shadow: 0 0 8px rgb(249 115 22 / .7);',
      '  animation: ez-' + ID + ' 1.7s infinite alternate linear; }',
      '@keyframes ez-' + ID + ' { 0%, 15% { left: 0%; animation-timing-function: var(--e); } 85%, 100% { left: 100%; } }',
      '@media (prefers-reduced-motion: reduce) { .d-' + ID + ' .ez .tr b { animation: none; left: 100%; } .d-' + ID + ' .dev .ov { transition: none; } }',
      '@media (max-width: 640px) { .d-' + ID + ' { padding: 16px 14px 14px; } .d-' + ID + ' .eases { grid-template-columns: repeat(2, 1fr); } .d-' + ID + ' svg.chart { display: none; } }'
    ].join('\n'),
    mount: function (stage, ctx) {
      var el = ctx.el;
      var W = 1440, mode = 'source', user = false, sweepT = 0;
      var bar = el('div', 'bar label',
        '<label><span>Viewport</span><input type="range" min="375" max="1920" step="1" value="1440" aria-label="Simulated viewport width in pixels"></label>' +
        '<span class="rd" aria-live="off"></span>' +
        '<svg class="chart" viewBox="0 0 120 34" aria-hidden="true"></svg>' +
        '<button type="button" class="btn md" aria-pressed="false" title="Source breakpoints vs one continuous coefficient">calc(w/192)</button>' +
        '<button type="button" class="btn gr" aria-pressed="false">Grid</button>');
      var range = bar.querySelector('input'), rd = bar.querySelector('.rd'), chart = bar.querySelector('.chart');
      var mdBtn = bar.querySelector('.md'), grBtn = bar.querySelector('.gr');
      var area = el('div', 'area');
      var dev = el('div', 'dev');
      dev.innerHTML =
        '<div class="ov"></div>' +
        '<div class="pg">' +
          '<span class="mono c-a">Molin — Index</span><span class="mono c-b" style="text-align:right">(2026)</span>' +
          '<h4 class="hd">Scales like<br>a poster<span class="dot-a">.</span></h4>' +
          '<p class="num">08</p>' +
          '<p class="cp c-p">Design at 1px = 0.1rem, ship in rem, and the whole layout scales with the viewport like a printed sheet.</p>' +
          '<span class="mono c-f">Gap 1.6 / 3.2 / 4rem</span>' +
        '</div>';
      var ov = dev.querySelector('.ov'), pg = dev.querySelector('.pg');
      area.appendChild(dev);
      var eases = el('div', 'eases');
      EASES.forEach(function (e) {
        var b = e[1].split(',').map(Number);
        var d = el('div', 'ez label');
        d.innerHTML = '<svg viewBox="0 0 34 34" aria-hidden="true"><rect x=".5" y=".5" width="33" height="33" fill="none" stroke="rgb(255 255 255 / .12)"/>' +
          '<path d="M1 33 C' + (1 + b[0] * 32) + ' ' + (33 - b[1] * 32) + ' ' + (1 + b[2] * 32) + ' ' + (33 - b[3] * 32) + ' 33 1" fill="none" stroke="#f97316" stroke-width="1.5"/></svg>' +
          '<span class="n" title="' + e[2] + '">' + e[0] + '</span><span class="tr"><b style="--e:cubic-bezier(' + e[1] + ')"></b></span>';
        eases.appendChild(d);
      });
      stage.appendChild(bar); stage.appendChild(area); stage.appendChild(eases);

      // rem-vs-width chart: shows the step at 1200 in source mode
      function drawChart() {
        var pts = [], f = mode === 'source' ? remSource : remCont, prev = null;
        var X = function (w) { return (w - 375) / (1920 - 375) * 120; }, Y = function (r) { return 34 - r / 14 * 34; };
        var path = '';
        for (var w = 375; w <= 1920; w += 5) {
          var r = f(w), jump = prev !== null && Math.abs(r - prev) > 1;
          path += (path && !jump ? 'L' : 'M') + X(w).toFixed(1) + ' ' + Y(r).toFixed(1);
          prev = r;
        }
        chart.innerHTML = '<line x1="0" y1="34" x2="120" y2="34" stroke="rgb(255 255 255 / .15)"/>' +
          '<path d="' + path + '" fill="none" stroke="rgb(255 255 255 / .7)" stroke-width="1"/>' +
          '<circle class="mk" r="2.5" fill="#f97316"/>';
        pts.length = 0;
      }
      function layout() {
        var rem = mode === 'source' ? remSource(W) : remCont(W);
        var n = cols(W), g = gapX(W) + 'em';
        var ar = area.getBoundingClientRect();
        if (!ar.width) return;
        var s = Math.min(ar.width / W, 1);
        var H = ar.height / s;
        dev.style.width = W + 'px'; dev.style.height = H + 'px';
        dev.style.fontSize = rem + 'px';
        dev.style.transform = 'translate(' + ((ar.width - W * s) / 2) + 'px,0) scale(' + s + ')';
        [ov, pg].forEach(function (x) { x.style.gridTemplateColumns = 'repeat(' + n + ', 1fr)'; x.style.columnGap = g; x.style.paddingInline = g; });
        if (ov.children.length !== n) ov.innerHTML = new Array(n + 1).join('<i></i>');
        // content placement per breakpoint (col-span / col-start)
        var lg = n === 12, md = n === 8;
        var place = function (sel, c, size) { var e = pg.querySelector(sel); e.style.gridColumn = c; if (size) e.style.fontSize = size; };
        place('.c-a', lg ? '1 / span 3' : '1 / span 3'); place('.c-b', lg ? '10 / span 3' : md ? '6 / span 3' : '4 / span 3');
        place('.hd', lg ? '1 / span 7' : md ? '1 / span 6' : '1 / span 6', lg ? '6.4em' : '4.8em');
        place('.num', lg ? '8 / span 5' : md ? '5 / span 4' : '1 / span 6', lg ? '32em' : md ? '16em' : '10em');
        place('.cp', lg ? '1 / span 4' : md ? '1 / span 4' : '1 / span 5');
        place('.c-f', lg ? '9 / span 4' : md ? '5 / span 4' : '1 / span 6');
        pg.querySelector('.num').style.gridRow = lg || md ? '2 / span 2' : 'auto';
        rd.innerHTML = W + 'px · 1rem <i>' + rem.toFixed(2) + 'px</i> · ' + n + ' cols';
        var mk = chart.querySelector('.mk');
        if (mk) { mk.setAttribute('cx', ((W - 375) / 1545 * 120).toFixed(1)); mk.setAttribute('cy', (34 - rem / 14 * 34).toFixed(1)); }
      }
      function setGrid(on) {
        dev.classList.toggle('grid', on); grBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
      }
      range.addEventListener('input', function () { user = true; W = +range.value; layout(); });
      mdBtn.addEventListener('click', function () {
        mode = mode === 'source' ? 'cont' : 'source';
        mdBtn.setAttribute('aria-pressed', mode === 'cont' ? 'true' : 'false');
        drawChart(); layout();
      });
      grBtn.addEventListener('click', function () { setGrid(!dev.classList.contains('grid')); });
      var stored = null;
      try { stored = localStorage.getItem(KEY); } catch (e) {}
      setGrid(stored === null ? true : stored === '1');   // source persists it as localStorage.isGrid

      // idle sweep 375 ↔ 1920 (easeInOutSine), stops for good once the viewer drags
      var lp = ctx.loop(function (dt) {
        if (user || ctx.reduced) return;
        sweepT += dt;
        var k = 0.5 - 0.5 * Math.cos(sweepT / 9 * Math.PI * 2 + Math.PI * 0.62);
        W = Math.round(375 + k * 1545); range.value = W; layout();
      });
      var ro = new ResizeObserver(layout);
      drawChart(); layout();

      return {
        start: function () { ro.observe(area); lp.start(); },
        stop: function () { ro.disconnect(); lp.stop(); }
      };
    }
  });
})();
