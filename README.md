# LinkedIn Profile API

A hosted HTTPS API that takes a LinkedIn profile URL and returns structured JSON — name,
headline, location, about, experience, certifications, languages, and more — by calling
LinkedIn's internal **Voyager** API directly over HTTP. There is no browser automation
anywhere in the request path; authentication and every profile field are fetched with
plain HTTP requests using a logged-in LinkedIn session's cookies.

```
GET /api/profile?url=https://www.linkedin.com/in/some-person/
```

## Table of contents

- [Approach](#approach)
- [Setup](#setup)
- [API documentation](#api-documentation)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)
- [Legal / ethical note](#legal--ethical-note)

## Approach

LinkedIn's public-facing web app talks to `https://www.linkedin.com/voyager/api/...`,
an internal API that is not documented and has no public terms for third-party use.
Reverse engineering it meant inspecting the authenticated requests LinkedIn's own
frontend makes and replaying the useful ones directly.

A few things fell out of that process that shaped the design:

- **The old, widely-documented endpoint is dead.** The classic
  `/identity/profiles/{id}/profileView` — the one most existing "LinkedIn scraper"
  write-ups reference — now returns `410 Gone`. LinkedIn has been migrating this
  surface piece by piece, and this project only relies on endpoints that were
  confirmed live and returning real data during development.
- **LinkedIn now runs three overlapping API generations** side by side: the old flat
  REST resources (some retired, some still alive), newer "dash" REST-li *finder*
  queries, and a GraphQL persisted-query layer (`/voyager/api/graphql?queryId=...`).
  This project uses whichever generation was confirmed working for a given piece of
  data — see the endpoint table below.
- **Auth is cookie-based, not a documented API key.** A logged-in browser session's
  `li_at` cookie (long-lived session token) and `JSESSIONID` cookie (also doubles as
  the CSRF token, sent back as the `csrf-token` header) are enough to call these
  endpoints directly with `axios`. No browser, headless or otherwise, is involved at
  request time — see `src/linkedin/httpClient.ts`.
- **The `Accept` header matters more than it looks.** Requests without
  `Accept: application/vnd.linkedin.normalized+json+2.1` return a near-empty stub
  response with `200 OK` — no error, just silently degraded data. This is the kind of
  thing that's easy to miss while reverse engineering and worth calling out.

### Confirmed-working endpoints

| Data | Method + path | API generation |
|---|---|---|
| Name, headline, about, location, profile photo | `GET /identity/dash/profiles?q=memberIdentity&memberIdentity={id}` | "dash" REST-li finder |
| Experience | `GET /identity/profiles/{id}/positionGroups` | classic REST.li |
| Certifications | `GET /identity/profiles/{id}/certifications` | classic REST.li |
| Languages | `GET /identity/profiles/{id}/languages` | classic REST.li |
| Projects / honors / publications / volunteer experience | `GET /identity/profiles/{id}/{resource}` | classic REST.li |

Everything is orchestrated in `src/linkedin/profileService.ts`: resolve the public
identifier from the input URL, fan the section requests out concurrently (through a
shared politeness throttle — see below), and normalize the raw REST.li shapes into
this project's own response schema (`src/linkedin/schema.ts`).

### Politeness / anti-ban posture

LinkedIn fingerprints and rate-limits automated traffic aggressively. This project:

- serializes all outbound LinkedIn requests through a minimum-spacing queue
  (`LINKEDIN_MIN_REQUEST_INTERVAL_MS`, default 1.2s) rather than firing them in a
  burst, even though the section fetches are logically concurrent;
- caches a resolved profile in memory for `PROFILE_CACHE_TTL_MS` (default 1h) so
  repeat lookups of the same profile don't re-hit LinkedIn;
- rate-limits *this* API per client IP (30 req/min by default) so a public deployment
  can't be used to hammer LinkedIn through your session by a third party;
- gates the API behind your own `x-api-key`, unrelated to the LinkedIn credentials.

None of this makes automated access compliant with LinkedIn's Terms of Service — see
[Legal / ethical note](#legal--ethical-note).

## Setup

### Prerequisites

- Node.js 18+
- A LinkedIn account you're comfortable using for this (your own, per the assignment)

### 1. Get your LinkedIn session cookies

1. Log into [linkedin.com](https://www.linkedin.com) in a normal browser.
2. Open DevTools → **Application** (Chrome) or **Storage** (Firefox) → **Cookies** →
   `https://www.linkedin.com`.
3. Copy the raw values (no surrounding quotes) of:
   - `li_at`
   - `JSESSIONID` (LinkedIn stores this with literal `"` characters around the value in
     the cookie jar — copy just the value between them)
4. Optional: from the **Network** tab, copy the `User-Agent` of any request. Using the
   same one your cookies were issued to is slightly more consistent, though not load-bearing.

These are session credentials, not API keys — treat `li_at` like a password. It
typically stays valid for ~1 year unless you log out, but LinkedIn can invalidate it
sooner (e.g. suspicious activity, password change).

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `LINKEDIN_LI_AT` and `LINKEDIN_JSESSIONID` from step 1. Set your own `API_KEY`
(any string you choose) — this is the key *your* API's clients will send, not
anything LinkedIn-related. See `.env.example` for all options.

### 3. Install, build, run

```bash
npm install
npm run dev      # tsx dev server with reload
# or
npm run build && npm start   # production build
```

The server listens on `PORT` (default `3000`).

### 4. Try it

```bash
curl -H "x-api-key: $API_KEY" \
  "http://localhost:3000/api/profile?url=https://www.linkedin.com/in/some-person/"
```

## API documentation

### `GET /health`

No auth required. Returns `{"status": "ok"}` — useful as a deploy health check.

### `GET /api/profile?url=<linkedin-profile-url>`

Requires header `x-api-key: <your API_KEY>` if `API_KEY` is set.

`url` accepts a full profile URL (`https://www.linkedin.com/in/some-person/`) or a
bare public identifier (`some-person`).

**Response** (`200`):

```jsonc
{
  "requestedUrl": "https://www.linkedin.com/in/some-person/",
  "publicIdentifier": "some-person",
  "publicProfileUrl": "https://www.linkedin.com/in/some-person/",
  "fetchedAt": "2026-08-27T12:00:00.000Z",
  "profile": {
    "firstName": "Jane",
    "lastName": "Doe",
    "fullName": "Jane Doe",
    "headline": "Engineering Lead at Example Corp",
    "location": "San Francisco Bay Area",
    "about": "...",
    "profileImageUrl": "https://media.licdn.com/...",
    "backgroundImageUrl": null
  },
  "experience": [
    {
      "title": "Engineering Lead",
      "companyName": "Example Corp",
      "companyUrl": "https://www.linkedin.com/company/example-corp",
      "location": "San Francisco, CA",
      "description": "...",
      "startDate": { "month": 3, "year": 2021 },
      "endDate": null,
      "isCurrent": true
    }
  ],
  "education": [],
  "skills": [],
  "certifications": [ { "name": "...", "issuingOrganization": "...", "issueDate": null, "credentialId": null, "credentialUrl": null } ],
  "languages": [ { "name": "English", "proficiency": "Native or bilingual" } ],
  "projects": [],
  "honors": [],
  "publications": [],
  "volunteerExperience": [],
  "warnings": [
    "education and skills could not be retrieved: ..."
  ]
}
```

`education` and `skills` are always present as empty arrays with an explanatory entry
in `warnings` — see [Known limitations](#known-limitations).

**Error responses:**

| Status | Meaning |
|---|---|
| `400` | Missing/invalid `url`, or not a LinkedIn profile URL |
| `401` | Missing/invalid `x-api-key` |
| `429` | You've exceeded this API's own rate limit |
| `502` | LinkedIn rejected the upstream request (expired cookies) or returned something unexpected |

## Deployment

Any Node-capable host works (the `Dockerfile` in this repo builds a minimal
production image). Whichever you choose:

1. Set `LINKEDIN_LI_AT`, `LINKEDIN_JSESSIONID`, and `API_KEY` as the platform's
   **secret/environment variables** — never commit them.
2. Point the platform at `npm run build && npm start` (or use the Dockerfile).
3. Confirm HTTPS is terminated by the platform (Render/Railway/Fly all do this by
   default on their generated domains).

## Known limitations

- **Education and skills are not retrievable.** The flat REST endpoints these used to
  live at (`/identity/profiles/{id}/educations`, `.../skills`) now return `410 Gone`.
  LinkedIn moved this behind its GraphQL persisted-query layer
  (`/voyager/api/graphql?queryId=<name>.<hash>`), where the `queryId` hash is
  deploy-specific and rotates over time — hardcoding one captured today would likely
  stop working within weeks, so it was deliberately left out rather than shipped as
  something that looks reliable but silently breaks. `src/linkedin/profileService.ts`
  has a clear extension point: capture a current `queryId` from your browser's
  DevTools Network tab while viewing a profile, add a fetcher following the pattern
  of `fetchTopCard.ts`, and drop it in.
- **Session cookies expire/rotate.** If `li_at` is invalidated (logout, password
  change, LinkedIn flagging the session), every request fails with a `502` and a
  message telling you to refresh `.env`. There's no automated re-login — that would
  require handling LinkedIn's login form, 2FA, and CAPTCHA challenges, all of which
  are explicitly out of scope for a credential-based integration like this one.
- **Ban / throttling risk is real and not fully eliminable.** The politeness
  measures above reduce risk but LinkedIn can still flag an account for automated
  access patterns. Use an account you're comfortable putting at risk, and expect to
  need to refresh cookies occasionally.
- **Field coverage on certifications/languages/projects/etc. is best-effort.** Those
  endpoints were confirmed live and returning valid (if empty, for the profiles used
  during development) collections, but their exact field names weren't verified
  against populated real data in this session — `parseCollections.ts` tries several
  plausible field-name aliases defensively, but a mismatch degrades a field to `null`
  rather than breaking the response.
- **Only public-identifier profile URLs are supported** (`/in/{id}/`), not
  `/in/{numeric-id}` legacy formats or company pages.
- **Profile visibility settings apply.** A viewer's own network/connection degree and
  the target's privacy settings affect what LinkedIn returns to that session,
  independent of anything this API does.
- **Image URLs are signed LinkedIn CDN links** and can expire; they are not
  re-hosted or cached by this API.

## Legal / ethical note

This uses an undocumented, internal LinkedIn API via a personal account's session
cookie, which is very likely a violation of LinkedIn's Terms of Service regardless of
technical politeness measures. It's built here as a technical reverse-engineering
exercise per the assignment; anyone deploying or extending it should independently
evaluate that risk (account suspension, legal exposure under LinkedIn's ToS/CFAA-style
claims in some jurisdictions) before using it against real accounts or at any scale.
