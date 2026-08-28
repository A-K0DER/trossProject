// Hand-written OpenAPI 3.0 spec describing this API's actual routes and
// response schema (src/linkedin/schema.ts), so it stays a single source of
// truth to keep in sync rather than being derived/guessed separately.

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "LinkedIn Profile API",
    version: "1.0.0",
    description:
      "Takes a LinkedIn profile URL and returns structured JSON by calling LinkedIn's internal Voyager API directly over HTTP (no browser automation at request time). LinkedIn session cookies are supplied per-request in the request body, not held server-side. See the README for the reverse-engineering approach and known limitations.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Health", description: "Deploy/uptime check" },
    { name: "Profile", description: "LinkedIn profile lookup" },
  ],
  components: {
    securitySchemes: {
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description:
          "Your own API_KEY (unrelated to LinkedIn credentials). Omitted/ignored entirely if API_KEY is unset on the server.",
      },
    },
    schemas: {
      DateParts: {
        type: "object",
        properties: {
          month: { type: "integer", nullable: true },
          year: { type: "integer", nullable: true },
        },
      },
      ExperienceEntry: {
        type: "object",
        properties: {
          title: { type: "string", nullable: true },
          companyName: { type: "string", nullable: true },
          companyUrl: { type: "string", nullable: true },
          location: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          startDate: { $ref: "#/components/schemas/DateParts", nullable: true },
          endDate: { $ref: "#/components/schemas/DateParts", nullable: true },
          isCurrent: { type: "boolean" },
        },
      },
      CertificationEntry: {
        type: "object",
        properties: {
          name: { type: "string", nullable: true },
          issuingOrganization: { type: "string", nullable: true },
          issueDate: { $ref: "#/components/schemas/DateParts", nullable: true },
          credentialId: { type: "string", nullable: true },
          credentialUrl: { type: "string", nullable: true },
        },
      },
      LanguageEntry: {
        type: "object",
        properties: {
          name: { type: "string", nullable: true },
          proficiency: { type: "string", nullable: true },
        },
      },
      SimpleEntry: {
        type: "object",
        properties: {
          name: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
        },
      },
      EducationEntry: {
        type: "object",
        description:
          "Always an empty array today — see 'Known limitations' in the README.",
        properties: {
          schoolName: { type: "string", nullable: true },
          degreeName: { type: "string", nullable: true },
          fieldOfStudy: { type: "string", nullable: true },
          startDate: { $ref: "#/components/schemas/DateParts", nullable: true },
          endDate: { $ref: "#/components/schemas/DateParts", nullable: true },
          description: { type: "string", nullable: true },
        },
      },
      SkillEntry: {
        type: "object",
        description:
          "Always an empty array today — see 'Known limitations' in the README.",
        properties: {
          name: { type: "string", nullable: true },
          endorsementCount: { type: "integer", nullable: true },
        },
      },
      LinkedInProfileResponse: {
        type: "object",
        properties: {
          requestedUrl: { type: "string" },
          publicIdentifier: { type: "string" },
          publicProfileUrl: { type: "string" },
          fetchedAt: { type: "string", format: "date-time" },
          profile: {
            type: "object",
            properties: {
              firstName: { type: "string", nullable: true },
              lastName: { type: "string", nullable: true },
              fullName: { type: "string", nullable: true },
              headline: { type: "string", nullable: true },
              location: { type: "string", nullable: true },
              about: { type: "string", nullable: true },
              profileImageUrl: { type: "string", nullable: true },
              backgroundImageUrl: { type: "string", nullable: true },
            },
          },
          experience: {
            type: "array",
            items: { $ref: "#/components/schemas/ExperienceEntry" },
          },
          education: {
            type: "array",
            items: { $ref: "#/components/schemas/EducationEntry" },
          },
          skills: {
            type: "array",
            items: { $ref: "#/components/schemas/SkillEntry" },
          },
          certifications: {
            type: "array",
            items: { $ref: "#/components/schemas/CertificationEntry" },
          },
          languages: {
            type: "array",
            items: { $ref: "#/components/schemas/LanguageEntry" },
          },
          projects: {
            type: "array",
            items: { $ref: "#/components/schemas/SimpleEntry" },
          },
          honors: {
            type: "array",
            items: { $ref: "#/components/schemas/SimpleEntry" },
          },
          publications: {
            type: "array",
            items: { $ref: "#/components/schemas/SimpleEntry" },
          },
          volunteerExperience: {
            type: "array",
            items: { $ref: "#/components/schemas/SimpleEntry" },
          },
          warnings: { type: "array", items: { type: "string" } },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      ProfileRequest: {
        type: "object",
        required: ["url", "liAt", "jsessionId"],
        properties: {
          url: {
            type: "string",
            description:
              "A full profile URL (https://www.linkedin.com/in/some-person/) or a bare public identifier (some-person).",
            example: "https://www.linkedin.com/in/some-person/",
          },
          liAt: {
            type: "string",
            description:
              "The `li_at` cookie value from a logged-in linkedin.com session. Treat like a password — this is a live session credential, not an API key.",
          },
          jsessionId: {
            type: "string",
            description:
              "The `JSESSIONID` cookie value from the same session (copy just the value between the literal quotes LinkedIn stores it with).",
          },
          userAgent: {
            type: "string",
            nullable: true,
            description:
              "Optional. The User-Agent the cookies were issued to. Falls back to a default if omitted.",
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "No auth required. Useful as a deploy health check.",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/profile": {
      post: {
        tags: ["Profile"],
        summary: "Fetch a structured LinkedIn profile",
        security: [{ apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProfileRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Structured profile data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LinkedInProfileResponse" },
              },
            },
          },
          "400": {
            description:
              "Missing/invalid `url`, `liAt`, or `jsessionId`, or `url` is not a LinkedIn profile URL",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Error" } },
            },
          },
          "401": {
            description: "Missing or invalid x-api-key header",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Error" } },
            },
          },
          "429": {
            description: "Exceeded this API's own rate limit (30 req/min per IP by default)",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Error" } },
            },
          },
          "502": {
            description:
              "LinkedIn rejected the upstream request (e.g. expired session cookies) or returned something unexpected",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Error" } },
            },
          },
        },
      },
    },
  },
} as const;
