import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { RedisPubSubService } from "src/redis/services/redis-pub-sub.service";
import { RedisService } from "src/redis/services/redis.service";

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
          event: 'call_timeout',
          data: { callerId ,calleeId},
        });
      }
    });
    }
}