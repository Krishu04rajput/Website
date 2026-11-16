import { animate, createTimeline, stagger } from 'https://cdn.jsdelivr.net/npm/animejs@4.0.2/+esm';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const hero = $('#hero');
const stage = $('.machine-stage');
const svg = $('.machine');
const year = $('#year');

if (year) year.textContent = new Date().getFullYear();

if (!hero || !stage || !svg) {
  console.warn('[OUTFRAME] OF-01 machine markup was not found; animation was not initialized.');
} else {
  // Give the existing OF-01 machine its own long, sticky scroll sequence.
  // The original page sections, links, API and assets remain untouched.
  const sequence = document.createElement('section');
  sequence.className = 'machine-sequence';
  sequence.id = 'of01-sequence';
  sequence.setAttribute('aria-label', 'OF-01 mechanical engine disassembly sequence');

  const sequenceHead = document.createElement('div');
  sequenceHead.className = 'sequence-heading mono';
  sequenceHead.innerHTML = '<span>OF—01 / MECHANICAL STUDY</span><span>SCROLL TO DECONSTRUCT</span>';
  sequence.append(sequenceHead);
  hero.insertAdjacentElement('afterend', sequence);
  sequence.append(stage);

  const sequenceFoot = document.createElement('div');
  sequenceFoot.className = 'sequence-foot mono';
  sequenceFoot.innerHTML = '<span>OPTICAL COMPUTATION UNIT</span><span class="sequence-readout">ASSEMBLED / 00%</span>';
  sequence.append(sequenceFoot);

  // Split additional mechanical details into independently animated SVG groups.
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  };
  const group = (name) => {
    const g = make('g', { class: `of01-part ${name}` });
    svg.append(g);
    return g;
  };
  const circle = (g, cx, cy, r, attrs = {}) => g.append(make('circle', { cx, cy, r, ...attrs }));
  const path = (g, d, attrs = {}) => g.append(make('path', { d, ...attrs }));

  const outerLock = group('outer-lock');
  circle(outerLock, 450, 350, 244, { fill: 'none', stroke: '#c7bdae', 'stroke-width': 5, 'stroke-dasharray': '18 7 3 7' });
  circle(outerLock, 450, 350, 258, { fill: 'none', stroke: '#d96b32', 'stroke-width': 2, 'stroke-dasharray': '2 11' });
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12;
    const x = 450 + Math.cos(a) * 244;
    const y = 350 + Math.sin(a) * 244;
    circle(outerLock, x, y, 5.5, { fill: '#d96b32', stroke: '#171614', 'stroke-width': 2 });
  }

  const lensCartridge = group('lens-cartridge');
  circle(lensCartridge, 450, 350, 112, { fill: 'none', stroke: '#ded4c5', 'stroke-width': 7 });
  circle(lensCartridge, 450, 350, 102, { fill: 'none', stroke: '#d96b32', 'stroke-width': 3 });
  circle(lensCartridge, 450, 350, 88, { fill: 'none', stroke: '#766e63', 'stroke-width': 2, 'stroke-dasharray': '4 5' });
  circle(lensCartridge, 450, 350, 73, { fill: 'none', stroke: '#d4c8b8', 'stroke-width': 2 });
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    const x = 450 + Math.cos(a) * 108;
    const y = 350 + Math.sin(a) * 108;
    circle(lensCartridge, x, y, 4, { fill: '#d96b32' });
  }

  const frontPlate = group('front-plate');
  path(frontPlate, 'M450 105 L477 126 L474 153 L426 153 L423 126 Z', { fill: '#777168', stroke: '#e1d6c6', 'stroke-width': 2 });
  path(frontPlate, 'M695 350 L674 377 L647 374 L647 326 L674 323 Z', { fill: '#777168', stroke: '#e1d6c6', 'stroke-width': 2 });
  path(frontPlate, 'M450 595 L423 574 L426 547 L474 547 L477 574 Z', { fill: '#777168', stroke: '#e1d6c6', 'stroke-width': 2 });
  path(frontPlate, 'M205 350 L226 323 L253 326 L253 374 L226 377 Z', { fill: '#777168', stroke: '#e1d6c6', 'stroke-width': 2 });

  const fasteners = group('fastener-set');
  [[450,110],[690,350],[450,590],[210,350],[280,180],[620,180],[620,520],[280,520]].forEach(([x,y]) => {
    circle(fasteners, x, y, 9, { fill: '#d96b32', stroke: '#171614', 'stroke-width': 3 });
    path(fasteners, `M${x-4} ${y}h8`, { stroke: '#211d19', 'stroke-width': 2 });
  });

  const railLeft = group('rail-left');
  path(railLeft, 'M250 250 L165 210 L145 230 L220 300 Z M250 450 L165 490 L145 470 L220 400 Z', {
    fill: '#4c4942', stroke: '#c4b9a9', 'stroke-width': 3
  });
  const railRight = group('rail-right');
  path(railRight, 'M650 250 L735 210 L755 230 L680 300 Z M650 450 L735 490 L755 470 L680 400 Z', {
    fill: '#4c4942', stroke: '#c4b9a9', 'stroke-width': 3
  });

  // A technical measurement overlay is separate from the original blueprint strokes.
  const dimensions = group('dimension-overlay');
  path(dimensions, 'M140 80V620 M130 80H150 M130 620H150 M760 80V620 M750 80H770 M750 620H770', {
    fill: 'none', stroke: '#d96b32', 'stroke-width': 1.4, 'stroke-dasharray': '4 5', opacity: '.9'
  });
  path(dimensions, 'M140 350H760 M450 55V645', {
    fill: 'none', stroke: '#d96b32', 'stroke-width': 1, 'stroke-dasharray': '3 9', opacity: '.55'
  });

  // SVG transform origins must be local to each component, not the full SVG canvas.
  $$('.machine > g, .machine .of01-part').forEach((el) => {
    el.style.transformBox = 'fill-box';
    el.style.transformOrigin = 'center';
    el.style.transformStyle = 'preserve-3d';
    el.style.willChange = 'transform, opacity';
  });

  const parts = {
    cover: $('.front-ring'),
    lock: outerLock,
    plate: frontPlate,
    fasteners,
    lens: lensCartridge,
    iris: $('.iris-module'),
    core: $('.core-module'),
    rear: $('.rear-module'),
    brackets: $('.side-brackets'),
    railsL: railLeft,
    railsR: railRight,
    ribs: $('.rear-ribs'),
    blueprint: $('.blueprint-lines'),
    dimensions
  };

  // Continuous idle motion is applied to inner components; scroll motion is applied
  // to their parent assemblies so the two animation systems do not fight.
  animate(parts.lock, { rotate: '+=360deg', duration: 62000, ease: 'linear', loop: true });
  animate(parts.lens, { rotate: '-=360deg', duration: 44000, ease: 'linear', loop: true });
  animate('.iris-blades', { rotate: [0, 3, 0], duration: 5400, ease: 'inOutSine', alternate: true, loop: true });
  animate('.core-module circle:nth-of-type(6)', { scale: [1, 1.2, 1], duration: 2800, ease: 'inOutSine', alternate: true, loop: true });
  animate('.status-dot', { opacity: [.35, 1], scale: [.85, 1.2], duration: 1400, ease: 'inOutSine', alternate: true, loop: true });

  const timeline = createTimeline({
    autoplay: false,
    defaults: { duration: 850, ease: 'inOutCubic' }
  });

  // Multi-axis, staged separation: lock hardware -> optical stack -> core -> rear chassis.
  timeline
    .add(parts.fasteners, { translateY: -210, translateX: 15, rotate: 48, scale: 1.35, opacity: .95 }, 0)
    .add(parts.plate, { translateY: -185, translateX: 0, rotate: -28 }, 80)
    .add(parts.cover, { translateY: -115, translateX: 165, rotate: 42, scale: 1.08 }, 160)
    .add(parts.lock, { translateY: -205, translateX: -145, rotate: -62, scale: 1.12 }, 220)
    .add(parts.lens, { translateY: -35, translateX: 230, rotate: 76, scale: 1.12 }, 300)
    .add(parts.iris, { translateY: -115, translateX: -190, rotate: -50, scale: 1.12 }, 390)
    .add(parts.core, { translateY: 150, translateX: 0, scale: 1.32 }, 490)
    .add(parts.brackets, { translateY: 115, translateX: 0, rotate: 14, opacity: .65 }, 560)
    .add(parts.railsL, { translateX: -170, translateY: 35, rotate: -28 }, 620)
    .add(parts.railsR, { translateX: 170, translateY: 35, rotate: 28 }, 620)
    .add(parts.ribs, { translateX: -100, translateY: 175, rotate: -16, opacity: .6 }, 690)
    .add(parts.rear, { translateX: -235, translateY: 100, rotate: -24, scale: .94 }, 760)
    .add(parts.blueprint, { opacity: [0, .9] }, 780)
    .add(parts.dimensions, { opacity: [0, 1] }, 930)
    .add('.label-one', { opacity: [0, 1], translateX: [30, 0] }, 900)
    .add('.label-two', { opacity: [0, 1], translateX: [-30, 0] }, 1020)
    .add('.label-three', { opacity: [0, 1], translateY: [24, 0] }, 1140);

  const total = timeline.duration;
  const readout = $('.sequence-readout');
  const progress = $('.machine-progress span');
  let rafPending = false;

  const clamp = (v) => Math.max(0, Math.min(1, v));
  const renderScrollState = () => {
    const rect = sequence.getBoundingClientRect();
    const scrollable = Math.max(1, sequence.offsetHeight - window.innerHeight);
    const p = clamp(-rect.top / scrollable);

    timeline.seek(total * p);
    if (progress) progress.style.width = `${p * 100}%`;
    if (readout) readout.textContent = p < .04
      ? 'ASSEMBLED / 00%'
      : p > .94 ? 'BLUEPRINT / 100%' : `DISASSEMBLY / ${String(Math.round(p * 100)).padStart(2, '0')}%`;

    const hud = $('.hud-right span:last-child');
    if (hud) hud.textContent = p > .82 ? 'BLUEPRINT MODE ACTIVE' : p > .08 ? 'ASSEMBLY SEQUENCE' : 'SCROLL TO DISASSEMBLE ↓';
    rafPending = false;
  };
  const requestRender = () => {
    if (!rafPending) {
      requestAnimationFrame(renderScrollState);
      rafPending = true;
    }
  };
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender);
  renderScrollState();

  // Cursor parallax adds a restrained camera-like response without hijacking scroll.
  if (matchMedia('(pointer:fine)').matches) {
    stage.addEventListener('pointermove', (event) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      animate(svg, { rotateY: x * 5, rotateX: -y * 4, duration: 420, ease: 'outQuad' });
    });
    stage.addEventListener('pointerleave', () => {
      animate(svg, { rotateX: 0, rotateY: 0, duration: 700, ease: 'outExpo' });
    });
  }

  // Reveal the rest of the original website while preserving its content and layout.
  const revealTargets = $$('.manifesto-grid, .section-heading, .capability, .work-card, .process-steps article, .contact-main');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target, { opacity: [0, 1], translateY: [24, 0], duration: 760, ease: 'outExpo' });
      observer.unobserve(entry.target);
    });
  }, { threshold: .12 });
  revealTargets.forEach((el) => {
    el.style.opacity = '0';
    observer.observe(el);
  });

  $$('.work-card').forEach((card) => {
    const art = $('.work-art', card);
    if (!art) return;
    card.addEventListener('mouseenter', () => animate(art, { scale: 1.025, duration: 420, ease: 'outExpo' }));
    card.addEventListener('mouseleave', () => animate(art, { scale: 1, duration: 420, ease: 'outExpo' }));
  });

  // Existing mobile menu remains as authored in the repository.
  const toggle = $('.menu-toggle');
  const nav = $('.desktop-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('a', nav).forEach((link) => link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }
}
