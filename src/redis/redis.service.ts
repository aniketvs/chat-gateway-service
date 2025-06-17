import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService {
    private client: Redis;
    private readonly logger = new Logger(RedisService.name);
    constructor() {
        this.client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
        this.client.on('connect', () => this.logger.log('✅ Redis connected'));
        this.client.on('error', err => this.logger.error('❌ Redis error:', err));
    }
    async get(key: string): Promise<string | any | null> {
        const val = await this.client.get(key);
        try {
            return JSON.parse(val || '');
        } catch {
            return val;
        }
    }

    async set(key: string, value: any, ttlInSeconds?: number) {
        const val = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttlInSeconds) {
            return this.client.set(key, val, 'EX', ttlInSeconds);
        }
        return this.client.set(key, val);
    }

    async del(key: string) {
        return this.client.del(key);
    }

    async expire(key: string, seconds: number) {
        return this.client.expire(key, seconds);
    }

    async hget<T = any>(key: string, field: string): Promise<T | string | null> {
        const val = await this.client.hget(key, field);
        try {
            return JSON.parse(val || '');
        } catch {
            return val;
        }
    }

    async hset(key: string, field: string, value: any) {
        const val = typeof value === 'string' ? value : JSON.stringify(value);
        return this.client.hset(key, field, val);
    }
    async hdel(key: string, field: string) {
        return this.client.hdel(key, field);
    }

    async hgetall<T = any>(key: string): Promise<Record<string, T>> {
        const raw = await this.client.hgetall(key);
        const parsed: Record<string, T> = {};
        for (const [field, value] of Object.entries(raw)) {
            try {
                parsed[field] = JSON.parse(value);
            } catch {
                parsed[field] = value as any;
            }
        }
        return parsed;
    }



}