import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.BILLING_PORT || 8009;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'billing-service', stub: true, timestamp: new Date().toISOString() });
});

app.get('/subscriptions', (req, res) => {
  res.json({
    message: 'Billing service is in stub mode for ProcureAI MVP.',
    tier: 'enterprise-pilot',
    active: true
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Billing Service] Running on port ${PORT} (MVP Stub)`);
  });
}

export { app };
