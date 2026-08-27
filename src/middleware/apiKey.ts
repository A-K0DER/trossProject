import { NextFunction, Request, Response } from "express";
import { config } from "../config";

/**
 * Gates this API behind an API key of our own choosing (unrelated to
 * LinkedIn auth). Without this, a publicly hosted deployment would let
 * anyone use your LinkedIn session as a free scraping proxy. Disabled
 * automatically if API_KEY is left unset, e.g. for local development.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  if (!config.apiKey) {
    next();
    return;
  }

  const provided = req.header("x-api-key");
  if (provided !== config.apiKey) {
    res.status(401).json({ error: "Missing or invalid x-api-key header." });
    return;
  }

  next();
}
