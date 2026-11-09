/* "Is this video real? Five seconds." — Factory #21 on Tech, explained (How tech works), after ../vision/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   One hand-made hero prop: a paper phone playing a cut-paper street clip (a paper hand from the wrist down, a shop sign,
   a lamp post, a paper sun), drawn here: no real footage, no faces, no logos, no platform UI. The native move is the
   brass paper loupe: it hunts the pixels like the viewer does, then leaves the picture for the poster's name. One hero
   stamp: WHO POSTED IT? (coral); coral is also on the end card's YES / NO and nowhere else. Every scene is clipped to
   the safe box x 90–930, y 300–1430. */
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
  /* the aligner pins "Wrong-way" to the end of "signs." across the pause; the voice-only track has it ~0.42 s before "shadows" */
  (function () { var ws = LINE.tells.words, a = ws[4], b = ws[5]; if (b.t0 - a.t0 > .6) a.t0 = +(b.t0 - .42).toFixed(3); })();
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
    five: at('hook', 'five'), hookEnd: lend('hook'),
    ask: start('ask'), askEnd: lend('ask'),
    hunt: start('hunt'), huntW: at('hunt', 'hunt'), glitch: at('hunt', 'glitches'), huntEnd: lend('hunt'),
    tells: start('tells'), fingers: at('tells', 'fingers'), fingersE: wend('tells', 'fingers'), garbled: at('tells', 'garbled'), signs: at('tells', 'signs'), signsE: wend('tells', 'signs'),
    wrong: at('tells', 'wrongway'), shadows: at('tells', 'shadows'), tellsEnd: lend('tells'),
    fading: start('fading'), glitch2: at('fading', 'glitches'), harder: at('fading', 'harder'), spot: at('fading', 'spot'), fadeEnd: lend('fading'),
    coin: start('coin'), y2024: at('coin', '2024'), study: at('coin', 'study'), people: at('coin', 'people'), guessed: at('coin', 'guessed'), half: at('coin', 'half'), coinEnd: lend('coin'),
    stop: start('stop'), stopW: at('stop', 'stop'), staring: at('stop', 'staring'), pixels: at('stop', 'pixels'), stopEnd: lend('stop'),
    hero: start('hero'), who: at('hero', 'who'), posted: at('hero', 'posted'), first: at('hero', 'first'), heroEnd: lend('hero'),
    tap: start('tap'), name: at('tap', 'name'), nameE: wend('tap', 'name'), find: at('tap', 'find'), original: at('tap', 'original'), upload: at('tap', 'upload'), tapEnd: lend('tap'),
    label: start('label'), ai: at('label', 'ai'), labelW: at('label', 'label'), content: at('label', 'content'), creds: at('label', 'credentials'), labelEnd: lend('label'),
    miss: start('missing'), no: at('missing', 'no'), noLE: wend('missing', 'label'), that: at('missing', 'that'), proves: at('missing', 'proves'), nothing: at('missing', 'nothing'), missEnd: lend('missing'),
    end: start('end'), check: at('end', 'check'), yes: at('end', 'yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  /* the hits are placed from the heard words before anything is timed off them (see the SFX gate below) */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  var lastE = EDGES.length ? Math.max.apply(null, EDGES) : -1;
  VO.lines.forEach(function (l) { if (l.t0 > lastE + .3) l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 + .15 }); EDGES.push(w.t0, w.t1 + .15); }); });
  /* where the hero line's voice really stops (its last word rings past the vo.js end) */
  var heroV = K.heroEnd; VOICED.forEach(function (v) { if (v.t0 < K.heroEnd + .3 && v.t1 > heroV && v.t1 < K.tap) heroV = v.t1; });
  var BODY = { thump: .16, knock: .22, tick: .05, pop: .12, paper: .17, swish: .28, tear: .12, slap: .1, click: .06 };
  var GT = {};
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  (function () {
    /* THE thump: as soon after "first." as the gate allows, so the hold that follows is long */
    place('slam', 'thump', heroV + .04, .2, K.heroEnd, K.tap - 1.0);
    if (GT.slam === null) GT.slam = Math.max(K.heroEnd + .2, heroV + .16);
    /* frame 0's play tap, before the first word */
    place('play', 'click', .17, .16, 0, .3);
    /* ALSO MADE UP's slap, only if a gap holds it near "harder" (the line runs on, so usually none) */
    place('made', 'slap', K.harder - .3, .18, K.harder - .45, K.harder - .05);
    /* soft rips on the torn wipes: the first in the pause after "spot.", the second after the coin lands */
    place('tear1', 'tear', K.fadeEnd + .3, .2, K.fadeEnd + .1, K.coin);
    /* the coin lands in the silence after "half the time." */
    place('ping', 'knock', K.coinEnd + .2, .2, K.coinEnd, K.stop);
    /* loupe ticks after each tell, only where a gap holds them */
    place('tick1', 'tick', K.fingersE + .1, .2, K.fingersE, K.garbled);
    place('tick2', 'tick', K.signsE + .1, .2, K.signsE, K.wrong);
    place('tick3', 'tick', K.tellsEnd + .12, .2, K.tellsEnd, K.fading);
    /* the fingertip's tap after "name.", the METADATA corner's rip after "No label?" */
    place('tap', 'pop', K.nameE + .12, .16, K.nameE, K.find);
    place('rip', 'paper', K.noLE + .14, .16, K.noLE, K.that + .2);
  })();
  /* the coin lands on its ping (or just after "time." without one) */
  K.land = GT.ping != null ? GT.ping : K.coinEnd + .2;
  (function () {
    place('tear2', 'tear', K.land + .28, .2, K.land + .22, K.stop);
    /* the FIRST UPLOAD tick, in the pause after "upload." */
    place('tick4', 'tick', K.tapEnd + .45, .2, K.tapEnd, K.label);
  })();
  /* the wipes start on their rips (or where they would be without one) */
  K.w1 = GT.tear1 != null ? GT.tear1 : K.fadeEnd + .3;
  K.w2 = GT.tear2 != null ? GT.tear2 : K.stop - .05;
  K.tick4 = GT.tick4 != null ? GT.tick4 : K.upload - .1;
  /* the hold: the edge falls in the year's slap once it is visible */
  K.s2024 = Math.max(K.y2024 - .08, K.w1 + .4 * 1.1);
  /* the hero hold: the stamp settles .12 s after the thump; the torn edge starts .15 s into "Tap", falls fast through the
     top third, then evenly past the stamp; the next caption waits until the edge is past the stamp */
  K.tearA = GT.slam + .12 + 1.21;
  K.capA = K.tearA + .1;
  K.rip = GT.rip != null ? GT.rip : K.that;
  /* the check's rail: FIRST UPLOAD peels off once read; NIST takes the tip's rows as soon as the tip has been read */
  K.T_FU = K.tearA + 3.72;
  K.T_NIST = K.tearA + 4.31;

  var SW1 = 1.1, SW2 = .6, SW3 = 1.7;
  var SC = [
    { id: 'feed', fn: 'feed', name: 'Real or AI?', t0: 0 },
    { id: 'study', fn: 'study', name: 'A coin toss', t0: K.w1 + SW1, swipe: true, sw: SW1 },
    { id: 'source', fn: 'source', name: 'Who posted it', t0: K.w2 + SW2, swipe: true, sw: SW2 },
    { id: 'check', fn: 'check', name: 'The check', t0: K.tearA + SW3, swipe: true, sw: SW3, two: true }
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
  function tag(g, text, x, y, a, rot, maxw) { var m = g.getTransform(), sc = Math.min(1, Math.hypot(m.c, m.d)); chip(g, text, x, y, { px: Math.ceil(36.5 / Math.max(sc, .5)), wt: 700, fam: MONO, line: CREAM, lw: 3, fg: CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: 'rgba(21,19,27,.88)', maxw: maxw || 820 }); }
  /* a quote: condensed Archivo so a source's exact words fit the rail at ≥ 36 px */
  function quote(g, text, x, y, a, px) { txt(g, text, x, y, px || 42, CREAM, 'center', 700, DISP, 830, a, 36, 'condensed'); }
  function credit(g, text, x, y, a) { txt(g, text, x, y, 36, CREAM, 'center', 500, MONO, 830, a, 36); }

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
    grainIn(g, x0, y0, x1 - x0, y1 - y0, seed + 1);
    prop(g, name || 'sheet', x0, y0, x1 + 8, y1 + 11);
  }

  /* ---------- the clip: a cut-paper street, 496 × 776 (the phone's whole screen), drawn in clip units ----------
     ver 0 = frame 0's clip with the three tells drawn in (a sixth finger, OPNE, the lamp's shadow toward the sun);
     ver 1 = the clean redraw (five fingers, OPEN, the shadow away from the sun): ALSO MADE UP. */
  var CW = 496, CH = 776, CLIPBG = [null, null];
  var SUN = { x: 82, y: 98, r: 46 }, LAMP = { x: 412, base: 612 };
  function paintClipBg(ver) {
    var k = 2, c = mk(CW * k, CH * k), g = c.getContext('2d'); g.scale(k, k);
    var r = mulberry(31);
    /* sky, a paper sun */
    g.fillStyle = '#a9c4c4'; g.fillRect(0, 0, CW, CH);
    g.beginPath(); g.rect(0, 0, CW, 620); grainIn(g, 0, 0, CW, 620, 32, .8);
    g.fillStyle = '#f3c04f'; cut(g, (function () { var P = []; for (var i = 0; i < 24; i++) { var a = i / 24 * 6.283; P.push([SUN.x + Math.cos(a) * SUN.r, SUN.y + Math.sin(a) * SUN.r]); } return P; })(), mulberry(33), 2.2);
    g.fillStyle = 'rgba(255,255,255,.25)'; el(g, SUN.x - 14, SUN.y - 16, 16, 10, -.5);
    /* the shop: a sage wall, a cream sign board, a striped awning, a window and a door */
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(30, 200, 312, 412);
    g.fillStyle = '#6f8a5c'; cut(g, [[22, 196], [334, 196], [334, 612], [22, 612]], mulberry(34), 1.6);
    g.beginPath(); g.rect(22, 196, 312, 416); grainIn(g, 22, 196, 312, 416, 35, 1);
    g.fillStyle = '#4f6643'; g.fillRect(22, 196, 312, 14);
    /* sign board */
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(64, 230, 240, 70);
    g.fillStyle = '#f4ead3'; cut(g, [[58, 222], [298, 222], [298, 290], [58, 290]], mulberry(36), 1.2);
    g.strokeStyle = '#3a3340'; g.lineWidth = 4; g.strokeRect(66, 230, 224, 52);
    g.fillStyle = '#2b2630'; g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, 50, 900, DISP, 'expanded'); ls(g, 4);
    g.fillText(ver ? 'OPEN' : 'OPNE', 178, 259); ls(g, 0);
    if (!ver) {
      /* the broken glyph: the E's middle bar slips down and a stray stroke crosses the N */
      var wE = g.measureText('OPNE').width, xE = 178 + wE / 2 - 30;
      g.fillStyle = '#f4ead3'; g.fillRect(xE - 2, 254, 34, 10);
      g.fillStyle = '#2b2630'; g.save(); g.translate(xE + 10, 270); g.rotate(.32); g.fillRect(-12, -3, 30, 7); g.restore();
      g.save(); g.translate(178 + 8, 250); g.rotate(-.9); g.fillRect(-4, -18, 7, 26); g.restore();
    }
    /* awning: navy and cream stripes, scalloped */
    for (var i = 0; i < 9; i++) {
      var x0 = 28 + i * 34.4;
      g.fillStyle = i % 2 ? '#f1e6cf' : '#35506b';
      g.beginPath(); g.moveTo(x0, 316); g.lineTo(x0 + 34.4, 316); g.lineTo(x0 + 34.4, 352); g.arc(x0 + 17.2, 352, 17.2, 0, Math.PI); g.closePath(); g.fill();
    }
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(28, 316, 310, 6);
    /* window and door */
    g.fillStyle = '#2c3a44'; cut(g, [[48, 392], [196, 392], [196, 548], [48, 548]], mulberry(37), 1.2);
    g.strokeStyle = '#f1e6cf'; g.lineWidth = 6; g.strokeRect(48, 392, 148, 156); g.beginPath(); g.moveTo(122, 392); g.lineTo(122, 548); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.14)'; poly(g, [[60, 548], [100, 392], [126, 392], [86, 548]]); g.fill();
    g.fillStyle = '#5b3b2c'; cut(g, [[218, 392], [306, 392], [306, 612], [218, 612]], mulberry(38), 1.2);
    g.fillStyle = '#f3c04f'; el(g, 292, 506, 6, 6);
    /* pavement and curb */
    g.fillStyle = '#a19b90'; g.fillRect(0, 612, CW, CH - 612);
    g.beginPath(); g.rect(0, 612, CW, CH - 612); grainIn(g, 0, 612, CW, CH - 612, 39, 1);
    g.fillStyle = '#8a8478'; g.fillRect(0, 612, CW, 12);
    g.fillStyle = 'rgba(0,0,0,.12)'; for (i = 0; i < 6; i++) g.fillRect(i * 96 + 40, 624, 4, CH - 624);
    /* the lamp's shadow: away from the sun (clean) or toward it (the tell) */
    var bx = LAMP.x, by = LAMP.base + 4, d = ver ? 1 : -1;
    g.fillStyle = 'rgba(20,18,28,.42)'; poly(g, [[bx - 9, by], [bx + 9, by], [bx + d * 104 + 10, by + 104], [bx + d * 104 - 12, by + 110]]); g.fill();
    el(g, bx + d * 104, by + 108, 22, 9, 0);
    /* lamp post */
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(LAMP.x - 3, 150, 16, 462);
    g.fillStyle = '#2c3b35'; g.fillRect(LAMP.x - 7, 160, 14, 452); g.fillRect(LAMP.x - 17, 596, 34, 18);
    g.fillRect(LAMP.x - 26, 150, 52, 10);
    g.fillStyle = '#f4e3a6'; poly(g, [[LAMP.x - 22, 104], [LAMP.x + 22, 104], [LAMP.x + 17, 150], [LAMP.x - 17, 150]]); g.fill();
    g.fillStyle = '#2c3b35'; poly(g, [[LAMP.x - 30, 104], [LAMP.x, 80], [LAMP.x + 30, 104]]); g.fill();
    return c;
  }
  /* clip time: the clip plays from frame 0, pauses when the post strip rises on "Check", and on the end card runs as
     t − DUR so its last frame is its first */
  function clipTime(t) {
    var P0 = K.hero + .45;
    if (t < P0) return t;
    if (t < K.endFlip) return P0;
    return t - DUR;
  }
  function wave(ct) { return .2 * Math.sin(2 * Math.PI * ct / 1.25) + .04 * Math.sin(2 * Math.PI * ct / .55); }
  var PIV = { x: 172, y: 905 };
  function hand(g, ct, ver, circ) {
    g.save(); g.translate(PIV.x, PIV.y); g.rotate(wave(ct));
    /* sleeve */
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, -42, -262, 96, 300, 18); g.fill();
    g.fillStyle = '#35506b'; rr(g, -48, -270, 96, 300, 18); g.fill();
    g.fillStyle = '#2a4057'; g.fillRect(-48, -270, 96, 16);
    var SK = '#d9a27a', SKD = '#bf855f';
    /* fingers: four (clean) or five (the tell), then the thumb */
    var F = ver ? [[-40, 23, 62], [-14, 23, 78], [12, 23, 74], [37, 22, 58]] : [[-46, 19, 58], [-23, 19, 72], [0, 19, 78], [23, 19, 72], [46, 19, 56]];
    F.forEach(function (f) { g.fillStyle = SKD; rr(g, f[0] - f[1] / 2 + 2, -386 - f[2] + 4, f[1], f[2] + 30, f[1] / 2); g.fill(); g.fillStyle = SK; rr(g, f[0] - f[1] / 2, -386 - f[2], f[1], f[2] + 30, f[1] / 2); g.fill();
      g.fillStyle = 'rgba(0,0,0,.13)'; g.fillRect(f[0] - f[1] / 2 + 4, -386 - f[2] * .45, f[1] - 8, 3); });
    g.save(); g.translate(-56, -320); g.rotate(-.75); g.fillStyle = SK; rr(g, -13, -70, 26, 84, 13); g.fill(); g.restore();
    g.fillStyle = SK; rr(g, -60, -396, 120, 136, 34); g.fill();
    g.fillStyle = 'rgba(0,0,0,.08)'; el(g, 10, -322, 34, 40);
    if (circ > 0) ring(g, 0, -432, 82, 74, circ, 0);
    g.restore();
  }
  /* a hand-drawn cream circle, drawn on over k (0…1) */
  function ring(g, x, y, rx, ry, k, rot) {
    if (k <= 0) return;
    g.save(); g.strokeStyle = CREAM; g.lineWidth = 7; g.lineCap = 'round';
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 6; g.shadowOffsetY = 3;
    g.beginPath(); var n = 48, end = Math.floor(n * 1.08 * Math.min(1, k));
    for (var i = 0; i <= end; i++) { var a = -1.9 + i / n * 6.283, w = 1 + .05 * Math.sin(i * 1.7) + .03 * (i / n); var px = x + Math.cos(a + rot) * rx * w, py = y + Math.sin(a + rot) * ry * w; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    g.stroke(); g.restore();
  }
  /* the clip, drawn in clip units: background layer, drifting clouds, a bird, the hand, the tells' circles */
  function clip(g, ct, ver, o) {
    o = o || {};
    g.drawImage(CLIPBG[ver], 0, 0, CW, CH);
    /* clouds drift and wrap (period 12 s, so the loop's ends meet through clipTime) */
    g.fillStyle = '#eef0e6';
    [[0, 150, 1], [.55, 60, .8]].forEach(function (c2) {
      var x = wrap(c2[0] * 700 + ct * 700 / 12, 700) - 120, y = c2[1];
      g.save(); g.globalAlpha = .92; el(g, x, y, 62 * c2[2], 22 * c2[2]); el(g, x + 40 * c2[2], y - 14 * c2[2], 40 * c2[2], 22 * c2[2]); el(g, x - 36 * c2[2], y + 4, 34 * c2[2], 16 * c2[2]); g.restore();
    });
    /* a paper bird crossing (period 4 s) */
    var bx = wrap(ct * 640 / 4, 640) - 70, by = 176 + 10 * Math.sin(ct * 2.2), fl = Math.sin(ct * 14) * 10;
    g.strokeStyle = '#2b2630'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx - 16, by - fl); g.lineTo(bx, by); g.lineTo(bx + 16, by - fl); g.stroke();
    hand(g, ct, ver, o.c1 || 0);
    if (o.c2 > 0) ring(g, 178, 258, 150, 58, o.c2, .02);
    if (o.c3 > 0) {
      ring(g, LAMP.x - 52, LAMP.base + 62, 92, 58, o.c3, -.1);
      /* the light's direction: a paper arrow from the sun, pointing away from it */
      var ak = eout(clamp(o.c3 * 1.4 - .3, 0, 1));
      if (ak > 0) {
        g.save(); g.globalAlpha *= ak; g.translate(SUN.x, SUN.y); g.rotate(.42);
        g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(60, 2, 150 * ak, 12);
        g.fillStyle = CREAM; g.fillRect(58, -6, 150 * ak, 12); poly(g, [[58 + 150 * ak, -20], [58 + 150 * ak + 30, 0], [58 + 150 * ak, 20]]); g.fill();
        g.restore();
      }
    }
  }
  /* blocky pixels: the clip drawn small, scaled back up nearest-neighbour (the "pixels" the loupe stares at) */
  var LO = null;
  function clipLo(ct, ver) {
    var g = LO.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, LO.width, LO.height);
    g.scale(LO.width / CW, LO.height / CH); clip(g, ct, ver); return LO;
  }

  /* ---------- the paper phone: 540 × 820, a round punch-hole, no notch, no logo, no platform UI ---------- */
  var PHW = 540, PHH = 820, BZ = 22, SCW = 496, SCH = 776, BODY_C = null;
  function paintBody() {
    var k = 2, c = mk((PHW + 20) * k, (PHH + 20) * k), g = c.getContext('2d'); g.scale(k, k); g.translate(10, 10);
    g.fillStyle = '#2b2834'; rr(g, 0, 0, PHW, PHH, 66); g.fill();
    rr(g, 0, 0, PHW, PHH, 66); grainIn(g, 0, 0, PHW, PHH, 51, 1.2);
    g.strokeStyle = '#4a4555'; g.lineWidth = 4; rr(g, 2, 2, PHW - 4, PHH - 4, 64); g.stroke();
    g.fillStyle = '#3a3644'; g.fillRect(PHW - 1, 170, 7, 90); g.fillRect(PHW - 1, 290, 7, 56);
    return c;
  }
  function phoneMat(P) { return new DOMMatrix().translate(P.cx, P.cy).rotate(P.rot * 180 / Math.PI).scale(P.s); }
  /* screen units (0…496, 0…776) → stage pixels */
  function scr(P, x, y) { var p = phoneMat(P).transformPoint(new DOMPoint(x - SCW / 2, y - SCH / 2)); return { x: p.x, y: p.y }; }
  /* the post strip: blank avatar, @ ? ? ?; it rises over the clip's bottom on "Check" */
  var STRIP = 210;
  function strip(g, rise) {
    if (rise <= 0) return;
    var y0 = SCH - STRIP * eio(rise);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y0 - 8, SCW, 8);
    g.fillStyle = PAPER; g.fillRect(0, y0, SCW, STRIP + 4);
    g.beginPath(); g.rect(0, y0, SCW, STRIP); grainIn(g, 0, y0, SCW, STRIP, 61, 1);
    g.fillStyle = '#8f897f'; el(g, 70, y0 + 92, 40, 40);
    g.fillStyle = '#a7a196'; el(g, 70, y0 + 82, 15, 15); g.beginPath(); g.ellipse(70, y0 + 120, 26, 18, 0, Math.PI, 0); g.fill();
    var oldP = ONPROP; ONPROP = true;
    if (rise > .3) txt(g, '@ ? ? ?', 128, y0 + 94, 48, INK, 'left', 900, DISP);   /* hidden under the screen's edge below that */
    ONPROP = oldP;
  }
  /* o: { ct, ver, flip (0…1 paper flip of the clip), rise (strip), dim, c1..c3 (tell circles), tagA, madeA, meta, metaOff } */
  function phone(g, P, o) {
    g.save(); g.translate(P.cx, P.cy); g.rotate(P.rot); g.scale(P.s, P.s);
    if (!o.noShadow) { g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 30; g.shadowOffsetX = 10; g.shadowOffsetY = 18; g.fillStyle = '#17151c'; rr(g, -PHW / 2 + 4, -PHH / 2 + 4, PHW - 8, PHH - 8, 64); g.fill(); g.restore(); }
    g.drawImage(BODY_C, -PHW / 2 - 10, -PHH / 2 - 10, PHW + 20, PHH + 20);
    prop(g, 'phone', -PHW / 2, -PHH / 2, PHW / 2 + 10, PHH / 2 + 18);
    g.translate(-SCW / 2, -SCH / 2);
    g.save(); rr(g, 0, 0, SCW, SCH, 46); g.clip();
    g.fillStyle = '#0f0e13'; g.fillRect(0, 0, SCW, SCH);
    /* the clip, with its paper flip (around the vertical centre line; the other version on the back) */
    var f = o.flip || 0, sx = Math.abs(Math.cos(Math.PI * f)), ver = f < .5 ? o.ver : 1 - o.ver;
    g.save(); g.translate(SCW / 2, 0); g.scale(Math.max(sx, .02), 1); g.translate(-SCW / 2, 0);
    if (o.lo > 0) { var sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(clipLo(o.ct, ver), 0, 0, SCW, SCH); g.imageSmoothingEnabled = sm; }
    if (!(o.lo >= 1)) { g.save(); if (o.lo > 0) g.globalAlpha *= 1 - o.lo; clip(g, o.ct, ver, f < .5 ? o : {}); g.restore(); }
    if (f > 0 && f < 1) { g.fillStyle = 'rgba(0,0,0,' + (.5 * Math.sin(Math.PI * f)) + ')'; g.fillRect(0, 0, SCW, SCH); }
    g.restore();
    if (o.dim > 0) { g.fillStyle = 'rgba(21,19,27,' + o.dim + ')'; g.fillRect(0, 0, SCW, SCH); }
    /* the METADATA corner, while it is still attached */
    if (o.meta > 0 && !(o.metaOff > 0)) metaCorner(g, o.meta, 0);
    strip(g, o.rise || 0);
    /* tags on the clip: OUR ILLUSTRATION from "hunt"; ALSO MADE UP on the clean redraw */
    if (o.tagA > 0) tag(g, 'OUR ILLUSTRATION', 30 + 190, 52, o.tagA, -.01, 470);
    if (o.madeA > 0) chip(g, 'ALSO MADE UP', SCW / 2, 132, { px: 58, wt: 900, bg: CREAM, fg: BG, a: o.madeA, s: o.madeS == null ? 1 : o.madeS, rot: -.02, maxw: 470 });
    g.restore();
    /* the punch-hole camera */
    g.fillStyle = '#0b0a0e'; el(g, SCW / 2, 26, 10, 10); g.fillStyle = 'rgba(255,255,255,.12)'; el(g, SCW / 2 - 3, 23, 3, 3);
    if (o.metaOff > 0) metaCorner(g, 1, o.metaOff);
    g.restore();
  }
  /* the METADATA corner: a paper band across the clip's top-right corner; torn off, it flutters down and away */
  function metaCorner(g, a, off) {
    g.save(); g.globalAlpha *= clamp(a, 0, 1) * (1 - seg(off, .45, .62));
    if (off > 0) {
      var k = off, fx = 120 * k + 40 * Math.sin(k * 7), fy = 980 * k * k + 60 * k;
      g.translate(SCW - 76 + fx, 76 + fy); g.rotate(.785 + 2.2 * k + .4 * Math.sin(k * 9));
    } else { g.beginPath(); g.rect(0, 0, SCW, SCH); g.clip(); g.translate(SCW - 76, 76); g.rotate(.785); }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-170 + 6, -32 + 8, 340, 64);
    g.fillStyle = PAPER; cut(g, [[-170, -32], [170, -32], [170, 32], [-170, 32]], mulberry(71), 2.5);
    var oldP = ONPROP; ONPROP = true; txt(g, 'METADATA', 0, 2, 46, INK, 'center', 900, DISP, 300, 1, 36); ONPROP = oldP;
    g.restore();
  }

  /* ---------- the loupe: a brass paper rim, a wooden handle; the lens draws the phone again, magnified ---------- */
  var LR = 136, MAG = 1.9;
  function loupe(g, x, y, s, lift, lensFn, ha, mag) {
    var R = LR * s, sh = 1 + lift;
    var hx = Math.cos(ha), hy = Math.sin(ha);
    g.save();
    /* shadow: lens and handle */
    g.fillStyle = 'rgba(0,0,0,' + (.32 + .08 * lift) + ')';
    var ox = 12 * sh, oy = 20 * sh;
    el(g, x + ox, y + oy, R + 10, R + 10);
    g.save(); g.translate(x + ox + hx * (R + 6), y + oy + hy * (R + 6)); g.rotate(ha); rr(g, 0, -19 * s, 176 * s, 38 * s, 19 * s); g.fill(); g.restore();
    /* the lens: whatever is under it, magnified */
    g.save(); g.beginPath(); g.arc(x, y, R, 0, 6.283); g.clip();
    g.fillStyle = BG; g.fillRect(x - R, y - R, 2 * R, 2 * R);
    var M = mag || MAG; g.save(); g.translate(x, y); g.scale(M, M); g.translate(-x, -y); var oldL = INLENS; INLENS = true; lensFn(g); INLENS = oldL; g.restore();
    var gl = g.createRadialGradient(x - R * .35, y - R * .4, R * .1, x, y, R); gl.addColorStop(0, 'rgba(255,250,235,.18)'); gl.addColorStop(.6, 'rgba(255,250,235,0)'); gl.addColorStop(1, 'rgba(40,30,10,.25)');
    g.fillStyle = gl; g.fillRect(x - R, y - R, 2 * R, 2 * R);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 6 * s; g.beginPath(); g.arc(x, y, R * .8, 3.6, 4.4); g.stroke();
    g.restore();
    /* rim */
    g.lineWidth = 20 * s; g.strokeStyle = '#a97c35'; g.beginPath(); g.arc(x, y, R + 9 * s, 0, 6.283); g.stroke();
    g.lineWidth = 4 * s; g.strokeStyle = '#e0bf78'; g.beginPath(); g.arc(x, y, R + 4 * s, 3.4, 5.6); g.stroke();
    g.strokeStyle = '#6f4f1d'; g.beginPath(); g.arc(x, y, R + 18 * s, 0, 6.283); g.stroke();
    /* collar and handle */
    g.save(); g.translate(x + hx * (R + 14 * s), y + hy * (R + 14 * s)); g.rotate(ha);
    g.fillStyle = '#a97c35'; rr(g, 0, -15 * s, 30 * s, 30 * s, 5 * s); g.fill();
    g.fillStyle = '#5b3a26'; rr(g, 26 * s, -19 * s, 150 * s, 38 * s, 19 * s); g.fill();
    g.fillStyle = 'rgba(255,255,255,.14)'; rr(g, 34 * s, -14 * s, 130 * s, 8 * s, 4 * s); g.fill();
    prop(g, 'loupe', -R * 2, -R - 20, 180 * s, R + 20);
    g.restore();
    g.restore();
  }
  /* the handle points up and to the right, more upright near the right rail */
  function handleA(x) { return -.95 - .7 * clamp((x - 520) / 220, 0, 1); }

  /* =====================================================================================================
     SCENE 1 · the feed (hook → fading): the phone, the loupe, the tells
     ===================================================================================================== */
  var REST = { cx: 510, cy: 972, s: 1.08, rot: 0 };   /* the hook's rest: 583 px wide, centred */
  var F0 = { cx: 640, cy: 1015, s: .95, rot: .05 };   /* frame 0 and the last frame */
  var TELLS = { cx: 510, cy: 845, s: .88 };            /* while the tells are named (the quote rail sits under it) */
  function lerpP(A, B, k) { return { cx: lerp(A.cx, B.cx, k), cy: lerp(A.cy, B.cy, k), s: lerp(A.s, B.s, k), rot: lerp(A.rot, B.rot, k) }; }
  function hookK(t) { return eout(seg(t, 0, .95)); }
  function feedPose(t) {
    var P = lerpP(F0, REST, hookK(t));
    /* the phone breathes a little after it lands */
    var on = seg(t, 1.0, 1.6), tk = eio(seg(t, K.fingers - .35, K.fingers + .1));
    /* a slow camera push on the timer (2.5–5.0 s), held to 1.03× so the phone stays under the search phrase and above 1430 */
    var push = 1 + .03 * eio(seg(t, 2.5, 5.0)); P.s *= push; P.cy -= 4 * (push - 1) / .03;
    P.s = lerp(P.s, TELLS.s, tk); P.cy = lerp(P.cy, TELLS.cy, tk);
    P.cy += 5 * Math.sin((t - 1) * 1.5) * on; P.rot += .004 * Math.sin((t - 1) * 1.1 + .6) * on;
    return P;
  }
  /* the loupe's path in clip units: keyframes [time, x, y]; eased between, a small hover on top */
  var LPATH, LIN = 3.4;   /* the loupe slides in from the right on "So…", not after it */
  function buildPath() {
    LPATH = [
      [LIN, 700, 960], [K.hunt - .1, 400, 560], [K.huntW + .05, 430, 230], [K.huntEnd + .05, 110, 360],
      [K.fingers - .12, 172, 470],
      [K.garbled - .2, 172, 470], [K.signs - .08, 182, 262],
      [K.wrong - .2, 182, 262], [K.shadows - .06, 368, 622],
      /* on the clean redraw it checks each spot again and finds nothing, then leaves before the stamp */
      [K.fading + .1, 368, 622], [K.glitch2 + .05, 172, 470], [K.harder - .5, 182, 262], [K.harder - .22, 600, 40]
    ];
  }
  function pathAt(t) {
    var P = LPATH, i;
    if (t <= P[0][0]) return { x: P[0][1], y: P[0][2] };
    for (i = 0; i < P.length - 1; i++) if (t < P[i + 1][0]) { var k = eio(seg(t, P[i][0], P[i + 1][0])); return { x: lerp(P[i][1], P[i + 1][1], k), y: lerp(P[i][2], P[i + 1][2], k) }; }
    return { x: P[P.length - 1][1], y: P[P.length - 1][2] };
  }
  /* the tells' circles: drawn on as the loupe settles on each, peeled off on "But" */
  function circK(t, a) { return eout(seg(t, a, a + .3)) * (1 - seg(t, K.fading - .05, K.fading + .25)); }
  var QUOTES = [['“…extra fingers…”', 'fingers'], ['“…nonexistent words, spelling errors…”', 'signs'], ['“…shadows cast in inconsistent directions…”', 'shadows']];
  function feedScene(g, t) {
    var P = feedPose(t), ct = clipTime(t);
    /* the clean redraw: a paper flip on "glitches", back side clean */
    var flip = seg(t, K.fading - .1, K.fading + .3);
    var o = { ct: ct, ver: 0, flip: flip >= 1 ? 0 : flip, c1: circK(t, K.fingers - .05), c2: circK(t, K.signs - .02), c3: circK(t, K.shadows),
      tagA: fin(t, K.huntW - .1), madeA: 0 };
    if (flip >= 1) { o.ver = 1; o.c1 = o.c2 = o.c3 = 0; }
    phone(g, P, o);
    /* frame 0's five-second timer: a cream arc with a small 5, beside the phone; it runs out on "So" */
    var ra = 1 - seg(t, K.ask + 2.2, K.ask + 2.45);
    var pt = GT.play != null ? GT.play : .17;
    if (ra > 0) ringTimer(g, P, ra, clamp(1 - t / K.ask, 0, 1), Math.sin(Math.PI * seg(t, pt - .02, pt + .18)), t >= K.ask ? t - K.ask : -1);
    /* the loupe (it fades as it leaves the clean redraw) */
    var lfa = 1 - seg(t, K.harder - .45, K.harder - .22);
    if (t > LIN && lfa > 0) {
      var c = pathAt(t), bob = seg(t, K.hunt + .3, K.hunt + .8);
      c = { x: c.x + 5 * Math.sin(t * 2.3) * bob, y: c.y + 4 * Math.cos(t * 1.9) * bob };
      var p = scr(P, c.x, c.y);
      g.save(); g.globalAlpha *= lfa;
      loupe(g, p.x, p.y, 1, .15 + .1 * Math.sin(t * 1.3), function (h) { phone(h, P, Object.assign({}, o, { noShadow: true })); }, handleA(p.x));
      g.restore();
    }
    /* the reveal: the redraw is made up too; a cream stamp across the phone on "harder" (never coral) */
    var mp = scr(P, SCW / 2, 600);
    stamp(g, 'ALSO\nMADE UP', mp.x, mp.y, t, K.harder - .3, 100, CREAM, -.06, .35);
    /* the rail under the phone: each tell's exact words; then NIST */
    /* the rail under the phone: each tell's exact words stack up as it is found, with the guide's credit, and stay */
    var tq = [K.fingers - .1, K.garbled, K.wrong];
    QUOTES.forEach(function (q, i) {
      var a = fin(t, tq[i]);
      if (a > 0) { g.save(); g.translate(0, 14 * (1 - eout(seg(t, tq[i], tq[i] + .3)))); quote(g, q[0], CX, 1250 + 46 * i, a); g.restore(); }
    });
    txt(g, 'TELLS FROM NORTHWESTERN’S 2024 AI-IMAGE GUIDE', CX, 1396, 36, CREAM, 'center', 600, DISP, 830, fin(t, K.fingers - .1), 36, 'condensed');
    /* the headline: REAL OR AI? (frame 0, 3 words), then the search phrase on "So" */
    var ha = 1 - seg(t, 1.97, 2.01);
    if (ha > 0 && !POSTERMODE && LIVE.text) headline(g, eout(seg(t, 0, .9)), ha, 40 * seg(t, 1.95, 2.01));
    var sa = fin(t, 1.985) * (1 - seg(t, K.hunt - .14, K.hunt - .02));
    if (sa > 0 && LIVE.text) {
      txt(g, 'HOW TO TELL IF', CX, 372, 76, CREAM, 'center', 900, DISP, 830, sa, 52, 'expanded');
      chip(g, 'A VIDEO IS AI', CX, 458, { px: 72, wt: 900, bg: CREAM, fg: BG, a: sa, s: .92 + .08 * Math.min(1, pop(t, 1.985, 3.2)), maxw: 830, st: 'expanded', shadow: false });
    }
  }
  /* REAL OR AI?: on frame 0 it sits on the picture (a dark paper band across the phone's sky) and slides 358 px up to
     its place above the phone, the band fading into the stage; the end card puts it back on the picture (k = 0) */
  var HL0 = 760, HL1 = 402;
  function headline(g, k, a, rise) {
    var y = lerp(HL0, HL1, k) - (rise || 0), ba = .92 * (1 - k);
    chip(g, 'REAL OR AI?', CX, y, { px: 118, wt: 900, bg: ba > .01 ? 'rgba(21,19,27,' + ba.toFixed(3) + ')' : null, fg: CREAM, a: a, st: 'expanded', maxw: 800, pad: 22, shadow: false, r: 22 });
  }
  function ringTimer(g, P, a, k, press, up) {
    var c = scr(P, -72, 470), R = 66 * P.s / 1.08;
    g.save(); g.globalAlpha *= a;
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 16; g.beginPath(); g.arc(c.x + 4, c.y + 6, R, 0, 6.283); g.stroke();
    g.strokeStyle = 'rgba(244,237,224,.22)'; g.lineWidth = 14; g.beginPath(); g.arc(c.x, c.y, R, 0, 6.283); g.stroke();
    g.fillStyle = BG; el(g, c.x, c.y, R - 7, R - 7);
    if (k > 0) { g.strokeStyle = CREAM; g.lineWidth = 14; g.beginPath(); g.arc(c.x, c.y, R, -Math.PI / 2, -Math.PI / 2 + 6.283 * k); g.stroke(); }
    /* a small paper play mark in the middle (tapped on frame 0's first beat), and the timer's 5 */
    var pm = 1 - .16 * (press || 0);
    g.save(); g.translate(c.x, c.y); g.scale(pm, pm);
    g.fillStyle = CREAM; poly(g, [[-R * .22, -R * .3], [R * .32, 0], [-R * .22, R * .3]]); g.fill(); g.restore();
    var dx = c.x + R * .74, dy = c.y + R * .74;
    g.fillStyle = 'rgba(0,0,0,.4)'; el(g, dx + 3, dy + 5, 27, 27);
    g.fillStyle = CREAM; el(g, dx, dy, 27, 27);
    /* it counts 5 → 1 (each digit is up ~0.5 s, so they stay out of the readcheck) */
    var dg = k >= 1 ? 5 : Math.max(1, Math.ceil(5 * k - 1e-9));
    NOREC = true; txt(g, String(dg), dx, dy + 2, 38, BG, 'center', 900, DISP); NOREC = false;
    prop(g, 'ring', c.x - R - 8, c.y - R - 8, dx + 30, dy + 32);
    g.restore();
    /* on "So…" it snaps to TIME'S UP, under the ring */
    if (up != null && up >= 0) {
      var us = Math.min(1, pop(up, 0, 3.4)), ux = Math.max(c.x + 80, 268);
      chip(g, 'TIME’S UP', ux, c.y + R + 52, { px: 44, wt: 900, bg: CREAM, fg: BG, a: a * fin(up, 0), s: .8 + .2 * us, rot: -.03, maxw: 360 });
    }
  }

  /* =====================================================================================================
     SCENE 2 · the study: 2024, 1,276 people, a coin toss
     ===================================================================================================== */
  function studyScene(g, t) {
    var s0 = S('study').t0 - SW1;
    /* a slow push across the scene so nothing freezes */
    var pk = 1 + .03 * eio(seg(t, s0, K.stop + .4));
    g.save(); g.translate(CX, 1300); g.scale(pk, pk); g.translate(-CX, -1300);
    /* the time card: 2024, slapped in on its word once the falling edge has shown it */
    var ys = 1 + .1 * (1 - eout(seg(t, K.s2024, K.s2024 + .22))) * (t > K.s2024 ? 1 : 0);
    chip(g, '2024', CX, 580, { px: 128, wt: 900, bg: CREAM, fg: BG, a: 1, s: ys, rot: -.03, st: 'expanded' });
    /* the study card: one line of who and what, one credit */
    var cu = eout(seg(t, K.study - .3, K.study + .2));
    g.save(); g.translate(0, 24 * (1 - cu));
    sheet(g, 110, 680, 910, 930, 81, PAPER, 1.4, 'card');
    ONPROP = true;
    /* the paper's own title is the big read */
    txt(g, '“AS GOOD AS', CX, 742, 78, INK, 'center', 900, DISP, 760, 1, 36, 'expanded');
    txt(g, 'A COIN TOSS”', CX, 824, 78, INK, 'center', 900, DISP, 760, 1, 36, 'expanded');
    g.fillStyle = 'rgba(33,29,38,.4)'; g.fillRect(150, 866, 720, 3);
    txt(g, 'COOKE ET AL., 2024 · 1,276 PEOPLE', CX, 898, 36, INK, 'center', 600, MONO, 760, 1, 36);
    ONPROP = false;
    g.restore();
    /* the coin: rests on the left turning; on "half" it flips across to the right (560 px) and lands in the silence,
       its top never closer than 30 px to the card */
    var toss = seg(t, K.half - .04, K.land), kx = eio(toss), up = Math.sin(Math.PI * toss) * 16;
    var th = 4 * Math.PI * kx + (t < K.half ? .3 * Math.sin(t * 3.4) : 0);
    var settle = t > K.land ? Math.exp(-6 * (t - K.land)) * Math.sin((t - K.land) * 18) * .12 : 0;
    coin(g, lerp(232, 792, kx), 1222 - up, 106, th + settle, 1);
    /* the result, scoped: about half right, on average: the big read */
    var ra = fin(t, K.half - .68), rp = Math.min(1, pop(t, K.half - .68, 3.2));
    txt(g, '≈ 50% RIGHT', CX, 1000 + 18 * (1 - rp), 104, CREAM, 'center', 900, DISP, 780, ra, 60, 'expanded');
    txt(g, 'ON AVERAGE', CX, 1072, 44, CREAM, 'center', 900, DISP, 600, fin(t, K.half - .68));
    var qa = fin(t, K.study - .25);
    quote(g, '“…close to a chance level', CX, 1382, qa, 40);
    quote(g, 'performance of 50%”', CX, 1424, qa, 40);
    g.restore();
  }
  function coin(g, x, y, R, th, a) {
    if (a <= 0) return;
    var sy = Math.cos(th), face = sy >= 0, k = Math.max(Math.abs(sy), .06);
    g.save(); g.globalAlpha *= a; g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.4)'; el(g, 12, 18 + R * .2, R, R * k * .9 + 8);
    /* the rim's thickness shows as the coin turns */
    g.fillStyle = '#9c8a5f'; el(g, 0, 10 * (1 - k) + 6, R, R * k);
    g.fillStyle = face ? '#e6d6ad' : '#d9c79a'; el(g, 0, 0, R, R * k);
    g.strokeStyle = '#b39f6c'; g.lineWidth = 8; g.beginPath(); g.ellipse(0, 0, R - 16, (R - 16) * k, 0, 0, 6.283); g.stroke();
    g.save(); g.scale(1, k * (face ? 1 : -1));
    var oldP = ONPROP; ONPROP = true;
    txt(g, '½', 0, 4, R * 1.02, '#7d6a3e', 'center', 900, DISP);
    ONPROP = oldP;
    g.restore();
    prop(g, 'coin', -R, -R, R + 12, R + 26);
    g.restore();
  }

  /* =====================================================================================================
     SCENE 3 · the source: the loupe stares at pixels, lifts, slides off the picture onto the name; THE stamp
     ===================================================================================================== */
  var HERO = { cx: 350, cy: 890, s: 1, rot: 0 };
  var NAME = { x: 214, y: SCH - STRIP + 94 };
  function sourceO(t) {
    var ct = clipTime(t);
    return { ct: ct, ver: 1, rise: seg(t, K.hero - .05, K.hero + .4), dim: .45 * eio(seg(t, K.who - .1, K.posted + .2)), lo: 0 };
  }
  function sourceScene(g, t) {
    var P = { cx: HERO.cx, cy: HERO.cy + 4 * Math.sin(t * 1.4) * (1 - seg(t, K.heroEnd - .2, GT.slam)), s: 1, rot: 0 };
    var o = sourceO(t);
    phone(g, P, o);
    /* the loupe: on the clip; pixels on "staring … pixels"; lifts on "stop"; slides down onto the name on "Check" */
    var mv = eio(seg(t, K.hero - .02, K.posted + .15));
    var c0 = { x: 268 + 14 * Math.sin(t * 1.7), y: 300 + 10 * Math.cos(t * 1.3) }, c1 = NAME;
    var still = seg(t, K.heroEnd - .25, GT.slam);
    var cx = lerp(c0.x, c1.x, mv) + (1 - still) * mv * 3 * Math.sin(t * 2), cy = lerp(c0.y, c1.y, mv);
    var lift = .15 + .55 * eout(seg(t, K.stopW - .05, K.stopW + .3)) * (1 - eio(seg(t, K.posted, K.first + .1)));
    var lo = seg(t, K.staring, K.pixels + .1) * (1 - seg(t, K.hero - .05, K.hero + .3));
    var p = scr(P, cx, cy), s = 1 + .06 * (lift - .15) / .55 + .14 * mv;
    loupe(g, p.x, p.y, s, lift, function (h) { phone(h, P, Object.assign({}, o, { noShadow: true, lo: lo })); }, handleA(p.x), lerp(MAG, 1.42, mv));
    /* "pixels": the lens's blocks are named */
    var pa = fin(t, K.pixels - .05) * (1 - seg(t, K.hero - .1, K.hero + .1));
    
    /* the check that follows, under the phone: up on "first", settled before the stamp */
    var ta = fin(t, K.who - .05), tp = 1 - eout(seg(t, K.who - .05, K.who + .3));
    txt(g, 'THEN: FIRST UPLOAD · AI LABEL ·', CX, 1344 + 14 * tp, 42, CREAM, 'center', 900, DISP, 830, ta);
    txt(g, 'CONTENT CREDENTIALS', CX, 1398 + 14 * tp, 42, CREAM, 'center', 900, DISP, 830, ta);
    /* THE stamp: beside the name, past the screen's edge and well clear of the loupe, never on the clip */
    var sp0 = scr(P, NAME.x, NAME.y);
    stamp(g, 'WHO POSTED IT?', sp0.x + 310, sp0.y + 84, t, GT.slam, 76, HOT, -.04, .4);
  }

  /* =====================================================================================================
     SCENE 4 · the check: tap the name, the first upload; labels; no label proves nothing; the end card
     ===================================================================================================== */
  var DESK = { cx: 330, cy: 830, s: .85, rot: 0 };
  K.endFlip = 0;   /* set after the end-card timing below */
  function checkPose(t) {
    /* down first, then across, so the phone's top is already below YES / NO when it passes under them */
    var ky = eio(seg(t, K.end - .05, K.yes - .5)), kx = eio(seg(t, K.end + .35, K.yes - .12));
    var P = { cx: lerp(DESK.cx, F0.cx, kx), cy: lerp(DESK.cy, F0.cy, ky), s: lerp(DESK.s, F0.s, ky), rot: lerp(DESK.rot, F0.rot, kx) };
    var g0 = kx, on = 1 - ky;
    P.cy += 4 * Math.sin(t * 1.3) * on;
    return P;
  }
  var ROWS = [['@ ? ? ?', '2 DAYS AGO'], ['@ ? ? ? ?', '5 DAYS AGO'], ['@ ? ?', '9 DAYS AGO']];
  function checkScene(g, t) {
    var P = checkPose(t);
    var flipK = seg(t, K.endFlip - .15, K.endFlip + .15);
    var ct = clipTime(t);
    var o = { ct: ct, ver: 1, flip: flipK > 0 && flipK < 1 ? flipK : 0, rise: 1 - eio(seg(t, K.end + .1, K.endFlip)), dim: 0,
      meta: fin(t, K.creds - .05) * (t < K.rip ? 1 : 0), metaOff: t >= K.rip ? eio(seg(t, K.rip, K.rip + 1.3)) * 1 : 0 };
    if (flipK >= 1) o.ver = 0;
    if (o.metaOff >= 1) o.metaOff = 0, o.meta = 0;
    phone(g, P, o);
    var dr = function (ph) { return 4 * Math.sin(t * 1.6 + ph); };
    var outK = eio(seg(t, K.end - .05, K.end + .35));   /* the right column and the rail leave on "Do" */
    /* tap: a paper fingertip taps the name */
    var fa = eout(seg(t, K.tap + .1, K.name - .08)), fo = eio(seg(t, K.find + .2, K.find + .6));
    if (fa > 0 && fo < 1) {
      var np = scr(P, NAME.x + 10, NAME.y + 18), press = Math.sin(Math.PI * seg(t, K.name - .1, K.name + .16));
      fingertip(g, lerp(np.x + 380, np.x, fa) + 300 * fo, lerp(np.y + 420, np.y, fa) + 300 * fo, 1 - .06 * press);
      var rk = seg(t, K.name, K.name + .45);
      if (rk > 0 && rk < 1) { g.save(); g.globalAlpha *= 1 - rk; g.strokeStyle = CREAM; g.lineWidth = 6; g.beginPath(); g.arc(np.x - 10, np.y - 18, 30 + 70 * rk, 0, 6.283); g.stroke(); g.restore(); }
    }
    /* the uploads list: slides out on "Find", the oldest is the first upload */
    var la = eout(seg(t, K.find - .25, K.find + .2)), lo2 = eio(seg(t, K.labelW - .18, K.labelW + .02));
    if (la > 0 && lo2 < 1) {
      g.save(); g.globalAlpha *= clamp(la * 1.5, 0, 1) * (1 - lo2); g.translate(160 * (1 - la) - 30 * lo2, dr(0));
      sheet(g, 590, 500, 920, 1000, 91, PAPER, 1.4, 'list');
      ONPROP = true;
      ROWS.forEach(function (r, i) {
        var y = 580 + i * 150, ok = i === 2, sl = ok ? eio(seg(t, K.original - .1, K.original + .25)) : 0;
        g.save(); g.translate(-26 * sl, 0);
        if (ok && sl > 0) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(604, y - 58, 312, 128); g.fillStyle = '#fbf6ea'; g.fillRect(598, y - 64, 312, 128); g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(598, y - 64, 312, 128); }
        g.fillStyle = '#8f897f'; el(g, 640, y - 4, 28, 28);
        txt(g, r[0], 684, y - 24, 40, INK, 'left', 900, DISP, 230);
        txt(g, r[1], 684, y + 26, 36, INK, 'left', 600, MONO, 230, 1, 36);
        if (i < 2) { g.fillStyle = 'rgba(33,29,38,.3)'; g.fillRect(612, y + 70, 290, 3); }
        var tk = ok ? eout(seg(t, K.tick4 - .06, K.tick4 + .2)) : 0;
        if (tk > 0) { g.save(); g.strokeStyle = INK; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(866, y - 6); g.lineTo(866 + 14 * Math.min(1, tk * 2), y - 6 + 14 * Math.min(1, tk * 2)); if (tk > .5) g.lineTo(880 + 26 * (tk - .5) * 2, y + 8 - 40 * (tk - .5) * 2); g.stroke(); g.restore(); }
        g.restore();
      });
      ONPROP = false;
      g.restore();
      /* the first upload, named beside it */
     }
    /* the first upload, named under the list; it stays until the labels are pulled off */
    /* it lays in only once the torn edge is past the coral stamp, and peels off as soon as it has been read */
    var fu0 = K.tearA + 1.31, fuO = seg(t, K.T_FU, K.T_FU + .16), fu = fin(t, fu0) * (1 - fuO);
    if (fu > 0) { g.save(); g.translate(0, -40 * eio(fuO)); chip(g, 'FIRST UPLOAD', 755, 1068 + dr(1), { px: 44, wt: 900, bg: CREAM, fg: BG, a: fu, s: .9 + .1 * Math.min(1, pop(t, fu0, 3.2)), maxw: 340, rot: -.08 * fuO }); g.restore(); }
    /* the rail: the tip lays in once the edge is past the old rail and the loupe's rim; the credit covers the search
       only; the still-frame hint is ours, on its own tag; then NIST takes the same rows */
    var tip0 = K.tearA + 1.45, tipO = seg(t, K.T_NIST - .06, K.T_NIST), ta = fin(t, tip0) * (1 - tipO);
    txt(g, 'REVERSE IMAGE SEARCH', CX, 1228, 48, CREAM, 'center', 900, DISP, 830, ta);
    credit(g, 'NORTHWESTERN, 2024', CX, 1276, ta);
    tag(g, 'TRY A STILL FROM IT', CX, 1340, fin(t, tip0 + .16) * (1 - tipO), .01, 820);
    /* labels: two generic chips beside the phone; pulled off on "No" */
    /* pulled off on "No": a short lift and a quick fade, never off the rail */
    var pull = eio(seg(t, K.no + .3, K.no + .5));
    var l1 = eout(seg(t, K.labelW - .05, K.labelW + .25)), l2 = eout(seg(t, K.labelW - .05, K.labelW + .25));
    if (l1 > 0 && pull < 1) {
      g.save(); g.globalAlpha *= 1 - pull; g.translate(755 - 20 * pull, 630 - 70 * pull + 60 * (1 - l1) + dr(2)); g.rotate(.06 * pull); g.translate(-755, -630);
      chip(g, 'AI LABEL', 755, 590, { px: 60, wt: 900, bg: CREAM, fg: BG, a: l1, maxw: 330, st: 'expanded' });
      tag(g, 'DRAWN BY US', 755, 520, l1, .01, 330);
      g.restore();
    }
    if (l2 > 0 && pull < 1) {
      g.save(); g.globalAlpha *= 1 - pull; g.translate(755 - 20 * pull, 890 - 70 * pull + 60 * (1 - l2) + dr(3)); g.rotate(-.05 * pull); g.translate(-755, -890);
      chip(g, 'CR', 755, 818, { px: 60, wt: 900, bg: CREAM, fg: BG, a: l2, maxw: 330, st: 'expanded' });
      txt(g, 'CONTENT', 755, 926, 42, CREAM, 'center', 900, DISP, 320, l2);
      txt(g, 'CREDENTIALS', 755, 974, 42, CREAM, 'center', 900, DISP, 320, l2);
      g.restore();
    }
    /* everything about labels clears just before YES / NO, so nothing hints at an answer */
    var clr = seg(t, K.end, K.end + .09);
    var ca = fin(t, K.labelW - .1) * (1 - clr);
    credit(g, 'YOUTUBE HELP · TIKTOK, MAY 2024 · C2PA', CX, 1398, ca);
    /* no label proves nothing */
    var nb = fin(t, K.no + .3) * (1 - clr), nc = fin(t, K.that - .55) * (1 - clr), np2 = Math.min(1, pop(t, K.that - .55, 3.2));
    if (nb > 0) {
      g.save(); g.translate(755, 790 + dr(4));
      txt(g, 'NO LABEL', 0, -40, 66, CREAM, 'center', 900, DISP, 330, nb, 36, 'condensed');
      g.save(); g.scale(.9 + .1 * np2, .9 + .1 * np2); txt(g, '≠ PROOF', 0, 36, 66, CREAM, 'center', 900, DISP, 330, nc, 36, 'condensed'); g.restore();
      g.restore();
    }
    var qa = fin(t, K.T_NIST) * (1 - seg(t, K.end + .12, K.end + .2));
    quote(g, '“…stripped altogether,', CX, 1232, qa);
    quote(g, 'as it often is when files', CX, 1282, qa);
    quote(g, 'are shared…” · NIST AI 100-4', CX, 1332, qa);
    /* the end card: YES / NO, the same size, coral, nudging on their words; neither picked */
    var yk = function (w) { return 1 + .06 * Math.sin(Math.PI * seg(t, w - .06, w + .3)); };
    var ya = fin(t, K.end + .1) * (1 - seg(t, K.noEnd + .06, K.noEnd + .2)), yp = Math.min(1, pop(t, K.end + .1, 3));
    [['YES', 712, K.yes], ['NO', 852, K.noE]].forEach(function (c) {
      chip(g, c[0], c[1], 556 + 30 * (1 - yp), { px: 62, wt: 900, line: HOT, lw: 5, fg: HOT, w: 128, r: 38, shadow: false, a: ya, s: yk(c[2]) });
    });
    /* the last frame is frame 0: the full ring and REAL OR AI? come back after "no" */
    var back = seg(t, K.noEnd + .13, K.noEnd + .25);
    if (back > 0) {
      ringTimer(g, P, back, 1);
      if (!POSTERMODE && LIVE.text) headline(g, 0, back);
    }
  }
  function fingertip(g, x, y, s) {
    g.save(); g.translate(x, y); g.rotate(-.62); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -26, 10, 64, 330, 32); g.fill();
    g.fillStyle = '#d9a27a'; rr(g, -34, 0, 68, 330, 34); g.fill();
    g.fillStyle = '#ecc7a6'; rr(g, -20, 10, 40, 46, 16); g.fill();
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-24, 120, 48, 4); g.fillRect(-24, 210, 48, 4);
    prop(g, 'finger', -34, 0, 38, 340);
    g.restore();
  }
  /* ---------- captions: the narrator's words, one block at a time; stressed words get a cream pill (never coral) ---------- */
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'ask') return;   /* REAL OR AI? and the search phrase carry these two lines */
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        cur.push(w);
        var brk = i < ws.length - 1 && l.id !== 'end' && l.id !== 'hero' && l.id !== 'tap' && (/[.?!:]$/.test(w.w) || (l.id === 'coin' && /,$/.test(w.w)));
        if (brk) { out.push({ id: l.id, ws: cur }); cur = []; }
      });
      if (cur.length) out.push({ id: l.id, ws: cur });
    });
    var first = {};
    return out.map(function (c) {
      var ws = c.ws, s = ws[0].t0, isFirst = !first[c.id]; first[c.id] = 1;
      if (isFirst && c.id === 'tap') s = Math.max(s, K.capA);   /* the caption swaps once the torn edge is past the stamp */
      return { id: c.id, t0: ws[0].t0, s: s, t1: ws[ws.length - 1].t1, words: ws };
    });
  })();
  var STRESS = [['hunt', 'glitches'], ['tells', 'fingers'], ['tells', 'signs'], ['tells', 'shadows'], ['fading', 'harder'], ['coin', 'half'], ['stop', 'pixels'], ['hero', 'first'], ['tap', 'original'], ['label', 'label'], ['missing', 'nothing']]
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
  var NOISE, SCENES = { feed: feedScene, study: studyScene, source: sourceScene, check: checkScene };
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
    /* the hero's exit: the edge drops fast through the top third, then evenly past the stamp */
    if (Nx && Nx.two) { var tau = te - (Nx.t0 - Nx.sw); sk = tau <= 0 ? 0 : tau < .12 ? .35 * tau / .12 : Math.min(1, .35 + .65 * (tau - .12) / (Nx.sw - .12)); }
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
    else if (LIVE.text) {
      var back = seg(t, K.noEnd + .04, K.noEnd + .18);
      captions(g, t, 1 - back);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    /* inside x 90–930 and clear of the phone's top (y 480) */
    var a = 'Real or AI?', b = 'Check who posted it', px = 72;
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
    var G = [['slam', 'thump', .26], ['ping', 'knock', .8], ['tick1', 'tick', 1], ['tick2', 'tick', 1], ['tick3', 'tick', 1], ['tap', 'pop', 1], ['rip', 'paper', .9],
      ['play', 'click', .45], ['made', 'slap', .7], ['tear1', 'tear', 1.0], ['tear2', 'tear', 1.0], ['tick4', 'tick', .9]];
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
      var o = osc('sine', 250, t, t + .16, 1, [[t, 0], [t + .004, .75 * g], [t + .15, 0]], .05); o.frequency.exponentialRampToValueAtTime(180, t + .14);
      osc('triangle', 330, t, t + .08, 1, [[t, 0], [t + .002, .55 * g], [t + .07, 0]], .03);
      band(t, .07, 1600, .9, 7.0 * g, .002, .05);
      band(t, .045, 2500, 1.1, 4.7 * g, .001, .03);
      /* the paper slap layer, 1–3 kHz, so the thump reads on a phone speaker */
      band(t + .001, .06, 1800, .55, 4.2 * g, .001, .04);
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
    /* a flat paper slap (the cream stamp) */
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); }
    EV.forEach(function (e) {
      if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'tear') tearS(e.t, e.g);
      else if (e.type === 'click') { band(e.t, .025, 3200, 1.8, 5 * e.g, .001, .02); band(e.t + .002, .04, 1500, 2.2, .8 * e.g, .001, .02); }
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'knock') ping(e.t, e.g);
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
      CLIPBG = [paintClipBg(0), paintClipBg(1)];
      BODY_C = paintBody();
      LO = mk(Math.round(CW / 13), Math.round(CH / 13));
      window.READY = true;
    });
  }
  /* the end card: the phone glides back to frame 0's place; the clip flips back to frame 0's version mid-glide */
  K.endFlip = lerp(K.end, K.yes, .5);
  buildPath();
  initTimes();
  /* the hero hold: from the stamp settling to the torn edge, fully still */
  var HOLD = { t0: GT.slam + .12, t1: K.tearA };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'detect', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
