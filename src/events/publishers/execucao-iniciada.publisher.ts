import { Injectable } from '@nestjs/common';
import { EventBusService } from '../event-bus.service';

@Injectable()
export class ExecucaoIniciadaPublisher {
  constructor(private readonly eventBus: EventBusService) {}

  async publish(osId: string, execucaoId: string, dataInicio: Date) {
    await this.eventBus.publish('EXECUCAO_INICIADA', osId, {
      osId,
      execucaoId,
      dataInicio: dataInicio.toISOString(),
    });
  }
}
