/* "Password" — how long your password takes to crack. Factory #11 on Tech, explained, after ../temperature/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the growing password field and its crack-time stamp: each typed letter re-slaps the stamp to Hive
   Systems' own 2026 table cell, written exactly as the table prints it (2 weeks, 1 year, 32 years, 839 years, 21k years).
   Defensive only: no tools, commands, wordlists or techniques anywhere. P@ssw0rd! is a generic example; the breach pile
   is blank grey bars. Everything is hand-built. Facts and sources: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', DIM = 'rgba(244,237,224,.5)';
  var HOT = '#ff5b3d', GREEN = '#58b56f';
  var PAPER = '#f1e9d8', INK = '#211d26', GREY = '#cfc6b4';
  var BODY2 = '#3d3849', SCREEN = '#1b1a21', METAL = '#bdb6a8';
  var DISP = 'Archivo', MONO = '"Geist Mono"';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .85); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .85), 0, 1.04); }
  function fin(t, a, f) { return clamp(sp(t, a, f || 3) * 2, 0, 1); }
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }
  function kn(t, a) { return 1 + Math.max(0, knock(t, a, 16, 6)) * .08; }
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function mixC(a, b, k) {
    function h(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
    var A = h(a), B = h(b); return 'rgb(' + Math.round(lerp(A[0], B[0], k)) + ',' + Math.round(lerp(A[1], B[1], k)) + ',' + Math.round(lerp(A[2], B[2], k)) + ')';
  }
  /* the renderer samples each frame at (i + .5) / fps: anything that shows a changing number or letter count is held to
     its frame's centre, so motion blur never mixes two values */
  function qt(t) { return (Math.floor(t * 30) + .5) / 30; }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function wend(id, word, nth) { return find(id, word, nth).t1; }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  /* scenes. swipe:true = the next scene comes in under the torn edge */
  var SWIPE = .44, PRE = .3;
  var SC = [
    { id: 'hook', fn: 'hook', name: 'P@ssw0rd!', t0: 0 },
    { id: 'breach', fn: 'pile', name: '100,000+ times', t0: start('breach') - .05, swipe: true, live: true },
    { id: 'random', fn: 'ladder', name: 'Length', t0: start('random') - .05, swipe: true },
    { id: 'nist', fn: 'nist', name: 'NIST', t0: start('nist') + 1.1, swipe: true },
    { id: 'mfa', fn: 'phone', name: 'Two-step', t0: start('mfa') + .05, swipe: true }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = end('end') + .25;

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- the safe-area check: every glyph box drawn on the film canvas is measured (window.BOUNDS_RUN) ---------- */
  var BOUNDS = null, INCOMING = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || INCOMING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys);
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
  }
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS) { var mm = this.measureText(str); recBox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent, str); }
      return orig.apply(this, arguments);
    };
  }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt, o.fam); if (o.wd) wide(g); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw + pad * 2 > o.maxw && px > 30) { px -= 2; font(g, px, o.wt, o.fam); if (o.wd) wide(g); tw = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, px, o.wt, o.fam); if (o.wd) wide(g);
    g.fillText(text, 0, px * .04); g.restore(); ls(g, 0);
    return w;
  }
  function label(g, text, x, y, a, col, px, align, plate, maxw) {
    px = Math.max(30, px || 36);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); ls(g, 2); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    while (g.measureText(text).width > (maxw || 780) && px > 24) { px--; font(g, px, 500, MONO); }
    if (g.measureText(text).width > (maxw || 780)) ls(g, 0);
    var dy = (1 - Math.min(1, a)) * 14;
    if (plate) {
      var w = g.measureText(text).width, x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
      rr(g, x0 - 16, y - px * .78 + dy, w + 32, px * 1.56, 12); g.fillStyle = 'rgba(21,19,27,.92)'; g.fill();
    }
    g.fillStyle = col || CREAM;
    g.fillText(text, x, y + dy); g.restore(); ls(g, 0);
  }
  function block(g, lines, x, y, px, a, plate, col, wt, fam) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 500, fam || MONO); ls(g, 0); g.textAlign = 'center'; g.textBaseline = 'middle';
    var lh = px * 1.3, w = 0; lines.forEach(function (l) { w = Math.max(w, g.measureText(l).width); });
    var y0 = y - (lines.length - 1) * lh / 2;
    if (plate) { rr(g, x - w / 2 - 22, y0 - lh / 2 - 8, w + 44, lh * lines.length + 16, 14); g.fillStyle = 'rgba(21,19,27,.94)'; g.fill(); if (plate === 'line') { g.strokeStyle = CREAM; g.lineWidth = 3; g.stroke(); } }
    g.fillStyle = col || CREAM; lines.forEach(function (l, i) { g.fillText(l, x, y0 + i * lh); });
    g.restore();
  }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  function tag(g, text, x, y, a, rot, px) { chip(g, text, x, y, { px: px || 32, wt: 700, fam: MONO, line: HOT, lw: 4, fg: HOT, a: a, rot: rot == null ? .03 : rot, shadow: false, bg: 'rgba(21,19,27,.88)' }); }
  /* credits and sources never show in the incoming scene under the tear: they appear once it has covered the old one */
  function cred(a) { return INCOMING ? 0 : a; }

  /* ---------- rubber stamps: worn ink (seeded speckle), slammed ---------- */
  var STEX = {};
  function stampTex(text, col, px) {
    var key = text + col + px; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900); ls(m, 2);
    var lw = m.measureText(text).width, pad = px * .45, h = px * 1.25, w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .03); rr(g, px * .14, px * .14, w - px * .28, h - px * .28, px * .08); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, px, 900); ls(g, 2); g.fillText(text, w / 2, h / 2 + px * .05);
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 140);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.9, 0, 6.283); g.fill(); }
    c.w = w + 16; c.h = h + 16; STEX[key] = c; return c;
  }
  /* a stamp from t0 (slammed in) to t1 (lifted off over 0.25 s); bare = no paper backing */
  function stamp(g, text, x, y, t, t0, t1, px, col, rot, bare) {
    if (t < t0 || t > t1 + .25) return;
    var c = stampTex(text, col, px);
    var k = sp(t, t0, 3.2, .8), s = lerp(1.35, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (1 - seg(t, t1, t1 + .25));
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.08 : rot); g.scale(s, s);
    if (k >= 1) recBox(g, -c.w / 2 - 14, -c.h / 2 - 4, c.w / 2 - 6, c.h / 2 + 4, text);
    if (!bare) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-c.w / 2 - 4, -c.h / 2 + 10, c.w + 8, c.h);
      g.fillStyle = PAPER; g.fillRect(-c.w / 2 - 14, -c.h / 2 - 4, c.w + 8, c.h + 8); }
    g.drawImage(c, -c.w / 2 - 10, -c.h / 2); g.restore();
  }

  /* ---------- the hero props ---------- */
  /* a paper password field: x0..x0+w, y0..y0+h */
  function field(g, x0, y0, w, h, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    rr(g, x0 + 10, y0 + 16, w, h, 26); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, x0, y0, w, h, 26); g.fillStyle = PAPER; g.fill();
    rr(g, x0 + 10, y0 + 10, w - 20, h - 20, 18); g.strokeStyle = 'rgba(33,29,38,.16)'; g.lineWidth = 3; g.stroke();
    g.restore();
  }
  /* a paper padlock, body centre-top at (x, y); open 0..1 lifts the shackle and swings it 42° about its left leg */
  function padlock(g, x, y, s, open, a, word) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s);
    var bw = 330, bh = 230, lx = -100, rx = 100;
    /* shackle */
    g.save(); g.translate(lx, 0); g.translate(0, -open * 30); g.rotate(-open * .74); g.translate(-lx, 0);
    g.lineCap = 'butt'; g.lineWidth = 46; g.strokeStyle = 'rgba(0,0,0,.35)';
    g.beginPath(); g.moveTo(lx + 8, 30); g.lineTo(lx + 8, -78); g.arc(8, -78, rx, Math.PI, 0); g.lineTo(rx + 8, 30); g.stroke();
    g.strokeStyle = METAL; g.beginPath(); g.moveTo(lx, 24); g.lineTo(lx, -86); g.arc(0, -86, rx, Math.PI, 0); g.lineTo(rx, 24); g.stroke();
    g.lineWidth = 8; g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(lx - 12, 10); g.lineTo(lx - 12, -86); g.arc(0, -86, rx - 12 + 0, Math.PI, Math.PI * 1.35); g.stroke();
    g.restore();
    /* body */
    rr(g, -bw / 2 + 12, 18, bw, bh, 36); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -bw / 2, 0, bw, bh, 36); g.fillStyle = PAPER; g.fill();
    g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(-bw / 2 + 20, bh - 26, bw - 40, 8);
    if (word) {
      font(g, 46, 900); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(word, 0, bh / 2 + 54);
      g.fillStyle = INK; el(g, 0, bh / 2 - 34, 22, 22); g.beginPath(); g.moveTo(-12, bh / 2 - 24); g.lineTo(12, bh / 2 - 24); g.lineTo(18, bh / 2 + 14); g.lineTo(-18, bh / 2 + 14); g.closePath(); g.fill();
    } else {
      g.fillStyle = INK; el(g, 0, bh / 2 - 14, 26, 26); g.beginPath(); g.moveTo(-14, bh / 2 - 2); g.lineTo(14, bh / 2 - 2); g.lineTo(22, bh / 2 + 52); g.lineTo(-22, bh / 2 + 52); g.closePath(); g.fill();
    }
    g.restore();
  }
  function tick(g, x, y, r, s, col) {
    if (s <= 0) return;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 5, 8, r, r);
    g.fillStyle = col || GREEN; el(g, 0, 0, r, r);
    g.strokeStyle = CREAM; g.lineWidth = r * .2; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-r * .42, r * .02); g.lineTo(-r * .1, r * .34); g.lineTo(r * .46, -r * .3); g.stroke();
    g.restore();
  }
  function cross(g, x, y, r, s) {
    if (s <= 0) return;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = HOT; el(g, 0, 0, r, r);
    g.strokeStyle = BG; g.lineWidth = r * .2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-r * .35, -r * .35); g.lineTo(r * .35, r * .35); g.moveTo(r * .35, -r * .35); g.lineTo(-r * .35, r * .35); g.stroke();
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · hook + ask + rules: one big paper password field reading P@ssw0rd!, a strength meter that says STRONG,
     three green ticks and a closed paper padlock. Frame 0: P@ssw0rd! · STRONG (2 words), the meter full and green. On "instantly" the
     INSTANTLY stamp slams, STRONG is struck, the padlock springs open, and Hive's condition comes in with it.
     ===================================================================================================== */
  var PW = 'P@ssw0rd!', FLD = { x: 110, y: 470, w: 800, h: 220 };
  var TX = [270, 510, 750], TY = 830;
  function crackT() { return at('hook', 'instantly') - .06; }
  function hookParts(g, t, idle) {
    var ck = crackT(), rl = start('rules') - .12, cap = at('rules', 'capital'), num = at('rules', 'number'), sym = at('rules', 'symbol');
    var cracked = !idle && t >= ck;
    /* label + field */
    var sh = cracked ? knock(t, ck, 40, 9) * 10 : 0;
    g.save(); g.translate(sh, 0);
    field(g, FLD.x, FLD.y, FLD.w, FLD.h, 1);
    font(g, 124, 600, MONO); ls(g, 0); g.textAlign = 'left'; g.textBaseline = 'middle';
    var tw = g.measureText(PW).width, x0 = CX - tw / 2, cw = tw / PW.length;
    /* the rule each character ticks: P capital, 0 number, @ and ! symbols, lit on its word */
    var hl = [[0, cap], [5, num], [1, sym], [8, sym]];
    hl.forEach(function (h) { if (idle) return; var k = fin(t, h[1] - .05) * (1 - .6 * seg(t, h[1] + .5, h[1] + .8)) * (1 - seg(t, start('breach') - .6, start('breach') - .3)); if (k > 0) { g.save(); g.globalAlpha *= k; g.fillStyle = 'rgba(88,181,111,.32)'; rr(g, x0 + h[0] * cw - 4, FLD.y + 34, cw + 8, 140, 12); g.fill(); g.fillStyle = GREEN; g.fillRect(x0 + h[0] * cw + 4, FLD.y + 168, cw - 8, 8); g.restore(); } });
    g.fillStyle = INK; g.fillText(PW, x0, FLD.y + 102);
    if (Math.floor((t + 10) * 2.2) % 2 === 0) { g.fillStyle = HOT; g.fillRect(x0 + tw + 10, FLD.y + 52, 7, 100); }
    g.restore();
    /* the strength meter: held full and green under STRONG from frame 0; it crashes to coral only with the INSTANTLY stamp */
    var fill = 1, drain = cracked ? eio(seg(t, ck + .02, ck + .3)) : 0, fcol = drain > 0 ? mixC('#58b56f', '#ff5b3d', Math.min(1, drain * 3)) : GREEN;
    var mx = FLD.x, my = 740, mw = 470;
    rr(g, mx, my, mw, 26, 13); g.fillStyle = 'rgba(244,237,224,.16)'; g.fill();
    rr(g, mx, my, Math.max(26, mw * fill * (1 - drain * .9)), 26, 13); g.fillStyle = fcol; g.fill();
    for (var i = 1; i < 4; i++) { g.fillStyle = BG; g.fillRect(mx + mw * i / 4 - 3, my, 6, 26); }
    font(g, 52, 900); wide(g); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = drain > 0 ? mixC('#58b56f', '#f4ede0', drain) : GREEN;
    var stx = mx + mw + 30; g.fillText('STRONG', stx, my + 14);
    var sw = g.measureText('STRONG').width;
    if (drain > 0) { g.strokeStyle = HOT; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(stx - 8, my + 16); g.lineTo(stx - 8 + (sw + 16) * eio(seg(t, ck + .02, ck + .25)), my + 12); g.stroke(); }
    /* three ticks: icons only on frame 0; CAPITAL / NUMBER / SYMBOL land on their words */
    var tk = [-.2, .08, .2];
    TX.forEach(function (x, i) {
      var s = idle ? (i === 0 ? 1 : clamp(pop(t, tk[i], 3.4, .7), 0, 1.06)) : clamp(pop(t, tk[i], 3.4, .7), 0, 1.06);
      tick(g, x, TY, 38, s * kn(t, [cap, num, sym][i] - .05));
    });
    if (!idle) ['CAPITAL', 'NUMBER', 'SYMBOL'].forEach(function (w, i) {
      var a = fin(t, GT.labels) * (1 - seg(t, start('breach') - .6, start('breach') - .35));
      chip(g, w, TX[i], 902, { px: 38, wt: 900, bg: CREAM, fg: BG, a: a, s: kn(t, [cap, num, sym][i]), maxw: 230 });
    });
    /* the padlock: closed on frame 0, springs open on "instantly" */
    var op = !idle && t >= GT.lock - .03 ? clamp(sp(t, GT.lock - .03, 2.6, .55), 0, 1.15) : 0;
    var shk = cracked ? eio(seg(t, ck + .02, ck + .4)) : 0;
    /* two P@ssw0rd! slips slide in under the lock: the breach pile starts here */
    if (!idle) HSLIP.forEach(function (p) { var k = eio(seg(t, p[3], p[3] + .3)); if (k > 0) pwSlip(g, p[0] - (1 - k) * 120, p[1], 560, PILE.h, p[2], k, 1); });
    padlock(g, CX, lerp(1150, 1222, shk) + Math.sin(t * 1.6) * 3, lerp(1.2, .82, shk), op, 1);
    if (!idle) stopwatch(g, 790, 1262, t);
    if (cracked) { var ki = kn(t, GT.lock), iy = FLD.y + 205; g.save(); g.translate(CX + 60, iy); g.scale(ki, ki); g.translate(-CX - 60, -iy); stamp(g, 'INSTANTLY', CX + 60, iy, t, ck, rl, 72, HOT, -.06); g.restore(); }
    if (cracked) {
      /* Hive's condition for "Instantly", beside the claim, in big type */
      var ca = fin(t, ck + .3) * (1 - seg(t, rl, rl + .2));
      chip(g, "IF IT'S BEEN LEAKED BEFORE", CX, 904, { px: 46, wt: 900, bg: CREAM, fg: BG, a: ca, maxw: 800 });
      label(g, 'HIVE SYSTEMS 2026 TABLE', CX, 962, ca, CREAM, 34);
    }
  }
  var HSLIP = [[452, 1380, -.018, 3.35], [478, 1410, .014, 3.62]];
  /* a coral stopwatch: slaps in on "how long", its hand races, then stops dead at 0:00 in the pause (with the thump) */
  function stopwatch(g, x, y, t) {
    var ta = at('ask', 'how') - .05, ts = GT.sw;
    if (t < ta) return;
    var k = clamp(sp(t, ta, 3.2, .7), 0, 1.06), s = lerp(1.3, 1, clamp(k, 0, 1)) * kn(t, ts), r = 92;
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.translate(x, y); g.rotate(.06); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.38)'; el(g, 8, 12, r, r);
    g.fillStyle = HOT; rr(g, -16, -r - 34, 32, 30, 6); g.fill(); rr(g, -30, -r - 46, 60, 18, 8); g.fill();
    g.save(); g.rotate(.7); rr(g, -10, -r - 20, 20, 22, 5); g.fill(); g.restore();
    el(g, 0, 0, r, r); g.fillStyle = PAPER; el(g, 0, 0, r - 14, r - 14);
    g.fillStyle = INK; for (var i = 0; i < 12; i++) { g.save(); g.rotate(i * Math.PI / 6); g.fillRect(-2.5, -(r - 20), 5, i % 3 ? 9 : 16); g.restore(); }
    var ang = t < ts ? (t - ta) * 15 : knock(t, ts, 30, 9) * .12;
    g.save(); g.rotate(ang); g.strokeStyle = HOT; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 12); g.lineTo(0, -(r - 26)); g.stroke(); g.restore();
    g.fillStyle = INK; el(g, 0, 0, 9, 9);
    font(g, 40, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
    if (t >= ts) { g.fillStyle = INK; g.fillText('0:00', 0, 40); }
    g.restore();
  }
  var HEAD = ['HOW LONG TO CRACK', 'A PASSWORD?'], HEADT = 1.2;
  function headline(g, t) {
    var a = fin(t, HEADT) * (1 - seg(t, start('rules') - .2, start('rules') - .04));
    if (a <= 0) return;
    var k = clamp(spring(t - HEADT, 3.2, .85), 0, 1.04);
    g.save(); g.globalAlpha *= a;
    var px = 70; font(g, px, 900); wide(g); g.textAlign = 'center'; g.textBaseline = 'middle';
    HEAD.forEach(function (l) { while (g.measureText(l).width > 800 && px > 52) { px -= 2; font(g, px, 900); wide(g); } });
    HEAD.forEach(function (l, i) {
      var y = 350 + i * px * 1.08 + (1 - Math.min(1, k)) * 30;
      if (i === 0 && t >= at('ask', 'how') - .03 && t < wend('ask', 'long') + .2) {
        var wd = g.measureText('HOW LONG').width, x0 = CX - g.measureText(l).width / 2;
        g.fillStyle = HOT; rr(g, x0 - 10, y - px * .6, wd + 20, px * 1.2, 14); g.fill();
      }
      g.fillStyle = CREAM; g.fillText(l, CX, y);
    });
    g.restore();
  }
  function hookScene(g, t) {
    hookParts(g, t, false);
    tag(g, 'EXAMPLE', 840, FLD.y - 2, fin(t, crackT() + .3), .04);
  }
  function hookIdle(g, ti) { hookParts(g, ti, true); }

  /* =====================================================================================================
     SCENE 2 · breach + first: P@ssw0rd! slips (blank grey bars, no real data) rain onto a pile; the counter rolls in
     round units to 100,000+ TIMES IN DATA BREACHES. Then the top slip is tried first: INSTANTLY, with Hive's condition.
     ===================================================================================================== */
  var NSLIP = 11, PILE = { y: 1318, dy: 44, w: 700, h: 58 };
  var SJ = (function () { var r = mulberry(19), o = []; for (var i = 0; i < NSLIP; i++) o.push([(r() - .5) * 46, (r() - .5) * .05, r()]); return o; })();
  function slipLand(i) {
    var a = S('breach').t0 - .2, b = at('breach', 'times') - .1;
    return a + (b - a) * Math.pow(i / (NSLIP - 1), 1.4);
  }
  function pwSlip(g, x, y, w, h, rot, a, s) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot); g.scale(s || 1, s || 1);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
    g.fillStyle = PAPER; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = 'rgba(33,29,38,.2)'; g.fillRect(-w / 2, h / 2 - 3, w, 3);
    var ty = h > 60 ? 3 : 14; font(g, h > 60 ? 40 : 32, 600, MONO); ls(g, 0); g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(PW, -w / 2 + 26, ty);
    g.fillStyle = GREY; rr(g, -w / 2 + 280, ty - 9, 170, 18, 9); g.fill(); rr(g, -w / 2 + 470, ty - 9, w - 500, 18, 9); g.fill();
    g.restore();
  }
  function pileScene(g, t) {
    var s0 = S('breach').t0, tr = at('first', 'tried'), ins = at('first', 'instantly'), lk = at('first', 'leaked');
    /* the pile */
    for (var i = 0; i < NSLIP; i++) {
      var tl = slipLand(i); if (t < tl - .28) continue;
      var k = seg(t, tl - .28, tl), y1 = PILE.y - i * PILE.dy, y = lerp(y1 - 140, y1, k * k), sq = 1 + Math.max(0, knock(t, tl, 24, 10)) * .04;
      var x = CX + SJ[i][0], rot = SJ[i][1] * (1 - k * .4) + (1 - k) * (SJ[i][2] - .5) * .5;
      if (i === NSLIP - 1 && t >= at('first', 'passwords') - .12) {
        /* the top slip is pulled out and tried first */
        var lf = clamp(sp(t, at('first', 'passwords') - .12, 2.4, .8), 0, 1.03);
        x = lerp(x, CX, lf); y = lerp(y1, 852, lf); rot = lerp(rot, -.015, lf);
        pwSlip(g, x, y, PILE.w, PILE.h, rot, 1, lerp(1, 1.1, lf) * kn(t, ins - .05));
        continue;
      }
      pwSlip(g, x, y, PILE.w, PILE.h, rot, clamp(k * 2.5, 0, 1), sq);
    }
    /* the counter: rolls in round 10,000s while the voice says "data breaches", lands on 100,000+ */
    var r0 = at('breach', 'shown'), r1 = at('breach', 'over') + .1, q = qt(t);
    var n = Math.max(1, Math.floor(seg(q, r0, r1) * 10 + 1e-6)), done = q >= r1;
    var shr = eio(seg(t, at('breach', 'times') - .05, at('breach', 'times') + .35));
    var ca = fin(t, slipLand(0) - .02);
    if (ca > 0) {
      var txt = (n * 10000).toLocaleString('en-US') + (done ? '+' : '');
      g.save(); g.globalAlpha *= ca;
      g.translate(CX, lerp(565, 504, shr)); var sc = lerp(1, .6, shr) * kn(t, r1); g.scale(sc, sc);
      font(g, 150, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = HOT; g.fillText(txt, 0, 6);
      g.restore();
      g.save(); g.globalAlpha *= fin(t, at('breach', 'data') - .1);
      g.translate(CX, lerp(682, 568, shr)); g.scale(lerp(1, .8, shr), lerp(1, .8, shr));
      var px2 = 58; do { font(g, px2, 900); wide(g); px2 -= 2; } while (g.measureText('TIMES IN DATA BREACHES').width > 780 && px2 > 30);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('TIMES IN DATA BREACHES', 0, 0);
      g.restore();
    }
    /* first: TRIED FIRST on the pulled slip, then INSTANTLY with Hive's condition in big type */
    chip(g, 'TRIED FIRST', 748, 852, { px: 44, wt: 900, bg: CREAM, fg: BG, a: fin(t, at('first', 'passwords') + .1), s: kn(t, at('first', 'first')), rot: .04 });
    stamp(g, 'INSTANTLY', 324, 856, t, GT.slip - .01, DUR, 52, HOT, -.07);
    var cn = fin(t, at('breach', 'times') + .15);
    chip(g, 'HIVE SYSTEMS 2026: "INSTANTLY"', CX, 638, { px: 46, wt: 900, bg: CREAM, fg: BG, a: cn, s: kn(t, GT.cond), maxw: 800 });
    block(g, ['IF IT LEAKED OR USES', 'DICTIONARY WORDS'], CX, 734, 42, cn, false, CREAM, 800, DISP);
    /* the source, once the tear has covered the last scene */
    block(g, ['HAVE I BEEN PWNED', '119,515 TIMES · OCT 27, 2026'], CX, 1398, 32, cred(fin(t, s0 + .1)), false, CREAM, 600);
  }

  /* =====================================================================================================
     SCENE 3 · the ladder: one random password field grows letter by letter; the crack-time stamp re-slaps to Hive's
     own 2026 table cell (random lowercase letters); the rig of 16 card slots guesses under it; then six random words.
     ===================================================================================================== */
  var RAND = 'qxvmtrbekwfz', WORDS6 = ['cobalt walrus rumble', 'tiara skillet morse'];   /* all six on EFF's long list */
  /* letters typed: 8 during "random ones get guessed", the 9th on "extra", 10–12 on "twelve", "letters", "21,000" */
  function letterTimes() {
    var s0 = S('random').t0 + .1, o = [];
    for (var i = 0; i < 8; i++) o.push(s0 + .12 + i * .09);
    o.push(GT.ninth);
    o.push(at('twelve', 'twelve') - .06, at('twelve', 'letters') - .02, at('twelve', 'letters') + .28);
    return o;
  }
  var CELLS = ['2 WEEKS', '1 YEAR', '32 YEARS', '839 YEARS', '21K YEARS'];
  function ladderState(t) {
    var lt = letterTimes(), n = 0; lt.forEach(function (x) { if (t >= x) n++; });
    return n;
  }
  /* the rig: 16 gaming GPUs; it heats up (panel and label turn coral) when the stamp reaches 21K YEARS */
  function rig(g, x0, y0, w, h, t, a, heat) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    rr(g, x0 + 10, y0 + 16, w, h, 22); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, x0, y0, w, h, 22); g.fillStyle = mixC('#3d3849', '#6e2c26', heat); g.fill();
    var tg = at('random', 'guessed') - .3, ang = t * 1.2 + 16 * Math.max(0, t - tg) + 10 * Math.max(0, t - GT.hot);
    var cols = 8, rows = 2, pad = 18, gap = 10, cw = (w - pad * 2 - gap * (cols - 1)) / cols, ch = (h - pad * 2 - gap) / rows;
    var fl = mulberry(Math.floor(t * 12) + 3);
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var x = x0 + pad + c * (cw + gap), y = y0 + pad + r * (ch + gap);
      rr(g, x, y, cw, ch, 10); g.fillStyle = mixC('#2a2633', '#4a201c', heat); g.fill();
      var fx = x + cw / 2, fy = y + ch / 2 - 6, fr = Math.min(cw, ch) * .36;
      g.fillStyle = '#16141b'; el(g, fx, fy, fr, fr);
      g.save(); g.translate(fx, fy); g.rotate(ang + (r * 8 + c) * .7); g.fillStyle = METAL;
      for (var b = 0; b < 5; b++) { g.rotate(Math.PI * 2 / 5); g.beginPath(); g.ellipse(fr * .5, 0, fr * .45, fr * .16, .5, 0, 6.283); g.fill(); }
      g.fillStyle = '#4a4458'; el(g, 0, 0, fr * .22, fr * .22); g.restore();
      var on = heat > .5 || (t > tg ? fl() > .3 : fl() > .8);
      g.fillStyle = on ? HOT : 'rgba(255,91,61,.25)'; g.fillRect(x + 12, y + ch - 14, cw - 24, 6);
    }
    g.restore();
  }
  /* the ladder card: Hive's two cells and our six-word line, held through the screenshot moment */
  function ladderCard(g, t, w0) {
    var a = fin(t, w0), k = clamp(sp(t, w0, 2.8, .8), 0, 1.04);
    if (a <= 0) return;
    var x0 = FLD.x, y0 = 856, w = 800, h = 350, rows = [['8 LETTERS', '2 WEEKS'], ['12 LETTERS', '21K YEARS'], ['6 RANDOM WORDS', '']];
    g.save(); g.globalAlpha *= a; g.translate(0, (1 - Math.min(1, k)) * 50);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(x0 + 12, y0 + 18, w, h);
    g.fillStyle = PAPER; g.fillRect(x0, y0, w, h);
    g.fillStyle = HOT; g.fillRect(x0, y0, w, 10);
    g.textBaseline = 'middle'; g.textAlign = 'left'; ls(g, 0);
    font(g, 36, 600, MONO); ls(g, 0); while (g.measureText('TIME TO CRACK · RANDOM, LOWERCASE').width > w - 70) { ls(g, -1); break; } g.fillStyle = '#1a1820'; g.fillText('TIME TO CRACK · RANDOM, LOWERCASE', x0 + 36, y0 + 52); ls(g, 0);
    g.fillStyle = 'rgba(33,29,38,.15)'; g.fillRect(x0 + 40, y0 + 90, w - 80, 3);
    rows.forEach(function (r, i) {
      var y = y0 + 140 + i * 84;
      if (i) { g.fillStyle = 'rgba(33,29,38,.12)'; g.fillRect(x0 + 40, y - 42, w - 80, 2); }
      g.save(); if (i === 2) g.globalAlpha *= fin(t, w0 + .12);
      font(g, 42, 900); g.fillStyle = INK; g.textAlign = 'left'; g.fillText(r[0], x0 + 40, y);
      if (r[1]) { g.textAlign = 'right'; g.fillStyle = HOT; g.fillText(r[1], x0 + w - 40, y); }
      g.restore();
    });
    g.restore();
    stamp(g, 'BILLIONS', 742, y0 + 140 + 168, t, GT.bil - .07, S('nist').t0, 40, HOT, -.04, true);
    tag(g, 'OUR MATH', 768, y0 + h + 4, fin(t, GT.bil + .1), -.02, 32);
  }
  function ladderScene(g, t) {
    var s0 = S('random').t0, q = qt(t), n = ladderState(q);
    var wd = GT.words, wk = eio(seg(t, wd, wd + .35)), isW = q >= wd + .17, w0 = wd + .17;
    var fh = lerp(170, 232, wk), fy = 470;
    field(g, FLD.x, fy, FLD.w, fh, 1);
    /* the field's text: typed letters, then six words */
    g.save(); g.textBaseline = 'middle'; ls(g, 0);
    if (!isW) {
      font(g, 96, 600, MONO); g.textAlign = 'left'; g.globalAlpha *= 1 - seg(t, wd, wd + .17);
      var full = g.measureText(RAND).width, s = RAND.slice(0, n), x0 = CX - full / 2;
      g.fillStyle = INK; g.fillText(s, x0, fy + fh / 2 + 6);
      var lt = letterTimes();
      if (n > 0) { var cw = full / RAND.length, dropK = clamp(sp(t, lt[n - 1], 4, .7), 0, 1.1); g.fillStyle = 'rgba(255,91,61,' + (.35 * (1 - seg(t, lt[n - 1], lt[n - 1] + .4))).toFixed(3) + ')'; rr(g, x0 + (n - 1) * cw - 4, fy + 30 - (1 - Math.min(1, dropK)) * 20, cw + 8, fh - 60, 10); g.fill(); }
      if (Math.floor(t * 2.2) % 2 === 0) { g.fillStyle = HOT; g.fillRect(x0 + g.measureText(s).width + 8, fy + 40, 7, fh - 80); }
    } else {
      font(g, 60, 600, MONO); g.textAlign = 'center'; g.globalAlpha *= seg(t, wd + .17, wd + .3);
      g.fillStyle = INK; WORDS6.forEach(function (l, i) { g.fillText(l, CX, fy + 80 + i * 76); });
    }
    g.restore();
    tag(g, isW ? "RANDOM EXAMPLE · DON'T USE IT" : 'RANDOM EXAMPLE', isW ? 610 : 755, fy - 4, fin(t, s0 + .4) * (1 - seg(t, start('nist') - .15, start('nist') - .03)), .03);   /* gives way to the three-line NIST caption */
    /* the count follows the field */
    var cy = fy + fh + 48;
    if (!isW && n >= 8) chip(g, n + ' LOWERCASE LETTERS', CX, cy, { px: 44, wt: 900, bg: CREAM, fg: BG, a: fin(t, GT.eight), s: kn(t, letterTimes()[n - 1]), maxw: 800 });
    if (isW) {
      chip(g, '6 RANDOM WORDS', CX, cy, { px: 44, wt: 900, bg: CREAM, fg: BG, a: 1, s: kn(t, wd + .17), maxw: 800 });
      label(g, 'PICKED BY DICE OR A PASSWORD MANAGER', CX, cy + 56, fin(t, wd + .12), CREAM, 36);
    }
    /* the crack-time stamp: Hive's cell for the letters typed, slammed on each change; held until the six words */
    var lt2 = letterTimes(), sy = 846;
    var cells = [[GT.weeks - .07, CELLS[0]], [GT.year, CELLS[1]], [lt2[9], CELLS[2]], [lt2[10], CELLS[3]], [lt2[11], CELLS[4]]];
    if (!isW) for (var i = cells.length - 1; i >= 0; i--) {
      if (t >= cells[i][0]) { var nx = cells[i + 1] ? cells[i + 1][0] : w0; g.save(); if (i === 4) { var kb = kn(t, GT.k21) * kn(t, at('twelve', '21000') - .03); g.translate(CX, sy); g.scale(kb, kb); g.translate(-CX, -sy); } stamp(g, cells[i][1], CX, sy, t, cells[i][0], nx - .001, 88, HOT, -.05, false); g.restore(); break; }
    }
    /* ×26 between the stamps */
    var mu = at('times', 'multiplies'), out = 1 - seg(t, wd - .2, wd);
    chip(g, '×26 PER LETTER', CX, 972, { px: 52, wt: 900, bg: HOT, fg: BG, a: fin(t, mu - .06) * out, s: lerp(1.25, 1, clamp(pop(t, mu - .06, 3.2), 0, 1)), rot: .03 });
    /* the rig (labelled at 15.8 s, heating at 21K YEARS) and its rate; both leave for the ladder card */
    var heat = eio(seg(t, GT.hot, GT.hot + .4)), ra = fin(t, s0 + .02) * out;
    rig(g, FLD.x, 1048, FLD.w, 128, t, ra, heat);
    chip(g, '16 GAMING GPUS', CX, 1048, { px: 38, wt: 900, bg: mixC('#f4ede0', '#ff5b3d', heat), fg: BG, a: fin(t, GT.gpu) * out, s: kn(t, GT.gpu + .05) * kn(t, GT.hot), maxw: 600 });
    var gs = GT.rate;
    chip(g, '138,675 GUESSES A SECOND', CX, 1212, { px: 44, wt: 900, bg: CREAM, fg: BG, a: fin(t, gs) * out, s: kn(t, gs + .1), maxw: 800 });
    ladderCard(g, t, w0);
    /* the condition that matters most, in big type: the site stored the password safely */
    chip(g, 'IF THE SITE STORED IT SAFELY (BCRYPT)', CX, 1270, { px: 44, wt: 900, bg: CREAM, fg: BG, a: cred(fin(t, s0 + .1)) * (1 - seg(t, S('nist').t0 - SWIPE - .1, S('nist').t0 - SWIPE)), maxw: 820 });
    /* the conditions under every crack time, in big type; for the six words, ours */
    var ce = wend('twelve', 'years') - .05, c1 = cred(fin(t, s0 + .1)) * (1 - seg(t, ce - .2, ce - .02)), c2 = cred(seg(t, ce, ce + .18));
    block(g, ['STOLEN HASH, CRACKED OFFLINE', '16× RTX 5090 · BCRYPT · RANDOM'], CX, 1356, 36, c1, false, CREAM, 600);
    block(g, ['EFF 6-WORD PASSPHRASE', "OUR MATH AT HIVE'S SPEED"], CX, 1356, 36, c2, false, CREAM, 600);
    label(g, 'HIVE SYSTEMS 2026', CX, 1420, cred(fin(t, s0 + .1)), DIM, 32);
  }

  /* =====================================================================================================
     SCENE 4 · nist: a re-created guideline card; a 15-cell ruler fills; LENGTH > SYMBOLS
     ===================================================================================================== */
  function fitF(g, txt, px, mw) { font(g, px, 900); while (g.measureText(txt).width > mw && px > 30) { px -= 2; font(g, px, 900); } }
  function nistScene(g, t) {
    var s0 = S('nist').t0, lg = at('nist', 'length'), sy = at('nist', 'symbols'), ov = at('nist', 'over');
    var k = pop(t, s0 + .02, 2.6);
    g.save(); g.translate(0, (1 - Math.min(1, k)) * 60);
    var x0 = FLD.x, y0 = 480, w = 800, h = 600;
    g.save(); g.translate(CX, y0 + h / 2); g.rotate(-.012); g.translate(-CX, -(y0 + h / 2));
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(x0 + 12, y0 + 18, w, h);
    g.fillStyle = PAPER; g.fillRect(x0, y0, w, h);
    g.fillStyle = HOT; g.fillRect(x0, y0, w, 10);
    g.textBaseline = 'middle'; g.textAlign = 'left';
    font(g, 54, 900); g.fillStyle = INK; g.fillText('NIST SP 800-63B-4', x0 + 44, y0 + 80);
    font(g, 36, 600, MONO); g.fillStyle = '#1a1820'; g.fillText('JULY 2025', x0 + 44, y0 + 140);
    g.fillStyle = 'rgba(33,29,38,.15)'; g.fillRect(x0 + 44, y0 + 180, w - 88, 3);
    var r1 = fin(t, s0 + .15), r2 = fin(t, s0 + .25);
    g.save(); g.globalAlpha *= r1;
    tick(g, x0 + 84, y0 + 260, 34, clamp(pop(t, lg - .1, 3.4, .7), 0, 1.06));
    fitF(g, 'AT LEAST 15 CHARACTERS', 50, w - 180); g.fillStyle = INK; g.fillText('AT LEAST 15 CHARACTERS', x0 + 140, y0 + 256);
    font(g, 36, 600, MONO); g.fillStyle = '#1a1820'; g.fillText('FOR A PASSWORD USED ALONE', x0 + 140, y0 + 312);
    g.restore();
    g.save(); g.globalAlpha *= r2;
    cross(g, x0 + 84, y0 + 430, 34, clamp(pop(t, sy - .1, 3.4, .7), 0, 1.06));
    fitF(g, 'FORCED SYMBOL MIXES', 50, w - 180); g.fillStyle = INK; g.fillText('FORCED SYMBOL MIXES', x0 + 140, y0 + 426);
    var fw = g.measureText('FORCED SYMBOL MIXES').width;
    g.strokeStyle = HOT; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0 + 132, y0 + 430); g.lineTo(x0 + 132 + (fw + 16) * eio(seg(t, sy - .05, sy + .25)), y0 + 424); g.stroke();
    font(g, 36, 600, MONO); g.fillStyle = '#1a1820'; g.fillText("NIST: DON'T REQUIRE THEM", x0 + 140, y0 + 482);
    g.restore();
    g.restore();
    tag(g, 'RE-CREATED', 760, y0 + h - 44, cred(fin(t, s0 + .2)), .04);
    /* the ruler: 15 cells fill from the cut to "length" */
    var ry = 1170, cw = w / 15, f0 = s0 + .15, f1 = lg + .05;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0 + 8, ry + 12, w, 92);
    g.fillStyle = PAPER; g.fillRect(x0, ry, w, 92);
    for (var i = 0; i < 15; i++) {
      var on = qt(t) >= lerp(f0, f1, i / 14);
      if (on) { g.fillStyle = HOT; g.fillRect(x0 + i * cw + 4, ry + 34, cw - 8, 50); }
      g.fillStyle = INK; g.fillRect(x0 + i * cw, ry, 3, i % 5 === 0 ? 30 : 18);
    }
    var nOn = 0; for (i = 0; i < 15; i++) if (qt(t) >= lerp(f0, f1, i / 14)) nOn++;
    chip(g, nOn + (nOn === 15 ? '+ CHARACTERS' : ' CHARACTERS'), CX, 1128, { px: 38, wt: 900, bg: 'rgba(21,19,27,.0)', fg: CREAM, a: fin(t, s0 + .15), shadow: false, maxw: 600 });
    g.restore();
    g.save(); var kl = kn(t, GT.lgt); g.translate(CX, 1340); g.scale(kl, kl); g.translate(-CX, -1340); stamp(g, 'LENGTH > SYMBOLS', CX, 1340, t, lg - .1, DUR, 56, HOT, -.04); g.restore();
  }

  /* =====================================================================================================
     SCENE 5 · mfa + end: a generic phone (round punch-hole) with a re-created settings screen; TWO-STEP LOGIN flips on;
     a stolen P@ssw0rd! slip bounces off a second lock marked CODE. Then the EMAIL row, its toggle hidden under "?"
     ===================================================================================================== */
  function phone(g, x, y, w, h, a, inner) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    rr(g, -w / 2 + 10, 16, w, h, 56); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -w / 2, 0, w, h, 56); g.fillStyle = BODY2; g.fill();
    rr(g, -w / 2 + 14, 14, w - 28, h - 28, 44); g.fillStyle = SCREEN; g.fill();
    g.fillStyle = '#0c0b10'; el(g, 0, 44, 13, 13);
    if (inner) { g.save(); rr(g, -w / 2 + 14, 14, w - 28, h - 28, 44); g.clip(); inner(g, -w / 2 + 14, 14, w - 28, h - 28); g.restore(); }
    g.restore();
  }
  function toggle(g, x, y, on, hidden, t) {
    var w = 150, h = 78;
    rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fillStyle = hidden ? '#3a3644' : mixC('#4a4458', '#58b56f', on); g.fill();
    if (!hidden) { g.fillStyle = CREAM; el(g, x - w / 2 + h / 2 + (w - h) * on, y, h / 2 - 8, h / 2 - 8); }
    else {
      /* a coral "?" sticker over it: the picture never answers the question */
      g.save(); g.translate(x, y); g.rotate(-.08 + Math.sin(t * 2) * .03);
      rr(g, -w / 2 - 6, -h / 2 - 8, w + 12, h + 16, 18); g.fillStyle = HOT; g.fill();
      font(g, 64, 900); g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 4); g.restore();
    }
  }
  var PHX = 330, PHY = 520, PHW = 430, PHH = 800;
  function phoneScene(g, t) {
    var s0 = S('mfa').t0, tn = at('mfa', 'turn'), st = at('mfa', 'stolen'), en = at('mfa', 'enough'), e0 = start('end') + .3, em = at('end', 'email'), ys = at('end', 'yes'), no = at('end', 'no');
    var onK = clamp(sp(t, at('mfa', 'on'), 3, .8), 0, 1), scr = eio(seg(t, e0, e0 + .35)), oa = 1;
    var code = eio(seg(t, GT.code - .02, GT.code + .28));
    phone(g, PHX, PHY + Math.sin(t * 1.4) * 4, PHW, PHH, 1, function (g, x0, y0, w, h) {
      g.save(); g.globalAlpha *= 1 - scr; g.translate(0, -scr * 30);
      /* screen 1: settings → code */
      font(g, 40, 900); g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SECURITY', 0, y0 + 110);
      g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(x0 + 30, y0 + 150, w - 60, 3);
      font(g, 40, 800); g.fillStyle = CREAM; g.fillText('TWO-STEP LOGIN', 0, y0 + 220);
      toggle(g, 0, y0 + 310, onK, false, t);
      g.save(); g.globalAlpha *= code;
      g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(x0 + 30, y0 + 390, w - 60, 3);
      font(g, 34, 700, MONO); g.fillStyle = CREAM; g.fillText('ENTER THE CODE', 0, y0 + 450);
      for (var i = 0; i < 6; i++) { var bx = -165 + i * 56; rr(g, bx, y0 + 500, 46, 64, 10); g.fillStyle = '#2d2937'; g.fill(); g.strokeStyle = i === Math.floor(t * 3) % 6 ? HOT : 'rgba(244,237,224,.3)'; g.lineWidth = 3; g.stroke(); }
      g.restore();
      g.restore(); g.save(); g.globalAlpha *= scr; g.translate(0, (1 - scr) * 30);
      /* screen 2: the email row, toggle hidden */
      g.textAlign = 'center'; g.textBaseline = 'middle';
      font(g, 40, 900); g.fillStyle = CREAM; g.fillText('ACCOUNTS', 0, y0 + 110);
      g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(x0 + 30, y0 + 150, w - 60, 3);
      /* a generic envelope, no brand */
      g.save(); g.translate(0, y0 + 280); rr(g, -90, -60, 180, 120, 14); g.fillStyle = PAPER; g.fill();
      g.strokeStyle = INK; g.lineWidth = 6; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-84, -52); g.lineTo(0, 12); g.lineTo(84, -52); g.stroke(); g.restore();
      font(g, 46, 900); g.fillStyle = CREAM; g.fillText('EMAIL', 0, y0 + 400);
      font(g, 32, 600, MONO); g.fillStyle = DIM; g.fillText('TWO-STEP LOGIN', 0, y0 + 470);
      toggle(g, 0, y0 + 560, 0, true, t);
      g.restore();
    });
    /* the second lock, and the stolen password bouncing off it */
    var la = fin(t, s0 + .25) * (1 - seg(t, e0 - .1, e0 + .15));
    padlock(g, 760, 920, .5, 0, la, 'CODE');
    var sk = seg(t, st - .25, st + .12), bounce = Math.max(0, t - (st + .12));
    if (la > 0 && t >= st - .25) {
      var sx = 760, syy = lerp(560, 790, sk * sk);
      if (bounce > 0) { syy = 790 - bounce * 700 + bounce * bounce * 1400; }
      g.save(); g.beginPath(); g.rect(560, 300, 370, 1120); g.clip();
      pwSlip(g, sx, syy, 330, 64, -.06 + bounce * .6, la * (1 - seg(t, st + .5, st + .7)), .8);
      g.restore();
    }
    stamp(g, 'BLOCKED', 760, 1135, t, GT.blk - .07, e0 - .05, 46, HOT, -.06);
        /* end: YES / NO, sources */
    var ghost = fin(t, e0 + .25) * oa;
    chip(g, 'YES', 760, 860, { px: 70, wt: 900, line: CREAM, lw: 4, fg: CREAM, a: ghost * (1 - fin(t, GT.yes)) * .6, w: 220, r: 50 });
    chip(g, 'NO', 760, 1020, { px: 70, wt: 900, line: CREAM, lw: 4, fg: CREAM, a: ghost * (1 - fin(t, no - .08)) * .6, w: 220, r: 50 });
    chip(g, 'YES', 760, 860, { px: 70, wt: 900, bg: CREAM, fg: BG, a: fin(t, GT.yes) * oa, s: lerp(1.25, 1, clamp(pop(t, GT.yes, 3.2), 0, 1)), w: 220, r: 50 });
    chip(g, 'NO', 760, 1020, { px: 70, wt: 900, bg: CREAM, fg: BG, a: fin(t, no - .08) * oa, s: lerp(1.25, 1, clamp(pop(t, no - .08, 3.2), 0, 1)), w: 220, r: 50 });
    block(g, ['Hive Systems 2026 · Have I Been Pwned', 'NIST SP 800-63B-4 · EFF · CISA'], CX, 1392, 30, cred(fin(t, s0 + .15)) * oa, true, CREAM, 500);
  }

  /* ---------- captions: the narrator's words, one block at a time; only stressed words get the coral pill ---------- */
  var CAPBRK = { random: ['about'], mfa: ['so'] };
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'ask') return;   /* frame 0 is the field (3 words); the search phrase is the headline */
      var brk = (CAPBRK[l.id] || []).slice(), cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        if (cur.length && brk.length && norm(w.w) === brk[0]) { out.push(cur); cur = []; brk.shift(); }
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { out.push(cur); cur = []; }
      });
      if (cur.length) out.push(cur);
      out.forEach(function (c) { c.id = c.id || l.id; });
    });
    return out.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, id: ws.id }; });
  })();
  var STRESS = [['rules', 'capital'], ['rules', 'number'], ['rules', 'symbol'], ['breach', 'breaches'], ['breach', '100000'], ['first', 'first'], ['first', 'instantly'],
    ['random', 'random'], ['random', '139000'], ['eight', 'eight'], ['eight', 'weeks'], ['times', '26'], ['twelve', 'twelve'], ['twelve', '21000'],
    ['words', 'six'], ['words', 'billions'], ['nist', 'length'], ['nist', 'symbols'], ['mfa', 'twostep'], ['mfa', 'enough'], ['end', 'email'], ['end', 'yes'], ['end', 'no']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE - .14, sc.t0 - SWIPE) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, over: 1, that: 1 };
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), out = 1 - seg(t, o0, o1);
    /* the breach caption leaves once the counter reads 100,000+, so the number is read once, not twice */
    if (card0.id === 'breach') out *= 1 - seg(t, at('breach', 'over') + .1, at('breach', 'over') + .25);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - card0.t0 + .04, 3.2, .8), 0, 1.04);
    g.save(); g.font = '800 74px Archivo'; wide(g);
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 22;
    var lines, lw, maxw = 780, cpx = 74;
    function lay() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; }); }
    function fixLines() {
      for (var L = 0; L < lines.length - 1; L++) {
        var last = lines[L][lines[L].length - 1];
        while (lines[L].length > 1 && GLUE[norm(words[last].w)]) { lines[L].pop(); lines[L + 1].unshift(last); last = lines[L][lines[L].length - 1]; }
      }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw) && cpx > 52) { cpx -= 4; g.font = '800 ' + cpx + 'px Archivo'; wide(g); ws = words.map(function (w) { return g.measureText(w.w).width; }); gap = cpx * .28; lay(); fixLines(); }
    var lh = cpx * 1.18, y0 = (lines.length > 1 ? 352 : 392) + 26 - (lines.length - 1) * lh / 2;
    g.globalAlpha = fi * out * wipeHide(t) * (alpha == null ? 1 : alpha);
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 30;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 12, y - cpx * .87, ws[i] + 24, cpx * 1.15, 18); g.fill(); }
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = { hook: hookScene, pile: pileScene, ladder: ladderScene, nist: nistScene, phone: phoneScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) {
    g.save();
    if (Sc.fn !== 'hook' && Sc.fn !== 'phone') { var push = 1 + .012 * seg(t, Sc.t0, Sc.t1); g.translate(CX, 1000); g.scale(push, push); g.translate(-CX, -1000); }
    SCENES[Sc.fn](g, t);
    g.restore();
  }
  /* the cut: the house torn-paper edge rising from the bottom along one axis, the next scene drawn under it */
  function edgeY(x, ly, t) { var i = Math.round(x / 30); return ly + (i % 2 ? -10 : 8) + Math.sin(x * .013 + t * 5) * 4; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(t, Nx.t0 - SWIPE, Nx.t0)) : 0;
    var pre = Sc.swipe && !Sc.live && t < Sc.t0 + PRE;
    drawScene(g, Sc, pre ? Sc.t0 + PRE : t);
    if (sk > 0) {
      var ly = H * (1 - sk) - 20, x;
      g.save(); g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; drawScene(g, Nx, Nx.live ? t : Nx.t0 + PRE); INCOMING = false; g.restore();
      g.save(); g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); for (x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t); if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore();
    }
    /* the loop: the house torn edge rises on the swish and cuts back to the frame-0 picture (no dissolve) */
    var back = eio(seg(t, GT.home, GT.home + .26));
    if (back > 0) {
      var by = H * (1 - back) - 20, bx;
      g.save(); g.beginPath(); g.moveTo(0, H); for (bx = 0; bx <= W; bx += 30) g.lineTo(bx, edgeY(bx, by, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; hookIdle(g, 0); INCOMING = false; g.restore();
      if (back < 1) { g.save(); g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); for (bx = 0; bx <= W; bx += 30) { var yb = edgeY(bx, by, t); if (bx === 0) g.moveTo(bx, yb); else g.lineTo(bx, yb); } g.stroke(); g.restore(); }
    }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) {
      if (t < start('rules')) headline(g, t);
      captions(g, t, back > 0 ? 1 - back : 1);
    }
    if (!POSTERMODE) {
      g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(90, 222, 840, 6);
      g.fillStyle = HOT; g.fillRect(90, 222, 840 * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false;
  function posterTitle(g) {
    g.save(); font(g, 76, 800); wide(g); g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText('This password', CX, 318);
    var b = 'cracks instantly', wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 14, 408 - 72, wb + 28, 96, 16); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 408); g.restore();
  }
  /* a text at height y stays readable until the torn edge rising from the bottom reaches it */
  function cutY(id, y) {
    var sc = S(id), need = 1 - (y + 60) / H, u = 0;
    while (u < 1 && eio(u) < need) u += .01;
    return sc.t0 - SWIPE + SWIPE * u;
  }
  function TEXTS(t) {
    var out = [];
    function T(id, text, a, b) { if (t >= a && t < b) out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    var ck = crackT(), rl = start('rules') - .12, bt = at('breach', 'times');
    T('pw', 'P@ssw0rd!', 0, cutY('breach', 570));
    T('strong', 'STRONG', 0, cutY('breach', 753));
    T('head', 'HOW LONG TO CRACK A PASSWORD?', HEADT + .2, start('rules') - .06);
    T('inst', 'INSTANTLY', ck + .1, rl);
    T('sw', '0:00', GT.sw + .05, cutY('breach', 1302));
    T('leak', "IF IT'S BEEN LEAKED BEFORE", ck + .4, rl);
    T('hive1', 'HIVE SYSTEMS 2026 TABLE', ck + .4, rl);
    T('cap', 'CAPITAL', start('rules') + .1, start('breach') - .45);
    T('num', 'NUMBER', start('rules') + .1, start('breach') - .45);
    T('sym1', 'SYMBOL', start('rules') + .1, start('breach') - .45);
    T('count', '100,000+', at('breach', 'over') + .1, cutY('random', 504));
    T('times', 'TIMES IN DATA BREACHES', at('breach', 'data') + .1, cutY('random', 568));
    T('hibp', 'HAVE I BEEN PWNED 119,515 TIMES · OCT 27, 2026', S('breach').t0 + .25, cutY('random', 1420));
    T('tried', 'TRIED FIRST', at('first', 'passwords') + .2, cutY('random', 852));
    T('hive2', 'HIVE SYSTEMS 2026: "INSTANTLY"', bt + .3, cutY('random', 638));
    T('leak2', 'IF IT LEAKED OR USES DICTIONARY WORDS', bt + .3, cutY('random', 760));
    T('inst', 'INSTANTLY', GT.slip + .1, cutY('random', 856));
    var wd = GT.words, w0 = wd + .17;
    T('gpu', '16 GAMING GPUS', GT.gpu + .1, wd - .1);
    T('rate', '138,675 GUESSES A SECOND', GT.rate + .1, wd - .1);
    T('cond', 'STOLEN HASH, CRACKED OFFLINE 16× RTX 5090 · BCRYPT · RANDOM', S('random').t0 + .25, wend('twelve', 'years') - .25);
    T('cond2', "EFF 6-WORD PASSPHRASE OUR MATH AT HIVE'S SPEED", wend('twelve', 'years') + .05, cutY('nist', 1375));
    T('safe', 'IF THE SITE STORED IT SAFELY (BCRYPT)', S('random').t0 + .25, cutY('nist', 1270));
    T('hive3', 'HIVE SYSTEMS 2026', S('random').t0 + .25, cutY('nist', 1420));
    T('w2', '2 WEEKS', GT.weeks + .1, GT.year);
    T('mul', '×26 PER LETTER', at('times', 'multiplies') + .1, wd - .1);
    T('w21', '21K YEARS', letterTimes()[11] + .1, w0);
    T('six', '6 RANDOM WORDS', w0 + .08, cutY('nist', 750));
    T('dice', 'PICKED BY DICE OR A PASSWORD MANAGER', wd + .3, cutY('nist', 806));
    T('row1', '8 LETTERS 2 WEEKS', w0 + .1, cutY('nist', 996));
    T('row2', '12 LETTERS 21K YEARS', w0 + .1, cutY('nist', 1080));
    T('row3', '6 RANDOM WORDS', w0 + .2, cutY('nist', 1164));
    T('bil', 'BILLIONS', GT.bil + .03, cutY('nist', 1164));
    T('math', 'OUR MATH', GT.bil + .2, cutY('nist', 1214));
    T('nist', 'NIST SP 800-63B-4 JULY 2025', S('nist').t0 + .1, cutY('mfa', 620));
    T('len', 'AT LEAST 15 CHARACTERS', S('nist').t0 + .2, cutY('mfa', 736));
    T('alone', 'FOR A PASSWORD USED ALONE', S('nist').t0 + .2, cutY('mfa', 792));
    T('sym', 'FORCED SYMBOL MIXES', S('nist').t0 + .3, cutY('mfa', 906));
    T('shall', "NIST: DON'T REQUIRE THEM", S('nist').t0 + .3, cutY('mfa', 962));
    T('lgt', 'LENGTH > SYMBOLS', at('nist', 'length') + .05, cutY('mfa', 1340));
    T('tsl', 'TWO-STEP LOGIN', S('mfa').t0 + .2, start('end') - .12);
    T('email', 'EMAIL', start('end') + .2, GT.home);
    T('src', 'Hive Systems 2026 · Have I Been Pwned NIST SP 800-63B-4 · EFF · CISA', S('mfa').t0 + .3, GT.home + .1);
    return out;
  }

  /* ---------- events: the sound design reads the same word times; hits sit between words, never on them ---------- */
  var EV = [];
  /* the SFX gate (vo/heard.js, written from the finished mix): a hit's whole body keeps 0.19 s clear of every word start
     and end that unhinted faster-whisper base.en and small.en heard in the mix (the gate is 0.15; Whisper drifts a few
     hundredths between mix passes), and clear of every stretch where the voice-only track is at or above −40 dBFS.
     Without heard.js the vo.js word times stand in. */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  if (!EDGES.length) VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  function blocked(m) {
    var B = [], M = [];
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    return M;
  }
  /* free stretches [lo, hi] where a sound may play */
  function free(m) {
    var M = blocked(m), F = [], p = 0;
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { stampS: .16, slap: .16, thump: .16, knock: .15, paper: .17, swish: .28, pop: .12, tick: .04, key: .04, click: .05 };
  /* the nearest start time to t at which a hit of this type sits wholly in a free stretch */
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || .19).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  /* a sweep under the torn edge: the longest free part of the wipe */
  function gapSpan(a, b) {
    var best = null;
    free(.19).forEach(function (f) { var lo = Math.max(a, f[0]), hi = Math.min(b, f[1]) - .03; if (hi - lo >= .06 && (!best || hi - lo > best[1] - best[0])) best = [lo, hi]; });
    return best;
  }
  /* Every hit sits wholly in a free stretch. Beats that carry a sound are moved into the pauses (GT below), so picture
     and sound land together; the rest of the beats stay on their words and are silent. */
  var GT = {}, GS = [];
  /* a beat's time: moved into the nearest free stretch that holds its sound (within tol), else left where it was and silent */
  function G(id, t, type, tol, gain) {
    var n = nearGap(t, type);
    if (n !== null && Math.abs(n - t) <= (tol || .45)) { GT[id] = n; GS.push({ t: n, type: type, g: gain }); } else GT[id] = t;
  }
  function initGaps() {
    G('lock', wend('hook', 'instantly') + .3, 'knock', .5, .17);         /* the shackle pops open; INSTANTLY re-slams */
    GS.push({ t: GT.lock, type: 'stampS', g: .11 });
    G('sw', start('rules') - .3, 'thump', .3, .25);                       /* the stopwatch stops dead at 0:00 */
    GT.labels = GT.sw;
    G('cond', at('breach', 'times') + .3, 'pop', .45, .6);                /* Hive's condition chip */
    GT.slip = at('first', 'so') - .2;                                     /* mid-phrase: silent */
    GT.gpu = at('random', 'get') - .02;
    GT.rate = at('random', 'about') - .17;
    G('eight', at('eight', 'eight') - .2, 'tick', .3, .35);
    G('weeks', wend('eight', 'weeks') + .25, 'stampS', .45, .15);          /* 2 WEEKS lands in the pause after "two weeks" */
    G('ninth', at('times', 'each') - .1, 'key', .45);
    GT.year = wend('times', '26') + .12;
    G('k21', wend('twelve', 'letters') + .1, 'tick', .45, .3);
    GT.hot = at('twelve', 'letters') + .28;   /* = the 21K YEARS cell */
    GT.words = at('words', 'six') - .25;
    G('bil', at('words', 'billions') - .3, 'click', .3, .8);   /* a short hit: the pause before "Billions" is too tight for a stamp's thump */
    GT.card = S('nist').t0;
    G('lgt', wend('nist', 'symbols') + .3, 'knock', .45, .35);
    GT.code = at('mfa', 'so') - .1;
    G('blk', wend('mfa', 'enough') + .25, 'stampS', .45, .3);             /* BLOCKED, in the pause after "enough" */
    GT.yes = at('end', 'yes') - .2;   /* silent: Whisper's "Yes" drifts too close to any hit in this pause */
    GT.home = nearGap(end('end') + .12, 'swish');                         /* the loop cut rides the swish */
    if (GT.home === null || GT.home + .28 > DUR) GT.home = DUR - .3; else GS.push({ t: GT.home, type: 'swish' });
  }
  function initTimes() {
    var i;
    function A(t, type, g) { if (t !== null) EV.push({ t: t, type: type, g: g }); }
    GS.forEach(function (e) { A(e.t, e.type, e.g); });
    /* no sweep into the phone: in the silence before "And turn on" base.en heard the sweep as an extra "And" */
    SC.forEach(function (sc) { if (sc.swipe && sc.id !== 'mfa') { var s = gapSpan(sc.t0 - SWIPE, sc.t0); if (s) EV.push({ t: s[0], type: 'sweep', t1: s[1] }); } });
    EV.sort(function (a, b) { return a.t - b.t; });
    for (i = EV.length - 1; i > 0; i--) if (EV[i].type === EV[i - 1].type && EV[i].t - EV[i - 1].t < .06) EV.splice(i, 1);
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { POSTERMODE = t === window.FILM.POSTER; frame(ctx, t); POSTERMODE = false; return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- sound: foley cut to the word times; no music (Isac adds a TikTok sound) ---------- */
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
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }

    function tickS(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .16, 1, [[t, 0], [t + .004, g || .4], [t + .14, 0]], .03); o.frequency.exponentialRampToValueAtTime(60, t + .12); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t, t + .26, 900, 5200, .12, .02, 1.6); }
    function stampShort(t, g) { var o = osc('sine', 150, t, t + .16, 1, [[t, 0], [t + .004, g || .4], [t + .14, 0]], .05); o.frequency.exponentialRampToValueAtTime(60, t + .12); tickS(t + .005, .14); }
    function paper(t, g) { g = g || 1; band(t, t + .15, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .12, .08 * g); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function slap(t) { thump(t, .45); var n = noise(t, .1), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 900; var o = bus(1, .15); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .3], [t + .08, 0]]); }
    function key(t) { tickS(t, .2); osc('sine', 1900, t, t + .03, 1, [[t, 0], [t + .002, .025], [t + .025, 0]]); }
    function click(t, g) { tickS(t, .3 * (g || 1)); osc('sine', 2400, t, t + .04, 1, [[t, 0], [t + .002, .05 * (g || 1)], [t + .03, 0]]); }
    function knockS(t, g) {
      g = g || 1;
      osc('sine', 420, t, t + .14, 1, [[t, 0], [t + .002, .22 * g], [t + .1, 0]], .08).frequency.exponentialRampToValueAtTime(300, t + .1);
      osc('sine', 1180, t, t + .07, 1, [[t, 0], [t + .002, .08 * g], [t + .05, 0]], .05);
      thump(t, .22 * g); tickS(t, .22 * g);
    }
    function sweepS(t, t1) { band(t, t1 + .03, 600, 3000, .07, .04, 1.6); }
    EV.forEach(function (e) {
      if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'thump') thump(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'stampS') stampShort(e.t, e.g);
      else if (e.type === 'paper') paper(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'slap') slap(e.t);
      else if (e.type === 'key') key(e.t);
      else if (e.type === 'click') click(e.t, e.g);
      else if (e.type === 'knock') knockS(e.t, e.g);
      else if (e.type === 'sweep') sweepS(e.t, e.t1);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −62 dB, so the loop seam is never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .005; })();
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”·→…#?‹✓✕–@!>'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initGaps();
  initTimes();
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: GT.lock + .45, SLUG: 'password', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  /* full pass of the safe-area check: every glyph box (and stamp) outside x 90–930 or below y 1450 */
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
