import express from "express";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { requireApiKey } from "./middleware/apiKey";
import { errorHandler } from "./middleware/errorHandler";
import { openapiSpec } from "./openapi";
import { healthRouter } from "./routes/health";
import { profileRouter } from "./routes/profile";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(healthRouter);

  // Interactive API docs + "try it out" console. Unauthenticated and
  // outside the /api rate limiter — it's just documentation, and its own
  // "Try it out" requests still go through the real x-api-key check below.
  app.get("/openapi.json", (_req, res) => res.json(openapiSpec));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // Caps requests per client IP against *our* API. This is the main
  // defense against someone using a public deployment to hammer LinkedIn
  // through your session — LinkedIn-side throttling (see httpClient.ts)
  // only serializes requests, it doesn't cap overall volume.
  const apiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api", apiLimiter, requireApiKey, profileRouter);

  app.use(errorHandler);

  return app;
}
