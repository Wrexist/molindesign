/* device-agnostic-input-actions: named actions over keyboard (event.code), polled gamepads (0.1 rescaled dead-zone) and a touch virtual gamepad that is just another pad. */
(function () {
  var ID = 'device-agnostic-input-actions';
  var ACC = '#f97316';
  var dead = function (v, d) { d = d || 0.1; return Math.abs(v) < d ? 0 : Math.sign(v) * Math.min(1, (Math.abs(v) - d) / (1 - d)); };
  var GLYPHS = {
    keyboard: { MOVE: 'A D · ← →', JUMP: 'Space', SHOOT: 'J', PAUSE: 'Esc', CONFIRM: 'Enter' },
    gamepad: { MOVE: 'L-stick · D-pad', JUMP: 'Ⓐ', SHOOT: 'Ⓧ', PAUSE: 'Start', CONFIRM: 'Ⓐ' },
    touch: { MOVE: 'Stick', JUMP: 'A', SHOOT: 'X', PAUSE: '≡', CONFIRM: 'A' }
  };
  var GAME_CODES = ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyJ', 'KeyK', 'Escape', 'KeyP', 'Enter'];

  Lib.register(ID, {
    hint: 'Click the stage, then A/D + Space + J; or plug in a pad; or use the on-screen pad',
    notes: [
      'Gameplay reads named actions (<code>MOVE</code> vec2, <code>JUMP</code>, <code>SHOOT</code>); each action holds many bindings and the strongest one wins',
      'Gamepads are polled every frame; buttons count above <code>.5</code>, axes use a rescaled <code>.1</code> dead-zone <code>(|v|−d)/(1−d)</code>',
      'Keyboard uses <code>event.code</code> (layout-independent); held keys are cleared on blur, tab hide and map switch',
      'Touch is a virtual gamepad pushed into the same pad list, so no gameplay code knows about touch',
      'Action maps enable per scene (here: play vs pause menu); glyphs swap with the active device; haptics <code>[20, 40, 20]</code> only after a gesture'
    ],
    simplified: 'One small 2D scene instead of a three.js world; glyphs are text instead of images, and there is no binding remap UI.',
    css: [
      '.d-' + ID + ' { outline: none; }',
      '.d-' + ID + ':focus-visible { box-shadow: inset 0 0 0 1px ' + ACC + '; }',
      '.d-' + ID + ' canvas { position: absolute; inset: 0; }',
      '.d-' + ID + ' .hud { position: absolute; top: 18px; left: 20px; right: 20px; display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; color: rgb(255 255 255 / .5); pointer-events: none; }',
      '.d-' + ID + ' .dev b { color: ' + ACC + '; font-weight: 500; }',
      '.d-' + ID + ' .acts { display: flex; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }',
      '.d-' + ID + ' .acts span.on { color: #fff; }',
      '.d-' + ID + ' .legend { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); display: flex; gap: 14px; color: rgb(255 255 255 / .5); pointer-events: none; white-space: nowrap; }',
      '.d-' + ID + ' .legend kbd { font: inherit; color: #fff; padding: 3px 7px; margin-left: 5px; border: 1px solid rgb(255 255 255 / .25); border-radius: 5px; }',
      '.d-' + ID + ' .focus { position: absolute; left: 50%; top: 42%; transform: translate(-50%, -50%); padding: 10px 16px; border-radius: 999px; background: rgb(0 0 0 / .6); border: 1px solid rgb(255 255 255 / .2); color: #fff; pointer-events: none; transition: opacity .4s; white-space: nowrap; }',
      '.d-' + ID + ':focus-within .focus, .d-' + ID + '.played .focus { opacity: 0; }',
      '.d-' + ID + ' .stick { position: absolute; left: 22px; bottom: 22px; width: 92px; height: 92px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .25); background: rgb(255 255 255 / .04); touch-action: none; }',
      '.d-' + ID + ' .stick i { position: absolute; left: 50%; top: 50%; width: 38px; height: 38px; margin: -19px; border-radius: 50%; background: rgb(255 255 255 / .85); }',
      '.d-' + ID + ' .vb { position: absolute; width: 52px; height: 52px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .3); color: #fff; touch-action: none; user-select: none; -webkit-touch-callout: none; font-weight: 600; }',
      '.d-' + ID + ' .vb.on { background: ' + ACC + '; border-color: ' + ACC + '; color: #000; }',
      '.d-' + ID + ' .vb.a { right: 22px; bottom: 40px; } .d-' + ID + ' .vb.x { right: 84px; bottom: 22px; } .d-' + ID + ' .vb.st { right: 22px; top: 54px; width: 36px; height: 36px; }',
      '.d-' + ID + ' .vpad { opacity: .55; transition: opacity .3s; } .d-' + ID + ' .vpad.live { opacity: 1; }',
      '.d-' + ID + ' .menu { position: absolute; inset: 0; display: grid; place-items: center; align-content: center; gap: 14px; background: rgb(0 0 0 / .72); }',
      '.d-' + ID + ' .menu[hidden] { display: none; }',
      '.d-' + ID + ' .menu p { margin: 0; font-family: Archivo, sans-serif; font-stretch: 125%; font-size: 34px; letter-spacing: -.02em; color: #fff; }',
      '.d-' + ID + ' .menu button { padding: 10px 18px; border-radius: 999px; background: #fff; color: #000; }',
      '.d-' + ID + ' .menu button kbd { font: inherit; opacity: .6; margin-left: 8px; }',
      '@media (max-width: 640px) { .d-' + ID + ' .legend { bottom: 126px; gap: 4px 8px; font-size: 9px; letter-spacing: .1em; flex-wrap: wrap; justify-content: center; width: calc(100% - 24px); white-space: normal; } .d-' + ID + ' .legend kbd { padding: 2px 5px; margin-left: 3px; } .d-' + ID + ' .acts { justify-content: flex-start; } }'
    ].join('\n'),
    mount: function (stage, ctx) {
      var el = ctx.el, reduced = ctx.reduced;
      stage.tabIndex = 0;
      stage.setAttribute('aria-label', 'Playable input demo. Focus, then use A and D or arrows to move, Space to jump, J to shoot, Escape to pause.');
      var cv = el('canvas'), g = cv.getContext('2d');
      var hud = el('div', 'hud label', '<span class="dev">Input · <b>keyboard</b></span><span class="acts"></span>');
      var legend = el('div', 'legend label');
      var focusHint = el('div', 'focus label', ctx.fine ? 'Click or Tab here to play' : 'Use the pad below');
      var vpad = el('div', 'vpad'); vpad.setAttribute('aria-hidden', 'true');
      vpad.innerHTML = '<div class="stick" data-cursor="Drag"><i></i></div><button type="button" tabindex="-1" class="vb a">A</button><button type="button" tabindex="-1" class="vb x">X</button><button type="button" tabindex="-1" class="vb st">≡</button>';
      var menu = el('div', 'menu'); menu.hidden = true;
      menu.innerHTML = '<span class="label" style="color:rgb(255 255 255 / .5)">Action map · menu</span><p>Paused</p><button type="button" class="label res">Resume <kbd></kbd></button>';
      [cv, hud, legend, focusHint, vpad, menu].forEach(function (n) { stage.appendChild(n); });
      var devEl = hud.querySelector('.dev b'), actsEl = hud.querySelector('.acts'), knob = vpad.querySelector('.stick i');

      /* ---------- input layer ---------- */
      var keys = new Set(), gestured = false;
      var vgp = { index: 'virtual', id: 'Virtual gamepad', axes: [0, 0, 0, 0], buttons: [] };
      for (var bi = 0; bi < 17; bi++) vgp.buttons.push({ value: 0, pressed: false });
      var pads = [], device = ctx.fine ? 'keyboard' : 'touch';
      function pollPads() {
        pads.length = 0;
        var list = navigator.getGamepads ? navigator.getGamepads() : [];
        for (var i = 0; i < list.length; i++) if (list[i]) pads.push(list[i]);
        pads.push(vgp);
      }
      var axis = function (i) { return pads.reduce(function (s, p) { return s + (p.axes[i] || 0); }, 0); };
      var btn = function (i) { return pads.some(function (p) { return p.buttons[i] && p.buttons[i].value > 0.5; }) ? 1 : 0; };
      var tapped = new Set();      // keys pressed and released between two frames still count once
      var k = function (c) { return keys.has(c) || tapped.has(c) ? 1 : 0; };
      function vec(x, y, norm) { var m = Math.hypot(x, y); return norm && m > 1 ? [x / m, y / m] : [x, y]; }
      function Action(name, kind, bindings) { return { name: name, kind: kind, bindings: bindings, x: 0, y: 0, value: 0, pressed: false, was: false, on: {} }; }
      var A = {
        MOVE: Action('MOVE', 'vec2', [
          function () { return vec(k('KeyD') - k('KeyA'), k('KeyW') - k('KeyS'), true); },
          function () { return vec(k('ArrowRight') - k('ArrowLeft'), k('ArrowUp') - k('ArrowDown'), true); },
          function () { return [dead(axis(0)), -dead(axis(1))]; },                 // invertY
          function () { return vec(btn(15) - btn(14), btn(12) - btn(13), true); }   // D-pad
        ]),
        JUMP: Action('JUMP', 'button', [function () { return k('Space') || k('KeyK'); }, function () { return btn(0); }]),
        SHOOT: Action('SHOOT', 'button', [function () { return k('KeyJ'); }, function () { return btn(2); }]),
        PAUSE: Action('PAUSE', 'button', [function () { return k('Escape') || k('KeyP'); }, function () { return btn(9); }]),
        CONFIRM: Action('CONFIRM', 'button', [function () { return k('Enter') || k('Space'); }, function () { return btn(0); }])
      };
      var MAPS = { play: ['MOVE', 'JUMP', 'SHOOT', 'PAUSE'], menu: ['CONFIRM', 'PAUSE'] }, enabled = MAPS.play;
      function readAction(a) {
        if (a.kind === 'vec2') {                      // strongest binding wins, so mixed input never double-counts
          var best = [0, 0];
          a.bindings.forEach(function (b) { var v = b(); if (Math.hypot(v[0], v[1]) > Math.hypot(best[0], best[1])) best = v; });
          a.x = best[0]; a.y = best[1]; a.pressed = Math.hypot(a.x, a.y) > 1e-3;
        } else {
          a.value = Math.max.apply(null, a.bindings.map(function (b) { return b(); })); a.pressed = a.value > 0.5;
        }
      }
      function enableOnly(name) {
        Object.keys(A).forEach(function (n) {
          var a = A[n];
          if (MAPS[name].indexOf(n) < 0 && a.pressed && a.on.released) a.on.released();
          a.x = a.y = a.value = 0; a.pressed = false;
          readAction(a); a.was = a.pressed;          // keys still held don't fire in the new map
        });
        enabled = MAPS[name];
      }
      function setDevice(d) {
        if (d === device) return; device = d; renderGlyphs();
      }
      function renderGlyphs() {
        var gl = GLYPHS[device];
        devEl.textContent = device;
        legend.innerHTML = ['MOVE', 'JUMP', 'SHOOT', 'PAUSE'].map(function (n) { return '<span>' + n.toLowerCase() + '<kbd>' + gl[n] + '</kbd></span>'; }).join('');
        menu.querySelector('kbd').textContent = gl.CONFIRM;
      }

      /* keyboard: listeners live on the stage, so they only fire while it has focus */
      function kd(e) {
        if (/input|textarea/i.test(e.target.tagName)) return;
        if (GAME_CODES.indexOf(e.code) < 0) return;
        if (e.code === 'Escape') e.stopPropagation();
        e.preventDefault(); keys.add(e.code); tapped.add(e.code); gestured = true; setDevice('keyboard');
      }
      function ku(e) { keys.delete(e.code); }
      function clearHeld() { keys.clear(); tapped.clear(); }
      stage.addEventListener('keydown', kd); stage.addEventListener('keyup', ku);
      stage.addEventListener('focusout', function (e) { if (!stage.contains(e.relatedTarget)) clearHeld(); });
      stage.addEventListener('pointerdown', function (e) { gestured = true; if (e.target === cv) stage.focus({ preventScroll: true }); });
      stage.addEventListener('mousemove', function () { if (device === 'gamepad') setDevice('keyboard'); });

      /* virtual gamepad: per-pointer ids, drag-relative stick */
      var stick = vpad.querySelector('.stick'), stickId = null, sx = 0, sy = 0;
      stick.addEventListener('pointerdown', function (e) { e.preventDefault(); stickId = e.pointerId; stick.setPointerCapture(e.pointerId); var r = stick.getBoundingClientRect(); sx = r.left + r.width / 2; sy = r.top + r.height / 2; moveStick(e); vpad.classList.add('live'); stage.classList.add('played'); setDevice('touch'); });
      function moveStick(e) {
        if (e.pointerId !== stickId) return;
        var dx = (e.clientX - sx) / 40, dy = (e.clientY - sy) / 40, m = Math.hypot(dx, dy);
        if (m > 1) { dx /= m; dy /= m; }
        vgp.axes[0] = dx; vgp.axes[1] = dy;
        knob.style.transform = 'translate(' + (dx * 26).toFixed(1) + 'px,' + (dy * 26).toFixed(1) + 'px)';
      }
      function endStick(e) { if (e.pointerId !== stickId) return; stickId = null; vgp.axes[0] = vgp.axes[1] = 0; knob.style.transform = ''; }
      stick.addEventListener('pointermove', moveStick); stick.addEventListener('pointerup', endStick); stick.addEventListener('pointercancel', endStick);
      [['.vb.a', 0], ['.vb.x', 2], ['.vb.st', 9]].forEach(function (p) {
        var b = vpad.querySelector(p[0]);
        var vb = vgp.buttons[p[1]];
        var set = function (v) {      // a tap shorter than a frame is latched until the next poll
          if (!v && vb.justDown) { vb.pendingUp = true; b.classList.remove('on'); return; }
          vb.value = v; vb.pressed = !!v; vb.justDown = !!v; b.classList.toggle('on', !!v); if (v) stage.classList.add('played');
        };
        b.addEventListener('pointerdown', function (e) { e.preventDefault(); b.setPointerCapture(e.pointerId); set(1); vpad.classList.add('live'); setDevice('touch'); });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { b.addEventListener(t, function () { set(0); }); });
      });
      menu.querySelector('.res').addEventListener('click', function () { resume(); });

      /* haptics: only after a gesture, only while visible, never in calm mode */
      function buzz() { if (!reduced && gestured && navigator.vibrate && document.visibilityState === 'visible') { try { navigator.vibrate([20, 40, 20]); } catch (e) {} } }

      /* ---------- game ---------- */
      var W = 1, H = 1, P = { x: 0.3, y: 0, vx: 0, vy: 0, face: 1, ground: false, sq: 0 }, shots = [], targets = [], sparks = [], score = 0;
      function pause() { menu.hidden = false; enableOnly('menu'); menu.querySelector('.res').focus({ preventScroll: true }); }
      function resume() { menu.hidden = true; enableOnly('play'); stage.focus({ preventScroll: true }); }
      A.JUMP.on.pressed = function () { if (P.ground) { P.vy = -560; P.ground = false; P.sq = -0.25; } };
      A.SHOOT.on.pressed = function () { shots.push({ x: P.x * W + P.face * 12, y: P.y - 12, v: P.face * 640, life: 1.2 }); };
      A.PAUSE.on.pressed = function () { if (enabled === MAPS.play) pause(); else resume(); };
      A.CONFIRM.on.pressed = function () { resume(); };
      function plats() { var gy = H * (H > W ? 0.56 : 0.66); return [[0, gy, W], [W * 0.18, gy - H * 0.16, W * 0.2], [W * 0.56, gy - H * 0.24, W * 0.22]]; }
      function spawn(t, i) { var p = plats()[[1, 2, 2][i]]; t.x = p[0] + p[2] * ([0.5, 0.2, 0.8][i] + (Math.random() - 0.5) * 0.2); t.y = p[1] - 30 - Math.random() * 24; t.dead = 0; }
      for (var ti = 0; ti < 3; ti++) targets.push({ x: 0, y: 0, dead: 0, i: ti });
      var padTick = 0, lastActs = '';
      var lp = ctx.loop(function (dt, t) {
        pollPads();
        padTick += dt;
        if (padTick > 0.2) {                       // 5 Hz device detection for real pads
          padTick = 0;
          var list = navigator.getGamepads ? navigator.getGamepads() : [];
          for (var i = 0; i < list.length; i++) { var p = list[i]; if (!p) continue;
            if (p.axes.some(function (a) { return dead(a) !== 0; }) || p.buttons.some(function (b) { return b.value > 0.5; })) { setDevice('gamepad'); gestured = true; } }
        }
        enabled.forEach(function (n) {
          var a = A[n]; readAction(a);
          if (a.pressed && !a.was && a.on.pressed) a.on.pressed();
          if (!a.pressed && a.was && a.on.released) a.on.released();
          a.was = a.pressed;
        });
        tapped.clear();
        vgp.buttons.forEach(function (b) { b.justDown = false; if (b.pendingUp) { b.pendingUp = false; b.value = 0; b.pressed = false; } });
        var ah = 'move <span class="' + (A.MOVE.pressed ? 'on' : '') + '">' + A.MOVE.x.toFixed(2) + ', ' + A.MOVE.y.toFixed(2) + '</span>' +
          '<span class="' + (A.JUMP.pressed ? 'on' : '') + '">jump ' + (A.JUMP.pressed ? '●' : '○') + '</span>' +
          '<span class="' + (A.SHOOT.pressed ? 'on' : '') + '">shoot ' + (A.SHOOT.pressed ? '●' : '○') + '</span><span>score ' + score + '</span>';
        if (ah !== lastActs) { lastActs = ah; actsEl.innerHTML = ah; }
        // sim (frozen while the menu map is active)
        var ps = plats();
        if (enabled === MAPS.play) {
          P.vx = ctx.damp(P.vx, A.MOVE.x * 230, 14, dt);
          if (Math.abs(A.MOVE.x) > 0.1) P.face = Math.sign(A.MOVE.x);
          P.vy += 1600 * dt;
          var ny = P.y + P.vy * dt, nx = P.x + P.vx * dt / W;
          P.ground = false;
          ps.forEach(function (pl) {
            if (P.vy >= 0 && P.y <= pl[1] + 1 && ny >= pl[1] && nx * W > pl[0] - 8 && nx * W < pl[0] + pl[2] + 8) { if (P.vy > 300) P.sq = 0.22; ny = pl[1]; P.vy = 0; P.ground = true; }
          });
          P.x = Math.min(0.97, Math.max(0.03, nx)); P.y = ny;
          if (P.y > H + 40) { P.y = ps[0][1]; P.vy = 0; }
          shots.forEach(function (s) {
            s.x += s.v * dt; s.life -= dt;
            targets.forEach(function (tg) {
              if (!tg.dead && Math.hypot(s.x - tg.x, s.y - tg.y) < 16) {
                tg.dead = 2; s.life = 0; score++; buzz();
                for (var q = 0; q < (reduced ? 4 : 12); q++) { var an = q / 12 * 6.283; sparks.push({ x: tg.x, y: tg.y, vx: Math.cos(an) * 140, vy: Math.sin(an) * 140, l: 0.5 }); }
              }
            });
          });
          shots = shots.filter(function (s) { return s.life > 0 && s.x > -10 && s.x < W + 10; });
          targets.forEach(function (tg) { if (tg.dead > 0) { tg.dead -= dt; if (tg.dead <= 0) spawn(tg, tg.i); } });
          sparks.forEach(function (s) { s.x += s.vx * dt; s.y += s.vy * dt; s.l -= dt; });
          sparks = sparks.filter(function (s) { return s.l > 0; });
          P.sq = ctx.damp(P.sq, 0, 10, dt);
        }
        // draw
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1;
        for (var gx = 0; gx < W; gx += 32) { g.beginPath(); g.moveTo(gx + 0.5, 0); g.lineTo(gx + 0.5, H); g.stroke(); }
        ps.forEach(function (pl, i) { g.fillStyle = i ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.08)'; g.fillRect(pl[0], pl[1], pl[2], i ? 6 : H - pl[1]); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(pl[0], pl[1], pl[2], 1); });
        targets.forEach(function (tg) {
          if (tg.dead) return;
          var bob = reduced ? 0 : Math.sin(t * 2 + tg.i) * 4;
          g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.5; g.beginPath(); g.arc(tg.x, tg.y + bob, 11, 0, 7); g.stroke();
          g.fillStyle = ACC; g.beginPath(); g.arc(tg.x, tg.y + bob, 3, 0, 7); g.fill();
        });
        g.fillStyle = '#fff'; shots.forEach(function (s) { g.fillRect(s.x - 5, s.y - 1.5, 10, 3); });
        sparks.forEach(function (s) { g.fillStyle = 'rgba(249,115,22,' + (s.l * 2).toFixed(2) + ')'; g.fillRect(s.x - 2, s.y - 2, 4, 4); });
        var px = P.x * W, sw = 22 * (1 + P.sq), sh = 22 * (1 - P.sq);
        g.fillStyle = ACC; g.beginPath(); g.roundRect ? g.roundRect(px - sw / 2, P.y - sh, sw, sh, 5) : g.rect(px - sw / 2, P.y - sh, sw, sh); g.fill();
        g.fillStyle = '#000'; g.fillRect(px + P.face * 4 - 1.5, P.y - sh * 0.68, 3, 5);
      });
      var dpr = 1;
      function resize() { var f = ctx.fitCanvas(cv, stage, 2); W = f.w; H = f.h; dpr = f.dpr; if (!P.y) P.y = plats()[0][1]; targets.forEach(function (tg) { spawn(tg, tg.i); }); }
      var ro = new ResizeObserver(resize);
      function onWinBlur() { clearHeld(); }
      function onVis() { if (document.hidden) clearHeld(); }
      renderGlyphs(); resize();

      return {
        start: function () { ro.observe(stage); addEventListener('blur', onWinBlur); document.addEventListener('visibilitychange', onVis); lp.start(); },
        stop: function () {
          lp.stop(); ro.disconnect(); clearHeld();
          removeEventListener('blur', onWinBlur); document.removeEventListener('visibilitychange', onVis);
          vgp.axes[0] = vgp.axes[1] = 0; vgp.buttons.forEach(function (b) { b.value = 0; b.pressed = false; });
          if (gestured && navigator.vibrate) { try { navigator.vibrate(0); } catch (e) {} }
        }
      };
    }
  });
})();
