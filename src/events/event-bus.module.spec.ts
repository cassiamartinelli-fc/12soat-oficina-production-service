import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventBusModule } from './event-bus.module';
import { EventBusService } from './event-bus.service';
import { ExecucaoIniciadaPublisher } from './publishers/execucao-iniciada.publisher';
import { ExecucaoFinalizadaPublisher } from './publishers/execucao-finalizada.publisher';
import { OrcamentoAprovadoHandler } from './handlers/orcamento-aprovado.handler';
import { FilaExecucao } from '../domain/entities/fila-execucao.entity';

describe('EventBusModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EventBusModule],
    })
      .overrideProvider(getRepositoryToken(FilaExecucao))
      .useValue({
        find: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
      })
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('deve compilar o módulo', () => {
    expect(module).toBeDefined();
  });

  it('deve fornecer EventBusService', () => {
    const service = module.get<EventBusService>(EventBusService);
    expect(service).toBeInstanceOf(EventBusService);
  });

  it('deve fornecer ExecucaoIniciadaPublisher', () => {
    const publisher = module.get<ExecucaoIniciadaPublisher>(
      ExecucaoIniciadaPublisher,
    );
    expect(publisher).toBeInstanceOf(ExecucaoIniciadaPublisher);
  });

  it('deve fornecer ExecucaoFinalizadaPublisher', () => {
    const publisher = module.get<ExecucaoFinalizadaPublisher>(
      ExecucaoFinalizadaPublisher,
    );
    expect(publisher).toBeInstanceOf(ExecucaoFinalizadaPublisher);
  });

  it('deve fornecer OrcamentoAprovadoHandler', () => {
    const handler = module.get<OrcamentoAprovadoHandler>(
      OrcamentoAprovadoHandler,
    );
    expect(handler).toBeInstanceOf(OrcamentoAprovadoHandler);
  });
});
