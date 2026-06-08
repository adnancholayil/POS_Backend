const socketIo = require('socket.io');
const logger = require('./logger');
const jwt = require('jsonwebtoken');

let io = null;
const userSockets = new Map(); // Map of userId -> Set of socketIds
const tenantRooms = new Map(); // Map of tenantId -> Room name

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_key_pos_9988');
      socket.user = decoded; // Contains id, tenantId, role
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, tenantId } = socket.user;
    logger.info(`Socket connected: ${socket.id} | User: ${userId} | Tenant: ${tenantId}`);

    // Join tenant room
    if (tenantId) {
      socket.join(`tenant:${tenantId}`);
    }

    // Map user socket
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Emit to specific user
const emitToUser = (userId, event, data) => {
  const sockets = userSockets.get(userId);
  if (sockets && io) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
    return true;
  }
  return false;
};

// Emit to all users in a tenant
const emitToTenant = (tenantId, event, data) => {
  if (io && tenantId) {
    io.to(`tenant:${tenantId}`).emit(event, data);
    return true;
  }
  return false;
};

module.exports = { initSocket, getIo, emitToUser, emitToTenant };
