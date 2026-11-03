/* "Two prices": GTA 6, Delta #11. A vertical film written in code, narrated first and cut to the voice:
   every visual beat is keyed to a word time from vo/vo.js (window.VO) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Hero prop: two cardboard price tags on strings in a shop window (paper grain, punched holes, ink speckle, cast shadows),
   STANDARD $79.99 and ULTIMATE $99.99. Native move: the Ultimate tag's perforated stub tears off, drops onto the counter
   and gets stamped +$20 (the one hero number); the stub then feeds a receipt printer that prints Rockstar's 16
   Ultimate-only items; five shop door signs flip CLOSED -> OPEN; a box lands under Standard; the stub comes back for the
   vote and the window dissolves into frame 0. Own flat shapes in a Vice City palette. No Rockstar footage, logo or key
   art, no console logos, no music. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0b0820', CREAM = '#fbf0ea';
  var HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d';
  var PURP = '#241250', PURP2 = '#160b36', WALL = '#1c1042', PAPER = '#f2e5cd', INK = '#1d1233', GREY = '#77718a';
  var DISP = 'Archivo';
  /* the shop window: everything in the picture lives inside it (inside the x 90-930 / y 1450 rail) */
  var WX0 = 90, WX1 = 930, WY0 = 244, WY1 = 1450;
  var RAILY = 590, STR = 64, TAGW = 320, BODYH = 520, STUBH = 150, PX = [290, 730], CT = 1338;
  var LAND = { x: 510, y: 1207, s: 1.75 };

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function ein(k) { return k * k * k; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* critically damped settle: 0 -> 1, never overshoots */
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function fin(t, a, d) { return seg(t, a, a + (d || .14)); }
  function out(t, a, d) { return 1 - seg(t, a - (d || .25), a); }
  /* a monotonic knock: rises fast, decays, never goes under 1 */
  function kn(t, a, amt) { if (t < a) return 1; var u = t - a; return 1 + (amt || .08) * (1 - Math.exp(-u * 40)) * Math.exp(-u * 7); }
  function qt(t) { return (Math.floor(t * 30) + .5) / 30; }
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}, ORDER = []; VO.lines.forEach(function (l) { LINE[l.id] = l; ORDER.push(l.id); });
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

  /* ---------- the SFX gate: hits sit in pauses, clear of where the voice really sounds (vo/vad.js) ---------- */
  var EDGES = [], VOICED = [];
  if (window.VAD) window.VAD.forEach(function (v) { VOICED.push({ t0: v[0], t1: v[1] }); EDGES.push(v[0], v[1]); });
  else VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  /* vo/heard.js (Whisper on the mix) is a cross-check only: it stretches words over the pauses, so it gates only when there is no VAD */
  if (!window.VAD) (window.HEARD || []).forEach(function (w) { if (w[1] < .15) return; VOICED.push({ t0: w[0], t1: w[1] }); EDGES.push(w[0], w[1]); });
  function free(m) {
    var B = [], M = [], F = [], p = 0;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { rattle: .2, tick: .03, clack: .1, stamp: .16, rip: .24, slap: .2, chat: .2, printer: .5, snap: .08, flip: .06, thud: .16, pop: .12, swish: .26, tear: .22, paper: .2 };
  function nearGap(t, type, m, body) {
    var bd = body || BODY[type] || .12, best = null;
    free(m || (window.VAD ? .15 : .2)).forEach(function (f) {
      var lo = f[0], hi = f[1] - bd; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  var GT = {}, EV = [];
  function G(id, t, type, tol, gain, extra) {
    var n = nearGap(t, type, extra && extra.m, extra && extra.dur);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .35 : tol)) { GT[id] = n; var e = { t: n, type: type, g: gain == null ? 1 : gain, id: id }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
    else GT[id] = t;
    return GT[id];
  }
  function vadEndBefore(t, from) { var ve = from; (window.VAD || []).forEach(function (v) { if (v[0] < t - .2 && v[1] > ve) ve = v[1]; }); return ve; }
  function after(id) { var i = ORDER.indexOf(id), nx = ORDER[i + 1]; return vadEndBefore(nx ? start(nx) : DUR, end(id) - .6) + .155; }
  function gapAfter(id, word, nth) { var w = find(id, word, nth); return vadEndBefore(w.t1 + .5, w.t0) + .155; }

  /* ---------- canvas + safe-area check ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var BOUNDS = null, NOREC = false, INCOMING = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || INCOMING || NOREC || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
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

  /* ---------- primitives (setting ctx.font resets fontStretch: font() re-applies it) ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); if (g.__st) try { g.fontStretch = g.__st; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function cond(g) { g.__st = 'extra-condensed'; try { g.fontStretch = 'extra-condensed'; } catch (e) {} }
  function semi(g) { g.__st = 'semi-condensed'; try { g.fontStretch = 'semi-condensed'; } catch (e) {} }
  function unst(g) { g.__st = null; try { g.fontStretch = 'normal'; } catch (e) {} }
  /* a text label, never under 36 px on screen */
  function txt(g, text, x, y, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    var px = Math.max(36, o.px || 40);
    g.save(); g.globalAlpha *= clamp(a, 0, 1); if (o.cond !== false) cond(g); font(g, px, o.wt || 900); ls(g, o.ls == null ? 1 : o.ls);
    g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM;
    if (o.s && o.s !== 1) { g.translate(x, y); g.scale(o.s, o.s); g.translate(-x, -y); }
    g.fillText(text, x, y); g.restore(); unst(g);
  }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 56, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    g.save(); if (o.cond !== false) cond(g);
    font(g, px, o.wt || 900); ls(g, o.ls || 1);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .34 : o.pad;
    var w = o.w || tw + pad * 2, h = o.h || px * 1.3;
    g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.shadow !== false) { rr(g, -w / 2 + 5, -h / 2 + 8, w, h, h * .22); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); }
    rr(g, -w / 2, -h / 2, w, h, h * .22); g.fillStyle = o.bg || CREAM; g.fill();
    if (o.line) { g.strokeStyle = o.line; g.lineWidth = 3; g.stroke(); }
    g.fillStyle = o.fg || INK; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore(); unst(g);
    return w;
  }

  /* ---------- paper: seeded grain, fibres, edge wear, torn edges (built once, at 2x) ---------- */
  var TS = 2, TX = {};
  function jag(seed, w) { var r = mulberry(seed), p = []; for (var x = 0; x <= w; x += 9) p.push([x, 5 * Math.sin(x * .09 + 1.3) + (r() - .5) * 9]); p[p.length - 1][0] = w; return p; }
  var JAG = null;
  /* the tag outline in local px (origin top-left): chamfered top corners for a body, jagged edge where torn */
  function tagPath(g, w, h, o) {
    var c = o.chamfer ? 46 : 0, i;
    g.beginPath();
    if (o.tornTop) { g.moveTo(0, JAG[0][1] + 6); for (i = 0; i < JAG.length; i++) g.lineTo(JAG[i][0], JAG[i][1] + 6); }
    else { g.moveTo(c, 0); g.lineTo(w - c, 0); g.lineTo(w, c); }
    if (o.tornBottom) { g.lineTo(w, h + JAG[JAG.length - 1][1] - 6); for (i = JAG.length - 1; i >= 0; i--) g.lineTo(JAG[i][0], h + JAG[i][1] - 6); }
    else { g.lineTo(w, h - 10); g.quadraticCurveTo(w, h, w - 10, h); g.lineTo(10, h); g.quadraticCurveTo(0, h, 0, h - 10); }
    if (!o.tornTop) { g.lineTo(0, c); g.closePath(); } else g.closePath();
  }
  function paperTex(w, h, seed, o) {
    var c = mk(Math.ceil(w * TS), Math.ceil(h * TS) + 24), g = c.getContext('2d'), r = mulberry(seed), i;
    g.scale(TS, TS);
    g.save(); tagPath(g, w, h, o); g.clip();
    g.fillStyle = o.tone || PAPER; g.fillRect(0, -10, w, h + 20);
    /* tooth: thousands of soft specks, warm and pale */
    for (i = 0; i < w * h / 26; i++) { var d = r(); g.fillStyle = d < .6 ? 'rgba(120,86,46,' + (.03 + r() * .07).toFixed(3) + ')' : 'rgba(255,255,255,' + (.10 + r() * .2).toFixed(3) + ')'; g.fillRect(r() * w, r() * h, .6 + r() * 1.3, .6 + r() * 1.3); }
    /* fibres */
    g.lineWidth = .7;
    for (i = 0; i < w * h / 900; i++) { var x = r() * w, y = r() * h, a = r() * 6.28, L = 6 + r() * 14; g.strokeStyle = 'rgba(130,98,60,' + (.06 + r() * .08).toFixed(3) + ')'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * L * .5, y + Math.sin(a + .6) * L * .5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    /* a soft crease and worn, darker edges */
    var cy = h * (.55 + r() * .2);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, cy); g.lineTo(w, cy - 18); g.stroke();
    g.strokeStyle = 'rgba(80,50,20,.07)'; g.beginPath(); g.moveTo(0, cy + 2); g.lineTo(w, cy - 16); g.stroke();
    tagPath(g, w, h, o); g.strokeStyle = 'rgba(140,96,48,.16)'; g.lineWidth = 12; g.stroke();
    tagPath(g, w, h, o); g.strokeStyle = 'rgba(140,96,48,.12)'; g.lineWidth = 4; g.stroke();
    g.restore();
    /* torn edges show the paper's pale core */
    g.lineWidth = 2.4; g.strokeStyle = 'rgba(255,252,240,.95)';
    if (o.tornBottom) { g.beginPath(); for (i = 0; i < JAG.length; i++) g.lineTo(JAG[i][0], h + JAG[i][1] - 7.5); g.stroke(); }
    if (o.tornTop) { g.beginPath(); for (i = 0; i < JAG.length; i++) g.lineTo(JAG[i][0], JAG[i][1] + 7.5); g.stroke(); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    c.w = w; c.h = h; return c;
  }
  /* ink: text drawn, then speckled out, so it reads printed by a worn stamp or a marker */
  function inkText(g, text, x, y, px, col, seed, o) {
    o = o || {};
    var m = mk(4, 4).getContext('2d'); if (o.cond !== false) cond(m); font(m, px, 900); ls(m, o.ls || 0);
    var tw = m.measureText(text).width, cw = Math.ceil(tw + px), ch = Math.ceil(px * 1.5), c = mk(cw * TS, ch * TS), q = c.getContext('2d');
    q.scale(TS, TS); if (o.cond !== false) cond(q); font(q, px, 900); ls(q, o.ls || 0); q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillStyle = col;
    q.fillText(text, cw / 2, ch / 2 + px * .04); unst(q);
    var r = mulberry(seed || strHash(text)); q.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < cw * ch / (o.dense || 55); i++) { q.globalAlpha = .25 + r() * .7; q.beginPath(); q.arc(r() * cw, r() * ch, .35 + r() * (o.big || 1.4), 0, 6.283); q.fill(); }
    q.globalAlpha = 1; q.globalCompositeOperation = 'source-over';
    g.drawImage(c, x - cw / 2, y - ch / 2, cw, ch);
    return tw;
  }
  function buildTag(name, band, price, seed, o) {
    var w = TAGW, h = BODYH, c = paperTex(w, h, seed, { chamfer: true, tornBottom: o.torn }), g = c.getContext('2d');
    g.save(); g.scale(TS, TS);
    g.save(); tagPath(g, w, h, { chamfer: true, tornBottom: o.torn }); g.clip();
    /* the colored band, printed a touch off-register */
    g.fillStyle = band; g.fillRect(-4, 78, w + 8, 82);
    g.globalAlpha = .18; g.fillStyle = '#fff'; var r = mulberry(seed + 5); for (var i = 0; i < 600; i++) g.fillRect(r() * w, 78 + r() * 82, 1 + r() * 2, 1); g.globalAlpha = 1;
    g.restore();
    inkText(g, name, w / 2, 121, 62, INK, seed + 1, { ls: 3, dense: 70 });
    /* the price: big dollars, superscript cents */
    var m = mk(4, 4).getContext('2d'); cond(m); font(m, 150, 900); var dw = m.measureText(price[0]).width; font(m, 74, 900); var cw = m.measureText(price[1]).width;
    var tot = dw + cw + 4, k = Math.min(1, 280 / tot), x0 = w / 2 - tot * k / 2;
    g.save(); g.translate(x0, 0); g.scale(k, k); g.rotate(-.02);
    inkText(g, price[0], dw / 2, 248, 150, INK, seed + 2, { dense: 60, big: 1.8 });
    inkText(g, price[1], dw + 4 + cw / 2, 212, 74, INK, seed + 3, { dense: 60 });
    g.restore();
    /* barcode */
    var rb = mulberry(seed + 9), bx = w / 2 - 104; g.fillStyle = INK;
    while (bx < w / 2 + 100) { var bw = 1.5 + rb() * 4.5; g.globalAlpha = .82 + rb() * .18; g.fillRect(bx, 412, bw, 52); bx += bw + 1.6 + rb() * 4; }
    g.globalAlpha = 1;
    g.restore();
    /* the punched hole: a colored reinforcement ring, then a hole through to the wall */
    g.save(); g.scale(TS, TS);
    g.fillStyle = band; g.beginPath(); g.arc(w / 2, 44, 25, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(29,18,51,.35)'; g.lineWidth = 1.5; g.stroke();
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(w / 2, 44, 13, 0, 6.283); g.fill();
    g.restore();
    return c;
  }
  function buildStub(seed, torn) {
    var w = TAGW, h = STUBH, c = paperTex(w, h, seed, { tornTop: torn, tone: '#efe0c4' }), g = c.getContext('2d');
    g.save(); g.scale(TS, TS);
    g.setLineDash([10, 8]); g.strokeStyle = 'rgba(29,18,51,.22)'; g.lineWidth = 2; rr(g, 16, 24, w - 32, h - 40, 10); g.stroke(); g.setLineDash([]);
    g.restore(); return c;
  }
  function buildTextures() {
    JAG = jag(77, TAGW);
    TX.std = buildTag('STANDARD', TEAL, ['$79', '.99'], 11, {});
    TX.ult = buildTag('ULTIMATE', HOT, ['$99', '.99'], 23, {});
    TX.ultT = buildTag('ULTIMATE', HOT, ['$99', '.99'], 23, { torn: true });
    TX.stub = buildStub(31, false); TX.stubT = buildStub(31, true);
    /* the wall: plaster tooth and faint wallpaper stripes, inside the window */
    var ww = WX1 - WX0, wh = WY1 - WY0, c = mk(ww, wh), g = c.getContext('2d'), r = mulberry(5), i;
    g.fillStyle = WALL; g.fillRect(0, 0, ww, wh);
    for (i = 0; i < 14; i++) { g.fillStyle = 'rgba(25,211,197,.035)'; g.fillRect(i * 62 + 12, 0, 22, wh); }
    for (i = 0; i < ww * wh / 30; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,' + (.05 + r() * .12).toFixed(3) + ')' : 'rgba(255,220,255,' + (.015 + r() * .04).toFixed(3) + ')'; g.fillRect(r() * ww, r() * wh, 1 + r() * 2, 1 + r() * 2); }
    TX.wall = c;
    /* night street for the shops */
    var s = mk(ww, wh), q = s.getContext('2d'), gr = q.createLinearGradient(0, 0, 0, 760);
    gr.addColorStop(0, '#0d0828'); gr.addColorStop(.6, '#2a1258'); gr.addColorStop(1, '#5a2050');
    q.fillStyle = gr; q.fillRect(0, 0, ww, wh);
    q.fillStyle = '#120a2c'; q.fillRect(0, 728, ww, wh - 728);
    for (i = 0; i < ww * (wh - 728) / 40; i++) { q.fillStyle = 'rgba(255,255,255,' + (.01 + r() * .03).toFixed(3) + ')'; q.fillRect(r() * ww, 728 + r() * (wh - 728), 1 + r() * 2, 1); }
    for (i = 0; i < 40; i++) { q.fillStyle = 'rgba(251,240,234,' + (.15 + r() * .4).toFixed(3) + ')'; q.fillRect(r() * ww, r() * 230, 2, 2); }
    TX.street = s;
  }

  /* =====================================================================================================
     THE WINDOW: a shop window display. Wall, brass rail, the GTA 6 enamel plaque, two tags, a counter with a flip strip.
     ===================================================================================================== */
  var T = {};
  function windowFrame(g, kind) {
    g.save();
    g.beginPath(); g.rect(WX0, WY0, WX1 - WX0, WY1 - WY0); g.clip();
    g.drawImage(kind === 'street' ? TX.street : TX.wall, WX0, WY0);
    if (kind !== 'street') {
      var gr = g.createRadialGradient(CX, 860, 40, CX, 860, 640); gr.addColorStop(0, 'rgba(255,138,61,.16)'); gr.addColorStop(1, 'rgba(255,138,61,0)');
      g.fillStyle = gr; g.fillRect(WX0, WY0, WX1 - WX0, WY1 - WY0);
    }
    g.restore();
  }
  function frameEdge(g) { }
  function clipWin(g) { g.beginPath(); g.rect(WX0, WY0, WX1 - WX0, WY1 - WY0); g.clip(); }
  function rail(g, t) {
    /* wall brackets and the brass rod */
    [124, 896].forEach(function (x) { rr(g, x - 16, RAILY - 34, 32, 68, 8); g.fillStyle = '#3a2470'; g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(x, RAILY - 20, 4, 0, 6.283); g.arc(x, RAILY + 20, 4, 0, 6.283); g.fill(); });
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(124, RAILY + 10, 772, 8);
    var gr = g.createLinearGradient(0, RAILY - 8, 0, RAILY + 8); gr.addColorStop(0, '#ffd2a8'); gr.addColorStop(.45, '#e0803e'); gr.addColorStop(1, '#8a3f1c');
    rr(g, 120, RAILY - 8, 780, 16, 8); g.fillStyle = gr; g.fill();
  }
  function plaque(g, t, a) {
    if (a <= 0) return;
    var s = kn(t, at('hook', 'gta'), .1) * kn(t, at('end', 'twenty'), .05);
    g.save(); g.globalAlpha *= a; g.translate(CX, RAILY - 8); g.rotate((theta(0, t) - theta(1, t)) * .35); g.scale(s, s);
    rr(g, -190 + 6, -104 + 8, 380, 98, 16); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -190, -104, 380, 98, 16); g.fillStyle = CREAM; g.fill(); g.strokeStyle = HOT; g.lineWidth = 6; rr(g, -181, -95, 362, 80, 11); g.stroke();
    g.fillStyle = '#c9b9b0'; g.beginPath(); g.arc(-168, -82, 4, 0, 6.283); g.arc(168, -82, 4, 0, 6.283); g.fill();
    cond(g); font(g, 76, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = HOT; ls(g, 3); g.fillText('GTA 6 PRICE', 0, -52); unst(g); ls(g, 0);
    g.restore();
  }
  /* the counter: top surface at CT, a flip strip on its front face carrying sources and the vote */
  function counter(g, t, msg, flipT, prev) {
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(WX0, CT - 10, WX1 - WX0, 10);
    var gr = g.createLinearGradient(0, CT, 0, CT + 16); gr.addColorStop(0, '#ff9d5c'); gr.addColorStop(1, '#a8471d');
    g.fillStyle = gr; g.fillRect(WX0, CT, WX1 - WX0, 16);
    g.fillStyle = PURP2; g.fillRect(WX0, CT + 16, WX1 - WX0, WY1 - CT - 16);
    g.fillStyle = '#0e0726'; g.fillRect(WX0, CT + 26, WX1 - WX0, 64);
    /* a split-flap style turn: the old message folds away, the new one folds in */
    var k = flipT == null ? 1 : seg(t, flipT, flipT + .26), cur = k < .5 ? prev : msg, sy = Math.abs(Math.cos(k * Math.PI));
    if (!cur || sy < .02) return;
    g.save(); g.translate(CX, CT + 58); g.scale(1, sy);
    if (typeof cur === 'function') cur(g, t); else txt(g, cur, 0, 0, { px: 38, align: 'center', ls: 2 });
    g.restore();
  }

  /* ---------- a tag's swing: idle sway + damped kicks (a pendulum), small enough to stay inside the window ---------- */
  var KICKS = [[], []];
  function theta(side, t) {
    var th = side ? .011 * Math.sin(t * 2.33 + 1.9) : .012 * Math.sin(t * 2.71 + .4);
    KICKS[side].forEach(function (k) { if (t > k[0]) { var u = t - k[0]; th += k[1] * Math.exp(-u * 2.4) * Math.sin(u * 6.2); } });
    return clamp(th, -.04, .04);
  }
  function popS(side, t) { var s = 1; (T.pops[side] || []).forEach(function (p) { if (t > p) { var u = t - p; s += .045 * (1 - Math.exp(-u * 30)) * Math.exp(-u * 3.2); } }); return s; }
  /* local tag space -> screen, for anything that has to sit on a swinging tag */
  function tagM(g, side, t) { g.translate(PX[side], RAILY); g.rotate(theta(side, t)); var s = popS(side, t); g.scale(s, s); g.translate(0, STR); }
  function drawTex(g, c, x, y) { g.drawImage(c, x, y, c.width / TS, c.height / TS); }
  function shadowOn(g, d) { g.shadowColor = 'rgba(4,2,14,.55)'; g.shadowBlur = 16; g.shadowOffsetX = 9 * (d || 1); g.shadowOffsetY = 14 * (d || 1); }
  function shadowOff(g) { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0; }
  /* the marker ring around a price, drawn on in 0.32 s */
  function ring(g, t, t0, col) {
    var k = seg(t, t0, t0 + .32); if (k <= 0) return;
    var r = mulberry(t0 * 1000 | 0), a0 = -2.2, n = 40, wob = [];
    for (var i = 0; i <= n; i++) wob.push((r() - .5) * 5);
    g.save(); g.strokeStyle = col; g.lineWidth = 8; g.lineCap = 'round'; g.globalAlpha *= .92; g.beginPath();
    for (i = 0; i <= n * k * 1.1; i++) { var a = a0 + i / n * 6.283 * 1.1 / 1.1 * 1.06, rx = 146 + wob[Math.min(n, i)] + i * .2, ry = 62 + wob[Math.min(n, i)] * .6; var x = TAGW / 2 - 160 + 160 + Math.cos(a) * rx - TAGW / 2, y = 240 + Math.sin(a) * ry; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke(); g.restore();
  }
  function envelope(g, t, side) {
    var k = cd(t, T.envIn + side * .06, 11), a = fin(t, T.envIn + side * .06, .1) * out(t, T.envOut, .2);
    if (a <= 0) return;
    var y = 380 - (1 - k) * 360, s = kn(t, at('bonus', 'both'), .06) * kn(t, at('bonus', 'pack'), .05);
    g.save(); g.globalAlpha *= a; g.translate(0, y); g.rotate((side ? .03 : -.035) * (1 - k * .4)); g.scale(s, s);
    shadowOn(g, .6); rr(g, -128, -76, 256, 152, 8); g.fillStyle = '#f6ead6'; g.fill(); shadowOff(g);
    /* the flap: closed until "Vintage", then it folds up and open */
    var fk = eio(seg(t, at('bonus', 'vintage') - .05, at('bonus', 'vintage') + .25)), fy = lerp(1, -.75, fk);
    g.fillStyle = 'rgba(160,110,60,.12)'; g.beginPath(); g.moveTo(-128, 76); g.lineTo(0, 6); g.lineTo(128, 76); g.closePath(); g.fill();
    g.save(); g.translate(0, -76); g.scale(1, fy); g.beginPath(); g.moveTo(-128, 0); g.lineTo(0, 66); g.lineTo(128, 0); g.closePath(); g.fillStyle = fy > 0 ? ORG : '#d9692a'; g.fill(); g.restore();
    txt(g, 'VINTAGE', 0, 14, { px: 38, align: 'center', col: INK, ls: 3 });
    txt(g, 'VICE CITY PACK', 0, 52, { px: 38, align: 'center', col: INK, ls: 1 });
    /* a binder clip holds it to the tag */
    rr(g, -24, -92, 48, 30, 5); g.fillStyle = '#120a2c'; g.fill(); g.strokeStyle = '#8d8aa0'; g.lineWidth = 3; g.beginPath(); g.moveTo(-14, -92); g.lineTo(-10, -112); g.lineTo(10, -112); g.lineTo(14, -92); g.stroke();
    g.restore();
  }
  function sticker(g, t, side) {
    var t0 = side ? T.stkU : T.stkS, k = cd(t, t0, 16), a = fin(t, t0 - .02, .06);
    if (a <= 0 || t > DUR - .45 + .01 && false) return;
    var s = lerp(1.25, 1, k);
    g.save(); g.globalAlpha *= a; g.translate(0, 352); g.rotate(side ? .035 : -.03); g.scale(s, s);
    shadowOn(g, .35); rr(g, -132, -46, 264, 92, 12); g.fillStyle = side ? HOT : TEAL; g.fill(); shadowOff(g);
    if (side) txt(g, 'DIGITAL', 0, 2, { px: 50, align: 'center', col: INK, ls: 3 });
    else { txt(g, 'DIGITAL OR', 0, -19, { px: 38, align: 'center', col: INK, ls: 2 }); txt(g, 'CODE IN BOX', 0, 21, { px: 38, align: 'center', col: INK, ls: 2 }); }
    g.restore();
  }
  /* one tag. home: frame-0 state (stub on, nothing added) */
  function tag(g, t, side, home) {
    var torn = !home && side === 1 && t >= T.tear, tex = side ? (torn ? TX.ultT : TX.ult) : TX.std;
    g.save(); g.translate(PX[side], RAILY); g.rotate(theta(side, t)); var s = popS(side, t); g.scale(s, s);
    /* string: a loop over the rail, down through the hole */
    g.strokeStyle = '#e9d6bd'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -2, 9, 11, 0, 0, 6.283); g.stroke();
    g.beginPath(); g.moveTo(-5, 8); g.lineTo(-2, STR + 44); g.moveTo(5, 8); g.lineTo(2, STR + 44); g.stroke();
    g.translate(0, STR);
    shadowOn(g); drawTex(g, tex, -TAGW / 2, 0);
    var stubOn = side === 1 && (home || t < T.tear);
    if (stubOn) {
      var tug = Math.max(0, Math.sin(Math.PI * seg(t, T.tug0, T.tug0 + .3))) * 9 + Math.max(0, Math.sin(Math.PI * seg(t, T.tug1, T.tug1 + .22))) * 6 + Math.max(0, Math.sin(Math.PI * seg(t, T.tug2, T.tug2 + .22))) * 9 + Math.max(0, Math.sin(t * 3.1 - 1)) * 2;
      drawTex(g, TX.stub, -TAGW / 2, BODYH + tug);
    }
    shadowOff(g);
    if (stubOn) {
      /* the perforation: a row of punched holes, and a marker "tear here" line on "$20" */
      g.fillStyle = WALL; for (var x = -150; x <= 150; x += 15) { g.beginPath(); g.arc(x, BODYH + 1, 3.2, 0, 6.283); g.fill(); }
      /* a dotted TEAR HERE line and a small scissors, printed on the stub */
      g.save(); g.translate(0, tug); g.strokeStyle = 'rgba(29,18,51,.55)'; g.lineWidth = 3; g.setLineDash([3, 7]); g.beginPath(); g.moveTo(-120, BODYH + 12); g.lineTo(156, BODYH + 12); g.stroke(); g.setLineDash([]);
      g.lineWidth = 3; g.beginPath(); g.arc(-146, BODYH + 6, 6, 0, 6.283); g.arc(-146, BODYH + 20, 6, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(-141, BODYH + 9); g.lineTo(-124, BODYH + 16); g.moveTo(-141, BODYH + 17); g.lineTo(-124, BODYH + 9); g.stroke();
      g.globalAlpha *= .8; txt(g, 'TEAR HERE', 0, BODYH + 72, { px: 36, align: 'center', col: 'rgba(29,18,51,.55)', ls: 6 });
      g.restore();
      var mk2 = home ? 0 : seg(t, T.mark, T.mark + .3);
      if (mk2 > 0) { g.save(); g.strokeStyle = ORG; g.lineWidth = 6; g.lineCap = 'round'; g.setLineDash([16, 12]); g.beginPath(); g.moveTo(-156, BODYH + 12); g.lineTo(-156 + 312 * mk2, BODYH + 12); g.stroke(); g.restore(); }
    }
    /* the string's front strand over the top edge, into the hole */
    g.strokeStyle = '#e9d6bd'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -4); g.quadraticCurveTo(3, 20, 0, 40); g.stroke();
    if (!home) {
      if (t < T.envOut + .1) ring(g, t, side ? T.ring2 : T.ring1, ORG);
      envelope(g, t, side);
      sticker(g, t, side);
      /* the upgrade: the stamped stub, clipped under STANDARD */
      if (side === 0 && t >= T.upOn) {
        g.save(); g.translate(0, BODYH + STUBH / 2 + 4);
        shadowOn(g, .8); drawTex(g, TX.stubT, -TAGW / 2, -STUBH / 2); shadowOff(g);
        g.drawImage(INK20, -INK20.w / 2, -INK20.h / 2 - 20, INK20.w, INK20.h);
        txt(g, '$99.99 − $79.99', 0, 56, { px: 36, align: 'center', col: INK, ls: 1 });
        [-110, 110].forEach(function (cx0) { rr(g, cx0 - 20, -STUBH / 2 - 16, 40, 30, 5); g.fillStyle = '#120a2c'; g.fill(); g.strokeStyle = '#8d8aa0'; g.lineWidth = 3; g.stroke(); });
        g.restore();
      }
    }
    g.restore();
  }
  /* the stub's pose in screen space while it falls (after the tear) */
  function stubPose(t) {
    var th = theta(1, T.tear), sx = Math.sin(th), cx = Math.cos(th), ly = STR + BODYH + STUBH / 2;
    var x0 = PX[1] - sx * ly, y0 = RAILY + cx * ly, k = seg(t, T.tear + .1, T.land), e = ein(k) * .45 + eio(k) * .55;
    var x = lerp(x0, LAND.x, e), y = lerp(y0, LAND.y, e) - Math.sin(Math.PI * k) * 70, s = lerp(1, LAND.s, eio(k));
    var rot = lerp(th, -.035, k) + Math.sin(Math.PI * k) * .35;
    if (t < T.tear + .1) { var u = seg(t, T.tear, T.tear + .1); y = y0 + u * 10; x = x0 - u * 4; rot = th + u * .05; s = 1; }
    if (t > T.land) s *= 1 + .05 * Math.exp(-(t - T.land) * 16);
    return { x: x, y: y, s: s, rot: rot, fx: 1 };
  }
  /* the stub, landed or flying; ink lands on it with the hero stamp */
  function stubAt(g, t, P, inked, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(P.x, P.y); g.rotate(P.rot); g.scale(P.s * P.fx, P.s);
    shadowOn(g, 1 / P.s * 1.4); drawTex(g, TX.stubT, -TAGW / 2, -STUBH / 2); shadowOff(g);
    if (inked > 0) {
      var k = cd(inked, 0, 30), st = lerp(1.12, 1, k);
      g.save(); g.globalAlpha *= clamp(inked * 12, 0, 1); g.scale(st, st);
      g.drawImage(INK20, -INK20.w / 2, -INK20.h / 2 - 20, INK20.w, INK20.h);
      g.restore();
      /* the math, small, at the foot of the stub (never under 36 px on screen) */
      var la = clamp((inked - .2) * 6, 0, 1);
      if (la > 0) { g.save(); g.globalAlpha *= la; cond(g); font(g, 38 / P.s, 900); ls(g, 1); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText('$99.99 − $79.99', 0, 56); g.restore(); unst(g); }
    }
    g.restore();
  }
  var INK20 = null;
  function buildInk() {
    var m = mk(4, 4).getContext('2d'); cond(m); font(m, 150, 900); var w = Math.ceil(m.measureText('+$20').width + 60), h = 190, cc = mk(w * TS, h * TS), q = cc.getContext('2d');
    q.scale(TS, TS); inkTextInto(q, '+$20', w / 2, h / 2, 150, ORG, 2020); cc.w = w; cc.h = h; INK20 = cc;
  }
  function inkTextInto(q, text, x, y, px, col, seed) { inkText(q, text, x, y, px, col, seed, { dense: 34, big: 2.2 }); }

  /* the hand: a generic pointing hand (our flat shapes), hovering between the tags on the question */
  function hand(g, x, y, a, rot) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot || 0);
    g.lineJoin = 'round'; g.lineWidth = 6; g.strokeStyle = INK;
    shadowOn(g, .7);
    rr(g, -62, 150, 124, 140, 14); g.fillStyle = HOT; g.fill(); shadowOff(g); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(-62, 168, 124, 10);
    shadowOn(g, .7); rr(g, -58, 40, 116, 122, 30); g.fillStyle = PAPER; g.fill(); shadowOff(g); g.stroke();
    rr(g, -54, -6, 40, 110, 20); g.fillStyle = PAPER; g.fill(); g.stroke();
    [[-8, 34], [18, 38], [42, 46]].forEach(function (f) { rr(g, f[0] - 2, f[1], 28, 54, 13); g.fillStyle = PAPER; g.fill(); g.stroke(); });
    g.beginPath(); g.ellipse(-64, 108, 18, 34, -.5, 0, 6.283); g.fillStyle = PAPER; g.fill(); g.stroke();
    g.restore();
  }
  /* a box (our flat cardboard, our stripes, no cover art) with a lid that pops open, and the code card inside */
  function gameBox(g, t, x, a) {
    if (a <= 0) return;
    var w = 270, h = 176, top = CT - h;
    g.save(); g.globalAlpha *= a;
    var rat = t > T.rattle && t < T.rattle + .4 ? Math.sin((t - T.rattle) * 70) * 3 * (1 - seg(t, T.rattle, T.rattle + .4)) : 0;
    g.translate(x + rat, 0);
    /* the code card, behind the front face, rising out of the open box */
    var c1 = cd(t, T.card1, 12) * .75 + cd(t, T.card2, 14) * .25, cy = top + 70 - c1 * 190;
    if (t > T.card1 - .05) {
      g.save(); g.beginPath(); g.rect(-200, 300, 400, top + 20 - 300); g.clip();
      g.save(); g.translate(0, cy); g.rotate(-.02);
      shadowOn(g, .5); rr(g, -116, -62, 232, 150, 10); g.fillStyle = CREAM; g.fill(); shadowOff(g);
      g.fillStyle = HOT; g.fillRect(-116, -62, 232, 14);
      txt(g, 'DOWNLOAD', 0, -16, { px: 40, align: 'center', col: INK, ls: 2, s: kn(t, at('code', 'download'), .08) });
      txt(g, 'CODE', 0, 26, { px: 40, align: 'center', col: INK, ls: 2, s: kn(t, at('code', 'download'), .08) });
      g.fillStyle = 'rgba(29,18,51,.28)'; for (var i = 0; i < 3; i++) rr(g, -96 + i * 68, 58, 56, 14, 4), g.fill();
      g.restore(); g.restore();
    }
    /* the body */
    shadowOn(g, .8); g.fillStyle = '#c98a4e'; g.fillRect(-w / 2, top, w, h); shadowOff(g);
    g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(-w / 2, top, w, 10);
    var str = [HOT, ORG, TEAL]; for (var j = 0; j < 3; j++) { g.fillStyle = str[j]; g.fillRect(-w / 2, top + 54 + j * 26, w, 16); }
    g.strokeStyle = 'rgba(60,30,10,.35)'; g.lineWidth = 3; g.strokeRect(-w / 2, top, w, h);
    g.fillStyle = 'rgba(60,30,10,.25)'; g.fillRect(-12, top, 24, 40);
    /* the lid flaps: closed, then they pop open */
    var lk = cd(t, T.lid, 18);
    [-1, 1].forEach(function (sd) {
      g.save(); g.translate(sd * w / 2, top); g.rotate(sd * lerp(0, 2.3, lk) * -1 * -1);
      var fw = w / 2; g.fillStyle = '#b47740'; g.fillRect(sd < 0 ? 0 : -fw, -10, fw, 12);
      g.restore();
    });
    if (lk < .05) { g.fillStyle = '#b47740'; g.fillRect(-w / 2, top - 8, w, 10); }
    g.restore();
  }
  function noBox(g, t, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.setLineDash([16, 12]); g.lineDashOffset = -t * 24; g.strokeStyle = 'rgba(251,240,234,.7)'; g.lineWidth = 5;
    rr(g, PX[1] - 135, CT - 176, 270, 176, 12); g.stroke(); g.setLineDash([]); g.restore();
    txt(g, 'NO BOX', PX[1], CT - 88, { px: 52, align: 'center', a: a, ls: 4 });
  }
  function quoteSlip(g, t, x, y, w, lines, src, a, rot) {
    if (a <= 0) return;
    var h = lines.length * 50 + 78;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot || 0);
    shadowOn(g, .7); rr(g, -w / 2, -h / 2, w, h, 10); g.fillStyle = PAPER; g.fill(); shadowOff(g);
    g.fillStyle = TEAL; g.fillRect(-w / 2, -h / 2, 12, h);
    lines.forEach(function (L, i) { txt(g, L, 8, -h / 2 + 40 + i * 50, { px: 44, align: 'center', col: INK, ls: 1 }); });
    txt(g, src, 8, h / 2 - 32, { px: 36, align: 'center', col: '#5d4f7a', ls: 0 });
    g.restore();
  }

  /* =====================================================================================================
     SCENE: the window with the tags (hook … bonus, and again box … end). home = the frame-0 state for the loop.
     ===================================================================================================== */
  function tagsScene(g, t, home) {
    windowFrame(g, 'wall');
    g.save(); clipWin(g);
    rail(g, t);
    var two = home ? 1e9 : at('hook', 'two');
    plaque(g, home ? 0 : t, 1);
    tag(g, t, 0, home); tag(g, t, 1, home);
    /* counter + strip */
    var msg = null, prev = null, ft = null;
    if (!home) {
      var M = [[T.src, 'US PRICE · PS STORE + XBOX STORE · 31 OCT 2026'], [T.date, 'BEFORE NOV 20, 2026'], [T.lbl, 'EDITION LABELS: ROCKSTARGAMES.COM/VI'], [T.vote, voteStrip]];
      for (var i = 0; i < M.length; i++) if (t >= M[i][0]) { prev = M[i][0] === T.lbl ? null : msg; msg = M[i][1]; ft = M[i][0]; }
      if (t > S('printer').t0 && t < S('tags2').t0) { msg = null; }
      if (t >= S('tags2').t0 && t < T.lbl) { msg = null; ft = null; }
    }
    counter(g, t, msg, ft, prev);
    if (!home) {
      /* ask: the hand */
      var hA = fin(t, T.handIn, .2) * out(t, T.handOut, .25);
      if (hA > 0) {
        var hx = 290, hs = [[at('ask', 'which'), 290], [at('ask', 'one'), 730], [at('ask', 'should'), 290], [at('ask', 'buy'), 730]];
        hs.forEach(function (h) { var k = eio(seg(t, h[0] - .12, h[0] + .1)); hx = lerp(hx, h[1], k); });
        var hy = lerp(1500, 1196, eo(seg(t, T.handIn, T.handIn + .35))) + seg(t, T.handOut - .3, T.handOut) * 320;
        hand(g, hx, hy + Math.sin(t * 9) * 4, hA, (hx - 510) / 3000);
      }
      /* the stub: falling after the tear, landed and stamped through the bonus line */
      if (t >= T.tear && t < S('printer').t0 + .5) {
        var P = stubPose(t);
        stubAt(g, t, P, t >= T.stamp ? t - T.stamp : 0, 1);
      }
      /* box line */
      if (t >= S('tags2').t0) {
        var bx = lerp(-260, PX[0], cd(t, T.boxIn, 13)) - eio(seg(t, T.clear, T.clear + .35)) * 520;
        if (t >= T.boxIn - .05) {
          var drop = cd(t, T.boxIn, 15);
          NOREC = t > T.clear; if (t < T.clear + .4) { g.save(); g.translate(0, -(1 - drop) * 520); gameBox(g, t, PX[0] - eio(seg(t, T.clear, T.clear + .35)) * 480, 1); g.restore(); }
          NOREC = false;
        }
        noBox(g, t, fin(t, T.boxIn + .05, .15) * out(t, T.slipIn + .05, .2));
        var sk = cd(t, T.slipIn, 12), sx = lerp(1150, 728, sk) + eio(seg(t, T.clear, T.clear + .35)) * 480;
        NOREC = sk < .985 || t > T.clear; if (t >= T.slipIn && t < T.clear + .4) quoteSlip(g, t, sx, CT - 108, 350, ['“…A DOWNLOAD', 'CODE INSIDE', 'THE BOX…”'], 'ROCKSTAR · JUNE 24, 2026', 1, .015); NOREC = false;
        /* end: the stub comes back up from behind the counter, stamped */
        if (t >= T.upFly && t < T.upOn) {
          var fk = eio(seg(t, T.upFly, T.upOn)), th0 = theta(0, t), ps0 = popS(0, t), ly0 = (STR + BODYH + STUBH / 2 + 4) * ps0;
          var P3 = { x: lerp(LAND.x, PX[0] - Math.sin(th0) * ly0, fk), y: lerp(1600, RAILY + Math.cos(th0) * ly0, fk) - Math.sin(Math.PI * fk) * 120, s: lerp(1.75, ps0, fk), rot: lerp(.25, th0, fk), fx: 1 };
          NOREC = true; stubAt(g, t, P3, 1, 1); NOREC = false;
        }
        upChip(g, t);
      }
    }
    g.restore();
    frameEdge(g);
  }
  function upChip(g, t) {
    if (t < T.upChip) return;
    var k = cd(t, T.upChip, 12), x = lerp(1160, PX[1], k), a = 1 - eio(seg(t, HOME, HOME + .2));
    NOREC = k < .985;
    g.save(); g.globalAlpha *= a; g.translate(x, CT - 88); g.rotate(-.015);
    shadowOn(g, .7); rr(g, -168, -80, 336, 160, 10); g.fillStyle = PAPER; g.fill(); shadowOff(g);
    g.fillStyle = HOT; g.fillRect(-168, -80, 336, 12);
    txt(g, 'ULTIMATE UPGRADE', 0, -34, { px: 40, align: 'center', col: INK, ls: 1 });
    txt(g, '$20.00 · XBOX STORE', 0, 12, { px: 40, align: 'center', col: '#c24a12', ls: 1 });
    txt(g, '31 OCT 2026', 0, 54, { px: 38, align: 'center', col: '#5d4f7a', ls: 2 });
    g.restore(); NOREC = false;
  }
  function voteStrip(g, t) {
    var a = at('end', 'standard'), b = at('end', 'ultimate');
    chip(g, 'STANDARD', -215, 0, { px: 50, h: 60, bg: CREAM, fg: INK, shadow: false, s: kn(t, a, .06), ls: 3 });
    txt(g, 'OR', 0, 0, { px: 44, align: 'center', ls: 3 });
    chip(g, 'ULTIMATE?', 215, 0, { px: 50, h: 60, bg: CREAM, fg: INK, shadow: false, s: kn(t, b, .06), ls: 3 });
  }

  /* =====================================================================================================
     SCENE: the receipt printer. The stub dives in; Rockstar's 16 Ultimate-only items print, one per beat, then a run.
     ===================================================================================================== */
  /* Rockstar's 16 Ultimate-only items (short forms of Rockstar's names). The four the voice names print big, on their
     words; the other twelve run fast; the receipt ends on a big 16 */
  var ITEMS = [
    { n: "'95 GROTTI CHEETAH", big: 1 }, { n: 'SHITZU SQUALO BOAT', big: 1 }, { n: 'HAWK & LITTLE MORGAN', big: 1 }, { n: 'VICE CITY STYLE OUTFITS', big: 1 },
    { n: "'67 DOMINATOR BUGGY" }, { n: 'PERSONALIZED WEAPONS' }, { n: 'SAFEHOUSE VEHICLES' }, { n: 'GANADO RETRO MODKIT' }, { n: 'RIDEOUT CUSTOMS' },
    { n: "SARA'S UNISEX SALON" }, { n: 'STOCK 305' }, { n: 'ELECTRIC FANG TATTOO' }, { n: "ONE-EYED WILLIE'S" }, { n: 'GOODTIME GEAR' },
    { n: 'PTT YOUNGIN$ STORE' }, { n: 'CLASSIC CAR COLLECTION' }];
  var HEAD = 128, TOT = 170, SLOT = 1166, RX0 = 214, RX1 = 806, TX0 = 250, TXW = 520;
  function rowH(i) { return ITEMS[i].big ? 60 : 44; }
  function feed(t) {
    var L = t >= T.headT ? HEAD * clamp((t - T.headT) / .25, 0, 1) : 0;
    ITEMS.forEach(function (it, i) { L += rowH(i) * clamp((t - T.items[i]) / (it.big ? .14 : .05), 0, 1); });
    return L + TOT * clamp((t - T.tot) / .2, 0, 1);
  }
  /* a receipt line, fitted inside the paper with >= 30 px to spare (narrowed, never shrunk under its size) */
  function rline(g, text, x, y, px, col, a, s) {
    g.save(); g.globalAlpha *= a; cond(g); font(g, px, 900); ls(g, 1);
    var w = g.measureText(text).width * (s || 1), k = Math.min(1, (RX1 - 30 - x) / w);
    g.translate(x, y); if (s && s !== 1) g.scale(s, s); g.scale(k, 1); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(text, 0, 0);
    g.restore(); unst(g);
  }
  function printerScene(g, t) {
    windowFrame(g, 'wall');
    g.save(); clipWin(g);
    rail(g, t);
    counter(g, t, 'ROCKSTAR’S EDITION LIST · OUR COUNT', null, null);
    var running = (t > T.headT && t < T.items[3] + .3) || (t > T.run0 - .05 && t < T.snap);
    var shake = running ? Math.sin(t * 95) * 1.4 : 0;
    var L = feed(t), lift = t > T.snap ? eio(seg(t, T.snap + .05, T.snap + .4)) * 120 : 0;
    if (L > 0) {
      var top = SLOT - L - lift, bot = SLOT - lift;
      g.save(); g.beginPath(); g.rect(WX0, 470, WX1 - WX0, SLOT - 470); g.clip();
      g.translate(shake * .5, 0);
      shadowOn(g, .7); g.fillStyle = '#f6eedd'; g.beginPath(); g.moveTo(RX0, bot);
      for (var x = RX0; x <= RX1; x += 12) g.lineTo(x, top + ((x / 12) % 2 ? 6 : 0));
      g.lineTo(RX1, bot); g.closePath(); g.fill(); shadowOff(g);
      g.fillStyle = 'rgba(120,90,50,.06)'; for (var j = 0; j < 30; j++) g.fillRect(RX0, top + j * 37 % Math.max(1, L), RX1 - RX0, 1);
      rline(g, '16 ULTIMATE-ONLY ITEMS', TX0, top + 46, 46, INK, 1);
      g.save(); g.setLineDash([8, 7]); g.strokeStyle = 'rgba(29,18,51,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(TX0, top + 84); g.lineTo(RX1 - 34, top + 84); g.stroke(); g.restore();
      rline(g, '+$20 · ULTIMATE EDITION', TX0, top + 108, 36, '#c24a12', 1);
      var y = top + HEAD;
      for (var i = 0; i < ITEMS.length; i++) {
        var it = ITEMS[i], k = clamp((t - T.items[i]) / (it.big ? .14 : .05), 0, 1); if (k <= 0) break;
        var h = rowH(i), iy = y + h / 2 + 2;
        if (it.big) rline(g, it.n, TX0, iy, 44, INK, k, kn(t, T.items[i] + .1, .05));
        else rline(g, it.n, TX0, iy, 36, '#4a3d66', k * .9);
        y += h;
      }
      var tk = clamp((t - T.tot) / .2, 0, 1);
      if (tk > 0) {
        g.save(); g.setLineDash([8, 7]); g.strokeStyle = 'rgba(29,18,51,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(TX0, y + 10); g.lineTo(RX1 - 34, y + 10); g.stroke(); g.restore();
        g.save(); g.globalAlpha *= tk; cond(g); font(g, 120, 900); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#c24a12'; var s16 = kn(t, T.snap, .08); g.translate(TX0, y + 84); g.scale(s16, s16); g.fillText('16', 0, 0); g.restore(); unst(g);
        rline(g, 'ULTIMATE-ONLY ITEMS', TX0 + 140, y + 62, 40, INK, tk);
        rline(g, 'ROCKSTAR’S LIST · OUR COUNT', TX0 + 140, y + 108, 36, '#5d4f7a', tk);
      }
      g.restore();
    }
    /* the printer */
    g.save(); g.translate(shake, 0);
    shadowOn(g, 1); rr(g, 220, 1150, 580, CT - 1150, 26); g.fillStyle = '#2b1866'; g.fill(); shadowOff(g);
    rr(g, 220, 1150, 580, 40, 20); g.fillStyle = '#3b2585'; g.fill();
    rr(g, 250, SLOT - 6, 520, 12, 6); g.fillStyle = '#05030f'; g.fill();
    /* the display carries the hero number in LED digits */
    rr(g, 252, 1212, 250, 88, 12); g.fillStyle = '#05030f'; g.fill();
    g.save(); font(g, 58, 800, '"Geist Mono"'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = ORG; g.shadowColor = 'rgba(255,138,61,.6)'; g.shadowBlur = 10; g.fillText('+$20.00', 377, 1258); g.restore();
    var led = running ? (Math.floor(t * 12) % 2 ? 1 : .35) : .3;
    g.fillStyle = 'rgba(25,211,197,' + led + ')'; g.beginPath(); g.arc(746, 1232, 12, 0, 6.283); g.fill();
    for (var v = 0; v < 4; v++) { rr(g, 560 + v * 44, 1268, 30, 40, 6); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); }
    /* the cutter bar */
    var ck = t > T.snap ? 1 - seg(t, T.snap, T.snap + .2) : 0;
    g.fillStyle = ck > 0 ? '#ffffff' : '#8d8aa0'; g.fillRect(250, SLOT - 16 + ck * 6, 520, 5);
    g.restore();
    /* the stub: over the slot from the cut, then it dives in on "$20" */
    var dk = eio(seg(t, T.dive, T.dive + .38));
    if (dk < 1) {
      var P = { x: lerp(LAND.x, CX, dk) + Math.sin(t * 2.6) * 10 * (1 - dk), y: lerp(960, SLOT + 40, dk) + Math.sin(t * 4.1) * 12 * (1 - dk), s: lerp(1.1, .95, dk), rot: lerp(-.05, 0, dk) + Math.sin(t * 3.3) * .05 * (1 - dk), fx: 1 };
      var pre = t < S('printer').t0 + .02 ? 1 : 1;
      g.save(); g.beginPath(); g.rect(0, 0, W, SLOT - 4); g.clip(); stubAt(g, t, P, 1, pre); g.restore();
    }
    g.restore();
    frameEdge(g);
  }

  /* =====================================================================================================
     SCENE: five shops on a night street. CLOSED signs flip to OPEN one by one; Rockstar's own line under them.
     ===================================================================================================== */
  var SHOPS = [
    { n: ['ELECTRIC', 'FANG', 'TATTOO'], c: HOT, f: '#2a1660', icon: 'flash' },
    { n: ["SARA'S", 'UNISEX', 'SALON'], c: TEAL, f: '#1f2a5c', icon: 'chair' },
    { n: ['RIDEOUT', 'CUSTOMS'], c: ORG, f: '#3a1650', icon: 'ramp' },
    { n: ['ONE-EYED', "WILLIE'S"], c: ORG, f: '#1f2a5c', icon: 'tires' },
    { n: ['STOCK', '305'], c: TEAL, f: '#2a1660', icon: 'tee' }
  ];
  /* what each window shows, drawn by hand in flat shapes: lit = warm and readable, dark = a faint silhouette */
  function vitrine(g, kind, cx, y0, lit, t) {
    var ink = lit ? INK : 'rgba(251,240,234,.16)', paper = lit ? '#fbf3e4' : 'rgba(251,240,234,.10)';
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    if (kind === 'flash') {
      /* tattoo flash sheets pinned in the window: a heart with a banner, a star, a dagger */
      [[-36, 0, -.06], [30, 6, .05]].forEach(function (f) { g.save(); g.translate(cx + f[0], y0 + 56 + f[1]); g.rotate(f[2]); g.fillStyle = paper; g.fillRect(-30, -42, 60, 84); g.restore(); });
      g.fillStyle = lit ? HOT : ink; g.beginPath(); g.moveTo(cx - 36, y0 + 52); g.bezierCurveTo(cx - 60, y0 + 30, cx - 50, y0 + 18, cx - 36, y0 + 32); g.bezierCurveTo(cx - 22, y0 + 18, cx - 12, y0 + 30, cx - 36, y0 + 52); g.fill();
      g.fillStyle = lit ? TEAL : ink; g.fillRect(cx - 56, y0 + 54, 40, 10);
      g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 30, y0 + 24); g.lineTo(cx + 30, y0 + 84); g.moveTo(cx + 20, y0 + 40); g.lineTo(cx + 40, y0 + 40); g.stroke();
      g.fillStyle = lit ? ORG : ink; g.beginPath(); for (var k = 0; k < 10; k++) { var r = k % 2 ? 6 : 13, an = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(cx - 34 + Math.cos(an) * r, y0 + 82 + Math.sin(an) * r); } g.fill();
    } else if (kind === 'chair') {
      /* a salon chair under a round mirror */
      g.strokeStyle = lit ? '#b8a7a0' : ink; g.lineWidth = 4; g.beginPath(); g.arc(cx, y0 + 34, 24, 0, 6.283); g.stroke();
      g.fillStyle = lit ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.04)'; g.fill();
      g.fillStyle = lit ? TEAL : ink; rr(g, cx - 26, y0 + 56, 52, 14, 5); g.fill(); rr(g, cx - 22, y0 + 44, 14, 26, 4); g.fill();
      g.fillStyle = ink; g.fillRect(cx - 3, y0 + 70, 6, 24); rr(g, cx - 20, y0 + 92, 40, 7, 3); g.fill();
      rr(g, cx + 18, y0 + 52, 16, 6, 3); g.fill();
    } else if (kind === 'ramp') {
      /* a lifted buggy on a ramp, big wheels */
      g.fillStyle = lit ? 'rgba(29,18,51,.35)' : ink; g.beginPath(); g.moveTo(cx - 58, y0 + 100); g.lineTo(cx + 58, y0 + 100); g.lineTo(cx + 58, y0 + 86); g.closePath(); g.fill();
      g.save(); g.translate(cx, y0 + 66); g.rotate(-.12);
      g.fillStyle = lit ? ORG : ink; rr(g, -40, -18, 80, 22, 6); g.fill();
      g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.moveTo(-20, -18); g.lineTo(-10, -36); g.lineTo(18, -36); g.lineTo(26, -18); g.stroke();
      g.fillStyle = ink; g.beginPath(); g.arc(-26, 12, 15, 0, 6.283); g.arc(28, 12, 15, 0, 6.283); g.fill();
      g.fillStyle = paper; g.beginPath(); g.arc(-26, 12, 5, 0, 6.283); g.arc(28, 12, 5, 0, 6.283); g.fill();
      g.restore();
    } else if (kind === 'tires') {
      /* a stack of tires and a hung wrench board */
      for (var q = 0; q < 3; q++) { g.fillStyle = ink; g.beginPath(); g.ellipse(cx - 20, y0 + 92 - q * 20, 28, 11, 0, 0, 6.283); g.fill(); g.fillStyle = lit ? '#5b4a7a' : 'rgba(0,0,0,0)'; g.beginPath(); g.ellipse(cx - 20, y0 + 90 - q * 20, 12, 4, 0, 0, 6.283); g.fill(); }
      g.fillStyle = lit ? 'rgba(29,18,51,.25)' : ink; g.fillRect(cx + 14, y0 + 16, 40, 64);
      g.strokeStyle = lit ? TEAL : ink; g.lineWidth = 4; for (var w2 = 0; w2 < 3; w2++) { g.beginPath(); g.moveTo(cx + 22 + w2 * 12, y0 + 24); g.lineTo(cx + 22 + w2 * 12, y0 + 70 - w2 * 8); g.stroke(); }
    } else if (kind === 'tee') {
      /* a tee on a dress form */
      g.fillStyle = ink; g.beginPath(); g.arc(cx, y0 + 18, 9, 0, 6.283); g.fill(); g.fillRect(cx - 2, y0 + 80, 4, 18); rr(g, cx - 16, y0 + 96, 32, 6, 3); g.fill();
      g.fillStyle = lit ? HOT : ink; g.beginPath(); g.moveTo(cx - 12, y0 + 30); g.lineTo(cx - 34, y0 + 42); g.lineTo(cx - 26, y0 + 56); g.lineTo(cx - 18, y0 + 52); g.lineTo(cx - 18, y0 + 82); g.lineTo(cx + 18, y0 + 82); g.lineTo(cx + 18, y0 + 52); g.lineTo(cx + 26, y0 + 56); g.lineTo(cx + 34, y0 + 42); g.lineTo(cx + 12, y0 + 30); g.quadraticCurveTo(cx, y0 + 40, cx - 12, y0 + 30); g.fill();
      g.fillStyle = lit ? CREAM : ink; g.fillRect(cx - 10, y0 + 56, 20, 6);
    }
    g.restore();
  }
  function shopsScene(g, t) {
    windowFrame(g, 'street');
    g.save(); clipWin(g);
    /* a slow push in, the whole scene (clipped by the window, so the rail holds) */
    var push = 1 + .03 * seg(t, S('shops').t0 - .45, S('tags2').t0);
    g.translate(CX, 880); g.scale(push, push); g.translate(-CX, -880);
    /* far palms, our silhouettes */
    g.fillStyle = '#160c34';
    [[150, 760, 1], [880, 740, -1]].forEach(function (p) {
      g.save(); g.translate(p[0], p[1]); g.scale(p[2], 1); g.fillRect(-6, -230, 12, 260);
      for (var f = 0; f < 6; f++) { g.save(); g.translate(0, -230); g.rotate(-1.6 + f * .62 + Math.sin(t * 1.1 + f) * .03); g.beginPath(); g.ellipse(56, 0, 60, 12, 0, 0, 6.283); g.fill(); g.restore(); }
      g.restore();
    });
    g.fillStyle = '#2a1a50'; g.fillRect(WX0, 1004, WX1 - WX0, 18); g.fillStyle = 'rgba(251,240,234,.18)'; g.fillRect(WX0, 1004, WX1 - WX0, 3);
    var five = at('shops', 'five');
    SHOPS.forEach(function (S0, i) {
      var x0 = 114 + i * 160, w = 152, cx = x0 + w / 2;
      var lit = t >= T.flips[i] + .1, litK = seg(t, T.flips[i] + .05, T.flips[i] + .25);
      var cnt = t >= five + i * .08;
      /* facade, roof, bulbs (they count up to five on "five") */
      g.save(); shadowOn(g, .5); g.fillStyle = S0.f; g.fillRect(x0, 488, w, 516); shadowOff(g); g.restore();
      g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x0, 488, w, 12);
      /* the upper floor: two windows, one lit (seeded), and a parapet */
      [x0 + 22, x0 + w - 62].forEach(function (wx, k) { var on = ((i * 3 + k) % 3) !== 0; g.fillStyle = on ? 'rgba(255,190,120,.55)' : '#0a0620'; g.fillRect(wx, 506, 40, 56); g.strokeStyle = 'rgba(251,240,234,.18)'; g.lineWidth = 2; g.strokeRect(wx, 506, 40, 56); g.fillRect(wx + 19, 506, 2, 56); });
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x0, 590, w, 10);
      for (var b = 0; b < 5; b++) { var on = cnt ? 1 : .18; g.fillStyle = cnt ? 'rgba(255,214,150,' + on + ')' : 'rgba(255,214,150,.18)'; g.beginPath(); g.arc(x0 + 18 + b * 29, 626, 6, 0, 6.283); g.fill(); }
      /* the striped awning with a scalloped edge */
      /* the awning is rolled up until "five", then each one unrolls, counting to five */
      var ah = lerp(6, 50, cd(t, five + i * .09, 13)), ab = 640 + ah;
      g.save(); g.beginPath(); g.moveTo(x0 - 6, 640); g.lineTo(x0 + w + 6, 640); g.lineTo(x0 + w + 6, ab);
      for (var sc = 5; sc >= 0; sc--) g.arc(x0 - 6 + (sc + .5) * (w + 12) / 6, ab, (w + 12) / 12 * clamp(ah / 50, .2, 1), 0, Math.PI, false);
      g.closePath(); g.clip();
      for (var st = 0; st < 10; st++) { g.fillStyle = st % 2 ? CREAM : S0.c; g.fillRect(x0 - 6 + st * 17, 640, 17, 70); }
      g.restore();
      /* the window: dark glass, then warm light and the shop's icon when it opens */
      g.fillStyle = '#0a0620'; g.fillRect(x0 + 12, 716, w - 24, 112);
      var pk = [at('names', 'tattoos'), at('names', 'salon'), at('names', 'mod'), at('names', 'mod'), at('names', 'clothing')][i], flash = t > pk ? Math.exp(-(t - pk) * 4) : 0;
      if (flash > .02) { g.fillStyle = 'rgba(255,255,255,' + (.5 * flash) + ')'; g.fillRect(x0, 600, w, 404); }
      if (litK > 0) { var gr = g.createLinearGradient(0, 716, 0, 828); gr.addColorStop(0, 'rgba(255,190,120,' + (.85 * litK) + ')'); gr.addColorStop(1, 'rgba(255,79,163,' + (.55 * litK) + ')'); g.fillStyle = gr; g.fillRect(x0 + 12, 716, w - 24, 112); }
      vitrine(g, S0.icon, cx, 720, litK > .5, t);
      g.strokeStyle = 'rgba(251,240,234,.25)'; g.lineWidth = 3; g.strokeRect(x0 + 12, 716, w - 24, 112);
      /* the door */
      g.fillStyle = '#07041a'; g.fillRect(cx - 36, 846, 72, 158); g.fillStyle = litK > 0 ? 'rgba(255,190,120,' + (.5 * litK) + ')' : 'rgba(255,255,255,.05)'; g.fillRect(cx - 24, 858, 48, 54);
      /* the door sign: CLOSED, flipping to OPEN (a turn about its string) */
      var fk = seg(t, T.flips[i], T.flips[i] + .16), fy = Math.cos(fk * Math.PI), open = fk >= .5;
      var swing = t > T.flips[i] ? Math.exp(-(t - T.flips[i]) * 3) * Math.sin((t - T.flips[i]) * 9) * .08 : Math.sin(t * 1.7 + i) * .02;
      g.save(); g.translate(cx, 878); g.rotate(swing);
      g.strokeStyle = '#cfc2b8'; g.lineWidth = 2; g.beginPath(); g.moveTo(-30, 14); g.lineTo(0, -8); g.lineTo(30, 14); g.stroke();
      g.fillStyle = '#cfc2b8'; g.beginPath(); g.arc(0, -8, 4, 0, 6.283); g.fill();
      g.translate(0, 44); g.scale(1, Math.max(.04, Math.abs(fy)));
      shadowOn(g, .5); rr(g, -66, -28, 132, 58, 9); g.fillStyle = open ? TEAL : HOT; g.fill(); shadowOff(g);
      txt(g, open ? 'OPEN' : 'CLOSED', 0, 2, { px: open ? 42 : 36, align: 'center', col: open ? INK : CREAM, ls: open ? 4 : 1 });
      g.restore();
      /* the name card, taped under the shop, dropped in with its sign */
      var nk = cd(t, T.flips[i] + .04, 14), na = fin(t, T.flips[i] + .04, .08);
      if (na > 0) {
        var pairK = [at('names', 'tattoos'), at('names', 'salon'), at('names', 'mod'), at('names', 'mod'), at('names', 'clothing')][i];
        var s = kn(t, pairK, .16);
        g.save(); g.globalAlpha *= na; g.translate(cx, 1112 - (1 - nk) * 60); g.rotate([-.03, .025, -.02, .03, -.025][i]); g.scale(s, s);
        shadowOn(g, .5); rr(g, -74, -76, 148, 152, 8); g.fillStyle = PAPER; g.fill(); shadowOff(g);
        g.fillStyle = 'rgba(251,240,234,.55)'; g.fillRect(-26, -86, 52, 18);
        var nl = S0.n.length; S0.n.forEach(function (L, j) { txt(g, L, 0, (j - (nl - 1) / 2) * 44, { px: 40, align: 'center', col: INK, ls: 0 }); });
        g.restore();
      }
    });
    /* an ULTIMATE EDITION ONLY plate hangs across the row on "only", so OPEN never reads as "open to everyone" */
    var ok2 = cd(t, at('shops', 'only') - .05, 12);
    if (t >= at('shops', 'only') - .05) {
      var py = lerp(380, 612, ok2), sw = Math.sin(t * 1.6) * .006 + (t > T.flips[4] ? Math.exp(-(t - T.flips[4]) * 3) * Math.sin((t - T.flips[4]) * 8) * .02 : 0);
      g.save(); g.translate(CX, py); g.rotate(sw);
      g.strokeStyle = '#cfc2b8'; g.lineWidth = 2; g.beginPath(); g.moveTo(-200, -26); g.lineTo(-230, -124); g.moveTo(200, -26); g.lineTo(230, -124); g.stroke();
      shadowOn(g, .6); rr(g, -250, -30, 500, 64, 12); g.fillStyle = HOT; g.fill(); shadowOff(g);
      rr(g, -242, -22, 484, 48, 8); g.strokeStyle = 'rgba(251,240,234,.7)'; g.lineWidth = 3; g.stroke();
      txt(g, 'ULTIMATE EDITION ONLY', 0, 2, { px: 44, align: 'center', col: INK, ls: 3, s: kn(t, T.flips[4] + .1, .06) });
      g.restore();
    }
    /* Rockstar's own line, exact and unhighlighted, under the row */
    var qk = cd(t, T.quote, 12);
    NOREC = qk < .985; if (t >= T.quote) g.save(); var qs = kn(t, at('shops', 'open'), .05); g.translate(CX, 1316); g.scale(qs, qs); g.translate(-CX, -1316); quoteSlip(g, t, CX, lerp(1560, 1316, qk), 760, ['“ONLY OPEN FOR BUSINESS', 'WITH THE ULTIMATE EDITION”'], 'ROCKSTARGAMES.COM/VI · ON EACH OF THESE 5', 1, -.012); g.restore(); NOREC = false;
    g.restore();
    frameEdge(g);
  }

  /* ---------- captions (the voice, phrase by phrase; the hook line is carried by the picture) ---------- */
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) {
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { outc.push(cur); cur = []; }
      });
      if (cur.length) outc.push(cur);
    });
    return outc.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE - .14, sc.t0 - SWIPE) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1 };
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), outk = 1 - seg(t, o0, o1);
    if (fi * outk <= 0) return;
    var k = cd(t, card0.t0 - .04, 16);
    g.save(); g.font = '800 72px Archivo'; wide(g);
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 20;
    var lines, lw, maxw = 740, cpx = 72;
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
    var lh = cpx * 1.16, y0 = 400 - (lines.length - 1) * lh / 2;
    g.globalAlpha = fi * outk * wipeHide(t) * (alpha == null ? 1 : alpha);
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - k) * 30;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 12, y - cpx * .87, ws[i] + 24, cpx * 1.15, 18); g.fill(); }
        g.fillStyle = 'rgba(5,2,15,.55)'; if (!cur) g.fillText(w.w, x + 3, y + 4);
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SWIPE = .42, SC, HOME;
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SCENES = { tags: function (g, t) { tagsScene(g, t, false); }, printer: printerScene, shops: shopsScene, tags2: function (g, t) { tagsScene(g, t, false); } };
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) { g.save(); SCENES[Sc.id](g, t); g.restore(); }
  function edgeY(x, ly, t) { return ly + (x - 540) * .10 + Math.sin(x * .02 + t * 6) * 3; }
  var POSTERMODE = false;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(t, Nx.t0 - SWIPE, Nx.t0)) : 0;
    drawScene(g, Sc, t);
    if (sk > 0) {
      var ly = H * (1 - sk) - 70, x;
      g.save(); g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; drawScene(g, Nx, t); INCOMING = false; g.restore();
      g.save(); g.lineJoin = 'round'; g.beginPath(); g.rect(WX0, WY0, WX1 - WX0, WY1 - WY0); g.clip();
      [[HOT, 10, 0], [TEAL, 6, 16]].forEach(function (c) { g.strokeStyle = c[0]; g.lineWidth = c[1]; g.beginPath(); for (x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t) + c[2]; if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); });
      g.restore();
    }
    var back = eio(seg(t, HOME, HOME + .35));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); tagsScene(g, t - DUR, true); g.restore(); }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) { if (back > 0) captions(g, t, 1 - back); else captions(g, t); }
    if (!POSTERMODE) {
      g.fillStyle = 'rgba(251,240,234,.12)'; g.fillRect(90, 222, 840, 6);
      g.fillStyle = HOT; g.fillRect(90, 222, 840 * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function posterTitle(g) {
    g.save(); g.fillStyle = 'rgba(11,8,32,.96)'; g.fillRect(90, 318, 840, 150); font(g, 54, 900); wide(g); g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    g.fillStyle = CREAM; g.fillText('TWO PRICES', CX, 382);
    font(g, 46, 900); wide(g);
    var b = 'WHICH ONE?', wb = g.measureText(b).width;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(CX - wb / 2 - 18, 398, wb + 36, 62, 14); g.fill();
    g.fillStyle = BG; g.fillText(b, CX, 444); g.restore();
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    var p0 = S('printer').t0, s0 = S('shops').t0, t2 = S('tags2').t0;
    Tx('plq', 'GTA 6 PRICE', 0, p0 - .2); Tx('plq', 'GTA 6 PRICE', t2 + .1, DUR + 1);
    Tx('std', 'STANDARD $79.99', 0, p0 - .2); Tx('std', 'STANDARD $79.99', t2 + .1, DUR + 1);
    Tx('ult', 'ULTIMATE $99.99', 0, p0 - .2); Tx('ult', 'ULTIMATE $99.99', t2 + .1, DUR + 1);
    Tx('src', 'US PRICE · PS STORE + XBOX STORE · 31 OCT 2026', T.src + .3, T.date);
    Tx('stub', '+$20', T.stamp + .1, p0 - .2);
    Tx('math', '$99.99 − $79.99', T.stamp + .4, p0 - .2);
    Tx('date', 'BEFORE NOV 20, 2026', T.date + .3, p0 - .2);
    Tx('env', 'VINTAGE VICE CITY PACK', T.envIn + .4, p0 - .2);
    Tx('led', '+$20.00', p0 + .05, s0 - .2);
    Tx('cnt', 'ROCKSTAR’S EDITION LIST · OUR COUNT', p0 + .05, s0 - .2);
    Tx('head', '16 ULTIMATE-ONLY ITEMS', T.headT + .3, T.headOut);
    Tx('i0', ITEMS[0].n, T.items[0] + .15, T.i0Out);
    Tx('quote', '“ONLY OPEN FOR BUSINESS WITH THE ULTIMATE EDITION”', T.quote + .3, S('tags2').t0 - SWIPE);
    Tx('qsrc', 'ROCKSTARGAMES.COM/VI · ON EACH OF THESE 5', T.quote + .3, S('tags2').t0 - SWIPE);
    SHOPS.forEach(function (S0, i) { Tx('shop' + i, S0.n.join(' '), T.flips[i] + .3, S('tags2').t0 - SWIPE); });
    Tx('open', 'OPEN', T.flips[4] + .2, S('tags2').t0 - SWIPE);
    Tx('plate', 'ULTIMATE EDITION ONLY', at('shops', 'only') + .3, S('tags2').t0 - SWIPE);
    Tx('nobox', 'NO BOX', T.boxIn + .1, T.slipIn + .1);
    Tx('lbl', 'EDITION LABELS: ROCKSTARGAMES.COM/VI', T.lbl + .3, T.vote);
    Tx('stkS', 'DIGITAL OR CODE IN BOX', T.stkS + .15, HOME);
    Tx('stkU', 'DIGITAL', T.stkU + .15, HOME);
    Tx('q2', '“…A DOWNLOAD CODE INSIDE THE BOX…”', T.slipIn + .3, T.clear);
    Tx('q2s', 'ROCKSTAR · JUNE 24, 2026', T.slipIn + .3, T.clear);
    Tx('card', 'DOWNLOAD CODE', T.card1 + .4, T.clear);
    Tx('vote', 'STANDARD OR ULTIMATE?', T.vote + .3, HOME);
    Tx('stubS', '+$20', T.upOn + .1, HOME);
    Tx('up1', 'ULTIMATE UPGRADE', T.upChip + .3, HOME);
    Tx('up2', '$20.00 · XBOX STORE', T.upChip + .3, HOME);
    Tx('up3', '31 OCT 2026', T.upChip + .3, HOME);
    return o;
  }

  /* ---------- events: hits placed in real pauses of the voice (vo/vad.js); beats with no free pause stay silent ---------- */
  function initTimes() {
    SC = [
      { id: 'tags', name: 'Two prices', t0: 0 },
      { id: 'printer', name: 'What $20 adds', t0: start('adds') - .05, swipe: true },
      { id: 'shops', name: 'Five shops', t0: start('shops') - .05, swipe: true },
      { id: 'tags2', name: 'Box, and the vote', t0: start('box') - .05, swipe: true }
    ];
    SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
    HOME = DUR - .45;
    T.pops = [[], []];
    /* frame 0: a tag tick before the first word, quieter than it; the tags are already swinging */
    G('on', .04, 'tick', .06, .5);
    KICKS[0].push([-.4, .022]); KICKS[1].push([-.2, -.018]); KICKS[0].push([.04, .02]);
    /* hook: both tags jolt on "two"; the strip turns to the price source after "prices." */
    KICKS[0].push([at('hook', 'two'), .05]); KICKS[1].push([at('hook', 'two') + .05, -.05]);
    T.src = G('src', after('hook') - .05, 'rattle', .3, 1); KICKS[0].push([T.src, -.02]); KICKS[1].push([T.src + .04, .02]);
    T.tug0 = .45;
    /* ask: the hand rises and points left, right, left, right */
    T.handIn = start('ask') - .05; T.handOut = start('hero') + .1;
    /* pair: each tag pops forward on its name; marker rings on the prices; clacks in the gaps */
    /* the tag the hand points at pops forward; marker rings land on the prices on "prices" */
    T.pops[0].push(at('ask', 'which'), at('ask', 'should')); T.pops[1].push(at('ask', 'one'), at('ask', 'buy'));
    KICKS[0].push([at('ask', 'which'), .015]); KICKS[1].push([at('ask', 'one'), -.015]);
    T.ring1 = at('hook', 'prices') - .05; T.ring2 = T.ring1 + .2;
    /* hero: the stub tugs on "That's" and "gap", a tear-here line on "$20"; tear in the pause, it lands, the stamp */
    T.tug1 = at('hero', 'thats'); T.mark = at('hero', '20'); T.tug2 = at('hero', 'gap');
    T.tear = G('rip', after('hero'), 'rip', .1, 1);
    KICKS[1].push([T.tear, .03]);
    T.land = T.tear + .36;
    T.stamp = G('stamp', T.land, 'stamp', .1, 1.2, { heavy: true });
    /* bonus: the strip turns to the date on "Before", envelopes drop onto both tags, knock on "both" with a slap */
    T.date = at('bonus', 'before') - .05; T.envIn = at('bonus', 'before') + .05;
    G('slap', gapAfter('bonus', '20'), 'slap', .2, .9);
    KICKS[0].push([at('bonus', 'both'), .015]); KICKS[1].push([at('bonus', 'both'), -.015]);
    T.envOut = S('printer').t0 + .5;
    G('w_print', S('printer').t0 - SWIPE + .02, 'tear', .25, .7);
    /* adds: the stub dives on "$20"; the head prints; one item per beat; the run and the cutter in the pause */
    T.dive = at('adds', '20') - .05; T.headT = T.dive + .3;
    T.items = [at('adds', 'cars'), at('adds', 'boat'), at('adds', 'revolvers'), at('adds', 'outfits')];
    T.run0 = G('run', after('adds'), 'printer', .15, .9, { dur: .6 });
    for (var i = 4; i < 16; i++) T.items[i] = T.run0 + (i - 4) * .045;
    T.tot = T.run0 + .56;
    T.snap = G('snap', T.run0 + .64, 'snap', .15, 1);
    T.headOut = (function () { for (var tt = T.headT; tt < DUR; tt += .02) if (SLOT - feed(tt) + 46 < 490) return tt; return S('shops').t0 - SWIPE; })();
    T.i0Out = Math.min(S('shops').t0 - SWIPE, (function () { for (var tt = T.items[0]; tt < DUR; tt += .02) if (SLOT - feed(tt) + HEAD + 30 < 490) return tt; return 99; })());
    /* the cut to the shops is carried by the cutter snap */
    /* shops: bulbs count to five on "five"; Rockstar's line on "open"; the five signs flip in the pause after "Ultimate." */
    T.quote = S('shops').t0 - .3;   /* under the cut, so the street's lower half is never empty; it knocks on "open" */
    var f0 = after('shops');
    T.flips = [];
    for (i = 0; i < 5; i++) { T.flips[i] = f0 + i * .17; G('flip' + i, T.flips[i] + .06, 'flip', .06, .85 + i * .05); }
    G('w_tags2', S('tags2').t0 - SWIPE + .02, 'tear', .25, .7);
    /* box: the box drops in the pause after "box?"; stickers on "Standard" / "comes"; the strip names the source */
    T.boxIn = at('box', 'box') - .05; G('thud', after('box') - .02, 'thud', .3, 1);
    T.lbl = at('box2', 'only') - .05;
    T.stkS = at('box2', 'standard'); T.stkU = at('box2', 'comes') + .05;
    T.slipIn = at('box2', 'comes');
    /* code: lid pops, the card rises on "box", rattles on "download", pops fully up in the pause after "code." */
    T.lid = T.slipIn + .25; T.rattle = at('code', 'download');
    T.card1 = at('code', 'inside'); T.card2 = G('pop', after('code'), 'pop', .2, 1);
    /* end: the box and the slip clear on "So,"; the strip turns to the vote; the stub comes back on "twenty" */
    /* upgrade: box and slip clear; the stamped stub rises and clips onto STANDARD after "later?"; the upgrade label on "upgrade" */
    T.clear = start('upgrade') - .02;
    T.upOn = G('clip', gapAfter('upgrade', 'later'), 'snap', .3, 1); T.upFly = T.upOn - .5;
    T.upChip = at('upgrade', 'upgrade') - .05;
    KICKS[0].push([T.upOn, .03]);
    T.vote = end('upgrade') + .05;
    KICKS[0].push([at('end', 'standard'), .02]); KICKS[1].push([at('end', 'ultimate'), -.02]);
    G('home', HOME - .05, 'swish', .2, .7);
    STRESS = [['ask', 'which'], ['hero', '20'], ['bonus', 'both'], ['adds', '20'], ['shops', 'five'], ['box2', 'standard'], ['code', 'code'], ['upgrade', '20'], ['end', 'twenty']].map(function (p) { return at(p[0], p[1], p[2]); });
    EV.sort(function (a, b) { return a.t - b.t; });
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

  /* ---------- sound: paper and counter foley, written into the pauses; no music (Isac adds a TikTok sound) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .8;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, pts, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function clack(t, g) { var n = noise(t, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 4; var o = bus(1, (rnd() - .5) * .4); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .002, .55 * g], [t + .045, 0]]); thump(t + .005, .22 * g); tick(t + .06, .3 * g); }
    function stamp(t, g, heavy) { thump(t, .7 * g); if (heavy) thump(t + .01, .45 * g, 90); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]]); o.frequency.exponentialRampToValueAtTime(900, t + .08); thump(t, .12 * g, 200); }
    function tear(t, t1, g) { band(t, t1, 700, 2600, .05 * g, .04 * g, 1.8); for (var j = 0; j < 4; j++) tick(t + (t1 - t) * (j + .5) / 4, .12 * g); }
    /* card stock ripping along a perforation: a rising crackle of fibres over a dry hiss */
    function rip(t, g) { band(t, t + .22, 1200, 4200, .09 * g, .05 * g, 1.2); for (var j = 0; j < 9; j++) tick(t + .01 + j * .023 + rnd() * .008, (.25 + rnd() * .3) * g); thump(t + .2, .12 * g, 220); }
    function paper(t, g) { band(t, t + .18, 2500, 4500, .07 * g, .02 * g, 1.5); tick(t + .1, .25 * g); thump(t + .1, .18 * g); }
    /* a receipt printer: a buzzing train of dot-head ticks */
    function printer(t, d, g) { for (var tt = t; tt < t + d; tt += .021) tick(tt, (.18 + rnd() * .1) * g); osc('square', 118, t, t + d, [[t, 0], [t + .02, .018 * g], [t + d - .03, .018 * g], [t + d, 0]]); band(t, t + d, 2400, 2600, .02 * g, .02 * g, 4); }
    function snap(t, g) { tick(t, 1.2 * g); tick(t + .012, .8 * g); thump(t, .1 * g, 400); }
    function flip(t, g) { tick(t, .7 * g); band(t, t + .05, 1800, 900, .05 * g, .0, 2); thump(t + .01, .06 * g, 260); }
    /* two paper tags knocking on their strings: a few dry ticks and a soft card slap */
    function rattle(t, g) { for (var j = 0; j < 5; j++) tick(t + j * .035 + rnd() * .01, (.5 + rnd() * .4) * g); band(t, t + .16, 1800, 3600, .05 * g, .02 * g, 1.4); thump(t + .02, .1 * g, 240); }
    function thud(t, g) { thump(t, .55 * g, 110); var sn = noise(t, .14), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 700; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .006, .3 * g], [t + .12, 0]]); tick(t + .03, .2 * g); }
    /* balanced on the final mix (hit peak vs the neighbouring voice): every hit >= 3 dB under the voice */
    var LEVEL = { tick: 2, clack: 1.7, stamp: .5, rip: 3, slap: 1.8, paper: 1.8, chat: 1.2, printer: 1.2, snap: 1.4, flip: 2.2, thud: 1, pop: 3.5, swish: 10, tear: 14, rattle: 2 };
    /* per-hit trims from the final-mix measurement (hits.py): each hit 3-6 dB under its neighbouring words */
    var TRIM = { on: 13, src: 11.5, rip: 3, stamp: .5, w_print: 5, run: .5, snap: 3, flip0: 5, flip1: .5, flip2: 6.5, flip3: 6.5, flip4: 6, w_tags2: 13, thud: 0, pop: .5, clip: 12.5, home: 7 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, (TRIM[e.id] || 0) / 20);
      if (e.type === 'clack') clack(e.t, g);
      else if (e.type === 'tick') { tick(e.t, .9 * g); thump(e.t, .08 * g); }
      else if (e.type === 'stamp') stamp(e.t, g, e.heavy);
      else if (e.type === 'rip') rip(e.t, g);
      else if (e.type === 'slap' || e.type === 'paper') paper(e.t, g);
      else if (e.type === 'chat') printer(e.t, .18, g);
      else if (e.type === 'printer') printer(e.t, e.dur || .5, g);
      else if (e.type === 'snap') snap(e.t, g);
      else if (e.type === 'flip') flip(e.t, g);
      else if (e.type === 'thud') thud(e.t, g);
      else if (e.type === 'rattle') rattle(e.t, g);
      else if (e.type === 'pop') popS(e.t, g);
      else if (e.type === 'tear') tear(e.t, e.t + .2, g);
      else if (e.type === 'swish') band(e.t, e.t + .24, 900, 5200, .1 * g, .02, 1.6);
    });
    /* no music: Isac adds a trending sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    env(master.gain, [[0, .8], [DUR - .3, .8], [DUR, .55]]);
    /* room tone, so the loop seam is never digital zero */
    (function () { var o = bus(1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = window.ROOM_GAIN || .048; })();
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '800 58px "Geist Mono"', '400 60px "Instrument Serif"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”’·→…#?‹|~$+'); })).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures(); buildInk();
      window.READY = true;
    });
  }

  initTimes();
  var POSTER_T = Math.min(T.stamp + .32, start('bonus') - .08);
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: POSTER_T, SLUG: 'gta-editions', SHOTS: SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; }), init: init, render: render, frame: frame, LIVE: LIVE, T: T, GT: GT };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
