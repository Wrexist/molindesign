/* hud-cinematic-ui — viewfinder chrome over a live canvas "scene", telemetry from the actual camera values */
(function () {
  var ID = 'hud-cinematic-ui';
  var FSTOPS = [1.8, 2, 2.8, 4, 5.6];

  Lib.register(ID, {
    hint: 'Scroll past the stage: the lens dollies from 24 to 70 mm and every readout follows the real camera values.',
    notes: [
      'One <code>.label</code> class for all chrome: Archivo 10.5 px, 500, <code>font-stretch:112.5%</code>, .2em tracking, uppercase, tabular nums',
      'Vignette instead of boxes: <code>radial-gradient(130% 105% at 50% 44%, transparent 42%, rgb(0 0 0/.5) 74%, rgb(0 0 0/.9))</code> plus a top/bottom linear fade',
      'Opacity ladder: /90 primary, /70 secondary, /45 keys, /15 rails, /10 hairlines; orange #f97316 only for index digits, rules and live dots',
      'Frame corners fade 0→1 and scale 1.015→1 over 1.4 s; spec column is a <code>border-r white/20</code> rule of label rows',
      'Telemetry (<code>35 mm · f/2.8 · Focus 4.2 m</code>) is derived from the camera each frame, never typed in by hand'
    ],
    simplified: 'A Canvas 2D point-cloud stands in for the 3D model; the f-stop drifts on a timer instead of following a depth-of-field pass.',
    css: [
      '.d-hud-cinematic-ui { container-type: inline-size; user-select: none; }',
      '.d-hud-cinematic-ui canvas { position: absolute; inset: 0; width: 100%; height: 100%; }',
      '.d-hud-cinematic-ui .hv { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(130% 105% at 50% 44%, transparent 42%, rgb(0 0 0 / .5) 74%, rgb(0 0 0 / .9) 100%), linear-gradient(to bottom, rgb(0 0 0 / .4), transparent 20%, transparent 82%, rgb(0 0 0 / .45)); }',
      '.d-hud-cinematic-ui .hf { position: absolute; inset: 30px; pointer-events: none; opacity: 0; transform: scale(1.015); transition: opacity 1.4s var(--ease-out), transform 1.4s var(--ease-out); }',
      '.d-hud-cinematic-ui.on .hf { opacity: 1; transform: none; }',
      '.d-hud-cinematic-ui .hf i { position: absolute; width: 20px; height: 20px; border: 0 solid rgb(255 255 255 / .4); }',
      '.d-hud-cinematic-ui .hf i:nth-child(1) { top: 0; left: 0; border-width: 1px 0 0 1px; } .d-hud-cinematic-ui .hf i:nth-child(2) { top: 0; right: 0; border-width: 1px 1px 0 0; }',
      '.d-hud-cinematic-ui .hf i:nth-child(3) { bottom: 0; left: 0; border-width: 0 0 1px 1px; } .d-hud-cinematic-ui .hf i:nth-child(4) { bottom: 0; right: 0; border-width: 0 1px 1px 0; }',
      '.d-hud-cinematic-ui .hud > * { position: absolute; margin: 0; text-shadow: 0 1px 14px rgb(0 0 0 / .8); opacity: 0; transform: translateY(12px); filter: blur(6px); transition: opacity 1s var(--ease-out), transform 1s var(--ease-out), filter 1s var(--ease-out); }',
      '.d-hud-cinematic-ui.on .hud > * { opacity: 1; transform: none; filter: none; }',
      '.d-hud-cinematic-ui .h-title { left: 7%; top: 13%; }',
      '.d-hud-cinematic-ui .h-eye { display: flex; align-items: center; gap: 12px; color: #f97316; margin: 0 0 14px; }',
      '.d-hud-cinematic-ui .h-eye::after { content: ""; width: 32px; height: 1px; background: #f97316; }',
      '.d-hud-cinematic-ui .h-name { font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 300; letter-spacing: .04em; font-size: clamp(30px, 8.4cqw, 120px); line-height: .95; color: #fff; margin: 0; }',
      '.d-hud-cinematic-ui .h-sub { color: rgb(255 255 255 / .7); margin: 12px 0 0; }',
      '.d-hud-cinematic-ui .h-spec { right: 7%; top: 34%; border-right: 1px solid rgb(255 255 255 / .2); padding-right: 20px; transition-delay: .35s !important; }',
      '.d-hud-cinematic-ui .h-spec p { display: flex; justify-content: flex-end; gap: 24px; padding: 6px 0; margin: 0; }',
      '.d-hud-cinematic-ui .h-spec span:first-child { color: rgb(255 255 255 / .4); } .d-hud-cinematic-ui .h-spec span:last-child { min-width: 96px; text-align: right; color: rgb(255 255 255 / .85); }',
      '.d-hud-cinematic-ui .h-rec { right: 7%; top: 13%; color: rgb(255 255 255 / .7); display: flex; gap: 14px; align-items: center; }',
      '.d-hud-cinematic-ui .h-rec b { font-weight: 500; color: #f97316; } .d-hud-cinematic-ui .h-dot { width: 6px; height: 6px; border-radius: 50%; background: #f97316; box-shadow: 0 0 10px rgb(249 115 22 / .9); }',
      '.d-hud-cinematic-ui .h-prov { left: 7%; bottom: 11%; transition-delay: .6s !important; } .d-hud-cinematic-ui .h-prov dt { color: rgb(255 255 255 / .45); } .d-hud-cinematic-ui .h-prov dd { margin: 4px 0 12px; color: rgb(255 255 255 / .85); } .d-hud-cinematic-ui .h-prov dd:last-child { margin-bottom: 0; }',
      '.d-hud-cinematic-ui .h-tele { right: 7%; bottom: 11%; text-align: right; transition-delay: .8s !important; }',
      '.d-hud-cinematic-ui .h-tele .mono { font-size: 12px; letter-spacing: .04em; color: rgb(255 255 255 / .9); font-variant-numeric: tabular-nums; white-space: nowrap; }',
      '.d-hud-cinematic-ui .h-tele .label { color: rgb(255 255 255 / .45); margin-bottom: 6px; }',
      '.d-hud-cinematic-ui .h-hint { left: 50%; bottom: 9%; transform: translateX(-50%) !important; display: flex; flex-direction: column; align-items: center; gap: 10px; color: rgb(255 255 255 / .6); }',
      '.d-hud-cinematic-ui .h-tick { position: relative; width: 1px; height: 36px; overflow: hidden; background: rgb(255 255 255 / .15); }',
      '.d-hud-cinematic-ui .h-tick i { position: absolute; left: 0; right: 0; top: 0; height: 12px; background: rgb(255 255 255 / .8); animation: hud-tick 1.6s ease-in-out infinite; }',
      '.d-hud-cinematic-ui.paused .h-tick i { animation-play-state: paused; }',
      '@keyframes hud-tick { from { transform: translateY(-12px); } to { transform: translateY(36px); } }',
      '@media (prefers-reduced-motion: reduce) { .d-hud-cinematic-ui .h-tick i { animation: none; transform: translateY(12px); } .d-hud-cinematic-ui .hud > *, .d-hud-cinematic-ui .hf { transform: none !important; filter: none !important; } .d-hud-cinematic-ui .h-hint { transform: translateX(-50%) !important; } }',
      '@container (max-width: 560px) { .d-hud-cinematic-ui .h-spec, .d-hud-cinematic-ui .h-prov, .d-hud-cinematic-ui .h-hint { display: none; } .d-hud-cinematic-ui .h-tele { right: auto; left: 7%; bottom: 15%; text-align: left; } .d-hud-cinematic-ui .h-rec { top: auto; right: auto; left: 7%; bottom: calc(15% - 30px); } .d-hud-cinematic-ui .h-title { top: 11%; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      stage.innerHTML =
        '<canvas role="img" aria-label="A slowly turning point-cloud object seen through a camera viewfinder"></canvas><div class="hv"></div>' +
        '<div class="hf" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
        '<div class="hud">' +
        '<div class="h-title"><p class="label h-eye">[ Nº 01 / 24 ]</p><p class="h-name">MERIDIAN</p><p class="label h-sub">A study in one object</p></div>' +
        '<p class="label h-rec"><span class="h-dot" aria-hidden="true"></span><span>Rec</span><span class="h-tc">00:00:00:00</span><span><b>01</b> / 06</span></p>' +
        '<div class="h-spec label"><p><span>Output</span><span>640 kW</span></p><p><span>Mass</span><span>1,180 kg</span></p><p><span>Top speed</span><span>350 km/h</span></p><p><span>Edition</span><span>24 built</span></p></div>' +
        '<dl class="h-prov label"><dt>Location</dt><dd>Bay 07, lower level</dd><dt>Designed and built by</dt><dd>Molin Design</dd></dl>' +
        '<p class="h-hint label" aria-hidden="true"><span class="h-tick"><i></i></span>Scroll</p>' +
        '<div class="h-tele"><p class="label">Camera</p><p class="mono" aria-live="off"><span class="t-mm">35</span> mm · f/<span class="t-f">2.8</span> · Focus <span class="t-fo">4.2</span> m</p></div>' +
        '</div>';

      var cv = stage.querySelector('canvas'), g = cv.getContext('2d');
      var tMM = stage.querySelector('.t-mm'), tF = stage.querySelector('.t-f'), tFo = stage.querySelector('.t-fo'), tTC = stage.querySelector('.h-tc');
      var R = ctx.reduced, dims = { w: 1, h: 1, dpr: 1 };
      // fibonacci point sphere + a tilted ring of points
      var pts = [], N = 900, i;
      for (i = 0; i < N; i++) {
        var y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963;
        pts.push([Math.cos(th) * rr, y * .92, Math.sin(th) * rr, 0]);
      }
      for (i = 0; i < 260; i++) { var a = i / 260 * Math.PI * 2; pts.push([Math.cos(a) * 1.45, 0, Math.sin(a) * 1.45, 1]); }

      var cam = { mm: 35, goal: 35, rot: .6, f: 2.8, fIdx: 2, fT: 0, time: 0 };
      function layout() { dims = ctx.fitCanvas(cv, stage, 2); }

      function draw() {
        var W = dims.w, H = dims.h, d = dims.dpr;
        g.setTransform(d, 0, 0, d, 0, 0);
        var bg = g.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#040404'); bg.addColorStop(.62, '#0b0805'); bg.addColorStop(1, '#020202');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        var hy = H * .66;
        var glow = g.createRadialGradient(W * .5, hy, 0, W * .5, hy, W * .55);
        glow.addColorStop(0, 'rgba(249,115,22,.22)'); glow.addColorStop(1, 'rgba(249,115,22,0)');
        g.fillStyle = glow; g.fillRect(0, 0, W, H);
        // floor grid in perspective
        g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
        g.beginPath();
        for (i = -12; i <= 12; i++) { g.moveTo(W * .5 + i * 14, hy); g.lineTo(W * .5 + i * W * .16, H); }
        for (i = 1; i < 9; i++) { var yy = hy + (H - hy) * Math.pow(i / 8, 2.2); g.moveTo(0, yy); g.lineTo(W, yy); }
        g.stroke();
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, hy, W, 1);
        // object
        var zoom = Math.pow(cam.mm / 35, .6), Rr = Math.min(W, H) * (W < 560 ? .14 : .17) * zoom, cx = W * .5, cy = H * .53;
        var cr = Math.cos(cam.rot), sr = Math.sin(cam.rot), tilt = .38, ct = Math.cos(tilt), st = Math.sin(tilt);
        var sharp = ctx.clamp(1 - Math.abs(cam.mm - cam.goal) / 12, 0, 1);
        for (i = 0; i < pts.length; i++) {
          var p = pts[i], x = p[0] * cr - p[2] * sr, z = p[0] * sr + p[2] * cr, yv = p[1];
          var y2 = yv * ct - z * st, z2 = yv * st + z * ct;
          var persp = 3.2 / (3.2 - z2 * .8);
          var sx = cx + x * Rr * persp, sy = cy + y2 * Rr * persp;
          var depth = (z2 + 1.6) / 3.2;
          var s = (p[3] ? 1.1 : 1.5) * persp * (.6 + .4 * sharp);
          g.fillStyle = p[3] ? 'rgba(249,115,22,' + (.25 + .6 * depth).toFixed(3) + ')' : 'rgba(255,255,255,' + (.08 + .72 * depth * depth).toFixed(3) + ')';
          g.fillRect(sx - s / 2, sy - s / 2, s, s);
        }
        // AF brackets that tighten when focus locks
        var b = Rr * (1.25 - .15 * sharp), L = 12;
        g.strokeStyle = sharp > .96 ? 'rgba(249,115,22,.9)' : 'rgba(255,255,255,.45)';
        g.beginPath();
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
          var px = cx + c[0] * b, py = cy + c[1] * b;
          g.moveTo(px, py + -c[1] * L); g.lineTo(px, py); g.lineTo(px + -c[0] * L, py);
        });
        g.stroke();
      }
      function readouts() {
        tMM.textContent = Math.round(cam.mm);
        tF.textContent = cam.f.toFixed(1).replace('.0', '');
        tFo.textContent = (4.2 * 35 / cam.mm + .9).toFixed(1);
        var fr = Math.floor(cam.time * 24), s = Math.floor(fr / 24);
        tTC.textContent = '00:' + String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') + ':' + String(fr % 24).padStart(2, '0');
      }

      var lp = ctx.loop(function (dt) {
        cam.time += dt;
        if (!R) cam.rot += dt * .22;
        cam.mm = R ? cam.goal : ctx.damp(cam.mm, cam.goal, 3, dt);
        cam.fT += dt;
        if (cam.fT > 4.5) { cam.fT = 0; cam.fIdx = (cam.fIdx + (Math.random() < .5 ? 1 : FSTOPS.length - 1)) % FSTOPS.length; }
        cam.f = R ? FSTOPS[cam.fIdx] : ctx.damp(cam.f, FSTOPS[cam.fIdx], 6, dt);
        draw(); readouts();
      });
      var ro = new ResizeObserver(function () { layout(); draw(); });
      layout(); draw(); readouts();

      return {
        start: function () {
          ro.observe(stage); stage.classList.remove('paused');
          requestAnimationFrame(function () { stage.classList.add('on'); });
          lp.start();
        },
        stop: function () { lp.stop(); ro.disconnect(); stage.classList.add('paused'); },
        scroll: function (p) { cam.goal = 24 + 46 * ctx.clamp((p - .2) / .6, 0, 1); },
        replay: function () {
          stage.classList.remove('on'); cam.time = 0;
          setTimeout(function () { stage.classList.add('on'); }, 60);
        }
      };
    }
  });
})();
