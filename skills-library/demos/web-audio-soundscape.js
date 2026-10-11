/* web-audio-soundscape — a live mixer on the shared ctx.audio engine: procedural music bed, place muffle, hover whooshes, stir texture. */
Lib.register('web-audio-soundscape', {
  hint: 'Turn sound on, switch Hall / Away, hover the pads and stir the pad below',
  notes: [
    'Off by default; the context is created on the first toggle click, muted with <code>out.gain.setTargetAtTime(on ? 1 : 0, now, .04)</code>',
    'Place by filter: Away = lowpass <code>300 Hz</code> and music gain 0, Hall = <code>20 kHz</code> and <code>.5</code>, both via <code>setTargetAtTime(…, .6)</code>',
    'Hover whoosh: noise → bandpass 1800→4200 Hz over .35 s (Q 1.2) → gain <code>.05</code> at 60 ms, decay τ .09, at most once per .6 s',
    'Stir: looping noise → bandpass <code>700 + 1900·v</code> Hz → gain <code>.045·v^.8</code>, attack .05, release .08',
    'Never above about −12 dBFS (gains ≤ .5); every cue also has a visual equivalent'
  ],
  simplified: 'The music bed and circuit hum are synthesized with oscillators instead of decoded mp3 loops (so no loopStart/loopEnd), and there are no scene one-shots. Meters read AnalyserNodes when sound is on and show the target mix when it is off.',
  css: `
.d-web-audio-soundscape { background: radial-gradient(90% 70% at 80% 0%, rgb(249 115 22 / .08), transparent 60%), #030303; }
.d-web-audio-soundscape .wa { position: absolute; inset: 0; padding: 16px 20px 18px; display: grid; gap: 14px; grid-template-columns: minmax(0, .8fr) minmax(0, 1.5fr); grid-template-rows: auto minmax(0, 1fr) auto minmax(0, 1.1fr); grid-template-areas: "top top" "met place" "met pads" "met stir"; }
.d-web-audio-soundscape.narrow .wa { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto 64px auto auto minmax(0, 1fr); grid-template-areas: "top" "met" "place" "pads" "stir"; gap: 10px; padding: 14px 16px 16px; }
.d-web-audio-soundscape .wa-top { grid-area: top; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.d-web-audio-soundscape .wa-top { flex-wrap: wrap; } .d-web-audio-soundscape .wa-top .wa-note { margin-left: auto; }
.d-web-audio-soundscape.narrow .wa-top .wa-note { order: 3; flex-basis: 100%; margin: 0; color: #f97316; }
.d-web-audio-soundscape.narrow .wa-top .wa-note:empty, .d-web-audio-soundscape.narrow .wa-long { display: none; }
.d-web-audio-soundscape .wa-top p { margin: 0; color: rgb(255 255 255 / .55); }
.d-web-audio-soundscape .wa-on { display: flex; align-items: center; gap: 10px; }
.d-web-audio-soundscape .wa-on button { white-space: nowrap; padding: 7px 12px; border-radius: 999px; background: #f97316; color: #000; }
.d-web-audio-soundscape .wa-met { grid-area: met; display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; min-height: 0; }
.d-web-audio-soundscape .wa-ch { display: grid; grid-template-rows: minmax(0, 1fr) auto auto; gap: 6px; min-height: 0; }
.d-web-audio-soundscape .wa-bar { display: flex; flex-direction: column-reverse; gap: 3px; min-height: 0; width: 22px; justify-self: center; padding: 3px; border: 1px solid rgb(255 255 255 / .1); border-radius: 3px; }
.d-web-audio-soundscape .wa-bar i { flex: 1; border-radius: 1px; background: rgb(255 255 255 / .07); transition: background .08s; }
.d-web-audio-soundscape .wa-bar i.on { background: rgb(255 255 255 / .8); } .d-web-audio-soundscape .wa-bar i.hot { background: #f97316; }
.d-web-audio-soundscape .wa-ch .label { margin: 0; color: rgb(255 255 255 / .55); text-align: center; font-size: 9px; letter-spacing: .06em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.d-web-audio-soundscape .wa-ch .v { color: rgb(255 255 255 / .85); font: 10px "Geist Mono", ui-monospace, monospace; text-align: center; margin: 0; }
.d-web-audio-soundscape.narrow .wa-ch { grid-template-rows: minmax(0, 1fr) auto; } .d-web-audio-soundscape.narrow .wa-ch .v { display: none; }
.d-web-audio-soundscape.narrow .wa-bar { flex-direction: row; } .d-web-audio-soundscape.narrow .wa-met { grid-template-columns: 1fr; grid-template-rows: repeat(5, 1fr); gap: 3px; }
.d-web-audio-soundscape.narrow .wa-ch { grid-template-columns: 58px 1fr; grid-template-rows: 1fr; align-items: center; } .d-web-audio-soundscape.narrow .wa-ch .label { order: -1; text-align: left; }
.d-web-audio-soundscape.narrow .wa-bar { padding: 2px; height: 100%; width: auto; justify-self: stretch; }
.d-web-audio-soundscape .wa-place { grid-area: place; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 6px 16px; align-items: center; border-top: 1px solid rgb(255 255 255 / .1); padding-top: 10px; }
.d-web-audio-soundscape .wa-place .label { margin: 0; color: rgb(255 255 255 / .5); }
.d-web-audio-soundscape .wa-seg { justify-self: start; display: inline-flex; border: 1px solid rgb(255 255 255 / .18); border-radius: 999px; padding: 3px; }
.d-web-audio-soundscape .wa-seg button { padding: 7px 14px; border-radius: 999px; color: rgb(255 255 255 / .65); transition: background .3s, color .3s; }
.d-web-audio-soundscape .wa-seg button[aria-pressed="true"] { background: #fff; color: #000; }
.d-web-audio-soundscape canvas.wa-curve { width: 100%; height: 100%; min-height: 40px; grid-row: span 2; }
.d-web-audio-soundscape .wa-place .ro { grid-column: 1; color: rgb(255 255 255 / .8); }
.d-web-audio-soundscape.narrow canvas.wa-curve { height: 64px; min-height: 0; }
.d-web-audio-soundscape .wa-pads { grid-area: pads; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.d-web-audio-soundscape .wa-pads button { position: relative; padding: 12px 6px; border-radius: 6px; border: 1px solid rgb(255 255 255 / .14); color: rgb(255 255 255 / .7); overflow: hidden; transition: border-color .3s, color .3s; }
.d-web-audio-soundscape .wa-pads button::after { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 50% 120%, rgb(249 115 22 / .55), transparent 70%); opacity: 0; transition: opacity .5s; }
.d-web-audio-soundscape .wa-pads button.hit { border-color: #f97316; color: #fff; } .d-web-audio-soundscape .wa-pads button.hit::after { opacity: 1; transition: none; }
.d-web-audio-soundscape .wa-pads button.thr { border-color: rgb(255 255 255 / .4); }
.d-web-audio-soundscape .wa-stir { grid-area: stir; position: relative; border: 1px dashed rgb(255 255 255 / .2); border-radius: 8px; touch-action: none; overflow: hidden; min-height: 70px; cursor: crosshair; }
.d-web-audio-soundscape .wa-stir canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.d-web-audio-soundscape .wa-stir .label { position: absolute; left: 12px; top: 10px; margin: 0; color: rgb(255 255 255 / .55); pointer-events: none; }
.d-web-audio-soundscape .wa-stir .ro { top: 28px; color: rgb(255 255 255 / .8); }
`,
  mount(stage, ctx) {
    var el = ctx.el, audio = ctx.audio, R = ctx.reduced;
    var root = el('div', 'wa');
    root.innerHTML =
      '<div class="wa-top"><p class="label">Mixer<span class="wa-long"> · <span class="accent">live Web Audio</span></span></p><p class="label wa-note"></p><div class="wa-on"><button type="button" class="label">Turn sound on</button></div></div>' +
      '<div class="wa-met"></div>' +
      '<div class="wa-place"><p class="label">Place</p><canvas class="wa-curve" aria-hidden="true"></canvas><div class="wa-seg" role="group" aria-label="Place"><button type="button" class="label" data-p="hall">Hall</button><button type="button" class="label" data-p="away">Away</button></div><p class="label ro"></p></div>' +
      '<div class="wa-pads"></div>' +
      '<div class="wa-stir" tabindex="0" role="slider" aria-label="Stir pad: pointer speed drives a noise texture. Arrow keys stir." aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-cursor="Stir"><canvas aria-hidden="true"></canvas><p class="label">Stir pad</p><p class="label ro"></p></div>';
    stage.appendChild(root);
    var $ = function (s) { return root.querySelector(s); };
    var note = $('.wa-note'), onBtn = $('.wa-on button'), curve = $('.wa-curve'), placeRo = $('.wa-place .ro'), stirEl = $('.wa-stir'), stirCv = stirEl.querySelector('canvas'), stirRo = stirEl.querySelector('.ro');
    var CH = ['Music', 'Circuit', 'Whoosh', 'Stir', 'Master'], meters = [];
    CH.forEach(function (n) {
      var ch = el('div', 'wa-ch'), bar = el('div', 'wa-bar'), segs = [];
      for (var i = 0; i < 14; i++) { var s = el('i'); bar.appendChild(s); segs.push(s); }
      ch.append(bar, el('p', 'label', n), el('p', 'v', '–'));
      $('.wa-met').appendChild(ch); meters.push({ segs: segs, v: ch.lastChild, lvl: 0 });
    });
    var pads = ['Index', 'Link', 'Chip', 'Drawer'].map(function (n) {
      var b = el('button', 'label', n); b.type = 'button'; $('.wa-pads').appendChild(b);
      b.addEventListener('pointerenter', function () { whoosh(b); }); b.addEventListener('focus', function () { whoosh(b); });
      b.addEventListener('click', function () { whoosh(b); });
      return b;
    });
    onBtn.addEventListener('click', function () { audio.toggle(true); });

    /* ---------- the mix ---------- */
    var running = false, G = null, place = 'hall', sim = { f: 20000, music: .5, circuit: 0 }, lastWhoosh = -9, stirV = 0, wEnv = 0;
    var CHORDS = [['Am7', [57, 60, 64, 67]], ['Fmaj7', [53, 57, 60, 64]], ['Cmaj7', [48, 55, 59, 64]], ['G6', [55, 59, 62, 64]]], chordIx = 0, nextAt = 0, timer = 0;
    var hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
    function build() {
      if (G || !audio.on || !audio.ctx || !running) return;
      var c = audio.ctx, t = c.currentTime, out = audio.out;
      var an = function () { var a = c.createAnalyser(); a.fftSize = 512; a.connect(out); return a; };
      G = { srcs: [], an: [an(), an(), an(), an()] };
      G.tone = c.createBiquadFilter(); G.tone.type = 'lowpass'; G.tone.frequency.value = 2400;
      G.muffle = c.createBiquadFilter(); G.muffle.type = 'lowpass'; G.muffle.frequency.value = place === 'hall' ? 20000 : 300;
      G.music = c.createGain(); G.music.gain.value = place === 'hall' ? .5 : 0;
      G.tone.connect(G.muffle).connect(G.music).connect(G.an[0]);
      // circuit bed: low hum + band-passed crackle, faded in when "away"
      G.circuit = c.createGain(); G.circuit.gain.value = place === 'away' ? .3 : 0; G.circuit.connect(G.an[1]);
      var hum = c.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 55;
      var hlp = c.createBiquadFilter(); hlp.type = 'lowpass'; hlp.frequency.value = 260; var hg = c.createGain(); hg.gain.value = .25;
      hum.connect(hlp).connect(hg).connect(G.circuit); hum.start(t);
      var crk = c.createBufferSource(); crk.buffer = audio.noise(); crk.loop = true;
      var cbp = c.createBiquadFilter(); cbp.type = 'bandpass'; cbp.frequency.value = 3200; cbp.Q.value = 6; var cg = c.createGain(); cg.gain.value = .12;
      var lfo = c.createOscillator(); lfo.frequency.value = 3.3; var lg = c.createGain(); lg.gain.value = .1; lfo.connect(lg).connect(cg.gain);
      crk.connect(cbp).connect(cg).connect(G.circuit); crk.start(t); lfo.start(t);
      G.whoosh = c.createGain(); G.whoosh.connect(G.an[2]);
      G.stirSrc = c.createBufferSource(); G.stirSrc.buffer = audio.noise(); G.stirSrc.loop = true;
      G.stirBp = c.createBiquadFilter(); G.stirBp.type = 'bandpass'; G.stirBp.frequency.value = 700;
      G.stirG = c.createGain(); G.stirG.gain.value = 0;
      G.stirSrc.connect(G.stirBp).connect(G.stirG).connect(G.an[3]); G.stirSrc.start(t);
      G.srcs.push(hum, crk, lfo, G.stirSrc);
      G.nodes = [G.tone, G.muffle, G.music, G.circuit, hlp, hg, cbp, cg, lg, G.whoosh, G.stirBp, G.stirG].concat(G.an);
      G.buf = new Float32Array(512);
      nextAt = t + .1; schedule();
      timer = setInterval(schedule, 250);
    }
    function schedule() { // look-ahead scheduler: chords every 4 s, bass + a soft bell arpeggio
      if (!G) return;
      var c = audio.ctx;
      while (nextAt < c.currentTime + 1.2) {
        var ch = CHORDS[chordIx % 4][1], t = nextAt, d = 4;
        ch.forEach(function (m, i) {
          ['triangle', 'sawtooth'].forEach(function (type, k) {
            var o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = hz(m); o.detune.value = k ? 7 : -5;
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(k ? .018 : .045, t + 1.1); g.gain.setTargetAtTime(0, t + d - .4, .5);
            o.connect(g).connect(G.tone); o.start(t); o.stop(t + d + 2.5); track(o, g);
          });
        });
        var b = c.createOscillator(), bg = c.createGain(); b.type = 'sine'; b.frequency.value = hz(ch[0] - 12);
        bg.gain.setValueAtTime(0, t); bg.gain.linearRampToValueAtTime(.12, t + .3); bg.gain.setTargetAtTime(0, t + d - .3, .4);
        b.connect(bg).connect(G.tone); b.start(t); b.stop(t + d + 2); track(b, bg);
        for (var s = 0; s < 8; s++) {
          var bt = t + s * .5, o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'sine'; o2.frequency.value = hz(ch[[0, 2, 1, 3, 2, 1, 3, 2][s]] + 12);
          g2.gain.setValueAtTime(0, bt); g2.gain.linearRampToValueAtTime(.03, bt + .01); g2.gain.setTargetAtTime(0, bt + .02, .25);
          o2.connect(g2).connect(G.tone); o2.start(bt); o2.stop(bt + 1.6); track(o2, g2);
        }
        nextAt += d; chordIx++;
      }
    }
    function track(o, g) { G.srcs.push(o); o.onended = function () { try { o.disconnect(); g.disconnect(); } catch (e) {} var i = G ? G.srcs.indexOf(o) : -1; if (i >= 0) G.srcs.splice(i, 1); }; }
    function teardown() {
      clearInterval(timer); timer = 0;
      if (!G) return;
      var g = G; G = null;
      g.srcs.slice().forEach(function (s) { s.onended = null; try { s.stop(); } catch (e) {} try { s.disconnect(); } catch (e) {} });
      g.nodes.forEach(function (n) { try { n.disconnect(); } catch (e) {} });
    }
    function setPlace(p) {
      place = p;
      root.querySelectorAll('.wa-seg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === p)); });
      if (G) {
        var t = audio.ctx.currentTime;
        G.muffle.frequency.setTargetAtTime(p === 'hall' ? 20000 : 300, t, .6);
        G.music.gain.setTargetAtTime(p === 'hall' ? .5 : 0, t, .6);
        G.circuit.gain.setTargetAtTime(p === 'hall' ? 0 : .3, t, .6);
      }
    }
    root.querySelectorAll('.wa-seg button').forEach(function (b) { b.addEventListener('click', function () { setPlace(b.dataset.p); }); });
    function whoosh(pad) {
      var now = performance.now() / 1000;
      if (now - lastWhoosh < .6) { pad.classList.add('thr'); setTimeout(function () { pad.classList.remove('thr'); }, 200); return; } // throttle .6 s
      lastWhoosh = now; wEnv = 1;
      pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit'); setTimeout(function () { pad.classList.remove('hit'); }, 60);
      if (!G) return;
      var c = audio.ctx, t = c.currentTime;
      var src = c.createBufferSource(); src.buffer = audio.noise();
      var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(1800, t); bp.frequency.linearRampToValueAtTime(4200, t + .35);
      var g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .06); g.gain.setTargetAtTime(0, t + .06, .09);
      src.connect(bp).connect(g).connect(G.whoosh); src.start(t, Math.random()); src.stop(t + .8);
      G.srcs.push(src); src.onended = function () { try { src.disconnect(); bp.disconnect(); g.disconnect(); } catch (e) {} if (G) { var i = G.srcs.indexOf(src); if (i >= 0) G.srcs.splice(i, 1); } };
    }

    /* ---------- stir pad ---------- */
    var trail = [], lastP = null, sw = 0, sh = 0, sdpr = 1;
    stirEl.addEventListener('pointermove', function (e) {
      var r = stirEl.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
      if (lastP) { var sp = Math.hypot(x - lastP.x, y - lastP.y) / Math.max(1, now - lastP.t) * 1000; stirV = Math.max(stirV, ctx.clamp(sp / 1600, 0, 1)); }
      lastP = { x: x, y: y, t: now }; trail.push({ x: x, y: y, a: 1 });
      if (trail.length > 60) trail.shift();
    });
    stirEl.addEventListener('pointerleave', function () { lastP = null; });
    stirEl.addEventListener('keydown', function (e) {
      if (/^Arrow/.test(e.key)) { e.preventDefault(); stirV = Math.min(1, stirV + .25); trail.push({ x: sw / 2 + (Math.random() - .5) * sw * .6, y: sh / 2 + (Math.random() - .5) * sh * .5, a: 1 }); }
    });

    /* ---------- frame: params, meters, visuals ---------- */
    var cc = curve.getContext('2d'), sc = stirCv.getContext('2d'), vSm = 0;
    function level(i) {
      if (!G) return null;
      var a = G.an[i], b = G.buf; a.getFloatTimeDomainData(b);
      var s = 0; for (var k = 0; k < b.length; k++) s += b[k] * b[k];
      return Math.sqrt(s / b.length);
    }
    function frame(dt) {
      // smooth the same way the audio params do (setTargetAtTime τ .6) so visuals match sound-off too
      var k = 1 - Math.exp(-dt / .6);
      sim.f = Math.exp(Math.log(sim.f) + (Math.log(place === 'hall' ? 20000 : 300) - Math.log(sim.f)) * k);
      sim.music += ((place === 'hall' ? .5 : 0) - sim.music) * k; sim.circuit += ((place === 'hall' ? 0 : .3) - sim.circuit) * k;
      stirV *= Math.exp(-dt * 3); vSm += (stirV - vSm) * (1 - Math.exp(-dt / (stirV > vSm ? .05 : .08)));
      wEnv *= Math.exp(-dt / .12);
      if (G) {
        var t = audio.ctx.currentTime;
        G.stirBp.frequency.setTargetAtTime(700 + 1900 * vSm, t, .05);
        G.stirG.gain.setTargetAtTime(.045 * Math.pow(vSm, .8), t, stirV > vSm ? .05 : .08);
      }
      var lv = G ? [level(0), level(1), level(2), level(3)].map(function (x) { return Math.min(1, x * 4); })
        : [sim.music * (.55 + (R ? 0 : .2 * Math.sin(performance.now() / 600))), sim.circuit * .8, wEnv * .7, Math.pow(vSm, .8) * .8];
      lv.push(Math.min(1, Math.max.apply(null, lv) * 1.05));
      meters.forEach(function (m, i) {
        m.lvl = Math.max(lv[i], m.lvl - dt * 1.6);
        var n = Math.round(m.lvl * 14);
        m.segs.forEach(function (s, j) { s.className = j < n ? (j >= 11 ? 'hot' : 'on') : ''; });
        var db = m.lvl > .001 ? (20 * Math.log10(m.lvl)).toFixed(0) + ' dB' : '−∞';
        if (m.v.textContent !== db) m.v.textContent = db;
      });
      // filter curve (log 20 Hz – 20 kHz)
      var r = curve.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      if (curve.width !== Math.round(r.width * d) || curve.height !== Math.round(r.height * d)) { curve.width = Math.round(r.width * d); curve.height = Math.round(r.height * d); }
      cc.setTransform(d, 0, 0, d, 0, 0); cc.clearRect(0, 0, r.width, r.height);
      var fc = G ? G.muffle.frequency.value : sim.f;
      cc.strokeStyle = 'rgba(255,255,255,.12)'; cc.lineWidth = 1;
      [100, 1000, 10000].forEach(function (f) { var x = Math.log(f / 20) / Math.log(1000) * r.width; cc.beginPath(); cc.moveTo(x, 0); cc.lineTo(x, r.height); cc.stroke(); });
      cc.beginPath();
      for (var x = 0; x <= r.width; x += 2) {
        var f = 20 * Math.pow(1000, x / r.width), mag = 1 / Math.sqrt(1 + Math.pow(f / fc, 4)); // 2nd-order lowpass magnitude
        var y = r.height - 4 - mag * (r.height - 10); x ? cc.lineTo(x, y) : cc.moveTo(x, y);
      }
      cc.strokeStyle = '#f97316'; cc.lineWidth = 1.5; cc.stroke();
      placeRo.textContent = 'lowpass ' + Math.round(fc).toLocaleString('en-US') + ' Hz · music ' + (G ? G.music.gain.value : sim.music).toFixed(2);
      // stir pad
      var sr = stirEl.getBoundingClientRect(); sw = sr.width; sh = sr.height; sdpr = Math.min(2, devicePixelRatio || 1);
      if (stirCv.width !== Math.round(sw * sdpr) || stirCv.height !== Math.round(sh * sdpr)) { stirCv.width = Math.round(sw * sdpr); stirCv.height = Math.round(sh * sdpr); }
      sc.setTransform(sdpr, 0, 0, sdpr, 0, 0); sc.clearRect(0, 0, sw, sh);
      sc.lineCap = 'round';
      for (var i = 1; i < trail.length; i++) {
        var p = trail[i], q = trail[i - 1]; p.a -= dt * 1.4;
        if (p.a <= 0) continue;
        sc.strokeStyle = 'rgba(249,115,22,' + (p.a * .9).toFixed(3) + ')'; sc.lineWidth = 1 + p.a * 5 * (.3 + vSm);
        sc.beginPath(); sc.moveTo(q.x, q.y); sc.lineTo(p.x, p.y); sc.stroke();
      }
      trail = trail.filter(function (p) { return p.a > 0; });
      var bars = 48; sc.fillStyle = 'rgba(255,255,255,.22)';
      for (var bI = 0; bI < bars; bI++) { var hgt = 3 + vSm * sh * .4 * (.4 + .6 * Math.abs(Math.sin(bI * 1.7 + (R ? 0 : performance.now() / 90)))); sc.fillRect(bI * sw / bars + 1, sh - hgt, sw / bars - 2, hgt); }
      stirRo.textContent = 'v ' + vSm.toFixed(2) + ' · bandpass ' + Math.round(700 + 1900 * vSm) + ' Hz · gain ' + (.045 * Math.pow(vSm, .8)).toFixed(3);
      stirEl.setAttribute('aria-valuenow', String(Math.round(vSm * 100)));
    }
    function syncNote() {
      onBtn.hidden = audio.on;
      note.textContent = audio.on ? (G ? 'Live · ' + (audio.ctx.sampleRate / 1000).toFixed(1) + ' kHz' : 'Sound on') : 'Turn Sound on (top right) to hear this';
    }
    audio.onChange(function (on) { if (on) build(); else teardown(); syncNote(); });
    var lp = ctx.loop(frame), ro = null;
    setPlace('hall'); syncNote();
    return {
      start: function () {
        running = true;
        if (!ro) { ro = new ResizeObserver(function () { stage.classList.toggle('narrow', stage.clientWidth < 600); }); ro.observe(stage); }
        build(); syncNote(); lp.start();
      },
      stop: function () { running = false; lp.stop(); teardown(); syncNote(); if (ro) { ro.disconnect(); ro = null; } }
    };
  }
});
