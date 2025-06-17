import { Module } from '@nestjs/common';
import { ConnectionModule } from './connection/connection.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { KafkaAdminService } from './kafka/kafka-admin.service';
import { KafkaInitService } from './kafka/kafka-init.service';
import { RedisModule } from './redis/redis.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [  ConfigModule.forRoot({
      isGlobal: true,
    }),ConnectionModule,AuthModule,ChatModule,RedisModule],
  controllers: [],
  providers: [KafkaInitService,KafkaAdminService],
  exports: [KafkaInitService],
})
export class AppModule {}
