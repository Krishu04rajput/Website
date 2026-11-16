// Keep Three.js and its addons on the same CDN/module graph.
import * as THREE from 'https://esm.sh/three@0.170.0';
import { GLTFLoader } from 'https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import { animate } from 'https://esm.sh/animejs@4.0.2';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const year = $('#year');
if (year) year.textContent = new Date().getFullYear();

const toggle = $('.menu-toggle');
const nav = $('.desktop-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

const canvas = $('#machine-canvas');
const stage = $('#machine-stage');
const fallback = $('#machine-fallback');
const sequence = $('#machine-sequence');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer, scene, camera, root, resizeObserver;
const groupMap = Object.create(null);
let explodeProgress = 0, dragging = false, lastX = 0, lastY = 0, scrollFrame = 0;

const groupOrder = ['front', 'core', 'housing', 'gears', 'threads', 'rear', 'fasteners', 'internal'];
const groupStrength = { front: 1.05, core: .72, housing: .1, gears: .7, threads: 1.15, rear: 1.5, fasteners: .48, internal: .58 };
const groupDirection = { front: -1, core: -.45, housing: 0, gears: .5, threads: .95, rear: 1, fasteners: .3, internal: -.25 };

function setProgress(value) {
  explodeProgress = Math.max(0, Math.min(1, value));
  for (const name of groupOrder) {
    const group = groupMap[name];
    if (!group) continue;
    const k = explodeProgress, d = groupDirection[name] * groupStrength[name];
    group.position.x = group.userData.base.x + d * k * 2.4;
    group.position.y = group.userData.base.y + (name === 'fasteners' ? .45 : Math.sin(groupOrder.indexOf(name) * 1.4) * .16) * k;
    group.position.z = group.userData.base.z + (name === 'fasteners' ? .55 : Math.cos(groupOrder.indexOf(name) * 1.2) * .12) * k;
    group.rotation.y = group.userData.rotY + (name === 'gears' ? .12 : 0) * k;
  }
  if ($('#machine-progress-fill')) $('#machine-progress-fill').style.width = `${explodeProgress * 100}%`;
  const state = explodeProgress > .94 ? 'EXPLODED' : explodeProgress < .03 ? 'ASSEMBLED' : 'SEPARATING';
  if ($('#system-state')) $('#system-state').textContent = state;
  if ($('#sequence-readout')) $('#sequence-readout').textContent = `${state} — ${String(Math.round(explodeProgress * 100)).padStart(2, '0')}%`;
  if ($('#scroll-instruction')) $('#scroll-instruction').textContent = explodeProgress > .94 ? 'SCROLL UP TO REASSEMBLE ↑' : 'SCROLL TO DISASSEMBLE ↓';
  $('#assemble-btn')?.classList.toggle('active', explodeProgress < .03);
  $('#explode-btn')?.classList.toggle('active', explodeProgress > .97);
}

function animateProgress(target, duration = 900, easing = 'outExpo') {
  const state = { progress: explodeProgress };
  animate(state, {
    progress: target, duration: reduceMotion ? 0 : duration, ease: easing,
    onUpdate: () => setProgress(state.progress)
  });
}

function updateFromScroll() {
  scrollFrame = 0;
  if (!sequence) return;
  const rect = sequence.getBoundingClientRect();
  const distance = sequence.offsetHeight - window.innerHeight;
  setProgress(distance > 0 ? Math.max(0, Math.min(1, -rect.top / distance)) : 0);
}
function requestScrollUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateFromScroll);
}

async function initializeModel(gltf) {
  const model = gltf.scene;
  root.add(model);
  const response = await fetch(new URL('./assets/models/machine-parts.json', document.baseURI));
  if (!response.ok) throw new Error(`Metadata request failed (${response.status})`);
  const metadata = await response.json();
  if (!Array.isArray(metadata.parts)) throw new Error('Model metadata has no parts array');

  const partMap = new Map(metadata.parts.map(part => [part.name, part]));
  for (const name of groupOrder) {
    const group = new THREE.Group();
    group.name = `M01_${name}`;
    root.add(group);
    groupMap[name] = group;
    group.userData.base = new THREE.Vector3();
    group.userData.rotY = 0;
  }

  // Re-parent only after traversal; modifying children during traverse can skip meshes.
  model.updateMatrixWorld(true);
  const meshes = [];
  model.traverse(object => { if (object.isMesh) meshes.push(object); });
  let assigned = 0;
  for (const mesh of meshes) {
    const part = partMap.get(mesh.name);
    const destination = part && groupMap[part.group];
    if (destination) { destination.attach(mesh); assigned++; }
  }
  root.remove(model);
  if (!assigned) throw new Error('No model meshes matched the part metadata');

  root.scale.setScalar(.9);
  root.rotation.set(-.12, -.28, 0);
  root.updateMatrixWorld(true);
  // Convert the world-space bounds center to root-local coordinates.
  const bounds = new THREE.Box3().setFromObject(root);
  const center = root.worldToLocal(bounds.getCenter(new THREE.Vector3()));
  for (const group of Object.values(groupMap)) {
    group.position.sub(center);
    group.userData.base.copy(group.position);
    group.userData.rotY = group.rotation.y;
  }
  root.updateMatrixWorld(true);
  const centeredBounds = new THREE.Box3().setFromObject(root);
  const sphere = centeredBounds.getBoundingSphere(new THREE.Sphere());
  camera.near = Math.max(.01, sphere.radius / 100);
  camera.far = Math.max(100, sphere.radius * 20);
  camera.position.set(0, sphere.radius * .12, Math.max(8, sphere.radius * 3.1));
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  setProgress(0);
  if (fallback) fallback.hidden = true;
  const fit = () => {
    const width = Math.max(1, stage.clientWidth), height = Math.max(1, stage.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = window.innerWidth < 800 ? 12.8 : 10.8;
    camera.updateProjectionMatrix();
  };
  resizeObserver = new ResizeObserver(fit);
  resizeObserver.observe(stage);
  fit();

  const clock = new THREE.Clock();
  const render = () => {
    requestAnimationFrame(render);
    const elapsed = clock.getElapsedTime();
    if (!reduceMotion && !dragging) {
      root.rotation.y = -.28 + Math.sin(elapsed * .18) * .045;
      if (groupMap.gears) groupMap.gears.rotation.x = Math.sin(elapsed * .6) * .018;
    }
    renderer.render(scene, camera);
  };
  render();

  $('#assemble-btn')?.addEventListener('click', () => animateProgress(0, 850, 'outExpo'));
  $('#explode-btn')?.addEventListener('click', () => animateProgress(1, 1050, 'inOutCubic'));
  $('#reset-view-btn')?.addEventListener('click', () => {
    root.rotation.set(-.12, -.28, 0);
    animateProgress(0, 700, 'outExpo');
  });

  canvas.addEventListener('pointerdown', event => {
    dragging = true; lastX = event.clientX; lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging) return;
    root.rotation.y += (event.clientX - lastX) * .006;
    root.rotation.x += (event.clientY - lastY) * .004;
    lastX = event.clientX; lastY = event.clientY;
  });
  const stopDragging = () => { dragging = false; };
  canvas.addEventListener('pointerup', stopDragging);
  canvas.addEventListener('pointercancel', stopDragging);
  canvas.addEventListener('lostpointercapture', stopDragging);

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });
  requestScrollUpdate();
}

if (canvas && stage) {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    camera.position.set(0, .55, 10.8);
    scene.add(new THREE.HemisphereLight(0xe8dfd1, 0x17120e, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffe2c5, 3.4);
    keyLight.position.set(3, 5, 7); scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xd96b32, 55, 18);
    rimLight.position.set(-3, 1, 2); scene.add(rimLight);
    const fillLight = new THREE.PointLight(0x9aa7b5, 24, 15);
    fillLight.position.set(4, -2, -3); scene.add(fillLight);
    root = new THREE.Group(); scene.add(root);

    const loader = new GLTFLoader();
    loader.load(
      new URL('./assets/models/outframe-m01.glb', document.baseURI).href,
      gltf => initializeModel(gltf).catch(error => {
        console.error('[OUTFRAME] M01 initialization failed:', error);
        if (fallback) fallback.textContent = 'M01 MODEL COULD NOT INITIALIZE — CHECK MODEL ASSETS';
      }),
      event => {
        if (fallback) {
          const percent = event.total ? ` ${Math.round(event.loaded / event.total * 100)}%` : '';
          fallback.textContent = `M01 MECHANICAL ASSEMBLY / LOADING${percent}…`;
        }
      },
      error => {
        console.error('[OUTFRAME] M01 model download failed:', error);
        if (fallback) fallback.textContent = 'M01 MODEL FAILED TO LOAD — VERIFY /assets/models/outframe-m01.glb IS DEPLOYED';
      }
    );
  } catch (error) {
    console.error('[OUTFRAME] 3D engine initialization failed:', error);
    if (fallback) fallback.textContent = '3D VIEW UNAVAILABLE — CHECK WEBGL / CDN ACCESS';
  }
}

if (!reduceMotion) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animate(entry.target, { opacity: [0, 1], translateY: [24, 0], duration: 760, ease: 'outExpo' });
      observer.unobserve(entry.target);
    });
  }, { threshold: .12 });
  $$('.manifesto-grid, .section-heading, .capability, .work-card, .process-steps article, .contact-main')
    .forEach(element => observer.observe(element));
  $$('.work-card').forEach(card => {
    const artwork = $('.work-art', card);
    if (!artwork) return;
    card.addEventListener('mouseenter', () => animate(artwork, { scale: 1.025, duration: 420, ease: 'outExpo' }));
    card.addEventListener('mouseleave', () => animate(artwork, { scale: 1, duration: 420, ease: 'outExpo' }));
  });
}
