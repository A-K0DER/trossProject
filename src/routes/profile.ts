import { Router } from "express";
import { getLinkedInProfile } from "../linkedin/profileService";
import { extractPublicIdentifier } from "../linkedin/urlParser";
import { getCached, setCached } from "../cache";

export const profileRouter = Router();

function requireStringField(
  body: Record<string, unknown>,
  field: string
): string | null {
  const value = body[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value;
}

profileRouter.post("/profile", async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const url = requireStringField(body, "url");
    if (!url) {
      res.status(400).json({ error: "Body field `url` is required." });
      return;
    }

    const liAt = requireStringField(body, "liAt");
    if (!liAt) {
      res.status(400).json({ error: "Body field `liAt` is required." });
      return;
    }

    const jsessionId = requireStringField(body, "jsessionId");
    if (!jsessionId) {
      res.status(400).json({ error: "Body field `jsessionId` is required." });
      return;
    }

    const userAgent =
      typeof body.userAgent === "string" && body.userAgent.trim().length > 0
        ? body.userAgent
        : undefined;

    const publicIdentifier = extractPublicIdentifier(url);

    const cached = getCached(publicIdentifier);
    if (cached) {
      res.json(cached);
      return;
    }

    const profile = await getLinkedInProfile(url, {
      liAt,
      jsessionId,
      userAgent,
    });
    setCached(publicIdentifier, profile);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});
