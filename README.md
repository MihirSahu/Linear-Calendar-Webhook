# Linear → Google Calendar Webhook

A self-hosted Node.js service that listens for Linear issue creation webhooks and automatically creates Google Calendar events with invites when issues have a specific label.

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
PORT=3000
```

### 4. Expose with Cloudflare Tunnel

```bash
# Install cloudflared if you haven't
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Quick test (gives you a temporary URL)
cloudflared tunnel --url http://localhost:3000

# For a permanent setup, create a named tunnel:
cloudflared tunnel create linear-calendar
cloudflared tunnel route dns linear-calendar linear-calendar.yourdomain.com
```

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: linear-calendar
credentials-file: /home/pi/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: linear-calendar.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

Then run:

```bash
cloudflared tunnel run linear-calendar
```

### 5. Set up the Linear webhook

1. Go to **Linear** → **Settings** → **API** → **Webhooks**.
2. Click **New webhook**.
3. Set the URL to: `https://linear-calendar.yourdomain.com/webhook/linear`
4. Select **Issues** as the resource and **Create** as the action.
5. Copy the signing secret into your `.env` as `LINEAR_WEBHOOK_SECRET`.

### 6. Run the service

```bash
npm start
```

### Running as a systemd service (recommended for Pi)

Create `/etc/systemd/system/linear-calendar.service`:

```ini
[Unit]
Description=Linear Calendar Webhook
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/linear-calendar-webhook
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
EnvironmentFile=/home/pi/linear-calendar-webhook/.env

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl enable linear-calendar
sudo systemctl start linear-calendar
```
