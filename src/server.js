const http = require("http");
const config = require("./config/env");
const { app, sessionMiddleware } = require("./app");
const { initializeDatabase } = require("./database/seed");
const { initSockets } = require("./sockets");

async function start() {
  await initializeDatabase();
  const server = http.createServer(app);
  initSockets(server, sessionMiddleware);

  server.listen(config.port, () => {
    console.log(`Banco Familiar disponible en http://localhost:${config.port}`);
    console.log("Administrador inicial: CI ADMIN / contrasena admin123");
  });
}

start().catch((error) => {
  console.error("No se pudo iniciar Banco Familiar:", error);
  process.exit(1);
});
