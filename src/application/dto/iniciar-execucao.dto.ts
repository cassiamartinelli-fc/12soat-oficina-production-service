import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class IniciarExecucaoDto {
  @ApiProperty({ example: '123', description: 'ID da Ordem de Serviço' })
  @IsString()
  osId: string;
}
