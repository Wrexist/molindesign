/* "Why AI is bad at math" — Factory #16 on Tech, explained (How AI works, part 7), after ../wifi/ and ../agent/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the cut: the number is adding-machine tape, OpenAI's tokenizer is a pair of paper scissors and every
   token is a cut piece of tape. The tile splits are real tiktoken output (BRIEF §3 fact 1, cl100k_base and o200k_base):
   1999999 → 199 | 999 | 9, What is → What | is, 2000000 → 200 | 000 | 0. One hero stamp only: WRITTEN FIRST (coral);
   coral is also on the end card's YES / NO and nowhere else. Cut-paper props, no logos, no real UI, no photos. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', INK = '#211d26', TAPE = '#f4eddc', TAPE_D = '#ddd2ba', EDGE = 'rgba(96,136,190,.55)', PENCIL = '#3c3946';
  var GRAPH = '#ece6d6', GRID = 'rgba(86,124,170,.20)';
  var CARD = '#c8a273', CARD_D = '#a7814f', CARD_L = '#d9b88b', WOOD = '#c9a06a', WOOD_D = '#9c7444', WOOD_L = '#dcb987';
  var STEEL = '#bfc4cc', STEEL_L = '#e6e9ee', STEEL_D = '#7f8590', HANDLE = '#d6a243', HANDLE_D = '#a67827';
  var PHONE = '#2c2833', SCREEN = '#3b3646', BUB = '#5d566b';
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
    hookEnd: lend('hook'), one: at('hook', 'one'), so: at('ask', 'so'), why: at('ask', 'why'), askEnd: lend('ask'),
    chunks: start('chunks'), chunkW: at('chunks', 'chunks'), words: at('chunks', 'words'),
    split: start('split'), three: at('split', 'three'), pieces: at('split', 'pieces'), splitEnd: lend('split'),
    commas: start('commas'), where: at('commas', 'where'), commaW: at('commas', 'commas'), go: at('commas', 'go'),
    left: start('left'), writes: at('left', 'writes'), leftW: at('left', 'left'), piece1: at('left', 'piece'), piece2: at('left', 'piece', 1), leftEnd: lend('left'),
    carry: start('carry'), carryW: at('carry', 'carry'), right: at('carry', 'right'),
    guess: start('guess'), firstP: at('guess', 'piece'), there: at('guess', 'there'), guessEnd: lend('guess'),
    newer: start('newer'), fix: start('fix'), many: at('fix', 'many'), hand: at('fix', 'hand'), calc: at('fix', 'calculator'),
    lie: start('lie'), say: at('lie', 'say'), didnt: at('lie', 'didnt'), lieEnd: lend('lie'),
    end: start('end'), calcQ: wend('end', 'calculator'), yes: at('end', 'yes'), no: at('end', 'no'), noEnd: wend('end', 'no')
  };
  /* the headline becomes the question on "why" (frame 0's four words have had 2 s); NOT LIKE YOU DO lands on "one." */
  K.swap = K.why - .08; K.chip = 1.3;
  K.hookOut = K.swap + 2.42;   /* the question stays up long enough to read; the chunks caption waits for it */
  /* the scissors: two cuts on "pieces", the tape falls apart in the planned silence after it */
  K.cut1 = K.pieces; K.cut2 = K.pieces + .32; K.apart = K.cut2 + .12;   /* cut2 and apart move onto the snip in initGaps */

  /* scenes. swipe:true = the next scene comes in under the torn edge, drawn complete */
  var SWIPE = .44;
  var SC = [
    { id: 'tape', fn: 'tape', name: 'The number tape', t0: 0 },
    { id: 'board', fn: 'board', name: 'Left vs right', t0: at('left', 'the'), swipe: true },
    { id: 'calc', fn: 'calc', name: 'The calculator', t0: K.hand, swipe: true }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, MC, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- measuring: the safe area (BOUNDS_RUN), what is readable (TEXTS → readcheck) and labels vs props (LABELS_RUN) ---------- */
  var BOUNDS = null, REC = null, PROPS = null, LBL = null, INCOMING = false, CURT = 0, NOREC = false, ONPROP = false, CHIPBOX = null, COVER = 1e9;
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
    var b = xbox(g, x0, y0, x1, y1); if (b[1] > COVER) return; PROPS.push({ name: name, b: b });
  }
  function seen(g, text, b) {
    var vis = !INCOMING && !NOREC && g.globalAlpha >= .95 && b[3] <= COVER && (g === ctx || g === tctx);
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
  function mw(text, px, wt, fam) { font(MC, px, wt, fam); ls(MC, 0); return MC.measureText(text).width; }
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
  /* quiet tags (OUR ILLUSTRATION): cream outline, never coral */
  function tag(g, text, x, y, a, rot) { chip(g, text, x, y, { px: 36, wt: 700, fam: MONO, line: CREAM, lw: 3, fg: CREAM, a: a, rot: rot == null ? .012 : rot, shadow: false, bg: 'rgba(21,19,27,.9)', maxw: 820 }); }
  /* an arrow drawn as a shape (cream), pointing left (dir -1) or right (dir 1) */
  function arrow(g, x0, x1, y, a, lw) {
    if (a <= 0) return;
    var d = x1 > x0 ? 1 : -1;
    g.save(); g.globalAlpha *= a; g.strokeStyle = CREAM; g.fillStyle = CREAM; g.lineWidth = lw || 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y); g.lineTo(x1 - d * 20, y); g.stroke();
    poly(g, [[x1, y], [x1 - d * 30, y - 20], [x1 - d * 30, y + 20]]); g.fill();
    g.restore();
  }

  /* ---------- the one rubber stamp: worn ink (seeded speckle), slammed ---------- */
  var STEX = {};
  function stampTex(text, col, px) {
    var key = text + col + px; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900); ls(m, 2);
    var TL = text.split('\n'), lw = Math.max.apply(null, TL.map(function (s) { return m.measureText(s).width; })), pad = px * .45, h = px * (1.05 * TL.length + .2), w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .03); rr(g, px * .14, px * .14, w - px * .28, h - px * .28, px * .08); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, px, 900); ls(g, 2); TL.forEach(function (s, i) { g.fillText(s, w / 2, h / 2 + px * .05 + (i - (TL.length - 1) / 2) * px * 1.02); });
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 140);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.9, 0, 6.283); g.fill(); }
    c.w = w + 16; c.h = h + 16; STEX[key] = c; return c;
  }
  function stamp(g, text, x, y, t, t0, px, col, rot, sw) {
    if (t < t0) return;
    var c = stampTex(text, col, px);
    var k = eout(seg(t, t0, t0 + .18)), s = lerp(1.35, 1, k) * (sw ? sw / c.w : 1), al = clamp(k * 3, 0, 1);
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.08 : rot); g.scale(s, s);
    var oldP = ONPROP; ONPROP = true;
    if (k >= 1) { recBox(g, -c.w / 2, -c.h / 2, c.w / 2, c.h / 2, text.replace('\n', ' ')); if (al >= 1) seen(g, text.replace('\n', ' '), xbox(g, -c.w / 2, -c.h / 2, c.w / 2, c.h / 2)); } g.drawImage(c, -c.w / 2, -c.h / 2); ONPROP = oldP; g.restore();
  }

  /* =====================================================================================================
     PROPS
     ===================================================================================================== */
  /* a ragged torn end of paper (seeded, fixed in time) */
  function tornSide(g, x, y0, y1, dir, seed) {
    var r = mulberry(seed), n = Math.ceil((y1 - y0) / 12);
    for (var i = 0; i <= n; i++) { var yy = dir > 0 ? y0 + (y1 - y0) * i / n : y1 - (y1 - y0) * i / n; g.lineTo(x + (r() - .5) * 12 + (i % 2 ? 3 : -3), yy); }
  }
  /* adding-machine tape: cream receipt paper, a faint blue line near each long edge. Cut ends are straight (scissors),
     the far ends torn. Drawn in local coordinates; the caller sets the transform. */
  function tapePath(g, x0, x1, y0, h, tornL, tornR, seed) {
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0);
    if (tornR) tornSide(g, x1, y0, y0 + h, 1, seed + 3); else g.lineTo(x1, y0 + h);
    g.lineTo(x0, y0 + h);
    if (tornL) tornSide(g, x0, y0, y0 + h, -1, seed); else g.lineTo(x0, y0);
    g.closePath();
  }
  function tapeBody(g, x0, x1, y0, h, tornL, tornR, seed, name) {
    var gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, '#f8f2e4'); gr.addColorStop(.7, TAPE); gr.addColorStop(1, TAPE_D);
    tapePath(g, x0, x1, y0, h, tornL, tornR, seed); g.fillStyle = gr; g.fill();
    g.save(); tapePath(g, x0, x1, y0, h, tornL, tornR, seed); g.clip();
    g.strokeStyle = EDGE; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x0 - 20, y0 + 16); g.lineTo(x1 + 20, y0 + 16); g.moveTo(x0 - 20, y0 + h - 16); g.lineTo(x1 + 20, y0 + h - 16); g.stroke();
    g.restore();
    prop(g, name || 'tape', x0, y0, x1, y0 + h);
  }
  /* typewriter digits on paper: one cell per character, centred in its cell */
  function typeChars(g, chars, y, px, a) {
    if (a != null && a <= 0) return;
    g.save(); if (a != null) g.globalAlpha *= a;
    ONPROP = true; font(g, px, 700, MONO); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
    chars.forEach(function (c) { g.fillText(c.c, c.x, y); });
    ONPROP = false; g.restore();
  }
  /* the shadow of several paper pieces as one shape (no darker seams where they touch) */
  function shadowOf(g, rects, ox, oy, al) {
    g.save(); g.fillStyle = 'rgba(0,0,0,' + al + ')'; g.beginPath();
    rects.forEach(function (q) {
      var c = Math.cos(q.rot), s = Math.sin(q.rot), mx = (q.x0 + q.x1) / 2, my = q.y0 + q.h / 2;
      [[q.x0, q.y0], [q.x1, q.y0], [q.x1, q.y0 + q.h], [q.x0, q.y0 + q.h]].forEach(function (p, i) {
        var dx = p[0] - mx, dy = p[1] - my, X = mx + q.dx + dx * c - dy * s + ox, Y = my + q.dy + dx * s + dy * c + oy;
        if (i) g.lineTo(X, Y); else g.moveTo(X, Y);
      });
      g.closePath();
    });
    g.fill(); g.restore();
  }
  /* paper scissors, pointing down: pivot (x, y), half-opening a (rad). Each half is a steel blade on one side of the
     pivot and a mustard handle loop on the other. */
  function scissors(g, x, y, a, s) {
    s = s || 1;
    g.save(); g.translate(x, y); g.scale(s, s);
    function half(th, sd) {
      g.save(); g.rotate(th);
      /* handle: up from the pivot to a loop */
      g.fillStyle = 'rgba(0,0,0,.3)'; el(g, 8 + sd * 4, -112 + 12, 40, 48);
      g.fillStyle = HANDLE_D; poly(g, [[-9, -6], [9, -6], [14, -70], [-14, -70]]); g.fill();
      g.fillStyle = HANDLE; el(g, 0, -112, 40, 48);
      g.fillStyle = BG; el(g, 0, -112, 24, 31);
      g.fillStyle = 'rgba(255,240,200,.35)'; el(g, -22 * sd, -124, 6, 16, .3 * sd);
      /* blade: down from the pivot, tapering to the tip */
      g.fillStyle = 'rgba(0,0,0,.32)'; poly(g, [[-13 + 8, 8 + 12], [13 + 8, 8 + 12], [2 + 8, 168 + 12], [-2 + 8, 168 + 12]]); g.fill();
      g.fillStyle = STEEL; poly(g, [[-14, 0], [14, 0], [sd > 0 ? 3 : 1, 168], [sd > 0 ? -1 : -3, 168]]); g.fill();
      g.fillStyle = sd > 0 ? STEEL_L : STEEL_D; poly(g, [[0, 4], [sd * 13, 4], [sd * 2, 160], [0, 166]]); g.fill();
      g.restore();
    }
    half(a, 1); half(-a, -1);
    g.fillStyle = '#5d616b'; el(g, 0, 0, 11, 11); g.fillStyle = '#9aa0aa'; el(g, -2, -2, 5, 5);
    prop(g, 'scissors', -60, -165, 60, 170);
    g.restore();
  }
  /* a yellow pencil lying from (x0,y0) to (x1,y1), tip at (x1,y1) */
  function pencil(g, x0, y0, x1, y1) {
    var L = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0);
    g.save(); g.translate(x0, y0); g.rotate(ang);
    g.fillStyle = 'rgba(0,0,0,.3)'; poly(g, [[4, -9 + 10], [L - 54, -9 + 10], [L + 2, 10], [L - 54, 9 + 10], [4, 9 + 10]]); g.fill();
    g.fillStyle = '#e4b74a'; g.fillRect(0, -11, L - 56, 22);
    g.fillStyle = '#c99a2e'; g.fillRect(0, 3, L - 56, 8);
    g.fillStyle = '#d8c39a'; g.fillRect(-26, -11, 26, 22); g.fillStyle = '#b9ab98'; rr(g, -48, -11, 24, 22, 6); g.fill();
    g.fillStyle = '#e8d2aa'; poly(g, [[L - 56, -11], [L - 12, -3], [L - 12, 3], [L - 56, 11]]); g.fill();
    g.fillStyle = PENCIL; poly(g, [[L - 14, -3.4], [L, 0], [L - 14, 3.4]]); g.fill();
    prop(g, 'pencil', -48, -11, L, 11);
    g.restore();
  }
  /* graph paper (cream, blue grid), straight-cut */
  function graphPaper(g, x0, y0, x1, y1, step, seed, name) {
    var r = mulberry(seed);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(x0 + 9, y0 + 13, x1 - x0, y1 - y0);
    g.fillStyle = GRAPH; cut(g, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], r, 1.6);
    g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
    g.strokeStyle = GRID; g.lineWidth = 2; g.beginPath();
    for (var x = x0 + step; x < x1; x += step) { g.moveTo(x, y0); g.lineTo(x, y1); }
    for (var y = y0 + step; y < y1; y += step) { g.moveTo(x0, y); g.lineTo(x1, y); }
    g.stroke(); g.restore();
    prop(g, name || 'graph', x0, y0, x1 + 9, y1 + 13);
  }
  /* a wooden ledge (the tile rack): top lip, front face with grain, shadow */
  function rack(g, x0, x1, y, h, name) {
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x0 + 8, y + 12, x1 - x0, h);
    g.fillStyle = WOOD_L; g.fillRect(x0, y, x1 - x0, 16);
    g.fillStyle = WOOD; g.fillRect(x0, y + 16, x1 - x0, h - 16);
    g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x0, y + 16, x1 - x0, 4);
    g.strokeStyle = 'rgba(110,72,34,.35)'; g.lineWidth = 2.5;
    for (var i = 0; i < 3; i++) { g.beginPath(); for (var x = x0; x <= x1; x += 16) g.lineTo(x, y + 30 + i * (h - 40) / 3 + Math.sin(x * .021 + i * 2) * 4 + Math.sin(x * .07 + i) * 1.5); g.stroke(); }
    g.fillStyle = WOOD_D; g.fillRect(x0, y + h - 6, x1 - x0, 6);
    prop(g, name || 'rack', x0, y, x1 + 8, y + h + 12);
  }

  /* =====================================================================================================
     SCENE 1 · the number tape (hook → commas). Frame 0: YOUR CHATBOT / DOESN'T / CALCULATE (4 words), the tape
     1999999 + 1 = on the rack, the scissors gliding left to the first cut, a blank graph strip with a pencil under it.
     ===================================================================================================== */
  /* frame 0 fits inside x 95–900: 1999999 + 1 = [ ? ] on a tape that ends torn at x 888 */
  var TP = { px: 100, P: 62, S: 16, y: 846, h: 212 };
  TP.X0 = 112; TP.cy = TP.y + TP.h / 2 - 2;
  TP.c1 = TP.X0 + 3 * TP.P; TP.c2 = TP.X0 + 6 * TP.P; TP.c3 = TP.X0 + 7 * TP.P + TP.S / 2;
  function cellX(i) { return TP.X0 + TP.P * (i + .5); }                                   /* digit i of 1999999 */
  var SIGNS = [{ c: '+', x: TP.X0 + 7 * TP.P + TP.S + TP.P / 2 }, { c: '1', x: TP.X0 + 8 * TP.P + 2 * TP.S + TP.P / 2 }, { c: '=', x: TP.X0 + 9 * TP.P + 3 * TP.S + TP.P / 2 }];
  var DIG = '1999999'.split('').map(function (c, i) { return { c: c, x: cellX(i) }; });
  /* the pieces: A = 199, B = 999, C = 9 (OpenAI's cuts), D = " + 1 =" and the rest of the roll */
  var PC = [
    { x0: TP.X0 - 4, x1: TP.c1, ch: DIG.slice(0, 3), to: 104, rot: -.018, tornL: true },
    { x0: TP.c1, x1: TP.c2, ch: DIG.slice(3, 6), to: 179, rot: .014 },
    { x0: TP.c2, x1: TP.c3, ch: DIG.slice(6, 7), to: 254, rot: -.024 }
  ];
  var PD = { x0: TP.c3, x1: 888, ch: SIGNS, box: { x0: TP.X0 + 10 * TP.P + 4 * TP.S - 12, x1: TP.X0 + 10 * TP.P + 4 * TP.S + 64 } };
  var RK = { x0: 95, x1: 925, y: TP.y + TP.h, h: 82 };
  var STRIP = { x0: 110, x1: 910, y0: 1258, y1: 1392 };
  /* after the split, where the tiles are: their gaps are the cut lines on the strip */
  function tileX(i) { return DIG[i].x + (i < 3 ? PC[0].to : i < 6 ? PC[1].to : PC[2].to); }
  var GAPS = [(PC[0].x1 + PC[0].to + PC[1].x0 + PC[1].to) / 2, (PC[1].x1 + PC[1].to + PC[2].x0 + PC[2].to) / 2];
  var COMMAS = [(tileX(0) + tileX(1)) / 2, (tileX(3) + tileX(4)) / 2];
  /* the scissors' path: glide on frame 0, idle snips, open at the first cut on "chunks", two cuts on "pieces", then away */
  function scState(t) {
    var x, y = 740, a;
    if (t < K.cut1 - .32) {
      /* while the question is up the scissors slide along the tape between the two cut marks, measuring */
      var me = seg(t, 1.5, 2.1) * (1 - seg(t, K.chunkW - 1.1, K.chunkW - .45));
      x = TP.c1 + 420 * Math.exp(-2.4 * t) + 9 * Math.sin(t * 1.3) * seg(t, .8, 1.6) + me * 72 * (1 - Math.cos(2 * Math.PI * (t - 1.5) / 2.4));
      y += 4 * Math.sin(t * 2.2) * seg(t, .8, 1.6);
      a = .2 + .13 * Math.sin(t * 5.6);
      var wideK = eio(seg(t, K.chunkW - .1, K.chunkW + .15)) * (1 - eio(seg(t, K.words + .3, K.words + .7)));
      a = lerp(a, .44, wideK);
      return { x: x, y: y, a: a };
    }
    function cutAt(tc, cx) { var dn = seg(t, tc, tc + .13), up = seg(t, tc + .13, tc + .24); return { x: cx, y: 740 + 150 * eout(dn) - 150 * eio(up), a: lerp(.44, .03, eout(dn)) + .41 * eio(up) }; }
    if (t < K.cut1) { var k = eio(seg(t, K.cut1 - .32, K.cut1 - .02)), s0 = scState(K.cut1 - .3201); return { x: lerp(s0.x, TP.c1, k), y: lerp(s0.y, 740, k), a: lerp(s0.a, .44, k) }; }
    if (t < K.cut1 + .24) return cutAt(K.cut1, TP.c1);
    if (t < K.cut2) { var m = eio(seg(t, K.cut1 + .24, K.cut2 - .02)); return { x: lerp(TP.c1, TP.c2, m), y: 740, a: .44 }; }
    if (t < K.cut2 + .24) return cutAt(K.cut2, TP.c2);
    /* away to the left, low, so they never pass over the WHAT IS tiles on the right */
    var e = eio(seg(t, K.cut2 + .26, K.cut2 + .8));
    return { x: lerp(TP.c2, -260, e), y: lerp(740, 660, e), a: .44 - .2 * e };
  }
  function tapeScene(g, t) {
    var i;
    /* the split: pieces A, B, C spread to centre; D drops behind the rack and fades */
    var ap = eio(seg(t, K.apart, K.apart + .42)), st = sp(t, K.apart, 2.6, .7), dk = seg(t, K.apart - .02, K.apart + .2);
    var drop = Math.max(0, st - 1) * 30;    /* a small settle */
    var rects = PC.map(function (p) { return { x0: p.x0, x1: p.x1, y0: TP.y, h: TP.h, dx: p.to * ap, dy: 8 * ap - drop, rot: p.rot * ap }; });
    /* D: behind the rack */
    if (dk < 1) {
      g.save(); g.globalAlpha *= 1 - seg(dk, 0, .6); g.translate(0, 95 * eio(dk));
      if (dk <= 0) shadowOf(g, rects.concat([{ x0: PD.x0, x1: PD.x1, y0: TP.y, h: TP.h, dx: 0, dy: 0, rot: 0 }]), 9, 13, .36);
      tapeBody(g, PD.x0, PD.x1, TP.y, TP.h, false, true, 5, 'tape');
      typeChars(g, PD.ch, TP.cy, TP.px);
      /* the empty answer box: a pencil-dashed square with a ? */
      g.save(); g.strokeStyle = PENCIL; g.lineWidth = 4; g.setLineDash([10, 8]); rr(g, PD.box.x0, TP.y + 44, PD.box.x1 - PD.box.x0, TP.h - 88, 8); g.stroke(); g.setLineDash([]); g.restore();
      typeChars(g, [{ c: '?', x: (PD.box.x0 + PD.box.x1) / 2 }], TP.cy, 80);
      g.restore();
    }
    rack(g, RK.x0, RK.x1, RK.y, RK.h);
    if (dk > 0) shadowOf(g, rects, 9, 13, .36);
    PC.forEach(function (p, k) {
      var q = rects[k], mx = (p.x0 + p.x1) / 2, my = TP.y + TP.h / 2;
      g.save(); g.translate(mx + q.dx, my + q.dy); g.rotate(q.rot); g.translate(-mx, -my);
      tapeBody(g, p.x0, p.x1, TP.y, TP.h, !!p.tornL, false, 11 + k, 'tile');
      typeChars(g, p.ch, TP.cy, TP.px);
      g.restore();
    });
    /* cut marks (pencil ticks) on "chunks"; the slits once the blades have passed */
    var cm = fin(t, K.chunkW - .05) * (1 - ap);
    if (cm > 0) { g.save(); g.globalAlpha *= cm; g.strokeStyle = PENCIL; g.lineWidth = 4; g.setLineDash([12, 10]); [TP.c1, TP.c2].forEach(function (x) { g.beginPath(); g.moveTo(x, TP.y + 6); g.lineTo(x, TP.y + 44); g.stroke(); }); g.setLineDash([]); g.restore(); }
    [[K.cut1 + .08, TP.c1], [K.cut2 + .08, TP.c2]].forEach(function (q) { if (t >= q[0] && ap <= 0) { g.fillStyle = 'rgba(33,29,38,.6)'; g.fillRect(q[1] - 1.5, TP.y, 3, TP.h * clamp((t - q[0]) / .06, 0, 1)); } });
    /* the word tape on its own little rack: WHAT IS, split on "words" */
    var wa = clamp(pop(t, K.chunkW + .34, 3.4), 0, 1.04), wsn = eio(seg(t, K.words + .05, K.words + .25));
    if (wa > 0) {
      var wy = 640, wh = 124, wx = 630, wpx = 60, wP = 37;
      g.save(); g.translate(770, wy + wh / 2); g.scale(wa, wa); g.translate(-770, -(wy + wh / 2));
      rack(g, 612, 925, wy + wh, 30, 'wordrack');
      var w1 = wx + 4 * wP + 26, w2 = w1 + 2 * wP + 26;
      shadowOf(g, [{ x0: wx, x1: w1, y0: wy, h: wh, dx: 0, dy: 0, rot: 0 }, { x0: w1, x1: w2, y0: wy, h: wh, dx: 16 * wsn, dy: 0, rot: .02 * wsn }], 7, 10, .34);
      tapeBody(g, wx, w1, wy, wh, true, false, 31, 'wordtile');
      typeChars(g, [{ c: 'WHAT', x: wx + 13 + 2 * wP }], wy + wh / 2, wpx);
      g.save(); g.translate((w1 + w2) / 2 + 16 * wsn, wy + wh / 2); g.rotate(.02 * wsn); g.translate(-(w1 + w2) / 2, -(wy + wh / 2));
      tapeBody(g, w1, w2, wy, wh, false, true, 37, 'wordtile');
      typeChars(g, [{ c: 'IS', x: w1 + 13 + wP }], wy + wh / 2, wpx);
      g.restore();
      if (t >= K.words && wsn < 1) { g.fillStyle = 'rgba(33,29,38,.6)'; g.fillRect(w1 - 1.5, wy, 3, wh); }
      g.restore();
    }
    /* the scissors */
    var sc = scState(t);
    if (sc.x > -200) scissors(g, sc.x, sc.y, sc.a);
    /* labels under the rack */
    tag(g, 'OUR ILLUSTRATION', CX, 1180, fin(t, K.hookEnd + .06) * (1 - seg(t, K.chunkW - .3, K.chunkW - .15)));
    var la = fin(t, K.chunkW - .1);
    txt(g, 'ITS PIECES · OPENAI TOKENIZER', CX, 1178, 40, CREAM, 'center', 900, DISP, 820, la);
    txt(g, 'TIKTOKEN, GPT-4o/GPT-5 · OCT 29, 2026', CX, 1224, 36, CREAM, 'center', 700, MONO, 820, la);
    /* the graph strip: under the rack on frame 0 (blank, a pencil on it), out for the quote, back for the commas */
    var out = eio(seg(t, K.hookOut + .05, K.hookOut + .45)), back = eio(seg(t, K.cut2 + .12, K.cut2 + .38));
    var sx = -960 * out * (1 - back);
    var qa = fin(t, K.hookOut + .3) * (1 - seg(t, K.cut2 - .02, K.cut2 + .12));
    if (qa > 0) {
      txt(g, '“…breaking a long number into', CX, 1284, 44, CREAM, 'center', 700, DISP, 820, qa);
      txt(g, '3-digit chunks, left-to-right”', CX, 1336, 44, CREAM, 'center', 700, DISP, 820, qa);
      txt(g, 'SINGH & STROUSE, 2024', CX, 1396, 36, CREAM, 'center', 700, MONO, 820, qa);
    }
    if (sx > -940) {
      g.save(); g.translate(sx, 0);
      graphPaper(g, STRIP.x0, STRIP.y0, STRIP.x1, STRIP.y1, 37, 23, 'strip');
      /* pencil writes 1,999,999 under the tiles (each digit under its tile digit) while "where your commas" is spoken */
      var w0 = K.commas - .02, wstep = .075, nw = 0;
      ONPROP = true; font(g, 100, 600, MONO); g.fillStyle = PENCIL; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (i = 0; i < 7; i++) if (t >= w0 + i * wstep) { g.fillText(DIG[i].c, tileX(i), 1314); nw = i + 1; }
      ONPROP = false;
      g.strokeStyle = PENCIL; g.lineWidth = 7; g.lineCap = 'round';
      COMMAS.forEach(function (x, k) { if (t >= w0 + (k ? 3.5 : .5) * wstep) { g.beginPath(); g.moveTo(x + 2, 1350); g.quadraticCurveTo(x + 4, 1368, x - 7, 1382); g.stroke(); } });
      /* the tile gaps as solid cream cut lines (4 px, ink-edged on the paper) across the strip: they miss the commas */
      var dl = seg(t, K.commaW + .1, K.commaW + .4);
      if (dl > 0) {
        var ly0 = STRIP.y0 - 10, ly1 = ly0 + (STRIP.y1 + 10 - ly0) * dl;
        g.save(); g.lineCap = 'butt';
        GAPS.forEach(function (x) { g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.moveTo(x, Math.max(ly0, STRIP.y0)); g.lineTo(x, Math.min(ly1, STRIP.y1)); if (ly1 > STRIP.y0) g.stroke();
          g.strokeStyle = CREAM; g.lineWidth = 4; g.beginPath(); g.moveTo(x, ly0); g.lineTo(x, ly1); g.stroke(); });
        g.restore();
      }
      /* the pencil: lying on the strip, then writing, then lifting away */
      var px, py, wr = seg(t, w0 - .25, w0), lift = eio(seg(t, K.go + .2, K.go + .75));
      var tipX = nw ? tileX(Math.min(6, nw)) - 30 : 560, tipY = 1326;
      if (t < w0 - .25) { pencil(g, 870, 1278, 600, 1330); }
      else {
        px = lerp(600, tipX, eio(wr)); py = lerp(1330, tipY, eio(wr));
        if (nw >= 7) { px = lerp(tileX(6) + 20, 1000, lift); py = lerp(tipY, 1280, lift); }
        pencil(g, px + 300, py + 40, px, py);
      }
      g.restore();
    }
    var ga = fin(t, K.cut2 + .1);
    txt(g, 'YOUR GROUPS', 520, 1424, 40, CREAM, 'right', 900, DISP, 420, ga);
    txt(g, '1 · 999 · 999', 548, 1424, 40, CREAM, 'left', 700, MONO, 360, ga);
  }
  /* frame-0 type: DOESN'T / CARRY THE 1 (4 words). NOT LIKE YOU DO at 1.5 s; the question WHY IS AI / BAD AT MATH? on
     "why"; all of it leaves just before the captions take over. */
  function hookText(g, t, idle) {
    var a = idle ? 1 : 1 - seg(t, K.hookOut - .1, K.hookOut);
    if (a <= 0) return;
    var m = idle ? 0 : eio(seg(t, K.swap, K.swap + .1));
    var L = ['DOESN’T', 'CARRY THE 1'], px = 116;
    g.save(); font(g, px, 900);
    while (Math.max.apply(null, L.map(function (s) { return g.measureText(s).width; })) > 800 && px > 60) { px -= 2; font(g, px, 900); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
    if (m < 1) { g.globalAlpha = a * (1 - m); L.forEach(function (s, i) { g.fillText(s, CX, 352 + i * px * .98 - 14 * m); }); }
    g.restore();
    if (idle) return;
    var Q = ['WHY IS AI', 'BAD AT MATH?'], qp = 100;
    if (m > 0) {
      g.save(); g.globalAlpha = a * m; font(g, qp, 900);
      while (Math.max(g.measureText(Q[0]).width, g.measureText(Q[1]).width) > 770 && qp > 60) { qp -= 2; font(g, qp, 900); }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
      var k = 1 + .05 * Math.sin(Math.PI * seg(t, at('ask', 'math') - .05, at('ask', 'math') + .3));
      Q.forEach(function (s, i) { g.save(); g.translate(CX, 356 + i * qp * 1.04 + 16 * (1 - m)); g.scale(i ? k : 1, i ? k : 1); g.fillText(s, 0, 0); g.restore(); });
      g.restore();
    }
    var ca = a * fin(t, K.chip, 3.6);
    chip(g, 'NOT LIKE YOU DO', CX, 530, { px: 42, wt: 900, bg: CREAM, fg: BG, a: ca, s: pop(t, K.chip, 3.6), rot: .015, r: 12 });
  }

  /* =====================================================================================================
     SCENE 2 · the carry board (left → newer). Top: a pencil column sum 1,999,999 + 1 on graph paper; the carries hop
     right to left on "carry … right" and the pencil writes 2,000,000 right to left. Bottom: the caret types the answer
     onto a new tape, left to right, token by token: 200 · 000 · 0 (tiktoken). The carries race one cream arrow from the
     ones column to the millions, arriving on "there", long after 200 was written. WRITTEN FIRST lands on 200 in the silence after
     "guess." and the whole frame holds still (the screenshot frame) until the NEWER chip.
     ===================================================================================================== */
  var GB = { x0: 110, x1: 636, y0: 556, y1: 968, rot: -.008 };
  var COLX = [572, 516, 460, 382, 326, 270, 192], COMX = [421, 231];   /* ones … millions; commas */
  var ROW = { carry: 618, top: 714, plus: 806, rule: 850, ans: 916 };
  var AT = { y: 1036, h: 240, px: 114, P: 74, pad: 19, xs: [170, 470, 770] }; AT.cy = AT.y + 66;
  var TOK = [['2', '0', '0'], ['0', '0', '0'], ['0']];
  /* six hops from "carry" to just after "there": the carry reaches the millions column after 200 is already written */
  var HD = (K.there + .15 - (K.carryW + .02)) / 5.85, HDUR = HD * .85;
  function hopT(k) { return K.carryW + .02 + k * HD; }
  var LAND = function () { return hopT(5) + HDUR; };
  /* where the travelling carry is (x), continuous from the ones column to the millions */
  function carryX(t) { var hk = clamp((t - hopT(0)) / HD, 0, 6), hi = Math.min(5, Math.floor(hk)), hf = eio(clamp((hk - hi) / .85, 0, 1)); return lerp(COLX[hi] + (hi ? 0 : 10), COLX[hi + 1], hf); }
  function boardScene(g, t) {
    var t0 = S('board').t0, i, still = t >= GT.slam + .2;
    /* the graph card and the sum */
    g.save(); g.translate((GB.x0 + GB.x1) / 2, (GB.y0 + GB.y1) / 2); g.rotate(GB.rot); g.translate(-(GB.x0 + GB.x1) / 2, -(GB.y0 + GB.y1) / 2);
    graphPaper(g, GB.x0, GB.y0, GB.x1, GB.y1, 37, 41, 'sum');
    ONPROP = true; g.fillStyle = PENCIL; g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, 84, 600, MONO);
    '1999999'.split('').forEach(function (c, k) { g.fillText(c, COLX[6 - k], ROW.top); });
    g.fillText('1', COLX[0], ROW.plus); g.fillText('+', 150, ROW.plus);
    ONPROP = false;
    g.strokeStyle = PENCIL; g.lineWidth = 6; g.lineCap = 'round';
    COMX.forEach(function (x) { g.beginPath(); g.moveTo(x + 2, ROW.top + 26); g.quadraticCurveTo(x + 4, ROW.top + 42, x - 6, ROW.top + 54); g.stroke(); });
    g.beginPath(); g.moveTo(132, ROW.rule); g.lineTo(612, ROW.rule); g.stroke();
    /* carries: hop k lifts a 1 from above column k (k = 0: the ones' own 9 + 1) to above column k+1 */
    font(g, 62, 700, MONO);
    for (i = 0; i < 6; i++) {
      var h0 = hopT(i); if (t < h0) break;
      var k = eio(seg(t, h0, h0 + HDUR)), x = lerp(COLX[i] + (i ? 0 : 10), COLX[i + 1], k), y = ROW.carry - 2 - Math.sin(Math.PI * k) * 46;
      ONPROP = true; g.fillStyle = PENCIL; g.fillText('1', x, y); ONPROP = false;
      if (i < 5 && t >= hopT(i + 1)) { /* the 1 above column i+1 stays: drawn by the next hop's start position */ }
    }
    /* the answer, right to left: a 0 under each column as its carry leaves, the 2 under the millions last */
    font(g, 84, 600, MONO); ONPROP = true; g.fillStyle = PENCIL;
    for (i = 0; i < 6; i++) if (t >= hopT(i) + .02) g.fillText('0', COLX[i], ROW.ans);
    if (t >= LAND()) g.fillText('2', COLX[6], ROW.ans);
    ONPROP = false;
    for (i = 0; i < 2; i++) if (t >= hopT(i ? 5 : 2) + .05) { var cx = COMX[i]; g.beginPath(); g.moveTo(cx + 2, ROW.ans + 26); g.quadraticCurveTo(cx + 4, ROW.ans + 42, cx - 6, ROW.ans + 54); g.stroke(); }
    g.restore();
    /* the pencil: in for the carries, then away */
    var pin = eio(seg(t, K.carry - .4, K.carryW - .02)), pout = eio(seg(t, LAND() + .04, LAND() + .38));
    if (pin > 0 && pout < 1) {
      var tx = t < hopT(0) ? COLX[0] + 10 : carryX(t), ty = ROW.carry + 20;
      if (t >= LAND()) tx = COLX[6] + 30;
      tx = lerp(1000, tx, pin); ty = lerp(900, ty, pin);
      tx = lerp(tx, 1120, pout); ty = lerp(ty, 400, pout);
      pencil(g, tx + 80, ty - 210, tx, ty);
    }
    /* the race: one cream arrow above the sum, its tip on the travelling carry, ones → millions; YOU CARRY at its tail */
    var ya = fin(t, K.carryW + .04), ax0 = 640, tip = t < hopT(0) ? ax0 : Math.min(ax0, carryX(t) - 10);
    txt(g, 'YOU CARRY', 805, 528, 36, CREAM, 'center', 900, DISP, 250, ya);
    if (ax0 - tip > 34) arrow(g, ax0, tip, 528, ya, 8);
    txt(g, 'OUR', 790, 860, 34, CREAM, 'center', 700, MONO, 250, 1, 30);
    txt(g, 'ILLUSTRATION', 790, 902, 34, CREAM, 'center', 700, MONO, 250, 1, 30);
    /* IT WRITES → above the answer tape */
    txt(g, 'IT WRITES', 130, 1000, 44, CREAM, 'left', 900, DISP, 320, 1);
    arrow(g, 410, 560, 1000, 1);
    /* the answer tiles, typed by the caret */
    var TT = [at('left', 'answer'), K.piece1, K.piece2], lift = -10 * eout(seg(t, K.firstP, K.firstP + .25));
    var caretX = AT.xs[0] + AT.pad, typed = 0;
    for (var tk = 0; tk < 3; tk++) {
      var t1 = TT[tk] - .04; if (t < t1) break;
      var n = TOK[tk].length, wfull = n * AT.P + AT.pad * 2, nch = Math.min(n, Math.floor((t - t1) / .07) + 1);
      /* the first piece is typed a digit a word ("answer", "from", "left"): it is finished on "left" */
      if (tk === 0) nch = t >= K.leftW - .04 ? 3 : t >= at('left', 'from') - .04 ? 2 : 1;
      var w = Math.min(wfull, AT.pad + nch * AT.P + (nch === n ? AT.pad : 0));
      var x0 = AT.xs[tk], dy = tk === 0 ? lift : 0;
      g.save(); g.translate(0, dy);
      g.fillStyle = 'rgba(0,0,0,.36)'; g.fillRect(x0 + 9, AT.y + 13, w, AT.h);
      tapeBody(g, x0, x0 + w, AT.y, AT.h, false, false, 51 + tk, 'answer');
      typeChars(g, TOK[tk].slice(0, nch).map(function (c, j) { return { c: c, x: x0 + AT.pad + AT.P * (j + .5) }; }), AT.cy, AT.px);
      g.restore();
      caretX = x0 + AT.pad + nch * AT.P + (nch === n ? AT.pad + 22 : 6); typed = tk + 1;
    }
    if (!typed) caretX = lerp(110, AT.xs[0] + 8, eio(seg(t, t0 - .2, t0 + .3)));
    /* the caret (part 1's): blinks while it waits, solid while it types; gone before the carries */
    var busy = typed && t < (typed === 1 ? K.leftW : TT[typed - 1]) + .3, ca = 1 - seg(t, K.leftEnd + .2, K.leftEnd + .4);
    if (ca > 0) { var on = busy ? 1 : (Math.cos(t * Math.PI * 2 * 1.05) > -.2 ? 1 : .15); g.save(); g.globalAlpha *= ca * on; g.fillStyle = CREAM; rr(g, caretX - 7, AT.y + 12, 14, AT.h - 24, 7); g.fill(); g.restore(); }
    /* THE stamp, on 200's lower half (never over the digits): it was guessed, not wrong */
    stamp(g, 'WRITTEN\nFIRST', 300, AT.y + AT.h - 70 + lift, t, GT.slam, 54, HOT, -.05, 380);
    /* the credit under the tape; after the hold the NEWER chip takes its place */
    var na = newerA(t), la = 1 - na;
    if (la > 0) {
      txt(g, 'LEE ET AL., 2023 (SMALL MODELS):', CX, 1318, 36, CREAM, 'center', 700, MONO, 820, la);
      txt(g, '“…NOT OPTIMIZED FOR GENERATING THE', CX, 1362, 36, CREAM, 'center', 700, MONO, 820, la);
      txt(g, 'MOST SIGNIFICANT DIGIT (MSB) FIRST.”', CX, 1406, 36, CREAM, 'center', 700, MONO, 820, la);
    }
    newerChip(g, t);
  }
  /* the NEWER chip: one cream card under the tape after the hold, only the source's words; gone before the second wipe */
  function newerT() { return GT.slam - .36; }
  function newerA(t) { var w = S('calc').t0 - SWIPE; return fin(t, newerT(), 3.4) * (1 - seg(t, w - .12, w - .02)); }
  function newerChip(g, t) {
    var a = newerA(t); if (a <= 0) return;
    var s = pop(t, newerT(), 3.4), y0 = 1290, y1 = 1430;
    g.save(); g.globalAlpha *= a; g.translate(CX, (y0 + y1) / 2); g.scale(s, s); g.rotate(-.006); g.translate(-CX, -(y0 + y1) / 2);
    g.fillStyle = 'rgba(0,0,0,.36)'; rr(g, 112 + 7, y0 + 10, 796, y1 - y0, 14); g.fill();
    g.fillStyle = CREAM; rr(g, 112, y0, 796, y1 - y0, 14); g.fill();
    recBox(g, 112, y0, 908, y1, '[chip] NEWER');
    CHIPBOX = LBL ? xbox(g, 112, y0, 908, y1) : null;
    txt(g, 'LATER GPT-4:', CX, y0 + 32, 36, BG, 'center', 700, MONO, 760);
    txt(g, '“MITIGATED STRONGLY”', CX, y0 + 76, 46, BG, 'center', 900, DISP, 760);
    txt(g, 'SINGH & STROUSE, 2024', CX, y0 + 116, 34, BG, 'center', 700, MONO, 760, 1, 30);
    CHIPBOX = null;
    g.restore();
  }

  /* =====================================================================================================
     SCENE 3 · the calculator (fix → end). A cardboard paper calculator with a crank; the same tiles in its tray go in on
     "hand"; on "calculator" a receipt prints = 2,000,000 · RAN CODE and slides into the chat on a generic paper phone.
     On "Did" the chat scrolls: the same question, an answer, and a paper flap folds over where RAN CODE would be.
     YES / NO. Then the torn edge lands on frame 0.
     ===================================================================================================== */
  var BX = { x0: 140, x1: 500, y0: 620, y1: 990 };
  var PH = { x0: 560, x1: 922, y0: 566, y1: 1136 }, SCR = { x0: 576, x1: 906, y0: 588, y1: 1114 };
  var TRAY = (function () {
    var ts = ['199', '999', '9', '+', '1'], P = 31, pad = 8, x = 124, out = [];
    ts.forEach(function (s) { var w = s.length * P + pad * 2; out.push({ s: s, x0: x, w: w }); x += w + 9; });
    return out;
  })();
  function receipt(g, x, y, t, flap) {
    var w = 300, h = 140;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 6, y + 9, w, h);
    tapeBody(g, x, x + w, y, h, false, true, 71, 'receipt');
    ONPROP = true; g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, 40, 700, MONO); g.fillText('= 2,000,000', x + w / 2, y + 48);
    if (flap == null) { font(g, 36, 700, MONO); g.fillText('RAN CODE', x + w / 2, y + 102); }
    ONPROP = false;
    if (flap != null && flap > 0) {
      /* a paper flap folded down from the crease at y+74 over the line below it */
      var fh = 58 * flap;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 5, y + 74 + 6, w - 2, fh);
      g.fillStyle = CARD; g.fillRect(x - 4, y + 74, w + 8, fh);
      g.fillStyle = CARD_D; g.fillRect(x - 4, y + 74, w + 8, 7);
      g.fillStyle = CARD_L; poly(g, [[x + w + 4 - 34 * flap, y + 74 + fh], [x + w + 4, y + 74 + fh], [x + w + 4, y + 74 + fh - 30 * flap]]); g.fill();
      prop(g, 'flap', x - 4, y + 74, x + w + 4, y + 74 + fh);
    }
    return { w: w, h: h };
  }
  function calcScene(g, t) {
    var t0 = S('calc').t0, i;
    /* crank angle: a slow turn from the start, fast on "hand" */
    var ang = t * 1.4 + 9 * Math.max(0, Math.min(t, K.calc + .3) - K.hand);
    /* the receipt: prints out of the side slot on "calculator", then slides into the chat */
    var pr = eio(seg(t, K.calc, K.calc + .3)), mv = eio(seg(t, K.calc + .36, K.calc + .74));
    var RX = { x: BX.x1 - 300 + 280 * pr, y: 860 }, LAND = { x: 591, y: 748 };
    /* on "Did" the chat scrolls far enough that the first receipt leaves the screen completely */
    var scroll = -300 * eio(seg(t, K.end + .02, K.end + .34));
    /* tiles in the tray: each goes in on "hand" (behind the box front, so the box hides it) */
    TRAY.forEach(function (q, k) {
      var tk = K.hand + .02 + k * .15, sl = eio(seg(t, tk, tk + .08)), dn = eio(seg(t, tk + .08, tk + .18));
      if (dn >= 1) return;
      var x = lerp(q.x0, 320 - q.w / 2, sl), y = 550 + 124 * dn;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 5, y + 8, q.w, 66);
      tapeBody(g, x, x + q.w, y, 66, false, false, 81 + k, 'traytile');
      typeChars(g, q.s.split('').map(function (c, j) { return { c: c, x: x + 8 + 31 * (j + .5) }; }), y + 33, 52);
    });
    if (mv <= 0 && pr > 0) receipt(g, RX.x, RX.y, t);
    /* the box */
    var r = mulberry(91);
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(BX.x0 + 10, BX.y0 + 14, BX.x1 - BX.x0, BX.y1 - BX.y0);
    g.fillStyle = CARD; cut(g, [[BX.x0, BX.y0], [BX.x1, BX.y0], [BX.x1, BX.y1], [BX.x0, BX.y1]], r, 2.5);
    g.fillStyle = CARD_L; g.fillRect(BX.x0, BX.y0, BX.x1 - BX.x0, 14);
    g.fillStyle = '#2b2420'; rr(g, 255, BX.y0 + 3, 130, 9, 4); g.fill();
    g.fillStyle = 'rgba(240,226,190,.5)'; g.fillRect(166, BX.y0 + 40, 22, BX.y1 - BX.y0 - 80);      /* packing tape */
    g.fillStyle = '#3a3340'; rr(g, 206, 668, 264, 92, 10); g.fill();                                  /* the window */
    g.fillStyle = 'rgba(244,237,224,.12)'; rr(g, 216, 678, 244, 30, 6); g.fill();
    for (i = 0; i < 12; i++) { var kx = 220 + (i % 4) * 64, ky = 790 + Math.floor(i / 4) * 58; g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, kx + 3, ky + 5, 48, 42, 8); g.fill(); g.fillStyle = i === 11 ? '#e8dcc0' : CARD_L; rr(g, kx, ky, 48, 42, 8); g.fill(); }
    g.fillStyle = '#2b2420'; g.fillRect(BX.x1 - 8, RX.y - 6, 10, 148);                                /* the receipt slot */
    prop(g, 'calculator', BX.x0, BX.y0, BX.x1 + 10, BX.y1 + 14);
    /* the crank on the side */
    g.save(); g.translate(BX.x0 - 14, 720);
    g.fillStyle = '#4a4352'; el(g, 0, 0, 16, 16);
    g.rotate(-ang); g.fillStyle = '#3b3644'; rr(g, -8, -8, 66, 16, 8); g.fill();
    g.fillStyle = WOOD; el(g, 58, 0, 14, 14); g.fillStyle = WOOD_L; el(g, 55, -3, 6, 6);
    g.restore();
    prop(g, 'crank', BX.x0 - 90, 640, BX.x0, 800);
    /* the phone: generic, paper, a round punch-hole camera, no logo */
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, PH.x0 + 10, PH.y0 + 14, PH.x1 - PH.x0, PH.y1 - PH.y0, 48); g.fill();
    g.fillStyle = PHONE; rr(g, PH.x0, PH.y0, PH.x1 - PH.x0, PH.y1 - PH.y0, 48); g.fill();
    g.fillStyle = SCREEN; rr(g, SCR.x0, SCR.y0, SCR.x1 - SCR.x0, SCR.y1 - SCR.y0, 34); g.fill();
    prop(g, 'phone', PH.x0, PH.y0, PH.x1 + 10, PH.y1 + 14);
    /* the punch-hole camera sits in a status strip above the chat; chat content is clipped below it, never under it */
    g.fillStyle = '#121016'; el(g, (PH.x0 + PH.x1) / 2, SCR.y0 + 22, 10, 10);
    g.save(); g.beginPath(); g.rect(SCR.x0, SCR.y0 + 46, SCR.x1 - SCR.x0, SCR.y1 - SCR.y0 - 46); g.clip();
    rr(g, SCR.x0, SCR.y0, SCR.x1 - SCR.x0, SCR.y1 - SCR.y0, 34); g.clip();
    g.translate(0, scroll);
    function ask(y) {
      g.fillStyle = BUB; rr(g, 590, y, 302, 78, 24); g.fill();
      ONPROP = true; txt(g, '1999999 + 1?', 741, y + 40, 40, CREAM, 'center', 700, MONO, 284, 1, 34); ONPROP = false;
    }
    ask(640);
    if (mv > 0) receipt(g, lerp(RX.x, LAND.x, mv), lerp(RX.y, LAND.y, mv) - scroll * (1 - mv), t);
    /* "Ask how it added": the viewer's question, then the chatbot's answer, struck through on "didn't" (re-created) */
    var qa = clamp(pop(t, K.lie + .02, 3.6), 0, 1.04);
    if (qa > 0) {
      g.save(); g.translate(800, 940); g.scale(qa, qa); g.translate(-800, -940);
      g.fillStyle = BUB; rr(g, 664, 906, 228, 68, 22); g.fill();
      ONPROP = true; txt(g, 'How did you add?', 778, 941, 34, CREAM, 'center', 700, DISP, 208, 1, 26); ONPROP = false;
      g.restore();
    }
    var ba = clamp(pop(t, K.say - .04, 3.6), 0, 1.04);
    if (ba > 0) {
      g.save(); g.translate(700, 1030); g.scale(ba, ba); g.translate(-700, -1030);
      g.fillStyle = BUB; rr(g, 590, 990, 262, 80, 24); g.fill();
      ONPROP = true; txt(g, 'I carried the 1', 721, 1031, 40, CREAM, 'center', 800, DISP, 240, 1, 30); ONPROP = false;
      g.restore();
      var sk = eio(seg(t, K.didnt - .02, K.didnt + .22));
      if (sk > 0) { g.save(); g.strokeStyle = CREAM; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(606, 1033); g.lineTo(lerp(606, 836, sk), 1029); g.stroke(); g.restore(); }
    }
    if (t >= K.end) {
      ask(1100);
      var ra = clamp(pop(t, K.calcQ - .1, 3.6), 0, 1.04);
      if (ra > 0) { g.save(); g.translate(741, 1266); g.scale(ra, ra); g.translate(-741, -1266); receipt(g, LAND.x, 1196, t, eio(seg(t, K.calcQ + .1, K.calcQ + .55))); g.restore(); }
    }
    g.restore();
    /* labels: beside the machine, the source line under both */
    txt(g, 'A CALCULATOR,', 320, 1040, 42, CREAM, 'center', 900, DISP, 400);
    txt(g, 'IN CODE (PYTHON)', 320, 1088, 42, CREAM, 'center', 900, DISP, 400);
    var aa = fin(t, K.lie + .1);
    txt(g, 'CODE TOOLS: OPENAI · ANTHROPIC · GOOGLE', CX, 1192, 36, CREAM, 'center', 700, MONO, 810, 1, 30);
    txt(g, 'ANTHROPIC, 2025 (CLAUDE 3.5 HAIKU, 36+59)', CX, 1240, 36, CREAM, 'center', 700, MONO, 810, aa, 30);
    tag(g, 'RE-CREATED', 741, 1296, aa);
    /* YES / NO, coral (with the WRITTEN FIRST stamp, the only coral in the film) */
    var yk = function (w) { return 1 + .06 * Math.sin(Math.PI * seg(t, w - .06, w + .3)); };
    var ya = fin(t, K.end + .1);
    [['YES', 380, K.yes], ['NO', 640, K.no]].forEach(function (c) {
      var on = fin(t, c[2] - .08);
      chip(g, c[0], c[1], 1382, { px: 64, wt: 900, line: HOT, lw: 5, fg: HOT, w: 200, r: 40, shadow: false, a: ya * (on < 1 ? 1 : 0) });
      chip(g, c[0], c[1], 1382, { px: 64, wt: 900, bg: HOT, fg: BG, w: 200, r: 40, a: ya * on, s: yk(c[2]) });
    });
  }

  /* ---------- captions: the narrator's words, one block at a time; stressed words get a cream pill (never coral) ---------- */
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'ask') return;   /* frame 0 carries the hook; the ask line is the printed question */
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { out.push({ id: l.id, ws: cur }); cur = []; }
      });
      if (cur.length) out.push({ id: l.id, ws: cur });
    });
    /* nothing new prints over the stamped tape during the hold: the newer caption waits for the hold's end */
    return out.map(function (c) { var ws = c.ws; return { id: c.id, t0: ws[0].t0, s: c.id === 'chunks' && ws[0] === LINE.chunks.words[0] ? Math.max(ws[0].t0, K.hookOut + .04) : ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS = [['chunks', 'chunks'], ['split', 'three'], ['commas', 'commas'], ['left', 'left'], ['carry', 'right'], ['guess', 'first'],
    ['newer', 'less'], ['fix', 'calculator'], ['lie', 'didnt'], ['end', 'yes'], ['end', 'no']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  /* captions stay through a wipe: the incoming scene arrives complete, caption included */
  function wipeHide(t) {
    return 1;
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE, sc.t0 - SWIPE + .1) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, over: 1, that: 1, up: 1, own: 1, is: 1, it: 1, go: 1, does: 1, big: 1, far: 1, from: 1 };
  var CAPMIN = 1e9;
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s - .04 : 1e9;
    var keep = nx && (ns - card0.t1 < .9 || card0.id === 'guess');
    var o1 = keep ? ns : Math.min(card0.t1 + .5, ns - .12), o0 = keep ? ns : Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.s - .04, card0.s + .06), out = keep ? (t < ns ? 1 : 0) : 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - card0.s + .04, 3.2, .8), 0, 1.04);
    g.save(); g.font = '800 74px Archivo'; wide(g);
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 22;
    var lines, lw, maxw = 820, cpx = 74;
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
    var lh = cpx * 1.18, y0 = (lines.length > 1 ? 368 : 408) + 50 - (lines.length - 1) * lh / 2;   /* pill tops at y ≥ 304 */
    g.globalAlpha = fi * out * wipeHide(t) * (alpha == null ? 1 : alpha);
    NOREC = true;
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 30;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 12, y - cpx * .87, ws[i] + 24, cpx * 1.15, 18); g.fill(); CAPMIN = Math.min(CAPMIN, y - cpx * .87); }
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    NOREC = false;
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = { tape: tapeScene, board: boardScene, calc: calcScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) { g.save(); SCENES[Sc.fn](g, t); g.restore(); }
  /* the cut: a torn-paper edge rising from the bottom along one axis (cream), the next scene drawn under it */
  function edgeY(x, ly, t) { var i = Math.round(x / 30); return ly + (i % 2 ? -10 : 8) + Math.sin(x * .013 + t * 5) * 4; }
  function tornEdge(g, ly, t) { g.save(); g.strokeStyle = CREAM; g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); for (var x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t); if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore(); }
  function clipBelow(g, ly, t) { g.beginPath(); g.moveTo(0, H); for (var x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip(); }
  /* frame 0, as the loop lands on it: the first rendered frame's time */
  var T0 = 1 / 60;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    /* the torn edge is placed at the frame's own time, not per motion-blur sample: the wipe stays opaque (no ghost
       band where two scenes would blend); which scene a sample shows follows that same edge */
    var te = EDGE_T == null ? t : EDGE_T;
    si = sceneAt(te); Sc = SC[si]; Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(te, Nx.t0 - SWIPE, Nx.t0)) : 0, ly = H * (1 - sk) - 20;
    var back = eio(seg(te, GT.home, GT.home + .26)), by = H * (1 - back) - 20;
    COVER = Math.min(sk > 0 ? ly - 14 : 1e9, back > 0 ? by - 14 : 1e9);
    drawScene(g, Sc, t);
    if (si === 0 && !POSTERMODE && LIVE.text) hookText(g, t, false);
    COVER = 1e9;
    if (sk > 0) {
      g.save(); clipBelow(g, ly, te);
      stage(g); INCOMING = true; drawScene(g, Nx, t); INCOMING = false; g.restore();
      tornEdge(g, ly, te);
    }
    /* the loop: the torn edge rises right after "no" and lands on the frame-0 picture */
    if (back > 0) {
      g.save(); clipBelow(g, by, te);
      stage(g); INCOMING = true; tapeScene(g, T0); hookText(g, T0, true); INCOMING = false; g.restore();
      if (back < 1) tornEdge(g, by, te);
    }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) captions(g, t, back > 0 ? 1 - back : 1);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    var a = 'Why AI is', b = 'bad at math', px = 92;
    g.save(); font(g, px, 800); g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText(a, CX, 400);
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 500 - 80, wb + 28, 106, 16); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 500); g.restore();
  }
  /* every text that is fully readable at t (not fading, not under a torn edge, not a caption): drawn to find out */
  function TEXTS(t) {
    REC = {}; frame(tctx, t); var r = REC; REC = null;
    return Object.keys(r).map(function (k) { return { id: k, text: k, x0: 0, y0: 0, x1: 0, y1: 0 }; });
  }

  /* ---------- events: the sound design reads the same word times; hits sit between words, never on them ---------- */
  var EV = [];
  /* the SFX gate (vo/heard.js, written from the finished mix): a hit's whole body keeps 0.19 s clear of every word start
     and end that unhinted faster-whisper base.en and small.en heard in the mix (the gate is 0.15), and clear of every
     stretch where the voice-only track is at or above −40 dBFS. Without heard.js the vo.js word times stand in. */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  if (!EDGES.length) VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
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
  var BODY = { snip: .12, thump: .16 };
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || .19).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  /* Two hits (BRIEF §0 allowed three): the scissors' snip in the pause after "pieces." and THE stamp after "there.".
     No scissor sound before "Your": the first word starts 0.08 s in, too close for a hit with the gate's margin. */
  var GT = {}, GS = [];
  function G(id, t, type, tol, gain, m) {
    var n = nearGap(t, type, m);
    if (n !== null && Math.abs(n - t) <= (tol || .45)) { GT[id] = n; GS.push({ t: n, type: type, g: gain }); return true; }
    GT[id] = t; return false;
  }
  var SLAM0 = null;
  function GTslam0() { if (SLAM0 === null) { var g0 = K.guessEnd, n0 = start('newer'); SLAM0 = nearGap(Math.max(g0 + .2, (g0 + n0) / 2 - .2), 'thump', .2); if (SLAM0 === null) SLAM0 = g0 + .2; } return SLAM0; }
  function initGaps() {
    /* the snip: the middle of the planned pause after "pieces." (≥ 0.2 s clear each side); the second cut closes on it and
       the tape falls apart */
    /* placed from the voice-only envelope: it ends 0.26 s before "And" is voiced (Whisper-tested at several offsets: this one keeps both models' word edges off it) and starts well
       after "pieces." ends; the gate checks it against what Whisper hears */
    var c0 = start('commas');
    GT.snip = c0 - .30; GS.push({ t: GT.snip, type: 'snip', g: .5 });
    K.cut2 = GT.snip - .13; K.apart = GT.snip + .02;
    /* THE stamp: pinned 0.35 s before "Newer" (in the planned pause after "there."), checked by the gate */
    GT.slam = start('newer') - .35; GS.push({ t: GT.slam, type: 'thump', g: .14 });
    GT.home = K.noEnd + .03;   /* the cut to frame 0, right after "no." (the tail is DUR − "no." ≤ 0.5 s) */
  }
  function initTimes() {
    GS.forEach(function (e) { EV.push({ t: e.t, type: e.type, g: e.g, t1: e.t + BODY[e.type] }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    /* the first two frames are drawn sharp: no motion-blur ghost of the gliding scissors on frame 0 */
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
    /* THE hit: a rubber stamp slammed on paper tape on a desk. Body 250 → 180 Hz and a 330 Hz knock (where a phone speaker
       still plays), with a paper slap at 1.5–2.5 kHz on top so it reads on a phone */
    function stampThump(t, g) {
      g = g || 1;
      var o = osc('sine', 250, t, t + .16, 1, [[t, 0], [t + .004, .75 * g], [t + .15, 0]], .05); o.frequency.exponentialRampToValueAtTime(180, t + .14);
      osc('triangle', 330, t, t + .08, 1, [[t, 0], [t + .002, .55 * g], [t + .07, 0]], .03);
      band(t, .07, 1600, .9, 2.4 * g, .002, .05);
      band(t, .045, 2500, 1.1, 1.6 * g, .001, .03);
    }
    /* paper scissors: one 0.12 s snip, a soft steel tick as the blades meet, then a short dry paper shear (mid band,
       no bright click: Whisper hooks the next word onto a sharp transient in a pause) */
    function snip(t, g) {
      g = g || 1;
      band(t, .018, 2600, 2.2, .55 * g, .001, .02);
      band(t + .012, .1, 1400, .8, .5 * g, .02, .03);
      band(t + .012, .09, 3200, 1.1, .22 * g, .02, .02);
      var o = osc('triangle', 620, t, t + .03, 1, [[t, 0], [t + .002, .12 * g], [t + .025, 0]], 0); o.frequency.exponentialRampToValueAtTime(420, t + .025);
    }
    EV.forEach(function (e) {
      if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'snip') snip(e.t, e.g);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone, about −60 dB, so the loop seam is never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .0035; })();
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d'); MC = mk(8, 8).getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹✓✕–@!>$(),:'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initGaps();
  initTimes();
  /* the hero hold: from the stamp settling to the NEWER chip (1.3 s, fully still) */
  var HOLD = { t0: GT.slam + .18, t1: GT.slam + .18 + 1.3 };
  CAPS.forEach(function (c) { if (c.id === 'newer') c.s = HOLD.t1; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: (HOLD.t0 + HOLD.t1) / 2, SLUG: 'math', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, CAPMIN: function () { return CAPMIN; } };
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
