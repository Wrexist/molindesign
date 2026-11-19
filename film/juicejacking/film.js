/* "Airport chargers probably aren't hacking you." — Factory #36 (juicejacking) on Tech, explained, after ../hotcharging/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   All cut paper in an airport terminal: a charging kiosk (FREE CHARGING), a phone on its cable with a re-created
   "Trust This Computer?" prompt, the cable drawn with two lanes (amber power, a cream data lane stopped at a paper
   gate). The FBI Denver post (re-created) and its empty CASES slot, stamped NONE NAMED; the lab result inside a dashed
   LAB box; inside the cable, the gate's board shows the re-created iPhone and Android prompts and slams on Don't Trust.
   No FCC anywhere (its page was disabled by its owner on 2026-11-19). Props stay whole inside x 92–928, y 302–1428. */
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
    hook: start('hook'), chargers: at('hook', 'chargers'), probably: at('hook', 'probably'), hookEnd: lend('hook'),
    ask: start('ask'), juice: at('ask', 'juice'), real: at('ask', 'real?'), askEnd: lend('ask'),
    warn: start('warn'), fbiW: at('warn', 'FBI'), warned: at('warn', 'warned'), warnEnd: lend('warn'),
    fear: start('fear'), bad: at('fear', 'bad'), usb: at('fear', 'USB'), plant: at('fear', 'plant'), malware: at('fear', 'malware.'), fearEnd: lend('fear'),
    twist: start('twist'), post: at('twist', 'post'), noW: at('twist', 'no'), caseW: at('twist', 'case.'), twistEnd: lend('twist'),
    lab: start('lab'), pulled: at('lab', 'pulled'), labs: at('lab', 'labs.'), labEnd: lend('lab'),
    asks: start('asks'), phoneA: at('asks', 'phone'), asksW: at('asks', 'asks'), shares: at('asks', 'shares'), asksEnd: lend('asks'),
    os: start('os'), iph: at('os', 'iPhone'), trustO: at('os', 'Trust'), computer: at('os', 'Computer?'), android: at('os', 'Android'), waits: at('os', 'waits'), file: at('os', 'File'), osEnd: lend('os'),
    never: start('never'), publicN: at('never', 'public'), neverW: at('never', 'never'), trustN: at('never', 'Trust'), allow: at('never', 'Allow.'), neverEnd: lend('never'),
    wall: start('wall'), skip: at('wall', 'skip'), portW: at('wall', 'port.'), use: at('wall', 'Use'), own: at('wall', 'own'), plug: at('wall', 'plug.'), wallEnd: lend('wall'),
    end: start('end'), ever: at('end', 'Ever'), trustE: at('end', 'Trust'), yesE: at('end', 'Yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  (function () {
    place('hk', 'tick', K.hookEnd + .3, .2, K.hookEnd, K.ask);          /* the plug seats in the kiosk port */
    place('fe', 'knock', K.fearEnd + .45, .17, K.fearEnd, K.twist);       /* the bug settles on the port */
    place('tw', 'slap', K.twistEnd + .3, .2, K.twistEnd, K.lab);        /* NONE NAMED, the hero stamp */
    place('lb', 'click', K.labEnd + .25, .2, K.labEnd, K.asks);         /* r2: the lab bug gets into the test phone */
    place('oc', 'click', K.osEnd + .3, .2, K.osEnd, K.never);           /* the board flips back to the iPhone face */
    place('nv', 'knock', K.neverEnd + .3, .2, K.neverEnd, K.wall);      /* Don't Trust: the gate slams */
    place('wl', 'pop', K.wallEnd + .3, .2, K.wallEnd, K.end);           /* the cable plugs into the brick */
  })();
  var TW = .5;
  K.HK = GT.hk != null ? GT.hk : K.hookEnd + .25;
  K.FE = GT.fe != null ? GT.fe : K.fearEnd + .3;
  K.TW = GT.tw != null ? GT.tw : K.twistEnd + .3;
  K.OC = GT.oc != null ? GT.oc : K.osEnd + .3;
  K.NV = GT.nv != null ? GT.nv : K.neverEnd + .3;
  K.WL = GT.wl != null ? GT.wl : K.wallEnd + .3;
  K.seatW = K.own + .16;               /* r2: the cable seats in the brick (CHARGING comes up) */
  K.prBack = K.portE = at('end', 'port?') - .1;   /* r2: back on the kiosk, the phone charges, then asks again */
  K.LB = GT.lb != null ? GT.lb : K.labEnd + .25;
  K.ST = K.noW - .05;                  /* r2: NONE NAMED lands on "no" (silent), the slap re-presses it in the gap after "case." */
  K.LI = at('lab', 'have') - .1;      /* jury r2 polish: the LAB box slides in at ~15.0, so NONE NAMED holds full size ≥1.5 s */
  K.BU = K.shares;                     /* jury r2 polish: on ASKS FIRST the packets bump the shut gate (no SFX: it is mid-word) */
  K.LT = K.LI + .38;               /* r2: the lab charger's arm taps Trust by itself (polish: on "pulled", after the slide-in) */
  var SC = [
    { id: 'kiosk', fn: 'kioskScene', name: 'The kiosk, the FBI post, the lab', t0: 0 },
    { id: 'cable', fn: 'cableScene', name: 'Inside the cable: the gate asks first', t0: K.asks + .95, tw: .45 },   /* polish: later, so the LAB reads hold after the later slide-in */
    { id: 'back', fn: 'backScene', name: 'Your own wall plug. Ever tapped Trust?', t0: K.use - .05, tw: .4 }
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
     THE PROPS (all cut paper, all drawn by hand): an airport terminal wall, a charging kiosk, a two-lane cable
     (amber power dashes, a cream data lane stopped at a paper gate), a generic phone with a re-created prompt,
     a coral paper bug, a re-created FBI Denver post, the CASES slot, the LAB box, the gate board, a wall outlet
     ===================================================================================================== */
  var CUR = 'kiosk';
  var AMBER = '#f0a83a', LAMBER = '#f3d58c', KBODY = '#ddd5c3', KDARK = '#263040', KPANEL = '#2a3240';
  var CABW = '#e4dac4', CABC = '#22262d', WALLC = '#18202b', WIN = '#0e1624';
  /* loop-safe cycles: anything periodic in the frame-0 picture is a function of ct (t at the start, t − TEND at the end) */
  function cyc(ct, hz, ph) { return Math.sin(6.283 * (ct * hz + (ph || 0))); }

  /* ---------- the terminal: a dark wall, a long night window with runway lights, a floor ---------- */
  function terminal(g, t, ct, plane) {
    g.fillStyle = WALLC; g.fillRect(-1400, -300, W + 2800, H + 600);
    g.fillStyle = 'rgba(255,255,255,.02)'; for (var x = -1400; x < W + 1400; x += 180) g.fillRect(x, 300, 8, 1100);
    /* the window */
    g.fillStyle = WIN; g.fillRect(-1400, 380, W + 2800, 170);
    g.fillStyle = '#1b2638'; g.fillRect(-1400, 505, W + 2800, 45);
    for (var i = -8; i < 14; i++) { var lx = i * 120 + 40, on = .55 + .45 * cyc(ct, .5, i * .37); g.fillStyle = 'rgba(243,213,140,' + (.35 + .5 * on).toFixed(3) + ')'; el(g, lx, 515, 4, 3); }
    if (plane > 0 && plane < 1) {   /* a paper plane crossing the night, right → left, once */
      var px = lerp(W + 300, -400, plane), py = 500 - 16 * plane;
      g.save(); g.translate(px, py); g.rotate(-.06); g.fillStyle = '#c9d1dc';
      poly(g, [[-70, 0], [60, -6], [74, 0], [60, 6]]); g.fill(); poly(g, [[0, -2], [-26, -40], [-14, -40], [24, -3]]); g.fill(); poly(g, [[0, 2], [-22, 28], [-12, 28], [22, 3]]); g.fill(); poly(g, [[-58, -2], [-74, -22], [-66, -22], [-50, -2]]); g.fill();
      g.restore();
    }
    g.fillStyle = '#2c3646'; for (var m = -1400; m < W + 1400; m += 300) g.fillRect(m, 380, 14, 170);
    g.fillStyle = '#3a4454'; g.fillRect(-1400, 372, W + 2800, 10); g.fillRect(-1400, 548, W + 2800, 10);
    /* the floor */
    g.fillStyle = '#212a36'; g.fillRect(-1400, 1300, W + 2800, 900);
    g.fillStyle = '#2c3644'; g.fillRect(-1400, 1296, W + 2800, 8);
    g.fillStyle = 'rgba(255,255,255,.03)'; for (var f = 0; f < 6; f++) g.fillRect(-1400, 1340 + f * 46, W + 2800, 2);
  }

  /* ---------- the charging kiosk (world x 112–372, y 560–1420); FREE CHARGING arrives after frame 0 ---------- */
  var KX0 = 112, KX1 = 372, KY0 = 560, KY1 = 1420, KCX = 242, PORTS = [820, 940, 1060, 1180], PORTY = 940;
  function bolt(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col;
    poly(g, [[6, -30], [-16, 4], [-2, 4], [-8, 30], [16, -6], [2, -6]]); g.fill(); g.restore();
  }
  function kiosk(g, ct, hdr, seated) {
    var w = KX1 - KX0;
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, KX0 + 12, KY0 + 16, w, KY1 - KY0 - 16, 22); g.fill();
    g.fillStyle = KBODY; rr(g, KX0, KY0, w, KY1 - KY0, 22); g.fill();
    rr(g, KX0, KY0, w, KY1 - KY0, 22); grainIn(g, KX0, KY0, w, KY1 - KY0, 2201, .8);
    g.fillStyle = '#c8bfaa'; g.fillRect(KX1 - 24, KY0 + 24, 9, KY1 - KY0 - 80);
    g.fillStyle = '#3b414c'; rr(g, KX0 - 8, KY1 - 46, w + 16, 46, 10); g.fill();
    prop(g, 'kiosk', KX0 - 8, KY0, KX1 + 8, KY1);
    g.fillStyle = KDARK; rr(g, KX0 + 18, KY0 + 20, w - 36, 150, 14); g.fill();
    bolt(g, KX1 - 62, KY0 + 64, 1.05, AMBER);
    if (hdr > 0) onprop(function () {
      txt(g, 'FREE', KX0 + 42, KY0 + 66, 54, CREAM, 'left', 900, DISP, 140, hdr, 40, 'condensed');
      txt(g, 'CHARGING', KCX, KY0 + 130, 52, CREAM, 'center', 900, DISP, w - 70, hdr, 40, 'condensed');
    });
    g.fillStyle = KPANEL; rr(g, KX0 + 28, 762, w - 56, 486, 16); g.fill();
    PORTS.forEach(function (py, i) {
      g.fillStyle = '#cfc6b2'; rr(g, KCX - 58, py - 28, 104, 56, 10); g.fill();
      g.fillStyle = '#14171d'; rr(g, KCX - 44, py - 13, 76, 26, 4); g.fill();
      g.fillStyle = '#8a8270'; rr(g, KCX - 36, py - 13, 60, 10, 2); g.fill();
      var on = i === 1 ? seated : .25 + .25 * (1 + cyc(ct, .5, i * .3)) * .5;
      g.fillStyle = mixc(hex('#3d3833'), hex(AMBER), on); el(g, KX1 - 62, py, 8, 8);
    });
  }
  /* a USB plug in a kiosk port (face on): the head covers the slot, the boot below it, the cable leaves downward */
  function plug(g, x, y, k) {
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -30 + 6, -24 + 8, 60, 92, 10); g.fill();
    g.fillStyle = '#efe7d6'; rr(g, -30, -24, 60, 56, 9); g.fill();
    g.fillStyle = '#d5cbb4'; rr(g, -22, 28, 44, 40, 8); g.fill();
    g.fillStyle = 'rgba(33,29,38,.35)'; g.fillRect(-14, 40, 28, 3); g.fillRect(-14, 50, 28, 3);
    prop(g, 'plug', -30, -24, 30, 68);
    g.restore();
  }
  /* ---------- the cable: a sampled cubic with two lanes (power above, data below), a mini gate near the phone ---------- */
  function bez(A, c1, c2, B, u) { var a = (1 - u) * (1 - u) * (1 - u), b = 3 * u * (1 - u) * (1 - u), c = 3 * u * u * (1 - u), d = u * u * u; return [a * A[0] + b * c1[0] + c * c2[0] + d * B[0], a * A[1] + b * c1[1] + c * c2[1] + d * B[1]]; }
  function cablePts(A, B, droop, n) {
    var c1 = [A[0], A[1] + droop], c2 = [B[0] - 120, B[1] + 70], P = [];
    n = n || 60;
    for (var i = 0; i <= n; i++) P.push(bez(A, c1, c2, B, i / n));
    P.forEach(function (p, i) { var a = P[Math.max(0, i - 1)], b = P[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; p.nx = -dy / l; p.ny = dx / l; });
    return P;
  }
  function pathOff(g, P, off, i0, i1) { g.beginPath(); for (var i = i0 || 0; i <= (i1 == null ? P.length - 1 : i1); i++) { var x = P[i][0] + P[i].nx * off, y = P[i][1] + P[i].ny * off; if (i === (i0 || 0)) g.moveTo(x, y); else g.lineTo(x, y); } }
  function cable(g, P, ph, flow, ct, gateK) {
    var n = P.length - 1, gi = Math.round(n * .86);
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.translate(6, 9); pathOff(g, P, 0); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 40; g.stroke(); g.translate(-6, -9);
    pathOff(g, P, 0); g.strokeStyle = CABW; g.lineWidth = 38; g.stroke();
    pathOff(g, P, 0); g.strokeStyle = CABC; g.lineWidth = 24; g.stroke();
    g.lineCap = 'butt';
    if (flow > .01) { g.globalAlpha = flow; pathOff(g, P, -5); g.strokeStyle = AMBER; g.lineWidth = 8; g.setLineDash([18, 14]); g.lineDashOffset = -ph; g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
    /* the data lane: cream dots that stop at the gate */
    pathOff(g, P, 6, 0, gi - 2); g.strokeStyle = 'rgba(244,237,224,.85)'; g.lineWidth = 5; g.setLineDash([5, 12]); g.lineDashOffset = -3 * cyc(ct, .5); g.stroke(); g.setLineDash([]);
    g.restore();
    /* the mini gate: a cream post across the data lane */
    if (gateK !== false) {
      var p = P[gi], tx = -p.ny, ty = p.nx;
      g.save(); g.translate(p[0], p[1]); g.rotate(Math.atan2(ty, tx));
      g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -5 + 3, 0 + 4, 12, 26, 3); g.fill();
      g.fillStyle = '#f6efe0'; rr(g, -6, -2, 12, 26, 3); g.fill();
      g.fillStyle = HOT; g.fillRect(-6, 9, 12, 4);
      g.restore();
    }
  }

  /* ---------- the phone, face on (world centre 660, 930), with the re-created prompt ---------- */
  var PCX = 660, PCY = 930, PW = 360, PHH = 680;
  function phoneFront(g, o) {
    var x0 = PCX - PW / 2, y0 = PCY - PHH / 2;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 12, y0 + 16, PW, PHH, 56); g.fill();
    g.fillStyle = PHB; rr(g, x0, y0, PW, PHH, 56); g.fill();
    rr(g, x0, y0, PW, PHH, 56); grainIn(g, x0, y0, PW, PHH, 811, .9);
    g.fillStyle = '#1f252f'; rr(g, x0 + PW - 2, y0 + 150, 9, 80, 4); g.fill(); rr(g, x0 + PW - 2, y0 + 250, 9, 50, 4); g.fill();
    prop(g, 'phone', x0, y0, x0 + PW + 7, y0 + PHH);
    g.save(); rr(g, x0 + 18, y0 + 18, PW - 36, PHH - 36, 40); g.clip();
    var gr = g.createLinearGradient(0, y0, 0, y0 + PHH); gr.addColorStop(0, '#1a2433'); gr.addColorStop(1, '#0c121b'); g.fillStyle = gr; g.fillRect(x0, y0, PW, PHH);
    g.restore();
    g.fillStyle = '#05060a'; el(g, PCX, y0 + 44, 11, 11);
    /* the status bar: a small battery with a charging bolt (no number) */
    g.strokeStyle = CREAM; g.lineWidth = 3; rr(g, x0 + PW - 96, y0 + 34, 46, 22, 5); g.stroke(); g.fillStyle = CREAM; g.fillRect(x0 + PW - 49, y0 + 40, 4, 10);
    g.fillStyle = 'rgba(244,237,224,.85)'; rr(g, x0 + PW - 92, y0 + 38, 26, 14, 2); g.fill();
    bolt(g, x0 + PW - 73, y0 + 45, .38, AMBER);
    onprop(function () { tag(g, 'RE-CREATED', PCX, y0 + 100, 1, 0, 300, CREAM, 'rgba(16,22,28,.9)', 36); });
    /* r2: the prompt shows only while the phone is on the kiosk's port; on the wall plug it just charges */
    var pr = o.pr == null ? 1 : o.pr, ch = o.chg || 0;
    if (pr > 0) { var exq = EXITING; if (pr < 1) EXITING = true; g.save(); g.globalAlpha *= clamp(pr * 1.5, 0, 1); prompt(g, PCX, 900 + 40 * (1 - pr), lerp(.85, 1, pr), o.btn || 0); g.restore(); EXITING = exq; }
    if (ch > 0) chargeScreen(g, ch);
    g.fillStyle = '#151a22'; rr(g, PCX - 34, y0 + PHH - 9, 68, 9, 4); g.fill();
    g.strokeStyle = 'rgba(244,237,224,.55)'; g.lineWidth = 3; rr(g, x0, y0, PW, PHH, 56); g.stroke();
  }
  /* the plain charging screen: a big battery filling with a bolt, CHARGING; no buttons */
  function chargeScreen(g, a) {
    var exc = EXITING; if (a < 1) EXITING = true;
    g.save(); g.globalAlpha *= a; g.translate(PCX, 880); var s = lerp(.9, 1, eout(a)); g.scale(s, s);
    g.strokeStyle = CREAM; g.lineWidth = 8; rr(g, -100, -54, 186, 108, 18); g.stroke();
    g.fillStyle = CREAM; rr(g, 92, -20, 14, 40, 4); g.fill();
    var pk = Math.sin(Math.PI * seg(CURT_T, K.WL - .02, K.WL + .22)), lv = .42 + .22 * eout(seg(CURT_T, K.WL - .02, K.WL + .15)) + .12 * seg(CURT_T, K.WL + .2, K.prBack);   /* the pop: the bolt pulses, the level steps up */
    g.fillStyle = 'rgba(240,168,58,.85)'; rr(g, -88, -42, 162 * lv, 84, 10); g.fill();
    bolt(g, -6, 0, 1.25 * (1 + .3 * pk), CREAM);
    onprop(function () { txt(g, 'CHARGING', 0, 120, 52, CREAM, 'center', 900, DISP, 280, 1, 40, 'condensed'); });
    g.restore(); EXITING = exc;
  }
  var CURT_T = 0;
  /* the re-created prompt: title only, two buttons (blank on frame 0 and the end card; never one selected) */
  function prompt(g, cx, cy, s, lab) {
    var w = 284, h = 340;
    g.save(); g.translate(cx, cy); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -w / 2 + 5, -h / 2 + 8, w, h, 26); g.fill();
    g.fillStyle = '#ece5d8'; rr(g, -w / 2, -h / 2, w, h, 26); g.fill();
    onprop(function () {
      txt(g, 'Trust This', 0, -h / 2 + 60, 52, INK, 'center', 900, DISP, w - 30, 1, 40, 'condensed');
      font(g, 52, 900, DISP, 'condensed'); var w1 = g.measureText('Computer').width, w2 = g.measureText('?').width;
      txt(g, 'Computer', -(w1 + w2) / 2, -h / 2 + 118, 52, INK, 'left', 900, DISP, 0, 1, 40, 'condensed');
      txt(g, '?', -(w1 + w2) / 2 + w1 + 2, -h / 2 + 118, 52, HOT, 'left', 900, DISP, 0, 1, 40, 'condensed');
    });
    g.fillStyle = 'rgba(33,29,38,.25)'; g.fillRect(-w / 2 + 16, -h / 2 + 162, w - 32, 3);
    [0, 1].forEach(function (i) {
      var by = -h / 2 + 186 + i * 72;
      g.strokeStyle = 'rgba(33,29,38,.55)'; g.lineWidth = 3; rr(g, -w / 2 + 22, by, w - 44, 58, 29); g.stroke();
      if (lab > 0) onprop(function () { txt(g, i ? "Don't Trust" : 'Trust', 0, by + 31, 38, INK, 'center', 800, DISP, w - 70, lab, 36, 'condensed'); });
    });
    g.restore();
  }

  /* ---------- the coral paper bug (MALWARE (CLAIMED)): never shown entering a phone outside the LAB box ---------- */
  function bug(g, x, y, s, t, label, rot, la) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round';
    for (var i = 0; i < 3; i++) for (var sd = -1; sd <= 1; sd += 2) {
      var wig = 8 * Math.sin(t * 13 + i * 2 + sd), bx = -18 + i * 18;
      g.beginPath(); g.moveTo(bx, 0); g.lineTo(bx + 6 + wig * .4, sd * 34); g.lineTo(bx + 16 + wig, sd * 50); g.stroke();
    }
    g.beginPath(); g.moveTo(-40, -8); g.quadraticCurveTo(-62, -30, -70, -22); g.moveTo(-40, 8); g.quadraticCurveTo(-62, 30, -70, 22); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 6, 8, 42, 30);
    g.fillStyle = HOT; el(g, 0, 0, 42, 30);
    g.fillStyle = '#c8432e'; g.fillRect(-2, -29, 4, 58);
    g.fillStyle = INK; el(g, -40, 0, 15, 15);
    g.fillStyle = CREAM; el(g, -44, -6, 3.5, 3.5); el(g, -44, 6, 3.5, 3.5);
    g.fillStyle = 'rgba(255,240,220,.35)'; el(g, 12, -14, 10, 5);
    g.lineCap = 'butt';
    prop(g, 'bug', -72, -52, 58, 52);
    if (label && la > 0) {
      g.save(); g.globalAlpha *= la; g.rotate(-(rot || 0));
      /* r2: the tag sits above the bug, between the kiosk's header and its ports */
      onprop(function () { chip(g, label, -26, -74, { px: 30, wt: 900, st: 'condensed', bg: PAPER, fg: INK, r: 10, rot: .03, maxw: 360 }); });
      g.restore();
    }
    g.restore();
  }

  /* ---------- the re-created FBI Denver post (no avatar image, no logo), word for word, cut with "…" ---------- */
  var POSTL = ['“AVOID USING FREE CHARGING', 'STATIONS IN AIRPORTS, HOTELS', 'OR SHOPPING CENTERS.', 'BAD ACTORS HAVE FIGURED OUT', 'WAYS TO USE PUBLIC USB', 'PORTS TO INTRODUCE', 'MALWARE…”'];
  var PSX = -440, PSY = 470, PSW = 540, PSH = 500, PPAD = 32, PPX = 0;
  function postCard(g, t, ul) {
    var x0 = PSX, y0 = PSY;
    sheet(g, x0, y0, x0 + PSW, y0 + PSH, 3401, PAPER, 'post card');
    g.fillStyle = '#cfc6b2'; el(g, x0 + 58, y0 + 62, 32, 32);
    g.fillStyle = '#b9ae96'; el(g, x0 + 58, y0 + 54, 11, 11); el(g, x0 + 58, y0 + 80, 19, 12);
    /* the marker (amber, behind the words) runs under the FBI's second sentence as it is said */
    /* r2: one size for every line, fitted inside 32 px of padding (the quote no longer touches the card's right edge) */
    if (!PPX) { font(g, 38, 900, DISP, 'condensed'); var mw = Math.max.apply(null, POSTL.map(function (L) { return g.measureText(L).width; })); PPX = Math.max(32, Math.min(38, Math.floor(38 * (PSW - 2 * PPAD) / mw))); }
    if (ul > 0) {
      font(g, PPX, 900, DISP, 'condensed');
      for (var i = 3; i < 7; i++) {
        var k = clamp(ul * 4 - (i - 3), 0, 1); if (k <= 0) continue;
        var lw = Math.min(PSW - 2 * PPAD, g.measureText(POSTL[i]).width);
        g.fillStyle = 'rgba(240,168,58,.55)'; g.fillRect(x0 + PPAD - 4, y0 + 148 + i * 45 - 4 + (38 - PPX) / 2, (lw + 8) * k, PPX * .9);
      }
    }
    onprop(function () {
      txt(g, 'FBI Denver', x0 + 104, y0 + 46, 42, INK, 'left', 900, DISP, 300, 1, 36, 'condensed');
      txt(g, 'Apr 6, 2023', x0 + 104, y0 + 88, 34, '#5d564c', 'left', 800, DISP, 300, 1, 32, 'condensed');
      POSTL.forEach(function (L, i) { txt(g, L, x0 + PPAD, y0 + 162 + i * 45, PPX, INK, 'left', 900, DISP, PSW - 2 * PPAD, 1, 30, 'condensed'); });
      tag(g, 'RE-CREATED', x0 + PSW - 140, y0 + PSH - 34, 1, 0, 240, INK, PAPER, 36);
    });
  }
  /* the slot under the post: FBI POST CASES: [ ], stamped NONE NAMED (the hero stamp) on the slap */
  var CSY = 1046, BUGY = 820;   /* r2: the bug settles on the top port, clear of the CASES slot when it grows */
  var BIGX = 140 - 540, BIGY = 1026, BIGW = 750;   /* screen x 140 at the pan (PANX 540) */
  function casesPlate(g, t, sc, big, low) {
    var x0 = PSX, y0 = CSY, w = PSW, h = 200, bs = lerp(1, BIGW / PSW, big), ls = lerp(1, .7, low || 0);
    g.save(); g.translate(x0, y0 + 204 * (low || 0)); g.scale(ls, ls); g.translate(-x0, -y0);   /* polish: under the bigger LAB box, the plate sits low and small */
    g.translate(lerp(x0, BIGX, big), lerp(y0, BIGY, big)); g.scale(bs, bs); g.translate(-x0, -y0);
    g.translate(x0 + w / 2, y0 + h / 2); g.scale(sc, sc); g.translate(-(x0 + w / 2), -(y0 + h / 2));
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 8, y0 + 11, w, h, 16); g.fill();
    g.fillStyle = '#2a313d'; rr(g, x0, y0, w, h, 16); g.fill();
    rr(g, x0, y0, w, h, 16); grainIn(g, x0, y0, w, h, 3501, 1);
    g.strokeStyle = 'rgba(244,237,224,.5)'; g.lineWidth = 3; rr(g, x0, y0, w, h, 16); g.stroke();
    prop(g, 'cases plate', x0, y0, x0 + w, y0 + h);
    onprop(function () {
      txt(g, 'FBI POST', x0 + 30, y0 + 70, 40, '#cfc6b2', 'left', 900, DISP, 190, 1, 36, 'condensed');
      txt(g, 'CASES:', x0 + 30, y0 + 128, 60, CREAM, 'left', 900, DISP, 190, 1, 44, 'condensed');
    });
    g.save(); g.strokeStyle = 'rgba(244,237,224,.75)'; g.lineWidth = 4; g.setLineDash([16, 11]); g.lineDashOffset = -24 * t; rr(g, x0 + 222, y0 + 26, w - 248, h - 52, 14); g.stroke(); g.setLineDash([]); g.restore();
    if (t >= K.ST) { var ss = lerp(.72, 1, big); g.save(); g.translate(x0 + 222 + (w - 248) / 2, y0 + h / 2); g.scale(ss, ss); stamp(g, 'NONE\nNAMED', 0, 0, t, K.ST, 80, HOT, -.05); g.restore(); }
    g.restore();
  }
  /* the LAB box (world x −432…92, y 470…1030): dashed, so the lab result never reads as the street */
  var LBX = -432, LBY = 470, LBW = 524, LBH = 556;
  function labBox(g, t, ct) {
    var x0 = LBX, y0 = LBY;
    g.fillStyle = 'rgba(14,20,28,.95)'; rr(g, x0, y0, LBW, LBH, 18); g.fill();
    g.save(); g.strokeStyle = CREAM; g.lineWidth = 5; g.setLineDash([20, 13]); g.lineDashOffset = -20 * ct; rr(g, x0, y0, LBW, LBH, 18); g.stroke(); g.setLineDash([]); g.restore();
    prop(g, 'lab box', x0, y0, x0 + LBW, y0 + LBH);
    onprop(function () { chip(g, 'LAB', x0 + 74, y0 + 48, { px: 46, wt: 900, st: 'condensed', bg: CREAM, fg: INK, r: 10, shadow: false }); });
    /* the bench, the lab charger, the test phone (r2: a re-created Trust prompt on it, tapped by the charger's own finger) */
    g.fillStyle = '#7a5b3e'; g.fillRect(x0 + 22, y0 + 340, LBW - 44, 22); g.fillStyle = '#5c4430'; g.fillRect(x0 + 22, y0 + 360, LBW - 44, 6);
    var bx0 = x0 + 30, by0 = y0 + 214, bw = 184, bh = 126;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, bx0 + 6, by0 + 8, bw, bh, 10); g.fill();
    g.fillStyle = '#cbbfa6'; rr(g, bx0, by0, bw, bh, 10); g.fill(); rr(g, bx0, by0, bw, bh, 10); grainIn(g, bx0, by0, bw, bh, 3601, .7);
    g.fillStyle = '#8f846d'; el(g, bx0 + 38, by0 + 84, 18, 18); g.fillStyle = INK; g.save(); g.translate(bx0 + 38, by0 + 84); g.rotate(ct * 2); g.fillRect(-2, -16, 4, 14); g.restore();
    g.fillStyle = mixc(hex('#3d3833'), hex(AMBER), .5 + .5 * cyc(ct, 1)); el(g, bx0 + 164, by0 + 22, 7, 7);
    onprop(function () { txt(g, 'LAB CHARGER', bx0 + 88, by0 + 30, 32, INK, 'center', 900, DISP, 150, 1, 30, 'condensed'); });
    /* the test phone */
    var px0 = x0 + 304, py0 = y0 + 88, pw = 200, ph = 252, tap = Math.sin(Math.PI * seg(t, K.LT - .04, K.LT + .14)), pressed = seg(t, K.LT + .02, K.LT + .04) * (1 - seg(t, K.LT + .3, K.LT + .36));
    var gone = eio(seg(t, K.LT + .36, K.LT + .62)), inPh = seg(t, K.LB - .02, K.LB + .04), flash = inPh * (1 - seg(t, K.LB + .25, K.LB + .6));
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, px0 + 6, py0 + 8, pw, ph, 26); g.fill();
    g.fillStyle = PHB; rr(g, px0, py0, pw, ph, 26); g.fill();
    g.fillStyle = '#0c121b'; rr(g, px0 + 10, py0 + 10, pw - 20, ph - 20, 18); g.fill();
    if (flash > 0) { g.strokeStyle = HOT; g.globalAlpha = flash; g.lineWidth = 6; rr(g, px0 + 10, py0 + 10, pw - 20, ph - 20, 18); g.stroke(); g.globalAlpha = 1; }
    prop(g, 'test phone', px0, py0, px0 + pw, py0 + ph);
    if (gone < 1) {
      g.save(); rr(g, px0 + 10, py0 + 10, pw - 20, ph - 20, 18); g.clip(); g.translate(0, -230 * gone);
      var cx0 = px0 + 18, cy0 = py0 + 26, cw = pw - 36;
      g.fillStyle = '#ece5d8'; rr(g, cx0, cy0, cw, 196, 16); g.fill();
      var ex1 = EXITING; if (gone > 0) EXITING = true;
      onprop(function () {
        txt(g, 'Trust This', cx0 + cw / 2, cy0 + 26, 30, INK, 'center', 900, DISP, cw - 12, 1, 30, 'condensed');
        font(g, 30, 900, DISP, 'condensed'); var c1 = g.measureText('Computer').width, c2 = g.measureText('?').width;
        txt(g, 'Computer', cx0 + cw / 2 - (c1 + c2) / 2, cy0 + 58, 30, INK, 'left', 900, DISP, 0, 1, 30, 'condensed');
        txt(g, '?', cx0 + cw / 2 - (c1 + c2) / 2 + c1 + 1, cy0 + 58, 30, HOT, 'left', 900, DISP, 0, 1, 30, 'condensed');
      });
      [0, 1].forEach(function (i) {
        var by = cy0 + 86 + i * 52, on = i === 0 && pressed > 0, s2 = i === 0 ? 1 - .06 * tap : 1;
        g.save(); g.translate(cx0 + cw / 2, by + 21); g.scale(s2, s2);
        if (on) { g.fillStyle = HOT; rr(g, -cw / 2 + 8, -21, cw - 16, 42, 21); g.fill(); }
        g.strokeStyle = on ? HOT : 'rgba(33,29,38,.6)'; g.lineWidth = 3; rr(g, -cw / 2 + 8, -21, cw - 16, 42, 21); g.stroke();
        onprop(function () { txt(g, i ? "Don't Trust" : 'Trust', 0, 1, 30, on ? CREAM : INK, 'center', 900, DISP, cw - 30, 1, 30, 'condensed'); });
        g.restore();
      });
      EXITING = ex1; g.restore();
    }
    onprop(function () { tag(g, 'RE-CREATED', px0 + pw / 2, y0 + 48, 1, 0, 230, CREAM, 'rgba(16,22,28,.9)', 30); });
    /* the charger's own paper arm and finger: up out of the charger, over Trust, a tap by itself, then back down */
    var aim = eout(seg(t, K.LI + .04, K.LT - .06)), back = eio(seg(t, K.LT + .3, K.LT + .7));
    var tgx = px0 + 18 + (pw - 36) / 2 - 6, tgy = py0 + 26 + 86 + 21 + 4;
    /* jury r2 polish: a tan, cable-coloured jointed arm with a plain stylus tip (clearly the charger, not a person) */
    var bxa = bx0 + 150, bya = by0 + 6, rx = bxa + 4, ry = by0 - 40;
    var sxp = lerp(rx, tgx + 6, aim * (1 - back)), syp = lerp(ry, tgy - 34, aim * (1 - back)) + 30 * tap;
    if (aim > 0 && back < 1) {
      var exa = EXITING; EXITING = true;
      var ex2 = (bxa + sxp) / 2 - 24, ey2 = Math.min(bya, syp) - 70, dl = Math.hypot(sxp - ex2, syp - ey2) || 1, hx2 = sxp - (sxp - ex2) / dl * 44, hy2 = syp - (syp - ey2) / dl * 44;
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 16; g.beginPath(); g.moveTo(bxa + 4, bya + 6); g.lineTo(ex2 + 4, ey2 + 6); g.lineTo(hx2 + 4, hy2 + 6); g.stroke();
      g.strokeStyle = '#8f846d'; g.lineWidth = 16; g.beginPath(); g.moveTo(bxa, bya); g.lineTo(ex2, ey2); g.lineTo(hx2, hy2); g.stroke();
      g.strokeStyle = CABW; g.lineWidth = 10; g.beginPath(); g.moveTo(bxa, bya); g.lineTo(ex2, ey2); g.lineTo(hx2, hy2); g.stroke();
      g.fillStyle = '#8f846d'; el(g, bxa, bya, 11, 11); el(g, ex2, ey2, 10, 10); g.fillStyle = CABW; el(g, ex2, ey2, 5, 5);
      g.fillStyle = '#5c5446'; g.save(); g.translate(hx2, hy2); g.rotate(Math.atan2(syp - hy2, sxp - hx2)); rr(g, -8, -9, 18, 18, 4); g.fill(); g.restore();
      g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.moveTo(hx2, hy2); g.lineTo(sxp, syp); g.stroke();
      g.fillStyle = '#efe7d6'; el(g, sxp, syp, 6, 6);
      g.restore();
      EXITING = exa;
    }
    var P = labCable(), gi = 34;
    g.save(); g.lineCap = 'round'; pathOff(g, P, 0); g.strokeStyle = CABW; g.lineWidth = 16; g.stroke(); pathOff(g, P, 0); g.strokeStyle = CABC; g.lineWidth = 8; g.stroke(); g.restore();
    /* the bug walks the lab cable; the little gate lifts after the faked tap, and the bug gets into the test phone */
    var wk = seg(t, K.LI + .2, K.LB), u = t < K.LT + .2 ? .48 * eio(seg(t, K.LI + .2, K.LT)) : .48 + .52 * eio(seg(t, K.LT + .2, K.LB)), bi = Math.min(P.length - 1, Math.round(u * (P.length - 1)));
    var lift = seg(t, K.LT + .05, K.LT + .2) * (1 - seg(t, K.LB + .2, K.LB + .4)), gp = P[gi];
    g.save(); g.translate(gp[0], gp[1]); g.fillStyle = '#f6efe0'; g.fillRect(-4, -36, 8, 44); g.save(); g.translate(0, -30); g.rotate(-1.3 * lift); g.fillStyle = '#f6efe0'; g.fillRect(0, -4, 40, 9); g.fillStyle = HOT; g.fillRect(16, -4, 8, 9); g.restore(); g.restore();
    var bp = P[bi], bq = P[Math.min(P.length - 1, bi + 1)], ang = Math.atan2(bq[1] - bp[1], bq[0] - bp[0]);
    if (wk > 0 && wk < 1) bug(g, bp[0], bp[1] - 14, .5 * (1 - .6 * seg(u, .88, 1)), t, null, ang + Math.PI);
    onprop(function () {
      txt(g, 'IN THE LAB · TU GRAZ', x0 + 28, y0 + 400, 38, CREAM, 'left', 900, DISP, LBW - 56, 1, 36, 'condensed');
      txt(g, 'USENIX SECURITY 2025', x0 + 28, y0 + 442, 38, CREAM, 'left', 900, DISP, LBW - 56, 1, 36, 'condensed');
    });
    /* the line the lab result needs, slapped on the tap */
    if (t >= K.LT - .04) {
      var kf = eout(seg(t, K.LT - .04, K.LT + .04)), exf = EXITING; if (kf < 1) EXITING = true;
      onprop(function () { chip(g, 'IT FAKED THE TAP', x0 + LBW / 2, y0 + 504 - 16 * (1 - kf), { px: 54, wt: 900, st: 'condensed', bg: HOT, fg: CREAM, r: 12, rot: -.012, s: lerp(1.25, 1, kf), shadow: false, maxw: LBW - 40 }); });
      EXITING = exf;
    }
  }
  var LABC = null;
  function labCable() {
    if (LABC) return LABC;
    var A = [LBX + 214, LBY + 300], B = [LBX + 318, LBY + 322], P = [];
    for (var i = 0; i <= 60; i++) { var u = i / 60; P.push([lerp(A[0], B[0], u), lerp(A[1], B[1], u) + 16 * Math.sin(Math.PI * u)]); }
    P.forEach(function (p) { p.nx = 0; p.ny = 1; });
    return (LABC = P);
  }

  /* ---------- the search card: IS JUICE JACKING REAL, typed in ---------- */
  function searchCard(g, x, y, t, t0, a) {
    var sa = seg(t, t0, t0 + .12) * (a == null ? 1 : a);
    if (sa <= 0 || !LIVE.text) return;
    var w = 540, h = 96, x0 = x - w / 2, y0 = y - h / 2;
    g.save(); g.globalAlpha *= sa;
    var ex = EXITING; if (sa < 1) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 8, y0 + 10, w, h, 46); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 46); g.fill();
    prop(g, 'search card', x0, y0, x0 + w, y0 + h);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x0 + 50, y - 6, 15, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x0 + 61, y + 5); g.lineTo(x0 + 74, y + 18); g.stroke();
    var L = 'IS JUICE JACKING REAL', k = seg(t, t0 + .04, t0 + .5), n = Math.round(L.length * k), typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
    onprop(function () { if (n) txt(g, L.slice(0, n), x0 + 90, y + 3, 48, INK, 'left', 900, DISP, w - 116, 1, 44, 'condensed'); });
    NOREC = nr;
    EXITING = ex; g.restore();
  }
  /* the hook's plate: PROBABLY / YOUR PHONE ASKS FIRST (slammed on "probably", held to 5 s, peeled on the pan) */
  function probPlate(g, t, t0, out) {
    if (t < t0 - .06 || out >= 1) return;
    var k = eout(seg(t, t0 - .06, t0 + .06)), s = lerp(1.25, 1, k), eo = eio(out), w = 520, h = 124, x = 664, y = 524;
    var ex = EXITING; if (k < 1 || eo > 0) EXITING = true;
    g.save(); g.translate(x - 600 * eo, y + 40 * eo); g.rotate(-.015 - .15 * eo); g.scale(s, s); g.globalAlpha *= 1 - eo;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 8, -h / 2 + 11, w, h, 16); g.fill();
    g.fillStyle = CREAM; rr(g, -w / 2, -h / 2, w, h, 16); g.fill();
    rr(g, -w / 2, -h / 2, w, h, 16); grainIn(g, -w / 2, -h / 2, w, h, 1521, .6);
    prop(g, 'probably plate', -w / 2, -h / 2, w / 2, h / 2);
    onprop(function () {
      txt(g, 'PROBABLY', 0, -22, 66, INK, 'center', 900, DISP, w - 40, 1, 48, 'condensed');
      txt(g, 'YOUR PHONE ASKS FIRST', 0, 34, 44, '#4b4540', 'center', 900, DISP, w - 40, 1, 40, 'condensed');
    });
    g.restore(); EXITING = ex;
  }

  /* =====================================================================================================
     THE KIOSK: frame 0 is a 1.18× close-up on the phone settling 306 px onto its cable; the camera pulls out on
     "chargers"; on "2023" it pans to the wall beside the kiosk (the FBI post, the CASES slot), the bug, NONE NAMED,
     then the LAB box replaces the post
     ===================================================================================================== */
  var DY0 = -306, DX0 = -140, PANX = 540, KOFF = -90;   /* jury r2 polish: on the close-up the kiosk sits fully left of the safe box (no cream sliver at x 96–132) */
  function camK(g, z, dy, px) {
    var s = 1 + .18 * z, tx = lerp(PCX, 600, z) + (px || 0), ty = lerp(PCY, 1016, z) + (dy || 0);
    g.translate(tx, ty); g.scale(s, s); g.translate(-PCX, -PCY);
  }
  function camKState(t) {
    var gk = eout(seg(t, 0, .55));
    return { z: 1 - eio(seg(t, K.chargers - .05, K.chargers + .6)), dy: DY0 * (1 - gk), px: DX0 * (1 - gk) + PANX * eio(seg(t, K.warn - .15, K.warn + .55)) };
  }
  function kioskScene(g, t) {
    var c = camKState(t);
    if (LAYER === 'bg') { g.save(); camK(g, c.z, c.dy, c.px); terminal(g, t, t, t > 2.8 && t < K.asks ? frac((t - 2.8) / 6) : 0); g.restore(); return; }
    var moving = (c.z > 0 && c.z < 1) || (c.px > 0 && c.px < PANX);
    var exw = EXITING, cam0 = CAMONLY; if (moving) EXITING = true; CAMONLY = c.z > 0;
    g.save(); camK(g, c.z, c.dy, c.px);
    var seated = seg(t, K.HK, K.HK + .08), jig = 7 * (1 - eout(seg(t, K.HK - .12, K.HK))), kof = KOFF * c.z;
    g.save(); g.translate(kof, 0); kiosk(g, t, seg(t, K.chargers + .55, K.chargers + .75), seated); g.restore();
    var A = [KCX + kof, PORTY + 66 - jig], P = cablePts(A, [PCX, PCY + PHH / 2 - 2], 300);
    cable(g, P, 60 * t, 1, t);
    plug(g, KCX + kof, PORTY - jig, 1);
    if (c.px < 300) phoneFront(g, { btn: 0 });
    /* layout B, on the wall beside the kiosk (world x < 100) */
    var labIn = seg(t, K.LI, K.LI + .12), postOut = seg(t, K.LI - .03, K.LI + .27);
    if (t > K.warn - .15 && postOut < 1) {
      var eo = eio(postOut), exp = EXITING; if (eo > 0) EXITING = true;
      g.save(); g.translate(PSX, PSY + PSH); g.rotate(-.1 * eo); g.translate(-PSX, -(PSY + PSH)); g.translate(-640 * eo, 60 * eo);
      var pin = eout(seg(t, K.warn + .3, K.warn + .55));
      g.translate(0, -40 * (1 - pin));
      var swy = .007 * Math.sin((t - K.warned) * 2.6) * seg(t, K.warned, K.warned + .6) * (1 - seg(t, K.TW - .4, K.TW));   /* polish: the pinned post sways a hair, so 8.4–9.5 s never freezes */
      if (swy) { g.translate(PSX + PSW / 2, PSY); g.rotate(swy); g.translate(-(PSX + PSW / 2), -PSY); }
      postCard(g, t, seg(t, K.bad - .05, K.malware + .25));
      /* the scope chip under the post, on "FBI" */
      var sk = seg(t, K.fbiW - .05, K.fbiW + .1);
      if (sk > 0) { var exs = EXITING; if (sk < 1) EXITING = true; chip(g, 'FBI DENVER · ONE X POST · APR 6, 2023', PSX + PSW / 2, PSY + PSH + 27 + 12 * (1 - sk), { px: 32, wt: 900, st: 'condensed', bg: INK, fg: CREAM, line: CREAM, lw: 3, r: 12, a: sk, maxw: PSW, shadow: false }); EXITING = exs; }
      /* the bug, lifted off the port on the slap and pinned beside MALWARE… on the post */
      var fly = eio(seg(t, K.TW + .05, K.TW + .5));
      if (fly > 0 && fly < 1) EXITING = true;   /* in flight: a moving prop, not measured */
      if (fly > 0) bug(g, lerp(KCX + 4, PSX + 250, fly), lerp(BUGY, PSY + 162 + 6 * 45, fly) - 120 * Math.sin(Math.PI * fly), lerp(1, .62, fly), t, null, lerp(0, -.5, fly));
      g.restore(); EXITING = exp;
    }
    if (t > K.warned - .1) {
      var lowK = eio(seg(t, K.LI, K.LI + .3)), big = eio(seg(t, K.post - .05, K.post + .3)) * (1 - lowK), exc = EXITING; if ((big > 0 && big < 1) || (lowK > 0 && lowK < 1)) EXITING = true;
      casesPlate(g, t, 1 + .05 * Math.sin(Math.PI * seg(t, K.TW - .02, K.TW + .22)), big, lowK); EXITING = exc;
    }
    /* the bug drops onto port 3 on "malware" and sits there (never inside the phone) */
    /* it crawls in from the right on "said", over the kiosk's face, and settles on the port on "malware" */
    var drop = seg(t, at('fear', 'said'), K.malware + .3), fly0 = seg(t, K.TW + .05, K.TW + .5);
    if (drop > 0 && fly0 <= 0) {
      var cu = drop, cxb = lerp(KCX + 190, KCX + 4, cu) + 18 * Math.sin(cu * 9) * (1 - cu), cyb = lerp(660, BUGY, cu * cu);
      var ang = drop < 1 ? Math.atan2(lerp(660, BUGY, Math.min(1, (cu + .02)) * Math.min(1, (cu + .02))) - cyb, lerp(KCX + 190, KCX + 4, Math.min(1, cu + .02)) - cxb + 1e-6) + Math.PI : 0;
      var sq = 1 + .05 * Math.sin(Math.PI * seg(t, K.FE - .02, K.FE + .16));
      var exb = EXITING; if (drop < 1) EXITING = true;
      g.save(); g.translate(cxb, cyb); g.scale(sq, 2 - sq); bug(g, 0, 0, 1, t, 'MALWARE (CLAIMED)', drop < 1 ? ang : 0, seg(t, K.malware + .25, K.malware + .4)); g.restore();
      EXITING = exb;
    }
    if (labIn > 0) {
      var exl = EXITING; if (labIn < 1) EXITING = true;
      var lbs = 1.22 * (1 + .12 * eout(seg(t, K.LT - .04, K.LT + .22)));       g.save(); g.translate(-620 * (1 - eout(labIn)), 0); g.translate(100 - PANX, 440); g.scale(lbs, lbs); g.translate(-LBX, -LBY); labBox(g, t, t); g.restore(); EXITING = exl;
    }
    /* the date card under the slot: 2023, flipped to 2025 for the lab */
    var dyr = at('warn', '2023,');
    if (t > dyr - .1 && (t < K.LI + .02 || t >= K.LI + .22)) { var d25 = t >= K.LI + .3; slapCard(g, d25 ? '2025' : '2023', d25 ? 566 - PANX : PSX + 120, d25 ? 1316 : 1352, t, d25 ? K.LI + .3 : dyr, d25 ? 50 : 56, 220); }
    g.restore(); EXITING = exw; CAMONLY = cam0;
    /* screen-space: the hook plate and the search card */
    probPlate(g, t, K.probably, seg(t, K.warn - .25, K.warn + .15));
    var sqk = .045 * Math.sin(Math.PI * seg(t, K.ask - .02, K.ask + .3)) + .035 * Math.sin(Math.PI * seg(t, K.real - .02, K.real + .3));   /* polish: the search card taps on "So," and "real?" (3.2–4.5 s never sits still) */
    g.save(); if (sqk) { g.translate(918, 1378); g.scale(1 + sqk, 1 + sqk); g.translate(-918, -1378); }
    searchCard(g, 652, 1378, t, 1.4, 1 - seg(t, K.warn + .45, K.warn + .6)); g.restore();
  }

  /* =====================================================================================================
     INSIDE THE CABLE (screen space): POWER above, DATA below, the gate on the data lane with its sign board.
     The board says ASKS FIRST, then shows the re-created iPhone and Android prompts, then the press and the slam.
     ===================================================================================================== */
  var TY0 = 930, TY1 = 1250, GX0 = 472, GX1 = 548, GPX0 = 440, GPX1 = 580, BRX0 = 150, BRX1 = 870, BRY0 = 472, BRY1 = 880;
  function tube(g, t) {
    wall(g, '#161d28');
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-300, TY0 + 10, W + 600, TY1 - TY0);
    g.fillStyle = CABW; g.fillRect(-300, TY0, W + 600, TY1 - TY0);
    g.fillStyle = CABC; g.fillRect(-300, TY0 + 20, W + 600, TY1 - TY0 - 40);
    g.fillStyle = '#3a3f48'; g.fillRect(-300, 1086, W + 600, 8);
    g.save(); g.beginPath(); g.rect(-300, TY0, W + 600, TY1 - TY0); grainIn(g, -300, TY0, W + 600, TY1 - TY0, 4101, .8); g.restore();
  }
  function wall(g, c) {
    g.fillStyle = c || '#151b25'; g.fillRect(-300, -300, W + 600, H + 600);
    g.fillStyle = 'rgba(255,255,255,.018)'; for (var x = -300; x < W + 300; x += 96) g.fillRect(x, -300, 40, H + 600);
  }
  function lanes(g, t, ph, push) {
    /* power: amber dashes flowing right all the time, through the gate's posts */
    g.save(); g.beginPath(); g.rect(260, 960, 580, 120); g.clip();
    g.fillStyle = AMBER; for (var x = -200 + (ph % 110); x < 900; x += 110) { rr(g, x, 1004, 70, 30, 8); g.fill(); }
    g.restore();
    /* data: four cream file packets queued at the gate, nudging it */
    for (var i = 0; i < 3; i++) {
      var x0 = GX0 - 70 - i * 60 + push * [1, .5, .15][i] + 3 * cyc(t, .9, i * .2);
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 - 22 + 4, 1130 + 6, 48, 56, 6); g.fill();
      g.fillStyle = '#f2ebde'; rr(g, x0 - 22, 1130, 48, 56, 6); g.fill();
      g.fillStyle = '#cfc6b2'; poly(g, [[x0 + 12, 1130], [x0 + 26, 1130], [x0 + 26, 1144]]); g.fill();
      g.fillStyle = 'rgba(33,29,38,.4)'; g.fillRect(x0 - 14, 1150, 28, 4); g.fillRect(x0 - 14, 1160, 22, 4); g.fillRect(x0 - 14, 1170, 26, 4);
    }
    onprop(function () {
      txt(g, 'POWER', 142, 1020, 40, LAMBER, 'left', 900, DISP, 140, 1, 36, 'condensed');
      txt(g, 'DATA', 142, 1160, 40, CREAM, 'left', 900, DISP, 140, 1, 36, 'condensed');
    });
  }
  /* the gate: two posts from the data lane up to the board, a barred panel that drops across the data lane */
  function gate(g, lift) {
    [GX0, GX1 - 10].forEach(function (x) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x + 6, BRY1 - 10, 10, TY1 - BRY1 + 4); g.fillStyle = '#efe5d0'; g.fillRect(x, BRY1 - 14, 10, TY1 - BRY1 - 6); });
    prop(g, 'gate posts', GX0, BRY1 - 14, GX1, TY1 - 20);
    var y0 = 1048 - lift, h = 204, pw = GPX1 - GPX0;   /* jury r2 polish: a 140 px panel in front of the posts */
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, GPX0 + 10, y0 + 8, pw, h, 6); g.fill();
    g.fillStyle = '#f6efe0'; rr(g, GPX0, y0, pw, h, 6); g.fill();
    g.save(); rr(g, GPX0, y0, pw, h, 6); grainIn(g, GPX0, y0, pw, h, 4111, .7); g.restore();
    g.fillStyle = '#c9bfa8'; for (var i = 0; i < 7; i++) g.fillRect(GPX0 + 10, y0 + 14 + i * 26, pw - 20, 8);
    g.fillStyle = HOT; g.fillRect(GPX0, y0 + h - 16, pw, 8);
    prop(g, 'gate panel', GPX0, y0, GPX1, y0 + h);
  }
  /* the power lane runs through the gate whatever it does */
  function powerThrough(g, ph) {
    g.save(); g.beginPath(); g.rect(GPX0 - 2, 960, GPX1 - GPX0 + 4, 120); g.clip();
    g.fillStyle = AMBER; for (var x = -200 + (ph % 110); x < 900; x += 110) { rr(g, x, 1004, 70, 30, 8); g.fill(); }
    g.restore();
  }
  function phoneSlab(g) {
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 836 + 8, 904 + 10, 76, 372, 26); g.fill();
    g.fillStyle = PHB; rr(g, 836, 904, 76, 372, 26); g.fill();
    rr(g, 836, 904, 76, 372, 26); grainIn(g, 836, 904, 76, 372, 4201, .9);
    g.fillStyle = '#0c0e12'; rr(g, 836, 990, 16, 220, 6); g.fill();
    g.strokeStyle = 'rgba(244,237,224,.5)'; g.lineWidth = 3; rr(g, 836, 904, 76, 372, 26); g.stroke();
    prop(g, 'phone slab', 836, 904, 920, 1276);
  }
  /* the board's faces: 0 ASKS FIRST, 1 the re-created iPhone alert, 2 the re-created Android card */
  function board(g, face, sx, rise, press, hov) {
    var cx = (BRX0 + BRX1) / 2, w = BRX1 - BRX0, h = BRY1 - BRY0;
    g.save(); g.translate(cx, BRY0 + h / 2 + rise); g.scale(sx, 1); g.translate(-cx, -(BRY0 + h / 2));
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, BRX0 + 10, BRY0 + 14, w, h, 22); g.fill();
    g.fillStyle = '#e9e1cf'; rr(g, BRX0, BRY0, w, h, 22); g.fill();
    rr(g, BRX0, BRY0, w, h, 22); grainIn(g, BRX0, BRY0, w, h, 4301 + face, .6);
    g.strokeStyle = '#8f846d'; g.lineWidth = 6; rr(g, BRX0 + 8, BRY0 + 8, w - 16, h - 16, 16); g.stroke();
    g.fillStyle = '#8f846d'; [[BRX0 + 26, BRY0 + 26], [BRX1 - 26, BRY0 + 26], [BRX0 + 26, BRY1 - 26], [BRX1 - 26, BRY1 - 26]].forEach(function (p) { el(g, p[0], p[1], 6, 6); });
    prop(g, 'board', BRX0, BRY0, BRX1, BRY1);
    onprop(function () {
      if (face === 0) {
        txt(g, 'ASKS FIRST', cx, BRY0 + 190, 124, INK, 'center', 900, DISP, w - 80, 1, 60, 'condensed');
        g.fillStyle = HOT; g.fillRect(cx - 160, BRY0 + 250, 320, 10);
      } else if (face === 1) {
        tag(g, 'RE-CREATED · iPHONE', BRX0 + 226, BRY0 + 62, 1, 0, 420, INK, '#e9e1cf', 36);
        g.fillStyle = '#f6f1e6'; rr(g, BRX0 + 60, BRY0 + 108, w - 120, 270, 24); g.fill();
        txt(g, 'Trust This Computer?', cx, BRY0 + 172, 58, INK, 'center', 900, DISP, w - 170, 1, 44, 'condensed');
        g.fillStyle = 'rgba(33,29,38,.2)'; g.fillRect(BRX0 + 84, BRY0 + 222, w - 168, 3);
        [['Trust', cx - 140], ["Don't Trust", cx + 140]].forEach(function (b, i) {
          var on = i === 1 && press > .92, hv = i === 0 ? hov[0] : hov[1];
          g.save(); g.translate(b[1], BRY0 + 296); var ps = 1 - .05 * (i === 1 ? Math.sin(Math.PI * clamp(press * 2, 0, 1)) : 0); g.scale(ps, ps);
          if (on) { g.fillStyle = HOT; rr(g, -122, -42, 244, 84, 42); g.fill(); }
          else if (i === 1 && hv > 0) { g.fillStyle = 'rgba(240,168,58,' + (.25 * hv).toFixed(3) + ')'; rr(g, -122, -42, 244, 84, 42); g.fill(); }
          g.strokeStyle = on ? HOT : 'rgba(33,29,38,.6)'; g.lineWidth = 4; rr(g, -122, -42, 244, 84, 42); g.stroke();
          txt(g, b[0], 0, 2, 46, on ? CREAM : INK, 'center', 900, DISP, 220, 1, 36, 'condensed');
          g.restore();
        });
      } else {
        tag(g, 'RE-CREATED · ANDROID 14+', BRX0 + 262, BRY0 + 62, 1, 0, 500, INK, '#e9e1cf', 36);
        g.fillStyle = '#f6f1e6'; rr(g, BRX0 + 44, BRY0 + 108, w - 88, 88, 20); g.fill();
        bolt(g, BRX0 + 92, BRY0 + 152, .9, '#4b4540');
        txt(g, 'Charging this device via USB', BRX0 + 128, BRY0 + 154, 42, INK, 'left', 800, DISP, w - 200, 1, 36, 'condensed');
        txt(g, 'Use USB for', BRX0 + 60, BRY0 + 238, 40, '#4b4540', 'left', 800, DISP, 400, 1, 36, 'condensed');
        g.fillStyle = '#f6f1e6'; rr(g, BRX0 + 44, BRY0 + 270, w - 88, 84, 20); g.fill();
        txt(g, 'File Transfer', BRX0 + 80, BRY0 + 314, 48, INK, 'left', 900, DISP, 400, 1, 36, 'condensed');
        g.strokeStyle = 'rgba(33,29,38,.6)'; g.lineWidth = 4; g.beginPath(); g.arc(BRX1 - 100, BRY0 + 312, 20, 0, 6.283); g.stroke();
        txt(g, 'MENUS VARY BY MAKER', cx, BRY1 - 0 - 22 + 0, 34, '#5d564c', 'center', 800, DISP, w - 80, 1, 30, 'condensed');
      }
    });
    g.restore();
  }
  function cableScene(g, t) {
    if (LAYER === 'bg') { tube(g, t); return; }
    var E0 = S('cable').t0;
    /* the gate's arm: shut, lifts a crack while the phone asks, slams on the press */
    /* r2: it lifts a crack while the phone asks, is cocked right up as the finger moves to Don't Trust, and drops 180 px */
    /* jury r2 polish: the panel stays down until the finger touches Don't Trust (NV − .12), then one .1 s lift-and-slam that lands on the knock */
    var ls0 = seg(t, K.NV - .12, K.NV), lift = 56 * Math.sin(Math.PI * Math.pow(ls0, .6)) * (ls0 < 1 ? 1 : 0) + 10 * Math.abs(decay(t, K.NV, 22, 10)) + 5 * Math.abs(decay(t, K.BU + .1, 30, 14));
    var lunge = 20 * Math.sin(Math.PI * ls0) * (ls0 < 1 ? 1 : 0);
    var bounce = -60 * eout(seg(t, K.NV, K.NV + .12)) * (1 - eio(seg(t, K.NV + .4, K.NV + .95))) - 10 * eio(seg(t, K.NV + .4, K.NV + .95));
    var push = 10 * eio(seg(t, K.asksW, K.asksW + .4)) + 14 * Math.sin(Math.PI * seg(t, K.BU - .02, K.BU + .22)) + 14 * Math.sin(Math.PI * seg(t, K.OC - .02, K.OC + .2)) + lunge + bounce;
    var pq = POSTERMODE ? 0 : eio(seg(t, K.NV - .05, K.NV + .25)) * (1 - eio(seg(t, K.NV + .75, K.NV + 1.15))), pz = 1 + .10 * pq;
    var pux = PUNCHX; PUNCHX = pq > .01;
    g.save(); g.translate(540, 1060); g.scale(pz, pz); g.translate(-540, -1060);
    lanes(g, t, 150 * t, push);
    phoneSlab(g);
    gate(g, lift);
    powerThrough(g, 150 * t);
    /* the board rises on the posts on "asks" */
    var rise = 420 * (1 - eout(seg(t, E0 - .47, E0 - .25)));
    var f1 = seg(t, K.iph + .36, K.iph + .62), f2 = seg(t, wend('os', 'Computer?') - .02, wend('os', 'Computer?') + .23), f3 = seg(t, wend('never', 'port,') - .15, wend('never', 'port,') + .15);
    var face = 0, fk = 0;
    if (f3 > 0) { face = f3 < .5 ? 2 : 1; fk = f3; } else if (f2 > 0) { face = f2 < .5 ? 1 : 2; fk = f2; } else if (f1 > 0) { face = f1 < .5 ? 0 : 1; fk = f1; }
    var sx = Math.max(.02, Math.abs(Math.cos(Math.PI * fk)));
    var ex = EXITING; if (rise > .5 || sx < .999) EXITING = true;
    var press = seg(t, K.NV - .26, K.NV - .12);
    var hovT = seg(t, K.trustN - .1, K.trustN + .1) * (1 - seg(t, K.allow, K.allow + .2)), hovD = seg(t, K.allow + .1, K.allow + .3);
    board(g, face, sx, rise, press, [hovT, hovD]);
    EXITING = ex;
    g.restore(); PUNCHX = pux;
    /* the finger: in on "public", over Trust on "Trust", slides to Don't Trust on "Allow", presses in the gap */
    var hin = eout(seg(t, K.publicN - .1, K.neverW + .1)), hout = eio(seg(t, K.NV + .35, K.NV + .8));
    if (hin > 0 && hout < 1) {
      var tx0 = lerp(cxBtn(0), cxBtn(1), eio(seg(t, K.allow, K.allow + .35))), ty0 = lerp(BRY0 + 370 + 6 * Math.sin(t * 5), BRY0 + 312, press);
      var tx = lerp(1100, tx0, hin) + 500 * hout, ty = lerp(1500, ty0, hin) + 300 * hout + 10 * press;
      var exh = EXITING; EXITING = true; g.save(); g.translate(tx, ty); g.rotate(1.05); g.translate(156, 36); hand(g); g.restore(); EXITING = exh;
    }
    /* lower band: TODAY, then TRUST ✕ / ALLOW ✕ and CHARGING STILL WORKS */
    var today = 1 - seg(t, K.publicN - .2, K.publicN);
    if (today > 0) chipCard(g, 'TODAY', 190, 1294, fin(t, E0 + .05, 4) * today, 48, 200, false);
    /* the lab caveat, kept with the prompt it beat (BRIEF §3b rule 3) */
    var cva = today * seg(t, E0 + .1, E0 + .2);
    if (cva > 0) {
      g.save(); g.globalAlpha = cva; g.strokeStyle = CREAM; g.lineWidth = 4; g.setLineDash([16, 10]); g.lineDashOffset = -16 * t; rr(g, 100, 1334, 820, 92, 14); g.stroke(); g.setLineDash([]); g.restore();
      chip(g, 'LAB', 160, 1380, { px: 36, wt: 900, st: 'condensed', bg: CREAM, fg: INK, r: 8, shadow: false, a: cva });
      onprop(function () {
        txt(g, 'A 2025 LAB CHARGER FAKED THE TAP', 214, 1359, 38, CREAM, 'left', 900, DISP, 690, cva, 36, 'condensed');
        txt(g, 'VENDORS ADDING FIXES · TU GRAZ', 214, 1401, 38, CREAM, 'left', 900, DISP, 690, cva, 36, 'condensed');
      });
    }
    chipCard(g, 'TRUST ✕', 236, 1378, fin(t, K.neverW + .08, 4), 52, 280, true);
    chipCard(g, 'ALLOW ✕', 500, 1378, fin(t, K.allow - .05, 4), 52, 280, true);
    var cs = seg(t, K.publicN, K.publicN + .1);
    if (cs > 0) txt(g, 'CHARGING STILL WORKS', 108, 1298, 40, LAMBER, 'left', 900, DISP, 480, cs, 36, 'condensed');
    txt(g, 'YOUR PHONE', 912, 1298, 38, CREAM, 'right', 900, DISP, 300, seg(t, E0 + .1, E0 + .3), 36, 'condensed');
  }
  function cxBtn(i) { return (BRX0 + BRX1) / 2 + (i ? 140 : -140); }

  /* =====================================================================================================
     BACK AT THE KIOSK: the plug pops out, the kiosk slides away, a wall outlet with a brick slides in and the cable
     plugs in; then the kiosk comes back, the plug goes back in, the camera pushes to frame 0's close-up, YES / NO
     ===================================================================================================== */
  function outlet(g, ct) {
    var x0 = 140, y0 = 820, w = 196, h = 340;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 8, y0 + 10, w, h, 16); g.fill();
    g.fillStyle = '#d3c9b3'; rr(g, x0, y0, w, h, 16); g.fill();
    rr(g, x0, y0, w, h, 16); grainIn(g, x0, y0, w, h, 1901, .7);
    prop(g, 'outlet', x0, y0, x0 + w, y0 + h);
    [y0 + 250].forEach(function (cy) { g.fillStyle = '#bdb29a'; rr(g, x0 + 48, cy - 40, 100, 80, 16); g.fill(); g.fillStyle = '#2b2622'; rr(g, x0 + 70, cy - 20, 10, 30, 3); g.fill(); rr(g, x0 + 116, cy - 20, 10, 30, 3); g.fill(); el(g, x0 + 98, cy + 22, 6, 6); });
    /* the brick in the upper outlet, its own USB port facing down */
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 34, y0 + 46, 140, 140, 18); g.fill();
    g.fillStyle = '#f2ebde'; rr(g, x0 + 28, y0 + 38, 140, 140, 18); g.fill();
    rr(g, x0 + 28, y0 + 38, 140, 140, 18); grainIn(g, x0 + 28, y0 + 38, 140, 140, 1911, .6);
    g.fillStyle = '#d8ceb8'; rr(g, x0 + 28, y0 + 150, 140, 28, 12); g.fill();
    bolt(g, x0 + 98, y0 + 96, .9, AMBER);
    prop(g, 'brick', x0 + 28, y0 + 38, x0 + 168, y0 + 178);
  }
  function backScene(g, t) {
    var tt = t - TEND + 1 / 30;
    var z = eio(seg(t, K.end - .05, K.end + .55)), gl = eio(seg(t, TEND - .55, TEND - 1 / 30));
    var dy = DY0 * (1 - eout(clamp(1 / 60, 0, .55) / .55)) * gl, dx0 = DX0 * (1 - eout(clamp(1 / 60, 0, .55) / .55)) * gl;
    if (LAYER === 'bg') { g.save(); camK(g, z, dy, dx0); terminal(g, t, tt, 0); g.restore(); return; }
    var kOut = eio(seg(t, K.use + .1, K.use + .5)), kBack = eio(seg(t, K.ever - .1, K.ever + .35)), kx0 = -470 * (kOut - kBack), kx = kx0 + KOFF * z;
    var oIn = eout(seg(t, K.use + .25, K.use + .65)), oOut = eio(seg(t, K.ever - .15, K.ever + .25)), ox = -480 * (1 - oIn + oOut);
    var pop = seg(t, K.use - .08, K.use + .05), back = eout(seg(t, K.ever + .25, K.ever + .5));
    var seatB = eout(seg(t, K.seatW - .1, K.seatW)), flow = 1 - seg(t, K.use - .05, K.use + .1);
    flow = Math.max(flow * (1 - seg(t, K.ever, K.ever + .1)), seg(t, K.seatW, K.seatW + .1) * (1 - seg(t, K.ever, K.ever + .2)), seg(t, K.ever + .45, K.ever + .6));
    var exw = EXITING, cam0 = CAMONLY; if ((z > 0 && z < 1) || (kx0 < -1 && kx0 > -469) || (ox < -1 && ox > -479)) EXITING = true; CAMONLY = z > 0;
    g.save(); camK(g, z, dy, dx0);
    if (kx0 > -469) { g.save(); g.translate(kx, 0); kiosk(g, tt, 1 - seg(z, 0, .02), t < K.ever + .45 ? 1 : 0); g.restore(); }
    if (ox > -479) { g.save(); g.translate(ox, 0); outlet(g, tt); g.restore(); }
    /* the cable's end: in the kiosk port → popped out and dangling → into the brick → back in the kiosk port */
    var kp = [KCX + kx, PORTY + 66 - 7 * seg(t, K.ever + .45, K.ever + .5)], dang = [330, 1130], br = [140 + 98 + ox, 820 + 178 + 20 + 14 * (1 - seatB)];
    var A;
    if (t < K.use) A = kp;
    else if (t < K.own - .1) A = [lerp(kp[0], dang[0], eout(pop)), lerp(kp[1], dang[1], eout(pop)) - 60 * Math.sin(Math.PI * pop)];
    else if (t < K.ever + .2) A = [lerp(dang[0], br[0], eio(seg(t, K.own - .1, K.seatW))), lerp(dang[1], br[1], eio(seg(t, K.own - .1, K.seatW)))];
    else A = [lerp(br[0], kp[0], back), lerp(br[1], kp[1], back)];
    var P = cablePts(A, [PCX, PCY + PHH / 2 - 2], 300);
    cable(g, P, 60 * tt, flow, tt);
    if (t < K.use || t >= K.ever + .5) plug(g, A[0], A[1] - 66, 1);
    else { g.fillStyle = '#efe7d6'; rr(g, A[0] - 22, A[1] - 34, 44, 40, 8); g.fill(); }
    CURT_T = t;
    var prA = 1 - eio(seg(t, K.use - .06, K.use + .1)) + eout(seg(t, K.prBack, K.prBack + .2));
    var chA = seg(t, K.seatW, K.seatW + .12) * (1 - seg(t, K.prBack - .05, K.prBack + .1));
    phoneFront(g, { btn: 0, pr: clamp(prA, 0, 1), chg: chA });
    g.restore(); EXITING = exw; CAMONLY = cam0;
    /* the FBI's own advice, word for word, cut with "…" */
    qplate(g, 108, 1290, 804, ['“…USE AN ELECTRICAL OUTLET INSTEAD.”'], 44, ['FBI DENVER · APR 6, 2023'], 3301, seg(t, K.use - .15, K.use - .05), seg(t, K.yesE - .2, K.yesE), false, 38);
    /* YES / NO, cream, neither highlighted; they shrink away before the cut */
    var yo = eio(seg(t, K.noEnd + .06, K.noEnd + .26));
    [['YES', 330], ['NO', 690]].forEach(function (c) {
      var tq0 = c[0] === 'YES' ? K.yesE : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), kc = eout(seg(t, K.trustE - .1, K.trustE + .1)), sc = lerp(1.08, 1, kc) * (1 - .07 * tp) * (1 - yo);
      if (sc <= .01 || kc <= 0) return;
      var oc = ONPROP, ex0 = EXITING; ONPROP = true; EXITING = ex0 || yo > 0 || kc < 1; chip(g, c[0], c[1], 546 + 8 * tp + 7 * Math.sin(t * 4.2 + (c[0] === 'YES' ? 0 : 2.1)) * kc, { px: 112, wt: 900, bg: BG, line: CREAM, lw: 8, fg: CREAM, w: 250, h: 160, r: 54, shadow: true, a: kc * (1 - seg(yo, .5, .9)), s: sc, maxw: 250 }); ONPROP = oc; EXITING = ex0;
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
  var CAPGROUPS = { hook: [[2], [2, 2]], ask: [[1, 4]], warn: [[2, 5]], fear: [[3, 3], [2, 3]], twist: [[4, 3]], lab: [[3, 4]], asks: [[4, 4]], os: [[2, 3], [3, 2]], never: [[4], [3, 2]], wall: [[4], [5]], end: [[3, 4], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'probably'], ['ask', 'real?'], ['warn', 'FBI'], ['fear', 'malware.'], ['twist', 'no'], ['lab', 'labs.'], ['asks', 'asks'], ['os', 'Android'], ['never', 'never'], ['wall', 'own'], ['end', 'Trust']]
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
  var NOISE, SCENES = { kioskScene: kioskScene, cableScene: cableScene, backScene: backScene };
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
    g.fillText('Can a public USB charger', CX, 310);
    var b = 'steal your data?', bp = 62, by = 392; font(g, bp, 800, DISP, 'expanded');
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
  var GAIN = { hk: .45, fe: .15, tw: .11, lb: .3, oc: .3, nv: .2, wl: .3 };
  var TYPE = { fe: 'knock', tw: 'slap', lb: 'click', oc: 'click', nv: 'knock', wl: 'pop' };
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
    function popS(t, g) { g = g || 1; var o = osc('sine', 520, t, t + .1, 1, [[t, 0], [t + .003, .4 * g], [t + .09, 0]], .02); o.frequency.exponentialRampToValueAtTime(260, t + .09); paperHit(t, g * .9); }
    EV.forEach(function (e) {
      if (e.type === 'pop') popS(e.t, e.g);
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
  /* the hero hold: NONE NAMED, from the slap through the lab line */
  var HOLD = { t0: K.twistEnd, t1: K.lab };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((K.NV + .35) * 30) / 30 + 1 / 60, SLUG: 'juicejacking', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
