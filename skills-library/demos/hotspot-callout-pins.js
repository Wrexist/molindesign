/* hotspot-callout-pins — anchors projected every frame, one callout at a time, auto-flip, pulsing CTA hotspot */
(function () {
  var ID = 'hotspot-callout-pins';
  var A = 1.35, B = .72, C = .72;     // ellipsoid half-axes of the "pod"
  var PINS = [
    { lon: 20, lat: 34, name: 'Shell', body: 'One carbon-fibre shell, and nothing bolted to it.' },
    { lon: 110, lat: -18, name: 'Intake', body: 'Air goes in low and leaves high: no fans to hear.' },
    { lon: 200, lat: 12, name: 'Sensors', body: 'Twelve lenses, stitched into one field of view.' },
    { lon: 290, lat: -38, name: 'Base', body: 'Machined from a single billet, so it never rocks.' }
  ];

  Lib.register(ID, {
    hint: 'Each part gets its callout as it turns toward you, one at a time. Press the pulsing hotspot to open the shell.',
    notes: [
      'Pins are zero-size containers moved every frame with <code>translate3d(x,y,0)</code> from a projected 3D anchor; the content only renders',
      '10 px orange dot with <code>0 0 12px</code> glow; 72 px hairline leader draws <code>scaleX 0→1</code> in .5 s ease-out-quint, text blur-rises .15 s later; exit is a .25 s fade',
      'Side auto-flips when there is no room on the right, and <code>--room</code> caps the text width at <code>min(280px, room − 100px)</code>',
      'Only one label at a time, in camera order; no boxes behind text, just <code>text-shadow: 0 1px 14px rgb(0 0 0/.75)</code>',
      'CTA hotspot: 56 px button (≥ 44 px), ping ring 2.2 s, press scale .95; the same facts also live in DOM for screen readers'
    ],
    simplified: 'A Canvas 2D wireframe stands in for the 3D model, and “active” is picked by which anchor faces the camera rather than by a camera path.',
    css: [
      '.d-hotspot-callout-pins { container-type: inline-size; --lead: 72px; user-select: none; }',
      '@container (max-width: 520px) { .d-hotspot-callout-pins .hp-pin { --lead: 40px; } .d-hotspot-callout-pins .hp-body { font-size: 13px !important; } }',
      '.d-hotspot-callout-pins canvas { position: absolute; inset: 0; width: 100%; height: 100%; }',
      '.d-hotspot-callout-pins .hp-vig { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(130% 105% at 50% 44%, transparent 50%, rgb(0 0 0 / .6) 85%, rgb(0 0 0 / .9)); }',
      '.d-hotspot-callout-pins .hp-pin { position: absolute; left: 0; top: 0; width: 0; height: 0; pointer-events: none; visibility: hidden; --lead: 72px; }',
      '.d-hotspot-callout-pins .hp-pin.vis { visibility: visible; }',
      '.d-hotspot-callout-pins .hp-dot { position: absolute; left: -5px; top: -5px; width: 10px; height: 10px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .8); background: rgb(249 115 22 / .9); box-shadow: 0 0 12px rgb(249 115 22 / .7); opacity: 0; transition: opacity .25s; }',
      '.d-hotspot-callout-pins .hp-lead { position: absolute; left: 0; top: 0; width: var(--lead); height: 1px; background: rgb(255 255 255 / .8); box-shadow: 0 0 6px rgb(0 0 0 / .6); transform: scaleX(0); transform-origin: left; transition: transform .25s; }',
      '.d-hotspot-callout-pins [data-side=l] .hp-lead { left: auto; right: 0; transform-origin: right; }',
      '.d-hotspot-callout-pins .hp-txt { position: absolute; left: calc(var(--lead) + 12px); bottom: 12px; width: min(280px, calc(var(--room, 380px) - var(--lead) - 28px)); opacity: 0; transition: opacity .25s; text-shadow: 0 1px 14px rgb(0 0 0 / .75); }',
      '.d-hotspot-callout-pins [data-side=l] .hp-txt { left: auto; right: calc(var(--lead) + 12px); text-align: right; }',
      '.d-hotspot-callout-pins [data-side=t] .hp-lead { top: auto; bottom: 0; width: 1px; height: var(--lead); transform: scaleY(0); transform-origin: bottom; }',
      '.d-hotspot-callout-pins [data-side=t].on .hp-lead { transform: scaleY(1); }',
      '.d-hotspot-callout-pins [data-side=t] .hp-txt { left: var(--tx); bottom: calc(var(--lead) + 8px); width: var(--tw); }',
      '.d-hotspot-callout-pins .hp-txt .label { margin: 0 0 6px; color: rgb(255 255 255 / .9); } .d-hotspot-callout-pins .hp-txt .label b { font-weight: 500; color: #f97316; margin-right: .8em; }',
      '.d-hotspot-callout-pins .hp-body { margin: 0; font-size: 15px; line-height: 1.5; color: rgb(255 255 255 / .9); }',
      '.d-hotspot-callout-pins .on .hp-dot { opacity: 1; }',
      '.d-hotspot-callout-pins .on .hp-lead { transform: scaleX(1); transition: transform .5s cubic-bezier(.23,1,.32,1); }',
      '.d-hotspot-callout-pins .hp-txt { transform: translateY(8px); filter: blur(4px); }',
      '.d-hotspot-callout-pins .on .hp-txt { opacity: 1; transform: none; filter: none; transition: opacity 1s cubic-bezier(.23,1,.32,1) .15s, transform 1s cubic-bezier(.23,1,.32,1) .15s, filter 1s cubic-bezier(.23,1,.32,1) .15s; }',
      '.d-hotspot-callout-pins .hp-cta { position: absolute; left: 50%; bottom: 9%; display: flex; align-items: center; gap: 14px; transform: translateX(-28px); }',
      '.d-hotspot-callout-pins .hp-btn { position: relative; width: 56px; height: 56px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .5); background: rgb(0 0 0 / .3); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); display: grid; place-items: center; transition: border-color .3s, transform .2s cubic-bezier(.23,1,.32,1); flex: none; }',
      '.d-hotspot-callout-pins .hp-btn:hover { border-color: #fff; } .d-hotspot-callout-pins .hp-btn:active { transform: scale(.95); }',
      '.d-hotspot-callout-pins .hp-btn::before { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid rgb(249 115 22 / .6); animation: hp-ping 2.2s cubic-bezier(0,0,.2,1) infinite; }',
      '.d-hotspot-callout-pins.paused .hp-btn::before { animation-play-state: paused; }',
      '.d-hotspot-callout-pins .hp-btn i { width: 10px; height: 10px; border-radius: 50%; background: #f97316; box-shadow: 0 0 14px rgb(249 115 22 / .9); }',
      '.d-hotspot-callout-pins .hp-cta .label { color: rgb(255 255 255 / .9); text-shadow: 0 1px 14px rgb(0 0 0 / .8); white-space: nowrap; }',
      '@keyframes hp-ping { 75%, 100% { transform: scale(1.9); opacity: 0; } }',
      '.d-hotspot-callout-pins .hp-count { position: absolute; left: 24px; top: 22px; margin: 0; color: rgb(255 255 255 / .56); }',
      '.d-hotspot-callout-pins .hp-count b { font-weight: 500; color: #f97316; }',
      '.d-hotspot-callout-pins .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }',
      '@media (prefers-reduced-motion: reduce) { .d-hotspot-callout-pins .hp-btn::before { animation: none; display: none; } .d-hotspot-callout-pins .on .hp-lead { transition: none; } .d-hotspot-callout-pins .hp-txt, .d-hotspot-callout-pins .on .hp-txt { transform: none; filter: none; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var R = ctx.reduced;
      stage.innerHTML =
        '<canvas role="img" aria-label="A turning wireframe pod with four annotated parts"></canvas><div class="hp-vig"></div>' +
        PINS.map(function (p, i) {
          return '<div class="hp-pin" data-side="r" aria-hidden="true"><i class="hp-dot"></i><i class="hp-lead"></i><div class="hp-txt">' +
            '<p class="label"><b>0' + (i + 1) + '</b>' + p.name + '</p><p class="hp-body">' + p.body + '</p></div></div>';
        }).join('') +
        '<p class="label hp-count" aria-hidden="true">Part <b class="hp-n">—</b> / 04</p>' +
        '<div class="hp-cta"><button type="button" class="hp-btn" aria-pressed="false" aria-label="Open the shell"><i></i></button><span class="label hp-cta-l" aria-hidden="true">Open the shell</span></div>' +
        '<ul class="sr">' + PINS.map(function (p, i) { return '<li>0' + (i + 1) + ' ' + p.name + ': ' + p.body + '</li>'; }).join('') + '</ul>';

      var cv = stage.querySelector('canvas'), g = cv.getContext('2d'), dims = { w: 1, h: 1, dpr: 1 };
      var pinEls = Array.prototype.slice.call(stage.querySelectorAll('.hp-pin')), nEl = stage.querySelector('.hp-n');
      var btn = stage.querySelector('.hp-btn'), btnL = stage.querySelector('.hp-cta-l');
      var rot = .2, open = 0, openGoal = 0, active = -1, stepT = 0, stepIdx = 0;
      var anchors = PINS.map(function (p) {
        var lo = p.lon * Math.PI / 180, la = p.lat * Math.PI / 180;
        var v = [A * Math.cos(la) * Math.cos(lo), B * Math.sin(la), C * Math.cos(la) * Math.sin(lo)];
        return { v: v, n: [v[0] / (A * A), v[1] / (B * B), v[2] / (C * C)] };
      });
      // wireframe: latitude rings + meridians as point lists
      var lines = [], i, j;
      for (i = 1; i < 8; i++) { var la = -Math.PI / 2 + i * Math.PI / 8, ring = []; for (j = 0; j <= 48; j++) { var lo = j / 48 * Math.PI * 2; ring.push([A * Math.cos(la) * Math.cos(lo), B * Math.sin(la), C * Math.cos(la) * Math.sin(lo)]); } lines.push(ring); }
      for (i = 0; i < 16; i++) { var lo2 = i / 16 * Math.PI * 2, mer = []; for (j = 0; j <= 24; j++) { var la2 = -Math.PI / 2 + j / 24 * Math.PI; mer.push([A * Math.cos(la2) * Math.cos(lo2), B * Math.sin(la2), C * Math.cos(la2) * Math.sin(lo2)]); } lines.push(mer); }

      function cyF() { return dims.w < 520 ? .58 : .46; }
      function lift(v) { return v[1] > .02 ? [v[0], v[1] + open * .42, v[2]] : v; }
      function xf(v) {   // rotate Y by rot, tilt X, project
        var cr = Math.cos(rot), sr = Math.sin(rot), x = v[0] * cr - v[2] * sr, z = v[0] * sr + v[2] * cr;
        var ct = Math.cos(.32), st = Math.sin(.32), y = v[1] * ct - z * st, z2 = v[1] * st + z * ct;
        var S = Math.min(dims.w, dims.h) * (dims.w < 520 ? .3 : .26), f = 4 / (4 - z2);
        return [dims.w * .5 + x * S * f, dims.h * cyF() - y * S * f, z2];
      }
      function facing(a) {
        var cr = Math.cos(rot), sr = Math.sin(rot), n = a.n, z = n[0] * sr + n[2] * cr, y = n[1];
        var z2 = y * Math.sin(.32) + z * Math.cos(.32), len = Math.hypot(n[0], n[1], n[2]);
        return z2 / len;
      }
      function draw() {
        var W = dims.w, H = dims.h, d = dims.dpr;
        g.setTransform(d, 0, 0, d, 0, 0);
        g.fillStyle = '#030303'; g.fillRect(0, 0, W, H);
        var fl = g.createRadialGradient(W * .5, H * .78, 0, W * .5, H * .78, W * .45);
        fl.addColorStop(0, 'rgba(249,115,22,.13)'); fl.addColorStop(1, 'rgba(249,115,22,0)');
        g.fillStyle = fl; g.fillRect(0, 0, W, H);
        var S = Math.min(W, H) * (W < 520 ? .3 : .26);
        g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(W * .5, H * cyF() + S * .98, S * 1.45, S * .2, 0, 0, 7); g.stroke();
        g.lineWidth = 1;
        for (var k = 0; k < lines.length; k++) {
          var L = lines[k], prev = xf(lift(L[0]));
          for (var m = 1; m < L.length; m++) {
            var cur = xf(lift(L[m])), z = (prev[2] + cur[2]) / 2;
            var al = z > 0 ? .1 + .5 * z : .05 + .05 * (1 + z);
            g.strokeStyle = 'rgba(255,255,255,' + al.toFixed(3) + ')';
            g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(cur[0], cur[1]); g.stroke();
            prev = cur;
          }
        }
        if (open > .01) {   // inner glow when the shell opens
          var c = xf([0, .02, 0]), gl = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], S * 1.2);
          gl.addColorStop(0, 'rgba(249,115,22,' + (.55 * open) + ')'); gl.addColorStop(1, 'rgba(249,115,22,0)');
          g.fillStyle = gl; g.fillRect(0, 0, W, H);
        }
        anchors.forEach(function (a, idx) {   // idle anchors: faint dots on the facing side
          var f = facing(a); if (f <= 0 || idx === active) return;
          var q = xf(lift(a.v)); g.fillStyle = 'rgba(255,255,255,' + (.25 + .4 * f) + ')';
          g.beginPath(); g.arc(q[0], q[1], 2.5, 0, 7); g.fill();
        });
      }
      function updatePins() {
        var best = -1, bf = .55;
        if (active >= 0 && facing(anchors[active]) > .35) best = active;
        else anchors.forEach(function (a, idx) { var f = facing(a); if (f > bf) { bf = f; best = idx; } });
        if (best !== active) {
          if (active >= 0) { var old = pinEls[active]; old.classList.remove('on'); old.setAttribute('aria-hidden', 'true'); setTimeout(function () { if (!old.classList.contains('on')) old.classList.remove('vis'); }, 260); }
          active = best;
          nEl.textContent = active >= 0 ? '0' + (active + 1) : '—';
          if (active >= 0) {
            var el = pinEls[active]; el.classList.add('vis'); el.removeAttribute('aria-hidden');
            requestAnimationFrame(function () { if (pinEls[active] === el) el.classList.add('on'); });
          }
        }
        pinEls.forEach(function (el, idx) {
          if (!el.classList.contains('vis')) return;
          var q = xf(lift(anchors[idx].v)), roomR = dims.w - q[0] - 16, side = dims.w < 520 ? 't' : roomR >= 260 ? 'r' : 'l';
          el.dataset.side = side;
          if (side === 't') {   // narrow stage: leader goes up, text block is clamped inside the stage
            var tw = Math.min(260, dims.w - 32);
            el.style.setProperty('--tw', tw + 'px');
            el.style.setProperty('--tx', Math.round(ctx.clamp(-tw / 2, 16 - q[0], dims.w - 16 - q[0] - tw)) + 'px');
          }
          el.style.setProperty('--room', Math.round(side === 'r' ? roomR : q[0] - 16) + 'px');
          el.style.transform = 'translate3d(' + q[0].toFixed(1) + 'px,' + q[1].toFixed(1) + 'px,0)';
        });
      }
      function faceAnchor(idx) {   // reduced motion: cut straight to the angle where this anchor faces the camera
        var lo = PINS[idx].lon * Math.PI / 180; rot = Math.PI / 2 - lo;
      }

      var lp = ctx.loop(function (dt) {
        if (R) { stepT += dt; if (stepT > 4) { stepT = 0; stepIdx = (stepIdx + 1) % PINS.length; faceAnchor(stepIdx); } }
        else rot -= dt * .32;
        open = R ? openGoal : ctx.damp(open, openGoal, 5, dt);
        draw(); updatePins();
      });
      function layout() { dims = ctx.fitCanvas(cv, stage, 2); draw(); updatePins(); }
      var ro = new ResizeObserver(layout);
      btn.addEventListener('click', function () {
        openGoal = openGoal ? 0 : 1;
        var on = !!openGoal;
        btn.setAttribute('aria-pressed', on); btn.setAttribute('aria-label', on ? 'Close the shell' : 'Open the shell');
        btnL.textContent = on ? 'Close the shell' : 'Open the shell';
        if (R) { draw(); updatePins(); }
      });
      if (R) faceAnchor(0);
      layout();

      return {
        start: function () { ro.observe(stage); stage.classList.remove('paused'); lp.start(); },
        stop: function () { lp.stop(); ro.disconnect(); stage.classList.add('paused'); },
        replay: function () { openGoal = 0; btn.setAttribute('aria-pressed', 'false'); btnL.textContent = 'Open the shell'; rot = R ? rot : .2; stepIdx = 0; if (R) faceAnchor(0); }
      };
    }
  });
})();
