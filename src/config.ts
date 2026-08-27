import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`
    );
  }
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  apiKey: process.env.API_KEY ?? "",
  linkedin: {
    liAt: process.env.LINKEDIN_LI_AT ?? "",
    jsessionId: process.env.LINKEDIN_JSESSIONID ?? "",
    userAgent:
      process.env.LINKEDIN_USER_AGENT ??
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    minRequestIntervalMs: Number(
      process.env.LINKEDIN_MIN_REQUEST_INTERVAL_MS ?? 1200
    ),
  },
  profileCacheTtlMs: Number(process.env.PROFILE_CACHE_TTL_MS ?? 3_600_000),
};

export function assertLinkedInCredentialsConfigured(): void {
  if (!config.linkedin.liAt || !config.linkedin.jsessionId) {
    throw new Error(
      "LinkedIn credentials are not configured. Set LINKEDIN_LI_AT and LINKEDIN_JSESSIONID (see .env.example)."
    );
  }
}

export { required };
