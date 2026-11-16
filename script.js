
import * as THREE from 'three';
import {
  animate,
  createTimeline,
  onScroll,
  stagger
} from 'https://cdn.jsdelivr.net/npm/animejs@4.0.2/+esm';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

$('#year').textContent = new Date().getFullYear();

// NAVIGATION
const toggle = $('.menu-toggle');
const nav = $('.desktop-nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

// THREE.JS OF-01 CREATIVE ENGINE
const canvas = $('#machine-canvas');
const stage = $('.machine-stage');
const fallback = $('#machine-fallback');

let renderer, scene, camera, root, resizeObserver;

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && stage) {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 1.0, 12.8);

    scene.add(new THREE.HemisphereLight(0xe8dfd1, 0x17120e, 2.0));

    const key = new THREE.DirectionalLight(0xffe2c5, 3.3);
    key.position.set(3, 5, 7);
    scene.add(key);

    const rim = new THREE.PointLight(0xd96b32, 65, 18);
    rim.position.set(-3, 1, 1);
    scene.add(rim);

    const warm = new THREE.PointLight(0xff8a42, 48, 12);
    warm.position.set(2, -1, 2);
    scene.add(warm);

    root = new THREE.Group();
    scene.add(root);

    // MATERIALS
    const metal = new THREE.MeshStandardMaterial({
      color: 0x77736d,
      metalness: 0.88,
      roughness: 0.27
    });

    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x24221e,
      metalness: 0.9,
      roughness: 0.3
    });

    const edgeMetal = new THREE.MeshStandardMaterial({
      color: 0xb8aea0,
      metalness: 0.86,
      roughness: 0.22
    });

    const orange = new THREE.MeshStandardMaterial({
      color: 0xd96b32,
      emissive: 0x8b2d08,
      emissiveIntensity: 1.45,
      metalness: 0.55,
      roughness: 0.24
    });

    const black = new THREE.MeshStandardMaterial({
      color: 0x11100f,
      metalness: 0.78,
      roughness: 0.35
    });

    const parts = {};

    const makeGroup = name => {
      const g = new THREE.Group();
      g.name = name;
      root.add(g);
      parts[name] = g;
      return g;
    };

    const cylinder = (
      parent,
      radius,
      depth,
      material,
      x = 0,
      y = 0,
      z = 0,
      segments = 96
    ) => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, depth, segments),
        material
      );

      m.rotation.x = Math.PI / 2;
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };

    const torus = (
      parent,
      radius,
      tube,
      material,
      x = 0,
      y = 0,
      z = 0
    ) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tube, 14, 128),
        material
      );

      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };

    const bolt = (
      parent,
      radius,
      x,
      y,
      z,
      material = edgeMetal
    ) => {
      const b = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, 0.09, 12),
        material
      );

      b.position.set(x, y, z);
      b.rotation.x = Math.PI / 2;
      parent.add(b);

      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 1.2, 0.018, 0.018),
        black
      );

      slot.position.set(x, y, z + 0.052);
      parent.add(slot);
    };

    const ringBolts = (parent, radius, count = 12, z = 0) => {
      for (let i = 0; i < count; i++) {
        const a = i / count * Math.PI * 2;

        bolt(
          parent,
          0.055,
          Math.cos(a) * radius,
          Math.sin(a) * radius,
          z
        );
      }
    };

    // REAR HOUSING
    const chassis = makeGroup('chassis');

    cylinder(chassis, 2.0, 0.9, darkMetal, 0, 0, -1.25, 12);
    torus(chassis, 1.92, 0.09, edgeMetal, 0, 0, -0.78);
    torus(chassis, 1.72, 0.045, orange, 0, 0, -0.72);

    for (let i = 0; i < 18; i++) {
      const a = i / 18 * Math.PI * 2;

      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.78, 0.48),
        metal
      );

      fin.position.set(
        Math.cos(a) * 1.8,
        Math.sin(a) * 1.8,
        -1.2
      );

      fin.rotation.z = a;
      chassis.add(fin);
    }

    ringBolts(chassis, 1.88, 12, -0.68);

    // REAR SIDE CLAMPS
    const clamps = makeGroup('clamps');

    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;

      const c = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.85, 0.32),
        edgeMetal
      );

      c.position.set(
        Math.cos(a) * 2.05,
        Math.sin(a) * 2.05,
        -0.9
      );

      c.rotation.z = a;
      clamps.add(c);
    }

    // INTERNAL OPTICAL STACK
    const core = makeGroup('core');

    cylinder(core, 1.25, 0.55, black, 0, 0, -0.15);
    torus(core, 1.15, 0.1, orange, 0, 0, 0.16);
    torus(core, 0.92, 0.065, edgeMetal, 0, 0, 0.22);
    cylinder(core, 0.78, 0.25, darkMetal, 0, 0, 0.28);

    const glowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.56, 80),
      new THREE.MeshBasicMaterial({
        color: 0xff7a32,
        transparent: true,
        opacity: 0.19
      })
    );

    glowDisc.position.z = 0.43;
    core.add(glowDisc);

    const emitter = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 32, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffb47f,
        emissive: 0xff5a16,
        emissiveIntensity: 2.8,
        metalness: 0.25,
        roughness: 0.2
      })
    );

    emitter.position.z = 0.5;
    core.add(emitter);

    // IRIS BLADES
    const iris = makeGroup('iris');

    torus(iris, 0.92, 0.07, orange, 0, 0, 0.52);

    for (let i = 0; i < 8; i++) {
      const blade = new THREE.Mesh(
        new THREE.ConeGeometry(0.38, 0.88, 4),
        metal
      );

      blade.position.set(
        Math.cos(i * Math.PI / 4) * 0.45,
        Math.sin(i * Math.PI / 4) * 0.45,
        0.55
      );

      blade.rotation.z = i * Math.PI / 4;
      blade.rotation.x = Math.PI / 2;
      iris.add(blade);
    }

    // FRONT ROTATING RING
    const front = makeGroup('front');

    torus(front, 1.55, 0.16, metal, 0, 0, 1.0);
    torus(front, 1.72, 0.035, edgeMetal, 0, 0, 1.0);
    torus(front, 1.43, 0.035, orange, 0, 0, 1.0);

    ringBolts(front, 1.55, 16, 1.05);

    // OUTER RETAINING RING
    const retainer = makeGroup('retainer');

    torus(retainer, 2.05, 0.075, edgeMetal, 0, 0, 1.65);
    torus(retainer, 2.13, 0.018, orange, 0, 0, 1.65);

    ringBolts(retainer, 2.05, 16, 1.7);

    // RADIAL RAILS
    const rails = makeGroup('rails');

    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;

      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.7, 1.15),
        metal
      );

      rail.position.set(
        Math.cos(a) * 1.98,
        Math.sin(a) * 1.98,
        0.15
      );

      rail.rotation.z = a;
      rails.add(rail);
    }

    // DETACHED END CAPS
    const caps = makeGroup('caps');

    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.12, 12),
        orange
      );

      cap.rotation.x = Math.PI / 2;

      cap.position.set(
        Math.cos(a) * 2.25,
        Math.sin(a) * 2.25,
        1.95
      );

      caps.add(cap);
    }

    // BLUEPRINT ORBIT RINGS
    const blueprint = makeGroup('blueprint');

    const guideMat = new THREE.MeshBasicMaterial({
      color: 0xd96b32,
      transparent: true,
      opacity: 0.36
    });

    torus(blueprint, 2.55, 0.008, guideMat, 0, 0, -0.3);
    torus(blueprint, 2.35, 0.006, guideMat, 0, 0, 1.9);

    root.scale.setScalar(0.92);
    root.rotation.x = -0.12;
    root.rotation.y = -0.24;

    if (fallback) fallback.style.display = 'none';

    // RESPONSIVE CAMERA
    const fit = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;

      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = window.innerWidth < 800 ? 14.8 : 12.8;
      camera.updateProjectionMatrix();
    };

    resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(stage);
    fit();

    // IDLE MACHINE MOTION
    const clock = new THREE.Clock();

    const render = () => {
      requestAnimationFrame(render);

      const t = clock.getElapsedTime();

      if (!reduceMotion) {
        core.rotation.z = Math.sin(t * 0.55) * 0.025;
        iris.rotation.z = t * 0.18;
        front.rotation.z = -t * 0.07;
        blueprint.rotation.z = t * 0.025;
        emitter.scale.setScalar(1 + Math.sin(t * 2.1) * 0.055);
      }

      renderer.render(scene, camera);
    };

    render();

    // ANIME.JS SCROLL TIMELINE
    // Scrolling down separates the parts.
    // Scrolling up reverses the animation and reassembles them.

    const timeline = createTimeline({
      autoplay: onScroll({
        target: $('#of01-sequence'),
        enter: 'top top',
        leave: 'bottom bottom',
        sync: true,

        onUpdate: self => {
          const p = self.progress;

          $('#machine-progress-fill').style.width = `${p * 100}%`;

          $('#sequence-readout').textContent =
            `${p > 0.96 ? 'BLUEPRINT' : p < 0.03 ? 'ASSEMBLED' : 'DISASSEMBLY'} — ${String(Math.round(p * 100)).padStart(2, '0')}%`;

          $('#system-state').textContent =
            p > 0.9 ? 'BLUEPRINT' : p > 0.04 ? 'SEPARATING' : 'ASSEMBLED';

          $('#scroll-instruction').textContent =
            p > 0.94 ? 'SCROLL UP TO REASSEMBLE ↑' : 'SCROLL TO DISASSEMBLE ↓';
        }
      }),

      defaults: {
        duration: 1000,
        ease: 'inOutCubic'
      }
    });

    // THREE.JS TRANSFORM PROXIES
    const motion = {
      chassis: { x:0, y:0, z:0, rz:0 },
      clamps: { x:0, y:0, z:0, rz:0 },
      core: { x:0, y:0, z:0, rz:0 },
      iris: { x:0, y:0, z:0, rz:0 },
      front: { x:0, y:0, z:0, rz:0 },
      retainer: { x:0, y:0, z:0, rz:0 },
      rails: { x:0, y:0, z:0, rz:0 },
      caps: { x:0, y:0, z:0, rz:0 },
      blueprint: { opacity:0 }
    };

    const apply = () => {
      for (const [name, v] of Object.entries(motion)) {
        const g = parts[name];

        if (!g) continue;

        if ('x' in v) {
          g.position.set(v.x, v.y, v.z);
        }

        if ('rz' in v) {
          g.rotation.z = v.rz;
        }

        if (name === 'blueprint') {
          g.visible = v.opacity > 0.02;
        }
      }
    };

    const add = (name, to, at) => {
      timeline.add(
        motion[name],
        { ...to, onUpdate: apply },
        at
      );
    };

    // EXPLODED VIEW SEQUENCE
    add('caps', {
      x:2.2, y:1.2, z:1.2, rz:0.6
    }, 0);

    add('retainer', {
      x:2.6, y:0.25, z:1.0, rz:-0.28
    }, 150);

    add('front', {
      x:1.55, y:-0.15, z:0.55, rz:0.32
    }, 300);

    add('iris', {
      x:-1.35, y:0.4, z:0.2, rz:-0.48
    }, 450);

    add('core', {
      x:0, y:-1.15, z:0.2, rz:0.22
    }, 600);

    add('clamps', {
      x:-2.0, y:0.65, z:-0.2, rz:-0.25
    }, 760);

    add('rails', {
      x:0, y:1.65, z:0.5, rz:0.12
    }, 900);

    add('chassis', {
      x:-1.4, y:-0.35, z:-0.5, rz:-0.12
    }, 1040);

    add('blueprint', {
      opacity:1
    }, 1200);

    // POINTER PARALLAX
    if (matchMedia('(pointer:fine)').matches && !reduceMotion) {
      stage.addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect();

        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;

        animate(root.rotation, {
          x: -0.12 - ny * 0.12,
          y: -0.24 + nx * 0.18,
          duration: 450,
          ease: 'outQuad'
        });
      });

      stage.addEventListener('pointerleave', () => {
        animate(root.rotation, {
          x: -0.12,
          y: -0.24,
          duration: 700,
          ease: 'outExpo'
        });
      });
    }

  } catch (err) {
    console.error('[OUTFRAME] 3D engine unavailable:', err);

    if (fallback) {
      fallback.textContent =
        '3D VIEW UNAVAILABLE — THE STUDIO REMAINS FULLY ACCESSIBLE';
    }
  }
}

// SECTION REVEALS AND PROJECT HOVER
if (!reduceMotion) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      animate(entry.target, {
        opacity: [0, 1],
        translateY: [24, 0],
        duration: 760,
        ease: 'outExpo'
      });

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  $$('.manifesto-grid,.section-heading,.capability,.work-card,.process-steps article,.contact-main')
    .forEach(el => observer.observe(el));

  $$('.work-card').forEach(card => {
    const art = $('.work-art', card);

    card.addEventListener('mouseenter', () => {
      animate(art, {
        scale: 1.025,
        duration: 420,
        ease: 'outExpo'
      });
    });

    card.addEventListener('mouseleave', () => {
      animate(art, {
        scale: 1,
        duration: 420,
        ease: 'outExpo'
      });
    });
  });
}
