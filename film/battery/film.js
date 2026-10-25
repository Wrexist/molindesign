/* "Battery" — why your phone battery wears out. Factory #7 on Tech, explained, after ../fyp/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t. Contract: window.FILM,
   DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). The native move is the shrinking outline: the battery's frame contracts
   while its fill stays (capacity lost, not charge), a dashed ghost left where the old edge was. Scene cuts are the battery's
   own fill: the next scene rises from the bottom like a charge level, a coral level line at its edge.
   Everything is hand-built: a cream battery, a generic drawn phone (no logos, no real interface; the Settings screen is a
   plain re-creation, tagged), a paper armchair, a wall clock, a calendar, a thermometer card in °F, a sun, a bedside.
   Facts: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', DIM = 'rgba(244,237,224,.5)';
  var HOT = '#ff5b3d', YEL = '#ffc83d';
  var PAPER = '#f1e9d8', INK = '#211d26', REDINK = '#d8332b', TAN = '#c98f4e';
  var BODY = '#2d2937', BODY2 = '#3d3849', SCREEN = '#1b1a21';
  var DISP = 'Archivo', MONO = '"Geist Mono"';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .85); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .85), 0, 1.04); }
  function fin(t, a, f) { return clamp(sp(t, a, f || 3) * 2, 0, 1); }
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }
  function kn(t, a) { return 1 + Math.max(0, knock(t, a, 16, 6)) * .08; }
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
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  /* scenes. swipe:true = the next scene rises in like a charge level (the fill wipe), drawn under the old one's edge */
  var SWIPE = .42, PRE = .3;
  function cutAt(prev, next) { var g0 = end(prev), g1 = start(next); return Math.max(g0 + SWIPE + .02, Math.min(g1 + .05, g0 + SWIPE + .25)); }
  var SC = [
    { id: 'hook', fn: 'health', name: 'Shrinking', t0: 0 },
    { id: 'twist', fn: 'chair', name: 'The twist', t0: cutAt('why', 'twist'), swipe: true },
    { id: 'year', fn: 'store', name: 'A year', t0: cutAt('twist', 'year'), swipe: true },
    { id: 'heat', fn: 'heat', name: 'Heat', t0: start('heat') - .05, swipe: true },
    { id: 'limit', fn: 'limit', name: 'Stop at 80', t0: cutAt('drain', 'limit'), swipe: true },
    { id: 'night', fn: 'night', name: 'Overnight', t0: cutAt('limit', 'night'), swipe: true },
    { id: 'end', fn: 'end', name: 'Your number', t0: cutAt('night', 'end'), swipe: true }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = end('end') + .25;

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- the safe-area check: every glyph box drawn on the film canvas is measured (window.BOUNDS_RUN) ---------- */
  var BOUNDS = null, INCOMING = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || INCOMING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys);
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
  }
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS) { var mm = this.measureText(str); recBox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent, str); }
      return orig.apply(this, arguments);
    };
  }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt, o.fam); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw + pad * 2 > o.maxw && px > 30) { px -= 2; font(g, px, o.wt, o.fam); tw = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore(); ls(g, 0);
    return w;
  }
  /* a label: mono, ≥ 36 px unless asked smaller (small print ≥ 30), optional ink plate */
  function label(g, text, x, y, a, col, px, align, plate) {
    px = Math.max(30, px || 36);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); ls(g, 3); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    while (g.measureText(text).width > 760 && px > 30) { px--; font(g, px, 500, MONO); }
    var dy = (1 - Math.min(1, a)) * 14;
    if (plate) {
      var w = g.measureText(text).width, x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
      rr(g, x0 - 18, y - px * .78 + dy, w + 36, px * 1.56, 12); g.fillStyle = 'rgba(21,19,27,.92)'; g.fill();
    }
    g.fillStyle = col || CREAM;
    g.fillText(text, x, y + dy); g.restore(); ls(g, 0);
  }
  function block(g, lines, x, y, px, a, plate, col, wt) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 500, MONO); ls(g, 0); g.textAlign = 'center'; g.textBaseline = 'middle';
    var lh = px * 1.3, w = 0; lines.forEach(function (l) { w = Math.max(w, g.measureText(l).width); });
    var y0 = y - (lines.length - 1) * lh / 2;
    if (plate) { rr(g, x - w / 2 - 20, y0 - lh / 2 - 8, w + 40, lh * lines.length + 16, 14); g.fillStyle = 'rgba(21,19,27,.92)'; g.fill(); }
    g.fillStyle = col || CREAM; lines.forEach(function (l, i) { g.fillText(l, x, y0 + i * lh); });
    g.restore();
  }
  function tri(g, a, b, c, d, e, f) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.lineTo(e, f); g.closePath(); g.fill(); }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  function sheet(g, x, y, w, h, rot, a, fn, col) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(-w / 2 + 12, -h / 2 + 18, w, h);
    g.fillStyle = col || PAPER; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(-w / 2, h / 2 - 6, w, 6);
    if (fn) fn(g, w, h);
    g.restore();
  }
  function tag(g, text, x, y, a, rot) { chip(g, text, x, y, { px: 32, wt: 700, fam: MONO, line: HOT, lw: 4, fg: HOT, a: a, rot: rot == null ? .03 : rot, shadow: false, bg: 'rgba(21,19,27,.85)' }); }
  /* a rolling percent: the integer steps, each new digit slides up into place */
  function pctText(v) { return Math.round(v) + '%'; }
  function qt(t) { return Math.floor(t * 30 + 1e-6) / 30 + 1 / 60; }

  /* ---------- rubber stamps: worn ink (seeded speckle), slammed ---------- */
  var STEX = {};
  function stampTex(text, col, px) {
    var key = text + col + px; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900); ls(m, 2);
    var lw = m.measureText(text).width, pad = px * .45, h = px * 1.25, w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .03); rr(g, px * .14, px * .14, w - px * .28, h - px * .28, px * .08); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, px, 900); ls(g, 2); g.fillText(text, w / 2, h / 2 + px * .05);
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 140);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.9, 0, 6.283); g.fill(); }
    c.w = w + 16; c.h = h + 16; STEX[key] = c; return c;
  }
  function stamp(g, text, x, y, t, t0, t1, px, col, rot, bare) {
    if (t < t0 || t > t1 + .3) return;
    var c = stampTex(text, col, px);
    var k = sp(t, t0, 3.2, .8), s = lerp(1.35, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (1 - seg(t, t1, t1 + .3));
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.1 : rot); g.scale(s, s);
    if (k >= 1) recBox(g, -c.w / 2 - 14, -c.h / 2 - 4, c.w / 2 - 6, c.h / 2 + 4, text);
    if (!bare) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-c.w / 2 - 4, -c.h / 2 + 10, c.w + 8, c.h);
      g.fillStyle = PAPER; g.fillRect(-c.w / 2 - 14, -c.h / 2 - 4, c.w + 8, c.h + 8); }
    g.drawImage(c, -c.w / 2 - 10, -c.h / 2); g.restore();
  }

  /* =====================================================================================================
     THE BATTERY. The film's one object. cap = capacity left (the outline shrinks so its AREA is cap: honest scale),
     fill = charge (the coral level, a fraction of whatever the outline holds now). The ghost is the outline when new.
     anchor 'base' keeps the bottom on the floor; 'center' shrinks toward the middle.
     ===================================================================================================== */
  function battery(g, x, y, w, h, o) {
    o = o || {};
    var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    var cap = o.cap == null ? 1 : o.cap, s = Math.sqrt(clamp(cap, .05, 1)), fill = clamp(o.fill == null ? 1 : o.fill, 0, 1);
    var lw = o.lw || Math.max(5, w * .055), r = w * .16;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot);
    var base = o.anchor === 'base';
    if (o.vonly) s = 1;
    var bw = w * s, bh = h * (o.vonly ? clamp(cap, .05, 1) : s), by0 = base ? h / 2 - bh : -bh / 2;     /* body top-left y */
    var nw = w * .34, nh = h * .055;
    /* shadow */
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -bw / 2 + w * .03, by0 + h * .025, bw, bh, r * s); g.fill();
    /* the ghost: the outline when it was new */
    var ga = o.ghost == null ? (cap < .995 ? 1 : 0) : o.ghost;
    if (ga > 0) {
      /* the lost capacity: a hatched coral band between the old edge and the new one */
      var gyb = base ? h / 2 - h : -h / 2;
      if (o.band !== false) {
        g.save(); g.globalAlpha *= ga * .9; g.beginPath(); g.roundRect(-w / 2, gyb, w, h, r); g.roundRect(-bw / 2, by0, bw, bh, r * s); g.clip('evenodd');
        g.fillStyle = 'rgba(255,91,61,.22)'; g.fillRect(-w / 2, gyb, w, h);
        g.strokeStyle = HOT; g.lineWidth = Math.max(3, w * .012); var stp = Math.max(12, w * .045), off = ((o.t || 0) * 20) % stp;
        g.beginPath(); for (var hx = -w / 2 - h + off; hx < w / 2 + h; hx += stp) { g.moveTo(hx, gyb + h); g.lineTo(hx + h, gyb); } g.stroke(); g.restore();
      }
      g.save(); g.globalAlpha *= ga * .6; g.strokeStyle = CREAM; g.lineWidth = Math.max(3, lw * .38); g.setLineDash([lw * 1.2, lw * .9]);
      var gy0 = base ? h / 2 - h : -h / 2;
      rr(g, -w / 2, gy0, w, h, r); g.stroke(); rr(g, -nw / 2, gy0 - nh, nw, nh + 2, nh * .3); g.stroke(); g.setLineDash([]); g.restore();
      /* coral squeeze ticks: from the old edge in toward the new one */
      var gap = (w - bw) / 2;
      if (gap > 6) {
        g.save(); g.globalAlpha *= ga; g.strokeStyle = HOT; g.fillStyle = HOT; g.lineWidth = Math.max(4, lw * .4); g.lineCap = 'round';
        var cyB = by0 + bh / 2, ah = clamp(gap * .7, 0, 30);
        [[-w / 2, cyB, -bw / 2, cyB], [w / 2, cyB, bw / 2, cyB]].forEach(function (p) {
          var dir = Math.sign(p[2] - p[0]);
          g.beginPath(); g.moveTo(p[0] + dir * 4, p[1]); g.lineTo(p[2] - dir * (ah + 4), p[3]); g.stroke();
          tri(g, p[2] - dir * 4, p[3], p[2] - dir * (ah + 6), p[3] - ah * .7, p[2] - dir * (ah + 6), p[3] + ah * .7);
        });
        if (!base) {
          var gy = -h / 2, ny = by0;
          if (ny - gy > 10) { g.beginPath(); g.moveTo(0, gy - nh - 2); g.stroke(); }
        }
        g.restore();
      }
    }
    /* body */
    g.fillStyle = SCREEN; rr(g, -bw / 2, by0, bw, bh, r * s); g.fill();
    var ins = lw * 1.5, iw = bw - ins * 2, ih = bh - ins * 2, iy0 = by0 + ins;
    if (fill > 0) {
      var fh = ih * fill, fy = iy0 + ih - fh, amp = Math.min(6, fh * .2) * (o.calm ? .2 : 1), ph = (o.t || 0) * 3.1;
      g.save(); rr(g, -iw / 2, iy0, iw, ih, Math.max(4, r * s - ins)); g.clip();
      g.fillStyle = fill < .16 ? REDINK : (o.col || HOT);
      g.beginPath(); g.moveTo(-iw / 2, iy0 + ih);
      for (var i = 0; i <= 12; i++) { var xx = -iw / 2 + iw * i / 12; g.lineTo(xx, fy + (fill >= .999 ? 0 : Math.sin(ph + i * .9) * amp)); }
      g.lineTo(iw / 2, iy0 + ih); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-iw / 2 + iw * .1, iy0 + 4, iw * .12, ih - 8);
      g.restore();
    }
    g.strokeStyle = CREAM; g.lineWidth = lw; rr(g, -bw / 2, by0, bw, bh, r * s); g.stroke();
    g.fillStyle = CREAM; rr(g, -nw * s / 2, by0 - nh * s - lw * .3, nw * s, nh * s + lw * .3 + 2, nh * s * .3); g.fill();
    /* the readout inside */
    if (o.pct) {
      var px = Math.round((o.px || w * .22) * (o.pxs ? s : 1)); font(g, px, 900); wide(g); g.textAlign = 'center'; g.textBaseline = 'middle';
      var ty = by0 + bh * (o.ty || .5), covered = (iy0 + ih - ih * fill) < ty - px * .3;
      g.fillStyle = covered ? BG : CREAM; g.fillText(o.pct, 0, ty);
    }
    g.restore();
  }

  /* a generic phone: a body, a notch; scr(g, sw, sh) draws the screen with its origin at the screen centre, clipped */
  var PW = 560, PH = 1160, SW = PW - 44, SH = PH - 44;
  function phone(g, x, y, s, rot, a, scr, o) {
    if (a <= 0 || s <= 0) return;
    o = o || {};
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -PW / 2 + 16, -PH / 2 + 26, PW, PH, 80); g.fill();
    g.fillStyle = BODY2; rr(g, PW / 2 - 6, -PH / 2 + 250, 16, 130, 6); g.fill(); rr(g, -PW / 2 - 10, -PH / 2 + 220, 16, 90, 6); g.fill();
    g.fillStyle = BODY; rr(g, -PW / 2, -PH / 2, PW, PH, 80); g.fill();
    g.strokeStyle = 'rgba(244,237,224,.22)'; g.lineWidth = 5; rr(g, -PW / 2, -PH / 2, PW, PH, 80); g.stroke();
    g.save(); rr(g, -SW / 2, -SH / 2, SW, SH, 60); g.clip(); g.fillStyle = SCREEN; g.fillRect(-SW / 2, -SH / 2, SW, SH);
    if (scr) scr(g, SW, SH);
    g.restore();
    g.fillStyle = '#0a090d'; el(g, 0, -SH / 2 + 38, 17, 17);
    if (o.after) o.after(g);
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · hook + check + why: the huge battery shrinks; it drops into a re-created Battery Health screen
     ===================================================================================================== */
  var BIG = { x: CX, y: 1200, w: 740, h: 1140 };
  var CHIP_T = 1.5;
  function hookCap(t) { return .8 - .065 * eio(seg(t, 0, 1.2)); }
  /* the squeeze on "shrinking" (and the same squeeze at the loop's end: the shape we return to) */
  function capAt(t) {
    var c = hookCap(t), sq = at('hook', 'shrinking');
    return c - .06 * clamp(sp(t, sq - .05, 2.6, .9), 0, 1);
  }
  var CAP1 = .8 - .065 - .06;   /* the capacity the battery settles at */
  var PH1 = { x: CX, y: 1085, s: .8 };
  var ICON = { y: 245, w: 170, h: 262 };     /* the battery's place on the screen, screen-local */
  function phoneRise(t) { var a = at('check', 'check') - .15; return eio(seg(t, a, a + .6)); }
  function flyK(t) { var a = at('check', 'check') - .05; return eio(seg(t, a, a + .75)); }
  function iconWorld(py) { return { x: PH1.x, y: py + ICON.y * PH1.s, w: ICON.w * PH1.s, h: ICON.h * PH1.s }; }
  /* the re-created Battery Health screen: a plain list, house type, no real interface */
  function healthScreen(t, val, valA, opt) {
    opt = opt || {};
    return function (g, sw, sh) {
      g.fillStyle = SCREEN; g.fillRect(-sw / 2, -sh / 2, sw, sh);
      g.textBaseline = 'middle'; g.textAlign = 'left';
      /* a plain list in house type: a heading, ruled rows (no real interface) */
      font(g, 46, 700, MONO); ls(g, 3); g.fillStyle = CREAM; g.fillText('BATTERY', -sw / 2 + 48, -sh / 2 + 150); ls(g, 0);
      g.fillStyle = 'rgba(244,237,224,.25)'; g.fillRect(-sw / 2 + 40, -sh / 2 + 200, sw - 80, 3); g.fillRect(-sw / 2 + 40, -sh / 2 + 620, sw - 80, 3);
      var cy = -sh / 2 + 268;
      font(g, 46, 600, MONO); g.fillStyle = CREAM; g.fillText('Capacity', -sw / 2 + 48, cy + 10); g.fillText('vs. new', -sw / 2 + 48, cy + 64);
      g.save(); g.translate(0, cy + 238); var vs = opt.vs || 1; g.scale(vs, vs);
      font(g, 158, 900); wide(g); g.textAlign = 'center'; g.fillStyle = val === '??%' ? HOT : CREAM;
      g.globalAlpha *= clamp(valA, 0, 1); g.fillText(val, 0, 0); g.restore();
      if (opt.icon) opt.icon(g);
      if (opt.extra) opt.extra(g, sw, sh);
    };
  }
  function healthVal(t) {
    var b = at('why', 'below'), w0 = at('why', '100%') + .25;
    if (t < b) return '??%';
    return pctText(lerp(100, 87, eio(seg(qt(t), b, w0))));
  }
  function healthScene(g, t) {
    var rise = phoneRise(t), fk = flyK(t), py = PH1.y + (1 - rise) * 1150;
    var cap = capAt(t), ic = iconWorld(py);
    var why = at('why', 'why'), b = at('why', 'below');
    var landed = fk >= 1;
    var iconFn = function (g) { battery(g, 0, ICON.y, ICON.w, ICON.h, { cap: cap, fill: 1, t: t, lw: 13, ghost: 1 }); };
    var wasI = INCOMING; if (rise < 1) INCOMING = true;
    if (rise > 0) phone(g, PH1.x, py, PH1.s, (1 - rise) * .06, 1, healthScreen(t, healthVal(t), 1, { icon: landed ? iconFn : null, vs: kn(t, b) * kn(t, wend('why', '100%')),
      extra: function (g, sw, sh) {
        font(g, 40, 500, MONO); ls(g, 2); g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText('LOST VS. NEW', 0, ICON.y + 168); ls(g, 0);
      } }));
    INCOMING = wasI;
    /* the battery itself: huge on frame 0, then it drops into the screen */
    if (!landed) {
      var x = lerp(BIG.x, ic.x, fk), y = lerp(BIG.y, ic.y, fk) - Math.sin(fk * Math.PI) * 60, w = lerp(BIG.w, ic.w, fk), h = lerp(BIG.h, ic.h, fk);
      battery(g, x, y, w, h, { cap: cap, fill: 1, t: t, lw: lerp(40, 13 * PH1.s, fk), rot: Math.sin(fk * Math.PI) * -.08 + (1 - fk) * Math.sin(t * 1.3) * .012, band: fk < .5 });
    }
    /* tags: the screen is a re-creation; which phones have it */
    var ra = fin(t, at('check', 'settings') - .1);
    tag(g, 'RE-CREATED', 740, 690, ra * rise, .04);
    label(g, 'iPhone · Pixel 8a and later', CX, 592, fin(t, at('check', 'settings') - .1) * (1 - seg(t, wend('why', '100%') + .1, wend('why', '100%') + .3)), CREAM, 38, 'center', true);
    tag(g, 'EXAMPLE', 742, 900, fin(t, wend('why', '100%') - .1), -.05);
    /* WHY? on "why" */
    stamp(g, 'WHY?', 640, 1300, t, why - .02, S('twist').t0 - SWIPE, 96, HOT, -.08);
  }
  /* the search phrase, from 1.5 s: it stays as the screen's name */
  function healthChip(g, t) {
    var a = fin(t, CHIP_T) * (1 - seg(t, S('twist').t0 - SWIPE - .1, S('twist').t0 - SWIPE + .05));
    chip(g, 'BATTERY HEALTH', CX, 522, { px: 62, wt: 900, bg: HOT, fg: BG, a: a, s: lerp(.8, 1, clamp(sp(t, CHIP_T, 3), 0, 1)) * kn(t, at('check', 'health')) });
  }
  /* frame 0's headline: YOUR BATTERY / IS SHRINKING, SHRINKING on a coral pill from frame 0 */
  function headline(g, t, a, idle) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    var px = 112; font(g, px, 900); wide(g);
    var l1 = 'YOUR BATTERY', tw = g.measureText(l1).width;
    if (tw > 800) { px = Math.floor(px * 800 / tw); font(g, px, 900); wide(g); }
    g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText(l1, CX, 285);
    var s1 = 'IS ', s2 = 'SHRINKING', w1 = g.measureText(s1).width, w2 = g.measureText(s2).width, x = CX - (w1 + w2) / 2, y = 405;
    var kk = idle ? 0 : Math.max(0, knock(t, at('hook', 'shrinking'), 16, 6));
    g.textAlign = 'left'; g.fillText(s1, x, y);
    g.save(); g.translate(x + w1 + w2 / 2, y); var sq = 1 - .05 * kk; g.scale(sq, 1 + .03 * kk);
    rr(g, -w2 / 2 - 14, -px * .6, w2 + 28, px * 1.2, 16); g.fillStyle = HOT; g.fill();
    g.fillStyle = BG; g.textAlign = 'center'; g.fillText(s2, 0, 0);
    g.restore(); g.restore();
  }
  function headA(t) { var c = at('check', 'check'); return 1 - seg(t, c - .3, c - .06); }
  /* frame 0 (and the loop's landing frame) */
  function hookIdle(g, ti) {
    battery(g, BIG.x, BIG.y, BIG.w, BIG.h, { cap: hookCap(Math.max(0, ti)), fill: 1, t: ti, lw: 40, rot: Math.sin(Math.max(0, ti) * 1.3) * .012 });
  }

  /* =====================================================================================================
     SCENE 2 · twist: a battery at 100 % sits in an armchair while the clock spins; on "ages" it squeezes
     ===================================================================================================== */
  function wallClock(g, x, y, r, hr, a, s) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s || 1, s || 1);
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 8, 14, r, r);
    g.fillStyle = CREAM; el(g, 0, 0, r, r); g.strokeStyle = BODY; g.lineWidth = r * .1; g.beginPath(); g.arc(0, 0, r * .95, 0, 6.283); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 5; for (var i = 0; i < 12; i++) { var an = i * Math.PI / 6; g.beginPath(); g.moveTo(Math.sin(an) * r * .7, -Math.cos(an) * r * .7); g.lineTo(Math.sin(an) * r * .82, -Math.cos(an) * r * .82); g.stroke(); }
    var ha = hr / 12 * 6.283, ma = hr * 6.283;
    g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ha) * r * .45, -Math.cos(ha) * r * .45); g.stroke();
    g.strokeStyle = HOT; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ma) * r * .68, -Math.cos(ma) * r * .68); g.stroke();
    g.fillStyle = HOT; el(g, 0, 0, 11, 11);
    g.restore();
  }
  function armchair(g, x, y, s, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, 10, 250, 330, 30);
    g.fillStyle = '#5a3a22'; g.fillRect(-250, 190, 26, 64); g.fillRect(224, 190, 26, 64);
    g.fillStyle = '#9c6a35'; rr(g, -230, -330, 460, 380, 70); g.fill();               /* back */
    g.fillStyle = TAN; rr(g, -250, 60, 500, 150, 40); g.fill();                         /* seat */
    g.fillStyle = '#b77d40'; rr(g, -300, -40, 110, 250, 50); g.fill(); rr(g, 190, -40, 110, 250, 50); g.fill();   /* arms */
    g.strokeStyle = 'rgba(33,29,38,.25)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-200, 120); g.lineTo(200, 120); g.stroke();
    g.restore();
  }
  function chairScene(g, t) {
    var s0 = S('twist').t0, tw = at('twist', 'twist'), sit = at('twist', 'sitting'), ages = at('twist', 'ages'), fast = at('twist', 'faster');
    armchair(g, CX, 1080, 1, 1);
    /* the clock races: hours pass while it just sits */
    var hr = 10 + Math.max(0, t - s0) * 1.4 + 6 * eio(seg(t, sit, end('twist')));
    wallClock(g, 250, 640, 120, hr, fin(t, s0 + .05), kn(t, ages));
    /* the battery drops into the chair on "sitting" and squeezes on "ages" */
    var dk = sp(t, tw - .25, 2.4, .9), bx = CX, byS = 1150;   /* bottom on the seat */
    var cap = 1 - .12 * clamp(sp(t, ages - .03, 2.6, .9), 0, 1) - .04 * clamp(sp(t, fast, 2.4, .9), 0, 1);
    var by = lerp(byS - 260, byS, clamp(dk, 0, 1.02));
    battery(g, bx, by - 230, 300, 460, { cap: cap, fill: 1, t: t, anchor: 'base', pct: '100%', px: 74, ty: .45, a: clamp(dk * 4, 0, 1) });
    stamp(g, 'THE TWIST', 680, 585, t, tw - .03, S('year').t0 - SWIPE, 60, HOT, .07);
    /* Samsung's words */
    var qa = fin(t, s0 + .05);
    block(g, ['FULL FOR A LONG TIME', '“can reduce its lifespan”'], CX, 1345, 38, qa, true, CREAM, 600);
    label(g, '— Samsung Support', CX, 1416, qa, CREAM, 30, 'center', true);
  }

  /* =====================================================================================================
     SCENE 3 · year + eighty + forty: the DM frame. Stored a year at 77 °F: full keeps ≈80 %, at 40 % ≈96 % (ESTIMATE)
     ===================================================================================================== */
  var FIVEX = 0, PULSE = 0;
  var MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  var BL = { x: 292, y: 1235, w: 300, h: 500 }, BR = { x: 728, y: 1235, w: 300, h: 500 };   /* y = the floor */
  function monthF(t) { var a = at('year', 'for') - .05, b = wend('year', 'year') + .1; return 11.999 * seg(t, a, b); }
  function calendar(g, x, y, t, a) {
    if (a <= 0) return;
    var m = monthF(t), i = Math.floor(m), fr = m - i;
    function page(g, w, h, idx) {
      g.fillStyle = REDINK; g.fillRect(-w / 2, -h / 2, w, 70);
      font(g, 30, 600, MONO); ls(g, 3); g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MONTH', 0, -h / 2 + 36); ls(g, 0);
      font(g, 112, 900); wide(g); g.fillStyle = INK; g.fillText(MON[idx], 0, 30);
      g.fillStyle = 'rgba(33,29,38,.35)'; for (var d = 0; d < 7; d++) g.fillRect(-w / 2 + 26 + d * 36, h / 2 - 34, 22, 8);
    }
    sheet(g, x, y, 300, 310, -.03, a, function (g, w, h) { page(g, w, h, i); });
    /* the page tearing off: the previous month lifts from the top */
    if (i > 0 && fr < .5) {
      var k = fr / .5;
      g.save(); g.globalAlpha *= clamp(a, 0, 1) * (1 - k); g.translate(x, y - 155); g.rotate(-.03 - k * .3); g.scale(1, 1 - k * .8); g.translate(0, 155 - k * 60);
      g.fillStyle = PAPER; g.fillRect(-150, -155, 300, 310); page(g, 300, 310, i - 1); g.restore();
    }
    /* spiral rings */
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.fillStyle = BODY; for (var r = 0; r < 5; r++) el(g, x - 110 + r * 55, y - 158, 9, 16); g.restore();
  }
  function thermoCard(g, x, y, a, rot) {
    sheet(g, x, y, 300, 170, rot || .03, a, function (g, w, h) {
      g.fillStyle = INK; rr(g, -w / 2 + 34, -50, 22, 92, 11); g.fill(); g.fillStyle = REDINK; el(g, -w / 2 + 45, 48, 22, 22); g.fillRect(-w / 2 + 40, -10, 10, 50);
      font(g, 30, 600, MONO); ls(g, 2); g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('ROOM TEMP', -w / 2 + 84, -38); ls(g, 0);
      font(g, 86, 900); wide(g); g.fillText('77°F', -w / 2 + 84, 30);
    });
  }
  function storeScene(g, t) {
    var s0 = S('year').t0, full = at('year', 'full'), yr = at('year', 'year'), room = at('year', 'room');
    var k80 = at('eighty', '80%'), cap80 = at('eighty', 'capacity');
    var lv = at('forty', 'leave'), f40 = at('forty', '40%'), ins = at('forty', 'instead'), ab = at('forty', 'about'), n96 = at('forty', '96%');
    /* left: stored full */
    var lk = pop(t, s0 + .02, 2.6);
    var capL = 1 - .2 * eio(seg(t, k80 - .1, wend('eighty', '80%') + .25));
    var pk = Math.sin(Math.PI * seg(t, PULSE, PULSE + .3)) * .06;
    g.save(); g.translate(BL.x, BL.y - BL.h / 2); g.scale(1 + pk, 1 + pk); g.translate(-BL.x, -(BL.y - BL.h / 2));
    battery(g, BL.x, BL.y - BL.h / 2 - (1 - Math.min(1, lk)) * 80, BL.w, BL.h, { vonly: true, cap: capL, fill: 1, t: t, anchor: 'base', a: clamp(lk * 3, 0, 1), ghost: capL < .995 ? 1 : 0 });
    g.restore();
    label(g, 'STORED FULL', BL.x, 660, fin(t, full - .05), CREAM, 42);
    /* the calendar flips JAN → DEC; the thermometer card; both leave when the second battery comes */
    var out = eio(seg(t, lv - .05, lv + .4));
    calendar(g, BR.x + out * 420, 870, t, fin(t, s0 + .12) * (1 - seg(out, 0, .15)));
    thermoCard(g, BR.x + out * 420, 1150, fin(t, room - .1) * (1 - seg(out, 0, .15)), .03);
    /* right: kept at 40 % */
    var rk = sp(t, lv + .1, 2.6, .9), capR = 1 - .04 * eio(seg(t, ins + .05, ins + .3));
    if (rk > 0) {
      battery(g, BR.x, BR.y - BR.h / 2 - (1 - clamp(rk, 0, 1)) * 700, BR.w, BR.h, { vonly: true, cap: capR, fill: .4, t: t, anchor: 'base', a: clamp(rk * 4, 0, 1), ghost: capR < .995 ? 1 : 0 });
      label(g, 'STORED AT 40%', BR.x, 660, fin(t, f40), CREAM, 40);
    }
    /* what each keeps after the year */
    var vL = (1 - .2 * eio(seg(qt(t), k80 - .1, wend('eighty', '80%') + .25))) * 100, vR = (1 - .04 * eio(seg(qt(t), ins + .05, ins + .3))) * 100;
    /* the lost capacity, named */
    chip(g, '−20%', BL.x - 62, 785, { px: 48, wt: 900, bg: HOT, fg: BG, a: fin(t, wend('eighty', '80%')), s: lerp(1.3, 1, clamp(pop(t, wend('eighty', '80%'), 3.2), 0, 1)), rot: -.05 });
    if (rk > 0) chip(g, '−4%', BR.x + 105, 712, { px: 48, wt: 900, bg: HOT, fg: BG, a: fin(t, n96), s: lerp(1.3, 1, clamp(pop(t, n96, 3.2), 0, 1)), rot: -.05 });
    chip(g, 'KEEPS ' + pctText(vL), BL.x, 1310, { px: 56, wt: 900, bg: vL < 99.5 ? HOT : CREAM, fg: BG, a: fin(t, k80 - .3), s: kn(t, wend('eighty', '80%')), maxw: 350 });
    if (rk > 0) chip(g, 'KEEPS ' + pctText(vR), BR.x, 1310, { px: 56, wt: 900, bg: vR < 99.5 ? HOT : CREAM, fg: BG, a: fin(t, ins - .2), s: kn(t, n96), maxw: 350 });
    /* the condition in big type, in the same frame */
    var ha = fin(t, yr - .05);
    chip(g, t < room - .03 ? 'STORED 1 YEAR' : 'STORED 1 YEAR · 77°F', CX, 520, { px: 66, wt: 900, bg: CREAM, fg: BG, a: ha, s: kn(t, yr) * kn(t, room), maxw: 760 });
    stamp(g, '5× THE LOSS', CX, 1000, t, FIVEX, S('heat').t0 - SWIPE, 72, HOT, -.06);
    chip(g, 'ESTIMATE · BATTERY UNIVERSITY', CX, 1408, { px: 36, wt: 700, fam: MONO, line: CREAM, lw: 3, fg: CREAM, a: fin(t, k80 - .2), shadow: false, maxw: 820, bg: 'rgba(21,19,27,.9)' });
  }

  /* =====================================================================================================
     SCENE 4 · heat + drain: the thermometer climbs past 95 °F; then the fill drains to zero
     ===================================================================================================== */
  var THERM = { x: 760, top: 600, bot: 1150 };
  function tempY(f) { return lerp(THERM.bot - 60, THERM.top + 40, seg(f, 32, 120)); }
  function sun(g, x, y, r, t, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(t * .35);
    g.fillStyle = YEL; for (var i = 0; i < 10; i++) { g.save(); g.rotate(i * Math.PI / 5); tri(g, -r * .16, -r * 1.12, r * .16, -r * 1.12, 0, -r * 1.48); g.restore(); }
    g.fillStyle = '#ffb12e'; el(g, 0, 0, r, r); g.fillStyle = YEL; el(g, -r * .12, -r * .12, r * .82, r * .82);
    g.restore();
  }
  function heatScene(g, t) {
    var s0 = S('heat').t0, ht = at('heat', 'heat'), n95 = at('heat', '95'), perm = at('heat', 'permanent');
    var dr = at('drain', 'draining'), zero = at('drain', 'zero'), too = at('drain', 'too');
    var gone = eio(seg(t, dr - .3, dr + .2));
    /* the sun and the thermometer */
    sun(g, 250, 650, 92, t, fin(t, s0 + .05) * (1 - seg(gone, 0, .5)));
    var temp = lerp(72, 104, eio(seg(t, ht - .1, wend('heat', '95') + .2)));
    var ta = fin(t, s0 + .1) * (1 - seg(gone, 0, .3));
    if (ta > 0) {
      g.save(); g.globalAlpha *= ta; g.translate(gone * 400, 0);
      sheet(g, THERM.x, (THERM.top + THERM.bot) / 2, 230, THERM.bot - THERM.top + 60, .02, 1, null);
      g.fillStyle = INK; rr(g, THERM.x - 70 - 22, THERM.top + 20, 44, THERM.bot - THERM.top - 60, 22); g.fill();
      g.fillStyle = REDINK; el(g, THERM.x - 70, THERM.bot - 20, 46, 46);
      var my = tempY(temp); g.fillRect(THERM.x - 70 - 12, my, 24, THERM.bot - 20 - my);
      [[32, '32'], [77, '77'], [120, '120']].forEach(function (m) { var y = tempY(m[0]); g.fillStyle = INK; g.fillRect(THERM.x - 44, y - 2, 26, 4); font(g, 36, 600, MONO); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(m[1], THERM.x - 6, y); });
      /* the 95 °F line */
      var y95 = tempY(95), lk = seg(t, n95 - .15, n95 + .1);
      g.strokeStyle = HOT; g.lineWidth = 8; g.setLineDash([18, 10]); g.beginPath(); g.moveTo(THERM.x - 110, y95); g.lineTo(lerp(THERM.x - 110, THERM.x + 110, lk), y95); g.stroke(); g.setLineDash([]);
      g.restore();
      chip(g, '95°F', THERM.x + gone * 400, tempY(95) - 62, { px: 52, wt: 900, bg: HOT, fg: BG, a: fin(t, n95 - .1) * ta, s: kn(t, n95) });
    }
    /* the battery: squeezes on "permanent"; then moves centre and drains */
    var capH = 1 - .1 * clamp(sp(t, perm - .03, 2.6, .9), 0, 1) - .08 * clamp(sp(t, too - .03, 2.6, .9), 0, 1);
    var bx = lerp(370, CX, gone), bw = lerp(320, 380, gone), bh = lerp(520, 600, gone), floor = 1195;
    var fillD = 1 - eio(seg(t, dr, wend('drain', 'zero'))), fillQ = 1 - eio(seg(qt(t), dr, wend('drain', 'zero')));
    var bk = pop(t, s0 + .02, 2.6);
    battery(g, bx, floor - bh / 2 - (1 - Math.min(1, bk)) * 60, bw, bh, { cap: capH, fill: Math.max(fillD, .0), t: t, anchor: 'base', a: clamp(bk * 3, 0, 1),
      pct: t > dr - .1 ? pctText(fillQ * 100) : null, px: 96, ty: .42, rot: knock(t, too, 26, 7) * .03 });
    /* the conditions, big */
    var ca = fin(t, n95) * (1 - gone);
    chip(g, 'ABOVE 95°F', CX, 1282, { px: 70, wt: 900, bg: HOT, fg: BG, a: ca, s: kn(t, perm), rot: -.02 });
    block(g, ['APPLE: heat “can permanently', 'damage battery capacity”'], CX, 1393, 36, fin(t, perm + .05) * (1 - seg(gone, 0, .3)), true, CREAM, 600);
    var za = fin(t, dr - .25);
    chip(g, 'DEEP DRAIN', CX, 1278, { px: 64, wt: 900, bg: CREAM, fg: BG, a: za, s: kn(t, too) });
    block(g, ['FEWER CYCLES · ESTIMATE', 'BATTERY UNIVERSITY'], CX, 1384, 36, fin(t, dr + .15), true, CREAM, 600);
    stamp(g, 'WEARS IT TOO', CX + 10, 1060, t, too - .02, S('limit').t0 - SWIPE, 64, HOT, .06);
  }

  /* =====================================================================================================
     SCENE 5 · limit: three generic phones (no logos), each stops at 80 %
     ===================================================================================================== */
  var TRIO = [{ x: 222, w: 'iphone', name: 'iPhone 15+' }, { x: 510, w: 'pixel', name: 'Pixel 6a+' }, { x: 798, w: 'samsung', name: 'Galaxy', sub: 'One UI 6.1+' }];
  function limitScreen(t, k80) {
    return function (g, sw, sh) {
      g.fillStyle = SCREEN; g.fillRect(-sw / 2, -sh / 2, sw, sh);
      var f = lerp(.35, .8, eio(seg(t, S('limit').t0, at('limit', '80%') + .1)));
      battery(g, 0, 40, 300, 540, { cap: 1, fill: f, t: t, lw: 22, calm: true });
      /* the stop line at 80 % */
      if (k80 > 0) {
        var ins = 22 * 1.5, ih = 540 - ins * 2, y = 40 - 270 + ins + ih * .2;
        g.save(); g.globalAlpha *= clamp(k80, 0, 1); g.strokeStyle = CREAM; g.lineWidth = 12; g.setLineDash([26, 14]);
        g.beginPath(); g.moveTo(-200, y); g.lineTo(200, y); g.stroke(); g.setLineDash([]); g.restore();
      }
    };
  }
  function limitScene(g, t) {
    var s0 = S('limit').t0, stop = at('limit', 'stop'), e80 = at('limit', '80%');
    TRIO.forEach(function (p, i) {
      var w0 = at('limit', p.w), k = sp(t, w0 - .22, 2.8, .88), a = clamp(k * 4, 0, 1);
      if (k <= 0) return;
      var y = 880 + (1 - clamp(k, 0, 1.02)) * 700;
      var k80 = fin(t, e80 - .1 + i * .08);
      phone(g, p.x, y, .46, (i - 1) * .025, a, limitScreen(t, k80));
      chip(g, '80%', p.x, y - 40, { px: 64, wt: 900, bg: HOT, fg: BG, a: clamp(pop(t, e80 - .05 + i * .08, 3.2) * 3, 0, 1), s: lerp(1.3, 1, clamp(pop(t, e80 - .05 + i * .08, 3.2), 0, 1)), rot: (i - 1) * .04 });
      label(g, p.name, p.x, 1222, a * fin(t, w0), CREAM, 36);
      if (p.sub) label(g, p.sub, p.x, 1268, a * fin(t, w0), CREAM, 30);
    });
    chip(g, 'CHARGE LIMIT', CX, 1372, { px: 64, wt: 900, bg: CREAM, fg: BG, a: fin(t, s0 + .1), s: kn(t, stop) * kn(t, e80) });
    tag(g, 'ILLUSTRATION', 744, 560, fin(t, s0 + .3), .03);
  }

  /* =====================================================================================================
     SCENE 6 · night: the phone waits at 80 % on the nightstand; the alarm rings on "wake" and it tops up
     ===================================================================================================== */
  function nightK(t) { return eio(seg(t, at('night', 'until') - .05, at('night', 'wake') + .15)); }
  function alarm(g, x, y, r, hr, ring, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(Math.sin(ring * 50) * .07 * Math.min(1, ring * 8) * Math.exp(-ring * 2.5));
    g.fillStyle = BODY2; el(g, -r * .62, -r * .86, r * .34, r * .3); el(g, r * .62, -r * .86, r * .34, r * .3);
    g.strokeStyle = BODY2; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(-r * .6, r * .9); g.lineTo(-r * .8, r * 1.15); g.moveTo(r * .6, r * .9); g.lineTo(r * .8, r * 1.15); g.stroke();
    g.fillStyle = HOT; el(g, 0, 0, r * 1.06, r * 1.06);
    g.restore();
    wallClock(g, x, y, r * .9, hr, a);
    if (ring > 0 && ring < 1.4) {
      g.save(); g.globalAlpha *= clamp(a, 0, 1) * (1 - seg(ring, .8, 1.4)); g.strokeStyle = CREAM; g.lineWidth = 7; g.lineCap = 'round';
      for (var i = 0; i < 2; i++) { var rr2 = r * (1.35 + i * .25) + ring * 30; g.beginPath(); g.arc(x, y, rr2, -2.5, -1.9); g.stroke(); g.beginPath(); g.arc(x, y, rr2, -1.25, -.65); g.stroke(); }
      g.restore();
    }
  }
  function nightScene(g, t) {
    var s0 = S('night').t0, over = at('night', 'overnight'), wait = at('night', 'wait'), n80 = at('night', '80'), wake = at('night', 'wake');
    var dawn = nightK(t);
    /* the window: moon and stars, then dawn */
    var wx = 255, wy = 680, ww = 300, wh = 330;
    g.save(); g.fillStyle = BODY2; rr(g, wx - ww / 2 - 18, wy - wh / 2 - 18, ww + 36, wh + 36, 14); g.fill();
    var sky = g.createLinearGradient(0, wy - wh / 2, 0, wy + wh / 2);
    sky.addColorStop(0, dawn > 0 ? 'rgb(' + Math.round(lerp(28, 233, dawn)) + ',' + Math.round(lerp(33, 160, dawn)) + ',' + Math.round(lerp(64, 120, dawn)) + ')' : '#1c2140');
    sky.addColorStop(1, 'rgb(' + Math.round(lerp(40, 250, dawn)) + ',' + Math.round(lerp(46, 205, dawn)) + ',' + Math.round(lerp(84, 150, dawn)) + ')');
    g.fillStyle = sky; g.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
    g.save(); g.beginPath(); g.rect(wx - ww / 2, wy - wh / 2, ww, wh); g.clip();
    var r = mulberry(11); g.fillStyle = 'rgba(244,237,224,' + (.8 * (1 - dawn)) + ')'; for (var i = 0; i < 14; i++) { var sx = wx - ww / 2 + r() * ww, sy = wy - wh / 2 + r() * wh * .7, tw = .5 + .5 * Math.sin(t * 3 + i); el(g, sx, sy, 2.5 + tw * 2, 2.5 + tw * 2); }
    var my = wy - 40 + dawn * 220; g.fillStyle = 'rgba(244,237,224,' + (1 - dawn * .6) + ')'; el(g, wx + 40, my, 54, 54); g.fillStyle = dawn > 0 ? sky : '#1c2140'; el(g, wx + 64, my - 16, 48, 48);
    g.restore();
    g.strokeStyle = BODY2; g.lineWidth = 12; g.beginPath(); g.moveTo(wx, wy - wh / 2); g.lineTo(wx, wy + wh / 2); g.moveTo(wx - ww / 2, wy); g.lineTo(wx + ww / 2, wy); g.stroke();
    g.restore();
    /* the nightstand */
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(150, 1290, 760, 30);
    g.fillStyle = '#6e4a2c'; g.fillRect(120, 1270, 820, 40); g.fillStyle = '#5a3a22'; g.fillRect(150, 1310, 760, 200);
    /* the alarm clock: 11 → 7 */
    var hr = 11 + 8 * eio(seg(t, s0 + .1, wake)), ring = t >= wake ? t - wake : 0;
    alarm(g, 735, 1150, 105, hr, ring, fin(t, s0 + .05));
    label(g, (function () { var h = Math.floor(hr) % 12; h = h === 0 ? 12 : h; return h + (hr >= 12 && hr < 24 ? ' AM' : ' PM'); })(), 735, 960, fin(t, s0 + .15), CREAM, 40, 'center', true);
    /* the phone on its cable, on the stand */
    var px = 400, py = 1035, ps = .4;
    g.save(); g.strokeStyle = CREAM; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py + PH * ps / 2 - 6); g.bezierCurveTo(px, py + PH * ps / 2 + 60, px - 160, 1250, px - 230, 1272); g.stroke(); g.restore();
    var top = eio(seg(t, wake + .05, wake + .7));
    phone(g, px, py, ps, -.04, 1, function (g, sw, sh) {
      g.fillStyle = SCREEN; g.fillRect(-sw / 2, -sh / 2, sw, sh);
      battery(g, 0, 40, 300, 540, { cap: 1, fill: lerp(.8, 1, top), t: t, lw: 22, pct: pctText(lerp(80, 100, eio(seg(qt(t), wake + .05, wake + .7)))), px: 96, ty: .6, calm: true });
      /* waiting: two pause bars */
      var pa = 1 - top; g.save(); g.globalAlpha *= pa; g.fillStyle = CREAM; rr(g, -50, -420, 34, 100, 8); g.fill(); rr(g, 16, -420, 34, 100, 8); g.fill();
      var wk = seg(t, S('night').t0 + .1, wake); g.fillStyle = 'rgba(244,237,224,.2)'; rr(g, -180, -290, 360, 22, 11); g.fill(); g.fillStyle = HOT; rr(g, -180, -290, 360 * wk, 22, 11); g.fill(); g.restore();
    });
    chip(g, t < wake + .3 ? 'CAN WAIT AT 80%' : 'FULL BY 7 AM', CX, 1395, { px: 58, wt: 900, bg: t < wake + .3 ? HOT : CREAM, fg: BG, a: fin(t, over - .1), s: kn(t, wait) * kn(t, n80) * kn(t, wake + .3) });
    tag(g, 'ILLUSTRATION', 744, 560, fin(t, s0 + .3), .03);
  }

  /* =====================================================================================================
     SCENE 7 · end: back to Battery Health, ??%, your number → frame 0
     ===================================================================================================== */
  function endScene(g, t) {
    var s0 = S('end').t0, bh = at('end', 'health'), num = at('end', 'number');
    var out = eio(seg(t, HOME - .6, HOME));
    var py = PH1.y + out * 1500;
    /* the battery leaves the screen and grows back into frame 0 */
    var fk = 1 - out;
    var wasI = INCOMING; if (out > 0) INCOMING = true;
    phone(g, PH1.x, py, PH1.s, out * .06, 1, healthScreen(t, '??%', 1, { vs: kn(t, bh), icon: out <= 0 ? function (g) { battery(g, 0, ICON.y, ICON.w, ICON.h, { cap: CAP1, fill: 1, t: t, lw: 13 }); } : null,
      }));
    INCOMING = wasI;
    if (out > 0) {
      var ic = iconWorld(PH1.y);   /* it lifts out of where the screen was */
      var ti = t - DUR, cap = lerp(CAP1, hookCap(0), out);
      battery(g, lerp(ic.x, BIG.x, out), lerp(ic.y, BIG.y, out) - Math.sin(out * Math.PI) * 60, lerp(ic.w, BIG.w, out), lerp(ic.h, BIG.h, out), { cap: cap, fill: 1, t: ti, lw: lerp(13 * PH1.s, 40, out), rot: Math.sin(out * Math.PI) * .08 });
    }
    var oa = 1 - out;
    tag(g, 'RE-CREATED', 760, 700, fin(t, s0 + .2) * oa, .04);
    chip(g, 'BATTERY HEALTH', CX, 522, { px: 62, wt: 900, bg: HOT, fg: BG, a: fin(t, s0 + .1) * oa, s: kn(t, bh) });
    /* your number: an empty comment box with a blinking caret */
    var ca = fin(t, at('end', 'so') - .12) * (1 - seg(t, HOME - .2, HOME + .1));
    if (ca > 0) {
      g.save(); g.globalAlpha *= ca; var bx = CX - 330, by = 578;
      rr(g, bx + 6, by + 10, 660, 104, 52); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
      rr(g, bx, by, 660, 104, 52); g.fillStyle = BG; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
      var ks = kn(t, num); g.translate(CX, by + 52); g.scale(ks, ks); g.translate(-CX, -(by + 52));
      font(g, 46, 500, MONO); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('my number: __%', bx + 86, by + 54);
      if (Math.floor(t * 2) % 2 === 0) { g.fillStyle = HOT; g.fillRect(bx + 52, by + 22, 10, 60); }
      g.restore();
    }
    /* sources, small print */
    var sa = fin(t, s0 + .3) * oa;
    block(g, ['Apple · Google Pixel Help · Samsung', 'Battery University · Keil et al. 2016'], CX, 1398, 34, sa, true, CREAM, 500);
  }

  /* ---------- captions: the narrator's words, one block at a time; only stressed words get the coral pill ---------- */
  /* caption cards break at phrase boundaries: sentence ends, then these words start a new card */
  var CAPBRK = { check: ['in'], year: ['for'], heat: ['can'], limit: ['let'], night: ['until'] };
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;   /* frame 0 carries YOUR BATTERY IS SHRINKING instead: ≤ 5 words on screen */
      var brk = (CAPBRK[l.id] || []).slice(), cur = [], ws = [];
      /* "95°" + "F" are one word on screen */
      l.words.forEach(function (w) { var p = ws[ws.length - 1]; if (p && w.w === 'F' && /°$/.test(p.w)) ws[ws.length - 1] = { w: p.w + 'F', t0: p.t0, t1: w.t1 }; else ws.push(w); });
      ws.forEach(function (w, i) {
        if (cur.length && brk.length && norm(w.w) === brk[0]) { out.push(cur); cur = []; brk.shift(); }
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { out.push(cur); cur = []; }
      });
      if (cur.length) out.push(cur);
    });
    return out.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS = [['check', 'battery'], ['check', 'health'], ['check', 'settings'], ['why', 'below'], ['why', 'why'],
    ['twist', 'twist'], ['twist', 'sitting'], ['twist', 'ages'], ['year', 'full'], ['year', 'year'], ['eighty', '80%'],
    ['forty', '40%'], ['forty', '96%'], ['heat', 'heat'], ['heat', '95'], ['heat', 'permanent'], ['drain', 'zero'], ['drain', 'too'],
    ['limit', 'iphone'], ['limit', 'pixel'], ['limit', 'samsung'], ['limit', '80%'], ['night', 'overnight'], ['night', '80'], ['night', 'wake'],
    ['end', 'health'], ['end', 'number']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  /* captions never draw over a fill wipe */
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE - .14, sc.t0 - SWIPE) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1 };
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), out = 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - card0.t0 + .04, 3.2, .8), 0, 1.04);
    g.save(); g.font = '800 74px Archivo'; wide(g);
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 22;
    var lines, lw, maxw = 780, cpx = 74;
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
    var lh = cpx * 1.18, y0 = 380 - (lines.length - 1) * lh / 2;
    g.globalAlpha = fi * out * wipeHide(t) * (alpha == null ? 1 : alpha);
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 40;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 12, y - cpx * .87, ws[i] + 24, cpx * 1.15, 18); g.fill(); }
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = { health: healthScene, chair: chairScene, store: storeScene, heat: heatScene, limit: limitScene, night: nightScene, end: endScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) {
    g.save();
    if (Sc.fn !== 'health' && Sc.fn !== 'end') { var push = 1 + .015 * seg(t, Sc.t0, Sc.t1); g.translate(CX, 1000); g.scale(push, push); g.translate(-CX, -1000); }
    SCENES[Sc.fn](g, t);
    g.restore();
  }
  /* the fill wipe's level line: a gentle liquid surface */
  function levelY(x, ly, t) { return ly + Math.sin(x * .011 + t * 9) * 9 + Math.sin(x * .023 - t * 6) * 5; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(t, Nx.t0 - SWIPE, Nx.t0)) : 0;
    var pre = Sc.swipe && t < Sc.t0 + PRE;
    drawScene(g, Sc, pre ? Sc.t0 + PRE : t);
    if (si === 0 && LIVE.text) healthChip(g, t);
    if (sk > 0) {
      /* the native cut: the next scene rises from the bottom like a charge level; it is already drawn under the line */
      var ly = H * (1 - sk) - 20, x;
      g.save(); g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 30) g.lineTo(x, levelY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; drawScene(g, Nx, Nx.t0 + PRE); INCOMING = false; g.restore();
      g.save(); g.strokeStyle = HOT; g.lineWidth = 10; g.beginPath(); for (x = 0; x <= W; x += 30) { var yy = levelY(x, ly, t); if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore();
    }
    /* the loop: the end dissolves back into frame 0 */
    var back = eio(seg(t, HOME, HOME + .35));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); hookIdle(g, t - DUR); g.restore(); }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) {
      if (si === 0) headline(g, t, headA(t));
      if (back > 0) { captions(g, t, 1 - back); headline(g, 0, seg(t, DUR - .2, DUR - 1 / 60), true); } else captions(g, t);
    }
    if (!POSTERMODE) {
      g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(90, 222, 840, 6);
      g.fillStyle = HOT; g.fillRect(90, 222, 840 * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false;
  function posterTitle(g) {
    g.save(); font(g, 76, 800); wide(g); g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText('Why your battery', CX, 300);
    var b = 'is shrinking', wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 14, 400 - 70, wb + 28, 96, 16); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 400); g.restore();
  }
  function TEXTS(t) {
    var out = [];
    function T(id, text, a, b) { if (t >= a && t < b) out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    T('head', 'YOUR BATTERY IS SHRINKING', 0, at('check', 'check') - .1); T('head', 'YOUR BATTERY IS SHRINKING', DUR - .13, DUR + 1); 
    T('chip', 'BATTERY HEALTH', CHIP_T + .2, S('twist').t0 - SWIPE - .1);
    T('cap', 'Capacity vs. new', at('check', 'check') + .6, S('twist').t0 - SWIPE);
    T('val', '87%', at('why', '100%') + .25, S('twist').t0 - SWIPE);
    T('quote', '“can reduce its lifespan”', S('twist').t0 + .25, S('year').t0 - SWIPE);
    T('stored', 'STORED 1 YEAR · 77°F', at('year', 'room') + .1, S('heat').t0 - SWIPE);
    T('est', 'ESTIMATE · BATTERY UNIVERSITY', at('eighty', '80%') + .1, S('heat').t0 - SWIPE);
    T('v80', 'KEEPS 80%', wend('eighty', '80%') + .25, S('heat').t0 - SWIPE);
    T('v96', 'KEEPS 96%', at('forty', 'instead') + .32, S('heat').t0 - SWIPE);
    T('above', 'ABOVE 95°F', at('heat', '95') + .2, at('drain', 'draining') - .1);
    T('zero', 'DEEP DRAIN', at('drain', 'draining') - .08, S('limit').t0 - SWIPE);
    T('limit', 'CHARGE LIMIT', S('limit').t0 + .35, S('night').t0 - SWIPE);
    T('wait', 'CAN WAIT AT 80%', at('night', 'overnight') + .2, at('night', 'wake') + .3);
    T('box', 'my number: __%', at('end', 'so') + .08, HOME - .2);
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function initTimes() {
    var i;
    /* hook: a squeeze creak as the outline contracts */
    EV.push({ t: 0, type: 'squeeze', g: .7 }, { t: at('hook', 'shrinking') - .05, type: 'squeeze', g: 1 });
    EV.push({ t: CHIP_T - .02, type: 'pop', g: .7 });
    /* check: the phone rises, the battery drops into the screen */
    var c0 = at('check', 'check');
    EV.push({ t: c0 - .15, type: 'rise', t1: c0 + .45 }, { t: c0 + .68, type: 'clack' }, { t: at('check', 'settings') - .05, type: 'tick', g: .3 });
    /* why: the number rolls; WHY? */
    var b = at('why', 'below'), w0 = at('why', '100%') + .25;
    for (i = 0; i < 13; i++) EV.push({ t: b + (w0 - b) * eio((i + .5) / 13), type: 'tick', g: .14 });
    EV.push({ t: at('why', 'why') - .02, type: 'stamp', big: true });
    /* wipes: a pour */
    SC.forEach(function (sc) { if (sc.swipe) EV.push({ t: sc.t0 - SWIPE, type: 'pour', t1: sc.t0 }); });
    /* twist */
    EV.push({ t: at('twist', 'twist') - .03, type: 'stamp' }, { t: at('twist', 'sitting') + .15, type: 'thump', g: .45 }, { t: end('twist') + .04, type: 'squeeze', g: .6 });
    for (i = 0; i < 8; i++) { var tk = S('twist').t0 + .1 + i * .42, onW = LINE.twist.words.some(function (w) { return tk > w.t0 - .05 && tk < w.t0 + .12; }); if (!onW) EV.push({ t: tk, type: 'tick', g: .1 }); }
    /* year: the calendar flips, the cards */
    var fa = at('year', 'for') - .05, fb = wend('year', 'year') + .1;
    for (i = 1; i < 12; i++) EV.push({ t: fa + (fb - fa) * i / 11.999, type: 'flip' });
    EV.push({ t: at('year', 'year') - .03, type: 'slap' }, { t: at('year', 'room') - .1, type: 'paper' });
    EV.push({ t: at('eighty', '80%') - .1, type: 'squeeze', g: 1 }, { t: wend('eighty', '80%') + .2, type: 'ding1' });
    FIVEX = wend('forty', '96%') + .55; PULSE = FIVEX + .65;
    EV.push({ t: FIVEX - .02, type: 'stamp', big: true }, { t: PULSE, type: 'squeeze', g: .6 });
    EV.push({ t: at('forty', 'leave') - .05, type: 'swish' }, { t: at('forty', '40%') - .25, type: 'drop', g: 1.2 }, { t: at('forty', 'about') - .02, type: 'ding1', f: 1 });
    /* heat + drain */
    var ht = at('heat', 'heat');
    EV.push({ t: S('heat').t0 + .05, type: 'sizzle', t1: wend('heat', '95') + .2 }, { t: at('heat', '95') - .05, type: 'tick', g: .35 }, { t: at('heat', 'permanent') - .03, type: 'squeeze', g: 1 });
    EV.push({ t: at('drain', 'draining') - .3, type: 'swish' }, { t: at('drain', 'draining'), type: 'drainS', t1: wend('drain', 'zero') }, { t: at('drain', 'too') - .03, type: 'stamp' });
    /* limit: three phones, three 80 % chips */
    ['iphone', 'pixel', 'samsung'].forEach(function (w) { EV.push({ t: at('limit', w) - .2, type: 'drop', g: 1 }); });
    for (i = 0; i < 3; i++) EV.push({ t: at('limit', '80%') - .05 + i * .08, type: 'pop', g: .8 });
    EV.push({ t: at('limit', 'stop') - .05, type: 'slap' });
    /* night */
    var s0 = S('night').t0, wake = at('night', 'wake');
    for (i = 0; i < 8; i++) EV.push({ t: s0 + .1 + (wake - s0 - .1) * eio((i + .5) / 8), type: 'tick', g: .12 });
    EV.push({ t: at('night', 'wait') - .1, type: 'pop', g: .6 }, { t: wake + .02, type: 'alarm' }, { t: wake + .1, type: 'charge', t1: wake + .7 });
    /* end */
    var en = S('end').t0;
    EV.push({ t: at('end', 'health') - .03, type: 'tick', g: .3 }, { t: at('end', 'drop') - .1, type: 'pop', g: .7 }, { t: at('end', 'number') - .03, type: 'key' });
    EV.push({ t: HOME - .55, type: 'rise', t1: HOME + .05 }, { t: HOME + .05, type: 'squeeze', g: .6 });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
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
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.1), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .16; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }

    function tickS(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function ding1(t, hi) { osc('sine', mtof(hi ? 81 : 76), t, t + .7, 1, [[t, 0], [t + .005, .07], [t + .6, 0]], .4); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .26, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t - .12, t + .14, 900, 5200, .12, .02, 1.6); }
    function stampS(t, big) { thump(t, big ? .6 : .45); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1500; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .42 : .32], [t + .12, 0]]); tickS(t + .005, .18); }
    function paper(t, g) { g = g || 1; band(t - .03, t + .12, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .1, .08 * g); }
    function flip(t) { band(t - .02, t + .07, 2200, 4200, .05, .01, 1.4, (rnd() - .5) * .6); tickS(t + .05, .06); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function rise(t, t1) { band(t, t1, 400, 1800, .03, .06, 3); }
    function clack(t) { thump(t, .5); tickS(t, .4); tickS(t + .045, .25); }
    function drop(t, g) { thump(t, .22 * (g || 1)); osc('sine', mtof(g > 1.1 ? 64 : 71), t, t + .25, 1, [[t, 0], [t + .004, .05], [t + .2, 0]], .2); tickS(t, .14); }
    function slap(t) { thump(t, .45); var n = noise(t, .1), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 900; var o = bus(1, .15); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .3], [t + .08, 0]]); }
    function key(t) { tickS(t, .25); osc('sine', 1900, t, t + .03, 1, [[t, 0], [t + .002, .03], [t + .025, 0]]); }
    /* the squeeze: a low creak (a narrow band sliding down) over a soft knock */
    function squeeze(t, g) { g = g || 1; band(t, t + .32, 520, 210, .07 * g, .03 * g, 6); thump(t + .02, .25 * g); }
    /* the fill wipe: a short pour, a band rising like a level */
    function pour(t, t1) { band(t, t1 + .05, 300, 1500, .07, .05, 2.4); tickS(t1, .12); }
    function sizzle(t, t1) { band(t, t1, 5000, 7000, .025, .04, 1.2); }
    function drainS(t, t1) { osc('triangle', 520, t, t1 + .05, 1, [[t, 0], [t + .05, .05], [t1 - .05, .04], [t1 + .05, 0]], .1).frequency.exponentialRampToValueAtTime(110, t1); }
    function charge(t, t1) { osc('sine', 330, t, t1 + .2, 1, [[t, 0], [t + .05, .05], [t1, .04], [t1 + .2, 0]], .3).frequency.exponentialRampToValueAtTime(880, t1); }
    function alarmS(t) { for (var j = 0; j < 4; j++) { var u = t + j * .14; osc('square', 1760, u, u + .07, 1, [[u, 0], [u + .004, .018], [u + .06, 0]], .1); } }
    EV.forEach(function (e) {
      if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'ding1') ding1(e.t, e.f);
      else if (e.type === 'thump') thump(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'stamp') stampS(e.t, e.big);
      else if (e.type === 'paper') paper(e.t, e.g);
      else if (e.type === 'flip') flip(e.t);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'rise') rise(e.t, e.t1);
      else if (e.type === 'clack') clack(e.t);
      else if (e.type === 'drop') drop(e.t, e.g);
      else if (e.type === 'slap') slap(e.t);
      else if (e.type === 'key') key(e.t);
      else if (e.type === 'squeeze') squeeze(e.t, e.g);
      else if (e.type === 'pour') pour(e.t, e.t1);
      else if (e.type === 'sizzle') sizzle(e.t, e.t1);
      else if (e.type === 'drainS') drainS(e.t, e.t1);
      else if (e.type === 'charge') charge(e.t, e.t1);
      else if (e.type === 'alarm') alarmS(e.t);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −50 dB, so the loop seam is never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .021; })();
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”·→…#?‹'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initTimes();
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: at('forty', 'about') + .9, SLUG: 'battery', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  /* full pass of the safe-area check: every glyph box (and stamp) outside x 90–930 or below y 1450 */
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
