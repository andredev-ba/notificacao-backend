import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  sendStatusUpdate(messageId: string, status: string) {
    this.server.emit('statusUpdated', { messageId, status });
  }
}
