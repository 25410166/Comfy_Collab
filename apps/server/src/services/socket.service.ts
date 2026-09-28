import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

class SocketService {
  private io: SocketIOServer | null = null;

  init(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);
      socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  emit(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  getIO() {
    return this.io;
  }
}

export const socketService = new SocketService();
