# Linear → Google Calendar Webhook + iMessage Integration

A self-hosted Node.js service that listens for Linear issue creation webhooks and automatically creates Google Calendar events with invites when issues have a specific label. Also supports creating Linear issues from iMessages via an iOS Shortcut.

## How It Works

1. You create a Linear issue with the `calendar` label (configurable).
2. Linear sends a webhook to this service.
3. The service parses event details from the issue description.
4. A Google Calendar event is created and invites are sent to specified attendees.

## Issue Description Format

Include these fields anywhere in your Linear issue description:

```
Start: 2026-02-20 10:00 AM
End: 2026-02-20 11:00 AM
Location: 123 Main St, Austin TX
Attendees: alice@example.com, bob@example.com

Discuss the Q1 roadmap and assign owners.
```

- **Start** (required) — parsed by JavaScript's `Date` constructor, so most formats work.
- **End** (optional) — defaults to 1 hour after start if omitted.
- **Location** (optional)
- **Attendees** (optional) — comma-separated email addresses.
- Everything else becomes the event description.

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd linear-calendar-webhook
npm install
cp .env.example .env
```

### 2. Google Calendar API credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or use an existing one).
3. Enable the **Google Calendar API**.
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**.
5. Choose **Desktop app** as the application type.
6. Download the JSON file and save it as `credentials.json` in the project root.
7. Run the auth script:

```bash
npm run auth
```

This will give you a URL to visit, authorize, and paste the code back. A `token.json` file will be saved for future use.

### 3. Configure environment variables

Edit `.env`:

```env
LINEAR_WEBHOOK_SECRET=your_secret_here
LINEAR_LABEL_NAME=calendar
GOOGLE_CALENDAR_ID=primary
TIMEZONE=America/Chicago
PORT=3000
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINEAR_TEAM_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
IMESSAGE_WEBHOOK_SECRET=some-long-random-string
```

### 4. Expose with Cloudflare Tunnel

If you're running `cloudflared` in a Docker container, use `--network host` so it can reach the webhook service on `localhost:3000`. Without this, `localhost` inside the container refers to the container itself, not the host machine.

```bash
docker run -d --restart unless-stopped --network host \
  --name cloudflared cloudflare/cloudflared:latest \
  tunnel --no-autoupdate run --token <your-tunnel-token>
```

Then configure the route in the Cloudflare One dashboard:

1. Go to **Networks** → **Connectors** and select your tunnel.
2. Open the **Published Application Routes** tab.
3. Add a new route with your desired subdomain (e.g. `linear-calendar.yourdomain.com`) and set the service to `http://localhost:3000`.

If your domain is already onboarded on Cloudflare, this will automatically create a DNS record for the subdomain you choose.

### 5. Set up the Linear webhook

1. Go to **Linear** → **Settings** → **API** → **Webhooks**.
2. Click **New webhook**.
3. Set the URL to: `https://linear-calendar.yourdomain.com/webhook/linear`
4. Select **Issues** as the resource and **Create** as the action.
5. Copy the signing secret into your `.env` as `LINEAR_WEBHOOK_SECRET`.

### 6. Set up the iMessage → Linear integration

#### Get your Linear API key and team ID

1. Go to **Linear** → **Settings** → **API** → **Personal API keys**.
2. Create a new key and copy it into your `.env` as `LINEAR_API_KEY`.
3. Go to **Settings** → **Teams**, click your team, and copy the team ID from the URL into `LINEAR_TEAM_ID`.

#### Generate a webhook secret

Pick a random string for `IMESSAGE_WEBHOOK_SECRET` — this authenticates requests to the endpoint. You can generate one with:

```bash
openssl rand -hex 32
```

#### Create the iOS Shortcut

1. Open **Shortcuts** on your iPhone.
2. Create a new Shortcut with these actions:
   - **Get Contents of URL**:
     - URL: `https://your-domain.com/webhook/imessage`
     - Method: **POST**
     - Headers: `Authorization` → `Bearer <your-IMESSAGE_WEBHOOK_SECRET>`
     - Request Body: **JSON** → key `text`, value: **Shortcut Input**
3. Go to the **Automation** tab → **New Automation**.
4. Choose **Message** trigger:
   - **Message Contains:** `@linear`
   - Optionally filter by **Sender** to limit to a specific chat.
5. Set the action to **Run Shortcut** → select the shortcut you just created, passing the **message text** as input.
6. Disable **Ask Before Running** for hands-free operation.

Now, any incoming iMessage containing `@linear` will automatically create a Linear issue. For example, a message like `@linear Fix the login page bug` creates an issue titled "Fix the login page bug".

### 7. Run with Docker

```bash
docker compose up -d
```

This builds the image, maps port 3000, loads your `.env`, and mounts `credentials.json` and `token.json` into the container.

To view logs:

```bash
docker compose logs -f
```

To stop:

```bash
docker compose down
```
