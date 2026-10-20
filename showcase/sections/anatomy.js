/* #anatomy (03): hotspot-callout-pins + cursor-mask-reveal.
   The camera (#lf1) and its X-ray (#lf1-xray) share one SVG viewBox, so pins (placed as % of the viewBox)
   and the flashlight mask (viewBox units) stay aligned at every width. */
(function () {
  var VB_W = 400, VB_H = 240;
  // hotspot-callout-pins: real parts, in viewBox coordinates
  var PINS = [
    { x: 303, y: 22,  name: 'Shutter', body: 'One orange button. 1/8000 s, with a half-press you can feel through a glove.' },
    { x: 156, y: 172, name: 'Lens', body: '35 mm f/1.4 with nine aperture blades, so highlights stay round wide open.' },
    { x: 232, y: 104, name: 'Sensor', body: '24 MP full frame. Colour and monochrome from the same exposure.' },
    { x: 66,  y: 150, name: 'Battery', body: '40 hours of shooting. A week in the field, not a weekend.' },
    { x: 52,  y: 52,  name: 'Weather seals', body: 'Gaskets at every seam, door and dial. Rain is just weather.' }
  ];
  var CTA = { x: 336, y: 158 };
  var R_REST = 54, R_PRESS = 100, R_FULL = 300;   // flashlight radius in viewBox units (≥ 18vmax-ish on desktop)

  var css = [
    '#anatomy { overflow: clip; }',
    '#anatomy .an-head { display: grid; gap: 2.4rem; margin-bottom: 6rem; }',
    '#anatomy h2 { margin: 0; font-size: clamp(4rem, 7.2rem, 11vw); max-width: 14ch; }',
    '#anatomy .an-lede { margin: 0; max-width: 46ch; color: var(--p70); font-size: 1.7rem; }',
    '@media (min-width: 900px) { #anatomy .an-head { grid-template-columns: 1.3fr 1fr; align-items: end; } }',
    '#anatomy .an-stage { position: relative; container-type: inline-size; max-width: 108rem; margin-inline: auto; padding: 9rem 0 0; }',
    '#anatomy .an-cam { position: relative; aspect-ratio: 400 / 240; color: var(--p70); touch-action: none; user-select: none; -webkit-user-select: none; }',
    '#anatomy .an-cam svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: visible; }',
    '#anatomy .an-floor { position: absolute; left: 6%; right: 6%; bottom: -6%; height: 12%; background: radial-gradient(50% 50% at 50% 50%, rgb(0 0 0 / .7), transparent 70%); pointer-events: none; }',
    '#anatomy .an-hud { position: absolute; left: 0; right: 0; top: 0; display: flex; justify-content: space-between; gap: 1.6rem; color: var(--p45); pointer-events: none; }',
    '#anatomy .an-hud b { color: var(--paper); font-weight: 500; }',
    /* pins */
    '#anatomy .pin { position: absolute; width: 0; height: 0; --lead: 7.2rem; z-index: 2; }',
    '#anatomy .pin-btn { position: absolute; left: -2.2rem; top: -2.2rem; width: 4.4rem; height: 4.4rem; border-radius: 50%; display: grid; place-items: center; }',
    '#anatomy .pin-btn i { width: 1rem; height: 1rem; border-radius: 50%; border: 1px solid rgb(255 255 255 / .8); background: var(--signal); box-shadow: 0 0 1.2rem rgb(255 77 31 / .7); transition: transform .2s var(--ease-out); }',
    '#anatomy .pin-btn:hover i, #anatomy .pin-btn[aria-expanded="true"] i { transform: scale(1.35); }',
    '#anatomy .pin-btn b { position: absolute; left: 3rem; top: .3rem; font: 500 1rem/1 var(--f-mono); color: var(--p45); pointer-events: none; }',
    '#anatomy .pin[data-side=l] .pin-btn b { left: auto; right: 3rem; }',
    '#anatomy .pin-btn[aria-expanded="true"] b { opacity: 0; }',
    '#anatomy .pin-lead { position: absolute; left: 0; top: 0; width: var(--lead); height: 1px; background: rgb(255 255 255 / .8); box-shadow: 0 0 6px rgb(0 0 0 / .6); transform: scaleX(0); transform-origin: left; transition: transform .25s; pointer-events: none; }',
    '#anatomy .pin[data-side=l] .pin-lead { left: auto; right: 0; transform-origin: right; }',
    '#anatomy .pin-txt { position: absolute; left: calc(var(--lead) + 1.2rem); bottom: 1.2rem; width: 26rem; visibility: hidden; opacity: 0; transform: translateY(.8rem); filter: blur(4px); transition: opacity .25s, transform .25s, filter .25s, visibility 0s .25s; text-shadow: 0 1px 14px rgb(0 0 0 / .75); pointer-events: none; }',
    '#anatomy .pin[data-side=l] .pin-txt { left: auto; right: calc(var(--lead) + 1.2rem); text-align: right; }',
    '#anatomy .pin-txt .label { margin: 0 0 .6rem; color: var(--p90); }',
    '#anatomy .pin-txt .label b, #anatomy .an-cap .label b { font-weight: 500; color: var(--signal); margin-right: .8em; font-family: var(--f-mono); }',
    '#anatomy .pin-txt p.b { margin: 0; font-size: 1.5rem; line-height: 1.5; color: var(--p90); }',
    '#anatomy .pin.on .pin-lead { transform: scaleX(1); transition: transform .5s var(--ease-out); }',
    '#anatomy .pin.on .pin-txt { visibility: visible; opacity: 1; transform: none; filter: none; transition: opacity 1s var(--ease-out) .15s, transform 1s var(--ease-out) .15s, filter 1s var(--ease-out) .15s, visibility 0s; }',
    /* CTA hotspot */
    '#anatomy .an-cta { position: absolute; z-index: 3; right: calc(' + (100 - CTA.x / VB_W * 100) + 'cqw - 2.8rem); top: calc(9rem + ' + (CTA.y / VB_H * 60) + 'cqw - 2.8rem); display: flex; flex-direction: row-reverse; align-items: center; gap: 1.4rem; }',
    '#anatomy .cta-btn { position: relative; flex: none; width: 5.6rem; height: 5.6rem; border-radius: 50%; border: 1px solid rgb(255 255 255 / .5); background: rgb(0 0 0 / .3); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); display: grid; place-items: center; transition: border-color .3s, transform .16s var(--ease-out); }',
    '#anatomy .cta-btn:hover { border-color: #fff; } #anatomy .cta-btn:active { transform: scale(.95); }',
    '#anatomy .cta-btn::before { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid rgb(255 77 31 / .6); animation: an-ping 2.2s cubic-bezier(0,0,.2,1) infinite; }',
    '#anatomy.is-paused .cta-btn::before { animation-play-state: paused; }',
    '#anatomy .cta-btn i { width: 1rem; height: 1rem; border-radius: 50%; background: var(--signal); box-shadow: 0 0 1.4rem rgb(255 77 31 / .9); transition: transform .3s var(--ease-out); }',
    '#anatomy .cta-btn[aria-pressed="true"] i { transform: scale(1.6); }',
    '#anatomy .an-cta .label { color: var(--p90); text-shadow: 0 1px 14px rgb(0 0 0 / .8); white-space: nowrap; pointer-events: none; }',
    '@keyframes an-ping { 75%, 100% { transform: scale(1.9); opacity: 0; } }',
    /* toolbar + narrow caption */
    '#anatomy .an-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1.2rem 2.4rem; margin-top: 6rem; padding-top: 1.6rem; border-top: 1px solid var(--p15); }',
    '#anatomy .an-hint { margin: 0; color: var(--p45); }',
    '#anatomy .an-cap { display: none; min-height: 9rem; margin-top: 4rem; }',
    '#anatomy .an-cap p { margin: 0; }',
    '#anatomy .an-cap .b { font-size: 1.6rem; color: var(--p90); max-width: 36ch; margin-top: .6rem; }',
    '@container (max-width: 680px) {',
    '  #anatomy .pin-txt, #anatomy .pin-lead { display: none; }',
    '  #anatomy .an-cap { display: block; }',
    '  #anatomy .an-stage { padding-top: 5rem; }',
    '  #anatomy .an-cta { position: static; margin-top: 3.2rem; flex-direction: row; }',
    '  #anatomy .pin-btn b { display: none; }',
    '}',
    '#anatomy .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }',
    '@media (prefers-reduced-motion: reduce) { #anatomy .cta-btn::before { display: none; } #anatomy .pin-txt, #anatomy .pin.on .pin-txt { transform: none; filter: none; transition: opacity .2s, visibility 0s; } #anatomy .pin.on .pin-lead { transition: none; } }'
  ].join('\n');

  Site.section('anatomy', {
    css: css,
    mount: function (root, ctx) {
      var R = ctx.reduced;
      var pct = function (v, max) { return (v / max * 100).toFixed(3) + '%'; };
      root.innerHTML =
        '<div class="wrap">' +
          '<p class="kicker"><span>03</span>Anatomy</p>' +
          '<div class="an-head">' +
            '<h2 class="display">Look <span class="serif">inside</span> before you buy.</h2>' +
            '<p class="an-lede">' + (R
              ? 'Five parts make the LF‑1 a field camera rather than a pocket one. Tap a pin for the part, or open the camera to see its insides.'
              : 'Five parts make the LF‑1 a field camera rather than a pocket one. Move across the body to see through it, press to look wider, tap a pin for the part.') + '</p>' +
          '</div>' +
          '<div class="an-stage">' +
            '<div class="an-hud label" aria-hidden="true"><span>LF‑1 · <b class="an-mode">' + (R ? 'Body' : 'X-ray lens') + '</b></span><span class="mono an-xy">— · —</span></div>' +
            '<div class="an-cam"' + (R ? '' : ' data-cursor="Look"') + '>' +
              '<div class="an-floor" aria-hidden="true"></div>' +
              '<svg class="an-svg" viewBox="0 0 400 240" role="img" aria-label="Halden LF‑1, front view. Under the body: battery on the left, sensor behind the lens, main board on the right.">' +
                '<defs>' +
                  '<pattern id="an-grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0H0V8" fill="none" stroke="rgb(236 232 223 / .07)" stroke-width=".5"/></pattern>' +
                  '<linearGradient id="an-band" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
                  // cursor-mask-reveal: noise-distorted, feathered lens (adaptation of the soft-light noise edge)
                  '<filter id="an-noise" filterUnits="userSpaceOnUse" x="-80" y="-80" width="560" height="400">' +
                    '<feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="7" result="n"/>' +
                    '<feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
                    '<feGaussianBlur in="d" stdDeviation="7"/>' +
                  '</filter>' +
                  '<mask id="an-mask" maskUnits="userSpaceOnUse" x="-20" y="-20" width="440" height="280">' +
                    '<g filter="url(#an-noise)"><circle class="an-lamp" cx="200" cy="128" r="0" fill="#fff"/><circle class="an-iris" cx="200" cy="128" r="0" fill="#fff"/></g>' +
                    '<rect class="an-band" x="-200" y="-20" width="90" height="280" fill="url(#an-band)"/>' +
                  '</mask>' +
                '</defs>' +
                '<use href="#lf1"/>' +
                '<g mask="url(#an-mask)">' +
                  '<g fill="#090b0d"><rect x="20" y="50" width="360" height="164" rx="20"/><rect x="44" y="30" width="312" height="26" rx="8"/><rect x="288" y="14" width="30" height="16" rx="4"/><rect x="330" y="20" width="16" height="10" rx="2"/><circle cx="200" cy="128" r="66"/></g>' +
                  '<g fill="url(#an-grid)"><rect x="20" y="50" width="360" height="164" rx="20"/><rect x="44" y="30" width="312" height="26" rx="8"/></g>' +
                  '<use href="#lf1-xray" style="color: var(--paper)"/>' +
                '</g>' +
                '<line class="an-front" x1="0" x2="0" y1="6" y2="226" stroke="var(--signal)" stroke-width="1" opacity="0"/>' +
              '</svg>' +
              PINS.map(function (p, i) {
                var n = '0' + (i + 1), side = p.x > VB_W / 2 ? 'l' : 'r';
                return '<div class="pin" data-side="' + side + '" style="left:' + pct(p.x, VB_W) + ';top:' + pct(p.y, VB_H) + '">' +
                  '<i class="pin-lead" aria-hidden="true"></i>' +
                  '<button type="button" class="pin-btn" aria-expanded="false" aria-controls="an-pin-' + i + '" aria-label="' + n + ' ' + p.name + '"><i></i><b aria-hidden="true">' + n + '</b></button>' +
                  '<div class="pin-txt" id="an-pin-' + i + '"><p class="label"><b>' + n + '</b>' + p.name + '</p><p class="b">' + p.body + '</p></div>' +
                '</div>';
              }).join('') +
            '</div>' +
            '<div class="an-cta"><button type="button" class="cta-btn" aria-pressed="false"><i></i><span class="sr-only cta-sr">Look inside</span></button><span class="label cta-l" aria-hidden="true">Look inside</span></div>' +
            '<div class="an-cap" aria-live="polite"></div>' +
            '<div class="an-bar">' +
              '<p class="an-hint label">' + (R ? 'Pins open one part at a time' : ctx.fine ? 'Move to see through · press to widen' : 'Drag across the body to see through') + '</p>' +
              (R ? '' : '<button type="button" class="btn ghost small an-scan">Scan the body</button>') +
            '</div>' +
            '<ul class="sr-only">' + PINS.map(function (p, i) { return '<li>0' + (i + 1) + ' ' + p.name + ': ' + p.body + '</li>'; }).join('') + '</ul>' +
          '</div>' +
        '</div>';

      var cam = root.querySelector('.an-cam'), lamp = root.querySelector('.an-lamp'), iris = root.querySelector('.an-iris');
      var band = root.querySelector('.an-band'), front = root.querySelector('.an-front');
      var xyEl = root.querySelector('.an-xy'), modeEl = root.querySelector('.an-mode');
      var pinEls = [].slice.call(root.querySelectorAll('.pin')), cap = root.querySelector('.an-cap');
      var ctaBtn = root.querySelector('.cta-btn'), ctaL = root.querySelector('.cta-l'), ctaSr = root.querySelector('.cta-sr');
      var scanBtn = root.querySelector('.an-scan');

      // ---- hotspot-callout-pins: one callout at a time, aria-expanded on the pin button ----
      var active = -1;
      function setPin(i) {
        if (i === active) i = -1;
        pinEls.forEach(function (el, k) {
          var on = k === i;
          el.classList.toggle('on', on);
          el.querySelector('.pin-btn').setAttribute('aria-expanded', on ? 'true' : 'false');
        });
        active = i;
        if (i < 0) { cap.innerHTML = ''; return; }
        var p = PINS[i];
        cap.innerHTML = '<p class="label"><b>0' + (i + 1) + '</b>' + p.name + '</p><p class="b">' + p.body + '</p>';
        if (!R) cap.animate([{ opacity: 0, transform: 'translateY(8px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 600, easing: 'cubic-bezier(.23,1,.32,1)' });
        ctx.audio.click(.25);
      }
      pinEls.forEach(function (el, i) {
        el.querySelector('.pin-btn').addEventListener('click', function (e) { e.stopPropagation(); setPin(i); });
      });
      function onKey(e) { if (e.key === 'Escape' && active >= 0 && root.contains(document.activeElement)) setPin(-1); }

      // ---- cursor-mask-reveal: flashlight state (viewBox units) ----
      var L = { x: 200, y: 128, tx: 200, ty: 128, r: 0, tr: 0, iris: 0, irisTo: 0, inside: false, down: false, scan: -1 };
      var scanTimer = 0, lastScan = 0, tNow = 0;
      function toVB(e) {
        var r = cam.getBoundingClientRect();
        return { x: (e.clientX - r.left) / r.width * VB_W, y: (e.clientY - r.top) / r.height * VB_H };
      }
      function move(e) {
        if (R) return;
        var p = toVB(e); L.tx = p.x; L.ty = p.y; L.inside = true;
        if (e.pointerType !== 'mouse' && !L.down) return;
        L.tr = L.down ? R_PRESS : R_REST;
      }
      function down(e) {
        if (R || e.target.closest('button')) return;
        var p = toVB(e); L.tx = p.x; L.ty = p.y;
        if (e.pointerType !== 'mouse') { L.x = p.x; L.y = p.y; }   // touch: lens appears under the finger
        L.down = true; L.inside = true; L.tr = R_PRESS;
        try { cam.setPointerCapture(e.pointerId); } catch (_) {}
        ctx.audio.tone(180, .25, .05);
      }
      function up(e) {
        L.down = false;
        L.tr = e && e.pointerType === 'mouse' && L.inside ? R_REST : 0;
      }
      function leave(e) { if (e.pointerType === 'mouse' && !L.down) { L.inside = false; L.tr = 0; } }
      if (!R) {
        cam.addEventListener('pointermove', move);
        cam.addEventListener('pointerdown', down);
        cam.addEventListener('pointerup', up);
        cam.addEventListener('pointercancel', up);
        cam.addEventListener('pointerleave', leave);
      }

      // "Look inside": iris the whole X-ray open from the lens centre (instant under reduced motion)
      function setFull(on) {
        L.irisTo = on ? R_FULL : 0;
        if (R) { L.iris = L.irisTo; paint(); }
        ctaBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        ctaL.textContent = ctaSr.textContent = on ? 'Close it up' : 'Look inside';
        modeEl.textContent = on ? 'X-ray' : R ? 'Body' : 'X-ray lens';
        ctx.audio.shutter();
      }
      ctaBtn.addEventListener('click', function () { setFull(ctaBtn.getAttribute('aria-pressed') !== 'true'); });

      // Time-driven sweeping scan (keyboard / no-pointer path): one pass, a glowing wavefront left → right
      var SCAN_DUR = 2.6;
      function scan() {
        if (R) return;
        L.scan = 0; lastScan = tNow;
        ctx.audio.whoosh(.3);
        if (scanBtn) scanBtn.disabled = true;
        clearTimeout(scanTimer);
        scanTimer = setTimeout(function () { if (scanBtn) scanBtn.disabled = false; }, SCAN_DUR * 1000);
      }
      if (scanBtn) scanBtn.addEventListener('click', scan);

      function paint() {
        lamp.setAttribute('cx', L.x.toFixed(1)); lamp.setAttribute('cy', L.y.toFixed(1)); lamp.setAttribute('r', Math.max(0, L.r).toFixed(1));
        iris.setAttribute('r', Math.max(0, L.iris).toFixed(1));
        var on = L.scan >= 0;
        var p = on ? L.scan / SCAN_DUR : 0;
        var e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;   // ease-in-out
        var x = -110 + e * (VB_W + 130);
        band.setAttribute('x', x.toFixed(1));
        front.setAttribute('x1', (x + 82).toFixed(1)); front.setAttribute('x2', (x + 82).toFixed(1));
        front.setAttribute('opacity', on ? (Math.sin(p * Math.PI) * .9).toFixed(2) : '0');
        if (L.r > 2) xyEl.textContent = (L.x / VB_W).toFixed(2) + ' · ' + (L.y / VB_H).toFixed(2) + ' · R ' + Math.round(L.r);
        else xyEl.textContent = on ? 'Scan ' + Math.round(p * 100) + '%' : '— · —';
      }

      var lp = ctx.loop(function (dt, t) {
        tNow = t;
        L.x = ctx.damp(L.x, L.tx, 9, dt); L.y = ctx.damp(L.y, L.ty, 9, dt);
        L.r = ctx.damp(L.r, L.tr, L.tr > L.r ? 7 : 5, dt);
        L.iris = ctx.damp(L.iris, L.irisTo, 3.2, dt);
        if (L.scan >= 0) { L.scan += dt; if (L.scan > SCAN_DUR) L.scan = -1; }
        // no hover available: a slow scan every 10 s while nothing else is happening
        if (!ctx.fine && L.scan < 0 && !L.down && L.irisTo === 0 && t - lastScan > 10) scan();
        paint();
      });

      return {
        start: function () {
          root.classList.remove('is-paused');
          document.addEventListener('keydown', onKey);
          if (!R) { lastScan = tNow - 7; lp.start(); } else paint();
        },
        stop: function () {
          root.classList.add('is-paused');
          document.removeEventListener('keydown', onKey);
          lp.stop(); L.down = false; L.tr = 0; L.r = 0; L.scan = -1;
          clearTimeout(scanTimer); if (scanBtn) scanBtn.disabled = false;
          paint();
        },
        scroll: function () {},
        enter: function () {
          // invite: open the first callout, and show the scan once on touch / keyboard devices
          setTimeout(function () { if (active < 0) setPin(0); }, R ? 0 : 700);
        }
      };
    }
  });
})();
