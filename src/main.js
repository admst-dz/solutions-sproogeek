import * as THREE from 'three';

const CONTACT_EMAIL = 'info@sproogeeek.com';
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clampPixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);

function init() {
  setupReveal();
  setupCursorLight();
  setupTilt();
  setupMenu();
  setupContactForm();
  createSpaceScene();
}

function setupReveal() {
  const elements = [...document.querySelectorAll('.reveal:not(.is-visible)')];
  const observer = new IntersectionObserver(showVisibleElement, { threshold: 0.18 });
  elements.forEach((element) => observer.observe(element));
  revealElementsInViewport(elements);
  window.addEventListener('load', () => revealElementsInViewport(elements), { once: true });
  window.addEventListener('scroll', () => revealElementsInViewport(elements), { passive: true });
  window.addEventListener('resize', () => revealElementsInViewport(elements), { passive: true });
}

function showVisibleElement(entries, observer) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}

function revealElementsInViewport(elements) {
  elements.forEach((element) => {
    if (element.classList.contains('is-visible')) return;
    const bounds = element.getBoundingClientRect();
    const isVisible = bounds.top < window.innerHeight * 0.92 && bounds.bottom > window.innerHeight * 0.08;
    if (isVisible) element.classList.add('is-visible');
  });
}

function setupCursorLight() {
  const light = document.getElementById('cursorLight');
  if (!light || REDUCED_MOTION) return;

  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;

  window.addEventListener('pointermove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });

  const animate = () => {
    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;
    light.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animate);
  };

  animate();
}

function setupTilt() {
  if (REDUCED_MOTION) return;

  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('pointermove', (event) => tiltCard(card, event));
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

function tiltCard(card, event) {
  const bounds = card.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;
  card.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 7}deg) translateY(-4px)`;
}

function setupMenu() {
  const button = document.getElementById('menuButton');
  const menu = document.getElementById('mobileMenu');
  if (!button || !menu) return;

  const closeMenu = () => setMenuState(button, menu, false);
  button.addEventListener('click', () => setMenuState(button, menu, !menu.classList.contains('is-open')));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
}

function setMenuState(button, menu, isOpen) {
  button.setAttribute('aria-expanded', String(isOpen));
  menu.setAttribute('aria-hidden', String(!isOpen));
  menu.classList.toggle('is-open', isOpen);
  document.body.classList.toggle('is-locked', isOpen);
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const message = buildMailBody(data);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Project request - dev Sproogeek')}&body=${message}`;
  });
}

function buildMailBody(data) {
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  const message = String(data.get('message') || '').trim();
  return encodeURIComponent(`Имя: ${name}\nEmail: ${email}\nТелефон: ${phone}\n\n${message}`);
}

function createSpaceScene() {
  const canvas = document.getElementById('spaceScene');
  if (!canvas || REDUCED_MOTION) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 160);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const galaxy = createGalaxy();

  scene.add(galaxy);
  camera.position.set(0, 0, 42);
  renderer.setPixelRatio(clampPixelRatio());
  resizeRenderer(renderer, camera, window.innerWidth, window.innerHeight);

  window.addEventListener('resize', () => resizeRenderer(renderer, camera, window.innerWidth, window.innerHeight));
  animateSpaceScene(renderer, scene, camera, galaxy);
}

function createGalaxy() {
  const geometry = new THREE.BufferGeometry();
  const count = window.innerWidth < 760 ? 720 : 1200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    writeParticle(positions, colors, index, count);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    transparent: true,
    opacity: 0.74,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Points(geometry, material);
}

function writeParticle(positions, colors, index, count) {
  const progress = index / count;
  const angle = progress * Math.PI * 18;
  const radius = 7 + Math.sin(progress * Math.PI * 6) * 5 + progress * 18;
  const offset = index * 3;

  positions[offset] = Math.cos(angle) * radius;
  positions[offset + 1] = (progress - 0.5) * 46;
  positions[offset + 2] = Math.sin(angle) * radius;

  colors[offset] = 0.25 + progress * 0.45;
  colors[offset + 1] = 0.72 + Math.sin(progress * Math.PI) * 0.25;
  colors[offset + 2] = 1 - progress * 0.35;
}

function animateSpaceScene(renderer, scene, camera, galaxy) {
  const render = () => {
    const scrollProgress = getScrollProgress();
    galaxy.rotation.y += 0.0018;
    galaxy.rotation.x = scrollProgress * 0.75;
    galaxy.position.y = (scrollProgress - 0.5) * 10;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  render();
}

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / maxScroll));
}

function resizeRenderer(renderer, camera, width, height) {
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

init();