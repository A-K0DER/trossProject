import "dotenv/config";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  apiKey: process.env.API_KEY ?? "",
  linkedin: {
    defaultUserAgent: DEFAULT_USER_AGENT,
    minRequestIntervalMs: Number(
      process.env.LINKEDIN_MIN_REQUEST_INTERVAL_MS ?? 1200
    ),
  },
  profileCacheTtlMs: Number(process.env.PROFILE_CACHE_TTL_MS ?? 3_600_000),
};
