import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
  clientId: 'chat-app',
  brokers: ['localhost:9092'], 
});
