import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { RedisPubSubService } from "src/redis/services/redis-pub-sub.service";
import { RedisService } from "src/redis/services/redis.service";
import { CALL_EVENTS } from "../constant/call-event.constant";

@Injectable()
export class CallTimeoutListenerService implements OnModuleInit{
     private readonly subscriber = new Redis(process.env.REDIS_URL);
    constructor(
        private readonly redisPubSubService: RedisPubSubService,
        private readonly redisService: RedisService,
    ) {}
   async onModuleInit() {
    await this.subscriber.psubscribe('__keyevent@0__:expired');

    this.subscriber.on('pmessage', async (pattern, channel, expiredKey) => {
      if (expiredKey.startsWith('call_session:')) {
        const users = expiredKey.split(':')[1];
        const [callerId, calleeId] = users.split('_');
        this.redisPubSubService.publish('call_timeout_event', {
          event: CALL_EVENTS.CALL_TIMEOUT,
          data: { callerId ,calleeId},
        });
      }
    });
    }
}