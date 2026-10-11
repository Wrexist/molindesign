/* inertial-scroll-ranges — native inner scroller driven by exp wheel inertia + drag-flick friction; per-section range ratio drives staggered lines. */
(function () {
  'use strict';
  var ID = 'inertial-scroll-ranges';
  var css = `
& { container-type: inline-size; }
& .sc { position: absolute; inset: 0; overflow-y: hidden; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: rgb(255 255 255 / .25) transparent; outline: none; touch-action: pan-y; }
& .sc.eng { overflow-y: auto; }
& .sc.drag { cursor: grabbing; user-select: none; }
& .sec { position: relative; }
& .bd { height: 100%; display: grid; grid-template-columns: 1.3fr 1fr; align-items: center; align-content: center; padding: 0 40px; }
& .tag { position: sticky; top: 22px; z-index: 1; margin: 0; padding: 22px 40px 0; height: 0; overflow: visible; color: rgb(255 255 255 / .56); }
& .tag b { color: #f97316; font-weight: 500; }
& h4 { margin: 0; font-stretch: 125%; font-weight: 400; font-size: clamp(24px, 5cqi, 52px); line-height: 1.04; letter-spacing: -.03em; color: #fff; }
& h4 span { display: block; will-change: transform, opacity; white-space: nowrap; }
& h4 span:nth-child(2) { color: rgb(255 255 255 / .7); font-style: italic; }
& .obj { justify-self: center; width: min(26cqi, 220px); aspect-ratio: 1; border-radius: 50%; will-change: transform, opacity;
  background: radial-gradient(circle at 35% 30%, #fff 0, rgb(255 255 255 / .5) 8%, transparent 32%), radial-gradient(circle at 50% 55%, #f97316, rgb(249 115 22 / .25) 55%, transparent 70%); box-shadow: 0 0 80px rgb(249 115 22 / .25); }
& .sec:nth-child(odd) .obj { background: radial-gradient(circle at 35% 30%, #fff 0, rgb(255 255 255 / .4) 8%, transparent 32%), radial-gradient(circle at 50% 55%, rgb(255 255 255 / .55), rgb(255 255 255 / .08) 55%, transparent 70%); box-shadow: 0 0 60px rgb(255 255 255 / .08); }
& .dash { grid-column: 1; height: 1px; background: rgb(255 255 255 / .45); width: 0; margin-top: 18px; }
& .hud { position: absolute; right: 16px; top: 16px; width: 214px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgb(255 255 255 / .1); background: rgb(0 0 0 / .6); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); color: rgb(255 255 255 / .5); pointer-events: none; }
& .hud p { margin: 0 0 4px; display: flex; justify-content: space-between; }
& .hud p em { font-style: normal; color: #fff; }
& .hud .md { color: #f97316; }
& .rr { display: grid; grid-template-columns: 22px 1fr 42px; gap: 8px; align-items: center; margin-top: 6px; }
& .rr i { position: relative; height: 3px; background: rgb(255 255 255 / .1); }
& .rr i::before { content: ""; position: absolute; left: 50%; top: -3px; bottom: -3px; width: 1px; background: rgb(255 255 255 / .4); }
& .rr b { position: absolute; left: 50%; top: 0; bottom: 0; width: 50%; background: #f97316; transform-origin: left; transform: scaleX(0); }
& .rr em { font-style: normal; text-align: right; color: rgb(255 255 255 / .8); }
& .pill { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); padding: 9px 16px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .18); background: rgb(0 0 0 / .6); backdrop-filter: blur(10px); color: rgb(255 255 255 / .8); white-space: nowrap; pointer-events: none; transition: border-color .3s, color .3s; }
& .pill.on { border-color: rgb(249 115 22 / .6); color: #fff; }
@container (max-width: 620px) {
  & .bd { grid-template-columns: 1fr; padding: 0 22px; gap: 22px; }
  & .tag { padding: 16px 22px 0; }
  & .obj { width: 34cqi; justify-self: start; grid-row: 2; }
  & .dash { grid-row: 4; }
  & .hud { left: 14px; right: 14px; width: auto; top: auto; bottom: 62px; padding: 8px 12px; }
  & .hud p:nth-child(2), & .hud p:nth-child(3) { display: none; }
  & .hud .rws { display: grid; grid-template-columns: 1fr 1fr; column-gap: 14px; }
}
`.replace(/&/g, '.d-' + ID);

  var SECTIONS = [
    ['Driver', ['Keep the', 'native scroll,', 'drive it yourself.']],
    ['Wheel', ['Wheel deltas', 'ease to a target', 'at e^(−12·dt).']],
    ['Flick', ['Flicks coast on', 'friction 2.1 → 1.9,', 'faster flies longer.']],
    ['Range', ['One ratio per', 'section moves', 'every layer.']]
  ];
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var cubicOut = function (t) { return 1 - Math.pow(1 - t, 3); }, cubicIn = function (t) { return t * t * t; };
  function fit(x, a, b, c, d, e) { return c + (e || function (t) { return t; })(clamp01((x - a) / (b - a))) * (d - c); }

  Lib.register(ID, {
    hint: 'Scroll the page, or click inside and use wheel, drag-flick or arrow keys',
    notes: [
      'Wheel: <code>delta = clamp(wheelY, −200, 200)</code>, <code>pos += (target − pos)·(1 − e<sup>−12·dt</sup>)</code>, stop under 0.1 px',
      'Flick: velocity = time-weighted mean of the last 0.1 s; <code>v += −mix(2.1, 1.9, |v/vh/5|)·v·dt</code>',
      'Range ratio: <code>min(0, fit(o, V, V−h, −1, 0)) + max(0, fit(o, 0, −h, 0, 1))</code>, −1 below, 0 on screen, +1 gone',
      'Per line <code>I = 1 − i/(n−1)</code>: exit <code>k = fit(l, I·.2, I·.2 + .8, 1, 0)</code>, blur up to .3 em (desktop only)',
      'Native <code>position: sticky</code> keeps working: the section tags here are plain sticky elements'
    ],
    simplified: 'The driver runs on an inner box instead of the window, entry is scroll-driven rather than timed after a loader, and touch uses native momentum.',
    css: css,
    mount: function (stage, ctx) {
      var clamp = ctx.clamp, reduced = ctx.reduced, n = SECTIONS.length;
      var pad = function (x) { return String(x).padStart(2, '0'); };
      stage.innerHTML = '<div class="sc" tabindex="0" aria-label="Inertial scroll demo, ' + n + ' sections. Use arrow keys or Page Up/Down." data-cursor="Drag">' +
        SECTIONS.map(function (s, i) {
          return '<section class="sec"><p class="tag label"><b>' + pad(i + 1) + '</b> / ' + pad(n) + ' — ' + s[0] + '</p>' +
            '<div class="bd"><h4 aria-label="' + s[1].join(' ') + '">' + s[1].map(function (l) { return '<span aria-hidden="true">' + l + '</span>'; }).join('') + '</h4>' +
            '<div class="obj" aria-hidden="true"></div><div class="dash" aria-hidden="true"></div></div></section>';
        }).join('') + '</div>' +
        '<div class="hud label" aria-hidden="true"><p><span>Mode</span><em class="md">page</em></p><p><span>pos → target</span><em class="pt">0</em></p><p><span>velocity</span><em class="vl">0</em></p><div class="rws">' +
        SECTIONS.map(function (s, i) { return '<div class="rr"><span>' + pad(i + 1) + '</span><i><b></b></i><em>−1.00</em></div>'; }).join('') + '</div></div>' +
        '<p class="pill label">' + (ctx.fine ? 'Click to steer with wheel + drag' : 'Tap to scroll inside') + '</p>';
      var q = function (s) { return stage.querySelector(s); };
      var sc = q('.sc'), chip = q('.pill'), md = q('.md'), pt = q('.pt'), vl = q('.vl');
      var secEls = stage.querySelectorAll('.sec'), rr = stage.querySelectorAll('.rr');
      var secs = Array.prototype.map.call(secEls, function (el) {
        return { el: el, lines: el.querySelectorAll('h4 span'), obj: el.querySelector('.obj'), dash: el.querySelector('.dash'), top: 0, h: 0, active: true };
      });
      var V = 0, max = 0, measured = false, mobile = false;
      var pos = 0, target = 0, v = 0, written = -1, wheeling = false, dragging = false, engaged = false, hist = [], lastY = 0, lastT = 0, P = 0, lastP = -1, mode = 'page';
      function measure() {
        V = sc.clientHeight; mobile = stage.clientWidth < 620;
        secs.forEach(function (s) { s.el.style.height = Math.round(V * .82) + 'px'; });
        secs.forEach(function (s) { s.top = s.el.offsetTop; s.h = s.el.offsetHeight; });
        max = Math.max(0, sc.scrollHeight - V); measured = true;
      }
      function setMode(m) { if (m !== mode) { mode = m; md.textContent = m; } }
      function engage(on) {
        if (on === engaged) return;
        engaged = on; sc.classList.toggle('eng', on); chip.classList.toggle('on', on);
        chip.textContent = on ? (ctx.fine ? 'Wheel · drag · ↑ ↓ — Esc to release' : 'Swipe inside — tap outside to release') : (ctx.fine ? 'Click to steer with wheel + drag' : 'Tap to scroll inside');
        if (!on) { lastP = -1; dragging = false; sc.classList.remove('drag'); }
      }
      function step(dt) {
        if (reduced) { pos = target; }
        else if (wheeling) {
          pos += (target - pos) * (1 - Math.exp(-12 * dt));
          if (Math.abs(target - pos) < .1) { pos = target; wheeling = false; }
        } else if (!dragging && Math.abs(v) > 1) {
          v += -(2.1 + (1.9 - 2.1) * clamp01(Math.abs(v / V / 5))) * v * dt;
          pos = clamp(pos + v * dt, 0, max); target = pos;
          if (pos <= 0 || pos >= max) v = 0;
        } else v = 0;
        if (Math.abs(pos - written) > .1) { written = pos; sc.scrollTop = pos; }
      }
      function ranges() {
        secs.forEach(function (s, idx) {
          var o = s.top - pos, h = s.h;
          var ratio = Math.min(0, fit(o, V, V - h, -1, 0)) + Math.max(0, fit(o, 0, -h, 0, 1));
          var rb = rr[idx].querySelector('b'), re = rr[idx].querySelector('em');
          rb.style.transform = 'scaleX(' + ratio.toFixed(3) + ')'; re.textContent = (ratio < 0 ? '−' : '+') + Math.abs(ratio).toFixed(2);
          var active = ratio > -1 && ratio < 1;
          if (active !== s.active) { s.active = active; s.el.style.visibility = active ? '' : 'hidden'; }
          if (!active) return;
          var show = -(o - V) / V, hide = -(o + h) / V;
          var l = fit(hide, -1, -.5, 1, 0), nl = s.lines.length, enterAll = fit(show, .3, .9, 0, 1, cubicOut);
          s.lines.forEach(function (ln, i) {
            if (reduced) { ln.style.opacity = 1; ln.style.transform = 'none'; ln.style.filter = 'none'; return; }
            var I = 1 - i / (nl - 1), E = i / (nl - 1);
            var en = fit(show, .3 + E * .15, .8 + E * .15, 0, 1, cubicOut);
            var k = fit(l, I * .2, I * .2 + .8, 1, 0);
            ln.style.opacity = (en * (1 - k)).toFixed(3);
            var ex = fit(l, I * .2, I * .2 + .8, 1, 0, cubicOut);
            ln.style.transform = mobile ? 'translate3d(0,' + ((1 - en) * 1.2 - ex * 2).toFixed(3) + 'em,0)'
              : 'translate3d(' + (ex * 2).toFixed(3) + 'em,' + ((1 - en) * 1.2).toFixed(3) + 'em,0)';
            ln.style.filter = mobile ? 'none' : 'blur(' + fit(k, .25, .75, 0, .3).toFixed(3) + 'em)';
          });
          var z = reduced ? 1 : fit(l, 1, 0, 1, .95, cubicIn);
          s.obj.style.opacity = reduced ? 1 : (l * enterAll).toFixed(3);
          s.obj.style.transform = 'scale(' + (z * (reduced ? 1 : .85 + .15 * enterAll)).toFixed(4) + ')';
          s.dash.style.width = (reduced ? 100 : fit(l * enterAll, 0, 1, 0, 100, cubicOut)).toFixed(2) + '%';
        });
        pt.textContent = Math.round(pos) + ' → ' + Math.round(target);
        vl.textContent = Math.round(dragging ? 0 : v) + ' px/s';
      }
      var lp = ctx.loop(function (dt) {
        if (!measured) measure();
        if (!engaged && Math.abs(P - lastP) > 1e-4) { lastP = P; target = P * max; wheeling = true; setMode('page'); }
        step(dt); ranges();
      });
      // native scroll that we did not write (scrollbar drag, touch, find-in-page) resets the driver
      sc.addEventListener('scroll', function () {
        if (Math.abs(sc.scrollTop - written) <= 1.5) return;
        pos = target = written = sc.scrollTop; v = 0; wheeling = false; setMode('native');
      }, { passive: true });
      sc.addEventListener('wheel', function (e) {
        if (!engaged || e.ctrlKey || reduced) return;
        var dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? V : 1);
        var d = clamp(dy, -200, 200);
        if ((d > 0 && target >= max - .5) || (d < 0 && target <= .5)) return;   // can't scroll that way: let the page have it
        e.preventDefault();
        target = clamp(target + d, 0, max); wheeling = true; v = 0; setMode('wheel');
      }, { passive: false });
      sc.addEventListener('pointerdown', function (e) {
        engage(true);
        if (e.pointerType !== 'mouse' || e.button !== 0 || reduced) return;
        dragging = true; wheeling = false; v = 0; hist = []; lastY = e.clientY; lastT = performance.now();
        sc.setPointerCapture(e.pointerId); sc.classList.add('drag'); setMode('drag');
      });
      sc.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var now = performance.now(), dy = lastY - e.clientY;
        pos = target = clamp(pos + dy, 0, max);
        hist.push([dy, (now - lastT) / 1000, now]); lastY = e.clientY; lastT = now;
        while (hist.length && now - hist[0][2] > 100) hist.shift();
      });
      function release() {
        if (!dragging) return;
        dragging = false; sc.classList.remove('drag');
        var d = 0, t = 0, now = performance.now();
        hist.forEach(function (h) { if (now - h[2] <= 100) { d += h[0]; t += h[1]; } });
        v = t > 0 ? d / t : 0; setMode(Math.abs(v) > 1 ? 'flick' : 'drag');
      }
      sc.addEventListener('pointerup', release); sc.addEventListener('pointercancel', release);
      sc.addEventListener('keydown', function (e) {
        var k = { ArrowDown: 100, ArrowUp: -100, PageDown: V, PageUp: -V, ' ': e.shiftKey ? -V : V, Home: -1e9, End: 1e9 }[e.key];
        if (e.key === 'Escape') { engage(false); return; }
        if (k == null) return;
        e.preventDefault(); engage(true);
        target = clamp(target + k, 0, max); wheeling = true; v = 0; setMode('keys');
      });
      sc.addEventListener('focus', function () { engage(true); });
      sc.addEventListener('blur', function () { if (!stage.matches(':hover')) engage(false); });
      stage.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && document.activeElement !== sc) engage(false); });
      function outside(e) { if (!stage.contains(e.target)) { engage(false); if (document.activeElement === sc) sc.blur(); } }
      var ro = new ResizeObserver(function () { measured = false; });
      return {
        start: function () { ro.observe(stage); document.addEventListener('pointerdown', outside); lp.start(); },
        stop: function () { lp.stop(); ro.disconnect(); document.removeEventListener('pointerdown', outside); engage(false); v = 0; wheeling = false; },
        scroll: function () {
          var r = stage.getBoundingClientRect(), vh = innerHeight;
          P = clamp(((vh - r.top) / (vh + r.height) - .18) / .64, 0, 1);
        }
      };
    }
  });
})();
