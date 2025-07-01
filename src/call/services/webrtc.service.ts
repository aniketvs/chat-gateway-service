import { Injectable, Logger } from "@nestjs/common";
import { Server, Socket } from 'socket.io';
import { RedisPubSubService } from "src/redis/services/redis-pub-sub.service";
import { RedisService } from "src/redis/services/redis.service";
import { CALL_EVENTS } from "../constant/call-event.constant";

@Injectable()
export class WebRTCService {

    private readonly logger = new Logger(WebRTCService.name);

    constructor(
        private readonly redisPubSubService: RedisPubSubService,
        private readonly redisService: RedisService,
    ) { }

    async handleWebRtcOfferService(data: any, client: Socket, server: Server) {

        const requesterId = client?.data?.user?.id;
        const consumerId = data?.toUserId;
        this.logger.log(`[WEBRTC_OFFER] From: ${client.id}, To: ${data.to}`);
        if (!requesterId || !consumerId) {
            this.logger.log("Invalid call end request.");
            server.to(client.id).emit(CALL_EVENTS.INVALID_CALL, {
                message: 'Invalid call end request.',
            });
            return;
        }
        // const requesterData = await this.redisService.get(`user:${requesterId}`);
        const consumerData = await this.redisService.get(`user:${consumerId}`);
        const consumerSockerId = consumerData?.callStatus.split(':')[0];
        this.logger.log(consumerSockerId);
        server.to(consumerSockerId).emit(CALL_EVENTS.WEBRTC_OFFER, {
            offer: data.offer,
            from: client.id,
            userId: requesterId
        });
    }
    async handleWebRtcAnswerService(data: any, client: Socket, server: Server) {

        const consumerId = client?.data?.user?.id;
        const requesterId = data?.requesterId;
        this.logger.log(`[WEBRTC_ANSWER] From: ${client.id}, To: ${data?.socketId}`);

        if (!requesterId || !consumerId) {
            server.to(client.id).emit(CALL_EVENTS.INVALID_CALL, {
                message: 'Invalid call end request.',
            });
            return;
        }
        const socketId = data?.socketId;
        server.to(socketId).emit(CALL_EVENTS.WEBRTC_ANSWER, {
            answer: data.answer,
            from: client.id,
            userId: consumerId
        });
    }

    async handleICECandidateService(data: any, client: Socket, server: Server) {

        const requesterId = client?.data?.user?.id;
        const consumerId = data?.toUserId;
        this.logger.log(`[ICE_CANDIDATE] From: ${client.id}, To: ${data?.toUserId}`);

        if (!requesterId || !consumerId) {
            server.to(client.id).emit(CALL_EVENTS.INVALID_CALL, {
                message: 'Invalid call end request.',
            });
            return;
        }
        const consumerData = await this.redisService.get(`user:${consumerId}`);
        const consumerSockerId = consumerData?.callStatus.split(':')[0];
        this.logger.log(consumerSockerId);

        server.to(consumerSockerId).emit(CALL_EVENTS.ICE_CANDIDATE, {
            candidate: data.candidate,
            from: client.id,
        });
    }

}