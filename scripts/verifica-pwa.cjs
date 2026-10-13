// Controlla dal vivo che l'app pubblicata sia installabile (stesso controllo di Chrome).
// Uso: node scripts/verifica-pwa.cjs https://utente.github.io/repo/
const { chromium } = require('playwright');
const url = process.argv[2];
const note = (m) => console.log(`::notice title=Verifica PWA::${m}`);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(6000);
  const c = await p.context().newCDPSession(p);
  const { installabilityErrors } = await c.send('Page.getInstallabilityErrors');
  const m = await c.send('Page.getAppManifest');
  const sw = await p.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map((r) => `${r.scope} attivo=${!!r.active}`));
  note(`installabile: ${installabilityErrors.length === 0 ? 'SI' : 'NO ' + JSON.stringify(installabilityErrors)}`);
  note(`manifest: ${m.url} errori=${JSON.stringify(m.errors)}`);
  note(`service worker: ${JSON.stringify(sw)}`);
  const files = await p.evaluate(async () => {
    const t = await (await fetch('sw.js')).text();
    const list = JSON.parse(t.match(/const FILES = (\[.*?\]);/s)[1]);
    const out = [];
    for (const f of list) { const r = await fetch(f, { cache: 'no-store' }); if (!r.ok) out.push(`${r.status} ${f}`); }
    return out;
  });
  note(`file mancanti nella cache: ${files.length ? files.join(', ') : 'nessuno'}`);
  await b.close();
  if (installabilityErrors.length) process.exit(1);
})().catch((e) => { console.log(`::error title=Verifica PWA::${e.message}`); process.exit(1); });
