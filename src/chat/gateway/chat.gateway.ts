import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SendMessageDto } from '../dto/send-message.dto';
import { ChatService } from '../service/chat.service';
import { TypingDto } from '../dto/typing.dto';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  constructor(private readonly chatService:ChatService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('send_message')
  handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try{
    this.chatService.sendMessage(data, client, this.server);
    }
    catch (error) {
      console.error('❌ Error in handleSendMessage:', error);
      throw new WsException('Failed to send message');
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: TypingDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.chatService.handleTyping(data, client, this.server);
    } catch (error) {
      console.error('❌ Error in handleTyping:', error);
      throw new WsException('Failed to handle typing');
    }

  }
}
