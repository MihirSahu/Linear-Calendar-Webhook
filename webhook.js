const crypto = require("crypto");
const { parseDescription } = require("./parser");
const { createEvent } = require("./calendar");

const LINEAR_WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET;
const TARGET_LABEL = process.env.LINEAR_LABEL_NAME || "calendar";

/**
 * Verify that the webhook payload was signed by Linear.
 */
function verifySignature(body, signature) {
  if (!LINEAR_WEBHOOK_SECRET) {
    console.warn("No LINEAR_WEBHOOK_SECRET set — skipping signature verification.");
    return true;
  }

  const hmac = crypto.createHmac("sha256", LINEAR_WEBHOOK_SECRET);
  hmac.update(body);
  const expected = hmac.digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

/**
 * Check if the issue has the target label.
 * Linear webhook payloads include labels as an array of objects with { id, name }.
 */
function hasTargetLabel(issueData) {
  const labels = issueData.labels || [];
  return labels.some(
    (label) => label.name.toLowerCase() === TARGET_LABEL.toLowerCase()
  );
}

/**
 * Handle incoming Linear webhook requests.
 */
async function handleWebhook(req, res) {
  const signature = req.headers["linear-signature"];

  // Verify signature
  if (signature && !verifySignature(req.rawBody, signature)) {
    console.warn("Invalid webhook signature — rejecting request.");
    return res.status(401).json({ error: "Invalid signature" });
  }

  const payload = req.body;

  // Linear sends a URL verification request on webhook creation
  if (payload.type === "url_verification") {
    console.log("Responding to Linear URL verification.");
    return res.status(200).json({ challenge: payload.challenge });
  }

  // Only handle issue creation events
  if (payload.type !== "Issue" || payload.action !== "create") {
    return res.status(200).json({ ignored: true });
  }

  const issue = payload.data;
  console.log(`Received issue: "${issue.title}" [${issue.identifier}]`);

  // Check for target label
  if (!hasTargetLabel(issue)) {
    console.log(`Issue does not have "${TARGET_LABEL}" label — skipping.`);
    return res.status(200).json({ ignored: true, reason: "no matching label" });
  }

  // Parse event details from description
  const eventDetails = parseDescription(issue.description);

  if (!eventDetails.start) {
    console.warn(`Issue "${issue.title}" has no start date — skipping.`);
    return res.status(200).json({
      error: "Missing start date in issue description",
    });
  }

  // Create the calendar event
  try {
    const event = await createEvent({
      title: issue.title,
      description: eventDetails.description,
      location: eventDetails.location,
      start: eventDetails.start,
      end: eventDetails.end,
      attendees: eventDetails.attendees,
    });

    console.log(`Calendar event created for issue "${issue.title}".`);
    return res.status(200).json({ success: true, eventId: event.id });
  } catch (err) {
    console.error("Failed to create calendar event:", err.message);
    return res.status(500).json({ error: "Failed to create calendar event" });
  }
}

module.exports = { handleWebhook };
