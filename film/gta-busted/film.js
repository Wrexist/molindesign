/* "Do these 4 before you get busted": GTA 6, Delta, checklist format (VIDEO-PLAN §3 row 0, CNS anatomy in our own design).
   Real gameplay plays dimmed behind every beat as background plates (SAFE-EDIT rule 11, official Rockstar video only),
   except the property-tray question and the $20,000 frame, which are all ours.
   Native move: a jail PROPERTY RECEIPT docked in the lower third. Four rows (FIREARMS, VEHICLE, STASH BAGS, POCKET CASH)
   are stamped CONFISCATED in the hook; each step rips that stamp strip off its row and slams a coral KEPT under it,
   and the KEPT n/4 counter on the receipt foot climbs to 4/4. Pinned header tape, a manila STEP tag that flips on
   "One/Two/Three/Four", one place card per step, word captions with 1-2 coral words.
   Loop: the last 0.3 s plays the 0.3 s of the jail plate that frame 0 continues from, with the frame-0 layout.
   Pure function of t, keyed to the voice with at(id, word). Rail x 90-930, glyphs above y 1450.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx), BOUNDS_RUN. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0d0b12', CREAM = '#f6efe2', CORAL = '#ff5a52', OX = '#9b1c1c', INK = '#16121c', MANILA = '#e3c287', BLUE = '#3f5f9e', TAPE = '#f2d64b';
  var TAU = Math.PI * 2;
  var X0 = 90, X1 = 930, MID = 510;
  var CAPY = 300;

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function knock(t, a, amp, f, d) { if (t < a) return 0; var u = t - a; return (amp || 1) * Math.exp(-u * (d || 6)) * Math.sin(u * (f || 22)); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function win(t, a, b, fi, fo) { return Math.min(seg(t, a, a + (fi || .2)), 1 - seg(t, b - (fo || .2), b)); }

  /* text: set the font, then the stretch (setting ctx.font resets fontStretch, LESSONS gta-lucia) */
  function font(g, px, wt, fam, stretch) { g.font = (wt || 900) + ' ' + px + 'px ' + (fam || 'Archivo'); try { g.fontStretch = stretch || 'normal'; } catch (e) {} }
  function txt(g, s, x, y, px, o) {
    o = o || {}; font(g, px, o.wt, o.fam, o.st);
    try { g.letterSpacing = (o.ls || 0) + 'px'; } catch (e) {}
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.lw || px * .16; g.strokeStyle = o.stroke; g.strokeText(s, x, y); }
    g.fillStyle = o.col || CREAM; g.fillText(s, x, y);
    var w = g.measureText(s).width; try { g.letterSpacing = '0px'; } catch (e) {} return w;
  }
  function tw(g, s, px, o) { o = o || {}; font(g, px, o.wt, o.fam, o.st); try { g.letterSpacing = (o.ls || 0) + 'px'; } catch (e) {} var w = g.measureText(s).width; try { g.letterSpacing = '0px'; } catch (e) {} return w; }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word < 0 ? l.words.length + word : word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function wend(id, word, nth) { return find(id, word, nth).t1; }
  function start(id) { return LINE[id].t0; }
  function lastw(id) { var w = LINE[id].words; return w[w.length - 1].t1; }

  /* ---------- times ---------- */
  var T = {}, EV = [], P = [];
  function ev(t, type, g, extra) { var e = { t: t, type: type, g: g == null ? 1 : g }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
  function stampSfx(t, g) { ev(t, 'slam', .8 * (g || 1)); ev(t + .01, 'tick', .5 * (g || 1)); }
  function ripSfx(t) { ev(t, 'scratch', .9); ev(t + .03, 'swish', .6); }
  /* a background plate: plays at speed 1 or slower so it fits the beat, never past the end of its cut */
  function plate(name, t0, t1, o) {
    o = o || {}; var c = CLIP.manifest().clips[name], len = c.frames / 30 - .05, from = o.from || 0;
    var sp = Math.min(1, (len - from) / (t1 - t0));
    var u = CLIP.use(name, t0, t1, { plate: true, from: from, speed: sp, zoom: o.zoom || [1.12, 1.0], focus: o.focus || [.5, .5], note: o.note || 'PLATE' });
    u.dim = o.dim; u.gray = o.gray; P.push(u); return u;
  }
  function initTimes() {
    EV.length = 0; P.length = 0; CLIP.reset();
    var h0 = LINE.hook.words[0].t0;
    T.stamp = [0, 1, 2, 3].map(function (i) { return h0 + .25 + i * .3; });       // 0.45-1.35 s: four CONFISCATED stamps, payoff by 1.9 s
    T.gta = .25;
    T.dock = wend('hook', 'busted') + .02;                                       // the title flies into the header tape
    T.gone = at('stake', 'gone');
    T.q = start('q');
    T.step = [at('gun', 'one'), at('car', 'two'), at('bags', 'three'), at('cash', 'four')];
    T.goneOut = T.step[0] - .9;
    T.tray = [at('q', 'what'), at('q', 'do'), at('q', 'cops'), at('q', 'take')];
    T.lootDrop = start('loot') - .15; T.lootStamp = at('loot', 'loot') + .1;
    T.lock = at('kept', 'bought'); T.ammu = at('kept', 'ammunation'); T.trunk = at('kept', 'trunk');
    T.carIn = T.step[1]; T.sticker = at('car', 'register');
    T.keyIn = lastw('car') - .1; T.keyDrop = at('stolen', 'arrest');
    T.bagGo = lastw('bags');
    T.hook = at('impound', 'busted'); T.impounded = at('impound', 'car') + .05;
    T.atm = at('cash', 'bank');
    T.brick = start('grand'); T.seize = at('grand', '20000') + .3; T.bank = lastw('grand') - .05;
    T.end = start('end');
    T.tear = [lastw('kept') + .04, lastw('stolen') + .04, lastw('bags') + .04, T.bank + .32];
    T.back = DUR - .2;                                                          // rows clear, the title slams back: last frame = frame 0
    T.loopPlate = DUR - .3;

    /* plates (each < 4.9 s, new range every cut); the tray question and the $20,000 frame are all ours */
    plate('p1jail', 0, T.dock - .25, { from: 1.42, zoom: [1.3, 1.14], focus: [.62, .45], dim: .36, note: 'frame 0: jail jumpsuit (Trailer 1, mood only), behind the title and the receipt' });
    plate('p2cops', T.dock - .25, T.q - .02, { focus: [.42, .55], note: 'getaway with cop lights behind GONE FOR GOOD' });
    plate('p3rifle', T.step[0] - .05, start('loot') - .02, { focus: [.74, .5], note: 'Jason with a rifle behind the AMMU-NATION card' });
    plate('p4swamp', start('loot') - .02, start('kept') - .02, { focus: [.5, .5], zoom: [1.0, 1.16], note: 'armed men wading at sunset behind UNOWNED = LOST' });
    plate('p5trunk', start('kept') - .02, T.step[1] - .05, { focus: [.5, .5], note: 'open van trunk behind LOCKER / TRUNK' });
    plate('p6walk', T.step[1] - .05, start('stolen') - .02, { focus: [.55, .5], note: 'Jason walks to his red convertible behind the PAY N SPRAY card' });
    plate('p7chase', start('stolen') - .02, T.step[2] - .05, { focus: [.55, .5], note: 'car chase on a dirt road behind the STOLEN key' });
    plate('p8bag', T.step[2] - .05, start('impound') - .02, { focus: [.3, .55], note: 'runner with a bag to a motorbike behind the FENCE card' });
    plate('p9drive', start('impound') - .02, T.step[3] - .05, { focus: [.42, .55], gray: 1, dim: .55, note: 'own red convertible in traffic, desaturated, behind the tow hook' });
    plate('p10truck', T.step[3] - .05, T.brick - .02, { focus: [.38, .5], note: 'armored cash truck behind the ATM / BUCKME card' });
    plate('p12sunset', T.end - .02, T.loopPlate, { focus: [.55, .5], note: 'skyline at sunset behind HOW MUCH ARE YOU CARRYING?' });
    plate('p1jail', T.loopPlate, DUR + .001, { from: 1.12, zoom: [1.32, 1.3], focus: [.62, .45], dim: .36, note: 'loop: the 0.3 s of the jail plate that frame 0 continues from' });

    /* sound: every hit short, on its word or in a written pause */
    ev(.01, 'whoosh', .55, { d: .5 });
    ev(T.gta, 'pop', .6);
    T.stamp.forEach(function (t, i) { stampSfx(t, .85); });
    ev(T.dock - .05, 'swish', .7);
    stampSfx(T.gone, 1.1);
    ev(T.q - .05, 'whoosh', .6, { d: .45 });
    T.tray.forEach(function (t) { ev(t + .18, 'thud', .55); ev(t + .19, 'tick', .4); });
    T.step.forEach(function (t, i) { ev(t - .04, 'swish', .8); ev(t + .1, 'tick', .6); ev(t + .12, 'pop', .5); });
    ev(T.lootDrop + .3, 'thud', .7); stampSfx(T.lootStamp, .9);
    ev(T.lock + .15, 'thud', .5); ev(T.trunk + .1, 'thud', .5);
    ev(T.carIn + .1, 'whoosh', .5); stampSfx(T.sticker + .1, .7);
    ev(T.keyDrop, 'zip', .7); ev(T.keyDrop + .45, 'thud', .45);
    ev(T.bagGo - .1, 'whoosh', .5);
    ev(T.hook - .1, 'zip', .6); ev(T.impounded, 'slam', 1); ev(T.impounded + .02, 'ding', .35); ev(T.impounded + .05, 'key', .8);
    ev(T.atm, 'pop', .6);
    ev(T.brick + .05, 'thud', .8); stampSfx(T.seize, 1);
    ev(T.bank - .05, 'whoosh', .7, { d: .4 });
    T.tear.forEach(function (t, i) { ripSfx(t); stampSfx(t + .14, i === 3 ? 1.15 : .85); if (i === 3) ev(t + .2, 'ding', .8); });
    ev(T.end + .02, 'pop', .6);
    ev(T.back + .02, 'swish', .6); ev(T.back + .1, 'thud', .5);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  /* ---------- captions: phrase cards of 2-4 words; 1-2 stressed words in coral; never end a card on a weak word ---------- */
  var CHUNKS = [], CPX = 86;
  var WEAK = { a: 1, an: 1, the: 1, is: 1, to: 1, in: 1, by: 1, you: 1, of: 1, for: 1, and: 1, on: 1, at: 1, or: 1, your: 1, are: 1, can: 1, do: 1, when: 1, after: 1, own: 1, get: 1, say: 1 };
  var HOTW = { gone: 1, loot: 1, trunk: 1, register: 1, stolen: 1, fence: 1, impounded: 1, bank: 1, '20000': 1 };
  var NOCAP = { hook: 1, end: 1 };
  function buildChunks(g) {
    var GAP = CPX * .28;
    function wd(w) { return tw(g, w.w, CPX); }
    function width(c) { return c.reduce(function (a, w) { return a + wd(w); }, 0) + GAP * (c.length - 1); }
    VO.lines.forEach(function (l) {
      if (NOCAP[l.id]) return;
      var lw = l.words; if (/^(one|two|three|four)$/.test(norm(lw[0].w))) lw = lw.slice(1);   // the STEP tag says the number
      var ws = lw.map(function (w) { var s = w.w.replace(/[,:.]$/, '').replace(/[.,]$/, '').toUpperCase(); return { w: s, raw: w.w, t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] }; });
      var phrases = [], cur = [];
      ws.forEach(function (w) { cur.push(w); if (/[.?!,:]$/.test(w.raw)) { phrases.push(cur); cur = []; } });
      if (cur.length) phrases.push(cur);
      phrases.forEach(function (ph) {
        var n = Math.ceil(ph.length / 4), base = Math.floor(ph.length / n), extra = ph.length % n, sizes = [];
        for (var i = 0; i < n; i++) sizes.push(base + (i < extra ? 1 : 0));
        var k = 0, parts = sizes.map(function (z) { var p = ph.slice(k, k + z); k += z; return p; });
        for (var m = 0; m < parts.length - 1; m++) while (parts[m].length > 1 && WEAK[norm(parts[m][parts[m].length - 1].w)]) parts[m + 1].unshift(parts[m].pop());
        parts.forEach(function (c) {
          if (width(c) <= 800 || c.length === 1) c.rows = [c];
          else {
            var best = null;
            for (var b = 1; b < c.length; b++) { var a1 = c.slice(0, b), a2 = c.slice(b), sc = Math.max(width(a1), width(a2)) + (WEAK[norm(a1[a1.length - 1].w)] ? 120 : 0); if (!best || sc < best.sc) best = { sc: sc, r: [a1, a2] }; }
            c.rows = best.r;
          }
          c.line = l.id; CHUNKS.push(c);
        });
      });
    });
    /* blocks never overlap: the old one is gone before the next one fades in */
    CHUNKS.forEach(function (c, i) { var nx = CHUNKS[i + 1]; c.t0 = c[0].t0 - .06; c.t1 = nx ? Math.min(nx[0].t0 - .1, c[c.length - 1].t1 + .7) : c[c.length - 1].t1 + .5; });
  }
  function captions(g, t) {
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.t0 || t >= c.t1) continue;
      var k = eo(seg(t, c.t0, c.t0 + .1)) * (1 - seg(t, c.t1 - .05, c.t1)), gap = CPX * .28, n = c.rows.length;
      g.save(); g.globalAlpha *= k;
      c.rows.forEach(function (row, r) {
        var ws = row.map(function (w) { return tw(g, w.w, CPX); });
        var wsum = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (row.length - 1), x = MID - wsum / 2, s = Math.min(1, 800 / wsum);
        var y = (n === 1 ? CAPY + 46 : CAPY + r * 96) + (1 - k) * 16;
        g.save(); g.translate(MID, y); g.scale(s, s); g.translate(-MID, -y);
        row.forEach(function (w, j) {
          var on = t >= w.t0 && t < w.t1 + .05;
          K.sticker(g, w.w, x + ws[j] / 2, y + (on ? -5 : 0), CPX, { col: w.hot ? CORAL : CREAM, wide: false, lw: CPX * .17 });
          x += ws[j] + gap;
        });
        g.restore();
      });
      g.restore();
      return;
    }
  }

  /* ---------- plates + grade ---------- */
  function plates(g, t) {
    var u = CLIP.activePlate(t);
    if (u) {
      var dim = u.dim != null ? u.dim : .5;
      if (u === P[0]) dim = lerp(.36, .5, seg(t, T.stamp[0], T.dock));
      g.save();
      if (u.gray) g.filter = 'grayscale(' + (.25 + .75 * seg(t, T.hook - .3, T.hook + .2)) + ') contrast(1.05)';
      CLIP.plate(g, t, 0, 0, W, H, { dim: dim });
      g.restore();
    } else {
      g.fillStyle = BG; g.fillRect(0, 0, W, H);
      /* all-ours frames: a counter top under a hanging lamp, slow drift */
      var gr = g.createRadialGradient(MID, 760, 40, MID, 760, 900); gr.addColorStop(0, 'rgba(246,239,226,.12)'); gr.addColorStop(1, 'rgba(246,239,226,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.save(); g.globalAlpha = .06; g.strokeStyle = CREAM; g.lineWidth = 2;
      var off = (t * 18) % 60;
      for (var y = -60; y < H; y += 60) { g.beginPath(); g.moveTo(0, y + off); g.lineTo(W, y + off); g.stroke(); }
      g.restore();
    }
    /* ink gradients top and bottom keep every word at >= 4.5:1 */
    var a = g.createLinearGradient(0, 0, 0, 560); a.addColorStop(0, 'rgba(13,11,18,.82)'); a.addColorStop(1, 'rgba(13,11,18,0)');
    g.fillStyle = a; g.fillRect(0, 0, W, 560);
    var b = g.createLinearGradient(0, 980, 0, H); b.addColorStop(0, 'rgba(13,11,18,0)'); b.addColorStop(.35, 'rgba(13,11,18,.55)'); b.addColorStop(1, 'rgba(13,11,18,.92)');
    g.fillStyle = b; g.fillRect(0, 980, W, H - 980);
  }

  /* ---------- icons, drawn flat in a ±60 box (ink strokes, cream fill) ---------- */
  function icon(g, kind, s, col, t, lw) {
    g.save(); g.scale(s, s); g.lineJoin = g.lineCap = 'round'; g.strokeStyle = INK; g.fillStyle = col || CREAM; g.lineWidth = lw || 7;
    if (kind === 'gun') {          // pistol
      g.beginPath(); g.moveTo(-55, -28); g.lineTo(52, -28); g.lineTo(52, -4); g.lineTo(-8, -4); g.lineTo(-14, 6); g.lineTo(-10, 46); g.lineTo(-36, 46); g.lineTo(-40, 4); g.lineTo(-55, -4); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-8, -4); g.quadraticCurveTo(4, 18, 12, -4); g.stroke();
      g.beginPath(); g.moveTo(-46, -16); g.lineTo(40, -16); g.lineWidth = 4; g.stroke();
    } else if (kind === 'rifle') {
      g.beginPath(); g.moveTo(-60, -10); g.lineTo(60, -14); g.lineTo(60, -4); g.lineTo(10, 0); g.lineTo(4, 22); g.lineTo(-8, 22); g.lineTo(-6, 4); g.lineTo(-30, 6); g.lineTo(-58, 24); g.lineTo(-62, 4); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.rect(-14, -26, 30, 12); g.fill(); g.stroke();
    } else if (kind === 'car') {   // key + fob
      g.beginPath(); g.rect(-50, -30, 52, 60); g.fill(); g.stroke();
      g.beginPath(); g.arc(-24, -6, 10, 0, TAU); g.lineWidth = 5; g.stroke(); g.lineWidth = 7;
      g.beginPath(); g.moveTo(2, -8); g.lineTo(52, -8); g.lineTo(52, 8); g.lineTo(40, 8); g.lineTo(40, 18); g.lineTo(28, 18); g.lineTo(28, 8); g.lineTo(2, 8); g.closePath(); g.fill(); g.stroke();
    } else if (kind === 'bag') {   // duffel
      g.beginPath(); g.moveTo(-30, -20); g.quadraticCurveTo(0, -58, 30, -20); g.lineWidth = 7; g.stroke();
      rr(g, -56, -22, 112, 58, 26); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-34, -22); g.lineTo(-34, 36); g.moveTo(34, -22); g.lineTo(34, 36); g.lineWidth = 4; g.stroke();
    } else if (kind === 'cash') {  // bills with a band
      for (var i = 2; i >= 0; i--) { g.beginPath(); g.rect(-56 + i * 5, -30 + i * 7, 104, 50); g.fillStyle = i ? '#a9c99a' : (col || '#cfe8bf'); g.fill(); g.stroke(); }
      g.lineWidth = lw || 7;
      g.beginPath(); g.rect(-12, -30, 22, 50); g.fillStyle = CORAL; g.fill(); g.stroke();
      g.beginPath(); g.arc(-34, -5, 10, 0, TAU); g.lineWidth = 4; g.stroke();
    }
    g.restore();
  }

  /* ---------- the receipt ---------- */
  var ROWS = [{ k: 'gun', s: 'FIREARMS' }, { k: 'car', s: 'VEHICLE' }, { k: 'bag', s: 'STASH BAGS' }, { k: 'cash', s: 'POCKET CASH' }];
  var RX = 118, RW = 784, RY = 1070, RH = 360, ROWH = 58, ROW0 = RY + 52;
  function recOffset(t) {
    /* frame 0: rising from below; the end: drops back to that place for the loop */
    var a = (1 - eo(seg(t, 0, .9))) * 300, b = eio(seg(t, T.back + .02, DUR)) * 300;
    return Math.max(a, b);
  }
  function kept(t) { var n = 0; for (var i = 0; i < 4; i++) if (t >= T.tear[i] + .14) n++; return n; }
  function receipt(g, t) {
    var oy = recOffset(t), shake = knock(t, T.gone, 10, 30, 7), dmA = 1 - seg(t, T.brick - .1, T.brick + .15) * (1 - seg(t, T.bank - .05, T.bank + .15));
    if (dmA <= .02) return;
    g.save(); g.globalAlpha *= dmA; g.translate(shake, oy);
    /* paper with a torn top edge */
    g.save(); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(RX + 10, RY + 14, RW, RH); g.restore();
    g.beginPath(); g.moveTo(RX, RY + 8);
    for (var x = 0; x <= RW; x += 24) g.lineTo(RX + x, RY + (x / 24) % 2 * 8);
    g.lineTo(RX + RW, RY + RH); g.lineTo(RX, RY + RH); g.closePath(); g.fillStyle = CREAM; g.fill();
    /* header: carbon-blue band */
    var hdr = seg(t, T.dock, T.dock + .25) * (t < T.back ? 1 : 0);
    g.fillStyle = BLUE; g.fillRect(RX, RY + 10, RW, 40);
    if (hdr > 0) { g.save(); g.globalAlpha *= hdr; txt(g, 'PROPERTY RECEIPT', RX + 20, RY + 31, 30, { fam: '"Geist Mono"', wt: 700, align: 'left', col: CREAM, ls: 3 }); txt(g, 'No. 0419', RX + RW - 20, RY + 31, 30, { fam: '"Geist Mono"', wt: 700, align: 'right', col: 'rgba(246,239,226,.8)' }); g.restore(); }
    /* rows */
    for (var i = 0; i < 4; i++) {
      var y = ROW0 + i * ROWH, cy = y + ROWH / 2;
      g.strokeStyle = 'rgba(63,95,158,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(RX + 16, y + ROWH); g.lineTo(RX + RW - 16, y + ROWH); g.stroke();
      rr(g, RX + 20, cy - 20, 40, 40, 6); g.strokeStyle = BLUE; g.lineWidth = 3; g.stroke();
      var on = t >= T.stamp[i] - .12 && t < T.back;
      var ik = on ? eo(seg(t, T.stamp[i] - .12, T.stamp[i] + .02)) : 0;
      if (ik > 0) {
        g.save(); g.globalAlpha *= ik; g.translate(RX + 104, cy - (1 - ik) * 40); icon(g, ROWS[i].k, .46, CREAM); g.restore();
        g.save(); g.globalAlpha *= ik; txt(g, ROWS[i].s, RX + 150, cy + 2, 40, { wt: 800, st: 'condensed', align: 'left', col: INK }); g.restore();
      }
      rowStamp(g, t, i, cx0(), cy);
    }
    /* foot: perforation + KEPT n/4 */
    var fy = ROW0 + 4 * ROWH + 36;
    g.save(); g.setLineDash([10, 10]); g.strokeStyle = 'rgba(22,18,28,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(RX + 16, fy - 32); g.lineTo(RX + RW - 16, fy - 32); g.stroke(); g.restore();
    var n = kept(t), cnt = seg(t, T.stamp[0], T.stamp[0] + .2) * (t < T.back ? 1 : 0);
    if (cnt > 0) {
      g.save(); g.globalAlpha *= cnt;
      txt(g, 'KEPT', RX + RW - 176, fy + 2, 38, { wt: 900, st: 'condensed', align: 'right', col: INK });
      var last = -9; for (var j = 0; j < 4; j++) if (t >= T.tear[j] + .14) last = T.tear[j] + .14;
      var u = t - last, sc = u < .14 ? lerp(1.9, 1, eo(u / .14)) : 1 - .1 * knock(u, .14, 1, 26, 7);
      g.save(); g.translate(RX + RW - 96, fy + 2); g.scale(sc, sc);
      txt(g, n + '/4', 0, 0, 54, { wt: 900, col: n ? CORAL : INK, stroke: n ? INK : null, lw: 6 });
      g.restore(); g.restore();
    }
    g.restore();
  }
  function cx0() { return RX + RW - 150; }
  /* the stamp on a row: CONFISCATED (oxblood) until its tear, then the strip rips off and a coral KEPT slams in */
  function rowStamp(g, t, i, cx, cy) {
    var ts = T.stamp[i], tr = T.tear[i], alive = t < T.back;
    if (t < ts || !alive) return;
    if (t < tr + .5) {
      var u = t - ts, sc = lerp(1.7, 1, eo(clamp(u / .12, 0, 1))), rip = seg(t, tr, tr + .5);
      g.save();
      if (rip > 0) { g.translate(cx - 70 * rip, cy + 70 * rip * rip); g.rotate(-.45 * rip); g.globalAlpha *= 1 - rip; }
      else g.translate(cx, cy);
      if (rip > 0) { g.fillStyle = CREAM; g.fillRect(-140, -ROWH / 2 + 2, 280, ROWH - 4); }
      g.rotate(-.06); g.scale(sc, sc); g.globalAlpha *= clamp(u / .05, 0, 1);
      g.lineWidth = 4; g.strokeStyle = OX; rr(g, -118, -22, 236, 44, 6); g.stroke();
      txt(g, 'CONFISCATED', 0, 2, 32, { wt: 900, st: 'condensed', col: OX, ls: 2 });
      g.restore();
      if (rip > 0 && rip < 1) { g.save(); g.setLineDash([8, 8]); g.strokeStyle = 'rgba(22,18,28,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 150, cy - ROWH / 2 + 4); g.lineTo(cx - 150, cy + ROWH / 2 - 4); g.stroke(); g.restore(); }
    }
    if (t >= tr + .14) {
      var v = t - tr - .14, s2 = lerp(1.8, 1, eo(clamp(v / .12, 0, 1))) - .08 * knock(v, .12, 1, 26, 7);
      g.save(); g.translate(cx, cy); g.rotate(-.05); g.scale(s2, s2);
      rr(g, -92, -24, 184, 48, 24); g.fillStyle = CORAL; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
      txt(g, 'KEPT', -12, 2, 36, { wt: 900, col: INK, ls: 2 });
      g.lineWidth = 6; g.lineCap = g.lineJoin = 'round'; g.beginPath(); g.moveTo(42, 0); g.lineTo(54, 12); g.lineTo(74, -12); g.stroke();
      g.restore();
      /* the dip: busted in your own car, the vehicle row gets an impound tag on its KEPT */
      if (i === 1 && t >= T.impounded) {
        var w = t - T.impounded, sw = Math.sin(w * 5) * .25 * Math.exp(-w * 1.2);
        g.save(); g.translate(cx - 200, cy); g.rotate(-.06 + sw * .4);
        g.strokeStyle = INK; g.lineWidth = 3;
        rr(g, -92, -22, 184, 44, 6); g.fillStyle = '#f0a33a'; g.fill(); g.stroke();
        txt(g, 'IMPOUND LOT', 0, 1, 30, { wt: 900, st: 'condensed', col: INK, ls: 1 });
        g.restore();
      }
    }
  }

  /* ---------- pinned header tape, GTA 6 pill, the frame-0 title ---------- */
  var HX = 90, HY = 98, HW = 600, HH = 60;
  function header(g, t) {
    var k = seg(t, T.dock + .15, T.dock + .35) * (1 - seg(t, T.back, T.back + .15)); if (k <= 0) return;
    g.save(); g.globalAlpha *= k;
    g.save(); g.translate(HX + HW / 2, HY); g.rotate(-.015);
    g.fillStyle = TAPE; g.fillRect(-HW / 2, -HH / 2, HW, HH);
    g.save(); g.beginPath(); g.rect(-HW / 2, -HH / 2, HW, HH); g.clip(); g.fillStyle = INK;
    for (var x = -HW / 2 - 40; x < -HW / 2 + 30; x += 22) { g.beginPath(); g.moveTo(x, HH / 2); g.lineTo(x + 12, HH / 2); g.lineTo(x + 42, -HH / 2); g.lineTo(x + 30, -HH / 2); g.fill(); }
    for (x = HW / 2 - 40; x < HW / 2 + 40; x += 22) { g.beginPath(); g.moveTo(x, HH / 2); g.lineTo(x + 12, HH / 2); g.lineTo(x + 42, -HH / 2); g.lineTo(x + 30, -HH / 2); g.fill(); }
    g.restore();
    /* siren dot: blinks on each step */
    var blink = 0; T.step.forEach(function (s) { blink = Math.max(blink, win(t, s - .05, s + .5, .04, .2)); });
    g.beginPath(); g.arc(-HW / 2 + 66, 0, 11, 0, TAU); g.fillStyle = blink > .5 ? CORAL : '#6b2a2a'; g.fill();
    if (blink > .5) { g.beginPath(); g.arc(-HW / 2 + 66, 0, 20, 0, TAU); g.strokeStyle = CORAL; g.lineWidth = 3; g.stroke(); }
    txt(g, 'BEFORE YOU GET BUSTED', 28, 3, 40, { wt: 900, st: 'condensed', col: INK, ls: 1 });
    g.restore();
    /* GTA 6 under the tape */
    pill(g, HX, HY + 64, 1);
    g.restore();
  }
  function pill(g, x, y, k) {
    g.save(); g.globalAlpha *= k; var w = tw(g, 'GTA 6', 32) + 30;
    rr(g, x, y - 22, w, 44, 22); g.fillStyle = CORAL; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    txt(g, 'GTA 6', x + w / 2, y + 1, 32, { wt: 900, col: CREAM }); g.restore();
  }
  var TPX = 150;
  function title(g, t) {
    /* frame 0: BEFORE YOU / GET BUSTED, huge; on "busted" it flies into the header tape; it slams back for the loop */
    var fly = eio(seg(t, T.dock, T.dock + .32)), back = t >= T.back + .03;
    if (fly >= 1 && !back) return;
    var k = back ? 0 : fly, a = back ? seg(t, T.back + .03, T.back + .13) : 1 - seg(fly, .7, 1);
    var cx = lerp(MID, HX + HW / 2 + 28, k), cy = lerp(330, HY, k), s = lerp(1, 40 / TPX * 1.4, k);
    var bs = 1;
    var drift = back ? -14 * (t - DUR) : -14 * t;   // the headline drifts up a touch while it is the hook
    g.save(); g.globalAlpha *= a; g.translate(cx, cy + drift * (1 - k)); g.scale(s * bs, s * bs);
    K.sticker(g, 'BEFORE YOU', 0, -78, TPX, { col: CREAM, wide: false, lw: TPX * .14 });
    K.sticker(g, 'GET BUSTED', 0, 78, TPX, { col: CORAL, wide: false, lw: TPX * .14 });
    g.restore();
    var pk = back ? seg(t, T.back + .08, T.back + .18) : eo(seg(t, T.gta, T.gta + .15)) * (1 - seg(t, T.dock, T.dock + .2));
    if (pk > 0) pill(g, MID - 62, 158 + drift * (back ? 0 : 1) * .5, pk);
  }

  /* ---------- the manila STEP tag (top right), flips on each step word ---------- */
  function stepTag(g, t) {
    var k = seg(t, T.dock + .1, T.dock + .35) * (1 - seg(t, T.back, T.back + .15)); if (k <= 0) return;
    var n = 0, flip = 1; T.step.forEach(function (s, i) { if (t >= s + .1) n = i + 1; var f = Math.abs(seg(t, s - .1, s + .3) - .5) * 2; if (t > s - .1 && t < s + .3) flip = Math.min(flip, f); });
    var cx = 840, cy = 128, w = 168, h = 150;
    g.save(); g.globalAlpha *= k; g.translate(cx, cy); g.rotate(.05 + .02 * Math.sin(t * 1.7)); g.scale(Math.max(.02, flip), 1);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 6, -h / 2 + 8, w, h, 10); g.fill();
    g.beginPath(); g.moveTo(-w / 2 + 26, -h / 2); g.lineTo(w / 2 - 26, -h / 2); g.lineTo(w / 2, -h / 2 + 26); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.lineTo(-w / 2, -h / 2 + 26); g.closePath();
    g.fillStyle = n === 4 ? CORAL : MANILA; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.arc(0, -h / 2 + 20, 9, 0, TAU); g.fillStyle = INK; g.fill();
    txt(g, n ? 'STEP' : 'STEPS', 0, -h / 2 + 50, 30, { fam: '"Geist Mono"', wt: 700, col: INK, ls: 3 });
    txt(g, n ? String(n) : '4', 0, 22, 96, { wt: 900, st: 'condensed', col: INK });
    g.restore();
    /* the string */
    g.save(); g.globalAlpha *= k; g.strokeStyle = 'rgba(246,239,226,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 2, cy - h / 2 + 12); g.quadraticCurveTo(cx - 40, cy - 110, cx - 70, cy - 120); g.stroke(); g.restore();
  }

  /* ---------- place cards (one per step) ---------- */
  var CARDS = [
    { title: 'AMMU-NATION', sub: 'WEAPON LOCKER · MOST STORES', src: 'GAMESRADAR+ · GAME RANT', k: 'gun' },
    { title: "PAY 'N' SPRAY", sub: 'REGISTER · FOR A FEE', src: 'GAMESRADAR+ · GAME RANT', k: 'car' },
    { title: 'FENCE', sub: 'DROP STASH BAGS FIRST', src: 'GAME RANT · NOV 20', k: 'bag' },
    { title: 'IMPOUND LOT', sub: 'BUSTED IN YOUR OWN CAR', src: 'GAMESRADAR+ · GAME RANT', k: 'car', alert: 1 },
    { title: 'ATM / BUCKME', sub: 'BUCKME UNLOCKS IN CH. 1', src: 'GAMESRADAR+ · POWERPYX', k: 'cash' }
  ];
  var CY0 = 482, CH = 222;
  function cardSpan(i) {
    return [[T.step[0], T.step[1]], [T.step[1], T.step[2]], [T.step[2], start('impound') + .05], [start('impound') + .05, T.step[3]], [T.step[3], T.brick]][i];
  }
  function card(g, t, i) {
    var sp = cardSpan(i), a = sp[0], b = sp[1];
    if (t < a - .05 || t > b + .25) return;
    var ein = eo(seg(t, a, a + .3)), eout = eio(seg(t, b - .05, b + .2));
    var dy = (1 - ein) * 70 - eout * 50, c = CARDS[i];
    g.save(); g.globalAlpha *= ein * (1 - eout); g.translate(MID, CY0 + CH / 2 + dy); g.scale(lerp(.94, 1, ein), lerp(.94, 1, ein)); g.translate(-MID, -(CY0 + CH / 2));
    var x = 110, w = 800;
    g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, x + 10, CY0 + 10, w, CH, 18); g.fill();
    rr(g, x, CY0, w, CH, 18); g.fillStyle = 'rgba(22,18,28,.94)'; g.fill(); g.lineWidth = 4; g.strokeStyle = c.alert ? '#f0a33a' : CREAM; g.stroke();
    /* icon disc */
    var bob = Math.sin(t * 3 + i) * 4;
    g.beginPath(); g.arc(x + 100, CY0 + 92 + bob, 66, 0, TAU); g.fillStyle = c.alert ? '#f0a33a' : CORAL; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    g.save(); g.translate(x + 100, CY0 + 92 + bob); icon(g, c.k, .9, CREAM, t); g.restore();
    var tpx = Math.min(80, 80 * 560 / tw(g, c.title, 80, { st: 'condensed' }));
    txt(g, c.title, x + 196, CY0 + 70, tpx, { wt: 900, st: 'condensed', align: 'left', col: CREAM });
    txt(g, c.sub, x + 198, CY0 + 132, 32, { fam: '"Geist Mono"', wt: 700, align: 'left', col: c.alert ? '#f0a33a' : CORAL, ls: 1 });
    /* the source chip on the card foot */
    txt(g, c.src, x + 30, CY0 + 190, 30, { fam: '"Geist Mono"', wt: 600, align: 'left', col: 'rgba(246,239,226,.82)', ls: 2 });
    g.restore();
  }

  /* ---------- props in the middle band (y 740-1060) ---------- */
  function slideIn(t, a, b) { return (1 - eo(seg(t, a, a + .3))) * 160 - eio(seg(t, b - .2, b + .1)) * 120; }
  function fadeIn(t, a, b) { return seg(t, a, a + .18) * (1 - seg(t, b - .15, b + .1)); }
  function stampAt(g, s, x, y, px, u, rot, col, fill) {
    if (u < 0) return; var sc = lerp(1.8, 1, eo(clamp(u / .12, 0, 1))) - .07 * knock(u, .12, 1, 26, 7);
    g.save(); g.translate(x, y); g.rotate(rot || -.06); g.scale(sc, sc); g.globalAlpha *= clamp(u / .05, 0, 1);
    var w = tw(g, s, px, { st: 'condensed', ls: 3 }) + px * 1.1, h = px * 1.6;
    rr(g, -w / 2, -h / 2, w, h, 8);
    if (fill) { g.fillStyle = col; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); txt(g, s, 0, 3, px, { wt: 900, st: 'condensed', col: CREAM, ls: 3, stroke: INK, lw: 5 }); }
    else { g.fillStyle = 'rgba(246,239,226,.92)'; g.fill(); g.lineWidth = 7; g.strokeStyle = col; g.stroke(); txt(g, s, 0, 3, px, { wt: 900, st: 'condensed', col: col, ls: 3 }); }
    g.restore();
  }
  /* the steel property tray (q and the $20,000 frame) */
  function tray(g, cx, cy, s) {
    g.save(); g.translate(cx, cy); g.scale(s, s);
    g.beginPath(); g.moveTo(-380, -90); g.lineTo(380, -90); g.lineTo(420, 90); g.lineTo(-420, 90); g.closePath();
    var gr = g.createLinearGradient(0, -90, 0, 90); gr.addColorStop(0, '#8d929c'); gr.addColorStop(1, '#5d626c'); g.fillStyle = gr; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(-340, -60); g.lineTo(340, -60); g.lineTo(372, 64); g.lineTo(-372, 64); g.closePath(); g.fillStyle = '#4a4f58'; g.fill();
    g.beginPath(); g.moveTo(-420, 90); g.lineTo(420, 90); g.lineTo(420, 118); g.lineTo(-420, 118); g.closePath(); g.fillStyle = '#3b3f47'; g.fill(); g.stroke();
    g.restore();
  }
  function trayScene(g, t) {
    var a = T.q - .25, b = T.step[0] + .05; if (t < a || t > b + .3) return;
    var dy = (1 - eo(seg(t, a, a + .45))) * 500, out = eio(seg(t, b - .2, b + .25));
    g.save(); g.translate(out * -1000, dy);
    tray(g, MID, 920, 1);
    T.tray.forEach(function (tt, i) {
      var k = seg(t, tt, tt + .2); if (k <= 0) return;
      var y = lerp(560, 880, eo(k)) - 30 * knock(t, tt + .2, 1, 22, 8), x = 220 + i * 190;
      g.save(); g.translate(x, y); g.rotate((i % 2 ? .12 : -.1) + (1 - k) * .6); icon(g, ROWS[i].k, 1.35, CREAM); g.restore();
    });
    g.restore();
  }
  function gunScene(g, t) {
    /* step 1: a bought pistol with an OWNED tag, then the looted rifle drops and is stamped UNOWNED = LOST */
    var a = T.step[0], b = start('kept') + .2; if (t < a - .05 || t > b + .3) return;
    g.save(); g.globalAlpha *= fadeIn(t, a, b); g.translate(0, slideIn(t, a, b));
    var sw = Math.sin(t * 2.2) * .06;
    g.save(); g.translate(300, 900); g.rotate(-.08 + sw * .3); icon(g, 'gun', 2.3, CREAM); g.restore();
    g.save(); g.translate(300, 820); g.rotate(sw); g.strokeStyle = CREAM; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -60); g.stroke();
    rr(g, -80, -120, 160, 56, 8); g.fillStyle = MANILA; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    txt(g, 'OWNED', 0, -91, 36, { wt: 900, st: 'condensed', col: INK, ls: 2 }); g.restore();
    /* the looted rifle */
    var k = seg(t, T.lootDrop, T.lootDrop + .3);
    if (k > 0) {
      var y = lerp(620, 930, eo(k)) - 24 * knock(t, T.lootDrop + .3, 1, 22, 8);
      g.save(); g.translate(690, y); g.rotate(lerp(-.9, .06, eo(k))); icon(g, 'rifle', 2.4, '#cfc6b4'); g.restore();
      stampAt(g, 'UNOWNED = LOST', 615, 930, 46, t - T.lootStamp, -.08, OX, false);
    }
    g.restore();
  }
  function keptScene(g, t) {
    /* bought ones wait: weapon locker (left) and your trunk (right) */
    var a = start('kept') - .05, b = T.step[1]; if (t < a || t > b + .3) return;
    g.save(); g.globalAlpha *= fadeIn(t, a, b); g.translate(0, slideIn(t, a, b));
    [[290, 'LOCKER', T.lock], [730, 'TRUNK', T.trunk]].forEach(function (p, i) {
      var x = p[0], y = 872;
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x - 170 + 8, y - 150 + 10, 340, 280, 14); g.fill();
      rr(g, x - 170, y - 150, 340, 280, 14); g.fillStyle = i ? '#2a2d36' : '#5b6170'; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
      if (!i) { for (var r = 0; r < 4; r++) { g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x - 140, y - 126 + r * 16, 70, 6, 3); g.fill(); } }
      else { g.beginPath(); g.moveTo(x - 170, y - 150); g.lineTo(x - 140, y - 200); g.lineTo(x + 140, y - 200); g.lineTo(x + 170, y - 150); g.closePath(); g.fillStyle = '#3a3e4a'; g.fill(); g.stroke(); }
      var k = seg(t, p[2], p[2] + .25);
      if (k > 0) { g.save(); g.translate(x, lerp(y - 260, y, eo(k)) - 16 * knock(t, p[2] + .25, 1, 22, 8)); icon(g, 'gun', 1.6, CREAM); g.restore(); }
      var ck = eo(seg(t, p[2] + .25, p[2] + .45));
      if (ck > 0) { g.save(); g.lineCap = g.lineJoin = 'round'; g.strokeStyle = CORAL; g.lineWidth = 16; g.setLineDash([140 * ck, 400]); g.beginPath(); g.moveTo(x + 70, y + 60); g.lineTo(x + 100, y + 92); g.lineTo(x + 150, y + 30); g.stroke(); g.restore(); }
      txt(g, p[1], x, y + 100, 34, { fam: '"Geist Mono"', wt: 700, col: CREAM, ls: 3 });
    });
    g.restore();
  }
  /* our own flat car (side view): never Rockstar's model */
  function car(g, x, y, s, col, t, spin) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 7;
    g.beginPath(); g.moveTo(-200, 20); g.lineTo(-190, -30); g.lineTo(-90, -40); g.lineTo(-40, -90); g.lineTo(80, -90); g.lineTo(140, -40); g.lineTo(200, -30); g.lineTo(205, 20); g.closePath(); g.fillStyle = col; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-70, -42); g.lineTo(-30, -78); g.lineTo(20, -78); g.lineTo(20, -42); g.closePath(); g.fillStyle = '#9fc2d8'; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(34, -42); g.lineTo(34, -78); g.lineTo(76, -78); g.lineTo(118, -42); g.closePath(); g.fillStyle = '#9fc2d8'; g.fill(); g.stroke();
    [-120, 130].forEach(function (wx) { g.beginPath(); g.arc(wx, 22, 38, 0, TAU); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(wx, 22, 16, 0, TAU); g.fillStyle = '#bbb'; g.fill(); g.save(); g.translate(wx, 22); g.rotate(spin || 0); g.fillStyle = INK; g.fillRect(-3, -16, 6, 32); g.restore(); });
    g.restore();
  }
  function carScene(g, t) {
    /* step 2: our car rolls in, a REGISTERED sticker slaps on its window */
    var a = T.step[1], b = T.keyIn; if (t < a - .05 || t > b + .3) return;
    var kin = eo(seg(t, a, a + .55)), out = eio(seg(t, b - .2, b + .15));
    var x = lerp(-120, 510, kin) + out * 160;
    g.save(); g.globalAlpha *= 1 - out; car(g, x, 930, 1.6, CORAL, t, t * 9 * (1 - kin + out));
    var k = t - T.sticker - .1;
    if (k > 0) {
      var sc = lerp(2, 1, eo(clamp(k / .12, 0, 1)));
      g.save(); g.translate(x - 16 * 1.6 * .3 + 20, 930 - 60 * 1.6); g.rotate(-.12); g.scale(sc * .9, sc * .9); g.globalAlpha *= clamp(k / .05, 0, 1);
      rr(g, -110, -34, 220, 68, 6); g.fillStyle = CREAM; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
      txt(g, 'REGISTERED', 0, 2, 36, { wt: 900, st: 'condensed', col: INK, ls: 2 }); g.restore();
    }
    g.restore();
  }
  function stolenScene(g, t) {
    /* stolen cars are gone after an arrest: a key on a STOLEN tag swings, then drops out of frame */
    var a = T.keyIn, b = T.step[2]; if (t < a || t > b + .2) return;
    var kin = eo(seg(t, a, a + .3)), drop = seg(t, T.keyDrop, T.keyDrop + .45);
    g.save(); g.beginPath(); g.rect(0, 0, W, RY + 6); g.clip(); g.globalAlpha *= 1 - seg(drop, .15, .4);
    var x = 510, y = lerp(560, 860, kin) + 900 * drop * drop, sw = Math.sin((t - a) * 4) * .35 * Math.exp(-(t - a) * .8) + drop * 1.2;
    g.save(); g.translate(x, y); g.rotate(sw);
    g.strokeStyle = CREAM; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -150); g.lineTo(0, -40); g.stroke();
    g.save(); g.translate(0, 20); icon(g, 'car', 2.6, CREAM); g.restore();
    g.save(); g.translate(130, 150); g.rotate(-.2);
    rr(g, -120, -40, 240, 80, 10); g.fillStyle = MANILA; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.arc(-96, 0, 9, 0, TAU); g.fillStyle = INK; g.fill();
    txt(g, 'STOLEN', 16, 3, 50, { wt: 900, st: 'condensed', col: OX, ls: 3 }); g.restore();
    g.restore(); g.restore();
    if (drop > 0) { var gk = win(t, T.keyDrop + .1, b, .12, .15); if (gk > 0) { g.save(); g.globalAlpha *= gk; stampAt(g, 'GONE', 510, 880, 90, t - T.keyDrop - .1, -.08, OX, false); g.restore(); } }
  }
  function bagScene(g, t) {
    /* step 3: the duffel with its DROP FIRST tag hops off to the fence (right) */
    var a = T.step[2], b = start('impound') + .05; if (t < a - .05 || t > b + .3) return;
    var kin = eo(seg(t, a, a + .25)), go = eio(seg(t, T.bagGo - .05, T.bagGo + .5));
    var x = lerp(150, 330, kin) + go * 220, y = 920 - Math.abs(Math.sin(go * Math.PI * 2)) * 80 * (go > 0 && go < 1 ? 1 : 0);
    g.save(); g.globalAlpha *= kin * (1 - go);
    g.save(); g.translate(x, y); g.rotate(-.05 + go * .3); icon(g, 'bag', 2.8, '#3d4a3a');
    g.restore();
    g.save(); g.translate(x + 90, y - 140); g.rotate(.14 + Math.sin(t * 3) * .08);
    g.strokeStyle = CREAM; g.lineWidth = 3; g.beginPath(); g.moveTo(-60, 40); g.lineTo(-40, 10); g.stroke();
    rr(g, -60, -40, 230, 70, 8); g.fillStyle = MANILA; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    txt(g, 'DROP FIRST', 55, -4, 40, { wt: 900, st: 'condensed', col: INK, ls: 2 }); g.restore();
    /* a drawn arrow toward the fence */
    var ak = eo(seg(t, a + .4, a + .8)) * (1 - go);
    if (ak > 0) { g.save(); g.globalAlpha *= ak; K.arrow(g, 600, 900, 880, 900, ak, CORAL, 14, -.2); g.restore(); }
    g.restore();
  }
  function impoundScene(g, t) {
    /* the dip: our registered car again, a tow hook drops from the top and lifts it, IMPOUNDED tag swings on */
    var a = start('impound') - .05, b = T.step[3] + .25; if (t < a || t > b + .3) return;
    var kin = eo(seg(t, a, a + .4)), lift = eio(seg(t, T.impounded, T.impounded + .5)), out = eio(seg(t, b - .2, b + .2));
    var cx = lerp(-80, 510, kin), cy = 960 - lift * 70;
    var hookY = lerp(712, cy - 150, eo(seg(t, T.hook - .15, T.hook + .25)));
    g.save(); g.globalAlpha *= kin * (1 - out);
    g.strokeStyle = '#c9ccd3'; g.lineWidth = 8; g.beginPath(); g.moveTo(cx, 712); g.lineTo(cx, hookY); g.stroke();
    g.save(); g.translate(cx, hookY); g.lineWidth = 14; g.strokeStyle = '#c9ccd3'; g.lineCap = 'round'; g.beginPath(); g.arc(0, 34, 30, -Math.PI * .5, Math.PI * .9); g.stroke(); g.restore();
    g.save(); g.translate(cx, cy); g.rotate(lift * -.05 + Math.sin(t * 4) * .02 * lift); car(g, 0, 0, 1.45, CORAL, t, 0); g.restore();
    /* the REGISTERED sticker is still on it */
    g.save(); g.translate(cx - 20, cy - 92); g.rotate(-.12 + lift * -.05); rr(g, -88, -26, 176, 52, 6); g.fillStyle = CREAM; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    txt(g, 'REGISTERED', 0, 2, 30, { wt: 900, st: 'condensed', col: INK, ls: 1 }); g.restore();
    if (t >= T.impounded) stampAt(g, 'IMPOUNDED', MID, 1022, 48, t - T.impounded, -.06, '#f0a33a', true);
    g.restore();
  }
  function atmScene(g, t) {
    /* step 4: an ATM front with the BuckMe screen; the $20,000 brick goes in on T.bank */
    var a = T.step[3], b = T.brick; var after = t >= T.bank - .35 && t < T.bank + .55;
    if (!(t >= a - .05 && t < b + .3) && !after) return;
    var al = after ? seg(t, T.bank - .35, T.bank - .15) * (1 - seg(t, T.bank + .3, T.bank + .5)) : seg(t, a, a + .2) * (1 - seg(t, b - .1, b + .15));
    var dy = after ? (1 - eo(seg(t, T.bank - .35, T.bank - .05))) * 120 : (1 - eo(seg(t, a, a + .3))) * 140;
    if (al <= 0) return;
    var x = 510, y = 885 + dy;
    g.save(); g.globalAlpha *= al; g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, -250 + 10, -170 + 10, 500, 320, 18); g.fill();
    rr(g, -250, -170, 500, 320, 18); g.fillStyle = '#4e5562'; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    rr(g, -170, -140, 340, 130, 10); g.fillStyle = '#1d3b2e'; g.fill(); g.stroke();
    txt(g, 'BUCKME', 0, -96, 44, { wt: 900, st: 'condensed', col: '#9df0b8', ls: 4 });
    txt(g, 'DEPOSIT', 0, -46, 30, { fam: '"Geist Mono"', wt: 700, col: '#9df0b8', ls: 3 });
    rr(g, -150, 30, 300, 26, 13); g.fillStyle = INK; g.fill();
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) { rr(g, -70 + c * 50, 76 + r * 22, 40, 16, 4); g.fillStyle = '#c9ccd3'; g.fill(); }
    g.restore();
  }
  function brickScene(g, t) {
    /* the DM frame: $20,000 on the tray, seized on "Guides"; then it slides into the ATM slot and the row is kept */
    var a = T.brick - .05, b = T.bank + .3; if (t < a || t > b) return;
    var kin = eo(seg(t, a, a + .35)), go = eio(seg(t, T.bank - .05, T.bank + .3));
    tray(g, MID, 1110 + (1 - kin) * 400 + go * 500, .95);
    var bx = MID, by = lerp(1400, 1010, kin) + go * 60, bs = lerp(1, .25, go);
    g.save(); g.translate(bx, by - go * 155); g.scale(bs, bs);
    for (var i = 3; i >= 0; i--) { g.save(); g.translate(i * 6, 60 - i * 40); icon(g, 'cash', 3.4, '#cfe8bf', t, 2.6); g.restore(); }
    g.restore();
    var lk = (1 - seg(t, T.bank - .05, T.bank + .1)) * kin;
    if (lk > 0) {
      g.save(); g.globalAlpha *= lk;
      K.sticker(g, '$20,000', MID, 600, 170, { col: CREAM, wide: false, lw: 22 });
      txt(g, 'MAX POCKET CASH, PER CHARACTER', MID, 712, 36, { fam: '"Geist Mono"', wt: 700, col: TAPE, ls: 1, stroke: INK, lw: 6 });
      if (t >= T.seize) stampAt(g, 'COPS TAKE IT', MID, 1280, 72, t - T.seize, -.07, OX, true);
      if (t >= T.seize + .2) txt(g, 'PER GAME RANT · GAMESRADAR+', MID, 1385, 32, { fam: '"Geist Mono"', wt: 700, col: CREAM, ls: 1, stroke: INK, lw: 6 });
      g.restore();
    }
  }
  function goneStamp(g, t) {
    /* stake: GONE FOR GOOD slams across the receipt, peels off before the question */
    if (t < T.gone || t > T.goneOut + .3) return;
    var pe = eio(seg(t, T.goneOut, T.goneOut + .3));
    g.save(); g.globalAlpha *= 1 - pe; g.translate(MID, 930 - pe * 160); g.rotate(pe * .25); g.translate(-MID, -930);
    stampAt(g, 'GONE FOR GOOD', MID, 930, 86, t - T.gone, -.09, OX, true);
    g.restore();
  }
  function fine(g, t) {
    /* fine print that scopes a step, held long enough to read */
    var k = win(t, T.lootStamp + .15, T.tear[0], .2, .2);
    if (k > 0) { g.save(); g.globalAlpha *= k; txt(g, 'EXCEPT GOLD-ICON UNIQUE VARIANTS', MID, 1046, 36, { fam: '"Geist Mono"', wt: 700, col: TAPE, ls: 0, stroke: INK, lw: 6 }); g.restore(); }
    k = win(t, T.step[3] + .1, T.brick, .15, .15);
    if (k > 0) { g.save(); g.globalAlpha *= k; txt(g, 'BANK = SAFER, NOT FREE', MID, 1046, 36, { fam: '"Geist Mono"', wt: 700, col: TAPE, ls: 1, stroke: INK, lw: 6 }); g.restore(); }
  }
  function bankLineUnused(g, t) {
    /* the 4/4 hero: KEPT 4/4 big, fine print BANK = SAFER, NOT FREE */
    var a = T.tear[3] + .14, b = T.end + .1; if (t < a || t > b + .2) return;
    var k = win(t, a, b + .2, .12, .25);
    g.save(); g.globalAlpha *= k;
    stampAt(g, 'ALL 4 KEPT', MID, 610, 92, t - a, -.06, CORAL, true);
    txt(g, 'BANK = SAFER, NOT FREE · SMALL FEES FROM CH. 2', MID, 712, 30, { fam: '"Geist Mono"', wt: 700, col: TAPE, ls: 0, stroke: INK, lw: 6 });
    g.restore();
  }
  var EPX = 120;
  function endCard(g, t) {
    var a = T.bank + .06, b = T.back; if (t < a - .05 || t > b + .15) return;
    var k = 1 - seg(t, b, b + .12);
    g.save(); g.globalAlpha *= k;
    K.slam(g, 'HOW MUCH', MID, 640, EPX, t - a, { col: CREAM, wide: false, rot: -.03, from: 1.08 });
    K.slam(g, 'ON YOU?', MID, 790, EPX, t - a - .12, { col: CORAL, wide: false, rot: -.03, from: 1.08 });
    /* a pocket that bounces: the viewer's own */
    var bob = Math.sin((t - a) * 5) * 10;
    g.save(); g.globalAlpha *= seg(t, T.bank + .4, T.bank + .6); g.translate(MID, 950 + bob + 60 * (1 - eo(seg(t, T.bank + .4, T.bank + .7)))); g.rotate(-.05);
    g.beginPath(); g.moveTo(-110, -50); g.lineTo(110, -50); g.lineTo(96, 50); g.quadraticCurveTo(0, 96, -96, 50); g.closePath(); g.fillStyle = '#34507a'; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    g.setLineDash([10, 8]); g.strokeStyle = MANILA; g.lineWidth = 3; g.beginPath(); g.moveTo(-96, -34); g.lineTo(96, -34); g.stroke(); g.setLineDash([]);
    g.save(); g.translate(30, -62 + Math.sin((t - a) * 3) * 6); g.rotate(-.3); icon(g, 'cash', 1.1, '#cfe8bf'); g.restore();
    g.restore();
    g.restore();
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    plates(g, t);
    trayScene(g, t);
    for (var i = 0; i < 5; i++) card(g, t, i);
    gunScene(g, t); keptScene(g, t); carScene(g, t); stolenScene(g, t); bagScene(g, t); impoundScene(g, t);
    atmScene(g, t); brickScene(g, t);
    receipt(g, t);
    goneStamp(g, t);
    fine(g, t);
    endCard(g, t);
    header(g, t); stepTag(g, t);
    /* step 4 ribbon */
    var rk = win(t, T.step[3] + .1, T.brick, .15, .2);
    if (rk > 0) { g.save(); g.globalAlpha *= rk; g.translate(510, 462); g.rotate(-.03); var w = tw(g, 'THE MOST IMPORTANT ONE', 40, { st: 'condensed', ls: 2 }) + 50; g.fillStyle = CORAL; rr(g, -w / 2, -30, w, 60, 8); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); txt(g, 'THE MOST IMPORTANT ONE', 0, 2, 40, { wt: 900, st: 'condensed', col: INK, ls: 2 }); g.restore(); }
    title(g, t);
    captions(g, t);
  }
  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (t < .01 || t > DUR - .04) samples = 1;
    if (samples === 1) { frame(ctx, t); return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) { frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR)); actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0); }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- readcheck ---------- */
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('title', 'BEFORE YOU GET BUSTED', 0, T.dock); Tx('title', 'BEFORE YOU GET BUSTED', T.dock + .3, T.back); Tx('title', 'BEFORE YOU GET BUSTED', T.back + .13, DUR + 1);
    Tx('gone', 'GONE FOR GOOD', T.gone + .12, T.goneOut);
    for (var i = 0; i < 5; i++) { var sp = cardSpan(i); Tx('card' + i, CARDS[i].title, sp[0] + .3, sp[1] - .05); Tx('sub' + i, CARDS[i].sub, sp[0] + .3, sp[1] - .05); }
    Tx('owned', 'UNOWNED = LOST', T.lootStamp + .12, start('kept') + .1);
    Tx('fine', 'EXCEPT GOLD-ICON UNIQUE VARIANTS', T.lootStamp + .35, T.tear[0] - .2);
    Tx('bank', 'BANK = SAFER, NOT FREE', T.step[3] + .25, T.brick - .15);
    Tx('stolen', 'STOLEN', T.keyIn + .3, T.keyDrop);
    Tx('drop', 'DROP FIRST', T.step[2] + .2, T.bagGo + .05);
    Tx('imp', 'IMPOUNDED', T.impounded + .12, T.step[3] + .1);
    Tx('dm', '$20,000', T.brick + .35, T.bank);
    Tx('seize', 'COPS TAKE IT', T.seize + .12, T.bank);
    Tx('end', 'HOW MUCH ON YOU?', T.bank + .32, T.back);
    return o;
  }

  /* ---------- safe-area check: every glyph box inside x 90-930 and above y 1450 ---------- */
  var BOUNDS = null, CURT = 0;
  function watch(g) {
    ['fillText', 'strokeText'].forEach(function (fn) {
      var orig = g[fn];
      g[fn] = function (str, x, y) {
        if (BOUNDS && g.globalAlpha > .05) {
          var mm = this.measureText(str), m = this.getTransform(), xs = [], ys = [];
          var x0 = x - mm.actualBoundingBoxLeft, x1 = x + mm.actualBoundingBoxRight, y0 = y - mm.actualBoundingBoxAscent, y1 = y + mm.actualBoundingBoxDescent;
          [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
          var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys), d = Math.min.apply(null, ys);
          if (d < H && b > 0 && a < W && (a < 89.5 || b > 930.5 || c > 1450.5)) BOUNDS.push({ t: CURT, text: str, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
        }
        return orig.apply(this, arguments);
      };
    });
  }

  function SCORE(ac) { K.score(ac, EV, DUR); }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function init(canvas) {
    canvas.width = W; canvas.height = H; ctx = canvas.getContext('2d'); watch(ctx);
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d'); watch(tctx);
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 84px Archivo', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0$–·→'); }))).then(function () {
      initTimes(); buildChunks(ctx);
      TPX = Math.min(160, Math.floor(160 * 820 / Math.max(K.measure(ctx, 'BEFORE YOU', 160, { wide: false }), K.measure(ctx, 'GET BUSTED', 160, { wide: false }))));
      EPX = Math.min(150, Math.floor(150 * 700 / Math.max(K.measure(ctx, 'HOW MUCH', 150, { wide: false }), K.measure(ctx, 'ON YOU?', 150, { wide: false }))));
      window.FILM.POSTER = T.seize + .6;
      window.FILM.SHOTS = [
        { id: 'hook', name: 'Before you get busted', t0: 0, t1: T.q },
        { id: 'q', name: 'What the cops take', t0: T.q, t1: T.step[0] },
        { id: 'gun', name: '1 Ammu-Nation', t0: T.step[0], t1: T.step[1] },
        { id: 'car', name: "2 Pay 'n' Spray", t0: T.step[1], t1: T.step[2] },
        { id: 'bags', name: '3 Fence', t0: T.step[2], t1: T.step[3] },
        { id: 'cash', name: '4 Bank your cash', t0: T.step[3], t1: T.end },
        { id: 'end', name: 'How much are you carrying?', t0: T.end, t1: DUR }];
      window.READY = true;
    });
  }
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1 }); r.to = b.t; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.CHUNKS_DEBUG = function () { return CHUNKS.map(function (c) { return c.rows.map(function (r) { return r.map(function (w) { return w.w; }).join(' '); }).join(' / '); }); };

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: 2, SLUG: 'gta-busted', SHOTS: [], LIVE: {}, init: init, render: render, frame: frame, T: T };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
