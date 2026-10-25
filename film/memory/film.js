/* "Memory" — why AI forgets what you said. Factory #8 on Tech, explained (How AI works, part 5), after ../battery/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t. Contract: window.FILM,
   DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). The native move is the chat scroll inside a fixed reading frame: on every
   send a coral reader bar sweeps the whole chat from MESSAGE 1 down; when the CONTEXT WINDOW frame snaps around it, new
   bubbles push in until the top strip, the one with the SAM name tag, crosses the edge, tears and falls out.
   Scene cuts are a torn paper edge rising from the bottom, the next scene drawn under it.
   Everything is hand-built: a paper name tag, a generic chat app (no logo, no real interface; tagged RE-CREATED), a ruled
   index card, a mechanical tally counter, a sticky note, a saved-memory card, a quote card. Facts: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', DIM = 'rgba(244,237,224,.5)';
  var HOT = '#ff5b3d', YEL = '#ffd65a';
  var PAPER = '#f1e9d8', INK = '#211d26', REDINK = '#d8332b', BACKP = '#d6c9b1';
  var BODY = '#2d2937', BODY2 = '#3d3849', SCREEN = '#1b1a21';
  var DISP = 'Archivo', MONO = '"Geist Mono"';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
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

  /* scenes. swipe:true = the next scene rises in on a torn paper edge, drawn under the old one */
  var SWIPE = .42, PRE = .3;
  function cutAt(prev, next) { var g0 = end(prev), g1 = start(next); return Math.max(g0 + SWIPE + .02, Math.min(g1 + .05, g0 + SWIPE + .25)); }
  var SC = [
    { id: 'hook', fn: 'tag', name: 'Your name', t0: 0 },
    { id: 'secret', fn: 'empty', name: 'The secret', t0: start('secret') - .05, swipe: true },
    { id: 'reread', fn: 'chat', name: 'Every send', t0: at('reread', 'hit') + .05, swipe: true },
    { id: 'limit', fn: 'window', name: 'The window', t0: at('limit', 'hold') - .25, swipe: true },
    { id: 'patch', fn: 'patch', name: 'The patch', t0: cutAt('name', 'patch'), swipe: true },
    { id: 'end', fn: 'end', name: 'Yes or no', t0: at('end', 'ever') - .1, swipe: true }
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
    font(g, px, o.wt, o.fam); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw + pad * 2 > o.maxw && px > 30) { px -= 2; font(g, px, o.wt, o.fam); tw = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore(); ls(g, 0);
    return w;
  }
  function label(g, text, x, y, a, col, px, align, plate) {
    px = Math.max(30, px || 36);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); ls(g, 3); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    while (g.measureText(text).width > 800 && px > 30) { px--; font(g, px, 500, MONO); }
    var dy = (1 - Math.min(1, a)) * 14;
    if (plate) {
      var w = g.measureText(text).width, x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
      rr(g, x0 - 18, y - px * .78 + dy, w + 36, px * 1.56, 12); g.fillStyle = 'rgba(21,19,27,.92)'; g.fill();
    }
    g.fillStyle = col || CREAM;
    g.fillText(text, x, y + dy); g.restore(); ls(g, 0);
  }
  function block(g, lines, x, y, px, a, plate, col, wt, fam) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 500, fam || MONO); ls(g, 0); g.textAlign = 'center'; g.textBaseline = 'middle';
    var lh = px * 1.3, w = 0; lines.forEach(function (l) { w = Math.max(w, g.measureText(l).width); });
    var y0 = y - (lines.length - 1) * lh / 2;
    if (plate) { rr(g, x - w / 2 - 22, y0 - lh / 2 - 10, w + 44, lh * lines.length + 20, 14); g.fillStyle = 'rgba(21,19,27,.94)'; g.fill(); if (plate === 'line') { g.strokeStyle = CREAM; g.lineWidth = 3; g.stroke(); } }
    g.fillStyle = col || CREAM; lines.forEach(function (l, i) { g.fillText(l, x, y0 + i * lh); });
    g.restore();
  }
  function tri(g, a, b, c, d, e, f) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.lineTo(e, f); g.closePath(); g.fill(); }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  function sheet(g, x, y, w, h, rot, a, fn, col) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(-w / 2 + 12, -h / 2 + 18, w, h);
    g.fillStyle = col || PAPER; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(-w / 2, h / 2 - 6, w, 6);
    if (fn) fn(g, w, h);
    g.restore();
  }
  function tag(g, text, x, y, a, rot) { chip(g, text, x, y, { px: 32, wt: 700, fam: MONO, line: HOT, lw: 4, fg: HOT, a: a, rot: rot == null ? .03 : rot, shadow: false, bg: 'rgba(21,19,27,.85)' }); }

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
  function stamp(g, text, x, y, t, t0, t1, px, col, rot, bare) {
    if (t < t0 || t > t1 + .3) return;
    var c = stampTex(text, col, px);
    var k = sp(t, t0, 3.2, .8), s = lerp(1.35, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (1 - seg(t, t1, t1 + .3));
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.1 : rot); g.scale(s, s);
    if (k >= 1) recBox(g, -c.w / 2 - 14, -c.h / 2 - 4, c.w / 2 - 6, c.h / 2 + 4, text);
    if (!bare) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-c.w / 2 - 4, -c.h / 2 + 10, c.w + 8, c.h);
      g.fillStyle = PAPER; g.fillRect(-c.w / 2 - 14, -c.h / 2 - 4, c.w + 8, c.h + 8); }
    g.drawImage(c, -c.w / 2 - 10, -c.h / 2); g.restore();
  }

  /* =====================================================================================================
     THE NAME TAG. The film's one object: HELLO / my name is / SAM, peeling at one corner (peel = fraction of width).
     ===================================================================================================== */
  function nameTag(g, x, y, w, rot, peel, a, erase) {
    if (a <= 0 || w <= 0) return;
    var h = w * .72, p = clamp(peel, 0, .45) * w, r = w * .035;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0);
    function body() { g.beginPath(); g.moveTo(-w / 2 + r, -h / 2); g.lineTo(w / 2 - r, -h / 2); g.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); g.lineTo(w / 2, h / 2 - p); g.lineTo(w / 2 - p, h / 2); g.lineTo(-w / 2 + r, h / 2); g.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); g.lineTo(-w / 2, -h / 2 + r); g.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); g.closePath(); }
    g.save(); g.translate(w * .015, h * .03); g.fillStyle = 'rgba(0,0,0,.35)'; body(); g.fill(); g.restore();
    g.save(); body(); g.clip();
    g.fillStyle = PAPER; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = HOT; g.fillRect(-w / 2, -h / 2, w, h * .36);
    g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, Math.round(w * .135), 900); wide(g); ls(g, w * .006); g.fillText('HELLO', 0, -h / 2 + h * .15); ls(g, 0);
    g.fillStyle = HOT; g.fillRect(-w / 2, h / 2 - h * .07, w, h * .07);
    font(g, Math.round(w * .27), 900); wide(g); g.fillStyle = INK;
    g.save(); g.translate(-w * .02, h * .17); g.rotate(-.04); g.fillText('SAM', 0, 0);
    /* forgotten: "AM" rubbed out to faint ink, a coral eraser smear across it */
    if (erase > 0) {
      var sw = g.measureText('S').width, fw = g.measureText('SAM').width, ex0 = -fw / 2 + sw, ex1 = fw / 2 + w * .02, eh = w * .2;
      g.globalAlpha *= clamp(erase, 0, 1);
      g.fillStyle = 'rgba(241,233,216,.78)'; g.fillRect(ex0 + 2, -eh * .62, ex1 - ex0, eh * 1.1);
      g.strokeStyle = 'rgba(255,91,61,.55)'; g.lineCap = 'round'; g.lineWidth = eh * .32; g.beginPath(); g.moveTo(ex0 + 10, eh * .05);
      for (var q = 1; q <= 4; q++) g.lineTo(ex0 + (ex1 - ex0 - 20) * q / 4 + 10, eh * (q % 2 ? -.22 : .18)); g.stroke();
    }
    g.restore();
    g.restore();
    /* the peeled flap: the corner folded back over the face, its paper back showing */
    if (p > 2) {
      g.fillStyle = 'rgba(0,0,0,.25)'; tri(g, w / 2 - 4, h / 2 - p + 6, w / 2 - p + 6, h / 2 - 4, w / 2 - p - 8, h / 2 - p - 8);
      g.fillStyle = BACKP; tri(g, w / 2, h / 2 - p, w / 2 - p, h / 2, w / 2 - p, h / 2 - p);
      g.strokeStyle = 'rgba(33,29,38,.18)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, h / 2 - p); g.lineTo(w / 2 - p, h / 2); g.stroke();
    }
    g.restore();
  }

  /* ---------- the chat: a generic re-created app; bubbles carry real short lines (a made-up trip plan) ---------- */
  var MSG = [
    [1, "Hi, I'm Sam!"], [0, 'Hi Sam! How can I help?'], [1, 'Plan a trip to Rome?'], [0, 'Day one: the Colosseum.'],
    [1, 'Cheaper hotels?'], [0, 'Try Trastevere.'], [1, 'Add a food tour.'], [0, 'Here are three good ones.'],
    [1, 'What about day four?'], [0, 'Day four: the Vatican.'], [1, 'Train to Florence?'], [0, 'Fast trains run daily.'],
    [1, 'Pack for rain?'], [0, 'Bring a light jacket.'], [1, 'Best gelato?'], [0, 'Near the Pantheon.'],
    [1, 'Is the metro easy?'], [0, 'Yes, two main lines.'], [1, 'Tipping in Rome?'], [0, 'Small, and optional.']
  ];
  var ASK = [1, "What's my name?"], NOPE = [0, "Sorry, I don't know."];
  function msgAt(i) { return MSG[i % MSG.length]; }
  var BH = 80, GAP = 100;
  /* one bubble; x0..x1 the column; m = [user, text] */
  function bubble(g, m, x0, x1, y, a, s) {
    if (a <= 0) return null;
    s = s == null ? 1 : s;
    font(g, 36, 700); var tw = g.measureText(m[1]).width, w = Math.min(x1 - x0 - 30, tw + 60), bx = m[0] ? x1 - 20 - w : x0 + 20;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(bx + w / 2, y); g.scale(s, s);
    rr(g, -w / 2 + 4, -BH / 2 + 7, w, BH, 26); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill();
    rr(g, -w / 2, -BH / 2, w, BH, 26); g.fillStyle = m[0] ? HOT : CREAM; g.fill();
    g.fillStyle = m[0] ? BG : INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(m[1], 0, 2);
    g.restore();
    return { x: bx, w: w };
  }
  /* the panel: header (an avatar dot and "Chat"), a message area, a composer with a SEND pill */
  var PANEL = { x0: 150, x1: 870, y0: 560, y1: 1260 }, AREA = { y0: 650, y1: 1166 };
  function panel(g, a, sendK, inner) {
    if (a <= 0) return;
    var P = PANEL, w = P.x1 - P.x0, h = P.y1 - P.y0;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    rr(g, P.x0 + 10, P.y0 + 16, w, h, 40); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, P.x0, P.y0, w, h, 40); g.fillStyle = SCREEN; g.fill(); g.strokeStyle = 'rgba(244,237,224,.3)'; g.lineWidth = 4; g.stroke();
    g.fillStyle = BODY2; el(g, P.x0 + 56, P.y0 + 44, 22, 22);
    font(g, 38, 700); g.fillStyle = CREAM; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('Chat', P.x0 + 96, P.y0 + 46);
    g.fillStyle = 'rgba(244,237,224,.18)'; g.fillRect(P.x0 + 24, P.y0 + 86, w - 48, 3);
    /* messages, clipped to the area */
    g.save(); g.beginPath(); g.rect(P.x0 + 4, AREA.y0 - 6, w - 8, AREA.y1 - AREA.y0 + 6); g.clip(); if (inner) inner(g); g.restore();
    /* composer */
    rr(g, P.x0 + 24, P.y1 - 82, w - 210, 62, 31); g.fillStyle = BODY; g.fill();
    font(g, 32, 500, MONO); g.fillStyle = DIM; g.fillText('Message', P.x0 + 56, P.y1 - 50);
    g.save(); g.translate(P.x1 - 100, P.y1 - 51); var ps = 1 - .1 * clamp(sendK || 0, 0, 1); g.scale(ps, ps);
    rr(g, -76, -31, 152, 62, 31); g.fillStyle = HOT; g.fill(); font(g, 32, 900); wide(g); g.fillStyle = BG; g.textAlign = 'center'; g.fillText('SEND', 0, 2);
    g.restore();
    g.restore();
  }
  /* the reader bar: a coral line sweeping down from y0 to y1 (k 0..1), a soft band trailing above it */
  function sweepBar(g, x0, x1, y0, y1, k, a) {
    if (k <= 0 || k >= 1 || a <= 0) return;
    var y = lerp(y0, y1, k);
    g.save(); g.globalAlpha *= clamp(a, 0, 1) * Math.min(1, (1 - k) * 8, k * 12);
    var gr = g.createLinearGradient(0, y - 110, 0, y); gr.addColorStop(0, 'rgba(255,91,61,0)'); gr.addColorStop(1, 'rgba(255,91,61,.32)');
    g.fillStyle = gr; g.fillRect(x0, y - 110, x1 - x0, 110);
    g.fillStyle = HOT; g.fillRect(x0 - 8, y - 4, x1 - x0 + 16, 8);
    tri(g, x0 - 26, y - 16, x0 - 26, y + 16, x0 - 6, y);
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · hook + told: the huge name tag peels; it shrinks onto MESSAGE 1 of a re-created chat
     ===================================================================================================== */
  var BIG = { x: CX, y: 1080, w: 830 };
  function peelAt(t) { return .22 + .06 * eio(seg(t, 0, .3)) + .015 * Math.sin(Math.max(0, t) * 2.2) + .04 * clamp(sp(t, at('hook', 'name') - .03, 2.6, .8), 0, 1.1); }
  function swayAt(t) { return -.045 + Math.sin(t * 1.5) * .02; }
  var M1 = { y: AREA.y0 + 44 };
  function riseK(t) { var a = at('told', 'you') - .3; return eio(seg(t, a, a + .55)); }
  function flyK(t) { var a = at('told', 'told') - .05; return eio(seg(t, a, at('told', 'first') + .05)); }
  function tagScene(g, t) {
    var rise = riseK(t), fk = flyK(t), py = (1 - rise) * 1300;
    var vf = at('told', 'very'), m2 = end('told') - .25;
    var bx = 554;
    var wasI = INCOMING; if (rise < 1) INCOMING = true;
    g.save(); g.translate(0, py);
    panel(g, rise > 0 ? 1 : 0, 0, function (g) {
      var b = bubble(g, MSG[0], PANEL.x0, PANEL.x1, M1.y, 1, kn(t, vf)); bx = b ? b.x : 0;
      bubble(g, MSG[1], PANEL.x0, PANEL.x1, M1.y + GAP, fin(t, m2), lerp(.8, 1, clamp(pop(t, m2), 0, 1)));
    });
    g.restore();
    INCOMING = wasI;
    if (rise > 0) {
      chip(g, 'MESSAGE 1', 245, M1.y + py + 2, { px: 40, wt: 900, bg: CREAM, fg: BG, a: fin(t, at('told', 'you') + .05) * rise, s: kn(t, at('told', 'first')), rot: -.03 });
      tag(g, 'RE-CREATED', 760, 520 + py, fin(t, at('told', 'you') + .2), .04);
    }
    /* the tag: huge on frame 0, then it flies onto MESSAGE 1's corner */
    var tx = lerp(BIG.x, bx - 85, fk), ty = lerp(BIG.y, M1.y, fk) - Math.sin(fk * Math.PI) * 80, tw = lerp(BIG.w, 130, fk);
    nameTag(g, tx, ty, tw, lerp(swayAt(t), -.14, fk), lerp(peelAt(t), .08, fk), 1, 1 - fk);
    stamp(g, '?', 765, 800, t, .15, at('told', 'told') - .15, 170, HOT, .12);
  }
  /* frame 0's headline: WHY DOES CHATGPT / FORGET?, FORGET? on a coral pill from frame 0 */
  function headline(g, t, a, idle) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    var px = 104; font(g, px, 900); wide(g);
    var l1 = 'WHY DOES CHATGPT', tw = g.measureText(l1).width;
    if (tw > 800) { px = Math.floor(px * 800 / tw); font(g, px, 900); wide(g); }
    g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText(l1, CX, 340);
    var s2 = 'FORGET?', w2 = g.measureText(s2).width, y = 460;
    var kk = idle ? 0 : Math.max(0, knock(t, at('hook', 'forget'), 16, 6));
    g.save(); g.translate(CX, y); var sq = 1 + .05 * kk; g.scale(sq, sq);
    rr(g, -w2 / 2 - 18, -px * .6, w2 + 36, px * 1.2, 16); g.fillStyle = HOT; g.fill();
    g.fillStyle = BG; g.textAlign = 'center'; g.fillText(s2, 0, 0);
    g.restore(); g.restore();
  }
  function headA(t) { var c = at('told', 'you'); return 1 - seg(t, c - .3, c - .06); }
  function hookIdle(g, ti) { nameTag(g, BIG.x, BIG.y, BIG.w, swayAt(ti), peelAt(Math.max(0, ti)), 1, 1); }

  /* =====================================================================================================
     SCENE 2 · secret: between two replies, the model's memory card is empty
     ===================================================================================================== */
  function wallClock(g, x, y, r, hr, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 6, 10, r, r);
    g.fillStyle = CREAM; el(g, 0, 0, r, r); g.strokeStyle = BODY; g.lineWidth = r * .1; g.beginPath(); g.arc(0, 0, r * .95, 0, 6.283); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 4; for (var i = 0; i < 12; i++) { var an = i * Math.PI / 6; g.beginPath(); g.moveTo(Math.sin(an) * r * .68, -Math.cos(an) * r * .68); g.lineTo(Math.sin(an) * r * .82, -Math.cos(an) * r * .82); g.stroke(); }
    var ha = hr / 12 * 6.283, ma = hr * 6.283;
    g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ha) * r * .45, -Math.cos(ha) * r * .45); g.stroke();
    g.strokeStyle = HOT; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ma) * r * .68, -Math.cos(ma) * r * .68); g.stroke();
    g.fillStyle = HOT; el(g, 0, 0, 8, 8);
    g.restore();
  }
  function emptyScene(g, t) {
    var s0 = S('secret').t0, sec = at('secret', 'secret'), btw = at('secret', 'between'), rem = at('secret', 'remembers'), not = at('secret', 'nothing');
    bubble(g, MSG[1], 150, 870, 600, fin(t, s0), 1);
    label(g, 'REPLY 1', 250, 680, fin(t, s0 + .05), CREAM, 36, 'left');
    bubble(g, MSG[3], 150, 870, 1250, fin(t, btw - .1), lerp(.8, 1, clamp(pop(t, btw - .1), 0, 1)));
    label(g, 'REPLY 2', 250, 1330, fin(t, btw), CREAM, 36, 'left');
    /* a dashed line between them: the time between replies */
    g.save(); g.strokeStyle = 'rgba(244,237,224,.45)'; g.lineWidth = 5; g.setLineDash([14, 12]); g.lineDashOffset = -t * 40;
    g.beginPath(); g.moveTo(200, 720); g.lineTo(200, lerp(720, 1190, eio(seg(t, s0, btw + .3)))); g.stroke(); g.restore();
    /* the memory card: ruled, empty */
    var ck = pop(t, sec - .12, 2.8);
    sheet(g, CX + 30, 950 + (1 - Math.min(1, ck)) * 60, 600, 380, -.025, clamp(ck * 3, 0, 1), function (g, w, h) {
      g.fillStyle = 'rgba(216,51,43,.5)'; g.fillRect(-w / 2 + 70, -h / 2, 3, h);
      g.fillStyle = 'rgba(60,90,160,.28)'; for (var i = 0; i < 5; i++) g.fillRect(-w / 2, -h / 2 + 120 + i * 52, w, 3);
      font(g, 56, 900); wide(g); g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('MEMORY', -w / 2 + 96, -h / 2 + 62);
    });
    wallClock(g, 800, 760, 64, 2 + (t - s0) * 2.2, fin(t, s0 + .15));
    stamp(g, 'EMPTY', CX + 40, 1000, t, at('secret', 'it') - .2, S('reread').t0 - SWIPE, 120, HOT, -.12);
    chip(g, 'OPENAI: “STATELESS”', CX, 1390, { px: 46, wt: 700, fam: MONO, line: CREAM, lw: 3, fg: CREAM, bg: 'rgba(21,19,27,.94)', shadow: false, a: fin(t, S('secret').t0 + .2) });
  }

  /* =====================================================================================================
     SCENE 3 · reread + hundred: SEND, the reader bar sweeps from MESSAGE 1 down; the tally counter rolls to 100
     ===================================================================================================== */
  var SENDS = [], ROLL = [];
  function chatTimes() {
    var s1 = at('reread', 'send'), r1 = at('reread', 'rereads'), r1e = wend('reread', 'chat');
    SENDS = [
      { send: s1 - .12, sw0: s1 + .1, sw1: r1 + .05, reads: 1 },
      { send: r1 + .12, sw0: r1 + .25, sw1: r1e - .05, reads: 2 }
    ];
    /* the roll: 3..10, then 20..100 in tens, from "By" to the second "100" */
    var a = at('hundred', 'by'), b = at('hundred', '100', 1), vals = [3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    ROLL = vals.map(function (v, i) { return { v: v, t: lerp(a, b, eio(seg(i / (vals.length - 1), 0, 1)) * .55 + (i / (vals.length - 1)) * .45) }; });
  }
  function readsAt(t) { var v = 0; SENDS.forEach(function (s) { if (t >= s.sw1) v = s.reads; }); ROLL.forEach(function (r) { if (t >= r.t) v = r.v; }); return v; }
  function lastStep(t) { var v = -1e9; SENDS.forEach(function (s) { if (t >= s.sw1) v = s.sw1; }); ROLL.forEach(function (r) { if (t >= r.t) v = r.t; }); return v; }
  /* messages in the chat: 4 at the start; each send adds the user's line, each sweep's end adds the reply */
  function countAt(t) {
    var n = 4;
    SENDS.forEach(function (s) { n += eio(seg(t, s.send, s.send + .2)) + eio(seg(t, s.sw1, s.sw1 + .2)); });
    ROLL.forEach(function (r, i) { if (i > 0) n += 2 * eio(seg(t, ROLL[i - 1].t, ROLL[i - 1].t + .12)); });
    return n;
  }
  function sweepK(t) {
    for (var i = 0; i < SENDS.length; i++) { var s = SENDS[i]; if (t >= s.sw0 && t < s.sw1) return eio(seg(t, s.sw0, s.sw1)); }
    for (var j = 1; j < ROLL.length; j++) { var a = ROLL[j - 1].t, b = ROLL[j].t; if (t >= a && t < b) return seg(t, a, b); }
    return 0;
  }
  function sendK(t) { var k = 0; SENDS.forEach(function (s) { k = Math.max(k, Math.sin(Math.PI * seg(t, s.send - .05, s.send + .2))); }); return k; }
  /* draws the scroll with MESSAGE 1 pinned at the top; newer messages slide up beneath it */
  function pinnedChat(g, t, n, sk) {
    var vis = 5, off = Math.max(0, n - vis), x0 = PANEL.x0, x1 = PANEL.x1;
    var last = Math.ceil(n - 1e-6);
    for (var j = 1; j < last; j++) {
      var y = M1.y + (j - off) * GAP; if (y < M1.y + 20 || y > AREA.y1 + 60) continue;
      var a = clamp(n - j, 0, 1), m = j < MSG.length ? msgAt(j) : msgAt(2 + (j - 2) % (MSG.length - 2));
      bubble(g, m, x0, x1, y + (1 - a) * 40, a, lerp(.85, 1, a));
    }
    /* the pinned first message, on its own strip of screen */
    g.fillStyle = SCREEN; g.fillRect(x0 + 4, AREA.y0 - 6, x1 - x0 - 8, BH + 22);
    g.fillStyle = 'rgba(244,237,224,.22)'; g.fillRect(x0 + 30, AREA.y0 + BH + 14, x1 - x0 - 60, 3);
    var b = bubble(g, MSG[0], x0, x1, M1.y, 1, 1);
    nameTag(g, b.x - 85, M1.y, 130, -.14, .08, 1);
    var yb = Math.min(AREA.y1, M1.y + (Math.min(n, vis) - 1) * GAP + BH / 2);
    sweepBar(g, x0 + 30, x1 - 30, M1.y - BH / 2, yb, sk, 1);
  }
  /* the tally counter: three wheels, each digit slides up into place */
  var CNT = { x: 735, y: 790, w: 330, h: 190 };
  function counter(g, t, v, vPrev, kStep, a, s) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(CNT.x, CNT.y); g.scale(s || 1, s || 1);
    var w = CNT.w, h = CNT.h;
    rr(g, -w / 2 + 8, -h / 2 + 14, w, h, 26); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 26); g.fillStyle = '#4a4556'; g.fill(); g.strokeStyle = 'rgba(244,237,224,.35)'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#6a6478'; el(g, w / 2 - 4, 0, 14, 30);
    var ds = ('000' + v).slice(-3), dp = ('000' + vPrev).slice(-3), dw = 82, dh = 120;
    for (var i = 0; i < 3; i++) {
      var cx = (i - 1) * (dw + 12);
      g.save(); rr(g, cx - dw / 2, -dh / 2, dw, dh, 10); g.fillStyle = CREAM; g.fill(); g.clip();
      font(g, 96, 900); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (ds[i] !== dp[i] && kStep < 1) { var k = eo(kStep); g.fillText(dp[i], cx, 4 - k * dh); g.fillText(ds[i], cx, 4 + (1 - k) * dh); }
      else g.fillText(ds[i], cx, 4);
      g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(cx - dw / 2, -dh / 2, dw, 18); g.fillRect(cx - dw / 2, dh / 2 - 18, dw, 18);
      g.restore();
    }
    g.restore();
  }
  function chatScene(g, t) {
    var h0 = at('hundred', 'by'), n100 = at('hundred', '100'), n100b = at('hundred', '100', 1), tms = at('hundred', 'times');
    var shrink = eio(seg(t, h0 - .35, h0 + .2)), s = lerp(1, .6, shrink);
    var n = countAt(t), sk = sweepK(t);
    g.save(); g.translate(PANEL.x0, PANEL.y0); g.translate(lerp(0, -50, shrink), lerp(0, 30, shrink)); g.scale(s, s); g.translate(-PANEL.x0, -PANEL.y0);
    panel(g, 1, sendK(t), function (g) { pinnedChat(g, t, n, sk); });
    g.restore();
    tag(g, 'RE-CREATED', lerp(760, 380, shrink), lerp(520, 545, shrink), fin(t, S('reread').t0), .04);
    /* the counter: TIMES MESSAGE 1 WAS READ */
    var v = readsAt(t), ls0 = lastStep(t), vp = 0;
    SENDS.forEach(function (x) { if (x.sw1 === ls0) vp = x.reads - 1; }); ROLL.forEach(function (r, i) { if (r.t === ls0) vp = i ? ROLL[i - 1].v : 2; });
    var ca = fin(t, SENDS[0].sw1 - .2);
    var cx0 = lerp(CX, CNT.x, shrink);
    /* the pile: one MESSAGE 1 strip per read, fanned, the counter riding on top */
    var vs = lerp(vp, v, eo(seg(t, ls0, ls0 + .14))), PB = 1010, ptop = PB - vs * 2;
    if (shrink > 0) {
      g.save(); g.globalAlpha *= clamp(shrink * 2, 0, 1) * ca;
      var nS = Math.round(vs);
      for (var i = 0; i < nS; i++) {
        var yy = PB - i * 2 - 22, xo = Math.sin(i * 1.7) * 9 + Math.sin(i * .37) * 6, rr0 = Math.sin(i * 2.3) * .025;
        g.save(); g.translate(CNT.x + xo, yy); g.rotate(rr0);
        g.fillStyle = i === nS - 1 ? PAPER : (i % 2 ? '#e6dcc8' : '#d9ceb8'); g.fillRect(-150, -22, 300, 44);
        g.fillStyle = HOT; g.fillRect(70, -14, 66, 28);
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-150, 20, 300, 2);
        g.restore();
      }
      g.restore();
    }
    var cyc = lerp(1260, ptop - 44 - 100, shrink);
    g.save(); g.translate(cx0 - CNT.x, cyc - CNT.y);
    counter(g, t, v, vp, seg(t, ls0, ls0 + .14), ca, lerp(.62, 1, shrink) * kn(t, n100b));
    g.restore();
    label(g, 'MESSAGE 1 READ', cx0, lerp(1180, cyc - 132, shrink), ca, CREAM, lerp(34, 36, shrink), 'center', true);
    /* the screenshot frame: REPLY 100 = MESSAGE 1 READ 100× */
    chip(g, 'REPLY 100', CX, 1110, { px: 84, wt: 900, bg: HOT, fg: BG, a: fin(t, n100 - .05), s: lerp(1.25, 1, clamp(pop(t, n100 - .05, 3.2), 0, 1)), rot: -.02 });
    chip(g, '= MESSAGE 1 READ 100×', CX, 1240, { px: 60, wt: 900, bg: CREAM, fg: BG, a: fin(t, at('hundred', 'its') - .2), s: lerp(1.06, 1, clamp(pop(t, at('hundred', 'its') - .2, 3.2), 0, 1)) * kn(t, n100b), maxw: 760 });
    label(g, 'EVERY SEND READS THE WHOLE CHAT', CX, 1345, fin(t, tms + .3), CREAM, 36, 'center', true);
  }

  /* =====================================================================================================
     SCENE 4 · limit + size + fall + name: the CONTEXT WINDOW frame; ≈ 20,000 words; MESSAGE 1 tears off and falls
     ===================================================================================================== */
  var FR = { x0: 150, x1: 870, y0: 600, y1: 1200 };
  var WADD = [], TEAR = 0, LAND = { x: 330, y: 1300, rot: -.07 };
  function windowTimes() {
    var s0 = S('limit').t0;
    WADD = [at('limit', 'hold') - .1, at('limit', 'context') - .1, at('fall', 'past') - .05, at('fall', 'oldest') - .05];
    TEAR = at('fall', 'fall') - .05;
  }
  function wCount(t) { var n = 4; WADD.forEach(function (a) { n += eio(seg(t, a, a + .3)); }); n += eio(seg(t, at('name', 'like') - .05, at('name', 'like') + .25)) + eio(seg(t, at('name', 'name') + .05, at('name', 'name') + .35)); return n; }
  function wOff(n) { return Math.max(0, n - 6) * GAP + clamp(n - 8, 0, 1) * GAP; }
  function wMsg(j) { if (j === 8) return ASK; if (j === 9) return NOPE; return MSG[j]; }
  function fallPos(t) {
    var k = seg(t, TEAR, TEAR + .9), y0 = FR.y0 - 30, x0 = 720;
    return { k: k, x: lerp(x0, LAND.x, eio(k)), y: lerp(y0, LAND.y, k * k) - Math.sin(Math.PI * k) * 30, rot: lerp(0, LAND.rot + 6.283, eio(k)), s: lerp(1, .8, eio(k)) };
  }
  function strip(g, x, y, rot, s, t, torn, erase) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    /* a paper strip under the bubble, torn edge along the bottom once it's off */
    var w = 420, h = 116;
    g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2, h / 2);
    for (var i = 0; i <= 14; i++) g.lineTo(w / 2 - i * w / 14, h / 2 + (torn && i % 2 ? -9 : 0));
    g.closePath(); g.fillStyle = 'rgba(244,237,224,.14)'; g.fill(); g.strokeStyle = 'rgba(244,237,224,.4)'; g.lineWidth = 3; g.stroke();
    var b = bubble(g, MSG[0], -w / 2, w / 2 + 20, 0, 1, 1);
    nameTag(g, b.x - 85, 0, 130, -.14, .08, 1, erase || 0);
    g.restore();
  }
  function windowScene(g, t) {
    var s0 = S('limit').t0, hold = at('limit', 'hold'), ctxw = at('limit', 'context'), fr = at('size', 'free'), n20 = at('size', '20,000'), rep = at('size', 'replies');
    var past = at('fall', 'past'), nm = at('name', 'name');
    var n = wCount(t), off = wOff(n), torn = t >= TEAR;
    var fk = pop(t, hold - .06, 2.8), fs = lerp(1.1, 1, clamp(fk, 0, 1));
    /* while it tumbles it falls behind the window, so it never covers a bubble being read */
    if (torn && fallPos(t).k < 1) { var f0 = fallPos(t); strip(g, f0.x, f0.y, f0.rot, f0.s, t, true, 0); }
    /* the scroll inside */
    g.save(); rr(g, FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0, 18); g.fillStyle = SCREEN; g.fill();
    g.strokeStyle = 'rgba(244,237,224,.25)'; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.rect(FR.x0, FR.y0 + 4, FR.x1 - FR.x0, FR.y1 - FR.y0 - 8); g.clip();
    var last = Math.ceil(n - 1e-6), quiet = 1 - .65 * seg(t, n20 - .1, n20 + .2) * (1 - seg(t, past - .1, past + .2));
    for (var j = 1; j < last; j++) {
      var a = clamp(n - j, 0, 1), y = FR.y0 + 60 + j * GAP - off;
      bubble(g, wMsg(j), FR.x0, FR.x1, y + (1 - a) * 40, a * quiet, lerp(.85, 1, a) * (j % 2 === 1 && t > rep - .05 ? kn(t, rep + (j % 4) * .05) : 1));
    }
    /* the reader bar sweeps a chat that no longer has your name */
    sweepBar(g, FR.x0 + 30, FR.x1 - 30, FR.y0 + 10, FR.y1 - 10, seg(t, nm - .2, nm + .6), 1);
    g.restore();
    /* MESSAGE 1: inside, pushed up past the edge, then torn off and falling */
    if (!torn) strip(g, lerp(640, 720, seg(off, 100, 200)), Math.max(FR.y0 + 60 - off, FR.y0 - 30), 0, 1, t, false);
    else if (fallPos(t).k >= 1) { var f = fallPos(t); strip(g, f.x, f.y, f.rot, f.s * kn(t, nm), t, true, eio(seg(t, wend('name', 'name'), wend('name', 'name') + .4))); }
    /* the frame */
    if (fk > 0) {
      g.save(); g.globalAlpha *= clamp(fk * 3, 0, 1); g.translate(CX, (FR.y0 + FR.y1) / 2); g.scale(fs, fs); g.translate(-CX, -(FR.y0 + FR.y1) / 2);
      g.strokeStyle = HOT; g.lineWidth = 14; rr(g, FR.x0 - 7, FR.y0 - 7, FR.x1 - FR.x0 + 14, FR.y1 - FR.y0 + 14, 22); g.stroke();
      g.restore();
    }
    chip(g, 'CONTEXT WINDOW', 372, FR.y0 - 2, { px: 46, wt: 900, bg: HOT, fg: BG, a: fin(t, ctxw - .1), s: kn(t, ctxw) * lerp(1.06, 1, clamp(pop(t, ctxw - .1, 3), 0, 1)) });
    /* a ruler down the right side */
    var ra = fin(t, n20 - .2) * (1 - seg(t, past, past + .3));
    if (ra > 0) { g.save(); g.globalAlpha *= ra; g.fillStyle = CREAM; for (var i = 0; i <= 24; i++) g.fillRect(888, FR.y0 + i * (FR.y1 - FR.y0) / 24 - 2, i % 4 === 0 ? 34 : 18, 4); g.fillRect(886, FR.y0, 5, FR.y1 - FR.y0); g.restore(); }
    /* the number and its conditions, big */
    var na = fin(t, n20 - .1) * (1 - seg(t, past - .1, past + .2));
    chip(g, 'UNDER 20,000 WORDS', CX, 870, { px: 92, wt: 900, bg: HOT, fg: BG, a: na, s: lerp(1.06, 1, clamp(pop(t, n20 - .1, 3.2), 0, 1)), rot: -.03, maxw: 740 });
    chip(g, '27K TOKENS · REPLIES INCLUDED', CX, 1000, { px: 40, wt: 700, fam: MONO, bg: CREAM, fg: BG, a: fin(t, rep - .1) * (1 - seg(t, past - .1, past + .2)), s: kn(t, rep), maxw: 800 });
    var ca = fin(t, fr - .15) * (1 - seg(t, past - .1, past + .2));
    chip(g, 'FREE PLAN · INSTANT MODEL · OCT 2026', CX, 1288, { px: 46, wt: 900, bg: CREAM, fg: BG, a: ca, s: kn(t, fr), maxw: 780 });
    label(g, 'VARIES BY APP, PLAN AND MODEL', CX, t < past ? 1366 : lerp(1366, 1414, eio(seg(t, past, past + .3))), fin(t, fr + .1), CREAM, 38, 'center', true);
    label(g, 'OPENAI PRICING PAGE, READ OCT 25 2026', CX, 1420, fin(t, fr + .2) * (1 - seg(t, past - .1, past + .1)), CREAM, 30, 'center', true);
    stamp(g, 'PAST THE LIMIT', 480, 1268, t, past - .03, TEAR + .75, 64, HOT, -.04);
    tag(g, 'ILLUSTRATION', 780, 1172, fin(t, s0 + .3) * (t < past ? 0 : 1) + fin(t, past) * 0, .03);
    if (torn) label(g, 'NO LONGER READ', 690, 1300, fin(t, TEAR + .9), CREAM, 36, 'center', true);
  }

  /* =====================================================================================================
     SCENE 5 · patch + detail: a summary sticky note, a saved-memory card; OpenAI: memory doesn't retain every detail
     ===================================================================================================== */
  var NOTE = ['User is planning', 'a trip to Rome.', 'Likes food tours.'];
  function patchScene(g, t) {
    var s0 = S('patch').t0, sum = at('patch', 'summaries'), sav = at('patch', 'saved'), oa = at('detail', 'openai'), ev = at('detail', 'every'), det = at('detail', 'detail');
    /* the old chat, faint behind */
    g.save(); g.globalAlpha *= .35; for (var j = 0; j < 4; j++) bubble(g, MSG[2 + j], 150, 870, 640 + j * GAP + 280, 1, 1); g.restore();
    var nk = pop(t, at('patch', 'patch') - .12, 2.8);
    sheet(g, 330, 830 - (1 - Math.min(1, nk)) * 80, 460, 400, -.05, clamp(nk * 3, 0, 1), function (g, w, h) {
      g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(-w / 2, -h / 2, w, 46);
      font(g, 50, 900); wide(g); g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('SUMMARY', -w / 2 + 34, -h / 2 + 90);
      font(g, 38, 700);
      NOTE.forEach(function (l, i) {
        var y = -h / 2 + 175 + i * 64; g.fillStyle = INK; g.fillText(l, -w / 2 + 34, y);
        /* the lines it drops: struck through on "every detail" */
        if (i > 0) { var sk = eio(seg(t, ev - .05 + (i - 1) * .25, ev + .25 + (i - 1) * .25)); if (sk > 0) { var lw = g.measureText(l).width; g.fillStyle = REDINK; g.fillRect(-w / 2 + 28, y - 3, (lw + 12) * sk, 7); } }
      });
    }, YEL);
    var mk2 = pop(t, sav - .12, 2.8);
    sheet(g, 690, 1080 - (1 - Math.min(1, mk2)) * 80, 420, 250, .05, clamp(mk2 * 3, 0, 1), function (g, w, h) {
      g.fillStyle = HOT; g.fillRect(-w / 2, -h / 2, w, 64);
      font(g, 34, 700, MONO); ls(g, 2); g.fillStyle = BG; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('SAVED MEMORY', -w / 2 + 28, -h / 2 + 34); ls(g, 0);
      font(g, 64, 900); g.fillStyle = INK; g.fillText('Name: Sam', -w / 2 + 28, 40);
    });
    var qa = fin(t, at('detail', 'but') - .15);
    block(g, ['“MEMORY DOES NOT RETAIN', 'EVERY DETAIL…”'], CX, 1318, 48, qa, 'line', CREAM, 900, DISP);
    label(g, '— OPENAI HELP CENTER', CX, 1418, qa, CREAM, 34, 'center', true);
    tag(g, 'ILLUSTRATION', 780, 560, fin(t, s0 + .3), .03);
  }

  /* =====================================================================================================
     SCENE 6 · end: back to the name tag; yes or no → frame 0
     ===================================================================================================== */
  var ENDTAG = { x: CX, y: 880, w: 560 };
  function endScene(g, t) {
    var s0 = S('end').t0, yrs = at('end', 'yours'), yes = at('end', 'yes'), no = at('end', 'no');
    var out = eio(seg(t, HOME - .6, HOME)), oa = 1 - out;
    var tk = pop(t, s0 + .02, 2.6);
    nameTag(g, lerp(ENDTAG.x, BIG.x, out), lerp(ENDTAG.y + (1 - Math.min(1, tk)) * 100, BIG.y, out), lerp(ENDTAG.w, BIG.w, out) * kn(t, yrs), swayAt(t - DUR), lerp(.16 + .02 * Math.sin(t * 2.2), peelAt(0), out), 1, out);
    block(g, ['OpenAI docs & Help Center ·', 'ChatGPT pricing, read Oct 25 2026 ·', 'Anthropic Claude docs'], CX, 560, 36, fin(t, s0 + .3) * oa, true, CREAM, 500);
    var ca = fin(t, at('end', 'so') - .1) * oa;
    if (ca > 0) {
      g.save(); g.globalAlpha *= ca; var bx = CX - 300, by = 1150;
      rr(g, bx + 6, by + 10, 600, 100, 50); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
      rr(g, bx, by, 600, 100, 50); g.fillStyle = BG; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
      font(g, 44, 500, MONO); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('yes or no: __', bx + 80, by + 52);
      if (Math.floor(t * 2) % 2 === 0) { g.fillStyle = HOT; g.fillRect(bx + 48, by + 22, 10, 58); }
      g.restore();
    }
    chip(g, 'YES', 340, 1335, { px: 92, wt: 900, bg: CREAM, fg: BG, a: fin(t, yes - .08) * oa, s: lerp(1.3, 1, clamp(pop(t, yes - .08, 3.2), 0, 1)), rot: -.05 });
    chip(g, 'NO', 690, 1335, { px: 92, wt: 900, bg: HOT, fg: BG, a: fin(t, no - .08) * oa, s: lerp(1.3, 1, clamp(pop(t, no - .08, 3.2), 0, 1)), rot: .05 });
  }

  /* ---------- captions: the narrator's words, one block at a time; only stressed words get the coral pill ---------- */
  var CAPBRK = { told: ['in'], secret: ['it'], reread: ['it'], hundred: ['its'], size: ['its', 'replies'], fall: ['and'], patch: ['with'], detail: ['memory'] };
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;   /* frame 0 carries WHY DOES CHATGPT FORGET? instead: ≤ 5 words on screen */
      var brk = (CAPBRK[l.id] || []).slice(), cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        if (cur.length && brk.length && norm(w.w) === brk[0]) { out.push(cur); cur = []; brk.shift(); }
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { out.push(cur); cur = []; }
      });
      if (cur.length) out.push(cur);
    });
    return out.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS = [['told', 'very'], ['told', 'first'], ['secret', 'secret'], ['secret', 'nothing'], ['reread', 'send'], ['reread', 'whole'],
    ['hundred', '100'], ['hundred', '100', 1], ['hundred', 'times'], ['limit', 'hold'], ['limit', 'context'], ['limit', 'window'],
    ['size', 'free'], ['size', '20,000'], ['size', 'replies'], ['fall', 'past'], ['fall', 'fall'], ['fall', 'off'], ['name', 'name'],
    ['patch', 'summaries'], ['patch', 'saved'], ['patch', 'memories'], ['detail', 'every'], ['detail', 'detail'], ['end', 'yours'], ['end', 'yes'], ['end', 'no']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  /* captions never draw over a cut */
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE - .14, sc.t0 - SWIPE) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1 };
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), out = 1 - seg(t, o0, o1);
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
    var lh = cpx * 1.18, y0 = 380 - (lines.length - 1) * lh / 2;
    g.globalAlpha = fi * out * wipeHide(t) * (alpha == null ? 1 : alpha);
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 40;
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
  var NOISE, SCENES = { tag: tagScene, empty: emptyScene, chat: chatScene, window: windowScene, patch: patchScene, end: endScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) {
    g.save();
    if (Sc.fn !== 'tag' && Sc.fn !== 'end') { var push = 1 + .015 * seg(t, Sc.t0, Sc.t1); g.translate(CX, 1000); g.scale(push, push); g.translate(-CX, -1000); }
    SCENES[Sc.fn](g, t);
    g.restore();
  }
  /* the cut's edge: torn paper, a zigzag with a slow wobble */
  function edgeY(x, ly, t) { var i = Math.round(x / 30); return ly + (i % 2 ? -10 : 8) + Math.sin(x * .013 + t * 5) * 4; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(t, Nx.t0 - SWIPE, Nx.t0)) : 0;
    var pre = Sc.swipe && t < Sc.t0 + PRE;
    drawScene(g, Sc, pre ? Sc.t0 + PRE : t);
    if (sk > 0) {
      var ly = H * (1 - sk) - 20, x;
      g.save(); g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; drawScene(g, Nx, Nx.t0 + PRE); INCOMING = false; g.restore();
      g.save(); g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); for (x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t); if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore();
    }
    /* the loop: the end dissolves back into frame 0 */
    var back = eio(seg(t, HOME, HOME + .35));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); hookIdle(g, t - DUR); g.restore(); }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) {
      if (si === 0) headline(g, t, headA(t));
      if (back > 0) { captions(g, t, 1 - back); headline(g, 0, seg(t, HOME + .1, HOME + .35), true); } else captions(g, t);
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
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText('Why ChatGPT', CX, 300);
    var b = 'forgets your name', wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 14, 400 - 70, wb + 28, 96, 16); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 400); g.restore();
  }
  function TEXTS(t) {
    var out = [];
    function T(id, text, a, b) { if (t >= a && t < b) out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    function cut(id) { return S(id).t0 - .2; }
    T('head', 'WHY DOES CHATGPT FORGET?', 0, at('told', 'you') - .1); T('head', 'WHY DOES CHATGPT FORGET?', HOME + .3, DUR + 1);
    T('m1', 'MESSAGE 1', at('told', 'you') + .15, cut('secret'));
    T('mem', 'MEMORY', at('secret', 'secret'), cut('reread'));
    T('empty', 'EMPTY', at('secret', 'it') - .18, cut('reread'));
    T('state', 'OPENAI: “STATELESS”', S('secret').t0 + .35, cut('reread'));
    T('r100', 'REPLY 100', at('hundred', '100') + .1, cut('limit'));
    T('read', '= MESSAGE 1 READ 100×', at('hundred', 'its') - .16, cut('limit'));
    T('ctx', 'CONTEXT WINDOW', at('limit', 'context') + .1, cut('patch'));
    T('words', 'UNDER 20,000 WORDS', at('size', '20,000') + .1, at('fall', 'past') - .1);
    T('plan', 'FREE PLAN · INSTANT MODEL · OCT 2026', at('size', 'free') + .1, at('fall', 'past') - .1);
    T('vary', 'VARIES BY APP, PLAN AND MODEL', at('size', 'free') + .3, cut('patch'));
    T('past', 'PAST THE LIMIT', at('fall', 'past') + .15, TEAR + .75);
    T('quote', '“MEMORY DOES NOT RETAIN EVERY DETAIL…”', at('detail', 'but') - .05, cut('end'));
    T('box', 'yes or no: __', at('end', 'so') + .08, HOME - .2);
    return out;
  }

  /* ---------- events: the sound design reads the same word times; hits sit between words, never on them ---------- */
  var EV = [], ALLW = [];
  VO.lines.forEach(function (l) { l.words.forEach(function (w) { ALLW.push(w); }); });
  /* a hit that would land inside a spoken word moves to just before that word starts */
  /* a hit's whole body (t … t + body) must sit in a real gap between words: loop until it does. Before the word if the
     gap there holds it, else just after the word ends. */
  var BODY = { stamp: .2, stampS: .14, slap: .16, clack: .16, thump: .2, rip: .2, scratch: .2, paper: .14, peel: .2, swish: .14 };
  function gapT(t, body) {
    for (var guard = 0; guard < 40; guard++) {
      var hit = -1;
      for (var i = 0; i < ALLW.length; i++) { var w = ALLW[i]; if (t < w.t1 + .01 && t + body > w.t0 - .03) { hit = i; break; } }
      if (hit < 0) return t;
      var wd = ALLW[hit], prevEnd = hit > 0 ? ALLW[hit - 1].t1 : -1, before = wd.t0 - .03 - body;
      t = (before >= prevEnd + .01 && before >= 0) ? before : wd.t1 + .02;
    }
    return t;
  }
  function E(o) { o.t = gapT(o.t, BODY[o.type] || (o.t1 ? .08 : .12)); EV.push(o); }
  function initTimes() {
    var i;
    chatTimes(); windowTimes();
    /* hook: a paper peel, the ? stamp on "forget" */
    E({ t: 0, type: 'peel', g: .8 }); E({ t: .02, type: 'stampS', g: .3 }); E({ t: at('hook', 'name') - .04, type: 'peel', g: .7 });
    /* told: the chat rises, the tag sticks on MESSAGE 1 */
    E({ t: at('told', 'you') - .3, type: 'rise', t1: at('told', 'you') + .25 }); E({ t: at('told', 'first') + .05, type: 'slap' }); E({ t: end('told') - .25, type: 'pop', g: .6 });
    /* cuts: a paper tear */
    SC.forEach(function (sc) { if (sc.swipe) E({ t: sc.t0 - SWIPE, type: 'tear', t1: sc.t0 }); });
    /* secret */
    E({ t: at('secret', 'secret') - .12, type: 'paper' }); E({ t: at('secret', 'between') - .1, type: 'pop', g: .5 });
    for (i = 0; i < 5; i++) E({ t: S('secret').t0 + .2 + i * .45, type: 'tick', g: .1 });
    E({ t: at('secret', 'it') - .2, type: 'stampS', g: .5 });
    /* reread: send, sweep, reply */
    SENDS.forEach(function (s) { E({ t: s.send, type: 'key' }); E({ t: s.sw0, type: 'scan', t1: s.sw1 }); E({ t: s.sw1, type: 'pop', g: .5 }); });
    /* hundred: the counter clicks on every step; slap on 100 */
    ROLL.forEach(function (r, k) { E({ t: r.t, type: 'tick', g: k === ROLL.length - 1 ? .3 : .16 }); });
    E({ t: at('hundred', '100') - .05, type: 'slap' }); E({ t: at('hundred', 'times') - .1, type: 'stamp' });
    /* limit: the frame snaps; the number; the conditions */
    E({ t: at('limit', 'hold') - .06, type: 'clack' }); E({ t: at('limit', 'context') - .1, type: 'pop', g: .8 });
    WADD.forEach(function (a) { E({ t: a, type: 'pop', g: .4 }); });
    E({ t: at('size', 'free') - .15, type: 'paper' }); E({ t: at('size', '20,000') - .1, type: 'slap' }); E({ t: at('size', 'replies') - .1, type: 'pop', g: .5 });
    /* fall: the tear, the tumble, the landing */
    E({ t: at('fall', 'past') - .03, type: 'stamp' }); E({ t: TEAR, type: 'rip' }); E({ t: TEAR + .1, type: 'swish' }); E({ t: TEAR + .9, type: 'thump', g: .35 });
    E({ t: at('name', 'name') - .2, type: 'scan', t1: at('name', 'name') + .6 });
    /* patch */
    E({ t: at('patch', 'patch') - .12, type: 'slap' }); E({ t: at('patch', 'saved') - .12, type: 'slap' });
    E({ t: wend('name', 'name') + .2, type: 'scratch' }); E({ t: at('detail', 'openai') - .1, type: 'paper' }); E({ t: at('detail', 'every') - .05, type: 'scratch' }); E({ t: at('detail', 'every') + .2, type: 'scratch' });
    /* end */
    E({ t: S('end').t0 + .02, type: 'peel', g: .6 }); E({ t: at('end', 'yes') - .08, type: 'pop', g: .8 }); E({ t: at('end', 'no') - .08, type: 'pop', g: 1 });
    E({ t: HOME - .55, type: 'rise', t1: HOME + .05 }); E({ t: HOME + .05, type: 'peel', g: .6 });
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
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .26, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t - .12, t + .14, 900, 5200, .12, .02, 1.6); }
    function stampShort(t, g) { var o = osc('sine', 150, t, t + .16, 1, [[t, 0], [t + .004, g || .4], [t + .14, 0]], .05); o.frequency.exponentialRampToValueAtTime(60, t + .12); tickS(t + .005, .14); }
    function stampS(t, big) { thump(t, big ? .6 : .45); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1500; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .42 : .32], [t + .12, 0]]); tickS(t + .005, .18); }
    function paper(t, g) { g = g || 1; band(t - .03, t + .12, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .1, .08 * g); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function rise(t, t1) { band(t, t1, 400, 1800, .03, .06, 3); }
    function clack(t) { thump(t, .5); tickS(t, .4); tickS(t + .045, .25); }
    function slap(t) { thump(t, .45); var n = noise(t, .1), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 900; var o = bus(1, .15); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .3], [t + .08, 0]]); }
    function key(t) { tickS(t, .25); osc('sine', 1900, t, t + .03, 1, [[t, 0], [t + .002, .03], [t + .025, 0]]); }
    /* a paper peel: a short rising rasp */
    function peel(t, g) { g = g || 1; band(t, t + .28, 1200, 3400, .05 * g, .02 * g, 2.2, .2); }
    /* a tear: a gritty band rising with the edge */
    function tearS(t, t1) { band(t, t1 + .03, 700, 2600, .06, .05, 1.8); for (var j = 0; j < 5; j++) tickS(t + (t1 - t) * (j + .5) / 5, .07); }
    function rip(t) { band(t - .02, t + .2, 2500, 900, .14, .04, 1.4); tickS(t, .2); tickS(t + .06, .14); }
    /* the reader bar: a soft scanning tone, a slow sweep down */
    function scan(t, t1) { osc('sine', 880, t, t1 + .05, 1, [[t, 0], [t + .04, .025], [t1 - .03, .02], [t1 + .05, 0]], .2).frequency.exponentialRampToValueAtTime(440, t1); }
    function scratch(t) { band(t, t + .22, 2600, 1800, .08, .03, 2.5, -.2); }
    EV.forEach(function (e) {
      if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'thump') thump(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'stamp') stampS(e.t, e.big);
      else if (e.type === 'stampS') stampShort(e.t, e.g);
      else if (e.type === 'paper') paper(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'rise') rise(e.t, e.t1);
      else if (e.type === 'clack') clack(e.t);
      else if (e.type === 'slap') slap(e.t);
      else if (e.type === 'key') key(e.t);
      else if (e.type === 'peel') peel(e.t, e.g);
      else if (e.type === 'tear') tearS(e.t, e.t1);
      else if (e.type === 'rip') rip(e.t);
      else if (e.type === 'scan') scan(e.t, e.t1);
      else if (e.type === 'scratch') scratch(e.t);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −50 dB, so the loop seam is never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .021; })();
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”·→…#?‹'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initTimes();
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: at('hundred', 'times') + .5, SLUG: 'memory', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
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
