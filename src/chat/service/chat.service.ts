import { Injectable } from "@nestjs/common";
import { SendMessageDto } from "../dto/send-message.dto";
import { Server, Socket } from 'socket.io';
import { WsException } from "@nestjs/websockets";
import { TypingDto } from "../dto/typing.dto";
import { ProducerService } from "src/kafka/producer.service";
import { RedisService } from "src/redis/redis.service";

@Injectable()
export class ChatService {

  constructor(private readonly producerService: ProducerService,
    private readonly redisService:RedisService
  ) { }

  async sendMessage(data: SendMessageDto, client: Socket, server: Server) {

    const fromUser = client.data.user;

    if (!fromUser) {
      console.error('❌ Sender data missing from socket');
      throw new WsException('Sender not authenticated');
    }

    if (!data.toUserId || !data.toUserNumber || !data.message) {
      throw new WsException('Invalid message payload');
    }
    
    const userData=await this.redisService.get(`user:${data.toUserId}`);
    console.log(`🔍 User data for ${data.toUserId}:`, userData);
    const toRoom = userData ? userData.roomIds?.[0] : `${data.toUserId}_${data.toUserNumber}`;
    if(!userData || userData?.status !== 'online') {
      console.warn(`⚠️ User ${data.toUserId} is not online. trigger notification`);
    }

    const chatKey = [fromUser.id, data.toUserId].sort().join('_');

   const payload = {
    fromUserId: fromUser.id,
    fromUserNumber: fromUser.number,
    toUserId: data.toUserId,
    toUserNumber: data.toUserNumber,
    message: data.message,
    timestamp: new Date().toISOString(),
  };


    server.to(toRoom).emit('receive_message', payload);
    console.log(`💬 ${fromUser.id} → ${toRoom}: ${data.message}`);
    await this.producerService.send({
      topic: 'chat-messages',
      messages: [
        {
          key: chatKey,
          value: JSON.stringify(payload),
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
  
  async handlePing( client: Socket, server: Server) {
 const user = client.data.user;
  if (!user) return;
console.log(`🔗 Ping received from user: ${user.id}`);
     const redisKey = `user:${user.id}`;
  const data = await this.redisService.get(redisKey);
  if (data) {
    await this.redisService.set(redisKey, {
      ...data,
      lastPing: new Date().toISOString(),
    }, 60 * 5); 
  }else{
     const roomId = `${user?.id}_${user?.number}`;
     const newData = {
      status: 'online',
      socketIds: [client.id],
      roomIds: [roomId], 
      instanceId: process.env.INSTANCE_ID || 'default',
      lastPing: new Date().toISOString(),
    };
    await this.redisService.set(redisKey, newData, 60 * 5);
  }
  }
}