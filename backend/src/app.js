import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import logger from "./utils/logger.js";

import authRoutes from "./auth/auth.routes.js";
import optimizationRoutes from "./optimization/optimization.routes.js";
import locationRoutes from "./location/location.routes.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// 1. Helmet for Security Headers
app.use(helmet());

// 2. Structured Pino HTTP Logging
app.use(pinoHttp({ logger }));


// 3. Rate Limiting (Global)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});
app.use(limiter);

import { config } from "./config/env.js";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8000",
  config.FASTAPI_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith(".vercel.app"))) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));




app.use(express.json());


// Load Swagger document
const swaggerDocument = YAML.load(path.join(process.cwd(), "swagger.yaml"));

// Setup Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// System Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    service: "Route Optimizer API",
  });
});

app.use("/auth", authRoutes);


app.use("/optimization", optimizationRoutes);
app.use("/optimization", locationRoutes);


// Global Error Handler MUST be the last middleware
app.use(errorHandler);

export default app;