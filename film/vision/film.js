/* "Your photo? Claude shrinks it first." — Factory #20 on Tech, explained (How AI works), after ../stepbystep/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   One hand-made hero prop: a cream-bordered paper photo print of a kitchen table (a paper receipt, a mug, a pen), drawn
   here, no brands. The native move is the grid knife: a paper ruler with teeth that slides across the print and leaves the
   square grid behind it (Claude's 28-pixel patches). One hero stamp: 4,740 SQUARES (coral); coral is also on the end
   card's YES / NO and nowhere else. Every scene is clipped to the safe box x 90–930, y 300–1430. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', INK = '#211d26', PENCIL = '#3c3946';
  var CARD = '#c8a273', CARD_D = '#a7814f', CARD_L = '#d9b88b';
  var TAPE = '#f4eddc', TAPE_D = '#ddd2ba', GRAPH = '#8f897f';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var SAFE_BOX = { x0: 92, y0: 302, x1: 928, y1: 1428 };

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
    claude: at('hook', 'claude'), shrinks: at('hook', 'shrinks'), hookEnd: lend('hook'),
    send: start('send'), n12: at('send', '12'),
    cuts: at('third', 'cuts'), under: at('third', 'under'), thirdW: at('third', 'third'), thirdEnd: lend('third'),
    ask: start('ask'), throwW: at('ask', 'throw'), away: at('ask', 'away'),
    because: start('squares'), works: at('squares', 'works'), sq: at('squares', 'squares'), notW: at('squares', 'not'), sqEnd: lend('squares'),
    third0: start('third'), tokEnd: lend('token'),
    each: start('token'), px28: at('token', '28pixel'), square: at('token', 'square'), one: at('token', 'one'), tok: at('token', 'token'),
    counted: start('counted'), like: at('counted', 'like'), words: at('counted', 'words'), type: at('counted', 'type'),
    andW: start('cap'), every: at('cap', 'every'), photo: at('cap', 'photo'), cap: at('cap', 'cap'), capEnd: lend('cap'),
    hero: start('hero'), newer: at('hero', 'newer'), n4700: at('hero', '4700'), heroEnd: lend('hero'),
    blur: start('blur'), hard: at('blur', 'hard'), read: at('blur', 'read'),
    tip: start('tip'), get: at('tip', 'get'), closer: at('tip', 'closer'), tipEnd: lend('tip'),
    end: start('end'), yes: at('end', 'yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  /* the hits are placed from the heard words before anything is timed off them (see the SFX gate below) */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  /* lines the last gate pass never heard (a re-layout moved them) fall back to their vo.js word times */
  var lastE = EDGES.length ? Math.max.apply(null, EDGES) : -1;
  VO.lines.forEach(function (l) { if (l.t0 > lastE + .3) l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 + .15 }); EDGES.push(w.t0, w.t1 + .15); }); });
  /* where the hero line's voice really stops (its last word rings past the vo.js end) */
  var heroV = K.heroEnd; VOICED.forEach(function (v) { if (v.t0 < K.heroEnd + .3 && v.t1 > heroV && v.t1 < K.blur) heroV = v.t1; });
  var BODY = { thump: .16, knock: .15, slide: .2, snick: .09, pop: .06 };
  var GT = {}, GS = [];
  function place(name, type, want, m) { var s = nearGap(want, type, m); GT[name] = s === null ? want : s; }
  (function () {
    place('slide', 'slide', K.thirdEnd + .3, .2);
    place('snick', 'snick', K.sqEnd + .28, .2);
    /* the knife leaving the AFTER crop, in the gap after "read." (kept only if it lands inside that gap) */
    place('snick2', 'snick', K.read + .32, .16); if (GT.snick2 < K.read + .1 || GT.snick2 > K.tip - .1) GT.snick2 = null;
    place('knock', 'knock', K.capEnd + .25, .2);
    place('slam', 'thump', Math.max(K.heroEnd + .3, heroV + .18), .2);
  })();
  /* the hero hold runs in the silence after "squares." and ends with a torn edge falling top to bottom (0.5 s, even
     speed) that starts on "So" (its audible onset); the next caption waits until the edge is below the stamp. */
  K.shrinkT = .6;   /* the shrink starts on "photo?", well before "shrinks" */
  K.tearA = K.blur + .12;
  K.capA = K.tearA + 1.05;
  /* the end card: the receipt desk leaves right after "first.", frame 0's print is in place before the chips pop */
  K.outro = K.tipEnd + .78;
  K.chips = K.outro + .42;

  var SC = [
    { id: 'desk', fn: 'desk', name: 'Your photo', t0: 0 },
    { id: 'receipt', fn: 'receipt', name: 'Small text', t0: K.tearA + 1.42, swipe: true, sw: 1.42, two: true },
    { id: 'outro', fn: 'outro', name: 'Yes or no', t0: K.outro }
  ];
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
    var tw0 = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw0 + pad * 2 > o.maxw && px > 36) { px -= 2; font(g, px, o.wt, o.fam); if (o.wd) wide(g); tw0 = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw0 + pad * 2, h = o.h || px * 1.28;
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
  /* quiet tags (RE-CREATED, OUR ILLUSTRATION): cream outline, never coral */
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
      if (al >= 1) c.lines.forEach(function (s2, i) { var ly = (i - (c.lines.length - 1) / 2) * c.px * 1.02; seen(g, s2, xbox(g, -c.w / 2, ly - c.px * .55, c.w / 2, ly + c.px * .55)); });
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
  function sheet(g, x0, y0, x1, y1, seed, col, amp, name) {
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x0 + 8, y0 + 11, x1 - x0, y1 - y0);
    g.fillStyle = col || PAPER; cut(g, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], mulberry(seed), amp == null ? 1.3 : amp);
    grainIn(g, x0, y0, x1 - x0, y1 - y0, seed + 1);
    prop(g, name || 'sheet', x0, y0, x1 + 8, y1 + 11);
  }

  /* ---------- the receipt face (receipt units: 560 × 680; drawn into offscreen canvases only) ---------- */
  var TINY = 2.5;   /* the receipt's smallest line: 7 px type, about 5 px cap height in the 4032 × 3024 photo (2.7 px after the resize) */
  var FINE = 4;   /* the fine print's size in receipt units (item lines are 24): 11.3 px type, about 8 px cap height in the 4032 × 3024 photo */
  var ITEMS = [['OAT MILK', '4.29'], ['BREAD', '3.99'], ['APPLES', '5.12'], ['COFFEE', '8.49'], ['EGGS', '1.59']];   /* = $23.48 */
  function receiptFace(g, s, marks) {
    g.save(); g.scale(s, s);
    /* marks: the print's photo shows the receipt's print as ink marks, not words (frame 0 carries ≤ 4 words) */
    var T = function (str, x, y) {
      if (!marks) { g.fillText(str, x, y); return; }
      var w = g.measureText(str).width, h = parseFloat(g.font.split('px')[0].split(' ').pop()) || 20, al = g.textAlign;
      var x0 = al === 'left' ? x : al === 'right' ? x - w : x - w / 2;
      g.save(); g.globalAlpha *= .75; rr(g, x0, y - h * .32, w, h * .6, h * .2); g.fill(); g.restore();
    };
    var r = mulberry(5), P = [], i, x;
    for (i = 0; i <= 28; i++) P.push([i * 20, i % 2 ? 7 : 0]);
    for (i = 28; i >= 0; i--) P.push([i * 20, 680 - (i % 2 ? 7 : 0)]);
    g.fillStyle = '#f7f2e7'; poly(g, P); g.fill();
    var sh = g.createLinearGradient(0, 0, 560, 0); sh.addColorStop(0, 'rgba(0,0,0,.05)'); sh.addColorStop(.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.07)'); g.fillStyle = sh; poly(g, P); g.fill();
    var INKR = '#37323d';
    g.fillStyle = INKR; g.textBaseline = 'middle';
    g.textAlign = 'center'; font(g, 46, 800); T('GROCERY', 280, 72);
    font(g, 20, 700, MONO); T('STORE 0412 · 11/03/26 08:42', 280, 114);
    function dash(y) { g.save(); g.strokeStyle = 'rgba(55,50,61,.7)'; g.lineWidth = 2.5; g.setLineDash([9, 7]); g.beginPath(); g.moveTo(30, y); g.lineTo(530, y); g.stroke(); g.restore(); }
    dash(142);
    font(g, 24, 600, MONO);
    ITEMS.forEach(function (it, j) { var y = 184 + j * 40; g.textAlign = 'left'; T(it[0], 36, y); g.textAlign = 'right'; T(it[1], 524, y); });
    /* the item's fine print, the kind every receipt has under a line */
    font(g, FINE, 600, MONO); g.textAlign = 'left'; T('2 @ 2.145  ORGANIC 1L  #40412', 38, 201);
    font(g, TINY, 600, MONO); T('LOT 2611 · BEST BY 12/14 · KEEP COLD', 38, 208);
    dash(380);
    font(g, 50, 900); g.textAlign = 'left'; T('TOTAL', 36, 428); g.textAlign = 'right'; T('$23.48', 524, 428);
    dash(472);
    g.textAlign = 'center'; font(g, 22, 700, MONO); T('THANK YOU', 280, 510);
    for (x = 120; x < 440;) { var bw = 2 + Math.floor(r() * 4) * 2; g.fillRect(x, 546, bw, 70); x += bw + 3 + Math.floor(r() * 3) * 2; }
    g.restore();
  }

  /* ---------- the photo on the print: a kitchen table seen from above (photo units 1432 × 1072 = 2× the print's image) ---------- */
  var PHW = 1432, PHH = 1072, PHOTO = null;
  function paintPhoto() { var c = mk(PHW, PHH); paintScene(c.getContext('2d'), true); return c; }
  function paintScene(g, marks) {
    var r = mulberry(11), i, x;
    var PL = ['#a8743f', '#9a6538', '#a36d3c', '#966236', '#a2703f', '#9c6739', '#a6723f', '#986437'];
    for (i = 0; i < 8; i++) { var y0 = i * 150 - 40; g.fillStyle = PL[i]; g.fillRect(0, y0, PHW, 150); g.fillStyle = 'rgba(60,35,15,.55)'; g.fillRect(0, y0 + 147, PHW, 4); }
    g.strokeStyle = 'rgba(70,40,18,.22)'; g.lineWidth = 2;
    for (i = 0; i < 80; i++) { var yy = r() * PHH, x0 = r() * PHW - 200, L = 300 + r() * 500; g.beginPath(); g.moveTo(x0, yy); for (x = x0; x < x0 + L; x += 30) g.lineTo(x, yy + Math.sin(x * .015 + i) * 3); g.stroke(); }
    /* window light from the top left */
    var lg = g.createRadialGradient(240, 100, 40, 240, 100, 1350); lg.addColorStop(0, 'rgba(255,236,200,.30)'); lg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = lg; g.fillRect(0, 0, PHW, PHH);
    /* the receipt */
    g.save(); g.translate(170, 250); g.rotate(-.075);
    g.fillStyle = 'rgba(40,20,5,.35)'; g.fillRect(14, 20, 560, 680);
    receiptFace(g, 1, marks);
    g.restore();
    /* a pen */
    g.save(); g.translate(820, 880); g.rotate(-.42);
    g.fillStyle = 'rgba(40,20,5,.35)'; rr(g, 6, 12, 470, 30, 15); g.fill();
    g.fillStyle = '#34506e'; rr(g, 0, 0, 430, 30, 15); g.fill();
    g.fillStyle = '#4a6a8c'; g.fillRect(10, 4, 400, 7);
    g.fillStyle = '#c9c2b4'; poly(g, [[430, 3], [470, 15], [430, 27]]); g.fill();
    g.fillStyle = '#2a3f58'; rr(g, 40, -8, 120, 12, 5); g.fill();
    g.restore();
    /* the mug, from above */
    var mx = 1085, my = 345;
    g.fillStyle = 'rgba(40,20,5,.35)'; el(g, mx + 22, my + 30, 178, 178);
    g.fillStyle = '#e6dfd2'; rr(g, mx + 140, my - 42, 120, 84, 40); g.fill();
    g.fillStyle = '#9c6739'; rr(g, mx + 168, my - 18, 66, 36, 18); g.fill();
    g.fillStyle = '#ebe5d9'; el(g, mx, my, 172, 172);
    g.fillStyle = '#d5cdbe'; el(g, mx, my, 150, 150);
    g.fillStyle = '#4b2e1b'; el(g, mx, my, 138, 138);
    g.fillStyle = '#6e4628'; el(g, mx, my, 138, 138); g.fillStyle = '#4b2e1b'; el(g, mx + 6, my + 6, 124, 124);
    g.fillStyle = 'rgba(255,255,255,.22)'; el(g, mx - 52, my - 60, 46, 20, -.6);
    /* a few crumbs */
    g.fillStyle = '#e2c48f'; for (i = 0; i < 9; i++) el(g, 860 + r() * 200, 560 + r() * 160, 4 + r() * 6, 3 + r() * 5, r() * 3);
    /* a soft vignette, like a phone photo */
    var vg = g.createRadialGradient(PHW / 2, PHH / 2, 300, PHW / 2, PHH / 2, 980); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = vg; g.fillRect(0, 0, PHW, PHH);
  }
  /* the print: a cream-bordered paper photo print. Full size 760 × 580 (border 22): image 716 × 536 (4:3 like 4032 × 3024).
     Pre-rendered once (paper grain on the border, a sheen for the slight curl), drawn with a soft real shadow.
     grid = how far the grid knife has cut (0…1, left to right): 79 × 60 squares, the shrunk photo's 4,740 */
  var PW = 760, PH = 580, PB = 22, IW = 716, IH = 536, COLS = 79, ROWS = 60, FCOLS = 144, FROWS = 108;
  var LIFT = [36, 37, 38, 39, 40, 41].map(function (c) { return [c, 30]; }), TOKC = [55, 14];
  var HTILES = [], PRINT = null, HROW = [55, 56, 57, 58, 59, 60], HROWY = 19;   /* the hero's lifted row: six squares across the mug */
  function paintPrint() {
    var k = 2, c = mk(PW * k, PH * k), g = c.getContext('2d');
    g.scale(k, k); g.translate(PW / 2, PH / 2);
    g.fillStyle = PAPER; cut(g, [[-PW / 2, -PH / 2], [PW / 2, -PH / 2], [PW / 2, PH / 2], [-PW / 2, PH / 2]], mulberry(21), 3.2);   /* a slightly deckled edge */
    g.beginPath(); g.rect(-PW / 2, -PH / 2, PW, PH); grainIn(g, -PW / 2, -PH / 2, PW, PH, 77);
    g.drawImage(PHOTO, -IW / 2, -IH / 2, IW, IH);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-IW / 2, -IH / 2, IW, 3);
    /* photo-paper sheen: light from the top left, the lifted bottom-right corner a touch darker */
    var sh = g.createLinearGradient(-PW / 2, -PH / 2, PW / 2, PH / 2);
    sh.addColorStop(0, 'rgba(255,250,235,.13)'); sh.addColorStop(.42, 'rgba(255,250,235,0)'); sh.addColorStop(.78, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.18)');
    g.fillStyle = sh; g.fillRect(-PW / 2, -PH / 2, PW, PH);
    var cg = g.createRadialGradient(PW / 2, PH / 2, 0, PW / 2, PH / 2, 150); cg.addColorStop(0, 'rgba(255,250,235,.16)'); cg.addColorStop(1, 'rgba(255,250,235,0)');
    g.fillStyle = cg; g.fillRect(PW / 2 - 150, PH / 2 - 150, 150, 150);
    return c;
  }
  function cellBox(c, r) { return { x: -IW / 2 + IW * c / COLS, y: -IH / 2 + IH * r / ROWS, w: IW / COLS, h: IH / ROWS }; }
  function gridLines(g, x0, y0, w, h, cols, rows, lw, col) {
    g.fillStyle = col;
    for (var c = 0; c <= cols; c++) g.fillRect(x0 + w * c / cols - lw / 2, y0, lw, h);
    for (var r = 0; r <= rows; r++) g.fillRect(x0, y0 + h * r / rows - lw / 2, w, lw);
  }
  function printAt(g, st, o) {
    o = o || {};
    g.save(); g.translate(st.cx, st.cy); if (st.rot) g.rotate(st.rot); g.scale(st.s, st.s);
    /* a real, soft shadow: the print lifts off the desk a little, more at the curled corner */
    g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 8 + 22 * st.s; g.shadowOffsetX = 3 + 7 * st.s; g.shadowOffsetY = 5 + 12 * st.s;
    g.fillStyle = '#17151c'; poly(g, [[-PW / 2 + 3, -PH / 2 + 3], [PW / 2 - 3, -PH / 2 + 3], [PW / 2 + 4, PH / 2 + 5], [-PW / 2 + 3, PH / 2 - 3]]); g.fill(); g.restore();
    g.drawImage(PRINT, -PW / 2, -PH / 2, PW, PH);
    prop(g, 'print', -PW / 2, -PH / 2, PW / 2 + 10 / st.s, PH / 2 + 17 / st.s);
    /* the grid the knife leaves: every square of the 79 × 60 (= 4,740), 2 px cream lines on screen */
    var gk = o.grid || 0;
    if (gk > 0) {
      g.save(); g.beginPath(); g.rect(-IW / 2, -IH / 2, IW * gk, IH); g.clip();
      gridLines(g, -IW / 2, -IH / 2, IW, IH, COLS, ROWS, 2 / st.s, 'rgba(244,237,224,' + (.58 * (o.gs == null ? 1 : o.gs)) + ')');
      g.restore();
    }
    /* the token square's hole while it is out */
    if (o.holes) HROW.forEach(function (c) { var hb = cellBox(c, HROWY); g.fillStyle = 'rgba(21,19,27,' + o.holes + ')'; g.fillRect(hb.x, hb.y, hb.w, hb.h); });
    if (o.out) { var tb = cellBox(TOKC[0], TOKC[1]); g.fillStyle = 'rgba(21,19,27,' + o.out + ')'; g.fillRect(tb.x, tb.y, tb.w, tb.h); }
    if (st.dim > 0) { g.fillStyle = 'rgba(21,19,27,' + st.dim + ')'; g.fillRect(-PW / 2 - 1, -PH / 2 - 1, PW + 2, PH + 2); }
    /* lifted squares: one row of six tiles stands 12 px clear of the print, fanned apart, each with its shadow */
    var lk = o.lift || 0;
    if (lk > 0) {
      var r0 = cellBox(LIFT[0][0], LIFT[0][1]), cw = r0.w, mid = r0.x + cw * 3;
      LIFT.forEach(function (p, i) {
        var k = eout(clamp(lk * 1.6 - i * .1, 0, 1)); if (k <= 0) return;
        var b = cellBox(p[0], p[1]), z = 1 + .8 * k, w = b.w * z, h = b.h * z;
        var x = lerp(b.x + b.w / 2, mid + (i - 2.5) * cw * 2.4, k) - w / 2, y = b.y + b.h / 2 - 12 * k / st.s - h / 2;
        g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x + 3 / st.s, y + 12 * k / st.s + 2 / st.s, w, h);
        g.fillStyle = 'rgba(21,19,27,.9)'; g.fillRect(b.x, b.y, b.w, b.h);
        g.drawImage(PHOTO, PHW * p[0] / COLS, PHH * p[1] / ROWS, PHW / COLS, PHH / ROWS, x, y, w, h);
        g.strokeStyle = CREAM; g.lineWidth = 1.5 / st.s; g.strokeRect(x, y, w, h);
      });
    }
    g.restore();
  }
  /* the grid knife: a paper ruler, vertical, its leading (right) edge has one tooth per square */
  function knife(g, x, y0, y1, step, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x - 40 + 8, y0 + 10, 40, y1 - y0);
    g.fillStyle = TAPE; g.fillRect(x - 40, y0, 34, y1 - y0);
    g.fillStyle = TAPE_D; g.fillRect(x - 40, y0, 6, y1 - y0);
    g.fillStyle = INK;
    for (var y = y0 + 12, i = 0; y < y1 - 6; y += step, i++) g.fillRect(x - 22 - (i % 5 === 0 ? 10 : 0), y, i % 5 === 0 ? 16 : 6, 2);
    g.fillStyle = TAPE;
    poly(g, (function () { var P = [[x - 6, y0]]; for (var yy = y0; yy < y1; yy += step) { P.push([x + 4, yy + step * .5]); P.push([x - 6, yy + step]); } P.push([x - 6, y1]); return P; })()); g.fill();
    prop(g, 'knife', x - 40, y0, x + 10, y1 + 10);
    g.restore();
  }
  /* a docs card: re-created text, never a real UI */
  function docCard(g, x0, y0, x1, y1, lines, px, src, seed, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    sheet(g, x0, y0, x1, y1, seed, PAPER, 1.4, 'card');
    ONPROP = true;
    lines.forEach(function (s, j) { txt(g, s, (x0 + x1) / 2, cardLineY(y0, px, j), px, INK, 'center', 900, DISP, x1 - x0 - 50); });
    g.fillStyle = 'rgba(33,29,38,.45)'; g.fillRect(x0 + 40, y1 - 64, x1 - x0 - 80, 3);
    txt(g, src, (x0 + x1) / 2, y1 - 34, 36, INK, 'center', 700, MONO, x1 - x0 - 50, 1, 36);
    ONPROP = false;
    g.restore();
  }
  function cardLineY(y0, px, j) { return y0 + 44 + j * px * 1.12; }
  /* a small paper tile with one typed token */
  function wordTile(g, cx, cy, w, h, word, a, rot) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(cx, cy); if (rot) g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,.36)'; rr(g, -w / 2 + 5, -h / 2 + 8, w, h, 8); g.fill();
    g.fillStyle = PAPER; rr(g, -w / 2, -h / 2, w, h, 8); g.fill();
    ONPROP = true; txt(g, word, 0, 2, 40, INK, 'center', 700, MONO, w - 14); ONPROP = false;
    prop(g, 'word', -w / 2, -h / 2, w / 2 + 5, h / 2 + 8);
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · the desk (hook → hero), one print the whole way.
     ===================================================================================================== */
  var SHR = 2212 / 4032;     /* the long edge after Claude's resize rule on the newer models (our math, BRIEF §3) */
  var REST = { cx: CX, cy: 820 }, GL = 300;
  function hookGlide(t) { return GL * (1 - eout(seg(t, .02, .95))); }
  function drift(t) {
    /* the print breathes a little between beats; it is dead still from just before the stamp to the end of the scene */
    var on = seg(t, 1.0, 1.6) * (1 - seg(t, K.heroEnd - .3, GT.slam - .05));
    return { y: 5 * Math.sin((t - 1) * 1.7) * on, r: .006 * Math.sin((t - 1) * 1.1 + .7) * on };
  }
  /* the group: the print and the dashed outline of its old (full) size move together; full = big, shrunk = small */
  function groupState(t) {
    var cy = REST.cy + hookGlide(t), k = 1, e;
    e = eio(seg(t, K.each - .05, K.each + .42)); k = lerp(k, .7, e); cy = lerp(cy, 700, e);
    /* push in 1.2 × across "Each 28-pixel square is one token", eased back for "Counted" */
    var pu = eio(seg(t, K.each + .3, K.tokEnd)) * (1 - eio(seg(t, K.counted - .1, K.counted + .4)));
    k *= 1 + .2 * pu; cy += 12 * pu;
    e = eio(seg(t, K.hero - .05, K.hero + .5)); k = lerp(k, 1, e); cy = lerp(cy, REST.cy, e);
    /* slow camera pushes so no beat freezes before the hero hold: after the shrink and on "12 million pixels" (back
       on "cuts"), and into the hero line (stopped well before the stamp) */
    var hc = (.07 * eio(seg(t, K.shrinkT + .3, K.send + .2)) + .045 * eio(seg(t, K.send + .2, K.cuts))) * (1 - eio(seg(t, K.cuts, K.cuts + .25)));
    k *= 1 + hc;
    k *= 1 + .04 * eio(seg(t, K.sq + .3, K.each)) * (1 - eio(seg(t, K.each - .05, K.each + .42)));
    k *= 1 + .03 * eio(seg(t, K.hero + .5, K.n4700 + .3));
    return { cx: REST.cx, cy: cy, k: k };
  }
  function printState(t) {
    var G = groupState(t), ps, dim = 0, e, dy = 0;
    /* shrunk once, on "shrinks", and it stays shrunk to the end of the desk */
    ps = lerp(1, SHR, eio(seg(t, K.shrinkT, K.shrinkT + .38)));
    /* the paper slide as the shrunk print settles (on the slide hit), back to centre on "Because" */
    dy = 14 * eio(seg(t, GT.slide, GT.slide + .22)) * (1 - eio(seg(t, K.because - .05, K.because + .4)));
    e = eio(seg(t, K.each - .05, K.each + .42)); dim = lerp(dim, .15, e);   /* ≥ 80 % bright while it is the token's source */
    
    e = eio(seg(t, K.hero - .05, K.hero + .5)); dim = lerp(dim, 0, e);
    var d = drift(t);
    return { cx: G.cx, cy: G.cy + (dy + d.y) * G.k, s: ps * G.k, dim: dim, rot: d.r, G: G, dy: dy };
  }
  /* the dashed outline of the print's full size, as paper dashes; the full photo's 144 × 108 squares fill it on "photo" */
  var DASHES = (function () {
    var OW = PW + 28, OH = PH + 28, out = [], per = 2 * (OW + OH), n = Math.round(per / 42);
    for (var i = 0; i < n; i++) {
      var d = (i + .5) * per / n, x, y, ang;
      if (d < OW) { x = -OW / 2 + d; y = -OH / 2; ang = 0; }
      else if (d < OW + OH) { x = OW / 2; y = -OH / 2 + d - OW; ang = Math.PI / 2; }
      else if (d < 2 * OW + OH) { x = OW / 2 - (d - OW - OH); y = OH / 2; ang = 0; }
      else { x = -OW / 2; y = OH / 2 - (d - 2 * OW - OH); ang = Math.PI / 2; }
      out.push({ x: x, y: y, ang: ang });
    }
    return out;
  })();
  /* the outline pulses from frame 0 until the shrink (and again on the last frame, so the loop matches) */
  function pulseA(tt) { return .4 + .6 * (.5 + .5 * Math.cos(2 * Math.PI * tt / .9)); }
  function dashes(g, a) {
    g.save(); g.globalAlpha *= a;
    DASHES.forEach(function (d) {
      g.save(); g.translate(d.x, d.y); g.rotate(d.ang);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-12, 0, 26, 5);
      g.fillStyle = 'rgba(244,237,224,.92)'; g.fillRect(-13, -2.5, 26, 5);
      g.restore();
    });
    g.restore();
  }
  function outline(g, t, st) {
    var G = st.G, a = lerp(pulseA(t), 1, seg(t, K.shrinkT - .1, K.shrinkT + .1));
    g.save(); g.translate(G.cx, G.cy); g.scale(G.k, G.k);
    /* cap: the full photo's squares, 144 × 108 = 15,552, wiped in left to right on "photo", gone on "newer" */
    var gw = eio(seg(t, K.photo - .1, K.photo + .45)), ga = 1 - seg(t, K.newer, K.newer + .4);
    if (gw > 0 && ga > 0) {
      g.save(); g.beginPath(); g.rect(-IW / 2, -IH / 2, IW * gw, IH); g.clip();
      gridLines(g, -IW / 2, -IH / 2, IW, IH, FCOLS, FROWS, 2 / G.k, 'rgba(244,237,224,' + (.42 * ga) + ')');
      g.restore();
    }
    /* third: the part that is cut away, hatched; on "throw" it falls off the desk */
    var hk = seg(t, K.cuts - .02, K.cuts + .3), fk = seg(t, K.throwW - .12, K.throwW + .62);
    if (hk > 0 && fk < 1) {
      var sw = PW * SHR, sh = PH * SHR, iy = st.dy;
      g.save(); g.globalAlpha *= hk * (1 - fk * fk); g.translate(30 * fk, 300 * fk * fk); g.rotate(.06 * fk);
      g.beginPath(); g.rect(-PW / 2, -PH / 2, PW, PH); g.rect(-sw / 2 - 2, iy - sh / 2 - 2, sw + 4, sh + 4); g.clip('evenodd');
      g.strokeStyle = 'rgba(244,237,224,.34)'; g.lineWidth = 3;
      g.beginPath(); for (var x = -PW / 2 - PH; x < PW / 2; x += 18) { g.moveTo(x, PH / 2); g.lineTo(x + PH, -PH / 2); } g.stroke();
      g.restore();
    }
    dashes(g, a);
    g.restore();
  }
  /* the paper mailing tag: slides onto the shrunk print's top-left corner on "Send", drawn at full size (38 px type) */
  function mailTag(g, st, t) {
    var a = fin(t, K.send - .02) * (1 - seg(t, K.because - .1, K.because + .15));
    if (a <= 0) return;
    var sl = eout(seg(t, K.send - .02, K.send + .4)), t1 = t - K.send - .4;
    var sw = (t1 > 0 ? .16 * Math.exp(-2.2 * t1) * Math.sin(t1 * 8) : 0) - .1;
    var x0 = st.cx - PW * st.s / 2 + 24, y0 = st.cy - PH * st.s / 2 + 22;
    g.save(); g.translate(x0 - 120 * (1 - sl), y0); g.rotate(sw); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.35)'; poly(g, [[6, 8], [256, 8], [286, 46], [256, 84], [6, 84]]); g.fill();
    g.fillStyle = CARD_L; poly(g, [[0, 0], [250, 0], [280, 38], [250, 76], [0, 76]]); g.fill();
    g.fillStyle = BG; el(g, 258, 38, 8, 8);
    ONPROP = true; txt(g, 'TO CLAUDE', 122, 40, 38, INK, 'center', 900, DISP, 220, 1, 36); ONPROP = false;
    prop(g, 'tag', 0, 0, 286, 84);
    g.restore();
  }
  /* the tally tape (counted) and the gauge (cap → hero) */
  var TAPEY = 1160, CELLW = 790 / 6, CELLX0 = 115;
  function cellX(i) { return CELLX0 + CELLW * (i + .5); }
  var WORDS = ['HOW', 'MUCH', 'IS', 'THIS', '?'];
  var GA = { x0: 150, x1: 850, y: 1308, h: 36 };
  function gaugeX(v) { return GA.x0 + (GA.x1 - GA.x0) * clamp(v / 4784, 0, 1); }

  function deskScene(g, t) {
    var st = printState(t);
    /* the full size's outline moves with the group (never with the drift) */
    outline(g, t, st);
    var outK = seg(t, K.px28 - .1, K.px28) * (1 - seg(t, K.hero, K.hero + .3));
    var gridK = clamp((t - (K.sq - .3)) / .62, 0, 1);
    var liftK = eio(seg(t, GT.snick, GT.snick + .3)) * (1 - seg(t, K.each - .1, K.each + .2));
    var hk = eio(seg(t, K.n4700 + .25, GT.slam - .22));
    printAt(g, st, { grid: gridK, lift: liftK, out: outK, holes: hk > 0 ? .92 : 0 });
    mailTag(g, st, t);
    /* the knife: crosses the print's image left to right on "squares" */
    var kx0 = st.cx - IW * st.s / 2, kx1 = st.cx + IW * st.s / 2, kk = (t - (K.sq - .3)) / .62;
    if (kk > -.25 && kk < 1.3) {
      var ka = seg(kk, -.25, 0) * (1 - seg(kk, 1.1, 1.3)), kx = lerp(kx0 - 10, kx1 + 46, clamp(kk, 0, 1.1));
      knife(g, kx, st.cy - IH * st.s / 2 - 22, st.cy + IH * st.s / 2 + 22, IH * st.s / ROWS * 2, ka);
    }

    /* frame 0's photo label and the send labels: under the outline */
    var y0 = REST.cy + hookGlide(t) + PH / 2;
    var la = fin(t, .42) * (1 - seg(t, K.thirdW - .14, K.thirdW - .02));
    txt(g, '4032 × 3024', CX, y0 + 62, 64, CREAM, 'center', 900, DISP, 820, la);
    txt(g, '= 12,192,768 PIXELS', CX, y0 + 128, 46, CREAM, 'center', 800, DISP, 820, fin(t, .5) * (1 - seg(t, K.thirdW - .14, K.thirdW - .02)));
    /* the hook's words on screen by 1.5 s: a cream pill above the shrunk print, inside the outline */
    var pill = .82, pa0 = fin(t, pill) * (1 - seg(t, K.third0 - .15, K.third0 - .05)), pp = Math.min(1, pop(t, pill, 3.2));
    if (pa0 > 0) chip(g, 'CLAUDE SHRINKS IT FIRST', CX, 466 + 24 * (1 - eout(seg(t, pill, pill + .3))), { px: 56, wt: 900, bg: CREAM, fg: BG, a: pa0, s: .9 + .1 * pp, maxw: 830 });
    /* third: what is left (on "third"), then its scope */
    var ta = fin(t, K.thirdW - .04) * (1 - seg(t, K.because - .05, K.because + .12));
    txt(g, 'UNDER 1/3 OF THE', CX, 1172, 58, CREAM, 'center', 900, DISP, 820, ta);
    txt(g, 'PIXELS LEFT', CX, 1236, 58, CREAM, 'center', 900, DISP, 820, ta);
    var sa = fin(t, K.cuts + .25) * (1 - seg(t, K.because - .05, K.because + .12));
    txt(g, '12 MP PHOTO (4032 × 3024)', CX, 1306, 38, CREAM, 'center', 700, MONO, 820, sa);
    txt(g, 'ANY CLAUDE MODEL', CX, 1350, 38, CREAM, 'center', 700, MONO, 820, sa);
    txt(g, 'OUR MATH, CLAUDE’S RESIZE RULE', CX, 1394, 38, CREAM, 'center', 700, MONO, 820, sa);

    /* the docs card, cut to one line (the docs: a 28×28-pixel block is a visual token), up on "Because", gone on "Counted" */
    var cu = eout(seg(t, K.because + .02, K.because + .45)), co = eio(seg(t, K.counted - .12, K.counted + .25));
    if (cu > 0 && co < 1) {
      g.save(); g.globalAlpha *= 1 - co; g.translate(0, 60 * (1 - cu) + 30 * co);
      docCard(g, 110, 1130, 910, 1262, ['28×28-PIXEL BLOCK = VISUAL TOKEN'], 42, 'CLAUDE VISION DOCS · RE-CREATED', 41, clamp(cu * 3, 0, 1));
      /* the pencil mark: "visual token" on "token" */
      g.save(); g.strokeStyle = PENCIL; g.lineWidth = 5; g.lineCap = 'round';
      var u2 = eio(seg(t, K.tok - .05, K.tok + .3)), l2 = tw('28×28-PIXEL BLOCK = VISUAL TOKEN', 42, 900), w2 = tw('VISUAL TOKEN', 42, 900), x2 = CX + l2 / 2 - w2;
      var y2u = cardLineY(1130, 42, 0) + 24; if (u2 > 0) { g.beginPath(); g.moveTo(x2, y2u); g.lineTo(x2 + w2 * u2, y2u + 1); g.stroke(); }
      g.restore();
      g.restore();
    }

    var pa = fin(t, K.px28 + .25) * (1 - seg(t, K.counted - .1, K.counted + .1));
    txt(g, '28 × 28', 768, 1012, 54, CREAM, 'center', 900, DISP, 300, pa);
    txt(g, 'PIXELS', 768, 1068, 44, CREAM, 'center', 900, DISP, 300, pa);

    /* squares → tokens: the pointer under "not pixels", sitting on the outline's top margin */
    var sq = fin(t, K.sq + .2) * (1 - seg(t, K.counted - .1, K.counted + .1));
    if (sq > 0) {
      var Gs = st.G, ys = Gs.cy - (PH / 2 - 52) * Gs.k, wsq = tw('SQUARES COST TOKENS', 40, 900);
      txt(g, 'SQUARES COST TOKENS', CX - 22, ys, 40, CREAM, 'center', 900, DISP, 700, sq);
      var ax = CX - 22 + wsq / 2 + 26, ay = ys - 14 + 5 * Math.sin(t * 6);
      g.save(); g.globalAlpha *= sq; g.fillStyle = CREAM; g.fillRect(ax - 3, ay, 6, 20); poly(g, [[ax - 12, ay + 18], [ax + 12, ay + 18], [ax, ay + 32]]); g.fill(); g.restore();
    }

    /* counted: the tally tape slides in from the left; the typed question is cut into tokens that drop into its cells */
    var tin = eout(seg(t, K.counted - .05, K.counted + .4)), tout = seg(t, K.hero - .05, K.hero + .3);
    if (tin > 0 && tout < 1) {
      g.save(); g.globalAlpha *= 1 - tout; g.translate(-820 * (1 - tin), 0);
      sheet(g, CELLX0, TAPEY - 55, CELLX0 + 790, TAPEY + 55, 51, TAPE, 1.2, 'tape');
      g.fillStyle = 'rgba(33,29,38,.35)'; for (var i = 1; i < 6; i++) g.fillRect(CELLX0 + CELLW * i - 1.5, TAPEY - 46, 3, 92);
      g.restore();
    }
    /* token: one square lifts out of the print, grows and flips: its 28 × 28 pixels, then 1 TOKEN */
    var tb = cellBox(TOKC[0], TOKC[1]);
    var fly = eio(seg(t, K.px28 - .05, K.px28 + .5));
    if (fly > 0 && t < K.hero + .4) {
      var sx = st.cx + (tb.x + tb.w / 2) * st.s, sy = st.cy + (tb.y + tb.h / 2) * st.s, ss = tb.w * st.s;
      var A = { x: 510, y: 1040, s: 170 }, B = { x: cellX(0), y: TAPEY, s: 96 };
      var dk = eio(seg(t, K.counted - .02, K.counted + .42));
      var px = lerp(lerp(sx, A.x, fly), B.x, dk), py = lerp(lerp(sy, A.y, fly), B.y, dk) - 120 * Math.sin(Math.PI * fly) * (1 - dk), sz = lerp(lerp(ss, A.s, fly), B.s, dk);
      var fl = seg(t, K.one - .12, K.one + .2), sxk = Math.abs(Math.cos(Math.PI * fl)), back = fl > .5;
      var ta2 = 1 - seg(t, K.hero - .02, K.hero + .3);
      g.save(); g.globalAlpha *= ta2; g.translate(px, py); g.scale(Math.max(sxk, .04), 1);
      g.fillStyle = 'rgba(0,0,0,.42)'; g.fillRect(-sz / 2 + 7, -sz / 2 + 10, sz, sz);
      if (!back) {
        var sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(TILE28, -sz / 2, -sz / 2, sz, sz); g.imageSmoothingEnabled = sm;
        g.strokeStyle = 'rgba(255,248,230,.9)'; g.lineWidth = 3; g.strokeRect(-sz / 2, -sz / 2, sz, sz);
      } else {
        g.fillStyle = PAPER; g.fillRect(-sz / 2, -sz / 2, sz, sz);
        ONPROP = true; var k2 = sz / 170;
        txt(g, '1', 0, -30 * k2, 92 * k2, INK, 'center', 900, DISP, sz, 1, 20);
        txt(g, 'TOKEN', 0, 52 * k2, 44 * k2, INK, 'center', 900, DISP, sz - 10 * k2, 1, 20);
        ONPROP = false;
      }
      prop(g, 'token', -sz / 2, -sz / 2, sz / 2 + 7, sz / 2 + 10);
      g.restore();
    }
    /* the typed strip: "how much is this?", cut on "words", dropped on "type" */
    var sa2 = fin(t, K.like - .08);
    if (sa2 > 0 && tout < 1) {
      var cutK = eio(seg(t, K.words - .04, K.words + .26));
      var tws = WORDS.map(function (w) { return tw(w, 40, 700, MONO) + 30; }), tot = 0; tws.forEach(function (w) { tot += w; });
      var x = CX - tot / 2 - 2 * 18;
      WORDS.forEach(function (w, j) {
        var cx2 = x + tws[j] / 2 + (j - 2) * 18 * cutK, cy2 = 985;
        var d0 = K.type - .06 + j * .08, dk2 = eio(seg(t, d0, d0 + .34));
        var X = lerp(cx2, cellX(j + 1), dk2), Y = lerp(cy2, TAPEY, dk2) - 70 * Math.sin(Math.PI * dk2);
        var Wd = lerp(tws[j] + (cutK > 0 ? 0 : 0), 96, dk2);
        wordTile(g, X, Y, cutK > 0 ? Wd : tws[j] + 2, 64, w, sa2 * (1 - tout), .05 * Math.sin(Math.PI * dk2) * (j % 2 ? 1 : -1));
        x += tws[j];
      });
      /* the knife's cut: a quick vertical pass over the strip on "words" */
      var kc = seg(t, K.words - .1, K.words + .3);
      if (kc > 0 && kc < 1) knife(g, lerp(CX - tot / 2 - 40, CX + tot / 2 + 60, kc), 935, 1035, 10, 1 - seg(kc, .8, 1));
    }
    /* each cell on the tape: about one token per square or word */
    var e1 = fin(t, K.counted + .42) * (1 - tout), pk1 = Math.min(1, pop(t, K.counted + .42, 3.4));
    if (e1 > 0) txt(g, '≈1 TOKEN EACH', CX, TAPEY - 80 + 10 * (1 - pk1), 40, CREAM, 'center', 900, DISP, 790, e1);
    var sla = fin(t, K.type + .3) * (1 - seg(t, K.hero + .1, K.hero + .3));
    txt(g, 'SAME TALLY,', CX, 942, 42, CREAM, 'center', 900, DISP, 820, sla);
    txt(g, 'SAME PRICE PER TOKEN', CX, 994, 42, CREAM, 'center', 900, DISP, 820, sla);

    /* cap → hero: the gauge with its hard stop. The full photo's 15,552 squares drive the needle into the stop (knock);
       on the hero line it settles at 4,740, just under the stop. */
    var ga = fin(t, K.andW - .06);
    if (ga > 0) {
      g.save(); g.globalAlpha *= ga;
      var gy = GA.y + 20 * (1 - eout(seg(t, K.andW - .06, K.andW + .3)));
      /* the slot */
      g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, GA.x0 - 10 + 6, gy - GA.h / 2 - 8 + 8, GA.x1 - GA.x0 + 20, GA.h + 16, 10); g.fill();
      g.fillStyle = '#2a2631'; rr(g, GA.x0 - 10, gy - GA.h / 2 - 8, GA.x1 - GA.x0 + 20, GA.h + 16, 10); g.fill();
      g.strokeStyle = 'rgba(244,237,224,.55)'; g.lineWidth = 3; rr(g, GA.x0 - 10, gy - GA.h / 2 - 8, GA.x1 - GA.x0 + 20, GA.h + 16, 10); g.stroke();
      /* the needle value: the full photo's 15,552 squares are 3.25 × the cap, so the bar runs into the stop, over it and
         spills off the end of the rail, crumpled; on "newer models" it snaps back to 4,740, just under the stop */
      var run = ein(seg(t, K.every - .05, GT.knock)), v = 15552 * run;
      var bang = t > GT.knock ? Math.exp(-9 * (t - GT.knock)) * Math.sin((t - GT.knock) * 30) : 0;
      var settle = eio(seg(t, K.newer - .1, K.newer + .35));
      var over = Math.max(0, v - 4784) * (1 - settle);
      var xv = lerp(gaugeX(Math.min(v, 4784)) - (over > 0 ? 4 * Math.abs(bang) : 0), gaugeX(4740), settle);
      var fillC = settle > .5 ? TAPE : '#b9b2a4';
      g.fillStyle = fillC; rr(g, GA.x0, gy - GA.h / 2, Math.max(0, xv - GA.x0), GA.h, 6); g.fill();
      /* the hard stop */
      g.fillStyle = CARD; g.fillRect(GA.x1 + 2, gy - GA.h / 2 - 22, 22, GA.h + 44); g.fillStyle = CARD_D; g.fillRect(GA.x1 + 2, gy - GA.h / 2 - 22, 6, GA.h + 44);
      if (over > 0) {
        var L = over / 4784 * (GA.x1 - GA.x0), top = gy - GA.h / 2, run1 = Math.min(L, 66);
        g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(GA.x1 - 4 + 5, top + 6, run1 + 4, GA.h);
        g.fillStyle = fillC; g.fillRect(GA.x1 - 4, top, run1 + 4, GA.h);
        if (L > 66) {
          var Ld = L - 66, P = [], Q = [], yy, j = 0;
          for (yy = 0; yy <= Ld + 15; yy += 15, j++) { var off = (j % 2 ? 7 : -7) * clamp(yy / 40, 0, 1); P.push([GA.x1 + 26 + off, top + GA.h + yy]); Q.push([GA.x1 + 26 + GA.h + off, top + GA.h + yy]); }
          var path = [[GA.x1 + 26, top], [GA.x1 + 62, top]].concat(Q, P.reverse());
          g.fillStyle = 'rgba(0,0,0,.4)'; poly(g, path.map(function (p) { return [p[0] + 5, p[1] + 4]; })); g.fill();
          g.fillStyle = fillC; poly(g, path); g.fill();
          g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 2; g.beginPath();
          for (var q = 1; q < Q.length; q++) { g.moveTo(P[P.length - 1 - q][0], P[P.length - 1 - q][1]); g.lineTo(Q[q][0], Q[q][1]); } g.stroke();
        }
      }
      /* the needle */
      g.fillStyle = INK; g.fillRect(xv - 3, gy - GA.h / 2 - 14, 6, GA.h + 28);
      prop(g, 'gauge', GA.x0 - 10, gy - GA.h / 2 - 22, GA.x1 + 24, gy + GA.h / 2 + 22);
      g.restore();
      /* the cap carries its scope from its first frame; short again once = 4,740 TOKENS takes the left side */
      var cs = seg(t, K.n4700, K.n4700 + .1);
      txt(g, 'CAP 4,784 (CLAUDE 4.7+)', GA.x1 + 12, GA.y - 46, 40, CREAM, 'right', 900, DISP, 700, ga * (1 - cs));
      txt(g, 'CAP 4,784', GA.x1 + 12, GA.y - 46, 40, CREAM, 'right', 900, DISP, 360, ga * cs);
      var fa = fin(t, K.andW - .1) * (1 - seg(t, K.hero + .6, K.hero + .68));
      txt(g, 'FULL PHOTO: 15,552 > 4,784', CX, 1376, 40, CREAM, 'center', 900, DISP, 820, fa);
      var tOver = K.every - .05 + Math.cbrt(4784 / 15552) * (GT.knock - K.every + .05);
      txt(g, '= 4,740 TOKENS', GA.x0 - 8, GA.y - 46, 40, CREAM, 'left', 900, DISP, 420, fin(t, K.n4700 + .1));
    }
    /* hero: the scope, then THE stamp in the silence */
    var ca = fin(t, K.hero + .7);
    txt(g, 'CLAUDE 4.7 AND LATER · OUR MATH', CX, 1370, 38, CREAM, 'center', 900, DISP, 820, ca);
    txt(g, 'CLAUDE VISION DOCS, READ NOV 3, 2026', CX, 1410, 36, CREAM, 'center', 700, MONO, 820, ca);
    /* the hero's lifted row: six squares rise out of the print and line up at 60 px each, done before the stamp */
    if (hk > 0) HROW.forEach(function (c, i) {
      var b = cellBox(c, HROWY), sx = st.cx + (b.x + b.w / 2) * st.s, sy = st.cy + (b.y + b.h / 2) * st.s, d = i - 2.5;
      var k = eio(clamp(hk * 1.3 - i * .06, 0, 1)), z = lerp(b.w * st.s, 112, k), x = lerp(sx, CX + d * 124, k), y = lerp(sy, 1002 + 5 * d * d, k) - 60 * Math.sin(Math.PI * k);
      g.save(); g.translate(x, y); g.rotate(.05 * d * k);
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(-z / 2 + 6, -z / 2 + 10, z, z);
      var sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(HTILES[i], -z / 2, -z / 2, z, z); g.imageSmoothingEnabled = sm;
      g.strokeStyle = CREAM; g.lineWidth = 3; g.strokeRect(-z / 2, -z / 2, z, z);
      prop(g, 'tile', -z / 2, -z / 2, z / 2 + 6, z / 2 + 10);
      g.restore();
    });
    var G = st.G; txt(g, 'YOUR 12 MP PHOTO', CX, G.cy - PH * G.k / 2 + 38, 36, CREAM, 'center', 700, MONO, 700, fin(t, K.hero + .3));
    stamp(g, '4,740\nSQUARES', CX, 1150, t, GT.slam, 60, HOT, -.06, true);
  }

  /* =====================================================================================================
     SCENE 2 · small text (receipt close-up) → get closer (the phone frame)
     ===================================================================================================== */
  /* the test: our own kitchen-table photo rendered at 4032 × 3024 with the receipt's real print, shrunk with the docs'
     rule to 2212 × 1659 (canvas high-quality resampling, no added blur), and the same crop shown before and after at the
     same size on screen. Get closer: the same table shot from closer (the receipt 2.2 × bigger in the frame), shrunk the
     same way. The 28-px squares are drawn at their true size on each resized crop. */
  var BIGW = 4032, BIGH = 3024, SMW = 2212, SMH = 1659, ZC = 2.2;
  var PAN = { w: 800, h: 150, x: 110, ya: 545, yb: 760 };
  var CROP = { cx: 66, cy: 208.2, w: 58, h: 58 * 150 / 800 };    /* receipt units: just the smallest line */
  var PB_BEFORE = null, PB_AFTER = null, PB_CLOSE = null, PB_GRID = {};
  function testPhoto(z, cxB, cyB) {
    var c = mk(BIGW, BIGH), g = c.getContext('2d');
    if (z !== 1) { g.translate(BIGW / 2, BIGH / 2); g.scale(z, z); g.translate(-cxB, -cyB); }
    g.scale(BIGW / PHW, BIGH / PHH); paintScene(g, false);
    return c;
  }
  /* the resize itself: an area-average (box) resample from 4032 × 3024 to 2212 × 1659, computed exactly for the output
     pixels the crop needs (identical to shrinking the whole photo and cropping after) */
  function areaShrink(big, X0, Y0, ow, oh, r) {
    var sx0 = Math.floor(X0 / r), sy0 = Math.floor(Y0 / r), sx1 = Math.ceil((X0 + ow) / r), sy1 = Math.ceil((Y0 + oh) / r);
    var sw = sx1 - sx0, sh = sy1 - sy0, d = big.getContext('2d').getImageData(sx0, sy0, sw, sh).data;
    function weights(O0, n, s0) {
      var out = [];
      for (var i = 0; i < n; i++) {
        var a = (O0 + i) / r, b = (O0 + i + 1) / r, ws = [];
        for (var j = Math.floor(a); j < Math.ceil(b); j++) { var w = Math.min(b, j + 1) - Math.max(a, j); if (w > 1e-9) ws.push([j - s0, w * r]); }
        out.push(ws);
      }
      return out;
    }
    var WX = weights(X0, ow, sx0), WY = weights(Y0, oh, sy0), tmp = new Float32Array(ow * sh * 3), x, y, c, k;
    for (y = 0; y < sh; y++) for (x = 0; x < ow; x++) for (c = 0; c < 3; c++) {
      var acc = 0, wx = WX[x]; for (k = 0; k < wx.length; k++) acc += d[(y * sw + wx[k][0]) * 4 + c] * wx[k][1];
      tmp[(y * ow + x) * 3 + c] = acc;
    }
    var out = mk(ow, oh), og = out.getContext('2d'), id = og.createImageData(ow, oh);
    for (y = 0; y < oh; y++) for (x = 0; x < ow; x++) {
      for (c = 0; c < 3; c++) { var acc2 = 0, wy = WY[y]; for (k = 0; k < wy.length; k++) acc2 += tmp[(wy[k][0] * ow + x) * 3 + c] * wy[k][1]; id.data[(y * ow + x) * 4 + c] = Math.round(acc2); }
      id.data[(y * ow + x) * 4 + 3] = 255;
    }
    og.putImageData(id, 0, 0); return out;
  }
  /* shown at the photo's real pixel density, scaled up nearest-neighbour so every pixel is a visible block */
  function cropTo(src, x, y, w, h) { var c = mk(PAN.w, PAN.h), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, x, y, w, h, 0, 0, c.width, c.height); return c; }
  function testCrops(big, cx, cy, w, h) {
    var r = SMW / BIGW, X0 = Math.floor((cx - w / 2) * r), Y0 = Math.floor((cy - h / 2) * r), ow = Math.round(w * r), oh = Math.round(h * r);
    return { before: cropTo(big, X0 / r, Y0 / r, ow / r, oh / r), after: cropTo(areaShrink(big, X0, Y0, ow, oh, r), 0, 0, ow, oh),
      grid: { step: 28 / ow * PAN.w, ox: -(X0 % 28) / ow * PAN.w, oy: -(Y0 % 28) / oh * PAN.h } };
  }
  function buildTest() {
    /* where the crop sits in the 4032 × 3024 photo (the receipt is turned −0.075 rad on the table) */
    var m = new DOMMatrix().scale(BIGW / PHW, BIGH / PHH).translate(170, 250).rotate(-.075 * 180 / Math.PI);
    var p = m.transformPoint(new DOMPoint(CROP.cx, CROP.cy)), sx = BIGW / PHW, w = CROP.w * sx, h = CROP.h * sx;
    var big = testPhoto(1), A = testCrops(big, p.x, p.y, w, h);
    /* the hero's six squares: the real 28 × 28 pixels of the resized photo, one visual token each */
    HTILES = HROW.map(function (c) { return areaShrink(big, c * 28, HROWY * 28, 28, 28, SMW / BIGW); });
    PB_BEFORE = A.before; PB_AFTER = A.after; PB_GRID.after = A.grid;
    /* closer: the camera 2.2 × closer on the same spot; the same pixel window, so the text fills it 2.2 × bigger */
    var B = testCrops(testPhoto(ZC, p.x, p.y), BIGW / 2, BIGH / 2, w, h);
    PB_CLOSE = B.after; PB_GRID.close = B.grid;
  }
  function panel(g, img, x, y, label, a, grid, wipe) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x + 8, y + 11, PAN.w, PAN.h);
    var sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(img, x, y, PAN.w, PAN.h); g.imageSmoothingEnabled = sm;
    if (grid && wipe > 0) {
      g.save(); g.beginPath(); g.rect(x, y, PAN.w * wipe, PAN.h); g.clip();
      g.fillStyle = 'rgba(244,237,224,.45)';
      for (var gx = x + grid.ox; gx <= x + PAN.w; gx += grid.step) g.fillRect(gx - 1, y, 2, PAN.h);
      for (var gy = y + grid.oy; gy <= y + PAN.h; gy += grid.step) g.fillRect(x, gy - 1, PAN.w, 2);
      g.restore();
    }
    g.strokeStyle = CREAM; g.lineWidth = 4; g.strokeRect(x - 2, y - 2, PAN.w + 4, PAN.h + 4);
    prop(g, 'panel', x - 4, y - 4, x + PAN.w + 12, y + PAN.h + 15);
    g.restore();
    txt(g, label, x + 4, y - 30, 40, CREAM, 'left', 900, DISP, PAN.w, a);
  }
  function receiptScene(g, t) {
    var s0 = S('receipt').t0;
    var dr = 3 * Math.sin((t - s0) * 1.6);
    /* blur: BEFORE over AFTER RESIZE; the AFTER crop starts as the original and the knife leaves the resized pixels */
    var kk = eio(seg(t, K.hard - .45, K.read + .35));
    /* tip ("Reading fine print?"): BEFORE leaves, AFTER RESIZE moves up, CLOSER comes in below it */
    var tk = eio(seg(t, K.tip - .15, K.tip + .35));
    g.save(); g.translate(0, dr);
    panel(g, PB_BEFORE, PAN.x - 15 * tk, PAN.ya, 'BEFORE', clamp(1 - 2 * tk, 0, 1));
    var ya = lerp(PAN.yb, PAN.ya, tk);
    if (kk < 1) panel(g, PB_BEFORE, PAN.x, ya, 'AFTER RESIZE', 1);
    if (kk > 0) {
      g.save(); g.beginPath(); g.rect(PAN.x - 6, ya - 70, (PAN.w + 20) * kk + 6, PAN.h + 100); g.clip();
      panel(g, PB_AFTER, PAN.x, ya, 'AFTER RESIZE', 1, PB_GRID.after, 1);
      g.restore();
      if (kk < 1) knife(g, PAN.x + PAN.w * kk + 8, ya - 16, ya + PAN.h + 16, 30, 1 - seg(kk, .9, 1));
    }
    var gc = seg(t, K.tip + .2, K.tip + .8);
    panel(g, PB_CLOSE, PAN.x + 200 * (1 - tk), PAN.yb, 'CLOSER', clamp(3 * tk - 1.5, 0, 1), PB_GRID.close, gc);
    g.restore();
    /* get closer: the rule, on the tip */
    var la = fin(t, K.tip + .35);   /* only once CLOSER is fully in */
    txt(g, 'GET CLOSER =', CX, 954, 46, CREAM, 'center', 900, DISP, 800, la);
    txt(g, 'BIGGER TEXT', CX, 1006, 46, CREAM, 'center', 900, DISP, 800, la);
    tag(g, 'SAME RECEIPT · OUR TEST', CX, 1068, 1, .01);
    /* what the resized panels are: "AFTER RESIZE … TO CLAUDE'S SIZE"; on the tip, both lower panels are resized */
    txt(g, 'BOTH RESIZED', CX, 1122, 36, CREAM, 'center', 700, MONO, 820, fin(t, K.tip + .35));
    txt(g, 'TO CLAUDE’S SIZE (2212 × 1659)', CX, 1168, 36, CREAM, 'center', 700, MONO, 820);
    docCard(g, 110, 1212, 910, 1404, ['“…THIS MIGHT, FOR EXAMPLE,', 'MAKE TEXT LESS LEGIBLE.”'], 42, 'CLAUDE VISION DOCS · RE-CREATED', 61, 1);
  }

  /* =====================================================================================================
     SCENE 3 · the end card: the small-text desk drops away, frame 0's print slides back in at its frame-0 place;
     coral YES / NO above it (neither picked; no grid, no shrink). After "no" they leave and 12 MILLION PIXELS returns.
     ===================================================================================================== */
  function outroScene(g, t) {
    var a = S('outro').t0, ex = seg(t, a, a + .24);
    if (ex < 1) { g.save(); g.globalAlpha *= 1 - ex; g.translate(0, 30 * ex); receiptScene(g, t); g.restore(); }
    var up = eio(seg(t, a + .06, K.chips - .06));
    /* the end card breathes while the question is asked, and is back at frame 0's exact place by the end */
    var br = seg(t, K.chips, K.chips + .5) * (1 - seg(t, K.noE - .2, K.noEnd + .1));
    var st = { cx: REST.cx, cy: REST.cy + GL + 140 * (1 - up) + 12 * Math.sin((t - K.chips) * 3.2) * br, s: 1, dim: 0, rot: .012 * Math.sin((t - K.chips) * 2.1) * br };
    /* the last frame is frame 0: the dashed outline is back, pulsing in the same phase (drawn under the print, as on frame 0) */
    var oa = seg(t, K.noEnd + .13, K.noEnd + .23);
    if (oa > 0) { g.save(); g.translate(st.cx, st.cy); dashes(g, oa * lerp(pulseA(t - DUR), 1, seg(t, DUR - .25, DUR - .12))); g.restore(); }
    g.save(); g.globalAlpha *= clamp(seg(t, a + .06, a + .3) * 1.2, 0, 1); printAt(g, st, {}); g.restore();
    var yk = function (w) { return 1 + .06 * Math.sin(Math.PI * seg(t, w - .06, w + .3)); };
    var ya = fin(t, K.chips) * (1 - seg(t, K.noEnd + .06, K.noEnd + .2));
    var yp = pop(t, K.chips, 3);
    [['YES', 380, K.yes], ['NO', 640, K.noE]].forEach(function (c) {
      chip(g, c[0], c[1], 728 + 30 * (1 - Math.min(1, yp)), { px: 76, wt: 900, line: HOT, lw: 5, fg: HOT, w: 220, r: 46, shadow: false, a: ya, s: yk(c[2]) });
    });
  }

  /* frame-0 type: 12 MILLION PIXELS (3 words), gliding with the print; a hard cut on "Send"; back after "no" */
  function hookText(g, a, dy) {
    if (a <= 0) return;
    txt(g, '12 MILLION PIXELS', CX, 372 + dy, 84, CREAM, 'center', 900, DISP, 830, a, 72);
  }

  /* ---------- captions: the narrator's words, one block at a time; stressed words get a cream pill (never coral) ---------- */
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'send') return;   /* 12 MILLION PIXELS, the hook pill and the TO CLAUDE tag carry these two lines */
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
      if (isFirst && c.id === 'blur') s = Math.max(s, K.capA);   /* the caption swaps once the torn edge is past the stamp */
      return { id: c.id, t0: ws[0].t0, s: s, t1: ws[ws.length - 1].t1, words: ws };
    });
  })();
  var STRESS = [['send', '12'], ['third', 'third'], ['ask', 'why'], ['squares', 'squares'], ['token', 'token'], ['counted', 'words'], ['cap', 'cap'], ['hero', '4700'], ['blur', 'small'], ['tip', 'closer'], ['end', 'yes']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, over: 1, that: 1, up: 1, own: 1, is: 1, it: 1, go: 1, does: 1, do: 1, from: 1, be: 1, or: 1, for: 1, their: 1, newer: 1, about: 1, every: 1, might: 1, one: 1 };
  var CAPMIN = 1e9;
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s - .04 : 1e9;
    var keep = nx && (ns - card0.t1 < 2.4 || card0.id === 'hero');   /* the hero caption stays up through the whole hold, to the wipe */
    var o1 = keep ? ns : Math.min(card0.t1 + .5, ns - .12), o0 = keep ? ns : Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.s - .04, card0.s + .06), out = keep ? (t < ns ? 1 : 0) : 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - card0.s + .04, 3.2, .8), 0, 1.04);
    g.save(); g.font = '800 74px Archivo'; wide(g);
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 22;
    var lines, lw, maxw = 790, cpx = 74;
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
    var lh = cpx * 1.18, y0 = (lines.length > 1 ? 380 : 408) + 40 - (lines.length - 1) * lh / 2;   /* pill tops at y ≥ 304 */
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
  var NOISE, SCENES = { desk: deskScene, receipt: receiptScene, outro: outroScene };
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function safeClip(g) { g.beginPath(); g.rect(SAFE_BOX.x0, SAFE_BOX.y0, SAFE_BOX.x1 - SAFE_BOX.x0, SAFE_BOX.y1 - SAFE_BOX.y0); g.clip(); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) { g.save(); SCENES[Sc.fn](g, t); g.restore(); }
  /* the cut: a torn-paper edge falling from the top along one axis (cream), the next scene drawn above it; it spans the
     safe box only (everything outside it is the bare stage either way) */
  function edgeY(x, ly, t) { var i = Math.round(x / 30); return ly + (i % 2 ? -10 : 8) + Math.sin(x * .013 + t * 5) * 4; }
  function tornEdge(g, ly, t) { g.save(); g.strokeStyle = CREAM; g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); for (var x = 90; x <= 930; x += 30) { var yy = edgeY(x, ly, t); if (x === 90) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore(); }
  function clipAbove(g, ly, t) { g.beginPath(); g.moveTo(0, 0); for (var x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, 0); g.closePath(); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var sk0 = Nx && Nx.swipe ? seg(te, Nx.t0 - Nx.sw, Nx.t0) : 0, sk = Nx && Nx.pw === 1 ? sk0 : sk0 * sk0;
    /* the hero's exit: the edge drops fast through the top third, then falls slowly past the stamp, so the stamp reads */
    if (Nx && Nx.two) { var tau = te - (Nx.t0 - Nx.sw); sk = tau <= 0 ? 0 : tau < .15 ? .35 * tau / .15 : Math.min(1, .35 + .65 * (tau - .15) / (Nx.sw - .15)); }
    var ly = 280 + (1470 - 280) * sk;   /* from the top of the safe box to past its bottom */
    COVTOP = sk > 0 ? ly + 14 : -1e9;
    g.save(); safeClip(g);
    drawScene(g, Sc, t);
    if (si === 0 && !POSTERMODE && LIVE.text) hookText(g, 1 - seg(t, K.third0 - .15, K.third0 - .05), hookGlide(t));
    COVTOP = -1e9;
    if (sk > 0) {
      g.save(); clipAbove(g, ly, te);
      stage(g); INCOMING = true; INTOP = ly - 14; drawScene(g, Nx, t); INCOMING = false; INTOP = -1e9; g.restore();
      tornEdge(g, ly, te);
    }
    g.restore();
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) {
      var back = seg(t, K.noEnd + .04, K.noEnd + .18);
      captions(g, t, 1 - back);
      if (Sc.id === 'outro') { g.save(); safeClip(g); hookText(g, seg(t, K.noEnd + .13, K.noEnd + .23), GL); g.restore(); }
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    var a = 'Your photo?', b = 'Claude shrinks it', px = 84;
    g.save(); font(g, px, 800); g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText(a, CX, 384);
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 474 - 76, wb + 28, 100, 16); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 474); g.restore();
  }
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
  /* Four hits (BRIEF §0 planned silences): a paper slide as the shrunk print settles after "under a third.", the knife's
     snick as the squares lift after "not pixels.", the needle's knock on the stop after "token cap.", THE thump under the
     stamp after "4,700 squares." (the end card's pop was dropped in round 2: no clear gap before "Did"). */
  function initGaps() {
    /* no hook hit: the gate found no clear gap near "shrinks" (round 3 tried one) */
    GS.push({ t: GT.slide, type: 'slide', g: .5 });
    GS.push({ t: GT.snick, type: 'snick', g: 1 });
    GS.push({ t: GT.knock, type: 'knock', g: .8 });
    GS.push({ t: GT.slam, type: 'thump', g: .2 });
    if (GT.snick2 != null) GS.push({ t: GT.snick2, type: 'snick', g: .8 });
    /* no pop: Whisper hears "Did" right after "first.", so there is no clear gap for the chips' hit; they rise silently */
  }
  function initTimes() {
    GS.forEach(function (e) { EV.push({ t: e.t, type: e.type, g: e.g, t1: e.t + BODY[e.type] }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
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
    /* the needle on the stop: a short wooden knock, mid band, no heavy body */
    function knock(t, g) {
      g = g || 1;
      var o = osc('sine', 420, t, t + .1, 1, [[t, 0], [t + .003, .22 * g], [t + .09, 0]], .03); o.frequency.exponentialRampToValueAtTime(300, t + .08);
      band(t, .05, 1400, 1.4, 2.4 * g, .001, .04);
      band(t + .003, .06, 800, 1, 1.2 * g, .002, .04);
    }
    /* the print settling: a short paper slide, band noise sweeping down, nothing below 700 Hz */
    function slide(t, g) {
      g = g || 1;
      var n = noise(t, .2), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .9;
      bp.frequency.setValueAtTime(3000, t); bp.frequency.exponentialRampToValueAtTime(1100, t + .18);
      var ob = bus(1, .05, -.1); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .03, 1.5 * g], [t + .13, 1.0 * g], [t + .2, 0]]);
    }
    /* the knife: a dry paper snick, two short high bands */
    function snick(t, g) {
      g = g || 1;
      band(t, .03, 5200, 2.2, 2.6 * g, .001, .03, .1);
      band(t + .02, .06, 2600, 1.6, 1.6 * g, .002, .03, .1);
    }
    /* the end card's chips: a soft paper pop, two short noise bands and no pitched tone */
    function popS(t, g) {
      g = g || 1;
      band(t, .022, 3600, 1.8, 1.4 * g, .001, .02);
      band(t + .002, .03, 1800, 2.5, .5 * g, .001, .01);
    }
    EV.forEach(function (e) {
      if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'knock') knock(e.t, e.g);
      else if (e.type === 'slide') slide(e.t, e.g);
      else if (e.type === 'snick') snick(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone, about −60 dB, so the loop seam is never digital zero; about −50 dB of room bed under the hero hold */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o);
      var h0 = GT.slam + .05, h1 = Math.min(K.tearA, K.blur - .25);
      env(o.gain, [[0, ROOM], [h0, ROOM], [h0 + .2, ROOM * 3.16], [h1 - .15, ROOM * 3.16], [h1 + .1, ROOM]]); })();
  }
  var ROOM = .0108;

  /* ---------- boot ---------- */
  var TILE28 = null;
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d'); MC = mk(8, 8).getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹✓✕–@!>$(),:§+/='); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      PHOTO = paintPhoto();
      /* the token square: the 28 × 28 pixels of one cell of the shrunk photo */
      TILE28 = mk(28, 28); var tg = TILE28.getContext('2d'); tg.imageSmoothingQuality = 'high';
      tg.drawImage(PHOTO, PHW * TOKC[0] / COLS, PHH * TOKC[1] / ROWS, PHW / COLS, PHH / ROWS, 0, 0, 28, 28);
      /* the receipt close-up (2×) and its shrunk copy */
      PRINT = paintPrint();
      /* the resize test (4032 × 3024 → 2212 × 1659), done once */
      buildTest();
      window.READY = true;
    });
  }
  initGaps();
  initTimes();
  /* the hero hold: from the stamp settling to the torn edge, fully still */
  var HOLD = { t0: GT.slam + .12, t1: K.tearA };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'vision', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
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
