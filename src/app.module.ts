import { Module } from '@nestjs/common';
import { ConnectionModule } from './connection/connection.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { KafkaAdminService } from './kafka/kafka-admin.service';
import { KafkaInitService } from './kafka/kafka-init.service';

@Module({
  imports: [ConnectionModule,AuthModule,ChatModule],
  controllers: [],
  providers: [KafkaInitService,KafkaAdminService],
  exports: [KafkaInitService],
})
export class AppModule {}
