import { Injectable, OnModuleInit } from "@nestjs/common";
import { RedisPubSubService } from "src/redis/services/redis-pub-sub.service";
import { RedisService } from "src/redis/services/redis.service";
import { Server } from 'socket.io';
import { CALL_EVENTS } from "../constant/call-event.constant";
import { CallHelperService } from "../helper/call.helper";

@Injectable()
export class callTimeoutSubscriberService implements OnModuleInit {
    private server: Server
    constructor(
        private readonly redisPubSubService: RedisPubSubService,
        private readonly redisService: RedisService,
        private readonly callHelperService: CallHelperService
    ) { }
    setServer(server: Server) {
        this.server = server;
    }
    async onModuleInit() {
        await this.redisPubSubService.subscribe('call_timeout_event', async (event) => {
            if (event.event !== CALL_EVENTS.CALL_TIMEOUT) return;
            const { callerId, calleeId } = event.data;
            const callerData = await this.redisService.get(`user:${callerId}`);
            const calleeData = await this.redisService.get(`user:${calleeId}`);

            if (callerData && calleeData) {
                const callerSocketId = callerData?.callStatus?.split(':')[0] || callerData?.roomIds[0];
                const calleeSocketId = calleeData?.roomIds[0];
                this.server.to(callerSocketId).emit(CALL_EVENTS.CALL_TIMEOUT, {
                    message: `Call with ${calleeId} has timed out.`,
                });
                this.server.to(calleeSocketId).emit(CALL_EVENTS.CALL_TIMEOUT, {
                    message: `Call with ${callerId} has timed out.`,
                });

                await this.callHelperService.resetCallStatus(callerId, callerData);
                await this.callHelperService.resetCallStatus(calleeId, calleeData);
            }
        });

    }
}