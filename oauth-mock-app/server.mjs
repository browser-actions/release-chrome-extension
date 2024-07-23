import http from "node:http";
import readline from "node:readline";
import { google } from "googleapis";
import open from "open";

const prompt = async (msg) => {
  console.log(msg);
  const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    input.question("> ", (answer) => {
      resolve(answer.trim());
      input.close();
    });
  });
};

const OAUTH_APP_SERVER_PORT = 12345;
const OAUTH_SCOPES = ["https://www.googleapis.com/auth/chromewebstore"];
const OAUTH_REDIRECT_URI = `http://localhost:${OAUTH_APP_SERVER_PORT}/oauth2callback`;

async function run() {
  const clientId = await prompt("Enter the client id");
  const clientSecret = await prompt("Enter the client secret");

  const oauth2 = new google.auth.OAuth2(
    clientId,
    clientSecret,
    OAUTH_REDIRECT_URI,
  );

  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: OAUTH_SCOPES,
  });

  await open(url);
  console.log(`Open the following URL in your browser:

    ${url}

`);

  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(500);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname !== "/oauth2callback") {
      res.writeHead(404);
      res.end();
      return;
    }

    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(400);
      res.end();
      return;
    }

    const { tokens } = await oauth2.getToken(code);
    console.log(`Refresh token: ${tokens.refresh_token}`);

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("You can close this window now.");

    server.close();
    process.exit(0);
  });
  server.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
  server.listen(OAUTH_APP_SERVER_PORT);
}

run();
