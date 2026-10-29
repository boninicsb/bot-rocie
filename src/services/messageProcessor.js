const { sendTextMessage } = require("./whatsappService");
const { welcomeMessage, dedupeTtlMs } = require("../config");

const handledMessages = new Map();

function isGreeting(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[!?.]+$/g, "");
  return ["oi", "ola", "bom dia", "boa tarde", "boa noite"].includes(normalized);
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
          await sendTextMessage(message.from, welcomeMessage);
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

module.exports = { processWebhook };
