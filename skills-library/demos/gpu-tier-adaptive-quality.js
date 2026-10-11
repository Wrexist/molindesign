/* gpu-tier-adaptive-quality — detect a 0–3 tier from real signals at idle, then budget a particle field per tier. */
Lib.register('gpu-tier-adaptive-quality', {
  hint: 'Your tier is detected at idle. Override it with the buttons and watch the budget change',
  notes: [
    'Detect at idle (<code>requestIdleCallback</code>, timeout 2000 ms) and never block first paint; blocklisted or no WebGL → tier 0, a static poster',
    'Phones cap at tier 1; reduced motion behaves like tier ≤ 1 (no scroll-velocity effects)',
    'DPR: low tier = 1, else <code>min(devicePixelRatio, 2, cap / w, cap / h)</code> with cap 1920 (medium) or 3840 (high) px per axis',
    'Texture source 512 px on tiers 2–3, 256 px on 0–1; grow sprites by <code>1 + (max(1, 1024 / res) − 1) × .25</code>',
    'Extras such as scroll drift <code>v × 44</code> only on tier 3; fade new scenes in with <code>1 − (1 − t)³</code>, dt ≤ 1/30'
  ],
  simplified: 'No detect-gpu benchmark database: the tier comes from a WebGL renderer-string blocklist, a quick 512² shader benchmark mapped to detect-gpu’s 15 / 30 / 60 fps tier floors, cores and memory. Particle counts per tier are this demo’s, not Shopify’s.',
  css: `
.d-gpu-tier-adaptive-quality { background: #000; font-variant-numeric: tabular-nums; }
.d-gpu-tier-adaptive-quality canvas.gt-gl, .d-gpu-tier-adaptive-quality .gt-poster { position: absolute; inset: 0; width: 100%; height: 100%; }
.d-gpu-tier-adaptive-quality .gt-poster { background: radial-gradient(circle, rgb(255 255 255 / .5) 1px, transparent 1.5px) 0 0 / 22px 22px, radial-gradient(70% 60% at 65% 40%, rgb(249 115 22 / .28), transparent 65%), #050505; -webkit-mask: radial-gradient(90% 80% at 60% 40%, #000 30%, transparent 85%); mask: radial-gradient(90% 80% at 60% 40%, #000 30%, transparent 85%); }
.d-gpu-tier-adaptive-quality .gt-ui { position: absolute; inset: 0; padding: 18px 20px; background: radial-gradient(60% 55% at 0% 0%, rgb(0 0 0 / .8), transparent 70%), linear-gradient(to top, rgb(0 0 0 / .75), transparent 40%); display: grid; grid-template-rows: auto 1fr auto; grid-template-columns: minmax(0, 1fr); pointer-events: none; z-index: 2; }
.d-gpu-tier-adaptive-quality .gt-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.d-gpu-tier-adaptive-quality .gt-top .label { margin: 0; color: rgb(255 255 255 / .5); }
.d-gpu-tier-adaptive-quality .gt-big { font-family: Archivo, sans-serif; font-stretch: 125%; font-size: clamp(30px, 5vw, 56px); line-height: 1; margin: 6px 0 10px; color: #fff; letter-spacing: -.02em; }
.d-gpu-tier-adaptive-quality .gt-big i { font-style: normal; color: #f97316; }
.d-gpu-tier-adaptive-quality .gt-sig { margin: 0; padding: 0; list-style: none; max-width: 330px; }
.d-gpu-tier-adaptive-quality .gt-sig li { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; border-top: 1px solid rgb(255 255 255 / .08); }
.d-gpu-tier-adaptive-quality .gt-sig span { color: rgb(255 255 255 / .45); flex: none; }
.d-gpu-tier-adaptive-quality .gt-sig b { font: 400 10.5px/1.5 "Geist Mono", ui-monospace, monospace; color: rgb(255 255 255 / .85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; letter-spacing: 0; text-transform: none; }
.d-gpu-tier-adaptive-quality .gt-btns { display: flex; gap: 4px; pointer-events: auto; flex: none; border: 1px solid rgb(255 255 255 / .18); border-radius: 999px; padding: 3px; background: rgb(0 0 0 / .5); }
.d-gpu-tier-adaptive-quality .gt-btns button { min-width: 34px; padding: 7px 10px; border-radius: 999px; color: rgb(255 255 255 / .65); }
.d-gpu-tier-adaptive-quality .gt-btns button[aria-pressed="true"] { background: #fff; color: #000; }
.d-gpu-tier-adaptive-quality table { width: 100%; border-collapse: collapse; background: linear-gradient(to top, rgb(0 0 0 / .85), rgb(0 0 0 / .55)); }
.d-gpu-tier-adaptive-quality th, .d-gpu-tier-adaptive-quality td { text-align: left; padding: 6px 8px 6px 0; border-top: 1px solid rgb(255 255 255 / .1); font-weight: 500; white-space: nowrap; }
.d-gpu-tier-adaptive-quality th { color: rgb(255 255 255 / .4); }
.d-gpu-tier-adaptive-quality td { font: 400 11px/1.4 "Geist Mono", ui-monospace, monospace; color: rgb(255 255 255 / .55); transition: color .3s; }
.d-gpu-tier-adaptive-quality tr.on td { color: #fff; } .d-gpu-tier-adaptive-quality tr.on td:first-child { color: #f97316; }
.d-gpu-tier-adaptive-quality tr.on td:first-child::before { content: "▸ "; }
.d-gpu-tier-adaptive-quality .gt-live { margin: 8px 0 0; color: rgb(255 255 255 / .6); }
.d-gpu-tier-adaptive-quality.narrow .gt-sig li.x, .d-gpu-tier-adaptive-quality.narrow .fx { display: none; }
.d-gpu-tier-adaptive-quality.narrow .gt-btns button { min-width: 30px; padding: 6px 8px; }
.d-gpu-tier-adaptive-quality .gt-top > div:first-child { flex: 1; min-width: 0; }
.d-gpu-tier-adaptive-quality.narrow .gt-top { flex-direction: column-reverse; align-items: stretch; gap: 10px; }
.d-gpu-tier-adaptive-quality.narrow .gt-btns { align-self: flex-start; }
.d-gpu-tier-adaptive-quality.narrow .gt-big { margin: 2px 0 6px; }
`,
  mount(stage, ctx) {
    var el = ctx.el, R = ctx.reduced;
    var canvas = el('canvas', 'gt-gl'); canvas.setAttribute('aria-hidden', 'true');
    var poster = el('div', 'gt-poster'); poster.hidden = true; poster.setAttribute('aria-hidden', 'true');
    var ui = el('div', 'gt-ui');
    ui.innerHTML = '<div class="gt-top"><div><p class="label gt-src">Detecting at idle…</p><p class="gt-big">Tier <i>–</i></p><ul class="gt-sig"></ul></div>' +
      '<div class="gt-btns" role="group" aria-label="Quality tier"></div></div><div></div>' +
      '<div><table><thead><tr><th class="label">Tier</th><th class="label">DPR cap</th><th class="label">Texture</th><th class="label">Particles</th><th class="label fx">Effects</th></tr></thead><tbody></tbody></table><p class="label gt-live"></p></div>';
    stage.append(canvas, poster, ui);
    var big = ui.querySelector('.gt-big i'), src = ui.querySelector('.gt-src'), sig = ui.querySelector('.gt-sig'), live = ui.querySelector('.gt-live');
    var TIERS = [
      { q: 'static', dpr: '—', tex: 256, n: 0, fx: 'poster only, no WebGL' },
      { q: 'low', dpr: '1', tex: 256, n: 2500, fx: 'none' },
      { q: 'medium', dpr: '≤ 1920 px', tex: 512, n: 9000, fx: 'trails' },
      { q: 'high', dpr: '≤ 3840 px', tex: 512, n: 16000, fx: 'trails · glow · drift v×44' }
    ];
    var tbody = ui.querySelector('tbody');
    TIERS.forEach(function (t, i) {
      var tr = el('tr', '', '<td>' + i + ' · ' + t.q + '</td><td>' + t.dpr + '</td><td>' + t.tex + '</td><td>' + (t.n ? t.n.toLocaleString('en-US') : '—') + '</td><td class="fx">' + t.fx + '</td>');
      tbody.appendChild(tr); t.tr = tr;
    });
    var btnWrap = ui.querySelector('.gt-btns'), btns = [];
    ['Auto', '0', '1', '2', '3'].forEach(function (lab, i) {
      var b = el('button', 'label', lab); b.type = 'button'; b.setAttribute('aria-label', i ? 'Force tier ' + lab : 'Use detected tier');
      b.addEventListener('click', function () { override = i ? i - 1 : null; apply(); });
      btnWrap.appendChild(b); btns.push(b);
    });

    /* ---------- WebGL setup ---------- */
    var gl = null;
    try { gl = /nogl/.test(location.search) ? null : canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true }); } catch (e) { gl = null; } // TEMPNOGL
    var MAX = 16000, prog, quadProg, vao, qvao, U = {}, QU = {}, tex = null;
    function sh(vs, fs) {
      var p = gl.createProgram();
      [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) { var x = gl.createShader(s[0]); gl.shaderSource(x, s[1]); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); gl.attachShader(p, x); });
      gl.linkProgram(p); return p;
    }
    if (gl) {
      prog = sh('#version 300 es\nlayout(location=0) in vec4 aS; uniform float uT; uniform vec2 uRes; uniform float uSize; uniform float uDrift; uniform float uFade; out float vA;' +
        'void main(){ float t = uT * (.03 + aS.w * .05); vec2 p = vec2(aS.x * 2.0 - 1.0, aS.y * 2.0 - 1.0);' +
        ' p += .18 * vec2(sin(t * 6.2831 + aS.y * 9.0 + aS.z * 3.0), cos(t * 6.2831 * .8 + aS.x * 7.0));' +
        ' p += .05 * vec2(sin(p.y * 6.0 + uT * .4), cos(p.x * 5.0 - uT * .3));' +
        ' p.y += uDrift / uRes.y * 2.0; float depth = .35 + .65 * aS.z;' +
        ' gl_Position = vec4(p * vec2(1.0, 1.0), 0.0, 1.0); gl_PointSize = uSize * depth; vA = depth * uFade * (.35 + .65 * aS.w); }',
        '#version 300 es\nprecision mediump float; uniform sampler2D uTex; uniform vec3 uCol; uniform float uGain; in float vA; out vec4 o;' +
        'void main(){ float a = texture(uTex, gl_PointCoord).a * vA * uGain; o = vec4(uCol * a, a); }');
      quadProg = sh('#version 300 es\nvoid main(){ vec2 v = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0); }',
        '#version 300 es\nprecision mediump float; uniform float uA; out vec4 o; void main(){ o = vec4(0.0, 0.0, 0.0, uA); }');
      ['uT', 'uRes', 'uSize', 'uDrift', 'uFade', 'uTex', 'uCol', 'uGain'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
      QU.uA = gl.getUniformLocation(quadProg, 'uA');
      var seeds = new Float32Array(MAX * 4); for (var i = 0; i < seeds.length; i++) seeds[i] = Math.random();
      vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      qvao = gl.createVertexArray(); gl.bindVertexArray(null);
    }
    function makeSprite(res) { // per-tier texture resolution (256 or 512)
      var c = el('canvas'); c.width = c.height = res; var x = c.getContext('2d');
      var g = x.createRadialGradient(res / 2, res / 2, 0, res / 2, res / 2, res / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(255,255,255,.85)'); g.addColorStop(.45, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, res, res);
      if (tex) gl.deleteTexture(tex);
      tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }

    /* ---------- detection (real signals) ---------- */
    var ua = navigator.userAgent, mobile = /Android|iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document) || (matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches);
    var cores = navigator.hardwareConcurrency || 0, mem = navigator.deviceMemory || 0, save = !!(navigator.connection && navigator.connection.saveData);
    var det = { tier: null, why: '', renderer: '—', ms: null, fps: null };
    function rendererString() {
      if (!gl) return 'no WebGL 2';
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    }
    function bench() { // quick 512² heavy-shader benchmark, synced with readPixels
      var fb = gl.createFramebuffer(), t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      var p = sh('#version 300 es\nvoid main(){ vec2 v = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0); }',
        '#version 300 es\nprecision highp float; uniform float uK; out vec4 o; void main(){ vec2 p = gl_FragCoord.xy / 512.0; float a = 0.0;' +
        ' for (int i = 0; i < 48; i++) { a += sin(p.x * float(i) + uK) * cos(p.y * float(i) - a); } o = vec4(vec3(a), 1.0); }');
      var px = new Uint8Array(4), k = gl.getUniformLocation(p, 'uK');
      gl.viewport(0, 0, 512, 512); gl.useProgram(p); gl.bindVertexArray(qvao);
      gl.drawArrays(gl.TRIANGLES, 0, 3); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); // compile outside the timing
      var t0 = performance.now();
      for (var i = 0; i < 6; i++) { gl.uniform1f(k, i); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
      var ms = (performance.now() - t0) / 6;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(fb); gl.deleteTexture(t); gl.deleteProgram(p);
      return ms;
    }
    function detect() {
      det.renderer = rendererString();
      if (!gl) { det.tier = 0; det.why = 'WEBGL_UNSUPPORTED → static'; }
      else if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(det.renderer)) { det.tier = 0; det.why = 'blocklisted renderer → static'; }
      else {
        det.ms = bench(); det.fps = 1000 / (det.ms * (1920 * 1080) / (512 * 512)); // scale to a 1080p frame
        var t = det.fps >= 60 ? 3 : det.fps >= 30 ? 2 : det.fps >= 15 ? 1 : 0;
        det.why = 'benchmark ' + Math.round(det.fps) + ' fps @1080p';
        if (mobile && t > 1) { t = 1; det.why += ' · phone cap 1'; }
        if ((mem && mem <= 2) || (cores && cores <= 2)) { t = Math.min(t, 1); det.why += ' · low cores/memory'; }
        if (save) { t = Math.min(t, 1); det.why += ' · saveData'; }
        if (R) { t = Math.min(t, 1); det.why += ' · reduced motion'; }
        det.tier = Math.max(t, 1); // a working WebGL 2 context never drops to the poster from the benchmark alone
      }
      sig.innerHTML = [
        ['Renderer', det.renderer, ''], ['Cores · memory', (cores || '?') + ' · ' + (mem ? mem + ' GB' : 'hidden'), 'x'],
        ['Device', mobile ? 'mobile / coarse' : 'desktop / fine', 'x'],
        ['Benchmark', det.ms == null ? 'skipped' : det.ms.toFixed(2) + ' ms / 512² → ' + Math.round(det.fps) + ' fps', ''],
        ['Reduced motion', R ? 'yes → tier ≤ 1 behaviour' : 'no', 'x']
      ].map(function (r) { return '<li class="label ' + r[2] + '"><span>' + r[0] + '</span><b title="' + String(r[1]).replace(/"/g, '') + '">' + r[1] + '</b></li>'; }).join('');
      apply();
    }

    /* ---------- apply a tier ---------- */
    var override = null, tier = 1, fade = 0, T = 0, vel = 0, W = 1, H = 1, ro = null;
    function dprFor(q) { // exact rule from the skill
      if (q === 'low') return 1;
      var cap = q === 'medium' ? 1920 : 3840;
      return Math.max(1, Math.min(window.devicePixelRatio || 1, 2, cap / W, cap / H));
    }
    function apply() {
      var t = override != null ? override : det.tier != null ? det.tier : 1;
      if (!gl) t = 0;
      if (t !== tier || !tex) { fade = R ? 1 : 0; if (gl && t > 0) makeSprite(TIERS[t].tex); if (gl) { gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); } }
      tier = t;
      big.textContent = t; src.textContent = override != null ? 'Forced by you · detected ' + (det.tier != null ? det.tier : '…') : det.tier != null ? 'Detected · ' + det.why : 'Detecting at idle… (safe tier 1 meanwhile)';
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === 0 ? override == null : override === i - 1)); });
      TIERS.forEach(function (x, i) { x.tr.classList.toggle('on', i === t); });
      canvas.hidden = t === 0; poster.hidden = t !== 0;
      if (t === 0) live.textContent = 'Static poster · all content stays in the DOM';
    }
    function frame(dt) {
      if (tier === 0 || !gl) return;
      var cfg = TIERS[tier], q = cfg.q, d = dprFor(q);
      var fit = ctx.fitCanvas(canvas, stage, d); W = fit.w; H = fit.h;
      if (!R) T += dt;
      fade = R ? 1 : Math.min(1, fade + Math.min(dt, 1 / 30) / .8); var f = 1 - Math.pow(1 - fade, 3); // eased load fade
      var res = cfg.tex, grow = 1 + (Math.max(1, 1024 / res) - 1) * .25;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.enable(gl.BLEND);
      if (tier >= 2 && !R) { gl.useProgram(quadProg); gl.bindVertexArray(qvao); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.uniform1f(QU.uA, .3); gl.drawArrays(gl.TRIANGLES, 0, 3); } // trails
      else { gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
      gl.useProgram(prog); gl.bindVertexArray(vao); gl.blendFunc(gl.ONE, gl.ONE);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.uTex, 0);
      gl.uniform1f(U.uT, T); gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform1f(U.uFade, f);
      gl.uniform1f(U.uDrift, tier === 3 && !R ? vel * 44 * fit.dpr : 0); // tier-3-only motion add-on
      var base = 3.6 * fit.dpr * grow;
      gl.uniform1f(U.uSize, base); gl.uniform3f(U.uCol, 1, 1, 1); gl.uniform1f(U.uGain, tier === 1 ? .9 : tier === 2 ? .6 : .45);
      gl.drawArrays(gl.POINTS, 0, cfg.n);
      if (tier === 3) { gl.uniform1f(U.uSize, base * 3.2); gl.uniform3f(U.uCol, .976, .451, .086); gl.uniform1f(U.uGain, .06); gl.drawArrays(gl.POINTS, 0, cfg.n / 4 | 0); } // glow pass
      gl.disable(gl.BLEND);
      var txt = 'Rendering ' + cfg.n.toLocaleString('en-US') + ' particles · DPR ' + fit.dpr.toFixed(2) + ' · ' + res + ' px sprite ×' + grow.toFixed(2) + ' · ' + cfg.fx;
      if (live.textContent !== txt) live.textContent = txt;
    }
    var lp = ctx.loop(frame);
    apply();
    var idleId = 0, idleT = 0;
    function schedule() {
      if (det.tier != null) return;
      if ('requestIdleCallback' in window) idleId = requestIdleCallback(function () { idleId = 0; detect(); }, { timeout: 2000 });
      else idleT = setTimeout(function () { idleT = 0; detect(); }, 200);
    }
    return {
      start: function () {
        if (!ro) { ro = new ResizeObserver(function () { stage.classList.toggle('narrow', stage.clientWidth < 560); }); ro.observe(stage); }
        schedule(); lp.start();
      },
      stop: function () {
        lp.stop(); if (ro) { ro.disconnect(); ro = null; }
        if (idleId) { cancelIdleCallback(idleId); idleId = 0; } if (idleT) { clearTimeout(idleT); idleT = 0; }
      },
      scroll: function (p, v) { vel = R ? 0 : v; }
    };
  }
});
