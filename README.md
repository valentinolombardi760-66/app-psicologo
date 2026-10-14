# PsicoLab

App per smartphone (Android e iOS) per la gestione dello studio di uno psicologo: pazienti, agenda, diario clinico, ricevute e Sistema Tessera Sanitaria. Realizzata con Expo (React Native).

## Cosa fa

- **Pazienti**: anagrafica, codice fiscale con controllo, minori con genitore/tutore, motivo della richiesta, anamnesi, inviante, tariffa personalizzata, consenso informato e privacy, opposizione al Sistema TS, archiviazione.
- **Agenda**: settimana scorrevole, sedute per giorno, tipi di seduta (individuale, coppia, famiglia, online, valutazione, gruppo), stati (programmato, svolto, assente, annullato), sedute ricorrenti settimanali, avviso di sovrapposizione, promemoria WhatsApp precompilato.
- **Diario clinico**: note per seduta con clima della seduta, obiettivi e compiti; grafico dell'andamento; ripresa automatica di obiettivi e compiti dalla nota precedente.
- **Ricevute**: numerazione progressiva per anno, esenzione IVA (art. 10 n. 18 DPR 633/72 o regime forfettario), rivalsa ENPAP 2%, marca da bollo 2 € sopra 77,47 €, Bonus Psicologo, metodo di pagamento (tracciabilità per la detrazione), PDF da condividere, annullamento senza riuso del numero.
- **Sistema TS**: stato "inviata" per ogni ricevuta ed esportazione CSV per anno (da caricare o da girare al commercialista).
- **Sicurezza**: PIN a 6 cifre, impronta / Face ID (app nativa), blocco automatico, dati cifrati (XChaCha20-Poly1305). Nell'app nativa la chiave sta nel Keychain/Keystore; nella versione browser è ricavata dal PIN (PBKDF2, 600.000 iterazioni). Nessun server.
- **Backup** cifrato con password, ripristinabile su un altro telefono.
- **Respira**: esercizio di respirazione guidata (quadrata, 4-7-8, coerente).

## Installarla dal browser (PWA)

La versione web si installa come un'app, senza store:

- **Android (Chrome)**: apri l'indirizzo dell'app → menu ⋮ → *Installa app* (o *Aggiungi a schermata Home*).
- **iPhone (Safari)**: apri l'indirizzo → pulsante Condividi → *Aggiungi alla schermata Home*.

Funziona anche offline. I dati restano nel browser di quel telefono, cifrati con una chiave ricavata dal PIN:
**se dimentichi il PIN, i dati si recuperano solo da un backup**. Fai un backup cifrato regolarmente
(*Altro → Backup cifrato*) e non cancellare i dati di navigazione del sito.

### Pubblicazione su GitHub Pages

Il workflow `.github/workflows/deploy.yml` pubblica l'app a ogni push su `main`.
Una sola volta: nel repository, *Settings → Pages → Build and deployment → Source: GitHub Actions*.
L'indirizzo sarà `https://<utente>.github.io/<nome-repository>/`.

Per generarla in locale: `EXPO_BASE_URL=/<nome-repository> npm run build:web` (risultato in `dist/`).

## Provarla subito sul telefono (Expo Go)

1. Installa [Node.js](https://nodejs.org) (versione 20 o superiore) sul computer.
2. Installa l'app **Expo Go** sul telefono (Play Store / App Store).
3. Nella cartella del progetto:
   ```bash
   npm install
   npx expo start
   ```
4. Inquadra il QR code con Expo Go (Android) o con la fotocamera (iPhone). Telefono e computer devono essere sulla stessa rete Wi-Fi.

In *Altro → Carica dati di esempio* trovi pazienti finti per provare tutte le funzioni.

## Creare l'APK installabile (Android)

```bash
npm install -g eas-cli
eas login            # account Expo gratuito
eas build -p android --profile preview
```
Al termine EAS fornisce un link per scaricare l'APK da installare sul telefono.
Per iPhone serve un account Apple Developer (99 $/anno): `eas build -p ios`.

## Limiti da conoscere

- I dati stanno **solo su questo telefono**: senza backup, se perdi il telefono perdi i dati. Esporta regolarmente il backup cifrato.
- Le ricevute coprono le prestazioni a **privati**. Verso aziende o enti serve la fattura elettronica via SdI, che l'app non emette.
- L'app **non trasmette** i dati al Sistema TS: prepara il CSV da caricare sul portale o da passare al commercialista.
- Le diciture fiscali sono aggiornate a ottobre 2026: falle verificare dal tuo commercialista prima dell'uso reale.
