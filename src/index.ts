import { createApp } from "./app";
import { config, assertLinkedInCredentialsConfigured } from "./config";

assertLinkedInCredentialsConfigured();

const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`LinkedIn Profile API listening on port ${config.port}`);
});
