import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQProvider implements OnModuleInit, OnModuleDestroy {
  private conn!: amqp.Connection;
  private channel!: amqp.Channel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('RABBITMQ_URL')!;
    this.conn = await amqp.connect(url);
    this.channel = await this.conn.createChannel();

    await this.channel.assertQueue(this.config.get<string>('QUEUE_IN')!, { durable: true });
    await this.channel.assertQueue(this.config.get<string>('QUEUE_STATUS')!, { durable: true });

    await this.channel.prefetch(1);
  }

  getChannel() {
    return this.channel;
  }

  async onModuleDestroy() {
    await this.channel?.close().catch(() => {});
    await this.conn?.close().catch(() => {});
  }
}
