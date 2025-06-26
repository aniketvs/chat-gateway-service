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
        if (callerData?.callStatus == 'in_call') {
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

    async handleCallEnd(data: any, client: Socket, server: Server) {
        const fromUser = client.data.user;

        if (!fromUser || !data.toUserId) {
            server.to(client.id).emit(CALL_EVENTS.INVALID_CALL, {
                message: 'Invalid call end request.',
            });
            return;
        }

        if (fromUser.id === data.toUserId) {
            server.to(client.id).emit(CALL_EVENTS.INVALID_CALL, {
                message: 'You cannot end a call with yourself.',
            });
            return;
        }

        const callerData = await this.redisService.get(`user:${fromUser.id}`);
        const calleeData = await this.redisService.get(`user:${data.toUserId}`);

        await this.redisPubSubService.publish('call_events', {
            event: CALL_EVENTS.CALL_END,
            data: {
                caller: { id: fromUser.id, ...callerData, socketId: client.id },
                callee: { id: data.toUserId, ...calleeData },
            },
        });

        await this.redisService.del(`call_session:${fromUser.id}_${data.toUserId}`);


    }

    async handleCallAccept(data: any, client: Socket, server: Server) {
        const calleeId = client?.data?.user?.id;
        const callerId = data?.toUserId;

        if (!calleeId || !callerId) {
            server.to(client.id).emit(CALL_EVENTS.INVALID_CALL, {
                message: 'Invalid call end request.',
            });
            return;
        }
        const redisClient = this.redisService['client'];
        const lockKey = `lock:accept_call:${callerId}_${calleeId}`;
        const lock = await redisClient.call('SET', lockKey, '1', 'NX', 'PX', 3000);
      

    if (!lock) {
        server.to(client.id).emit(CALL_EVENTS.ALREADY_ACCEPTED, {
            message: 'Call already accepted or in progress.',
        });
        return;
    }

        const callerData = await this.redisService.get(`user:${callerId}`);
        const calleeData = await this.redisService.get(`user:${calleeId}`);
        const callSessionExists = await this.redisService.get(`call_session:${callerId}_${calleeId}`);
        if (!callSessionExists) {
            server.to(client.id).emit(CALL_EVENTS.CALL_TIMEOUT, {
                message: 'Call timed out.',
            });
            return;
        }

        if (callerData?.callStatus?.includes('in_call') === false) {
            server.to(client.id).emit(CALL_EVENTS.CALL_CANCELLED, {
                message: 'Caller is no longer waiting.',
            });
            return;
        }

        console.log(`call accepted message pushed to pub sub by ${callerId} ${calleeId}`);
        await this.redisPubSubService.publish('call_events', {
            event: CALL_EVENTS.CALL_ACCEPTED,
            data: {
                caller: { id: callerId, ...callerData, },
                callee: { id: calleeId, ...calleeData, socketId: client.id },
            },
        });
        await this.redisService.del(`call_session:${callerId}_${calleeId}`);

    }
}