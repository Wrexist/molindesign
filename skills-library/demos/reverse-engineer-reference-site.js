/* reverse-engineer-reference-site — the real execution coverage REA recorded on oryzo.ai (Oct 2026).
   Every bar is one function in the 1.1 MB bundle, placed by its offset, height = calls per second.
   Idle vs scroll vs scroll minus idle: the subtraction is what finds the motion code. */
Lib.register('reverse-engineer-reference-site', {
  hint: 'Switch Idle → Scroll → Scroll − idle and watch the motion code surface',
  notes: [
    'oryzo.ai, measured: <code>484</code> bundle functions ran while scrolling; <code>123</code> rose ≥ 3× over a 6 s idle window',
    'What rose: prop physics (<code>integrate</code> damps with <code>Math.exp(-dt·damping)</code>), wheel input clamped to <code>±200 px</code>',
    'Pipeline: <code>inspect_web_page</code> → <code>export_web_scripts</code> → <code>observe_web_execution</code> ×2 → diff',
    'Fingerprint the same bundle: three.js r178, GSAP SplitText 3.14.2, Rive, 117 shader strings',
    'Scenario defaults are 1280×720 with <code>reduced_motion: reduce</code>; set both for a motion teardown'
  ],
  simplified: 'A static replay of one recorded run (offsets, rates and the labelled names are real); the live teardown runs offline via scripts/teardown.sh with Chrome and REA.',
  css: [
    '.d-reverse-engineer-reference-site canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }',
    '.d-reverse-engineer-reference-site .d-rers-bar { position: absolute; left: 12px; right: 12px; bottom: 12px; display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }',
    '.d-reverse-engineer-reference-site button { appearance: none; border: 1px solid rgb(255 255 255 / .28); background: rgb(0 0 0 / .55); color: #fff; font: 500 10.5px/1 "Geist Mono", ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; padding: 9px 12px; border-radius: 999px; cursor: pointer; transition: border-color .2s ease, background-color .2s ease, color .2s ease, transform .16s cubic-bezier(.23,1,.32,1); }',
    '.d-reverse-engineer-reference-site button:hover { border-color: #fff; }',
    '.d-reverse-engineer-reference-site button:active { transform: scale(.97); }',
    '.d-reverse-engineer-reference-site button[aria-pressed="true"] { background: #fff; color: #000; border-color: #fff; }',
    '.d-reverse-engineer-reference-site button:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }',
    '.d-reverse-engineer-reference-site .d-rers-count { margin-left: auto; color: rgb(255 255 255 / .7); font: 400 10.5px "Geist Mono", ui-monospace, monospace; letter-spacing: .08em; }'
  ].join('\n'),
  mount: function (stage, ctx) {
    /* offset (‱ of 1,097,784 UTF-16 units), idle calls/s, scroll calls/s — from idle.json and scroll.json */
    var RAW = '1,289,248;2,40.3,40.3;2,102,226;2,200,159;3,62.8,53.7;3,200,159;4,250,226;6,2.33,6;6,2.33,2.11;7,0,3.89;56,0,0.222;60,0,6.67;78,86.3,58.2;103,4.67,0;104,4.67,0;104,4.67,0;104,4.67,0;104,39.7,55.2;108,51.3,68.3;109,23.3,32.8;110,0,11.7;111,21,31.8;112,39.7,49.2;113,7,15.2;122,0,3.89;123,0,9.44;124,0,1.11;126,2.33,2.11;127,2.33,2.11;132,0,7.78;142,95.7,14.8;143,95.7,14.8;143,95.7,14.8;144,95.7,14.8;144,182,12.7;146,4.67,8.44;147,4.67,16.4;154,9.33,2.11;156,114,2.11;170,2.33,2.11;171,11.7,4.22;171,14,6.33;173,88.7,4.22;182,65.3,4;183,37.3,0;186,274,14;187,2.33,2.11;188,156,227;193,25.7,31.6;194,4.67,4.22;196,2.33,2.11;198,143,313;203,11.7,18.9;205,7,6.33;207,2.33,2.11;220,16.3,64.8;221,481,315;223,95.7,10.6;236,7,4.22;241,65.3,8.56;242,37.3,0;248,58.3,60.8;249,0,0.111;252,58.3,60.8;253,0,0.111;254,0,0.111;259,58.3,60.8;263,58.3,60.8;264,58.3,60.8;286,93.3,107;290,63,65.8;291,30.3,40.8;291,4.67,0;292,14,0.444;293,0,0.111;294,0,0.111;306,84,122;307,35,52.7;322,4.67,0;341,9.33,0;369,4.67,0;373,65.3,45.7;379,119,85.8;385,103,97.6;386,119,124;405,103,97.6;416,135,249;436,124,114;438,2.33,2.11;507,2.33,10.4;514,2.33,10.4;561,4.67,4.22;563,4.67,4.22;564,132,180;583,72.3,29.6;587,95.7,2.67;587,93.3,0;588,171,93.8;596,136,62.9;602,112,70.4;612,2.33,10.4;621,135,88.7;624,114,2.11;629,4.67,4.22;633,2.33,2.11;638,12,0;645,2.33,2.67;645,2.33,13.8;647,2.33,2.67;649,72.3,29.6;660,72.3,29.6;666,2.33,2.67;668,0,0.111;669,0,0.222;669,189,190;677,2.33,13.8;677,72.3,29.6;685,107,110;685,107,110;692,4.67,4.22;694,4.67,4.22;700,0,1.67;705,0,1.67;708,0,1.67;721,79.3,0;723,159,114;724,163,116;833,0,0.556;834,4.67,5.89;836,30.3,40.8;842,30.3,40.2;855,72.3,75.3;856,2.33,4.22;857,0,0.556;858,2.33,4.22;858,0,0.556;859,4.67,9.56;861,1,3;865,56,54.1;867,2.33,2.11;874,8,9.33;879,2.33,6;894,0,1.44;895,58.3,60.8;896,0,0.111;896,0,1.44;1199,56,54.1;1225,56,53.6;1240,2.33,2.11;1244,4.67,4.22;1341,138,309;1345,138,309;1346,14,62.7;1360,53.7,51.4;1367,2.33,10.4;1372,2.33,10.4;1475,2.33,2.11;1534,7,12.8;1536,91,101;1740,107,103;1741,53.7,51.4;1745,53.7,51.4;1766,56,54.1;1768,0,0.556;1769,2.33,2.67;1769,0,0.556;1771,58.3,60.8;1773,0,0.111;1774,44.3,47.6;1774,58.3,60.8;1776,0,0.111;1778,58.2,60.7;1782,0,0.111;1786,0,0.111;1786,0,0.111;1786,0,0.111;1788,0,0.111;1789,0,0.111;1790,0,0.111;1811,53.7,51.4;1813,51.3,48.2;1813,51.3,48.2;1838,53.7,51.4;1849,58.3,63.7;1863,14,1.56;1870,9.33,1.56;1872,4.67,0;1877,58.3,1.11;1878,58.3,60.8;1885,7,12.6;1885,7,12.6;1885,7,12.6;1892,58.3,60.8;1895,53.7,51.4;1913,58.3,60.8;1922,15,42.9;1924,4.67,22;1926,86.3,95.8;1926,114,115;1928,32.7,37.9;1932,9.33,11.9;1936,4.67,2.11;1939,35,40.8;1956,103,98.8;1961,0,1.22;1969,2.33,2.11;1993,0,1.22;1997,0,1.22;1997,0,1.22;2001,0,0.111;2003,132,51.3;2004,20.3,60.8;2005,0,0.111;2006,0,0.222;2010,0,0.111;2011,0,1;2016,0,0.111;2022,0,0.111;2025,0,0.111;2027,0,0.111;2028,0,0.111;2031,0,23.2;2032,0,0.222;2038,0,0.222;2040,0,0.444;2041,0,0.222;2045,0,0.222;2047,0,0.222;2055,0,0.111;2058,0,0.111;2060,0,0.111;2061,0,0.111;2064,0,0.111;2066,0,0.111;2163,0,0.111;2171,58.3,60.9;2172,58.2,60.9;2177,0,1.44;2181,0,1.44;2181,0,1.44;2183,0,1.44;2184,0,5.78;2185,0,0.222;2191,0,1.44;2248,0,1.44;2251,0,0.111;2263,0,0.111;2275,0,0.111;2276,0,0.111;2281,134,261;2283,4.67,9.89;2288,53.7,51.4;2288,58.3,60.8;2291,58.3,60.8;2293,53.7,51.4;2294,53.7,51.4;2297,53.7,51.4;2317,53.7,51.4;2348,53.7,51.4;2359,53.7,51.4;2360,53.7,51.4;2360,53.7,51.4;2363,53.7,51.4;2382,53.7,51.4;2424,112,113;2424,56,54.1;2429,58.3,56.1;2429,112,113;2430,112,113;2430,58.3,60.8;2437,58.3,60.8;2438,2.33,3.22;2455,121,128;2455,138,383;2455,103,97.8;2457,103,97.6;2460,58.3,60.8;2467,58.3,60.8;2482,58.3,60.8;2488,58.3,60.8;2491,112,112;2492,103,97.6;2493,4.67,0;2494,103,98.9;2496,0,0.111;2499,4.67,0;2504,0,0.111;2506,103,97.6;2506,103,97.6;2529,4.67,0;2536,63,51;2539,4.67,0.111;2558,4.67,0;2576,58.3,60.8;2576,103,98.8;2577,4.67,0;2580,103,98.8;2594,4.67,0.111;2607,4.67,0;2612,4.67,0;2621,4.67,0;2692,0,0.111;2733,0,0.111;2758,51.3,48.8;2759,51.3,48.8;2780,0,0.111;2781,4.67,0;2785,4.67,0;2791,9.33,0.222;2894,53.7,51.4;2937,58.3,60.8;3054,11.7,6.44;3068,0,0.556;3069,2.33,2.67;3069,0,0.556;3070,2.33,3.22;3088,58.3,60.8;3120,53.7,51.4;3136,149,154;3146,53.7,51.4;3164,53.7,51.4;3166,58.3,60.8;3171,0,1.44;3188,58.3,60.8;3190,0,1.44;3195,58.3,60.8;3240,0,0.111;3243,56,55.6;3248,103,97.6;3330,7,8.78;3343,7,7;3576,0,0.778;3596,16.3,6.33;3599,7,6.33;3603,9.33,0;3623,2.33,0.667;3625,2.33,2.11;3630,0,0.778;3669,124,112;3680,2.33,2.11;3684,4.67,4.22;3695,25.7,4.89;3696,25.7,23.2;3730,7,6.89;3732,51.3,47.7;3734,0,0.556;3735,0,1.67;3745,0,0.556;3749,0,0.556;3771,2.33,2.11;3772,7,4.22;3798,2.33,2.11;3821,2.33,2.11;3822,2.33,2.11;3823,0,0.556;3825,0,0.556;3830,0,0.556;3835,2.33,2.11;3836,4.67,3.67;3836,101,95;3836,16.3,14.8;3837,9.33,8.44;3839,4.67,2.11;3839,7,4.67;3840,2.33,2.11;3840,138,91.8;3841,2.33,2.67;3849,2.33,2.11;3869,2.33,2.11;3873,2.33,2.11;3875,2.33,2.11;3877,2.33,2.11;4185,2.33,2.11;4260,4.67,4.22;4262,4.67,4.22;4264,2.33,2.11;4273,2.33,2.11;4303,2.33,2.11;4304,2.33,2.11;4414,2.33,2.11;4415,2.33,2.67;4416,0,0.556;4417,2.33,2.11;4459,0,3.89;4462,0,3.89;4465,0,3.89;4469,0,3.89;4471,0,3.89;4474,0,3.89;4485,0,3.89;4491,0,3.89;4495,0,3.89;4516,2.33,2.67;4565,4.5,3;4620,2.33,2.11;4724,2.33,2.11;4849,2.33,2.11;4972,2.33,2.11;4977,2.33,2.11;5022,2.33,2.11;5058,2.33,2.11;5102,2.33,2.11;5103,2.33,0;5150,2.33,2.11;5152,2.33,2.11;5225,2.33,2.11;5226,2.33,2.11;5270,2.33,2.11;5271,2.33,2.11;5284,11.7,9;5292,21,19;5298,23.3,21.1;5298,2.33,2.11;5307,14,9.56;5314,2.33,2.11;5325,4.67,2.11;5329,4.67,2.11;5331,4.67,2.11;5334,4.67,2.11;5452,2.33,2.11;5860,2.33,2.11;5861,4.67,4.22;5862,4.67,4.22;5885,2.33,2.11;5912,4.67,4.22;6063,2.33,2.11;6105,2.33,2.11;6115,2.33,2.11;6202,2.33,2.11;6209,4.67,4.22;6210,4.67,4.22;6232,2.33,2.11;6335,2.33,2.11;6372,18.7,16.9;6537,2.33,2.11;6537,2.33,2.11;6555,39.7,0;6561,39.7,0;6580,2.33,2.11;6596,2.33,2.11;6701,2.33,2.11;6723,2.33,2.11;6749,2.33,2.11;6791,2.33,2.11;6807,2.33,2.11;6845,2.33,2.11;6850,2.33,2.11;6851,2.33,2.11;6892,0,0.556;6926,2.33,2.11;6933,2.33,2.11;6940,0,3.89;6943,0,3.89;6948,0,3.89;6950,0,3.89;7037,2.33,2.11;7037,2.33,2.67;7038,2.33,2.11;7068,2.33,2.11;7119,2.33,2.11;7165,2.33,2.11;7194,2.33,2.11;7233,2.33,2.11;7234,2.33,2.11;7235,2.33,2.11;7236,2.33,2.11;7255,2.33,2.11;7309,2.33,2.11;7309,2.33,2.11;7323,2.33,2.11;7366,7,6.33;7378,2.33,2.11;7418,2.33,2.11;7465,2.33,2.11;7619,2.33,2.11;7628,2.33,2.11;9005,4.67,4.22;9008,2.33,2.11;9060,2.33,2.11;9116,2.33,2.11;9138,2.33,2.11;9146,9.17,10.6;9162,2.33,2.11;9185,2.33,2.11;9202,2.33,2.11;9349,2.33,2.11;9381,2.33,2.11;9383,2.33,2.11;9384,2.33,2.11;9479,2.33,2.11;9491,2.33,2.11;9529,4.67,4.22;9548,2.33,2.11;9563,0,2;9566,124,112;9583,2.33,4.22;9586,2.33,2.11;9612,2.33,2.11;9614,2.33,2.11;9623,2.33,2.11;9633,2.33,2.11;9836,2.33,2.11;9848,2.33,2.11;9851,2.33,2.11;9875,2.33,2.11;9890,2.33,2.11;9924,2.33,2.11;9937,2.33,2.11;9962,2.33,2.11;9990,2.33,2.11;9992,2.33,2.11;9998,0,0.778';
    var F = RAW.split(';').map(function (r) { var p = r.split(','); return { x: +p[0] / 10000, i: +p[1], s: +p[2], h: 0 }; });
    /* app-level functions that rose, with their real names and offsets */
    var LABELS = [
      [0.3576, 'normalizeWheel'], [0.3630, '_onWheel  clamp(±200)'], [0.4466, 'updateForColorRender'], [0.4474, 'getInteraction'],
      [0.4485, 'integrate  exp(−dt·damping)'], [0.4491, 'updateOscillation'], [0.9563, '_onNativeScroll']
    ];
    var MODE = 'idle', LOG = Math.log(1 + 500);
    function target(f, m) {
      var r = m === 'idle' ? f.i : m === 'scroll' ? f.s : (f.s >= 3 * Math.max(f.i, 0.01) ? f.s - f.i : 0);
      return Math.log(1 + r) / LOG;
    }
    function rose(f) { return f.s > 0 && f.s >= 3 * Math.max(f.i, 0.01); }
    var counts = { idle: 0, scroll: 0, diff: 0 };
    F.forEach(function (f) { if (f.i > 0) counts.idle++; if (f.s > 0) counts.scroll++; if (rose(f)) counts.diff++; });

    var cv = ctx.el('canvas'); stage.appendChild(cv);
    var g = cv.getContext('2d');
    var bar = ctx.el('div', 'd-rers-bar'); stage.appendChild(bar);
    var btns = {};
    [['idle', 'Idle 6 s'], ['scroll', 'Scroll 12 s'], ['diff', 'Scroll − idle']].forEach(function (b) {
      var el = ctx.el('button', '', b[1]); el.type = 'button'; el.setAttribute('aria-pressed', 'false');
      el.addEventListener('click', function () { set(b[0]); });
      bar.appendChild(el); btns[b[0]] = el;
    });
    var count = ctx.el('div', 'd-rers-count'); count.setAttribute('aria-live', 'polite'); bar.appendChild(count);
    var labelA = 0, box = { w: 0, h: 0 }, ro = null, loop = ctx.loop(frame);

    function set(m) {
      MODE = m;
      Object.keys(btns).forEach(function (k) { btns[k].setAttribute('aria-pressed', k === m ? 'true' : 'false'); });
      count.textContent = m === 'idle' ? counts.idle + ' functions ran, nobody touching' :
        m === 'scroll' ? counts.scroll + ' ran while scrolling' : counts.diff + ' rose ≥ 3× — read these';
      if (ctx.reduced) { F.forEach(function (f) { f.h = target(f, m); }); labelA = m === 'diff' ? 1 : 0; draw(); }
    }
    function fit() { box = ctx.fitCanvas(cv, stage); }
    function frame(dt) {
      F.forEach(function (f) { f.h = ctx.damp(f.h, target(f, MODE), 9, dt); });
      labelA = ctx.damp(labelA, MODE === 'diff' ? 1 : 0, 7, dt);
      draw();
    }
    function draw() {
      var W = box.w, H = box.h; if (!W) return;
      var dpr = box.dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      var L = 18, R = W - 18, T = 54, B = H - 62, span = R - L;
      g.font = '500 10.5px "Geist Mono", ui-monospace, monospace'; g.textBaseline = 'alphabetic';
      g.fillStyle = 'rgba(255,255,255,.45)'; g.fillText('ORYZO.AI · hoisted.CRsATKbF.js · CALLS / S BY BUNDLE OFFSET', L, 26);
      g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(L, B, span, 1);
      g.fillStyle = 'rgba(255,255,255,.45)';
      ['0', '0.5 MB', '1.1 MB'].forEach(function (t, k) { var x = L + span * [0, .4555, 1][k]; g.fillText(t, Math.min(x, R - g.measureText(t).width), B + 16); });
      [1, 10, 100].forEach(function (v) { var y = B - (B - T) * Math.log(1 + v) / LOG; g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(L, y, span, 1); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillText(v + '/s', L, y - 3); });
      for (var n = 0; n < F.length; n++) {
        var f = F[n]; if (f.h < .002) continue;
        var x = L + f.x * span, hh = (B - T) * f.h, hot = rose(f);
        g.fillStyle = MODE === 'diff' && hot ? '#f97316' : 'rgba(255,255,255,' + (MODE === 'diff' ? .15 : .7) + ')';
        g.fillRect(x - .75, B - hh, 1.5, hh);
      }
      if (labelA > .01) {
        g.globalAlpha = labelA; g.font = '400 10.5px "Geist Mono", ui-monospace, monospace';
        LABELS.forEach(function (l, k) {   // one row each, sorted by offset, leader down to the bar it names
          var x = L + l[0] * span, y = T - 8 + k * 14, w = g.measureText(l[1]).width;
          var tx = x + 8 + w > R ? x - 8 - w : x + 8, top = B - 4;
          for (var n = 0; n < F.length; n++) if (Math.abs(F[n].x - l[0]) < .0006 && rose(F[n])) top = Math.min(top, B - (B - T) * F[n].h);
          g.strokeStyle = 'rgba(249,115,22,.55)'; g.beginPath(); g.moveTo(x + .5, y + 4); g.lineTo(x + .5, top); g.stroke();
          g.beginPath(); g.moveTo(x, y - 3.5); g.lineTo(tx > x ? tx - 3 : tx + w + 3, y - 3.5); g.stroke();
          g.fillStyle = '#fff'; g.fillText(l[1], tx, y);
        });
        g.globalAlpha = 1;
      }
    }
    return {
      start: function () {
        fit(); set(MODE);
        if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(function () { fit(); draw(); }); ro.observe(stage); }
        if (ctx.reduced) draw(); else loop.start();
      },
      stop: function () { loop.stop(); if (ro) { ro.disconnect(); ro = null; } },
      replay: function () { F.forEach(function (f) { f.h = 0; }); labelA = 0; set('idle'); if (ctx.reduced) draw(); }
    };
  }
});
