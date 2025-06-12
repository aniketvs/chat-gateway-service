import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { kafka } from './kafka.config';

@Injectable()
export class ProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProducerService.name);
  private producer: Producer;

  async onModuleInit() {
    this.producer = kafka.producer();
    await this.producer.connect();
    this.logger.log('✅ Kafka Producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('❌ Kafka Producer disconnected');
  }

  async send({
    topic,
    messages,
    partition,
  }: {
    topic: string;
    messages: {
      key?: string;
      value: Record<string, any> | string;
      partition?: number;
    }[];
    partition?: number;
  }) {
    try {
      await this.producer.send({
        topic,
        messages: messages.map((msg) => ({
          key: msg.key, // no default key
          value: typeof msg.value === 'string' ? msg.value : JSON.stringify(msg.value),
          partition: msg.partition ?? partition, // may be undefined
        })),
      });

      this.logger.log(`📤 Sent ${messages.length} message(s) to topic: ${topic}`);
    } catch (error) {
      this.logger.error('❌ Kafka send error:', error);
      throw error;
    }
  }
}
