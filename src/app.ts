import express from "express";
import rateLimit from "express-rate-limit";
import { requireApiKey } from "./middleware/apiKey";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health";
import { profileRouter } from "./routes/profile";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(healthRouter);

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
