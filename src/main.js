import * as THREE from 'three';

const CONTACT_EMAIL = 'info@sproogeeek.com';
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOADER_DURATION = 8000;
const LOADER_WORDS = ['проектируем', 'building', 'тестируем', 'configuring'];

const EN = {
  nav_services: 'Services',
  nav_case: 'Case',
  nav_architecture: 'Architecture',
  nav_team: 'Team',
  nav_process: 'Process',
  nav_contact: 'Contact',
  nav_cta: 'Discuss project',
  hero_kicker: 'Digital product studio / web, 3D, backend',
  hero_title: 'We build websites, products and 3D funnels for sales.',
  hero_lead: 'SproogeekDev designs websites and visual configurators where the buyer sees the product before ordering, and the team gets a clear operating system.',
  hero_cta1: 'View case',
  hero_cta2: 'What we do',
  hero_stack_desc: 'From a stunning storefront to microservices for rendering, PDF tech-cards, and orders.',
  metric_3d: 'in browser',
  metric_ssr: 'renders',
  metric_crm: 'roles',
  services_title: 'We cover the entire path from idea to production.',
  services_lead: 'We take on product structure, interfaces, API, 3D visualization and launch, keeping the architecture clear for ongoing support.',
  s1_title: 'Websites & product landings',
  s1_desc: 'Fast storefronts with strong presentation, responsiveness, SEO foundation and animations without overload.',
  s2_title: '3D Configurators',
  s2_desc: 'Three.js, R3F, model loading, branding, colors, materials and order preparation.',
  s3_title: 'Backend & integrations',
  s3_desc: 'FastAPI, PostgreSQL, roles, payment and CRM integrations, events and background tasks.',
  s4_title: 'DevOps & support',
  s4_desc: 'Docker, reverse proxy, CI/CD, monitoring and a clean release process.',
  del1_title: 'What to clarify before starting',
  del1_desc: 'Page goal, audience, offer, 3-5 key advantages, competitor examples and desired user action.',
  del2_title: 'What to replace with your data',
  del2_desc: 'Service names, real cases, result numbers, tech stack, contacts, project links and form text.',
  del3_title: 'What you get',
  del3_desc: 'Landing page, responsiveness, 3D/animations, basic SEO markup, local setup and editable structure.',
  case_title: 'Sproogeek 3D Configurator',
  case_lead: 'B2B2C sales site for promotional and printing products: planners, sketchbooks, thermoses and powerbanks with customization right in the browser.',
  case_task_title: 'Challenge',
  case_task_desc: 'Eliminate lengthy approvals between client, dealer and production: the client assembles the product, sees a 3D preview and submits the order without manual correspondence.',
  case_solution_title: 'Solution',
  case_solution_desc: 'The project connects a client configurator, user roles, order API, headless PNG rendering and tech PDF generation for the printing house.',
  case_result_title: 'Result',
  case_result_desc: 'MVP with real product scenarios: parameter selection, logos, renders, client dashboard, dealer panel and a foundation for scaling.',
  arch_title: 'How a scalable project is structured.',
  arch_lead: 'Below is the structure for a real case or future product. Replace service names, stack and data flow with yours — the section is ready as a technical showcase.',
  arch_n1_title: 'Frontend',
  arch_n1_desc: 'Storefront, configurator, dashboard, logo upload, parameter selection and order placement.',
  arch_n2_title: '3D Engine',
  arch_n2_desc: 'Loading .glb models, materials, colors, branding and visual result confirmation.',
  arch_n3_title: 'Backend',
  arch_n3_desc: 'Users, roles, products, orders, prices, statuses, input validation and security.',
  arch_n4_title: 'Render & PDF',
  arch_n4_desc: 'Background services create PNG renders of 3D scenes and tech PDF documents for production.',
  arch_n5_title: 'Data Flow',
  arch_n5_desc: 'Order events pass through API, task queue, logging, file storage and notifications.',
  arch_n6_title: 'Infrastructure',
  arch_n6_desc: 'Containerization, reverse proxy, SSL, CI/CD and observability for smooth production launch.',
  flow_1: 'Client',
  flow_2: '3D Config',
  flow_3: 'Order API',
  flow_4: 'Render',
  flow_5: 'PDF Tech-card',
  flow_6: 'Production',
  team_title: 'The team that builds the product.',
  team_lead: 'Each member is a node in our pipeline. Together we design, develop and ship products.',
  team_vlad: 'Designer',
  team_nikita: 'Marketing / HR',
  team_ivan: 'SMM Specialist',
  process_title: 'We work in short engineering iterations.',
  p1_title: 'Goal analysis',
  p1_desc: 'We establish audience, funnel, constraints, data and readiness criteria.',
  p2_title: 'Architecture',
  p2_desc: 'We split UI, business logic, API and background tasks so the project is easy to test.',
  p3_title: 'Design & code',
  p3_desc: 'We build interface, interactivity and backend with regular demos instead of vague promises.',
  p4_title: 'Launch',
  p4_desc: 'We check responsiveness, performance, errors, deployment and post-release support.',
  contact_title: "Let's build a product ready for the market.",
  contact_lead: 'Describe the task, product format and desired timeline. We will respond with a clear next step.',
  form_name: 'Name',
  form_email: 'Email',
  form_phone: 'Phone',
  form_message: 'About the project',
  form_submit: 'Send',
  contact_brief: 'Goal, timeline, budget, 2-3 reference links.',
  footer_desc: 'Web, 3D, backend and launch-ready product systems.',
};

const clampPixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);

let currentLang = 'ru';
const originalTexts = new Map();

function init() {
  setupLoader();
  setupReveal();
  setupCursorLight();
  setupTilt();
  setupMenu();
  setupContactForm();
  setupLanguageToggle();
  createSpaceScene();
}

function setupLoader() {
  const loader = document.getElementById('loader');
  const textEl = document.getElementById('loaderText');
  const progressEl = document.getElementById('loaderProgress');
  if (!loader) return;

  const startTime = Date.now();
  let wordIndex = 0;
  const wordInterval = LOADER_DURATION / LOADER_WORDS.length;

  const wordTimer = setInterval(() => {
    wordIndex = (wordIndex + 1) % LOADER_WORDS.length;
    if (textEl) {
      textEl.style.opacity = '0';
      setTimeout(() => {
        textEl.textContent = LOADER_WORDS[wordIndex];
        textEl.style.opacity = '1';
      }, 200);
    }
  }, wordInterval);

  const progressTimer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(100, (elapsed / LOADER_DURATION) * 100);
    if (progressEl) progressEl.style.width = progress + '%';
  }, 50);

  setTimeout(() => {
    clearInterval(wordTimer);
    clearInterval(progressTimer);
    if (progressEl) progressEl.style.width = '100%';
    loader.classList.add('is-hidden');
    document.body.classList.remove('is-loading');
    setTimeout(() => loader.remove(), 700);
  }, LOADER_DURATION);
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
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Project request - SproogeekDev')}&body=${message}`;
  });
}

function buildMailBody(data) {
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  const message = String(data.get('message') || '').trim();
  const nameLabel = currentLang === 'en' ? 'Name' : 'Имя';
  const phoneLabel = currentLang === 'en' ? 'Phone' : 'Телефон';
  return encodeURIComponent(`${nameLabel}: ${name}\nEmail: ${email}\n${phoneLabel}: ${phone}\n\n${message}`);
}

function setupLanguageToggle() {
  const toggle = document.getElementById('langToggle');
  if (!toggle) return;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    originalTexts.set(el, el.textContent);
  });

  toggle.addEventListener('click', () => {
    if (currentLang === 'ru') {
      switchToEnglish();
      toggle.textContent = 'RU';
      toggle.setAttribute('aria-label', 'Переключить на русский');
      document.documentElement.lang = 'en';
    } else {
      switchToRussian();
      toggle.textContent = 'EN';
      toggle.setAttribute('aria-label', 'Switch to English');
      document.documentElement.lang = 'ru';
    }
  });
}

function switchToEnglish() {
  currentLang = 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (EN[key]) el.textContent = EN[key];
  });
}

function switchToRussian() {
  currentLang = 'ru';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const stored = originalTexts.get(el);
    if (stored !== undefined) el.textContent = stored;
  });
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