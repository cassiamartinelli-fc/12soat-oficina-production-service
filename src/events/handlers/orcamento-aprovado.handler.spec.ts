import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OrcamentoAprovadoHandler } from './orcamento-aprovado.handler';
import { EventBusService } from '../event-bus.service';
import { ExecucaoIniciadaPublisher } from '../publishers/execucao-iniciada.publisher';
import { FilaExecucao } from '../../domain/entities/fila-execucao.entity';
import { OrcamentoAprovadoEvent } from '../events.types';

describe('OrcamentoAprovadoHandler', () => {
  let handler: OrcamentoAprovadoHandler;

  let eventBusMock: jest.Mocked<EventBusService>;
  let repositoryMock: jest.Mocked<Repository<FilaExecucao>>;
  let publisherMock: jest.Mocked<ExecucaoIniciadaPublisher>;

  beforeEach(() => {
    eventBusMock = {
      registerHandler: jest.fn(),
    } as any;

    repositoryMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    publisherMock = {
      publish: jest.fn(),
    } as any;

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    handler = new OrcamentoAprovadoHandler(
      eventBusMock,
      repositoryMock,
      publisherMock,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    it('deve registrar handler no EventBus', () => {
      handler.onModuleInit();

      expect(eventBusMock.registerHandler).toHaveBeenCalledWith(
        'ORCAMENTO_APROVADO',
        expect.any(Function),
      );
    });
  });

  describe('handle', () => {
    const mockEvent: OrcamentoAprovadoEvent = {
      payload: {
        osId: 'OS123',
      },
    } as any;

    it('deve ignorar se execução já existir', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1' } as any);

      await handler.handle(mockEvent);

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { osId: 'OS123' },
      });
      expect(Logger.prototype.warn).toHaveBeenCalled();
      expect(repositoryMock.save).not.toHaveBeenCalled();
      expect(publisherMock.publish).not.toHaveBeenCalled();
    });

    it('deve criar execução e publicar evento', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      repositoryMock.create.mockImplementation((e) => e as any);

      repositoryMock.save.mockImplementation(
        async (e) => ({ ...e, id: '10' }) as any,
      );

      await handler.handle(mockEvent);

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          osId: 'OS123',
          status: 'EM_EXECUCAO',
        }),
      );

      expect(repositoryMock.save).toHaveBeenCalled();

      expect(publisherMock.publish).toHaveBeenCalledWith(
        'OS123',
        '10',
        expect.any(Date),
      );

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Execução iniciada'),
      );
    });

    it('deve tratar erro durante processamento', async () => {
      repositoryMock.findOne.mockRejectedValue(new Error('db error'));

      await handler.handle(mockEvent);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao iniciar execução'),
      );
    });
  });
});
