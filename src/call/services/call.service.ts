import { Injectable } from "@nestjs/common";
import { Socket, Server } from "socket.io";
import { RedisPubSubService } from "src/redis/services/redis-pub-sub.service";
import { RedisService } from "src/redis/services/redis.service";
import { CALL_EVENTS } from "../constant/call-event.constant";

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
        if (fromUser.id === data.toUserId) {
            server.to(client.id).emit(CALL_EVENTS.INVALID_CALL, {
                message: 'You cannot call yourself.',
            });
            return;
        }
        if( callerData?.callStatus == 'in_call') {
            server.to(client.id).emit(CALL_EVENTS.ALREADY_IN_CALL, {
                message: `User ${fromUser.id} is not in a call.`,
            });
            return;
        }

        if (calleeData && calleeData?.status !== 'online') {
            console.log(`User ${data.toUserId} is not online.`);
            server.to(client.id).emit(CALL_EVENTS.NOT_ONLINE, {
                message: `User ${calleeData.id} is not online.`,
            });
            return;
        }
        if (calleeData?.callStatus === 'in_call') {
            console.log(`User ${data.toUserId} is currently on another call.`);
            server.to(client.id).emit(CALL_EVENTS.BUSY, {
                message: `User ${data.toUserId} is currently on another call.`,
            });
            return;
        }


        await this.redisPubSubService.publish('call_events', {
            event: CALL_EVENTS.REQUEST,
            data: {
                caller: { id: fromUser.id, ...callerData, socketId: client.id },
                callee: { id: data.toUserId, ...calleeData }
            },
        });

    }
}