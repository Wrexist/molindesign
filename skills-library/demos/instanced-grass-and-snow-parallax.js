/* instanced-grass-and-snow-parallax — WebGL2 instanced grass in 3 LOD rings + POM snow from a painted 2D height map. */
Lib.register('instanced-grass-and-snow-parallax', {
  hint: 'Point to walk (tap on touch, arrows when focused). Cross the snow to leave prints',
  notes: [
    'Grass rings follow the player: near <code>0–11 m</code>, mid <code>10–31</code>, far <code>30–60</code>; tiles <code>.15 / .4 / .8</code> on low and medium, <code>.05 / .1 / .2</code> on high',
    'Vertex shader snaps each root to its tile cell and jitters it with a hash, so blades stay planted while the window moves',
    'Bend <code>× pow(vy, 3)</code> so only tips move; fade by scaling, <code>1 − pow(d / 60, 5)</code>, never by alpha; push <code>.3 × vy</code> within 1 m',
    'Snow: a canvas height map, footprints drawn with <code>multiply</code>, healed with <code>rgba(255,255,255,.35·dt)</code>, uploaded at most every 100 ms',
    'POM only within 20 m, 10–22 samples (fewer looking straight down), 4 binary refinements, offset capped at 5 texels'
  ],
  simplified: 'Raw WebGL 2 instead of patched three.js materials: flat ground (no height or slope mask), procedural value noise instead of a noise texture with a livelier wind gain, a 256² height map over 12 m instead of 2048², lambert shading instead of PBR. Without WebGL 2 a top-down 2D sketch stands in.',
  css: `
.d-instanced-grass-and-snow-parallax { background: #000; }
.d-instanced-grass-and-snow-parallax canvas.gs-gl { position: absolute; inset: 0; outline: none; touch-action: pan-y; }
.d-instanced-grass-and-snow-parallax canvas.gs-gl:focus-visible { outline: 1px solid #f97316; outline-offset: -4px; }
.d-instanced-grass-and-snow-parallax .gs-hud { position: absolute; left: 20px; top: 18px; right: 20px; display: flex; justify-content: space-between; gap: 12px; pointer-events: none; z-index: 2; }
.d-instanced-grass-and-snow-parallax .gs-hud p { margin: 0 0 6px; color: rgb(255 255 255 / .5); white-space: nowrap; }
.d-instanced-grass-and-snow-parallax .gs-hud b { color: rgb(255 255 255 / .9); font-weight: 500; }
.d-instanced-grass-and-snow-parallax .gs-btns { display: flex; gap: 6px; pointer-events: auto; align-self: flex-start; flex: none; }
.d-instanced-grass-and-snow-parallax .gs-btns button { padding: 7px 11px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .2); color: rgb(255 255 255 / .75); background: rgb(0 0 0 / .45); }
.d-instanced-grass-and-snow-parallax .gs-btns button[aria-pressed="true"] { background: #fff; color: #000; border-color: #fff; }
.d-instanced-grass-and-snow-parallax .gs-map { position: absolute; right: 20px; bottom: 18px; z-index: 2; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; pointer-events: none; }
.d-instanced-grass-and-snow-parallax .gs-map canvas { width: 76px; height: 76px; border: 1px solid rgb(255 255 255 / .25); image-rendering: pixelated; }
.d-instanced-grass-and-snow-parallax .gs-map .label { color: rgb(255 255 255 / .5); margin: 0; }
.d-instanced-grass-and-snow-parallax.narrow .long { display: none; }
.d-instanced-grass-and-snow-parallax.narrow .gs-map canvas { width: 56px; height: 56px; }
.d-instanced-grass-and-snow-parallax .gs-legend { position: absolute; left: 20px; bottom: 18px; z-index: 2; margin: 0; color: rgb(255 255 255 / .5); pointer-events: none; }
.d-instanced-grass-and-snow-parallax .gs-legend i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin: 0 6px 0 12px; vertical-align: 0; }
.d-instanced-grass-and-snow-parallax .gs-legend i:first-child { margin-left: 0; }
`,
  mount(stage, ctx) {
    var el = ctx.el, R = ctx.reduced;
    var canvas = el('canvas', 'gs-gl');
    canvas.tabIndex = 0; canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Instanced grass field with a snow patch. Arrow keys or WASD walk the player when focused.');
    var hud = el('div', 'gs-hud');
    hud.innerHTML = '<div><p class="label"><span class="long">Instanced grass · </span><span class="accent">3 LOD rings</span></p><p class="label gs-r1"></p><p class="label gs-r2"></p></div>';
    var btns = el('div', 'gs-btns');
    var bRing = el('button', 'label', 'Rings'), bAuto = el('button', 'label', 'Auto-walk');
    [bRing, bAuto].forEach(function (b) { b.type = 'button'; btns.appendChild(b); });
    hud.appendChild(btns);
    var map = el('div', 'gs-map', '<p class="label">Height map</p>');
    var legend = el('p', 'gs-legend label'); legend.hidden = true;
    legend.innerHTML = '<i style="background:#ededed"></i>Near<i style="background:#f97316"></i>Mid<i style="background:#777"></i>Far';
    stage.append(canvas, hud, map, legend);
    var r1 = hud.querySelector('.gs-r1'), r2 = hud.querySelector('.gs-r2');

    /* ---------- snow height map: a 2D canvas ---------- */
    var SN = { cx: 0, cz: 0, hs: 6, size: 256 };
    var hm = el('canvas'); hm.width = hm.height = SN.size;
    var hctx = hm.getContext('2d'); hctx.fillStyle = '#fff'; hctx.fillRect(0, 0, SN.size, SN.size);
    map.appendChild(hm);
    var stepAcc = 0, foot = 1, lastPrint = null;
    function stamp(x, z, dirx, dirz) { // multiply a soft foot-shaped brush: darker = deeper
      var px = (x - SN.cx + SN.hs) / (SN.hs * 2) * SN.size, py = (z - SN.cz + SN.hs) / (SN.hs * 2) * SN.size;
      var k = SN.size / (SN.hs * 2), len = Math.hypot(dirx, dirz) || 1, side = foot * .16 * k;
      px += -dirz / len * side; py += dirx / len * side; foot = -foot;
      hctx.save(); hctx.globalCompositeOperation = 'multiply';
      hctx.translate(px, py); hctx.rotate(Math.atan2(dirz, dirx)); hctx.scale(1, .55);
      var r = .7 * k * .5, g = hctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, 'rgba(40,40,40,1)'); g.addColorStop(.6, 'rgba(120,120,120,1)'); g.addColorStop(1, 'rgba(255,255,255,1)');
      hctx.fillStyle = g; hctx.beginPath(); hctx.arc(0, 0, r, 0, 7); hctx.fill(); hctx.restore();
    }

    /* ---------- player ---------- */
    var P = { x: 9, z: 3, vx: 0, vz: 0 }, target = null, auto = !R, autoT = 0, keys = {}, lastPointer = -9, T = 0;
    function path(t) { return { x: 13 * Math.sin(t * .22), z: 7 * Math.sin(t * .44) }; }
    function trail() { for (var i = 0; i < 9; i++) stamp(-4 + i * .75, -1 + i * .3, 1, .4); }
    if (R) { P.x = 2.5; P.z = 1.5; }

    /* ---------- WebGL 2 ---------- */
    var gl = null;
    try { gl = canvas.getContext('webgl2', { antialias: true, alpha: false }); } catch (e) { gl = null; }
    var c2 = gl ? null : canvas.getContext('2d');
    var TILES = [.15, .4, .8], RINGS = [[0, 11], [10, 31], [30, 60]], WIDTH = [2, 5, 10], counts = [0, 0, 0];
    var prog = {}, buf = {}, tex = null, total = 0;
    var NOISE = 'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
      'float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);' +
      ' return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }';
    var FOG = 'float fogK(float d){ return smoothstep(22.0, 58.0, d); }';
    var GRASS_VS = '#version 300 es\nlayout(location=0) in vec2 aV; layout(location=1) in vec3 aI;' +
      'uniform mat4 uVP; uniform vec2 uPlayer; uniform vec3 uCam; uniform float uTime; uniform vec3 uTile; uniform vec3 uWidth; uniform vec3 uSnow;' +
      'out float vH; out float vSeed; out float vFog; out float vGlow; flat out int vRing;' + NOISE + FOG +
      'void main(){ int ring = int(aI.z + .5); float tile = uTile[ring];' +
      ' vec2 w = uPlayer + aI.xy; vec2 cell = floor(w / tile);' +
      ' vec2 j = vec2(hash(cell), hash(cell + vec2(17.23, 91.7))) - .5;' +
      ' vec2 root = w - mod(w, tile) + j * tile; float seed = hash(cell + 3.71);' +           // snap + jitter
      ' float cl = .65 * vnoise(root * .10 * 4.0) + .35 * vnoise(root * .20 * 4.0 + 7.0);' +
      ' float clump = pow(smoothstep(.45, .8, cl), 1.8);' +
      ' float h = mix(.55, 1.25, clump) * .5 * (.8 + .4 * seed); float wd = mix(.85, 1.12, clump) * .035 * uWidth[ring];' +
      ' float stiff = mix(1.0, .55, clump); float vy = aV.y;' +
      ' vec2 sd = abs(root - uSnow.xy) - uSnow.z; float snowM = smoothstep(-.2, .5, max(sd.x, sd.y) + (seed - .5) * .7);' +
      ' float d = length(root - uPlayer); float fade = 1.0 - pow(clamp(d / 60.0, 0.0, 1.0), 5.0);' +
      ' h *= fade * snowM; wd *= fade;' +
      ' float yaw = vnoise(root * .13 * 6.0) * (.5 + .5 * vnoise(root * .13 * 6.0 + 9.0)) * 6.2831 + seed * 3.0;' +
      ' vec3 side = vec3(cos(yaw), 0.0, sin(yaw)) * aV.x * wd * (1.0 - vy * .85) * .5;' +
      ' vec2 n = vec2(vnoise(root * .15 + vec2(uTime * .6, uTime * .25)), vnoise(root * .26 + vec2(-uTime * .4, uTime * .5) + 5.0));' +
      ' float bend = clamp((.45 + (n.y * 2.0 - 1.0) + (n.x * 2.0 - 1.0) * .15) * .30 * stiff * 2.4, -1.0, 1.0);' +
      ' float a = bend * pow(vy, 3.0) + (seed - .5) * .5 * vy; vec2 wdir = normalize(vec2(.8, -.6));' +
      ' vec3 p = vec3(root.x, 0.0, root.y) + side + vec3(wdir.x * sin(a), cos(a), wdir.y * sin(a)) * vy * h;' +
      ' vec2 to = p.xz - uPlayer; float dl = length(to); if (dl < 1.0) p.xz += .3 * (to / max(dl, 1e-3)) * vy * (1.0 - dl);' + // player push, r = 1 m
      ' vH = vy; vSeed = seed; vRing = ring; vFog = fogK(distance(p, uCam)); vGlow = clamp(1.0 - d / 3.5, 0.0, 1.0);' +
      ' gl_Position = uVP * vec4(p, 1.0); }';
    var GRASS_FS = '#version 300 es\nprecision highp float; in float vH; in float vSeed; in float vFog; in float vGlow; flat in int vRing;' +
      'uniform float uRings; out vec4 o; void main(){' +
      ' vec3 tip = vec3(.8) * (.7 + .3 * vSeed);' +
      ' if (uRings > .5) tip = vRing == 0 ? vec3(.93) : vRing == 1 ? vec3(.976, .451, .086) : vec3(.45);' +
      ' vec3 c = mix(vec3(.05), tip, pow(vH, 1.3)) + vec3(.976, .451, .086) * vGlow * vH * .7;' +
      ' o = vec4(mix(c, vec3(0.0), vFog), 1.0); }';
    var PLANE_VS = '#version 300 es\nlayout(location=0) in vec2 aV; uniform mat4 uVP; uniform vec4 uRect; uniform float uY; out vec3 vW; out vec2 vUv;' +
      'void main(){ vUv = aV * .5 + .5; vW = vec3(uRect.x + aV.x * uRect.z, uY, uRect.y + aV.y * uRect.w); gl_Position = uVP * vec4(vW, 1.0); }';
    var GROUND_FS = '#version 300 es\nprecision highp float; in vec3 vW; uniform vec3 uCam; uniform vec2 uPlayer; out vec4 o;' + FOG +
      'void main(){ float g = .035 + .05 * exp(-length(vW.xz - uPlayer) * .35); vec3 c = vec3(g) + vec3(.976, .451, .086) * .12 * exp(-length(vW.xz - uPlayer) * .9);' +
      ' float r = length(vW.xz - uPlayer); c += vec3(.976, .451, .086) * smoothstep(.06, 0.0, abs(r - 1.0)) * .9 + smoothstep(.16, .1, r);' + // 1 m push radius + player
      ' o = vec4(mix(c, vec3(0.0), fogK(distance(vW, uCam))), 1.0); }';
    var SNOW_FS = '#version 300 es\nprecision highp float; in vec3 vW; in vec2 vUv; uniform vec3 uCam; uniform sampler2D tH; uniform float uTexel; uniform vec2 uPlayer; out vec4 o;' + FOG + NOISE +
      'float H(vec2 uv, vec2 dx, vec2 dy){ return textureGrad(tH, uv, dx, dy).r; }' +
      'void main(){ vec2 uv = vUv; vec3 V = normalize(uCam - vW); vec2 dx = dFdx(uv), dy = dFdy(uv);' + // derivatives outside the loop
      ' float dist = distance(uCam, vW);' +
      ' if (dist < 20.0) {' +                                                                                   // POM cutoff 20 m
      '  vec3 Vts = vec3(V.x, V.z, V.y); vec2 rayUV = -(Vts.xy / max(abs(Vts.z), 1e-4)) * (10.0 * uTexel);' +
      '  float ns = mix(22.0, 10.0, clamp(V.y, 0.0, 1.0)); float stepH = 1.0 / ns, hRay = 1.0; vec2 off = vec2(0.0); bool hit = false;' +
      '  for (int i = 0; i < 50; i++) { if (float(i) > ns) break; if (H(uv + off, dx, dy) > hRay) { hit = true; break; } hRay -= stepH; off += stepH * rayUV; }' +
      '  if (hit) { vec2 hi = off, lo = off - stepH * rayUV; for (int k = 0; k < 4; k++) { vec2 m = .5 * (lo + hi); if (H(uv + m, dx, dy) > hRay + .5 * stepH) hi = m; else lo = m; } off = .5 * (lo + hi); }' +
      '  off = clamp(off, vec2(-5.0 * uTexel), vec2(5.0 * uTexel)); uv = clamp(uv + off, 0.0, 1.0); }' +
      ' float h = H(uv, dx, dy); float e = uTexel * 1.5;' +
      ' float hx = H(uv + vec2(e, 0), dx, dy) - H(uv - vec2(e, 0), dx, dy), hz = H(uv + vec2(0, e), dx, dy) - H(uv - vec2(0, e), dx, dy);' +
      ' vec3 n = normalize(vec3(-hx * 6.0, 1.0, -hz * 6.0)); float l = .55 + .6 * max(dot(n, normalize(vec3(-.5, .7, -.4))), 0.0);' +
      ' vec3 c = mix(vec3(.761, .816, .89), vec3(1.0), h) * l * .62 * (.88 + .12 * vnoise(vW.xz * 1.7));' +   // snowBottom 0xC2D0E3 → white
      ' vec2 ed = abs(vUv - .5) * 2.0; c = mix(vec3(.04), c, smoothstep(1.0, .8 + .12 * vnoise(vW.xz * 2.3), max(ed.x, ed.y)));' +
      ' c = mix(c, vec3(1.0), smoothstep(.16, .1, length(vW.xz - uPlayer)));' +
      ' c += vec3(.976, .451, .086) * smoothstep(.06, 0.0, abs(length(vW.xz - uPlayer) - 1.0)) * .7;' +
      ' o = vec4(mix(c, vec3(0.0), fogK(dist)), 1.0); }';
    function compile(vs, fs) {
      var p = gl.createProgram();
      [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) {
        var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
        gl.attachShader(p, sh);
      });
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (var i = 0; i < n; i++) { var name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
      return { p: p, u: u };
    }
    if (gl) {
      try {
        prog.grass = compile(GRASS_VS, GRASS_FS); prog.ground = compile(PLANE_VS, GROUND_FS); prog.snow = compile(PLANE_VS, SNOW_FS);
        // blade: 4 segments as a triangle strip (aV.x = side, aV.y = height 0..1)
        var bl = []; for (var s = 0; s <= 4; s++) { bl.push(-1, s / 4, 1, s / 4); }
        var inst = [];
        RINGS.forEach(function (r, id) { // lattice in the annulus, built once; never created at runtime
          var t = TILES[id];
          for (var x = -r[1]; x <= r[1]; x += t) for (var z = -r[1]; z <= r[1]; z += t) {
            var d = Math.hypot(x, z); if (d >= r[0] && d <= r[1]) { inst.push(x, z, id); counts[id]++; }
          }
        });
        total = inst.length / 3;
        buf.grass = gl.createVertexArray(); gl.bindVertexArray(buf.grass);
        var b1 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bl), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        var b2 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inst), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(1, 1);
        buf.quad = gl.createVertexArray(); gl.bindVertexArray(buf.quad);
        var b3 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b3); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);
        tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // no mipmaps
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hm);
      } catch (e) { if (window.console) console.warn('[grass] WebGL init failed, using 2D', e); gl = null; c2 = null; }
    }
    if (!gl && !c2) { var cv2 = el('canvas', 'gs-gl'); canvas.replaceWith(cv2); canvas = cv2; c2 = canvas.getContext('2d'); }
    r1.innerHTML = gl ? '<b>' + total.toLocaleString('en-US') + '</b> blades<span class="long"> · 3 instanced draws</span>' : '<b>Canvas 2D</b> fallback<span class="long"> · top-down sketch</span>';

    /* ---------- math ---------- */
    function mul(a, b) { var o = new Float32Array(16); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
    function nrm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
    function crs(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    var cam = { e: [0, 7, 9], f: null, r: null, u: null }, FOV = 50 * Math.PI / 180, W = 1, H = 1;
    function viewProj() {
      var c = [P.x, 0, P.z - 4], e = cam.e, z = nrm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = nrm(crs([0, 1, 0], z)), y = crs(z, x);
      cam.f = [-z[0], -z[1], -z[2]]; cam.r = x; cam.u = y;
      var V = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
        -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
      var t = 1 / Math.tan(FOV / 2), n = .1, f = 120, a = W / H;
      return mul([t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0], V);
    }
    function groundAt(sx, sy) { // screen px → point on y = 0 (camera ray, no matrix inverse needed)
      var nx = sx / W * 2 - 1, ny = 1 - sy / H * 2, t = Math.tan(FOV / 2), a = W / H;
      var d = [0, 1, 2].map(function (i) { return cam.f[i] + cam.r[i] * nx * t * a + cam.u[i] * ny * t; });
      if (d[1] > -1e-3) return null;
      var k = -cam.e[1] / d[1]; return { x: cam.e[0] + d[0] * k, z: cam.e[2] + d[2] * k };
    }

    /* ---------- input ---------- */
    function localXY(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    canvas.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !cam.f) return;
      var p = localXY(e), g = groundAt(p[0], p[1]); if (g) { target = g; lastPointer = T; }
    });
    canvas.addEventListener('pointerdown', function (e) {
      if (!cam.f) return; var p = localXY(e), g = gl ? groundAt(p[0], p[1]) : { x: P.x + (p[0] - W / 2) / scale2d(), z: P.z + (p[1] - H / 2) / scale2d() };
      if (g) { target = g; lastPointer = T + 4; }
    });
    canvas.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') lastPointer = T - .5; });
    canvas.addEventListener('keydown', function (e) {
      var k = { ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r' }[e.code];
      if (k) { keys[k] = true; e.preventDefault(); }
    });
    canvas.addEventListener('keyup', function (e) { var k = { ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r' }[e.code]; if (k) keys[k] = false; });
    canvas.addEventListener('blur', function () { keys = {}; });
    var rings = false;
    function setBtns() { bRing.setAttribute('aria-pressed', String(rings)); bAuto.setAttribute('aria-pressed', String(auto)); legend.hidden = !rings; }
    bRing.addEventListener('click', function () { rings = !rings; setBtns(); if (!lp.running) frame(0); });
    bAuto.addEventListener('click', function () { auto = !auto; setBtns(); });
    setBtns();

    /* ---------- simulation + draw ---------- */
    var upAcc = 0;
    function scale2d() { return Math.min(W, H) / 20; }
    function ih(x, z, k) { var h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(k, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
    function update(dt) {
      if (!R) T += dt;
      var kx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), kz = (keys.d ? 1 : 0) - (keys.u ? 1 : 0), goal = null;
      if (kx || kz) { goal = { x: P.x + kx * 3, z: P.z + kz * 3 }; lastPointer = T; target = null; }
      else if (target && T - lastPointer < 1.5) goal = target;
      else if (auto) { autoT += dt; goal = path(autoT); }
      var vx = 0, vz = 0;
      if (goal) { var dx = goal.x - P.x, dz = goal.z - P.z, d = Math.hypot(dx, dz); if (d > .15) { var sp = Math.min(3.2, d * 2); vx = dx / d * sp; vz = dz / d * sp; } }
      P.vx = ctx.damp(P.vx, vx, 6, dt); P.vz = ctx.damp(P.vz, vz, 6, dt);
      P.x += P.vx * dt; P.z += P.vz * dt;
      var ce = [P.x, 7, P.z + 9]; cam.e = cam.e.map(function (v, i) { return ctx.damp(v, ce[i], R ? 20 : 5, dt); });
      var speed = Math.hypot(P.vx, P.vz), onSnow = Math.abs(P.x - SN.cx) < SN.hs && Math.abs(P.z - SN.cz) < SN.hs;
      if (onSnow && speed > .3) { stepAcc += speed * dt; if (stepAcc > .42) { stepAcc = 0; stamp(P.x, P.z, P.vx, P.vz); } }
      upAcc += dt * 1000;
      if (upAcc >= 100) { // heal + upload, at most every 100 ms
        hctx.globalCompositeOperation = 'source-over'; hctx.fillStyle = 'rgba(255,255,255,' + (.35 * upAcc * .001).toFixed(4) + ')'; hctx.fillRect(0, 0, SN.size, SN.size);
        if (gl) { gl.bindTexture(gl.TEXTURE_2D, tex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, hm); }
        upAcc = 0;
      }
      var txt = '<span class="long">player </span><b>' + P.x.toFixed(1) + ', ' + P.z.toFixed(1) + '</b> · ' + (onSnow ? '<b class="accent">on snow</b>' : 'on grass');
      if (txt !== r2.innerHTML) r2.innerHTML = txt;
    }
    function frame(dt) {
      var fit = ctx.fitCanvas(canvas, stage, 1.5); W = fit.w; H = fit.h; // DPR capped at 1.5
      if ((W < 480) !== stage.classList.contains('narrow')) stage.classList.toggle('narrow', W < 480);
      update(dt);
      if (gl) drawGL(); else draw2d(fit.dpr);
    }
    function drawGL() {
      var VP = viewProj();
      gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      var g = prog.ground; gl.useProgram(g.p); gl.bindVertexArray(buf.quad);
      gl.uniformMatrix4fv(g.u.uVP, false, VP); gl.uniform4f(g.u.uRect, P.x, P.z, 70, 70); gl.uniform1f(g.u.uY, 0);
      gl.uniform3fv(g.u.uCam, cam.e); gl.uniform2f(g.u.uPlayer, P.x, P.z); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      var s = prog.snow; gl.useProgram(s.p);
      gl.uniformMatrix4fv(s.u.uVP, false, VP); gl.uniform4f(s.u.uRect, SN.cx, SN.cz, SN.hs, SN.hs); gl.uniform1f(s.u.uY, .01);
      gl.uniform3fv(s.u.uCam, cam.e); gl.uniform1f(s.u.uTexel, 1 / SN.size); gl.uniform2f(s.u.uPlayer, P.x, P.z);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(s.u.tH, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      var q = prog.grass; gl.useProgram(q.p); gl.bindVertexArray(buf.grass);
      gl.uniformMatrix4fv(q.u.uVP, false, VP); gl.uniform2f(q.u.uPlayer, P.x, P.z); gl.uniform3fv(q.u.uCam, cam.e);
      gl.uniform1f(q.u.uTime, T); gl.uniform3fv(q.u.uTile, TILES); gl.uniform3fv(q.u.uWidth, WIDTH);
      gl.uniform3f(q.u.uSnow, SN.cx, SN.cz, SN.hs); gl.uniform1f(q.u.uRings, rings ? 1 : 0);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 10, total);
      gl.bindVertexArray(null);
    }
    var shade = null, shadeAt = -1;
    function draw2d(dpr) { // fallback: top-down sketch with the same rules (snap + jitter, tip-only bend, push, fade)
      var c = c2, s = scale2d(), ox = W / 2, oy = H / 2;
      cam.f = cam.f || [0, 0, -1];
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#050505'; c.fillRect(0, 0, W, H);
      if (shadeAt !== upAcc || !shade) { // shaded copy of the height map
        var src = hctx.getImageData(0, 0, SN.size, SN.size).data; shade = shade || hctx.createImageData(SN.size, SN.size);
        for (var y = 0; y < SN.size; y++) for (var x = 0; x < SN.size; x++) {
          var i = (y * SN.size + x) * 4, h = src[i] / 255, hx = (src[i + 4] || src[i]) - (src[i - 4] || src[i]), hz = (src[i + SN.size * 4] || src[i]) - (src[i - SN.size * 4] || src[i]);
          var l = .8 + (-hx * .5 + -hz * .4) / 255 * 4, v = (194 + 61 * h) * l * .85;
          shade.data[i] = v; shade.data[i + 1] = (208 + 47 * h) * l * .85; shade.data[i + 2] = (227 + 28 * h) * l * .85; shade.data[i + 3] = 255;
        }
        shadeAt = upAcc;
      }
      var tmp = draw2d.tmp || (draw2d.tmp = el('canvas')); tmp.width = tmp.height = SN.size; tmp.getContext('2d').putImageData(shade, 0, 0);
      c.drawImage(tmp, ox + (SN.cx - SN.hs - P.x) * s, oy + (SN.cz - SN.hs - P.z) * s, SN.hs * 2 * s, SN.hs * 2 * s);
      var tile = .55, rad = Math.max(W, H) / s / 2 + 1;
      c.lineCap = 'round';
      for (var gx = Math.floor((P.x - rad) / tile); gx <= (P.x + rad) / tile; gx++) for (var gz = Math.floor((P.z - rad) / tile); gz <= (P.z + rad) / tile; gz++) {
        var hsh = ih(gx, gz, 1), hs2 = ih(gx, gz, 2);
        var rx = (gx + hsh) * tile, rz = (gz + hs2) * tile;
        if (Math.abs(rx - SN.cx) < SN.hs + .2 && Math.abs(rz - SN.cz) < SN.hs + .2) continue;
        var dx = rx - P.x, dz = rz - P.z, d = Math.hypot(dx, dz), fade = 1 - Math.pow(Math.min(d / (rad * 1.1), 1), 5);
        var wind = R ? .4 : .4 + Math.sin(rx * .5 + T * 1.6) * Math.cos(rz * .4 + T * .9) * .5;
        var tx = .8 * wind * .35, tz = -.6 * wind * .35;
        if (d < 1) { tx += .3 * dx / (d || 1) * (1 - d); tz += .3 * dz / (d || 1) * (1 - d); }
        var near = Math.max(0, 1 - d / 3.5);
        c.strokeStyle = near > 0 ? 'rgba(249,115,22,' + (.3 + near * .6) + ')' : 'rgba(255,255,255,' + (.25 + hsh * .35) * fade + ')';
        c.lineWidth = 1.4; c.beginPath(); c.moveTo(ox + dx * s, oy + dz * s); c.lineTo(ox + (dx + tx * fade) * s, oy + (dz + tz * fade) * s - 3 * fade); c.stroke();
      }
      c.strokeStyle = '#f97316'; c.lineWidth = 1; c.beginPath(); c.arc(ox, oy, s, 0, 7); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(ox, oy, 4, 0, 7); c.fill();
    }
    var lp = ctx.loop(frame);
    frame(0.016);
    return {
      start: function () { if (R) trail(); lp.start(); },
      stop: function () { lp.stop(); keys = {}; }
    };
  }
});
