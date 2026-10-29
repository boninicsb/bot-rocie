const http = require("node:http");
const { verifyWebhook, receiveWebhook } = require("./src/webhook");

const port = Number(process.env.PORT || 3000);

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

  if (url.pathname === "/webhook" && req.method === "GET") {
    return verifyWebhook(url, res);
  }

  if (url.pathname === "/webhook" && req.method === "POST") {
    return receiveWebhook(req, res);
  }

  return json(res, 404, { error: "Not found" });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Bot ROCIE iniciado na porta ${port}`);
});
