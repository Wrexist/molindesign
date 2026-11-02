/* "Why 'think step by step' helps AI" — Factory #19 on Tech, explained (How AI works), after ../voiceclone/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the answer strip: a cardboard box (re-created GPT-3 output from Kojima et al. 2022, Fig. 1) prints a
   cream receipt, one torn tab per step, then its ANSWER row; the tabs are fed back into its intake. One hero stamp:
   STEPS FIRST (coral); coral is also on the end card's YES / NO and nowhere else. Cut-paper props, no logos, no real UI. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', INK = '#211d26', PENCIL = '#3c3946', GRAPHITE = '#d9d3c6', GRAPH_D = '#b9b4ab';
  var CARD = '#c8a273', CARD_D = '#a7814f', CARD_L = '#d9b88b';
  var TAPE = '#f4eddc', TAPE_D = '#ddd2ba', PANEL = '#e2dac8', PANEL_D = '#c4b99f';
  var BALL = '#b3a385', GOLF = '#f6f1e5', BLUE = '#8fa2b8';
  var DISP = 'Archivo', MONO = '"Geist Mono"', SERIF = '"Instrument Serif"';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function ein(k) { return k * k * k; }
  function eout(k) { return 1 - Math.pow(1 - k, 3); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .85); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .85), 0, 1.04); }
  function fin(t, a, f) { return clamp(sp(t, a, f || 3) * 2, 0, 1); }
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

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
  function start(id) { return LINE[id].t0; }
  function lend(id) { var ws = LINE[id].words; return ws[ws.length - 1].t1; }

  /* ---------- key times ---------- */
  var K = {
    lets: at('hook', 'lets'), think: at('hook', 'think'), step1: at('hook', 'step'), by: at('hook', 'by'), step2: at('hook', 'step', 1),
    they: start('jump'), y2022: at('jump', '2022'), n18: at('jump', '18'), n79: at('jump', '79'),
    so: start('ask'), help: at('ask', 'help'),
    sixteen: start('balls'), golf: at('balls', 'golf'),
    blue: at('eight', 'blue'), said: at('eight', 'said'), eightEnd: lend('eight'),
    wth: start('four'), wrote: at('four', 'wrote'), four: at('four', '4'),
    each: start('input'), goes: at('input', 'goes'),
    hero: start('hero'), answer: at('hero', 'answer'), inV: at('hero', 'in'), heroEnd: lend('hero'),
    after: start('after'), afterW: at('after', 'after'), no: at('after', 'no'),
    newer: start('newer'), doW: at('newer', 'do'), own: at('newer', 'own'),
    end: start('end'), yes: at('end', 'yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  K.cut = 1.9; K.qOut = 2.2;   /* the 18% RIGHT → ? chip stays readable for 2.3 s, then the bars build */   /* 5 WORDS leaves on a hard cut in the gap after the hook (heard to ≈ 1.43 s); the jump caption follows */
  K.tiles = [K.lets, K.think, K.step1, K.by, K.step2];
  /* the hits are placed from the heard words before anything is timed off them (see the SFX gate below) */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  if (!EDGES.length) VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 + .15 }); EDGES.push(w.t0, w.t1 + .15); }); });
  var BODY = { thump: .16, knock: .15, swish: .2, pop: .06 };
  var GT = {}, GS = [];
  (function () {
    var s1 = nearGap(K.eightEnd + .3, 'knock', .2); GT.knock = s1 === null ? K.eightEnd + .3 : s1;
    var s0 = nearGap(K.heroEnd + .2, 'thump', .2); GT.slam = s0 === null ? K.heroEnd + .2 : s0;
  })();
  /* the hero hold ends: a torn edge falls top to bottom, accelerating, so the stamp goes last. It stays up ≥ 1.6 s. */
  K.tearA = Math.max(K.after - .05, GT.slam + 1.33);   /* the hold is ≥ 1.2 s; the wipe starts before "Steps" */
  /* wipe 2 rides a paper swish in the silence before "Newer" (same axis) */
  (function () { var sw = nearGap(K.newer - .55, 'swish', .18); GT.swish = sw === null ? K.newer - .55 : sw; })();
  K.tearB = GT.swish + .05;   /* the edge starts falling just after the swish begins */
  /* the end card's chips rise with a soft pop in the silence after "on their own." */
  (function () { var pp = nearGap(lend('newer') + .5, 'pop', .18); GT.pop = pp === null ? lend('newer') + .5 : pp; })();
  K.outro = GT.pop - .16;

  /* scenes. swipe:true = the next scene comes in above the falling torn edge, drawn complete */
  var SC = [
    { id: 'desk', fn: 'desk', name: 'Five words', t0: 0 },
    { id: 'after', fn: 'after', name: 'Steps after', t0: K.tearA + .8, swipe: true, sw: .8 },
    { id: 'newer', fn: 'newer', name: 'Reasoning models', t0: K.tearB + .6, swipe: true, sw: .6 },
    { id: 'outro', fn: 'outro', name: 'Yes or no', t0: K.outro }
  ];
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS;

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, MC, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- measuring: the safe area (BOUNDS_RUN), what is readable (TEXTS → readcheck) and labels vs props (LABELS_RUN) ---------- */
  var BOUNDS = null, REC = null, PROPS = null, LBL = null, INCOMING = false, CURT = 0, NOREC = false, ONPROP = false, CHIPBOX = null, COVTOP = -1e9, INTOP = -1e9;
  var SAFE = { x0: 95, x1: 925, y1: 1450 };
  function xbox(g, x0, y0, x1, y1) {
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
  }
  function recBound(g, b, text) {
    if (!BOUNDS || INCOMING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    if (b[0] < SAFE.x0 - .5 || b[2] > SAFE.x1 + .5 || b[3] > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(b[0]), x1: Math.round(b[2]), y1: Math.round(b[3]) });
  }
  function recBox(g, x0, y0, x1, y1, text) { if (BOUNDS) recBound(g, xbox(g, x0, y0, x1, y1), text); }
  function prop(g, name, x0, y0, x1, y1) {
    if (!PROPS || INCOMING || (g !== ctx && g !== tctx)) return;
    var b = xbox(g, x0, y0, x1, y1); if (b[1] < COVTOP) return; PROPS.push({ name: name, b: b });
  }
  /* readable = fully opaque and on the visible side of the falling torn edge: below it for the outgoing scene, wholly
     above it for the incoming one (the next scene is drawn complete above the edge) */
  function seen(g, text, b) {
    var vis = (INCOMING ? b[3] <= INTOP : b[1] >= COVTOP) && !NOREC && g.globalAlpha >= .95 && (g === ctx || g === tctx);
    if (REC && vis) REC[text] = 1;
    if (LBL && vis && !ONPROP) LBL.push({ text: text, b: CHIPBOX || b });
  }
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS || REC || LBL) {
        var mm = this.measureText(str), b = xbox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent);
        recBound(this, b, str); seen(this, str, b);
      }
      return orig.apply(this, arguments);
    };
  }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function poly(g, P) { g.beginPath(); P.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  /* a cut-paper shape: a polygon whose straight edges wobble a little (seeded), like scissors */
  function cut(g, pts, r, amp) {
    g.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 22));
      for (var k = 0; k < n; k++) { var f = k / n; g.lineTo(lerp(a[0], b[0], f) + (r() - .5) * amp, lerp(a[1], b[1], f) + (r() - .5) * amp); }
    }
    g.closePath(); g.fill();
  }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt, o.fam); if (o.wd) wide(g); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw + pad * 2 > o.maxw && px > 36) { px -= 2; font(g, px, o.wt, o.fam); if (o.wd) wide(g); tw = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, px, o.wt, o.fam); if (o.wd) wide(g);
    CHIPBOX = (o.bg || o.line) && LBL ? xbox(g, -w / 2, -h / 2, w / 2, h / 2) : null;
    g.fillText(text, 0, px * .04); CHIPBOX = null; g.restore(); ls(g, 0);
    return w;
  }
  /* one line of type, shrunk to fit maxw; never under 36 px unless asked */
  function txt(g, text, x, y, px, col, align, wt, fam, maxw, a, minpx) {
    a = a == null ? 1 : a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 900, fam); ls(g, 0);
    while (maxw && g.measureText(text).width > maxw && px > (minpx || 36)) { px -= 2; font(g, px, wt || 900, fam); }
    g.fillStyle = col || CREAM; g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillText(text, x, y); g.restore();
  }
  function tw(text, px, wt, fam) { font(MC, px, wt, fam); ls(MC, 0); return MC.measureText(text).width; }
  /* quiet tags (RE-CREATED, SHORTENED): cream outline, never coral */
  function tag(g, text, x, y, a, rot) { chip(g, text, x, y, { px: 36, wt: 700, fam: MONO, line: CREAM, lw: 3, fg: CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: 'rgba(21,19,27,.9)', maxw: 820 }); }

  /* ---------- the one rubber stamp: worn ink (seeded speckle), slammed ---------- */
  var STEX = {};
  function stampTex(text, col, px) {
    var key = text + col + px; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900); ls(m, 2);
    var TL = text.split('\n'), lw = Math.max.apply(null, TL.map(function (s) { return m.measureText(s).width; })), pad = px * .3, h = px * (1.05 * TL.length + .2), w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .03); rr(g, px * .14, px * .14, w - px * .28, h - px * .28, px * .08); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, px, 900); ls(g, 2); TL.forEach(function (s, i) { g.fillText(s, w / 2, h / 2 + px * .05 + (i - (TL.length - 1) / 2) * px * 1.02); });
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 140);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.9, 0, 6.283); g.fill(); }
    c.w = w + 16; c.h = h + 16; c.lines = TL; c.px = px; STEX[key] = c; return c;
  }
  function stamp(g, text, x, y, t, t0, px, col, rot, patch) {
    if (t < t0) return;
    var c = stampTex(text, col, px);
    var k = eout(seg(t, t0, t0 + .1)), s = lerp(1.35, 1, k), al = clamp(k * 3, 0, 1);
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.08 : rot); g.scale(s, s);
    var oldP = ONPROP; ONPROP = true;
    if (patch) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-c.w / 2 + 2, -c.h / 2 + 8, c.w + 4, c.h + 4); g.fillStyle = PAPER; g.fillRect(-c.w / 2 - 2, -c.h / 2 - 2, c.w + 4, c.h + 4); if (k >= 1) recBox(g, -c.w / 2 - 2, -c.h / 2 - 2, c.w / 2 + 2, c.h / 2 + 2, '[patch] ' + text.replace(/\n/g, ' ')); }
    if (k >= 1) {
      recBox(g, -c.w / 2, -c.h / 2, c.w / 2, c.h / 2, text.replace(/\n/g, ' '));
      /* each printed line of the stamp is read on its own (it is set as two big lines) */
      if (al >= 1) c.lines.forEach(function (s, i) { var ly = (i - (c.lines.length - 1) / 2) * c.px * 1.02; seen(g, s, xbox(g, -c.w / 2, ly - c.px * .55, c.w / 2, ly + c.px * .55)); });
    }
    g.drawImage(c, -c.w / 2, -c.h / 2); ONPROP = oldP; g.restore();
  }

  /* =====================================================================================================
     PROPS (all cut paper)
     ===================================================================================================== */
  function grainIn(g, x0, y0, w, h, seed) {
    var r = mulberry(seed), n = Math.floor(w * h / 160);
    g.save(); g.clip();
    for (var i = 0; i < n; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.10)'; g.fillRect(x0 + r() * w, y0 + r() * h, 1.6 + r() * 1.8, 1.6 + r() * 1.8); }
    g.restore();
  }
  /* a cut-paper sheet with a 8/11 px offset shadow and grain */
  function sheet(g, x0, y0, x1, y1, seed, col, amp, name) {
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x0 + 8, y0 + 11, x1 - x0, y1 - y0);
    g.fillStyle = col || PAPER; cut(g, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], mulberry(seed), amp == null ? 1.3 : amp);
    grainIn(g, x0, y0, x1 - x0, y1 - y0, seed + 1);
    prop(g, name || 'sheet', x0, y0, x1 + 8, y1 + 11);
  }
  function pencil(g, x0, y0, x1, y1) {
    var L = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0);
    g.save(); g.translate(x0, y0); g.rotate(ang);
    g.fillStyle = 'rgba(0,0,0,.3)'; poly(g, [[4, -9 + 10], [L - 54, -9 + 10], [L + 2, 10], [L - 54, 9 + 10], [4, 9 + 10]]); g.fill();
    g.fillStyle = '#e4b74a'; g.fillRect(0, -11, L - 56, 22);
    g.fillStyle = '#c99a2e'; g.fillRect(0, 3, L - 56, 8);
    g.fillStyle = '#d8c39a'; g.fillRect(-26, -11, 26, 22); g.fillStyle = '#b9ab98'; rr(g, -48, -11, 24, 22, 6); g.fill();
    g.fillStyle = '#e8d2aa'; poly(g, [[L - 56, -11], [L - 12, -3], [L - 12, 3], [L - 56, 11]]); g.fill();
    g.fillStyle = PENCIL; poly(g, [[L - 14, -3.4], [L, 0], [L - 14, 3.4]]); g.fill();
    g.restore();
  }
  /* a word tile: k = flip 0 (face-down, pencil-hatched back) … 1 (face-up, the word) */
  function tile(g, cx, cy, w, h, word, px, k, a) {
    if (a <= 0) return;
    var sx = Math.abs(Math.cos(Math.PI * clamp(k, 0, 1))), face = k > .5;
    g.save(); g.globalAlpha *= a == null ? 1 : a; g.translate(cx, cy); g.scale(Math.max(sx, .03), 1);
    g.fillStyle = 'rgba(0,0,0,.36)'; rr(g, -w / 2 + 6, -h / 2 + 9, w, h, 10); g.fill();
    g.fillStyle = face ? PAPER : TAPE_D; rr(g, -w / 2, -h / 2, w, h, 10); g.fill();
    if (!face) {
      g.save(); rr(g, -w / 2, -h / 2, w, h, 10); g.clip();
      g.strokeStyle = 'rgba(60,57,70,.26)'; g.lineWidth = 3;
      for (var d = 0; d < w + h; d += 15) { g.beginPath(); g.moveTo(-w / 2 + d, -h / 2); g.lineTo(-w / 2 + d - h, h / 2); g.stroke(); }
      g.restore();
      g.strokeStyle = 'rgba(33,29,38,.25)'; g.lineWidth = 2; rr(g, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 6); g.stroke();
    } else {
      while (px > 16) { font(g, px, 900); if (g.measureText(word).width <= w - 26) break; px -= 2; }
      ONPROP = true; font(g, px, 900); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(word, 0, px * .05); ONPROP = false;
    }
    prop(g, 'tile', -w / 2, -h / 2, w / 2 + 6, h / 2 + 9);
    g.restore();
  }
  /* the frame-0 chat box: a generic cut-paper window (no logo, no product UI), an input row at the bottom with a paper send arrow */
  /* frame-0 coordinates; in the first second it glides up GL px (PG), and glides back down after the last "no." */
  var PN = { x0: 94, y0: 700, x1: 922, y1: 1400 }, GL = 250;
  function PG(t) { return -GL * eout(seg(t, .02, .92)); }
  function chatPanel(g) {
    sheet(g, PN.x0, PN.y0, PN.x1, PN.y1, 41, PANEL, 1.6, 'panel');
    g.fillStyle = PANEL_D; cut(g, [[PN.x0, PN.y0], [PN.x1, PN.y0], [PN.x1, PN.y0 + 54], [PN.x0, PN.y0 + 54]], mulberry(42), 1.2);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(PN.x0 + 4, PN.y0 + 4, PN.x1 - PN.x0 - 8, 5);
    /* the input row (the paper send arrow sits under the last tile) */
    g.fillStyle = 'rgba(0,0,0,.16)'; rr(g, 110, PN.y1 - 160, 804, 146, 22); g.fill();
    g.fillStyle = TAPE; rr(g, 106, PN.y1 - 166, 804, 146, 22); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.28)'; g.lineWidth = 3; rr(g, 106, PN.y1 - 166, 804, 146, 22); g.stroke();
    g.fillStyle = INK; poly(g, [[858, PN.y1 - 114], [888, PN.y1 - 93], [858, PN.y1 - 72], [865, PN.y1 - 93]]); g.fill();
  }
  /* the frame-0 question chip under the chat box: the jump the film is about, answer unknown */
  function qChip(g, dy, a) { chip(g, '18% RIGHT → ?', CX, PN.y1 - 340 + dy, { px: 72, wt: 900, bg: INK, fg: CREAM, a: a, shadow: false }); }
  /* the frame-0 / end-card tile layouts */
  var WORDS = ["LET'S", 'THINK', 'STEP', 'BY', 'STEP'];
  var LAY = {};
  function layouts() {
    var i, x;
    LAY.down = []; for (i = 0; i < 5; i++) LAY.down.push({ x: 190 + i * 160, y: PN.y1 - 93, w: 148, h: 118, px: 72 });
    var up = WORDS.map(function (s) { return tw(s, 72, 900) + 58; }), rows = [[0, 1], [2, 3, 4]], ys = [575, 695];
    LAY.up = [];
    rows.forEach(function (row, ri) { var tot = 0; row.forEach(function (j) { tot += up[j]; }); tot += 22 * (row.length - 1); x = CX - tot / 2; row.forEach(function (j) { LAY.up[j] = { x: x + up[j] / 2, y: ys[ri], w: up[j], h: 108, px: 72 }; x += up[j] + 22; }); });
    var st = WORDS.map(function (s) { return tw(s, 40, 900) + 34; }), tot2 = 0; st.forEach(function (v) { tot2 += v; }); tot2 += 12 * 4; x = CX - tot2 / 2;
    LAY.strip = []; for (i = 0; i < 5; i++) { LAY.strip.push({ x: x + st[i] / 2, y: 592, w: st[i], h: 64, px: 40 }); x += st[i] + 12; }
    LAY.stack = []; for (i = 0; i < 5; i++) LAY.stack.push({ x: 848, y: 1062 + i * 60, w: 160, h: 52, px: 36 });
  }
  function lay(a, b, k) { return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k), px: lerp(a.px, b.px, k) }; }
  /* the AI box: cardboard, a slot on top (where the five words go in), an intake on its left (its own steps come back in),
     a mouth below (the strip comes out). Its face says which model the re-created output is from. */
  function aiBox(g, x0, y0, w, h, label, sub, seed, flap) {
    sheet(g, x0, y0, x0 + w, y0 + h, seed || 61, CARD, 1.6, 'box');
    g.fillStyle = CARD_L; g.fillRect(x0 + 4, y0 + 4, w - 8, 5);
    g.fillStyle = INK; rr(g, x0 + w / 2 - 62, y0 + 7, 124, 12, 6); g.fill();
    g.fillStyle = INK; rr(g, x0 + 5, y0 + 30, 12, 58, 5); g.fill();
    g.fillStyle = CARD_D; rr(g, x0 + 18, y0 + h - 12, w - 36, 9, 4); g.fill();
    g.fillStyle = INK; rr(g, x0 + 24, y0 + h - 9, w - 48, 6, 3); g.fill();
    ONPROP = true;
    if (label) txt(g, label, x0 + w / 2, y0 + h * .40, 40, INK, 'center', 900, DISP, w - 40);
    if (sub) txt(g, sub, x0 + w / 2, y0 + h * .76, 30, INK, 'center', 700, MONO, w - 40, 1, 30);
    ONPROP = false;
    /* the slot's cardboard flap, hinged at the slot's far edge: it lifts as something goes in */
    var fl = flap || 0;
    if (fl > 0) {
      g.save(); g.translate(x0 + w / 2 + 66, y0 + 8); g.scale(1, -1); g.transform(1, 0, 0, Math.max(.05, Math.sin(1.25 * fl)), 0, 0);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-132, -2, 132, 16);
      g.fillStyle = CARD_D; g.fillRect(-132, 0, 132, 14); g.fillStyle = CARD_L; g.fillRect(-132, 10, 132, 4);
      g.restore();
    }
  }
  /* a torn receipt tab: printed top to bottom (rev 0..1), torn zigzag bottom edge */
  function tab(g, cx, cy, w, h, text, px, seed, rev, rot, a, scrib) {
    if (rev <= 0 || a <= 0) return;
    g.save(); g.globalAlpha *= a == null ? 1 : a; g.translate(cx, cy); if (rot) g.rotate(rot);
    g.beginPath(); g.rect(-w / 2 - 14, -h / 2 - 4, w + 30, (h + 24) * rev); g.clip();
    var r = mulberry(seed), P = [[-w / 2, -h / 2], [w / 2, -h / 2]], n = 13;
    for (var i = n; i >= 0; i--) P.push([-w / 2 + w * i / n, h / 2 + (i % 2 ? -5 : 4) + (r() - .5) * 2]);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.save(); g.translate(6, 8); poly(g, P); g.fill(); g.restore();
    g.fillStyle = TAPE; poly(g, P); g.fill();
    g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(-w / 2, -h / 2, w, 4);
    if (text) { ONPROP = true; txt(g, text, 0, 2, px, INK, 'center', 900, DISP, w - 24); ONPROP = false; }
    if (scrib) {
      /* a newer model's own steps: pencil scribble lines, no text (an illustration) */
      g.strokeStyle = PENCIL; g.lineWidth = 4; g.lineCap = 'round';
      for (var L2 = 0; L2 < 2; L2++) { var yy = -9 + L2 * 18, x1 = -w / 2 + 22, x2 = w / 2 - 22 - (L2 ? 50 + 30 * r() : 10 * r()); g.beginPath(); g.moveTo(x1, yy); for (var xx = x1; xx < x2; xx += 14) g.quadraticCurveTo(xx + 4, yy - 6 * (r() - .3), xx + 7, yy + (r() - .5) * 3); g.stroke(); }
    }
    prop(g, 'tab', -w / 2, -h / 2, w / 2 + 6, h / 2 + 8);
    g.restore();
  }
  /* the ANSWER row at the bottom of the strip: a mono label and one printed digit */
  function answerRow(g, cx, cy, w, h, digit, rev, seed, a, grey, dk, dpx, dy) {
    if (rev <= 0 || a <= 0) return;
    tab(g, cx, cy, w, h, null, 0, seed, rev, 0, a);
    g.save(); g.globalAlpha *= a; g.translate(cx, cy);
    g.beginPath(); g.rect(-w / 2 - 14, -h / 2 - 4, w + 30, (h + 24) * rev); g.clip();
    ONPROP = true;
    txt(g, 'ANSWER', -w / 2 + 16, -h / 2 + 22, 30, INK, 'left', 700, MONO, 200, 1, 30);
    if (digit) txt(g, digit, -w / 2 + (dpx ? 62 : 50), dy == null ? 14 : dy, dpx || 92, INK, 'center', 900, DISP, 200, dk == null ? 1 : dk, 60);
    ONPROP = false;
    if (grey) { g.fillStyle = 'rgba(21,19,27,' + (.42 * grey) + ')'; g.fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 10); }
    g.restore();
  }
  /* a cream ✗ (never coral): two strokes with an offset shadow */
  function xmark(g, x, y, s, a) {
    if (a <= 0 || s <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s); g.lineCap = 'round';
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 13;
    g.beginPath(); g.moveTo(-24 + 4, -24 + 6); g.lineTo(24 + 4, 24 + 6); g.moveTo(24 + 4, -24 + 6); g.lineTo(-24 + 4, 24 + 6); g.stroke();
    g.strokeStyle = CREAM; g.beginPath(); g.moveTo(-24, -24); g.lineTo(24, 24); g.moveTo(24, -24); g.lineTo(-24, 24); g.stroke();
    prop(g, 'x', -30, -30, 30, 30);
    g.restore();
  }
  /* a paper ball: plain, golf (dimpled) or golf and blue */
  function ball(g, x, y, r, golf, blue, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.32)'; el(g, x + 3, y + 4, r, r);
    g.fillStyle = blue > 0 ? lerpCol(GOLF, BLUE, blue) : lerpCol(BALL, GOLF, golf); el(g, x, y, r, r);
    if (golf > 0) { g.fillStyle = 'rgba(33,29,38,' + (.28 * golf) + ')'; [[-.45, -.2], [0, -.45], [.42, -.15], [-.2, .25], [.25, .3], [0, 0], [-.5, .3], [.5, .35]].forEach(function (d) { el(g, x + d[0] * r, y + d[1] * r, r * .1, r * .1); }); }
    g.fillStyle = 'rgba(255,255,255,.28)'; el(g, x - r * .35, y - r * .4, r * .28, r * .18, -.5);
    g.restore();
  }
  function lerpCol(a, b, k) {
    k = clamp(k || 0, 0, 1); var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); }), pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return 'rgb(' + pa.map(function (v, i) { return Math.round(lerp(v, pb[i], k)); }).join(',') + ')';
  }
  /* a cream bracket along a group, beside it (never over it): drawn top to bottom, k 0..1 */
  function bracket(g, x, y0, y1, k, side) {
    if (k <= 0) return; var s = side || 1, yk = lerp(y0, y1, k);
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    [['rgba(0,0,0,.35)', 4, 6], [CREAM, 0, 0]].forEach(function (p) {
      g.strokeStyle = p[0]; g.lineWidth = 7; g.beginPath(); g.moveTo(x + 16 * s + p[1], y0 + p[2]); g.lineTo(x + p[1], y0 + p[2]); g.lineTo(x + p[1], yk + p[2]); if (k >= 1) g.lineTo(x + 16 * s + p[1], y1 + p[2]); g.stroke();
    });
    g.restore();
  }
  /* a polyline drawn to fraction k, with a paper arrowhead; returns the head point */
  function arrowPath(g, P, k, a) {
    if (k <= 0 || a <= 0) return null;
    var L = [], tot = 0, i;
    for (i = 1; i < P.length; i++) { var d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); L.push(d); tot += d; }
    var want = tot * k, Q = [P[0]], hx = P[0][0], hy = P[0][1], dx = 1, dy = 0;
    for (i = 1; i < P.length; i++) {
      var l = L[i - 1]; dx = (P[i][0] - P[i - 1][0]) / l; dy = (P[i][1] - P[i - 1][1]) / l;
      if (want >= l) { Q.push(P[i]); want -= l; hx = P[i][0]; hy = P[i][1]; } else { hx = P[i - 1][0] + dx * want; hy = P[i - 1][1] + dy * want; Q.push([hx, hy]); break; }
    }
    g.save(); g.globalAlpha *= a; g.lineCap = 'round'; g.lineJoin = 'round';
    [['rgba(0,0,0,.35)', 4, 6], [TAPE, 0, 0]].forEach(function (p) {
      g.strokeStyle = p[0]; g.fillStyle = p[0]; g.lineWidth = 8;
      g.beginPath(); Q.forEach(function (q, j) { if (j) g.lineTo(q[0] + p[1], q[1] + p[2]); else g.moveTo(q[0] + p[1], q[1] + p[2]); }); g.stroke();
      var ax = hx + p[1], ay = hy + p[2], nx = -dy, ny = dx;
      g.beginPath(); g.moveTo(ax + dx * 16, ay + dy * 16); g.lineTo(ax - dx * 6 + nx * 14, ay - dy * 6 + ny * 14); g.lineTo(ax - dx * 6 - nx * 14, ay - dy * 6 - ny * 14); g.closePath(); g.fill();
    });
    g.restore();
    return [hx, hy];
  }

  /* =====================================================================================================
     SCENE 1 · the desk (hook → hero), one continuous table.
     Frame 0: 5 WORDS over the paper chat box; five face-down tiles in its input row rise ≈ 400 px in the first second and
     flip on each spoken word. "They": the box drops away, the tiles close into one strip on top, two paper bars grow
     (17.7% on "18", 78.7% on "79") with their noun and scope. "So": the tiles stack in the right column, the bars fade,
     the puzzle card (the paper's Figure 1, shortened) slides up; TRY IT on "help". The balls drop, dimple, turn blue; the
     GPT-3 box rises (ASKED STRAIGHT), prints 8, gets a cream ✗. "With them": the tiles go into its slot, the 8 tears off to
     NO STEPS, three step tabs print, then 4. "goes back in": three paper arrows feed a copy of each tab into its intake.
     Hero: the pencil rings the 4, a bracket lines the tabs, then the coral STEPS FIRST stamp and the still hold.
     ===================================================================================================== */
  var BX = { x0: 335, y0: 852, w: 290, h: 118 };            /* the box in the strip layout (from "With them") */
  var BXQ = { x0: 365, y0: 1185, w: 290, h: 95 };           /* the box under the grid, "golf" → "With them" */
  var STRIP = { cx: 480, w: 260 };
  var TABS = [{ y: 1012, s: '16 BALLS' }, { y: 1086, s: '8 GOLF' }, { y: 1160, s: '4 BLUE' }];
  var R4 = { y: 1270, h: 140 }, NS = { cx: 214, cy: 1262, s: .68 }, R8Q = { cx: 510, cy: 1338, h: 100 };
  /* the 16 balls in their own grid: big under the card (P), smaller when the box comes in under it (Q), then a small
     block in the right column (C) once the strip takes the stage */
  function gridPos(j, t) {
    var c = j % 4, r = Math.floor(j / 4);
    var P = { x: 315 + 130 * c, y: 865 + 128 * r, r: 52 }, Q = { x: 360 + 100 * c, y: 850 + 95 * r, r: 40 }, C = { x: 727 + 44 * c, y: 880 + 44 * r, r: 18 };
    var kq = eio(seg(t, K.golf - .05, K.golf + .35)), kc = eio(seg(t, K.wth + .05 + c * .03, K.wth + .5 + c * .03));
    var A = { x: lerp(P.x, Q.x, kq), y: lerp(P.y, Q.y, kq), r: lerp(P.r, Q.r, kq) };
    return { x: lerp(A.x, C.x, kc), y: lerp(A.y, C.y, kc), r: lerp(A.r, C.r, kc) };
  }
  /* "Then 4.": the four blue balls lift off the grid and drop into the ANSWER tab, 0.12 s apart, the last landing ≈ 0.34 s after "4" */
  function blueLand(j) { return K.four + .34 - (3 - j) * .12; }
  function blueSpot(j) { return { x: STRIP.cx - STRIP.w / 2 + 136 + (j % 2) * 36, y: R4.y - 6 + Math.floor(j / 2) * 36, r: 15 }; }
  function tileState(i, t) {
    var lt = K.tiles[i], fk = seg(t, lt - .06, lt + .12);
    var lift = 20 * (1 - eio(seg(t, K.they, K.they + .5)));
    if (t < K.they) { var L0 = lay(LAY.down[i], LAY.up[i], eout(seg(t, .02, .92))); L0.y += lift; return { L: L0, k: fk, a: 1 }; }
    if (t < K.so) { var L1 = lay(LAY.up[i], LAY.strip[i], eio(seg(t, K.they, K.they + .5))); L1.y += lift; return { L: L1, k: 1, a: 1 }; }
    /* from "It said" until "With them" the five words sit dimmed: they did not produce the 8 */
    if (t < K.wth) return { L: lay(LAY.strip[i], LAY.stack[i], eio(seg(t, K.so + i * .04, K.so + .45 + i * .04))), k: 1, a: 1 - .6 * seg(t, K.said - .1, K.said + .12) };
    /* into the top slot, one by one: brighten, shrink, then gone into the box */
    var s0 = K.wth + .02 + i * .07, m = eio(seg(t, s0, s0 + .34)), slot = { x: BX.x0 + BX.w / 2, y: BX.y0 + 4, w: 60, h: 30, px: 20 };
    return { L: lay(LAY.stack[i], slot, m), k: 1, a: (1 - seg(m, .85, 1)) * lerp(.4, 1, seg(t, K.wth - .05, K.wth + .1)) };
  }
  function deskScene(g, t) {
    var i;
    /* the hero push-in (1.2 %), still from the stamp on */
    var pin = eio(seg(t, K.hero, K.heroEnd + .1)), zs = 1 + .012 * pin;
    g.save(); g.translate(CX, 1000); g.scale(zs, zs); g.translate(-CX, -1000);

    /* frame 0's chat box: glides up 250 px in the first second, drops away on "They"; its 18% RIGHT → ? chip stays a
       moment longer (it has to be read), then leaves before the bars build */
    var pk = eio(seg(t, K.they - .04, K.they + .42));
    if (pk < 1) { g.save(); g.globalAlpha *= 1 - seg(pk, .15, .6); g.translate(0, PG(t) + 760 * pk * pk); chatPanel(g); g.restore(); }
    var qa = 1 - seg(t, K.qOut, K.qOut + .12);
    if (qa > 0) qChip(g, PG(t) - 30 * seg(t, K.qOut, K.qOut + .12), qa);
    /* the rest of the desk sits 20 px higher (the credit keeps a margin above y 1430) */
    g.save(); g.translate(0, -20);

    /* the bars (jump): 100 % = 580 px on a baseline at 1230; fade out after the question with a short drift left */
    var ca = fin(t, K.qOut + .02) * (1 - seg(t, K.so + .62, K.so + .8)), cdx = 0;
    if (ca > 0) {
      g.save(); g.globalAlpha *= ca; g.translate(cdx, 0);
      var B0 = 1230, BH = 580;
      g.strokeStyle = 'rgba(244,237,224,.32)'; g.lineWidth = 3; g.setLineDash([10, 9]);
      [[220, 410], [460, 650]].forEach(function (b) { g.strokeRect(b[0], B0 - BH, b[1] - b[0], BH); }); g.setLineDash([]);
      var h1 = .177 * BH * eout(seg(t, K.n18 - .05, K.n18 + .35)), h2 = .787 * BH * eout(seg(t, K.n79 - .06, K.n79 + .5));
      if (h1 > 1) sheet(g, 220, B0 - h1, 410, B0, 71, CARD, 1.2, 'bar');
      if (h2 > 1) sheet(g, 460, B0 - h2, 650, B0, 73, TAPE, 1.2, 'bar');
      g.fillStyle = CREAM; g.fillRect(186, B0 - 2, 498, 6);
      txt(g, '17.7%', 315, B0 - .177 * BH - 48, 70, CREAM, 'center', 900, DISP, 300, fin(t, K.n18 - .12));
      txt(g, '78.7%', 555, B0 - .787 * BH - 48, 70, CREAM, 'center', 900, DISP, 300, fin(t, K.n79 - .14));
      var la = fin(t, K.qOut + .1);
      txt(g, 'NO PROMPT', 315, B0 + 36, 40, CREAM, 'center', 800, DISP, 236, la);
      txt(g, '+ 5 WORDS', 555, B0 + 36, 40, CREAM, 'center', 800, DISP, 236, la);
      txt(g, 'MATH WORD', 800, 980, 44, CREAM, 'center', 900, DISP, 236, la);
      txt(g, 'PROBLEMS', 800, 1034, 44, CREAM, 'center', 900, DISP, 236, la);
      txt(g, 'RIGHT', 800, 1088, 44, CREAM, 'center', 900, DISP, 236, la);
      var SL = [['ONE 2022 MODEL: GPT-3', 1314, 42, 900, DISP], ['(TEXT-DAVINCI-002) · MULTIARITH TEST', 1360, 36, 700, MONO], ['KOJIMA ET AL., 2022', 1404, 38, 700, MONO]];
      SL.forEach(function (l, j) { var a0 = K.y2022 - .06 + j * .08, k = fin(t, a0); txt(g, l[0], CX, l[1] + 18 * (1 - eout(seg(t, a0, a0 + .3))), l[2], CREAM, 'center', l[3], l[4], 830, k, 36); });
      /* the pencil underlines the model once every scope line is fully up */
      var w0 = tw('ONE 2022 MODEL: GPT-3', 42, 900);
      penTrack(g, t, [[Math.max(at('jump', 'ai') - .02, K.y2022 + .75), .42, CX - w0 / 2, CX + w0 / 2, 1340]], 'rgba(244,237,224,.85)');
      g.restore();
    }

    /* the puzzle card: the paper's text only, slides up after the bars have gone */
    var cu = eout(seg(t, K.so + .66, K.so + 1.1));
    if (cu > 0) {
      g.save(); g.translate(0, 560 * (1 - cu)); g.globalAlpha *= clamp(cu * 3, 0, 1);
      sheet(g, 110, 540, 910, 752, 81, PAPER, 1.4, 'card');
      ONPROP = true;
      ['16 BALLS.', 'HALF ARE GOLF BALLS.', 'HALF OF THOSE ARE BLUE.', 'HOW MANY BLUE?'].forEach(function (s, j) { txt(g, s, 150, 584 + j * 44, 40, INK, 'left', 900, DISP, 720); });
      ONPROP = false;
      /* the pencil reads the card with the voice */
      var CW = ['16 BALLS.', 'HALF ARE GOLF BALLS.', 'HALF OF THOSE ARE BLUE.', 'HOW MANY BLUE?'].map(function (s2) { return Math.min(720, tw(s2, 40, 900)); });
      penTrack(g, t, [[K.sixteen - .02, .3, 150, 150 + CW[0], 608], [at('balls', 'half') - .04, .42, 150, 150 + CW[1], 652], [at('eight', 'half') - .04, .48, 150, 150 + CW[2], 696], [K.blue + .3, .36, 150, 150 + CW[3], 740]], PENCIL);
      g.restore();
      tag(g, 'FROM THE PAPER’S FIG. 1 · SHORTENED', CX, 789, cu >= 1 ? 1 : 0, 0);
      /* the grid of 16, under the card: holes first, the balls drop in on "Sixteen", 8 dimple on "golf"; the 4 blue
         only on "4." (the answer is not shown before it is said) */
      var ga = clamp(cu * 3, 0, 1);
      for (var j = 0; j < 16; j++) {
        var q = gridPos(j, t), golf = j < 8, blue = j < 4;
        g.save(); g.globalAlpha *= ga; g.strokeStyle = 'rgba(244,237,224,.22)'; g.lineWidth = 3; g.beginPath(); g.ellipse(q.x, q.y + 20 * (1 - cu), q.r + 1, q.r + 1, 0, 0, 6.283); g.stroke(); g.restore();
        var d0 = K.sixteen - .12 + j * .022, dk = eout(seg(t, d0, d0 + .2));
        var gk = golf ? seg(t, K.golf - .05 + j * .03, K.golf + .12 + j * .03) : 0, bk = blue ? seg(t, K.four - .42 + j * .05, K.four - .27 + j * .05) : 0;
        var bx = q.x, by = q.y - 40 * (1 - dk), br = q.r;
        if (blue) {
          var L = blueLand(j), fl = seg(t, L - .3, L);
          if (fl > 0) { var D = blueSpot(j), e = eio(fl); bx = lerp(q.x, D.x, e); by = lerp(q.y, D.y, e) - 110 * Math.sin(Math.PI * Math.min(1, fl * 1.1)); br = lerp(q.r, D.r, e); }
          if (fl >= 1) continue;   /* landed: drawn in the ANSWER tab */
        }
        ball(g, bx, by, br, gk, bk, clamp(dk * 3, 0, 1) * ga);
      }
    }
    /* TRY IT, cream (never coral), parked left under the grid, from "help" until the box answers */
    var ty = pop(t, K.help - .04, 3.2), tya = fin(t, K.help - .04) * (1 - seg(t, K.said - .1, K.said + .05));
    chip(g, 'TRY IT', 215, 1360, { px: 56, wt: 900, bg: CREAM, fg: BG, a: tya, s: ty, rot: -.04 + .015 * Math.sin(t * 3.1) * (tya > 0 ? 1 : 0) });

    /* where the box is: under the grid from "golf", up at the top of the strip from "With them" */
    var mv = eio(seg(t, K.wth + .05, K.wth + .5));
    var bxx = lerp(BXQ.x0, BX.x0, mv), bxy = lerp(BXQ.y0, BX.y0, mv), bxh = lerp(BXQ.h, BX.h, mv);
    /* the + 5 WORDS stub sticking out of the top slot (it rises out after the tiles went in); drawn before the box */
    var stub = eout(seg(t, K.wth + .42, K.wth + .7));
    if (stub > 0) {
      g.save(); g.beginPath(); g.rect(0, 0, W, BX.y0 + 12); g.clip(); g.translate(0, 56 * (1 - stub));
      sheet(g, BX.x0 + BX.w / 2 - 108, BX.y0 - 36, BX.x0 + BX.w / 2 + 108, BX.y0 + 12, 91, PAPER, 1, 'stub');
      ONPROP = true; txt(g, '+ 5 WORDS', BX.x0 + BX.w / 2, BX.y0 - 16, 30, INK, 'center', 900, DISP, 200, 1, 30); ONPROP = false;
      g.restore();
    }
    /* the five tiles (before the box: they go into its slot) */
    for (i = 0; i < 5; i++) {
      var ts = tileState(i, t); if (ts.a <= 0) continue;
      if (t >= K.wth) { g.save(); g.beginPath(); g.rect(0, 0, W, BX.y0 + 10); g.clip(); }
      tile(g, ts.L.x, ts.L.y, ts.L.w, ts.L.h, WORDS[i], ts.L.px, ts.k, ts.a);
      if (t >= K.wth) g.restore();
    }

    /* the box rises in under the grid on "golf" */
    var bu = eout(seg(t, K.golf + .2, K.golf + .62));
    if (bu > 0) {
      var gulp = 0; ARR.forEach(function (a0) { gulp = Math.max(gulp, Math.sin(Math.PI * seg(t, a0 + .16, a0 + .5))); });
      g.save(); g.translate(0, 160 * (1 - bu)); g.globalAlpha *= clamp(bu * 2, 0, 1);
      aiBox(g, bxx, bxy, BX.w, bxh, 'GPT-3, 2022', 'RE-CREATED', 61, gulp);
      g.restore();
      var asa = fin(t, K.golf + .35) * (1 - seg(t, K.wth - .05, K.wth + .15));
      txt(g, 'ASKED', 345, 1212, 40, CREAM, 'right', 900, DISP, 250, asa);
      txt(g, 'STRAIGHT', 345, 1258, 40, CREAM, 'right', 900, DISP, 250, asa);
    }
    /* the 8 row: printed on "said" under the box; on "With them" it tears off to the left, greyed, NO STEPS */
    var r8 = { cx: lerp(R8Q.cx, NS.cx, mv), cy: lerp(R8Q.cy, NS.cy, mv), s: lerp(1, NS.s, mv) };
    var p8 = seg(t, K.said - .02, K.said + .2);
    if (p8 > 0) {
      g.save(); g.translate(r8.cx, r8.cy); g.scale(r8.s, r8.s); g.rotate(-.03 * mv);
      answerRow(g, 0, 0, STRIP.w, R8Q.h, '8', p8, 101, 1, mv);
      g.restore();
    }
    /* the cream ✗: lands with the knock, then settles 6° through the silence */
    var xk = t >= GT.knock ? eout(seg(t, GT.knock, GT.knock + .09)) : 0, xr = .105 * eio(seg(t, GT.knock + .1, K.wth));
    g.save(); g.translate(lerp(R8Q.cx + STRIP.w / 2 + 44, NS.cx + STRIP.w * NS.s / 2 + 22, mv), lerp(R8Q.cy, NS.cy, mv)); g.rotate(xr);
    xmark(g, 0, 0, lerp(1.3, 1, xk) * lerp(1, .85, mv), clamp(xk * 3, 0, 1));
    g.restore();
    txt(g, 'NO STEPS', NS.cx, NS.cy - 66, 40, CREAM, 'center', 900, DISP, 220, fin(t, K.wth + .42));

    /* the step tabs print on "wrote steps", then the ANSWER row prints a big 4 */
    TABS.forEach(function (b, j) {
      var p0 = K.wrote - .04 + j * .24;
      tab(g, STRIP.cx, b.y, STRIP.w, 66, b.s, 42, 111 + j, eout(seg(t, p0, p0 + .2)), 0, 1);
    });
    answerRow(g, STRIP.cx, R4.y, STRIP.w, R4.h, '4', eout(seg(t, K.four - .14, K.four + .06)), 121, 1, 0, null, 128, 24);
    /* the four blue balls, landed in the ANSWER tab */
    for (var b4 = 0; b4 < 4; b4++) { if (t >= blueLand(b4)) { var D4 = blueSpot(b4); ball(g, D4.x, D4.y, D4.r, 1, 1, 1); } }

    /* "goes back in": a full-size copy of each tab peels off it, swings out right, slides up and drops into the top slot */
    ARR.forEach(function (a0, j) {
      var m = seg(t, a0, a0 + .5); if (m <= 0 || m >= 1) return;
      var x0 = STRIP.cx, y0 = TABS[j].y, sy = BX.y0 - 34, k1 = eio(seg(m, 0, .72)), k2 = Math.pow(seg(m, .72, 1), 3);
      var x = x0 + 225 * Math.sin(Math.PI * k1), y = lerp(lerp(y0, sy, k1), BX.y0 + 40, k2);
      var sc = lerp(1, .72, k1) * lerp(1, .55, k2), rot = .1 * Math.sin(Math.PI * k1);
      g.save(); g.beginPath(); g.rect(0, 0, W, k2 > 0 ? BX.y0 + 10 : H); g.clip();
      g.translate(x, y); g.scale(sc, sc);
      tab(g, 0, 0, STRIP.w, 66, TABS[j].s, 42, 211 + j, 1, rot, 1);
      g.restore();
    });
    var ia = fin(t, K.each);
    ['ITS OWN', 'STEPS,', 'READ', 'AGAIN'].forEach(function (s2, j) { txt(g, s2, 326, 990 + j * 44, 38, CREAM, 'right', 900, DISP, 230, ia); });
    var cr = fin(t, K.each + .15);
    txt(g, 'KOJIMA ET AL., 2022 · §3.1', CX, 1384, 40, CREAM, 'center', 700, MONO, 830, cr);
    txt(g, 'FIG. 1 · ARXIV 2205.11916', CX, 1424, 40, CREAM, 'center', 700, MONO, 830, cr);

    /* hero: the pencil underlines ANSWER (not the numeral) on "answer"; the bracket lines the tabs on "in view" */
    var al = STRIP.cx - STRIP.w / 2 + 16;
    penTrack(g, t, [[K.answer - .02, .3, al, al + tw('ANSWER', 30, 700, MONO), R4.y - R4.h / 2 + 40]], PENCIL);
    bracket(g, STRIP.cx - STRIP.w / 2 - 18, TABS[0].y - 33, TABS[2].y + 33, eio(seg(t, K.inV - .04, K.inV + .3)), 1);
    /* THE stamp, big, tilted −6°, beside the ANSWER tab on its own cream patch */
    stamp(g, 'STEPS\nFIRST', SX, R4.y - 8, t, GT.slam, SPX, HOT, -.105, true);
    g.restore();
    g.restore();
  }
  var SPX = 68, SX = 748;
  var ARR = [];
  /* a pencil that underlines lines in turn: U = [[t0, dur, x0, x1, y], …]; it comes in from the right, rides each line, leaves */
  function penTrack(g, t, U, col) {
    g.save(); g.strokeStyle = col || PENCIL; g.lineWidth = 5; g.lineCap = 'round';
    U.forEach(function (u) { var k = eio(seg(t, u[0], u[0] + u[1])); if (k > 0) { g.beginPath(); g.moveTo(u[2], u[4]); g.lineTo(lerp(u[2], u[3], k), u[4] + 2 * k); g.stroke(); } });
    g.restore();
    var PK = [[U[0][0] - .4, 1180, U[0][4] + 160]];
    U.forEach(function (u) { PK.push([u[0], u[2], u[4]]); PK.push([u[0] + u[1], u[3], u[4] + 2]); });
    var L = PK[PK.length - 1]; PK.push([L[0] + .4, 1180, L[2] + 160]);
    if (t <= PK[0][0] || t >= PK[PK.length - 1][0]) return;
    var pi = 0; while (pi < PK.length - 2 && t > PK[pi + 1][0]) pi++;
    var A = PK[pi], B = PK[pi + 1], pk = seg(t, A[0], B[0]), drawing = U.some(function (u) { return t >= u[0] && t <= u[0] + u[1]; });
    if (!drawing) pk = eio(pk);
    var px = lerp(A[1], B[1], pk) + 2 * Math.sin(t * 7.3), py = lerp(A[2], B[2], pk) + 1.5 * Math.cos(t * 6.1);
    pencil(g, px + 240, py + 75, px, py);
  }

  /* =====================================================================================================
     SCENE 2 · steps after the answer (our illustration of Wei et al. 2022). The same box and strip with the order swapped:
     the ANSWER row moves up under the box and reprints 8 ✗; the tabs drop below it, tilted, swaying. The Wei card on top;
     the pencil underlines it on "No better".
     ===================================================================================================== */
  var AB = { x0: 430, y0: 908, w: 290, h: 108 }, ACX = 575;
  function afterScene(g, t) {
    var sw = eio(seg(t, K.after + .05, K.afterW + .45));
    /* the Wei card */
    sheet(g, 110, 540, 910, 884, 131, PAPER, 1.4, 'weicard');
    ONPROP = true;
    ['“…PERFORMS', 'ABOUT THE', 'SAME AS THE', 'BASELINE…”'].forEach(function (s, j) { txt(g, s, CX, 584 + j * 46, 42, INK, 'center', 900, DISP, 760); });
    g.fillStyle = 'rgba(33,29,38,.45)'; g.fillRect(150, 752, 720, 3);
    [['WEI ET AL.,', CX - 190, 786], ['2022 · GSM8K', CX - 190, 828], ['LAMDA 137B,', CX + 190, 786], ['PALM 540B', CX + 190, 828]].forEach(function (c) { txt(g, c[0], c[1], c[2], 36, INK, 'center', 700, MONO, 360, 1, 34); });
    ONPROP = false;
    /* the pencil underlines "about the same as the baseline" on "No better" */
    var U = [[K.no - .1, 'ABOUT THE', 626], [K.no + .14, 'SAME AS THE', 672], [K.no + .3, 'BASELINE…”', 718]], pen = null;
    g.save(); g.strokeStyle = PENCIL; g.lineWidth = 5; g.lineCap = 'round';
    U.forEach(function (u) { var w = tw(u[1], 42, 900), k = eio(seg(t, u[0], u[0] + .2)); if (k > 0) { g.beginPath(); g.moveTo(CX - w / 2, u[2] + 28); g.lineTo(CX - w / 2 + w * k, u[2] + 29); g.stroke(); if (k < 1 || u === U[2]) pen = [CX - w / 2 + w * k, u[2] + 28]; } });
    g.restore();
    var pIn = eio(seg(t, K.no - .35, K.no - .1)), pOut = eio(seg(t, K.no + .55, K.no + 1.0));
    if (pIn > 0 && pOut < 1) { var qx = pen ? pen[0] : CX - 160, qy = pen ? pen[1] : 672; qx = lerp(lerp(1150, qx, pIn), 1150, pOut); qy = lerp(lerp(560, qy, pIn), 520, pOut); pencil(g, qx + 240, qy + 75, qx, qy); }

    aiBox(g, AB.x0, AB.y0, AB.w, AB.h, null, null, 63, 0);
    /* the swap: the ANSWER row rises from the bottom to the mouth, the tabs fall past it to below, tilted */
    var top = AB.y0 + AB.h + 66, yA = lerp(1284, top, sw);
    var TD = [{ y: 1186, x: 562, r: -.19 }, { y: 1272, x: 592, r: .19 }, { y: 1358, x: 566, r: -.18 }];
    TD.forEach(function (d, j) {
      var k = eio(seg(t, K.after + .05 + j * .05, K.afterW + .45 + j * .05)), y0 = 1020 + j * 80 - 100;
      var swing = .028 * Math.sin(t * 2.2 + j * 1.7) * seg(t, K.afterW + .4, K.afterW + .8);
      tab(g, lerp(ACX, d.x, k), lerp(y0, d.y, k), STRIP.w, 62, TABS[j].s, 42, 141 + j, 1, d.r * k + swing, 1);
    });
    answerRow(g, ACX, yA, STRIP.w, 112, sw < .5 ? '4' : '8', 1, 151, 1, 0, sw < .5 ? 1 - seg(sw, .3, .5) : seg(sw, .5, .7));
    xmark(g, 772, top + 4, lerp(1.3, 1, eout(seg(t, K.afterW + .45, K.afterW + .55))), fin(t, K.afterW + .45));
    /* ORDER SWAPPED: a hanging paper tab beside the row; OUR ILLUSTRATION under it */
    var oa = 1, osw = .04 * Math.sin(t * 2.6) * oa;
    if (oa > 0) {
      g.save(); g.globalAlpha *= oa; g.translate(300, 1040); g.rotate(osw);
      g.strokeStyle = TAPE_D; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -30); g.lineTo(0, 0); g.stroke();
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -100 + 6, 0 + 8, 200, 100, 8); g.fill();
      g.fillStyle = PAPER; rr(g, -100, 0, 200, 100, 8); g.fill();
      CHIPBOX = LBL ? xbox(g, -100, 0, 100, 100) : null;
      txt(g, 'ORDER', 0, 30, 38, INK, 'center', 900, DISP, 184);
      txt(g, 'SWAPPED', 0, 72, 38, INK, 'center', 900, DISP, 184);
      CHIPBOX = null; g.restore();
    }
    var ia = 1;
    if (ia > 0) {
      g.save(); g.globalAlpha *= ia; g.translate(258, 1262);
      rr(g, -150, -50, 300, 100, 14); g.fillStyle = 'rgba(21,19,27,.9)'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 3; g.stroke();
      recBox(g, -150, -50, 150, 50, '[chip] OUR ILLUSTRATION');
      CHIPBOX = LBL ? xbox(g, -150, -50, 150, 50) : null;
      txt(g, 'OUR', 0, -21, 36, CREAM, 'center', 700, MONO, 280);
      txt(g, 'ILLUSTRATION', 0, 22, 36, CREAM, 'center', 700, MONO, 280);
      CHIPBOX = null; g.restore();
    }
  }

  /* =====================================================================================================
     SCENE 3 · newer reasoning models: the re-created OpenAI guide card (its own sentence, from "prompting"), a 2025+
     reasoning box that prints its own tabs with nothing in its slot, and Wharton's 2025 line beside it.
     ===================================================================================================== */
  var NB = { x0: 480, y0: 1030, w: 290, h: 112 };
  function newerScene(g, t) {
    var drift = 4 * Math.sin((t - K.newer) * 1.1);
    g.save(); g.translate(0, drift);
    sheet(g, 110, 540, 910, 1000, 161, PAPER, 1.4, 'guide');
    ONPROP = true;
    ['“…PROMPTING', 'THEM TO ‘THINK', 'STEP BY STEP’ OR', '‘EXPLAIN YOUR', 'REASONING’ IS', 'UNNECESSARY.”'].forEach(function (s, j) { txt(g, s, CX, 590 + j * 46, 40, INK, 'center', 900, DISP, 760); });
    g.fillStyle = 'rgba(33,29,38,.45)'; g.fillRect(150, 868, 720, 3);
    ['OPENAI’S', 'REASONING GUIDE', 'READ NOV 2, 2026'].forEach(function (s, j) { txt(g, s, CX, 896 + j * 38, 34, INK, 'center', 700, MONO, 760, 1, 34); });
    ONPROP = false;
    /* the pencil underline under "unnecessary." on "own" */
    var uk = eio(seg(t, K.own - .2, K.own + .15)), uw = tw('UNNECESSARY.”', 40, 900);
    if (uk > 0) { g.save(); g.strokeStyle = PENCIL; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(CX - uw / 2, 852); g.lineTo(CX - uw / 2 + uw * uk, 853); g.stroke(); g.restore(); }
    g.restore();
    tag(g, 'RE-CREATED', 786, 548, 1, .03);
    g.save(); g.translate(0, drift * .6);
    aiBox(g, NB.x0, NB.y0, NB.w, NB.h, '2025+', 'REASONING', 65, 0);
    [0, 1, 2].forEach(function (j) { var p0 = K.doW - .02 + j * .22; tab(g, NB.x0 + NB.w / 2, NB.y0 + NB.h + 50 + j * 72, 260, 62, null, 0, 171 + j, eout(seg(t, p0, p0 + .2)), 0, 1, true); });
    bracket(g, NB.x0 - 6, NB.y0 + NB.h + 16, NB.y0 + NB.h + 50 + 144 + 34, eio(seg(t, K.own - .05, K.own + .3)), 1);
    g.restore();
    /* Wharton 2025 on reasoning models, its own words (cut both ends, so both ends get "…") */
    ['WHARTON, 2025,', 'REASONING', 'MODELS:', '“…OFTEN', 'RESULTS IN', 'ONLY MARGINAL,', 'IF ANY, GAINS…”'].forEach(function (s2, j) { txt(g, s2, 450, 1088 + j * 46, 36, CREAM, 'right', 800, DISP, 356); });
  }

  /* =====================================================================================================
     SCENE 4 · the end card: the newer desk drops away, frame 0's chat box rises back with the five tiles face-down;
     coral YES / NO in the chat. After "no" they leave and 5 WORDS returns: the last frame is frame 0.
     ===================================================================================================== */
  var YN = { y: 900, yes: 380, no: 640, w: 230 };   /* frame-0 coordinates: in the chat, above the input row */
  function outroScene(g, t) {
    var a = S('outro').t0, ex = seg(t, a, a + .36);
    if (ex < .5) { g.save(); g.globalAlpha *= 1 - seg(ex, 0, .5); g.translate(0, 200 * ex * ex); newerScene(g, t); g.restore(); }
    /* the chat box rises back to where it rested after the frame-0 glide; after "no." it glides back down to frame 0 */
    var up = eout(seg(t, a + .06, a + .5)), dy = 760 * (1 - up) - 150 + 150 * eio(seg(t, K.noEnd + .04, DUR - .07));   /* rests 150 px up (clear of the caption), back to frame 0 at the end */
    g.save(); g.translate(0, dy); chatPanel(g);
    var hop0 = at('end', 'need') - .05;   /* the face-down tiles hop in turn while the question is asked (they stay face-down) */
    for (var i = 0; i < 5; i++) { var L = LAY.down[i], hp = Math.sin(Math.PI * seg(t, hop0 + i * .1, hop0 + i * .1 + .26)); tile(g, L.x, L.y - 18 * hp, L.w, L.h, WORDS[i], L.px, 0, 1); }
    /* both chips stay outlined; each pulses 1.06× on its word (neither is picked) */
    var yk = function (w) { return 1 + .06 * Math.sin(Math.PI * seg(t, w - .06, w + .3)); };
    var ya = clamp(up * 4 - 2, 0, 1) * (1 - seg(t, K.noEnd + .08, K.noEnd + .26));
    [['YES', YN.yes, K.yes], ['NO', YN.no, K.noE]].forEach(function (c) {
      chip(g, c[0], c[1], YN.y, { px: 76, wt: 900, line: HOT, lw: 5, fg: HOT, w: YN.w, r: 46, shadow: false, a: ya, s: yk(c[2]) });
    });
    g.restore();
    qChip(g, dy, seg(t, K.noEnd + .1, K.noEnd + .3));
  }

  /* frame-0 type: 5 WORDS (2 words), a hard cut out after the hook; back after "no" */
  function hookText(g, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; font(g, 128, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
    g.fillText('5 WORDS', CX, 380); g.restore();
  }

  /* ---------- captions: the narrator's words, one block at a time; stressed words get a cream pill (never coral) ---------- */
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;   /* frame 0's tiles carry the hook */
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1 && l.id !== 'end' && l.id !== 'hero') { out.push({ id: l.id, ws: cur }); cur = []; }
      });
      if (cur.length) out.push({ id: l.id, ws: cur });
    });
    var first = {};
    return out.map(function (c) {
      var ws = c.ws, s = ws[0].t0, isFirst = !first[c.id]; first[c.id] = 1;
      if (isFirst && c.id === 'jump') s = Math.max(s, K.cut + .05);
      if (isFirst && c.id === 'after') s = Math.max(s, K.tearA);   /* the caption swaps with the wipe, before "Steps" is said */
      if (isFirst && c.id === 'newer') s = Math.max(s, K.tearB + .1);
      return { id: c.id, t0: ws[0].t0, s: s, t1: ws[ws.length - 1].t1, words: ws };
    });
  })();
  var STRESS = [['jump', '79'], ['eight', '8'], ['four', 'first'], ['hero', 'steps'], ['after', 'after'], ['newer', 'own'], ['end', 'yes']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, over: 1, that: 1, up: 1, own: 1, is: 1, it: 1, go: 1, does: 1, do: 1, from: 1, be: 1, or: 1, for: 1, their: 1 };
  var CAPMIN = 1e9;
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s - .04 : 1e9;
    var keep = nx && (ns - card0.t1 < 2.2);   /* the caption stays through the planned pauses (✗ knock, stamp + hold) */
    var o1 = keep ? ns : Math.min(card0.t1 + .5, ns - .12), o0 = keep ? ns : Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.s - .04, card0.s + .06), out = keep ? (t < ns ? 1 : 0) : 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - card0.s + .04, 3.2, .8), 0, 1.04);
    g.save(); g.font = '800 74px Archivo'; wide(g);
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 22;
    var lines, lw, maxw = 820, cpx = 74;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; }); }
    function fixLines() {
      for (var L = 0; L < lines.length - 1; L++) {
        var last = lines[L][lines[L].length - 1];
        while (lines[L].length > 1 && GLUE[norm(words[last].w)]) { lines[L].pop(); lines[L + 1].unshift(last); last = lines[L][lines[L].length - 1]; }
      }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay2(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw) && cpx > 52) { cpx -= 4; g.font = '800 ' + cpx + 'px Archivo'; wide(g); ws = words.map(function (w) { return g.measureText(w.w).width; }); gap = cpx * .28; lay2(); fixLines(); }
    var lh = cpx * 1.18, y0 = (lines.length > 1 ? 368 : 408) + 50 - (lines.length - 1) * lh / 2;   /* pill tops at y ≥ 304 */
    g.globalAlpha = fi * out * (alpha == null ? 1 : alpha);
    NOREC = true;
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 30;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 12, y - cpx * .87, ws[i] + 24, cpx * 1.15, 18); g.fill(); CAPMIN = Math.min(CAPMIN, y - cpx * .87); }
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
        CAPMIN = Math.min(CAPMIN, y - cpx * .74);
      });
    });
    NOREC = false;
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = { desk: deskScene, after: afterScene, newer: newerScene, outro: outroScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) { g.save(); SCENES[Sc.fn](g, t); g.restore(); }
  /* the cut: a torn-paper edge falling from the top along one axis (cream), the next scene drawn above it */
  function edgeY(x, ly, t) { var i = Math.round(x / 30); return ly + (i % 2 ? -10 : 8) + Math.sin(x * .013 + t * 5) * 4; }
  function tornEdge(g, ly, t) { g.save(); g.strokeStyle = CREAM; g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); for (var x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t); if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore(); }
  function clipAbove(g, ly, t) { g.beginPath(); g.moveTo(0, 0); for (var x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, 0); g.closePath(); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    /* the torn edge is placed at the frame's own time, not per motion-blur sample: the wipe stays opaque */
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var sk0 = Nx && Nx.swipe ? seg(te, Nx.t0 - Nx.sw, Nx.t0) : 0, sk = sk0 * sk0;   /* accelerating: the bottom (the stamp) goes last */
    var ly = (H + 40) * sk - 20;
    COVTOP = sk > 0 ? ly + 14 : -1e9;
    drawScene(g, Sc, t);
    if (si === 0 && !POSTERMODE && LIVE.text) hookText(g, t < K.cut ? 1 : 0);
    COVTOP = -1e9;
    if (sk > 0) {
      g.save(); clipAbove(g, ly, te);
      stage(g); INCOMING = true; INTOP = ly - 14; drawScene(g, Nx, t); INCOMING = false; INTOP = -1e9; g.restore();
      tornEdge(g, ly, te);
    }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) {
      /* after "no." the caption leaves and frame 0's 5 WORDS comes back, so the loop lands on frame 0 */
      var back = seg(t, K.noEnd + .04, K.noEnd + .18);
      captions(g, t, 1 - back);
      if (Sc.id === 'outro') hookText(g, seg(t, K.noEnd + .13, K.noEnd + .23));
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    var a = 'Why “think step', b = 'by step” works', px = 88;
    g.save(); font(g, px, 800); g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText(a, CX, 382);
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 474 - 78, wb + 28, 104, 16); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 474); g.restore();
  }
  /* every text that is fully readable at t (not fading, not under a torn edge, not a caption): drawn to find out */
  function TEXTS(t) {
    REC = {}; frame(tctx, t); var r = REC; REC = null;
    return Object.keys(r).map(function (k) { return { id: k, text: k, x0: 0, y0: 0, x1: 0, y1: 0 }; });
  }

  /* ---------- events: the sound design reads the same word times; hits sit between words, never on them ---------- */
  var EV = [];
  /* the SFX gate (vo/heard.js, written from the finished mix): a hit's whole body keeps clear of every word start and end
     that unhinted faster-whisper base.en and small.en heard in the mix, and of every stretch where the voice-only track is
     at or above −40 dBFS. Without heard.js the vo.js word times stand in. */
  function blocked(m) {
    var B = [], Mg = [];
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = Mg[Mg.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else Mg.push(b.slice()); });
    return Mg;
  }
  function free(m) {
    var Mg = blocked(m), F = [], p = 0;
    Mg.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || .19).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  /* Two hits (BRIEF §0): the soft knock under the cream ✗ in the silence after "It said 8.", THE thump under the stamp
     in the silence after "in view." */
  /* Four hits: the soft knock under the cream ✗ after "It said 8.", THE thump under the stamp after "in view.", a paper
     swish under torn edge 2 before "Newer", a soft pop as the end card's chips rise after "on their own." */
  function initGaps() {
    GS.push({ t: GT.knock, type: 'knock', g: .7 });
    GS.push({ t: GT.slam, type: 'thump', g: .24 });
    GS.push({ t: GT.swish, type: 'swish', g: .5 });
    GS.push({ t: GT.pop, type: 'pop', g: 1.6 });
  }
  function initTimes() {
    GS.forEach(function (e) { EV.push({ t: e.t, type: e.type, g: e.g, t1: e.t + BODY[e.type] }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    /* the first two frames are drawn sharp: no motion-blur ghost of the rising tiles on frame 0 */
    if (t < 2 / (fps || 30) - 1e-6) samples = 1;
    if (samples === 1) { POSTERMODE = t === window.FILM.POSTER; frame(ctx, t); POSTERMODE = false; return; }
    var span = (shutter || .5) / (fps || 30); EDGE_T = t;
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    EDGE_T = null; ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- sound: foley cut to the word times; no music (Isac adds a TikTok sound) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 32;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * .9), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 5); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .1; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function band(t, dur, f, q, peak, att, send, pan) { var n = noise(t, dur), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; var ob = bus(1, send || 0, pan); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + (att || .002), peak], [t + dur, 0]]); }
    /* THE hit: a rubber stamp slammed on paper on a desk. Body 250 → 180 Hz and a 330 Hz knock (where a phone speaker
       still plays), with a paper slap at 1.5–2.5 kHz on top so it reads on a phone */
    function stampThump(t, g) {
      g = g || 1;
      var o = osc('sine', 250, t, t + .16, 1, [[t, 0], [t + .004, .75 * g], [t + .15, 0]], .05); o.frequency.exponentialRampToValueAtTime(180, t + .14);
      osc('triangle', 330, t, t + .08, 1, [[t, 0], [t + .002, .55 * g], [t + .07, 0]], .03);
      band(t, .07, 1600, .9, 7.0 * g, .002, .05);
      band(t, .045, 2500, 1.1, 4.7 * g, .001, .03);
    }
    /* the ✗: a soft knuckle knock on the desk, mid band with a little wood, no heavy body (the thump stays the one heavy hit) */
    function knock(t, g) {
      g = g || 1;
      var o = osc('sine', 420, t, t + .1, 1, [[t, 0], [t + .003, .22 * g], [t + .09, 0]], .03); o.frequency.exponentialRampToValueAtTime(300, t + .08);
      band(t, .05, 1400, 1.4, 2.4 * g, .001, .04);
      band(t + .003, .06, 800, 1, 1.2 * g, .002, .04);
    }
    /* torn edge 2: a short paper swish, band noise sweeping down, nothing below 600 Hz */
    function swish(t, g) {
      g = g || 1;
      var n = noise(t, .2), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .8;
      bp.frequency.setValueAtTime(4200, t); bp.frequency.exponentialRampToValueAtTime(1300, t + .18);
      var ob = bus(1, .06, .15); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .05, 1.6 * g], [t + .12, 1.1 * g], [t + .2, 0]]);
    }
    /* the end card's chips: a soft paper pop, two short noise bands and no pitched tone (a pitched blip after "own." was heard as a word) */
    function popS(t, g) {
      g = g || 1;
      band(t, .022, 3600, 1.8, 1.4 * g, .001, .02);
      band(t + .002, .03, 1800, 2.5, .5 * g, .001, .01);
    }
    EV.forEach(function (e) {
      if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'knock') knock(e.t, e.g);
      else if (e.type === 'swish') swish(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone, about −60 dB, so the loop seam is never digital zero; about −50 dB of room bed under the hero hold */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o);
      var h0 = GT.slam + .05, h1 = K.tearA + .3;
      /* and a second, shorter lift of the room as the end card rises (the gap after "on their own.") */
      var e0 = GT.pop - .1, e1 = K.end - .1; /* starts at the pop, not on the tail of "own." (base.en heard the earlier lift as "phone") */
      env(o.gain, [[0, ROOM], [h0, ROOM], [h0 + .2, ROOM * 3.16], [h1 - .15, ROOM * 3.16], [h1 + .1, ROOM], [e0, ROOM], [e0 + .12, ROOM * 3.16], [e1 - .1, ROOM * 3.16], [e1 + .05, ROOM]]); })();
  }
  var ROOM = .0051;

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d'); MC = mk(8, 8).getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '400 58px "Instrument Serif"', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹✓✕–@!>$(),:§+'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {}; layouts();
      window.READY = true;
    });
  }
  initGaps();
  initTimes();
  ARR = [0, 1, 2].map(function (j) { return K.goes + .12 + j * .3; });   /* the copies go in on "goes back in" */
  /* the hero hold: from the stamp settling to the torn edge, fully still */
  var HOLD = { t0: GT.slam + .12, t1: K.tearA };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'stepbystep', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  /* labels vs props: every readable label's box (chip box for chips) against every prop box drawn in the same frame */
  window.LABELS_RUN = function (step) {
    var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) {
      PROPS = []; LBL = []; CURT = t; frame(ctx, t);
      LBL.forEach(function (l) {
        PROPS.forEach(function (p) {
          var ox = Math.min(l.b[2], p.b[2]) - Math.max(l.b[0], p.b[0]), oy = Math.min(l.b[3], p.b[3]) - Math.max(l.b[1], p.b[1]);
          if (ox > 1 && oy > 1) { var key = l.text + ' × ' + p.name, o = out[key] || (out[key] = { label: l.text, prop: p.name, from: t, to: t, area: 0 }); o.to = t; o.area = Math.max(o.area, Math.round(ox * oy)); }
        });
      });
      PROPS = null; LBL = null;
    }
    return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
