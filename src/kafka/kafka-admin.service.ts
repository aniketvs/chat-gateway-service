// src/kafka/kafka-admin.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { kafka } from './kafka.config';

@Injectable()
export class KafkaAdminService {
  private readonly logger = new Logger(KafkaAdminService.name);
  private readonly admin = kafka.admin();

  async createTopicIfNotExists(topic: string, partition = 1): Promise<void> {
    try {
      await this.admin.connect();
      const topics = await this.admin.listTopics();
      if (!topics.includes(topic)) {
        await this.admin.createTopics({
          topics: [{ topic, numPartitions: partition }],
        });
        this.logger.log(`✅ Topic "${topic}" created successfully.`);
      } else {
        this.logger.log(`🔔 Topic "${topic}" already exists.`);
      }
    } catch (error) {
      this.logger.error(`❌ Error creating topic "${topic}":`, error);
    } finally {
      await this.admin.disconnect();
    }
  }
}
