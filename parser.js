/**
 * Parses event details from a Linear issue description.
 *
 * Expected format (lines can appear anywhere in the description):
 *   Location: 123 Main St, Austin TX
 *   Start: 2026-02-20 10:00 AM
 *   End: 2026-02-20 11:00 AM
 *   Attendees: alice@example.com, bob@example.com
 *
 * Everything else in the description is treated as the event description.
 */

const FIELD_PATTERNS = {
  location: /^location:\s*(.+)$/im,
  start: /^start:\s*(.+)$/im,
  end: /^end:\s*(.+)$/im,
  attendees: /^attendees:\s*(.+)$/im,
};

function parseDescription(description) {
  if (!description) return { description: "" };

  const result = {};

  // Extract each field
  for (const [key, pattern] of Object.entries(FIELD_PATTERNS)) {
    const match = description.match(pattern);
    if (match) {
      result[key] = match[1].trim();
    }
  }

  // Parse attendees into an array of emails
  if (result.attendees) {
    result.attendees = result.attendees
      .split(/[,;\s]+/)
      .map((email) => email.trim())
      .filter((email) => email.includes("@"));
  }

  // Parse start/end into Date objects
  if (result.start) {
    const parsed = new Date(result.start);
    if (isNaN(parsed.getTime())) {
      console.warn(`Could not parse start date: "${result.start}"`);
      delete result.start;
    } else {
      result.start = parsed;
    }
  }

  if (result.end) {
    const parsed = new Date(result.end);
    if (isNaN(parsed.getTime())) {
      console.warn(`Could not parse end date: "${result.end}"`);
      delete result.end;
    } else {
      result.end = parsed;
    }
  }

  // Default: if start but no end, assume 1 hour duration
  if (result.start && !result.end) {
    result.end = new Date(result.start.getTime() + 60 * 60 * 1000);
  }

  // Strip parsed fields from description to get the remaining text
  let cleanDescription = description;
  for (const pattern of Object.values(FIELD_PATTERNS)) {
    cleanDescription = cleanDescription.replace(pattern, "");
  }
  result.description = cleanDescription.trim();

  return result;
}

module.exports = { parseDescription };
