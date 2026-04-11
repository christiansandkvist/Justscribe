# Vocri App — Projektstatus
_Senast uppdaterad: 11 april 2026_

---

## Vad är Vocri?
En pay-as-you-go transkriberings-app. Användaren betalar bara för det de transkriberar.
- **Tagline:** "Pay only for what you transcribe"
- **Tidigare namn:** JustScribe / ScribeToGo

---

## Projektstruktur
```
~/vocri/
├── mobile/       ← React Native / Expo app (iOS & Android)
└── backend/      ← Node.js / TypeScript / Express API (deployad på Railway)
```

---

## Backend (`~/vocri/backend`)
**Deployad på:** `https://justscribe-production.up.railway.app`

### Tekniker
- Node.js + TypeScript + Express
- Supabase (databas + auth)
- OpenAI Whisper (`whisper-1`) för transkribering
- Stripe för betalningar
- Railway för hosting

### Routes
| Endpoint | Beskrivning |
|---|---|
| `POST /api/transcribe/file` | Ladda upp ljudfil → transkribera |
| `POST /api/transcribe/stream` | Spela in live → transkribera |
| `POST /api/payments/create-intent` | Skapa Stripe betalning |
| `POST /api/payments/webhook` | Stripe webhook (payment_intent.succeeded) |
| `GET /api/balance` | Hämta kreditsaldo |
| `GET /api/usage` | Hämta användningshistorik |
| `GET /health` | Hälsokontroll |

### Prismodell
- 1 USD = 100 krediter
- Bonusar: $10+ → 5%, $25+ → 10%, $50+ → 20%

### .env (lokal — backend/)
```
SUPABASE_URL=https://lopetdmwkmsjpzvwadsl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_H9qYD9SVhKllEtRJOGSCH5vRw2ZpYiJu
OPENAI_API_KEY=sk-proj-...
PORT=3000
```

⚠️ **OBS:** Kom ihåg att lägga till `STRIPE_WEBHOOK_SECRET` i Railway Variables också!

---

## Mobile (`~/vocri/mobile`)
**Expo SDK ~54**, React Native 0.81.5

### .env (mobil)
```
EXPO_PUBLIC_API_URL=https://justscribe-production.up.railway.app
EXPO_PUBLIC_SUPABASE_URL=https://lopetdmwkmsjpzvwadsl.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xU878EykiiTahmeBEcz6Xw_7LZsdot3
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Skärmar
| Skärm | Fil | Status |
|---|---|---|
| Login | `src/app/(auth)/login.tsx` | ✅ Klar + öga-ikon tillagd |
| Registrering | `src/app/(auth)/register.tsx` | ✅ Klar + öga-ikon tillagd |
| Glömt lösenord | `src/app/(auth)/forgot-password.tsx` | ✅ |
| Hem / Dashboard | `src/app/(app)/home.tsx` | ✅ Visas efter inloggning |

### Starta appen lokalt
```bash
cd ~/vocri/mobile
npx expo start
# Tryck 'i' för iOS simulator
# Tryck 'r' för att reladda (OBS: .env-ändringar kräver full omstart)
```

---

## Gjort i denna session
- ✅ Fixade trasig backend `.env` (hade gammal chat-text i sig)
- ✅ Fixade felaktig `OPENAI_API_KEY` (hade `sk-your-key-here=` som prefix)
- ✅ Lade till `STRIPE_WEBHOOK_SECRET` i backend `.env`
- ✅ Uppdaterade `EXPO_PUBLIC_SUPABASE_ANON_KEY` i mobile `.env` (gammal nyckel fungerade inte)
- ✅ Lade till öga-ikon (visa/dölj lösenord) i login- och registreringsskärmen

---

## Kvar att göra / testa
- [ ] Verifiera att `STRIPE_WEBHOOK_SECRET` är tillagd i **Railway Variables**
- [ ] Testa hela transkriberings-flödet (spela in → transkribera → dra krediter)
- [ ] Testa betalningsflödet (lägg till krediter via Stripe)
- [ ] Testa "Upload file" funktionen
- [ ] Testa Google-inloggning
- [ ] Bygga och testa på riktig iPhone (inte bara simulator)
- [ ] Byta från Stripe testläge (sandbox) till live när appen är redo
