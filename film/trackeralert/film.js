/* "Your phone warns you about trackers." — Factory #38 (trackeralert) on Tech, explained, after ../wifibattery/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   All cut paper over a dim paper street map: a giant cream tracker tag with a coral ring (no logo) is the thread, a
   red-dot trail with a dashed line (Apple's own map description) is laid beat by beat. Re-created alert banners and
   screens on generic phones, tagged RE-CREATED. A borrowed backpack, a Bluetooth switch that doesn't stop the trail
   (WON'T STOP IT · APPLE + GOOGLE), a PUBLIC storefront with no figures, Apple's Instructions to Disable under IF IT'S
   SAFE, two settings paths ending on a chevron. No people; the viewer's taps are touch discs. Props stay whole inside
   x 92–928, y 302–1428. */
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
    /* the aligner splits "5 a.m." into "a." + "m.": one word on screen and in the keys */
    var ws = []; l.words.forEach(function (w) { var p = ws[ws.length - 1]; if (p && ((/°$/.test(p.w) && /^F/.test(w.w)) || (p.w === 'a.' && /^m\./.test(w.w)))) { p.w += w.w; p.t1 = w.t1; } else ws.push({ w: w.w, t0: w.t0, t1: w.t1 }); });
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
  var BODY = { thump: .2, knock: .14, slap: .1, paper: .17, pop: .12, tick: .05, click: .06, swish: .21, rip: .24, marker: .3, tear: .15, chirp: .14 };
  var GT = {};
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  var K = {
    hook: start('hook'), warns: at('hook', 'warns'), trackers: at('hook', 'trackers.'), hookEnd: lend('hook'),
    ask: start('ask'), now: at('ask', 'now?'), askEnd: lend('ask'),
    iphone: start('iphone'), iph: at('iphone', 'iPhone,'), airtag: at('iphone', 'AirTag'), found: at('iphone', 'Found'), moving: at('iphone', 'Moving'), withW: at('iphone', 'With'), you: at('iphone', 'You.'), iphoneEnd: lend('iphone'),
    android: start('android'), andW: at('android', 'Android,'), unknown: at('android', 'unknown'), alertA: at('android', 'alert.'), androidEnd: lend('android'),
    borrow: start('borrow'), backpack: at('borrow', 'backpack'), borrowed: at('borrow', 'borrowed.'), borrowEnd: lend('borrow'),
    sound: start('sound'), tap: at('sound', 'Tap'), then: at('sound', 'then'), play: at('sound', 'Play'), soundW: at('sound', 'Sound.'), soundEnd: lend('sound'),
    dip: start('dip'), move: at('dip', 'move?'), btD: at('dip', 'Bluetooth'), off: at('dip', 'off.'), dipEnd: lend('dip'),
    twist: start('twist'), google: at('twist', 'Google'), say: at('twist', 'say'), wont: at('twist', "won't"), twistEnd: lend('twist'),
    unsafe: start('unsafe'), unsafeW: at('unsafe', 'unsafe?'), unsafeE: wend('unsafe', 'unsafe?'), go: at('unsafe', 'Go'), publicW: at('unsafe', 'public'), locW: at('unsafe', 'location.'), unsafeEnd: lend('unsafe'),
    police: start('police'), contact: at('police', 'contact'), law: at('police', 'law'), policeEnd: lend('police'),
    dis: start('disable'), safeW: at('disable', 'safe,'), disableW: at('disable', 'disable'), itself: at('disable', 'itself.'), disEnd: lend('disable'),
    check: start('check'), tracking: at('check', 'Tracking'), unknownC: at('check', 'Unknown'), checkEnd: lend('check'),
    end: start('end'), onE: at('end', 'on?'), yesE: at('end', 'Yes'), noE: at('end', 'no.'), noEnd: wend('end', 'no.')
  };
  (function () {
    place('hk', 'tick', K.hookEnd + .3, .2, K.hookEnd, K.ask);           /* the scope plate is pressed down */
    place('oc', 'pop', K.iphoneEnd + .3, .2, K.iphoneEnd, K.android);    /* OVER TIME re-pressed on the map */
    place('w1', 'pop', K.androidEnd + .3, .2, K.androidEnd, K.borrow);   /* MAY 13, 2024 re-pressed */
    place('ch', 'chirp', K.soundEnd + .3, .2, K.soundEnd, K.dip);        /* the tag in the pocket plays its sound: two dry pips */
    place('dp', 'click', K.dipEnd + .3, .2, K.dipEnd, K.twist);          /* BLUETOOTH OFF? pressed */
    place('tw', 'slap', K.twistEnd + .3, .2, K.twistEnd, K.unsafe);      /* WON'T STOP IT, the hero stamp, re-pressed */
    place('w3', 'tear', K.unsafeE + .25, .2, K.unsafeE, K.go);           /* the wipe to the street */
    place('w4', 'tear', K.policeEnd + .3, .2, K.policeEnd, K.dis);       /* the wipe back to the tag */
    place('ds', 'click', K.disEnd + .3, .2, K.disEnd, K.check);          /* the trail's end cap: it stops */
    place('ck', 'tick', K.checkEnd + .3, .2, K.checkEnd, K.end);         /* the Android row pressed */
  })();
  var TW = .45;
  function gt(n, d) { return GT[n] != null ? GT[n] : d; }
  K.HK = gt('hk', K.hookEnd + .3); K.OC = gt('oc', K.iphoneEnd + .3); K.W1 = gt('w1', K.androidEnd + .3); K.CH = gt('ch', K.soundEnd + .3);
  K.DP = gt('dp', K.dipEnd + .3); K.TW = gt('tw', K.twistEnd + .3); K.W3 = gt('w3', K.unsafeE + .25); K.W4 = gt('w4', K.policeEnd + .3);
  K.DS = gt('ds', K.disEnd + .3); K.CK = gt('ck', K.checkEnd + .3);
  var SC = [
    { id: 'alert', fn: 'alertScene', name: 'The alert: banner, tag, both phones', t0: 0 },
    { id: 'bag', fn: 'bagScene', name: 'A borrowed backpack; Play Sound', t0: K.backpack + .4, tw: .45 },
    { id: 'split', fn: 'splitScene', name: 'Bluetooth off; the trail keeps drawing', t0: Math.max(K.dip + .45, K.CH + .45), tw: .45 },
    { id: 'street', fn: 'streetScene', name: 'A safe public location; law enforcement', t0: K.W3 + .06, tw: .45 },
    { id: 'off', fn: 'offScene', name: 'If it is safe, disable the tracker', t0: K.W4 - .02, tw: .45 },
    { id: 'check', fn: 'checkScene', name: 'Check yours: the two settings paths', t0: Math.max(K.check + .3, K.DS + .45), tw: .45 },
    { id: 'end', fn: 'endScene', name: 'Is yours on?', t0: Math.max(K.end - .05, K.CK + .25), tw: .35 }
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
    if (CAMONLY && name !== 'phone') return;
    if (PUNCHX && (name === 'phone slab' || name === 'board' || name === 'gate posts')) return;
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
  /* =====================================================================================================
     THE PROPS (all cut paper, all drawn by hand): a dim paper street map, a cream paper tracker tag with a coral ring
     (no logo), red-dot trails with dashed lines, re-created alert banners, generic phones (punch-hole, no logo), a paper
     backpack with an outer pocket flap, a paper street with a lit PUBLIC storefront (no figures), settings cards.
     The viewer's taps are touch discs, never a hand.
     ===================================================================================================== */
  var CUR = 'alert';
  var TAGC = '#efe7d4', TAGE = '#d6cbb2', GRAYR = '#8d877c', BLUE = '#3d82dc', BLUE2 = '#2e66b2', SCR = '#ece5d8';
  var MAP0 = '#10161f', MAPB = '#18212d', MAPP = '#162520', MAPW = '#142336', AMBER = '#f0a83a';
  function cyc(ct, hz, ph) { return Math.sin(6.283 * (ct * hz + (ph || 0))); }
  /* a trail's progress from the times its dots pop: k = i + the share of the way to dot i + 1 */
  function kAlong(t, T) {
    if (t < T[0]) return 0;
    for (var i = 0; i < T.length - 1; i++) if (t < T[i + 1]) return i + seg(t, T[i], T[i + 1]);
    return T.length - 1 + clamp((t - T[T.length - 1]) * 4, 0, .3);
  }

  /* ---------- the wallpaper: a dim paper street map (irregular blocks, a park, a river, two avenues), drifting slowly ---------- */
  var BLOCKS = null;
  function mapBg(g, ct, dim) {
    g.fillStyle = MAP0; g.fillRect(-400, -300, W + 800, H + 600);
    if (!BLOCKS) {
      var r = mulberry(211); BLOCKS = [];
      for (var gy = -1; gy < 11; gy++) for (var gx = -1; gx < 7; gx++) BLOCKS.push([gx * 196 + (gy % 2 ? 52 : 0) + r() * 26, gy * 214 + r() * 24, 136 + r() * 40, 150 + r() * 42, r()]);
    }
    g.save(); g.translate(-60 + 4 * ct, -40 + 2.5 * ct);
    BLOCKS.forEach(function (b) { g.fillStyle = b[4] < .1 ? MAPP : MAPB; rr(g, b[0], b[1], b[2], b[3], 14); g.fill(); });
    g.lineCap = 'round';
    g.strokeStyle = MAPW; g.lineWidth = 70; g.beginPath(); g.moveTo(-300, 560); g.bezierCurveTo(300, 420, 560, 900, 1400, 700); g.stroke();
    g.strokeStyle = MAP0; g.lineWidth = 36;
    g.beginPath(); g.moveTo(-300, 1150); g.lineTo(1400, 1620); g.stroke();
    g.beginPath(); g.moveTo(1180, 100); g.lineTo(380, 2200); g.stroke();
    g.restore();
    if (dim) { g.fillStyle = 'rgba(10,14,20,' + dim + ')'; g.fillRect(-400, -300, W + 800, H + 600); }
  }
  /* ---------- the trail: coral dots where it was seen, a dashed cream line in the order it was seen (Apple's map) ---------- */
  function trail(g, P, k, o) {
    o = o || {}; if (k <= 0) return;
    var dead = o.dead || 0, dr = o.dr || 14, n = P.length;
    g.save(); g.globalAlpha *= o.a == null ? 1 : o.a;
    g.strokeStyle = o.line || 'rgba(244,237,224,.82)'; g.lineWidth = o.lw || 7; g.setLineDash(o.dash || [18, 14]); g.lineCap = 'butt';
    g.beginPath(); g.moveTo(P[0][0], P[0][1]);
    for (var i = 1; i < n; i++) {
      if (i <= k) g.lineTo(P[i][0], P[i][1]);
      else { var f = k - (i - 1); if (f > 0) g.lineTo(lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)); break; }
    }
    g.stroke(); g.setLineDash([]);
    for (i = 0; i < n && i <= k + 1e-6; i++) {
      if (o.skipLast && i === n - 1) continue;
      var s = eout(clamp((k - i) * 4 + .25, 0, 1)), dk = clamp(dead * n - (n - 1 - i), 0, 1);
      g.fillStyle = 'rgba(0,0,0,.4)'; el(g, P[i][0] + 3, P[i][1] + 5, dr * s, dr * s);
      g.fillStyle = mixc(hex(HOT), hex(GRAYR), dk); el(g, P[i][0], P[i][1], dr * s, dr * s);
      g.fillStyle = 'rgba(255,240,225,.45)'; el(g, P[i][0] - dr * .25 * s, P[i][1] - dr * .25 * s, dr * .32 * s, dr * .32 * s);
    }
    g.restore();
  }
  /* ---------- the tracker tag: a plain cream paper disc, a key-ring ear, a coral ring (gray when off), no logo ---------- */
  function tagDisc(g, cx, cy, r, o) {
    o = o || {}; var lit = o.lit == null ? 1 : o.lit, rot = o.rot || 0;
    g.fillStyle = 'rgba(0,0,0,.42)'; el(g, cx + .04 * r, cy + .07 * r, r, r);
    var ea = -.85 + rot, er = .2 * r, ex = cx + Math.cos(ea) * r * .95, ey = cy + Math.sin(ea) * r * .95;
    g.fillStyle = TAGE; el(g, ex, ey, er, er);
    g.fillStyle = '#1a212c'; el(g, ex + Math.cos(ea) * er * .34, ey + Math.sin(ea) * er * .34, er * .4, er * .4);
    g.fillStyle = TAGC; el(g, cx, cy, r, r);
    g.beginPath(); g.arc(cx, cy, r, 0, 6.283); grainIn(g, cx - r, cy - r, 2 * r, 2 * r, 6301, .7);
    g.strokeStyle = mixc(hex(GRAYR), hex(HOT), lit); g.lineWidth = .075 * r; g.beginPath(); g.arc(cx, cy, r * .89, 0, 6.283); g.stroke();
    g.strokeStyle = 'rgba(120,104,80,.3)'; g.lineWidth = Math.max(2, .02 * r); g.beginPath(); g.arc(cx, cy, r * .72, 0, 6.283); g.stroke();
    g.save(); g.globalAlpha *= .55; g.strokeStyle = '#fffaf0'; g.lineWidth = .05 * r; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy, r * .58, 3.55, 4.45); g.stroke(); g.restore();
    g.fillStyle = 'rgba(90,80,64,.38)'; for (var i = 0; i < 10; i++) { var a = rot + i * .628; el(g, cx + Math.cos(a) * r * .2, cy + Math.sin(a) * r * .2, r * .03, r * .03); }
    prop(g, o.name || 'tag', cx - r, cy - r, cx + r, cy + r);
    if (o.keys > 0) keyRing(g, ex, ey, ea, r, o.t || 0, o.keys);
  }
  /* a split key ring through the tag's ear, two cut-paper keys hanging from it (they swing a little; frame 0 reads as a tracker on keys) */
  function keyRing(g, ex, ey, ea, r, t, a) {
    var rx = ex + Math.cos(ea) * r * .2, ry = ey + Math.sin(ea) * r * .2, rr0 = r * .13;
    g.save(); g.globalAlpha *= a;
    g.strokeStyle = '#b7b1a6'; g.lineWidth = Math.max(4, r * .028); g.beginPath(); g.arc(rx, ry, rr0, 0, 6.283); g.stroke();
    [[.42, '#c9a650', '#8e7330', 0], [-.08, '#b9bec4', '#7d838b', 1.7]].forEach(function (k) {
      var L = r * .62, ang = k[0] + .07 * Math.sin(t * 2.3 + k[3]) + .03 * Math.sin(t * 5.1 + k[3]);
      g.save(); g.translate(rx, ry + rr0); g.rotate(ang);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.save(); g.translate(5, 7); keyShape(g, L); g.fill(); g.restore();
      g.fillStyle = k[1]; keyShape(g, L); g.fill();
      g.strokeStyle = k[2]; g.lineWidth = 2.5; keyShape(g, L); g.stroke();
      g.fillStyle = '#1a212c'; el(g, 0, L * .17, L * .06, L * .06);
      g.restore();
    });
    g.restore();
  }
  function keyShape(g, L) {
    var bw = L * .19, sw = L * .075;
    g.beginPath(); g.arc(0, L * .19, bw, 0, 6.283);
    g.moveTo(-sw, L * .34); g.lineTo(sw, L * .34); g.lineTo(sw, L * .66); g.lineTo(sw + L * .07, L * .7); g.lineTo(sw + L * .07, L * .76); g.lineTo(sw, L * .78);
    g.lineTo(sw + L * .09, L * .84); g.lineTo(sw + L * .09, L * .9); g.lineTo(sw, L * .93); g.lineTo(0, L); g.lineTo(-sw, L * .96); g.closePath();
  }
  /* the YOU pin: a cream map pin at the trail's newest dot (no word, so frame 0 stays at 4 words) */
  function youPin(g, x, y, t, a) {
    if (a <= 0) return;
    var b = 4 * Math.sin(t * 2.6);
    g.save(); g.globalAlpha *= a; g.translate(x, y - b);
    g.fillStyle = 'rgba(0,0,0,.4)'; el(g, 6, b + 4, 22, 8);
    g.fillStyle = CREAM; g.beginPath(); g.arc(0, -58, 30, Math.PI * .82, Math.PI * 2.18); g.lineTo(0, 0); g.closePath(); g.fill();
    g.fillStyle = INK; el(g, 0, -58, 12, 12);
    g.restore();
  }
  /* the coral pulse rings around a lit tag (drawn on the background layer, so they bleed past the rail; loop-safe in ct) */
  function pulses(g, cx, cy, r, ct, a) {
    if (a <= 0) return;
    g.save(); g.strokeStyle = HOT;
    [0, .5].forEach(function (ph) { var k = frac(ct * .8 + ph); g.globalAlpha = a * .55 * (1 - k); g.lineWidth = Math.max(3, .035 * r) * (1 - .5 * k); g.beginPath(); g.arc(cx, cy, r * (1.05 + .5 * k), 0, 6.283); g.stroke(); });
    g.restore();
  }
  /* ---------- a re-created alert banner: paper card, an icon tile with a small tag in it, a title (or a blank bar) ---------- */
  function banner(g, x0, y0, w, h, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 8, y0 + 11, w, h, 30); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 30); g.fill();
    rr(g, x0, y0, w, h, 30); grainIn(g, x0, y0, w, h, o.seed || 7301, .6);
    prop(g, o.name || 'banner', x0, y0, x0 + w, y0 + h);
    var s = h * .62, ix = x0 + 24, iy = y0 + (h - s) / 2;
    g.fillStyle = '#2a313d'; rr(g, ix, iy, s, s, s * .24); g.fill();
    g.fillStyle = TAGC; el(g, ix + s / 2, iy + s / 2, s * .3, s * .3);
    g.strokeStyle = HOT; g.lineWidth = s * .05; g.beginPath(); g.arc(ix + s / 2, iy + s / 2, s * .27, 0, 6.283); g.stroke();
    var tx = ix + s + 24, tw = x0 + w - 28 - tx;
    var n = o.title ? Math.round(o.title.length * clamp(o.k == null ? 1 : o.k, 0, 1)) : 0, typing = n > 0 && n < (o.title ? o.title.length : 0), nr = NOREC; NOREC = nr || typing;
    if (n > 0) onprop(function () { txt(g, o.title.slice(0, n), tx, y0 + h * .37, o.px || 44, INK, 'left', 900, DISP, tw, 1, 36, 'condensed'); });
    else bell(g, tx + h * .3, y0 + h * .5, h * .27, o.t || 0);
    NOREC = nr;
    if (n > 0) { g.fillStyle = 'rgba(33,29,38,.13)'; rr(g, tx, y0 + h * .68 - 10, tw * (o.tagText ? .38 : .84), 20, 10); g.fill(); }
    if (o.tagText && (o.tagA == null || o.tagA > 0)) onprop(function () {
      font(g, 28, 700, MONO); var tw2 = g.measureText(o.tagText).width + 30; tag(g, o.tagText, x0 + w - 26 - tw2 / 2, y0 + h * .68, o.tagA == null ? 1 : o.tagA, 0, 360, INK, PAPER, 28);
      if (o.tag2) { font(g, 34, 900, DISP, 'condensed'); var tw3 = g.measureText(o.tag2).width + 26; chip(g, o.tag2, x0 + w - 26 - tw2 - 16 - tw3 / 2, y0 + h * .68, { px: 34, wt: 900, st: 'condensed', bg: INK, fg: CREAM, r: 10, shadow: false, pad: 13, a: o.tagA == null ? 1 : o.tagA }); }
    });
    g.fillStyle = 'rgba(33,29,38,.13)'; rr(g, x0 + w - 86, y0 + 22, 56, 14, 7); g.fill();
    g.restore();
  }
  /* a paper bell that rings (two short strike lines either side), the banner's live-alert glyph */
  function bell(g, x, y, s, t) {
    var sw = .22 * Math.sin(t * 9) * (.6 + .4 * Math.sin(t * 1.3));
    g.save(); g.translate(x, y - s * .9); g.rotate(sw); g.translate(0, s * .9);
    g.fillStyle = INK; g.beginPath(); g.moveTo(-s * .8, s * .55); g.quadraticCurveTo(-s * .62, s * .38, -s * .62, -s * .05); g.quadraticCurveTo(-s * .6, -s * .78, 0, -s * .8);
    g.quadraticCurveTo(s * .6, -s * .78, s * .62, -s * .05); g.quadraticCurveTo(s * .62, s * .38, s * .8, s * .55); g.closePath(); g.fill();
    el(g, 0, -s * .86, s * .13, s * .13); el(g, -sw * s * .5, s * .72, s * .17, s * .17);
    g.restore();
    var k = .5 + .5 * Math.sin(t * 9);
    g.save(); g.strokeStyle = INK; g.lineWidth = Math.max(3, s * .1); g.lineCap = 'round'; g.globalAlpha *= .35 + .65 * k;
    [-1, 1].forEach(function (d) { g.beginPath(); g.moveTo(x + d * s * 1.05, y - s * .45); g.lineTo(x + d * s * 1.35, y - s * .7); g.stroke(); g.beginPath(); g.moveTo(x + d * s * 1.1, y - s * .05); g.lineTo(x + d * s * 1.45, y - s * .08); g.stroke(); });
    g.restore();
  }
  /* ---------- a generic phone: dark body, punch-hole camera, no notch, no logo; returns the screen box ---------- */
  function phoneBody(g, x0, y0, w, h, scr, name) {
    var rad = w * .13;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 10, y0 + 14, w, h, rad); g.fill();
    g.fillStyle = '#2a313d'; rr(g, x0, y0, w, h, rad); g.fill();
    rr(g, x0, y0, w, h, rad); grainIn(g, x0, y0, w, h, 7401, .8);
    g.strokeStyle = 'rgba(244,237,224,.35)'; g.lineWidth = 3; rr(g, x0, y0, w, h, rad); g.stroke();
    prop(g, name || 'phone', x0, y0, x0 + w, y0 + h);
    var m = Math.max(10, w * .035), S = { x: x0 + m, y: y0 + m, w: w - 2 * m, h: h - 2 * m };
    g.fillStyle = scr || SCR; rr(g, S.x, S.y, S.w, S.h, rad - m * .6); g.fill();
    g.fillStyle = '#10151c'; el(g, x0 + w / 2, S.y + Math.max(14, w * .045), Math.max(6, w * .022), Math.max(6, w * .022));
    return S;
  }
  /* ---------- the viewer's tap: a cream touch disc that presses at t0 and throws one ring ---------- */
  function touch(g, x, y, t, t0, out) {
    var a = seg(t, t0 - .3, t0 - .12) * (1 - seg(t, out, out + .15)); if (a <= 0) return;
    var pr = Math.sin(Math.PI * seg(t, t0 - .04, t0 + .16)), k = seg(t, t0, t0 + .45);
    g.save(); g.globalAlpha *= a;
    if (k > 0 && k < 1) { g.strokeStyle = CREAM; g.lineWidth = 5; g.globalAlpha *= (1 - k); g.beginPath(); g.arc(x, y, 30 + 60 * k, 0, 6.283); g.stroke(); g.globalAlpha /= Math.max(.001, 1 - k); }
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, x + 4, y + 7, 30 * (1 - .18 * pr), 30 * (1 - .18 * pr));
    g.fillStyle = 'rgba(244,237,224,.86)'; el(g, x, y, 30 * (1 - .18 * pr), 30 * (1 - .18 * pr));
    g.restore();
  }
  /* ---------- a paper tag on a string (from ../wifibattery) ---------- */
  function paperTag(g, lines, x, y, a, rot, px, name) {
    if (a <= 0) return;
    px = px || 38; var L = typeof lines === 'string' ? [lines] : lines;
    font(g, px, 900, DISP, 'condensed'); var w = 0; L.forEach(function (s) { w = Math.max(w, g.measureText(s).width); }); w += px * .9 + 26; var h = L.length * px * 1.08 + px * .5;
    var ex = EXITING; if (a < 1) EXITING = true;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 6, -h / 2 + 8, w, h, 10); g.fill();
    g.fillStyle = PAPER; rr(g, -w / 2, -h / 2, w, h, 10); g.fill();
    rr(g, -w / 2, -h / 2, w, h, 10); grainIn(g, -w / 2, -h / 2, w, h, strHash(L[0]) & 4095, .6);
    g.fillStyle = '#5d564c'; el(g, -w / 2 + 16, 0, 6, 6);
    prop(g, name || 'paper tag', -w / 2, -h / 2, w / 2, h / 2);
    onprop(function () { L.forEach(function (s, i) { txt(g, s, 13 + px * .2, (i - (L.length - 1) / 2) * px * 1.08 + 1, px, INK, 'center', 900, DISP, 0, 1, 30, 'condensed'); }); });
    g.restore(); EXITING = ex;
    return w;
  }
  /* ---------- the search bar: AIRTAG FOUND MOVING WITH YOU, typed in ---------- */
  function searchBar(g, x, y, t, t0, out) {
    var sa = seg(t, t0, t0 + .12) * (1 - out);
    if (sa <= 0 || !LIVE.text) return;
    var w = 800, h = 84, x0 = x - w / 2, y0 = y - h / 2, eo = eio(out);
    g.save(); g.globalAlpha *= sa; g.translate(-120 * eo, 0);
    var ex = EXITING; if (sa < 1 || eo > 0) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 8, y0 + 10, w, h, 46); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 46); g.fill();
    prop(g, 'search bar', x0, y0, x0 + w, y0 + h);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x0 + 48, y - 6, 15, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x0 + 59, y + 5); g.lineTo(x0 + 72, y + 18); g.stroke();
    var L = 'AIRTAG FOUND MOVING WITH YOU', k = seg(t, t0 + .04, t0 + .5), n = Math.round(L.length * k), typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
    onprop(function () { if (n) txt(g, L.slice(0, n), x0 + 88, y + 3, 46, INK, 'left', 900, DISP, w - 112, 1, 40, 'condensed'); });
    NOREC = nr; EXITING = ex; g.restore();
  }
  /* a peel: the card lifts, tilts and slides off to the left (never just fades) */
  function peelT(g, x0, y1, eo) { g.translate(x0, y1); g.rotate(-.08 * eo); g.translate(-x0, -y1); g.translate(-70 * eo, 50 * eo); g.globalAlpha *= 1 - eo; }

  /* =====================================================================================================
     THE ALERT (0 → borrow): frame 0 is the banner sliding down into place (blank bars, RE-CREATED), TRACKER WITH YOU?
     under it and the 704 px tag with coral pulse rings; on "trackers" the tag eases back and the scope plate lands;
     the search bar; on "AirTag" Apple's alert name prints and the map opens; on "Android" the second banner drops in.
     ===================================================================================================== */
  var BX = 110, BW = 800, BH = 130, BY = 470;
  function f0(ct) { var k = eout(seg(ct, 0, .5)), k2 = eout(seg(ct, 0, .7)); return { by: lerp(322, BY, k), brot: lerp(-.03, 0, k), cy: lerp(1076, 1050, k2), r: 352, rot: lerp(.3, 0, k2) }; }
  var MAPC = { x0: 140, y0: 704, x1: 880, y1: 1216 };
  var MAPTRAIL = [[236, 1140], [330, 960], [478, 1046], [584, 846], [742, 1076]];
  function tagPose(t) {
    var p = f0(t), ktr = eio(seg(t, K.trackers - .05, K.trackers + .4)), kair = eio(seg(t, K.airtag - .1, K.airtag + .4)), kand = eio(seg(t, K.andW - .15, K.andW + .35));
    var x = 510, y = lerp(p.cy, 968, ktr), r = lerp(352, 236, ktr), rot = p.rot + .4 * ktr + .3 * kair - .3 * kand;
    x = lerp(x, MAPTRAIL[4][0], kair); y = lerp(y, MAPTRAIL[4][1], kair); r = lerp(r, 50, kair);
    x = lerp(x, 712, kand); y = lerp(y, 1186, kand); r = lerp(r, 190, kand);
    return { x: x, y: y, r: r, rot: rot, moving: (t < .7) || (ktr > 0 && ktr < 1) || (kair > 0 && kair < 1) || (kand > 0 && kand < 1) };
  }
  var PIN = { x: 196, y: 820 };
  function hookTrail(tp) { return [[40, 1470], [150, 1320], [118, 1160], [236, 1000], [PIN.x, PIN.y]]; }
  function bannerHead(g, t, by, brot, tagText, aTag, title, k) {
    g.save(); g.translate(BX + BW / 2, by + BH / 2); g.rotate(brot); g.translate(-(BX + BW / 2), -(by + BH / 2));
    banner(g, BX, by, BW, BH, { title: title, k: k, name: 'iphone banner', tagText: tagText, tagA: aTag, t: t });
    g.restore();
  }
  function alertScene(g, t) {
    var p = f0(t), tp = tagPose(t);
    var kmap = seg(t, K.airtag - .24, K.airtag - .02), mout = eio(seg(t, K.andW - .2, K.andW + .04));
    if (LAYER === 'over') return;
    if (LAYER === 'bg') {
      mapBg(g, t, 0);
      trail(g, hookTrail(tp), 7, { a: 1 - .7 * seg(t, K.airtag - .1, K.airtag + .2), skipLast: true });
      pulses(g, tp.x, tp.y, tp.r, t, 1 - seg(t, K.airtag - .1, K.airtag + .1) * (1 - seg(t, K.andW + .1, K.andW + .35)));
      return;
    }
    var exw = EXITING;
    /* the map, Apple's own description: red dots where it was detected, a dashed line in order, OVER TIME */
    if (kmap > 0 && mout < 1) {
      var exm = EXITING; if (kmap < 1 || mout > 0) EXITING = true;
      g.save(); peelT(g, MAPC.x0, MAPC.y1, mout);
      var mk0 = eout(kmap); g.translate(0, MAPC.y0); g.scale(1, mk0); g.translate(0, -MAPC.y0);
      var mz = 1 + .04 * eio(seg(t, K.airtag + .1, K.andW - .2)); g.translate(510, 980); g.scale(mz, mz); g.translate(-510, -980);  /* a slow push while the map holds */
      mapCard(g, t);
      g.restore(); EXITING = exm;
    }
    /* the Android banner drops out from under the iPhone one */
    var kd = eout(seg(t, K.andW - .32, K.andW + .02));
    if (kd > 0) {
      var ay = lerp(BY, BY + BH + 22, kd), exa = EXITING; if (kd < 1) EXITING = true;
      banner(g, BX, ay, BW, BH, { name: 'android banner', seed: 7311, tagText: 'RE-CREATED', tagA: seg(kd, .7, 1), tag2: 'ANDROID', title: 'Unknown tracker alert', k: 1, t: t });
      EXITING = exa;
    }
    /* the iPhone banner: frame 0's glide, then Apple's alert name on "AirTag" */
    var exb = EXITING; if (t < .5) EXITING = true;
    var iTag = seg(t, K.iph, K.iph + .12);
    bannerHead(g, t, p.by, p.brot, iTag > 0 ? 'iPHONE · RE-CREATED' : 'RE-CREATED', 1, 'AirTag Found Moving With You', seg(t, K.airtag, K.airtag + .38));
    EXITING = exb;
    /* frame 0's words: TRACKER WITH YOU?, peeled on "So" */
    var hout = eio(seg(t, K.airtag - .3, K.airtag - .08));
    if (hout < 1) { var exh = EXITING; if (hout > 0) EXITING = true; g.save(); peelT(g, 110, 690, hout); txt(g, 'TRACKER WITH YOU?', 510, 642, 84, CREAM, 'center', 900, DISP, 800, 1, 60, 'condensed'); g.restore(); EXITING = exh; }
    /* the YOU pin at the trail's newest dot, until the map opens */
    youPin(g, PIN.x, PIN.y, t, 1 - seg(t, K.airtag - .3, K.airtag - .1));
    /* the tag (on top of the map, it sits on the trail's last dot) */
    var ext = EXITING; if (tp.moving) EXITING = true;
    tagDisc(g, tp.x, tp.y, tp.r, { rot: tp.rot, lit: 1, keys: 1 - seg(t, K.airtag - .3, K.airtag - .12), t: t });
    EXITING = ext;
    /* the scope, from "trackers" to "AirTag" (truth rule 1) */
    var sin = seg(t, K.trackers + .2, K.trackers + .28), sout = seg(t, K.airtag + .42, K.airtag + .62);
    if (sin > 0 && sout < 1) {
      var press = .03 * Math.sin(Math.PI * seg(t, K.HK - .02, K.HK + .16)), exs = EXITING; if (sin < 1 || sout > 0) EXITING = true;
      g.save(); peelT(g, 104, 1400, eio(sout)); g.translate(510, 1330); g.scale(lerp(1.25, 1, eout(sin)) + press, lerp(1.25, 1, eout(sin)) + press); g.translate(-510, -1330);
      scopePlate(g, 1330); g.restore(); EXITING = exs;
    }
    /* Apple's credit and the other alert names under the map */
    /* android: the shared spec's date beside the tag, on "Android"; the pop after "alert." re-presses it */
    if (t >= K.andW + .03) {
      var dp2 = .05 * Math.sin(Math.PI * seg(t, K.W1 - .02, K.W1 + .16));
      g.save(); g.translate(300, 1000); g.scale(1 + dp2, 1 + dp2); g.translate(-300, -1000);
      slapCard(g, 'MAY 13, 2024', 300, 1000, t, K.andW + .04, 60, 400); g.restore();
      var da = seg(t, K.andW + .03, K.andW + .08);
      txt(g, 'APPLE + GOOGLE:', 300, 1080, 46, CREAM, 'center', 900, DISP, 400, da, 36, 'condensed');
      txt(g, 'ONE SPEC FOR', 300, 1132, 42, CREAM, 'center', 900, DISP, 400, da, 36, 'condensed');
      txt(g, 'BOTH PHONES', 300, 1180, 46, CREAM, 'center', 900, DISP, 400, da, 36, 'condensed');
      txt(g, 'APPLE NEWSROOM', 300, 1236, 32, '#b9b1a3', 'center', 800, DISP, 400, da, 30, 'condensed');
    }
    EXITING = exw;
  }
  function scopePlate(g, cy) {
    var w = 812, h = 132, x0 = 104, y0 = cy - h / 2;
    sheet(g, x0, y0, x0 + w, y0 + h, 3521, CREAM, 'scope plate');
    onprop(function () {
      txt(g, 'COMPATIBLE TRACKERS', 510, y0 + 42, 54, INK, 'center', 900, DISP, w - 40, 1, 44, 'condensed');
      txt(g, 'SEEN MOVING WITH YOU OVER TIME · APPLE', 510, y0 + 98, 38, '#4b4540', 'center', 900, DISP, w - 40, 1, 36, 'condensed');
    });
  }
  function mapCard(g, t) {
    var x0 = MAPC.x0, y0 = MAPC.y0, w = MAPC.x1 - MAPC.x0, h = MAPC.y1 - MAPC.y0;
    sheet(g, x0, y0, x0 + w, y0 + h, 3531, '#e4dccb', 'map card');
    g.save(); rr(g, x0, y0, w, h, 4); g.clip();
    /* paper streets: pale blocks, ink-gray roads */
    var r = mulberry(3533);
    g.fillStyle = '#d3cab6';
    for (var i = 0; i < 6; i++) for (var j = 0; j < 4; j++) { rr(g, x0 + 18 + i * 124 + r() * 10, y0 + 22 + j * 140 + r() * 10, 100, 112, 10); g.fill(); }
    g.strokeStyle = '#bdb39c'; g.lineWidth = 26; g.beginPath(); g.moveTo(x0 - 20, y0 + 380); g.lineTo(x0 + w + 20, y0 + 220); g.stroke();
    g.restore();
    var T = [K.airtag + .3, K.found, K.moving, K.withW, K.you];
    trail(g, MAPTRAIL, kAlong(t, T), { line: 'rgba(33,29,38,.75)', dr: 17, lw: 7, skipLast: true });
    /* the tag on the map keeps pinging while the card holds (the map is live, not a still) */
    g.save(); rr(g, x0, y0, w, h, 4); g.clip(); pulses(g, MAPTRAIL[4][0], MAPTRAIL[4][1], 74, t, seg(t, K.airtag + .2, K.airtag + .5)); g.restore();
    /* OVER TIME on the dashed line (on "You"), re-pressed by the pop after the line */
    if (t >= K.airtag - .14) onprop(function () {
      var pk = .05 * Math.sin(Math.PI * seg(t, K.OC - .02, K.OC + .16));
      g.save(); g.translate(420, 930); g.scale(1 + pk, 1 + pk); g.translate(-420, -930);
      slapCard(g, 'OVER TIME', 420, 930, t, K.airtag - .1, 50, 300); g.restore();
    });
    onprop(function () { tag(g, 'RE-CREATED', x0 + w - 110, y0 + 36, 1, 0, 280, INK, '#e4dccb', 30); txt(g, 'APPLE SUPPORT', x0 + w - 30, y0 + h - 30, 34, '#5d564c', 'right', 800, DISP, 400, 1, 30, 'condensed'); });
  }

  /* =====================================================================================================
     THE BACKPACK (borrow, sound): a calm push into a paper backpack; the outer pocket flap lifts and shows the tag;
     three paper tags for the innocent cases; a small phone with Play Sound; drawn sound arcs from the pocket.
     ===================================================================================================== */
  var BAG = '#c98a3c', BAG2 = '#a96f2e', BAG3 = '#b77d36', STRAP = '#7d4f22', UNDERF = '#e0ad66';
  function backpack(g, cx, cy, s, flap, t, ring) {
    g.save(); g.translate(cx, cy); g.scale(s, s);
    var r = mulberry(8101);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -214, -264, 452, 560, [160, 160, 46, 46]); g.fill();
    g.strokeStyle = STRAP; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.arc(0, -282, 64, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.fillStyle = STRAP; rr(g, -252, -170, 44, 360, 20); g.fill(); rr(g, 208, -170, 44, 360, 20); g.fill();
    g.fillStyle = BAG; g.beginPath(); g.roundRect(-226, -282, 452, 560, [170, 170, 46, 46]); g.fill();
    g.beginPath(); g.roundRect(-226, -282, 452, 560, [170, 170, 46, 46]); grainIn(g, -226, -282, 452, 560, 8102, .9);
    g.strokeStyle = '#8f5d27'; g.lineWidth = 6; g.setLineDash([14, 10]); g.beginPath(); g.arc(0, -96, 180, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#e8dcc2'; rr(g, 150, -236, 22, 40, 8); g.fill();
    prop(g, 'backpack', -252, -346, 252, 278);
    /* the outer pocket: a dark opening, the tag peeking out, the pocket front */
    var px0 = -172, py0 = 22, pw = 344, ph = 226;
    g.fillStyle = '#3a2716'; rr(g, px0 + 14, py0 - 8, pw - 28, 46, 18); g.fill();
    var ty = py0 + 34 - 96 * eout(flap), tr = 78;
    /* the flap: hinged at its top edge; lifted, it shows its lighter underside (behind the tag) */
    var th = flap * 2.3, fh = 118 * Math.cos(th), fy = py0 - 30;
    if (fh < 0) { g.fillStyle = UNDERF; rr(g, px0 - 8, fy + fh, pw + 16, -fh, 34); g.fill(); g.fillStyle = 'rgba(120,80,30,.35)'; g.fillRect(px0 + 10, fy - 4, pw - 20, 6); }
    if (flap > 0) {
      g.save(); g.beginPath(); g.rect(px0 - 120, py0 - 400, pw + 240, 400 + 24); g.clip();
      if (ring > 0) arcs(g, 0, ty, tr, t, ring);
      tagDisc(g, 0, ty, tr, { rot: .3, lit: 1, name: 'pocket tag' });
      g.restore();
    }
    g.fillStyle = BAG3; rr(g, px0, py0, pw, ph, 44); g.fill();
    rr(g, px0, py0, pw, ph, 44); grainIn(g, px0, py0, pw, ph, 8103, .8);
    g.strokeStyle = '#8f5d27'; g.lineWidth = 5; g.setLineDash([12, 9]); rr(g, px0 + 14, py0 + 14, pw - 28, ph - 28, 34); g.stroke(); g.setLineDash([]);
    if (fh >= 0) { g.fillStyle = BAG2; rr(g, px0 - 8, fy, pw + 16, Math.max(2, fh), 34); g.fill(); if (fh > 40) { g.fillStyle = '#e8dcc2'; rr(g, -24, fy + fh - 34, 48, 26, 8); g.fill(); } }
    g.restore();
  }
  /* drawn sound arcs: three on each side of the tag, rippling out (loop-safe not needed: mid-film) */
  function arcs(g, x, y, r, t, a) {
    g.save(); g.strokeStyle = '#3a2716'; g.lineCap = 'round';
    for (var i = 0; i < 3; i++) {
      var k = frac(t * 1.6 + i / 3), rad = r * (1.2 + .8 * k);
      g.globalAlpha = a * (1 - .8 * k); g.lineWidth = 11 * (1 - .4 * k);
      g.beginPath(); g.arc(x, y, rad, -Math.PI * .25, Math.PI * .25); g.stroke();
      g.beginPath(); g.arc(x, y, rad, Math.PI * .75, Math.PI * 1.25); g.stroke();
    }
    g.restore();
  }
  function bagScene(g, t) {
    var E0 = S('bag').t0;
    var push = 1 + .05 * sio(seg(t, E0, K.tap)), side = eio(seg(t, K.tap - .4, K.tap + .05));
    var cx = lerp(510, 652, side), cy = lerp(920, 900, side), s = push * lerp(1, .78, side);
    var flap = eio(seg(t, K.backpack + .3, K.backpack + .7)), ring = seg(t, K.soundW - .1, K.soundW + .2);
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { mapBg(g, t, .25); trail(g, [[-40, 1300], [120, 1180], [96, 980], [230, 820], [cx, cy + 40 * s]], 5, { a: .7, skipLast: true }); return; }
    var ex = EXITING; if (t < E0 + .05 || (side > 0 && side < 1)) EXITING = true;
    backpack(g, cx, cy, s, flap, t, ring);
    EXITING = ex;
    /* the innocent cases, on "borrowed" */
    var tout = 0;
    if (tout < 1) {
      var ext2 = EXITING; if (tout > 0) EXITING = true;
      g.save(); peelT(g, 104, 1420, tout);
      [['A BORROWED BAG?', 290, 1262, -.03, 0], ['KEYS?', 650, 1262, .04, .04], ['A FRIEND’S AIRPODS?', 430, 1352, .02, .08]].forEach(function (q) {
        var k = eout(seg(t, K.borrowed - .05 + q[4], K.borrowed + .15 + q[4])), sw = .04 * decay(t, K.borrowed + q[4], 9, 3.5);
        if (k > 0) paperTag(g, q[0], q[1], q[2] - 30 * (1 - k), k, q[3] + sw, 40, 'case tag');
      });
      /* each maker's own wording: Google names keys and a backpack, Apple names AirPods */
      txt(g, 'GOOGLE', 760, 1264, 36, CREAM, 'left', 900, DISP, 200, seg(t, K.borrowed - .01, K.borrowed + .05), 32, 'condensed');
      txt(g, 'APPLE', 690, 1354, 36, CREAM, 'left', 900, DISP, 200, seg(t, K.borrowed + .07, K.borrowed + .13), 32, 'condensed');
      g.restore();
      EXITING = ext2;
    }
    /* sound: a small generic phone, the banner tapped, then Play Sound */
    var pin = eout(seg(t, K.tap - .45, K.tap - .1));
    if (pin > 0) {
      var exp = EXITING; if (pin < 1) EXITING = true;
      g.save(); g.translate(-360 * (1 - pin), 0);
      var P = phoneBody(g, 104, 560, 320, 560, SCR, 'small phone');
      var page = seg(t, K.tap + .05, K.tap + .18);
      if (page < 1) { g.save(); g.globalAlpha *= 1 - page; banner(g, P.x + 12, P.y + 70, P.w - 24, 92, { name: 'small banner', seed: 7321 }); g.restore(); }
      if (page > 0) {
        g.save(); g.globalAlpha *= page;
        tagDisc(g, P.x + P.w / 2, P.y + 150, 58, { rot: .2, lit: 1, name: 'screen tag' });
        g.fillStyle = 'rgba(33,29,38,.16)'; rr(g, P.x + 40, P.y + 238, P.w - 80, 18, 9); g.fill(); rr(g, P.x + 64, P.y + 270, P.w - 128, 16, 8); g.fill();
        var bf = eout(seg(t, K.play, K.play + .15)), bx0 = P.x + 22, by0 = P.y + 318, bw = P.w - 44, bh = 84;
        g.fillStyle = mixc(hex('#d9d1c1'), hex(BLUE), bf); rr(g, bx0, by0, bw, bh, 42); g.fill();
        prop(g, 'play button', bx0, by0, bx0 + bw, by0 + bh);
        onprop(function () { txt(g, 'Play Sound', bx0 + bw / 2 - 14, by0 + bh / 2 + 2, 40, bf > .5 ? CREAM : INK, 'center', 900, DISP, bw - 30, 1, 36, 'condensed'); });
        g.restore();
      }
      onprop(function () { tag(g, 'iPHONE', P.x + P.w / 2, P.y + P.h - 90, 1, 0, 240, INK, SCR, 30); tag(g, 'RE-CREATED', P.x + P.w / 2, P.y + P.h - 40, 1, 0, 240, INK, SCR, 30); });
      g.restore(); EXITING = exp;
      /* Apple's steps, word for word: Tap Continue, then Play Sound */
      var sa = seg(t, K.tap - .32, K.tap - .24);
      txt(g, 'TAP CONTINUE ›', 104, 462, 42, CREAM, 'left', 900, DISP, 400, sa, 36, 'condensed');
      txt(g, 'PLAY SOUND · APPLE', 104, 514, 42, CREAM, 'left', 900, DISP, 400, sa, 36, 'condensed');
      touch(g, 104 + 280, 560 + 11 + 70 + 46, t, K.tap, K.tap + .3);
      touch(g, 104 + 300, 560 + 11 + 318 + 42, t, K.play, K.play + .45);
    }
    /* Google's line, on the bag side (no maker's prop under it) */
  }

  /* =====================================================================================================
     THE SPLIT (dip, twist): a phone with a big re-created Bluetooth switch, the tag, the trail between them. The
     switch flips off on "off" and the tag goes quiet; on "say" the trail starts drawing again, past the dead switch,
     to a nameless OWNER'S MAP card. WON'T STOP IT on "won't", APPLE + GOOGLE, both makers' words. The DM frame.
     ===================================================================================================== */
  var SPT = { x: 760, y: 556, r: 140 }, OWN = { x0: 520, y0: 736, w: 396, h: 206 };
  var NEWTRAIL = [[SPT.x, SPT.y], [604, 632], [486, 700], [566, 800], [718, 830]];
  function ownerMap(g, x0, y0, w, h, t) {
    sheet(g, x0, y0, x0 + w, y0 + h, 3701, '#e4dccb', 'owner map');
    g.save(); rr(g, x0, y0, w, h, 4); g.clip();
    var cw = (w - 28) / 5;
    g.fillStyle = '#d3cab6'; for (var i = 0; i < 5; i++) { rr(g, x0 + 14 + i * cw, y0 + 14, cw - 12, 62, 8); g.fill(); rr(g, x0 + 14 + i * cw, y0 + 88, cw - 12, 44, 8); g.fill(); }
    g.strokeStyle = '#bdb39c'; g.lineWidth = 16; g.beginPath(); g.moveTo(x0 - 10, y0 + 150); g.lineTo(x0 + w + 10, y0 + 70); g.stroke();
    g.restore();
    onprop(function () { txt(g, 'OWNER’S MAP', x0 + w / 2, y0 + h - 32, 44, INK, 'center', 900, DISP, w - 30, 1, 36, 'condensed'); });
  }
  function btPhone(g, t, off, press) {
    var P = phoneBody(g, 104, 420, 340, 520, SCR, 'bt phone');
    onprop(function () { txt(g, 'Bluetooth', P.x + 30, P.y + 96, 54, INK, 'left', 900, DISP, P.w - 60, 1, 40, 'condensed'); });
    g.fillStyle = 'rgba(33,29,38,.14)'; rr(g, P.x + 30, P.y + 140, P.w - 90, 16, 8); g.fill();
    var sw = 196, sh = 108, sx = P.x + (P.w - sw) / 2, sy = P.y + 210, ps = 1 - .04 * press;
    g.save(); g.translate(sx + sw / 2, sy + sh / 2); g.scale(ps, ps); g.translate(-(sx + sw / 2), -(sy + sh / 2));
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, sx + 4, sy + 7, sw, sh, sh / 2); g.fill();
    g.fillStyle = mixc(hex(BLUE), hex('#b9b2a4'), off); rr(g, sx, sy, sw, sh, sh / 2); g.fill();
    var kx = lerp(sx + sw - sh / 2, sx + sh / 2, off);
    g.fillStyle = '#fbf7ee'; el(g, kx, sy + sh / 2, sh * .42, sh * .42);
    prop(g, 'bt switch', sx, sy, sx + sw, sy + sh);
    g.restore();
    g.fillStyle = 'rgba(33,29,38,.12)'; [0, 1].forEach(function (i) { rr(g, P.x + 30, P.y + 350 + i * 40, P.w - 60 - i * 70, 16, 8); g.fill(); });
    onprop(function () { tag(g, 'RE-CREATED', P.x + P.w / 2, P.y + P.h - 40, 1, 0, 240, INK, SCR, 30); });
    return { x: sx + sw - sh / 2, y: sy + sh / 2 };
  }
  function splitScene(g, t) {
    var E0 = S('split').t0;
    var off = eout(seg(t, K.off, K.off + .14)), press = Math.sin(Math.PI * seg(t, K.off - .06, K.off + .16));
    /* the lie: on the click the ring and the trail go quiet (35 %); on "won't" they relight hard */
    var quiet = seg(t, K.DP - .02, K.DP + .12) * (1 - seg(t, K.wont - .08, K.wont));
    var flash = Math.exp(-Math.max(0, t - K.wont + .08) * 5) * seg(t, K.wont - .08, K.wont - .04);
    var nk = kAlong(t, [K.wont - .06, K.wont + .1, K.wont + .26, K.wont + .42, K.wont + .58]);
    if (LAYER === 'over') return;
    if (LAYER === 'bg') {
      mapBg(g, t, .22);
      trail(g, [[-60, 1160], [120, 1060], [70, 860], [250, 700], [470, 520], [SPT.x, SPT.y]], 6, { a: .85 * (1 - .65 * quiet), skipLast: true });
      pulses(g, SPT.x, SPT.y, SPT.r, t, (1 - quiet) * (1 + 1.2 * flash));
      return;
    }
    var ex = EXITING; if (t < E0 + .05) EXITING = true;
    var tip = btPhone(g, t, off, press);
    tagDisc(g, SPT.x, SPT.y, SPT.r * (1 + .08 * flash), { rot: .2 + .3 * Math.sin(t * .7), lit: 1 - .65 * quiet });
    EXITING = ex;
    touch(g, tip.x, tip.y, t, K.off, K.off + .35);
    /* the trail keeps drawing, past the dead switch, into the owner's map */
    var oa = seg(t, K.wont - .1, K.wont + .1);
    if (oa > 0) { var exo = EXITING; if (oa < 1) EXITING = true; g.save(); g.globalAlpha *= oa; g.translate(0, 30 * (1 - oa)); ownerMap(g, OWN.x0, OWN.y0, OWN.w, OWN.h, t); g.restore(); EXITING = exo; }
    if (nk > 0) trail(g, NEWTRAIL, nk, { dr: 16, skipLast: false });
    if (nk >= 1) pulses(g, NEWTRAIL[4][0], NEWTRAIL[4][1], 40, t, 1);
    /* BLUETOOTH OFF? (on "move?", re-pressed by the click), peeled as the stamp lands in its place */
    var bo = eio(seg(t, K.wont - .16, K.wont - .06));
    if (t >= K.move - .08 && bo < 1) {
      var bp = .04 * Math.sin(Math.PI * seg(t, K.DP - .02, K.DP + .16)), exq = EXITING; if (bo > 0) EXITING = true;
      g.save(); peelT(g, 140, 1200, bo); g.translate(510, 1150); g.scale(1 + bp, 1 + bp); g.translate(-510, -1150);
      slapCard(g, 'BLUETOOTH OFF?', 510, 1150, t, K.move, 84, 780); g.restore(); EXITING = exq;
    }
    /* who says so, on their own words */
    var mo = eio(seg(t, K.unsafe - .12, K.unsafe + .1));
    if (mo < 1) {
      var exm = EXITING; if (mo > 0) EXITING = true; g.save(); peelT(g, 140, 1420, mo);
      slapCard(g, 'APPLE', 380, 1392, t, K.twist + .02, 44, 300);
      slapCard(g, 'GOOGLE', 640, 1392, t, K.google + .02, 44, 300);
      g.restore(); EXITING = exm;
    }
    /* the hero: WON'T / STOP IT inks on "won't"; the slap in the pause punches it 1.00 → 1.10; peeled as "Feel unsafe?" starts */
    var sOut = eio(seg(t, K.unsafe - .1, K.unsafe + .12));
    if (t >= K.wont - .08 && sOut < 1) {
      var pul = 1 + .1 * eout(seg(t, K.TW - .02, K.TW + .12)) - .025 * Math.sin(Math.PI * seg(t, K.TW - .02, K.TW + .1)), exs = EXITING; if (sOut > 0) EXITING = true;
      g.save(); peelT(g, 160, 1330, sOut); g.translate(510, 1144); g.scale(pul, pul); onprop(function () { stamp(g, 'WON’T\nSTOP IT', 0, 0, t, K.wont - .08, 156, HOT, -.05); }); g.restore(); EXITING = exs;
    }
  }
  function twinPlate(g, t, inn, out) {
    var x0 = 104, y0 = 1074, w = 812, h = 346, ei = eout(inn), eo = eio(out), ex = EXITING;
    g.save();
    if (ei < 1) { g.translate(110 * (1 - ei), 0); g.globalAlpha *= seg(ei, 0, .7); EXITING = true; }
    if (eo > 0) { EXITING = true; peelT(g, x0, y0 + h, eo); }
    sheet(g, x0, y0, x0 + w, y0 + h, 3801, PAPER, 'twin plate');
    var aA = seg(t, K.twist - .1, K.twist), aG = aA;
    onprop(function () {
      txt(g, 'APPLE + GOOGLE', x0 + 28, y0 + 44, 54, INK, 'left', 900, DISP, w - 56, 1, 48, 'condensed');
      [['“…TURNING OFF BLUETOOTH… DOES NOT', 'PREVENT THE OWNER… FROM BEING ABLE', 'TO SEE THE LOCATION…” · APPLE', aA, 0],
       ['“YOU CAN’T STOP A TRACKER’S ABILITY', 'TO SHARE ITS LOCATION WHEN YOU…', 'TURN OFF BLUETOOTH…” · GOOGLE', aG, 1]].forEach(function (q) {
        if (q[3] <= 0) return;
        var by = y0 + 98 + q[4] * 136;
        for (var i = 0; i < 3; i++) txt(g, q[i], x0 + 28, by + i * 42, 38, INK, 'left', 900, DISP, w - 56, q[3], 36, 'condensed');
      });
    });
    g.fillStyle = 'rgba(33,29,38,.25)'; g.fillRect(x0 + 28, y0 + 211, w - 56, 3);
    EXITING = ex; g.restore();
  }

  /* =====================================================================================================
     THE STREET (unsafe, police): a paper street at night, a lit storefront under a PUBLIC sign, no figures. The phone
     travels to it; on "contact" it comes forward with a re-created LAW ENFORCEMENT contact card.
     ===================================================================================================== */
  function street(g, t) {
    /* back buildings, a lamp post, the storefront, the road */
    var r = mulberry(9101);
    g.fillStyle = '#1b2431'; [[104, 640, 150, 360], [262, 590, 170, 410], [440, 680, 120, 320]].forEach(function (b, i) {
      rr(g, b[0], b[1], b[2], b[3], 6); g.fill();
      g.fillStyle = 'rgba(240,200,120,.22)'; for (var k = 0; k < 6; k++) { if (r() < .45) continue; rr(g, b[0] + 22 + (k % 2) * (b[2] / 2 - 4), b[1] + 34 + Math.floor(k / 2) * 92, b[2] / 2 - 40, 46, 4); g.fill(); }
      g.fillStyle = '#1b2431';
    });
    g.fillStyle = '#2a3340'; g.fillRect(212, 760, 10, 240); g.fillStyle = '#3a4452'; rr(g, 196, 748, 42, 22, 8); g.fill();
    var gl = g.createRadialGradient(217, 778, 6, 217, 778, 120); gl.addColorStop(0, 'rgba(240,190,100,.4)'); gl.addColorStop(1, 'rgba(240,190,100,0)'); g.fillStyle = gl; g.fillRect(97, 658, 240, 240);
    prop(g, 'buildings', 104, 590, 560, 1000);
    /* the storefront */
    var fx = 568, fy = 640, fw = 346, fh = 360;
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(fx + 8, fy + 10, fw, fh);
    g.fillStyle = '#2f5258'; g.fillRect(fx, fy, fw, fh);
    g.beginPath(); g.rect(fx, fy, fw, fh); grainIn(g, fx, fy, fw, fh, 9102, .8);
    var wg = g.createRadialGradient(fx + 130, fy + 250, 20, fx + 130, fy + 250, 260); wg.addColorStop(0, 'rgba(243,201,107,.35)'); wg.addColorStop(1, 'rgba(243,201,107,0)');
    g.fillStyle = wg; g.fillRect(fx - 60, fy + 40, fw + 60, fh + 40);
    g.fillStyle = '#f3c96b'; rr(g, fx + 24, fy + 150, 210, 170, 6); g.fill();
    g.fillStyle = 'rgba(160,110,40,.35)'; g.fillRect(fx + 126, fy + 150, 6, 170);
    g.fillStyle = '#22383d'; g.fillRect(fx + 256, fy + 160, 70, 200); g.fillStyle = '#f3c96b'; rr(g, fx + 270, fy + 176, 42, 60, 4); g.fill();
    /* the awning: cream and teal stripes with a scalloped edge */
    for (var i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#e8dcc2' : '#3f6d73'; g.fillRect(fx + i * fw / 8, fy + 82, fw / 8 + 1, 48); g.beginPath(); g.arc(fx + (i + .5) * fw / 8, fy + 130, fw / 16, 0, Math.PI); g.fill(); }
    g.fillStyle = '#16262a'; rr(g, fx + 40, fy + 14, fw - 80, 60, 8); g.fill();
    prop(g, 'storefront', fx, fy, fx + fw, fy + fh);
    onprop(function () { txt(g, 'PUBLIC', fx + fw / 2, fy + 46, 50, CREAM, 'center', 900, DISP, fw - 100, 1, 40, 'condensed'); });
    /* the sidewalk and the road (centre dashes drift) */
    g.fillStyle = '#3a4452'; g.fillRect(92, 1000, 836, 22);
    g.fillStyle = '#1a1f28'; g.fillRect(92, 1022, 836, 82);
    g.fillStyle = 'rgba(244,237,224,.55)'; var off = (t * 40) % 90; for (var x = 92 - off; x < 928; x += 90) g.fillRect(Math.max(92, x), 1059, Math.max(0, Math.min(50, 928 - x, x + 50 - 92)), 8);
  }
  function contactCard(g, P, a) {
    g.save(); g.globalAlpha *= a;
    var cx = P.x + P.w / 2;
    g.fillStyle = '#d9d1c1'; el(g, cx, P.y + 140, 62, 62);
    /* a handset glyph: two rounded ends on a curved grip */
    g.save(); g.translate(cx, P.y + 140); g.rotate(-.75); g.fillStyle = INK; rr(g, -40, -12, 80, 24, 12); g.fill(); rr(g, -44, -14, 26, 38, 10); g.fill(); rr(g, 18, -14, 26, 38, 10); g.fill(); g.restore();
    onprop(function () {
      txt(g, 'LAW', cx, P.y + 252, 50, INK, 'center', 900, DISP, P.w - 30, 1, 36, 'condensed');
      txt(g, 'ENFORCEMENT', cx, P.y + 304, 50, INK, 'center', 900, DISP, P.w - 30, 1, 36, 'condensed');
    });
    var bw = P.w - 60, bx = P.x + 30, by = P.y + 352;
    g.fillStyle = '#3f9a63'; rr(g, bx, by, bw, 76, 38); g.fill();
    prop(g, 'contact button', bx, by, bx + bw, by + 76);
    onprop(function () { txt(g, 'CONTACT', bx + bw / 2, by + 40, 40, CREAM, 'center', 900, DISP, bw - 20, 1, 36, 'condensed'); });
    g.restore();
  }
  function streetScene(g, t) {
    var E0 = S('street').t0;
    var go = eio(seg(t, K.go - .16, K.publicW - .06)), big = eio(seg(t, K.publicW - .11, K.publicW + .24));
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { mapBg(g, t, .45); return; }
    var ex = EXITING; if (t < E0 + .05) EXITING = true;
    var sin = eout(seg(t, E0 - .1, E0 + .4));
    g.save(); g.translate(0, 60 * (1 - sin)); street(g, t); g.restore();
    EXITING = ex;
    /* the phone: small on the sidewalk, travelling to the storefront; on "contact" it comes forward */
    var bob = 6 * Math.abs(Math.sin(t * 6.5)) * (go > 0 && go < 1 ? 1 : 0);
    var sx = lerp(lerp(140, 640, go), 120, big), sy = lerp(842 - bob, 520, big), sw = lerp(104, 310, big), sh = lerp(180, 560, big);
    var exp = EXITING; if ((go > 0 && go < 1) || (big > 0 && big < 1)) EXITING = true;
    var P = phoneBody(g, sx, sy, sw, sh, SCR, 'travel phone');
    if (big < .5) { g.fillStyle = TAGC; el(g, P.x + P.w / 2, P.y + P.h * .42, P.w * .22, P.w * .22); g.strokeStyle = HOT; g.lineWidth = 4; g.beginPath(); g.arc(P.x + P.w / 2, P.y + P.h * .42, P.w * .2, 0, 6.283); g.stroke(); }
    else { contactCard(g, P, seg(big, .5, 1)); onprop(function () { tag(g, 'RE-CREATED', P.x + P.w / 2, P.y + P.h - 40, seg(big, .7, 1), 0, 240, INK, SCR, 30); }); }
    EXITING = exp;
    slapCard(g, 'IF YOU FEEL UNSAFE', 510, 1150, t, E0 - .2, 64, 700);
    /* both makers' words; Google's addition on "law" */
    var qa = seg(t, E0, E0 + .12);
    if (qa > 0) {
      var x0 = 104, y0 = 1200, w = 812, h = 222, exq = EXITING; if (qa < 1) EXITING = true;
      g.save(); g.translate(110 * (1 - eout(qa)), 0); g.globalAlpha *= qa;
      sheet(g, x0, y0, x0 + w, y0 + h, 3901, PAPER, 'safe plate');
      onprop(function () {
        txt(g, '“…GO TO A SAFE PUBLIC LOCATION', x0 + 28, y0 + 44, 46, INK, 'left', 900, DISP, w - 56, 1, 40, 'condensed');
        txt(g, 'AND CONTACT LAW ENFORCEMENT…”', x0 + 28, y0 + 96, 46, INK, 'left', 900, DISP, w - 56, 1, 40, 'condensed');
        txt(g, 'APPLE SUPPORT · ANDROID HELP', x0 + 28, y0 + 146, 36, '#5d564c', 'left', 800, DISP, w - 56, 1, 36, 'condensed');
        txt(g, 'GOOGLE: “…TRUSTED CONTACT…”', x0 + 28, y0 + 190, 36, '#5d564c', 'left', 800, DISP, w - 56, 1, 36, 'condensed');
      });
      g.restore(); EXITING = exq;
    }
  }

  /* =====================================================================================================
     DISABLE (if it's safe): IF IT'S SAFE with Google's caveat, the tag big, Apple's Instructions to Disable button.
     The tap on "disable" turns the ring gray and the pulses stop; the trail grays from its head; the end cap in the gap.
     ===================================================================================================== */
  var OFFT = { x: 510, y: 774, r: 196 };
  var OFFTRAIL = [[-40, 1160], [96, 1080], [60, 930], [150, 800], [250, 690], [OFFT.x, OFFT.y]];
  function offScene(g, t) {
    var E0 = S('off').t0;
    var lit = 1 - eio(seg(t, K.disableW + .05, K.disableW + .4)), dead = seg(t, K.disableW + .3, K.itself + .3);
    var bf = eout(seg(t, K.disableW - .05, K.disableW + .1)), press = Math.sin(Math.PI * seg(t, K.disableW - .02, K.disableW + .18));
    if (LAYER === 'over') return;
    var zp = 1 + .1 * eio(seg(t, K.disableW + .15, S('check').t0 + .45));  /* a slow push in on the dead tag */
    if (LAYER === 'bg') {
      g.save(); g.translate(OFFT.x, OFFT.y); g.scale(zp, zp); g.rotate(.03 * (zp - 1) / .1); g.translate(-OFFT.x, -OFFT.y);
      mapBg(g, t, .2);
      trail(g, OFFTRAIL, 6, { a: .9, skipLast: true, dead: dead });
      pulses(g, OFFT.x, OFFT.y, OFFT.r, t, lit);
      /* the end cap: the trail stops (the click in the gap) */
      var ck = eout(seg(t, K.DS - .02, K.DS + .1));
      if (ck > 0) { g.save(); g.strokeStyle = CREAM; g.lineWidth = 9; g.lineCap = 'round'; var hx = OFFTRAIL[4][0], hy = OFFTRAIL[4][1]; g.translate(hx + 34, hy + 10); g.rotate(-.3); g.globalAlpha *= ck; g.beginPath(); g.moveTo(0, -30 * ck); g.lineTo(0, 30 * ck); g.stroke(); g.restore(); }
      g.restore();
      return;
    }
    var ex = EXITING; if (t < E0 + .05) EXITING = true;
    var tin = eout(seg(t, E0 - .1, E0 + .4));
    tagDisc(g, OFFT.x, OFFT.y + 50 * (1 - tin), OFFT.r * zp, { rot: .4 * (1 - tin) + .05 * Math.sin(t * .9), lit: lit });
    EXITING = ex;
    slapCard(g, 'IF IT’S SAFE', 510, 470, t, K.dis, 66, 600);
    /* Apple's button, inside a re-created iPhone sheet (so it reads as a phone screen, not a button on the tag) */
    var sx0 = 104, sy0 = 1004, sw = 812, sh = 196, exb = EXITING; if (t < E0 + .05) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, sx0 + 8, sy0 + 12, sw, sh, 36); g.fill();
    g.fillStyle = SCR; rr(g, sx0, sy0, sw, sh, 36); g.fill(); rr(g, sx0, sy0, sw, sh, 36); grainIn(g, sx0, sy0, sw, sh, 8811, .6);
    prop(g, 'iphone sheet', sx0, sy0, sx0 + sw, sy0 + sh);
    g.fillStyle = 'rgba(33,29,38,.25)'; rr(g, 510 - 40, sy0 + 14, 80, 10, 5); g.fill();
    onprop(function () { tag(g, 'iPHONE · RE-CREATED', sx0 + 30 + 170, sy0 + 50, 1, 0, 360, INK, SCR, 30); });
    var bw = 740, bh = 88, bx0 = 510 - bw / 2, by0 = sy0 + 88, ps = 1 - .03 * press;
    g.save(); g.translate(510, by0 + bh / 2); g.scale(ps, ps); g.translate(-510, -(by0 + bh / 2));
    g.fillStyle = mixc(hex('#d9d1c1'), hex(BLUE), bf); rr(g, bx0, by0, bw, bh, bh / 2); g.fill();
    prop(g, 'disable button', bx0, by0, bx0 + bw, by0 + bh);
    onprop(function () { txt(g, 'Instructions to Disable', 510, by0 + bh / 2 + 2, 46, bf > .5 ? CREAM : INK, 'center', 900, DISP, bw - 120, 1, 40, 'condensed'); });
    g.restore(); EXITING = exb;
    touch(g, bx0 + bw - 50, by0 + bh / 2, t, K.disableW, K.disableW + .4);
    /* the sources' caveats, as fine print (Google: some reset when off, the owner may still see the last location; Apple: law enforcement may need the item) */
    var fa = seg(t, E0 - .32, E0 - .24);
    g.save(); g.globalAlpha *= fa; g.fillStyle = CREAM; [1232, 1320, 1362].forEach(function (y) { el(g, 112, y - 2, 7, 7); }); g.restore();
    txt(g, 'SOME TRACKERS MAY RESET', 132, 1232, 38, CREAM, 'left', 900, DISP, 780, fa, 36, 'condensed');
    txt(g, 'WHEN TURNED OFF', 132, 1274, 38, CREAM, 'left', 900, DISP, 780, fa, 36, 'condensed');
    txt(g, 'OWNER MAY SEE ITS LAST LOCATION', 132, 1320, 38, CREAM, 'left', 900, DISP, 780, fa, 36, 'condensed');
    txt(g, 'LAW ENFORCEMENT MAY NEED IT', 132, 1362, 38, CREAM, 'left', 900, DISP, 780, fa, 36, 'condensed');
    txt(g, 'ANDROID HELP · APPLE', 104, 1408, 34, '#b9b1a3', 'left', 800, DISP, 600, fa, 30, 'condensed');
  }

  /* =====================================================================================================
     CHECK: two re-created settings cards, each path printed on its word, each ending on a chevron (no switch drawn)
     ===================================================================================================== */
  function setCard(g, x0, y0, w, h, head, credit, rows, t, hlT, pk, seed) {
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 10, y0 + 14, w, h, 40); g.fill();
    g.fillStyle = SCR; rr(g, x0, y0, w, h, 40); g.fill();
    rr(g, x0, y0, w, h, 40); grainIn(g, x0, y0, w, h, seed, .6);
    prop(g, 'settings card', x0, y0, x0 + w, y0 + h);
    onprop(function () {
      font(g, 38, 900, DISP, 'condensed'); var hw = g.measureText(head).width + 28; chip(g, head, x0 + 30 + hw / 2, y0 + 46, { px: 38, wt: 900, st: 'condensed', bg: INK, fg: CREAM, r: 12, shadow: false, pad: 14, a: 1 });
      tag(g, 'RE-CREATED', x0 + w - 130, y0 + 46, 1, 0, 230, INK, SCR, 30);
      txt(g, credit, x0 + w - 34, y0 + h - 30, 32, '#6b6457', 'right', 800, DISP, 400, 1, 30, 'condensed');
    });
    rows.forEach(function (rw, i) {
      var a = seg(t, rw[1], rw[1] + .12); if (a <= 0) return;
      var ry = y0 + 90 + i * 84, hl = rw[2] ? eout(seg(t, hlT, hlT + .2)) : 0, ps = rw[2] ? 1 + pk : 1;
      g.save(); g.globalAlpha *= a; g.translate(30 * (1 - a), 0);
      g.translate(x0 + w / 2, ry + 36); g.scale(ps, ps); g.translate(-(x0 + w / 2), -(ry + 36));
      g.fillStyle = mixc(hex('#f8f4ec'), hex('#f3d58c'), hl); rr(g, x0 + 26, ry, w - 52, 72, 16); g.fill();
      onprop(function () {
        txt(g, rw[0], x0 + 52, ry + 38, 44, INK, 'left', 900, DISP, w - 170, 1, 36, 'condensed');
        txt(g, '›', x0 + w - 62, ry + 34, 58, '#6b6457', 'center', 900, DISP, 0, 1, 36);
      });
      g.restore();
    });
  }
  function checkScene(g, t) {
    var E0 = S('check').t0;
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { mapBg(g, t, .35); return; }
    var ka = eout(seg(t, E0 - .25, E0 + .1)), kb = eout(seg(t, E0 - .15, E0 + .2)), ex = EXITING;
    var pk = .03 * Math.sin(Math.PI * seg(t, K.CK - .02, K.CK + .16));
    if (ka < 1) EXITING = true;
    g.save(); g.translate(0, 80 * (1 - ka)); g.globalAlpha *= seg(ka, 0, .5);
    setCard(g, 104, 470, 812, 404, 'iPHONE', 'APPLE SUPPORT', [['Settings', E0 - .1], ['Notifications', E0 - .1], ['Tracking Notifications', E0 - .1, 1]], t, K.tracking, 0, 4101);
    g.restore(); EXITING = ex || kb < 1;
    g.save(); g.translate(0, 80 * (1 - kb)); g.globalAlpha *= seg(kb, 0, .5);
    setCard(g, 104, 906, 812, 404, 'ANDROID 12+', 'ANDROID HELP', [['Settings', E0 + .05], ['Safety & emergency', E0 + .05], ['Unknown tracker alerts', E0 + .05, 1]], t, K.unknownC, pk, 4111);
    g.restore(); EXITING = ex;
  }

  /* =====================================================================================================
     THE END CARD: frame 0's banner and tag, YES / NO held, then the banner glides back up into frame 0
     ===================================================================================================== */
  function endScene(g, t) {
    var tt = t - TEND + 1 / 30, gl = eio(seg(t, TEND - .22, TEND - 1 / 30));
    var p = f0(1 / 60), by = lerp(BY, p.by, gl), brot = lerp(0, p.brot, gl), cy = lerp(1050, p.cy, gl), rot = lerp(0, p.rot, gl);
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { mapBg(g, tt, 0); trail(g, hookTrail({ x: 510, y: cy }), 7, { skipLast: true }); pulses(g, 510, cy, 352, tt, 1); return; }
    var exw = EXITING; if (gl > 0) EXITING = true;
    bannerHead(g, tt, by, brot, 'RE-CREATED', 1, null, 0);
    txt(g, 'TRACKER WITH YOU?', 510, 642, 84, CREAM, 'center', 900, DISP, 800, 1, 60, 'condensed');
    youPin(g, PIN.x, PIN.y, tt, 1);
    tagDisc(g, 510, cy, 352, { rot: rot, lit: 1, keys: 1, t: tt });
    EXITING = exw;
    var yo = eio(seg(t, TEND - .2, TEND - .06));
    [['YES', 330], ['NO', 690]].forEach(function (cc) {
      var tq0 = cc[0] === 'YES' ? K.yesE : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), kc = eout(seg(t, S('end').t0 - .3, S('end').t0 - .1)), sc = lerp(1.08, 1, kc) * (1 - .07 * tp) * (1 - yo);
      if (sc <= .01 || kc <= 0) return;
      var oc = ONPROP, ex0 = EXITING; ONPROP = true; EXITING = ex0 || yo > 0 || kc < 1;
      chip(g, cc[0], cc[1], 1180 + 8 * tp + 6 * Math.sin(t * 4.2 + (cc[0] === 'YES' ? 0 : 2.1)) * kc, { px: 112, wt: 900, bg: BG, line: CREAM, lw: 8, fg: CREAM, w: 250, h: 160, r: 54, shadow: true, a: kc * (1 - seg(yo, .5, .9)), s: sc, maxw: 250 });
      ONPROP = oc; EXITING = ex0;
    });
  }

  var QHIDE = 0;
  function qplate(g, x0, y0, w, lines, px, credits, seed, inn, out, retag, minpx) {
    if (inn <= 0 || out >= 1) return;
    var ex0 = EXITING, lh = px * 1.12, h = 26 + lines.length * lh + credits.length * 44 + 14;
    var ei = eout(clamp(inn, 0, 1)), eo = eio(clamp(out, 0, 1));
    g.save();
    if (ei < 1) { g.translate(110 * (1 - ei), 0); g.globalAlpha *= seg(ei, 0, .7); EXITING = true; }
    if (eo > 0) { EXITING = true; g.translate(x0, y0 + h); g.rotate(-.08 * eo); g.translate(-x0, -(y0 + h)); g.translate(-60 * eo, 50 * eo); g.globalAlpha *= 1 - eo; }
    sheet(g, x0, y0, x0 + w, y0 + h, seed, PAPER, 'quote');
    onprop(function () {
      lines.forEach(function (L, i) { if (QHIDE && i >= lines.length - QHIDE) return; txt(g, L, x0 + 28, y0 + 20 + lh * (i + .5), px, INK, 'left', 900, DISP, w - 56, 1, minpx || 44, 'condensed'); });
      if (!QHIDE) credits.forEach(function (c, i) {
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
  var CAPGROUPS = { hook: [[3, 3]], ask: [[3]], iphone: [[2], [2, 4]], android: [[2], [4]], borrow: [[3, 4]], sound: [[3], [3]], dip: [[4], [2]], twist: [[3], [2, 3]], unsafe: [[2], [4, 2]], police: [[4]], disable: [[3], [4]], check: [[2], [2], [4]], end: [[3], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'warns'], ['ask', 'now?'], ['iphone', 'AirTag'], ['android', 'unknown'], ['borrow', 'borrowed.'], ['sound', 'Play'], ['dip', 'Bluetooth'], ['twist', "won't"], ['unsafe', 'public'], ['police', 'law'], ['disable', 'disable'], ['check', 'Tracking'], ['check', 'Unknown'], ['end', 'on?']]
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
    /* r2: "Your phone did that." steps back to 50 % while the YOUR PHONE / DID THAT. plate says it */
    var dim = 1;
    g.globalAlpha = fi * out * dim * (alpha == null ? 1 : alpha);
    NOREC = true;
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 26;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], tf = tq(t), cur = stressed(w) && tf >= w.t0 - .03 && tf < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .2;
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
  var NOISE, SCENES = { alertScene: alertScene, bagScene: bagScene, splitScene: splitScene, streetScene: streetScene, offScene: offScene, checkScene: checkScene, endScene: endScene };
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
    drawScene(g, Sc, t, 'over');   /* the hand: it reaches in from past the frame's edge, so it is never cut flat at the rail */
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
    /* frame 0's tension: a little more contrast on the close-up, eased out after the hook and back in for the loop */
    var cst = 1 + .15 * (t < 4 ? 1 - seg(t, K.HK - .02, K.HK + .3) : seg(t, TEND - .7, TEND - .15));
    if (cst > 1.002) { if (!CCV) { CCV = mk(W, H); CCX = CCV.getContext('2d'); } CCX.clearRect(0, 0, W, H); CCX.drawImage(g.canvas, 0, 0); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'contrast(' + cst.toFixed(3) + ')'; g.drawImage(CCV, 0, 0); g.restore(); }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor((t > TEND - 1 / 30 ? t - TEND + 1 / 30 : t) * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null, CCV = null, CCX = null;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 54, 800, DISP, 'semi-expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('Turning off Bluetooth', CX, 310);
    var b = 'won’t stop a tracker.', bp = 62, by = 392; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, by - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, by); g.restore();
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
  var GAIN = { hk: .12, oc: .1, w1: .1, ch: .12, dp: .12, tw: .05, w3: .1, w4: .1, ds: .12, ck: .1 };
  var TYPE = { hk: 'tick', oc: 'pop', w1: 'pop', ch: 'chirp', dp: 'click', tw: 'slap', w3: 'tear', w4: 'tear', ds: 'click', ck: 'tick' };
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
    /* a plug seating: a short low plop (sine 520 → 260 Hz) with a 1–3 kHz paper click */
    /* the tag's sound: two short dry pips (2.1 and 2.8 kHz), no ring-out (a ringing hit makes Whisper invent words) */
    function chirpS(t, g) { g = g || 1; [[2100, 0], [2800, .075]].forEach(function (p) { var t0 = t + p[1]; osc('sine', p[0], t0, t0 + .06, 1, [[t0, 0], [t0 + .003, .3 * g], [t0 + .045, .18 * g], [t0 + .06, 0]], 0); }); band(t, .02, 2400, 2, 1.2 * g, .001, 0); }
    function popS(t, g) { g = g || 1; var o = osc('sine', 520, t, t + .1, 1, [[t, 0], [t + .003, .4 * g], [t + .09, 0]], .02); o.frequency.exponentialRampToValueAtTime(260, t + .09); paperHit(t, g * .9); }
    EV.forEach(function (e) {
      if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'chirp') chirpS(e.t, e.g);
      else if (e.type === 'clink') clinkS(e.t, e.g);
      else if (e.type === 'buzz') buzzS(e.t, e.g);
      else if (e.type === 'rattle') rattleS(e.t, e.g);
      else
      if (e.type === 'thump') stampThump(e.t, e.g, .2);
      else if (e.type === 'swish') swishS(e.t, e.g);
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'paper') paperS(e.t, e.g);
      else if (e.type === 'knock') { knockS(e.t, e.g); if (e.id === 'nv') slapS(e.t, e.g * .8); }   /* r2: the gate slam gets a 1–3 kHz slap layer */
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
  /* the hero hold: WON'T STOP IT, from "won't" to "unsafe" */
  var HOLD = { t0: K.wont, t1: K.unsafeW };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((K.TW + .35) * 30) / 30 + 1 / 60, SLUG: 'trackeralert', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
