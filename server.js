const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);
const PUBLIC_DIR = __dirname;
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};
const PAGE_ROUTES = new Set(['/', '/services', '/case', '/architecture', '/team', '/process', '/news', '/contact']);
const SITE_ORIGIN = 'https://about.sproogeek.com';
const DEFAULT_IMAGE_URL = `${SITE_ORIGIN}/assets/spiral-notebook-render.png`;
const LAST_MODIFIED = '2026-07-23';
const PAGE_SECTION_IDS = {
  '/': 'hero',
  '/services': 'services',
  '/case': 'case',
  '/architecture': 'architecture',
  '/team': 'team',
  '/process': 'process',
  '/news': 'news',
  '/contact': 'contact',
};
const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME || 'sproogeek_dev';
const INSTAGRAM_PROFILE_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;
const INSTAGRAM_WEB_PROFILE_URL = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${INSTAGRAM_USERNAME}`;
const INSTAGRAM_APP_ID = '936619743392459';
const INSTAGRAM_CACHE_TTL_MS = 15 * 60 * 1000;
const INSTAGRAM_POST_LIMIT = 9;
let instagramCache = {
  expiresAt: 0,
  payload: null,
  pending: null,
};
const PAGE_SEO = {
  '/': {
    title: 'SproogeekDev - сайты, 3D-конфигураторы и backend',
    description: 'SproogeekDev проектирует сайты, продуктовые лендинги, 3D-конфигураторы, API и микросервисную инфраструктуру для продаж.',
    breadcrumbName: 'Главная',
    priority: '1.0',
  },
  '/services': {
    title: 'Услуги SproogeekDev - сайты, 3D и backend',
    description: 'Разрабатываем сайты, продуктовые лендинги, 3D-конфигураторы, backend, интеграции, DevOps и поддержку цифровых продуктов.',
    breadcrumbName: 'Услуги',
    priority: '0.8',
  },
  '/case': {
    title: 'Кейс Sproogeek 3D Configurator - SproogeekDev',
    description: 'Кейс B2B2C 3D-конфигуратора для сувенирной и полиграфической продукции: браузерное превью, заказы, рендеры и PDF-техкарты.',
    breadcrumbName: 'Кейс',
    priority: '0.8',
  },
  '/architecture': {
    title: 'Архитектура веб-продуктов - SproogeekDev',
    description: 'Показываем архитектуру масштабируемого продукта: frontend, 3D engine, backend, render-сервисы, PDF, data flow и инфраструктура.',
    breadcrumbName: 'Архитектура',
    priority: '0.7',
  },
  '/team': {
    title: 'Команда SproogeekDev',
    description: 'Команда SproogeekDev: дизайн, управление, маркетинг, frontend, backend, креатив, аналитика и SMM для запуска цифровых продуктов.',
    breadcrumbName: 'Команда',
    priority: '0.7',
  },
  '/process': {
    title: 'Процесс разработки - SproogeekDev',
    description: 'Работаем короткими инженерными итерациями: анализ цели, архитектура, дизайн и код, проверка, запуск и поддержка.',
    breadcrumbName: 'Процесс',
    priority: '0.7',
  },
  '/news': {
    title: 'Новости SproogeekDev',
    description: 'Новости SproogeekDev: обновления студии, новые проекты, релизы и материалы о разработке сайтов, 3D-конфигураторов и backend.',
    breadcrumbName: 'Новости',
    priority: '0.6',
  },
  '/contact': {
    title: 'Контакты SproogeekDev',
    description: 'Свяжитесь с SproogeekDev, чтобы обсудить сайт, 3D-конфигуратор, backend-интеграции или запуск цифрового продукта.',
    breadcrumbName: 'Контакты',
    priority: '0.8',
  },
};

function resolveRequestPath(url) {
  const requestUrl = new URL(url, `http://${HOST}:${PORT}`);
  const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const normalizedPath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  return path.join(PUBLIC_DIR, normalizedPath);
}

async function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || 'application/octet-stream';
  const body = await fs.readFile(filePath);
  response.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

async function sendPage(response, pathname) {
  const htmlPath = path.join(PUBLIC_DIR, 'index.html');
  const html = await fs.readFile(htmlPath, 'utf8');
  response.writeHead(200, {
    'Content-Type': MIME_TYPES['.html'],
    'Cache-Control': 'no-store',
  });
  response.end(applySeoToHtml(html, pathname));
}

function sendJson(response, statusCode, body, cacheControl = 'no-store') {
  response.writeHead(statusCode, {
    'Content-Type': MIME_TYPES['.json'],
    'Cache-Control': cacheControl,
  });
  response.end(JSON.stringify(body));
}

async function handleRequest(request, response) {
  try {
    const normalizedPath = normalizeRoutePath(request.url);
    if (normalizedPath === '/api/news/instagram/image') {
      await handleInstagramImage(request, response);
      return;
    }

    if (normalizedPath === '/api/news/instagram') {
      await handleInstagramNews(request, response);
      return;
    }

    if (PAGE_ROUTES.has(normalizedPath)) {
      await sendPage(response, normalizedPath);
      return;
    }

    const filePath = resolveRequestPath(request.url);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    await sendFile(response, filePath);
  } catch (error) {
    const normalizedPath = normalizeRoutePath(request.url);
    if (error.code === 'ENOENT' && PAGE_ROUTES.has(normalizedPath)) {
      await sendPage(response, normalizedPath);
      return;
    }

    response.writeHead(error.code === 'ENOENT' ? 404 : 500);
    response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
  }
}

function normalizeRoutePath(url) {
  const requestUrl = new URL(url, `http://${HOST}:${PORT}`);
  return requestUrl.pathname.replace(/\/+$/, '') || '/';
}

async function handleInstagramNews(request, response) {
  if (request.method !== 'GET') {
    sendJson(response, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const payload = await getInstagramPayload();
    sendJson(response, 200, payload, 'public, max-age=300');
  } catch (error) {
    sendJson(response, 200, {
      ok: false,
      profileUrl: INSTAGRAM_PROFILE_URL,
      posts: [],
      error: 'Instagram feed is temporarily unavailable',
    });
  }
}

async function getInstagramPayload() {
  const now = Date.now();
  if (instagramCache.payload && instagramCache.expiresAt > now) {
    return instagramCache.payload;
  }

  if (!instagramCache.pending) {
    instagramCache.pending = fetchInstagramPosts()
      .then((posts) => {
        const payload = {
          ok: true,
          source: 'instagram',
          username: INSTAGRAM_USERNAME,
          profileUrl: INSTAGRAM_PROFILE_URL,
          updatedAt: new Date().toISOString(),
          posts,
        };
        instagramCache = {
          expiresAt: Date.now() + INSTAGRAM_CACHE_TTL_MS,
          payload,
          pending: null,
        };
        return payload;
      })
      .catch((error) => {
        instagramCache.pending = null;
        throw error;
      });
  }

  return instagramCache.pending;
}

async function fetchInstagramPosts() {
  const response = await fetch(INSTAGRAM_WEB_PROFILE_URL, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
      Referer: INSTAGRAM_PROFILE_URL,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
      'X-IG-App-ID': INSTAGRAM_APP_ID,
    },
  });

  if (!response.ok) {
    throw new Error(`Instagram responded with ${response.status}`);
  }

  const payload = await response.json();
  const edges = payload?.data?.user?.edge_owner_to_timeline_media?.edges || [];
  return edges
    .map((edge) => normalizeInstagramPost(edge?.node))
    .filter(Boolean)
    .slice(0, INSTAGRAM_POST_LIMIT);
}

function normalizeInstagramPost(node) {
  if (!node?.shortcode) return null;
  const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
  const sourceImageUrl = node.display_url || node.thumbnail_src || '';
  const timestamp = typeof node.taken_at_timestamp === 'number' ? node.taken_at_timestamp * 1000 : null;
  return {
    id: node.id || node.shortcode,
    shortcode: node.shortcode,
    url: `https://www.instagram.com/p/${node.shortcode}/`,
    imageUrl: buildInstagramImageProxyUrl(sourceImageUrl),
    sourceImageUrl,
    caption: trimText(caption, 220),
    publishedAt: timestamp ? new Date(timestamp).toISOString() : null,
    likes: node.edge_liked_by?.count ?? null,
    comments: node.edge_media_to_comment?.count ?? null,
    isVideo: Boolean(node.is_video),
  };
}

function buildInstagramImageProxyUrl(imageUrl) {
  if (!isAllowedInstagramImageUrl(imageUrl)) return '';
  return `/api/news/instagram/image?url=${encodeURIComponent(imageUrl)}`;
}

async function handleInstagramImage(request, response) {
  if (request.method !== 'GET') {
    sendJson(response, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  const requestUrl = new URL(request.url, `http://${HOST}:${PORT}`);
  const imageUrl = requestUrl.searchParams.get('url') || '';
  if (!isAllowedInstagramImageUrl(imageUrl)) {
    sendJson(response, 400, { ok: false, error: 'Invalid image url' });
    return;
  }

  try {
    const imageResponse = await fetch(imageUrl, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
        Referer: INSTAGRAM_PROFILE_URL,
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
      },
    });

    if (!imageResponse.ok) {
      throw new Error(`Instagram image responded with ${imageResponse.status}`);
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    });
    response.end(imageBuffer);
  } catch (error) {
    sendJson(response, 502, { ok: false, error: 'Instagram image is temporarily unavailable' });
  }
}

function isAllowedInstagramImageUrl(value) {
  if (!value || value.length > 3000) return false;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === 'https:' && (
      hostname.endsWith('.cdninstagram.com')
      || hostname === 'cdninstagram.com'
      || hostname.endsWith('.fbcdn.net')
      || hostname === 'fbcdn.net'
    );
  } catch (error) {
    return false;
  }
}

function trimText(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function applySeoToHtml(html, pathname) {
  const seo = PAGE_SEO[pathname] || PAGE_SEO['/'];
  const canonicalUrl = `${SITE_ORIGIN}${pathname === '/' ? '/' : pathname}`;
  const pageSchema = buildPageStructuredData(pathname, seo, canonicalUrl);

  return applyInitialPageVisibility(html, pathname)
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(seo.description)}" />`)
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/<link\s+rel="alternate"\s+href="[^"]*"\s+hreflang="ru"\s*\/>/, `<link rel="alternate" href="${canonicalUrl}" hreflang="ru" />`)
    .replace(/<link\s+rel="alternate"\s+href="[^"]*"\s+hreflang="x-default"\s*\/>/, `<link rel="alternate" href="${canonicalUrl}" hreflang="x-default" />`)
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(seo.title)}" />`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(seo.description)}" />`)
    .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`)
    .replace('</head>', `    <script type="application/ld+json">${JSON.stringify(pageSchema)}</script>\n  </head>`);
}

function applyInitialPageVisibility(html, pathname) {
  const activeSectionId = PAGE_SECTION_IDS[pathname] || PAGE_SECTION_IDS['/'];
  let result = html.replace(/<body class="([^"]*)"/, `<body class="$1" data-page="${activeSectionId}"`);

  Object.values(PAGE_SECTION_IDS).forEach((sectionId) => {
    const sectionPattern = new RegExp(`(<section\\b(?=[^>]*\\sid="${sectionId}")[^>]*)(>)`);
    result = result.replace(sectionPattern, sectionId === activeSectionId ? '$1$2' : '$1 hidden$2');
  });

  return result;
}

function buildPageStructuredData(pathname, seo, canonicalUrl) {
  const pageSchema = buildWebPageSchema(seo, canonicalUrl);
  const graph = [pageSchema];
  if (pathname !== '/') {
    graph.push(buildBreadcrumbSchema(pathname, seo));
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function buildWebPageSchema(seo, canonicalUrl) {
  return {
    '@type': 'WebPage',
    name: seo.title,
    description: seo.description,
    url: canonicalUrl,
    image: DEFAULT_IMAGE_URL,
    dateModified: LAST_MODIFIED,
    inLanguage: 'ru',
    isPartOf: {
      '@id': `${SITE_ORIGIN}/#website`,
    },
  };
}

function buildBreadcrumbSchema(pathname, seo) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: PAGE_SEO['/'].breadcrumbName,
        item: `${SITE_ORIGIN}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: seo.breadcrumbName,
        item: `${SITE_ORIGIN}${pathname}`,
      },
    ],
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(`SproogeekDev site: http://${HOST}:${PORT}/`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try: PORT=4174 npm start`);
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});
