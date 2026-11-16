/* "Dark mode doesn't always save battery." — Factory #31 (darkmode) on Tech, explained, after ../notprivate/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is lights out: one cut-paper room (wall, desk, a wall switch), a generic phone and a workbench power
   meter (% LESS POWER) wired to it. The switch flips and the room drops to ink; what's left is the phone's black: a gray
   glow on LCD (the X-ray flap shows the backlight burning behind closed blinds), nothing at all on OLED (a grid of paper
   bulbs, the black ones switched off). The meter's needle answers every switch: it doesn't move for LCD, creeps for OLED,
   swings into 3–9 indoors and slams into the coral 39–47 band in the sun. One hero mark: that coral band; coral is also
   on the end card's YES / NO and nowhere else. Scenes change under a blank dark panel. Everything drawn by hand: generic
   phones (round punch-hole, no logo), the dark-mode toggle says RE-CREATED.
   Props stay whole inside the safe box x 92–928, y 302–1428; backgrounds bleed full width. */
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
  var BODY = { thump: .2, knock: .14, slap: .1, paper: .17, pop: .12, tick: .05, click: .06, swish: .21, rip: .24, marker: .3 };
  var GT = {};
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  BODY.buzz = .2; BODY.rattle = .26;
  BODY.buzz = .2; BODY.clink = .1; BODY.click = .06;
  var K = {
    always: at('hook', 'always'), hbat: at('hook', 'battery'), hookEnd: lend('hook'),
    ask: start('ask'), abat: at('ask', 'battery'), phone: at('ask', 'phone'), askEnd: lend('ask'),
    test: start('test'), off: at('test', 'off'), lights: at('test', 'lights'), tblack: at('test', 'black'), photo: at('test', 'photo'), testEnd: lend('test'),
    glow: start('glow'), glows: at('glow', 'glows'), gray: at('glow', 'gray'), lcd: at('glow', 'lcd'), glowEnd: lend('glow'),
    lamp: start('lamp'), backlight: at('lamp', 'backlight'), lon: at('lamp', 'on'), lblack: at('lamp', 'black'), lampEnd: lend('lamp'),
    dip: start('dip'), ddark: at('dip', 'dark'), cant: at('dip', "can't"), dswitch: at('dip', 'switch'), doff: at('dip', 'off'), dipEnd: lend('dip'),
    oled: start('oled'), pitch: at('oled', 'pitch'), oledW: at('oled', 'oled'), oledEnd: lend('oled'),
    pixels: start('pixels'), pixel: at('pixels', 'pixel'), own: at('pixels', 'own'), light: at('pixels', 'light'), pblack: at('pixels', 'black'), poff: at('pixels', 'off'), pixEnd: lend('pixels'),
    indoor: start('indoor'), indoors: at('indoor', 'indoors'), purdue: at('indoor', 'purdue'), just: at('indoor', 'just'), n3: at('indoor', '3'), n9: at('indoor', '9'), indoorEnd: lend('indoor'),
    sun: start('sun'), bright: at('sun', 'brightness'), sunW: at('sun', 'sun'), n39: at('sun', '39'), n47: at('sun', '47'), sunEnd: lend('sun'),
    end: start('end'), eglow: at('end', 'glow'), yes: at('end', 'yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  (function () {
    place('hk', 'slap', K.hookEnd + .2, .16, K.hookEnd, K.ask);                           /* the black half sweeps over the white */
    place('lo', 'slap', voiceEnd('test', K.glow) + .08, .16, K.testEnd, K.glow);          /* LIGHTS OFF lands */
    place('fl', 'paper', voiceEnd('glow', K.lamp) + .06, .16, K.glowEnd, K.lamp);         /* the screen's front lifts like a flap */
    place('bz', 'buzz', voiceEnd('dip', K.oled) + .05, .16, K.dipEnd, K.oled);            /* the toggle droops: nothing changed */
    place('tk1', 'tick', voiceEnd('pixels', K.indoor) + .04, .16, K.pixEnd, K.indoor);    /* the last bulb rows click off */
    if (GT.tk1 != null) place('tk2', 'tick', GT.tk1 + .085, .16, GT.tk1 + .07, K.indoor);
    if (GT.tk2 != null) place('tk3', 'tick', GT.tk2 + .085, .16, GT.tk2 + .07, K.indoor);
    place('nd', 'tick', voiceEnd('indoor', K.sun) + .06, .16, K.indoorEnd, K.sun);        /* the needle settles in 3–9 (visual only: the tick sound failed the SFX gate twice, jury r2 fix 3) */
    place('hero', 'thump', K.sunEnd + .72, .16, K.sunEnd + .5, K.end - .6);           /* THE hit: the needle slams into 39–47 */
    place('sw', 'click', K.lights + .2, .16, K.lights - .1, K.lights + .7);              /* the wall switch, if the take leaves room */
    /* no needle clink: a bright ping alone in the 2 s hold made Whisper hear words there */
  })();
  var TW = .5;                                             /* a sliding-panel wipe: 0.5 s */
  K.HK = GT.hk != null ? GT.hk : K.hookEnd + .2;
  K.LO = GT.lo != null ? GT.lo : K.testEnd + .2;
  K.FL = GT.fl != null ? GT.fl : K.glowEnd + .15;
  K.BZ = GT.bz != null ? GT.bz : K.dipEnd + .15;
  K.TK = [GT.tk1, GT.tk2, GT.tk3].map(function (x, i) { return x != null ? x : K.pixEnd + .1 + i * .1; });
  K.ND = GT.nd != null ? GT.nd : K.indoorEnd + .15;
  K.HERO = GT.hero != null ? GT.hero : K.sunEnd + .3;
  var SC = [
    { id: 'room', fn: 'roomScene', name: 'Dark mode saves battery? Lights off: the LCD glows gray', t0: 0 },
    { id: 'oled', fn: 'roomScene', name: 'Pitch black: OLED, every pixel its own light', t0: K.pixels + .2, cut: true },
    { id: 'hero', fn: 'roomScene', name: 'Purdue: 3–9% indoors, 39–47% at full brightness', t0: K.indoor, cut: true },
    { id: 'end', fn: 'endScene', name: 'Does your black glow?', t0: K.end - .04, cut: true }
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
    PROPS.push({ name: name, b: xbox(g, x0, y0, x1, y1) });
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
      txt(g, credit, x0 + 30, y0 + h - 30, 34, '#5d564c', 'left', 800, DISP, retag === false ? w - 60 : w - 250, 1, 30, 'condensed');
    });
    if (retag !== false) tag(g, 'RE-CREATED', x0 + w - 118, y0 + h - 32, 1, 0, 200, INK, PAPER, 30);
    EXITING = ex0;
    g.restore();
    return h;
  }
  /* =====================================================================================================
     PROPS (all paper, all drawn by hand)
     ===================================================================================================== */
  function decay(t, t0, f, k) { if (t < t0) return 0; var dt = t - t0; return Math.sin(dt * f) * Math.exp(-dt * k); }
  function lerpPose(a, b, k) { return { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), s: lerp(a.s, b.s, k), rot: lerp(a.rot || 0, b.rot || 0, k) }; }
  function mixc(a, b, k) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(lerp(a[i], b[i], clamp(k, 0, 1))); }).join(',') + ')'; }
  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }

  /* ---------- the room: the light level (1 lit, 0 lights out) and the sun's warmth, both functions of t ---------- */
  function roomL(t) {
    var off = eio(seg(t, K.lights - .04, K.lights + .26));
    var on1 = .55 * eio(seg(t, K.indoors - .3, K.indoors + .15));
    var on2 = .45 * eio(seg(t, K.sunW - .35, K.sunW + .25));
    return clamp(1 - off + on1 + on2, 0, 1);
  }
  function warmth(t) { return eio(seg(t, K.sunW - .35, K.sunW + .45)); }
  /* the wall and the desk bleed full width; never brighter than ~80 so nothing outside the rail reads as a prop */
  function wall(g, L, warm) {
    var c = [lerp(7, 34, L) + 16 * warm, lerp(9, 40, L) + 8 * warm, lerp(13, 52, L) - 6 * warm];
    g.fillStyle = mixc(c, c, 0); g.fillRect(-300, -300, W + 600, H + 600);
    g.fillStyle = 'rgba(255,255,255,' + (.012 + .02 * L).toFixed(3) + ')'; for (var x = -300; x < W + 300; x += 84) g.fillRect(x, -300, 34, 1728);
    var pool = g.createRadialGradient(260, 470, 40, 260, 470, 980);
    pool.addColorStop(0, 'rgba(255,214,150,' + (.11 * L + .07 * warm).toFixed(3) + ')'); pool.addColorStop(1, 'rgba(255,214,150,0)');
    g.fillStyle = pool; g.fillRect(-300, -300, W + 600, H + 600);
    g.fillStyle = mixc([5, 6, 8], [38, 33, 28], L * .85 + .15 * warm); g.fillRect(-300, 1428, W + 600, H);
    g.fillStyle = 'rgba(244,237,224,' + (.03 + .1 * L).toFixed(3) + ')'; g.fillRect(-300, 1426, W + 600, 5);
  }

  /* ---------- the phone: generic (round punch-hole, no logo), 420 × 820 at s 1, origin at its centre ---------- */
  var PW = 420, PHH = 820, SX = 190, SY = 390;
  /* frame 0: the phone at full size (820 px, y 462–1282, under the caption band) gliding 365 px right → left; the meter's dial (331 px) slides the other way under it */
  var F0A = { cx: 700, cy: 872, s: 1, rot: .02 }, F0B = { cx: 335, cy: 872, s: 1, rot: -.012 }, BODYP = { cx: 235, cy: 800, s: .58, rot: 0 };
  var PIXP = { cx: 300, cy: 820, s: .78, rot: 0 }, MINIP = { cx: 178, cy: 585, s: .27, rot: 0 }, ENDP = { cx: 650, cy: 884, s: .96, rot: -.02 };
  /* the glow test's two answers side by side, ~700 px tall each */
  var LCDP = { cx: 290, cy: 830, s: .85, rot: 0 }, OLEDP = { cx: 740, cy: 830, s: .85, rot: 0 };
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
  /* the frame-0 screen: white on the left, black on the right, DARK MODE across the split (the type inverts at it) */
  function splitScreen(g, f, bright, words) {
    var bx = lerp(SX, -SX, f), wb = bright == null ? 1 : bright;
    g.fillStyle = mixc([150, 147, 140], hex(SCRW), wb); g.fillRect(-SX, -SY, bx + SX, SY * 2);
    if (bx < SX) { g.fillStyle = '#08090b'; g.fillRect(bx, -SY, SX - bx, SY * 2); }
    if (words === false) return;
    function word(col) { onprop(function () { txt(g, 'DARK', 0, -150, 150, col, 'center', 900, DISP, 340, 1, 60, 'condensed'); txt(g, 'MODE', 0, 0, 150, col, 'center', 900, DISP, 340, 1, 60, 'condensed'); }); }
    g.save(); g.beginPath(); g.rect(-SX, -SY, bx + SX, SY * 2); g.clip(); word(INK); g.restore();
    if (bx < SX) { var nr = NOREC; NOREC = true; g.save(); g.beginPath(); g.rect(bx, -SY, SX - bx + 1, SY * 2); g.clip(); word(CREAM); g.restore(); NOREC = nr; }
  }
  /* a black photo print growing to fill the screen (cream border, gone once it covers) */
  function photoPrint(g, p) {
    if (p <= 0) return;
    var e = eout(p), w = lerp(120, SX * 2 + 60, e), h = lerp(90, SY * 2 + 60, e);
    g.save(); g.rotate(.08 * (1 - e));
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(-w / 2 + 8, -h / 2 + 12, w, h);
    g.fillStyle = CREAM; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = '#060708'; g.fillRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
    g.restore();
  }
  /* LCD black: a gray glow, brighter at the edges where the backlight leaks */
  function lcdBlack(g, k) {
    if (k <= 0) return;
    g.fillStyle = 'rgba(96,97,103,' + k.toFixed(3) + ')'; g.fillRect(-SX, -SY, SX * 2, SY * 2);
    var gr = g.createRadialGradient(0, 0, 120, 0, 0, 470); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(225,226,232,' + (.28 * k).toFixed(3) + ')');
    g.fillStyle = gr; g.fillRect(-SX, -SY, SX * 2, SY * 2);
  }
  /* the X-ray: the backlight (a warm light sheet fed by a row of paper bulbs) behind a set of blinds; b = how open */
  function backlight(g, b) {
    var gr = g.createLinearGradient(0, SY, 0, -SY); gr.addColorStop(0, '#fff3cc'); gr.addColorStop(1, '#f1d998');
    g.fillStyle = gr; g.fillRect(-SX, -SY, SX * 2, SY * 2);
    var n = 13, top = -SY, bot = SY - 84, pitch = (bot - top) / n;
    for (var i = 0; i < n; i++) {
      var y = top + i * pitch, hgt = pitch * lerp(.86, .2, clamp(b, 0, 1));
      g.fillStyle = '#1c1f27'; g.fillRect(-SX, y, SX * 2, hgt);
      g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(-SX, y, SX * 2, 3);
    }
    /* the lamp row along the bottom edge: a brass rail and seven paper bulbs, always on */
    g.fillStyle = BRASS2; g.fillRect(-SX, SY - 70, SX * 2, 70);
    g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(-SX, SY - 84, SX * 2, 16);
    for (var j = 0; j < 7; j++) { var x = -SX + 28 + j * ((SX * 2 - 56) / 6); g.fillStyle = 'rgba(255,236,170,.45)'; el(g, x, SY - 40, 30, 30); g.fillStyle = LAMP; el(g, x, SY - 40, 19, 19); g.fillStyle = '#fffaf0'; el(g, x - 5, SY - 45, 6, 6); }
  }
  /* the screen's front sheet lifted on a hinge at its top: k 0 = shut, 1 = up (~78°); the underside shows lighter */
  function frontFlap(g, k) {
    if (k <= 0) return;
    g.save(); rr(g, -SX - 20 * k, -SY, SX * 2 + 40 * k, SY * 2, 46); g.clip();   /* starts exactly on the screen's rounded edge, never over the frame */
    var th = k * 1.36, hgt = SY * 2 * Math.cos(th), wid = 1 + .1 * Math.sin(th);
    var y0 = -SY, y1 = -SY + hgt;
    g.fillStyle = 'rgba(0,0,0,.35)'; poly(g, [[-SX, y0], [SX, y0], [SX * wid + 6, y1 + 16], [-SX * wid + 6, y1 + 16]]); g.fill();
    g.fillStyle = mixc([96, 97, 103], [168, 170, 178], k); poly(g, [[-SX, y0], [SX, y0], [SX * wid, y1], [-SX * wid, y1]]); g.fill();
    g.strokeStyle = 'rgba(244,237,224,' + (.55 * seg(k, .08, .3)).toFixed(3) + ')'; g.lineWidth = 4; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.12)'; poly(g, [[-SX * .6, y0], [-SX * .2, y0], [-SX * .3 * wid, y1], [-SX * .7 * wid, y1]]); g.fill();
    g.restore();
  }
  /* OLED: a grid of paper bulbs (6 × 12), each its own light; lit(i, j) gives 0..1 */
  function bulbs(g, lit, sheetY) {
    g.fillStyle = '#0a0b0e'; g.fillRect(-SX, -SY, SX * 2, SY * 2);
    var cols = 6, rows = 12, pw = SX * 2 / cols, ph = SY * 2 / rows;
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var J = BJ[j * cols + i], x = -SX + (i + .5) * pw + J[0], y = -SY + (j + .5) * ph + J[1], R0 = 25 + J[2], k = lit(i, j);
      g.fillStyle = '#16181e'; cut(g, ring(x, y, R0 + 2), mulberry(J[3]), 2.4);
      if (k > 0) {
        g.fillStyle = 'rgba(255,226,140,' + (.3 * k).toFixed(3) + ')'; el(g, x, y, R0 + 7, R0 + 7);
        g.fillStyle = mixc([40, 40, 44], hex(GLOW), k); cut(g, ring(x, y, R0), mulberry(J[3] + 1), 2.6);
        g.fillStyle = 'rgba(255,250,235,' + (.8 * k).toFixed(3) + ')'; cut(g, ring(x - 7, y - 8, 7), mulberry(J[3] + 2), 1.4);
      }
      g.strokeStyle = 'rgba(244,237,224,.2)'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, R0 + 1, 0, 6.283); g.stroke();
    }
    g.beginPath(); g.rect(-SX, -SY, SX * 2, SY * 2); grainIn(g, -SX, -SY, SX * 2, SY * 2, 961, 1.3);
    if (sheetY > -SY) { g.fillStyle = 'rgba(2,2,4,.55)'; g.fillRect(-SX, -SY, SX * 2, sheetY + SY); g.fillStyle = 'rgba(244,237,224,.35)'; g.fillRect(-SX, sheetY - 2, SX * 2, 4); }
  }
  function ring(x, y, r) { var o = []; for (var i = 0; i < 9; i++) { var a = i / 9 * 6.283; o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return o; }

  /* ---------- the power meter: a workbench panel meter, 780 × 720 at s 1, origin at its centre; % LESS POWER ---------- */
  var MS0 = { cx: 290, cy: 1250, s: .48 }, MS = { cx: 738, cy: 1250, s: .48 }, MHA = { cx: 510, cy: 1068, s: .94 }, MHB = { cx: 510, cy: 1066, s: 1 };
  /* the bench pose: anchored bottom-right, 562 px wide at s .72, pushed slowly to .79 over 4–16 s */
  function mPose(s) { return { cx: 924 - 390 * s, cy: 1424 - 360 * s, s: s }; }
  function pushS(t) { return .72 + .07 * sio(seg(t, 4, 16)); }
  var PIV = [0, 130], RT = 332;
  function ang(v) { return (-50 + 2 * v) * Math.PI / 180; }
  function onArc(v, r) { var a = ang(v); return [PIV[0] + r * Math.sin(a), PIV[1] - r * Math.cos(a)]; }
  function bandArc(g, v0, v1, col, lw, dash) {
    g.save(); g.strokeStyle = col; g.lineWidth = lw; if (dash) g.setLineDash(dash);
    g.beginPath(); g.arc(PIV[0], PIV[1], 362, ang(v0) - Math.PI / 2, ang(v1) - Math.PI / 2); g.stroke(); g.restore();
  }
  function meter(g, M, o) {
    o = o || {};
    if (M.s <= .01) return;
    g.save(); g.translate(M.cx, M.cy); g.scale(M.s, M.s);
    var lab = o.lab == null ? 1 : clamp(o.lab, 0, 1);   /* the scale's words from 2.5 s (frame 0's dial carries no numbers) */
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, -390 + 14, -360 + 20, 780, 720, 44); g.fill();
    g.fillStyle = CASE; rr(g, -390, -360, 780, 720, 44); g.fill();
    rr(g, -390, -360, 780, 720, 44); grainIn(g, -390, -360, 780, 720, 911, 1.1);
    g.strokeStyle = CASE2; g.lineWidth = 10; rr(g, -372, -342, 744, 684, 34); g.stroke();
    prop(g, 'meter', -390, -360, 390, 360);
    [[-348, -318], [348, -318], [-348, 318], [348, 318]].forEach(function (p) { g.fillStyle = BRASS2; el(g, p[0], p[1], 13, 13); g.strokeStyle = '#5c4a26'; g.lineWidth = 3; g.beginPath(); g.moveTo(p[0] - 8, p[1] - 5); g.lineTo(p[0] + 8, p[1] + 5); g.stroke(); });
    /* the jack on the left side */
    g.fillStyle = BRASS2; rr(g, -404, 70, 22, 60, 6); g.fill(); g.fillStyle = '#1a1510'; el(g, -393, 100, 6, 6);
    if (o.shade > 0) { g.fillStyle = 'rgba(3,4,7,' + o.shade.toFixed(3) + ')'; rr(g, -404, -360, 794, 720, 44); g.fill(); }
    if (o.rim > 0) { g.strokeStyle = 'rgba(244,237,224,' + (.6 * o.rim).toFixed(3) + ')'; g.lineWidth = 3.5 / M.s; rr(g, -390, -360, 780, 720, 44); g.stroke(); }   /* lights out: a cream rim light */
    /* the face */
    g.fillStyle = PAPER; rr(g, -345, -325, 690, 500, 26); g.fill();
    rr(g, -345, -325, 690, 500, 26); grainIn(g, -345, -325, 690, 500, 913, .7);
    /* the bands: dashed outlines until measured; 3–9 slate, 39–47 coral (the one hot mark) */
    var b1 = clamp(o.b1 || 0, 0, 1), b2 = clamp(o.b2 || 0, 0, 1), pulse = o.pulse || 0;
    bandArc(g, 3, 9, 'rgba(33,29,38,.28)', 4 + 4 * pulse * 0, [10, 8]); bandArc(g, 39, 47, 'rgba(33,29,38,' + (.28 + .5 * pulse).toFixed(3) + ')', 4 + 5 * pulse, [10, 8]);
    if (b1 > 0) { g.save(); g.globalAlpha *= b1; bandArc(g, 3, 9, BAND1, 34); g.restore(); }
    if (b2 > 0) { g.save(); g.globalAlpha *= b2; bandArc(g, 39, 47, HOT, 34 + 6 * (o.flash || 0)); g.restore(); }
    /* the scale */
    g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(PIV[0], PIV[1], RT, ang(0) - Math.PI / 2, ang(50) - Math.PI / 2); g.stroke();
    for (var v = 0; v <= 50; v += 1) {
      var L = v % 10 === 0 ? 36 : v % 5 === 0 ? 22 : 11, a = onArc(v, RT), b = onArc(v, RT - L);
      g.lineWidth = v % 10 === 0 ? 6 : v % 5 === 0 ? 4 : 2.5; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    }
    if (lab > 0) onprop(function () {
      var npx = Math.max(50, 32 / M.s);
      for (var v2 = 0; v2 <= 50; v2 += 10) { var p = onArc(v2, 276 - (npx - 50) * .4); txt(g, String(v2), p[0], p[1], npx, INK, 'center', 900, DISP, 0, lab, 40, 'condensed'); }
      txt(g, '% LESS POWER', 0, -282, Math.max(50, 32 / M.s), INK, 'center', 900, DISP, 420, lab, 40, 'condensed');   /* above the arc: the needle never reaches it */
    });
    /* band labels, beside their own bands, once the needle has been there */
    if (o.l1 > 0) onprop(function () { txt(g, 'INDOORS · AVG', -190, 70, 44, INK, 'center', 900, DISP, 300, o.l1 * lab, 40, 'condensed'); txt(g, '3–9%', -200, 126, 68, BAND1, 'center', 900, DISP, 290, o.l1 * lab, 50, 'condensed'); });
    if (o.l2 > 0) onprop(function () { txt(g, 'FULL SUN · AVG', 190, 70, 44, INK, 'center', 900, DISP, 300, o.l2 * lab, 40, 'condensed'); txt(g, '39–47%', 200, 126, 68, INK, 'center', 900, DISP, 290, o.l2 * lab, 50, 'condensed'); });
    /* the needle: tapered ink, a counterweight, a brass cap */
    var pg = onArc(-5.4, 236); g.fillStyle = 'rgba(0,0,0,.25)'; el(g, pg[0] + 3, pg[1] + 4, 10, 10); g.fillStyle = BRASS2; el(g, pg[0], pg[1], 10, 10); g.fillStyle = BRASS; el(g, pg[0] - 2, pg[1] - 2, 5, 5);   /* the rest peg */
    var an = ang(clamp(o.v == null ? -4 : o.v, -4.2, 50.5));
    g.save(); g.translate(PIV[0], PIV[1]); g.rotate(an);
    g.fillStyle = 'rgba(0,0,0,.2)'; poly(g, [[-8 + 5, 8], [8 + 5, 8], [2 + 5, -350 + 8], [-2 + 5, -350 + 8]]); g.fill();
    g.fillStyle = INK; poly(g, [[-8, 0], [8, 0], [2, -352], [-2, -352]]); g.fill();
    g.fillStyle = INK; rr(g, -14, 0, 28, 64, 8); g.fill();
    g.restore();
    g.fillStyle = BRASS2; el(g, PIV[0], PIV[1], 32, 32); g.fillStyle = BRASS; el(g, PIV[0], PIV[1], 26, 26); g.fillStyle = '#4a3c22'; el(g, PIV[0], PIV[1], 8, 8);
    /* the glass: one soft diagonal glint */
    g.save(); rr(g, -345, -325, 690, 500, 26); g.clip(); g.fillStyle = 'rgba(255,255,255,.08)'; poly(g, [[-120, -325], [10, -325], [-160, 175], [-290, 175]]); g.fill(); g.restore();
    if (o.shade > 0) { g.fillStyle = 'rgba(3,4,7,' + (o.shade * .28).toFixed(3) + ')'; rr(g, -345, -325, 690, 500, 26); g.fill(); }
    /* the nameplate: brass, engraved POWER METER; Purdue's scope is pasted over it as a paper label */
    g.fillStyle = BRASS2; rr(g, -334, 200, 668, 120, 16); g.fill(); g.fillStyle = BRASS; rr(g, -328, 205, 656, 110, 13); g.fill();
    if (!(o.plate >= 1) && lab > 0) { var pp = Math.max(50, 31 / M.s); onprop(function () { txt(g, 'POWER METER', 0, 262, pp, '#4a3a1c', 'center', 900, DISP, 620, lab, 40, 'condensed'); }); }
    if (o.plate > 0) {
      var e = eout(seg(o.plate, 0, 1)), sc = lerp(1.25, 1, e);
      g.save(); g.translate(0, 262); g.rotate(-.012); g.scale(sc, sc); g.globalAlpha *= seg(o.plate, 0, .25);
      var ex = EXITING; if (e < 1) EXITING = true;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-300 + 6, -60 + 8, 600, 124);
      g.fillStyle = PAPER; g.fillRect(-300, -60, 600, 124);
      onprop(function () { txt(g, 'PURDUE · 2021', 0, -26, 50, INK, 'center', 900, DISP, 570, 1, 48, 'condensed'); txt(g, '4 ANDROID OLED PHONES', 0, 30, 50, INK, 'center', 900, DISP, 570, 1, 48, 'condensed'); });
      EXITING = ex; g.restore();
    }
    g.restore();
  }
  function jackOf(M) { return [M.cx - 393 * M.s, M.cy + 100 * M.s]; }
  /* the cord from the phone's port to the meter's jack: a drooping cable, drawn in as far as k */
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
  /* ---------- the wall switch: a paper plate, an ink lever (up = on) ---------- */
  function wallSwitch(g, x, y, s, up, shade) {
    if (s <= .01) return;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -70 + 8, -110 + 11, 140, 220, 16); g.fill();
    g.fillStyle = PAPER; rr(g, -70, -110, 140, 220, 16); g.fill(); rr(g, -70, -110, 140, 220, 16); grainIn(g, -70, -110, 140, 220, 921, .8);
    prop(g, 'switch', -70, -110, 70, 110);
    g.fillStyle = '#d6ccb9'; rr(g, -26, -58, 52, 116, 10); g.fill();
    g.fillStyle = '#b8ad99'; el(g, 0, -86, 7, 7); el(g, 0, 86, 7, 7);
    var ly = lerp(30, -30, clamp(up, 0, 1));
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -17 + 3, ly - 26 + 5, 34, 52, 9); g.fill();
    g.fillStyle = INK; rr(g, -17, ly - 26, 34, 52, 9); g.fill(); g.fillStyle = 'rgba(244,237,224,.25)'; rr(g, -12, ly - 22, 24, 8, 4); g.fill();
    if (shade > 0) { g.fillStyle = 'rgba(3,4,7,' + shade.toFixed(3) + ')'; rr(g, -70, -110, 140, 220, 16); g.fill();
      g.strokeStyle = 'rgba(244,237,224,' + (.9 * shade).toFixed(3) + ')'; g.lineWidth = 4; rr(g, -70, -110, 140, 220, 16); g.stroke();
      g.strokeStyle = 'rgba(244,237,224,' + (.7 * shade).toFixed(3) + ')'; g.lineWidth = 3; rr(g, -17, ly - 26, 34, 52, 9); g.stroke(); }
    g.restore();
  }
  /* ---------- the re-created dark-mode toggle card (generic, ours) ---------- */
  function toggleCard(g, x0, y0, on, droop) {
    var w = 430, h = 150;
    g.save(); g.translate(x0, y0); g.rotate(.13 * droop); g.translate(0, 18 * droop);
    sheet(g, 0, 0, w, h, 931, PAPER, 'toggle card');
    onprop(function () { txt(g, 'Dark mode', 30, h / 2, 56, INK, 'left', 800, DISP, 200, 1, 40, 'condensed'); });
    var px = 240, py = h / 2 - 36, pw = 104, ph = 72, k = clamp(on, 0, 1);
    g.fillStyle = mixc([185, 177, 163], [33, 29, 38], k); rr(g, px, py, pw, ph, 36); g.fill();
    g.fillStyle = 'rgba(0,0,0,.25)'; el(g, px + lerp(36, pw - 36, k) + 2, py + ph / 2 + 4, 28, 28);
    g.fillStyle = CREAM; el(g, px + lerp(36, pw - 36, k), py + ph / 2, 28, 28);
    g.restore();
  }
  /* a cut-paper hand reaching left, ~140 px from wrist to fingertips (origin = the wrist) */
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
  /* ---------- the sun: cut paper on a string, swinging ---------- */
  function sun(g, x, y, k, t) {
    if (k <= 0) return;
    var sw = .5 * (1 - eout(k)) + .06 * Math.sin(t * 2.2), L = 80;
    g.save(); g.translate(x, y - L); g.rotate(sw);
    g.strokeStyle = 'rgba(244,237,224,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -20); g.lineTo(0, L - 60); g.stroke();
    g.translate(0, L); g.scale(Math.min(1, k * 1.4), Math.min(1, k * 1.4));
    g.fillStyle = '#e3ad3e';
    for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6 + .1; g.beginPath(); g.moveTo(Math.cos(a - .16) * 56, Math.sin(a - .16) * 56); g.lineTo(Math.cos(a) * 94, Math.sin(a) * 94); g.lineTo(Math.cos(a + .16) * 56, Math.sin(a + .16) * 56); g.closePath(); g.fill(); }
    g.fillStyle = GLOW; el(g, 0, 0, 60, 60); g.beginPath(); g.arc(0, 0, 60, 0, 6.283); grainIn(g, -60, -60, 120, 120, 941, 1);
    g.fillStyle = 'rgba(255,250,230,.5)'; el(g, -18, -20, 16, 12);
    prop(g, 'sun', -94, -94, 94, 94);
    g.restore();
  }
  /* ---------- the brightness slider card ---------- */
  function slider(g, x0, y0, p, val, t) {
    var w = 470, h = 150;
    sheet(g, x0, y0, x0 + w, y0 + h, 951, PAPER, 'slider');
    onprop(function () { txt(g, 'BRIGHTNESS', x0 + 28, y0 + 46, 44, INK, 'left', 900, DISP, 240, 1, 36, 'condensed'); txt(g, val, x0 + w - 28, y0 + 46, 54, INK, 'right', 900, DISP, 160, 1, 40, 'condensed'); });
    var tx0 = x0 + 40, tx1 = x0 + w - 40, ty = y0 + 106, kx = lerp(tx0, tx1, clamp(p, 0, 1.03));
    g.lineCap = 'round'; g.strokeStyle = '#cbbfa8'; g.lineWidth = 14; g.beginPath(); g.moveTo(tx0, ty); g.lineTo(tx1, ty); g.stroke();
    g.strokeStyle = INK; g.beginPath(); g.moveTo(tx0, ty); g.lineTo(kx, ty); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, kx + 2, ty + 4, 22, 22); g.fillStyle = INK; el(g, kx, ty, 22, 22); g.fillStyle = CREAM; el(g, kx, ty, 8, 8);
  }

  /* =====================================================================================================
     THE ROOM (one function for all three room shots: the LCD phone, the OLED phone, the hero meter)
     ===================================================================================================== */
  var QL = ['“…LCD backlights', 'are always on', 'even when', 'displaying black…”'];
  var QP = ['“…SAVES AN AVERAGE OF', '39%-47% BATTERY POWER.”'];
  var CUR = 'room';
  function flips() { return [K.ddark - .04, K.cant - .02, K.dswitch, K.doff + .02]; }
  function toggleOn(t) { var F = flips(), st = 1, prev = 1, last = null; F.forEach(function (f, i) { if (t >= f) { prev = st; st = i % 2 ? 1 : 0; last = f; } }); return last == null ? 1 : lerp(prev, st, eout(seg(t, last, last + .12))); }
  function pixLit(t) {   /* returns lit(i, j) and the sheet's edge for the bulb grid */
    var on = function (j) { return eout(seg(t, K.pixel + .02 * j, K.pixel + .02 * j + .18)); };
    var rowsOff = function (j) { var tj = j < 9 ? lerp(K.pblack, K.poff + .12, j / 8) : K.TK[j - 9]; return seg(t, tj, tj + .05); };
    var off = 0; for (var j = 0; j < 12; j++) off += rowsOff(j);
    return { lit: function (i, j) { return on(j) * (1 - rowsOff(j)); }, sheet: -SY + SY * 2 * off / 12, frac: off / 12 };
  }
  /* indoors the brightness knob sweeps its 30–50% range and the needle follows it inside the 3–9 band */
  function sweep(t) { return Math.sin((t - K.n9) * 3.6) * seg(t, K.n9, K.n9 + .4) * (1 - seg(t, K.bright - .2, K.bright)); }
  function needleV(t) {
    var v = -4 + 1.15 * Math.abs(decay(t, K.HK, 26, 6));                              /* rests on its peg, 8° left of 0 (points at no number); the hook's slap lifts it ~2° */
    flips().forEach(function (f) { v += .5 * Math.abs(decay(t, f + .04, 34, 9)); });   /* each toggle flip: a ~1° jitter off the peg, then back */
    if (CUR !== 'room') { var pf = pixLit(t).frac; v += 10 * pf + .35 * Math.sin(t * 31) * (pf > 0 && pf < 1 ? 1 : 0); }   /* OLED: a creep per bulb row switched off, peg → the 3–9 band */
    if (t >= K.n3 - .1) { var a = sp(t, K.n3 - .1, 1.9, .55); v = lerp(v, 6, a) + .5 * decay(t, K.ND, 22, 4) + 2.2 * sweep(t); }
    /* "thirty-nine": a sweep to ~41 in 0.25 s and a shiver there; on the thump it slams to 47, overshoots ~3°, springs back to ~45 */
    if (t >= K.n39) { var st = eout(seg(t, K.n39, K.n39 + .25)); v = lerp(v, 41, st) + (.3 * Math.sin(t * 43) + .22 * Math.sin(t * 71)) * seg(t, K.n39 + .2, K.n39 + .3); }
    if (t >= K.HERO - .01) { var dt = t - (K.HERO - .01); v = dt < .05 ? lerp(41, 48.5, eout(dt / .05)) : lerp(48.5, 45, eio(seg(dt, .05, .35))) + .25 * Math.sin(t * 2.3) * seg(t, K.HERO + .8, K.HERO + 1.4); }
    return v;
  }
  /* the bulb grid's paper irregularity: each bulb a little off the grid and a little off round (seeded) */
  var BJ = (function () { var r = mulberry(55), o = []; for (var i = 0; i < 72; i++) o.push([(r() - .5) * 9, (r() - .5) * 9, (r() - .5) * 5, r() * 1e6 | 0]); return o; })();
  function roomScene(g, t) {
    var two = CUR !== 'room', hero = t >= K.indoor - .02 && two, L = roomL(t), wm = warmth(t), shade = .62 * (1 - L);
    if (LAYER === 'bg') { wall(g, L, wm); return; }
    var d = drift(t, .4, .3);
    /* ---- poses ---- */
    var P, M, cmp = 0, cout = 0, Q = null, LQ = null, mini = 0;
    if (!two) {
      var gk = eout(seg(t, 0, 1.0)); P = lerpPose(F0A, F0B, gk);
      P.cy += drift(t, .2, .6) * seg(t, 1.0, 1.6);
      P = lerpPose(P, BODYP, eio(seg(t, K.ask - .05, K.ask + .75)));
      M = lerpPose(MS0, MS, gk);
      var mk = eio(seg(t, K.ask + .1, K.ask + .85)); M = lerpPose(M, mPose(pushS(t)), mk);
      /* the glow test's two answers: the LCD phone grows to the left, the OLED phone slides in on the right, the meter ducks out */
      cmp = eio(seg(t, K.oled - .1, K.oled + .35));
      if (cmp > 0) {
        P = lerpPose(P, LCDP, cmp); P.s += .025 * seg(t, K.oled + .35, K.pixels + .2);
        M = { cx: M.cx, cy: M.cy + 780 * cmp, s: M.s };
        var qi = eout(seg(t, K.oled - .05, K.oled + .22));
        Q = lerpPose({ cx: 1260, cy: OLEDP.cy, s: OLEDP.s, rot: .04 }, OLEDP, qi); Q.s += .025 * seg(t, K.oled + .35, K.pixels + .2); Q.enter = qi;
      }
    } else {
      cout = eio(seg(t, K.pixels + .2, K.pixels + .7));
      var OP = { cx: OLEDP.cx, cy: OLEDP.cy, s: OLEDP.s + .025, rot: 0 };
      P = lerpPose(OP, PIXP, cout);
      if (cout < 1) { LQ = lerpPose({ cx: LCDP.cx, cy: LCDP.cy, s: LCDP.s + .025, rot: 0 }, { cx: -330, cy: LCDP.cy, s: LCDP.s, rot: -.05 }, cout); }
      var MD = mPose(.79); M = lerpPose({ cx: MD.cx, cy: MD.cy + 780, s: .79 }, MD, eout(seg(t, K.pixels + .25, K.pixels + .8)));
      if (t >= K.indoor) {
        P = lerpPose(P, MINIP, eio(seg(t, K.indoor + .15, K.indoors + .35)));
        M = lerpPose(M, MHA, eio(seg(t, K.indoor + .3, K.purdue - .12)));
        M = lerpPose(M, MHB, sio(seg(t, K.sun, K.HERO + .6)));
        mini = eio(seg(t, K.n39 + .2, K.n39 + .45));            /* the little phone leaves for Purdue's sentence */
        if (mini > 0) P = lerpPose(P, { cx: -90, cy: MINIP.cy, s: MINIP.s, rot: -.1 }, mini);
      }
    }
    M.cy += hero ? 0 : d * .5;
    var bobPh = two ? 2.0 : 1.1;
    if (!hero || t < K.indoor + .2) P = { cx: P.cx, cy: P.cy + drift(t, bobPh, .8) * (two ? 1 : seg(t, 2.6, 3.4)), s: P.s, rot: P.rot };
    if (Q) Q.cy += drift(t, 2.0, .8);
    if (LQ) LQ.cy += drift(t, 1.1, .8);
    /* ---- the wall switch (bottom left): there from the question, flips down on "lights", away for the side-by-side ---- */
    var swS = !two ? Math.min(1.04, pop(t, K.ask + .7, 3)) * (t >= K.ask + .7 ? 1 : 0) * (1 - eio(seg(t, K.oled - .1, K.oled + .15)))
                   : eout(seg(t, K.pixels + .5, K.pixels + .8)) * (1 - eio(seg(t, K.indoor + .35, K.indoor + .7)));
    var swUp = !two ? 1 - eout(seg(t, K.lights - .06, K.lights + .04)) : eout(seg(t, K.indoor + .02, K.indoor + .12));
    var exs = EXITING; if (swS > 0 && swS < .999) EXITING = true;
    wallSwitch(g, 205, 1255, swS, swUp, shade);
    EXITING = exs;
    /* ---- the meter, the cord, the phone ---- */
    var b1 = hero ? eout(seg(t, K.n3, K.n3 + .25)) : 0, b2 = t >= K.HERO - .01 ? 1 : 0;
    var pulse = hero ? Math.sin(Math.PI * seg(t, K.n39 - .05, K.n39 + .4)) : 0;
    var plate = hero ? seg(t, K.purdue - .2, K.purdue - .1) : 0;
    var ck = !two ? eout(seg(t, K.abat - .1, K.phone + .05)) * (1 - cmp) : (hero ? 1 - mini : eout(seg(t, K.pixels + .3, K.pixels + .8)));
    var pr = portOf(P), jk = jackOf(M), mOff = M.cy - 360 * M.s > SAFE_BOX.y1;
    if (M.s > .05 && ck > 0) cord(g, pr, jk, ck, hero ? 60 + 80 * (1 - seg(t, K.indoors, K.purdue)) : 140);
    if (!mOff) {
      var exm = EXITING; if (cmp > 0 || (two && !hero && M.cy + 360 * M.s > SAFE_BOX.y1)) EXITING = true;
      meter(g, M, { v: needleV(t), shade: hero ? .62 * (1 - L) : shade, rim: hero ? 0 : (1 - L), lab: seg(t, 2.5, 2.8), b1: b1, b2: b2, pulse: pulse, flash: Math.max(0, 1 - Math.abs(t - K.HERO) / .2), plate: plate,
        l1: hero ? seg(t, K.n9 + .25, K.n9 + .45) : 0, l2: hero ? seg(t, K.n39 - .05, K.n39 + .15) : 0 });
      EXITING = exm;
    }
    /* the window light: a cream wedge falls across the meter as the room goes to full sun */
    if (hero) wedge(g, seg(t, K.sunW - .45, K.sunW + .15), t);
    /* the phone's screen and light */
    var glowK = !two ? eio(seg(t, K.glows - .05, K.gray + .2)) : 0;
    var flapK = !two ? eio(seg(t, K.FL, K.FL + .42)) * (1 - eio(seg(t, K.oled - .2, K.oled + .12))) : 0;
    var onK = !two ? toggleOn(t) : 1;
    var opts = { shade: two && !hero ? .8 * (1 - L) : shade, rim: two ? .62 : .5, halo: glowK * (1 - .4 * flapK) * (1 - L) };
    var f = !two ? eout(seg(t, K.HK - .02, K.HK + .16)) : 1;
    function lcdScreen(s) { splitScreen(s, 1, 1, true); photoThumb(s, t); lcdBlack(s, glowK); }
    if (!two) {
      opts.screen = function (s) {
        if (flapK > 0) { backlight(s, 1 - onK); return; }
        splitScreen(s, .5 + .5 * f, 1, true);
        photoThumb(s, t); lcdBlack(s, glowK);
      };
      opts.flap = function (s) { frontFlap(s, flapK); };
    } else if (!hero || t < K.indoor + .2) {
      var pl = pixLit(t), bk = seg(t, K.pixel - .03, K.pixel + .1);
      opts.screen = function (s) { s.fillStyle = '#000'; s.fillRect(-SX, -SY, SX * 2, SY * 2); if (bk > 0) { s.save(); s.globalAlpha *= bk; bulbs(s, pl.lit, pl.sheet); s.restore(); } };
      opts.rim = .7;
    } else {
      var br = hero ? lerp(.62, 1, seg(t, K.bright - .1, K.bright + .15)) : .62;
      opts.screen = function (s) { splitScreen(s, .5, br, false); };
      opts.halo = 0; opts.shade = 0;
    }
    if (LQ) { var exl = EXITING; EXITING = cout > 0; phone(g, LQ, { name: 'lcd phone', shade: .8 * (1 - L), rim: .7, halo: 1 - L, screen: lcdScreen }); EXITING = exl; }
    var exp = EXITING; if (mini > 0) EXITING = true;
    if (mini < 1) phone(g, P, opts);
    EXITING = exp;
    if (Q) { var exq = EXITING; EXITING = Q.enter < 1; phone(g, Q, { name: 'oled phone', shade: shade, rim: .7, screen: function (s) { s.fillStyle = '#000'; s.fillRect(-SX, -SY, SX * 2, SY * 2); } }); EXITING = exq; }
    if (!two && t >= K.lcd - .05 && t < K.FL + .3) {
      var tr = eout(seg(t, K.lcd - .05, K.lcd + .3)), fo = 1 - seg(t, K.FL, K.FL + .3), pw2 = PW * P.s / 2 + 16, ph2 = PHH * P.s / 2 + 16, per = 4 * (pw2 + ph2);
      g.save(); g.globalAlpha *= fo * tr; g.strokeStyle = CREAM; g.lineWidth = 5; g.setLineDash([18, 12]); g.lineDashOffset = -t * 40;
      g.beginPath(); g.roundRect(P.cx - pw2, P.cy - ph2, pw2 * 2, ph2 * 2, 40);
      g.setLineDash([22, 12]); g.lineDashOffset = -(t - K.lcd) * 70;   /* fades in whole: a half-drawn ring read as a stray line */
      g.stroke(); g.restore();
    }
    if (hero && t >= K.bright && mini < 1) {   /* full brightness: the white half glows */
      var gb = seg(t, K.bright - .1, K.bright + .3) * (1 - mini);
      g.save(); g.globalAlpha *= .5 * gb; g.shadowColor = 'rgba(255,240,200,.9)'; g.shadowBlur = 40; g.fillStyle = 'rgba(255,248,230,.6)';
      g.translate(P.cx, P.cy); g.scale(P.s, P.s); rr(g, -SX, -SY, SX, SY * 2, 40); g.fill(); g.restore();
    }
    /* the side-by-side labels, under each phone */
    if (t >= K.oled + .1 && t < K.pixels + .45) cmpLabels(g, t);
    /* ---- frame 0's chip and the search bar ---- */
    if (!two) {
      var co = eio(seg(t, K.ask + .05, K.ask + .3));
      if (co < 1) {
        var ex = EXITING; if (co > 0) EXITING = true;
        chip(g, 'SAVES BATTERY?', P.cx, P.cy + 300 * P.s, { px: 58, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 18, s: 1 - .35 * co, a: 1 - co, rot: -.015, maxw: 400 });
        EXITING = ex;
      }
      searchBar(g, t);
      /* LIGHTS OFF, then the LCD verdict, then Samsung Display's sentence, then the re-created toggle */
      if (t >= K.lights + .02) { var lo = 1 - eio(seg(t, K.glows - .25, K.glows)), bump = Math.sin(Math.PI * seg(t, K.LO - .02, K.LO + .16)); if (lo > 0) { g.save(); g.globalAlpha *= lo; g.translate(690, 640); g.scale(1 + .1 * bump, 1 + .1 * bump); g.translate(-690, -640); slapCard(g, 'LIGHTS OFF', 690, 640, t, K.lights + .1, 64, 420); g.restore(); } }
      var la = fin(t, K.gray - .08, 4) * (1 - eio(seg(t, K.FL + .02, K.FL + .25)));
      if (la > 0) {
        chip(g, 'GLOWS GRAY', 690, 640, { px: 62, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 16, a: la, maxw: 430 });
        chip(g, '= LCD', 690, 736, { px: 62, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 16, a: la, maxw: 430 });
      }
      quote(g, 480, 548 + drift(t, 2.2, .5), 420, QL, 42, 'SAMSUNG DISPLAY, 2021', 233, seg(t, K.FL + .02, K.FL + .3), seg(t, K.dip - .3, K.dip - .05), false);
      var tk = eout(seg(t, K.dip - .25, K.dip)), droop = eout(seg(t, K.BZ, K.BZ + .25)), tko = eio(seg(t, K.oled + .06, K.oled + .26));
      if (tk > 0 && tko < 1) {
        g.save(); g.translate(110 * (1 - tk), -90 * tko); g.globalAlpha *= seg(tk, 0, .7) * (1 - tko); var ex2 = EXITING; if (tk < 1 || tko > 0) EXITING = true;
        toggleCard(g, 476, 600, onK, droop);
        tag(g, 'RE-CREATED', 600, 836, 1, 0, 300, CREAM, BG, 36);
        /* the hand: in on "So", a press on every flip, out after the droop */
        var hin = eout(seg(t, K.dip + .05, K.ddark - .08)) * (1 - eio(seg(t, K.BZ + .25, K.BZ + .5)));
        if (hin > 0) {
          var press = 0; flips().forEach(function (fl) { press = Math.max(press, Math.sin(Math.PI * seg(t, fl - .1, fl + .1))); });
          g.save(); g.translate(860 + 50 * (1 - hin) - 8 * press, 790 + 40 * (1 - hin) - 10 * press); g.rotate(.95); g.scale(.85, .85); hand(g); g.restore();
        }
        EXITING = ex2; g.restore();
      }
    } else if (hero) {
      /* the hero: the brightness slider, the window light; on "thirty-nine" Purdue's own sentence takes the slider's place */
      var sIn = eout(seg(t, K.indoors - .05, K.indoors + .3)), sOut = eio(seg(t, K.n39 + .25, K.n39 + .5));
      var sp0 = lerp(.4 + .1 * sweep(t), 1, eout(seg(t, K.bright - .05, K.bright + .12))) + .05 * decay(t, K.bright + .12, 30, 7);
      if (sIn > 0 && sOut < 1) {
        g.save(); var ex3 = EXITING; if (sIn < 1 || sOut > 0) EXITING = true;
        g.translate(110 * (1 - sIn) + 260 * sOut, 0); g.globalAlpha *= seg(sIn, 0, .7) * (1 - sOut);
        slider(g, 452, 488, sp0, sp0 > .97 ? '100%' : '30–50%', t);
        EXITING = ex3; g.restore();
      }
      quote(g, 118, 478 + drift(t, 2.6, .35), 790, QP, 46, 'PURDUE, 2021', 977, seg(t, K.n39 + .32, K.n39 + .5), 0, false);
    }
    if (two && t < K.indoor + .35) {
      var pa = fin(t, K.pixels + .75, 4) * (1 - eio(seg(t, K.indoor + .05, K.indoor + .3)));
      if (pa > 0) {
        chip(g, 'EVERY PIXEL', 712, 588, { px: 58, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 16, a: pa, maxw: 400 });
        chip(g, 'ITS OWN LIGHT', 712, 678, { px: 58, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 16, a: pa, maxw: 400 });
        var ba = fin(t, K.pblack - .12, 4);
        if (ba > 0) chip(g, 'BLACK = OFF', 712, 776, { px: 58, wt: 900, bg: INK, line: CREAM, lw: 4, fg: CREAM, st: 'condensed', r: 16, a: ba, maxw: 400 });
      }
    }
  }
  /* GLOWS GRAY = LCD | PITCH BLACK = OLED under the two phones; they leave as the LCD phone slides off */
  function cmpLabels(g, t) {
    var out = eio(seg(t, K.pixels + .2, K.pixels + .4));
    if (out >= 1) return;
    var ex = EXITING; if (out > 0) EXITING = true;
    var a1 = fin(t, K.oled + .12, 4) * (1 - out), a2 = fin(t, K.oled + .24, 4) * (1 - out);
    chip(g, 'GLOWS GRAY', 290, 1268, { px: 60, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 16, a: a1, maxw: 400 });
    chip(g, '= LCD', 290, 1360, { px: 60, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 16, a: a1, maxw: 400 });
    chip(g, 'PITCH BLACK', 728, 1268, { px: 60, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 16, a: a2, maxw: 380 });
    chip(g, '= OLED', 728, 1360, { px: 60, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 16, a: a2, maxw: 400 });
    EXITING = ex;
  }
  /* the window-light wedge (replaces the clip-art sun): a cream shaft from the upper left, one mullion's shadow across it */
  function wedge(g, k, t) {
    if (k <= 0) return;
    var e = eout(k), sx = -260 * (1 - e) + 8 * Math.sin(t * .8);
    g.save(); g.globalAlpha *= e;
    var A = [[150 + sx, 460], [430 + sx, 460], [1060 + sx, 1428], [560 + sx, 1428]];
    poly(g, A); g.fillStyle = 'rgba(255,236,196,.16)'; g.fill();
    poly(g, A); g.save(); g.clip();
    g.fillStyle = 'rgba(28,22,16,.16)';
    poly(g, [[282 + sx, 460], [298 + sx, 460], [818 + sx, 1428], [802 + sx, 1428]]); g.fill();
    poly(g, [[0, 905], [1080, 905], [1080, 921], [0, 921]]); g.fill();
    g.restore(); g.restore();
  }
  /* the black photo: a cut-paper thumbnail sits on the screen, a tap, and it opens to full black */
  function photoThumb(g, t) {
    var a = eout(seg(t, K.tblack - .45, K.tblack - .25));
    if (a <= 0) return;
    var press = Math.sin(Math.PI * seg(t, K.tblack - .1, K.tblack + .06)), op = eout(seg(t, K.tblack + .04, K.photo + .2));
    var w = lerp(170, SX * 2 + 60, op), h = lerp(170, SY * 2 + 60, op), cy = lerp(200, 0, op), sc = a * (1 - .1 * press);
    g.save(); g.translate(0, cy); g.rotate(.05 * (1 - op)); g.scale(sc, sc);
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(-w / 2 + 8, -h / 2 + 12, w, h);
    g.fillStyle = CREAM; cut(g, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], mulberry(71), 2.2);
    g.fillStyle = '#060708'; g.fillRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
    g.restore();
    var rk = seg(t, K.tblack - .06, K.tblack + .3);   /* the tap ring */
    if (rk > 0 && rk < 1) { g.strokeStyle = 'rgba(244,237,224,' + (.85 * (1 - rk)).toFixed(3) + ')'; g.lineWidth = 5; g.beginPath(); g.arc(0, 200, 30 + 70 * rk, 0, 6.283); g.stroke(); }
  }
  /* the search bar: drops in above the phone at 1.25 s, has typed the question by 2 s, lifts away as the lights go */
  function searchBar(g, t) {
    var SB = 1.25, sa = seg(t, SB, SB + .12), out = eio(seg(t, K.test + .1, K.test + .35));
    if (sa <= 0 || out >= 1 || !LIVE.text) return;
    var x0 = 562, y0 = 458, w = 360, h = 214, cx = x0 + w / 2, cy = y0 + h / 2;
    var sc = lerp(.86, 1, Math.min(1, pop(t, SB, 3.4))) * (1 - .12 * out), press = Math.sin(Math.PI * seg(t, 1.84, 1.98));
    sc *= 1 - .03 * press;
    g.save(); g.globalAlpha *= sa * (1 - out); g.translate(cx, cy); g.scale(sc, sc); g.translate(-cx, -cy);
    var ex = EXITING; if (sc < .995 || sa < 1 || out > 0) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 8, y0 + 10, w, h, 36); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 36); g.fill();
    prop(g, 'search bar', x0, y0, x0 + w, y0 + h);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x0 + 44, y0 + 48, 16, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x0 + 56, y0 + 60); g.lineTo(x0 + 70, y0 + 74); g.stroke();
    /* typed by 1.8 s, 48 px, three short lines so it never needs to shrink */
    var LN = ['does dark', 'mode save', 'battery'], XS = [x0 + 88, x0 + 36, x0 + 36], YS = [y0 + 50, y0 + 112, y0 + 172];
    var total = LN.join(' ').length, k = seg(t, SB + .12, 1.8), n = Math.round(total * k), typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
    var shown = [], left = n, last = 0;
    LN.forEach(function (L, i) { var c = Math.max(0, Math.min(L.length, left)); shown.push(L.slice(0, c)); if (c > 0) last = i; left -= L.length + 1; });
    onprop(function () { shown.forEach(function (str, i) { if (str) txt(g, str, XS[i], YS[i], 48, INK, 'left', 800, DISP, x0 + w - 24 - XS[i], 1, 48, 'condensed'); }); });
    NOREC = nr;
    if (typing && Math.floor(t * 8) % 2 === 0) { font(g, 48, 800, DISP, 'condensed'); var cw = g.measureText(shown[last]).width; g.fillStyle = INK; g.fillRect(XS[last] + cw + 4, YS[last] - 27, 5, 54); }
    EXITING = ex; g.restore();
  }

  /* =====================================================================================================
     THE END: frame 0's phone at full opacity, YES / NO; it glides back to frame 0's place and tilt by the cut
     ===================================================================================================== */
  function endScene(g, t) {
    if (LAYER === 'bg') { wall(g, 1, 0); return; }
    var u = sio(seg(t, TEND - 1.0, TEND)), P = lerpPose(ENDP, F0A, u);
    P.cy += drift(t, .3, .6) * (1 - seg(t, TEND - 1.2, TEND - .6));
    meter(g, MS0, { v: -4 + .6 * Math.abs(decay(t, K.yes, 20, 5)) + .6 * Math.abs(decay(t, K.noE, 20, 5)), lab: 0 });
    phone(g, P, { screen: function (s) { splitScreen(s, .5, 1, true); } });
    var ck = pop(t, TEND - .8, 3), exk = EXITING; if (ck < .999) EXITING = true;
    if (ck > 0) chip(g, 'SAVES BATTERY?', P.cx, P.cy + 300 * P.s, { px: 58, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 18, s: ck, a: 1, rot: -.015, maxw: 400 });
    EXITING = exk;
    var E0 = S('end').t0, kc = eout(seg(t, E0, E0 + .12)), sc0 = lerp(1.15, 1, kc);
    [['YES', 640], ['NO', 900]].forEach(function (c) {
      var tq0 = c[0] === 'YES' ? K.yes : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), sc = sc0 * (1 - .07 * tp);
      chip(g, c[0], 285, c[1] + 10 * tp, { px: 116, wt: 900, bg: BG, line: HOT, lw: 8, fg: HOT, w: 290, h: 160, r: 60, shadow: true, a: 1, s: sc });
    });
  }

  /* a time card / label chip slapped down (full opacity from its first frame) */
  function slapCard(g, text, x, y, t, t0, px, maxw) {
    if (t < t0 - .08) return;
    var k = eout(seg(t, t0 - .08, t0)), sc = lerp(1.3, 1, k), ex = EXITING; if (k < 1) EXITING = true;
    chip(g, text, x, y - 20 * (1 - k), { px: px || 52, wt: 900, bg: CREAM, fg: INK, r: 16, st: 'condensed', rot: .015, s: sc, a: seg(t, t0 - .08, t0 - .05), maxw: maxw || 820 });
    EXITING = ex;
  }
  /* ---------- captions: the narrator's words in phrase cards (one size); stressed words get a cream pill (never coral) ---------- */
  var CAPGROUPS = { hook: [[3, 3]], ask: [[4, 2], [3]], test: [[4], [5]], glow: [[3, 2], [4]], lamp: [[4], [3]], dip: [[3, 4]], oled: [[5], [2]], pixels: [[3, 3], [3, 2]], indoor: [[3], [3, 4]], sun: [[2, 4], [4]], end: [[3, 2], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'always'], ['ask', 'phone'], ['test', 'lights'], ['glow', 'gray'], ['lamp', 'on'], ['dip', "can't"], ['oled', 'pitch'], ['pixels', 'own'], ['indoor', 'just'], ['sun', '39'], ['end', 'glow']]
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
    var o1 = !nx ? DUR + 9 : keep ? ns - .04 : Math.min(card0.t1 + .5, ns - .04), o0 = o1 - .1;   /* the last card holds to the cut */
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
  var NOISE, SCENES = { roomScene: roomScene, endScene: endScene };
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
  function fullScene(g, Sc, t) {
    bgLayer(g, function (l) { drawScene(l, Sc, t, 'bg'); });
    g.save(); safeClip(g); drawScene(g, Sc, t, 'fg'); g.restore();
  }
  /* the wipe: a blank dark panel (no numbers, no words) slides across the whole frame, right → left; behind it the next
     scene is already built. Dark slate, so nothing outside the rail reads as a prop. */
  function roll(g, xb, t) {
    var w = 440, x0 = xb - w / 2;
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x0 - 26, 0, 26, H);
    g.fillStyle = SLATE; g.fillRect(x0, 0, w, H);
    g.fillStyle = SLATE2; g.fillRect(x0 + 34, 0, 10, H); g.fillRect(x0 + w - 44, 0, 10, H);
    g.fillStyle = 'rgba(0,0,0,.18)'; rr(g, x0 + w / 2 - 16, 860, 32, 220, 16); g.fill();
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var wk = Nx && !Nx.cut ? seg(te, Nx.t0 - TW, Nx.t0) : 0;
    if (wk > 0) {
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
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 62, 800, DISP, 'expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('Does dark mode', CX, 362);
    var b = 'save battery?', bp = 62; font(g, bp, 800, DISP, 'expanded');
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
  /* the hero stays the loudest hit but sits ≥ 3 dB under the voice's next peak */
  var GAIN = { sw: .2, hk: .25, lo: .19, fl: .22, bz: .32, tk1: .32, tk2: .29, tk3: .3, hero: .045, clk: .11 };
  var TYPE = { sw: 'click', hk: 'slap', lo: 'slap', fl: 'paper', bz: 'buzz', tk1: 'tick', tk2: 'tick', tk3: 'tick', hero: 'thump', clk: 'clink' };
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
    function stampThump(t, g) {
      g = g || 1;
      var o = osc('sine', 230, t, t + .2, 1, [[t, 0], [t + .012, .3 * g], [t + .12, .26 * g], [t + .19, 0]], .05); o.frequency.exponentialRampToValueAtTime(160, t + .18);
      osc('triangle', 330, t, t + .14, 1, [[t, 0], [t + .004, .22 * g], [t + .06, .15 * g], [t + .13, 0]], .03);
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
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); }
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
      if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'swish') swishS(e.t, e.g);
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'paper') paperS(e.t, e.g);
      else if (e.type === 'knock') knockS(e.t, e.g);
      else if (e.type === 'click') clickS(e.t, e.g);
      else if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'rip') ripS(e.t, e.g);
      else if (e.type === 'marker') markerS(e.t, e.g);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone, about −60 dB, so the loop seam is never digital zero; a little more room under the hero hold */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o);
      var h0 = K.HERO + .05, h1 = HOLD.t1 + .1;
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
  var HOLD = { t0: K.HERO + .13, t1: S('end').t0 };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'darkmode', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
