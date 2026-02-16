/**
 * Run this script once to authorize with Google and generate token.json.
 *
 * Usage: node src/auth.js
 */

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
require("dotenv").config();

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

async function authorize() {
  const credentialsPath = path.resolve(
    process.env.GOOGLE_CREDENTIALS_PATH || "./credentials.json"
  );
  const tokenPath = path.resolve(
    process.env.GOOGLE_TOKEN_PATH || "./token.json"
  );

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
  const { client_id, client_secret, redirect_uris } =
    credentials.installed || credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("\nAuthorize this app by visiting this URL:\n");
  console.log(authUrl);
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise((resolve) => {
    rl.question("Enter the authorization code: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
  console.log(`\nToken saved to ${tokenPath}`);
}

authorize().catch(console.error);
