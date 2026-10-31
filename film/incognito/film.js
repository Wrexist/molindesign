/* "What incognito mode really hides" — Factory #17 on Tech, explained (How tech works), after ../math/ and ../agent/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the envelope on a string: the page you open is a sealed paper envelope that leaves the laptop and
   passes three cardboard booths (your school or work, your internet provider, the website) whose windows slide open;
   incognito only shreds the HISTORY slip that stayed on the laptop. One hero stamp: YOUR DEVICE ONLY (coral); coral is
   also on the end card's YES / NO and nowhere else. Cut-paper props, no logos, no real UI, no photos. The incognito
   screen is re-created from Chromium's own strings (BRIEF §3 fact 1) and tagged RE-CREATED. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', INK = '#211d26', PENCIL = '#3c3946', GRAPHITE = '#d9d3c6';
  var CARD = '#c8a273', CARD_D = '#a7814f', CARD_L = '#d9b88b', WOOD = '#c9a06a', WOOD_D = '#9c7444', WOOD_L = '#dcb987';
  var LID = '#d9d5cd', LID_D = '#b9b4ab', LID_L = '#ebe8e2', WIN = '#28262e', WIN_BAR = '#1c1a21', WIN_CARD = '#36333d';
  var ENV = '#f3ead6', ENV_D = '#ddd0b4', MANILA = '#dcbd7e', MANILA_D = '#bf9d5c', MANILA_L = '#e8cf98';
  var TAPE = '#f4eddc', TAPE_D = '#ddd2ba';
  var DISP = 'Archivo', MONO = '"Geist Mono"';

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

  /* ---------- key times ---------- */
  var K = {
    what: at('ask', 'what'), askEnd: lend('ask'),
    screen: start('screen'), screenW: at('screen', 'screen'), printed: at('screen', 'printed'),
    might: at('visible', 'might'), websites: at('visible', 'websites'), visEnd: lend('visible'),
    school: at('network', 'school'), provider: at('network', 'provider'), netEnd: lend('network'),
    why: start('why'), only: at('why', 'only'), forgets: at('why', 'forgets'), device: at('why', 'device'),
    travel: start('travel'), page: at('travel', 'page'), crosses: at('travel', 'crosses'), network: at('travel', 'network'), site: at('travel', 'site'),
    hero: start('hero'), forgets2: at('hero', 'forgets'), you: at('hero', 'you'), them: at('hero', 'them'), themEnd: wend('hero', 'them'),
    settle: start('settle'), scrub: at('settle', 'scrub'), billions: at('settle', 'billions'), records: wend('settle', 'records'),
    end: start('end'), incog: at('end', 'incognito'), yes: at('end', 'yes'), no: at('end', 'no'), noEnd: wend('end', 'no')
  };
  /* the headline: frame 0's three words for 2.3 s, then the question (three lines, each long enough to read) */
  K.swap = 1.9;
  K.hookOut = K.what - .04 + 2.6;
  K.zoom0 = K.hookOut - .85; K.zoom1 = K.hookOut - .05;

  /* scenes. swipe:true = the next scene comes in under the torn edge, drawn complete */
  var SWIPE = .44;
  var SC = [
    { id: 'desk', fn: 'desk', name: 'Not invisible', t0: 0 },
    { id: 'screen', fn: 'screen', name: 'Chrome’s own screen', t0: K.zoom1 },
    { id: 'route', fn: 'route', name: 'The route', t0: start('why') - .1 + SWIPE, swipe: true },
    { id: 'folder', fn: 'folder', name: 'The settlement', t0: 0, swipe: true },    /* t0 set after the gaps (the hold) */
    { id: 'outro', fn: 'outro', name: 'Yes or no', t0: at('end', 'did') - .12 }
  ];
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS;

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, MC, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- measuring: the safe area (BOUNDS_RUN), what is readable (TEXTS → readcheck) and labels vs props (LABELS_RUN) ---------- */
  var BOUNDS = null, REC = null, PROPS = null, LBL = null, INCOMING = false, CURT = 0, NOREC = false, ONPROP = false, CHIPBOX = null, COVER = 1e9;
  var SAFE = { x0: 95, x1: 925, y1: 1450 };
  function xbox(g, x0, y0, x1, y1) {
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
  }
  function recBound(g, b, text) {
    if (!BOUNDS || INCOMING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    if (b[0] < SAFE.x0 - .5 || b[2] > SAFE.x1 + .5 || b[3] > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(b[0]), x1: Math.round(b[2]), y1: Math.round(b[3]) });
  }
  function recBox(g, x0, y0, x1, y1, text) { if (BOUNDS) recBound(g, xbox(g, x0, y0, x1, y1), text); }
  function prop(g, name, x0, y0, x1, y1) {
    if (!PROPS || INCOMING || (g !== ctx && g !== tctx)) return;
    var b = xbox(g, x0, y0, x1, y1); if (b[1] > COVER) return; PROPS.push({ name: name, b: b });
  }
  function seen(g, text, b) {
    var vis = !INCOMING && !NOREC && g.globalAlpha >= .95 && b[3] <= COVER && (g === ctx || g === tctx);
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
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function poly(g, P) { g.beginPath(); P.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  /* a cut-paper shape: a polygon whose straight edges wobble a little (seeded), like scissors */
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
    font(g, px, o.wt, o.fam); if (o.wd) wide(g); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw + pad * 2 > o.maxw && px > 36) { px -= 2; font(g, px, o.wt, o.fam); if (o.wd) wide(g); tw = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, px, o.wt, o.fam); if (o.wd) wide(g);
    CHIPBOX = (o.bg || o.line) && LBL ? xbox(g, -w / 2, -h / 2, w / 2, h / 2) : null;
    g.fillText(text, 0, px * .04); CHIPBOX = null; g.restore(); ls(g, 0);
    return w;
  }
  /* one line of type, shrunk to fit maxw; never under 36 px unless asked */
  function txt(g, text, x, y, px, col, align, wt, fam, maxw, a, minpx) {
    a = a == null ? 1 : a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 900, fam); ls(g, 0);
    while (maxw && g.measureText(text).width > maxw && px > (minpx || 36)) { px -= 2; font(g, px, wt || 900, fam); }
    g.fillStyle = col || CREAM; g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillText(text, x, y); g.restore();
  }
  function tw(text, px, wt, fam) { font(MC, px, wt, fam); ls(MC, 0); return MC.measureText(text).width; }
  /* quiet tags (RE-CREATED): cream outline, never coral */
  function tag(g, text, x, y, a, rot) { chip(g, text, x, y, { px: 36, wt: 700, fam: MONO, line: CREAM, lw: 3, fg: CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: 'rgba(21,19,27,.9)', maxw: 820 }); }

  /* ---------- the one rubber stamp: worn ink (seeded speckle), slammed ---------- */
  var STEX = {};
  function stampTex(text, col, px) {
    var key = text + col + px; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900); ls(m, 2);
    var TL = text.split('\n'), lw = Math.max.apply(null, TL.map(function (s) { return m.measureText(s).width; })), pad = px * .45, h = px * (1.05 * TL.length + .2), w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .03); rr(g, px * .14, px * .14, w - px * .28, h - px * .28, px * .08); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, px, 900); ls(g, 2); TL.forEach(function (s, i) { g.fillText(s, w / 2, h / 2 + px * .05 + (i - (TL.length - 1) / 2) * px * 1.02); });
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 140);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.9, 0, 6.283); g.fill(); }
    c.w = w + 16; c.h = h + 16; STEX[key] = c; return c;
  }
  function stamp(g, text, x, y, t, t0, px, col, rot, patch) {
    if (t < t0) return;
    var c = stampTex(text, col, px);
    var k = eout(seg(t, t0, t0 + .18)), s = lerp(1.35, 1, k), al = clamp(k * 3, 0, 1);
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.08 : rot); g.scale(s, s);
    var oldP = ONPROP; ONPROP = true;
    if (patch) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-c.w / 2 + 2, -c.h / 2 + 8, c.w + 4, c.h + 4); g.fillStyle = PAPER; g.fillRect(-c.w / 2 - 2, -c.h / 2 - 2, c.w + 4, c.h + 4); if (k >= 1) recBox(g, -c.w / 2 - 2, -c.h / 2 - 2, c.w / 2 + 2, c.h / 2 + 2, '[patch] ' + text.replace(/\n/g, ' ')); }
    if (k >= 1) { recBox(g, -c.w / 2, -c.h / 2, c.w / 2, c.h / 2, text.replace(/\n/g, ' ')); if (al >= 1) seen(g, text.replace(/\n/g, ' '), xbox(g, -c.w / 2, -c.h / 2, c.w / 2, c.h / 2)); } g.drawImage(c, -c.w / 2, -c.h / 2); ONPROP = oldP; g.restore();
  }

  /* =====================================================================================================
     PROPS (all cut paper)
     ===================================================================================================== */
  /* a yellow pencil lying from (x0,y0) to (x1,y1), tip at (x1,y1) */
  function pencil(g, x0, y0, x1, y1) {
    var L = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0);
    g.save(); g.translate(x0, y0); g.rotate(ang);
    g.fillStyle = 'rgba(0,0,0,.3)'; poly(g, [[4, -9 + 10], [L - 54, -9 + 10], [L + 2, 10], [L - 54, 9 + 10], [4, 9 + 10]]); g.fill();
    g.fillStyle = '#e4b74a'; g.fillRect(0, -11, L - 56, 22);
    g.fillStyle = '#c99a2e'; g.fillRect(0, 3, L - 56, 8);
    g.fillStyle = '#d8c39a'; g.fillRect(-26, -11, 26, 22); g.fillStyle = '#b9ab98'; rr(g, -48, -11, 24, 22, 6); g.fill();
    g.fillStyle = '#e8d2aa'; poly(g, [[L - 56, -11], [L - 12, -3], [L - 12, 3], [L - 56, 11]]); g.fill();
    g.fillStyle = PENCIL; poly(g, [[L - 14, -3.4], [L, 0], [L - 14, 3.4]]); g.fill();
    prop(g, 'pencil', -48, -11, L, 11);
    g.restore();
  }
  /* the paper eye-mask (our stand-in for incognito; not Chrome's icon) */
  function mask(g, x, y, s, col, hole) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.save(); g.translate(5, 7);
    maskPath(g); g.fill('evenodd'); g.restore();
    g.fillStyle = col || GRAPHITE; maskPath(g); g.fill('evenodd');
    /* the ties */
    g.strokeStyle = col || GRAPHITE; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-96, -6); g.quadraticCurveTo(-122, -2, -134, 14); g.moveTo(96, -6); g.quadraticCurveTo(122, -2, 134, 14); g.stroke();
    g.restore();
    function maskPath(q) {
      q.beginPath();
      q.moveTo(-100, -14); q.bezierCurveTo(-90, -40, -30, -42, 0, -26); q.bezierCurveTo(30, -42, 90, -40, 100, -14);
      q.bezierCurveTo(104, 14, 80, 40, 46, 38); q.bezierCurveTo(24, 36, 12, 18, 0, 18); q.bezierCurveTo(-12, 18, -24, 36, -46, 38);
      q.bezierCurveTo(-80, 40, -104, 14, -100, -14); q.closePath();
      /* eye holes */
      q.moveTo(-22, -2); q.bezierCurveTo(-30, -18, -66, -20, -74, -4); q.bezierCurveTo(-66, 12, -32, 12, -22, -2); q.closePath();
      q.moveTo(22, -2); q.bezierCurveTo(30, -18, 66, -20, 74, -4); q.bezierCurveTo(66, 12, 32, 12, 22, -2); q.closePath();
    }
  }
  /* a cut-paper laptop: light card lid with a dark incognito window on its screen, a paper keyboard base */
  function laptop(g, x0, y0, w, h, seed) {
    var r = mulberry(seed || 5), x1 = x0 + w, y1 = y0 + h;
    g.fillStyle = 'rgba(0,0,0,.36)'; rr(g, x0 + 9, y0 + 13, w, h + 30, 18); g.fill();
    g.fillStyle = LID; cut(g, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], r, 1.6);
    g.fillStyle = LID_L; g.fillRect(x0 + 6, y0 + 4, w - 12, 5);
    var sx0 = x0 + 16, sy0 = y0 + 16, sw = w - 32, sh = h - 30;
    g.fillStyle = WIN; rr(g, sx0, sy0, sw, sh, 8); g.fill();
    g.fillStyle = WIN_BAR; rr(g, sx0, sy0, sw, sh * .14, 8); g.fill(); g.fillRect(sx0, sy0 + sh * .08, sw, sh * .06);
    g.fillStyle = WIN_CARD; rr(g, sx0 + sw * .06, sy0 + sh * .03, sw * .3, sh * .11, 6); g.fill();
    mask(g, sx0 + sw / 2, sy0 + sh * .5, sw / 330, GRAPHITE);
    g.fillStyle = WIN_CARD; rr(g, sx0 + sw * .2, sy0 + sh * .76, sw * .6, sh * .07, 5); g.fill();
    /* the base */
    g.fillStyle = LID_D; poly(g, [[x0 - 4, y1], [x1 + 4, y1], [x1 + 24, y1 + 30], [x0 - 24, y1 + 30]]); g.fill();
    g.fillStyle = LID_L; poly(g, [[x0 - 4, y1], [x1 + 4, y1], [x1 + 8, y1 + 6], [x0 - 8, y1 + 6]]); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; rr(g, x0 + w * .38, y1 + 18, w * .24, 7, 3); g.fill();
    prop(g, 'laptop', x0 - 24, y0, x1 + 24, y1 + 30);
    return { sx0: sx0, sy0: sy0, sw: sw, sh: sh };
  }
  /* a sealed cream envelope hanging from a clothes-peg on the string at (x, y) */
  function envelope(g, x, y, w, rot) {
    var h = w * .64;
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(-w / 2 + 7, 14, w, h);
    g.fillStyle = ENV; g.fillRect(-w / 2, 6, w, h);
    g.strokeStyle = ENV_D; g.lineWidth = 3; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-w / 2 + 2, 8); g.lineTo(0, 6 + h * .56); g.lineTo(w / 2 - 2, 8); g.stroke();
    g.beginPath(); g.moveTo(-w / 2 + 2, 6 + h - 2); g.lineTo(-w * .12, 6 + h * .5); g.moveTo(w / 2 - 2, 6 + h - 2); g.lineTo(w * .12, 6 + h * .5); g.stroke();
    /* the seal (a paper dot, cream-brown) */
    g.fillStyle = CARD; el(g, 0, 6 + h * .54, w * .07, w * .07);
    /* the peg */
    g.fillStyle = WOOD_D; rr(g, -9, -14, 18, 34, 4); g.fill(); g.fillStyle = WOOD_L; rr(g, -9, -14, 8, 34, 4); g.fill();
    prop(g, 'envelope', -w / 2, -14, w / 2, 6 + h);
    g.restore();
  }
  /* a cardboard booth: fascia with a hand-cut icon, a dark window with a sliding card panel (open 0..1), a base */
  function booth(g, x0, y0, w, h, kind, open, seed, contents, win) {
    var r = mulberry(seed), x1 = x0 + w, y1 = y0 + h;
    var fa = Math.min(70, h * .17), wy0 = win ? win[0] : y0 + fa + 18, wy1 = win ? win[1] : y1 - Math.max(34, h * .1), wx0 = x0 + 20, wx1 = x1 - 20;
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x0 + 10, y0 + 14, w, h);
    /* the window's dark inside, then what is in it (the envelope), then the front with the window cut out */
    g.fillStyle = '#2b2420'; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    if (contents) { g.save(); g.beginPath(); g.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.clip(); contents(); g.restore(); }
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.rect(wx1, wy0, wx0 - wx1, wy1 - wy0); g.clip();   /* everything but the window */
    g.fillStyle = CARD; cut(g, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], r, 2.2);
    g.restore();
    /* sliding panel: closed covers the window, open slides left behind the front */
    var pw = (wx1 - wx0) * (1 - clamp(open, 0, 1));
    if (pw > 1) { g.fillStyle = CARD_L; g.fillRect(wx0, wy0, pw, wy1 - wy0); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(wx0 + pw - 6, wy0, 6, wy1 - wy0);
      g.fillStyle = CARD_D; rr(g, wx0 + pw - 30, (wy0 + wy1) / 2 - 18, 10, 36, 4); g.fill(); }
    g.strokeStyle = CARD_D; g.lineWidth = 5; g.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    /* fascia */
    g.fillStyle = CARD_D; g.fillRect(x0, y0, w, fa);
    g.fillStyle = CARD_L; g.fillRect(x0, y0, w, 7);
    /* window ledge */
    g.fillStyle = CARD_D; g.fillRect(x0 - 6, wy1 + 4, w + 12, 16);
    if (win) { g.fillStyle = CARD_D; g.fillRect(x0 - 6, y1 - 18, w + 12, 18); }
    icon(g, kind, (x0 + x1) / 2, y0 + fa / 2, fa * .8);
    prop(g, 'booth', x0, y0, x1 + 10, y1 + 14);
    return { wx0: wx0, wx1: wx1, wy0: wy0, wy1: wy1 };
  }
  /* a tiny booth beside a line of Chrome's screen: a cardboard box with its icon on the fascia */
  function miniBooth(g, cx, cy, kind, seed) {
    var r = mulberry(seed);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cx - 30 + 4, cy - 28 + 6, 60, 56);
    g.fillStyle = CARD; cut(g, [[cx - 30, cy - 28], [cx + 30, cy - 28], [cx + 30, cy + 28], [cx - 30, cy + 28]], r, 1.2);
    g.fillStyle = CARD_D; g.fillRect(cx - 30, cy - 28, 60, 20);
    g.fillStyle = '#2b2420'; g.fillRect(cx - 20, cy - 2, 40, 24);
    icon(g, kind, cx, cy - 18, 15);
    prop(g, 'minibooth', cx - 30, cy - 28, cx + 34, cy + 34);
  }
  /* booth icons, hand-cut cream paper: Wi-Fi arcs, a telephone pole, a shop awning */
  function icon(g, kind, x, y, s) {
    g.save(); g.translate(x, y); var k = s / 60;
    g.scale(k, k);
    g.strokeStyle = CREAM; g.fillStyle = CREAM; g.lineCap = 'round'; g.lineWidth = 7;
    if (kind === 'wifi') {
      el(g, 0, 20, 6, 6);
      [14, 28, 42].forEach(function (rad) { g.beginPath(); g.arc(0, 20, rad, -Math.PI * .78, -Math.PI * .22); g.stroke(); });
    } else if (kind === 'pole') {
      g.lineWidth = 6; g.beginPath(); g.moveTo(0, -26); g.lineTo(0, 28); g.moveTo(-26, -16); g.lineTo(26, -16); g.moveTo(-18, -4); g.lineTo(18, -4); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.moveTo(-70, -6); g.quadraticCurveTo(-48, 2, -26, -16); g.moveTo(26, -16); g.quadraticCurveTo(48, 2, 70, -6); g.stroke();
    } else {
      /* shop: an awning with scalloped edge and a door */
      g.fillRect(-36, -24, 72, 14);
      for (var i = 0; i < 4; i++) { g.beginPath(); g.arc(-27 + i * 18, -10, 9, 0, Math.PI); g.fill(); }
      g.lineWidth = 5; g.strokeRect(-26, 2, 52, 26); g.fillRect(-8, 8, 16, 20);
    }
    g.restore();
  }
  /* the HISTORY receipt slip: fed out to length `len` from x0; shredded into strips (sh 0..1), strips settle (st 0..1) */
  var SLIP_ITEMS = ['gift ideas', 'flights', 'news'];
  function slip(g, x0, y0, len, h, sh, st, t) {
    if (len <= 2) return;
    var n = 7, sw = 490 / n, r = mulberry(61);
    var gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, '#f8f2e4'); gr.addColorStop(.75, TAPE); gr.addColorStop(1, TAPE_D);
    for (var i = 0; i < n; i++) {
      var a = x0 + i * sw, b = Math.min(x0 + len, a + sw); if (b <= a) break;
      var rr0 = r(), rr1 = r(), rr2 = r();
      /* shredded on "forgets": cut gaps of 16 px, every strip tilted 15–20° (alternating), strips 1 and 6 dropped below the slip */
      var drop = (i === 1 || i === 6) ? 1 : 0, sgn = i % 2 ? 1 : -1;
      var dy = sh * (drop ? 52 : 4 + rr0 * 10) + st * (drop ? 6 : 10 + rr1 * 16), rot = sh * sgn * (.27 + rr2 * .08) + st * sgn * (.08 + rr0 * .06) + sh * drop * sgn * .2, dx = sh * (drop ? 8 * sgn : 0) + st * (rr1 - .5) * 16;
      var mx = (a + b) / 2, my = y0 + h / 2;
      g.save(); g.translate(mx + dx, my + dy); g.rotate(rot); g.translate(-mx, -my);
      g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(a + 6, y0 + 9, b - a - 16 * sh, h);
      g.fillStyle = gr; g.fillRect(a, y0, b - a - 16 * sh, h);
      g.save(); g.beginPath(); g.rect(a, y0, b - a - 16 * sh, h); g.clip();
      g.strokeStyle = 'rgba(96,136,190,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(a, y0 + 12); g.lineTo(b, y0 + 12); g.moveTo(a, y0 + h - 12); g.lineTo(b, y0 + h - 12); g.stroke();
      /* the print, one pass across the whole slip, clipped to this strip */
      ONPROP = true; NOREC = true;   /* the slip's print is shredded by design: not a text the viewer has to read */
      g.fillStyle = '#a9a294'; g.textBaseline = 'middle'; g.textAlign = 'left';
      g.fillStyle = '#5f5866'; font(g, 40, 900, DISP); g.fillText('HISTORY', x0 + 20, y0 + 46); g.fillStyle = '#a9a294';
      font(g, 28, 600, MONO); var xx = x0 + 20;
      SLIP_ITEMS.forEach(function (s) { g.fillText(s, xx, y0 + 106); xx += tw(s, 28, 600, MONO) + 40; });
      NOREC = false; ONPROP = false;
      g.restore();
      g.restore();
    }
    /* the feed end while it prints: a straight tear line */
    prop(g, 'slip', x0, y0 - 20 * sh, x0 + len, y0 + h + 70 * sh);
  }
  /* the string: a thin waxed cord */
  function cord(g, P) {
    g.save(); g.strokeStyle = '#e2d6bd'; g.lineWidth = 4; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); P.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3; g.beginPath(); P.forEach(function (p, i) { if (i) g.lineTo(p[0] + 4, p[1] + 7); else g.moveTo(p[0] + 4, p[1] + 7); }); g.stroke();
    g.restore();
  }
  function check(g, x, y, s, a) {
    if (a <= 0 || s <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s);
    g.strokeStyle = CREAM; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-14, 0); g.lineTo(-4, 11); g.lineTo(16, -14); g.stroke(); g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · the desk (hook → ask), also the end card. Frame 0: INCOGNITO / ISN'T / INVISIBLE (3 words); the masked
     laptop on a cardboard desk; the envelope already out of it on the string, gliding 330 px right into the first booth
     (YOUR SCHOOL OR WORK's Wi-Fi booth), whose window is sliding open. At 1.2 s the Google Help chip. From "incognito
     mode" the camera dives into the laptop screen (a move in, not a wipe) and lands on Chrome's screen.
     ===================================================================================================== */
  var DK = { lx: 100, ly: 800, lw: 360, lh: 282, sy: 990, bx: 700, by: 784, bw: 225, bh: 636, XA: 470, D: 430 };
  function deskWorld(g, t, envX, open) {
    /* the desk under the laptop */
    var r = mulberry(17);
    g.fillStyle = 'rgba(0,0,0,.36)'; g.fillRect(96 + 9, 1112 + 13, 420, 300);
    g.fillStyle = CARD_D; g.fillRect(118, 1240, 30, 180); g.fillRect(468, 1240, 30, 180);
    g.fillStyle = CARD; cut(g, [[96, 1112], [520, 1112], [520, 1244], [96, 1244]], r, 2);
    g.fillStyle = CARD_L; g.fillRect(96, 1112, 424, 12);
    g.fillStyle = CARD_D; rr(g, 150, 1162, 316, 52, 6); g.fill(); g.fillStyle = CARD_L; rr(g, 284, 1180, 48, 14, 7); g.fill();
    prop(g, 'desk', 96, 1112, 520, 1420);
    /* string: laptop → through the booth's window → off frame */
    cord(g, [[DK.lx + DK.lw - 6, DK.sy], [W + 20, DK.sy]]);
    laptop(g, DK.lx, DK.ly, DK.lw, DK.lh, 5);
    /* the envelope: in the gap between lid and booth (it comes out from behind the lid), and seen through the window */
    var ew = 160, lidR = DK.lx + DK.lw - 2;
    booth(g, DK.bx, DK.by, DK.bw, DK.bh, 'wifi', open, 29, function () { cord(g, [[DK.bx, DK.sy], [DK.bx + DK.bw, DK.sy]]); envelope(g, envX, DK.sy, ew, 0); }, [902, 1112]);
    g.save(); g.beginPath(); g.rect(lidR, 0, DK.bx - lidR, H); g.clip(); envelope(g, envX, DK.sy, ew, 0); g.restore();
  }
  function deskEnvX(t) { var k = clamp(t / 1.2, 0, 1); return DK.XA + DK.D * (1 - (1 - k) * (1 - k)); }
  function deskOpen(t) { return .15 + .85 * eout(seg(t, 0, .9)); }
  function deskScene(g, t) {
    /* the dive into the laptop screen: scale about the screen's centre; Chrome's screen fades in over it */
    var z = eio(seg(t, K.zoom0, K.zoom1)), scx = DK.lx + DK.lw / 2, scy = DK.ly + DK.lh / 2 - 6;
    var s = Math.exp(Math.log(7.5) * z), tx = lerp(scx, 520, z), ty = lerp(scy, 925, z);
    /* a slow push toward the laptop while the question is up, before the dive */
    var push = 1 + .05 * eio(seg(t, K.swap, K.zoom0));
    g.save(); g.translate(tx, ty); g.scale(s * push, s * push); g.translate(-scx, -scy);
    /* a slow sway of the whole desk while the chip and the question are up (0 on frame 0, so the loop lands clean) */
    g.translate(0, 14 * Math.sin(2.2 * (t - .9)) * seg(t, .9, 1.4) * (1 - z));
    deskWorld(g, t, deskEnvX(t), deskOpen(t));
    g.restore();
    if (t > K.zoom0 + .45) screenScene(g, t);
    /* the Google Help chip: the hook's source, in Google's own words; gone before the screen arrives */
    var ca = fin(t, .85, 3.4) * (1 - seg(t, K.zoom0 + .36, K.zoom0 + .46)), cs = pop(t, .85, 3.4);
    if (ca > 0) {
      g.save(); g.globalAlpha *= ca; g.translate(CX, 696); g.scale(cs, cs); g.rotate(-.008);
      var w = 760, h = 118;
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -w / 2 + 6, -h / 2 + 9, w, h, 16); g.fill();
      g.fillStyle = CREAM; rr(g, -w / 2, -h / 2, w, h, 16); g.fill();
      recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] GOOGLE');
      CHIPBOX = LBL ? xbox(g, -w / 2, -h / 2, w / 2, h / 2) : null;
      txt(g, 'GOOGLE’S CHROME HELP:', 0, -26, 36, BG, 'center', 700, MONO, 720);
      txt(g, '“IT DOESN’T MAKE YOU INVISIBLE”', 0, 26, 42, BG, 'center', 900, DISP, 720);
      CHIPBOX = null; g.restore();
    }
  }
  /* frame-0 type: INCOGNITO / ISN'T / INVISIBLE, then WHAT DOES / INCOGNITO MODE / HIDE? on "what" */
  var HEAD_Y = [352, 462, 572];
  function hookText(g, t, a) {
    if (a <= 0) return;
    var m = t >= K.end ? 0 : eio(seg(t, K.swap, K.swap + .1));
    var L = ['INCOGNITO', 'ISN’T', 'INVISIBLE'], Q = ['WHAT DOES', 'INCOGNITO MODE', 'HIDE?'];
    function block(lines, al, dy, maxw) {
      if (al <= 0) return;
      var px = 116; g.save(); font(g, px, 900);
      while (Math.max.apply(null, lines.map(function (s) { return g.measureText(s).width; })) > maxw && px > 60) { px -= 2; font(g, px, 900); }
      g.globalAlpha = al; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
      lines.forEach(function (s, i) { g.fillText(s, CX, HEAD_Y[i] + dy); });
      g.restore();
    }
    block(L, a * (1 - m), -14 * m, 760);
    if (m > 0) block(Q, a * m, 16 * (1 - m), 800);
  }

  /* =====================================================================================================
     SCENE 2 · Chrome's own incognito screen, re-created in cut paper; the words are Chromium's strings (BRIEF §3 fact 1).
     The pencil underlines "might still be visible to" on "screen", taps "might", and ticks each entity on its word; a tiny
     booth pops beside each one (the route's three booths, so the next scene is already on screen in small).
     ===================================================================================================== */
  var CW = { x0: 150, x1: 890, y0: 525, y1: 1325 };
  var CA = { y0: 782, y1: 1010 }, CB = { y0: 1030, y1: 1302 };
  var VIS = [{ s: 'Websites you visit', y: 1180, kind: 'shop' }, { s: 'Your employer or school', y: 1230, kind: 'wifi' }, { s: 'Your internet service provider', y: 1280, kind: 'pole' }];
  var NOT = ['Your browsing history', 'Cookies and site data', 'Information entered in forms'];
  var ITX = 236, IPX = 40;
  function screenScene(g, t) {
    var t0 = S('screen').t0;
    var fi = eio(seg(t, K.zoom0 + .45, K.zoom1)), sc = lerp(1.06, 1, fi);
    var drift = 6 * Math.sin((t - t0) * .9), pk = 1 + .06 * eio(seg(t, 7.5, 12.7));
    g.save(); g.translate(520, 1150); g.scale(pk, pk); g.translate(-520, -1150);
    g.save(); g.globalAlpha *= t < t0 ? fi : 1; g.translate(520, 925 + drift * (t < t0 ? 0 : 1)); g.scale(sc, sc); g.translate(-520, -925);
    /* the window */
    var r = mulberry(73);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, CW.x0 + 10, CW.y0 + 14, CW.x1 - CW.x0, CW.y1 - CW.y0, 22); g.fill();
    g.fillStyle = WIN; cut(g, [[CW.x0, CW.y0 + 10], [CW.x1, CW.y0 + 10], [CW.x1, CW.y1], [CW.x0, CW.y1]], r, 1.4);
    g.fillStyle = WIN_BAR; rr(g, CW.x0, CW.y0, CW.x1 - CW.x0, 62, 20); g.fill();
    g.fillStyle = WIN; rr(g, CW.x0 + 24, CW.y0 + 14, 230, 48, 14); g.fill();
    mask(g, CW.x0 + 62, CW.y0 + 38, .16, GRAPHITE);
    prop(g, 'window', CW.x0, CW.y0, CW.x1 + 10, CW.y1 + 14);
    mask(g, 520, 648, .62, GRAPHITE);
    ONPROP = true;
    txt(g, 'You’ve gone Incognito', 520, 734, 54, CREAM, 'center', 800, DISP, 680);
    /* card A: Chrome won't save */
    g.fillStyle = WIN_CARD; rr(g, 176, CA.y0, 688, CA.y1 - CA.y0, 16); g.fill();
    txt(g, 'Chrome won’t save:', 206, 828, 40, CREAM, 'left', 800, DISP, 620);
    NOT.forEach(function (s, i) { txt(g, s, ITX, 884 + i * 50, IPX, CREAM, 'left', 600, DISP, 600); });
    /* card B: might still be visible to */
    g.fillStyle = WIN_CARD; rr(g, 176, CB.y0, 688, CB.y1 - CB.y0, 16); g.fill();
    txt(g, 'Your activity might still', 206, 1074, 40, CREAM, 'left', 800, DISP, 620);
    txt(g, 'be visible to:', 206, 1122, 40, CREAM, 'left', 800, DISP, 620);
    VIS.forEach(function (v) { txt(g, v.s, ITX, v.y, IPX, CREAM, 'left', 600, DISP, 560); });
    ONPROP = false;
    /* the pencil's marks: underline on "screen", a double tap under "might", ticks on each entity */
    var mx0 = 206 + tw('Your activity ', 40, 800), mx1 = 206 + tw('Your activity might still', 40, 800), my1 = 206 + tw('be visible to', 40, 800);
    var u1 = eio(seg(t, K.screenW, K.screenW + .32)), u2 = eio(seg(t, K.screenW + .3, K.screenW + .55));
    g.save(); g.strokeStyle = GRAPHITE; g.lineWidth = 6; g.lineCap = 'round';
    if (u1 > 0) { g.beginPath(); g.moveTo(mx0, 1100); g.lineTo(lerp(mx0, mx1, u1), 1100 + 2 * u1); g.stroke(); }
    if (u2 > 0) { g.beginPath(); g.moveTo(206, 1148); g.lineTo(lerp(206, my1, u2), 1147); g.stroke(); }
    var mt = eio(seg(t, K.might, K.might + .2));
    if (mt > 0) { g.beginPath(); g.moveTo(mx0, 1108); g.lineTo(lerp(mx0, mx0 + tw('might', 40, 800), mt), 1109); g.stroke(); }
    g.restore();
    var TK = [K.websites, K.school, K.provider];
    VIS.forEach(function (v, i) {
      var k = pop(t, TK[i] - .02, 3.4);
      check(g, 210, v.y, k, fin(t, TK[i] - .02));
    });
    g.restore();
    /* the pencil itself: in on "printed", under the line on "screen", along to each entity */
    var pin = eio(seg(t, K.printed - .1, K.printed + .5));
    if (pin > 0 && t >= t0 - .05 && !(t >= K.provider + .9)) {
      var px, py;
      var P = [[lerp(-420, mx0 - 10, pin), lerp(1180, 1104, pin)]];
      px = P[0][0]; py = P[0][1];
      if (t >= K.screenW) { px = lerp(mx0, mx1, u1); py = 1104; if (u2 > 0) { px = lerp(206, my1, u2); py = 1150; } }
      if (t >= K.screenW + .6) { var b0 = eio(seg(t, K.screenW + .6, K.might - .05)); px = lerp(my1, mx0, b0); py = lerp(1150, 1110, b0); }
      if (t >= K.might) { px = lerp(mx0, mx0 + tw('might', 40, 800), mt); py = 1110; }
      var stops = [[K.might + .25, mx0 + tw('might', 40, 800), 1110]].concat(TK.map(function (tk, i) { return [tk, 222, VIS[i].y + 6]; }));
      for (var j = 0; j < stops.length - 1; j++) {
        var A = stops[j], B = stops[j + 1];
        if (t >= A[0]) { var e = eio(seg(t, A[0] + .2, B[0] - .1)); px = lerp(A[1], B[1], e); py = lerp(A[2], B[2], e) - 18 * Math.sin(Math.PI * e); }
      }
      if (t >= TK[2]) { var out = eio(seg(t, TK[2] + .35, TK[2] + .9)); px = lerp(222, -420, out); py = lerp(VIS[2].y + 6, 1200, out); }
      px += 3 * Math.sin(t * 7.3); py += 2 * Math.cos(t * 6.1);
      pencil(g, px - 290, py + 34, px, py);
    }
    g.restore();
    /* the tag and the source, under the window */
    var ta = t < t0 ? 0 : 1;
    tag(g, 'RE-CREATED · CHROME INCOGNITO SCREEN', CX, 1382, ta, 0);
    txt(g, 'TEXT: CHROMIUM SOURCE, OCT 31, 2026', CX, 1428, 36, CREAM, 'center', 700, DISP, 790, ta);
  }

  /* =====================================================================================================
     SCENE 3 · the route (why → hero). Top: the laptop and the HISTORY slip it feeds out (shredded on "forgets", ON YOUR
     DEVICE beside it). The string drops from the laptop and runs through three booths: YOUR SCHOOL OR WORK, YOUR INTERNET
     PROVIDER, THE WEBSITE. On "page" a new envelope pops out, slides down and through booth 1 and 2 on "crosses", into
     THE WEBSITE on "site". On "them" a pencil bracket over the three open windows. In the silence: the coral stamp, then
     the hero hold (fully still ≥ 1.2 s).
     ===================================================================================================== */
  var RT = { lx: 100, ly: 548, lw: 320, lh: 212, sx: 112, sy: 1020, by: 900, bh: 280, bw: 222 };
  var BOOTHS = [{ x0: 190, kind: 'wifi', L: ['YOUR', 'SCHOOL', 'OR WORK'] }, { x0: 445, kind: 'pole', L: ['YOUR', 'INTERNET', 'PROVIDER'] }, { x0: 700, kind: 'shop', L: ['THE', 'WEBSITE'] }];
  var SLIPX = RT.lx + RT.lw + 4, SLIPY = 588, SLIPH = 150, STAMPX = 664;
  /* the envelope's path: out of the laptop (top of the drop), down the string, round the corner, right through the booths */
  var EW = 160;
  function routePath(u) {   /* u in px along the path */
    var down = RT.sy - (RT.ly + RT.lh + 60);
    if (u <= down) return { x: RT.sx, y: RT.ly + RT.lh + 60 + u };
    return { x: RT.sx + (u - down), y: RT.sy };
  }
  var PATH_DOWN = RT.sy - (RT.ly + RT.lh + 60), BX = BOOTHS.map(function (b) { return b.x0 + RT.bw / 2; });
  function routeU(t) {
    /* down the drop from "page", the corner on "crosses", booth 1 → booth 2 on "network", booth 3 on "site" */
    var u1 = PATH_DOWN, u2 = PATH_DOWN + (BX[0] - RT.sx), u3 = PATH_DOWN + (BX[1] - RT.sx), u4 = PATH_DOWN + (BX[2] - RT.sx) + 10;
    if (t < K.page + .1) return 0;
    if (t < K.crosses) return u1 * eio(seg(t, K.page + .1, K.crosses));
    if (t < K.network) return lerp(u1, u2, eio(seg(t, K.crosses, K.network - .02)));
    if (t < K.site) return lerp(u2, u3, eio(seg(t, K.network, K.site - .1)));
    return lerp(u3, u4, eout(seg(t, K.site - .1, K.site + .35)));
  }
  function routeScene(g, t) {
    var t0 = S('route').t0, i;
    /* after the hold: a slow push toward the stamp until the torn edge (the credit stays put) */
    var pu = 1 + .04 * eio(seg(t, HOLD.t1, HOLD.t1 + .7));
    g.save(); g.translate(640, 1300); g.scale(pu, pu); g.translate(-640, -1300);
    /* the slip: feeds out of the laptop's side, shreds on "forgets", the strips settle on "you" */
    var feed = 490 * eio(seg(t, t0 - .2, K.forgets - .05)), sh = eio(seg(t, K.forgets, K.forgets + .5)), st = eio(seg(t, K.forgets2, K.you + .15));
    slip(g, SLIPX, SLIPY, feed, SLIPH, sh, st, t);
    /* cuts racing across on "forgets" */
    if (t >= K.forgets && sh < .3) { g.save(); g.fillStyle = 'rgba(33,29,38,.55)'; for (i = 1; i < 7; i++) { var ct = K.forgets + i * .02; if (t >= ct) g.fillRect(SLIPX + i * 70 - 1.5, SLIPY, 3, SLIPH); } g.restore(); }
    /* the string: a drop from the laptop, then right through the windows */
    var r0 = 24;
    cord(g, [[RT.sx, RT.ly + RT.lh + 20], [RT.sx, RT.sy - r0], [RT.sx + 6, RT.sy - 6], [RT.sx + r0, RT.sy], [W + 20, RT.sy]]);
    laptop(g, RT.lx, RT.ly, RT.lw, RT.lh, 9);
    /* the envelope */
    var u = routeU(t), p = routePath(u), born = t >= K.page - .25;
    var ek = born ? pop(t, K.page - .25, 3.2) : 0;
    var draws = [];
    if (born) {
      var drawEnv = function () { g.save(); g.translate(p.x, p.y); g.scale(ek, ek); g.translate(-p.x, -p.y); envelope(g, p.x, p.y, EW, .03 * Math.sin((t - K.page) * 5) * (1 - seg(t, K.site, K.site + .4))); g.restore(); };
      draws.push(drawEnv);
    }
    /* booths; a window opens as the envelope comes within reach and stays open */
    BOOTHS.forEach(function (b, k) {
      var reach = PATH_DOWN + (BX[k] - RT.sx) - 200, ok = 0;
      if (born) { var tt = t; ok = clamp((u - reach) / 120, 0, 1); }
      var open = eio(ok);
      var inBooth = born && p.y >= RT.sy - 1 && p.x + EW / 2 > b.x0 + 18 && p.x - EW / 2 < b.x0 + RT.bw - 18;
      booth(g, b.x0, RT.by, RT.bw, RT.bh, b.kind, open, 41 + k * 7, function () { cord(g, [[b.x0, RT.sy], [b.x0 + RT.bw, RT.sy]]); if (inBooth) draws[0](); });
      b.L.forEach(function (s, j) { txt(g, s, BX[k], 1220 + j * 44, 40, CREAM, 'center', 900, DISP, 250); });
    });
    /* the envelope outside the booths (on the drop, between booths) is drawn on top */
    if (born) {
      var inside = p.y >= RT.sy - 1 && BOOTHS.some(function (b) { return p.x + EW / 2 > b.x0 + 18 && p.x - EW / 2 < b.x0 + RT.bw - 18; });
      if (!inside) draws[0]();
      else {
        /* the part between two booths: redraw clipped to the gaps so it is never hidden by a wall it hasn't reached */
        g.save(); g.beginPath();
        var xs = [0].concat(BOOTHS.map(function (b) { return b.x0; })), xe = BOOTHS.map(function (b) { return b.x0 + RT.bw; });
        g.rect(0, 0, BOOTHS[0].x0, H); g.rect(BOOTHS[0].x0 + RT.bw, 0, BOOTHS[1].x0 - BOOTHS[0].x0 - RT.bw, H); g.rect(BOOTHS[1].x0 + RT.bw, 0, BOOTHS[2].x0 - BOOTHS[1].x0 - RT.bw, H);
        g.clip(); draws[0](); g.restore();
      }
    }
    /* FORGOTTEN ON YOUR DEVICE, directly under the slip and the laptop, on "device" */
    var da = fin(t, K.device - .05);
    txt(g, 'FORGOTTEN ON YOUR DEVICE', 520, 830, 40, CREAM, 'center', 900, DISP, 800, da);
    /* THE stamp, on the shredded slip */
    stamp(g, 'YOUR\nDEVICE\nONLY', STAMPX, 676, t, GT.slam, 64, HOT, -.04, true);
    g.restore();
    /* the credit stays under the route for the whole scene, through the hold */
    txt(g, 'CHROME’S OWN SCREEN:', CX, 1380, 36, CREAM, 'center', 700, MONO, 820, 1);
    txt(g, '“MIGHT STILL BE VISIBLE TO”', CX, 1424, 36, CREAM, 'center', 800, DISP, 820, 1);
  }

  /* =====================================================================================================
     SCENE 4 · the settlement folder (settle). A manila folder, re-created: BROWN v. GOOGLE, filed Apr 1, 2024, N.D. Cal.;
     a stack of record slips the eraser scrubs on "scrub"; "BILLIONS OF EVENT RECORDS" (Google's estimate) circled in
     pencil on "billions"; GOOGLE ADMITS NO WRONGDOING. A paper clip snaps on in the silence after "records." (the slap).
     ===================================================================================================== */
  var FD = { x0: 150, x1: 890, y0: 560, y1: 1330 };
  function scribble(g, x0, x1, y, seed, a) {
    var r = mulberry(seed); g.save(); g.globalAlpha *= a; g.strokeStyle = PENCIL; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath();
    var x = x0; while (x < x1) { var wl = 18 + r() * 46; g.moveTo(x, y + (r() - .5) * 3); for (var k = 0; k <= 6; k++) g.lineTo(x + wl * k / 6, y + Math.sin(k * 1.9 + r() * 2) * 5); x += wl + 10 + r() * 8; }
    g.stroke(); g.restore();
  }
  function folderScene(g, t) {
    var t0 = S('folder').t0, i, r = mulberry(83);
    /* lift-off on "So," : the folder rises off frame 0's desk */
    var lift = eio(seg(t, S('outro').t0, S('outro').t0 + .5));
    g.save(); g.translate(0, -1500 * lift); g.rotate(-.02 * lift);
    /* the back of the folder with its tab */
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(FD.x0 + 12, FD.y0 + 16, FD.x1 - FD.x0, FD.y1 - FD.y0);
    g.fillStyle = MANILA_D; cut(g, [[FD.x0, FD.y0], [FD.x0 + 40, FD.y0 - 50], [FD.x0 + 400, FD.y0 - 50], [FD.x0 + 440, FD.y0], [FD.x1, FD.y0], [FD.x1, FD.y1], [FD.x0, FD.y1]], r, 1.8);
    ONPROP = true; txt(g, 'BROWN v. GOOGLE', FD.x0 + 220, FD.y0 - 18, 40, INK, 'center', 900, DISP, 380); ONPROP = false;
    /* the sheet */
    var slapK = t >= GT.slap ? Math.exp(-(t - GT.slap) * 14) * Math.sin((t - GT.slap) * 40) : 0;
    g.save(); g.translate(0, 3 * slapK);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(196, 606, 660, 700);
    g.fillStyle = PAPER; cut(g, [[188, 596], [852, 596], [852, 1306], [188, 1306]], r, 1.2);
    prop(g, 'sheet', 188, 596, 852, 1300);
    ONPROP = true;
    txt(g, 'SETTLEMENT FILED', 520, 650, 44, INK, 'center', 900, DISP, 620);
    txt(g, 'APR 1, 2024 · N.D. CAL.', 520, 704, 36, INK, 'center', 700, MONO, 620, 1, 30);
    ONPROP = false;
    /* the stack of record slips; the eraser scrubs the top one on "scrub" */
    for (i = 5; i >= 0; i--) {
      var yy = 750 + i * 14, xo = (i % 2 ? 6 : -4);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(262 + xo + 4, yy + 6, 520, 150);
      g.fillStyle = i ? TAPE_D : TAPE; g.fillRect(262 + xo, yy, 520, 150);
    }
    prop(g, 'slips', 258, 750, 790, 990);
    var sx = 266, se = eio(seg(t, K.scrub - .05, 25.7)), ex = lerp(300, 760, se) + 30 * Math.sin(se * Math.PI * 13) * (se > 0 && se < 1 ? 1 : 0);
    [0, 1, 2].forEach(function (k) {
      var ly = 792 + k * 40;
      /* what is left of each scribbled line: right of the eraser's sweep */
      g.save(); g.beginPath(); g.rect(se > 0 ? ex - 10 : 0, 0, W, H); g.clip(); scribble(g, 300, 744, ly, 101 + k, 1); g.restore();
    });
    if (se > 0) {
      /* crumbs behind the eraser */
      var rc = mulberry(7);
      g.fillStyle = 'rgba(160,150,140,.8)';
      for (i = 0; i < 26; i++) { var cx0 = 300 + rc() * 460, cy0 = 780 + rc() * 110; if (cx0 < ex - 20) el(g, cx0, cy0 + (t - K.scrub) * 6 * rc(), 3 + rc() * 3, 2 + rc() * 2); }
    }
    var eA = 1 - seg(t, 25.72, 25.9);
    if (se > 0 && eA > 0) {
      g.save(); g.globalAlpha *= eA; g.translate(ex, 830 - 10 * Math.abs(Math.sin(se * Math.PI * 13))); g.rotate(-.18);
      g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -56, -32, 120, 76, 10); g.fill();
      g.fillStyle = '#f2f0ea'; rr(g, -62, -40, 124, 76, 10); g.fill();
      g.fillStyle = '#5f86b5'; g.fillRect(-20, -40, 82, 76); g.fillStyle = '#7ea1c9'; g.fillRect(-20, -40, 82, 12);
      prop(g, 'eraser', -62, -40, 62, 36);
      g.restore();
    }
    ONPROP = true;
    txt(g, '“BILLIONS OF', 520, 1018, 48, INK, 'center', 900, DISP, 620);
    txt(g, 'EVENT RECORDS”', 520, 1068, 48, INK, 'center', 900, DISP, 620);
    txt(g, 'PRIVATE-BROWSING DATA', 520, 1134, 36, INK, 'center', 900, DISP, 620);
    txt(g, 'GOOGLE’S ESTIMATE', 520, 1178, 34, INK, 'center', 700, MONO, 620, 1, 30);
    txt(g, 'GOOGLE ADMITS', 520, 1230, 42, INK, 'center', 900, DISP, 620);
    txt(g, 'NO WRONGDOING', 520, 1274, 42, INK, 'center', 900, DISP, 620);
    ONPROP = false;
    /* the pencil circle round the quote on "billions" */
    var cc = eio(seg(t, K.billions + .02, K.billions + .45));
    if (cc > 0) { g.save(); g.strokeStyle = PENCIL; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.ellipse(520, 1043, 284, 66, -.01, -2.6, -2.6 + 6.6 * cc); g.stroke(); g.restore(); }
    /* the paper clip, snapped on in the silence after "records." */
    var ck = t >= GT.slap ? eout(seg(t, GT.slap, GT.slap + .08)) : 0;
    if (ck > 0) {
      g.save(); g.translate(832, lerp(470, 600, ck)); g.rotate(.06);
      g.strokeStyle = '#c3c8cf'; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-14, 70); g.lineTo(-14, -30); g.arc(4, -30, 18, Math.PI, 0); g.lineTo(22, 90); g.arc(-2, 90, 24, 0, Math.PI); g.lineTo(-26, -6); g.stroke();
      prop(g, 'clip', -40, -50, 30, 120);
      g.restore();
    }
    g.restore();
    g.restore();
    /* the tag, outside the folder (fades as it lifts) */
    var tga = 1 - seg(t, S('outro').t0 - .12, S('outro').t0 - .02);
    tag(g, 'RE-CREATED', CX - 130, 1398, tga, 0);
    txt(g, 'ECF 1097-4', CX + 120, 1398, 36, CREAM, 'center', 700, MONO, 300, tga);
  }

  /* =====================================================================================================
     SCENE 5 · the end card: frame 0's desk, laptop, string and booth. The envelope slides back out of the laptop and the
     window closes to frame 0's state, so the last frame is frame 0. YES / NO in coral.
     ===================================================================================================== */
  function outroEnvX(t) {
    var a = S('outro').t0 + .4;
    /* the window shuts first (on "think incognito"), then the envelope slides back out to frame 0's spot (on "hid you") */
    return lerp(DK.lx + DK.lw - 160, DK.XA, eio(seg(t, K.incog + .45, K.yes - .05)));
  }
  function outroScene(g, t) {
    var a = S('outro').t0;
    /* the envelope comes out from behind the lid: clip to the right of the lid while it emerges */
    var ex = outroEnvX(t), open = lerp(1, .15, eio(seg(t, a + .55, K.incog + .5)));
    var r = mulberry(17);
    deskWorldOutro(g, t, ex, open);
    /* YES / NO */
    var yk = function (w) { return 1 + .06 * Math.sin(Math.PI * seg(t, w - .06, w + .3)); };
    var ya = fin(t, a + .3) * (1 - seg(t, K.noEnd + .08, K.noEnd + .26));
    [['YES', 380, K.yes], ['NO', 640, K.no]].forEach(function (c) {
      var on = fin(t, c[2] - .08);
      chip(g, c[0], c[1], 696, { px: 64, wt: 900, line: HOT, lw: 5, fg: HOT, w: 200, r: 40, shadow: false, a: ya * (on < 1 ? 1 : 0) });
      chip(g, c[0], c[1], 696, { px: 64, wt: 900, bg: HOT, fg: BG, w: 200, r: 40, a: ya * on, s: yk(c[2]) });
    });
  }
  function deskWorldOutro(g, t, envX, open) { deskWorld(g, t, envX, open); }

  /* ---------- captions: the narrator's words, one block at a time; stressed words get a cream pill (never coral) ---------- */
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'ask') return;   /* frame 0 carries the hook; the ask line is the printed question */
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1 && !(l.id === 'end' && /you\?$/.test(w.w)) && l.id !== 'hero') { out.push({ id: l.id, ws: cur }); cur = []; }
      });
      if (cur.length) out.push({ id: l.id, ws: cur });
    });
    return out.map(function (c) { var ws = c.ws; return { id: c.id, t0: ws[0].t0, s: c.id === 'screen' ? Math.max(ws[0].t0, K.hookOut + .04) : ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS = [['screen', 'own'], ['visible', 'might'], ['visible', 'websites'], ['network', 'school'], ['network', 'provider'], ['why', 'device'],
    ['travel', 'crosses'], ['hero', 'them'], ['settle', 'billions'], ['end', 'yes'], ['end', 'no']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, over: 1, that: 1, up: 1, own: 1, is: 1, it: 1, go: 1, does: 1, big: 1, far: 1, from: 1, be: 1, or: 1, for: 1 };
  var CAPMIN = 1e9;
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s - .04 : 1e9;
    var keep = nx && (ns - card0.t1 < 1.9);   /* the caption stays through the planned pauses (stamp + hold, slap) */
    var o1 = keep ? ns : Math.min(card0.t1 + .5, ns - .12), o0 = keep ? ns : Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.s - .04, card0.s + .06), out = keep ? (t < ns ? 1 : 0) : 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - card0.s + .04, 3.2, .8), 0, 1.04);
    g.save(); g.font = '800 74px Archivo'; wide(g);
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 22;
    var lines, lw, maxw = 820, cpx = 74;
    function lay() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; }); }
    function fixLines() {
      for (var L = 0; L < lines.length - 1; L++) {
        var last = lines[L][lines[L].length - 1];
        while (lines[L].length > 1 && GLUE[norm(words[last].w)]) { lines[L].pop(); lines[L + 1].unshift(last); last = lines[L][lines[L].length - 1]; }
      }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw) && cpx > 52) { cpx -= 4; g.font = '800 ' + cpx + 'px Archivo'; wide(g); ws = words.map(function (w) { return g.measureText(w.w).width; }); gap = cpx * .28; lay(); fixLines(); }
    var lh = cpx * 1.18, y0 = (lines.length > 1 ? 368 : 408) + 50 - (lines.length - 1) * lh / 2;   /* pill tops at y ≥ 304 */
    g.globalAlpha = fi * out * (alpha == null ? 1 : alpha);
    NOREC = true;
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 30;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 12, y - cpx * .87, ws[i] + 24, cpx * 1.15, 18); g.fill(); CAPMIN = Math.min(CAPMIN, y - cpx * .87); }
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    NOREC = false;
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = { desk: deskScene, screen: screenScene, route: routeScene, folder: folderScene, outro: outroScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) { g.save(); SCENES[Sc.fn](g, t); g.restore(); }
  /* the cut: a torn-paper edge rising from the bottom along one axis (cream), the next scene drawn under it */
  function edgeY(x, ly, t) { var i = Math.round(x / 30); return ly + (i % 2 ? -10 : 8) + Math.sin(x * .013 + t * 5) * 4; }
  function tornEdge(g, ly, t) { g.save(); g.strokeStyle = CREAM; g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); for (var x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t); if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore(); }
  function clipBelow(g, ly, t) { g.beginPath(); g.moveTo(0, H); for (var x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    /* the torn edge is placed at the frame's own time, not per motion-blur sample: the wipe stays opaque */
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(te, Nx.t0 - SWIPE, Nx.t0)) : 0, ly = H * (1 - sk) - 20;
    COVER = sk > 0 ? ly - 14 : 1e9;
    /* the folder lifts off the end card: the end card is drawn under it */
    if (Sc.id === 'outro') { drawScene(g, Sc, t); if (t < Sc.t0 + .55) drawScene(g, S('folder'), t); }
    else drawScene(g, Sc, t);
    if (si === 0 && !POSTERMODE && LIVE.text) hookText(g, t, 1 - seg(t, K.hookOut - .1, K.hookOut));
    COVER = 1e9;
    if (sk > 0) {
      g.save(); clipBelow(g, ly, te);
      stage(g); INCOMING = true; drawScene(g, Nx, t); INCOMING = false; g.restore();
      tornEdge(g, ly, te);
    }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) {
      /* after "no." the caption leaves and frame 0's three words come back, so the loop lands on frame 0 */
      var back = seg(t, K.noEnd + .04, K.noEnd + .18);
      captions(g, t, 1 - back);
      if (Sc.id === 'outro') hookText(g, t, seg(t, K.noEnd + .13, K.noEnd + .23));
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    var a = 'What incognito', b = 'really hides', px = 92;
    g.save(); font(g, px, 800); g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText(a, CX, 382);
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 478 - 80, wb + 28, 106, 16); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 478); g.restore();
  }
  /* every text that is fully readable at t (not fading, not under a torn edge, not a caption): drawn to find out */
  function TEXTS(t) {
    REC = {}; frame(tctx, t); var r = REC; REC = null;
    return Object.keys(r).map(function (k) { return { id: k, text: k, x0: 0, y0: 0, x1: 0, y1: 0 }; });
  }

  /* ---------- events: the sound design reads the same word times; hits sit between words, never on them ---------- */
  var EV = [];
  /* the SFX gate (vo/heard.js, written from the finished mix): a hit's whole body keeps 0.19 s clear of every word start
     and end that unhinted faster-whisper base.en and small.en heard in the mix (the gate is 0.15), and clear of every
     stretch where the voice-only track is at or above −40 dBFS. Without heard.js the vo.js word times stand in. */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  if (!EDGES.length) VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 + .15 }); EDGES.push(w.t0, w.t1 + .15); }); });
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
  var BODY = { thump: .16, slap: .16 };
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || .19).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  /* Two hits (BRIEF §0): THE stamp in the 1.0 s silence after "Not for them." and the folder clip after "records." */
  var GT = {}, GS = [];
  function initGaps() {
    var s0 = nearGap(K.themEnd + .22, 'thump', .2); GT.slam = s0 === null ? K.themEnd + .22 : s0; GS.push({ t: GT.slam, type: 'thump', g: .15 });
    var s1 = nearGap(K.records + .36, 'slap', .2); GT.slap = s1 === null ? K.records + .36 : s1; GS.push({ t: GT.slap, type: 'slap', g: .32 });
  }
  function initTimes() {
    GS.forEach(function (e) { EV.push({ t: e.t, type: e.type, g: e.g, t1: e.t + BODY[e.type] }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    /* the first two frames are drawn sharp: no motion-blur ghost of the gliding envelope on frame 0 */
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
    }
    /* the folder clip: a light steel snap on paper, mid band, no low body (the thump stays the one heavy hit) */
    function clipSlap(t, g) {
      g = g || 1;
      band(t, .05, 1900, 1.2, 3.2 * g, .001, .04);
      band(t + .004, .09, 1100, .8, 1.6 * g, .003, .05);
      osc('triangle', 520, t, t + .06, 1, [[t, 0], [t + .002, .18 * g], [t + .05, 0]], .02);
    }
    EV.forEach(function (e) {
      if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'slap') clipSlap(e.t, e.g);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone, about −60 dB, so the loop seam is never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = ROOM; })();
  }
  var ROOM = .0105;

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d'); MC = mk(8, 8).getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹✓✕–@!>$(),:'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initGaps();
  initTimes();
  /* the hero hold: from the stamp settling, fully still for 1.3 s, then the torn edge to the folder */
  var SETTLE_CAP = at('settle', 'in') + .02;   /* with the voice */
  /* the hold sits in the silence after "them.": from the stamp settling to the settle caption arriving with the voice */
  var HOLD = { t0: GT.slam + .18, t1: SETTLE_CAP };
  /* the torn edge comes in under "settlement," once the stamp has had its read time */
  S('folder').t0 = Math.max(HOLD.t1 + .25 + SWIPE, GT.slam + 2.9);
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  /* the settle caption prints as the stamp settles, so nothing new appears inside the hold */
  CAPS.forEach(function (c) { if (c.id === 'settle' && c.words[0] === LINE.settle.words[0]) c.s = SETTLE_CAP; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: (HOLD.t0 + HOLD.t1) / 2, SLUG: 'incognito', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  /* labels vs props: every readable label's box (chip box for chips) against every prop box drawn in the same frame */
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
