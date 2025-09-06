import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { RabbitMQProvider } from './rabbitmq.provider';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationController],
  providers: [NotificationService, RabbitMQProvider],
})
export class NotificationModule implements OnModuleInit {
  constructor(private readonly service: NotificationService) {}
  async onModuleInit() {
    await this.service.startConsumer();
  }
}
