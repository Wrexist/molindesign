/* "The Fold-Off" — an experimental 9:16 stickman parody of a big-money YouTube challenge show.
   Built to test the format grammar of the AI "MrBeast AGI challenge" clip that DramaAlert shared (Nov 2026):
   a familiar show format on a topical subject (AI), absurd stakes against a tiny task, three contestants whose
   joke is their stereotype (the yapper, the hallucinator, the over-cautious one), a runner gag that pays off as
   the last line, and a hard cut on nearly every line with shot/reverse-shot coverage, inserts, a CCTV angle and
   name slams. Every character is made up: no real people, brands or companies.
   Built with the motion kit (../kit/kit.js) and cut to the voices (vo/vo.js, written by tools/voiceover.py).
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Pure function of t. */
(function () {
  'use strict';
  var K = window.KIT, C = K.C, W = 1080, H = 1920, INK = C.INK, VO = window.VO;
  var clamp = K.clamp, lerp = K.lerp, seg = K.seg, eo = K.eo, eio = K.eio, pop = K.pop, knock = K.knock, P = K.pose;
  var cv, ctx;
  var CASH = '#3dff7a', CASHD = '#1f9e4a', NEONP = '#ff3dbb', NEONC = '#2fe0ff', STEEL = '#b9c3d1', STEELS = '#8e99aa';
  var LEDS = { yap: '#2fe0ff', dream: '#b78bff', safe: '#ffb02e' };

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function at(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (word == null) return l.t0; if (typeof word === 'number') return l.words[word].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function lend(id) { return LINE[id].t1; }
  /* is this line being spoken right now (with a little tail so the mouth closes after the last word) */
  function talking(ids, t) { ids = [].concat(ids); for (var i = 0; i < ids.length; i++) { var l = LINE[ids[i]]; for (var j = 0; j < l.words.length; j++) if (t >= l.words[j].t0 - .03 && t < l.words[j].t1 + .04) return true; } return false; }

  /* ---------- helpers ---------- */
  function fit(g, s, px, maxW) { var w = K.measure(g, s, px); return w > maxW ? Math.floor(px * maxW / w) : px; }
  function txt(g, s, x, y, px, col, wt, align, fam) { K.font(g, px, wt || 800, fam); g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillStyle = col || C.CREAM; g.fillText(s, x, y); }
  function cam(g, z, cx, cy, sh) { K.applyCam(g, W, H, { z: z, cx: cx == null ? W / 2 : cx, cy: cy == null ? H / 2 : cy, x: sh ? sh.x : 0, y: sh ? sh.y : 0, r: sh ? sh.r : 0 }); }
  /* a slow push on every shot, so no frame is ever still */
  function push(g, t, t0, amt, cx, cy) { cam(g, 1 + (amt || .06) * seg(t, t0, t0 + 2.4), cx, cy); }

  /* ---------- the set: a dark warehouse studio with neon strips and a money pile ---------- */
  function studio(g, t, o) {
    o = o || {}; var px = o.px || 0;
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1a1638'); gr.addColorStop(.6, '#2a2150'); gr.addColorStop(1, '#151229');
    g.fillStyle = gr; g.fillRect(-W, -H, W * 3, H * 3);
    /* back wall panels */
    g.save(); g.translate(px * .3, 0);
    for (var i = -2; i < 9; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.08)'; g.fillRect(i * 160, 180, 150, 980); }
    /* neon strips */
    [[NEONP, 250], [NEONC, 1060]].forEach(function (n, k) {
      var fl = .85 + .15 * Math.sin(t * 9 + k * 2) * (Math.sin(t * 1.3 + k) > .9 ? 1 : 0);
      g.save(); g.globalAlpha = fl; g.shadowColor = n[0]; g.shadowBlur = 40; g.fillStyle = n[0]; g.fillRect(-200, n[1], W + 400, 12); g.restore();
    });
    /* ceiling lights */
    for (var j = 0; j < 4; j++) { g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(70 + j * 270, 120, 140, 10); }
    g.restore();
    if (!o.noMoney) moneyPile(g, W / 2 + px * .5, o.pileY || 1180, o.pileS || 1, t);
    /* floor */
    var fy = o.floor || 1180;
    var fg = g.createLinearGradient(0, fy, 0, H); fg.addColorStop(0, '#3a3166'); fg.addColorStop(1, '#1d1838');
    g.fillStyle = fg; g.fillRect(-W, fy, W * 3, H); g.fillStyle = INK; g.fillRect(-W, fy - 4, W * 3, 8);
    g.save(); g.globalAlpha = .12; g.strokeStyle = '#fff'; g.lineWidth = 3;
    for (var k = -6; k < 14; k++) { g.beginPath(); g.moveTo(W / 2 + (k - 4) * 60 + px, fy); g.lineTo(W / 2 + (k - 4) * 260 + px * 2, H + 200); g.stroke(); }
    g.restore();
  }
  /* bricks of cash stacked into a pyramid */
  function moneyPile(g, x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    var bw = 120, bh = 44, rows = 9;
    for (var r = 0; r < rows; r++) {
      var n = rows - r, x0 = -n * bw / 2;
      for (var c = 0; c < n; c++) {
        var bx = x0 + c * bw, by = -bh * (r + 1);
        K.rr(g, bx + 3, by + 3, bw - 6, bh - 6, 6); K.fillStroke(g, (r + c) % 2 ? '#7ccf8a' : '#6abf79', 4);
        g.fillStyle = '#e8f3df'; g.fillRect(bx + bw / 2 - 12, by + 6, 24, bh - 12);
      }
    }
    /* a glint that crawls over the pile */
    var gx = ((t * 380) % 1600) - 800;
    g.save(); g.globalAlpha = .25; g.fillStyle = '#fff'; g.translate(gx, -200); g.rotate(.5); g.fillRect(-18, -400, 36, 800); g.restore();
    g.restore();
  }
  function table(g, x, y, w) {
    K.rr(g, x - w / 2, y - 20, w, 40, 10); K.fillStroke(g, '#e9e1d2', 7);
    g.fillStyle = INK; g.fillRect(x - w / 2 + 30, y + 20, 14, 240); g.fillRect(x + w / 2 - 44, y + 20, 14, 240);
  }

  /* ---------- the cast (all made up) ---------- */
  var HOST = { col: C.HOOD, shade: C.HOODS, hat: 'cap', capCol: C.YEL, seed: 3 };
  var JUNE = { col: '#b98ad8', shade: '#9466b8', glasses: true, seed: 5 };
  function pose(name, u, o, talk) { var Pp = K.ACT[name].pose(Math.max(0, u), o || {}); if (talk) { Pp.mouth = 'talk'; } return Pp; }
  function host(g, x, y, s, name, u, t, talk, o) { var Pp = pose(name, u, o, talk); K.guy(g, x, y, s, Pp, Object.assign({}, HOST, o || {}), t); return Pp; }
  function june(g, x, y, s, Pp, t, o) {
    o = Object.assign({}, JUNE, o || {});
    /* hair bun behind the head */
    var h = K.head(x, y, s, Pp, o);
    K.circ(g, h[0] - 30 * s * (o.flip ? -1 : 1), h[1] - 52 * s, 30 * s); K.fillStroke(g, '#d9d6e0', 5 * s);
    K.guy(g, x, y, s, Pp, o, t);
    /* grey hair cap over the top of the head */
    g.save(); g.translate(h[0], h[1]); g.scale(s * (o.flip ? -1 : 1), s); g.rotate((Pp.lean || 0) + (Pp.tilt || 0));
    g.beginPath(); g.arc(0, -4, 58, Math.PI * 1.05, -.05); g.quadraticCurveTo(30, -40, 0, -36); g.quadraticCurveTo(-36, -40, -57, -8); g.closePath(); K.fillStroke(g, '#e4e1ea', 5);
    g.restore();
    return h;
  }
  /* a robot: the kit rig in steel with a box head, LED face and antenna */
  function robot(g, x, y, s, Pp, kind, t, talk, o) {
    o = o || {}; var led = LEDS[kind];
    var rig = Object.assign({ col: STEEL, shade: STEELS, legs: '#9aa5b5', seed: kind === 'yap' ? 7 : kind === 'dream' ? 9 : 11, shoe: '#3b3f4f' }, o);
    K.guy(g, x, y, s, Pp, rig, t);
    var h = K.head(x, y, s, Pp, rig), f = rig.flip ? -1 : 1;
    g.save(); g.translate(h[0], h[1]); g.scale(s * f, s); g.rotate((Pp.lean || 0) + (Pp.tilt || 0) * .5);
    /* antenna */
    g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(0, -66); g.lineTo(0, -100); g.stroke();
    var blink = Math.sin(t * 6 + rig.seed) > 0 ? 1 : .35;
    K.circ(g, 0, -106, 12); g.save(); g.globalAlpha = blink; K.fillStroke(g, led, 5); g.restore(); K.circ(g, 0, -106, 12); K.fillStroke(g, null, 5);
    /* head box and screen */
    K.rr(g, -74, -68, 148, 128, 26); K.fillStroke(g, '#dfe5ee', 7);
    K.rr(g, -58, -52, 116, 92, 16); K.fillStroke(g, '#14122a', 5);
    g.save(); g.shadowColor = led; g.shadowBlur = 16; g.fillStyle = led;
    var lx = (Pp.look ? Pp.look[0] : 0) * 8, eyes = Pp.eyes;
    [-1, 1].forEach(function (sd) {
      var ex = sd * 24 + lx, ey = -18;
      if (eyes === 'x') { g.lineWidth = 6; g.strokeStyle = led; g.beginPath(); g.moveTo(ex - 9, ey - 9); g.lineTo(ex + 9, ey + 9); g.moveTo(ex + 9, ey - 9); g.lineTo(ex - 9, ey + 9); g.stroke(); }
      else if (eyes === 'happy') { g.lineWidth = 6; g.strokeStyle = led; g.beginPath(); g.arc(ex, ey + 6, 11, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      else if (eyes === 'star') { K.star(g, ex, ey, 13, 5, .5); g.fill(); }
      else { var bl = ((t + rig.seed) % 3.1) < .1; g.fillRect(ex - 9, ey - (bl ? 2 : 11), 18, bl ? 4 : 22); }
    });
    /* mouth: an equaliser while talking, a flat bar otherwise */
    if (talk) { for (var b = 0; b < 7; b++) { var a = 4 + 14 * Math.abs(Math.sin(t * 17 + b * 1.3) * Math.sin(t * 7 + b)); g.fillRect(-35 + b * 10, 18 - a / 2, 6, a); } }
    else g.fillRect(-26, 16, 52, 5);
    g.restore();
    if (kind === 'safe') {  /* a hard hat */
      g.beginPath(); g.arc(0, -66, 78, Math.PI, 0); g.closePath(); K.fillStroke(g, '#ffb02e', 6);
      K.rr(g, -96, -72, 192, 16, 8); K.fillStroke(g, '#ffb02e', 6); g.fillStyle = INK; g.fillRect(-8, -140, 16, 66);
    }
    g.restore();
    return h;
  }

  /* ---------- props ---------- */
  /* a T-shirt: sleeves (2 = normal), fold 0 → 1 (flat → folded square) */
  function shirt(g, x, y, s, o, t) {
    o = o || {}; var col = o.col || '#ff5b3d', sl = o.sleeves || 2, fk = eio(clamp(o.fold || 0, 0, 1));
    g.save(); g.translate(x, y); g.scale(s, s); if (o.rot) g.rotate(o.rot);
    if (fk >= .999) {
      K.rr(g, -120, -90, 240, 180, 16); K.fillStroke(g, col, 8);
      g.strokeStyle = 'rgba(28,24,48,.45)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-120, 20); g.lineTo(120, 20); g.stroke();
      g.beginPath(); g.arc(0, -90, 34, 0, Math.PI); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
      g.restore(); return;
    }
    var bw = lerp(1, .55, fk), sk = 1 - fk;
    /* sleeves: the normal two, then extra ones stacked down each side */
    for (var i = 0; i < sl; i++) {
      var side = i % 2 ? 1 : -1, row = Math.floor(i / 2), sy = -120 + row * 78;
      g.save(); g.translate(side * 150 * bw, sy); g.rotate(side * (.5 + row * .25) * sk);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(side * 110 * sk, 30); g.lineTo(side * 80 * sk, 100); g.lineTo(0, 76); g.closePath(); K.fillStroke(g, col, 8);
      g.restore();
    }
    g.save(); g.scale(bw, 1);
    g.beginPath(); g.moveTo(-150, -140); g.lineTo(-50, -170); g.quadraticCurveTo(0, -120, 50, -170); g.lineTo(150, -140); g.lineTo(150, 190); g.lineTo(-150, 190); g.closePath(); K.fillStroke(g, col, 8 / bw);
    g.restore();
    g.restore();
  }
  function bubbleWrap(g, x, y, s, t, k) {
    if (k <= 0) return; g.save(); g.translate(x, y); g.scale(s * k, s * k);
    K.rr(g, -230, -230, 460, 400, 40); g.fillStyle = 'rgba(200,235,255,.55)'; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    g.save(); K.rr(g, -230, -230, 460, 400, 40); g.clip();
    for (var r = 0; r < 12; r++) for (var c = 0; c < 13; c++) { K.circ(g, -230 + c * 38 + (r % 2) * 19, -220 + r * 36, 13); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(28,24,48,.25)'; g.stroke(); }
    /* caution tape */
    g.save(); g.rotate(-.35); g.fillStyle = C.YEL; g.fillRect(-400, -40, 800, 70); g.fillStyle = INK; for (var i = -12; i < 12; i++) { g.beginPath(); g.moveTo(i * 60, -40); g.lineTo(i * 60 + 30, -40); g.lineTo(i * 60 + 10, 30); g.lineTo(i * 60 - 20, 30); g.closePath(); g.fill(); }
    g.restore(); g.restore();
    g.restore();
  }
  function dollars(g, x, y, px, u, dur, o) { K.counter(g, 0, 1000000, x, y, px, u, dur, Object.assign({ pre: '$', col: CASH }, o || {})); }
  /* MrBeast-style name slam: a mono chip with the role, the name slammed under it */
  function nameTag(g, role, name, col, u, y) {
    if (u < 0) return; y = y || 1270;
    var k = pop(u, 0, 3, .55); g.save(); g.translate(W / 2, y - 92); g.scale(k, k); K.chip(g, role, 0, 0, 30, { align: 'center', bg: C.CREAM }); g.restore();
    K.slam(g, name, W / 2, y, fit(g, name, 140, 940), u - .06, { col: col });
  }
  function scoreChip(g, s, x, y, u, col) { if (u < 0) return; var k = pop(u, 0, 3, .55); g.save(); g.translate(x, y); g.scale(k, k); K.chip(g, s, 0, 0, 36, { align: 'center', bg: col || C.CREAM }); g.restore(); }
  function cctv(g, t, draw) {
    g.save(); g.filter = 'grayscale(1) contrast(1.35) brightness(1.15)'; draw(g); g.restore();
    g.save(); g.globalAlpha = .12; g.fillStyle = '#000'; for (var y = 0; y < H; y += 6) g.fillRect(0, y, W, 2); g.restore();
    var vg = g.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    txt(g, 'CAM 03', 70, 120, 40, '#fff', 500, 'left', '"Geist Mono"');
    var s = Math.floor(t * 30), ts = '2026-11-04 14:32:' + ('0' + (7 + Math.floor(t) % 50)).slice(-2) + ':' + ('0' + s % 30).slice(-2);
    txt(g, ts, W - 70, 120, 34, '#fff', 500, 'right', '"Geist Mono"');
    if (Math.floor(t * 2) % 2 === 0) { K.circ(g, 90, 190, 14); g.fillStyle = '#ff2a2a'; g.fill(); }
    txt(g, 'REC', 118, 190, 34, '#fff', 500, 'left', '"Geist Mono"');
  }

  /* ---------- karaoke captions from the voices ---------- */
  var HOT = { three: 1, million: 1, one: 1, shirt: 1, sixty: 1, forty: 1, fold: 1, six: 1, seven: 1, sleeves: 1, absolutely: 1, safety: 1, wrapped: 1, zero: 1, grandma: 1, done: 1, perfect: 1 };
  var WHO = { open: 'host', task: 'host', r1: 'host', r2: 'host', r3: 'host', zero: 'host', wins: 'host', june: 'june', just: 'june', sleeves: 'june', done: 'june', yap1: 'yap', yap2: 'yap', yap3: 'yap', dream1: 'dream', dream2: 'dream', safe: 'safe' };
  var CAPCOL = { host: C.CREAM, june: '#f3c6ff', yap: '#bff6ff', dream: '#e2d2ff', safe: '#ffe1a8' };
  var CHUNKS = [];
  VO.lines.forEach(function (l) {
    var ws = l.words, cur = [];
    ws.forEach(function (w, i) {
      cur.push({ w: w.w.toUpperCase(), t0: w.t0, t1: w.t1, hot: !!HOT[norm(w.w)] });
      var brk = /[.,!?]$/.test(w.w) || cur.length >= 3;
      if (brk || i === ws.length - 1) { cur.who = WHO[l.id]; CHUNKS.push(cur); cur = []; }
    });
  });
  CHUNKS.forEach(function (c, i) { var nx = CHUNKS[i + 1]; c.a = c[0].t0 - .06; c.b = nx ? Math.min(nx[0].t0 - .06, c[c.length - 1].t1 + .5) : c[c.length - 1].t1 + .6; });
  function captions(g, t) {
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.a || t >= c.b) continue;
      var px = fit(g, c.map(function (w) { return w.w; }).join('  '), 84, 940), spc = px * .55;
      var ws = c.map(function (w) { return K.measure(g, w.w, px); }), tw = ws.reduce(function (a, b) { return a + b; }, 0) + spc * (c.length - 1), cx = W / 2 - tw / 2;
      c.forEach(function (w, j) {
        var k = pop(t, w.t0 - .02, 4, .55), on = t >= w.t0 && t < w.t1 + .05;
        if (k > 0) { g.save(); g.translate(cx + ws[j] / 2, 1560); var sc = k * (on ? 1.1 : 1); g.scale(sc, sc); K.sticker(g, w.w, 0, 0, px, { col: w.hot ? C.YEL : CAPCOL[c.who], lw: px * .17 }); g.restore(); }
        cx += ws[j] + spc;
      });
    }
  }

  /* ================= shots =================
     Each shot draws from absolute t; u = seconds since the shot started. Hard cuts unless a shot names a transition. */
  var S = {};

  /* 1 WIDE: the line-up. Camera flies in on frame 0; the host presents the three robots. */
  S.wide = function (g, t, u) {
    var fly = 1.5 - .5 * eo(seg(u, 0, .7));
    g.save(); cam(g, fly, W / 2, 1100);
    studio(g, t, { px: -40 * u });
    table(g, 560, 1270, 620);
    robot(g, 330, 1180, .72, pose('idle', u, { seed: 1 }), 'yap', t, false);
    robot(g, 560, 1180, .72, pose('idle', u + .4, {}), 'dream', t, false, { flip: true });
    robot(g, 790, 1180, .72, pose('idle', u + .9, {}), 'safe', t, false, { flip: true });
    host(g, 170, 1560, 1.15, 'present', u, t, talking('open', t));
    g.restore();
    K.popWords(g, ['3', '*ROBOTS'], W / 2, 330, 150, u - .05, { gap: .15 });
  };
  S.wide.sfx = function (t0) { return [[t0, 'whoosh', { d: .4 }], [t0 + .05, 'slam'], [t0 + .2, 'slam', { g: .8 }]]; };

  /* 2 INSERT: the money pile and the counter */
  S.money = function (g, t, u) {
    g.save(); cam(g, 1.9 + .2 * u, W / 2, 1050, K.shake(t, at('open', 'million'), 14, .4));
    studio(g, t, { px: 0 }); g.restore();
    dollars(g, W / 2, 620, 150, u, .9);
    K.confetti(g, W / 2, 500, u - .9, 60, 3, 1);
  };
  S.money.sfx = function (t0) { return [[t0, 'ratchet', { t1: t0 + .9 }], [t0 + .9, 'ding'], [t0 + .92, 'cheer', { g: .7 }]]; };

  /* 3 MCU host: "All they have to do is..." */
  S.hostTask = function (g, t, u, t0) {
    g.save(); push(g, t, t0, .08, W / 2, 900);
    studio(g, t, { px: 120, pileS: 1.3 });
    host(g, 540, 1750, 2.2, 'present', u, t, talking('task', t));
    g.restore();
  };

  /* 4 INSERT: one plain shirt drops onto the table */
  S.shirt = function (g, t, u) {
    g.save(); cam(g, K.punch(t, t - u + .15, .06), W / 2, 900);
    studio(g, t, { noMoney: true, floor: 1200 }); table(g, 540, 1180, 900);
    var dy = -900 * (1 - eo(seg(u, 0, .22)));
    shirt(g, 540, 940 + dy - 8 * knock(u, .22, 26, 7), 1.5, { col: C.HOOD }, t);
    g.restore();
    K.slam(g, 'FOLD 1 SHIRT', W / 2, 330, fit(g, 'FOLD 1 SHIRT', 150, 980), u - .1, { col: C.YEL });
  };
  S.shirt.sfx = function (t0) { return [[t0 + .2, 'thud'], [t0 + .1, 'slam', { g: .8 }]]; };

  /* 5 MCU judge: Grandma June at the judge's desk */
  S.june = function (g, t, u, t0) {
    g.save(); push(g, t, t0, .06, W / 2, 900);
    studio(g, t, { px: -160, pileS: 1.2 });
    var Pp = pose('idle', u, {}, talking('june', t)); Pp.lh = [-40, -200]; Pp.rh = [70, -190]; Pp.brow = -1; Pp.eyes = 'tiny';
    june(g, 540, 1720, 2.1, Pp, t);
    table(g, 540, 1500, 1100);
    g.restore();
    nameTag(g, 'THE JUDGE', 'GRANDMA JUNE', C.PINK, u - .15, 1250);
  };
  S.june.sfx = function (t0) { return [[t0 + .15, 'pop'], [t0 + .21, 'slam', { g: .9 }]]; };

  /* 6 ECU: "Impress me." */
  S.juneCU = function (g, t, u, t0) {
    g.save(); cam(g, 1 + .05 * u, W / 2, 900);
    studio(g, t, { px: -220, noMoney: true });
    var Pp = pose('idle', u, {}, talking('june', t)); Pp.brow = -1; Pp.eyes = u > .3 ? 'tiny' : 'dot'; Pp.tilt = -.08;
    june(g, 540, 2900, 4.6, Pp, t);
    g.restore();
  };
  S.juneCU.sfx = function (t0) { return [[t0, 'zip']]; };

  /* host announces a robot: whip in, point, slam */
  function hostCall(n, id) {
    var fn = function (g, t, u, t0) {
      g.save(); cam(g, K.punch(t, t0 + .05, .08), W / 2, 900);
      studio(g, t, { px: 60 * n });
      K.speedLines(g, W, H, W / 2, 800, t, .5, { col: '#fff' });
      host(g, 420, 1740, 2.1, 'point', u, t, talking(id, t));
      g.restore();
      K.slam(g, 'ROBOT ' + n, W / 2, 380, 170, u, { col: [NEONC, '#b78bff', '#ffb02e'][n - 1] });
    };
    fn.sfx = function (t0) { return [[t0, 'slam']]; };
    return fn;
  }
  S.call1 = hostCall(1, 'r1'); S.call2 = hostCall(2, 'r2'); S.call3 = hostCall(3, 'r3');

  /* 7 MCU Yapper-3, name slam */
  S.yap = function (g, t, u, t0) {
    g.save(); push(g, t, t0, .07, W / 2, 900);
    studio(g, t, { px: 200 });
    var Pp = pose('present', u, {}); Pp.eyes = 'happy';
    robot(g, 540, 1780, 2.1, Pp, 'yap', t, talking('yap1', t));
    g.restore();
    nameTag(g, 'ROBOT 1', 'YAPPER-3', NEONC, u - .1, 1260);
  };
  S.yap.sfx = function (t0) { return [[t0 + .1, 'pop'], [t0 + .16, 'slam', { g: .9 }]]; };

  /* 8 WIDE: an essay scrolls out of the robot; the shirt hasn't moved */
  var ESSAY = ['THE HISTORY OF FOLDING', 'A RICH AND COMPLEX TOPIC', 'FIRST, WHAT IS A SHIRT?', 'COTTON: A BRIEF HISTORY', 'ON CREASES AND MEANING', 'FOLDING IN ANCIENT ROME', 'LET\'S DELVE DEEPER', 'IN CONCLUSION (PART 1)'];
  S.essay = function (g, t, u, t0) {
    g.save(); push(g, t, t0, .05, W / 2, 1000);
    studio(g, t, { px: 40, noMoney: true });
    table(g, 700, 1300, 560);
    shirt(g, 700, 1180, .55, { col: C.HOOD }, t);
    robot(g, 260, 1300, .95, pose('idle', u, {}), 'yap', t, talking('yap1', t));
    /* the scroll */
    var len = 260 + 520 * u;
    g.save(); g.translate(330, 900); g.rotate(-.06);
    K.rr(g, 0, -40, 640, len, 10); K.fillStroke(g, C.PAPER, 7);
    g.save(); K.rr(g, 0, -40, 640, len, 10); g.clip();
    ESSAY.forEach(function (s, i) { var y = 10 + i * 92 - Math.max(0, len - 700) * .6; txt(g, s, 30, y, 30, INK, 800, 'left'); g.fillStyle = 'rgba(28,24,48,.25)'; g.fillRect(30, y + 26, 560, 6); g.fillRect(30, y + 42, 470, 6); });
    g.restore(); g.restore();
    g.restore();
    scoreChip(g, 'WORDS: ' + Math.floor(40 + u * 1900).toLocaleString('en-US'), W / 2, 330, u - .1, C.CREAM);
  };
  S.essay.sfx = function (t0, t1) { var e = [[t0, 'zip']]; for (var x = t0 + .1; x < t1 - .1; x += .11) e.push([x, 'key', { g: .7 }]); return e; };

  /* 9 CU Yapper: "Step one of forty." */
  function yapStep(n, id) {
    var fn = function (g, t, u, t0) {
      g.save(); push(g, t, t0, .1, W / 2, 1000);
      studio(g, t, { px: 260, noMoney: true });
      var Pp = pose('idle', u, {}); Pp.eyes = 'happy'; Pp.tilt = .06 * Math.sin(u * 3);
      robot(g, 540, 2550, 3.7, Pp, 'yap', t, talking(id, t));
      g.restore();
      var k = pop(u, .15, 3, .5); g.save(); g.translate(W / 2, 330); g.scale(k, k); g.rotate(-.04);
      K.rr(g, -300, -80, 600, 160, 30); K.fillStroke(g, '#14122a', 8);
      txt(g, 'STEP ' + n + ' / 40', 0, 6, 92, NEONC, 900);
      g.restore();
    };
    fn.sfx = function (t0) { return [[t0 + .15, 'pop'], [t0 + .2, 'tick']]; };
    return fn;
  }
  S.step1 = yapStep(1, 'yap1'); S.step2 = yapStep(2, 'yap2'); S.step3 = yapStep(3, 'yap3');

  /* 10 ECU June: "Just fold it." */
  S.just = function (g, t, u, t0) {
    var sh = K.shake(t, at('just', 'fold'), 18, .35);
    g.save(); cam(g, 1 + .12 * eo(seg(u, 0, .25)), W / 2, 800, sh);
    studio(g, t, { px: -260, noMoney: true });
    K.speedLines(g, W, H, W / 2, 700, t, .7, { col: '#fff' });
    var Pp = pose('idle', u, {}, talking('just', t)); Pp.brow = -1; Pp.eyes = 'tiny'; Pp.lean = .05;
    june(g, 540, 2950, 4.8, Pp, t);
    g.restore();
    K.emote(g, 'anger', 840, 380, 2, u - .2, t);
  };
  S.just.sfx = function (t0) { return [[t0, 'zip'], [at('just', 'fold'), 'thud', { g: .8 }]]; };

  /* 11 OTS: June's back in the foreground, the yapper and the untouched shirt behind */
  S.ots = function (g, t, u, t0) {
    g.save(); push(g, t, t0, .05, W / 2, 1000);
    studio(g, t, { px: -60, pileS: .8 });
    table(g, 620, 1250, 600); shirt(g, 620, 1130, .55, { col: C.HOOD }, t);
    robot(g, 640, 1180, .85, pose('idle', u, {}), 'yap', t, talking('yap2', t), { flip: true });
    var Pp = pose('facepalm', u - .3, {});
    june(g, 170, 2200, 2.6, Pp, t, { emote: false });
    g.restore();
  };

  /* 12 MCU Dream-9 */
  S.dream = function (g, t, u, t0) {
    g.save(); push(g, t, t0, .07, W / 2, 900);
    studio(g, t, { px: -120 });
    var Pp = pose('present', u, {}); Pp.eyes = 'star';
    robot(g, 540, 1780, 2.1, Pp, 'dream', t, talking('dream1', t));
    g.restore();
    nameTag(g, 'ROBOT 2', 'DREAM-9', '#b78bff', u - .1, 1260);
  };
  S.dream.sfx = function (t0) { return [[t0 + .1, 'pop'], [t0 + .16, 'slam', { g: .9 }]]; };

  /* 13 REVEAL: the "perfect fold" has six sleeves */
  function sleevesShot(n) {
    return function (g, t, u, t0) {
      g.save(); cam(g, 1.04 + .04 * u, W / 2, 1000);
      studio(g, t, { noMoney: true, floor: 1200 }); table(g, 540, 1260, 900);
      var grow = n === 7 ? clamp(u / .25, 0, 1) : 1;
      shirt(g, 540, 1000 - 12 * knock(u, .05, 20, 6), 1.3, { col: '#b78bff', sleeves: n === 7 ? (grow >= 1 ? 7 : 6) : 6 }, t);
      if (n === 7) K.burst(g, 760, 1150, 120 * pop(u, .25, 3, .5), u - .25, C.YEL, '+1', 1);
      g.restore();
      if (n === 6) {
        var k = pop(u, .2, 3, .5); g.save(); g.translate(W / 2, 360); g.rotate(-.1); g.scale(k, k);
        K.rr(g, -330, -90, 660, 180, 24); g.lineWidth = 12; g.strokeStyle = C.MINT; g.stroke();
        txt(g, 'PERFECT FOLD ✓', 0, 6, 80, C.MINT, 900); g.restore();
        K.confetti(g, W / 2, 600, u - .1, 50, 6, 1);
      } else K.slam(g, '7 SLEEVES', W / 2, 360, 150, u - .25, { col: '#b78bff' });
    };
  }
  S.six = sleevesShot(6); S.six.sfx = function (t0) { return [[t0, 'sparkle'], [t0 + .2, 'ding'], [t0 + .1, 'cheer', { g: .5 }]]; };
  S.seven = sleevesShot(7); S.seven.sfx = function (t0) { return [[t0 + .25, 'boing'], [t0 + .3, 'slam', { g: .8 }]]; };

  /* 14 CU June: "That shirt has six sleeves." She counts them with the circle */
  S.count = function (g, t, u, t0) {
    g.save(); push(g, t, t0, .06, W / 2, 900);
    studio(g, t, { px: -200, noMoney: true });
    var Pp = pose('point', u, {}, talking('sleeves', t)); Pp.brow = 1; Pp.eyes = 'tiny';
    june(g, 380, 2350, 3.4, Pp, t, { flip: false });
    g.restore();
    /* a picture-in-picture of the shirt, sleeves ticked off */
    var k = pop(u, .1, 3, .55); g.save(); g.translate(800, 520); g.scale(k, k); g.rotate(.05);
    K.rr(g, -220, -220, 440, 440, 26); K.fillStroke(g, '#2a2150', 8); shirt(g, 0, 20, .62, { col: '#b78bff', sleeves: 6 }, t);
    g.restore();
    var six = at('sleeves', 'six');
    K.scribble(g, 800, 520, 230, 230, eio(seg(t, six, six + .4)), C.YEL, 9, 3);
  };
  S.count.sfx = function (t0) { return [[t0 + .1, 'pop'], [at('sleeves', 'six'), 'scratch']]; };

  /* 15 CU Dream-9: "You're absolutely right." */
  S.right = function (g, t, u, t0) {
    g.save(); push(g, t, t0, .1, W / 2, 1000);
    studio(g, t, { px: -300, noMoney: true });
    var Pp = pose('idle', u, {}); Pp.eyes = 'happy'; Pp.tilt = -.08;
    robot(g, 540, 2550, 3.7, Pp, 'dream', t, talking('dream2', t));
    g.restore();
    K.popWords(g, ["YOU'RE", '*ABSOLUTELY', 'RIGHT'], W / 2, 340, 96, u, { times: [0, 1, 2].map(function (i) { return at('dream2', i) - t0; }), hot: '#b78bff', maxW: 980 });
  };

  /* 16 MCU Safe-T */
  S.safe = function (g, t, u, t0) {
    g.save(); push(g, t, t0, .07, W / 2, 900);
    studio(g, t, { px: 160 });
    var Pp = pose('idle', u, {}); Pp.lh = [-90, -230]; Pp.rh = [90, -230]; Pp.shr = 12; Pp.eyes = 'dot';
    robot(g, 540, 1780, 2.1, Pp, 'safe', t, talking('safe', t));
    g.restore();
    nameTag(g, 'ROBOT 3', 'SAFE-T', '#ffb02e', u - .1, 1260);
    K.emote(g, 'sweat', 760, 520, 1.6, u - .5, t);
  };
  S.safe.sfx = function (t0) { return [[t0 + .1, 'pop'], [t0 + .16, 'slam', { g: .9 }]]; };

  /* 17 CCTV: the wrapping, seen from the ceiling camera */
  S.cctv = function (g, t, u) {
    cctv(g, t, function (gg) {
      gg.save(); cam(gg, 1, W / 2, 1000);
      studio(gg, t, { px: 0, pileS: .7, pileY: 1100, floor: 1100 });
      table(gg, 560, 1240, 520);
      var wk = eio(seg(u, .3, 1.4));
      shirt(gg, 560, 1150, .45, { col: C.HOOD }, t);
      bubbleWrap(gg, 560, 1160, .42 + .05 * wk, t, wk);
      /* the robot circles the table, wrapping */
      var ang = u * 3.2, rx = 560 + Math.cos(ang) * 260, depth = Math.sin(ang);
      robot(gg, rx, 1180 + depth * 40, .55 + depth * .05, pose('walk', u, {}), 'safe', t, false, { flip: Math.sin(ang) > 0 });
      june(gg, 140, 1500, .7, pose('idle', u, {}), t);
      gg.restore();
    });
  };
  S.cctv.sfx = function (t0, t1) { var e = [[t0, 'shutter']]; for (var x = t0 + .3; x < t1 - .1; x += .14) e.push([x, 'pop', { g: .35 }]); return e; };

  /* 18 INSERT: the wrapped shirt, SAFE stamp */
  S.wrapped = function (g, t, u) {
    g.save(); cam(g, 1.02 + .05 * u, W / 2, 1000, K.shake(t, t - u + .2, 10, .3));
    studio(g, t, { noMoney: true, floor: 1240 }); table(g, 540, 1300, 900);
    shirt(g, 540, 1100, .9, { col: C.HOOD }, t);
    bubbleWrap(g, 540, 1080, 1, t, 1);
    g.restore();
    var k = pop(u, .2, 3, .5); g.save(); g.translate(W / 2, 400); g.rotate(-.12); g.scale(k * (1 + .5 * (1 - Math.min(1, k))), k);
    K.rr(g, -260, -90, 520, 180, 20); g.lineWidth = 14; g.strokeStyle = C.RED; g.stroke(); txt(g, 'SAFE ✓', 0, 6, 110, C.RED, 900); g.restore();
  };
  S.wrapped.sfx = function (t0) { return [[t0 + .2, 'slam']]; };

  /* 19 WIDE: three robots, zero folded shirts */
  S.zero = function (g, t, u, t0) {
    g.save(); push(g, t, t0, .05, W / 2, 1100);
    studio(g, t, { px: 30 });
    table(g, 560, 1270, 680);
    shirt(g, 380, 1170, .35, { col: C.HOOD }, t);
    shirt(g, 560, 1170, .35, { col: '#b78bff', sleeves: 7 }, t);
    bubbleWrap(g, 740, 1170, .32, t, 1);
    robot(g, 330, 1180, .62, pose('idle', u, {}), 'yap', t, false);
    robot(g, 560, 1180, .62, pose('idle', u + .3, {}), 'dream', t, false);
    robot(g, 790, 1180, .62, pose('idle', u + .7, {}), 'safe', t, false, { flip: true });
    host(g, 300, 1620, 1.2, 'shrug', u - .2, t, talking('zero', t), { emote: false });
    g.restore();
    var z = at('zero', 'zero');
    K.slam(g, '0 / 3', W / 2, 360, 220, t - z, { col: C.RED });
  };
  S.zero.sfx = function () { return [[at('zero', 'zero'), 'slam', { g: 1.1 }], [at('zero', 'zero') + .1, 'boing', { g: .7 }]]; };

  /* 20 ECU June: one flick and the shirt is folded. "Done." */
  S.done = function (g, t, u, t0) {
    var d = at('done'), fk = seg(t, d - .3, d + .05);
    g.save(); cam(g, 1 + .03 * u, W / 2, 1000, K.shake(t, d + .05, 16, .3));
    studio(g, t, { noMoney: true, floor: 1300 }); table(g, 540, 1360, 1000);
    var Pp = pose('idle', u, {}, talking('done', t)); Pp.rh = [120 - 140 * fk, -170 - 40 * Math.sin(fk * Math.PI)]; Pp.eyes = fk >= 1 ? 'happy' : 'tiny'; Pp.mouth = talking('done', t) ? 'talk' : 'smile';
    june(g, 300, 2300, 2.9, Pp, t);
    shirt(g, 700, 1240, .75, { col: C.HOOD, fold: fk, rot: -.2 * Math.sin(fk * Math.PI) }, t);
    g.restore();
    K.flash(g, W, H, t - d - .05, .7);
    K.impact(g, 700, 1240, t - d - .05, 1.6, C.CREAM);
    K.slam(g, '0.4 SEC', W / 2, 360, 170, t - d - .1, { col: C.YEL });
  };
  S.done.sfx = function () { var d = at('done'); return [[d - .3, 'whoosh', { d: .25 }], [d + .05, 'slam', { g: 1.2 }], [d + .1, 'ding']]; };

  /* 21 WIDE: Grandma wins. Crown, confetti, the counter in gold */
  S.wins = function (g, t, u, t0) {
    g.save(); push(g, t, t0, .06, W / 2, 1000);
    studio(g, t, { px: -40, pileS: 1.15 });
    var Pp = pose('celebrate', u, {});
    june(g, 650, 1700, 1.55, Pp, t, { hat: 'crown' });
    host(g, 230, 1740, 1.4, 'celebrate', u + .2, t, talking('wins', t), { emote: false });
    g.restore();
    K.confetti(g, W / 2, 300, u, 120, 8, 1.3);
    dollars(g, W / 2, 380, 130, u - .1, .8, { col: C.YEL });
    nameTag(g, 'WINNER', 'GRANDMA', C.PINK, u - .9, 760);
  };
  S.wins.sfx = function (t0) { return [[t0, 'cheer'], [t0 + .1, 'ratchet', { t1: t0 + .9 }], [t0 + .9, 'ding'], [t0 + .95, 'slam', { g: .8 }]]; };

  /* ---------- the timeline: a cut on nearly every line, a few mid-line ---------- */
  var DUR = VO.dur;
  var CUTS = [
    ['wide', 'Line-up', S.wide, 0],
    ['money', '$1,000,000', S.money, at('open', 'one')],
    ['hostTask', 'The task', S.hostTask, at('task')],
    ['shirt', 'One shirt', S.shirt, at('task', 'fold') - .05],
    ['june', 'The judge', S.june, at('june')],
    ['juneCU', 'Impress me', S.juneCU, at('june', 'impress') - .05],
    ['call1', 'Robot 1', S.call1, at('r1') - .08],
    ['yap', 'Yapper-3', S.yap, at('yap1')],
    ['essay', 'The essay', S.essay, at('yap1', 'folding') - .05],
    ['step1', 'Step 1/40', S.step1, at('yap1', 'step') - .05],
    ['just', 'Just fold it', S.just, at('just') - .05],
    ['ots', 'Step 2/40', S.ots, at('yap2') - .05],
    ['step2', 'Step 2/40', S.step2, at('yap2', 'of') - .05],
    ['call2', 'Robot 2', S.call2, at('r2') - .08],
    ['dream', 'Dream-9', S.dream, at('dream1')],
    ['six', 'Perfect fold', S.six, at('dream1', 'perfect') - .05],
    ['count', 'Six sleeves', S.count, at('sleeves') - .05],
    ['right', 'Absolutely right', S.right, at('dream2') - .05],
    ['seven', 'Seven', S.seven, at('dream2', 'heres') - .05],
    ['call3', 'Robot 3', S.call3, at('r3') - .08],
    ['safe', 'Safe-T', S.safe, at('safe')],
    ['cctv', 'Wrapping', S.cctv, at('safe', 'so') - .05],
    ['wrapped', 'Safe', S.wrapped, at('safe', 'wrapped') - .05],
    ['zero', 'Zero', S.zero, at('zero') - .05],
    ['done', 'Done', S.done, at('done') - .45],
    ['wins', 'Grandma wins', S.wins, at('wins') - .05],
    ['step3', 'Step 3/40', S.step3, at('yap3') - .05]
  ];
  var SCENES = CUTS.map(function (c, i) {
    var t1 = i + 1 < CUTS.length ? CUTS[i + 1][3] : DUR, t0 = c[3];
    return { id: c[0], name: c[1], dur: t1 - t0, fn: c[2], draw: function (g, t, u) { c[2](g, t, u, t0); captions(g, t); } };
  });
  var FILMK = K.film({ W: W, H: H, scenes: SCENES });
  var SHOTS = SCENES.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });

  /* ---------- sound cues (absolute times) ---------- */
  var EV = [];
  SCENES.forEach(function (s) {
    (s.fn.sfx ? s.fn.sfx(s.t0, s.t1) : []).forEach(function (e) { EV.push(Object.assign({ t: e[0], type: e[1] }, e[2] || {})); });
  });
  EV = EV.filter(function (e) { return e.t >= 0 && e.t < DUR; }).sort(function (a, b) { return a.t - b.t; });

  function TEXTS(t) { var out = []; CHUNKS.forEach(function (c) { if (t >= c.a && t < c.b) out.push({ text: c.map(function (w) { return w.w; }).join(' '), t0: c.a, t1: c.b }); }); return out; }
  function SCORE(ac) { K.score(ac, EV, DUR); }
  function render(t, samples, shutter, fps) { FILMK.render(ctx, t, samples, shutter, fps); }
  function init(canvas) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    return Promise.all(K.FONTS.map(function (f) { return document.fonts.load(f, 'Aa0%?!·$✓'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: at('dream1', 'perfect') + .6, SLUG: 'foldoff', SHOTS: SHOTS, init: init, render: render, LIVE: {} };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
