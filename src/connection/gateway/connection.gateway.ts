import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer} from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { AuthService } from "src/auth/service/auth.service";
@WebSocketGateway({cors:{origin:'*'}})
export class ConnectionGateway implements OnGatewayConnection, OnGatewayDisconnect {

constructor(private readonly authService:AuthService) {}

@WebSocketServer()
server:Server;

async handleConnection(client:Socket) {
    const token = client.handshake.auth.token;
    if (!token) {
        console.error('❌ No token provided for client:', client.id);
        client.disconnect();
        return;
    }
 const data=   await this.authService.validateUser(token);
 if (!data) {
        console.error('❌ Invalid token for client:', client.id);
        client.disconnect();
        return;
    }
 client.data.user=data;
 const roomId = `${data.id}_${data.number}`;
 client.join(roomId);
 console.log(`🔗 Client connected: ${client.id}, User Data: ${data}`);
 client.emit('joined', { room: roomId });
}
handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
}
@SubscribeMessage('join')
handleJoinRoom(
    @MessageBody() data:{roomId:string},
    @ConnectedSocket() client:Socket
){
    client.join(data.roomId);
    console.log(`👤 User ${data.roomId} joined room`);
    client.emit('joined', { room: data.roomId });
}
}