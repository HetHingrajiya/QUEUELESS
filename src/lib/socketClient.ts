import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const isServer = typeof window === 'undefined';
    const authPayload: Record<string, string> = {};

    if (isServer && process.env.JWT_SECRET) {
      authPayload.serverToken = process.env.JWT_SECRET;
    }

    socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || '', {
      path: '/api/socket',
      autoConnect: true,
      reconnection: true,
      withCredentials: true,
      auth: authPayload,
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Connected to WebSocket server');
      }
    });

    socket.on('disconnect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Disconnected from WebSocket server');
      }
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
