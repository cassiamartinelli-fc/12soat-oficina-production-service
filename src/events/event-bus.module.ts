import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventBusService } from './event-bus.service';
import { ExecucaoIniciadaPublisher } from './publishers/execucao-iniciada.publisher';
import { ExecucaoFinalizadaPublisher } from './publishers/execucao-finalizada.publisher';
import { OrcamentoAprovadoHandler } from './handlers/orcamento-aprovado.handler';
import { FilaExecucao } from '../domain/entities/fila-execucao.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FilaExecucao])],
  providers: [
    EventBusService,
    ExecucaoIniciadaPublisher,
    ExecucaoFinalizadaPublisher,
    OrcamentoAprovadoHandler,
  ],
  exports: [
    EventBusService,
    ExecucaoIniciadaPublisher,
    ExecucaoFinalizadaPublisher,
  ],
})
export class EventBusModule {}
