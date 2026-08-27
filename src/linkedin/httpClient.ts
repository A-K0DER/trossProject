import axios, { AxiosInstance } from "axios";
import { config } from "../config";

const VOYAGER_BASE = "https://www.linkedin.com/voyager/api";

/**
 * A politeness gate: LinkedIn aggressively rate-limits and fingerprints
 * scraping traffic. Serializing outbound requests with a minimum spacing
 * is cheap insurance against tripping anti-abuse systems and is far more
 * important here than raw throughput.
 *
 * Callers (e.g. profileService's Promise.all over several sections) may
 * invoke this concurrently, so it's implemented as a promise chain — each
 * call queues behind the previous one — rather than a naive
 * check-then-set on a shared timestamp, which would race under
 * concurrency and let bursts through.
 */
let queue: Promise<void> = Promise.resolve();
function throttle(): Promise<void> {
  const next = queue.then(
    () => new Promise<void>((resolve) =>
      setTimeout(resolve, config.linkedin.minRequestIntervalMs)
    )
  );
  // Swallow rejections in the shared queue tail so one failed request
  // doesn't permanently wedge every subsequent call behind a rejected
  // promise.
  queue = next.catch(() => {});
  return next;
}

let client: AxiosInstance | null = null;

/**
 * A single shared axios instance carrying the LinkedIn session cookies.
 *
 * The `csrf-token` header must equal the (unquoted) JSESSIONID cookie value
 * — LinkedIn's Voyager API rejects same-origin-looking requests without it.
 * `accept: application/vnd.linkedin.normalized+json+2.1` is what causes the
 * API to return the fully "included"-decorated payload instead of a
 * near-empty stub — omitting it silently degrades responses rather than
 * erroring, which makes it an easy thing to miss while reverse engineering.
 */
export function getLinkedInClient(): AxiosInstance {
  if (client) return client;

  const cookie = `li_at=${config.linkedin.liAt}; JSESSIONID="${config.linkedin.jsessionId}"`;

  client = axios.create({
    baseURL: VOYAGER_BASE,
    timeout: 15_000,
    headers: {
      Cookie: cookie,
      "csrf-token": config.linkedin.jsessionId,
      Accept: "application/vnd.linkedin.normalized+json+2.1",
      "x-restli-protocol-version": "2.0.0",
      "User-Agent": config.linkedin.userAgent,
      "Accept-Language": "en-US,en;q=0.9",
    },
    validateStatus: () => true, // we handle status codes ourselves
    // Expired/invalid cookies make LinkedIn redirect to a login page
    // (which itself redirects), not return a clean 401 — auto-following
    // that spins into ERR_FR_TOO_MANY_REDIRECTS. Treat any redirect as an
    // auth failure instead.
    maxRedirects: 0,
  });

  return client;
}

export class LinkedInApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string
  ) {
    super(message);
    this.name = "LinkedInApiError";
  }
}

/**
 * GET a Voyager path with the shared authenticated client, throttled.
 * Treats 404/410 as "resource not available" rather than throwing, since
 * several profile sections legitimately 410 (deprecated) or 404 (not
 * applicable to a given profile) — callers decide how to handle that via
 * `allowMissing`.
 */
export async function voyagerGet<T>(
  path: string,
  opts: { allowMissing?: boolean } = {}
): Promise<T | null> {
  await throttle();
  const res = await getLinkedInClient().get(path);

  if (res.status === 200) {
    return res.data as T;
  }

  if ((res.status === 404 || res.status === 410) && opts.allowMissing) {
    return null;
  }

  if (res.status === 401 || res.status === 403 || (res.status >= 300 && res.status < 400)) {
    throw new LinkedInApiError(
      "LinkedIn rejected the request as unauthenticated (redirected to login or returned 401/403) — the li_at/JSESSIONID cookies are likely missing, invalid, or expired. Log into linkedin.com again and refresh them in .env.",
      res.status,
      path
    );
  }

  throw new LinkedInApiError(
    `Unexpected response from LinkedIn (${res.status})`,
    res.status,
    path
  );
}
