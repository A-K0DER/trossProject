/**
 * Self-contained Swagger UI page: loads the swagger-ui-dist bundle from a
 * CDN and points it at /openapi.json, instead of using swagger-ui-express
 * (which serves its assets via express.static() — not reliable on
 * serverless hosts like Vercel, which bypass static-file middleware for
 * some routes). Works identically on any host since it's plain HTML.
 */
const SWAGGER_UI_VERSION = "5.17.14";

export const docsPageHtml = `<!doctype html>
<html>
  <head>
    <title>LinkedIn Profile API — Docs</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css"
    />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/openapi.json",
          dom_id: "#swagger-ui",
          presets: [SwaggerUIBundle.presets.apis],
        });
      };
    </script>
  </body>
</html>`;
