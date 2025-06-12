import { Injectable } from "@nestjs/common";
import { SendMessageDto } from "../dto/send-message.dto";
import { Server, Socket } from 'socket.io';
import { WsException } from "@nestjs/websockets";
import { TypingDto } from "../dto/typing.dto";
import { ProducerService } from "src/kafka/producer.service";

@Injectable()
export class ChatService {

  constructor(private readonly producerService: ProducerService) { }

  async sendMessage(data: SendMessageDto, client: Socket, server: Server) {

    const fromUser = client.data.user;

    if (!fromUser) {
      console.error('❌ Sender data missing from socket');
      throw new WsException('Sender not authenticated');
    }

    if (!data.toUserId || !data.toUserNumber || !data.message) {
      throw new WsException('Invalid message payload');
    }
    const toRoom = `${data.toUserId}_${data.toUserNumber}`;
    const chatKey = [fromUser.id, data.toUserId].sort().join('_');

    const payload = {
      fromUserId: fromUser.id,
      fromUserNumber: fromUser.number,
      toUserId: data.toUserId,
      toUserNumber: data.toUserNumber,
      message: data.message,
      timestamp: new Date(),
    };


    server.to(toRoom).emit('receive_message', payload);
    console.log(`💬 ${fromUser.id} → ${toRoom}: ${data.message}`);
    await this.producerService.send({
      topic: 'chat-messages',
      messages: [
        {
          key: chatKey,
          value: payload,
        },
      ],
    })
  }


  handleTyping(data: TypingDto, client: Socket, server: Server) {
    const fromUser = client.data.user;
    if (!fromUser) {
      console.error('❌ Sender data not available on socket.');
      throw new WsException('Sender not authenticated');
    }
    const toRoom = `${data.toUserId}_${data.toUserNumber}`;

    const payload = {
      fromUserId: fromUser.id,
      fromUserNumber: fromUser.number,
      timestamp: new Date(),
    };
    server.to(toRoom).emit('user_typing', payload);
  }
}