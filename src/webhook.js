const crypto = require("node:crypto");
const { metaAppSecret, whatsappVerifyToken } = require("./config");
const { processWebhook } = require("./services/messageProcessor");

const maxBodyBytes = 1024 * 1024;

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function verifyWebhook(url, res) {
  const configuredToken = whatsappVerifyToken;
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (configuredToken && mode === "subscribe" &&
      token === configuredToken && challenge !== null) {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end(challenge);
  }
  return json(res, 403, { error: "Webhook verification failed" });
}

function receiveWebhook(req, res) {
  const appSecret = metaAppSecret;
  if (!appSecret) return json(res, 503, { error: "Webhook not configured" });

  const chunks = [];
  let bytes = 0;
  let exceeded = false;
  req.on("data", chunk => {
    if (exceeded) return;
    bytes += chunk.length;
    if (bytes > maxBodyBytes) {
      exceeded = true;
      return json(res, 413, { error: "Payload too large" });
    }
    chunks.push(chunk);
  });
  req.on("error", error => {
    console.error("Webhook request error:", error.message);
    if (!res.headersSent) json(res, 400, { error: "Request error" });
  });

  req.on("end", async () => {
    if (exceeded) return;
    const body = Buffer.concat(chunks);
    const header = req.headers["x-hub-signature-256"];
    const expected = "sha256=" + crypto.createHmac("sha256", appSecret)
      .update(body).digest("hex");
    const actual = typeof header === "string" ? Buffer.from(header) : Buffer.alloc(0);
    const valid = actual.length === Buffer.byteLength(expected) &&
      crypto.timingSafeEqual(actual, Buffer.from(expected));
    if (!valid) return json(res, 403, { error: "Invalid signature" });

    let event;
    try {
      event = JSON.parse(body.toString("utf8"));
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }

    console.log("WhatsApp webhook event received", {
      object: event.object,
      entries: Array.isArray(event.entry) ? event.entry.length : 0
    });
    try {
      await processWebhook(event);
      return json(res, 200, { received: true });
    } catch {
      return json(res, 500, { error: "Message processing failed" });
    }
  });
}

module.exports = { verifyWebhook, receiveWebhook };
