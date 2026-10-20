/* #film — 02 · The story. A 500vh section with a sticky stage scrubbed by m.pin.
   scroll-driven-chapters (scene table, rail, picker, telemetry, beats), clip-path-camera-wipes (slit / slide),
   inertial-scroll-ranges (per-chapter ratio → per-line transforms), autoplay-scroll-film (steerable autoscroll),
   scroll-scrubbed-webgl-sections (drives the shell's bokeh field per chapter), scroll-velocity-section-metrics (m.vel). */
(function () {
  /* single source of truth: one row per chapter */
  var CH = [
    { name: 'Dusk', clock: 41, f: 5.6, iso: 200, t: 1 / 250, focus: 12,
      beat: ['The light leaves first.', 'The LF‑1 stays out.'],
      sky: ['#221d3a', '#6b3d5e', '#c9646a', '#f2a55e'], sun: ['30%', '70%', '22rem', 'rgb(255 170 90 / .95)'], far: '#3b2a3d', near: '#191317', word: 'rgb(255 214 170 / .14)', stars: 30,
      bg: { aperture: .35, warmth: .8, focus: .55 } },
    { name: 'Blue hour', clock: 84, f: 2.8, iso: 800, t: 1 / 60, focus: 8,
      beat: ['Twenty minutes of blue,', 'metered to a third of a stop.'],
      sky: ['#081230', '#1b2f66', '#3c5d9e', '#7e9fd0'], sun: null, far: '#1a2546', near: '#0a0f1f', word: 'rgb(190 210 255 / .12)', stars: 110,
      bg: { aperture: .5, warmth: .35, focus: .4 } },
    { name: 'Night', clock: 238, f: 1.4, iso: 12800, t: 1 / 30, focus: 3.2,
      beat: ['ISO 12 800, hand-held,', 'and the grain stays fine.'],
      sky: ['rgb(3 5 11 / .82)', '#070c1b', '#0d1530', '#17203d'], sun: ['76%', '24%', '7rem', 'rgb(235 238 255 / .95)'], far: '#121a30', near: '#05070d', word: 'rgb(236 232 223 / .07)', stars: 260,
      bg: { aperture: .7, warmth: .08, focus: .2 } },
    { name: 'Starlight', clock: 376, f: 1.4, iso: 6400, t: 15, focus: 1000,
      beat: ['Fifteen seconds at f/1.4.', 'Stars as points, not streaks.'],
      sky: ['rgb(1 2 6 / .7)', 'rgb(4 7 18 / .92)', '#0a1128', '#121a36'], sun: null, far: '#0c1222', near: '#030409', word: 'rgb(236 232 223 / .06)', stars: 900,
      bg: { aperture: .22, warmth: 0, focus: 1 } },
    { name: 'First light', clock: 552, f: 4, iso: 400, t: 1 / 125, focus: 20,
      beat: ['Forty hours on one battery.', 'Home before breakfast.'],
      sky: ['#1d2748', '#5a5476', '#d08a74', '#f7d49a'], sun: ['68%', '76%', '16rem', 'rgb(255 214 150 / .95)'], far: '#4a3a44', near: '#1d1719', word: 'rgb(255 236 200 / .16)', stars: 18,
      bg: { aperture: .45, warmth: .95, focus: .6 } }
  ];
  var N = CH.length, SEC_PER_CH = 7;
  var SHUT = [8000, 6400, 5000, 4000, 3200, 2500, 2000, 1600, 1250, 1000, 800, 640, 500, 400, 320, 250, 200, 160, 125, 100, 80, 60, 50, 40, 30, 25, 20, 15, 13, 10, 8, 6, 5, 4, 3];
  var ISOS = []; [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(function (n) { [100, 125, 160].forEach(function (b) { ISOS.push(b * Math.pow(2, n)); }); });

  var css = [
    '#film { height: 500vh; }',
    '#film .f-stage { position: sticky; top: 0; height: 100vh; height: 100svh; overflow: clip; isolation: isolate; color: var(--paper); }',
    '#film .sc { position: absolute; inset: 0; overflow: hidden; visibility: hidden; }',
    '#film .sc-in { position: absolute; inset: 0; transform-origin: 50% 60%; will-change: transform; }',
    '#film .sc-stars { position: absolute; inset: 0; width: 100%; height: 100%; transform-origin: 60% 120%; }',
    '#film .sc-sun { position: absolute; border-radius: 50%; transform: translate(-50%, -50%); }',
    '#film .sc-word { position: absolute; left: 0; right: 0; bottom: 21%; margin: 0; text-align: center; white-space: nowrap; font-weight: 800; line-height: .8; letter-spacing: -.03em; pointer-events: none; }',
    '#film .sc-land { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 40%; }',
    '#film .f-veil { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to bottom, rgb(0 0 0 / .45), transparent 26%, transparent 55%, rgb(0 0 0 / .7)); }',
    '#film .f-head { position: absolute; left: var(--gap-x); top: calc(var(--nav-h) + 2.4rem); max-width: 52rem; z-index: 3; }',
    '#film .f-head .kicker { margin-bottom: 1.6rem; }',
    '#film .f-head h2 { margin: 0 0 1.2rem; font-size: min(5.6rem, 9vw); text-shadow: 0 2px 24px rgb(0 0 0 / .55); }',
    '#film .f-head .serif { font-family: var(--f-serif); font-style: italic; font-weight: 400; font-stretch: 100%; letter-spacing: 0; }',
    '#film .f-skip { color: var(--p45); }',
    '#film .f-tele { position: absolute; right: var(--gap-x); top: calc(var(--nav-h) + 2.4rem); z-index: 3; margin: 0; display: grid; grid-template-columns: auto auto; gap: .3rem 2rem; padding-right: 1.6rem; border-right: 1px solid var(--p15); text-align: right; text-shadow: 0 1px 14px rgb(0 0 0 / .8); }',
    '#film .f-tele dt { color: var(--p45); } #film .f-tele dd { margin: 0; text-transform: none; min-width: 9ch; font-family: var(--f-mono); font-size: 1.2rem; letter-spacing: .04em; color: var(--p90); font-variant-numeric: tabular-nums; }',
    '#film .f-tele .clk { color: var(--signal); }',
    '#film .f-beats { position: absolute; left: var(--gap-x); right: var(--gap-x); bottom: calc(9rem + 4vh); z-index: 3; height: 0; transform-origin: 0 100%; }',
    '#film .beat { position: absolute; left: 0; bottom: 0; margin: 0; max-width: min(120rem, 100%); visibility: hidden; }',
    '#film .beat > * { display: block; will-change: transform, opacity; }',
    '#film .beat .label { color: var(--p90); margin-bottom: 1.6rem; text-shadow: 0 1px 14px rgb(0 0 0 / .8); }',
    '#film .beat .b-l { font-size: min(5.6rem, 8.4vw, 7.4svh); line-height: 1; text-wrap: balance; text-shadow: 0 2px 24px rgb(0 0 0 / .55); }',
    '#film .beat .b-l + .b-l { color: var(--p70); }',
    '#film .f-bar { position: absolute; left: var(--gap-x); right: var(--gap-x); bottom: 2.8rem; z-index: 5; display: flex; align-items: center; gap: 2rem; }',
    '#film .f-chap { position: relative; }',
    '#film .f-cbtn { display: inline-flex; align-items: center; gap: 1rem; min-height: 4.4rem; padding: 0 1.6rem; border-radius: 999px; border: 1px solid var(--p15); background: rgb(13 13 12 / .45); color: var(--p90); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); transition: border-color .2s; }',
    '#film .f-cbtn:hover { border-color: var(--p45); }',
    '#film .f-cbtn .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--signal); }',
    '#film .f-num { position: relative; display: inline-block; height: 1.4em; overflow: hidden; vertical-align: bottom; font-family: var(--f-mono); color: var(--paper); }',
    '#film .f-num span { display: block; }',
    '#film .f-num span + span { position: absolute; left: 0; top: 0; }',
    '#film .f-cbtn .chev { display: inline-block; transition: transform .3s var(--ease-out); }',
    '#film .f-cbtn[aria-expanded="true"] .chev { transform: rotate(180deg); }',
    '#film .f-pick { position: absolute; left: 0; bottom: calc(100% + 1rem); min-width: 24rem; margin: 0; padding: .6rem; list-style: none; border-radius: 1.6rem; border: 1px solid var(--p15); background: rgb(13 13 12 / .72); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);',
    '  transform-origin: 0 100%; opacity: 0; visibility: hidden; transform: scale(.96) translateY(.4rem); transition: opacity .15s var(--ease-out), transform .15s var(--ease-out), visibility 0s .15s; }',
    '#film .f-pick.is-open { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }',
    '#film .f-pick button { display: flex; width: 100%; align-items: baseline; gap: 1.4rem; min-height: 4.4rem; padding: 0 1.2rem; border-radius: 1rem; color: var(--p70); text-align: left; transition: background-color .15s, color .15s; }',
    '#film .f-pick button:hover, #film .f-pick button:focus-visible { background: var(--p08); color: var(--paper); }',
    '#film .f-pick .n { font-family: var(--f-mono); font-size: 1.2rem; color: var(--p45); } #film .f-pick [aria-current] .n { color: var(--signal); }',
    '#film .f-pick .tm { margin-left: auto; font-family: var(--f-mono); font-size: 1.1rem; color: var(--p45); }',
    '#film .f-rail { position: relative; flex: 1; height: 1px; background: var(--p15); }',
    '#film .f-rail .fill { position: absolute; inset: 0; background: var(--paper); transform-origin: 0 50%; transform: scaleX(0); }',
    '#film .f-rail .tk { position: absolute; top: -4px; width: 1px; height: 9px; background: var(--p45); }',
    '#film .f-play { flex: none; min-width: 13rem; }',
    '#film .f-play .ic { display: inline-block; width: 0; height: 0; border-left: 8px solid currentColor; border-top: 5px solid transparent; border-bottom: 5px solid transparent; }',
    '#film .f-play[aria-pressed="true"] .ic { width: 9px; height: 10px; border: 0; border-left: 3px solid currentColor; border-right: 3px solid currentColor; }',
    '#film .f-help { position: absolute; right: 0; bottom: calc(100% + 1.4rem); margin: 0; color: var(--p45); opacity: 0; transform: translateY(.4rem); transition: opacity .3s var(--ease-out), transform .3s var(--ease-out); pointer-events: none; text-align: right; }',
    '#film .f-help.is-on { opacity: 1; transform: none; }',
    '@media (max-width: 767px) {',
    '  #film .f-tele { top: auto; bottom: 9.6rem; right: var(--gap-x); grid-template-columns: auto; gap: 0; padding-right: 1rem; } #film .f-tele dt { display: none; } #film .f-tele .m-hide { display: none; }',
    '  #film .f-beats { bottom: 22rem; }',
    '  #film .f-bar { gap: 1.2rem; } #film .f-play { min-width: 0; } #film .f-play .tx { display: none; } #film .f-play { width: 4.4rem; padding: 0; }',
    '  #film .f-cbtn .nm { display: none; }',
    '  #film .f-help { display: none; }',
    '}'
  ].join('\n');

  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  Site.section('film', {
    css: css,
    mount: function (root, ctx) {
      var R0 = ctx.reduced, clamp = ctx.clamp;
      var fit = function (x, a, b) { return clamp((x - a) / (b - a), 0, 1); };
      var eio = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
      var clock = function (m) { var h = (20 + Math.floor(m / 60)) % 24; return pad(h) + ':' + pad(Math.floor(m % 60)); };

      var scenes = CH.map(function (c, i) {
        var g = 'linear-gradient(to bottom,' + c.sky[0] + ' 0%,' + c.sky[1] + ' 30%,' + c.sky[2] + ' 58%,' + c.sky[3] + ' 72%)';
        var sun = c.sun ? '<div class="sc-sun" style="left:' + c.sun[0] + ';top:' + c.sun[1] + ';width:' + c.sun[2] + ';height:' + c.sun[2] + ';background:radial-gradient(circle,' + c.sun[3] + ' 0 34%, transparent 70%);box-shadow:0 0 12rem 4rem ' + c.sun[3].replace(/\/ \.9\d?\)/, '/ .18)') + '"></div>' : '';
        var fs = Math.min(26, 150 / c.name.length).toFixed(1);
        return '<div class="sc" data-i="' + i + '" aria-hidden="true"><div class="sc-in" style="background:' + g + '">' +
          '<canvas class="sc-stars"></canvas>' + sun +
          '<p class="sc-word display" style="font-size:' + fs + 'vw;color:' + c.word + '">' + c.name + '</p>' +
          '<svg class="sc-land" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice">' +
          '<path fill="' + c.far + '" d="M0 210C200 170 380 192 560 160S900 118 1100 168 1350 150 1440 176V360H0Z"/>' +
          '<path fill="' + c.near + '" d="M0 300C240 252 520 290 760 262S1100 230 1240 252 1400 272 1440 262V360H0Z"/>' +
          '<g fill="' + c.near + '" stroke="' + c.near + '"><path d="M884 230L864 266M884 230L904 266M884 230L885 268" stroke-width="2.4" fill="none"/>' +
          '<rect x="864" y="204" width="40" height="24" rx="4"/><rect x="872" y="199" width="10" height="6" rx="1.5"/></g>' +
          '<circle cx="897" cy="200" r="2" fill="#ff4d1f"' + (i >= 2 && i <= 3 ? ' style="filter:drop-shadow(0 0 4px #ff4d1f)"' : '') + '/></svg>' +
          '</div></div>';
      }).join('');

      root.innerHTML =
        '<div class="f-stage">' + scenes +
        '<div class="f-veil" aria-hidden="true"></div>' +
        '<header class="f-head"><p class="kicker"><span>02</span>The story</p>' +
        '<h2 class="display">One night, <span class="serif">five</span> exposures.</h2>' +
        '<a class="f-skip label ulink" href="#anatomy">Skip the film ↓</a></header>' +
        '<dl class="f-tele label" aria-label="Camera telemetry"><dt>Focal</dt><dd class="m-hide">35 mm</dd><dt>Aperture</dt><dd class="tf"></dd><dt>ISO</dt><dd class="ti"></dd>' +
        '<dt>Shutter</dt><dd class="ts"></dd><dt>Focus</dt><dd class="td m-hide"></dd><dt>Time</dt><dd class="tc clk"></dd></dl>' +
        '<div class="f-beats">' + CH.map(function (c, i) {
          return '<article class="beat" data-i="' + i + '"><span class="label">' + pad(i + 1) + ' — ' + c.name + ' · ' + clock(c.clock) + '</span>' +
            '<span class="b-l display">' + c.beat[0] + '</span><span class="b-l display">' + c.beat[1] + '</span></article>';
        }).join('') + '</div>' +
        '<div class="f-bar">' +
        '  <div class="f-chap"><button type="button" class="f-cbtn label" aria-expanded="false" aria-controls="f-pick"><i class="dot"></i><span class="f-num"><span>01</span></span><span>/ ' + pad(N) + '</span><span class="nm">Dusk</span><span class="chev" aria-hidden="true">▴</span></button>' +
        '  <ul class="f-pick" id="f-pick" aria-label="Chapters">' + CH.map(function (c, i) {
          return '<li><button type="button" data-i="' + i + '"><span class="n">' + pad(i + 1) + '</span><span>' + c.name + '</span><span class="tm">' + clock(c.clock) + '</span></button></li>';
        }).join('') + '</ul></div>' +
        '  <div class="f-rail" aria-hidden="true"><i class="fill"></i>' + CH.map(function (c, i) { return i ? '<i class="tk" style="left:' + (i / N * 100) + '%"></i>' : ''; }).join('') + '</div>' +
        '  <p class="f-help label">Scroll or ↑ ↓ to steer · hold to slow · Esc stops</p>' +
        '  <button type="button" class="btn ghost small f-play" aria-pressed="false" aria-label="Play the film"><i class="ic" aria-hidden="true"></i><span class="tx">Play film</span></button>' +
        '</div>' +
        '<p class="sr-only f-live" aria-live="polite"></p>' +
        '</div>';

      var $ = function (s) { return root.querySelector(s); };
      var stage = $('.f-stage'), scs = [].slice.call(root.querySelectorAll('.sc')), beats = [].slice.call(root.querySelectorAll('.beat'));
      var beatsBox = $('.f-beats'), fill = $('.f-rail .fill'), cbtn = $('.f-cbtn'), pick = $('.f-pick'), num = $('.f-num'), nm = $('.f-cbtn .nm');
      var playBtn = $('.f-play'), help = $('.f-help'), live = $('.f-live');
      var tF = $('.tf'), tI = $('.ti'), tS = $('.ts'), tD = $('.td'), tC = $('.tc');
      var parts = scs.map(function (s) { return { el: s, inn: s.firstChild, stars: s.querySelector('.sc-stars'), word: s.querySelector('.sc-word'), land: s.querySelector('.sc-land') }; });
      var lines = beats.map(function (b) { return [].slice.call(b.children); });
      var mobile = matchMedia('(max-width: 767px)');

      /* ---------- star canvases (drawn once per resize; Canvas 2D, works on tier 0) ---------- */
      function drawStars() {
        var dpr = Math.min(ctx.tier.dpr || 1, 1.5);
        parts.forEach(function (p, i) {
          var d = ctx.fitCanvas(p.stars, stage, dpr), g = p.stars.getContext('2d'), r = rnd(97 + i * 31), c = CH[i];
          g.setTransform(d.dpr, 0, 0, d.dpr, 0, 0); g.clearRect(0, 0, d.w, d.h);
          var n = Math.round(c.stars * Math.min(1.4, d.w * d.h / 1.3e6));
          if (i === 3) {                    // starlight: a milky-way band
            g.save(); g.translate(d.w * .5, d.h * .35); g.rotate(-.42);
            var band = g.createLinearGradient(0, -d.h * .16, 0, d.h * .16);
            band.addColorStop(0, 'rgba(160,180,255,0)'); band.addColorStop(.5, 'rgba(190,200,255,.13)'); band.addColorStop(1, 'rgba(160,180,255,0)');
            g.fillStyle = band; g.fillRect(-d.w, -d.h * .16, d.w * 2, d.h * .32);
            for (var k = 0; k < n * .8; k++) { var bx = (r() - .5) * d.w * 1.6, by = (r() + r() + r() - 1.5) * d.h * .09; g.fillStyle = 'rgba(230,235,255,' + (.15 + r() * .5) + ')'; g.fillRect(bx, by, .8, .8); }
            g.restore();
          }
          for (var j = 0; j < n; j++) {
            var x = r() * d.w, y = Math.pow(r(), 1.5) * d.h * .66, s = r(), a = (.25 + s * .75) * (1 - y / (d.h * .7));
            g.fillStyle = 'rgba(240,240,255,' + a.toFixed(2) + ')';
            g.beginPath(); g.arc(x, y, .4 + s * s * 1.3, 0, 6.3); g.fill();
          }
        });
      }

      /* ---------- per-frame render from the timeline u ∈ [0, N] ---------- */
      var u = 0, vel = 0, cur = -1, dirty = true;
      function lerpLog(a, b, t) { return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t); }
      function nearest(list, v) { var b = list[0]; list.forEach(function (x) { if (Math.abs(Math.log(x / v)) < Math.abs(Math.log(b / v))) b = x; }); return b; }
      function render() {
        // clip-path-camera-wipes: transition k lives in u ∈ [k-.3, k+.3]
        var w = [1]; for (var k = 1; k < N; k++) w[k] = eio(fit(u, k - .3, k + .3));
        for (var i = 0; i < N; i++) {
          var p = parts[i], inT = w[i], outT = i < N - 1 ? w[i + 1] : 0, vis = inT > 0 && outT < 1;
          p.el.style.visibility = vis ? 'visible' : 'hidden';
          if (!vis) continue;
          var tf = '', slit = i % 2 === 1;
          if (R0) { p.el.style.opacity = inT.toFixed(3); p.el.style.clipPath = 'none'; }
          else {
            if (inT < 1) {
              p.el.style.clipPath = slit ? 'polygon(0% ' + (50 - 50 * inT).toFixed(2) + '%,100% ' + (50 - 50 * inT).toFixed(2) + '%,100% ' + (50 + 50 * inT).toFixed(2) + '%,0% ' + (50 + 50 * inT).toFixed(2) + '%)'
                : 'inset(0 0 0 ' + (100 - 100 * inT).toFixed(2) + '%)';
              tf = (slit ? '' : 'translate3d(' + (25 * (1 - inT)).toFixed(2) + '%,0,0) ') + 'scale(' + (1.2 - .2 * inT).toFixed(4) + ')';
            } else {
              p.el.style.clipPath = 'none';
              if (outT > 0) {                  // outgoing layer dollies / counter-slides behind the wipe
                var nslit = (i + 1) % 2 === 1;
                tf = (nslit ? '' : 'translate3d(' + (-15 * outT).toFixed(2) + '%,0,0) ') + 'scale(' + (1 + .15 * outT).toFixed(4) + ')';
              }
            }
            p.inn.style.transform = tf || 'none';
            // in-scene parallax from the chapter ratio
            var rr = clamp(u - i - .5, -1, 1);
            p.word.style.transform = 'translate3d(' + (-rr * 6).toFixed(2) + 'vw,0,0)';
            p.stars.style.transform = 'rotate(' + (rr * 2.5).toFixed(3) + 'deg)';
            p.land.style.transform = 'translate3d(0,' + (rr * -1.2).toFixed(2) + '%,0)';
          }
        }
        // inertial-scroll-ranges: per-chapter ratio −1..0..1 → per-line transforms
        var desk = !mobile.matches;
        for (var j = 0; j < N; j++) {
          var loc = u - j, r = 0;
          var enter = j === 0 ? 0 : 1 - fit(loc, .05, .4), exit = j === N - 1 ? 0 : fit(loc, .6, .95);
          if (loc < 0 || loc > 1) r = loc < 0 ? -1 : 1; else r = exit > 0 ? exit : -enter;
          if (j === 0 && loc < 0) r = 0; if (j === N - 1 && loc > 1) r = 0;
          var b = beats[j], on = Math.abs(r) < 1;
          b.style.visibility = on ? 'visible' : 'hidden';
          if (!on) continue;
          var L = lines[j], n = L.length, a = Math.abs(r);
          for (var q = 0; q < n; q++) {
            var e = q / (n - 1), s0 = (r > 0 ? e : 1 - e) * .2, kk = R0 ? (a > .5 ? 1 : 0) : fit(a, s0, s0 + .8);
            kk = 1 - Math.pow(1 - kk, 3);
            var el = L[q];
            el.style.opacity = (1 - kk).toFixed(3);
            el.style.transform = R0 ? 'none' : 'translate3d(0,' + ((r > 0 ? -1 : 1) * kk * 1.2).toFixed(3) + 'em,0)';
            el.style.filter = !R0 && desk && kk > .01 ? 'blur(' + (kk * .25).toFixed(3) + 'em)' : 'none';
          }
        }
        // scroll-velocity: subtle skew/blur of the chapter text
        if (!R0) beatsBox.style.transform = 'skewY(' + (vel * -3).toFixed(3) + 'deg)';
        if (!R0) beatsBox.style.filter = Math.abs(vel) > .05 && desk ? 'blur(' + (Math.abs(vel) * 3).toFixed(2) + 'px)' : 'none';

        // rail + chapter counter
        fill.style.transform = 'scaleX(' + (u / N).toFixed(4) + ')';
        var c = clamp(Math.floor(u + .0001), 0, N - 1);
        if (c !== cur) setChapter(c);

        // telemetry: interpolate between chapter centres
        var x = clamp(u - .5, 0, N - 1), i0 = Math.floor(x), i1 = Math.min(N - 1, i0 + 1), t = x - i0, A = CH[i0], B = CH[i1];
        var fN = lerpLog(A.f, B.f, t), iso = nearest(ISOS, lerpLog(A.iso, B.iso, t)), sh = lerpLog(A.t, B.t, t), fd = lerpLog(A.focus, B.focus, t);
        tF.textContent = 'f/' + (fN < 10 ? fN.toFixed(1) : Math.round(fN));
        tI.textContent = iso >= 1000 ? iso.toLocaleString('en-US').replace(/,/g, ' ') : String(iso);
        tS.textContent = sh >= .5 ? Math.round(sh) + ' s' : '1/' + nearest(SHUT, 1 / sh) + ' s';
        tD.textContent = fd > 80 ? '∞' : fd.toFixed(1) + ' m';
        tC.textContent = clock(ctx.lerp(A.clock, B.clock, t));
        return { A: A, B: B, t: t };
      }
      function setChapter(c) {
        var prev = cur; cur = c;
        cbtn.setAttribute('aria-label', 'Chapter ' + (c + 1) + ' of ' + N + ': ' + CH[c].name + '. Choose a chapter');
        nm.textContent = CH[c].name;
        [].forEach.call(pick.querySelectorAll('button'), function (b, i) { if (i === c) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
        // slot-roll counter (masked-text-reveal §3)
        var old = num.firstElementChild, nu = document.createElement('span'); nu.textContent = pad(c + 1);
        while (num.children.length > 1) num.removeChild(num.lastElementChild);
        if (prev < 0 || R0) { num.replaceChild(nu, old); return; }
        num.appendChild(nu);
        var d = c > prev ? 1 : -1, o = { duration: 500, easing: 'cubic-bezier(.23,1,.32,1)' };
        nu.animate([{ transform: 'translateY(' + (100 * d) + '%)' }, { transform: 'none' }], o);
        old.animate([{ transform: 'none' }, { transform: 'translateY(' + (-100 * d) + '%)' }], o).onfinish = function () { if (old.parentNode) old.remove(); };
      }

      /* ---------- geometry + navigation ---------- */
      function geo() { var top = root.getBoundingClientRect().top + window.scrollY; return { top: top, range: Math.max(1, root.offsetHeight - innerHeight) }; }
      function yFor(i) { var g = geo(); return g.top + (i + .5) / N * g.range; }
      function goChapter(i) { stopPlay(); window.scrollTo({ top: yFor(i), behavior: R0 ? 'auto' : 'smooth' }); }

      // picker (scroll-driven-chapters)
      function setPick(open) { pick.classList.toggle('is-open', open); cbtn.setAttribute('aria-expanded', String(open)); if (open) (pick.querySelector('[aria-current]') || pick.querySelector('button')).focus({ preventScroll: true }); }
      cbtn.addEventListener('click', function () { setPick(!pick.classList.contains('is-open')); });
      pick.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; setPick(false); cbtn.focus({ preventScroll: true }); goChapter(+b.dataset.i); });
      pick.addEventListener('keydown', function (e) {
        var bs = [].slice.call(pick.querySelectorAll('button')), k = bs.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); bs[(k + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus(); }
        if (e.key === 'Escape') { e.stopPropagation(); setPick(false); cbtn.focus({ preventScroll: true }); }
      });
      function outside(e) { if (pick.classList.contains('is-open') && !e.target.closest('.f-chap')) setPick(false); }

      /* ---------- autoplay-scroll-film: steerable autoscroll ---------- */
      var play = { on: false, dir: 1, mult: 1, multT: 1, pos: 0, written: -1, holdT: 0, downAt: null, stepT: 0 };
      function status(t) { live.textContent = t; }
      function startPlay() {
        if (play.on) return;
        var g = geo(), y = window.scrollY;
        play.on = true; play.dir = 1; play.mult = play.multT = 1; play.stepT = performance.now();
        play.pos = y >= g.top + g.range - 2 ? g.top : y;              // at the end: start over
        play.written = -1;
        playBtn.setAttribute('aria-pressed', 'true'); playBtn.setAttribute('aria-label', 'Pause the film'); playBtn.querySelector('.tx').textContent = 'Pause';
        help.classList.add('is-on'); status('Film playing. Scroll or arrow keys steer, hold to slow down, Escape stops.');
        addEventListener('wheel', onWheel, { passive: true }); addEventListener('keydown', onKey, true);
        addEventListener('pointerdown', onDown, true); addEventListener('pointerup', onUp, true); addEventListener('pointercancel', onCancel, true); addEventListener('pointermove', onPMove, true);
        if (R0) stepChapter();
        auto.start();
      }
      function stopPlay() {
        if (!play.on) return;
        play.on = false; auto.stop();
        playBtn.setAttribute('aria-pressed', 'false'); playBtn.setAttribute('aria-label', 'Play the film'); playBtn.querySelector('.tx').textContent = 'Play film';
        help.classList.remove('is-on'); status('Film paused.');
        removeEventListener('wheel', onWheel, { passive: true }); removeEventListener('keydown', onKey, true);
        removeEventListener('pointerdown', onDown, true); removeEventListener('pointerup', onUp, true); removeEventListener('pointercancel', onCancel, true); removeEventListener('pointermove', onPMove, true);
      }
      function stepChapter() {                  // reduced motion: jump chapter by chapter
        var g = geo(), y = window.scrollY, c = y < g.top ? -1 : clamp(Math.floor((y - g.top) / g.range * N), 0, N - 1);
        if (c >= N - 1) { stopPlay(); return; }
        window.scrollTo({ top: yFor(c + 1), behavior: 'auto' });
      }
      function onWheel(e) { if (e.ctrlKey) return; if (Math.abs(e.deltaY) > 1) play.dir = e.deltaY > 0 ? 1 : -1; play.written = -1; }
      function onKey(e) {
        var k = e.key;
        if (k === 'Escape') { stopPlay(); return; }
        if (k === 'Shift' || k === 'Meta' || k === 'Control' || k === 'Alt' || e.metaKey || e.ctrlKey) return;
        if (e.target.closest && e.target.closest('button, a, input') && (k === 'Enter' || k === ' ' || k === 'Tab')) return;
        if (k === 'ArrowDown' || k === 'PageDown' || k === ' ') { e.preventDefault(); play.dir = 1; return; }
        if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); play.dir = -1; return; }
        stopPlay();
      }
      function onDown(e) {
        if (e.target.closest('.f-play')) return;
        if (!stage.contains(e.target) || e.target.closest('.f-bar, .f-head a')) { stopPlay(); return; }
        play.downAt = { x: e.clientX, y: e.clientY, t: performance.now() };   // press-and-hold on the stage: slow to 0.2×
      }
      function onPMove(e) { if (play.downAt && Math.hypot(e.clientX - play.downAt.x, e.clientY - play.downAt.y) > 12) { play.downAt = null; play.multT = 1; if (e.pointerType !== 'mouse') stopPlay(); } }
      function onUp() { play.downAt = null; play.multT = 1; }
      function onCancel(e) { play.downAt = null; play.multT = 1; if (e.pointerType !== 'mouse') stopPlay(); }

      var auto = ctx.loop(function (dt) {
        if (!play.on) return;
        var g = geo(), end = g.top + g.range, y = window.scrollY;
        if (R0) { var now = performance.now(); if (now - play.stepT > 3500) { play.stepT = now; stepChapter(); } return; }   // wall clock
        if (play.written >= 0 && Math.abs(y - play.written) > 3) play.pos = y;     // the user moved it: follow
        if (play.downAt && performance.now() - play.downAt.t > 50) play.multT = .2;
        play.mult = ctx.damp(play.mult, play.multT, 12, dt);
        if (play.pos < g.top - 1 && play.dir > 0) play.pos = ctx.damp(play.pos, g.top, 3.5, dt) + 1;   // approach from above
        else {
          play.pos += play.dir * play.mult * (g.range / (N * SEC_PER_CH)) * dt;
          if (play.dir > 0 && play.pos >= end) { play.pos = end; write(); stopPlay(); status('End of the film.'); return; }
          if (play.dir < 0 && play.pos <= g.top) { play.pos = g.top; write(); stopPlay(); return; }
        }
        write();
      });
      function write() { var t = Math.round(play.pos); play.written = t; window.scrollTo({ top: t, behavior: 'instant' }); }
      playBtn.addEventListener('click', function () { play.on ? stopPlay() : startPlay(); });

      /* ---------- ⌘K ---------- */
      ctx.palette.add({ id: 'film-play', title: 'Play the film', group: 'Actions', keywords: 'autoplay story night chapters watch', run: function () { startPlay(); } });
      CH.forEach(function (c, i) { ctx.palette.add({ id: 'film-ch-' + i, title: 'Go to chapter: ' + c.name, group: 'Go to', keywords: 'film story chapter ' + (i + 1), run: function () { goChapter(i); } }); });

      var fc = 0, G0 = null;
      var ro = new ResizeObserver(function () { drawStars(); dirty = true; G0 = null; });
      drawStars(); render();

      return {
        start: function () { ro.observe(stage); document.addEventListener('pointerdown', outside); },
        stop: function () { ro.disconnect(); document.removeEventListener('pointerdown', outside); setPick(false); if (play.on && !(play.pos < geo().top)) stopPlay(); },
        scroll: function (m) {
          // local pin: the shell's cached rect can be stale (measured while <main> was scaled by the loader)
          if (!(fc++ % 20) || !G0) G0 = geo();
          var nu = clamp((window.scrollY - G0.top) / G0.range, 0, 1) * N, nv = m.vel;
          if (Math.abs(nu - u) > 1e-5 || Math.abs(nv - vel) > 1e-3 || dirty) { u = nu; vel = nv; dirty = false; var s = render(); drive(s, m); }
          else drive(null, m);
        }
      };
      // scroll-scrubbed-webgl-sections: the shell's bokeh field follows the film (night blue → dawn warmth)
      function drive(s, m) {
        if (!s) { var x = clamp(u - .5, 0, N - 1), i0 = Math.floor(x); s = { A: CH[i0], B: CH[Math.min(N - 1, i0 + 1)], t: x - i0 }; }
        var A = s.A.bg, B = s.B.bg, t = s.t, L = ctx.lerp;
        ctx.bg.set({ aperture: L(A.aperture, B.aperture, t), warmth: L(A.warmth, B.warmth, t), focus: L(A.focus, B.focus, t), energy: clamp(.12 + Math.abs(m.vel) * .88, 0, 1) });
      }
    }
  });
})();
