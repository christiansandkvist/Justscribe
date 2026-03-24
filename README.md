# ScribeToGo

Pay-as-you-go transcription. One tap. Speak. Get a text file. No subscription.

## Stack

| Layer | Tech |
|---|---|
| Mobile | React Native (Expo) |
| Backend | Node.js + Express + TypeScript |
| Auth + DB | Supabase |
| Payments | Stripe (prepaid credit) |
| Transcription | Google Cloud Speech-to-Text v1 + v2 Chirp |

## Quick start

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Copy the project URL and service role key

### 2. Stripe
1. Create an account at [stripe.com](https://stripe.com)
2. Note the publishable key + secret key
3. Create a webhook pointing to `https://your-backend.com/api/payments/webhook`
   - Events: `payment_intent.succeeded`

### 3. Google Cloud Speech-to-Text
1. Enable Speech-to-Text API (v1 and v2) in your GCP project
2. Create a service account with `Cloud Speech Client` role
3. Download the JSON key → save as `backend/gcp-key.json`
4. Note your project ID for Chirp (v2)

### 4. Backend

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
```

### 5. Mobile

```bash
cd mobile
cp .env.example .env
# Fill in all values in .env
npm install
npx expo start
```

## Pricing model

- 1 credit = $0.01 USD
- Standard (Google STT v1): 0.004 credits/second = ~$0.24/hour
- Fast/Chirp (Google STT v2): 0.0168 credits/second = ~$1.01/hour

## Screens

1. **Home** — Balance + "Record live" + "Upload file" + top-up link
2. **Choose speed** — Standard vs Chirp with cost estimate
3. **Record / Processing** — Pulsing record button or upload progress bar
4. **Result** — Transcript + Save as .txt + Copy + New transcription

## Deployment

### Backend (Railway / Fly.io)
```bash
# Set environment variables in your platform's dashboard
# Deploy via git push or CLI
railway up
```

### Mobile (Expo EAS)
```bash
cd mobile
npx eas build --platform all
```
