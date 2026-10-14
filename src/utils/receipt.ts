import { Patient, Receipt, ReceiptItem, Settings } from '../types';
import { euro, fmtDate, fullName } from './format';

export const STAMP_THRESHOLD = 77.47;
export const STAMP_AMOUNT = 2;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Calcola rivalsa ENPAP, bollo e totale secondo le regole per psicologi (prestazioni sanitarie esenti IVA). */
export function computeReceipt(items: ReceiptItem[], s: Settings) {
  const gross = round2(items.reduce((t, i) => t + (i.amount || 0), 0));
  let lines = items.map((i) => ({ ...i, amount: round2(i.amount || 0) }));
  let subtotal = gross;
  let enpap = s.enpap ? round2((gross * s.enpapRate) / 100) : 0;
  if (s.enpap && s.enpapIncluded) {
    // Scorporo: il prezzo comprende già il 2%, quindi onorario = prezzo / 1,02
    const k = 1 + s.enpapRate / 100;
    subtotal = round2(gross / k);
    enpap = round2(gross - subtotal);
    lines = items.map((i) => ({ ...i, amount: round2((i.amount || 0) / k) }));
    // l'ultimo centesimo di arrotondamento va sull'ultima riga, così le righe sommano all'onorario
    const diff = round2(subtotal - lines.reduce((t, l) => t + l.amount, 0));
    if (lines.length && diff) lines[lines.length - 1].amount = round2(lines[lines.length - 1].amount + diff);
  }
  const exempt = subtotal + enpap;
  // Bollo da 2 € se l'importo esente supera 77,47 € (non se è uguale)
  const stampDue = exempt > STAMP_THRESHOLD;
  const stamp = stampDue && s.stampCharged ? STAMP_AMOUNT : 0;
  return { lines, subtotal, enpap, stampDue, stamp, total: round2(exempt + stamp) };
}

export const PAYMENT_LABEL: Record<string, string> = {
  contanti: 'Contanti',
  carta: 'Carta / Bancomat',
  bonifico: 'Bonifico bancario',
  bonus: 'Bonus Psicologo',
};

export const isTraceable = (r: Receipt) => r.paymentMethod !== 'contanti';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function receiptHTML(r: Receipt, p: Patient | undefined, s: Settings) {
  const pr = s.profile;
  const payer = p?.isMinor && p.guardianName ? { name: p.guardianName, cf: p.guardianTaxCode } : { name: fullName(p), cf: p?.taxCode ?? '' };
  const exempt = r.subtotal + r.enpap;
  const notes: string[] = [];
  if (r.regime === 'forfettario') {
    notes.push('Operazione effettuata ai sensi dell’articolo 1, commi da 54 a 89, della Legge n. 190/2014 – Regime Forfettario. Operazione senza applicazione dell’IVA.');
    notes.push('Operazione non soggetta a ritenuta alla fonte a titolo di acconto ai sensi dell’art. 1, comma 67, L. 190/2014.');
  } else {
    notes.push('Prestazione sanitaria esente IVA ai sensi dell’art. 10, comma 1, n. 18, D.P.R. 633/1972.');
  }
  if (r.enpap > 0) notes.push(`Contributo integrativo ENPAP ${s.enpapRate}% ai sensi dell’art. 8 L. 335/1995.`);
  if (exempt > STAMP_THRESHOLD) notes.push('Imposta di bollo da € 2,00 assolta sull’originale (importo superiore a € 77,47).');
  if (p?.stsOpposition) notes.push('Il paziente si è opposto alla trasmissione dei dati al Sistema Tessera Sanitaria.');
  if (p?.isMinor && p.guardianName) notes.push(`Prestazione resa a favore di ${esc(fullName(p))} (C.F. ${esc(p.taxCode)}).`);
  if (r.paymentMethod === 'bonus' && r.bonusCode)
    notes.push(`Importo coperto da Bonus Psicologo (codice ${esc(r.bonusCode)}): ${euro(r.bonusAmount)}. Quota a carico del paziente: ${euro(Math.max(0, r.total - r.bonusAmount))}.`);

  const rows = r.items
    .map((i) => `<tr><td>${esc(i.description)}</td><td class="n">${euro(i.amount)}</td></tr>`)
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  @page { margin: 28px; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #2B2748; font-size: 12px; }
  .top { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 3px solid #7464F0; padding-bottom: 14px; }
  .logo { width:46px; height:46px; border-radius:23px; background:#7464F0; color:#fff; font-size:28px; text-align:center; line-height:46px; font-family: Georgia, serif; }
  h1 { font-size: 18px; margin: 0; }
  .muted { color:#6E6A8A; }
  .doc { text-align:right; }
  .doc .num { font-size: 20px; font-weight: 800; color:#7464F0; }
  .box { background:#F5F3FB; border-radius:10px; padding:12px; margin-top:16px; }
  table { width:100%; border-collapse: collapse; margin-top: 16px; }
  th { text-align:left; font-size:10px; letter-spacing:1px; color:#6E6A8A; border-bottom:1px solid #E8E5F3; padding:8px 0; }
  td { padding: 8px 0; border-bottom: 1px solid #F0EEF8; }
  .n { text-align:right; white-space:nowrap; }
  .tot td { font-weight: 800; font-size: 15px; border-bottom: none; color:#7464F0; }
  .notes { margin-top: 18px; font-size: 10px; color:#6E6A8A; line-height:1.5; }
  .sign { margin-top: 40px; text-align:right; }
  .stamp { border:1px dashed #A7A3BF; width:90px; height:70px; display:inline-block; text-align:center; line-height:70px; color:#A7A3BF; font-size:10px; }
</style></head><body>
<div class="top">
  <div style="display:flex; gap:12px; align-items:center">
    <div class="logo">Ψ</div>
    <div>
      <h1>${esc(pr.title)} ${esc(pr.fullName)}</h1>
      <div class="muted">${esc(pr.specialization)}${pr.alboRegion ? ` · Iscr. Albo Psicologi ${esc(pr.alboRegion)}` : ''}${pr.alboNumber ? ` n. ${esc(pr.alboNumber)}` : ''}</div>
      <div class="muted">${esc(pr.address)}</div>
      <div class="muted">${pr.vat ? `P.IVA ${esc(pr.vat)} · ` : ''}${pr.taxCode ? `C.F. ${esc(pr.taxCode)}` : ''}</div>
      <div class="muted">${[pr.phone, pr.email].filter(Boolean).map(esc).join(' · ')}</div>
    </div>
  </div>
  <div class="doc">
    <div class="muted">FATTURA / RICEVUTA</div>
    <div class="num">N. ${r.number}/${r.year}</div>
    <div>del ${fmtDate(r.date)}</div>
  </div>
</div>
<div class="box">
  <div class="muted" style="font-size:10px; letter-spacing:1px">DESTINATARIO</div>
  <div style="font-size:14px; font-weight:700; margin-top:4px">${esc(payer.name)}</div>
  <div>C.F. ${esc(payer.cf || '—')}</div>
  ${p?.address ? `<div>${esc(p.address)}</div>` : ''}
</div>
<table>
  <tr><th>DESCRIZIONE</th><th class="n">IMPORTO</th></tr>
  ${rows}
  ${r.enpap > 0 ? `<tr><td>Contributo integrativo ENPAP ${s.enpapRate}%</td><td class="n">${euro(r.enpap)}</td></tr>` : ''}
  ${r.stamp > 0 ? `<tr><td>Rimborso imposta di bollo</td><td class="n">${euro(r.stamp)}</td></tr>` : ''}
  <tr class="tot"><td>TOTALE</td><td class="n">${euro(r.total)}</td></tr>
</table>
<div class="box">Pagamento: <b>${PAYMENT_LABEL[r.paymentMethod]}</b>${pr.iban && r.paymentMethod === 'bonifico' ? ` · IBAN ${esc(pr.iban)}` : ''}</div>
<div class="notes">${notes.map((n) => `<div>• ${n}</div>`).join('')}</div>
<div class="sign">
  ${exempt > STAMP_THRESHOLD ? '<div class="stamp">marca da bollo</div><br/>' : ''}
  <div style="margin-top:20px">Firma</div>
  <div style="margin-top:28px; border-top:1px solid #A7A3BF; width:200px; display:inline-block"></div>
</div>
</body></html>`;
}

/** CSV con i dati da trasmettere al Sistema Tessera Sanitaria (o da passare al commercialista). */
export function stsCSV(receipts: Receipt[], patients: Patient[]) {
  const head = ['Numero', 'Data', 'CF paziente', 'Paziente', 'Tipo spesa', 'Importo', 'Pagamento tracciato', 'Opposizione', 'Inviato STS'];
  const lines = receipts
    .filter((r) => !r.cancelled)
    .sort((a, b) => a.year - b.year || a.number - b.number)
    .map((r) => {
      const p = patients.find((x) => x.id === r.patientId);
      return [
        `${r.number}/${r.year}`,
        fmtDate(r.date),
        p?.taxCode ?? '',
        fullName(p),
        'SP',
        r.total.toFixed(2).replace('.', ','),
        isTraceable(r) ? 'SI' : 'NO',
        p?.stsOpposition ? 'SI' : 'NO',
        r.stsSent ? 'SI' : 'NO',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(';');
    });
  return [head.join(';'), ...lines].join('\n');
}
