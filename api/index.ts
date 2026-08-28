import { createApp } from "../src/app";

// Vercel serverless entrypoint. All routes are rewritten here (see
// vercel.json) and handled by the same Express app used for
// Node/Docker deployments — no app.listen(), Vercel owns the HTTP server.
export default createApp();
