/* specs page — full HUD specification table; entrances wait for the cover to lift (gated-page-transitions, hud-cinematic-ui, masked-text-reveal) */
(function () {
  var GROUPS = [
    ['Sensor', [['Type', 'Full-frame BSI CMOS, monochrome and colour'], ['Resolution', '24 MP · 6000 × 4000'], ['Pixel pitch', '5.9 µm'], ['ISO', '50 – 102 400'], ['Dynamic range', '15 stops at base ISO'], ['Raw', '14-bit DNG']]],
    ['Lens', [['Focal length', '35 mm, fixed'], ['Aperture', 'f/1.4 – f/16'], ['Construction', '10 elements in 8 groups, 3 aspherical'], ['Blades', '11, rounded'], ['Close focus', '0.30 m'], ['Filter thread', '49 mm']]],
    ['Shutter', [['Mechanical', '1/8000 – 60 s'], ['Electronic', '1/32 000 s'], ['Flash sync', '1/250 s'], ['Burst', '8 fps'], ['Rated life', '300 000 cycles']]],
    ['Body', [['Weight', '412 g with battery'], ['Size', '132 × 84 × 48 mm'], ['Build', 'Magnesium top plate, aluminium base'], ['Sealing', 'Weather sealed, IP54'], ['Operating', '−20 to 45 °C'], ['Finish', 'Black or Stone'], ['Made in', 'Lysekil, Sweden']]],
    ['Power', [['Battery', 'HF‑40 Li-ion, 2 400 mAh'], ['Life', '40 hours of field use'], ['Charging', 'USB‑C PD, 0 – 80 % in 55 min'], ['Grip', 'Optional second HF‑40']]],
    ['Connectivity', [['Port', 'USB‑C 3.2, 10 Gbit/s'], ['Card', 'SD UHS‑II'], ['Wireless', 'Wi‑Fi 6, Bluetooth 5.3 LE'], ['Location', 'From your phone, optional']]]
  ];
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var S = '#specs ';
  var STYLE = [
    '#specs { position: relative; padding: calc(var(--nav-h, 7rem) + 6rem) 0 14rem; min-height: 100vh; }',
    S + '.sp-back { display: inline-flex; align-items: center; gap: .8rem; min-height: 44px; color: var(--p70); text-decoration: none; transition: color .2s; } ' + S + '.sp-back span { color: var(--signal); transition: transform .3s var(--ease-out); } ' + S + '.sp-back:hover { color: var(--paper); } ' + S + '.sp-back:hover span { transform: translateX(-3px); }',
    S + '.sp-head { max-width: 90rem; margin: 4rem 0 9rem; }',
    S + '.sp-title { font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: 9.6rem; line-height: .95; letter-spacing: -.02em; margin: 0; }',
    S + '.sp-lede { font-size: 1.8rem; line-height: 1.55; color: var(--p70); max-width: 52rem; margin: 3rem 0 0; }',
    S + '.sp-grid { display: grid; grid-template-columns: 1fr 1.15fr; gap: 8rem; align-items: start; }',
    S + '.hud { position: sticky; top: calc(var(--nav-h, 7rem) + 4rem); aspect-ratio: 1 / .82; display: grid; place-items: center; }',
    S + '.hud .c { position: absolute; width: 2.4rem; height: 2.4rem; border: 0 solid var(--p45); } ' + S + '.c1 { top: 0; left: 0; border-width: 1px 0 0 1px !important; } ' + S + '.c2 { top: 0; right: 0; border-width: 1px 1px 0 0 !important; } ' + S + '.c3 { bottom: 0; left: 0; border-width: 0 0 1px 1px !important; } ' + S + '.c4 { bottom: 0; right: 0; border-width: 0 1px 1px 0 !important; }',
    S + '.hud-top, ' + S + '.hud-bot { position: absolute; left: 2.4rem; right: 2.4rem; display: flex; justify-content: space-between; gap: 2rem; color: var(--p45); } ' + S + '.hud-top { top: 2rem; } ' + S + '.hud-bot { bottom: 2rem; }',
    S + '.hud-top b { color: var(--signal); font-weight: 500; font-family: var(--f-mono, monospace); } ' + S + '.hud-now { color: var(--paper); }',
    S + '.draw { width: 80%; overflow: visible; color: var(--p70); } ' + S + '.dim { stroke: var(--p45); stroke-width: 1; fill: none; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.2s var(--ease-io) .5s; } ' + S + '.dim-t { fill: var(--p45); font: 8px "Geist Mono", monospace; letter-spacing: 1px; opacity: 0; transition: opacity .6s ease 1.3s; }',
    S + '.is-in .dim { stroke-dashoffset: 0; } ' + S + '.is-in .dim-t { opacity: 1; }',
    S + '.cam { opacity: 0; transform: scale(1.04); transform-origin: 50% 55%; transition: opacity 1s var(--ease-out) .2s, transform 1.2s var(--ease-out) .2s; } ' + S + '.is-in .cam { opacity: 1; transform: none; }',
    S + '.grp { margin: 0 0 7rem; }',
    S + '.grp-h { position: relative; display: flex; align-items: baseline; gap: 1.6rem; margin: 0; padding-bottom: 1.6rem; }',
    S + '.grp-h::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--p45); transform: scaleX(0); transform-origin: left; transition: transform 1.2s var(--ease-io); } ' + S + '.grp.is-in .grp-h::after { transform: none; }',
    S + '.grp-h .mono { color: var(--signal); font-size: 1.3rem; } ' + S + '.grp-h .t { font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: 3.2rem; letter-spacing: -.01em; }',
    S + '.grp-h .mask { display: inline-block; vertical-align: bottom; }',
    S + '.grp dl { margin: 0; } ' + S + '.row { display: grid; grid-template-columns: minmax(12rem, 1fr) 1.6fr; gap: 2.4rem; align-items: baseline; padding: 1.5rem 0; border-bottom: 1px solid var(--p15); opacity: 0; transform: translateY(8px); transition: opacity .5s var(--ease-out), transform .5s var(--ease-out); transition-delay: calc(.35s + var(--i) * .05s); }',
    S + '.grp.is-in .row { opacity: 1; transform: none; }',
    S + '.row dt { color: var(--p45); } ' + S + '.row dd { margin: 0; font-family: "Geist Mono", monospace; font-variant-numeric: tabular-nums; font-size: 1.5rem; color: var(--p90); }',
    S + '.sp-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 2rem; align-items: center; margin-top: 4rem; padding-top: 3rem; border-top: 1px solid var(--p15); color: var(--p45); }',
    '@media (max-width: 900px) { ' + S + '.sp-grid { grid-template-columns: 1fr; gap: 4rem; } ' + S + '.hud { position: relative; top: 0; } }',
    '@media (max-width: 767px) { ' + S + '.sp-title { font-size: 5.2rem; } ' + S + '.sp-lede { font-size: 1.6rem; } ' + S + '.sp-head { margin-bottom: 5rem; } ' + S + '.hud { aspect-ratio: 1 / .9; } ' + S + '.hud-top, ' + S + '.hud-bot { left: 1.4rem; right: 1.4rem; } ' + S + '.row { grid-template-columns: 1fr; gap: .4rem; padding: 1.3rem 0; } ' + S + '.grp-h .t { font-size: 2.6rem; } }',
    '@media (prefers-reduced-motion: reduce) { ' + S + '.row, ' + S + '.cam { transform: none; transition: opacity .6s ease; } ' + S + '.grp-h::after, ' + S + '.dim { transition: none; } ' + S + '.dim-t { transition: opacity .6s ease; } }'
  ].join('\n');

  Site.section('specs', {
    css: STYLE,
    mount: function (root, ctx) {
      var n = 0;
      root.innerHTML =
        '<div class="wrap">' +
        '<a class="sp-back label rise" href="./" data-go><span aria-hidden="true">←</span>Back to the launch page</a>' +
        '<header class="sp-head"><p class="kicker rise" style="margin-top:3.2rem"><span>LF‑1</span>Full specification</p>' +
        '<h2 class="sp-title"><span class="mask"><span class="line">Every number,</span></span><span class="mask"><span class="line"><span class="serif">in full.</span></span></span></h2>' +
        '<p class="sp-lede rise">Six groups, one camera. Figures are for the production LF‑1 with the fixed 35 mm lens, measured in Lysekil.</p></header>' +
        '<div class="sp-grid">' +
        '<figure class="hud rise" style="margin:0" aria-label="Halden LF‑1, front view with dimensions"><i class="c c1"></i><i class="c c2"></i><i class="c c3"></i><i class="c c4"></i>' +
        '<div class="hud-top label" aria-hidden="true"><span>[ Nº <b class="hud-n">01</b> / 06 ]</span><span class="hud-now">Sensor</span></div>' +
        '<svg class="draw" viewBox="-20 -20 440 290" aria-hidden="true"><g class="cam"><use href="#lf1" width="400" height="240"/></g>' +
        '<path class="dim" pathLength="1" d="M20 236v12M380 236v12M20 244h360"/><text class="dim-t" x="200" y="262" text-anchor="middle">132 MM</text>' +
        '<path class="dim" pathLength="1" d="M392 14h12M392 214h12M400 14v200"/><text class="dim-t" x="410" y="118" transform="rotate(90 410 118)" text-anchor="middle">84 MM</text>' +
        '<path class="dim" pathLength="1" d="M200 128m-74 0a74 74 0 1 0 148 0a74 74 0 1 0-148 0"/></svg>' +
        '<div class="hud-bot label" aria-hidden="true"><span>35 mm · f/1.4</span><span>1/8000 s · ISO 50</span></div></figure>' +
        '<div class="sp-list">' + GROUPS.map(function (g, gi) {
          return '<section class="grp" data-i="' + gi + '" aria-labelledby="sp-g' + gi + '"><h3 class="grp-h" id="sp-g' + gi + '"><span class="mono" aria-hidden="true">' + pad(gi + 1) + '</span><span class="mask"><span class="line t">' + g[0] + '</span></span></h3><dl>' +
            g[1].map(function (r, i) { n++; return '<div class="row" style="--i:' + i + '"><dt class="label">' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl></section>';
        }).join('') +
        '<div class="sp-foot label"><span>Halden is a fictional camera · ' + n + ' figures</span><a class="sp-back" href="./" data-go><span aria-hidden="true">←</span>Back to the launch page</a></div></div></div></div>';

      var groups = [].slice.call(root.querySelectorAll('.grp')), hudN = root.querySelector('.hud-n'), hudNow = root.querySelector('.hud-now'), io = null, spy = null;
      function show(g) { g.classList.add('is-in'); g.querySelector('.grp-h').classList.add('is-in'); }
      ctx.palette.add({ id: 'specs-back', title: 'Back to the launch page', group: 'Go to', keywords: 'home index launch return', run: function () { ctx.go('./'); } });
      return {
        start: function () {
          if (spy || !window.IntersectionObserver) return;
          // HUD index follows the group under the middle of the viewport
          spy = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; var i = +e.target.dataset.i; hudN.textContent = pad(i + 1); hudNow.textContent = GROUPS[i][0]; }); }, { rootMargin: '-45% 0px -45% 0px' });
          groups.forEach(function (g) { spy.observe(g); });
        },
        stop: function () { if (spy) { spy.disconnect(); spy = null; } },
        enter: function () {
          // fires only after the cover has lifted: masked lines, hairline draws, row stagger
          root.querySelector('.sp-head').classList.add('is-in');
          [].forEach.call(root.querySelectorAll('.rise'), function (r, i) { r.style.transitionDelay = ctx.reduced ? '0s' : (.1 + i * .1).toFixed(2) + 's'; r.classList.add('is-in'); });
          root.querySelector('.hud').classList.add('is-in');
          if (ctx.reduced || !window.IntersectionObserver) return groups.forEach(show);
          io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { threshold: .15 });
          groups.forEach(function (g) { io.observe(g); });
        }
      };
    }
  });
})();
