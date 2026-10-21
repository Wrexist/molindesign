/* Halden LF-1 — "Held". A launch film written in code.
   Every frame is a pure function of t (seconds): no Date.now, no unseeded random, no state carried between
   frames. The same functions drive the live player (index.html) and the offline renderer (tools/render.mjs).
   Contract: window.DUR, window.render(t), window.READY, window.EV, window.TEXTS(t), window.SCORE(ctx). */
(function () {
  'use strict';
  var W = 1920, H = 1080, DUR = 34, BEAT = 0.5;
  var INK = '#0d0d0c', PAPER = '236,232,223', SIGNAL = '#ff4d1f';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function ss(k) { return k * k * (3 - 2 * k); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }          // expo out
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function eoc(k) { return 1 - Math.pow(1 - k, 3); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  /* closed-form spring step response (0 -> 1), a pure function of time since the step */
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f;
    if (z >= 1) return 1 - Math.exp(-w * dt) * (1 + w * dt);
    var wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  /* a value that changes target many times = sum of one spring per change */
  function springSteps(t, steps, f, z) {
    var v = steps[0][1];
    for (var i = 1; i < steps.length; i++) v += (steps[i][1] - steps[i - 1][1]) * spring(t - steps[i][0], f, z);
    return v;
  }
  function stepIndex(t, steps) { var k = 0; for (var i = 0; i < steps.length; i++) if (t >= steps[i][0]) k = i; return k; }

  /* ---------- the timeline: single source of truth ---------- */
  var SHOTS = [
    { id: 'hook', name: 'Hook', t0: 0, t1: 1 },
    { id: 'frozen', name: 'Frozen', t0: 1, t1: 6 },
    { id: 'streak', name: 'Let it run', t0: 6, t1: 10 },
    { id: 'breath', name: 'Breath', t0: 10, t1: 12 },
    { id: 'night', name: 'Night', t0: 12, t1: 18 },
    { id: 'long', name: 'Fifteen seconds', t0: 18, t1: 24 },
    { id: 'match', name: 'Match cut', t0: 24, t1: 26 },
    { id: 'lf1', name: 'Halden LF-1', t0: 26, t1: 34 }
  ];
  var SHUTTER = ['1/8000', '1/4000', '1/2000', '1/1000', '1/500', '1/250', '1/125', '1/60', '1/15'];
  var SHUTTER_S = [1 / 8000, 1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 15];
  var SHUT_T = [0, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5];
  var ISO = ['50', '100', '200', '400', '800', '1 600', '3 200', '6 400', '12 800'];
  var ISO_T = [0, 12.0, 12.5, 13.0, 13.5, 14.0, 14.5, 15.0, 15.5];
  var LONG0 = 18.5, LONG1 = 22.5;           // the 15 s exposure, compressed
  var IRIS = [                               // aperture transitions: [t0, t1, from, to, centre]
    { t0: 1.0, t1: 1.32, a: 0, b: 1, c: 'centre' },
    { t0: 10.0, t1: 10.62, a: 1, b: 0, c: 'centre' },
    { t0: 11.95, t1: 11.96, a: 0, b: 1, c: 'centre' },   // hidden: exposure is still 0 here
    { t0: 23.2, t1: 23.92, a: 1, b: 0, c: 'star' },
    { t0: 33.0, t1: 33.55, a: 1, b: 0, c: 'lens' }
  ];
  /* text cues. Each word lands on its own time; `out` starts the exit. Dwell is checked by tools/readcheck.mjs */
  var CUES = [
    { id: 'fast', role: 'display', size: 104, x: 120, y: 905, words: [['Light', 1.25], ['moves', 1.5], ['fast.', 1.75]], out: 5.0 },
    { id: 'run', role: 'serif', size: 140, x: 120, y: 915, words: [['Or', 6.5], ['let', 6.65], ['it', 6.8], ['run.', 6.95]], out: 9.75 },
    { id: 'dark', role: 'serif', size: 96, x: 960, y: 572, align: 'center', words: [['Then', 10.85], ['the', 11.0], ['light', 11.15], ['runs', 11.3], ['out.', 11.45]], out: 14.85 },
    { id: 'iso', role: 'display', size: 84, x: 120, y: 905, words: [['ISO', 15.2], ['12 800.', 15.4], ['Hand-held.', 15.6]], out: 18.95 },
    { id: 'long', role: 'display', size: 84, x: 120, y: 905, words: [['Fifteen', 19.3], ['seconds.', 19.5]], out: 22.5 },
    { id: 'name', role: 'display', size: 96, x: 960, y: 838, align: 'center', words: [['Halden', 28.0], ['LF‑1', 28.25]], out: 33.2 },
    { id: 'tag', role: 'serif', size: 66, x: 960, y: 922, align: 'center', words: [['See', 29.0], ['in', 29.15], ['the', 29.3], ['dark.', 29.45]], out: 33.2 },
    { id: 'specs', role: 'mono', size: 22, x: 120, y: 1012, words: [['24 MP', 26.0], ['·  f/1.4', 26.5], ['·  412 g', 27.0], ['·  Made in Lysekil', 27.5]], out: 33.2 },
    { id: 'price', role: 'mono', size: 22, x: 1800, y: 1012, align: 'right', words: [['SEK 18 900', 30.0]], out: 33.2 }
  ];
  /* sound / cue events (also exported to events.json by the renderer) */
  var EV = [{ t: 0.5, type: 'tick' }, { t: 1.0, type: 'shutter' }, { t: 1.0, type: 'iris', dir: 1 }];
  SHUT_T.slice(1).forEach(function (t) { EV.push({ t: t, type: 'tick' }); });
  EV.push({ t: 10.0, type: 'iris', dir: -1 });
  ISO_T.slice(1).forEach(function (t) { EV.push({ t: t, type: 'tick' }); });
  EV.push({ t: 23.2, type: 'iris', dir: -1 }, { t: 24.0, type: 'press' });
  [26.0, 26.5, 27.0, 27.5].forEach(function (t) { EV.push({ t: t, type: 'tick' }); });
  EV.push({ t: 28.0, type: 'thump' }, { t: 33.0, type: 'shutter' }, { t: 33.0, type: 'iris', dir: -1 });

  /* ---------- canvas + assets ---------- */
  var cv, ctx, tmp, tctx, acc, actx;
  var SPR = {}, NOISE, VIG, BEAM, DROPS = [], CITY = [], STARS = [], GLINTS = [], ROCKS_L = [], ROCKS_R = [], ISLES = [];

  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function sprite(size, draw) { var c = mk(size, size); draw(c.getContext('2d'), size); return c; }

  function buildAssets() {
    var r = mulberry(7);
    /* raindrop: a tiny lens. Dark body, a bright rim, a specular point, and the lamp refracted upside down inside it */
    ['warm', 'cool'].forEach(function (k) {
      var col = k === 'warm' ? '255,214,170' : '186,206,255';
      SPR['drop_' + k] = sprite(128, function (g, s) {
        var c = s / 2, rr = s * .44;
        var b = g.createRadialGradient(c, c, rr * .2, c, c, rr);
        b.addColorStop(0, 'rgba(' + col + ',.05)'); b.addColorStop(.72, 'rgba(' + col + ',.10)'); b.addColorStop(.9, 'rgba(' + col + ',.55)'); b.addColorStop(.97, 'rgba(' + col + ',.95)'); b.addColorStop(1, 'rgba(' + col + ',0)');
        g.fillStyle = b; g.beginPath(); g.arc(c, c, rr, 0, 7); g.fill();
        var l = g.createRadialGradient(c - rr * .3, c + rr * .38, 0, c - rr * .3, c + rr * .38, rr * .42);   // inverted lamp image
        l.addColorStop(0, 'rgba(255,236,206,.95)'); l.addColorStop(.35, 'rgba(255,190,130,.45)'); l.addColorStop(1, 'rgba(255,190,130,0)');
        g.fillStyle = l; g.beginPath(); g.arc(c, c, rr * .96, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(c + rr * .36, c - rr * .42, rr * .14, rr * .09, -.6, 0, 7); g.fill();
      });
      SPR['bokeh_' + k] = sprite(128, function (g, s) {
        var c = s / 2, rr = s * .46;
        var b = g.createRadialGradient(c, c, 0, c, c, rr);
        b.addColorStop(0, 'rgba(' + col + ',.30)'); b.addColorStop(.8, 'rgba(' + col + ',.42)'); b.addColorStop(.94, 'rgba(' + col + ',.75)'); b.addColorStop(1, 'rgba(' + col + ',0)');
        g.fillStyle = b; g.beginPath(); g.arc(c, c, rr, 0, 7); g.fill();
      });
    });
    SPR.soft = sprite(128, function (g, s) {
      var b = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      b.addColorStop(0, 'rgba(255,255,255,1)'); b.addColorStop(.4, 'rgba(255,255,255,.35)'); b.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = b; g.fillRect(0, 0, s, s);
    });
    /* rain field: positions in screen space at depth z; speed in px/s scales 1/z */
    for (var i = 0; i < 1150; i++) {
      var z = .55 + Math.pow(r(), 1.25) * 6.5;
      DROPS.push({ x: r() * (W + 600) - 300, y: r() * (H + 900) - 450, z: z, v: (7.2 + r() * 2.6) * 820 / z,
        wind: -.13 - r() * .05, size: (.024 + r() * .016) * 820 / z, warm: r() < .82, b: .35 + .65 * Math.pow(r(), .7) });
    }
    for (i = 0; i < 14; i++) {              /* a few hero drops near the first focus plane: the rack focus leaves them */
      var zh = 1.0 + r() * .35;
      DROPS.push({ x: 160 + r() * (W - 320), y: 120 + r() * (H - 240), z: zh, v: 8.2 * 820 / zh, wind: -.15, size: (.07 + r() * .05) * 820 / zh, warm: r() < .85, b: .8 + r() * .2 });
    }
    for (i = 0; i < 26; i++) CITY.push({ x: r() * W, y: 640 + r() * 420, rad: 40 + r() * 120, hue: r(), a: .05 + r() * .12 });
    /* night */
    for (i = 0; i < 900; i++) {
      var m = Math.pow(r(), 6);
      STARS.push({ x: r() * 2600 - 340, y: r() * 1100 - 420, m: m, s: .55 + m * 2.2, tw: r() * 6.28, warm: r() < .3 });
    }
    STARS.push({ x: 1240, y: 300, m: 1, s: 3.2, tw: 0, warm: false, vega: true });
    for (i = 0; i < 760; i++) {
      var u = r(), d = Math.pow(u, 2.1);
      GLINTS.push({ x: r() * 2700 - 400, d: d, len: 6 + d * 70 + r() * 20, ph: r() * 6.28, ph2: r() * 6.28, amp: 3 + d * 26, b: .25 + r() * .75 });
    }
    function ridge(n, x0, x1, base, amp, seed) {
      var rr = mulberry(seed), pts = [], k;
      for (k = 0; k <= n; k++) { var x = lerp(x0, x1, k / n); pts.push([x, base - amp(k / n) * (.7 + .3 * rr())]); }
      return pts;
    }
    ISLES = ridge(60, -400, 2400, 660, function (k) { return 18 + 26 * Math.sin(k * 7.1) * Math.sin(k * 2.3 + 1) + (k > .1 && k < .32 ? 34 : 0); }, 11);
    ROCKS_L = ridge(28, -300, 820, 1000, function (k) { return 120 + 160 * Math.sin(Math.PI * Math.min(1, k * 1.15)) * (1 - k * .6); }, 23);
    ROCKS_R = ridge(30, 1180, 2400, 820, function (k) { return 70 + 140 * Math.sin(Math.PI * Math.min(1, (k + .05) * 1.3)) * (k < .5 ? 1 : 1.1 - k * .9); }, 31);
    BEAM = mk(W / 4, H / 4);
    /* film grain tile (live preview only; the offline render adds grain in ffmpeg) */
    NOISE = mk(256, 256);
    var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256);
    for (i = 0; i < id.data.length; i += 4) { var n = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = n; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    VIG = mk(W, H);
    var vg = VIG.getContext('2d'), gr = vg.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)');
    vg.fillStyle = gr; vg.fillRect(0, 0, W, H);
  }

  /* ---------- scene: rain ---------- */
  function rainTime(t) {                     // bullet-time: creeps while frozen, real time once the shutter opens up
    var slow = .0032 * t, a = 6.2, b = 8.2;
    if (t < a) return slow;
    var u = Math.min(1, (t - a) / (b - a)), ramp = (b - a) * (u * u * u - u * u * u * u / 2);
    return slow + ramp + Math.max(0, t - b);
  }
  function rainRate(t) { return .0032 + ss(seg(t, 6.2, 8.2)); }
  function exposureAt(t) { return SHUTTER_S[stepIndex(t, SHUT_T.map(function (x, i) { return [x, i]; }))]; }

  function drawRain(g, t) {
    var zoom = 1 + .2 * eio(seg(t, 1, 6.4)) + .03 * seg(t, 6.4, 10);
    var focus = lerp(1.05, 2.9, eio(seg(t, 2.2, 5.4)));         // focus pull near -> far
    var tau = rainTime(t), rate = rainRate(t), E = exposureAt(t);
    var driftX = 30 * Math.sin(t * .35);
    g.fillStyle = '#05070c'; g.fillRect(0, 0, W, H);
    /* the lamp (off-frame, top right) and a soft street below */
    var lg = g.createRadialGradient(1700, -120, 0, 1700, -120, 1100);
    lg.addColorStop(0, 'rgba(255,190,130,.42)'); lg.addColorStop(.45, 'rgba(255,160,110,.10)'); lg.addColorStop(1, 'rgba(255,160,110,0)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'lighter';
    CITY.forEach(function (c, i) {
      var x = W / 2 + (c.x - W / 2) * (1 + (zoom - 1) * .3) + driftX * .2, y = H / 2 + (c.y - H / 2) * (1 + (zoom - 1) * .3);
      g.globalAlpha = c.a * (.85 + .15 * Math.sin(t * .7 + i));
      g.drawImage(c.hue < .7 ? SPR.bokeh_warm : SPR.bokeh_cool, x - c.rad, y - c.rad, c.rad * 2, c.rad * 2);
    });
    var streakOn = rate * E;                // seconds of motion captured per frame
    for (var i = 0; i < DROPS.length; i++) {
      var d = DROPS[i];
      var span = H + 900;
      var y = ((d.y + d.v * tau) % span + span) % span - 450;
      var x = d.x + d.v * d.wind * tau;
      x = ((x + 300) % (W + 600) + (W + 600)) % (W + 600) - 300;
      /* camera: push-in about the centre, depth-weighted drift */
      var zf = zoom * (1 + .06 / d.z);
      var sx = W / 2 + (x - W / 2) * zf + driftX / d.z, sy = H / 2 + (y - H / 2) * zf;
      var L = d.v * streakOn * zf;           // streak = velocity x exposure
      if (sx < -200 || sx > W + 200 || sy < -200 - L || sy > H + 200) continue;
      var coc = Math.min(40, 24 * Math.abs(1 / d.z - 1 / focus) * 1.6);
      var lit = d.b * (.55 + .45 * clamp(1 - Math.hypot(sx - 1700, sy + 120) / 2200, 0, 1));
      var r0 = Math.max(1.6, d.size * zf * .55);
      var sharp = 1 - ss(seg(coc, 3.5, 8));
      var col = d.warm ? '255,214,170' : '186,206,255';
      var ang = Math.atan2(1, d.wind) - Math.PI / 2;
      if (L > r0 * 1.2 && (sharp > .3 || L > 4 * coc)) { /* a streak: energy spread along the exposure */
        var wdt = lerp(Math.min(coc, 16) * 1.2, Math.max(1, r0 * .5), sharp);
        var a = lit * lerp(.10, .7, sharp) * clamp(Math.pow(r0 * 3 / L, .45), .25, 1);
        var ex = sx - Math.cos(ang + Math.PI / 2) * L, ey = sy - Math.sin(ang + Math.PI / 2) * L;
        var lg2 = g.createLinearGradient(ex, ey, sx, sy);
        lg2.addColorStop(0, 'rgba(' + col + ',0)'); lg2.addColorStop(.6, 'rgba(' + col + ',' + (a * .8) + ')'); lg2.addColorStop(1, 'rgba(' + col + ',' + a + ')');
        g.globalAlpha = 1; g.strokeStyle = lg2; g.lineWidth = wdt; g.lineCap = 'round';
        g.beginPath(); g.moveTo(ex, ey); g.lineTo(sx, sy); g.stroke();
        continue;
      }
      if (L > 2) {                            /* short streak: the sprite itself stretched along the motion (keeps bokeh round at the ends) */
        var rr2 = sharp > .5 ? r0 : Math.max(r0, coc);
        g.globalAlpha = sharp > .5 ? lit * sharp : lit * clamp(Math.pow(r0 / rr2, .9), .06, .8) * .9 * clamp(Math.pow(2 * rr2 / (L + 2 * rr2), .5), .3, 1);
        g.save(); g.translate(sx, sy); g.rotate(ang);
        g.drawImage(SPR[(sharp > .5 ? 'drop_' : 'bokeh_') + (d.warm ? 'warm' : 'cool')], -rr2, -L - rr2, rr2 * 2, L + rr2 * 2);
        g.restore();
        continue;
      }
      if (sharp > 0) {
        g.globalAlpha = lit * sharp;
        var rs = r0 * (1 + (1 - sharp) * .6);
        g.drawImage(SPR['drop_' + (d.warm ? 'warm' : 'cool')], sx - rs, sy - rs * 1.04, rs * 2, rs * 2.08);
      }
      if (sharp < 1) {
        var rb = Math.max(r0, coc);
        g.globalAlpha = lit * (1 - sharp) * clamp(Math.pow(r0 / rb, .9), .06, .8) * .9;
        g.drawImage(SPR['bokeh_' + (d.warm ? 'warm' : 'cool')], sx - rb, sy - rb, rb * 2, rb * 2);
      }
    }
    g.restore();
  }

  /* ---------- scene: night coast ---------- */
  function nightCam(t) {
    var tx = -170 * eio(seg(t, 12, 18.6));
    var ty = 240 * eio(seg(t, 18.4, 23.3));
    return { x: tx, y: ty };
  }
  function nightExposure(t) {                 // ISO steps, each lands with a quick critically-damped spring
    var steps = ISO_T.map(function (x, i) { return [i === 0 ? 0 : x, i / (ISO_T.length - 1)]; });
    return clamp(springSteps(t, steps, 3.2, 1), 0, 1);
  }
  function silk(t) { return eio(seg(t, LONG0, LONG1)); }
  function starScreen(t) {
    var c = nightCam(t), s = STARS[STARS.length - 1];
    return { x: s.x + c.x * .12, y: s.y + c.y * .3 };
  }
  function poly(g, pts, base) {
    g.beginPath(); g.moveTo(pts[0][0], base); pts.forEach(function (p) { g.lineTo(p[0], p[1]); }); g.lineTo(pts[pts.length - 1][0], base); g.closePath();
  }
  function drawNight(g, t) {
    var e = nightExposure(t), cam = nightCam(t), sk = silk(t), tn = t - 12;
    var hz = 660 + cam.y * .55;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    /* sky */
    g.globalAlpha = Math.pow(e, 1.6);
    var sg = g.createLinearGradient(0, hz - 900, 0, hz);
    sg.addColorStop(0, '#03050b'); sg.addColorStop(.62, '#0a1022'); sg.addColorStop(1, '#1a2238');
    g.fillStyle = sg; g.fillRect(0, 0, W, hz + 2);
    var hg = g.createRadialGradient(260 + cam.x * .4, hz, 0, 260 + cam.x * .4, hz, 760);
    hg.addColorStop(0, 'rgba(200,140,110,.20)'); hg.addColorStop(1, 'rgba(200,140,110,0)');
    g.fillStyle = hg; g.fillRect(0, hz - 760, W, 760);
    /* stars stay points, whatever the exposure */
    g.globalAlpha = 1;
    g.save(); g.globalCompositeOperation = 'lighter';
    STARS.forEach(function (s) {
      var x = s.x + cam.x * .12, y = s.y + cam.y * .3;
      if (y > hz - 6 || x < -10 || x > W + 10 || y < -10) return;
      var a = Math.pow(e, .55 + (1 - s.m) * .9) * (.25 + .75 * s.m) * (.9 + .1 * Math.sin(t * 1.7 + s.tw) * (1 - sk));
      if (s.vega) a = Math.pow(e, .4);
      g.globalAlpha = clamp(a, 0, 1);
      g.fillStyle = s.warm ? 'rgb(255,226,200)' : 'rgb(226,234,255)';
      g.beginPath(); g.arc(x, y, s.s * (s.vega ? 1 : .9), 0, 7); g.fill();
      if (s.m > .45) { g.globalAlpha = clamp(a * .35, 0, 1); g.drawImage(SPR.soft, x - s.s * 6, y - s.s * 6, s.s * 12, s.s * 12); }
    });
    g.restore();
    /* far islands */
    g.globalAlpha = Math.pow(e, 1.2);
    g.save(); g.translate(cam.x * .4, cam.y * .55);
    poly(g, ISLES, 700); g.fillStyle = '#070a13'; g.fill();
    g.strokeStyle = 'rgba(' + PAPER + ',.06)'; g.lineWidth = 1.2; g.stroke();
    g.restore();
    /* sea */
    var seaTop = hz + 2;
    var seg2 = g.createLinearGradient(0, seaTop, 0, H);
    seg2.addColorStop(0, '#111a2c'); seg2.addColorStop(.25, '#0a1020'); seg2.addColorStop(1, '#04060c');
    g.globalAlpha = Math.pow(e, 1.4); g.fillStyle = seg2; g.fillRect(0, seaTop, W, H - seaTop);
    var lhx = 1700 + cam.x * .85;
    g.save(); g.globalCompositeOperation = 'lighter';
    GLINTS.forEach(function (gl, i) {
      var y = seaTop + gl.d * (H + 160 - seaTop);
      var col = 1 - clamp(Math.abs(gl.x + cam.x * (.4 + gl.d * .6) - lhx) / 260, 0, 1);      // lantern reflection column
      var osc = Math.sin(tn * 1.3 + gl.ph) * gl.amp * (1 - sk);
      var x = gl.x + cam.x * (.4 + gl.d * .6) + osc;
      var flick = (.5 + .5 * Math.sin(tn * 2.2 + gl.ph2)) * (1 - sk) + .5 * sk;
      var a = Math.pow(e, 1.1) * gl.b * (.16 + .8 * col * col) * flick / (1 + sk * 1.6);
      var len = gl.len * (1 + sk * (4 + gl.d * 5));
      if (a < .004) return;
      g.globalAlpha = clamp(a, 0, 1);
      g.fillStyle = col > .3 ? 'rgb(255,214,164)' : 'rgb(170,190,230)';
      g.fillRect(x - len / 2, y, len, 1 + gl.d * 2.2);
    });
    /* long exposure: water turns to silk, a pale wash where the waves were */
    if (sk > 0) {
      var mg = g.createLinearGradient(0, seaTop, 0, H);
      mg.addColorStop(0, 'rgba(150,170,210,' + (.10 * sk) + ')'); mg.addColorStop(.5, 'rgba(120,140,190,' + (.05 * sk) + ')'); mg.addColorStop(1, 'rgba(120,140,190,0)');
      g.globalAlpha = 1; g.fillStyle = mg; g.fillRect(0, seaTop, W, H - seaTop);
      var cg = g.createLinearGradient(lhx - 220, 0, lhx + 220, 0);
      cg.addColorStop(0, 'rgba(255,200,140,0)'); cg.addColorStop(.5, 'rgba(255,200,140,' + (.16 * sk) + ')'); cg.addColorStop(1, 'rgba(255,200,140,0)');
      g.fillStyle = cg; g.fillRect(lhx - 220, seaTop, 440, H - seaTop);
    }
    g.restore();
    /* lighthouse beam: a rotating cone, drawn in 2D from its 3D heading. Long exposure paints a fan. */
    var lx = 1700 + cam.x * .85, ly = 700 + cam.y * .9 - 257, lantern = Math.pow(e, .7);
    var period = 7, th0 = (tn / period) * Math.PI * 2 + 1.2;
    var fanN = sk > 0 ? 1 + Math.round(sk * 30) : 1;
    var bg2 = BEAM.getContext('2d'); bg2.setTransform(1, 0, 0, 1, 0, 0); bg2.clearRect(0, 0, BEAM.width, BEAM.height); bg2.setTransform(.25, 0, 0, .25, 0, 0);
    bg2.globalCompositeOperation = 'lighter';
    for (var k = 0; k < fanN; k++) {
      var th = th0 - (fanN > 1 ? (k / (fanN - 1)) * Math.PI * 2 * 2.1 * sk : 0);
      var hx = Math.cos(th), hz2 = Math.sin(th);
      var len = 1700 * (.25 + .75 * Math.abs(hx)), wid = 70 + 160 * Math.abs(hx) + 260 * Math.max(0, -hz2);
      var aa = lantern * (.26 + .4 * Math.max(0, -hz2)) / (fanN > 1 ? fanN * .32 : 1);
      var dir = hx >= 0 ? 1 : -1;
      var ex = lx + dir * len, ey = ly - 10 + 60 * (1 - Math.abs(hx));
      var bg = bg2.createLinearGradient(lx, ly, ex, ey);
      bg.addColorStop(0, 'rgba(255,226,180,' + aa + ')'); bg.addColorStop(1, 'rgba(255,226,180,0)');
      bg2.fillStyle = bg;
      bg2.beginPath(); bg2.moveTo(lx, ly - 5); bg2.lineTo(ex, ey - wid / 2); bg2.lineTo(ex, ey + wid / 2); bg2.lineTo(lx, ly + 5); bg2.closePath(); bg2.fill();
      bg2.globalAlpha = .7; bg2.beginPath(); bg2.moveTo(lx, ly - 2); bg2.lineTo(ex, ey - wid / 6); bg2.lineTo(ex, ey + wid / 6); bg2.lineTo(lx, ly + 2); bg2.closePath(); bg2.fill(); bg2.globalAlpha = 1;
    }
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1; g.imageSmoothingQuality = 'high'; g.drawImage(BEAM, 0, 0, W, H);
    var face = Math.pow(Math.max(0, -Math.sin(th0)), 10) * (1 - sk * .6);
    g.globalAlpha = lantern * (.55 + .9 * face);
    g.drawImage(SPR.soft, lx - 60 - face * 200, ly - 60 - face * 200, 120 + face * 400, 120 + face * 400);
    g.restore();
    /* rocks + tower (nearest layers) */
    g.globalAlpha = 1;
    g.save(); g.translate(cam.x * .85, cam.y * .9);
    poly(g, ROCKS_R, 1400); g.fillStyle = '#020306'; g.fill();
    g.strokeStyle = 'rgba(' + PAPER + ',' + (.10 * e) + ')'; g.lineWidth = 1.4; g.stroke();
    var bx = 1700, by = 700;
    var tg = g.createLinearGradient(bx - 30, 0, bx + 30, 0);
    tg.addColorStop(0, 'rgba(' + PAPER + ',' + (.30 * e) + ')'); tg.addColorStop(.55, 'rgba(' + PAPER + ',' + (.12 * e) + ')'); tg.addColorStop(1, 'rgba(10,12,18,1)');
    g.fillStyle = '#05070b'; g.beginPath(); g.moveTo(bx - 30, by); g.lineTo(bx - 21, by - 236); g.lineTo(bx + 21, by - 236); g.lineTo(bx + 30, by); g.closePath(); g.fill();
    g.fillStyle = tg; g.fill();
    g.fillStyle = 'rgba(255,77,31,' + (.35 * e) + ')'; g.fillRect(bx - 25, by - 150, 50, 16);   // the one red band
    g.fillStyle = '#05070b'; g.fillRect(bx - 27, by - 242, 54, 8);
    g.fillStyle = 'rgba(255,214,160,' + clamp(lantern * .9, 0, 1) + ')'; g.fillRect(bx - 15, by - 272, 30, 30);
    g.fillStyle = '#05070b'; g.beginPath(); g.moveTo(bx - 20, by - 272); g.lineTo(bx, by - 290); g.lineTo(bx + 20, by - 272); g.closePath(); g.fill();
    g.restore();
    g.save(); g.translate(cam.x * 1.15, cam.y * 1.1);
    poly(g, ROCKS_L, 1500); g.fillStyle = '#010204'; g.fill();
    g.strokeStyle = 'rgba(' + PAPER + ',' + (.07 * e) + ')'; g.lineWidth = 1.2; g.stroke();
    g.restore();
  }

  /* ---------- scene: the camera, drawn in line (symbol space 400 x 240, from showcase #lf1) ---------- */
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function rrLen(w, h, r) { return 2 * (w + h) - (8 - 2 * Math.PI) * r; }
  var PARTS = [
    { k: 'rr', a: [20, 50, 360, 164, 20], fill: '#191917', t: 24.30, d: 1.0, w: 1.8 },
    { k: 'rr', a: [44, 30, 312, 26, 8], fill: '#1b1b19', t: 24.50, d: .7, w: 1.5 },
    { k: 'rr', a: [80, 18, 40, 14, 3], fill: '#232321', t: 24.70, d: .45, w: 1.2 },
    { k: 'rr', a: [330, 20, 16, 10, 2], fill: '#232321', t: 24.78, d: .35, w: 1 },
    { k: 'rr', a: [12, 84, 10, 22, 3], fill: '#2a2a27', t: 24.85, d: .3, w: 1 },
    { k: 'rr', a: [378, 84, 10, 22, 3], fill: '#2a2a27', t: 24.85, d: .3, w: 1 },
    { k: 'rr', a: [20, 96, 360, 98, 0], fill: null, t: 25.0, d: .8, w: 1, o: .35 },
    { k: 'rr', a: [296, 62, 58, 28, 4], fill: '#0b0f12', t: 24.95, d: .45, w: 1.2 },
    { k: 'rr', a: [46, 64, 34, 22, 3], fill: '#0b0f12', t: 25.0, d: .45, w: 1.2 },
    { k: 'c', a: [200, 128, 66], fill: '#121211', t: 25.0, d: .9, w: 1.8 },
    { k: 'c', a: [200, 128, 62], fill: '#1c1c1a', t: 25.1, d: .85, w: 1, o: .6 },
    { k: 'c', a: [200, 128, 48], fill: '#0c0c0b', t: 25.22, d: .8, w: 1.2, o: .7 },
    { k: 'c', a: [200, 128, 36], fill: null, t: 25.34, d: .75, w: 1, o: .55, sig: true }
  ];
  function camPlace(t) {
    var p = starScreen(23.92);
    var s0 = 2.9, s1 = 2.3;
    var k = eio(seg(t, 24.15, 26.6));
    var s = lerp(s0, s1, k) * (1 - .035 * seg(t, 26.6, 34));
    var bx = 303, by = 22;                                  // shutter button centre in symbol space
    var x0 = p.x - s0 * bx, y0 = p.y - s0 * by;
    var x1 = 960 - 200 * s, y1 = 420 - 120 * s;
    return { x: lerp(x0, x1, k), y: lerp(y0, y1, k), s: s };
  }
  function lensScreen(t) { var c = camPlace(t); return { x: c.x + 200 * c.s, y: c.y + 128 * c.s }; }
  function drawCamera(g, t) {
    var c = camPlace(t);
    g.fillStyle = INK; g.fillRect(0, 0, W, H);
    var sp = g.createRadialGradient(960, 430, 0, 960, 430, 900);
    sp.addColorStop(0, 'rgba(' + PAPER + ',.06)'); sp.addColorStop(1, 'rgba(' + PAPER + ',0)');
    g.globalAlpha = seg(t, 24.4, 26); g.fillStyle = sp; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    g.save(); g.translate(c.x, c.y); g.scale(c.s, c.s);
    var fillK = eoc(seg(t, 25.3, 26.4));
    PARTS.forEach(function (p) {
      var pr = eio(seg(t, p.t, p.t + p.d)); if (pr <= 0) return;
      if (p.k === 'rr') rrect(g, p.a[0], p.a[1], p.a[2], p.a[3], p.a[4]); else { g.beginPath(); g.arc(p.a[0], p.a[1], p.a[2], -Math.PI / 2, Math.PI * 1.5); }
      if (p.fill && fillK > 0) { g.globalAlpha = fillK; g.fillStyle = p.fill; g.fill(); }
      var L = p.k === 'rr' ? rrLen(p.a[2], p.a[3], p.a[4]) : 2 * Math.PI * p.a[2];
      g.setLineDash([L * pr, L + 1]); g.lineDashOffset = 0;
      g.globalAlpha = (p.o || 1) * (p.sig ? 1 : .92);
      g.strokeStyle = p.sig ? SIGNAL : 'rgb(' + PAPER + ')'; g.lineWidth = p.w / c.s * 1.25; g.stroke();
      g.setLineDash([]);
    });
    /* the glass: a small piece of the night it just saw */
    var gk = seg(t, 25.4, 26.4);
    if (gk > 0) {
      g.save(); g.beginPath(); g.arc(200, 128, 35.5, 0, 7); g.clip();
      var gg = g.createRadialGradient(188, 114, 2, 200, 128, 36);
      gg.addColorStop(0, '#1d2740'); gg.addColorStop(.6, '#0b1020'); gg.addColorStop(1, '#030409');
      g.globalAlpha = gk; g.fillStyle = gg; g.fillRect(160, 88, 80, 80);
      for (var i = 0; i < 40; i++) { g.fillStyle = 'rgba(230,236,255,' + (.25 + hash(i) * .6) * gk + ')'; g.fillRect(166 + hash(i + 3) * 68, 96 + hash(i + 9) * 40, .7, .7); }
      var sw = Math.sin((t - 25) * .9) * 8;
      g.globalAlpha = .22 * gk; g.fillStyle = '#fff';
      g.save(); g.translate(186 + sw, 114); g.rotate(-.52); g.beginPath(); g.ellipse(0, 0, 11, 6, 0, 0, 7); g.fill(); g.restore();
      g.globalAlpha = .12 * gk; g.beginPath(); g.arc(213 + sw * .4, 140, 3, 0, 7); g.fill();
      g.restore();
    }
    /* lens ring ticks turn slowly: the focus ring settling */
    var tk = seg(t, 25.5, 26.2);
    if (tk > 0) {
      g.save(); g.translate(200, 128); g.rotate(-.35 * (1 - eio(seg(t, 25.5, 27.5))) + .02 * Math.sin(t * .6));
      g.strokeStyle = 'rgba(' + PAPER + ',' + (.35 * tk) + ')'; g.lineWidth = 1 / c.s * 1.2;
      for (i = 0; i < 8; i++) { var a = i * Math.PI / 4; g.beginPath(); g.moveTo(Math.cos(a) * 56, Math.sin(a) * 56); g.lineTo(Math.cos(a) * 62, Math.sin(a) * 62); g.stroke(); }
      g.restore();
    }
    var tx = seg(t, 25.7, 26.5);
    if (tx > 0) {
      g.globalAlpha = .8 * tx; g.fillStyle = 'rgb(' + PAPER + ')'; g.textAlign = 'center';
      g.font = '700 11px Archivo'; setStretch(g, 'expanded'); g.letterSpacing = '5px'; g.fillText('HALDEN', 202.5, 80);
      g.globalAlpha = .55 * tx; g.font = '7px "Geist Mono"'; setStretch(g, 'normal'); g.letterSpacing = '2px'; g.fillText('35 MM · F/1.4', 201, 206);
      g.letterSpacing = '0px';
    }
    g.restore();
    drawButton(g, t, c);
  }
  /* the orange point: the shutter button before we know it is one, the star, then the button */
  function drawButton(g, t, c) {
    var p0 = starScreen(23.92);
    var k = spring(t - 24.05, 1.6, .9);
    var bw = lerp(18 / c.s, 30, k), bh = lerp(18 / c.s, 16, k), br = lerp(9 / c.s, 4, k);
    var cx = c.x + 303 * c.s, cy = c.y + 22 * c.s;
    var press = t >= 33.0 && t < 33.18 ? 1 : 0;
    var glow = .35 + .65 * ss(seg(t, 32.2, 33.0)) * (1 - seg(t, 33.0, 33.5));
    g.save(); g.translate(cx, cy + press * 1.5 * c.s); g.scale(c.s, c.s);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = .45 * glow * (1 - k * .6);
    g.drawImage(SPR.soft, -40, -40, 80, 80);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    rrect(g, -bw / 2, -bh / 2, bw, bh, Math.min(br, bh / 2)); g.fillStyle = SIGNAL; g.fill();
    g.restore();
  }
  function drawDot(g, t, x, y, s) {
    var br = 1 + .12 * Math.sin(t * Math.PI * 2) ;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .38;
    g.drawImage(SPR.soft, x - 46 * br * s, y - 46 * br * s, 92 * br * s, 92 * br * s);
    g.restore();
    g.fillStyle = SIGNAL; g.beginPath(); g.arc(x, y, 9 * s * br, 0, 7); g.fill();
  }

  /* ---------- iris (the one transition grammar) ---------- */
  function irisState(t) {
    var R = 1, cx = W / 2, cy = H / 2, rot = 0;
    for (var i = 0; i < IRIS.length; i++) {
      var q = IRIS[i]; if (t < q.t0) break;
      var k = q.b > q.a ? eo(seg(t, q.t0, q.t1)) : eio(seg(t, q.t0, q.t1));
      R = lerp(q.a, q.b, k);
      if (q.c === 'star') { var s = starScreen(t); cx = s.x; cy = s.y; }
      else if (q.c === 'lens') { var l = lensScreen(t); cx = l.x; cy = l.y; }
      else { cx = W / 2; cy = H / 2; }
    }
    return { R: R, cx: cx, cy: cy };
  }
  function drawIris(g, st) {
    if (st.R >= .999) return;
    var maxR = Math.hypot(W, H) * .62, r = Math.max(0, st.R * maxR), n = 9;
    var rot = .9 * (1 - st.R) + .2;
    var pts = [];
    for (var i = 0; i < n; i++) { var a = rot + i * Math.PI * 2 / n; pts.push([st.cx + Math.cos(a) * r, st.cy + Math.sin(a) * r]); }
    g.save();
    g.beginPath(); g.rect(-10, -10, W + 20, H + 20);
    g.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < n; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath();
    g.fillStyle = '#070707'; g.fill('evenodd');
    /* blade edges carry on past each vertex, as on a real aperture */
    g.strokeStyle = 'rgba(' + PAPER + ',.13)'; g.lineWidth = 1.5;
    for (i = 0; i < n; i++) {
      var p = pts[i], q = pts[(i + n - 1) % n], dx = p[0] - q[0], dy = p[1] - q[1], l = Math.hypot(dx, dy) || 1;
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + dx / l * 2600, p[1] + dy / l * 2600); g.stroke();
    }
    g.restore();
  }

  /* ---------- type ---------- */
  function setStretch(g, v) { try { g.fontStretch = v; } catch (e) {} }
  function fontFor(role, size) {
    if (role === 'display') return '700 ' + size + 'px Archivo';
    if (role === 'serif') return 'italic 400 ' + size + 'px "Instrument Serif"';
    return '400 ' + size + 'px "Geist Mono"';
  }
  function layoutCue(g, q) {
    if (q._lay) return q._lay;
    g.save(); g.font = fontFor(q.role, q.size); setStretch(g, q.role === 'display' ? 'expanded' : 'normal');
    g.letterSpacing = q.role === 'display' ? (-.02 * q.size) + 'px' : q.role === 'mono' ? '3px' : '0px';
    var space = g.measureText(' ').width * (q.role === 'mono' ? 1.6 : 1);
    var ws = q.words.map(function (w) { return { s: q.role === 'mono' ? w[0].toUpperCase() : w[0], t: w[1], w: 0 }; });
    var tot = 0; ws.forEach(function (w, i) { w.w = g.measureText(w.s).width; tot += w.w + (i ? space : 0); });
    var x = q.align === 'center' ? q.x - tot / 2 : q.align === 'right' ? q.x - tot : q.x;
    ws.forEach(function (w) { w.x = x; x += w.w + space; });
    g.restore();
    q._lay = { ws: ws, x0: ws[0].x, x1: x - space, asc: q.size * .82, desc: q.size * .26 };
    return q._lay;
  }
  function drawCues(g, t) {
    CUES.forEach(function (q) {
      var lay = layoutCue(g, q);
      var last = q.words[q.words.length - 1][1];
      if (t < q.words[0][1] || t > q.out + .7) return;
      var outK = eio(seg(t, q.out, q.out + .55));
      g.save();
      g.font = fontFor(q.role, q.size); setStretch(g, q.role === 'display' ? 'expanded' : 'normal');
      g.letterSpacing = q.role === 'display' ? (-.02 * q.size) + 'px' : q.role === 'mono' ? '3px' : '0px';
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      var lh = lay.asc + lay.desc;
      g.beginPath(); g.rect(lay.x0 - 40, q.y - lay.asc - 12, lay.x1 - lay.x0 + 80, lh + 24); g.clip();
      lay.ws.forEach(function (w) {
        var k = eo(seg(t, w.t, w.t + .7));
        if (k <= 0) return;
        var dy = (1 - k) * lh * 1.05 - outK * lh * 1.1;
        g.globalAlpha = q.role === 'mono' ? .78 * k : k;
        g.fillStyle = 'rgb(' + PAPER + ')';
        if (q.role === 'serif') g.filter = 'none';
        g.fillText(w.s, w.x, q.y + dy);
      });
      g.restore();
    });
  }
  /* every text fully on screen at t (for tools/readcheck.mjs) */
  function TEXTS(t) {
    var out = [];
    CUES.forEach(function (q) {
      var last = q.words[q.words.length - 1][1];
      var lay = q._lay;
      if (t >= last + .45 && t < q.out) out.push({ id: q.id, text: q.words.map(function (w) { return w[0]; }).join(' '), x0: lay ? lay.x0 : q.x, y0: q.y - q.size, x1: lay ? lay.x1 : q.x, y1: q.y });
    });
    return out;
  }

  /* ---------- HUD ---------- */
  function rollText(g, x, y, steps, t, align) {        // per-character rolling readout (animated-number-flow, as a pure fn)
    var k = 0; for (var i = 0; i < steps.length; i++) if (t >= steps[i][0]) k = i;
    var cur = steps[k][1], prev = k > 0 ? steps[k - 1][1] : cur, since = t - steps[k][0];
    var n = Math.max(cur.length, prev.length), cw = g.measureText('0').width + 2;
    var x0 = align === 'right' ? x - n * cw : x;
    for (i = 0; i < n; i++) {
      var a = cur[cur.length - n + i] || '', b = prev[prev.length - n + i] || '';
      var cx = x0 + i * cw;
      if (a === b || k === 0) { if (a) g.fillText(a, cx, y); continue; }
      var p = eo(clamp((since - (n - 1 - i) * .025) / .22, 0, 1));
      g.save(); g.beginPath(); g.rect(cx - 2, y - 24, cw + 2, 32); g.clip();
      var ga = g.globalAlpha;
      if (b) { g.globalAlpha = ga * (1 - p); g.fillText(b, cx, y - 22 * p); }
      if (a) { g.globalAlpha = ga * p; g.fillText(a, cx, y + 22 * (1 - p)); }
      g.globalAlpha = ga;
      g.restore();
    }
  }
  function drawHud(g, t) {
    var vis = Math.min(seg(t, 1.25, 1.9), 1 - seg(t, 9.8, 10.2)) + Math.min(seg(t, 13.0, 14.0), 1 - seg(t, 22.8, 23.3));
    if (vis <= 0) return;
    var A = .75 * vis, m = 56, L = 30;
    g.save(); g.strokeStyle = 'rgba(' + PAPER + ',' + (.45 * vis) + ')'; g.lineWidth = 1.5;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(function (c) {
      g.beginPath(); g.moveTo(c[0], c[1] + c[3] * L); g.lineTo(c[0], c[1]); g.lineTo(c[0] + c[2] * L, c[1]); g.stroke();
    });
    g.font = '400 20px "Geist Mono"'; g.letterSpacing = '3px'; g.fillStyle = 'rgba(' + PAPER + ',1)'; g.globalAlpha = A;
    g.textAlign = 'left';
    var shot = SHOTS.filter(function (s) { return t >= s.t0 && t < s.t1; })[0] || SHOTS[0];
    var idx = SHOTS.indexOf(shot) + 1;
    g.fillText('HALDEN LF‑1', m + 22, m + 48);
    g.globalAlpha = A * .6; g.fillText(('0' + idx).slice(-2) + ' · ' + shot.name.toUpperCase(), m + 22, m + 78);
    /* readouts */
    g.globalAlpha = A * .6; g.textAlign = 'left';
    var rx = W - m - 22;
    var lab = ['SHUTTER', 'APERTURE', 'ISO'];
    lab.forEach(function (l, i) { g.fillText(l, rx - 520 + i * 190, m + 48); });
    g.globalAlpha = A;
    var shutSteps = SHUT_T.map(function (x, i) { return [x, SHUTTER[i]]; });
    if (t >= 12) shutSteps = [[0, '1/30'], [LONG0, '15 S']];
    g.save(); g.textAlign = 'left'; rollText(g, rx - 520, m + 80, shutSteps, t, 'left'); g.restore();
    g.fillText('F/1.4', rx - 330, m + 80);
    var isoSteps = t < 12 ? [[0, '50']] : ISO_T.map(function (x, i) { return [i ? x : 0, ISO[i]]; });
    rollText(g, rx - 140, m + 80, isoSteps, t, 'left');
    /* the 15 s exposure: a ring timer counting the light in */
    var lk = seg(t, LONG0 - .3, LONG0);
    if (lk > 0 && t < 23.3) {
      var pr = seg(t, LONG0, LONG1), cx = W - m - 48, cy = m + 150;
      g.globalAlpha = A * lk; g.strokeStyle = 'rgba(' + PAPER + ',.25)'; g.lineWidth = 2;
      g.beginPath(); g.arc(cx, cy, 26, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(' + PAPER + ',.95)'; g.beginPath(); g.arc(cx, cy, 26, -Math.PI / 2, -Math.PI / 2 + pr * Math.PI * 2); g.stroke();
      g.textAlign = 'right'; g.fillText('00:' + ('0' + Math.floor(pr * 15)).slice(-2), cx - 44, cy + 7);
    }
    /* timecode */
    var f = Math.floor(t * 24), tc = '00:00:' + ('0' + Math.floor(t)).slice(-2) + ':' + ('0' + (f % 24)).slice(-2);
    g.globalAlpha = A * .5; g.textAlign = 'right'; g.fillText(tc, W - m - 22, H - m - 22);
    g.restore();
  }

  /* ---------- frame ---------- */
  var LIVE = { grain: true };
  function frame(g, t) {
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    if (t >= 1.0 && t < 10.7) drawRain(g, t);
    else if (t >= 11.9 && t < 24.0) drawNight(g, t);
    else if (t >= 24.0) drawCamera(g, t);
    var ir = irisState(t);
    if (t < 24.0) drawIris(g, ir); else if (t >= 33.0) drawIris(g, ir);
    if (t < 1.0) drawDot(g, t, W / 2, H / 2, 1);
    if (t >= 23.92 && t < 24.05) { var p = starScreen(23.92); drawDot(g, t, p.x, p.y, 1); }
    if (LIVE.text !== false) { drawHud(g, t); drawCues(g, t); }
    g.globalAlpha = 1; g.drawImage(VIG, 0, 0);
    if (t > 33.6) { g.globalAlpha = seg(t, 33.6, 33.9); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
    if (LIVE.grain) {
      var gf = Math.floor(t * 24), r = mulberry(gf + 1);
      g.globalAlpha = .07; g.globalCompositeOperation = 'overlay';
      var ox = -Math.floor(r() * 256), oy = -Math.floor(r() * 256);
      for (var y = oy; y < H; y += 256) for (var x = ox; x < W; x += 256) g.drawImage(NOISE, x, y);
    }
    g.restore();
  }

  /* render(t) draws one frame. With samples > 1 it averages sub-frames over a shutter of `shutter` frames
     (exact running mean: frame k is laid over the mean of the first k at alpha 1/(k+1)). */
  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR);
    samples = samples || 1;
    if (samples === 1) { frame(ctx, t); return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      var st = t - span / 2 + span * (k + .5) / samples;
      frame(tctx, clamp(st, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1);
      actx.drawImage(tmp, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- score: built from the same timeline, rendered offline (deterministic) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(99);
    var master = ac.createGain(); master.gain.value = .9;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .25;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38; hp.Q.value = .7;
    var shelf = ac.createBiquadFilter(); shelf.type = 'lowshelf'; shelf.frequency.value = 140; shelf.gain.value = -4;
    var air = ac.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 5000; air.gain.value = 3;
    master.connect(hp); hp.connect(shelf); shelf.connect(air); air.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 3.2), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 3.2) * (i < sr * .012 ? i / (sr * .012) : 1); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .32; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 4, sr), nd = nb.getChannelData(0);
    for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    var pink = ac.createBuffer(1, sr * 4, sr), pd = pink.getChannelData(0), b0 = 0, b1 = 0, b2 = 0;
    for (i = 0; i < pd.length; i++) { var w = rnd() * 2 - 1; b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; pd[i] = (b0 + b1 + b2 + w * .1848) * .18; }

    function bus(gain, send, pan) {
      var g = ac.createGain(); g.gain.value = gain;
      var p = ac.createStereoPanner(); p.pan.value = pan || 0; g.connect(p); p.connect(master);
      if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); }
      return g;
    }
    function noiseSrc(t0, dur, buf) { var s = ac.createBufferSource(); s.buffer = buf || nb; s.loop = true; s.start(t0, rnd() * 3, dur); return s; }
    function env(param, pts) { param.setValueAtTime(pts[0][1], pts[0][0]); for (var k = 1; k < pts.length; k++) param.linearRampToValueAtTime(pts[k][1], pts[k][0]); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

    /* foley */
    function tick(t, g) {
      var o = bus(g || .22, .15, .25), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5200;
      var n = noiseSrc(t, .03); n.connect(f); f.connect(o);
      env(o.gain, [[t, 0], [t + .001, g || .22], [t + .02, 0]]);
      var s = ac.createOscillator(), sg = ac.createGain(); s.frequency.value = 2650; s.connect(sg); sg.connect(o);
      env(sg.gain, [[t, .5], [t + .012, 0]]); s.start(t); s.stop(t + .03);
    }
    function shutter(t) {
      var o = bus(.8, .35, 0);
      var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = .9;
      var n = noiseSrc(t, .1); n.connect(f); f.connect(o);
      var o2 = bus(.6, .2, 0), f2 = ac.createBiquadFilter(); f2.type = 'highpass'; f2.frequency.value = 4200;
      var n2 = noiseSrc(t + .055, .05); n2.connect(f2); f2.connect(o2);
      env(o.gain, [[t, 0], [t + .002, .8], [t + .035, .05], [t + .06, 0]]);
      env(o2.gain, [[t, 0], [t + .055, 0], [t + .057, .55], [t + .075, 0]]);
      var th = ac.createOscillator(), tg = ac.createGain(); th.type = 'sine'; th.frequency.setValueAtTime(150, t); th.frequency.exponentialRampToValueAtTime(60, t + .08);
      th.connect(tg); tg.connect(bus(.9, .1)); env(tg.gain, [[t, 0], [t + .003, .7], [t + .09, 0]]); th.start(t); th.stop(t + .12);
    }
    function iris(t, dir, dur) {
      var o = bus(.22, .3, 0), f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.5;
      f.frequency.setValueAtTime(dir > 0 ? 700 : 3200, t); f.frequency.exponentialRampToValueAtTime(dir > 0 ? 3600 : 600, t + dur);
      var n = noiseSrc(t, dur + .05); n.connect(f); f.connect(o);
      env(o.gain, [[t, 0], [t + dur * .3, .22], [t + dur, 0]]);
      for (var k = 0; k < 6; k++) tick(t + k * dur / 6, .05);
    }
    function thump(t, g) {
      var o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(42, t + .4);
      o.connect(og); og.connect(bus(1, .25)); env(og.gain, [[t, 0], [t + .006, g], [t + .55, 0]]); o.start(t); o.stop(t + .6);
    }
    /* instruments */
    function bell(t, m, g, pan) {
      var c = ac.createOscillator(), mo = ac.createOscillator(), mg = ac.createGain(), og = ac.createGain();
      c.frequency.value = mtof(m); mo.frequency.value = mtof(m) * 3.5; mg.gain.setValueAtTime(mtof(m) * 2.2, t); mg.gain.exponentialRampToValueAtTime(1, t + 2.5);
      mo.connect(mg); mg.connect(c.frequency); c.connect(og); og.connect(bus(1, .55, pan || 0));
      env(og.gain, [[t, 0], [t + .004, g], [t + 3.2, 0]]); c.start(t); mo.start(t); c.stop(t + 3.3); mo.stop(t + 3.3);
    }
    function pluck(t, m, g, pan) {
      var o = ac.createOscillator(), f = ac.createBiquadFilter(), og = ac.createGain(); o.type = 'triangle'; o.frequency.value = mtof(m);
      f.type = 'lowpass'; f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(500, t + .25);
      o.connect(f); f.connect(og); og.connect(bus(1, .4, pan)); env(og.gain, [[t, 0], [t + .003, g], [t + .45, 0]]); o.start(t); o.stop(t + .5);
    }
    function pad(t0, t1, notes, g, cut0, cut1, send) {
      var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = .4;
      f.frequency.setValueAtTime(cut0, t0); f.frequency.linearRampToValueAtTime(cut1, t1);
      var og = ac.createGain(); f.connect(og); og.connect(bus(1, send == null ? .5 : send));
      env(og.gain, [[t0, 0], [t0 + Math.min(1.2, (t1 - t0) * .4), g], [t1 - .25, g], [t1, 0]]);
      notes.forEach(function (m, i) {
        [-7, 0, 7].forEach(function (cents) {
          var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = cents + (i % 2 ? 3 : -3);
          var vg = ac.createGain(); vg.gain.value = .33 / notes.length; o.connect(vg); vg.connect(f); o.start(t0); o.stop(t1 + .05);
        });
      });
    }
    function glass(t0, t1, notes, g) {
      notes.forEach(function (m, i) {
        var o = ac.createOscillator(), og = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
        o.frequency.value = mtof(m); lfo.frequency.value = .25 + i * .07; lg.gain.value = 2.5; lfo.connect(lg); lg.connect(o.frequency);
        o.connect(og); og.connect(bus(1, .7, (i - 1.5) * .35));
        env(og.gain, [[t0, 0], [t0 + 1.4, g], [t1 - .6, g * .8], [t1, 0]]); o.start(t0); lfo.start(t0); o.stop(t1 + .05); lfo.stop(t1 + .05);
      });
    }
    function bass(t0, t1, m, g) {
      var og = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; og.connect(f); f.connect(bus(1, .05));
      [[1, 1], [2, .45], [3, .22]].forEach(function (h) { var o = ac.createOscillator(); o.frequency.value = mtof(m) * h[0]; var hg = ac.createGain(); hg.gain.value = h[1]; o.connect(hg); hg.connect(og); o.start(t0); o.stop(t1 + .05); });
      env(og.gain, [[t0, 0], [t0 + .8, g], [t1 - .4, g], [t1, 0]]);
    }
    function kick(t, g) {
      var o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + .12);
      o.connect(og); og.connect(bus(1, .04)); env(og.gain, [[t, 0], [t + .004, g], [t + .32, 0]]); o.start(t); o.stop(t + .35);
    }
    function hat(t, g) {
      var o = bus(g, .1, .3), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 8000;
      var n = noiseSrc(t, .05); n.connect(f); f.connect(o); env(o.gain, [[t, 0], [t + .002, g], [t + .04, 0]]);
    }
    function bed(t0, t1, buf, type, freq, g, pts) {
      var f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
      var og = ac.createGain(); var n = noiseSrc(t0, t1 - t0, buf); n.connect(f); f.connect(og); og.connect(bus(1, .12));
      env(og.gain, pts || [[t0, 0], [t0 + .5, g], [t1 - .5, g], [t1, 0]]);
      return f;
    }

    /* room tone under everything (never digital silence) */
    bed(0, DUR, pink, 'lowpass', 900, .022, [[0, .022], [DUR - .2, .022], [DUR, 0]]);
    /* EV-driven foley */
    EV.forEach(function (e) {
      if (e.type === 'tick') tick(e.t, e.t < 1 ? .12 : .18);
      if (e.type === 'shutter') shutter(e.t);
      if (e.type === 'iris') iris(e.t, e.dir, e.dir > 0 ? .3 : .6);
      if (e.type === 'press') { thump(e.t, .55); shutter(e.t); }
      if (e.type === 'thump') thump(e.t, .35);
    });
    /* frozen: suspended glass chord (D minor 9 colour, very high), soft pulse from bar 2 */
    glass(1.05, 6.6, [86, 89, 93, 88], .045);
    for (var b = 2; b < 10; b += 1) kick(b, b < 6 ? .16 : .26);
    /* let it run: rain grows with the streaks, hats and a plucked arpeggio arrive */
    bed(6.2, 10.25, nb, 'bandpass', 2600, 0, [[6.2, 0], [9.6, .22], [10.0, .2], [10.25, 0]]);
    bed(6.2, 10.25, nb, 'highpass', 6500, 0, [[6.2, 0], [9.6, .07], [10.25, 0]]);
    for (var h = 6.25; h < 10; h += .5) hat(h, .08);
    var arp = [62, 65, 69, 72, 76, 72, 69, 65];
    for (var a = 0; a < 15; a++) pluck(6.0 + a * .25, arp[a % 8], .09, (a % 2 ? .3 : -.3));
    /* breath: 10.2 – 11.8 room tone only */
    /* night: sea, wind, low pad, bass, kick returns at half-time */
    var seaF = bed(11.9, 25.6, pink, 'lowpass', 520, .0, [[11.9, 0], [14, .3], [22.4, .3], [22.7, .05], [23.3, .05], [24.05, .26], [25.6, 0]]);
    seaF.frequency.setValueAtTime(520, 11.9);
    for (var s = 12; s < 25; s += 2) { seaF.frequency.linearRampToValueAtTime(820, s + 1); seaF.frequency.linearRampToValueAtTime(420, s + 2); }
    bed(12, 22.7, nb, 'bandpass', 380, .03);
    pad(12.2, 18.2, [50, 57, 60, 64], .07, 320, 900);
    bass(12.4, 22.6, 38, .13);
    for (b = 14; b < 22.5; b += 2) kick(b, .2);
    /* lighthouse hum on each pass toward camera */
    for (var k2 = 0; k2 < 3; k2++) {
      var tp = 12 + ((Math.PI * 1.5 - 1.2) / (Math.PI * 2) + k2) * 7;
      if (tp < 22.6) { var ho = ac.createOscillator(), hg2 = ac.createGain(); ho.frequency.value = 98; ho.connect(hg2); hg2.connect(bus(1, .3)); env(hg2.gain, [[tp - 1, 0], [tp, .09], [tp + 1.2, 0]]); ho.start(tp - 1); ho.stop(tp + 1.3); }
    }
    /* fifteen seconds: shimmer rises, bell motif, then silence 22.6 – 23.2 */
    pad(18.2, 22.6, [46, 53, 57, 62, 65], .07, 500, 2600, .6);
    glass(18.6, 22.6, [81, 84, 88, 93], .028);
    bell(19.0, 81, .16, -.2); bell(21.0, 77, .14, .2);
    /* match cut: the press, a resolved chord (D major 9) */
    pad(24.0, 33.4, [50, 57, 62, 66, 69, 76], .085, 700, 1500, .55);
    bell(24.0, 86, .18, 0); bell(24.02, 81, .12, .25);
    bass(24.0, 33.2, 38, .12);
    bell(28.0, 74, .13, -.15); bell(29.0, 78, .1, .2);
    for (b = 26; b < 33; b += 1) kick(b, b % 2 ? .1 : .18);
    bell(33.0, 86, .12, 0);
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d');
    cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d');
    acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    buildAssets();
    var fonts = ['700 40px Archivo', 'italic 400 40px "Instrument Serif"', '400 20px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0'); })).then(function () { return document.fonts.ready; }).then(function () {
      CUES.forEach(function (q) { q._lay = null; layoutCue(ctx, q); });
      window.READY = true;
    });
  }

  window.FILM = { W: W, H: H, DUR: DUR, BEAT: BEAT, SHOTS: SHOTS, CUES: CUES, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR;
  window.EV = EV;
  window.render = function (t, samples, shutter, fps) { render(t, samples, shutter, fps); };
  window.TEXTS = TEXTS;
  window.SCORE = SCORE;
  window.READY = false;
})();
