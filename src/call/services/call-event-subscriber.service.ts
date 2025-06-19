import { Injectable, OnModuleInit } from '@nestjs/common';

import { Server } from 'socket.io';
import { RedisPubSubService } from 'src/redis/services/redis-pub-sub.service';
import { RedisService } from 'src/redis/services/redis.service';
import { CALL_EVENTS } from '../constant/call-event.constant';
import { from } from 'rxjs';

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
      if (event.event === CALL_EVENTS.REQUEST) {
        const { caller, callee } = event.data;
        const myInstanceId = process.env.INSTANCE_ID;

        const isCaller = caller.instanceId === myInstanceId;
        const isCallee = callee.instanceId === myInstanceId;

        if (!isCaller && !isCallee) return;

        if (caller?.instanceId === myInstanceId) {

          this.server.to(caller.socketId).emit(CALL_EVENTS.RINGING, {
            message: `Ringing ${callee.id}`,
          });
          const { socketId, id, ...callerData } = caller;
          await this.redisService.set(`user:${caller.id}`, {
            ...callerData,
            callStatus: `${caller.socketId}:in_call`,
            lastPing: new Date().toISOString(),
          }, 60 * 5);
          await this.redisService.set(
            `call_session:${caller.id}_${callee.id}`,
            JSON.stringify({ to: callee.id , from: caller.id }),
            15
          );

        }

        if (callee?.instanceId === myInstanceId && callee.status === 'online') {
          this.server.to(callee.roomIds[0]).emit(CALL_EVENTS.INCOMING, {
            message: `Incoming call from ${caller.id}`,
          });
          const { id, ...calleeData } = callee;
          await this.redisService.set(`user:${callee.id}`, {
            ...calleeData,
            callStatus: `${callee.roomIds[0]}:in_call`,
            lastPing: new Date().toISOString(),
          }, 60 * 5);
        }


      }

      if(event.event=='call_timeout'){
        console.log(`Call timeout event received for caller: ${event.data.callerId}, callee: ${event.data.calleeId}`);
      }


    });
  }
}
