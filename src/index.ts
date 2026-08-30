import fs from "node:fs";
import { CWSClient } from "./cws";

async function run(): Promise<void> {
  // @actions/core is ESM-only (since v3), and this project's build output
  // must stay CommonJS, so it's imported dynamically here.
  const core = await import("@actions/core");

  try {
    const clientId = core.getInput("oauth-client-id");
    const clientSecret = core.getInput("oauth-client-secret");
    const refreshToken = core.getInput("oauth-refresh-token");
    const extensionId = core.getInput("extension-id");
    const extensionPath = core.getInput("extension-path");

    const c = new CWSClient({
      clientId,
      clientSecret,
      refreshToken,
      // Overridable via env vars (not action inputs) so e2e tests can point
      // the client at a local mock server instead of the real Chrome Web
      // Store API / Google OAuth2 token endpoint. Unset in normal use.
      apiOrigin: process.env.CWS_API_ORIGIN,
      googleApiOrigin: process.env.GOOGLE_API_ORIGIN,
    });

    const zip = await fs.openAsBlob(extensionPath);
    const uploadResult = await c.updateItem(extensionId, zip);
    if (
      uploadResult.uploadState !== "SUCCESS" &&
      uploadResult.uploadState !== "IN_PROGRESS"
    ) {
      throw new Error(
        `Failed to upload: ${uploadResult.uploadState} ${JSON.stringify(
          uploadResult.itemError,
        )}`,
      );
    }

    core.info(`Uploaded extension: ${uploadResult.id}`);

    const publishResult = await c.publishItem(extensionId);
    console.log(`Published with result: ${publishResult.status.join(", ")}`);
  } catch (error) {
    core.setFailed(String(error));
  }
}

run();
