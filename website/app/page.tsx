const featureCards = [
  {
    icon: "01",
    title: "Linear -> Calendar automation",
    description:
      "Tagged Linear issues trigger Google Calendar event creation with invite delivery and label-based filtering.",
    detail: 'POST /webhook/linear · default label "calendar"',
  },
  {
    icon: "02",
    title: "Description parsing",
    description:
      "Parses Start, End, Location, and Attendees from issue text and keeps the remaining body as the meeting notes.",
    detail: "Fields: Start, End, Location, Attendees · missing end defaults to +1 hour",
  },
  {
    icon: "03",
    title: "iMessage capture",
    description:
      "An iOS Shortcut can POST `@linear` messages to the webhook and create a new Linear issue through the GraphQL API.",
    detail: "POST /webhook/imessage · bearer-token protected endpoint",
  },
] as const;

const setupSteps = [
  {
    step: "01",
    title: "Install and authorize",
    summary:
      "Install the service, create your env file, and run the one-time Google authorization flow.",
    snippet: `git clone <your-repo-url>
cd linear-calendar-webhook
npm install
cp .env.example .env
npm run auth`,
  },
  {
    step: "02",
    title: "Configure environment",
    summary:
      "Set the core values the service needs for Linear filtering, Google Calendar, and runtime configuration.",
    snippet: `LINEAR_WEBHOOK_SECRET=your_secret_here
LINEAR_LABEL_NAME=calendar
GOOGLE_CALENDAR_ID=primary
TIMEZONE=America/Chicago
PORT=3000`,
  },
  {
    step: "03",
    title: "Expose and register webhook",
    summary:
      "Run Cloudflare Tunnel, publish a route to localhost:3000, and point Linear issue-create webhooks at the public URL.",
    snippet: `docker run -d --restart unless-stopped --network host \\
  --name cloudflared cloudflare/cloudflared:latest \\
  tunnel --no-autoupdate run --token <your-tunnel-token>

Linear webhook:
https://linear-calendar.yourdomain.com/webhook/linear`,
  },
  {
    step: "04",
    title: "Optional iMessage flow and Docker run",
    summary:
      "Add the Shortcut and Messages automation if you want incoming texts containing `@linear` to create issues automatically, then run the service with Docker Compose.",
    snippet: `LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINEAR_TEAM_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
IMESSAGE_WEBHOOK_SECRET=some-long-random-string

Messages automation trigger:
incoming message contains "@linear"

Shortcut action:
POST https://linear-calendar-webhook.mihirsahu.sh/webhook/imessage
Header: Authorization: Bearer <your-IMESSAGE_WEBHOOK_SECRET>
Body: { "text": "Shortcut Input" }

docker compose up -d
docker compose logs -f
docker compose down`,
  },
] as const;

const heroSummary = `Linear issue
  -> verify signature
  -> require matching label
  -> create Google Calendar event

iMessage text
  -> bearer auth
  -> strip @linear
  -> create Linear issue`;

const heroDescription =
  "Linear issue creation can schedule Google Calendar events automatically, and iMessages can be turned into Linear issues through a Shortcut.";

const setupSourceNote =
  "Summarized from README.md and grouped into the shortest useful onboarding path.";

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="background-orb background-orb-left" aria-hidden="true" />
      <div className="background-orb background-orb-right" aria-hidden="true" />

      <header className="site-header">
        <div className="container nav-row">
          <a className="brand-mark" href="#top">
            <span className="brand-copy">
              <strong>Linear Calendar Webhook</strong>
              <span>Self-hosted automation</span>
            </span>
          </a>
          <nav className="nav-links" aria-label="Primary">
            <a href="#capabilities">Capabilities</a>
            <a href="#setup">Setup</a>
            <a
              className="header-link"
              href="https://github.com/MihirSahu/Linear-Calendar-Webhook"
              target="_blank"
              rel="noreferrer"
              aria-label="Linear Calendar Webhook on GitHub"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                className="header-link-icon"
              >
                <path
                  fill="currentColor"
                  d="M12 .5C5.649.5.5 5.649.5 12A11.5 11.5 0 0 0 8.36 22.04c.575.106.786-.25.786-.556 0-.274-.01-1-.015-1.963-3.251.707-3.937-1.566-3.937-1.566-.532-1.352-1.3-1.712-1.3-1.712-1.063-.727.08-.712.08-.712 1.175.083 1.793 1.206 1.793 1.206 1.044 1.789 2.739 1.272 3.406.973.106-.756.409-1.272.744-1.564-2.595-.295-5.324-1.297-5.324-5.773 0-1.275.456-2.318 1.204-3.136-.12-.296-.522-1.486.114-3.099 0 0 .983-.315 3.22 1.198A11.207 11.207 0 0 1 12 6.174c.993.004 1.993.134 2.928.395 2.236-1.513 3.218-1.198 3.218-1.198.638 1.613.236 2.803.116 3.099.75.818 1.202 1.861 1.202 3.136 0 4.487-2.733 5.474-5.337 5.763.42.36.794 1.07.794 2.157 0 1.558-.014 2.814-.014 3.197 0 .31.207.668.792.555A11.502 11.502 0 0 0 23.5 12C23.5 5.649 18.351.5 12 .5Z"
                />
              </svg>
            </a>
          </nav>
        </div>
      </header>

      <section id="top" className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Self-hosted Linear automation</span>
            <h1>Turn tagged issues into scheduled meetings.</h1>
            <p className="hero-description">{heroDescription}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#setup">
                Read setup
              </a>
            </div>
            <div className="hero-meta">
              <span>Linear -&gt; Google Calendar</span>
              <span>iMessage -&gt; Linear</span>
            </div>
          </div>

          <aside className="hero-rail">
            <div className="terminal-card">
              <div className="terminal-topline">
                <span className="terminal-dot" />
                <span>service summary</span>
              </div>
              <pre className="terminal-code">
                <code>{heroSummary}</code>
              </pre>
            </div>
          </aside>
        </div>
      </section>

      <section id="capabilities" className="section">
        <div className="container">
          <div className="section-heading">
            <p className="section-kicker">Core capabilities</p>
            <h2>Automation for Linear issues, event parsing, and iMessage capture</h2>
            <p className="section-copy">
              The project is intentionally narrow: receive a tagged issue,
              extract schedule data, or capture a new issue from a message.
            </p>
          </div>

          <div className="feature-grid feature-grid-tight">
            {featureCards.map((feature) => (
              <article className="feature-card feature-card-text" key={feature.title}>
                <div className="feature-copy">
                  <span className="feature-icon" aria-hidden="true">
                    {feature.icon}
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <span className="feature-detail">{feature.detail}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="setup" className="section">
        <div className="container">
          <div className="section-heading">
            <p className="section-kicker">Setup summary</p>
            <h2>Install, expose, and run the service in four steps</h2>
            <p className="section-copy">{setupSourceNote}</p>
          </div>

          <div className="setup-list">
            {setupSteps.map((step) => (
              <article className="setup-card" key={step.step}>
                <div className="setup-header">
                  <span className="setup-step">{step.step}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.summary}</p>
                  </div>
                </div>
                <pre className="setup-code">
                  <code>{step.snippet}</code>
                </pre>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-row">
          <p>Linear Calendar Webhook</p>
          <p>Built for people with calendar-obsessed girlfriends</p>
          <a
            className="footer-github-link"
            href="https://github.com/MihirSahu/Linear-Calendar-Webhook"
            target="_blank"
            rel="noreferrer"
            aria-label="Linear Calendar Webhook on GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              className="header-link-icon"
            >
              <path
                fill="currentColor"
                d="M12 .5C5.649.5.5 5.649.5 12A11.5 11.5 0 0 0 8.36 22.04c.575.106.786-.25.786-.556 0-.274-.01-1-.015-1.963-3.251.707-3.937-1.566-3.937-1.566-.532-1.352-1.3-1.712-1.3-1.712-1.063-.727.08-.712.08-.712 1.175.083 1.793 1.206 1.793 1.206 1.044 1.789 2.739 1.272 3.406.973.106-.756.409-1.272.744-1.564-2.595-.295-5.324-1.297-5.324-5.773 0-1.275.456-2.318 1.204-3.136-.12-.296-.522-1.486.114-3.099 0 0 .983-.315 3.22 1.198A11.207 11.207 0 0 1 12 6.174c.993.004 1.993.134 2.928.395 2.236-1.513 3.218-1.198 3.218-1.198.638 1.613.236 2.803.116 3.099.75.818 1.202 1.861 1.202 3.136 0 4.487-2.733 5.474-5.337 5.763.42.36.794 1.07.794 2.157 0 1.558-.014 2.814-.014 3.197 0 .31.207.668.792.555A11.502 11.502 0 0 0 23.5 12C23.5 5.649 18.351.5 12 .5Z"
              />
            </svg>
          </a>
        </div>
      </footer>
    </main>
  );
}
