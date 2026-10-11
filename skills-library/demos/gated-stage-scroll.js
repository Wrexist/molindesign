/* gated-stage-scroll — virtual stage scroll with gates, hold-to-unlock, countdown ruler, XP, parallax rig and a finale reward. */
(function () {
  'use strict';
  var ID = 'gated-stage-scroll';
  var css = `
& { container-type: inline-size; user-select: none; -webkit-user-select: none; }
& .cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
& .ttl { position: absolute; left: 28px; bottom: 96px; max-width: 60%; pointer-events: none; transition: opacity .6s; }
& .ttl .label { margin: 0 0 10px; color: rgb(255 255 255 / .5); }
& .ttl h4 { margin: 0; overflow: hidden; font-stretch: 125%; font-weight: 400; font-size: clamp(26px, 5cqi, 52px); line-height: 1.05; letter-spacing: -.03em; color: #fff; }
& .ttl h4 span { display: block; }
& .ttl p.cp { margin: 10px 0 0; font-size: 14px; color: rgb(255 255 255 / .65); transition: opacity .6s, transform .6s cubic-bezier(.23,1,.32,1); }
& .xp { position: absolute; right: 20px; top: 20px; display: flex; align-items: center; gap: 8px; padding: 11px 16px; border-radius: 999px; border: 1px solid #ffffff1a; background: #0006; backdrop-filter: saturate(120%) blur(14px); -webkit-backdrop-filter: saturate(120%) blur(14px); color: #fff; }
& .xp .coin { width: 16px; height: 16px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fdba74, #f97316 60%, #c2410c); box-shadow: inset 0 0 0 2px rgb(0 0 0 / .25); }
& .xp .u { opacity: .6; }
& .xp.rip { animation: gss-rip 1.8s ease-out; }
@keyframes gss-rip { 0% { } 12% { border-color: rgb(249 115 22 / .9); box-shadow: 0 0 14px rgb(249 115 22 / .7), 0 0 30px rgb(249 115 22 / .3); background: rgb(255 255 255 / .95); color: #000; } 100% { } }
& .skip { position: absolute; left: 20px; top: 20px; padding: 10px 0; color: rgb(255 255 255 / .55); }
& .skip:hover { color: #fff; }
& .ruler { position: absolute; left: 0; right: 0; bottom: 0; height: 74px; overflow: hidden; background: linear-gradient(to top, rgb(0 0 0 / .85), transparent); }
& .strip { position: absolute; left: 50%; bottom: 18px; height: 40px; will-change: transform; }
& .strip i { position: absolute; bottom: 0; width: 1px; height: 8px; background: rgb(255 255 255 / .35); transform-origin: bottom; }
& .strip i.mj { height: 14px; background: rgb(255 255 255 / .7); }
& .strip button { position: absolute; bottom: 18px; transform: translateX(-50%); padding: 4px 6px; color: rgb(255 255 255 / .45); white-space: nowrap; }
& .strip button:not(:disabled):hover { color: #fff; }
& .strip button:disabled { cursor: default; opacity: .5; }
& .strip button.cur { color: #f97316; }
& .ind { position: absolute; left: 50%; bottom: 12px; width: 1px; height: 30px; background: #f97316; box-shadow: 0 0 8px rgb(249 115 22 / .8); }
& .cnt { position: absolute; right: 20px; bottom: 30px; color: #fff; }
& .hold { position: absolute; left: 50%; bottom: 100px; width: 92px; height: 92px; margin-left: -46px; border-radius: 50%; display: grid; place-items: center; text-align: center; color: #fff; background: rgb(0 0 0 / .45); backdrop-filter: blur(8px); opacity: 0; transform: scale(.85); pointer-events: none; transition: opacity .4s, transform .5s cubic-bezier(.23,1,.32,1); touch-action: none; }
& .hold.on { opacity: 1; transform: none; pointer-events: auto; }
& .hold svg { position: absolute; inset: 0; transform: rotate(-90deg); }
& .hold circle { fill: none; stroke-width: 2; }
& .hold .bg { stroke: rgb(255 255 255 / .2); } & .hold .fg { stroke: #f97316; stroke-linecap: round; }
& .pad { position: absolute; right: 0; top: 70px; bottom: 80px; width: 52px; touch-action: none; display: grid; place-items: center; border-left: 1px solid rgb(255 255 255 / .1); color: rgb(255 255 255 / .5); writing-mode: vertical-rl; }
& .fin { position: absolute; inset: 0; display: grid; place-items: center; align-content: center; gap: 10px; text-align: center; opacity: 0; pointer-events: none; transition: opacity .8s; }
& .fin.on { opacity: 1; pointer-events: auto; }
& .fin svg { width: min(36cqi, 200px); height: auto; overflow: visible; }
& .fin polygon { fill: rgb(255 255 255 / .92); stroke: #f97316; stroke-width: 1.5; stroke-linejoin: round; }
& .fin h4 { margin: 8px 0 0; font-stretch: 125%; font-weight: 400; font-size: clamp(22px, 4cqi, 36px); letter-spacing: -.02em; color: #fff; }
& .fin p { margin: 0; color: rgb(255 255 255 / .55); }
& .tip { position: absolute; left: 50%; top: 24px; transform: translateX(-50%); margin: 0; color: rgb(255 255 255 / .55); white-space: nowrap; pointer-events: none; }
& .tip .b { display: none; color: #f97316; } &:focus-within .tip .a { display: none; } &:focus-within .tip .b { display: inline; }
@container (max-width: 560px) { & .tip { top: 66px; } & .ttl { max-width: 78%; left: 20px; bottom: 90px; } & .hold { bottom: 190px; } & .cnt { display: none; } }
`.replace(/&/g, '.d-' + ID);

  // stage table (source lengths in vh; this demo plays them at 40%)
  var STAGES = [
    { id: 'gate0', gate: true, dur: 1.4 },
    { id: 'stage1', name: 'Orbit', vh: 175, hold: { showAt: .95, hideAt: .9, dur: 3 }, copy: 'Hold-locks wait for a gesture.' },
    { id: 'gate1', gate: true, dur: 1.1 },
    { id: 'stage2', name: 'Drift', vh: 250, advanceAtEnd: true, copy: 'This one advances at 99%.' },
    { id: 'stage3', name: 'Signal', vh: 325, hold: { showAt: .95, hideAt: .9, dur: 1.5 }, copy: 'A shorter hold: 1.5 s.' },
    { id: 'stage4', name: 'Descent', vh: 368, advanceAtEnd: true, copy: 'Last stretch. 25 BZ to go.' },
    { id: 'stage5', name: 'Arrival', finale: true }
  ];
  var PLAY = STAGES.filter(function (s) { return !s.gate; });
  var BZ = [-100, -75, -50, -25, 0];

  Lib.register(ID, {
    hint: 'Click the stage, then wheel, drag or press ↓ — hold the ring to unlock',
    notes: [
      'Smoothing <code>k = 1 − e<sup>−s·dt</sup></code>, <code>s = −ln(1 − .075)·60</code>; wheel clamped to ±500 per event; snap under .5',
      'Hold button shows at <code>progress &gt; .95</code>, hides at <code>≤ .9</code> (hysteresis); holds of 3 s and 1.5 s',
      'Gates auto-scroll with smoothstep <code>n·n·(3 − 2n)</code> while input is held',
      'XP is +100 per stage, deduped with a <code>Set</code>, counted up over 2 s power2.out with a 1.8 s glow ripple',
      'Ruler ticks every 12 px, majors <code>−100 BZ … 0 BZ</code>; parallax rig max offset .18, smoothing .12 s'
    ],
    simplified: 'Canvas 2D worlds replace the WebGL stages, stage lengths run at 40%, gate times are shorter, there is no gyro, and an SVG polygon morph stands in for the folding GLB.',
    css: css,
    mount: function (stage, ctx) {
      var clamp = ctx.clamp, lerp = ctx.lerp, reduced = ctx.reduced, coarse = !ctx.fine;
      var R = 'http://www.w3.org/2000/svg';
      var ticks = '', btns = '';
      for (var b = -112; b <= 12; b += 2) ticks += '<i class="' + (b % 25 === 0 ? 'mj' : '') + '" style="left:' + (b * 6) + 'px"></i>';
      BZ.forEach(function (z, i) { btns += '<button type="button" data-i="' + i + '" style="left:' + (z * 6) + 'px" aria-label="Go to stage ' + z + ' BZ" class="label">' + (z < 0 ? '−' + (-z) : z) + ' BZ</button>'; });
      stage.setAttribute('tabindex', '0');
      stage.innerHTML = '<canvas class="cv" aria-hidden="true"></canvas>' +
        '<div class="ttl"><p class="label sl"></p><h4><span></span></h4><p class="cp"></p></div>' +
        '<button type="button" class="skip label">Skip ↷</button><p class="tip label" aria-hidden="true"><span class="a">' + (coarse ? 'Tap, then drag the strip ↕' : 'Click to play · wheel, drag, ↓') + '</span><span class="b">Playing · Esc releases scroll</span></p>' +
        '<div class="xp" aria-label="0 XP"><i class="coin"></i><span class="label xn">0</span><span class="label u">XP</span></div>' +
        '<div class="ruler"><div class="strip" aria-hidden="false">' + ticks + btns + '</div><i class="ind"></i><span class="cnt label">−100 BZ</span></div>' +
        '<button type="button" class="hold label" aria-label="Hold to unlock the next stage (or hold Space)"><svg viewBox="0 0 92 92"><circle class="bg" cx="46" cy="46" r="44"/><circle class="fg" cx="46" cy="46" r="44" stroke-dasharray="276.5" stroke-dashoffset="276.5"/></svg><span>Hold to<br>unlock</span></button>' +
        (coarse ? '<div class="pad label" aria-hidden="true">Drag ↕</div>' : '') +
        '<div class="fin" aria-hidden="true"><svg viewBox="-60 -60 120 120"><polygon points=""/></svg><h4>Certificate of arrival</h4><p class="label">0 BZ · all stages cleared</p></div>' +
        '<p class="live" aria-live="polite" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"></p>';
      var q = function (s) { return stage.querySelector(s); };
      var cv = q('.cv'), g = cv.getContext('2d'), sl = q('.sl'), h4s = q('.ttl h4'), cp = q('.cp'), xp = q('.xp'), xn = q('.xn');
      var strip = q('.strip'), tickEls = strip.querySelectorAll('i'), rbtns = strip.querySelectorAll('button'), cnt = q('.cnt');
      var hold = q('.hold'), ring = q('.hold .fg'), fin = q('.fin'), poly = q('.fin polygon'), live = q('.live');

      var SMOOTH = -Math.log(1 - .075) * 60;
      var si = 0, pos = 0, target = 0, len = 1, held = false, auto = null, holdP = 0, holding = false, size = null, time = 0;
      var awarded = new Set(), xpVal = 0, xpFrom = 0, xpTo = 0, xpT = 1, reached = 0, finT = 0, sparks = [];
      var rig = { x: 0, y: 0, tx: 0, ty: 0 }, stars = [];
      for (var s = 0; s < 170; s++) stars.push([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random()]);
      var ss = function (n) { return n * n * (3 - 2 * n); };
      // origami fallback: 7-point silhouettes morphed .75 s each (sine.inOut)
      var SHAPES = [
        [[-50, -34], [50, -34], [50, -34], [50, 34], [-50, 34], [-50, 34], [-50, -34]],
        [[-40, -40], [40, -40], [0, 0], [40, 40], [-40, 40], [0, 0], [-40, -40]],
        [[-46, -10], [0, -40], [46, -10], [20, 6], [0, 40], [-20, 6], [-46, -10]],
        [[-44, -44], [-14, -12], [14, -12], [44, -44], [30, 10], [0, 44], [-30, 10]]
      ];
      function stageLen(st) { return st.gate ? 1 : st.vh / 100 * (size ? size.h : 400) * .4; }
      function bzAt() {
        var k = PLAY.indexOf(STAGES[si]);
        if (k < 0) k = PLAY.indexOf(STAGES[si + 1]) - 1 + (auto ? ss(auto.t) : 0);
        else k += STAGES[si].finale ? 0 : (pos / len);
        return clamp(-100 + 25 * k, -100, 0);
      }
      function say(t) { live.textContent = t; }
      function setStage(i) {
        si = i; var st = STAGES[i];
        pos = target = 0; len = stageLen(st); holdP = 0; holding = false; held = false; auto = null;
        hold.classList.remove('on');
        if (st.gate) {
          if (reduced) { setStage(i + 1); return; }
          held = true; auto = { t: 0, dur: st.dur };
          sl.textContent = 'Gate'; cp.style.opacity = 0; h4s.parentNode.style.opacity = .25;
          return;
        }
        var k = PLAY.indexOf(st);
        reached = Math.max(reached, k);
        sl.innerHTML = 'Stage <span class="accent">0' + (k + 1) + '</span> / 0' + PLAY.length + ' · ' + BZ[k] + ' BZ';
        var nu = document.createElement('span'); nu.textContent = st.name;
        h4s.innerHTML = ''; h4s.appendChild(nu);
        if (!reduced) nu.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 1100, easing: 'cubic-bezier(.23,1,.32,1)' });
        cp.textContent = st.copy || ''; cp.style.opacity = 0;
        say('Stage ' + (k + 1) + ': ' + st.name + ', ' + BZ[k] + ' BZ');
        rbtns.forEach(function (bt, j) { bt.disabled = j > reached; bt.classList.toggle('cur', j === k); });
        award(st.id);
        if (st.finale) { fin.classList.add('on'); finT = 0; sparks = []; h4s.parentNode.style.opacity = 0; }
        else { fin.classList.remove('on'); h4s.parentNode.style.opacity = 1; }
      }
      function award(id) {
        if (awarded.has(id)) return;
        awarded.add(id);
        xpFrom = xpVal; xpTo = awarded.size * 100; xpT = reduced ? 1 : 0;
        xp.classList.remove('rip'); void xp.offsetWidth; if (!reduced) xp.classList.add('rip');
        xp.setAttribute('aria-label', xpTo + ' XP');
      }
      function next() { if (si < STAGES.length - 1) setStage(si + 1); }
      function input(d) { if (held || STAGES[si].gate) return; target = clamp(target + d, 0, len); }

      function drawWorld(W, H, st, p) {
        var cx = W / 2 + rig.x * W * .18 * .6, cy = H * .44 + rig.y * H * .18 * .6, m = Math.min(W, H);
        var warp = auto ? Math.sin(Math.PI * auto.t) : 0;
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        for (var i = 0; i < stars.length; i++) {
          var sr = stars[i], z = ((sr[2] - time * .02 - (auto ? ss(auto.t) * .6 : 0)) % 1 + 1) % 1, k = 1 / (z * 2 + .15);
          var x = W / 2 + sr[0] * W * .5 * k * .3 + rig.x * W * .18 * .2, y = H / 2 + sr[1] * H * .5 * k * .3 + rig.y * H * .18 * .2;
          g.strokeStyle = 'rgba(255,255,255,' + (.15 + .5 * (1 - z)) + ')'; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + sr[0] * warp * 40 * k, y + sr[1] * warp * 40 * k + .01); g.stroke();
        }
        if (st.gate || st.finale) return;
        var kind = PLAY.indexOf(st), r = m * lerp(.1, .22, ss(p)) * (1 + .08 * holdP);
        g.lineWidth = 1;
        var glowR = r * 2.2, grd = g.createRadialGradient(cx, cy, r * .3, cx, cy, glowR);
        grd.addColorStop(0, 'rgba(249,115,22,.22)'); grd.addColorStop(1, 'rgba(249,115,22,0)');
        g.fillStyle = grd; g.beginPath(); g.arc(cx, cy, glowR, 0, 6.283); g.fill();
        g.fillStyle = '#050505'; g.strokeStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.fill(); g.stroke();
        g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.clip();
        for (var j = 0; j < 9; j++) {
          var a = j / 9 * Math.PI + time * .2 + p * 2;
          g.strokeStyle = 'rgba(255,255,255,' + (kind === 3 ? .35 : .14) + ')';
          g.beginPath();
          if (kind === 3) { var yy = cy - r + (j + (time * .3 + p * 3) % 1) * r * 2 / 9; g.moveTo(cx - r, yy); g.lineTo(cx + r, yy); }
          else g.ellipse(cx, cy, Math.abs(Math.cos(a)) * r, r, 0, 0, 6.283);
          g.stroke();
        }
        g.restore();
        g.strokeStyle = 'rgba(249,115,22,.85)';
        if (kind === 0) for (var o = 1; o <= 3; o++) { g.beginPath(); g.ellipse(cx, cy, r * (1.3 + o * .32), r * (.28 + o * .07), -.3, time * .3 * o, time * .3 * o + 4.6); g.stroke(); }
        if (kind === 1) for (var d = 0; d < 60; d++) { var an = d * 2.4 + time * .15, rr = r * (1.3 + (d % 7) * .12); g.fillStyle = 'rgba(255,255,255,' + (.3 + (d % 3) * .2) + ')'; g.fillRect(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * .5, 1.6, 1.6); }
        if (kind === 2) for (var w = 0; w < 4; w++) { var f = (time * .35 + w / 4) % 1; g.strokeStyle = 'rgba(249,115,22,' + (1 - f) * .7 + ')'; g.beginPath(); g.arc(cx, cy, r * (1 + f * 1.6), 0, 6.283); g.stroke(); }
        if (holdP > 0) {   // hold ripple: intensity .4 + .6p, half-width .75 − .55p
          var inten = .4 + .6 * holdP, hw = .75 - .55 * holdP;
          for (var rp = 0; rp < 3; rp++) { var ff = (time * 1.4 + rp / 3) % 1; g.strokeStyle = 'rgba(255,255,255,' + (inten * (1 - ff) * .6) + ')'; g.lineWidth = 1 + hw * 3; g.beginPath(); g.arc(cx, cy, r * (1.05 + ff * 1.4), 0, 6.283); g.stroke(); }
        }
      }
      function drawFinale(dt, W, H) {
        finT += dt;
        var seg = reduced ? SHAPES.length - 1 : Math.min(SHAPES.length - 1, finT / .75), i0 = Math.floor(seg), f = seg - i0;
        var e = -(Math.cos(Math.PI * f) - 1) / 2, A = SHAPES[i0], B = SHAPES[Math.min(i0 + 1, SHAPES.length - 1)];
        poly.setAttribute('points', A.map(function (pt, i) { return lerp(pt[0], B[i][0], e).toFixed(1) + ',' + lerp(pt[1], B[i][1], e).toFixed(1); }).join(' '));
        if (!reduced && finT > 2.25 && !sparks.length) for (var k = 0; k < 90; k++) sparks.push([Math.random() * 6.283, .3 + Math.random() * .7]);
        var st = clamp((finT - 2.25) / 1.4, 0, 1), eo = 1 - Math.pow(1 - st, 3);
        if (st < 1) sparks.forEach(function (sp) {
          var d = eo * sp[1] * Math.min(W, H) * .42;
          g.fillStyle = 'rgba(249,115,22,' + (1 - st) + ')';
          g.fillRect(W / 2 + Math.cos(sp[0]) * d, H * .42 + Math.sin(sp[0]) * d - st * st * .5 * 80, 2, 2);
        });
      }
      var lp = ctx.loop(function (dt) {
        if (!size) { size = ctx.fitCanvas(cv, stage, 2); len = stageLen(STAGES[si]); }
        time += reduced ? 0 : dt;
        var st = STAGES[si];
        if (auto) {
          auto.t = Math.min(1, auto.t + dt / auto.dur);
          pos = ss(auto.t) * len;
          if (auto.t >= 1) { auto = null; next(); st = STAGES[si]; }
        } else {
          pos = reduced ? target : lerp(pos, target, 1 - Math.exp(-SMOOTH * dt));
          if (Math.abs(target - pos) < .5) pos = target;
        }
        var p = st.gate ? 0 : pos / len;
        if (!st.gate && !st.finale) {
          cp.style.opacity = clamp((p - .08) / .15, 0, 1);
          if (st.advanceAtEnd && p >= .99) { next(); st = STAGES[si]; p = 0; }
          else if (st.hold) {
            if (p > st.hold.showAt) hold.classList.add('on');
            else if (p <= st.hold.hideAt && !holding) hold.classList.remove('on');
            if (holding) holdP = Math.min(1, holdP + dt / st.hold.dur);
            else holdP = Math.max(0, holdP - dt * 2);
            held = holding;
            ring.setAttribute('stroke-dashoffset', (276.5 * (1 - holdP)).toFixed(1));
            if (holdP >= 1) { holding = false; next(); st = STAGES[si]; }
          }
        }
        if (xpT < 1) { xpT = Math.min(1, xpT + dt / 2); }
        var nx = Math.round(lerp(xpFrom, xpTo, 1 - Math.pow(1 - xpT, 3)));
        if (nx !== xpVal) { xpVal = nx; xn.textContent = nx; }
        var on = !st.gate && ctx.fine && !reduced;
        rig.x = ctx.damp(rig.x, on ? rig.tx : 0, 1 / .12, dt); rig.y = ctx.damp(rig.y, on ? rig.ty : 0, 1 / .12, dt);
        var bz = bzAt();
        strip.style.transform = 'translate3d(' + (-bz * 6).toFixed(1) + 'px,0,0)';
        var txt = '−' + Math.abs(Math.round(bz)) + ' BZ'; if (Math.round(bz) === 0) txt = '0 BZ';
        if (cnt.textContent !== txt) cnt.textContent = txt;
        for (var t = 0; t < tickEls.length; t++) {
          var dx = Math.abs((-112 + t * 2 - bz) * 6), inf = clamp(1 - dx / 36, 0, 1);
          tickEls[t].style.transform = 'scaleY(' + (1 + inf * 1.4).toFixed(2) + ')';
        }
        var W = size.w, H = size.h;
        g.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
        drawWorld(W, H, st, p);
        if (st.finale) drawFinale(dt, W, H);
      });
      // input: wheel only once the stage is engaged (focused), mouse drag anywhere, touch on the pad, keys
      stage.addEventListener('wheel', function (e) {
        if (document.activeElement !== stage && !stage.contains(document.activeElement)) return;
        if (STAGES[si].finale) return;
        e.preventDefault(); input(clamp(e.deltaY, -500, 500) * .6);
      }, { passive: false });
      var drag = null;
      stage.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button')) return;
        stage.focus({ preventScroll: true });
        if (e.pointerType === 'mouse' || e.target.classList.contains('pad')) { drag = e.clientY; stage.setPointerCapture(e.pointerId); }
      });
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        rig.tx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); rig.ty = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1);
        if (drag != null) { input((drag - e.clientY) * 1.6); drag = e.clientY; }
      });
      ['pointerup', 'pointercancel'].forEach(function (t) { stage.addEventListener(t, function () { drag = null; }); });
      function holdStart(e) { if (STAGES[si].hold && hold.classList.contains('on')) { holding = true; if (e && e.pointerId != null) hold.setPointerCapture(e.pointerId); } }
      function holdEnd() { holding = false; }
      hold.addEventListener('pointerdown', holdStart);
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { hold.addEventListener(t, holdEnd); });
      hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      stage.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { stage.blur(); return; }
        if (e.target !== stage && e.target !== hold) return;
        if ((e.key === ' ' || e.key === 'Enter') && hold.classList.contains('on')) { e.preventDefault(); if (!e.repeat) holdStart(); return; }
        var h = size ? size.h : 400;
        var d = { ArrowDown: h * .5, ArrowUp: -h * .5, PageDown: h * .5, PageUp: -h * .5, ' ': h * .5 }[e.key];
        if (d != null) { e.preventDefault(); input(d); }
        if (e.key === 'End') { e.preventDefault(); input(1e9); }
        if (e.key === 'Home') { e.preventDefault(); input(-1e9); }
      });
      stage.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') holdEnd(); });
      rbtns.forEach(function (bt) { bt.addEventListener('click', function () { setStage(STAGES.indexOf(PLAY[+bt.dataset.i])); }); });
      q('.skip').addEventListener('click', function () { PLAY.forEach(function (s2) { awarded.add(s2.id); }); xpFrom = xpVal; xpTo = awarded.size * 100; xpT = reduced ? 1 : 0; setStage(STAGES.length - 1); });
      function reset() {
        awarded.clear(); xpVal = xpFrom = xpTo = 0; xpT = 1; xn.textContent = '0'; reached = 0; fin.classList.remove('on');
        setStage(0);
      }
      var ro = new ResizeObserver(function () { size = null; });
      reset();
      return {
        start: function () { ro.observe(stage); lp.start(); },
        stop: function () { lp.stop(); ro.disconnect(); holding = false; drag = null; },
        replay: reset
      };
    }
  });
})();
