import { Module } from "@nestjs/common";
import { ChatGateway } from "./gateway/chat.gateway";
import { ChatService } from "./service/chat.service";
import { ProducerService } from "src/kafka/producer.service";

@Module({
imports: [],
controllers: [],
providers: [ChatGateway,ChatService,ProducerService],
exports: [],
})
export class ChatModule {}