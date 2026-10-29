const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("aplicação expõe configuração via variáveis de ambiente", () => {
  const config = require("../src/config");

  assert.equal(typeof config.port, "number");
  assert.equal(typeof config.metaGraphVersion, "string");
  assert.equal(typeof config.welcomeMessage, "string");
  assert.equal(typeof config.dedupeTtlMs, "number");
});

test("arquivo de exemplo de env existe", () => {
  const envExamplePath = path.join(__dirname, "..", ".env.example");
  assert.equal(fs.existsSync(envExamplePath), true);
});
