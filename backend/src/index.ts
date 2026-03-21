import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import balanceRouter from './routes/balance';
import transcriptionRouter from './routes/transcription';
import paymentsRouter from './routes/payments';
import usageRouter from './routes/usage';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3000;

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Raw body parser ONLY for Stripe webhook — must come before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON body parser for all other routes
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/balance', balanceRouter);
app.use('/api/transcribe', transcriptionRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/usage', usageRouter);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] Justscribe backend running on port ${PORT}`);
});

export default app;
