import { Router } from "express";
import { getLinkedInProfile } from "../linkedin/profileService";
import { extractPublicIdentifier } from "../linkedin/urlParser";
import { getCached, setCached } from "../cache";

export const profileRouter = Router();

profileRouter.get("/profile", async (req, res, next) => {
  try {
    const url = req.query.url;
    if (typeof url !== "string" || url.trim().length === 0) {
      res.status(400).json({ error: "Query parameter `url` is required." });
      return;
    }

    const publicIdentifier = extractPublicIdentifier(url);

    const cached = getCached(publicIdentifier);
    if (cached) {
      res.json(cached);
      return;
    }

    const profile = await getLinkedInProfile(url);
    setCached(publicIdentifier, profile);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});
