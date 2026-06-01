import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import IORedis from "ioredis";

export class SocketService {
  private static io: Server | null = null;

  static init(server: HttpServer) {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const pubClient = new IORedis(redisUrl);
    const subClient = pubClient.duplicate();

    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      adapter: createAdapter(pubClient, subClient)
    });

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
