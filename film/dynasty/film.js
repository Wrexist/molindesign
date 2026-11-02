/* "Dynasty Manager" — a 30 s vertical promo for Isac's football manager game (github.com/Wrexist/dynasty-manager).
   A stickman manager is hired by the worst club, has no money, scouts a 17-year-old, sets the tactics, wins in the
   last minute, climbs the divisions and opens a free pack. Built with the motion kit (../kit/kit.js) and cut to the
   voice: every beat is keyed to a word time from vo/vo.js (window.VO, written by tools/voiceover.py).
   Facts on screen come from the repo's APP_STORE_LISTING.md (45+ divisions, 51 nations, daily free packs, no energy
   timers). No real club, league or player names; the player card is made up. Colours follow the app: night navy,
   gold, emerald. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Pure function of t. */
(function () {
  'use strict';
  var K = window.KIT, C = K.C, W = 1080, H = 1920, INK = C.INK, VO = window.VO;
  var clamp = K.clamp, lerp = K.lerp, seg = K.seg, eo = K.eo, eio = K.eio, ss = K.ss, pop = K.pop, knock = K.knock, P = K.pose;
  var NAVY = '#0d1424', NAVY2 = '#16213a', GOLD = '#f2b51d', GOLDL = '#ffd866', GOLDD = '#b37a08', EM = '#22d38a', EMD = '#139a62';
  var PITCH = '#1f8a4c', PITCH2 = '#1a7a43', RED = '#ff4a3d';
  var cv, ctx;

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function at(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (word == null) return l.t0; if (typeof word === 'number') return l.words[word].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function lend(id) { return LINE[id].t1; }

  /* ---------- helpers ---------- */
  function bg(g, col, t, o) {
    o = o || {}; g.fillStyle = col; g.fillRect(-W, -H, W * 3, H * 3);
    g.save(); g.globalAlpha = o.a || .06; g.fillStyle = o.stripe || '#fff'; g.translate((t * 40) % 140, 0); g.rotate(-.5);
    for (var x = -2400; x < 2400; x += 140) g.fillRect(x, -2400, 60, 4800);
    g.restore();
    /* soft vignette glow at the top, like the app's store art */
    var gr = g.createRadialGradient(W / 2, 260, 40, W / 2, 260, 900);
    gr.addColorStop(0, o.glow || 'rgba(34,211,138,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  function floor(g, y, col) { g.fillStyle = col || 'rgba(0,0,0,.22)'; g.fillRect(-W, y, W * 3, H); g.fillStyle = INK; g.fillRect(-W, y - 4, W * 3, 8); }
  function fit(g, s, px, maxW) { var w = K.measure(g, s, px); return w > maxW ? Math.floor(px * maxW / w) : px; }
  function txt(g, s, x, y, px, col, wt, align, fam) { K.font(g, px, wt || 800, fam); g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillStyle = col || C.CREAM; g.fillText(s, x, y); }

  var BOSS = { col: '#2b3d6b', shade: '#1d2b50', seed: 2 };
  var BOSSC = Object.assign({}, BOSS, { hat: 'crown', capCol: GOLD });

  /* a gold player card (made-up player) */
  function card(g, x, y, s, o, t) {
    o = o || {}; g.save(); g.translate(x, y); g.scale(s, s); if (o.rot) g.rotate(o.rot);
    var w = 300, h = 420, gr = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    gr.addColorStop(0, o.c0 || GOLDL); gr.addColorStop(.55, o.c1 || GOLD); gr.addColorStop(1, o.c2 || GOLDD);
    g.beginPath(); g.moveTo(-w / 2 + 30, -h / 2); g.lineTo(w / 2 - 30, -h / 2); g.lineTo(w / 2, -h / 2 + 40); g.lineTo(w / 2, h / 2 - 70);
    g.quadraticCurveTo(w / 2, h / 2 - 20, 0, h / 2); g.quadraticCurveTo(-w / 2, h / 2 - 20, -w / 2, h / 2 - 70); g.lineTo(-w / 2, -h / 2 + 40); g.closePath();
    g.fillStyle = gr; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke();
    if (o.hidden) {   /* face down: a dark back with a question mark */
      g.fillStyle = 'rgba(13,20,36,.85)'; g.fill(); txt(g, '?', 0, 0, 170, 'rgba(244,237,224,.35)', 900);
      g.restore(); return;
    }
    /* shine sweep */
    var sx = ((t || 0) * 260) % 900 - 450; g.save(); g.clip(); g.globalAlpha = .35; g.fillStyle = '#fff'; g.translate(sx, 0); g.rotate(.4); g.fillRect(-20, -400, 40, 800); g.restore();
    txt(g, String(o.ovr || 92), -w / 2 + 62, -h / 2 + 72, 72, INK, 900);
    txt(g, o.pos || 'ST', -w / 2 + 62, -h / 2 + 128, 34, INK, 800);
    /* the player: a little stick bust */
    g.save(); g.translate(40, -40); K.circ(g, 0, -40, 52); K.fillStroke(g, C.HEAD, 6); K.circ(g, -17, -46, 6); g.fillStyle = INK; g.fill(); K.circ(g, 17, -46, 6); g.fill();
    g.beginPath(); g.arc(0, -30, 18, .2, Math.PI - .2); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    K.rr(g, -66, 18, 132, 70, 30); K.fillStroke(g, o.kit || EM, 6); g.restore();
    g.fillStyle = INK; g.fillRect(-w / 2 + 30, 82, w - 60, 5);
    txt(g, o.name || 'N. VALE', 0, 122, 40, INK, 900);
    txt(g, o.line || 'AGE 17 · POT 94', 0, 170, 26, INK, 700, 'center', '"Geist Mono"');
    g.restore();
  }

  /* ---------- karaoke captions from the voice ---------- */
  var HOT = { hired: 1, worst: 1, promotion: 1, zero: 1, seventeenyearold: 1, nobody: 1, formation: 1, '90': 1, goal: 1, climb: 1, '45': 1, '51': 1, free: 1, energy: 1, dynasty: 1, iphone: 1, first: 1 };
  var CHUNKS = [];
  VO.lines.forEach(function (l) {
    var ws = l.words, cur = [];
    ws.forEach(function (w, i) {
      cur.push({ w: w.w.toUpperCase(), t0: w.t0, t1: w.t1, hot: !!HOT[norm(w.w)] });
      var brk = /[.,!?]$/.test(w.w) || cur.length >= 4;
      if (brk || i === ws.length - 1) { CHUNKS.push(cur); cur = []; }
    });
  });
  CHUNKS.forEach(function (c, i) { var nx = CHUNKS[i + 1]; c.a = c[0].t0 - .06; c.b = nx ? Math.min(nx[0].t0 - .06, c[c.length - 1].t1 + .6) : c[c.length - 1].t1 + 1.2; });
  /* like K.caption, with room for the spoken word to grow */
  function caption(g, words, x, y, px, t) {
    var spc = px * .42, ws = words.map(function (w) { return K.measure(g, w.w, px); }), tw = ws.reduce(function (a, b) { return a + b; }, 0) + spc * (words.length - 1), cx = x - tw / 2;
    words.forEach(function (w, i) {
      var k = pop(t, w.t0 - .02, 4, .55), on = t >= w.t0 && t < w.t1 + .05;
      if (k > 0) { g.save(); g.translate(cx + ws[i] / 2, y); var sc = k * (on ? 1.08 : 1); g.scale(sc, sc); K.sticker(g, w.w, 0, 0, px, { col: w.hot ? GOLD : C.CREAM, lw: px * .17 }); g.restore(); }
      cx += ws[i] + spc;
    });
  }
  function captions(g, t) {
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.a || t >= c.b) continue;
      var px = fit(g, c.map(function (w) { return w.w; }).join('  '), 70, 900);
      caption(g, c, W / 2, 1500, px, t);
    }
  }

  /* ================= scenes ================= */

  /* 1 HOOK: frame 0 already moving. He sprints in, a contract slams down, HIRED is stamped on it. */
  function sHook(g, t, u) {
    bg(g, NAVY, t);
    var stamp = at('hook', 'hired'), x = lerp(90, 330, eo(seg(t, 0, .55))), fy = 1300, s = 1.45;
    var sh = K.shake(t, stamp + .05, 20, .35), z = K.punch(t, stamp + .05, .06);
    g.save(); K.applyCam(g, W, H, { z: z, x: sh.x, y: sh.y, r: sh.r });
    K.speedLines(g, W, H, 540, 900, t, 1 - ss(seg(t, .4, .9)), { col: GOLD, r0: 420 });
    floor(g, fy, 'rgba(0,0,0,.3)');
    if (t < .55) { K.streaks(g, x - 140, 1000, 240, 380, t, 1, { col: C.CREAM }); K.guy(g, x, fy, s, K.ACT.run.pose(t, { T: .36 }), BOSS, t); }
    else if (t < stamp + .1) { K.guy(g, x, fy, s, P({ lean: -.25, lf: [40, 0], rf: [90, 0], lh: [-100, -230], rh: [60, -250], mouth: 'O', eyes: 'wide', brow: 1 }), BOSS, t); K.dust(g, x + 100, fy, t - .55, 1.2); }
    else K.actor(g, x, fy, s, 'celebrate', t - stamp - .1, Object.assign({ emote: false }, BOSS), t);
    /* the contract on a little desk */
    var cy = lerp(-400, 860, eo(seg(t, 0, .3))) - 30 * knock(t, .42, 26, 8);
    g.save(); g.translate(720, cy); g.rotate(.06);
    K.rr(g, -170, -220, 340, 440, 14); K.fillStroke(g, C.PAPER, 8);
    txt(g, 'CONTRACT', 0, -165, 40, INK, 900);
    for (var i = 0; i < 6; i++) { g.fillStyle = 'rgba(28,24,48,.35)'; g.fillRect(-130, -110 + i * 42, i === 5 ? 150 : 260, 12); }
    g.beginPath(); g.moveTo(-130, 165); g.bezierCurveTo(-90, 120, -60, 200, -20, 150); g.bezierCurveTo(10, 120, 40, 190, 90, 150); g.lineWidth = 5; g.strokeStyle = C.BLUE; g.setLineDash([400]); g.lineDashOffset = 400 * (1 - seg(t, .45, .7)); g.stroke(); g.setLineDash([]);
    if (t >= stamp) {
      var k = eo(seg(t, stamp, stamp + .12)), sc = lerp(2.4, 1, k);
      g.save(); g.translate(0, 20); g.rotate(-.22); g.scale(sc, sc); g.globalAlpha = clamp((t - stamp) / .05, 0, 1);
      K.rr(g, -150, -55, 300, 110, 16); g.lineWidth = 12; g.strokeStyle = RED; g.stroke(); txt(g, 'HIRED', 0, 4, 82, RED, 900); g.restore();
    }
    g.restore();
    if (t > stamp + .02) K.burst(g, 720, 880, 230 * pop(t, stamp + .02, 3, .5), t - stamp, GOLD, null);
    g.restore();
    K.flash(g, W, H, t - stamp - .03, .45);
    K.slam(g, 'DAY ONE.', W / 2, 330, 130, t + .1, { col: GOLD });
    captions(g, t);
  }
  sHook.sfx = function () { var s = at('hook', 'hired'); return [[0, 'whoosh', { d: .5 }], [.2, 'whoosh', { d: .25 }], [.42, 'thud'], [.5, 'squeak'], [.5, 'zip'], [s, 'slam', { g: 1.2 }], [s + .05, 'boing']]; };

  /* 2 WORST: the league table; his club sits at the bottom, circled in red. He facepalms. */
  function sWorst(g, t, u) {
    bg(g, '#2a0f17', t, { glow: 'rgba(255,74,61,.2)' });
    var t0 = at('worst'), wst = at('worst', 'worst'), lg = at('worst', 'league');
    /* table scrolls down to the bottom */
    var scroll = lerp(0, 1, eio(seg(t, t0, wst + .25)));
    g.save(); g.beginPath(); g.rect(90, 520, 900, 760); g.clip();
    K.rr(g, 90, 520, 900, 760, 26); g.fillStyle = 'rgba(13,20,36,.92)'; g.fill();
    var rows = 20, rh = 92, y0 = 560 - scroll * (rows * rh - 700);
    for (var i = 0; i < rows; i++) {
      var y = y0 + i * rh, me = i === rows - 1;
      if (me) { g.fillStyle = 'rgba(255,74,61,.28)'; g.fillRect(100, y - 8, 880, rh - 10); }
      txt(g, String(i + 1), 160, y + 36, 40, me ? RED : 'rgba(244,237,224,.6)', 800, 'center', '"Geist Mono"');
      K.circ(g, 240, y + 36, 24); g.fillStyle = me ? '#8a6a4a' : ['#3d7bff', '#ff7ab6', '#5fb86b', '#ffc83d', '#8b5cf6'][i % 5]; g.fill();
      txt(g, me ? 'YOUR CLUB' : 'CLUB ' + String.fromCharCode(65 + i), 290, y + 36, 40, me ? C.CREAM : 'rgba(244,237,224,.75)', 800, 'left');
      txt(g, String(me ? 3 : 62 - i * 3), 930, y + 36, 40, me ? RED : 'rgba(244,237,224,.75)', 800, 'right', '"Geist Mono"');
    }
    g.restore();
    var myY = y0 + 19 * rh + 36;
    K.scribble(g, 540, myY, 470, 70, eio(seg(t, wst, wst + .45)), RED, 9, 3);
    K.arrow(g, 900, 400, 820, myY - 70, eio(seg(t, lg - .1, lg + .3)), GOLD, 10, -.3);
    K.popWords(g, ['THE', '*WORST', 'CLUB'], W / 2, 340, 110, t - wst + .1, { hot: RED, gap: .09 });
    K.actor(g, 200, 1475, .65, 'facepalm', t - wst, Object.assign({ emote: true }, BOSS), t);
    captions(g, t);
  }
  sWorst.sfx = function () { var w = at('worst', 'worst'); return [[at('worst') - .05, 'whoosh', { d: .3 }], [at('worst'), 'ratchet', { t1: w + .2, g: .7 }], [w, 'swish'], [w + .1, 'pop'], [w + .2, 'pop'], [at('worst', 'league') - .1, 'zip'], [w + .5, 'thud', { g: .5 }]]; };

  /* 3 BOARD + BANK: three angry board members; then the bank balance rolls down to zero and he panics. */
  function sBoard(g, t, u) {
    bg(g, '#1d1638', t, { glow: 'rgba(139,92,246,.25)' });
    var prom = at('board', 'promotion'), bank = at('bank'), zero = at('bank', 'zero');
    var mode = t < bank - .05 ? 0 : 1;
    if (!mode) {
      /* the board: a long table, three suits leaning in */
      floor(g, 1250, 'rgba(0,0,0,.25)');
      var seats = [[300, 3], [540, 7], [780, 9]];
      seats.forEach(function (sx, i) {
        var o = { col: ['#4a4a5a', '#3a3a48', '#55556a'][i], shade: '#2a2a35', seed: sx[1], glasses: i === 1 };
        var Pp = P({ lean: .12, lh: [-50, -200], rh: [80, -230 - 30 * Math.abs(Math.sin(t * 9 + i))], mouth: t > prom ? 'teeth' : 'talk', brow: -1, eyes: 'dot', look: [0, .3] });
        K.guy(g, sx[0], 1180, .95, Pp, o, t);
        if (t > prom + i * .08) K.emote(g, 'anger', sx[0] + 60, 700, 1, t - prom - i * .08, t);
      });
      K.rr(g, 120, 1060, 840, 70, 12); K.fillStroke(g, '#6b4a2b', 8);
      K.slam(g, 'PROMOTION.', W / 2, 340, fit(g, 'PROMOTION.', 130, 960), t - prom, { col: GOLD });
      K.chip(g, 'THE BOARD', W / 2, 500, 28, { align: 'center', bg: C.CREAM });
    } else {
      floor(g, 1300, 'rgba(0,0,0,.25)');
      /* bank app card */
      var k = eo(seg(t, bank - .05, bank + .25));
      g.save(); g.translate(W / 2, lerp(1400, 640, k));
      K.rr(g, -380, -230, 760, 460, 40); K.fillStroke(g, NAVY2, 8, INK);
      txt(g, 'CLUB BALANCE', 0, -150, 34, 'rgba(244,237,224,.6)', 700, 'center', '"Geist Mono"');
      g.restore();
      var cy = lerp(1400, 640, k) + 20;
      var dur = Math.max(.4, zero - bank - .05);
      K.counter(g, 2500000, 0, W / 2, cy, 120, t - bank - .05, dur, { pre: '£', col: t >= zero ? RED : C.CREAM, ease: function (q) { return q * q; } });
      if (t >= zero) K.stretch(g, 'ZERO.', W / 2, 260, 150, t - zero, { col: RED });
      if (t < zero) K.actor(g, 540, 1300, 1.0, 'think', t - bank, Object.assign({ emote: false }, BOSS), t);
      else K.actor(g, 540, 1300, 1.0, 'panic', t - zero, BOSS, t);
      if (t >= zero) { var sh = K.shake(t, zero, 8, .3); g.translate(sh.x, sh.y); }
    }
    captions(g, t);
  }
  sBoard.sfx = function () { var p = at('board', 'promotion'), b = at('bank'), z = at('bank', 'zero'); return [[at('board') - .05, 'whoosh', { d: .25 }], [p, 'slam'], [p + .05, 'pop', { g: .7 }], [p + .13, 'pop', { g: .7 }], [p + .21, 'pop', { g: .7 }], [b - .05, 'swish'], [b, 'ratchet', { t1: z }], [z, 'boing', { g: 1.2 }], [z + .02, 'thud']]; };

  /* 4 SCOUT: a magnifier sweeps a row of face-down cards; one flips: a 17-year-old nobody wanted. */
  function sScout(g, t, u) {
    bg(g, '#0c2a2c', t, { glow: 'rgba(34,211,138,.25)' });
    var t0 = at('scout'), seven = at('scout', 'seventeenyearold'), nob = at('scout', 'nobody');
    floor(g, 1330, 'rgba(0,0,0,.25)');
    var xs = [150, 345, 540, 735, 930], pick = 2;
    var mx = t < seven - .05 ? lerp(120, 900, ss(seg(t, t0, seven - .3))) + 0 : lerp(900, xs[pick], eo(seg(t, seven - .3, seven)));
    xs.forEach(function (x, i) {
      var flipped = i === pick && t >= seven, fl = i === pick ? seg(t, seven, seven + .25) : 0;
      var sx = Math.abs(Math.cos(fl * Math.PI)) * (i === pick ? lerp(1, 1.5, eo(seg(t, seven + .1, seven + .5))) : 1);
      var yy = 830 - (i === pick ? 120 * eo(seg(t, seven + .1, seven + .5)) : 0);
      if (i === pick && fl > 0) return;
      card(g, x + (i === pick ? 0 : 0), yy, .55, { hidden: true }, t);
    });
    if (t >= seven) K.burst(g, xs[pick], 760, 330 * pop(t, seven + .05, 3, .5), t - seven, GOLD, null);
    if (t >= seven) {
      var fl2 = seg(t, seven, seven + .25), scx = Math.abs(Math.sin(fl2 * Math.PI / 2)), scl = lerp(.55, 1.15, eo(seg(t, seven, seven + .45)));
      g.save(); g.translate(xs[pick], lerp(830, 760, eo(seg(t, seven, seven + .45)))); g.scale(scx, 1);
      card(g, 0, 0, scl, { ovr: 64, pos: 'ST', name: 'N. VALE', line: 'AGE 17 · POT 94' }, t);
      g.restore();
    }
    /* magnifier */
    if (t < seven + .2) {
      g.save(); g.translate(mx, 820 + Math.sin(t * 5) * 18); g.globalAlpha = 1 - seg(t, seven, seven + .2);
      K.circ(g, 0, 0, 95); g.fillStyle = 'rgba(143,233,255,.18)'; g.fill(); g.lineWidth = 16; g.strokeStyle = INK; g.stroke();
      g.save(); g.rotate(.7); K.rr(g, 92, -16, 150, 32, 14); K.fillStroke(g, '#6b4a2b', 8); g.restore(); g.restore();
    }
    K.popWords(g, ['AGE', '*17.'], W / 2, 330, 140, t - seven, { gap: .12 });
    if (t >= nob) K.chip(g, 'NOBODY WANTED HIM', W / 2, 1200, 30, { align: 'center', bg: RED, col: C.CREAM });
    K.actor(g, 150, 1460, .75, t < seven ? 'sneak' : 'point', t < seven ? t - t0 : t - seven, Object.assign({ emote: false }, BOSS), t);
    captions(g, t);
  }
  sScout.sfx = function () { var s = at('scout', 'seventeenyearold'); return [[at('scout') - .1, 'whoosh', { d: .3 }], [at('scout') + .2, 'tick', { g: .12 }], [at('scout') + .6, 'tick', { g: .12 }], [s - .05, 'zip'], [s + .05, 'shutter'], [s + .1, 'sparkle'], [s + .14, 'pop', { g: 1.2 }], [at('scout', 'nobody'), 'pop']]; };

  /* 5 TACTICS: a 4-3-3 lands on the board, then press, tempo and width sliders kick on their words. */
  var F433 = [[0, .92], [-.62, .72], [-.22, .76], [.22, .76], [.62, .72], [-.42, .52], [0, .56], [.42, .52], [-.55, .27], [0, .22], [.55, .27]];
  function sTactics(g, t, u) {
    bg(g, '#0b2216', t, { glow: 'rgba(34,211,138,.2)' });
    var form = at('tactics', 'formation'), pr = at('tactics', 'press'), te = at('tactics', 'tempo'), wi = at('tactics', 'width');
    var px0 = 150, py0 = 440, pw = 780, ph = 620;
    g.save(); g.translate(0, 0);
    K.rr(g, px0, py0, pw, ph, 28); K.fillStroke(g, PITCH, 8);
    for (var s2 = 0; s2 < 6; s2++) { g.fillStyle = PITCH2; if (s2 % 2) g.fillRect(px0 + 4, py0 + s2 * ph / 6, pw - 8, ph / 6); }
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 5; g.strokeRect(px0 + 30, py0 + 30, pw - 60, ph - 60);
    g.beginPath(); g.moveTo(px0 + 30, py0 + ph / 2); g.lineTo(px0 + pw - 30, py0 + ph / 2); g.stroke(); K.circ(g, px0 + pw / 2, py0 + ph / 2, 70); g.stroke();
    g.restore();
    F433.forEach(function (p, i) {
      var k = pop(t, form - .2 + i * .04, 3.2, .55), x = px0 + pw / 2 + p[0] * pw * .45, y = py0 + p[1] * ph;
      /* pressing pushes the line up */
      y -= 40 * eio(seg(t, pr, pr + .3)) * (i > 0 ? 1 : 0);
      x += (p[0]) * 60 * eio(seg(t, wi, wi + .3));
      if (k <= 0) return;
      g.save(); g.translate(x, y); g.scale(k, k); K.circ(g, 0, 0, 30); K.fillStroke(g, i === 0 ? GOLD : C.CREAM, 6); txt(g, String(i === 0 ? 1 : i + 1), 0, 2, 26, INK, 900); g.restore();
    });
    if (t > pr) { K.arrow(g, px0 + pw / 2 - 160, py0 + ph * .5, px0 + pw / 2 - 160, py0 + ph * .22, eio(seg(t, pr, pr + .3)), GOLD, 9, .1); K.arrow(g, px0 + pw / 2 + 160, py0 + ph * .5, px0 + pw / 2 + 160, py0 + ph * .22, eio(seg(t, pr + .08, pr + .38)), GOLD, 9, -.1); }
    if (t > form) K.chip(g, '4-3-3', px0 + 30, py0 - 40, 30, { bg: GOLD });
    /* sliders */
    [['PRESS', pr], ['TEMPO', te], ['WIDTH', wi]].forEach(function (s, i) {
      var y = 1150 + i * 92, on = t >= s[1], k = eo(seg(t, s[1], s[1] + .3));
      txt(g, s[0], 160, y, 38, on ? C.CREAM : 'rgba(244,237,224,.4)', 800, 'left', '"Geist Mono"');
      K.rr(g, 400, y - 10, 520, 20, 10); g.fillStyle = 'rgba(255,255,255,.15)'; g.fill();
      K.rr(g, 400, y - 10, 520 * lerp(.35, .88, k), 20, 10); g.fillStyle = EM; g.fill();
      K.circ(g, 400 + 520 * lerp(.35, .88, k), y, 24 * (1 + .25 * Math.max(0, knock(t, s[1] + .3, 20, 7)))); K.fillStroke(g, C.CREAM, 6);
    });
    K.popWords(g, ['YOUR', '*CALL.'], W / 2, 300, 130, t - form + .2, { gap: .15, hot: EM });
    captions(g, t);
  }
  sTactics.sfx = function () { var f = at('tactics', 'formation'); var e = [[at('tactics') - .1, 'whoosh', { d: .3 }]]; for (var i = 0; i < 11; i++) e.push([f - .2 + i * .04, 'pop', { g: .45 }]); ['press', 'tempo', 'width'].forEach(function (w) { e.push([at('tactics', w), 'zip']); e.push([at('tactics', w) + .3, 'tick', { g: .3 }]); }); return e; };

  /* 6 MATCH: the clock races to 90, the last-minute shot, GOAL. */
  function sMatch(g, t, u) {
    var m0 = at('match'), n90 = at('match', '90'), last = at('goal'), gl = at('goal', 'goal');
    bg(g, '#0a0f1e', t, { glow: 'rgba(242,181,29,.18)' });
    var sh = K.shake(t, gl, 26, .45), z = K.punch(t, gl, .08);
    g.save(); K.applyCam(g, W, H, { z: z, x: sh.x, y: sh.y, r: sh.r });
    /* floodlights */
    [[160, 380], [920, 380]].forEach(function (p, i) { g.save(); g.globalAlpha = .18 + .05 * Math.sin(t * 3 + i); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(540 - 260, 1300); g.lineTo(540 + 260, 1300); g.closePath(); g.fill(); g.restore(); K.rr(g, p[0] - 50, p[1] - 30, 100, 60, 10); K.fillStroke(g, '#fff8d8', 6); });
    /* pitch in perspective */
    g.fillStyle = PITCH; g.beginPath(); g.moveTo(80, 1350); g.lineTo(1000, 1350); g.lineTo(860, 900); g.lineTo(220, 900); g.closePath(); g.fill();
    g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    /* goal */
    g.save(); g.translate(540, 900); g.strokeStyle = C.CREAM; g.lineWidth = 10; g.strokeRect(-180, -150, 360, 150);
    g.globalAlpha = .4; g.lineWidth = 2; for (var i = -170; i < 180; i += 22) { g.beginPath(); g.moveTo(i + (t > gl ? Math.sin(t * 30) * 6 * Math.exp(-(t - gl) * 4) : 0), -150); g.lineTo(i, 0); g.stroke(); } g.restore();
    /* keeper */
    var dive = seg(t, gl - .2, gl + .1);
    K.guy(g, 540 - 160 * eo(dive), 900, .55, P({ lh: [-110, -260], rh: [100, -260], spin: -1.1 * eo(dive), eyes: t > gl ? 'x' : 'wide', mouth: 'O' }), { col: '#ffc83d', shade: '#c99a20', seed: 8 }, t);
    /* the ball */
    var bk = seg(t, last + .1, gl), bx = lerp(620, 600, bk), by = lerp(1300, 820, eo(bk)), bs = lerp(1.6, .55, eo(bk));
    if (t > gl) { bx = 600; by = 820 + 20 * (t - gl); bs = .55; }
    g.save(); g.translate(bx, by); g.rotate(t * 14); K.circ(g, 0, 0, 44 * bs); K.fillStroke(g, '#fff', 6); K.circ(g, 0, 0, 14 * bs); g.fillStyle = INK; g.fill(); g.restore();
    if (t > last + .1 && t < gl) K.streaks(g, bx - 60, by + 40, 160, 120, t, 1, { col: C.CREAM });
    g.restore();
    /* scoreboard + clock */
    var mins = t < m0 ? 1 : t < n90 + .35 ? Math.round(lerp(1, 90, ss(seg(t, m0, n90 + .35)))) : 90;
    var score = t >= gl ? '1 – 0' : '0 – 0';
    g.save(); g.translate(W / 2, 250);
    K.rr(g, -330, -80, 660, 160, 30); K.fillStroke(g, NAVY2, 8, INK);
    txt(g, score, 0, 4, 100, t >= gl ? GOLD : C.CREAM, 900);
    g.restore();
    K.chip(g, (mins >= 90 && t > last - .2 ? "90+3'" : mins + "'"), W / 2, 395, 34, { align: 'center', bg: t > last - .2 ? RED : EM, col: C.CREAM });
    if (t >= gl) { K.burst(g, W / 2, 620, 300 * pop(t, gl, 3, .5), t - gl, GOLD, 'GOAL!', 1.5); K.confetti(g, 540, 600, t - gl, 120, 3); }
    K.flash(g, W, H, t - gl, .6);
    if (t >= gl) K.actor(g, 880, 1560, .9, 'celebrate', t - gl, Object.assign({ emote: false }, BOSS), t);
    else K.actor(g, 880, 1560, .9, t > last ? 'panic' : 'think', t - m0, Object.assign({ emote: false }, BOSS), t);
    captions(g, t);
  }
  sMatch.sfx = function () { var m0 = at('match'), n = at('match', '90'), l = at('goal'), gl = at('goal', 'goal'); return [[m0 - .1, 'whoosh', { d: .3 }], [m0, 'ratchet', { t1: n + .35, g: .8 }], [n + .35, 'ding'], [l, 'rise', { t1: gl }], [l + .1, 'whoosh', { d: .4 }], [gl, 'slam', { g: 1.3 }], [gl + .02, 'cheer', { g: 1.6 }], [gl + .3, 'cheer', { g: 1.2 }], [gl + .1, 'sparkle']]; };

  /* 7 CLIMB: he hops up division steps to a trophy; 45 divisions, 51 nations. */
  function sClimb(g, t, u) {
    bg(g, '#1f1606', t, { glow: 'rgba(242,181,29,.28)', stripe: GOLD });
    var c0 = at('climb'), cl = at('climb', 'climb'), d45 = at('scale', '45'), n51 = at('scale', '51');
    var steps = 5, sw = 170, sh = 120, x0 = 120, y0 = 1420;
    for (var i = 0; i < steps; i++) {
      var x = x0 + i * sw, y = y0 - (i + 1) * sh;
      K.rr(g, x, y, sw + 6, y0 - y + 200, 10); K.fillStroke(g, i === steps - 1 ? GOLD : ['#6b4a2b', '#8a6a4a', '#9aa3b5', '#c9ced8'][i], 7);
      txt(g, i === steps - 1 ? '1st' : 'DIV ' + (5 - i), x + sw / 2, y + 50, 32, INK, 900);
    }
    /* trophy */
    var ty = y0 - steps * sh - 80;
    g.save(); g.translate(x0 + (steps - .5) * sw + 3, ty); var tk = pop(t, cl + .2, 2.6, .5); g.scale(tk, tk);
    g.beginPath(); g.moveTo(-60, -90); g.lineTo(60, -90); g.quadraticCurveTo(60, 10, 0, 20); g.quadraticCurveTo(-60, 10, -60, -90); K.fillStroke(g, GOLD, 7);
    K.rr(g, -14, 18, 28, 40, 4); K.fillStroke(g, GOLD, 6); K.rr(g, -45, 56, 90, 22, 6); K.fillStroke(g, GOLDD, 6); g.restore();
    /* he hops a step per beat: 1 step every 0.42 s from c0 */
    var hopT = .42, prog = clamp((t - c0) / hopT, 0, steps), n = Math.floor(prog), f = prog - n;
    var stepX = function (k) { return x0 + (k - .5) * sw + 3; }, stepY = function (k) { return k <= 0 ? y0 : y0 - k * sh; };
    var px = n >= steps ? stepX(steps) : lerp(k0x(n), stepX(n + 1), f), py = n >= steps ? stepY(steps) : lerp(stepY(n), stepY(n + 1), f) - Math.sin(f * Math.PI) * 120;
    function k0x(k) { return k <= 0 ? x0 - 40 : stepX(k); }
    var Pp = n >= steps ? K.ACT.celebrate.pose(t - c0 - steps * hopT, {}) : P({ lh: [-90, -230], rh: [90, -230], lf: [-30, -40 * Math.sin(f * Math.PI)], rf: [30, -10], mouth: 'grin', eyes: 'happy' });
    K.guy(g, px, py, .62, Pp, n >= steps ? BOSSC : BOSS, t);
    if (n < steps) K.dust(g, px, py, f, .5);
    K.popWords(g, ['*45', 'DIVISIONS'], W / 2, 260, 100, t - d45, { gap: .2, out: n51 - d45 - .15 });
    K.popWords(g, ['*51', 'NATIONS'], W / 2, 260, 100, t - n51, { gap: .2 });
    if (t < d45) K.popWords(g, ['YOU', '*CLIMB.'], W / 2, 260, 120, t - cl, { gap: .12, out: d45 - cl - .2 });
    captions(g, t);
  }
  sClimb.sfx = function () { var c0 = at('climb'), e = [[c0 - .1, 'whoosh', { d: .3 }]]; for (var i = 0; i < 5; i++) e.push([c0 + .42 * (i + 1) - .05, 'boing', { g: .5 + i * .1 }]); e.push([at('climb', 'climb') + .2, 'sparkle']); e.push([at('scale', '45'), 'slam', { g: .8 }]); e.push([at('scale', '51'), 'slam', { g: .9 }]); e.push([c0 + .42 * 5, 'cheer']); return e; };

  /* 8 PACKS: a gold pack shakes, rips, a card walks out on light rays; then energy timers get crossed out. */
  function sPacks(g, t, u) {
    bg(g, '#120a24', t, { glow: 'rgba(242,181,29,.3)', stripe: GOLD });
    var p0 = at('packs'), day = at('packs', 'day'), no = at('packs', 'no'), en = at('packs', 'energy');
    var rip = p0 + .55;
    if (t < no - .1) {
      /* rays */
      if (t > rip) { g.save(); g.translate(W / 2, 820); g.rotate(t * .4); g.globalAlpha = .35 * eo(seg(t, rip, rip + .3)); g.fillStyle = GOLDL; for (var i = 0; i < 14; i++) { g.rotate(Math.PI * 2 / 14); g.beginPath(); g.moveTo(0, 0); g.lineTo(-60, -1100); g.lineTo(60, -1100); g.fill(); } g.restore(); }
      if (t < rip) {
        var shk = Math.sin(t * 60) * 12 * seg(t, p0, rip);
        g.save(); g.translate(W / 2 + shk, 820); g.rotate(shk * .004);
        K.rr(g, -190, -280, 380, 560, 30); var gr = g.createLinearGradient(0, -280, 0, 280); gr.addColorStop(0, GOLDL); gr.addColorStop(1, GOLDD); g.fillStyle = gr; g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
        txt(g, 'FREE', 0, -60, 84, INK, 900); txt(g, 'DAILY PACK', 0, 30, 40, INK, 800); K.star(g, 0, 150, 50, 5, .45); K.fillStroke(g, C.CREAM, 6);
        g.restore();
      } else {
        var k = eo(seg(t, rip, rip + .4));
        card(g, W / 2, lerp(980, 800, k), lerp(.4, 1.25, k), { ovr: 89, pos: 'CM', name: 'T. ORLO', line: 'GOLD · RARE', kit: C.BLUE }, t);
        /* torn halves fly */
        var f = seg(t, rip, rip + .5);
        g.save(); g.globalAlpha = 1 - f; g.translate(W / 2 - 300 * f, 820 - 500 * f); g.rotate(-f * 2); K.rr(g, -190, -100, 380, 200, 20); g.fillStyle = GOLD; g.fill(); g.restore();
        g.save(); g.globalAlpha = 1 - f; g.translate(W / 2 + 300 * f, 820 + 400 * f); g.rotate(f * 2); K.rr(g, -190, -100, 380, 200, 20); g.fillStyle = GOLDD; g.fill(); g.restore();
        K.confetti(g, W / 2, 700, t - rip, 80, 9);
      }
      K.popWords(g, ['FREE', 'PACKS', '*DAILY'], W / 2, 290, 110, t - p0, { gap: .14, maxW: 960 });
      K.flash(g, W, H, t - rip, .55);
    } else {
      /* energy bar, crossed out */
      g.save(); g.translate(W / 2 + 20, 800);
      K.rr(g, -330, -90, 600, 180, 30); K.fillStroke(g, NAVY2, 9, C.CREAM);
      K.rr(g, 270, -40, 40, 80, 8); g.fillStyle = C.CREAM; g.fill();
      var lvl = .18 + .04 * Math.sin(t * 12);
      K.rr(g, -310, -70, 560 * lvl, 140, 18); g.fillStyle = RED; g.fill();
      txt(g, 'WAIT 4H', 20, 4, 54, 'rgba(244,237,224,.75)', 900, 'center', '"Geist Mono"');
      g.restore();
      var xk = eio(seg(t, en, en + .3));
      g.save(); g.lineCap = 'round'; g.lineWidth = 30; g.strokeStyle = RED;
      g.beginPath(); g.moveTo(230, 560); g.lineTo(lerp(230, 850, xk), lerp(560, 1040, xk)); g.stroke();
      var xk2 = eio(seg(t, en + .15, en + .45)); g.beginPath(); g.moveTo(850, 560); g.lineTo(lerp(850, 230, xk2), lerp(560, 1040, xk2)); g.stroke(); g.restore();
      K.slam(g, 'NO TIMERS.', W / 2, 300, fit(g, 'NO TIMERS.', 130, 960), t - en, { col: C.CREAM });
      K.actor(g, 860, 1420, .8, 'dance', t - no, Object.assign({ emote: false }, BOSS), t);
    }
    captions(g, t);
  }
  sPacks.sfx = function () { var p = at('packs'), r = p + .55, en = at('packs', 'energy'); return [[p - .1, 'whoosh', { d: .3 }], [p, 'rise', { t1: r }], [p + .1, 'pop'], [p + .24, 'pop'], [p + .38, 'pop', { g: 1.2 }], [r, 'splat'], [r + .02, 'sparkle', { g: 1.3 }], [r + .05, 'cheer', { g: .8 }], [at('packs', 'no') - .1, 'whoosh', { d: .25 }], [en, 'scratch'], [en + .15, 'slam']]; };

  /* 9 CTA: the name slams down with a crown; FREE ON iPHONE. */
  function sCta(g, t, u) {
    bg(g, NAVY, t, { glow: 'rgba(242,181,29,.3)', stripe: GOLD });
    var c0 = at('cta'), fr = at('cta', 'free');
    /* crown */
    g.save(); g.translate(W / 2, 470 - 20 * Math.max(0, knock(t, c0 + .1, 18, 6))); var ck = pop(t, c0 - .05, 3, .5); g.scale(ck * 1.6, ck * 1.6);
    g.beginPath(); g.moveTo(-90, 40); g.lineTo(-100, -50); g.lineTo(-45, -5); g.lineTo(0, -70); g.lineTo(45, -5); g.lineTo(100, -50); g.lineTo(90, 40); g.closePath(); K.fillStroke(g, GOLD, 7);
    [-100, 0, 100].forEach(function (x, i) { K.circ(g, x, [-50, -70, -50][i], 13); K.fillStroke(g, i === 1 ? RED : EM, 5); });
    g.restore();
    K.slam(g, 'DYNASTY', W / 2, 720, fit(g, 'DYNASTY', 190, 980), t - c0, { col: GOLD });
    K.slam(g, 'MANAGER', W / 2, 900, fit(g, 'MANAGER', 150, 980), t - c0 - .25, { col: C.CREAM });
    if (t > fr) {
      var k = pop(t, fr, 3, .55);
      g.save(); g.translate(W / 2, 1110); g.scale(k, k);
      K.rr(g, -290, -60, 580, 120, 60); K.fillStroke(g, EM, 8);
      txt(g, 'FREE ON iPHONE', 0, 4, 54, INK, 900); g.restore();
    }
    K.confetti(g, 540, 600, t - c0 - .2, 70, 4, .8);
    K.actor(g, 180, 1420, .7, 'present', t - c0, Object.assign({ emote: false }, BOSSC), t);
    captions(g, t);
  }
  sCta.sfx = function () { var c = at('cta'), f = at('cta', 'free'); return [[c - .15, 'zip'], [c, 'slam', { g: 1.2 }], [c + .25, 'slam'], [c + .3, 'sparkle'], [f, 'pop', { g: 1.3 }], [f + .05, 'ding']]; };

  /* 10 ASK: he points at you with a crown on; the question. */
  function sAsk(g, t, u) {
    bg(g, '#0b1a2e', t, { glow: 'rgba(34,211,138,.25)' });
    var a0 = at('ask'), sv = at('ask', 'saving'), fi = at('ask', 'first');
    floor(g, 1330, 'rgba(0,0,0,.25)');
    var zk = 1 + .1 * eo(seg(t, a0, a0 + 2.5));
    g.save(); K.applyCam(g, W, H, { z: zk, cx: 540, cy: 1000 });
    K.speedLines(g, W, H, 540, 900, t, .5, { col: C.CREAM, r0: 520 });
    K.actor(g, 540, 1330, 1.55, 'point', t - a0, Object.assign({ emote: false, flip: true }, BOSSC), t);
    g.restore();
    K.popWords(g, ['WHICH', 'CLUB'], W / 2, 170, 92, t - a0, { gap: .12, maxW: 1000 });
    K.popWords(g, ['ARE', 'YOU'], W / 2, 275, 92, t - a0 - .24, { gap: .12, maxW: 1000 });
    K.popWords(g, ['*SAVING', '*FIRST?'], W / 2, 450, 116, t - sv, { gap: .25, maxW: 960, hot: EM });
    K.emote(g, '?', 900, 640, 1.3, t - fi, t);
    K.chip(g, 'TELL ME IN THE COMMENTS', W / 2, 1220, 30, { align: 'center', bg: C.CREAM });
    captions(g, t);
  }
  sAsk.sfx = function () { var a = at('ask'), s = at('ask', 'saving'), f = at('ask', 'first'); return [[a - .1, 'whoosh', { d: .3 }], [a, 'pop', { g: .6 }], [a + .12, 'pop', { g: .6 }], [a + .24, 'pop', { g: .6 }], [a + .36, 'pop', { g: .6 }], [s, 'pop', { g: 1.1 }], [s + .25, 'boing'], [f + .3, 'sparkle', { g: .7 }]]; };

  /* ---------- the timeline: cuts sit a hair before each line ---------- */
  var DUR = VO.dur;
  var CUTS = [
    ['hook', 'Hired', sHook, 0, null],
    ['worst', 'Worst club', sWorst, at('worst') - .12, 'whip'],
    ['board', 'No money', sBoard, at('board') - .12, 'bars'],
    ['scout', 'Wonderkid', sScout, at('scout') - .12, 'iris'],
    ['tactics', 'Tactics', sTactics, at('tactics') - .12, 'whip'],
    ['match', 'Match day', sMatch, at('match') - .12, 'zoom'],
    ['climb', 'Climb', sClimb, at('climb') - .12, 'slam'],
    ['packs', 'Free packs', sPacks, at('packs') - .12, 'spin'],
    ['cta', 'Dynasty Manager', sCta, at('cta') - .12, 'iris'],
    ['ask', 'Your club?', sAsk, at('ask') - .12, 'whip']
  ];
  /* the kit timeline uses scene-relative u; our scenes draw from absolute t, so wrap them */
  var SCENES = CUTS.map(function (c, i) {
    var t1 = i + 1 < CUTS.length ? CUTS[i + 1][3] : DUR;
    return { id: c[0], name: c[1], dur: t1 - c[3], draw: (function (fn) { return function (g, t, u) { fn(g, t, u); }; })(c[2]), tr: c[4] || undefined, trDur: c[4] === 'iris' ? .55 : c[4] === 'slam' ? .55 : .42, trOpt: c[4] === 'iris' ? { shape: i === 8 ? 'star' : 'circle', x: 540, y: 900 } : { x: 540, y: 900, col: GOLD }, fn: c[2] };
  });
  var FILMK = K.film({ W: W, H: H, scenes: SCENES });
  var SHOTS = SCENES.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });

  /* ---------- sound cues (absolute times) ---------- */
  var TRSFX = { whip: [[-.15, 'whoosh', { d: .3 }]], iris: [[-.3, 'zip'], [.05, 'pop']], bars: [[-.3, 'swish'], [.08, 'swish', { g: .7 }]], zoom: [[-.25, 'whoosh', { d: .25 }], [0, 'thud', { g: .6 }]], slam: [[0, 'slam', { g: .7 }]], spin: [[-.22, 'whoosh', { d: .4 }]] };
  var EV = [];
  SCENES.forEach(function (s) {
    (s.fn.sfx ? s.fn.sfx() : []).forEach(function (e) { EV.push(Object.assign({ t: e[0], type: e[1] }, e[2] || {})); });
    if (s.tr && TRSFX[s.tr]) TRSFX[s.tr].forEach(function (e) { EV.push(Object.assign({ t: s.t0 + e[0], type: e[1] }, e[2] || {})); });
  });
  EV = EV.filter(function (e) { return e.t >= 0 && e.t < DUR; }).sort(function (a, b) { return a.t - b.t; });

  /* on-screen text for the readability check: the caption chunks */
  function TEXTS(t) { var out = []; CHUNKS.forEach(function (c) { if (t >= c.a && t < c.b) out.push({ text: c.map(function (w) { return w.w; }).join(' '), t0: c.a, t1: c.b }); }); return out; }
  function SCORE(ac) { K.score(ac, EV, DUR); }

  function render(t, samples, shutter, fps) { FILMK.render(ctx, t, samples, shutter, fps); }
  function init(canvas) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    return Promise.all(K.FONTS.map(function (f) { return document.fonts.load(f, 'Aa0%?!·£'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: at('goal', 'goal') + .25, SLUG: 'dynasty-manager', SHOTS: SHOTS, init: init, render: render, LIVE: {} };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
