import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { CallService } from "../services/call.service";
import { CallEventsSubscriberService } from "../services/call-event-subscriber.service";
import { callTimeoutSubscriberService } from "../services/call-timeout-subscriber.service";
import { subscribe } from "diagnostics_channel";
import { CALL_EVENTS } from "../constant/call-event.constant";
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
        @MessageBody() data: any,
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
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket) {
            try {
                this.callService.handleCallEnd(data, client, this.server);
            }catch (error) {
            console.error('❌ Error in handleCallEnd:', error);
            throw new WsException('Failed to handle call end');
            }
        }

}