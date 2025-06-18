import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { CallService } from "../services/call.service";
import { CallEventsSubscriberService } from "../services/call-event-subscriber.service";
@WebSocketGateway({ cors: { origin: '*' } })
export class CallGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly callService: CallService,
        private readonly callEventsSubscriberService: CallEventsSubscriberService,
    ) { }
afterInit(server: Server) {
    console.log('✅ WebSocket server initialized');
    this.callEventsSubscriberService.setServer(server); // THIS MUST BE CALLED
  }
    @SubscribeMessage('call_request')
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

}