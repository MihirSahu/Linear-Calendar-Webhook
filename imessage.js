const { createIssue } = require("./linear");

const IMESSAGE_WEBHOOK_SECRET = process.env.IMESSAGE_WEBHOOK_SECRET;

/**
 * Strip @linear tag from message text and return the cleaned title.
 */
function parseMessageText(text) {
  return text
    .replace(/@linear/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Handle incoming iMessage webhook requests from iOS Shortcuts.
 */
async function handleImessage(req, res) {
  // Verify bearer token
  if (IMESSAGE_WEBHOOK_SECRET) {
    const authHeader = req.headers["authorization"];
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (token !== IMESSAGE_WEBHOOK_SECRET) {
      console.warn("Invalid or missing bearer token on /webhook/imessage.");
      return res.status(401).json({ error: "Unauthorized" });
    }
  } else {
    console.warn(
      "No IMESSAGE_WEBHOOK_SECRET set — endpoint is unauthenticated."
    );
  }

  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res
      .status(400)
      .json({ error: "Missing 'text' field in request body." });
  }

  const title = parseMessageText(text);

  if (!title) {
    return res
      .status(400)
      .json({ error: "Message text is empty after stripping @linear tag." });
  }

  try {
    const issue = await createIssue({ title });
    console.log(
      `Created Linear issue from iMessage: ${issue.identifier} — "${issue.title}"`
    );
    return res.status(201).json({
      success: true,
      issue: {
        identifier: issue.identifier,
        title: issue.title,
        url: issue.url,
      },
    });
  } catch (err) {
    console.error("Failed to create Linear issue:", err.message);
    return res.status(500).json({ error: "Failed to create Linear issue." });
  }
}

module.exports = { handleImessage };
