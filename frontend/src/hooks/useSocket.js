import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      return;
    }

    // Connect to Socket server
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: false,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected to server.');
      // Register userId on server
      socket.emit('register-user', user._id);
    });

    socket.on('online-users-list', (users) => {
      setOnlineUsers(users);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket] Disconnected.');
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Join private chat room
  const joinRoom = (appointmentId) => {
    if (socketRef.current) {
      socketRef.current.emit('join-consultation', { appointmentId });
    }
  };

  // Send message
  const sendMessage = (appointmentId, text) => {
    if (socketRef.current && user) {
      socketRef.current.emit('send-message', {
        appointmentId,
        senderId: user._id,
        senderName: user.name,
        text,
      });
    }
  };

  return {
    socket: socketRef.current,
    connected,
    onlineUsers,
    joinRoom,
    sendMessage,
  };
};

export default useSocket;
