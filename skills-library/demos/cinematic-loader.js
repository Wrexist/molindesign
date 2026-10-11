/* cinematic-loader — silhouette fill, spring digits, honest-but-theatrical progress, fly-through exit */
(function () {
  var ID = 'cinematic-loader';
  var Y0 = 36, Y1 = 204;                       // glyph box of the wordmark in viewBox units
  var ASSETS = ['shell.glb', 'studio.hdr', 'albedo.ktx2', 'engine.mp3', 'shaders', 'fonts', 'draco.wasm'];

  Lib.register(ID, {
    hint: 'Watch the wordmark fill, then fly through the “I”. Replay ↺ reruns it; the scene button replays the fast return visit.',
    notes: [
      'Shown progress = <code>min(fake, ready ? 1 : 0.9·real)</code>: fake ticks +.03–.15 (+.01–.04 after 85 %) with rare 700 ms stalls, so it can never outrun real loading',
      'Fill is a clip rect: <code>y = H·(1−p)</code>; a bloom band rides the edge and fades in over the first ~4 %',
      'Digit columns spring to <code>−value em</code>: stiffness 260, damping 30, mass .6; leading zeros at white/25',
      'Exit: viewBox zooms exponentially into a point inside the logo, −0.08 pull-back (.45 s) then 2.1 s ease-in; 120 warp streaks; the scene settles 0.86→1 from blur(8px) brightness(.45)',
      'Return visit (sessionStorage flag): counter 2.5× faster, shorter zoom. Reduced motion: no fly-through, .8 s fade'
    ],
    simplified: 'Assets are simulated timers and the silhouette is a live-text wordmark instead of a traced path; no exit SFX.',
    css: [
      '.d-cinematic-loader { user-select: none; }',
      '.d-cinematic-loader .cl-scene { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(38% 46% at 50% 60%, rgb(255 214 170 / .95), rgb(249 115 22 / .85) 22%, rgb(249 115 22 / .25) 55%, transparent 80%), linear-gradient(to bottom, #050302 0%, #2a1206 52%, #120703 62%, #030303 100%); transform-origin: 50% 50%; }',
      '.d-cinematic-loader .cl-sun { position: absolute; left: 50%; top: 60%; width: 22cqw; height: 22cqw; transform: translate(-50%, -50%); border-radius: 50%; background: radial-gradient(circle, #fff7ed 0 30%, rgb(253 186 116 / .9) 50%, transparent 70%); clip-path: inset(0 0 50% 0); }',
      '.d-cinematic-loader .cl-floor { position: absolute; left: -50%; right: -50%; bottom: -10%; height: 60%; transform: perspective(300px) rotateX(62deg); transform-origin: 50% 0; background-image: linear-gradient(rgb(255 255 255 / .09) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / .09) 1px, transparent 1px); background-size: 48px 48px; -webkit-mask: linear-gradient(to bottom, transparent, #000 40%); mask: linear-gradient(to bottom, transparent, #000 40%); }',
      '.d-cinematic-loader .cl-horizon { position: absolute; left: 0; right: 0; top: 60%; height: 1px; background: linear-gradient(90deg, transparent, rgb(255 255 255 / .5), transparent); }',
      '.d-cinematic-loader .cl-copy { position: absolute; left: 8%; right: 8%; top: 22%; }',
      '.d-cinematic-loader .cl-copy > * { opacity: 0; transform: translateY(12px); filter: blur(6px); transition: opacity 1s var(--ease-out), transform 1s var(--ease-out), filter 1s var(--ease-out); }',
      '.d-cinematic-loader .cl-copy.on > * { opacity: 1; transform: none; filter: none; }',
      '.d-cinematic-loader .cl-copy.on > :nth-child(2) { transition-delay: .12s; } .d-cinematic-loader .cl-copy.on > :nth-child(3) { transition-delay: .3s; }',
      '.d-cinematic-loader .cl-copy .label { color: rgb(255 255 255 / .7); margin: 0 0 14px; }',
      '.d-cinematic-loader .cl-copy h4 { font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: clamp(30px, 6.4cqw, 72px); line-height: .98; letter-spacing: -.03em; margin: 0 0 22px; color: #fff; text-shadow: 0 2px 24px rgb(0 0 0 / .55); }',
      '.d-cinematic-loader .cl-copy h4 em { color: rgb(255 255 255 / .8); }',
      '.d-cinematic-loader .cl-again { display: inline-flex; gap: 8px; padding: 12px 18px; border: 1px solid rgb(255 255 255 / .25); border-radius: 999px; color: rgb(255 255 255 / .85); transition: border-color .3s, color .3s, transform .2s var(--ease-out); }',
      '.d-cinematic-loader .cl-again:hover { border-color: #fff; color: #fff; } .d-cinematic-loader .cl-again:active { transform: scale(.97); }',
      '.d-cinematic-loader .cl-loader { position: absolute; inset: 0; background: #000; }',
      '.d-cinematic-loader .cl-loader canvas, .d-cinematic-loader .cl-loader svg { position: absolute; inset: 0; width: 100%; height: 100%; }',
      '.d-cinematic-loader .cl-loader canvas { visibility: hidden; }',
      '.d-cinematic-loader .cl-text { font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 800; font-size: 220px; letter-spacing: -.02em; }',
      '.d-cinematic-loader .cl-ghost { fill: #fff; fill-opacity: .12; } .d-cinematic-loader .cl-lit { fill: #fff; fill-opacity: .78; }',
      '.d-cinematic-loader .cl-count { position: absolute; left: 50%; transform: translateX(-50%); margin: 0; display: flex; color: #fff; font-size: 13px; transition: opacity .5s, filter .5s; }',
      '.d-cinematic-loader .cl-count .col { position: relative; display: inline-block; height: 1.3em; width: .72em; overflow: hidden; line-height: 1.3em; }',
      '.d-cinematic-loader .cl-count .strip { position: absolute; left: 0; right: 0; top: 0; display: flex; flex-direction: column; transition: color .4s; }',
      '.d-cinematic-loader .cl-count .strip span { height: 1.3em; text-align: center; }',
      '.d-cinematic-loader .cl-count .dim .strip { color: rgb(255 255 255 / .25); } .d-cinematic-loader .cl-count .pct { margin-left: .35em; color: rgb(255 255 255 / .35); }',
      '.d-cinematic-loader .cl-meta { position: absolute; left: 0; right: 0; bottom: 26px; text-align: center; margin: 0; color: rgb(255 255 255 / .45); padding: 0 20px; transition: opacity .4s; }',
      '.d-cinematic-loader .cl-meta b { font-weight: 500; color: rgb(255 255 255 / .85); } .d-cinematic-loader .cl-meta i { font-style: normal; color: #f97316; }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var NS = 'http://www.w3.org/2000/svg';
      stage.style.containerType = 'inline-size';
      stage.innerHTML =
        '<div class="cl-scene"><div class="cl-sun" aria-hidden="true"></div><div class="cl-floor" aria-hidden="true"></div><div class="cl-horizon" aria-hidden="true"></div>' +
        '<div class="cl-copy"><p class="label"><span class="accent">[ Nº 01 ]</span>&nbsp; Scene mounted</p>' +
        '<h4>Through the <em>logo.</em></h4><button type="button" class="label cl-again">Replay as return visit <span aria-hidden="true">↺</span></button></div></div>' +
        '<div class="cl-loader"><canvas aria-hidden="true"></canvas>' +
        '<svg role="progressbar" aria-label="Loading the demo scene" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" preserveAspectRatio="xMidYMid slice">' +
        '<defs><clipPath id="cl-fillclip"><rect class="cl-fill" x="-2000" y="' + Y1 + '" width="5000" height="0"/></clipPath>' +
        '<clipPath id="cl-wordclip"><text x="500" y="200" text-anchor="middle" class="cl-text">MOLIN</text></clipPath>' +
        '<linearGradient id="cl-bloom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".25" stop-color="#fff" stop-opacity=".9"/>' +
        '<stop offset=".45" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
        '<text x="500" y="200" text-anchor="middle" class="cl-text cl-ghost">MOLIN</text>' +
        '<g clip-path="url(#cl-fillclip)"><text x="500" y="200" text-anchor="middle" class="cl-text cl-lit">MOLIN</text></g>' +
        '<g clip-path="url(#cl-wordclip)"><g class="cl-band" opacity="0"><rect x="0" y="-50" width="1000" height="100" fill="url(#cl-bloom)"/><rect x="0" y="-5" width="1000" height="10" fill="#fff"/></g></g>' +
        '</svg><p class="label cl-count" aria-hidden="true"><span class="digits"></span><span class="pct">%</span></p><p class="label cl-meta"></p></div>';

      var scene = stage.querySelector('.cl-scene'), copy = stage.querySelector('.cl-copy');
      var loader = stage.querySelector('.cl-loader'), svg = loader.querySelector('svg'), cv = loader.querySelector('canvas');
      var g = cv.getContext('2d');
      var ghost = svg.querySelector('.cl-ghost'), fill = svg.querySelector('.cl-fill'), band = svg.querySelector('.cl-band'), lit = svg.querySelector('.cl-lit');
      var countEl = loader.querySelector('.cl-count'), meta = loader.querySelector('.cl-meta');
      var again = copy.querySelector('.cl-again');
      var cols = [];
      for (var c = 0; c < 3; c++) {
        var col = ctx.el('span', 'col'), strip = ctx.el('span', 'strip');
        for (var d = 0; d < 10; d++) strip.appendChild(ctx.el('span', '', String(d)));
        col.appendChild(strip); countEl.firstChild.appendChild(col);
        cols.push({ el: col, strip: strip, x: 0, v: 0, goal: 0 });
      }

      var S = {}, W = 1, H = 1, dims = { dpr: 1 }, W0 = 1320, C0 = { x: 500, y: 120 }, CI = { x: 500, y: 120 };
      var streaks = [];
      for (var i = 0; i < 120; i++) streaks.push({ a: Math.random() * Math.PI * 2, r: Math.random(), l: .4 + Math.random() * .8 });

      function layout() {
        dims = ctx.fitCanvas(cv, stage, 2); W = dims.w; H = dims.h;
        var s = W / W0;
        countEl.style.top = Math.round(H / 2 + (Y1 + 6 - C0.y) * s + 18) + 'px';
        if (S.phase === 'load' || S.phase === 'idle') setView(W0, C0.x, C0.y);
      }
      function setView(w, x, y) {
        var h = w * H / W;
        svg.setAttribute('viewBox', (x - w / 2) + ' ' + (y - h / 2) + ' ' + w + ' ' + h);
        return { w: w, h: h, x0: x - w / 2, y0: y - h / 2, s: W / w };
      }
      function showCount(v, instant) {
        var digits = String(v).padStart(3, '0').split('').map(Number);
        var lead = v >= 100 ? 0 : v >= 10 ? 1 : 2;
        cols.forEach(function (cl, k) {
          cl.goal = -digits[k];
          if (instant) { cl.x = cl.goal; cl.v = 0; }
          cl.el.classList.toggle('dim', k < lead);
        });
        svg.setAttribute('aria-valuenow', v);
      }
      function springDigits(dt) {
        var n = 4, h = dt / n;
        cols.forEach(function (cl) {
          for (var k = 0; k < n; k++) { var a = (-260 * (cl.x - cl.goal) - 30 * cl.v) / 0.6; cl.v += a * h; cl.x += cl.v * h; }
          cl.strip.style.transform = 'translateY(' + (cl.x * 1.3).toFixed(4) + 'em)';
        });
      }

      function reset(fast) {
        var speed = fast ? 2.5 : 1;
        S = { phase: 'load', fast: fast, speed: speed, t: 0, fake: 0, shown: 0, nextTick: .3 / speed, exitT: 0, lastLogW: Math.log(W0),
          assets: ASSETS.map(function () { return (0.5 + Math.random() * 2.6) / speed; }) };
        loader.style.display = ''; loader.style.opacity = ''; loader.style.background = '#000';
        cv.style.visibility = 'hidden'; lit.style.opacity = ''; ghost.style.opacity = ''; countEl.style.opacity = ''; countEl.style.filter = ''; meta.style.opacity = '';
        svg.style.opacity = '';
        scene.style.transform = ctx.reduced ? '' : 'scale(.86)'; scene.style.filter = ctx.reduced ? '' : 'blur(8px) brightness(.45)';
        copy.classList.remove('on'); again.disabled = true; copy.inert = true;
        layout(); setView(W0, C0.x, C0.y);
        try { var e = lit.getExtentOfChar(3); CI = { x: e.x + e.width / 2, y: e.y + e.height * .55, hw: e.width * .3, top: Y0 + 10, bot: Y1 - 14 }; } catch (er) { CI = { x: 640, y: 125, hw: 15, top: 50, bot: 190 }; }
        showCount(0, true); applyFill(0);
      }
      function applyFill(p) {
        var y = Y1 - (Y1 - Y0) * p;
        fill.setAttribute('y', y); fill.setAttribute('height', Y1 - y + 2);
        band.setAttribute('transform', 'translate(0 ' + y + ')');
        band.setAttribute('opacity', Math.min(1, p * 25) * (p < 1 ? 1 : 0));
      }

      function tickLoad(dt) {
        S.t += dt;
        S.nextTick -= dt;
        if (S.fake < 1 && S.nextTick <= 0) {
          var late = S.fake > .85;
          S.fake = Math.min(1, S.fake + (late ? .01 + .03 * Math.random() : .03 + .12 * Math.random()));
          S.nextTick = ((late ? 180 : 60) + Math.random() * (Math.random() < .15 ? 700 : 260)) / 1000 / S.speed;
        }
        var loaded = S.assets.filter(function (a) { return S.t >= a; }).length;
        var real = loaded / S.assets.length, ready = loaded === S.assets.length;
        var target = Math.min(S.fake, ready ? 1 : .9 * real);
        S.shown = ctx.damp(S.shown, target, 4 * S.speed, dt);
        if (target >= 1 && S.shown > .995) S.shown = 1;
        applyFill(S.shown);
        showCount(Math.round(S.shown * 100), ctx.reduced);
        meta.innerHTML = 'Assets <b>' + loaded + '/' + S.assets.length + '</b> · Real <b>' + Math.round(real * 100) + '%</b> · Theatre <b>' +
          Math.round(S.fake * 100) + '%</b> · Shown <i>' + Math.round(S.shown * 100) + '%</i>' + (S.fast ? ' · Return ×2.5' : '');
        if (S.shown >= 1) { S.phase = ctx.reduced ? 'fade' : 'exit'; S.exitT = 0; if (!ctx.reduced) beginExit(); }
      }
      function beginExit() {
        loader.style.background = 'transparent';
        cv.style.visibility = 'visible'; ghost.style.opacity = '0'; copy.classList.add('on');
        countEl.style.opacity = '0'; countEl.style.filter = 'blur(4px)'; meta.style.opacity = '0';
        S.lastLogW = Math.log(W0);
        if (ctx.audio.on) ctx.audio.whoosh(.08);
      }
      function tickExit(dt) {
        S.exitT += dt;
        var t1 = .45, t2 = S.fast ? 1.7 : 2.1, t = S.exitT, z;
        if (t < t1) z = -.08 * Math.sin((t / t1) * Math.PI / 2);
        else z = -.08 + 1.08 * Math.pow(Math.min((t - t1) / t2, 1), 2);
        var w = z < 0 ? W0 * (1 - 1.6 * z) : Math.exp(ctx.lerp(Math.log(W0), Math.log(2), z));
        var k = ctx.clamp(z / .35, 0, 1); k = k * k * (3 - 2 * k);   // centre reaches the I before the zoom gets deep
        var v = setView(w, ctx.lerp(C0.x, CI.x, k), ctx.lerp(C0.y, CI.y, k));
        var logV = Math.abs(Math.log(w) - S.lastLogW) / Math.max(dt, .001); S.lastLogW = Math.log(w);
        lit.style.opacity = String(ctx.clamp(1 - (t / (t1 + t2)) * 2.4, 0, 1));
        drawStreaks(v, logV, dt);
        var st = ctx.clamp((t - .75) / 1.8, 0, 1), e = st >= 1 ? 1 : 1 - Math.pow(2, -10 * st);
        scene.style.transform = 'scale(' + (.86 + .14 * e).toFixed(4) + ')';
        scene.style.filter = 'blur(' + (8 * (1 - e)).toFixed(2) + 'px) brightness(' + (.45 + .55 * e).toFixed(3) + ')';
        if (t >= t1 + t2) arrive();
      }
      function drawStreaks(v, speed, dt) {
        var d = dims.dpr;
        g.setTransform(d, 0, 0, d, 0, 0);
        // once the camera is fully inside the stem of the I, the whole frame is "hole": nothing left to draw
        if (v.x0 > CI.x - CI.hw && v.x0 + v.w < CI.x + CI.hw && v.y0 > CI.top && v.y0 + v.h < CI.bot) { g.clearRect(0, 0, W, H); return; }
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        var fx = (CI.x - v.x0) * v.s, fy = (CI.y - v.y0) * v.s, maxR = Math.hypot(W, H) * .6;
        var amt = Math.min(1, speed / 5);
        g.strokeStyle = '#fff'; g.lineCap = 'round';
        for (var i = 0; i < streaks.length; i++) {
          var q = streaks[i];
          q.r += speed * dt * .22 * (.4 + q.r);
          if (q.r > 1.2) { q.r = .04 + Math.random() * .2; q.a = Math.random() * Math.PI * 2; }
          var r0 = q.r * maxR, r1 = r0 + q.l * amt * 140 * (.3 + q.r);
          g.globalAlpha = amt * .55 * Math.min(1, q.r * 3);
          g.lineWidth = .6 + q.r * 1.2;
          g.beginPath(); g.moveTo(fx + Math.cos(q.a) * r0, fy + Math.sin(q.a) * r0); g.lineTo(fx + Math.cos(q.a) * r1, fy + Math.sin(q.a) * r1); g.stroke();
        }
        g.globalAlpha = 1;
        g.globalCompositeOperation = 'destination-out';
        g.setTransform(d * v.s, 0, 0, d * v.s, -v.x0 * v.s * d, -v.y0 * v.s * d);
        g.font = '800 220px Archivo, sans-serif';
        if ('fontStretch' in g) g.fontStretch = 'expanded';
        if ('letterSpacing' in g) g.letterSpacing = '-4.4px';
        g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.fillText('MOLIN', 500, 200);
        g.globalCompositeOperation = 'source-over';
      }
      function tickFade(dt) {
        S.exitT += dt;
        loader.style.opacity = String(1 - ctx.clamp(S.exitT / .8, 0, 1));
        if (S.exitT >= .8) arrive();
      }
      function arrive() {
        S.phase = 'done';
        loader.style.display = 'none';
        scene.style.transform = ''; scene.style.filter = '';
        copy.inert = false; again.disabled = false; copy.classList.add('on');
        lp.stop();
      }

      var lp = ctx.loop(function (dt) {
        if (S.phase === 'load') tickLoad(dt);
        else if (S.phase === 'exit') tickExit(dt);
        else if (S.phase === 'fade') tickFade(dt);
        if (S.phase !== 'done' && !ctx.reduced) springDigits(dt);
        else if (S.phase !== 'done') cols.forEach(function (cl) { cl.strip.style.transform = 'translateY(' + cl.goal * 1.3 + 'em)'; });
      });
      var ro = new ResizeObserver(function () { if (S.phase) layout(); });
      again.addEventListener('click', function () { reset(true); lp.start(); });
      S.phase = 'idle';

      return {
        start: function () {
          ro.observe(stage);
          if (S.phase === 'idle') reset(false);
          if (S.phase !== 'done') lp.start();
        },
        stop: function () { lp.stop(); ro.disconnect(); },
        replay: function () { reset(false); lp.start(); }
      };
    }
  });
})();
