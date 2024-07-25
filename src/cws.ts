import { google } from "googleapis";

type UploadState = "FAILURE" | "IN_PROGRESS" | "NOT_FOUND" | "SUCCESS";

type ItemReponse = {
  kind: "chromewebstore#item";
  id: string;
  publicKey: string;
  uploadState: UploadState;
  itemError?: Array<unknown>;
};

type PublishStatus =
  | "OK"
  | "NOT_AUTHORIZED"
  | "INVALID_DEVELOPER"
  | "DEVELOPER_NO_OWNERSHIP"
  | "DEVELOPER_SUSPENDED"
  | "ITEM_NOT_FOUND"
  | "ITEM_PENDING_REVIEW"
  | "ITEM_TAKEN_DOWN"
  | "PUBLISHER_SUSPENDED";

type PublishResponse = {
  kind: "chromewebstore#item";
  item_id: string;
  status: Array<PublishStatus>;
  statusDetail: Array<unknown>;
};

const ORIGIN = "https://www.googleapis.com";

export class CWSClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;

  private accessToken: string | null = null;

  constructor({
    clientId,
    clientSecret,
    refreshToken,
  }: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
  }

  async getItem(
    extensionId: string,
    projection: "DRAFT",
  ): Promise<ItemReponse> {
    return this.proceed<ItemReponse>(
      "GET",
      `/chromewebstore/v1.1/items/${extensionId}?projection=${projection}`,
    );
  }

  async updateItem(extensionId: string, zip: Blob): Promise<ItemReponse> {
    return this.proceed<ItemReponse>(
      "PUT",
      `/upload/chromewebstore/v1.1/items/${extensionId}`,
      zip,
    );
  }

  async publishItem(extensionId: string): Promise<PublishResponse> {
    return this.proceed<PublishResponse>(
      "POST",
      `/chromewebstore/v1.1/items/${extensionId}/publish`,
    );
  }

  private async proceed<T>(
    method: string,
    path: string,
    body?: Blob,
  ): Promise<T> {
    await this.getAccessToken();

    const url = `${ORIGIN}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      "x-goog-api-version": "2",
    };

    const resp = await fetch(url, { method, headers, body });
    if (resp.status >= 400) {
      throw new Error(
        `Failed to ${method} ${url}: ${resp.status} ${
          resp.statusText
        } ${await resp.text()}`,
      );
    }

    return (await resp.json()) as T;
  }

  private async getAccessToken(): Promise<void> {
    if (this.accessToken) {
      return;
    }

    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
    );
    oauth2Client.setCredentials({ refresh_token: this.refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();
    if (!credentials?.access_token) {
      throw new Error("Failed to get access token");
    }
    this.accessToken = credentials.access_token;
  }
}
