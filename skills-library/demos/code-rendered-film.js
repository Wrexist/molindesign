/* code-rendered-film — a 6 s film whose every frame is a pure function of t.
   Scrub it, step it, turn on motion blur, or draw a contact sheet: all from the same render(t). */
Lib.register('code-rendered-film', {
  hint: 'Scrub the film, change the blur samples, or draw the contact sheet',
  notes: [
    'Contract: <code>DUR</code>, <code>render(t)</code>, <code>READY</code>, <code>EV</code>, <code>TEXTS(t)</code>; no timers, no <code>Date.now</code>, seeded RNG',
    'Streak length = drop velocity × shutter time (1/8000 → 1/15 s)',
    'Motion blur: average sub-frames over ½ a frame, frame k at alpha <code>1/(k+1)</code>',
    'Springs are closed-form step responses, summed one per target change',
    'Text holds ≥ letters/15 + 1.5 s; master at −14 LUFS, grain added in ffmpeg'
  ],
  simplified: 'No sound, no offline capture: the full pipeline (score, headless render, loudnorm) is in film/ and its 34 s film.',
  css: [
    '.d-code-rendered-film canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }',
    '.d-code-rendered-film .d-crf-bar { position: absolute; left: 12px; right: 12px; bottom: 12px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }',
    '.d-code-rendered-film button { appearance: none; border: 1px solid rgb(255 255 255 / .28); background: rgb(0 0 0 / .55); color: #fff; font: 500 10.5px/1 "Geist Mono", ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; padding: 9px 12px; border-radius: 999px; cursor: pointer; transition: border-color .2s ease, background-color .2s ease, transform .16s cubic-bezier(.23,1,.32,1); }',
    '.d-code-rendered-film button:hover { border-color: #fff; }',
    '.d-code-rendered-film button:active { transform: scale(.97); }',
    '.d-code-rendered-film button[aria-pressed="true"] { background: #fff; color: #000; border-color: #fff; }',
    '.d-code-rendered-film button:focus-visible, .d-code-rendered-film input:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }',
    '.d-code-rendered-film input[type=range] { flex: 1 1 140px; accent-color: #f97316; min-width: 120px; }',
    '.d-code-rendered-film .d-crf-t { font: 400 11px "Geist Mono", ui-monospace, monospace; color: rgb(255 255 255 / .7); min-width: 7ch; font-variant-numeric: tabular-nums; }',
    '.d-code-rendered-film .d-crf-seg { display: flex; gap: 4px; }'
  ].join('\n'),
  mount: function (stage, ctx) {
    var DUR = 6, FPS = 30;
    var cv = ctx.el('canvas'); stage.appendChild(cv);
    var g = cv.getContext('2d');
    var bar = ctx.el('div', 'd-crf-bar');
    bar.innerHTML = '<button type="button" class="d-crf-pp" aria-label="Pause">Pause</button>' +
      '<input type="range" min="0" max="6" step="0.0333" value="0" aria-label="Film time in seconds">' +
      '<span class="d-crf-t">0.00 s</span>' +
      '<span class="d-crf-seg" role="group" aria-label="Motion blur samples"><button type="button" data-s="1" aria-pressed="false">1×</button><button type="button" data-s="4" aria-pressed="true">4×</button><button type="button" data-s="8" aria-pressed="false">8×</button></span>' +
      '<button type="button" class="d-crf-sheet" aria-pressed="false">Contact sheet</button>';
    stage.appendChild(bar);
    var pp = bar.querySelector('.d-crf-pp'), range = bar.querySelector('input'), tEl = bar.querySelector('.d-crf-t'), sheetBtn = bar.querySelector('.d-crf-sheet');
    var segBtns = bar.querySelectorAll('[data-s]');

    /* seeded world: nothing here changes after mount */
    function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    var r = mulberry(5), drops = [];
    for (var i = 0; i < 260; i++) drops.push({ x: r(), y: r(), z: .6 + r() * 3, b: .3 + r() * .7 });
    var SH = ['1/8000', '1/2000', '1/500', '1/125', '1/60', '1/15'], SHS = [1 / 8000, 1 / 2000, 1 / 500, 1 / 125, 1 / 60, 1 / 15];
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
    function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
    function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
    function spring(dt, f, z) { if (dt <= 0) return 0; var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt)); }

    var W = 0, H = 0, dpr = 1, tmp = document.createElement('canvas'), tg = tmp.getContext('2d');
    function size() { var f = ctx.fitCanvas(cv, stage, 2); W = f.w; H = f.h; dpr = f.dpr; tmp.width = cv.width; tmp.height = cv.height; }

    /* frame(t): the whole film. Pure function of t. */
    function frame(c, t, x0, y0, w, h) {
      c.save(); c.translate(x0, y0); c.beginPath(); c.rect(0, 0, w, h); c.clip();
      c.fillStyle = '#05070c'; c.fillRect(0, 0, w, h);
      var lamp = c.createRadialGradient(w * .9, -h * .1, 0, w * .9, -h * .1, w * .7);
      lamp.addColorStop(0, 'rgba(255,180,120,.35)'); lamp.addColorStop(1, 'rgba(255,180,120,0)'); c.fillStyle = lamp; c.fillRect(0, 0, w, h);
      var k = Math.min(SH.length - 1, Math.floor(seg(t, .6, 5.4) * SH.length)), E = SHS[k];
      var rate = .01 + .99 * seg(t, .6, 2);
      var tau = .01 * t + Math.max(0, t - .6) * .5 + Math.max(0, t - 2) * .5;
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      drops.forEach(function (d) {
        var v = h * 5.5 / d.z, y = ((d.y * (h + 200) + v * tau) % (h + 200)) - 100, x = d.x * w - v * .12 * tau % w;
        x = (x % w + w) % w;
        var L = v * E * rate, rad = Math.max(1, 4 / d.z * (w / 600));
        c.globalAlpha = d.b * (L > rad * 2 ? clamp(Math.pow(rad * 4 / L, .5), .25, .9) : .9);
        c.strokeStyle = 'rgb(255,214,170)'; c.lineWidth = L > rad * 2 ? Math.max(1, rad * .7) : rad * 1.6;
        c.beginPath(); c.moveTo(x + L * .12, y - L); c.lineTo(x, y + .01); c.stroke();
      });
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      /* readout: per-character roll on each shutter step */
      var since = t - (.6 + k * 4.8 / SH.length), fs = Math.max(11, w * .022);
      c.font = '500 ' + fs + 'px "Geist Mono", monospace'; c.fillStyle = 'rgba(255,255,255,.85)';
      var p = k === 0 ? 1 : eo(clamp(since / .22, 0, 1));
      c.globalAlpha = p; c.fillText(SH[k] + ' s', w * .05, h * .1 + fs * (1 - p) * 1.2);
      c.globalAlpha = .5; c.fillText('t = ' + t.toFixed(2), w * .05, h * .1 + fs * 1.6);
      /* title on a closed-form spring (critically damped) */
      var s = spring(t - .9, 1.4, .9);
      c.globalAlpha = clamp(s, 0, 1); c.fillStyle = '#fff';
      c.font = '700 ' + Math.max(16, w * .06) + 'px Archivo'; try { c.fontStretch = 'expanded'; } catch (e) {}
      c.fillText(t < 3 ? 'Freeze it.' : 'Or let it run.', w * .05, h * .82 + (1 - s) * h * .06);
      /* iris: 9 blades open at 0, close at the end */
      var R = t < .5 ? eo(seg(t, 0, .5)) : 1 - eio(seg(t, 5.5, 6));
      if (R < .999) {
        var rr = R * Math.hypot(w, h) * .62, n = 9, rot = .9 * (1 - R), pts = [];
        for (var j = 0; j < n; j++) pts.push([w / 2 + Math.cos(rot + j * 6.283 / n) * rr, h / 2 + Math.sin(rot + j * 6.283 / n) * rr]);
        c.beginPath(); c.rect(-2, -2, w + 4, h + 4); c.moveTo(pts[0][0], pts[0][1]); pts.forEach(function (q) { c.lineTo(q[0], q[1]); }); c.closePath();
        c.fillStyle = '#070707'; c.fill('evenodd');
      }
      c.restore();
    }
    var samples = 4, showSheet = false, playing = !ctx.reduced, t = ctx.reduced ? 2.8 : 0;
    function draw(tt) {
      if (showSheet) {
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        var cols = W < 520 ? 3 : 4, rows = cols === 3 ? 4 : 3, cw = W / cols, ch = (H - 56) / rows;
        for (var i = 0; i < cols * rows; i++) {
          var ft = (i + .5) / (cols * rows) * DUR;           // any frame, in any order
          frame(g, ft, (i % cols) * cw + 2, Math.floor(i / cols) * ch + 2, cw - 4, ch - 4);
        }
        return;
      }
      if (samples === 1) { g.setTransform(dpr, 0, 0, dpr, 0, 0); frame(g, tt, 0, 0, W, H); return; }
      var span = .5 / FPS * 6;   // exaggerated ×6 so the blur is visible at preview speed
      for (var k = 0; k < samples; k++) {
        tg.setTransform(dpr, 0, 0, dpr, 0, 0);
        frame(tg, clamp(tt - span / 2 + span * (k + .5) / samples, 0, DUR), 0, 0, W, H);
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = k === 0 ? 1 : 1 / (k + 1); g.drawImage(tmp, 0, 0);
      }
      g.globalAlpha = 1;
    }
    function ui() { range.value = t.toFixed(3); tEl.textContent = t.toFixed(2) + ' s'; pp.textContent = playing ? 'Pause' : 'Play'; pp.setAttribute('aria-label', playing ? 'Pause' : 'Play'); }
    var loop = ctx.loop(function (dt) { if (!playing) return; t = (t + dt) % DUR; draw(t); ui(); });
    pp.addEventListener('click', function () { playing = !playing; if (showSheet && playing) { showSheet = false; sheetBtn.setAttribute('aria-pressed', 'false'); } ui(); draw(t); });
    range.addEventListener('input', function () { playing = false; t = +range.value; draw(t); ui(); });
    segBtns.forEach(function (b) { b.addEventListener('click', function () { samples = +b.dataset.s; segBtns.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); }); draw(t); }); });
    sheetBtn.addEventListener('click', function () { showSheet = !showSheet; sheetBtn.setAttribute('aria-pressed', String(showSheet)); if (showSheet) playing = false; ui(); draw(t); });
    var ro = new ResizeObserver(function () { size(); draw(t); });
    return {
      start: function () { size(); ro.observe(stage); draw(t); ui(); loop.start(); },
      stop: function () { loop.stop(); ro.disconnect(); },
      replay: function () { t = 0; playing = true; showSheet = false; sheetBtn.setAttribute('aria-pressed', 'false'); ui(); }
    };
  }
});
