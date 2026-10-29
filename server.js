const http = require("node:http");
const crypto = require("node:crypto");

const port = Number(process.env.PORT || 3000);
const maxBodyBytes = 1024 * 1024;
const graphVersion = process.env.META_GRAPH_VERSION || "v23.0";
const greeting = "Olá! Bem-vindo ao atendimento automatizado do Grupo ROCIE. Como podemos ajudar?";
const handledMessages = new Map();
const dedupeTtlMs = 60 * 60 * 1000;

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function isGreeting(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[!?.]+$/g, "");
  return ["oi", "ola", "bom dia", "boa tarde", "boa noite"].includes(normalized);
}

async function sendTextMessage(to, message) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) throw new Error("WhatsApp send credentials are missing");

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(phoneId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: message }
      }),
      signal: AbortSignal.timeout(12000)
    }
  );

  if (!response.ok) {
    // Do not log response bodies, phone numbers or credentials.
    throw new Error(`Meta message send failed with HTTP ${response.status}`);
  }
}

async function processWebhook(event) {
  if (event.object !== "whatsapp_business_account") return;
  const now = Date.now();
  for (const [id, time] of handledMessages) {
    if (now - time > dedupeTtlMs) handledMessages.delete(id);
  }

  for (const entry of event.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;
      for (const message of change.value?.messages || []) {
        if (!message.id || !message.from ||
            message.type !== "text" || !isGreeting(message.text?.body)) continue;
        if (handledMessages.has(message.id)) continue;
        handledMessages.set(message.id, now);
        try {
          await sendTextMessage(message.from, greeting);
          console.log("Automatic greeting sent successfully");
        } catch (error) {
          handledMessages.delete(message.id);
          console.error("Automatic greeting failed:", error.message);
          throw error;
        }
      }
    }
  }
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
    let exceeded = false;
    req.on("data", chunk => {
      bytes += chunk.length;
      if (bytes > maxBodyBytes) {
        exceeded = true;
        return json(res, 413, { error: "Payload too large" });
      }
      if (!exceeded) chunks.push(chunk);
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
    return;
  }

  return json(res, 404, { error: "Not found" });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Bot ROCIE iniciado na porta ${port}`);
});
