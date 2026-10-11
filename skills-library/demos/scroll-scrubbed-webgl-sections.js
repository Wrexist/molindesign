/* scroll-scrubbed-webgl-sections — one canvas behind DOM sections; each section scrubs its own paused timelines. */
(function () {
  'use strict';
  var ID = 'scroll-scrubbed-webgl-sections';
  var css = `
& { container-type: inline-size; }
& .cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; }
& .pg { position: absolute; inset: 0; overflow: hidden; }
& .inner { position: absolute; left: 0; right: 0; top: 0; will-change: transform; }
& .sec { position: relative; display: flex; flex-direction: column; justify-content: center; padding: 0 0 0 36px; max-width: 46%; }
& .sec .label { color: rgb(255 255 255 / .45); margin: 0 0 14px; }
& .sec h4 { margin: 0 0 14px; font-stretch: 125%; font-weight: 400; font-size: clamp(22px, 3.6cqi, 38px); line-height: 1.04; letter-spacing: -.025em; color: #fff; }
& .sec h4 b { font-weight: 400; opacity: 0; transition: opacity .9s cubic-bezier(.23,1,.32,1) calc(var(--i) * .02s); }
& .sec.in h4 b { opacity: 1; }
& .sec p.body { margin: 0; font-size: 13.5px; line-height: 1.55; color: rgb(255 255 255 / .6); max-width: 30em; }
& .sec p.body code { font-size: 12px; }
& .sec .hl { height: 1px; margin-top: 18px; background: rgb(255 255 255 / .25); transform-origin: left; transform: scaleX(0); transition: transform 1.2s cubic-bezier(.77,0,.175,1); }
& .sec.on .hl { transform: none; background: #f97316; }
& .hud { position: absolute; right: 18px; bottom: 16px; width: 248px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgb(255 255 255 / .1); background: rgb(0 0 0 / .55); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); color: rgb(255 255 255 / .55); }
& .hud p { margin: 0 0 8px; display: flex; justify-content: space-between; }
& .row { display: grid; grid-template-columns: 62px 1fr 14px; align-items: center; gap: 8px; padding: 5px 0; }
& .row .nm { color: rgb(255 255 255 / .8); }
& .row.lg { padding: 0 0 2px; font-size: 9px; color: rgb(255 255 255 / .35); }
& .trk { display: flex; gap: 3px; }
& .trk i { position: relative; height: 3px; background: rgb(255 255 255 / .12); overflow: hidden; }
& .trk i:first-child { flex: 3; } & .trk i:last-child { flex: 7; }
& .trk b { position: absolute; inset: 0; background: rgb(255 255 255 / .8); transform-origin: left; transform: scaleX(0); }
& .trk i:last-child b { background: #f97316; }
& .vis { width: 6px; height: 6px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .3); }
& .vis.on { background: #f97316; border-color: #f97316; box-shadow: 0 0 8px rgb(249 115 22 / .8); }
& .tip { position: absolute; left: 36px; top: 24px; margin: 0; color: rgb(255 255 255 / .45); }
@container (max-width: 600px) {
  & .sec { max-width: none; padding: 0 22px 34px; justify-content: flex-end; }
  & .hud { left: 12px; right: 12px; width: auto; top: 12px; bottom: auto; padding: 8px 12px; }
  & .hud p, & .row.lg { display: none; }
  & .row { padding: 3px 0; }
  & .tip { display: none; }
}
`.replace(/&/g, '.d-' + ID);

  var SECTIONS = [
    ['01 / Drift', 'Dust drifts in before the section arrives.', 'Pre-roll window <code>top 200% → top 100%</code> fades the scene in early.'],
    ['02 / Orbit', 'Each section owns a paused timeline.', '<code>scrub: true</code> stays linear; the easing lives inside the tweens.'],
    ['03 / Settle', 'Off-screen scenes cost nothing.', '<code>group.visible</code> gates both update and draw.']
  ];
  var ease = {
    lin: function (x) { return x; }, p1in: function (x) { return x * x; }, p2in: function (x) { return x * x * x; },
    p4in: function (x) { return x * x * x * x * x; }, p2out: function (x) { return 1 - Math.pow(1 - x, 3); }
  };
  // a paused timeline: tweens placed at [at, at+dur] inside 0..1, progress(p) writes the values
  function TL() {
    var tw = [];
    return {
      to: function (o, k, a, b, at, dur, e) { tw.push([o, k, a, b, at, dur, e || ease.lin]); return this; },
      progress: function (p) {
        for (var i = 0; i < tw.length; i++) {
          var w = tw[i], x = Math.min(1, Math.max(0, (p - w[4]) / w[5]));
          w[0][w[1]] = w[2] + (w[3] - w[2]) * w[6](x);
        }
      }
    };
  }
  function cloud(kind) {
    var a = [];
    if (kind === 0) for (var i = 0; i < 1400; i++) { var u = Math.random() * 2 - 1, t = Math.random() * 6.283, r = 1 + (Math.random() - .5) * .06, s = Math.sqrt(1 - u * u); a.push(s * Math.cos(t) * r, u * r, s * Math.sin(t) * r, Math.random()); }
    if (kind === 1) for (var j = 0; j < 1600; j++) { var th = Math.random() * 6.283, ph = Math.random() * 6.283, R = 1.1 + .18 * Math.cos(ph); a.push(R * Math.cos(th), .18 * Math.sin(ph) * (j % 3 ? 1 : 2.4), R * Math.sin(th), Math.random()); }
    if (kind === 2) for (var x = 0; x < 50; x++) for (var z = 0; z < 30; z++) a.push((x / 49 - .5) * 3.2, 0, (z / 29 - .5) * 2, Math.random());
    if (kind === 3) for (var d = 0; d < 220; d++) a.push((Math.random() - .5) * 6, 0, (Math.random() - .5) * 3, Math.random());
    return new Float32Array(a);
  }
  var VS = `#version 300 es
in vec4 aP; uniform mat3 uR; uniform vec2 uC; uniform float uS, uY, uAsp, uSz, uT, uWave, uDust, uDpr; out float vA;
void main() {
  vec3 p = aP.xyz;
  if (uDust > .5) { p.y = 2.4 - mod(uT * (.15 + aP.w * .3) + aP.w * 8., 4.8); p.x += sin(uT * .4 + aP.w * 20.) * .12; }
  p.y += uWave * .32 * sin(p.x * 2.6 + uT * 1.1) * cos(p.z * 2.2 + uT * .7);
  p = uR * (p * uS); p.y += uY;
  float z = p.z + 4.2;
  gl_Position = vec4(p.x / z * 2.4 / uAsp + uC.x, p.y / z * 2.4 + uC.y, 0., 1.);
  gl_PointSize = uSz * uDpr * (4.2 / z) * (uDust > .5 ? 1. + aP.w * 1.5 : 1.);
  vA = clamp(1.7 - z / 4.2, .25, 1.);
}`;
  var FS = `#version 300 es
precision mediump float; uniform vec3 uCol; uniform float uA; in float vA; out vec4 o;
void main() { float d = length(gl_PointCoord - .5); if (d > .5) discard; o = vec4(uCol, uA * vA * smoothstep(.5, .05, d)); }`;

  Lib.register(ID, {
    hint: 'Scroll the page: three sections scrub three scenes on one canvas',
    notes: [
      'Each scene owns paused timelines (<code>defaults: {duration: 1, ease: \'linear\'}</code>); the scrub sets <code>tl.progress(p)</code>',
      'Pre-roll trigger <code>start: \'top 200%\', end: \'top 100%\'</code>, so the scene is ready before its section arrives',
      'End windows past 100% (<code>bottom 200%</code>) let one scene finish while the next pre-rolls: crossfades for free',
      '<code>onEnter / onLeaveBack → group.visible</code>; inactive scenes skip update and draw',
      'Mouse parallax on the wrapper: ±0.05 rad Y, ±0.025 rad X, 3 s expo.out'
    ],
    simplified: 'Hand-rolled timelines and trigger maths instead of GSAP/ScrollTrigger/Lenis; the stage fakes the page scroll from your real scroll position.',
    css: css,
    mount: function (stage, ctx) {
      var clamp = ctx.clamp, reduced = ctx.reduced;
      stage.innerHTML = '<canvas class="cv" aria-hidden="true"></canvas><div class="pg"><div class="inner">' +
        SECTIONS.map(function (s) {
          return '<section class="sec"><p class="label">' + s[0] + '</p><h4 aria-label="' + s[1] + '">' +
            s[1].split('').map(function (c, i) { return '<b aria-hidden="true" style="--i:' + i + '">' + c + '</b>'; }).join('') +
            '</h4><p class="body">' + s[2] + '</p><div class="hl"></div></section>';
        }).join('') + '</div></div><p class="tip label">Scroll the page ↓</p>' +
        '<div class="hud label" aria-hidden="true"><p><span>Timelines</span><span class="mode"></span></p><div class="row lg"><span></span><span>pre · main</span><span>on</span></div>' +
        SECTIONS.map(function (s) { return '<div class="row"><span class="nm">' + s[0].slice(5) + '</span><span class="trk"><i><b></b></i><i><b></b></i></span><span class="vis"></span></div>'; }).join('') + '</div>';
      var cv = stage.querySelector('.cv'), inner = stage.querySelector('.inner'), tip = stage.querySelector('.tip');
      var secs = stage.querySelectorAll('.sec'), rows = stage.querySelectorAll('.row:not(.lg)');
      // scene state + timelines (easing inside the tweens, scrub stays linear)
      var S = [0, 1, 2].map(function (k) { return { a: 0, aIn: 0, aOut: 1, s: 1, rx: 0, ry: 0, y: 0, wave: 0, kind: k, visible: false, pre: 0, main: 0, played: false }; });
      S.forEach(function (o, k) {
        o.tlPre = TL().to(o, 'aIn', 0, 1, 0, 1, ease.p2out).to(o, 's', k === 1 ? 1.5 : .6, 1, 0, 1, ease.p2out);
        o.tlMain = TL().to(o, 'ry', 0, k === 2 ? .6 : 2.4, 0, 1, ease.p1in).to(o, 'y', 0, k === 2 ? 0 : -.5, .4, .6, ease.p2in)
          .to(o, 'rx', k === 1 ? .25 : .1, k === 1 ? 1.25 : .4, 0, 1, ease.p2in).to(o, 'wave', k === 2 ? 1 : 0, 0, 0, 1, ease.p4in)
          .to(o, 'aOut', 1, k === 2 ? 1 : 0, .45, .35);
      });
      var gl = null, prog, U = {}, vaos = [], counts = [], clouds = [0, 1, 2, 3].map(cloud), g2 = null;
      try { gl = cv.getContext('webgl2', { premultipliedAlpha: false, antialias: true }); } catch (e) { gl = null; }
      if (gl) {
        var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
        prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.bindAttribLocation(prog, 0, 'aP'); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) gl = null;
      }
      if (gl) {
        ['uR', 'uC', 'uS', 'uY', 'uAsp', 'uSz', 'uT', 'uWave', 'uDust', 'uDpr', 'uCol', 'uA'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
        clouds.forEach(function (c, i) {
          var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
          var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, c, gl.STATIC_DRAW);
          gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
          vaos[i] = vao; counts[i] = c.length / 4;
        });
        gl.bindVertexArray(null);
      } else g2 = cv.getContext('2d');
      tip.insertAdjacentHTML('beforeend', ' · ' + (gl ? 'WebGL 2' : 'Canvas 2D fallback'));
      stage.querySelector('.mode').textContent = gl ? 'WebGL 2' : 'Canvas 2D';

      var size = null, H = 0, secH = 0, lead = 0, range = 0, scrollY = 0, P = 0, time = 0, par = { x: 0, y: 0, tx: 0, ty: 0 };
      function measure() {
        size = ctx.fitCanvas(cv, stage, 2);
        H = size.h; secH = H * 1.25; lead = H * .3;
        secs.forEach(function (s) { s.style.height = secH + 'px'; });
        inner.style.paddingTop = lead + 'px'; inner.style.paddingBottom = H * .2 + 'px';
        range = lead + secH * 3 + H * .2 - H;
        if (gl) gl.viewport(0, 0, cv.width, cv.height);
      }
      function rot(rx, ry) {
        var cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
        return [cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy];
      }
      function triggers() {
        scrollY = P * range;
        inner.style.transform = 'translate3d(0,' + (-scrollY).toFixed(1) + 'px,0)';
        S.forEach(function (o, k) {
          var top = lead + k * secH - scrollY;
          var pre = clamp((2 * H - top) / H, 0, 1);                 // start 'top 200%' → end 'top 100%'
          var main = clamp((H - top) / (secH + H * .5), 0, 1);      // start 'top 100%' → end 'bottom 50%': overlaps the next pre-roll
          if (k === 2) main = clamp((H - top) / (secH + H * .2), 0, 1);
          o.visible = pre > 0 && (main < 1 || k === 2);              // onEnter / onLeaveBack / onLeave
          if (reduced) { pre = pre > 0 ? 1 : 0; main = .35; }
          if (o.visible) { o.tlPre.progress(pre); o.tlMain.progress(main); o.a = o.aIn * o.aOut; }
          o.pre = pre; o.main = main;
          if (!o.played && top <= H * .95) { o.played = true; secs[k].classList.add('in'); }
          secs[k].classList.toggle('on', main > 0 && main < 1);
          var r = rows[k].querySelectorAll('b');
          r[0].style.transform = 'scaleX(' + pre.toFixed(3) + ')'; r[1].style.transform = 'scaleX(' + main.toFixed(3) + ')';
          rows[k].querySelector('.vis').classList.toggle('on', o.visible);
        });
        tip.style.opacity = P > .04 ? 0 : 1;
      }
      var COL = [[1, 1, 1], [.976, .451, .086], [1, 1, 1], [1, .85, .7]];
      function draw() {
        var narrow = size.w < 600, asp = size.w / size.h, cx = narrow ? 0 : .38, cy = narrow ? .12 : 0;
        var list = S.filter(function (o) { return o.visible && o.a > .002; }).map(function (o) {
          return { kind: o.kind, R: rot(o.rx + par.y, o.ry + par.x), s: o.s * (narrow ? .7 : 1), y: o.y, a: o.a, wave: o.wave, sz: o.kind === 2 ? 2.2 : 1.8 };
        });
        list.push({ kind: 3, R: rot(par.y, par.x), s: 1, y: 0, a: .5, wave: 0, sz: 2.2, dust: 1 });
        if (gl) {
          gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
          gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.useProgram(prog);
          gl.uniform1f(U.uAsp, asp); gl.uniform1f(U.uT, time); gl.uniform1f(U.uDpr, size.dpr); gl.uniform2f(U.uC, cx, cy);
          list.forEach(function (o) {
            gl.uniformMatrix3fv(U.uR, false, o.R); gl.uniform1f(U.uS, o.s); gl.uniform1f(U.uY, o.y); gl.uniform1f(U.uSz, o.sz);
            gl.uniform1f(U.uWave, o.wave); gl.uniform1f(U.uDust, o.dust ? 1 : 0); gl.uniform3fv(U.uCol, COL[o.kind]); gl.uniform1f(U.uA, o.a * (o.dust ? .6 : .85));
            gl.bindVertexArray(vaos[o.kind]); gl.drawArrays(gl.POINTS, 0, counts[o.kind]);
          });
          gl.bindVertexArray(null);
          return;
        }
        var W = size.w, Hh = size.h; g2.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
        g2.globalCompositeOperation = 'source-over'; g2.fillStyle = '#000'; g2.fillRect(0, 0, W, Hh); g2.globalCompositeOperation = 'lighter';
        list.forEach(function (o) {
          var c = clouds[o.kind], R = o.R, col = COL[o.kind].map(function (v) { return Math.round(v * 255); }).join(',');
          for (var i = 0; i < c.length; i += 4) {
            var x = c[i], y = c[i + 1], z = c[i + 2], w = c[i + 3];
            if (o.dust) { y = 2.4 - ((time * (.15 + w * .3) + w * 8) % 4.8); x += Math.sin(time * .4 + w * 20) * .12; }
            y += o.wave * .32 * Math.sin(x * 2.6 + time * 1.1) * Math.cos(z * 2.2 + time * .7);
            x *= o.s; y *= o.s; z *= o.s;
            var X = R[0] * x + R[3] * y + R[6] * z, Y = R[1] * x + R[4] * y + R[7] * z + o.y, Z = R[2] * x + R[5] * y + R[8] * z + 4.2;
            var sx = (X / Z * 2.4 / asp + cx + 1) * W / 2, sy = (1 - (Y / Z * 2.4 + cy)) * Hh / 2, sz = o.sz * 4.2 / Z;
            g2.fillStyle = 'rgba(' + col + ',' + (o.a * (o.dust ? .5 : .7) * clamp(1.7 - Z / 4.2, .25, 1)).toFixed(3) + ')';
            g2.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
          }
        });
      }
      var lp = ctx.loop(function (dt) {
        if (!reduced) time += dt;
        if (!size) measure();
        par.x = ctx.damp(par.x, par.tx, 1.6, dt); par.y = ctx.damp(par.y, par.ty, 1.6, dt);
        triggers(); draw();
      });
      function move(e) {
        if (!ctx.fine || reduced) return;
        var r = stage.getBoundingClientRect();
        par.tx = ((e.clientX - r.left) / r.width * 2 - 1) * .05; par.ty = ((e.clientY - r.top) / r.height * 2 - 1) * .025;
      }
      stage.addEventListener('pointermove', move);
      var ro = new ResizeObserver(function () { size = null; });
      return {
        start: function () { ro.observe(stage); lp.start(); },
        stop: function () { lp.stop(); ro.disconnect(); },
        scroll: function () {
          var r = stage.getBoundingClientRect(), vh = innerHeight;
          P = clamp(((vh - r.top) / (vh + r.height) - .15) / .7, 0, 1);
        }
      };
    }
  });
})();
