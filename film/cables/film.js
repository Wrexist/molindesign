/* "Cut" — what if every undersea internet cable was cut? Long-form episode 1 of Tech, explained (YouTube, 16:9).
   A stickman explainer written in code, narrated first and cut to the voice: every beat is keyed to a word time from
   vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t. Contract: window.FILM,
   DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). The cast is one rig (guy(): IK arms and legs, a hoodie torso, a
   round head with eyes, brows and mouths, line boil at 8 fps) dressed per character. The format: second person, an
   escalating clock (second, minute, hour, day, week, month) slammed as a time card, every number sourced in BRIEF.md. */
(function () {
  'use strict';
  var W = 1920, H = 1080, VO = window.VO, DUR = VO.dur;
  var INK = '#1c1830', INKA = 'rgba(28,24,48,.55)', NIGHT = '#221d3a', DUSK = '#352b55', PLUM = '#56406f', MAUVE = '#7a5584', GLOW = '#ffb36b';
  var SEA = '#13466a', SEA2 = '#0d2f4c', DEEP = '#08192c', SAND = '#2b3f52', SAND2 = '#22344a';
  var HEAD = '#fbf7ef', HEADS = '#e2dbcc', HOOD = '#ff5b3d', HOODS = '#d6412a';
  var CREAM = '#f4ede0', PAPER = '#f1e9d8', PAPERS = '#e2d6bf', YEL = '#ffc83d', MINT = '#3fd6a2', LIGHT = '#8fe9ff', RED = '#ff4a3d', BLUE = '#3d7bff', GREEN = '#5fb86b', TEAL = '#2a9d8f';
  var DISP = 'Archivo', MONO = '"Geist Mono"', SERIF = '"Instrument Serif"';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function ss(k) { return k * k * (3 - 2 * k); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .85); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .7), 0, 1.08); }
  function win(t, a, b, o) { return t < a || t > b + (o || .3) ? 0 : clamp(sp(t, a, 3, .8), 0, 1.06) * (1 - eio(seg(t, b, b + (o || .3)))); }
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function mix(a, b, k) {
    if (typeof a === 'number') return lerp(a, b, k);
    if (Array.isArray(a)) return a.map(function (v, i) { return mix(v, b[i], k); });
    return k < .4 ? a : b;
  }
  /* piecewise keys: [[t, value], ...], eased between neighbours */
  function kf(t, keys, ez) {
    ez = ez || eio;
    if (t <= keys[0][0]) return keys[0][1];
    for (var i = 1; i < keys.length; i++) if (t < keys[i][0]) return mix(keys[i - 1][1], keys[i][1], ez(seg(t, keys[i - 1][0], keys[i][0])));
    return keys[keys.length - 1][1];
  }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function at(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (!l) throw new Error('no line ' + id);
    if (typeof word === 'number') return l.words[Math.min(word, l.words.length - 1)].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function wend(id, word, nth) {
    var l = LINE[id], n = nth || 0;
    if (typeof word === 'number') return l.words[Math.min(word, l.words.length - 1)].t1;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t1;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  /* scenes: each starts just before its first line; wipe = how it arrives */
  var SC = [
    { id: 'room', name: 'Landed yet?', t0: 0, draw: sRoom },
    { id: 'dive', name: 'The bottom of the Atlantic', t0: start('open3') - .35, draw: sDive, wipe: 'none' },
    { id: 'snap', name: 'Every cable snaps', t0: start('open5') - .3, draw: sSnap, wipe: 'slide' },
    { id: 'ask', name: 'A minute, a day, a month', t0: start('open6') - .25, draw: sAsk, wipe: 'iris' },
    { id: 'title', name: 'Title', t0: start('title') - .45, draw: sTitle, wipe: 'slide' },
    { id: 'map', name: "What's down there", t0: start('size1') - .35, draw: sMap, wipe: 'iris' },
    { id: 'globe', name: '37 times around', t0: start('size4') - .3, draw: sGlobe, wipe: 'slide' },
    { id: 'hose', name: 'A garden hose', t0: start('hose1') - .3, draw: sHose, wipe: 'slide' },
    { id: 'sat', name: 'What about satellites?', t0: start('sat1') - .3, draw: sSat, wipe: 'iris' },
    { id: 'faults', name: '200 breaks a year', t0: start('fault1') - .3, draw: sFaults, wipe: 'slide' },
    { id: 'shark', name: 'Sharks?', t0: start('fault3') - .25, draw: sShark, wipe: 'slide' },
    { id: 'route', name: 'Routing around', t0: start('route1') - .3, draw: sRoute, wipe: 'iris' },
    { id: 'sec', name: 'Second 1', t0: start('sec1') - .45, draw: sSec, wipe: 'slide', clock: 'SECOND 1' },
    { id: 'coast', name: 'No road off the continent', t0: start('sec3') - .3, draw: sCoast, wipe: 'slide' },
    { id: 'min', name: 'Minute 1', t0: start('min1') - .45, draw: sMin, wipe: 'slide', clock: 'MINUTE 1' },
    { id: 'cache', name: 'Copies at home', t0: start('min3') - .3, draw: sCache, wipe: 'iris' },
    { id: 'abroad', name: 'Spinning forever', t0: start('min5') - .3, draw: sAbroad, wipe: 'slide' },
    { id: 'hour', name: 'Hour 1', t0: start('hour1') - .45, draw: sHour, wipe: 'slide', clock: 'HOUR 1' },
    { id: 'markets', name: 'Markets and clouds', t0: start('hour3') - .3, draw: sMarkets, wipe: 'slide' },
    { id: 'river', name: 'A river through a straw', t0: start('hour5') - .3, draw: sRiver, wipe: 'iris' },
    { id: 'island', name: 'Islands cut off', t0: start('island1') - .3, draw: sIsland, wipe: 'slide' },
    { id: 'day', name: 'Day 1: it already happened', t0: start('day1') - .45, draw: sDay, wipe: 'slide', clock: 'DAY 1' },
    { id: 'redsea', name: 'Red Sea, 2024', t0: start('hist3') - .3, draw: sRedSea, wipe: 'slide' },
    { id: 'tonga', name: 'Tonga, 2022', t0: start('hist4') - .3, draw: sTonga, wipe: 'iris' },
    { id: 'week', name: 'Week 1: who fixes this?', t0: start('week1') - .45, draw: sWeek, wipe: 'slide', clock: 'WEEK 1' },
    { id: 'ship', name: 'The repair', t0: start('ship2') - .3, draw: sShip, wipe: 'slide' },
    { id: 'math', name: 'The math', t0: start('math1') - .3, draw: sMath, wipe: 'iris' },
    { id: 'month', name: 'Month 1', t0: start('month1') - .45, draw: sMonth, wipe: 'slide', clock: 'MONTH 1' },
    { id: 'end', name: 'A glass thread', t0: start('end1') - .4, draw: sEnd, wipe: 'iris' },
    { id: 'card', name: 'Subscribe', t0: start('end4') - .3, draw: sCard, wipe: 'slide' }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  /* YouTube chapters (each ≥ 10 s, first at 0:00) */
  var CHAPTERS = [['Your message dives', 0], ["What's down there", S('map').t0], ['Why cables break', S('faults').t0], ['Second 1', S('sec').t0], ['Minute 1', S('min').t0], ['Hour 1', S('hour').t0], ['Day 1: it already happened', S('day').t0], ['Week 1: the repair ships', S('week').t0], ['Month 1', S('month').t0], ['A glass thread', S('end').t0]];

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, NOISE, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam, wide) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); try { g.fontStretch = wide ? 'expanded' : 'normal'; } catch (e) {} }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, 6.2832); }
  function fillStroke(g, fill, lw, stroke) { if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = stroke || INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
  function txt(g, s, x, y, px, col, o) {
    o = o || {}; font(g, px, o.wt || 800, o.fam, o.wide); ls(g, o.ls || 0);
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    if (o.outline) { g.lineWidth = o.outline; g.strokeStyle = o.ocol || INK; g.lineJoin = 'round'; g.strokeText(s, x, y); }
    g.fillStyle = col || CREAM; g.fillText(s, x, y); var w = g.measureText(s).width; ls(g, 0); return w;
  }
  /* a pill/label card with a hard ink shadow */
  function chip(g, s, x, y, o) {
    o = o || {}; var px = o.px || 44, a = o.a == null ? 1 : o.a, sc = o.s == null ? 1 : o.s;
    if (a <= 0 || sc <= 0) return;
    font(g, px, o.wt || 800, o.fam, o.wide); ls(g, o.ls || 0);
    var tw = g.measureText(s).width, pad = o.pad == null ? px * .42 : o.pad, w = o.w || tw + pad * 2, h = o.h || px * 1.45;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(o.rot || 0); g.scale(sc, sc);
    if (!o.flat) { rr(g, -w / 2 + 7, -h / 2 + 9, w, h, o.r == null ? h * .3 : o.r); g.fillStyle = 'rgba(10,8,20,.45)'; g.fill(); }
    rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .3 : o.r); fillStroke(g, o.bg || CREAM, o.lw == null ? 5 : o.lw, o.line || INK);
    g.fillStyle = o.fg || INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, px * .05);
    ls(g, 0); g.restore(); return w;
  }
  function arrow(g, x0, y0, x1, y1, k, col, lw, head) {
    if (k <= 0) return;
    var x = lerp(x0, x1, k), y = lerp(y0, y1, k), a = Math.atan2(y1 - y0, x1 - x0), hd = head || 30;
    g.save(); g.strokeStyle = g.fillStyle = col || CREAM; g.lineWidth = lw || 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x - Math.cos(a) * hd * .5, y - Math.sin(a) * hd * .5); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a - .45) * hd, y - Math.sin(a - .45) * hd); g.lineTo(x - Math.cos(a + .45) * hd, y - Math.sin(a + .45) * hd); g.closePath(); g.fill();
    g.restore();
  }
  function cross(g, x, y, s, a, col) {
    if (a <= 0 || s <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.lineCap = 'round';
    g.strokeStyle = INK; g.lineWidth = 22; g.beginPath(); g.moveTo(-26, -26); g.lineTo(26, 26); g.moveTo(26, -26); g.lineTo(-26, 26); g.stroke();
    g.strokeStyle = col || RED; g.lineWidth = 12; g.stroke(); g.restore();
  }
  function tick(g, x, y, s, a, col) {
    if (a <= 0 || s <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.lineCap = g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-24, 0); g.lineTo(-7, 18); g.lineTo(26, -20);
    g.strokeStyle = INK; g.lineWidth = 22; g.stroke(); g.strokeStyle = col || MINT; g.lineWidth = 12; g.stroke(); g.restore();
  }
  /* spark burst: a star of short ink-edged rays, for every break */
  function spark(g, x, y, t, t0, s, col) {
    if (t < t0 || t > t0 + .7) return;
    var k = seg(t, t0, t0 + .7), r = 20 + eo(k) * 90 * (s || 1), a = 1 - k;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.lineCap = 'round';
    for (var i = 0; i < 9; i++) {
      var an = i / 9 * 6.283 + hash(t0 * 10 + i) * .5, r0 = r * .35, r1 = r * (.8 + hash(i + t0) * .4);
      g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.moveTo(Math.cos(an) * r0, Math.sin(an) * r0); g.lineTo(Math.cos(an) * r1, Math.sin(an) * r1); g.stroke();
      g.strokeStyle = i % 2 ? YEL : (col || CREAM); g.lineWidth = 6; g.stroke();
    }
    circ(g, 0, 0, 26 * (1 - k)); g.fillStyle = '#fff6d8'; g.fill(); g.restore();
  }
  function spinner(g, x, y, r, t, col, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(t * 6); g.lineCap = 'round';
    for (var i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.globalAlpha = a * (.2 + .8 * i / 7); g.strokeStyle = col || INK; g.lineWidth = r * .22; g.beginPath(); g.moveTo(r * .5, 0); g.lineTo(r, 0); g.stroke(); }
    g.restore();
  }
  /* soft vignette + a warm/cool light from one side, keeps flat scenes from looking like clip art */
  function vignette(g, a) {
    var r = g.createRadialGradient(W / 2, H * .45, H * .35, W / 2, H * .5, H * 1.05);
    r.addColorStop(0, 'rgba(10,6,24,0)'); r.addColorStop(1, 'rgba(10,6,24,' + (a == null ? .55 : a) + ')');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
  }

  /* ---------- the rig: one character, many costumes ---------- */
  var BASE = { lh: [-60, -150], rh: [60, -150], lf: [-26, 0], rf: [26, 0], hip: 0, lean: 0, tilt: 0, look: [0, 0], eyes: 'dot', brow: 0, mouth: 'smile', jump: 0, front: 0 };
  function poseAt(t, keys) {
    var cur = Object.assign({}, BASE), tgt = cur;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i]; if (t < k[0]) break;
      var nt = Object.assign({}, tgt, k[1]), e = eio(seg(t, k[0], k[0] + (k[2] || .32)));
      var out = {}; for (var key in nt) out[key] = cur[key] === undefined ? nt[key] : mix(cur[key], nt[key], e);
      cur = out; tgt = nt;
    }
    return cur;
  }
  function ik(r, tg, l1, l2, side, down) {
    var dx = tg[0] - r[0], dy = tg[1] - r[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - .5), a = Math.atan2(dy, dx);
    var c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), b = Math.acos(c);
    var e1 = [r[0] + l1 * Math.cos(a + b), r[1] + l1 * Math.sin(a + b)], e2 = [r[0] + l1 * Math.cos(a - b), r[1] + l1 * Math.sin(a - b)];
    var el = down ? (e1[1] > e2[1] ? e1 : e2) : ((e1[0] - r[0]) * side > (e2[0] - r[0]) * side ? e1 : e2);
    var k = Math.min(1, (l1 + l2) / Math.hypot(dx, dy));
    return [el, k < 1 ? [r[0] + dx * k, r[1] + dy * k] : tg];
  }
  function limb(g, pts, w, col) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.lineCap = g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = w + 9; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke();
  }
  function guy(g, x, y, s, P, o, t) {
    o = o || {}; var col = o.col || HOOD, sh = o.shade || HOODS, seed = o.seed || 1, bt = Math.floor(t * 8);
    function j(i) { return (hash(bt * 13.1 + i * 3.7 + seed * 17.3) - .5) * 2.4; }
    var br = Math.sin(t * 2.2 + seed) * 2.2, sway = Math.sin(t * 1.3 + seed * 2) * 3;
    g.save(); g.translate(x, y - (P.jump || 0)); g.scale(s * (o.flip ? -1 : 1), s);
    var hip = [0, -150 + (P.hip || 0)], lean = P.lean || 0;
    function R(px, py) { return [hip[0] + px * Math.cos(lean) - py * Math.sin(lean), hip[1] + px * Math.sin(lean) + py * Math.cos(lean)]; }
    var shL = R(-40, -106 - br * .3), shR = R(40, -106 - br * .3), neck = R(0, -122 - br * .5);
    /* legs */
    var legC = o.legs || HEAD;
    [[-1, P.lf], [1, P.rf]].forEach(function (L, i) {
      var root = [hip[0] + L[0] * 20, hip[1]], tg = [L[1][0] + j(i), L[1][1]], r = ik(root, tg, 80, 78, L[0], false);
      limb(g, [root, [r[0][0] + j(i + 4), r[0][1] + j(i + 6)], r[1]], 13, legC);
      g.save(); g.translate(r[1][0] + L[0] * 7, r[1][1] + 2); g.beginPath(); g.ellipse(0, 0, 19, 10, 0, 0, 6.283); fillStroke(g, o.shoe || INK, 0); g.restore();
    });
    /* torso: a hoodie with hood ring, pocket and strings */
    g.save(); g.translate(hip[0], hip[1]); g.rotate(lean);
    g.beginPath(); g.moveTo(-47 + j(1) * .5, 6); g.quadraticCurveTo(-55, -58, -43 + j(2) * .5, -112 - br * .3); g.quadraticCurveTo(0, -130 - br * .4, 43, -112 - br * .3); g.quadraticCurveTo(55, -58, 47, 6); g.quadraticCurveTo(0, 13, -47, 6); g.closePath();
    fillStroke(g, col, 0); g.save(); g.clip(); g.fillStyle = sh; g.fillRect(16, -140, 60, 160); if (o.vest) { g.fillStyle = YEL; g.fillRect(-60, -70, 140, 16); g.fillRect(-60, -30, 140, 16); } g.restore();
    fillStroke(g, null, 5);
    g.beginPath(); g.moveTo(-28, -50); g.lineTo(28, -50); g.lineTo(22, -18); g.lineTo(-22, -18); g.closePath(); fillStroke(g, sh, 4);
    if (o.tie) { g.beginPath(); g.moveTo(0, -116); g.lineTo(-9, -96); g.lineTo(0, -50); g.lineTo(9, -96); g.closePath(); fillStroke(g, o.tie, 3.5); }
    else { g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-9, -110); g.lineTo(-11, -84); g.moveTo(9, -110); g.lineTo(11, -84); g.stroke(); }
    g.beginPath(); g.ellipse(0, -117 - br * .4, 32, 12, 0, 0, 6.283); fillStroke(g, sh, 4.5);
    g.restore();
    /* arms (after torso), hands */
    function arms() {
      [[-1, P.lh, shL], [1, P.rh, shR]].forEach(function (A, i) {
        var tg = [A[1][0] + sway * (i ? -.3 : .3) + j(i + 9), A[1][1] + j(i + 11)], r = ik(A[2], tg, 70, 66, A[0], !!P.elDown);
        limb(g, [A[2], [r[0][0] + j(i + 13), r[0][1]], r[1]], 15, col);
        circ(g, r[1][0], r[1][1], 12.5); fillStroke(g, HEAD, 4.5);
        if (o.hold && o.hold[i]) { g.save(); g.translate(r[1][0], r[1][1]); o.hold[i](g); g.restore(); }
      });
    }
    if (!P.front) arms();
    /* head */
    var tilt = lean + (P.tilt || 0), hc = [neck[0] + Math.sin(tilt) * 56, neck[1] - Math.cos(tilt) * 56];
    g.save(); g.translate(hc[0] + j(20) * .5, hc[1]); g.rotate(tilt);
    if (o.helmet) { circ(g, 0, 0, 82); g.fillStyle = 'rgba(180,235,255,.16)'; g.fill(); g.lineWidth = 5; g.strokeStyle = 'rgba(200,240,255,.7)'; g.stroke(); }
    if (o.hair === 'bun') { circ(g, 0, -62, 22); fillStroke(g, '#c9c3cf', 4.5); }
    circ(g, 0, 0, 56); fillStroke(g, HEADS, 0);
    g.save(); circ(g, 0, 0, 56); g.clip(); circ(g, -9, -8, 54); g.fillStyle = HEAD; g.fill(); g.restore();
    circ(g, 0, 0, 56); fillStroke(g, null, 5);
    if (o.hair === 'bun') { g.beginPath(); g.arc(0, 0, 56, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(30, -30); g.quadraticCurveTo(0, -44, -30, -30); g.closePath(); fillStroke(g, '#c9c3cf', 4.5); }
    face(g, P, t, seed, o);
    hat(g, o);
    if (o.glasses) { g.strokeStyle = INK; g.lineWidth = 4; circ(g, -20, -4, 15); g.stroke(); circ(g, 20, -4, 15); g.stroke(); g.beginPath(); g.moveTo(-5, -5); g.lineTo(5, -5); g.stroke(); }
    if (o.helmet) { g.beginPath(); g.arc(-28, -36, 40, Math.PI * 1.1, Math.PI * 1.45); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 7; g.lineCap = 'round'; g.stroke(); }
    g.restore();
    if (P.front) arms();
    g.restore();
  }
  function face(g, P, t, seed, o) {
    var lx = (P.look ? P.look[0] : 0) * 7, ly = (P.look ? P.look[1] : 0) * 6;
    var blink = ((t + seed * 1.37) % 3.7) < .11, e = blink && P.eyes !== 'x' ? 'shut' : P.eyes;
    g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round';
    [-1, 1].forEach(function (sd) {
      var ex = sd * 19 + lx, ey = -4 + ly;
      if (e === 'dot') { g.beginPath(); g.ellipse(ex, ey, 7.5, 10, 0, 0, 6.283); g.fill(); circ(g, ex - 2.5, ey - 4, 2.4); g.fillStyle = '#fff'; g.fill(); g.fillStyle = INK; }
      else if (e === 'wide') { g.beginPath(); g.ellipse(ex, ey, 10.5, 14, 0, 0, 6.283); g.fill(); circ(g, ex - 3.5, ey - 5, 3.4); g.fillStyle = '#fff'; g.fill(); g.fillStyle = INK; }
      else if (e === 'tiny') { circ(g, ex, ey, 4.5); g.fill(); }
      else if (e === 'happy') { g.lineWidth = 5.5; g.beginPath(); g.arc(ex, ey + 5, 9, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      else if (e === 'x') { g.lineWidth = 5; g.beginPath(); g.moveTo(ex - 7, ey - 7); g.lineTo(ex + 7, ey + 7); g.moveTo(ex + 7, ey - 7); g.lineTo(ex - 7, ey + 7); g.stroke(); }
      else { g.lineWidth = 5; g.beginPath(); g.moveTo(ex - 8, ey + 1); g.lineTo(ex + 8, ey + 1); g.stroke(); }
      /* brows */
      var b = P.brow || 0, by = -27 + ly * .5 - (b === 1 ? 7 : 0), inner = b === -1 ? 6 : b === 2 ? -6 : 0;
      g.lineWidth = 5; g.beginPath(); g.moveTo(ex - sd * 11, by + (sd < 0 ? 0 : inner) * (sd < 0 ? 1 : 1)); g.lineTo(ex + sd * 11, by);
      g.beginPath(); g.moveTo(sd * 8 + lx, by + inner); g.lineTo(sd * 30 + lx, by); g.stroke();
    });
    var m = P.mouth, my = 24 + ly * .5, mx = lx * .6;
    g.lineWidth = 5;
    if (m === 'smile') { g.beginPath(); g.arc(mx, my - 8, 13, Math.PI * .2, Math.PI * .8); g.stroke(); }
    else if (m === 'grin') { g.beginPath(); g.moveTo(mx - 17, my - 4); g.quadraticCurveTo(mx, my - 8, mx + 17, my - 4); g.quadraticCurveTo(mx, my + 22, mx - 17, my - 4); g.fill(); g.save(); g.clip(); circ(g, mx, my + 14, 9); g.fillStyle = '#ff7a8a'; g.fill(); g.restore(); }
    else if (m === 'o') { g.beginPath(); g.ellipse(mx, my, 6, 8, 0, 0, 6.283); g.fill(); }
    else if (m === 'O') { g.beginPath(); g.ellipse(mx, my + 2, 11, 15, 0, 0, 6.283); g.fill(); }
    else if (m === 'frown') { g.beginPath(); g.arc(mx, my + 10, 12, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
    else if (m === 'wavy') { g.beginPath(); g.moveTo(mx - 15, my); for (var i = 1; i <= 6; i++) g.lineTo(mx - 15 + i * 5, my + (i % 2 ? -4 : 4)); g.stroke(); }
    else if (m === 'talk') { var op = .5 + .5 * Math.abs(Math.sin(t * 15)); g.beginPath(); g.ellipse(mx, my, 9, 3 + op * 8, 0, 0, 6.283); g.fill(); }
    else { g.beginPath(); g.moveTo(mx - 10, my); g.lineTo(mx + 10, my); g.stroke(); }
  }
  function hat(g, o) {
    if (o.hat === 'hard') { g.beginPath(); g.arc(0, -22, 52, Math.PI, 0); g.closePath(); fillStroke(g, YEL, 5); g.beginPath(); g.ellipse(0, -22, 66, 9, 0, 0, 6.283); fillStroke(g, YEL, 5); g.beginPath(); g.moveTo(0, -74); g.lineTo(0, -30); g.lineWidth = 4; g.stroke(); }
    else if (o.hat === 'cap') { g.beginPath(); g.arc(0, -16, 55, Math.PI * 1.02, -.02); g.closePath(); fillStroke(g, o.capCol || GREEN, 5); g.beginPath(); g.moveTo(30, -18); g.quadraticCurveTo(80, -22, 92, -8); g.lineTo(34, -6); g.closePath(); fillStroke(g, o.capCol || GREEN, 5); }
    else if (o.hat === 'sun') { g.beginPath(); g.ellipse(0, -36, 92, 16, 0, 0, 6.283); fillStroke(g, '#e8c57a', 5); g.beginPath(); g.arc(0, -36, 46, Math.PI, 0); g.closePath(); fillStroke(g, '#e8c57a', 5); g.fillStyle = HOOD; g.fillRect(-44, -48, 88, 10); }
    else if (o.hat === 'beanie') { g.beginPath(); g.arc(0, -14, 56, Math.PI, 0); g.closePath(); fillStroke(g, o.capCol || BLUE, 5); rr(g, -60, -24, 120, 20, 8); fillStroke(g, o.capCol || BLUE, 5); circ(g, 0, -74, 12); fillStroke(g, CREAM, 4); }
  }
  /* the cast */
  var YOU = { col: HOOD, shade: HOODS, seed: 1 };
  var FRIEND = { col: GREEN, shade: '#46955a', seed: 4, hat: 'cap', capCol: '#2f6f4a' };

  /* ---------- props ---------- */
  function phone(g, x, y, s, rot, screen) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    rr(g, -36, -66, 72, 132, 14); fillStroke(g, '#2a2638', 5);
    rr(g, -29, -56, 58, 112, 8); g.fillStyle = screen || '#9ee6ff'; g.fill(); g.restore();
  }
  /* a big phone with a chat: msgs [{text, side, t, status}] */
  function chatPhone(g, x, y, s, a, t, head, msgs, typing) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s);
    rr(g, -170 + 10, -320 + 14, 340, 640, 44); g.fillStyle = 'rgba(8,6,18,.5)'; g.fill();
    rr(g, -170, -320, 340, 640, 44); fillStroke(g, '#2a2638', 6);
    rr(g, -152, -296, 304, 592, 30); g.fillStyle = '#f7f3ea'; g.fill();
    rr(g, -152, -296, 304, 92, [30, 30, 0, 0]); g.fillStyle = '#ebe4d6'; g.fill();
    circ(g, -104, -250, 26); fillStroke(g, GREEN, 4);
    txt(g, head[0], -64, -262, 30, INK, { align: 'left', wt: 800 }); txt(g, head[1], -64, -230, 22, 'rgba(28,24,48,.6)', { align: 'left', wt: 500, fam: MONO });
    var yy = -150;
    msgs.forEach(function (m) {
      if (t < m.t) return;
      var k = pop(t, m.t, 3.2, .7), me = m.side > 0;
      font(g, 30, 700); var tw = Math.min(220, g.measureText(m.text).width), bw = tw + 44, bh = 64, bx = me ? 130 - bw : -130;
      g.save(); g.translate(bx + bw / 2, yy + bh / 2); g.scale(k, k);
      rr(g, -bw / 2, -bh / 2, bw, bh, 24); fillStroke(g, me ? BLUE : '#e4ddcf', 0);
      txt(g, m.text, 0, 2, 30, me ? '#fff' : INK, { wt: 700 }); g.restore();
      if (m.status) {
        var st = m.status(t);
        if (st) { g.save(); g.globalAlpha *= clamp(k, 0, 1); txt(g, st[0], 128, yy + bh + 22, 22, st[1] || 'rgba(28,24,48,.6)', { align: 'right', wt: 600, fam: MONO }); if (st[2] === 'spin') spinner(g, 128 - g.measureText(st[0]).width - 20, yy + bh + 22, 11, t, 'rgba(28,24,48,.6)', 1); g.restore(); }
      }
      yy += bh + 56;
    });
    if (typing) {
      var tx = typing(t); if (tx) { rr(g, -130, 210, 260, 60, 30); fillStroke(g, '#fff', 3, '#cfc6b4'); txt(g, tx, -110, 241, 28, INK, { align: 'left', wt: 600 }); if (Math.floor(t * 3) % 2) { g.fillStyle = BLUE; g.fillRect(-106 + g.measureText(tx).width, 222, 3, 38); } }
    }
    g.restore();
  }
  function couch(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    rr(g, -330, -250, 660, 200, 40); fillStroke(g, PLUM, 6);
    rr(g, -380, -130, 130, 170, 34); fillStroke(g, MAUVE, 6); rr(g, 250, -130, 130, 170, 34); fillStroke(g, MAUVE, 6);
    rr(g, -260, -110, 520, 110, 26); fillStroke(g, MAUVE, 6);
    g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -105); g.lineTo(0, -4); g.stroke();
    g.fillStyle = INK; g.fillRect(-340, 36, 22, 30); g.fillRect(318, 36, 22, 30);
    g.restore();
  }
  function roomBG(g, t, warm) {
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2e2650'); gr.addColorStop(1, '#41335f'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    /* window with a night city */
    g.save(); rr(g, 1120, 110, 620, 520, 10); g.clip();
    var sk = g.createLinearGradient(0, 110, 0, 630); sk.addColorStop(0, '#2a3f78'); sk.addColorStop(.7, '#6a4a86'); sk.addColorStop(1, '#d97a6c'); g.fillStyle = sk; g.fillRect(1120, 110, 620, 520);
    circ(g, 1600, 220, 46); g.fillStyle = '#ffeec8'; g.fill();
    var r = mulberry(11);
    for (var i = 0; i < 12; i++) {
      var bx = 1110 + i * 56, bh = 120 + r() * 260, bw = 50 + r() * 26;
      g.fillStyle = i % 2 ? '#241d40' : '#2d2550'; g.fillRect(bx, 630 - bh, bw, bh);
      for (var wy = 630 - bh + 18; wy < 620; wy += 30) for (var wx = bx + 8; wx < bx + bw - 10; wx += 16) if (r() < .32) { g.fillStyle = r() < .5 ? '#ffd27a' : '#ffb35c'; g.fillRect(wx, wy, 7, 11); }
    }
    g.restore();
    rr(g, 1120, 110, 620, 520, 10); fillStroke(g, null, 10, '#1c1830');
    g.fillStyle = '#1c1830'; g.fillRect(1425, 110, 10, 520); g.fillRect(1120, 365, 620, 10);
    rr(g, 1100, 630, 660, 26, 6); fillStroke(g, '#5b4a7e', 5);
    /* lamp glow */
    var lg = g.createRadialGradient(330, 380, 10, 330, 380, 520); lg.addColorStop(0, 'rgba(255,190,120,' + (warm == null ? .4 : warm) + ')'); lg.addColorStop(1, 'rgba(255,190,120,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1c1830'; g.fillRect(322, 330, 10, 480); g.beginPath(); g.moveTo(260, 330); g.lineTo(400, 330); g.lineTo(370, 250); g.lineTo(290, 250); g.closePath(); fillStroke(g, '#ffcf8a', 5);
    /* floor */
    g.fillStyle = '#2a2142'; g.fillRect(0, 860, W, 220); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 860, W, 10);
    rr(g, 520, 900, 900, 90, 45); g.fillStyle = '#4a3a6a'; g.fill();
  }
  /* the sea: gradient, god rays, drifting marine snow, a sandy floor at fy */
  function seaBG(g, t, fy, o) {
    o = o || {};
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, o.top || SEA); gr.addColorStop(1, o.bot || DEEP); g.fillStyle = gr; g.fillRect(-400, -400, W + 800, H + 800);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 6; i++) {
      var x = 200 + i * 320 + Math.sin(t * .3 + i) * 60, a = .035 + .025 * Math.sin(t * .7 + i * 2);
      g.beginPath(); g.moveTo(x - 40, -100); g.lineTo(x + 60, -100); g.lineTo(x + 260, H); g.lineTo(x + 60, H); g.closePath(); g.fillStyle = 'rgba(160,230,255,' + a + ')'; g.fill();
    }
    g.restore();
    var r = mulberry(5);
    for (i = 0; i < 70; i++) { var px = (r() * (W + 200) + t * (6 + r() * 10)) % (W + 200) - 100, py = (r() * H + t * (8 + r() * 14)) % H; circ(g, px, py, 1 + r() * 2.2); g.fillStyle = 'rgba(210,240,255,' + (.12 + r() * .25) + ')'; g.fill(); }
    if (fy != null) floor(g, fy, t);
  }
  function floor(g, fy, t) {
    g.beginPath(); g.moveTo(-400, fy); for (var x = -400; x <= W + 400; x += 80) g.lineTo(x, fy + Math.sin(x * .006) * 16 + Math.sin(x * .017) * 6); g.lineTo(W + 400, H + 400); g.lineTo(-400, H + 400); g.closePath();
    var gr = g.createLinearGradient(0, fy - 20, 0, H); gr.addColorStop(0, SAND); gr.addColorStop(1, SAND2); g.fillStyle = gr; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    var r = mulberry(9); for (var i = 0; i < 14; i++) { var rx = r() * W, ry = fy + 30 + r() * (H - fy); g.beginPath(); g.ellipse(rx, ry, 20 + r() * 40, 8 + r() * 10, 0, 0, 6.283); g.fillStyle = 'rgba(15,25,40,.35)'; g.fill(); }
    /* swaying kelp */
    for (i = 0; i < 7; i++) {
      var kx = 80 + i * 300 + r() * 120, kh = 120 + r() * 160;
      g.beginPath(); g.moveTo(kx, fy + 10); for (var k = 1; k <= 6; k++) g.lineTo(kx + Math.sin(t * 1.4 + k * .6 + i) * k * 4, fy + 10 - kh * k / 6);
      g.lineWidth = 12; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); g.lineWidth = 6; g.strokeStyle = '#2f7f6a'; g.stroke();
    }
  }
  /* a sea-floor cable along a polyline-ish curve; lit = light pulses inside (0..1); cut = gap at x with sag */
  function cableLine(g, x0, x1, y, t, o) {
    o = o || {}; var lw = o.w || 18, lit = o.lit == null ? 1 : o.lit;
    function yAt(x) { return y + Math.sin(x * .004 + (o.ph || 0)) * (o.amp == null ? 18 : o.amp); }
    function path(a, b, droop, side) {
      g.beginPath(); for (var x = a; x <= b + .1; x += 20) { var d = 0; if (droop) { var dd = side < 0 ? (b - x) : (x - a); d = droop * Math.max(0, 1 - dd / 160) * Math.max(0, 1 - dd / 160); } var yy = yAt(x) + d; if (x === a) g.moveTo(x, yy); else g.lineTo(x, yy); }
    }
    var parts = o.cut != null ? [[x0, o.cut - o.gap / 2, -1], [o.cut + o.gap / 2, x1, 1]] : [[x0, x1, 0]];
    parts.forEach(function (p) {
      var dr = p[2] ? (o.droop || 0) : 0;
      path(p[0], p[1], dr, p[2] < 0 ? 1 : -1);
      g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = lw + 10; g.stroke(); g.strokeStyle = o.col || '#3b3550'; g.lineWidth = lw; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = lw * .3; g.save(); g.translate(0, -lw * .22); g.stroke(); g.restore();
      if (lit > 0) {
        g.save(); g.setLineDash([26, 140]); g.lineDashOffset = -t * (o.speed || 900); g.strokeStyle = 'rgba(143,233,255,' + (.9 * lit) + ')'; g.lineWidth = lw * .34; g.shadowColor = LIGHT; g.shadowBlur = 14 * lit; g.stroke(); g.restore();
      }
    });
    return yAt;
  }
  function fish(g, x, y, s, t, col, flip) {
    g.save(); g.translate(x, y); g.scale(s * (flip ? -1 : 1), s); var w = Math.sin(t * 9) * .25;
    g.beginPath(); g.ellipse(0, 0, 34, 16, 0, 0, 6.283); fillStroke(g, col || YEL, 4);
    g.beginPath(); g.moveTo(-30, 0); g.lineTo(-54, -14 + w * 20); g.lineTo(-54, 14 + w * 20); g.closePath(); fillStroke(g, col || YEL, 4);
    circ(g, 18, -4, 3.5); g.fillStyle = INK; g.fill(); g.restore();
  }
  function shipHull(g, x, y, s, col, rot, o) {
    o = o || {};
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.beginPath(); g.moveTo(-260, -40); g.lineTo(270, -40); g.lineTo(220, 40); g.lineTo(-230, 40); g.closePath(); fillStroke(g, col || '#c9473a', 6);
    g.fillStyle = INK; g.fillRect(-230, 20, 450, 8);
    if (o.repair) {
      rr(g, -200, -130, 170, 90, 8); fillStroke(g, CREAM, 6); for (var i = 0; i < 4; i++) { rr(g, -186 + i * 40, -116, 26, 22, 4); fillStroke(g, '#8fd3ff', 3); }
      rr(g, -150, -175, 50, 45, 6); fillStroke(g, CREAM, 5);
      /* the bow sheave: the big wheel the cable comes over */
      circ(g, 245, -60, 34); fillStroke(g, YEL, 6); circ(g, 245, -60, 8); g.fillStyle = INK; g.fill();
      g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(140, -40); g.lineTo(225, -84); g.stroke();
      txt(g, 'CABLE REPAIR', 20, 0, 30, CREAM, { wt: 900, wide: true });
    } else if (o.cargo) {
      var cc = ['#3d7bff', '#ffc83d', '#3fd6a2', '#ff5b3d', '#e7e0d2'];
      for (i = 0; i < 7; i++) for (var j2 = 0; j2 < 2; j2++) { rr(g, -200 + i * 56, -88 - j2 * 46, 52, 44, 3); fillStroke(g, cc[(i + j2 * 2) % 5], 4); }
      rr(g, 200, -150, 60, 110, 6); fillStroke(g, CREAM, 5);
    } else if (o.trawler) {
      rr(g, -60, -120, 120, 80, 8); fillStroke(g, CREAM, 6); rr(g, -40, -104, 34, 26, 4); fillStroke(g, '#8fd3ff', 3); rr(g, 6, -104, 34, 26, 4); fillStroke(g, '#8fd3ff', 3);
      g.strokeStyle = INK; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(-200, -40); g.lineTo(-250, -170); g.stroke();
    }
    g.restore();
  }
  function waterSurface(g, y, t, x0, x1, col) {
    g.beginPath(); g.moveTo(x0, y); for (var x = x0; x <= x1; x += 30) g.lineTo(x, y + Math.sin(x * .01 + t * 2) * 7 + Math.sin(x * .023 - t * 1.3) * 4); g.lineTo(x1, y + 2000); g.lineTo(x0, y + 2000); g.closePath();
    var gr = g.createLinearGradient(0, y, 0, y + 900); gr.addColorStop(0, col || '#1f6a92'); gr.addColorStop(1, DEEP); g.fillStyle = gr; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    g.save(); g.globalAlpha = .5; g.strokeStyle = '#bfefff'; g.lineWidth = 4; g.setLineDash([40, 90]); g.lineDashOffset = t * 40; g.beginPath(); for (x = x0; x <= x1; x += 30) g.lineTo(x, y + 16 + Math.sin(x * .01 + t * 2) * 5); g.stroke(); g.restore();
  }
  function server(g, x, y, s, lit, t, o) {
    o = o || {};
    g.save(); g.translate(x, y); g.scale(s, s);
    rr(g, -70, -170, 140, 170, 10); fillStroke(g, '#3a3352', 6);
    for (var i = 0; i < 4; i++) { rr(g, -54, -156 + i * 38, 108, 28, 5); fillStroke(g, '#4c4468', 3.5); for (var k = 0; k < 3; k++) { circ(g, -38 + k * 14, -142 + i * 38, 4.5); var on = lit > 0 && hash(Math.floor(t * 6) + i * 7 + k * 3) > .35; g.fillStyle = on ? (o.col || MINT) : '#2a2440'; g.fill(); } g.fillStyle = '#2a2440'; g.fillRect(4, -146 + i * 38, 40, 8); }
    g.restore();
  }
  function cloudShape(g, x, y, s, fill) {
    g.save(); g.translate(x, y); g.scale(s, s); g.beginPath();
    g.arc(-70, 10, 50, Math.PI * .5, Math.PI * 1.5); g.arc(-20, -40, 60, Math.PI, Math.PI * 1.85); g.arc(55, -20, 55, Math.PI * 1.3, Math.PI * .1); g.arc(60, 25, 35, -Math.PI * .5, Math.PI * .5); g.closePath();
    fillStroke(g, fill || CREAM, 6); g.restore();
  }
  function satellite(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(-120, 0); g.lineTo(120, 0); g.stroke();
    [-1, 1].forEach(function (sd) { rr(g, sd < 0 ? -190 : 70, -30, 120, 60, 4); fillStroke(g, '#3d64b8', 5); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; for (var i = 1; i < 4; i++) { g.beginPath(); g.moveTo((sd < 0 ? -190 : 70) + i * 30, -28); g.lineTo((sd < 0 ? -190 : 70) + i * 30, 28); g.stroke(); } });
    rr(g, -42, -42, 84, 84, 8); fillStroke(g, '#d6a043', 5); g.beginPath(); g.arc(0, 42, 26, Math.PI, 0); fillStroke(g, CREAM, 5);
    g.restore();
  }
  function calendar(g, x, y, s, top, big, a, rot) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    rr(g, -110 + 8, -120 + 10, 220, 240, 18); g.fillStyle = 'rgba(8,6,18,.45)'; g.fill();
    rr(g, -110, -120, 220, 240, 18); fillStroke(g, PAPER, 6); rr(g, -110, -120, 220, 70, [18, 18, 0, 0]); fillStroke(g, RED, 6);
    txt(g, top, 0, -84, 34, CREAM, { wt: 900, wide: true }); txt(g, big, 0, 30, 100, INK, { wt: 900 });
    g.restore();
  }
  /* paper card with a caption: like a clipping pinned to the frame */
  function card(g, x, y, w, h, rot, a, fn, col) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(8,6,18,.45)'; g.fillRect(-w / 2 + 12, -h / 2 + 16, w, h);
    g.beginPath(); g.rect(-w / 2, -h / 2, w, h); fillStroke(g, col || PAPER, 5);
    if (fn) fn(g, w, h);
    g.restore();
  }
  function tape(g, x, y, rot) { g.save(); g.translate(x, y); g.rotate(rot || 0); g.fillStyle = 'rgba(255,240,190,.75)'; g.fillRect(-50, -16, 100, 32); g.restore(); }

  /* ---------- the world map: hand-simplified coastlines (lon, lat) ---------- */
  var LAND = [
    [[-168, 65], [-162, 71], [-140, 70], [-120, 73], [-95, 72], [-80, 74], [-62, 66], [-55, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-90, 30], [-97, 27], [-97, 21], [-92, 18], [-87, 21], [-88, 15], [-83, 9], [-79, 8], [-85, 11], [-92, 14], [-105, 20], [-110, 24], [-115, 30], [-118, 34], [-124, 40], [-124, 48], [-130, 55], [-140, 60], [-150, 60], [-158, 57], [-165, 60]],
    [[-55, 60], [-43, 60], [-20, 70], [-20, 80], [-40, 83], [-65, 80], [-58, 75], [-52, 68]],
    [[-80, 9], [-72, 12], [-62, 11], [-50, 0], [-35, -5], [-39, -14], [-41, -22], [-48, -26], [-53, -34], [-58, -38], [-65, -42], [-68, -50], [-70, -55], [-74, -52], [-73, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -6], [-80, 0], [-77, 4]],
    [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [5, 53], [8, 57], [5, 62], [14, 67], [25, 71], [40, 68], [55, 70], [70, 73], [90, 76], [110, 77], [140, 72], [160, 70], [180, 68], [180, 64], [170, 60], [160, 58], [156, 51], [142, 47], [140, 40], [130, 35], [127, 38], [122, 40], [121, 31], [117, 24], [110, 21], [108, 16], [109, 12], [105, 9], [100, 13], [100, 7], [104, 1], [98, 8], [97, 17], [92, 22], [88, 22], [80, 15], [78, 8], [73, 17], [72, 21], [66, 25], [57, 26], [56, 24], [52, 24], [50, 30], [48, 29], [54, 17], [45, 13], [43, 17], [35, 28], [34, 31], [36, 36], [30, 36], [27, 37], [26, 40], [23, 36], [20, 40], [16, 38], [18, 40], [13, 45], [8, 44], [3, 43], [-4, 37]],
    [[-17, 21], [-16, 28], [-9, 33], [-5, 36], [10, 37], [11, 33], [20, 31], [32, 31], [34, 28], [38, 18], [43, 12], [51, 12], [48, 5], [40, -3], [40, -11], [35, -20], [33, -26], [27, -34], [19, -35], [16, -28], [12, -17], [13, -8], [9, -1], [9, 4], [4, 6], [-8, 4], [-13, 8], [-17, 14]],
    [[-5, 50], [1, 51], [2, 53], [-1, 55], [-2, 58], [-5, 58], [-6, 56], [-3, 54], [-5, 52]],
    [[-10, 52], [-6, 52], [-6, 55], [-8, 55]],
    [[-24, 64], [-14, 64], [-15, 66], [-22, 66]],
    [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [135, -35], [129, -32], [115, -34]],
    [[130, 31], [135, 34], [141, 36], [142, 40], [141, 45], [143, 44], [140, 41], [136, 35], [131, 34]],
    [[95, 5], [106, -6], [102, -4]], [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]], [[131, -1], [141, -3], [150, -10], [141, -9]],
    [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]], [[172, -34], [178, -38], [174, -41], [167, -46], [171, -44]]
  ];
  var CITY = { ny: [-74, 40.5], va: [-76, 37], fl: [-80, 26], la: [-118, 34], or: [-124, 45], uk: [-5, 50], ie: [-9, 53], bil: [-3, 43.4], lis: [-9, 38.7], mar: [5.4, 43.3], eg: [30, 31.2], dj: [43, 11.6], mum: [72.8, 19], sg: [103.8, 1.3], hk: [114, 22.3], jp: [140, 35], syd: [151, -34], per: [115.8, -32], nz: [174.7, -36.8], fj: [178.4, -18], to: [-175.2, -21.1], hi: [-158, 21.3], br: [-38.5, -3.7], ct: [18.4, -33.9], lag: [3.4, 6.4], mom: [39.7, -4], om: [58.5, 23.6], gu: [144.8, 13.4], ch: [-71.6, -33], pa: [-79.5, 9]  };
  var CAB = [['ny', 'uk'], ['ny', 'ie'], ['va', 'bil'], ['ny', 'uk', .25], ['fl', 'br'], ['br', 'lis'], ['lis', 'lag'], ['lag', 'ct'], ['uk', 'lis'], ['mar', 'eg'], ['eg', 'dj'], ['dj', 'mum'], ['dj', 'mom'], ['mom', 'ct'], ['mum', 'sg'], ['om', 'mum'], ['sg', 'hk'], ['hk', 'jp'], ['sg', 'per'], ['per', 'syd'], ['syd', 'nz'], ['syd', 'gu'], ['gu', 'jp'], ['jp', 'or'], ['jp', 'la'], ['la', 'hi'], ['hi', 'syd'], ['nz', 'fj'], ['fj', 'to'], ['pa', 'ch'], ['fl', 'pa'], ['la', 'ch'], ['hk', 'la'], ['mar', 'sg', -.12], ['ie', 'ny', -.2], ['bil', 'fl', .18], ['ct', 'mum', .2], ['sg', 'jp', .2]];
  function mapProj(m, lon, lat) { return [m.x + lon * m.s, m.y - lat * m.s]; }
  function drawMap(g, m, t, o) {
    o = o || {};
    g.save();
    g.fillStyle = o.sea || '#163a5c'; g.fillRect(-2000, -2000, 6000, 6000);
    /* graticule */
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 2;
    for (var lo = -180; lo <= 180; lo += 30) { var p0 = mapProj(m, lo, 85), p1 = mapProj(m, lo, -70); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
    for (var la = -60; la <= 80; la += 20) { p0 = mapProj(m, -180, la); p1 = mapProj(m, 180, la); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
    LAND.forEach(function (poly) {
      g.beginPath(); poly.forEach(function (p, i) { var q = mapProj(m, p[0], p[1]); if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.closePath();
      g.fillStyle = o.land || '#5d4a78'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke();
    });
    g.restore();
  }
  /* the cable arc between two cities, k = how much is drawn; returns a point-at(u) fn */
  function cabArc(m, c) {
    var a = CITY[c[0]], b = CITY[c[1]], bl = b[0];
    if (bl - a[0] > 180) bl -= 360; else if (a[0] - bl > 180) bl += 360;
    var p0 = mapProj(m, a[0], a[1]), p1 = mapProj(m, bl, b[1]), mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    var bend = c[2] == null ? .12 : c[2], cx = mx - dy * bend, cy = my + dx * bend;
    return function (u) { var v = 1 - u; return [v * v * p0[0] + 2 * v * u * cx + u * u * p1[0], v * v * p0[1] + 2 * v * u * cy + u * u * p1[1]]; };
  }
  function drawCables(g, m, t, k, o) {
    o = o || {};
    CAB.forEach(function (c, i) {
      var kk = typeof k === 'function' ? k(i) : k; if (kk <= 0) return;
      var f = cabArc(m, c), n = 40;
      [0, 360, -360].forEach(function (off) {
        g.beginPath(); for (var j2 = 0; j2 <= n * kk; j2++) { var p = f(j2 / n); if (j2) g.lineTo(p[0] + off * m.s, p[1]); else g.moveTo(p[0] + off * m.s, p[1]); }
        g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = (o.w || 5) + 5; g.stroke();
        var cut = o.cut ? o.cut(i) : 0;
        g.strokeStyle = cut > 0 ? 'rgba(255,74,61,' + (.5 + .5 * cut) + ')' : (o.col || YEL); g.lineWidth = o.w || 5; g.stroke();
        if (!cut && o.pulse) { g.save(); g.setLineDash([10, 40]); g.lineDashOffset = -t * 120 - i * 17; g.strokeStyle = '#fff6c8'; g.lineWidth = (o.w || 5) * .6; g.stroke(); g.restore(); }
      });
    });
    if (o.dots !== false) Object.keys(CITY).forEach(function (key) { var p = mapProj(m, CITY[key][0], CITY[key][1]); circ(g, p[0], p[1], 6); fillStroke(g, CREAM, 3); });
  }

  /* ---------- time card: the escalating clock ---------- */
  var CLOCKS = [];
  function clockIcon(g, x, y, r, t, col) {
    circ(g, x, y, r); fillStroke(g, col || CREAM, r * .16);
    g.strokeStyle = INK; g.lineWidth = r * .14; g.lineCap = 'round';
    var a = t * 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * r * .62, y - Math.cos(a) * r * .62); g.moveTo(x, y); g.lineTo(x + Math.sin(a / 12) * r * .4, y - Math.cos(a / 12) * r * .4); g.stroke();
  }
  function timeCards(g, t) {
    for (var i = 0; i < CLOCKS.length; i++) {
      var c = CLOCKS[i], nx = i + 1 < CLOCKS.length ? CLOCKS[i + 1].t : S('end').t0;
      if (t < c.t || t > nx) continue;
      var u = t - c.t, big = u < 1.25, k = eio(seg(u, 1.05, 1.5));
      font(g, 150, 900, DISP, true); var tw = g.measureText(c.text).width, cw = tw + 380;
      var px = lerp(W / 2, 34 + cw * .18, k), py = lerp(H / 2 - 30, 78, k), s = lerp(1, .36, k);
      if (big || k < 1) { g.fillStyle = 'rgba(14,10,28,' + (.5 * (1 - k) * clamp(u * 5, 0, 1)) + ')'; g.fillRect(0, 0, W, H); }
      var sl = pop(t, c.t, 2.6, .55);
      g.save(); g.translate(px, py); g.scale(s * lerp(1.5, 1, clamp(sl, 0, 1)), s * lerp(1.5, 1, clamp(sl, 0, 1))); g.rotate(lerp(-.05, -.02, k) + knock(t, c.t + .08, 30, 9) * .04);
      g.globalAlpha = clamp(sl * 3, 0, 1) * (t > nx - .3 ? 1 - seg(t, nx - .3, nx) : 1);
      rr(g, -cw / 2 + 14, -150 + 18, cw, 300, 30); g.fillStyle = 'rgba(8,6,18,.5)'; g.fill();
      rr(g, -cw / 2, -150, cw, 300, 30); fillStroke(g, YEL, 9);
      clockIcon(g, -cw / 2 + 150, 0, 92, t, CREAM);
      txt(g, c.text, -cw / 2 + 290 + tw / 2, 8, 150, INK, { wt: 900, wide: true });
      g.restore();
    }
  }

  /* ---------- captions: one card per phrase, stressed words in yellow ---------- */
  var EMPH = /\d|^(every|all|zero|cut|snaps|nothing|forever|dark|worse|already|hand|once|isn't|none|light|glass|garden|hose|sharks?|anchors?|fishing|satellites|straw|river|declined|london|tonga|egypt|india|year|ship|ships|weeks|miles)\b/i;
  function captions(g, t) {
    if (!LIVE.text) return;
    var caps = VO.captions || [], c = null;
    for (var i = 0; i < caps.length; i++) if (t >= caps[i].t0 && t < caps[i].t1) { c = caps[i]; break; }
    if (!c || S('title').t0 < t && t < S('title').t1) return;
    var a = clamp((t - c.t0) / .08, 0, 1) * clamp((c.t1 - t) / .08, 0, 1);
    font(g, 50, 800); var words = c.words.map(function (w) { return w.w; }), sp = g.measureText(' ').width;
    var ws = words.map(function (w) { return g.measureText(w).width; }), tw = ws.reduce(function (s, v) { return s + v; }, 0) + sp * (words.length - 1);
    var y = 996, x = W / 2 - tw / 2;
    g.save(); g.globalAlpha = a;
    rr(g, W / 2 - tw / 2 - 30, y - 42, tw + 60, 84, 22); g.fillStyle = 'rgba(16,12,30,.82)'; g.fill();
    g.textAlign = 'left'; g.textBaseline = 'middle';
    words.forEach(function (w, i) {
      var said = t >= c.words[i].t0 - .02, hot = EMPH.test(w.replace(/[^\w'%]/g, ''));
      g.fillStyle = hot ? YEL : said ? CREAM : 'rgba(244,237,224,.55)'; g.fillText(w, x, y + 3); x += ws[i] + sp;
    });
    g.restore();
  }

  /* ---------- transitions ---------- */
  function wipe(g, t, s, prev) {
    var k = eio(seg(t, s.t0 - .02, s.t0 + .42));
    if (k >= 1 || s.wipe === 'none' || !prev) { s.draw(g, t, s); return; }
    prev.draw(g, t, prev);
    g.save(); g.beginPath();
    if (s.wipe === 'iris') { circ(g, W / 2, H / 2, k * 1150); }
    else { var x = -200 + k * (W + 400); g.moveTo(-10, -10); g.lineTo(x + 120, -10); g.lineTo(x - 120, H + 10); g.lineTo(-10, H + 10); g.closePath(); }
    g.clip(); s.draw(g, t, s); g.restore();
    /* the edge: a thick ink band, so the cut reads as drawn */
    g.save();
    if (s.wipe === 'iris') { circ(g, W / 2, H / 2, k * 1150); g.lineWidth = 26; g.strokeStyle = INK; g.stroke(); g.lineWidth = 8; g.strokeStyle = YEL; g.stroke(); }
    else { x = -200 + k * (W + 400); g.beginPath(); g.moveTo(x + 120, -10); g.lineTo(x - 120, H + 10); g.lineWidth = 34; g.strokeStyle = INK; g.stroke(); g.lineWidth = 10; g.strokeStyle = YEL; g.stroke(); }
    g.restore();
  }
  /* a slow push on every scene so nothing is ever still */
  function push(g, t, s, z, cx, cy) {
    var u = seg(t, s.t0, s.t1), zz = 1 + (z == null ? .045 : z) * ss(u);
    g.translate(cx == null ? W / 2 : cx, cy == null ? H / 2 : cy); g.scale(zz, zz); g.translate(-(cx == null ? W / 2 : cx), -(cy == null ? H / 2 : cy));
  }

  /* =================================================================== scenes */
  /* 1 · You text London */
  function sRoom(g, t, s) {
    g.save(); push(g, t, s, .06, 700, 600);
    roomBG(g, t);
    couch(g, 760, 870, 1.05);
    var tx = at('open1', 'text'), snd = wend('open1', 'yet') + .1;
    var P = poseAt(t, [[0, { hip: 58, lf: [-46, 0], rf: [46, 0], lh: [-20, -228], rh: [22, -226], look: [.2, .8], mouth: 'smile', tilt: .06 }], [snd, { lh: [-20, -228], rh: [40, -250], mouth: 'grin', look: [.6, .2], tilt: -.04 }], [start('open2'), { look: [.9, -.2], mouth: 'smile', eyes: 'dot' }]]);
    guy(g, 760, 860, 1.25, P, Object.assign({}, YOU, { hold: [null, function (g) { phone(g, -18, -12, .75, -.2, '#9ee6ff'); }] }), t);
    g.restore();
    /* the chat, big, on the left */
    var a = t < s.t1 - .2 ? 1 : 1 - seg(t, s.t1 - .2, s.t1 + .1);
    var typed = 'Landed yet?', ty = function (tt) { var n = Math.floor(clamp((tt - tx - .1) / (snd - tx - .25), 0, 1) * typed.length); return tt < snd ? typed.slice(0, n) : ''; };
    chatPhone(g, 300, 500, 1.02, a, t, ['Sam', 'LONDON · 1 S AGO'], [{ text: 'Landed yet?', side: 1, t: snd, status: function (tt) { return tt < snd + .6 ? ['Sending', null, 'spin'] : tt < start('open2') + .6 ? ['Delivered', null] : ['Delivered ✓', MINT]; } }], ty);
    /* the message flies out the window as a dot of light, and London answers on the right */
    var fl = seg(t, snd + .05, snd + .7);
    if (fl > 0 && fl < 1) { var fx = lerp(420, 1500, eio(fl)), fy = lerp(360, 280, fl) - Math.sin(fl * 3.14) * 120; circ(g, fx, fy, 18); g.fillStyle = LIGHT; g.shadowColor = LIGHT; g.shadowBlur = 30; g.fill(); g.shadowBlur = 0; }
    var lk = eio(seg(t, start('open2') - .25, start('open2') + .35));
    if (lk > 0) {
      g.save(); g.beginPath(); var ex = lerp(W + 200, 1000, lk); g.moveTo(ex + 100, 0); g.lineTo(W, 0); g.lineTo(W, H); g.lineTo(ex - 100, H); g.closePath(); g.clip();
      londonBG(g, t);
      var FP = poseAt(t, [[0, { lh: [-24, -226], rh: [20, -230], look: [-.4, .8], mouth: 'smile' }], [start('open2') + .5, { look: [-.6, 0], mouth: 'grin', rh: [70, -330] }], [end('open2') - .1, { eyes: 'happy' }]]);
      guy(g, 1560, 900, 1.15, FP, Object.assign({}, FRIEND, { flip: true, hold: [null, function (g) { phone(g, 0, -10, .7, .2, '#9ee6ff'); }] }), t);
      var bz = pop(t, start('open2') + .1, 3, .6);
      chip(g, 'Landed yet?', 1450, 470, { px: 36, bg: BLUE, fg: '#fff', s: bz, r: 26, lw: 0 });
      chip(g, '< 1 SECOND', 1290, 200, { px: 40, bg: YEL, s: pop(t, at('open2', 'second') - .05), rot: -.04, wide: true });
      g.restore();
      g.save(); g.beginPath(); g.moveTo(ex + 100, 0); g.lineTo(ex - 100, H); g.lineWidth = 30; g.strokeStyle = INK; g.stroke(); g.lineWidth = 9; g.strokeStyle = YEL; g.stroke(); g.restore();
    }
    vignette(g, .45);
  }
  function londonBG(g, t) {
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3b5f8f'); gr.addColorStop(1, '#9bb6c9'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    /* clock tower, row houses, rain */
    g.fillStyle = '#2b3c5c'; g.fillRect(1250, 260, 90, 560); g.beginPath(); g.moveTo(1240, 260); g.lineTo(1295, 150); g.lineTo(1350, 260); g.closePath(); g.fill();
    circ(g, 1295, 320, 30); fillStroke(g, '#f6e6b8', 5, '#2b3c5c');
    g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(1295, 320); g.lineTo(1295, 300); g.moveTo(1295, 320); g.lineTo(1310, 326); g.stroke();
    for (var i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#a5524b' : '#8c4a55'; g.fillRect(1350 + i * 100, 560 - (i % 3) * 30, 100, 300); g.fillStyle = '#ffd99a'; g.fillRect(1380 + i * 100, 620 - (i % 3) * 30, 30, 40); }
    g.fillStyle = '#4a5f74'; g.fillRect(0, 860, W, 220);
    g.strokeStyle = 'rgba(220,235,255,.35)'; g.lineWidth = 2;
    for (i = 0; i < 70; i++) { var rx = (hash(i) * W + t * 120) % W, ry = (hash(i + 50) * H + t * 900) % H; g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 6, ry + 26); g.stroke(); }
  }

  /* 2 · the dive: room → ground → coast → sea floor, then along the cable */
  function sDive(g, t, s) {
    var t3 = start('open3'), u = seg(t, t3 - .3, s.t1 - .2);
    /* the route of the message: phone → wall → conduit → under the beach → along the sea floor */
    var path = [[830, 700], [1000, 700], [1000, 1300], [2100, 1300], [3150, 3640], [9800, 3640]];
    var L = [], tot = 0, i; for (i = 1; i < path.length; i++) { var dl = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); L.push(dl); tot += dl; }
    var pr = eio(u) * tot, q = path[0];
    for (i = 0; i < L.length; i++) { if (pr <= L[i]) { var kk = pr / L[i]; q = [lerp(path[i][0], path[i + 1][0], kk), lerp(path[i][1], path[i + 1][1], kk)]; break; } pr -= L[i]; q = path[i + 1]; }
    var c = ss(seg(u, 0, .12)), cx = lerp(W / 2, q[0], c), cy = lerp(H / 2, q[1], c), z = lerp(1, .82, ss(seg(u, .05, .3))) + .1 * ss(seg(u, .75, 1));
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-cx, -cy - 60 * c);
    /* sky over the sea, to the right of the house */
    var sk = g.createLinearGradient(0, -400, 0, 1080); sk.addColorStop(0, '#2a3f78'); sk.addColorStop(1, '#d97a6c'); g.fillStyle = sk; g.fillRect(1900, -600, 9000, 1700);
    var r = mulberry(23); for (i = 0; i < 80; i++) { circ(g, 1900 + r() * 9000, -500 + r() * 1200, r() * 2.5); g.fillStyle = 'rgba(255,255,255,.6)'; g.fill(); }
    roomBG(g, t, .3); couch(g, 760, 870, 1.05);
    guy(g, 760, 860, 1.25, Object.assign({}, BASE, { hip: 58, lf: [-46, 0], rf: [46, 0], lh: [-20, -228], rh: [22, -226], look: [.6, .6], mouth: 'o', eyes: 'wide' }), Object.assign({}, YOU, { hold: [null, function (g) { phone(g, -18, -12, .75, -.2, '#9ee6ff'); }] }), t);
    g.fillStyle = '#2a2142'; g.fillRect(1900, 0, 30, 1080);
    /* the sea, then the land on top of it with a beach slope */
    var sg = g.createLinearGradient(0, 1080, 0, 3800); sg.addColorStop(0, '#2a7aa6'); sg.addColorStop(1, DEEP); g.fillStyle = sg; g.fillRect(2000, 1080, 9000, 2800);
    g.save(); g.globalCompositeOperation = 'lighter'; for (i = 0; i < 16; i++) { var x = 2400 + i * 500 + Math.sin(t * .3 + i) * 60; g.beginPath(); g.moveTo(x - 50, 1090); g.lineTo(x + 70, 1090); g.lineTo(x + 420, 3700); g.lineTo(x + 140, 3700); g.closePath(); g.fillStyle = 'rgba(160,230,255,.05)'; g.fill(); } g.restore();
    waterSurface(g, 1080, t, 2000, 11000, '#2a7aa6');
    g.beginPath(); g.moveTo(-600, 1086); g.lineTo(2250, 1086); g.lineTo(3300, 3700); g.lineTo(11000, 3700); g.lineTo(11000, 5200); g.lineTo(-600, 5200); g.closePath();
    var gr = g.createLinearGradient(0, 1080, 0, 4200); gr.addColorStop(0, '#6a4a3e'); gr.addColorStop(.45, '#4a3440'); gr.addColorStop(.5, SAND); gr.addColorStop(1, SAND2); g.fillStyle = gr; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    g.fillStyle = '#e8c886'; g.beginPath(); g.moveTo(1930, 1086); g.lineTo(2250, 1086); g.lineTo(2330, 1280); g.lineTo(1930, 1140); g.closePath(); g.fill();
    r = mulberry(21); for (i = 0; i < 160; i++) { var rx = r() * 11000 - 600, ry = 1130 + r() * 3900; if (rx > 2250 + (ry - 1086) * .4 && ry < 3700) continue; g.beginPath(); g.ellipse(rx, ry, 16 + r() * 30, 8 + r() * 12, 0, 0, 6.283); g.fillStyle = 'rgba(30,18,26,.3)'; g.fill(); }
    for (i = 0; i < 14; i++) fish(g, 3600 + i * 430 + Math.sin(t + i) * 30, 2500 + (i % 4) * 260 + Math.sin(t * 1.3 + i) * 20, 1, t + i, i % 2 ? YEL : '#ff9a6b', i % 2);
    for (i = 0; i < 12; i++) { var kx = 3500 + i * 560; g.beginPath(); g.moveTo(kx, 3700); for (var k = 1; k <= 6; k++) g.lineTo(kx + Math.sin(t * 1.4 + k * .6 + i) * k * 5, 3700 - 260 * k / 6); g.lineWidth = 14; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); g.lineWidth = 7; g.strokeStyle = '#2f7f6a'; g.stroke(); }
    g.lineCap = g.lineJoin = 'round';
    g.beginPath(); path.forEach(function (p, i2) { if (i2) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
    g.strokeStyle = INK; g.lineWidth = 34; g.stroke(); g.strokeStyle = '#3b3550'; g.lineWidth = 22; g.stroke();
    /* a light trail behind the pulse */
    g.save(); g.shadowColor = LIGHT; g.shadowBlur = 40; for (i = 0; i < 8; i++) { var back = eio(u) * tot - i * 70, qq = path[0], pp = back; for (var j = 0; j < L.length; j++) { if (pp <= L[j]) { var k2 = Math.max(0, pp) / L[j]; qq = [lerp(path[j][0], path[j + 1][0], k2), lerp(path[j][1], path[j + 1][1], k2)]; break; } pp -= L[j]; qq = path[j + 1]; } circ(g, qq[0], qq[1], 16 - i * 1.6); g.fillStyle = 'rgba(200,245,255,' + (1 - i / 8) + ')'; g.fill(); }
    g.globalAlpha = .45; circ(g, q[0], q[1], 40); g.fillStyle = LIGHT; g.fill(); g.restore();
    g.restore();
    chip(g, 'THE ATLANTIC', 1520, 170, { px: 44, bg: CREAM, s: pop(t, at('open3', 'atlantic') - .1), rot: .03, wide: true });
    chip(g, 'ABOUT 2 MILES DOWN, ON AVERAGE', 1520, 260, { px: 26, bg: INK, fg: CREAM, s: pop(t, at('open3', 'ocean')), rot: .03, line: CREAM, lw: 3, fam: MONO, wt: 700 });
    chip(g, 'A BEAM OF LIGHT', 520, 200, { px: 50, bg: LIGHT, s: pop(t, at('open4', 'light') - .05), rot: -.03, wide: true });
    vignette(g, .4);
  }

  /* 3 · every cable snaps */
  var SNAPS = [];
  function sSnap(g, t, s) {
    g.save(); push(g, t, s, .05);
    seaBG(g, t, 790);
    var all = at('open5', 'second');
    var rows = [[470, .45, 10], [560, .6, 12], [650, .75, 14], [760, 1, 20], [880, 1.2, 24]];
    rows.forEach(function (r, i) {
      var tc = SNAPS[i] || all, cut = t >= tc, k = cut ? sp(t, tc, 2.2, .45) : 0, cx = 520 + i * 230;
      var lit = t < all ? 1 : 1 - seg(t, all, all + .4);
      g.save(); g.globalAlpha = .55 + .45 * r[1] / 1.2;
      cableLine(g, -100, W + 100, r[0], t, { w: r[2], lit: lit * (cut ? 0 : 1) + (cut ? 0 : 0), cut: cut ? cx : null, gap: 30 + k * 80, droop: 70 * k * r[1], ph: i * 1.7, amp: 14 * r[1], speed: 700 * r[1] });
      g.restore();
      spark(g, cx, r[0], t, tc, r[1]);
    });
    if (t >= all) { var f = 1 - seg(t, all, all + .35); g.fillStyle = 'rgba(255,250,235,' + (.7 * f) + ')'; g.fillRect(0, 0, W, H); }
    g.restore();
    chip(g, 'ALL OF THEM', 520, 200, { px: 64, bg: RED, fg: '#fff', s: pop(t, at('open5', 'all') - .05), rot: -.05, wide: true });
    chip(g, 'AT THE SAME SECOND', 1380, 230, { px: 56, bg: YEL, s: pop(t, at('open5', 'same') - .05), rot: .04, wide: true });
    vignette(g);
  }
  /* 4 · the questions */
  function sAsk(g, t, s) {
    g.save(); push(g, t, s, .07, 960, 520);
    roomBG(g, t, .25); couch(g, 960, 870, 1.05);
    var P = poseAt(t, [[s.t0, { hip: 58, lf: [-46, 0], rf: [46, 0], lh: [-20, -228], rh: [22, -226], look: [0, .8], mouth: 'flat', brow: 2 }], [at('open6', 'minute'), { look: [-.8, -.6], mouth: 'o', eyes: 'wide', brow: 1 }], [at('open6', 'day'), { look: [.8, -.6], mouth: 'wavy', brow: 2 }], [at('open6', 'month'), { look: [0, -1], mouth: 'O', lh: [-90, -300], rh: [90, -300], hip: 40 }]]);
    guy(g, 960, 860, 1.3, P, Object.assign({}, YOU, { hold: [function (g) { if (t < at('open6', 'month')) return; }, function (g) { if (t < at('open6', 'month')) phone(g, -18, -12, .75, -.2, '#3a3552'); }] }), t);
    g.restore();
    [['THE FIRST MINUTE?', 'minute', 520, 260, -.05], ['THE FIRST DAY?', 'day', 1420, 300, .05], ['THE FIRST MONTH?', 'month', 960, 140, -.02]].forEach(function (q) {
      chip(g, q[0], q[2], q[3], { px: 54, bg: q[1] === 'month' ? RED : CREAM, fg: q[1] === 'month' ? '#fff' : INK, s: pop(t, at('open6', q[1]) - .08), rot: q[4] + Math.sin(t * 2 + q[2]) * .01, wide: true });
    });
    vignette(g);
  }

  /* 5 · title */
  function sTitle(g, t, s) {
    g.save(); push(g, t, s, .06, 960, 560);
    seaBG(g, t, 860, { top: '#0f3553', bot: '#050f1d' });
    /* you, holding the two cut ends */
    var P = poseAt(t, [[s.t0, { lh: [-110, -170], rh: [110, -170], look: [-.6, .5], mouth: 'frown', brow: 2 }], [start('title') + 1.2, { look: [.6, .5] }], [end('title') - .4, { look: [0, -.3], mouth: 'o', brow: 1 }]]);
    var lend = function (g) { g.rotate(.4); cableEnd(g, t, -1); }, rend = function (g) { g.rotate(-.4); cableEnd(g, t, 1); };
    guy(g, 960, 905, 1.2, P, Object.assign({}, YOU, { helmet: true, hold: [lend, rend] }), t);
    g.lineCap = 'round';
    [[-1, 830], [1, 1090]].forEach(function (sd) { g.beginPath(); g.moveTo(sd[1] - sd[0] * 0, 700); g.quadraticCurveTo(sd[1] + sd[0] * 160, 900, sd[1] + sd[0] * 1000, 880); g.strokeStyle = INK; g.lineWidth = 30; g.stroke(); g.strokeStyle = '#3b3550'; g.lineWidth = 20; g.stroke(); });
    g.restore();
    /* the title, word by word */
    var L1 = ['WHAT', 'IF', 'EVERY', 'UNDERSEA'], L2 = ['INTERNET', 'CABLE', 'WAS', 'CUT?'];
    function row(ws, y, px, off) {
      font(g, px, 900, DISP, true); var tw0 = ws.reduce(function (a, w) { return a + g.measureText(w).width; }, 0) * 1.12; if (tw0 > 1640) { px = Math.floor(px * 1640 / tw0); font(g, px, 900, DISP, true); }
      var sp2 = px * .28, wd = ws.map(function (w) { return g.measureText(w).width; }), tw = wd.reduce(function (a, b) { return a + b; }, 0) + sp2 * (ws.length - 1), x = W / 2 - tw / 2;
      ws.forEach(function (w, i) {
        var tw0 = at('title', w.replace('?', '').toLowerCase()) - .06, k = pop(t, tw0, 3.2, .6);
        if (k > 0) {
          g.save(); g.translate(x + wd[i] / 2, y); g.scale(k, k); g.rotate((hash(i + off) - .5) * .06);
          if (w === 'CUT?') { rr(g, -wd[i] / 2 - 18, -px * .62, wd[i] + 36, px * 1.2, 16); fillStroke(g, RED, 8); }
          txt(g, w, 0, 4, px, w === 'CUT?' ? '#fff' : CREAM, { wt: 900, wide: true, outline: 16, ocol: INK }); g.restore();
        }
        x += wd[i] + sp2;
      });
    }
    row(L1, 210, 116, 0); row(L2, 350, 116, 4);
    vignette(g, .5);
  }
  function cableEnd(g, t, sd) {
    rr(g, -16, -12, 64, 24, 10); fillStroke(g, '#3b3550', 5);
    for (var i = 0; i < 4; i++) { circ(g, 48, -6 + i * 4, 3.4); g.fillStyle = LIGHT; g.fill(); }
    var fl = hash(Math.floor(t * 10) * 3 + sd) > .55; if (fl) { g.strokeStyle = YEL; g.lineWidth = 5; g.beginPath(); g.moveTo(54, 0); g.lineTo(76, -14); g.moveTo(54, 2); g.lineTo(80, 8); g.stroke(); }
  }

  /* 6 · the map */
  var M = { x: 960, y: 520, s: 5.1 };
  function sMap(g, t, s) {
    var a2 = at('size2', 'cables'), a3 = start('size3');
    var z = kf(t, [[s.t0, 1.05], [a2, 1], [a3, 1.0], [s.t1, 1.12]]);
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2 + 20);
    drawMap(g, M, t);
    var ord = CAB.map(function (c, i) { return hash(i * 3.1); });
    drawCables(g, M, t, function (i) { return eo(seg(t, a2 - .6 + ord[i] * 1.6, a2 + ord[i] * 1.6 + .2)); }, { pulse: t > a3 });
    g.restore();
    var n = Math.round(600 * eo(seg(t, at('size2', 'more') - .1, wend('size2', 'cables') + .3)));
    if (t > at('size2', 'more') - .2) {
      chip(g, (n >= 600 ? '600+' : n) + ' CABLES', 380, 120, { px: 64, bg: YEL, s: pop(t, at('size2', 'more') - .2), rot: -.03, wide: true, w: 560 });
      chip(g, 'ACTIVE AND PLANNED · TELEGEOGRAPHY', 380, 205, { px: 24, bg: INK, fg: CREAM, s: pop(t, at('size2', 'active')), line: CREAM, lw: 2, fam: MONO, wt: 600 });
    }
    if (t > a3) {
      var mi = Math.round(900000 * eo(seg(t, at('size3', 'over'), wend('size3', 'miles') + .2)));
      chip(g, '900,000+ MILES'.replace('900,000', mi.toLocaleString('en-US')), 1500, 120, { px: 64, bg: CREAM, s: pop(t, at('size3', 'end') - .1), rot: .03, wide: true, w: 680 });
    }
    vignette(g, .35);
  }
  /* 7 · 37 times around the Earth */
  function sGlobe(g, t, s) {
    g.save(); push(g, t, s, .08);
    var bg = g.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 1100); bg.addColorStop(0, '#2a2552'); bg.addColorStop(1, '#100c22'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var r = mulberry(31); for (var i = 0; i < 120; i++) { circ(g, r() * W, r() * H, r() * 2.2); g.fillStyle = 'rgba(255,255,255,' + (.2 + .5 * r()) + ')'; g.fill(); }
    var cx = 1060, cy = 520, R = 330, spin = t * .25;
    circ(g, cx, cy, R); g.fillStyle = '#1d5a86'; g.fill();
    g.save(); circ(g, cx, cy, R); g.clip();
    var m2 = { x: cx - (spin * 180 / Math.PI % 360) * 1.8, y: cy, s: 1.8 };
    [0, 360].forEach(function (off) { g.save(); g.translate(off * 1.8, 0); LAND.forEach(function (poly) { g.beginPath(); poly.forEach(function (p, i2) { var q = mapProj(m2, p[0], p[1]); if (i2) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.closePath(); g.fillStyle = '#5d4a78'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); }); g.restore(); });
    var sh = g.createRadialGradient(cx - 120, cy - 120, 40, cx, cy, R); sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(1, 'rgba(0,0,20,.45)'); g.fillStyle = sh; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    g.restore();
    circ(g, cx, cy, R); fillStroke(g, null, 7);
    /* wraps: tilted ellipses, one per lap */
    var t0 = at('size4', 'wrap') - .2, t1 = wend('size4', '37') + .2, laps = 37 * eo(seg(t, t0, t1));
    for (i = 0; i < Math.ceil(laps); i++) {
      var kk = clamp(laps - i, 0, 1), tl = -.5 + (i / 37) * 1.0;
      g.save(); g.translate(cx, cy); g.rotate(tl); g.beginPath(); g.ellipse(0, 0, R + 10 + (i % 3) * 3, 70 + (i * 37 % 140), 0, 0, Math.PI * 2 * kk);
      g.strokeStyle = 'rgba(255,200,61,' + (.35 + .5 * (i === Math.ceil(laps) - 1)) + ')'; g.lineWidth = 4; g.stroke(); g.restore();
    }
    g.restore();
    var n = Math.min(37, Math.floor(laps));
    chip(g, '× ' + n, 440, 470, { px: 150, bg: YEL, s: pop(t, t0), rot: -.04, wide: true, w: 440 });
    chip(g, 'AROUND THE EARTH', 440, 620, { px: 40, bg: CREAM, s: pop(t, t0 + .3), rot: -.02, wide: true });
    vignette(g);
  }

  /* 8 · a garden hose, then the inside */
  function sHose(g, t, s) {
    var t2 = start('hose2'), zin = eio(seg(t, t2 - .3, t2 + .6));
    g.save();
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2f4e6e'); bg.addColorStop(1, '#16273e'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.translate(lerp(W / 2, 700, zin), lerp(H / 2, 540, zin)); g.scale(1 + zin * 9, 1 + zin * 9); g.translate(-lerp(W / 2, 1150, zin), -lerp(H / 2, 640, zin));
    /* you hold a garden hose next to a cable of the same width */
    var P = poseAt(t, [[s.t0, { lh: [-90, -210], rh: [70, -160], look: [-.7, .2], mouth: 'smile', brow: 1 }], [at('hose1', 'garden'), { lh: [-120, -240], look: [-1, -.2], mouth: 'grin' }]]);
    guy(g, 820, 900, 1.2, P, Object.assign({}, YOU, { hold: [function (g) { g.rotate(-.5); hoseCoil(g, t); }, null] }), t);
    /* the cable: a short length on a stand, its cut end facing us */
    g.lineCap = 'round'; g.beginPath(); g.moveTo(1150, 640); g.quadraticCurveTo(1500, 700, 1900, 620); g.strokeStyle = INK; g.lineWidth = 40; g.stroke(); g.strokeStyle = '#2a2638'; g.lineWidth = 30; g.stroke();
    circ(g, 1150, 640, 22); fillStroke(g, '#2a2638', 6); xsec(g, 1150, 640, 18, t);
    g.restore();
    chip(g, '≈ AS THICK AS A GARDEN HOSE', 560, 140, { px: 46, bg: YEL, s: pop(t, at('hose1', 'garden') - .1) * (1 - zin), rot: -.03, wide: true });
    if (zin > .3) {
      chip(g, 'GLASS FIBERS', 1560, 300, { px: 48, bg: LIGHT, s: pop(t, at('hose2', 'glass') - .05), rot: .03, wide: true });
      chip(g, 'THINNER THAN A HAIR', 1560, 400, { px: 36, bg: CREAM, s: pop(t, at('hose2', 'hair') - .05), rot: .02, wide: true });
      chip(g, 'STEEL WIRE ARMOR', 1560, 560, { px: 30, bg: INK, fg: CREAM, line: CREAM, lw: 3, s: pop(t, t2 + .7), rot: -.02, fam: MONO, wt: 700 });
      chip(g, 'COPPER (POWER)', 1560, 640, { px: 30, bg: INK, fg: '#f0a05a', line: '#f0a05a', lw: 3, s: pop(t, t2 + 1.0), rot: -.02, fam: MONO, wt: 700 });
    }
    vignette(g, .45);
  }
  function hoseCoil(g, t) { for (var i = 0; i < 3; i++) { g.beginPath(); g.ellipse(0, 40 + i * 8, 60 - i * 4, 36, 0, 0, 6.283); g.strokeStyle = INK; g.lineWidth = 20; g.stroke(); g.strokeStyle = GREEN; g.lineWidth = 12; g.stroke(); } }
  /* a cable cross-section: armor, copper, the fibers that glow */
  function xsec(g, x, y, r, t) {
    g.save(); g.translate(x, y);
    circ(g, 0, 0, r); g.fillStyle = '#111'; g.fill();
    for (var i = 0; i < 18; i++) { var a = i / 18 * 6.283; circ(g, Math.cos(a) * r * .74, Math.sin(a) * r * .74, r * .13); g.fillStyle = '#9aa0ad'; g.fill(); }
    circ(g, 0, 0, r * .55); g.fillStyle = '#d98a45'; g.fill(); circ(g, 0, 0, r * .42); g.fillStyle = '#e9e4d8'; g.fill();
    for (i = 0; i < 8; i++) { a = i / 8 * 6.283 + .3; var p = .55 + .45 * Math.sin(t * 8 + i * 1.3); circ(g, Math.cos(a) * r * .22, Math.sin(a) * r * .22, r * .06); g.fillStyle = 'rgba(143,233,255,' + p + ')'; g.shadowColor = LIGHT; g.shadowBlur = 6; g.fill(); }
    g.shadowBlur = 0; g.restore();
  }

  /* 9 · satellites: 0.37 % */
  function sSat(g, t, s) {
    g.save(); push(g, t, s, .05);
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0f1030'); bg.addColorStop(1, '#3a2a5a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var r = mulberry(41); for (var i = 0; i < 140; i++) { circ(g, r() * W, r() * H * .8, r() * 2); g.fillStyle = 'rgba(255,255,255,' + (.2 + .6 * r()) + ')'; g.fill(); }
    satellite(g, 1450 + Math.sin(t * .4) * 40, 220 + Math.cos(t * .5) * 14, .8, -.2 + Math.sin(t * .3) * .05);
    g.fillStyle = '#1b1636'; g.fillRect(0, 880, W, 200);
    var P = poseAt(t, [[s.t0, { look: [.8, -1], tilt: .2, mouth: 'o', rh: [80, -330] }], [start('sat2'), { look: [.4, .4], tilt: 0, mouth: 'flat', rh: [60, -150] }], [start('sat3'), { look: [.9, .3], mouth: 'smile', lh: [-60, -150], rh: [150, -250] }]]);
    guy(g, 260, 920, 1.15, P, YOU, t);
    g.restore();
    /* the bar: all US international capacity */
    var k = eio(seg(t, start('sat2') + .1, start('sat2') + .9)), bx = 520, bw = 1260, by = 560;
    if (k > 0) {
      g.save(); g.globalAlpha = clamp(k * 2, 0, 1);
      txt(g, 'ALL U.S. INTERNATIONAL CAPACITY', bx, by - 110, 34, CREAM, { align: 'left', wt: 800, wide: true });
      rr(g, bx, by - 60, bw, 120, 18); fillStroke(g, '#2b2648', 6);
      var cw = bw * (1 - .0037) * k; rr(g, bx, by - 60, cw, 120, [18, 0, 0, 18]); fillStroke(g, HOOD, 6);
      g.fillStyle = YEL; g.fillRect(bx + bw - 7, by - 60, 7, 120);
      txt(g, 'CABLES 99.63%', bx + 40, by + 2, 54, '#fff', { align: 'left', wt: 900, wide: true, outline: 10 });
      var mk2 = pop(t, at('sat2', 'percent') - .2);
      if (mk2 > 0) { g.save(); g.translate(bx + bw - 4, by); g.scale(mk2, mk2); circ(g, 0, 0, 62); g.lineWidth = 10; g.strokeStyle = YEL; g.stroke(); g.restore(); chip(g, 'SATELLITES 0.37%', bx + bw - 120, by + 160, { px: 46, bg: YEL, s: mk2, rot: .03, wide: true }); }
      txt(g, 'SOURCE: TELEGEOGRAPHY', bx, by + 250, 24, 'rgba(244,237,224,.7)', { align: 'left', fam: MONO, wt: 600 });
      g.restore();
    }
    vignette(g, .45);
  }

  /* 10 · faults: fishing gear and anchors */
  function sFaults(g, t, s) {
    var t2 = start('fault2'), gear = at('fault2', 'fishing'), anch = at('fault2', 'anchors');
    g.save(); push(g, t, s, .05);
    seaBG(g, t, 860, { top: '#1b5f87', bot: '#0a2238' });
    var gr2 = g.createLinearGradient(0, 0, 0, 270); gr2.addColorStop(0, '#f0b98a'); gr2.addColorStop(1, '#f7d7a8'); g.fillStyle = gr2; g.fillRect(-200, -200, W + 400, 470);
    waterSurface(g, 270, t, -200, W + 200, '#2a86b5');
    var cutA = gear + .9, cutB = anch + .7;
    var yA = cableLine(g, -100, W + 100, 900, t, { w: 20, lit: 1, cut: t > cutA ? 760 : null, gap: 40 + 40 * sp(t, cutA, 2, .5), droop: 40 * sp(t, cutA, 2, .5) });
    /* trawler drags a net along the floor */
    var tx = lerp(250, 1300, seg(t, s.t0, t2 + 3.5));
    shipHull(g, tx, 240, .85, '#3b8a6a', Math.sin(t * 1.6) * .02, { trawler: true });
    g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(tx - 200, 230); g.lineTo(tx - 380, 870); g.stroke();
    g.beginPath(); g.moveTo(tx - 200, 230); g.lineTo(tx - 520, 810); g.stroke();
    g.save(); g.translate(tx - 520, 860); g.beginPath(); g.moveTo(0, -60); g.lineTo(140, -30); g.lineTo(140, 20); g.lineTo(0, 20); g.closePath(); g.fillStyle = 'rgba(230,220,200,.25)'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 3; g.stroke();
    for (var i = 1; i < 6; i++) { g.beginPath(); g.moveTo(i * 24, -60 + i * 5); g.lineTo(i * 24, 20); g.stroke(); } g.restore();
    spark(g, 760, 900, t, cutA, 1);
    /* a year of breaks: small sparks popping along the cable while the counter runs */
    var b0 = at('fault1', 'about') - .1, b1 = wend('fault1', 'year');
    for (var q = 0; q < 20; q++) { var tq = b0 + q * (b1 - b0) / 20, xq = 80 + hash(q * 5.3) * 1760; spark(g, xq, yA(xq), t, tq, .45); }
    /* a cargo ship drops its anchor */
    var ax = lerp(W + 400, 1200, eio(seg(t, anch - 1.6, anch - .4)));
    shipHull(g, ax, 230, .8, '#c9473a', 0, { cargo: true });
    var ad = seg(t, anch - .6, anch + .3), ay = lerp(260, 900, ad), drag = seg(t, anch + .3, anch + 2.2) * 260;
    g.strokeStyle = INK; g.lineWidth = 6; g.setLineDash([12, 6]); g.beginPath(); g.moveTo(ax - 170, 250); g.lineTo(ax - 150 + drag, ay); g.stroke(); g.setLineDash([]);
    if (ad > 0) anchor(g, ax - 150 + drag, ay, 1.1);
    spark(g, 1240, 900, t, cutB, 1);
    g.restore();
    var n = Math.round(200 * eo(seg(t, at('fault1', 'about') - .1, wend('fault1', 'year'))));
    chip(g, '≈ ' + n + ' BREAKS A YEAR', 960, 560, { px: 84, bg: YEL, s: pop(t, at('fault1', 'about') - .2) * (1 - seg(t, t2 - .3, t2)), rot: -.03, wide: true });
    var pk = pop(t, at('fault2', 'thirds') - .1);
    if (pk > 0) { g.save(); g.translate(1640, 400); g.scale(pk, pk); circ(g, 0, 0, 120); fillStroke(g, CREAM, 6); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 120, -Math.PI / 2, -Math.PI / 2 + Math.PI * 4 / 3 * eo(seg(t, at('fault2', 'thirds'), at('fault2', 'thirds') + .6))); g.closePath(); fillStroke(g, HOOD, 6); g.restore(); chip(g, '2 / 3 ACCIDENTS', 1640, 580, { px: 40, bg: CREAM, s: pk, rot: .03, wide: true }); chip(g, 'SOURCE: ICPC VIA TELEGEOGRAPHY', 1640, 650, { px: 22, bg: INK, fg: CREAM, line: CREAM, lw: 2, s: pk, fam: MONO, wt: 600 }); }
    chip(g, 'FISHING GEAR', 760, 760, { px: 34, bg: CREAM, s: pop(t, gear) * (t < cutA + 2.5 ? 1 : 0), rot: -.03, wide: true });
    chip(g, 'ANCHORS', 1250, 760, { px: 34, bg: CREAM, s: pop(t, anch), rot: .03, wide: true });
    vignette(g, .4);
  }
  function anchor(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round';
    function st(w, c) { g.lineWidth = w; g.strokeStyle = c; g.beginPath(); g.moveTo(0, -70); g.lineTo(0, 10); g.moveTo(-26, -50); g.lineTo(26, -50); g.moveTo(-44, -12); g.quadraticCurveTo(0, 40, 44, -12); g.stroke(); }
    st(22, INK); st(12, '#8d8796'); circ(g, 0, -80, 12); fillStroke(g, null, 6); g.restore();
  }

  /* 11 · sharks */
  function sShark(g, t, s) {
    g.save(); push(g, t, s, .06);
    seaBG(g, t, 820, { top: '#195a80', bot: '#08192c' });
    cableLine(g, -100, W + 100, 860, t, { w: 22 });
    var bite = at('fault3', 'fish') - .2;
    var sx = kf(t, [[s.t0, -300], [bite - .6, 760], [bite + 1.2, 820], [s.t1, 2300]]), sy = kf(t, [[s.t0, 640], [bite - .6, 760], [bite, 800], [bite + 1.2, 760], [s.t1, 520]]);
    shark(g, sx, sy, 1.1, t, t > bite && t < bite + 1.3 ? 'chomp' : t > bite + 1.3 ? 'sad' : 'mean');
    var P = poseAt(t, [[s.t0, { look: [-.8, .2], mouth: 'o', brow: 1 }], [at('fault3', 'zero'), { lh: [-110, -260], rh: [110, -260], elDown: 1, mouth: 'smile', look: [0, 0], brow: 1, eyes: 'happy' }]]);
    guy(g, 1500, 860, 1.1, P, Object.assign({}, YOU, { helmet: true }), t);
    g.restore();
    chip(g, 'SHARKS?', 420, 170, { px: 70, bg: CREAM, s: pop(t, start('fault3') - .05), rot: -.05, wide: true });
    var z = pop(t, at('fault3', 'zero') - .08, 3, .5);
    if (z > 0) { g.save(); g.translate(1100, 300); g.rotate(-.08); g.scale(z * 1.0, z * 1.0); rr(g, -330, -110, 660, 220, 18); fillStroke(g, PAPER, 8); g.lineWidth = 6; g.strokeStyle = RED; rr(g, -310, -90, 620, 180, 12); g.stroke(); txt(g, '0 FAULTS', 0, -24, 92, RED, { wt: 900, wide: true }); txt(g, 'FROM FISH BITES, 2007–2014', 0, 56, 32, INK, { wt: 700, fam: MONO }); g.restore(); }
    vignette(g, .4);
  }
  function shark(g, x, y, s, t, mood) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(Math.sin(t * 3) * .03);
    var tw = Math.sin(t * 7) * 18;
    g.beginPath(); g.moveTo(-180, 0); g.lineTo(-250, -60 + tw); g.lineTo(-235, 0); g.lineTo(-250, 55 + tw); g.closePath(); fillStroke(g, '#7d95ad', 6);
    g.beginPath(); g.moveTo(-40, -50); g.lineTo(10, -130); g.lineTo(40, -48); g.closePath(); fillStroke(g, '#7d95ad', 6);
    g.beginPath(); g.ellipse(0, 0, 200, 64, 0, 0, 6.283); fillStroke(g, '#8fa8c0', 6);
    g.save(); g.beginPath(); g.ellipse(0, 0, 200, 64, 0, 0, 6.283); g.clip(); g.fillStyle = '#e8eef2'; g.fillRect(-200, 18, 400, 60); g.restore();
    g.beginPath(); g.ellipse(0, 0, 200, 64, 0, 0, 6.283); fillStroke(g, null, 6);
    circ(g, 120, -18, mood === 'sad' ? 7 : 9); g.fillStyle = INK; g.fill();
    g.lineWidth = 5; g.strokeStyle = INK; g.beginPath(); if (mood === 'mean') { g.moveTo(104, -36); g.lineTo(136, -26); } else if (mood === 'sad') { g.moveTo(108, -26); g.lineTo(134, -36); } g.stroke();
    var op = mood === 'chomp' ? Math.abs(Math.sin(t * 12)) * 26 : mood === 'sad' ? 0 : 8;
    g.beginPath(); g.moveTo(90, 22); g.quadraticCurveTo(150, 30 + op, 192, 12); g.lineWidth = 6; g.stroke();
    if (op > 4) for (var i = 0; i < 5; i++) { g.beginPath(); g.moveTo(110 + i * 16, 24); g.lineTo(117 + i * 16, 36); g.lineTo(124 + i * 16, 25); g.fillStyle = '#fff'; g.fill(); }
    for (i = 0; i < 3; i++) { g.beginPath(); g.moveTo(40 + i * 16, -10); g.lineTo(34 + i * 16, 20); g.lineWidth = 4; g.stroke(); }
    g.restore();
  }

  /* 12 · routing around */
  var NODES = { ny: [420, 560, 'NEW YORK'], lon: [1500, 380, 'LONDON'], lis: [1380, 760, 'LISBON'], ice: [960, 230, 'ICELAND'], azo: [930, 690, 'AZORES'] };
  var LINKS = [['ny', 'lon'], ['ny', 'ice'], ['ice', 'lon'], ['ny', 'azo'], ['azo', 'lis'], ['lis', 'lon']];
  function sRoute(g, t, s) {
    g.save(); push(g, t, s, .05);
    var bg = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1200); bg.addColorStop(0, '#1d4a6e'); bg.addColorStop(1, '#0a1a2e'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var c1 = at('route1', 'cut') + .1, all = at('route2', 'nothing') - .05;
    LINKS.forEach(function (l, i) {
      var a = NODES[l[0]], b = NODES[l[1]], dead = (i === 0 && t > c1) || t > all + i * .12;
      g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = INK; g.lineWidth = 22; g.stroke(); g.strokeStyle = dead ? '#5a2a3a' : '#e6c26a'; g.lineWidth = 12; g.stroke();
      if (dead) { var tc = i === 0 ? c1 : all + i * .12; cross(g, lerp(a[0], b[0], .5), lerp(a[1], b[1], .5), pop(t, tc, 3, .6) * .9, 1); spark(g, lerp(a[0], b[0], .5), lerp(a[1], b[1], .5), t, tc, .7); }
    });
    Object.keys(NODES).forEach(function (k) { var n = NODES[k]; circ(g, n[0], n[1], 30); fillStroke(g, CREAM, 7); txt(g, n[2], n[0], n[1] + 62, 34, CREAM, { wt: 800, wide: true, outline: 8 }); });
    /* the packet: direct until the cut, then the long way via the Azores and Lisbon, then stuck */
    function along(pts, u) { var L = [], T = 0; for (var i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); T += d; } var r = u * T; for (i = 0; i < L.length; i++) { if (r <= L[i]) { var k = r / L[i]; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; } r -= L[i]; } return pts[pts.length - 1]; }
    var N = NODES, p;
    if (t < c1) p = along([N.ny, N.lon], ((t - s.t0) / 1.4) % 1 * .9);
    else if (t < all) p = along([N.ny, N.azo, N.lis, N.lon], clamp((t - c1 - .3) / 2.2, 0, 1));
    else p = [N.ny[0] + 40 + knock(t, all, 30, 4) * 20, N.ny[1] - 40];
    g.save(); g.shadowColor = LIGHT; g.shadowBlur = 30; circ(g, p[0], p[1], 20); g.fillStyle = '#e9fbff'; g.fill(); g.restore();
    if (t > all + .5) chip(g, '?', N.ny[0] + 90, N.ny[1] - 130, { px: 80, bg: CREAM, s: pop(t, all + .6), rot: .1 });
    g.restore();
    chip(g, 'ONE CUT: NO BIG DEAL', 960, 110, { px: 46, bg: MINT, s: pop(t, start('route1')) * (t < all - .3 ? 1 : 0), rot: -.02, wide: true });
    chip(g, 'NOTHING LEFT TO ROUTE AROUND', 960, 110, { px: 46, bg: RED, fg: '#fff', s: pop(t, all), rot: .02, wide: true });
    vignette(g, .45);
  }

  /* 13 · second one */
  function sSec(g, t, s) {
    g.save(); push(g, t, s, .05, 960, 560);
    roomBG(g, t, .3); couch(g, 1200, 870, 1.05);
    var nv = at('sec2', 'never');
    var P = poseAt(t, [[s.t0, { hip: 58, lf: [-46, 0], rf: [46, 0], lh: [-20, -228], rh: [22, -226], look: [-.4, .8], mouth: 'smile' }], [nv, { look: [-.6, .9], mouth: 'flat', brow: 2 }], [nv + .8, { rh: [70, -300], mouth: 'frown', tilt: .1 }]]);
    guy(g, 1200, 860, 1.25, P, Object.assign({}, YOU, { hold: [null, function (g) { phone(g, -18, -12, .75, -.2, '#9ee6ff'); }] }), t);
    g.restore();
    chatPhone(g, 500, 520, 1.0, 1, t, ['Sam', 'LONDON'], [{ text: 'Landed yet?', side: 1, t: s.t0 - 1, status: function (tt) { return tt < nv ? ['Sending', null, 'spin'] : ['Not delivered !', RED]; } }]);
    vignette(g, .45);
  }
  /* 14 · the coast: routers search, every road ends */
  function sCoast(g, t, s) {
    g.save(); push(g, t, s, .05); g.translate(W / 2, H / 2); g.scale(1.32, 1.32); g.translate(-700, -500);
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3a2f66'); bg.addColorStop(1, '#e88a6d'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    waterSurface(g, 620, t, 900, W + 100, '#2a6f9a');
    /* land with a cliff edge at x 960 */
    g.beginPath(); g.moveTo(-50, 560); g.lineTo(940, 560); g.lineTo(1000, 1100); g.lineTo(-50, 1100); g.closePath(); fillStroke(g, '#4a3b63', 8);
    /* landing station + routers */
    rr(g, 120, 330, 360, 230, 10); fillStroke(g, CREAM, 7); txt(g, 'CABLE LANDING STATION', 300, 380, 24, INK, { wt: 800, fam: MONO });
    for (var i = 0; i < 3; i++) router(g, 190 + i * 110, 500, .8, t, i, t > at('sec4', 'isnt') ? 'sad' : 'look');
    /* searchlights from the routers out to sea */
    var sw = t < at('sec4', 'isnt') ? 1 : 1 - seg(t, at('sec4', 'isnt'), at('sec4', 'isnt') + .6);
    if (sw > 0) for (i = 0; i < 3; i++) { var a = -.25 + Math.sin(t * 1.6 + i * 2) * .25; g.save(); g.translate(190 + i * 110, 460); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.lineTo(1500, -120); g.lineTo(1500, 160); g.closePath(); g.fillStyle = 'rgba(255,240,180,' + (.1 * sw) + ')'; g.fill(); g.restore(); }
    /* the cut cables go off the cliff and dangle */
    for (i = 0; i < 3; i++) { g.beginPath(); g.moveTo(480, 520 + i * 14); g.quadraticCurveTo(900, 560 + i * 20, 990 + i * 30, 700 + i * 60); g.strokeStyle = INK; g.lineWidth = 18; g.stroke(); g.strokeStyle = '#3b3550'; g.lineWidth = 10; g.stroke(); }
    /* road signs at the edge */
    var signs = [['EUROPE', 'continent'], ['ASIA', 'road'], ['S. AMERICA', 'gone']];
    signs.forEach(function (sg2, j2) {
      var tt = at('sec4', sg2[1]) - .2, k = pop(t, start('sec4') + j2 * .3);
      g.save(); g.translate(560 + j2 * 140, 560); g.scale(k, k); g.fillStyle = INK; g.fillRect(-5, -180, 10, 180);
      g.beginPath(); g.moveTo(-90, -230); g.lineTo(80, -230); g.lineTo(110, -195); g.lineTo(80, -160); g.lineTo(-90, -160); g.closePath(); fillStroke(g, MINT, 5);
      txt(g, sg2[0], -5, -195, 24, INK, { wt: 900 }); g.restore();
      cross(g, 560 + j2 * 140, 365, pop(t, tt, 3, .6) * .8, 1);
    });
    g.restore();
    chip(g, 'NO WAY OFF THE CONTINENT', 1420, 150, { px: 44, bg: RED, fg: '#fff', s: pop(t, at('sec4', 'every') - .1), rot: .03, wide: true });
    vignette(g, .4);
  }
  function router(g, x, y, s, t, i, mood) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(-30, -60); g.lineTo(-36, -110); g.moveTo(30, -60); g.lineTo(36, -110); g.stroke();
    rr(g, -60, -70, 120, 70, 14); fillStroke(g, '#3a3352', 6);
    var look = Math.sin(t * 1.6 + i * 2) * 8;
    circ(g, -20 + look, -40, 8); g.fillStyle = CREAM; g.fill(); circ(g, 20 + look, -40, 8); g.fill();
    if (mood === 'sad') { g.strokeStyle = CREAM; g.lineWidth = 4; g.beginPath(); g.arc(0 + look, -10, 10, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
    for (var k = 0; k < 4; k++) { circ(g, -36 + k * 24, -14, 4); g.fillStyle = hash(Math.floor(t * 5) + k + i * 4) > .4 ? (mood === 'sad' ? RED : MINT) : '#2a2440'; g.fill(); }
    g.restore();
  }

  /* 15 · minute one: most of it still works */
  function sMin(g, t, s) {
    g.save(); push(g, t, s, .05, 960, 560);
    roomBG(g, t, .35); couch(g, 1200, 870, 1.05);
    var w = at('min1', 'weird');
    var P = poseAt(t, [[s.t0, { hip: 58, lf: [-46, 0], rf: [46, 0], lh: [-20, -228], rh: [22, -226], look: [-.5, .8], mouth: 'frown', brow: 2 }], [w, { eyes: 'wide', mouth: 'O', brow: 1, look: [-.6, .5] }], [start('min2'), { eyes: 'dot', mouth: 'grin', brow: 1 }]]);
    guy(g, 1200, 860, 1.25, P, Object.assign({}, YOU, { hold: [null, function (g) { phone(g, -18, -12, .75, -.2, '#9ee6ff'); }] }), t);
    g.restore();
    var tx = at('min2', 'texts');
    chatPhone(g, 480, 520, 1.0, 1, t, ['Jess', 'NEXT DOOR'], [{ text: 'Pizza tonight?', side: -1, t: tx - .1 }, { text: 'YES', side: 1, t: tx + .7, status: function () { return ['Delivered ✓', MINT]; } }]);
    var nk = pop(t, at('min2', 'local') - .1);
    if (nk > 0) card(g, 1560, 280, 380, 230, .04, nk, function (g) { txt(g, 'LOCAL NEWS', 0, -70, 40, INK, { wt: 900, wide: true }); g.fillStyle = PAPERS; g.fillRect(-160, -30, 150, 100); for (var i = 0; i < 4; i++) g.fillRect(10, -26 + i * 24, 150, 12); tick(g, 150, 80, 1.2, 1); });
    vignette(g, .45);
  }
  /* 16 · copies of popular shows */
  function sCache(g, t, s) {
    g.save(); push(g, t, s, .06);
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2d2654'); bg.addColorStop(1, '#4a3870'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    /* the country: a dashed border with a city, a server with copies, and your house */
    g.save(); g.setLineDash([24, 18]); g.lineDashOffset = -t * 30; g.beginPath(); g.ellipse(820, 560, 700, 400, 0, 0, 6.283); g.strokeStyle = 'rgba(244,237,224,.6)'; g.lineWidth = 6; g.stroke(); g.restore();
    txt(g, 'YOUR COUNTRY', 820, 200, 36, CREAM, { wt: 800, wide: true, ls: 4 });
    var sv = at('min3', 'servers');
    server(g, 520, 720, 1.3, 1, t); chip(g, 'COPIES OF POPULAR SHOWS', 520, 790, { px: 28, bg: YEL, s: pop(t, sv - .1), rot: -.02, wide: true });
    for (var i = 0; i < 4; i++) { var k = pop(t, at('min3', 'copies') + i * .15); if (k > 0) { g.save(); g.translate(400 + i * 80, 470 - (i % 2) * 20); g.scale(k, k); rr(g, -34, -24, 68, 48, 6); fillStroke(g, ['#ff5b3d', '#3d7bff', '#3fd6a2', '#ffc83d'][i], 4); g.beginPath(); g.moveTo(-8, -12); g.lineTo(12, 0); g.lineTo(-8, 12); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.restore(); } }
    /* your TV, a short trip away */
    var tvx = 1150, tvy = 520;
    rr(g, tvx - 200, tvy - 130, 400, 250, 16); fillStroke(g, '#2a2638', 8);
    g.save(); rr(g, tvx - 180, tvy - 112, 360, 214, 8); g.clip(); g.fillStyle = '#6ac7ff'; g.fillRect(tvx - 180, tvy - 112, 360, 214); g.fillStyle = GREEN; g.fillRect(tvx - 180, tvy + 50, 360, 60);
    var bx2 = tvx - 120 + ((t * 120) % 240), by2 = tvy + 40 - Math.abs(Math.sin(t * 5)) * 90; circ(g, bx2, by2, 22); fillStroke(g, HOOD, 4); g.restore();
    g.fillStyle = INK; g.fillRect(tvx - 10, tvy + 120, 20, 40); g.fillRect(tvx - 80, tvy + 156, 160, 12);
    dashFlow(g, 600, 640, tvx - 210, tvy, t, pop(t, at('min4', 'show') - .6));
    var P = poseAt(t, [[s.t0, { lh: [-70, -200], rh: [60, -200], look: [-.6, .2], mouth: 'smile' }], [at('min4', 'keeps'), { lh: [-50, -250], rh: [40, -290], eyes: 'happy', mouth: 'grin', look: [-.5, 0] }]]);
    guy(g, 1520, 900, 1.05, P, Object.assign({}, YOU, { hold: [function (g) { popcorn(g); }, null] }), t);
    if (t > at('min4', 'playing') - .1) tick(g, tvx + 170, tvy - 120, pop(t, at('min4', 'playing') - .1) * 1.6, 1);
    g.restore();
    vignette(g, .45);
  }
  function dashFlow(g, x0, y0, x1, y1, t, a) {
    if (a <= 0) return; g.save(); g.globalAlpha *= clamp(a, 0, 1); g.setLineDash([18, 20]); g.lineDashOffset = -t * 160; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - 120, x1, y1); g.strokeStyle = LIGHT; g.lineWidth = 8; g.stroke(); g.restore();
  }
  function popcorn(g) { g.beginPath(); g.moveTo(-26, -10); g.lineTo(26, -10); g.lineTo(18, 46); g.lineTo(-18, 46); g.closePath(); fillStroke(g, '#fff', 4); g.fillStyle = RED; g.fillRect(-10, -8, 8, 52); g.fillRect(8, -8, 8, 52); for (var i = 0; i < 5; i++) { circ(g, -20 + i * 10, -16 - (i % 2) * 8, 9); fillStroke(g, '#fff3c4', 3); } }
  /* 17 · overseas: spins forever, the call drops */
  function sAbroad(g, t, s) {
    g.save(); push(g, t, s, .05);
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2d2654'); bg.addColorStop(1, '#4a3870'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var t6 = start('min6'), sw = eio(seg(t, t6 - .3, t6 + .3));
    /* browser card */
    g.save(); g.translate(-sw * 600, 0);
    rr(g, 300, 160, 900, 620, 24); fillStroke(g, '#f7f3ea', 7); rr(g, 300, 160, 900, 70, [24, 24, 0, 0]); fillStroke(g, '#e4ddcf', 7);
    [0, 1, 2].forEach(function (i) { circ(g, 345 + i * 34, 195, 10); g.fillStyle = [RED, YEL, MINT][i]; g.fill(); });
    rr(g, 460, 176, 560, 40, 20); fillStroke(g, '#fff', 3, '#cfc6b4'); txt(g, 'a-site-hosted-overseas.com', 480, 197, 24, 'rgba(28,24,48,.7)', { align: 'left', fam: MONO, wt: 600 });
    spinner(g, 750, 470, 70, t, INK, 1);
    txt(g, 'Loading…', 750, 600, 40, 'rgba(28,24,48,.6)', { wt: 700 });
    var fo = pop(t, at('min5', 'forever') - .1); if (fo > 0) chip(g, 'FOREVER', 750, 700, { px: 50, bg: RED, fg: '#fff', s: fo, rot: -.04, wide: true });
    g.restore();
    /* the video call, frozen */
    if (sw > 0) {
      g.save(); g.translate((1 - sw) * 1200, 0);
      rr(g, 560, 140, 800, 620, 24); fillStroke(g, '#1d1a2b', 7);
      g.save(); rr(g, 580, 160, 760, 520, 14); g.clip();
      var fr = t > at('min6', 'freezes') ? at('min6', 'freezes') : t, drop = t > at('min6', 'drops');
      var gb = g.createLinearGradient(0, 160, 0, 680); gb.addColorStop(0, '#f2c58f'); gb.addColorStop(1, '#d88a6a'); g.fillStyle = gb; g.fillRect(580, 160, 760, 520);
      guy(g, 960, 880, 1.25, Object.assign({}, BASE, { rh: [100, -330], mouth: t > at('min6', 'freezes') ? 'O' : 'talk', eyes: t > at('min6', 'freezes') ? 'wide' : 'dot' }), { col: '#8a6bc2', shade: '#6f54a3', seed: 9, hair: 'bun', glasses: true }, fr);
      if (t > at('min6', 'freezes')) { var bl = 24; for (var y = 160; y < 680; y += bl) for (var x = 580; x < 1340; x += bl) if (hash(x * .1 + y) > .82) { g.fillStyle = 'rgba(40,30,60,.35)'; g.fillRect(x, y, bl, bl); } }
      if (drop) { g.fillStyle = 'rgba(20,16,34,' + (.85 * seg(t, at('min6', 'drops'), at('min6', 'drops') + .3)) + ')'; g.fillRect(580, 160, 760, 520); }
      g.restore();
      circ(g, 960, 720, 30); fillStroke(g, RED, 5);
      if (drop) chip(g, 'CALL DROPPED', 960, 420, { px: 60, bg: RED, fg: '#fff', s: pop(t, at('min6', 'drops')), rot: -.03, wide: true });
      chip(g, 'FAMILY ABROAD', 960, 110, { px: 34, bg: CREAM, s: pop(t, at('min6', 'family')), rot: .02, wide: true });
      g.restore();
    }
    g.restore();
    vignette(g, .45);
  }

  /* 18 · hour one: money notices */
  function sHour(g, t, s) {
    g.save(); push(g, t, s, .05);
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#f4c27e'); bg.addColorStop(1, '#e7946a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    /* a café counter */
    g.fillStyle = '#6a4a6a'; g.fillRect(0, 700, W, 380); g.fillStyle = INK; g.fillRect(0, 694, W, 12);
    rr(g, 200, 120, 520, 320, 16); fillStroke(g, '#3b2f55', 7); txt(g, 'CAFÉ', 460, 200, 70, YEL, { wt: 900, wide: true }); txt(g, 'COFFEE  $4', 460, 300, 40, CREAM, { fam: MONO, wt: 700 }); txt(g, 'BAGEL   $3', 460, 360, 40, CREAM, { fam: MONO, wt: 700 });
    var dc = at('hour2', 'declined');
    var P = poseAt(t, [[s.t0, { rh: [120, -230], lh: [-60, -150], look: [1, .3], mouth: 'smile' }], [dc, { look: [1, .4], mouth: 'O', eyes: 'wide', brow: 1 }], [dc + .7, { lh: [-40, -300], rh: [40, -300], front: 1, mouth: 'frown', eyes: 'dot', brow: 2, look: [0, .2] }]]);
    guy(g, 820, 860, 1.15, P, { col: '#3d9bd6', shade: '#2f7fb4', seed: 6, hat: 'sun', hold: [null, function (g) { if (t < dc + .7) { rr(g, -6, -20, 60, 38, 5); fillStroke(g, YEL, 4); } }] }, t);
    /* the card terminal */
    rr(g, 1000, 520, 170, 240, 18); fillStroke(g, '#2a2638', 7); rr(g, 1020, 545, 130, 80, 8);
    g.fillStyle = t > dc ? RED : '#9ee6ff'; g.fill(); if (t > dc) txt(g, 'DECLINED', 1085, 586, 24, '#fff', { wt: 900 });
    for (var i = 0; i < 9; i++) { rr(g, 1028 + (i % 3) * 40, 640 + Math.floor(i / 3) * 36, 32, 28, 5); fillStroke(g, '#4a4466', 3); }
    var bk = pop(t, at('hour2', 'bank') - .1);
    if (bk > 0) {
      g.save(); g.translate(1560, 360); g.scale(bk, bk);
      g.beginPath(); g.moveTo(-130, -40); g.lineTo(0, -110); g.lineTo(130, -40); g.closePath(); fillStroke(g, CREAM, 6);
      for (i = 0; i < 4; i++) { g.fillStyle = CREAM; g.fillRect(-100 + i * 62, -30, 22, 120); g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-100 + i * 62, -30, 22, 120); }
      rr(g, -140, 90, 280, 30, 4); fillStroke(g, CREAM, 6); txt(g, 'THEIR BANK', 0, 160, 34, INK, { wt: 900, wide: true }); txt(g, 'ANOTHER CONTINENT', 0, 200, 24, 'rgba(28,24,48,.7)', { fam: MONO, wt: 700 });
      g.restore();
      g.save(); g.setLineDash([16, 14]); g.beginPath(); g.moveTo(1180, 600); g.quadraticCurveTo(1350, 500, 1420, 420); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); g.restore();
      cross(g, 1310, 510, pop(t, dc + .1), 1);
    }
    g.restore();
    chip(g, 'MONEY NOTICES', 1500, 120, { px: 48, bg: CREAM, s: pop(t, at('hour1', 'money') - .1) * (1 - seg(t, start('hour2'), start('hour2') + .3)), rot: .03, wide: true });
    vignette(g, .35);
  }
  /* 19 · markets and clouds */
  function sMarkets(g, t, s) {
    g.save(); push(g, t, s, .05);
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1e2244'); bg.addColorStop(1, '#2d3360'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var t4 = start('hour4'), sw = eio(seg(t, t4 - .3, t4 + .3));
    g.save(); g.translate(-sw * W, 0);
    [['NEW YORK', 120, true], ['LONDON', 1000, false]].forEach(function (m) {
      var x = m[1]; rr(g, x, 160, 780, 480, 18); fillStroke(g, '#111326', 8); txt(g, m[0], x + 390, 210, 40, CREAM, { wt: 900, wide: true });
      g.save(); rr(g, x + 20, 250, 740, 370, 8); g.clip();
      if (m[2] || t < at('hour3', 'see')) { for (var i = 0; i < 18; i++) { var v = hash(i * 7 + (m[2] ? 0 : 3)), hgt = 40 + v * 120, up = hash(i * 3 + 1) > .45, cx = x + 60 + i * 38, cy = 470 - Math.sin(i * .5) * 60 - i * 3; g.fillStyle = up ? MINT : RED; g.fillRect(cx - 10, cy - hgt / 2, 20, hgt); g.fillRect(cx - 2, cy - hgt / 2 - 20, 4, hgt + 40); } }
      else { for (var y = 250; y < 620; y += 6) for (var xx = x + 20; xx < x + 760; xx += 6) if (hash(xx * 1.3 + y * 7 + Math.floor(t * 12) * 13) > .7) { g.fillStyle = 'rgba(200,200,220,.4)'; g.fillRect(xx, y, 6, 6); } txt(g, 'NO DATA', x + 390, 440, 80, RED, { wt: 900, wide: true, outline: 12 }); }
      g.restore();
    });
    var P = poseAt(t, [[s.t0, { look: [.8, -.4], mouth: 'flat' }], [at('hour3', 'see'), { lh: [-40, -360], rh: [40, -360], front: 1, eyes: 'wide', mouth: 'O', brow: 2, look: [.6, -.5] }]]);
    guy(g, 880, 1000, .95, P, { col: '#2d3a5a', shade: '#212b45', seed: 7, tie: RED, glasses: true }, t);
    g.restore();
    if (sw > 0) {
      g.save(); g.translate((1 - sw) * W, 0);
      var dk = at('hour4', 'dark');
      cloudShape(g, 1360, 340, 2.1, t > dk ? '#4a4466' : CREAM); txt(g, 'CLOUD · OVERSEAS', 1360, 320, 36, INK, { wt: 900, wide: true });
      server(g, 1280, 800, 1, t < dk ? 1 : 0, t); server(g, 1450, 800, 1, t < dk ? 1 : 0, t);
      /* an office tower whose windows go out */
      rr(g, 300, 170, 420, 650, 10); fillStroke(g, '#3b3a5e', 8);
      for (var r = 0; r < 9; r++) for (var c = 0; c < 4; c++) { var off = t > dk + hash(r * 4 + c) * .8; rr(g, 330 + c * 100, 200 + r * 68, 70, 46, 4); g.fillStyle = off ? '#24223c' : '#ffd27a'; g.fill(); }
      txt(g, 'YOUR COMPANY', 510, 870, 40, CREAM, { wt: 900, wide: true });
      g.save(); g.setLineDash([14, 12]); g.beginPath(); g.moveTo(720, 500); g.quadraticCurveTo(950, 380, 1130, 380); g.strokeStyle = t > dk ? RED : LIGHT; g.lineWidth = 7; g.stroke(); g.restore();
      cross(g, 930, 420, pop(t, dk), 1);
      g.restore();
    }
    g.restore();
    vignette(g, .4);
  }
  /* 20 · satellites: a river through a straw */
  function sRiver(g, t, s) {
    g.save(); push(g, t, s, .06);
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a2a5a'); bg.addColorStop(1, '#4a3a6a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var rv = at('hour5', 'river') - .2;
    /* the river: a wide band of light dots flowing right, piling up at a straw */
    var flow = clamp((t - rv) * 1.4, 0, 1);
    g.save(); g.beginPath(); g.moveTo(-50, 300); g.bezierCurveTo(500, 280, 900, 380, 1240, 500); g.lineTo(1240, 580); g.bezierCurveTo(900, 700, 500, 800, -50, 780); g.closePath();
    var rg = g.createLinearGradient(0, 300, 0, 780); rg.addColorStop(0, '#2f8fd0'); rg.addColorStop(1, '#1a5a96'); g.fillStyle = rg; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke(); g.clip();
    var r = mulberry(51); for (var i = 0; i < 260; i++) { var y0 = 300 + r() * 480, sp2 = 120 + r() * 160, x = (r() * 1400 + t * sp2) % 1400 - 100; var pile = x > 1100 ? (x - 1100) * .3 : 0; circ(g, Math.min(x, 1180 - r() * 60), y0 + (540 - y0) * clamp((x - 600) / 700, 0, 1) * .7, 5 + r() * 4); g.fillStyle = 'rgba(190,240,255,' + (.4 + r() * .5) + ')'; g.fill(); }
    g.restore();
    /* the straw */
    g.save(); g.translate(1250, 540); rr(g, 0, -14, 520, 28, 14); fillStroke(g, '#fff', 6); g.fillStyle = RED; for (i = 0; i < 9; i++) { g.save(); g.beginPath(); g.rect(0, -14, 520, 28); g.clip(); g.beginPath(); g.moveTo(20 + i * 60, -14); g.lineTo(46 + i * 60, -14); g.lineTo(26 + i * 60, 14); g.lineTo(0 + i * 60, 14); g.closePath(); g.fill(); g.restore(); }
    for (i = 0; i < 6; i++) { var px = ((t * 260 + i * 90) % 520); circ(g, px, 0, 5); g.fillStyle = LIGHT; g.fill(); }
    g.restore();
    chip(g, 'SATELLITES', 1510, 470, { px: 40, bg: YEL, s: pop(t, at('hour5', 'straw') - .1), rot: -.03, wide: true });
    chip(g, 'CABLE TRAFFIC', 420, 230, { px: 40, bg: LIGHT, s: pop(t, rv), rot: -.03, wide: true });
    var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [120, -200], look: [-1, -.2], mouth: 'wavy', brow: 2 }], [at('hour5', 'straw'), { eyes: 'wide', mouth: 'O' }]]);
    guy(g, 1500, 1000, .95, P, YOU, t);
    g.restore();
    vignette(g, .4);
  }
  /* 21 · islands */
  function sIsland(g, t, s) {
    g.save(); push(g, t, s, .07, 960, 520);
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#ff9e6e'); bg.addColorStop(.55, '#f0c08a'); bg.addColorStop(1, '#2a6f9a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    circ(g, 1500, 360, 110); g.fillStyle = '#ffe2a8'; g.fill();
    waterSurface(g, 560, t, -100, W + 100, '#2b7fae');
    var cut = at('island2', 'cut') - .1, lit = t < cut + .2;
    /* the one cable runs from the island off to the right, under the water */
    g.lineCap = 'round'; g.beginPath(); g.moveTo(1000, 640); g.quadraticCurveTo(1300, 900, 1980, 940); g.strokeStyle = INK; g.lineWidth = 24; g.stroke(); g.strokeStyle = '#3b3550'; g.lineWidth = 14; g.stroke();
    if (t > cut) { g.fillStyle = '#1e5a84'; g.fillRect(1400, 880, 90, 90); spark(g, 1445, 920, t, cut, 1.2); }
    /* island */
    g.beginPath(); g.ellipse(760, 580, 340, 70, 0, Math.PI, 0); fillStroke(g, '#e8c886', 7);
    g.beginPath(); g.moveTo(560, 520); g.quadraticCurveTo(580, 380, 540, 300); g.lineWidth = 18; g.strokeStyle = INK; g.stroke(); g.lineWidth = 10; g.strokeStyle = '#9a6a3a'; g.stroke();
    for (var i = 0; i < 5; i++) { g.save(); g.translate(540, 300); g.rotate(-2.6 + i * .55 + Math.sin(t * 1.5 + i) * .05); g.beginPath(); g.ellipse(70, 0, 80, 22, 0, 0, 6.283); fillStroke(g, '#3e9a5a', 5); g.restore(); }
    for (i = 0; i < 3; i++) { var hx = 760 + i * 110; rr(g, hx - 40, 450, 80, 70, 6); fillStroke(g, CREAM, 5); g.beginPath(); g.moveTo(hx - 50, 452); g.lineTo(hx, 410); g.lineTo(hx + 50, 452); g.closePath(); fillStroke(g, HOOD, 5); rr(g, hx - 14, 470, 28, 28, 4); g.fillStyle = lit ? '#ffd27a' : '#3b3352'; g.fill(); }
    var P = poseAt(t, [[s.t0, { rh: [80, -230], look: [.3, .6], mouth: 'smile' }], [cut + .2, { rh: [120, -330], lh: [-60, -150], look: [.8, -.3], mouth: 'O', eyes: 'wide', brow: 1 }]]);
    guy(g, 650, 530, .7, P, { col: TEAL, shade: '#227f74', seed: 12, hold: [null, function (g) { phone(g, 0, -10, .6, .2, lit ? '#9ee6ff' : '#3a3552'); }] }, t);
    if (!lit) chip(g, 'NO CONNECTION', 660, 250, { px: 30, bg: RED, fg: '#fff', s: pop(t, cut + .4), rot: .04, wide: true });
    g.restore();
    chip(g, 'ONE OR TWO CABLES', 1450, 140, { px: 44, bg: CREAM, s: pop(t, at('island2', 'one') - .1), rot: .03, wide: true });
    vignette(g, .35);
  }

  /* 22 · day one: it already happened (Egypt, India) */
  function sDay(g, t, s) {
    g.save(); push(g, t, s, .05);
    g.fillStyle = '#3a2f4f'; g.fillRect(0, 0, W, H);
    /* a desk with wood grain */
    g.fillStyle = '#6b4a3a'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 3; for (var i = 0; i < 30; i++) { g.beginPath(); g.moveTo(0, i * 40 + Math.sin(i) * 10); g.bezierCurveTo(600, i * 40 + 20, 1300, i * 40 - 20, W, i * 40 + 10); g.stroke(); }
    var h1 = start('hist1'), h2 = start('hist2');
    var sf = pop(t, at('day1', 'science') - .1);
    if (t < h1) {
      var P = poseAt(t, [[s.t0, { look: [.5, .2], mouth: 'smirk', brow: -1, lh: [-60, -150], rh: [100, -260] }], [at('day1', 'already'), { look: [0, .1], mouth: 'flat', brow: 2, eyes: 'wide', rh: [60, -150] }]]);
      guy(g, 600, 980, 1.2, P, YOU, t);
      chip(g, 'SCIENCE FICTION?', 1260, 380, { px: 60, bg: CREAM, s: sf, rot: -.04, wide: true });
      var ah = pop(t, at('day1', 'happened') - .1, 3, .5);
      if (ah > 0) { g.save(); g.translate(1260, 560); g.rotate(-.1); g.scale(ah, ah); rr(g, -300, -70, 600, 140, 12); g.lineWidth = 10; g.strokeStyle = RED; g.stroke(); txt(g, 'IT HAPPENED', 0, 4, 80, RED, { wt: 900, wide: true }); g.restore(); }
    } else {
      /* the 2008 clipping: a map of the Mediterranean, Egypt's bar drops by 70 % */
      var k1 = pop(t, h1 - .1, 2.6, .7);
      card(g, 620, 520, 820, 760, -.03, k1, function (g, w, h) {
        txt(g, 'JANUARY 2008', 0, -320, 30, 'rgba(28,24,48,.7)', { fam: MONO, wt: 700 });
        txt(g, 'CABLES CUT NEAR EGYPT', 0, -265, 40, INK, { wt: 900, wide: true });
        g.fillStyle = INK; g.fillRect(-370, -230, 740, 5);
        var m3 = { x: -260 - 30 * 9, y: -200 + 45 * 9, s: 9 };
        g.save(); g.beginPath(); g.rect(-370, -210, 740, 300); g.clip(); g.fillStyle = '#9cc7df'; g.fillRect(-370, -210, 740, 300);
        LAND.forEach(function (poly) { g.beginPath(); poly.forEach(function (p, i2) { var q = mapProj(m3, p[0], p[1]); if (i2) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.closePath(); g.fillStyle = '#d9c7a0'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); });
        var al = mapProj(m3, 29.9, 31.2); cross(g, al[0], al[1], pop(t, at('hist1', 'cuts')) * .7, 1); txt(g, 'EGYPT', al[0] + 20, al[1] + 90, 30, INK, { wt: 900 });
        g.restore(); g.lineWidth = 5; g.strokeStyle = INK; g.strokeRect(-370, -210, 740, 300);
        /* bar: Egypt's link to the outside internet */
        var e = eio(seg(t, at('hist1', '70') - .1, at('hist1', '70') + .6));
        txt(g, "EGYPT'S LINK TO THE WORLD", -370, 140, 28, INK, { align: 'left', wt: 800 });
        rr(g, -370, 170, 740, 60, 10); fillStroke(g, '#e4d9c3', 4); rr(g, -370, 170, 740 * (1 - .7 * e), 60, 10); fillStroke(g, MINT, 4);
        if (e > 0) txt(g, '−70%', 300, 200, 46, RED, { wt: 900 });
        var e2 = eio(seg(t, at('hist2', 'half') - .2, at('hist2', 'half') + .5));
        txt(g, "INDIA'S OUTBOUND LINK", -370, 270, 28, INK, { align: 'left', wt: 800 });
        rr(g, -370, 300, 740, 60, 10); fillStroke(g, '#e4d9c3', 4); rr(g, -370, 300, 740 * (1 - .5 * e2), 60, 10); fillStroke(g, MINT, 4);
        if (e2 > 0) txt(g, '≈ −50%', 280, 330, 46, RED, { wt: 900 });
      });
      tape(g, 400, 160, -.2); tape(g, 860, 150, .15);
      var P2 = poseAt(t, [[h1, { look: [-1, -.3], mouth: 'o', brow: 1, lh: [-90, -200], rh: [60, -150] }], [at('hist2', 'india'), { look: [-1, 0], mouth: 'frown', brow: 2 }]]);
      guy(g, 1450, 1000, 1.2, P2, YOU, t);
      chip(g, 'SOURCE: MIT TECHNOLOGY REVIEW, ISPAI', 1450, 140, { px: 22, bg: INK, fg: CREAM, line: CREAM, lw: 2, s: pop(t, h1 + .5), fam: MONO, wt: 600 });
    }
    g.restore();
    vignette(g, .45);
  }
  /* 23 · the Red Sea, 2024: a sinking ship drags its anchor */
  function sRedSea(g, t, s) {
    g.save(); push(g, t, s, .05);
    seaBG(g, t, 880, { top: '#1a6a8a', bot: '#0a2236' });
    g.fillStyle = '#f2b37a'; g.fillRect(-200, -200, W + 400, 420);
    waterSurface(g, 210, t, -200, W + 200, '#2a86b5');
    var sk = seg(t, start('hist3'), end('hist3')), dr = at('hist3', 'dragged') - .1, cut0 = at('hist3', 'cut') - .2;
    for (var i = 0; i < 3; i++) {
      var tc = cut0 + i * .35, cx = 760 + i * 250, k = t > tc ? sp(t, tc, 2.2, .5) : 0;
      cableLine(g, -100, W + 100, 760 + i * 50, t, { w: 16, lit: t > tc ? 0 : 1, cut: t > tc ? cx : null, gap: 30 + 50 * k, droop: 40 * k, ph: i * 2.1, amp: 10 });
      spark(g, cx, 760 + i * 50, t, tc, .9);
    }
    var sx = lerp(500, 1300, sk);
    shipHull(g, sx, 200 + sk * 90, .75, '#7a5a4a', -.08 - sk * .2, { cargo: true });
    var ay = lerp(240, 800, seg(t, dr - 1, dr)), axp = sx - 200 + seg(t, dr, end('hist3') + .5) * 700;
    g.strokeStyle = INK; g.lineWidth = 7; g.setLineDash([14, 7]); g.beginPath(); g.moveTo(sx - 180, 240); g.lineTo(axp, ay); g.stroke(); g.setLineDash([]);
    anchor(g, axp, ay + 10, 1.3);
    g.restore();
    chip(g, 'RED SEA · 2024', 760, 130, { px: 56, bg: CREAM, s: pop(t, at('hist3', '2024') - .1), rot: -.03, wide: true });
    chip(g, '3 CABLES', 1500, 120, { px: 56, bg: RED, fg: '#fff', s: pop(t, at('hist3', 'three') - .1), rot: .03, wide: true });
    chip(g, 'MOST LIKELY CAUSE: THE SHIP’S DRAGGING ANCHOR · ICPC', 960, 1060 - 120, { px: 24, bg: INK, fg: CREAM, line: CREAM, lw: 2, s: pop(t, at('hist3', 'likely')), fam: MONO, wt: 600 });
    vignette(g, .4);
  }
  /* 24 · Tonga, 2022 */
  function sTonga(g, t, s) {
    g.save(); push(g, t, s, .06);
    var h5 = start('hist5'), er = at('hist4', 'volcano') - .2, sn = at('hist4', 'snapped') - .1;
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, t > er ? '#6a4a5a' : '#8fb8d8'); bg.addColorStop(1, '#f0b58a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    /* the eruption: a column of ash with puffs */
    if (t > er) {
      var u = t - er;
      for (var i = 0; i < 30; i++) { var k = eo(clamp((u - i * .05) / 1.4, 0, 1)); if (k <= 0) continue; var hi = i / 30, r = (50 + hash(i * 3.3) * 50) * (.6 + hi), y = 600 - k * hi * 520, x = 520 + (hash(i * 7.1) - .5) * 2 * (40 + hi * hi * 380) * k; circ(g, x, y, r * k); fillStroke(g, i % 3 ? '#8a7f8c' : '#a89aa4', 5); }
      g.save(); g.globalAlpha = .4 * (1 - seg(u, 0, .5)); g.fillStyle = '#fff3d6'; g.fillRect(0, 0, W, H); g.restore();
    }
    waterSurface(g, 580, t + knock(t, er, 20, 3) * .5, -100, W + 100, '#2b7fae');
    /* the island to the right, its cable to the left edge of the frame */
    g.beginPath(); g.ellipse(1450, 600, 300, 60, 0, Math.PI, 0); fillStroke(g, '#d9b97a', 7);
    for (i = 0; i < 4; i++) { var hx = 1330 + i * 80; rr(g, hx - 28, 520, 56, 50, 5); fillStroke(g, CREAM, 4); rr(g, hx - 10, 534, 20, 20, 3); g.fillStyle = t < sn + .2 || t > h5 + .3 ? '#ffd27a' : '#3b3352'; g.fill(); }
    var kk = t > sn ? sp(t, sn, 2, .45) : 0;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(1300, 640); g.quadraticCurveTo(1100, 900, 980 - kk * 40, 920 + kk * 60); g.strokeStyle = INK; g.lineWidth = 24; g.stroke(); g.strokeStyle = '#3b3550'; g.lineWidth = 14; g.stroke();
    g.beginPath(); g.moveTo(-60, 940); g.lineTo(880 + kk * 20, 930 + kk * 80); g.strokeStyle = INK; g.lineWidth = 24; g.stroke(); g.strokeStyle = '#3b3550'; g.lineWidth = 14; g.stroke();
    spark(g, 930, 925, t, sn, 1.2);
    /* satellite dishes and thin beams after */
    if (t > h5 - .2) {
      var hk = pop(t, at('hist5', 'handful') - .2);
      for (i = 0; i < 3; i++) { g.save(); g.translate(1560 + i * 60, 540); g.scale(hk, hk); g.beginPath(); g.arc(0, 0, 26, Math.PI * .9, Math.PI * 1.9); g.closePath(); fillStroke(g, CREAM, 4); g.restore(); }
      satellite(g, 1640, 170, .45, .2);
      g.save(); g.setLineDash([6, 14]); g.lineDashOffset = -t * 60; g.strokeStyle = YEL; g.lineWidth = 4; for (i = 0; i < 3; i++) { g.beginPath(); g.moveTo(1560 + i * 60, 520); g.lineTo(1640, 200); g.stroke(); } g.restore();
      chip(g, 'A HANDFUL OF SATELLITE LINKS', 1300, 330, { px: 32, bg: YEL, s: hk, rot: -.03, wide: true });
    }
    g.restore();
    chip(g, 'TONGA · 2022', 1450, 120, { px: 56, bg: CREAM, s: pop(t, at('hist4', '2022') - .1), rot: .03, wide: true });
    chip(g, 'ITS ONLY INTERNATIONAL CABLE', 600, 820 - 40, { px: 32, bg: RED, fg: '#fff', s: pop(t, at('hist4', 'only') - .1), rot: -.02, wide: true });
    vignette(g, .4);
  }

  /* 25 · week one: who fixes this? */
  function sWeek(g, t, s) {
    g.save(); push(g, t, s, .05);
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#7fb6d6'); bg.addColorStop(1, '#f4d6a8'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    waterSurface(g, 640, t, -100, W + 100, '#2b7fae');
    var s1 = start('ship1');
    if (t < s1) {
      var P = poseAt(t, [[s.t0, { rh: [30, -330], look: [.5, -.6], mouth: 'wavy', brow: 2, tilt: .12 }]]);
      guy(g, 960, 1060, 1.3, P, YOU, t);
      chip(g, 'WHO FIXES THIS?', 960, 260, { px: 70, bg: CREAM, s: pop(t, at('week1', 'who') - .1), rot: -.03, wide: true });
    } else {
      var n = Math.round(lerp(0, 30, eo(seg(t, at('ship1', '20') - .2, wend('ship1', '30') + .4))));
      for (var i = 0; i < n; i++) { var row = Math.floor(i / 10), col = i % 10, k = pop(t, at('ship1', '20') - .2 + i * .05); g.save(); g.translate(230 + col * 162 + row * 50, 620 + row * 120 + Math.sin(t * 2 + i) * 4); g.scale(k * .3, k * .3); shipHull(g, 0, 0, 1, i < 20 ? '#c9473a' : '#d97a5a', Math.sin(t * 1.5 + i) * .03, { repair: true }); g.restore(); }
      chip(g, '20–30 DEDICATED REPAIR SHIPS', 960, 230, { px: 58, bg: YEL, s: pop(t, at('ship1', '20') - .2), rot: -.02, wide: true });
      chip(g, 'FOR THE WHOLE PLANET', 960, 330, { px: 34, bg: CREAM, s: pop(t, at('ship1', 'earth') - .1), rot: .02, wide: true });
      chip(g, 'SOURCES: ITU, U.S. NAVY, HEISE', 960, 1000 - 70, { px: 22, bg: INK, fg: CREAM, line: CREAM, lw: 2, s: pop(t, at('ship1', 'dedicated')), fam: MONO, wt: 600 });
    }
    g.restore();
    vignette(g, .35);
  }
  /* 26 · the repair: a grapnel, the deck, a splice by hand, 8 days to start */
  function sShip(g, t, s) {
    var t3 = start('ship3'), t4 = start('ship4'), deck = eio(seg(t, t3 + .6, t3 + 1.4)), cal = eio(seg(t, t4 - .3, t4 + .3));
    g.save();
    var camY = lerp(260, -120, deck);
    g.translate(0, -camY + 260); g.translate(W / 2, H / 2); var z = 1 + deck * .5; g.scale(z, z); g.translate(-W / 2 - deck * 250, -H / 2);
    g.fillStyle = '#f0c48a'; g.fillRect(-500, -900, W + 1000, 1300);
    seaBG(g, t, null, { top: '#1d6a92', bot: '#06172a' });
    g.fillStyle = '#f0c48a'; g.fillRect(-500, -900, W + 1000, 1220);
    waterSurface(g, 320, t, -500, W + 500, '#2a86b5');
    floor(g, 1000, t);
    /* the hook goes down, drags, catches, lifts */
    var dn = seg(t, start('ship2') + .2, at('ship2', 'drags')), drg = seg(t, at('ship2', 'drags'), end('ship2') + .2), lift = seg(t, t3 - .1, t3 + 1.0);
    var hx = 900 + drg * 300, hy = lerp(330, 990, dn) - lift * 720;
    var catchX = 1200;
    /* the cable, lifted in a bight when caught */
    g.lineCap = 'round'; g.beginPath(); g.moveTo(-200, 1010);
    if (t < t3 - .1) { g.lineTo(W + 200, 1010); } else { g.quadraticCurveTo(catchX - 200, 1010, hx, hy + 20); g.quadraticCurveTo(catchX + 200, 1010, W + 200, 1010); }
    g.strokeStyle = INK; g.lineWidth = 26; g.stroke(); g.strokeStyle = '#3b3550'; g.lineWidth = 16; g.stroke();
    if (t < t3) { g.fillStyle = 'rgba(255,74,61,.9)'; circ(g, 1200, 1010, 14); g.fill(); }
    shipHull(g, 960, 300, 1.05, '#c9473a', Math.sin(t * 1.3) * .015, { repair: true });
    g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(1218, 238); g.lineTo(hx, hy); g.stroke();
    grapnel(g, hx, hy, 1);
    /* crew on deck */
    var sp2 = t > t3 + 1.2;
    var CP = poseAt(t, [[s.t0, { rh: [100, -230], look: [1, .3], mouth: 'smile' }], [t3 + 1.2, { lh: [40, -170], rh: [80, -170], look: [1, .8], mouth: 'flat', brow: -1, lean: .2 }]]);
    guy(g, 1060, 250, .5, CP, { col: HOOD, shade: HOODS, seed: 21, hat: 'hard', vest: true }, t);
    guy(g, 1150, 250, .5, poseAt(t, [[s.t0, { lh: [-100, -240], look: [-1, .2], mouth: 'grin' }], [t3 + 1.2, { lh: [-80, -170], rh: [-40, -170], look: [-1, .8], mouth: 'o', lean: -.15 }]]), { col: '#3d7bff', shade: '#2f5fcc', seed: 22, hat: 'hard', vest: true }, t);
    if (sp2) { var fl = hash(Math.floor(t * 14)) > .4; if (fl) { g.save(); g.shadowColor = '#fff'; g.shadowBlur = 20; circ(g, 1105, 170, 8 + hash(Math.floor(t * 14) + 3) * 10); g.fillStyle = '#fff8d8'; g.fill(); g.restore(); } }
    g.restore();
    chip(g, 'A GRAPNEL HOOK', 400, 170, { px: 44, bg: CREAM, s: pop(t, at('ship2', 'hook') - .1) * (1 - deck), rot: -.03, wide: true });
    chip(g, 'SPLICED BY HAND', 1450, 170, { px: 50, bg: YEL, s: pop(t, at('ship3', 'hand') - .1), rot: .03, wide: true });
    if (cal > 0) {
      var d = Math.min(8, 1 + Math.floor(seg(t, at('ship4', 'eight') - .9, at('ship4', 'eight') + .1) * 7.99));
      calendar(g, 960, 450, 1.25, 'DAY', String(d), cal, -.03);
      chip(g, 'TYPICAL WAIT TO START A REPAIR', 960, 710, { px: 34, bg: CREAM, s: cal, rot: .02, wide: true });
      chip(g, 'MEDIAN, 3,053 REPAIRS · ITU-BACKED ANALYSIS', 960, 785, { px: 22, bg: INK, fg: CREAM, line: CREAM, lw: 2, s: cal, fam: MONO, wt: 600 });
    }
    vignette(g, .4);
  }
  function grapnel(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round';
    function st(w, c) { g.lineWidth = w; g.strokeStyle = c; g.beginPath(); g.moveTo(0, -40); g.lineTo(0, 30); for (var i = -1; i <= 1; i += 2) { g.moveTo(0, 30); g.quadraticCurveTo(i * 40, 40, i * 34, 0); } g.stroke(); }
    st(18, INK); st(9, '#9aa0ad'); g.restore();
  }

  /* 27 · the math */
  function sMath(g, t, s) {
    g.save(); push(g, t, s, .04);
    g.fillStyle = '#2b4a3e'; g.fillRect(0, 0, W, H);
    rr(g, 120, 90, 1680, 760, 20); fillStroke(g, '#22473a', 14, '#6b4a3a');
    g.globalAlpha = .06; for (var i = 0; i < 20; i++) { g.fillStyle = '#fff'; g.fillRect(hash(i) * W, hash(i + 9) * H, 300, 4); } g.globalAlpha = 1;
    function chalk(sx, x, y, px, t0, t1, col, align) {
      if (t < t0) return; var k = seg(t, t0, t1); font(g, px, 700, SERIF.replace('"', '"')); g.font = 'italic 400 ' + px + 'px ' + SERIF;
      var w = g.measureText(sx).width, x0 = align === 'left' ? x : x - w / 2;
      g.save(); g.beginPath(); g.rect(x0 - 10, y - px, w * k + 10, px * 2); g.clip(); g.fillStyle = col || CREAM; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(sx, x0, y); g.restore();
      if (k < 1 && k > 0) { circ(g, x0 + w * k, y + px * .2, 8); g.fillStyle = '#fff'; g.fill(); }
    }
    chalk('570 cables  ÷  25 ships', 960, 230, 120, at('math1', '570') - .2, wend('math1', 'ships') + .1);
    chalk('≈ 23 cables per ship', 960, 400, 110, at('math2', '23') - .4, wend('math2', 'ship'));
    chalk('23 × 2 weeks  =  46 weeks', 960, 570, 110, at('math3', 'two') - .3, at('math3', 'last'));
    chalk('almost a year', 960, 740, 130, at('math3', 'almost') - .1, wend('math3', 'year') + .1, YEL);
    if (t > wend('math3', 'year')) { g.save(); g.strokeStyle = YEL; g.lineWidth = 8; g.beginPath(); g.ellipse(960, 745, 420 * eo(seg(t, wend('math3', 'year'), wend('math3', 'year') + .5)), 90, -.02, 0, 6.283); g.stroke(); g.restore(); }
    g.restore();
    chip(g, 'ROUGH MATH: ONE BREAK PER CABLE, SHIPS WORKING NONSTOP', 960, 905, { px: 26, bg: INK, fg: CREAM, line: CREAM, lw: 2, s: pop(t, at('math3', 'even')), fam: MONO, wt: 600 });
    vignette(g, .4);
  }
  /* 28 · month one: Tonga took five weeks, 56 miles; now picture every cable */
  function sMonth(g, t, s) {
    var t3 = start('month3'), wide = eio(seg(t, t3 - .3, t3 + .5));
    g.save(); push(g, t, s, .05);
    g.fillStyle = '#2a3e5c'; g.fillRect(0, 0, W, H);
    if (wide < 1) {
      g.save(); g.globalAlpha = 1 - wide;
      var wk = Math.min(5, Math.floor(seg(t, at('month1', 'five') - .6, at('month1', 'weeks') + .2) * 5.99));
      for (var i = 0; i < 5; i++) { var k = i < wk ? 1 : 0; calendar(g, 330 + i * 150, 330, .62, 'WEEK', String(i + 1), pop(t, s.t0 + .4 + i * .12), -.06 + i * .03); if (k) cross(g, 330 + i * 150, 345, .9, 1, RED); }
      /* a spool unrolling 56 miles of cable */
      var u = eio(seg(t, at('month2', 'replace') - .2, wend('month2', 'cable') + .3));
      g.lineCap = 'round'; g.beginPath(); g.moveTo(330, 720); g.lineTo(330 + u * 1300, 720); g.strokeStyle = INK; g.lineWidth = 30; g.stroke(); g.strokeStyle = '#3b3550'; g.lineWidth = 20; g.stroke();
      g.save(); g.translate(330 + u * 1300, 690); g.rotate(u * 30); circ(g, 0, 0, 110); fillStroke(g, '#b57a3a', 8); circ(g, 0, 0, 70); fillStroke(g, '#3b3550', 6); circ(g, 0, 0, 22); fillStroke(g, '#b57a3a', 6); g.restore();
      for (i = 0; i <= 8; i++) { var tx = 330 + i * 1300 / 8; if (tx < 330 + u * 1300) { g.fillStyle = CREAM; g.fillRect(tx - 2, 750, 4, 24); txt(g, String(i * 7), tx, 800, 26, CREAM, { fam: MONO, wt: 700 }); } }
      if (u > .02) chip(g, Math.round(56 * u) + ' MILES OF NEW CABLE', 980, 590, { px: 46, bg: YEL, s: pop(t, at('month2', 'replace') - .1), rot: -.02, wide: true });
      chip(g, 'TONGA: 5 WEEKS', 1500, 200, { px: 48, bg: CREAM, s: pop(t, at('month1', 'tongas') - .1), rot: .03, wide: true });
      g.restore();
    }
    if (wide > 0) {
      g.save(); g.globalAlpha = wide;
      var z = lerp(1.25, 1, wide); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
      drawMap(g, M, t, { sea: '#18324f' }); drawCables(g, M, t, 1, { cut: function () { return 1; } });
      CAB.forEach(function (c, i) { var f = cabArc(M, c), p = f(.5), k = pop(t, t3 + .2 + hash(i) * 1.6); if (k > 0) { g.save(); g.translate(p[0], p[1] - 10); g.scale(k * .09, k * .09); shipHull(g, 0, 0, 1, '#c9473a', 0, { repair: true }); g.restore(); } });
      g.restore();
      chip(g, 'EVERY CABLE, ALL AT ONCE', 1100, 180, { px: 50, bg: RED, fg: '#fff', s: pop(t, at('month3', 'every') - .1), rot: -.02, wide: true });
    }
    g.restore();
    vignette(g, .4);
  }

  /* 29 · the end: the message arrives; the glass thread; a ship out there */
  function sEnd(g, t, s) {
    var t2 = start('end2'), t3 = start('end3');
    if (t < t2 - .2) {
      g.save(); push(g, t, s, .05, 900, 560);
      roomBG(g, t, .4); couch(g, 1200, 870, 1.05);
      var P = poseAt(t, [[s.t0, { hip: 58, lf: [-46, 0], rf: [46, 0], lh: [-20, -228], rh: [22, -226], look: [-.5, .8], mouth: 'smile' }], [at('end1', 'blink'), { eyes: 'happy', mouth: 'grin' }]]);
      guy(g, 1200, 860, 1.25, P, Object.assign({}, YOU, { hold: [null, function (g) { phone(g, -18, -12, .75, -.2, '#9ee6ff'); }] }), t);
      g.restore();
      chatPhone(g, 500, 520, 1.0, 1, t, ['Sam', 'LONDON'], [{ text: 'Landed yet?', side: 1, t: s.t0 - 1, status: function () { return ['Delivered ✓', MINT]; } }, { text: 'Just did! ✈', side: -1, t: at('end1', 'blink') - .1 }]);
    } else if (t < t3 - .2) {
      g.save(); push(g, t, { t0: t2 - .2, t1: t3 - .2 }, .1);
      seaBG(g, t, 800, { top: '#0f3553', bot: '#050f1d' });
      cableLine(g, -100, W + 100, 760, t, { w: 60, amp: 30, speed: 1400 });
      /* a cut-away window into the hose: the thread of glass */
      g.save(); g.translate(960, 760 + Math.sin(960 * .004) * 30); rr(g, -360, -22, 720, 44, 22); g.fillStyle = '#1a1830'; g.fill();
      g.beginPath(); g.moveTo(-360, 0); g.lineTo(360, 0); g.strokeStyle = 'rgba(143,233,255,.35)'; g.lineWidth = 4; g.stroke();
      for (var i = 0; i < 5; i++) { var px = ((t * 700 + i * 160) % 760) - 380; g.save(); g.shadowColor = LIGHT; g.shadowBlur = 16; g.fillStyle = '#eafcff'; g.fillRect(px, -3, 60, 6); g.restore(); }
      g.lineWidth = 5; g.strokeStyle = YEL; rr(g, -360, -22, 720, 44, 22); g.stroke(); g.restore();
      chip(g, 'A GLASS THREAD INSIDE A GARDEN HOSE', 960, 560, { px: 40, bg: CREAM, s: pop(t, at('end2', 'glass') - .1), rot: -.02, wide: true });
      g.restore();
    } else {
      g.save(); push(g, t, { t0: t3 - .2, t1: s.t1 }, .06);
      var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a2552'); bg.addColorStop(.6, '#e8806a'); bg.addColorStop(1, '#ffc27a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      circ(g, 1300, 620, 120); g.fillStyle = '#ffe0a0'; g.fill();
      waterSurface(g, 640, t, -100, W + 100, '#3a5f8a');
      shipHull(g, 1100 + (t - t3) * 25, 640, .7, '#c9473a', Math.sin(t * 1.3) * .02, { repair: true });
      g.restore();
      chip(g, 'RIGHT NOW', 520, 220, { px: 56, bg: YEL, s: pop(t, at('end3', 'right') - .1), rot: -.03, wide: true });
    }
    vignette(g, .4);
  }
  /* 30 · end card */
  function sCard(g, t, s) {
    g.save(); push(g, t, s, .04);
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#221d3a'); bg.addColorStop(1, '#3b2f5c'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    /* channel mark: a mouse pointer in a coral circle */
    var k = pop(t, s.t0 + .1);
    g.save(); g.translate(560, 420); g.scale(k, k); circ(g, 0, 0, 120); fillStroke(g, HOOD, 8);
    g.beginPath(); g.moveTo(-34, -60); g.lineTo(-34, 54); g.lineTo(-6, 28); g.lineTo(14, 72); g.lineTo(32, 64); g.lineTo(12, 20); g.lineTo(48, 18); g.closePath(); fillStroke(g, CREAM, 7); g.restore();
    txt(g, 'Tech, explained', 1080, 400, 110, CREAM, { wt: 900, wide: false, align: 'center' });
    var sb = pop(t, at('end4', 'subscribe') - .1), pressed = t > at('end4', 'subscribe') + .5;
    g.save(); g.translate(1080, 560); g.scale(sb * (pressed ? .96 : 1), sb * (pressed ? .96 : 1)); rr(g, -220, -50, 440, 100, 50); fillStroke(g, pressed ? '#4a4466' : RED, 6); txt(g, pressed ? 'SUBSCRIBED ✓' : 'SUBSCRIBE', 0, 4, 48, '#fff', { wt: 900, wide: true }); g.restore();
    var P = poseAt(t, [[s.t0, { rh: [110, -330], look: [.5, 0], mouth: 'grin' }], [at('end4', 'subscribe'), { rh: [180, -270], look: [1, -.1], eyes: 'happy' }], [at('end4', 'show'), { rh: [110, -340], lh: [-110, -340], look: [0, 0], mouth: 'grin' }]]);
    guy(g, 1650, 960, 1.15, P, YOU, t);
    txt(g, 'NEXT: HOW THE REST OF IT WORKS', 1080, 720, 34, 'rgba(244,237,224,.7)', { fam: MONO, wt: 700, ls: 3 });
    g.restore();
    vignette(g, .4);
  }

  /* YouTube thumbnail (1920×1080, saved at 1280×720): you, the two cut ends, three words */
  function thumb(g) {
    var t = 3.3; g.setTransform(1, 0, 0, 1, 0, 0);
    seaBG(g, t, 900, { top: '#14507a', bot: '#061428' });
    [[560, .5, 12], [680, .75, 16], [820, 1, 24]].forEach(function (r, i) { cableLine(g, -100, W + 100, r[0], t, { w: r[2], lit: 1, cut: 1240 + i * 120, gap: 120, droop: 60, ph: i, amp: 12 }); });
    spark(g, 1240, 560, .1, 0, 1.2); spark(g, 1360, 680, .12, 0, 1.4); spark(g, 1480, 820, .14, 0, 1.6);
    var P = Object.assign({}, BASE, { lh: [-150, -230], rh: [150, -230], eyes: 'wide', mouth: 'O', brow: 1, look: [.2, -.1] });
    guy(g, 520, 1160, 2.55, P, Object.assign({}, YOU, { helmet: true, hold: [function (g) { g.rotate(.5); cableEnd(g, t, -1); }, function (g) { g.rotate(-.5); cableEnd(g, t, 1); }] }), 0);
    g.save(); g.translate(1420, 300); g.rotate(-.04); txt(g, 'EVERY', 0, -120, 190, CREAM, { wt: 900, wide: true, outline: 26 }); txt(g, 'CABLE', 0, 70, 190, CREAM, { wt: 900, wide: true, outline: 26 }); g.restore();
    g.save(); g.translate(1420, 540); g.rotate(-.06); rr(g, -300, -110, 600, 220, 28); fillStroke(g, RED, 14); txt(g, 'CUT?', 0, 8, 190, '#fff', { wt: 900, wide: true }); g.restore();
    vignette(g, .35);
  }

  /* ---------- frame ---------- */
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = NIGHT; g.fillRect(0, 0, W, H);
    var i = sceneAt(t), s = SC[i];
    g.save(); wipe(g, t, s, i > 0 ? SC[i - 1] : null); g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    timeCards(g, t);
    captions(g, t);
    if (t > DUR - .5) { g.fillStyle = 'rgba(0,0,0,' + seg(t, DUR - .5, DUR) + ')'; g.fillRect(0, 0, W, H); }
    if (LIVE.grain && NOISE) { g.save(); g.globalAlpha = .045; g.globalCompositeOperation = 'overlay'; var ox = Math.floor(hash(Math.floor(t * 24)) * 256), oy = Math.floor(hash(Math.floor(t * 24) + 1) * 256); g.translate(-ox, -oy); g.fillStyle = g.createPattern(NOISE, 'repeat'); g.fillRect(0, 0, W + 256, H + 256); g.restore(); }
  }
  function TEXTS(t) {
    var out = [];
    CLOCKS.forEach(function (c, i) { if (t >= c.t && t < c.t + 2.4) out.push({ id: 'clock' + i, text: c.text }); });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function E(t, type, o) { EV.push(Object.assign({ t: t, type: type }, o || {})); }
  function initTimes() {
    var i;
    SNAPS = [at('open5', 'snaps'), at('open5', 'all') + .05, at('open5', 'them') + .05, at('open5', 'same'), at('open5', 'second')];
    SC.forEach(function (s) { if (s.clock) CLOCKS.push({ t: s.t0 + .45 - .05, text: s.clock }); });
    /* room */
    var tx = at('open1', 'text'), snd = wend('open1', 'yet') + .1;
    for (i = 0; i < 11; i++) E(tx + .1 + i * (snd - tx - .25) / 11, 'type');
    E(snd, 'whoosh'); E(start('open2') + .1, 'buzz'); E(at('open2', 'second') - .05, 'pop', { g: .7 });
    /* dive */
    E(start('open3') - .2, 'dive', { t1: start('open4') + .2 }); E(at('open3', 'atlantic'), 'splash'); E(at('open3', 'ocean'), 'pop', { g: .5 });
    E(at('open4', 'light') - .05, 'zip', { t1: at('open4', 'light') + .5 });
    /* snaps */
    SNAPS.forEach(function (tt, j) { E(tt, 'snapc', { g: j === 4 ? 1.3 : .8 }); });
    E(at('open5', 'all') - .05, 'stamp'); E(at('open5', 'same') - .05, 'stamp');
    ['minute', 'day', 'month'].forEach(function (w) { E(at('open6', w) - .08, 'pop', { g: .9 }); });
    /* title */
    ['what', 'if', 'every', 'undersea', 'internet', 'cable', 'was'].forEach(function (w) { E(at('title', w) - .06, 'tick', { g: .25 }); });
    E(at('title', 'cut') - .06, 'stamp', { big: true });
    /* map */
    for (i = 0; i < 24; i++) E(at('size2', 'cables') - .6 + i * .07, 'blip', { f: 700 + (i % 7) * 80, g: .03 });
    E(at('size2', 'more') - .2, 'pop', { g: .8 }); E(at('size3', 'over'), 'rise', { t1: wend('size3', 'miles') + .2 }); E(wend('size3', 'miles') + .2, 'ding1');
    var w0 = at('size4', 'wrap') - .2, w1 = wend('size4', '37') + .2; for (i = 0; i < 37; i++) E(w0 + (w1 - w0) * eo(i / 37) * .95, 'tick', { g: .12 });
    E(w1, 'ding');
    /* hose */
    E(at('hose1', 'garden') - .1, 'pop', { g: .8 }); E(start('hose2') - .2, 'whoosh'); E(at('hose2', 'glass') - .05, 'ding1', { f: 1 }); E(at('hose2', 'light'), 'zip', { t1: at('hose2', 'light') + .5 });
    /* sat */
    E(start('sat1'), 'blip', { f: 1200, g: .08 }); E(start('sat2') + .1, 'rise', { t1: start('sat2') + .9 }); E(at('sat2', 'percent') - .2, 'pop', { g: 1 }); E(start('sat3'), 'thump', { g: .4 });
    /* faults */
    for (i = 0; i < 20; i++) E(at('fault1', 'about') - .1 + i * (wend('fault1', 'year') - at('fault1', 'about')) / 20, 'tick', { g: .1 });
    E(at('fault2', 'fishing') + .9, 'snapc', { g: .7 }); E(at('fault2', 'anchors') - .6, 'chain', { t1: at('fault2', 'anchors') + .3 }); E(at('fault2', 'anchors') + .7, 'snapc', { g: .7 }); E(at('fault2', 'thirds') - .1, 'pop', { g: .8 });
    /* shark */
    E(start('fault3') - .05, 'pop', { g: .7 }); var bite = at('fault3', 'fish') - .2; for (i = 0; i < 4; i++) E(bite + i * .26, 'chomp'); E(at('fault3', 'zero') - .08, 'stamp', { big: true });
    /* route */
    E(at('route1', 'cut') + .1, 'snapc', { g: .6 }); E(at('route1', 'cut') + .4, 'whoosh'); for (i = 0; i < 6; i++) E(at('route2', 'nothing') - .05 + i * .12, 'snapc', { g: .4 }); E(at('route2', 'nothing') + .6, 'pop', { g: .6 });
    /* clocks */
    CLOCKS.forEach(function (c) { E(c.t - .02, 'stamp', { big: true }); for (var j2 = 1; j2 < 6; j2++) E(c.t + j2 * .2, 'tick', { g: .14 }); });
    /* sec */
    E(at('sec2', 'never'), 'buzzbad'); E(start('sec3') - .1, 'whoosh'); ['continent', 'road', 'gone'].forEach(function (w) { E(at('sec4', w) - .2, 'stamp', { small: true }); });
    /* min */
    E(at('min1', 'weird'), 'pop', { g: .7 }); E(at('min2', 'texts') - .1, 'blip', { f: 1300, g: .12 }); E(at('min2', 'texts') + .7, 'blip', { f: 1600, g: .12 }); E(at('min2', 'local') - .1, 'paper');
    E(at('min3', 'servers') - .1, 'pop', { g: .6 }); for (i = 0; i < 4; i++) E(at('min3', 'copies') + i * .15, 'blip', { f: 900 + i * 150, g: .08 }); E(at('min4', 'playing') - .1, 'ding1', { f: 1 });
    E(at('min5', 'forever') - .1, 'stamp', { small: true }); E(start('min6') - .3, 'whoosh'); E(at('min6', 'freezes'), 'glitch', { t1: at('min6', 'drops') }); E(at('min6', 'drops'), 'buzzbad');
    /* hour */
    E(at('hour2', 'declined'), 'buzzbad'); E(at('hour2', 'bank') - .1, 'pop', { g: .6 }); E(start('hour3') - .3, 'whoosh'); E(at('hour3', 'see'), 'glitch', { t1: at('hour3', 'see') + .6 }); E(start('hour4') - .3, 'whoosh');
    E(at('hour4', 'dark'), 'powerdown'); E(at('hour5', 'river') - .2, 'rush', { t1: end('hour5') + .3 }); E(at('hour5', 'straw') - .1, 'pop', { g: .8 });
    /* island */
    E(at('island2', 'one') - .1, 'pop', { g: .6 }); E(at('island2', 'cut') - .1, 'snapc', { g: .9 }); E(at('island2', 'cut') + .15, 'powerdown');
    /* history */
    E(at('day1', 'science') - .1, 'pop', { g: .7 }); E(at('day1', 'happened') - .1, 'stamp', { big: true }); E(start('hist1') - .1, 'paper', { g: 1.5 }); E(at('hist1', 'cuts'), 'snapc', { g: .5 }); E(at('hist1', '70') - .1, 'fall', { t1: at('hist1', '70') + .6 }); E(at('hist2', 'half') - .2, 'fall', { t1: at('hist2', 'half') + .5 });
    E(at('hist3', '2024') - .1, 'pop', { g: .6 }); E(at('hist3', 'dragged') - 1, 'chain', { t1: at('hist3', 'dragged') }); for (i = 0; i < 3; i++) E(at('hist3', 'cut') - .2 + i * .35, 'snapc', { g: .7 });
    E(at('hist4', 'volcano') - .2, 'boom'); E(at('hist4', 'snapped') - .1, 'snapc', { g: 1 }); E(at('hist5', 'handful') - .2, 'blip', { f: 1400, g: .1 });
    /* week + ship */
    E(at('week1', 'who') - .1, 'pop', { g: .7 }); for (i = 0; i < 30; i++) E(at('ship1', '20') - .2 + i * .05, 'blip', { f: 800 + (i % 5) * 90, g: .04 }); E(start('ship1'), 'horn');
    E(start('ship2') + .2, 'splash'); E(at('ship2', 'drags'), 'scrape', { t1: end('ship2') + .2 }); E(start('ship3') - .1, 'thump', { g: .6 }); E(start('ship3') + .1, 'rise', { t1: start('ship3') + 1.0 });
    for (i = 0; i < 10; i++) E(start('ship3') + 1.3 + i * .22, 'tick', { g: .2 }); E(at('ship3', 'hand') - .1, 'pop', { g: .7 });
    for (i = 0; i < 8; i++) E(at('ship4', 'eight') - .9 + i * .125, 'flip', { g: .6 }); E(at('ship4', 'eight') + .15, 'ding1');
    /* math: chalk */
    [['math1', '570', 'ships'], ['math2', '23', 'ship'], ['math3', 'two', 'last'], ['math3', 'almost', 'year']].forEach(function (c) { E(at(c[0], c[1]) - .2, 'chalk', { t1: wend(c[0], c[2]) }); });
    E(wend('math3', 'year') + .05, 'ding');
    /* month */
    for (i = 0; i < 5; i++) E(at('month1', 'five') - .6 + i * .2, 'stamp', { small: true }); E(at('month2', 'replace') - .2, 'tape', { t1: wend('month2', 'cable') + .3 });
    E(start('month3') - .3, 'whoosh'); for (i = 0; i < 24; i++) E(start('month3') + .2 + hash(i) * 1.6, 'blip', { f: 600 + (i % 6) * 70, g: .04 });
    /* end */
    E(at('end1', 'blink') - .1, 'blip', { f: 1500, g: .14 }); E(start('end2') - .2, 'dive', { t1: start('end2') + .6 }); E(at('end2', 'glass'), 'zip', { t1: at('end2', 'glass') + .6 });
    E(start('end3') - .2, 'whoosh'); E(at('end3', 'ship'), 'horn'); E(at('end4', 'subscribe') + .5, 'click'); E(at('end4', 'subscribe') + .55, 'ding');
    SC.forEach(function (s, j) { if (j && s.wipe !== 'none') E(s.t0 - .05, 'swish'); });
    EV.sort(function (a, b) { return a.t - b.t; });
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

  /* ---------- sound: foley cut to the word times; no music (Isac adds his own) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.1), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .16; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function tickS(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function blip(t, f, g) { var o = osc('sine', f, t, t + .12, 1, [[t, 0], [t + .004, g || .09], [t + .1, 0]], .3, clamp((f - 1100) / 1400, -1, 1)); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + .07); }
    function ding(t) { [76, 83, 88].forEach(function (m, j) { osc('sine', mtof(m), t + j * .04, t + 1.2, 1, [[t + j * .04, 0], [t + j * .04 + .005, .08], [t + 1.1, 0]], .5, (j - 1) * .4); }); }
    function ding1(t, hi) { osc('sine', mtof(hi ? 81 : 76), t, t + .7, 1, [[t, 0], [t + .005, .07], [t + .6, 0]], .4); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .26, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t - .12, t + .14, 900, 5200, .1, .02, 1.6); }
    function whoosh(t) { band(t - .15, t + .35, 500, 3800, .12, .02, 1.2); }
    function stampS(t, big, small) { thump(t, big ? .65 : small ? .32 : .45); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1500; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .45 : small ? .2 : .32], [t + .12, 0]]); tickS(t + .005, .18); }
    function paper(t, g) { g = g || 1; band(t - .03, t + .12, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .1, .08 * g); }
    function flip(t, g) { g = g || 1; band(t, t + .12, 2000, 5000, .08 * g, .02, 2, -.3); tickS(t + .1, .15 * g); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function click(t) { tickS(t, .5); thump(t, .3); tickS(t + .08, .25); }
    function rise(t, t1) { band(t, t1, 400, 1800, .03, .06, 3); }
    function zip(t, t1) { band(t, t1, 1500, 7000, .02, .07, 3); }
    function typeS(t) { tickS(t, .16 + rnd() * .08); osc('sine', 2400 + rnd() * 600, t, t + .02, 1, [[t, 0], [t + .001, .015], [t + .015, 0]]); }
    function buzz(t) { for (var k = 0; k < 2; k++) { var t0 = t + k * .22; osc('square', 180, t0, t0 + .14, 1, [[t0, 0], [t0 + .01, .03], [t0 + .12, .03], [t0 + .14, 0]], .05); } }
    function buzzbad(t) { osc('square', 110, t, t + .35, 1, [[t, 0], [t + .01, .05], [t + .3, .05], [t + .35, 0]], .05); osc('square', 117, t, t + .35, 1, [[t, 0], [t + .01, .045], [t + .3, .045], [t + .35, 0]], .05); }
    /* a cable snap: a crack, a low metallic twang, a fizz */
    function snapc(t, g) { g = g || 1; var o = bus(1, .25), n = noise(t, .08), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 2500; n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .002, .5 * g], [t + .06, 0]]); thump(t, .5 * g); var tw = osc('triangle', 220, t, t + .6, 1, [[t, 0], [t + .005, .06 * g], [t + .55, 0]], .4); tw.frequency.exponentialRampToValueAtTime(70, t + .5); band(t + .02, t + .35, 6000, 3000, .05 * g, .01, 2); }
    function splash(t) { band(t, t + .7, 2500, 600, .15, .02, .8); thump(t, .3); }
    function dive(t, t1) { band(t, t1, 2200, 250, .06, .03, 1.1); osc('sine', 90, t, t1 + .3, 1, [[t, 0], [t + .3, .05], [t1, .05], [t1 + .3, 0]], .2); }
    function chain(t, t1) { var n = Math.max(4, Math.floor((t1 - t) / .045)); for (var k = 0; k < n; k++) { var tt = t + k * (t1 - t) / n; osc('square', 1800 + rnd() * 900, tt, tt + .03, 1, [[tt, 0], [tt + .001, .02], [tt + .025, 0]], .2); tickS(tt, .12); } }
    function chomp(t) { thump(t, .35); band(t, t + .08, 900, 400, .1, .02, 2); }
    function glitch(t, t1) { var n = Math.floor((t1 - t) / .05); for (var k = 0; k < n; k++) { var tt = t + k * .05; if (rnd() < .6) osc('square', 300 + rnd() * 1500, tt, tt + .04, 1, [[tt, 0], [tt + .002, .025], [tt + .035, 0]]); } }
    function powerdown(t) { var o = osc('sawtooth', 220, t, t + .7, 1, [[t, 0], [t + .01, .05], [t + .65, 0]], .1); o.frequency.exponentialRampToValueAtTime(40, t + .6); }
    function rush(t, t1) { band(t, t1, 600, 900, .05, .06, .6); band(t, t1, 2500, 3000, .02, .03, 1); }
    function boom(t) { var o = osc('sine', 70, t, t + 2.2, 1, [[t, 0], [t + .02, .5], [t + 2, 0]], .3); o.frequency.exponentialRampToValueAtTime(30, t + 1.5); band(t, t + 1.8, 400, 120, .2, .02, .5); }
    function horn(t) { [0, 1].forEach(function (k) { osc('sawtooth', k ? 98 : 73, t, t + 1.3, 1, [[t, 0], [t + .15, .025], [t + 1.1, .025], [t + 1.3, 0]], .35, k ? .2 : -.2); }); }
    function scrape(t, t1) { var n = Math.max(3, Math.floor((t1 - t) / .08)); for (var k = 0; k < n; k++) band(t + k * (t1 - t) / n, t + k * (t1 - t) / n + .1, 300 + rnd() * 300, 500, .05, .03, 2, .1); }
    function fall(t, t1) { var o = osc('sine', 900, t, t1 + .1, 1, [[t, 0], [t + .02, .05], [t1, .03], [t1 + .1, 0]], .2); o.frequency.exponentialRampToValueAtTime(260, t1); }
    function chalk(t, t1) { var n = Math.max(3, Math.floor((t1 - t) / .07)); for (var k = 0; k < n; k++) { var tt = t + k * (t1 - t) / n + rnd() * .02; band(tt, tt + .06, 3000 + rnd() * 2000, 4500, .035, .02, 3, .1); } }
    function tape(t, t1) { var n = Math.max(3, Math.floor((t1 - t) / .05)); for (var k = 0; k < n; k++) tickS(t + k * (t1 - t) / n, .1); band(t, t1, 1200, 2400, .03, .02, 2); }
    var MAP = { tick: function (e) { tickS(e.t, e.g); }, blip: function (e) { blip(e.t, e.f, e.g); }, ding: function (e) { ding(e.t); }, ding1: function (e) { ding1(e.t, e.f); }, thump: function (e) { thump(e.t, e.g); }, swish: function (e) { swish(e.t); }, whoosh: function (e) { whoosh(e.t); }, stamp: function (e) { stampS(e.t, e.big, e.small); }, paper: function (e) { paper(e.t, e.g); }, flip: function (e) { flip(e.t, e.g); }, pop: function (e) { popS(e.t, e.g); }, click: function (e) { click(e.t); }, rise: function (e) { rise(e.t, e.t1); }, zip: function (e) { zip(e.t, e.t1); }, type: function (e) { typeS(e.t); }, buzz: function (e) { buzz(e.t); }, buzzbad: function (e) { buzzbad(e.t); }, snapc: function (e) { snapc(e.t, e.g); }, splash: function (e) { splash(e.t); }, dive: function (e) { dive(e.t, e.t1); }, chain: function (e) { chain(e.t, e.t1); }, chomp: function (e) { chomp(e.t); }, glitch: function (e) { glitch(e.t, e.t1); }, powerdown: function (e) { powerdown(e.t); }, rush: function (e) { rush(e.t, e.t1); }, boom: function (e) { boom(e.t); }, horn: function (e) { horn(e.t); }, scrape: function (e) { scrape(e.t, e.t1); }, fall: function (e) { fall(e.t, e.t1); }, chalk: function (e) { chalk(e.t, e.t1); }, tape: function (e) { tape(e.t, e.t1); } };
    EV.forEach(function (e) { if (MAP[e.type]) MAP[e.type](e); });
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −50 dB, so the gaps are never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5; var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .021; })();
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 84px Archivo', '800 46px Archivo', '700 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"', 'italic 400 96px "Instrument Serif"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×÷−≈≠µ“”·→…✓✈'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  initTimes();
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: end('title') + .3, SLUG: 'cables', SHOTS: SHOTS, CHAPTERS: CHAPTERS, thumb: function () { thumb(ctx); }, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
