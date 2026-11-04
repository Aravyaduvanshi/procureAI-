import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import routes from './routes.js';
import { correlationMiddleware } from '../../shared/correlation.js';
import { errorHandler } from '../../shared/errors.js';
import { createLogger } from '../../shared/logger.js';

dotenv.config();

const logger = createLogger('supplier-service');
const app = express();
const PORT = process.env.SUPPLIER_PORT || 8002;

app.use(express.json());
app.use(cookieParser());
app.use(correlationMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'supplier-service', timestamp: new Date().toISOString() });
});

app.use('/', routes);

app.use(errorHandler(logger));

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Supplier service is running on port ${PORT}`);
  });
}

export { app };
