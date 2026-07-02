const notificationModel = require("../models/notificationModel");

let ioInstance = null;

function setSocketServer(io) {
  ioInstance = io;
}

async function notifyUser(userId, title, message, type = "info") {
  const result = await notificationModel.createNotification({ userId, title, message, type });
  const notification = { id: result.id, user_id: userId, title, message, type, is_read: 0, created_at: new Date().toISOString() };
  if (ioInstance) ioInstance.to(`user:${userId}`).emit("notification", notification);
  return notification;
}

async function notifyAdmins(title, message, type = "info") {
  if (ioInstance) ioInstance.to("admins").emit("admin-notification", { title, message, type, created_at: new Date().toISOString() });
}

async function broadcast(title, message, type = "announcement") {
  const result = await notificationModel.createNotification({ title, message, type });
  const notification = { id: result.id, user_id: null, title, message, type, is_read: 0, created_at: new Date().toISOString() };
  if (ioInstance) ioInstance.emit("notification", notification);
  return notification;
}

module.exports = { setSocketServer, notifyUser, notifyAdmins, broadcast };
