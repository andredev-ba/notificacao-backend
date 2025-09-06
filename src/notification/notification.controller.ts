import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationService } from './notification.service';
import { IncomingMessage } from './types';

@Controller('notificar')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async notificar(@Body() dto: CreateNotificationDto) {
    const mensagemId = dto.mensagemId || uuid();

    const payload: IncomingMessage = {
      mensagemId,
      conteudoMensagem: dto.conteudoMensagem,
    };

    await this.service.publishIncoming(payload);

    return {
      mensagemId,
      status: 'RECEBIDO',
    };
  }

  @Get('status/:id')
  async status(@Param('id') id: string) {
    const st = this.service.getStatus(id);
    return { mensagemId: id, status: st ?? null };
  }
}
