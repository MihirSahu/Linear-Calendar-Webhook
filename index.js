require("dotenv").config();
const express = require("express");
const { handleWebhook } = require("./webhook");

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON body and preserve raw body for signature verification
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Linear webhook endpoint
app.post("/webhook/linear", handleWebhook);

app.listen(PORT, () => {
  console.log(`Linear Calendar Webhook running on port ${PORT}`);
  console.log(`Webhook endpoint: POST /webhook/linear`);
  console.log(`Filtering for label: "${process.env.LINEAR_LABEL_NAME || "calendar"}"`);
});
