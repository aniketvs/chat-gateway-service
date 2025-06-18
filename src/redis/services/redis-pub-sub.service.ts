import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisPubSubService {
    private pub: Redis;
    private sub: Redis;
    private readonly redisUrl: string = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    private readonly logger = new Logger(RedisPubSubService.name);

    constructor() {
        this.pub = new Redis(this.redisUrl);
        this.sub = new Redis(this.redisUrl);

        this.sub.on('connect', () => this.logger.log('✅ Redis Pub/Sub connected'));
        this.sub.on('error', err => this.logger.error('❌ Redis Pub/Sub error:', err));
        this.pub.on('connect', () => this.logger.log('✅ Redis Publisher connected'));
        this.pub.on('error', err => this.logger.error('❌ Redis Publisher error:', err));
    }
    async publish(channel: string, message: any) {
        
        return this.pub.publish(channel, JSON.stringify(message));
    }
    async subscribe(channel: string, handler: (message: any) => void) {
        await this.sub.subscribe(channel);
        this.sub.on('message', (chan, msg) => {
            if (chan === channel) {
                try {
                    const parsed = JSON.parse(msg);
                    handler(parsed);
                } catch (e) {
                    console.error('Invalid JSON from channel', chan);
                }
            }
        });
    }

}