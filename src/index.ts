import fs from "node:fs";
import * as core from "@actions/core";
import { CWSClient } from "./cws";

async function run(): Promise<void> {
  const clientId = core.getInput("oauth-client-id");
  const clientSecret = core.getInput("oauth-client-secret");
  const refreshToken = core.getInput("oauth-refresh-token");
  const extensionId = core.getInput("extension-id");
  const extensionPath = core.getInput("extension-path");

  const c = new CWSClient({ clientId, clientSecret, refreshToken });

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
}

(async () => {
  try {
    await run();
  } catch (error) {
    core.setFailed(String(error));
  }
})();
