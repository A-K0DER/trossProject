import { config } from "./config";
import { LinkedInProfileResponse } from "./linkedin/schema";

interface CacheEntry {
  data: LinkedInProfileResponse;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export function getCached(publicIdentifier: string): LinkedInProfileResponse | null {
  const entry = store.get(publicIdentifier);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(publicIdentifier);
    return null;
  }
  return entry.data;
}

export function setCached(
  publicIdentifier: string,
  data: LinkedInProfileResponse
): void {
  store.set(publicIdentifier, {
    data,
    expiresAt: Date.now() + config.profileCacheTtlMs,
  });
}
