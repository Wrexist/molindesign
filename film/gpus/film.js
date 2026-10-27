/* "GPUs" — why AI made Nvidia so rich. Factory #12 on Tech, explained, after ../password/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the stamp sheet: work is ink going onto paper cells. A laptop CPU is a rubber stamp (one cell a
   press); a gaming card is a carved print block that inks all 64 × 34 = 2,176 cells (1 cell = 10 cores, so 21,760) in
   one press. One hero stamp only: ALL AT ONCE. Everything is hand-built: paper tape, cut-cardboard card, wood block.
   No logos, no product photos. Facts and sources: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0';
  var HOT = '#ff5b3d', GREEN = '#58b56f';
  var PAPER = '#f1e9d8', INK = '#211d26', GREY = '#8f887c';
  var BODY2 = '#3d3849', KRAFT = '#c79f6e', KRAFT_D = '#9c7546', GOLD = '#d9a441', WOOD = '#9a6338', WOOD_D = '#5c3a1f', WOOD_L = '#b67b4a';
  var DISP = 'Archivo', MONO = '"Geist Mono"';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
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
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }
  function kn(t, a) { return 1 + Math.max(0, knock(t, a, 16, 6)) * .08; }
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  /* the renderer samples each frame at (i + .5) / fps: anything that shows a changing count is held to its frame's
     centre, so motion blur never mixes two values */
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
    { id: 'hook', fn: 'tape', name: '$96 billion', t0: 0 },
    { id: 'games', fn: 'story', name: 'Toronto 2012', t0: start('games') + .4, swipe: true },
    { id: 'why', fn: 'sheet', name: 'All at once', t0: at('why', 'training') - .05, swipe: true },
    { id: 'end', fn: 'house', name: 'At home?', t0: start('end') - .05, swipe: true }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });

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
  /* one line of type, shrunk to fit maxw; never under 30 px */
  function txt(g, text, x, y, px, col, align, wt, fam, maxw, a) {
    a = a == null ? 1 : a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 900, fam); ls(g, 0);
    while (maxw && g.measureText(text).width > maxw && px > 30) { px -= 2; font(g, px, wt || 900, fam); }
    g.fillStyle = col || CREAM; g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillText(text, x, y); g.restore();
  }
  function lines2(g, lines, x, y, px, a, col, wt, fam) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 500, fam || MONO); ls(g, 0); g.textAlign = 'center'; g.textBaseline = 'middle';
    var lh = px * 1.3, y0 = y - (lines.length - 1) * lh / 2;
    g.fillStyle = col || CREAM; lines.forEach(function (l, i) { g.fillText(l, x, y0 + i * lh); });
    g.restore();
  }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  /* quiet tags (EXAMPLE, RE-CREATED, OUR MATH): cream outline, never coral; coral is kept for the one hero stamp */
  function tag(g, text, x, y, a, rot, px) { chip(g, text, x, y, { px: px || 32, wt: 700, fam: MONO, line: CREAM, lw: 3, fg: CREAM, a: a, rot: rot == null ? .03 : rot, shadow: false, bg: 'rgba(21,19,27,.9)' }); }
  /* credits and sources never show in the incoming scene under the tear: they appear once it has covered the old one */
  function cred(a) { return INCOMING ? 0 : a; }

  /* ---------- the one rubber stamp: worn ink (seeded speckle), slammed ---------- */
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
  function stamp(g, text, x, y, t, t0, t1, px, col, rot) {
    if (t < t0 || t > t1 + .25) return;
    var c = stampTex(text, col, px);
    var k = sp(t, t0, 3.2, .8), s = lerp(1.35, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (1 - seg(t, t1, t1 + .25));
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.08 : rot); g.scale(s, s);
    if (k >= 1) recBox(g, -c.w / 2 - 14, -c.h / 2 - 4, c.w / 2 - 6, c.h / 2 + 4, text);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-c.w / 2 - 4, -c.h / 2 + 10, c.w + 8, c.h);
    g.fillStyle = PAPER; g.fillRect(-c.w / 2 - 14, -c.h / 2 - 4, c.w + 8, c.h + 8);
    g.drawImage(c, -c.w / 2 - 10, -c.h / 2); g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · hook + ask + dc: an adding-machine tape hangs from a paper printer: $96 / BILLION in coral, 3 MONTHS in
     pencil (4 words on frame 0). The tape feeds and the pencil underline draws by 0.3 s. The condition comes in under
     the tape at 1.4 s. On "So why" the tape settles lower for the headline; on dc it tears across at 92.5 % of its
     length (to scale) and the stub drops: DATA CENTERS $89.0B printed on the long piece, EVERYTHING ELSE $7.2B by the stub.
     ===================================================================================================== */
  var TP = { x: CX - 330, w: 660, slot: 330, bot: 1380 };           /* group coordinates (frame 0 is 1:1) */
  var TEAR = TP.slot + (TP.bot - TP.slot) * (89.0 / 96.2);          /* the tear sits at 92.5 % of the tape: to scale */
  function tapeGroup(t, idle) { return idle ? 0 : eio(seg(t, 1.0, 1.5)); }
  function tapeParts(g, t, idle) {
    var gk = tapeGroup(t, idle), sc = lerp(1, .7, gk), ay = 234;
    var rich = at('ask', 'rich') - .1, feed = idle ? 0 : 120 * eio(seg(t, 0, 1)) + 40 * eio(seg(t, rich, rich + .4)), sway = idle ? 0 : Math.sin(t * 1.3) * .004 * (1 - gk * .5) * seg(t, .05, .4);
    var torn = !idle && t >= GT.tear, tk = torn ? seg(t, GT.tear, GT.tear + .5) : 0;
    g.save(); g.translate(CX, lerp(ay, 500, gk)); g.scale(sc, sc); g.translate(-CX, -ay);
    /* the printer: a dark paper box with a slot, no words */
    g.save(); g.translate(CX, TP.slot); g.rotate(sway * 3); g.translate(-CX, -TP.slot);
    var px0 = TP.x, py0 = TP.slot;
    /* the tape (long piece) */
    var top = py0, cut = torn ? TEAR : TP.bot;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px0 + 12, top + 14, TP.w, cut - top);
    g.fillStyle = PAPER; g.beginPath(); g.moveTo(px0, top); g.lineTo(px0 + TP.w, top);
    if (torn) { for (var x = TP.w; x >= 0; x -= 22) g.lineTo(px0 + x, TEAR + ((x / 22) % 2 ? 5 : -4)); }
    else { g.lineTo(px0 + TP.w, cut); g.lineTo(px0, cut); }
    g.closePath(); g.fill();
    /* faint rules on the paper, moving with the feed */
    g.save(); g.beginPath(); g.rect(px0, top, TP.w, cut - top + 6); g.clip();
    g.fillStyle = 'rgba(33,29,38,.07)'; for (var ry = top + 40 + feed % 60; ry < cut; ry += 60) g.fillRect(px0 + 24, ry, TP.w - 48, 2);
    g.fillStyle = 'rgba(33,29,38,.05)'; g.fillRect(px0, top, 14, cut - top); g.fillRect(px0 + TP.w - 14, top, 14, cut - top);
    /* the total: coral $96, ink BILLION, a ruled line, 3 MONTHS in pencil */
    var fy = feed;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    /* frame 0 shows $9 and 3 MONTHS (3 words); the printer strikes the 6 at frame 4 and BILLION at frame 8 */
    var q0 = idle ? 0 : qt(t), d6 = q0 >= .13, dB = q0 >= .26;
    font(g, 300, 900); g.fillStyle = HOT; g.textAlign = 'left';
    var w96 = g.measureText('$96').width, w9 = g.measureText('$9').width, x96 = CX - w96 / 2;
    g.fillText('$9', x96, 440 + fy); if (d6) g.fillText('6', x96 + w9, 440 + fy);
    g.textAlign = 'center';
    if (dB) { font(g, 124, 900); wide(g); g.fillStyle = INK; g.fillText('BILLION', CX, 650 + fy); }
    g.fillStyle = INK; g.fillRect(px0 + 50, 732 + fy, TP.w - 100, 6);
    font(g, 98, 700); g.fillStyle = '#3a3542'; g.save(); g.translate(CX, 820 + fy); g.rotate(-.025); g.fillText('3 MONTHS', 0, 0); g.restore();
    var ul = idle ? 0 : eio(seg(t, .4, .8));
    if (ul > 0) { g.strokeStyle = '#3a3542'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(CX - 220, 884 + fy); g.quadraticCurveTo(CX, 870 + fy, CX - 220 + 450 * ul, 878 + fy - 6 * ul); g.stroke(); }
    /* on "so rich" the tape feeds on and its perforation shows: where it will tear (92.5 %, to scale) */
    var pf = idle || torn ? 0 : seg(t, rich, rich + .3);
    if (pf > 0) { g.save(); g.globalAlpha *= pf; g.strokeStyle = INK; g.lineWidth = 5; g.setLineDash([16, 12]); g.beginPath(); g.moveTo(px0 + 10, TEAR); g.lineTo(px0 + TP.w - 10, TEAR); g.stroke(); g.restore(); }
    /* printed on "data centers": the long piece is data centers */
    if (!idle) {
      var dk = seg(t, GT.dcl, GT.dcl + .08);
      if (dk > 0) { g.globalAlpha = dk; font(g, 64, 900); g.fillStyle = INK; g.fillText('DATA CENTERS', CX, 990 + fy); font(g, 80, 900); g.fillText('$89.0B', CX, 1076 + fy); g.globalAlpha = 1; }
    }
    g.restore();
    /* the printer body over the tape's top edge */
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, CX - 380 + 10, py0 - 96 + 14, 760, 112, 26); g.fill();
    g.fillStyle = BODY2; rr(g, CX - 380, py0 - 96, 760, 112, 26); g.fill();
    g.fillStyle = '#2a2633'; rr(g, CX - 345, py0 - 8, 690, 16, 8); g.fill();
    g.fillStyle = 'rgba(244,237,224,.12)'; rr(g, CX - 350, py0 - 82, 700, 10, 5); g.fill();
    /* the print head ticking along its rail while the tape feeds */
    var hx = CX - 300 + ((idle ? 0 : Math.max(0, t - .05)) * 260 % 600);
    g.fillStyle = '#5a5366'; rr(g, hx, py0 - 60, 54, 34, 8); g.fill();
    g.restore();
    /* the stub: drops away from the tear */
    if (torn || !torn) {
      var sy = torn ? eio(tk) * 16 : 0, srot = torn ? eio(tk) * .05 : 0, s0 = torn ? TEAR : TP.bot;
      if (torn) {
        g.save(); g.translate(px0 + TP.w / 2, TEAR + sy); g.rotate(srot); g.translate(-(px0 + TP.w / 2), -TEAR);
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px0 + 12, TEAR + 14, TP.w, TP.bot - TEAR);
        g.fillStyle = PAPER; g.beginPath(); g.moveTo(px0, TP.bot); g.lineTo(px0 + TP.w, TP.bot);
        for (var x2 = TP.w; x2 >= 0; x2 -= 22) g.lineTo(px0 + x2, TEAR + ((x2 / 22) % 2 ? 5 : -4));
        g.closePath(); g.fill();
        g.restore();
      }
      /* the curl at the bottom of the tape (on the stub once torn) */
      g.save(); g.translate(0, sy); g.fillStyle = '#d8cfbd'; el(g, CX, TP.bot + 4, TP.w / 2, 26); g.fillStyle = PAPER; el(g, CX, TP.bot - 6, TP.w / 2 - 6, 18); g.restore();
    }
    g.restore();
  }
  function tapeScene(g, t) {
    tapeParts(g, t, false);
    /* the condition, under the tape, never on it */
    var ca = fin(t, 1.2) * (1 - seg(t, GT.tear - .2, GT.tear));
    chip(g, 'NVIDIA SALES (REVENUE)', CX, 1362, { px: 46, wt: 900, bg: CREAM, fg: BG, a: ca, maxw: 800 });
    txt(g, 'QUARTER ENDED JULY 26, 2026', CX, 1426, 38, CREAM, 'center', 600, MONO, 800, ca);
    /* dc: the stub's label and the source */
    var da = fin(t, GT.tear + .05);
    chip(g, 'THE REST: $7.2B', CX, 1362, { px: 44, wt: 900, bg: CREAM, fg: BG, a: da, maxw: 800 });
    txt(g, 'NVIDIA, AUG 26, 2026', CX, 1426, 36, CREAM, 'center', 600, MONO, 800, da);
  }
  function tapeIdle(g) { tapeParts(g, 0, true); }

  var HEADT = 1.75;
  function headline(g, t) {
    var a = fin(t, HEADT) * (1 - seg(t, start('dc') - .2, start('dc') - .04));
    if (a <= 0) return;
    var k = clamp(spring(t - HEADT, 3.2, .85), 0, 1.04);
    g.save(); g.globalAlpha *= a;
    var L = ['WHY IS NVIDIA', 'SO RICH?'], px = 92; font(g, px, 900); wide(g);
    while (g.measureText(L[0]).width > 800 && px > 52) { px -= 2; font(g, px, 900); wide(g); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    L.forEach(function (l, i) { g.fillStyle = CREAM; g.fillText(l, CX, 352 + i * px * 1.04 + (1 - Math.min(1, k)) * 30); });
    g.restore();
  }

  /* =====================================================================================================
     SCENE 2 · games + toronto + won: a cut-cardboard gaming card (kraft board, hand-cut gold-finger tabs, two cut-paper
     fans, a FOR GAMES sticker; no logo) with a paper pie of fiscal 2016 sales; it becomes two cards for Toronto 2012;
     then a re-created score card slides up: wrong guesses 26.2 % vs 15.3 %.
     ===================================================================================================== */
  var CJ = (function () { var r = mulberry(41), o = []; for (var i = 0; i < 40; i++) o.push((r() - .5) * 5); return o; })();
  function card(g, x, y, s, t, seed, a) {
    if (a <= 0 || s <= 0) return;
    var w = 700, h = 300;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.rotate((seed % 2 ? .012 : -.01));
    /* hand-cut outline: small seeded wobbles on every edge */
    function outline(dx, dy) {
      g.beginPath(); var i, n = 10;
      for (i = 0; i <= n; i++) g.lineTo(-w / 2 + w * i / n + dx, -h / 2 + CJ[(i + seed * 7) % 40] + dy);
      for (i = 0; i <= 4; i++) g.lineTo(w / 2 + CJ[(i + 11 + seed * 3) % 40] + dx, -h / 2 + h * i / 4 + dy);
      for (i = n; i >= 0; i--) g.lineTo(-w / 2 + w * i / n + dx, h / 2 - 34 + CJ[(i + 21 + seed) % 40] + dy);
      for (i = 4; i >= 0; i--) g.lineTo(-w / 2 + CJ[(i + 31) % 40] + dx, -h / 2 + h * i / 4 + dy);
      g.closePath();
    }
    g.fillStyle = 'rgba(0,0,0,.38)'; outline(12, 16); g.fill();
    g.fillStyle = KRAFT; outline(0, 0); g.fill();
    /* corrugation lines */
    g.strokeStyle = 'rgba(92,58,31,.18)'; g.lineWidth = 3;
    for (var i = 0; i < 14; i++) { g.beginPath(); g.moveTo(-w / 2 + 30 + i * 48, -h / 2 + 10); g.lineTo(-w / 2 + 30 + i * 48, h / 2 - 46); g.stroke(); }
    /* the gold-finger tabs: paper tabs along the bottom edge, with the key notch */
    g.fillStyle = GOLD;
    for (i = 0; i < 22; i++) { if (i === 6) continue; rr(g, -w / 2 + 120 + i * 20, h / 2 - 36, 14, 34, 3); g.fill(); }
    /* the bracket on the left: a strip of grey card */
    g.fillStyle = '#a49c90'; rr(g, -w / 2 - 26, -h / 2 - 10, 34, h - 30, 6); g.fill();
    /* two cut-paper fans, turning */
    [-150, 150].forEach(function (fx, j) {
      var fr = 104;
      g.fillStyle = KRAFT_D; el(g, fx, -16, fr + 10, fr + 10);
      g.fillStyle = '#2a2420'; el(g, fx, -16, fr, fr);
      g.save(); g.translate(fx, -16); g.rotate(t * (2.2 + j * .3) + seed); g.fillStyle = '#d9c3a0';
      for (var b = 0; b < 7; b++) { g.rotate(Math.PI * 2 / 7); g.beginPath(); g.ellipse(fr * .5, 0, fr * .46, fr * .16, .55, 0, 6.283); g.fill(); }
      g.fillStyle = KRAFT_D; el(g, 0, 0, fr * .24, fr * .24); g.restore();
    });
    /* the hand-lettered sticker */
    g.save(); g.translate(30, 92); g.rotate(-.07);
    rr(g, -150, -38, 300, 76, 14); g.fillStyle = CREAM; g.fill();
    font(g, 50, 900); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOR GAMES', 0, 3);
    g.restore();
    g.restore();
  }
  function pie(g, x, y, r, a, k) {
    if (a <= 0 || r < 12) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 8, 12, r, r);
    g.fillStyle = PAPER; el(g, 0, 0, r, r);
    var a0 = -Math.PI / 2, gm = 2818 / 5010, dc = 339 / 5010;
    g.fillStyle = GOLD; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r - 8, a0, a0 + Math.PI * 2 * gm * k); g.closePath(); g.fill();
    g.fillStyle = INK; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r - 8, a0 + Math.PI * 2 * gm, a0 + Math.PI * 2 * (gm + dc * k)); g.closePath(); if (k > .02) g.fill();
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r - 8, 0, 6.283); g.stroke();
    g.restore();
  }
  function storyTimes() { return { s0: S('games').t0, tr: at('toronto', 'a') - .2, wn: start('won') + .2, two: at('toronto', 'two') }; }
  function storyScene(g, t) {
    var ST = storyTimes(), s0 = ST.s0, tr = ST.tr, wn = ST.wn;
    /* the first card slides in with the cut; on "two" it shrinks left and splits into two */
    var inK = clamp(sp(t, s0 - .5, 2.2, .8), 0, 1.02), tk = eio(seg(t, ST.two - .55, ST.two)), t2 = eio(seg(t, ST.two - .3, ST.two + .25));
    var wk = eio(seg(t, wn, wn + .5));
    var cy = lerp(700, 600, wk), cs = lerp(1, .54, tk) * lerp(1, .9, wk);
    var c1x = lerp(lerp(CX + 700, CX, inK), 305, tk), c2x = lerp(c1x, 715, t2);
    if (t2 > 0) card(g, c2x, cy, cs, t, 2, 1);
    card(g, c1x, cy, cs, t, 1, 1);
    /* the paper pie: fiscal 2016 sales; it slides down and out on "a Toronto team" */
    var pk = eio(seg(t, s0 - .1, s0 + .6)), pout = eio(seg(t, tr, tr + .4));
    var py = 1130;
    if (pout < 1) {
      pie(g, 270, py, 160 * (1 - pout), 1, pk);
      var la = fin(t, s0 - .05) * (1 - seg(pout, 0, .25));
      txt(g, '10 YEARS AGO (FISCAL 2016)', CX, py - 205, 48, CREAM, 'center', 900, DISP, 800, fin(t, s0 - .05) * (1 - seg(t, tr + .2, tr + .35)));
      g.fillStyle = GOLD; if (la > 0) { g.globalAlpha = la; rr(g, 470, py - 48, 34, 34, 6); g.fill(); g.fillStyle = INK; rr(g, 470, py + 32, 34, 34, 6); g.fill(); g.strokeStyle = CREAM; g.lineWidth = 2; g.stroke(); g.globalAlpha = 1; }
      txt(g, 'GAMING 56%', 522, py - 30, 54, CREAM, 'left', 900, DISP, 400, la);
      txt(g, 'DATA CENTER 7%', 522, py + 50, 44, CREAM, 'left', 900, DISP, 400, la);
      var sa = cred(fin(t, s0 + .1)) * (1 - seg(pout, 0, .25));
      txt(g, 'NVIDIA 10-K', 400, 1404, 36, CREAM, 'center', 600, MONO, 500, sa);
      tag(g, 'OUR MATH', 680, 1404, sa, -.02, 32);
    }
    /* Toronto: the two cards' labels (the score card covers them), the place and year, the paper's own words */
    var ta = fin(t, ST.two - .2);
    [305, 715].forEach(function (x) {
      txt(g, 'GTX 580', x, 886, 48, CREAM, 'center', 900, DISP, 380, ta);
      txt(g, '$499 IN 2010', x, 942, 38, CREAM, 'center', 600, MONO, 390, ta);
    });
    var tto = at('toronto', 'toronto') - .08, cov = 1 - seg(wk, .55, .8);
    chip(g, 'TORONTO · 2012', CX, 1060, { px: 64, wt: 900, bg: CREAM, fg: BG, a: fin(t, tto) * cov, s: kn(t, tto), maxw: 800 });
    var qa = fin(t, tto - .05) * (1 - seg(wk, .3, .55));
    txt(g, '“two GTX 580 3GB GPUs”', CX, 1190, 50, CREAM, 'center', 600, MONO, 800, qa);
    txt(g, 'KRIZHEVSKY ET AL., 2012', CX, 1250, 36, CREAM, 'center', 600, MONO, 800, qa);
    /* won: the re-created score card slides up over the bench */
    if (wk > 0) scoreCard(g, t, wn, wk);
    txt(g, 'THEIR TWO GAMING CARDS', CX, 780, 40, CREAM, 'center', 900, DISP, 800, fin(t, wn + .45));
  }
  function scoreCard(g, t, wn, wk) {
    var x0 = 110, w = 800, y0 = lerp(1500, 840, wk), h = 560;
    g.save();
    g.fillStyle = 'rgba(0,0,0,.36)'; g.fillRect(x0 + 12, y0 + 16, w, h);
    g.fillStyle = PAPER; g.fillRect(x0, y0, w, h);
    g.fillStyle = INK; g.fillRect(x0, y0, w, 10);
    var ka = seg(wk, .93, 1);
    txt(g, 'ILSVRC 2012 IMAGE CONTEST', x0 + 40, y0 + 70, 50, INK, 'left', 900, DISP, w - 80, ka);
    txt(g, 'WRONG GUESSES (TOP-5)', x0 + 40, y0 + 128, 38, INK, 'left', 700, MONO, 700, ka);
    txt(g, 'LOWER IS BETTER', x0 + w - 40, y0 + 204, 36, INK, 'right', 900, DISP, 320, ka);
    g.fillStyle = 'rgba(33,29,38,.15)'; g.fillRect(x0 + 40, y0 + 160, w - 80, 3);
    /* pencil bars: 2nd place draws first, then theirs stops well short of it */
    var bx = x0 + 40, bw = 560, b2 = GT.bar2, b1 = GT.bar1;
    var k2 = eio(seg(t, b2, b2 + .55)), k1 = eio(seg(t, b1, b1 + .45));
    function bar(y, frac, k, label, val, col) {
      txt(g, label, bx, y - 46, 38, INK, 'left', 900, DISP, 560, ka);
      var L = bw * frac * k;
      if (L > 0) {
        g.fillStyle = col; g.fillRect(bx, y - 22, L, 50);
        g.save(); g.beginPath(); g.rect(bx, y - 22, L, 50); g.clip(); g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 3;
        for (var i = -60; i < L + 60; i += 16) { g.beginPath(); g.moveTo(bx + i, y + 28); g.lineTo(bx + i + 40, y - 22); g.stroke(); }
        g.restore();
      }
      if (k >= 1) txt(g, val, bx + L + 18, y + 4, 52, INK, 'left', 900, DISP, 220);
    }
    bar(y0 + 250, 26.2 / 26.2, k2, '2ND PLACE', '26.2%', '#b9b0a0');
    bar(y0 + 390, 15.3 / 26.2, k1, 'THEIRS (TWO GAMING CARDS)', '15.3%', GOLD);
    /* the gap, in pencil: a bracket from their bar's end to 2nd place */
    var gk = eio(seg(t, b1 + .45, b1 + .8));
    if (gk > 0) {
      var xa = bx + bw * 15.3 / 26.2, xb = bx + bw, yb = y0 + 470;
      g.strokeStyle = INK; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(xa, yb - 16); g.lineTo(xa, yb); g.lineTo(lerp(xa, xb, gk), yb); if (gk >= 1) g.lineTo(xb, yb - 16); g.stroke();
    }
    txt(g, 'NEURIPS 2012 · RE-CREATED', x0 + 40, y0 + h - 40, 34, INK, 'left', 600, MONO, w - 80, ka);
    g.restore();
  }

  /* =====================================================================================================
     SCENE 3 · why … pixels: the stamp sheet. 64 × 34 = 2,176 cells, each a hand-drawn ×+. One cell is lifted out big
     (× +, then 3 × 4 = 12 and 12 + 5 = 17); on "billions" it flies back. The screenshot frame: LAPTOP CPU 10 BIG CORES vs
     GAMING CARD 21,760 TINY CORES. A rubber stamp inks one cell a press; the carved print block comes in face up, turns
     over, hovers, and in the pause after "once" slams: every cell inks on one frame. ALL AT ONCE. Then the same cells
     re-ink as a game frame (GAME PIXELS) and back (TRAINING AI).
     ===================================================================================================== */
  var NC = 64, NR = 34, CS = 11, GX = CX - NC * CS / 2, GY = 840, GWD = NC * CS, GHT = NR * CS;   /* grid 704 × 374 */
  var SH = { x: GX - 28, y: GY - 28, w: GWD + 56, h: GHT + 56 };
  var TEX = null;
  function cellJit() { var r = mulberry(77), o = []; for (var i = 0; i < NC * NR; i++) o.push(r()); return o; }
  var JIT = cellJit();
  /* the game frame the block re-inks: sky, sun, hills, ground, a little runner (64 × 34, seeded) */
  function pixCol(c, r) {
    var hill = 21 + Math.round(3 * Math.sin(c * .19 + 1) + 2 * Math.sin(c * .41)), far = 17 + Math.round(3 * Math.sin(c * .11 + 3));
    var dx = c - 49, dy = r - 8;
    var run = [[0, 0, 1, 1, 0], [0, 0, 1, 1, 0], [0, 1, 1, 1, 1], [1, 0, 1, 1, 0], [0, 0, 1, 0, 1], [0, 1, 0, 0, 1]];
    var rx = c - 13, ryy = r - (hill - 6);
    if (rx >= 0 && rx < 5 && ryy >= 0 && ryy < 6 && run[ryy][rx]) return CREAM;
    if (dx * dx + dy * dy <= 13) return HOT;
    if ((r === 5 || r === 6) && ((c >= 8 && c <= 15) || (c >= 28 && c <= 33))) return '#dfe6ee';
    if (r >= 29) return (c + r) % 4 === 0 ? '#7a5532' : KRAFT_D;
    if (r >= hill) return r === hill ? '#7fd08f' : GREEN;
    if (r >= far) return '#3c6b8e';
    return r < 10 ? '#24315a' : '#2e4277';
  }
  function makeTex() {
    if (TEX) return TEX;
    function sheetBase(g) {
      g.fillStyle = PAPER; g.fillRect(0, 0, SH.w, SH.h);
      g.strokeStyle = 'rgba(33,29,38,.18)'; g.lineWidth = 1;
      for (var c = 0; c <= NC; c++) { g.beginPath(); g.moveTo(28 + c * CS + .5, 28); g.lineTo(28 + c * CS + .5, 28 + GHT); g.stroke(); }
      for (var r = 0; r <= NR; r++) { g.beginPath(); g.moveTo(28, 28 + r * CS + .5); g.lineTo(28 + GWD, 28 + r * CS + .5); g.stroke(); }
    }
    function marks(g, col) {
      g.strokeStyle = col; g.lineWidth = 1.3;
      for (var r = 0; r < NR; r++) for (var c = 0; c < NC; c++) {
        var x = 28 + c * CS, y = 28 + r * CS, j = JIT[r * NC + c] * 1.2;
        g.beginPath(); g.moveTo(x + 2.5, y + 3 + j * .5); g.lineTo(x + 5.5, y + 6 + j * .5); g.moveTo(x + 5.5, y + 3); g.lineTo(x + 2.5, y + 6);
        g.moveTo(x + 6.5, y + 6.5); g.lineTo(x + 9.5, y + 6.5); g.moveTo(x + 8, y + 5); g.lineTo(x + 8, y + 8); g.stroke();
      }
    }
    var blank = mk(SH.w, SH.h), b = blank.getContext('2d'); sheetBase(b); marks(b, 'rgba(33,29,38,.55)');
    var inked = mk(SH.w, SH.h), i2 = inked.getContext('2d'); sheetBase(i2);
    for (var r = 0; r < NR; r++) for (var c = 0; c < NC; c++) { var j = JIT[r * NC + c]; i2.fillStyle = 'rgba(33,29,38,' + (.82 + j * .18).toFixed(3) + ')'; i2.fillRect(28 + c * CS + .8, 28 + r * CS + .8, CS - 1.6, CS - 1.6); }
    marks(i2, 'rgba(241,233,216,.2)');
    var pix = mk(SH.w, SH.h), p = pix.getContext('2d'); sheetBase(p);
    for (r = 0; r < NR; r++) for (c = 0; c < NC; c++) { p.fillStyle = pixCol(c, r); p.fillRect(28 + c * CS + .8, 28 + r * CS + .8, CS - 1.6, CS - 1.6); p.fillStyle = 'rgba(0,0,0,' + (JIT[r * NC + c] * .12).toFixed(3) + ')'; p.fillRect(28 + c * CS + .8, 28 + r * CS + .8, CS - 1.6, CS - 1.6); }
    /* the block's carved face: raised cells with ink on them, knife-cut grooves between */
    var face = mk(SH.w, SH.h), f = face.getContext('2d');
    f.fillStyle = WOOD_D; f.fillRect(0, 0, SH.w, SH.h);
    f.fillStyle = WOOD; f.fillRect(10, 10, SH.w - 20, SH.h - 20);
    for (r = 0; r < NR; r++) for (c = 0; c < NC; c++) { var jj = JIT[r * NC + c]; f.fillStyle = 'rgba(33,29,38,' + (.7 + jj * .3).toFixed(3) + ')'; f.fillRect(28 + c * CS + 1.5, 28 + r * CS + 1.5, CS - 3, CS - 3); }
    var back = mk(SH.w, SH.h), k = back.getContext('2d'), rg = mulberry(9);
    k.fillStyle = WOOD; k.fillRect(0, 0, SH.w, SH.h);
    k.strokeStyle = 'rgba(92,58,31,.45)'; k.lineWidth = 3;
    for (var n = 0; n < 26; n++) { var yy = 10 + n * 17 + rg() * 6, ph = rg() * 6; k.beginPath(); for (var xx = 0; xx <= SH.w; xx += 20) k.lineTo(xx, yy + Math.sin(xx * .012 + ph) * 7); k.stroke(); }
    k.fillStyle = 'rgba(92,58,31,.55)'; k.beginPath(); k.ellipse(SH.w * .68, SH.h * .42, 46, 20, .1, 0, 6.283); k.fill();
    k.fillStyle = WOOD_L; k.beginPath(); k.ellipse(SH.w * .68, SH.h * .42, 30, 11, .1, 0, 6.283); k.fill();
    k.strokeStyle = 'rgba(255,240,220,.18)'; k.lineWidth = 6; k.strokeRect(6, 6, SH.w - 12, SH.h - 12);
    TEX = { blank: blank, inked: inked, pix: pix, face: face, back: back };
    return TEX;
  }
  function cellXY(i) { var c = i % NC, r = Math.floor(i / NC); return [GX + c * CS, GY + r * CS]; }
  var BIGC = 31 + 16 * NC;   /* the cell lifted out on "why" */
  /* the laptop's rubber stamp presses: one cell each */
  function presses() { return PRESS; }
  /* the game-pixel re-ink lands at the end of "pixels" (after the inked sheet has held still for 1.2 s+), back on "Now" */
  function PGt() { return wend('pixels', 'pixels'); }
  function PNt() { return at('pixels', 'now') - .08; }
  function laptopN(t) { var n = 0; PRESS.forEach(function (p) { if (t >= p + .06) n++; }); return n; }
  function sheetDraw(g, t) {
    var T = makeTex(), slam = GT.slam, q = qt(t);
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(SH.x + 12, SH.y + 16, SH.w, SH.h);
    var pg = PGt(), pn = PNt();
    var mode = q >= slam ? 'inked' : 'blank';
    g.drawImage(mode === 'inked' ? T.inked : T.blank, SH.x, SH.y);
    /* re-ink as a game frame, then back to multiply-add marks: every cell flips on one frame, all at once */
    if (q >= pg && q < pn) g.drawImage(T.pix, SH.x, SH.y);
    /* the laptop's cells: coral with a cream mark and a 3 px coral box, before the slam and through the inked hold,
       so 5 cells against 2,176 reads in one look; the box pulses once as the block lifts */
    if (q < pg) {
      var n = q < slam ? laptopN(q) : PRESS.length;
      for (var i = 0; i < n; i++) { var p = cellXY(i); g.fillStyle = HOT; g.fillRect(p[0], p[1], CS, CS); g.fillStyle = CREAM; g.fillRect(p[0] + 3.5, p[1] + 3.5, CS - 7, CS - 7); }
      if (n > 0) {
        var ps, bw = n * CS + 10, bh = CS + 10, bx = GX - 5 + bw / 2, by = GY - 5 + bh / 2;
        ps = q < slam ? 1 : lerp(1.3, 1, eio(seg(q, slam + .14, slam + .54)));
        g.strokeStyle = HOT; g.lineWidth = 3; g.strokeRect(bx - bw * ps / 2, by - bh * ps / 2, bw * ps, bh * ps);
      }
    }
  }
  /* the rubber stamp: wooden handle, rubber foot; hovers over the next cell and presses */
  function rubberStamp(g, t, a) {
    if (a <= 0) return;
    var n = laptopN(t), cell = Math.min(n, PRESS.length - 1), p = cellXY(cell), down = 0;
    PRESS.forEach(function (pt) { var u = t - (pt - .1); if (u > 0 && u < .34) down = Math.max(down, u < .1 ? eio(u / .1) : 1 - eio((u - .1) / .24)); });
    /* glide to the next cell between presses */
    var prev = cellXY(Math.max(0, n - 1)), last = n > 0 ? PRESS[n - 1] : 0, gl = n > 0 && n < PRESS.length ? eio(seg(t, last + .1, last + .45)) : 1;
    var x = lerp(prev[0], p[0], gl) + CS / 2, y = lerp(prev[1], p[1], gl);
    var lift = lerp(40, 3, down);
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y + CS - lift * 1.15); g.scale(1.15, 1.15); g.rotate(-.12 * (1 - down));
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, 6, lift + 4, 26 * (1 - down * .4), 8);
    g.fillStyle = '#2a2420'; rr(g, -26, -16, 52, 16, 3); g.fill();                  /* rubber */
    g.fillStyle = WOOD_L; rr(g, -32, -40, 64, 26, 6); g.fill();                     /* base */
    g.fillStyle = WOOD; rr(g, -10, -96, 20, 58, 6); g.fill();                       /* neck */
    g.fillStyle = WOOD_D; el(g, 0, -104, 24, 20);                                   /* knob */
    g.restore();
  }
  /* the print block, hinged at the sheet's top edge like a hand press: it comes down from above standing open (its
     carved face reads, the same 64 × 34 grid), waits, and in the pause after "once" swings shut onto the sheet, holds,
     and swings open again: every cell inked on the same frame. c = projected height: −.32 open (face up), 1 shut (back). */
  function blockC(t) {
    var slam = GT.slam;
    if (t < slam - .12) return -.32 + Math.sin(t * 2.4) * .015;
    if (t < slam) { var k = seg(t, slam - .12, slam); return lerp(-.32, 1, k * k); }
    if (t < slam + .12) return 1;
    return lerp(1, -.32, eout(seg(t, slam + .12, slam + .42)));
  }
  function printBlock(g, t) {
    var b0 = GT.bin, pg = PGt();
    if (t < b0) return;
    var T = makeTex(), c = blockC(t);
    var off = lerp(-760, 0, eout(seg(t, b0, b0 + .55))) + lerp(0, -900, eio(seg(t, pg - .1, pg + .3)));
    if (off <= -900) return;
    var hy = SH.y + off;
    g.save(); g.beginPath(); g.rect(0, 240, W, H - 240); g.clip();   /* never across the progress bar */
    if (c < 0) {
      var hh = -c * SH.h;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(SH.x + 10, hy - hh + 12, SH.w, hh);
      g.save(); g.translate(SH.x, hy); g.scale(1, -c); g.drawImage(T.face, 0, -SH.h); g.restore();
      g.fillStyle = WOOD_D; g.fillRect(SH.x, hy - 10, SH.w, 14);   /* the hinge edge */
    } else {
      var h2 = c * SH.h;
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(SH.x + 14, hy + 16, SH.w, h2);
      g.save(); g.translate(SH.x, hy); g.scale(1, Math.max(.001, c)); g.drawImage(T.back, 0, 0); g.restore();
      g.fillStyle = WOOD_D; g.fillRect(SH.x, hy + h2 - 4, SH.w, 16 * c);
    }
    g.fillStyle = '#4a4458'; g.fillRect(SH.x + 60, hy - 8, 40, 16); g.fillRect(SH.x + SH.w - 100, hy - 8, 40, 16);   /* two hinges */
    g.restore();
  }
  function sheetScene(g, t) {
    var s0 = S('why').t0, slam = GT.slam, bl = at('move', 'billions') - .1;
    sheetDraw(g, t);
    /* the lifted cell: grows out of its spot, shows the move, then flies back on "billions" */
    var ck = eout(seg(t, s0 - .35, s0 + .1)), back = eio(seg(t, start('cpu') - .45, start('cpu') + .05)), zk = ck * (1 - back);
    if (zk > 0) {
      var p = cellXY(BIGC), bw = lerp(CS, 600, zk), bh = lerp(CS, 300, zk), bx = lerp(p[0] + CS / 2, CX, zk), by = lerp(p[1] + CS / 2, 620, zk);
      g.save(); g.strokeStyle = 'rgba(244,237,224,' + (.5 * zk).toFixed(3) + ')'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(p[0], p[1] + CS); g.lineTo(bx - bw / 2, by + bh / 2); g.moveTo(p[0] + CS, p[1] + CS); g.lineTo(bx + bw / 2, by + bh / 2); g.stroke();
      g.strokeStyle = CREAM; g.lineWidth = 3; g.strokeRect(p[0] - 1, p[1] - 1, CS + 2, CS + 2);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(bx - bw / 2 + 10, by - bh / 2 + 14, bw, bh);
      g.fillStyle = PAPER; g.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
      g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 4; g.strokeRect(bx - bw / 2 + 8, by - bh / 2 + 8, bw - 16, bh - 16);
      if (zk > .6) {
        g.save(); g.globalAlpha *= seg(zk, .6, .9); g.translate(bx, by); g.scale(zk, zk);
        var mu = at('move', 'multiply') - .08, ad = at('move', 'then') - .08;
        if (t < mu) { font(g, 180, 900); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('× +', 0, 8); }
        else {
          txt(g, '3 × 4 = 12', 0, -52, 92, INK, 'center', 900, DISP, 520, fin(t, mu));
          txt(g, '12 + 5 = 17', 0, 66, 92, INK, 'center', 900, DISP, 520, fin(t, ad));
        }
        g.restore();
      }
      g.restore();
      tag(g, 'EXAMPLE', 770, 470, fin(t, at('move', 'multiply')) * zk, .04);
    }
    /* the matrix chip, under the sheet, on "billions" */
    /* the sheet's own count, until the matrix chip takes its place */
    var ca0 = fin(t, s0 + .1) * (1 - seg(t, at('cpu', 'ten') - .1, at('cpu', 'ten') + .05));
    txt(g, '64 × 34 = 2,176 CELLS', CX, 1280, 44, CREAM, 'center', 900, DISP, 820, cred(ca0));
    var ma = fin(t, at('move', 'multiply') - .05) * (1 - seg(t, at('cpu', 'ten') - .1, at('cpu', 'ten') + .08));
    chip(g, 'ONE BIG MATRIX MULTIPLY ≈ 69 BILLION OF THESE', CX, 1352, { px: 36, wt: 900, bg: CREAM, fg: BG, a: ma, maxw: 790 });
    txt(g, 'NVIDIA DOCS · OUR MATH', CX, 1424, 36, CREAM, 'center', 600, MONO, 800, ma);
    /* the screenshot frame: two columns */
    var lc = at('cpu', 'laptop') - .05, ten = at('cpu', 'ten') - .05, gc = at('gpu', 'gaming') - .05, k21 = GT.n21, ti = at('gpu', 'tiny') - .05;
    var colOut = 1 - seg(t, PGt() - .15, PGt() + .1);
    var la = fin(t, lc) * colOut, ra = fin(t, gc) * colOut;
    /* the tools first: the columns' type stays on top of them */
    var rsA = fin(t, GT.cols) * (1 - seg(t, slam + .1, slam + .35));
    printBlock(g, t);
    rubberStamp(g, t, rsA);
    txt(g, 'LAPTOP CPU', 300, 492, 52, CREAM, 'center', 900, DISP, 390, la);
    txt(g, '10', 300, 572, 100, CREAM, 'center', 900, DISP, 390, fin(t, ten) * colOut);
    txt(g, 'BIG CORES', 300, 646, 48, CREAM, 'center', 900, DISP, 390, fin(t, ten + .05) * colOut);
    txt(g, 'GAMING CARD', 720, 492, 52, CREAM, 'center', 900, DISP, 390, ra);
    txt(g, '21,760', 720, 572, 100, CREAM, 'center', 900, DISP, 390, fin(t, k21) * colOut);
    txt(g, 'TINY CORES', 720, 646, 48, CREAM, 'center', 900, DISP, 390, fin(t, ti) * colOut);
    if (la > 0) { g.save(); g.globalAlpha *= la; g.fillStyle = 'rgba(244,237,224,.25)'; g.fillRect(CX - 2, 464, 4, 200 * fin(t, gc)); g.restore(); }
    /* sources for the two numbers, under the sheet */
    txt(g, 'MACBOOK AIR M5, APPLE', 300, 1262, 32, CREAM, 'center', 600, MONO, 410, fin(t, ten + .15) * colOut);
    txt(g, 'RTX 5090 · NVIDIA', 720, 1262, 32, CREAM, 'center', 600, MONO, 410, fin(t, ti + .1) * colOut);
    /* the scale, honest: 1 cell = 10 cores, so the sheet is 21,760 to scale; it gives way to the hero stamp */
    var sa = fin(t, GT.p0) * (1 - seg(t, slam - .2, slam - .02));
    txt(g, '1 CELL = 10 CORES', 400, 1334, 48, CREAM, 'center', 900, DISP, 560, sa);
    tag(g, 'OUR MATH', 790, 1334, sa, -.02, 32);
    /* the hero stamp, under the sheet, never on it; the source's own words after it */
    var sk = kn(t, slam + .02); g.save(); g.translate(CX, 1345); g.scale(sk, sk); g.translate(-CX, -1345);
    stamp(g, 'ALL AT ONCE', CX, 1345, t, slam + .02, DUR, 68, HOT, -.03); g.restore();
    txt(g, '“…have to be done at once” · NVIDIA', CX, 1428, 36, CREAM, 'center', 600, MONO, 820, fin(t, at('once', 'all') - .05));
    /* pixels: what the same sheet was made for, and what it does now */
    /* the cardboard gaming card comes back over the sheet on "pixels", the same card made for game pixels, and lifts
       out on "Now" so only the sheet stays */
    var gk = clamp(sp(t, PGt() - .12, 2.4, .8), 0, 1.03), gx = eio(seg(t, PNt() - .02, PNt() + .33));
    if (gk > 0 && gx < 1) { g.save(); g.beginPath(); g.rect(0, 240, W, H - 240); g.clip(); card(g, CX, lerp(-300, 620, gk) - 1000 * gx, .62, t, 3, 1); g.restore(); }
  }

  /* =====================================================================================================
     SCENE 4 · end: a paper house, its door ajar, the inside left dark: the picture doesn't answer. YES / NO.
     ===================================================================================================== */
  function houseScene(g, t) {
    var s0 = S('end').t0, ys = at('end', 'yes'), no = at('end', 'no');
    var k = clamp(sp(t, s0 - .1, 2.4, .8), 0, 1.03);
    g.save(); g.translate(CX, 1180); g.scale(lerp(.9, 1, Math.min(1, k)), lerp(.9, 1, Math.min(1, k))); g.translate(-CX, -1180);
    var x0 = 220, x1 = 800, yr = 560, yw = 760, yb = 1180;
    /* the dark inside */
    g.fillStyle = '#0d0c11'; g.beginPath(); g.moveTo(x0, yw); g.lineTo(CX, yr); g.lineTo(x1, yw); g.lineTo(x1, yb); g.lineTo(x0, yb); g.closePath(); g.fill();
    /* cut-paper strips: roof and walls */
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 26; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x0 - 50 + 8, yw + 34); g.lineTo(CX + 8, yr - 6 + 12); g.lineTo(x1 + 50 + 8, yw + 34); g.stroke();
    g.strokeStyle = PAPER; g.beginPath(); g.moveTo(x0 - 50, yw + 22); g.lineTo(CX, yr - 6); g.lineTo(x1 + 50, yw + 22); g.stroke();
    g.lineWidth = 18; g.strokeStyle = KRAFT; g.beginPath(); g.moveTo(x0, yw + 30); g.lineTo(x0, yb); g.lineTo(x1, yb); g.lineTo(x1, yw + 30); g.stroke();
    /* the chimney and a window, dark */
    g.fillStyle = KRAFT; g.fillRect(680, 570, 56, 110);
    g.fillStyle = '#1c1a22'; g.fillRect(300, 860, 130, 120); g.strokeStyle = KRAFT; g.lineWidth = 8; g.strokeRect(300, 860, 130, 120); g.beginPath(); g.moveTo(365, 860); g.lineTo(365, 980); g.moveTo(300, 920); g.lineTo(430, 920); g.stroke();
    /* the door, ajar and swinging a little; behind it only dark */
    var dx = 560, dy = 930, dw = 150, dh = 250, op = .55 + Math.sin(t * 1.3) * .06;
    g.fillStyle = '#060509'; g.fillRect(dx, dy, dw, dh);
    g.save(); g.translate(dx, dy); g.transform(1 - op * .75, -op * .18, 0, 1, 0, 0);
    g.fillStyle = PAPER; g.fillRect(0, 0, dw, dh); g.fillStyle = 'rgba(33,29,38,.18)'; g.fillRect(14, 16, dw - 28, dh - 32);
    g.fillStyle = INK; el(g, dw - 24, dh / 2, 8, 8); g.restore();
    g.restore();
    /* YES / NO: ghosts first, filled on their words; the picture never answers */
    var ghost = fin(t, s0 + .35);
    chip(g, 'YES', 330, 1300, { px: 72, wt: 900, line: CREAM, lw: 4, fg: CREAM, a: ghost * (1 - fin(t, ys - .08)) * .7, w: 260, r: 50 });
    chip(g, 'NO', 690, 1300, { px: 72, wt: 900, line: CREAM, lw: 4, fg: CREAM, a: ghost * (1 - fin(t, no - .08)) * .7, w: 260, r: 50 });
    chip(g, 'YES', 330, 1300, { px: 72, wt: 900, bg: CREAM, fg: BG, a: fin(t, ys - .08), s: lerp(1.25, 1, clamp(pop(t, ys - .08, 3.2), 0, 1)), w: 260, r: 50 });
    chip(g, 'NO', 690, 1300, { px: 72, wt: 900, bg: CREAM, fg: BG, a: fin(t, no - .08), s: lerp(1.25, 1, clamp(pop(t, no - .08, 3.2), 0, 1)), w: 260, r: 50 });
  }

  /* ---------- captions: the narrator's words, one block at a time; only stressed words get the coral pill ---------- */
  var CAPBRK = {};
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'ask') return;   /* frame 0 is the tape (4 words); the search phrase is the headline */
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
  var STRESS = [['dc', '90%'], ['dc', 'centers'], ['games', 'games'], ['toronto', '2012'], ['toronto', 'two'], ['won', 'mile'], ['why', 'one'],
    ['move', 'multiply'], ['move', 'add'], ['move', 'billions'], ['cpu', 'ten'], ['gpu', '21000'], ['gpu', 'tiny'], ['once', 'once'],
    ['pixels', 'game'], ['pixels', 'trains'], ['end', 'yes'], ['end', 'no']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE - .14, sc.t0 - SWIPE) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, over: 1, that: 1, big: 1, two: 1 };
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
  var NOISE, SCENES = { tape: tapeScene, story: storyScene, sheet: sheetScene, house: houseScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) {
    g.save();
    if (Sc.fn === 'story' || Sc.fn === 'house') { var push = 1 + .012 * seg(t, Sc.t0, Sc.t1); g.translate(CX, 1000); g.scale(push, push); g.translate(-CX, -1000); }
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
    var pre = Sc.swipe && t < Sc.t0 + PRE;
    drawScene(g, Sc, pre ? Sc.t0 + PRE : t);
    if (sk > 0) {
      var ly = H * (1 - sk) - 20, x;
      g.save(); g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; drawScene(g, Nx, Nx.t0 + PRE); INCOMING = false; g.restore();
      g.save(); g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); for (x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t); if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore();
    }
    /* the loop: the house torn edge rises on the swish and cuts back to the frame-0 picture (no dissolve) */
    var back = eio(seg(t, GT.home, GT.home + .26));
    if (back > 0) {
      var by = H * (1 - back) - 20, bx;
      g.save(); g.beginPath(); g.moveTo(0, H); for (bx = 0; bx <= W; bx += 30) g.lineTo(bx, edgeY(bx, by, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; tapeIdle(g); INCOMING = false; g.restore();
      if (back < 1) { g.save(); g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); for (bx = 0; bx <= W; bx += 30) { var yb = edgeY(bx, by, t); if (bx === 0) g.moveTo(bx, yb); else g.lineTo(bx, yb); } g.stroke(); g.restore(); }
    }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) {
      if (t < start('dc')) headline(g, t);
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
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText('Why AI made', CX, 318);
    var b = 'Nvidia so rich', wb = g.measureText(b).width, x = CX - wb / 2;
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
    T('n96', '$96', .13, cutY('games', 700));
    T('bil', 'BILLION', .26, cutY('games', 800));
    T('mon', '3 MONTHS', 0, cutY('games', 950));
    T('cond', 'NVIDIA SALES (REVENUE)', 1.3, GT.tear - .1);
    T('qtr', 'QUARTER ENDED JULY 26, 2026', 1.3, GT.tear - .1);
    T('head', 'WHY IS NVIDIA SO RICH?', HEADT + .15, start('dc') - .1);
    T('dc', 'DATA CENTERS $89.0B', GT.dcl + .05, cutY('games', 1100));
    T('else', 'THE REST: $7.2B', GT.tear + .15, cutY('games', 1362));
    T('src1', 'NVIDIA, AUG 26, 2026', GT.tear + .15, cutY('games', 1426));
    var ST = storyTimes(), wn = ST.wn;
    T('fy', '10 YEARS AGO (FISCAL 2016)', ST.s0 + .1, ST.tr + .25);
    T('gm', 'GAMING 56%', ST.s0 + .1, ST.tr + .05);
    T('dc7', 'DATA CENTER 7%', ST.s0 + .1, ST.tr + .05);
    T('10k', 'NVIDIA 10-K', ST.s0 + .3, ST.tr + .05);
    T('om1', 'OUR MATH', ST.s0 + .3, ST.tr + .05);
    T('gtx', 'GTX 580', ST.two - .1, wn + .35);
    T('gtx2', '$499 IN 2010', ST.two - .1, wn + .35);
    T('tor', 'TORONTO · 2012', at('toronto', 'toronto'), wn + .35);
    T('quote', '“two GTX 580 3GB GPUs”', at('toronto', 'toronto') - .05, wn + .2);
    T('auth', 'KRIZHEVSKY ET AL., 2012', at('toronto', 'toronto') - .05, wn + .2);
    T('ilsvrc', 'ILSVRC 2012 IMAGE CONTEST', wn + .45, cutY('why', 910));
    T('wrong', 'WRONG GUESSES (TOP-5)', wn + .45, cutY('why', 968));
    T('lower', 'LOWER IS BETTER', wn + .45, cutY('why', 968));
    T('b2l', '2ND PLACE', wn + .45, cutY('why', 1044));
    T('b2', '26.2%', GT.bar2 + .55, cutY('why', 1094));
    T('b1l', 'THEIRS (TWO GAMING CARDS)', wn + .45, cutY('why', 1184));
    T('b1', '15.3%', GT.bar1 + .45, cutY('why', 1234));
    T('rec', 'NEURIPS 2012 · RE-CREATED', wn + .45, cutY('why', 1360));
    T('two', 'THEIR TWO GAMING CARDS', wn + .55, cutY('why', 780));
    var bl = at('move', 'billions') - .1;
    T('cells', '64 × 34 = 2,176 CELLS', S('why').t0 + .2, at('cpu', 'ten') - .1);
    T('cell', '× +', S('why').t0, at('move', 'multiply') - .08);
    T('ex1', '3 × 4 = 12', at('move', 'multiply') + .05, start('cpu') - .2);
    T('ex2', '12 + 5 = 17', at('move', 'then') + .05, start('cpu') - .1);
    T('mat', 'ONE BIG MATRIX MULTIPLY ≈ 69 BILLION OF THESE', at('move', 'multiply') + .1, at('cpu', 'ten') - .05);
    T('docs', 'NVIDIA DOCS · OUR MATH', at('move', 'multiply') + .1, at('cpu', 'ten') - .05);
    var colEnd = PGt() - .15;
    T('lap', 'LAPTOP CPU', at('cpu', 'laptop') + .05, colEnd);
    T('ten', '10 BIG CORES', at('cpu', 'ten') + .1, colEnd);
    T('mba', 'MACBOOK AIR M5, APPLE', at('cpu', 'ten') + .25, colEnd);
    T('gc', 'GAMING CARD', at('gpu', 'gaming') + .05, colEnd);
    T('n21', '21,760', GT.n21 + .1, colEnd);
    T('tiny', 'TINY CORES', at('gpu', 'tiny') + .05, colEnd);
    T('5090', 'RTX 5090 · NVIDIA', at('gpu', 'tiny') + .2, colEnd);
    T('scale', '1 CELL = 10 CORES', GT.p0 + .1, GT.slam - .1);
    T('once', 'ALL AT ONCE', GT.slam + .12, cutY('end', 1338));
    T('nq', '“…have to be done at once” · NVIDIA', at('once', 'all') + .15, cutY('end', 1418));
    T('yes', 'YES', S('end').t0 + .45, GT.home);
    T('no', 'NO', S('end').t0 + .45, GT.home + .1);
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
  function free(m) {
    var M = blocked(m), F = [], p = 0;
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { stampS: .16, slap: .16, thump: .16, knock: .15, paper: .17, swish: .28, pop: .12, tick: .04, key: .04, click: .05, block: .14, scratch: .2 };
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || .19).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  function gapSpan(a, b) {
    var best = null;
    free(.19).forEach(function (f) { var lo = Math.max(a, f[0]), hi = Math.min(b, f[1]) - .03; if (hi - lo >= .06 && (!best || hi - lo > best[1] - best[0])) best = [lo, hi]; });
    return best;
  }
  /* Every hit sits wholly in a free stretch. Beats that carry a sound are moved into the pauses (GT below), so picture
     and sound land together; the rest of the beats stay on their words and are silent. */
  var GT = {}, GS = [], PRESS = [];
  function G(id, t, type, tol, gain, m) {
    var n = nearGap(t, type, m);
    if (n !== null && Math.abs(n - t) <= (tol || .45)) { GT[id] = n; GS.push({ t: n, type: type, g: gain }); } else GT[id] = t;
  }
  function initGaps() {
    G('tear', start('dc') - .3, 'paper', .35, 1);                          /* the tape tears at 92.5 %, in the pause before "Over 90%" */
    GT.dcl = GT.tear + .22;                                                 /* DATA CENTERS printed on the long piece as the stub drops */
    GT.bar2 = start('won') + .55;
    GT.bar1 = at('won', 'contest');                                          /* their bar stops short: silent, mid-phrase */
    GT.cols = at('cpu', 'laptop') - .1;
    GT.mat = at('move', 'add') - .1;
    GT.n21 = at('gpu', '21000') - .05;
    GT.bin = at('gpu', 'gaming') - .1;
    G('slam', wend('once', 'once') + .35, 'block', .45, .04, .15);                 /* THE hero: the block slams in the pause after "once" */
    if (GT.slam < wend('once', 'once') - .05) GT.slam = wend('once', 'once') + .05;
    /* the laptop's five presses, from "cores" to just before the slam; a tick only where a pause holds one */
    var p0 = wend('cpu', 'cores') + .05, p4 = GT.slam - .35;
    for (var i = 0; i < 5; i++) { var tp = lerp(p0, p4, i / 4), n = i < 4 ? nearGap(tp, 'tick') : null; if (n !== null && Math.abs(n - tp) <= .3) { tp = n; GS.push({ t: n, type: 'tick', g: .18 }); } PRESS.push(tp); }
    GT.p0 = PRESS[0];
    GT.home = nearGap(wend('end', 'no') + .19, 'swish');
    if (GT.home === null || GT.home + .28 > DUR) GT.home = DUR - .3; else GS.push({ t: GT.home, type: 'swish' });
  }
  function initTimes() {
    function A(t, type, g) { if (t !== null) EV.push({ t: t, type: type, g: g }); }
    GS.forEach(function (e) { A(e.t, e.type, e.g); });
    SC.forEach(function (sc) { if (sc.swipe) { var s = gapSpan(sc.t0 - SWIPE, sc.t0); if (s) EV.push({ t: s[0], type: 'sweep', t1: s[1] }); } });
    EV.forEach(function (e) { if (e.type === 'block') e.t1 = e.t + BODY.block; });
    EV.sort(function (a, b) { return a.t - b.t; });
    for (var i = EV.length - 1; i > 0; i--) if (EV[i].type === EV[i - 1].type && EV[i].t - EV[i - 1].t < .06) EV.splice(i, 1);
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
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 32;
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
    function swish(t) { band(t, t + .26, 900, 5200, .035, .008, 1.6); }
    /* a paper rip: two fast noisy bursts climbing in pitch */
    function paper(t, g) { g = g || 1; band(t, t + .09, 1400, 3200, .16 * g, .05, 1.1, -.2); band(t + .07, t + .16, 2000, 4200, .12 * g, .02, 1.3, .2); }
    /* pencil on paper: a short grainy stroke */
    function scratch(t, g) { g = g || 1; band(t, t + .18, 2600, 3400, .06 * g, .04, 2.2, .15); }
    /* the hero: a heavy wooden block on a sheet of paper — a low body, a wood knock and a paper slap */
    function blockS(t, g) {
      /* wood on paper, voiced where a phone speaker plays: a 240 → 185 Hz body, a short 300 Hz knock, a little slap */
      g = g || 1;
      var o = osc('sine', 240, t, t + .14, 1, [[t, 0], [t + .004, .6 * g], [t + .13, 0]], .06); o.frequency.exponentialRampToValueAtTime(185, t + .12);
      osc('triangle', 300, t, t + .07, 1, [[t, 0], [t + .002, .45 * g], [t + .06, 0]], .03);
      var n = noise(t, .08), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = .8; var ob = bus(1, .08); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .003, .12 * g], [t + .06, 0]]);
    }

    function sweepS(t, t1) { band(t, t1 + .03, 600, 3000, .035, .02, 1.6); }
    EV.forEach(function (e) {
      if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'thump') thump(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'paper') paper(e.t, e.g);
      else if (e.type === 'scratch') scratch(e.t, e.g);
      else if (e.type === 'block') blockS(e.t, e.g);
      else if (e.type === 'sweep') sweepS(e.t, e.t1);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −62 dB, so the loop seam is never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .0009; })();
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”·→…#?‹✓✕–@!>$'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {}; makeTex();
      window.READY = true;
    });
  }
  initGaps();
  initTimes();
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: GT.slam + .55, SLUG: 'gpus', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
