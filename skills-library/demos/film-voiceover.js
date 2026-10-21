/* film-voiceover — Held's real narration (Kokoro af_heart, timed by Whisper) over a procedural score.
   Watch the duck envelope and the caption cards follow the words; switch between ducking from the words and a compressor. */
Lib.register('film-voiceover', {
  hint: 'Play with Sound on, then switch the duck between “From words” and “Compressor”',
  notes: [
    'Duck from word times: starts <code>0.2 s</code> before the first word, holds across gaps under <code>0.7 s</code>, releases over <code>0.5 s</code>',
    'Score −10 dB plus a −4 dB carve at 2.6 kHz under the voice; voice set to a 12 dB speech-to-music ratio',
    'Caption cards split at punctuation, then into even chunks (5 words → 3 + 2), never ending on “of”/“the”, none under 0.5 s',
    'Narration pace: 2.2–2.7 words/s for a launch film, 2.6–3.0 for an explainer; the check flags > 3.3',
    'Every line must survive Whisper twice: alone, and through the finished −14 LUFS mix'
  ],
  simplified: 'Plays the finished narration stem from film/; the score here is a small live pad, not Held’s. Synthesis, Whisper and the master run offline in film/tools/voiceover.py.',
  css: [
    '.d-film-voiceover canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }',
    '.d-film-voiceover .d-fvo-bar { position: absolute; left: 12px; right: 12px; bottom: 12px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }',
    '.d-film-voiceover button { appearance: none; border: 1px solid rgb(255 255 255 / .28); background: rgb(0 0 0 / .55); color: #fff; font: 500 10.5px/1 "Geist Mono", ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; padding: 9px 12px; border-radius: 999px; cursor: pointer; transition: border-color .2s ease, background-color .2s ease, transform .16s cubic-bezier(.23,1,.32,1); }',
    '.d-film-voiceover button:hover { border-color: #fff; }',
    '.d-film-voiceover button:active { transform: scale(.97); }',
    '.d-film-voiceover button[aria-pressed="true"] { background: #fff; color: #000; border-color: #fff; }',
    '.d-film-voiceover button:focus-visible, .d-film-voiceover input:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }',
    '.d-film-voiceover input[type=range] { flex: 1 1 120px; accent-color: #f97316; min-width: 100px; }',
    '.d-film-voiceover .d-fvo-seg { display: flex; gap: 4px; }',
    '.d-film-voiceover .d-fvo-note { position: absolute; right: 14px; top: 12px; color: rgb(255 255 255 / .45); font: 400 10.5px "Geist Mono", ui-monospace, monospace; letter-spacing: .08em; }'
  ].join('\n'),
  mount: function (stage, ctx) {
    var DUR = 34, audio = ctx.audio, SRC = '../film/vo/held-vo.mp3';
    /* film/out/vo/vo.json for Held: line start/end and each word's time */
    var LINES = [
      ['freeze', [['One', 2.0, 2.2], ['eight-thousandth', 2.2, 3.04], ['of', 3.04, 3.14], ['a', 3.14, 3.22], ['second.', 3.22, 3.52]]],
      ['run', [['Leave', 7.15, 7.39], ['it', 7.39, 7.53], ['open,', 7.53, 7.85], ['and', 8.23, 8.39], ['the', 8.39, 8.47], ['rain', 8.47, 8.65], ['falls.', 8.65, 8.99]]],
      ['night', [['Turn', 12.1, 12.34], ['it', 12.34, 12.52], ['up.', 12.52, 12.7], ['The', 13.02, 13.18], ['night', 13.18, 13.36], ['comes', 13.36, 13.66], ['back.', 13.66, 14.0]]],
      ['silk', [['Water', 19.95, 20.15], ['turns', 20.15, 20.49], ['to', 20.49, 20.73], ['silk.', 20.73, 21.01], ['Stars', 21.31, 21.67], ['stay', 21.67, 21.95], ['still.', 21.95, 22.29]]],
      ['holds', [['Most', 24.5, 24.76], ['cameras', 24.76, 24.98], ['stop', 24.98, 25.44], ['time.', 25.44, 25.68], ['This', 26.34, 26.36], ['one', 26.36, 26.52], ['holds', 26.52, 26.72], ['it.', 26.72, 27.0]]],
      ['name', [['Halden,', 28.05, 28.47], ['LF-1.', 28.47, 29.43], ['See', 29.43, 29.69], ['in', 29.69, 29.83], ['the', 29.83, 29.91], ['dark.', 29.91, 30.13]]]
    ];
    var QUIET = [[10.0, 11.6], [22.6, 24.3]];
    var WORDS = [];
    LINES.forEach(function (l) { l[1].forEach(function (w) { WORDS.push({ w: w[0], t0: w[1], t1: w[2] }); }); });

    /* caption cards: punctuation first, then even chunks of ≤ 3 words (the tool's rule, compact) */
    var CARDS = [], WEAK = /^(a|an|the|of|to|in|on|at|for|with|and|or|but|it|is)$/i;
    LINES.forEach(function (l) {
      var ph = [], cur = [];
      l[1].forEach(function (w) { cur.push({ w: w[0], t0: w[1], t1: w[2] }); if (/[.,!?]$/.test(w[0])) { ph.push(cur); cur = []; } });
      if (cur.length) ph.push(cur);
      ph.forEach(function (p) {
        var n = Math.min(p.length, Math.max(Math.ceil(p.length / 3), Math.ceil(p.map(function (w) { return w.w; }).join(' ').length / 18))), size = p.length / n;
        var ch = [];
        for (var i = 0; i < n; i++) ch.push(p.slice(Math.round(i * size), Math.round((i + 1) * size)));
        for (i = 0; i < ch.length - 1; i++) while (ch[i].length > 1 && WEAK.test(ch[i][ch[i].length - 1].w)) ch[i + 1].unshift(ch[i].pop());   // no card ends on "of"
        CARDS = CARDS.concat(ch);
      });
    });

    /* the duck: one pure function of t per mode */
    var MODES = {
      words: { lead: .2, bridge: .7, release: .5 },    // what voiceover.py does
      comp: { lead: -.06, bridge: .12, release: .25 }  // a sidechain compressor: late, and it pumps between words
    };
    function spans(m) {
      var out = [];
      WORDS.forEach(function (w) { var last = out[out.length - 1]; if (last && w.t0 - last[1] < m.bridge) last[1] = Math.max(last[1], w.t1); else out.push([w.t0, w.t1]); });
      return out;
    }
    var SPANS = { words: spans(MODES.words), comp: spans(MODES.comp) };
    function duck(t, mode) {
      if (mode === 'off') return 0;
      var m = MODES[mode], e = 0, lead = Math.abs(m.lead) || .01;
      SPANS[mode].forEach(function (s) {
        var a = s[0] - (m.lead > 0 ? m.lead : 0) + (m.lead < 0 ? -m.lead : 0);
        var up = ctx.clamp((t - a) / lead, 0, 1), down = ctx.clamp(1 - (t - s[1]) / m.release, 0, 1);
        e = Math.max(e, Math.min(up, down));
      });
      return .5 - .5 * Math.cos(Math.PI * e);
    }

    var cv = ctx.el('canvas'); stage.appendChild(cv);
    var g = cv.getContext('2d');
    var note = ctx.el('div', 'd-fvo-note'); stage.appendChild(note);
    var bar = ctx.el('div', 'd-fvo-bar');
    bar.innerHTML = '<button type="button" class="d-fvo-pp" aria-label="Play">Play</button>' +
      '<input type="range" min="0" max="34" step="0.01" value="0" aria-label="Film time in seconds">' +
      '<span class="d-fvo-seg" role="group" aria-label="Ducking"><button type="button" data-m="words" aria-pressed="true">From words</button><button type="button" data-m="comp" aria-pressed="false">Compressor</button><button type="button" data-m="off" aria-pressed="false">Off</button></span>';
    stage.appendChild(bar);
    var pp = bar.querySelector('.d-fvo-pp'), range = bar.querySelector('input'), modeBtns = bar.querySelectorAll('[data-m]');
    var mode = 'words', playing = false, t = ctx.reduced ? 2.6 : 1.4, W = 0, H = 0, dpr = 1;
    function size() { var f = ctx.fitCanvas(cv, stage, 2); W = f.w; H = f.h; dpr = f.dpr; }

    function draw() {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      var pad = Math.max(14, W * .04), x0 = pad, x1 = W - pad, tx = function (s) { return x0 + (x1 - x0) * s / DUR; };
      var big = Math.max(20, Math.min(W * .07, 58));
      var bottom = H - bar.offsetHeight - 30, lh = Math.max(14, H * .06), lv = Math.max(H * .44, bottom - H * .38), ls = lv + lh + 26;
      /* caption card, word by word: spoken 100 %, current accent, upcoming 45 % */
      var card = null;
      for (var i = 0; i < CARDS.length; i++) {
        var c = CARDS[i], end = Math.min(c[c.length - 1].t1 + .25, CARDS[i + 1] ? CARDS[i + 1][0].t0 : 99);
        if (t >= c[0].t0 && t < end) card = c;
      }
      g.font = '700 ' + big + 'px Archivo'; try { g.fontStretch = 'expanded'; } catch (e) {}
      g.textBaseline = 'alphabetic';
      if (card) {
        var widths = card.map(function (w) { return g.measureText(w.w + ' ').width; }), tot = widths.reduce(function (a, b) { return a + b; }, 0);
        var x = W / 2 - tot / 2, y = Math.min(H * .34, lv - lh - 40);
        card.forEach(function (w, k) {
          var cur = t >= w.t0 && t < w.t1, said = t >= w.t1;
          var rise = ctx.reduced ? 0 : (1 - ctx.clamp((t - card[0].t0) / .18, 0, 1)) * big * .25;
          g.fillStyle = cur ? '#f97316' : said ? '#fff' : 'rgba(255,255,255,.45)';
          g.fillText(w.w, x, y + rise); x += widths[k];
        });
      } else {
        var q = QUIET.some(function (r) { return t >= r[0] && t < r[1]; });
        var nxt = CARDS.filter(function (c) { return c[0].t0 > t; })[0];
        g.font = '500 10.5px "Geist Mono", monospace'; g.fillStyle = 'rgba(255,255,255,.45)'; g.textAlign = 'center';
        g.fillText(q ? 'QUIET WINDOW · THE VOICE LEAVES THIS ALONE' : nxt ? 'NEXT LINE IN ' + (nxt[0].t0 - t).toFixed(1) + ' S · SCORE AT FULL LEVEL' : 'END', W / 2, H * .3);
        g.textAlign = 'left';
      }
      /* lanes */
      g.font = '500 10.5px "Geist Mono", monospace';
      QUIET.forEach(function (r) { g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(tx(r[0]), lv - lh, tx(r[1]) - tx(r[0]), bottom - lv + lh); });
      g.fillStyle = 'rgba(255,255,255,.45)'; g.fillText('VOICE', x0, lv - lh - 6); g.fillText('SCORE GAIN (dB)', x0, ls - 6);
      WORDS.forEach(function (w) { g.fillStyle = t >= w.t0 ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.3)'; g.fillRect(tx(w.t0), lv - lh, Math.max(1, tx(w.t1) - tx(w.t0) - 1), lh); });
      /* duck envelope: 0 dB at the top of the lane, −10 dB at the bottom */
      var top = ls + 4, low = bottom;
      g.strokeStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.moveTo(x0, top); g.lineTo(x1, top); g.moveTo(x0, low); g.lineTo(x1, low); g.stroke();
      g.strokeStyle = '#f97316'; g.lineWidth = 1.5; g.beginPath();
      for (var px = 0; px <= x1 - x0; px += 1) { var s = px / (x1 - x0) * DUR, yy = top + (low - top) * duck(s, mode); if (px) g.lineTo(x0 + px, yy); else g.moveTo(x0, yy); }
      g.stroke(); g.lineWidth = 1;
      g.fillStyle = 'rgba(255,255,255,.45)'; g.fillText('0', x1 - 8, top - 3); g.fillText('−10', x1 - 22, low - 4);
      /* playhead */
      g.fillStyle = '#fff'; g.fillRect(tx(t), lv - lh - 2, 1, low - lv + lh + 4);
      g.textAlign = 'right'; g.fillText(t.toFixed(2) + ' s', x1, lv - lh - 6); g.textAlign = 'left';
    }

    /* sound: the real narration stem + a live pad, the pad ducked and carved by the same function */
    var A = null, voBuf = null, loading = false;
    function load() {
      if (voBuf || loading || !audio.ctx) return;
      loading = true;
      fetch(SRC).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function (b) { return new Promise(function (res, rej) { audio.ctx.decodeAudioData(b, res, rej); }); })
        .then(function (b) { voBuf = b; if (playing) startSound(); syncNote(); })
        .catch(function () { note.textContent = 'Narration file not found (open from the repo or the live site)'; });
    }
    function startSound() {
      stopSound();
      if (!audio.on || !audio.ctx || !voBuf) return;
      var c = audio.ctx, at = c.currentTime + .03;
      A = { nodes: [] };
      A.score = c.createGain(); A.score.gain.value = .22;
      A.carve = c.createBiquadFilter(); A.carve.type = 'peaking'; A.carve.frequency.value = 2600; A.carve.Q.value = .9; A.carve.gain.value = 0;
      A.carve.connect(A.score); A.score.connect(audio.out);
      [146.83, 220, 293.66, 369.99, 440].forEach(function (f, i) {    // D major-ish pad, slightly detuned pairs
        [-4, 4].forEach(function (d) {
          var o = c.createOscillator(), og = c.createGain(); o.type = i % 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.detune.value = d;
          og.gain.value = .045 / (i + 1); var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
          o.connect(lp).connect(og).connect(A.carve); o.start(at); A.nodes.push(o);
        });
      });
      var n = c.createBufferSource(); n.buffer = audio.noise(); n.loop = true;
      var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = .5;
      var ng = c.createGain(); ng.gain.value = .25; n.connect(bp).connect(ng).connect(A.carve); n.start(at); A.nodes.push(n);
      A.vo = c.createBufferSource(); A.vo.buffer = voBuf;
      var vg = c.createGain(); vg.gain.value = .9; A.vo.connect(vg).connect(audio.out); A.vo.start(at, t); A.nodes.push(A.vo);
      A.t0 = at - t;
    }
    function stopSound() { if (!A) return; A.nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); try { A.score.disconnect(); } catch (e) {} A = null; }
    function syncNote() { if (note.textContent.indexOf('not found') < 0) note.textContent = audio.on ? '' : 'Turn Sound on (top right) to hear this'; }
    audio.onChange(function (on) { syncNote(); if (on) { load(); if (playing) startSound(); } else stopSound(); });

    function ui() { range.value = t.toFixed(2); pp.textContent = playing ? 'Pause' : 'Play'; pp.setAttribute('aria-label', playing ? 'Pause' : 'Play'); }
    var loop = ctx.loop(function (dt) {
      if (playing) {
        t = A && audio.ctx ? audio.ctx.currentTime - A.t0 : t + dt;
        if (t >= DUR) { t = 0; if (A) startSound(); }
        if (A) {
          var e = duck(t, mode), now = audio.ctx.currentTime;
          A.score.gain.setTargetAtTime(.22 * Math.pow(10, -10 * e / 20), now, .015);
          A.carve.gain.setTargetAtTime(-4 * e, now, .015);
        }
      }
      draw(); ui();
    });
    pp.addEventListener('click', function () {
      playing = !playing;
      if (playing) { if (audio.on) { load(); startSound(); } } else stopSound();
      ui();
    });
    range.addEventListener('input', function () { t = +range.value; if (playing && A) startSound(); draw(); });
    modeBtns.forEach(function (b) { b.addEventListener('click', function () { mode = b.dataset.m; modeBtns.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); }); draw(); }); });
    var ro = new ResizeObserver(function () { size(); draw(); });
    return {
      start: function () { size(); ro.observe(stage); syncNote(); if (audio.on) load(); draw(); ui(); loop.start(); },
      stop: function () { loop.stop(); ro.disconnect(); playing = false; stopSound(); ui(); },
      replay: function () { t = 0; playing = true; if (audio.on) { load(); startSound(); } ui(); }
    };
  }
});
