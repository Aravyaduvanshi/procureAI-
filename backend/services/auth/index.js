import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import router from "./routes/auth.route.js";
import connectdb from "./config/db.js";
import { correlationMiddleware } from "../../shared/correlation.js";
import { errorHandler } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";

dotenv.config();

const logger = createLogger("auth-service");
const app = express();
const PORT = process.env.AUTH_PORT || 8001;

app.use(express.json());
app.use(cookieParser());
app.use(correlationMiddleware);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "auth-service", timestamp: new Date().toISOString() });
});

app.use("/", router);

app.use(errorHandler(logger));

async function startServer() {
  try {
    await connectdb();
    const server = app.listen(PORT, () => {
      logger.info(`Auth service is running on port ${PORT}`);
    });
    return server;
  } catch (error) {
    logger.error("Failed to start auth service:", { error: error.message });
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export { app, startServer };
