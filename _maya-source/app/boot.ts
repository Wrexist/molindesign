/**
 * Bridge to the static boot loader in index.html. The loader paints before this bundle arrives;
 * here we report progress and hand the equipment over to the hero once the site has rendered.
 */
type BootApi = {
  el: HTMLElement;
  reduce: boolean;
  speed: number;
  started: boolean;
  step(value: number): void;
  complete(): Promise<void>;
  fail(message: string): void;
  ready(text: string): void;
  introDone(): Promise<void>;
  idleStart(): number;
};

declare global {
  interface Window { mayaBoot?: BootApi }
}

const SCULPTURE = 'assets/fitness-sculpture.webp';
const IDLE_CYCLE = 2600;
const IDLE_REST = 0.4; // share of the idle cycle spent hopping; the rest of the cycle is at rest
const IDLE_AIRBORNE = 0.06; // before this the ball is only crouching, so stopping there is invisible

// Without the inline boot script (blocked or failed) the static markup would only cover the page.
if (!window.mayaBoot) document.getElementById('boot')?.remove();

const api = () => (window.mayaBoot?.el.isConnected ? window.mayaBoot : undefined);
let revealing = false;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, Math.max(0, ms)));

function decode(src?: string) {
  if (!src) return Promise.resolve();
  const image = new Image();
  image.src = src;
  return typeof image.decode === 'function' ? image.decode().catch(() => undefined) : Promise.resolve();
}

export function hasBootLoader() {
  return Boolean(api());
}

export function bootStep(value: number) {
  api()?.step(value);
}

export function bootFail(message: string) {
  api()?.fail(message);
}

/** Warm the hero sculpture early so the hand-over never lands on an empty spot. */
export function preloadSculpture(base: string) {
  if (api()) void decode(base + SCULPTURE);
}

let revealed = false;
function revealSite(root: HTMLElement) {
  root.classList.remove('is-booting');
  if (!revealed) window.dispatchEvent(new Event('maya:reveal'));
  revealed = true;
}

function hashTarget() {
  if (location.hash.length < 2) return null;
  let id = location.hash.slice(1);
  try { id = decodeURIComponent(id); } catch { /* keep the raw hash */ }
  return document.getElementById(id);
}

export async function bootReveal({heroImage, base}: {heroImage?: string; base: string}) {
  const boot = api();
  const root = document.documentElement;
  if (!boot) {
    root.classList.remove('boot-handoff');
    revealSite(root);
    return;
  }
  if (revealing) return;
  revealing = true;
  try {
    await handOver(boot, root, heroImage, base);
  } finally {
    // whatever happened above, never leave the page covered or locked
    root.classList.remove('boot-handoff');
    revealSite(root);
    boot.el.remove();
  }
}

async function handOver(boot: BootApi, root: HTMLElement, heroImage: string | undefined, base: string) {
  const el = boot.el;
  // Land on a finished hero: photo and sculpture decoded, but never hold the page for long.
  const decoded = Promise.race([Promise.all([decode(heroImage), decode(base + SCULPTURE)]), wait(1200)]);
  await Promise.all([decoded, boot.introDone()]);
  await boot.complete();
  boot.ready('Redo.');
  await wait(200 * boot.speed);  // a short beat on "Redo."
  // Freeze at rest (swapping animations would replay the intro). A hop that is already in the air
  // lands during the exit instead of holding it up; one that has barely started is simply dropped.
  const idleStart = boot.idleStart();
  const phase = el.classList.contains('is-idle') && Number.isFinite(idleStart) ? ((performance.now() - idleStart) % IDLE_CYCLE) / IDLE_CYCLE : 1;
  if (phase >= IDLE_AIRBORNE && phase < IDLE_REST) setTimeout(() => el.classList.add('is-still'), (IDLE_REST - phase) * IDLE_CYCLE + 30);
  else el.classList.add('is-still');

  const kit = el.querySelector<HTMLElement>('.boot-kit');
  const chrome = el.querySelectorAll<HTMLElement>('.boot-head, .boot-foot');
  const floors = el.querySelectorAll<HTMLElement>('.boot-floor');
  const backdrop = el.querySelector<HTMLElement>('.boot-bg');
  const anchor = hashTarget();
  if (anchor) anchor.scrollIntoView({behavior: 'instant'});
  const target = anchor ? null : document.querySelector<HTMLElement>('.public-site .equipment-art img');
  const to = target?.getBoundingClientRect();
  const from = kit?.getBoundingClientRect();
  const fly = Boolean(!boot.reduce && kit && from && to && to.width > 0 && to.top < innerHeight - to.height * 0.4 && to.bottom > 0);

  el.classList.add('is-leaving');
  const fade = (node: Element | null, duration: number, delay = 0) =>
    node?.animate([{opacity: getComputedStyle(node).opacity}, {opacity: 0}], {duration, delay, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards'}).finished.catch(() => undefined);
  chrome.forEach(node => void fade(node, 240));
  floors.forEach(node => void fade(node, 320));

  if (fly && kit && from && to) {
    root.classList.add('boot-handoff');
    revealSite(root);
    const w = from.width, h = from.height, lift = 1.03;
    const dx = to.left - from.left, dy = to.top - from.top, scale = to.width / w;
    const flight = kit.animate([
      {transform: 'none', easing: 'cubic-bezier(.3,0,.25,1)'},
      {transform: `translate(${(1 - lift) * w / 2}px, ${(1 - lift) * h / 2 - h * 0.03}px) scale(${lift})`, offset: 0.17, easing: 'cubic-bezier(.62,0,.18,1)'},
      {transform: `translate(${dx}px, ${dy}px) scale(${scale})`}
    ], {duration: 900 * boot.speed, fill: 'forwards'});
    void fade(backdrop, 520 * boot.speed, 260 * boot.speed);
    await flight.finished.catch(() => undefined);
    // same pixels underneath: show the hero sculpture and dissolve the kit over it
    root.classList.add('boot-landed');
    root.classList.remove('boot-handoff');
    await fade(kit, 200);
  } else {
    revealSite(root);
    void fade(kit, boot.reduce ? 300 : 520);
    if (kit && !boot.reduce) kit.animate([{transform: 'none'}, {transform: 'translateY(-3%) scale(.96)'}], {duration: 520, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards'});
    await fade(backdrop, boot.reduce ? 300 : 560, boot.reduce ? 0 : 120);
  }
}
