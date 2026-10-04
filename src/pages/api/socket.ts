import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function SocketHandler(req: NextApiRequest, res: NextApiResponse & { socket: any }) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new ServerIO(res.socket.server as any, {
    path: '/api/socket',
    addTrailingSlash: false,
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  res.end();
}
