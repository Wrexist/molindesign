/* "One second" — how a mechanical watch counts time. A vertical explainer written in code.
   Every frame is a pure function of t (seconds), like ../film.js: no Date.now, no unseeded random, no state
   between frames. Contract: window.FILM, window.DUR, window.render(t), window.READY, window.EV, window.TEXTS(t), window.SCORE(ctx). */
(function () {
  'use strict';
  var W = 1080, H = 1920, DUR = 38.5;
  var BG = '#eeeae2', INK = '#1b1b1a', RUBY = '#c8102e';
  var SX = 540, SY = 1060;                     // screen anchor of the camera centre

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function eoc(k) { return 1 - Math.pow(1 - k, 3); }
  function ss(k) { return k * k * (3 - 2 * k); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  var D2R = Math.PI / 180;
  function pol(c, r, a) { return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) }; }
  function ang(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }

  /* ---------- the timeline ---------- */
  var SHOTS = [
    { id: 'hook', name: 'No battery', t0: 0, t1: 4.7 },
    { id: 'lift', name: 'Inside', t0: 4.7, t1: 6.2 },
    { id: 'spring', name: '1 · Spring', t0: 6.2, t1: 9.4 },
    { id: 'release', name: 'Let go', t0: 9.4, t1: 12.0 },
    { id: 'escape', name: '2 · Escapement', t0: 12.0, t1: 19.4 },
    { id: 'balance', name: '3 · Balance', t0: 19.4, t1: 26.3 },
    { id: 'together', name: 'Real time', t0: 26.3, t1: 33.0 },
    { id: 'second', name: 'One second', t0: 33.0, t1: 38.5 }
  ];
  /* time ramp: playback rate of watch time against film time. tau(t) is its integral (table, built once) */
  var RATE = [[0, 1], [11.8, 1], [12.5, .06], [19.4, .06], [20.6, .25], [26.3, .25], [27.3, 1], [38.5, 1]];
  function rate(t) {
    for (var i = 1; i < RATE.length; i++) if (t <= RATE[i][0]) return lerp(RATE[i - 1][1], RATE[i][1], ss(seg(t, RATE[i - 1][0], RATE[i][0])));
    return 1;
  }
  var TAU0 = .06, TSTEP = .0005, TAU = [];
  (function () { var a = TAU0; TAU.push(a); for (var t = TSTEP; t <= DUR + .1; t += TSTEP) { a += (rate(t - TSTEP) + rate(t)) / 2 * TSTEP; TAU.push(a); } })();
  function tau(t) { var f = clamp(t, 0, DUR + .09) / TSTEP, i = Math.floor(f); return lerp(TAU[i], TAU[Math.min(i + 1, TAU.length - 1)], f - i); }
  function tinv(x) {                              // film time at which watch time reaches x
    var lo = 0, hi = TAU.length - 1;
    if (x <= TAU[0]) return 0;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (TAU[m] < x) lo = m; else hi = m; }
    return (lo + (x - TAU[lo]) / (TAU[hi] - TAU[lo])) * TSTEP;
  }

  /* ---------- the movement (world units, centre wheel at 0,0) ---------- */
  var C = { x: 0, y: 0 }, B = { x: -136, y: -50 }, T = { x: 69.4, y: 86.6 }, F = { x: 0, y: 150 };
  var E = pol(F, 84, 20 * D2R), P = pol(E, 82, -20 * D2R), BAL = pol(P, 115, -40 * D2R);
  var BEAT = 1 / 8, HALF = 9 * D2R, PITCH = 18 * D2R, LOCKW = .012;      // 4 Hz balance: 8 beats a second, 28 800 an hour
  var AMP = 215 * D2R, BETA = 7 * D2R;
  var dEP = ang(E, P), STONE_A = dEP - 40.5 * D2R, STONE_B = dEP + 40.5 * D2R;   // 4.5 pitches apart: locks alternate
  var PSI0 = STONE_A - 2 * D2R;                 // a tooth tip rests 2 degrees short of the entry stone
  var PLATE_R = 372;

  /* the escapement and balance are lifted out at 4.85 s and put back at 12.15 s */
  var OUT0 = 4.85, OUT1 = 5.7, IN0 = 12.15, IN1 = 12.95;
  function regulatorIn(t) { return t < OUT0 ? 1 : t < IN0 ? Math.pow(1 - eio(seg(t, OUT0, OUT1)), 2) : eio(seg(t, IN0, IN1)); }
  function ticking(t) { return t < 5.0 || t >= IN0 + .4; }

  /* beats done since tau = 0 (each beat advances the escape wheel half a tooth) */
  function beats(x) {
    var m = Math.floor(x / BEAT + .5);
    if (m <= 0) return 0;
    var p = eio(clamp((x - (m * BEAT - LOCKW * .3)) / (LOCKW * 1.3), 0, 1));
    return m - 1 + p;
  }
  function forkAngle(x) {
    var m = Math.floor(x / BEAT + .5);
    var a = (m - 1) % 2 === 0 ? -BETA : BETA, b = m % 2 === 0 ? -BETA : BETA;
    return lerp(a, b, eio(clamp((x - (m * BEAT - LOCKW)) / (2 * LOCKW), 0, 1)));
  }
  function balanceAngle(x) { return AMP * Math.sin(2 * Math.PI * 4 * x); }
  /* the free run: without the escapement the train dumps its power (9.85 - 12.2 s) */
  var FREE0 = 9.45, FREE1 = 11.8;
  function freeK(t) { var u = seg(t, FREE0, FREE1); return 1 - Math.pow(1 - u, 4); }   // the snap: fastest at the start
  var TAU_IN = 0;   // set after init: watch time when the escapement goes back in
  function train(t) {
    var x = tau(t), free = freeK(t);
    var gov = t < IN0 ? beats(tau(Math.min(t, 4.9))) : beats(tau(4.9)) + beats(x) - beats(TAU_IN);
    var e = PSI0 + gov * HALF + free * 40 * 2 * Math.PI;
    var f = -gov * HALF / 12 - free * 20 * 2 * Math.PI;
    var tt = gov * HALF / 96 + free * 10 * 2 * Math.PI;
    var c = -gov * HALF / 720 - free * 4 * 2 * Math.PI;
    var b = gov * HALF / 4320 + free * .75 * 2 * Math.PI;
    /* a wound spring: 1, run down: ~0.12. Rewound out of shot as the camera dives */
    var wound = t < FREE0 ? 1 : t < 12.35 ? 1 - .88 * free : lerp(.12, 1, eio(seg(t, 12.35, 12.9)));
    return { gov: gov, free: free, e: e, f: f, t: tt, c: c, b: b, wound: wound, spin: Math.sin(Math.PI * seg(t, FREE0, FREE1)) };
  }
  /* small seconds on the dial: 0.75 degrees a beat (6 a second) */
  function secondsHand(t) {
    /* while the dial is off (6 - 33 s) the hand is quietly set back, so the last frame matches the first and the clip loops */
    var x = tau(t), k = t > 20 ? -(beats(tau(DUR)) - beats(tau(0))) * .75 : 0;
    return (beats(x) * .75 + 180 + k) * D2R;
  }

  /* ---------- camera: [t, cx, cy, zoom] keys, eased in-out between them ---------- */
  var CAM = [
    [0, 0, 150, 3.6], [.9, 0, 150, 3.45], [2.3, 0, 20, 1.17], [4.6, 0, 20, 1.22], [6.2, -40, -10, 1.26], [7.2, -120, -55, 1.85], [9.5, -128, -55, 1.95],
    [10.0, -20, 40, 1.55], [11.8, -10, 40, 1.5], [12.8, 112, 168, 3.15], [19.0, 112, 168, 3.15],
    [20.4, 186, 128, 2.55], [26.0, 190, 124, 2.65], [27.6, 60, 45, 1.36], [32.4, 60, 40, 1.42], [34.0, 0, 20, 1.17], [36.4, 0, 20, 1.2], [38.5, 0, 150, 3.6]   /* ends on the macro it opened on: it loops */
  ];
  function cam(t) {
    for (var i = 1; i < CAM.length; i++) if (t <= CAM[i][0]) {
      var a = CAM[i - 1], b = CAM[i], k = eio(seg(t, a[0], b[0]));
      var z = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), k));
      z *= 1 + .12 * Math.sin(Math.PI * seg(t, FREE0, FREE0 + .32));   // the release punches in
      return { x: lerp(a[1], b[1], k), y: lerp(a[2], b[2], k), z: z };
    }
    var l = CAM[CAM.length - 1]; return { x: l[1], y: l[2], z: l[3] };
  }
  function toScreen(c, p) { return { x: SX + (p.x - c.x) * c.z, y: SY + (p.y - c.y) * c.z }; }
  /* the dial: on at the start, lifts toward the lens 4.7 - 6.2 s, drops back 33.0 - 34.2 s */
  function dialLift(t) {
    if (t < 4.7) return 0;
    if (t < 33.0) return eio(seg(t, 4.7, 6.1));
    return 1 - eoc(seg(t, 33.0, 34.15));
  }

  /* ---------- captions (one read at a time; *word* = the key word, in ruby) ---------- */
  var CUES = [
    { id: 'c1', size: 104, y: 380, t: .15, out: 4.7, text: 'No battery.' },
    { id: 'c2', size: 62, y: 500, t: .7, out: 4.7, text: 'So what counts the *seconds?*' },
    { id: 'c3', size: 76, y: 400, t: 6.0, out: 9.15, text: '1. A wound *spring.*' },
    { id: 'c4', size: 76, y: 400, t: 9.4, out: 13.05, text: 'Let go: gone in a *second.*' },
    { id: 'c5', size: 66, y: 390, t: 13.3, out: 19.45, text: '2. A *fork* lets it move one tooth at a time.' },
    { id: 'c6', size: 70, y: 400, t: 19.72, out: 24.0, text: '3. A *balance wheel* sets the beat.' },
    { id: 'c7', size: 70, y: 400, t: 24.3, out: 28.7, text: '4 round trips a second. *Always.*' },
    { id: 'c8', size: 76, y: 400, t: 29.0, out: 33.05, text: 'Spring pushes. *Balance* counts.' },
    { id: 'c9', size: 104, y: 380, t: 34.1, out: 38.05, text: 'That’s a *second.*' },
    { id: 'c10', size: 62, y: 500, t: 34.45, out: 38.05, text: 'A spring and a wobble.' }
  ];
  var STAGGER = .06;
  CUES.forEach(function (q) {
    q.words = q.text.split(' ').map(function (w, i) {
      var key = /^\*.*\*?$/.test(w) || /\*$/.test(w);
      return { s: w.replace(/\*/g, ''), key: key, t: q.t + i * STAGGER };
    });
    /* a multi-word key like *balance wheel* marks every word between the stars */
    var on = false; q.words.forEach(function (w, i) { var raw = q.text.split(' ')[i]; if (raw[0] === '*') on = true; w.key = on; if (raw[raw.length - 1] === '*' || /\*[.?!,]?$/.test(raw)) on = false; });
  });
  /* part labels with leader lines: world point, label offset in screen px */
  var LABELS = [
    { t0: 6.7, t1: 9.15, text: 'MAINSPRING', p: function () { return pol(B, 70, -2.2); }, dx: -150, dy: -190 },
    { t0: 13.2, t1: 19.25, text: 'ESCAPE WHEEL', p: function () { return pol(E, 30, 2.6); }, dx: -250, dy: 150 },
    { t0: 13.6, t1: 19.25, text: 'PALLET FORK', p: function () { return P; }, dx: -60, dy: -330 },
    { t0: 14.5, t1: 19.25, text: 'RUBY PALLET', p: function (t) { return stonePos(t, 0); }, dx: -330, dy: 40 },
    { t0: 20.6, t1: 26.0, text: 'BALANCE WHEEL', p: function () { return pol(BAL, 97, -2.0); }, dx: -130, dy: -115 },
    { t0: 21.0, t1: 26.0, text: 'HAIRSPRING', p: function () { return pol(BAL, 40, 1.3); }, dx: -60, dy: 330 }
  ];

  /* ---------- sound events (beats on screen produce clicks) ---------- */
  var EV = [];
  (function () {
    var x0 = tau(0), x1 = tau(DUR);
    for (var m = Math.ceil(x0 / BEAT); m * BEAT < x1; m++) {
      var tm = tinv(m * BEAT);
      if (!ticking(tm)) continue;
      EV.push({ t: tinv(m * BEAT - LOCKW), type: 'unlock', r: rate(tm), m: m });
      EV.push({ t: tm, type: 'impulse', r: rate(tm), m: m });
      EV.push({ t: tinv(m * BEAT + LOCKW), type: 'drop', r: rate(tm), m: m });
    }
    EV.push({ t: FREE0, type: 'release' }, { t: 34.15, type: 'land' }, { t: 4.75, type: 'lift' }, { t: IN0 + .5, type: 'seat' });
    EV.sort(function (a, b) { return a.t - b.t; });
  })();

  /* ---------- drawing helpers ---------- */
  var cv, ctx, tmp, tctx, acc, actx, NOISE, VIG, LAY = {};
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var LIVE = { grain: true, text: true };
  function gearPath(g, c, R, n, a, depth, spokes, hub) {
    var h = depth || R * .07, wTop = .26, wRoot = .38, step = 2 * Math.PI / n;
    g.beginPath();
    for (var i = 0; i < n; i++) {
      var b = a + i * step;
      var p1 = pol(c, R - h, b - step * wRoot), p2 = pol(c, R, b - step * wTop), p3 = pol(c, R, b + step * wTop), p4 = pol(c, R - h, b + step * wRoot);
      if (i === 0) g.moveTo(p1.x, p1.y); else g.lineTo(p1.x, p1.y);
      g.lineTo(p2.x, p2.y); g.lineTo(p3.x, p3.y); g.lineTo(p4.x, p4.y);
    }
    g.closePath();
    if (spokes) {                                   // windows between the crossings
      var ri = hub || R * .22, ro = R - h - R * .1, sw = .17;
      for (i = 0; i < spokes; i++) {
        var s0 = a + i * 2 * Math.PI / spokes + sw * (R / ro), s1 = a + (i + 1) * 2 * Math.PI / spokes - sw * (R / ro);
        var q = pol(c, ro, s0); g.moveTo(q.x, q.y); g.arc(c.x, c.y, ro, s0, s1);
        g.arc(c.x, c.y, ri, s1 - sw * .9, s0 + sw * .9, true); g.closePath();
      }
    }
  }
  function shadowed(g, z, fn, lift) {
    g.save(); g.shadowColor = 'rgba(40,34,24,.28)'; g.shadowBlur = (lift || 10) * z * .9; g.shadowOffsetX = (lift || 10) * z * .25; g.shadowOffsetY = (lift || 10) * z * .55; fn(); g.restore();
  }
  function metal(g, c, R, a, light, dark) {
    var gr = g.createLinearGradient(c.x - R, c.y - R, c.x + R, c.y + R);
    gr.addColorStop(0, light || '#e3e1db'); gr.addColorStop(.55, dark || '#bdbab3'); gr.addColorStop(1, light || '#d6d3cc');
    return gr;
  }
  function wheel(g, z, c, R, n, a, spokes, pin) {
    shadowed(g, z, function () { gearPath(g, c, R, n, a, null, spokes); g.fillStyle = metal(g, c, R, a); g.fill('evenodd'); }, 8);
    g.lineWidth = 1.6 / z; g.strokeStyle = INK; gearPath(g, c, R, n, a, null, spokes); g.stroke();
    /* sunray brushing: a few faint radial lines turning with the wheel */
    g.save(); g.globalAlpha = .08; g.beginPath();
    for (var i = 0; i < 36; i++) { var p = pol(c, R * .3, a + i * .1745), q = pol(c, R * .8, a + i * .1745); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); }
    g.lineWidth = .8 / z; g.stroke(); g.restore();
    if (pin) { gearPath(g, c, pin, Math.max(7, Math.round(pin / 2.2)), -a * 3, pin * .3); g.fillStyle = '#d9d6cf'; g.fill(); g.lineWidth = 1.2 / z; g.stroke(); }
    jewel(g, z, c, Math.max(4.5, R * .07));
  }
  function jewel(g, z, c, r) {
    g.save();
    g.beginPath(); g.arc(c.x, c.y, r * 1.9, 0, 7); g.fillStyle = '#d2cfc8'; g.fill(); g.lineWidth = 1 / z; g.strokeStyle = INK; g.stroke();
    var jg = g.createRadialGradient(c.x - r * .35, c.y - r * .35, r * .1, c.x, c.y, r);
    jg.addColorStop(0, '#ff6b7d'); jg.addColorStop(.5, RUBY); jg.addColorStop(1, '#6d0716');
    g.beginPath(); g.arc(c.x, c.y, r, 0, 7); g.fillStyle = jg; g.fill();
    g.beginPath(); g.arc(c.x, c.y, r * .32, 0, 7); g.fillStyle = '#2a0a0f'; g.fill();
    g.restore();
  }
  function escapeTeeth(g, a) {                    /* Swiss club teeth: a slanted flank, a flat impulse face at the tip */
    var c = E, R = 58;
    g.beginPath();
    for (var i = 0; i < 20; i++) {
      var b = a + i * PITCH;
      var p1 = pol(c, 40, b - 10 * D2R), p2 = pol(c, R, b - 1 * D2R), p3 = pol(c, R - 1, b + 3 * D2R), p4 = pol(c, R - 6, b + 5 * D2R), p5 = pol(c, 40, b + 3 * D2R);
      if (i === 0) g.moveTo(p1.x, p1.y); else g.lineTo(p1.x, p1.y);
      g.lineTo(p2.x, p2.y); g.lineTo(p3.x, p3.y); g.lineTo(p4.x, p4.y); g.lineTo(p5.x, p5.y);
    }
    g.closePath();
  }
  function escapeWheel(g, z, a) {
    var c = E, R = 58;
    function path() {
      escapeTeeth(g, a);
      for (var i = 0; i < 4; i++) {
        var s0 = a + i * Math.PI / 2 + .3, s1 = a + (i + 1) * Math.PI / 2 - .3, q = pol(c, 33, s0);
        g.moveTo(q.x, q.y); g.arc(c.x, c.y, 33, s0, s1); g.arc(c.x, c.y, 10, s1 - .2, s0 + .2, true); g.closePath();
      }
    }
    shadowed(g, z, function () { path(); g.fillStyle = metal(g, c, R, a, '#e8e6e0', '#b5b2ab'); g.fill('evenodd'); }, 6);
    g.lineWidth = 1.4 / z; g.strokeStyle = INK; path(); g.stroke();
    gearPath(g, c, 9, 7, -a * 1.5, 3); g.fillStyle = '#d9d6cf'; g.fill(); g.lineWidth = 1 / z; g.stroke();
    jewel(g, z, c, 3.6);
  }
  /* pallet stones: 0 = entry (A), 1 = exit (B). Returns the stone's centre at time t */
  function rot(p, c, a) { var dx = p.x - c.x, dy = p.y - c.y, cs = Math.cos(a), sn = Math.sin(a); return { x: c.x + dx * cs - dy * sn, y: c.y + dx * sn + dy * cs }; }
  function stonePos(t, i) { return rot(pol(E, 60, i ? STONE_B : STONE_A), P, forkAngle(tau(t))); }
  function fork(g, z, phi) {
    var a = pol(E, 60, STONE_A), b = pol(E, 60, STONE_B), tail = pol(P, 84, ang(P, BAL));
    var horn1 = pol(tail, 9, ang(P, BAL) + Math.PI / 2), horn2 = pol(tail, 9, ang(P, BAL) - Math.PI / 2);
    g.save(); g.translate(P.x, P.y); g.rotate(phi); g.translate(-P.x, -P.y);
    function body() {
      g.beginPath();
      g.moveTo(a.x, a.y); g.lineTo(P.x, P.y); g.lineTo(b.x, b.y);
      g.moveTo(P.x, P.y); g.lineTo(tail.x, tail.y);
      g.moveTo(horn1.x, horn1.y); g.quadraticCurveTo(pol(tail, 4, ang(P, BAL)).x, pol(tail, 4, ang(P, BAL)).y, horn2.x, horn2.y);
    }
    shadowed(g, z, function () { body(); g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 9; g.strokeStyle = '#c3c0b9'; g.stroke(); }, 7);
    body(); g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 9 + 2.6 / z; g.strokeStyle = INK; g.stroke();
    body(); g.lineWidth = 9 - 2.6 / z; g.strokeStyle = '#d4d1ca'; g.stroke();
    [[a, STONE_A], [b, STONE_B]].forEach(function (s) {                 // the two rubies
      var c = s[0], th = s[1];
      g.save(); g.translate(c.x, c.y); g.rotate(th);
      var rg = g.createLinearGradient(-9, 0, 9, 0); rg.addColorStop(0, '#ff5c70'); rg.addColorStop(.5, RUBY); rg.addColorStop(1, '#7a0919');
      g.fillStyle = rg; g.fillRect(-9, -3.6, 18, 7.2); g.lineWidth = 1 / z; g.strokeStyle = '#3a060d'; g.strokeRect(-9, -3.6, 18, 7.2);
      g.globalAlpha = .55; g.fillStyle = '#fff'; g.fillRect(-7, -2.6, 9, 1.2);
      g.restore();
    });
    jewel(g, z, P, 3.4);
    g.restore();
  }
  function balance(g, z, th, t) {
    var c = BAL, R = 95;
    /* hairspring first (under the wheel's arms, over the plate) */
    var out = 46, inn = 10, turns = 11, base = ang(BAL, P) + Math.PI;
    g.save(); g.beginPath();
    for (var k = 0; k <= turns * 48; k++) {
      var f = k / (turns * 48), r = inn + (out - inn) * f, a = base + f * turns * 2 * Math.PI + th * (1 - f);
      var p = pol(c, r, a); if (k === 0) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y);
    }
    g.lineWidth = 1.15 / Math.max(1, z * .55); g.strokeStyle = '#3d4a63'; g.globalAlpha = .9; g.stroke(); g.restore();
    var stud = pol(c, out, base); g.beginPath(); g.arc(stud.x, stud.y, 3.2, 0, 7); g.fillStyle = INK; g.fill();
    g.save(); g.translate(c.x, c.y); g.rotate(th); g.translate(-c.x, -c.y);
    function rim() {
      g.beginPath(); g.arc(c.x, c.y, R, 0, 7); g.arc(c.x, c.y, R - 9, 0, 7, true);
      for (var i = 0; i < 3; i++) {                   // three arms
        var a = i * 2 * Math.PI / 3 + .2, w = .07;
        var p1 = pol(c, 12, a - w * 3), p2 = pol(c, R - 8, a - w), p3 = pol(c, R - 8, a + w), p4 = pol(c, 12, a + w * 3);
        g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.lineTo(p3.x, p3.y); g.lineTo(p4.x, p4.y); g.closePath();
      }
    }
    shadowed(g, z, function () { rim(); g.fillStyle = metal(g, c, R, th, '#ece9e2', '#b8b4ab'); g.fill('nonzero'); }, 12);
    rim(); g.lineWidth = 1.4 / z; g.strokeStyle = INK; g.stroke();
    for (var i = 0; i < 18; i++) {                    // timing screws on the rim
      var s = pol(c, R + 3.5, i * Math.PI / 9 + .1);
      g.beginPath(); g.arc(s.x, s.y, 4.4, 0, 7); g.fillStyle = i % 3 ? '#cfccc5' : '#a9a59c'; g.fill(); g.lineWidth = 1 / z; g.stroke();
      g.beginPath(); var q = pol(s, 3.2, i), q2 = pol(s, 3.2, i + Math.PI); g.moveTo(q.x, q.y); g.lineTo(q2.x, q2.y); g.stroke();
    }
    /* roller table and its ruby pin, which kicks the fork as the wheel swings through */
    var rt = ang(BAL, P);
    g.beginPath(); g.arc(c.x, c.y, 26, 0, 7); g.fillStyle = '#dedbd4'; g.fill(); g.lineWidth = 1.2 / z; g.stroke();
    var pin = pol(c, 23, rt);
    g.beginPath(); g.arc(pin.x, pin.y, 3.3, 0, 7); g.fillStyle = RUBY; g.fill(); g.lineWidth = .8 / z; g.stroke();
    jewel(g, z, c, 4);
    g.restore();
  }
  function barrel(g, z, a, wound, spin) {
    var c = B, R = 125;
    shadowed(g, z, function () { gearPath(g, c, R, 84, a, 6); g.fillStyle = metal(g, c, R, a); g.fill(); }, 9);
    gearPath(g, c, R, 84, a, 6); g.lineWidth = 1.6 / z; g.strokeStyle = INK; g.stroke();
    /* cut-away: the drum is open so the spring shows */
    g.beginPath(); g.arc(c.x, c.y, R - 13, 0, 7);
    var dg = g.createRadialGradient(c.x, c.y, 10, c.x, c.y, R - 13); dg.addColorStop(0, '#d8d4cb'); dg.addColorStop(1, '#bdb8ae');
    g.fillStyle = dg; g.fill(); g.lineWidth = 1.2 / z; g.stroke();
    var turns = lerp(5.5, 11, wound), rIn = 21, rOut = lerp(R - 17, 68, wound), pw = lerp(.55, 1.15, wound), arb = a * 6 - (1 - wound) * 14;
    g.beginPath();
    for (var k = 0; k <= turns * 60; k++) {
      var f = k / (turns * 60), r = rIn + (rOut - rIn) * Math.pow(f, pw), th = arb + f * turns * 2 * Math.PI;
      var p = pol(c, r, th); if (k === 0) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y);
    }
    g.lineWidth = lerp(3.2, 2.4, 1 - wound); g.strokeStyle = '#4b4a47'; g.stroke();
    g.lineWidth = .8 / z; g.strokeStyle = 'rgba(255,255,255,.5)'; g.stroke();
    /* arbor with its square for the winding stem */
    g.beginPath(); g.arc(c.x, c.y, 19, 0, 7); g.fillStyle = '#cfccc5'; g.fill(); g.lineWidth = 1.2 / z; g.strokeStyle = INK; g.stroke();
    g.save(); g.translate(c.x, c.y); g.rotate(arb); g.fillStyle = '#8f8b83'; g.fillRect(-7, -7, 14, 14); g.restore();
  }
  function plate(g, z) {
    g.save();
    shadowed(g, z, function () { g.beginPath(); g.arc(0, 0, PLATE_R, 0, 7); g.fillStyle = '#dcd8cf'; g.fill(); }, 16);
    g.beginPath(); g.arc(0, 0, PLATE_R, 0, 7); g.clip();
    /* perlage: overlapping grained circles */
    for (var i = 0; i < 260; i++) {
      var col = i % 26, row = Math.floor(i / 26), x = -PLATE_R + col * 30 + (row % 2) * 15, y = -PLATE_R + row * 76 + (col % 2) * 8;
      var pg = g.createRadialGradient(x - 6, y - 6, 2, x, y, 26);
      pg.addColorStop(0, 'rgba(255,255,255,.13)'); pg.addColorStop(.7, 'rgba(255,255,255,0)'); pg.addColorStop(1, 'rgba(90,80,64,.05)');
      g.fillStyle = pg; g.beginPath(); g.arc(x, y, 26, 0, 7); g.fill();
    }
    g.restore();
    g.beginPath(); g.arc(0, 0, PLATE_R, 0, 7); g.lineWidth = 1.6 / z; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.arc(0, 0, PLATE_R - 10, 0, 7); g.lineWidth = .8 / z; g.strokeStyle = 'rgba(27,27,26,.35)'; g.stroke();
    /* screws */
    [[-250, 230], [270, -230], [-230, -280], [300, 190]].forEach(function (s, i) {
      g.beginPath(); g.arc(s[0], s[1], 9, 0, 7); g.fillStyle = '#7d8aa5'; g.fill(); g.lineWidth = 1 / z; g.strokeStyle = INK; g.stroke();
      g.beginPath(); var q = pol({ x: s[0], y: s[1] }, 7, i * .7), q2 = pol({ x: s[0], y: s[1] }, 7, i * .7 + Math.PI); g.moveTo(q.x, q.y); g.lineTo(q2.x, q2.y); g.lineWidth = 2 / z; g.stroke();
    });
  }
  function dial(g, z, t) {
    var R = 368;
    shadowed(g, z, function () { g.beginPath(); g.arc(0, 0, R, 0, 7); g.fillStyle = '#f7f5f0'; g.fill(); }, 14 + 40 * dialLift(t));
    var dg = g.createRadialGradient(-80, -120, 20, 0, 0, R); dg.addColorStop(0, '#fbfaf6'); dg.addColorStop(1, '#ebe7de');
    g.beginPath(); g.arc(0, 0, R, 0, 7); g.fillStyle = dg; g.fill(); g.lineWidth = 2 / z; g.strokeStyle = INK; g.stroke();
    /* minute track and baton indices */
    for (var i = 0; i < 60; i++) {
      var a = i * Math.PI / 30 - Math.PI / 2, big = i % 5 === 0;
      if (big) {
        g.save(); g.translate(Math.cos(a) * 300, Math.sin(a) * 300); g.rotate(a + Math.PI / 2);
        g.fillStyle = INK; g.fillRect(-5, i === 0 ? -34 : -20, 10, i === 0 ? 62 : 44); if (i === 0) g.fillRect(-16, -34, 8, 62), g.fillRect(8, -34, 8, 62);
        g.restore();
      } else { var p = pol(C, 340, a), q = pol(C, 352, a); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.lineWidth = 2; g.strokeStyle = INK; g.stroke(); }
    }
    g.fillStyle = INK; g.textAlign = 'center';
    g.font = '700 30px Archivo'; g.letterSpacing = '9px'; g.fillText('HALDEN', 0, -150);
    g.font = '400 15px "Geist Mono"'; g.letterSpacing = '5px'; g.fillStyle = 'rgba(27,27,26,.6)'; g.fillText('MECHANICAL · 28 800 A/H', 4, -118);
    g.letterSpacing = '0px';
    /* small seconds */
    g.beginPath(); g.arc(F.x, F.y, 78, 0, 7); g.fillStyle = 'rgba(0,0,0,.035)'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(27,27,26,.5)'; g.stroke();
    for (i = 0; i < 60; i++) { var b = i * Math.PI / 30, p1 = pol(F, i % 5 ? 70 : 62, b), p2 = pol(F, 76, b); g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.lineWidth = i % 5 ? .8 : 1.8; g.strokeStyle = INK; g.stroke(); }
    var sh = secondsHand(t);
    g.save(); g.translate(F.x, F.y); g.rotate(sh);
    shadowed(g, z, function () { g.beginPath(); g.moveTo(-1.6, 18); g.lineTo(-1.1, -68); g.lineTo(1.1, -68); g.lineTo(1.6, 18); g.closePath(); g.fillStyle = RUBY; g.fill(); }, 3);
    g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fillStyle = RUBY; g.fill();
    g.restore();
    /* hour and minute: 10:09 */
    function hand(a, L, w) {
      g.save(); g.rotate(a);
      shadowed(g, z, function () { g.beginPath(); g.moveTo(0, 26); g.lineTo(-w, 0); g.lineTo(0, -L); g.lineTo(w, 0); g.closePath(); g.fillStyle = '#2a2a28'; g.fill(); }, 6);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -L); g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,255,255,.55)'; g.stroke();
      g.restore();
    }
    var x = tau(t), mn = (9 + x / 60) * 6 * D2R;
    hand((10 + (9 + x / 60) / 60) * 30 * D2R, 200, 13);
    hand(mn, 300, 10);
    g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fillStyle = '#2a2a28'; g.fill();
  }

  /* ---------- frame ---------- */
  function frame(g, t) {
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var c = cam(t), z = c.z, tr = train(t), lift = dialLift(t), reg = regulatorIn(t), x = tau(t);
    g.setTransform(z, 0, 0, z, SX - c.x * z, SY - c.y * z);
    if (lift > 0) {
      plate(g, z);
      barrel(g, z, tr.b, tr.wound, tr.spin);
      wheel(g, z, C, 95, 80, tr.c, 5, 20);
      wheel(g, z, T, 80, 70, tr.t, 5, 14);
      wheel(g, z, F, 70, 64, tr.f, 4, 12);
      escapeWheel(g, z, tr.e);
      var drawReg = function () {                     /* the regulating organ lifts out and drops back in */
        var s = 1 + (1 - reg) * .45, ox = (1 - reg) * 60, oy = -(1 - reg) * 140;
        g.save(); g.globalAlpha = clamp(reg * 1.6, 0, 1);
        g.translate(P.x + ox, P.y + oy); g.scale(s, s); g.translate(-P.x, -P.y);
        var phi = t < IN0 ? forkAngle(tau(Math.min(t, 4.9))) : forkAngle(x);
        fork(g, z * s, phi);
        g.restore();
        g.save(); g.globalAlpha = clamp(reg * 1.6, 0, 1);
        g.translate(BAL.x + ox * 1.4, BAL.y + oy * 1.3); g.scale(s, s); g.translate(-BAL.x, -BAL.y);
        balance(g, z * s, t < IN0 ? balanceAngle(tau(Math.min(t, 4.9))) : balanceAngle(x), t);
        g.restore();
      };
      if (reg > 0) drawReg();
      /* focus: wash the rest back toward paper and redraw the part being explained on top */
      var fs = seg(t, 6.4, 7.0) * (1 - seg(t, 9.2, 9.7)), fe = seg(t, 12.5, 13.1) * (1 - seg(t, 26.3, 27.2));
      if (fs > 0 || fe > 0) {
        g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = .76 * Math.max(fs, fe); g.fillStyle = BG; g.fillRect(0, 0, W, H); g.restore();
        if (fs > 0) barrel(g, z, tr.b, tr.wound, tr.spin);
        if (fe > 0) {
          var gk = Math.max(0, Math.ceil(tr.gov - 1e-6) - 1), ghost = PSI0 + gk * HALF + tr.free * 40 * 2 * Math.PI;
          g.save(); g.globalAlpha = .4 * fe; escapeTeeth(g, ghost); g.setLineDash([5 / z, 4 / z]); g.lineWidth = 1.4 / z; g.strokeStyle = RUBY; g.stroke(); g.restore();
          escapeWheel(g, z, tr.e); if (reg > 0) drawReg();
        }
      }
    }
    if (lift < 1) {                                   /* the dial lifts toward the lens */
      var k = lift;
      g.save(); g.globalAlpha = 1 - ss(seg(k, .35, 1));
      g.translate(0, -k * 260); g.scale(1 + k * .9, 1 + k * .9); g.rotate(-k * .12);
      dial(g, z * (1 + k * .9), t);
      g.restore();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    var band = g.createLinearGradient(0, 180, 0, 760);
    band.addColorStop(0, 'rgba(238,234,226,0)'); band.addColorStop(.18, 'rgba(238,234,226,.9)'); band.addColorStop(.7, 'rgba(238,234,226,.82)'); band.addColorStop(1, 'rgba(238,234,226,0)');
    g.fillStyle = band; g.fillRect(0, 180, W, 580);
    if (LIVE.text) { drawLabels(g, t, c); drawTicks(g, t, c); drawReadout(g, t); drawCues(g, t); }
    g.globalAlpha = 1; g.drawImage(VIG, 0, 0);
    if (LIVE.grain) {
      var r = mulberry(Math.floor(t * 24) + 1); g.globalAlpha = .05; g.globalCompositeOperation = 'multiply';
      var ox2 = -Math.floor(r() * 256), oy2 = -Math.floor(r() * 256);
      for (var yy = oy2; yy < H; yy += 256) for (var xx = ox2; xx < W; xx += 256) g.drawImage(NOISE, xx, yy);
    }
    g.restore();
  }
  function drawLabels(g, t, c) {
    LABELS.forEach(function (L) {
      if (t < L.t0 || t > L.t1 + .4) return;
      var k = eo(seg(t, L.t0, L.t0 + .6)), out = 1 - seg(t, L.t1, L.t1 + .35);
      var p = toScreen(c, L.p(t)), q = { x: p.x + L.dx, y: p.y + L.dy };
      q.x = clamp(q.x, 90, 900);
      g.save(); g.globalAlpha = out;
      g.strokeStyle = INK; g.lineWidth = 2;
      g.beginPath(); g.arc(p.x, p.y, 9 * k, 0, 7); g.stroke();
      g.beginPath(); g.arc(p.x, p.y, 3, 0, 7); g.fillStyle = INK; g.fill();
      var m = { x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k) };
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(m.x, m.y); g.stroke();
      g.font = '500 30px "Geist Mono"'; g.letterSpacing = '3px';
      var w = g.measureText(L.text).width, right = q.x + w + 36 > 930;
      var tx = right ? q.x - w - 18 : q.x + 18;
      var tk = seg(t, L.t0 + .35, L.t0 + .75);
      g.globalAlpha = out * tk;
      g.fillStyle = 'rgba(238,234,226,.9)'; g.fillRect(tx - 10, q.y - 26, w + 20, 40);
      g.fillStyle = INK; g.fillText(L.text, tx, q.y + 4);
      g.letterSpacing = '0px'; g.restore();
    });
  }
  /* tick / tock on each lock in slow motion, by the stone that caught the tooth */
  function drawTicks(g, t, c) {
    if (t < IN1 || t > 27.0) return;
    var x = tau(t), m = Math.floor(x / BEAT + .5);
    for (var j = m - 1; j <= m; j++) {
      var tl = tinv(j * BEAT + LOCKW), age = t - tl;
      if (age < 0 || age > 1.1) continue;
      var st = stonePos(t, j % 2 === 0 ? 0 : 1), p = toScreen(c, st), k = eo(seg(age, 0, .3));
      var a = (1 - seg(age, .7, 1.1)) * seg(t, IN1, IN1 + .3) * (1 - seg(t, 26.3, 27.0));
      g.save(); g.globalAlpha = a; g.fillStyle = RUBY; g.font = '500 40px "Geist Mono"'; g.letterSpacing = '2px'; g.textAlign = 'center';
      var dx = j % 2 === 0 ? -150 : 130, dy = j % 2 === 0 ? -40 : 90;
      var wd = j % 2 === 0 ? 'tick' : 'tock', tx = clamp(p.x + dx, 120, 880), ty = p.y + dy - k * 14, ww = g.measureText(wd).width;
      g.fillStyle = 'rgba(238,234,226,.92)'; g.fillRect(tx - ww / 2 - 12, ty - 36, ww + 24, 50); g.fillStyle = RUBY;
      g.fillText(wd, tx, ty);
      g.letterSpacing = '0px'; g.restore();
    }
  }
  function drawReadout(g, t) {
    var a1 = seg(t, 12.0, 12.4) * (1 - seg(t, 27.4, 27.8)), a2 = seg(t, 27.6, 28.0) * (1 - seg(t, 32.6, 33.0));
    g.save(); g.font = '500 30px "Geist Mono"'; g.letterSpacing = '3px'; g.textAlign = 'left';
    if (a1 > 0) {
      g.globalAlpha = a1; g.fillStyle = 'rgba(27,27,26,.55)'; g.fillText('SPEED', 90, 640);
      g.fillStyle = INK; g.font = '500 44px "Geist Mono"'; g.fillText(rate(t).toFixed(2) + '×', 90, 694);
    }
    if (a2 > 0) {
      var x2 = tau(t), bi = Math.floor(x2 / BEAT + .5) % 8, r0 = 560 - 7 * 46;
      for (var d = 0; d < 8; d++) {
        var on = d <= bi, lit = d === bi;
        g.globalAlpha = a2 * (on ? 1 : .25); g.fillStyle = lit ? RUBY : INK;
        g.beginPath(); g.arc(r0 + d * 92 - 20, 1500, lit ? 17 : 13, 0, 7); g.fill();
      }
      g.globalAlpha = a2; g.fillStyle = 'rgba(27,27,26,.6)'; g.textAlign = 'center'; g.font = '500 30px "Geist Mono"'; g.fillText('8 BEATS EVERY SECOND', 520, 1580); g.textAlign = 'left';
      g.globalAlpha = a2; g.fillStyle = 'rgba(27,27,26,.55)'; g.font = '500 30px "Geist Mono"'; g.fillText('BEATS AN HOUR', 90, 640);
      var n = Math.round(28800 * eoc(seg(t, 27.6, 28.9))), s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      g.fillStyle = INK; g.font = '500 44px "Geist Mono"'; g.fillText(s, 90, 694);
    }
    g.letterSpacing = '0px'; g.restore();
  }
  function layout(g, q) {
    if (LAY[q.id]) return LAY[q.id];
    g.save(); g.font = '800 ' + q.size + 'px Archivo'; g.letterSpacing = (-.01 * q.size) + 'px';
    var sp = g.measureText(' ').width, lines = [[]], lw = [0], maxW = 900;
    q.words.forEach(function (w) {
      w.w = g.measureText(w.s).width;
      var L = lines.length - 1, nw = lw[L] + (lines[L].length ? sp : 0) + w.w;
      if (nw > maxW && lines[L].length) { lines.push([w]); lw.push(w.w); } else { lines[L].push(w); lw[L] = nw; }
    });
    var lh = q.size * 1.08, x0 = 1e9, x1 = -1e9;
    lines.forEach(function (ln, i) {
      var x = SX - lw[i] / 2; x0 = Math.min(x0, x); x1 = Math.max(x1, x + lw[i]);
      ln.forEach(function (w) { w.x = x; w.y = q.y + i * lh; x += w.w + sp; });
    });
    g.restore();
    return (LAY[q.id] = { x0: x0, x1: x1, y0: q.y - q.size, y1: q.y + (lines.length - 1) * lh + q.size * .25, n: lines.length });
  }
  function drawCues(g, t) {
    CUES.forEach(function (q) {
      if (t < q.t || t > q.out + .35) return;
      layout(g, q);
      var outK = eio(seg(t, q.out, q.out + .3));
      g.save(); g.font = '800 ' + q.size + 'px Archivo'; g.letterSpacing = (-.01 * q.size) + 'px'; g.textAlign = 'left';
      q.words.forEach(function (w) {
        var k = spring(t - w.t, 2.6, .78); if (k <= 0) return;
        var a = clamp((t - w.t) / .16, 0, 1) * (1 - outK);
        g.globalAlpha = a;
        g.fillStyle = w.key ? RUBY : INK;
        g.save(); g.translate(w.x + w.w / 2, w.y + (1 - k) * 26 - outK * 18); var s = .9 + .1 * k; g.scale(s, s);
        g.fillText(w.s, -w.w / 2, 0); g.restore();
      });
      g.letterSpacing = '0px'; g.restore();
    });
  }
  function TEXTS(t) {
    var out = [];
    CUES.forEach(function (q) {
      var last = q.words[q.words.length - 1].t;
      if (t >= last + .45 && t < q.out) { var l = LAY[q.id]; out.push({ id: q.id, text: q.words.map(function (w) { return w.s; }).join(' '), x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1 }); }
    });
    return out;
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { frame(ctx, t); return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- score: same timeline, rendered offline ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 40;
    var shelf = ac.createBiquadFilter(); shelf.type = 'lowshelf'; shelf.frequency.value = 140; shelf.gain.value = -3;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = .005; comp.release.value = .2;
    master.connect(hp); hp.connect(shelf); shelf.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 2.2), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 3.5); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .25; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], pts[0][0]); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], pts[k][0]); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(t0, rnd() * 2, dur); return s; }

    /* a watch beat is three clicks (unlock, impulse, drop). Slowed down, they pitch down and spread apart */
    function click(t, f, g, len, pan) {
      var o = bus(1, .12, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 5;
      var n = noise(t, len + .02); n.connect(bp); bp.connect(o);
      env(o.gain, [[t, 0], [t + .0008, g], [t + len, 0]]);
      var s = ac.createOscillator(), sg = ac.createGain(); s.frequency.value = f * 1.5; s.connect(sg); sg.connect(o);
      env(sg.gain, [[t, 0], [t + .0008, .25], [t + len * .6, 0]]); s.start(t); s.stop(t + len + .02);
    }
    EV.forEach(function (e) {
      var r = e.r || 1, pitch = Math.pow(r, .45), len = .012 / Math.pow(r, .5);
      var vis = e.t < 4.9 || e.t > 33.0 ? 4 : 1;          // the hook and the outro are the watch alone, close to the mic
      if (e.type === 'unlock') click(e.t, 5200 * pitch, .14 * vis, len, -.15);
      if (e.type === 'impulse') click(e.t, 3400 * pitch, .22 * vis, len * 1.2, .1);
      if (e.type === 'drop') click(e.t, 7000 * pitch, .3 * vis, len, .2);
      if (e.type === 'impulse' && (e.t < 4.9 || e.t > 34.2) && e.m % 8 === 0) { var bo = ac.createOscillator(), bg = ac.createGain(); bo.frequency.setValueAtTime(90, e.t); bo.frequency.exponentialRampToValueAtTime(60, e.t + .08); bo.connect(bg); bg.connect(bus(1, 0)); env(bg.gain, [[e.t, 0], [e.t + .003, .16], [e.t + .12, 0]]); bo.start(e.t); bo.stop(e.t + .14); }
    });
    /* lift, seat, land */
    function whoosh(t, dur, g, f0, f1) {
      var o = bus(1, .3), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2; var n = noise(t, dur); n.connect(bp); bp.connect(o);
      env(bp.frequency, [[t, f0], [t + dur, f1]]); env(o.gain, [[t, 0], [t + dur * .6, g], [t + dur, 0]]);
    }
    function thud(t, g) {
      var o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(52, t + .18);
      o.connect(og); og.connect(bus(1, .2)); env(og.gain, [[t, 0], [t + .004, g], [t + .3, 0]]); o.start(t); o.stop(t + .32);
      click(t + .002, 2400, .3, .02, 0);
    }
    pad(0, 4.9, [38, 50, 57], .018, 500); pad(34.15, 38.5, [38, 50, 57], .016, 500);   // a low room under the ticking
    thud(0.02, .45);
    whoosh(4.7, 1.4, .26, 300, 2400); var lr = pad(4.75, 6.3, [62, 69, 74], .04, 300); env(lr.frequency, [[4.75, 300], [6.0, 3200], [6.3, 1200]]);
    whoosh(IN0, .9, .08, 2200, 400); thud(IN0 + .85, .25);
    whoosh(33.0, 1.15, .1, 2400, 300); thud(34.15, .5);
    /* release: the spring lets go, a ratchet whirr that winds down */
    var rel = bus(1, .2), rbp = ac.createBiquadFilter(); rbp.type = 'bandpass'; rbp.Q.value = 2; var rn = noise(FREE0, FREE1 - FREE0 + .2); rn.connect(rbp); rbp.connect(rel);
    env(rbp.frequency, [[FREE0, 2600], [FREE0 + .5, 1800], [FREE1, 300]]); env(rel.gain, [[FREE0, 0], [FREE0 + .03, .5], [FREE0 + .8, .3], [FREE1, 0]]);
    var tr = FREE0, gap = .012; while (tr < FREE1) { click(tr, 2600, .1 * (1 - seg(tr, FREE0, FREE1)), .008, (hash(tr * 9) - .5) * .4); gap *= 1.07; tr += gap; }
    /* music: D, 120 BPM. pluck, pad, bass, kick */
    function pluck(t, m, g, pan) {
      var o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), og = ac.createGain();
      o.type = 'triangle'; o.frequency.value = mtof(m); o2.type = 'sine'; o2.frequency.value = mtof(m + 12);
      f.type = 'lowpass'; env(f.frequency, [[t, 4200], [t + .25, 900]]);
      o.connect(f); o2.connect(f); f.connect(og); og.connect(bus(1, .35, pan));
      env(og.gain, [[t, 0], [t + .004, g], [t + .45, 0]]); o.start(t); o2.start(t); o.stop(t + .5); o2.stop(t + .5);
    }
    function pad(t0, t1, notes, g, cut) {
      var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut || 1400; f.Q.value = .5;
      var hpp = ac.createBiquadFilter(); hpp.type = 'highpass'; hpp.frequency.value = 110; f.connect(hpp);
      var og = ac.createGain(); hpp.connect(og); og.connect(bus(1, .5));
      env(og.gain, [[t0, 0], [t0 + .8, g], [t1 - .6, g], [t1, 0]]);
      notes.forEach(function (m, j) { [-6, 6].forEach(function (dt) { var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt + j; o.connect(f); o.start(t0); o.stop(t1 + .05); }); });
      return f;
    }
    function bass(t, m, dur, g) { var o = ac.createOscillator(), og = ac.createGain(); o.frequency.value = mtof(m); o.connect(og); og.connect(bus(1, 0)); env(og.gain, [[t, 0], [t + .01, g], [t + dur * .8, g * .6], [t + dur, 0]]); o.start(t); o.stop(t + dur + .02); }
    function kick(t, g) { var o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + .12); o.connect(og); og.connect(bus(1, 0)); env(og.gain, [[t, 0], [t + .003, g], [t + .28, 0]]); o.start(t); o.stop(t + .3); }
    function bell(t, m, g, pan) {
      var c = ac.createOscillator(), mo = ac.createOscillator(), mg = ac.createGain(), og = ac.createGain();
      c.frequency.value = mtof(m); mo.frequency.value = mtof(m) * 3.5; mg.gain.value = mtof(m) * 1.2; mo.connect(mg); mg.connect(c.frequency);
      c.connect(og); og.connect(bus(1, .5, pan)); env(og.gain, [[t, 0], [t + .004, g], [t + 2.2, 0]]); c.start(t); mo.start(t); c.stop(t + 2.3); mo.stop(t + 2.3);
    }
    var ARP = [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 69]];     // Dmaj7, Bm7, Gmaj7, A
    var ROOT = [38, 35, 31, 33];
    /* 1 · spring: a soft pluck figure, 6.0 - 9.85 */
    for (var b = 6.0, k2 = 0; b < 9.45; b += .25, k2++) { var ch2 = ARP[Math.floor((b - 6) / 2) % 4]; pluck(b, ch2[k2 % 4] + (k2 % 8 > 3 ? 12 : 0), .07, (k2 % 2 ? .3 : -.3)); }
    pad(6.0, 9.6, [50, 57, 62, 66], .035, 1200);
    for (b = 6.0; b < 9.45; b += 2) bass(b, ROOT[Math.floor((b - 6) / 2) % 4], 1.9, .12);
    /* release: a rising sweep, then the cut into slow motion */
    var rs = pad(FREE0, 12.0, [62, 69, 74], .04, 400); env(rs.frequency, [[FREE0, 400], [11.6, 5000], [11.95, 300]]);
    /* 2 · escapement in slow motion: low-passed pad and a sub drone, the clicks carry it */
    pad(12.1, 19.8, [38, 45, 50, 57], .05, 520);
    bass(12.2, 26, 7, .06);
    /* 3 · balance: at 0.25x the beats fall every 0.5 s, so a bell answers them on the beat */
    var bt = EV.filter(function (e) { return e.type === 'impulse' && e.t > 20.5 && e.t < 26.2; });
    bt.forEach(function (e, j) { if (j % 2 === 0) bell(e.t, [74, 78, 81, 78, 76, 73, 74, 69][(j / 2) % 8], .05, j % 4 ? .2 : -.2); });
    pad(19.6, 27.3, [50, 57, 62, 66, 69], .045, 1500);
    /* real time: ticks are 16ths at 120 BPM; the groove lands on the beat grid the watch sets */
    var grid = EV.filter(function (e) { return e.type === 'impulse' && e.t > 27.25 && e.t < 33.0 && e.m % 4 === 0; }).map(function (e) { return e.t; });
    grid.forEach(function (gt, j) {
      kick(gt, j % 2 ? .22 : .3);
      if (j % 4 === 0) bass(gt, ROOT[(j / 4) % 4], 1.9, .14);
      var ch3 = ARP[Math.floor(j / 4) % 4]; pluck(gt, ch3[j % 4] + 12, .06, j % 2 ? .35 : -.35); pluck(gt + .25, ch3[(j + 2) % 4], .045, j % 2 ? -.3 : .3);
    });
    pad(27.3, 33.1, [50, 57, 62, 66, 69, 76], .05, 2200);
    /* that's a second: one bell, then only the watch */
    bell(34.15, 86, .1, 0); bell(34.17, 81, .06, .2);
    env(master.gain, [[0, .9], [38.3, .9], [38.5, .8]]);
  }

  /* ---------- boot ---------- */
  function buildAssets() {
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 110 + r() * 145; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    VIG = mk(W, H); var vg = VIG.getContext('2d'), gr = vg.createRadialGradient(W / 2, H * .55, H * .25, W / 2, H * .55, H * .75);
    gr.addColorStop(0, 'rgba(60,50,35,0)'); gr.addColorStop(1, 'rgba(60,50,35,.16)'); vg.fillStyle = gr; vg.fillRect(0, 0, W, H);
  }
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    TAU_IN = tau(IN0);
    buildAssets();
    var fonts = ['800 40px Archivo', '500 20px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0'); })).then(function () { return document.fonts.ready; }).then(function () {
      CUES.forEach(function (q) { layout(ctx, q); });
      window.READY = true;
    });
  }
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: 15.95, SLUG: 'one-second', SHOTS: SHOTS, CUES: CUES, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
