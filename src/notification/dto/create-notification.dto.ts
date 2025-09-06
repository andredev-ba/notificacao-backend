import { IsUUID, IsNotEmpty, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  mensagemId: string;

  @IsString()
  @IsNotEmpty({ message: 'conteudoMensagem não pode ser vazio' })
  conteudoMensagem: string;
}
