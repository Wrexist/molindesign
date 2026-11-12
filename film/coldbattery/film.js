/* "Your phone isn't dead. It's cold." — Factory #27 on Tech, explained, after ../deletephoto/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the frost line: a paper thermometer rides the left rail; when its line falls, cut-paper frost creeps
   in from the phone's edges, when it rises the frost peels off in strips. Every scene change is the same move: the outgoing
   scene frosts at its edges and peels away in five strips, the next scene already built under it. One hero stamp:
   IT COMES BACK (coral) over the relit phone; coral is also on the end card's YES / NO and nowhere else. A generic phone,
   weather card, support page, battery cells, coat and plug, drawn by hand: no logos, no real UI. Every scene is clipped
   to the safe box x 92–928, y 302–1428. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#10161c', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f3ecdf', INK = '#211d26', DARK = '#2a2b31', CASE = '#e4ddce', SCREEN = '#0b0e12';
  var ICE = '#d4ebf4', ICE2 = '#9fc8dc', ICE3 = '#6f9fb8', AMBER = '#ddc79a', WOOL = '#34465a', LINING = '#a8714d';
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
  var BODY = { thump: .2, knock: .14, slap: .1, paper: .17, pop: .12, tick: .05, click: .06 };
  var GT = {};
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  var K = {
    dead: at('hook', 'dead'), cold: at('hook', 'cold'), hookEnd: lend('hook'),
    ask: start('ask'), why: at('ask', 'why'), phoneA: at('ask', 'phone'), die: at('ask', 'die'), askEnd: lend('ask'),
    test: start('test'), weather: at('test', 'weather'), under: at('test', 'under'), u32: at('test', '32'), testEnd: lend('test'),
    apple: start('apple'), designs: at('apple', 'designs'), iphones: at('apple', 'iphones'), a32: at('apple', '32'), a95: at('apple', '95'), appleEnd: lend('apple'),
    slow: start('slow'), slows: at('slow', 'slows'), chem: at('slow', 'chemistry'), slowEnd: lend('slow'),
    half: start('half'), zero: at('half', '0f'), typical: at('half', 'typical'), halfW: at('half', 'half'), halfEnd: lend('half'),
    off: start('off'), volt: at('off', 'voltage'), drops: at('off', 'drops'), shuts: at('off', 'shuts'), offW: at('off', 'off'), offEnd: lend('off'),
    back: start('back'), warm: at('back', 'warm'), batt: at('back', 'battery'), comes: at('back', 'comes'), backW: at('back', 'back'), backEnd: lend('back'),
    pocket: start('pocket'), inside: at('pocket', 'inside'), pocketW: at('pocket', 'pocket'), pocketEnd: lend('pocket'),
    charge: start('charge'), cwarm: at('charge', 'warm'), before: at('charge', 'before'), chargeW: at('charge', 'charge'), chargeEnd: lend('charge'),
    end: start('end'), died: at('end', 'died'), yes: at('yn', 'yes'), noE: at('yn', 'no'), noEnd: wend('yn', 'no')
  };
  (function () {
    place('sb', 'pop', voiceEnd('hook', K.ask) + .06, .17, K.hookEnd, K.ask);                 /* the search bar lands */
    place('p1', 'paper', voiceEnd('ask', K.weather) + .04, .17, K.askEnd, K.weather);          /* peel into the weather card */
    place('hf', 'knock', voiceEnd('half', K.off) + .05, .16, K.halfEnd, K.off);               /* the 0°F cell drops to half */
    place('of', 'slap', voiceEnd('off', K.back) + .06, .16, K.offEnd, K.back);                 /* OFF */
    place('hero', 'thump', voiceEnd('back', K.pocket) + .05, .17, K.backEnd, K.pocket);       /* IT COMES BACK */
    place('pa', 'paper', K.testEnd + .6, .16, K.testEnd, K.apple);                              /* peel into Apple's page */
    place('pc', 'paper', K.slows - .5, .16, K.appleEnd, K.slow);                                /* peel into the cell */
    place('cp', 'paper', K.pocketEnd + .18, .16, K.pocketEnd, K.charge);                        /* the frost leaves the pocketed phone */
    place('pl', 'click', K.end - .3, .17, K.chargeEnd, K.end);                            /* the plug clicks in */
    var ce = wend('end', 'cold');
    place('ty', 'tick', ce + .16, .15, ce, K.yes);                                              /* YES taps down */
    place('tn', 'tick', (GT.ty != null ? GT.ty : ce + .16) + .12, .15, ce, K.yes);              /* NO taps down */
  })();
  var TW = .5;                                            /* a frost peel: 0.5 s */
  K.HERO = GT.hero != null ? GT.hero : K.backEnd + .15;
  K.OFFS = GT.of != null ? GT.of : K.offEnd + .15;
    K.HALF = GT.hf != null ? GT.hf : K.halfW + .3;
  K.HOLD1 = K.HERO + .13 + 1.9;                              /* the hero hold (≥ 1.6 s clean) ends here; the coat peels in after it */
  K.PLUG = GT.pl != null ? GT.pl : K.chargeEnd + .3;          /* the plug clicks in; the reading crosses 32°F just before */
  K.T32 = K.PLUG - .17;
  var SC = [
    { id: 'cold', fn: 'coldScene', name: 'Dead? Cold?', t0: 0 },
    { id: 'weather', fn: 'weatherScene', name: 'Check your weather app', t0: K.weather + .15 },
    { id: 'apple', fn: 'appleScene', name: 'Apple: 32° to 95°F', t0: GT.pa != null ? Math.max(GT.pa + .05 + TW, K.weather + 2.85) : K.designs + .1 },
    { id: 'cell', fn: 'cellScene', name: 'Cold slows the battery', t0: GT.pc != null ? Math.max(GT.pc + .05 + TW, K.slows - .1) : K.slows + .05 },
    { id: 'phone', fn: 'phoneScene', name: 'It shuts off, it comes back', t0: K.volt + .12 },
    { id: 'coat', fn: 'coatScene', name: 'Inside pocket', t0: K.HOLD1 + TW },
    { id: 'charge', fn: 'chargeScene', name: 'Warm it before you charge', t0: Math.max(K.cwarm + .1, K.HOLD1 + TW + 2.25) },
    { id: 'end', fn: 'endScene', name: 'Has yours died in the cold?', t0: K.died + .6 }
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

  /* ---------- cut-paper frost: ice shards anchored on a box's edges, pointing in; `amt` grows them, `peel` (0..1)
     flips them off left to right and drops them ---------- */
  var FSH = {};
  function shards(seed, w, h) {
    var key = seed + ':' + Math.round(w) + 'x' + Math.round(h); if (FSH[key]) return FSH[key];
    var r = mulberry(seed), S = [], per = 2 * (w + h), n = Math.round(per / 34), m = Math.min(w, h);
    for (var i = 0; i < n; i++) {
      var s = (i + r() * .8) / n * per, x, y, nx, ny;
      if (s < w) { x = s; y = 0; nx = 0; ny = 1; }
      else if (s < w + h) { x = w; y = s - w; nx = -1; ny = 0; }
      else if (s < 2 * w + h) { x = w - (s - w - h); y = h; nx = 0; ny = -1; }
      else { x = 0; y = h - (s - 2 * w - h); nx = 1; ny = 0; }
      var big = r() < .3;
      S.push({ x: x, y: y, ang: Math.atan2(-nx, ny) + (r() - .5) * .9, len: m * (big ? .13 + r() * .11 : .05 + r() * .07), wid: big ? 40 + r() * 34 : 20 + r() * 22,
        d: r() * .45, u: x / w, spin: (r() - .5) * 2.4, side: r() < .5 ? -1 : 1, kink: .35 + r() * .3 });
    }
    FSH[key] = S; return S;
  }
  function frost(g, x0, y0, w, h, amt, seed, peel, grow) {
    if (amt <= 0) return;
    var S = shards(seed, w, h), ex = EXITING;
    g.save(); g.translate(x0, y0);
    /* a thin rime over the whole face */
    g.fillStyle = 'rgba(212,235,244,' + (.1 * clamp(amt, 0, 1) * (1 - (peel || 0))) + ')'; g.fillRect(0, 0, w, h);
    S.forEach(function (s) {
      var k = clamp((amt * 1.45 - s.d) / .55, 0, 1); if (k <= 0) return;
      var kp = clamp((peel || 0) * 1.7 - s.u * .7, 0, 1); if (kp >= 1) return;
      var L = s.len * eout(k) * (1 + (grow || 0));
      g.save(); g.translate(s.x, s.y);
      if (kp > 0) { var e = eio(kp); EXITING = true; g.translate(30 * s.side * e, -40 * Math.sin(Math.PI * e) + 520 * e * e); g.rotate(s.spin * e); g.globalAlpha *= 1 - seg(kp, .55, 1); }
      g.rotate(s.ang);
      var hw = s.wid / 2;
      g.fillStyle = ICE; poly(g, [[-hw, -6], [hw, -6], [hw * .45 * s.side, L * s.kink], [0, L], [-hw * .3 * s.side, L * s.kink * .8]]); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2.5; g.stroke();
      g.strokeStyle = ICE2; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, L * .85); g.stroke();
      g.restore(); EXITING = ex;
    });
    g.restore();
  }

  /* ---------- a battery glyph: outline, nub, fill (no number) ---------- */
  function battGlyph(g, x, y, w, h, f, col, bolt) {
    g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = Math.max(3, h * .12);
    rr(g, x, y, w, h, h * .28); g.stroke(); g.fillRect(x + w + 2, y + h * .3, h * .16, h * .4);
    var p = h * .2; if (f > 0) { rr(g, x + p, y + p, (w - 2 * p) * clamp(f, 0, 1), h - 2 * p, h * .14); g.fill(); }
    if (bolt) { g.fillStyle = INK; poly(g, [[x + w * .56, y + h * .1], [x + w * .38, y + h * .56], [x + w * .5, y + h * .56], [x + w * .44, y + h * .92], [x + w * .64, y + h * .42], [x + w * .52, y + h * .42]]); g.fill(); }
    g.restore();
  }

  /* ---------- the big paper battery bar (no number): a grey charge level `f`; `ck` (0..1) wipes it back to cream ---------- */
  function bigBar(g, cx, cy, w, h, f, ck, unused, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    var x = cx - w / 2 - h * .08, y = cy - h / 2, r = h * .22, p = h * .14;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x + 6, y + 8, w, h, r); g.fill();
    g.fillStyle = PAPER; rr(g, x, y, w, h, r); g.fill(); rr(g, x + w + 4, y + h * .3, h * .16, h * .4, 4); g.fill();
    g.fillStyle = '#1c232b'; rr(g, x + p, y + p, w - 2 * p, h - 2 * p, r * .6); g.fill();
    var iw = w - 2 * p - 12, ih = h - 2 * p - 12;
    g.fillStyle = '#6d7278'; rr(g, x + p + 6, y + p + 6, iw * f, ih, r * .4); g.fill();
    if (ck > 0) { g.fillStyle = CREAM; rr(g, x + p + 6, y + p + 6, iw * f * clamp(ck, 0, 1), ih, r * .4); g.fill(); }
    prop(g, 'battery bar', x, y, x + w + 4 + h * .16, y + h);
    g.restore();
  }

  /* ---------- the phone: a cream paper case, a black glass screen (round punch-hole, no notch, no logo).
     o: rot about (px, py), on (0..1 lit), time, batt, bolt, frost, fpeel, seed, banner ---------- */
  function phone(g, cx, top, w, h, o) {
    o = o || {};
    g.save();
    if (o.rot) { g.translate(o.px, o.py); g.rotate(o.rot); g.translate(-o.px, -o.py); }
    var x0 = cx - w / 2, r = w * .14, bz = w * .045;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 12, top + 18, w, h, r); g.fill();
    g.fillStyle = CASE; rr(g, x0, top, w, h, r); g.fill();
    rr(g, x0, top, w, h, r); grainIn(g, x0, top, w, h, 501, .8);
    g.strokeStyle = 'rgba(33,29,38,.4)'; g.lineWidth = 4; rr(g, x0, top, w, h, r); g.stroke();
    g.fillStyle = '#c9c0ae'; rr(g, x0 + w - 3, top + h * .17, 9, h * .1, 4); g.fill(); rr(g, x0 - 6, top + h * .2, 9, h * .07, 4); g.fill();
    var sx0 = x0 + bz, sy0 = top + bz, sw = w - 2 * bz, sh = h - 2 * bz, sr = r - bz * .7;
    g.fillStyle = SCREEN; rr(g, sx0, sy0, sw, sh, sr); g.fill();
    g.save(); rr(g, sx0, sy0, sw, sh, sr); g.clip();
    g.fillStyle = 'rgba(255,255,255,.06)'; poly(g, [[sx0, sy0 + sh * .2], [sx0 + sw * .62, sy0], [sx0 + sw * .86, sy0], [sx0, sy0 + sh * .42]]); g.fill();
    if (o.on > 0) { g.save(); g.globalAlpha *= clamp(o.on, 0, 1); lockScreen(g, sx0, sy0, sw, sh, o); g.restore(); }
    if (o.under) o.under(sx0, sy0, sw, sh);
    g.restore();
    g.fillStyle = '#04060a'; el(g, cx, sy0 + sw * .075, w * .024, w * .024);
    prop(g, 'phone', x0, top, x0 + w, Math.min(top + h, SAFE_BOX.y1));
    if (o.frost > 0) { g.save(); rr(g, x0 - 2, top - 2, w + 4, h + 4, r); g.clip(); frost(g, x0, top, w, h, o.frost, o.seed || 11, o.fpeel || 0, o.fgrow || 0); g.restore(); }
    if (o.extra) o.extra(sx0, sy0, sw, sh);
    g.restore();
  }
  function lockScreen(g, x, y, w, h, o) {
    g.fillStyle = '#3d6378'; g.fillRect(x, y, w, h);
    g.fillStyle = '#2f5163'; poly(g, [[x, y + h * .7], [x + w * .3, y + h * .58], [x + w * .62, y + h * .68], [x + w, y + h * .55], [x + w, y + h], [x, y + h]]); g.fill();
    g.fillStyle = '#25414f'; poly(g, [[x, y + h * .84], [x + w * .45, y + h * .74], [x + w, y + h * .86], [x + w, y + h], [x, y + h]]); g.fill();
    var s = w / 470;
    if (o.time) onprop(function () { txt(g, o.time, x + w / 2, y + h * .16, Math.round(150 * s), CREAM, 'center', 800, DISP, w * .8, 1, 60, 'condensed'); });
    battGlyph(g, x + w - 112 * s, y + 34 * s, 58 * s, 28 * s, o.batt == null ? .6 : o.batt, CREAM, o.bolt);
    if (o.banner) o.banner(x, y, w, h, s);
  }

  /* ---------- the paper thermometer (the film's clock): cream tube, ink channel, a column that runs ice → amber ---------- */
  var TX = 150, TTOP = 668, TBOT = 1312, BULB = 1360;
  function ty(T) { return TBOT - (T + 10) / 110 * (TBOT - TTOP - 20); }
  function mercCol(T) { var k = seg(T, 20, 60); return k <= 0 ? ICE2 : k >= 1 ? AMBER : 'rgb(' + Math.round(lerp(159, 221, k)) + ',' + Math.round(lerp(200, 199, k)) + ',' + Math.round(lerp(220, 154, k)) + ')'; }
  function thermometer(g, t, x, T, o) {
    g.save(); g.translate(x, 0);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -24 + 8, TTOP - 40 + 12, 48, BULB - TTOP + 40, 24); g.fill(); el(g, 8, BULB + 12, 52, 52);
    g.fillStyle = PAPER; rr(g, -26, TTOP - 44, 52, BULB - TTOP + 44, 26); g.fill(); el(g, 0, BULB, 54, 54);
    g.fillStyle = 'rgba(33,29,38,.85)'; rr(g, -10, TTOP - 28, 20, BULB - TTOP + 28, 10); g.fill();
    var mc = mercCol(T);
    g.fillStyle = mc; el(g, 0, BULB, 36, 36); g.fillRect(-10, ty(T), 20, BULB - ty(T));
    /* ticks every 10° */
    g.strokeStyle = 'rgba(33,29,38,.55)'; g.lineWidth = 3;
    for (var d = 0; d <= 100; d += 10) { var yy = ty(d); g.beginPath(); g.moveTo(-26, yy); g.lineTo(d % 50 ? -16 : -12, yy); g.stroke(); }
    prop(g, 'thermometer', -26, TTOP - 44, 54, BULB + 54);
    /* Apple's range: a cream band on the right of the tube, 32° to 95° */
    if (o.band > 0) {
      var b0 = ty(32), b1 = lerp(b0, ty(95), eout(o.band));
      g.fillStyle = CREAM; rr(g, 34, b1, 18, b0 - b1, 8); g.fill();
      g.strokeStyle = CREAM; g.lineWidth = 4; g.beginPath(); g.moveTo(26, b0); g.lineTo(58, b0); g.moveTo(26, b1); g.lineTo(58, b1); g.stroke();
    }
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · frame 0: DEAD? COLD? over a frosted dark phone; the search bar (and the end: frame 0 again)
     ===================================================================================================== */
  var F0 = { cx: 510, top: 600, w: 476, h: 826, px: 510, py: 1426, rot: -.38, frost: .5 };   /* bottom edge inside y 1430 */
  function bigPhone(g, t, rot, fr, o) {
    o = o || {};
    var s = o.s || 1, w = F0.w * s, h = F0.h * s, top = F0.top + (o.dy || 0) + F0.h - h;
    phone(g, F0.cx + (o.dx || 0), top, w, h, { rot: rot, px: F0.px + (o.dx || 0), py: F0.py + (o.dy || 0), on: 0, frost: fr, seed: 11, fpeel: o.fpeel || 0, fgrow: o.grow || 0,
      under: function (sx, sy, sw) { bigBar(g, sx + sw / 2, sy + 210 * s, 280 * s, 112 * s, .6, 0, 0, .45); } });
  }
  function headline(g, t, a, struck, lit, lp) {
    if (a <= 0 || !LIVE.text) return;
    txt(g, 'DEAD?', CX, 410, 132, CREAM, 'center', 900, DISP, 820, a, 60, 'expanded');
    if (struck > 0) { g.save(); g.globalAlpha *= a; g.fillStyle = CREAM; g.fillRect(CX - 260, 404, 520 * struck, 14); g.restore(); }
    if (lit > 0) {
      var ps = lerp(.6, 1, Math.min(1.04, lp == null ? 1 : lp));
      g.save(); g.globalAlpha *= a * lit; font(g, 132, 900, DISP, 'expanded'); var tw = g.measureText('COLD?').width;
      g.translate(CX, 548); g.scale(ps, ps); g.translate(-CX, -548);
      g.fillStyle = CREAM; rr(g, CX - tw / 2 - 26, 548 - 74, tw + 52, 148, 26); g.fill(); g.restore();
    }
    txt(g, 'COLD?', CX, 548, 132, lit > .5 ? BG : CREAM, 'center', 900, DISP, 820, a, 60, 'expanded');
  }
  function tempChip(g, a, x, y) { if (a > 0) chip(g, '18°F', x, y, { px: 64, wt: 900, bg: ICE, fg: INK, a: a, w: 210, h: 92, r: 22, rot: .04 }); }
  function coldScene(g, t) {
    /* the phone swings upright from frame 0's tilt (its top travels ~330 px), then shrinks right as the thermometer comes in */
    var sw = sio(seg(t, 0, .95)), rot = lerp(F0.rot, 0, sw);
    var shift = eio(seg(t, K.ask - .1, K.ask + .5));
    var fr = lerp(F0.frost, 1, eout(seg(t, K.cold - .05, K.cold + .9)));
    var bob = seg(t, .95, 1.6);
    /* while the question is asked: a slow push in on the phone (1.0 → 1.12) and the frost reaches further in */
    var push = lerp(1, 1.12, sio(seg(t, 3.0, S('weather').t0))), grow = .9 * sio(seg(t, 3.0, 5.6));
    g.save(); g.translate(600, 1426); g.scale(push, push); g.translate(-600, -1426);
    bigPhone(g, t, rot + .012 * Math.sin(t * 1.7) * bob, fr, { dx: 90 * shift, dy: drift(t, .3, .6 * bob), s: lerp(1, .82, shift), grow: grow });
    g.restore();
    tempChip(g, 1 - shift, 800, 724 + drift(t, 1.2, .5 * bob));
    /* the headline: DEAD? struck on "dead", COLD? lit on "cold"; it lifts away as the search bar drops in */
    var SB0 = GT.sb != null ? GT.sb : K.hookEnd + .15, ha = 1 - seg(t, SB0 - .32, SB0 - .14);
    headline(g, t, ha, eout(seg(t, K.dead + .05, K.dead + .3)), seg(t, K.cold - .03, K.cold + .05), pop(t, K.cold - .03, 3.2));
    /* the search bar: the viewer's own question, typed in two lines */
    var SBt = GT.sb != null ? GT.sb : K.hookEnd + .15, SBin = K.dead + .32, sa = fin(t, SBin, 4);
    if (sa > 0 && LIVE.text) {
      var y = lerp(760, 456, eio(seg(t, SBt - .3, SBt))) + 30 * (1 - Math.min(1, pop(t, SBin, 3)));
      g.save(); g.globalAlpha *= sa;
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 128, y - 92, 780, 196, 40); g.fill();
      g.fillStyle = PAPER; rr(g, 120, y - 100, 780, 196, 40); g.fill();
      g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.arc(186, y - 12, 26, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(205, y + 8); g.lineTo(226, y + 30); g.stroke();
      var L1 = 'why does my phone', L2 = 'die in the cold?', k = seg(t, SBin + .05, SBin + .4), n = Math.round((L1.length + L2.length) * k);
      var s1 = L1.slice(0, Math.min(n, L1.length)), s2 = L2.slice(0, Math.max(0, n - L1.length));
      var typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
      onprop(function () { if (s1) txt(g, s1, 262, y - 44, 58, INK, 'left', 800, DISP, 0, 1); if (s2) txt(g, s2, 262, y + 30, 58, INK, 'left', 800, DISP, 0, 1); });
      NOREC = nr;
      if (typing && Math.floor(t * 4) % 2 === 0) { font(g, 58, 800, DISP); var cw = g.measureText(s2 || s1).width; g.fillStyle = INK; g.fillRect(266 + cw, (s2 ? y + 30 : y - 44) - 30, 5, 60); }
      g.restore();
    }
  }
  function endScene(g, t) {
    /* frame 0's layout at full opacity: the phone, frosted and dark; YES / NO; after "no" the headline returns and the
       phone swings back out to frame 0's tilt, so the last frame is frame 0 */
    var u = sio(seg(t, TEND - .95, TEND)), rot = lerp(0, F0.rot, u);
    var bob = 1 - seg(t, TEND - 1.2, TEND - .6);
    bigPhone(g, t, rot + .012 * Math.sin(t * 1.7) * bob, F0.frost + (1 - F0.frost) * (1 - seg(t, TEND - 1.1, TEND - .3)), { dy: drift(t, .3, .6 * bob) });
    tempChip(g, 1, 800, 724 + drift(t, 1.2, .5 * bob));
    /* YES / NO over the full-opacity phone; each taps down with a soft tick in the breath before "Yes or no" */
    var ya = fin(t, S('end').t0 - .3, 4) * (1 - seg(t, TEND - .3, TEND - .2)), yp = Math.min(1, pop(t, S('end').t0 - .3, 3));
    if (ya > 0) [['YES', 300, GT.ty], ['NO', 720, GT.tn]].forEach(function (c) {
      var tp = c[2] == null ? 0 : Math.sin(Math.PI * seg(t, c[2] - .03, c[2] + .12)), sc = 1 - .07 * tp;
      chip(g, c[0], c[1], 1180 + 16 * (1 - yp) + 10 * tp, { px: 116, wt: 900, bg: BG, line: HOT, lw: 8, fg: HOT, w: 300, h: 170, r: 60, shadow: true, a: ya, s: sc });
    });
    headline(g, t, seg(t, K.noEnd + .1, K.noEnd + .22), 0, 0);
  }

  /* =====================================================================================================
     SCENE 2 · check your weather app: a re-created card, 18°F; under the 32°F line everything frosts
     ===================================================================================================== */
  function snowflake(g, x, y, r, col) {
    g.save(); g.translate(x, y); g.strokeStyle = col; g.lineWidth = Math.max(4, r * .12); g.lineCap = 'round';
    for (var i = 0; i < 6; i++) { g.save(); g.rotate(i * Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r); g.moveTo(0, -r * .6); g.lineTo(-r * .22, -r * .8); g.moveTo(0, -r * .6); g.lineTo(r * .22, -r * .8); g.stroke(); g.restore(); }
    g.restore();
  }
  function iceGround(g, t, topY, a, seed) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    var r = mulberry(seed), P = [[SAFE_BOX.x0, SAFE_BOX.y1 + 10]];
    for (var x = SAFE_BOX.x0; x <= SAFE_BOX.x1 + 30; x += 34) P.push([x, topY + (r() - .2) * 34]);
    P.push([SAFE_BOX.x1 + 30, SAFE_BOX.y1 + 10]);
    g.fillStyle = 'rgba(159,200,220,.32)'; poly(g, P); g.fill();
    g.strokeStyle = ICE; g.lineWidth = 4; g.beginPath(); P.slice(1, -1).forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke();
    g.restore();
  }
  function weatherScene(g, t) {
    var d = drift(t, .7, .5), drop = eout(seg(t, S('weather').t0 - .5, S('weather').t0 + .1));
    var y0 = 610 + d - 0 * drop;
    /* the frozen ground: from the scene's start; it rises to the 32° line when the line draws */
    var gl = eio(seg(t, K.u32 - .05, K.u32 + .45));
    iceGround(g, t, lerp(1250, ty(32) + 4, gl), 1, 61);
    sheet(g, 300, y0, 880, y0 + 400, 211, PAPER, 'weather');
    onprop(function () {
      txt(g, 'NOW', 350, y0 + 66, 44, '#5d564c', 'left', 800, DISP, 200, 1, 40, 'condensed');
      txt(g, '18°F', 560, y0 + 238, 200, INK, 'center', 900, DISP, 420, 1, 80, 'condensed');
    });
    snowflake(g, 790, y0 + 220, 54 + 4 * Math.sin(t * 2), ICE3);
    tag(g, 'RE-CREATED', 742, y0 + 62, 1, .0, 260, INK, PAPER, 36);
    /* the condition, big, under the line, next to the reading */
    var ua = fin(t, K.weather + .1);
    if (ua > 0) chip(g, 'UNDER 32°F?', 610, 1250 + d, { px: 64, wt: 900, bg: ICE, fg: INK, a: ua, st: 'condensed', s: .9 + .1 * Math.min(1, pop(t, K.weather + .1, 3.2)) });
  }

  /* =====================================================================================================
     SCENE 3 · Apple's own range (a re-created support page, quoted word for word) → a band on the thermometer
     ===================================================================================================== */
  var AQ = ['“…designed for use where the', 'ambient temperature is between', '0º and 35º C (32º to 95º F)…”'];
  function appleScene(g, t) {
    var d = drift(t, .9, .5);
    sheet(g, 336, 600 + d, 912, 1004 + d, 311, PAPER, 'apple-page');
    onprop(function () {
      txt(g, 'APPLE SUPPORT', 366, 652 + d, 40, INK, 'left', 900, DISP, 360, 1, 36, 'condensed');
      AQ.forEach(function (L, i) { txt(g, L, 366, 760 + i * 68 + d, 50, INK, 'left', 700, DISP, 520, 1, 36, 'condensed'); });
      txt(g, 'PUBLISHED MAY 14, 2026', 366, 968 + d, 36, '#5d564c', 'left', 800, DISP, 560, 1, 36, 'condensed');
    });
    tag(g, 'RE-CREATED', 790, 652 + d, 1, 0, 240, INK, PAPER, 36);
    /* the claim in big type, scoped to air; Samsung's same range under it */
    var la = fin(t, S('apple').t0 + .15);
    if (la > 0) {
      txt(g, 'DESIGNED FOR', 624, 1112, 60, CREAM, 'center', 900, DISP, 600, la, 40, 'condensed');
      txt(g, '32°–95°F AIR', 624, 1186, 76, CREAM, 'center', 900, DISP, 600, la, 40, 'condensed');
    }
    var sa = fin(t, S('apple').t0 - .1);
    if (sa > 0) chip(g, 'GALAXY: SAME 32°–95°F · SAMSUNG', 624, 1310, { px: 42, wt: 800, line: CREAM, fg: CREAM, bg: 'rgba(16,22,28,.9)', a: sa, st: 'condensed', shadow: false, maxw: 590 });
  }

  /* =====================================================================================================
     SCENE 4 · inside the battery: a paper cell, ions crossing; cold slows them → at 0°F about half the capacity
     ===================================================================================================== */
  /* the beads' travelled distance: speed v0 until `a`, ramping to v1 by `b` (pure function of t) */
  function travel(t, v0, v1, a, b) {
    if (t <= a) return v0 * t;
    if (t <= b) { var u = t - a; return v0 * a + v0 * u - (v0 - v1) * u * u / (2 * (b - a)); }
    return v0 * a + v0 * (b - a) - (v0 - v1) * (b - a) / 2 + v1 * (t - b);
  }
  function cell(g, x0, y0, w, h, o) {
    var r = h * .16, ex = EXITING;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 10, y0 + 14, w, h, r); g.fill();
    g.fillStyle = CASE; rr(g, x0, y0, w, h, r); g.fill(); rr(g, x0, y0, w, h, r); grainIn(g, x0, y0, w, h, 701 + Math.round(y0), .8);
    g.fillStyle = '#c9c0ae'; rr(g, x0 + w - 2, y0 + h * .32, h * .14, h * .36, 6); g.fill();
    var ix0 = x0 + 24, iy0 = y0 + 24, iw = w - 48, ih = h - 48;
    g.fillStyle = '#1c232b'; rr(g, ix0, iy0, iw, ih, r * .6); g.fill();
    /* the capacity fill (half scene) */
    if (o.fill != null) { g.fillStyle = 'rgba(226,210,172,.9)'; rr(g, ix0 + 6, iy0 + 6, (iw - 12) * clamp(o.fill, 0, 1), ih - 12, r * .5); g.fill(); }
    /* two plates and the beads crossing between them */
    g.fillStyle = '#7d8a96'; g.fillRect(ix0 + 18, iy0 + 14, 22, ih - 28); g.fillRect(ix0 + iw - 40, iy0 + 14, 22, ih - 28);
    g.save(); g.beginPath(); g.rect(ix0 + 44, iy0, iw - 88, ih); g.clip();
    var span = iw - 100, rr0 = mulberry(o.seed || 5), lanes = o.lanes || 5;
    for (var i = 0; i < (o.n || 16); i++) {
      var ph = rr0(), lane = i % lanes, x = ix0 + 50 + ((ph * span + o.dist * (.8 + rr0() * .4)) % span), y = iy0 + ih * (lane + .5) / lanes + 6 * Math.sin(ph * 9 + o.dist * .02);
      g.fillStyle = CREAM; el(g, x, y, o.br || 13, o.br || 13);
    }
    g.restore();
    prop(g, 'cell', x0, y0, x0 + w, y0 + h);
    if (o.frost > 0) { g.save(); rr(g, x0, y0, w, h, r); g.clip(); frost(g, x0, y0, w, h, o.frost, o.seed + 40 || 45, 0); g.restore(); }
    EXITING = ex;
  }
  function cellScene(g, t) {
    var d = drift(t, .4, .5);
    var hk = eio(seg(t, K.zero - .1, K.zero + .55));       /* 0 = one big cell, 1 = the pair: on "zero degrees" */
    /* during "Cold slows…": a slow push in on the cell (1.0 → 1.15), released as the pair forms */
    var push = lerp(1, 1.15, sio(seg(t, S('cell').t0 - .3, K.half))) * (1 - hk) + hk;
    /* the slow cell becomes the 0°F cell (bottom); the 80°F cell drops in on top */
    var bx0 = lerp(272, 330, hk), by0 = lerp(700, 940, hk), bw = lerp(620, 540, hk), bh = lerp(330, 220, hk);
    var dist = travel(t, 260, 40, K.slows, K.slows + .9);
    var fill0 = hk > 0 ? lerp(1, .5, eio(seg(t, K.typical - .05, K.typical + .6))) : null;
    g.save(); g.translate(560, 865); g.scale(push, push); g.translate(-560, -865);
    /* the 0°F cell drops from ~250 px above its slot */
    cell(g, bx0, by0 + d, bw, bh, { dist: dist, frost: eout(seg(t, K.slows - .1, K.slows + 1.2)) * .9, seed: 5, fill: fill0, br: lerp(15, 12, hk) });
    g.restore();
    if (hk > 0) {
      g.save(); g.translate(0, -560 * (1 - hk)); var exh = EXITING; EXITING = exh || hk < 1;
      cell(g, 330, 660 + d, 540, 220, { dist: 260 * t, frost: 0, seed: 9, fill: 1, br: 12 });
      EXITING = exh; g.restore();
      var la = fin(t, K.zero + .45);
      if (la > 0) {
        chip(g, '80°F', 238, 770 + d, { px: 48, wt: 900, bg: CREAM, fg: INK, a: la, st: 'condensed', w: 128, h: 70 });
        chip(g, '0°F', 238, 1050 + d, { px: 48, wt: 900, bg: ICE, fg: INK, a: la, st: 'condensed', w: 128, h: 70 });
      }
      /* the fill length tells it (no numbers in the cells); the scope line says what it is and whose */
      var ca = fin(t, K.zero);
      if (ca > 0) {
        txt(g, '0°F: ABOUT HALF', 640, 1212, 56, CREAM, 'center', 900, DISP, 540, ca, 48, 'condensed');
        txt(g, 'THE CAPACITY', 640, 1268, 56, CREAM, 'center', 900, DISP, 540, ca, 48, 'condensed');
        txt(g, 'TYPICAL BATTERY vs 80°F', 640, 1326, 40, CREAM, 'center', 800, DISP, 540, ca, 36, 'condensed');
        txt(g, 'BATTERY UNIVERSITY', 640, 1376, 40, CREAM, 'center', 800, DISP, 540, ca, 36, 'condensed');
      }
    }
    /* the slow beat's label, until the pair arrives */
    var sa = fin(t, S('cell').t0 - .3) * (1 - seg(t, K.half - .12, K.half + .02));
    if (sa > 0) {
      txt(g, 'REACTION SLOWS', 620, 1150, 64, CREAM, 'center', 900, DISP, 580, sa, 40, 'condensed');
      txt(g, 'BATTERY UNIVERSITY', 620, 1230, 40, CREAM, 'center', 800, DISP, 580, sa, 36, 'condensed');
    }
  }

  /* =====================================================================================================
     SCENE 5 · the phone: the voltage dips, it shuts off → 20 minutes later, inside: the frost peels, it comes back
     ===================================================================================================== */
  function gauge(g, cx, cy, R, ang, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(cx + 8, cy + 12, R, Math.PI, 0); g.lineTo(cx + 8 + R, cy + 12 + 46); g.lineTo(cx + 8 - R, cy + 12 + 46); g.closePath(); g.fill();
    g.fillStyle = PAPER; g.beginPath(); g.arc(cx, cy, R, Math.PI, 0); g.lineTo(cx + R, cy + 46); g.lineTo(cx - R, cy + 46); g.closePath(); g.fill();
    g.beginPath(); g.rect(cx - R, cy - R, 2 * R, R + 46); grainIn(g, cx - R, cy - R, 2 * R, R + 46, 811, .8);
    /* the low zone: hatched ink */
    g.save(); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R - 14, Math.PI, Math.PI * 1.28); g.closePath(); g.clip();
    g.strokeStyle = INK; g.lineWidth = 6; for (var k = -R; k < R; k += 16) { g.beginPath(); g.moveTo(cx - R + k, cy); g.lineTo(cx - R + k + 120, cy - 120); g.stroke(); }
    g.restore();
    g.strokeStyle = INK; g.lineWidth = 4;
    for (var i = 0; i <= 8; i++) { var an = Math.PI + i * Math.PI / 8; g.beginPath(); g.moveTo(cx + Math.cos(an) * (R - 14), cy + Math.sin(an) * (R - 14)); g.lineTo(cx + Math.cos(an) * (R - (i % 4 ? 32 : 44)), cy + Math.sin(an) * (R - (i % 4 ? 32 : 44))); g.stroke(); }
    onprop(function () { txt(g, 'VOLTAGE', cx, cy + 22, 40, INK, 'center', 900, DISP, R * 1.6, 1, 36, 'condensed'); });
    g.strokeStyle = INK; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * (R - 40), cy + Math.sin(ang) * (R - 40)); g.stroke();
    g.fillStyle = INK; el(g, cx, cy, 16, 16);
    prop(g, 'gauge', cx - R, cy - R, cx + R, cy + 46);
    g.restore();
  }
  function phoneScene(g, t) {
    var d = drift(t, .5, .5), still = 1 - seg(t, K.HERO + .1, K.HERO + .13) * (1 - seg(t, K.HOLD1 - .02, K.HOLD1));
    d *= still;
    /* the screen: on; off on "shuts"; back on "comes" (twenty minutes later: 8:12) */
    var off = seg(t, K.shuts + .02, K.shuts + .08), on2 = eout(seg(t, K.batt - .05, K.batt + .25));
    var lit = (1 - off) + on2;
    var fr = lerp(.25, 1, eout(seg(t, K.volt - .1, K.offW + .3)));
    var fpeel = seg(t, K.warm - .05, K.comes - .05);
    /* the same phone, the same charge: a big paper battery bar, cream while it runs, grey once it shuts off, wiped back to
       cream to the same level as the frost peels (no number anywhere) */
    var ck = Math.max(1 - off, eio(seg(t, K.backW - .02, K.backW + .5)));   /* the refill: a ~0.5 s wipe on "back" */
    phone(g, 610, 764 + d, 380, 658, { on: lit, time: '', batt: .6, frost: fr, fpeel: fpeel, seed: 23,
      extra: function (sx, sy, sw) { bigBar(g, sx + sw / 2, sy + 108, 290, 116, .6, ck, 0, 1); } });
    /* the gauge in front of the phone's lower half: the needle dips on "drops"; it slides away on "But" */
    var dip = eio(seg(t, K.drops - .08, K.drops + .35)), gout = eio(seg(t, K.back - .1, K.back + .4));
    var ang = lerp(-.62, -2.78, dip) + .03 * Math.sin(t * 7) * (1 - dip) - lerp(0, .4, gout);
    var exg = EXITING; EXITING = exg || gout > 0; gauge(g, 610, 1300 + 420 * gout + d, 200, ang, 1 - gout); EXITING = exg;
    /* the chain of cause, from Apple's page: until "But" */
    var ca = fin(t, K.volt - .05) * (1 - seg(t, K.back - .15, K.back + .05));
    if (ca > 0) {
      chip(g, 'COLD RAISES RESISTANCE', 510, 618, { px: 44, wt: 900, bg: CREAM, fg: BG, a: ca, st: 'condensed', shadow: false });
      chip(g, 'SO VOLTAGE DROPS · APPLE', 510, 682, { px: 44, wt: 900, bg: CREAM, fg: BG, a: ca * fin(t, K.drops - .05), st: 'condensed', shadow: false });
    }
    /* OFF: a quiet cream stamp in the pause after the line */
    var oi = fin(t, K.offW, 4);
    if (oi > 0 && t < K.OFFS) txt(g, 'OFF', 610, 1010 + d, 150, CREAM, 'center', 900, DISP, 0, oi, 60, 'extra-condensed');
    if (t >= K.OFFS && t < K.back + .25) stamp(g, 'OFF', 610, 1010 + d, t, K.OFFS, 150, CREAM, -.06, .5);
    /* 20 MIN LATER · INSIDE slaps in on "But" */
    var tc = fin(t, K.back - .05, 4) * (1 - seg(t, K.HERO - .2, K.HERO - .05));
    if (tc > 0) chip(g, 'LATER · INSIDE', 510, 640, { px: 52, wt: 900, bg: ICE, fg: INK, a: tc, st: 'condensed', s: 1.08 - .08 * Math.min(1, pop(t, K.back - .05, 4)), rot: -.02 });
    /* Apple's sentence, word for word, from "But" through the hold */
    var qa = fin(t, K.back + .05);
    if (qa > 0) {
      g.save(); g.globalAlpha *= qa;
      sheet(g, 214, 1212 + d, 926, 1426, 913, PAPER, 'quote');
      onprop(function () {
        txt(g, '“Battery life will return to normal', 246, 1252 + d, 44, INK, 'left', 700, DISP, 660, 1, 36, 'condensed');
        txt(g, 'when you bring your device back to', 246, 1300 + d, 44, INK, 'left', 700, DISP, 660, 1, 36, 'condensed');
        txt(g, 'higher ambient temperatures.”', 246, 1348 + d, 44, INK, 'left', 700, DISP, 660, 1, 36, 'condensed');
        txt(g, 'APPLE SUPPORT · MAY 14, 2026', 246, 1398 + d, 36, '#5d564c', 'left', 800, DISP, 660, 1, 36, 'condensed');
      });
      g.restore();
    }
    /* the hero: the words ink in cream on "comes"; the coral stamp slams on the thump in the silence */
    var hk = fin(t, K.comes - .05, 4);
    /* above the phone, not on it: the coral stamp lands as the bar's wipe finishes (LATER · INSIDE makes way for it) */
    stamp(g, 'IT COMES\nBACK', 520, 626, t, K.HERO, 104, HOT, -.07, .45);
  }

  /* =====================================================================================================
     SCENE 6 · keep it in an inside pocket (our tip: a cut-paper coat)
     ===================================================================================================== */
  function coatScene(g, t) {
    var d = drift(t, .2, .5), C0 = S('coat').t0, op = eio(seg(t, C0 - .3, C0 + .35));
    var LIN = '#6e5a78', LIN2 = '#5a4864', LAP = '#5b728b';
    /* the lining (a different colour from the wool), quilted faintly, with its inside pocket */
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(250, 620, 620, 830);
    g.fillStyle = LIN; cut(g, [[240, 600], [860, 600], [860, 1440], [240, 1440]], mulberry(601), 2);
    g.beginPath(); g.rect(240, 600, 620, 840); grainIn(g, 240, 600, 620, 840, 602, .7);
    g.save(); g.beginPath(); g.rect(240, 600, 620, 840); g.clip(); g.strokeStyle = 'rgba(244,237,224,.12)'; g.lineWidth = 3;
    for (var q = -840; q < 620; q += 70) { g.beginPath(); g.moveTo(240 + q, 600); g.lineTo(240 + q + 840, 1440); g.moveTo(860 - q, 600); g.lineTo(860 - q - 840, 1440); g.stroke(); }
    g.restore();
    prop(g, 'coat', 240, 600, 860, 1428);
    /* the phone slides down into the pocket as the coat opens and settles with the rustle; its frost is already gone */
    var px = 640, CP = GT.cp != null ? GT.cp : K.pocketEnd + .2, pin = eio(seg(t, C0 - .1, CP));
    var py = lerp(560, 930, pin) + d;
    phone(g, px, py, 200, 350, { on: 0, frost: .9, fpeel: seg(t, C0 - .3, C0 + .35), seed: 31 });
    /* the pocket front, over the phone */
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(526, 1066 + d, 240, 270);
    g.fillStyle = LIN2; cut(g, [[516, 1056 + d], [756, 1056 + d], [756, 1326 + d], [516, 1326 + d]], mulberry(603), 1.5);
    g.save(); g.setLineDash([12, 10]); g.strokeStyle = 'rgba(244,237,224,.55)'; g.lineWidth = 4; rr(g, 530, 1070 + d, 212, 242, 6); g.stroke(); g.restore();
    /* the coat's two wool fronts, each with a V lapel folded back, opening */
    [[-1, 240], [1, 860]].forEach(function (sd) {
      var s0 = sd[0], edge = lerp(550, s0 < 0 ? 420 : 800, op), ex = sd[1], neck = 640, lb = 930;
      g.fillStyle = 'rgba(0,0,0,.4)'; poly(g, [[ex, 600], [edge + 12 * -s0, 600], [edge + 12 * -s0, 1440], [ex, 1440]]); g.fill();
      g.fillStyle = WOOL; poly(g, [[ex - 30 * s0, 590], [edge, 590], [edge, 1440], [ex - 30 * s0, 1440]]); g.fill();
      g.beginPath(); g.rect(Math.min(ex, edge) - 30, 590, Math.abs(ex - edge) + 60, 850); grainIn(g, Math.min(ex, edge) - 30, 590, Math.abs(ex - edge) + 60, 850, 640 + ex, .6);
      /* the lapel: a lighter triangle from the collar down to the top button, its fold line stitched */
      var lw = 120;
      g.fillStyle = 'rgba(0,0,0,.35)'; poly(g, [[edge, neck - 40], [edge + s0 * lw + 8, neck - 30], [edge + 8, lb + 10]]); g.fill();
      g.fillStyle = LAP; poly(g, [[edge, neck - 40], [edge + s0 * lw, neck - 40], [edge + s0 * 30, neck + 40], [edge, lb]]); g.fill();
      g.strokeStyle = 'rgba(244,237,224,.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(edge + s0 * lw, neck - 40); g.lineTo(edge, lb); g.stroke();
      g.strokeStyle = 'rgba(244,237,224,.22)'; g.lineWidth = 4; g.beginPath(); g.moveTo(edge, 590); g.lineTo(edge, 1440); g.stroke();
      /* the collar band across the top */
      g.fillStyle = LAP; poly(g, [[ex - 30 * s0, 590], [edge + s0 * lw, 590], [edge + s0 * lw, neck - 40], [ex - 30 * s0, neck - 70]]); g.fill();
      if (s0 > 0) { [lb + 60, 1150, 1330].forEach(function (yy) { g.fillStyle = 'rgba(0,0,0,.4)'; el(g, edge + 50, yy + d + 4, 19, 19); g.fillStyle = '#d9cfbb'; el(g, edge + 46, yy + d, 18, 18); g.fillStyle = 'rgba(33,29,38,.5)'; el(g, edge + 41, yy + d - 4, 3, 3); el(g, edge + 51, yy + d + 4, 3, 3); }); }
      else { g.strokeStyle = 'rgba(244,237,224,.3)'; g.lineWidth = 4; [lb + 60, 1150, 1330].forEach(function (yy) { g.beginPath(); g.moveTo(edge - 60, yy + d); g.lineTo(edge - 24, yy + d); g.stroke(); }); }
    });
    var la = fin(t, S('coat').t0 - .3);
    if (la > 0) { chip(g, 'INSIDE', 380, 1150 + d, { px: 54, wt: 900, bg: CREAM, fg: BG, a: la, st: 'condensed', shadow: true }); chip(g, 'POCKET', 380, 1226 + d, { px: 54, wt: 900, bg: CREAM, fg: BG, a: la, st: 'condensed', shadow: true }); }
  }

  /* =====================================================================================================
     SCENE 7 · let it warm up before you charge it: the plug waits, Apple's "Charging On Hold" (re-created)
     ===================================================================================================== */
  function chargeScene(g, t) {
    var d = drift(t, .8, .5);
    /* the banner agrees with the thermometer every frame: "On Hold" while the reading is under 32°F; at 32°F it gives way
       to a plain charging bolt, the plug slides up and clicks in */
    var hold = t < K.T32, plugged = t >= K.PLUG, bp = pop(t, K.PLUG, 3.4);
    phone(g, 610, 712 + d, 400, 600, { on: 1, time: '8:31', batt: .6, bolt: plugged, frost: 0, seed: 41, banner: function (x, y, w, h, s) {
      g.fillStyle = 'rgba(244,237,224,.94)'; rr(g, x + 16, y + h * .36, w - 32, 132, 24); g.fill();
      battGlyph(g, x + 40, y + h * .36 + 50, 52, 26, .6, INK, plugged);
      onprop(function () {
        txt(g, 'Charging', x + 112, y + h * .36 + (hold ? 44 : 66), 44, INK, 'left', 800, DISP, w - 140, 1, 36, 'condensed');
        if (hold) txt(g, 'On Hold', x + 112, y + h * .36 + 92, 44, INK, 'left', 800, DISP, w - 140, 1, 36, 'condensed');
      });
      if (plugged) { /* the plain bolt, big, under the banner */
        var bx = x + w / 2, by = y + h * .36 + 292, k = Math.min(1.04, bp);
        g.save(); g.translate(bx, by); g.scale(k, k); g.fillStyle = CREAM;
        poly(g, [[14, -70], [-40, 10], [-4, 10], [-16, 70], [40, -14], [4, -14]]); g.fill(); g.restore();
      }
      tag(g, 'RE-CREATED', x + w / 2, y + h * .36 + 176, 1, 0, w - 30, CREAM, 'rgba(16,22,28,.85)', 36);
    } });
    /* the plug: rises from below and waits short of the port; at 32°F it slides up and clicks in */
    var rise = eout(seg(t, S('charge').t0 - .5, S('charge').t0 + .3)), seat = eio(seg(t, K.T32, K.PLUG)), wig = 6 * Math.sin(t * 9) * rise * (1 - seat);
    var py = lerp(1500, 1392, rise) - 54 * seat + wig + d;
    g.fillStyle = '#d9d2c3'; g.fillRect(596, py + 70, 28, 200);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 572 + 6, py + 8, 76, 112, 12); g.fill();
    g.fillStyle = PAPER; rr(g, 572, py, 76, 112, 12); g.fill();
    g.fillStyle = '#9b9384'; rr(g, 592, py - 26, 36, 30, 6); g.fill();
    prop(g, 'plug', 572, py - 26, 648, Math.min(py + 270, SAFE_BOX.y1));
    var wa = fin(t, S('charge').t0 - .3);
    if (wa > 0) {
      chip(g, 'WARM FIRST', 540, 540, { px: 50, wt: 900, bg: CREAM, fg: INK, a: wa, st: 'condensed' });
      /* who says so: the banner is Apple's; the 32°F floor for charging is Battery University's */
      txt(g, 'APPLE: ‘CHARGING ON HOLD’', 540, 606, 38, CREAM, 'center', 800, DISP, 560, wa, 36, 'condensed');
      txt(g, 'BATTERY UNIVERSITY:', 540, 646, 38, CREAM, 'center', 800, DISP, 560, wa, 36, 'condensed');
      txt(g, 'NO CHARGING BELOW 32°F', 540, 686, 38, CREAM, 'center', 800, DISP, 560, wa, 36, 'condensed');
    }
  }

  /* ---------- the thermometer's state: where it is, what it reads (a pure function of t) ---------- */
  function thermoState(t) {
    var inA = eio(seg(t, K.ask - .1, K.ask + .45)), outC = eio(seg(t, K.HOLD1, K.HOLD1 + TW)), inC = eio(seg(t, S('charge').t0 - TW, S('charge').t0 + .1)), outE = eio(seg(t, S('end').t0 - .38, S('end').t0 - .05));
    var vis = t < S('charge').t0 - TW ? inA * (1 - outC) : inC * (1 - outE);
    var T = 18;
    T = lerp(T, 8, eio(seg(t, K.slows - .05, K.slows + .8)));
    T = lerp(T, 0, eio(seg(t, K.zero - .05, K.zero + .5)));
    T = lerp(T, 18, eio(seg(t, S('phone').t0 - TW, S('phone').t0)));
    T = lerp(T, 68, eio(seg(t, K.warm - .05, K.comes)));
    /* the charge beat: it comes in at 20°F (ice) and climbs steadily, crossing 32°F exactly when "On Hold" gives way */
    if (t >= S('charge').t0 - TW) { var c0 = S('charge').t0 - .2, v = 12 / (K.T32 - c0), u = t - c0; T = 20 + (u <= 0 ? 0 : u < .3 ? v * u * u / .6 : v * (u - .15)); T += 12 - v * (K.T32 - c0 - .15); }
    var band = t < S('cell').t0 ? eout(seg(t, K.a32 - .1, K.a95 + .1)) * (1 - seg(t, S('cell').t0 - TW, S('cell').t0 - TW + .2)) : (t >= S('charge').t0 - TW ? 1 : 0);
    var line32 = fin(t, K.u32 - .05) * (1 - seg(t, S('apple').t0 - TW, S('apple').t0 - TW + .15));
    var hide = t >= K.zero + .45 && t < S('phone').t0 - TW;   /* the cells carry their own 0°F / 80°F tags */
    return { x: lerp(-200, TX, vis), vis: vis, T: T, band: band, line32: line32, hide: hide };
  }
  function thermoLayer(g, t) {
    var s = thermoState(t); if (s.vis <= 0) return;
    var ex = EXITING; EXITING = ex || s.vis < 1;
    thermometer(g, t, s.x, s.T, { band: s.band });
    /* the 32° line: drawn out from the tube across the frame (the frost line) */
    if (s.line32 > 0) {
      var y = ty(32), x1 = lerp(s.x + 30, 900, eout(s.line32));
      g.save(); g.setLineDash([22, 14]); g.lineDashOffset = -t * 20; g.strokeStyle = CREAM; g.lineWidth = 6; g.beginPath(); g.moveTo(s.x + 30, y); g.lineTo(x1, y); g.stroke(); g.restore();
      txt(g, '32°F', 860, y - 40, 44, CREAM, 'center', 900, DISP, 0, seg(s.line32, .7, 1), 36, 'condensed');
    }
    if (s.band > .6) {
      var ba = seg(s.band, .6, 1);
      chip(g, '95°F', s.x + 112, ty(95), { px: 40, wt: 900, bg: CREAM, fg: INK, a: ba, st: 'condensed', shadow: false, w: 112, h: 54 });
      chip(g, '32°F', s.x + 112, ty(32), { px: 40, wt: 900, bg: CREAM, fg: INK, a: ba, st: 'condensed', shadow: false, w: 112, h: 54 });
    }
    /* the reading, next to the column's top */
    var Tq = s.T < 32 && s.T > 31 ? 31 : Math.round(s.T), moving = Math.abs(s.T - Math.round(s.T)) > .01 || Math.abs(thermoState(t - 1 / 30).T - s.T) > .05;
    var nr = NOREC; NOREC = nr || moving;
    var yr = clamp(ty(s.T), ty(95) + 70, ty(-10));
    if (s.band > .6 && Math.abs(yr - ty(32)) < 64) yr = s.T < 32 ? ty(32) + 64 : ty(32) - 64;
    if (!s.hide) chip(g, Tq + '°F', s.x + 112, yr, { px: 44, wt: 900, bg: s.T > 40 ? CREAM : mercCol(s.T), fg: INK, a: 1, st: 'condensed', w: 118, h: 58 });
    NOREC = nr; EXITING = ex;
  }

  /* ---------- captions: the narrator's words in phrase cards (one size); stressed words get a cream pill (never coral) ---------- */
  var CAPGROUPS = { test: [[4], [3]], apple: [[3, 5]], slow: [[4, 3]], half: [[2], [3, 5]], off: [[3], [4, 3]], back: [[4], [4, 2]], pocket: [[3, 3]], charge: [[5, 4]], end: [[3, 3]], yn: [[3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card) { var n = card.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['test', 'weather'], ['test', '32'], ['apple', '32'], ['slow', 'slows'], ['half', 'half'], ['off', 'shuts'], ['back', 'back'], ['pocket', 'inside'], ['charge', 'before'], ['end', 'cold']]
    .map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPPX = 58, CAPMIN = 1e9;
  function capStart(c) { return c.t0 - .04; }
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= capStart(c)) { card0 = c; ci = i; } });
    if (!card0) return;
    var s = capStart(card0), nx = CAPS[ci + 1], ns = nx ? capStart(nx) : 1e9;
    var keep = nx && ns - card0.t1 < 2.4;
    var o1 = keep ? ns - .04 : Math.min(card0.t1 + .5, ns - .04), o0 = o1 - .1;
    var fi = seg(t, s, s + .08), out = 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - s, 3.2, .8), 0, 1.04);
    g.save(); var cpx = CAPPX; font(g, cpx, 800, DISP, 'expanded');
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = cpx * .3, maxw = 820, lines = [], lw, wi = 0;
    card0.split.forEach(function (n) { var ln = [], w = 0; for (var j = 0; j < n; j++, wi++) { if (w + ws[wi] > maxw && ln.length) { lines.push(ln); ln = []; w = 0; } ln.push(wi); w += ws[wi] + gap; } lines.push(ln); });
    lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    var lh = cpx * 1.18, y0 = Math.max(440 - (lines.length - 1) * lh / 2, 308 + cpx * .9);   /* pill tops at y ≥ 304 */
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
  var NOISE, SCENES = { coldScene: coldScene, weatherScene: weatherScene, appleScene: appleScene, cellScene: cellScene, phoneScene: phoneScene, coatScene: coatScene, chargeScene: chargeScene, endScene: endScene };
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(52,74,92,.34)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function safeClip(g) { g.beginPath(); g.rect(SAFE_BOX.x0, SAFE_BOX.y0, SAFE_BOX.x1 - SAFE_BOX.x0, SAFE_BOX.y1 - SAFE_BOX.y0); g.clip(); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) { g.save(); SCENES[Sc.fn](g, t); g.restore(); }
  /* the peel: the outgoing scene rimes over and comes away in five strips, left first; each strip lifts, tilts and falls */
  var NS = 5, SW = (SAFE_BOX.x1 - SAFE_BOX.x0) / NS;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var wk = Nx ? seg(te, Nx.t0 - TW, Nx.t0) : 0;
    g.save(); safeClip(g);
    if (wk > 0) {
      var nr = NOREC; NOREC = wk < .4; drawScene(g, Nx, t); NOREC = nr;
      for (var i = NS - 1; i >= 0; i--) {
        var k = clamp((wk - i * .09) / (1 - (NS - 1) * .09), 0, 1); if (k >= 1) continue;
        var e = eio(k), x0 = SAFE_BOX.x0 + i * SW, sgn = i % 2 ? 1 : -1;
        g.save(); EXITING = true; NOREC = true;
        g.translate(x0 + SW / 2, SAFE_BOX.y0); g.rotate(sgn * .2 * e); g.translate(-(x0 + SW / 2), -SAFE_BOX.y0); g.translate(24 * sgn * e, -30 * Math.sin(Math.PI * Math.min(1, k * 2)) + 1500 * Math.pow(Math.max(0, k - .15) / .85, 2));
        /* an opaque strip of the old scene with a 6 px drop shadow: nothing of either scene shows through it */
        g.save(); g.translate(6, 6); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x0, SAFE_BOX.y0, SW, SAFE_BOX.y1 - SAFE_BOX.y0); g.restore();
        g.save(); g.beginPath(); g.rect(x0, SAFE_BOX.y0, SW + .5, SAFE_BOX.y1 - SAFE_BOX.y0); g.clip(); g.globalAlpha = 1; stage(g); drawScene(g, Sc, t); g.restore();
        g.strokeStyle = ICE; g.lineWidth = 4; g.strokeRect(x0 + 2, SAFE_BOX.y0 + 2, SW - 4, SAFE_BOX.y1 - SAFE_BOX.y0 - 4);
        EXITING = false; NOREC = nr; g.restore();
      }
    } else drawScene(g, Sc, t);
    thermoLayer(g, t);
    g.restore();
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) captions(g, t, 1 - seg(t, K.noEnd + .04, K.noEnd + .14));
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 62, 800, DISP, 'expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('Why your phone dies', CX, 404);
    var b = 'in the cold', bp = 62; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 490 - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 490); g.restore();
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
  var GAIN = { sb: .55, p1: .5, pa: .4, pc: .4, hf: .75, of: .3, hero: .22, cp: .4, pl: .55, ty: .35, tn: .35 };
  var TYPE = { sb: 'pop', p1: 'paper', pa: 'paper', pc: 'paper', hf: 'knock', of: 'slap', hero: 'thump', cp: 'paper', pl: 'click', ty: 'tick', tn: 'tick' };
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
      var o = osc('sine', 250, t, t + .2, 1, [[t, 0], [t + .012, .5 * g], [t + .14, .46 * g], [t + .19, 0]], .05); o.frequency.exponentialRampToValueAtTime(170, t + .18);
      osc('triangle', 330, t, t + .14, 1, [[t, 0], [t + .004, .32 * g], [t + .06, .22 * g], [t + .13, 0]], .03);
      band(t, .15, 1600, .9, 3.8 * g, .008, .05);
      band(t, .1, 2500, 1.1, 2.3 * g, .006, .03);
      band(t + .001, .17, 1800, .55, 3.6 * g, .008, .04);
    }
    /* a flat paper slap (the quiet OFF stamp) */
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); }
    /* a soft paper pop (the search bar landing) */
    function popS(t, g) { g = g || 1; band(t, .03, 3200, 1.8, 5 * g, .001, .02); band(t + .002, .05, 1500, 2.2, .8 * g, .001, .02); }
    /* frost peeling off a page: a run of tiny 2–5 kHz ice crackles over a soft paper body */
    function peelS(t, g) {
      g = g || 1; var r = mulberry(Math.floor(t * 1000));
      for (var k = 0; k < 13; k++) { var tk = t + k * .011 + r() * .004; band(tk, .016, 2000 + r() * 3000, 1.5, (1.5 + r() * 1.4) * g * (1 - k / 18), .001, .03, -.2 + k * .03); }
      var n = noise(t, .17), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .8; bp.frequency.setValueAtTime(2600, t); bp.frequency.exponentialRampToValueAtTime(1300, t + .16);
      var ob = bus(1, .04, 0); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .02, 1.0 * g], [t + .12, .6 * g], [t + .17, 0]]);
    }
    /* a plug or a cell settling: a small knock with a 1–3 kHz click */
    function knockS(t, g) {
      g = g || 1;
      osc('triangle', 360, t, t + .13, 1, [[t, 0], [t + .003, .5 * g], [t + .05, .25 * g], [t + .12, 0]], .03);
      osc('sine', 2650, t, t + .07, 1, [[t, 0], [t + .002, .35 * g], [t + .06, 0]], .02);
      band(t, .05, 1900, 1.2, 3.2 * g, .001, .03);
      band(t, .025, 2600, 1.4, 2.4 * g, .001, .02);                 /* the 1–3 kHz transient that carries on a phone */
    }
    /* the plug seating: a short dry click */
    function clickS(t, g) { g = g || 1; band(t, .018, 2300, 2, 5 * g, .0008, .01); band(t + .03, .02, 1700, 2, 3 * g, .0008, .01); osc('sine', 3100, t, t + .04, 1, [[t, 0], [t + .001, .25 * g], [t + .035, 0]], .01); }
    /* a chip tapping down: one soft paper tick */
    function tickS(t, g) { g = g || 1; band(t, .03, 3000, 1.6, 3.5 * g, .001, .02); band(t, .04, 1400, 1.5, 1.2 * g, .001, .02); }
    EV.forEach(function (e) {
      if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'pop') { popS(e.t, e.g); slapS(e.t + .002, LAYER * e.g); }
      else if (e.type === 'paper') peelS(e.t, e.g);
      else if (e.type === 'knock') knockS(e.t, e.g);
      else if (e.type === 'click') clickS(e.t, e.g);
      else if (e.type === 'tick') tickS(e.t, e.g);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone, about −60 dB, so the loop seam is never digital zero; a little more room under the hero hold */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o);
      var h0 = K.HERO + .05, h1 = HOLD.t1 + .1;
      env(o.gain, [[0, ROOM], [h0, ROOM], [h0 + .2, ROOM * 3.16], [h1 - .15, ROOM * 3.16], [h1 + .1, ROOM]]); })();
  }
  var ROOM = .0108, LAYER = .9;

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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°º×−≈≠µ“”‘’·→…#?‹›✓✕–@!>$(),:§+/=½~'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initTimes();
  /* the hero hold: from the stamp settling to the coat's peel (the only still in the film) */
  var HOLD = { t0: K.HERO + .13, t1: K.HOLD1 };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'coldbattery', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
