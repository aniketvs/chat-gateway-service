import { Injectable, OnModuleInit } from '@nestjs/common';

import { Server } from 'socket.io';
import { RedisPubSubService } from 'src/redis/services/redis-pub-sub.service';
import { RedisService } from 'src/redis/services/redis.service';

@Injectable()
export class CallEventsSubscriberService implements OnModuleInit {
  private server: Server
  constructor(
    private readonly redisPubSubService: RedisPubSubService,
    private readonly redisService: RedisService,

  ) { }
  setServer(server: Server) {
    this.server = server;
  }
  async onModuleInit() {
    this.redisPubSubService.subscribe('call_events', async (event) => {
      if (event.event === 'call_request') {
        const { caller, callee } = event.data;
        const myInstanceId = process.env.INSTANCE_ID;

        const isCaller = caller.instanceId === myInstanceId;
        const isCallee = callee.instanceId === myInstanceId;

        if (!isCaller && !isCallee) return;

        if (caller?.instanceId === myInstanceId) {

          this.server.to(caller.roomIds[0]).emit('call_ringing', {
            message: `Ringing ${callee.id}`,
          });

        }

        if (callee?.instanceId === myInstanceId && callee.status === 'online') {
          this.server.to(callee.roomIds[0]).emit('call_incoming', {
            message: `Incoming call from ${caller.id}`,
          });
        }

      }


    });
  }
}
