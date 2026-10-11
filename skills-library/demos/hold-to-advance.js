/* hold-to-advance: (A) commit-hold ring with 500 ms resume grace, (B) sustain-hold pour driven by one scalar; keyboard + non-hold alternatives. */
(function () {
  var ID = 'hold-to-advance';
  var C = 2 * Math.PI * 46;
  var range = function (v, a, b, c, d) { var t = Math.min(1, Math.max(0, (v - a) / (b - a))); return c + (d - c) * t; };
  var sine = function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; };

  // holdButton per the skill: rAF timestamps, resume grace, pointer capture only for real pointers
  function holdButton(btn, o) {
    if (o.off) return { tick: function () { return -1; }, cancel: function () {} };
    var down = false, start = 0, lastP = 0, lastUp = -1e9, pid = null;
    function p() { return Math.min((performance.now() - start) / 1000 / o.dur(), 1); }
    function press(e) {
      if (down) return; if (e.preventDefault) e.preventDefault();
      down = true; pid = e.pointerId;
      var now = performance.now(), gap = now - lastUp;
      var resume = lastP > 0 && gap < 500 ? lastP * (1 - gap / 500) : 0;
      start = now - resume * o.dur() * 1000;
      if (typeof pid === 'number' && btn.setPointerCapture) { try { btn.setPointerCapture(pid); } catch (err) {} }
      o.onStart(resume);
    }
    function release(e) {
      if (!down || (e && e.pointerId !== undefined && e.pointerId !== pid)) return;
      down = false; lastP = p(); lastUp = performance.now(); o.onCancel();
    }
    btn.addEventListener('pointerdown', function (e) { if (e.button === 0 || e.pointerType !== 'mouse') press(e); });
    btn.addEventListener('pointerup', release); btn.addEventListener('pointercancel', release); btn.addEventListener('lostpointercapture', release);
    btn.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press({ pointerId: 'kb' }); } });
    btn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release({ pointerId: 'kb' }); } });
    btn.addEventListener('blur', function () { release(); });
    return {
      tick: function () { if (!down) return -1; var v = p(); if (v >= 1) { down = false; lastP = 0; o.onComplete(); } return v; },
      cancel: function () { if (down) release(); },
      get down() { return down; }
    };
  }

  Lib.register(ID, {
    hint: 'Hold the ring (or Space) to unlock; hold the disc to pour',
    notes: [
      'Commit-hold: 3 s for the hero transition, 1.5 s for secondary beats, never over 3.5 s; ring <code>r=46</code>, <code>dashoffset = C·(1−p)</code>',
      'Resume grace: re-press within 500 ms restarts at <code>p·(1 − gap/500)</code>; otherwise the ring resets in .3 s',
      'Sustain-hold: progress 0 → 1 over 3000 ms linear while held, 1 → 0 over 1000 ms on release; level <code>lerp(.05, .4, easeInOutSine(range(p, 0, .7)))</code>',
      'Pour loop gain <code>range(p, .24, .28, 0, 1)</code>; one-shots fire on crossing .24, not on time',
      'Mandatory: Space/Enter hold, a single-press alternative, live region at 25 % steps; reduced motion = one click'
    ],
    simplified: 'No page-scroll lock and no follow-the-pointer disc during the pour; the pour sound is filtered noise, not recorded SFX, and the camera dolly is a 2D ring zoom.',
    css: [
      '.d-' + ID + ' { display: grid; grid-template-columns: 1fr 1fr; }',
      '.d-' + ID + ' .card { position: relative; overflow: hidden; display: grid; grid-template-rows: auto 1fr auto; padding: 20px 22px 16px; }',
      '.d-' + ID + ' .card + .card { border-left: 1px solid rgb(255 255 255 / .1); }',
      '.d-' + ID + ' .hd { display: flex; justify-content: space-between; gap: 8px; color: rgb(255 255 255 / .5); position: relative; z-index: 3; }',
      '.d-' + ID + ' .hd b { color: #f97316; font-weight: 500; }',
      '.d-' + ID + ' .ft { display: flex; justify-content: space-between; align-items: center; gap: 8px; color: rgb(255 255 255 / .56); position: relative; z-index: 3; flex-wrap: wrap; }',
      '.d-' + ID + ' .lnk { padding: 8px 0; color: rgb(255 255 255 / .75); text-decoration: underline; text-underline-offset: 4px; text-decoration-color: rgb(255 255 255 / .3); }',
      '.d-' + ID + ' .lnk:hover, .d-' + ID + ' .lnk[aria-pressed="true"] { color: #fff; text-decoration-color: #f97316; }',
      '.d-' + ID + ' .mid { position: relative; display: grid; place-items: center; }',
      '.d-' + ID + ' .ca .mid { position: static; }',
      '.d-' + ID + ' svg.tun { position: absolute; inset: -20%; width: 140%; height: 140%; }',
      '.d-' + ID + ' .ringbtn { position: relative; z-index: 2; width: 96px; height: 96px; border-radius: 50%; touch-action: none; -webkit-touch-callout: none; user-select: none; display: grid; place-items: center; }',
      '.d-' + ID + ' .ringbtn svg { position: absolute; inset: 0; transform: rotate(-90deg); }',
      '.d-' + ID + ' .ringbtn .lb { transition: opacity .3s; color: #fff; }',
      '.d-' + ID + ' .ringbtn.pressed .lb { opacity: 0; transition-duration: .2s; }',
      '.d-' + ID + ' .ringbtn:focus-visible { outline: 1px solid #f97316; outline-offset: 6px; }',
      '.d-' + ID + ' .th { position: absolute; z-index: 2; top: calc(50% + 62px); color: rgb(255 255 255 / .5); }',
      '.d-' + ID + ' .unl { position: absolute; inset: 0; z-index: 2; display: grid; place-items: center; align-content: center; gap: 6px; background: radial-gradient(circle at 50% 50%, rgb(249 115 22 / .16), transparent 62%), #050505; clip-path: circle(0% at 50% 50%); transition: clip-path 1.1s cubic-bezier(.76,0,.24,1); pointer-events: none; }',
      '.d-' + ID + ' .unl.on { clip-path: circle(75% at 50% 50%); pointer-events: auto; }',
      '.d-' + ID + ' .unl .big { font-family: Archivo, sans-serif; font-stretch: 125%; font-size: clamp(64px, 12cqw, 140px); line-height: .9; letter-spacing: -.04em; color: #fff; }',
      '.d-' + ID + ' .card { container-type: inline-size; }',
      '.d-' + ID + ' .unl .label { color: rgb(255 255 255 / .6); }',
      '.d-' + ID + ' .disc { position: absolute; z-index: 2; left: 8%; bottom: 10%; width: 120px; height: 120px; border-radius: 50%; background: #fff; border: 3px solid #000; color: #000; font: 800 15px/1.05 Archivo, sans-serif; text-transform: uppercase; letter-spacing: .02em; touch-action: none; -webkit-touch-callout: none; user-select: none; transition: transform .4s cubic-bezier(.215,.61,.355,1); }',
      '.d-' + ID + ' .disc::after { content: ""; position: absolute; inset: -18px; border-radius: 50%; }',
      '.d-' + ID + ' .disc span { transition: opacity .3s; }',
      '.d-' + ID + ' .disc.pressed { transform: scale(.1); } .d-' + ID + ' .disc.pressed span { opacity: 0; }',
      '.d-' + ID + ' .disc:focus-visible { outline: 2px solid #f97316; outline-offset: 6px; }',
      '.d-' + ID + ' svg.pour { position: absolute; inset: 0; width: 100%; height: 100%; }',
      '.d-' + ID + ' .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }',
      '@media (prefers-reduced-motion: reduce) { .d-' + ID + ' .unl, .d-' + ID + ' .disc, .d-' + ID + ' .ringbtn .lb { transition: none; } .d-' + ID + ' .disc.pressed { transform: none; } }',
      '@media (max-width: 640px) { .d-' + ID + ' { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; } .d-' + ID + ' .card + .card { border-left: 0; border-top: 1px solid rgb(255 255 255 / .1); } .d-' + ID + ' .card { padding: 14px 16px 10px; } .d-' + ID + ' .disc { width: 84px; height: 84px; font-size: 11px; left: 2%; bottom: 4%; } .d-' + ID + ' .long { display: none; } .d-' + ID + ' .th { top: calc(50% + 56px); } }'
    ].join('\n'),
    mount: function (stage, ctx) {
      var el = ctx.el, reduced = ctx.reduced, audio = ctx.audio;
      /* ---------- A: commit-hold ---------- */
      var A = el('section', 'card ca'); A.setAttribute('aria-label', 'Commit-hold');
      var rings = '';
      for (var i = 1; i <= 8; i++) rings += '<circle cx="50" cy="50" r="' + (i * 6) + '" fill="none" stroke="rgb(255 255 255 / ' + (0.22 - i * 0.022).toFixed(3) + ')" stroke-width=".25"/>';
      A.innerHTML =
        '<div class="hd label"><span><b>A</b> · Commit-hold</span><span class="durs"><button type="button" class="lnk d15" aria-pressed="false">1.5 s</button> · <button type="button" class="lnk d3" aria-pressed="true">3 s</button></span></div>' +
        '<div class="mid"><svg class="tun" viewBox="0 0 100 100" aria-hidden="true"><g class="dolly" style="transform-origin:50px 50px">' + rings +
        '<path d="M50 0V100M0 50H100" stroke="rgb(255 255 255 / .06)" stroke-width=".2"/></g></svg>' +
        '<button type="button" class="ringbtn" aria-label="Hold to continue"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="rgb(0 0 0 / .5)" stroke="rgb(255 255 255 / .18)" stroke-width="2"/>' +
        '<circle class="pr" cx="50" cy="50" r="46" fill="none" stroke="#f97316" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + C.toFixed(2) + '"/></svg><span class="lb label">' + (reduced ? 'Continue' : 'Hold') + '</span></button>' +
        '<span class="th label" aria-hidden="true">' + (reduced ? 'Tap' : 'Tap / Hold') + '</span>' +
        '<div class="unl" aria-hidden="true" inert><span class="label">Stage unlocked</span><span class="big">02</span><button type="button" class="lnk label relock">Lock again</button></div></div>' +
        '<div class="ft label"><span class="pa">0%</span><button type="button" class="lnk skip">Skip, no hold →</button></div>' +
        '<p class="sr" aria-live="polite"></p>';
      /* ---------- B: sustain-hold ---------- */
      var B = el('section', 'card'); B.setAttribute('aria-label', 'Sustain-hold');
      B.innerHTML =
        '<div class="hd label"><span><b>B</b> · Sustain-hold</span><span class="pb">p 0.00</span></div>' +
        '<div class="mid"><svg class="pour" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
          '<defs><clipPath id="hta-glass"><path d="M80 120 L132 120 L127 188 Q106 195 85 188 Z"/></clipPath></defs>' +
          '<g class="bottle" style="transform-origin:44px 60px"><path d="M39 12 H49 V30 Q58 34 58 44 V88 Q58 92 54 92 H34 Q30 92 30 88 V44 Q30 34 39 30 Z" fill="#111" stroke="rgb(255 255 255 / .85)" stroke-width="1.2"/><rect x="34" y="54" width="20" height="24" fill="#f97316" opacity=".9"/><rect x="38" y="10" width="12" height="5" rx="1" fill="rgb(255 255 255 / .85)"/></g>' +
          '<rect class="stream" x="104.5" y="90" width="3" height="0" rx="1.5" fill="#f97316"/>' +
          '<g clip-path="url(#hta-glass)"><rect class="liq" x="70" y="190" width="72" height="0" fill="#f97316"/><rect class="foam" x="70" y="190" width="72" height="2" fill="#ffd2ad"/></g>' +
          '<path d="M80 120 L132 120 L127 188 Q106 195 85 188 Z" fill="rgb(255 255 255 / .04)" stroke="rgb(255 255 255 / .85)" stroke-width="1.2"/>' +
        '</svg>' +
        '<button type="button" class="disc"><span>' + (reduced ? 'Tap to<br>pour' : 'Hold &amp;<br>Pour') + '</span></button></div>' +
        '<div class="ft label"><span class="snd"></span><button type="button" class="lnk tog" aria-pressed="false">Pour (toggle)</button></div>';
      stage.appendChild(A); stage.appendChild(B);
      var $ = function (r, s) { return r.querySelector(s); };
      var ringBtn = $(A, '.ringbtn'), prC = $(A, '.pr'), dolly = $(A, '.dolly'), unl = $(A, '.unl'), pa = $(A, '.pa'), live = $(A, '.sr');
      var d15 = $(A, '.d15'), d3 = $(A, '.d3'), dur = 3;
      var disc = $(B, '.disc'), tog = $(B, '.tog'), pb = $(B, '.pb'), snd = $(B, '.snd');
      var bottle = $(B, '.bottle'), stream = $(B, '.stream'), liq = $(B, '.liq'), foam = $(B, '.foam');

      // ---- A state
      var aP = 0, aVis = 0, aDone = false, lastStep = 0, resetFrom = 0, resetT = 1;
      function setDur(d) { dur = d; d15.setAttribute('aria-pressed', d === 1.5 ? 'true' : 'false'); d3.setAttribute('aria-pressed', d === 3 ? 'true' : 'false'); }
      d15.addEventListener('click', function () { setDur(1.5); }); d3.addEventListener('click', function () { setDur(3); });
      function unlock() {
        aDone = true; aP = 1; drawA(1); unl.classList.add('on'); unl.removeAttribute('aria-hidden'); unl.inert = false;
        ringBtn.classList.remove('pressed'); ringBtn.disabled = true; live.textContent = 'Continued. Stage 02 unlocked.';
        $(A, '.relock').focus({ preventScroll: true });
      }
      function relock() {
        aDone = false; aP = 0; aVis = 0; resetT = 1; drawA(0); unl.classList.remove('on'); unl.setAttribute('aria-hidden', 'true'); unl.inert = true;
        ringBtn.disabled = false; ringBtn.focus({ preventScroll: true }); live.textContent = '';
      }
      $(A, '.relock').addEventListener('click', relock);
      $(A, '.skip').addEventListener('click', function () { if (!aDone) unlock(); });
      function drawA(v) {
        prC.setAttribute('stroke-dashoffset', (C * (1 - v)).toFixed(2));
        var z = v * v * (3 - 2 * v);                                   // smoothstep → dolly 1.5 units
        dolly.style.transform = reduced ? '' : 'scale(' + (1 + z * 1.5).toFixed(3) + ')';
        pa.textContent = Math.round(v * 100) + '% · ' + dur + ' s';
      }
      var holdA = holdButton(ringBtn, {
        off: reduced, dur: function () { return dur; },
        onStart: function (resume) { if (reduced) return; ringBtn.classList.add('pressed'); resetT = 1; lastStep = Math.floor(resume * 4); },
        onCancel: function () { ringBtn.classList.remove('pressed'); resetFrom = aVis; resetT = 0; },
        onComplete: function () { unlock(); }
      });
      if (reduced) ringBtn.addEventListener('click', function () { if (!aDone) unlock(); });   // Zero's own non-hold mode

      // ---- B state: one scalar drives picture and sound
      var lastSnd = '', bP = 0, bHeld = false, toggled = false, src = null, gain = null, wasOver = false;
      function blip(f, g) {
        if (!audio.on || !audio.ctx) return;
        var c = audio.ctx, t = c.currentTime, o = c.createOscillator(), gg = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.12);
        gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(g, t + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.connect(gg).connect(audio.out); o.start(t); o.stop(t + 0.2);
      }
      function ensureLoop() {
        if (src || !audio.on || !audio.ctx) return;
        var c = audio.ctx; src = c.createBufferSource(); src.buffer = audio.noise(); src.loop = true;
        var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.8;
        gain = c.createGain(); gain.gain.value = 0;
        src.connect(bp).connect(gain).connect(audio.out); src.start();
      }
      function killLoop() { if (src) { try { src.stop(); } catch (e) {} src.disconnect(); src = null; gain = null; } }
      var holdB = holdButton(disc, {
        off: reduced, dur: function () { return 1e9; },
        onStart: function () { bHeld = true; if (!reduced) disc.classList.add('pressed'); ensureLoop(); },
        onCancel: function () { bHeld = toggled; disc.classList.remove('pressed'); },
        onComplete: function () {}
      });
      if (reduced) disc.addEventListener('click', function () { tog.click(); });
      tog.addEventListener('click', function () { toggled = !toggled; bHeld = toggled; tog.setAttribute('aria-pressed', toggled ? 'true' : 'false'); if (toggled) ensureLoop(); });
      function drawB() {
        var tilt = range(bP, 0, 0.24, 0, 1), lvl = 0.05 + (0.4 - 0.05) * sine(range(bP, 0, 0.7, 0, 1));
        bottle.style.transform = 'translate(' + (tilt * 20).toFixed(1) + 'px,' + (tilt * 5).toFixed(1) + 'px) rotate(' + (tilt * 120).toFixed(1) + 'deg)';
        var h = lvl / 0.4 * 64, y = 189 - h;
        liq.setAttribute('y', y.toFixed(1)); liq.setAttribute('height', h.toFixed(1)); foam.setAttribute('y', (y - 1).toFixed(1));
        var pouring = bP > 0.24 && bHeld;
        stream.setAttribute('height', pouring ? Math.max(0, y - 90).toFixed(1) : '0');
        pb.textContent = 'p ' + bP.toFixed(2) + ' · level ' + lvl.toFixed(2);
      }

      var lp = ctx.loop(function (dt) {
        // A
        if (!aDone) {
          var v = holdA.tick();
          if (v >= 0) {
            aVis = aP = v;
            var step = Math.floor(v * 4);
            if (step > lastStep && step < 4) { lastStep = step; live.textContent = 'Hold… ' + step * 25 + '%'; }
          } else if (resetT < 1) {                                       // .3 s power2.out reset
            resetT = Math.min(1, resetT + dt / 0.3); aVis = resetFrom * Math.pow(1 - resetT, 2); lastStep = 0;
          }
          if (!aDone) drawA(aVis);
        }
        // B
        bP = bHeld ? Math.min(1, bP + dt / 3) : Math.max(0, bP - dt / 1);
        var over = bP > 0.24;
        if (over !== wasOver) { blip(over ? 520 : 300, 0.06); wasOver = over; }
        if (audio.on && bHeld) ensureLoop();
        if (gain) gain.gain.setTargetAtTime(range(bP, 0.24, 0.28, 0, 1) * (bHeld ? 0.22 : 0.08), audio.ctx.currentTime, 0.02);
        if (src && bP === 0 && !bHeld) killLoop();
        var sv = audio.on ? 'Sound: pour loop ' + (gain ? Math.round(range(bP, 0.24, 0.28, 0, 100)) + '%' : 'idle') : 'Turn Sound on <span class="long">(top right) </span>to hear this';
        if (sv !== lastSnd) { lastSnd = sv; snd.innerHTML = sv; }
        drawB();
      });
      drawA(0); drawB();

      return {
        start: function () { lp.start(); },
        stop: function () {
          lp.stop(); holdA.cancel(); holdB.cancel(); bHeld = toggled = false; tog.setAttribute('aria-pressed', 'false');
          disc.classList.remove('pressed'); killLoop();
        }
      };
    }
  });
})();
