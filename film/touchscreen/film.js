/* "Your screen can't feel your finger" — a test film in the cutaway-explainer format (LESSONS.md), for Tech, explained.
   Studied from @scroll.engineer's Apple Watch reel: one calm narrator, one stylised world seen as a magnified cutaway,
   a camera that never stops drifting, one accent colour for the subject (the electric field, cyan) and one for trouble
   (amber: the glove, the water), karaoke captions in a dark pill, small dot chips and honesty tags.
   Narration first: every beat is keyed to a word time from vo/vo.js (window.VO) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t, samples, shutter, fps), READY, EV, TEXTS(t), SCORE(ctx). Sound: KIT.score. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur;
  var BG0 = '#1a2033', BG1 = '#0b0d15', CREAM = '#f2efe8', DIM = '#7d8396';
  var FIELD = '#5fe3ff', FIELD_RGB = '95,227,255', WARN = '#ffb547', WARN_RGB = '255,181,71';
  var SKIN = '#d9997a', SKIN_D = '#a8684f', SKIN_L = '#f0bfa0', NAIL = '#f1d2c4';
  var KNIT = '#8e919c', KNIT_D = '#5f626c', KNIT_L = '#b9bcc6';
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
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .8); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%+]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function start(id) { return LINE[id].t0; }
  function lend(id) { var ws = LINE[id].words; return ws[ws.length - 1].t1; }

  var K = {
    pressing: at('hook', 'pressing'), electricity: at('flip', 'pull'),
    gloves: start('gloves'), tap0: at('gloves', 'tap'), nothing: at('gloves', 'nothing'),
    ask: start('ask'), grid: start('grid'), wires: at('grid', 'wires'), gridW: at('grid', 'grid'),
    field: start('field'), crossing: at('field', 'crossing'), fieldW: at('field', 'field'), checks: at('field', 'checks'), hundred: at('field', 'hundred'),
    clever: start('clever'), finger: start('finger'), salty: at('finger', 'salty'), conducts: at('finger', 'conducts'),
    steal: start('steal'), close: at('steal', 'close'), pulls: at('steal', 'pulls'),
    find: start('find'), dropped: at('find', 'dropped'), center: at('find', 'center'), tap: at('find', 'tap'),
    wool: start('wool'), woolC: at('wool', 'conduct'), woolN: at('wool', 'nothing'),
    caught: start('catch'), water: at('catch', 'water'), rain: start('rain'), rainTap: at('rain', 'tap'),
    recap: start('recap'), push: at('recap', 'push'), you: at('recap', 'you'), end: start('end')
  };

  /* ---------- canvas plumbing ---------- */
  var cv, ctx, tmp, tctx, acc, actx, REC = null, NOREC = false;
  var LIVE = { text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function font(g, f) { g.font = f; try { g.fontStretch = 'normal'; } catch (e) { /* older canvas */ } }
  function rec(text) { if (REC && !NOREC) REC[text] = 1; }

  /* ---------- background: navy with a slow floating dust layer (never a still frame) ---------- */
  var DUST = (function () { var r = mulberry(11), a = []; for (var i = 0; i < 60; i++) a.push({ x: r() * W, y: r() * H, s: .6 + r() * 2.2, v: 6 + r() * 16, p: r() * 6.28 }); return a; })();
  function bg(g, t, tint) {
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, tint || BG0); gr.addColorStop(1, BG1);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'lighter';
    DUST.forEach(function (d) {
      var y = (d.y - t * d.v + H * 4) % H, x = d.x + Math.sin(t * .4 + d.p) * 14;
      g.fillStyle = 'rgba(160,180,230,' + (.05 + .05 * Math.sin(t + d.p)) + ')'; g.beginPath(); g.arc(x, y, d.s, 0, 6.283); g.fill();
    });
    g.restore();
  }
  function vignette(g) {
    var r = g.createRadialGradient(W / 2, H * .45, H * .2, W / 2, H * .45, H * .75);
    r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.55)');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
  }
  function cam(g, x, y, s, rot) { g.translate(W / 2, H / 2); if (rot) g.rotate(rot); g.scale(s, s); g.translate(-x, -y); }

  /* ---------- the finger (side view, pad down) ---------- */
  function finger(g, x, tipY, o) {
    o = o || {}; var w = 200, len = 1600, glove = o.glove;
    g.save(); g.translate(x, tipY); g.rotate(o.rot || 0);
    var gr = g.createLinearGradient(-w / 2, 0, w / 2, 0);
    if (glove) { gr.addColorStop(0, KNIT_D); gr.addColorStop(.45, KNIT_L); gr.addColorStop(1, KNIT_D); }
    else { gr.addColorStop(0, SKIN_D); gr.addColorStop(.42, SKIN_L); gr.addColorStop(1, SKIN_D); }
    g.fillStyle = gr; g.beginPath();
    g.moveTo(-w / 2, -len); g.lineTo(-w / 2, -w * .5); g.bezierCurveTo(-w / 2, w * .02, -w * .22, 0, 0, 0);
    g.bezierCurveTo(w * .22, 0, w / 2, w * .02, w / 2, -w * .5); g.lineTo(w / 2, -len); g.closePath(); g.fill();
    if (glove) {
      /* knit: rows of small V stitches */
      g.save(); g.clip(); g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 4;
      for (var yy = -10; yy > -900; yy -= 26) for (var xx = -w / 2 - 10; xx < w / 2 + 10; xx += 24) { g.beginPath(); g.moveTo(xx, yy - 18); g.lineTo(xx + 12, yy); g.lineTo(xx + 24, yy - 18); g.stroke(); }
      g.restore();
    } else {
      /* nail on the back (right side), knuckle crease */
      g.fillStyle = NAIL; g.globalAlpha = .55; g.beginPath(); g.ellipse(w * .36, -w * .55, w * .1, w * .32, 0, 0, 6.283); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = 'rgba(120,60,40,.35)'; g.lineWidth = 3;
      for (var k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-w * .5, -560 - k * 14); g.quadraticCurveTo(-w * .1, -548 - k * 14, w * .2, -560 - k * 14); g.stroke(); }
    }
    /* ions inside: the salty water that conducts */
    if (o.ions > 0) {
      g.save(); g.globalAlpha = o.ions; font(g, '700 30px ' + DISP); g.textAlign = 'center'; g.textBaseline = 'middle';
      var r = mulberry(5);
      for (var i = 0; i < 16; i++) {
        var ix = (r() - .5) * w * .7, iy = -40 - r() * 520, ph = r() * 6.28, pl = i % 2;
        ix += Math.sin(o.t * 1.3 + ph) * 12; iy += Math.cos(o.t * 1.1 + ph) * 12;
        g.fillStyle = 'rgba(' + FIELD_RGB + ',.22)'; g.beginPath(); g.arc(ix, iy, 19, 0, 6.283); g.fill();
        g.fillStyle = FIELD; g.fillText(pl ? '+' : '−', ix, iy + 1);
      }
      g.restore();
    }
    g.restore();
  }

  /* ---------- side cutaway: glass, electrode layer, display, frame ---------- */
  var COLS = []; for (var ci = -6; ci <= 6; ci++) COLS.push(ci * 120);
  var GLASS_T = 0, GLASS_B = 80, ELEC = 92;
  function section(g, t, o) {
    /* o: fx, fy (finger tip y), fingerOn, glove, ions, field (0..1 overall), steal (0..1), wet */
    var x0 = -700, x1 = 700;
    /* frame / battery */
    var gb = g.createLinearGradient(0, 160, 0, 420); gb.addColorStop(0, '#2b3142'); gb.addColorStop(1, '#141824');
    g.fillStyle = gb; g.fillRect(x0, 160, x1 - x0, 260);
    g.fillStyle = '#394055'; for (var i = 0; i < 6; i++) g.fillRect(-560 + i * 200, 200, 120, 44);
    g.fillStyle = '#4a5166'; for (i = 0; i < 24; i++) g.fillRect(-600 + i * 52, 262, 22, 8);
    /* display: pixels glowing */
    g.fillStyle = '#0f1220'; g.fillRect(x0, 112, x1 - x0, 48);
    var cols3 = ['#ff4d5e', '#3cff8a', '#4d7dff'];
    for (i = 0; i < 70; i++) { var px = x0 + i * 20; g.fillStyle = cols3[i % 3]; g.globalAlpha = .18 + .1 * Math.sin(t * 2 + i * .7); g.fillRect(px + 3, 122, 12, 26); }
    g.globalAlpha = 1;
    /* electrode layer: one row electrode running across, column electrodes in section */
    g.fillStyle = 'rgba(150,175,215,.35)'; g.fillRect(x0, ELEC, x1 - x0, 8);
    COLS.forEach(function (cx) { g.fillStyle = 'rgba(190,210,240,.55)'; g.fillRect(cx - 34, ELEC - 8, 68, 8); });
    /* glass */
    var gg = g.createLinearGradient(0, GLASS_T, 0, GLASS_B); gg.addColorStop(0, 'rgba(190,215,255,.30)'); gg.addColorStop(1, 'rgba(150,180,230,.14)');
    g.fillStyle = gg; g.fillRect(x0, GLASS_T, x1 - x0, GLASS_B - GLASS_T);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x0, GLASS_T, x1 - x0, 3);
    /* moving glints in the glass */
    g.save(); g.globalCompositeOperation = 'lighter';
    for (i = 0; i < 3; i++) { var gx = ((t * 90 + i * 520) % 1600) - 800; var lg = g.createLinearGradient(gx - 80, 0, gx + 80, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(255,255,255,.10)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(gx - 80, GLASS_T, 160, GLASS_B); }
    g.restore();
    /* a bare finger is drawn under the field, so the lines it pulls visibly run into the fingertip; a glove covers them */
    if (o.fingerOn && !o.glove) finger(g, o.fx, o.fy, { ions: o.ions || 0, t: t });
    /* field arcs at each crossing */
    var F = o.field == null ? 1 : o.field;
    if (F > 0) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      COLS.forEach(function (cx) {
        var near = o.fingerOn ? Math.exp(-Math.pow((cx - o.fx) / 150, 2)) : 0;
        var gap = o.fingerOn ? Math.max(0, GLASS_T - o.fy) : 999;       /* finger tip above the glass top */
        var pull = (o.glove ? 0 : 1) * near * (o.steal || 0) * clamp(1 - gap / 260, 0, 1), tx = o.fx, ty = o.fy;
        if (o.drop && o.drop.k > 0) { var dn = Math.exp(-Math.pow((cx - o.drop.x) / 130, 2)) * o.drop.k; if (dn > pull) { pull = dn; tx = o.drop.x; ty = GLASS_T - o.drop.r * .7; } }
        [70, 120, 175].forEach(function (h, k) {
          var a0 = cx - 18 - k * 14, a1 = cx + 18 + k * 14, top = ELEC - h;
          var take = pull * (k === 0 ? .35 : 1);                         /* the outer lines reach the finger first */
          var apexY = lerp(top, Math.min(top, ty + 4), take), apexX = lerp(cx, tx, take * .5);
          var alpha = F * (.32 + .18 * Math.sin(t * 3 - k + cx * .01)) * (1 - take * .2);
          g.strokeStyle = 'rgba(' + FIELD_RGB + ',' + (alpha * .35) + ')'; g.lineWidth = 14;
          g.beginPath(); g.moveTo(a0, ELEC); g.bezierCurveTo(a0, apexY, apexX, apexY, apexX, apexY); g.bezierCurveTo(apexX, apexY, a1, apexY, a1, ELEC); g.stroke();
          g.strokeStyle = 'rgba(' + FIELD_RGB + ',' + alpha + ')'; g.lineWidth = 4;
          g.setLineDash([16, 18]); g.lineDashOffset = -t * 60 - k * 7;
          g.stroke(); g.setLineDash([]);
        });
        /* the crossing node: bright when its field is whole, dim when the finger took some */
        var lost = pull * .55;
        g.fillStyle = 'rgba(' + FIELD_RGB + ',' + (F * (1 - lost) * .9) + ')'; g.beginPath(); g.arc(cx, ELEC + 4, 9, 0, 6.283); g.fill();
        g.fillStyle = 'rgba(' + FIELD_RGB + ',' + (F * (1 - lost) * .22) + ')'; g.beginPath(); g.arc(cx, ELEC + 4, 26, 0, 6.283); g.fill();
      });
      g.restore();
    }
    /* wet: drops sitting on the glass */
    if (o.drop && o.drop.a > 0) drop(g, o.drop.x, o.drop.y == null ? GLASS_T : o.drop.y, o.drop.r, o.drop.a);
    /* the hatched cut face along the front edge of the glass and frame */
    g.save(); g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2;
    for (i = -40; i < 40; i++) { g.beginPath(); g.moveTo(i * 30, 420); g.lineTo(i * 30 + 30, 450); g.stroke(); }
    g.fillStyle = '#0d1019'; g.fillRect(x0, 420, x1 - x0, 40);
    g.restore();
    if (o.fingerOn && o.glove) finger(g, o.fx, o.fy, { glove: true, t: t });
  }
  function drop(g, x, y, r, a) {
    g.save(); g.globalAlpha = a;
    var gr = g.createRadialGradient(x - r * .3, y - r * .6, r * .1, x, y - r * .3, r * 1.1);
    gr.addColorStop(0, 'rgba(230,245,255,.75)'); gr.addColorStop(1, 'rgba(120,170,230,.25)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y - r * .42, r, r * .5, 0, Math.PI, 0); g.lineTo(x + r, y); g.lineTo(x - r, y); g.fill();
    g.strokeStyle = 'rgba(' + WARN_RGB + ',.9)'; g.lineWidth = 4; g.beginPath(); g.ellipse(x, y - r * .42, r, r * .5, 0, Math.PI, 0); g.stroke();
    g.restore();
  }

  /* ---------- top-down electrode grid in perspective ---------- */
  var GC = 9, GR = 15, SP = 92;
  function gridPt(i, j, tilt) {      /* i: column 0..GC-1, j: row 0..GR-1 → screen-space point relative to the grid centre */
    var gx = (i - (GC - 1) / 2) * SP, gy = (j - (GR - 1) / 2) * SP;
    var d = 1 - gy / 2600 * tilt;      /* rows further up the frame recede */
    return { x: gx / d, y: gy / d * (1 - tilt * .25), s: 1 / d };
  }
  function gp(fx, fy, tilt) { return gridPt(fx, fy, tilt); }
  function grid(g, t, o) {
    /* o: tilt, drop(i,j) → 0..1 lost field, scan, glow, labels */
    var tilt = o.tilt || 0, i, j, p, q;
    g.save(); g.lineCap = 'round';
    /* glass plate */
    var a = gridPt(-.8, -.8, tilt), b = gridPt(GC - .2, -.8, tilt), c = gridPt(GC - .2, GR - .2, tilt), d = gridPt(-.8, GR - .2, tilt);
    g.fillStyle = 'rgba(120,150,210,.08)'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(200,220,255,.25)'; g.lineWidth = 2; g.stroke();
    /* rows (drive) and columns (sense) */
    var sc = o.scan ? Math.floor(t * 40) % GR : -1;
    for (j = 0; j < GR; j++) {
      p = gridPt(0, j, tilt); q = gridPt(GC - 1, j, tilt);
      var hot = j === sc;
      g.strokeStyle = hot ? 'rgba(' + FIELD_RGB + ',.85)' : 'rgba(150,180,230,' + (.28 * (o.glow == null ? 1 : o.glow)) + ')'; g.lineWidth = hot ? 6 : 4;
      g.beginPath(); g.moveTo(p.x - 40 * p.s, p.y); g.lineTo(q.x + 40 * q.s, q.y); g.stroke();
    }
    for (i = 0; i < GC; i++) {
      p = gridPt(i, 0, tilt); q = gridPt(i, GR - 1, tilt);
      g.strokeStyle = 'rgba(210,225,255,' + (.22 * (o.glow == null ? 1 : o.glow)) + ')'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(p.x, p.y - 40 * p.s); g.lineTo(q.x, q.y + 40 * q.s); g.stroke();
    }
    /* crossings */
    g.globalCompositeOperation = 'lighter';
    var lit = o.lit == null ? 1 : o.lit;
    for (j = 0; j < GR; j++) for (i = 0; i < GC; i++) {
      p = gridPt(i, j, tilt);
      var wave = o.wave != null ? clamp((o.wave - (i + j) * .045) * 5, 0, 1) : 1;
      var lost = o.drop ? o.drop(i, j) : 0, hot = j === sc;
      var br = lit * wave * (1 - lost * .85) * (hot ? 1 : .7 + .15 * Math.sin(t * 2.4 + i * .9 + j * .6));
      if (br <= .01) continue;
      g.fillStyle = 'rgba(' + FIELD_RGB + ',' + (br * .18) + ')'; g.beginPath(); g.arc(p.x, p.y, 30 * p.s, 0, 6.283); g.fill();
      g.fillStyle = 'rgba(' + FIELD_RGB + ',' + (br * .95) + ')'; g.beginPath(); g.arc(p.x, p.y, 8 * p.s, 0, 6.283); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    /* dropped crossings get a white ring */
    if (o.drop && o.rings) for (j = 0; j < GR; j++) for (i = 0; i < GC; i++) {
      var l2 = o.drop(i, j); if (l2 < .25) continue; p = gridPt(i, j, tilt);
      g.strokeStyle = o.ringCol ? 'rgba(' + o.ringCol + ',' + (o.rings * l2) + ')' : 'rgba(255,255,255,' + (o.rings * l2) + ')'; g.lineWidth = 3;
      g.beginPath(); g.arc(p.x, p.y, 22 * p.s, 0, 6.283); g.stroke();
    }
    g.restore();
  }
  function crosshair(g, x, y, s, a, col, t) {
    g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 4; g.translate(x, y); g.scale(s, s); g.rotate(t * .6);
    for (var k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(26, 0); g.lineTo(58, 0); g.stroke(); }
    g.beginPath(); g.arc(0, 0, 40, 0, 6.283); g.globalAlpha = a * .7; g.stroke();
    g.restore();
  }

  /* ---------- phone, front view, slight 3D ---------- */
  var APPS = ['#3b4a6b', '#46506a', '#3b5466', '#4a4a66', '#3f4f63', '#3b5f6b', '#48566e', '#40536a', '#3b3f6b', '#4b5068', '#3f5a6a', '#455268'];
  function phone(g, t, o) {
    /* o: open (app index, k), screenText, ripple {x,y,k,col} */
    var pw = 560, ph = 1140, r = 86;
    g.save();
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.roundRect(-pw / 2 + 26, -ph / 2 + 40, pw, ph, r); g.fill();
    var fr = g.createLinearGradient(-pw / 2, 0, pw / 2, 0); fr.addColorStop(0, '#3d4356'); fr.addColorStop(.5, '#80889d'); fr.addColorStop(1, '#2d3242');
    g.fillStyle = fr; g.beginPath(); g.roundRect(-pw / 2 - 10, -ph / 2 - 10, pw + 20, ph + 20, r + 8); g.fill();
    g.fillStyle = '#05060a'; g.beginPath(); g.roundRect(-pw / 2, -ph / 2, pw, ph, r); g.fill();
    g.save(); g.beginPath(); g.roundRect(-pw / 2 + 18, -ph / 2 + 18, pw - 36, ph - 36, r - 16); g.clip();
    var sg = g.createLinearGradient(0, -ph / 2, 0, ph / 2); sg.addColorStop(0, '#22304f'); sg.addColorStop(1, '#141a2c'); g.fillStyle = sg; g.fillRect(-pw / 2, -ph / 2, pw, ph);
    if (o.screenText) o.screenText(g);
    else {
      for (var k = 0; k < 12; k++) {
        var ax = -165 + (k % 4) * 110, ay = -360 + Math.floor(k / 4) * 130;
        g.fillStyle = APPS[k]; g.beginPath(); g.roundRect(ax - 38, ay - 38, 76, 76, 20); g.fill();
        g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(ax, ay, 16, 0, 6.283); g.fill();
      }
      if (o.open) o.open.forEach(function (op) {
        if (op.k <= 0) return; var ax = -165 + (op.i % 4) * 110, ay = -360 + Math.floor(op.i / 4) * 130, e = eout(clamp(op.k, 0, 1));
        g.fillStyle = APPS[op.i]; g.globalAlpha = op.a == null ? 1 : op.a;
        g.beginPath(); g.roundRect(lerp(ax - 38, -pw / 2, e), lerp(ay - 38, -ph / 2, e), lerp(76, pw, e), lerp(76, ph, e), lerp(20, r, e)); g.fill();
        if (o.ghostEdge) { g.strokeStyle = WARN; g.lineWidth = 10; g.stroke(); font(g, '700 54px ' + DISP); g.textAlign = 'center'; g.fillStyle = WARN; NOREC = true; if (e > .6) g.fillText('opened itself', 0, 0); NOREC = false; g.textAlign = 'left'; }
        g.globalAlpha = 1;
      });
      /* dock */
      g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(-230, 380, 460, 120, 40); g.fill();
    }
    if (o.ripple) o.ripple.forEach(function (rp) { if (rp.k <= 0 || rp.k >= 1) return; g.strokeStyle = 'rgba(' + rp.col + ',' + (1 - rp.k) + ')'; g.lineWidth = 6; g.beginPath(); g.arc(rp.x, rp.y, 20 + rp.k * 160, 0, 6.283); g.stroke(); });
    if (o.drops) o.drops.forEach(function (d) { drop(g, d.x, d.y, d.r, d.a); });
    /* glass sheen */
    var sh = g.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2); sh.addColorStop(0, 'rgba(255,255,255,.10)'); sh.addColorStop(.35, 'rgba(255,255,255,0)'); sh.addColorStop(.6, 'rgba(255,255,255,.05)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sh; g.fillRect(-pw / 2, -ph / 2, pw, ph);
    g.restore();
    g.fillStyle = '#000'; g.beginPath(); g.roundRect(-70, -ph / 2 + 34, 140, 40, 20); g.fill();
    g.restore();
  }
  /* a finger seen at an angle from the front: a capsule coming from below-right */
  function frontFinger(g, x, y, ang, o) {
    o = o || {}; g.save(); g.translate(x, y); g.rotate(ang);
    var w = 120, gr = g.createLinearGradient(-w / 2, 0, w / 2, 0);
    if (o.glove) { gr.addColorStop(0, KNIT_D); gr.addColorStop(.5, KNIT_L); gr.addColorStop(1, KNIT_D); } else { gr.addColorStop(0, SKIN_D); gr.addColorStop(.45, SKIN_L); gr.addColorStop(1, SKIN_D); }
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.roundRect(-w / 2 + 18, 24, w, 1100, w / 2); g.fill();
    g.fillStyle = gr; g.beginPath(); g.roundRect(-w / 2, 0, w, 1100, w / 2); g.fill();
    if (o.glove) { g.save(); g.clip(); g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 4; for (var yy = 20; yy < 1100; yy += 24) for (var xx = -w / 2 - 10; xx < w / 2; xx += 22) { g.beginPath(); g.moveTo(xx, yy - 16); g.lineTo(xx + 11, yy); g.lineTo(xx + 22, yy - 16); g.stroke(); } g.restore();
      g.fillStyle = KNIT_D; g.fillRect(-w / 2 - 30, 420, w + 60, 1000); }
    else { g.fillStyle = NAIL; g.globalAlpha = .6; g.beginPath(); g.roundRect(-w * .3, 16, w * .6, 120, 30); g.fill(); g.globalAlpha = 1; }
    g.restore();
  }
  var SNOW = (function () { var r = mulberry(21), a = []; for (var i = 0; i < 80; i++) a.push({ x: r() * W, y: r() * H, s: 2 + r() * 6, v: 60 + r() * 120, p: r() * 6.28 }); return a; })();
  function snow(g, t, a) {
    g.save(); g.fillStyle = 'rgba(235,240,255,' + a + ')';
    SNOW.forEach(function (s) { var y = (s.y + t * s.v) % (H + 40) - 20, x = s.x + Math.sin(t * .8 + s.p) * 30; g.beginPath(); g.arc(x, y, s.s, 0, 6.283); g.fill(); });
    g.restore();
  }
  var RAIN = (function () { var r = mulberry(31), a = []; for (var i = 0; i < 70; i++) a.push({ x: r() * W, y: r() * H, l: 40 + r() * 70, v: 900 + r() * 700 }); return a; })();
  function rain(g, t, a) {
    g.save(); g.strokeStyle = 'rgba(170,200,255,' + a * .35 + ')'; g.lineWidth = 3;
    RAIN.forEach(function (s) { var y = (s.y + t * s.v) % (H + 200) - 100, x = s.x - (y * .12) % W; g.beginPath(); g.moveTo(x, y); g.lineTo(x - s.l * .12, y + s.l); g.stroke(); });
    g.restore();
  }

  /* ---------- overlays: chips, honesty tags, karaoke captions ---------- */
  function chip(g, text, x, y, a, o) {
    /* "● LABEL" in a dark pill, with an optional leader line to (o.lx, o.ly) */
    if (a <= 0) return; o = o || {}; rec(text);
    g.save(); g.globalAlpha = clamp(a, 0, 1); font(g, '600 36px ' + MONO); g.textBaseline = 'middle';
    var tw = g.measureText(text).width, pw = tw + 80, ph = 66, x0 = o.right ? x - pw : x;
    if (o.lx != null) { g.strokeStyle = 'rgba(242,239,232,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(o.right ? x0 + pw : x0, y); g.lineTo(o.lx, o.ly); g.stroke(); g.fillStyle = CREAM; g.beginPath(); g.arc(o.lx, o.ly, 6, 0, 6.283); g.fill(); }
    g.fillStyle = 'rgba(10,12,20,.82)'; g.beginPath(); g.roundRect(x0, y - ph / 2, pw, ph, ph / 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = o.col || FIELD; g.beginPath(); g.arc(x0 + 32, y, 9, 0, 6.283); g.fill();
    g.fillStyle = CREAM; g.fillText(text, x0 + 54, y + 1);
    g.restore();
  }
  function tag(g, text, a, y) {
    y = y || 1262;      /* honesty tag, bottom left above the captions */
    if (a <= 0) return; rec(text);
    g.save(); g.globalAlpha = a; font(g, '500 28px ' + MONO); g.textBaseline = 'middle';
    var tw = g.measureText(text).width;
    g.fillStyle = 'rgba(10,12,20,.6)'; g.beginPath(); g.roundRect(60, y, tw + 40, 52, 26); g.fill();
    g.fillStyle = 'rgba(242,239,232,.85)'; g.fillText(text, 80, y + 27);
    g.restore();
  }
  function fade(t, a, b, d) { d = d || .25; return Math.min(seg(t, a, a + d), 1 - seg(t, b - d, b)); }

  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        cur.push(w);
        var last = i === ws.length - 1, punct = /[.,?!]$/.test(w.w);
        if (!last && (punct ? cur.length >= 2 : cur.length >= 4) && ws.length - 1 - i >= 1) {
          if (!(punct && cur.length < 2)) { out.push(cur); cur = []; }
        }
      });
      if (cur.length) { if (cur.length === 1 && out.length && out[out.length - 1].length <= 3 && out[out.length - 1][0].t0 >= l.t0) out[out.length - 1] = out[out.length - 1].concat(cur); else out.push(cur); }
    });
    return out.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS = { pressing: 1, pull: 1, gloves: 1, sensing: 1, grid: 1, hundred: 1, clever: 1, salty: 1, pulls: 1, center: 1, wool: 1, water: 1, rain: 1, you: 1 };
  function captions(g, t) {
    var c = null, ci = -1;
    CAPS.forEach(function (x, i) { if (t >= x.t0 - .06) { c = x; ci = i; } });
    if (!c) return;
    var nx = CAPS[ci + 1], hide = nx ? Math.min(nx.t0 - .06, c.t1 + .6) : c.t1 + 1.2;
    if (t > hide) return;
    var a = seg(t, c.t0 - .06, c.t0 + .06);
    g.save(); g.globalAlpha = a; NOREC = true;
    font(g, '700 64px ' + DISP); g.textBaseline = 'alphabetic';
    var gap = 18, ws = c.words.map(function (w) { return g.measureText(w.w).width; }), tw = ws.reduce(function (s, v) { return s + v; }, 0) + gap * (ws.length - 1);
    var sc = Math.min(1, 900 / tw); g.translate(W / 2, 1390); g.scale(sc, sc);
    var pw = tw + 64, ph = 104, rise = (1 - clamp(sp(t, c.t0 - .06, 3.2, .8), 0, 1)) * 14;
    g.translate(0, rise);
    g.fillStyle = 'rgba(12,14,22,.80)'; g.beginPath(); g.roundRect(-pw / 2, -ph / 2, pw, ph, 22); g.fill();
    var x = -tw / 2;
    c.words.forEach(function (w, i) {
      var said = t >= w.t0 - .03, now = said && (i === c.words.length - 1 ? t < w.t1 + .25 : t < c.words[i + 1].t0 - .03);
      g.fillStyle = said ? CREAM : DIM; g.fillText(w.w, x, 22);
      if (said && STRESS[norm(w.w)]) { g.fillStyle = FIELD; g.fillRect(x, 34, ws[i], 6); }
      x += ws[i] + gap;
    });
    NOREC = false; g.restore();
  }

  /* ---------- shots: hard cuts on line starts, a dissolve into the grid ---------- */
  var SHOTS = [
    { id: 'press', t0: 0, name: 'Pressing' },
    { id: 'glove', t0: K.gloves - .08, name: 'Gloves' },
    { id: 'dive', t0: K.ask - .08, name: 'Into the glass' },
    { id: 'grid', t0: K.grid - .08, name: 'The grid' },
    { id: 'count', t0: at('field', 'phone') - .25, name: '100+ a second' },
    { id: 'finger', t0: K.clever - .08, name: 'Salty water' },
    { id: 'steal', t0: K.steal - .08, name: 'It pulls the field' },
    { id: 'locate', t0: K.find - .08, name: 'Your tap' },
    { id: 'wool', t0: K.wool - .08, name: 'Wool' },
    { id: 'wet', t0: K.caught - .08, name: 'Water' },
    { id: 'ghost', t0: K.rain - .08, name: 'Ghost taps' },
    { id: 'recap', t0: K.recap - .08, name: 'It feels you' },
    { id: 'end', t0: K.end - .08, name: 'Rain?' }
  ];
  SHOTS.forEach(function (s, i) { s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : DUR; });
  function shotAt(t) { var s = SHOTS[0]; SHOTS.forEach(function (x) { if (t >= x.t0) s = x; }); return s; }
  var DISSOLVE = .4;   /* the dive dissolves into the grid; every other change is a hard cut */

  var DRAW = {
    press: function (g, t, s) {
      bg(g, t);
      var k = seg(t, s.t0, s.t1), down = eout(seg(t, 0, K.pressing + .1));
      var tip = lerp(-520, GLASS_T, down) + (t > K.pressing ? Math.sin((t - K.pressing) * 7) * 3 : 0);
      var fieldOn = seg(t, K.electricity - .25, K.electricity + .25);
      g.save(); cam(g, lerp(-40, 0, k), lerp(-60, 90, eio(k)), lerp(1.45, 1.12, eio(k)));
      section(g, t, { fingerOn: true, fx: 0, fy: tip, field: .12 + .88 * fieldOn, steal: fieldOn, ions: 0 });
      /* pressure arrows: the push that is ignored */
      var pa = fade(t, K.pressing - .3, K.electricity - .1);
      if (pa > 0) {
        g.save(); g.globalAlpha = pa; g.strokeStyle = 'rgba(242,239,232,.85)'; g.lineWidth = 8; g.lineCap = 'round';
        for (var i = -1; i <= 1; i++) { var ox = i * 70, oy = -300 + ((t * 160 + i * 40) % 90); g.beginPath(); g.moveTo(ox - 22, oy - 20); g.lineTo(ox, oy); g.lineTo(ox + 22, oy - 20); g.stroke(); }
        g.restore();
      }
      g.restore();
      vignette(g);
      chip(g, 'PUSH: IGNORED', 120, 560, fade(t, .1, K.electricity - .05, .15), { col: WARN, lx: 470, ly: 760 });
      chip(g, 'FIELD', 920, 560, seg(t, K.electricity - .2, K.electricity + .05), { right: true, lx: 640, ly: 800 });
      var ly = function (wy) { var k2 = seg(t, s.t0, s.t1); return 960 + (wy - lerp(-60, 90, eio(k2))) * lerp(1.45, 1.12, eio(k2)); };
      var la = seg(t, .5, .8);
      chip(g, 'GLASS', 920, ly(40) - 120, la, { right: true, col: CREAM });
      chip(g, 'WIRE GRID', 920, ly(92) + 40, la, { right: true });
      tag(g, 'Phone screen, magnified', 1);
    },
    glove: function (g, t, s) {
      bg(g, t, '#202a40'); snow(g, t, .5);
      var k = seg(t, s.t0, s.t1);
      g.save(); cam(g, 0, 0, lerp(1.0, 1.1, eio(k)), lerp(-.04, -.01, k));
      var tapK = sp(t, K.tap0 - .3, 2.2, .7), tx = 60, ty = -40;
      var ring = (t - K.tap0) / .7;
      phone(g, t, { ripple: [{ x: tx, y: ty, k: ring, col: WARN_RGB }, { x: tx, y: ty, k: (t - K.tap0 - .5) / .7, col: WARN_RGB }] });
      var fy = lerp(560, ty, clamp(tapK, 0, 1)) + (t > K.tap0 + .6 ? Math.min(1, (t - K.tap0 - .6) * 2) * 180 * (1 + Math.sin(t * 9) * .05) : 0);
      frontFinger(g, tx + 40, fy, -.32, { glove: true });
      /* the "nothing" mark on the screen */
      var nk = seg(t, K.nothing - .1, K.nothing + .15);
      if (nk > 0) { g.save(); g.globalAlpha = nk; g.strokeStyle = WARN; g.lineWidth = 12; g.lineCap = 'round'; g.translate(tx, ty - 260); g.scale(.6 + .4 * eout(nk), .6 + .4 * eout(nk)); g.beginPath(); g.moveTo(-40, -40); g.lineTo(40, 40); g.moveTo(40, -40); g.lineTo(-40, 40); g.stroke(); g.restore(); }
      g.restore(); vignette(g);
      chip(g, 'KNIT GLOVE', 100, 1170, seg(t, s.t0 + .3, s.t0 + .6), { col: WARN, lx: 470, ly: 1130 });
    },
    dive: function (g, t, s) {
      bg(g, t);
      var k = eio(seg(t, s.t0 + .6, s.t1 + DISSOLVE));
      g.save(); cam(g, 0, lerp(0, -40, k), lerp(1.0, 7, k * k));
      phone(g, t, {});
      g.restore();
      /* the grid shows through as the camera reaches the glass */
      var gk = seg(t, s.t1 - .7, s.t1 + DISSOLVE);
      if (gk > 0) { g.save(); g.globalAlpha = gk * .8; g.translate(W / 2, H * .46); g.scale(lerp(2.2, 1.6, gk), lerp(2.2, 1.6, gk)); grid(g, t, { tilt: .2, glow: 1, lit: 0 }); g.restore(); }
      vignette(g);
    },
    grid: function (g, t, s) {
      bg(g, t, '#151b2c');
      var k = seg(t, s.t0, s.t1);
      g.save(); g.translate(W / 2, H * .46 + lerp(30, -20, k)); g.rotate(lerp(.05, -.03, eio(k))); var sc = lerp(1.15, .92, eio(k)); g.scale(sc, sc);
      grid(g, t, { tilt: lerp(.2, .9, eio(k)), wave: (t - K.crossing + .2) * 1.2, scan: t > K.fieldW + .3, glow: .4 + .6 * seg(t, K.gridW - .2, K.gridW + .3) });
      g.restore(); vignette(g);
      var la = seg(t, K.gridW, K.gridW + .3);
      chip(g, 'ROW WIRES', 90, 360, la, { lx: 330, ly: 520 });
      chip(g, 'COLUMN WIRES', 920, 1120, la, { right: true, lx: 620, ly: 1050 });
      chip(g, 'TINY FIELD', 140, 1110, seg(t, K.crossing, K.crossing + .25));
      tag(g, 'Src: Densitron, Renesas', seg(t, K.fieldW, K.fieldW + .2), 1200);
      tag(g, 'Magnified illustration', 1);
    },
    count: function (g, t, s) {
      bg(g, t, '#202a40');
      var k = seg(t, s.t0, s.t1);
      g.save(); cam(g, 0, -80, lerp(1.45, 1.6, eio(k)), lerp(.03, -.02, k));
      var n = Math.round(eout(seg(t, s.t0 + .05, s.t0 + .45)) * 100);
      phone(g, t, {
        screenText: function (gg) {
          /* the scan bar sweeping the screen */
          for (var r = 0; r < 3; r++) { var y = ((t * 2200 + r * 380) % 1140) - 570; gg.fillStyle = 'rgba(' + FIELD_RGB + ',.10)'; gg.fillRect(-300, y - 30, 600, 60); gg.fillStyle = 'rgba(' + FIELD_RGB + ',.55)'; gg.fillRect(-300, y - 2, 600, 4); }
          font(gg, '900 180px ' + DISP); gg.textAlign = 'center'; gg.textBaseline = 'alphabetic'; gg.fillStyle = CREAM;
          NOREC = true; gg.fillText(String(n) + (n >= 100 ? '+' : ''), 0, -40); NOREC = false;
          if (n >= 100) { font(gg, '600 38px ' + MONO); gg.fillStyle = FIELD; rec('SCANS A SECOND'); gg.fillText('SCANS A SECOND', 0, 30); }
        }
      });
      g.restore(); vignette(g);
      tag(g, 'Often 120–240/s', seg(t, s.t0 + .3, s.t0 + .45));
      tag(g, 'Src: Densitron, Renesas', seg(t, s.t0 + .3, s.t0 + .45), 1200);
    },
    finger: function (g, t, s) {
      bg(g, t);
      var k = seg(t, s.t0, s.t1);
      var tip = lerp(-560, -380, eio(k)) + Math.sin(t * 2) * 8;
      g.save(); cam(g, lerp(60, 0, eio(k)), lerp(-200, -110, eio(k)), lerp(1.5, 1.35, eio(k)));
      section(g, t, { fingerOn: true, fx: 0, fy: tip, field: 1, steal: 0, ions: seg(t, K.salty - .2, K.salty + .3) });
      g.restore(); vignette(g);
      chip(g, 'SALTY WATER', 90, 360, seg(t, K.finger, K.finger + .25), { lx: 470, ly: 560 });
      tag(g, 'Magnified illustration', 1);
    },
    steal: function (g, t, s) {
      bg(g, t);
      var k = seg(t, s.t0, s.t1), down = eio(seg(t, s.t0, K.pulls + .4));
      var tip = lerp(-380, -14, down);
      var st = seg(t, K.pulls - .3, K.pulls + .6);
      g.save(); cam(g, 0, lerp(-40, 30, eio(k)), lerp(1.9, 2.15, eio(k)));
      section(g, t, { fingerOn: true, fx: 0, fy: tip, field: 1, steal: .25 + .75 * st, ions: .7 });
      g.restore(); vignette(g);
      /* field meter for the crossing under the finger */
      var pct = Math.round(100 - 38 * eout(st));
      meter(g, 840, 900, pct / 100, seg(t, s.t0 + .2, s.t0 + .5));
      var bk = seg(t, K.pulls + .35, K.pulls + .55);
      if (bk > 0) { g.save(); g.globalAlpha = bk; font(g, '900 84px ' + DISP); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineWidth = 12; g.strokeStyle = 'rgba(10,12,20,.85)'; NOREC = true; ['FIELD', 'DROPS'].forEach(function (w, j) { var yy = 470 + j * 92 + (1 - bk) * 30; g.strokeText(w, 60, yy); g.fillStyle = FIELD; g.fillText(w, 60, yy); }); NOREC = false; g.restore(); }
      chip(g, 'FIELD AT THIS CROSSING', 920, 1180, seg(t, s.t0 + .2, s.t0 + .5), { right: true });
      tag(g, 'Illustrative, not measured', 1);
    },
    locate: function (g, t, s) {
      bg(g, t, '#151b2c');
      var k = seg(t, s.t0, s.t1);
      var fx = 4.42, fy = 7.36;           /* the touch sits between the wires */
      var dk = seg(t, K.dropped - .2, K.dropped + .5);
      var dropF = function (i, j) { return dk * Math.exp(-(Math.pow(i - fx, 2) + Math.pow(j - fy, 2)) / 1.3); };
      g.save(); g.translate(W / 2, H * .46); var sc = lerp(1.0, 1.2, eio(k)); g.scale(sc, sc);
      var tilt = .35;
      grid(g, t, { tilt: tilt, drop: dropF, rings: dk, scan: true });
      /* the fingertip from above: a soft translucent pad */
      var c = gp(fx, fy, tilt);
      g.save(); g.globalAlpha = .38 * seg(t, s.t0, s.t0 + .3); var rg = g.createRadialGradient(c.x, c.y, 10, c.x, c.y, 150); rg.addColorStop(0, SKIN_L); rg.addColorStop(1, 'rgba(217,153,122,0)'); g.fillStyle = rg; g.beginPath(); g.ellipse(c.x, c.y, 150, 180, 0, 0, 6.283); g.fill(); g.restore();
      /* crosshair glides to the weighted centre */
      var ck = eout(seg(t, K.center - .1, K.center + .5)), start = gp(2, 4, tilt);
      if (ck > 0) crosshair(g, lerp(start.x, c.x, ck), lerp(start.y, c.y, ck), c.s * (1 + .3 * (1 - ck)), ck, CREAM, t);
      var rk = (t - K.tap) / .8;
      if (rk > 0 && rk < 1) { g.strokeStyle = 'rgba(' + FIELD_RGB + ',' + (1 - rk) + ')'; g.lineWidth = 5; g.beginPath(); g.arc(c.x, c.y, 40 + rk * 160, 0, 6.283); g.stroke(); }
      g.restore(); vignette(g);
      chip(g, 'YOUR TAP', 920, 1180, seg(t, K.center - .5, K.center - .25), { right: true });
      chip(g, 'DROPPED', 90, 360, seg(t, s.t0 + .1, s.t0 + .35), { col: CREAM });
    },
    wool: function (g, t, s) {
      bg(g, t);
      var k = seg(t, s.t0, s.t1), tip = lerp(-200, -10, eout(seg(t, s.t0, s.t0 + .9)));
      g.save(); cam(g, 0, lerp(-40, 20, eio(k)), lerp(1.75, 1.9, eio(k)));
      section(g, t, { fingerOn: true, fx: 0, fy: tip, glove: true, field: 1, steal: 1 });
      g.restore(); vignette(g);
      meter(g, 840, 900, 1, seg(t, s.t0 + .2, s.t0 + .5));
      chip(g, 'WOOL: INSULATOR', 90, 360, seg(t, s.t0 + .1, s.t0 + .35), { col: WARN, lx: 470, ly: 640 });
      tag(g, 'Field lines for clarity', 1);
    },
    wet: function (g, t, s) {
      bg(g, t);
      var k = seg(t, s.t0, s.t1), land = K.water - .1;
      var fall = seg(t, s.t0 + .1, land), dy = lerp(-900, GLASS_T, fall * fall), on = t >= land;
      var st = seg(t, land + .05, land + .6);
      g.save(); cam(g, 0, lerp(-40, 20, eio(k)), lerp(1.8, 2.0, eio(k)));
      section(g, t, { fingerOn: false, field: 1, drop: { x: 0, y: on ? GLASS_T : dy, r: 110, a: 1, k: on ? .25 + .75 * st : 0 } });
      if (on) { var sk = (t - land) / .5; if (sk < 1) { g.strokeStyle = 'rgba(200,225,255,' + (1 - sk) + ')'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, GLASS_T, 120 + sk * 260, 20 + sk * 30, 0, 0, 6.283); g.stroke(); } }
      g.restore(); vignette(g);
      meter(g, 840, 900, 1 - .3 * eout(st), seg(t, s.t0 + .2, s.t0 + .5), true);
      chip(g, 'WATER', 90, 360, seg(t, s.t0 + .1, s.t0 + .35), { col: WARN });
      tag(g, 'Illustrative, not measured', 1);
    },
    ghost: function (g, t, s) {
      bg(g, t, '#1a2133'); rain(g, t, 1);
      var k = seg(t, s.t0, s.t1);
      g.save(); cam(g, 0, 0, lerp(1.05, 1.18, eio(k)), lerp(.03, -.01, k));
      var o1 = (t - (K.rainTap - .5)) / .5, o2 = (t - (K.rainTap + .55)) / .45;
      phone(g, t, {
        open: [{ i: 6, k: o1 < 1.2 ? o1 : 1.2 - (o1 - 1.2) * 1.5, a: 1 }, { i: 9, k: o2 }], ghostEdge: true,
        ripple: [{ x: -55, y: -230, k: (t - K.rainTap + .55) / .6, col: WARN_RGB }, { x: 165, y: -100, k: (t - K.rainTap - .5) / .6, col: WARN_RGB }],
        drops: [{ x: -55, y: -205, r: 34, a: 1 }, { x: 165, y: -76, r: 40, a: 1 }, { x: -170, y: 260, r: 28, a: 1 }, { x: 120, y: 330, r: 22, a: 1 }]
      });
      g.restore(); vignette(g);
      chip(g, 'GHOST TAPS', 90, 360, seg(t, s.t0 + .3, s.t0 + .6), { col: WARN });
    },
    recap: function (g, t, s) {
      bg(g, t);
      var k = seg(t, s.t0, s.t1);
      g.save(); cam(g, 0, lerp(80, -40, eio(k)), lerp(1.05, 1.5, eio(k)));
      var tip = lerp(-120, -12, eout(seg(t, s.t0, K.push + .4)));
      section(g, t, { fingerOn: true, fx: 0, fy: tip, field: 1, steal: seg(t, K.push, K.you), ions: seg(t, K.you - .4, K.you + .2) });
      g.restore(); vignette(g);
      tag(g, 'Magnified illustration', 1);
    },
    end: function (g, t, s) {
      bg(g, t, '#1a2133'); rain(g, t, 1);
      var k = seg(t, s.t0, DUR);
      g.save(); cam(g, 0, lerp(40, -20, k), lerp(1.0, 1.12, eio(k)));
      phone(g, t, { drops: [{ x: -55, y: -205, r: 34, a: 1 }, { x: 165, y: -76, r: 40, a: 1 }, { x: -170, y: 260, r: 28, a: 1 }, { x: 120, y: 330, r: 22, a: 1 }, { x: 40, y: 80, r: 30, a: seg(t, s.t0 + .6, s.t0 + .9) }] });
      frontFinger(g, 230, lerp(620, 380, eio(k)) + Math.sin(t * 2) * 10, -.42, {});
      g.restore(); vignette(g);
    }
  };

  function meter(g, x, y, v, a, warn) {
    if (a <= 0) return;
    g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(10,12,20,.82)'; g.beginPath(); g.roundRect(x - 50, y - 210, 100, 300, 24); g.fill();
    g.fillStyle = 'rgba(' + FIELD_RGB + ',.18)'; g.fillRect(x - 22, y - 180, 44, 220);
    var h = 220 * v; g.fillStyle = warn && v < .95 ? WARN : v < .9 ? CREAM : FIELD; g.fillRect(x - 22, y + 40 - h, 44, h);
    font(g, '600 32px ' + MONO); g.textAlign = 'center'; g.fillStyle = CREAM; rec('FIELD'); g.fillText('FIELD', x, y + 78);
    g.restore();
  }

  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    var s = shotAt(t);
    DRAW[s.id](g, t, s);
    if (LIVE.text) captions(g, t);
  }

  /* ---------- render with motion blur ---------- */
  function render(t, samples, shutter, fps) {
    samples = samples || 1;
    if (samples <= 1) { frame(ctx, t); return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    actx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(acc, 0, 0);
  }
  function TEXTS(t) { REC = {}; frame(tctx, t); var r = REC; REC = null; return Object.keys(r).map(function (k) { return { id: k, text: k }; }); }

  /* ---------- sound: quiet foley from the kit, cut to the picture; no music (Isac adds the platform sound) ---------- */
  var EV = [];
  SHOTS.forEach(function (s, i) { if (i) EV.push({ t: s.t0 - .02, type: 'swish', g: .35 }); });
  EV.push({ t: K.pressing, type: 'thud', g: .5 });
  EV.push({ t: K.electricity - .05, type: 'rise', t1: K.electricity + .4 });
  EV.push({ t: K.tap0 + .02, type: 'thud', g: .35 }, { t: K.nothing - .05, type: 'tick', g: .3 });
  EV.push({ t: K.ask + .6, type: 'whoosh', g: .7, d: .9 });
  EV.push({ t: K.checks - .05, type: 'ratchet', t1: K.hundred + .35, g: .6 });
  EV.push({ t: K.pulls, type: 'rise', t1: K.pulls + .5 });
  EV.push({ t: K.center + .45, type: 'ding', g: .6 });
  EV.push({ t: K.woolN, type: 'tick', g: .3 });
  EV.push({ t: K.water - .1, type: 'splat', g: .35 });
  EV.push({ t: K.rainTap - .5, type: 'pop', g: .6 }, { t: K.rainTap + .55, type: 'pop', g: .6 });
  EV.push({ t: K.you, type: 'sparkle', g: .6 });
  /* hits sit between words, never on them (factory LESSONS): push each one to the next spot 0.15 s clear of every word */
  var WORDS = []; VO.lines.forEach(function (l) { l.words.forEach(function (w) { WORDS.push([w.t0 - .15, w.t1 + .15]); }); });
  function clear(t, len) { for (var i = 0; i < WORDS.length; i++) if (t < WORDS[i][1] && t + len > WORDS[i][0]) return WORDS[i][1]; return -1; }
  EV.forEach(function (e) {
    if (e.type === 'swish' || e.type === 'ratchet' || e.type === 'tick' || e.type === 'pop') return;   /* quiet textures stay on the picture */
    var len = e.t1 ? e.t1 - e.t : .25, t = e.t, n = 0, nx;
    while ((nx = clear(t, len)) >= 0 && n++ < 40) t = nx;
    if (t - e.t < .9) { if (e.t1) e.t1 += t - e.t; e.t = t; } else e.g = (e.g || 1) * .4;   /* no gap near: keep it, quieter */
  });
  function SCORE(ac) { window.KIT.score(ac, EV, DUR); }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    var fonts = ['900 84px Archivo', '700 64px Archivo', '500 30px "Geist Mono"', '600 32px "Geist Mono"', '400 26px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, "Aa0%+–−'"); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  var POSTER = (K.pulls + K.find) / 2 + .3;
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: POSTER, SLUG: 'touchscreen', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
