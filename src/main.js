import * as THREE from 'three';

// Заявки уходят на почту info@sproogeek.com через собственный Python-бэкенд
// в папке /backend (Yandex SMTP). Пароль живёт только на сервере — в браузер
// он не попадает, иначе им мог бы воспользоваться кто угодно.
// Почтовый клиент не открываем никогда: форма всегда отправляет через бэкенд.
const LEAD_ENDPOINT = '/api/lead';
const INSTAGRAM_NEWS_ENDPOINT = '/api/news/instagram';
const FORM_STATUS_TEXT = {
  sending: { ru: 'Отправляем…', en: 'Sending…' },
  success: { ru: 'Сообщение отправлено. Мы свяжемся с вами.', en: 'Message sent. We will get back to you.' },
  error: { ru: 'Не удалось отправить. Попробуйте ещё раз или напишите на почту.', en: 'Could not send. Try again or email us.' },
  rateLimited: { ru: 'Слишком много заявок. Попробуйте позже.', en: 'Too many requests. Please try again later.' },
};
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOADER_DURATION = 4000;
const LOADER_WORDS = ['проектируем', 'building', 'тестируем', 'configuring'];
const LOADER_CODE_SNIPPETS = [
  'def build_funnel(product):\n    scene = Scene(product)\n    scene.render(quality="4k")\n    return ship(scene)',
  'func Deploy(p *Project) error {\n    if err := Build(p); err != nil {\n        return err\n    }\n    return Ship(p)\n}',
  'async def configure(order):\n    model = await load_glb(order.sku)\n    model.apply(order.options)\n    return model.preview()',
  'type Pipeline struct {\n    Design  Stage\n    Build   Stage\n    Deploy  Stage\n}\n\npipe := Pipeline{}.Run()',
  'class Renderer:\n    def __init__(self, gpu=True):\n        self.gpu = gpu\n\n    def frame(self, scene):\n        return scene.rasterize()',
];

const EN = {
  nav_services: 'Services',
  nav_case: 'Case',
  nav_architecture: 'Architecture',
  nav_team: 'Team',
  nav_process: 'Process',
  nav_news: 'News',
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
  team_vlad_name: 'Vladislav',
  team_vlad: 'Designer',
  team_andrey_name: 'Andrey',
  team_andrey: 'CEO',
  team_nikita_name: 'Nikita',
  team_nikita: 'Marketing / HR',
  team_pavel_name: 'Pavel',
  team_pavel: 'Backend developer',
  team_prohor_name: 'Prokhor',
  team_prohor: 'Frontend developer',
  team_alexandr_name: 'Alexandr',
  team_alexandr: 'Creative manager',
  team_nastachka_name: 'Nastachka',
  team_nastachka: 'SMM / Analytics',
  team_ivan_name: 'Ivan',
  team_ivan: 'SMM Specialist',
  bio_label_exp: 'Experience',
  bio_label_stack: 'Stack',
  bio_label_focus: 'Focus',
  tech_target: 'Targeting',
  tech_analytics: 'Analytics',
  bio_vlad_desc: "Owns the product's visual style — from concept to final layouts.",
  bio_vlad_exp: '3+ years in UI/UX',
  bio_vlad_focus: 'Design system and user interface',
  bio_andrey_desc: "Sets the company's growth strategy and leads the team toward shared goals.",
  bio_andrey_exp: '5+ years in management',
  bio_andrey_focus: 'Strategy, product, partnerships',
  bio_nikita_desc: 'Builds the company brand and assembles the dream team.',
  bio_nikita_exp: '3+ years in marketing and HR',
  bio_nikita_focus: 'Promotion and recruiting',
  bio_pavel_desc: "Designs and maintains the product's server side.",
  bio_pavel_exp: '3+ years in backend development',
  bio_pavel_focus: 'API architecture and performance',
  bio_prohor_desc: 'Turns design into a fast, user-friendly interface.',
  bio_prohor_exp: '3+ years in frontend development',
  bio_prohor_focus: 'UI components and responsiveness',
  bio_alexandr_desc: 'Owns creative direction and visual content for social media.',
  bio_alexandr_exp: '2 years in SMM',
  bio_alexandr_focus: 'Social media promotion',
  bio_nastachka_desc: 'Keeps deadlines and content performance on track.',
  bio_nastachka_exp: '1+ year',
  bio_nastachka_focus: 'Collecting and analysing social media data',
  bio_ivan_desc: "Runs the company's social media and builds audience communication.",
  bio_ivan_exp: '3+ years in SMM & Digital',
  bio_ivan_focus: 'Content strategy and engagement',
  process_title: 'We work in short engineering iterations.',
  p1_title: 'Goal analysis',
  p1_desc: 'We establish audience, funnel, constraints, data and readiness criteria.',
  p2_title: 'Architecture',
  p2_desc: 'We split UI, business logic, API and background tasks so the project is easy to test.',
  p3_title: 'Design & code',
  p3_desc: 'We build interface, interactivity and backend with regular demos instead of vague promises.',
  p4_title: 'Launch',
  p4_desc: 'We check responsiveness, performance, errors, deployment and post-release support.',
  news_title: 'News',
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
const PAGE_ROUTES = {
  '/': 'hero',
  '/services': 'services',
  '/case': 'case',
  '/architecture': 'architecture',
  '/team': 'team',
  '/process': 'process',
  '/news': 'news',
  '/contact': 'contact',
};
const PAGE_PATHS = Object.fromEntries(Object.entries(PAGE_ROUTES).map(([path, page]) => [page, path]));
const PAGE_TITLES = {
  hero: 'SproogeekDev - Digital Product Studio',
  services: 'Услуги - SproogeekDev',
  case: 'Кейс - SproogeekDev',
  architecture: 'Архитектура - SproogeekDev',
  team: 'Команда - SproogeekDev',
  process: 'Процесс - SproogeekDev',
  news: 'Новости - SproogeekDev',
  contact: 'Контакт - SproogeekDev',
};
const PAGE_SEO = {
  hero: {
    title: 'SproogeekDev - сайты, 3D-конфигураторы и backend',
    description: 'SproogeekDev проектирует сайты, продуктовые лендинги, 3D-конфигураторы, API и микросервисную инфраструктуру для продаж.',
  },
  services: {
    title: 'Услуги SproogeekDev - сайты, 3D и backend',
    description: 'Разрабатываем сайты, продуктовые лендинги, 3D-конфигураторы, backend, интеграции, DevOps и поддержку цифровых продуктов.',
  },
  case: {
    title: 'Кейс Sproogeek 3D Configurator - SproogeekDev',
    description: 'Кейс B2B2C 3D-конфигуратора для сувенирной и полиграфической продукции: браузерное превью, заказы, рендеры и PDF-техкарты.',
  },
  architecture: {
    title: 'Архитектура веб-продуктов - SproogeekDev',
    description: 'Показываем архитектуру масштабируемого продукта: frontend, 3D engine, backend, render-сервисы, PDF, data flow и инфраструктура.',
  },
  team: {
    title: 'Команда SproogeekDev',
    description: 'Команда SproogeekDev: дизайн, управление, маркетинг, frontend, backend, креатив, аналитика и SMM для запуска цифровых продуктов.',
  },
  process: {
    title: 'Процесс разработки - SproogeekDev',
    description: 'Работаем короткими инженерными итерациями: анализ цели, архитектура, дизайн и код, проверка, запуск и поддержка.',
  },
  news: {
    title: 'Новости SproogeekDev',
    description: 'Новости SproogeekDev: обновления студии, новые проекты, релизы и материалы о разработке сайтов, 3D-конфигураторов и backend.',
  },
  contact: {
    title: 'Контакты SproogeekDev',
    description: 'Свяжитесь с SproogeekDev, чтобы обсудить сайт, 3D-конфигуратор, backend-интеграции или запуск цифрового продукта.',
  },
};

function init() {
  setupLoader();
  setupLoaderCode();
  setupReveal();
  setupCursorLight();
  setupTilt();
  setupMenu();
  setupPageRouter();
  setupContactForm();
  setupInstagramNews();
  setupLanguageToggle();
  setupTeamCards();
  createSpaceScene();
}

function setupPageRouter() {
  const tabs = [...document.querySelectorAll('[data-page-tab]')];
  const sections = [...document.querySelectorAll('main > .section[id]')];
  if (!tabs.length || !sections.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', (event) => {
      const url = new URL(tab.href);
      const pageId = PAGE_ROUTES[normalizePath(url.pathname)];
      if (url.origin !== window.location.origin || !pageId) return;

      event.preventDefault();
      showPage(pageId, sections, tabs, { pushState: true });
    });
  });

  window.addEventListener('popstate', () => {
    showPage(getCurrentPageId(), sections, tabs);
  });

  const legacyHashPage = window.location.hash.slice(1);
  if (PAGE_PATHS[legacyHashPage]) {
    history.replaceState({ pageId: legacyHashPage }, '', PAGE_PATHS[legacyHashPage]);
  }

  showPage(getCurrentPageId(), sections, tabs, { replaceState: true });
}

function showPage(pageId, sections, tabs, options = {}) {
  const normalizedPageId = PAGE_PATHS[pageId] ? pageId : 'hero';

  sections.forEach((section) => {
    const isActive = section.id === normalizedPageId;
    section.hidden = !isActive;
    section.classList.toggle('is-current-page', isActive);
    if (isActive) {
      section.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
    }
  });

  tabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.pageTab === normalizedPageId);
  });

  document.body.dataset.page = normalizedPageId;
  updatePageSeo(normalizedPageId);

  const nextPath = PAGE_PATHS[normalizedPageId];
  if (options.pushState && window.location.pathname !== nextPath) {
    history.pushState({ pageId: normalizedPageId }, '', nextPath);
  } else if (options.replaceState) {
    history.replaceState({ pageId: normalizedPageId }, '', nextPath);
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function getCurrentPageId() {
  return PAGE_ROUTES[normalizePath(window.location.pathname)] || 'hero';
}

function normalizePath(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '');
  return normalizedPath || '/';
}

function updatePageSeo(pageId) {
  const seo = PAGE_SEO[pageId] || PAGE_SEO.hero;
  const path = PAGE_PATHS[pageId] || '/';
  const url = `${window.location.origin}${path}`;
  document.title = seo.title || PAGE_TITLES[pageId] || PAGE_TITLES.hero;
  setMetaContent('meta[name="description"]', seo.description);
  setMetaContent('meta[property="og:title"]', seo.title);
  setMetaContent('meta[property="og:description"]', seo.description);
  setMetaContent('meta[property="og:url"]', url);
  setMetaContent('meta[name="twitter:title"]', seo.title);
  setMetaContent('meta[name="twitter:description"]', seo.description);
  setLinkHref('link[rel="canonical"]', url);
  setLinkHref('link[rel="alternate"][hreflang="ru"]', url);
  setLinkHref('link[rel="alternate"][hreflang="x-default"]', url);
}

function setMetaContent(selector, content) {
  const element = document.querySelector(selector);
  if (element && content) element.setAttribute('content', content);
}

function setLinkHref(selector, href) {
  const element = document.querySelector(selector);
  if (element && href) element.setAttribute('href', href);
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

function setupLoaderCode() {
  const el = document.getElementById('loaderCode');
  if (!el) return;

  const pickSnippet = () => LOADER_CODE_SNIPPETS[Math.floor(Math.random() * LOADER_CODE_SNIPPETS.length)];

  const typeSnippet = (text, onDone) => {
    let index = 0;
    const tick = () => {
      if (!el.isConnected) return; // loader removed → stop timers
      el.textContent = text.slice(0, index);
      index += 1;
      if (index <= text.length) {
        setTimeout(tick, 22 + Math.random() * 46);
      } else {
        setTimeout(onDone, 1100);
      }
    };
    tick();
  };

  const loop = () => {
    if (!el.isConnected) return;
    typeSnippet(pickSnippet(), loop);
  };

  loop();
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

// Tap/click a team card to expand its bio (primary trigger on touch, where
// there is no hover). Opening one closes the others; tapping outside closes all.
function setupTeamCards() {
  const cards = [...document.querySelectorAll('.team-card')];
  const stageButtons = [...document.querySelectorAll('[data-stage-target]')];
  const spotlight = document.getElementById('teamSpotlight');
  if (!cards.length) return;

  const setActiveStage = (stage) => {
    const activeCard = cards.find((card) => card.dataset.teamStage === stage) || cards[0];
    cards.forEach((card) => {
      card.classList.toggle('is-open', card.dataset.teamStage === stage);
    });
    stageButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.stageTarget === stage);
    });
    updateTeamSpotlight(activeCard, spotlight);
  };

  cards.forEach((card) => {
    card.addEventListener('pointerenter', () => {
      if (window.matchMedia('(hover: hover)').matches) setActiveStage(card.dataset.teamStage);
    });
    card.addEventListener('click', () => {
      setActiveStage(card.dataset.teamStage);
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      setActiveStage(card.dataset.teamStage);
    });
  });

  stageButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveStage(button.dataset.stageTarget));
  });

  document.addEventListener('teamcopychange', () => {
    const activeCard = cards.find((card) => card.classList.contains('is-open')) || cards[0];
    updateTeamSpotlight(activeCard, spotlight);
  });

  setActiveStage(cards[0].dataset.teamStage);
}

function updateTeamSpotlight(card, spotlight) {
  if (!card || !spotlight) return;

  const avatar = card.querySelector('.team-avatar');
  const image = card.querySelector('.team-avatar__img');
  const fallback = card.querySelector('.team-avatar__fallback');
  const name = card.querySelector('h3')?.textContent || '';
  const role = card.querySelector('.team-role')?.textContent || '';
  const stage = card.querySelector('.team-stage')?.textContent || card.dataset.teamStage || '';
  const description = card.querySelector('.team-card__desc')?.textContent || '';
  const facts = card.querySelector('.team-card__facts')?.innerHTML || '';
  const stack = card.querySelector('.tech-list')?.innerHTML || '';

  spotlight.querySelector('[data-spotlight-name]').textContent = name;
  spotlight.querySelector('[data-spotlight-role]').textContent = role;
  spotlight.querySelector('[data-spotlight-stage]').textContent = stage;
  spotlight.querySelector('[data-spotlight-desc]').textContent = description;
  spotlight.querySelector('[data-spotlight-facts]').innerHTML = facts;
  spotlight.querySelector('[data-spotlight-stack]').innerHTML = stack;

  const spotlightAvatar = spotlight.querySelector('[data-spotlight-avatar]');
  const spotlightImage = spotlight.querySelector('.team-spotlight__img');
  const spotlightFallback = spotlight.querySelector('.team-spotlight__fallback');
  if (spotlightAvatar && avatar) spotlightAvatar.style.cssText = avatar.style.cssText;
  if (spotlightFallback) spotlightFallback.textContent = fallback?.textContent || name.charAt(0);
  if (spotlightImage && image) {
    spotlightImage.src = image.src;
    spotlightImage.alt = image.alt || name;
    spotlightImage.className = 'team-spotlight__img';
    if (image.classList.contains('team-avatar__img--nastachka')) {
      spotlightImage.classList.add('team-spotlight__img--nastachka');
    }
    spotlightImage.hidden = false;
    spotlightImage.onerror = () => {
      spotlightImage.hidden = true;
    };
  } else if (spotlightImage) {
    spotlightImage.hidden = true;
  }
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const statusEl = document.getElementById('formStatus');
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    setFormStatus(statusEl, 'sending');
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') || '').trim(),
          email: String(data.get('email') || '').trim(),
          phone: String(data.get('phone') || '').trim(),
          message: String(data.get('message') || '').trim(),
          botcheck: data.get('botcheck') ? 'on' : '',
        }),
      });

      if (response.ok) {
        setFormStatus(statusEl, 'success');
        form.reset();
      } else if (response.status === 429) {
        setFormStatus(statusEl, 'rateLimited');
      } else {
        // Never hand the user off to a mail client — the form always sends
        // through the backend. Surface the failure instead so it gets fixed.
        setFormStatus(statusEl, 'error');
        console.error('Lead submit failed:', response.status, await response.text().catch(() => ''));
      }
    } catch (error) {
      setFormStatus(statusEl, 'error');
      console.error('Lead submit network error:', error);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

async function setupInstagramNews() {
  const container = document.getElementById('instagramNews');
  if (!container) return;

  try {
    const response = await fetch(INSTAGRAM_NEWS_ENDPOINT, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Instagram news request failed');

    const payload = await response.json();
    if (!payload.ok || !Array.isArray(payload.posts) || !payload.posts.length) {
      renderInstagramFallback(container, payload.profileUrl);
      return;
    }

    renderInstagramPosts(container, payload.posts);
  } catch (error) {
    renderInstagramFallback(container);
  }
}

function renderInstagramPosts(container, posts) {
  container.innerHTML = posts.map((post) => buildInstagramCard(post)).join('');
}

function buildInstagramCard(post) {
  const caption = escapeHtml(post.caption || 'SproogeekDev');
  const image = escapeHtml(post.imageUrl || './assets/SprooGeek.svg');
  const url = escapeHtml(post.url || 'https://www.instagram.com/sproogeek_dev/');
  const date = formatPostDate(post.publishedAt);
  const metrics = buildInstagramMetrics(post);

  return `
    <article class="news-card">
      <a class="news-card__media" href="${url}" target="_blank" rel="noreferrer" aria-label="${caption}">
        <img src="${image}" alt="" loading="lazy" decoding="async" onerror="this.remove()" />
      </a>
      <div class="news-card__body">
        <div class="news-card__meta">
          <span>${date}</span>
          ${post.isVideo ? '<span>Video</span>' : '<span>Post</span>'}
        </div>
        <p>${caption}</p>
        <div class="news-card__footer">
          <span>${metrics}</span>
          <a href="${url}" target="_blank" rel="noreferrer">Instagram</a>
        </div>
      </div>
    </article>
  `;
}

function buildInstagramMetrics(post) {
  const parts = [];
  if (Number.isFinite(post.likes)) parts.push(`${post.likes} likes`);
  if (Number.isFinite(post.comments)) parts.push(`${post.comments} comments`);
  return escapeHtml(parts.join(' / ') || '@sproogeek_dev');
}

function renderInstagramFallback(container, profileUrl = 'https://www.instagram.com/sproogeek_dev/') {
  container.innerHTML = `
    <article class="news-fallback">
      <span>@sproogeek_dev</span>
      <p>Instagram временно не отдал посты. Свежие новости можно открыть в профиле.</p>
      <a class="button button--primary" href="${escapeHtml(profileUrl)}" target="_blank" rel="noreferrer">Открыть Instagram</a>
    </article>
  `;
}

function formatPostDate(value) {
  if (!value) return 'Instagram';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Instagram';
  return new Intl.DateTimeFormat(currentLang === 'en' ? 'en' : 'ru', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function setFormStatus(element, state) {
  if (!element) return;
  const text = FORM_STATUS_TEXT[state];
  element.textContent = text ? text[currentLang] || text.ru : '';
  if (state) {
    element.dataset.state = state;
  } else {
    delete element.dataset.state;
  }
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
  document.dispatchEvent(new CustomEvent('teamcopychange'));
}

function switchToRussian() {
  currentLang = 'ru';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const stored = originalTexts.get(el);
    if (stored !== undefined) el.textContent = stored;
  });
  document.dispatchEvent(new CustomEvent('teamcopychange'));
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

  // Normal blending (not additive): the page background is light cream, so the
  // particles must darken it rather than brighten it to stay visible.
  const material = new THREE.PointsMaterial({
    size: 0.11,
    transparent: true,
    opacity: 0.5,
    vertexColors: true,
    blending: THREE.NormalBlending,
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

  // Blend along the brand palette: deep purple #2F213F → crimson #E62F4F.
  const mix = Math.sin(progress * Math.PI);
  colors[offset] = 0.184 + mix * 0.718;
  colors[offset + 1] = 0.129 + mix * 0.055;
  colors[offset + 2] = 0.247 + mix * 0.063;
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
