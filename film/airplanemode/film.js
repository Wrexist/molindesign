/* "Airplane mode isn't only for planes." — Factory #28 on Tech, explained, after ../coldbattery/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the signal ring: flat cream paper arcs step out of whatever transmits. On frame 0 they pulse out of
   the airplane-mode tile and fold back when it toggles on; on the paper map a phone on the ground reaches one tower, the
   same ring dropped from the plane falls wide and lights every tower it reaches; the drone's ring does it too. Scenes
   change under a bank of cut-paper clouds (right → left forward, left → right for the 1991 flashback). One hero stamp:
   STILL BANNED (coral) beside paragraph (a) of a re-created FCC rule page; coral is also on the end card's YES / NO and
   nowhere else. Generic tile, airliner, phone, drone and towers drawn by hand: no logos, no liveries, no real UI.
   Every scene is clipped to the safe box x 92–928, y 302–1428. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#111a26', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f3ecdf', INK = '#211d26', DARK = '#2a2b31', CASE = '#e4ddce', SCREEN = '#0b0e12';
  var CLOUD = '#e3e6e8', CLOUD2 = '#c4ccd4', FOG = '#aeb9c4', WING = '#cfc6b5', STEEL = '#8a96a6', BLUEINK = '#24427a';
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
  BODY.ping = .13; BODY.swish = .21;
  var K = {
    only: at('hook', 'only'), planes: at('hook', 'planes'), hookEnd: lend('hook'),
    ask: start('ask'), who: at('ask', 'who'), askEnd: lend('ask'),
    faa: start('faa'), y13: at('faa', '2013'), faaW: at('faa', 'faa'), panel: at('faa', 'panel'), found: at('faa', 'found'), most: at('faa', 'most'), tol: at('faa', 'tolerate'), faaEnd: lend('faa'),
    dip: start('dip'), low: at('dip', 'low'), visE: wend('dip', 'visibility'), about: at('dip', 'about'), hundred: at('dip', 'hundred'), dipEnd: lend('dip'),
    crew: start('crew'), thenE: wend('crew', 'then'), the2: at('crew', 'the'), crewW: at('crew', 'crew'), ask2: at('crew', 'ask'), offW: at('crew', 'off'), crewEnd: lend('crew'),
    fcc: start('fcc'), banE: wend('fcc', 'ban'), thats: at('fcc', 'thats'), fccW: at('fcc', 'fcc'), y91: at('fcc', '1991'), fccEnd: lend('fcc'),
    tower: start('tower'), up: at('tower', 'up'), reaches: at('tower', 'reaches'), many: at('tower', 'many'), towersW: at('tower', 'towers'), once: at('tower', 'once'), towerEnd: lend('tower'),
    drone: start('drone'), monthE: wend('drone', 'month'), the3: at('drone', 'the'), fcc2: at('drone', 'fcc'), voted: at('drone', 'voted'), drones: at('drone', 'drones'), those: at('drone', 'those'), droneEnd: lend('drone'),
    sig: start('sig'), sigEnd: lend('sig'), still: start('still'), stillW: at('still', 'still'), stillEnd: lend('still'),
    end: start('end'), think: at('end', 'think'), plane: at('end', 'plane'), endEnd: lend('end'), yes: at('yn', 'yes'), noE: at('yn', 'no'), noEnd: wend('yn', 'no')
  };
  /* the tower ticks: one per tower, accelerating, all inside the silence after "once." */
  var NTK = 13, TK = [];
  (function () {
    place('tg', 'click', voiceEnd('hook', K.ask) + .05, .17, K.hookEnd, K.ask);                 /* the tile toggles on */
    place('sw1', 'swish', voiceEnd('ask', K.faa) + .02, .16, K.askEnd, K.faa);                  /* cloud bank → the FAA, 2013 */
    if (GT.sw1 != null) place('ys', 'slap', GT.sw1 + BODY.swish + .04, .16, GT.sw1 + BODY.swish, K.faa);   /* 2013 lands */
    place('pf', 'paper', voiceEnd('faa', K.dip) + .05, .16, K.faaEnd, K.dip);                  /* the quote strip flips to the hedge */
    place('lv', 'knock', voiceEnd('dip', K.crew) + .05, .16, K.dipEnd, K.crew);                 /* LOW VISIBILITY */
    place('po', 'click', voiceEnd('crew', K.fcc) + .04, .16, K.crewEnd, K.fcc);                 /* the phone switches off */
    if (GT.po != null) place('sw3', 'swish', GT.po + BODY.click + .06, .16, GT.po, K.fcc);       /* cloud bank, back to 1991 */
    place('y9', 'slap', voiceEnd('fcc', K.tower) + .04, .16, K.fccEnd, K.tower);                 /* 1991 lands */
    /* the towers light one by one, faster and faster */
    var t0 = nearGap(voiceEnd('tower', K.drone) + .04, 'tick', .16), iv = .075;
    if (t0 != null) for (var i = 0; i < NTK; i++) {
      var tt = t0; for (var j = 0; j < i; j++) tt += Math.max(.025, .065 - j * .004);
      var ok = nearGap(tt, 'tick', .16); if (ok == null || Math.abs(ok - tt) > .002) break; TK.push(+tt.toFixed(3));
    }
    var lastTk = TK.length ? TK[TK.length - 1] : K.towerEnd + .2;
    place('oc', 'slap', lastTk + .07, .16, lastTk, K.drone);                                     /* OCT 2026 lands with the band chip */
    place('sw4', 'swish', voiceEnd('drone', K.sig) + .04, .16, K.droneEnd, K.sig);              /* cloud bank → the rule page */
    place('hero', 'thump', voiceEnd('sig', K.still) + .02, .16, K.sigEnd, K.still);             /* STILL BANNED */
    place('sw5', 'swish', K.stillEnd + 1.3, .16, K.stillEnd + .2, K.end);                        /* cloud bank → frame 0 */
    var ce = voiceEnd('end', K.yes);
    place('ty', 'tick', ce + .1, .15, K.endEnd, K.yes);                                          /* YES taps down */
    place('tn', 'tick', (GT.ty != null ? GT.ty : ce + .1) + .12, .15, K.endEnd, K.yes);          /* NO taps down */
  })();
  var TW = .55;                                          /* a cloud-bank wipe: 0.55 s */
  K.TG = GT.tg != null ? GT.tg : K.hookEnd + .12;        /* the toggle */
  K.HERO = GT.hero != null ? GT.hero : K.sigEnd + .15;
  K.LV = GT.lv != null ? GT.lv : K.dipEnd + .15;
  K.PO = GT.po != null ? GT.po : K.crewEnd + .1;          /* the phone goes dark on the click, after "off." */
  K.YS = GT.ys != null ? GT.ys : K.faa - .2;
  K.PF = GT.pf != null ? GT.pf : K.dip - .25;              /* 2013 lands */
  K.Y9 = GT.y9 != null ? GT.y9 : K.fccEnd + .15;          /* 1991 lands */
  K.TK0 = TK.length ? TK[0] : K.towerEnd + .2;
  K.OC = GT.oc != null ? GT.oc : K.drone - .1;            /* OCT 2026 and the band chip */
  K.DRG = GT.dr != null ? GT.dr : K.droneEnd + .1;
  function wipeEnd(n, fb) { return GT[n] != null ? GT[n] + .3 : fb; }   /* a wipe ends just after its swish */
  var SC = [
    { id: 'tile', fn: 'tileScene', name: 'Not only for planes', t0: 0 },
    { id: 'plane', fn: 'planeScene', name: 'FAA 2013: most airliners can tolerate phones', t0: wipeEnd('sw1', K.faa - .1) },
    { id: 'cabin', fn: 'cabinScene', name: 'The crew may ask: phone off', t0: K.the2 + .05 },
    { id: 'map', fn: 'mapScene', name: 'FCC 1991: many towers at once', t0: Math.max(wipeEnd('sw3', K.fcc), K.PO + .25 + TW), dir: -1 },
    { id: 'hero', fn: 'heroScene', name: 'Cell signal: still banned', t0: wipeEnd('sw4', K.sig + .05) },
    { id: 'end', fn: 'endScene', name: 'Did you think it was for the plane?', t0: GT.sw5 != null ? GT.sw5 + .5 : K.end - .1 }
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
    if (ei < 1) { g.translate(560 * (1 - ei), 0); EXITING = true; }
    if (eo > 0) { EXITING = true; g.translate(x0, y0 + h); g.rotate(-.22 * eo); g.translate(-x0, -(y0 + h)); g.translate(-260 * eo, 900 * eo * eo); }
    sheet(g, x0, y0, x0 + w, y0 + h, seed, PAPER, 'quote');
    onprop(function () {
      lines.forEach(function (L, i) { txt(g, L, x0 + 30, y0 + 22 + lh * (i + .5), px, INK, 'left', 700, DISP, w - 60, 1, 36, 'condensed'); });
      txt(g, credit, x0 + 30, y0 + h - 30, 36, '#5d564c', 'left', 800, DISP, w - 300, 1, 36, 'condensed');
    });
    if (retag !== false) tag(g, 'RE-CREATED', x0 + w - 138, y0 + h - 32, 1, 0, 250, INK, PAPER, 34);
    EXITING = ex0;
    g.restore();
    return h;
  }

  /* ---------- the airplane-mode glyph (top view, nose up) ---------- */
  function planeGlyph(g, x, y, s, rot, outline) {
    g.save(); g.translate(x, y); g.rotate(rot == null ? Math.PI / 4 : rot); g.scale(s, s);
    var P = [function () { g.beginPath(); g.roundRect(-.075, -.52, .15, 1, .075); },
      function () { poly(g, [[-.06, -.1], [-.52, .14], [-.52, .24], [-.06, .1], [.06, .1], [.52, .24], [.52, .14], [.06, -.1]]); },
      function () { poly(g, [[-.05, .3], [-.22, .44], [-.22, .51], [-.05, .45], [.05, .45], [.22, .51], [.22, .44], [.05, .3]]); }];
    if (outline) { var fs = g.fillStyle; g.strokeStyle = INK; g.lineWidth = 2 * outline / s; g.lineJoin = 'round'; P.forEach(function (f) { f(); g.stroke(); }); g.fillStyle = fs; }
    P.forEach(function (f) { f(); g.fill(); });
    g.restore();
  }

  /* ---------- the control-centre tile: a paper square, the airplane button, a toggle switch (no words) ---------- */
  function tile(g, cx, cy, S, on, rot, pvx, pvy) {
    g.save();
    if (rot) { g.translate(pvx, pvy); g.rotate(rot); g.translate(-pvx, -pvy); }
    var x0 = cx - S / 2, y0 = cy - S / 2, r = S * .2;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 14, y0 + 20, S, S, r); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, S, S, r); g.fill();
    rr(g, x0, y0, S, S, r); grainIn(g, x0, y0, S, S, 77, .8);
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 4; rr(g, x0, y0, S, S, r); g.stroke();
    prop(g, 'tile', x0, y0, x0 + S, y0 + S);
    /* the button: grey when off, ink when on (the glyph flips cream) */
    var bx = cx, by = cy - S * .1, R = S * .29, k = clamp(on, 0, 1);
    g.fillStyle = 'rgba(0,0,0,.25)'; el(g, bx + 6, by + 9, R, R);
    g.fillStyle = k > .5 ? INK : '#efe5d1'; el(g, bx, by, R, R);
    if (k <= .5) { g.strokeStyle = 'rgba(33,29,38,.6)'; g.lineWidth = Math.max(3, S * .008); g.beginPath(); g.arc(bx, by, R, 0, 6.283); g.stroke(); }
    if (k > 0 && k < 1) { g.save(); g.globalAlpha *= 1 - Math.abs(k - .5) * 2; g.fillStyle = CREAM; el(g, bx, by, R * 1.04, R * 1.04); g.restore(); }
    g.fillStyle = k > .5 ? CREAM : INK; planeGlyph(g, bx, by, R * 1.25);
    /* the switch: knob slides right when on */
    var sw = S * .36, sh = S * .13, sx = cx - sw / 2, sy = cy + S * .3 - sh / 2;
    g.fillStyle = k > .5 ? INK : '#b9b2a4'; rr(g, sx, sy, sw, sh, sh / 2); g.fill();
    g.fillStyle = k > .5 ? CREAM : '#fbf7ef'; var kx = lerp(sx + sh / 2, sx + sw - sh / 2, eio(k)); el(g, kx, sy + sh / 2, sh * .4, sh * .4);
    g.restore();
  }

  /* ---------- the signal ring: flat cream paper arcs (no glow), stepping outward, with a small drop shadow ---------- */
  function arcs(g, x, y, r0, r1, t, a, fold, spans) {
    if (a <= 0) return;
    spans = spans || [[-2.95, -2.3], [-.84, -.19]];
    for (var k = 0; k < 3; k++) {
      var u = frac(t * .75 + k / 3), r = lerp(r0, r1, u) * (1 - fold), al = a * (1 - seg(u, .62, 1)) * seg(u, 0, .08);
      if (r < 8 || al <= 0) continue;
      var w = lerp(22, 12, u);
      spans.forEach(function (sp2) {
        g.save(); g.globalAlpha *= al; g.lineCap = 'round';
        g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = w; g.beginPath(); g.arc(x + 6, y + 9, r, sp2[0], sp2[1]); g.stroke();
        g.strokeStyle = CREAM; g.beginPath(); g.arc(x, y, r, sp2[0], sp2[1]); g.stroke();
        g.restore();
      });
    }
  }
  /* a full ring falling wide (on the map): stroke circle with a shadow */
  function ring(g, x, y, r, a, w) {
    if (a <= 0 || r <= 2) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = w || 12; g.beginPath(); g.arc(x + 6, y + 9, r, 0, 6.283); g.stroke();
    g.strokeStyle = CREAM; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.stroke();
    g.restore();
  }

  /* ---------- the cut-paper airliner (side view, nose right, no livery). o: lit (window glow k), rot ---------- */
  function airliner(g, cx, cy, L, rot, o) {
    o = o || {};
    var h = L * .12;
    g.save(); g.translate(cx, cy); if (rot) g.rotate(rot);
    function body(col, dx, dy) {
      g.fillStyle = col;
      g.beginPath(); g.roundRect(-.42 * L + dx, -h / 2 + dy, .92 * L, h, h / 2); g.fill();
      poly(g, [[-.42 * L + dx, -h / 2 + dy], [-.52 * L + dx, -h / 2 - .025 * L + dy], [-.52 * L + dx, -h / 2 + .02 * L + dy], [-.38 * L + dx, h / 2 + dy]]); g.fill();
      poly(g, [[-.34 * L + dx, -h / 2 + dy], [-.5 * L + dx, -h / 2 - .17 * L + dy], [-.44 * L + dx, -h / 2 - .17 * L + dy], [-.25 * L + dx, -h / 2 + dy]]); g.fill();
    }
    body('rgba(0,0,0,.4)', 10, 14);
    /* far wing (behind) */
    g.fillStyle = '#b9b09f'; poly(g, [[.06 * L, -.05 * h], [-.08 * L, -.42 * h - .04 * L], [-.13 * L, -.42 * h - .04 * L], [-.03 * L, -.05 * h]]); g.fill();
    body(PAPER, 0, 0);
    g.beginPath(); g.roundRect(-.42 * L, -h / 2, .92 * L, h, h / 2); grainIn(g, -.52 * L, -h, L, 2 * h, 909, .7);
    /* belly line, windows, cockpit */
    g.fillStyle = '#ddd5c6'; g.beginPath(); g.roundRect(-.4 * L, h * .12, .88 * L, h * .38, h * .19); g.fill();
    g.fillStyle = 'rgba(33,29,38,.78)';
    for (var x = -.3 * L; x < .36 * L; x += .034 * L) { g.beginPath(); g.roundRect(x, -h * .22, .014 * L, h * .2, .007 * L); g.fill(); }
    if (o.lit > 0) { g.save(); g.globalAlpha *= clamp(o.lit, 0, 1); g.fillStyle = CREAM; g.beginPath(); g.roundRect(.08 * L - .004 * L, -h * .26, .022 * L, h * .28, .01 * L); g.fill(); g.restore(); }
    g.fillStyle = INK; poly(g, [[.44 * L, -h * .22], [.475 * L, -h * .2], [.485 * L, -h * .06], [.44 * L, -h * .08]]); g.fill();
    /* near wing, engine, tailplane */
    g.fillStyle = 'rgba(0,0,0,.3)'; poly(g, [[.1 * L + 6, .08 * h + 8], [-.1 * L + 6, .5 * h + .07 * L + 8], [-.16 * L + 6, .5 * h + .07 * L + 8], [-.02 * L + 6, .08 * h + 8]]); g.fill();
    g.fillStyle = WING; poly(g, [[.1 * L, .08 * h], [-.1 * L, .5 * h + .07 * L], [-.16 * L, .5 * h + .07 * L], [-.02 * L, .08 * h]]); g.fill();
    g.fillStyle = '#e9e2d4'; g.beginPath(); g.roundRect(-.02 * L, .5 * h + .005 * L, .13 * L, .05 * L, .025 * L); g.fill();
    g.fillStyle = 'rgba(33,29,38,.55)'; el(g, .108 * L, .5 * h + .03 * L, .008 * L, .021 * L);
    g.fillStyle = WING; poly(g, [[-.38 * L, -.05 * h], [-.5 * L, .12 * h], [-.46 * L, .12 * h], [-.32 * L, -.05 * h]]); g.fill();
    prop(g, 'airliner', -.52 * L, -h / 2 - .17 * L, .5 * L, .5 * h + .08 * L);
    g.restore();
  }

  /* ---------- paper clouds ---------- */
  var CLD = {};
  function puffs(seed, w) {
    var key = seed + ':' + Math.round(w); if (CLD[key]) return CLD[key];
    var r = mulberry(seed), P = [], n = Math.max(3, Math.round(w / 70));
    for (var i = 0; i < n; i++) { var u = (i + .5) / n; P.push({ x: (u - .5) * w, y: -Math.sin(u * Math.PI) * w * .14 * (.6 + r() * .6), r: w * (.12 + r() * .1) * (.7 + .5 * Math.sin(u * Math.PI)) }); }
    CLD[key] = P; return P;
  }
  function cloud(g, x, y, w, seed, col) {
    var P = puffs(seed, w);
    g.fillStyle = 'rgba(0,0,0,.3)'; P.forEach(function (p) { el(g, x + p.x + 7, y + p.y + 10, p.r, p.r); }); g.fillRect(x - w / 2 + 7, y - 2 + 10, w, w * .12);
    g.fillStyle = col || CLOUD; P.forEach(function (p) { el(g, x + p.x, y + p.y, p.r, p.r); }); g.fillRect(x - w / 2, y - 2, w, w * .12);
    g.fillStyle = 'rgba(255,255,255,.35)'; P.forEach(function (p, i) { if (i % 2 === 0) el(g, x + p.x - p.r * .25, y + p.y - p.r * .3, p.r * .45, p.r * .3); });
  }
  /* the wipe: a tall bank of opaque paper clouds whose centre sits on xb */
  var BANK = null;
  function bank(g, xb, t) {
    if (!BANK) { var r = mulberry(4401); BANK = []; for (var i = 0; i < 28; i++) BANK.push({ y: SAFE_BOX.y0 - 40 + i * 62 + r() * 30, dx: (r() - .5) * 150, r: 95 + r() * 80, c: r() < .35 ? CLOUD2 : CLOUD }); }
    g.fillStyle = 'rgba(0,0,0,.35)'; BANK.forEach(function (b) { el(g, xb + b.dx + 12, b.y + 14, b.r, b.r); });
    BANK.forEach(function (b) { g.fillStyle = b.c; el(g, xb + b.dx, b.y + 6 * Math.sin(t * 2 + b.y), b.r, b.r); });
    g.fillStyle = 'rgba(255,255,255,.3)'; BANK.forEach(function (b, i) { if (i % 3 === 0) el(g, xb + b.dx - b.r * .3, b.y - b.r * .35, b.r * .4, b.r * .25); });
  }
  /* fog: a long wavy paper band */
  function fogBand(g, x0, x1, y, h, seed, t, col) {
    var r = mulberry(seed), P = [], n = Math.ceil((x1 - x0) / 40);
    for (var i = 0; i <= n; i++) P.push([x0 + i * 40, y - h / 2 + Math.sin(i * .9 + seed) * 10 + (r() - .5) * 8]);
    for (i = n; i >= 0; i--) P.push([x0 + i * 40, y + h / 2 + Math.sin(i * .7 + seed * 2) * 10 + (r() - .5) * 8]);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.save(); g.translate(6, 8); poly(g, P); g.fill(); g.restore();
    g.fillStyle = col || FOG; poly(g, P); g.fill();
  }

  /* ---------- a cell tower: a paper lattice, three antenna panels; lit = cream with two small arcs ---------- */
  function tower(g, x, base, h, lit) {
    var k = clamp(lit, 0, 1), col = k > .5 ? CREAM : STEEL, top = base - h;
    g.save();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(x - h * .17 + 5, base + 6); g.lineTo(x - h * .04 + 5, top + 6); g.moveTo(x + h * .17 + 5, base + 6); g.lineTo(x + h * .04 + 5, top + 6); g.stroke();
    g.strokeStyle = col; g.lineWidth = Math.max(4, h * .04); g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x - h * .17, base); g.lineTo(x - h * .04, top); g.moveTo(x + h * .17, base); g.lineTo(x + h * .04, top); g.stroke();
    g.lineWidth = Math.max(2.5, h * .022); g.beginPath();
    for (var i = 0; i < 5; i++) { var y0 = lerp(base, top, i / 5), y1 = lerp(base, top, (i + 1) / 5), w0 = lerp(.17, .04, i / 5) * h, w1 = lerp(.17, .04, (i + 1) / 5) * h; g.moveTo(x - w0, y0); g.lineTo(x + w1, y1); g.moveTo(x + w0, y0); g.lineTo(x - w1, y1); }
    g.stroke();
    if (k > .5) { g.fillStyle = 'rgba(244,237,224,.85)'; poly(g, [[x - h * .17, base], [x - h * .04, top], [x + h * .04, top], [x + h * .17, base]]); g.fill(); }
    g.fillStyle = col; [-1, 0, 1].forEach(function (j) { g.beginPath(); g.roundRect(x + j * h * .085 - h * .03, top - h * .14, h * .06, h * .16, 3); g.fill(); });
    if (k > 0) {
      var s = .7 + .3 * Math.min(1.04, k);
      g.strokeStyle = CREAM; g.lineWidth = Math.max(4, h * .035); g.lineCap = 'round'; g.globalAlpha *= clamp(k * 1.5, 0, 1);
      [h * .2, h * .32].forEach(function (rr0) { g.beginPath(); g.arc(x, top - h * .06, rr0 * s, -2.5, -1.95); g.stroke(); g.beginPath(); g.arc(x, top - h * .06, rr0 * s, -1.19, -.64); g.stroke(); });
    }
    g.restore();
    prop(g, 'tower', x - h * .17, top - h * .2, x + h * .17, base);
  }

  /* ---------- a generic phone (round punch-hole, no notch, no logo); o: on (0..1 lit screen), rot ---------- */
  function phone(g, cx, top, w, h, o) {
    o = o || {};
    g.save();
    if (o.rot) { g.translate(o.px, o.py); g.rotate(o.rot); g.translate(-o.px, -o.py); }
    var x0 = cx - w / 2, r = w * .14, bz = w * .05;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 10, top + 14, w, h, r); g.fill();
    g.fillStyle = CASE; rr(g, x0, top, w, h, r); g.fill();
    rr(g, x0, top, w, h, r); grainIn(g, x0, top, w, h, 501, .8);
    g.strokeStyle = 'rgba(33,29,38,.4)'; g.lineWidth = 3; rr(g, x0, top, w, h, r); g.stroke();
    var sx0 = x0 + bz, sy0 = top + bz, sw = w - 2 * bz, sh = h - 2 * bz, sr = r - bz * .7;
    g.fillStyle = SCREEN; rr(g, sx0, sy0, sw, sh, sr); g.fill();
    if (o.on > 0) {
      g.save(); rr(g, sx0, sy0, sw, sh, sr); g.clip(); g.globalAlpha *= clamp(o.on, 0, 1);
      g.fillStyle = '#3d6378'; g.fillRect(sx0, sy0, sw, sh);
      g.fillStyle = '#2f5163'; poly(g, [[sx0, sy0 + sh * .7], [sx0 + sw * .3, sy0 + sh * .58], [sx0 + sw * .62, sy0 + sh * .68], [sx0 + sw, sy0 + sh * .55], [sx0 + sw, sy0 + sh], [sx0, sy0 + sh]]); g.fill();
      if (o.glyph) { g.fillStyle = CREAM; planeGlyph(g, sx0 + sw - sw * .14, sy0 + sw * .14, sw * .12); }
      g.restore();
    }
    g.fillStyle = '#04060a'; el(g, cx, sy0 + sw * .08, w * .026, w * .026);
    prop(g, 'phone', x0, top, x0 + w, top + h);
    g.restore();
  }

  /* ---------- a paper drone (side view): body, two arms, spinning rotors, skids ---------- */
  function drone(g, x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -58 + 6, -18 + 9, 116, 38, 14); g.fill();
    g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(-110, -22); g.lineTo(110, -22); g.stroke();
    g.fillStyle = PAPER; rr(g, -58, -18, 116, 38, 14); g.fill();
    g.fillStyle = INK; el(g, 30, 2, 9, 9);
    [-110, 110].forEach(function (ax) {
      g.fillStyle = INK; g.fillRect(ax - 5, -40, 10, 20);
      var sp2 = Math.abs(Math.sin(t * 31 + ax)); g.fillStyle = 'rgba(244,237,224,.85)'; el(g, ax, -44, 18 + 40 * sp2, 6);
    });
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(-40, 20); g.lineTo(-52, 42); g.lineTo(-20, 42); g.moveTo(40, 20); g.lineTo(52, 42); g.lineTo(20, 42); g.stroke();
    g.restore();
    prop(g, 'drone', x - 130 * s, y - 50 * s, x + 130 * s, y + 44 * s);
  }

  /* a face-down card (back: a big ink "?") that flips (scaleX through 0) to its face; k 0 = back, 1 = face */
  function card(g, cx, cy, w, h, k, face, a) {
    if (a <= 0) return;
    var sx = Math.abs(Math.cos(Math.PI * clamp(k, 0, 1)));
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(cx, cy); g.scale(Math.max(.02, sx), 1);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 8, -h / 2 + 11, w, h, 26); g.fill();
    g.fillStyle = PAPER; rr(g, -w / 2, -h / 2, w, h, 26); g.fill();
    rr(g, -w / 2, -h / 2, w, h, 26); grainIn(g, -w / 2, -h / 2, w, h, 333 + Math.round(cx), .8);
    var ex = EXITING; if (sx < .95) EXITING = true;
    if (k < .5) {
      g.strokeStyle = 'rgba(33,29,38,.55)'; g.lineWidth = 4; rr(g, -w / 2 + 18, -h / 2 + 18, w - 36, h - 36, 16); g.stroke();
      onprop(function () { txt(g, '?', 0, 6, 170, INK, 'center', 900, DISP, 0, 1, 60); });
    } else face(g, w, h);
    EXITING = ex;
    g.restore();
    prop(g, 'card', cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
  }
  /* the header row of a scene: [AGENCY] what it guards ……… [YEAR] */
  function agencyChip(g, text, x, y, a, flipK) {
    if (a <= 0) return;
    var sx = flipK == null ? 1 : Math.max(.02, Math.abs(Math.cos(Math.PI * clamp(flipK, 0, 1))));
    g.save(); g.translate(x, y); g.scale(sx, 1); var ex = EXITING; if (sx < .95) EXITING = true;
    chip(g, flipK != null && flipK < .5 ? '?' : text, 0, 0, { px: 54, wt: 900, bg: CREAM, fg: INK, a: a, w: 170, h: 78, r: 18, st: 'condensed' });
    EXITING = ex; g.restore();
  }
  function yearChip(g, text, x, y, a, dx) {
    if (a <= 0) return;
    chip(g, text, x + (dx || 0), y, { px: 52, wt: 900, bg: CREAM, fg: INK, a: a, h: 78, r: 18, st: 'condensed', rot: .03 });
  }

  /* =====================================================================================================
     SCENE 1 · frame 0: NOT ONLY FOR PLANES over the airplane-mode tile, arcs pulsing; the search bar; two face-down cards
     ===================================================================================================== */
  /* frame 0: a 640 px tile centred on x 540, tilted 12°, already gliding up (its top-left corner travels ~310 px in 1.1 s);
     its whole outline stays inside x 110–910 and above y 1428 on every frame (nothing is cut by the safe box) */
  var F0 = { cx: 540, cy: 1045, S: 640, rot: -.21, cyUp: 795, sUp: .92 };
  function headline(g, t, a) {
    if (a <= 0 || !LIVE.text) return;
    txt(g, 'NOT ONLY', 540, 345, 108, CREAM, 'center', 900, DISP, 760, a, 60, 'expanded');
    txt(g, 'FOR PLANES', 540, 450, 108, CREAM, 'center', 900, DISP, 760, a, 60, 'expanded');
  }
  /* the arcs hug the tile's two upper sides: spans kept shallow and radii short so they never reach the headline or the rail */
  /* the signal arcs are printed on the tile around the button (ink on paper): they step outward while the radio is on
     and fold back into the button on the toggle; they never leave the tile, so nothing nears the rail or the headline */
  function f0Arcs(g, cx, cy, s, t, fold) {
    var S0 = F0.S * s, bx = cx, by = cy - S0 * .1, R = S0 * .29;
    for (var k = 0; k < 3; k++) {
      var u = frac(t * .75 + k / 3), r = lerp(R + S0 * .035, R + S0 * .135, u) * (1 - fold) + R * .6 * fold, al = (1 - seg(u, .7, 1)) * seg(u, 0, .1) * (1 - seg(fold, .6, 1));
      if (al <= 0) continue;
      g.save(); g.globalAlpha *= al; g.lineCap = 'round'; g.strokeStyle = 'rgba(33,29,38,.72)'; g.lineWidth = lerp(16, 9, u) * s;
      [[-2.75, -2.15], [-.99, -.39]].forEach(function (sp2) { g.beginPath(); g.arc(bx, by, r, sp2[0], sp2[1]); g.stroke(); });
      g.restore();
    }
  }
  function tileScene(g, t) {
    if (LAYER === 'bg') return;
    var gl = sio(seg(t, 0, 1.1)), rot = lerp(F0.rot, 0, gl);
    var on = seg(t, K.TG, K.TG + .12);
    var shrink = eio(seg(t, K.ask - .05, K.ask + .6));
    var s = lerp(lerp(1, F0.sUp, gl), .5, shrink), cx = F0.cx, cy = lerp(lerp(F0.cy, F0.cyUp, gl), 860, shrink);
    var bob = seg(t, 1, 1.6), d = drift(t, .3, .5 * bob);
    /* the arcs pulse out of the button while the radio is on; on the toggle they fold back in */
    var fold = eio(seg(t, K.TG, K.TG + .3));
    tile(g, cx, cy + d, F0.S * s, on, rot, cx, cy + d);
    if (fold < 1) { g.save(); g.translate(cx, cy + d); g.rotate(rot); g.translate(-cx, -(cy + d)); f0Arcs(g, cx, cy + d, s, t, fold); g.restore(); }
    /* the headline lifts away as the search bar rises into its place */
    var SB = K.TG + .05, ha = 1 - seg(t, SB - .1, SB + .08);
    headline(g, t, ha);
    /* the search bar: drops in over the tile at ~1.2 s, typed by ~1.6 s, settles under the caption on the toggle */
    var SBin = K.only - .1, sa = fin(t, SBin, 4) * (1 - seg(t, K.askEnd + .02, K.askEnd + .3));
    if (sa > 0 && LIVE.text) {
      var y = lerp(690, 600, eio(seg(t, SB - .1, SB + .3))) + 30 * (1 - Math.min(1, pop(t, SBin, 3))) - 30 * eio(seg(t, K.askEnd + .02, K.askEnd + .3));
      g.save(); g.globalAlpha *= sa;
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 158, y - 66, 780, 140, 40); g.fill();
      g.fillStyle = PAPER; rr(g, 150, y - 74, 780, 140, 40); g.fill();
      g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.arc(216, y - 8, 24, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(233, y + 10); g.lineTo(252, y + 30); g.stroke();
      var L1 = 'why airplane mode?', k = seg(t, SBin + .05, SBin + .4), n = Math.round(L1.length * k), s1 = L1.slice(0, n);
      var typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
      onprop(function () { if (s1) txt(g, s1, 292, y - 4, 62, INK, 'left', 800, DISP, 0, 1); });
      NOREC = nr;
      if (typing && Math.floor(t * 4) % 2 === 0) { font(g, 62, 800, DISP); var cw = g.measureText(s1).width; g.fillStyle = INK; g.fillRect(296 + cw, y - 36, 5, 64); }
      g.restore();
    }
    /* two face-down cards rise into the lower band on "who" (they fade up from just below; never cut by the box) */
    var ci = eout(seg(t, K.who - .2, K.who + .35));
    var nudge = 14 * Math.sin(Math.PI * seg(t, K.who + .05, K.who + .35)) + 8 * Math.sin(t * 2.3);
    if (ci > 0) {
      var cy2 = lerp(1265, 1220, ci) - nudge * ci, exc = EXITING; if (ci < 1) EXITING = true;
      card(g, 330, cy2, 340, 300, 0, null, ci);
      card(g, 750, cy2 + 6, 340, 300, 0, null, ci); EXITING = exc;
    }
  }
  function endScene(g, t) {
    /* frame 0's picture at full opacity: the tile (off) and its arcs; YES / NO; after "no" the headline returns and the
       tile glides back down to frame 0's place and tilt, so the last frame is frame 0 */
    if (LAYER === 'bg') return;
    var u = sio(seg(t, TEND - 1.0, TEND)), rot = lerp(0, F0.rot, u), tt = t - TEND;
    var s = lerp(F0.sUp, 1, u), cy = lerp(F0.cyUp + 110, F0.cy, u);
    var bob = 1 - seg(t, TEND - 1.2, TEND - .6), d = drift(t, .3, .5 * bob);
    tile(g, F0.cx, cy + d, F0.S * s, 0, rot, F0.cx, cy + d);
    g.save(); g.translate(F0.cx, cy + d); g.rotate(rot); g.translate(-F0.cx, -(cy + d)); f0Arcs(g, F0.cx, cy + d, s, tt, 0); g.restore();
    var E0 = S('end').t0;
    var ta = fin(t, E0 - .3, 4) * (1 - seg(t, K.noEnd, K.noEnd + .15));
    if (ta > 0) chip(g, 'TODAY', 760 - 120 * (1 - eout(seg(t, E0 - .3, E0))), 560, { px: 60, wt: 900, bg: CREAM, fg: INK, a: ta * seg(t, E0 - .3, E0 - .1), st: 'condensed', rot: .03, r: 18 });
    var ya = fin(t, E0 - .2, 4) * (1 - seg(t, TEND - .3, TEND - .2)), yp = Math.min(1, pop(t, E0 - .2, 3));
    if (ya > 0) [['YES', 330, GT.ty], ['NO', 750, GT.tn]].forEach(function (c) {
      var tp = c[2] == null ? 0 : Math.sin(Math.PI * seg(t, c[2] - .03, c[2] + .12)), sc = 1 - .07 * tp;
      chip(g, c[0], c[1], 1235 + 16 * (1 - yp) + 10 * tp, { px: 116, wt: 900, bg: BG, line: HOT, lw: 8, fg: HOT, w: 300, h: 170, r: 60, shadow: true, a: ya, s: sc });
    });
    headline(g, t, seg(t, K.noEnd + .1, K.noEnd + .22));
  }

  /* =====================================================================================================
     SCENE 2 · the FAA, 2013: Huerta's sentence; the airliner cruising; then fog, the approach and 1 in 100
     ===================================================================================================== */
  var QA = ['“…most commercial airplanes', 'can tolerate radio interference', 'from portable electronic', 'devices.”'];
  var QB = ['“…some landing systems', 'may not be proven to', 'tolerate the interference.”'];
  /* the header row: a face-down "?" chip flips to the agency on its name; the year card slaps down in the silence */
  function faaHeader(g, t, fk, yk) {
    agencyChip(g, 'FAA', 190, 612, 1, fk);
    var la = fk == null ? 1 : seg(fk, .5, .9);
    if (la > 0) txt(g, 'THE PLANE\'S RADIOS', 300, 614, 44, CREAM, 'left', 900, DISP, 420, la, 36, 'condensed');
    slapChip(g, '2013', 830, 612, t, yk == null ? -9 : yk);
  }
  /* a year card slapped down: full opacity from its first frame, it drops in from 1.35x and settles (no slide, never cut) */
  function slapChip(g, text, x, y, t, t0, o) {
    if (t < t0 - .08) return;
    var k = eout(seg(t, t0 - .08, t0)), sc = lerp(1.35, 1, k), ex = EXITING; if (k < 1) EXITING = true;
    chip(g, text, x, y - 30 * (1 - k), Object.assign({ px: 52, wt: 900, bg: CREAM, fg: INK, h: 78, r: 18, st: 'condensed', rot: .03, s: sc, a: seg(t, t0 - .08, t0 - .05) }, o || {}));
    EXITING = ex;
  }
  /* the airliner on the FAA line and the dip: it travels ≥ 250 px on each line (so each line is a new frame) */
  function faaPlane(t) {
    var cr = sio(seg(t, K.faa, K.faaEnd + .3)), desc = eio(seg(t, K.low - .1, K.visE + .45));
    return { x: lerp(352, 612, cr) + lerp(0, 148, desc), y: lerp(1150, 1345, desc), L: lerp(480, 320, desc), rot: lerp(-.02, .1, desc), desc: desc };
  }
  function planeScene(g, t) {
    var d = drift(t, .9, .5);
    var FG = K.visE + .1, P = faaPlane(t), desc = P.desc;
    if (LAYER === 'bg') {
      /* clouds stream past under the plane (parallax) across the full width; the fog bands come in after "visibility" */
      [[0, 1330, 260, 31, .7], [1, 1240, 200, 32, 1.1], [2, 1390, 320, 33, .5]].forEach(function (c) {
        var x = 1300 - frac((t * 60 * c[4] + c[0] * 420) / 1600) * 1600;
        cloud(g, x, c[1] + 30 * desc, c[2], c[3], c[0] === 1 ? CLOUD2 : CLOUD);
      });
      var fk = eio(seg(t, FG - .1, FG + .5));
      if (fk > 0) {
        fogBand(g, lerp(-1200, -40, fk), lerp(-1200, -40, fk) + 1160, 1372 + d * .5, 60, 3, t, FOG);
        fogBand(g, lerp(1200, -40, fk), lerp(1200, -40, fk) + 1160, 1430 - d * .5, 56, 5, t, CLOUD2);
      }
      return;
    }
    /* the runway: a paper strip in perspective; it rises a little as the plane descends (fully inside the box) */
    var rw = eout(seg(t, K.low, K.about + .4));
    if (rw > 0) {
      var ry = lerp(1300, 1288, rw);
      g.save(); g.globalAlpha *= seg(rw, 0, .4);
      g.fillStyle = 'rgba(0,0,0,.35)'; poly(g, [[560, ry + 8 + 120], [920, ry + 8 + 120], [830, ry + 8], [700, ry + 8]]); g.fill();
      g.fillStyle = '#4b5564'; poly(g, [[545, ry + 120], [905, ry + 120], [815, ry], [690, ry]]); g.fill();
      g.strokeStyle = CREAM; g.lineWidth = 5; g.setLineDash([18, 16]); g.beginPath(); g.moveTo(752, ry + 6); g.lineTo(725, ry + 118); g.stroke(); g.setLineDash([]);
      g.fillStyle = CREAM; for (var i = 0; i < 5; i++) el(g, 680 - i * 26, ry + 4 + i * 4, 5, 5);
      prop(g, 'runway', 545, ry, 905, ry + 120);
      g.restore();
    }
    /* the airliner: cruising big from left to right on the FAA line, then smaller and nose-down onto the approach */
    airliner(g, P.x, P.y + d, P.L, P.rot);
    faaHeader(g, t, seg(t, K.faaW - .2, K.faaW + .1), K.YS);
    /* Huerta's sentence (word for word) slides in on "2013"; in the silence before "The exception" the strip flips over
       (a paper card turning) to the low-visibility hedge, word for word, 48+ px */
    var fl = seg(t, K.PF, K.PF + .18);
    function flipQ(lines, px, seed, sy, inn) {
      var ex = EXITING; if (sy < .98) EXITING = true;
      g.save(); g.translate(0, 810); g.scale(1, Math.max(.02, sy)); g.translate(0, -810);
      quote(g, 110, 668, 800, lines, px, 'FAA · OCT 31, 2013', seed, inn, 0); g.restore(); EXITING = ex;
    }
    if (fl < .5) flipQ(QA, 46, 211, 1 - eio(fl * 2), seg(t, K.y13 - .1, K.y13 + .25));
    else flipQ(QB, 50, 223, eio(fl * 2 - 1), 1);
    var ok = fin(t, K.most - .05) * (1 - seg(t, K.low - .15, K.low + .05));
    if (ok > 0) tolPanel(g, 510, 1330 + d, ok, pop(t, K.most - .05, 3.2));
    /* 1 in 100: ten rows of ten small planes (28+ px), one filled cream at 2x with a heavy ink outline */
    var ga = fin(t, K.visE);
    if (ga > 0) {
      g.save(); g.globalAlpha *= ga;
      var gx = 120, gy = 950, pt = 33;
      for (var r0 = 0; r0 < 10; r0++) for (var c0 = 0; c0 < 10; c0++) {
        var one = r0 === 3 && c0 === 6;
        var x = gx + c0 * pt + pt / 2, y = gy + r0 * pt + pt / 2 + d * .4;
        if (!one) { g.fillStyle = 'rgba(244,237,224,.42)'; planeGlyph(g, x, y, 29, -Math.PI / 2); }
      }
      var ox = gx + 6 * pt + pt / 2, oy = gy + 3 * pt + pt / 2 + d * .4, k2 = t >= K.hundred ? Math.min(1.04, pop(t, K.hundred, 3.4)) : 0;
      if (k2 > 0) { g.fillStyle = CREAM; planeGlyph(g, ox, oy, 58 * k2, -Math.PI / 2, 6); }
      else { g.fillStyle = 'rgba(244,237,224,.8)'; planeGlyph(g, ox, oy, 29, -Math.PI / 2); }
      prop(g, 'grid', gx, gy, gx + 10 * pt, gy + 10 * pt);
      g.restore();
      txt(g, 'ABOUT 1 IN 100', 695, 1000 + d * .4, 62, CREAM, 'center', 900, DISP, 420, ga, 40, 'condensed');
      txt(g, 'FLIGHTS', 695, 1064 + d * .4, 62, CREAM, 'center', 900, DISP, 420, ga, 40, 'condensed');
    }
    /* LOW VISIBILITY: a quiet cream stamp in the pause after the line */
    stamp(g, 'LOW VISIBILITY', 695, 1140 + d * .4, t, K.LV, 54, CREAM, -.05, .5);
  }
  /* what the FAA panel found, in its own terms (no tick: "can tolerate", not "OK") */
  function tolPanel(g, x, y, a, p) {
    var s = .9 + .1 * Math.min(1, p);
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s);
    var w = 780, h = 132;
    recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[panel] MOST AIRLINERS CAN TOLERATE IT');
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -w / 2 + 6, -h / 2 + 9, w, h, 22); g.fill();
    g.fillStyle = CREAM; rr(g, -w / 2, -h / 2, w, h, 22); g.fill();
    var cb = LBL ? xbox(g, -w / 2, -h / 2, w / 2, h / 2) : null; CHIPBOX = cb;
    txt(g, 'MOST AIRLINERS CAN TOLERATE IT', 0, -20, 52, INK, 'center', 900, DISP, w - 40, 1, 44, 'condensed');
    txt(g, 'FAA PANEL · 2013', 0, 36, 38, '#5d564c', 'center', 800, DISP, w - 40, 1, 36, 'condensed');
    CHIPBOX = null; g.restore();
  }
  /* the drone vote's verdict: one cream plate, two rows, ink marks drawn by hand (a tick and a cross; never coral) */
  function verdict(g, x, y, a, p) {
    var s = .9 + .1 * Math.min(1, p), w = 660, h = 136;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s);
    recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[plate] DRONES / YOUR CELL SIGNAL');
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -w / 2 + 6, -h / 2 + 9, w, h, 22); g.fill();
    g.fillStyle = CREAM; rr(g, -w / 2, -h / 2, w, h, 22); g.fill();
    CHIPBOX = LBL ? xbox(g, -w / 2, -h / 2, w / 2, h / 2) : null;
    txt(g, 'DRONES:', -w / 2 + 28, -32, 56, INK, 'left', 900, DISP, 0, 1, 56, 'condensed');
    txt(g, 'YOUR CELL SIGNAL:', -w / 2 + 28, 34, 56, INK, 'left', 900, DISP, 0, 1, 56, 'condensed');
    CHIPBOX = null;
    g.strokeStyle = INK; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round';
    var mx = w / 2 - 52;
    g.beginPath(); g.moveTo(mx - 20, -32); g.lineTo(mx - 4, -16); g.lineTo(mx + 22, -50); g.stroke();
    g.beginPath(); g.moveTo(mx - 18, 16); g.lineTo(mx + 18, 52); g.moveTo(mx + 18, 16); g.lineTo(mx - 18, 52); g.stroke();
    g.restore();
  }
  function okChip(g, text, x, y, a, p) {
    var s = .9 + .1 * Math.min(1, p);
    chip(g, '     ' + text, x, y, { px: 52, wt: 900, bg: CREAM, fg: INK, a: a, st: 'condensed', s: s });
    g.save(); g.globalAlpha *= a; font(g, 52, 900, DISP, 'condensed'); var w = g.measureText('     ' + text).width;
    var tx = x - w / 2 + 6; g.strokeStyle = INK; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(tx, y + 2); g.lineTo(tx + 12, y + 14); g.lineTo(tx + 34, y - 12); g.stroke(); g.restore();
  }

  /* =====================================================================================================
     SCENE 3 · the cabin: the call chime lights, the crew asks, the window-seat phone switches off (after "off.")
     ===================================================================================================== */
  var QC = ['“…passengers should', 'be asked to', 'turn-off devices.”'];
  function cabinScene(g, t) {
    var d = drift(t, .4, .5), C0 = S('cabin').t0;
    if (LAYER === 'bg') {
      /* seat backs fill the bottom, across the full width (background) */
      [[150, 1400], [560, 1395], [970, 1405]].forEach(function (s0, j) {
        var x0 = s0[0] - 160, y0 = s0[1] - 60, sw = 320, col = j === 1 ? '#5a6b80' : '#4c5c70';
        function back(dx, dy) { g.beginPath(); g.moveTo(x0 + dx, y0 + 300 + dy); g.lineTo(x0 + dx, y0 + 70 + dy); g.quadraticCurveTo(x0 + dx, y0 + dy, x0 + 70 + dx, y0 - 8 + dy); g.lineTo(x0 + sw - 70 + dx, y0 - 8 + dy); g.quadraticCurveTo(x0 + sw + dx, y0 + dy, x0 + sw + dx, y0 + 70 + dy); g.lineTo(x0 + sw + dx, y0 + 300 + dy); g.closePath(); }
        g.fillStyle = 'rgba(0,0,0,.4)'; back(8, 10); g.fill();
        g.fillStyle = col; back(0, 0); g.fill();
        /* the headrest: a soft curved pillow */
        g.fillStyle = '#9aa6b5'; g.beginPath(); g.moveTo(x0 + 70, y0 + 34); g.quadraticCurveTo(x0 + sw / 2, y0 - 6, x0 + sw - 70, y0 + 34); g.quadraticCurveTo(x0 + sw / 2, y0 + 58, x0 + 70, y0 + 34); g.fill();
        /* the tray table: a line and a latch */
        g.strokeStyle = 'rgba(17,26,38,.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 + 34, y0 + 120); g.lineTo(x0 + sw - 34, y0 + 120); g.stroke();
        g.fillStyle = '#8f9bab'; rr(g, x0 + sw / 2 - 18, y0 + 92, 36, 14, 5); g.fill();
      });
      return;
    }
    /* the window: a thick paper frame, fog streaming past outside */
    var wx = 262, wy = 1165, wrx = 128, wry = 168;
    g.fillStyle = 'rgba(0,0,0,.4)'; el(g, wx + 10, wy + 14, wrx + 34, wry + 34);
    g.fillStyle = '#d9d2c3'; el(g, wx, wy, wrx + 34, wry + 34);
    g.save(); g.beginPath(); g.ellipse(wx, wy, wrx, wry, 0, 0, 6.283); g.clip();
    g.fillStyle = '#6e7c8b'; g.fillRect(wx - wrx, wy - wry, 2 * wrx, 2 * wry);
    for (var i = 0; i < 6; i++) { var fx = wx + 260 - frac(t * .45 + i / 6) * 640; fogBand(g, fx - 160, fx + 160, wy - wry + 40 + i * 62, 46, 11 + i, t, i % 2 ? FOG : CLOUD2); }
    g.restore();
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 5; g.beginPath(); g.ellipse(wx, wy, wrx, wry, 0, 0, 6.283); g.stroke();
    prop(g, 'window', wx - wrx - 34, wy - wry - 34, wx + wrx + 34, wy + wry + 34);
    /* LOW VISIBILITY (from the approach) stays pinned on the window frame */
    stamp(g, 'LOW VISIBILITY', wx + 22, wy + 40, t, -9, 44, CREAM, -.08, .5);
    /* the phone, held up in the window seat; it goes dark on the click after "off." */
    var lit = 1 - seg(t, K.PO, K.PO + .05), lift = eout(seg(t, C0 - .45, C0 + .3));
    phone(g, 548, lerp(1050, 975, lift) + d, 200, 360, { on: lit, glyph: true });
    /* the call chime: a generic overhead panel; its bell lights on the ping after "Then" */
    var CH = C0 + .05, cl = seg(t, CH, CH + .06);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, 690 + 8, 966 + 10, 220, 104, 26); g.fill();
    g.fillStyle = '#d9d2c3'; rr(g, 690, 966, 220, 104, 26); g.fill();
    g.fillStyle = cl > 0 ? CREAM : '#8f97a1'; el(g, 750, 1018, 34, 34);
    g.fillStyle = cl > 0 ? INK : '#d9d2c3';
    el(g, 750, 1004, 8, 8); rr(g, 740, 1014, 20, 20, 6); g.fill();
    g.fillStyle = '#8f97a1'; el(g, 850, 1018, 30, 30); g.fillStyle = '#d9d2c3'; poly(g, [[838, 1008], [850, 1026], [862, 1008]]); g.fill();
    prop(g, 'chime', 690, 966, 910, 1070);
    /* CREW ASKS → PHONE OFF, beside the phone */
    var ca = fin(t, K.crewW - .05), pa = fin(t, K.crewW + .1);
    if (ca > 0) chip(g, 'CREW ASKS', 795, 1150 + d, { px: 48, wt: 900, bg: CREAM, fg: INK, a: ca, st: 'condensed', maxw: 250 });
    if (pa > 0) chip(g, '→ PHONE OFF', 795, 1228 + d, { px: 48, wt: 900, bg: CREAM, fg: INK, a: pa, st: 'condensed', maxw: 250 });
    faaHeader(g, t);
    quote(g, 110, 668, 800, QC, 48, 'FAA · OCT 31, 2013', 241, 1, 0);
  }

  /* =====================================================================================================
     SCENE 4 · 1991 and the FCC: the rule card, the paper tower map, the ring from the ground, from the plane, the drone
     ===================================================================================================== */
  var TOWERS = [
    [185, 1130, 90], [355, 1135, 90], [530, 1128, 90], [700, 1135, 90], [858, 1130, 90],
    [305, 1250, 120], [480, 1255, 120], [665, 1248, 120], [845, 1255, 120],
    [330, 1392, 150], [530, 1396, 150], [705, 1390, 150], [858, 1394, 150]
  ];
  var GPH = { x: 185, y: 1300 };                          /* the phone on the ground */
  function towerTop(T) { return [T[0], T[1] - T[2] * .8]; }
  function hills(g, t) {
    var L = [[1110, '#223146', 1.1, 7], [1230, '#2a3c55', .8, 13], [1365, '#334a66', .6, 19]];
    L.forEach(function (l, i) {
      var P = [[-40, H]];
      for (var x = -40; x <= W + 40; x += 30) P.push([x, l[0] + 28 * Math.sin(x / 140 * l[2] + l[3]) + 14 * Math.sin(x / 61 + i)]);
      P.push([W + 40, H]);
      g.fillStyle = l[1]; poly(g, P); g.fill();
    });
  }
  /* a ring drawn only where it stays inside the rail: the arc runs end in round caps (like frame 0's arcs), never a cut */
  var RBOX = { x0: 104, x1: 916, y0: 952, y1: 1418 };
  var PUSH = { k: 1, ox: 520, oy: 1428 };
  function pushK(t) { return 1 + .1 * sio(seg(t, K.drone, K.droneEnd + .3)); }
  function ringArc(g, x, y, r, a, w) {
    if (a <= 0 || r <= 2) return;
    w = w || 12; var m = (w / 2 + 7) , N = 240, runs = [], cur = null, kk = PUSH.k;
    var bx0 = PUSH.ox + (RBOX.x0 - PUSH.ox) / kk, bx1 = PUSH.ox + (RBOX.x1 - PUSH.ox) / kk, by0 = PUSH.oy + (RBOX.y0 - PUSH.oy) / kk, by1 = PUSH.oy + (RBOX.y1 - PUSH.oy) / kk;
    for (var i = 0; i <= N; i++) {
      var th = -Math.PI + 2 * Math.PI * i / N, px = x + r * Math.cos(th), py = y + r * Math.sin(th);
      var ins = px > bx0 + m && px < bx1 - m && py > by0 + m && py < by1 - m;
      if (ins && !cur) cur = [th, th]; else if (ins) cur[1] = th; else if (cur) { runs.push(cur); cur = null; }
    }
    if (cur) runs.push(cur);
    if (!runs.length) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.lineCap = 'round'; g.lineWidth = w;
    runs.forEach(function (rn) { if (rn[1] - rn[0] < .02) return; g.strokeStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(x + 6, y + 9, r, rn[0], rn[1]); g.stroke(); g.strokeStyle = CREAM; g.beginPath(); g.arc(x, y, r, rn[0], rn[1]); g.stroke(); });
    g.restore();
  }
  /* ring sources and how far each ring has reached at t */
  function groundR(t) { return 205 * eout(seg(t, K.tower + .05, K.up - .05)); }
  var PL = { x: 520, y: 915 }, PRC = { x: 520, y: 935 };
  /* the plane's ring reaches each tower exactly on its tick: towers sorted by distance, radius through (TK_i, d_i) */
  var TORD = TOWERS.map(function (T, i) { var tp = towerTop(T); return { i: i, d: Math.hypot(tp[0] - PRC.x, tp[1] - PRC.y) }; }).sort(function (a, b) { return a.d - b.d; });
  var TLIT = []; (function () { var last = TK.length ? TK[TK.length - 1] : K.TK0; TORD.forEach(function (o, k) { TLIT[o.i] = k < TK.length ? TK[k] : last + .02 * (k - TK.length + 1); }); })();
  function planeR(t) {
    var t0 = K.reaches, n = TORD.length, T0 = TLIT[TORD[0].i];
    if (t < t0) return 0;
    if (t < T0) return lerp(0, TORD[0].d, eio(seg(t, t0, T0)) * .25 + seg(t, t0, T0) * .75);
    for (var k = 1; k < n; k++) { var ta = TLIT[TORD[k - 1].i], tb = TLIT[TORD[k].i]; if (t < tb) return lerp(TORD[k - 1].d, TORD[k].d, seg(t, ta, tb)); }
    return TORD[n - 1].d + 400 * (t - TLIT[TORD[n - 1].i]);
  }
  var DR = { x: 700, y: 1040 };
  function droneR(t) { return 640 * seg(t, K.drones - .1, K.DRG); }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  var RESET = K.fcc2 - .2;                                 /* the plane's lights go out as the drone rises */
  function towerLit(T, i, t) {
    var tp = towerTop(T), lit = 0;
    var g0 = groundR(t), gd = dist(tp, [GPH.x, GPH.y]);
    if (t < RESET && g0 >= gd) lit = Math.max(lit, seg(t, K.tower, K.tower + .01));
    if (t >= TLIT[i] && t < RESET) lit = 1;
    var dr = droneR(t), dd = dist(tp, [DR.x, DR.y]);
    if (t >= K.drones - .1 && dr >= dd) lit = 1;
    return lit;
  }
  /* a header item peels: it lifts, tilts and fades (never slides out through the rail) */
  function peel(g, k, x, y, fn) {
    if (k >= 1) return;
    g.save(); var ex = EXITING; if (k > 0) EXITING = true;
    g.globalAlpha *= 1 - eio(k); g.translate(x, y); g.rotate(-.12 * eio(k)); g.translate(-x, -y - 40 * eio(k));
    fn(); EXITING = ex; g.restore();
  }
  var QR = ['“…all cellular telephones', 'on board that aircraft must', 'be turned off.”'];
  function mapScene(g, t) {
    var d = drift(t, .2, .5);
    var pk = pushK(t); PUSH.k = pk;
    if (LAYER === 'bg') { g.translate(PUSH.ox, PUSH.oy); g.scale(pk, pk); g.translate(-PUSH.ox, -PUSH.oy); hills(g, t); return; }
    g.save(); g.translate(PUSH.ox, PUSH.oy); g.scale(pk, pk); g.translate(-PUSH.ox, -PUSH.oy);
    /* the phone on the ground (a little paper phone on the front hill) and its short ring */
    var gr = groundR(t), ga = 1 - seg(t, K.up + .1, K.up + .5);
    if (gr > 0 && ga > 0) ringArc(g, GPH.x, GPH.y, gr, ga * (1 - seg(gr, 180, 205) * .6), 10);
    phone(g, GPH.x, GPH.y - 62, 70, 124, { on: 1 });
    /* the plane glides in on "up high" (fading in inside the rail); its ring falls wide and lights the towers one by one */
    var OUT = K.OC - .32, pin = eout(seg(t, K.up - .2, K.reaches + .1)), pout = eio(seg(t, OUT, OUT + .4));
    var ppx = lerp(700, PL.x, pin) - 200 * pout, ppy = PL.y + d * .6 - 30 * pout, pa = seg(pin, 0, .5) * (1 - pout);
    if (t >= K.reaches && t < RESET) [0, .09, .18].forEach(function (lag, j) {
      var rr1 = planeR(t - lag), last = TLIT[TORD[TORD.length - 1].i];
      ring0(rr1, (1 - seg(t, last + .05, last + .4)) * (j ? .7 : 1), j ? 10 : 14);
    });
    function ring0(r, a, w) { ringArc(g, PRC.x, PRC.y, r, a, w); }
    /* the drone rises on "FCC voted" (fading up from just below); its ring lights them again */
    var dup = eout(seg(t, K.fcc2 - .2, K.voted + .6)), dyy = lerp(1150, DR.y, dup) + 8 * Math.sin(t * 3);
    if (dup > 0 && t >= K.drones - .1) [0, .22, .44].forEach(function (lag, j) { var r2 = 640 * seg(t, K.drones - .1 + lag, K.DRG + lag); ringArc(g, DR.x, DR.y, r2, (1 - seg(r2, 480, 640)) * (j ? .7 : 1), j ? 8 : 12); });
    TOWERS.forEach(function (T, i) { tower(g, T[0], T[1] + d * .3, T[2], towerLit(T, i, t)); });
    if (dup > 0) { g.save(); g.globalAlpha *= seg(dup, 0, .45); var ex0 = EXITING; if (dup < .45) EXITING = true; drone(g, DR.x, dyy, 1.3, t); EXITING = ex0; g.restore(); }
    if (pa > 0) { g.save(); g.globalAlpha *= pa; var ex1 = EXITING; if (pa < 1) EXITING = true; airliner(g, ppx, ppy, 330, -.02, { lit: 1 }); EXITING = ex1; g.restore(); }
    g.restore(); PUSH.k = 1;
    /* the header: ? flips to FCC on "FCC"; 1991 slaps down after the year; label and year peel before OCT 2026 lands */
    var fk = seg(t, K.fccW - .2, K.fccW + .1), hp = seg(t, K.OC - .32, K.OC - .08);
    agencyChip(g, 'FCC', 190, 612, 1, fk);
    var la = seg(t, K.fccW + .05, K.fccW + .2);
    if (la > 0) peel(g, hp, 300, 614, function () { txt(g, 'CELL TOWERS ON THE GROUND', 290, 614, 42, CREAM, 'left', 900, DISP, 400, la, 36, 'condensed'); });
    peel(g, hp, 830, 612, function () { slapChip(g, '1991', 830, 612, t, K.Y9); });
    slapChip(g, 'OCT 2026', 800, 612, t, K.OC, { px: 46, maxw: 250 });
    /* the rule card (word for word, the current text of 47 CFR 22.925 (a)); it peels before the plane comes in */
    quote(g, 110, 668, 800, QR, 48, '47 CFR 22.925 · 800 MHz CELLULAR', 263, 1, seg(t, K.Y9 - .12, K.Y9 + .18));
    /* the 1991 reason, in the sky as the plane arrives; what it causes, on "many" */
    var ua = fin(t, K.Y9 + .1), ia = fin(t, K.Y9 + .18);
    if (ua > 0) peel(g, hp, 510, 690, function () { txt(g, 'UP HIGH: MANY CELL SITES AT ONCE', 510, 690, 50, CREAM, 'center', 900, DISP, 800, ua, 44, 'condensed'); });
    if (ia > 0) peel(g, hp, 510, 756, function () {
      chip(g, '= INTERFERENCE ON THE GROUND', 510, 758, { px: 54, wt: 900, bg: CREAM, fg: INK, a: ia, st: 'condensed', r: 16, maxw: 800, shadow: false });
      txt(g, 'FCC, 1991', 510, 820, 38, CREAM, 'center', 800, DISP, 400, ia, 36, 'condensed');
    });
    /* the drone vote: the band chip lands with OCT 2026 */
    var ba = fin(t, K.OC - .03, 5);
    if (ba > 0) chip(g, '800 MHz CELLULAR BAND', 510, 692, { px: 50, wt: 900, line: CREAM, lw: 4, fg: CREAM, bg: 'rgba(17,26,38,.92)', a: ba, st: 'condensed', shadow: false, s: lerp(1.2, 1, eout(seg(t, K.OC - .08, K.OC))) });
    var oa = fin(t, K.monthE);
    if (oa > 0) verdict(g, 510, 840, oa, pop(t, K.monthE, 3.2));
    if (ba > 0) txt(g, 'FCC VOTE · OCT 29, 2026', 510, 750, 38, CREAM, 'center', 800, DISP, 800, ba, 36, 'condensed');
  }

  /* =====================================================================================================
     SCENE 5 · the hero: the FCC's rule page, (a) intact, the drones' new (b) inked in; STILL BANNED beside (a)
     ===================================================================================================== */
  function heroScene(g, t) {
    if (LAYER === 'bg') return;
    var d = drift(t, .6, .55), x0 = 110, y0 = 480, w = 500, h = 680, x1 = x0 + w;
    g.save(); g.translate(0, d);
    g.save(); g.translate(x0 + w / 2, y0 + h / 2); g.rotate(-.01); g.translate(-(x0 + w / 2), -(y0 + h / 2));
    sheet(g, x0, y0, x1, y0 + h, 517, PAPER, 'rule page');
    onprop(function () {
      txt(g, '47 CFR § 22.925', x0 + 28, y0 + 46, 42, INK, 'left', 900, DISP, 300, 1, 36, 'condensed');
      txt(g, 'Prohibition on airborne', x0 + 28, y0 + 104, 38, INK, 'left', 800, DISP, w - 56, 1, 36, 'condensed');
      txt(g, 'operation of cellular telephones.', x0 + 28, y0 + 146, 38, INK, 'left', 800, DISP, w - 56, 1, 36, 'condensed');
      ['(a) Cellular telephones …', 'carried aboard airplanes …', 'must not be operated while', 'such aircraft are airborne …'].forEach(function (L, i) {
        txt(g, L, x0 + 28, y0 + 212 + i * 46, 38, INK, 'left', 700, DISP, w - 56, 1, 36, 'condensed');
      });
    });
    /* the new (b), inked in by hand: blue ink, a margin bracket drawn on "Your cell signal" */
    var bk = eio(seg(t, K.sig - .1, K.sig + .4));
    g.strokeStyle = BLUEINK; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0 + 16, y0 + 490); g.lineTo(x0 + 16, y0 + 490 + 70 * bk); g.stroke();
    onprop(function () {
      txt(g, '(b) The prohibition … shall not', x0 + 30, y0 + 510, 38, BLUEINK, 'left', 800, DISP, w - 56, 1, 36, 'condensed');
      txt(g, 'apply to uncrewed aircraft …', x0 + 30, y0 + 556, 38, BLUEINK, 'left', 800, DISP, w - 56, 1, 36, 'condensed');
      txt(g, 'NEW (b): FCC VOTE, OCT 2026', x0 + 30, y0 + 600, 34, '#5d564c', 'left', 800, DISP, w - 56, 1, 32, 'condensed');
    });
    tag(g, 'RE-CREATED', x1 - 118, y0 + h - 32, 1, 0, 220, INK, PAPER, 30);
    g.restore();
    /* what stays allowed (FAA, 2013), on a small card under the stamp */
    var cx0 = 628, cy0 = 958, cw = 292, ch = 204;
    sheet(g, cx0, cy0, cx0 + cw, cy0 + ch, 611, CREAM, 'faa card');
    onprop(function () {
      txt(g, 'FAA · 2013', cx0 + 18, cy0 + 28, 30, '#5d564c', 'left', 800, DISP, cw - 36, 1, 30, 'condensed');
      txt(g, 'WI-FI: IF YOUR', cx0 + 18, cy0 + 66, 34, INK, 'left', 900, DISP, cw - 36, 1, 30, 'condensed');
      txt(g, 'AIRLINE OFFERS IT', cx0 + 18, cy0 + 102, 34, INK, 'left', 900, DISP, cw - 36, 1, 30, 'condensed');
      txt(g, 'BLUETOOTH', cx0 + 18, cy0 + 142, 34, INK, 'left', 900, DISP, cw - 36, 1, 30, 'condensed');
      txt(g, 'ACCESSORIES: OK', cx0 + 18, cy0 + 178, 34, INK, 'left', 900, DISP, cw - 36, 1, 30, 'condensed');
    });
    /* the hero stamp: 470 px wide, −8°, over the right edge of (a) only (never over (b)) */
    stamp(g, 'STILL\nBANNED', 660, 772, t, K.HERO, STAMPPX(), HOT, -.14, .45);
    g.restore();
    footStrip(g, t);
  }
  var SPX = null;
  function STAMPPX() {
    if (SPX) return SPX;
    var m = mk(4, 4).getContext('2d'); font(m, 100, 900, DISP, 'extra-condensed'); ls(m, 2);
    var lw = Math.max(m.measureText('STILL').width, m.measureText('BANNED').width) / 100;
    SPX = Math.round(470 / (lw + .6)); return SPX;
  }

  /* the FCC's own footnote, word for word, 40 px: a strip under the rule page through the hero hold */
  var QF = ['“…does not affect the provision', 'in section 22.925 that', 'prohibits customers from', 'operating their mobile devices', 'while an aircraft is airborne.”'];
  function footStrip(g, t) {
    if (LAYER === 'bg') return;
    var a0 = S('hero').t0 - TW * .62, inn = eout(seg(t, a0, a0 + .35)), out = 0;
    if (inn <= 0) return;
    var x0 = 96, y0 = 1172, w = 830, h = 250, d = -drift(t, 1.4, .4);
    g.save(); g.translate(0, 120 * (1 - inn) + d); g.globalAlpha *= seg(inn, 0, .3);
    var ex = EXITING; if (inn < 1 || out > 0) EXITING = true;
    sheet(g, x0, y0, x0 + w, y0 + h, 733, PAPER, 'footnote');
    onprop(function () {
      QF.forEach(function (L, i) { txt(g, L, x0 + 22, y0 + 28 + i * 41, 40, INK, 'left', 700, DISP, w - 44, 1, 40, 'condensed'); });
      txt(g, 'FCC 26-72 · OCT 2026', x0 + 22, y0 + 228, 32, '#5d564c', 'left', 800, DISP, 400, 1, 30, 'condensed');
    });
    tag(g, 'RE-CREATED', x0 + w - 126, y0 + 226, 1, 0, 240, INK, PAPER, 30);
    EXITING = ex; g.restore();
  }

  /* ---------- captions: the narrator's words in phrase cards (one size); stressed words get a cream pill (never coral) ---------- */
  var CAPGROUPS = { ask: [[4, 3]], faa: [[2, 4], [2, 3]], dip: [[2, 2], [3, 3]], crew: [[3, 3], [2, 3]], fcc: [[1, 3], [3, 2]], tower: [[2, 2], [3, 2]], drone: [[2, 3], [3, 3]], sig: [[3]], still: [[2]], end: [[3, 5]], yn: [[3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['faa', '2013'], ['faa', 'most'], ['dip', 'low'], ['dip', 'hundred'], ['crew', 'off'], ['fcc', '1991'], ['tower', 'many'], ['drone', 'drones'], ['still', 'still'], ['end', 'plane']]
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
  var NOISE, SCENES = { tileScene: tileScene, planeScene: planeScene, cabinScene: cabinScene, mapScene: mapScene, heroScene: heroScene, endScene: endScene };
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(56,78,108,.34)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function safeClip(g) { g.beginPath(); g.rect(SAFE_BOX.x0, SAFE_BOX.y0, SAFE_BOX.x1 - SAFE_BOX.x0, SAFE_BOX.y1 - SAFE_BOX.y0); g.clip(); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  var LAYER = 'fg';
  function drawScene(g, Sc, t, layer) { var o = LAYER; LAYER = layer || 'fg'; g.save(); SCENES[Sc.fn](g, t); g.restore(); LAYER = o; }
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
  /* the wipe: a bank of paper clouds crosses the whole frame; behind it the next scene is already built (right → left
     forward, left → right for the flashback) */
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var wk = Nx ? seg(te, Nx.t0 - TW, Nx.t0) : 0;
    if (wk > 0) {
      var dir = Nx.dir || 1, e = eio(wk), xb = dir > 0 ? lerp(W + 280, -280, e) : lerp(-280, W + 280, e);
      var nr = NOREC; NOREC = wk < .4; fullScene(g, Nx, t); NOREC = nr;
      g.save(); EXITING = true; NOREC = true;
      g.beginPath(); if (dir > 0) g.rect(-10, 0, xb + 10, H); else g.rect(xb, 0, W - xb + 10, H); g.clip();
      stage(g); fullScene(g, Sc, t);
      g.restore();
      bgLayer(g, function (l) { bank(l, xb, t); });
      EXITING = false; NOREC = nr;
    } else fullScene(g, Sc, t);
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) captions(g, t, 1 - seg(t, K.noEnd + .04, K.noEnd + .14));
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 62, 800, DISP, 'expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('What airplane mode', CX, 352);
    var b = 'really protects', bp = 62; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 430 - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 430); g.restore();
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
  var GAIN = { pf: .22, tg: .45, sw1: .3, ys: .09, lv: .32, po: .45, sw3: .2, y9: .14, tk: .1, oc: .09, dr: .3, sw4: .35, hero: .04, sw5: .3, ty: .25, tn: .25 };
  var TYPE = { pf: 'paper', tg: 'click', sw1: 'swish', ys: 'slap', lv: 'knock', po: 'click', sw3: 'swish', y9: 'slap', oc: 'slap', dr: 'ping', sw4: 'swish', hero: 'thump', sw5: 'swish', ty: 'tick', tn: 'tick' };
  function initTimes() {
    Object.keys(TYPE).forEach(function (n) { if (GT[n] != null) EV.push({ t: +GT[n].toFixed(3), type: TYPE[n], g: GAIN[n], id: n, t1: +(GT[n] + BODY[TYPE[n]]).toFixed(3) }); });
    TK.forEach(function (tt, i) { EV.push({ t: tt, type: 'tick', g: GAIN.tk, id: 'tk' + i, t1: +(tt + BODY.tick).toFixed(3) }); });
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
    EV.forEach(function (e) {
      if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'swish') swishS(e.t, e.g);
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'paper') paperS(e.t, e.g);
      else if (e.type === 'knock') knockS(e.t, e.g);
      else if (e.type === 'click') clickS(e.t, e.g);
      else if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'ping') { if (e.id === 'ch') chimeS(e.t, e.g); else ringS(e.t, e.g); }
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
    var fonts = ['900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 condensed 84px Archivo', '800 condensed 84px Archivo', '700 condensed 84px Archivo', '900 extra-condensed 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°º×−≈≠µ“”‘’·→…#?‹›✓✕–@!>$(),:§+/=½~'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initTimes();
  /* the hero hold: from the stamp settling to the cloud bank that brings frame 0 back */
  var HOLD = { t0: K.HERO + .13, t1: S('end').t0 - TW };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'airplanemode', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
