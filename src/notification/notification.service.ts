import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMQProvider } from './rabbitmq.provider';
import { IncomingMessage, Status, StatusMessage } from './types';

@Injectable()
export class NotificationService {
  private statusMap = new Map<string, Status>();

  constructor(
    private readonly mq: RabbitMQProvider,
    private readonly config: ConfigService,
  ) {}

  async publishIncoming(msg: IncomingMessage) {
    const ch = this.mq.getChannel();
    const payload = Buffer.from(JSON.stringify(msg));
    ch.sendToQueue(this.config.get<string>('QUEUE_IN')!, payload, { persistent: true });

    this.statusMap.set(msg.mensagemId, 'RECEBIDO');
  }

  setStatus(id: string, status: Status) {
    this.statusMap.set(id, status);
  }

  getStatus(id: string): Status | undefined {
    return this.statusMap.get(id);
  }

  async startConsumer() {
    const ch = this.mq.getChannel();
    const inQueue = this.config.get<string>('QUEUE_IN')!;
    const statusQueue = this.config.get<string>('QUEUE_STATUS')!;

    await ch.consume(inQueue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString()) as IncomingMessage;

        const delay = 1000 + Math.random() * 1000;
        await new Promise((r) => setTimeout(r, delay));

        const rng = Math.floor(Math.random() * 10) + 1;
        const status: Status = rng <= 2 ? 'FALHA_PROCESSAMENTO' : 'PROCESSADO_SUCESSO';

        this.setStatus(content.mensagemId, status);

        const statusMsg: StatusMessage = { mensagemId: content.mensagemId, status };
        ch.sendToQueue(statusQueue, Buffer.from(JSON.stringify(statusMsg)), { persistent: true });

        ch.ack(msg);
      } catch (e) {
        ch.nack(msg, false, false);
      }
    });
  }
}
