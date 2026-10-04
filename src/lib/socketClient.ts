import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // In a real app, you might want to read the URL from an env variable.
    // Assuming the Next.js API handles the Socket.IO server on the same origin.
    // If not, use process.env.NEXT_PUBLIC_WEBSOCKET_URL
    socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || '', {
      path: '/api/socket', // If you have a custom path
      autoConnect: true,
      reconnection: true,
    });
    
    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });
  }
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
