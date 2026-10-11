/* cursor-mask-reveal: dim plan + lit detail composited through a noise-edged lens (WebGL 2, CSS-mask fallback), click-expand, dot-matrix loader. */
(function () {
  var ID = 'cursor-mask-reveal';
  var ACC = '#f97316';
  var VS = '#version 300 es\nin vec2 p; out vec2 vUv; void main(){ vUv = p*.5+.5; gl_Position = vec4(p,0.,1.); }';
  var FS = [
    '#version 300 es', 'precision highp float;',
    'uniform sampler2D uDim, uLit; uniform vec2 uRes, uMouse, uTex; uniform float uTime, uSize, uFeather, uClickSize, uClickFeather, uClick, uNoise;',
    'in vec2 vUv; out vec4 o;',
    'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }',
    'float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }',
    'float fbm(vec2 p){ return .55*vn(p) + .3*vn(p*2.1+3.1) + .15*vn(p*4.3+7.7); }',
    'float softLight(float b, float s, float k){ float r = s < .5 ? 2.*b*s + b*b*(1.-2.*s) : sqrt(b)*(2.*s-1.) + 2.*b*(1.-s); return mix(b, r, k); }',
    'vec2 cover(vec2 uv){ float ra = uRes.x/uRes.y, ta = uTex.x/uTex.y; vec2 s = ra > ta ? vec2(1., ta/ra) : vec2(ra/ta, 1.); return (uv-.5)*s+.5; }',
    'void main(){',
    '  vec2 sq = vUv - .5; sq.y *= uRes.y/uRes.x;',
    '  float n = fbm(sq*6. + vec2(uTime*.12, -uTime*.09));',          // stands in for tMaskNoise
    '  float d = distance(sq*2., uMouse);',
    '  d = softLight(d, n, uNoise);',
    '  float size = mix(uSize, uClickSize, uClick), feat = mix(uFeather, uClickFeather, uClick);',
    '  float a = smoothstep(size + feat, size - feat, d);',
    '  float disp = .5 + .5*sin(vn(sq*2.*4.) * 6.2831 + uTime*.5);',     // shift speed .5, repeat 2
    '  float m = clamp(a * (.82 + .36*disp), 0., 1.);',
    '  vec2 uv = cover(vec2(vUv.x, 1.-vUv.y));',
    '  vec3 c = mix(texture(uDim, uv).rgb, texture(uLit, uv).rgb, m);',
    '  float v = smoothstep(.75, .75-.25, length(vUv-.5)*1.25); c *= mix(1.-.842*.35, 1., v);',   // vignette
    '  c += (h(vUv*uRes + uTime) - .5) * .035;',                         // film grain
    '  o = vec4(c, 1.);',
    '}'].join('\n');
  // 5×5 pixel glyphs for the dot-matrix loader
  var GLYPH = { L: '10000100001000010000111110', E: '1111110000111101000011111', N: '1000111001101011001110001', S: '0111110000011100000111110' };

  function city(seed, W, H) {
    var R = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var dim = document.createElement('canvas'), lit = document.createElement('canvas');
    dim.width = lit.width = W; dim.height = lit.height = H;
    var a = dim.getContext('2d'), b = lit.getContext('2d'), k = W / 1400;
    var river = function (x) { return H * 0.6 + Math.sin(x / W * 5 + seed % 7) * H * 0.07; };
    var cols = [], rows = [], x = -20 * k, y = -20 * k;
    while (x < W) { cols.push(x); x += (110 + R() * 90) * k; } cols.push(W + 20);
    while (y < H) { rows.push(y); y += (90 + R() * 70) * k; } rows.push(H + 20);
    var road = 14 * k, pins = [];
    var steps = [function () {
      a.fillStyle = '#050505'; a.fillRect(0, 0, W, H); b.fillStyle = '#0b0b0c'; b.fillRect(0, 0, W, H);
      b.strokeStyle = 'rgba(255,255,255,.035)'; b.lineWidth = 1;
      for (var gx = 0; gx < W; gx += 24 * k) { b.beginPath(); b.moveTo(gx, 0); b.lineTo(gx, H); b.stroke(); }
      for (var gy = 0; gy < H; gy += 24 * k) { b.beginPath(); b.moveTo(0, gy); b.lineTo(W, gy); b.stroke(); }
      [a, b].forEach(function (g, i) {
        g.beginPath(); for (var t = 0; t <= W; t += 8) g.lineTo(t, river(t) - 34 * k);
        for (t = W; t >= 0; t -= 8) g.lineTo(t, river(t) + 34 * k); g.closePath();
        g.fillStyle = i ? 'rgba(120,140,170,.10)' : 'rgba(255,255,255,.02)'; g.fill();
        g.strokeStyle = i ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.12)'; g.lineWidth = i ? 1.2 : 1; g.stroke();
      });
      for (var w = 0; w < 6; w++) { b.beginPath(); for (var t2 = 0; t2 <= W; t2 += 10) b.lineTo(t2, river(t2) + (w - 2.5) * 10 * k); b.strokeStyle = 'rgba(255,255,255,.08)'; b.stroke(); }
    }];
    var band = Math.ceil((rows.length - 1) / 4);
    for (var s = 0; s < 4; s++) (function (r0) {
      steps.push(function () {
        for (var r = r0; r < Math.min(r0 + band, rows.length - 1); r++) for (var c = 0; c < cols.length - 1; c++) {
          var x0 = cols[c] + road / 2, x1 = cols[c + 1] - road / 2, y0 = rows[r] + road / 2, y1 = rows[r + 1] - road / 2;
          var cx = (x0 + x1) / 2, ry = river(cx);
          if (y1 > ry - 40 * k && y0 < ry + 40 * k) continue;
          a.strokeStyle = 'rgba(255,255,255,.13)'; a.lineWidth = 1; a.strokeRect(x0, y0, x1 - x0, y1 - y0);
          if (R() < 0.1) {                                  // park: contour lines, lit only
            b.strokeStyle = 'rgba(255,255,255,.28)';
            for (var e = 1; e < 6; e++) { b.beginPath(); b.ellipse(cx, (y0 + y1) / 2, (x1 - x0) / 2 * e / 6, (y1 - y0) / 2 * e / 6, 0.3, 0, 7); b.stroke(); }
            b.strokeStyle = 'rgba(255,255,255,.4)'; b.strokeRect(x0, y0, x1 - x0, y1 - y0); continue;
          }
          var n = 2 + (R() * 3 | 0), sx = x0;
          for (var i = 0; i < n; i++) {
            var bw = i === n - 1 ? x1 - sx : (x1 - x0) / n * (0.7 + R() * 0.6), hgt = R();
            var pad = 4 * k, fx = sx + pad, fy = y0 + pad + R() * 10 * k, fw = bw - pad * 2, fh = y1 - y0 - pad * 2 - R() * 14 * k;
            if (fw > 6 && fh > 6) {
              b.fillStyle = 'rgba(255,255,255,' + (0.05 + hgt * 0.16).toFixed(3) + ')'; b.fillRect(fx, fy, fw, fh);
              b.strokeStyle = 'rgba(255,255,255,.62)'; b.lineWidth = 1; b.strokeRect(fx + .5, fy + .5, fw, fh);
              if (hgt > 0.55) { b.beginPath(); b.moveTo(fx, fy); b.lineTo(fx + fw, fy + fh); b.strokeStyle = 'rgba(255,255,255,.18)'; b.stroke(); }
              if (hgt > 0.7 && fw > 30 * k) { b.fillStyle = 'rgba(255,255,255,.75)'; b.font = (10 * k + 2) + 'px ui-monospace, monospace'; b.fillText(Math.round(8 + hgt * 50) + 'F', fx + 5 * k, fy + 14 * k); }
              if (hgt > 0.93) pins.push([fx + fw / 2, fy + fh / 2]);
            }
            sx += bw;
          }
        }
      });
    })(s * band);
    steps.push(function () {
      pins.slice(0, 5).forEach(function (p, i) {
        var s2 = 14 * k;
        b.strokeStyle = ACC; b.lineWidth = 1.5; b.strokeRect(p[0] - s2, p[1] - s2, s2 * 2, s2 * 2);
        b.fillStyle = ACC; b.beginPath(); b.arc(p[0], p[1], 3 * k + 1, 0, 7); b.fill();
        b.fillStyle = 'rgba(0,0,0,.7)'; b.fillRect(p[0] + s2 + 6, p[1] - 9 * k, 96 * k, 18 * k);
        b.fillStyle = '#fff'; b.font = (10 * k + 2) + 'px ui-monospace, monospace'; b.fillText('TOWER 0' + (i + 1), p[0] + s2 + 12 * k, p[1] + 4 * k);
      });
    });
    return { dim: dim, lit: lit, steps: steps };
  }

  Lib.register(ID, {
    hint: 'Move to light the plan; press and hold to widen the lens',
    notes: [
      'Mask: <code>d = softLight(distance(uv·2, mouse), noise, .5)</code>, then <code>smoothstep(size+feather, size−feather, d)</code>',
      'Click-expand tweens <code>uMaskAnimationProgress</code> 0 → 1 between rest and click size/feather (source defaults .5 / .5)',
      'Pattern wobble: <code>sin(tex·2π + t·.5)</code>, repeat 2; vignette .842 / .75 / .25, film noise .19',
      'Keep the lens ≥ 18vmax with a wide feather; on touch, drift on a slow Lissajous or tap to place',
      'Loader: 8 px cells on a 5×5 grid, 52 px advance; pairs light outside-in (.033 s stagger) and snap on at each 16.67 %'
    ],
    simplified: 'Procedural plan textures and fbm noise instead of the noise texture; no monolith scan, particles or scene transitions. Loader progress is the real 6-step texture build, paced to ~140 ms per step so it is visible, and ends with a fade instead of the glyph morph.',
    css: [
      '.d-' + ID + ' canvas.gl, .d-' + ID + ' canvas.l { position: absolute; inset: 0; width: 100%; height: 100%; }',
      '.d-' + ID + ' canvas.l { -webkit-mask-image: radial-gradient(circle at var(--mx,50%) var(--my,50%), #000 calc(var(--r,24%) - var(--f,9%)), transparent calc(var(--r,24%) + var(--f,9%))); mask-image: radial-gradient(circle at var(--mx,50%) var(--my,50%), #000 calc(var(--r,24%) - var(--f,9%)), transparent calc(var(--r,24%) + var(--f,9%))); }',
      '.d-' + ID + ' .hud { position: absolute; left: 22px; right: 22px; display: flex; justify-content: space-between; gap: 12px; color: rgb(255 255 255 / .55); pointer-events: none; }',
      '.d-' + ID + ' .hud.t { top: 20px; } .d-' + ID + ' .hud.b { bottom: 18px; }',
      '.d-' + ID + ' .hud b { color: ' + ACC + '; font-weight: 500; }',
      '.d-' + ID + ' .ld { position: absolute; inset: 0; z-index: 4; background: #070a12; display: grid; place-items: center; align-content: center; gap: 14px; transition: opacity .5s cubic-bezier(0,0,.2,1); }',
      '.d-' + ID + ' .ld p { margin: 0; text-align: center; font-family: "Geist Mono", ui-monospace, monospace; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: #d5e0ff; }',
      '.d-' + ID + ' .ld p.s { color: rgb(213 224 255 / .5); }',
      '.d-' + ID + ' .ld canvas { width: 196px; height: 40px; }'
    ].join('\n'),
    mount: function (stage, ctx) {
      var el = ctx.el, reduced = ctx.reduced;
      stage.setAttribute('data-cursor', 'Press');
      var gl = null, cv = el('canvas', 'gl'), dimC = null, litC = null, prog, U = {}, texD, texL;
      try { gl = cv.getContext('webgl2', { antialias: false, premultipliedAlpha: false }); } catch (e) { gl = null; }
      var hudT = el('div', 'hud t label', '<span>Masterplan · <b>lens</b></span><span class="mode"></span>');
      var hudB = el('div', 'hud b label', '<span class="xy">0.50 · 0.50</span><span>' + (ctx.fine ? 'Hold to expand' : 'Tap or drag') + '</span>');
      var xy = hudB.querySelector('.xy');
      var W = 1, H = 1, tw = 1, th = 1;
      var M = { x: 0, y: 0, tx: 0, ty: 0, click: 0, clickTo: 0, lastInput: -10, t: 0 };
      var SIZE = reduced ? 0.62 : 0.38, FEAT = reduced ? 0.24 : 0.2, CSIZE = 0.85, CFEAT = 0.3;

      function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
      if (gl) {
        try {
          prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
          if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
          gl.useProgram(prog);
          var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
          var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
          ['uDim', 'uLit', 'uRes', 'uMouse', 'uTex', 'uTime', 'uSize', 'uFeather', 'uClickSize', 'uClickFeather', 'uClick', 'uNoise'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
          texD = gl.createTexture(); texL = gl.createTexture();
          [texD, texL].forEach(function (t) { gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); });
          gl.uniform1i(U.uDim, 0); gl.uniform1i(U.uLit, 1);
        } catch (e) { gl = null; }
      }
      hudT.querySelector('.mode').textContent = gl ? 'WebGL 2' : 'CSS mask fallback';
      if (gl) stage.appendChild(cv);
      var fbDim, fbLit;
      if (!gl) { fbDim = el('canvas', 'gl'); fbLit = el('canvas', 'l'); stage.appendChild(fbDim); stage.appendChild(fbLit); }
      stage.appendChild(hudT); stage.appendChild(hudB);

      function upload() {
        if (gl) {
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texD); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, dimC);
          gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texL); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, litC);
        } else {
          [[fbDim, dimC], [fbLit, litC]].forEach(function (p) { p[0].width = dimC.width; p[0].height = dimC.height; p[0].getContext('2d').drawImage(p[1], 0, 0); p[0].style.objectFit = 'cover'; });
        }
      }
      function texSize() { var r = stage.getBoundingClientRect(), s = Math.min(1.5, 2048 / Math.max(r.width, r.height)); tw = Math.round(r.width * s); th = Math.round(r.height * s); }
      function buildAll(seed) { texSize(); var c = city(seed, tw, th); c.steps.forEach(function (f) { f(); }); dimC = c.dim; litC = c.lit; upload(); }

      // dot-matrix loader (replay)
      var ld = null, ldTimer = 0, ldRaf = 0;
      function loader() {
        if (ld) { ld.remove(); clearTimeout(ldTimer); cancelAnimationFrame(ldRaf); }
        texSize();
        var c = city((Math.random() * 1e6 | 0) + 1, tw, th), done = 0;
        if (reduced) { c.steps.forEach(function (f) { f(); }); dimC = c.dim; litC = c.lit; upload(); stage.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 400 }); return; }
        ld = el('div', 'ld', '<p class="pc">0%</p><canvas width="392" height="80"></canvas><p class="s">Loading content</p>');
        stage.appendChild(ld);
        var lc = ld.querySelector('canvas').getContext('2d'), pc = ld.querySelector('.pc'), sub = ld.querySelector('.s');
        var cells = [];
        'LENS'.split('').forEach(function (ch, gi) { for (var i = 0; i < 25; i++) if (GLYPH[ch][i] === '1') cells.push({ x: gi * 52 + (i % 5) * 8, y: (i / 5 | 0) * 8, on: 0, lit: 0 }); });
        cells.forEach(function (q) { q.d = Math.hypot(q.x + 4 - 98, q.y + 4 - 20); });
        cells.sort(function (p, q) { return q.d - p.d; });                      // outside in
        cells.forEach(function (q, i) { q.pair = i >> 1; q.group = Math.min(5, Math.floor(i / cells.length * 6)); });
        var t0 = performance.now();
        function step() {
          if (done < c.steps.length) { c.steps[done++](); ldTimer = setTimeout(step, 140); }
          else { dimC = c.dim; litC = c.lit; upload(); pc.textContent = '100% Loaded'; sub.textContent = 'Ready to explore'; ldTimer = setTimeout(function () { ld.style.opacity = '0'; ldTimer = setTimeout(function () { if (ld) { ld.remove(); ld = null; cancelAnimationFrame(ldRaf); } }, 520); }, 700); }
        }
        ldTimer = setTimeout(step, 420);
        (function draw(now) {
          var t = (now - t0) / 1000, pct = done / c.steps.length;
          if (done < c.steps.length) pc.textContent = Math.round(pct * 100) + '%';
          lc.setTransform(2, 0, 0, 2, 0, 0); lc.clearRect(0, 0, 196, 40);
          lc.fillStyle = '#d5e0ff';
          if (t < 0.4) {                                                        // flash square: scale 3→1, blink 4×
            var sc = t < 0.2 ? 3 - 2 * (1 - Math.pow(1 - t / 0.2, 2)) : 1, s = 8 * sc;
            lc.globalAlpha = Math.floor(t / 0.05) % 2 ? 0.25 : 1; lc.fillRect(98 - s / 2, 20 - s / 2, s, s);
          } else {
            cells.forEach(function (q) {
              var dim = t - 0.4 > q.pair * 0.033 ? 0.2 : 0;
              var target = pct >= (q.group + 1) / 6 - 1e-6 ? 1 : dim;
              q.on += (target - q.on) * (target === 1 ? 0.18 : 1);
              lc.globalAlpha = q.on; lc.fillRect(q.x, q.y + 1, 7, 7);
            });
          }
          lc.globalAlpha = 1;
          if (ld) ldRaf = requestAnimationFrame(draw);
        })(t0);
      }

      function setTarget(e) {
        var r = stage.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        M.tx = (px - 0.5) * 2; M.ty = (0.5 - py) * (r.height / r.width) * 2; M.lastInput = M.t;
        if (reduced) { M.x = M.tx; M.y = M.ty; }
      }
      function down(e) { setTarget(e); M.clickTo = 1; }
      function up() { M.clickTo = 0; }
      stage.addEventListener('pointermove', setTarget);
      stage.addEventListener('pointerdown', down);
      stage.addEventListener('pointerup', up);
      stage.addEventListener('pointercancel', up);
      stage.addEventListener('pointerleave', up);

      var lp = ctx.loop(function (dt) {
        M.t += dt;
        var r = stage.getBoundingClientRect(), asp = r.height / r.width;
        if (!reduced && M.t - M.lastInput > 2.5) {                             // idle drift on a slow Lissajous
          M.tx = 0.55 * Math.sin(M.t * 0.31); M.ty = 0.6 * asp * Math.sin(M.t * 0.47 + 1);
        }
        if (!reduced) { M.x = ctx.damp(M.x, M.tx, 7.7, dt); M.y = ctx.damp(M.y, M.ty, 7.7, dt); }
        // click progress: .6 s ease-out toward target (joe.out feel)
        M.click = reduced ? M.clickTo : ctx.damp(M.click, M.clickTo, 6, dt);
        xy.textContent = (M.x * 0.5 + 0.5).toFixed(2) + ' · ' + (0.5 - M.y / asp * 0.5).toFixed(2) + ' · R ' + (SIZE + (CSIZE - SIZE) * M.click).toFixed(2);
        if (gl) {
          var f = ctx.fitCanvas(cv, stage, 1.5);
          gl.viewport(0, 0, cv.width, cv.height);
          gl.uniform2f(U.uRes, f.w, f.h); gl.uniform2f(U.uMouse, M.x, M.y); gl.uniform2f(U.uTex, tw, th);
          gl.uniform1f(U.uTime, reduced ? 0 : M.t); gl.uniform1f(U.uSize, SIZE); gl.uniform1f(U.uFeather, FEAT);
          gl.uniform1f(U.uClickSize, CSIZE); gl.uniform1f(U.uClickFeather, CFEAT); gl.uniform1f(U.uClick, M.click);
          gl.uniform1f(U.uNoise, reduced ? 0.2 : 0.5);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        } else {
          var w = r.width;
          fbLit.style.setProperty('--mx', ((M.x * 0.5 + 0.5) * 100).toFixed(2) + '%');
          fbLit.style.setProperty('--my', ((0.5 - M.y / asp * 0.5) * 100).toFixed(2) + '%');
          fbLit.style.setProperty('--r', ((SIZE + (CSIZE - SIZE) * M.click) * w / 2).toFixed(1) + 'px');
          fbLit.style.setProperty('--f', ((FEAT + (CFEAT - FEAT) * M.click) * w / 2).toFixed(1) + 'px');
        }
      });
      buildAll(7);

      return {
        start: function () { lp.start(); },
        stop: function () {
          lp.stop(); M.clickTo = 0;
          if (ld) { clearTimeout(ldTimer); cancelAnimationFrame(ldRaf); ld.remove(); ld = null; if (litC) upload(); }
        },
        replay: function () { loader(); }
      };
    }
  });
})();
