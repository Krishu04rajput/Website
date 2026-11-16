import { animate, createTimeline, onScroll, stagger } from 'https://cdn.jsdelivr.net/npm/animejs@4.0.2/+esm';

const $ = (s) => document.querySelector(s);
const machine = $('.machine');
const front = $('.front-ring');
const rear = $('.rear-module');
const iris = $('.iris-module');
const core = $('.core-module');
const brackets = $('.side-brackets');
const blueprint = $('.blueprint-lines');
const progress = $('.machine-progress span');

$('#year').textContent = new Date().getFullYear();

// Mobile navigation
const toggle = $('.menu-toggle');
const nav = $('.desktop-nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}));

// Ambient motion: restrained, continuous mechanical life.
animate(front, { rotate: '+=360deg', duration: 42000, ease: 'linear', loop: true });
animate(rear, { translateY: [-2, 2], duration: 5200, alternate: true, loop: true, ease: 'inOutSine' });
animate(iris, { rotate: [0, 5, 0], duration: 7600, alternate: true, loop: true, ease: 'inOutSine' });
animate(core, { scale: [1, 1.018, 1], duration: 3400, alternate: true, loop: true, ease: 'inOutSine' });
animate('.status-dot', { opacity: [.45, 1], duration: 1500, alternate: true, loop: true, ease: 'inOutSine' });

// Scroll-controlled exploded view. Anime.js timeline progress follows the hero's scroll range.
const explode = createTimeline({ autoplay: false, defaults: { ease: 'outCubic' } });
explode
  .add(front, { translateX: 125, translateY: -24, rotate: '+=24deg' }, 0)
  .add(iris, { translateX: 42, translateY: -8, scale: 1.12 }, 0)
  .add(core, { scale: 1.16, translateZ: 30 }, 0)
  .add(rear, { translateX: -105, translateY: 12 }, 0)
  .add(brackets, { translateY: 55, opacity: .45 }, 0)
  .add(blueprint, { opacity: [0, .8] }, 0.18)
  .add('.label-one', { translateX: 35, opacity: [.0, 1] }, 0.12)
  .add('.label-two', { translateX: 45, opacity: [.0, 1] }, 0.2)
  .add('.label-three', { translateX: -35, opacity: [.0, 1] }, 0.28);

onScroll({
  target: '#hero',
  enter: 'top top',
  leave: 'bottom top',
  sync: .8,
  onUpdate: self => {
    const p = self.progress;
    explode.seek(explode.duration * p);
    progress.style.width = `${Math.round(p * 100)}%`;
    const hud = $('.hud-right span:last-child');
    if (hud) hud.textContent = p > .72 ? 'BLUEPRINT MODE ACTIVE' : p > .18 ? 'ASSEMBLY SEQUENCE' : 'SCROLL TO DISASSEMBLE ↓';
  }
});

// Reveal content as sections enter view.
const revealTargets = document.querySelectorAll('.manifesto-grid, .section-heading, .capability, .work-card, .process-steps article, .contact-main');
revealTargets.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  onScroll({
    target: el,
    enter: 'bottom 92%',
    leave: 'top 15%',
    onEnter: () => animate(el, { opacity: 1, translateY: 0, duration: 850, ease: 'outExpo' }),
    onEnterBack: () => animate(el, { opacity: 1, translateY: 0, duration: 650, ease: 'outExpo' })
  });
});

// Fine hover response on project visuals.
document.querySelectorAll('.work-card').forEach(card => {
  card.addEventListener('mouseenter', () => animate(card.querySelector('.work-art'), { scale: 1.025, duration: 500, ease: 'outExpo' }));
  card.addEventListener('mouseleave', () => animate(card.querySelector('.work-art'), { scale: 1, duration: 500, ease: 'outExpo' }));
});
