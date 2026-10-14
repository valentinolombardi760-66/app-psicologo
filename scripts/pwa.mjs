// Dopo `expo export --platform web`: rende l'app installabile (manifest, icone, funzionamento offline).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const dist = process.argv[2] || 'dist';
const base = (process.env.EXPO_BASE_URL || '').replace(/\/$/, '');

const files = [];
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(relative(dist, p).split('\\').join('/'));
  }
};
walk(dist);

// Solo quello che serve davvero: niente font di icone inutilizzati
const precache = files.filter((f) => !f.includes('/Fonts/') || f.includes('Ionicons')).filter((f) => !f.endsWith('.map') && f !== 'metadata.json');
const version = createHash('sha256').update(precache.join('|') + readFileSync(join(dist, 'index.html'))).digest('hex').slice(0, 12);

writeFileSync(
  join(dist, 'sw.js'),
  `// Generato da scripts/pwa.mjs
const CACHE = 'studio-${version}';
const FILES = ${JSON.stringify(['./', ...precache.filter((f) => f !== 'index.html').map((f) => './' + f)])};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    // Pagina: prima la rete (per gli aggiornamenti), poi la copia offline
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((cc) => cc.put('./', c)); return r; }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
`,
);

const head = `
    <link rel="manifest" href="${base}/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="${base}/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="PsicoLab" />
    <style>html,body{background:#F5F3FB}#root{max-width:520px;margin:0 auto;box-shadow:0 0 40px rgba(59,47,143,.12)}</style>
    <script>
      if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('${base}/sw.js', { scope: '${base}/' }));
    </script>
`;
let html = readFileSync(join(dist, 'index.html'), 'utf8');
html = html.replace('<html lang="en">', '<html lang="it">').replace('</head>', head + '</head>');
writeFileSync(join(dist, 'index.html'), html);
// GitHub Pages: le pagine sconosciute tornano all'app
writeFileSync(join(dist, '404.html'), html);
writeFileSync(join(dist, '.nojekyll'), '');
console.log(`PWA pronta: ${precache.length} file in cache, versione ${version}`);
