/* scissor-view-webgl-slots — one canvas, one WebGL2 context, gl.scissor + gl.viewport per DOM card. */
Lib.register('scissor-view-webgl-slots', {
  hint: 'Scroll: each card’s mesh turns with the section. Switch to the no-WebGL spotlight',
  notes: [
    'One canvas, many views: per slot every frame <code>y = canvasH − rect.bottom</code>, then <code>setScissor</code> and <code>setViewport</code> to that rect',
    'Clear once per frame with the scissor test off, then turn it on and draw every visible slot',
    'Per-slot camera <code>PerspectiveCamera(45, aspect, .1, 5)</code> at <code>z = 2</code>; rotation from progress, e.g. <code>x 0→1.5, y 0→2</code>',
    'No-WebGL beam (iventions): <code>clip-path: polygon(49% 0, 51% 0, var(--poLeft) 100%, var(--poRight) 100%)</code> under a goo filter (<code>blur 20</code>, alpha <code>30 −15</code>)',
    'Reveal polygons keep the same 5 vertices so they tween; CTA appears at progress ≥ .5'
  ],
  simplified: 'Hand-built meshes and a tiny Lambert + rim shader instead of Three.js, GLTF and a PMREM environment; progress comes from the page scroll, not ScrollTrigger. Without WebGL 2 the same meshes are depth-sorted onto a 2D canvas.',
  css: `
.d-scissor-view-webgl-slots { background: #050505; }
.d-scissor-view-webgl-slots .sv-top { position: absolute; z-index: 6; left: 20px; right: 20px; top: 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.d-scissor-view-webgl-slots .sv-top p { margin: 0; color: rgb(255 255 255 / .55); }
.d-scissor-view-webgl-slots.narrow .sv-top .long { display: none; }
.d-scissor-view-webgl-slots .sv-seg { display: inline-flex; flex: none; border: 1px solid rgb(255 255 255 / .18); border-radius: 999px; padding: 3px; background: rgb(0 0 0 / .55); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.d-scissor-view-webgl-slots .sv-seg button { padding: 7px 12px; border-radius: 999px; color: rgb(255 255 255 / .65); transition: background .3s, color .3s; }
.d-scissor-view-webgl-slots .sv-seg button[aria-pressed="true"] { background: #fff; color: #000; }
.d-scissor-view-webgl-slots .sv-cards { position: absolute; inset: 64px 20px 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.d-scissor-view-webgl-slots.narrow .sv-cards { grid-template-columns: 1fr; grid-template-rows: repeat(3, 1fr); gap: 10px; inset: 60px 16px 16px; }
.d-scissor-view-webgl-slots .sv-card { position: relative; border-radius: 10px; border: 1px solid rgb(255 255 255 / .1); background: radial-gradient(90% 70% at 50% 45%, rgb(255 255 255 / .06), transparent 70%), #0b0b0b; will-change: transform; }
.d-scissor-view-webgl-slots .sv-card .label { position: absolute; left: 14px; top: 12px; margin: 0; color: rgb(255 255 255 / .8); z-index: 4; }
.d-scissor-view-webgl-slots .sv-card .label i { font-style: normal; color: #f97316; margin-right: 8px; }
.d-scissor-view-webgl-slots .sv-card .ro { position: absolute; left: 14px; right: 14px; bottom: 10px; margin: 0; font: 10px/1.3 "Geist Mono", ui-monospace, monospace; color: rgb(255 255 255 / .56); z-index: 4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.d-scissor-view-webgl-slots .sv-card::before, .d-scissor-view-webgl-slots .sv-card::after { content: ""; position: absolute; width: 10px; height: 10px; border: 0 solid rgb(249 115 22 / .7); z-index: 4; }
.d-scissor-view-webgl-slots .sv-card::before { right: 8px; top: 8px; border-top-width: 1px; border-right-width: 1px; }
.d-scissor-view-webgl-slots .sv-card::after { right: 8px; bottom: 8px; border-bottom-width: 1px; border-right-width: 1px; }
.d-scissor-view-webgl-slots canvas.sv-gl { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.d-scissor-view-webgl-slots .sv-beam { position: absolute; inset: 0; z-index: 2; display: none; overflow: hidden; }
.d-scissor-view-webgl-slots.beam .sv-beam { display: block; }
.d-scissor-view-webgl-slots.beam .sv-cards, .d-scissor-view-webgl-slots.beam canvas.sv-gl { display: none; }
.d-scissor-view-webgl-slots .sv-reveal { position: absolute; inset: 0; background: radial-gradient(70% 90% at 30% 70%, rgb(249 115 22 / .55), transparent 60%), linear-gradient(120deg, #1a1a1a, #050505 70%); display: flex; flex-direction: column; justify-content: flex-end; padding: 0 28px 32px; }
.d-scissor-view-webgl-slots .sv-reveal h4 { font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: clamp(26px, 4.4vw, 54px); line-height: .98; letter-spacing: -.02em; margin: 0 0 16px; color: #fff; max-width: 12ch; }
.d-scissor-view-webgl-slots .sv-reveal .label { color: rgb(255 255 255 / .7); margin: 0 0 12px; opacity: 0; transition: opacity .6s; }
.d-scissor-view-webgl-slots .sv-reveal .label.on { opacity: 1; }
.d-scissor-view-webgl-slots .sv-cta { position: relative; align-self: flex-start; padding: 12px 18px; color: #000; opacity: 0; transform: translateY(50%); transition: opacity 1.2s cubic-bezier(.215, .61, .355, 1), transform 1.2s cubic-bezier(.215, .61, .355, 1); isolation: isolate; }
.d-scissor-view-webgl-slots .sv-cta.on { opacity: 1; transform: none; }
.d-scissor-view-webgl-slots .sv-cta::before { content: ""; position: absolute; inset: 0; z-index: -1; background: #fff; clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%); transition: clip-path .5s cubic-bezier(.23, 1, .32, 1), background .3s; }
.d-scissor-view-webgl-slots .sv-cta:hover::before, .d-scissor-view-webgl-slots .sv-cta:focus-visible::before { background: #f97316; clip-path: polygon(6% 0%, 94% 0%, 100% 100%, 0% 100%); }
.d-scissor-view-webgl-slots .sv-goo { position: absolute; left: 50%; top: 0; width: max(110%, 110vh); aspect-ratio: 1; transform: translate(-50%, -8%); filter: url(#sv-goo); will-change: transform; pointer-events: none; mix-blend-mode: screen; }
.d-scissor-view-webgl-slots .sv-cone { position: absolute; inset: 0; --poLeft: 75%; --poRight: 25%; clip-path: polygon(49% 0, 51% 0, var(--poLeft) 100%, var(--poRight) 100%); background: linear-gradient(to bottom, #fff, #ffedd5 14%, #7c3a10 42%, #140902 66%, #000 80%); opacity: .55; }
.d-scissor-view-webgl-slots .sv-q { position: absolute; right: 20px; bottom: 18px; margin: 0; color: rgb(255 255 255 / .55); z-index: 3; }
`,
  mount(stage, ctx) {
    var el = ctx.el, R = ctx.reduced;
    var top = el('div', 'sv-top');
    top.innerHTML = '<p class="label sv-mode">One canvas · 3 scissor views</p>';
    var seg = el('div', 'sv-seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Rendering mode');
    var bGL = el('button', 'label', 'Slots'), bBeam = el('button', 'label', 'Spotlight');
    [bGL, bBeam].forEach(function (b) { b.type = 'button'; seg.appendChild(b); });
    top.appendChild(seg);
    var cards = el('div', 'sv-cards');
    var NAMES = ['Cube', 'Torus', 'Icosahedron'], cardEls = [];
    NAMES.forEach(function (n, i) {
      var c = el('div', 'sv-card', '<p class="label"><i>Nº 0' + (i + 1) + '</i>' + n + '</p><p class="ro"></p>');
      cards.appendChild(c); cardEls.push(c);
    });
    var canvas = el('canvas', 'sv-gl'); canvas.setAttribute('aria-hidden', 'true');
    var beam = el('div', 'sv-beam');
    beam.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="sv-goo"><feGaussianBlur in="SourceGraphic" stdDeviation="20"/>' +
      '<feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -15"/></filter></svg>' +
      '<div class="sv-reveal"><p class="label">iventions · clip-path, not WebGL</p><h4>Light without a renderer.</h4><button type="button" class="sv-cta label">See the polygons</button></div>' +
      '<div class="sv-goo" aria-hidden="true"><div class="sv-cone"></div></div><p class="label sv-q"></p>';
    stage.append(top, cards, canvas, beam);
    var reveal = beam.querySelector('.sv-reveal'), revLabel = reveal.querySelector('.label'), cta = reveal.querySelector('.sv-cta');
    var cone = beam.querySelector('.sv-cone'), qLabel = beam.querySelector('.sv-q'), modeLabel = top.querySelector('.sv-mode');

    /* ---------- meshes (non-indexed triangles: pos + normal) ---------- */
    function flat(tris) { // tris: [[a,b,c],...] → flat normals
      var p = [], n = [];
      tris.forEach(function (t) {
        var u = sub(t[1], t[0]), v = sub(t[2], t[0]), nn = norm(cross(u, v));
        t.forEach(function (q) { p.push(q[0], q[1], q[2]); n.push(nn[0], nn[1], nn[2]); });
      });
      return { p: new Float32Array(p), n: new Float32Array(n) };
    }
    function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function norm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
    function cube(s) {
      var v = [], t = [];
      for (var i = 0; i < 8; i++) v.push([(i & 1 ? s : -s), (i & 2 ? s : -s), (i & 4 ? s : -s)]);
      [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]].forEach(function (f) {
        t.push([v[f[0]], v[f[1]], v[f[2]]], [v[f[0]], v[f[2]], v[f[3]]]);
      });
      return flat(t);
    }
    function ico(r) {
      var a = (1 + Math.sqrt(5)) / 2, V = [[-1, a, 0], [1, a, 0], [-1, -a, 0], [1, -a, 0], [0, -1, a], [0, 1, a], [0, -1, -a], [0, 1, -a], [a, 0, -1], [a, 0, 1], [-a, 0, -1], [-a, 0, 1]]
        .map(function (q) { var k = norm(q); return [k[0] * r, k[1] * r, k[2] * r]; });
      var F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
      return flat(F.map(function (f) { return [V[f[0]], V[f[1]], V[f[2]]]; }));
    }
    function torus(R1, r, M, N) {
      var p = [], n = [];
      function pt(i, j) {
        var u = i / M * Math.PI * 2, v = j / N * Math.PI * 2, cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
        return [[(R1 + r * cv) * cu, r * sv, (R1 + r * cv) * su], [cv * cu, sv, cv * su]];
      }
      for (var i = 0; i < M; i++) for (var j = 0; j < N; j++) {
        var a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
        [a, c, b, a, d, c].forEach(function (q) { p.push.apply(p, q[0]); n.push.apply(n, q[1]); });
      }
      return { p: new Float32Array(p), n: new Float32Array(n) };
    }
    var MESHES = [cube(.34), torus(.44, .17, 48, 18), ico(.58)];

    /* ---------- math ---------- */
    function persp(fov, asp, n, f) { // fov 45° vertical; on tall slots widen it so the horizontal view stays 45°
      var t = 1 / (Math.tan(fov / 2) / Math.min(1, asp)), nf = 1 / (n - f);
      return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0];
    }
    function rot(x, y, z) { // Three.js 'XYZ' Euler order → column-major 3x3
      var a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
      var ae = a * e, af = a * f, be = b * e, bf = b * f;
      return [c * e, af + be * d, bf - ae * d, -c * f, ae - bf * d, be + af * d, d, -b * c, a * c];
    }
    function rotations(i, q, t) {
      var m = ctx.lerp, wob = R ? 0 : Math.sin(t * .7 + i) * .08;
      if (i === 0) return [m(0, 1.5, q) + tilt.y * .4, m(0, 2, q) + wob + tilt.x * .5, 0];
      if (i === 1) return [.9 + tilt.y * .4, m(-2, -.8, q) + wob + tilt.x * .5, .2];
      return [m(-.25, 1, q) + tilt.y * .4, m(-.5, 0, q) + wob + tilt.x * .5, m(.5, 1, q)];
    }

    /* ---------- WebGL2 ---------- */
    var gl = null, prog, U = {}, vaos = [];
    try { gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: true }); } catch (e) { gl = null; }
    if (gl) {
      var vs = '#version 300 es\nin vec3 aP; in vec3 aN; uniform mat4 uProj; uniform mat3 uRot; out vec3 vN; out float vZ; void main(){ vec3 p = uRot * aP; vN = uRot * aN; vec4 v = vec4(p.x, p.y, p.z - 2.0, 1.0); vZ = -v.z; gl_Position = uProj * v; }';
      var fs = '#version 300 es\nprecision highp float; in vec3 vN; in float vZ; uniform vec3 uTint; out vec4 o; void main(){ vec3 n = normalize(vN);' +
        ' float key = max(dot(n, normalize(vec3(1.0, .5, .6))), 0.0); float hemi = mix(.06, .32, n.y * .5 + .5);' +
        ' float rim = pow(1.0 - max(n.z, 0.0), 3.0); vec3 c = uTint * (hemi + key * .85) + vec3(.976, .451, .086) * rim * .9;' +
        ' float fog = smoothstep(1.4, 3.0, vZ); c = mix(c, vec3(.05), fog); o = vec4(c, 1.0); }';
      var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
      ['uProj', 'uRot', 'uTint'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
      MESHES.forEach(function (m) {
        var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
        [['aP', m.p], ['aN', m.n]].forEach(function (a) {
          var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a[1], gl.STATIC_DRAW);
          var loc = gl.getAttribLocation(prog, a[0]); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
        });
        vaos.push({ vao: vao, count: m.p.length / 3 });
      });
      gl.bindVertexArray(null);
    }
    var c2 = gl ? null : canvas.getContext('2d');
    modeLabel.innerHTML = gl ? '<span class="long">One canvas · </span>WebGL 2<span class="long"> · 3 scissor views</span>' : '<span class="long">One canvas · </span>2D fallback<span class="long"> · 3 clip views</span>';
    var TINTS = [[.92, .92, .92], [.85, .85, .85], [.95, .95, .95]];

    function draw2d(i, r, rr, dpr) { // fallback: same meshes, painter's algorithm inside a clip rect
      var m = MESHES[i], M = rot(rr[0], rr[1], rr[2]), P = persp(Math.PI / 4, r.w / r.h, .1, 5), tris = [];
      var tf = function (k) {
        var x = m.p[k], y = m.p[k + 1], z = m.p[k + 2];
        var px = M[0] * x + M[3] * y + M[6] * z, py = M[1] * x + M[4] * y + M[7] * z, pz = M[2] * x + M[5] * y + M[8] * z - 2;
        var w = -pz; return [r.x + (P[0] * px / w * .5 + .5) * r.w, r.y + (.5 - P[5] * py / w * .5) * r.h, pz];
      };
      for (var k = 0; k < m.p.length; k += 9) {
        var nx = m.n[k], ny = m.n[k + 1], nz = m.n[k + 2];
        var n = [M[0] * nx + M[3] * ny + M[6] * nz, M[1] * nx + M[4] * ny + M[7] * nz, M[2] * nx + M[5] * ny + M[8] * nz];
        var a = tf(k), b = tf(k + 3), c = tf(k + 6);
        if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 0) continue; // back-face (screen y down)
        tris.push([a, b, c, n, (a[2] + b[2] + c[2]) / 3]);
      }
      tris.sort(function (p, q) { return p[4] - q[4]; });
      c2.save(); c2.beginPath(); c2.rect(r.x, r.y, r.w, r.h); c2.clip();
      tris.forEach(function (t) {
        var n = norm(t[3]), key = Math.max(0, (n[0] + n[1] * .5 + n[2] * .6) / 1.27), hemi = .06 + .26 * (n[1] * .5 + .5), rim = Math.pow(1 - Math.max(n[2], 0), 3) * .9;
        var L = (hemi + key * .85) * .9;
        c2.fillStyle = 'rgb(' + Math.min(255, (L + .976 * rim) * 255 | 0) + ',' + Math.min(255, (L + .451 * rim) * 255 | 0) + ',' + Math.min(255, (L + .086 * rim) * 255 | 0) + ')';
        c2.strokeStyle = c2.fillStyle; c2.lineWidth = .6;
        c2.beginPath(); c2.moveTo(t[0][0], t[0][1]); c2.lineTo(t[1][0], t[1][1]); c2.lineTo(t[2][0], t[2][1]); c2.closePath(); c2.fill(); c2.stroke();
      });
      c2.restore();
    }

    /* ---------- spotlight polygons (verified strings) ---------- */
    var K = [[[0, 50], [110, 50], [0, 50], [0, 100], [0, 0]], [[0, 0], [110, 50], [0, 100], [0, 100], [0, 0]],
      [[40, 0], [110, 50], [40, 100], [0, 100], [0, 0]], [[100, 0], [110, 50], [100, 100], [0, 100], [0, 0]]];
    function poly(q) {
      var s = Math.min(2.999, q * 3), i = Math.floor(s), f = s - i;
      return 'polygon(' + K[i].map(function (pt, j) { return ctx.lerp(pt[0], K[i + 1][j][0], f).toFixed(2) + '% ' + ctx.lerp(pt[1], K[i + 1][j][1], f).toFixed(2) + '%'; }).join(', ') + ')';
    }

    /* ---------- state + loop ---------- */
    var mode = 'slots', q = .5, qs = .5, tilt = { x: 0, y: 0 }, mouse = { x: 0, y: 0 }, ro = null, dirty = true, scrollP = .5;
    function setMode(m) {
      mode = m; stage.classList.toggle('beam', m === 'beam');
      bGL.setAttribute('aria-pressed', String(m === 'slots')); bBeam.setAttribute('aria-pressed', String(m === 'beam'));
      dirty = true; frame(0, performance.now() / 1000);
    }
    bGL.addEventListener('click', function () { setMode('slots'); });
    bBeam.addEventListener('click', function () { setMode('beam'); });
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * 2 - 1; mouse.y = -(e.clientY - r.top) / r.height * 2 + 1;
    });
    stage.addEventListener('pointerleave', function () { mouse.x = mouse.y = 0; });

    function frame(dt, t) {
      var sr = stage.getBoundingClientRect();
      stage.classList.toggle('narrow', sr.width < 560);
      qs = R ? q : ctx.damp(qs, q, 6, dt || 1);
      tilt.x = ctx.damp(tilt.x, R ? 0 : mouse.x, 4, dt || 1); tilt.y = ctx.damp(tilt.y, R ? 0 : -mouse.y, 4, dt || 1);
      if (mode === 'beam') {
        var bq = R ? 1 : qs;
        reveal.style.clipPath = poly(bq);
        cone.style.setProperty('--poLeft', (62 + 26 * bq).toFixed(1) + '%'); cone.style.setProperty('--poRight', (38 - 26 * bq).toFixed(1) + '%');
        revLabel.classList.toggle('on', bq >= .075); cta.classList.toggle('on', bq >= .5);
        qLabel.textContent = 'progress ' + bq.toFixed(2);
        return;
      }
      // DOM moves (parallax) — the GL views follow because rects are read live each frame
      cardEls.forEach(function (c, i) { c.style.transform = R ? '' : 'translate3d(0,' + ((scrollP - .5) * (i - 1) * 70).toFixed(1) + 'px,0)'; });
      var fit = ctx.fitCanvas(canvas, stage, 2), dpr = fit.dpr, CH = canvas.height;
      if (gl) {
        gl.disable(gl.SCISSOR_TEST); gl.viewport(0, 0, canvas.width, CH);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.SCISSOR_TEST); gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.useProgram(prog);
      } else { c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, canvas.width, CH); }
      cardEls.forEach(function (c, i) {
        var r = c.getBoundingClientRect();
        var x = Math.round((r.left - sr.left) * dpr), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
        var y = CH - Math.round((r.bottom - sr.top) * dpr); // GL origin is bottom-left
        var rr = rotations(i, R ? .5 : qs, t);
        if (gl) {
          gl.scissor(x, y, w, h); gl.viewport(x, y, w, h);
          gl.uniformMatrix4fv(U.uProj, false, persp(Math.PI / 4, w / h, .1, 5));
          gl.uniformMatrix3fv(U.uRot, false, rot(rr[0], rr[1], rr[2])); gl.uniform3fv(U.uTint, TINTS[i]);
          gl.bindVertexArray(vaos[i].vao); gl.drawArrays(gl.TRIANGLES, 0, vaos[i].count);
        } else draw2d(i, { x: x, y: CH - y - h, w: w, h: h }, rr, dpr);
        var txt = (gl ? 'scissor ' : 'clip ') + x + ',' + y + ' · ' + w + '×' + h + ' · rot ' + rr[0].toFixed(2) + ',' + rr[1].toFixed(2);
        var ro2 = c.lastChild; if (ro2.textContent !== txt) ro2.textContent = txt;
      });
      if (gl) gl.bindVertexArray(null);
    }
    var lp = ctx.loop(frame);
    setMode('slots');
    return {
      start: function () {
        if (!ro) { ro = new ResizeObserver(function () { if (!lp.running) frame(0, 0); }); ro.observe(stage); }
        if (R) frame(0, 0); else lp.start();
      },
      stop: function () { lp.stop(); if (ro) { ro.disconnect(); ro = null; } },
      scroll: function () { // progress of the stage itself through the viewport: centre at bottom = 0, at top = 1
        var r = stage.getBoundingClientRect();
        scrollP = ctx.clamp(1 - (r.top + r.height / 2) / innerHeight, 0, 1); q = scrollP;
      }
    };
  }
});
