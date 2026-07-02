const { Server } = require("socket.io");
const notificationService = require("../services/notificationService");

function initSockets(httpServer, sessionMiddleware) {
  const io = new Server(httpServer);

  io.engine.use(sessionMiddleware);

  io.on("connection", (socket) => {
    const user = socket.request.session.user;
    if (!user) return socket.disconnect(true);

    socket.join(`user:${user.id}`);
    if (user.role === "admin") socket.join("admins");

    socket.emit("connected", { userId: user.id, role: user.role });
  });

  notificationService.setSocketServer(io);
  return io;
}

module.exports = { initSockets };
