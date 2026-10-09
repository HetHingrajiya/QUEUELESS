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
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    // Room subscription: office-scoped queue
    socket.on('join-office', (officeId: string) => {
      if (officeId) {
        socket.join(`office:${officeId}`);
      }
    });

    socket.on('leave-office', (officeId: string) => {
      if (officeId) {
        socket.leave(`office:${officeId}`);
      }
    });

    // Room subscription: token-scoped citizen lifecycle
    socket.on('join-token', (tokenId: string) => {
      if (tokenId) {
        socket.join(`token:${tokenId}`);
      }
    });

    socket.on('leave-token', (tokenId: string) => {
      if (tokenId) {
        socket.leave(`token:${tokenId}`);
      }
    });

    // Helper to dispatch event and its uppercase alias with proper room scoping
    const emitScoped = (canonical: string, alias: string, data: any) => {
      if (data?.tokenId) {
        io.to(`token:${data.tokenId}`).emit(canonical, data);
        io.to(`token:${data.tokenId}`).emit(alias, data);
      }
      if (data?.officeId) {
        io.to(`office:${data.officeId}`).emit(canonical, data);
        io.to(`office:${data.officeId}`).emit(alias, data);
      } else {
        io.emit(canonical, data);
        io.emit(alias, data);
      }
    };

    // Queue action dispatcher
    socket.on('queue:action', (data: any) => {
      if (!data) return;
      emitScoped('queue:action', 'QUEUE_ACTION', data);
      emitScoped('queue:updated', 'QUEUE_UPDATED', data);
    });

    // Queue updated event
    socket.on('queue:updated', (data?: any) => {
      emitScoped('queue:updated', 'QUEUE_UPDATED', data);
    });
    socket.on('QUEUE_UPDATED', (data?: any) => {
      emitScoped('queue:updated', 'QUEUE_UPDATED', data);
    });

    // Token lifecycle events (supporting both snake_case and UPPER_CASE)
    const registerEventPair = (canonical: string, alias: string) => {
      socket.on(canonical, (data: any) => emitScoped(canonical, alias, data));
      socket.on(alias, (data: any) => emitScoped(canonical, alias, data));
    };

    registerEventPair('token:called', 'TOKEN_CALLED');
    registerEventPair('token:checked_in', 'TOKEN_CHECKED_IN');
    registerEventPair('token:serving', 'TOKEN_SERVICE_STARTED');
    registerEventPair('token:completed', 'TOKEN_SERVICE_COMPLETED');
    registerEventPair('token:cancelled', 'TOKEN_CANCELLED');
    registerEventPair('token:no_show', 'TOKEN_SKIPPED');
    registerEventPair('token:transferred', 'TOKEN_TRANSFERRED');
    registerEventPair('counter:updated', 'COUNTER_UPDATED');

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  res.end();
}
