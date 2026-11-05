/* "That ChatGPT energy stat is old." — Factory #22 on Tech, explained (How tech works), after ../detect/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   One hand-made hero prop: a cut-paper kitchen range (720 × 700) with a 300 px mechanical kitchen timer, drawn here: no
   lightning bolts, no glowing lines, no server racks, no app UI. The native move is the timer: it ticks one notch on
   "second". One hero stamp: ABOUT 1 SECOND (coral); coral is also on the end card's YES / NO and nowhere else.
   Every figure keeps its own source and scope from its first frame; the oven stays with Altman's 0.34 Wh, the TV with
   Google's 0.24 Wh, the 13x with Microsoft Research. Every scene is clipped to the safe box x 90–930, y 300–1430. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', INK = '#211d26';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var SAFE_BOX = { x0: 92, y0: 302, x1: 928, y1: 1428 };

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function eout(k) { return 1 - Math.pow(1 - k, 3); }
  function ein(k) { return k * k * k; }
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
  function wrap(v, m) { return ((v % m) + m) % m; }

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
    hook: start('hook'), old: at('hook', 'old'), hookEnd: lend('hook'),
    myth: start('myth'), ten: at('myth', 'ten'), searches: at('myth', 'searches'), mythEnd: lend('myth'),
    ask: start('ask'), askEnd: lend('ask'),
    maker: start('maker'), boss: at('maker', 'boss'), says: at('maker', 'says'), third: at('maker', 'third'), watt: at('maker', 'watthour'), makerEnd: lend('maker'),
    hero: start('hero'), second: at('hero', 'second'), oven: at('hero', 'oven'), heroEnd: lend('hero'),
    gem: start('gemini'), median: at('gemini', 'median'), under: at('gemini', 'under'), nine: at('gemini', 'nine'), tv: at('gemini', 'tv'), gemEnd: lend('gemini'),
    out: start('outside'), same: at('outside', 'same'), outEnd: lend('outside'),
    but: start('but'), long: at('but', 'long'), thinking: at('but', 'thinking'), butEnd: lend('but'),
    dip: start('dip'), thirteen: at('dip', 'thirteen'), y2026: at('dip', '2026'), study: at('dip', 'study'), dipEnd: lend('dip'),
    tip: start('tip'), skip: at('tip', 'skip'), mode: at('tip', 'mode'), tipEnd: lend('tip'),
    end: start('end'), yes: at('end', 'yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  /* the hits are placed from the heard words before anything is timed off them (see the SFX gate below) */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  var lastE = EDGES.length ? Math.max.apply(null, EDGES) : -1;
  VO.lines.forEach(function (l) { if (l.t0 > lastE + .3) l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 + .15 }); EDGES.push(w.t0, w.t1 + .15); }); });
  /* where the hero line's voice really stops (its last word rings past the vo.js end) */
  var heroV = K.heroEnd; VOICED.forEach(function (v) { if (v.t0 < K.heroEnd + .3 && v.t1 > heroV && v.t1 < K.gem) heroV = v.t1; });
  var BODY = { thump: .2, knock: .22, tick: .05, pop: .12, paper: .17, swish: .28, tear: .12, slap: .1, click: .06, clunk: .15 };
  var GT = {};
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  (function () {
    /* THE thump: as soon after "oven." as the gate allows, so the hold that follows is long */
    place('slam', 'thump', heroV + .04, .2, K.heroEnd, K.gem - .9);
    if (GT.slam === null) GT.slam = Math.max(K.heroEnd + .2, heroV + .16);
    /* the pen scratch on 10x, in the written gap after "searches?" */
    place('scratch', 'paper', K.mythEnd + .1, .18, K.mythEnd, K.ask);
    /* the price tag's swing, after "use?" if a gap holds it */
    place('swing', 'pop', K.askEnd + .08, .16, K.askEnd, K.maker + .05);
    /* the meter's clunk on 13x, in the written gap after "study." */
    place('clunk', 'clunk', K.dipEnd + .12, .18, K.dipEnd, K.tip);
    /* the THINKING toggle's click, in the gap after "mode." */
    place('toggle', 'click', K.tipEnd + .12, .16, K.tipEnd, K.end);
    /* soft rips on the torn wipes, only where a gap holds them: the hero's exit (in the hold's silence) and after "same." */
    place('tear1', 'tear', K.gem - .34, .12, GT.slam + .3, K.gem);
    place('tear2', 'tear', K.outEnd + .3, .16, K.outEnd, K.but);
  })();
  /* the strike lands on its scratch (or in the middle of the gap without one) */
  K.strike = GT.scratch != null ? GT.scratch : K.mythEnd + .15;
  K.clunk = GT.clunk != null ? GT.clunk : K.dipEnd + .12;
  K.toggle = GT.toggle != null ? GT.toggle : K.tipEnd + .08;
  K.w2 = GT.tear2 != null ? GT.tear2 : K.outEnd + .3;
  /* the outside cards: one per half-line ("Other researchers" / "got about the same"); the second wipe parks above them
     until the second card has been read, then finishes */
  K.c1 = K.out - .06; K.c2 = at('outside', 'got') - .06;
  K.parkEnd = Math.max(K.c2 + 3.15, K.w2 + .6);
  /* the hero hold: the stamp settles .12 s after the thump; the torn edge falls fast through the top third, then evenly
     past the stamp; the next caption waits until the edge is past the stamp */
  K.tearA = GT.tear1 != null ? GT.tear1 : K.gem - .34;   /* the hero's exit: peeled before "Google's" starts */
  K.capA = K.tearA + .1;

  var SW1 = .32, SW2 = K.parkEnd + .3 - K.w2;
  var SC = [
    { id: 'claim', fn: 'claim', name: 'The old stat', t0: 0 },
    { id: 'tv', fn: 'tv', name: 'Google and outside', t0: K.tearA + SW1, swipe: true, sw: SW1 },
    { id: 'long', fn: 'long', name: 'Long answers', t0: K.w2 + SW2, swipe: true, sw: SW2, park: true }
  ];
  var SHOTS;
  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, MC, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- measuring: the safe area (BOUNDS_RUN), what is readable (TEXTS → readcheck) and labels vs props (LABELS_RUN) ---------- */
  var BOUNDS = null, REC = null, PROPS = null, LBL = null, INCOMING = false, CURT = 0, NOREC = false, ONPROP = false, CHIPBOX = null, COVTOP = -1e9, INTOP = -1e9, INLENS = false;
  var SAFE = { x0: 95, x1: 925, y1: 1450 };
  function xbox(g, x0, y0, x1, y1) {
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
  }
  function recBound(g, b, text) {
    if (!BOUNDS || INCOMING || INLENS || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    if (b[0] < SAFE.x0 - .5 || b[2] > SAFE.x1 + .5 || b[3] > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(b[0]), x1: Math.round(b[2]), y1: Math.round(b[3]) });
  }
  function recBox(g, x0, y0, x1, y1, text) { if (BOUNDS) recBound(g, xbox(g, x0, y0, x1, y1), text); }
  function prop(g, name, x0, y0, x1, y1) {
    if (!PROPS || INCOMING || INLENS || (g !== ctx && g !== tctx)) return;
    var b = xbox(g, x0, y0, x1, y1); if (b[1] < COVTOP) return; PROPS.push({ name: name, b: b });
  }
  function seen(g, text, b) {
    var vis = (INCOMING ? b[3] <= INTOP : b[1] >= COVTOP) && !NOREC && !INLENS && g.globalAlpha >= .95 && (g === ctx || g === tctx);
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
  /* quiet tags (OUR ILLUSTRATION, OUR DRAWING): cream outline, never coral */
  function tag(g, text, x, y, a, rot, maxw) { var m = g.getTransform(), sc = Math.min(1, Math.hypot(m.c, m.d)); chip(g, text, x, y, { px: Math.ceil(42 / Math.max(sc, .5)), wt: 700, fam: MONO, line: CREAM, lw: 3, fg: CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: 'rgba(21,19,27,.88)', maxw: maxw || 820 }); }
  /* a quote: condensed Archivo so a source's exact words fit the rail at ≥ 36 px */
  function quote(g, text, x, y, a, px) { txt(g, text, x, y, px || 42, CREAM, 'center', 700, DISP, 830, a, 36, 'condensed'); }
  function credit(g, text, x, y, a, maxw) { txt(g, text, x, y, 44, CREAM, 'center', 600, DISP, maxw || 830, a, 40, 'condensed'); }

  /* ---------- the one rubber stamp: worn ink (seeded speckle), slammed; condensed caps like a real rubber stamp ---------- */
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
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.9, 0, 6.283); g.fill(); }
    c.w = w + 16; c.h = h + 16; c.lines = TL; c.px = px; STEX[key] = c; return c;
  }
  function stamp(g, text, x, y, t, t0, px, col, rot, speck) {
    if (t < t0) return;
    var c = stampTex(text, col, px, speck);
    var k = eout(seg(t, t0, t0 + .1)), s = lerp(1.35, 1, k), al = clamp(k * 3, 0, 1);
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.08 : rot); g.scale(s, s);
    var oldP = ONPROP; ONPROP = true;
    if (k >= 1) {
      recBox(g, -c.w / 2, -c.h / 2, c.w / 2, c.h / 2, text.replace(/\n/g, ' '));
      if (al >= 1) c.lines.forEach(function (s2, i) { var ly = (i - (c.lines.length - 1) / 2) * c.px * 1.02; seen(g, s2, xbox(g, -c.w / 2, ly - c.px * .55, c.w / 2, ly + c.px * .55)); });
    }
    g.drawImage(c, -c.w / 2, -c.h / 2); ONPROP = oldP; g.restore();
  }


  /* =====================================================================================================
     PROPS (all cut paper)
     ===================================================================================================== */
  function grainIn(g, x0, y0, w, h, seed, k) {
    var r = mulberry(seed), n = Math.floor(w * h / 160);
    g.save(); g.clip();
    for (var i = 0; i < n; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,' + (.09 * (k || 1)) + ')' : 'rgba(255,255,255,' + (.10 * (k || 1)) + ')'; g.fillRect(x0 + r() * w, y0 + r() * h, 1.6 + r() * 1.8, 1.6 + r() * 1.8); }
    g.restore();
  }
  function sheet(g, x0, y0, x1, y1, seed, col, amp, name) {
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x0 + 8, y0 + 11, x1 - x0, y1 - y0);
    g.fillStyle = col || PAPER; cut(g, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], mulberry(seed), amp == null ? 1.3 : amp);
    g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); grainIn(g, x0, y0, x1 - x0, y1 - y0, seed + 1);
    prop(g, name || 'sheet', x0, y0, x1 + 8, y1 + 11);
  }
  /* a quiet tag in condensed type (so a long scope fits a half column at ≥ 36 px); cream outline, never coral */
  function tagC(g, text, x, y, a, rot, maxw) { chip(g, text, x, y, { px: 46, wt: 800, fam: DISP, st: 'condensed', line: CREAM, lw: 3, fg: CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: 'rgba(21,19,27,.88)', maxw: maxw || 820 }); }
  function onprop(fn) { var o = ONPROP; ONPROP = true; fn(); ONPROP = o; }

  /* ---------- the chat bubble (frame 0's belief) and the search box under it, 760 × 290 + 640 × 130, local units ---------- */
  function bubble(g, o) {
    /* bubble: 830 × 330, the belief with its subject: CHATGPT = 10× GOOGLE? (4 words) */
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -415 + 10, -165 + 14, 830, 330, 50); g.fill();
    g.fillStyle = '#f7f0e1'; poly(g, [[-300, 150], [-190, 150], [-352, 248]]); g.fill();
    g.save(); rr(g, -415, -165, 830, 330, 50); g.fillStyle = '#f7f0e1'; g.fill(); grainIn(g, -415, -165, 830, 330, 11, .9); g.restore();
    prop(g, 'bubble', -415, -165, 425, 248);
    var px = 136, a = '10× ', b = 'GOOGLE?';
    font(g, px, 900, DISP); var wa = g.measureText(a).width, wb = g.measureText(b).width;
    while (wa + wb > 750) { px -= 2; font(g, px, 900, DISP); wa = g.measureText(a).width; wb = g.measureText(b).width; }
    var x0 = -(wa + wb) / 2, y2 = 64;
    if (o.ta !== 0) onprop(function () {
      txt(g, 'CHATGPT =', 0, -82, 84, INK, 'center', 900, DISP, 740, 1, 40, 'expanded');
      txt(g, a + b, x0, y2, px, INK, 'left', 900, DISP);
    });
    /* the strike: an ink pen stroke across 10×, drawn on over o.strike */
    if (o.strike > 0) {
      var k = clamp(o.strike, 0, 1), w10 = wa - px * .2;
      g.save(); g.strokeStyle = INK; g.lineWidth = 17; g.lineCap = 'round'; g.beginPath();
      for (var i = 0; i <= 24 * k; i++) { var f = i / 24, x = lerp(x0 - 14, x0 + w10 + 14, f), y = lerp(y2 + 16, y2 - 22, f) + 5 * Math.sin(f * 7); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke(); g.restore();
    }
    /* the search box: a paper pill, a drawn magnifier, ten tallies in two gates of five */
    var by = 330;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -350 + 8, by - 70 + 11, 700, 140, 70); g.fill();
    g.save(); rr(g, -350, by - 70, 700, 140, 70); g.fillStyle = '#fbf6ea'; g.fill(); grainIn(g, -350, by - 70, 700, 140, 13, .8); g.restore();
    g.strokeStyle = 'rgba(33,29,38,.25)'; g.lineWidth = 4; rr(g, -342, by - 62, 684, 124, 62); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.arc(-276, by - 9, 28, 0, 6.283); g.stroke();
    g.beginPath(); g.moveTo(-256, by + 13); g.lineTo(-231, by + 38); g.stroke();
    prop(g, 'searchbox', -350, by - 70, 358, by + 81);
    for (var j = 0; j < 10; j++) {
      var al = o.tally(j); if (al <= 0) continue;
      var grp = Math.floor(j / 5), m = j % 5, gx = -165 + grp * 250, bump = o.bump(j);
      g.save(); g.translate(0, -10 * bump); g.strokeStyle = INK; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath();
      if (m < 4) { var xx = gx + m * 42; g.moveTo(xx, by + 37 - 74 * clamp(al, 0, 1.04)); g.lineTo(xx, by + 37); }
      else { g.moveTo(gx - 20, by + 28); g.lineTo(lerp(gx - 20, gx + 146, clamp(al, 0, 1)), lerp(by + 28, by - 26, clamp(al, 0, 1))); }
      g.stroke(); g.restore();
    }
  }


  /* ---------- the price tag: a paper tag on a string; ? Wh, then flips to the maker's number ---------- */
  var PIN = { x: 718, y: 592 }, TAGW = 320, TAGH = 236, OVY = 890;
  function priceTag(g, x, y, ang, flip, front) {
    /* string from the pin to the tag's hole */
    var hx = x + Math.sin(ang) * 0, hy = y - TAGH / 2 + 22;
    var hp = { x: x + Math.cos(ang) * (hx - x) - Math.sin(ang) * (hy - y), y: y + Math.sin(ang) * (hx - x) + Math.cos(ang) * (hy - y) };
    g.strokeStyle = '#cbbf9f'; g.lineWidth = 4; g.beginPath(); g.moveTo(PIN.x, PIN.y); g.lineTo(hp.x, hp.y); g.stroke();
    g.fillStyle = '#9c8a5f'; el(g, PIN.x, PIN.y, 9, 9);
    g.save(); g.translate(x, y); g.rotate(ang);
    var sx = Math.max(Math.abs(Math.cos(Math.PI * flip)), .03); g.scale(sx, 1);
    var P = [[-TAGW / 2 + 46, -TAGH / 2], [TAGW / 2 - 46, -TAGH / 2], [TAGW / 2, -TAGH / 2 + 46], [TAGW / 2, TAGH / 2], [-TAGW / 2, TAGH / 2], [-TAGW / 2, -TAGH / 2 + 46]];
    g.save(); g.translate(8, 12); g.fillStyle = 'rgba(0,0,0,.4)'; poly(g, P); g.fill(); g.restore();
    g.fillStyle = '#efe2c4'; cut(g, P, mulberry(21), 1.2);
    poly(g, P); grainIn(g, -TAGW / 2, -TAGH / 2, TAGW, TAGH, 22, .9);
    g.fillStyle = BG; el(g, 0, -TAGH / 2 + 22, 10, 10);
    g.strokeStyle = '#cbbf9f'; g.lineWidth = 4; g.beginPath(); g.arc(0, -TAGH / 2 + 22, 14, 0, 6.283); g.stroke();
    prop(g, 'tag', -TAGW / 2, -TAGH / 2, TAGW / 2 + 8, TAGH / 2 + 12);
    if (flip > 0 && flip < 1) { g.fillStyle = 'rgba(0,0,0,' + (.4 * Math.sin(Math.PI * flip)) + ')'; poly(g, P); g.fill(); }
    onprop(function () {
      if (front.q) {
        txt(g, '?', -36, 20, 150, INK, 'center', 900, DISP);
        txt(g, 'Wh', 76, 52, 60, INK, 'center', 900, DISP);
      } else {
        txt(g, front.top, 0, -48, 38, INK, 'center', 700, MONO, 280, 1, 36);
        txt(g, front.big, 0, 18, 80, INK, 'center', 900, DISP, 284, 1, 50, 'condensed');
        txt(g, front.low, 0, 82, 38, INK, 'center', 700, DISP, 290, 1, 36, 'condensed');
      }
    });
    g.restore();
  }

  /* ---------- the paper oven: a 720 × 700 kitchen range with a 280 px kitchen timer; local units, centre (0, 0) ---------- */
  var OVEN_C = null, DIAL_C = null;
  var OV = { w: 720, h: 700 }, DIAL = { x: -176, y: -186, r: 140 };
  function paintOven() {
    var k = 1.5, c = mk(Math.ceil((OV.w + 40) * k), Math.ceil((OV.h + 60) * k)), g = c.getContext('2d'); g.scale(k, k); g.translate(OV.w / 2 + 20, OV.h / 2 + 20);
    var r = mulberry(41);
    /* feet */
    g.fillStyle = '#3a3640'; g.fillRect(-320, 336, 60, 20); g.fillRect(260, 336, 60, 20);
    /* body: pale mint enamel */
    g.fillStyle = '#cfe0d6'; cut(g, [[-360, -350], [360, -350], [360, 340], [-360, 340]], r, 1.4);
    g.beginPath(); g.rect(-360, -350, 720, 690); grainIn(g, -360, -350, 720, 690, 42, 1);
    /* cooktop lip */
    g.fillStyle = '#9db8aa'; g.fillRect(-360, -350, 720, 20);
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-360, -330, 720, 4);
    /* control panel */
    g.fillStyle = '#b6cfc1'; cut(g, [[-344, -322], [344, -322], [344, -38], [-344, -38]], r, 1.2);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-344, -42, 688, 6);
    /* the oven-light window's chrome ring (the lamp itself is drawn live) */
    g.fillStyle = '#e6e2d8'; el(g, -2, -270, 30, 30); g.fillStyle = '#7c7768'; el(g, -2, -270, 24, 24);
    /* the door */
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-332, -14, 672, 318);
    g.fillStyle = '#d9e8df'; cut(g, [[-336, -18], [336, -18], [336, 296], [-336, 296]], r, 1.2);
    g.strokeStyle = 'rgba(33,29,38,.18)'; g.lineWidth = 4; g.strokeRect(-326, -8, 652, 294);
    /* handle: a chrome bar on two posts */
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, -262, 14, 528, 26, 13); g.fill();
    g.fillStyle = '#8a877e'; g.fillRect(-250, 0, 18, 24); g.fillRect(232, 0, 18, 24);
    g.fillStyle = '#e9e6de'; rr(g, -268, 8, 536, 24, 12); g.fill();
    g.fillStyle = 'rgba(255,255,255,.6)'; rr(g, -256, 11, 500, 5, 3); g.fill();
    /* kick plate */
    g.fillStyle = '#a9c4b6'; g.fillRect(-360, 300, 720, 40);
    g.fillStyle = 'rgba(0,0,0,.14)'; for (var i = 0; i < 9; i++) g.fillRect(-300 + i * 75, 312, 40, 6);
    return c;
  }
  function paintDial() {
    var R = DIAL.r, k = 1.5, c = mk(Math.ceil((2 * R + 20) * k), Math.ceil((2 * R + 20) * k)), g = c.getContext('2d'); g.scale(k, k); g.translate(R + 10, R + 10);
    g.fillStyle = '#2b2834'; el(g, 0, 0, R, R);
    g.fillStyle = '#f4ede0'; el(g, 0, 0, R - 16, R - 16);
    g.beginPath(); g.arc(0, 0, R - 16, 0, 6.283); grainIn(g, -R, -R, 2 * R, 2 * R, 44, .8);
    /* 60 notches, every fifth long; the zero notch is a thick bar */
    g.strokeStyle = INK; g.lineCap = 'round';
    for (var i = 0; i < 24; i++) {
      var a = -Math.PI / 2 + i / 24 * 6.283, L = i % 4 ? 18 : 32;
      g.lineWidth = i === 0 ? 12 : i % 4 ? 5 : 7;
      g.beginPath(); g.moveTo(Math.cos(a) * (R - 22), Math.sin(a) * (R - 22)); g.lineTo(Math.cos(a) * (R - 22 - L), Math.sin(a) * (R - 22 - L)); g.stroke();
    }
    /* the grip bar */
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, -96, -16, 200, 40, 18); g.fill();
    g.fillStyle = '#c9bfae'; rr(g, -100, -22, 200, 40, 18); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; rr(g, -90, -18, 180, 7, 4); g.fill();
    g.fillStyle = '#b1a690'; el(g, 0, -2, 20, 20);
    return c;
  }
  /* o: { notch (0…1 of one notch), light (0…1), glow } */
  function oven(g, x, y, s, o) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.42)'; g.fillRect(-360 + 14, -350 + 18, 720, 706);
    g.drawImage(OVEN_C, -OV.w / 2 - 20, -OV.h / 2 - 20, OV.w + 40, OV.h + 60);
    prop(g, 'oven', -360, -350, 374, 356);
    /* the window: dark glass; the light warms it */
    var L = clamp(o.light || 0, 0, 1);
    g.save(); rr(g, -250, 66, 500, 196, 26); g.fillStyle = '#2a2430'; g.fill(); g.clip();
    if (L > 0) { var gr = g.createRadialGradient(0, 200, 30, 0, 170, 300); gr.addColorStop(0, 'rgba(255,196,92,' + (.55 * L) + ')'); gr.addColorStop(1, 'rgba(160,90,40,' + (.3 * L) + ')'); g.fillStyle = gr; g.fillRect(-250, 66, 500, 196); }
    g.strokeStyle = 'rgba(200,200,200,' + (.25 + .3 * L) + ')'; g.lineWidth = 5; for (var i = 0; i < 2; i++) { g.beginPath(); g.moveTo(-230, 140 + i * 60); g.lineTo(230, 140 + i * 60); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.12)'; poly(g, [[-200, 262], [-120, 66], [-80, 66], [-160, 262]]); g.fill();
    g.restore();
    g.strokeStyle = '#8a877e'; g.lineWidth = 8; rr(g, -250, 66, 500, 196, 26); g.stroke();
    /* the oven lamp */
    g.fillStyle = L > 0 ? 'rgba(255,190,70,' + (.35 + .65 * L) + ')' : '#5d584c'; el(g, -2, -270, 22, 22);
    if (L > 0) { g.fillStyle = 'rgba(255,240,200,' + (.7 * L) + ')'; el(g, -8, -276, 7, 7); }
    /* the kitchen timer: the dial turns, the pointer above it stays */
    var R = DIAL.r;
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, DIAL.x + 8, DIAL.y + 12, R, R);
    g.save(); g.translate(DIAL.x, DIAL.y); g.rotate(-(o.notch || 0) * 6.283 / 24);
    g.drawImage(DIAL_C, -R - 10, -R - 10, 2 * R + 20, 2 * R + 20); g.restore();
    g.fillStyle = INK; poly(g, [[DIAL.x - 13, DIAL.y - R - 8], [DIAL.x + 13, DIAL.y - R - 8], [DIAL.x, DIAL.y - R + 14]]); g.fill();
    /* one notch: a cream tick pops on the dark bezel where the zero bar now sits (15° round) */
    if (o.tick > 0) {
      var ta = -Math.PI / 2 - 6.283 / 24, ts = 1 + .6 * (1 - clamp(o.tick, 0, 1));
      g.save(); g.translate(DIAL.x + Math.cos(ta) * (R - 8), DIAL.y + Math.sin(ta) * (R - 8)); g.rotate(ta + Math.PI / 2); g.scale(ts, ts);
      g.fillStyle = CREAM; rr(g, -7, -15, 14, 30, 5); g.fill(); g.restore();
    }
    g.restore();
  }

  /* ---------- the paper TV: 520 × 380, a cut-paper boat show; local units ---------- */
  var TVW = 520, TVH = 380, SCR = { x0: -228, y0: -158, x1: 136, y1: 158 };
  function tvSet(g, x, y, s, st, count) {
    g.save(); g.translate(x, y); g.scale(s, s);
    /* antenna and legs */
    g.strokeStyle = '#3a3640'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-20, -190); g.lineTo(-96, -250); g.moveTo(-20, -190); g.lineTo(70, -246); g.stroke();
    g.fillStyle = '#3a3640'; el(g, -20, -192, 18, 10);
    g.fillRect(-200, 188, 18, 46); g.fillRect(182, 188, 18, 46);
    sheet(g, -TVW / 2, -TVH / 2, TVW / 2, TVH / 2, 61, '#b5794f', 1.4, 'tv');
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-TVW / 2, TVH / 2 - 14, TVW, 14);
    /* knobs */
    g.fillStyle = '#efe2c4'; el(g, 200, -96, 30, 30); el(g, 200, -12, 30, 30);
    g.fillStyle = '#3a3640'; g.save(); g.translate(200, -96); g.rotate(st * .2); g.fillRect(-4, -26, 8, 22); g.restore(); g.fillRect(196, -38, 8, 22);
    g.fillStyle = 'rgba(0,0,0,.25)'; for (var i = 0; i < 5; i++) g.fillRect(172, 60 + i * 18, 56, 6);
    /* the screen: a paper sea and a paper boat sailing across (period 6 s) */
    var w = SCR.x1 - SCR.x0, h = SCR.y1 - SCR.y0;
    g.save(); rr(g, SCR.x0, SCR.y0, w, h, 34); g.clip();
    g.fillStyle = '#a9c4c4'; g.fillRect(SCR.x0, SCR.y0, w, h);
    g.fillStyle = '#f3c04f'; el(g, SCR.x0 + 290, SCR.y0 + 70, 34, 34);
    g.fillStyle = '#eef0e6'; var cx2 = SCR.x0 + wrap(st * 30, w + 160) - 80; el(g, cx2, SCR.y0 + 64, 44, 16); el(g, cx2 + 30, SCR.y0 + 54, 28, 14);
    var bx = SCR.x0 + wrap(st * (w + 180) / 6, w + 180) - 90, wy = SCR.y0 + 214;
    g.save(); g.translate(bx, wy + 6 * Math.sin(st * 3)); g.rotate(.06 * Math.sin(st * 3 + 1));
    g.fillStyle = '#f4ede0'; poly(g, [[0, -112], [0, -14], [64, -14]]); g.fill();
    g.fillStyle = '#e6d6ad'; poly(g, [[-6, -96], [-6, -14], [-48, -14]]); g.fill();
    g.fillStyle = '#3a3640'; g.fillRect(-3, -116, 6, 104);
    g.fillStyle = '#7a3f2c'; poly(g, [[-62, -14], [72, -14], [52, 18], [-44, 18]]); g.fill();
    g.restore();
    for (var b = 0; b < 3; b++) {
      g.fillStyle = ['#3f6f86', '#355f75', '#2c5063'][b];
      g.beginPath(); g.moveTo(SCR.x0, SCR.y1);
      for (var xx = 0; xx <= w + 20; xx += 20) g.lineTo(SCR.x0 + xx, wy + 14 + b * 34 + 9 * Math.sin(xx * .045 + st * (2.2 + b * .6) + b));
      g.lineTo(SCR.x1 + 20, SCR.y1); g.closePath(); g.fill();
    }
    /* the show's own clock, whole seconds: it runs 0:01 → 0:08 and stops short of nine */
    g.fillStyle = 'rgba(21,19,27,.78)'; rr(g, SCR.x1 - 132, SCR.y0 + 16, 116, 54, 14); g.fill();
    NOREC = true; txt(g, '0:0' + count, SCR.x1 - 74, SCR.y0 + 45, 38, CREAM, 'center', 700, MONO); NOREC = false;
    g.restore();
    g.strokeStyle = '#3a3640'; g.lineWidth = 10; rr(g, SCR.x0, SCR.y0, w, h, 34); g.stroke();
    g.restore();
  }

  /* ---------- the answer scroll, the dial meter, the THINKING toggle (all ours, no app UI) ---------- */
  function scroll(g, x, y0, len, seed) {
    /* the paper strip that unrolls down out of the short answer, the roll at its lower end */
    if (len > 2) {
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - 150 + 8, y0, 300, len + 8);
      g.fillStyle = '#fbf6ea'; g.fillRect(x - 150, y0, 300, len);
      g.beginPath(); g.rect(x - 150, y0, 300, len); grainIn(g, x - 150, y0, 300, len, seed, .8);
      /* handwriting: pen lines of uneven length (the long answer), every one a different squiggle */
      var r = mulberry(seed + 3);
      g.save(); g.beginPath(); g.rect(x - 150, y0, 300, len); g.clip();
      g.strokeStyle = 'rgba(33,29,38,.55)'; g.lineWidth = 4; g.lineCap = 'round';
      for (var yy = y0 + 24; yy < y0 + len - 8; yy += 26) {
        var L = 150 + r() * 100, xs = x - 126; g.beginPath(); g.moveTo(xs, yy);
        for (var q = 6; q < L; q += 6) g.lineTo(xs + q, yy + 3 * Math.sin(q * .35 + r() * 2) * (r() < .8 ? 1 : 2));
        g.stroke();
      }
      g.restore();
      /* the ruler edge: a tick every 1× of the short answer's length */
      g.fillStyle = INK; for (var m = 1; m <= 15; m++) { var my = y0 + m * 30; if (my > y0 + len) break; g.fillRect(x + 128, my - 2, m % 5 ? 14 : 22, 4); }
      prop(g, 'scroll', x - 150, y0, x + 158, y0 + len + 8);
    }
    /* the roll */
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x - 160 + 6, y0 + len - 18 + 8, 320, 36, 18); g.fill();
    g.fillStyle = '#e6d6ad'; rr(g, x - 160, y0 + len - 18, 320, 36, 18); g.fill();
    g.fillStyle = 'rgba(0,0,0,.15)'; rr(g, x - 160, y0 + len + 2, 320, 10, 5); g.fill();
  }
  function meter(g, x, y, v) {
    /* a paper dial meter, 1× … 15× over a half circle; v is the needle's value */
    var R = 150;
    g.fillStyle = 'rgba(0,0,0,.38)'; rr(g, x - 200 + 8, y - 210 + 12, 400, 276, 26); g.fill();
    g.fillStyle = '#f1e9d8'; rr(g, x - 200, y - 210, 400, 276, 26); g.fill();
    rr(g, x - 200, y - 210, 400, 276, 26); grainIn(g, x - 200, y - 210, 400, 276, 71, .8);
    prop(g, 'meter', x - 200, y - 210, x + 208, y + 78);
    g.strokeStyle = INK; g.lineCap = 'round';
    for (var i = 1; i <= 15; i++) { var a = Math.PI + (i - 1) / 14 * Math.PI, L = (i === 1 || i === 13) ? 28 : 14; g.lineWidth = (i === 1 || i === 13) ? 7 : 4;
      g.beginPath(); g.moveTo(x + Math.cos(a) * (R - 24), y + Math.sin(a) * (R - 24)); g.lineTo(x + Math.cos(a) * (R - 24 - L), y + Math.sin(a) * (R - 24 - L)); g.stroke(); }
    onprop(function () {
      txt(g, '1×', x - 110, y + 36, 40, INK, 'center', 900, DISP);
      var a13 = Math.PI + 12 / 14 * Math.PI;
      txt(g, '13×', x + Math.cos(a13) * (R + 24), y + Math.sin(a13) * (R + 24) - 6, 40, INK, 'center', 900, DISP);
    });
    var an = Math.PI + (clamp(v, 1, 15) - 1) / 14 * Math.PI;
    g.save(); g.translate(x, y); g.rotate(an);
    g.fillStyle = 'rgba(0,0,0,.3)'; poly(g, [[0, -8 + 5], [R - 30, 5], [0, 8 + 5]]); g.fill();
    g.fillStyle = INK; poly(g, [[0, -9], [R - 30, 0], [0, 9]]); g.fill();
    g.restore();
    g.fillStyle = '#9c8a5f'; el(g, x, y, 18, 18);
  }
  function toggle(g, x, y, on) {
    /* a generic paper switch: track, knob, and its state in cream on the track; on (1) = knob right, off (0) = knob left */
    var w = 156, h = 74, r = h / 2;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x - w / 2 + 5, y - r + 8, w, h, r); g.fill();
    g.fillStyle = on > .5 ? '#3a3640' : '#6a6372'; rr(g, x - w / 2, y - r, w, h, r); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 4; rr(g, x - w / 2, y - r, w, h, r); g.stroke();
    var kx = lerp(x - w / 2 + 37, x + w / 2 - 37, on);
    txt(g, 'ON', x - 34, y + 2, 38, CREAM, 'center', 900, DISP, 70, clamp(on * 2 - 1, 0, 1), 36, 'condensed');
    txt(g, 'OFF', x + 32, y + 2, 38, CREAM, 'center', 900, DISP, 74, clamp(1 - on * 2, 0, 1), 36, 'condensed');
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, kx + 3, y + 5, 29, 29); g.fillStyle = CREAM; el(g, kx, y, 29, 29);
    prop(g, 'toggle', x - w / 2, y - r, x + w / 2 + 5, y + r + 8);
  }

  /* =====================================================================================================
     SCENE 1 · the claim → the question → the maker's number → THE oven (hook … hero)
     ===================================================================================================== */
  var REST = { x: 510, y: 680, s: 1 }, F0 = { x: 510, y: 1010, s: 1 }, ASKP = { x: 352, y: 880, s: .62 };
  function gPose(A, B, k) { return { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k), s: lerp(A.s, B.s, k) }; }
  function tallyA(t) { return function (j) { return clamp(sp(t, .06 + j * .085, 4.2, .8), 0, 1.04); }; }
  function tallyBump(t) { return function (j) { var a = K.ten - .05 + j * .045; return Math.sin(Math.PI * seg(t, a, a + .2)); }; }
  function claimScene(g, t) {
    /* the bubble group: frame 0 low (the search box whole), glides 330 px up by 0.95 s; on "So" it shrinks to the upper left; on "watt-hour" it
       slides off left as the oven slides in */
    var k0 = eout(seg(t, 0, .95)), ka = eio(seg(t, K.ask - .1, K.ask + .55)), kout = eio(seg(t, K.third - .15, K.watt + .2));
    var P = gPose(gPose(F0, REST, k0), ASKP, ka); P.s *= 1 - .25 * kout; P.y -= 40 * kout;
    PIN.x = lerp(768, 718, kout); PIN.y = lerp(592, 532, kout);   /* the tag's pin: right of the bubble, then over the oven */
    var bob = seg(t, 1.0, 1.6); P.y += lerp(5, 9, ka) * Math.sin((t - 1) * 1.6) * bob; P.x += 6 * ka * Math.sin((t - 1) * 1.1);
    if (kout < 1) {
      g.save(); g.globalAlpha *= 1 - kout;
      g.save(); g.translate(P.x, P.y); g.scale(P.s, P.s);
      bubble(g, { strike: eout(seg(t, K.strike - .08, K.strike + .14)), tally: tallyA(t), bump: tallyBump(t) });
      g.restore();
      /* OLD ESTIMATE · 2023 pins on with the strike; its credit under it (condensed so it fits the half column) */
      var oa = fin(t, K.strike + .02), op = Math.min(1, pop(t, K.strike + .02, 3.2));
      var ty = P.y + 400 * P.s + 58;
      g.save();
      tagC(g, 'OLD ESTIMATE · 2023', P.x, ty + 10 * (1 - op), oa, -.03, 440);
      credit(g, 'DE VRIES 2023 · VIA EPOCH AI', P.x, ty + 62, fin(t, K.strike + .12), lerp(820, 450, ka));
      g.restore(); g.restore();
    }
    /* the oven slides in from the right under the tag; it fills the frame for the hero line, with a slow push */
    var still = seg(t, K.heroEnd - .25, GT.slam);
    var ox = 510 + 720 * (1 - kout), push = 1 + .03 * eio(seg(t, K.hero - .1, K.heroEnd));
    if (kout > 0) {
      g.save(); g.translate(510, OVY); g.scale(push, push); g.translate(-510, -OVY);
      var notch = eout(seg(t, K.second - .04, K.second + .08));
      var light = (t >= K.second && t < K.second + .28) || t >= K.oven ? 1 : 0;
      oven(g, ox, OVY + 3 * Math.sin(t * 1.5) * (1 - still), 1, { notch: notch, light: light, tick: t >= K.second - .04 ? clamp(sp(t, K.second - .04, 4, .7), 0, 1) : 0 });
      g.restore();
    }
    /* the price tag: swings in on "So…", ? Wh; flips to the maker's number on "third"; settles before the stamp */
    var tin = eout(seg(t, K.ask + .1, K.ask + .7));
    if (tin > 0) {
      var tx = PIN.x, tyy = PIN.y + 208 - 40 * (1 - tin);
      var sw = (.22 * Math.exp(-2.4 * Math.max(0, t - K.ask - .7)) * Math.sin((t - K.ask - .7) * 4.2) + .07 * Math.sin(t * 1.6)) * (1 - still);
      var fk = seg(t, K.third - .12, K.third + .18);
      g.save(); g.translate(510, OVY); g.scale(push, push); g.translate(-510, -OVY);
      g.globalAlpha *= clamp(tin * 1.6, 0, 1);
      priceTag(g, tx, tyy, (1 - tin) * .35 + sw, fk >= 1 ? 0 : fk, { q: fk < .5, top: 'CHATGPT', big: '0.34 Wh', low: '“AVERAGE QUERY”' });
      g.restore();
    }
    /* Altman's own words, his credit and the company tag: in from "boss", up through the hold */
    var qa = fin(t, K.says - .1);
    txt(g, '“…the average query uses about 0.34 watt-hours…”', CX, kout < .5 ? 548 : 1282, 42, CREAM, 'center', 700, DISP, 830, qa * Math.abs(1 - 2 * kout), 40, 'extra-condensed');   /* fades out above, back in under the oven */
    credit(g, 'ONE CHATGPT ANSWER · SAM ALTMAN, JUNE 2025', CX, 1332, fin(t, K.boss - .15));
    tag(g, 'COMPANY’S OWN FIGURE', CX, 1392, fin(t, K.says), .01, 820);
    /* THE stamp: on the oven door, over the window */
    /* the stamp inks onto the door on "second" (silent: no gap there); the thump lands in the gap after "oven." */
    var sy = OVY + 154 * push + 3 * Math.sin(t * 1.5) * (1 - still);
    stamp(g, 'ABOUT 1 SECOND', 510, sy, t, K.second - .15, 92, HOT, -.09, .4);
    /* the search phrase: from "So" until the hero caption takes the upper third */
    var HL = 1.92, ha = fin(t, HL) * (1 - seg(t, K.hero - .2, K.hero - .08));
    if (ha > 0 && LIVE.text && !POSTERMODE) {
      txt(g, 'HOW MUCH ENERGY', CX, 372, 78, CREAM, 'center', 900, DISP, 830, ha, 52, 'expanded');
      chip(g, 'DOES CHATGPT USE?', CX, 458, { px: 70, wt: 900, bg: CREAM, fg: BG, a: ha, s: .92 + .08 * Math.min(1, pop(t, HL, 3.2)), maxw: 830, st: 'expanded', shadow: false });
    }
  }

  /* =====================================================================================================
     SCENE 2 · Google's own comparison (a paper TV) beside the shrunken oven; outside researchers
     ===================================================================================================== */
  function tvScene(g, t) {
    var s0 = S('tv').t0 - SW1;
    var dr = function (ph) { return 4 * Math.sin(t * 1.5 + ph); };
    /* the oven, a quarter of its size, keeps its own number under it */
    oven(g, 232, 700 + dr(0), .34, { notch: 1, light: 1, tick: 1 });
    txt(g, '0.34 Wh', 232, 870, 54, CREAM, 'center', 900, DISP, 260);
    txt(g, 'ALTMAN', 232, 922, 38, CREAM, 'center', 800, DISP, 260, 1, 36, 'condensed');
    /* the TV: slides 60 px into place as the edge falls; the show plays; the counter runs 1 → 8 on "Under nine seconds" */
    var tk = eout(seg(t, s0 + .2, s0 + 1.4));
    var cnt = t < K.under ? 0 : Math.min(8, 1 + Math.floor(((Math.floor(t * 30) + .5) / 30 - K.under) / ((K.tv + .25 - K.under) / 8)));
    tvSet(g, 655 + 60 * (1 - tk), 742 + dr(1), 1, t - s0, cnt);
    /* Google's number, its scope and its source, under the TV */
    var ga = fin(t, K.median - .3), gp = Math.min(1, pop(t, K.median - .3, 3.2));
    chip(g, '0.24 Wh', 655, 1000, { px: 66, wt: 900, bg: CREAM, fg: BG, a: ga, s: .9 + .1 * gp, rot: -.02 });
    txt(g, 'MEDIAN TEXT PROMPT · GEMINI APPS', 630, 1066, 40, CREAM, 'center', 800, DISP, 540, ga, 36, 'condensed');
    tag(g, 'COMPANY’S OWN FIGURE', 640, 1122, fin(t, K.median), .01, 530);
    var gq = lerp(1, .6, seg(t, K.c1 + .15, K.c1 + .4));   /* Google's words dim to 60 % once the first outside card is down */
    quote(g, '“…watching TV for less than nine seconds.”', CX, 1168, fin(t, s0 + .05) * gq, 42);
    credit(g, 'GOOGLE, AUG 2025', CX, 1214, fin(t, s0 + .05) * gq);
    /* two index cards slap down: the outside estimates, each with its own scope */
    [[K.c1, 302, '≈ 0.3 Wh', 'TYPICAL GPT-4o QUERY', 'EPOCH AI, FEB 2025', -.025], [K.c2, 712, '0.31 Wh', 'MEDIAN, BIG MODELS', 'MICROSOFT RESEARCH, 2026', .02]].forEach(function (c, i) {
      var a = eout(seg(t, c[0], c[0] + .22)); if (a <= 0) return;
      g.save(); g.translate(c[1], 1336 + 18 * (1 - a) + dr(2 + i)); g.rotate(c[5]); g.scale(1 + .04 * (1 - a), 1 + .04 * (1 - a)); g.globalAlpha *= clamp(a * 2, 0, 1);
      sheet(g, -200, -92, 200, 92, 90 + i, PAPER, 1.3, 'card');
      onprop(function () {
        txt(g, c[2], 0, -44, 60, INK, 'center', 900, DISP, 370);
        txt(g, c[3], 0, 14, 40, INK, 'center', 800, DISP, 360, 1, 36, 'extra-condensed');
        txt(g, c[4], 0, 58, 40, INK, 'center', 700, DISP, 360, 1, 36, 'extra-condensed');
      });
      g.restore();
    });
  }

  /* =====================================================================================================
     SCENE 3 · long, thinking answers: the scroll unrolls 15×, the meter swings to 13×; the tip; the end card
     ===================================================================================================== */
  var SCX = 290, SCY = 840, SLEN = 568, AY = 670;
  /* the scroll's unroll: a little on "long", then steadily through "thinking answers cost more", on to 15x by "study";
     piecewise linear through the knots, softened by averaging over ±0.2 s */
  function unroll(t) {
    var P = [[K.long - .1, 0], [K.long + .5, .04], [K.butEnd + .5, .62], [K.study, 1]];
    function lin(x) { if (x <= P[0][0]) return 0; for (var i = 1; i < P.length; i++) if (x <= P[i][0]) return lerp(P[i - 1][1], P[i][1], (x - P[i - 1][0]) / (P[i][0] - P[i - 1][0])); return 1; }
    var acc = 0; for (var j = -4; j <= 4; j++) acc += lin(t + j * .05); return acc / 9;
  }
  function longScene(g, t) {
    var s0 = S('long').t0 - SW2;
    var clr = eio(seg(t, K.end - .08, K.end + .12));   /* everything leaves on "Did" */
    var dr = function (ph) { return 4 * Math.sin(t * 1.5 + ph) * (1 - clr); };
    if (clr < 1) {
      g.save(); g.globalAlpha *= 1 - clr;
      /* the scroll: unrolls to its 15× mark by "study", overshoots a little and settles; snaps back on "Skip" */
      var dts = t - K.study, settle = dts > 0 ? .035 * Math.exp(-2.4 * dts) * Math.sin(5.5 * dts) : 0;
      var back = eio(seg(t, K.skip - .05, K.skip + .35));
      var len = SLEN * (unroll(t) + settle) * (1 - back);
      scroll(g, SCX, SCY + 4, len, 81);
      if (unroll(t) > .97 && back < .02) onprop(function () { txt(g, '15× LONGER', SCX - 6, SCY + len - 50, 44, INK, 'center', 900, DISP, 260); });
      /* the short answer: a chat bubble with two pen lines */
      g.save(); g.translate(0, dr(0));
      g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, 110 + 8, AY + 12, 370, 170, 34); g.fill();
      g.fillStyle = '#f7f0e1'; rr(g, 110, AY, 370, 170, 34); g.fill();
      rr(g, 110, AY, 370, 170, 34); grainIn(g, 110, AY, 370, 170, 91, .9);
      prop(g, 'answer', 110, AY, 488, AY + 182);
      g.strokeStyle = 'rgba(33,29,38,.6)'; g.lineWidth = 5; g.lineCap = 'round';
      [[150, AY + 80, 280], [150, AY + 120, 200]].forEach(function (l, i) { g.beginPath(); g.moveTo(l[0], l[1]); for (var q = 6; q < l[2]; q += 6) g.lineTo(l[0] + q, l[1] + 3 * Math.sin(q * .3 + i * 2)); g.stroke(); });
      onprop(function () { txt(g, 'SHORT ANSWER', 295, AY + 38, 40, INK, 'center', 800, DISP, 330, 1, 36, 'condensed'); });
      g.restore();
      /* the switch, beside the answer: ON until the click after "mode." */
      tag(g, 'OUR DRAWING', 718, 776 + dr(1), fin(t, s0 + .2), .01, 380);
      /* the meter: 1× → 13× across the dip, overshoots and settles; the clunk seats it; back to 1× on "Skip" */
      var v = 1 + 11.6 * eio(seg(t, K.thirteen - .1, K.study)) + .4 * eout(seg(t, K.clunk - .02, K.clunk + .08));
      if (dts > 0) v += 1.3 * Math.exp(-2 * dts) * Math.sin(4.5 * dts);
      v = lerp(v, 1, eio(seg(t, K.skip - .1, K.skip + .45)));
      meter(g, 718, 1010 + dr(2), v);
      /* 2026: the time card, slapped onto the meter's corner on its word */
      var ys = 1 + .12 * (1 - eout(seg(t, K.y2026 - .08, K.y2026 + .16))), ya = fin(t, K.y2026 - .08, 5);
      chip(g, '2026', 812, 1046 + dr(2), { px: 48, wt: 900, bg: CREAM, fg: BG, a: ya, s: ys, rot: -.03, st: 'expanded' });
      /* Microsoft's number with its scope directly under it: both from the first frame of the "thirteen times" caption */
      var capDip = K.dip; CAPS.forEach(function (c) { if (c.id === 'dip' && c.s < capDip + 1) capDip = Math.min(capDip, c.s); }); capDip -= .04;
      var ma = t >= capDip ? 1 : 0, mp = Math.min(1, pop(t, capDip, 3.2));
      var dim = lerp(1, .4, seg(t, K.toggle - .04, K.toggle + .2));   /* the 13x dims once the switch is off */
      chip(g, '13× THE ENERGY', 692, 1126, { px: 64, wt: 900, bg: CREAM, fg: BG, a: ma * dim, s: .92 + .08 * mp, rot: -.015, maxw: 430, st: 'condensed' });
      txt(g, 'ANSWERS 15× LONGER', 692, 1200, 50, CREAM, 'center', 900, DISP, 430, ma, 48, 'condensed');
      credit(g, 'MODEL ESTIMATE · MEDIAN', 692, 1252, fin(t, K.thirteen + .15), 430);
      credit(g, 'MICROSOFT RESEARCH, 2026', 692, 1296, fin(t, K.thirteen + .15), 430);
      quote(g, '“…the median energy rises', 692, 1342, fin(t, K.thirteen + .25), 40);
      quote(g, '13x to 3.91 Wh…”', 692, 1386, fin(t, K.thirteen + .25), 40);
      g.restore();
    }
    /* the switch stays up (OFF) into the end card, then leaves before YES / NO do */
    var on = 1 - eio(seg(t, K.toggle - .04, K.toggle + .12)), sa2 = 1 - seg(t, K.yes + .25, K.yes + .45);
    if (sa2 > 0) {
      g.save(); g.globalAlpha *= sa2;
      txt(g, 'THINKING', 640, 700 + dr(1), 44, CREAM, 'center', 900, DISP, 200, 1, 36, 'condensed');
      toggle(g, 830, 700 + dr(1), on);
      g.restore();
    }
    /* the end card: frame 0's bubble and box, at full opacity, slide up from below the frame on "Did" and creep the last
       80 px into frame 0's place, still moving on the last frame; YES / NO, the same size, just under the bubble */
    if (t >= K.end) {
      var kA = eout(seg(t, K.end, K.end + .3)), kB = Math.pow(seg(t, K.end + .3, DUR + .05), 2);
      var off = lerp(680, 140, kA) - 140 * kB;   /* the last frame sits ~10 px under frame 0, one glide step before it */
      g.save(); g.translate(F0.x, F0.y + off); g.scale(F0.s, F0.s);
      bubble(g, { strike: 0, tally: function () { return 0; }, bump: function () { return 0; }, ta: off < 300 ? 1 : 0 });
      var yk = function (w) { return 1 + .06 * Math.sin(Math.PI * seg(t, w - .06, w + .3)); };
      var ya2 = fin(t, K.end + .18) * (1 - seg(t, K.noEnd + .14, K.noEnd + .26)), yp = Math.min(1, pop(t, K.end + .18, 3));
      [['YES', -95, K.yes], ['NO', 125, K.noE]].forEach(function (c) {
        chip(g, c[0], c[1], 212 + 12 * (1 - yp), { px: 88, wt: 900, bg: BG, line: HOT, lw: 7, fg: HOT, w: 200, h: 114, r: 50, shadow: false, a: ya2, s: yk(c[2]) });
      });
      g.restore();
    }
  }
  /* ---------- captions: the narrator's words, one block at a time; stressed words get a cream pill (never coral) ---------- */
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'myth' || l.id === 'ask' || l.id === 'maker') return;   /* the search phrase carries these two lines (the tag, quote and credit say the second) */
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        cur.push(w);
        var brk = i < ws.length - 1 && l.id !== 'end' && l.id !== 'hero' && /[.?!:]$/.test(w.w);
        if (brk) { out.push({ id: l.id, ws: cur }); cur = []; }
      });
      if (cur.length) out.push({ id: l.id, ws: cur });
    });
    var first = {};
    return out.map(function (c) {
      var ws = c.ws, s = ws[0].t0, isFirst = !first[c.id]; first[c.id] = 1;
      if (isFirst && c.id === 'gemini') s = Math.max(s, K.capA);   /* the caption swaps once the torn edge is past the stamp */
      return { id: c.id, t0: ws[0].t0, s: s, t1: c.id === 'hook' ? 1.42 : ws[ws.length - 1].t1, words: ws };
    });
  })();
  var STRESS = [['hook', 'stat'], ['hero', 'second'], ['gemini', 'nine'], ['outside', 'same'], ['but', 'long'], ['dip', 'thirteen'], ['tip', 'skip']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, that: 1, is: 1, it: 1, do: 1, from: 1, be: 1, or: 1, for: 1, about: 1, who: 1, those: 1, are: 1, we: 1 };
  var CAPMIN = 1e9;
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s - .04 : 1e9;
    var keep = nx && (ns - card0.t1 < 2.4 || card0.id === 'hero');   /* the hero caption stays up through the whole hold */
    var o1 = keep ? ns : Math.min(card0.t1 + .5, ns - .12), o0 = keep ? ns : Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.s - .04, card0.s + .06), out = keep ? (t < ns ? 1 : 0) : 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - card0.s + .04, 3.2, .8), 0, 1.04);
    g.save(); font(g, 74, 800, DISP, 'expanded');
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
    while ((lines.length > 2 || widest() > maxw) && cpx > 52) { cpx -= 4; font(g, cpx, 800, DISP, 'expanded'); ws = words.map(function (w) { return g.measureText(w.w).width; }); gap = cpx * .28; lay2(); fixLines(); }
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
  var NOISE, SCENES = { claim: claimScene, tv: tvScene, long: longScene };
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
    /* the second wipe drops to just above the outside cards, waits there while they are read, then finishes */
    if (Nx && Nx.park && sk > 0) ly = te < K.parkEnd ? lerp(280, 1215, eio(seg(te, K.w2, K.w2 + .5))) : lerp(1215, 1470, eio(seg(te, K.parkEnd, K.parkEnd + .3)));
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
    else if (LIVE.text) {
      var back = seg(t, K.noEnd + .04, K.noEnd + .18);
      captions(g, t, 1 - back);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    /* inside x 90–930 and clear of the quote (y 528) */
    var a = 'How much energy', b = 'does ChatGPT use?', px = 72;
    g.save(); font(g, px, 800, DISP, 'expanded'); g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText(a, CX, 362);
    var bp = 58; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width; while (wb + 28 > 820 && bp > 40) { bp -= 2; font(g, bp, 800, DISP, 'expanded'); wb = g.measureText(b).width; }
    var x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 432 - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 432); g.restore();
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
    var G = [['slam', 'thump', .26], ['scratch', 'paper', .9], ['swing', 'pop', .8], ['clunk', 'clunk', .3], ['toggle', 'click', .8], ['tear1', 'tear', 1.0], ['tear2', 'tear', 1.0]];
    G.forEach(function (e) { if (GT[e[0]] != null) EV.push({ t: +GT[e[0]].toFixed(3), type: e[1], g: e[2], t1: +(GT[e[0]] + BODY[e[1]]).toFixed(3) }); });
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
      var o = osc('sine', 250, t, t + .2, 1, [[t, 0], [t + .012, .5 * g], [t + .14, .46 * g], [t + .19, 0]], .05); o.frequency.exponentialRampToValueAtTime(170, t + .18);
      osc('triangle', 330, t, t + .14, 1, [[t, 0], [t + .004, .32 * g], [t + .06, .22 * g], [t + .13, 0]], .03);
      band(t, .15, 1600, .9, 3.8 * g, .008, .05);
      band(t, .1, 2500, 1.1, 2.3 * g, .006, .03);
      /* the paper slap layer, 1–3 kHz, so the thump reads on a phone speaker */
      band(t + .001, .17, 1800, .55, 3.6 * g, .008, .04);
    }
    /* the coin landing: a short metal ping (two partials) on a paper tap */
    function ping(t, g) {
      g = g || 1;
      osc('sine', 2240, t, t + .22, 1, [[t, 0], [t + .002, .36 * g], [t + .2, 0]], .12, .1);
      osc('sine', 3410, t, t + .14, 1, [[t, 0], [t + .002, .18 * g], [t + .12, 0]], .1, .1);
      band(t, .04, 1500, 1.2, 3.2 * g, .001, .03);
    }
    /* the loupe's tick: a dry, high paper click */
    function tick(t, g) { g = g || 1; band(t, .025, 4200, 2.4, 6.4 * g, .001, .02); band(t + .008, .035, 2200, 2, 2.8 * g, .001, .02); }
    /* the fingertip's tap: a soft paper pop */
    function popS(t, g) { g = g || 1; band(t, .03, 3200, 1.8, 5 * g, .001, .02); band(t + .002, .05, 1500, 2.2, .8 * g, .001, .02); }
    /* the METADATA corner tearing: rough band noise sweeping up */
    function rip(t, g) {
      g = g || 1;
      var n = noise(t, .17), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(1300, t); bp.frequency.exponentialRampToValueAtTime(4200, t + .16);
      var ob = bus(1, .04, .15); n.connect(bp); bp.connect(ob);
      var pts = [[t, 0]]; for (var k = 1; k <= 8; k++) pts.push([t + k * .02, (k % 2 ? 1.6 : .7) * g * (1 - k / 10)]); pts.push([t + .17, 0]); env(ob.gain, pts);
    }
    /* a soft tear for the wipes: short rough noise, rising */
    function tearS(t, g) {
      g = g || 1;
      var n = noise(t, .12), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.0;
      bp.frequency.setValueAtTime(1800, t); bp.frequency.exponentialRampToValueAtTime(3600, t + .11);
      var ob = bus(1, .03, -.1); n.connect(bp); bp.connect(ob);
      var pts = [[t, 0]]; for (var k = 1; k <= 5; k++) pts.push([t + k * .02, (k % 2 ? 1.2 : .6) * g * (1 - k / 7)]); pts.push([t + .12, 0]); env(ob.gain, pts);
    }
    /* the meter's clunk: a short low knock with a paper tap on top (it reads on a phone speaker) */
    function clunkS(t, g) {
      g = g || 1;
      var o = osc('sine', 300, t, t + .14, 1, [[t, 0], [t + .003, .6 * g], [t + .13, 0]], .04); o.frequency.exponentialRampToValueAtTime(190, t + .12);
      band(t, .05, 1400, 1, 4.5 * g, .001, .03); band(t + .002, .03, 2600, 1.4, 2.4 * g, .001, .02);
    }
    /* a flat paper slap (the cream stamp) */
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); }
    EV.forEach(function (e) {
      if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'tear') tearS(e.t, e.g);
      else if (e.type === 'click') { band(e.t, .025, 3200, 1.8, 5 * e.g, .001, .02); band(e.t + .002, .04, 1500, 2.2, .8 * e.g, .001, .02); }
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'clunk') clunkS(e.t, e.g);
      else if (e.type === 'tick') tick(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'paper') rip(e.t, e.g);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone, about −60 dB, so the loop seam is never digital zero; about −50 dB of room bed under the hero hold */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o);
      var h0 = GT.slam + .05, h1 = K.tearA + .1;
      env(o.gain, [[0, ROOM], [h0, ROOM], [h0 + .2, ROOM * 3.16], [h1 - .15, ROOM * 3.16], [h1 + .1, ROOM]]); })();
  }
  var ROOM = .0108;

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d'); MC = mk(8, 8).getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 condensed 84px Archivo', '700 condensed 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹✓✕–@!>$(),:§+/=½'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      OVEN_C = paintOven(); DIAL_C = paintDial();
      window.READY = true;
    });
  }
  /* the end card: the phone glides back to frame 0's place; the clip flips back to frame 0's version mid-glide */
  initTimes();
  /* the hero hold: from the stamp settling to the torn edge, fully still */
  var HOLD = { t0: GT.slam + .12, t1: K.tearA };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'energy', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
