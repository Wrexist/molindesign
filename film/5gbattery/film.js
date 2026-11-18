/* "Yes, 5G can drain your battery." — Factory #34 (5gbattery) on Tech, explained, after ../phonelistening/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   All cut paper: a phone top rising out of a jeans pocket, its status-bar 5G as a two-sided paper tile (5G / LTE), and
   the hero, a bench power meter (ENERGY PER BIT, a 5G needle and a ghost 4G needle) wired to a phone on its back. A drip
   of data sends the 5G needle into the red (tape 1, 79 %); a flood crosses the needles (tape 2, 5×); a chalk chart over
   the bench is the hero hold. Then the re-created settings screens, where the tile flips to LTE.
   Coral only on frame 0's "?", the chart's 5G line and YES / NO. Props stay whole inside x 92–928, y 302–1428. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#121821', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f3ecdf', INK = '#211d26';
  var SLATE = '#3a4452', SLATE2 = '#2e3744';
  var CASE = '#2c2621', CASE2 = '#463b31', BRASS = '#d8b25c', BRASS2 = '#a8843a', GLOW = '#f1cf6b', LAMP = '#fbe9b4', SKIN = '#e2c3a0';
  var PHB = '#2a313d', SCRW = '#f6f1e6', BAND1 = '#55627a';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var SAFE_BOX = { x0: 92, y0: 302, x1: 928, y1: 1428 };

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function eout(k) { return 1 - Math.pow(1 - k, 3); }
  function sio(k) { return .5 - .5 * Math.cos(Math.PI * clamp(k, 0, 1)); }
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
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }   /* a displayed number follows the frame the renderer samples */

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) {
    /* the aligner splits "32°F?" into "32°" + "F?": one word on screen and in the keys */
    var ws = []; l.words.forEach(function (w) { var p = ws[ws.length - 1]; if (p && /°$/.test(p.w) && /^F/.test(w.w)) { p.w += w.w; p.t1 = w.t1; } else ws.push({ w: w.w, t0: w.t0, t1: w.t1 }); });
    l.words = ws; LINE[l.id] = l;
  });
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

  /* the hits are placed from the heard words before anything is timed off them (see the SFX gate below) */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  var lastE = EDGES.length ? Math.max.apply(null, EDGES) : -1;
  VO.lines.forEach(function (l) { if (l.t0 > lastE + .3) l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 + .15 }); EDGES.push(w.t0, w.t1 + .15); }); });
  function voiceEnd(id, before) { var e = lend(id); VOICED.forEach(function (v) { if (v.t0 < lend(id) + .3 && v.t1 > e && v.t1 < before) e = v.t1; }); return e; }
  var BODY = { thump: .2, knock: .14, slap: .1, paper: .17, pop: .12, tick: .05, click: .06, swish: .21, rip: .24, marker: .3, tear: .15 };
  var GT = {};
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  var K = {
    yes: start('hook'), g5: at('hook', '5G'), drain: at('hook', 'drain'), battery: at('hook', 'battery'), hookEnd: lend('hook'),
    ask: start('ask'), turn: at('ask', 'turn'), off: at('ask', 'off'), askEnd: lend('ask'),
    test: start('test'), y21: at('test', '2021'), researchers: at('test', 'researchers'), wired: at('test', 'wired'), phones: at('test', 'phones'), power: at('test', 'power'), meters: at('test', 'meters'), testEnd: lend('test'),
    slow: start('slow'), slowW: at('slow', 'slow'), s5g: at('slow', '5G'), p79: at('slow', '79%'), less: at('slow', 'less'), efficient: at('slow', 'efficient'), slowEnd: lend('slow'),
    twist: start('twist'), full: at('twist', 'full'), itW: at('twist', 'it'), fiveW: at('twist', 'five'), times: at('twist', 'times'), more: at('twist', 'more'), twistEnd: lend('twist'),
    barely: start('barely'), b5: at('barely', '5G'), costs: at('barely', 'costs'), extra: at('barely', 'extra'), barelyW: at('barely', 'barely'), useW: at('barely', 'use'), barelyEnd: lend('barely'),
    auto: start('auto'), iphone: at('auto', 'iPhone'), autoW: at('auto', 'Auto'), drops: at('auto', 'drops'), lte: at('auto', 'LTE'), when: at('auto', 'when'), help: at('auto', 'help'), autoEnd: lend('auto'),
    pixel: start('pixel'), pix: at('pixel', 'Pixel'), adaptive: at('pixel', 'Adaptive'), same: at('pixel', 'same'), pixelEnd: lend('pixel'),
    on: start('on'), onW: at('on', 'On'), always: at('on', 'always'), picks: at('on', 'picks'), apple: at('on', 'Apple'), might: at('on', 'might'), cost: at('on', 'cost'), onEnd: lend('on'),
    end: start('end'), yours: at('end', 'yours'), eAuto: at('end', 'Auto'), yesE: at('end', 'Yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  (function () {
    place('hk', 'tick', K.hookEnd + .3, .2, K.hookEnd, K.ask);                       /* the battery loses a segment */
    place('ts', 'tick', K.testEnd + .3, .2, K.testEnd, K.slow);                      /* the leads clip on (only if the gap allows) */
    place('sw', 'knock', K.slowEnd + .3, .2, K.slowEnd, K.twist);                    /* the fail: the 5G needle slams into the red */
    place('tp', 'slap', K.twistEnd + .3, .2, K.twistEnd, K.barely);                  /* the pass: the second tape slaps down */
    place('hr', 'thump', K.barelyEnd + .3, .2, K.barelyEnd, K.auto - .3);             /* the hero: the chart's plate, one dry hit */
    place('au', 'tick', K.autoEnd + .3, .2, K.autoEnd, K.pixel);                     /* the tile flips back to 5G */
    place('op', 'click', K.onEnd + .3, .2, K.onEnd, K.end);                          /* the battery drops a segment on 5G On */
  })();
  var TW = .5;
  K.RING0 = K.extra - .05; K.RING1 = K.extra + .3;   /* the chalk ring on "extra"; the hand is gone by ~18.05 */
  K.PLATE = K.extra - .04;      /* the summary plate lands on "extra" and covers tape 2 */
  K.F79 = K.p79 + .08;          /* the 5G needle hits the red: tape 1 (79 %) prints from here, never before */
  K.SWAP = K.fiveW + .35;       /* the needle swap ends: tape 2 (5×) prints from here, never before */
  K.TL0 = K.barely - .45;       /* r2 wow: the 5G tile hops off the lead with the slate's wipe, rides the coral line */
  K.HK = GT.hk != null ? GT.hk : K.hookEnd + .2;
  K.SW = GT.sw != null ? GT.sw : K.slowEnd + .2;
  K.TP = GT.tp != null ? GT.tp : K.twistEnd + .2;
  K.HR = GT.hr != null ? GT.hr : K.barelyEnd + .3;
  K.AU = GT.au != null ? GT.au : K.autoEnd + .15;
  K.OP = GT.op != null ? GT.op : K.onEnd + .2;
  var SC = [
    { id: 'hook', fn: 'hookScene', name: 'Is 5G draining it?', t0: 0 },
    { id: 'bench', fn: 'benchScene', name: '2021: phones on a power meter', t0: K.researchers - .1 },
    { id: 'set', fn: 'setScene', name: '5G Auto, Adaptive connectivity, 5G On', t0: K.auto + .75 },
    { id: 'end', fn: 'endScene', name: 'Is yours on 5G Auto?', t0: K.end + .05 }
  ];

  var SHOTS;
  var TEND = Math.round(DUR * 30) / 30;                    /* frame 0 of the next loop sits at TEND */

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- measuring: the safe area (BOUNDS_RUN), what is readable (TEXTS → readcheck) and labels vs props (LABELS_RUN) ---------- */
  var BOUNDS = null, REC = null, PROPS = null, LBL = null, CURT = 0, NOREC = false, EXITING = false, ONPROP = false, CHIPBOX = null;
  var SAFE = { x0: 95, x1: 925, y1: 1450 };
  function xbox(g, x0, y0, x1, y1) {
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
  }
  function recBound(g, b, text) {
    if (!BOUNDS || EXITING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    if (b[2] < SAFE_BOX.x0 || b[0] > SAFE_BOX.x1 || b[1] > SAFE_BOX.y1 || b[3] < SAFE_BOX.y0) return;   /* fully outside the scene clip: never drawn */
    if (b[0] < SAFE.x0 - .5 || b[2] > SAFE.x1 + .5 || b[3] > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(b[0]), x1: Math.round(b[2]), y1: Math.round(b[3]) });
  }
  function recBox(g, x0, y0, x1, y1, text) { if (BOUNDS) recBound(g, xbox(g, x0, y0, x1, y1), text); }
  function prop(g, name, x0, y0, x1, y1) {
    if (!PROPS || EXITING || (g !== ctx && g !== tctx)) return;
    PROPS.push({ name: name, b: xbox(g, x0, y0, x1, y1) })
  }
  function seen(g, text, b) {
    var vis = !NOREC && !EXITING && g.globalAlpha >= .95 && (g === ctx || g === tctx) && b[3] > SAFE_BOX.y0 && b[1] < SAFE_BOX.y1;
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
  /* setting ctx.font resets fontStretch (gta-lucia): the stretch is applied after every font change */
  function font(g, px, wt, fam, st) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); try { g.fontStretch = st || 'normal'; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
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
    font(g, px, o.wt, o.fam, o.st); ls(g, o.ls || 0);
    var tw0 = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw0 + pad * 2 > o.maxw && px > 36) { px -= 2; font(g, px, o.wt, o.fam, o.st); tw0 = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw0 + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, px, o.wt, o.fam, o.st);
    CHIPBOX = (o.bg || o.line) && LBL ? xbox(g, -w / 2, -h / 2, w / 2, h / 2) : null;
    g.fillText(text, 0, px * .04); CHIPBOX = null; g.restore(); ls(g, 0);
    return w;
  }
  /* one line of type, shrunk to fit maxw; never under 36 px unless asked */
  function txt(g, text, x, y, px, col, align, wt, fam, maxw, a, minpx, st) {
    a = a == null ? 1 : a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 900, fam, st); ls(g, 0);
    while (maxw && g.measureText(text).width > maxw && px > (minpx || 36)) { px -= 2; font(g, px, wt || 900, fam, st); }
    g.fillStyle = col || CREAM; g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillText(text, x, y); g.restore();
  }
  /* quiet tags (RE-CREATED): an outline, never coral */
  function tag(g, text, x, y, a, rot, maxw, col, bg, px) { chip(g, text, x, y, { px: px || 36, wt: 700, fam: MONO, line: col || CREAM, lw: 3, fg: col || CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: bg || 'rgba(16,22,28,.9)', maxw: maxw || 820 }); }
  function onprop(fn) { var o = ONPROP; ONPROP = true; fn(); ONPROP = o; }

  /* ---------- the rubber stamp: worn ink (seeded speckle), slammed; condensed caps like a real rubber stamp ---------- */
  var STEX = {};
  function stampTex(text, col, px, speck) {
    speck = speck == null ? 1 : speck;
    var key = text + col + px + speck; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900, DISP, 'extra-condensed'); ls(m, 2);
    var TL = text.split('\n'), lw = Math.max.apply(null, TL.map(function (s) { return m.measureText(s).width; })), pad = px * .3, h = px * (1.05 * TL.length + .2), w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .03); rr(g, px * .14, px * .14, w - px * .28, h - px * .28, px * .08); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, px, 900, DISP, 'extra-condensed'); ls(g, 2); TL.forEach(function (s, i) { g.fillText(s, w / 2, h / 2 + px * .05 + (i - (TL.length - 1) / 2) * px * 1.02); });
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 140 * speck);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .3 + r() * .6; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.7, 0, 6.283); g.fill(); }
    c.w = w + 16; c.h = h + 16; c.lines = TL; c.px = px; STEX[key] = c; return c;
  }
  /* full opacity from its first frame; only the size settles (1.3 → 1 in 0.1 s) */
  function stamp(g, text, x, y, t, t0, px, col, rot, speck) {
    if (t < t0) return;
    var c = stampTex(text, col, px, speck);
    var k = eout(seg(t, t0, t0 + .1)), s = lerp(1.3, 1, k);
    g.save(); g.translate(x, y); g.rotate(rot == null ? -.05 : rot); g.scale(s, s);
    var oldP = ONPROP; ONPROP = true;
    if (k >= 1) recBox(g, -c.w / 2, -c.h / 2, c.w / 2, c.h / 2, text.replace(/\n/g, ' '));
    c.lines.forEach(function (s2, i) { var ly = (i - (c.lines.length - 1) / 2) * c.px * 1.02; seen(g, s2, xbox(g, -c.w / 2, ly - c.px * .55, c.w / 2, ly + c.px * .55)); });
    g.drawImage(c, -c.w / 2, -c.h / 2); ONPROP = oldP; g.restore();
  }

  /* =====================================================================================================
     PROPS (all paper, all drawn by hand)
     ===================================================================================================== */
  function grainIn(g, x0, y0, w, h, seed, k) {
    var r = mulberry(seed), n = Math.floor(w * h / 160);
    g.save(); g.clip();
    for (var i = 0; i < n; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,' + (.09 * (k || 1)) + ')' : 'rgba(255,255,255,' + (.10 * (k || 1)) + ')'; g.fillRect(x0 + r() * w, y0 + r() * h, 1.6 + r() * 1.8, 1.6 + r() * 1.8); }
    g.restore();
  }
  function sheet(g, x0, y0, x1, y1, seed, col, name) {
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x0 + 8, y0 + 11, x1 - x0 - 8, y1 - y0 - 11);
    g.fillStyle = col || PAPER; cut(g, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], mulberry(seed), 1.3);
    g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); grainIn(g, x0, y0, x1 - x0, y1 - y0, seed + 1, .9);
    prop(g, name || 'sheet', x0, y0, x1, y1);
  }
  function drift(t, ph, k) { return 7 * Math.sin(t * 1.9 + ph) * (k == null ? 1 : k); }
  function frac(x) { return x - Math.floor(x); }

  /* a quote strip: opaque paper, the source's words line by line, a credit line, RE-CREATED; `out` (0..1) peels it off
     to the left (it lifts, tilts and drops, never fades) and `inn` (0..1) slides it in from the right */
  function quote(g, x0, y0, w, lines, px, credit, seed, inn, out, retag) {
    if (inn <= 0 || out >= 1) return;
    var ex0 = EXITING, lh = px * 1.16, h = 34 + lines.length * lh + 58;
    var ei = eout(clamp(inn, 0, 1)), eo = eio(clamp(out, 0, 1));
    g.save();
    if (ei < 1) { g.translate(110 * (1 - ei), 0); g.globalAlpha *= seg(ei, 0, .7); EXITING = true; }
    if (eo > 0) { EXITING = true; g.translate(x0, y0 + h); g.rotate(-.08 * eo); g.translate(-x0, -(y0 + h)); g.translate(-60 * eo, 50 * eo); g.globalAlpha *= 1 - eo; }
    sheet(g, x0, y0, x0 + w, y0 + h, seed, PAPER, 'quote');
    onprop(function () {
      lines.forEach(function (L, i) { txt(g, L, x0 + 30, y0 + 22 + lh * (i + .5), px, INK, 'left', 700, DISP, w - 60, 1, Math.min(px, 40), 'condensed'); });
      txt(g, credit, x0 + 30, y0 + h - 30, 36, '#5d564c', 'left', 800, DISP, retag === false ? w - 60 : w - 250, 1, 36, 'condensed');
    });
    if (retag !== false) tag(g, 'RE-CREATED', x0 + w - 118, y0 + h - 32, 1, 0, 200, INK, PAPER, 30);
    EXITING = ex0;
    g.restore();
    return h;
  }
  function decay(t, t0, f, k) { if (t < t0) return 0; var dt = t - t0; return Math.sin(dt * f) * Math.exp(-dt * k); }
  function lerpPose(a, b, k) { return { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), s: lerp(a.s, b.s, k), rot: lerp(a.rot || 0, b.rot || 0, k) }; }
  function mixc(a, b, k) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(lerp(a[i], b[i], clamp(k, 0, 1))); }).join(',') + ')'; }
  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  var PW = 420, PHH = 820, SX = 190, SY = 390;
  function phone(g, P, o) {
    o = o || {};
    g.save(); g.translate(P.cx, P.cy); g.rotate(P.rot || 0); g.scale(P.s, P.s);
    if (o.halo > 0) {   /* the backlight leaking round the screen: a soft gray halo */
      g.save(); g.shadowColor = 'rgba(214,216,226,' + (.55 * o.halo).toFixed(3) + ')'; g.shadowBlur = 90 * P.s;
      g.fillStyle = 'rgba(90,92,98,' + (.6 * o.halo).toFixed(3) + ')'; rr(g, -SX, -SY, SX * 2, SY * 2, 46); g.fill(); g.restore();
    }
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, -PW / 2 + 12, -PHH / 2 + 18, PW, PHH, 64); g.fill();
    g.fillStyle = PHB; rr(g, -PW / 2, -PHH / 2, PW, PHH, 64); g.fill();
    rr(g, -PW / 2, -PHH / 2, PW, PHH, 64); grainIn(g, -PW / 2, -PHH / 2, PW, PHH, 811, .9);
    g.fillStyle = '#1f252f'; rr(g, PW / 2 - 2, -230, 9, 90, 4); g.fill(); rr(g, PW / 2 - 2, -110, 9, 60, 4); g.fill();
    prop(g, o.name || 'phone', -PW / 2, -PHH / 2, PW / 2 + 7, PHH / 2);
    if (o.shade > 0) { g.fillStyle = 'rgba(3,4,7,' + o.shade.toFixed(3) + ')'; rr(g, -PW / 2, -PHH / 2, PW + 8, PHH, 64); g.fill(); }
    /* the screen */
    g.save(); rr(g, -SX, -SY, SX * 2, SY * 2, 46); g.clip();
    g.fillStyle = '#060708'; g.fillRect(-SX, -SY, SX * 2, SY * 2);
    if (o.screen) o.screen(g);
    g.restore();
    if (o.flap) o.flap(g);
    /* the punch-hole camera and the port */
    g.fillStyle = '#0c0e12'; el(g, 0, -SY + 30, 12, 12); g.fillStyle = 'rgba(244,237,224,.18)'; el(g, -3, -SY + 27, 4, 4);
    g.fillStyle = '#151a22'; rr(g, -34, PHH / 2 - 9, 68, 9, 4); g.fill();
    g.strokeStyle = 'rgba(244,237,224,' + (o.rim == null ? .5 : o.rim).toFixed(3) + ')'; g.lineWidth = 3 / Math.min(1, P.s) * .8; rr(g, -PW / 2, -PHH / 2, PW, PHH, 64); g.stroke();
    g.restore();
  }
  function portOf(P) { return [P.cx - Math.sin(P.rot || 0) * PHH / 2 * P.s, P.cy + Math.cos(P.rot || 0) * PHH / 2 * P.s]; }
  function cord(g, A, B, k, droop) {
    if (k <= 0) return;
    var c1 = [A[0], A[1] + (droop || 140)], c2 = [B[0] - 90, B[1] + 40];
    function P(u) { var a = (1 - u) * (1 - u) * (1 - u), b = 3 * u * (1 - u) * (1 - u), c = 3 * u * u * (1 - u), d = u * u * u; return [a * A[0] + b * c1[0] + c * c2[0] + d * B[0], a * A[1] + b * c1[1] + c * c2[1] + d * B[1]]; }
    g.save(); g.lineCap = 'round';
    [['rgba(0,0,0,.35)', 14, 4], ['#14171d', 10, 0], ['rgba(244,237,224,.22)', 2.5, -2]].forEach(function (L) {
      g.strokeStyle = L[0]; g.lineWidth = L[1]; g.beginPath();
      for (var i = 0; i <= 40; i++) { var u = (1 - k) + k * i / 40, p = P(u); if (i) g.lineTo(p[0], p[1] + L[2]); else g.moveTo(p[0], p[1] + L[2]); }
      g.stroke();
    });
    g.fillStyle = '#14171d'; rr(g, A[0] - 14, A[1] - 4, 28, 22, 5); if (k >= 1) g.fill();
    g.restore();
  }
  var SKIN2 = '#c49c78', SKIN3 = '#a98263';
  function hand(g) {
    /* cut paper: a torn sleeve, a fist with the index finger out (pointing left), one flat colour per piece, no outlines */
    var r = mulberry(404);
    g.fillStyle = '#3b4a60'; cut(g, [[10, -40], [150, -46], [156, 44], [6, 40]], r, 3);                 /* the sleeve, torn at the wrist */
    g.fillStyle = '#2f3d52'; cut(g, [[10, -40], [26, -42], [24, 40], [6, 40]], r, 2);
    g.fillStyle = SKIN; cut(g, [[14, -34], [-58, -40], [-70, -8], [-66, 36], [14, 34]], r, 2.2);         /* the fist */
    g.fillStyle = SKIN; cut(g, [[-50, -40], [-150, -42], [-156, -26], [-50, -20]], r, 1.6);              /* the index finger */
    g.fillStyle = SKIN2; cut(g, [[-64, -10], [-84, -6], [-84, 6], [-64, 10]], r, 1.2);                   /* curled knuckles */
    cut(g, [[-62, 12], [-80, 16], [-78, 28], [-60, 30]], r, 1.2);
    g.fillStyle = SKIN2; cut(g, [[-14, -34], [-50, -50], [-58, -40], [-20, -26]], r, 1.4);              /* the thumb over the fist */
    g.fillStyle = 'rgba(255,240,220,.4)'; cut(g, [[-146, -39], [-138, -39], [-138, -35], [-146, -35]], r, .6);
  }
  function ring(x, y, r) { var o = []; for (var i = 0; i < 9; i++) { var a = i / 9 * 6.283; o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return o; }
  /* =====================================================================================================
     THE PROPS (all cut paper, all drawn by hand)
     ===================================================================================================== */
  var CUR = 'hook';
  var DESK = 1414;
  var EXAMPLE_BG = 'rgba(16,22,28,.92)';
  var DENIM = '#22344c', DENIM2 = '#2d4565', DENIM3 = '#3b5a80', STITCH = '#d9b25c';
  var WOOD = '#3a2a1f', WOOD2 = '#2c2018', CASEM = '#2a2e36', FACE = '#efe7d6', REDZ = '#b84a3a', GHOST = '#9a917f', BOARD = '#1d3b33';

  /* ---------- backgrounds: they bleed full width and stay dark ---------- */
  function jeans(g) {
    g.fillStyle = DENIM; g.fillRect(-300, -300, W + 600, H + 600);
    var r = mulberry(51); g.fillStyle = 'rgba(255,255,255,.035)';
    for (var i = 0; i < 70; i++) g.fillRect(-300 + i * 24, -300, 3, H + 600);
    g.fillStyle = 'rgba(0,0,0,.12)'; for (i = 0; i < 40; i++) g.fillRect(-300 + r() * (W + 600), -300, 2 + r() * 3, H + 600);
    /* a side seam */
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(40, -300, 18, H + 600);
    g.strokeStyle = 'rgba(217,178,92,.55)'; g.lineWidth = 4; g.setLineDash([16, 12]); g.beginPath(); g.moveTo(70, -300); g.lineTo(70, H + 300); g.stroke(); g.setLineDash([]);
  }
  function bench(g) {
    g.fillStyle = WOOD; g.fillRect(-300, -300, W + 600, H + 600);
    var r = mulberry(77);
    for (var i = 0; i < 16; i++) { g.fillStyle = 'rgba(0,0,0,' + (.1 + r() * .1).toFixed(3) + ')'; g.fillRect(-300, -300 + i * 150, W + 600, 4); g.fillStyle = 'rgba(255,225,190,' + (.025 + r() * .02).toFixed(3) + ')'; g.fillRect(-300, -300 + i * 150 + 30 + r() * 70, W + 600, 2 + r() * 3); }
  }
  function wall(g, c) {
    g.fillStyle = c || '#151b25'; g.fillRect(-300, -300, W + 600, H + 600);
    g.fillStyle = 'rgba(255,255,255,.018)'; for (var x = -300; x < W + 300; x += 96) g.fillRect(x, -300, 40, H + 600);
  }

  /* ---------- the native move: the 5G tile, a two-sided paper tile (5G on the front, LTE on the back) ---------- */
  function tile(g, cx, cy, s, flip, rot) {
    var k = Math.cos(Math.PI * clamp(flip || 0, 0, 1)), sy = Math.max(.03, Math.abs(k)), lab = (flip || 0) < .5 ? '5G' : 'LTE';
    var w = 190, h = 116;
    g.save(); g.translate(cx, cy); g.rotate(rot || 0); g.scale(s, s * sy);
    var ex = EXITING; if (sy < .98) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 6, -h / 2 + 8, w, h, 20); g.fill();
    g.fillStyle = flip < .5 ? '#2c3646' : '#3a3346'; rr(g, -w / 2, -h / 2, w, h, 20); g.fill();
    rr(g, -w / 2, -h / 2, w, h, 20); grainIn(g, -w / 2, -h / 2, w, h, 2101, .9);
    g.strokeStyle = 'rgba(244,237,224,.45)'; g.lineWidth = 3; rr(g, -w / 2, -h / 2, w, h, 20); g.stroke();
    prop(g, lab + ' tile', -w / 2, -h / 2, w / 2, h / 2);
    onprop(function () { txt(g, lab, 0, 4, lab === '5G' ? 96 : 84, CREAM, 'center', 900, DISP, w - 26, 1, 40, 'condensed'); });
    EXITING = ex; g.restore();
  }
  /* the battery icon: an outline and four segments; no number ever goes in it */
  function battery(g, x, y, s, segs, blink) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.strokeStyle = CREAM; g.lineWidth = 9; rr(g, 0, -52, 236, 104, 22); g.stroke();
    g.fillStyle = CREAM; rr(g, 242, -20, 16, 40, 5); g.fill();
    prop(g, 'battery', -5, -57, 258, 57);
    var n = Math.floor(segs), f = segs - n;
    for (var i = 0; i < 4; i++) {
      var a = i < n ? 1 : i === n ? f : 0;
      if (i === n - 1 && blink != null) a *= blink;
      if (a <= .01) continue;
      g.globalAlpha = a; g.fillStyle = i === 0 && n <= 1 ? '#e8a23c' : CREAM; rr(g, 14 + i * 55, -38, 46, 76, 7); g.fill(); g.globalAlpha = 1;
    }
    g.restore();
  }
  function bars(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = CREAM;
    for (var b = 0; b < 4; b++) { var h = 26 + b * 18; rr(g, b * 30, 42 - h, 20, h, 4); g.fill(); }
    g.restore();
  }
  /* a status-bar row: bars, the 5G tile, the battery. o.flip, o.segs, o.blink, o.tile (false: the tile has left) */
  function statusRow(g, x, y, s, o) {
    bars(g, x, y, s);
    if (o.tile !== false) tile(g, x + 225 * s, y, s, o.flip || 0, 0);
    battery(g, x + 350 * s, y, s, o.segs == null ? 3 : o.segs, o.blink);
  }

  /* ---------- A: the phone top rising out of a jeans pocket ---------- */
  var PW0 = 760, PH0 = 940;
  function phoneTop(g, cx, y0, t, o) {
    o = o || {};
    var r = mulberry(61);
    g.save(); g.translate(cx, y0);
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, -PW0 / 2 + 14, 16, PW0, PH0, 96); g.fill();
    g.fillStyle = '#2a313d'; rr(g, -PW0 / 2, 0, PW0, PH0, 96); g.fill();
    rr(g, -PW0 / 2, 0, PW0, PH0, 96); grainIn(g, -PW0 / 2, 0, PW0, PH0, 811, .9);
    prop(g, 'phone', -PW0 / 2, 0, PW0 / 2, PH0);
    /* the screen */
    g.save(); rr(g, -PW0 / 2 + 26, 26, PW0 - 52, PH0 - 52, 74); g.clip();
    var gr = g.createLinearGradient(0, 26, 0, PH0); gr.addColorStop(0, '#16202e'); gr.addColorStop(1, '#0c121b'); g.fillStyle = gr; g.fillRect(-PW0 / 2, 0, PW0, PH0);
    var sc = (t * 26) % 150;
    for (var i = 0; i < 7; i++) { var yy = 250 + i * 150 - sc; g.fillStyle = 'rgba(244,237,224,.06)'; rr(g, -PW0 / 2 + 60, yy, PW0 - 120, 118, 18); g.fill(); }
    g.restore();
    g.fillStyle = '#05060a'; el(g, 0, 64, 20, 20);
    g.strokeStyle = 'rgba(244,237,224,.6)'; g.lineWidth = 3; rr(g, -PW0 / 2, 0, PW0, PH0, 96); g.stroke();
    g.fillStyle = '#1f252f'; rr(g, PW0 / 2 - 2, 190, 10, 110, 4); g.fill();
    statusRow(g, -322, 168, 1.06, { flip: 0, segs: o.segs, blink: o.blink, tile: o.tile });
    g.restore();
  }
  /* the denim pocket's front: drawn over the phone so it rises out of it */
  function pocket(g, t) {
    var y = 1318, r = mulberry(91);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.moveTo(96, y - 4); g.quadraticCurveTo(510, y - 46, 924, y - 4); g.lineTo(924, 1396); g.quadraticCurveTo(924, 1426, 894, 1426); g.lineTo(126, 1426); g.quadraticCurveTo(96, 1426, 96, 1396); g.closePath(); g.fill();
    g.fillStyle = DENIM3; g.beginPath(); g.moveTo(96, y + 8); g.quadraticCurveTo(510, y - 34, 924, y + 8); g.lineTo(924, 1390); g.quadraticCurveTo(924, 1418, 896, 1418); g.lineTo(124, 1418); g.quadraticCurveTo(96, 1418, 96, 1390); g.closePath(); g.fill();
    g.save(); g.clip(); grainIn(g, 96, y - 40, 828, 150, 931, 1.3);
    g.fillStyle = 'rgba(255,255,255,.05)'; for (var i = 0; i < 36; i++) g.fillRect(96 + i * 24, y - 40, 3, 160);
    g.restore();
    g.strokeStyle = STITCH; g.lineWidth = 4; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(104, y + 30); g.quadraticCurveTo(510, y - 12, 916, y + 30); g.stroke(); g.setLineDash([]);
    g.strokeStyle = STITCH; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(112, y + 40); g.lineTo(112, 1400); g.lineTo(908, 1400); g.lineTo(908, y + 40); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#c8a24e'; el(g, 140, y + 50, 13, 13); el(g, 880, y + 50, 13, 13); g.fillStyle = '#8a6b2c'; el(g, 140, y + 50, 6, 6); el(g, 880, y + 50, 6, 6);
    prop(g, 'pocket', 96, y - 34, 924, 1426);
  }
  /* frame 0's sticker on the screen: 5G DRAINING / IT? with the "?" in coral */
  function sticker(g, x, y, k) {
    if (k <= 0) return;
    var w = 600, h = 236, spx = 104;
    g.save(); g.translate(x, y); g.rotate(-.02); g.scale(k, k);
    var ex = EXITING; if (k < .999) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 8, -h / 2 + 11, w, h, 20); g.fill();
    g.fillStyle = CREAM; rr(g, -w / 2, -h / 2, w, h, 20); g.fill();
    rr(g, -w / 2, -h / 2, w, h, 20); grainIn(g, -w / 2, -h / 2, w, h, 1521, .6);
    prop(g, 'sticker', -w / 2, -h / 2, w / 2, h / 2);
    onprop(function () {
      txt(g, '5G DRAINING', 0, -50, spx, INK, 'center', 900, DISP, w - 40, 1, 60, 'condensed');
      font(g, spx, 900, DISP, 'condensed'); var w1 = g.measureText('IT').width, w2 = g.measureText('?').width, x0 = -(w1 + w2 + 4) / 2;
      txt(g, 'IT', x0, 58, spx, INK, 'left', 900, DISP, 0, 1, 60, 'condensed'); txt(g, '?', x0 + w1 + 4, 58, spx, HOT, 'left', 900, DISP, 0, 1, 60, 'condensed');
    });
    EXITING = ex; g.restore();
  }
  /* the search card: DOES 5G DRAIN BATTERY, typed in at ~1.5 s */
  function searchCard(g, x, y, t, a) {
    var SB = .62, sa = seg(t, SB, SB + .12) * (a == null ? 1 : a);
    if (sa <= 0 || !LIVE.text) return;
    var w = 660, h = 112, x0 = x - w / 2, y0 = y - h / 2, sc = lerp(.86, 1, Math.min(1, pop(t, SB, 3.4)));
    g.save(); g.globalAlpha *= sa; g.translate(x, y); g.scale(sc, sc); g.translate(-x, -y);
    var ex = EXITING; if (sc < .995 || sa < 1) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 8, y0 + 10, w, h, 56); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 56); g.fill();
    prop(g, 'search card', x0, y0, x0 + w, y0 + h);
    g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.arc(x0 + 60, y - 6, 18, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x0 + 73, y + 7); g.lineTo(x0 + 88, y + 22); g.stroke();
    var L = 'DOES 5G DRAIN BATTERY', k = seg(t, SB + .04, SB + .24), n = Math.round(L.length * k), typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
    onprop(function () { if (n) txt(g, L.slice(0, n), x0 + 112, y + 3, 56, INK, 'left', 900, DISP, w - 140, 1, 44, 'condensed'); });
    NOREC = nr;
    if (typing && Math.floor(t * 8) % 2 === 0) { font(g, 56, 900, DISP, 'condensed'); var cw = g.measureText(L.slice(0, n)).width; g.fillStyle = INK; g.fillRect(x0 + 116 + cw, y - 26, 5, 54); }
    EXITING = ex; g.restore();
  }
  /* a paper tag on a string: OFF? swings under the 5G tile */
  function swingTag(g, ax, ay, t, k, text) {
    if (k <= 0) return;
    var sw = .22 * Math.sin(t * 3.1) * (1 - .5 * k) + .3 * (1 - eout(k)), len = lerp(10, 58, eout(k));
    g.save(); g.translate(ax, ay); g.rotate(sw);
    var ex = EXITING; if (k < 1) EXITING = true;
    g.strokeStyle = '#d8cdb5'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, len); g.stroke();
    g.translate(0, len + 36);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -76, -34, 160, 76, 12); g.fill();
    g.fillStyle = PAPER; rr(g, -80, -38, 160, 76, 12); g.fill();
    g.fillStyle = '#0c0f14'; el(g, 0, -24, 6, 6);
    prop(g, 'off tag', -80, -38, 80, 38);
    onprop(function () { txt(g, text, 0, 6, 56, INK, 'center', 900, DISP, 140, 1, 40, 'condensed'); });
    EXITING = ex; g.restore();
  }

  /* =====================================================================================================
     A: the status bar, huge. The phone top rises 330 px out of a jeans pocket; the battery's last segment blinks.
     ===================================================================================================== */
  var Y0A = 820, Y0B = 470;
  /* the encoded frames sample t = (i + .5) / 30: frame 0 is t = 1/60 and the last frame TEND − 1/60. The end lands on
     exactly the picture the hook shows at t = 1/60 (YF0, the same phone time), so the loop seam is one picture */
  var YF0 = Y0A + (Y0B - Y0A) * (1 - Math.pow(1 - (1 / 60) / .55, 3));
  function hookPicture(g, t, o) {
    var y0 = o.y0;
    var exg = EXITING; if (o.moving) EXITING = true;
    /* frame 0: a small paper cell tower behind the phone, cellular waves pulsing out of its mast both ways (the phone rises
       in front of it and the tower fades as it settles); never Wi-Fi arcs */
    var aa = clamp((y0 - Y0B) / (Y0A - Y0B), 0, 1);
    if (aa > .02) { var dtt = o.dt == null ? t : o.dt, TX = 510, TT = 470, TB = 790, rt = mulberry(73); g.save(); g.globalAlpha *= aa; var exT = EXITING; EXITING = true;
      g.fillStyle = 'rgba(0,0,0,.35)'; poly(g, [[TX - 8 + 8, TT + 10], [TX + 8 + 8, TT + 10], [TX + 96 + 8, TB + 10], [TX - 96 + 8, TB + 10]]); g.fill();
      g.fillStyle = '#cfc3a8'; cut(g, [[TX - 9, TT], [TX + 9, TT], [TX + 96, TB], [TX - 96, TB]], rt, 1.4);
      g.strokeStyle = '#8f8570'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath();   /* the lattice */
      for (var i = 0; i < 4; i++) { var ya = TT + 50 + i * 66, yb = ya + 66, wa = 9 + (ya - TT) / (TB - TT) * 87, wb = 9 + (yb - TT) / (TB - TT) * 87; g.moveTo(TX - wa + 8, ya); g.lineTo(TX + wb - 8, yb); g.moveTo(TX + wa - 8, ya); g.lineTo(TX - wb + 8, yb); }
      g.stroke();
      g.fillStyle = CREAM; el(g, TX, TT - 4, 15, 15);
      for (i = 0; i < 3; i++) { var rad = 52 + i * 46 + 9 * Math.sin(dtt * 5 - i * 1.1), w2 = 16 - i * 3;
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = w2; [[-.62, .62], [Math.PI - .62, Math.PI + .62]].forEach(function (A) { g.beginPath(); g.arc(TX + 5, TT + 2, rad, A[0], A[1]); g.stroke(); });
        g.strokeStyle = i === 0 ? CREAM : i === 1 ? '#e6dcc6' : '#cfc3a8'; [[-.62, .62], [Math.PI - .62, Math.PI + .62]].forEach(function (A) { g.beginPath(); g.arc(TX, TT - 4, rad, A[0], A[1]); g.stroke(); }); }
      EXITING = exT; g.restore(); }
    phoneTop(g, 510, y0, o.dt == null ? t : o.dt, { segs: o.segs, blink: o.blink, tile: o.tile });
    EXITING = exg;
    /* the sticker on the screen */
    var exs = EXITING; if (o.moving || o.sdrop > 0) EXITING = true;
    sticker(g, 510, y0 + 380 + 110 * eio(o.sdrop || 0) + drift(o.dt == null ? t : o.dt, .9, .25), 1);
    EXITING = exs;
  }
  function hookScene(g, t) {
    if (LAYER === 'bg') { jeans(g); return; }
    var gk = eout(seg(t, 0, .55)), y0 = lerp(Y0A, Y0B, gk) + drift(t, .2, .4) * seg(t, .6, 1.2);
    var hk = seg(t, K.HK, K.HK + .12);                              /* the battery starts on 2 bars and loses one on the tick */
    var segs = 2 - hk, blink = hk > 0 ? null : .45 + .55 * Math.abs(Math.cos(t * 3.4));
    if (hk >= 1) { segs = 1; blink = .6 + .4 * Math.abs(Math.cos(t * 2.2)); }
    var lift = seg(t, S('bench').t0 - .9, S('bench').t0 - .5);              /* the 5G tile peels off the status bar and flies up (it lands on the bench) */
    var sdrop = seg(t, K.ask - .7, K.ask - .3);
    hookPicture(g, t, { y0: y0, moving: gk < 1, segs: segs, blink: blink, tile: lift <= 0, sdrop: sdrop });
    if (lift > 0) { var e = eio(lift), ex = EXITING; EXITING = true; tile(g, lerp(510 - 322 + 225 * 1.06, 840, e), lerp(Y0B + 168, 560, e) - 90 * Math.sin(Math.PI * e), 1.06 * lerp(1, .8, e), 0, -.5 * e); EXITING = ex; }
    /* the falling segment */
    if (hk > 0 && hk < 1.5) { var fk = seg(t, K.HK, K.HK + .45); if (fk < 1) { var bx = 510 - 322 + 350 * 1.06 + (14 + 1 * 55 + 23) * 1.06, by = y0 + 168 + fk * fk * 260; g.save(); g.globalAlpha *= 1 - fk; g.translate(bx, by); g.rotate(fk * 1.6); g.fillStyle = CREAM; rr(g, -24, -40, 48, 80, 7); g.fill(); g.restore(); } }
    searchCard(g, 510, y0 + 640 + 40 * eio(sdrop), t, 1);
    /* ask: a paper hand reaches for the 5G tile and hovers; OFF? swings on a string under it */
    var hk2 = eout(seg(t, K.ask - .2, K.turn + .1));
    if (hk2 > 0 && lift < .5) {
      var tx = 510 - 322 + 225 * 1.06 + 60, ty = y0 + 168 + 82 + 6 * Math.sin(t * 4.2);
      g.save(); g.translate(lerp(1180, tx + 156 * .9, hk2), ty + 33 * .9); g.scale(.9, .9); var exh = EXITING; EXITING = true; hand(g); EXITING = exh; g.restore();
    }
    var tg = seg(t, K.ask - .5, K.ask - .15);                         /* hangs from the first signal bar, clear of the dropped sticker */
    if (tg > 0) swingTag(g, 205, y0 + 168 + 46, t, tg, 'OFF?');
    pocket(g, t);
  }

  /* =====================================================================================================
     B: the lab bench, top-down. A bench power meter (ENERGY PER BIT, two needles: 5G ink, 4G ghost) wired to a phone on
     its back. Fail: a drip of data, the 5G needle climbs into the red, tape 1 prints. Pass: a flood, the needles cross,
     tape 2. Hero: a slate slides over and the summary is drawn in chalk.
     ===================================================================================================== */
  var CW = 544, CXU = .68;     /* the chart: chalk width and where the lines cross */
  var LANDP = [780, 990];     /* where the 5G tile sits on the red lead (set by benchScene) */
  var MX0 = 120, MY0 = 470, MX1 = 900, MY1 = 905, PIV = [510, 800], NR = 215;
  function vAng(v) { return (-155 + 130 * v) * Math.PI / 180; }
  function needle(g, v, col, len, w, ghost) {
    var a = vAng(v);
    g.save(); g.translate(PIV[0], PIV[1]); g.rotate(a);
    g.fillStyle = 'rgba(0,0,0,.25)'; poly(g, [[0, -w / 2 + 6], [len, 4], [len, 8], [0, w / 2 + 6]]); g.fill();
    g.fillStyle = col; poly(g, [[-30, -w / 2], [len, -1.5], [len, 1.5], [-30, w / 2]]); g.fill();
    if (ghost) { g.strokeStyle = '#5c5548'; g.lineWidth = 2.5; poly(g, [[-30, -w / 2], [len, -1.5], [len, 1.5], [-30, w / 2]]); g.stroke(); }
    g.restore();
  }
  /* the needle flags (r2): drawn after both needles, the 5G flag far out on its needle (r 150), the ghost 4G flag near
     the pivot (r 80), so they never stack when the needles are close; both appear once the needles have woken and keep
     ≥ 20 px off LOW and HIGH */
  function needleTag(g, v, r, label, ghost, a) {
    if (a <= 0) return;
    var an = vAng(v), x = PIV[0] + Math.cos(an) * r, y = PIV[1] + Math.sin(an) * r;
    onprop(function () { chip(g, label, x, y, { px: 38, wt: 900, bg: ghost ? FACE : INK, fg: ghost ? '#5c5548' : CREAM, line: ghost ? '#5c5548' : null, lw: 3, r: 10, st: 'condensed', shadow: false, w: 76, h: 50, a: a }); });
  }
  function meter(g, t, v5, v4, red) {
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, MX0 + 14, MY0 + 18, MX1 - MX0, MY1 - MY0, 30); g.fill();
    g.fillStyle = CASEM; rr(g, MX0, MY0, MX1 - MX0, MY1 - MY0, 30); g.fill();
    rr(g, MX0, MY0, MX1 - MX0, MY1 - MY0, 30); grainIn(g, MX0, MY0, MX1 - MX0, MY1 - MY0, 2201, 1.1);
    prop(g, 'power meter', MX0, MY0, MX1, MY1);
    /* the face */
    g.fillStyle = FACE; rr(g, MX0 + 30, MY0 + 30, MX1 - MX0 - 60, 330, 18); g.fill();
    rr(g, MX0 + 30, MY0 + 30, MX1 - MX0 - 60, 330, 18); grainIn(g, MX0 + 30, MY0 + 30, MX1 - MX0 - 60, 330, 2202, .6);
    /* the scale: an arc, ticks, the red zone at the high end */
    g.lineCap = 'butt';
    g.strokeStyle = REDZ; g.lineWidth = 30; g.globalAlpha = .55 + .45 * (red || 0); g.beginPath(); g.arc(PIV[0], PIV[1], NR - 16, vAng(.72), vAng(1)); g.stroke(); g.globalAlpha = 1;
    g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(PIV[0], PIV[1], NR, vAng(0), vAng(1)); g.stroke();
    for (var i = 0; i <= 20; i++) { var a = vAng(i / 20), l = i % 5 === 0 ? 34 : 18; g.lineWidth = i % 5 === 0 ? 5 : 3; g.beginPath(); g.moveTo(PIV[0] + Math.cos(a) * NR, PIV[1] + Math.sin(a) * NR); g.lineTo(PIV[0] + Math.cos(a) * (NR - l), PIV[1] + Math.sin(a) * (NR - l)); g.stroke(); }
    onprop(function () {
      txt(g, 'LOW', 262, 764, 36, INK, 'center', 900, DISP, 0, 1, 36, 'condensed');     /* r2: out in the face's corners, clear of both flags */
      txt(g, 'HIGH', 758, 764, 36, INK, 'center', 900, DISP, 0, 1, 36, 'condensed');
      txt(g, 'ENERGY PER BIT', PIV[0], MY0 + 46, 38, INK, 'center', 900, DISP, 420, 1, 36, 'condensed');
      chip(g, 'LOWER = BETTER', PIV[0], MY0 + 87, { px: 36, wt: 900, bg: INK, fg: CREAM, r: 10, st: 'condensed', shadow: false, h: 42 });
    });
    /* the rest peg, outside the scale */
    g.fillStyle = '#6b6457'; el(g, PIV[0] + Math.cos(vAng(-.13)) * (NR - 40), PIV[1] + Math.sin(vAng(-.13)) * (NR - 40), 9, 9);
    needle(g, v4, '#d9d0bd', NR - 30, 18, true);
    needle(g, v5, '#1d2027', NR - 22, 20, false);
    g.fillStyle = '#1d2027'; el(g, PIV[0], PIV[1], 26, 26); g.fillStyle = '#5c5548'; el(g, PIV[0] - 6, PIV[1] - 7, 8, 8);
    var ta = seg(t, K.wired + .45, K.wired + .65);
    needleTag(g, v4, 80, '4G', true, ta);
    needleTag(g, v5, 150, '5G', false, ta);
    /* the body strip: the name and two jacks */
    onprop(function () { txt(g, 'POWER METER', MX0 + 44, MY1 - 34, 36, CREAM, 'left', 900, DISP, 0, 1, 36, 'semi-expanded'); });
    g.fillStyle = '#111317'; el(g, 770, MY1 - 34, 17, 17); el(g, 836, MY1 - 34, 17, 17);
    g.fillStyle = '#b8402f'; el(g, 770, MY1 - 34, 8, 8); g.fillStyle = '#d9d0bd'; el(g, 836, MY1 - 34, 8, 8);
  }
  /* the phone on its back, the back panel off: a board, and where the battery goes, an empty slot with the leads clipped in */
  var PB = { x0: 150, y0: 932, x1: 700, y1: 1112 };
  function benchPhone(g, t) {
    var x0 = PB.x0, y0 = PB.y0, w = PB.x1 - PB.x0, h = PB.y1 - PB.y0;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 12, y0 + 16, w, h, 54); g.fill();
    g.fillStyle = '#2a313d'; rr(g, x0, y0, w, h, 54); g.fill();
    rr(g, x0, y0, w, h, 54); grainIn(g, x0, y0, w, h, 2301, .9);
    prop(g, 'phone on its back', x0, y0, x0 + w, y0 + h);
    g.fillStyle = BOARD; rr(g, x0 + 22, y0 + 22, w - 44, h - 44, 36); g.fill();
    g.strokeStyle = 'rgba(214,190,120,.35)'; g.lineWidth = 4; for (var i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x0 + 60, y0 + 46 + i * 28); g.lineTo(x0 + 150, y0 + 46 + i * 28); g.lineTo(x0 + 190, y0 + 60 + i * 16); g.stroke(); }
    g.fillStyle = '#3a3f48'; rr(g, x0 + 80, y0 + 52, 100, 76, 8); g.fill(); g.fillStyle = '#2b2f36'; rr(g, x0 + 92, y0 + 64, 76, 52, 6); g.fill();
    /* the antenna strip at the right end */
    g.fillStyle = '#c9a24c'; g.fillRect(x0 + w - 44, y0 + 30, 8, h - 60);
    /* the empty battery slot, dashed */
    g.strokeStyle = 'rgba(244,237,224,.55)'; g.lineWidth = 4; g.setLineDash([14, 10]); rr(g, x0 + 236, y0 + 38, 250, h - 76, 12); g.stroke(); g.setLineDash([]);
  }
  function lead(g, A, B, col, k, sag) {
    if (k <= 0) return;
    var c1 = [A[0] + 30, A[1] + (sag || 80)], c2 = [B[0] + 120, B[1] - 40];
    function P(u) { var a = (1 - u) * (1 - u) * (1 - u), b = 3 * u * (1 - u) * (1 - u), c = 3 * u * u * (1 - u), d = u * u * u; return [a * A[0] + b * c1[0] + c * c2[0] + d * B[0], a * A[1] + b * c1[1] + c * c2[1] + d * B[1]]; }
    g.save(); g.lineCap = 'round';
    [['rgba(0,0,0,.35)', 15, 5], [col, 11, 0], ['rgba(255,255,255,.22)', 3, -2]].forEach(function (L) {
      g.strokeStyle = L[0]; g.lineWidth = L[1]; g.beginPath();
      for (var i = 0; i <= 40; i++) { var p = P(k * i / 40); if (i) g.lineTo(p[0], p[1] + L[2]); else g.moveTo(p[0], p[1] + L[2]); }
      g.stroke();
    });
    var e = P(k);
    if (k >= 1) { g.fillStyle = '#c9c2b2'; rr(g, e[0] - 22, e[1] - 12, 44, 24, 6); g.fill(); g.fillStyle = col; rr(g, e[0] + 14, e[1] - 8, 16, 16, 4); g.fill(); }
    g.restore();
    return P;
  }
  /* the printed tape: a long strip of receipt paper; slides up from the bottom, fully printed (number and scope together) */
  function tapeStrip(g, x0, y0, w, lines, inn, out, seed) {
    if (inn <= 0 || out >= 1) return;
    var h = 0; lines.forEach(function (L) { h += L[1] * 1.14; }); h += 46;
    var ei = eout(clamp(inn, 0, 1)), eo = eio(clamp(out, 0, 1)), ex = EXITING;
    g.save();
    if (ei < 1) { g.translate(-160 * (1 - ei), 0); g.globalAlpha *= seg(ei, 0, .5); EXITING = true; }
    if (eo > 0) { EXITING = true; g.translate(x0 + w, y0); g.rotate(.5 * eo); g.translate(-(x0 + w), -y0); g.translate(520 * eo, -160 * eo); g.globalAlpha *= 1 - seg(eo, .6, 1); }
    var r = mulberry(seed);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x0 + 8, y0 + 12, w, h);
    g.fillStyle = '#f7f2e7'; g.beginPath(); g.moveTo(x0, y0);
    for (var i = 0; i <= 26; i++) g.lineTo(x0 + w * i / 26, y0 + (i % 2 ? 9 : 0));
    g.lineTo(x0 + w, y0 + h); for (i = 26; i >= 0; i--) g.lineTo(x0 + w * i / 26, y0 + h - (i % 2 ? 0 : 8) - r() * 2);
    g.closePath(); g.fill();
    g.save(); g.clip(); grainIn(g, x0, y0, w, h, seed + 1, .5); g.restore();
    prop(g, 'tape', x0, y0, x0 + w, y0 + h);
    var y = y0 + 28;
    onprop(function () { lines.forEach(function (L) { var lh = L[1] * 1.14; txt(g, L[0], x0 + w / 2, y + lh / 2, L[1], L[2] || INK, 'center', 900, DISP, w - 50, 1, 36, 'condensed'); y += lh; }); });
    EXITING = ex; g.restore();
  }
  /* data: a drip of small dots (slow), then a flood of fat blocks (full speed), into the phone's antenna from the right */
  function data(g, t) {
    var A = [930, 990], B = [PB.x1 - 30, 1010];
    var d0 = K.slowW - .25, d1 = K.full - .05, f1 = K.barely - .2;
    function stream(t0, t1, every, trav, size, fat, seedK) {
      var n0 = Math.max(0, Math.floor((t - trav - t0) / every)), n1 = Math.floor((Math.min(t, t1) - t0) / every);
      for (var i = n0; i <= n1; i++) {
        var ts = t0 + i * every, u = (t - ts) / trav; if (u < 0 || u > 1) continue;
        var r = mulberry(seedK + i), dy = (r() - .5) * (fat ? 90 : 30), x = lerp(A[0], B[0], u), y = lerp(A[1] + dy, B[1] + dy * .3, u) - 30 * Math.sin(u * Math.PI);
        g.save(); g.globalAlpha *= seg(u, 0, .08) * (1 - seg(u, .88, 1));
        g.fillStyle = 'rgba(0,0,0,.3)'; if (fat) rr(g, x - size / 2 + 4, y - size * .35 + 5, size, size * .7, 5), g.fill(); else el(g, x + 3, y + 4, size / 2, size / 2);
        g.fillStyle = fat ? (i % 3 ? '#e9d9a8' : CREAM) : CREAM; if (fat) { rr(g, x - size / 2, y - size * .35, size, size * .7, 5); g.fill(); } else el(g, x, y, size / 2, size / 2);
        g.restore();
      }
    }
    if (t > d0 && t < d1 + 1) stream(d0, d1, .42, .75, 26, false, 3100);
    if (t > K.full - .1 && t < f1 + .5) stream(K.full - .1, f1, .045, .42, 40, true, 3300);
  }
  function needles(t) {
    var awake = seg(t, K.wired + .1, K.wired + .5), jit = .015 * Math.sin(t * 17) + .01 * Math.sin(t * 29 + 1);
    var v5 = lerp(-.13, .3 + jit, eout(awake)), v4 = lerp(-.13, .17 - jit * .7, eout(awake));
    /* the fail: on "seventy-nine" the 5G needle slams into the red (K.F79, ~10.29 s); tape 1 prints on that frame */
    var f = eio(seg(t, K.p79 - .12, K.F79));
    v5 = lerp(v5, .9 + jit * .5, f); v4 = lerp(v4, .48 - jit * .5, f);
    v5 += .035 * decay(t, K.F79, 22, 6) + .03 * decay(t, K.SW, 22, 6);
    /* the pass: on "five" (14.10) the needles swap in 0.35 s: 5G falls to LOW, the ghost 4G rises past it; tape 2 prints
       on the frame the swing ends (K.SWAP) */
    var p = eio(seg(t, K.fiveW, K.SWAP));
    v5 = lerp(v5, .07 + jit * .4, p); v4 = lerp(v4, .66 + jit * .4, p);
    v5 -= .025 * decay(t, K.SWAP, 20, 6);
    return [v5, v4, f * (1 - p)];
  }
  function benchScene(g, t) {
    if (LAYER === 'bg') { bench(g); return; }
    var E0 = S('bench').t0;
    /* the wow: the camera punches in on the meter face 1.00 → 1.12 while the needles swap (0.4 s), settles on the slap,
       eases back out under the chart slate. The face is cropped by the frame edge while pushed in (a camera move). */
    var push = .12 * eio(seg(t, K.fiveW, K.fiveW + .4)) * (1 - eio(seg(t, K.TP, K.barely + .1)));
    var PCX = 510, PCY = 537;
    function mp(x, y) { return [PCX + (x - PCX) * (1 + push), PCY + (y - PCY) * (1 + push)]; }
    var NV = needles(t);
    var mk0 = eout(seg(t, E0 - .5, E0 + .05)), exm = EXITING; if (mk0 < 1 || push > 0) EXITING = true;
    g.save(); g.translate(0, -60 * (1 - mk0)); g.translate(PCX, PCY); g.scale(1 + push, 1 + push); g.translate(-PCX, -PCY); meter(g, t, NV[0], NV[1], NV[2]); g.restore();
    EXITING = exm;
    benchPhone(g, t);
    /* the leads: from the meter's jacks round to the battery slot; plugged on "wired" */
    var lk = eout(seg(t, K.wired - .15, K.wired + .35));
    var Pr = lead(g, mp(770, MY1 - 34), [PB.x0 + 330, PB.y0 + 70], '#b8402f', lk, 90);
    lead(g, mp(836, MY1 - 34), [PB.x0 + 400, PB.y0 + 112], '#d9d0bd', lk, 130);
    /* the 5G tile drops from where it left the status bar and clips onto the red lead: the lead's label */
    var tk = seg(t, E0 - .2, K.wired + .35);
    LANDP = Pr && lk > .55 ? Pr(.42) : [780, 990];
    if (tk > 0 && t < K.TL0) {   /* from K.TL0 the tile hops off the lead onto the chalk chart (heroSlate) */
      var land = LANDP, e = eout(tk), ex = EXITING; if (tk < 1) EXITING = true;
      tile(g, lerp(840, land[0] + 6, e), lerp(560, land[1] - 6, e) - 60 * Math.sin(Math.PI * e) + 3 * Math.sin(t * 2.3) * seg(tk, .9, 1), lerp(.85, .62, e), 0, lerp(-.5, .06, e));
      EXITING = ex;
    }
    data(g, t);
    /* the meter's tape slot: empty until a needle has landed; the tapes feed out of it */
    var sl = seg(t, K.slow - .1, K.slow + .25);
    if (sl > 0) { g.save(); g.globalAlpha *= sl; g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, 128, 1134, 780, 26, 13); g.fill(); g.fillStyle = '#14171d'; rr(g, 120, 1128, 780, 24, 12); g.fill(); g.fillStyle = 'rgba(244,237,224,.22)'; g.fillRect(140, 1131, 740, 3); g.restore(); }
    /* the empty tape slot under the bench (fix r2.1): a dashed cream outline where the tape will print, from "At slow"
       until the summary plate lands in it; its dashes creep, so the waiting slot is never a still */
    var ds = seg(t, K.slow, K.slow + .25) * (1 - seg(t, K.PLATE + .2, K.PLATE + .3));
    if (ds > 0) { g.save(); g.globalAlpha *= ds * .3; g.strokeStyle = CREAM; g.lineWidth = 5; g.setLineDash([22, 14]); g.lineDashOffset = -t * 24; rr(g, 130, 1156, 760, 250, 14); g.stroke(); g.setLineDash([]); g.restore(); }
    /* the credit plate (test): 2021 and who ran it; peels before the tape prints */
    var c0 = seg(t, S('bench').t0 - .3, S('bench').t0), c1 = seg(t, K.slow - .15, K.slow + .2);
    if (c0 > 0 && c1 < 1) {
      var exc = EXITING; if (c0 < 1 || c1 > 0) EXITING = true;
      g.save(); g.translate(-90 * (1 - eout(c0)) - 520 * eio(c1), 0); g.globalAlpha *= seg(c0, 0, .5) * (1 - seg(c1, .5, 1));
      sheet(g, 120, 1160, 900, 1340, 2401, PAPER, 'credit plate');
      onprop(function () {
        chip(g, '2021', 236, 1250, { px: 74, wt: 900, bg: INK, fg: CREAM, r: 14, st: 'condensed', shadow: false });
        txt(g, 'U. MINNESOTA · U. MICHIGAN', 352, 1218, 44, INK, 'left', 900, DISP, 520, 1, 36, 'condensed');
        txt(g, 'SIGCOMM 2021 PAPER', 352, 1282, 38, '#4b4540', 'left', 800, DISP, 470, 1, 36, 'condensed');
      });
      g.restore(); EXITING = exc;
    }
    /* tape 1 (fail) and tape 2 (pass): each carries its scope from its first frame */
    /* each tape prints on the frame its needle lands (K.F79, K.SWAP), never while the needles say otherwise */
    tapeStrip(g, 120, 1150, 780, [['UP TO 79% LESS EFFICIENT', 64], ['THAN 4G · AT LOW SPEEDS', 46], ['mmWAVE 5G · ONE PHONE · VERIZON · 2021', 40, '#3d3832'], ['(GALAXY S20 ULTRA)', 36, '#5d564c']], seg(t, K.F79, K.F79 + .1), seg(t, K.fiveW - .62, K.fiveW - .35), 2501);
    tapeStrip(g, 120, 1150, 780, [['UP TO 5× MORE EFFICIENT', 64], ['THAN 4G · AT HIGH SPEEDS', 46], ['mmWAVE 5G · ONE PHONE · VERIZON · 2021', 40, '#3d3832'], ['(GALAXY S20 ULTRA)', 36, '#5d564c']], seg(t, K.SWAP, K.SWAP + .1), seg(t, K.PLATE, K.PLATE + .25), 2601);   /* r2: a peel at the 15.7 wipe left it 1.1 s, under readcheck's 2.77 s; it prints on the swap (truth), so it holds to the plate */
    /* the hero: the slate slides over and the summary is drawn in chalk */
    heroSlate(g, t);
  }
  function heroSlate(g, t) {
    var sIn = seg(t, K.barely - .5, K.barely - .1);
    if (sIn <= 0) return;
    /* a slow push on the clean hold (no hand on it), so the hero never freezes */
    var hp = .02 * sio(seg(t, K.RING1, S('set').t0)), exh0 = EXITING;
    g.save(); g.translate(510, 800); g.scale(1 + hp, 1 + hp); g.translate(-510, -800);
    var e = eout(sIn), ex = EXITING; if (sIn < 1) EXITING = true;
    g.save(); g.translate(-980 * (1 - e), 0);
    var x0 = 112, y0 = 470, w = 796, h = 650;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 12, y0 + 16, w, h, 18); g.fill();
    g.fillStyle = '#26303a'; rr(g, x0, y0, w, h, 18); g.fill(); rr(g, x0, y0, w, h, 18); grainIn(g, x0, y0, w, h, 2701, 1.2);
    g.strokeStyle = '#8a6b3c'; g.lineWidth = 12; rr(g, x0 + 6, y0 + 6, w - 12, h - 12, 14); g.stroke();
    prop(g, 'chart slate', x0, y0, x0 + w, y0 + h);
    var OX = 196, OY = 1060, XR = 870, YT = 560;
    var ax = seg(t, K.barely - .15, K.barely + .15);
    g.strokeStyle = 'rgba(244,237,224,.8)'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(OX, OY - (OY - YT) * ax); g.lineTo(OX, OY); g.lineTo(OX + (XR - OX) * ax, OY); g.stroke();
    if (ax >= 1) { g.beginPath(); g.moveTo(OX - 14, YT + 20); g.lineTo(OX, YT); g.lineTo(OX + 14, YT + 20); g.moveTo(XR - 20, OY - 14); g.lineTo(XR, OY); g.lineTo(XR - 20, OY + 14); g.stroke(); }
    onprop(function () {
      txt(g, 'ENERGY PER BIT', OX + 24, YT - 6, 40, CREAM, 'left', 800, DISP, 0, ax, 36, 'condensed');
      txt(g, 'LOWER = BETTER', OX + 24, YT + 36, 36, CREAM, 'left', 800, DISP, 0, ax, 36, 'condensed');
      txt(g, 'DATA SPEED', XR - 4, OY + 36, 38, CREAM, 'right', 800, DISP, 0, ax, 36, 'condensed');
    });
    /* chalk lines: 4G (cream) and 5G (coral) cross; qualitative, no numbers. They end at x 760 so the line chips sit
       right of their ends and the FAST label has the floor under the crossing to itself */
    var LW = CW;
    function y4(u) { return 780 + 90 * u; }
    function y5(u) { return 640 + 280 * Math.pow(u, .85); }
    function chalk(fy, k, col, wd) {
      if (k <= 0) return;
      g.strokeStyle = col; g.lineWidth = wd; g.beginPath();
      for (var i = 0; i <= 40; i++) { var u = k * i / 40, x = OX + 20 + LW * u, y = fy(u) + 2 * Math.sin(u * 37); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
    var k4 = eio(seg(t, K.barely - .05, K.barely + .4)), k5 = eio(seg(t, K.barely + .2, K.costs + .2));
    chalk(y4, k4, 'rgba(244,237,224,.92)', 10);
    chalk(y5, k5, HOT, 12);
    /* the crossing, ringed in chalk on the hit */
    var ck = seg(t, K.RING0, K.RING1);
    if (ck > 0) { var cxu = CXU, cxx = OX + 20 + LW * cxu, cyy = y4(cxu); g.strokeStyle = 'rgba(244,237,224,.9)'; g.lineWidth = 6; g.beginPath(); for (var q = 0; q <= 40 * ck; q++) { var an = -1.2 + q / 40 * 6.6, rr2 = 44 + 4 * Math.sin(q * .7); if (q) g.lineTo(cxx + Math.cos(an) * rr2 * 1.25, cyy + Math.sin(an) * rr2); else g.moveTo(cxx + Math.cos(an) * rr2 * 1.25, cyy + Math.sin(an) * rr2); } g.stroke();
      /* on "barely" a chalk dot is pressed into the crossing */
      var dk = pop(t, K.barelyW - .02, 4); if (dk > 0) { g.fillStyle = 'rgba(244,237,224,.95)'; el(g, cxx, cyy, 11 * dk, 11 * dk); } }
    g.lineCap = 'butt';
    var xe = OX + 20 + LW;
    onprop(function () {
      if (k4 > .95) chip(g, '4G', xe + 48, y4(1) - 4, { px: 38, wt: 900, bg: '#26303a', fg: CREAM, line: CREAM, lw: 3, r: 10, st: 'condensed', shadow: false, w: 74, h: 50 });
      var la = seg(t, K.b5 - .05, K.b5 + .1), lb = seg(t, K.costs + .15, K.costs + .3);
      txt(g, 'SLOW: 5G COSTS MORE', OX + 104, 652, 46, CREAM, 'left', 900, DISP, 560, la, 40, 'condensed');
      txt(g, 'FAST: 5G COSTS LESS', XR - 4, 990, 46, CREAM, 'right', 900, DISP, 480, lb, 40, 'condensed');
    });
    g.restore(); EXITING = ex;
    /* the wow (r2): the status bar's 5G tile hops off the lead as the slate wipes in, rides the coral line's chalk tip
       from the SLOW end down through the crossing, and hops onto the FAST end with one small settle; it is the 5G line's
       label from then on */
    var T0 = K.TL0, T1 = K.barely + .2, T2 = K.costs + .2, T3 = T2 + .28;
    if (t >= T0) {
      var hx0 = OX + 20, sx5, sy5, srot, ssc = .42, mv = true, SPOT = [xe + 48, y5(1) + 8];
      if (t < T1) { var fa = eio(seg(t, T0, T1)); sx5 = lerp(LANDP[0] + 6, hx0, fa); sy5 = lerp(LANDP[1] - 6, y5(0), fa) - 150 * Math.sin(Math.PI * fa); srot = lerp(.06, .35, fa); ssc = lerp(.62, .42, fa); }
      else if (t < T2) { var uu = k5, sl5 = 280 * .85 * Math.pow(Math.max(uu, .02), -.15) / LW; sx5 = hx0 + LW * uu; sy5 = y5(uu); srot = .6 * Math.atan(sl5); }
      else { var hk3 = sio(seg(t, T2, T3)), sl1 = Math.atan(280 * .85 / LW) * .6; sx5 = lerp(hx0 + LW, SPOT[0], hk3); sy5 = lerp(y5(1), SPOT[1], hk3) - 46 * Math.sin(Math.PI * hk3) - 7 * Math.max(0, decay(t, T3, 20, 9)); srot = lerp(sl1, 0, hk3); mv = t < T3 + .3; }
      var ext = EXITING; if (mv) EXITING = true;
      tile(g, sx5, sy5, ssc, 0, srot);
      EXITING = ext;
    }
    /* the plate under it: the DM line, our summary, scoped */
    var pa = fin(t, K.PLATE, 4.5);
    if (pa > 0) {
      var exp = EXITING; if (pa < 1) EXITING = true;
      g.save(); g.globalAlpha *= pa; g.translate(0, 30 * (1 - pa) + 5 * Math.max(0, decay(t, K.HR, 18, 7)));
      sheet(g, 112, 1142, 908, 1414, 2801, PAPER, 'summary plate');
      onprop(function () {
        txt(g, '5G COSTS EXTRA', 510, 1196, 66, INK, 'center', 900, DISP, 740, 1, 48, 'condensed');
        txt(g, 'WHEN YOU BARELY USE IT', 510, 1268, 66, INK, 'center', 900, DISP, 740, 1, 48, 'condensed');
        txt(g, 'OUR SUMMARY · SIGCOMM', 510, 1330, 38, '#4b4540', 'center', 800, DISP, 740, 1, 36, 'condensed');
        txt(g, 'mmWAVE 5G · ONE PHONE · VERIZON · 2021', 510, 1376, 36, '#5d564c', 'center', 800, DISP, 740, 1, 36, 'condensed');
      });
      g.restore(); EXITING = exp;
    }
    g.restore(); EXITING = exh0;
    /* a paper hand with a stick of chalk comes in from the lower left (under the lines, clear of every label), rings
       the crossing on "extra" and is gone by "barely": the finished chart then holds clean, about 1.8 s */
    var cX = 196 + 20 + CW * CXU, cY = 780 + 90 * CXU;
    var hIn = sio(seg(t, K.RING0 - .5, K.RING0)), hOut = sio(seg(t, K.RING1 + .05, K.RING1 + .4));
    if (hIn > 0 && hOut < 1) {
      var ck2 = seg(t, K.RING0, K.RING1), an = -1.2 + ck2 * 6.6, tipx = cX + Math.cos(an) * 55, tipy = cY + Math.sin(an) * 44;
      var hx = lerp(-260, tipx, hIn), hy = lerp(940, tipy, hIn);
      hx = lerp(hx, -260, hOut); hy = lerp(hy, 960, hOut);
      var exq = EXITING; EXITING = true;
      g.save(); g.translate(hx, hy); g.rotate(-.15); g.scale(-1, 1);   /* mirrored: the finger points right, the arm stays above the FAST label */
      g.fillStyle = '#f4ede0'; rr(g, -14, -10, 40, 16, 4); g.fill();
      g.translate(26 + 156 * .9, 33 * .9 - 2); g.scale(.9, .9); hand(g); g.restore();
      EXITING = exq;
    }
  }

  /* =====================================================================================================
     C: the settings, upright. A re-created generic screen (no checkmark, no switch). The tile flips to LTE and back;
     the phone turns over to a Pixel screen and back; a paper arrow points at 5G On while the battery loses a segment.
     ===================================================================================================== */
  var SX0 = 132, SY0 = 468, SX1 = 888, SY1 = 1030;
  function setPhone(g, t, mode, flip, segs, arrowK) {
    var r = mulberry(71), w = SX1 - SX0, h = SY1 - SY0;
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.moveTo(SX0 + 12, SY0 + 110); g.arcTo(SX0 + 12, SY0 + 16, SX0 + 110, SY0 + 16, 90); g.arcTo(SX1 + 12, SY0 + 16, SX1 + 12, SY0 + 110, 90); g.lineTo(SX1 + 12, SY1 + 14); g.lineTo(SX0 + 12, SY1 + 14); g.closePath(); g.fill();
    g.fillStyle = '#2a313d'; g.beginPath(); g.moveTo(SX0, SY0 + 90); g.arcTo(SX0, SY0, SX0 + 90, SY0, 90); g.arcTo(SX1, SY0, SX1, SY0 + 90, 90);
    for (var i = 0; i <= 22; i++) g.lineTo(SX1 - w * i / 22, SY1 - r() * 18);
    g.closePath(); g.fill();
    prop(g, 'settings phone', SX0, SY0, SX1, SY1);
    var ix0 = SX0 + 22, iy0 = SY0 + 22, iw = w - 44;
    g.fillStyle = '#efe8db'; g.beginPath(); g.moveTo(ix0, iy0 + 70); g.arcTo(ix0, iy0, ix0 + 70, iy0, 70); g.arcTo(ix0 + iw, iy0, ix0 + iw, iy0 + 70, 70); g.lineTo(ix0 + iw, SY1 - 36); g.lineTo(ix0, SY1 - 36); g.closePath(); g.fill();
    g.save(); g.clip(); grainIn(g, ix0, iy0, iw, h, 2901, .5); g.restore();
    /* the status bar, dark on the light screen: bars, the tile (flips), the battery */
    g.save(); g.translate(0, 0);
    g.fillStyle = INK; for (var b = 0; b < 4; b++) { var bh = (26 + b * 18) * .62; rr(g, 470 + b * 19, SY0 + 92 - bh, 13, bh, 3); g.fill(); }
    g.restore();
    tile(g, 620, SY0 + 70, .62, flip, 0);
    g.save(); g.translate(690, SY0 + 70); g.scale(.62, .62);
    g.strokeStyle = INK; g.lineWidth = 9; rr(g, 0, -52, 236, 104, 22); g.stroke(); g.fillStyle = INK; rr(g, 242, -20, 16, 40, 5); g.fill();
    var n = Math.floor(segs), f = segs - n; for (var s2 = 0; s2 < 4; s2++) { var a = s2 < n ? 1 : s2 === n ? f : 0; if (a <= .01) continue; g.globalAlpha = a; rr(g, 14 + s2 * 55, -38, 46, 76, 7); g.fill(); g.globalAlpha = 1; }
    g.restore();
    var ROWS = mode === 'pixel' ? ['Internet', 'SIMs', 'Adaptive connectivity'] : ['5G Auto', '5G On', 'LTE'];
    var head = mode === 'pixel' ? 'Network & internet' : 'Voice & Data';
    onprop(function () {
      txt(g, '‹', SX0 + 58, SY0 + 186, 64, INK, 'left', 900, DISP, 0, 1, 40, 'condensed');
      txt(g, head, SX0 + 100, SY0 + 186, 62, INK, 'left', 900, DISP, 520, 1, 44, 'condensed');
    });
    ROWS.forEach(function (rw, i) {
      var cy = SY0 + 250 + i * 82;
      g.fillStyle = '#fbf7ef'; rr(g, SX0 + 46, cy, w - 92, 72, 18); g.fill();
      onprop(function () { txt(g, rw, SX0 + 78, cy + 38, 48, INK, 'left', 800, DISP, 520, 1, 40, 'condensed'); });
      if (mode === 'pixel') { g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(SX1 - 104, cy + 20); g.lineTo(SX1 - 84, cy + 36); g.lineTo(SX1 - 104, cy + 52); g.stroke(); g.lineCap = 'butt'; g.lineJoin = 'miter'; }
    });
    /* the arrow (on): a paper arrow from the right points at 5G On (pointing only, never a checkmark) */
    if (arrowK > 0 && mode !== 'pixel') {
      var ax = lerp(SX1 + 220, SX1 - 120, eout(arrowK)) + 16 * Math.sin(t * 5), ay = SY0 + 250 + 82 + 36;
      var ex = EXITING; EXITING = true;
      g.save(); g.translate(ax, ay);
      g.fillStyle = 'rgba(0,0,0,.35)'; poly(g, [[6, 6], [56, -34], [56, -14], [176, -14], [176, 26], [56, 26], [56, 46]]); g.fill();
      g.fillStyle = '#e2b84f'; poly(g, [[0, 0], [50, -40], [50, -20], [170, -20], [170, 20], [50, 20], [50, 40]]); g.fill();
      g.restore(); EXITING = ex;
    }
  }
  function setScene(g, t) {
    if (LAYER === 'bg') { wall(g, '#161c26'); return; }
    var E0 = S('set').t0, k = eout(seg(t, E0 - .6, E0 + .1)), sc = lerp(.9, 1, k) + .012 * seg(t, E0, K.end);
    /* the phone turns over: iPhone → Pixel on "Pixel", back on "5G On" */
    var f1 = seg(t, K.autoEnd - .05, K.autoEnd + .25), f2 = seg(t, K.on - .2, K.on + .05), turn = f1 - f2;
    var mode = turn > .5 ? 'pixel' : 'iphone', sx = Math.max(.03, Math.abs(Math.cos(Math.PI * turn)));
    var flip = seg(t, K.lte - .12, K.lte + .1) - seg(t, K.AU, K.AU + .2);
    var segs = 3;   /* Apple only says "might": the battery never visibly loses a notch, its last segment flickers softly */
    var ar = mode === 'iphone' && t > K.on ? seg(t, K.onW - .1, K.onW + .2) : 0;
    /* r2: the phone sits 26 px lower at 95 %, so the dated TODAY card has room above the bezel, outside the phone */
    g.save(); g.translate(510, 766 + 5 * Math.sin(t * 2.1)); g.rotate(.006 * Math.sin(t * 1.3)); g.scale(sc * sx * .95, sc * .95); g.translate(-510, -740);
    var ex = EXITING; if (k < 1 || sx < .999) EXITING = true;
    setPhone(g, t, mode, mode === 'pixel' ? 0 : flip, segs, ar);
    onprop(function () {
      tag(g, 'RE-CREATED', 300, SY0 + 70, 1, 0, 260, INK, '#efe8db', 34);
      tag(g, 'MENU NAMES VARY', 510, SY0 + 250 + 3 * 82 + 20, 1, 0, 420, INK, '#efe8db', 32);
    });
    EXITING = ex;
    /* a paper hand points at the row the voice names: 5G Auto (auto), Adaptive connectivity (pixel) */
    var hrow = mode === 'pixel' ? 2 : 0, hin = mode === 'pixel' ? seg(t, K.adaptive - .3, K.adaptive) : seg(t, K.autoW - .3, K.autoW) * (1 - seg(t, K.autoEnd - .2, K.autoEnd + .05));
    if (hin > 0 && sx > .5 && mode !== 'pixel') { var hy = SY0 + 250 + hrow * 82 + 34 + 8 * Math.sin(t * 4.4), hx = lerp(1150, 640 + 156 * .8 + 14 * Math.sin(t * 3.1), eout(hin)); var exh = EXITING; EXITING = true; g.save(); g.translate(hx, hy + 33 * .8); g.scale(.8, .8); hand(g); g.restore(); EXITING = exh; }
    /* r2: on the Pixel row the hand comes up from the lower right, tilted, its fingertip just past "connectivity", so the
       row's chevron stays in sight above the knuckles */
    if (hin > 0 && sx > .5 && mode === 'pixel') {
      var pcy = SY0 + 250 + 2 * 82, ptx = 662 + 8 * Math.sin(t * 3.1), pty = pcy + 40 + 5 * Math.sin(t * 4.4), exp2 = EXITING; EXITING = true;
      g.save(); g.translate(ptx, pty); g.rotate(.44); g.translate(520 * (1 - eout(hin)), 0); g.scale(.8, .8); g.translate(156, 31); hand(g); g.restore(); EXITING = exp2;
    }
    g.restore();
    /* r2: the dated card sits outside the phone, top left above the bezel (it read as a UI button inside the header) */
    slapCard(g, 'TODAY · 2026', 252, 472, t, K.iphone, 38, 360);
    /* below: the maker's own words, then the path */
    var aq = seg(t, K.auto - .35, K.auto - .1), aqo = seg(t, K.autoEnd - .15, K.autoEnd + .05);
    qplate(g, 108, 1046, 804, ['“…SWITCHES TO LTE, SAVING', 'BATTERY LIFE.”'], 52, ['APPLE SUPPORT · 5G AUTO'], 3001, aq, aqo, false);
    pathCard(g, t, 1258, 'iPHONE 12 & LATER', ['Settings › Cellular ›', 'Cellular Data Options › Voice & Data'], seg(t, K.auto - .4, K.auto - .15), seg(t, K.autoEnd + .3, K.autoEnd + .5));
    var pq = seg(t, K.autoEnd - .1, K.autoEnd + .1), pqo = seg(t, K.on + .05, K.on + .3);
    qplate(g, 108, 1046, 804, ['“…TURNS ON 5G ONLY WHEN YOUR', 'APP NEEDS INCREASED SPEED…”'], 52, ['GOOGLE · SOME US CARRIERS MAY LIMIT IT'], 3011, pq, pqo, false);
    pathCard(g, t, 1258, 'PIXEL 4a (5G) & LATER', ['Settings › Network & internet ›', 'Adaptive connectivity'], seg(t, K.autoEnd + .35, K.autoEnd + .5), pqo);
    var oq = seg(t, K.on + .25, K.on + .5);
    /* a big battery under Apple's words: it loses a segment in the gap after the line (no number in it) */
    var bk = fin(t, K.on + .3, 4);
    if (bk > 0) { var exb = EXITING; if (bk < 1) EXITING = true; g.save(); g.globalAlpha *= bk * (1 - seg(t, K.end - .3, K.end)); battery(g, 433 + 4 * Math.sin(t * 3), 1390 + 20 * (1 - bk), .6, 3, .78 + .22 * Math.abs(Math.cos(t * 2.6))); g.restore(); EXITING = exb; }
    qplate(g, 108, 1046, 804, ['“…ALWAYS USES 5G NETWORK WHEN', 'IT’S AVAILABLE. THIS MIGHT', 'REDUCE BATTERY LIFE.”'], 52, ['APPLE SUPPORT · 5G ON', 'iPHONE 12 & LATER'], 3021, oq, seg(t, K.end - .3, K.end), false);
  }
  function pathCard(g, t, y, head, rows, inn, out) {
    if (inn <= 0 || out >= 1) return;
    var ei = eout(inn), eo = eio(out), ex = EXITING; if (ei < 1 || eo > 0) EXITING = true;
    g.save(); g.globalAlpha *= seg(ei, 0, .6) * (1 - eo); g.translate(60 * (1 - ei) - 500 * eo, 0);
    sheet(g, 108, y, 912, y + 168, Math.round(y) + 7, CREAM, 'path card');
    onprop(function () {
      txt(g, head, 134, y + 34, 38, '#4b4540', 'left', 900, DISP, 740, 1, 36, 'condensed');
      rows.forEach(function (rw, i) { txt(g, rw, 134, y + 84 + i * 48, 40, INK, 'left', 800, DISP, 750, 1, 36, 'condensed'); });
    });
    g.restore(); EXITING = ex;
  }

  /* =====================================================================================================
     THE END: frame 0's picture with YES / NO; the phone sinks back to frame 0's place by the cut
     ===================================================================================================== */
  function endScene(g, t) {
    if (LAYER === 'bg') { jeans(g); return; }
    var u = sio(seg(t, TEND - .55, TEND - 1 / 30)), y0 = lerp(Y0B, YF0, u) + drift(t, .2, .4) * (1 - seg(t, TEND - .8, TEND - .55));
    var tt = t - TEND + 1 / 30;   /* the last frame (TEND − 1/60) shows the hook's phone time 1/60: frame 0's picture */
    var bl = lerp(.45 + .55 * Math.abs(Math.cos(tt * 3.4)), 1, seg(t, TEND - .9, TEND - .6));   /* 2 full bars from 34.4, as on frame 0 */
    hookPicture(g, t, { y0: y0, moving: u > 0, segs: 2, blink: bl, tile: true, sdrop: 0, dt: tt });
    var E0 = S('end').t0, kc = eout(seg(t, E0, E0 + .12)), sc0 = lerp(1.06, 1, kc);
    var yo = eio(seg(t, K.noEnd + .06, K.noEnd + .22));
    [['YES', 330], ['NO', 690]].forEach(function (c) {
      var tq0 = c[0] === 'YES' ? K.yesE : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), sc = sc0 * (1 - .07 * tp) * (1 - yo);
      if (sc <= .01) return;
      var oc = ONPROP, ex0 = EXITING; ONPROP = true; EXITING = ex0 || yo > 0 || u > 0; chip(g, c[0], c[1], y0 + 640 + 8 * tp, { px: 112, wt: 900, bg: BG, line: HOT, lw: 8, fg: HOT, w: 250, h: 160, r: 54, shadow: true, a: 1 - seg(yo, .5, .9), s: sc, maxw: 250 }); ONPROP = oc; EXITING = ex0;
    });
    pocket(g, t);
  }
  function qplate(g, x0, y0, w, lines, px, credits, seed, inn, out, retag) {
    if (inn <= 0 || out >= 1) return;
    var ex0 = EXITING, lh = px * 1.12, h = 26 + lines.length * lh + credits.length * 44 + 14;
    var ei = eout(clamp(inn, 0, 1)), eo = eio(clamp(out, 0, 1));
    g.save();
    if (ei < 1) { g.translate(110 * (1 - ei), 0); g.globalAlpha *= seg(ei, 0, .7); EXITING = true; }
    if (eo > 0) { EXITING = true; g.translate(x0, y0 + h); g.rotate(-.08 * eo); g.translate(-x0, -(y0 + h)); g.translate(-60 * eo, 50 * eo); g.globalAlpha *= 1 - eo; }
    sheet(g, x0, y0, x0 + w, y0 + h, seed, PAPER, 'quote');
    onprop(function () {
      lines.forEach(function (L, i) { txt(g, L, x0 + 28, y0 + 20 + lh * (i + .5), px, INK, 'left', 900, DISP, w - 56, 1, 44, 'condensed'); });
      credits.forEach(function (c, i) {
        if (Array.isArray(c)) { font(g, 36, 800, DISP, 'condensed'); var cw0 = g.measureText(c[0] + '  ').width; txt(g, c[0], x0 + 28, y0 + 20 + lines.length * lh + 26 + i * 44, 36, '#5d564c', 'left', 800, DISP, 0, 1, 36, 'condensed'); txt(g, c[1], x0 + 28 + cw0, y0 + 20 + lines.length * lh + 26 + i * 44, 36, '#5d564c', 'left', 800, DISP, 0, 1, 36, 'condensed'); return; }
        txt(g, c, x0 + 28, y0 + 20 + lines.length * lh + 26 + i * 44, 36, '#5d564c', 'left', 800, DISP, (retag && i === credits.length - 1) ? w - 300 : w - 56, 1, 36, 'condensed'); });
    });
    if (retag) onprop(function () { tag(g, 'RE-CREATED', x0 + w - 130, y0 + h - 34, 1, 0, 230, INK, PAPER, 34); });
    EXITING = ex0; g.restore();
    return h;
  }
  function chipCard(g, text, x, y, a, px, maxw, dark) {
    if (a <= 0) return;
    var ex = EXITING; if (a < 1) EXITING = true;
    chip(g, text, x, y + 24 * (1 - a), { px: px || 52, wt: 900, bg: dark ? INK : CREAM, fg: dark ? CREAM : INK, line: dark ? CREAM : null, lw: 3, r: 14, st: 'condensed', rot: .012, a: a, maxw: maxw || 800 });
    EXITING = ex;
  }
  /* a time card / label chip slapped down (full opacity from its first frame) */
  function slapCard(g, text, x, y, t, t0, px, maxw) {
    if (t < t0 - .08) return;
    var k = eout(seg(t, t0 - .08, t0)), sc = lerp(1.3, 1, k), ex = EXITING; if (k < 1) EXITING = true;
    chip(g, text, x, y - 20 * (1 - k), { px: px || 52, wt: 900, bg: CREAM, fg: INK, r: 16, st: 'condensed', rot: .015, s: sc, a: seg(t, t0 - .08, t0 - .05), maxw: maxw || 820 });
    EXITING = ex;
  }
  /* ---------- captions ---------- */
  var CAPGROUPS = { hook: [[3, 3]], ask: [[3, 2]], test: [[4], [5]], slow: [[3, 4], [3]], twist: [[4], [4, 4]], barely: [[4, 5]], auto: [[2], [5, 4]], pixel: [[2], [2, 3]], on: [[5], [3, 3]], end: [[3, 2], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'drain'], ['ask', 'off'], ['test', 'power'], ['slow', '79%'], ['twist', 'five'], ['barely', 'barely'], ['auto', 'LTE'], ['pixel', 'Adaptive'], ['on', 'always'], ['end', 'yours']]
    .map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPPX = 52, CAPMIN = 1e9;
  function capStart(c) { return c.t0 - .04; }
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= capStart(c)) { card0 = c; ci = i; } });
    if (!card0) return;
    var s = capStart(card0), nx = CAPS[ci + 1], ns = nx ? capStart(nx) : 1e9;
    var keep = nx && ns - card0.t1 < 2.4;
    var o1 = !nx ? Math.min(card0.t1 + .3, TEND - .08) : keep ? ns - .04 : Math.min(card0.t1 + .5, ns - .04), o0 = o1 - .1;   /* the last card holds to the cut */
    var fi = seg(t, s, s + .08), out = 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - s, 3.2, .8), 0, 1.04);
    g.save(); var cpx = CAPPX; font(g, cpx, 800, DISP, 'semi-expanded');
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = cpx * .3, maxw = 820, lines = [], lw, wi = 0;
    card0.split.forEach(function (n) { var ln = [], w = 0; for (var j = 0; j < n; j++, wi++) { if (w + ws[wi] > maxw && ln.length) { lines.push(ln); ln = []; w = 0; } ln.push(wi); w += ws[wi] + gap; } lines.push(ln); });
    lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    var lh = cpx * 1.18, y0 = 308 + cpx * .9;   /* pill tops at y ≥ 304; two lines end by y 446, clear of every prop (y ≥ 465) */
    g.globalAlpha = fi * out * (alpha == null ? 1 : alpha);
    NOREC = true;
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 26;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .2;
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
  var NOISE, SCENES = { hookScene: hookScene, benchScene: benchScene, setScene: setScene, endScene: endScene };
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(56,78,108,.2)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function safeClip(g) { g.beginPath(); g.rect(SAFE_BOX.x0, SAFE_BOX.y0, SAFE_BOX.x1 - SAFE_BOX.x0, SAFE_BOX.y1 - SAFE_BOX.y0); g.clip(); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  var LAYER = 'fg';
  function drawScene(g, Sc, t, layer) { var o = LAYER, oc = CUR; LAYER = layer || 'fg'; CUR = Sc.id; g.save(); SCENES[Sc.fn](g, t); g.restore(); LAYER = o; CUR = oc; }
  /* the background layer (hills, clouds, fog, seats, the wipe's cloud bank) bleeds across the full width and down past
     the box; its top edge fades in over y 302–372 so nothing is ever sliced flat. Props and words stay inside the rail. */
  var LCV = null, LCTX = null, FADE = null;
  function bgLayer(g, fn) {
    if (!LCV) { LCV = mk(W, H); LCTX = LCV.getContext('2d'); FADE = LCTX.createLinearGradient(0, 296, 0, 372); FADE.addColorStop(0, 'rgba(0,0,0,0)'); FADE.addColorStop(1, 'rgba(0,0,0,1)'); }
    var l = LCTX; l.setTransform(1, 0, 0, 1, 0, 0); l.globalAlpha = 1; l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, W, H);
    fn(l);
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalAlpha = 1; l.globalCompositeOperation = 'destination-in'; l.fillStyle = FADE; l.fillRect(0, 0, W, H); l.globalCompositeOperation = 'source-over';
    g.drawImage(LCV, 0, 0);
  }
  function tiltScene(g, Sc, t, dy) {
    bgLayer(g, function (l) { l.translate(0, dy); drawScene(l, Sc, t, 'bg'); });
    g.save(); safeClip(g); g.beginPath(); g.rect(0, 430, W, H); g.clip(); g.translate(0, dy); drawScene(g, Sc, t, 'fg'); g.restore();   /* nothing crosses the captions mid-tilt */
  }
  function fullScene(g, Sc, t) {
    bgLayer(g, function (l) { drawScene(l, Sc, t, 'bg'); });
    g.save(); safeClip(g); drawScene(g, Sc, t, 'fg'); g.restore();
  }
  /* the wipe: a blank dark panel (no numbers, no words) slides across the whole frame, right → left; behind it the next
     scene is already built. Dark slate, so nothing outside the rail reads as a prop. */
  function roll(g, xb, t) {
    /* a strip of torn paper card: both long edges ripped, grain over the face */
    var w = 440, x0 = xb - w / 2, n = 40, r = mulberry(4401), L = [], R = [];
    for (var i = 0; i <= n; i++) { L.push(14 * r() + 6 * Math.sin(i * 1.7)); R.push(14 * r() + 6 * Math.sin(i * 2.3)); }
    function edge(off, sh) {
      g.beginPath(); for (var i = 0; i <= n; i++) g.lineTo(x0 + L[i] + off, -20 + (H + 40) * i / n + sh);
      for (i = n; i >= 0; i--) g.lineTo(x0 + w - R[i] + off, -20 + (H + 40) * i / n + sh); g.closePath();
    }
    g.fillStyle = 'rgba(0,0,0,.45)'; edge(-22, 0); g.fill();
    g.fillStyle = '#e9e1cf'; edge(-4, 0); g.fill();   /* the torn fibre edge shows lighter */
    g.fillStyle = SLATE; edge(4, 0); g.fill();
    edge(4, 0); g.save(); g.clip(); grainIn(g, x0, 0, w, H, 4402, 1.3);
    g.fillStyle = SLATE2; g.fillRect(x0 + 44, 0, 8, H); g.fillRect(x0 + w - 52, 0, 8, H); g.restore();
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var wk = Nx && !Nx.cut ? seg(te, Nx.t0 - TW, Nx.t0) : 0;
    if (wk > 0 && Nx.tilt) {
      var et = eio(wk), nr0 = NOREC; EXITING = true; NOREC = true;
      tiltScene(g, Sc, t, -1180 * et); NOREC = wk < .6; tiltScene(g, Nx, t, 1180 * (1 - et));
      EXITING = false; NOREC = nr0;
    } else if (wk > 0) {
      var dir = Nx.dir || 1, e = eio(wk), xb = dir > 0 ? lerp(W + 280, -280, e) : lerp(-280, W + 280, e);
      var nr = NOREC; NOREC = wk < .4; fullScene(g, Nx, t); NOREC = nr;
      g.save(); EXITING = true; NOREC = true;
      g.beginPath(); if (dir > 0) g.rect(-10, 0, xb + 10, H); else g.rect(xb, 0, W - xb + 10, H); g.clip();
      stage(g); fullScene(g, Sc, t);
      g.restore();
      bgLayer(g, function (l) { roll(l, xb, t); });
      EXITING = false; NOREC = nr;
    } else fullScene(g, Sc, t);
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) captions(g, t, 1);
    /* frame 0's tension: about 20 % more contrast while the lamp is on, eased out on the pull cord and back in for the loop */
    var cst = 1 + .15 * (t < 4 ? 1 - seg(t, K.HK - .02, K.HK + .3) : seg(t, TEND - .7, TEND - .15));
    if (cst > 1.002) { if (!CCV) { CCV = mk(W, H); CCX = CCV.getContext('2d'); } CCX.clearRect(0, 0, W, H); CCX.drawImage(g.canvas, 0, 0); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'contrast(' + cst.toFixed(3) + ')'; g.drawImage(CCV, 0, 0); g.restore(); }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor((t > TEND - 1 / 30 ? t - TEND + 1 / 30 : t) * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null, CCV = null, CCX = null;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 54, 800, DISP, 'semi-expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('Is 5G draining', CX, 362);
    var b = 'your battery?', bp = 62; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 436 - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 436); g.restore();
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
  var GAIN = { hk: .5, ts: .2, sw: .175, tp: .112, hr: .08, au: .54, op: .63 };   /* r2: every hit ≈ −18 dB RMS over its body in the mix */
  var TYPE = { hk: 'tick', ts: 'tick', sw: 'knock', tp: 'slap', hr: 'thump', au: 'tick', op: 'click' };
  function initTimes() {
    Object.keys(TYPE).forEach(function (n) { if (GT[n] != null) EV.push({ t: +GT[n].toFixed(3), type: TYPE[n], g: GAIN[n], id: n, t1: +(GT[n] + BODY[TYPE[n]]).toFixed(3) }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (t < 2 / (fps || 30) - 1e-6 || t > TEND - .2) samples = 1;   /* frame 0 and the frames into the loop: sharp, no ghosting */
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
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -3; comp.ratio.value = 2; comp.attack.value = .004; comp.release.value = .15;
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
    /* THE hit: a rubber stamp slammed on paper on a desk. Body 250 → 170 Hz and a 330 Hz knock (where a phone speaker
       still plays), with a paper slap at 1.5–2.5 kHz on top so it reads on a phone */
    function stampThump(t, g, lb) {
      g = g || 1; lb = lb == null ? 1 : lb;   /* lb: the low body's share; the dip's thump keeps the 1.5–3 kHz paper slap and loses most of the boom */
      var o = osc('sine', 230, t, t + .2, 1, [[t, 0], [t + .012, .3 * g * lb], [t + .12, .26 * g * lb], [t + .19, 0]], .05); o.frequency.exponentialRampToValueAtTime(160, t + .18);
      osc('triangle', 330, t, t + .14, 1, [[t, 0], [t + .004, .22 * g * Math.sqrt(lb)], [t + .06, .15 * g * Math.sqrt(lb)], [t + .13, 0]], .03);
      band(t, .16, 1500, .8, 5.2 * g, .006, .05);
      band(t, .11, 2400, 1.0, 3.6 * g, .004, .03);
      band(t + .001, .18, 1900, .6, 5.0 * g, .008, .04);
      band(t + .012, .07, 2900, 1.4, 2.2 * g, .002, .02);
    }
    /* a cloud bank passing: a soft paper whoosh, band 700 → 2200 → 900 Hz, 0.2 s, dry (no reverb tail into the words) */
    function swishS(t, g) {
      g = g || 1; var n = noise(t, .22), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .7;
      bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(2200, t + .1); bp.frequency.exponentialRampToValueAtTime(900, t + .2);
      var ob = bus(1, 0, 0); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .07, 1.1 * g], [t + .13, .9 * g], [t + .2, 0]]);
    }
    /* a flat paper slap (a card landing) */
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); paperHit(t, g * 1.2); }
    /* a 1–3 kHz paper transient, layered on the knock and the slap so they read on a phone speaker */
    function paperHit(t, g) { band(t, .035, 1300, 1.1, 4.2 * g, .0008, .01); band(t + .004, .03, 2200, 1.3, 3.6 * g, .0008, .01); band(t + .009, .022, 2900, 1.6, 2.2 * g, .0008, .01); }
    /* fog sliding in: a soft paper hiss, 2.6 → 1.3 kHz */
    function paperS(t, g) {
      g = g || 1; var n = noise(t, .17), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .8; bp.frequency.setValueAtTime(2600, t); bp.frequency.exponentialRampToValueAtTime(1300, t + .16);
      var ob = bus(1, .04, 0); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .03, 1.2 * g], [t + .12, .7 * g], [t + .17, 0]]);
    }
    /* a small knock with a 1–3 kHz click */
    function knockS(t, g) {
      g = g || 1;
      osc('triangle', 360, t, t + .13, 1, [[t, 0], [t + .003, .5 * g], [t + .05, .25 * g], [t + .12, 0]], .03);
      osc('sine', 2650, t, t + .07, 1, [[t, 0], [t + .002, .35 * g], [t + .06, 0]], .02);
      band(t, .05, 1900, 1.2, 3.2 * g, .001, .03);
      band(t, .025, 2600, 1.4, 2.4 * g, .001, .02);
      paperHit(t, g);
    }
    /* a switch: a short dry click */
    function clickS(t, g) { g = g || 1; band(t, .018, 2300, 2, 5 * g, .0008, .01); band(t + .03, .02, 1700, 2, 3 * g, .0008, .01); osc('sine', 3100, t, t + .04, 1, [[t, 0], [t + .001, .25 * g], [t + .035, 0]], .01); }
    /* a chip tapping down: one soft paper tick */
    function tickS(t, g) { g = g || 1; band(t, .03, 3000, 1.6, 3.5 * g, .001, .02); band(t, .04, 1400, 1.5, 1.2 * g, .001, .02); }
    /* the signal ring / the call chime: soft sine pings (the ring rises in three steps, the chime is one bell tone) */
    function ringS(t, g) { g = g || 1; [1320, 1760, 2350].forEach(function (f, j) { var t0 = t + j * .035; osc('sine', f, t0, t0 + .07, 1, [[t0, 0], [t0 + .004, .3 * g], [t0 + .065, 0]], .06, -.2 + j * .2); }); }
    function chimeS(t, g) { g = g || 1; osc('sine', 1245, t, t + .13, 1, [[t, 0], [t + .004, .32 * g], [t + .03, .2 * g], [t + .125, 0]], .1); osc('sine', 2490, t, t + .08, 1, [[t, 0], [t + .003, .08 * g], [t + .07, 0]], .05); }
    /* a paper ticket torn in two: a crackle of short 1.2–3.6 kHz bursts over a soft tearing hiss */
    function ripS(t, g) {
      g = g || 1; var r2 = mulberry(91), tt = t;
      for (var i = 0; i < 9; i++) { band(tt, .018, 1200 + r2() * 2400, 1.6, (2.2 + r2() * 1.6) * g, .001, .01); tt += .012 + r2() * .022; }
      var n = noise(t, .22), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .9; bp.frequency.setValueAtTime(1800, t); bp.frequency.linearRampToValueAtTime(3000, t + .2);
      var ob = bus(1, .02, 0); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .02, .9 * g], [t + .16, .6 * g], [t + .22, 0]]);
    }
    /* a short panel tear: crackle bursts over 0.13 s, dry */
    function tearS(t, g) {
      g = g || 1; var r2 = mulberry(93), tt = t;
      for (var i = 0; i < 7; i++) { band(tt, .016, 1300 + r2() * 2200, 1.6, (2.4 + r2() * 1.4) * g, .001, 0); tt += .01 + r2() * .012; }
      var n = noise(t, .14), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .9; bp.frequency.setValueAtTime(1700, t); bp.frequency.linearRampToValueAtTime(2900, t + .13);
      var ob = bus(1, 0, 0); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .015, .9 * g], [t + .1, .5 * g], [t + .14, 0]]);
    }
    /* a felt marker drawn round in one stroke: a squeaky band of noise, 2.2 → 3.2 → 2.6 kHz, with a stroke-speed flutter */
    function markerS(t, g) {
      g = g || 1; var n = noise(t, .3), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2;
      bp.frequency.setValueAtTime(2200, t); bp.frequency.linearRampToValueAtTime(3200, t + .14); bp.frequency.linearRampToValueAtTime(2600, t + .28);
      var ob = bus(1, .02, 0); n.connect(bp); bp.connect(ob);
      var pts = [[t, 0]]; for (var i = 1; i <= 14; i++) pts.push([t + i * .02, (i % 2 ? 1.6 : 1.0) * g * (i > 12 ? .4 : 1)]); pts.push([t + .3, 0]); env(ob.gain, pts);
    }
    /* the same card fails: a dull two-pulse buzz (118 Hz square through a low-pass) with a 1.8 kHz edge for phone speakers */
    function buzzS(t, g) {
      g = g || 1;
      [0, .09].forEach(function (o) {
        var t0 = t + o, os = ac.createOscillator(), lp = ac.createBiquadFilter(), og = ac.createGain();
        os.type = 'square'; os.frequency.value = 118; lp.type = 'lowpass'; lp.frequency.value = 1400;
        os.connect(lp); lp.connect(og); og.connect(bus(1, .02, 0)); env(og.gain, [[t0, 0], [t0 + .006, .2 * g], [t0 + .07, .16 * g], [t0 + .09, 0]]);
        os.start(t0); os.stop(t0 + .1);
        band(t0, .08, 1800, 1.2, 1.6 * g, .004, .02);
      });
    }
    /* a door chain pulled taut: seven bright metal clinks (inharmonic pairs, 2.6–4.8 kHz) over 0.25 s */
    function rattleS(t, g) {
      g = g || 1; var r2 = mulberry(57), tt = t;
      for (var i = 0; i < 7; i++) {
        var f = 2600 + r2() * 2200, a = (.16 + r2() * .1) * g;
        osc('sine', f, tt, tt + .07, 1, [[tt, 0], [tt + .001, a], [tt + .06, 0]], .05, -.3 + r2() * .6);
        osc('sine', f * 1.47, tt, tt + .05, 1, [[tt, 0], [tt + .001, a * .6], [tt + .045, 0]], .04);
        band(tt, .02, 4200, 2, 1.4 * g, .001, .02);
        tt += .02 + r2() * .03;
      }
    }
    /* the needle hitting its stop: a short bright metal clink (3.1 + 4.6 kHz) */
    function clinkS(t, g) { g = g || 1; osc('sine', 3100, t, t + .09, 1, [[t, 0], [t + .001, .3 * g], [t + .085, 0]], .05); osc('sine', 4620, t, t + .06, 1, [[t, 0], [t + .001, .18 * g], [t + .055, 0]], .04); band(t, .02, 3800, 2, 1.6 * g, .001, .02); }
    EV.forEach(function (e) {
      if (e.type === 'clink') clinkS(e.t, e.g);
      else if (e.type === 'buzz') buzzS(e.t, e.g);
      else if (e.type === 'rattle') rattleS(e.t, e.g);
      else
      if (e.type === 'thump') stampThump(e.t, e.g, .2);
      else if (e.type === 'swish') swishS(e.t, e.g);
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'paper') paperS(e.t, e.g);
      else if (e.type === 'knock') knockS(e.t, e.g);
      else if (e.type === 'click') clickS(e.t, e.g);
      else if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'rip') ripS(e.t, e.g);
      else if (e.type === 'tear') tearS(e.t, e.g);
      else if (e.type === 'marker') markerS(e.t, e.g);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone, about −60 dB, so the loop seam is never digital zero; a little more room under the hero hold */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o);
      
      env(o.gain, [[0, ROOM], [DUR, ROOM]]);   /* flat: a step up under the hero read as a word onset to Whisper */ })();
  }
  var ROOM = .0035;

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['800 semi-expanded 84px Archivo', '900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 condensed 84px Archivo', '800 condensed 84px Archivo', '700 condensed 84px Archivo', '900 extra-condensed 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°º×−≈≠µ“”‘’·→…#?‹›✓✕–@!>$(),:§+/=½~'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initTimes();
  /* the hero hold: from the circle closing to the ticket roll that brings frame 0 back */
  var HOLD = { t0: K.barelyEnd, t1: K.auto };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((K.barelyW - .25) * 30) / 30 + 1 / 60, SLUG: '5gbattery', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.CLIP_RUN = function (step) {
    var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) {
      PROPS = []; CURT = t; frame(ctx, t);
      PROPS.forEach(function (p) {
        var b = p.b, over = Math.max(SAFE_BOX.x0 - b[0], b[2] - SAFE_BOX.x1, SAFE_BOX.y0 - b[1], b[3] - SAFE_BOX.y1);
        if (over > 1) { var o = out[p.name] || (out[p.name] = { prop: p.name, from: t, to: t, over: 0, n: 0 }); o.to = t; o.n++; o.over = Math.max(o.over, Math.round(over)); }
      });
      PROPS = null;
    }
    return Object.keys(out).map(function (k) { return out[k]; });
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
