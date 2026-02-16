const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

let calendarClient = null;

/**
 * Load or create OAuth2 credentials and return an authorized calendar client.
 */
async function getCalendarClient() {
  if (calendarClient) return calendarClient;

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

  // Load saved token or prompt for authorization
  if (fs.existsSync(tokenPath)) {
    const token = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
    oAuth2Client.setCredentials(token);

    // Handle token refresh
    oAuth2Client.on("tokens", (tokens) => {
      const existing = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
      const updated = { ...existing, ...tokens };
      fs.writeFileSync(tokenPath, JSON.stringify(updated, null, 2));
      console.log("Refreshed Google OAuth token saved.");
    });
  } else {
    throw new Error(
      `No token found at ${tokenPath}. Run "node src/auth.js" first to authorize.`
    );
  }

  calendarClient = google.calendar({ version: "v3", auth: oAuth2Client });
  return calendarClient;
}

/**
 * Create a Google Calendar event and send invites to attendees.
 */
async function createEvent({ title, description, location, start, end, attendees }) {
  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  const event = {
    summary: title,
    description: description || "",
    location: location || "",
    start: {
      dateTime: start.toISOString(),
      timeZone: "America/Chicago", // Austin, TX
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: "America/Chicago",
    },
    attendees: (attendees || []).map((email) => ({ email })),
    reminders: {
      useDefault: true,
    },
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
    sendUpdates: "all", // sends invite emails to attendees
  });

  console.log(`Created calendar event: ${response.data.htmlLink}`);
  return response.data;
}

module.exports = { getCalendarClient, createEvent };
