import { Injectable } from "@nestjs/common";
import { RedisService } from "src/redis/services/redis.service";

@Injectable()
export class CallHelperService {
    constructor(
        private readonly redisService: RedisService
    ) {
    }

    async resetCallStatus(userId: string, data: any,callStatus?:String) {
        await this.redisService.set(`user:${userId}`, {
            ...data,
            callStatus: callStatus ?? 'available',
            lastPing: new Date().toISOString(),
        }, 60 * 5);
    }

}