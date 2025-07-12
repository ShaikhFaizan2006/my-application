const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store connected users by role
const connectedUsers = {
  admin: new Set(),
  stocker: new Set(),
  customer: new Set()
};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // User authentication
  socket.on('authenticate', (userData) => {
    const { userId, role } = userData;
    
    if (userId && role) {
      // Add user to their role group
      socket.userId = userId;
      socket.userRole = role;
      connectedUsers[role].add(socket.id);
      
      socket.join(role); // Join role-based room
      console.log(`User ${userId} (${role}) authenticated`);
      
      // Notify admins when a stocker or customer connects
      if (role === 'stocker' || role === 'customer') {
        io.to('admin').emit('user_status', { userId, role, status: 'online' });
      }
    }
  });
  
  // Low stock alerts
  socket.on('low_stock_alert', (data) => {
    const { productId, productName, currentStock, threshold } = data;
    console.log(`Low stock alert for ${productName} (${currentStock}/${threshold})`);
    
    // Send alert to all stockers and admins
    io.to('stocker').emit('stock_alert', {
      type: 'low_stock',
      productId,
      productName,
      currentStock,
      threshold,
      timestamp: Date.now()
    });
    
    io.to('admin').emit('stock_alert', {
      type: 'low_stock',
      productId,
      productName,
      currentStock,
      threshold,
      timestamp: Date.now()
    });
  });
  
  // Out of stock alerts
  socket.on('out_of_stock_alert', (data) => {
    const { productId, productName } = data;
    console.log(`Out of stock alert for ${productName}`);
    
    // Send alert to all stockers and admins
    io.to('stocker').emit('stock_alert', {
      type: 'out_of_stock',
      productId,
      productName,
      currentStock: 0,
      timestamp: Date.now()
    });
    
    io.to('admin').emit('stock_alert', {
      type: 'out_of_stock',
      productId,
      productName,
      currentStock: 0,
      timestamp: Date.now()
    });
  });
  
  // Product updates
  socket.on('product_updated', (data) => {
    console.log(`Product ${data.productId} updated by ${socket.userId}`);
    // Broadcast product update to all connected clients
    socket.broadcast.emit('product_update', data);
  });
  
  // Direct messages
  socket.on('direct_message', (data) => {
    const { recipientId, message, senderName } = data;
    console.log(`Message from ${socket.userId} to ${recipientId}: ${message}`);
    
    // Find recipient socket and send message
    io.to(recipientId).emit('message', {
      senderId: socket.userId,
      senderName,
      message,
      timestamp: Date.now()
    });
  });
  
  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.userId && socket.userRole) {
      connectedUsers[socket.userRole].delete(socket.id);
      
      // Notify admins when a stocker or customer disconnects
      if (socket.userRole === 'stocker' || socket.userRole === 'customer') {
        io.to('admin').emit('user_status', {
          userId: socket.userId,
          role: socket.userRole,
          status: 'offline'
        });
      }
    }
  });
});

const PORT = process.env.SOCKET_PORT || 5001;
server.listen(PORT, () => console.log(`Socket.IO server running on port ${PORT}`)); 