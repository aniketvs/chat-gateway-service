import { Global, Module } from "@nestjs/common";
import { RedisService } from "./services/redis.service";
import { RedisPubSubService } from "./services/redis-pub-sub.service";
@Global()
@Module({
providers: [RedisService,RedisPubSubService],
exports: [RedisService,RedisPubSubService],
})
export class RedisModule {

}