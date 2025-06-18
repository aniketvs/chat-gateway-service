import { Injectable } from "@nestjs/common";
import { Socket, Server } from "socket.io";
import { RedisPubSubService } from "src/redis/services/redis-pub-sub.service";
import { RedisService } from "src/redis/services/redis.service";

@Injectable()
export class CallService {

    constructor(
        private readonly redisPubSubService: RedisPubSubService,
        private readonly redisService: RedisService,
    ) { }
    async handleCallRequest(data: any, client: Socket, server: Server) {
        const fromUser = client.data.user;
         const callerData = await this.redisService.get(`user:${fromUser.id}`);
        const calleeData = await this.redisService.get(`user:${data.toUserId}`);
        if(calleeData.status !== 'online') {
            console.log(`User ${data.toUserId} is not online.`);
            server.to(callerData.roomIds[0]).emit('user_not_online', {
                message: `User ${calleeData.id} is not online.`,
            });
            return;
        }
        await this.redisPubSubService.publish('call_events', {
            event: 'call_request',
            data: {
                caller: { id: fromUser.id, ...callerData },
                callee: { id: data.toUserId, ...calleeData}
            },
        });

    }
}