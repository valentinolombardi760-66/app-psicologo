import { DB } from '../types';
import { patientColors } from '../theme';
import { newId } from './store';
import { addDays, toISODate } from '../utils/format';

/** Dati di esempio per provare l'app senza inserire pazienti veri. */
export function demoData(db: DB): DB {
  const names: [string, string, string][] = [
    ['Giulia', 'Bianchi', 'BNCGLI90A41H501W'],
    ['Marco', 'Ferri', 'FRRMRC85C12F205Z'],
    ['Sara', 'Conti', 'CNTSRA97E55L219K'],
    ['Luca', 'Moretti', 'MRTLCU78H03A944P'],
  ];
  const reasons = ['Ansia e attacchi di panico', 'Difficoltà relazionali di coppia', 'Gestione dello stress lavorativo', 'Umore deflesso dopo un lutto'];
  const patients = names.map(([firstName, lastName, taxCode], i) => ({
    id: newId(), firstName, lastName, taxCode, phone: `34${i}1234567`, email: `${firstName.toLowerCase()}@esempio.it`, address: '',
    referral: i % 2 ? 'Medico di base' : 'Passaparola', reason: reasons[i], anamnesis: '', color: patientColors[i], isMinor: false,
    guardianName: '', guardianTaxCode: '', consentInformed: i !== 3, consentPrivacy: i !== 3, consentDate: toISODate(addDays(new Date(), -60)),
    stsOpposition: false, archived: false, createdAt: new Date().toISOString(),
  }));
  const appointments: DB['appointments'] = [];
  const notes: DB['notes'] = [];
  const now = new Date();
  patients.forEach((p, i) => {
    for (let w = -4; w <= 2; w++) {
      const d = addDays(now, w * 7 + (i % 3) - 1);
      d.setHours(9 + i * 2, 0, 0, 0);
      const past = d < now;
      const a = { id: newId(), patientId: p.id, start: d.toISOString(), duration: 50, type: i === 1 ? 'coppia' as const : 'individuale' as const, status: past ? 'svolto' as const : 'programmato' as const, fee: i === 1 ? 90 : 60, paid: past, notes: '' };
      appointments.push(a);
      if (past) notes.push({ id: newId(), patientId: p.id, appointmentId: a.id, date: toISODate(d), mood: Math.min(5, 2 + ((w + 4 + i) % 4)), content: 'Esplorati i pensieri automatici legati alla settimana. Buona alleanza terapeutica.', goals: 'Riconoscere i segnali precoci di attivazione', homework: 'Diario ABC giornaliero', createdAt: d.toISOString() });
    }
  });
  // oggi una seduta in più, per vedere la home popolata
  const t = new Date(); t.setHours(Math.min(t.getHours() + 1, 20), 0, 0, 0);
  appointments.push({ id: newId(), patientId: patients[0].id, start: t.toISOString(), duration: 50, type: 'online', status: 'programmato', fee: 60, paid: false, notes: 'Link videochiamata inviato' });
  return { ...db, patients: [...db.patients, ...patients], appointments: [...db.appointments, ...appointments], notes: [...db.notes, ...notes] };
}
