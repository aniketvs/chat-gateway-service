import { Injectable, OnModuleInit } from '@nestjs/common';

import { Server } from 'socket.io';
import { RedisPubSubService } from 'src/redis/services/redis-pub-sub.service';
import { RedisService } from 'src/redis/services/redis.service';

@Injectable()
export class CallEventsSubscriberService implements OnModuleInit {
      private  server: Server
  constructor(
    private readonly redisPubSubService: RedisPubSubService,
    private readonly redisService: RedisService,
  
  ) {}
 setServer(server: Server) {
    this.server = server;
  }
  async onModuleInit() {
    this.redisPubSubService.subscribe('call_events', async (event) => {
     if(event.event === 'call_request'){
        const {callerId,calleeId}=event.data;
        console.log(`📞 Call request received: Caller ID ${callerId}, Callee ID ${calleeId}`);
        const callerStatus = await this.redisService.get(`user:${callerId}`);
        const calleeStatus = await this.redisService.get(`user:${calleeId}`);
        console.log(calleeStatus, callerStatus);
       if(calleeStatus && calleeStatus.status !== 'online') {
            console.warn(`⚠️ User ${calleeId} is not online. Cannot ring.`);
            this.server.to(callerStatus?.roomIds[0]).emit('user_not_online', {
                message: `User ${calleeId} is not online. Cannot ring.`,
            });
            return;
        }

        if(callerStatus && callerStatus.status === 'online') {
            this.server.to(callerStatus?.roomIds[0]).emit('call_ringing',{
                message: `Ringing ${calleeId}`,
            });
        }
        
        if(calleeStatus && calleeStatus.status === 'online') {
            this.server.to(calleeStatus?.roomIds[0]).emit('call_incoming', {
                message: `Incoming call from ${callerId}`,
            });
        }
     }

     
    });
  }
}
