import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { RedisPubSubService } from 'src/redis/services/redis-pub-sub.service';
import { RedisService } from 'src/redis/services/redis.service';
import { CALL_EVENTS } from '../constant/call-event.constant';
import { CallHelperService } from '../helper/call.helper';

@Injectable()
export class CallEventsSubscriberService implements OnModuleInit {
  private server: Server
  constructor(
    private readonly redisPubSubService: RedisPubSubService,
    private readonly redisService: RedisService,
    private readonly callHelperService: CallHelperService

  ) { }
  setServer(server: Server) {
    this.server = server;
  }
  async onModuleInit() {
    this.redisPubSubService.subscribe('call_events', async (event) => {
      const { caller, callee } = event.data;
      const myInstanceId = process.env.INSTANCE_ID;
      const isCaller = caller?.instanceId === myInstanceId;
      const isCallee = callee?.instanceId === myInstanceId;

      if (!isCaller && !isCallee) return;
      if (event.event === CALL_EVENTS.REQUEST) {

        if (caller?.instanceId === myInstanceId) {

          this.server.to(caller.socketId).emit(CALL_EVENTS.RINGING, {
            message: `Ringing ${callee.id}`,
          });
          const { socketId, id, ...callerData } = caller;
          await this.callHelperService.resetCallStatus(caller.id, callerData, `${caller.socketId}:in_call`);
          await this.redisService.set(
            `call_session:${caller.id}_${callee.id}`,
            JSON.stringify({ to: callee.id, from: caller.id }),
            15
          );

        }

        if (callee?.instanceId === myInstanceId && callee.status === 'online') {
          this.server.to(callee.roomIds[0]).emit(CALL_EVENTS.INCOMING, {
            message: `Incoming call from ${caller.id}`,
          });
          const { id, ...calleeData } = callee;


          await this.callHelperService.resetCallStatus(callee.id, calleeData, `${callee.roomIds[0]}:in_call`);
        }

      }

      if (event.event === CALL_EVENTS.CALL_END) {
        if (isCaller) {
          this.server.to(caller.socketId).emit(CALL_EVENTS.ENDED, {
            message: `You ended the call.`,
          });

          const { socketId, id, ...callerData } = caller;
          await this.callHelperService.resetCallStatus(caller.id, callerData);
        }

        if (isCallee) {
          callee.roomIds.length && this.server.to(callee.roomIds[0]).emit(CALL_EVENTS.ENDED, {
            message: `Call ended by ${caller.id}`,
          });

          const { id, ...calleeData } = callee;
          await this.callHelperService.resetCallStatus(callee.id, calleeData);
        }
      }

      if (event.event == CALL_EVENTS.CALL_ACCEPTED) {
        if (isCaller) {
          const socketId = caller.callStatus.split(':')[0];
          console.log(socketId);
          this.server.to(socketId).emit(CALL_EVENTS.CALL_ACCEPTED, {
            message: `Your call accepted.`,
          });

          const { id, ...callerData } = caller;
          await this.callHelperService.resetCallStatus(caller.id, callerData, `${socketId}:on_call`);
        }

        if (isCallee) {
          const { socketId, id, ...calleeData } = callee;
          this.server.to(socketId).emit(CALL_EVENTS.CALL_ACCEPTED, {
            message: `Call accepted by ${callee.id}`,
          });
          await this.callHelperService.resetCallStatus(callee.id, calleeData, `${socketId}:on_call`);
        }


      }




    });
  }
}
