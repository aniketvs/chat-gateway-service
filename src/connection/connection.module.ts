import { Module } from '@nestjs/common';
import { ConnectionGateway } from './gateway/connection.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [ConnectionGateway],
})
export class ConnectionModule {}