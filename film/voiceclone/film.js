/* "How AI clones a voice from three seconds" — Factory #18 on Tech, explained (How AI works), after ../incognito/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the voice tape: a cream paper roll of number tiles (8 rows) that feeds out of a cut-paper microphone,
   keeps feeding past a pencil line (PREDICTED) and plays through a paper speaker. One hero stamp: JUST NUMBERS (coral);
   coral is also on the end card's YES / NO and nowhere else. Cut-paper props, no logos, no real UI, no photos. The paper
   card and the FBI folder are re-created and tagged RE-CREATED; the tape's digits are decorative (0–1023, the codebook size). */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', INK = '#211d26', PENCIL = '#3c3946', GRAPHITE = '#d9d3c6', GRAPH_D = '#b9b4ab', GRAPH_DD = '#8f8a82';
  var CARD = '#c8a273', CARD_D = '#a7814f', CARD_L = '#d9b88b';
  var MANILA = '#dcbd7e', MANILA_D = '#bf9d5c', MANILA_L = '#e8cf98';
  var TAPE = '#f4eddc', TAPE_D = '#ddd2ba', TILE = '#e6dbc4', CONE = '#efe6d2', SURROUND = '#cfc3a8', CAP = '#5f5866';
  var DISP = 'Archivo', MONO = '"Geist Mono"', SERIF = '"Instrument Serif"';

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
    so: start('ask'), cloning: at('ask', 'cloning'), work: at('ask', 'work'), askEnd: lend('ask'),
    paper: start('paper'), msft: at('paper', 'microsofts'), paperW: at('paper', 'paper'),
    first: start('numbers'), those: at('numbers', 'those'), become: at('numbers', 'become'), n1800: at('numbers', '1800'),
    then: start('predict'), predicts: at('predict', 'predicts'), words: at('predict', 'words'), never: at('predict', 'never'), said: wend('predict', 'said'),
    played: start('sound'), like: at('sound', 'like'), soundEnd: lend('sound'),
    hero: start('hero'), your: at('hero', 'your'), just: at('hero', 'just'), numbers: at('hero', 'numbers'), heroEnd: lend('hero'),
    fbi: start('fbi'), FBI: at('fbi', 'fbi'), fake: at('fbi', 'fake'), voices: lend('fbi'),
    tip: start('tip'), secret: at('tip', 'secret'),
    copy: start('secret'), sound2: at('secret', 'sound'), not2: at('secret', 'not'), secret2: at('secret', 'secret'),
    end: start('end'), yes: at('end', 'yes'), no: at('end', 'no'), noEnd: wend('end', 'no')
  };
  /* the headline: frame 0's three words, then the question on "So" (each long enough to read) */
  K.swap = 2.18;   /* a hard cut inside the gap after "voice." (1.92–2.31 s), as soon as frame 0's words have had their read time */
  K.hookOut = K.paper + .55;   /* the question stays up long enough to read (2.3 s) */
  /* the paper card slides up over the mic on "work" */
  K.card1 = K.paper - .02; K.card0 = Math.round((K.card1 - .3) * 30) / 30;   /* on a frame boundary (frames sample their slot centre): no motion-blur ghost of the card's first frame */

  /* scenes. swipe:true = the next scene comes in under the torn edge, drawn complete */
  var SWIPE = .44;
  var SC = [
    { id: 'mic', fn: 'mic', name: 'Only 3 seconds', t0: 0 },
    { id: 'paper', fn: 'paper', name: 'The paper', t0: K.card1 },
    { id: 'tape', fn: 'tape', name: 'Just numbers', t0: K.first + .1 + SWIPE, swipe: true },   /* the tear starts on "First" (heard at 7.11 s) */
    /* wipe 2 runs inside the silence after "just numbers." and is done before "In": the hero caption never meets the FBI line */
    { id: 'folder', fn: 'folder', name: 'The FBI warning', t0: K.fbi + .3, swipe: true, sw: .34, dir: 'left', ease: 'in' },   /* right to left, accelerating: the PREDICTED stretch goes first, the JUST NUMBERS stamp last */
    /* the folder fades down and out before the end caption arrives */
    { id: 'outro', fn: 'outro', name: 'Yes or no', t0: K.end - .42 }
  ];
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS;

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, MC, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- measuring: the safe area (BOUNDS_RUN), what is readable (TEXTS → readcheck) and labels vs props (LABELS_RUN) ---------- */
  var BOUNDS = null, REC = null, PROPS = null, LBL = null, INCOMING = false, CURT = 0, NOREC = false, ONPROP = false, CHIPBOX = null, COVER = 1e9, COVERX = 1e9;
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
    var b = xbox(g, x0, y0, x1, y1); if (b[1] > COVER || b[0] > COVERX) return; PROPS.push({ name: name, b: b });
  }
  function seen(g, text, b) {
    var vis = !INCOMING && !NOREC && g.globalAlpha >= .95 && b[3] <= COVER && b[2] <= COVERX && (g === ctx || g === tctx);
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
    var k = eout(seg(t, t0, t0 + .1)), s = lerp(1.35, 1, k), al = clamp(k * 3, 0, 1);
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
  /* paper grain inside the current path: seeded flecks, light and dark */
  function grainIn(g, x0, y0, w, h, seed) {
    var r = mulberry(seed), n = Math.floor(w * h / 160);
    g.save(); g.clip();
    for (var i = 0; i < n; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.10)'; g.fillRect(x0 + r() * w, y0 + r() * h, 1.6 + r() * 1.8, 1.6 + r() * 1.8); }
    g.restore();
  }
  /* a rounded rectangle as cut-paper points (for the torn-edge capsule) */
  function capsule(x, y, w, h, rad) {
    var P = [], k, a, c = [[x + w - rad, y + rad, -Math.PI / 2], [x + w - rad, y + h - rad, 0], [x + rad, y + h - rad, Math.PI / 2], [x + rad, y + rad, Math.PI]];
    c.forEach(function (q) { for (k = 0; k <= 6; k++) { a = q[2] + k / 6 * Math.PI / 2; P.push([q[0] + Math.cos(a) * rad, q[1] + Math.sin(a) * rad]); } });
    return P;
  }
  /* the cut-paper microphone: a grille capsule on a cardboard yoke, a pole and a base. (x, y) = head centre, s = scale,
     rot tips it back about the yoke's foot, slot 0..1 shows the paper slot in its top, pole = pole length (0 = desk mic).
     Every part is cut paper: wobbly scissor edges, a 7 px offset shadow, grain. */
  function mic(g, x, y, s, rot, slot, pole) {
    var r = mulberry(11);
    g.save(); g.translate(x, y); g.scale(s, s);
    var sh = 7 / s;
    if (pole > 0) {
      g.fillStyle = 'rgba(0,0,0,.36)'; g.fillRect(-9 + sh, 170 + sh, 18, pole);
      g.fillStyle = CARD_D; cut(g, [[-9, 170], [9, 170], [9, 170 + pole], [-9, 170 + pole]], r, 1.2);
      g.fillStyle = 'rgba(0,0,0,.36)'; g.fillRect(-92 + sh, 170 + pole - 6 + sh, 184, 28);
      g.fillStyle = CARD; cut(g, [[-92, 170 + pole - 6], [92, 170 + pole - 6], [92, 170 + pole + 22], [-92, 170 + pole + 22]], r, 1.6);
      grainIn(g, -92, 170 + pole - 6, 184, 28, 12);
      g.fillStyle = CARD_L; g.fillRect(-88, 170 + pole - 6, 176, 5);
    }
    g.translate(0, 170); g.rotate(rot || 0); g.translate(0, -170);
    /* the yoke: a cardboard U under the head */
    g.strokeStyle = 'rgba(0,0,0,.36)'; g.lineWidth = 16; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-112 + sh, 10 + sh); g.lineTo(-112 + sh, 120 + sh); g.quadraticCurveTo(-112 + sh, 170 + sh, -50 + sh, 170 + sh); g.lineTo(50 + sh, 170 + sh); g.quadraticCurveTo(112 + sh, 170 + sh, 112 + sh, 120 + sh); g.lineTo(112 + sh, 10 + sh); g.stroke();
    g.strokeStyle = CARD_D;
    g.beginPath(); g.moveTo(-112, 10); g.lineTo(-112, 120); g.quadraticCurveTo(-112, 170, -50, 170); g.lineTo(50, 170); g.quadraticCurveTo(112, 170, 112, 120); g.lineTo(112, 10); g.stroke();
    g.fillStyle = CARD_L; el(g, -112, 10, 12, 12); el(g, 112, 10, 12, 12);
    /* the head: offset shadow, a cut-paper capsule (body colour), the grille paper on its top, a band */
    var P = capsule(-100, -140, 200, 280, 96);
    g.fillStyle = 'rgba(0,0,0,.38)'; g.save(); g.translate(sh, sh); cut(g, P, mulberry(13), 0); g.restore();
    g.fillStyle = GRAPH_D; cut(g, P, mulberry(14), 2.2);
    grainIn(g, -100, -140, 200, 280, 15);
    g.save(); g.beginPath(); g.rect(-120, -160, 240, 210); g.clip();
    g.fillStyle = GRAPHITE; cut(g, capsule(-96, -136, 192, 272, 92), mulberry(16), 2);
    g.save(); g.clip();
    g.strokeStyle = 'rgba(33,29,38,.55)'; g.lineWidth = 6; g.lineCap = 'butt';
    for (var yy = -122; yy < 50; yy += 19) { g.beginPath(); g.moveTo(-100, yy + (r() - .5) * 2); g.lineTo(100, yy + (r() - .5) * 2); g.stroke(); }
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -140); g.lineTo(0, 50); g.stroke();
    grainIn(g, -100, -140, 200, 190, 17);
    g.restore(); g.restore();
    g.fillStyle = CARD_D; cut(g, [[-99, 44], [99, 44], [99, 70], [-99, 70]], mulberry(18), 1.4); g.fillStyle = CARD_L; g.fillRect(-98, 44, 196, 5);
    /* the paper slot in the top, shown when it tips back */
    if (slot > 0) { g.save(); g.globalAlpha *= clamp(slot, 0, 1); g.fillStyle = INK; rr(g, -56, -126, 112, 16, 8); g.fill(); g.fillStyle = TAPE; g.fillRect(-44, -122, 88, 4); g.restore(); }
    prop(g, 'mic', -112, -140, 112, 170 + (pole > 0 ? pole + 22 : 0));
    g.restore();
  }
  /* the paper speaker: a cardboard box with a cream paper cone, its surround and a dust cap; pulse 0..1 pushes the cap */
  function speaker(g, x0, y0, w, h, pulse) {
    var r = mulberry(23), cx = x0 + w / 2, cy = y0 + h * .58, R = w * .4;
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x0 + 7, y0 + 7, w, h);
    g.fillStyle = CARD; cut(g, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], r, 2.4);
    grainIn(g, x0 - 4, y0 - 4, w + 8, h + 8, 24);
    g.fillStyle = CARD_L; g.fillRect(x0 + 4, y0 + 4, w - 8, 6);
    /* tweeter */
    g.fillStyle = CARD_D; el(g, cx, y0 + h * .17, w * .12, w * .12); g.fillStyle = CONE; el(g, cx, y0 + h * .17, w * .07, w * .07);
    /* the woofer: cut-paper rings, each with a small offset shadow */
    var pk = 1 + .08 * (pulse || 0);
    function ring(rad, col, seed, amp) { var P = [], rr2 = mulberry(seed); for (var k = 0; k < 28; k++) { var a = k / 28 * 6.283; P.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } g.fillStyle = 'rgba(0,0,0,.22)'; g.save(); g.translate(3, 4); cut(g, P, mulberry(seed), 0); g.restore(); g.fillStyle = col; cut(g, P, rr2, amp); }
    ring(R + 8, CARD_D, 25, 1.6);
    ring(R * pk, SURROUND, 26, 1.6);
    ring(R * .82 * pk, CONE, 27, 1.4);
    grainIn(g, cx - R, cy - R, 2 * R, 2 * R, 28);
    g.strokeStyle = 'rgba(33,29,38,.18)'; g.lineWidth = 2;
    for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * .3, cy + Math.sin(a) * R * .3); g.lineTo(cx + Math.cos(a) * R * .8 * pk, cy + Math.sin(a) * R * .8 * pk); g.stroke(); }
    g.fillStyle = CAP; el(g, cx, cy, R * .28 * (1 + .14 * (pulse || 0)), R * .28 * (1 + .14 * (pulse || 0)));
    prop(g, 'speaker', x0, y0, x0 + w + 7, y0 + h + 7);
    return { cx: cx, cy: cy, R: R };
  }
  /* the 3-second waveform strip: one cut, used on frame 0, in the speaker's puff and on the end card */
  var WAVE = (function () { var r = mulberry(31), a = []; for (var i = 0; i < 24; i++) { var env = Math.sin(Math.PI * (i + .5) / 24); a.push(clamp(.18 + env * (.35 + r() * .55), .14, 1)); } return a; })();
  function waveStrip(g, x, y, w, h, ruler, rot) {
    var r = mulberry(37);
    g.save(); g.translate(x, y); if (rot) g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(8, 12, w, h);
    g.fillStyle = TAPE; cut(g, [[0, 0], [w, 0], [w, h], [0, h]], r, 1.4);
    var n = WAVE.length, bw = w / n;
    g.fillStyle = INK;
    for (var i = 0; i < n; i++) { var bh = (h - 22) * WAVE[i]; rr(g, i * bw + bw * .24, h / 2 - bh / 2, bw * .52, bh, bw * .2); g.fill(); }
    prop(g, 'strip', 0, 0, w, h + (ruler ? 54 : 0));
    if (ruler) {
      /* a cardboard ruler under it: a long tick at every second (0 · 1 · 2 · 3), short ticks between */
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(7, h + 13, w, 48);
      g.fillStyle = CARD_L; cut(g, [[0, h + 6], [w, h + 6], [w, h + 54], [0, h + 54]], mulberry(38), 1.2);
      g.strokeStyle = INK; g.lineCap = 'round';
      for (var k = 0; k <= 12; k++) { var xx = 4 + (w - 8) * k / 12, big = k % 4 === 0; g.lineWidth = big ? 6 : 3; g.beginPath(); g.moveTo(xx, h + 6); g.lineTo(xx, h + 6 + (big ? 40 : 16)); g.stroke(); }
    }
    g.restore();
  }
  /* the voice tape: cream paper, 8 rows of number tiles, column pitch CP. cols = how many columns are fed (fractional),
     wob = how much the tape trembles while it plays (0 when it settles), hi = the read head (column index, -1 off) */
  var ROWS = 8, CP = 54, TILE_W = 48, TILE_H = 24;
  var DIGITS = (function () { var r = mulberry(97), a = []; for (var i = 0; i < 400; i++) a.push(String(Math.floor(r() * 1024))); return a; })();
  function tape(g, x0, y0, h, cols, seed, t, wob, hi, tileK) {
    if (cols <= 0) return 0;
    var w = cols * CP + 10, r = mulberry(seed);
    g.save();
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(x0 + 8, y0 + 12, w, h);
    var gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, '#f8f2e4'); gr.addColorStop(.8, TAPE); gr.addColorStop(1, TAPE_D);
    g.fillStyle = gr; cut(g, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], r, 1.2);
    /* the sprocket edge: a row of small punched holes along top and bottom */
    g.fillStyle = 'rgba(33,29,38,.5)';
    for (var hx = x0 + 14; hx < x0 + w - 8; hx += 27) { el(g, hx, y0 + 7, 3, 3); el(g, hx, y0 + h - 7, 3, 3); }
    var ry0 = y0 + 16, rp = (h - 32) / ROWS;
    NOREC = true;   /* the tiles are decorative numbers, not a text to read: the label carries the meaning */
    font(g, 18, 600, MONO); g.textAlign = 'center'; g.textBaseline = 'middle';
    var nc = Math.ceil(cols);
    for (var c = 0; c < nc; c++) {
      var ck = clamp(cols - c, 0, 1), dy = wob ? wob * 7 * Math.sin(t * 19 + c * 1.3) : 0;
      if (ck <= 0) continue;
      for (var rI = 0; rI < ROWS; rI++) {
        var tk = tileK ? tileK(c, rI) : ck; if (tk <= 0) continue;
        var tx = x0 + 8 + c * CP, ty = ry0 + rI * rp + (rp - TILE_H) / 2 + dy;
        g.save(); g.globalAlpha *= clamp(tk * 1.6, 0, 1);
        g.fillStyle = c === hi ? '#d4c6a6' : TILE; rr(g, tx, ty, TILE_W, TILE_H, 4); g.fill();
        g.fillStyle = INK; g.fillText(DIGITS[(seed * 7 + c * ROWS + rI) % DIGITS.length], tx + TILE_W / 2, ty + TILE_H / 2 + 1);
        g.restore();
      }
    }
    NOREC = false;
    prop(g, 'tape', x0, y0, x0 + w, y0 + h);
    g.restore();
    return w;
  }
  /* a generic paper phone: round punch-hole, no notch, no logo */
  function phone(g, x0, y0, w, h, screen) {
    var r = mulberry(53);
    g.fillStyle = 'rgba(0,0,0,.38)'; rr(g, x0 + 9, y0 + 13, w, h, 30); g.fill();
    g.fillStyle = '#4a4652'; rr(g, x0, y0, w, h, 30); g.fill();
    g.fillStyle = '#5a5662'; rr(g, x0 + 3, y0 + 3, w - 6, 8, 4); g.fill();
    g.fillStyle = '#26232c'; rr(g, x0 + 10, y0 + 12, w - 20, h - 24, 22); g.fill();
    g.fillStyle = '#4a4652'; el(g, x0 + w / 2, y0 + 30, 6, 6);
    prop(g, 'phone', x0, y0, x0 + w + 9, y0 + h + 13);
    if (screen) { g.save(); rr(g, x0 + 10, y0 + 12, w - 20, h - 24, 22); g.clip(); screen(x0 + 10, y0 + 12, w - 20, h - 24); g.restore(); }
  }
  /* the folded card: a cream card whose flap is folded down over the word (the word is never shown); tuck 0..1 nudges it */
  function foldedCard(g, x0, y0, w, h, tuck) {
    var r = mulberry(59);
    g.fillStyle = 'rgba(0,0,0,.36)'; g.fillRect(x0 + 8, y0 + 12, w, h);
    g.fillStyle = PAPER; cut(g, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], r, 1.2);
    var fh = h * .46 * (1 - .12 * (tuck || 0));
    g.fillStyle = 'rgba(0,0,0,.18)'; poly(g, [[x0, y0], [x0 + w, y0], [x0 + w / 2, y0 + fh + 10]]); g.fill();
    g.fillStyle = TAPE_D; poly(g, [[x0, y0], [x0 + w, y0], [x0 + w / 2, y0 + fh]]); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w / 2, y0 + fh); g.lineTo(x0 + w, y0); g.stroke();
    prop(g, 'card', x0, y0, x0 + w + 8, y0 + h + 12);
  }

  /* =====================================================================================================
     SCENE 1 · the mic (hook → ask), also the end card. Frame 0: YOUR VOICE: / 3 SECONDS (4 words); the paper mic on its stand;
     the 3 s waveform strip on its ruler already out of the mic, gliding 300 px (on screen) right in the first second into the speaker
     cone, which plays it. At 1.0 s the scope card (MICROSOFT RESEARCH · VALL-E, 2023 · RESEARCH DEMO). On "So" the strip
     slides back into the mic and the mic tips back to show a paper slot; on "work" the paper card slides up over it, opaque.
     ===================================================================================================== */
  /* 1.3x the round-1 props: the mic's head spans x 12-388, the speaker x 790-1037; 400 px of strip shows between them */
  /* the mic world is drawn at MW.s (0.78) so every prop stays inside x 95–925: world x -11…1045 → screen 114…929 (measured on frames: 96–924) */
  var MK = { x: 200, y: 905, s: 1.885, pole: 74, sx0: 384, sx1: 769, sy: 830, sw: 400, sh: 150, spx: 780, spy: 645, spw: 247, sph: 449 };
  var MW = { s: .78, x: 114 + 11 * .78, y: 700 - 641 * .78 };
  /* the end card: YES / NO in the scope card's place, the closed OUR WORD envelope parked over the gap between YES and NO (never on one of them) */
  var EW = { x0: 589, y0: 1150, w: 160, h: 133 }, YN = { y: 1352, yes: 548, no: 790, w: 230 };
  function micWorld(g, t, stripX, tip, slot, pulse, chipA) {
    /* the strip, clipped so it disappears into the mic's middle (the mic is drawn over it) */
    g.save(); g.translate(MW.x, MW.y); g.scale(MW.s, MW.s);
    /* the strip, clipped between the mic's middle and the speaker's left edge: it goes into one and out of the other */
    g.save(); g.beginPath(); g.rect(MK.x, 0, MK.spx + 2 - MK.x, H); g.clip();
    waveStrip(g, stripX, MK.sy, MK.sw, MK.sh, true, 0);
    g.restore();
    speaker(g, MK.spx, MK.spy, MK.spw, MK.sph, pulse);
    mic(g, MK.x, MK.y, MK.s, tip, slot, MK.pole);
    g.restore();
    /* the scope card: the hook's source and what it is (a research demo), below the strip, never on it */
    if (chipA.a > 0) {
      g.save(); g.globalAlpha *= chipA.a; g.translate(662, 1282); g.scale(chipA.s, chipA.s); g.rotate(-.01);
      var w = 500, h = 198;
      rr(g, -w / 2, -h / 2, w, h, 16); g.fillStyle = 'rgba(21,19,27,.92)'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 3; g.stroke();
      recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] SCOPE');
      CHIPBOX = LBL ? xbox(g, -w / 2, -h / 2, w / 2, h / 2) : null;
      txt(g, 'MICROSOFT RESEARCH', 0, -56, 40, CREAM, 'center', 900, DISP, 460);
      txt(g, 'VALL-E, 2023', 0, 0, 40, CREAM, 'center', 900, DISP, 460);
      txt(g, 'RESEARCH DEMO', 0, 56, 38, CREAM, 'center', 700, MONO, 460);
      CHIPBOX = null; g.restore();
    }
  }
  /* frame 0's glide: fast at once (visible by 0.3 s), settling into the speaker at 1.0 s */
  function stripX0(t) { var k = clamp(t / 1.0, 0, 1); return MK.sx0 + (MK.sx1 - MK.sx0) * (1 - (1 - k) * (1 - k)); }
  function micScene(g, t) {
    /* on "So" the strip slides back into the mic; on "cloning" the mic tips back to show its slot */
    var back = eio(seg(t, K.so + .05, K.so + .6));
    var sx = lerp(stripX0(t), MK.x - MK.sw - 10, back);
    var tip = -.03 * eio(seg(t, K.cloning - .1, K.cloning + .35)), slot = seg(t, K.cloning, K.cloning + .3);
    /* the speaker plays the strip while it sits in the cone */
    var pulse = seg(t, .55, .9) * (1 - seg(t, K.so, K.so + .2)) * (.5 + .5 * Math.sin(t * 26));
    var ca = fin(t, 1.0, 3.4) * (1 - seg(t, K.card0 - .3, K.card0 - .1)), cs = pop(t, 1.0, 3.4);
    g.save();
    /* a slow bob of the whole world while the chip and the question are up (0 on frame 0, so the loop lands clean) */
    g.translate(0, 10 * Math.sin(2.4 * (t - 1.1)) * seg(t, 1.1, 1.5));
    /* the mic world sinks away under the paper card as it slides up */
    g.globalAlpha *= 1 - .7 * seg(t, K.card0, K.card1);
    micWorld(g, t, sx, tip, slot, pulse, { a: ca, s: cs });
    g.restore();
    if (t > K.card0) paperScene(g, t);
  }
  /* frame-0 type: YOUR VOICE: / 3 SECONDS, then HOW DOES AI / VOICE CLONING / WORK? */
  function hookText(g, t, a) {
    if (a <= 0) return;
    /* a hard cut on "So" (no crossfade) */
    var m = t >= K.end ? 0 : (t >= K.swap ? 1 : 0);
    function block(lines, Y, px0, al, dy, maxw) {
      if (al <= 0) return;
      var px = px0; g.save(); font(g, px, 900);
      while (Math.max.apply(null, lines.map(function (s) { return g.measureText(s).width; })) > maxw && px > 60) { px -= 2; font(g, px, 900); }
      g.globalAlpha = al; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
      lines.forEach(function (s, i) { g.fillText(s, CX, Y[i] + dy); });
      g.restore();
    }
    block(['YOUR VOICE:', '3 SECONDS'], [418, 566], 150, a * (1 - m), 0, 800);
    if (m > 0) block(['HOW DOES AI', 'VOICE CLONING', 'WORK?'], [356, 456, 556], 96, a * m, 0, 800);
  }

  /* =====================================================================================================
     SCENE 2 · the paper, re-created: Microsoft's VALL-E title card (arXiv 2301.02111, Jan 5, 2023) and the abstract's
     own words, "only a 3-second enrolled recording of an unseen speaker". The pencil underlines them on "paper".
     ===================================================================================================== */
  var PC = { x0: 130, x1: 890, y0: 560, y1: 1330 };
  var QY = [1078, 1136, 1194];
  /* the abstract's words, cut out of a longer sentence: ellipses at both ends */
  var Q0 = '“…only a 3-second', Q1 = 'enrolled recording of', Q2 = 'an unseen speaker…”';
  function paperScene(g, t) {
    /* the card is opaque from its first frame and slides up 60 px; nothing ghosts through it */
    var up = eout(seg(t, K.card0, K.card1)), dy = 60 * (1 - up);
    var drift = t > K.card1 ? 5 * Math.sin((t - K.card1) * 1.1) : 0;
    g.save(); g.translate(0, dy + drift + 40); g.rotate(-.006 * (1 - up));
    var r = mulberry(71);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(PC.x0 + 12, PC.y0 + 16, PC.x1 - PC.x0, PC.y1 - PC.y0);
    g.fillStyle = PAPER; cut(g, [[PC.x0, PC.y0], [PC.x1, PC.y0], [PC.x1, PC.y1], [PC.x0, PC.y1]], r, 1.4);
    prop(g, 'paper', PC.x0, PC.y0, PC.x1, PC.y1);
    ONPROP = true;
    txt(g, 'ARXIV 2301.02111', 172, 618, 34, INK, 'left', 700, MONO, 380, 1, 30);
    txt(g, 'JAN 5, 2023', 848, 618, 34, INK, 'right', 700, MONO, 260, 1, 30);
    g.fillStyle = 'rgba(33,29,38,.5)'; g.fillRect(172, 650, 676, 3);
    ['Neural Codec Language', 'Models are Zero-Shot', 'Text to Speech', 'Synthesizers'].forEach(function (s, i) { txt(g, s, CX, 712 + i * 60, 58, INK, 'center', 400, SERIF, 680); });
    txt(g, 'Wang et al.', 352, 970, 38, INK, 'center', 700, DISP, 300);
    txt(g, 'MICROSOFT', 668, 970, 38, INK, 'center', 900, DISP, 300);
    g.fillStyle = 'rgba(33,29,38,.5)'; g.fillRect(172, 1012, 676, 3);
    txt(g, 'ABSTRACT', CX, 1034, 30, '#6d6672', 'center', 700, MONO, 400, 1, 30);
    txt(g, Q0, CX, QY[0], 50, INK, 'center', 900, DISP, 680);
    txt(g, Q1, CX, QY[1], 50, INK, 'center', 900, DISP, 680);
    txt(g, Q2, CX, QY[2], 50, INK, 'center', 900, DISP, 680);
    ONPROP = false;
    /* the pencil's underline: line 1 on "paper", then lines 2 and 3 */
    var w0 = tw(Q0, 50, 900), w1 = tw(Q1, 50, 900), w2 = tw(Q2, 50, 900);
    var U = [[K.paperW - .25, w0], [K.paperW + .12, w1], [K.paperW + .45, w2]];
    g.save(); g.strokeStyle = PENCIL; g.lineWidth = 5; g.lineCap = 'round';
    var px = null, py = null;
    U.forEach(function (u, i) {
      var k = eio(seg(t, u[0], u[0] + .32));
      if (k > 0) { g.beginPath(); g.moveTo(CX - u[1] / 2, QY[i] + 32); g.lineTo(CX - u[1] / 2 + u[1] * k, QY[i] + 33 + 2 * k); g.stroke(); if (k < 1 || i === 2) { px = CX - u[1] / 2 + u[1] * k; py = QY[i] + 32; } }
    });
    g.restore();
    /* the pencil itself: in from the right on "Microsoft's", rides the underline, leaves after */
    var pin = eio(seg(t, K.msft - .1, K.paperW - .25));
    var pout = eio(seg(t, K.paperW + .85, K.paperW + 1.3));
    if (pin > 0 && pout < 1) {
      var x = px == null ? lerp(1400, CX - w0 / 2, pin) : px, y = py == null ? QY[0] + 32 : py;
      x = lerp(x, 1400, pout); y = lerp(y, 1240, pout);
      x += 3 * Math.sin(t * 7.3); y += 2 * Math.cos(t * 6.1);
      pencil(g, x + 300, y + 60, x, y);
    }
    g.restore();
    var ta = up >= 1 ? 1 : 0;
    tag(g, 'RE-CREATED', CX, 1402, ta, 0);
  }

  /* =====================================================================================================
     SCENE 3 · the tape (numbers → hero). Mic top left, speaker top right, the tape row between them. On "become" the tape
     feeds out under the mic, column by column (YOUR 3 SECONDS), on "1,800" the count with its noun and our math. On
     "predicts" the pencil draws the line and the tape keeps feeding past it (PREDICTED); NEW WORDS: SEE YOU AT SIX above.
     On "Played" a read head runs the new stretch into the speaker, the tape trembles and the paper waveform puffs out of
     the cone; on "your voice" it folds back into the tape; on "numbers" the tape settles. In the silence: the coral stamp
     JUST NUMBERS, then the hero hold (fully still, the hero caption up).
     ===================================================================================================== */
  /* the tape group is drawn 1.2x: local coordinates below, placed by TG on screen (local 0,0 = screen 98,905) */
  var TG = { x: 98, y: 905, s: 1.19 };   /* right edge with shadow at x 924 */
  var TP = { x0: 0, y0: 0, h: 236, lx: 400, cols1: 7, cols2: 5 };
  TP.x2 = TP.lx + 14;   /* the predicted stretch starts 28 px after the left stretch ends: the pencil line sits in the gap */
  var TM = { x: 210, y: 680, s: .9 }, TS = { x0: 752, y0: 560, w: 172, h: 250 };
  function tapeScene(g, t) {
    var t0 = S('tape').t0;
    /* the speaker's post down to the tape guide */
    g.fillStyle = CARD_D; g.fillRect(TS.x0 + TS.w / 2 - 9, TS.y0 + TS.h, 18, TG.y - TS.y0 - TS.h - 6);
    g.save(); g.translate(TG.x, TG.y); g.scale(TG.s, TG.s);
    /* the empty tape guide (two thin rails) before it feeds */
    g.fillStyle = 'rgba(244,237,224,.5)'; g.fillRect(TP.x0, TP.y0 - 7, 694, 4); g.fillRect(TP.x0, TP.y0 + TP.h + 3, 694, 4);
    /* left stretch: the first column creeps out under the tear, the rest feeds on "become" */
    var feed = 3.2 * seg(t, t0 - SWIPE, K.become - .05) + (TP.cols1 - 3.2) * eio(seg(t, K.become - .05, K.become + .85));   /* feeds from "First" (under the tear) in a steady creep until "become", so the scene never stalls */
    /* the tremble while it plays, settling on "numbers" */
    var wob = seg(t, K.played + .1, K.played + .4) * (1 - eio(seg(t, K.numbers - .05, K.numbers + .45)));
    var hiC = -1, rh = seg(t, K.played + .15, K.played + 1.05);
    if (rh > 0 && rh < 1) hiC = Math.floor(rh * TP.cols2);
    tape(g, TP.x0, TP.y0, TP.h, feed, 3, t, wob, -1);
    /* the pencil line: drawn top to bottom on "predicts", in the gap between the two stretches */
    var pl = eio(seg(t, K.predicts - .05, K.predicts + .3));
    if (pl > 0) { g.save(); g.strokeStyle = PENCIL; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(TP.lx, TP.y0 - 26); g.lineTo(TP.lx + 1.5 * pl, lerp(TP.y0 - 26, TP.y0 + TP.h + 26, pl)); g.stroke();
      g.strokeStyle = 'rgba(217,211,198,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(TP.lx - 2, TP.y0 - 24); g.lineTo(TP.lx - .5, lerp(TP.y0 - 24, TP.y0 + TP.h + 24, pl)); g.stroke(); g.restore(); }
    /* predicted stretch: keeps feeding past the line, tile by tile, from "predicts" to "said" */
    var pa = K.predicts + .25, pb = K.said - .05;
    var tileK = function (c, rI) { var i = c * ROWS + rI, n = TP.cols2 * ROWS, ti = pa + (pb - pa) * i / n; return seg(t, ti, ti + .12); };
    var cols2 = t >= pa ? TP.cols2 * clamp((t - pa) / (pb - pa) + .2, 0, 1) : 0;
    if (cols2 > 0) tape(g, TP.x2, TP.y0, TP.h, cols2, 9, t, wob, hiC, tileK);
    /* the pencil: draws the line on "predicts", then writes the new tiles one by one until "said", then leaves */
    var pIn = eio(seg(t, K.predicts - .25, K.predicts - .05)), pOut = eio(seg(t, pb + .05, pb + .45));
    if (pIn > 0 && pOut < 1) {
      var rp = (TP.h - 32) / ROWS, qx, qy;
      if (t < pa) { qx = TP.lx; qy = lerp(TP.y0 - 26, TP.y0 + TP.h + 26, pl); }
      else { var fi2 = clamp((t - pa) / (pb - pa), 0, 1) * TP.cols2 * ROWS, ci = Math.min(TP.cols2 * ROWS - 1, Math.floor(fi2)), fr = fi2 - Math.floor(fi2);
        var c0 = Math.floor(ci / ROWS), r0 = ci % ROWS; qx = TP.x2 + 8 + c0 * CP + TILE_W * (.3 + .4 * fr); qy = TP.y0 + 16 + r0 * rp + rp * .5 - 4 * Math.sin(fr * Math.PI); }
      qx = lerp(lerp(1100, qx, pIn), 1100, pOut); qy = lerp(lerp(400, qy, pIn), 360, pOut);
      pencil(g, qx + 240, qy + 75, qx, qy);
    }
    /* YOUR 3 SECONDS under the left stretch, once it has fed */
    var ya = fin(t, K.become + .8);
    txt(g, 'YOUR 3 SECONDS', TP.x0 + (TP.lx - TP.x0) / 2, TP.y0 + TP.h + 40, 36, CREAM, 'center', 900, DISP, 380, ya);
    /* PREDICTED: a cream tab that swings down off the new stretch on "never" */
    var tb = t >= K.never ? clamp(sp(t, K.never, 2.6, .55), 0, 1.2) : 0;
    if (tb > 0) {
      var tx = TP.x2 + (TP.cols2 * CP + 10) / 2;
      g.save(); g.translate(tx, TP.y0 + TP.h - 6); g.rotate((1 - tb) * -.9);
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -122 + 6, 6 + 8, 244, 58, 8); g.fill();
      g.fillStyle = PAPER; rr(g, -122, 6, 244, 58, 8); g.fill();
      CHIPBOX = LBL ? xbox(g, -122, 6, 122, 64) : null;
      txt(g, 'PREDICTED', 0, 40, 36, INK, 'center', 900, DISP, 226, clamp(tb * 2 - .6, 0, 1));
      CHIPBOX = null;
      g.restore();
    }
    g.restore();
    /* the speaker on its post; it plays from "Played" */
    var pulse = seg(t, K.played, K.played + .2) * (1 - seg(t, K.your - .1, K.your + .2)) * (.5 + .5 * Math.sin(t * 24));
    var spk = speaker(g, TS.x0, TS.y0, TS.w, TS.h, pulse);
    mic(g, TM.x, TM.y, TM.s, 0, 0, 50);
    /* the paper waveform: puffs out of the cone on "Played", folds back down into the tape on "your voice" */
    var puff = eout(seg(t, K.played + .15, K.played + .65)), fold = eio(seg(t, K.your - .05, K.your + .45));
    if (puff > 0 && fold < 1) {
      var ww = 380 * puff, wx = lerp(spk.cx - 60, 330, puff), wy = lerp(spk.cy - 50, 650, puff);
      wx = lerp(wx, 330, fold); wy = lerp(wy, TG.y + 60, fold);
      g.save(); g.translate(wx + ww / 2, wy + 50); g.scale(1, 1 - fold); g.translate(-(wx + ww / 2), -(wy + 50));
      g.globalAlpha *= 1 - seg(fold, .7, 1);
      waveStrip(g, wx, wy, Math.max(4, ww), 100 * puff, false, -.02 * Math.sin(t * 3));
      g.restore();
    }
    /* 1,800 NUMBERS: between mic and speaker, from "1,800" to "Played" */
    var na = fin(t, K.n1800 - .04, 3.4) * (1 - seg(t, K.played - .05, K.played + .2)), ns = pop(t, K.n1800 - .04, 3.4);
    if (na > 0) {
      g.save(); g.translate(CX, 700); g.scale(ns, ns);
      txt(g, '1,800', 0, -38, 112, CREAM, 'center', 900, DISP, 400, na);
      txt(g, 'NUMBERS', 0, 52, 66, CREAM, 'center', 900, DISP, 400, na);
      g.restore();
    }
    /* NEW WORDS: SEE YOU AT SIX, a small cream word card above the new stretch, from "Then" */
    var wa = fin(t, K.then + .02) * (1 - seg(t, K.played - .05, K.played + .2)), wsc = pop(t, K.then + .02, 3.2);
    if (wa > 0) {
      /* over the PREDICTED stretch only (x 588–822), left of the speaker's post */
      g.save(); g.globalAlpha *= wa; g.translate(705, 842); g.scale(wsc, wsc); g.rotate(.012);
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -117 + 6, -58 + 8, 234, 116, 10); g.fill();
      g.fillStyle = PAPER; rr(g, -117, -58, 234, 116, 10); g.fill();
      CHIPBOX = LBL ? xbox(g, -117, -58, 117, 58) : null;
      txt(g, 'NEW WORDS:', 0, -34, 26, INK, 'center', 700, MONO, 214, 1, 26);
      txt(g, 'SEE YOU', 0, 4, 38, INK, 'center', 900, DISP, 214);
      txt(g, 'AT SIX', 0, 42, 38, INK, 'center', 900, DISP, 214);
      CHIPBOX = null; g.restore();
    }
    /* the bottom rail: our math (numbers → sound), the condition (sound → hero), the credit (hero → the torn edge) */
    var ma = fin(t, K.n1800 + .3) * (1 - seg(t, K.played - .3, K.played - .12));
    txt(g, '3 SECONDS → 225 SLICES × 8 = 1,800', CX, 1348, 38, CREAM, 'center', 900, DISP, 800, ma);
    txt(g, 'OUR MATH FROM THE PAPER: 10 S = 750 × 8', CX, 1400, 36, CREAM, 'center', 700, DISP, 800, ma);
    var sa = fin(t, K.played - .1) * (1 - seg(t, K.your - .1, K.your - .02));
    txt(g, 'SIMILARITY DEPENDS ON', CX, 1318, 38, CREAM, 'center', 900, DISP, 800, sa);
    txt(g, 'THE CLIP’S LENGTH', CX, 1364, 38, CREAM, 'center', 900, DISP, 800, sa);
    txt(g, 'AND QUALITY · MICROSOFT', CX, 1410, 36, CREAM, 'center', 800, DISP, 800, sa);
    var ka = fin(t, K.your - .07);
    txt(g, 'VALL-E: DISCRETE CODES', CX, 1342, 42, CREAM, 'center', 900, DISP, 800, ka);
    txt(g, 'FROM A 3-SECOND CLIP', CX, 1398, 40, CREAM, 'center', 700, DISP, 780, ka);
    /* THE stamp, on the left stretch (your voice), on its own cream patch */
    stamp(g, 'JUST\nNUMBERS', 336, TG.y + TG.s * TP.h / 2, t, GT.slam, 64, HOT, -.05, true);
  }

  /* =====================================================================================================
     SCENE 4 · the FBI folder (fbi → secret). A manila folder, re-created: FBI PUBLIC SERVICE ANNOUNCEMENT, I-120324-PSA,
     DEC 3, 2024; the quote on "fake". A generic paper phone slides in buzzing with LOVED ONE?; a paper clip snaps on in the
     silence after "voices." On "secret" the tip card slides out of the folder and the folded OUR WORD card comes in. On
     "The copy" the phone shows a strip of the tape (YOUR SOUND), a cream ≠ between it and the folded card.
     ===================================================================================================== */
  var FD = { x0: 105, x1: 680, y0: 600, y1: 1136 }, PH = { x0: 700, y0: 760, w: 220, h: 400 }, OW = { x0: 720, y0: 1268, w: 180, h: 150 };
  var QF = [998, 1044, 1090], QX = 174;
  /* the folded OUR WORD envelope: the word itself is never shown */
  function ourWord(g, x0, y0, w, h, tuck, s) {
    g.save(); g.translate(x0 + w / 2, y0 + h / 2); g.scale(s, s); g.translate(-w / 2, -h / 2);
    foldedCard(g, 0, 0, w, h, tuck);
    ONPROP = true;
    txt(g, 'OUR', w / 2, h - 58, 40, INK, 'center', 900, DISP, w - 20);
    txt(g, 'WORD', w / 2, h - 22, 40, INK, 'center', 900, DISP, w - 20);
    ONPROP = false;
    g.restore();
  }
  var PENCILAT = null;
  function folderScene(g, t) {
    var r = mulberry(83);
    /* the exit, before the end caption: the whole desk drops a little and is gone by 29.0 s (never lifted through the caption) */
    var ex = seg(t, S('outro').t0, S('outro').t0 + .34);
    g.save(); g.globalAlpha *= 1 - seg(ex, 0, .34); g.translate(0, 520 * ex * ex);
    var drift = 4 * Math.sin((t - K.fbi) * .9);
    g.save(); g.translate(0, drift);
    /* the tip card: slides down out of the folder on "secret" (drawn first, so it comes out from behind it) */
    var tk = eio(seg(t, K.secret - .05, K.secret + .45));
    if (tk > 0) {
      var ty = lerp(-270, 0, tk);
      g.save(); g.translate(0, ty);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(140 + 8, 1150 + 12, 500, 268);
      g.fillStyle = TAPE; cut(g, [[140, 1150], [640, 1150], [640, 1418], [140, 1418]], mulberry(87), 1.2);
      grainIn(g, 140, 1150, 500, 268, 88);
      prop(g, 'tipcard', 140, 1150, 640, 1418);
      ONPROP = true;
      txt(g, '“CREATE A SECRET', 390, 1198, 42, INK, 'center', 900, DISP, 460);
      txt(g, 'WORD OR PHRASE', 390, 1246, 42, INK, 'center', 900, DISP, 460);
      txt(g, 'WITH YOUR FAMILY…”', 390, 1294, 42, INK, 'center', 900, DISP, 460);
      txt(g, 'FBI, DEC 3, 2024', 390, 1362, 36, INK, 'center', 700, MONO, 460);
      ONPROP = false;
      g.restore();
    }
    /* the folder: back with its tab, the sheet */
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(FD.x0 + 12, FD.y0 + 16, FD.x1 - FD.x0, FD.y1 - FD.y0);
    g.fillStyle = MANILA_D; cut(g, [[FD.x0, FD.y0], [FD.x0 + 30, FD.y0 - 46], [FD.x0 + 230, FD.y0 - 46], [FD.x0 + 260, FD.y0], [FD.x1, FD.y0], [FD.x1, FD.y1], [FD.x0, FD.y1]], r, 1.8);
    ONPROP = true; txt(g, 'FBI', FD.x0 + 130, FD.y0 - 20, 38, INK, 'center', 900, DISP, 200); ONPROP = false;
    var slapK = t >= GT.slap ? Math.exp(-(t - GT.slap) * 14) * Math.sin((t - GT.slap) * 40) : 0;
    g.save(); g.translate(0, 3 * slapK);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(132, 632, 532, 492);
    g.fillStyle = PAPER; cut(g, [[124, 622], [660, 622], [660, 1120], [124, 1120]], r, 1.2);
    prop(g, 'sheet', 124, 622, 660, 1120);
    ONPROP = true;
    /* the PSA's header and its own title (ic3.gov, I-120324-PSA, Dec 3, 2024) */
    txt(g, 'FBI PUBLIC SERVICE', 392, 668, 40, INK, 'center', 900, DISP, 500);
    txt(g, 'ANNOUNCEMENT', 392, 712, 40, INK, 'center', 900, DISP, 500);
    txt(g, 'I-120324-PSA · DEC 3, 2024', 392, 760, 30, INK, 'center', 700, MONO, 500, 1, 26);
    g.fillStyle = 'rgba(33,29,38,.45)'; g.fillRect(150, 788, 484, 3);
    txt(g, 'Criminals Use Generative', 392, 830, 40, INK, 'center', 400, SERIF, 500, 1, 32);
    txt(g, 'Artificial Intelligence to', 392, 874, 40, INK, 'center', 400, SERIF, 500, 1, 32);
    txt(g, 'Facilitate Financial Fraud', 392, 918, 40, INK, 'center', 400, SERIF, 500, 1, 32);
    g.fillStyle = 'rgba(33,29,38,.45)'; g.fillRect(150, 950, 484, 3);
    /* the pencil underlines what the narrator names: the date on "2024", the PSA's title on "warned" (the paper scene's pencil) */
    var d0 = at('fbi', '2024') + .25, w0 = at('fbi', 'warned') - .05;
    var UL = [[d0, .4, 432, 624, 778], [w0, .24, 222, 562, 846], [w0 + .32, .24, 222, 562, 890], [w0 + .64, .24, 222, 562, 934]];
    g.save(); g.strokeStyle = PENCIL; g.lineWidth = 4; g.lineCap = 'round';
    UL.forEach(function (u) { var k = eio(seg(t, u[0], u[0] + u[1])); if (k > 0) { g.beginPath(); g.moveTo(u[2], u[4]); g.lineTo(lerp(u[2], u[3], k), u[4] + 2 * k); g.stroke(); } });
    g.restore();
    var PK = [[d0 - .45, 1250, 1150]];
    UL.forEach(function (u) { PK.push([u[0], u[2], u[4]]); PK.push([u[0] + u[1], u[3], u[4] + 2]); });
    PK.push([PK[PK.length - 1][0] + .35, 1250, 1250]);
    if (t > PK[0][0] && t < PK[PK.length - 1][0]) {
      var pi = 0; while (pi < PK.length - 2 && t > PK[pi + 1][0]) pi++;
      var A = PK[pi], B = PK[pi + 1], pk = seg(t, A[0], B[0]), drawing = UL.some(function (u) { return t >= u[0] && t <= u[0] + u[1]; });
      if (!drawing) pk = eio(pk);
      var px = lerp(A[1], B[1], pk) + 2 * Math.sin(t * 7.3), py = lerp(A[2], B[2], pk) + 1.5 * Math.cos(t * 6.1);
      PENCILAT = [px, py];
    } else PENCILAT = null;
    var qa = fin(t, K.fake - .04, 3.2), qd = (1 - eout(seg(t, K.fake - .04, K.fake + .3))) * 14;
    txt(g, '“…SHORT AUDIO CLIPS', QX, QF[0] + qd, 38, INK, 'left', 900, DISP, 470, qa);
    txt(g, 'CONTAINING A LOVED', QX, QF[1] + qd, 38, INK, 'left', 900, DISP, 470, qa);
    txt(g, 'ONE’S VOICE…”', QX, QF[2] + qd, 38, INK, 'left', 900, DISP, 470, qa);
    ONPROP = false;
    /* the pencil rule bar, 16 px left of the indented quote, drawn as it lands */
    var bk = eio(seg(t, K.fake + .05, K.fake + .4));
    if (bk > 0) { g.save(); g.strokeStyle = PENCIL; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(QX - 16, 970); g.lineTo(QX - 16, lerp(970, 1110, bk)); g.stroke(); g.restore(); }
    /* the paper clip, snapped on in the silence after "voices." */
    var ck = t >= GT.slap ? eout(seg(t, GT.slap, GT.slap + .08)) : 0;
    if (ck > 0) {
      g.save(); g.translate(580, lerp(470, 600, ck)); g.rotate(1.5);
      g.strokeStyle = '#c3c8cf'; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-14, 70); g.lineTo(-14, -30); g.arc(4, -30, 18, Math.PI, 0); g.lineTo(22, 90); g.arc(-2, 90, 24, 0, Math.PI); g.lineTo(-26, -6); g.stroke();
      prop(g, 'clip', -40, -50, 30, 120);
      g.restore();
    }
    g.restore();
    /* the phone: slides up in on "fake", buzzing with an incoming call until the clip snaps */
    var pin = eout(seg(t, K.fake - .1, K.fake + .35)), buzz = seg(t, K.fake + .35, K.fake + .45) * (1 - seg(t, GT.slap - .05, GT.slap + .05));
    var swap = eio(seg(t, K.copy - .1, K.copy + .22));
    if (pin > 0) {
      g.save(); g.globalAlpha *= clamp(pin * 2, 0, 1); g.translate(0, lerp(220, 0, pin));
      g.translate(PH.x0 + PH.w / 2, PH.y0 + PH.h / 2); g.rotate(.035 * buzz * Math.sin(t * 52) + .02); g.translate(-(PH.x0 + PH.w / 2), -(PH.y0 + PH.h / 2));
      phone(g, PH.x0, PH.y0, PH.w, PH.h, function (sx, sy, sw, sh) {
        var mx = sx + sw / 2;
        if (swap < 1) {
          g.save(); g.globalAlpha *= 1 - swap;
          g.fillStyle = '#3a3642'; el(g, mx, sy + 104, 46, 46); g.fillStyle = GRAPH_DD; el(g, mx, sy + 90, 17, 17); el(g, mx, sy + 128, 30, 16);
          txt(g, 'LOVED', mx, sy + 200, 46, CREAM, 'center', 900, DISP, 180);
          txt(g, 'ONE?', mx, sy + 252, 46, CREAM, 'center', 900, DISP, 180);
          g.fillStyle = CREAM; el(g, mx - 44, sy + sh - 52, 24, 24); g.fillStyle = GRAPH_DD; el(g, mx + 44, sy + sh - 52, 24, 24);
          g.restore();
        }
        if (swap > 0) {
          g.save(); g.globalAlpha *= swap;
          /* a strip of the hero tape (re-used, not a new prop) */
          g.save(); g.beginPath(); g.rect(sx + 6, sy + 50, sw - 12, 190); g.clip();
          tape(g, sx - 12, sy + 54, 182, 3.3, 3, t, 0, -1);
          g.restore();
          txt(g, 'YOUR', mx, sy + 290, 44, CREAM, 'center', 900, DISP, 180);
          txt(g, 'SOUND', mx, sy + 340, 44, CREAM, 'center', 900, DISP, 180);
          g.restore();
        }
      });
      g.restore();
    }
    /* the folded OUR WORD card, in on "secret"; the flap tucks tighter on the second "secret". At the exit it stays: the end card carries it */
    var oin = eout(seg(t, K.secret + .2, K.secret + .6));
    if (oin > 0 && t < S('outro').t0) {
      var tuck = Math.sin(Math.PI * seg(t, K.secret2 - .02, K.secret2 + .2));
      g.save(); g.globalAlpha *= oin; ourWord(g, OW.x0, OW.y0, OW.w, OW.h, tuck, lerp(.6, 1, oin)); g.restore();
    }
    /* ≠ between the copy (the phone) and the folded card, on "not" */
    var ne = pop(t, K.copy + .15, 3.4) * (1 + .1 * Math.sin(Math.PI * seg(t, K.not2 - .04, K.not2 + .26))), na = fin(t, K.copy + .15, 3.4);
    if (na > 0) { g.save(); g.translate(810, 1222); g.scale(ne, ne); txt(g, '≠', 0, 0, 112, CREAM, 'center', 900, DISP, 200, na); g.restore(); }
    g.restore();
    if (PENCILAT) pencil(g, PENCILAT[0] + 240, PENCILAT[1] + 75, PENCILAT[0], PENCILAT[1]);
    /* the tag, outside the folder */
    tag(g, 'RE-CREATED', 796, 680, 1, 0);
    g.restore();
  }

  /* =====================================================================================================
     SCENE 5 · the end card: frame 0's mic, strip and speaker at frame 0's scale. The strip slides back out of the mic to
     frame 0's spot, so the last frame is frame 0. YES / NO in coral, the folded OUR WORD envelope beside them (closed).
     ===================================================================================================== */
  function outroScene(g, t) {
    var a = S('outro').t0;
    var sx = lerp(MK.x - MK.sw - 10, MK.sx0, eio(seg(t, a + .45, K.noEnd)));
    micWorld(g, t, sx, 0, 0, 0, { a: 0, s: 1 });
    var yk = function (w) { return 1 + .06 * Math.sin(Math.PI * seg(t, w - .06, w + .3)); };
    var ya = fin(t, a + .45) * (1 - seg(t, K.noEnd + .08, K.noEnd + .26));   /* after the envelope has moved past them */
    /* the envelope glides from the folder's desk to its place on the end card */
    var mv = eio(seg(t, a, a + .45)), es = lerp(1, EW.w / OW.w, mv);
    var ex = lerp(OW.x0 + OW.w / 2, EW.x0 + EW.w / 2, mv), ey = lerp(OW.y0 + OW.h / 2, EW.y0 + EW.h / 2, mv);
    g.save(); g.globalAlpha *= 1 - seg(t, K.noEnd + .08, K.noEnd + .26);
    ourWord(g, ex - OW.w / 2, ey - OW.h / 2, OW.w, OW.h, 0, es);
    g.restore();
    [['YES', YN.yes, K.yes], ['NO', YN.no, K.no]].forEach(function (c) {
      var on = fin(t, c[2] - .08);
      chip(g, c[0], c[1], YN.y, { px: 76, wt: 900, line: HOT, lw: 5, fg: HOT, w: YN.w, r: 46, shadow: false, a: ya * (on < 1 ? 1 : 0) });
      chip(g, c[0], c[1], YN.y, { px: 76, wt: 900, bg: HOT, fg: BG, w: YN.w, r: 46, a: ya * on, s: yk(c[2]) });
    });
  }

  /* ---------- captions: the narrator's words, one block at a time; stressed words get a cream pill (never coral) ---------- */
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'ask') return;   /* frame 0 carries the hook; the ask line is the printed question */
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1 && !(l.id === 'end' && /one\?$/.test(w.w)) && l.id !== 'hero' && l.id !== 'tip') { out.push({ id: l.id, ws: cur }); cur = []; }
      });
      if (cur.length) out.push({ id: l.id, ws: cur });
    });
    return out.map(function (c) { var ws = c.ws; return { id: c.id, t0: ws[0].t0, s: c.id === 'paper' ? Math.max(ws[0].t0, K.hookOut + .04) : c.id === 'numbers' && ws[0] === VO.lines.filter(function (l) { return l.id === 'numbers'; })[0].words[0] ? Math.max(ws[0].t0, S('tape').t0 - .1) : c.id === 'fbi' ? Math.max(ws[0].t0, S('folder').t0 + .02) : ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS = [['paper', 'microsofts'], ['numbers', '1800'], ['predict', 'never'], ['hero', 'numbers'], ['fbi', 'fbi'],
    ['tip', 'secret'], ['secret', 'secret'], ['end', 'yes']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, over: 1, that: 1, up: 1, own: 1, is: 1, it: 1, go: 1, does: 1, big: 1, far: 1, from: 1, be: 1, or: 1, for: 1, loved: 1, just: 1, can: 1 };
  var CAPMIN = 1e9;
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s - .04 : 1e9;
    var keep = nx && (ns - card0.t1 < 2.2);   /* the caption stays through the planned pauses (stamp + hold, slap) */
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
  var NOISE, SCENES = { mic: micScene, paper: paperScene, tape: tapeScene, folder: folderScene, outro: outroScene };
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
  /* the side tear (wipe 2): a vertical torn edge moving right to left, the next scene drawn to its right */
  function edgeX(y, lx, t) { var i = Math.round(y / 30); return lx + (i % 2 ? -10 : 8) + Math.sin(y * .013 + t * 5) * 4; }
  function tornEdgeV(g, lx, t) { g.save(); g.strokeStyle = CREAM; g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); for (var y = 0; y <= H; y += 30) { var xx = edgeX(y, lx, t); if (y === 0) g.moveTo(xx, y); else g.lineTo(xx, y); } g.stroke(); g.restore(); }
  function clipRight(g, lx, t) { g.beginPath(); g.moveTo(W, 0); for (var y = 0; y <= H; y += 30) g.lineTo(edgeX(y, lx, t), y); g.lineTo(W, H); g.closePath(); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    /* the torn edge is placed at the frame's own time, not per motion-blur sample: the wipe stays opaque */
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var sk0 = Nx && Nx.swipe ? seg(te, Nx.t0 - (Nx.sw || SWIPE), Nx.t0) : 0, sk = Nx && Nx.ease === 'in' ? sk0 * sk0 : eio(sk0), side = Nx && Nx.dir === 'left';
    var ly = H * (1 - sk) - 20, lx = (W + 20) * (1 - sk) - 20;
    COVER = sk > 0 && !side ? ly - 14 : 1e9; COVERX = sk > 0 && side ? lx - 14 : 1e9;
    /* the folder lifts off the end card: the end card is drawn under it */
    if (Sc.id === 'outro') { drawScene(g, Sc, t); if (t < Sc.t0 + .2) drawScene(g, S('folder'), t); }
    else drawScene(g, Sc, t);
    if (si <= 1 && !POSTERMODE && LIVE.text) hookText(g, t, 1 - seg(t, K.hookOut - .1, K.hookOut));
    COVER = 1e9; COVERX = 1e9;
    if (sk > 0) {
      g.save(); if (side) clipRight(g, lx, te); else clipBelow(g, ly, te);
      stage(g); INCOMING = true; drawScene(g, Nx, t); INCOMING = false; g.restore();
      if (side) tornEdgeV(g, lx, te); else tornEdge(g, ly, te);
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
    var a = 'How AI clones', b = 'your voice', px = 92;
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
  /* Two hits (BRIEF §0): THE stamp in the silence after "just numbers." and the folder clip after "voices." */
  var GT = {}, GS = [];
  function initGaps() {
    var s0 = nearGap(K.heroEnd + .22, 'thump', .2); GT.slam = s0 === null ? K.heroEnd + .22 : s0; GS.push({ t: GT.slam, type: 'thump', g: .238 });   /* +4 dB (jury r2) */
    var s1 = nearGap(K.voices + .72, 'slap', .2); GT.slap = s1 === null ? K.voices + .72 : s1;   /* Whisper ends "voices" before its s: aim 0.25 s past the real tail */ GS.push({ t: GT.slap, type: 'slap', g: .452 });   /* +3 dB */
  }
  function initTimes() {
    GS.forEach(function (e) { EV.push({ t: e.t, type: e.type, g: e.g, t1: e.t + BODY[e.type] }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    /* the first two frames are drawn sharp: no motion-blur ghost of the gliding strip on frame 0 */
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
      var n = noise(0, DUR); n.connect(lp); lp.connect(o);
      /* about −50 dB of room bed under the hero hold, so the hold is never digital silence */
      var h0 = GT.slam + .05, h1 = S('folder').t0;
      env(o.gain, [[0, ROOM], [h0, ROOM], [h0 + .2, ROOM * 3.16], [h1 - .15, ROOM * 3.16], [h1 + .1, ROOM]]); })();
  }
  var ROOM = .0051;

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d'); MC = mk(8, 8).getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '400 58px "Instrument Serif"', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹✓✕–@!>$(),:'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initGaps();
  initTimes();
  /* the hero hold: from the stamp settling to the fbi caption arriving with the voice, fully still */
  var HOLD = { t0: GT.slam + .2, t1: S('folder').t0 - S('folder').sw };   /* still until the torn edge starts */
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: (HOLD.t0 + HOLD.t1) / 2, SLUG: 'voiceclone', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
