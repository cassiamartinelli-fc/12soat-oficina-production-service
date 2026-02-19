import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventBusService } from '../event-bus.service';
import { OrcamentoAprovadoEvent } from '../events.types';
import { FilaExecucao } from '../../domain/entities/fila-execucao.entity';
import { ExecucaoIniciadaPublisher } from '../publishers/execucao-iniciada.publisher';

@Injectable()
export class OrcamentoAprovadoHandler implements OnModuleInit {
  private readonly logger = new Logger(OrcamentoAprovadoHandler.name);

  constructor(
    private readonly eventBus: EventBusService,
    @InjectRepository(FilaExecucao)
    private execucaoRepository: Repository<FilaExecucao>,
    private readonly execucaoIniciadaPublisher: ExecucaoIniciadaPublisher,
  ) {}

  onModuleInit() {
    this.eventBus.registerHandler('ORCAMENTO_APROVADO', (event) =>
      this.handle(event as OrcamentoAprovadoEvent),
    );
  }

  async handle(event: OrcamentoAprovadoEvent) {
    const { osId } = event.payload;
    this.logger.log(`OrcamentoAprovado recebido para OS ${osId}`);

    try {
      const existente = await this.execucaoRepository.findOne({
        where: { osId },
      });
      if (existente) {
        this.logger.warn(`Execução já existe para OS ${osId} — ignorando`);
        return;
      }

      const dataInicio = new Date();
      const execucao = this.execucaoRepository.create({
        osId,
        status: 'EM_EXECUCAO',
        dataInicio,
      });

      const salva = await this.execucaoRepository.save(execucao);

      await this.execucaoIniciadaPublisher.publish(osId, salva.id, dataInicio);
      this.logger.log(`Execução iniciada para OS ${osId} — id: ${salva.id}`);
    } catch (err) {
      this.logger.error(
        `Erro ao iniciar execução para OS ${osId}: ${err.message}`,
      );
    }
  }
}
