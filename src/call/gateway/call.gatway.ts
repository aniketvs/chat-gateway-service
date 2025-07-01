import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { CallService } from "../services/call.service";
import { CallEventsSubscriberService } from "../services/call-event-subscriber.service";
import { callTimeoutSubscriberService } from "../services/call-timeout-subscriber.service";
import { subscribe } from "diagnostics_channel";
import { CALL_EVENTS } from "../constant/call-event.constant";
import { UserCallDto } from "../dto/user-call.dto";
import { WebRTCService } from "../services/webrtc.service";
@WebSocketGateway({ cors: { origin: '*' } })
export class CallGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly callService: CallService,
        private readonly callEventsSubscriberService: CallEventsSubscriberService,
        private readonly callTimeoutSubscriberService: callTimeoutSubscriberService,
        private readonly webRTCService:WebRTCService
    ) { }
    afterInit(server: Server) {
        console.log('✅ WebSocket server initialized');
        this.callEventsSubscriberService.setServer(server); // THIS MUST BE CALLED
        this.callTimeoutSubscriberService.setServer(server);
    }
    @SubscribeMessage(CALL_EVENTS.REQUEST)
    handleCallRequest(
        @MessageBody() data: UserCallDto,
        @ConnectedSocket() client: Socket) {
        try {
            this.callService.handleCallRequest(data, client, this.server);
        }
        catch (error) {
            console.error('❌ Error in handleCallRequest:', error);
            throw new WsException('Failed to handle call request');
        }
    }

    @SubscribeMessage(CALL_EVENTS.CALL_END)
    handleCallEnd(
        @MessageBody() data: UserCallDto,
        @ConnectedSocket() client: Socket) {
        try {
            this.callService.handleCallEnd(data, client, this.server);
        } catch (error) {
            console.error('❌ Error in handleCallEnd:', error);
            throw new WsException('Failed to handle call end');
        }
    }

    @SubscribeMessage(CALL_EVENTS.ACCEPT_CALL)
    handleCallAccepted(
        @MessageBody() data: UserCallDto,
        @ConnectedSocket() client: Socket) {
        try {
            this.callService.handleCallAccept(data, client, this.server);
        } catch (error) {
            console.error('❌ Error in handleCallEnd:', error);
            throw new WsException('Failed to Accept call end');
        }
    }

    @SubscribeMessage(CALL_EVENTS.REJECT_CALL)
    handleRejectCall(
        @MessageBody() data: UserCallDto,
        @ConnectedSocket() client: Socket
    ) {
        try {
            this.callService.handleRejectCall(data, client, this.server);
        } catch (error) {
            console.error('❌ Error in handleRejectCall:', error);
            throw new WsException('Failed to Reject call');
        }
    }
    @SubscribeMessage(CALL_EVENTS.WEBRTC_OFFER)
    handleWebRTCOffer(
        @MessageBody() data:any,
        @ConnectedSocket() client: Socket,
    ) {
        try {
         this.webRTCService.handleWebRtcOfferService(data,client,this.server);
        } catch (error) {
            console.error('❌ Error in handleWebRTCOffer:', error);
            throw new WsException('Failed to handle webrtc offer');
        }
       
    }

    @SubscribeMessage(CALL_EVENTS.WEBRTC_ANSWER)
    handleWebRTCAnswer(
        @MessageBody() data: { answer: any; to: string },
        @ConnectedSocket() client: Socket,
    ) {
           try {
         this.webRTCService.handleWebRtcAnswerService(data,client,this.server);
        } catch (error) {
            console.error('❌ Error in handleWebRTCAnswer:', error);
            throw new WsException('Failed to handle webrtc answer');
        }
       
    }

    @SubscribeMessage(CALL_EVENTS.ICE_CANDIDATE)
    handleIceCandidate(
        @MessageBody() data:any,
        @ConnectedSocket() client: Socket,
    ) {
         try {
         this.webRTCService.handleICECandidateService(data,client,this.server);
        } catch (error) {
            console.error('❌ Error in handleWebRTCAnswer:', error);
            throw new WsException('Failed to handle webrtc answer');
        }
       
    }

    @SubscribeMessage('WEBRTC_CONNECTED')
    async handleWebRTCConnected(
        @MessageBody() data: { callerId: number; calleeId: number },
        @ConnectedSocket() client: Socket,
    ) {
        const { callerId, calleeId } = data;
        const callInfo = {
            callerId,
            calleeId,
            startTime: new Date().toISOString(),
            instanceId: process.env.INSTANCE_ID,
        };

        console.log(`[WEBRTC_CONNECTED] Caller: ${callerId}, Callee: ${calleeId}, Saving to Redis...`);

        try {
            // await this.redisService.set(`call_active:${callerId}_${calleeId}`, callInfo, 60 * 60);
            console.log(`[WEBRTC_CONNECTED] Call saved to Redis with TTL 1hr for key: call_active:${callerId}_${calleeId}`);

            this.server.to(client.id).emit('CALL_CONNECTED', { message: 'Call connected' });
        } catch (err) {
            console.error(`[WEBRTC_CONNECTED_ERROR] Failed to save call to Redis. Caller: ${callerId}, Callee: ${calleeId}, Error: ${err.message}`);
        }
    }

}