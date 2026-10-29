const fs = require("node:fs");
const path = require("node:path");

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    let [, key, value] = match;
    value = value.trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

const envFilePath = path.resolve(__dirname, "..", ".env");
const fileEnv = parseEnvFile(envFilePath);
for (const [key, value] of Object.entries(fileEnv)) {
  if (typeof process.env[key] === "undefined") {
    process.env[key] = value;
  }
}

const config = {
  port: Number(process.env.PORT || 3000),
  metaAppSecret: process.env.META_APP_SECRET || "",
  metaGraphVersion: process.env.META_GRAPH_VERSION || "v23.0",
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  welcomeMessage: process.env.WELCOME_MESSAGE || "Olá! Bem-vindo ao atendimento automatizado do Grupo ROCIE. Como podemos ajudar?",
  dedupeTtlMs: Number(process.env.DEDUPE_TTL_MS || 60 * 60 * 1000)
};

module.exports = config;
