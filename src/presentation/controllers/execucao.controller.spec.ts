import { Repository } from 'typeorm';
import { ExecucaoController } from './execucao.controller';
import { FilaExecucao } from '../../domain/entities/fila-execucao.entity';
import { ExecucaoFinalizadaPublisher } from '../../events/publishers/execucao-finalizada.publisher';

describe('ExecucaoController', () => {
  let controller: ExecucaoController;

  let repositoryMock: jest.Mocked<Repository<FilaExecucao>>;
  let publisherMock: jest.Mocked<ExecucaoFinalizadaPublisher>;

  beforeEach(() => {
    repositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    publisherMock = {
      publish: jest.fn(),
    } as any;

    controller = new ExecucaoController(repositoryMock, publisherMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('iniciar', () => {
    it('deve criar e salvar nova execução', async () => {
      const dto = { osId: 'OS123' };

      repositoryMock.create.mockImplementation((e) => e as any);
      repositoryMock.save.mockImplementation(
        async (e) =>
          ({
            ...e,
            id: '1',
          }) as any,
      );

      const result = await controller.iniciar(dto as any);

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          osId: 'OS123',
          status: 'EM_EXECUCAO',
        }),
      );

      expect(repositoryMock.save).toHaveBeenCalled();
      expect(result.id).toBe('1');
    });
  });

  describe('listar', () => {
    it('deve retornar lista de execuções', async () => {
      repositoryMock.find.mockResolvedValue([{ id: '1' }] as any);

      const result = await controller.listar();

      expect(repositoryMock.find).toHaveBeenCalled();
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar execução por id', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1' } as any);

      const result = await controller.buscarPorId('1');

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });

      expect(result).toEqual({ id: '1' });
    });
  });

  describe('finalizar', () => {
    it('deve finalizar execução e publicar evento', async () => {
      const dataInicio = new Date('2024-01-01T00:00:00.000Z');

      repositoryMock.findOne.mockResolvedValue({
        id: '1',
        osId: 'OS123',
        status: 'EM_EXECUCAO',
        dataInicio,
      } as any);

      repositoryMock.save.mockImplementation(async (e) => e as any);

      const result = await controller.finalizar('1');

      expect(repositoryMock.save).toHaveBeenCalled();
      expect(publisherMock.publish).toHaveBeenCalledWith(
        'OS123',
        '1',
        expect.any(Date),
        expect.any(Date),
        expect.any(Number),
      );

      expect(result.status).toBe('FINALIZADA');
    });

    it('deve lançar erro se execução não encontrada', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(controller.finalizar('1')).rejects.toThrow(
        'Execução não encontrada',
      );
    });
  });
});
