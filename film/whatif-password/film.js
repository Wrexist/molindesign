/* "What if your password were 20 letters long?" — Factory #23 on Tech, explained (How tech works), after ../energy/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   One hand-made hero prop: an 800 px paper password field with 20 ruled cells and paper letter tiles, under an 800 px
   paper tag that carries the letter count and the crack-time stamp. The native move is the typed tile drop. The count
   and the stamp change on the same frame, or both are blank while tiles are typing. One hero stamp: 4 QUADRILLION YEARS
   (coral, OUR MATH); coral is also on the end card's YES / NO and nowhere else. Every Hive Systems number sits over the
   condition plate (random password, stolen bcrypt hash, 16× RTX 5090, Hive Systems 2026). Defensive only: no tool,
   wordlist or method. Every scene is clipped to the safe box x 90–930, y 300–1430. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', INK = '#211d26', TAGP = '#efe2c4';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var SAFE_BOX = { x0: 92, y0: 302, x1: 928, y1: 1428 };

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

  /* the hits are placed from the heard words before anything is timed off them (see the SFX gate below) */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  var lastE = EDGES.length ? Math.max.apply(null, EDGES) : -1;
  VO.lines.forEach(function (l) { if (l.t0 > lastE + .3) l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 + .15 }); EDGES.push(w.t0, w.t1 + .15); }); });
  /* where a line's voice really stops (its last word rings past the vo.js end) */
  function voiceEnd(id, before) { var e = lend(id); VOICED.forEach(function (v) { if (v.t0 < lend(id) + .3 && v.t1 > e && v.t1 < before) e = v.t1; }); return e; }
  var BODY = { thump: .2, knock: .14, slap: .1, rattle: .13, paper: .17, pop: .12, click: .06 };
  var GT = {};
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  /* placed by the voice-only energy (VOICED, 0.15 s clear) inside a window; the SFX gate on the mix has the last word */
  function vplace(name, type, lo, hi) {
    var body = BODY[type], a = lo, b = hi;
    VOICED.forEach(function (v) { if (v.t1 + .15 > a && v.t1 < (a + b) / 2) a = v.t1 + .15; if (v.t0 - .15 < b && v.t0 > (a + b) / 2) b = v.t0 - .15; });
    GT[name] = b - a >= body ? +(((a + b - body) / 2)).toFixed(3) : null;
  }
  var K = {
    hookEnd: lend('hook'), ask: start('ask'), askEnd: lend('ask'),
    what: start('whatif'), twentyW: at('whatif', 'twenty'), whatEnd: lend('whatif'),
    times: start('times'), lower: at('times', 'lowercase'), timesEnd: lend('times'),
    nine: start('nine'), nineEnd: lend('nine'),
    twelve: start('twelve'), twelveEnd: lend('twelve'),
    eighteen: start('eighteen'), stops: at('eighteen', 'stops'), eighteenEnd: lend('eighteen'),
    twenty: start('twenty'), math: wend('twenty', 'math'), four: at('twenty', 'four'), twentyEnd: lend('twenty'),
    dip: start('dip'), instantly: at('dip', 'instantly'), dipEnd: lend('dip'),
    nist: start('nist'), guide: at('nist', 'guidelines'), fifteen: at('nist', 'fifteen'), nistEnd: lend('nist'),
    mfa: start('mfa'), on: at('mfa', 'on'), stolen: at('mfa', 'stolen'), mfaEnd: lend('mfa'),
    end: start('end'), yes: at('end', 'yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  (function () {
    place('slap8', 'slap', voiceEnd('hook', K.ask) + .06, .19, K.hookEnd, K.ask);
    place('popW', 'pop', K.what - .3, .17, K.askEnd, K.what);
    place('k9', 'click', voiceEnd('times', K.nine) + .05, .155, K.timesEnd, K.nine + .05);
    place('k12', 'knock', voiceEnd('nine', K.twelve) + .12, .155, K.nineEnd, K.twelve + .05);
    place('k18', 'rattle', voiceEnd('twelve', K.eighteen) + .08, .155, K.twelveEnd, K.eighteen + .05);
    place('rip', 'paper', voiceEnd('eighteen', K.twenty) + .05, .17, K.eighteenEnd, K.twenty - .35);
    place('tape', 'click', K.math + .2, .155, K.math, K.four);
    /* key-tick rattles in the real gaps while tiles type (12 → 18) */
    GT.kt1 = 12.78;                                        /* voice-only is under −60 dB from 12.70; clear of the heard edges at 12.60 and 13.10 */
    vplace('kt2', 'rattle', 14.96, 15.44);
    place('slam', 'thump', voiceEnd('twenty', K.dip) + .03, .19, K.twentyEnd, K.dip - .9);
    place('crack', 'slap', voiceEnd('dip', K.nist) + .05, .17, K.dipEnd, K.nist);
    place('popC', 'pop', voiceEnd('nist', K.mfa) + .04, .17, K.nistEnd, K.mfa);
    place('block', 'knock', voiceEnd('mfa', K.end) + .1, .17, K.mfaEnd, K.end - .05);
  })();
  /* the beats: count + stamp change on one frame (C*); typing starts (TS*) blank both on one frame */
  K.S8 = at('hook', 'two') + .11;                         /* 8 + 2 WEEKS ink on "Two" (heard onset ≈ 1.53 s); the slap presses it in the gap */
  K.P8 = GT.slap8;
  K.HS = 2.0;                                             /* frame 0's headline → the search phrase */
  K.dash = GT.popW != null ? GT.popW : K.what - .25;      /* cells 9–20 roll out */
  K.C9 = GT.k9 != null ? GT.k9 : K.nine - .08;
  K.C12 = GT.k12 != null ? GT.k12 : K.twelve - .05; K.TS12 = K.C12 - .3;
  K.C18 = GT.k18 != null ? GT.k18 : K.eighteen - .05; K.TS18 = K.C18 - .36;
  K.RIP = GT.rip != null ? GT.rip : K.eighteenEnd + .12;
  K.T20 = K.twenty - .02; K.TS20 = K.T20 - .26;
  K.TAPE = GT.tape != null ? GT.tape : K.math + .15;
  K.SLAM = GT.slam != null ? GT.slam : voiceEnd('twenty', K.dip) + .05;
  K.HERO0 = at('twenty', 'four') - .02;                   /* the hero count + stamp ink on "four" (one frame); the thump presses it in the gap */
  K.W1 = K.dip - .04;                                      /* the hold ends in silence, before "But" */
  K.PEEL1 = K.W1 - .17; K.PEEL0 = K.PEEL1 - .12;           /* before the tear: the stamp peels, the count and the ladder values blank (one state) */
  K.GRP = Math.round(DUR * 30) / 30 - .3;                 /* the last 0.3 s: frame 0's field slides up out of the envelope */
  K.YNOFF = 36.55;                                         /* YES / NO stay up until here */
  K.INST = K.instantly;
  K.CRACK = GT.crack != null ? GT.crack : K.dipEnd + .15;
  K.W2 = K.guide + .05;
  K.CIS = GT.popC != null ? GT.popC : K.mfa - .25;
  K.BLOCK = GT.block != null ? GT.block : K.mfaEnd + .15;

  var SW = .33;
  var SC = [
    { id: 'ladder', fn: 'ladder', name: 'Eight to twenty', t0: 0 },
    { id: 'dip', fn: 'dipScene', name: 'Reused: instantly', t0: K.W1 + SW, swipe: true, sw: SW },
    { id: 'nist', fn: 'nistScene', name: 'Fifteen, two-step, the question', t0: K.W2 + SW, swipe: true, sw: SW }
  ];
  var SHOTS;
  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- measuring: the safe area (BOUNDS_RUN), what is readable (TEXTS → readcheck) and labels vs props (LABELS_RUN) ---------- */
  var BOUNDS = null, REC = null, PROPS = null, LBL = null, INCOMING = false, CURT = 0, NOREC = false, EXITING = false, ONPROP = false, CHIPBOX = null, COVTOP = -1e9, INTOP = -1e9;
  var SAFE = { x0: 95, x1: 925, y1: 1450 };
  function xbox(g, x0, y0, x1, y1) {
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
  }
  function recBound(g, b, text) {
    if (!BOUNDS || INCOMING || EXITING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;   /* EXITING: a prop peeling out under the clip */
    if (b[2] < SAFE_BOX.x0 || b[0] > SAFE_BOX.x1 || b[1] > SAFE_BOX.y1 || b[3] < SAFE_BOX.y0) return;   /* fully outside the scene clip: never drawn */
    if (b[0] < SAFE.x0 - .5 || b[2] > SAFE.x1 + .5 || b[3] > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(b[0]), x1: Math.round(b[2]), y1: Math.round(b[3]) });
  }
  function recBox(g, x0, y0, x1, y1, text) { if (BOUNDS) recBound(g, xbox(g, x0, y0, x1, y1), text); }
  function prop(g, name, x0, y0, x1, y1) {
    if (!PROPS || INCOMING || (g !== ctx && g !== tctx)) return;
    var b = xbox(g, x0, y0, x1, y1); if (b[1] < COVTOP) return; PROPS.push({ name: name, b: b });
  }
  function seen(g, text, b) {
    var vis = (INCOMING ? b[3] <= INTOP : b[1] >= COVTOP) && !NOREC && g.globalAlpha >= .95 && (g === ctx || g === tctx) && b[3] > SAFE_BOX.y0 && b[1] < SAFE_BOX.y1;
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
  /* quiet tags (EXAMPLE, OUR DRAWING, RE-CREATED): cream outline, never coral */
  function tag(g, text, x, y, a, rot, maxw, col, bg) { chip(g, text, x, y, { px: 40, wt: 700, fam: MONO, line: col || CREAM, lw: 3, fg: col || CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: bg || 'rgba(21,19,27,.9)', maxw: maxw || 820 }); }
  function onprop(fn) { var o = ONPROP; ONPROP = true; fn(); ONPROP = o; }
  function dashRect(g, x, y, w, h, r, col, lw, dash, phase) { g.save(); g.setLineDash(dash || [16, 12]); g.lineDashOffset = phase || 0; g.strokeStyle = col; g.lineWidth = lw || 4; rr(g, x, y, w, h, r); g.stroke(); g.restore(); }

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
  /* full opacity from its first frame (the count beside it changes on the same frame); only the size settles */
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
     PROPS (all paper)
     ===================================================================================================== */
  function grainIn(g, x0, y0, w, h, seed, k) {
    var r = mulberry(seed), n = Math.floor(w * h / 160);
    g.save(); g.clip();
    for (var i = 0; i < n; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,' + (.09 * (k || 1)) + ')' : 'rgba(255,255,255,' + (.10 * (k || 1)) + ')'; g.fillRect(x0 + r() * w, y0 + r() * h, 1.6 + r() * 1.8, 1.6 + r() * 1.8); }
    g.restore();
  }
  function sheet(g, x0, y0, x1, y1, seed, col, amp, name) {
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x0 + 8, y0 + 11, x1 - x0 - 8, y1 - y0 - 11);
    g.fillStyle = col || PAPER; cut(g, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], mulberry(seed), amp == null ? 1.3 : amp);
    g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); grainIn(g, x0, y0, x1 - x0, y1 - y0, seed + 1);
    prop(g, name || 'sheet', x0, y0, x1, y1);
  }

  /* layout (rest positions; the frame-0 group sits 320 px lower and glides up) */
  var HL1 = 372, HL2 = 462;                 /* frame 0's headline, two lines */
  var TY0 = 500, TY1 = 790;                 /* the tag: count + crack-time stamp */
  var FY0 = 806, FY1 = 946;                 /* the field: 20 cells */
  var CHIPY = 978;                          /* the field's own tags */
  var PY0 = 1012, PY1 = 1198;               /* the condition plate */
  var LY0 = 1208, LY1 = 1424;               /* the ladder / the tray / ×26 / the second table */
  var F0OFF = 320, F0V = 3 * 320 / .95;     /* frame 0 glides 320 px up with eout over 0.95 s: start speed 3·320/0.95 px/s */
  var CELL = 38, CX0 = 130;                 /* cell i spans CX0 + i·CELL … + CELL */
  function cellX(i) { return CX0 + i * CELL + CELL / 2; }
  var LET20 = 'qxvmtrbekwfaznpdhylc', REUSE = 'sunnybeachdays';   /* 14 letters, so the count reads 14 LETTERS */

  /* ---------- the tag: an 800 × 290 paper card on two strings; left: the crack-time slot, right: the letter count ---------- */
  /* o: { count (null = blank), letters (show the LETTERS label), stamp {text, t0, col, px}, label, march, ang } */
  function tagCard(g, t, off, o) {
    var y0 = TY0 + off, y1 = TY0 + (TY1 - TY0) * (o.hk == null ? 1 : o.hk) + off, cx = 510;
    g.save(); g.translate(cx, y0 - 6 + 9 * (o.press || 0) + (o.shake || 0)); g.rotate(o.ang || 0); g.translate(-cx, -(y0 - 6));
    /* strings to two pins just above the card */
    g.strokeStyle = '#cbbf9f'; g.lineWidth = 4; g.beginPath(); g.moveTo(250, y0 - 6); g.lineTo(250, y0 + 14); g.moveTo(770, y0 - 6); g.lineTo(770, y0 + 14); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, 118, y0 + 12, 800, y1 - y0, 22); g.fill();
    g.fillStyle = TAGP; cut(g, [[110, y0 + 4], [910, y0 + 4], [910, y1], [110, y1]], mulberry(21), 1.3);
    g.beginPath(); g.rect(110, y0, 800, y1 - y0); grainIn(g, 110, y0, 800, y1 - y0, 22, .9);
    g.fillStyle = BG; el(g, 250, y0 + 14, 7, 7); el(g, 770, y0 + 14, 7, 7);
    g.strokeStyle = '#cbbf9f'; g.lineWidth = 4; g.beginPath(); g.arc(250, y0 + 14, 10, 0, 6.283); g.stroke(); g.beginPath(); g.arc(770, y0 + 14, 10, 0, 6.283); g.stroke();
    prop(g, 'tag', 110, y0, 918, y1 + 12);
    /* divider */
    g.save(); g.setLineDash([10, 10]); g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(662, y0 + 50); g.lineTo(662, y1 - 20); g.stroke(); g.restore();
    /* the slot: dashed when blank (the dashes march while tiles are typing) */
    var sx = 136, sy = y0 + 72, sw = 504, sh = y1 - y0 - 90;
    if (!o.stamp) dashRect(g, sx, sy, sw, sh, 18, 'rgba(33,29,38,.45)', 5, [18, 14], o.march || 0);
    onprop(function () {
      if (o.label) txt(g, o.label, 140, y0 + 46, 40, INK, 'left', 700, DISP, 510, 1, 40, 'extra-condensed');
      if (o.stamp && o.stamp.hero) {
        /* the hero: inks on "four"; on the thump it pops 1.4 → 1.25 in 0.18 s and stays 1.25; before the tear it peels off */
        var hx = 428, hy = sy + sh / 2 + 4, hp = o.stamp.press, hs = 1, pk = o.stamp.peel || 0;
        if (hp && t >= hp) hs = lerp(1.4, 1.25, eout(seg(t, hp, hp + .18)));
        g.save(); g.translate(hx, hy - 120 * pk * pk); g.rotate(-.5 * pk); g.scale(hs, hs); g.translate(-hx, -hy); g.globalAlpha *= 1 - pk;
        var nr = NOREC; if ((hp && t >= hp && t < hp + .18) || pk > 0) NOREC = true;
        stamp(g, o.stamp.text, hx, hy, t, o.stamp.t0, o.stamp.px, o.stamp.col, o.stamp.rot, o.stamp.speck);
        NOREC = nr; g.restore();
      } else if (o.stamp) stamp(g, o.stamp.text, sx + sw / 2, sy + sh / 2 + 4, t, o.stamp.t0, o.stamp.px || 100, o.stamp.col || INK, o.stamp.rot, o.stamp.speck);
      if (o.stamp && o.stamp.press && !o.stamp.hero) { var ps = 1 + .05 * (1 - eout(seg(t, o.stamp.press, o.stamp.press + .06))); g.save(); g.translate(sx + sw / 2, sy + sh / 2 + 4); g.scale(ps, ps); g.translate(-(sx + sw / 2), -(sy + sh / 2 + 4)); NOREC = true; stamp(g, o.stamp.text, sx + sw / 2, sy + sh / 2 + 4, t, o.stamp.press - .1, o.stamp.px || 100, o.stamp.col || INK, o.stamp.rot, o.stamp.speck * 1.7); NOREC = false; g.restore(); }
      /* the count */
      if (o.count != null) { var cs = o.countS || 1; g.save(); g.translate(786, y0 + 138); g.scale(cs, cs); g.translate(-786, -(y0 + 138)); txt(g, String(o.count), 786, y0 + 138, 150, INK, 'center', 900, DISP, 220, o.countA == null ? 1 : o.countA); g.restore(); }
      else if (o.letters) { g.save(); g.setLineDash([14, 10]); g.lineDashOffset = o.march || 0; g.strokeStyle = 'rgba(33,29,38,.5)'; g.lineWidth = 6; g.beginPath(); g.moveTo(716, y0 + 196); g.lineTo(856, y0 + 196); g.stroke(); g.restore(); }
      if (o.letters) txt(g, 'LETTERS', 786, y0 + 246, 40, INK, 'center', 800, DISP, 220, 1, 40, 'condensed');
    });
    g.restore();
  }

  /* ---------- the field: an 800 × 140 paper strip with 20 ruled cells and paper tiles ---------- */
  /* o: { dots (0 none … 1 all eight masked dots), letters, tiles (function i → {a, dy, flip} or null), cells (how many cells drawn solid),
          dashTo (dashed outline cells up to this count), hi (bold outline on cells < hi), fade (cells ≥ fade dimmed), dotPulse } */
  function field(g, t, off, o) {
    var y0 = FY0 + off, y1 = FY1 + off;
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, 118, y0 + 12, 800, y1 - y0, 16); g.fill();
    g.fillStyle = '#fbf6ea'; cut(g, [[110, y0], [910, y0], [910, y1], [110, y1]], mulberry(31), 1.1);
    g.beginPath(); g.rect(110, y0, 800, y1 - y0); grainIn(g, 110, y0, 800, y1 - y0, 32, .8);
    prop(g, 'field', 110, y0, 918, y1 + 12);
    var cy0 = y0 + 22, ch = y1 - y0 - 44;
    for (var i = 0; i < 20; i++) {
      var x = CX0 + i * CELL;
      var dim = o.fade != null && i >= o.fade ? .25 : 1;
      if (i < (o.cells || 8)) { g.strokeStyle = 'rgba(33,29,38,' + (.32 * dim) + ')'; g.lineWidth = 3; rr(g, x + 3, cy0, CELL - 6, ch, 6); g.stroke(); }
      else if (o.dashTo && i < o.dashTo) dashRect(g, x + 3, cy0, CELL - 6, ch, 6, 'rgba(33,29,38,.5)', 3, [8, 6], 0);
      else { g.fillStyle = 'rgba(33,29,38,' + (.12 * dim) + ')'; g.fillRect(x + 6, y1 - 30, CELL - 12, 3); }
      if (o.hi && i < o.hi) { g.strokeStyle = INK; g.lineWidth = 5; rr(g, x + 3, cy0, CELL - 6, ch, 6); g.stroke(); }
      /* ruled ticks every 4 cells under the tape */
      if ((i + 1) % 4 === 0) { g.fillStyle = 'rgba(33,29,38,' + (.5 * dim) + ')'; g.fillRect(x + CELL - 2, y1 - 20, 4, 14); }
    }
    /* frame 0's masked dots */
    if (o.dots > 0) for (var d = 0; d < 8; d++) {
      var fl = o.flipK ? o.flipK(d) : 0; if (fl >= .5) continue;
      var pb = o.dotPulse ? o.dotPulse(d) : 0, sx = Math.max(.05, Math.cos(Math.PI * fl));
      g.save(); g.translate(cellX(d), (y0 + y1) / 2 - 6 * pb); g.scale(sx * (1 + .25 * pb), 1 + .25 * pb); g.fillStyle = INK; el(g, 0, 0, 14.5, 14.5); g.restore();
    }
    /* a blinking text cursor after the eighth dot (on at frame 0 and on the loop's last frame) */
    if (o.cursor != null && o.cursor >= 0 && (((o.cursor / .9 + .2) % 1) + 1) % 1 < .6) { g.fillStyle = INK; g.fillRect(CX0 + 8 * CELL + 6, y0 + 30, 6, y1 - y0 - 60); }
    /* tiles */
    if (o.tiles) for (var j = 0; j < 20; j++) {
      var tl = o.tiles(j); if (!tl || tl.a <= 0) continue;
      tile(g, cellX(j), (y0 + y1) / 2 + (tl.dy || 0), (o.letters || '')[j] || '', tl);
    }
  }
  function tile(g, x, y, ch, tl) {
    var sx = tl.flip != null ? Math.max(.05, Math.abs(Math.cos(Math.PI * tl.flip))) : 1;
    g.save(); g.globalAlpha *= clamp(tl.a, 0, 1); g.translate(x, y); g.rotate(tl.rot || 0); g.scale(sx, 1);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -15, -36, 34, 80, 7); g.fill();
    g.fillStyle = tl.col || '#efe2c4'; rr(g, -17, -40, 34, 80, 7); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 2; rr(g, -17, -40, 34, 80, 7); g.stroke();
    if (ch && (tl.flip == null || tl.flip >= .5)) onprop(function () { txt(g, ch, 0, 2, 40, INK, 'center', 700, MONO); });
    g.restore();
  }

  /* ---------- the condition plate: ≥ 52 px cream type on an ink card, from the first Hive number to the last ---------- */
  function plate(g, off, L, a, s) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(510, (PY0 + PY1) / 2 + off); g.scale(s || 1, s || 1); g.translate(-510, -(PY0 + PY1) / 2);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, 118, PY0 + 10, 800, PY1 - PY0, 18); g.fill();
    g.fillStyle = '#26222e'; rr(g, 110, PY0, 800, PY1 - PY0, 18); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 3; rr(g, 118, PY0 + 8, 784, PY1 - PY0 - 16, 12); g.stroke();
    prop(g, 'plate', 110, PY0, 918, PY1 + 10);
    var pg = L.length < 3 ? 66 : 54, pc = (PY0 + PY1) / 2 - 4;
    for (var i = 0; i < L.length; i++) txt(g, L[i], 510, pc + (i - (L.length - 1) / 2) * pg, L.length < 3 ? 56 : 52, CREAM, 'center', 800, DISP, 770, 1, 48, 'condensed');
    g.restore();
  }
  /* two lines: the tag's header carries HIVE SYSTEMS 2026 (or OUR MATH at 20), so the plate doesn't repeat it */
  var PLATE1 = ['RANDOM PASSWORD · LOWERCASE', 'STOLEN BCRYPT HASH · 16× RTX 5090'];
  var PLATE1M = ['RANDOM PASSWORD · LOWERCASE', 'OUR MATH · AT HIVE\'S 2026 SPEED'];
  var PLATE2 = ['HIVE SYSTEMS 2026 · 2ND TABLE', 'REUSED, DICTIONARY WORDS', 'OR STOLEN IN AN EARLIER BREACH'];

  /* ---------- the ladder: torn rows of Hive's table (lowercase column), lit as the field reaches them ---------- */
  var ROWS = [{ n: '8', v: ['2 WEEKS'] }, { n: '9', v: ['1 YEAR'] }, { n: '12', v: ['21,000', 'YEARS'] }, { n: '18', v: ['6 TRILLION', 'YEARS'] }];
  function ladderCell(g, x, n, v, lit, a, o) {
    o = o || {};
    var y0 = LY0, h = LY1 - LY0, w = 192;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    if (lit > 0) {
      g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x + 7, y0 + 10, w - 4, h - 12);
      g.fillStyle = o.ours ? '#e8dcc0' : PAPER; cut(g, o.torn ? [[x, y0], [x + w - 6, y0], [x + w + 4, y0 + 40], [x + w - 8, y0 + 80], [x + w + 2, y0 + 130], [x + w - 10, y0 + 170], [x + w, y0 + h], [x, y0 + h]] : [[x, y0], [x + w, y0], [x + w, y0 + h], [x, y0 + h]], mulberry(strHash(n) + 5), 1.2);
      g.beginPath(); g.rect(x, y0, w, h); grainIn(g, x, y0, w, h, strHash(n), .8);
      if (o.ours) dashRect(g, x + 8, y0 + 8, w - 16, h - 16, 10, 'rgba(33,29,38,.6)', 4, [12, 9], 0);
      prop(g, 'ladder', x, y0, x + w + 7, y0 + h);
      onprop(function () {
        txt(g, n, x + w / 2, y0 + 58, 70, INK, 'center', 900, DISP, w - 20);
        v.forEach(function (s, i) { txt(g, s, x + w / 2, y0 + 128 + i * 46 + (v.length === 1 ? 18 : 0), 42, INK, 'center', 800, DISP, w - 20, 1, 40, 'extra-condensed'); });
      });
    } else {
      dashRect(g, x + 4, y0 + 4, w - 8, h - 8, 12, 'rgba(244,237,224,.45)', 4, [14, 10], 0);
      txt(g, n, x + w / 2, y0 + 58, 70, 'rgba(244,237,224,.55)', 'center', 900, DISP, w - 20);
    }
    g.restore();
  }

  /* ---------- frame 0's headline, the search phrase ---------- */
  function headline(g, off, a) {
    if (a <= 0 || !LIVE.text) return;
    txt(g, 'HOW LONG', CX, HL1 + off, 96, CREAM, 'center', 900, DISP, 820, a, 60, 'expanded');
    txt(g, 'IS YOURS?', CX, HL2 + off, 96, CREAM, 'center', 900, DISP, 820, a, 60, 'expanded');
  }
  function search(g, t, a) {
    if (a <= 0 || !LIVE.text || POSTERMODE) return;
    txt(g, 'HOW LONG SHOULD', CX, 352, 78, CREAM, 'center', 900, DISP, 820, a, 52, 'expanded');
    chip(g, 'YOUR PASSWORD BE?', CX, 438, { px: 66, wt: 900, bg: CREAM, fg: BG, a: a, s: .92 + .08 * Math.min(1, pop(t, K.HS, 3.2)), maxw: 820, st: 'expanded', shadow: false });
  }

  /* ---------- the tray of spare tiles (0 → times) ---------- */
  function tray(g, off, a, gone) {
    if (a <= 0) return;
    var y = LY0 + 40 + off;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.38)'; rr(g, 158, y + 118, 720, 40, 12); g.fill();
    g.fillStyle = '#b08a5a'; rr(g, 150, y + 108, 720, 40, 12); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(162, y + 114, 696, 5);
    for (var i = 0; i < 12; i++) { if (gone && i === 5) continue; tile(g, 222 + i * 52, y + 64, '', { a: 1, rot: (i % 3 - 1) * .03 }); }
    prop(g, 'tray', 150, y + 20, 878, y + 158);
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · frame 0 → 8 letters, 2 weeks → what if 20 → ×26 → 9, 12, 18 → the table ends → 20 (hero)
     ===================================================================================================== */
  function tileTimes() {
    var T = [];
    for (var i = 0; i < 8; i++) T.push(.66 + i * .035);
    T.push(K.C9);
    for (i = 0; i < 3; i++) T.push(K.TS12 + (i + 1) * (K.C12 - K.TS12) / 3);
    for (i = 0; i < 6; i++) T.push(K.TS18 + (i + 1) * (K.C18 - K.TS18) / 6);
    T.push(K.TS20 + (K.T20 - K.TS20) / 2, K.T20);
    return T;
  }
  var TT = tileTimes();
  /* the count + stamp state: both change on one frame; blank (null) while tiles type */
  function state1(t) {
    if (t < K.S8) return null;
    if (t < K.C9) return { n: 8, s: '2 WEEKS', t0: K.S8 };
    if (t < K.TS12) return { n: 9, s: '1 YEAR', t0: K.C9 };
    if (t < K.C12) return { blank: true };
    if (t < K.TS18) return { n: 12, s: '21,000\nYEARS', t0: K.C12 };
    if (t < K.C18) return { blank: true };
    if (t < K.TS20) return { n: 18, s: '6 TRILLION\nYEARS', t0: K.C18 };
    if (t < K.HERO0) return { blank: true };
    if (t < K.PEEL1) return { n: 20, s: '4 QUADRILLION\nYEARS', t0: K.HERO0, hero: true, peel: seg(t, K.PEEL0, K.PEEL1) };
    return { blank: true };
  }
  function still(t) { return seg(t, K.SLAM + .2, K.SLAM + .23) * (1 - seg(t, K.PEEL0 - .03, K.PEEL0)); }
  /* the camera push on the hero (tag + field): 1.0 → 1.08 across 11–22 s, about the tag/field seam */
  function push(g, t) { var p = 1 + .08 * eio(seg(t, 11, 22)); g.translate(510, 720); g.scale(p, p); g.translate(-510, -720); }
  function sway(t, ph) { return .016 * Math.sin(t * 1.7 + (ph || 0)); }
  /* paper floating: every prop drifts a few px on its own phase, so no frame is a still card (pacecheck) */
  function drift(t, ph, k) { return 7 * Math.sin(t * 1.9 + ph) * (k == null ? 1 : k); }

  function ladderScene(g, t) {
    var off = F0OFF * (1 - eout(seg(t, 0, .95)));
    var st = still(t), bob = function (i) { return 6 * Math.sin(t * 2.6 + i * .7) * (1 - st); };
    var dk = seg(t, .95, 1.5) * (1 - st), dT = drift(t, 0, dk), dF = drift(t, 1.3, dk), dP = drift(t, 2.4, dk), dL = drift(t, 3.6, dk);
    /* lower band: the tray (to times), ×26 (times → 9), the ladder (9 → the wipe) */
    var trayOut = eio(seg(t, K.lower - .3, K.lower + .1));
    tray(g, off + 240 * trayOut + dL, 1 - trayOut, t > K.times);
    var xin = eout(seg(t, K.lower - .05, K.lower + .3)), xout = eio(seg(t, K.C9, K.C9 + .3));
    if (xin > 0 && xout < 1) {
      var xy = 30 * (1 - xin) + 40 * xout;
      g.save(); g.globalAlpha *= xin * (1 - xout) < .5 ? 0 : 1;
      chip(g, '×26', 510, 1286 + xy + dL, { px: 112, wt: 900, bg: CREAM, fg: BG, s: .92 + .08 * Math.min(1, pop(t, K.lower - .05, 3.2)), rot: -.02, st: 'expanded' });
      txt(g, 'EACH RANDOM LOWERCASE LETTER', 510, 1394 + xy + dL, 52, CREAM, 'center', 800, DISP, 820, 1, 48, 'condensed');
      g.restore();
    }
    var lin = eout(seg(t, K.C9, K.C9 + .35));
    if (lin > 0) {
      var ly = 40 * (1 - lin), shift = eio(seg(t, K.TAPE - .02, K.TAPE + .25));
      g.save(); g.translate(-202 * shift, ly + dL); if (lin < .5) g.globalAlpha = 0;
      var lit = [t >= K.C9, t >= K.C9, t >= K.C12, t >= K.C18];
      ROWS.forEach(function (r, i) { ladderCell(g, 110 + i * 202, r.n, t >= K.PEEL1 ? [] : r.v, lit[i] ? 1 : 0, i === 0 ? (shift > 0 ? 0 : 1) : 1, { torn: i === 3 && t >= K.RIP }); });
      /* the rip: a scrap falls off after 18 */
      if (t >= K.RIP && t < K.RIP + .8) {
        var fk = seg(t, K.RIP, K.RIP + .8);
        g.save(); g.globalAlpha *= 1 - fk; g.translate(110 + 3 * 202 + 200 + 30 * fk, LY0 + 60 + 260 * fk * fk); g.rotate(.9 * fk);
        g.fillStyle = PAPER; poly(g, [[-10, -50], [24, -40], [12, 10], [26, 60], [-12, 52]]); g.fill(); g.restore();
      }
      /* the hand-inked 20 · OUR MATH cell, taped after the tear */
      var tin = eout(seg(t, K.TAPE + .26, K.TAPE + .46));
      if (tin > 0) {
        g.save(); g.translate(0, 40 * (1 - tin)); g.globalAlpha *= clamp(tin * 2, 0, 1);
        ladderCell(g, 110 + 4 * 202 + 8, '20', t >= K.PEEL1 ? [] : ['OUR', 'MATH'], 1, 1, { ours: true });
        g.fillStyle = 'rgba(244,237,224,.7)'; g.save(); g.translate(110 + 4 * 202 + 8, LY0 + 30); g.rotate(-.5); g.fillRect(-30, -10, 60, 20); g.restore();
        g.restore();
      }
      g.restore();
    }
    /* the condition plate: on the frame of the first Hive number; its last line says OUR MATH on the hero's frame */
    if (t >= K.S8) plate(g, dP, t >= K.HERO0 ? PLATE1M : PLATE1, 1, 1 + .04 * (1 - eout(seg(t, K.S8, K.S8 + .15))));
    /* the field */
    var flipK = function (d) { return seg(t, TT[d] - .12, TT[d]); };
    var dashTo = t >= K.dash ? 8 + Math.round(12 * eout(seg(t, K.dash, K.twentyW))) : 0;
    g.save(); push(g, t);
    field(g, t, off + dF, {
      dots: 1, flipK: flipK, letters: LET20, cells: 8, dashTo: dashTo, cursor: t < TT[0] - .12 ? t : -1,
      dotPulse: function (d) { var p = ((t * 1.6 - d * .12) % 1 + 1) % 1; return t < .7 ? Math.max(0, Math.sin(Math.PI * clamp(p * 3, 0, 1))) : 0; },
      tiles: function (i) {
        var tl = TT[i]; if (t < tl - (i < 8 ? .12 : .14)) return null;
        if (i < 8) return { a: 1, flip: seg(t, tl - .12, tl), dy: bob(i) * .4 };
        var dk = seg(t, tl - .14, tl); return { a: 1, dy: -70 * (1 - dk * dk * dk) + bob(i) * .4 };   /* stays in the air, lands on the count's frame */
      }
    });
    /* the spare tile for cell 9: lifts from the tray on "Each", hovers over cell 9, drops on C9 */
    if (t >= K.times && t < K.C9 - .14) {
      var hk = eio(seg(t, K.times, K.times + .7)), hx = lerp(222 + 5 * 52, cellX(8), hk) + 10 * Math.sin(t * 2.2) * hk, hy = lerp(LY0 + 104, FY0 - 34, hk) + 14 * Math.sin(t * 3) * hk + dF;
      tile(g, hx, hy, LET20[8], { a: 1, rot: .2 * (1 - hk) + .04 * Math.sin(t * 2.4) });
    }
    g.restore();
    /* the field's own tags: RANDOM EXAMPLE (with the letters), WHAT IF… 20? (on "twenty") */
    tag(g, 'RANDOM EXAMPLE', 300, CHIPY + off + dF, fin(t, .78), .01, 380);
    var wq = fin(t, K.twentyW - .05) * (1 - seg(t, K.TS20 - .2, K.TS20));
    if (wq > 0) chip(g, 'WHAT IF… 20?', 735, CHIPY + dF, { px: 44, wt: 900, bg: CREAM, fg: BG, a: wq, s: .9 + .1 * Math.min(1, pop(t, K.twentyW - .05, 3.2)), rot: .015, maxw: 340, st: 'condensed', shadow: false });
    /* the tag (count + stamp), swaying a little on its strings except in the hero hold */
    var s1 = state1(t), march = (t * 40) % 64;
    var o = { letters: t >= K.S8, march: march, hk: .6 + .4 * eio(seg(t, K.S8 - .3, K.S8)), press: K.P8 != null && t >= K.P8 && t < K.C9 ? Math.exp(-30 * (t - K.P8)) : 0,
      shake: t >= K.SLAM ? 6 * Math.sin((t - K.SLAM) * 2 * Math.PI * 20) * (1 - seg(t, K.SLAM, K.SLAM + .2)) : 0,
      countS: s1 && s1.hero && t >= K.SLAM ? lerp(1, .85, eout(seg(t, K.SLAM, K.SLAM + .18))) : 1, countA: s1 && s1.hero ? 1 - (s1.peel || 0) : 1, ang: sway(t) * (1 - st) + (t >= K.C9 && t < K.C9 + .6 ? .012 * Math.exp(-5 * (t - K.C9)) * Math.sin((t - K.C9) * 16) : 0) };
    if (s1 && !s1.blank) {
      o.count = s1.n;
      o.stamp = s1.hero ? { hero: true, text: s1.s, t0: s1.t0, col: HOT, px: 62, rot: -.03, speck: .5, press: t >= K.SLAM ? K.SLAM : 0, peel: s1.peel } : { text: s1.s, t0: s1.t0, col: INK, px: s1.s.indexOf('\n') > 0 ? 84 : 104, rot: -.04, speck: .8, press: s1.n === 8 && K.P8 != null && t >= K.P8 ? K.P8 : 0 };
      o.label = s1.hero ? 'CRACK TIME · OUR MATH' : 'CRACK TIME · HIVE SYSTEMS 2026';
    } else if (t >= K.TS20) o.label = 'CRACK TIME · OUR MATH';
    g.save(); push(g, t); tagCard(g, t, off + dT, o); g.restore();
    /* frame 0's headline → the search phrase → the WHAT IF… 20? card slapped over it on the pop */
    headline(g, off, 1 - seg(t, K.HS - .12, K.HS));
    search(g, t, fin(t, K.HS) * (1 - seg(t, K.dash, K.dash + .04)));
    var wc = (t >= K.dash ? 1 : 0) * (1 - seg(t, K.dash + 1.15, K.dash + 1.25));
    if (wc > 0) chip(g, 'WHAT IF… 20?', CX, 400 + dF * .5, { px: 100, wt: 900, bg: CREAM, fg: BG, a: wc, s: 1 + .18 * (1 - eout(seg(t, K.dash, K.dash + .1))), rot: -.03, maxw: 780, st: 'expanded', shadow: true });
  }

  /* =====================================================================================================
     SCENE 2 · the same field, reused / real words: INSTANTLY (Hive's second table)
     ===================================================================================================== */
  var STRIP = ['8', '12', '16', '18'];
  function dipScene(g, t) {
    var s0 = S('dip').t0 - SW, bob = function (i) { return 6 * Math.sin(t * 2.6 + i * .7); }, dT = drift(t, 0), dF = drift(t, 1.3), dP = drift(t, 2.4), dL = drift(t, 3.6);
    plate(g, dP, PLATE2, 1, 1);
    /* the second table: four torn rows, every cell INSTANTLY from the crack */
    STRIP.forEach(function (n, i) {
      var fk = seg(t, K.CRACK + i * .05, K.CRACK + i * .05 + .14), x = 110 + i * 202;
      g.save(); g.translate(x + 96, dL); g.scale(Math.max(.05, Math.abs(Math.cos(Math.PI * fk))), 1); g.translate(-(x + 96), 0);
      ladderCell(g, x, n, fk >= .5 ? ['INSTANTLY'] : [''], 1, 1);
      g.restore();
    });
    field(g, t, dF, {
      dots: 0, letters: REUSE, cells: 14,
      tiles: function (i) { if (i >= 14) return null; return { a: 1, dy: bob(i) * .4, col: '#f3e6c6' }; }   /* whole under the tear, with the header */
    });
    tag(g, 'REUSED / REAL WORDS · EXAMPLE', 510, CHIPY + dF, 1, .01, 800);
    var o = { letters: true, march: (t * 40) % 64, ang: sway(t, 1) + (t >= K.INST ? .014 * Math.exp(-4 * (t - K.INST)) * Math.sin((t - K.INST) * 15) : 0) };
    o.label = 'CRACK TIME · HIVE 2026, 2ND TABLE';
    if (t >= K.INST) { o.count = 14; o.stamp = { text: 'INSTANTLY', t0: K.INST, col: INK, px: 110, rot: -.05, speck: .8 }; }
    tagCard(g, t, dT, o);
  }

  /* =====================================================================================================
     SCENE 3 · NIST: fifteen if it's the only step → CISA: turn on two-step → the end card (frame 0 again)
     ===================================================================================================== */
  function card(g, x0, y0, w, h, seed, fn) {
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 8, y0 + 12, w, h, 18); g.fill();
    g.fillStyle = PAPER; cut(g, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], mulberry(seed), 1.3);
    g.beginPath(); g.rect(x0, y0, w, h); grainIn(g, x0, y0, w, h, seed + 1, .9);
    prop(g, 'card', x0, y0, x0 + w + 8, y0 + h + 12);
    onprop(fn);
  }
  function phone(g, x, y, on, inside) {
    /* a generic paper phone: round punch-hole, no logo; the settings row is our drawing */
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x + 10, y + 14, 330, 590, 48); g.fill();
    g.fillStyle = '#2b2834'; rr(g, x, y, 330, 590, 48); g.fill();
    g.fillStyle = '#f7f0e1'; rr(g, x + 16, y + 16, 298, 558, 36); g.fill();
    rr(g, x + 16, y + 16, 298, 558, 36); grainIn(g, x + 16, y + 16, 298, 558, 77, .7);
    g.fillStyle = '#2b2834'; el(g, x + 165, y + 44, 10, 10);
    prop(g, 'phone', x, y, x + 340, y + 604);
    if (inside) onprop(function () {
      txt(g, 'TWO-STEP', x + 165, y + 140, 50, INK, 'center', 900, DISP, 270, 1, 40, 'condensed');
      txt(g, 'LOGIN', x + 165, y + 196, 50, INK, 'center', 900, DISP, 270, 1, 40, 'condensed');
    });
    /* the switch: knob left (off) → right (on); dark track when on */
    var tw = 170, th = 84, tx = x + 165 - tw / 2, ty = y + 260;
    g.fillStyle = on > .5 ? INK : '#b9b0a0'; rr(g, tx, ty, tw, th, th / 2); g.fill();
    var kx = lerp(tx + th / 2, tx + tw - th / 2, on);
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, kx + 3, ty + th / 2 + 4, 33, 33); g.fillStyle = on > .5 ? CREAM : '#f7f0e1'; el(g, kx, ty + th / 2, 33, 33);
    g.strokeStyle = 'rgba(33,29,38,.4)'; g.lineWidth = 3; g.beginPath(); g.arc(kx, ty + th / 2, 33, 0, 6.283); g.stroke();
    /* a code box row under the switch: six empty squares */
    for (var i = 0; i < 6; i++) { g.strokeStyle = 'rgba(33,29,38,.5)'; g.lineWidth = 3; rr(g, x + 46 + i * 42, y + 400, 34, 46, 6); g.stroke(); }
    if (inside) onprop(function () { txt(g, 'CODE', x + 165, y + 486, 44, INK, 'center', 900, DISP, 270, 1, 40, 'condensed'); });
  }
  function nistScene(g, t) {
    var s0 = S('nist').t0 - SW;
    var clr = eio(seg(t, K.end - .12, K.end + .14));   /* everything leaves on "Is" */
    var dr = function (ph) { return 7 * Math.sin(t * 1.9 + ph * 1.2) * (1 - clr); };
    var mk2 = seg(t, K.mfa + .22, K.mfa + .62);           /* the field + sheet peel off, the phone comes up */
    if (clr < 1) {
      g.save(); g.globalAlpha *= 1 - clr; g.translate(0, -60 * clr);
      /* the phone: up ≥ 300 px from below on "Turn"; the switch flips on "on" */
      if (mk2 > 0) {
        var py = 830 + 360 * (1 - eout(seg(t, K.mfa + .22, K.mfa + .72))) + dr(3);
        phone(g, 120, py, eio(seg(t, K.on, K.on + .2)), py < 900);
        tag(g, 'OUR DRAWING', 285, py + 628 > 1400 ? 1400 : py + 628, fin(t, K.mfa + .5), .01, 300);
        /* the stolen password: a strip of dot tiles slides to the code door and stops */
        var bump = t >= K.BLOCK ? 10 * Math.exp(-6 * (t - K.BLOCK)) * Math.sin((t - K.BLOCK) * 18) : 0;
        var sx = lerp(470, 572, eio(seg(t, K.stolen - .1, K.BLOCK))) - bump, syy = 1170 + dr(4);
        var pa = fin(t, K.mfa + .28);
        g.save(); g.globalAlpha *= pa;
        g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, sx + 6, syy - 40, 196, 92, 12); g.fill();
        g.fillStyle = '#f3e6c6'; rr(g, sx, syy - 46, 196, 92, 12); g.fill();
        prop(g, 'strip', sx, syy - 46, sx + 202, syy + 52);
        g.fillStyle = INK; for (var d = 0; d < 6; d++) el(g, sx + 26 + d * 29, syy, 9, 9);
        g.restore();
        chip(g, 'STOLEN PASSWORD', 600, 1066 + dr(4), { px: 44, wt: 900, bg: CREAM, fg: BG, a: pa, rot: -.01, maxw: 320, st: 'condensed', shadow: false });
        /* the door: a paper panel with a keypad, labelled SECOND STEP; it doesn't open */
        var da = fin(t, K.mfa + .34);
        g.save(); g.globalAlpha *= da;
        card(g, 778, 930, 140, 470, 151, function () {
          txt(g, 'CODE', 848, 990, 46, INK, 'center', 900, DISP, 124, 1, 36, 'condensed');
        });
        for (var q = 0; q < 9; q++) { g.fillStyle = 'rgba(33,29,38,.55)'; el(g, 818 + (q % 3) * 30, 1060 + Math.floor(q / 3) * 34, 9, 9); }
        g.fillStyle = '#9c8a5f'; rr(g, 784, 1150, 26, 60, 8); g.fill();
        g.restore();
        txt(g, 'SECOND STEP', 808, 896, 42, CREAM, 'center', 900, DISP, 210, da, 36, 'condensed');
        /* not enough: a drawn cross over the strip on the bump (lines, not type) */
        var xk = eout(seg(t, K.BLOCK, K.BLOCK + .16));
        if (xk > 0) { g.save(); g.strokeStyle = CREAM; g.lineWidth = 12; g.lineCap = 'round'; var cx2 = sx + 98, cy2 = syy; g.beginPath(); g.moveTo(cx2 - 50 * xk, cy2 - 50 * xk); g.lineTo(cx2 + 50 * xk, cy2 + 50 * xk); g.moveTo(cx2 + 50 * xk, cy2 - 50 * xk); g.lineTo(cx2 - 50 * xk, cy2 + 50 * xk); g.stroke(); g.restore(); }
      }
      /* lower band: the scope sheet and the field peel off to the right, over the incoming phone (no fade) */
      if (mk2 < 1) {
        var pk2 = eio(seg(t, K.mfa + .22, K.mfa + .62)); EXITING = pk2 > 0;
        g.save(); g.translate(110, 1012 + dr(2)); g.rotate(.22 * pk2); g.translate(-110 + 980 * pk2 * pk2, -1012 + 120 * pk2);
        card(g, 110, 1012, 800, 412, 141, function () {
          txt(g, '15+ CHARACTERS', 510, 1096, 96, INK, 'center', 900, DISP, 740, 1, 60, 'condensed');
          txt(g, 'FEDERAL GUIDELINE FOR', 510, 1196, 62, INK, 'center', 900, DISP, 740, 1, 48, 'condensed');
          txt(g, 'LOGINS WITH NO SECOND STEP', 510, 1270, 62, INK, 'center', 900, DISP, 740, 1, 48, 'condensed');
          txt(g, 'NIST · JULY 2025', 510, 1360, 44, INK, 'center', 700, DISP, 740, 1, 40, 'condensed');
        });
        g.restore();
        /* the field: no tiles, 15 cells bracketed */
        g.save(); g.translate(980 * pk2 * pk2, -40 * pk2);
        field(g, t, dr(1), { dots: 0, cells: 20, hi: Math.round(15 * eout(seg(t, s0 + .1, K.fifteen + .1))), fade: 15 });
        var bx0 = CX0 + 4, bx1 = CX0 + 15 * CELL - 4, by = FY1 + 14 + dr(1), bk = eout(seg(t, K.fifteen - .1, K.fifteen + .2));
        if (bk > 0) { g.strokeStyle = CREAM; g.lineWidth = 5; g.beginPath(); g.moveTo(bx0, by - 8); g.lineTo(bx0, by); g.lineTo(lerp(bx0, bx1, bk), by); if (bk >= 1) g.lineTo(bx1, by - 8); g.stroke(); }
        g.restore(); EXITING = false;
      }
      /* the upper card: NIST's words (re-created), then CISA's */
      var ck = eio(seg(t, K.CIS - .05, K.CIS + .3));
      if (ck < 1) {
        g.save(); g.translate(-30 * ck, dr(0)); if (ck > .5) g.globalAlpha = 0;
        card(g, 110, TY0, 800, TY1 - TY0, 131, function () {
          txt(g, '“…a minimum of', 510, TY0 + 72, 64, INK, 'center', 800, DISP, 740, 1, 48, 'condensed');
          txt(g, '15 characters…”', 510, TY0 + 146, 64, INK, 'center', 800, DISP, 740, 1, 48, 'condensed');
          txt(g, 'NIST SP 800-63B-4', 510, TY0 + 216, 42, INK, 'center', 700, DISP, 740, 1, 40, 'condensed');
        });
        tag(g, 'RE-CREATED', 760, TY1 - 20, 1, -.02, 300, INK, '#f1e9d8');
        g.restore();
      }
      if (ck > 0) {
        g.save(); g.translate(30 * (1 - ck), dr(0)); if (ck <= .5) g.globalAlpha = 0;
        card(g, 110, TY0, 800, TY1 - TY0, 161, function () {
          txt(g, '“…unauthorized users', 510, TY0 + 50, 46, INK, 'center', 800, DISP, 740, 1, 40, 'condensed');
          txt(g, 'will be unable to meet', 510, TY0 + 102, 46, INK, 'center', 800, DISP, 740, 1, 40, 'condensed');
          txt(g, 'the second authentication', 510, TY0 + 154, 46, INK, 'center', 800, DISP, 740, 1, 40, 'condensed');
          txt(g, 'requirement…”', 510, TY0 + 206, 46, INK, 'center', 800, DISP, 740, 1, 40, 'condensed');
          txt(g, 'CISA · MFA PAGE', 510, TY0 + 256, 38, INK, 'center', 700, DISP, 740, 1, 36, 'condensed');
        });
        g.restore();
      }
      g.restore();
    }
    /* the end: YES / NO (coral, the same size) over a generic paper envelope whose flap hides a toggle (no state shown);
       frame 0's group stays hidden until YES / NO have gone, then rises into frame 0's place at frame 0's own glide speed */
    if (t >= K.end - .05) {
      var TEND = Math.round(DUR * 30) / 30;                   /* frame 0 of the next loop sits at TEND */
      var ein = eout(seg(t, K.end - .05, K.end + .45));
      /* frame 0's group, behind the envelope: rises over the last 0.3 s at frame 0's own glide speed (linear), into frame 0's place */
      var ed = eio(seg(t, K.GRP, TEND - 1 / 30)), ey = 900 + 560 * (1 - ein) + 545 * ed + (1 - ed) * 7 * Math.sin(t * 2.3);
      if (t >= K.GRP) {
        g.save(); if (ed < 1) { g.beginPath(); g.rect(0, 0, W, ey + 330); g.clip(); }   /* it comes out of the envelope's pocket, never from under it */
        var off = F0OFF + F0V * (TEND - t);
        field(g, t, off, { dots: 1, cells: 8, cursor: t - TEND, dotPulse: function (d) { var p = (((t - TEND) * 1.6 - d * .12) % 1 + 1) % 1; return Math.max(0, Math.sin(Math.PI * clamp(p * 3, 0, 1))); } });
        tagCard(g, t, off, { ang: 0, hk: .6 });
        headline(g, off, 1);
        g.restore();
      }
      /* the envelope (720 × 400, y 900–1300) drops away as the field slides up out of it */
      if (ed < 1) envelope(g, t, ey);
      var yk = function (w) { return 1 + .06 * Math.sin(Math.PI * seg(t, w - .06, w + .3)); };
      var ya = fin(t, K.end + .05) * (t < K.YNOFF ? 1 : 0), yp = Math.min(1, pop(t, K.end + .05, 3));
      [['YES', 380, K.yes], ['NO', 640, K.noE]].forEach(function (c) {
        chip(g, c[0], c[1] + 5 * Math.sin(t * 2.1 + c[1]), 562 + 14 * (1 - yp) + 8 * Math.sin(t * 2.6 + c[1] * .01), { px: 90, wt: 900, bg: BG, line: HOT, lw: 7, fg: HOT, w: 232, h: 124, r: 52, shadow: false, a: ya, s: yk(c[2]) });
      });
    }
  }
  /* a plain paper envelope with its flap down over a toggle (our drawing, no on/off shown) */
  function envelope(g, t, y) {
    var x0 = 96, x1 = 924, h = 400;   /* wider than the tag (110–918) so frame 0's group hides inside it */
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, x0 + 4, y + 14, x1 - x0, h, 14); g.fill();
    g.fillStyle = '#efe2c4'; cut(g, [[x0, y], [x1, y], [x1, y + h], [x0, y + h]], mulberry(171), 1.3);
    g.beginPath(); g.rect(x0, y, x1 - x0, h); grainIn(g, x0, y, x1 - x0, h, 172, .9);
    prop(g, 'envelope', x0, y, x1 + 4, y + h + 14);
    /* the back seams */
    g.strokeStyle = 'rgba(33,29,38,.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y + h); g.lineTo(510, y + 220); g.lineTo(x1, y + h); g.stroke();
    /* the toggle's track peeks out from under the flap; its knob is under the paper */
    g.fillStyle = '#b9b0a0'; rr(g, 400, y + 130, 220, 100, 50); g.fill();
    g.fillStyle = '#e6d6b2'; poly(g, [[x0, y], [x1, y], [510, y + 250]]); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y); g.lineTo(510, y + 250); g.lineTo(x1, y); g.stroke();
  }

  /* ---------- captions: the narrator's words, one block per line; stressed words get a cream pill (never coral) ---------- */
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'ask' || l.id === 'whatif') return;   /* frame 0's question, the search phrase and the WHAT IF… 20? flag carry these */
      out.push({ id: l.id, t0: l.words[0].t0, s: l.words[0].t0, t1: l.words[l.words.length - 1].t1, words: l.words });
    });
    return out;
  })();
  var STRESS = [['times', '26'], ['nine', 'one'], ['twelve', '21000'], ['eighteen', 'trillion'], ['twenty', 'quadrillion'], ['dip', 'instantly'], ['nist', 'fifteen'], ['mfa', 'twostep']]
    .map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, that: 1, is: 1, it: 1, do: 1, from: 1, be: 1, or: 1, for: 1, about: 1, who: 1, are: 1, we: 1, if: 1, no: 1, our: 1, over: 1, each: 1, extra: 1 };
  var CAPMIN = 1e9;
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s - .04 : 1e9;
    var keep = nx && (ns - card0.t1 < 2.4 || card0.id === 'twenty');   /* the hero caption stays up through the whole hold */
    var o1 = keep ? ns : Math.min(card0.t1 + .5, ns - .12), o0 = keep ? ns : Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.s - .04, card0.s + .06), out = keep ? (t < ns ? 1 : 0) : 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - card0.s + .04, 3.2, .8), 0, 1.04);
    g.save(); font(g, 74, 800, DISP, 'expanded');
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 22;
    var lines, lw, maxw = 800, cpx = 74;
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
    while ((lines.length > 2 || widest() > maxw) && cpx > 44) { cpx -= 4; font(g, cpx, 800, DISP, 'expanded'); ws = words.map(function (w) { return g.measureText(w.w).width; }); gap = cpx * .28; lay2(); fixLines(); }
    var lh = cpx * 1.16, y0 = Math.max((lines.length > 1 ? 376 : 410) + 34 - (lines.length - 1) * lh / 2, 308 + cpx * .9);   /* pill tops at y ≥ 304 */
    g.globalAlpha = fi * out * (alpha == null ? 1 : alpha);
    NOREC = true;
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 26;
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
  var NOISE, SCENES = { ladder: ladderScene, dipScene: dipScene, nistScene: nistScene };
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function safeClip(g) { g.beginPath(); g.rect(SAFE_BOX.x0, SAFE_BOX.y0, SAFE_BOX.x1 - SAFE_BOX.x0, SAFE_BOX.y1 - SAFE_BOX.y0); g.clip(); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) { g.save(); SCENES[Sc.fn](g, t); g.restore(); }
  /* the cut: a torn-paper edge falling from the top along one axis (cream), the next scene drawn above it */
  function edgeY(x, ly, t) { var i = Math.round(x / 30); return ly + (i % 2 ? -10 : 8) + Math.sin(x * .013 + t * 5) * 4; }
  function tornEdge(g, ly, t) { g.save(); g.strokeStyle = CREAM; g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); for (var x = 90; x <= 930; x += 30) { var yy = edgeY(x, ly, t); if (x === 90) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore(); }
  function clipAbove(g, ly, t) { g.beginPath(); g.moveTo(0, 0); for (var x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, 0); g.closePath(); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var sk0 = Nx && Nx.swipe ? seg(te, Nx.t0 - Nx.sw, Nx.t0) : 0, sk = sk0 * sk0 * (3 - 2 * sk0);
    var ly = 280 + (1470 - 280) * sk;
    COVTOP = sk > 0 ? ly + 14 : -1e9;
    g.save(); safeClip(g);
    drawScene(g, Sc, t);
    COVTOP = -1e9;
    if (sk > 0) {
      g.save(); clipAbove(g, ly, te);
      stage(g); INCOMING = true; INTOP = ly - 14; drawScene(g, Nx, t); INCOMING = false; INTOP = -1e9; g.restore();
      tornEdge(g, ly, te);
    }
    g.restore();
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) captions(g, t, 1 - seg(t, K.noEnd + .04, K.noEnd + .18));
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 70, 800, DISP, 'expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('What if your password', CX, 384);
    var b = 'had 20 letters?', bp = 70; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 466 - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 466); g.restore();
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
  function initTimes() {
    var G = [['slam', 'thump', 1], ['slap8', 'slap', .55], ['popW', 'pop', .5], ['k9', 'click', .8], ['k12', 'knock', .55], ['k18', 'rattle', .5], ['rip', 'paper', .55], ['tape', 'click', .7], ['kt1', 'rattle', .4], ['kt2', 'rattle', .4], ['crack', 'slap', .6], ['popC', 'pop', .5], ['block', 'knock', .6]];
    G.forEach(function (e) { if (GT[e[0]] != null) EV.push({ t: +GT[e[0]].toFixed(3), type: e[1], g: e[2], t1: +(GT[e[0]] + BODY[e[1]]).toFixed(3) }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (t < 2 / (fps || 30) - 1e-6 || t > K.GRP - .04) samples = 1;   /* frame 0 and the end's rise: sharp, no ghosting */
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
      var o = osc('sine', 250, t, t + .2, 1, [[t, 0], [t + .012, .5 * g], [t + .14, .46 * g], [t + .19, 0]], .05); o.frequency.exponentialRampToValueAtTime(170, t + .18);
      osc('triangle', 330, t, t + .14, 1, [[t, 0], [t + .004, .32 * g], [t + .06, .22 * g], [t + .13, 0]], .03);
      band(t, .15, 1600, .9, 3.8 * g, .008, .05);
      band(t, .1, 2500, 1.1, 2.3 * g, .006, .03);
      band(t + .001, .17, 1800, .55, 3.6 * g, .008, .04);
    }
    /* a paper tile landing in its cell: a short low knock with a paper tap on top (reads on a phone speaker) */
    function knockS(t, g) {
      g = g || 1;
      var o = osc('sine', 300, t, t + .14, 1, [[t, 0], [t + .003, .6 * g], [t + .13, 0]], .04); o.frequency.exponentialRampToValueAtTime(190, t + .12);
      band(t, .05, 1400, 1, 4.5 * g, .001, .03); band(t + .002, .03, 2600, 1.4, 2.4 * g, .001, .02);
    }
    /* tiles typing fast: four dry paper taps */
    function rattleS(t, g) { g = g || 1; for (var k = 0; k < 4; k++) { band(t + k * .032, .03, 2900 - k * 260, 1.6, 4 * g, .001, .02); band(t + k * .032 + .002, .03, 1300, 2, 1.2 * g, .001, .02); } }
    /* a soft paper pop */
    function popS(t, g) { g = g || 1; band(t, .03, 3200, 1.8, 5 * g, .001, .02); band(t + .002, .05, 1500, 2.2, .8 * g, .001, .02); }
    /* the table tearing: rough band noise sweeping up */
    function rip(t, g) {
      g = g || 1;
      var n = noise(t, .17), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(1300, t); bp.frequency.exponentialRampToValueAtTime(4200, t + .16);
      var ob = bus(1, .04, .15); n.connect(bp); bp.connect(ob);
      var pts = [[t, 0]]; for (var k = 1; k <= 8; k++) pts.push([t + k * .02, (k % 2 ? 1.6 : .7) * g * (1 - k / 10)]); pts.push([t + .17, 0]); env(ob.gain, pts);
    }
    /* a flat paper slap (the ink stamps, the table flip) */
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); }
    EV.forEach(function (e) {
      if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'knock') knockS(e.t, e.g);
      else if (e.type === 'rattle') { rattleS(e.t, e.g); slapS(e.t + .004, LAYER); }
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'pop') { popS(e.t, e.g); slapS(e.t + .002, LAYER); }
      else if (e.type === 'click') { band(e.t, .025, 2600, 1.6, 5 * e.g, .001, .02); band(e.t + .002, .04, 1200, 2, 2 * e.g, .001, .02); }
      else if (e.type === 'paper') { rip(e.t, e.g); slapS(e.t + .005, RIPSLAP); }   /* a 1–3 kHz slap layered on the tear so it reads on a phone */
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone, about −60 dB, so the loop seam is never digital zero; a little more room under the hero hold */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o);
      var h0 = K.SLAM + .05, h1 = K.W1 + .1;
      env(o.gain, [[0, ROOM], [h0, ROOM], [h0 + .2, ROOM * 3.16], [h1 - .15, ROOM * 3.16], [h1 + .1, ROOM]]); })();
  }
  var ROOM = .0108, RIPSLAP = .5, LAYER = .75;   /* the 1–3 kHz layer that lifts pops and rattles to ≈ −26 dB RMS */

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 condensed 84px Archivo', '800 condensed 84px Archivo', '700 condensed 84px Archivo', '900 extra-condensed 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹✓✕–@!>$(),:§+/=½'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initTimes();
  /* the hero hold: from the stamp settling to the torn edge, fully still */
  var HOLD = { t0: K.SLAM + .08, t1: K.W1 };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'whatif-password', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
