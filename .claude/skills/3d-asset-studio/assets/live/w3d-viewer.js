// <w3d-viewer>: a small live 3D viewer for one GLB — studio light, soft contact shadow, drag to turn, optional
// auto-rotate. It shows the poster at once, loads three.js only when the element comes near the viewport, stops
// drawing when nothing moves or it is off screen, and respects reduced motion. No build step.
//
//   <script type="importmap">{"imports": {"three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
//                                         "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
//   <script type="module" src="/js/w3d-viewer.js"></script>
//   <w3d-viewer src="/models/mug.glb" poster="/img/mug.webp" alt="Stoneware mug" auto-rotate></w3d-viewer>
//
// Attributes: src, poster, alt, auto-rotate, camera-orbit="azimuth elevation" (degrees, default "20 18"),
// exposure (1), shadow (0.5, 0 = none), environment ("studio" | an .hdr URL), fov (30), no-zoom.
// Size it with CSS (it fills its box; give it an aspect-ratio). Self-host three for production if you prefer.
const css = `:host{display:block;position:relative;contain:content;touch-action:pan-y}
canvas,img{position:absolute;inset:0;width:100%;height:100%;display:block}
img{object-fit:contain;transition:opacity .5s ease}
:host([data-ready]) img{opacity:0;pointer-events:none}
canvas{outline:none;cursor:grab}canvas:active{cursor:grabbing}`;

class W3DViewer extends HTMLElement {
  static get observedAttributes() { return ['src', 'auto-rotate', 'exposure']; }
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({mode: 'open'});
    root.innerHTML = `<style>${css}</style>`;
    if (this.getAttribute('poster')) {
      const img = document.createElement('img');
      img.src = this.getAttribute('poster'); img.alt = this.getAttribute('alt') ?? ''; img.decoding = 'async';
      root.append(img);
    }
    if (!this.hasAttribute('role')) this.setAttribute('role', 'img');
    if (this.getAttribute('alt')) this.setAttribute('aria-label', this.getAttribute('alt'));
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (e.isIntersecting && !this.started) { this.started = true; this.start().catch(err => console.error('w3d-viewer:', err)); }
      if (e.isIntersecting) this.wake();
    }, {rootMargin: '200px'});
    this.io.observe(this);
  }
  disconnectedCallback() { this.io?.disconnect(); this.ro?.disconnect(); cancelAnimationFrame(this.raf); this.drawing = false; this.renderer?.dispose(); }
  attributeChangedCallback(name) {
    if (!this.renderer) return;
    if (name === 'exposure') this.renderer.toneMappingExposure = +this.getAttribute('exposure') || 1;
    if (name === 'src') this.load();
    this.wake();
  }

  async start() {
    const THREE = this.THREE = await import('three');
    const [{GLTFLoader}, {DRACOLoader}, {MeshoptDecoder}, {RoomEnvironment}, {OrbitControls}] = await Promise.all([
      import('three/addons/loaders/GLTFLoader.js'), import('three/addons/loaders/DRACOLoader.js'), import('three/addons/libs/meshopt_decoder.module.js'),
      import('three/addons/environments/RoomEnvironment.js'), import('three/addons/controls/OrbitControls.js')]);
    const renderer = this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = +this.getAttribute('exposure') || 1;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
    this.shadowRoot.prepend(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = this.getAttribute('environment');
    if (env && /\.(hdr|exr)$/i.test(env)) {
      const {RGBELoader} = await import('three/addons/loaders/RGBELoader.js');
      const tex = await new RGBELoader().loadAsync(env); scene.environment = pmrem.fromEquirectangular(tex).texture; tex.dispose();
    } else scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    const camera = this.camera = new THREE.PerspectiveCamera(+this.getAttribute('fov') || 30, 1, 0.01, 1000);
    const controls = this.controls = new OrbitControls(camera, renderer.domElement);
    Object.assign(controls, {enableDamping: true, enablePan: false, enableZoom: !this.hasAttribute('no-zoom'), autoRotateSpeed: 1.2});
    controls.addEventListener('change', () => this.wake());
    renderer.domElement.addEventListener('pointerdown', () => { this.userMoved = true; });
    this.key = new THREE.DirectionalLight(0xffffff, 1.6); this.key.castShadow = true; this.key.shadow.mapSize.set(1024, 1024); this.key.shadow.radius = 8; this.key.shadow.blurSamples = 16;
    scene.add(this.key, this.key.target);
    this.loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(new URL('libs/draco/', import.meta.resolve('three/addons/')).href)).setMeshoptDecoder(MeshoptDecoder);
    this.clock = new THREE.Clock();
    this.ro = new ResizeObserver(() => { this.resize(); this.wake(); }); this.ro.observe(this);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => this.wake());
    await this.load();
  }

  async load() {
    const THREE = this.THREE, src = this.getAttribute('src');
    if (!src) return;
    const gltf = await this.loader.loadAsync(src);
    if (this.model) { this.scene.remove(this.model); this.model.traverse(o => o.geometry?.dispose()); }
    const model = this.model = gltf.scene;
    model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // stand it on y = 0, centred; size the light, shadow and camera to it
    const box = new THREE.Box3().setFromObject(model, true), c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    model.position.sub(new THREE.Vector3(c.x, box.min.y, c.z));
    this.scene.add(model);
    const r = this.radius = size.length() / 2;
    this.target = new THREE.Vector3(0, size.y / 2, 0);
    this.key.position.set(-r * 3, r * 5, r * 2.4); this.key.target.position.copy(this.target);
    Object.assign(this.key.shadow.camera, {left: -r * 2, right: r * 2, top: r * 2, bottom: -r * 2, near: r * 0.5, far: r * 14}); this.key.shadow.camera.updateProjectionMatrix();
    this.key.shadow.bias = -0.0005; this.key.shadow.normalBias = r * 0.004; // no acne on thin, double-sided parts (leaves, fabric)
    const shadow = +(this.getAttribute('shadow') ?? 0.5);
    if (this.floor) this.scene.remove(this.floor);
    if (shadow > 0) {
      this.floor = new THREE.Mesh(new THREE.PlaneGeometry(r * 20, r * 20).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({opacity: shadow, depthWrite: false}));
      this.floor.receiveShadow = true;
      // VSM also draws receivers into the shadow map; the endless floor would leave a line where the map ends
      this.floor.customDepthMaterial = new THREE.MeshDepthMaterial({colorWrite: false, depthWrite: false});
      this.scene.add(this.floor);
    }
    const [az, el] = (this.getAttribute('camera-orbit') ?? '20 18').split(/\s+/).map(v => THREE.MathUtils.degToRad(+v));
    const dist = r / Math.sin(THREE.MathUtils.degToRad(this.camera.fov / 2)) * 1.08;
    this.camera.position.set(Math.sin(az) * Math.cos(el) * dist, this.target.y + Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
    this.camera.near = dist / 100; this.camera.far = dist * 10; this.camera.updateProjectionMatrix();
    Object.assign(this.controls, {minDistance: dist * 0.5, maxDistance: dist * 2, maxPolarAngle: Math.PI * 0.49});
    this.controls.target.copy(this.target); this.controls.update();
    this.resize();
    this.renderer.render(this.scene, this.camera);
    this.dataset.ready = '';
    this.dispatchEvent(new Event('load'));
    this.wake();
  }

  resize() {
    if (!this.renderer) return;
    const w = this.clientWidth || 300, h = this.clientHeight || 300;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  /** Draw until nothing moves: auto-rotate (unless reduced motion or the visitor took over), damping, resizes. One loop at a time. */
  wake() {
    if (!this.renderer || !this.visible) return;
    this.quiet = 0;
    if (this.drawing) return;
    this.drawing = true;
    this.clock.getDelta(); // forget the idle time
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = () => {
      if (!this.visible) { this.drawing = false; return; }
      this.controls.autoRotate = this.hasAttribute('auto-rotate') && !still && !this.userMoved;
      const moved = this.controls.update(this.clock.getDelta());
      this.renderer.render(this.scene, this.camera);
      this.frames = (this.frames ?? 0) + 1;
      this.quiet = moved || this.controls.autoRotate ? 0 : this.quiet + 1;
      if (this.quiet < 20) this.raf = requestAnimationFrame(tick); else this.drawing = false;
    };
    this.raf = requestAnimationFrame(tick);
  }
}
if (!customElements.get('w3d-viewer')) customElements.define('w3d-viewer', W3DViewer);
