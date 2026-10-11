/* orbit-drag-reveal — arc slider that scrubs a cover off an object: rubber band, spring back, flick commit */
(function () {
  var ID = 'orbit-drag-reveal';
  var D2R = Math.PI / 180;
  var vib = function (p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  Lib.register(ID, {
    hint: 'Drag the glowing handle along the arc. Let go early and it springs back; flick fast or reach the end to commit. Arrow keys and Enter work too.',
    notes: [
      'Pointer angle around the anchor → progress; ignored if more than 120° off the arc, rubber band below zero: <code>n &lt; 0 ? max(.25·n, −.06) : n</code>',
      'Release: last 5 <code>{p,t}</code> samples; if <code>Δp/Δt &gt; 1.4 /s</code> and <code>p &gt; .12</code> it commits (flick), at <code>p ≥ .97</code> it commits outright',
      'Otherwise a hand-rolled spring pulls it home: <code>a = −170·x − 26·v</code> per frame (dt ≤ 50 ms) until |x| &lt; .001 and |v| &lt; .01',
      'Arc auto-fits: landscape <code>a1 = min(40°, asin((y − top)/R))</code>, <code>a0 = max(a1 − 58°, …)</code>; portrait is a smile at −130° to −50°',
      '<code>role="slider"</code> with Arrow ±10 % and Enter/Space to commit; onboarding ghost rides the arc after 3 s, up to 3× every 5.5 s; haptics every quarter'
    ],
    simplified: 'The “engine” is a Canvas 2D cover sliding off a drawn object; the crank sound is filtered noise instead of a recorded loop.',
    css: [
      '.d-orbit-drag-reveal { user-select: none; -webkit-user-select: none; }',
      '.d-orbit-drag-reveal canvas, .d-orbit-drag-reveal .od-svg { position: absolute; inset: 0; width: 100%; height: 100%; }',
      '.d-orbit-drag-reveal .od-svg { pointer-events: none; overflow: visible; }',
      '.d-orbit-drag-reveal .od-track { stroke-dasharray: 1 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.8s cubic-bezier(.77,0,.175,1); }',
      '.d-orbit-drag-reveal.ready .od-track { stroke-dashoffset: 0; }',
      '.d-orbit-drag-reveal .od-ui { transition: opacity .35s var(--ease-out); }',
      '.d-orbit-drag-reveal.done .od-ui { opacity: 0; pointer-events: none; }',
      '.d-orbit-drag-reveal .od-handle { position: absolute; left: 0; top: 0; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; touch-action: none; cursor: grab; z-index: 3; }',
      '.d-orbit-drag-reveal .od-handle:active { cursor: grabbing; }',
      '.d-orbit-drag-reveal .od-handle i { position: absolute; inset: 0; border-radius: 50%; pointer-events: none; }',
      '.d-orbit-drag-reveal .od-ring { border: 1px solid rgb(255 255 255 / .55); transition: transform .35s var(--ease-out), background .35s, border-color .2s; }',
      '.d-orbit-drag-reveal .od-handle:focus-visible { outline: none; } .d-orbit-drag-reveal .od-handle:focus-visible .od-ring { border-color: #fff; }',
      '.d-orbit-drag-reveal .od-handle.grab .od-ring { transform: scale(1.7); background: rgb(255 255 255 / .1); }',
      '.d-orbit-drag-reveal .od-dot { inset: 16px !important; background: #f97316; box-shadow: 0 0 14px rgb(249 115 22 / .9); }',
      '.d-orbit-drag-reveal .od-ping { border: 1px solid rgb(249 115 22 / .7); opacity: 0; }',
      '.d-orbit-drag-reveal .od-ghost { position: absolute; left: 0; top: 0; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .5); opacity: 0; pointer-events: none; }',
      '.d-orbit-drag-reveal .od-ghost::after { content: ""; position: absolute; inset: 17px; border-radius: 50%; background: rgb(255 255 255 / .8); }',
      '.d-orbit-drag-reveal .od-lab { position: absolute; left: 0; top: 0; margin: 0; color: rgb(255 255 255 / .85); white-space: nowrap; transition: opacity .3s; text-shadow: 0 1px 14px rgb(0 0 0 / .8); pointer-events: none; }',
      '.d-orbit-drag-reveal .od-lab.dim { opacity: .5; }',
      '.d-orbit-drag-reveal .od-read { position: absolute; left: 22px; bottom: 20px; margin: 0; color: rgb(255 255 255 / .45); }',
      '.d-orbit-drag-reveal .od-read b { font-weight: 500; color: rgb(255 255 255 / .9); } .d-orbit-drag-reveal .od-read b.hot { color: #f97316; }',
      '.d-orbit-drag-reveal .od-snd { position: absolute; right: 22px; top: 20px; margin: 0; color: rgb(255 255 255 / .4); }',
      '.d-orbit-drag-reveal .od-final { position: absolute; left: 7%; right: 7%; bottom: 13%; pointer-events: none; }',
      '.d-orbit-drag-reveal.done .od-final { pointer-events: auto; }',
      '.d-orbit-drag-reveal .od-final .label { color: #f97316; margin: 0 0 12px; }',
      '.d-orbit-drag-reveal .od-final h4 { margin: 0 0 18px; font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: clamp(26px, 5.4cqw, 64px); line-height: .98; letter-spacing: -.03em; color: #fff; text-shadow: 0 2px 24px rgb(0 0 0 / .55); }',
      '.d-orbit-drag-reveal .od-final em { color: rgb(255 255 255 / .8); }',
      '.d-orbit-drag-reveal .mask { display: block; overflow: hidden; padding-bottom: .12em; margin-bottom: -.12em; }',
      '.d-orbit-drag-reveal .ln { display: block; transform: translateY(110%); transition: transform .35s cubic-bezier(.23,1,.32,1); }',
      '.d-orbit-drag-reveal.done .ln { transform: none; transition-duration: 1.1s; } .d-orbit-drag-reveal.done .mask + .mask .ln { transition-delay: .09s; }',
      '.d-orbit-drag-reveal .od-final .fx { opacity: 0; transition: opacity .3s; } .d-orbit-drag-reveal.done .od-final .fx { opacity: 1; transition: opacity 1s .3s; }',
      '.d-orbit-drag-reveal .od-again { padding: 12px 18px; border: 1px solid rgb(255 255 255 / .25); border-radius: 999px; color: rgb(255 255 255 / .85); transition: border-color .3s, transform .2s var(--ease-out); }',
      '.d-orbit-drag-reveal .od-again:hover { border-color: #fff; } .d-orbit-drag-reveal .od-again:active { transform: scale(.97); }',
      '@media (prefers-reduced-motion: reduce) { .d-orbit-drag-reveal .ln { transform: none; opacity: 0; transition: opacity .8s; } .d-orbit-drag-reveal.done .ln { opacity: 1; } .d-orbit-drag-reveal .od-track { transition: none; stroke-dashoffset: 0; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var R0 = ctx.reduced;
      stage.style.containerType = 'inline-size';
      stage.innerHTML =
        '<canvas role="img" aria-label="A dark sculptural sphere under a cloth cover; dragging the handle pulls the cover away"></canvas>' +
        '<svg class="od-svg od-ui" aria-hidden="true"><defs><linearGradient id="od-fade" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
        '<stop offset=".5" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
        '<path class="od-track" pathLength="1" fill="none" stroke="url(#od-fade)" stroke-width="1"/>' +
        '<path class="od-hintp" pathLength="1" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
        '<path class="od-prog" pathLength="1" fill="none" stroke="#f97316" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
        '<line class="od-tick" stroke="#fff" stroke-opacity=".7" stroke-width="1"/></svg>' +
        '<div class="od-ghost od-ui" aria-hidden="true"></div>' +
        '<button type="button" class="od-handle od-ui" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Drag to reveal the object" data-cursor="Drag">' +
        '<i class="od-ping"></i><i class="od-ring"></i><i class="od-dot"></i></button>' +
        '<p class="label od-lab od-ui" aria-hidden="true">Drag to reveal</p>' +
        '<p class="label od-read od-ui">p <b class="r-p">0.00</b> · release <b class="r-v">0.0</b>/s · flick &gt; 1.4/s</p>' +
        '<p class="label od-snd od-ui" hidden>Turn Sound on (top right) to hear the crank</p>' +
        '<div class="od-final"><p class="label fx">[ Revealed ]</p><h4><span class="mask"><span class="ln">Unveiled,</span></span><span class="mask"><span class="ln"><em>in one pull.</em></span></span></h4>' +
        '<button type="button" class="od-again label fx">Cover it again <span aria-hidden="true">↺</span></button></div>';

      var cv = stage.querySelector('canvas'), g = cv.getContext('2d');
      var track = stage.querySelector('.od-track'), hintp = stage.querySelector('.od-hintp'), prog = stage.querySelector('.od-prog'), tick = stage.querySelector('.od-tick');
      var grad = stage.querySelector('#od-fade'), ghost = stage.querySelector('.od-ghost'), handle = stage.querySelector('.od-handle');
      var ping = stage.querySelector('.od-ping'), lab = stage.querySelector('.od-lab'), rP = stage.querySelector('.r-p'), rV = stage.querySelector('.r-v');
      var snd = stage.querySelector('.od-snd'), final = stage.querySelector('.od-final'), again = stage.querySelector('.od-again');

      var dims = { w: 1, h: 1, dpr: 1 }, G = {}, p = 0, vel = 0, mode = 'idle', samples = [], quarter = 0;
      var kbd = false, committed = false, interacted = false, hintCount = 0, timers = [], anims = [], commitT = 0, sweepT = 0, crank = null;
      final.inert = true;

      function layout() {
        dims = ctx.fitCanvas(cv, stage, 2);
        var W = dims.w, H = dims.h, portrait = H > W * 1.05;
        G.W = W; G.H = H; G.portrait = portrait;
        if (portrait) {
          G.cx = W * .5; G.cy = H * .36; G.r = Math.min(W, H) * .24;
          G.R = ctx.clamp((W / 2 - 28) / Math.cos(50 * D2R), 100, H - 120 - G.cy);
          G.a0 = -130; G.a1 = -50;
        } else {
          G.cx = W * .4; G.cy = H * .5; G.r = Math.min(W, H) * .2;
          G.R = Math.max(80, Math.min(G.r * 2.3, W - 64 - G.cx));   // anchor.r = r·2.3
          var asin = function (v) { return Math.asin(ctx.clamp(v, -1, 1)) / D2R; };
          G.a1 = Math.min(40, asin((G.cy - (24 + 32)) / G.R));
          G.a0 = Math.max(G.a1 - 58, asin((G.cy - (H - 64)) / G.R));
        }
        var a = pt(0), b = pt(1);
        var d = 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' A' + G.R.toFixed(1) + ' ' + G.R.toFixed(1) + ' 0 0 0 ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
        [track, hintp, prog].forEach(function (el) { el.setAttribute('d', d); });
        grad.setAttribute('x1', a.x); grad.setAttribute('y1', a.y); grad.setAttribute('x2', b.x); grad.setAttribute('y2', b.y);
        var th = G.a1 * D2R, ux = Math.cos(th), uy = -Math.sin(th);
        tick.setAttribute('x1', b.x - ux * 6); tick.setAttribute('y1', b.y - uy * 6); tick.setAttribute('x2', b.x + ux * 6); tick.setAttribute('y2', b.y + uy * 6);
        place(); draw();
      }
      function pt(t) { var th = (G.a0 + (G.a1 - G.a0) * t) * D2R; return { x: G.cx + G.R * Math.cos(th), y: G.cy - G.R * Math.sin(th) }; }
      function place() {
        var q = pt(ctx.clamp(p, -.06, 1));
        handle.style.transform = 'translate3d(' + q.x + 'px,' + q.y + 'px,0)';
        var flip = q.x > G.W - 200;
        lab.style.transform = 'translate3d(' + (flip ? q.x - 34 : q.x + 34) + 'px,' + (q.y - 7) + 'px,0)' + (flip ? ' translateX(-100%)' : '');
        prog.setAttribute('stroke-dashoffset', 1 - ctx.clamp(p, 0, 1));
        handle.setAttribute('aria-valuenow', Math.round(ctx.clamp(p, 0, 1) * 100));
        rP.textContent = p.toFixed(2);
      }

      /* ---- the "engine": cover pulled off a sphere ---- */
      function draw() {
        var W = G.W, H = G.H, d = dims.dpr, cx = G.cx, cy = G.cy, r = G.r;
        var e = ctx.clamp(p, 0, 1); e = 1 - Math.pow(1 - e, 2);
        g.setTransform(d, 0, 0, d, 0, 0);
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        var sp = g.createLinearGradient(0, 0, 0, cy + r);
        sp.addColorStop(0, 'rgba(255,240,225,' + (.03 + .13 * e) + ')'); sp.addColorStop(1, 'rgba(255,240,225,0)');
        g.fillStyle = sp; g.beginPath(); g.moveTo(cx - r * .35, 0); g.lineTo(cx + r * .35, 0); g.lineTo(cx + r * 2, cy + r * 1.1); g.lineTo(cx - r * 2, cy + r * 1.1); g.fill();
        var fy = cy + r * 1.04, fl = g.createRadialGradient(cx, fy, 0, cx, fy, r * 2.6);
        fl.addColorStop(0, 'rgba(249,115,22,' + (.08 + .22 * e) + ')'); fl.addColorStop(1, 'rgba(249,115,22,0)');
        g.fillStyle = fl; g.fillRect(0, fy - r * .5, W, r * 2);
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, fy, W, 1);
        g.save(); g.translate(cx, fy); g.scale(1, .16);
        var sh = g.createRadialGradient(0, 0, 0, 0, 0, r * 1.2); sh.addColorStop(0, 'rgba(0,0,0,.9)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = sh; g.beginPath(); g.arc(0, 0, r * 1.2, 0, 7); g.fill(); g.restore();
        // sphere
        var bd = g.createRadialGradient(cx - r * .35, cy - r * .4, r * .05, cx, cy, r);
        bd.addColorStop(0, '#4a4542'); bd.addColorStop(.45, '#151414'); bd.addColorStop(1, '#050505');
        g.fillStyle = bd; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
        g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.clip();
        var rim = g.createRadialGradient(cx - r * .5, cy - r * .2, r * .9, cx - r * .3, cy - r * .1, r * 1.45);
        rim.addColorStop(0, 'rgba(249,115,22,0)'); rim.addColorStop(1, 'rgba(249,115,22,' + (.25 + .7 * e) + ')');
        g.fillStyle = rim; g.fillRect(cx - r, cy - r, r * 2, r * 2);
        g.strokeStyle = 'rgba(255,255,255,' + (.08 + .18 * e) + ')'; g.lineWidth = 1;
        g.beginPath(); g.ellipse(cx, cy + r * .08, r, r * .2, 0, 0, Math.PI); g.stroke();
        if (sweepT > 0 && sweepT < 1) {
          var sx = cx - r * 1.4 + sweepT * r * 2.8, sw = g.createLinearGradient(sx - r * .3, 0, sx + r * .3, 0);
          sw.addColorStop(0, 'rgba(255,255,255,0)'); sw.addColorStop(.5, 'rgba(255,255,255,.28)'); sw.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = sw; g.fillRect(cx - r, cy - r, r * 2, r * 2);
        }
        g.restore();
        g.fillStyle = 'rgba(255,255,255,' + (.25 + .4 * e) + ')';
        g.beginPath(); g.ellipse(cx - r * .38, cy - r * .48, r * .16, r * .08, -.6, 0, 7); g.fill();
        // cover
        var fade = 1 - ctx.clamp((p - .72) / .26, 0, 1);
        if (fade > 0) {
          g.save(); g.globalAlpha = fade;
          g.translate(cx + e * W * .55, cy - r * 1.12 - e * H * .45); g.rotate(e * .55); g.scale(1 - .25 * e, 1 - .1 * e);
          var oy = r * 1.12;
          var cl = g.createLinearGradient(-r * 1.3, 0, r * 1.3, 0);
          cl.addColorStop(0, '#141414'); cl.addColorStop(.35, '#2e2d2c'); cl.addColorStop(.62, '#1c1b1b'); cl.addColorStop(1, '#0c0c0c');
          g.fillStyle = cl; g.beginPath();
          g.moveTo(-r * 1.32, oy + r * 1.04);
          g.bezierCurveTo(-r * 1.3, oy + r * .3, -r * 1.15, oy - r * 1.05, 0, oy - r * 1.12);
          g.bezierCurveTo(r * 1.15, oy - r * 1.05, r * 1.3, oy + r * .3, r * 1.32, oy + r * 1.04);
          var hem = [[1, 1.12, .66, 1.04], [.33, .96, 0, 1.06], [-.33, 1.14, -.66, 1.04], [-1, .96, -1.32, 1.04]];
          hem.forEach(function (h) { g.quadraticCurveTo(r * h[0], oy + r * h[1], r * h[2], oy + r * h[3]); });
          g.fill();
          g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1.4;
          [[-.6, -.2, -.66], [.05, 0, .02], [.55, -.1, .66]].forEach(function (f) {
            g.beginPath(); g.moveTo(r * f[1] * .5, oy - r * .7); g.quadraticCurveTo(r * f[0], oy + r * .2, r * f[2], oy + r * 1.02); g.stroke();
          });
          g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1.5;
          g.beginPath(); g.moveTo(-r * .2, oy - r * .9); g.quadraticCurveTo(-r * .9, oy - r * .2, -r * 1.05, oy + r * .9); g.stroke();
          g.restore();
        }
      }

      /* ---- input ---- */
      function fromPointer(e) {
        var b = stage.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
        var ang = Math.atan2(-(y - G.cy), x - G.cx) / D2R, mid = (G.a0 + G.a1) / 2;
        var dd = ((ang - mid + 540) % 360) - 180;
        if (Math.abs(dd) > 120) return null;
        var n = (dd + (G.a1 - G.a0) / 2) / (G.a1 - G.a0);
        return n < 0 ? Math.max(.25 * n, -.06) : Math.min(n, 1);
      }
      function setP(n) {
        p = n;
        var q = Math.floor(ctx.clamp(p, 0, 1) * 4);
        if (q !== quarter) { if (q > quarter) vib(4); quarter = q; }
        if (crank) { var c = ctx.audio.ctx, k = Math.max(0, p); crank.g.gain.setTargetAtTime(.4 * Math.pow(k, .8) * .3, c.currentTime, .03); crank.s.playbackRate.setTargetAtTime(.85 + .5 * k, c.currentTime, .03); }
        place(); draw();
      }
      function stopCrank() { if (!crank) return; try { crank.g.gain.setTargetAtTime(0, ctx.audio.ctx.currentTime, .05); crank.s.stop(ctx.audio.ctx.currentTime + .3); } catch (e) {} crank = null; }
      function startCrank() {
        var A = ctx.audio; if (!A.on || !A.ctx) { snd.hidden = false; return; }
        snd.hidden = true;
        var c = A.ctx, s = c.createBufferSource(), bp = c.createBiquadFilter(), gn = c.createGain();
        s.buffer = A.noise(); s.loop = true; bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 3; gn.gain.value = 0;
        s.connect(bp).connect(gn).connect(A.out); s.start(); crank = { s: s, g: gn };
      }
      function touch() { if (!interacted) { interacted = true; clearHints(); } }
      handle.addEventListener('pointerenter', touch); handle.addEventListener('focus', touch);
      handle.addEventListener('pointerdown', function (e) {
        if (committed) return;
        touch(); kbd = false; e.preventDefault(); handle.focus({ preventScroll: true });
        try { handle.setPointerCapture(e.pointerId); } catch (er) {}
        mode = 'drag'; vel = 0; samples = []; handle.classList.add('grab'); lab.classList.add('dim'); startCrank();
      });
      handle.addEventListener('pointermove', function (e) {
        if (mode !== 'drag') return;
        var n = fromPointer(e); if (n == null) return;
        samples.push({ p: n, t: performance.now() }); if (samples.length > 5) samples.shift();
        setP(n);
        if (p >= .97) commit();
      });
      function release() {
        if (mode !== 'drag') return;
        handle.classList.remove('grab'); lab.classList.remove('dim'); stopCrank();
        var v = 0;
        if (samples.length > 1) { var a = samples[0], b = samples[samples.length - 1]; v = (b.p - a.p) / Math.max((b.t - a.t) / 1000, .001); }
        if (performance.now() - (samples.length ? samples[samples.length - 1].t : 0) > 120) v = 0;
        rV.textContent = v.toFixed(1); rV.classList.toggle('hot', v > 1.4 && p > .12);
        if (v > 1.4 && p > .12) commit();
        else { mode = R0 ? 'idle' : 'spring'; vel = 0; if (R0) setP(0); }
      }
      handle.addEventListener('pointerup', release); handle.addEventListener('pointercancel', release);
      handle.addEventListener('keydown', function (e) {
        if (committed) return;
        var k = e.key; kbd = true;
        if (k === 'ArrowRight' || k === 'ArrowUp') { e.preventDefault(); touch(); mode = 'idle'; setP(Math.min(1, Math.round((p + .1) * 10) / 10)); if (p >= .97) commit(); }
        else if (k === 'ArrowLeft' || k === 'ArrowDown') { e.preventDefault(); touch(); mode = 'idle'; setP(Math.max(0, Math.round((p - .1) * 10) / 10)); }
        else if (k === 'Enter' || k === ' ') { e.preventDefault(); touch(); commit(); }
      });
      again.addEventListener('click', function () { reset(true); handle.focus({ preventScroll: true }); });

      function commit() {
        if (committed) return;
        committed = true; mode = 'commit'; commitT = 0; vib([12, 40, 24]); stopCrank();
        if (ctx.audio.on) ctx.audio.whoosh(.09);
        G.from = p; handle.classList.remove('grab'); lab.classList.remove('dim');
        lp.start();
      }
      function finish() {
        mode = 'idle'; p = 1; place();
        var hadFocus = document.activeElement === handle && kbd;
        stage.classList.add('done'); final.inert = false;
        stage.querySelectorAll('.od-ui').forEach(function (n) { n.inert = true; });
        if (hadFocus) again.focus({ preventScroll: true });
        sweepT = R0 ? 0 : .001;
      }

      var lp = ctx.loop(function (dt) {
        if (mode === 'spring') {
          for (var i = 0; i < 2; i++) { var h = dt / 2, a = -170 * p - 26 * vel; vel += a * h; p += vel * h; }
          if (Math.abs(p) < .001 && Math.abs(vel) < .01) { p = 0; vel = 0; mode = 'idle'; }
          setP(p);
        } else if (mode === 'commit') {
          commitT += dt;
          var t = R0 ? 1 : ctx.clamp(commitT / .7, 0, 1);
          p = ctx.lerp(G.from, 1, 1 - Math.pow(1 - t, 3)); place(); draw();
          if (t >= 1) finish();
        } else if (sweepT > 0 && sweepT < 1) { sweepT = Math.min(1, sweepT + dt / 1.6); draw(); }
      });

      /* ---- onboarding hint ---- */
      function clearHints() { timers.forEach(clearTimeout); timers = []; anims.forEach(function (a) { try { a.cancel(); } catch (e) {} }); anims = []; }
      function hint() {
        if (interacted || committed || hintCount >= 3) return;
        hintCount++;
        if (R0) { anims.push(lab.animate([{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }], { duration: 1600 })); }
        else {
          var kf = [], N = 14, i;
          var start = pt(0);
          kf.push({ offset: 0, opacity: 0, transform: 'translate3d(' + start.x + 'px,' + start.y + 'px,0)' });
          for (i = 0; i <= N; i++) {
            var u = i / N, s = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, q = pt(s * .85);
            kf.push({ offset: .15 + .55 * u, opacity: 1, transform: 'translate3d(' + q.x + 'px,' + q.y + 'px,0)' });
          }
          var endp = pt(.85);
          kf.push({ offset: .85, opacity: 1, transform: 'translate3d(' + endp.x + 'px,' + endp.y + 'px,0)' });
          kf.push({ offset: 1, opacity: 0, transform: 'translate3d(' + endp.x + 'px,' + endp.y + 'px,0)' });
          anims.push(ghost.animate(kf, { duration: 2600, easing: 'linear' }));
          anims.push(hintp.animate([{ strokeDashoffset: 1, opacity: 1, offset: 0 }, { strokeDashoffset: 1, opacity: 1, offset: .15 }, { strokeDashoffset: .15, opacity: 1, offset: .7 }, { strokeDashoffset: .15, opacity: 1, offset: .85 }, { strokeDashoffset: .15, opacity: 0 }], { duration: 2600 }));
          anims.push(ping.animate([{ transform: 'scale(1)', opacity: .9 }, { transform: 'scale(2.4)', opacity: 0 }], { duration: 1400, easing: 'cubic-bezier(.23,1,.32,1)' }));
          anims.push(tick.animate([{ stroke: '#fff' }, { stroke: '#f97316', offset: .62 }, { stroke: '#f97316', offset: .7 }, { stroke: '#fff' }], { duration: 2600 }));
        }
        timers.push(setTimeout(hint, 5500));
      }

      function reset(resumeHints) {
        clearHints(); stopCrank();
        committed = false; mode = 'idle'; p = 0; vel = 0; quarter = 0; sweepT = 0;
        stage.classList.remove('done'); final.inert = true;
        stage.querySelectorAll('.od-ui').forEach(function (n) { n.inert = false; });
        rV.textContent = '0.0'; rV.classList.remove('hot');
        place(); draw();
        if (resumeHints) { interacted = false; hintCount = 0; timers.push(setTimeout(hint, 3000)); }
      }
      var ro = new ResizeObserver(function () { layout(); });
      layout();

      return {
        start: function () {
          ro.observe(stage); layout(); lp.start();
          requestAnimationFrame(function () { stage.classList.add('ready'); });
          if (!interacted && !committed) timers.push(setTimeout(hint, hintCount ? 1200 : 3000));
        },
        stop: function () {
          lp.stop(); ro.disconnect(); clearHints(); stopCrank();
          if (mode === 'drag') { handle.classList.remove('grab'); lab.classList.remove('dim'); mode = 'spring'; }
          if (mode === 'commit') finish();
        },
        replay: function () { reset(true); }
      };
    }
  });
})();
