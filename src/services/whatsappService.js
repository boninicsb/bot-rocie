const { metaGraphVersion, whatsappAccessToken, whatsappPhoneNumberId } = require("../config");

async function sendTextMessage(to, message) {
  const token = whatsappAccessToken;
  const phoneId = whatsappPhoneNumberId;
  if (!token || !phoneId) throw new Error("WhatsApp send credentials are missing");

  const response = await fetch(
    `https://graph.facebook.com/${metaGraphVersion}/${encodeURIComponent(phoneId)}/messages`,
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
    // Never log credentials, message content or phone numbers.
    throw new Error(`Meta message send failed with HTTP ${response.status}`);
  }
}

module.exports = { sendTextMessage };
