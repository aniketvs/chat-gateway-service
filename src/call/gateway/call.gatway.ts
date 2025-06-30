import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { CallService } from "../services/call.service";
import { CallEventsSubscriberService } from "../services/call-event-subscriber.service";
import { callTimeoutSubscriberService } from "../services/call-timeout-subscriber.service";
import { subscribe } from "diagnostics_channel";
import { CALL_EVENTS } from "../constant/call-event.constant";
import { UserCallDto } from "../dto/user-call.dto";
@WebSocketGateway({ cors: { origin: '*' } })
export class CallGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly callService: CallService,
        private readonly callEventsSubscriberService: CallEventsSubscriberService,
        private readonly callTimeoutSubscriberService: callTimeoutSubscriberService,
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
    @MessageBody() data:UserCallDto,
    @ConnectedSocket() client:Socket
  ){
 try {
            this.callService.handleRejectCall(data, client, this.server);
        } catch (error) {
            console.error('❌ Error in handleRejectCall:', error);
            throw new WsException('Failed to Reject call');
        }
  }
    @SubscribeMessage(CALL_EVENTS.WEBRTC_OFFER)
  handleWebRTCOffer(
    @MessageBody() data:UserCallDto,
    @ConnectedSocket() client:Socket
  ){
 try {
           
        } catch (error) {
            console.error('❌ Error in handleWebRTCOffer:', error);
            throw new WsException('Failed to webrtc offer');
        }
  }
   @SubscribeMessage(CALL_EVENTS.WEBRTC_ANSWER)
  handleWebRTCAnswer(
    @MessageBody() data:UserCallDto,
    @ConnectedSocket() client:Socket
  ){
 try {
           
        } catch (error) {
            console.error('❌ Error in handleWebRTCAnswer:', error);
            throw new WsException('Failed to webrtc Answer');
        }
  }
     @SubscribeMessage(CALL_EVENTS.WEBRTC_CONNECTED)
  handleWebRTCConnected(
    @MessageBody() data:UserCallDto,
    @ConnectedSocket() client:Socket
  ){
 try {
           
        } catch (error) {
            console.error('❌ Error in handleWebRTCConnected:', error);
            throw new WsException('Failed to webrtc Connected');
        }
  }
}