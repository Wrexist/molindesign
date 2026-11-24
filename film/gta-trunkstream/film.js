/* "GTA 6 has a trunk streamer": Delta, "It has X, shown" Short (slug gta-trunkstream). Sources in BRIEF.md.
   Rockstar's An Extended Look (Aug 27 2026, "captured entirely from in-game footage on the PlayStation 5"), 18:12-18:28:
   a man rides in the trunk of a car the woman has just taken, films himself, and during the chase the screen shows a
   livestream overlay: LIVE 51k, then LIVE 53k, a chat ("dayum", "Bro loves attention lol", "KING OF TRUNK!!!",
   "That's tuff", "first stream!!!"), VIEW LIVESTREAM (R3), six wanted stars with two lit.
   Footage (all An Extended Look, muted, each use under 5 s): 1092.0-1094.9, 1095.4-1099.4, 1100.0-1103.9; plate
   1087.6-1091.6 (behind the vote only). The overlay shot itself (1104-1108 s, used by gta-busted as a plate) is never
   cut: we RE-DRAW it (tagged) over our own cut-paper street, car, him and the police car. Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Engine from gta-holdup. Jury r1 fixes in BRIEF.md log. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var INK = '#140c24', CREAM = '#fbf3e4', RED = '#e0303a', PINK = '#e6337a', SUN = '#ffc94a';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var BX0 = 90, BX1 = 930, BY1 = 1430, TAU = Math.PI * 2;

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function kn(t, a, amt) { if (t < a) return 1; var u = t - a; return 1 + (amt || .08) * (1 - Math.exp(-u * 40)) * Math.exp(-u * 7); }
  function bump(t, a, d) { return Math.sin(Math.PI * seg(t, a, a + d)); }
  function osc(t, k, ph) { return Math.sin(TAU * k * t / DUR + (ph || 0)); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}, ORDER = []; VO.lines.forEach(function (l) { LINE[l.id] = l; ORDER.push(l.id); });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w).indexOf(norm(word)) === 0 && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function start(id) { return LINE[id].t0; }
  function lastw(id) { var w = LINE[id].words; return w[w.length - 1].t1; }

  /* ---------- the SFX gate: hits sit in pauses (vo/vad.js) ---------- */
  var EDGES = [], VOICED = [];
  if (window.VAD) window.VAD.forEach(function (v) { VOICED.push({ t0: v[0], t1: v[1] }); EDGES.push(v[0], v[1]); });
  else VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  function free(m) {
    var B = [], M = [], F = [], p = 0;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { swish: .22, slap: .1, tock: .06, pop: .1, fizz: .26, flick: .07, ping: .2, ctick: .05, chirp: .4 };
  function nearGap(t, type, m) {
    var bd = BODY[type] || .12, best = null;
    free(m || .12).forEach(function (f) { var lo = f[0], hi = f[1] - bd; if (hi < lo) return; var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c; });
    return best;
  }
  var GT = {}, EV = [];
  /* a hit: snapped into the nearest pause within tol; the picture keeps its own time (the hit is sound only) */
  function G(id, t, type, tol, gain) {
    var n = nearGap(t, type);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .3 : tol)) { GT[id] = n; EV.push({ t: n, type: type, g: gain == null ? 1 : gain, id: id }); }
    else GT[id] = t;
    return t;
  }

  /* ---------- canvas + safe-area check ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true }, LIVE2 = { bg: true, clip: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  var BOUNDS = null, NOREC = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || NOREC || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys), d = Math.min.apply(null, ys);
    if (d > BY1 || b < SAFE.x0 || a > SAFE.x1) return;
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
  }
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS) { var mm = this.measureText(str); recBox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent, str); }
      return orig.apply(this, arguments);
    };
  }

  /* ---------- type ---------- */
  function cond(g, st) { g.__st = st || 'extra-condensed'; try { g.fontStretch = g.__st; } catch (e) {} }
  function unst(g) { g.__st = null; try { g.fontStretch = 'normal'; } catch (e) {} }
  function font(g, px, wt, fam) { g.font = (wt || 900) + ' ' + px + 'px ' + (fam || DISP); if (g.__st) try { g.fontStretch = g.__st; } catch (e) {} }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  /* condensed display text; returns its width. o: align, col, st, wt, ls, max (shrinks to fit, never under 36 px) */
  function T2(g, s, x, y, px, o) {
    o = o || {}; px = Math.max(36, px);
    g.save(); cond(g, o.st || 'condensed'); font(g, px, o.wt || 900); ls(g, o.ls == null ? 1 : o.ls);
    if (o.max) while (g.measureText(s).width > o.max && px > 36) { px -= 2; font(g, px, o.wt || 900); }
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM;
    if (o.a != null) g.globalAlpha *= clamp(o.a, 0, 1);
    g.fillText(s, x, y + px * .04); var w = g.measureText(s).width; g.restore(); unst(g); return w;
  }
  function M2(g, s, x, y, px, o) {
    o = o || {}; g.save(); font(g, Math.max(30, px), o.wt || 700, MONO); ls(g, o.ls == null ? 2 : o.ls);
    g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM; g.fillText(s, x, y); var w = g.measureText(s).width; g.restore(); return w;
  }
  function tw(s, px, st, wt) { var m = mk(4, 4).getContext('2d'); cond(m, st || 'condensed'); font(m, px, wt || 900); ls(m, 1); var w = m.measureText(s).width; unst(m); return w; }
  function chip(g, s, x, y, px, bg, fg, o) {
    o = o || {}; var w = tw(s, px) + px * .8, h = px * 1.3;
    g.save(); if (o.rot) { g.translate(x, y); g.rotate(o.rot); g.translate(-x, -y); }
    rr(g, x - w / 2 + 5, y - h / 2 + 7, w, h, 10); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, x - w / 2, y - h / 2, w, h, 10); g.fillStyle = bg; g.fill();
    T2(g, s, x, y, px, { col: fg }); g.restore(); return w;
  }



  /* =====================================================================================================
     THE SET: a phone feed, then Vice City daylight. Deep violet ink between beats. The hero picture is OUR cut-paper
     re-drawing of the Extended Look's 18:24 frame: the car from behind with the trunk open, him lying inside with his
     phone lit, a police car's nose behind, and the stream overlay as a transparent layer like Rockstar's (LIVE badge
     top right, six stars with two lit, a chat column on the right, VIEW LIVESTREAM bottom right). Nothing of ours
     sits inside that overlay: our readings are cream stickers on the left with leader lines, our marks are rings.
     Footage (hook, goes live, first stream) plays on our generic phone. Native move: the SWIPE UP between beats.
     ===================================================================================================== */
  var PH0 = { x: 105, w: 810, y: 655, h: 775 }, PHM = { x: 160, w: 700, y: 572, h: 740 }, PHF = { x: 160, w: 760, y: 830, h: 520 };
  var T = {}, U = {}, SC = null;
  var BG, NOISE, SCENE, HZ = 780, VX = 500;

  function buildBG() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(19);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1b1036'); gr.addColorStop(.55, '#120a26'); gr.addColorStop(1, '#0a0618'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    var a = g.createRadialGradient(160, 420, 10, 160, 420, 700); a.addColorStop(0, 'rgba(230,51,122,.20)'); a.addColorStop(1, 'rgba(230,51,122,0)'); g.fillStyle = a; g.fillRect(0, 0, W, H);
    var b = g.createRadialGradient(920, 1300, 10, 920, 1300, 760); b.addColorStop(0, 'rgba(40,210,200,.16)'); b.addColorStop(1, 'rgba(40,210,200,0)'); g.fillStyle = b; g.fillRect(0, 0, W, H);
    for (var k = 0; k < 5000; k++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.07)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    var vg = g.createRadialGradient(510, 880, 300, 510, 880, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }
  function disc(g, x, y, r, c) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = c; g.fill(); }

  /* ---------- the street (pre-rendered): Ocean Drive in the afternoon, cut paper ---------- */
  function strip(g, x0, x1, w0, w1, col) { g.fillStyle = col; g.beginPath(); g.moveTo(x0 - w0 / 2, HZ); g.lineTo(x0 + w0 / 2, HZ); g.lineTo(x1 + w1 / 2, H); g.lineTo(x1 - w1 / 2, H); g.closePath(); g.fill(); }
  function palm(g, x, y, h, lean, s) {
    g.save(); g.lineCap = 'round';
    g.strokeStyle = '#6b5643'; g.lineWidth = 18 * s; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * .2, y - h * .55, x + lean, y - h); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 5 * s; for (var k = 1; k < 9; k++) { var yy = y - h * k / 9, xx = x + lean * Math.pow(k / 9, 2) * .9; g.beginPath(); g.moveTo(xx - 9 * s, yy); g.lineTo(xx + 9 * s, yy - 4 * s); g.stroke(); }
    var tx = x + lean, ty = y - h;
    for (var i = 0; i < 9; i++) {
      var a = Math.PI + i * Math.PI / 8, L = (120 + 30 * (i % 3)) * s, ex = tx + Math.cos(a) * L * 1.1, ey = ty + Math.sin(a) * L * .45 + 70 * s * Math.abs(Math.cos(a));
      g.strokeStyle = i % 2 ? '#1d4a35' : '#2b6044'; g.lineWidth = 20 * s;
      g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * L * .6, ty - 50 * s, ex, ey); g.stroke();
    }
    disc(g, tx, ty, 14 * s, '#3c2e22'); g.restore();
  }
  function buildScene() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(5);
    var sk = g.createLinearGradient(0, 0, 0, HZ); sk.addColorStop(0, '#4f86c8'); sk.addColorStop(.65, '#9ec2e4'); sk.addColorStop(1, '#f4d6b0'); g.fillStyle = sk; g.fillRect(0, 0, W, HZ + 2);
    g.fillStyle = 'rgba(255,255,255,.55)'; [[180, 300, 120], [420, 220, 90], [760, 330, 140]].forEach(function (cl) { g.beginPath(); g.ellipse(cl[0], cl[1], cl[2], cl[2] * .28, 0, 0, TAU); g.fill(); });
    for (var i = 0; i < 9; i++) { var bx = 330 + i * 40, bh = 70 + r() * 170; g.fillStyle = i % 2 ? 'rgba(214,222,236,.95)' : 'rgba(190,204,222,.95)'; g.fillRect(bx, HZ - bh, 34, bh); }
    var cols = ['#f3b3c2', '#9edbd0', '#f5e8cf', '#f1a68d'];
    [[600, 590, 130], [720, 500, 160], [870, 430, 210]].forEach(function (b, i) {
      g.fillStyle = cols[i]; g.fillRect(b[0], b[1], b[2], HZ - b[1] + 40);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(b[0] - 6, b[1], b[2] + 12, 12); g.fillRect(b[0] - 6, b[1] + 80, b[2] + 12, 8);
      g.fillStyle = 'rgba(38,58,92,.6)'; for (var yy = b[1] + 30; yy < HZ - 20; yy += 54) for (var xx = b[0] + 14; xx < b[0] + b[2] - 22; xx += 38) g.fillRect(xx, yy, 22, 30);
      g.fillStyle = cols[(i + 1) % 4]; g.fillRect(b[0] + b[2] * .45, b[1] - 40, 14, 40);
    });
    g.fillStyle = '#5c8c4c'; g.fillRect(0, HZ - 30, 470, 60);
    g.fillStyle = '#3f6e3c'; for (var k = 0; k < 16; k++) { g.beginPath(); g.ellipse(r() * 460, HZ - 22, 46 + r() * 40, 26 + r() * 14, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#4e7d44'; g.fillRect(0, HZ, W, H - HZ);
    strip(g, VX - 60, -520, 40, 1200, '#c78e9a');
    strip(g, VX + 90, W + 760, 50, 1300, '#d6c4b0');
    var rd = g.createLinearGradient(0, HZ, 0, H); rd.addColorStop(0, '#76727c'); rd.addColorStop(1, '#2d2b33');
    g.fillStyle = rd; g.beginPath(); g.moveTo(VX - 40, HZ); g.lineTo(VX + 70, HZ); g.lineTo(W + 420, H); g.lineTo(-340, H); g.closePath(); g.fill();
    strip(g, VX + 14, 860, 3, 26, '#e7bf48'); strip(g, VX + 22, 930, 3, 26, '#e7bf48');
    [[540, 790, 26], [470, 800, 30], [585, 815, 40]].forEach(function (cr, i) { rr(g, cr[0] - cr[2] / 2, cr[1] - cr[2] * .5, cr[2], cr[2] * .55, 4); g.fillStyle = ['#2a2d38', '#8a3a3a', '#d9d9df'][i]; g.fill(); });
    palm(g, 40, 1080, 720, 60, 1.35); palm(g, 250, 860, 430, -30, .95); palm(g, 400, 800, 250, 14, .62);
    palm(g, 1060, 1100, 760, -90, 1.35); palm(g, 880, 840, 380, 24, .9);
    g.fillStyle = 'rgba(12,8,26,.16)'; g.fillRect(0, 0, W, H);
    var dr = g.createLinearGradient(500, 0, 1000, 0); dr.addColorStop(0, 'rgba(8,6,18,0)'); dr.addColorStop(1, 'rgba(8,6,18,.62)'); g.fillStyle = dr; g.fillRect(500, 380, 580, 760);
    var lo = g.createLinearGradient(0, 1250, 0, H); lo.addColorStop(0, 'rgba(8,6,18,0)'); lo.addColorStop(1, 'rgba(8,6,18,.55)'); g.fillStyle = lo; g.fillRect(0, 1250, W, H - 1250);
    return c;
  }

  /* ---------- him, as at 18:24: on his side in the trunk, propped on one elbow, knees up, phone held to his face.
     Car-local units (origin = the middle of the rear bumper's ground line). ---------- */
  function limb(g, x0, y0, x1, y1, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  function trunkGuy(g, lit, t) {
    var wob = t ? 2.5 * Math.sin(t * 6.3) : 0;
    /* legs, knees up (far leg darker) */
    limb(g, -30, -236, -150, -318, 46, '#3f5680'); limb(g, -150, -318, -232, -246, 42, '#3f5680');
    limb(g, -10, -226, -118, -300, 48, '#5873a6'); limb(g, -118, -300, -206, -232, 44, '#5873a6');
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(-70, -268, 40, 7, -.6, 0, TAU); g.fill();
    rr(g, -262, -262, 62, 34, 14); g.fillStyle = '#e9e9ea'; g.fill(); rr(g, -236, -248, 62, 34, 14); g.fillStyle = '#f4f4f5'; g.fill();
    g.fillStyle = '#b8b8bc'; g.fillRect(-236, -220, 62, 6);
    /* torso: grey hoodie, hip low left, shoulder high right */
    g.save(); g.translate(40, -268); g.rotate(-.42); rr(g, -82, -52, 176, 104, 50); g.fillStyle = '#5d6169'; g.fill();
    g.fillStyle = 'rgba(255,255,255,.08)'; rr(g, -70, -48, 150, 26, 13); g.fill(); g.fillStyle = 'rgba(0,0,0,.22)'; rr(g, -70, 24, 150, 22, 11); g.fill(); g.restore();
    /* the arm he leans on */
    limb(g, 96, -310, 54, -230, 36, '#4d5159'); disc(g, 50, -224, 18, '#c48b69');
    /* hood + neck */
    g.fillStyle = '#4a4e56'; g.beginPath(); g.ellipse(112, -336, 46, 30, -.4, 0, TAU); g.fill();
    rr(g, 112, -380, 34, 40, 12); g.fillStyle = '#b97f5e'; g.fill();
    /* head: ~110 px, blond, sunglasses, turned to the phone */
    g.save(); g.translate(132, -410); g.rotate(-.18);
    disc(g, 0, 0, 52, '#c99272');
    g.fillStyle = '#ddbb6a'; g.beginPath(); g.moveTo(-54, -4); g.quadraticCurveTo(-56, -62, 4, -64); g.quadraticCurveTo(58, -62, 54, -14); g.quadraticCurveTo(20, -40, -20, -30); g.quadraticCurveTo(-40, -24, -54, -4); g.fill();
    g.fillStyle = '#f0d58f'; g.beginPath(); g.ellipse(6, -50, 26, 8, -.2, 0, TAU); g.fill();
    g.fillStyle = '#0f0e12'; rr(g, -48, -10, 46, 24, 9); g.fill(); rr(g, 2, -10, 46, 24, 9); g.fill(); g.fillRect(-6, -6, 14, 6);
    g.fillStyle = 'rgba(160,230,255,.5)'; g.fillRect(-40, -6, 14, 4); g.fillRect(10, -6, 14, 4);
    g.fillStyle = '#a86e50'; g.beginPath(); g.ellipse(-6, 32, 14, 5, 0, 0, TAU); g.fill();
    g.fillStyle = '#b57c5c'; g.beginPath(); g.ellipse(50, 6, 9, 15, 0, 0, TAU); g.fill();
    g.restore();
    /* the phone arm: hand up in front of his face, screen toward him */
    limb(g, 120, -318, 52, -380, 32, '#5d6169'); disc(g, 46, -392, 17, '#c99272');
    if (lit > 0) { var gl = g.createRadialGradient(70, -410, 4, 70, -410, 150); gl.addColorStop(0, 'rgba(150,236,255,' + (.42 * lit) + ')'); gl.addColorStop(1, 'rgba(150,236,255,0)'); g.fillStyle = gl; g.fillRect(-90, -570, 320, 320); }
    g.save(); g.translate(48, -420 + wob); g.rotate(.32); rr(g, -17, -30, 34, 60, 7); g.fillStyle = '#0e0d12'; g.fill(); rr(g, -13, -25, 26, 50, 5); g.fillStyle = lit > 0 ? '#d4f8ff' : '#2a2a33'; g.fill(); g.restore();
  }
  /* ---------- the sedan from behind; lid 0 closed .. 1 lifted (a thin panel, underside showing) ---------- */
  function carBack(g, t, o) {
    var s = o.s || 1, lid = o.lid || 0;
    g.save(); g.translate(o.cx, o.by + (o.bob || 0)); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(0, 6, 340, 30, 0, 0, TAU); g.fill();
    g.fillStyle = '#0c0b10'; rr(g, -292, -92, 96, 98, 18); g.fill(); rr(g, 196, -92, 96, 98, 18); g.fill();
    /* roof and the sloped rear window (C-pillars show either side of the lifted lid) */
    g.fillStyle = '#2e2b35'; g.beginPath(); g.moveTo(-250, -330); g.quadraticCurveTo(-205, -470, -150, -488); g.lineTo(150, -488); g.quadraticCurveTo(205, -470, 250, -330); g.closePath(); g.fill();
    var wg = g.createLinearGradient(0, -478, 0, -336); wg.addColorStop(0, '#93aed2'); wg.addColorStop(1, '#3b4a66');
    g.fillStyle = wg; g.beginPath(); g.moveTo(-200, -336); g.quadraticCurveTo(-170, -452, -132, -474); g.lineTo(132, -474); g.quadraticCurveTo(170, -452, 200, -336); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(-96, -474); g.lineTo(-62, -474); g.lineTo(-120, -340); g.lineTo(-156, -340); g.closePath(); g.fill();
    /* body: rounded shoulders, deck line at -330 */
    var bd = g.createLinearGradient(0, -335, 0, -60); bd.addColorStop(0, '#5a5564'); bd.addColorStop(.45, '#3b3744'); bd.addColorStop(1, '#1c1a21');
    g.fillStyle = bd; g.beginPath(); g.moveTo(-300, -66); g.lineTo(-306, -250); g.quadraticCurveTo(-300, -326, -240, -334); g.lineTo(240, -334); g.quadraticCurveTo(300, -326, 306, -250); g.lineTo(300, -66); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(-270, -334, 540, 4);
    /* wrap-round tail lights, plate, bumper */
    g.fillStyle = '#b81c28'; g.beginPath(); g.moveTo(-304, -262); g.lineTo(-206, -262); g.lineTo(-214, -214); g.lineTo(-304, -218); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(304, -262); g.lineTo(206, -262); g.lineTo(214, -214); g.lineTo(304, -218); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,150,150,.7)'; g.fillRect(-292, -256, 76, 7); g.fillRect(216, -256, 76, 7);
    rr(g, -72, -176, 144, 56, 6); g.fillStyle = '#ebe3d1'; g.fill(); g.strokeStyle = '#9a9384'; g.lineWidth = 3; g.stroke();
    rr(g, -316, -104, 632, 50, 18); g.fillStyle = '#141218'; g.fill();
    /* the trunk opening */
    g.fillStyle = '#07060b'; rr(g, -250, -330, 500, 130, 14); g.fill();
    if (lid > 0) {
      /* the lid lifted: a thin panel standing up from the deck's back edge, underside (liner + ribs) toward us */
      var lh = 250 * lid;
      g.save(); var lg = g.createLinearGradient(0, -330 - lh, 0, -330); lg.addColorStop(0, '#3b3745'); lg.addColorStop(1, '#1b1921'); g.fillStyle = lg;
      g.beginPath(); g.moveTo(-252, -330); g.lineTo(252, -330); g.lineTo(236, -330 - lh); g.lineTo(-236, -330 - lh); g.closePath(); g.fill();
      g.strokeStyle = '#6a6477'; g.lineWidth = 6; g.stroke();
      if (lid > .5) { g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 10; rr(g, -200, -330 - lh + 30, 400, lh - 60, 16); g.stroke(); g.fillStyle = '#b81c28'; g.fillRect(-230, -330 - lh + 8, 50, 10); g.fillRect(180, -330 - lh + 8, 50, 10); }
      g.restore();
      var ig = g.createLinearGradient(0, -330, 0, -200); ig.addColorStop(0, '#1d1a26'); ig.addColorStop(1, '#09080d'); g.fillStyle = ig; rr(g, -242, -324, 484, 120, 12); g.fill();
      g.save(); g.beginPath(); g.rect(-400, -800, 800, 600); g.clip(); trunkGuy(g, (o.lit || 0) * clamp(lid * 2 - .6, 0, 1), t); g.restore();
      /* the rear panel lip in front of his legs */
      g.fillStyle = '#3b3744'; rr(g, -254, -212, 508, 16, 6); g.fill();
    } else {
      g.fillStyle = '#4a4554'; rr(g, -254, -334, 508, 134, 14); g.fill(); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(-240, -330, 480, 4);
    }
    g.restore();
  }
  /* ---------- the police car, three-quarter, lower right: black hood and front, white door with a dark lettering
     block, rounded roof, one light bar alternating red / blue at 4 Hz with a bloom on the road ---------- */
  function police(g, t, k) {
    if (k <= 0) return; var red = Math.floor(t * 8) % 2 === 0;
    g.save(); g.translate(600, 1470 + 700 * (1 - k));
    var bl = g.createRadialGradient(160, 0, 10, 160, 0, 300); bl.addColorStop(0, red ? 'rgba(255,40,60,.45)' : 'rgba(60,120,255,.5)'); bl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = bl; g.beginPath(); g.ellipse(160, 0, 340, 90, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(200, 4, 380, 26, 0, 0, TAU); g.fill();
    /* side: white door, black rocker, window strip, rounded roof */
    g.fillStyle = '#121116'; g.beginPath(); g.moveTo(100, -70); g.lineTo(560, -80); g.lineTo(560, -20); g.lineTo(110, -14); g.closePath(); g.fill();
    g.fillStyle = '#eeece6'; g.beginPath(); g.moveTo(96, -230); g.lineTo(560, -246); g.lineTo(560, -80); g.lineTo(100, -70); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(300, -238, 6, 162);
    g.fillStyle = '#1c2430'; rr(g, 330, -186, 200, 44, 6); g.fill();
    g.fillStyle = '#20252e'; g.beginPath(); g.moveTo(120, -236); g.lineTo(190, -330); g.lineTo(560, -340); g.lineTo(560, -250); g.closePath(); g.fill();
    g.fillStyle = '#eeece6'; g.beginPath(); g.moveTo(170, -330); g.quadraticCurveTo(200, -372, 260, -374); g.lineTo(560, -380); g.lineTo(560, -340); g.lineTo(190, -330); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(380, -326, 8, 76);
    /* front: black hood + nose, headlight, push bar */
    g.fillStyle = '#17161b'; g.beginPath(); g.moveTo(-170, -200); g.lineTo(120, -236); g.lineTo(100, -70); g.lineTo(110, -14); g.lineTo(-150, -30); g.quadraticCurveTo(-190, -110, -170, -200); g.closePath(); g.fill();
    g.fillStyle = '#2a3646'; g.beginPath(); g.moveTo(-120, -212); g.lineTo(120, -236); g.lineTo(190, -330); g.lineTo(-30, -318); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.moveTo(10, -316); g.lineTo(50, -318); g.lineTo(-20, -216); g.lineTo(-60, -214); g.closePath(); g.fill();
    rr(g, -160, -150, 90, 34, 10); g.fillStyle = '#fff6d6'; g.fill();
    g.strokeStyle = '#3a3a42'; g.lineWidth = 12; g.beginPath(); g.moveTo(-180, -170); g.lineTo(-180, -40); g.lineTo(-40, -36); g.stroke();
    /* wheel */
    disc(g, 210, -14, 62, '#0b0b0e'); disc(g, 210, -14, 34, '#55545c'); disc(g, 210, -14, 10, '#222');
    /* one light bar on the roof */
    var glw = g.createRadialGradient(200, -394, 6, 200, -394, 210); glw.addColorStop(0, red ? 'rgba(255,40,60,.55)' : 'rgba(70,130,255,.6)'); glw.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = glw; g.fillRect(-20, -600, 440, 420);
    rr(g, 90, -408, 230, 30, 12); g.fillStyle = '#0d0d11'; g.fill();
    rr(g, 96, -404, 106, 22, 8); g.fillStyle = red ? '#ff3344' : '#4a1016'; g.fill();
    rr(g, 208, -404, 106, 22, 8); g.fillStyle = red ? '#16234f' : '#4d8cff'; g.fill();
    g.restore();
  }
  /* where the street scene is: parked (steal) or driving (cops .. button); null when off screen */
  function sceneState(t) {
    if (t >= T.stealIn && t < T.selfIn + .25) return { drive: false, dy: 1700 * (1 - eo(seg(t, T.stealIn + .05, T.stealIn + .35))) - 1920 * eio(seg(t, T.selfIn - .05, T.selfIn + .25)) };
    if (t >= T.copsIn - .05 && t < T.firstIn + .25) return { drive: true, dy: 1700 * (1 - eo(seg(t, T.copsIn - .05, T.copsIn + .25))) - 1920 * eio(seg(t, T.firstIn - .05, T.firstIn + .25)) };
    return null;
  }
  var CARP = { cx: 500, by: 1400, s: 1.12 }, CARD = { cx: 330, by: 1390, s: 1.02 };
  function headAt(c) { return [c.cx + 132 * c.s, c.by - 410 * c.s]; }
  function sceneLayer(g, t, sc) {
    g.save(); g.translate(0, sc.dy); g.drawImage(SCENE, 0, 0);
    if (sc.drive) {
      for (var i = 0; i < 6; i++) {
        var u = (i / 6 + t * .9) % 1, u2 = u * u, u3 = Math.min(1, (u + .07) * (u + .07));
        var xa = lerp(VX - 26, -140, u2), xb = lerp(VX - 26, -140, u3), ya = lerp(HZ, H, u2), yb = lerp(HZ, H, u3), wa = lerp(2, 26, u2), wb = lerp(2, 26, u3);
        g.fillStyle = 'rgba(240,240,240,.75)'; g.beginPath(); g.moveTo(xa - wa / 2, ya); g.lineTo(xa + wa / 2, ya); g.lineTo(xb + wb / 2, yb); g.lineTo(xb - wb / 2, yb); g.closePath(); g.fill();
      }
      carBack(g, t, { cx: CARD.cx, by: CARD.by, s: CARD.s, lid: 1, lit: 1, bob: 3 * Math.sin(t * 19) + 2 * Math.sin(t * 7.3) });
      police(g, t, eo(seg(t, T.copsW - .35, T.copsW + .05)));
    } else {
      carBack(g, t, { cx: CARP.cx, by: CARP.by, s: CARP.s, lid: eio(seg(t, T.hesW - .65, T.hesW - .2)), lit: 1 });
    }
    g.restore();
  }

  /* ---------- our phone ---------- */
  /* our phone: body, bezel, punch-hole; feed(g, sx, sy, sw, sh) draws the screen */
  function phone(g, box, t, feed, o) {
    o = o || {};
    var X = box.x, Y = box.y, w = box.w, h = box.h, bz = Math.max(14, w * .03), r = w * .11;
    g.save();
    if (o.rot) { var cx = X + w / 2, cy = Y + h / 2; g.translate(cx, cy); g.rotate(o.rot); g.translate(-cx, -cy); }
    rr(g, X + 10, Y + 16, w, h, r); g.fillStyle = 'rgba(0,0,0,.5)'; g.fill();
    rr(g, X, Y, w, h, r); g.fillStyle = '#17141f'; g.fill(); g.strokeStyle = '#3a3448'; g.lineWidth = 4; g.stroke();
    var sx = X + bz, sy = Y + bz, sw = w - bz * 2, sh = h - bz * 2;
    g.save(); rr(g, sx, sy, sw, sh, r - bz * .6); g.clip(); g.fillStyle = '#050309'; g.fillRect(sx, sy, sw, sh);
    if (feed) feed(g, sx, sy, sw, sh);
    var sh2 = g.createLinearGradient(sx, sy, sx + sw, sy + sh); sh2.addColorStop(0, 'rgba(255,255,255,.06)'); sh2.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = sh2; g.fillRect(sx, sy, sw, sh);
    if (o.over) o.over(g, sx, sy, sw, sh);
    g.restore();
    disc(g, X + w / 2, Y + bz + 18, 9, '#000'); disc(g, X + w / 2, Y + bz + 18, 4, '#1d2a3a');
    g.restore();
  }
  function feedUse(u, t, o) {
    o = o || {};
    return function (g, x, y, w, h) {
      var tt = Math.min(t, u.t1 - 1e-3);
      g.save(); g.filter = 'brightness(' + (o.bright || 1.04) + ') contrast(1.05) saturate(1.06)'; CLIP.draw(g, tt, x, y, w, h, u); g.restore();
      if (o.after) o.after(g, x, y, w, h, tt);
      if (!o.nocredit) CLIP.credit(g, u, Math.max(x + 20, 112), y + h - (o.credY || 30), '700 30px "Geist Mono", monospace');
    };
  }
  function ring(g, x, y, r, k, col) {
    if (k <= 0) return; g.save(); g.strokeStyle = col || SUN; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y, r * (1 + .25 * (1 - eo(k))), -Math.PI / 2, -Math.PI / 2 + TAU * eo(k)); g.stroke(); g.restore();
  }
  function srcAt(u, t) { var l = t - u.t0; if (u.freeze != null) l = Math.min(l, u.freeze); return u.from + l * u.speed; }
  function track(u, t, pts) {
    var s = srcAt(u, t), i = 0; while (i < pts.length - 2 && s > pts[i + 1][0]) i++;
    var a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)], k = b[0] === a[0] ? 0 : clamp((s - a[0]) / (b[0] - a[0]), 0, 1);
    return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  }
  function tagAt(g, s, px, py, tx, ty, k, px2, bg, fg) {
    if (k <= 0) return; var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.strokeStyle = CREAM; g.lineWidth = 5;
    g.beginPath(); g.moveTo(px, py); g.lineTo(lerp(px, tx, eo(k)), lerp(py, ty, eo(k))); g.stroke();
    g.translate(tx, ty); g.scale(lerp(1.15, 1, eo(k)), lerp(1.15, 1, eo(k))); chip(g, s, 0, 0, px2 || 46, bg || RED, fg || CREAM, { rot: -.02 }); g.restore(); NOREC = nr;
  }
  /* his phone, 0..1 of the source frame, read off the cut's frames (seconds into the cut) */
  var PH_TRUNK = [[0, .446, .748], [.2, .432, .711], [.4, .418, .748], [.6, .418, .724], [.7, .432, .698], [.8, .432, .64], [.9, .432, .572], [1.0, .404, .546], [1.1, .404, .485], [1.2, .39, .46], [1.6, .39, .455], [2.9, .39, .455]];
  var PH_SELF = [[0, .80, .30], [.6, .84, .37], [1.6, .86, .35], [2.6, .89, .35], [3.6, .87, .34], [4.0, .87, .34]];
  var PH_SELF2 = [[0, .70, .43], [.7, .44, .51], [1.3, .50, .46], [2.0, .42, .60], [3.0, .42, .66], [3.9, .49, .66]];

  /* the LIVE badge, as on the Extended Look's stream overlay (red pill, white type) */
  function liveBadge(g, x, y, px, n, o) {
    o = o || {}; var s = 'LIVE ' + n, w = tw(s, px, 'condensed', 900) + px * .9, h = px * 1.3;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot);
    rr(g, -w / 2 + 6, -h / 2 + 8, w, h, h * .18); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, h * .18); g.fillStyle = '#e3262f'; g.fill();
    T2(g, s, 0, 0, px, { col: '#ffffff' }); g.restore(); return w;
  }


  /* ---------- frame 0 / seam: the hook title over the big phone ---------- */
  function hookTitle(g, t, k) {
    if (k <= 0) return;
    var nr = NOREC; NOREC = nr || k < .999; var dy = -620 * (1 - k);
    g.save(); g.translate(0, dy);
    chip(g, 'GTA 6', 290, 336, 60, PINK, CREAM, { rot: -.05 });
    var w1 = tw('STREAMER', 150, 'condensed', 900) + 60;
    g.save(); g.translate(CX, 440); g.rotate(-.025); rr(g, -w1 / 2 + 6, -78 + 9, w1, 156, 10); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, -w1 / 2, -78, w1, 156, 10); g.fillStyle = CREAM; g.fill(); g.restore();
    T2(g, 'STREAMER', CX, 440, 150, { col: INK });
    var w2 = tw('IN THE TRUNK', 112, 'condensed', 900) + 56;
    g.save(); g.translate(CX, 584); g.rotate(.02); rr(g, -w2 / 2 + 6, -62 + 9, w2, 124, 10); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, -w2 / 2, -62, w2, 124, 10); g.fillStyle = RED; g.fill(); g.restore();
    T2(g, 'IN THE TRUNK', CX, 584, 112, { col: CREAM });
    g.restore(); NOREC = nr;
  }
  function arrowAt(g, t, x, y, a) {
    if (a <= 0) return; var b = 12 * Math.sin(t * 9);
    g.save(); g.globalAlpha *= a; g.fillStyle = SUN; g.strokeStyle = INK; g.lineWidth = 5; g.translate(x, y - 40 + b);
    g.beginPath(); g.moveTo(-18, -60); g.lineTo(18, -60); g.lineTo(18, -20); g.lineTo(40, -20); g.lineTo(0, 22); g.lineTo(-40, -20); g.lineTo(-18, -20); g.closePath(); g.stroke(); g.fill(); g.restore();
  }
  /* the payoff by 2.0 s: Rockstar's own badge from 18:24, re-drawn and tagged, on the hook phone */
  function payoff(g, t) {
    var k = eo(seg(t, T.payW, T.payW + .18)); if (k <= 0) return;
    var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.translate(735, 770); var s = lerp(1.6, 1, k) * kn(t, T.payW + .18, .07); g.scale(s, s); g.globalAlpha *= clamp(k * 2, 0, 1);
    liveBadge(g, 0, 0, 76, '51k'); g.restore();
    if (k > 0) { g.save(); g.globalAlpha *= clamp(k * 2, 0, 1); chip(g, 'RE-DRAWN · 18:24', 735, 872, 36, SUN, INK, { rot: -.02 }); g.restore(); }
    NOREC = nr;
  }
  /* the steal beat's stickers (STOLEN on "steals", IN HERE on "He's"), riding the parked scene */
  function stealProps(g, t, sc) {
    if (!sc || sc.drive) return;
    g.save(); g.translate(0, sc.dy); var nr = NOREC; NOREC = nr || Math.abs(sc.dy) > .5;
    var ks = eo(seg(t, T.stolen, T.stolen + .16));
    if (ks > 0) { var nrs = NOREC; NOREC = nrs || ks < .999; g.save(); g.translate(330, 590); g.rotate(-.1); g.scale(lerp(1.6, 1, ks), lerp(1.6, 1, ks)); g.globalAlpha *= clamp(ks * 2, 0, 1);
      rr(g, -200, -72, 400, 144, 12); g.fillStyle = 'rgba(251,243,228,.92)'; g.fill(); g.strokeStyle = RED; g.lineWidth = 10; g.stroke(); T2(g, 'STOLEN', 0, 0, 104, { col: RED }); g.restore(); NOREC = nrs; }
    var hd = headAt(CARP);
    if (t >= T.hesW - .5) tagAt(g, 'HIM', hd[0] + 10, hd[1] + 40, 760, 1330, seg(t, T.hesW - .5, T.hesW - .25), 72, SUN, INK);
    NOREC = nr; g.restore();
  }
  function star(g, x, y, R, r) { g.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr0 = i % 2 ? r : R; g.lineTo(x + Math.cos(a) * rr0, y + Math.sin(a) * rr0); } g.closePath(); }
  /* ---------- the stream overlay, RE-DRAWN as a transparent layer over our street (cops .. button) ---------- */
  var CHAT = [['dayum'], ['Bro loves', 'attention lol'], ['KING OF TRUNK!!!'], ["That's tuff"], ['first stream!!!']];
  var CHATC = ['#e6337a', '#7bd35a', '#2f6bff', '#f3a0c0', '#ffc94a'];
  function smiley(g, x, y, r) { disc(g, x, y, r, '#ffcc33'); disc(g, x - r * .35, y - r * .2, r * .13, '#4a2a00'); disc(g, x + r * .35, y - r * .2, r * .13, '#4a2a00'); g.strokeStyle = '#4a2a00'; g.lineWidth = r * .14; g.beginPath(); g.arc(x, y + r * .05, r * .5, .2, Math.PI - .2); g.stroke(); }
  function shadowText(g, s, x, y, px, o) { g.save(); g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 10; g.shadowOffsetY = 3; var w = T2(g, s, x, y, px, o); g.restore(); return w; }
  function sticker(g, s, x, y, px, k, lx, ly) {
    if (k <= 0) return; var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1);
    if (lx != null) { g.strokeStyle = CREAM; g.lineWidth = 5; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, lx, eo(k)), lerp(y, ly, eo(k))); g.stroke(); g.setLineDash([]); disc(g, lx, ly, 8 * eo(k), CREAM); }
    g.translate(x, y); g.scale(lerp(1.3, 1, eo(k)), lerp(1.3, 1, eo(k))); chip(g, s, 0, 0, px, CREAM, INK, { rot: -.03 }); g.restore(); NOREC = nr;
  }
  function overlay(g, t, sc) {
    if (!sc || !sc.drive) return;
    var nr = NOREC; NOREC = nr || Math.abs(sc.dy) > .5;
    g.save(); g.translate(0, sc.dy);
    /* stars: six, the last two lit on "cops" (top right, as in the frames) */
    var ka = seg(t, T.copsIn + .2, T.copsIn + .4);
    if (ka > 0) for (var i = 0; i < 6; i++) {
      var x = 660 + i * 50, lit = i >= 4, s0 = T.copsW + (i - 4) * .1, ks = lit ? eo(seg(t, s0, s0 + .14)) : 0;
      g.save(); g.globalAlpha *= ka; g.translate(x, 500); star(g, 0, 0, 22, 10); g.fillStyle = 'rgba(70,68,84,.85)'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 3; g.stroke();
      if (ks > 0) { var sc2 = ks * kn(t, s0 + .14, .2); g.scale(sc2, sc2); star(g, 0, 0, 22, 10); g.fillStyle = '#fff'; g.fill(); }
      g.restore();
    }
    /* the LIVE badge, top right: 51k on "live:", 53k on "53" */
    var kb = eo(seg(t, T.k51 - .05, T.k51 + .15));
    if (kb > 0) { var nrb = NOREC; NOREC = nrb || kb < .999; var pop = kn(t, T.k53, .16) * lerp(1.5, 1, kb); g.save(); g.translate(790, 586); g.scale(pop, pop); g.globalAlpha *= clamp(kb * 2, 0, 1); liveBadge(g, 0, 0, 62, t >= T.k53 ? '53k' : '51k'); g.restore(); NOREC = nrb; }
    /* chat column, newest at the bottom, rows push up (Rockstar's order) */
    var rows = [T.chatIn + .05, T.chatW + .15, T.kingW - .08, T.kingW + .55, T.btnIn + .35], yb = 1000, LH = 54, GAP = 26, kingY = null;
    for (var j = 0; j < CHAT.length; j++) {
      var kr = eo(seg(t, rows[j], rows[j] + .22)); if (kr <= 0) continue;
      var above = 0; for (var q = j + 1; q < CHAT.length; q++) above += eo(seg(t, rows[q], rows[q] + .22)) * (CHAT[q].length * LH + GAP);
      var hgt = CHAT[j].length * LH, ytop = yb - hgt - above + (1 - kr) * 40;
      if (ytop < 610) continue;
      var nrr = NOREC; NOREC = nrr || kr < .999;
      g.save(); g.globalAlpha *= kr * clamp((ytop - 610) / 60, 0, 1);
      disc(g, 582, ytop + 24, 19, CHATC[j]); disc(g, 582, ytop + 20, 7, 'rgba(255,255,255,.7)');
      var wmax = 0; CHAT[j].forEach(function (s, li) { wmax = Math.max(wmax, shadowText(g, s, 612, ytop + 24 + li * LH, 40, { col: '#fff', align: 'left', wt: 700, ls: 0 })); });
      if (612 + wmax + 40 < 922) smiley(g, 612 + wmax + 30, ytop + 22, 15);
      g.restore(); NOREC = nrr;
      if (j === 2) kingY = ytop + 24;
    }
    /* VIEW LIVESTREAM (R3), bottom right, white type like the frames */
    var kv = seg(t, T.k51 - .2, T.k51);
    if (kv > 0) { g.save(); g.globalAlpha *= kv; var vw = shadowText(g, 'VIEW LIVESTREAM', 868, 1392, 46, { col: '#fff', align: 'right', ls: 0 }); g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(900, 1392, 23, 0, TAU); g.stroke(); M2(g, 'R3', 900, 1394, 30, { col: '#fff', align: 'center', ls: 0 }); g.restore();
      if (t >= T.viewW - .05) { var kr2 = eo(seg(t, T.viewW - .05, T.viewW + .2)); g.save(); g.strokeStyle = SUN; g.lineWidth = 8; g.globalAlpha *= clamp(kr2 * 2, 0, 1); rr(g, 868 - vw - 30 - 16 * (1 - kr2), 1392 - 46 - 10 * (1 - kr2), vw + 110 + 32 * (1 - kr2), 92 + 20 * (1 - kr2), 46); g.stroke(); g.restore(); } }
    /* our marks: a ring round KING OF TRUNK on "king" */
    if (kingY != null && t >= T.kingW) { var kk = eo(seg(t, T.kingW, T.kingW + .22)); g.save(); g.strokeStyle = SUN; g.lineWidth = 8; g.globalAlpha *= clamp(kk * 2, 0, 1); rr(g, 562 - 10 * (1 - kk), kingY - 38, 364 + 20 * (1 - kk), 76, 38); g.stroke(); g.restore(); }
    /* our readings: cream stickers on the left, leader lines to what they read */
    sticker(g, '2 STARS', 270, 600, 72, seg(t, T.copsW - .25, T.copsW) * (1 - seg(t, T.k51 - .2, T.k51 - .05)), 638, 506);
    var k5 = seg(t, T.k51 - .15, T.k51 - .03) * (1 - seg(t, T.k53, T.k53 + .08));
    sticker(g, '≈51,000', 300, 640, 96, k5, 650, 588);
    var k6 = seg(t, T.k53 + .02, T.k53 + .2);
    sticker(g, '≈53,000', 300, 640, 96, k6, 650, 588);
    var kd = seg(t, T.copsIn + .3, T.copsIn + .5); if (kd > 0) { g.save(); g.globalAlpha *= kd; chip(g, 'RE-DRAWN · 18:24', 250, 1392, 36, SUN, INK, { rot: -.02 }); g.restore(); }
    g.restore(); NOREC = nr;
  }

  /* ---------- the re-hook: "first stream!!!" while 53k are live; his selfie on our phone ---------- */
  function firstBeat(g, t) {
    var k = eo(seg(t, T.firstIn - .05, T.firstIn + .25)), ko = eio(seg(t, T.voteIn - .05, T.voteIn + .25)); if (k <= 0 || ko >= 1) return;
    var nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    g.save(); g.translate(0, 1500 * (1 - k) - 1700 * ko);
    var u = U.self2;
    phone(g, PHF, t, feedUse(u, t, { credY: 26, after: function (gg, x, y, w, h, tt) {
      var p = track(u, tt, PH_SELF2), q = CLIP.toScreen(u, tt, p[0], p[1], x, y, w, h); ring(gg, q[0], q[1], 56, seg(t, T.firstIn + .2, T.firstIn + .45));
    } }), { rot: .03 });
    var kf = eo(seg(t, T.firstW - .1, T.firstW + .12));
    if (kf > 0) { var nrf = NOREC; NOREC = nrf || kf < .999; g.save(); g.translate(CX, 700); g.scale(lerp(1.4, 1, kf), lerp(1.4, 1, kf)); g.globalAlpha *= clamp(kf * 2, 0, 1);
      var fw = tw('first stream!!!', 84, 'condensed', 700) + 150; rr(g, -fw / 2, -66, fw, 132, 66); g.fillStyle = 'rgba(8,6,18,.82)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3; g.stroke();
      disc(g, -fw / 2 + 64, 0, 34, '#ffc94a'); disc(g, -fw / 2 + 64, -6, 12, 'rgba(255,255,255,.7)');
      T2(g, 'first stream!!!', -fw / 2 + 116, 0, 84, { col: '#fff', align: 'left', wt: 700, ls: 0 }); g.restore(); NOREC = nrf; }
    var kb = eo(seg(t, T.f53 - .05, T.f53 + .15));
    if (kb > 0) { var nrb = NOREC; NOREC = nrb || kb < .999; g.save(); g.translate(CX, 528); var s = lerp(1.6, 1, kb) * kn(t, T.f53 + .15, .1); g.scale(s, s); g.globalAlpha *= clamp(kb * 2, 0, 1); liveBadge(g, 0, 0, 104, '53k'); g.restore(); NOREC = nrb; }
    var kt = seg(t, T.firstIn + .25, T.firstIn + .45); if (kt > 0) { g.save(); g.globalAlpha *= kt; chip(g, 'RE-DRAWN · 18:28', 760, 788, 36, SUN, INK, { rot: -.02 }); g.restore(); }
    g.restore(); NOREC = nr;
  }
  /* Rockstar's own line, small, from the re-hook to the loop */
  function inGame(g, t) {
    var k = seg(t, T.firstIn + .25, T.firstIn + .45), ko = seg(t, T.seamIn - .1, T.seamIn + .1); if (k <= 0 || ko >= 1) return;
    g.save(); g.globalAlpha *= k * (1 - ko); var w = M2(g, 'IN-GAME FOOTAGE · ROCKSTAR', -999, -999, 36, { ls: 0 });
    rr(g, CX - w / 2 - 22, 1400 - 30, w + 44, 60, 10); g.fillStyle = 'rgba(8,6,18,.82)'; g.fill(); M2(g, 'IN-GAME FOOTAGE · ROCKSTAR', CX, 1402, 36, { col: CREAM, align: 'center', ls: 0 }); g.restore();
  }

  /* ---------- the vote ---------- */
  function vote(g, t) {
    var k = eo(seg(t, T.voteIn - .05, T.voteIn + .25)), ko = eio(seg(t, T.seamIn, T.seamIn + .3)); if (k <= 0 || ko >= 1) return;
    var nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    g.save(); g.translate(0, 1500 * (1 - k) - 1700 * ko);
    var wq = tw('WATCH HIM?', 140) + 80; g.save(); g.translate(CX, 640); g.rotate(-.02); rr(g, -wq / 2 + 6, -96, wq, 192, 14); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, -wq / 2, -102, wq, 192, 14); g.fillStyle = CREAM; g.fill(); g.restore();
    T2(g, 'WATCH HIM?', CX, 634, 140, { col: INK, max: 760 });
    function btn(x, s, kk, col) { if (kk <= 0) return; g.save(); g.translate(x, 1120); var sc = lerp(.6, 1, kk) * kn(t, 0, 0); g.scale(sc, sc); g.globalAlpha *= clamp(kk * 2, 0, 1); rr(g, -170, -150, 340, 300, 30); g.fillStyle = col; g.fill(); T2(g, s, 0, 0, 140, { col: '#fff' }); g.restore(); }
    btn(320, 'YES', eo(seg(t, T.voteIn + .2, T.voteIn + .4)), '#1f9d5a'); btn(700, 'NO', eo(seg(t, T.voteIn + .32, T.voteIn + .52)), RED);
    g.restore(); NOREC = nr;
  }

  /* =====================================================================================================
     PROPS by time
     ===================================================================================================== */
  function hookPhone(g, t) {
    if (t < T.stealIn + .35) {
      var ko = eio(seg(t, T.stealIn + .05, T.stealIn + .35)), u = U.hook;
      var nr = NOREC; NOREC = nr || ko > 0;
      g.save(); g.translate(0, -1700 * ko);
      phone(g, PH0, t, feedUse(u, t, { after: function (gg, x, y, w, h, tt) {
        var p = track(u, tt, PH_TRUNK), q = CLIP.toScreen(u, tt, p[0], p[1], x, y, w, h);
        ring(gg, q[0], q[1], 52, seg(t, T.ringA, T.ringA + .25));
        arrowAt(gg, t, q[0], q[1] - 80, 1 - seg(t, T.ringA, T.ringA + .2));
      } }), { rot: -.02 * (1 - eio(seg(t, 0, 1.2))) });
      payoff(g, t);
      g.restore(); NOREC = nr;
    }
    if (t >= T.seamIn) {
      var ks = eo(seg(t, T.seamIn, T.seamIn + .3)), nrs = NOREC, us = U.seam; NOREC = nrs || ks < .999;
      g.save(); g.translate(0, 1700 * (1 - ks));
      phone(g, PH0, t, feedUse(us, t, { after: function (gg, x, y, w, h, tt) { var p = track(us, tt, PH_TRUNK), q = CLIP.toScreen(us, tt, p[0], p[1], x, y, w, h); arrowAt(gg, t, q[0], q[1] - 80, 1); } }), { rot: -.02 * ks });
      g.restore(); NOREC = nrs;
    }
  }
  /* between the two clips, on "He goes live.": our own drawn go-live screen (a record dot and a filling ring, no UI text) */
  function goLiveScreen(t) {
    return function (g, x, y, w, h) {
      var cx = x + w / 2, cy = y + h / 2, k = seg(t, T.gapIn, T.askIn - .1);
      var bg = g.createRadialGradient(cx, cy, 20, cx, cy, h * .7); bg.addColorStop(0, '#2a0f1c'); bg.addColorStop(1, '#0b0610'); g.fillStyle = bg; g.fillRect(x, y, w, h);
      g.save(); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 16; g.beginPath(); g.arc(cx, cy, 170, 0, TAU); g.stroke();
      g.strokeStyle = '#ff3344'; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy, 170, -Math.PI / 2, -Math.PI / 2 + TAU * eo(k)); g.stroke(); g.restore();
      var pulse = 1 + .08 * Math.sin(t * 14); disc(g, cx, cy, 96 * pulse, '#e3262f'); disc(g, cx - 26, cy - 26, 22, 'rgba(255,255,255,.35)');
    };
  }
  function selfiePhone(g, t) {
    var kin = eo(seg(t, T.selfIn - .05, T.selfIn + .25)), kout = eio(seg(t, T.copsIn - .1, T.copsIn + .2)); if (kin <= 0 || kout >= 1) return;
    var nr = NOREC, u = t < T.askIn ? U.self : U.ask; NOREC = nr || kin < .999 || kout > 0;
    g.save(); g.translate(0, 1500 * (1 - kin) - 1700 * kout);
    if (t >= T.gapIn && t < T.askIn) phone(g, PHM, t, goLiveScreen(t)); else phone(g, PHM, t, feedUse(u, t, { after: function (gg, x, y, w, h, tt) {
      if (u !== U.self) return;
      var p = track(u, tt, PH_SELF), q = CLIP.toScreen(u, tt, p[0], p[1], x, y, w, h);
      ring(gg, q[0], q[1], 66, seg(t, T.strm - .1, T.strm + .15));
    } }), { rot: .02 });
    /* our stickers, outside the phone: GOES LIVE (below), then his own line (above, from 18:20) */
    var kl = eo(seg(t, T.goLive, T.goLive + .16));
    if (kl > 0) { var nrl = NOREC; NOREC = nrl || kl < .999; g.save(); g.translate(CX, 1386); var sc = lerp(1.5, 1, kl) * kn(t, T.goLive + .16, .08); g.scale(sc, sc); g.globalAlpha *= clamp(kl * 2, 0, 1); chip(g, 'HE GOES LIVE', 0, 0, 66, CREAM, INK, { rot: -.03 }); g.restore(); NOREC = nrl; }
    var kq = eo(seg(t, T.askIn + .05, T.askIn + .25));
    if (kq > 0) { var nrq = NOREC; NOREC = nrq || kq < .999; g.save(); g.translate(CX, 520); var sq = lerp(1.4, 1, kq); g.scale(sq, sq); g.globalAlpha *= clamp(kq * 2, 0, 1); chip(g, '“CHAT, WHAT DO I DO?”', 0, 0, 62, SUN, INK, { rot: .02 }); g.restore(); NOREC = nrq; }
    g.restore(); NOREC = nr;
  }
  function props(g, t) {
    hookPhone(g, t);
    stealProps(g, t, SC);
    selfiePhone(g, t);
    overlay(g, t, SC);
    firstBeat(g, t);
    vote(g, t);
    inGame(g, t);
    if (t < T.seamIn) hookTitle(g, t, 1 - eio(seg(t, T.titleOut, T.titleOut + .3)));
    if (t >= T.seamIn) hookTitle(g, t, eo(seg(t, T.seamIn, T.seamIn + .3)));
  }
  function posterTitle(g) {
    var w = tw('STREAMER IN THE TRUNK', 92) + 50; rr(g, CX - w / 2, 300, w, 120, 12); g.fillStyle = CREAM; g.fill();
    T2(g, 'STREAMER IN THE TRUNK', CX, 360, 92, { col: INK, max: 800 });
    chip(g, 'GTA 6', 220, 290, 56, PINK, CREAM, { rot: -.05 });
  }

  /* =====================================================================================================
     CAPTIONS: cream tape near the top of the safe box, phrase by phrase (hook and end lines have their own boards)
     ===================================================================================================== */
  var BREAK = { ask: ['chat'], live: ['what'], count: ['shows'], chat: ['him'], button: ['button:'], first: ['typed:'] };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'end') return;
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!]["”]?$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS = [], CAPY = 372, CUTS = [], SWIPES = [];
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function captions(g, t) {
    t = tq(t);
    var c0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { c0 = c; ci = i; } });
    if (!c0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.voteIn, nd = T.voteIn - .1;
    var end = Math.min(c0.t1 + .55, ns, nd - .15);
    for (var bi = 0; bi < CUTS.length; bi++) if (CUTS[bi] > c0.s + .2) { end = Math.min(end, CUTS[bi] - .02); break; }
    if (t >= end) return;
    var k = cd(t, c0.s, 16), ko = 1 - seg(t, end - .06, end);
    g.save(); g.globalAlpha *= ko; cond(g, 'condensed'); var cpx = 72; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = c0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws, gap, lines, lw, maxw = 780, br = BREAK[c0.id] || [];
    function meas() { ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; }
    function lay() {
      lines = [[]];
      words.forEach(function (w, i) { lines[lines.length - 1].push(i); if (br.indexOf(w.w.toLowerCase()) >= 0 && i < words.length - 1) lines.push([]); });
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    meas(); lay();
    while (Math.max.apply(null, lw) - gap > maxw && cpx > 52) { cpx -= 4; font(g, cpx, 900); meas(); lay(); }
    var lh = cpx * 1.3, y0 = CAPY - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw0 = lw[li] - gap, x = CX - tw0 / 2, y = y0 + li * lh + (1 - k) * 26, r = mulberry(Math.round(c0.t0 * 100) + li * 7);
      var x0 = x - 22, x1 = x + tw0 + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CX, y); g.rotate(rot); g.translate(-CX, -y);
      g.save(); g.shadowColor = 'rgba(0,4,20,.55)'; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 6; g.fillStyle = CREAM; rr(g, x0, yt, x1 - x0, yb - yt, 6); g.fill(); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .25;
        if (cur) { g.save(); g.fillStyle = SUN; g.fillRect(x - 6, y - cpx * .78, ws[i] + 12, cpx * .98); g.restore(); }
        var isG = /^GTA$/.test(up[i]); g.fillStyle = isG ? PINK : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }

  /* =====================================================================================================
     FRAME
     ===================================================================================================== */
  var POSTERMODE = false, STAGEC = '#0a0618';
  function stage(g) { g.fillStyle = STAGEC; g.fillRect(0, 0, W, H); }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1 + 20); else g.rect(-500, -500, 2080, BY1 + 520); g.clip(); }
  function plateLayer(g, t) {
    var u = CLIP.activePlate(t); if (!u) return;
    var k = seg(t, u.t0, u.t0 + .25) * (1 - seg(t, u.t1 - .25, u.t1));
    g.save(); g.globalAlpha = k; CLIP.plate(g, t, 0, 0, W, H, { dim: .5, blur: 2 }); g.restore();
  }
  function push(t) { if (t < 1.2) return 1 + .03 * (1 - eio(seg(t, 0, 1.2))); if (t >= T.seamIn) return 1 + .03 * eio(seg(t, T.seamIn, DUR)); return 1; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    SC = sceneState(t);
    if (LIVE2.bg) { g.drawImage(BG, 0, 0); plateLayer(g, t); if (SC) sceneLayer(g, t, SC); }
    var ddx = 3 * osc(t, 13, .3), ddy = 3 * osc(t, 11, 2.1), ps = push(t);
    g.save(); railClip(g); g.translate(510 + ddx, 900 + ddy); g.scale(ps, ps); g.translate(-510, -900);
    props(g, t); g.restore();
    if (!POSTERMODE && LIVE.text) { captions(g, t); }
    if (POSTERMODE) posterTitle(g);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('title', 'STREAMER IN THE TRUNK', 0, T.titleOut + .15); Tx('title', 'STREAMER IN THE TRUNK', T.seamIn + .3, DUR + 1);
    Tx('gta6', 'GTA 6', 0, T.titleOut + .15); Tx('gta6', 'GTA 6', T.seamIn + .3, DUR + 1);
    Tx('l51', 'LIVE 51k', T.payW + .1, T.stealIn + .2); Tx('l51', 'LIVE 51k', T.k51 + .1, T.k53);
    Tx('redraw', 'RE-DRAWN · 18:24', T.payW + .1, T.stealIn + .2); Tx('redraw', 'RE-DRAWN · 18:24', T.copsIn + .4, T.firstIn);
    Tx('stolen', 'STOLEN', T.stolen + .1, T.selfIn);
    Tx('inhere', 'HIM', T.hesW - .42, T.selfIn + .25);
    Tx('golive', 'HE GOES LIVE', T.goLive + .1, T.copsIn + .1);
    Tx('quote', '“CHAT, WHAT DO I DO?”', T.askIn + .1, T.copsIn + .2);
    Tx('stars', '2 STARS', T.copsW - .2, T.k51 - .08);
    Tx('n51', '≈51,000', T.k51 - .05, T.k53 + .04);
    Tx('l53', 'LIVE 53k', T.k53 + .1, T.firstIn);
    Tx('n53', '≈53,000', T.k53 + .15, T.firstIn);
    Tx('dayum', 'dayum', T.chatIn + .2, T.firstIn);
    Tx('bro', 'Bro loves attention lol', T.chatW + .3, T.firstIn);
    Tx('king', 'KING OF TRUNK!!!', T.kingW + .1, T.firstIn);
    Tx('tuff', "That's tuff", T.kingW + .7, T.firstIn);
    Tx('view', 'VIEW LIVESTREAM', T.k51, T.firstIn);
    Tx('firstc', 'first stream!!!', T.btnIn + .5, T.firstIn); Tx('firstc', 'first stream!!!', T.firstW + .05, T.voteIn + .05);
    Tx('l53', 'LIVE 53k', T.f53 + .1, T.voteIn + .05);
    Tx('redraw2', 'RE-DRAWN · 18:28', T.firstIn + .4, T.voteIn + .05);
    Tx('ingame', 'IN-GAME FOOTAGE · ROCKSTAR', T.firstIn + .35, T.seamIn);
    Tx('which', 'WATCH HIM?', T.voteIn + .2, T.seamIn + .1);
    Tx('yes', 'YES', T.voteIn + .3, T.seamIn + .1); Tx('no', 'NO', T.voteIn + .42, T.seamIn + .1);
    return o;
  }

  /* ---------- times, clips and sound events, all from the voice ---------- */
  function initTimes() {
    T.ringA = .5; T.payW = .95;
    T.titleOut = start('steal') - .55;
    T.stealIn = start('steal') - .1; T.stolen = at('steal', 'steals'); T.trunkW = at('steal', 'trunk'); T.hesW = at('steal', "he's");
    T.selfIn = start('live') - .1; T.strm = at('live', 'streamers'); T.goLive = at('live', 'do') + .32; T.askIn = start('ask') - .2; T.gapIn = at('live', 'he', 1) - .05;
    T.copsIn = start('cops') - .2; T.copsW = at('cops', 'cops');
    T.k51 = at('count', 'live'); T.k53 = at('more', '53');
    T.chatIn = start('chat') - .15; T.chatW = at('chat', 'chat'); T.kingW = at('chat', 'king');
    T.btnIn = start('button') - .1; T.btnW = at('button', 'button'); T.viewW = at('button', 'view');
    T.firstIn = start('first') - .25; T.firstW = at('first', 'first'); T.f53 = at('first', '53');
    T.voteIn = start('end') - .15;
    T.seamIn = at('end', 'again') - .05;
    CLIP.reset();
    U.hook = CLIP.use('trunk', 0, T.stealIn + .35, { from: 0, speed: .55, zoom: [1.2, 1.6], focus: [.42, .64], note: 'hook: him lying in the open trunk, then up with his phone (1092.0-1093.6 s), arrow + ring, STREAMER IN THE TRUNK, LIVE 51k RE-DRAWN' });
    U.self = CLIP.use('selfie', T.selfIn - .05, T.gapIn, { from: 0, speed: Math.min(1, 3.9 / (T.gapIn - T.selfIn + .05)), zoom: [1.0, 1.06], focus: [.74, .45], note: 'goes live: him filming himself (1095.4-1099.3 s), phone ringed + HIS PHONE tag, GOES LIVE chip' });
    U.ask = CLIP.use('selfie2', T.askIn, T.copsIn + .2, { from: 0, speed: Math.min(1, 2.0 / (T.copsIn - T.askIn + .2)), zoom: [1.0, 1.06], focus: [.5, .45], note: 'he asks his chat (1100.0-1102.0 s: "chat, what do I do?") on our phone, his quote as a sticker above it' });
    U.self2 = CLIP.use('selfie2', T.firstIn - .05, T.voteIn + .25, { from: 2.05, speed: Math.min(1, 1.8 / (T.voteIn - T.firstIn + .3)), zoom: [1.0, 1.04], focus: [.5, .5], note: 'first stream: his selfie (1102.05-1103.85 s, slowed) on our phone under the re-drawn chat line and LIVE 53k' });
    U.seam = CLIP.use('trunk', T.seamIn, DUR + .02, { from: 0, speed: .05, zoom: [1.2, 1.2], focus: [.42, .64], note: 'loop seam: frame-0 layout returns (STREAMER IN THE TRUNK), arrow on him' });
    function plate(name, t0, t1) { var c = CLIP.manifest().clips[name], span = c.frames / 30 - .04; return CLIP.use(name, t0, t1, { plate: true, from: 0, speed: Math.min(1, span / (t1 - t0)), zoom: [1.1, 1.0], focus: [.5, .5], note: 'background plate' }); }
    plate('pbike', T.voteIn - .1, T.seamIn + .3);
    /* sound: hits sit in the voice's pauses; the stream has its own native sounds (a notification ping, chat ticks) */
    G('f0', 0, 'slap', .05, 1.15);
    G('ring', T.ringA, 'tock', .3, 1);
    G('pay', T.payW, 'ping', .5, .9);
    G('sw1', T.stealIn, 'swish', .2, .9);
    G('stolen', T.stolen, 'slap', .35, 1);
    G('lid', T.hesW - .6, 'tock', .3, .9);
    G('sw2', T.selfIn, 'swish', .2, .9);
    G('golive', T.goLive, 'ping', .35, .9);
    G('ask', T.askIn + .05, 'tock', .3, .8);
    G('sw3', T.copsIn, 'swish', .2, .9);
    G('siren', T.copsW - .35, 'chirp', .4, 1);
    G('st4', T.copsW, 'pop', .35, .9); G('st5', T.copsW + .1, 'pop', .35, .9);
    G('k51', T.k51, 'ping', .4, .9);
    G('k53', T.k53, 'ping', .4, .9);
    [T.chatIn + .05, T.chatW + .15, T.kingW - .08, T.kingW + .55, T.btnIn + .35].forEach(function (c, i) { G('c' + i, c, 'ctick', .35, .8); });
    G('btn', T.viewW, 'tock', .35, 1);
    G('sw5', T.firstIn, 'swish', .2, .9);
    G('first', T.firstW, 'ctick', .4, 1);
    G('f53', T.f53, 'ping', .4, .9);
    G('vote', T.voteIn, 'swish', .2, .9);
    G('seam', T.seamIn, 'swish', .3, .8);
    CUTS = [T.stealIn, T.selfIn, T.copsIn, T.firstIn, T.voteIn, T.seamIn]; SWIPES = CUTS.slice();
    STRESS = [at('steal', 'steals'), at('steal', 'trunk'), at('live', 'live'), at('ask', 'chat'), at('cops', 'real'), at('count', '51'), at('more', '53'), at('chat', 'king'), at('button', 'view'), at('first', 'first'), at('first', '53')];
    EV.sort(function (a, b) { return a.t - b.t; });
  }
  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    /* swipes render sharp (no motion-blur smear of a whole layout); everything else keeps its blur */
    for (var si = 0; si < SWIPES.length; si++) if (t > SWIPES[si] - .02 && t < SWIPES[si] + .4) { samples = 1; break; }
    if (samples === 1) { POSTERMODE = t === window.FILM.POSTER; frame(ctx, t); POSTERMODE = false; return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) { frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR)); actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0); }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .8;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -8; comp.ratio.value = 2; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); return o; }
    function env(pm, pts) { pm.value = pts[0][1]; pm.setValueAtTime(pts[0][1], 0); pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc2(type, f, t0, t1, pts, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function nband(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g, f) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = f || 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc2('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function slap(t, g) { thump(t, .3 * g, 240); nband(t, t + .07, 2600, 1200, .14 * g, .01 * g, .9); tick(t, 1.1 * g, 2000); }
    function tock(t, g) { tick(t, .7 * g, 2600); thump(t, .12 * g, 520); }
    function swish(t, g) { nband(t, t + .2, 900, 3600, .2 * g, .03 * g, .8); }
    function pop(t, g) { var o = osc2('sine', 520, t, t + .12, [[t, 0], [t + .004, .18 * g], [t + .1, 0]]); o.frequency.exponentialRampToValueAtTime(880, t + .08); tick(t, .5 * g, 3000); }
    /* the channel switch: a burst of TV static and a little CRT thunk */
    function fizz(t, g) { var o = bus(1), hp2 = ac.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 2400; var n = noise(t, .26); n.connect(hp2); hp2.connect(o); env(o.gain, [[t, 0], [t + .01, .12 * g], [t + .2, .05 * g], [t + .25, 0]]); thump(t, .14 * g, 180); }
    /* the short switch: a hard static burst and a CRT thunk that fits in the voice's short pauses */
    function flick(t, g) { var o = bus(1), hp2 = ac.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 1800; var n = noise(t, .08); n.connect(hp2); hp2.connect(o); env(o.gain, [[t, 0], [t + .004, .2 * g], [t + .05, .09 * g], [t + .075, 0]]); thump(t, .22 * g, 200); }
    function ping(t, g) { [1568, 2093].forEach(function (f, i) { var t0 = t + i * .07; osc2('sine', f, t0, t0 + .26, [[t0, 0], [t0 + .005, .16 * g], [t0 + .24, 0]]); }); }
    function ctick(t, g) { tick(t, .5 * g, 4200); osc2('sine', 1250, t, t + .05, [[t, 0], [t + .003, .06 * g], [t + .04, 0]]); }
    function chirp(t, g) { var o = osc2('triangle', 700, t, t + .42, [[t, 0], [t + .02, .06 * g], [t + .32, .06 * g], [t + .4, 0]]); o.frequency.linearRampToValueAtTime(1500, t + .18); o.frequency.linearRampToValueAtTime(700, t + .38); }
    var LEVEL = { tock: 2, slap: 3, swish: 3, pop: 2, fizz: 2.5, flick: 3, ping: 2, ctick: 2, chirp: 2 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = { tock: -18, slap: -14, swish: -16, pop: -16, fizz: -16, flick: -15, ping: -20, ctick: -21, chirp: -24 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      ({ slap: slap, tock: tock, swish: swish, pop: pop, fizz: fizz, flick: flick, ping: ping, ctick: ctick, chirp: chirp })[e.type](e.t, g);
    });
    /* no music: Isac adds a platform sound; the film ships voice + sound effects */
    var MUSIC = false; if (MUSIC) { /* intentionally empty */ }
    (function () { var o = bus(1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = .5; var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = window.ROOM_GAIN || .03; })();
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 40px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0?“…↑&\''); }))).then(function () { return document.fonts.ready; }).then(function () {
      BG = buildBG(); SCENE = buildScene(); EV.length = 0; initTimes();
      window.FILM.POSTER = Math.round((T.kingW + .75) * 30) / 30 + 1 / 60;
      window.FILM.SHOTS = [
        { id: 'hook', name: 'Streamer in the trunk', t0: 0, t1: start('steal') },
        { id: 'steal', name: 'Stolen car', t0: start('steal'), t1: start('live') },
        { id: 'live', name: 'He goes live', t0: start('live'), t1: start('ask') },
        { id: 'ask', name: 'Chat, what do I do?', t0: start('ask'), t1: start('cops') },
        { id: 'cops', name: 'Real cops', t0: start('cops'), t1: start('count') },
        { id: 'count', name: 'LIVE 51k, 53k', t0: start('count'), t1: start('chat') },
        { id: 'chat', name: 'King of trunk', t0: start('chat'), t1: start('button') },
        { id: 'button', name: 'View livestream', t0: start('button'), t1: start('first') },
        { id: 'first', name: 'First stream', t0: start('first'), t1: start('end') },
        { id: 'end', name: 'Would you watch?', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-trunkstream', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 3; var bad = [], n = Math.round(DUR * fps), span = .5 / fps;
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0a) + Math.abs(d[i + 1] - 0x06) + Math.abs(d[i + 2] - 0x18) > 24) o.c++; return o; }
    for (var i = 0; i < n; i++) for (var s = 0; s < subs; s++) {
      var t = (i + .5) / fps - span / 2 + span * (s + .5) / subs; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 300, 90, H - 300), R0 = dirty(930, 300, 150, H - 300), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) { bad.push({ f: i, t: +t.toFixed(3), left: L0.c, right: R0.c, bottom: B0.c }); break; }
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; LIVE.text = lt; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
