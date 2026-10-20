/* #lenses (04): scissor-view-webgl-slots + sliding-indicator-tabs + shared-element-flip + char-split-scroll-reveal. */
(function () {
  var LENSES = [
    { mm: '28 mm', name: 'Wide', f: 'f/2.0', uses: ['street', 'landscape'], tag: 'SEK 6 900',
      blurb: 'Close enough to touch the scene, wide enough to keep its edges. Distortion is corrected in glass, not in software.',
      specs: [['Aperture', 'f/2.0 – f/16'], ['Elements', '8 in 6 groups'], ['Close focus', '0.2 m'], ['Weight', '168 g'], ['Price', 'SEK 6 900']],
      geo: { L: .95, R: .86, G: .62, D: .07 } },
    { mm: '35 mm', name: 'Standard', f: 'f/1.4', uses: ['street', 'portrait'], tag: 'On the body',
      blurb: 'The lens the LF‑1 ships with. Nine blades, fast enough for streetlight, quiet enough to forget it is there.',
      specs: [['Aperture', 'f/1.4 – f/16'], ['Blades', '9, rounded'], ['Elements', '10 in 7 groups'], ['Close focus', '0.3 m'], ['Price', 'Included']],
      geo: { L: 1.25, R: .8, G: .58, D: .12 } },
    { mm: '90 mm', name: 'Portrait', f: 'f/2.4', uses: ['portrait', 'landscape'], tag: 'SEK 8 400',
      blurb: 'Compresses a ridge line and a face the same way: calmly. A long focus throw, so you can land it by feel.',
      specs: [['Aperture', 'f/2.4 – f/22'], ['Elements', '7 in 5 groups'], ['Close focus', '0.7 m'], ['Weight', '214 g'], ['Price', 'SEK 8 400']],
      geo: { L: 1.95, R: .72, G: .6, D: .1 } }
  ];
  var TABS = [['all', 'All'], ['street', 'Street'], ['landscape', 'Landscape'], ['portrait', 'Portrait']];
  var EASE = 'cubic-bezier(.4,0,.1,1)', DUR = 450;          // Motion default layout transition
  var OUT3 = 'cubic-bezier(.165,.84,.44,1)', IO3 = 'cubic-bezier(.76,0,.24,1)';  // ≈ power3.out / inOut
  var api = null;

  // Nav submenu links (a[data-lens]) may be clicked before this section mounts: wait for the scroll to
  // settle, correct it if earlier sections grew while it ran (mount-on-approach), then open that lens.
  function settleThen(i) {
    var t0 = performance.now(), lastY = -1, moved = t0, fixes = 0;
    (function wait() {
      var sec = document.getElementById('lenses'), y = scrollY;
      var now = performance.now(); if (Math.abs(y - lastY) >= 1) moved = now; lastY = y;
      if (now - t0 > 10000 || !sec) return;
      if (now - moved > 160) {
        var r = sec.getBoundingClientRect();
        if ((r.top > innerHeight * .5 || r.bottom < 0) && fixes < 3) {
          fixes++; moved = now;
          sec.scrollIntoView({ behavior: fixes > 1 || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        } else if (api) { api.open(i); return; }
      }
      requestAnimationFrame(wait);
    })();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-lens]');
    if (a) settleThen(+a.getAttribute('data-lens'));
  });

  var css = [
    '#lenses { clip-path: inset(0); }',               /* keeps the fixed GL canvas inside the section */
    '#lenses .ln-head { display: grid; gap: 2.4rem; margin-bottom: 5.6rem; }',
    '@media (min-width: 900px) { #lenses .ln-head { grid-template-columns: 1.3fr 1fr; align-items: end; } }',
    '#lenses h2 { margin: 0; font-size: clamp(4rem, 7.2rem, 11vw); max-width: 12ch; }',
    '#lenses h2.pending { opacity: 0; }',
    '#lenses h2 .ln { display: block; overflow: hidden; padding-block: .1em; margin-block: -.1em; }',
    '#lenses h2 .w, #lenses h2 .c { display: inline-block; white-space: pre; }',
    '#lenses h2 .c { transform: translateY(105%); will-change: transform; }',
    '#lenses .ln-lede { margin: 0; max-width: 44ch; color: var(--p70); font-size: 1.7rem; }',
    /* sliding-indicator-tabs: moving pill (B), never scaled */
    '#lenses .ln-tabs { position: relative; display: inline-flex; gap: .2rem; padding: .4rem; border: 1px solid var(--p15); border-radius: 999px; margin-bottom: 3.2rem; max-width: 100%; overflow-x: auto; scrollbar-width: none; }',
    '#lenses .ln-ind { position: absolute; left: 0; top: .4rem; bottom: .4rem; width: 0; border-radius: 999px; background: var(--paper); pointer-events: none; }',
    '#lenses .ln-tabs.ready .ln-ind { transition: transform .45s ' + EASE + ', width .45s ' + EASE + '; }',
    '#lenses .ln-tab { position: relative; z-index: 1; min-height: 4.4rem; padding: 0 1.8rem; border-radius: 999px; color: var(--p70); font-size: 1.35rem; white-space: nowrap; transition: color .3s; }',
    '#lenses .ln-tab:hover { color: var(--paper); }',
    '#lenses .ln-tab[aria-selected="true"] { color: var(--ink); }',
    '#lenses .ln-grid { display: grid; gap: 1.6rem; grid-template-columns: 1fr; }',
    '@media (min-width: 640px) { #lenses .ln-grid { grid-template-columns: repeat(2, 1fr); } }',
    '@media (min-width: 1000px) { #lenses .ln-grid { grid-template-columns: repeat(3, 1fr); } }',
    '#lenses .lc { display: grid; text-align: left; border-radius: 1.6rem; background: var(--ink-2); border: 1px solid var(--p08); overflow: hidden; transition: border-color .3s, transform .16s var(--ease-out); }',
    '#lenses .lc:hover { border-color: var(--p15); } #lenses .lc:active { transform: scale(.99); }',
    '#lenses .lc.is-src { visibility: hidden; }',
    '#lenses .lc[hidden] { display: none; }',
    '#lenses .lc-art, #ln-detail .ln-d-art { position: relative; display: block; aspect-ratio: 4 / 3; border-radius: 1.2rem; margin: .6rem .6rem 0; background: radial-gradient(70% 70% at 50% 45%, #1d2026 0%, #0f0f0e 70%); overflow: hidden; }',
    '#lenses .lc-meta { display: grid; grid-template-columns: 1fr auto; gap: .4rem 1.6rem; padding: 2rem 2rem 2.2rem; }',
    '#lenses .lc-mm { grid-column: 1 / -1; color: var(--signal); }',
    '#lenses .lc-name, #ln-detail .ln-d-title { font-family: var(--f-display); font-stretch: 125%; font-weight: 500; letter-spacing: -.02em; line-height: 1; font-size: 3.2rem; justify-self: start; display: inline-block; }',
    '#lenses .lc-tag { align-self: end; color: var(--p45); }',
    '#lenses .lc-uses { grid-column: 1 / -1; color: var(--p45); margin-top: .8rem; }',
    '.lens-css { position: absolute; left: 50%; top: 50%; width: 52%; aspect-ratio: 1; transform: translate(-50%, -50%); border-radius: 50%; display: none;',
    '  background: radial-gradient(circle at 42% 38%, #4a5c6e 0, #121820 26%, #050607 44%, #2a2a27 45%, #1c1c1a 58%, #0c0c0b 59%, #0c0c0b 66%, #ff4d1f 66.5%, #1b1b19 67.5%, #1b1b19 100%);',
    '  box-shadow: 0 0 0 1px rgb(236 232 223 / .25), 0 2rem 4rem rgb(0 0 0 / .6); }',
    '#lenses.no-gl .lens-css, #ln-detail.no-gl .lens-css { display: block; }',
    '.ln-still { position: absolute; inset: 0; width: 100%; height: 100%; display: none; }',
    '.ln-still.on { display: block; }',
    '#lenses .ln-gl, #ln-detail .ln-gl { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 2; display: block; }',
    '#lenses .ln-foot { margin: 2.4rem 0 0; color: var(--p45); }',
    '#lenses .sr-only, #ln-detail .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }',
    /* detail dialog (appended to <body> so it can sit above the page) */
    '#ln-detail { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 1.6rem; }',
    '#ln-detail[hidden] { display: none; }',
    '#ln-detail .ln-scrim { position: absolute; inset: 0; background: rgb(8 8 7 / .78); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }',
    '#ln-detail .ln-panel { position: relative; width: min(108rem, 100%); max-height: calc(100vh - 3.2rem); max-height: calc(100dvh - 3.2rem); overflow: auto; display: grid; gap: 0; border-radius: 1.6rem; }',
    '#ln-detail .ln-panel.morphing { overflow: visible; }',
    '#ln-detail .ln-bg { position: absolute; inset: 0; border-radius: inherit; background: #121211; border: 1px solid var(--p15); pointer-events: none; }',
    '@media (min-width: 820px) { #ln-detail .ln-panel { grid-template-columns: 1.1fr 1fr; } #ln-detail .ln-d-art { aspect-ratio: 1; margin: .8rem; } }',
    '#ln-detail .ln-d-art { margin: .8rem .8rem 0; z-index: 1; }',
    '#ln-detail .ln-d-body { position: relative; padding: 3.2rem 2.4rem 3.2rem; display: grid; align-content: center; gap: 1.6rem; }',
    '@media (min-width: 820px) { #ln-detail .ln-d-body { padding: 6.4rem 4.8rem 4.8rem 2.4rem; } }',
    '#ln-detail .ln-d-mm { margin: 0; color: var(--signal); }',
    '#ln-detail .ln-d-title { font-size: clamp(4.4rem, 7.2rem, 14vw); margin: 0; transform-origin: 0 0; }',
    '#ln-detail .ln-d-copy { margin: 0; color: var(--p70); font-size: 1.6rem; max-width: 40ch; }',
    '#ln-detail dl { margin: .8rem 0 0; display: grid; grid-template-columns: auto 1fr; border-top: 1px solid var(--p15); }',
    '#ln-detail dt, #ln-detail dd { margin: 0; padding: 1rem 0; border-bottom: 1px solid var(--p08); }',
    '#ln-detail dt { color: var(--p45); padding-right: 2.4rem; } #ln-detail dd { text-align: right; }',
    '#ln-detail .ln-close { position: absolute; top: 1.6rem; right: 1.6rem; z-index: 3; background: rgb(13 13 12 / .6); }',
    '#ln-detail .ln-fade { transition: opacity .35s var(--ease-out) .1s, transform .5s var(--ease-out) .1s, filter .5s var(--ease-out) .1s; }',
    '#ln-detail.is-closed .ln-fade { opacity: 0; transform: translateY(1.2rem); filter: blur(4px); transition-delay: 0s; transition-duration: .2s; }',
    '#ln-detail .ln-scrim, #ln-detail .ln-bg { transition: opacity .35s var(--ease-out); }',
    '#ln-detail.is-closed .ln-scrim, #ln-detail.is-closed .ln-bg { opacity: 0; }',
    '::view-transition-group(ln-art), ::view-transition-group(ln-ttl) { animation-duration: .45s; animation-timing-function: ' + EASE + '; }',
    '::view-transition-group(ln-art) { overflow: clip; }',
    '::view-transition-old(ln-art), ::view-transition-new(ln-art) { width: 100%; height: 100%; object-fit: cover; }',
    '@media (prefers-reduced-motion: reduce) { #ln-detail .ln-fade, #ln-detail.is-closed .ln-fade { transform: none; filter: none; } #lenses .ln-tabs.ready .ln-ind { transition: none; } }'
  ].join('\n');

  // ---------- tiny math (column-major mat4) ----------
  function persp(fov, a, n, f) { var t = 1 / Math.tan(fov / 2), nf = 1 / (n - f); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]; }
  function mul(a, b) { var o = new Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; }
  function rx(t) { var c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; }
  function ry(t) { var c = Math.cos(t), s = Math.sin(t); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; }
  function rz(t) { var c = Math.cos(t), s = Math.sin(t); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
  function tr(x, y, z) { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]; }
  // cubic-bezier(.4,0,.1,1) solver for the FLIP fallback
  function bez(x1, y1, x2, y2) {
    function f(t, a, b) { return 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t; }
    return function (x) { var t = x; for (var i = 0; i < 8; i++) { var d = (f(t + 1e-4, x1, x2) - f(t, x1, x2)) / 1e-4; if (!d) break; t -= (f(t, x1, x2) - x) / d; t = Math.min(1, Math.max(0, t)); } return f(t, y1, y2); };
  }
  var ease = bez(.4, 0, .1, 1);

  // ---------- procedural lens: lathe of a profile (r, z, material) ----------
  // materials: 0 anodised body, 1 knurled ring, 2 signal ring, 3 glass
  function lensMesh(g) {
    var L = g.L, R = g.R, zb = -L / 2, zf = L / 2, P = [];
    P.push([0, zb, 0], [R * .72, zb, 0], [R * .72, zb + .1, 0], [R * .9, zb + .1, 2], [R * .9, zb + .14, 0],
      [R * .94, zb + .2, 1], [R * .94, zb + .2 + L * .2, 0], [R * .9, zb + .24 + L * .2, 0], [R, zb + .3 + L * .2, 1],
      [R, zf - .12, 0], [R * .97, zf, 0], [g.G + .05, zf, 0], [g.G + .05, zf - .03, 3]);
    for (var i = 0; i <= 8; i++) { var a = i / 8; P.push([g.G * Math.cos(a * Math.PI / 2), zf - .03 + g.D * Math.sin(a * Math.PI / 2), 3]); }
    var s = 1.5 / Math.max(L, 2 * R), SEG = 72, pos = [], nor = [], mat = [], ang = [];
    var cz = zf - .03 - (g.G * g.G - g.D * g.D) / (2 * g.D);   // glass sphere centre on the axis
    for (var k = 0; k < P.length - 1; k++) {
      var p0 = P[k], p1 = P[k + 1], m = p1[2] === 3 && p0[2] === 3 ? 3 : p0[2];
      var dr = p1[0] - p0[0], dz = p1[1] - p0[1], ln = Math.hypot(dr, dz) || 1, nr = dz / ln, nz = -dr / ln;
      for (var j = 0; j < SEG; j++) {
        var t0 = j / SEG * Math.PI * 2, t1 = (j + 1) / SEG * Math.PI * 2;
        var quad = [[p0, t0], [p1, t0], [p1, t1], [p0, t0], [p1, t1], [p0, t1]];
        for (var q = 0; q < 6; q++) {
          var pp = quad[q][0], th = quad[q][1], c = Math.cos(th), sn = Math.sin(th);
          pos.push(pp[0] * c * s, pp[0] * sn * s, (pp[1] + (L / 2 - .45 * L)) * s);
          if (m === 3) { var gx = pp[0], gz = pp[1] - cz, gl = Math.hypot(gx, gz); nor.push(gx / gl * c, gx / gl * sn, gz / gl); }
          else nor.push(nr * c, nr * sn, nz);
          mat.push(m); ang.push(th);
        }
      }
    }
    return { pos: new Float32Array(pos), nor: new Float32Array(nor), mat: new Float32Array(mat), ang: new Float32Array(ang), n: pos.length / 3 };
  }
  var VS = '#version 300 es\nin vec3 aP; in vec3 aN; in float aM; in float aA; uniform mat4 uMV, uP; out vec3 vN; out vec3 vV; out float vM; out float vA;\n' +
    'void main(){ vec4 p = uMV * vec4(aP, 1.); vN = mat3(uMV) * aN; vV = p.xyz; vM = aM; vA = aA; gl_Position = uP * p; }';
  var FS = '#version 300 es\nprecision highp float; in vec3 vN; in vec3 vV; in float vM; in float vA; out vec4 o;\n' +
    'void main(){ vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N; vec3 V = normalize(-vV);\n' +
    ' vec3 L1 = normalize(vec3(-.55, .75, .6)), L2 = normalize(vec3(.9, -.1, -.4));\n' +
    ' vec3 base = vec3(.075, .074, .07); float shin = 36., ks = .55;\n' +
    ' if (vM > .5 && vM < 1.5) { float k = step(.5, fract(vA * 90. / 6.2832)); base *= .55 + .7 * k; ks = .35; }\n' +
    ' if (vM > 1.5 && vM < 2.5) { base = vec3(1., .3, .12); ks = .3; }\n' +
    ' float fr = pow(1. - max(dot(N, V), 0.), 3.);\n' +
    ' vec3 c = base * (.22 + 1.1 * max(dot(N, L1), 0.)) + vec3(.55, .6, .7) * .35 * pow(max(dot(N, L2), 0.), 2.);\n' +
    ' c += vec3(.92, .9, .86) * ks * pow(max(dot(N, normalize(L1 + V)), 0.), shin);\n' +
    ' if (vM > 2.5) { vec3 Rf = reflect(-V, N); float sky = smoothstep(.1, .5, Rf.y) * .5 + smoothstep(.85, .95, Rf.x) * .4;\n' +
    '   c = vec3(.012, .016, .026) + vec3(.16, .3, .34) * fr * .45 + vec3(.55, .6, .7) * sky * .22 + vec3(1.) * pow(max(dot(N, normalize(L1 + V)), 0.), 120.) * 1.2; }\n' +
    ' c += vec3(.9, .88, .84) * fr * .08;\n' +
    ' o = vec4(pow(c, vec3(.8)), 1.); }';

  Site.section('lenses', {
    css: css,
    mount: function (root, ctx) {
      var R = ctx.reduced;
      root.innerHTML =
        '<div class="wrap">' +
          '<p class="kicker"><span>04</span>Lenses</p>' +
          '<div class="ln-head">' +
            '<h2 class="display ln-title' + (R ? '' : ' pending') + '">Three fields <span class="serif">of</span> view.</h2>' +
            '<p class="ln-lede">One body, three lenses. The 35 mm ships on the LF‑1; the 28 mm and 90 mm are bayonet front modules that swap in under ten seconds and are sealed like the body.</p>' +
          '</div>' +
          '<div class="ln-tabs" role="tablist" aria-label="Filter lenses by use"><span class="ln-ind" aria-hidden="true"></span>' +
            TABS.map(function (t, i) { return '<button type="button" class="ln-tab" role="tab" id="ln-tab-' + t[0] + '" aria-controls="ln-panel" aria-selected="' + (i ? 'false' : 'true') + '" tabindex="' + (i ? -1 : 0) + '">' + t[1] + '</button>'; }).join('') +
          '</div>' +
          '<div class="ln-grid" id="ln-panel" role="tabpanel" aria-labelledby="ln-tab-all">' +
            LENSES.map(function (l, i) {
              return '<button type="button" class="lc" data-i="' + i + '" aria-haspopup="dialog" aria-label="' + l.mm + ' ' + l.name + ', ' + l.f + '. Open details">' +
                '<span class="lc-art" aria-hidden="true"><span class="lens-css" style="width:' + [58, 50, 44][i] + '%"></span><canvas class="ln-still"></canvas></span>' +
                '<span class="lc-meta" aria-hidden="true"><span class="lc-mm label mono">' + l.mm + ' · ' + l.f + '</span><span class="lc-name">' + l.name + '</span><span class="lc-tag label">' + l.tag + '</span>' +
                '<span class="lc-uses label">' + l.uses.join(' · ') + '</span></span></button>';
            }).join('') +
          '</div>' +
          '<p class="ln-foot label"><span class="ln-count" aria-live="polite">3 lenses</span> · Every module fits every LF‑1</p>' +
        '</div>';

      var title = root.querySelector('.ln-title'), tablist = root.querySelector('.ln-tabs'), ind = root.querySelector('.ln-ind');
      var tabs = [].slice.call(root.querySelectorAll('.ln-tab')), grid = root.querySelector('.ln-grid');
      var cards = [].slice.call(root.querySelectorAll('.lc')), countEl = root.querySelector('.ln-count');
      var progress = .5, hov = [0, 0, 0], hovTo = [0, 0, 0], spin = [0, 0, 0], live = false;

      // ---------- char-split-scroll-reveal: chars, line masks, once-only, hover re-roll, resplit ----------
      var TPL = title.innerHTML, TEXT = title.textContent, chars = [], splitW = 0, revealed = false, rolling = false, entered = false;
      title.setAttribute('aria-label', TEXT);
      function split() {
        var tmp = document.createElement('div'); tmp.innerHTML = TPL;
        var words = [[]];
        [].forEach.call(tmp.childNodes, function (n) {
          var cls = n.nodeType === 1 ? n.className : '', s = n.textContent;
          for (var i = 0; i < s.length; i++) { if (s[i] === ' ') words.push([]); else words[words.length - 1].push([s[i], cls]); }
        });
        title.innerHTML = '';
        var wEls = words.filter(function (w) { return w.length; }).map(function (w, wi, all) {
          var we = document.createElement('span'); we.className = 'w'; we.setAttribute('aria-hidden', 'true');
          w.forEach(function (c) { var ce = document.createElement('span'); ce.className = 'c ' + c[1]; ce.textContent = c[0]; we.appendChild(ce); });
          title.appendChild(we); if (wi < all.length - 1) title.appendChild(document.createTextNode(' '));
          return we;
        });
        var rows = [], top = null;
        wEls.forEach(function (w) { if (top === null || Math.abs(w.offsetTop - top) > 4) { rows.push([]); top = w.offsetTop; } rows[rows.length - 1].push(w); });
        title.innerHTML = '';
        rows.forEach(function (row) {
          var ln = document.createElement('span'); ln.className = 'ln';
          row.forEach(function (w, i) { ln.appendChild(w); if (i < row.length - 1) ln.appendChild(document.createTextNode(' ')); });
          title.appendChild(ln);
        });
        chars = [].slice.call(title.querySelectorAll('.c')); splitW = title.offsetWidth;
      }
      function revert() { title.innerHTML = TPL; chars = []; }
      function play(from, to, dur, each, easing, done) {
        chars.forEach(function (c) { c.style.transition = 'none'; c.style.transform = from; });
        title.offsetWidth;
        chars.forEach(function (c, i) { c.style.transition = 'transform ' + dur + 's ' + easing + ' ' + (i * each).toFixed(3) + 's'; c.style.transform = to; });
        return setTimeout(done, (dur + chars.length * each) * 1000 + 50);
      }
      function reveal() {
        if (revealed || R) return;
        revealed = true;
        if (!chars.length) split();
        title.classList.remove('pending');
        play('translateY(105%)', 'translateY(0%)', 1.4, .02, OUT3, function () { title.classList.add('animated'); revert(); });
      }
      function reroll() {   // hover: chars leave up, a fresh set rises from below (~0.6 s)
        if (R || !ctx.fine || rolling || !title.classList.contains('animated')) return;
        rolling = true; split();
        chars.forEach(function (c) { c.style.transform = 'none'; });
        play('translateY(0%)', 'translateY(-105%)', .3, .01, IO3, function () {
          play('translateY(105%)', 'translateY(0%)', .3, .01, OUT3, function () { revert(); rolling = false; });
        });
      }
      title.addEventListener('pointerenter', reroll);
      var fontsReady = false;
      if (!R) {
        (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
          fontsReady = true;
          if (!revealed) { split(); title.classList.remove('pending'); if (entered) reveal(); }
        });
      }
      var tro = new ResizeObserver(function () {
        if (R || !fontsReady || revealed || rolling) return;
        if (Math.abs(title.offsetWidth - splitW) > 1) { revert(); split(); }
      });
      tro.observe(title);

      // ---------- sliding-indicator-tabs ----------
      var tabIdx = 0;
      function placeInd() {
        var t = tabs[tabIdx];
        ind.style.width = t.offsetWidth + 'px';
        ind.style.transform = 'translateX(' + t.offsetLeft + 'px)';
      }
      placeInd(); requestAnimationFrame(function () { tablist.classList.add('ready'); });
      if (document.fonts) document.fonts.ready.then(placeInd);
      var tabRO = new ResizeObserver(placeInd); tabRO.observe(tablist);
      function selectTab(i, focus) {
        if (i === tabIdx) { if (focus) tabs[i].focus(); return; }
        tabIdx = i;
        tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
        grid.setAttribute('aria-labelledby', tabs[i].id);
        if (focus) tabs[i].focus();
        tabs[i].scrollIntoView({ inline: 'nearest', block: 'nearest' });
        placeInd(); filter(TABS[i][0]);
        ctx.audio.click(.2);
      }
      tabs.forEach(function (t, i) { t.addEventListener('click', function () { selectTab(i); }); });
      tablist.addEventListener('keydown', function (e) {
        var n = tabs.length, k = { ArrowRight: tabIdx + 1, ArrowLeft: tabIdx - 1 + n, Home: 0, End: n - 1 }[e.key];
        if (k === undefined) return;
        e.preventDefault(); selectTab(k % n, true);
      });

      // ---------- shared-element-flip: filter reorder (siblings glide, newcomers fade in) ----------
      function filter(use) {
        var first = new Map();
        cards.forEach(function (c) { if (!c.hidden) first.set(c, c.getBoundingClientRect()); c.getAnimations().forEach(function (a) { a.cancel(); }); });
        var shown = 0;
        cards.forEach(function (c, i) { var on = use === 'all' || LENSES[i].uses.indexOf(use) >= 0; c.hidden = !on; if (on) shown++; });
        countEl.textContent = shown + (shown === 1 ? ' lens' : ' lenses');
        cards.forEach(function (c, i) {
          if (c.hidden) return;
          var a = first.get(c), b = c.getBoundingClientRect();
          if (R) { c.animate([{ opacity: a ? 1 : 0 }, { opacity: 1 }], { duration: 160 }); return; }
          if (!a) { c.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: DUR, easing: EASE, delay: 80 }); return; }
          var dx = a.left - b.left, dy = a.top - b.top;
          if (Math.abs(dx) < .5 && Math.abs(dy) < .5) return;
          c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: DUR, easing: EASE, delay: i * 18 });
        });
      }

      // ---------- scissor-view-webgl-slots: ONE canvas, a scissor+viewport per slot ----------
      var useGL = ctx.tier.tier > 0 && ctx.tier.webgl2, gl = null, prog, U = {}, meshes = [], cv = document.createElement('canvas');
      cv.className = 'ln-gl'; cv.setAttribute('aria-hidden', 'true');
      if (useGL) {
        try {
          gl = cv.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true });
          var sh = function (t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
          prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
          if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
          U.mv = gl.getUniformLocation(prog, 'uMV'); U.p = gl.getUniformLocation(prog, 'uP');
          meshes = LENSES.map(function (l) {
            var m = lensMesh(l.geo), vao = gl.createVertexArray(); gl.bindVertexArray(vao);
            [['aP', m.pos, 3], ['aN', m.nor, 3], ['aM', m.mat, 1], ['aA', m.ang, 1]].forEach(function (a) {
              var b = gl.createBuffer(), loc = gl.getAttribLocation(prog, a[0]); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a[1], gl.STATIC_DRAW);
              gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, a[2], gl.FLOAT, false, 0, 0);
            });
            gl.bindVertexArray(null); return { vao: vao, n: m.n };
          });
          gl.enable(gl.DEPTH_TEST);
        } catch (err) { gl = null; }
      }
      if (gl) root.appendChild(cv); else root.classList.add('no-gl');
      var vw = 0, vh = 0, dpr = 1;
      function fit() {
        var w = innerWidth, h = innerHeight, d = Math.min(devicePixelRatio || 1, ctx.tier.dpr || 2);
        if (w === vw && h === vh && d === dpr) return;
        vw = w; vh = h; dpr = d; cv.width = Math.round(w * d); cv.height = Math.round(h * d);
      }
      function angles(i, t) {
        if (R) return { yaw: -.95 + i * .1, pitch: .5, spin: 0 };
        var p = progress - .5;
        return { yaw: -.95 + p * 1.4 + i * .12 + hov[i] * .45 + Math.sin(t * .5 + i) * .04, pitch: .5 - p * .4 - hov[i] * .12, spin: spin[i] + p * 2.4 };
      }
      function drawSlot(el, i, t) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh || r.width < 2) return;
        var x = Math.round(r.left * dpr), y = Math.round((vh - r.bottom) * dpr), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
        gl.viewport(x, y, w, h); gl.scissor(x, y, w, h); gl.clear(gl.DEPTH_BUFFER_BIT);
        var a = angles(i, t), mv = mul(tr(0, 0, -4.2), mul(ry(a.yaw), mul(rx(a.pitch), rz(a.spin))));
        gl.uniformMatrix4fv(U.p, false, persp(30 * Math.PI / 180, r.width / r.height, .1, 20));
        gl.uniformMatrix4fv(U.mv, false, mv);
        gl.bindVertexArray(meshes[i].vao); gl.drawArrays(gl.TRIANGLES, 0, meshes[i].n);
      }
      var D = null, openIdx = -1, vtBusy = false;
      function render(t) {
        if (!gl) return;
        fit(); gl.useProgram(prog);
        gl.disable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.SCISSOR_TEST);
        if (openIdx >= 0) { if (!vtBusy) drawSlot(D.art, openIdx, t); return; }
        cards.forEach(function (c, i) { if (!c.hidden && !c.classList.contains('is-src')) drawSlot(c.querySelector('.lc-art'), i, t); });
      }
      var T = 0;
      var lp = ctx.loop(function (dt, t) {
        T = t;
        for (var i = 0; i < 3; i++) { hov[i] = ctx.damp(hov[i], hovTo[i], 6, dt); spin[i] += dt * hov[i] * 1.6; }
        render(t);
      });
      cards.forEach(function (c, i) {
        c.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hovTo[i] = 1; });
        c.addEventListener('pointerleave', function () { hovTo[i] = 0; });
        c.addEventListener('focus', function () { hovTo[i] = 1; });
        c.addEventListener('blur', function () { hovTo[i] = 0; });
        c.addEventListener('click', function () { open(i); });
      });
      // copy the GL pixels of a slot into a 2D still (View Transition snapshots can't see the shared canvas)
      function still(fromEl, i, toCanvas) {
        var r = fromEl.getBoundingClientRect();
        toCanvas.width = Math.max(1, Math.round(r.width * dpr)); toCanvas.height = Math.max(1, Math.round(r.height * dpr));
        if (!gl) return;
        gl.useProgram(prog);
        gl.disable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.SCISSOR_TEST);
        drawSlot(fromEl, i, T);
        var g = toCanvas.getContext('2d'); g.clearRect(0, 0, toCanvas.width, toCanvas.height);
        g.drawImage(cv, r.left * dpr, (r.top) * dpr, r.width * dpr, r.height * dpr, 0, 0, toCanvas.width, toCanvas.height);
        toCanvas.classList.add('on');
      }

      // ---------- detail dialog ----------
      D = { el: document.createElement('div') };
      D.el.id = 'ln-detail'; D.el.hidden = true; D.el.className = 'is-closed' + (gl ? '' : ' no-gl');
      D.el.innerHTML = '<div class="ln-scrim" data-close></div>' +
        '<div class="ln-panel" role="dialog" aria-modal="true" aria-labelledby="ln-d-title">' +
          '<span class="ln-bg" aria-hidden="true"></span>' +
          '<div class="ln-d-art" aria-hidden="true"><span class="lens-css"></span><canvas class="ln-still"></canvas></div>' +
          '<div class="ln-d-body"><p class="ln-d-mm label mono ln-fade"></p><h3 class="ln-d-title" id="ln-d-title" tabindex="-1"></h3>' +
            '<p class="ln-d-copy ln-fade"></p><dl class="ln-fade"></dl>' +
            '<p class="ln-fade" style="margin:.8rem 0 0"><a class="btn small" href="#buy" data-close>Build a kit</a></p></div>' +
          '<button type="button" class="tool ln-close" data-close><span class="label">Close</span><span aria-hidden="true">✕</span></button>' +
        '</div>';
      document.body.appendChild(D.el);
      D.panel = D.el.querySelector('.ln-panel'); D.art = D.el.querySelector('.ln-d-art'); D.title = D.el.querySelector('.ln-d-title');
      D.still = D.art.querySelector('.ln-still'); D.close = D.el.querySelector('.ln-close');
      var lastFocus = null, raf = 0, busy = false;
      var outside = function () { return [document.getElementById('main'), document.getElementById('nav'), document.querySelector('.foot')].filter(Boolean); };
      function fill(i) {
        var l = LENSES[i];
        D.el.querySelector('.ln-d-mm').textContent = l.mm + ' · ' + l.f + ' · ' + l.uses.join(' · ');
        D.title.textContent = l.name;
        D.el.querySelector('.ln-d-copy').textContent = l.blurb;
        D.el.querySelector('dl').innerHTML = l.specs.map(function (s) { return '<dt class="label">' + s[0] + '</dt><dd class="mono">' + s[1] + '</dd>'; }).join('');
      }
      function morph(el, from, to, reverse, done) {   // FLIP with border-radius correction
        cancelAnimationFrame(raf);
        var sx = from.width / to.width, sy = from.height / to.height, dx = from.left - to.left, dy = from.top - to.top, t0 = performance.now();
        el.style.transformOrigin = '0 0';
        (function frame(now) {
          var p = Math.min((now - t0) / DUR, 1), e = ease(p), k = reverse ? e : 1 - e;
          var ax = 1 + (sx - 1) * k, ay = 1 + (sy - 1) * k, r = 12 + (16 - 12) * (1 - k);
          el.style.transform = 'translate(' + dx * k + 'px,' + dy * k + 'px) scale(' + ax + ',' + ay + ')';
          el.style.borderRadius = (r / ax).toFixed(2) + 'px / ' + (r / ay).toFixed(2) + 'px';
          if (p < 1) raf = requestAnimationFrame(frame); else { el.style.transform = ''; el.style.borderRadius = ''; if (done) done(); }
        })(t0);
      }
      function titleFlip(from, to, reverse) {
        var s = from.height / to.height, kf = [{ transform: 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(' + s + ')' }, { transform: 'none' }];
        return D.title.animate(reverse ? kf.reverse() : kf, { duration: DUR, easing: EASE, fill: 'both' });
      }
      function setOpen(i) {   // DOM state for "open" (used inside the view transition update or directly)
        openIdx = i; cards[i].classList.add('is-src');
        D.el.hidden = false; D.el.appendChild(cv);
        outside().forEach(function (n) { n.inert = true; });
      }
      function setClosed(i) {
        openIdx = -1; cards[i].classList.remove('is-src');
        D.el.hidden = true; D.el.classList.add('is-closed');
        if (gl) root.appendChild(cv);
        outside().forEach(function (n) { n.inert = false; });
      }
      function canVT() { return !R && !!document.startViewTransition; }
      function open(i) {
        if (busy || openIdx >= 0) return;
        busy = true; lastFocus = cards[i]; fill(i);
        var cArt = cards[i].querySelector('.lc-art'), cTtl = cards[i].querySelector('.lc-name');
        ctx.lockScroll(true); ctx.audio.whoosh(.25);
        var finish = function () { busy = false; D.title.focus({ preventScroll: true }); };
        if (canVT()) {
          var cStill = cArt.querySelector('.ln-still');
          still(cArt, i, cStill);
          cArt.style.viewTransitionName = 'ln-art'; cTtl.style.viewTransitionName = 'ln-ttl';
          var vt = document.startViewTransition(function () {
            cArt.style.viewTransitionName = ''; cTtl.style.viewTransitionName = '';
            vtBusy = true; setOpen(i); D.el.classList.remove('is-closed');
            D.still.width = cStill.width; D.still.height = cStill.height; D.still.getContext('2d').drawImage(cStill, 0, 0); D.still.classList.add('on');
            cStill.classList.remove('on');
            D.art.style.viewTransitionName = 'ln-art'; D.title.style.viewTransitionName = 'ln-ttl';
          });
          vt.finished.then(function () {
            D.art.style.viewTransitionName = ''; D.title.style.viewTransitionName = '';
            vtBusy = false; render(T); D.still.classList.remove('on'); finish();
          });
          return;
        }
        var first = cArt.getBoundingClientRect(), firstT = cTtl.getBoundingClientRect();
        setOpen(i); render(T);
        if (R) { D.el.classList.remove('is-closed'); finish(); return; }
        D.panel.classList.add('morphing');
        D.el.offsetWidth; D.el.classList.remove('is-closed');
        titleFlip(firstT, D.title.getBoundingClientRect(), false).finished.then(function () { D.title.getAnimations().forEach(function (a) { a.cancel(); }); });
        morph(D.art, first, D.art.getBoundingClientRect(), false, function () { D.panel.classList.remove('morphing'); finish(); });
      }
      function close() {
        if (busy || openIdx < 0) return;
        busy = true;
        var i = openIdx, card = cards[i], cArt = card.querySelector('.lc-art'), cTtl = card.querySelector('.lc-name');
        ctx.audio.whoosh(.2);
        var finish = function () { busy = false; ctx.lockScroll(false); if (lastFocus) lastFocus.focus({ preventScroll: true }); };
        if (canVT()) {
          still(D.art, i, D.still);
          D.art.style.viewTransitionName = 'ln-art'; D.title.style.viewTransitionName = 'ln-ttl'; vtBusy = true;
          var vt = document.startViewTransition(function () {
            D.art.style.viewTransitionName = ''; D.title.style.viewTransitionName = ''; D.still.classList.remove('on');
            var cStill = cArt.querySelector('.ln-still');
            cStill.width = D.still.width; cStill.height = D.still.height; cStill.getContext('2d').drawImage(D.still, 0, 0); cStill.classList.add('on');
            setClosed(i); vtBusy = false;
            cArt.style.viewTransitionName = 'ln-art'; cTtl.style.viewTransitionName = 'ln-ttl';
          });
          vt.finished.then(function () { cArt.style.viewTransitionName = ''; cTtl.style.viewTransitionName = ''; render(T); cArt.querySelector('.ln-still').classList.remove('on'); finish(); });
          return;
        }
        if (R) { setClosed(i); finish(); return; }
        var to = cArt.getBoundingClientRect(), toT = cTtl.getBoundingClientRect();
        D.panel.classList.add('morphing'); D.el.classList.add('is-closed');
        titleFlip(toT, D.title.getBoundingClientRect(), true);
        morph(D.art, to, D.art.getBoundingClientRect(), true, function () {
          D.panel.classList.remove('morphing'); D.title.getAnimations().forEach(function (a) { a.cancel(); });
          setClosed(i); finish();
        });
      }
      D.el.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
      document.addEventListener('keydown', function (e) {
        if (openIdx < 0) return;
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        if (e.key === 'Tab') {   // keep focus inside the dialog
          var f = [].slice.call(D.panel.querySelectorAll('a[href], button, [tabindex="0"]')), a = f[0], z = f[f.length - 1];
          if (e.shiftKey && (document.activeElement === a || document.activeElement === D.title)) { e.preventDefault(); z.focus(); }
          else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
        }
      });

      // nav submenu + ⌘K: scroll here, wait for the scroll to settle, then open (settleThen above)
      function openLens(i) {
        if (openIdx >= 0) return;
        if (cards[i].hidden) selectTab(0);
        cards[i].scrollIntoView({ block: 'nearest' }); open(i);
      }
      api = { open: openLens };
      LENSES.forEach(function (l, i) {
        ctx.palette.add({ id: 'lens-' + i, title: 'Open lens: ' + l.mm + ' ' + l.name, group: 'Actions', keywords: ['lens', l.mm, l.name, l.f].concat(l.uses).join(' '),
          run: function () { root.scrollIntoView({ behavior: R ? 'auto' : 'smooth' }); settleThen(i); } });
      });
      if (!gl) render(0);

      return {
        start: function () { live = true; if (gl) lp.start(); },
        stop: function () { live = false; lp.stop(); hovTo = [0, 0, 0]; if (gl && openIdx < 0) { gl.disable(gl.SCISSOR_TEST); gl.clear(gl.COLOR_BUFFER_BIT); } },
        scroll: function (m) { progress = m.progress; },
        enter: function () { entered = true; if (fontsReady || !document.fonts) reveal(); }
      };
    }
  });
})();
