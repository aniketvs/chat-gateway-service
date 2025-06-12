import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { KafkaAdminService } from "./kafka-admin.service";

@Injectable()
export class KafkaInitService implements OnModuleInit{
   private readonly logger = new Logger(KafkaInitService.name);

  constructor(private readonly kafkaAdminService: KafkaAdminService) {}

  async onModuleInit() {
    try {
      await this.kafkaAdminService.createTopicIfNotExists('chat-messages', 3);
      this.logger.log('Kafka topic created successfully');
    } catch (err) {
      this.logger.error('Error creating Kafka topic', err);
    }
  }
}