import { NextFunction, Request, Response } from "express";
import { InvalidLinkedInUrlError } from "../linkedin/urlParser";
import { LinkedInApiError } from "../linkedin/httpClient";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof InvalidLinkedInUrlError) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof LinkedInApiError) {
    // 502: LinkedIn (the upstream) misbehaved, not our own API.
    res.status(502).json({ error: err.message });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
}
