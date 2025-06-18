import { Injectable } from "@nestjs/common";
import { Socket, Server } from "socket.io";
import { RedisPubSubService } from "src/redis/services/redis-pub-sub.service";

@Injectable()
export class CallService {

    constructor(
        private readonly redisPubSubService: RedisPubSubService,
    ) { }
    async handleCallRequest(data: any, client: Socket, server: Server) {
        const fromUser = client.data.user;
        console.log(`📞 Call request from ${client.id}:`, data, fromUser);
        await this.redisPubSubService.publish('call_events', {
            event: 'call_request',
            data: {
                callerId: fromUser.id,
                calleeId: data.toUserId
            },
        });

    }
}