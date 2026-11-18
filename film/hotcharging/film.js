/* "Warm while charging? That's normal." — Factory #35 (hotcharging) on Tech, explained, after ../5gbattery/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   All cut paper on a wooden bench: a charger in a wall socket, the charging cable as a fat paper pipe with amber current
   dashes and a tap on it (CHARGING CURRENT), and a phone with a liquid-crystal heat strip (cream → amber → coral). At
   "Too hot" the battery stalls at 80 (iPhone, if the battery gets too warm); the phone's own paper hand comes out of its
   side and turns the tap down; a chalk charge line on a slate is the hero hold. Then the re-created settings screens, then
   back on the bench to unplug. Coral only from "Too hot". Props stay whole inside x 92–928, y 302–1428. */
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
    hook: start('hook'), warmH: at('hook', 'Warm'), normal: at('hook', 'normal'), hookEnd: lend('hook'),
    ask: start('ask'), why0: at('ask', 'why'), phoneA: at('ask', 'phone'), hotA: at('ask', 'hot'), askEnd: lend('ask'),
    why: start('why'), apple: at('why', 'Apple'), batteryW: at('why', 'battery'), warms: at('why', 'warms'), charges: at('why', 'charges'), whyEnd: lend('why'),
    more: start('more'), wireless: at('more', 'Wireless'), gaming: at('more', 'gaming'), push: at('more', 'make'), higher: at('more', 'warmer.'), moreEnd: lend('more'),
    stall: start('stall'), hot: at('stall', 'hot'), can: at('stall', 'can'), stallW: at('stall', 'stall'), p80: at('stall', '80%'), stallEnd: lend('stall'),
    twist: start('twist'), charger: at('twist', 'charger'), isnt: at('twist', "isn't"), broken: at('twist', 'broken'), yourP: at('twist', 'Your', 1), phoneW: at('twist', 'phone'), twistEnd: lend('twist'),
    protect: start('protect'), slows: at('protect', 'slows'), protectW: at('protect', 'protect'), protEnd: lend('protect'),
    iphone: start('iphone'), check: at('iphone', 'Check'), iph: at('iphone', 'iPhone'), paused: at('iphone', 'paused'), settings: at('iphone', 'Settings,'), batt2: at('iphone', 'Battery.'), iphoneEnd: lend('iphone'),
    pixel: start('pixel'), pix: at('pixel', 'Pixel,'), diag: at('pixel', 'diagnostics'), temp: at('pixel', 'temperature.'), pixelEnd: lend('pixel'),
    cool: start('cool'), hot2: at('cool', 'hot'), unplug: at('cool', 'Unplug'), coolW: at('cool', 'cool.'), coolEnd: lend('cool'),
    end: start('end'), yours: at('end', 'yours'), warmE: at('end', 'warm'), yesE: at('end', 'Yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  (function () {
    place('hk', 'tick', K.hookEnd + .3, .2, K.hookEnd, K.ask);                 /* the strip's cell ticks amber */
    place('st', 'slap', K.stallEnd + .3, .2, K.stallEnd, K.twist);            /* STUCK AT 80%? */
    place('gr', 'knock', K.twistEnd + .3, .2, K.twistEnd, K.protect);          /* the phone's hand grips the tap */
    place('hr', 'thump', K.protEnd + .3, .2, K.protEnd, K.iphone - .3);         /* the hero: the summary plate, one dry hit */
    place('ck', 'tick', at('iphone', 'yours.') + .25, .17, wend('iphone', 'yours.'), K.iph);   /* CHECK YOURS (only if the gap allows) */
    place('cl', 'tick', K.coolEnd + .3, .2, K.coolEnd, K.end);                 /* the last cell flicks back to cream */
  })();
  var TW = .5;
  K.CHK = K.iph + .05;            /* CHECK YOURS slaps down once the "Check yours." caption has gone (no duplicate) */
  K.F80 = K.p80 - .05;           /* the battery freezes and prints 80% on "eighty"; the iPhone scope prints on the same frame */
  K.ST = GT.st != null ? GT.st : K.stallEnd + .3;
  K.GR = GT.gr != null ? GT.gr : K.twistEnd + .3;
  K.HK = GT.hk != null ? GT.hk : K.hookEnd + .2;
  K.HR = GT.hr != null ? GT.hr : K.protEnd + .3;
  K.CL = GT.cl != null ? GT.cl : K.coolEnd + .2;
  K.PLATE = K.HR;                /* the summary plate lands on the hero hit and covers the scope plate */
  K.TT = K.GR;                    /* the turn: the hand turns the wheel down 150° in 0.45 s, starting on the knock in the gap before "slows" */
  K.SLATE = K.slows + .22;        /* the chalk slate waits until "slows" is said and the turn, the slowing dashes and the cooling strip have all played in the open */
  var SC = [
    { id: 'bench', fn: 'benchScene', name: 'Warm or hot? The pipe and the tap', t0: 0 },
    { id: 'set', fn: 'setScene', name: 'Settings › Battery, Battery diagnostics', t0: K.check + .6, tw: .3 },
    { id: 'back', fn: 'backScene', name: 'Unplug it. Is yours warm?', t0: K.cool + .4 }
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
  var PUNCHX = false;   /* r2: during the 1.06 punch on the turn the wall plug, the cable and the pad's far rim may crop for a moment */
  var CAMONLY = false;   /* the close-up (frame 0, end card): only the phone and its strip are measured; the pipe runs off the frame on purpose */
  function prop(g, name, x0, y0, x1, y1) {
    if (!PROPS || EXITING || (g !== ctx && g !== tctx)) return;
    if (CAMONLY && name !== 'phone' && name !== 'heat strip') return;
    if (PUNCHX && (name === 'socket' || name === 'charger' || name === 'pipe' || name === 'wireless pad')) return;
    /* a rotated prop is measured as 12 thin vertical strips, so its box follows the tilted outline instead of its corners */
    var m = g.getTransform();
    if (Math.abs(m.b) > .01) { for (var i = 0; i < 12; i++) PROPS.push({ name: name, b: xbox(g, lerp(x0, x1, i / 12), y0, lerp(x0, x1, (i + 1) / 12), y1) }); return; }
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
  var CUR = 'bench';
  var WOOD = '#3a2a1f', AMBER = '#f0a83a', DEEP = '#e48a2e', LAMBER = '#f3d58c', CELLOFF = '#3d3833';
  var BRICK = '#ece3cf', BRICK2 = '#cfc4ab', PIPEW = '#d9ccb0', PIPEC = '#2b2827', VALVE = '#e9dcc0', WHEEL = '#f1e6cf';
  var PADC = '#2f3742', ARM = '#efe5d0', ARM2 = '#d8ccb3';

  /* ---------- backgrounds: they bleed full width and stay dark ---------- */
  function bench(g) {
    g.fillStyle = WOOD; g.fillRect(-300, -300, W + 600, H + 600);
    var r = mulberry(77);
    for (var i = 0; i < 16; i++) { g.fillStyle = 'rgba(0,0,0,' + (.1 + r() * .1).toFixed(3) + ')'; g.fillRect(-300, -300 + i * 150, W + 600, 4); g.fillStyle = 'rgba(255,225,190,' + (.025 + r() * .02).toFixed(3) + ')'; g.fillRect(-300, -300 + i * 150 + 30 + r() * 70, W + 600, 2 + r() * 3); }
  }
  function wall(g, c) {
    g.fillStyle = c || '#151b25'; g.fillRect(-300, -300, W + 600, H + 600);
    g.fillStyle = 'rgba(255,255,255,.018)'; for (var x = -300; x < W + 300; x += 96) g.fillRect(x, -300, 40, H + 600);
  }

  /* ---------- the bench layout (world coordinates; the camera is 1:1 except at the start and the end) ---------- */
  var PH = { x0: 545, y0: 470, x1: 905, y1: 1130 }, PCX = 725, PCY = 800;
  var TAPX = 430, RUNY = 1295, WHX = 430, WHY = 1180, WHR = 76;
  var SOCK = { x0: 108, y0: 1040, x1: 228, y1: 1250 };
  /* the camera: z = 0 is 1:1; z = 1 is the 1.12× close-up on the phone (frame 0 and the end card). At rest the phone
     spans y 628–1368 with 60 px of cable under it; frame 0 starts it 312 px higher (y 316–1055) and it settles down */
  var ZY = 998;
  /* r2: in the close-up the cable's left run ends under the WARM OR HOT? sticker (screen x 230), never as a stub at the frame edge */
  function pclipX(z) { if (z <= .6) return null; var s = 1 + .12 * z, tx = lerp(PCX, 510, z); return PCX + (230 - tx) / s; }
  function camTf(g, z, dy) {
    var s = 1 + .12 * z, tx = lerp(PCX, 510, z), ty = lerp(PCY, ZY, z) + (dy || 0);
    g.translate(tx, ty); g.scale(s, s); g.translate(-PCX, -PCY);
  }
  /* the heat strip: a liquid-crystal strip (like a forehead thermometer) on the screen. h 0..1 lights 1 + 4h cells:
     cream, light amber, amber, deep amber; the fifth cell is coral and lights only from "Too hot" (h > .75) */
  var CELLS = [CREAM, LAMBER, AMBER, DEEP, HOT];
  function strip(g, h, labA) {
    var x0 = 584, y0 = 522, cw = 52, gap = 6;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 - 10 + 5, y0 - 10 + 7, 5 * cw + 4 * gap + 20, 56 + 20, 12); g.fill();
    g.fillStyle = '#1c1a19'; rr(g, x0 - 10, y0 - 10, 5 * cw + 4 * gap + 20, 56 + 20, 12); g.fill();
    var lit = 1 + 4 * clamp(h, 0, 1);
    for (var i = 0; i < 5; i++) {
      var a = clamp(lit - i, 0, 1);
      g.fillStyle = CELLOFF; rr(g, x0 + i * (cw + gap), y0, cw, 56, 8); g.fill();
      if (a > .01) { g.globalAlpha = a; g.fillStyle = CELLS[i]; rr(g, x0 + i * (cw + gap), y0, cw, 56, 8); g.fill(); g.globalAlpha = 1; }
    }
    prop(g, 'heat strip', x0 - 10, y0 - 10, x0 + 5 * cw + 4 * gap + 10, y0 + 66);
    if (labA > 0) onprop(function () {
      txt(g, 'COOL', x0 - 4, y0 + 100, 36, CREAM, 'left', 900, DISP, 0, labA, 36, 'condensed');
      txt(g, 'HOT', x0 + 5 * cw + 4 * gap + 4, y0 + 100, 36, CREAM, 'right', 900, DISP, 0, labA, 36, 'condensed');
      g.save(); g.globalAlpha *= labA; g.strokeStyle = CREAM; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 + 92, y0 + 100); g.lineTo(x0 + 196, y0 + 100); g.stroke();
      g.beginPath(); g.moveTo(x0 + 184, y0 + 90); g.lineTo(x0 + 198, y0 + 100); g.lineTo(x0 + 184, y0 + 110); g.stroke(); g.restore();
    });
  }
  /* the battery on the screen: an outline that fills; 80% prints only when told (always with the iPhone scope in frame) */
  function battGlyph(g, fill, p80, bolt, t) {
    var x0 = 650, y0 = 700, w = 150, h = 250;
    g.fillStyle = CREAM; rr(g, x0 + w / 2 - 26, y0 - 16, 52, 18, 5); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 9; rr(g, x0, y0, w, h, 20); g.stroke();
    var ih = h - 28, fh = ih * clamp(fill, 0, 1);
    g.fillStyle = '#e9dfca'; rr(g, x0 + 14, y0 + 14 + ih - fh, w - 28, fh, 8); g.fill();
    if (bolt > 0) {
      g.save(); g.globalAlpha *= bolt; g.fillStyle = p80 ? 'rgba(33,29,38,.35)' : INK;
      poly(g, [[x0 + 84, y0 + 62], [x0 + 46, y0 + 136], [x0 + 72, y0 + 136], [x0 + 62, y0 + 196], [x0 + 106, y0 + 116], [x0 + 80, y0 + 116]]); g.fill(); g.restore();
    }
    if (p80) onprop(function () { txt(g, '80%', x0 + w / 2, y0 + 14 + ih - fh * .5 + 6, 58, INK, 'center', 900, DISP, w - 30, 1, 44, 'condensed'); });
  }
  function controller(g, x, y, k, t) {
    if (k <= 0) return;
    var s = lerp(.4, 1, k), ex = EXITING; if (k < .99) EXITING = true;
    g.save(); g.translate(x, y + 4 * Math.sin(t * 6)); g.rotate(.06 * Math.sin(t * 3.3)); g.scale(s, s);
    var r = mulberry(1771);
    g.fillStyle = 'rgba(0,0,0,.35)'; cut(g, [[-92, -26], [92, -26], [104, 40], [64, 46], [40, 22], [-40, 22], [-64, 46], [-104, 40]].map(function (p) { return [p[0] + 6, p[1] + 8]; }), r, 1.2);
    g.fillStyle = '#d9cfbb'; cut(g, [[-92, -26], [92, -26], [104, 40], [64, 46], [40, 22], [-40, 22], [-64, 46], [-104, 40]], r, 1.2);
    g.fillStyle = INK; g.fillRect(-70, -6, 36, 10); g.fillRect(-57, -19, 10, 36);
    el(g, 52, -10, 8, 8); el(g, 70, 4, 8, 8);
    prop(g, 'controller', -104, -26, 104, 46);
    g.restore(); EXITING = ex;
  }
  /* the phone lying face up on the bench */
  function benchPhone(g, t, o) {
    var x0 = PH.x0, y0 = PH.y0, w = PH.x1 - PH.x0, h = PH.y1 - PH.y0;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 12, y0 + 16, w, h, 56); g.fill();
    g.fillStyle = PHB; rr(g, x0, y0, w, h, 56); g.fill();
    rr(g, x0, y0, w, h, 56); grainIn(g, x0, y0, w, h, 811, .9);
    g.fillStyle = '#1f252f'; rr(g, x0 + w - 2, y0 + 150, 9, 80, 4); g.fill();
    prop(g, 'phone', x0, y0, x0 + w + 7, y0 + h);
    g.save(); rr(g, x0 + 20, y0 + 20, w - 40, h - 40, 40); g.clip();
    var gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, '#17202d'); gr.addColorStop(1, '#0c121b'); g.fillStyle = gr; g.fillRect(x0, y0, w, h);
    /* a soft warm wash on the glass that follows the strip (paper tint, not a glow) */
    var wa = clamp(o.h, 0, 1); if (wa > .05) { g.fillStyle = 'rgba(240,140,60,' + (.07 * wa).toFixed(3) + ')'; g.fillRect(x0, y0, w, h); }
    g.restore();
    g.fillStyle = '#05060a'; el(g, PCX, y0 + 44, 11, 11);
    g.strokeStyle = 'rgba(244,237,224,.55)'; g.lineWidth = 3; rr(g, x0, y0, w, h, 56); g.stroke();
    strip(g, o.h, o.lab);
    battGlyph(g, o.fill, o.p80, o.bolt, t);
    controller(g, PCX, 1050, o.game || 0, t);
    /* heat curls: three thin paper strips rising beside the battery (no smoke, no flame) */
    var ca = o.curls || 0, cs = o.cs || 1, ct = o.ct == null ? t : o.ct;
    if (ca > .01) for (var i = 0; i < 3; i++) {
      var ph = frac(ct * .55 + [.22, .5, .78][i]), x = [612, 838, 624][i], yb = 1010 - ph * 290, a = ca * Math.sin(Math.PI * ph);
      g.save(); g.globalAlpha *= a * .9; g.strokeStyle = i === 1 ? LAMBER : '#efe2c4'; g.lineWidth = 7 * cs; g.lineCap = 'round'; g.beginPath();
      for (var q = 0; q <= 12; q++) { var yy = yb - q * 9 * cs, xx = x + 12 * cs * Math.sin(q * .8 + ct * 4 + i); if (q) g.lineTo(xx, yy); else g.moveTo(xx, yy); }
      g.stroke(); g.restore();
    }
  }
  /* the wall socket (a plate on the bench edge) and the charger brick plugged into it; pull: 0..1 unplugs it */
  function socket(g) {
    var s = SOCK;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, s.x0 + 8, s.y0 + 10, s.x1 - s.x0, s.y1 - s.y0, 16); g.fill();
    g.fillStyle = '#d3c9b3'; rr(g, s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0, 16); g.fill();
    rr(g, s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0, 16); grainIn(g, s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0, 1901, .7);
    prop(g, 'socket', s.x0, s.y0, s.x1, s.y1);
    /* two outlets: slots */
    [1110, 1196].forEach(function (cy) { g.fillStyle = '#bdb29a'; rr(g, 128, cy - 34, 80, 68, 14); g.fill(); g.fillStyle = '#2b2622'; rr(g, 146, cy - 18, 9, 26, 3); g.fill(); rr(g, 182, cy - 18, 9, 26, 3); g.fill(); el(g, 168, cy + 20, 6, 6); });
  }
  function brick(g, pull, t) {
    var dx = -12 * pull, dy = -86 * pull, ex = EXITING; if (pull > .001 && pull < .999) EXITING = true;
    g.save(); g.translate(dx, dy);
    if (pull > .05) { g.fillStyle = '#b9ad94'; g.fillRect(146, 1096, 9, 24 * pull + 8); g.fillRect(182, 1096, 9, 24 * pull + 8); }   /* the prongs show */
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 120, 1066, 112, 116, 18); g.fill();
    g.fillStyle = BRICK; rr(g, 114, 1056, 108, 116, 18); g.fill();
    rr(g, 114, 1056, 108, 116, 18); grainIn(g, 114, 1056, 108, 116, 1911, .6);
    g.fillStyle = BRICK2; rr(g, 114, 1146, 108, 26, 12); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.25)'; g.lineWidth = 3; g.beginPath(); g.arc(168, 1102, 18, 0, 6.283); g.stroke();
    prop(g, 'charger', 114, 1056, 222, 1172);
    g.restore(); EXITING = ex;
    return [168 + dx, 1172 + dy];
  }
  /* the cable as a paper pipe: a pale wall, a dark channel, amber current dashes flowing to the phone */
  function pipePath(g, A, R) {
    g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(A[0], A[1] + 20); g.bezierCurveTo(A[0], RUNY - 10, A[0] + 10, RUNY, A[0] + 50, RUNY);
    g.lineTo(R.xr, RUNY); g.quadraticCurveTo(R.xe, RUNY, R.xe, RUNY - 60); g.lineTo(R.xe, R.ye);
  }
  function pipe(g, A, R, ph, flow, thin) {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.translate(6, 9); pipePath(g, A, R); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 60; g.stroke(); g.translate(-6, -9);
    pipePath(g, A, R); g.strokeStyle = PIPEW; g.lineWidth = 58; g.stroke();
    pipePath(g, A, R); g.strokeStyle = PIPEC; g.lineWidth = 34; g.stroke();
    if (flow > .01) {
      var dw = lerp(18, 7, thin), on = lerp(30, 10, thin), off = lerp(24, 64, thin);
      g.globalAlpha *= flow; pipePath(g, A, R); g.strokeStyle = AMBER; g.lineWidth = dw; g.lineCap = 'butt'; g.setLineDash([on, off]); g.lineDashOffset = -ph; g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    }
    pipePath(g, A, R); g.strokeStyle = 'rgba(255,250,240,.22)'; g.lineWidth = 4; g.lineCap = 'round'; g.translate(-14, -8); g.stroke();
    g.restore();
    prop(g, 'pipe', Math.min(A[0], R.xe) - 29, Math.min(A[1], R.ye), Math.max(R.xr, R.xe) + 29, RUNY + 29);
  }
  /* the tap: a valve body on the pipe's run, a stem and a wheel that turns (a = radians turned down) */
  function tap(g, a, al, ws) {
    if (al <= .001) return;
    var r = mulberry(1951), ex = EXITING; if (al < .999) EXITING = true; ws = ws || 1;
    g.save(); g.globalAlpha *= al;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, TAPX - 58 + 7, RUNY - 43 + 9, 116, 86, 14); g.fill();
    g.fillStyle = VALVE; rr(g, TAPX - 58, RUNY - 43, 116, 86, 14); g.fill();
    rr(g, TAPX - 58, RUNY - 43, 116, 86, 14); grainIn(g, TAPX - 58, RUNY - 43, 116, 86, 1952, .6);
    g.fillStyle = '#8f846d'; el(g, TAPX - 40, RUNY - 26, 6, 6); el(g, TAPX + 40, RUNY - 26, 6, 6); el(g, TAPX - 40, RUNY + 26, 6, 6); el(g, TAPX + 40, RUNY + 26, 6, 6);
    g.fillStyle = '#cbbd9f'; g.fillRect(WHX - 9, WHY, 18, RUNY - 43 - WHY + 4);
    prop(g, 'valve', TAPX - 58, RUNY - 43, TAPX + 58, RUNY + 43);
    /* the wheel, face on; ws lifts it toward the camera while the hand turns it */
    g.save(); g.translate(WHX, WHY); g.scale(ws, ws); g.rotate(a);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(7, 9, WHR, 0, 6.283); g.arc(7, 9, WHR - 18, 0, 6.283, true); g.fill();
    g.fillStyle = WHEEL; g.beginPath(); g.arc(0, 0, WHR, 0, 6.283); g.arc(0, 0, WHR - 18, 0, 6.283, true); g.fill();
    for (var i = 0; i < 4; i++) { g.save(); g.rotate(i * Math.PI / 2); g.fillStyle = WHEEL; rr(g, -7, -WHR + 10, 14, WHR - 10, 5); g.fill(); g.restore(); }
    g.fillStyle = '#c9ba98'; el(g, 0, 0, 20, 20); g.fillStyle = '#8f846d'; el(g, 0, 0, 7, 7);
    g.fillStyle = HOT === '#ff5b3d' ? '#a8843a' : '#a8843a'; el(g, 0, -WHR + 9, 7, 7);   /* a brass mark on the rim shows the turn */
    g.restore();
    prop(g, 'wheel', WHX - WHR * ws, WHY - WHR * ws, WHX + WHR * ws, WHY + WHR * ws);
    g.restore(); EXITING = ex;
  }
  /* the tap's tag: CHARGING CURRENT, on a string from the wheel's hub */
  function tapTag(g, t, a) {
    if (a <= 0) return;
    var sw = .03 * Math.sin(t * 2.2), ex = EXITING; if (a < 1) EXITING = true;
    g.save(); g.globalAlpha *= a;
    g.strokeStyle = '#d8cdb5'; g.lineWidth = 3; g.beginPath(); g.moveTo(WHX - 30, WHY - WHR + 6); g.lineTo(386, 1030); g.stroke();
    g.translate(374, 990); g.rotate(sw - .02);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -136 + 6, -42 + 8, 272, 84, 12); g.fill();
    g.fillStyle = PAPER; rr(g, -136, -42, 272, 84, 12); g.fill();
    prop(g, 'tap tag', -136, -42, 136, 42);
    onprop(function () {
      txt(g, 'CHARGING CURRENT', 0, -12, 36, INK, 'center', 900, DISP, 252, 1, 30, 'condensed');
      txt(g, 'OUR ILLUSTRATION', 0, 24, 30, '#5d564c', 'center', 800, DISP, 250, 1, 30, 'condensed');
    });
    g.restore(); EXITING = ex;
  }
  /* the wireless pad that slides under the phone (more) */
  function pad(g, k) {
    if (k <= 0) return;
    var dx = 460 * (1 - eout(k)), ex = EXITING; if (k < 1) EXITING = true;
    g.save(); g.translate(dx, 0);
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 527, 958, 400, 216, 40); g.fill();
    g.fillStyle = PADC; rr(g, 519, 948, 404, 218, 40); g.fill();
    rr(g, 519, 948, 404, 218, 40); grainIn(g, 519, 948, 404, 218, 2051, .9);
    g.strokeStyle = 'rgba(244,237,224,.4)'; g.lineWidth = 3; rr(g, 519, 948, 404, 218, 40); g.stroke();
    prop(g, 'wireless pad', 519, 948, 923, 1166);
    g.restore(); EXITING = ex;
  }
  /* the phone's own hand: a cream paper arm out of the phone's left edge (a wide cuff sits just outside the edge), a big
     mitten with four fingers wrapped over the wheel's rim; ws is the wheel's lift so the grip stays on the rim */
  function phoneHand(g, k, ga, t, ws) {
    if (k <= 0) return;
    ws = ws || 1;
    var S = [PH.x0 - 30, 1078], G = [WHX + Math.cos(ga) * (WHR - 4) * ws, WHY + Math.sin(ga) * (WHR - 4) * ws];
    var E = [lerp(S[0] + 4, G[0], k), lerp(S[1] + 4, G[1], k)], ex = EXITING; if (k < 1) EXITING = true;
    var C = [lerp(S[0], E[0], .5) + 10, Math.min(S[1], E[1]) - 16];
    g.save(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 44; g.beginPath(); g.moveTo(PH.x0 + 14, S[1] + 9); g.lineTo(S[0] + 6, S[1] + 9); g.quadraticCurveTo(C[0] + 7, C[1] + 9, E[0] + 7, E[1] + 9); g.stroke();
    g.strokeStyle = ARM; g.lineWidth = 40; g.beginPath(); g.moveTo(PH.x0 + 8, S[1]); g.lineTo(S[0], S[1]); g.quadraticCurveTo(C[0], C[1], E[0], E[1]); g.stroke();
    /* the cuff: a wider cream band just outside the phone's edge, two stitch lines */
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, PH.x0 - 40 + 5, S[1] - 34 + 7, 30, 68, 8); g.fill();
    g.fillStyle = ARM2; rr(g, PH.x0 - 40, S[1] - 34, 30, 68, 8); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(PH.x0 - 33, S[1] - 26); g.lineTo(PH.x0 - 33, S[1] + 26); g.moveTo(PH.x0 - 17, S[1] - 26); g.lineTo(PH.x0 - 17, S[1] + 26); g.stroke();
    /* the mitten, gripping the rim: palm, four finger bumps over the rim, a thumb */
    g.translate(E[0], E[1]); g.rotate(ga + Math.PI);
    var r = mulberry(707);
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, 8, 10, 54, 40);
    /* a warm tan paper mitten with a thin ink edge, so it reads against the cream wheel */
    g.strokeStyle = 'rgba(33,29,38,.6)'; g.lineWidth = 4;
    g.fillStyle = SKIN; g.beginPath(); g.ellipse(0, 0, 54, 40, 0, 0, 6.283); g.fill(); g.stroke();
    for (var f = 0; f < 4; f++) { g.fillStyle = f % 2 ? SKIN : '#ecd2b2'; g.beginPath(); g.ellipse(40, -27 + f * 18, 17, 10, .2, 0, 6.283); g.fill(); g.stroke(); }
    g.fillStyle = SKIN2; g.beginPath(); g.ellipse(-12, -34, 24, 13, -.3, 0, 6.283); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(33,29,38,.4)'; g.lineWidth = 3; g.beginPath(); for (f = 0; f < 3; f++) { g.moveTo(30, -18 + f * 18); g.lineTo(54, -18 + f * 18 + (r() - .5) * 2); } g.stroke();
    g.restore(); EXITING = ex;
    prop(g, 'phone hand', Math.min(PH.x0 - 40, E[0] - 64), Math.min(S[1] - 34, E[1] - 64), PH.x0 + 8, Math.max(S[1] + 34, E[1] + 64));
  }
  /* the dash phase: the integral of the flow speed (px/s), so the current slows without jumping */
  function vel(t) { return lerp(lerp(150, 75, eio(seg(t, K.stallW - .1, K.stallW + .5))), 37.5, eio(seg(t, K.TT, K.TT + .5))); }
  var PHC = [], PHSTEP = 1 / 120;
  function phase(t) {
    var n = Math.floor(t / PHSTEP);
    while (PHC.length <= n) { var i = PHC.length; PHC.push(i ? PHC[i - 1] + vel((i - .5) * PHSTEP) * PHSTEP : 0); }
    return PHC[n] + vel(t) * (t - n * PHSTEP);
  }
  var V0 = 150;
  /* the whole bench (world): o = { pull, flow, thin, route (0 phone, 1 pad), padK, h, lab, fill, p80, bolt, game, curls, wa (wheel), handK, tagA } */
  function benchWorld(g, t, o) {
    var cam0 = CAMONLY; CAMONLY = (o.camz || 0) > 0;
    socket(g);
    var R = { xr: lerp(660, 540, o.route), xe: lerp(PCX, 600, o.route), ye: lerp(PH.y1 - 6, 1160, o.route) };
    var A0 = [168 - 12 * o.pull, 1172 - 86 * o.pull];
    if (o.pclip != null) { g.save(); g.beginPath(); g.rect(o.pclip, -1e4, 1e5, 2e4); g.clip(); }
    pipe(g, A0, R, o.ph, o.flow, o.thin);
    if (o.pclip != null) g.restore();
    brick(g, o.pull, t);
    pad(g, o.padK);
    benchPhone(g, t, o);
    tap(g, o.wa, 1 - (o.camz || 0), o.ws);
    tapTag(g, t, o.tagA);
    phoneHand(g, o.handK, -2.3 + o.wa, t, o.ws);
    CAMONLY = cam0;
  }

  /* frame 0's sticker: WARM OR HOT? (three words; the "?" amber, coral is kept for "Too hot") */
  function sticker(g, x, y, k) {
    if (k <= 0) return;
    var w = 680, h = 156, spx = 100;
    g.save(); g.translate(x, y); g.rotate(-.025); g.scale(k, k);
    var ex = EXITING; if (k < .999) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 8, -h / 2 + 11, w, h, 20); g.fill();
    g.fillStyle = CREAM; rr(g, -w / 2, -h / 2, w, h, 20); g.fill();
    rr(g, -w / 2, -h / 2, w, h, 20); grainIn(g, -w / 2, -h / 2, w, h, 1521, .6);
    prop(g, 'sticker', -w / 2, -h / 2, w / 2, h / 2);
    onprop(function () {
      font(g, spx, 900, DISP, 'condensed'); while (g.measureText('WARM OR HOT?').width > w - 60) { spx -= 2; font(g, spx, 900, DISP, 'condensed'); } var w1 = g.measureText('WARM OR HOT').width, w2 = g.measureText('?').width, x0 = -(w1 + w2 + 4) / 2;
      txt(g, 'WARM OR HOT', x0, 6, spx, INK, 'left', 900, DISP, 0, 1, 60, 'condensed'); txt(g, '?', x0 + w1 + 4, 6, spx, '#d98a1f', 'left', 900, DISP, 0, 1, 60, 'condensed');
    });
    EXITING = ex; g.restore();
  }
  /* the search card: WHY IS MY PHONE HOT WHEN CHARGING, typed in */
  function searchCard(g, x, y, t, t0, a) {
    var sa = seg(t, t0, t0 + .12) * (a == null ? 1 : a);
    if (sa <= 0 || !LIVE.text) return;
    var w = 690, h = 92, x0 = x - w / 2, y0 = y - h / 2, sc = 1;   /* r2: full width from its first frame */
    g.save(); g.globalAlpha *= sa; g.translate(x, y); g.scale(sc, sc); g.translate(-x, -y);
    var ex = EXITING; if (sc < .995 || sa < 1) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 8, y0 + 10, w, h, 46); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 46); g.fill();
    prop(g, 'search card', x0, y0, x0 + w, y0 + h);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x0 + 50, y - 6, 15, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x0 + 61, y + 5); g.lineTo(x0 + 74, y + 18); g.stroke();
    var L = 'WHY IS MY PHONE HOT WHEN CHARGING', k = seg(t, t0 + .04, t0 + .54), n = Math.round(L.length * k), typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
    onprop(function () { if (n) txt(g, L.slice(0, n), x0 + 88, y + 3, 42, INK, 'left', 900, DISP, w - 106, 1, 30, 'condensed'); });
    NOREC = nr;
    EXITING = ex; g.restore();
  }
  /* a paper tag on a string (BROKEN? swings from the pipe under the charger) */
  function swingTag(g, ax, ay, t, k, text, col, rip) {
    if (k <= 0 || rip >= 1) return;
    var sw = .1 * Math.sin(t * 3.1) * (1 - .5 * k) + .2 * (1 - eout(k)), len = lerp(10, 40, eout(k)), ex = EXITING; if (k < 1 || rip > 0) EXITING = true;
    g.save(); g.translate(ax, ay);
    if (rip > 0) { var e = eio(rip); g.translate(-160 * e, -420 * e); g.rotate(-1.4 * e); g.globalAlpha *= 1 - seg(rip, .6, 1); }
    g.rotate(sw);
    if (rip <= 0) { g.strokeStyle = '#d8cdb5'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, len); g.stroke(); }
    g.translate(0, len + 34);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -56, -30, 116, 70, 12); g.fill();
    g.fillStyle = col || PAPER; rr(g, -60, -34, 120, 68, 12); g.fill();
    g.fillStyle = '#0c0f14'; el(g, 0, -22, 5, 5);
    prop(g, 'tag', -60, -34, 60, 34);
    onprop(function () { txt(g, text, 0, 6, 40, col ? CREAM : INK, 'center', 900, DISP, 108, 1, 34, 'condensed'); });
    g.restore(); EXITING = ex;
  }
  /* a two-line credit plate (WARM = NORMAL), a paper card */
  function normPlate(g, x, y, a, s) {
    if (a <= 0) return;
    var w = 420, h = 128, ex = EXITING; if (a < 1 || s !== 1) EXITING = true;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.rotate(.012);
    g.fillStyle = 'rgba(0,0,0,.38)'; rr(g, -w / 2 + 7, -h / 2 + 10, w, h, 16); g.fill();
    g.fillStyle = CREAM; rr(g, -w / 2, -h / 2, w, h, 16); g.fill();
    rr(g, -w / 2, -h / 2, w, h, 16); grainIn(g, -w / 2, -h / 2, w, h, 1601, .6);
    prop(g, 'normal plate', -w / 2, -h / 2, w / 2, h / 2);
    onprop(function () {
      txt(g, 'WARM = NORMAL', 0, -20, 62, INK, 'center', 900, DISP, w - 30, 1, 48, 'condensed');
      txt(g, 'APPLE · GOOGLE · SAMSUNG', 0, 36, 38, '#4b4540', 'center', 800, DISP, w - 30, 1, 36, 'condensed');
    });
    g.restore(); EXITING = ex;
  }
  /* the strip's heat over time (bench scene) */
  function heatB(t) {
    var h = .5;                                                  /* frame 0 already warm: cream, light amber, amber */
    h += .1 * seg(t, K.warms - .1, K.charges);                     /* why: a little warmer */
    h += .15 * eio(seg(t, K.gaming - .1, K.higher + .2));          /* more: deep amber, never coral */
    h += .25 * eio(seg(t, K.hot - .05, K.hot + .2));               /* "Too hot": the coral cell lights */
    h -= .4 * eio(seg(t, K.TT + .15, K.TT + .7));                  /* the phone turns the tap down: coral back to amber, done before the slate */
    return h;
  }

  /* =====================================================================================================
     THE BENCH: frame 0 is a 1.3× close-up gliding up into place; the camera pulls back on "So why"; the pipe, the tap,
     the pad, the stall at 80, the phone's own hand on the tap, and the chalk slate on "protect"
     ===================================================================================================== */
  var DY0 = -312;
  function benchScene(g, t) {
    if (LAYER === 'bg') { bench(g); return; }
    var gk = eout(seg(t, 0, .55)), dy = DY0 * (1 - gk);
    var z = 1 - eio(seg(t, K.ask - .05, K.ask + .75));
    var exw = EXITING; if (z > 0 && z < 1) EXITING = true;
    /* the punch-in on the turn: the camera 1.000 → 1.024 about x 741 (socket to wireless pad, x 108–923,
       stays inside the box) and the wheel lifts 1.074 toward the camera: 1.10 on the tap */
    var pk = eio(seg(t, K.TT - .1, K.TT + .35)), pq = eio(seg(t, K.TT - .1, K.TT + .2)) * (1 - eio(seg(t, K.TT + .6, K.TT + .9))), pz = 1 + .06 * pq, ws = 1 + .074 * pk;
    g.save(); camTf(g, z, dy);
    var pux = PUNCHX; PUNCHX = pq > .01;
    if (pq > 0) { g.translate(680, WHY); g.scale(pz, pz); g.translate(-680, -WHY); }
    var fill = .55 + .1 * seg(t, K.batteryW, K.whyEnd + .3) + .1 * seg(t, K.wireless, K.moreEnd) + .05 * eio(seg(t, K.stallW, K.F80));
    var p80 = t >= K.F80;
    var route = eio(seg(t, K.wireless + .15, K.wireless + .55));
    var wa = .9 * eio(seg(t, K.stallW - .05, K.stallW + .3)) + 2.618 * eio(seg(t, K.TT, K.TT + .45));
    var hookCurls = 1 - seg(t, K.ask - .1, K.ask + .4);
    benchWorld(g, t, {
      pull: 0, flow: 1, thin: .5 * eio(seg(t, K.stallW - .1, K.stallW + .5)) + .5 * eio(seg(t, K.TT, K.TT + .6)), route: route, padK: seg(t, K.wireless - .25, K.wireless + .2),
      ph: phase(t), h: heatB(t), lab: seg(t, .9, 1.2), fill: fill, p80: p80, bolt: p80 ? 1 : .75 + .25 * Math.abs(Math.cos(t * 2.4)),
      game: pop(t, K.gaming - .05, 3.2), curls: Math.max(hookCurls, seg(t, K.warms - .2, K.warms + .3) * (1 - seg(t, K.slows + .3, K.slows + .9))), cs: 1 + .4 * z,
      wa: wa, ws: ws, handK: eout(seg(t, K.phoneW - .15, K.phoneW + .3)), tagA: seg(t, K.ask + .7, K.ask + .95), camz: z, pclip: pclipX(z)
    });
    g.restore(); EXITING = exw; PUNCHX = pux;
    /* frame 0's sticker, on the lower half of the close-up; peels away as the camera pulls back */
    var sp = seg(t, K.ask - .15, K.ask + .3);
    if (sp < 1) { var exs = EXITING; if (sp > 0) EXITING = true; g.save(); g.translate(-700 * eio(sp), 160 * eio(sp)); g.rotate(-.3 * eio(sp)); sticker(g, 510, 1274 + drift(t, .9, .25), 1); g.restore(); EXITING = exs; }
    /* WARM = NORMAL: on the screen in the close-up, then it rides to the text zone as the camera pulls back; it peels off
       before Apple's quote slides in, so the two never share the frame */
    var na = seg(t, K.normal - .06, K.normal + .04), nm = eio(seg(t, K.ask - .05, K.ask + .75)), no = seg(t, K.why - .8, K.why - .5);
    if (na > 0 && no < 1) {
      var sc0 = t < K.normal + .1 ? lerp(1.25, 1, eout(seg(t, K.normal - .06, K.normal + .06))) : 1;
      normPlate(g, lerp(510, 306, nm) - 520 * eio(no), lerp(900, 552, nm) + 60 * eio(no), na * (1 - no), sc0);
    }
    /* ask: the search card types in from "So" over 0.8 s; a paper hand hovers over the phone, testing the heat */
    searchCard(g, 580, 1378, t, K.ask - .05, 1 - seg(t, K.wireless - .35, K.wireless - .1));
    var hk = eout(seg(t, K.ask + .7, K.phoneA + .5)) * (1 - eio(seg(t, K.why + .1, K.why + .5)));
    if (hk > 0) { var exh = EXITING; EXITING = true; g.save(); g.translate(lerp(1200, 770 + 156 * .9, hk) + 6 * Math.sin(t * 3.4), 780 + 33 * .9 + 7 * Math.sin(t * 4.6)); g.scale(.9, .9); hand(g); g.restore(); EXITING = exh; }
    /* why: Apple's sentence, cut with "…" (it goes on: "…which can reduce its lifespan") */
    qplate(g, 104, 600, 412, ['“A BATTERY WARMS', 'UP AS IT CHARGES…”'], 48, ['APPLE SUPPORT'], 3001, seg(t, K.why - .3, K.why - .05), seg(t, K.more - .55, K.more - .35), false);
    /* more: Apple's list of normal warm causes, cut with "…" (wider and 2 px smaller so WIRELESSLY CHARGE fits) */
    qplate(g, 104, 560, 430, ['“…FEELS WARMER', 'WHEN YOU: …', 'WIRELESSLY CHARGE', 'YOUR DEVICE…”'], 44, ['APPLE SUPPORT'], 3011, seg(t, K.more - .45, K.more - .2), seg(t, K.hot, K.hot + .25), false, 40);
    chipCard(g, 'WIRELESS', 420, 1378, fin(t, K.wireless + .2, 4) * (1 - seg(t, K.can - .2, K.can)), 46, 300, true);
    chipCard(g, 'GAMING', 730, 1378, fin(t, K.gaming + .05, 4) * (1 - seg(t, K.can - .2, K.can)), 46, 300, true);
    /* the stall: on "eighty" the scope plate slams onto the bare floor with the 80 (r2: no dashed slot before it) */
    scopePlate(g, t, K.F80, S('set').t0);
    /* STUCK AT 80%? in the gap; it steps back (70 %, 60 % opacity) when YOUR PHONE DID THAT. lands. BROKEN? swings from
       the pipe under the charger and is ripped off on "isn't" */
    var YP = K.yourP - .35, sb = eio(seg(t, K.phoneW, K.phoneW + .25));   /* STUCK steps back on "phone", half a second after the plate */
    if (t >= K.ST && t < K.SLATE + .3) { g.save(); g.translate(300, 590); g.scale(1 - .3 * sb, 1 - .3 * sb); g.translate(-300, -590); g.globalAlpha *= 1 - .4 * sb; stamp(g, 'STUCK AT\n80%?', 300, 590, t, K.ST, 78, HOT, -.06); g.restore(); }
    swingTag(g, 175, 1205, t, seg(t, K.stallW - .1, K.stallW + .15), 'BROKEN?', '#c8432e', seg(t, K.isnt + .05, K.isnt + .33));
    if (t >= YP && t < K.SLATE + .3) heroPlate(g, ['YOUR PHONE', 'DID THAT.'], 310, 818, t, YP, 76);
    heroSlate(g, t);
  }
  /* the DM frame's one hero plate: solid cream card, ink type, slammed (1.3 → 1 in 0.1 s, full opacity from its first frame) */
  function heroPlate(g, lines, x, y, t, t0, px) {
    var k = eout(seg(t, t0, t0 + .1)), s = lerp(1.3, 1, k);
    g.save(); g.translate(x, y); g.rotate(.03); g.scale(s, s);
    font(g, px, 900, DISP, 'condensed'); var tw = Math.max.apply(null, lines.map(function (L) { return g.measureText(L).width; }));
    var w = Math.min(410, tw + 56), h = lines.length * px * 1.04 + 40, oc = ONPROP, ex = EXITING; ONPROP = true; if (k < 1) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, -w / 2 + 8, -h / 2 + 11, w, h, 16); g.fill();
    g.fillStyle = CREAM; rr(g, -w / 2, -h / 2, w, h, 16); g.fill();
    rr(g, -w / 2, -h / 2, w, h, 16); grainIn(g, -w / 2, -h / 2, w, h, 1631, .6);
    if (k >= 1) recBox(g, -w / 2, -h / 2, w / 2, h / 2, lines.join(' '));
    lines.forEach(function (L, i) { txt(g, L, 0, (i - (lines.length - 1) / 2) * px * 1.04 + 4, px, INK, 'center', 900, DISP, w - 40, 1, 64, 'condensed'); });
    ONPROP = oc; EXITING = ex; g.restore();
  }
  /* the iPhone scope, printed in the slot with the 80 (and only with it) */
  function scopePlate(g, t, t0, t1) {
    if (t < t0 || t >= t1 + .3) return;
    var out = seg(t, t1, t1 + .3), sl = eout(seg(t, t0, t0 + .1)), ex = EXITING; if (out > 0 || sl < 1) EXITING = true;
    g.save(); g.globalAlpha *= 1 - out;
    if (sl < 1) { var ss = lerp(1.12, 1, sl); g.translate(583, 1379); g.scale(ss, ss); g.translate(-583, -1379); }   /* r2: slams onto the bare floor */
    sheet(g, 244, 1332, 922, 1426, 3101, PAPER, 'scope plate');
    onprop(function () {
      txt(g, 'iPHONE · IF THE BATTERY GETS TOO WARM', 583, 1360, 40, INK, 'center', 900, DISP, 640, 1, 32, 'condensed');
      txt(g, 'SOFTWARE MIGHT LIMIT CHARGING ABOVE 80%', 583, 1402, 36, '#4b4540', 'center', 800, DISP, 640, 1, 30, 'condensed');
    });
    g.restore(); EXITING = ex;
  }
  /* the hero hold: a chalk slate slides over the bench; the charge line climbs steeply and flattens near FULL (Apple),
     and a coral branch goes flat at 80 (iPhone, if the battery gets too warm). The plate under it is the line. */
  function chargeC(u) { if (u < .45) return .8 * u / .45; var v = Math.min(1, (u - .45) / .47); return .8 + .2 * (1 - (1 - v) * (1 - v)); }   /* reaches FULL at u .92, then runs flat along it to the right edge */
  function heroSlate(g, t) {
    var sIn = seg(t, K.SLATE, K.SLATE + .3);
    if (sIn <= 0) return;
    var T0 = K.SLATE + .2, hp = .04 * sio(seg(t, T0 + .6, S('set').t0)), exh0 = EXITING;
    g.save(); g.translate(510, 800); g.scale(1 + hp, 1 + hp); g.translate(-510, -800);
    var e = eout(sIn), ex = EXITING; if (sIn < 1) EXITING = true;
    g.save(); g.translate(-980 * (1 - e), 0);
    var x0 = 108, y0 = 468, w = 804, h = 664;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 12, y0 + 16, w, h, 18); g.fill();
    g.fillStyle = '#26303a'; rr(g, x0, y0, w, h, 18); g.fill(); rr(g, x0, y0, w, h, 18); grainIn(g, x0, y0, w, h, 2701, 1.2);
    g.strokeStyle = '#8a6b3c'; g.lineWidth = 12; rr(g, x0 + 6, y0 + 6, w - 12, h - 12, 14); g.stroke();
    prop(g, 'chart slate', x0, y0, x0 + w, y0 + h);
    var OX = 214, OY = 1040, XR = 880, YT = 560, YF = 650, LW = 636;
    function cy(c) { return OY - c * (OY - YF); }
    var ax = seg(t, T0 - .15, T0 + .1);
    g.strokeStyle = 'rgba(244,237,224,.8)'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(OX, OY - (OY - YT) * ax); g.lineTo(OX, OY); g.lineTo(OX + (XR - OX) * ax, OY); g.stroke();
    if (ax >= 1) { g.beginPath(); g.moveTo(OX - 14, YT + 20); g.lineTo(OX, YT); g.lineTo(OX + 14, YT + 20); g.moveTo(XR - 20, OY - 14); g.lineTo(XR, OY); g.lineTo(XR - 20, OY + 14); g.stroke(); }
    onprop(function () {
      txt(g, 'CHARGE', OX + 24, YT + 4, 40, CREAM, 'left', 800, DISP, 0, ax, 36, 'condensed');
      txt(g, 'TIME PLUGGED IN', XR - 4, OY + 38, 38, CREAM, 'right', 800, DISP, 0, ax, 36, 'condensed');
      txt(g, 'FULL', OX - 14, YF, 36, CREAM, 'right', 800, DISP, 0, ax, 36, 'condensed');
      txt(g, 'APPLE 105105', XR - 4, YT - 50, 36, '#b9b0a0', 'right', 800, DISP, 640, ax, 36, 'condensed');
      txt(g, 'OUR DRAWING', OX + 4, OY + 38, 36, '#b9b0a0', 'left', 800, DISP, 0, ax, 36, 'condensed');
    });
    if (ax > 0) { g.save(); g.globalAlpha *= ax * .35; g.strokeStyle = CREAM; g.lineWidth = 3; g.setLineDash([10, 12]); g.beginPath(); g.moveTo(OX, YF); g.lineTo(OX + 20 + LW, YF); g.stroke(); g.setLineDash([]); g.restore(); }
    function chalk(fn, u0, u1, col, wd) {
      if (u1 <= u0) return;
      g.strokeStyle = col; g.lineWidth = wd; g.beginPath();
      for (var i = 0; i <= 50; i++) { var u = lerp(u0, u1, i / 50), x = OX + 20 + LW * u, y = cy(fn(u)) + 2 * Math.sin(u * 37) * (1 - seg(u, .85, .92)); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
    /* the line climbs to 80, then splits: cream goes on and flattens near FULL, the coral shelf stays flat at 80 */
    var k0 = eio(seg(t, T0, T0 + .25)), k1 = eio(seg(t, T0 + .25, T0 + .6)), k2 = eio(seg(t, T0 + .25, T0 + .5));
    chalk(chargeC, 0, .45 * k0, 'rgba(244,237,224,.92)', 10);
    if (k1 > 0) chalk(chargeC, .45, lerp(.45, 1, k1), 'rgba(244,237,224,.92)', 10);
    if (k2 > 0) chalk(function () { return .8; }, .45, lerp(.45, 1, k2), HOT, 12);
    /* the hero hit: a chalk ring round the split */
    var rk = seg(t, K.HR - .05, K.HR + .3);
    if (rk > 0) { var cxx = OX + 20 + LW * .45, cyy = cy(.8); g.strokeStyle = 'rgba(244,237,224,.9)'; g.lineWidth = 6; g.beginPath(); for (var q = 0; q <= 40 * rk; q++) { var an = -1.2 + q / 40 * 6.6, r2 = 40 + 4 * Math.sin(q * .7); if (q) g.lineTo(cxx + Math.cos(an) * r2 * 1.2, cyy + Math.sin(an) * r2); else g.moveTo(cxx + Math.cos(an) * r2 * 1.2, cyy + Math.sin(an) * r2); } g.stroke(); }
    g.lineCap = 'butt';
    onprop(function () {
      txt(g, 'SLOWS NEAR FULL', XR - 4, YF - 44, 40, CREAM, 'right', 900, DISP, 560, seg(t, T0 + .15, T0 + .25), 36, 'condensed');
      var la = seg(t, T0 + .2, T0 + .3);
      txt(g, '80%', OX - 14, cy(.8), 40, HOT, 'right', 900, DISP, 0, la, 36, 'condensed');
      txt(g, 'TOO WARM?', XR - 4, cy(.8) + 64, 40, CREAM, 'right', 900, DISP, 400, la, 36, 'condensed');
      txt(g, 'iPHONE MIGHT', XR - 4, cy(.8) + 110, 40, CREAM, 'right', 900, DISP, 400, la, 36, 'condensed');
      txt(g, 'HOLD AT 80%', XR - 4, cy(.8) + 156, 40, CREAM, 'right', 900, DISP, 400, la, 36, 'condensed');
    });
    g.restore(); EXITING = ex;
    g.restore(); EXITING = exh0;
  }

  /* =====================================================================================================
     THE SETTINGS, upright: re-created generic screens, no checkmark, no switch, no state highlighted.
     iPhone: Battery, one row (our label) CHARGING ON HOLD?. Pixel: Battery diagnostics, four states in Google's order.
     ===================================================================================================== */
  var SX0 = 132, SY0 = 468, SX1 = 888, SY1 = 1030;
  function setPhone(g, t, mode) {
    var r = mulberry(71), w = SX1 - SX0, h = SY1 - SY0;
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.moveTo(SX0 + 12, SY0 + 110); g.arcTo(SX0 + 12, SY0 + 16, SX0 + 110, SY0 + 16, 90); g.arcTo(SX1 + 12, SY0 + 16, SX1 + 12, SY0 + 110, 90); g.lineTo(SX1 + 12, SY1 + 14); g.lineTo(SX0 + 12, SY1 + 14); g.closePath(); g.fill();
    g.fillStyle = PHB; g.beginPath(); g.moveTo(SX0, SY0 + 90); g.arcTo(SX0, SY0, SX0 + 90, SY0, 90); g.arcTo(SX1, SY0, SX1, SY0 + 90, 90);
    for (var i = 0; i <= 22; i++) g.lineTo(SX1 - w * i / 22, SY1 - r() * 18);
    g.closePath(); g.fill();
    prop(g, 'settings phone', SX0, SY0, SX1, SY1);
    var ix0 = SX0 + 22, iy0 = SY0 + 22, iw = w - 44;
    g.fillStyle = '#efe8db'; g.beginPath(); g.moveTo(ix0, iy0 + 70); g.arcTo(ix0, iy0, ix0 + 70, iy0, 70); g.arcTo(ix0 + iw, iy0, ix0 + iw, iy0 + 70, 70); g.lineTo(ix0 + iw, SY1 - 36); g.lineTo(ix0, SY1 - 36); g.closePath(); g.fill();
    g.save(); g.clip(); grainIn(g, ix0, iy0, iw, h, 2901, .5); g.restore();
    /* the status bar: a small battery, dark on the light screen (no number) */
    g.save(); g.translate(720, SY0 + 70); g.scale(.5, .5);
    g.strokeStyle = INK; g.lineWidth = 9; rr(g, 0, -52, 236, 104, 22); g.stroke(); g.fillStyle = INK; rr(g, 242, -20, 16, 40, 5); g.fill();
    for (var s2 = 0; s2 < 3; s2++) { rr(g, 14 + s2 * 55, -38, 46, 76, 7); g.fill(); }
    g.restore();
    var head = mode === 'pixel' ? 'Battery diagnostics' : 'Battery';
    onprop(function () {
      txt(g, '‹', SX0 + 58, SY0 + 186, 64, INK, 'left', 900, DISP, 0, 1, 40, 'condensed');
      txt(g, head, SX0 + 100, SY0 + 186, 62, INK, 'left', 900, DISP, 560, 1, 44, 'condensed');
    });
    if (mode === 'pixel') {
      /* one empty STATE: slot (we never fill it in) and Google's four states as four identical small chips, none selected */
      var cy = SY0 + 236, rh = 76;
      g.fillStyle = '#fbf7ef'; rr(g, SX0 + 46, cy, w - 92, rh, 16); g.fill();
      g.save(); g.strokeStyle = 'rgba(33,29,38,.45)'; g.lineWidth = 4; g.setLineDash([14, 10]); rr(g, SX0 + 236, cy + 14, w - 92 - 214, rh - 28, 10); g.stroke(); g.setLineDash([]); g.restore();
      onprop(function () {
        txt(g, 'STATE:', SX0 + 78, cy + rh / 2 + 2, 48, INK, 'left', 800, DISP, 0, 1, 40, 'condensed');
        txt(g, '4 POSSIBLE STATES', SX0 + 78, SY0 + 372, 36, '#4b4540', 'left', 900, DISP, 0, 1, 36, 'condensed');
        var CH = ['Cold', 'Normal', 'Warm', 'Elevated'], xs = SX0 + 62;
        font(g, 38, 800, DISP, 'condensed');
        CH.forEach(function (c) { var cw = g.measureText(c).width + 36; chip(g, c, xs + cw / 2, SY0 + 436, { px: 38, wt: 800, st: 'condensed', fg: INK, bg: '#fbf7ef', line: 'rgba(33,29,38,.55)', lw: 3, r: 14, shadow: false, w: cw, h: 58 }); xs += cw + 16; font(g, 38, 800, DISP, 'condensed'); });
      });
    } else {
      var cy1 = SY0 + 250, rh1 = 72;
      g.fillStyle = '#fbf7ef'; rr(g, SX0 + 46, cy1, w - 92, rh1, 16); g.fill();
      onprop(function () { txt(g, 'CHARGING ON HOLD?', SX0 + 78, cy1 + rh1 / 2 + 2, 48, INK, 'left', 800, DISP, 560, 1, 40, 'condensed'); });
      g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(SX1 - 104, cy1 + 20); g.lineTo(SX1 - 84, cy1 + 36); g.lineTo(SX1 - 104, cy1 + 52); g.stroke(); g.lineCap = 'butt'; g.lineJoin = 'miter';
      onprop(function () { tag(g, 'OUR LABEL', 510, cy1 + rh1 + 36, 1, 0, 600, INK, '#efe8db', 32); });
    }
  }
  function setScene(g, t) {
    if (LAYER === 'bg') { wall(g, '#161c26'); return; }
    var E0 = S('set').t0, k = eout(seg(t, E0 - .6, E0 + .1)), sc = lerp(.9, 1, k) + .012 * seg(t, E0, K.cool);
    /* the phone turns over: iPhone → Pixel on "Pixel"; on "then Battery." it tips 8° toward the viewer first */
    var turn = seg(t, K.pixel - .5, K.pixel - .2);
    var mode = turn > .5 ? 'pixel' : 'iphone', sx = Math.max(.03, Math.abs(Math.cos(Math.PI * turn)));
    var tilt = -.14 * (sio(seg(t, K.settings - .02, K.batt2 + .15)) - sio(seg(t, K.pixel - .55, K.pixel - .1)));
    g.save(); g.translate(510, 780 + 5 * Math.sin(t * 2.1)); g.rotate(.006 * Math.sin(t * 1.3) + tilt); g.scale(sc * sx * .95, sc * .95); g.translate(-510, -740);
    var ex = EXITING; if (k < 1 || sx < .999) EXITING = true;
    setPhone(g, t, mode);
    onprop(function () { tag(g, 'RE-CREATED', 330, SY0 + 70, 1, 0, 260, INK, '#efe8db', 34); });
    EXITING = ex;
    g.restore();
    slapCard(g, 'CHECK YOURS', 300, 474, t, K.CHK, 40, 380);
    /* the quotes enter 0.6 s after each screen has settled (iPhone: E0 + 0.1; Pixel: the turn ends at "Pixel" − 0.2) */
    var aq = seg(t, E0 + .7, E0 + .78), aqo = seg(t, K.pixel + .45, K.pixel + .65);   /* the iPhone quote rides through the turn, then peels as the Pixel one comes */
    qplate(g, 108, 1046, 804, ['“YOU CAN SEE IF CHARGING WAS ON', 'HOLD ON YOUR iPHONE BY OPENING', 'SETTINGS AND TAPPING BATTERY.”'], 46, ['APPLE SUPPORT'], 3201, aq, aqo, false);
    pathCard(g, t, 1292, 'iPHONE', ['Settings › Battery'], seg(t, E0 + .85, E0 + .95), aqo);
    var pq = seg(t, K.pixel + .6, K.pixel + .7), pqo = seg(t, S('back').t0 - .3, S('back').t0 - .05);
    qplate(g, 108, 1070, 804, ['“…ONE OF FOUR', 'TEMPERATURE STATES…”'], 50, ['GOOGLE PIXEL HELP'], 3211, pq, pqo, false);
    pathCard(g, t, 1292, 'PIXEL 6a & LATER', ['Settings › Battery ›', 'Battery diagnostics'], seg(t, K.pixel + .7, K.pixel + .78), pqo);
  }
  function pathCard(g, t, y, head, rows, inn, out) {
    if (inn <= 0 || out >= 1) return;
    var ei = eout(inn), eo = eio(out), ex = EXITING; if (ei < 1 || eo > 0) EXITING = true;
    g.save(); g.globalAlpha *= seg(ei, 0, .6) * (1 - eo); g.translate(60 * (1 - ei) - 500 * eo, 0);
    sheet(g, 108, y, 912, y + 132, Math.round(y) + 7, CREAM, 'path card');
    onprop(function () {
      txt(g, head, 134, y + 34, 44, '#4b4540', 'left', 900, DISP, 740, 1, 36, 'condensed');
      var two = rows.length > 1;
      rows.forEach(function (rw, i) { if (two) txt(g, rw, 134 + i * 300, y + 88, 42, INK, 'left', 800, DISP, i ? 450 : 290, 1, 36, 'condensed'); else txt(g, rw, 134, y + 88, 48, INK, 'left', 800, DISP, 750, 1, 36, 'condensed'); });
    });
    g.restore(); EXITING = ex;
  }

  /* =====================================================================================================
     BACK ON THE BENCH: too hot to hold, unplug it (the charger pulls out of the wall, the pipe drains, the strip
     cools), then the end card: the charger back in, the camera pushes back to frame 0's close-up, YES / NO
     ===================================================================================================== */
  function backScene(g, t) {
    if (LAYER === 'bg') { bench(g); return; }
    var tt = t - TEND + 1 / 30;     /* the last frame (TEND − 1/60) shows the bench's time 1/60: frame 0's picture */
    var pull = sp(t, K.unplug - .05, 3.2, .7) - sp(t, K.end + .1, 3, .9);
    var flow = 1 - seg(t, K.unplug + .05, K.unplug + .6) + seg(t, K.end + .25, K.end + .8);
    var h = 1 - eio(seg(t, K.unplug + .3, K.coolW + .35)) + .5 * eio(seg(t, K.end + .25, K.end + .9));   /* plugged back in: warm again, frame 0's three cells */
    var z = eio(seg(t, K.end - .05, K.end + .55));
    var gl = eio(seg(t, TEND - .55, TEND - 1 / 30));
    var dy = DY0 * (1 - eout(clamp(1 / 60, 0, .55) / .55)) * gl;
    var exw = EXITING; if (z > 0 && z < 1) EXITING = true;
    g.save(); camTf(g, z, dy);
    benchWorld(g, t, {
      pull: clamp(pull, 0, 1.08), flow: clamp(flow, 0, 1), thin: 0, route: 0, padK: 0, ph: V0 * tt, h: h, lab: 1 - seg(t, K.end - .1, K.end + .25),
      fill: .55, p80: false, bolt: clamp(flow, 0, 1) * (.75 + .25 * Math.abs(Math.cos(tt * 2.4))), game: 0,
      curls: Math.max(seg(t, K.cool, K.cool + .3) * (1 - seg(t, K.unplug + .2, K.unplug + .8)), seg(t, K.end + .3, K.end + .8)), cs: 1 + .4 * z, ct: tt,
      wa: 0, handK: 0, tagA: 1 - seg(t, K.end - .2, K.end + .2), camz: z, pclip: pclipX(z)
    });
    g.restore(); EXITING = exw;
    /* Google's words, then Samsung's, in the text zone */
    qplate(g, 104, 560, 412, ['“…DISCONNECT IT', 'FROM ITS POWER', 'SOURCE…', 'MOVE IT TO A', 'COOLER PLACE…”'], 46, ['GOOGLE PIXEL HELP', 'SAMSUNG TOO'], 3301, seg(t, S('back').t0 - .25, S('back').t0), seg(t, K.end + .2, K.end + .45), false);
    /* the end card: frame 0's sticker and YES / NO (cream, neither highlighted); they shrink away before the cut */
    var sk = eout(seg(t, K.end + .05, K.end + .45));
    if (sk > 0) { var exs = EXITING; if (sk < 1) EXITING = true; g.save(); g.translate(-700 * (1 - sk), 160 * (1 - sk)); g.rotate(-.3 * (1 - sk)); sticker(g, 510, 1274 + drift(tt, .9, .25), 1); g.restore(); EXITING = exs; }
    var yo = eio(seg(t, K.noEnd + .06, K.noEnd + .26));
    [['YES', 330], ['NO', 690]].forEach(function (c) {
      var tq0 = c[0] === 'YES' ? K.yesE : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), kc = eout(seg(t, K.warmE - .1, K.warmE + .1)), sc = lerp(1.08, 1, kc) * (1 - .07 * tp) * (1 - yo);
      if (sc <= .01 || kc <= 0) return;
      var oc = ONPROP, ex0 = EXITING; ONPROP = true; EXITING = ex0 || yo > 0 || kc < 1; chip(g, c[0], c[1], 546 + 8 * tp, { px: 112, wt: 900, bg: BG, line: CREAM, lw: 8, fg: CREAM, w: 250, h: 160, r: 54, shadow: true, a: kc * (1 - seg(yo, .5, .9)), s: sc, maxw: 250 }); ONPROP = oc; EXITING = ex0;
    });
  }
  function qplate(g, x0, y0, w, lines, px, credits, seed, inn, out, retag, minpx) {
    if (inn <= 0 || out >= 1) return;
    var ex0 = EXITING, lh = px * 1.12, h = 26 + lines.length * lh + credits.length * 44 + 14;
    var ei = eout(clamp(inn, 0, 1)), eo = eio(clamp(out, 0, 1));
    g.save();
    if (ei < 1) { g.translate(110 * (1 - ei), 0); g.globalAlpha *= seg(ei, 0, .7); EXITING = true; }
    if (eo > 0) { EXITING = true; g.translate(x0, y0 + h); g.rotate(-.08 * eo); g.translate(-x0, -(y0 + h)); g.translate(-60 * eo, 50 * eo); g.globalAlpha *= 1 - eo; }
    sheet(g, x0, y0, x0 + w, y0 + h, seed, PAPER, 'quote');
    onprop(function () {
      lines.forEach(function (L, i) { txt(g, L, x0 + 28, y0 + 20 + lh * (i + .5), px, INK, 'left', 900, DISP, w - 56, 1, minpx || 44, 'condensed'); });
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
  var CAPGROUPS = { hook: [[3, 2]], ask: [[2, 3], [4]], why: [[2], [4, 3]], more: [[2, 2], [3]], stall: [[2, 2], [3], [1]], twist: [[3, 2], [4]], protect: [[4, 4]], iphone: [[2], [5], [4]], pixel: [[2], [2, 3]], cool: [[4], [2, 4]], end: [[5], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'normal.'], ['ask', 'hot'], ['why', 'warms'], ['more', 'gaming'], ['stall', '80%.'], ['twist', 'phone'], ['protect', 'slows'], ['iphone', 'paused'], ['pixel', 'temperature.'], ['cool', 'Unplug'], ['end', 'warm']]
    .map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPPX = 52, CAPMIN = 1e9;
  /* "Check yours." waits for the paper tear to finish (the settings screen is in), then gives way to the CHECK YOURS chip */
  function capStart(c) { return /^check$/i.test(norm(c.words[0].w)) ? Math.max(c.t0 - .04, S('set').t0 + .02) : c.t0 - .04; }
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
    /* r2: "Your phone did that." steps back to 50 % while the YOUR PHONE / DID THAT. plate says it */
    var dim = (words[0].t0 === at('twist', 'Your', 1) && t < K.SLATE + .3) ? .5 : 1;
    g.globalAlpha = fi * out * dim * (alpha == null ? 1 : alpha);
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
  var NOISE, SCENES = { benchScene: benchScene, setScene: setScene, backScene: backScene };
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
    var wk = Nx && !Nx.cut ? seg(te, Nx.t0 - (Nx.tw || TW), Nx.t0) : 0;
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
    g.fillText('Why your phone gets', CX, 362);
    var b = 'hot when charging', bp = 62; font(g, bp, 800, DISP, 'expanded');
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
  var GAIN = { hk: .5, st: .112, gr: .175, hr: .047, ck: .5, cl: .5 };   /* r1 jury: the hero thump .045 → .052 (.12 sat level with the voice in the mix; the SFX gate needs 3 dB under) */   /* r2: every hit ≈ −18 dB RMS over its body in the mix */
  var TYPE = { hk: 'tick', st: 'slap', gr: 'knock', hr: 'thump', ck: 'tick', cl: 'tick' };
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
  var HOLD = { t0: K.protEnd, t1: K.iphone };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((K.TT + .6) * 30) / 30 + 1 / 60, SLUG: 'hotcharging', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  function times(step) { if (Array.isArray(step)) return step; var a = []; for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) a.push(t); return a; }
  window.CLIP_RUN = function (step) {
    var out = {};
    times(step).forEach(function (t) {
      PROPS = []; CURT = t; frame(ctx, t);
      PROPS.forEach(function (p) {
        var b = p.b, over = Math.max(SAFE_BOX.x0 - b[0], b[2] - SAFE_BOX.x1, SAFE_BOX.y0 - b[1], b[3] - SAFE_BOX.y1);
        if (over > 1) { var o = out[p.name] || (out[p.name] = { prop: p.name, from: t, to: t, over: 0, n: 0 }); o.to = t; o.n++; o.over = Math.max(o.over, Math.round(over)); }
      });
      PROPS = null;
    });
    return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.LABELS_RUN = function (step) {
    var out = {};
    times(step).forEach(function (t) {
      PROPS = []; LBL = []; CURT = t; frame(ctx, t);
      LBL.forEach(function (l) {
        PROPS.forEach(function (p) {
          var ox = Math.min(l.b[2], p.b[2]) - Math.max(l.b[0], p.b[0]), oy = Math.min(l.b[3], p.b[3]) - Math.max(l.b[1], p.b[1]);
          if (ox > 1 && oy > 1) { var key = l.text + ' × ' + p.name, o = out[key] || (out[key] = { label: l.text, prop: p.name, from: t, to: t, area: 0 }); o.to = t; o.area = Math.max(o.area, Math.round(ox * oy)); }
        });
      });
      PROPS = null; LBL = null;
    });
    return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
