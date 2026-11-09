/* "Deleted photos aren't really gone" — Factory #26 on Tech, explained, after ../forceclose/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the tear-off day calendar: a paper pad clipped to the Recently Deleted bin tears DAY 1 → DAY 30,
   and every scene change is the same move (the whole scene is a calendar page torn off along its perforation and
   dropped, the next scene already built under it). One hero stamp: CAN'T GET IT BACK (coral) over the emptied bins;
   coral is also on the end card's YES / NO and nowhere else. A generic phone, album, bins and confirm sheets, drawn by
   hand: no logos, no real UI, no real photos. Every scene is clipped to the safe box x 92–928, y 302–1428. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#131619', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f3ecdf', INK = '#211d26', DARK = '#2a2b31', BIN = '#dccbaa', BRICK = '#a8432f';
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
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }   /* a displayed number follows the frame the renderer samples */

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
  function voiceEnd(id, before) { var e = lend(id); VOICED.forEach(function (v) { if (v.t0 < lend(id) + .3 && v.t1 > e && v.t1 < before) e = v.t1; }); return e; }
  var BODY = { thump: .2, knock: .14, slap: .1, paper: .17, pop: .12, tick: .05 };
  var GT = {};
  var RT = {};
  function ratchet(pre, t0, hi, n) {   /* five flap ticks, each gap shorter than the last (0.08 → 0.05 s) */
    RT[pre] = []; var w = t0, gaps = [.08, .07, .06, .05];
    for (var i = 0; i < (n || 5); i++) { place(pre + i, 'tick', w, .155, w - .02, hi); if (GT[pre + i] != null) { RT[pre].push(GT[pre + i]); w = GT[pre + i] + gaps[Math.min(i, 3)]; } }
  }
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  var K = {
    hookEnd: lend('hook'), here: at('hook', 'here'),
    test: start('test'), photosW: at('test', 'photos'), swipe: at('test', 'swipe'), up: at('test', 'up'), recently: at('test', 'recently'), deletedW: wend('test', 'deleted'), testEnd: lend('test'),
    ask: start('ask'), goneW: at('ask', 'gone'), askEnd: lend('ask'),
    moves: start('moves'), del: at('moves', 'delete'), delEnd: wend('moves', 'delete'), iphone: at('moves', 'iphone'), movesW: at('moves', 'moves'), movesEnd: lend('moves'),
    days: start('days'), waits: at('days', 'waits'), thirty: at('days', 'thirty'), daysW: wend('days', 'days'), locked: at('days', 'locked'), daysEnd: lend('days'),
    google: start('google'), gtrash: at('google', 'trash'), gthirty: at('google', 'thirty'), googleEnd: lend('google'),
    friend: start('friend'), saved: at('friend', 'saved'), shared: at('friend', 'shared'), friendEnd: lend('friend'),
    theirs: start('theirs'), copy: at('theirs', 'copy'), stays: at('theirs', 'stays'), staysEnd: wend('theirs', 'stays'), tdel: at('theirs', 'delete'), album: at('theirs', 'album'), theirsEnd: lend('theirs'),
    really: start('really'), itEnd: wend('really', 'it'), empty: at('really', 'empty'), rtrash: at('really', 'trash'), reallyEnd: lend('really'),
    gone: start('gone'), apple: at('gone', 'apple'), googleG: at('gone', 'google'), say: at('gone', 'say'), cant: at('gone', 'cant'), back: at('gone', 'back'), goneEnd: lend('gone'),
    end: start('end'), emptyE: at('end', 'empty'), emptyEnd: wend('end', 'empty'), yes: at('end', 'yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  (function () {
    /* frame 0: the lifted snapshot settles into its slot on a soft paper tick, before the first word */
    place('r1', 'paper', voiceEnd('hook', K.test) + .1, .19, K.hookEnd, K.test);
    place('r2', 'paper', voiceEnd('ask', K.moves) + .06, .17, K.askEnd, K.moves);
    place('dl', 'tick', K.delEnd + .05, .15, K.delEnd, K.iphone);                     /* the delete button, if "delete," leaves a gap */
    place('lk', 'knock', voiceEnd('days', K.google) + .1, .19, K.daysEnd, K.google);   /* the padlock's shackle snaps shut */
    /* the calendar flurries end on a ratchet of paper flap ticks that speeds up, in the pause after each line */
    ratchet('ri', (GT.lk != null ? GT.lk + BODY.knock + .15 : K.daysEnd + .3), K.google - .08);
    ratchet('rg', voiceEnd('google', K.friend) + .06, K.friend - .35, 4);
    place('r3', 'paper', (RT.rg.length ? RT.rg[RT.rg.length - 1] + .03 : voiceEnd('google', K.friend) + .08), .155, K.googleEnd, K.friend);
    place('sv', 'pop', voiceEnd('friend', K.theirs) + .06, .155, K.friendEnd, K.theirs);  /* SAVED FROM A SHARED ALBUM */
    place('ts', 'slap', voiceEnd('theirs', K.really) + .05, .155, K.theirsEnd, K.really - .3);   /* THEIRS STAYS slams in the pause */
    place('r4', 'paper', GT.ts != null ? GT.ts + .2 : K.theirsEnd + .3, .155, GT.ts != null ? GT.ts + .12 : K.theirsEnd, K.really);
    place('hero', 'thump', voiceEnd('gone', K.end) + .05, .155, K.goneEnd, K.end);
  })();
  var TW = .45;                                           /* a calendar-page tear: 0.45 s; it starts on the rip */
  function wipeEnd(gt, fb) { return (gt != null ? gt - .04 : fb) + TW; }
  K.HERO = GT.hero != null ? GT.hero : K.goneEnd + .2;
  
  K.ATEAR = K.tdel - .05;                /* the shared album tears in half */
  K.TS = GT.ts != null ? GT.ts : K.theirsEnd + .2;          /* THEIRS STAYS slams (its words ink in on "stays") */
  K.LOCK = GT.lk != null ? GT.lk : K.daysEnd + .1;          /* the shackle snaps shut */
  K.SV = GT.sv != null ? GT.sv : K.friendEnd;               /* SAVED FROM A SHARED ALBUM */
  K.DAY30 = RT.ri.length ? RT.ri[RT.ri.length - 1] : K.daysW + .1;   /* the iPhone calendar reaches DAY 30 on its last tick */
  K.GCAL = RT.rg.length ? RT.rg[RT.rg.length - 1] : K.gthirty + .55;   /* Google's too */
  /* a calendar's day: a fast flurry from DAY 1, then one page per ratchet tick */
  function dayAt(t, t0, ticks, end) {
    var tt = tq(t), n = ticks.length; if (!n) return 1 + 29 * eio(seg(tt, t0, end));
    var c = 0; ticks.forEach(function (x) { if (tt >= x) c++; });
    return 1 + (29 - n) * eio(seg(tt, t0, ticks[0] - .03)) + c;
  }
  /* the hero hold: the stamp stays until the end card tears in; its two lines need 2.0 s each on screen */
  K.ENDT = Math.max(K.cant + 2.07, K.HERO + 1.33) + TW;   /* the hold after the slam: 1.2 s */   /* the stamp is up from "can't" (hovering) */
  var SC = [
    { id: 'roll', fn: 'rollScene', name: 'Your deleted photos', t0: 0 },
    { id: 'phone', fn: 'phoneScene', name: 'Swipe up to Recently Deleted', t0: wipeEnd(GT.r1, K.hookEnd + .1) },
    { id: 'bins', fn: 'binsScene', name: 'Delete moves it: 30 days', t0: wipeEnd(GT.r2, K.moves - .45) },
    { id: 'album', fn: 'albumScene', name: 'A shared album: their copy stays', t0: wipeEnd(GT.r3, K.friend - .45) },
    { id: 'confirm', fn: 'confirmScene', name: 'Empty it: can\'t get it back', t0: wipeEnd(GT.r4, K.really - .3) },
    { id: 'end', fn: 'endScene', name: 'Is yours empty?', t0: K.ENDT }
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
  /* quiet tags (RE-CREATED, AS REPORTED): an outline, never coral */
  function tag(g, text, x, y, a, rot, maxw, col, bg, px) { chip(g, text, x, y, { px: px || 38, wt: 700, fam: MONO, line: col || CREAM, lw: 3, fg: col || CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: bg || 'rgba(21,19,27,.9)', maxw: maxw || 820 }); }
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
     PROPS (all paper)
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

  /* =====================================================================================================
     PROPS (all paper, all drawn by hand)
     ===================================================================================================== */
  /* ---------- a paper snapshot: a cream print border round a flat drawing (no real photos, no faces) ---------- */
  var KINDS = ['dog', 'beach', 'sunset', 'cake', 'cat', 'mountain', 'balloon'];
  function scenePic(g, kind, w, h) {
    var c = function (col) { g.fillStyle = col; };
    if (kind === 'dog') {
      c('#a6c8cc'); g.fillRect(0, 0, w, h); c('#8fae6b'); g.fillRect(0, h * .72, w, h * .28);
      c('#6f4b2e'); el(g, w * .32, h * .44, w * .1, h * .19, .35); el(g, w * .68, h * .44, w * .1, h * .19, -.35);
      c('#a8774c'); el(g, w * .5, h * .5, w * .22, h * .22); c('#e1c39b'); el(g, w * .5, h * .6, w * .12, h * .09);
      c(INK); el(g, w * .42, h * .46, w * .025, w * .025); el(g, w * .58, h * .46, w * .025, w * .025); el(g, w * .5, h * .56, w * .04, w * .03);
    } else if (kind === 'beach') {
      c('#b4d4e4'); g.fillRect(0, 0, w, h); c('#5f97b8'); g.fillRect(0, h * .5, w, h * .2); c('#e5d19f'); g.fillRect(0, h * .68, w, h * .32);
      c('#f1d27c'); el(g, w * .74, h * .24, w * .1, w * .1);
      c('#c9a15f'); poly(g, [[w * .2, h * .9], [w * .26, h * .48], [w * .3, h * .9]]); g.fill();
      c('#4f8a5b'); el(g, w * .26, h * .46, w * .16, h * .05, -.3);
    } else if (kind === 'sunset') {
      c('#d6a174'); g.fillRect(0, 0, w, h); c('#e9c07f'); g.fillRect(0, h * .3, w, h * .3);
      c('#f4dd9c'); el(g, w * .5, h * .6, w * .17, w * .17); c('#5f5470'); poly(g, [[0, h], [0, h * .62], [w * .3, h * .5], [w * .6, h * .64], [w, h * .55], [w, h]]); g.fill();
    } else if (kind === 'cake') {
      c('#c8b9d9'); g.fillRect(0, 0, w, h); c('#ece4d6'); el(g, w * .5, h * .82, w * .38, h * .07);
      c('#f1e3c6'); g.fillRect(w * .22, h * .48, w * .56, h * .32); c('#d99aa9'); g.fillRect(w * .22, h * .44, w * .56, h * .1);
      c('#7fb0d6'); g.fillRect(w * .48, h * .24, w * .04, h * .2); c('#efc24e'); el(g, w * .5, h * .2, w * .03, h * .05);
    } else if (kind === 'cat') {
      c('#b9c99c'); g.fillRect(0, 0, w, h); c('#7b7d86');
      poly(g, [[w * .3, h * .42], [w * .34, h * .2], [w * .45, h * .34]]); g.fill(); poly(g, [[w * .7, h * .42], [w * .66, h * .2], [w * .55, h * .34]]); g.fill();
      el(g, w * .5, h * .5, w * .22, h * .19); el(g, w * .5, h * .92, w * .3, h * .24);
      c('#e6d36d'); el(g, w * .42, h * .48, w * .035, w * .03); el(g, w * .58, h * .48, w * .035, w * .03);
    } else if (kind === 'mountain') {
      c('#bcd6e6'); g.fillRect(0, 0, w, h); c('#7e90a4'); poly(g, [[0, h * .8], [w * .45, h * .25], [w, h * .8]]); g.fill();
      c('#f4f0e6'); poly(g, [[w * .34, h * .39], [w * .45, h * .25], [w * .56, h * .39], [w * .49, h * .36], [w * .43, h * .41]]); g.fill();
      c('#6e9a74'); g.fillRect(0, h * .78, w, h * .22);
    } else {
      c('#a9c3dc'); g.fillRect(0, 0, w, h); c('#d3b04f'); el(g, w * .5, h * .38, w * .17, h * .2);
      g.strokeStyle = INK; g.lineWidth = Math.max(2, w * .012); g.beginPath(); g.moveTo(w * .5, h * .58); g.quadraticCurveTo(w * .44, h * .76, w * .52, h * .95); g.stroke();
      c('#f4f0e6'); el(g, w * .2, h * .8, w * .14, h * .06); el(g, w * .3, h * .76, w * .1, h * .05);
    }
  }
  /* o: rot, s (scale about the centre), trash (a small delete mark), a (alpha), shadow, seed, clipX (only x < clipX) */
  function snap(g, kind, cx, cy, w, h, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(cx, cy); if (o.rot) g.rotate(o.rot); if (o.s) g.scale(o.s, o.s);
    var x0 = -w / 2, y0 = -h / 2, b = Math.max(6, w * .055);
    g.fillStyle = 'rgba(0,0,0,' + (o.shadow || .35) + ')'; g.fillRect(x0 + 5 + (o.lift || 0), y0 + 8 + (o.lift || 0) * 1.5, w, h);
    g.fillStyle = PAPER; g.fillRect(x0, y0, w, h);
    g.save(); g.translate(x0 + b, y0 + b); g.beginPath(); g.rect(0, 0, w - 2 * b, h - 2 * b); g.clip(); scenePic(g, kind, w - 2 * b, h - 2 * b); g.restore();
    g.beginPath(); g.rect(x0, y0, w, h); grainIn(g, x0, y0, w, h, strHash(kind) + 5, .5);
    if (o.badge > 0) { var rb = lerp(w * .1, 66, o.badge), bx = -x0 - b - rb * .9 + 20 * o.badge, by = y0 + b + rb * .9 - 20 * o.badge; g.fillStyle = 'rgba(0,0,0,.35)'; el(g, bx + 4, by + 6, rb, rb); g.fillStyle = INK; el(g, bx, by, rb, rb); g.strokeStyle = CREAM; g.lineWidth = 5; g.beginPath(); g.arc(bx, by, rb - 6, 0, 6.283); g.stroke(); trashGlyph(g, bx, by, rb * .9, CREAM); }
    else if (o.trash) { var r = w * .1; g.fillStyle = 'rgba(33,29,38,.82)'; el(g, -x0 - b - r * .9, y0 + b + r * .9, r, r); trashGlyph(g, -x0 - b - r * .9, y0 + b + r * .9, r * .9, CREAM); }
    g.restore();
  }
  function trashGlyph(g, cx, cy, r, col) {
    g.save(); g.translate(cx, cy); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = Math.max(2, r * .14); g.lineCap = 'round';
    g.beginPath(); g.moveTo(-r * .55, -r * .45); g.lineTo(r * .55, -r * .45); g.stroke();
    g.fillRect(-r * .16, -r * .62, r * .32, r * .14);
    poly(g, [[-r * .44, -r * .32], [r * .44, -r * .32], [r * .34, r * .6], [-r * .34, r * .6]]); g.fill();
    g.restore();
  }

  /* ---------- the paper padlock: a cream body with a keyhole, a grey paper shackle; shut (0 = open, 1 = shut) ---------- */
  function padlock(g, cx, cy, s, shut, a) {
    if (a != null && a <= 0) return;
    g.save(); if (a != null) g.globalAlpha *= clamp(a, 0, 1); g.translate(cx, cy); g.scale(s, s);
    var lift = 46 * (1 - clamp(shut == null ? 1 : shut, 0, 1));
    g.strokeStyle = '#b9b2a6'; g.lineWidth = 34; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(-82, -20 - lift); g.lineTo(-82, -98 - lift); g.arc(0, -98 - lift, 82, Math.PI, 0); g.lineTo(82, -20 - (lift > 0 ? lift : 0)); g.stroke();
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 4; g.beginPath(); g.arc(0, -98 - lift, 99, Math.PI, 0); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -142, -12, 300, 236, 34); g.fill();
    g.fillStyle = '#efe3c8'; rr(g, -150, -24, 300, 236, 34); g.fill();
    rr(g, -150, -24, 300, 236, 34); grainIn(g, -150, -24, 300, 236, 77, .8);
    g.strokeStyle = 'rgba(33,29,38,.5)'; g.lineWidth = 5; rr(g, -150, -24, 300, 236, 34); g.stroke();
    g.fillStyle = INK; el(g, 0, 70, 26, 26); poly(g, [[-14, 78], [14, 78], [20, 140], [-20, 140]]); g.fill();
    prop(g, 'padlock', -150, -200, 150, 212);
    g.restore();
  }

  /* ---------- a paper thumb (no skin tones, no nails): a cut-paper capsule pointing up ---------- */
  function thumb(g, x, y, rot, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -48, 10, 108, 330, 54); g.fill();
    g.fillStyle = '#d9c7a6'; rr(g, -56, 0, 112, 330, 56); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 4; rr(g, -56, 0, 112, 330, 56); g.stroke();
    g.strokeStyle = 'rgba(33,29,38,.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-30, 150); g.quadraticCurveTo(0, 162, 30, 150); g.stroke();
    g.restore();
  }

  /* ---------- the tear-off day calendar: a dark board with two rings, a pad of cream pages; `p` is the day (fractional:
     the pages between floor(p) - 4 and floor(p) are still falling) ---------- */
  function calendar(g, cx, top, w, h, p, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(cx, top); if (o.rot) g.rotate(o.rot);
    var ex1 = EXITING; if (o.ex) EXITING = true; o.moving = o.moving || (p > 1 && p < 30);
    var bh = Math.max(34, h * .13), day = Math.max(1, Math.floor(p + 1e-6));
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 8, 12, w, h, 18); g.fill();
    /* the pad under the top page: a few page edges */
    g.fillStyle = '#d8cfbe'; rr(g, -w / 2 + 4, bh + 6, w - 8, h - bh, 10); g.fill();
    var page = function (d, k) {
      /* k: 0 = in place, 1 = gone (torn off at the left end of the perforation, swings down and falls) */
      g.save(); var ex0 = EXITING, nr0 = NOREC; if (k > 0) EXITING = true; if (o.moving) NOREC = true;
      if (k > 0) { var e = eio(clamp(k, 0, 1)); g.translate(-w / 2, bh); g.rotate(.9 * e + .3 * Math.sin(d * 2.3) * e); g.translate(w / 2 + 40 * e * Math.sin(d), h * 1.1 * e * e); g.globalAlpha *= 1 - seg(k, .55, 1); }
      else g.translate(0, bh);
      g.fillStyle = '#f6efe2'; g.beginPath();
      g.moveTo(-w / 2, 0); for (var i = 0; i <= 18; i++) g.lineTo(-w / 2 + w * i / 18, (i % 2) * 5); g.lineTo(w / 2, h - bh); g.lineTo(-w / 2, h - bh); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(33,29,38,.18)'; g.lineWidth = 2; g.stroke();
      var lp = Math.max(36, Math.round(h * .12)), np = Math.round(h * .5);
      onprop(function () {
        txt(g, 'DAY', 0, (h - bh) * .2, lp, INK, 'center', 900, DISP, w * .8, 1, 36, 'expanded');
        txt(g, String(d), 0, (h - bh) * .62, np, INK, 'center', 900, DISP, w * .86, 1, 40, 'condensed');
      });
      EXITING = ex0; NOREC = nr0; g.restore();
    };
    for (var k = Math.max(1, day - 4); k < day; k++) { /* drawn later, on top */ }
    page(day, 0);
    for (var j = day - 1; j >= Math.max(1, day - 4); j--) page(j, (p - j) / 4 + (o.done || 0) * 1.2);
    /* the board and its two rings, over the pages' perforation */
    g.fillStyle = DARK; rr(g, -w / 2 - 6, 0, w + 12, bh, 12); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 6; [-w * .26, w * .26].forEach(function (x) { g.beginPath(); g.arc(x, bh * .2, bh * .32, Math.PI * .95, Math.PI * 2.05); g.stroke(); });
    prop(g, 'calendar', -w / 2 - 6, 0, w / 2 + 6, h);
    EXITING = ex1; g.restore();
  }

  /* ---------- a paper bin (an open tray): dark mouth, its contents, then a cream front with its labels ---------- */
  function bin(g, cx, top, w, h, labels, inside, o) {
    o = o || {}; var mh = Math.max(26, h * .1);
    g.save();
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, cx - w / 2 + 10, top + 14, w, h, 22); g.fill();
    g.fillStyle = '#3a342c'; rr(g, cx - w / 2, top, w, mh * 2, 20); g.fill();
    if (inside) { g.save(); g.beginPath(); g.rect(cx - w / 2 - 300, SAFE_BOX.y0 - 400, w + 600, top + mh + 400 - SAFE_BOX.y0 + 400); g.clip(); inside(); g.restore(); }
    g.fillStyle = BIN; cut(g, [[cx - w / 2, top + mh], [cx + w / 2, top + mh], [cx + w / 2 - w * .04, top + h], [cx - w / 2 + w * .04, top + h]], mulberry(strHash(labels.join('')) + 3), 1.4);
    g.beginPath(); g.rect(cx - w / 2, top + mh, w, h - mh); grainIn(g, cx - w / 2, top + mh, w, h - mh, strHash(labels[0]) + 9, .9);
    g.fillStyle = 'rgba(33,29,38,.18)'; g.fillRect(cx - w / 2, top + mh, w, 8);
    prop(g, 'bin', cx - w / 2, top, cx + w / 2, top + h);
    onprop(function () {
      var y = top + mh + (o.ly || 70);
      labels.forEach(function (L, i) { var px = i === 0 && labels.length > 1 ? (o.px0 || 40) : (o.px || 58); txt(g, L, cx, y, px, INK, 'center', 900, DISP, w * .86, 1, 36, 'condensed'); y += px * .5 + (o.px || 58) * .62; });
    });
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · frame 0: your deleted photos, still here (and the end: the same roll glides back into frame 0)
     ===================================================================================================== */
  var P = 270, SNS = 246, ROWY = [652, 916, 1180], F0OFF = 320, LIFT = { r: 0, j: -1 };
  var ROLL = [[0, 2, 4, 1, 5], [3, 6, 0, 2, 4], [5, 1, 3, 6, 2]];
  function roll(g, t, off, o) {
    o = o || {};
    for (var r = 0; r < 3; r++) for (var j = -4; j <= 8; j++) {
      var x = 510 + P * j + off; if (x < -200 || x > 1300) continue;
      var m = ((j % 5) + 5) % 5, bob = (o.bob == null ? 1 : o.bob) * 4 * Math.sin(t * 1.9 + j * 1.1 + r * 2);
      var lifted = r === LIFT.r && m === ((LIFT.j % 5) + 5) % 5 && o.lift != null;
      if (lifted) {
        var L = o.lift;   /* 1 = lifted above its slot (frame 0), 0 = in it */
        g.fillStyle = 'rgba(244,237,224,.22)'; g.fillRect(x - SNS / 2, ROWY[r] - 4, SNS, SNS);   /* its empty slot */
        snap(g, KINDS[ROLL[r][m]], x - 30 * L, ROWY[r] + SNS / 2 - 60 * L + bob, SNS, SNS, { rot: .14 * L, s: 1 + .1 * L, trash: true, badge: L, lift: 16 * L });
      } else snap(g, KINDS[ROLL[r][m]], x, ROWY[r] + SNS / 2 + bob, SNS, SNS, { trash: true, rot: .01 * Math.sin(j * 1.7 + r) });
    }
  }
  /* frame 0's headline: DELETED PHOTOS / STILL HERE (cream; the claim in 4 words, sound off) */
  function headline(g, a) {
    if (a <= 0 || !LIVE.text) return;
    txt(g, 'DELETED PHOTOS', CX, 404, 104, CREAM, 'center', 900, DISP, 836, a, 60, 'expanded');
    txt(g, 'STILL HERE', CX, 524, 124, CREAM, 'center', 900, DISP, 836, a, 60, 'expanded');
  }
  function rollScene(g, t) {
    var off = F0OFF * (1 - eout(seg(t, 0, .95))), bob = seg(t, .95, 1.6);
    roll(g, t, off, { bob: bob, lift: 1 - eio(seg(t, .45, 1.4)) });
    padlock(g, 510 + drift(t, .4, .5 * bob), 1040 + drift(t, 1.2, .5 * bob), 1, 1);
    headline(g, 1);
  }
  function endScene(g, t) {
    var u = seg(t, TEND - 1.6, TEND), off = -(P * 5 - F0OFF) * Math.pow(u, 1.55);   /* ends on frame 0's roll (≡ +320) at frame 0's speed */
    var bob = 1 - seg(t, TEND - 1.0, TEND - .3);
    roll(g, t, off, { bob: bob, lift: eout(seg(t, TEND - .45, TEND - .02)) });
    padlock(g, 510 + drift(t, .4, .5 * bob), 1040 + drift(t, 1.2, .5 * bob), 1, 1);
    /* the roll dims to 60 % behind the question, and comes back to full for the loop's last frames */
    var dim = .4 * fin(t, S('end').t0 - .3, 4) * (1 - seg(t, K.noEnd + .05, K.noEnd + .3));
    if (dim > 0) { g.fillStyle = 'rgba(19,22,25,' + dim + ')'; g.fillRect(SAFE_BOX.x0, SAFE_BOX.y0, SAFE_BOX.x1 - SAFE_BOX.x0, SAFE_BOX.y1 - SAFE_BOX.y0); }
    /* YES / NO: coral, the same size, neither one lit; gone before the last frame */
    var ya = fin(t, S('end').t0 - .3, 4) * (1 - seg(t, TEND - .07, TEND - .035)), yp = Math.min(1, pop(t, S('end').t0 - .3, 3));
    if (ya > 0) [['YES', 300], ['NO', 720]].forEach(function (c) {
      chip(g, c[0], c[1], 1300 + 16 * (1 - yp), { px: 116, wt: 900, bg: BG, line: HOT, lw: 8, fg: HOT, w: 300, h: 170, r: 60, shadow: true, a: ya });
    });
    headline(g, seg(t, K.noEnd + .1, K.noEnd + .22));
  }

  /* =====================================================================================================
     SCENE 2 · the viewer's test: open Photos, swipe up to Recently Deleted (a re-created, generic phone) → the lock → ?
     ===================================================================================================== */
  var PH = { x0: 226, x1: 794, y0: 640 };
  function phoneBody(g, x0, x1, y0, rad) {
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 10, y0 + 16, x1 - x0, 1300, rad); g.fill();
    g.fillStyle = DARK; rr(g, x0, y0, x1 - x0, 1300, rad); g.fill();
    g.strokeStyle = 'rgba(244,237,224,.25)'; g.lineWidth = 4; rr(g, x0, y0, x1 - x0, 1300, rad); g.stroke();
    prop(g, 'phone', x0, y0, x1, SAFE_BOX.y1);
  }
  function phoneScene(g, t) {
    var d = drift(t, .7, .5), y0 = PH.y0 + d, sx0 = PH.x0 + 18, sx1 = PH.x1 - 18, sy0 = y0 + 18;
    phoneBody(g, PH.x0, PH.x1, y0, 74);
    var scrollK = seg(t, K.swipe + .05, K.up + .45), openK = seg(t, K.deletedW + .02, K.deletedW + .4), exP = EXITING, nrP = NOREC;
    NOREC = true; EXITING = exP || (scrollK > 0 && scrollK < 1) || (openK > 0 && openK < 1) || (scrollK > 0 && openK < 1);
    g.save(); rr(g, sx0, sy0, sx1 - sx0, 1300, 58); g.clip();
    g.fillStyle = '#f6f0e4'; g.fillRect(sx0, sy0, sx1 - sx0, 1300);
    var scroll = 560 * eio(seg(t, K.swipe + .05, K.up + .45));
    var open = eio(seg(t, K.deletedW + .02, K.deletedW + .4));
    /* the library view, scrolled up by the thumb */
    if (open < 1) {
      g.save(); g.translate(-200 * open, 0);
      var c0 = sy0 + 110 - scroll;
      onprop(function () { txt(g, 'Photos', sx0 + 36, c0, 54, INK, 'left', 900, DISP, 400, 1, 40); });
      for (var i = 0; i < 9; i++) { var gx = sx0 + 22 + (i % 3) * 172, gy = c0 + 60 + Math.floor(i / 3) * 172; snap(g, KINDS[(i * 3 + 1) % 7], gx + 80, gy + 80, 160, 160, { shadow: .12 }); }
      var uy = c0 + 610;
      onprop(function () { txt(g, 'Utilities', sx0 + 36, uy, 44, '#5d564c', 'left', 800, DISP, 400, 1, 40); });
      [['Hidden', uy + 90], ['Recently Deleted', uy + 190]].forEach(function (row, k) {
        var ry = row[1], tap = k === 1 ? Math.sin(Math.PI * seg(t, K.recently - .05, K.recently + .3)) : 0, hi = k === 1 ? seg(t, K.recently - .05, K.recently + .05) : 0;
        if (hi > 0) { g.fillStyle = 'rgba(33,29,38,' + (.12 * hi) + ')'; rr(g, sx0 + 16, ry - 44, sx1 - sx0 - 32, 88, 18); g.fill(); }
        g.save(); g.translate(sx0 + 66, ry); g.scale(.17, .17); padlock(g, 0, 20, 1, 1); g.restore();
        onprop(function () { txt(g, row[0], sx0 + 120, ry, 46, INK, 'left', 800, DISP, 400, 1, 40); });
        g.strokeStyle = 'rgba(33,29,38,.4)'; g.lineWidth = 5; g.beginPath(); g.moveTo(sx1 - 50, ry - 14); g.lineTo(sx1 - 36, ry); g.lineTo(sx1 - 50, ry + 14); g.stroke();
        if (tap > 0) { g.strokeStyle = 'rgba(33,29,38,' + (.6 * (1 - tap)) + ')'; g.lineWidth = 6; g.beginPath(); g.arc(750, ry, 30 + 70 * tap, 0, 6.283); g.stroke(); }
      });
      g.restore();
    }
    /* the Recently Deleted album: locked, its photos frosted */
    if (open > 0) {
      g.save(); g.translate(300 * (1 - open), 0);
      g.fillStyle = '#f6f0e4'; g.fillRect(sx0, sy0, sx1 - sx0, 1300);
      onprop(function () { txt(g, 'Recently Deleted', sx0 + 36, sy0 + 110, 50, INK, 'left', 900, DISP, 470, 1, 40); });
      for (var q = 0; q < 12; q++) { var ax = sx0 + 22 + (q % 3) * 172, ay = sy0 + 170 + Math.floor(q / 3) * 172; snap(g, KINDS[(q * 5 + 2) % 7], ax + 80, ay + 80, 160, 160, { shadow: .1 }); }
      g.fillStyle = 'rgba(236,229,214,.86)'; g.fillRect(sx0, sy0 + 160, sx1 - sx0, 1200);
      g.restore();
    }
    g.restore(); NOREC = nrP; EXITING = exP;
    g.fillStyle = INK; el(g, 510, sy0 + 26, 11, 11);   /* the punch hole */
    tag(g, 'RE-CREATED', 660, sy0 + 40 + 0, 1, .0, 260, INK, '#f6f0e4', 36);   /* on the screen from its first frame */
    /* the padlock: grows out of the album on "So", a ? tag swings on it on "gone" */
    var pg = open > 0 ? eout(seg(t, K.deletedW + .2, K.ask + .1)) : 0;
    if (pg > 0) padlock(g, 510 + drift(t, 2, .4), lerp(1060, 1010, pg) + drift(t, 2.6, .4), lerp(.4, 1.05, pg), 1, Math.min(1, pg * 3));
    var qk = fin(t, K.ask - .05);
    if (qk > 0) { var sw = .18 * Math.sin((t - K.goneW) * 4.2) * Math.exp(-(t - K.goneW) * 1.3); g.save(); g.translate(660, 1150); g.rotate(sw); g.strokeStyle = CREAM; g.lineWidth = 5; g.beginPath(); g.moveTo(-80, -100); g.lineTo(0, -30); g.stroke(); chip(g, '?', 0, 60, { px: 160, wt: 900, bg: CREAM, fg: BG, w: 190, h: 190, r: 95, a: qk, s: .85 + .15 * Math.min(1, pop(t, K.ask - .05, 3.2)) }); g.restore(); }
    /* the paper thumb: rises on "swipe", pushes the list up, taps Recently Deleted, leaves */
    var tin = eout(seg(t, K.swipe - .45, K.swipe - .02)), push = eio(seg(t, K.swipe + .05, K.up + .45)), tapk = eio(seg(t, K.up + .45, K.recently - .05)), tout = seg(t, K.recently + .2, K.recently + .6);
    var thx = lerp(lerp(620, 660, push), 510 + 300 - 60, tapk), thy = lerp(1500, 1210, tin) - 420 * push + lerp(0, 240, tapk) * 0 + 900 * tout * tout;
    if (tin > 0 && tout < 1) thumb(g, thx, thy + lerp(0, 380 + 130, tapk) - 380 * tapk, -.08, 1 - tout);
    /* the path, word by word: PHOTOS › SWIPE UP › RECENTLY DELETED */
    var bc = [['PHOTOS', K.photosW - .1], ['SWIPE UP', K.swipe - .05], ['RECENTLY DELETED', K.recently - .05]], bx = 112;
    font(g, 42, 900, DISP, 'extra-condensed');
    var widths = bc.map(function (b) { return g.measureText(b[0]).width + 28; }), tot = widths.reduce(function (s, v) { return s + v; }, 0) + 2 * 46, sc = Math.min(1, 816 / tot);
    bx = 510 - tot * sc / 2;
    bc.forEach(function (b, i) {
      var a = fin(t, b[1]); var w = widths[i] * sc;
      if (a > 0) chip(g, b[0], bx + w / 2, 586, { px: Math.max(36, Math.round(42 * sc)), wt: 900, bg: CREAM, fg: BG, a: a, st: 'extra-condensed', shadow: false, s: .9 + .1 * Math.min(1, pop(t, b[1], 3.2)) });
      bx += w;
      if (i < 2) { if (fin(t, bc[i + 1][1]) > 0) txt(g, '›', bx + 23 * sc, 584, 48, CREAM, 'center', 900, DISP, 0, fin(t, bc[i + 1][1])); bx += 46 * sc; }
    });
  }

  /* =====================================================================================================
     SCENE 3 · hit delete: it moves into the bin → the calendar: DAY 1 → DAY 30, locked → Google's trash, 30 days too
     ===================================================================================================== */
  /* the pair layout's numbers, interpolated from the one-bin layout by k (0 = iPhone only, 1 = iPhone + Google) */
  function binLayout(k) {
    return {
      bx: lerp(510, 305, k), bw: lerp(720, 386, k), btop: lerp(1050, 1060, k), bh: lerp(420, 400, k),
      cx: lerp(712, 305, k), ctop: lerp(612, 818, k), cw: lerp(330, 240, k), ch: lerp(400, 230, k),
      lx: lerp(510, 305, k), ly: lerp(1112, 1112, k), ls: lerp(.62, .42, k)
    };
  }
  function binPhotos(g, cx, top, w, kinds, sh, t, shred) {
    kinds.forEach(function (kd, i) {
      var n = kinds.length, x = cx + (i - (n - 1) / 2) * w * .26, y = top + 6 - (i % 2) * 18 + 4 * Math.sin(t * 1.7 + i), s = w * .3, rot = (i - (n - 1) / 2) * .12;
      if (!shred || shred <= 0) { snap(g, kd, x, y, s, s, { rot: rot, shadow: .25 }); return; }
      /* the shred: five strips, tilted ≥ 15°, gaps ≥ 12 px, falling into the bin */
      for (var k = 0; k < 5; k++) {
        var f = clamp(shred * 1.15 - k * .04, 0, 1), sxo = (k - 2) * (s / 5 + 16 * Math.min(1, f * 3));
        g.save(); g.translate(x + sxo * Math.cos(rot), y + 340 * f * f); g.rotate(rot + (k % 2 ? .3 : -.28) * Math.min(1, f * 3));
        g.beginPath(); g.rect(-s / 10, -s / 2 - 10, s / 5, s + 20); g.clip(); snap(g, kd, -sxo, 0, s, s, { shadow: .2 });
        g.restore();
      }
    });
  }
  function binsScene(g, t) {
    var k = eio(seg(t, K.google - .35, K.google + .25)), L = binLayout(k), d = drift(t, .3, .5);
    var gin = eout(seg(t, K.google - .35, K.google + .3));
    /* the big snapshot: the thumb presses its trash button on "delete"; on "moves" it slides down into the bin */
    var mv = eio(seg(t, K.movesW - .08, K.movesW + .45)), cl = eout(seg(t, K.days - .55, K.days - .1));
    var into = mv >= 1;
    /* the iPhone bin and the Google bin */
    var day = dayAt(t, K.thirty - .04, RT.ri, K.DAY30);
    var iDay = day;
    bin(g, L.bx, L.btop + d, L.bw, L.bh, ['iPHONE', 'RECENTLY DELETED'], function () {
      binPhotos(g, L.bx, L.btop + d, L.bw, into ? ['beach', 'dog', 'cake'] : ['beach', 'cake'], 0, t);
    }, { px0: 40, px: lerp(60, 44, k), ly: lerp(220, 70, k) });
    if (gin > 0) {
      g.save(); g.translate(560 * (1 - gin), 0); var exg = EXITING; EXITING = exg || gin < 1;
      var gd = dayAt(t, K.gthirty - .04, RT.rg, K.GCAL);
      bin(g, 715, 1060 + d, 386, 400, ['GOOGLE PHOTOS', 'TRASH'], function () { binPhotos(g, 715, 1060 + d, 386, ['mountain', 'cat', 'sunset'], 0, t); }, { px0: 40, px: 58, ly: 70 });
      calendar(g, 715, 818 + drift(t, 2.2, .4), 240, 230, gd, { done: seg(t, K.GCAL, K.GCAL + .4) });
      EXITING = exg; g.restore();
    }
    /* the calendar clips onto the bin on "waits" (drops in from above), DAY 1 → DAY 30 on "thirty days" */
    if (cl > 0) calendar(g, L.cx, lerp(L.ctop - 700, L.ctop, cl) + drift(t, 1.4, .4), L.cw, L.ch, iDay, { ex: cl < 1, rot: .03 * (1 - cl), done: seg(t, K.DAY30, K.DAY30 + .5) });
    /* the padlock: drops onto the bin's front on "locked", shackle open; it snaps shut in the pause */
    var la = eout(seg(t, K.locked - .15, K.locked + .12));
    if (la > 0) padlock(g, lerp(350, 305, k), lerp(L.btop - 420, lerp(L.btop + 60, L.btop + 26, k), la) + d, lerp(1, .42, k), eout(seg(t, K.LOCK - .04, K.LOCK + .03)), 1);
    /* the lock's scope, next to the lock, from "locked" until the Google bin has landed */
    var sa = fin(t, K.locked - .05) * (1 - seg(t, K.gthirty - .1, K.gthirty + .1));
    if (sa > 0) {
      var sx = 305, sy = lerp(752, 650, k);
      g.save(); g.globalAlpha *= sa;
      sheet(g, sx - 208, sy - 112, sx + 208, sy + 112, 301, PAPER, 'scope');
      onprop(function () {
        txt(g, 'FACE ID OR TOUCH ID', sx, sy - 62, 42, INK, 'center', 900, DISP, 392, 1, 40, 'condensed');
        txt(g, 'BY DEFAULT · iOS 16+', sx, sy, 42, INK, 'center', 900, DISP, 392, 1, 40, 'condensed');
        txt(g, 'CAN BE TURNED OFF', sx, sy + 62, 42, INK, 'center', 900, DISP, 392, 1, 40, 'condensed');
      });
      g.restore();
    }
    /* the snapshot and its trash button (before it is in the bin) */
    if (!into) {
      var sx2 = lerp(510, L.bx, mv), sy2 = lerp(860, L.btop + 10, mv) + d * (1 - mv), ss = lerp(1, .3 * 720 / 470, mv);
      var press = Math.sin(Math.PI * seg(t, K.del - .05, K.del + .25));
      snap(g, 'dog', sx2, sy2 - 60 * Math.sin(Math.PI * mv) * 1.5, 470 * ss, 470 * ss, { rot: -.12 * mv, s: 1 - .03 * press, lift: 6 });
      var ba = 1 - seg(t, K.movesW - .2, K.movesW);
      if (ba > 0) { g.save(); g.globalAlpha *= ba; g.translate(840, 920 + d); g.scale(1 - .12 * press, 1 - .12 * press); g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 4, 7, 62, 62); g.fillStyle = CREAM; el(g, 0, 0, 62, 62); trashGlyph(g, 0, 0, 44, INK); prop(g, 'trashbtn', -62, -62, 62, 62); g.restore(); }
    }
    /* the thumb: up to the trash button, presses it on "delete", leaves */
    var tin = eout(seg(t, K.del - .5, K.del - .06)), tout = seg(t, K.delEnd + .05, K.delEnd + .45);
    if (tin > 0 && tout < 1) thumb(g, 846 + 40 * tout, lerp(1500, 940, tin) + 20 * Math.sin(Math.PI * seg(t, K.del - .05, K.del + .25)) + 700 * tout * tout, -.05, 1 - tout);
    /* the sources: Apple's page while it is the iPhone alone; Google's page when its bin lands */
    var aa = fin(t, K.iphone - .1) * (1 - seg(t, K.google - .4, K.google - .25));
    if (aa > 0) txt(g, 'APPLE SUPPORT · MAR 31, 2026', 510, 548, 40, CREAM, 'center', 800, DISP, 820, aa, 36, 'condensed');
    var ga = fin(t, K.google - .25);
    if (ga > 0) { txt(g, 'GOOGLE PHOTOS HELP', 715, 590, 40, CREAM, 'center', 800, DISP, 400, ga, 36, 'condensed'); txt(g, 'SAYS 30 DAYS · NOV 9, 2026', 715, 640, 38, CREAM, 'center', 800, DISP, 400, ga, 36, 'condensed'); }
  }

  /* =====================================================================================================
     SCENE 4 · a shared album (re-created): a friend saved a copy → the album is deleted, their copy stays
     ===================================================================================================== */
  function albumCard(g, x0, y0, x1, y1, t, half) {
    /* half: 0 whole; -1 / +1 draw only the left / right half of the torn card */
    g.save();
    if (half) { g.beginPath(); var r = mulberry(91), pts = []; for (var y = y0 - 20; y <= y1 + 20; y += 22) pts.push([520 + (r() - .5) * 36, y]);
      if (half < 0) { g.moveTo(x0 - 30, y0 - 30); pts.forEach(function (p) { g.lineTo(p[0], p[1]); }); g.lineTo(x0 - 30, y1 + 30); }
      else { g.moveTo(x1 + 30, y0 - 30); pts.forEach(function (p) { g.lineTo(p[0], p[1]); }); g.lineTo(x1 + 30, y1 + 30); }
      g.closePath(); g.clip(); }
    sheet(g, x0, y0, x1, y1, 401, PAPER, 'album');
    onprop(function () { txt(g, 'SHARED ALBUM', x0 + 34, y0 + 62, 54, INK, 'left', 900, DISP, 420, 1, 40, 'condensed'); });
    /* two avatars, drawn: a head and shoulders */
    [['YOU', x0 + 96, '#7d9fc2'], ['FRIEND', x0 + 266, '#c49a6a']].forEach(function (a) {
      g.fillStyle = a[2]; el(g, a[1], y0 + 176, 62, 62); g.fillStyle = '#f3ecdf'; el(g, a[1], y0 + 160, 22, 22); g.beginPath(); g.ellipse(a[1], y0 + 222, 38, 28, 0, Math.PI, 0); g.fill();
      onprop(function () { txt(g, a[0], a[1], y0 + 274, 38, INK, 'center', 900, DISP, 170, 1, 36, 'condensed'); });
    });
    ['dog', 'beach', 'cake'].forEach(function (kd, i) { snap(g, kd, x0 + 448 + i * 128 + (i === 0 ? 0 : 0), y0 + 190, 118, 118, { shadow: .2, rot: (i - 1) * .03 }); });
    g.restore();
  }
  function friendPhone(g, x0, y0, t, got) {
    phoneBody(g, x0, x0 + 360, y0, 54);
    g.save(); rr(g, x0 + 14, y0 + 14, 332, 1300, 42); g.clip();
    g.fillStyle = '#f6f0e4'; g.fillRect(x0 + 14, y0 + 14, 332, 1300);
    for (var i = 0; i < 12; i++) { if (i === 0) continue; var gx = x0 + 30 + (i % 3) * 104, gy = y0 + 70 + Math.floor(i / 3) * 104; snap(g, KINDS[(i * 2 + 3) % 7], gx + 48, gy + 48, 96, 96, { shadow: .12 }); }
    g.fillStyle = 'rgba(33,29,38,.08)'; g.fillRect(x0 + 30, y0 + 70, 96, 96);
    g.restore();
    g.fillStyle = INK; el(g, x0 + 180, y0 + 32, 8, 8);
    if (got) got();
  }
  function albumScene(g, t) {
    var d = drift(t, .9, .5);
    var tear = seg(t, K.ATEAR, K.ATEAR + .8);
    /* the shared album: whole, then torn in half on its delete; the halves tilt, part and fall */
    var x0 = 130, y0 = 572 + d, x1 = 890, y1 = 900 + d;
    if (tear <= 0) albumCard(g, x0, y0, x1, y1, t, 0);
    else if (tear < 1) {
      var e = eio(tear), exA = EXITING; EXITING = true;
      g.save(); g.translate(-60 * e, 700 * e * e); g.translate(300, y1); g.rotate(-.42 * e); g.translate(-300, -y1); albumCard(g, x0, y0, x1, y1, t, -1); g.restore();
      g.save(); g.translate(70 * e, 640 * e * e); g.translate(720, y1); g.rotate(.5 * e); g.translate(-720, -y1); albumCard(g, x0, y0, x1, y1, t, 1); g.restore();
      EXITING = exA;
    }
    /* the friend's phone and its library (the copy lands in its first slot) */
    var up = eio(seg(t, K.ATEAR + .25, K.ATEAR + .85)), U = -400 * up;
    var fx0 = 530, fy0 = 1030 + d + U;
    friendPhone(g, fx0, fy0, t, function () {
      var c = eio(seg(t, K.saved - .02, K.saved + .5));
      if (c > 0) { var cx = lerp(678, fx0 + 78, c), cy = lerp(790 + d, fy0 + 118, c) - 160 * Math.sin(Math.PI * c); snap(g, 'dog', cx, cy, lerp(118, 96, c), lerp(118, 96, c), { rot: .2 * Math.sin(Math.PI * c), shadow: .3 }); }
    });
    txt(g, 'FRIEND\'S PHONE', fx0 + 180, fy0 - 34, 38, CREAM, 'center', 800, DISP, 360, fin(t, S('album').t0 - .3), 36, 'condensed');
    if (tear <= 0) tag(g, 'RE-CREATED', 744, y0 + 62, 1, .02, 260, INK, PAPER, 36);
    /* the label next to the friend's phone; the stamp in the pause */
    var la = fin(t, K.SV - .02);
    if (la > 0) { chip(g, 'SAVED FROM A', 300, 1000 + d + U, { px: 46, wt: 900, bg: CREAM, fg: BG, a: la, st: 'condensed', shadow: false, s: .9 + .1 * Math.min(1, pop(t, K.SV - .02, 3.2)) }); chip(g, 'SHARED ALBUM', 300, 1068 + d + U, { px: 46, wt: 900, bg: CREAM, fg: BG, a: la, st: 'condensed', shadow: false, s: .9 + .1 * Math.min(1, pop(t, K.SV - .02, 3.2)) }); }
    var ca = fin(t, K.saved);
    if (ca > 0) txt(g, 'APPLE SUPPORT · OCT 6, 2026', 312, 1400 + U * .4, 38, CREAM, 'center', 800, DISP, 386, ca, 36, 'condensed');
    var ik = fin(t, K.stays - .05);
    if (ik > 0 && t < K.TS) { txt(g, 'THEIRS', 300, 1250 + d + U - 46, 88, CREAM, 'center', 900, DISP, 360, ik, 60, 'extra-condensed'); txt(g, 'STAYS', 300, 1250 + d + U + 46, 88, CREAM, 'center', 900, DISP, 360, ik, 60, 'extra-condensed'); }
    stamp(g, 'THEIRS\nSTAYS', 300, 1250 + d + U, t, K.TS, 86, CREAM, -.06, .5);
  }

  /* =====================================================================================================
     SCENE 5 · to really delete it: empty both (re-created confirm sheets) → the hero: CAN'T GET IT BACK
     ===================================================================================================== */
  function confirmSheet(g, cx, y0, lines, t, tapT, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    sheet(g, cx - 192, y0, cx + 192, y0 + 330, strHash(lines[0]), '#efe8da', 'sheet');
    var pr = Math.sin(Math.PI * seg(t, tapT - .04, tapT + .22));
    g.save(); g.translate(cx, y0 + 196); g.scale(1 - .05 * pr, 1 - .05 * pr);
    g.fillStyle = pr > 0 ? '#e2d7c4' : '#fbf8f1'; rr(g, -160, -lines.length * 32 - 16, 320, lines.length * 64 + 32, 22); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.2)'; g.lineWidth = 3; rr(g, -160, -lines.length * 32 - 16, 320, lines.length * 64 + 32, 22); g.stroke();
    onprop(function () { lines.forEach(function (L, i) { txt(g, L, 0, (i - (lines.length - 1) / 2) * 60, 46, BRICK, 'center', 800, DISP, 300, 1, 36, 'condensed'); }); });
    g.restore();
    tag(g, 'RE-CREATED', cx, y0 + 52, 1, 0, 300, INK, '#efe8da', 36);
    g.restore();
  }
  function confirmScene(g, t) {
    var st = 1 - seg(t, K.HERO + .1, K.HERO + .13);                 /* the hero hold: nothing drifts */
    var d = drift(t, .5, .5) * st;
    var down = eio(seg(t, K.gone - .25, K.gone + .3));             /* the sheets slide away, the bins drop into the lower band */
    var bt = lerp(830, 1036, down), cT = lerp(588, 760, down);
    /* the calendars, at DAY 30, torn off whole on "Apple" and "Google" (they flip up and fly off) */
    [[305, K.say - .05], [715, K.say + .05]].forEach(function (c, i) {
      var off = eio(seg(t, c[1] - .05, c[1] + .4));
      if (off >= 1) return;
      calendar(g, c[0] + 300 * off * (i ? 1 : -1), cT - 900 * off * off + drift(t, i * 2, .4) * st, 230, 220, 12, { ex: off > 0, rot: (i ? .5 : -.5) * off, done: 1 });
    });
    /* the two bins: their photos shred on "say" */
    var sh = seg(t, K.say - .05, K.say + .6);
    bin(g, 305, bt + d, 386, 380, ['iPHONE', 'RECENTLY DELETED'], function () { if (sh < 1) binPhotos(g, 305, bt + d, 386, ['beach', 'dog', 'cake'], 0, t, sh); }, { px0: 40, px: 44, ly: 70 });
    bin(g, 715, bt + d, 386, 380, ['GOOGLE PHOTOS', 'TRASH'], function () { if (sh < 1) binPhotos(g, 715, bt + d, 386, ['mountain', 'cat', 'sunset'], 0, t, sh); }, { px0: 40, px: 58, ly: 70 });
    /* the confirm sheets (Apple's and Google's own button labels), tapped on "empty" and on "Trash", then dismissed */
    var sy = 1150 + 420 * down + d;
    if (down < 1) { var ex = EXITING; EXITING = ex || down > 0; confirmSheet(g, 305, sy, ['Delete from', 'All Devices'], t, K.empty, 1); confirmSheet(g, 715, sy, ['Empty Trash'], t, K.rtrash, 1); EXITING = ex; }
    /* the thumb taps both buttons */
    var tin = eout(seg(t, K.empty - .45, K.empty - .05)), tmv = eio(seg(t, K.empty + .2, K.rtrash - .05)), tout = seg(t, K.rtrash + .2, K.rtrash + .55);
    var pr = Math.sin(Math.PI * seg(t, K.empty - .04, K.empty + .22)) + Math.sin(Math.PI * seg(t, K.rtrash - .04, K.rtrash + .22));
    if (tin > 0 && tout < 1) thumb(g, lerp(330, 740, tmv), lerp(1560, 1330, tin) + 18 * pr + 600 * tout * tout, -.05, 1 - tout);
    /* the hero: in the silence after "back", the coral stamp lands across the emptied bins */
    var ca = fin(t, K.apple - .1);
    if (ca > 0) txt(g, 'APPLE SUPPORT · GOOGLE PHOTOS HELP', 510, 518, 38, CREAM, 'center', 800, DISP, 820, ca, 36, 'condensed');
    /* the words ink in on "can't" (cream type), and the coral stamp slams down over them on the thump in the silence */
    var hk = fin(t, K.cant - .05, 4);
    if (hk > 0 && t < K.HERO) { txt(g, 'CAN\'T GET', 510, 770 - 82, 150, CREAM, 'center', 900, DISP, 760, hk, 100, 'extra-condensed'); txt(g, 'IT BACK', 510, 770 + 82, 150, CREAM, 'center', 900, DISP, 760, hk, 100, 'extra-condensed'); }
    stamp(g, 'CAN\'T GET\nIT BACK', 510, 770, t, K.HERO, 160, HOT, -.05, .45);
  }

  /* ---------- captions: the narrator's words in phrase cards (one size); stressed words get a cream pill (never coral) ---------- */
  /* caption cards broken on phrase boundaries: per line, its cards, and each card's lines as word counts */
  var CAPGROUPS = { test: [[2], [2, 3]], ask: [[5, 2]], moves: [[2], [3, 4]], days: [[3, 2], [3]], google: [[2, 3], [3]], friend: [[3, 3], [2, 2]], theirs: [[3], [4, 2]], really: [[4], [1, 2, 2]], gone: [[2, 3], [5]], end: [[4], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card) { var n = card.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['test', 'recently'], ['ask', 'gone'], ['moves', 'moves'], ['days', 'thirty'], ['days', 'locked'], ['google', 'thirty'], ['friend', 'shared'], ['theirs', 'stays'], ['really', 'empty'], ['gone', 'back'], ['end', 'empty']]
    .map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, that: 1, is: 1, it: 1, do: 1, from: 1, be: 1, or: 1, for: 1, if: 1, who: 1, but: 1, then: 1, their: 1 };
  var CAPPX = 64, CAPMIN = 1e9;
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
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = cpx * .3, maxw = 820, lines, lw;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; }); }
    function fixLines() {
      for (var L = 0; L < lines.length - 1; L++) {
        var last = lines[L][lines[L].length - 1];
        while (lines[L].length > 1 && GLUE[norm(words[last].w)]) { lines[L].pop(); lines[L + 1].unshift(last); last = lines[L][lines[L].length - 1]; }
      }
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    if (card0.split) {   /* explicit phrase lines; one wraps only if it is wider than the caption box */
      lines = []; var wi = 0;
      card0.split.forEach(function (n) { var ln = [], w = 0; for (var j = 0; j < n; j++, wi++) { if (w + ws[wi] > maxw && ln.length) { lines.push(ln); ln = []; w = 0; } ln.push(wi); w += ws[wi] + gap; } lines.push(ln); });
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    } else { lay2(); fixLines(); }
    var lh = cpx * 1.18, y0 = Math.max(430 - (lines.length - 1) * lh / 2, 308 + cpx * .9);   /* pill tops at y ≥ 304 */
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
  var NOISE, SCENES = { rollScene: rollScene, phoneScene: phoneScene, binsScene: binsScene, albumScene: albumScene, confirmScene: confirmScene, endScene: endScene };
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(46,62,66,.32)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function safeClip(g) { g.beginPath(); g.rect(SAFE_BOX.x0, SAFE_BOX.y0, SAFE_BOX.x1 - SAFE_BOX.x0, SAFE_BOX.y1 - SAFE_BOX.y0); g.clip(); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) { g.save(); SCENES[Sc.fn](g, t); g.restore(); }
  /* the tear: the outgoing scene is a calendar page; it tears off along its perforation (pivoting on the top-right
     corner, the left edge dropping first) and falls, the next scene already built under it */
  var PERF = (function () { var P2 = [], x = SAFE_BOX.x0; for (var i = 0; x <= SAFE_BOX.x1; i++, x += 22) P2.push([Math.min(x, SAFE_BOX.x1), SAFE_BOX.y0 + (i % 2 ? 9 : 0)]); return P2; })();
  function pagePath(g) { g.beginPath(); PERF.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.lineTo(SAFE_BOX.x1, SAFE_BOX.y1); g.lineTo(SAFE_BOX.x0, SAFE_BOX.y1); g.closePath(); }
  function tearMove(g, k) {
    var a = eio(clamp(k / .45, 0, 1)), f = clamp((k - .22) / .78, 0, 1);
    g.translate(0, 1600 * f * f); g.translate(SAFE_BOX.x1, SAFE_BOX.y0); g.rotate(.42 * a + .25 * f); g.translate(-SAFE_BOX.x1, -SAFE_BOX.y0);
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var wk = Nx ? seg(te, Nx.t0 - TW, Nx.t0) : 0;
    g.save(); safeClip(g);
    if (wk > 0) {
      var nr = NOREC; NOREC = wk < .5; drawScene(g, Nx, t); NOREC = nr;
      g.save(); tearMove(g, wk); EXITING = true; NOREC = true;
      g.save(); g.translate(8, 14); pagePath(g); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); g.restore();
      pagePath(g); g.save(); g.clip(); stage(g); drawScene(g, Sc, t); g.restore();
      pagePath(g); g.strokeStyle = CREAM; g.lineWidth = 5; g.stroke();
      EXITING = false; NOREC = nr; g.restore();
      /* the stub the page tore from: a thin cream strip along the top of the box */
      g.save(); g.globalAlpha *= 1 - seg(wk, .6, 1); g.fillStyle = CREAM; g.beginPath(); g.moveTo(SAFE_BOX.x0, SAFE_BOX.y0);
      PERF.forEach(function (p, i) { g.lineTo(p[0], p[1] + 10 + (i % 2 ? -9 : 0)); }); g.lineTo(SAFE_BOX.x1, SAFE_BOX.y0); g.closePath(); g.fill(); g.restore();
    } else drawScene(g, Sc, t);
    g.restore();
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) captions(g, t, 1 - seg(t, K.noEnd + .04, K.noEnd + .14));
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 72, 800, DISP, 'expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('Deleted photos aren\'t', CX, 384);
    var b = 'really gone', bp = 72; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 470 - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 470); g.restore();
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
  var GAIN = { r1: 1.0, r2: 1.0, lk: .22, r3: .22, sv: .55, ts: .2, r4: .3, hero: .22 };
  var TYPE = { r1: 'paper', r2: 'paper', lk: 'knock', r3: 'paper', sv: 'pop', ts: 'slap', r4: 'paper', hero: 'thump' };
  ['ri', 'rg'].forEach(function (pre) { for (var i = 0; i < 5; i++) { TYPE[pre + i] = 'tick'; GAIN[pre + i] = .22 + .03 * i; } });
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
    /* a flat paper slap (the quiet THEIRS STAYS stamp) */
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); }
    /* a soft paper pop (the SAVED label) */
    function popS(t, g) { g = g || 1; band(t, .03, 3200, 1.8, 5 * g, .001, .02); band(t + .002, .05, 1500, 2.2, .8 * g, .001, .02); }
    /* a calendar page tearing along its perforation: a run of tiny 1.5–3.5 kHz crackles over a soft paper body */
    function ripS(t, g) {
      g = g || 1; var r = mulberry(Math.floor(t * 1000));
      for (var k = 0; k < 13; k++) { var tk = t + k * .011 + r() * .004; band(tk, .018, 1500 + r() * 2000, 1.3, (1.6 + r() * 1.4) * g * (1 - k / 18), .001, .03, -.15 + k * .02); }
      var n = noise(t, .17), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .8; bp.frequency.setValueAtTime(2400, t); bp.frequency.exponentialRampToValueAtTime(1200, t + .16);
      var ob = bus(1, .04, 0); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .02, 1.1 * g], [t + .12, .7 * g], [t + .17, 0]]);
    }
    /* a paper tick (a snapshot settling, a button, a page landing): 1–3 kHz, 50 ms */
    function tickS(t, g) {
      g = g || 1;
      osc('sine', 2100, t, t + .06, 1, [[t, 0], [t + .003, .5 * g], [t + .05, 0]], .02);
      osc('triangle', 1250, t, t + .06, 1, [[t, 0], [t + .003, .3 * g], [t + .04, 0]], .02);
      band(t, .03, 2400, 1.4, 1.2 * g, .001, .01);
    }
    /* the padlock's shackle snapping shut: a small metal-and-paper knock with a 1–3 kHz click */
    function knockS(t, g) {
      g = g || 1;
      osc('triangle', 360, t, t + .13, 1, [[t, 0], [t + .003, .5 * g], [t + .05, .25 * g], [t + .12, 0]], .03);
      osc('sine', 2650, t, t + .07, 1, [[t, 0], [t + .002, .35 * g], [t + .06, 0]], .02);
      band(t, .05, 1900, 1.2, 3.2 * g, .001, .03);
    }
    EV.forEach(function (e) {
      if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'pop') { popS(e.t, e.g); slapS(e.t + .002, LAYER * e.g); }
      else if (e.type === 'paper') ripS(e.t, e.g);
      else if (e.type === 'knock') knockS(e.t, e.g);
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹›✓✕–@!>$(),:§+/=½'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initTimes();
  /* the hero hold: from the stamp settling to the first word after it (the only still in the film); then a slow push */
  var HOLD = { t0: K.HERO + .13, t1: K.ENDT - TW };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'deletephoto', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
