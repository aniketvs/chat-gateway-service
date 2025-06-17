import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { AuthService } from "src/auth/service/auth.service";
import { RedisService } from "src/redis/redis.service";
@WebSocketGateway({ cors: { origin: '*' } })
export class ConnectionGateway implements OnGatewayConnection, OnGatewayDisconnect {

    constructor(private readonly authService: AuthService,
        private readonly redisService: RedisService,
    ) { }

    @WebSocketServer()
    server: Server;

    async handleConnection(client: Socket) {
        const token = client.handshake.auth.token;
        if (!token) {
            console.error('❌ No token provided for client:', client.id);
            client.disconnect();
            return;
        }
        const data = await this.authService.validateUser(token);
        if (!data) {
            console.error('❌ Invalid token for client:', client.id);
            client.disconnect();
            return;
        }
        client.data.user = data;
        const roomId = `${data.id}_${data.number}`;
        client.join(roomId);

        const redisKey = `user:${data.id}`;
        const existingData = await this.redisService.get(redisKey);

        if (existingData) {
            existingData.socketIds.push(client.id);
            existingData.status = 'online';
            existingData.roomIds=[roomId];
            existingData.instanceId= process.env.INSTANCE_ID || 'default',
            await this.redisService.set(redisKey, existingData, 60 * 5); // reset TTL
        } else {
            const redisValue = {
                status: 'online',
                socketIds: [client.id],
                roomIds: [roomId],
                instanceId: process.env.INSTANCE_ID || 'default',
            };
            await this.redisService.set(redisKey, redisValue, 60 * 5);
        }

        console.log(`🔗 Client connected: ${client.id}, User Data: ${data}`);
        client.emit('joined', { room: roomId });
    }
    async handleDisconnect(client: Socket) {
        const user = client.data.user;
        if (!user) return;

        const redisKey = `user:${user.id}`;
        const data = await this.redisService.get(redisKey);

        if (data) {
            const newSocketList = (data.socketIds || []).filter(id => id !== client.id);
            if (newSocketList.length === 0) {
                await this.redisService.set(redisKey, {
                    ...data,
                    status: 'offline',
                    socketIds: [],
                    roomIds: []
                });
            } else {
                await this.redisService.set(redisKey, {
                    ...data,
                    socketIds: newSocketList,

                });
            }
        }

        console.log(`❌ Disconnected: ${client.id}`);
    }
    @SubscribeMessage('join')
    handleJoinRoom(
        @MessageBody() data: { roomId: string },
        @ConnectedSocket() client: Socket
    ) {
        client.join(data.roomId);
        console.log(`👤 User ${data.roomId} joined room`);
        client.emit('joined', { room: data.roomId });
    }
}