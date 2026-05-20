const socketHandler = (io) => {
  // Track online users mapping: userId -> socketId
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Register user details
    socket.on('register-user', (userId) => {
      if (userId) {
        onlineUsers.set(userId.toString(), socket.id);
        console.log(`[Socket] Registered User: ${userId} (Socket: ${socket.id})`);
        
        // Broadcast online user statuses
        io.emit('online-users-list', Array.from(onlineUsers.keys()));
      }
    });

    // Private Consultation Chats: Join room
    socket.on('join-consultation', ({ appointmentId }) => {
      if (appointmentId) {
        socket.join(appointmentId);
        console.log(`[Socket] Client joined consultation room: ${appointmentId}`);
      }
    });

    // Send private instant chat messages
    socket.on('send-message', ({ appointmentId, senderId, senderName, text, timestamp }) => {
      io.to(appointmentId).emit('receive-message', {
        senderId,
        senderName,
        text,
        timestamp: timestamp || new Date().toISOString(),
      });
    });

    // --- WebRTC Video Signalling Handshakes ---
    
    // Join WebRTC room
    socket.on('join-video-room', ({ roomId, userId, userName }) => {
      socket.join(roomId);
      console.log(`[WebRTC] ${userName} (${userId}) joined video call room: ${roomId}`);
      
      // Notify other participants in the room
      socket.to(roomId).emit('peer-joined', { userId, userName });
    });

    // WebRTC Offer
    socket.on('video-offer', ({ roomId, offer }) => {
      console.log(`[WebRTC] Offer sent in room ${roomId}`);
      socket.to(roomId).emit('video-offer', { offer });
    });

    // WebRTC Answer
    socket.on('video-answer', ({ roomId, answer }) => {
      console.log(`[WebRTC] Answer sent in room ${roomId}`);
      socket.to(roomId).emit('video-answer', { answer });
    });

    // WebRTC ICE Candidates
    socket.on('ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('ice-candidate', { candidate });
    });

    // Hangup / End Video Call
    socket.on('leave-video-room', ({ roomId, userId }) => {
      socket.leave(roomId);
      console.log(`[WebRTC] ${userId} left room: ${roomId}`);
      socket.to(roomId).emit('peer-left', { userId });
    });

    // --- Notification Triggers ---
    socket.on('trigger-notification', ({ receiverId, notification }) => {
      const socketId = onlineUsers.get(receiverId.toString());
      if (socketId) {
        io.to(socketId).emit('receive-notification', notification);
        console.log(`[Socket] Live notification pushed to user: ${receiverId}`);
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      
      // Clean up maps
      for (const [userId, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`[Socket] Deregistered User: ${userId}`);
          break;
        }
      }
      
      // Broadcast updated online list
      io.emit('online-users-list', Array.from(onlineUsers.keys()));
    });
  });
};

export default socketHandler;
