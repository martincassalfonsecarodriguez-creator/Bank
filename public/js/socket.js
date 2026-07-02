function connectSocket(onNotification) {
  const socket = io();
  socket.on("notification", (notification) => {
    if (onNotification) onNotification(notification);
  });
  socket.on("admin-notification", (notification) => {
    if (onNotification) onNotification(notification);
  });
  socket.on("connect_error", () => setMessage("No se pudo conectar a notificaciones en tiempo real.", "error"));
  return socket;
}
