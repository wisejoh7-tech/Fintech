import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import IORedis from "ioredis";

export class SocketService {
  private static io: Server | null = null;

  static init(server: HttpServer) {
    const redisUrl = process.env.REDIS_URL;
    const isProduction = process.env.NODE_ENV === 'production';

    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Only use Redis adapter if URL is provided OR in production
    if (redisUrl || isProduction) {
      try {
        const pubClient = new IORedis(redisUrl || 'redis://127.0.0.1:6379', {
          maxRetriesPerRequest: null,
          retryStrategy: () => isProduction ? Math.min(100, 3000) : null
        });

        const subClient = pubClient.duplicate();

        // Essential: Handle errors to prevent crash
        pubClient.on('error', (err) => console.warn('[Socket] Redis Pub Error:', err.message));
        subClient.on('error', (err) => console.warn('[Socket] Redis Sub Error:', err.message));

        this.io.adapter(createAdapter(pubClient, subClient));
        console.log('[Socket] Redis adapter initialized');
      } catch (err) {
        console.warn('[Socket] Failed to initialize Redis adapter, falling back to local memory');
      }
    } else {
      console.log('[Socket] Using memory adapter (Development)');
    }

    this.io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      socket.on("join", (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their notification room`);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    return this.io;
  }

  static emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  static emitBroadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}
