import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import mongoose from 'mongoose';
import { verifyToken, TokenPayload } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      list[key] = decodeURIComponent(val);
    }
  });
  return list;
}

export default function SocketHandler(req: NextApiRequest, res: NextApiResponse & { socket: any }) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ].filter(Boolean) as string[];

  const io = new ServerIO(res.socket.server as any, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: (origin, callback) => {
        // Allow same-origin (no origin header), configured origins, or local dev
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          callback(null, true);
        } else {
          callback(new Error('CORS origin denied'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  // Socket.IO Handshake Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const auth = socket.handshake.auth || {};
      const headers = socket.handshake.headers || {};

      // 1. Check for Internal Server Token (from Next.js API route calls)
      const serverToken = auth.serverToken || headers['x-server-auth'];
      if (serverToken && process.env.JWT_SECRET && serverToken === process.env.JWT_SECRET) {
        socket.data.isServer = true;
        socket.data.role = 'SERVER_INTERNAL';
        return next();
      }

      // 2. Check for User JWT in auth payload, header, or cookie
      const cookies = parseCookies(headers.cookie);
      const token = auth.token || 
                    (headers.authorization ? headers.authorization.replace('Bearer ', '') : null) || 
                    cookies['token'];

      if (!token) {
        return next(new Error('Authentication failed: Missing token'));
      }

      const payload = verifyToken(token);
      if (!payload || !payload.userId) {
        return next(new Error('Authentication failed: Invalid or expired token'));
      }

      socket.data.isServer = false;
      socket.data.user = payload as TokenPayload;
      return next();
    } catch (err: unknown) {
      return next(new Error('Authentication failed'));
    }
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    // Room subscription: office-scoped queue
    socket.on('join-office', (officeId: string) => {
      if (!officeId || !mongoose.Types.ObjectId.isValid(officeId)) {
        socket.emit('error', { message: 'Invalid officeId' });
        return;
      }

      // Server, Super Admin, and Citizens (observing public queue numbers) allowed
      if (socket.data.isServer || socket.data.user?.role === 'SUPER_ADMIN' || socket.data.user?.role === 'CITIZEN') {
        socket.join(`office:${officeId}`);
        return;
      }

      // Staff and Admin: must be authorized for this specific office
      if (socket.data.user?.role === 'STAFF' || socket.data.user?.role === 'ADMIN') {
        if (socket.data.user.officeId && socket.data.user.officeId.toString() !== officeId) {
          socket.emit('error', { message: 'Unauthorized for this office' });
          return;
        }
        socket.join(`office:${officeId}`);
        return;
      }

      socket.emit('error', { message: 'Unauthorized' });
    });

    socket.on('leave-office', (officeId: string) => {
      if (officeId && mongoose.Types.ObjectId.isValid(officeId)) {
        socket.leave(`office:${officeId}`);
      }
    });

    // Room subscription: token-scoped citizen lifecycle
    socket.on('join-token', async (tokenId: string) => {
      if (!tokenId || !mongoose.Types.ObjectId.isValid(tokenId)) {
        socket.emit('error', { message: 'Invalid tokenId' });
        return;
      }

      // Internal Server or Super Admin
      if (socket.data.isServer || socket.data.user?.role === 'SUPER_ADMIN') {
        socket.join(`token:${tokenId}`);
        return;
      }

      try {
        await dbConnect();
        const tokenDoc = await Token.findById(tokenId).select('citizenId officeId').lean();
        if (!tokenDoc) {
          socket.emit('error', { message: 'Token not found' });
          return;
        }

        // CITIZEN: Must strictly own this token
        if (socket.data.user?.role === 'CITIZEN') {
          if (tokenDoc.citizenId?.toString() !== socket.data.user.userId) {
            socket.emit('error', { message: 'Forbidden: You do not own this token' });
            return;
          }
          socket.join(`token:${tokenId}`);
          return;
        }

        // STAFF / ADMIN: Must belong to the same office
        if (socket.data.user?.role === 'STAFF' || socket.data.user?.role === 'ADMIN') {
          if (socket.data.user.officeId && tokenDoc.officeId?.toString() !== socket.data.user.officeId) {
            socket.emit('error', { message: 'Forbidden: Token belongs to different office' });
            return;
          }
          socket.join(`token:${tokenId}`);
          return;
        }

        socket.emit('error', { message: 'Unauthorized' });
      } catch {
        socket.emit('error', { message: 'Internal error checking token room authorization' });
      }
    });

    socket.on('leave-token', (tokenId: string) => {
      if (tokenId && mongoose.Types.ObjectId.isValid(tokenId)) {
        socket.leave(`token:${tokenId}`);
      }
    });

    // Helper to dispatch event with strict room scoping (NO GLOBAL BROADCAST)
    const emitScoped = (canonical: string, alias: string, data: any) => {
      if (!data) return;
      if (data.tokenId && mongoose.Types.ObjectId.isValid(data.tokenId)) {
        io.to(`token:${data.tokenId}`).emit(canonical, data);
        io.to(`token:${data.tokenId}`).emit(alias, data);
      }
      if (data.officeId && mongoose.Types.ObjectId.isValid(data.officeId)) {
        io.to(`office:${data.officeId}`).emit(canonical, data);
        io.to(`office:${data.officeId}`).emit(alias, data);
      }
    };

    // Helper to check if caller has permission to emit authoritative lifecycle events
    const isAuthoritativeEmitter = () => {
      return socket.data.isServer === true || 
             socket.data.user?.role === 'STAFF' || 
             socket.data.user?.role === 'ADMIN' || 
             socket.data.user?.role === 'SUPER_ADMIN';
    };

    // Queue action dispatcher (authoritative only)
    socket.on('queue:action', (data: any) => {
      if (!isAuthoritativeEmitter() || !data) return;
      emitScoped('queue:action', 'QUEUE_ACTION', data);
      emitScoped('queue:updated', 'QUEUE_UPDATED', data);
    });

    // Queue updated event (authoritative only)
    socket.on('queue:updated', (data?: any) => {
      if (!isAuthoritativeEmitter()) return;
      emitScoped('queue:updated', 'QUEUE_UPDATED', data);
    });
    socket.on('QUEUE_UPDATED', (data?: any) => {
      if (!isAuthoritativeEmitter()) return;
      emitScoped('queue:updated', 'QUEUE_UPDATED', data);
    });

    // Token lifecycle events (authoritative only)
    const registerAuthoritativeEventPair = (canonical: string, alias: string) => {
      socket.on(canonical, (data: any) => {
        if (!isAuthoritativeEmitter()) return;
        emitScoped(canonical, alias, data);
      });
      socket.on(alias, (data: any) => {
        if (!isAuthoritativeEmitter()) return;
        emitScoped(canonical, alias, data);
      });
    };

    registerAuthoritativeEventPair('token:called', 'TOKEN_CALLED');
    registerAuthoritativeEventPair('token:checked_in', 'TOKEN_CHECKED_IN');
    registerAuthoritativeEventPair('token:serving', 'TOKEN_SERVICE_STARTED');
    registerAuthoritativeEventPair('token:completed', 'TOKEN_SERVICE_COMPLETED');
    registerAuthoritativeEventPair('token:cancelled', 'TOKEN_CANCELLED');
    registerAuthoritativeEventPair('token:no_show', 'TOKEN_SKIPPED');
    registerAuthoritativeEventPair('token:transferred', 'TOKEN_TRANSFERRED');
    registerAuthoritativeEventPair('counter:updated', 'COUNTER_UPDATED');

    // Private notification room: authenticated users may only subscribe to their own room.
    socket.on('join-user', (requestedUserId: string) => {
      if (!requestedUserId || !mongoose.Types.ObjectId.isValid(requestedUserId)) {
        socket.emit('error', { message: 'Invalid userId' });
        return;
      }
      if (socket.data.isServer || socket.data.user?.userId?.toString() === requestedUserId) {
        socket.join(`user:${requestedUserId}`);
        return;
      }
      socket.emit('error', { message: 'Unauthorized user notification subscription' });
    });

    socket.on('leave-user', (requestedUserId: string) => {
      if (requestedUserId && mongoose.Types.ObjectId.isValid(requestedUserId) &&
          (socket.data.isServer || socket.data.user?.userId?.toString() === requestedUserId)) {
        socket.leave(`user:${requestedUserId}`);
      }
    });

    // Only trusted internal API emitters can publish private notification events.
    socket.on('notification:new', (data: any) => {
      if (!socket.data.isServer || !data?.userId || !mongoose.Types.ObjectId.isValid(data.userId)) return;
      io.to(`user:${data.userId}`).emit('notification:new', data);
      io.to(`user:${data.userId}`).emit('NOTIFICATION_NEW', data);
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  res.end();
}
