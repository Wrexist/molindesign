/* immersive-site-playbook — the layered stage as an exploded, focusable stack; each layer names and links the skill that builds it. */
Lib.register('immersive-site-playbook', {
  hint: 'Hover or tab through the layers; click one to jump to the demo of its skill',
  notes: [
    'One fixed full-screen <code>&lt;canvas&gt;</code> with every piece of UI as an HTML overlay; wheel and touch scrub a timeline instead of scrolling a page',
    'Engine and UI only talk through callbacks (<code>onChapter</code>, <code>onBeat</code>, <code>onCue</code>) and anchor refs; the engine is lazy-loaded after first paint',
    'One scene table <code>[name, startTime]</code> drives the chapter UI, rail ticks, copy beats and audio cues',
    'Black stage, white at opacity steps, one orange <code>#f97316</code>; <code>cubic-bezier(0.23, 1, 0.32, 1)</code> for everything entering',
    'Commit to one hard idea and budget everything around it; finish with coarse-pointer 44 px targets, reduced motion, Esc and arrow keys'
  ],
  simplified: 'A map rather than a site: the layers are illustrated planes, and each one links to the live demo of the skill that builds it.',
  css: `
.d-immersive-site-playbook { background: radial-gradient(80% 70% at 30% 55%, rgb(249 115 22 / .07), transparent 60%), #030303; }
.d-immersive-site-playbook .pb-wrap { position: absolute; inset: 0; display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); }
.d-immersive-site-playbook .pb-scene { position: relative; perspective: 1400px; overflow: hidden; }
.d-immersive-site-playbook .pb-scene > .label { position: absolute; left: 20px; top: 18px; margin: 0; color: rgb(255 255 255 / .5); z-index: 2; }
.d-immersive-site-playbook .pb-stack { position: absolute; left: 50%; top: 56%; width: min(62%, 300px); aspect-ratio: 16 / 10; transform-style: preserve-3d; transform: translate(-50%, -50%) rotateX(58deg) rotateZ(-38deg); }
.d-immersive-site-playbook .pb-layer { position: absolute; inset: 0; transform-style: preserve-3d; border: 1px solid rgb(255 255 255 / .2); border-radius: 6px; background: rgb(12 12 12 / .72); transition: transform .6s cubic-bezier(.23, 1, .32, 1), border-color .3s, background .3s, box-shadow .3s; overflow: hidden; padding: 0; text-align: left; }
.d-immersive-site-playbook .pb-layer.pb-on { border-color: #f97316; background: rgb(30 14 4 / .82); box-shadow: 0 0 0 1px rgb(249 115 22 / .4), 0 0 40px rgb(249 115 22 / .25); }
.d-immersive-site-playbook .pb-layer:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }
.d-immersive-site-playbook .pb-tag { position: absolute; left: 8px; top: 6px; font: 500 9px/1 Archivo, sans-serif; letter-spacing: .18em; text-transform: uppercase; color: rgb(255 255 255 / .55); z-index: 2; }
.d-immersive-site-playbook .pb-on .pb-tag { color: #fff; }
.d-immersive-site-playbook .pb-art { position: absolute; inset: 0; }
.d-immersive-site-playbook .a-canvas { background: radial-gradient(40% 50% at 60% 55%, rgb(255 255 255 / .55), rgb(249 115 22 / .35) 40%, transparent 70%); }
.d-immersive-site-playbook .a-vig { background: radial-gradient(70% 70% at 50% 50%, transparent 35%, rgb(0 0 0 / .95)); }
.d-immersive-site-playbook .a-load { display: grid; place-items: center; font: 800 34px/1 Archivo, sans-serif; font-stretch: 125%; color: rgb(255 255 255 / .16); letter-spacing: -.02em; }
.d-immersive-site-playbook .a-load i { position: absolute; bottom: 10px; font: 500 9px Archivo; letter-spacing: .2em; color: rgb(255 255 255 / .6); font-style: normal; }
.d-immersive-site-playbook .a-hud::before, .d-immersive-site-playbook .a-hud::after, .d-immersive-site-playbook .a-cur::before, .d-immersive-site-playbook .a-cur::after { content: ""; position: absolute; width: 14px; height: 14px; border: 0 solid rgb(255 255 255 / .7); }
.d-immersive-site-playbook .a-hud::before { right: 8px; top: 8px; border-top-width: 1px; border-right-width: 1px; }
.d-immersive-site-playbook .a-hud::after { left: 8px; bottom: 8px; border-bottom-width: 1px; border-left-width: 1px; }
.d-immersive-site-playbook .a-hud i { position: absolute; right: 28px; top: 9px; width: 40px; height: 4px; background: rgb(255 255 255 / .35); }
.d-immersive-site-playbook .a-copy i { position: absolute; left: 14px; height: 9px; background: rgb(255 255 255 / .75); }
.d-immersive-site-playbook .a-copy i:nth-child(1) { top: 46%; width: 58%; } .d-immersive-site-playbook .a-copy i:nth-child(2) { top: calc(46% + 14px); width: 40%; background: rgb(255 255 255 / .45); }
.d-immersive-site-playbook .a-pins i { position: absolute; width: 7px; height: 7px; border-radius: 50%; background: #f97316; box-shadow: 0 0 8px #f97316; }
.d-immersive-site-playbook .a-pins i::after { content: ""; position: absolute; left: 7px; top: 3px; width: 36px; height: 1px; background: rgb(255 255 255 / .6); }
.d-immersive-site-playbook .a-prog i { position: absolute; left: 10%; right: 10%; bottom: 16px; height: 1px; background: rgb(255 255 255 / .3); }
.d-immersive-site-playbook .a-prog i::before { content: ""; position: absolute; left: 0; top: 0; width: 46%; height: 1px; background: #fff; }
.d-immersive-site-playbook .a-prog i::after { content: ""; position: absolute; inset: -4px 0 0; background: repeating-linear-gradient(to right, rgb(255 255 255 / .5) 0 1px, transparent 1px 16.6%); height: 4px; }
.d-immersive-site-playbook .a-panel i { position: absolute; right: 0; top: 0; bottom: 0; width: 38%; background: rgb(255 255 255 / .1); border-left: 1px solid rgb(255 255 255 / .3); }
.d-immersive-site-playbook .a-cur::before { left: calc(50% - 16px); top: calc(50% - 16px); border-top-width: 1px; border-left-width: 1px; }
.d-immersive-site-playbook .a-cur::after { left: calc(50% + 2px); top: calc(50% + 2px); border-bottom-width: 1px; border-right-width: 1px; }
.d-immersive-site-playbook .a-cur i { position: absolute; left: calc(50% - 2px); top: calc(50% - 2px); width: 4px; height: 4px; border-radius: 50%; background: #fff; }
.d-immersive-site-playbook .pb-side { position: relative; padding: 18px 22px 18px 6px; display: flex; flex-direction: column; gap: 12px; min-height: 0; }
.d-immersive-site-playbook .pb-seg { display: inline-flex; align-self: flex-start; border: 1px solid rgb(255 255 255 / .18); border-radius: 999px; padding: 3px; }
.d-immersive-site-playbook .pb-seg button { padding: 6px 12px; border-radius: 999px; color: rgb(255 255 255 / .6); }
.d-immersive-site-playbook .pb-seg button[aria-selected="true"] { background: #fff; color: #000; }
.d-immersive-site-playbook .pb-panel[hidden] { display: none; }
.d-immersive-site-playbook .pb-panel .label { margin: 0; color: rgb(255 255 255 / .5); }
.d-immersive-site-playbook .pb-name { font-family: Archivo, sans-serif; font-stretch: 125%; font-size: clamp(24px, 3vw, 38px); line-height: 1; letter-spacing: -.02em; margin: 8px 0 10px; color: #fff; }
.d-immersive-site-playbook .pb-desc { margin: 0 0 12px; font-size: 14px; line-height: 1.5; color: rgb(255 255 255 / .72); }
.d-immersive-site-playbook .pb-go { display: inline-flex; gap: 8px; align-items: center; padding: 9px 14px; border-radius: 999px; background: #f97316; color: #000; }
.d-immersive-site-playbook .pb-go:hover { background: #fb923c; }
.d-immersive-site-playbook .pb-also { margin: 10px 0 0 !important; }
.d-immersive-site-playbook .pb-idea { margin-top: auto; border-top: 1px solid rgb(255 255 255 / .12); padding-top: 12px; }
.d-immersive-site-playbook .pb-idea p:last-child { font-family: Archivo, sans-serif; font-stretch: 125%; font-size: 17px; line-height: 1.25; color: #fff; margin: 6px 0 0; }
.d-immersive-site-playbook .pb-idea em { color: rgb(255 255 255 / .6); }
.d-immersive-site-playbook .pb-check { list-style: none; margin: 10px 0 0; padding: 0; }
.d-immersive-site-playbook .pb-check label { display: flex; gap: 10px; align-items: flex-start; padding: 7px 0; border-top: 1px solid rgb(255 255 255 / .1); font-size: 13px; line-height: 1.4; color: rgb(255 255 255 / .75); cursor: pointer; }
.d-immersive-site-playbook .pb-check input { appearance: none; -webkit-appearance: none; flex: none; width: 14px; height: 14px; margin: 2px 0 0; border: 1px solid rgb(255 255 255 / .4); border-radius: 3px; display: grid; place-items: center; }
.d-immersive-site-playbook .pb-check input:checked { background: #f97316; border-color: #f97316; }
.d-immersive-site-playbook .pb-check input:checked::after { content: "✓"; font-size: 10px; color: #000; }
.d-immersive-site-playbook .pb-check input:focus-visible { outline: 1px solid #f97316; outline-offset: 2px; }
.d-immersive-site-playbook.pb-narrow .pb-wrap { grid-template-columns: minmax(0, 1fr); grid-template-rows: 46% minmax(0, 1fr); }
.d-immersive-site-playbook.pb-narrow .pb-side { padding: 4px 16px 16px; gap: 8px; }
.d-immersive-site-playbook.pb-narrow .pb-stack { width: min(58%, 220px); top: 58%; }
.d-immersive-site-playbook.pb-narrow .pb-desc { font-size: 13px; margin-bottom: 8px; }
.d-immersive-site-playbook.pb-narrow .pb-idea { display: none; }
@media (prefers-reduced-motion: reduce) { .d-immersive-site-playbook .pb-layer { transition: border-color .3s, background .3s; } }
`,
  mount(stage, ctx) {
    var el = ctx.el, R = ctx.reduced;
    var L = [ // bottom → top, as in the playbook's architecture block
      ['Canvas · the film', 'gpu-renderer-fallback-warmup', 'a-canvas', '', 'One fixed full-screen canvas with role="img". The engine is lazy-loaded after first paint and plays a single scrubbed take.', 'gpu-tier-adaptive-quality'],
      ['Vignette', 'premium-micro-details', 'a-vig', '', 'Radial plus top and bottom gradients, pointer-events none, so copy stays legible over any frame.', 'hud-cinematic-ui'],
      ['Loader', 'cinematic-loader', 'a-load', 'MOTION<i>099%</i>', 'SVG and 2D canvas only, on top until ready: silhouette fill, rolling counter, fly-through exit.', 'gpu-renderer-fallback-warmup'],
      ['HUD chrome', 'hud-cinematic-ui', 'a-hud', '<i></i>', 'Corner-bracket frame, top nav and the Sound toggle. Wide uppercase labels, tabular numbers.', 'web-audio-soundscape'],
      ['Story copy', 'masked-text-reveal', 'a-copy', '<i></i><i></i>', 'Per-chapter lines rise out of overflow masks; small labels blur-fade in. Gated on the intro state machine.', 'char-split-scroll-reveal'],
      ['Pins', 'hotspot-callout-pins', 'a-pins', '<i style="left:30%;top:40%"></i><i style="left:55%;top:62%"></i>', 'The engine writes transforms onto anchored DOM pins every frame; leader lines draw out, sides auto-flip.', 'orbit-drag-reveal'],
      ['Progress rail', 'scroll-driven-chapters', 'a-prog', '<i></i>', 'Chapter ticks, picker and camera telemetry, all derived from the same scene table as the copy and cues.', 'scroll-velocity-section-metrics'],
      ['Drawer', 'slide-over-drawer', 'a-panel', '<i></i>', 'Specification and About live in a side panel instead of a new page; Esc closes, focus returns.', 'premium-micro-details'],
      ['Cursor', 'reticle-cursor', 'a-cur', '<i></i>', 'Fine pointers only: a 3 px dot and four brackets that snap around targets. Off for reduced motion.', 'spring-input-physics']
    ];
    var wrap = el('div', 'pb-wrap'), scene = el('div', 'pb-scene'), stack = el('div', 'pb-stack'), side = el('div', 'pb-side');
    scene.appendChild(el('p', 'label', 'Layered stage · <span class="accent">9 layers</span>'));
    scene.appendChild(stack);
    var layers = L.map(function (d, i) {
      var b = el('button', 'pb-layer', '<span class="pb-art ' + d[2] + '">' + d[3] + '</span><span class="pb-tag">' + String(i + 1).padStart(2, '0') + ' ' + d[0] + '</span>');
      b.type = 'button'; b.setAttribute('aria-label', 'Layer ' + (i + 1) + ': ' + d[0] + ', built with ' + d[1] + '. Activate to jump to its demo.');
      b.dataset.cursor = 'Open';
      b.addEventListener('pointerenter', function () { touched = true; select(i); });
      b.addEventListener('focus', function () { touched = true; select(i); });
      b.addEventListener('click', function () { go(i); });
      b.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0;
        if (k) { e.preventDefault(); layers[(i + k + L.length) % L.length].focus(); }
      });
      stack.appendChild(b); return b;
    });
    side.innerHTML = '<div class="pb-seg" role="tablist" aria-label="Playbook"><button type="button" role="tab" class="label" aria-selected="true">Layer</button><button type="button" role="tab" class="label" aria-selected="false">Checklist</button></div>' +
      '<div class="pb-panel" role="tabpanel"><p class="label pb-num"></p><h4 class="pb-name"></h4><p class="pb-desc"></p><button type="button" class="pb-go label"></button><p class="label pb-also"></p></div>' +
      '<div class="pb-panel" role="tabpanel" hidden><p class="label">Before launch</p><ul class="pb-check"></ul></div>' +
      '<div class="pb-idea"><p class="label">The rule</p><p>Commit to <span class="accent">one hard idea</span>. <em>Budget everything else around it.</em></p></div>';
    wrap.append(scene, side); stage.appendChild(wrap);
    var $ = function (s) { return side.querySelector(s); };
    var tabs = side.querySelectorAll('[role=tab]'), panels = side.querySelectorAll('.pb-panel');
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { tabs.forEach(function (x, j) { x.setAttribute('aria-selected', String(i === j)); x.tabIndex = i === j ? 0 : -1; panels[j].hidden = i !== j; }); });
      t.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = tabs[(i + 1) % 2]; n.click(); n.focus(); } });
    });
    tabs[1].tabIndex = -1;
    ['Phones: <code>pointer: coarse</code> layout and 44 px hit areas', 'Reduced motion honoured in every layer', 'Keyboard: Esc closes, arrows drive sliders and tabs', 'No overlapping overlays in any state', 'DPR capped at 2; engine lazy-loaded after first paint']
      .forEach(function (t) { $('.pb-check').appendChild(el('li', '', '<label><input type="checkbox"><span>' + t + '</span></label>')); });
    var goBtn = $('.pb-go');
    goBtn.addEventListener('click', function () { go(active); });

    var active = 0, touched = false, timer = 0, explode = R ? 1 : 0, target = R ? 1 : 0, ro = null;
    function select(i) {
      active = i;
      layers.forEach(function (b, j) { b.classList.toggle('pb-on', j === i); });
      var d = L[i];
      $('.pb-num').innerHTML = 'Layer ' + String(i + 1).padStart(2, '0') + ' / 09 · z ' + i;
      $('.pb-name').textContent = d[0];
      $('.pb-desc').textContent = d[4];
      goBtn.innerHTML = d[1] + ' <span aria-hidden="true">↓</span>';
      $('.pb-also').innerHTML = 'Also: <a class="ulink" href="#' + d[5] + '">' + d[5] + '</a>';
      layout();
    }
    function go(i) {
      var t = document.getElementById(L[i][1]);
      if (t) t.scrollIntoView({ behavior: R ? 'auto' : 'smooth', block: 'start' });
    }
    function layout() {
      var gap = ctx.lerp(5, stage.classList.contains('pb-narrow') ? 20 : 30, explode);
      layers.forEach(function (b, j) { b.style.transform = 'translateZ(' + (j * gap + (j === active ? 18 * explode + 4 : 0)).toFixed(1) + 'px)'; });
    }
    var lp = ctx.loop(function (dt) {
      explode = ctx.damp(explode, target, 4, dt); layout();
      if (Math.abs(explode - target) < .001) lp.stop();
    });
    select(0);
    return {
      start: function () {
        if (!ro) { ro = new ResizeObserver(function () { stage.classList.toggle('pb-narrow', stage.clientWidth < 600); layout(); }); ro.observe(stage); }
        if (!R) timer = setInterval(function () { if (!touched) select((active + 1) % L.length); }, 2400); // idle tour until the viewer takes over
      },
      stop: function () { clearInterval(timer); timer = 0; lp.stop(); if (ro) { ro.disconnect(); ro = null; } },
      scroll: function (p) { // the stack explodes as the stage scrolls into view
        if (R) return;
        var t = ctx.clamp((p - .08) / .3, 0, 1); t = t * t * (3 - 2 * t);
        if (Math.abs(t - target) > .002) { target = t; lp.start(); }
      }
    };
  }
});
