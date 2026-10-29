const http = require("node:http");

const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({
    status: "online",
    projeto: "Bot ROCIE",
    mensagem: "Servidor Node.js funcionando!",
    data: new Date().toISOString()
  }));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Bot ROCIE iniciado na porta ${port}`);
});
