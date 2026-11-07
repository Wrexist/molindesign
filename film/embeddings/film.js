/* "How Spotify knows your taste" — Factory #24 on Tech, explained (How tech works), after ../whatif-password/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   One hand-made hero prop: an 800 px cork-backed paper map with paper record pins and cream string. The native move is
   the string pull: a playlist string tightens and drags its pins together. Every map frame carries OUR DRAWING,
   SIMPLIFIED on its cork rail. Listeners never sit on the song map: they sit on a see-through LISTENERS sheet laid over
   it, and a listener is never drawn as 80 numbers (the 80 are Spotify Research's track embeddings, Sep 2025).
   One hero stamp: SAME PLAYLISTS (coral) in the written silence after "land close"; coral is also on the end card's
   YES / NO and nowhere else. No Spotify logo, green or app UI: a generic paper playlist card with squiggle rows.
   Every scene is clipped to the safe box x 90–930, y 300–1430. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', INK = '#211d26', TAGP = '#efe2c4', CORK = '#9a7652', MAPP = '#eee4cc';
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
  function start(id) { return LINE[id].words[0].t0; }
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
  var K = {
    hook: start('hook'), skip: at('hook', 'skip'), feeds: at('hook', 'feeds'), hookEnd: lend('hook'),
    ask: start('ask'), askEnd: lend('ask'),
    song: start('song'), songW: at('song', 'song'), into: at('song', 'into'), n80: at('song', '80'), songEnd: lend('song'),
    map: start('map'), dot: at('map', 'dot'), mapW: at('map', 'map'), mapEnd: lend('map'),
    near: start('near'), same: at('near', 'same'), land: at('near', 'land'), nearEnd: lend('near'),
    sound: start('sound'), soundW: at('sound', 'sound'), alike: at('sound', 'alike'), soundEnd: lend('sound'),
    you: start('you'), dotY: at('you', 'dot'), listening: at('you', 'listening'), youEnd: lend('you'),
    picks: start('picks'), lis: at('picks', 'listeners'), love: at('picks', 'love'), picksEnd: lend('picks'),
    dip: start('dip'), kids: at('dip', 'kids'), minutes: at('dip', 'minutes'), dipEnd: lend('dip'),
    fix: start('fix'), exclude: at('fix', 'exclude'), fixEnd: lend('fix'),
    end: start('end'), yes: at('end', 'yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  (function () {
    place('tear', 'paper', voiceEnd('hook', K.ask) + .06, .19, K.hookEnd, K.ask);
    place('ratchet', 'rattle', voiceEnd('song', K.map) + .05, .19, K.songEnd, K.map);
    place('slam', 'thump', voiceEnd('near', K.sound) + .03, .19, K.nearEnd, K.sound - .9);
    place('fifth', 'pop', voiceEnd('picks', K.dip) + .03, .17, K.picksEnd, K.dip);
    place('yank', 'knock', voiceEnd('dip', K.fix) + .05, .19, K.dipEnd, K.fix);
    place('excl', 'slap', voiceEnd('fix', K.end) + .05, .19, K.fixEnd, K.end);
    place('snap', 'click', voiceEnd('sound', K.you) + .05, .19, K.soundEnd, K.you);
    place('tick', 'click', wend('end', 'mix') + .16, .15, wend('end', 'mix'), K.yes);
  })();
  /* the beats: every state label lands on the same frame as its state */
  K.TEAR = GT.tear != null ? GT.tear : K.hookEnd + .15;     /* the ? row tears off and drops into the tray */
  K.HS = Math.min(1.9, K.ask - .75);                                         /* frame 0's headline → the search phrase */
  K.RAT = GT.ratchet != null ? GT.ratchet : K.songEnd + .12;  /* the tape ratchets to 80 cells + 80 NUMBERS PER SONG */
  K.SLAM = GT.slam != null ? GT.slam : K.nearEnd + .2;        /* SAME PLAYLISTS (coral) + the thump */
  K.PEEL = K.sound - .3;                                       /* the coral stamp peels in the silence, before the caption changes */
  K.W1 = K.PEEL;                                               /* the hold ends as the peel starts */
  K.FIFTH = GT.fifth != null ? GT.fifth : K.love;             /* the neighbour's 5th artist lands in YOUR slot */
  K.YANK = GT.yank != null ? GT.yank : K.dipEnd + .15;        /* the kids' string yanks YOU */
  K.EXCL = at('fix', 'exclude') - .02;                        /* EXCLUDED + the kids' pins lift, on "Exclude" (silent, mid-line) */
  K.SNAP = GT.snap != null ? GT.snap : K.soundEnd + .2;     /* the waveform clip snaps shut (click) */
  K.TICK = GT.tick;                                            /* a paper tick before "Yes" (only if the gap allows) */
  K.CUT = GT.excl != null ? GT.excl : K.fixEnd + .15;         /* in the gap: the kids' string is cut and YOU eases back part way (slap) */
  K.PUSH = K.end + .45;                                         /* the map leaves; frame 0's card comes back */
  K.RES = at('song', 'research');
  K.TEND = Math.round(DUR * 30) / 30;

  var SC = [{ id: 'all', fn: 'film', name: 'Why this song?', t0: 0 }];
  var SHOTS = [
    { id: 'hook', name: 'Why this song?', t0: 0 },
    { id: 'song', name: '80 numbers', t0: K.song - .1 },
    { id: 'map', name: 'A dot on a map', t0: K.map - .1 },
    { id: 'near', name: 'Same playlists', t0: K.near - .1 },
    { id: 'you', name: 'You are a dot too', t0: K.you - .1 },
    { id: 'dip', name: 'Your kids’ songs', t0: K.dip - .1 },
    { id: 'fix', name: 'Exclude them', t0: K.fix - .1 },
    { id: 'end', name: 'Yes or no', t0: K.end - .1 }
  ];
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
    if (!BOUNDS || INCOMING || EXITING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    if (b[2] < SAFE_BOX.x0 || b[0] > SAFE_BOX.x1 || b[1] > SAFE_BOX.y1 || b[3] < SAFE_BOX.y0) return;   /* fully outside the scene clip: never drawn */
    if (b[0] < SAFE.x0 - .5 || b[2] > SAFE.x1 + .5 || b[3] > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(b[0]), x1: Math.round(b[2]), y1: Math.round(b[3]) });
  }
  function recBox(g, x0, y0, x1, y1, text) { if (BOUNDS) recBound(g, xbox(g, x0, y0, x1, y1), text); }
  function prop(g, name, x0, y0, x1, y1) {
    if (!PROPS || INCOMING || (g !== ctx && g !== tctx)) return;
    var b = xbox(g, x0, y0, x1, y1); if (b[1] < COVTOP) return; PROPS.push({ name: name, b: b });
  }
  function seen(g, text, b) {
    /* readable = fully inside the safe box, opaque and not sliding (a strip half off the frame is not being read) */
    var vis = !NOREC && !EXITING && g.globalAlpha >= .95 && (g === ctx || g === tctx) && b[1] >= SAFE_BOX.y0 - 2 && b[3] <= SAFE_BOX.y1 + 2 && b[0] >= SAFE_BOX.x0 - 2 && b[2] <= SAFE_BOX.x1 + 2;
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
  /* quiet tags (EXAMPLE, OUR DRAWING): cream outline, never coral */
  function tag(g, text, x, y, a, rot, maxw, col, bg, px) { chip(g, text, x, y, { px: px || 40, wt: 700, fam: MONO, line: col || CREAM, lw: 3, fg: col || CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: bg || 'rgba(21,19,27,.9)', maxw: maxw || 820 }); }
  function onprop(fn) { var o = ONPROP; ONPROP = true; fn(); ONPROP = o; }
  function norec(fn) { var o = NOREC; NOREC = true; fn(); NOREC = o; }
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
  /* full opacity from its first frame (its state changes on the same frame); only the size settles */
  function stamp(g, text, x, y, t, t0, px, col, rot, speck) {
    if (t < t0) return;
    var c = stampTex(text, col, px, speck);
    var k = eout(seg(t, t0, t0 + .1)), s = lerp(1.3, 1, k);
    g.save(); g.translate(x, y); g.rotate(rot == null ? -.05 : rot); g.scale(s, s);
    var oldP = ONPROP; ONPROP = true;
    if (k >= 1) recBox(g, -c.w / 2, -c.h / 2, c.w / 2, c.h / 2, text.replace(/\n/g, ' '));
    c.lines.forEach(function (s2, i) { var ly = (i - (c.lines.length - 1) / 2) * c.px * 1.02; seen(g, s2, xbox(g, -c.w / 2, ly - c.px * .55, c.w / 2, ly + c.px * .55)); });
    g.drawImage(c, -c.w / 2, -c.h / 2); ONPROP = oldP; g.restore();
    return c;
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
  function paper(g, x0, y0, w, h, seed, col, name, amp) {
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 8, y0 + 11, w, h, 12); g.fill();
    g.fillStyle = col || PAPER; cut(g, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], mulberry(seed), amp == null ? 1.3 : amp);
    g.beginPath(); g.rect(x0, y0, w, h); grainIn(g, x0, y0, w, h, seed + 1, .9);
    prop(g, name || 'paper', x0, y0, x0 + w + 8, y0 + h + 11);
  }
  /* a hand-written line (no letters: frame 0 carries no extra words) */
  function squiggle(g, x0, x1, y, lw, seed, col) {
    var r = mulberry(seed); g.save(); g.strokeStyle = col || 'rgba(33,29,38,.75)'; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x0, y);
    for (var x = x0; x < x1; x += 14) { var k = r(); g.quadraticCurveTo(x + 7, y + (k - .5) * lw * 2.6, Math.min(x1, x + 14), y + (r() - .5) * lw * .8); }
    g.stroke(); g.restore();
  }
  /* a paper record: dark disc, grooves, coloured label */
  function disc(g, x, y, r, col, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, r * .1, r * .14, r, r);
    g.fillStyle = '#29242f'; el(g, 0, 0, r, r);
    g.strokeStyle = 'rgba(244,237,224,.16)'; g.lineWidth = Math.max(1, r * .03);
    for (var k = .55; k < .95; k += .12) { g.beginPath(); g.arc(0, 0, r * k, 0, 6.283); g.stroke(); }
    g.fillStyle = col; el(g, 0, 0, r * .4, r * .4);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-r * .25, -r * .05, r * .5, Math.max(1.5, r * .05));
    g.fillStyle = '#29242f'; el(g, 0, 0, r * .07, r * .07);
    g.restore();
  }
  /* the skip tab: a little paper tab with two triangles and a bar */
  function skipTab(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -36, -28, 78, 62, 12); g.fill();
    g.fillStyle = TAGP; rr(g, -40, -32, 78, 62, 12); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 2; rr(g, -40, -32, 78, 62, 12); g.stroke();
    g.fillStyle = INK; poly(g, [[-22, -14], [-4, -1], [-22, 12]]); g.fill(); poly(g, [[-6, -14], [12, -1], [-6, 12]]); g.fill(); g.fillRect(14, -14, 6, 26);
    g.restore();
  }
  var PCOL = ['#d9b44a', '#7f9cc0', '#b9774f', '#a58bc0', '#e0cfa6', '#7d8fa3', '#c99a6a', '#9bb0c9'];

  /* ---------- the playlist card: 760 × 630 paper, a header and 4 squiggle rows; the top row is the "?" ---------- */
  var CARD = { x0: 130, y0: 520, w: 760, h: 630 }, ROWH = 128, ROW0 = 620;
  function rowBody(g, i, x0, y, o) {
    o = o || {};
    if (i === 0) {
      g.fillStyle = 'rgba(217,180,74,.28)'; rr(g, x0 + 14, y + 6, CARD.w - 28, ROWH - 12, 14); g.fill();
      onprop(function () { txt(g, '?', x0 + 75, y + 66, 100, INK, 'center', 900, DISP); });
    } else if (!o.noDisc) disc(g, x0 + 75, y + 64, 42, PCOL[i], .3 * i);
    squiggle(g, x0 + 140, x0 + 470 + 50 * Math.sin(i * 2.1), y + 48, 9, 40 + i * 7);
    squiggle(g, x0 + 140, x0 + 360 + 40 * Math.cos(i * 1.3), y + 86, 6, 60 + i * 5, 'rgba(33,29,38,.45)');
    skipTab(g, x0 + 680, y + 64, 1, (o.tab || 0));
    if (i > 0) { g.fillStyle = 'rgba(33,29,38,.12)'; g.fillRect(x0 + 20, y - 1, CARD.w - 40, 3); }
  }
  /* o: { dx, dy, row0 {dx, dy, rot, tab, gone}, shift (0..1 rows 1-3 move up one row), riffle(i) → dy, example, lift (row 1 disc gone) } */
  function playlistCard(g, t, o) {
    var x0 = CARD.x0 + (o.dx || 0), y0 = CARD.y0 + (o.dy || 0);
    paper(g, x0, y0, CARD.w, CARD.h, 11, PAPER, 'card');
    /* the header: a record doodle and a squiggle title (the playlist's name is never written) */
    disc(g, x0 + 62, y0 + 50, 30, '#7f9cc0');
    squiggle(g, x0 + 112, x0 + 420, y0 + 40, 11, 7); squiggle(g, x0 + 112, x0 + 300, y0 + 70, 6, 9, 'rgba(33,29,38,.4)');
    g.fillStyle = 'rgba(33,29,38,.3)'; g.fillRect(x0 + 20, y0 + 96, CARD.w - 40, 3);
    if (o.example > 0) onprop(function () { tag(g, 'EXAMPLE', x0 + 620, y0 + 50, o.example, .02, 260, INK, TAGP, 38); });
    for (var i = 1; i < 4; i++) {
      var ry = y0 + (ROW0 - CARD.y0) + i * ROWH - (o.shift || 0) * ROWH + (o.riffle ? o.riffle(i) : 0);
      g.save(); rowBody(g, i, x0, ry, { noDisc: i === 1 && o.lift }); g.restore();
    }
    var r0 = o.row0 || {};
    if (!r0.gone) {
      g.save(); var ry0 = y0 + (ROW0 - CARD.y0) + (r0.dy || 0);
      g.translate(x0 + CARD.w / 2 + (r0.dx || 0), ry0 + ROWH / 2); g.rotate(r0.rot || 0); g.translate(-(x0 + CARD.w / 2), -(ry0 + ROWH / 2));
      if (r0.dx || r0.rot) { g.fillStyle = PAPER; rr(g, x0 + 6, ry0, CARD.w - 12, ROWH, 6); g.fill(); }
      rowBody(g, 0, x0, ry0, { tab: r0.tab }); g.restore();
    }
    return { x0: x0, y0: y0 };
  }
  /* the torn ? row on its own (falling into the tray) */
  function looseRow(g, x, y, rot, s) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.translate(-CARD.w / 2, -ROWH / 2);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 8, 10, CARD.w - 12, ROWH, 8); g.fill();
    g.fillStyle = PAPER; cut(g, [[6, 0], [CARD.w - 6, 0], [CARD.w - 2, ROWH * .5], [CARD.w - 6, ROWH], [6, ROWH], [10, ROWH * .5]], mulberry(91), 4);
    rowBody(g, 0, 0, 0, {});
    g.restore();
  }
  /* the TASTE PROFILE tray: a paper box the skipped row drops into */
  var TRAY = { x0: 250, y0: 1286, w: 520, h: 132 };
  function trayBack(g, dy) { g.fillStyle = '#6b5136'; rr(g, TRAY.x0 + 10, TRAY.y0 - 26 + dy, TRAY.w - 20, 40, 8); g.fill(); }
  function trayFront(g, dy, a, s) {
    var x0 = TRAY.x0, y0 = TRAY.y0 + dy;
    g.save(); g.translate(x0 + TRAY.w / 2, y0 + TRAY.h / 2); g.scale(s || 1, s || 1); g.translate(-(x0 + TRAY.w / 2), -(y0 + TRAY.h / 2));
    paper(g, x0, y0, TRAY.w, TRAY.h, 23, '#c9a978', 'tray');
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x0, y0, TRAY.w, 10);
    onprop(function () { txt(g, 'EVERY SKIP →', x0 + TRAY.w / 2, y0 + 40, 50, INK, 'center', 900, DISP, TRAY.w - 40, a, 44, 'condensed'); txt(g, 'TASTE PROFILE', x0 + TRAY.w / 2, y0 + 94, 50, INK, 'center', 900, DISP, TRAY.w - 40, a, 44, 'condensed'); });
    g.restore();
  }

  /* ---------- quote strips: plain paper, the source's words in quotes, the credit under them ---------- */
  var SHELF = { x0: 110, y0: 1184, w: 800, h: 236 };
  function qstrip(g, L, credit, dx, o) {
    o = o || {}; var SW = o.w || SHELF.w, x0 = SHELF.x0 + dx, y0 = o.y0 || SHELF.y0, h = o.h || SHELF.h, px = o.px || 46, gap = o.gap || px * 1.14;
    g.save(); if (o.rot) { g.translate(x0 + SW / 2, y0 + h / 2); g.rotate(o.rot); g.translate(-(x0 + SW / 2), -(y0 + h / 2)); }
    paper(g, x0, y0, SW, h, o.seed || 51, o.col || PAPER, 'strip');
    /* two strips of tape */
    g.fillStyle = 'rgba(244,237,224,.55)'; g.save(); g.translate(x0 + 40, y0 + 8); g.rotate(-.5); g.fillRect(-34, -11, 68, 22); g.restore();
    g.save(); g.translate(x0 + SW - 40, y0 + 8); g.rotate(.5); g.fillRect(-34, -11, 68, 22); g.restore();
    var cxs = o.cx != null ? x0 + o.cx : x0 + SW / 2, n = L.length + (credit ? 1 : 0), cy = y0 + h / 2, tot = (L.length - 1) * gap + (credit ? gap * .5 + 44 : 0), y = cy - tot / 2;
    onprop(function () {
      L.forEach(function (s, i) { var p = (o.big && i === 0) ? o.big : px; txt(g, s, cxs, y + i * gap - (o.big && i === 0 ? 4 : 0), p, INK, 'center', 800, DISP, o.maxw || 740, 1, 40, 'condensed'); });
      if (credit) txt(g, credit, cxs, y + (L.length - 1) * gap + gap * .5 + 30, o.cpx || 38, INK, 'center', 700, DISP, o.maxw || 740, 1, 36, 'condensed');
    });
    g.restore();
  }

  /* ---------- the number tape: a paper receipt of 8 × 10 cells, printed from a slot in the lower band ---------- */
  var TAPE = { x0: 150, w: 720, slot: 1416, rowh: 60, top: 26 };
  var TV = (function () { var r = mulberry(80), v = []; for (var i = 0; i < 80; i++) { var x = (r() * 2 - 1) * .9; v.push((x < 0 ? '−' : '') + Math.abs(x).toFixed(2).replace(/^0/, '')); } return v; })();
  function tape(g, rows, a) {
    if (rows <= 0) return;
    var h = TAPE.top + rows * TAPE.rowh, y0 = TAPE.slot - h;
    g.save(); g.globalAlpha *= a == null ? 1 : a;
    g.beginPath(); g.rect(0, 0, W, TAPE.slot); g.clip();
    paper(g, TAPE.x0, y0, TAPE.w, h + 4, 81, '#f6f0e3', 'tape');
    /* the printed rows: the oldest at the top, the newest at the slot */
    var full = Math.floor(rows);
    norec(function () {
      for (var rI = 0; rI < full; rI++) {
        var ry = y0 + TAPE.top + rI * TAPE.rowh + TAPE.rowh / 2;
        for (var c = 0; c < 10; c++) {
          var cx = TAPE.x0 + 36 + c * 72;
          g.strokeStyle = 'rgba(33,29,38,.22)'; g.lineWidth = 2; rr(g, cx - 33, ry - 24, 66, 48, 6); g.stroke();
          var tv = parseFloat(TV[rI * 10 + c].replace('−', '-')); g.fillStyle = INK; for (var q = 0; q < 5; q++) { var hh = 6 + 22 * Math.abs(Math.sin(tv * 9 + q * 1.7)); g.fillRect(cx - 22 + q * 10, ry - hh / 2, 5, hh); }   /* unreadable ticks: our drawing, not real values */
        }
      }
    });
    g.restore();
    /* the slot */
    g.fillStyle = '#0d0b10'; rr(g, TAPE.x0 - 20, TAPE.slot - 4, TAPE.w + 40, 14, 6); g.fill();
    g.fillStyle = 'rgba(244,237,224,.35)'; g.fillRect(TAPE.x0 - 20, TAPE.slot - 5, TAPE.w + 40, 2);
  }

  /* ---------- the cork map: the hero prop, 800 × 670, x 110–910, y 495–1165 ---------- */
  var MAP = { x0: 110, y0: 495, w: 800, h: 670, px0: 130, py0: 548, px1: 890, py1: 1108 };
  function corkMap(g, t, ox, oy, o) {
    o = o || {};
    var x0 = MAP.x0 + ox, y0 = MAP.y0 + oy;
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, x0 + 10, y0 + 14, MAP.w, MAP.h, 16); g.fill();
    g.fillStyle = CORK; rr(g, x0, y0, MAP.w, MAP.h, 16); g.fill();
    rr(g, x0, y0, MAP.w, MAP.h, 16); grainIn(g, x0, y0, MAP.w, MAP.h, 301, 2.2);
    prop(g, 'map', x0, y0, x0 + MAP.w + 10, y0 + MAP.h + 14);
    /* the paper map pinned on the cork */
    var px0 = MAP.px0 + ox, py0 = MAP.py0 + oy, pw = MAP.px1 - MAP.px0, ph = MAP.py1 - MAP.py0;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(px0 + 5, py0 + 7, pw, ph);
    g.fillStyle = MAPP; cut(g, [[px0, py0], [px0 + pw, py0], [px0 + pw, py0 + ph], [px0, py0 + ph]], mulberry(302), 1.4);
    g.beginPath(); g.rect(px0, py0, pw, ph); grainIn(g, px0, py0, pw, ph, 303, .7);
    /* faint hand-drawn contours: a map, not a chart (no axes, no names) */
    g.save(); g.beginPath(); g.rect(px0, py0, pw, ph); g.clip(); g.strokeStyle = 'rgba(120,96,64,.22)'; g.lineWidth = 3;
    [[260, 700, 150, 90], [700, 900, 190, 120], [420, 980, 120, 60], [760, 620, 100, 70]].forEach(function (c, i) {
      for (var k = 0; k < 3; k++) { g.beginPath(); g.ellipse(c[0] + ox, c[1] + oy, c[2] * (1 - k * .28), c[3] * (1 - k * .28), .3 * i, 0, 6.283); g.stroke(); }
    });
    g.restore();
    /* the cork rail: top OUR DRAWING, SIMPLIFIED (every map frame); bottom the song-map scope until the listeners come */
    norec(function () { g.fillStyle = 'rgba(21,19,27,.55)'; rr(g, x0 + 20, y0 + 8, 520, 42, 10); g.fill(); });
    txt(g, 'OUR DRAWING, SIMPLIFIED', x0 + 280, y0 + 29, 38, CREAM, 'center', 700, MONO, 500, 1, 36);
    if (o.scope > 0) {
      g.save(); g.globalAlpha *= o.scope; g.fillStyle = 'rgba(21,19,27,.55)'; rr(g, x0 + 20, y0 + MAP.h - 52, 760, 44, 10); g.fill(); g.restore();
      txt(g, 'SONG MAP: 80 NUMBERS SQUASHED TO 2', x0 + 400, y0 + MAP.h - 30, 40, CREAM, 'center', 800, DISP, 740, o.scope, 36, 'condensed');
    }
    /* thumb tacks in the paper's corners */
    [[px0 + 14, py0 + 14], [px0 + pw - 14, py0 + 14], [px0 + 14, py0 + ph - 14], [px0 + pw - 14, py0 + ph - 14]].forEach(function (p) { g.fillStyle = '#5a4a3a'; el(g, p[0] + 2, p[1] + 3, 9, 9); g.fillStyle = '#d8c9a8'; el(g, p[0], p[1], 9, 9); });
  }
  /* a song pin: a small paper record with a pin shadow */
  function songPin(g, x, y, col, s, lift) {
    s = s == null ? 1 : s; if (s <= 0) return;
    var r = 25 * s, l = lift || 0;
    g.fillStyle = 'rgba(0,0,0,' + (.32 - .15 * l) + ')'; el(g, x + 5 + 14 * l, y + 7 + 22 * l, r, r * .9);
    disc(g, x, y - 18 * l, r, col, .4);
    g.fillStyle = '#e6d9bd'; el(g, x, y - 18 * l, 4.5 * s, 4.5 * s);
  }
  /* a push pin for a listener: round head, a needle shadow */
  function pushPin(g, x, y, r, head, drop) {
    var d = drop || 0;
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, x + 10 + 30 * d, y + 14 + 40 * d, r * .95, r * .8);
    g.strokeStyle = 'rgba(33,29,38,.6)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y - 120 * d); g.lineTo(x + 6, y + 10 - 120 * d); g.stroke();
    g.fillStyle = head; el(g, x, y - 120 * d, r, r);
    g.fillStyle = 'rgba(255,255,255,.35)'; el(g, x - r * .3, y - r * .35 - 120 * d, r * .3, r * .22);
    g.strokeStyle = 'rgba(33,29,38,.45)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y - 120 * d, r, 0, 6.283); g.stroke();
  }
  /* cream string through points: slack sags, tight is straight; prog draws it on */
  function string(g, P, slack, prog, col, lw) {
    if (prog <= 0) return;
    g.save(); g.strokeStyle = col || '#f3ead6'; g.lineWidth = lw || 5; g.lineCap = 'round'; g.lineJoin = 'round';
    var segs = P.length - 1, upto = prog * segs;
    g.beginPath(); g.moveTo(P[0][0], P[0][1]);
    for (var i = 0; i < segs && i < upto; i++) {
      var a = P[i], b = P[i + 1], f = Math.min(1, upto - i), ex = lerp(a[0], b[0], f), ey = lerp(a[1], b[1], f);
      var mx = (a[0] + ex) / 2, my = (a[1] + ey) / 2 + slack * Math.hypot(ex - a[0], ey - a[1]) * .22;
      g.quadraticCurveTo(mx, my, ex, ey);
    }
    g.stroke(); g.restore();
  }

  /* the map's pins (song pins; x/y on the paper, tx/ty where a pull takes them) */
  var PINS = [
    { x: 165, y: 590, tx: 370, ty: 745, c: 0 },   /* A · road trip: from the top-left corner (257 px) */
    { x: 180, y: 1055, tx: 395, ty: 840, c: 1 },  /* B · road trip: from the bottom-left corner (304 px) */
    { x: 850, y: 1060, tx: 450, ty: 780, c: 2 },  /* C · road trip: from the bottom-right corner (489 px) */
    { x: 600, y: 1000, tx: 676, ty: 968, c: 3 },  /* D · sounds alike */
    { x: 850, y: 878, tx: 746, ty: 958, c: 6 },   /* E · sounds alike */
    { x: 170, y: 780, c: 5 }, { x: 420, y: 590, c: 1 }, { x: 700, y: 800, c: 3 }, { x: 395, y: 1046, c: 7 }
  ];
  var DROP = { x: 660, y: 860 };              /* where the lifted record lands as a pin (on "map") */
  var YOU = { x: 450, y: 836 }, YOU2 = { x: 720, y: 850 }, YOU3 = { x: 600, y: 845 };
  var NB = [{ x: 318, y: 776 }, { x: 590, y: 760 }, { x: 240, y: 680 }, { x: 660, y: 690 }];
  var KID = [{ x: 812, y: 776, c: '#f2c230' }, { x: 862, y: 862, c: '#4a90d9' }, { x: 838, y: 946, c: '#9b59b6' }];

  /* ---------- the LISTENERS sheet: clear acetate laid over the song map ---------- */
  function acetate(g, ox, a) {
    if (a <= 0) return;
    var x0 = 140 + ox, y0 = 556, w = 740, h = 540;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(214,226,240,.22)'; rr(g, x0, y0, w, h, 10); g.fill();
    g.fillStyle = 'rgba(21,19,27,.18)'; rr(g, x0, y0, w, h, 10); g.fill();
    /* see-through: a long diagonal glare band, a bright inner edge, a 4 px border */
    g.save(); rr(g, x0, y0, w, h, 10); g.clip();
    g.fillStyle = 'rgba(255,255,255,.13)'; poly(g, [[x0 + 120, y0], [x0 + 300, y0], [x0 + 300 - h * .9, y0 + h], [x0 + 120 - h * .9, y0 + h]]); g.fill();
    g.fillStyle = 'rgba(255,255,255,.07)'; poly(g, [[x0 + 340, y0], [x0 + 390, y0], [x0 + 390 - h * .9, y0 + h], [x0 + 340 - h * .9, y0 + h]]); g.fill();
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 + 8, y0 + h - 12); g.lineTo(x0 + 8, y0 + 8); g.lineTo(x0 + w - 12, y0 + 8); g.stroke();
    g.strokeStyle = 'rgba(244,237,224,.92)'; g.lineWidth = 4; rr(g, x0, y0, w, h, 10); g.stroke();
    prop(g, 'acetate', x0, y0, x0 + w, y0 + h);
    /* the tab: LISTENERS */
    g.fillStyle = '#d9e2ee'; rr(g, x0 + w - 300, y0 - 4, 284, 56, 10); g.fill();
    onprop(function () { txt(g, 'LISTENERS', x0 + w - 158, y0 + 25, 42, INK, 'center', 900, DISP, 260, 1, 36, 'condensed'); });
    g.restore();
  }
  /* an artist card: 5 slots (colours, no names) */
  function artistCard(g, x0, y0, label, cols, o) {
    o = o || {};
    paper(g, x0, y0, 360, 150, strHash(label), PAPER, 'artists');
    onprop(function () { txt(g, label, x0 + 180, y0 + 34, 38, INK, 'center', 800, DISP, 330, 1, 36, 'condensed'); });
    for (var i = 0; i < 5; i++) {
      var sx = x0 + 32 + i * 62, sy = y0 + 66;
      if (cols[i]) { g.fillStyle = cols[i]; rr(g, sx, sy, 52, 52, 8); g.fill(); g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 2; rr(g, sx, sy, 52, 52, 8); g.stroke(); disc(g, sx + 26, sy + 26, 15, 'rgba(244,237,224,.9)'); }
      else dashRect(g, sx + 2, sy + 2, 48, 48, 8, 'rgba(33,29,38,.55)', 3, [8, 6], 0);
      if (o.match && i < 4) { g.fillStyle = INK; g.fillRect(sx + 18, sy + 58, 16, 4); }
    }
  }
  /* a small paper clock */
  function clock(g, x, y, r, ang) {
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, x + 5, y + 7, r, r);
    g.fillStyle = '#f6f0e3'; el(g, x, y, r, r);
    g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.stroke();
    for (var i = 0; i < 12; i++) { var a = i / 12 * 6.283; g.fillStyle = INK; g.fillRect(x + Math.cos(a) * r * .8 - 2, y + Math.sin(a) * r * .8 - 2, 4, 4); }
    g.lineCap = 'round'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang * 12) * r * .45, y + Math.sin(ang * 12) * r * .45); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * r * .7, y + Math.sin(ang) * r * .7); g.stroke();
    prop(g, 'clock', x - r, y - r, x + r + 5, y + r + 7);
  }
  /* a paper waveform clip that ties two pins (sound, not a playlist) */
  function waveClip(g, x, y, a, rot) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -52, -24, 110, 54, 8); g.fill();
    g.fillStyle = '#f6f0e3'; rr(g, -56, -28, 110, 54, 8); g.fill();
    g.strokeStyle = INK; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath();
    for (var i = 0; i < 13; i++) { var xx = -44 + i * 7.3, hh = [6, 12, 18, 10, 20, 8, 16, 22, 12, 6, 14, 9, 5][i]; g.moveTo(xx, -1 - hh * .8); g.lineTo(xx, -1 + hh * .8); }
    g.stroke(); g.restore();
  }

  /* =====================================================================================================
     THE FILM: one stage. The card (0 → song), the tape (song → map), the map (map → end), frame 0 again (end).
     ===================================================================================================== */
  var F0OFF = 320;
  var HL = 392;
  function headline(g, off, a, dx) {
    if (a <= 0 || !LIVE.text) return;
    txt(g, 'WHY THIS SONG?', CX + (dx || 0), HL + off, 112, CREAM, 'center', 900, DISP, 820, a, 60, 'expanded');
  }
  function search(g, t, a) {
    if (a <= 0 || !LIVE.text || POSTERMODE) return;
    txt(g, 'HOW DOES SPOTIFY', CX, 350, 78, CREAM, 'center', 900, DISP, 820, a, 52, 'expanded');
    chip(g, 'KNOW WHAT YOU LIKE?', CX, 438, { px: 66, wt: 900, bg: CREAM, fg: BG, a: a, s: .92 + .08 * Math.min(1, pop(t, K.HS, 3.2)), maxw: 820, st: 'expanded', shadow: false });
  }
  function drift(t, ph, k) { return 6 * Math.sin(t * 1.9 + ph) * (k == null ? 1 : k); }
  /* the hero hold: from the stamp settling to the hold's end, nothing moves */
  function still(t) { return seg(t, K.SLAM + .1, K.SLAM + .13) * (1 - seg(t, K.W1, K.W1 + .03)); }
  function pinPos(i, t) {
    var p = PINS[i];
    if (i < 3) { var k = eio(seg(t, K.land - .05, K.nearEnd + .05)); return [lerp(p.x, p.tx, k), lerp(p.y, p.ty, k)]; }
    if (i < 5) { var k2 = eio(seg(t, K.soundW - .05, K.soundW + .3)); return [lerp(p.x, p.tx, k2), lerp(p.y, p.ty, k2)]; }
    return [p.x, p.y];
  }
  /* YOU's place on the LISTENERS sheet: yanked toward the kids' pins in the gap, eased back part way after EXCLUDED */
  function youPos(t) {
    var y1 = eio(seg(t, K.YANK, K.YANK + .32)), y2 = eio(seg(t, K.CUT, K.CUT + .55));
    var x = lerp(YOU.x, YOU2.x, y1), y = lerp(YOU.y, YOU2.y, y1);
    if (y2 > 0) { x = lerp(x, YOU3.x, y2); y = lerp(y, YOU3.y, y2); }
    var tr = t >= K.YANK && t < K.YANK + .5 ? 5 * Math.exp(-8 * (t - K.YANK - .32)) * Math.sin((t - K.YANK) * 40) * (t > K.YANK + .32 ? 1 : 0) : 0;
    return [x + tr, y];
  }

  function film(g, t) {
    var st = still(t), dk = 1 - st;
    var off = F0OFF * (1 - eout(seg(t, 1 / 60, .95)));   /* frame 0 (sampled at 1/60 s) sits exactly where the end card's last frame does */
    /* ---------------- A · the card (frame 0 → "song") ---------------- */
    var cardOut = eio(seg(t, K.songW - .12, K.songW + .42));          /* the card, quote and tray slide off left */
    var endIn = eio(seg(t, K.PUSH, K.PUSH + .4));                   /* frame 0's group slides back in from the right */
    var mapOut = endIn;
    if (cardOut < 1) {
      var cx = -980 * cardOut, dA = drift(t, .4, seg(t, .95, 1.4));
      EXITING = cardOut > 0;
      /* the tray (from 0.85 s), its back behind the falling row */
      var trayIn = eout(seg(t, .8, 1.25)), trayDy = 180 * (1 - trayIn);
      var land = K.TEAR + .42, bump = t >= land ? 8 * Math.exp(-9 * (t - land)) * Math.sin((t - land) * 30) : 0;
      if (trayIn > 0) { g.save(); g.translate(cx, dA * .5); trayBack(g, trayDy + bump); g.restore(); }
      /* the ? row: tab flicks on "skip", the row pulls loose, tears off in the gap and drops into the tray */
      var flick = t >= K.skip - .02 ? Math.sin(Math.PI * seg(t, K.skip - .02, K.skip + .22)) : 0;
      var loose = eout(seg(t, K.skip, K.skip + .35)), trem = t > K.skip + .3 && t < K.TEAR ? 1.5 * Math.sin(t * 46) : 0;
      var fall = seg(t, K.TEAR, land);
      var shift = eio(seg(t, K.TEAR + .12, K.TEAR + .5));
      var riffle = function (i) { return t > K.ask && t < K.askEnd + .3 ? 9 * Math.sin((t - K.ask) * 7 - i * .9) * Math.sin(Math.PI * seg(t, K.ask, K.askEnd + .3)) : 0; };
      g.save(); g.translate(cx, off + dA);
      var c0 = playlistCard(g, t, { example: fin(t, .9), row0: { dx: 70 * loose + trem, rot: .03 * loose, tab: -.5 * flick, gone: t >= K.TEAR }, shift: shift, riffle: riffle, lift: t >= K.songW });
      g.restore();
      /* the falling row: from its place on the card into the tray (clipped by the tray's mouth) */
      if (t >= K.TEAR && fall < 1.2) {
        var fk = fall * fall, rx = lerp(CARD.x0 + CARD.w / 2 + 70, TRAY.x0 + TRAY.w / 2, eio(fall)) + cx, ry = lerp(ROW0 + ROWH / 2 + off, TRAY.y0 + 40, fk);
        g.save(); g.beginPath(); g.rect(0, 0, W, TRAY.y0 + trayDy + 20); g.clip();
        looseRow(g, rx, ry, lerp(.03, -.18, fall), lerp(1, .62, fall));
        g.restore();
      }
      if (trayIn > 0) { var exT = EXITING; EXITING = EXITING || trayIn < 1; g.save(); g.translate(cx, dA * .5); trayFront(g, trayDy + bump, 1, 1 + .03 * Math.exp(-6 * Math.max(0, t - land)) * (t >= land ? 1 : 0)); g.restore(); EXITING = exT; }
      /* Spotify's own sentence, pinned on the card under the rows once the row is gone */
      var qin = eout(seg(t, K.TEAR + .12, K.TEAR + .45));
      if (qin > 0) {
        g.save(); g.translate(cx + 40 * (1 - qin), dA); if (qin < .5) g.globalAlpha = 0;
        qstrip(g, ['“…listening, skipping,', 'or saving… influence our', 'interpretation of your taste.”'], 'SPOTIFY SAFETY & PRIVACY CENTER · OCT 2026', 0, { y0: 1000, h: 256, px: 46, rot: -.012, seed: 61 });
        g.restore();
      }
      EXITING = false;
    }
    /* ---------------- B · the record lifts off; the tape prints 80 numbers ---------------- */
    var dLift = seg(t, K.songW - .05, K.songW + .45), mapIn = eio(seg(t, K.dot - .15, K.dot + .38));
    var tapeA = 1;
    if (t >= K.songW - .12 && mapIn < 1) {
      /* the tape: rows 1–6 print on the words, the last two on the ratchet */
      var rows = t < K.into - .1 ? 0 : 8 * eio(seg(t, K.into - .1, K.n80 - .06));
      if (t >= K.RAT) rows += .35 * Math.min(3, Math.floor((t - K.RAT) / .035) + 1) / 3;   /* the ratchet: three jerks of blank tape */
      rows *= 1 - eio(seg(t, K.map, K.dot + .2));                                           /* rolled back into the slot as the map comes */
      /* the lower band never empties: the slot feeds a blank leader while the card leaves */
      var lead = eout(seg(t, K.songW - .12, K.songW + .3)) * 2.2 * (1 - eio(seg(t, K.map, K.dot + .2)));
      tape(g, Math.max(rows, lead), tapeA);
      /* 80 NUMBERS PER SONG lands on the frame the last row prints; the credit with it */
      if (t >= K.n80 - .06) stamp(g, '80 NUMBERS\nPER SONG', 660, 664, t, K.n80 - .06, 72, CREAM, -.04, .7);
      if (t >= K.RES) { var ra = fin(t, K.RES); txt(g, 'SPOTIFY RESEARCH', 660, 788, 48, CREAM, 'center', 800, DISP, 460, ra, 48, 'condensed'); txt(g, 'SEP 2025', 660, 842, 48, CREAM, 'center', 800, DISP, 460, ra, 48, 'condensed'); }
    }
    /* ---------------- C · the map (from "Like" to the end card) ---------------- */
    if (mapIn > 0 && mapOut < 1) {
      var my = 900 * (1 - mapIn), mx = -980 * mapOut, dM = drift(t, 1.1, dk) * .6;
      EXITING = mapOut > 0;
      g.save(); g.translate(mx, my + dM);
      var scope = (t < K.you + .1 ? 1 : 0) * fin(t, K.map + .25);
      corkMap(g, t, 0, 0, { scope: scope });
      g.save(); g.beginPath(); g.rect(MAP.px0, MAP.py0, MAP.px1 - MAP.px0, MAP.py1 - MAP.py0); g.clip();
      /* the road-trip string, under its pins: drawn on from "same", tight from "land" */
      var sprog = eout(seg(t, K.same - .05, K.same + .45)), tight = eio(seg(t, K.land - .05, K.nearEnd + .05));
      var pA = pinPos(0, t), pB = pinPos(1, t), pC = pinPos(2, t);
      string(g, [pA, pB, pC], (1 - tight) * .9, sprog, '#f6eedc', 6);
      /* the sound clip between D and E */
      var pD = pinPos(3, t), pE = pinPos(4, t), wv = fin(t, K.soundW - .05);
      if (wv > 0) { g.save(); g.strokeStyle = 'rgba(33,29,38,.7)'; g.lineWidth = 3; g.setLineDash([7, 6]); g.beginPath(); g.moveTo(pD[0], pD[1]); g.lineTo(pE[0], pE[1]); g.stroke(); g.restore(); }
      /* the pins (the dropped record joins on "map") */
      PINS.forEach(function (p, i) { var q = pinPos(i, t); var wob = (i > 4 && t > K.map && t < K.map + 1.2) ? 0 : 0; songPin(g, q[0], q[1] + wob, PCOL[p.c], i < 3 ? 1.45 : 1); });
      if (t >= K.mapW) songPin(g, DROP.x, DROP.y, PCOL[1], 1);
      var snapK = t >= K.SNAP ? 1 + .14 * Math.exp(-14 * (t - K.SNAP)) : 1;
      g.save(); g.translate((pD[0] + pE[0]) / 2, (pD[1] + pE[1]) / 2 - 4); g.scale(snapK, t >= K.SNAP ? 1 / snapK : 1); waveClip(g, 0, 0, wv, -.08); g.restore();
      /* the kids' pins: drop on "kids'", their string snaps to YOU in the gap, they lift off on EXCLUDED */
      var kidIn = t >= K.kids - .05 ? 1 : 0;
      g.restore();
      /* the LISTENERS sheet over the song map (from "You're") */
      var sheetIn = eio(seg(t, K.you - .12, K.you + .3)), sx = 900 * (1 - sheetIn);
      if (sheetIn > 0) {
        EXITING = EXITING || sheetIn < 1;
        acetate(g, sx, 1);
        g.save(); g.translate(sx, 0); g.beginPath(); g.rect(140, 556, 740, 540); g.clip();
        /* the neighbours (from "listening"), then YOU on top */
        NB.forEach(function (n, i) { var tk = K.listening - .1 + i * .07, d = 1 - eout(seg(t, tk, tk + .2)); if (t >= tk) pushPin(g, n.x, n.y, 24, '#d6cbb4', d); });
        var yp = youPos(t), yd = 1 - eout(seg(t, K.dotY - .08, K.dotY + .18));
        if (t >= K.dotY - .08) {
          /* the kids' string: from the kids' pins to YOU, snapped on in the yank */
          if (t >= K.YANK && t < K.CUT) { var ks = eout(seg(t, K.YANK - .02, K.YANK + .08)); KID.forEach(function (k) { string(g, [[k.x, k.y], yp], 0, ks, '#f6eedc', 4); }); }
          pushPin(g, yp[0], yp[1], 52, CREAM, yd);
          if (yd < .5) onprop(function () { txt(g, 'YOU', yp[0], yp[1] - 120 * yd + 2, 40, INK, 'center', 900, DISP, 90, 1, 36, 'condensed'); });
        }
        g.restore();
        /* Spotify Research's sentence, a paper strip taped to the sheet's lower edge until the kids' pins come */
        var lnIn = eout(seg(t, K.picks - .1, K.picks + .06)), lnOut = eio(seg(t, K.kids - .25, K.kids - .09));
        if (lnIn > 0 && lnOut < 1) {
          EXITING = EXITING || lnOut > 0 || lnIn < 1;
          g.save(); g.translate(sx + 900 * lnOut + 900 * (1 - lnIn), 0);
          qstrip(g, ['“Each listener is mapped', 'to a high-dimensional', 'embedding…”'], 'SPOTIFY RESEARCH · 2025', 30, { y0: 945, h: 160, w: 740, maxw: 700, px: 40, gap: 40, cpx: 36, seed: 77, rot: .008 });
          g.restore();
          EXITING = mapOut > 0;
        }
        /* what YOU is made of (never 80 numbers): under the pin until the picks */
        var la = fin(t, K.listening + .1) * (1 - seg(t, K.dip - .1, K.dip + .1));
        if (la > 0) chip(g, 'YOUR LISTENING + OTHER SIGNALS', YOU.x + sx, 912, { px: 38, wt: 800, bg: 'rgba(21,19,27,.92)', fg: CREAM, line: CREAM, lw: 2, a: la, maxw: 560, st: 'condensed', shadow: false });
      }
      /* the kids' pins sit on the song map, beside the sheet's corner; they drop on "kids'" and lift on EXCLUDED */
      if (kidIn) {
        KID.forEach(function (k, i) {
          var tk = K.kids - .05 + i * .08, d = 1 - eout(seg(t, tk, tk + .22)), lift = eio(seg(t, K.EXCL, K.EXCL + .4));
          if (t < tk) return;
          g.save(); g.globalAlpha *= 1 - .55 * lift; g.translate(0, -60 * d - 30 * lift); songPin(g, k.x, k.y, k.c, 1.15, lift); g.restore();
        });
        var kt = fin(t, K.kids - .08) * (1 - seg(t, K.EXCL - .02, K.EXCL));
        if (kt > 0) tag(g, 'KIDS’ SONGS · EXAMPLE', 672, 1010, kt, .01, 410, CREAM, 'rgba(21,19,27,.92)', 36);
        if (t >= K.EXCL) stamp(g, 'EXCLUDED', 766, 690, t, K.EXCL, 56, INK, -.12, .6);
      }
      /* the hero: SAME PLAYLISTS (coral) beside the road-trip cluster, in the silence; peeled after the hold */
      /* the proof in ink lands on "same" as the string starts; the coral stamp slams over it in the silence */
      if (t >= K.same && t < K.SLAM) stamp(g, 'SAME\nPLAYLISTS', 690, 660, t, K.same, 84, INK, -.05, .45);
      if (t >= K.SLAM) {
        var pk = eio(seg(t, K.PEEL, K.PEEL + .25));
        if (pk < 1) {
          g.save(); g.translate(690, 660 - 140 * pk * pk); g.rotate(-.4 * pk); g.translate(-690, -660); g.globalAlpha *= 1 - pk;
          var nr = NOREC; if (pk > 0) NOREC = true;
          stamp(g, 'SAME\nPLAYLISTS', 690, 660, t, K.SLAM, 84, HOT, -.05, .45);
          NOREC = nr; g.restore();
        }
      }
      /* the road-trip tag (beside the cluster, not on a pin) */
      var rt = fin(t, K.same + .2) * (1 - seg(t, K.you - .15, K.you));
      if (rt > 0) tag(g, 'ROAD TRIP · EXAMPLE', (pA[0] + pB[0] + pC[0]) / 3, Math.min(925, (pA[1] + pB[1] + pC[1]) / 3 + 130), rt, -.01, 470, CREAM, 'rgba(21,19,27,.92)', 38);
      /* SOUND ALIKE: cream ink beside the pair, on "alike" */
      if (t >= K.soundW + .3 && t < K.picks - .1) stamp(g, 'SOUND ALIKE', 712, 1046, t, K.soundW + .3, 50, INK, .03, .5);
      /* the picks: two cards of five artist slots; the neighbour's fifth slides across on "love" and lands in the gap */
      var cin = eout(seg(t, K.picks - .1, K.picks + .3)), cout = eio(seg(t, K.YANK - .05, K.YANK + .3));
      if (cin > 0 && cout < 1) {
        var cy = 0, cdx = 560 * (1 - cin) + 560 * cout, ca = [PCOL[0], PCOL[1], PCOL[3], PCOL[5]];
        EXITING = cin < 1 || cout > 0;
        g.save();
        var landed = t >= K.FIFTH;
        g.save(); g.translate(-cdx, 0); artistCard(g, 140, 566, 'YOUR TOP ARTISTS', ca.concat([landed ? '#c99a6a' : null]), { match: t >= K.lis }); g.restore();
        g.save(); g.translate(cdx, 0); artistCard(g, 520, 566, 'A LISTENER NEAR YOU', ca.concat([landed ? null : '#c99a6a']), { match: t >= K.lis }); g.restore();
        /* the fifth in flight: lifts on "love", lands on FIFTH */
        if (t >= K.lis && !landed) {
          var fk2 = eio(seg(t, K.lis, K.FIFTH)), fx = lerp(520 + 32 + 4 * 62 + 26, 140 + 32 + 4 * 62 + 26, fk2), fy = 566 + 92 - 110 * Math.sin(Math.PI * fk2);
          g.fillStyle = '#c99a6a'; rr(g, fx - 26, fy - 26, 52, 52, 8); g.fill(); disc(g, fx, fy, 15, 'rgba(244,237,224,.9)');
        }
        g.restore();
        if (landed) chip(g, '5TH ARTIST', 418 - cdx, 742 + cy, { px: 40, wt: 900, bg: CREAM, fg: BG, a: 1, s: 1 + .12 * (1 - eout(seg(t, K.FIFTH, K.FIFTH + .12))), rot: -.02, st: 'condensed', shadow: false });
        EXITING = mapOut > 0;
      }
      /* WITHIN MINUTES: a paper note pinned on the map on the frame YOU is yanked (the source's own example on it) */
      g.restore();
      EXITING = false;
      /* the record from the tape: shrinks to a pin and drops on the map on "map" */
    }
    if (t >= K.songW - .05 && t < K.mapW + .05) {
      var fromX = CARD.x0 + 75, fromY = ROW0 + ROWH + 64 - (t >= K.TEAR + .5 ? ROWH : 0);
      var big = eout(dLift), sh = eio(seg(t, K.dot - .1, K.mapW));
      var dx2 = lerp(lerp(fromX, 250, big), DROP.x, sh), dy2 = lerp(lerp(fromY, 690, big), DROP.y + 900 * (1 - mapIn), sh);
      var r2 = lerp(lerp(42, 108, big), 25, sh);
      disc(g, dx2, dy2 - 30 * Math.sin(Math.PI * sh), r2, PCOL[1], t * 1.2);
      if (big > .9 && sh <= .05) tag(g, 'ONE SONG', 250, 836, fin(t, K.songW + .15) * (1 - seg(t, K.dot - .1, K.dot - .02)), .01, 260, CREAM, 'rgba(21,19,27,.92)', 38);
    }
    /* ---------------- the shelf: one quote strip at a time, each slides in over the last ---------------- */
    if (mapIn > 0 && mapOut < 1) shelf(g, t, -980 * mapOut);
    /* ---------------- frame 0 again: the card and the headline slide back in from the right ---------------- */
    if (endIn > 0) {
      var ex = 830 * (1 - endIn), eD = drift(t, .4, 1 - seg(t, K.TEND - .4, K.TEND - .1)) * (endIn >= 1 ? 1 : 0);
      EXITING = endIn < 1;
      g.save(); g.translate(ex, F0OFF + eD);
      playlistCard(g, t, { example: 0, row0: {}, shift: 0 });
      g.restore();
      headline(g, F0OFF + eD, 1, ex); EXITING = false;
      /* YES / NO: coral, the same size, nudging on their words; gone before the last frame (= frame 0) */
      var ya = fin(t, K.PUSH + .22) * (1 - seg(t, K.TEND - .1, K.TEND - .02));
      var yk = function (w) { return 1 + .06 * Math.sin(Math.PI * seg(t, w - .06, w + .3)); }, yp2 = Math.min(1, pop(t, K.PUSH + .22, 3));
      [['YES', 368, K.yes], ['NO', 652, K.noE]].forEach(function (c) {
        chip(g, c[0], c[1] + 4 * Math.sin(t * 2.1 + c[1]), 560 + 14 * (1 - yp2), { px: 112, wt: 900, bg: BG, line: HOT, lw: 8, fg: HOT, w: 262, h: 146, r: 56, shadow: false, a: ya, s: yk(c[2]) });
      });
    }
    /* frame 0's headline → the search phrase */
    if (t < K.song) {
      headline(g, off, 1 - seg(t, K.HS - .12, K.HS), -980 * cardOut);
      search(g, t, fin(t, K.HS) * (1 - seg(t, K.song - .16, K.song - .06)));
    }
  }
  /* the quote shelf (y 1184–1420, under the map's rail): the strip for each line, sliding in from the right */
  var STRIPS;
  function strips() {
    return [
      { t0: K.dot - .1, L: ['“…learns track embeddings', 'from playlist co-occurrence…”'], c: 'SPOTIFY RESEARCH · 2025' },
      { t0: K.sound - .05, L: ['“…capturing acoustic', 'similarity.”'], c: 'SPOTIFY RESEARCH · 2025' },
      { t0: K.picks - .1, L: ['“…maybe each person', 'would like the other’s', 'fifth artist…”'], c: 'OSKAR STÅL · SPOTIFY VP · 2021' },
      { t0: K.kids - .05, time: true },
      { t0: K.fix - .15, fix: true }
    ];
  }
  function shelf(g, t, mx) {
    if (!STRIPS) STRIPS = strips();
    var cur = -1; STRIPS.forEach(function (s, i) { if (t >= s.t0) cur = i; });
    /* before the first strip: the shelf shows the record's map label is on the rail; the lower band is the map's rail + the 80-number tape folding away */
    for (var i = Math.max(0, cur - 1); i <= cur; i++) {
      var s = STRIPS[i], kin = eout(seg(t, s.t0, s.t0 + .16)), nx = STRIPS[i + 1], kout = nx ? eio(seg(t, nx.t0, nx.t0 + .16)) : 0;
      if (i < cur && kout >= 1) continue;
      var dx = 920 * (1 - kin) - 920 * kout + mx;
      EXITING = kin < 1 || kout > 0 || mx !== 0;
      g.save(); g.translate(0, drift(t, 2.2 + i, 1 - still(t)) * .5);
      if (s.time) timeStrip(g, t, dx);
      else if (s.fix) fixCard(g, t, dx);
      else qstrip(g, s.L, s.c, dx, { seed: 71 + i * 7, px: s.L.length > 2 ? 44 : 48 });
      g.restore();
      EXITING = false;
    }
  }
  function timeNote(g, t) {
    var k = eout(seg(t, K.YANK, K.YANK + .12)), x0 = 150, y0 = 566 - 40 * (1 - k);
    g.save(); g.translate(x0 + 185, y0 + 120); g.rotate(-.02); g.scale(lerp(1.08, 1, k), lerp(1.08, 1, k)); g.translate(-(x0 + 185), -(y0 + 120));
    paper(g, x0, y0, 370, 240, 97, '#f6f0e3', 'note');
    g.fillStyle = '#5a4a3a'; el(g, x0 + 185, y0 + 12, 9, 9);
    onprop(function () {
      txt(g, 'WITHIN MINUTES', x0 + 185, y0 + 54, 54, INK, 'center', 900, DISP, 340, 1, 48, 'condensed');
      txt(g, '“…e.g., streaming', x0 + 185, y0 + 108, 46, INK, 'center', 800, DISP, 340, 1, 44, 'condensed');
      txt(g, 'a new artist…”', x0 + 185, y0 + 156, 46, INK, 'center', 800, DISP, 340, 1, 44, 'condensed');
      txt(g, 'SPOTIFY RESEARCH 2025', x0 + 185, y0 + 206, 36, INK, 'center', 700, DISP, 340, 1, 36, 'condensed');
    });
    g.restore();
  }
  function timeStrip(g, t, dx) {
    var x0 = SHELF.x0 + dx;
    paper(g, x0, SHELF.y0, SHELF.w, SHELF.h, 97, '#f6f0e3', 'strip');
    clock(g, x0 + 112, SHELF.y0 + SHELF.h / 2, 74, (t - K.dip) * 1.4 + (t >= K.YANK ? 9 * eout(seg(t, K.YANK, K.YANK + .5)) : 0));
    onprop(function () {
      txt(g, 'WITHIN MINUTES', x0 + 480, SHELF.y0 + 52, 62, INK, 'center', 900, DISP, 560, 1, 48, 'condensed');
      txt(g, '“…e.g., streaming', x0 + 480, SHELF.y0 + 112, 48, INK, 'center', 800, DISP, 560, 1, 48, 'condensed');
      txt(g, 'a new artist…”', x0 + 480, SHELF.y0 + 162, 48, INK, 'center', 800, DISP, 560, 1, 48, 'condensed');
      txt(g, 'SPOTIFY RESEARCH 2025', x0 + 480, SHELF.y0 + 210, 36, INK, 'center', 700, DISP, 560, 1, 36, 'condensed');
    });
  }
  function fixCard(g, t, dx) {
    /* a plain paper card (not an app screen), taller than the shelf: it covers the map's lower edge */
    var x0 = SHELF.x0 + dx, y0 = 1040, h = 382;
    paper(g, x0, y0, SHELF.w, h, 113, PAPER, 'strip');
    g.fillStyle = 'rgba(244,237,224,.55)'; g.save(); g.translate(x0 + 40, y0 + 8); g.rotate(-.5); g.fillRect(-34, -11, 68, 22); g.restore();
    g.save(); g.translate(x0 + SHELF.w - 40, y0 + 8); g.rotate(.5); g.fillRect(-34, -11, 68, 22); g.restore();
    var L = ['“…it will have less influence', 'on your future', 'recommendations. You can', 'exclude tracks, playlists', 'or kids and family music.”'];
    onprop(function () {
      L.forEach(function (s, i) { txt(g, s, x0 + 400, y0 + 50 + i * 54, 46, INK, 'center', 800, DISP, 740, 1, 40, 'condensed'); });
      txt(g, 'SPOTIFY SAFETY & PRIVACY CENTER · OCT 2026', x0 + 400, y0 + 338, 38, INK, 'center', 700, DISP, 740, 1, 36, 'condensed');
    });
  }

  /* ---------- captions: the narrator's words, one block per line; stressed words get a cream pill (never coral) ---------- */
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'ask') return;   /* frame 0's question and the search phrase carry these */
      out.push({ id: l.id, t0: l.words[0].t0, s: l.words[0].t0, t1: l.words[l.words.length - 1].t1, words: l.words });
    });
    return out;
  })();
  var STRESS = [['song', '80'], ['map', 'dot'], ['near', 'same'], ['near', 'close'], ['sound', 'alike'], ['you', 'dot'], ['picks', 'near'], ['dip', 'minutes'], ['fix', 'exclude'], ['end', 'hijacked']]
    .map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, that: 1, is: 1, it: 1, do: 1, from: 1, be: 1, or: 1, for: 1, about: 1, who: 1, are: 1, we: 1, if: 1, no: 1, our: 1, over: 1, each: 1, every: 1, same: 1, one: 1, what: 1 };
  var CAPMIN = 1e9;
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s - .04 : 1e9;
    var keep = nx && (ns - card0.t1 < 2.4 || card0.id === 'near');   /* the hero caption stays up through the whole hold */
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
    var lh = cpx * 1.16, y0 = Math.max((lines.length > 1 ? 376 : 410) + 20 - (lines.length - 1) * lh / 2, 308 + cpx * .9);   /* pill tops at y ≥ 304 */
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
  var NOISE, SCENES = { film: film };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function safeClip(g) { g.beginPath(); g.rect(SAFE_BOX.x0, SAFE_BOX.y0, SAFE_BOX.x1 - SAFE_BOX.x0, SAFE_BOX.y1 - SAFE_BOX.y0); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    g.save(); safeClip(g);
    g.save(); film(g, t); g.restore();
    g.restore();
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) captions(g, t, 1 - seg(t, K.noEnd + .04, K.noEnd + .18));
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 72, 800, DISP, 'expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('How Spotify', CX, 380);
    var b = 'knows your taste', bp = 72; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 462 - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 462); g.restore();
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
    var G = [['slam', 'thump', .32], ['tear', 'paper', .3], ['ratchet', 'rattle', .2], ['fifth', 'pop', .22], ['yank', 'knock', .25], ['excl', 'slap', .3], ['snap', 'click', .32], ['tick', 'click', .1]];
    G.forEach(function (e) { if (GT[e[0]] != null) EV.push({ t: +GT[e[0]].toFixed(3), type: e[1], g: e[2], t1: +(GT[e[0]] + BODY[e[1]]).toFixed(3) }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (t < 2 / (fps || 30) - 1e-6 || t > K.TEND - .2) samples = 1;   /* frame 0 and the seam: sharp, no ghosting */
    if (samples === 1) { POSTERMODE = t === window.FILM.POSTER; frame(ctx, t); POSTERMODE = false; return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
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
    /* THE hit: a rubber stamp slammed on paper on cork. Body 250 → 170 Hz and a 330 Hz knock (where a phone speaker
       still plays), with a paper slap at 1.5–2.5 kHz on top so it reads on a phone */
    function stampThump(t, g) {
      g = g || 1;
      var o = osc('sine', 250, t, t + .2, 1, [[t, 0], [t + .012, .5 * g], [t + .14, .46 * g], [t + .19, 0]], .05); o.frequency.exponentialRampToValueAtTime(170, t + .18);
      osc('triangle', 330, t, t + .14, 1, [[t, 0], [t + .004, .32 * g], [t + .06, .22 * g], [t + .13, 0]], .03);
      band(t, .15, 1600, .9, 3.8 * g, .008, .05);
      band(t, .1, 2500, 1.1, 2.3 * g, .006, .03);
      band(t + .001, .17, 1800, .55, 3.6 * g, .008, .04);
    }
    /* a pin knocked into cork: a short low knock with a paper tap on top (reads on a phone speaker) */
    function knockS(t, g) {
      g = g || 1;
      var o = osc('sine', 300, t, t + .14, 1, [[t, 0], [t + .003, .6 * g], [t + .13, 0]], .04); o.frequency.exponentialRampToValueAtTime(190, t + .12);
      band(t, .05, 1400, 1, 4.5 * g, .001, .03); band(t + .002, .03, 2600, 1.4, 2.4 * g, .001, .02);
    }
    /* the tape ratcheting: four dry paper clicks */
    function rattleS(t, g) { g = g || 1; for (var k = 0; k < 4; k++) { band(t + k * .032, .03, 2900 - k * 260, 1.6, 4 * g, .001, .02); band(t + k * .032 + .002, .03, 1300, 2, 1.2 * g, .001, .02); } }
    /* a soft paper pop */
    function popS(t, g) { g = g || 1; band(t, .03, 3200, 1.8, 5 * g, .001, .02); band(t + .002, .05, 1500, 2.2, .8 * g, .001, .02); }
    /* the row tearing off the card: rough band noise sweeping up */
    function rip(t, g) {
      g = g || 1;
      var n = noise(t, .17), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(1300, t); bp.frequency.exponentialRampToValueAtTime(4200, t + .16);
      var ob = bus(1, .04, .15); n.connect(bp); bp.connect(ob);
      var pts = [[t, 0]]; for (var k = 1; k <= 8; k++) pts.push([t + k * .02, (k % 2 ? 1.6 : .7) * g * (1 - k / 10)]); pts.push([t + .17, 0]); env(ob.gain, pts);
    }
    /* a flat paper slap (the cream ink stamps) */
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); }
    EV.forEach(function (e) {
      if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'knock') { knockS(e.t, e.g); slapS(e.t + .003, LAYER * .8); }
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
  var ROOM = .0108, RIPSLAP = .25, LAYER = .375;   /* the 1–3 kHz layer that lifts pops and rattles on a phone */

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
  /* the hero hold: from the stamp settling to the hold's end, fully still */
  var HOLD = { t0: K.SLAM + .13, t1: K.W1 };
  SHOTS.forEach(function (s, i) { s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : DUR; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'embeddings', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
