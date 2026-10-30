const test = require("node:test");
const assert = require("node:assert/strict");

process.env.WHATSAPP_ACCESS_TOKEN = "test-token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
process.env.META_GRAPH_VERSION = "v23.0";

const { processWebhook, getUserProfiles } = require("../src/services/messageProcessor");

test("identifica o telefone do usuário após a saudação inicial", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true });

  try {
    const event = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              field: "messages",
              value: {
                messages: [
                  {
                    id: "msg-001",
                    from: "5511999999999",
                    type: "text",
                    text: { body: "Oi" }
                  }
                ]
              }
            }
          ]
        }
      ]
    };

    await processWebhook(event);

    const profiles = getUserProfiles();
    assert.ok(profiles.has("5511999999999"));
    assert.equal(profiles.get("5511999999999").phone, "5511999999999");
  } finally {
    global.fetch = originalFetch;
  }
});
