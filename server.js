const http = require("node:http");
const crypto = require("node:crypto");

const port = Number(process.env.PORT || 3000);
const maxBodyBytes = 1024 * 1024;

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/") {
    return json(res, 200, {
      status: "online",
      projeto: "Bot ROCIE",
      mensagem: "Servidor Node.js funcionando!",
      data: new Date().toISOString()
    });
  }

  if (req.method === "GET" && url.pathname === "/webhook") {
    const configuredToken = process.env.WHATSAPP_VERIFY_TOKEN;
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

  if (req.method === "POST" && url.pathname === "/webhook") {
    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) return json(res, 503, { error: "Webhook not configured" });

    const chunks = [];
    let bytes = 0;
    req.on("data", chunk => {
      bytes += chunk.length;
      if (bytes > maxBodyBytes) {
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
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

      // No personal message content is logged. Persist/process events here later.
      console.log("WhatsApp webhook event received", {
        object: event.object,
        entries: Array.isArray(event.entry) ? event.entry.length : 0
      });
      return json(res, 200, { received: true });
    });
    return;
  }

  return json(res, 404, { error: "Not found" });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Bot ROCIE iniciado na porta ${port}`);
});
