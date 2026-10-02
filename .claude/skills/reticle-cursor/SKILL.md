---
name: reticle-cursor
description: Custom camera-reticle cursor — a 3px dot plus four corner brackets that spring-snap around hovered buttons/links/sliders, shrink on press, and show a small pill label from a data-cursor attribute. Fine-pointer only, disabled for reduced motion. Use for premium/immersive sites needing a branded cursor. From amv.tarunvishwakarma.dev.
---

# Reticle cursor

## Behaviour (exact)
- **Enabled only if** `matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches`, and only after the intro is done (`on` flag). Adds `html.reticle { cursor:none }` (`.reticle, .reticle * { cursor:none !important }`). Remove the class + listeners on cleanup.
- Elements: a 3 px white dot (follows pointer exactly, `shadow 0 0 6px rgb(0 0 0/.6)`), **four 7×7 px corner pieces** (`border-t border-l`, `border-t border-r`, `border-b border-l`, `border-b border-r`, `border-white/85`, `drop-shadow(0 0 3px rgb(0 0 0/.6))`), and a pill label (`label` class, `bg-black/55 rounded-full px-2.5 py-1 text-white/85`, `empty:hidden`).
- Idle box = 22 px square (±11) centred on the pointer; **pressed = 14 px (±7)**.
- **Snap**: on `pointermove`, `target = e.target.closest('a, button, [role=slider], [role=tab]')`. If present (and not disabled) the box becomes `rect` expanded by 6 px; the four corners then frame the element.
- Corner positions are eased in a single rAF loop with frame-rate-independent smoothing: `k = 1 − exp(−24·dt)` (dt clamped to 50 ms); `pos += (goal − pos)·k`. Dot uses raw pointer (no lag) — precision + elegance.
- **Label**: `target.dataset.cursor ?? (snapped ? null : defaultLabel)`; shown centred under the box (`translate((x+w)/2, bottom+10) translateX(-50%)`). The app passes `defaultLabel` by state: "Drag to turn" (explore mode), "Stir · click to follow" (finale). Sliders declare `data-cursor="Drag"`.
- Visibility: opacity 0→1 (`300 ms`) on first mouse move; hide on `document pointerleave` and window `blur`. Ignore non-mouse pointers (`e.pointerType === 'mouse'`).
- Container: `fixed inset-0 z-[70] pointer-events-none aria-hidden`.

## Skeleton
```js
function reticle({ label = () => '' } = {}) {
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  document.documentElement.classList.add('reticle');
  const m = { x:-100, y:-100 }, cur=[-120,-120,-80,-80], goal=[0,0,0,0];
  let hover=null, shown=false, down=false, last=performance.now(), raf;
  const onMove = e => { if (e.pointerType!=='mouse') return; m.x=e.clientX; m.y=e.clientY; shown=true;
    hover = e.target.closest?.('a, button, [role=slider], [role=tab]') ?? null; };
  const onDown = e => { if (e.pointerType==='mouse') down = e.type==='pointerdown'; };
  const tick = t => { raf=requestAnimationFrame(tick); const dt=Math.min((t-last)/1000,.05); last=t;
    const r = hover?.isConnected && !hover.disabled ? hover.getBoundingClientRect() : null, g = down?7:11;
    goal[0]=r? r.left-6 : m.x-g; goal[1]=r? r.top-6 : m.y-g; goal[2]=r? r.right+6 : m.x+g; goal[3]=r? r.bottom+6 : m.y+g;
    const k=1-Math.exp(-24*dt); for(let i=0;i<4;i++) cur[i]+=(goal[i]-cur[i])*k;
    const [x,y,x2,y2]=cur; root.style.opacity = shown?1:0; dot.style.transform=`translate3d(${m.x}px,${m.y}px,0)`;
    [[x,y],[x2-7,y],[x,y2-7],[x2-7,y2-7]].forEach(([cx,cy],i)=>corners[i].style.transform=`translate3d(${cx}px,${cy}px,0)`);
    const txt = hover?.dataset.cursor ?? (r ? null : label()) ?? ''; if (pill.textContent!==txt) pill.textContent = txt;
    pill.style.transform=`translate3d(${(x+x2)/2}px,${y2+10}px,0) translateX(-50%)`; };
  addEventListener('pointermove',onMove,{passive:true}); addEventListener('pointerdown',onDown,{passive:true}); addEventListener('pointerup',onDown,{passive:true});
  document.addEventListener('pointerleave',()=>shown=false); addEventListener('blur',()=>shown=false); raf=requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); document.documentElement.classList.remove('reticle'); /* remove listeners */ };
}
```

## Rules
- Never hide the system cursor on touch/coarse devices; never on reduced motion.
- Keep real focus styles for keyboard users — the reticle is pointer-only.
- All transforms via `translate3d` (compositor); no layout reads except `getBoundingClientRect` of the single hovered element.
- Pair with `pointer-coarse:` Tailwind variants for bigger tap targets (`pointer-coarse:py-3.5`).
