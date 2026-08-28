import { Container, getContainer } from "@cloudflare/containers";
import { env } from "cloudflare:workers";

interface Env {
  LINKEDIN_API: DurableObjectNamespace<LinkedInApiContainer>;
  API_KEY: string;
}

export class LinkedInApiContainer extends Container<Env> {
  defaultPort = 3000;
  sleepAfter = "10m";
  pingEndpoint = "/health";
  envVars = {
    // LinkedIn session cookies are no longer server-side config — callers
    // pass them per-request in the POST /api/profile body. Only this
    // API's own auth key stays a server secret.
    API_KEY: env.API_KEY,
    PORT: "3000",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Single-instance deployment: this API is meant to run as one server,
    // not scaled out, so every request routes to the same container.
    const container = getContainer(env.LINKEDIN_API, "singleton");
    return container.fetch(request);
  },
};
