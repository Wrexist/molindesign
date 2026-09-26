// 3d-asset-studio · w3d.js — plays .w3d stages once they scroll into view, and turns .w3d-spin turntables.
// No dependencies, and a classic script, so it also works from file:// and in any build setup:
//
//   <script src="/w3d.js" defer data-auto></script>        // binds every stage on the page
//   <script src="/w3d.js" defer></script> … w3d.init()     // or start it yourself
//   import './w3d.js'; window.w3d.bind(el)                  // bundlers / frameworks (side-effect import)
//
// data-play="view"   play once when scrolled into view (default)
//           "repeat" play every time it comes back into view
//           "load"   play right away (hero, above the fold)
//           "manual" wait for w3d.play(el)
(function () {
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const settle = (promise, ms) => Promise.race([promise, new Promise(resolve => setTimeout(resolve, ms))]);

/** Wait until the stage's images can paint, so an entrance never starts with holes (at most `timeout` ms). */
function decoded(el, timeout = 1500) {
  const images = [...el.querySelectorAll('img')];
  for (const img of images) if (img.loading === 'lazy') img.loading = 'eager'; // it is about to be seen
  return settle(Promise.all(images.map(img => (img.decode ? img.decode() : Promise.resolve()).catch(() => undefined))), timeout);
}

/** Play (or replay) a stage's entrance. Resolves when it has started. */
async function play(el) {
  if (reduced()) { el.classList.add('is-in'); return; }
  el.classList.add('is-armed');
  await decoded(el);
  el.classList.remove('is-in');
  void el.offsetWidth; // restart CSS animations
  el.classList.add('is-in');
  el.dispatchEvent(new CustomEvent('w3d:play', {bubbles: true}));
}

/** Rest state: hidden and ready to play again. */
function reset(el) {
  el.classList.remove('is-in');
  el.classList.add('is-armed');
}

let observer = null;
const modes = new WeakMap();
function watch(el) {
  observer ??= new IntersectionObserver(entries => {
    for (const entry of entries) {
      const el = entry.target, mode = modes.get(el);
      if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
        if (!el.classList.contains('is-in')) play(el);
        if (mode !== 'repeat') observer.unobserve(el);
      } else if (!entry.isIntersecting && mode === 'repeat') reset(el);
    }
  }, {threshold: [0, 0.3], rootMargin: '0px 0px -6% 0px'});
  observer.observe(el);
}

/** Set up one .w3d stage. Returns a cleanup function (handy in useEffect). */
function bind(el) {
  if (!el || el.w3dBound) return () => {};
  el.w3dBound = true;
  const mode = el.dataset.play || 'view';
  modes.set(el, mode);
  if (reduced() || !('IntersectionObserver' in window)) { el.classList.add('is-in'); return () => {}; }
  el.classList.add('is-armed');
  if (mode === 'load') play(el);
  else if (mode === 'view' || mode === 'repeat') watch(el);
  return () => { observer?.unobserve(el); el.w3dBound = false; };
}

/**
 * Turntable: <div class="w3d-spin" data-src="/assets/x/turntable/{i}.webp" data-frames="36" data-pad="3" style="--w3d-ar:900/600">
 * Drag (or swipe) to turn. data-auto="8" turns by itself at 8 frames/s until touched (never with reduced motion);
 * data-scrub turns it with the page scroll instead. Frames load when it comes near the viewport.
 */
function spin(el) {
  if (!el || el.w3dBound) return () => {};
  el.w3dBound = true;
  const frames = +el.dataset.frames || 36, pad = +el.dataset.pad || 3;
  const url = i => el.dataset.src.replace('{i}', String(i).padStart(pad, '0'));
  const img = el.querySelector('img') || el.appendChild(Object.assign(document.createElement('img'), {alt: el.getAttribute('aria-label') || '', decoding: 'async'}));
  if (!img.src) img.src = url(0);
  const cache = [];
  let frame = 0, loaded = false, timer = 0, dragging = null, alive = true;
  const load = () => { if (loaded) return; loaded = true; for (let i = 0; i < frames; i++) { const im = new Image(); im.decoding = 'async'; im.src = url(i); cache[i] = im; } };
  const show = i => { frame = ((Math.round(i) % frames) + frames) % frames; const im = cache[frame]; if (!im || im.complete) img.src = url(frame); };
  const stopAuto = () => { clearInterval(timer); timer = 0; };
  const near = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) { stopAuto(); return; }
    load();
    if (+el.dataset.auto && !reduced() && !timer && !dragging && alive) timer = setInterval(() => show(frame + 1), 1000 / +el.dataset.auto);
  }, {rootMargin: '300px'});
  near.observe(el);
  const down = e => { alive = false; stopAuto(); load(); dragging = {x: e.clientX, frame}; el.classList.add('is-dragging'); el.setPointerCapture?.(e.pointerId); };
  const move = e => { if (!dragging) return; const perFrame = el.clientWidth / frames * 1.6; show(dragging.frame - (e.clientX - dragging.x) / perFrame); };
  const up = () => { dragging = null; el.classList.remove('is-dragging'); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  let onScroll = null;
  if ('scrub' in el.dataset) {
    onScroll = () => { const r = el.getBoundingClientRect(), t = 1 - (r.top + r.height) / (innerHeight + r.height); load(); show(Math.max(0, Math.min(1, t)) * (frames - 1)); };
    addEventListener('scroll', onScroll, {passive: true});
    onScroll();
  }
  return () => { stopAuto(); near.disconnect(); if (onScroll) removeEventListener('scroll', onScroll); el.w3dBound = false; };
}

/** Bind every stage and turntable inside `root`. Returns a cleanup function. */
function init(root = document) {
  const cleanups = [...root.querySelectorAll('.w3d[data-play]')].map(bind).concat([...root.querySelectorAll('.w3d-spin')].map(spin));
  return () => cleanups.forEach(fn => fn());
}

const api = {init, bind, play, reset, spin};
if (typeof window !== 'undefined') {
  window.w3d = Object.assign(window.w3d || {}, api);
  const tag = typeof document !== 'undefined' ? document.currentScript : null;
  const auto = tag && (tag.hasAttribute('data-auto') || /[?&]auto\b/.test(tag.src));
  if (auto) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), {once: true});
    else init();
  }
}
})();
