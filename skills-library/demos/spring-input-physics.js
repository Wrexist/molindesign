/* spring-input-physics: second-order dynamics (f, zeta, r) follower with live params + velocity-push props that damp home. */
(function () {
  var ID = 'spring-input-physics';
  var ACC = '#f97316';
  function SOD(x0, f, z, r) { this.set(f, z, r); this.y = x0; this.v = 0; this.xp = x0; }
  SOD.prototype.set = function (f, z, r) {
    this.w = 2 * Math.PI * f; this.z = z; this.d = this.w * Math.sqrt(Math.abs(z * z - 1));
    this.k1 = z / (Math.PI * f); this.k2 = 1 / (this.w * this.w); this.k3 = r * z / this.w;
  };
  SOD.prototype.update = function (dt, x) {          // robust variant: pole-matched when w·dt ≥ zeta
    if (dt <= 0) return this.y;
    var xv = (x - this.xp) / dt, k1, k2; this.xp = x;
    if (this.w * dt < this.z) { k1 = this.k1; k2 = Math.max(this.k2, dt * dt / 2 + dt * k1 / 2, dt * k1); }
    else {
      var t1 = Math.exp(-this.z * this.w * dt), alpha = 2 * t1 * (this.z <= 1 ? Math.cos(dt * this.d) : Math.cosh(dt * this.d));
      var beta = t1 * t1, t2 = dt / (1 + beta - alpha); k1 = (1 - beta) * t2; k2 = dt * t2;
    }
    this.y += this.v * dt;
    this.v += dt * (x + this.k3 * xv - this.y - k1 * this.v) / k2;
    return this.y;
  };
  var PRESETS = [['Mouse', 1.35, 0.5, 1.25], ['Drag', 2, 1, 1], ['Gobo', 1, 0.3, 2], ['Finger', 1.5, 0.5, 3]];
  var PROPS = [
    { x: 0.32, y: 0.56, w: 86, h: 150, r: -0.14, t: 'Nº 01' },
    { x: 0.5, y: 0.5, w: 108, h: 176, r: 0.05, t: 'Nº 02' },
    { x: 0.68, y: 0.57, w: 78, h: 132, r: 0.18, t: 'Nº 03' }
  ];
  var hash = function (i) { var s = Math.sin(i * 91.7) * 43758.5; return s - Math.floor(s); };

  Lib.register(ID, {
    hint: 'Swipe across the cards; tune f, zeta and r',
    notes: [
      '<code>k1 = ζ/(πf)</code>, <code>k2 = 1/(2πf)²</code>, <code>k3 = r·ζ/(2πf)</code>; ζ .5 playful, .8 subtle, 1 critically damped, r > 1 anticipates',
      'Source presets (f, ζ, r): mouse <code>1.35, .5, 1.25</code> · drag-scroll <code>2, 1, 1</code> · gobo <code>1, .3, 2</code> · finger joints <code>1.5, .5, 3</code>',
      'Props: only the perpendicular part of finger velocity pushes; strength <code>fit(dist, 0, R, 1, 0)·|perp|</code>, R = width × .25',
      'Push peaks mid-prop, torque peaks at the ends; <code>damp = exp(−dt·2)</code> on velocity and displacement, so props return home with no spring',
      'Clamp |disp| ≤ width × .5 and rotation ±.1π; real dt ≤ 50 ms; reduced motion = rest pose'
    ],
    simplified: 'Canvas 2D cards instead of a 3D desk; translation and rotation forces are scaled up for pixel units, and there is no camera look-at, wiggle bones or gyro.',
    css: [
      '.d-' + ID + ' canvas { position: absolute; inset: 0; }',
      '.d-' + ID + ' .lab { position: absolute; left: 20px; top: 18px; color: rgb(255 255 255 / .5); pointer-events: none; }',
      '.d-' + ID + ' .lab b { color: ' + ACC + '; font-weight: 500; }',
      '.d-' + ID + ' .ctl { position: absolute; right: 16px; bottom: 16px; width: 236px; padding: 12px 14px; border-radius: 10px; background: rgb(0 0 0 / .55); border: 1px solid rgb(255 255 255 / .1); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: grid; gap: 6px; color: rgb(255 255 255 / .55); }',
      '.d-' + ID + ' .ctl label { display: grid; grid-template-columns: 34px 1fr 38px; align-items: center; gap: 8px; }',
      '.d-' + ID + ' .ctl output { color: #fff; text-align: right; }',
      '.d-' + ID + ' input[type=range] { width: 100%; accent-color: ' + ACC + '; height: 22px; touch-action: pan-x; }',
      '.d-' + ID + ' .pre { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }',
      '.d-' + ID + ' .pre button { padding: 5px 9px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .15); color: rgb(255 255 255 / .65); }',
      '.d-' + ID + ' .pre button:hover { color: #fff; border-color: rgb(255 255 255 / .45); }',
      '.d-' + ID + ' .pre button[aria-pressed="true"] { background: #fff; color: #000; border-color: #fff; }',
      '.d-' + ID + ' .k { color: rgb(255 255 255 / .56); font-size: 9.5px; letter-spacing: .12em; }',
      '.d-' + ID + ' .short { display: none; }',
      '@media (max-width: 640px) { .d-' + ID + ' .long { display: none; } .d-' + ID + ' .short { display: inline; } .d-' + ID + ' .ctl { left: 12px; right: 12px; bottom: 12px; width: auto; padding: 10px 12px; gap: 2px; } .d-' + ID + ' .k { display: none; } }'
    ].join('\n'),
    mount: function (stage, ctx) {
      var el = ctx.el, reduced = ctx.reduced;
      var cv = el('canvas'), g = cv.getContext('2d');
      var lab = el('div', 'lab label', '<span class="long">Second-order dynamics</span><span class="short">SOD</span> · <b>target</b> vs <b>follower</b>');
      var ctl = el('div', 'ctl label');
      var P = { f: 1.35, z: 0.5, r: 1.25 };
      ctl.innerHTML =
        '<label><span>f</span><input type="range" data-k="f" min="0.2" max="5" step="0.05" aria-label="Frequency f in hertz"><output></output></label>' +
        '<label><span>ζ</span><input type="range" data-k="z" min="0" max="1.5" step="0.01" aria-label="Damping zeta"><output></output></label>' +
        '<label><span>r</span><input type="range" data-k="r" min="-2" max="3" step="0.05" aria-label="Initial response r"><output></output></label>' +
        '<div class="pre" role="group" aria-label="Source presets"></div><span class="k"></span>';
      var pre = ctl.querySelector('.pre'), kEl = ctl.querySelector('.k'), inputs = ctl.querySelectorAll('input');
      PRESETS.forEach(function (p) {
        var b = el('button', '', p[0]); b.type = 'button';
        b.addEventListener('click', function () { P.f = p[1]; P.z = p[2]; P.r = p[3]; apply(); });
        pre.appendChild(b);
      });
      stage.appendChild(cv); stage.appendChild(lab); stage.appendChild(ctl);
      var sx = new SOD(0.5, P.f, P.z, P.r), sy = new SOD(0.5, P.f, P.z, P.r);
      function apply() {
        sx.set(P.f, Math.max(P.z, 0.001), P.r); sy.set(P.f, Math.max(P.z, 0.001), P.r);
        inputs.forEach(function (i) { i.value = P[i.dataset.k]; i.nextElementSibling.textContent = (+P[i.dataset.k]).toFixed(2); });
        pre.querySelectorAll('button').forEach(function (b, i) { var p = PRESETS[i]; b.setAttribute('aria-pressed', p[1] === P.f && p[2] === P.z && p[3] === P.r ? 'true' : 'false'); });
        kEl.textContent = 'k1 ' + sx.k1.toFixed(3) + ' · k2 ' + sx.k2.toFixed(4) + ' · k3 ' + sx.k3.toFixed(3);
      }
      inputs.forEach(function (i) { i.addEventListener('input', function () { P[i.dataset.k] = +i.value; apply(); }); });
      apply();

      var W = 1, H = 1, dpr = 1, S = 1, yk = 1, tx = 0.5, ty = 0.5, lastInput = -10, time = 0, wp = 0, wpT = 0;
      var fx = 0.5, fy = 0.5, pfx = 0.5, pfy = 0.5, hist = [];
      var props = PROPS.map(function (p, i) { return { p: p, dx: 0, dy: 0, vx: 0, vy: 0, rot: 0, av: 0, intro: 0, delay: 0.5 + hash(i) * 0.3 }; });
      var WAY = [[0.12, 0.34], [0.86, 0.4], [0.2, 0.6], [0.8, 0.22]];
      function onMove(e) {
        if (e.pointerType === 'mouse' || e.pressure > 0) {
          var r = stage.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; lastInput = time;
        }
      }
      cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerdown', onMove);

      function rr(x, y, w, h, rad) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, rad); else g.rect(x, y, w, h); }
      var lp = ctx.loop(function (dt) {
        time += dt;
        // target: pointer, else idle step path (shows overshoot / anticipation on the graph)
        if (!reduced && time - lastInput > 2.5) {
          wpT += dt; if (wpT > 1.5) { wpT = 0; wp = (wp + 1) % WAY.length; }
          tx = WAY[wp][0]; ty = WAY[wp][1];
        }
        pfx = fx; pfy = fy;
        fx = sx.update(dt, tx); fy = sy.update(dt, ty);
        hist.push([tx, fx]); if (hist.length > 200) hist.shift();
        var mvx = (fx - pfx) * W / dt, mvy = (fy - pfy) * H / dt, mx = fx * W, my = fy * H;
        var damp = Math.exp(-dt * 2);
        props.forEach(function (o) {
          var p = o.p, w = p.w * S, h = p.h * S;
          o.intro = Math.min(1, o.intro + (time > o.delay || reduced ? dt / (reduced ? 0.2 : 1) : 0));
          if (reduced) return;
          var th = p.r + o.rot, ax = -Math.sin(th), ay = Math.cos(th);
          var cx = p.x * W + o.dx, cy = p.y * H * yk + o.dy, topx = cx - ax * h / 2, topy = cy - ay * h / 2;
          var t = ((mx - topx) * ax + (my - topy) * ay) / h, hh = Math.min(1, Math.max(0, t));
          var nx = topx + ax * h * hh, ny = topy + ay * h * hh, dist = Math.hypot(mx - nx, my - ny), R = w * 0.25;
          if (o.intro >= 1 && dist <= R) {
            var along = mvx * ax + mvy * ay, px = mvx - ax * along, py = mvy - ay * along, pm = Math.hypot(px, py);
            var strength = (1 - dist / R) * pm;
            if (strength > 0.001) {
              var dx = px / pm, dy = py / pm, mid = 1 - Math.abs(hh - 0.5) * 2;
              o.vx += dx * strength * mid * 8 * dt; o.vy += dy * strength * mid * 8 * dt;      // translationForce (px-scaled)
              o.av += (ax * dy - ay * dx) * (hh - 0.5) * strength * Math.abs(hh - 0.5) * 2 * 0.01 * 6 * dt;
            }
          }
          o.vx *= damp; o.vy *= damp; o.av *= damp;
          o.dx = (o.dx + o.vx * dt) * damp; o.dy = (o.dy + o.vy * dt) * damp;
          var m = Math.hypot(o.dx, o.dy), lim = w * 0.5; if (m > lim) { o.dx *= lim / m; o.dy *= lim / m; }
          o.rot = Math.max(-0.1 * Math.PI, Math.min(0.1 * Math.PI, (o.rot + o.av * dt) * damp));
        });

        // draw
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(255,255,255,.045)'; g.lineWidth = 1;
        for (var gx = 0; gx < W; gx += 40) { g.beginPath(); g.moveTo(gx + .5, 0); g.lineTo(gx + .5, H); g.stroke(); }
        for (var gy = 0; gy < H; gy += 40) { g.beginPath(); g.moveTo(0, gy + .5); g.lineTo(W, gy + .5); g.stroke(); }
        props.forEach(function (o, i) {
          var p = o.p, w = p.w * S, h = p.h * S, e = 1 - Math.pow(1 - o.intro, 3);   // cubicOut fly-in
          var ix = reduced ? 0 : (1 - e) * (i - 1) * W * 0.4, iy = reduced ? 0 : (1 - e) * H * 0.7, ir = reduced ? 0 : (1 - e) * (i - 1) * 0.8;
          var lift = Math.min(1, Math.hypot(o.dx, o.dy) / (w * 0.5) + Math.abs(o.rot) * 3);
          g.save(); g.globalAlpha = reduced ? e : 1;
          g.translate(p.x * W + o.dx + ix, p.y * H * yk + o.dy + iy); g.rotate(p.r + o.rot + ir);
          g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 14 + lift * 26; g.shadowOffsetX = 3 + lift * 14; g.shadowOffsetY = 3 + lift * 20;
          rr(-w / 2, -h / 2, w, h, 6); g.fillStyle = i === 1 ? '#151515' : '#0e0e0e'; g.fill();
          g.shadowColor = 'transparent';
          g.strokeStyle = 'rgba(255,255,255,' + (0.16 + lift * 0.4).toFixed(2) + ')'; g.lineWidth = 1; g.stroke();
          g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '500 ' + Math.round(9 * S + 2) + 'px ui-monospace, monospace'; g.fillText(p.t, -w / 2 + 10, -h / 2 + 18);
          g.fillStyle = i === 1 ? ACC : 'rgba(255,255,255,.25)'; g.fillRect(-w / 2 + 10, h / 2 - 16, w * 0.35, 2);
          g.restore();
        });
        // target ring + follower dot + tether
        g.strokeStyle = 'rgba(255,255,255,.25)'; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(tx * W, ty * H); g.lineTo(mx, my); g.stroke(); g.setLineDash([]);
        g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1; g.beginPath(); g.arc(tx * W, ty * H, 10, 0, 7); g.stroke();
        g.fillStyle = ACC; g.shadowColor = 'rgba(249,115,22,.8)'; g.shadowBlur = 14; g.beginPath(); g.arc(mx, my, 6, 0, 7); g.fill(); g.shadowBlur = 0; g.shadowColor = 'transparent';
        // x-response graph (last ~3 s)
        var gx0 = 20, gy0 = 44, gw = Math.min(220, W * 0.4), gh = 54;
        g.strokeStyle = 'rgba(255,255,255,.12)'; g.strokeRect(gx0 + .5, gy0 + .5, gw, gh);
        [[0, 'rgba(255,255,255,.55)'], [1, ACC]].forEach(function (s) {
          g.strokeStyle = s[1]; g.lineWidth = 1.3; g.beginPath();
          hist.forEach(function (v, i) { var X = gx0 + i / 199 * gw, Y = gy0 + gh - Math.max(-0.15, Math.min(1.15, v[s[0]])) / 1.3 * gh - gh * 0.115; i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
          g.stroke();
        });
      });
      function resize() { var f = ctx.fitCanvas(cv, stage, 2); W = f.w; H = f.h; dpr = f.dpr; S = Math.max(0.6, Math.min(1.25, Math.min(W / 860, H / 540))); yk = H > W ? 0.8 : 1; }
      var ro = new ResizeObserver(resize);
      resize();
      return {
        start: function () { ro.observe(stage); resize(); lp.start(); },
        stop: function () { ro.disconnect(); lp.stop(); },
        replay: function () { props.forEach(function (o) { o.intro = 0; o.dx = o.dy = o.vx = o.vy = o.rot = o.av = 0; }); time = 0; lastInput = -10; }
      };
    }
  });
})();
