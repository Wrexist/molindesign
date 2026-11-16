/* "Your phone probably isn't listening." — Factory #33 (phonelistening) on Tech, explained, after ../overnightcharge/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   All cut paper: a phone with a paper ear taped over its mic, and the hero, a big black "Active Listening" box wired to
   the phone by one paper cord. The ad seller's pitch lights the box's lamp coral (fail); an FTC tab tears its front off
   and there is no microphone inside, only folded email lists (pass); the lists spill across the floor and the summary is
   drawn over them (the hero hold and poster). The cut cord then points at the status-bar dot.
   Coral only on the box's fail lamp, the payoff underline at the peak and YES / NO. The iPhone mic dot is Apple's own
   orange, labelled. Props stay whole inside the safe box x 92–928, y 302–1428; backgrounds bleed full width. */
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
    your: start('hook'), prob: at('hook', 'probably'), isnt: at('hook', "isn't"), hookEnd: lend('hook'),
    ask: start('ask'), why: at('ask', 'why'), match: at('ask', 'match'), said: at('ask', 'said'), askEnd: lend('ask'),
    study: start('study'), y18: at('study', '2018'), n17: at('study', '17,000'), android: at('study', 'Android'), found: at('study', 'found'), noS: at('study', 'no'), audio: at('study', 'audio'), studyEnd: lend('study'),
    wake: start('wake'), hey: at('wake', 'Hey'), siri: at('wake', 'Siri'), listens: at('wake', 'listens'), but: at('wake', 'but'), phoneW: at('wake', 'phone'), itself: at('wake', 'itself'), wakeEnd: lend('wake'),
    dip: start('dip'), seller: at('dip', 'seller'), pitched: at('dip', 'pitched'), from: at('dip', 'from'), say: at('dip', 'say'), dipEnd: lend('dip'),
    twist: start('twist'), ftc: at('twist', 'FTC'), says: at('twist', 'says'), noT: at('twist', 'no'), voice: at('twist', 'voice'), twistEnd: lend('twist'),
    lists: start('lists'), resold: at('lists', 'resold'), email: at('lists', 'email'), listsW: at('lists', 'lists'), lfrom: at('lists', 'from'), brokers: at('lists', 'brokers'), listsEnd: lend('lists'),
    ads: start('ads'), follow: at('ads', 'follow'), searches: at('ads', 'searches'), apps: at('ads', 'apps'), rough: at('ads', 'rough'), location: at('ads', 'location'), adsEnd: lend('ads'),
    dot: start('dot'), dotW: at('dot', 'dot'), top: at('dot', 'top'), mic: at('dot', 'mic'), camera: at('dot', 'camera'), dotEnd: lend('dot'),
    perms: start('perms'), settings: at('perms', 'Settings'), pApps: at('perms', 'apps'), pMic: at('perms', 'mic'), shows: at('perms', 'shows'), permsEnd: lend('perms'),
    end: start('end'), eDot: at('end', 'dot'), yours: at('end', 'yours'), yes: at('end', 'yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  (function () {
    place('hk', 'paper', K.hookEnd + .4, .16, K.hookEnd, K.ask);                     /* the tape on the ear peels */
    place('dp', 'knock', K.dipEnd + .3, .2, K.dipEnd, K.twist - .05);                /* the fail: the box's lamp lights coral */
    place('tr', 'tear', K.twistEnd + .3, .2, K.twistEnd, K.lists - .05);             /* the pass: the FTC tab tears the panel off */
    place('sl', 'slap', K.listsEnd + .4, .18, K.listsEnd, K.ads - .3);                /* the hero: the lists slap down, one dry hit */
    place('pp', 'tick', K.dotEnd + .16, .15, K.dotEnd, K.perms - .02);              /* the dots pulse */
  })();
  var TW = .5;
  K.HK = GT.hk != null ? GT.hk : K.hookEnd + .2;
  K.DP = GT.dp != null ? GT.dp : K.dipEnd + .2;
  K.TR = GT.tr != null ? GT.tr : K.twistEnd + .2;
  K.SL = GT.sl != null ? GT.sl : K.listsEnd + .35;
  K.PP = GT.pp != null ? GT.pp : K.dotEnd + .15;
  var SC = [
    { id: 'hook', fn: 'hookScene', name: 'Listening for ads? Probably not', t0: 0 },
    { id: 'study', fn: 'studyScene', name: '2018: 17,000 Android apps, no audio leaks', t0: K.study + .05 },
    { id: 'wake', fn: 'wakeScene', name: 'Hey Siri is checked on the phone', t0: K.wake + .05 },
    { id: 'pitch', fn: 'pitchScene', name: 'The ad seller\'s box, then the FTC tears it open', t0: K.dip - .1 },
    { id: 'floor', fn: 'floorScene', name: 'Email lists, not your voice', t0: K.listsW + .05, tilt: true },
    { id: 'dot', fn: 'dotScene', name: 'The dot up top', t0: K.dot + .12 },
    { id: 'set', fn: 'setScene', name: 'Settings: which apps can use your mic', t0: K.perms + .6 },
    { id: 'end', fn: 'endScene', name: 'See a dot on yours?', t0: K.yours - .15, cut: true }
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
  var DESK = 1414;                                 /* the table line in the side views */
  var GOLD = '#e2b84f', ORANGE = '#ff9f0a', GREEN = '#34c759', BOXC = '#16171b', BOXF = '#22242b', SHEET = '#efe7d6', BAR = '#b9b0a0';
  var EXAMPLE_BG = 'rgba(16,22,28,.92)';

  /* ---------- backgrounds: they bleed full width and stay dark ---------- */
  function wall(g, c, stripe) {
    g.fillStyle = c || '#151b25'; g.fillRect(-300, -300, W + 600, H + 600);
    g.fillStyle = 'rgba(255,255,255,' + (stripe == null ? .018 : stripe) + ')'; for (var x = -300; x < W + 300; x += 96) g.fillRect(x, -300, 40, DESK + 300);
  }
  function desk(g, top, c1, c2) {
    top = top || DESK;
    g.fillStyle = c1 || '#3a2a1f'; g.fillRect(-300, top, W + 600, 22);
    g.fillStyle = c2 || '#24190f'; g.fillRect(-300, top + 22, W + 600, H);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-300, top + 22, W + 600, 8);
  }

  /* ---------- the paper ear: one skin piece, an inner fold, a darker bowl; `glow` rings it in brass ---------- */
  function earShape(g) {
    g.beginPath(); g.moveTo(-30, -72);
    g.bezierCurveTo(8, -100, 62, -86, 64, -32); g.bezierCurveTo(66, 8, 34, 28, 30, 52);
    g.bezierCurveTo(26, 86, -10, 98, -24, 72); g.bezierCurveTo(-34, 44, -36, -40, -30, -72); g.closePath();
  }
  function ear(g, x, y, s, rot, glow) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    if (glow > 0) { g.save(); g.shadowColor = 'rgba(241,207,107,' + (.9 * glow).toFixed(3) + ')'; g.shadowBlur = 50; earShape(g); g.fillStyle = 'rgba(241,207,107,' + (.6 * glow).toFixed(3) + ')'; g.fill(); g.restore(); }
    g.save(); g.translate(7, 10); earShape(g); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill(); g.restore();
    earShape(g); g.fillStyle = glow > 0 ? mixc(hex(SKIN), hex('#f6dc8a'), glow) : SKIN; g.fill();
    earShape(g); grainIn(g, -36, -100, 102, 200, 1501, .9);
    prop(g, 'ear', -36, -100, 66, 98);
    g.fillStyle = SKIN2; g.beginPath(); g.ellipse(6, -6, 18, 30, .1, 0, 6.283); g.fill();
    g.strokeStyle = SKIN3; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(-10, -54); g.bezierCurveTo(16, -74, 46, -46, 38, -14); g.bezierCurveTo(32, 8, 10, 12, 8, 34); g.stroke(); g.lineCap = 'butt';
    g.restore();
  }
  function tape(g, x, y, w, rot, a) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.globalAlpha *= a == null ? 1 : a;
    g.fillStyle = 'rgba(244,236,214,.82)'; poly(g, [[-w / 2, -14], [w / 2, -16], [w / 2 - 4, 0], [w / 2, 15], [-w / 2, 14], [-w / 2 + 5, 0]]); g.fill();
    g.restore();
  }
  /* the "?" flap over the status-bar corner: a paper flap hinged on its top edge; it never opens */
  function qFlap(g, x, y, w, h, t, sc) {
    g.save(); g.translate(x, y); g.scale(sc || 1, sc || 1); g.rotate(.03 * Math.sin(t * 2.3));
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 6, 8, w, h, 12); g.fill();
    g.fillStyle = PAPER; rr(g, -w / 2, 0, w, h, 12); g.fill(); rr(g, -w / 2, 0, w, h, 12); grainIn(g, -w / 2, 0, w, h, 1511, .8);
    prop(g, 'question flap', -w / 2, 0, w / 2, h);
    g.fillStyle = 'rgba(244,236,214,.8)'; g.fillRect(-w / 2 - 6, -8, w + 12, 20);
    onprop(function () { txt(g, '?', 0, h / 2 + 6, h * .78, BRASS2, 'center', 900, DISP, 0, 1, 40, 'condensed'); });
    g.restore();
  }
  /* the paper sneaker (the example ad): a sole, an upper, three laces */
  function sneaker(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s); var r = mulberry(61);
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, 6, 52, 120, 12);
    g.fillStyle = '#4f7fb8'; cut(g, [[-110, 30], [-104, -24], [-60, -36], [-30, -64], [20, -60], [40, -20], [96, 0], [116, 24], [112, 38], [-110, 38]], r, 2);
    g.fillStyle = '#f4ede0'; cut(g, [[-114, 30], [118, 26], [120, 46], [-116, 48]], r, 1.5);
    g.fillStyle = '#d9a441'; cut(g, [[-104, -18], [-84, -26], [-82, 22], [-104, 24]], r, 1.2);
    g.strokeStyle = '#f4ede0'; g.lineWidth = 5; for (var i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-34 + i * 16, -50 + i * 12); g.lineTo(-10 + i * 16, -40 + i * 12); g.stroke(); }
    g.restore();
  }
  /* a paper speech bubble with a tail; text in two lines */
  function bubble(g, L, x, y, k, w, tail, px) {
    if (k <= 0) return;
    px = px || 52; var h = 40 + L.length * px * 1.05, e = eout(clamp(k, 0, 1));
    g.save(); g.translate(x, y); g.scale(lerp(.7, 1, e), lerp(.7, 1, e)); g.globalAlpha *= seg(k, 0, .25);
    var ex = EXITING; if (k < 1) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.38)'; rr(g, -w / 2 + 7, -h / 2 + 10, w, h, 40); g.fill();
    g.fillStyle = PAPER; rr(g, -w / 2, -h / 2, w, h, 40); g.fill();
    var tx = tail || -1; poly(g, [[tx * w * .18, h / 2 - 2], [tx * w * .36, h / 2 + 44], [tx * w * .02, h / 2 - 2]]); g.fill();
    prop(g, 'bubble', -w / 2, -h / 2, w / 2, h / 2 + 44);
    onprop(function () { L.forEach(function (s, i) { txt(g, s, 0, -h / 2 + 22 + px * 1.05 * (i + .5), px, INK, 'center', 900, DISP, w - 40, 1, 40, 'condensed'); }); });
    EXITING = ex; g.restore();
  }
  /* the example ad card (on the phone's screen or on the floor): an AD pill, the sneaker */
  function adCard(g, x, y, w, h, sneakK, imgF) {
    imgF = imgF || .58;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x + 6, y + 8, w, h, 22); g.fill();
    g.fillStyle = '#f7f1e4'; rr(g, x, y, w, h, 22); g.fill();
    prop(g, 'ad card', x, y, x + w, y + h);
    g.fillStyle = '#e4dccb'; rr(g, x + 16, y + 16, w - 32, h * imgF, 14); g.fill();
    if (sneakK > 0) { g.save(); g.globalAlpha *= clamp(sneakK, 0, 1); sneaker(g, x + w / 2, y + 16 + h * imgF / 2, Math.min(w * .9, h * imgF * 2.4) / 300 * lerp(.8, 1, eout(clamp(sneakK, 0, 1))), -.08); g.restore(); }
    onprop(function () { chip(g, 'AD', x + 52, y + 46, { px: 36, wt: 900, bg: INK, fg: CREAM, r: 10, shadow: false, st: 'condensed' }); });
  }

  /* ---------- frame 0's sticker on the phone: LISTENING / FOR ADS?, and the hedge tag under it ---------- */
  function sticker(g, x, y, k, hk) {
    if (k <= 0) return;
    var w = 404, h = 196, spx = 84;
    g.save(); g.translate(x, y); g.rotate(-.025); g.scale(k, k);
    var ex = EXITING; if (k < .999) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 8, -h / 2 + 11, w, h, 18); g.fill();
    g.fillStyle = CREAM; rr(g, -w / 2, -h / 2, w, h, 18); g.fill();
    prop(g, 'sticker', -w / 2, -h / 2, w / 2, h / 2);
    onprop(function () {
      txt(g, 'LISTENING', 0, -42, spx, INK, 'center', 900, DISP, w - 40, 1, 60, 'condensed');
      font(g, spx, 900, DISP, 'condensed'); var w1 = g.measureText('FOR ADS').width, w2 = g.measureText('?').width, x0 = -(w1 + w2 + 4) / 2;
      txt(g, 'FOR ADS', x0, 44, spx, INK, 'left', 900, DISP, 0, 1, 60, 'condensed'); txt(g, '?', x0 + w1 + 4, 44, spx, BRASS2, 'left', 900, DISP, 0, 1, 60, 'condensed');
    });
    if (hk > 0) {   /* PROBABLY NOT: slapped on with the word, full opacity from its first frame */
      var e = eout(clamp(hk, 0, 1)), tw = 380, th = 96;
      g.save(); g.translate(14, h / 2 + 70); g.rotate(.03); g.scale(lerp(1.3, 1, e), lerp(1.3, 1, e)); if (hk < 1) EXITING = true;
      g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -tw / 2 + 7, -th / 2 + 9, tw, th, 14); g.fill();
      g.fillStyle = INK; rr(g, -tw / 2, -th / 2, tw, th, 14); g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; rr(g, -tw / 2, -th / 2, tw, th, 14); g.stroke();
      prop(g, 'probably not tag', -tw / 2, -th / 2, tw / 2, th / 2);
      onprop(function () { txt(g, 'PROBABLY NOT', 0, 3, 62, CREAM, 'center', 900, DISP, tw - 30, 1, 48, 'condensed'); });
      g.restore();
    }
    EXITING = ex; g.restore();
  }
  /* the search card (the main search phrase): drops in at the question, typed by ~3.5 s */
  function searchCard(g, t) {
    var SB = 1.42, sa = seg(t, SB, SB + .12), out = 0;
    if (sa <= 0 || out >= 1 || !LIVE.text) return;
    var x0 = 622, y0 = 452, w = 300, h = 330, cx = x0 + w / 2, cy = y0 + h / 2;
    var sc = lerp(.86, 1, Math.min(1, pop(t, SB, 3.4))) * (1 - .12 * out);
    g.save(); g.globalAlpha *= sa * (1 - out); g.translate(cx, cy - 60 * out); g.scale(sc, sc); g.translate(-cx, -cy);
    var ex = EXITING; if (sc < .995 || sa < 1 || out > 0) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 8, y0 + 10, w, h, 34); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 34); g.fill();
    prop(g, 'search card', x0, y0, x0 + w, y0 + h);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x0 + 40, y0 + 40, 14, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x0 + 50, y0 + 50); g.lineTo(x0 + 62, y0 + 62); g.stroke();
    g.fillStyle = 'rgba(29,31,36,.22)'; g.fillRect(x0 + 78, y0 + 38, w - 104, 5);
    var LN = ['IS MY PHONE', 'LISTENING', 'TO ME', 'FOR ADS'], XS = [x0 + 22, x0 + 22, x0 + 22, x0 + 22], YS = [y0 + 112, y0 + 172, y0 + 232, y0 + 292];
    var total = LN.join(' ').length, k = seg(t, SB + .08, SB + .36), n = Math.round(total * k), typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
    var shown = [], left = n, last = 0;
    LN.forEach(function (L, i) { var c = Math.max(0, Math.min(L.length, left)); shown.push(L.slice(0, c)); if (c > 0) last = i; left -= L.length + 1; });
    onprop(function () { shown.forEach(function (str, i) { if (str) txt(g, str, XS[i], YS[i], 52, INK, 'left', 900, DISP, x0 + w - 18 - XS[i], 1, 40, 'condensed'); }); });
    NOREC = nr;
    if (typing && Math.floor(t * 8) % 2 === 0) { font(g, 52, 900, DISP, 'condensed'); var cw = Math.min(g.measureText(shown[last]).width, x0 + w - 30 - XS[last]); g.fillStyle = INK; g.fillRect(XS[last] + cw + 4, YS[last] - 26, 5, 52); }
    EXITING = ex; g.restore();
  }
  function hookScreen(s, t, adK) {
    var gr = s.createLinearGradient(0, -SY, 0, SY); gr.addColorStop(0, '#2a4060'); gr.addColorStop(1, '#101a2a');
    s.fillStyle = gr; s.fillRect(-SX, -SY, SX * 2, SY * 2);
    /* a feed: two dim paper rows that scroll, the example ad slides in on "match" */
    var sc = (t * 22) % 140;
    for (var i = 0; i < 6; i++) { var yy = -SY + 150 + i * 140 - sc; s.fillStyle = 'rgba(244,237,224,.08)'; rr(s, -SX + 30, yy, SX * 2 - 60, 110, 16); s.fill(); }
    if (adK > 0) { var y = lerp(SY + 40, -60, eout(clamp(adK, 0, 1))); var ex = EXITING; if (adK < 1) EXITING = true; adCard(s, -SX + 26, y, SX * 2 - 52, 330, seg(adK, .3, 1)); EXITING = ex; }
  }
  /* the ear on the phone's mic: taped top and bottom; on the peel the bottom tape lets go and the ear swings from the top one */
  /* the ear is taped over the bottom mic grille; on the peel its top tape lets go and it swings from the grille tape */
  function earOnPhone(g, t, peel) {
    var gx = 96, gy = PHH / 2 - 12;
    g.fillStyle = '#07080b'; for (var i = 0; i < 6; i++) el(g, gx - 50 + i * 20, PHH / 2 - 8, 4.5, 4.5);   /* the grille holes */
    var sw = peel > 0 ? -.5 * eout(clamp(peel, 0, 1)) - .28 * decay(t, K.HK + .08, 9, 2.4) : 0;
    g.save(); g.translate(gx, gy); g.rotate(sw);
    ear(g, 0, -112, 1.14, .04, 0);
    g.restore();
    tape(g, gx, gy - 4, 130, .06, 1);
    if (peel < 1) { var pk = clamp(peel, 0, 1); var ex = EXITING; if (pk > 0) EXITING = true; tape(g, gx + 10 - 40 * pk, gy - 214 - 150 * pk * pk, 120, -.1 - 1.1 * pk, 1 - pk); EXITING = ex; }
  }

  /* =====================================================================================================
     A: the phone close-up. It glides in big; PROBABLY NOT on "probably"; the ear's tape peels; the question is typed.
     ===================================================================================================== */
  var F0A = { cx: 662, cy: 930, s: 1.16, rot: .012 }, F0B = { cx: 346, cy: 930, s: 1.16, rot: -.01 };
  function phoneHook(g, P, t, o) {
    phone(g, P, { rim: .75, halo: .5, screen: function (s) { hookScreen(s, o.tt == null ? t : o.tt, o.ad); }, flap: function (f) {
      qFlap(f, SX - 92, -SY + 6, 148, 112, o.tt == null ? t : o.tt);
      earOnPhone(f, t, o.peel);
    } });
  }
  function hookScene(g, t) {
    if (LAYER === 'bg') { wall(g); desk(g); return; }
    var gk = eout(seg(t, 0, .55)), P = lerpPose(F0A, F0B, gk);
    P.cy += drift(t, .2, .5) * seg(t, .6, 1.2);
    var exg = EXITING; if (gk < 1) EXITING = true;   /* frame 0: the phone is still gliding in from the right edge */
    phoneHook(g, P, t, { peel: seg(t, K.HK - .02, K.HK + .3), ad: seg(t, K.match - .1, K.match + .5) });
    EXITING = exg;
    var so = eio(seg(t, K.study - .9, K.study - .62));
    if (so < 1) { g.save(); g.globalAlpha *= 1 - so; var ex = EXITING; if (so > 0) EXITING = true; sticker(g, P.cx + 6, P.cy - 222, 1 - .2 * so, seg(t, K.prob - .04, K.prob + .12) * (1 - so)); EXITING = ex; g.restore(); }
    searchCard(g, t);
    /* what you said: a bubble floats up beside the phone; EXAMPLE under it */
    var bk = seg(t, K.ask - .45, K.ask - .2), bo = 0;
    if (bk > 0 && bo < 1) {
      g.save(); g.globalAlpha *= 1 - bo; var exb = EXITING; if (bo > 0) EXITING = true;
      bubble(g, ['…NEW', 'SNEAKERS…'], 758, 990 - 70 * eout(bk) + drift(t, 1.1, .4), bk, 330, -1, 56);
      if (t > K.ask - .3) tag(g, 'EXAMPLE', 772, 1250, seg(t, K.ask - .3, K.ask - .2), 0, 300, CREAM, EXAMPLE_BG, 40);
      EXITING = exb; g.restore();
    }
  }

  /* =====================================================================================================
     B: the study. A wall of generic paper app tiles fills while a paper loupe sweeps it; the count and its scope.
     ===================================================================================================== */
  var TILEC = ['#5d7a9c', '#8b6f9e', '#6f9a7c', '#b5865a', '#5f8f99', '#9c6b6b', '#7d8a5a', '#6a6fa0'];
  function appTile(g, x, y, s, seed) {
    var r = mulberry(seed), c = TILEC[Math.floor(r() * TILEC.length)];
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x + 4, y + 6, s, s, s * .24); g.fill();
    g.fillStyle = c; rr(g, x, y, s, s, s * .24); g.fill();
    g.fillStyle = 'rgba(244,237,224,.85)'; var k = Math.floor(r() * 4), m = x + s / 2, n = y + s / 2;
    if (k === 0) el(g, m, n, s * .2, s * .2);
    else if (k === 1) { poly(g, [[m, n - s * .22], [m + s * .22, n + s * .18], [m - s * .22, n + s * .18]]); g.fill(); }
    else if (k === 2) { g.fillRect(m - s * .22, n - s * .16, s * .44, s * .09); g.fillRect(m - s * .22, n + s * .06, s * .3, s * .09); }
    else { rr(g, m - s * .2, n - s * .2, s * .4, s * .4, 6); g.fill(); }
  }
  function loupe(g, x, y, r, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, r * .62 + 6, r * .62 + 8, 40, r * 1.3, 18); g.save(); g.translate(r * .7, r * .7); g.rotate(-.78); g.fillRect(-18, 0, 40, r * 1.1); g.restore();
    g.save(); g.translate(r * .7, r * .7); g.rotate(-.78); g.fillStyle = BRASS2; rr(g, -20, 0, 40, r * 1.1, 16); g.fill(); g.fillStyle = BRASS; rr(g, -20, 0, 18, r * 1.1, 10); g.fill(); g.restore();
    g.fillStyle = 'rgba(220,235,245,.16)'; el(g, 0, 0, r, r);
    g.strokeStyle = BRASS; g.lineWidth = 16; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(-r * .35, -r * .38, r * .28, r * .14, -.6, 0, 6.283); g.fill();
    prop(g, 'loupe', -r - 8, -r - 8, r * 1.7, r * 1.7);
    g.restore();
  }
  function studyScene(g, t) {
    if (LAYER === 'bg') { wall(g, '#18202b'); desk(g, DESK, '#2c3440', '#1c222b'); return; }
    var x0 = 132, y0 = 768, s = 112, gp = 18, cols = 6, rows = 4;
    var k0 = K.study - .55, k1 = K.android + .2;
    for (var rI = 0; rI < rows; rI++) for (var c = 0; c < cols; c++) {
      var i = rI * cols + c, ti = k0 + (k1 - k0) * (((rows - 1 - rI) * cols + c) / (rows * cols - 1)), a = pop(t, ti, 4);
      if (a <= 0) continue;
      var ex = EXITING; if (a < .999) EXITING = true;
      g.save(); var cx = x0 + c * (s + gp) + s / 2, cy = y0 + rI * (s + gp) + s / 2 + 3 * Math.sin(t * 2 + i);
      g.translate(cx, cy); g.scale(a, a); appTile(g, -s / 2, -s / 2, s, 900 + i); g.restore(); EXITING = ex;
    }
    prop(g, 'tile wall', x0 - 4, y0 - 6, x0 + cols * (s + gp) - gp + 6, y0 + rows * (s + gp) - gp + 10);
    /* the loupe sweeps the wall, row by row, from "found" to the cut */
    var lk = seg(t, K.android, K.studyEnd + .3), path = lk * 2.6, row = Math.min(1, Math.floor(path)), u = path - Math.floor(path);
    var lx = row % 2 === 0 ? lerp(240, 740, sio(u)) : lerp(740, 240, sio(u)), ly = lerp(850, 1110, sio(seg(path, .8, 1.2))) + (path > 2 ? (path - 2) * 60 : 0);
    var la = fin(t, K.android - .25, 4);
    if (la > 0) { var exl = EXITING; if (la < 1) EXITING = true; g.save(); g.globalAlpha *= la; loupe(g, lx, ly + 60 * (1 - la), 96, .05 * Math.sin(t * 1.4)); g.restore(); EXITING = exl; }
    /* the scope plate: the count never stands alone */
    slapCard(g, '2018', 220, 506, t, K.y18, 60, 240);
    var pa = fin(t, K.study + .12, 5);
    if (pa > 0) {
      var exp = EXITING; if (pa < 1) EXITING = true;
      g.save(); g.globalAlpha *= pa; g.translate(0, 30 * (1 - pa));
      sheet(g, 120, 574, 900, 720, 1601, PAPER, 'count plate');
      onprop(function () { txt(g, '17,000+ ANDROID APPS', 510, 624, 66, INK, 'center', 900, DISP, 740, 1, 48, 'condensed'); txt(g, 'STUDIED · 2018', 510, 684, 46, '#4b4540', 'center', 900, DISP, 740, 1, 40, 'condensed'); });
      g.restore(); EXITING = exp;
    }
    var qa = seg(t, K.study + .3, K.study + .45);
    if (qa > 0) {
      var exq = EXITING; if (qa < 1) EXITING = true;
      g.save(); g.translate(90 * (1 - eout(qa)), 0); g.globalAlpha *= seg(qa, 0, .6);
      sheet(g, 120, 1300, 900, 1420, 1611, CREAM, 'quote strip');
      onprop(function () { txt(g, '“…NO AUDIO LEAKS AT ALL…”', 140, 1340, 52, INK, 'left', 900, DISP, 740, 1, 44, 'condensed'); txt(g, 'IN THEIR TESTS · NORTHEASTERN, 2018', 140, 1392, 40, '#4b4540', 'left', 800, DISP, 740, 1, 40, 'condensed'); });
      g.restore(); EXITING = exq;
    }
  }

  /* =====================================================================================================
     C: the phone's back opens. Inside, a small chip with an ear: HEY SIRI lights it; other words drop into the bin.
     ===================================================================================================== */
  function wakeScene(g, t) {
    if (LAYER === 'bg') { wall(g, '#1a1d2a'); desk(g, DESK, '#33281f', '#211810'); return; }
    var P = { cx: 384, cy: 862, s: .88, rot: -.02 + .01 * Math.sin(t * 1.2) }, push = sio(seg(t, K.wake, K.wakeEnd + .4));
    P.s += .03 * push;
    var open = 1;   /* the back is already open on the beat's first frame: ear, chip and bin show at once */
    g.save(); g.translate(P.cx, P.cy); g.rotate(P.rot); g.scale(P.s, P.s);
    /* the inside: a dark board, the chip with its ear, the paper bin */
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, -PW / 2 + 12, -PHH / 2 + 18, PW, PHH, 64); g.fill();
    g.fillStyle = PHB; rr(g, -PW / 2, -PHH / 2, PW, PHH, 64); g.fill();
    prop(g, 'phone (open back)', -PW / 2, -PHH / 2, PW / 2, PHH / 2);
    g.fillStyle = '#1d3b33'; rr(g, -PW / 2 + 26, -PHH / 2 + 26, PW - 52, PHH - 52, 46); g.fill();
    g.strokeStyle = 'rgba(214,190,120,.35)'; g.lineWidth = 4; for (var i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-150 + i * 70, -PHH / 2 + 60); g.lineTo(-150 + i * 70, -120); g.lineTo(-40 + i * 20, -60); g.stroke(); }
    var lit = Math.max(eio(seg(t, K.siri - .05, K.siri + .15)) * (1 - eio(seg(t, K.but - .1, K.but + .2))), 0);
    g.fillStyle = '#2b2f36'; rr(g, -110, -150, 220, 220, 18); g.fill(); g.fillStyle = '#3a3f48'; rr(g, -96, -136, 192, 192, 12); g.fill();
    for (var p = 0; p < 6; p++) { g.fillStyle = BRASS2; g.fillRect(-100 + p * 38, -168, 14, 18); g.fillRect(-100 + p * 38, 70, 14, 18); }
    ear(g, 4, -40, .9, -.04, lit);
    /* the bin: a paper cup at the bottom of the board */
    var bx = 0, by = 250;
    g.fillStyle = 'rgba(0,0,0,.35)'; poly(g, [[bx - 92, by - 70 + 8], [bx + 100, by - 70 + 8], [bx + 76, by + 90 + 8], [bx - 68, by + 90 + 8]]); g.fill();
    g.fillStyle = '#c9bfa9'; poly(g, [[bx - 96, by - 70], [bx + 96, by - 70], [bx + 72, by + 90], [bx - 72, by + 90]]); g.fill();
    g.strokeStyle = 'rgba(80,70,55,.5)'; g.lineWidth = 4; for (var q = 0; q < 4; q++) { g.beginPath(); g.moveTo(bx - 60 + q * 40, by - 56); g.lineTo(bx - 46 + q * 30, by + 80); g.stroke(); }
    g.fillStyle = '#a99e88'; rr(g, bx - 104, by - 84, 208, 22, 8); g.fill();
    prop(g, 'bin', bx - 104, by - 84, bx + 104, by + 90);
    /* the back panel: a paper flap hinged on the left edge, swung open (it narrows as it turns) */
    if (open < 1) {
      var fw = PW * Math.cos(open * Math.PI * .5), ex0 = EXITING; EXITING = true;
      g.fillStyle = '#323a47'; rr(g, -PW / 2, -PHH / 2, Math.max(2, fw), PHH, 64 * Math.min(1, fw / 140)); g.fill();
      g.fillStyle = '#1f252f'; el(g, -PW / 2 + fw * .24, -PHH / 2 + 110, 46 * fw / PW, 46);
      EXITING = ex0;
    } else {
      g.fillStyle = '#323a47'; poly(g, [[-PW / 2, -PHH / 2 + 30], [-PW / 2 - 70, -PHH / 2 + 70], [-PW / 2 - 70, PHH / 2 - 70], [-PW / 2, PHH / 2 - 30]]); g.fill();
      g.fillStyle = 'rgba(0,0,0,.25)'; poly(g, [[-PW / 2, -PHH / 2 + 30], [-PW / 2 - 70, -PHH / 2 + 70], [-PW / 2 - 70, PHH / 2 - 70], [-PW / 2, PHH / 2 - 30]]); g.fill();
    }
    g.strokeStyle = 'rgba(244,237,224,.55)'; g.lineWidth = 3; rr(g, -PW / 2, -PHH / 2, PW, PHH, 64); g.stroke();
    g.restore();
    /* HEY SIRI: in from the right, touches the ear, passes on; the other words drop into the bin */
    var h1 = seg(t, K.hey - .45, K.hey - .15), h1o = 0;
    if (h1 > 0 && h1o < 1) {
      var hx = lerp(760, 540, eout(h1)), hy = 760 - 10 * Math.sin(t * 3);
      g.save(); g.globalAlpha *= 1 - h1o; var exh = EXITING; if (h1o > 0) EXITING = true; bubble(g, ['“HEY SIRI”'], hx + 120, hy, h1 * 2, 340, -1, 56); EXITING = exh; g.restore();
    }
    var b2 = seg(t, K.but - .1, K.phoneW), fall = eio(seg(t, K.phoneW, K.itself + .25)), gone = seg(t, K.itself + .2, K.itself + .3);
    if (b2 > 0 && gone < 1) {
      var bxx = lerp(lerp(790, 660, eout(b2)), 384, fall), byy = lerp(1040, 1060, fall) + 70 * fall * fall, sc = lerp(1, .32, fall);
      g.save(); g.translate(bxx, byy); g.scale(sc, sc); g.rotate(-.6 * fall); var exb = EXITING; EXITING = true; bubble(g, ['…NEW', 'SNEAKERS…'], 0, 0, b2 * 2, 330, -1, 52); EXITING = exb; g.restore();
    }
    /* the plate: what the makers say */
    var pa = fin(t, K.wake + .26, 4.5);
    if (pa > 0) {
      var exp = EXITING; if (pa < 1) EXITING = true;
      g.save(); g.globalAlpha *= pa; g.translate(0, 26 * (1 - pa));
      sheet(g, 120, 1238, 900, 1424, 1621, PAPER, 'wake plate');
      onprop(function () { txt(g, 'WAKE WORD:', 510, 1280, 44, '#4b4540', 'center', 900, DISP, 740, 1, 40, 'condensed'); font(g, 58, 900, DISP, 'condensed'); var wa = g.measureText('CHECKED ').width, wb = g.measureText('ON THE PHONE').width, xa = 510 - (wa + wb) / 2; txt(g, 'CHECKED', xa, 1338, 58, INK, 'left', 900, DISP, 0, 1, 44, 'condensed'); txt(g, 'ON THE PHONE', xa + wa, 1338, 58, INK, 'left', 900, DISP, 0, 1, 44, 'condensed'); txt(g, 'APPLE · GOOGLE', 510, 1396, 38, '#5d564c', 'center', 800, DISP, 740, 1, 36, 'condensed'); });
      g.restore(); EXITING = exp;
    }
  }

  /* =====================================================================================================
     D: the pitch room, wide. The Active Listening box (the hero), wired to the phone. Fail: the lamp lights coral.
     Pass: the FTC tab tears the front off: no microphone, the cord cut, folded email lists inside.
     ===================================================================================================== */
  var BX = { x0: 384, y0: 712, x1: 912, y1: 1412 };
  var PP = { cx: 238, cy: 1044, s: .62, rot: -.02 };
  function listSheet(g, x, y, w, h, rot, seed, fold) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-w / 2 + 6, -h / 2 + 9, w, h);
    g.fillStyle = SHEET; cut(g, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], mulberry(seed), 1.2);
    if (fold) { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(-w / 2, -2, w, 4); }
    var r = mulberry(seed + 3), rows = Math.max(2, Math.floor((h - 30) / 30));
    for (var i = 0; i < rows; i++) {
      var yy = -h / 2 + 24 + i * 30; if (yy > h / 2 - 16) break;
      g.fillStyle = '#7b7266'; font(g, 24, 900, DISP, 'condensed'); g.textAlign = 'left'; g.textBaseline = 'middle';
      var nr = NOREC; NOREC = true; g.fillText('@', -w / 2 + 18, yy + 1); NOREC = nr;
      g.fillStyle = BAR; rr(g, -w / 2 + 46, yy - 6, (w - 80) * (.45 + r() * .45), 12, 6); g.fill();
    }
    g.restore();
  }
  function waves(g, A, B, t, k, fall) {
    /* paper sound-wave strips riding the cord from the phone to the box */
    if (k <= 0) return;
    for (var i = 0; i < 4; i++) {
      var u = frac(t * .55 + i / 4), x = lerp(A[0], B[0], u), y = lerp(A[1], B[1], u) - 34 - 26 * Math.sin(u * Math.PI);
      var fy = fall > 0 ? 520 * fall * fall + 40 * i * fall : 0, rot = fall > 0 ? (i % 2 ? 1 : -1) * 1.4 * fall : 0;
      g.save(); g.translate(x, y + fy); g.rotate(rot); g.globalAlpha *= k * seg(u, 0, .12) * seg(1 - u, 0, .12);
      g.strokeStyle = CREAM; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
      for (var j = 0; j <= 6; j++) { var xx = -42 + j * 14, yy = (j % 2 ? -1 : 1) * (8 + 10 * Math.sin(t * 8 + i + j)); if (j) g.lineTo(xx, yy); else g.moveTo(xx, yy); }
      g.stroke(); g.lineCap = 'butt'; g.lineJoin = 'miter'; g.restore();
    }
  }
  /* the box. o.lamp 0..1 (coral), o.tear 0..1 (the front panel flies off), o.tab 0..1 (the FTC tab clipped on), o.spill 0..1 */
  function box(g, B, t, o) {
    var w = B.x1 - B.x0, h = B.y1 - B.y0;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, B.x0 + 14, B.y0 + 18, w, h, 22); g.fill();
    g.fillStyle = BOXC; rr(g, B.x0, B.y0, w, h, 22); g.fill();
    rr(g, B.x0, B.y0, w, h, 22); grainIn(g, B.x0, B.y0, w, h, 1701, 1.1);
    prop(g, 'active listening box', B.x0, B.y0, B.x1, B.y1);
    /* the inside (seen once the front is gone): dark walls, the cut cord's frayed stub, folded email lists */
    var ix0 = B.x0 + 30, iy0 = B.y0 + 30, iw = w - 60, ih = h - 60;
    g.fillStyle = '#0a0b0e'; rr(g, ix0, iy0, iw, ih, 14); g.fill();
    g.fillStyle = 'rgba(255,255,255,.035)'; poly(g, [[ix0, iy0], [ix0 + 60, iy0 + 60], [ix0 + 60, iy0 + ih - 60], [ix0, iy0 + ih]]); g.fill();
    g.fillStyle = 'rgba(0,0,0,.4)'; poly(g, [[ix0, iy0], [ix0 + iw, iy0], [ix0 + iw - 60, iy0 + 60], [ix0 + 60, iy0 + 60]]); g.fill();
    /* the cord comes in through the left wall and stops: a frayed, cut end */
    var cy = B.y1 - 120;
    g.strokeStyle = '#2a2f38'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(B.x0, cy); g.lineTo(ix0 + 96, cy - 6); g.stroke();
    g.strokeStyle = 'rgba(244,237,224,.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(B.x0, cy - 4); g.lineTo(ix0 + 96, cy - 10); g.stroke();
    g.strokeStyle = '#c9a24c'; g.lineWidth = 3; for (var f = 0; f < 5; f++) { g.beginPath(); g.moveTo(ix0 + 96, cy - 6); g.lineTo(ix0 + 112 + f * 3, cy - 18 + f * 8); g.stroke(); }
    g.lineCap = 'butt';
    /* the stack of folded lists */
    var sp = o.spill || 0;
    for (var i = 0; i < 6; i++) {
      var sx = ix0 + iw / 2 + 30 + (i % 2 ? 8 : -8), sy = iy0 + ih - 50 - i * 58, dx = sp * (i < 4 ? (-120 + i * 70) : 0), dy = sp * (i < 4 ? 120 + i * 20 : 0);
      if (sy < iy0 + 120) continue;
      listSheet(g, sx + dx, sy + dy, iw - 150, 54, (i % 3 - 1) * .03 + sp * (i - 1.5) * .12, 1800 + i, true);
    }
    /* the front panel: label, lamp, ear; the FTC tab tears it off to the right */
    var tr = clamp(o.tear || 0, 0, 1);
    if (tr < 1) {
      var e = eio(tr), ex0 = EXITING; if (tr > 0) EXITING = true;
      g.save(); g.translate(B.x1, B.y1); g.rotate(.9 * e); g.translate(420 * e, 260 * e * e); g.translate(-B.x1, -B.y1);
      g.fillStyle = BOXF; rr(g, B.x0 + 6, B.y0 + 6, w - 12, h - 12, 18); g.fill();
      rr(g, B.x0 + 6, B.y0 + 6, w - 12, h - 12, 18); grainIn(g, B.x0, B.y0, w, h, 1711, 1);
      /* a torn edge where the tab grips */
      /* the lamp */
      var lx = B.x0 + w / 2, ly = B.y0 + 110, L = clamp(o.lamp || 0, 0, 1);
      g.fillStyle = '#0c0d10'; el(g, lx, ly, 64, 64);
      if (L > 0) { g.save(); g.shadowColor = 'rgba(255,91,61,' + (.9 * L).toFixed(3) + ')'; g.shadowBlur = 70; g.fillStyle = mixc([60, 30, 28], hex(HOT), L); el(g, lx, ly, 50, 50); g.restore(); }
      else { g.fillStyle = '#3b3e46'; el(g, lx, ly, 50, 50); }
      g.fillStyle = 'rgba(255,255,255,.28)'; el(g, lx - 16, ly - 18, 14, 9);
      /* the ear on the front */
      ear(g, B.x0 + 126, B.y0 + 300 + 4 * Math.sin(t * 2.4), 1.15 + .06 * (o.perk || 0), .06 - .1 * (o.perk || 0), 0);
      /* the printed label */
      g.fillStyle = CREAM; rr(g, B.x0 + 46, B.y1 - 260, w - 92, 168, 14); g.fill();
      onprop(function () { txt(g, 'ACTIVE', B.x0 + w / 2, B.y1 - 216, 70, INK, 'center', 900, DISP, w - 130, 1, 48, 'condensed'); txt(g, 'LISTENING', B.x0 + w / 2, B.y1 - 140, 70, INK, 'center', 900, DISP, w - 130, 1, 48, 'condensed'); });
      /* the speaker grille holes */
      g.fillStyle = '#0d0e11'; for (var gx = 0; gx < 5; gx++) for (var gy = 0; gy < 3; gy++) el(g, B.x1 - 210 + gx * 34, B.y0 + 200 + gy * 34, 8, 8);
      /* the FTC tab clipped to the right edge */
      var tb = clamp(o.tab || 0, 0, 1);
      if (tb > 0) {
        var tx = lerp(B.x1 + 260, B.x1 - 86, eout(tb)), ty = B.y0 + 340, exb = EXITING; if (tb < 1) EXITING = true;
        g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, tx - 70 + 6, ty - 56 + 8, 150, 112, 12); g.fill();
        g.fillStyle = CREAM; rr(g, tx - 70, ty - 56, 150, 112, 12); g.fill();
        g.fillStyle = BRASS2; g.fillRect(tx - 78, ty - 30, 22, 60);
        prop(g, 'ftc tab', tx - 78, ty - 56, tx + 80, ty + 56);
        onprop(function () { txt(g, 'FTC', tx + 6, ty + 4, 66, INK, 'center', 900, DISP, 130, 1, 48, 'condensed'); });
        EXITING = exb;
      }
      g.restore(); EXITING = ex0;
    }
    g.strokeStyle = 'rgba(244,237,224,.3)'; g.lineWidth = 3; rr(g, B.x0, B.y0, w, h, 22); g.stroke();
    /* the jack on the left wall */
    g.fillStyle = '#2a2f38'; rr(g, B.x0 - 16, cy - 20, 22, 40, 6); g.fill();
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
  function pitchScene(g, t) {
    if (LAYER === 'bg') { wall(g, '#1b1820', .014); desk(g, DESK, '#3d2b1e', '#251a12'); return; }
    var bin = eout(seg(t, K.dip - .25, K.dip + .45)), B = { x0: BX.x0 + 600 * (1 - bin), y0: BX.y0, x1: BX.x1 + 600 * (1 - bin), y1: BX.y1 };
    var push = eout(seg(t, K.TR + .06, K.TR + .22)) * .12;   /* the punch-in on the torn-open box and the cut stub, held into the tilt */
    g.save(); g.translate(790, 1300); g.scale(1 + push, 1 + push); g.translate(-790, -1300);
    var P = { cx: PP.cx, cy: PP.cy + drift(t, .7, .3), s: PP.s, rot: PP.rot };
    var ex = EXITING; if (bin < 1) EXITING = true;
    /* the cord: phone port → the box's jack; plugged on "seller" */
    var A = portOf(P), J = [B.x0 - 16, B.y1 - 120], ck = eout(seg(t, K.dip, K.seller + .1));
    cord(g, A, J, ck, 110);
    var tr = seg(t, K.TR - .02, K.TR + .3);
    var wk = seg(t, K.pitched - .15, K.pitched + .2) * (tr > 0 ? 1 : 1), fall = seg(t, K.TR, K.TR + .7);
    if (fall < 1) waves(g, A, J, t, wk * (1 - seg(fall, .6, 1)), fall);
    box(g, B, t, { lamp: seg(t, K.DP - .02, K.DP + .06) * (1 - .25 * seg(t, K.TR, K.TR + .3)), perk: eout(seg(t, K.pitched, K.pitched + .2)), tab: seg(t, K.ftc - .1, K.ftc + .25), tear: tr, spill: eio(seg(t, K.resold - .05, K.listsW + .1)) });
    EXITING = ex;
    var exq = EXITING; if (push > 0) EXITING = true;   /* the punch-in crops the phone off the left edge */
    phone(g, P, { rim: .7, screen: function (s) { hookScreen(s, t, 1); } });
    EXITING = exq;
    /* AS PITCHED: under the strips while they ride; it drops with them */
    if (wk > 0 && fall < 1) { var exa = EXITING; if (fall > 0 || wk < 1) EXITING = true; var mx = 238 + 6 * Math.sin(t * 3.4), my = Math.max(lerp(A[1], J[1], .5) + 70, 1340) + 5 * Math.sin(t * 8 + 2.1);   /* hangs just under the strips at mid-cord, clear of the phone and the box */
      g.save(); g.translate(mx, my + 520 * fall * fall); g.rotate(-1.4 * fall + .04 * Math.sin(t * 3.4)); g.globalAlpha *= 1 - seg(fall, .4, .9); chipCard(g, 'AS PITCHED', 0, 0, wk, 44, 270, true); g.restore(); EXITING = exa; }
    g.restore();
    /* the dated cards and the quotes (left column / top); each peels before the next source's line */
    var c1 = fin(t, K.dip - .4, 4) * (1 - seg(t, K.twist - .3, K.twist - .1));
    if (c1 > 0) chipCard(g, '2023', 206, 746, c1, 52, 230);
    var c2 = fin(t, K.twist + .05, 4) * (1 - seg(t, K.TR + .02, K.TR + .12));   /* off before the punch-in brings the box over it */
    if (c2 > 0) chipCard(g, 'MAY 2026', 232, 746, c2, 52, 250);
    qplate(g, 108, 466, 804, ['“CREEPY? SURE. GREAT FOR', 'MARKETING? DEFINITELY.”'], 52, ['CMG’S WEBSITE, 2023', 'AS QUOTED BY THE FTC'], 1721, seg(t, S('pitch').t0 - .5, S('pitch').t0 - .3), seg(t, K.twist - .25, K.twist + .05), true);
    qplate(g, 108, 466, 804, ['“…DID NOT … USE VOICE', 'DATA AT ALL”'], 52, [['FTC SAYS · MAY 2026', '·  ORDER FINAL AUG 2026']], 1731, seg(t, K.ftc - .25, K.ftc - .05), 0, false);
  }

  /* =====================================================================================================
     E: top-down on the floor. The open box at the top, the email lists fanned across the floor; the summary is drawn
     over them (the hero hold, the poster); then the ad is rebuilt from data tags.
     ===================================================================================================== */
  var FAN = [[270, 1000, -.3], [500, 1020, .1], [740, 1000, .26], [300, 1265, .2], [530, 1280, -.16], [740, 1262, -.24], [420, 1140, .4]];
  function floorScene(g, t) {
    if (LAYER === 'bg') {
      g.fillStyle = '#2e2219'; g.fillRect(-300, -300, W + 600, H + 600);
      var r = mulberry(31); for (var i = 0; i < 14; i++) { g.fillStyle = 'rgba(0,0,0,' + (.14 + r() * .1).toFixed(3) + ')'; g.fillRect(-300 + i * 150, -300, 5, H + 600); g.fillStyle = 'rgba(255,230,200,' + (.02 + r() * .02).toFixed(3) + ')'; g.fillRect(-300 + i * 150 + 40 + r() * 60, -300, 2 + r() * 3, H + 600); }
      return;
    }
    var E0 = S('floor').t0, fp = .03 * sio(seg(t, K.brokers, K.dot + .3));
    g.translate(510, 1000); g.scale(1 + fp, 1 + fp); g.rotate(.005 * sio(seg(t, K.brokers, K.dot + .3))); g.translate(-510, -1000);
    /* the open box from above */
    var bx0 = 112, by0 = 468, bw = 420, bh = 300;
    /* the torn front panel, face up beside the box: whose box this was */
    (function () {
      var cx = 732, cy = 612, pw = 330, ph = 292, r = mulberry(1771);
      g.save(); g.translate(cx, cy + 3 * Math.sin(t * 1.2)); g.rotate(.07 + .01 * Math.sin(t * .9));
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, -pw / 2 + 12, -ph / 2 + 16, pw, ph, 16); g.fill();
      g.fillStyle = BOXF; g.beginPath(); g.moveTo(-pw / 2 + 16, -ph / 2); g.lineTo(pw / 2 - 16, -ph / 2); g.quadraticCurveTo(pw / 2, -ph / 2, pw / 2, -ph / 2 + 16); g.lineTo(pw / 2, ph / 2);
      for (var i = 0; i <= 14; i++) g.lineTo(pw / 2 - pw * i / 14, ph / 2 - r() * 16);   /* the torn lower edge */
      g.lineTo(-pw / 2, -ph / 2 + 16); g.quadraticCurveTo(-pw / 2, -ph / 2, -pw / 2 + 16, -ph / 2); g.closePath(); g.fill();
      grainIn(g, -pw / 2, -ph / 2, pw, ph, 1772, 1);
      prop(g, 'torn panel', -pw / 2, -ph / 2, pw / 2, ph / 2);
      g.fillStyle = '#0c0d10'; el(g, -pw / 2 + 62, -ph / 2 + 58, 36, 36); g.fillStyle = '#3b3e46'; el(g, -pw / 2 + 62, -ph / 2 + 58, 28, 28);   /* the lamp, dead */
      g.fillStyle = '#0d0e11'; for (var gx = 0; gx < 4; gx++) for (var gy = 0; gy < 2; gy++) el(g, pw / 2 - 150 + gx * 30, -ph / 2 + 44 + gy * 30, 7, 7);
      g.fillStyle = CREAM; rr(g, -pw / 2 + 24, -ph / 2 + 112, pw - 48, 150, 12); g.fill();
      onprop(function () { txt(g, 'ACTIVE', 0, -ph / 2 + 152, 60, INK, 'center', 900, DISP, pw - 70, 1, 56, 'condensed'); txt(g, 'LISTENING', 0, -ph / 2 + 220, 60, INK, 'center', 900, DISP, pw - 70, 1, 56, 'condensed'); });
      g.restore();
    })();
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, bx0 + 12, by0 + 16, bw, bh, 16); g.fill();
    g.fillStyle = BOXC; rr(g, bx0, by0, bw, bh, 16); g.fill(); rr(g, bx0, by0, bw, bh, 16); grainIn(g, bx0, by0, bw, bh, 1741, 1);
    prop(g, 'open box (top)', bx0, by0, bx0 + bw, by0 + bh);
    g.fillStyle = '#0a0b0e'; rr(g, bx0 + 26, by0 + 26, bw - 52, bh - 52, 10); g.fill();
    for (var s0 = 0; s0 < 3; s0++) listSheet(g, bx0 + bw / 2 + (s0 - 1) * 40, by0 + bh / 2 + (s0 - 1) * 14, 300, 150, (s0 - 1) * .15, 1900 + s0, false);
    /* the cut cord: over the rim, across the lists, its frayed stub pointing at the torn panel */
    var fx = bx0 + bw - 34, fy = by0 + bh - 84 + 3 * Math.sin(t * 2.1);
    g.lineCap = 'round';
    [['rgba(0,0,0,.4)', 16, 6], ['#2a2f38', 12, 0], ['rgba(244,237,224,.3)', 3, -3]].forEach(function (L) { g.strokeStyle = L[0]; g.lineWidth = L[1]; g.beginPath(); g.moveTo(bx0 + 30, by0 + bh + 40 + L[2]); g.quadraticCurveTo(bx0 + 120, by0 + bh - 20 + L[2], fx, fy + L[2]); g.stroke(); });
    g.strokeStyle = '#c9a24c'; g.lineWidth = 3; for (var f = 0; f < 5; f++) { g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + 16 + f * 2, fy - 12 + f * 6); g.stroke(); } g.lineCap = 'butt';
    /* the lists fan out of the box and slap down on the floor */
    var sp = eout(seg(t, E0 - .4, K.SL));
    FAN.forEach(function (F, i) {
      var k = clamp(sp * 1.25 - i * .04, 0, 1), x = lerp(bx0 + bw / 2, F[0], k), y = lerp(by0 + bh / 2, F[1], k);
      var ex = EXITING; if (k < 1) EXITING = true;
      listSheet(g, x + (k >= 1 ? 6 * Math.sin(t * 1.1 + i * 1.7) : 0), y + 6 * Math.sin(t * 1.3 + i) * (k >= 1 ? 1 : 0), 300, 220, F[2] * k + (k >= 1 ? .03 * Math.sin(t * .9 + i) : 0), 1950 + i, false);
      if (k >= 1) prop(g, 'list sheet', x - 150, y - 110, x + 150, y + 110);
      EXITING = ex;
    });
    /* the plate: what was in the box (the FTC's words) */
    var pa = fin(t, K.email - .05, 4), po = eio(seg(t, K.follow - .55, K.follow - .3));
    if (pa > 0 && po < 1) {
      var exp = EXITING; if (pa < 1 || po > 0) EXITING = true;
      g.save(); g.globalAlpha *= pa * (1 - po); g.translate(-500 * po, 20 * (1 - pa));
      sheet(g, 120, 790, 900, 900, 1751, CREAM, 'email plate');
      onprop(function () { font(g, 52, 900, DISP, 'condensed'); var wa = g.measureText('EMAIL LISTS ').width, wb = g.measureText('FROM DATA BROKERS').width, xa = 510 - (wa + wb) / 2; txt(g, 'EMAIL LISTS', xa, 832, 52, INK, 'left', 900, DISP, 0, 1, 44, 'condensed'); txt(g, 'FROM DATA BROKERS', xa + wa, 832, 52, INK, 'left', 900, DISP, 0, 1, 44, 'condensed'); txt(g, 'FTC SAYS', 510, 878, 36, '#5d564c', 'center', 800, DISP, 740, 1, 36, 'condensed'); });
      g.restore(); EXITING = exp;
    }
    /* the summary, drawn by hand on a slate card over the lists; held through the silence (the poster) */
    var sIn = seg(t, K.email + .1, K.email + .3), sUp = eio(seg(t, K.follow - .4, K.follow - .05)), sOut = 0;
    if (sIn > 0 && sOut < 1) {
      var exs = EXITING; if (sIn < 1 || sOut > 0 || (sUp > 0 && sUp < 1)) EXITING = true;
      g.save(); g.globalAlpha *= seg(sIn, 0, .5) * (1 - sOut); g.translate(510, 1105); g.translate(0, -203 * sUp); g.scale(lerp(1, .68, sUp), lerp(1, .68, sUp)); g.translate(-510, -1105);
      var x0 = 112, y0 = 940, w = 796, h = 330;
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 10, y0 + 14, w, h, 16); g.fill();
      g.fillStyle = '#26303a'; rr(g, x0, y0, w, h, 16); g.fill(); rr(g, x0, y0, w, h, 16); grainIn(g, x0, y0, w, h, 1761, 1.2);
      g.strokeStyle = '#8a6b3c'; g.lineWidth = 10; rr(g, x0 + 5, y0 + 5, w - 10, h - 10, 12); g.stroke();
      prop(g, 'summary slate', x0, y0, x0 + w, y0 + h);
      /* chalk: line 1 written, then struck through; line 2 written; the payoff underline in coral at the peak */
      var w1 = seg(t, K.email + .22, K.email + .5), st = seg(t, K.lfrom + .15, K.lfrom + .4), w2 = seg(t, K.lfrom + .3, K.brokers + .05), ul = seg(t, K.brokers + .05, K.brokers + .3);
      var L1 = 'PITCHED: YOUR VOICE → ADS', L2 = 'FTC SAYS: EMAIL LISTS → ADS';
      function chalkLine(s, y, k, col) {
        if (k <= 0) return 0;
        font(g, 60, 800, DISP, 'condensed'); var tw = g.measureText(s).width, px = 60; while (tw > w - 80) { px -= 2; font(g, px, 800, DISP, 'condensed'); tw = g.measureText(s).width; }
        var xs = x0 + (w - tw) / 2;
        g.save(); g.beginPath(); g.rect(xs - 10, y - 50, (tw + 20) * k, 100); g.clip();
        var nr = NOREC; NOREC = k < 1; onprop(function () { txt(g, s, xs, y, px, col, 'left', 800, DISP, 0, 1, 40, 'condensed'); }); NOREC = nr;
        g.restore(); return tw;
      }
      var tw1 = chalkLine(L1, y0 + 100, w1, 'rgba(244,237,224,.92)');
      if (st > 0) { var xs1 = x0 + (w - tw1) / 2; g.strokeStyle = CREAM; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(xs1 - 8, y0 + 104); g.lineTo(xs1 - 8 + (tw1 + 16) * eio(st), y0 + 96); g.stroke(); g.lineCap = 'butt'; }
      var tw2 = chalkLine(L2, y0 + 228, w2, CREAM);
      if (ul > 0) { var xs2 = x0 + (w - tw2) / 2; g.strokeStyle = HOT; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(xs2, y0 + 272); g.quadraticCurveTo(xs2 + tw2 / 2, y0 + 282, xs2 + tw2 * eout(ul), y0 + 268); g.stroke(); g.lineCap = 'butt'; }
      g.restore(); EXITING = exs;
    }
    /* the ad, rebuilt from data: three tags slide out of the pile onto the ad card, one per word */
    var ak = fin(t, K.follow - .3, 4);
    if (ak > 0) {
      var exa = EXITING; if (ak < 1) EXITING = true;
      g.save(); g.translate(420 * (1 - ak), 0);
      adCard(g, 486, 1030, 416, 384, seg(t, K.searches - .1, K.location + .2), .36);
      g.restore();
      var TG = [['SEARCHES', K.searches, 1220], ['APPS', K.apps, 1290], ['GENERAL AREA', K.rough, 1360]];
      TG.forEach(function (q) {
        var k = eout(seg(t, K.follow - .4 + TG.indexOf(q) * .05, K.follow - .22 + TG.indexOf(q) * .05)); if (k <= 0) return; var bmp = Math.sin(Math.PI * seg(t, q[1] - .05, q[1] + .2));
        var ex2 = EXITING; if (k < 1) EXITING = true;
        onprop(function () { chip(g, q[0], lerp(330, 694, k) + 18 * bmp, lerp(1080, q[2], k) - 6 * bmp, { px: 46, wt: 900, bg: INK, fg: CREAM, line: CREAM, lw: 3, r: 12, st: 'condensed', rot: -.04 * (1 - k), w: 340, h: 60, maxw: 350 }); });
        EXITING = ex2;
      });
      onprop(function () { if (t > K.follow - .3) tag(g, 'GOOGLE ADS HELP', 300, 1290, seg(t, K.follow - .3, K.follow - .2), 0, 340, CREAM, EXAMPLE_BG, 38);
      if (t > K.follow - .2) tag(g, 'EXAMPLE AD', 280, 1210, seg(t, K.follow - .2, K.follow - .1), 0, 300, CREAM, EXAMPLE_BG, 38); });
      EXITING = exa;
    }
  }

  /* =====================================================================================================
     F: the status bar, close. The cut cord's end points up; Apple's orange dot pops, then a green one.
     ===================================================================================================== */
  function phoneTop(g, x0, y0, w, h, t, dotC, dotK, seed, timeTxt) {
    /* the top of a phone as a paper cut-out, its lower edge torn */
    var r = mulberry(seed);
    g.fillStyle = 'rgba(0,0,0,.42)'; g.beginPath(); g.moveTo(x0 + 12, y0 + 80); g.arcTo(x0 + 12, y0 + 14, x0 + 90, y0 + 14, 80); g.arcTo(x0 + w + 12, y0 + 14, x0 + w + 12, y0 + 90, 80); g.lineTo(x0 + w + 12, y0 + h + 14); g.lineTo(x0 + 12, y0 + h + 14); g.closePath(); g.fill();
    g.fillStyle = PHB; g.beginPath(); g.moveTo(x0, y0 + 80); g.arcTo(x0, y0, x0 + 80, y0, 80); g.arcTo(x0 + w, y0, x0 + w, y0 + 80, 80);
    for (var i = 0; i <= 20; i++) g.lineTo(x0 + w - w * i / 20, y0 + h - (r() * 22));
    g.closePath(); g.fill();
    prop(g, 'phone top', x0, y0, x0 + w, y0 + h);
    g.fillStyle = '#0b0d12'; g.beginPath(); g.moveTo(x0 + 26, y0 + 96); g.arcTo(x0 + 26, y0 + 26, x0 + 96, y0 + 26, 62); g.arcTo(x0 + w - 26, y0 + 26, x0 + w - 26, y0 + 96, 62); g.lineTo(x0 + w - 26, y0 + h - 40); g.lineTo(x0 + 26, y0 + h - 40); g.closePath(); g.fill();
    g.fillStyle = '#05060a'; el(g, x0 + w / 2, y0 + 78, 22, 22);
    onprop(function () { txt(g, timeTxt, x0 + 110, y0 + 82, 46, CREAM, 'center', 800, DISP, 0, 1, 40, 'semi-expanded'); });
    /* signal bars and battery */
    var bx = x0 + w - 236; for (var b = 0; b < 4; b++) { g.fillStyle = CREAM; rr(g, bx - 110 + b * 16, y0 + 92 - 10 - b * 7, 10, 10 + b * 7, 2); g.fill(); }
    g.strokeStyle = CREAM; g.lineWidth = 4; rr(g, bx - 20, y0 + 62, 66, 34, 8); g.stroke(); g.fillStyle = CREAM; rr(g, bx - 14, y0 + 68, 46, 22, 4); g.fill(); rr(g, bx + 48, y0 + 72, 6, 14, 2); g.fill();
    if (dotK > 0) {
      var e = clamp(pop(dotK, 0, 3) , 0, 1.08), dx = x0 + w - 92, dy = y0 + 66;
      var pu = 1 + .12 * Math.abs(decay(t, K.PP, 16, 5));
      pu *= 1 + .08 * Math.sin(t * 6);
      g.save(); for (var q = 0; q < 2; q++) { var ph = frac(t * .9 + q * .5); g.strokeStyle = dotC; g.globalAlpha = (1 - ph) * .8 * clamp(dotK * 3, 0, 1); g.lineWidth = 6; g.beginPath(); g.arc(dx, dy, 66 + 34 * ph, 0, 6.283); g.stroke(); } g.restore();
      g.save(); g.fillStyle = 'rgba(0,0,0,.35)'; el(g, dx + 4, dy + 6, 62 * e * pu, 62 * e * pu); g.fillStyle = dotC; el(g, dx, dy, 62 * e * pu, 62 * e * pu); g.restore();
    }
  }
  function dotScene(g, t) {
    if (LAYER === 'bg') { wall(g, '#151a24'); return; }
    var dp0 = .025 * sio(seg(t, S('dot').t0, S('set').t0)); g.translate(510, 950); g.scale(1 + dp0, 1 + dp0); g.translate(-510, -950);
    var push = sio(seg(t, K.dot - .3, K.dotEnd + .3));
    g.save(); g.translate(510, 640); g.scale(1 + .03 * push, 1 + .03 * push); g.translate(-510, -640);
    phoneTop(g, 128, 474, 764, 300, t, ORANGE, t - K.dotW + .05 > 0 ? (t - K.dotW + .05) : 0, 61, '10:08');
    g.restore();
    var la = fin(t, S('dot').t0 - .1, 4.5);
    if (la > 0) chipCard(g, 'iPHONE: ORANGE = MIC', 510, 830, la, 52, 800, false);
    var ga = t - K.top + .2;
    phoneTop(g, 128, 930, 764, 270, t, GREEN, ga > 0 ? ga : 0, 77, '10:08');
    DOTCORD(g, t);
    /* the green dot's labels wait for its pop, stacked flush left */
    var gb = fin(t, K.top - .02, 4.5);
    function chipL(text, y, a) { font(g, 48, 900, DISP, 'condensed'); var w = g.measureText(text).width + 48 * .64; chipCard(g, text, 140 + w / 2, y, a, 48, 800, true); }
    if (gb > 0) { onprop(function () { txt(g, 'GREEN DOT', 140, 1240, 44, CREAM, 'left', 900, DISP, 700, gb, 40, 'condensed'); }); chipL('iPHONE: CAMERA (± MIC)', 1306, gb); chipL('ANDROID: CAMERA OR MIC', 1380, fin(t, K.top + .05, 4.5)); }
  }
  function DOTCORD(g, t) {
    /* the cut cord: its frayed end swings in from the lower left and points at the orange dot */
    var ck = eout(seg(t, K.dot - .1, K.dotW + .1));
    if (ck > 0) {
      var k2 = eio(seg(t, K.top - .25, K.top + .12)), tipx = lerp(lerp(140, 640, ck), 676, k2), tipy = lerp(lerp(1000, 610, ck), 1000, k2) + 6 * Math.sin(t * 3);
      g.save(); g.lineCap = 'round';
      [['rgba(0,0,0,.35)', 16, 5], ['#3a404c', 12, 0], ['rgba(244,237,224,.45)', 3, -3]].forEach(function (L) { g.strokeStyle = L[0]; g.lineWidth = L[1]; g.beginPath(); g.moveTo(100, 905 + L[2]); g.quadraticCurveTo(lerp(140, 380, ck), lerp(905, 900, ck) + 40 * k2 + L[2], tipx, tipy + L[2]); g.stroke(); });
      g.strokeStyle = '#c9a24c'; g.lineWidth = 3; for (var f = 0; f < 5; f++) { g.beginPath(); g.moveTo(tipx, tipy); g.lineTo(tipx + 12 + f * 3, tipy - 14 - f * 4); g.stroke(); }
      g.restore();
    }
  }

  /* =====================================================================================================
     G: a re-created, generic settings screen: Microphone, the apps that asked, each row a neutral chevron; both paths.
     ===================================================================================================== */
  function setScene(g, t) {
    if (LAYER === 'bg') { wall(g, '#161c26'); return; }
    var k = eout(seg(t, S('set').t0 - .6, S('set').t0 + .1)), sc = lerp(.9, 1, k) + .01 * seg(t, S('set').t0, K.yours);
    g.save(); g.translate(510, 760); g.scale(sc, sc); g.translate(-510, -760);
    var x0 = 124, y0 = 470, x1 = 896, y1 = 1060;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 12, y0 + 16, x1 - x0, y1 - y0, 60); g.fill();
    g.fillStyle = PHB; rr(g, x0, y0, x1 - x0, y1 - y0, 60); g.fill();
    prop(g, 'settings phone', x0, y0, x1, y1);
    g.fillStyle = '#efe8db'; rr(g, x0 + 20, y0 + 20, x1 - x0 - 40, y1 - y0 - 40, 44); g.fill();
    rr(g, x0 + 20, y0 + 20, x1 - x0 - 40, y1 - y0 - 40, 44); grainIn(g, x0 + 20, y0 + 20, x1 - x0 - 40, y1 - y0 - 40, 1401, .6);
    onprop(function () { txt(g, 'Microphone', x0 + 60, y0 + 84, 58, INK, 'left', 900, DISP, 420, 1, 44, 'condensed'); });
    var ROWS = [['Voice Recorder', '#6f9a7c', 0], ['Video Calls', '#5d7a9c', 1], ['Translator', '#b5865a', 2], ['Notes', '#8b6f9e', 3]];
    ROWS.forEach(function (rw, i) {
      var a = fin(t, K.settings - .3 + i * .12, 4.5), cy = y0 + 150 + i * 100;
      if (a <= 0) return;
      g.save(); g.globalAlpha *= a; g.translate(0, 30 * (1 - a)); var ex = EXITING; if (a < 1) EXITING = true;
      g.fillStyle = '#fbf7ef'; rr(g, x0 + 46, cy, x1 - x0 - 92, 86, 18); g.fill();
      g.fillStyle = rw[1]; rr(g, x0 + 66, cy + 13, 60, 60, 14); g.fill();
      g.fillStyle = 'rgba(244,237,224,.9)'; if (rw[2] === 0) el(g, x0 + 96, cy + 43, 13, 13); else if (rw[2] === 1) { rr(g, x0 + 80, cy + 32, 26, 22, 4); g.fill(); poly(g, [[x0 + 106, cy + 43], [x0 + 116, cy + 35], [x0 + 116, cy + 51]]); g.fill(); } else if (rw[2] === 2) { g.fillRect(x0 + 82, cy + 32, 28, 6); g.fillRect(x0 + 82, cy + 46, 20, 6); } else { rr(g, x0 + 84, cy + 28, 24, 30, 3); g.fill(); }
      onprop(function () { txt(g, rw[0], x0 + 150, cy + 45, 46, INK, 'left', 800, DISP, 460, 1, 40, 'condensed'); });
      g.strokeStyle = INK; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x1 - 116, cy + 26); g.lineTo(x1 - 94, cy + 43); g.lineTo(x1 - 116, cy + 60); g.stroke(); g.lineCap = 'butt'; g.lineJoin = 'miter';
      EXITING = ex; g.restore();
    });
    var hk = eout(seg(t, K.settings + .1, K.settings + .5)), hr = clamp((t - K.shows) / .55, 0, 3.2), hi = Math.floor(hr), hf = hr - hi, hy = y0 + 193 + 100 * (hi + sio(seg(hf, .6, 1))) - 10 * Math.sin(Math.PI * seg(hf, 0, .3));
    if (hk > 0) { g.save(); g.translate(lerp(1100, 648 + 156 * .9, hk), hy); g.scale(.9, .9); var exh = EXITING; EXITING = true; hand(g); EXITING = exh; g.restore(); }
    g.restore();
    onprop(function () { tag(g, 'RE-CREATED', 744, 556, k, 0, 260, INK, '#efe8db', 34); });
    /* the two paths, each maker's own words */
    var PA = [['iPHONE', ['Settings ›', 'Privacy & Security ›', 'Microphone'], S('set').t0 - .45, 1100], ['ANDROID', ['Settings ›', 'Security & privacy ›', 'Privacy dashboard'], S('set').t0 - .38, 1232]];
    PA.forEach(function (p) {
      var a = fin(t, p[2], 4.5); if (a <= 0) return;
      var ex = EXITING; if (a < 1) EXITING = true;
      g.save(); g.globalAlpha *= a; g.translate(60 * (1 - a), 0);
      sheet(g, 120, p[3], 900, p[3] + 112, p[3] + 7, PAPER, 'path card');
      onprop(function () { txt(g, p[0], 146, p[3] + 34, 40, INK, 'left', 900, DISP, 300, 1, 36, 'condensed'); font(g, 37, 800, DISP, 'condensed'); var xx = 146; p[1].forEach(function (c) { txt(g, c, xx, p[3] + 80, 37, '#2f2a26', 'left', 800, DISP, 0, 1, 36, 'condensed'); font(g, 37, 800, DISP, 'condensed'); xx += g.measureText(c).width + 10; }); });
      g.restore(); EXITING = ex;
    });
    var mv = fin(t, S('set').t0 - .3, 4.5);
    if (mv > 0) tag(g, 'MENU NAMES VARY', 510, 1388, mv, 0, 420, CREAM, EXAMPLE_BG, 36);
  }

  /* =====================================================================================================
     THE END: frame 0's picture with YES / NO; the phone glides back to frame 0's place by the cut
     ===================================================================================================== */
  function endScene(g, t) {
    if (LAYER === 'bg') { wall(g); desk(g); return; }
    var u = sio(seg(t, TEND - .55, TEND)), P = lerpPose(F0B, F0A, u);
    P.cy += drift(t, .3, .5) * (1 - seg(t, TEND - .8, TEND - .55));
    var E0 = S('end').t0, kc = eout(seg(t, E0, E0 + .12)), sc0 = lerp(1.06, 1, kc);
    var exe = EXITING; if (u > 0) EXITING = true; phoneHook(g, P, t, { peel: 0, ad: 0, tt: t - TEND }); EXITING = exe;
    var ck = pop(t, E0 - .1, 3.2), exk = EXITING; if (ck < .999) EXITING = true;
    if (ck > 0) sticker(g, P.cx + 6, P.cy - 222, Math.min(1, ck), 0);
    EXITING = exk;
    /* YES / NO at the right, clear of the phone; they shrink away before the phone glides back */
    var yo = eio(seg(t, K.noEnd + .06, K.noEnd + .22));
    [['YES', 790, 700], ['NO', 790, 940]].forEach(function (c) {
      var tq0 = c[0] === 'YES' ? K.yes : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), sc = sc0 * (1 - .07 * tp) * (1 - yo);
      if (sc <= .01) return;
      var oc = ONPROP, ex0 = EXITING; ONPROP = yo > 0 || kc < 1; EXITING = ex0 || yo > 0; chip(g, c[0], c[1], c[2] + 8 * tp, { px: 112, wt: 900, bg: BG, line: HOT, lw: 8, fg: HOT, w: 250, h: 160, r: 54, shadow: true, a: 1 - seg(yo, .5, .9), s: sc, maxw: 250 }); ONPROP = oc; EXITING = ex0;
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
  var CAPGROUPS = { hook: [[2, 3]], ask: [[4, 4]], study: [[3, 4], [4]], wake: [[4], [5]], dip: [[4, 2], [4]], twist: [[4, 5]], lists: [[4, 3]], ads: [[5], [4]], dot: [[5], [4, 3]], perms: [[4, 4]], end: [[3, 4], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'probably'], ['ask', 'match'], ['study', 'no'], ['wake', 'itself'], ['dip', 'pitched'], ['twist', 'no'], ['lists', 'email'], ['ads', 'searches'], ['dot', 'dot'], ['perms', 'Settings'], ['end', 'yours']]
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
  var NOISE, SCENES = { hookScene: hookScene, studyScene: studyScene, wakeScene: wakeScene, pitchScene: pitchScene, floorScene: floorScene, dotScene: dotScene, setScene: setScene, endScene: endScene };
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
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null, CCV = null, CCX = null;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 54, 800, DISP, 'semi-expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('Is your phone', CX, 362);
    var b = 'listening for ads?', bp = 62; font(g, bp, 800, DISP, 'expanded');
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
  var GAIN = { hk: .5, dp: .22, tr: .3, sl: .042, pp: .3 };
  var TYPE = { hk: 'paper', dp: 'knock', tr: 'tear', sl: 'slap', pp: 'tick' };
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
  var HOLD = { t0: K.listsEnd, t1: K.ads };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((K.SL + .45) * 30) / 30 + 1 / 60, SLUG: 'phonelistening', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
