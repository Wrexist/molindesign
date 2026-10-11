/* scroll-velocity-whoosh-audio — boundary-proximity whoosh (2× lowpass → convolution reverb) + 2 s scene bed crossfades. */
Lib.register('scroll-velocity-whoosh-audio', {
  hint: 'Turn sound on, then scroll slowly past this film (or press Play). Flick fast and the whoosh closes',
  notes: [
    'Cutoff lives between <code>100</code> and <code>10 000 Hz</code>: <code>goal = 100 + prox × (ceiling − 100)</code>, smoothed with <code>1 − exp(−dt / 180 ms)</code>',
    'Proximity <code>pow(1 − |d| / window, .7)</code>; windows open <code>.3 × sceneLength</code> before a cut (<code>.5</code> before the last) and <code>.001</code> after; two cuts stay silent',
    'Velocity <code>v += (|Δp| / Δt − v) × .3</code>; above <code>.003</code> the ceiling drops to <code>.25 + .75 · exp(−(v − .003) × 300)</code> so fast flicks never turn into noise',
    'Chain: lowpass Q 1 → lowpass Q 1 (24 dB/oct) → convolver, wet <code>.65</code> / dry <code>.35</code>, 20 ms predelay; whoosh loops at volume <code>.2</code>',
    'Ambient beds crossfade over <code>2000 ms</code> on scene change, ignored when the scene is unchanged; whoosh off for reduced motion and on iOS'
  ],
  simplified: 'Procedural noise loops, pads and chimes stand in for the Howler samples and impulse_response.mp3 (the IR is generated: 6.5 s exponential decay). The film is this stage’s progress through the viewport, not a Lenis page.',
  css: `
.d-scroll-velocity-whoosh-audio { background: #020202; font-variant-numeric: tabular-nums; }
.d-scroll-velocity-whoosh-audio canvas.sw-air { position: absolute; inset: 0; width: 100%; height: 100%; }
.d-scroll-velocity-whoosh-audio .sw { position: absolute; inset: 0; padding: 16px 20px 18px; display: flex; flex-direction: column; gap: 12px; }
.d-scroll-velocity-whoosh-audio .sw-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px 10px; }
.d-scroll-velocity-whoosh-audio .sw-top .sw-note { order: 3; flex-basis: 100%; color: #f97316; }
.d-scroll-velocity-whoosh-audio .sw-top .sw-note:empty { display: none; }
.d-scroll-velocity-whoosh-audio .sw-top p { margin: 0; color: rgb(255 255 255 / .55); }
.d-scroll-velocity-whoosh-audio .sw-act { display: flex; gap: 8px; align-items: center; }
.d-scroll-velocity-whoosh-audio .sw-act button { white-space: nowrap; padding: 7px 12px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .2); color: rgb(255 255 255 / .8); }
.d-scroll-velocity-whoosh-audio .sw-act button.on { background: #f97316; border-color: #f97316; color: #000; }
.d-scroll-velocity-whoosh-audio .sw-act button[aria-pressed="true"] { background: #fff; color: #000; border-color: #fff; }
.d-scroll-velocity-whoosh-audio .sw-scene { flex: 1; display: flex; flex-direction: column; justify-content: center; position: relative; min-height: 0; }
.d-scroll-velocity-whoosh-audio .sw-scene .label { margin: 0 0 8px; color: rgb(255 255 255 / .5); }
.d-scroll-velocity-whoosh-audio .sw-names { position: relative; height: clamp(34px, 6vw, 70px); }
.d-scroll-velocity-whoosh-audio .sw-names span { position: absolute; left: 0; top: 0; font-family: Archivo, sans-serif; font-stretch: 125%; font-size: clamp(32px, 6vw, 68px); line-height: 1; letter-spacing: -.03em; color: #fff; opacity: 0; transition: opacity 2s linear; white-space: nowrap; }
.d-scroll-velocity-whoosh-audio .sw-names span.on { opacity: 1; }
.d-scroll-velocity-whoosh-audio .sw-bed { margin: 10px 0 0 !important; }
.d-scroll-velocity-whoosh-audio .sw-tl { position: relative; height: 46px; }
.d-scroll-velocity-whoosh-audio .sw-tl .blk { position: absolute; top: 14px; height: 18px; border-left: 1px solid rgb(255 255 255 / .25); background: rgb(255 255 255 / .04); }
.d-scroll-velocity-whoosh-audio .sw-tl .blk b { position: absolute; left: 6px; top: 22px; font: 500 9.5px/1 Archivo, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: rgb(255 255 255 / .45); white-space: nowrap; }
.d-scroll-velocity-whoosh-audio .sw-tl .blk.cur { background: rgb(255 255 255 / .1); } .d-scroll-velocity-whoosh-audio .sw-tl .blk.cur b { color: #fff; }
.d-scroll-velocity-whoosh-audio .sw-tl .win { position: absolute; top: 14px; height: 18px; background: linear-gradient(to right, rgb(249 115 22 / 0), rgb(249 115 22 / .55)); pointer-events: none; }
.d-scroll-velocity-whoosh-audio .sw-tl .mute { position: absolute; top: 4px; transform: translateX(-50%); font: 500 8.5px Archivo, sans-serif; letter-spacing: .12em; color: rgb(255 255 255 / .35); text-transform: uppercase; }
.d-scroll-velocity-whoosh-audio .sw-tl .ph { position: absolute; top: 8px; height: 30px; width: 1px; background: #fff; box-shadow: 0 0 8px #fff; }
.d-scroll-velocity-whoosh-audio .sw-m { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.d-scroll-velocity-whoosh-audio .sw-m div { border-top: 1px solid rgb(255 255 255 / .12); padding-top: 8px; min-width: 0; }
.d-scroll-velocity-whoosh-audio .sw-m .label { margin: 0 0 6px; color: rgb(255 255 255 / .45); }
.d-scroll-velocity-whoosh-audio .sw-m b { display: block; font: 400 13px/1.2 "Geist Mono", ui-monospace, monospace; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.d-scroll-velocity-whoosh-audio .sw-m i { display: block; height: 2px; margin-top: 8px; background: rgb(255 255 255 / .12); position: relative; overflow: hidden; }
.d-scroll-velocity-whoosh-audio .sw-m i::after { content: ""; position: absolute; inset: 0; background: #f97316; transform-origin: left; transform: scaleX(var(--k, 0)); }
.d-scroll-velocity-whoosh-audio.narrow .sw-m { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; }
.d-scroll-velocity-whoosh-audio.narrow .sw-tl .blk b { display: none; } .d-scroll-velocity-whoosh-audio.narrow .sw-top .long { display: none; }
`,
  mount(stage, ctx) {
    var el = ctx.el, audio = ctx.audio, R = ctx.reduced;
    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var SCENES = [['Prologue', 1], ['Thread', 1], ['Chimes', 1.2], ['Loom', 1], ['Forest', 1.3], ['Finale', 1]];
    var total = SCENES.reduce(function (a, s) { return a + s[1]; }, 0), starts = [], acc = 0;
    SCENES.forEach(function (s) { starts.push(acc / total); acc += s[1]; });
    var len = function (i) { return SCENES[i][1] / total; };
    // boundaries exactly as configured in the source: sections 3 and 4 silent, section 5 uses the "epee" whoosh
    var B = [
      { at: starts[1], before: len(0) * .3, after: .001 }, { at: starts[2], before: len(1) * .3, after: .001 },
      { at: starts[3], disabled: true }, { at: starts[4], disabled: true },
      { at: starts[5], before: len(4) * .5, after: .001, epee: true }
    ];
    var BEDS = [null, null, 'chimes-particles-amb', null, 'chimes-particles-forest-amb', null];
    var PART = function (i) { return i < 3 ? 0 : i < 5 ? 1 : 2; }, PART_VOL = [.635, .8, .8];

    var air = el('canvas', 'sw-air'); air.setAttribute('aria-hidden', 'true');
    var ui = el('div', 'sw');
    ui.innerHTML = '<div class="sw-top"><p class="label">Scroll film<span class="long"> · 6 scenes · whoosh at the cuts</span></p><p class="label sw-note"></p><div class="sw-act"><button type="button" class="label sw-snd">Sound on</button><button type="button" class="label sw-play" aria-pressed="false">Play ▸</button></div></div>' +
      '<div class="sw-scene"><p class="label sw-num"></p><div class="sw-names" aria-live="polite"></div><p class="label sw-bed"></p></div>' +
      '<div class="sw-tl" aria-hidden="true"></div>' +
      '<div class="sw-m"><div><p class="label">Proximity</p><b class="m-prox"></b><i></i></div><div><p class="label">Lowpass ×2</p><b class="m-cut"></b><i></i></div><div><p class="label">Velocity</p><b class="m-vel"></b><i></i></div><div><p class="label">Whoosh</p><b class="m-st"></b><i></i></div></div>';
    stage.append(air, ui);
    var $ = function (s) { return ui.querySelector(s); };
    var names = $('.sw-names'), tl = $('.sw-tl'), playB = $('.sw-play'), sndB = $('.sw-snd'), noteEl = $('.sw-note');
    var nameEls = SCENES.map(function (s) { var n = el('span', '', s[0]); names.appendChild(n); return n; });
    var blks = SCENES.map(function (s, i) {
      var b = el('div', 'blk', '<b>' + String(i + 1).padStart(2, '0') + ' ' + s[0] + '</b>');
      b.style.left = starts[i] * 100 + '%'; b.style.width = len(i) * 100 + '%'; tl.appendChild(b); return b;
    });
    B.forEach(function (b) {
      if (b.disabled) { var m = el('span', 'mute', 'silent'); m.style.left = b.at * 100 + '%'; tl.appendChild(m); return; }
      var w = el('div', 'win'); w.style.left = (b.at - b.before) * 100 + '%'; w.style.width = (b.before + b.after) * 100 + '%'; tl.appendChild(w);
    });
    var ph = el('div', 'ph'); tl.appendChild(ph);
    var mEls = { prox: $('.m-prox'), cut: $('.m-cut'), vel: $('.m-vel'), st: $('.m-st') };
    sndB.addEventListener('click', function () { audio.toggle(true); });

    /* ---------- signal ---------- */
    var MIN_F = 100, MAX_F = 10000, SMOOTH_MS = 180;
    var p = 0, pScroll = 0, lastP = null, vel = 0, cutoff = MIN_F, prox = 0, bAct = null, scene = -1, auto = false, running = false;
    function proximity(x) {
      var best = 0, b = null;
      B.forEach(function (k) {
        if (k.disabled) return;
        var d = x - k.at, w = d < 0 ? k.before : k.after;
        if (Math.abs(d) < w) { var v = Math.pow(1 - Math.abs(d) / w, .7); if (v > best) { best = v; b = k; } }
      });
      return { best: best, b: b };
    }

    /* ---------- audio ---------- */
    var G = null, whooshOK = !R && !iOS;
    function irBuffer(c) { // generated impulse response: 20 ms predelay, 6.5 s exponential decay
      var sr = c.sampleRate, n = Math.floor(sr * 6.5), pre = Math.floor(sr * .02), buf = c.createBuffer(2, n, sr);
      for (var ch = 0; ch < 2; ch++) { var d = buf.getChannelData(ch); for (var i = pre; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-(i - pre) / sr * 1.06); }
      return buf;
    }
    function build() {
      if (G || !audio.on || !audio.ctx || !running) return;
      var c = audio.ctx, t = c.currentTime;
      G = { srcs: [], nodes: [], playing: null, parts: [], bed: null, bedIx: -1, partIx: -1 };
      var mk = function (n) { G.nodes.push(n); return n; };
      if (whooshOK) {
        G.lp1 = mk(c.createBiquadFilter()); G.lp2 = mk(c.createBiquadFilter());
        [G.lp1, G.lp2].forEach(function (f) { f.type = 'lowpass'; f.Q.value = 1; f.frequency.value = MIN_F; });
        G.dry = mk(c.createGain()); G.dry.gain.value = .35; G.wet = mk(c.createGain()); G.wet.gain.value = .65;
        G.conv = mk(c.createConvolver());
        try { G.conv.buffer = irBuffer(c); } catch (e) { G.wet.gain.value = 0; G.dry.gain.value = 1; } // run dry if the IR fails
        G.wg = mk(c.createGain()); G.wg.gain.value = .2;
        G.lp1.connect(G.lp2); G.lp2.connect(G.dry).connect(G.wg); G.lp2.connect(G.conv).connect(G.wet).connect(G.wg); G.wg.connect(audio.out);
      }
      G.music = mk(c.createGain()); G.music.gain.value = .35; G.music.connect(audio.out);
      scene = -1;
    }
    function startWhoosh(epee) {
      var c = audio.ctx, s = c.createBufferSource(); s.buffer = audio.noise(); s.loop = true;
      var shape = c.createBiquadFilter(); shape.type = epee ? 'bandpass' : 'lowshelf'; shape.frequency.value = epee ? 2600 : 400; if (epee) shape.Q.value = 3; else shape.gain.value = 8;
      var lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(); lfo.frequency.value = epee ? 5.5 : .7; lg.gain.value = .35; g.gain.value = .75;
      lfo.connect(lg).connect(g.gain); s.connect(shape).connect(g).connect(G.lp1); s.start(); lfo.start();
      G.playing = { s: s, lfo: lfo, nodes: [shape, lg, g] };
    }
    function stopWhoosh() {
      if (!G || !G.playing) return;
      var w = G.playing; G.playing = null;
      [w.s, w.lfo].forEach(function (n) { try { n.stop(); n.disconnect(); } catch (e) {} }); w.nodes.forEach(function (n) { try { n.disconnect(); } catch (e) {} });
    }
    function voice(freqs, type, vol, dest) { // a held pad (music part) or a chime generator (ambient bed)
      var c = audio.ctx, g = c.createGain(); g.gain.value = 0; g.connect(dest); var srcs = [];
      freqs.forEach(function (f, i) { var o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = i * 4 - 4; var og = c.createGain(); og.gain.value = vol / freqs.length; o.connect(og).connect(g); o.start(); srcs.push(o, og); });
      return { g: g, srcs: srcs };
    }
    function fadeTo(slot, next, vol) { // 2000 ms crossfade; the old one stops after its fade
      var c = audio.ctx, t = c.currentTime, old = G[slot];
      if (old) { old.g.gain.cancelScheduledValues(t); old.g.gain.setValueAtTime(old.g.gain.value, t); old.g.gain.linearRampToValueAtTime(0, t + 2); old.kill = setTimeout(function () { kill(old); }, 2100); G.dying = (G.dying || []).concat(old); }
      G[slot] = next;
      if (next) { next.g.gain.setValueAtTime(0, t); next.g.gain.linearRampToValueAtTime(vol, t + 2); }
    }
    function kill(v) { clearTimeout(v.kill); clearInterval(v.timer); v.srcs.forEach(function (n) { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} }); try { v.g.disconnect(); } catch (e) {} }
    function chimes(forest) {
      var c = audio.ctx, v = { g: c.createGain(), srcs: [] }; v.g.gain.value = 0; v.g.connect(G.music);
      var notes = forest ? [74, 76, 79, 81, 83, 86] : [72, 76, 79, 83, 84, 88];
      v.timer = setInterval(function () {
        var t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
        o.frequency.value = 440 * Math.pow(2, (notes[Math.random() * notes.length | 0] - 69) / 12);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .01); g.gain.setTargetAtTime(0, t + .02, forest ? .5 : .35);
        o.connect(g).connect(v.g); o.start(t); o.stop(t + 3); o.onended = function () { try { o.disconnect(); g.disconnect(); } catch (e) {} };
      }, forest ? 420 : 330);
      if (forest) { var n = c.createBufferSource(); n.buffer = audio.noise(); n.loop = true; var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = .7; var ng = c.createGain(); ng.gain.value = .05; n.connect(f).connect(ng).connect(v.g); n.start(); v.srcs.push(n, f, ng); }
      return v;
    }
    function onScene(i) {
      if (!G || i === scene) return; // same scene → ignore
      var prev = scene; scene = i;
      var part = PART(i);
      if (part !== G.partIx) {
        G.partIx = part;
        var chords = [[110, 164.8, 220, 261.6], [98, 146.8, 196, 246.9], [130.8, 196, 261.6, 329.6]][part];
        fadeTo('part', voice(chords, 'triangle', .5, G.music), PART_VOL[part] * .5);
      }
      if (BEDS[i] !== (prev >= 0 ? BEDS[prev] : undefined)) fadeTo('bed', BEDS[i] ? chimes(i === 4) : null, .4);
    }
    function teardown() {
      if (!G) return;
      stopWhoosh();
      ['part', 'bed'].forEach(function (k) { if (G[k]) kill(G[k]); });
      (G.dying || []).forEach(kill);
      G.nodes.forEach(function (n) { try { n.disconnect(); } catch (e) {} });
      G = null; scene = -1;
    }
    function syncNote() {
      sndB.hidden = audio.on;
      noteEl.textContent = audio.on ? (whooshOK ? '' : (R ? 'Whoosh off · reduced motion' : 'Whoosh off on iOS')) : 'Turn Sound on (top right) to hear this';
    }
    audio.onChange(function (on) { if (on) build(); else teardown(); syncNote(); });

    /* ---------- frame ---------- */
    var cx = air.getContext('2d'), streaks = [], W = 1, H = 1, airT = 0;
    for (var i = 0; i < 70; i++) streaks.push({ x: Math.random(), y: Math.random(), l: .05 + Math.random() * .25, s: .4 + Math.random() });
    playB.addEventListener('click', function () { auto = !auto; if (auto && p > .98) p = 0; playB.setAttribute('aria-pressed', String(auto)); playB.textContent = auto ? 'Pause ❚❚' : 'Play ▸'; });
    function frame(dt) {
      if (auto) { p = Math.min(1, p + dt / 30); if (p >= 1) playB.click(); } else p = pScroll;
      var dtms = dt * 1000;
      if (lastP != null) vel += (Math.abs(p - lastP) / Math.max(dt * 60, 1e-3) - vel) * .3; // per-frame Δp
      lastP = p;
      var pr = proximity(p); prox = pr.best;
      var velScale = vel <= .003 ? 1 : .25 + .75 * Math.exp(-(vel - .003) * 300);
      var ceiling = MIN_F + (MAX_F - MIN_F) * velScale, goal = MIN_F + prox * (ceiling - MIN_F);
      cutoff += (goal - cutoff) * (1 - Math.exp(-dtms / SMOOTH_MS));
      var si = 0; for (var k = 0; k < starts.length; k++) if (p >= starts[k]) si = k;
      if (G) {
        onScene(si);
        if (whooshOK) {
          var t = audio.ctx.currentTime;
          if (prox > 0 && !G.playing) { startWhoosh(pr.b && pr.b.epee); bAct = pr.b; }
          if (prox === 0 && cutoff <= MIN_F + 50) stopWhoosh();
          G.lp1.frequency.linearRampToValueAtTime(cutoff, t + .1); G.lp2.frequency.linearRampToValueAtTime(cutoff, t + .1);
        }
      }
      // visuals
      if (blks.cur !== si) {
        blks.forEach(function (b, j) { b.classList.toggle('cur', j === si); });
        nameEls.forEach(function (n, j) { n.classList.toggle('on', j === si); }); blks.cur = si;
        $('.sw-num').textContent = 'Scene ' + String(si + 1).padStart(2, '0') + ' / 06 · music part_0' + (PART(si) + 1);
        $('.sw-bed').textContent = BEDS[si] ? 'Bed · ' + BEDS[si] + ' · crossfade 2.0 s' : 'No ambient bed in this scene';
      }
      ph.style.left = (p * 100).toFixed(2) + '%';
      var kc = Math.log(cutoff / MIN_F) / Math.log(MAX_F / MIN_F);
      set(mEls.prox, prox.toFixed(2), prox);
      set(mEls.cut, Math.round(cutoff).toLocaleString('en-US') + ' Hz', kc);
      set(mEls.vel, vel.toFixed(4) + ' · ×' + velScale.toFixed(2), Math.min(1, vel / .02));
      set(mEls.st, !whooshOK ? 'off' : G && G.playing ? (bAct && bAct.epee ? 'epee loop' : 'whoosh loop') : 'idle', G && G.playing ? 1 : 0);
      var r = ctx.fitCanvas(air, stage, 1.5); W = r.w; H = r.h;
      cx.setTransform(r.dpr, 0, 0, r.dpr, 0, 0); cx.clearRect(0, 0, W, H);
      if (!R) airT += dt * (.2 + kc * 2.2);
      cx.lineCap = 'round';
      streaks.forEach(function (s) {
        var x = ((s.x - airT * s.s * .3) % 1 + 1) % 1 * (W + 200) - 100, y = s.y * H * .62 + H * .08, a = (.03 + prox * .3) * (.3 + .7 * kc);
        cx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')'; cx.lineWidth = 1;
        cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + s.l * W * (.2 + kc), y); cx.stroke();
      });
    }
    function set(b, txt, k) { if (b.textContent !== txt) b.textContent = txt; b.nextSibling.style.setProperty('--k', ctx.clamp(k, 0, 1).toFixed(3)); }
    var lp = ctx.loop(frame), ro = null;
    syncNote();
    return {
      start: function () {
        running = true;
        if (!ro) { ro = new ResizeObserver(function () { stage.classList.toggle('narrow', stage.clientWidth < 600); }); ro.observe(stage); }
        build(); syncNote(); lastP = null; lp.start();
      },
      stop: function () { running = false; lp.stop(); teardown(); if (ro) { ro.disconnect(); ro = null; } },
      scroll: function (pp, v) {
        var r = stage.getBoundingClientRect(), q = ctx.clamp((1 - (r.top + r.height / 2) / innerHeight - .12) / .76, 0, 1);
        if (auto && Math.abs(q - pScroll) > .004) { auto = false; playB.setAttribute('aria-pressed', 'false'); playB.textContent = 'Play ▸'; } // a real scroll takes over
        pScroll = q;
      }
    };
  }
});
