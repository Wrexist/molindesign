/* gpu-renderer-fallback-warmup — real capability probe, decision path, caps, then real hidden warm-up frames behind an opaque loader. */
Lib.register('gpu-renderer-fallback-warmup', {
  hint: 'Watch your own browser boot. Replay reruns it; after reveal, scroll through the six warmed scenes',
  notes: [
    'Pick WebGPU when <code>navigator.gpu</code> exists, except on iOS with ≤ 4 cores; otherwise WebGL 2 (one canvas, one node-material code path)',
    'Default <code>DPR 1</code>, <code>?hd=true</code> for 2; mobile gets about 25% fewer particles (55 000 → 41 250 stars)',
    'Warm-up behind an opaque loader: 3 frames × 6 sections, then 3 overlay frames, so first scroll never compiles a pipeline',
    'Loader shows real progress capped at 99 until <code>compileEnd</code>, then 100, then fades <code>opacity .8s</code>',
    'On the WebGL-mobile path drop <code>filter: blur()</code> from text reveals and stretch opacity to 3 s instead of 1.4 s'
  ],
  simplified: 'The probe and decision are real, but the scene is always drawn with plain WebGL 2 shaders (no three.js WebGPURenderer, TSL or OffscreenCanvas worker). Warm-up frames are spaced out so you can watch them; on a real site they run back to back.',
  css: `
.d-gpu-renderer-fallback-warmup { background: #000; font-variant-numeric: tabular-nums; }
.d-gpu-renderer-fallback-warmup canvas.rw-gl, .d-gpu-renderer-fallback-warmup .rw-poster { position: absolute; inset: 0; width: 100%; height: 100%; }
.d-gpu-renderer-fallback-warmup .rw-poster { background: radial-gradient(60% 70% at 70% 40%, rgb(249 115 22 / .35), transparent 60%), linear-gradient(160deg, #1b1b1b, #000 70%); }
.d-gpu-renderer-fallback-warmup .rw-hud { position: absolute; left: 20px; right: 20px; bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; pointer-events: none; }
.d-gpu-renderer-fallback-warmup .rw-hud h4 { margin: 0; font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: clamp(24px, 4vw, 44px); line-height: 1; letter-spacing: -.02em; color: #fff; }
.d-gpu-renderer-fallback-warmup .rw-hud p { margin: 0 0 8px; color: rgb(255 255 255 / .6); }
.d-gpu-renderer-fallback-warmup .rw-chip { text-align: right; color: rgb(255 255 255 / .7); }
.d-gpu-renderer-fallback-warmup .rw-load { position: absolute; inset: 0; background: #000; z-index: 4; padding: 18px 20px; display: grid; grid-template-rows: auto 1fr auto; grid-template-columns: minmax(0, 1fr); gap: 14px; transition: opacity .8s ease; }
.d-gpu-renderer-fallback-warmup .rw-load.out { opacity: 0; pointer-events: none; }
.d-gpu-renderer-fallback-warmup .rw-top { display: flex; justify-content: space-between; align-items: flex-start; }
.d-gpu-renderer-fallback-warmup .rw-top .label { color: rgb(255 255 255 / .5); margin: 0; }
.d-gpu-renderer-fallback-warmup .rw-pct { font-family: Archivo, sans-serif; font-stretch: 125%; font-size: clamp(28px, 4.6vw, 52px); line-height: .9; color: #fff; }
.d-gpu-renderer-fallback-warmup .rw-pct small { font-size: .32em; color: rgb(255 255 255 / .4); margin-left: 4px; letter-spacing: .2em; }
.d-gpu-renderer-fallback-warmup .rw-mid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 20px; min-height: 0; }
.d-gpu-renderer-fallback-warmup .rw-pct { flex: none; }
.d-gpu-renderer-fallback-warmup dl { margin: 0; align-self: start; }
.d-gpu-renderer-fallback-warmup dl div { display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; border-top: 1px solid rgb(255 255 255 / .1); opacity: .12; transition: opacity .4s; }
.d-gpu-renderer-fallback-warmup dl div.on { opacity: 1; }
.d-gpu-renderer-fallback-warmup dt { color: rgb(255 255 255 / .45); }
.d-gpu-renderer-fallback-warmup dd { margin: 0; color: rgb(255 255 255 / .9); text-align: right; font: 11px/1.4 "Geist Mono", ui-monospace, monospace; }
.d-gpu-renderer-fallback-warmup dd.y { color: #f97316; }
.d-gpu-renderer-fallback-warmup .rw-flow { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.d-gpu-renderer-fallback-warmup svg { width: 100%; height: auto; max-height: 100%; overflow: visible; }
.d-gpu-renderer-fallback-warmup svg text { font-family: Archivo, sans-serif; font-size: 8.5px; letter-spacing: .12em; text-transform: uppercase; fill: rgb(255 255 255 / .4); transition: fill .4s; }
.d-gpu-renderer-fallback-warmup svg rect { fill: #0b0b0b; stroke: rgb(255 255 255 / .16); transition: stroke .4s, fill .4s; }
.d-gpu-renderer-fallback-warmup svg path { fill: none; stroke: rgb(255 255 255 / .14); stroke-width: 1; }
.d-gpu-renderer-fallback-warmup svg path.lit { stroke: #f97316; stroke-width: 1.5; stroke-dasharray: 200; stroke-dashoffset: 200; animation: rw-draw .5s cubic-bezier(.23, 1, .32, 1) forwards; }
.d-gpu-renderer-fallback-warmup svg g.lit rect { stroke: #f97316; fill: rgb(249 115 22 / .12); }
.d-gpu-renderer-fallback-warmup svg g.lit text, .d-gpu-renderer-fallback-warmup svg text.lit { fill: #fff; }
.d-gpu-renderer-fallback-warmup svg g.end.lit rect { fill: #f97316; } .d-gpu-renderer-fallback-warmup svg g.end.lit text { fill: #000; }
@keyframes rw-draw { to { stroke-dashoffset: 0; } }
.d-gpu-renderer-fallback-warmup .rw-caps { margin: 0; color: rgb(255 255 255 / .55); opacity: 0; transition: opacity .5s; }
.d-gpu-renderer-fallback-warmup .rw-caps.on { opacity: 1; } .d-gpu-renderer-fallback-warmup .rw-caps b { color: #fff; font-weight: 500; }
.d-gpu-renderer-fallback-warmup .rw-warm > p.label { margin: 0 0 8px; color: rgb(255 255 255 / .5); display: flex; justify-content: space-between; gap: 8px; }
.d-gpu-renderer-fallback-warmup .rw-cells { display: grid; grid-template-columns: repeat(21, 1fr); gap: 3px; }
.d-gpu-renderer-fallback-warmup .rw-cells i { position: relative; height: 26px; border: 1px solid rgb(255 255 255 / .14); border-radius: 2px; }
.d-gpu-renderer-fallback-warmup .rw-cells i.done { border-color: rgb(249 115 22 / .6); }
.d-gpu-renderer-fallback-warmup .rw-cells i b { position: absolute; left: 0; right: 0; bottom: 0; background: #f97316; height: 0; transition: height .25s; }
.d-gpu-renderer-fallback-warmup .rw-cells i.ov { border-style: dashed; }
.d-gpu-renderer-fallback-warmup .rw-ev { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
.d-gpu-renderer-fallback-warmup .rw-ev span { padding: 4px 8px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .15); color: rgb(255 255 255 / .35); transition: all .3s; }
.d-gpu-renderer-fallback-warmup .rw-ev span.on { color: #000; background: #fff; border-color: #fff; }
.d-gpu-renderer-fallback-warmup.narrow .rw-mid { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto; gap: 6px; align-content: start; }
.d-gpu-renderer-fallback-warmup.narrow dl { order: 2; }
.d-gpu-renderer-fallback-warmup.narrow svg { max-height: 150px; }
.d-gpu-renderer-fallback-warmup.narrow dl div { padding: 4px 0; } .d-gpu-renderer-fallback-warmup.narrow dl div.x { display: none; }
.d-gpu-renderer-fallback-warmup.narrow .rw-warm > p.label span:first-child, .d-gpu-renderer-fallback-warmup.narrow .rw-top .long { display: none; }
.d-gpu-renderer-fallback-warmup.narrow .rw-ev span { padding: 3px 6px; letter-spacing: .1em; }
.d-gpu-renderer-fallback-warmup.narrow .rw-caps { display: none; }
.d-gpu-renderer-fallback-warmup.narrow .rw-cells i { height: 18px; }
`,
  mount(stage, ctx) {
    var el = ctx.el, R = ctx.reduced;
    var canvas = el('canvas', 'rw-gl'); canvas.setAttribute('aria-hidden', 'true');
    var poster = el('div', 'rw-poster'); poster.hidden = true;
    var hud = el('div', 'rw-hud', '<div><p class="label rw-sec"></p><h4 class="rw-name"></h4></div><p class="label rw-chip"></p>');
    var load = el('div', 'rw-load');
    load.setAttribute('role', 'progressbar'); load.setAttribute('aria-label', 'Boot sequence'); load.setAttribute('aria-valuemin', '0'); load.setAttribute('aria-valuemax', '100');
    load.innerHTML =
      '<div class="rw-top"><p class="label">Boot<span class="long"> sequence</span> · <span class="accent">your browser</span></p><div class="rw-pct"><span>000</span><small>%</small></div></div>' +
      '<div class="rw-mid"><dl></dl><div class="rw-flow">' +
      '<svg viewBox="0 0 300 196" aria-hidden="true">' +
      '<path data-e="g-ios" d="M150 30 V44 H70 V58"/><path data-e="g-gl" d="M150 30 V44 H226 V114"/><path data-e="ios-gpu" d="M70 88 V156"/>' +
      '<path data-e="ios-gl" d="M70 88 V100 H200 V114"/><path data-e="gl-gl" d="M226 138 V150 H190 V156"/><path data-e="gl-po" d="M226 138 V150 H262 V156"/>' +
      '<text x="102" y="41">yes</text><text x="180" y="41">no</text><text x="76" y="128">no</text><text x="120" y="97">yes</text><text x="178" y="148">yes</text><text x="248" y="148">no</text>' +
      '<g data-n="g"><rect x="95" y="6" width="110" height="24" rx="12"/><text x="150" y="21" text-anchor="middle">navigator.gpu</text></g>' +
      '<g data-n="ios"><rect x="4" y="58" width="132" height="30" rx="15"/><text x="70" y="71" text-anchor="middle">iOS · cores ≤ 4</text><text x="70" y="82" text-anchor="middle" style="font-size:7px">or no adapter</text></g>' +
      '<g data-n="gl"><rect x="170" y="114" width="112" height="24" rx="12"/><text x="226" y="129" text-anchor="middle">webgl2 context</text></g>' +
      '<g data-n="WebGPU" class="end"><rect x="22" y="156" width="96" height="28" rx="4"/><text x="70" y="173" text-anchor="middle">WebGPU</text></g>' +
      '<g data-n="WebGL 2" class="end"><rect x="146" y="156" width="88" height="28" rx="4"/><text x="190" y="173" text-anchor="middle">WebGL 2</text></g>' +
      '<g data-n="Poster" class="end"><rect x="240" y="156" width="56" height="28" rx="4"/><text x="268" y="173" text-anchor="middle">Poster</text></g>' +
      '</svg><p class="label rw-caps"></p></div></div>' +
      '<div class="rw-warm"><p class="label"><span>Warm-up · 6 sections × 3 + 3 overlay</span><span class="rw-ms"></span></p><div class="rw-cells"></div>' +
      '<div class="rw-ev label"><span>compileEnd</span><span>renderedReady</span><span>reveal</span></div></div>';
    stage.append(canvas, poster, hud, load);
    var $ = function (s) { return load.querySelector(s); };
    var pctEl = $('.rw-pct span'), dl = $('dl'), caps = $('.rw-caps'), cellsEl = $('.rw-cells'), msEl = $('.rw-ms'), evs = load.querySelectorAll('.rw-ev span');
    var cells = [];
    for (var i = 0; i < 21; i++) { var c = el('i', i >= 18 ? 'ov' : '', '<b></b>'); c.title = i >= 18 ? 'Overlay frame' : 'Section ' + (Math.floor(i / 3) + 1); cellsEl.appendChild(c); cells.push(c); }

    /* ---------- real probe (skill's exact logic) ---------- */
    var ua = navigator.userAgent;
    var isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
    var isMobile = isIOS || /android/i.test(ua);
    var cores = navigator.hardwareConcurrency || 0, lowCores = isIOS && (!cores || cores <= 4);
    var hasGPU = navigator.gpu !== undefined, hd = /[?&]hd=true/.test(location.search);
    var gl = null;
    try { gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
    var probe = { adapter: hasGPU ? 'pending' : 'n/a', done: !hasGPU };
    if (hasGPU) {
      var to = setTimeout(function () { probe.adapter = 'timeout'; probe.done = true; }, 1500);
      try {
        navigator.gpu.requestAdapter().then(function (a) { clearTimeout(to); probe.adapter = a ? 'yes' : 'null'; probe.done = true; },
          function () { clearTimeout(to); probe.adapter = 'error'; probe.done = true; });
      } catch (e) { clearTimeout(to); probe.adapter = 'error'; probe.done = true; }
    }
    function decide() {
      var path = ['g'], use = false;
      if (hasGPU) {
        path.push('g-ios', 'ios');
        // weak iPhones skip WebGPU; we also fall back when requestAdapter() gives nothing (the safer variant)
        if (!lowCores && probe.adapter === 'yes') { use = true; path.push('ios-gpu'); } else path.push('ios-gl', 'gl');
      } else path.push('g-gl', 'gl');
      if (!use) path.push(gl ? 'gl-gl' : 'gl-po');
      var api = use ? 'WebGPU' : gl ? 'WebGL 2' : 'Poster';
      path.push(api);
      return { api: api, path: path };
    }
    var dpr = Math.min(hd ? 2 : 1, window.devicePixelRatio || 1);
    var rows = [
      ['navigator.gpu', hasGPU ? 'defined' : 'undefined', hasGPU],
      ['requestAdapter()', function () { return probe.adapter; }, function () { return probe.adapter === 'yes'; }],
      ['webgl2 context', gl ? 'yes' : 'no', !!gl],
      ['hardwareConcurrency', cores || 'unknown', false, 'x'],
      ['deviceMemory', navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'hidden', false, 'x'],
      ['platform', isIOS ? 'iOS' : isMobile ? 'Android' : 'desktop', false, 'x'],
      ['OffscreenCanvas', 'transferControlToOffscreen' in HTMLCanvasElement.prototype ? 'yes · off by default' : 'no', false, 'x'],
      ['DPR → render', (window.devicePixelRatio || 1) + ' → ' + dpr, true]
    ];
    rows.forEach(function (r) { var d = el('div', r[3] || '', '<dt class="label">' + r[0] + '</dt><dd></dd>'); dl.appendChild(d); r.el = d; });
    function paintRow(r) {
      var v = typeof r[1] === 'function' ? r[1]() : r[1], y = typeof r[2] === 'function' ? r[2]() : r[2];
      var dd = r.el.lastChild; dd.textContent = v; dd.className = y ? 'y' : '';
    }

    /* ---------- six section shaders (each its own pipeline) ---------- */
    var NAMES = ['Thread', 'Grain', 'Flow', 'Stars', 'Bloom', 'Fog'];
    var FR = [
      'float r = length(p); float k = .5 + .5 * sin(r * 40.0 - t * 2.0 + uP * 6.0); c = vec3(smoothstep(.92, 1.0, k) * (1.0 - r));',
      'float l = .25 + .25 * sin(p.x * 3.0 + t * .3); float g = h(p * 900.0 + floor(t * 30.0)) - .5; float resp = mix(1.0, 1.0 - l, .85); c = vec3(l + g * .5 * resp * .4);',
      'float s = sin(p.y * 18.0 + sin(p.x * 3.0 + t) * 2.0 + uP * 4.0); c = mix(vec3(.04), vec3(.85), smoothstep(.85, 1.0, s));',
      'vec2 g = floor(p * 40.0); float s = h(g); vec2 f = fract(p * 40.0) - .5; float tw = .5 + .5 * sin(t * 3.0 + s * 40.0); c = vec3(step(.82, s) * smoothstep(.2, 0.0, length(f)) * (.4 + tw));',
      'float d = length(p - vec2(.2 * sin(t * .5), .1)); vec3 o = vec3(.976, .451, .086); c = o * smoothstep(.5, .0, d) * .9 + o * .012 * 40.0 * exp(-d * 3.0);',
      'float z = 0.0; for (int i = 1; i < 6; i++) { float fi = float(i); z += smoothstep(.02, 0.0, abs(p.y + .5 - fi * .18 + .03 * sin(p.x * 4.0 + t + fi))) * exp(-.0041 * fi * 120.0); } c = vec3(z);'
    ];
    var progs = [], vao = null, U = [];
    function buildPrograms() { // created now; most drivers only finish compiling on first draw — the hitch warm-up hides
      var vs = '#version 300 es\nvoid main(){ vec2 v = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0); }';
      progs.forEach(function (p) { gl.deleteProgram(p); }); progs = []; U = [];
      FR.forEach(function (body) {
        var fs = '#version 300 es\nprecision highp float; uniform vec2 uRes; uniform float uT; uniform float uP; out vec4 o;' +
          'float h(vec2 q){ return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }' +
          'void main(){ vec2 p = (gl_FragCoord.xy - .5 * uRes) / uRes.y; float t = uT; vec3 c = vec3(0.0); ' + body +
          ' float v = 1.0 - smoothstep(.4, 1.1, length((gl_FragCoord.xy / uRes - .5) * vec2(1.2, 1.0))); o = vec4(c * (.35 + .65 * v), 1.0); }';
        var p = gl.createProgram();
        [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) { var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh); gl.attachShader(p, sh); });
        gl.linkProgram(p); progs.push(p);
        U.push({ res: gl.getUniformLocation(p, 'uRes'), t: gl.getUniformLocation(p, 'uT'), p: gl.getUniformLocation(p, 'uP') });
      });
      if (!vao) vao = gl.createVertexArray();
    }
    var px = new Uint8Array(4);
    function draw(i, prog, t, sync) {
      var fit = ctx.fitCanvas(canvas, stage, dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(progs[i]); gl.bindVertexArray(vao);
      gl.uniform2f(U[i].res, canvas.width, canvas.height); gl.uniform1f(U[i].t, t); gl.uniform1f(U[i].p, prog);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (sync) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); // force the GPU to finish so the frame time is real
      return fit;
    }

    /* ---------- the boot timeline ---------- */
    var S, D = R ? 0 : 1;
    function reset() {
      S = { phase: 'probe', t: 0, pct: 0, warm: 0, warmAcc: 0, ms: [], ev: 0, dec: null, lit: 0, firstMs: {}, section: -1 };
      load.classList.remove('out'); load.hidden = false; pctEl.textContent = '000'; load.setAttribute('aria-valuenow', '0');
      rows.forEach(function (r) { r.el.classList.remove('on'); });
      load.querySelectorAll('.lit').forEach(function (n) { n.classList.remove('lit'); });
      caps.classList.remove('on'); cells.forEach(function (c) { c.classList.remove('done'); c.firstChild.style.height = '0'; });
      evs.forEach(function (e) { e.classList.remove('on'); }); msEl.textContent = '';
      if (gl) buildPrograms();
    }
    function setPct(v) { S.pct = v; pctEl.textContent = String(Math.round(v)).padStart(3, '0'); load.setAttribute('aria-valuenow', String(Math.round(v))); }
    function tick(dt, now) {
      if (!S) return;
      S.t += dt;
      if (S.phase === 'probe') {
        var n = D ? Math.min(rows.length, Math.floor(S.t / .12) + 1) : rows.length;
        rows.forEach(function (r, i) { if (i < n) { r.el.classList.add('on'); paintRow(r); } });
        if (n === rows.length && probe.done && S.t > rows.length * .12 * D + .2 * D) { S.dec = decide(); S.phase = 'decide'; S.t = 0; }
      } else if (S.phase === 'decide') {
        var k = D ? Math.floor(S.t / .3) + 1 : S.dec.path.length;
        for (; S.lit < Math.min(k, S.dec.path.length); S.lit++) {
          var id = S.dec.path[S.lit], node = load.querySelector('[data-e="' + id + '"], [data-n="' + id + '"]');
          if (node) node.classList.add('lit');
        }
        if (S.lit >= S.dec.path.length && S.t > S.dec.path.length * .3 * D + .3 * D) {
          var api = S.dec.api, mob = isMobile;
          caps.innerHTML = api === 'Poster' ? 'Renderer <b>Poster</b> · still frame + chapter text, loader removed' : 'Renderer <b>' + api + '</b>' + (api === 'WebGPU' ? ' (scene below drawn in WebGL 2)' : '') + ' · DPR <b>' + dpr + '</b> · stars <b>' + (mob ? '41 250' : '55 000') + '</b> · flow <b>' + (mob ? '7 500' : '10 000') + '</b>' +
            (api !== 'WebGPU' && mob ? ' · <b>body.webgl-mobile</b>: no blur, 3 s fades' : '');
          caps.classList.add('on'); paintRow(rows[1]);
          S.phase = 'assets'; S.t = 0;
        }
      } else if (S.phase === 'assets') {
        setPct(D ? Math.min(99, S.t / 1.4 * 99) : 99); // real loaders cap at 99 until compileEnd
        if (S.pct >= 99) { S.phase = gl ? 'warm' : 'events'; S.t = 0; if (!gl) msEl.textContent = 'skipped · static poster'; }
      } else if (S.phase === 'warm') {
        S.warmAcc += dt;
        if (S.warmAcc >= .09 * D) { // one hidden frame per tick (spaced out only so you can watch)
          S.warmAcc = 0;
          var i = S.warm, sec = i < 18 ? Math.floor(i / 3) : 0, t0 = performance.now();
          draw(sec, i < 18 ? .5 : .8, 0, true); // section progress .5; overlay pass uses .8
          var ms = performance.now() - t0; S.ms.push(ms);
          cells[i].classList.add('done'); cells[i].firstChild.style.height = Math.min(100, 12 + ms * 4) + '%';
          cells[i].title += ' · ' + ms.toFixed(1) + ' ms';
          var firsts = S.ms.filter(function (_, j) { return j % 3 === 0 && j < 18; }), rest = S.ms.filter(function (_, j) { return j % 3 && j < 18; });
          var avg = function (a) { return a.length ? (a.reduce(function (x, y) { return x + y; }, 0) / a.length).toFixed(1) : '–'; };
          msEl.textContent = 'first frame ' + avg(firsts) + ' ms · warm ' + avg(rest) + ' ms';
          if (++S.warm >= 21) { S.phase = 'events'; S.t = 0; }
        }
      } else if (S.phase === 'events') {
        var e = D ? Math.min(3, Math.floor(S.t / .3) + 1) : 3;
        for (; S.ev < e; S.ev++) { evs[S.ev].classList.add('on'); if (S.ev === 0) setPct(100); }
        if (S.ev >= 3 && S.t > .9 * D) { load.classList.add('out'); poster.hidden = !!gl; S.phase = 'fade'; S.t = 0; }
      } else if (S.phase === 'fade') {
        if (S.t > .8) { load.hidden = true; S.phase = 'live'; }
      }
      if (S.phase === 'fade' || S.phase === 'live') live(dt, now);
    }
    var sceneT = 0, q = 0;
    function live(dt) {
      if (!R) sceneT += dt;
      var f = q * 6, i = Math.min(5, Math.floor(f)), sp = f - i;
      if (gl) {
        var t0 = performance.now(); draw(i, sp, sceneT, S.firstMs[i] == null);
        if (S.firstMs[i] == null) S.firstMs[i] = performance.now() - t0;
      }
      if (i !== S.section) {
        S.section = i;
        hud.querySelector('.rw-sec').textContent = 'Section ' + (i + 1) + ' / 6';
        hud.querySelector('.rw-name').textContent = NAMES[i];
      }
      hud.querySelector('.rw-chip').innerHTML = (gl ? 'Warmed · first live draw ' + S.firstMs[i].toFixed(1) + ' ms' : 'Static poster · no WebGL 2') + '<br>' + (S.dec ? S.dec.api : '') + ' · DPR ' + dpr + ' · progress ' + sp.toFixed(2);
    }
    var lp = ctx.loop(tick);
    var ro = null;
    reset();
    return {
      start: function () {
        if (!ro) { ro = new ResizeObserver(function () { stage.classList.toggle('narrow', stage.clientWidth < 560); }); ro.observe(stage); }
        lp.start();
      },
      stop: function () { lp.stop(); if (ro) { ro.disconnect(); ro = null; } },
      scroll: function () {
        var r = stage.getBoundingClientRect();
        q = ctx.clamp((1 - (r.top + r.height / 2) / innerHeight - .1) / .8, 0, .999);
      },
      replay: function () { reset(); }
    };
  }
});
