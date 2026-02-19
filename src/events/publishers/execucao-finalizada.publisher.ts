import { Injectable } from '@nestjs/common';
import { EventBusService } from '../event-bus.service';

@Injectable()
export class ExecucaoFinalizadaPublisher {
  constructor(private readonly eventBus: EventBusService) {}

  async publish(
    osId: string,
    execucaoId: string,
    dataInicio: Date,
    dataFim: Date,
    duracaoDias: number,
  ) {
    await this.eventBus.publish('EXECUCAO_FINALIZADA', osId, {
      osId,
      execucaoId,
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString(),
      duracaoDias,
    });
  }
}
