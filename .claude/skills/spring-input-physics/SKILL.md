---
name: spring-input-physics
description: "Weighty, inertial feel without a physics engine — a second-order dynamics (f, zeta, r) filter for eased pointer/scroll input, hand-rolled velocity-push physics for hero props (mouse swipes nudge and tilt objects that damp back home), frame-rate-independent exp damping, scroll-boosted camera look-at parallax, and a spring-bone wiggle. Use for single-hero-object or desk-of-objects sites where the object should feel like it has mass. From oryzo.ai (Lusion) bundle."
---

# Spring input + prop physics

Verified in `oryzo.ai` `hoisted.js`: `SecondOrderDynamics`, `Input.addEasedInput`, `HeroSceneProp` (update/getInteraction/applyForces/integrate), `WiggleSystem`, `CameraControls.update`. **No Rapier/Cannon/Matter** — everything is closed-form springs and exp damping.

## 1. Second-order dynamics (the core)
Params `f` (Hz, speed), `zeta` (damping; <1 overshoot), `r` (initial response; >1 anticipates, <0 undershoots). `k1 = zeta/(π f)`, `k2 = 1/(2π f)²`, `k3 = r·zeta/(2π f)`. Oryzo uses the **robust** variant (exact pole-based coefficients when `ω·dt ≥ zeta`, clamped otherwise) so a long frame never explodes.
```js
class SOD { // scalar; make one per axis or use arrays
  constructor(x0, f=1.5, z=.8, r=2){ this.set(f,z,r); this.y=x0; this.v=0; this.xp=x0; }
  set(f,z,r){ this.w=2*Math.PI*f; this.z=z; this.d=this.w*Math.sqrt(Math.abs(z*z-1));
    this.k1=z/(Math.PI*f); this.k2=1/(this.w*this.w); this.k3=r*z/this.w; }
  update(dt, x){ if(dt<=0) return this.y;
    const xv=(x-this.xp)/dt; this.xp=x; let k1,k2;
    if (this.w*dt < this.z){ k1=this.k1; k2=Math.max(this.k2, dt*dt/2+dt*this.k1/2, dt*this.k1); }
    else { const t1=Math.exp(-this.z*this.w*dt), alpha=2*t1*(this.z<=1?Math.cos(dt*this.d):Math.cosh(dt*this.d)),
           beta=t1*t1, t2=dt/(1+beta-alpha); k1=(1-beta)*t2; k2=dt*t2; }
    this.y += this.v*dt;
    this.v += dt*(x + this.k3*xv - this.y - k1*this.v)/k2;
    return this.y; } }
```
**Presets from source** (f, zeta, r): default mouse `1.35, .5, 1.25` · drag-scroll `2, 1, 1` · gobo/click light `1, .3, 2` · hand finger joints `1.5, .5, 3` (very bouncy) · class default `1.5, .8, 2`. Feed normalized mouse (-1…1) as target, read `.y` each frame with real `dt`. Keep one instance per consumer ("default", "dragScroll", "gobo") so each has its own personality.

## 2. Velocity-push props (hero desk objects)
Each prop has a rest pose; the eased mouse (SOD output, scaled to scene units) acts as a finger. Per frame:
1. `mouseVel = (mouse - mousePrev)/dt`. A prop is a line segment (top→bottom of its rotated rect). Find the nearest point on it to the mouse, `h = clamp(t,0,1)` along the axis; `dist` to that point; `R = width * collisionRadiusMultiplier (.25)`; if `dist > R` no interaction.
2. Use only the **perpendicular** component of mouse velocity (remove the part along the axis); `strength = fit(dist,0,R,1,0) * |perp|`; ignore if `< minStrength (.001)`.
3. Forces (`damp = exp(-dt * damping)`, damping 2): `vel *= damp; vel += dir * strength * (1 - |h-.5|*2) * translationForce(1) * dt` (push strongest at the middle); `angVel *= damp; angVel += cross(axis, dir) * (h-.5) * strength * |h-.5|*2 * rotationForce(.01) * rotationMultiplier * dt` (torque strongest at the ends).
4. Integrate: `disp += vel*dt; disp *= damp` (springs back by pure damping, no explicit spring), clamp `|disp| ≤ width * .5`; `rot += angVel*dt; rot *= damp`, clamp ±0.1π (per-prop `maxRotation`, `rotationMultiplier`). Optional damped oscillation (`stiffness`, `damping 10`, `snap`) adds a wobble perpendicular to the axis.
5. Soft shadow is re-rendered from the displaced positions (shadow offset `-20px` along light dir, plain shadow `-3px`), so objects "lift" convincingly.
Intro: each prop flies from `startX/startY/startRot` to rest with `cubicOut` over 1 s, delayed `0.5 + hash(i)*0.3` s.
Mobile: props disabled (`useProps = !isMobile`) — pointer physics needs a pointer.

## 3. Camera look + scroll boost
`look += (target - look) * k` with `k = 1 - exp(-dt * 5)` and `target = clamp(mouse,-1,1) * 0.05` rad (cameraLookStrength .05, ease factor 5). Then `k = saturate(max(|scrollViewDelta|*10, k))` — during fast scroll the look snaps to target so the camera never lags the page. Camera shake: position strength .5 @ speed .15, rotation .003 rad @ speed .3 (brownian noise). Mobile: gyroscope (`DeviceOrientationControls`) → virtual mouse, slerped with `1-exp(-dt*10)` then `1-exp(-dt*6)`.

## 4. Spring bones (the wiggling hand/cord)
`WiggleSystem`: joints with `stiffness 150`, `damping 10`, 3 substeps per frame (`dt/3`), root pinned to the animated skeleton, children pulled toward their rest direction × bone length; results packed in a float `DataTexture` (4×jointCount matrices) for GPU skinning. Port only if you have a skinned rig (I read the setup and step entry, not the full integrator); otherwise use §1.

## Rules
- Always integrate with **real dt** (clamp ≤ 50 ms) and `1 - exp(-k·dt)` smoothing, never per-frame `lerp(a,b,.1)`.
- Pick `zeta` by feel: .5 playful overshoot, .8 subtle, 1 critically damped (UI), >1 sluggish.
- Clamp every displacement; physics must always return to rest so the composition is never broken.
- Pointer-only: gate on `(pointer:fine)`; on touch use gyro or idle drift.
- **Reduced motion**: skip prop physics and look-parallax (rest pose, look = 0); keep the intro as a simple 200 ms fade.
- Physics is decoration, never carries information; the page must read perfectly at rest.
