import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExecucaoController } from './execucao.controller';
import { FilaExecucao } from '../../domain/entities/fila-execucao.entity';

describe('ExecucaoController', () => {
  let controller: ExecucaoController;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecucaoController],
      providers: [
        {
          provide: getRepositoryToken(FilaExecucao),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get(ExecucaoController);
    jest.clearAllMocks();
  });

  describe('iniciar', () => {
    it('deve criar e salvar uma nova execução', async () => {
      const dto = { osId: 'os-1' };
      const created = {
        osId: dto.osId,
        status: 'EM_EXECUCAO' as const,
        dataInicio: new Date(),
      };

      mockRepository.create.mockReturnValue(created);
      mockRepository.save.mockResolvedValue(created);

      const result = await controller.iniciar(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          osId: dto.osId,
          status: 'EM_EXECUCAO',
        }),
      );

      const calls = mockRepository.create.mock.calls as unknown as Array<
        [Record<string, unknown>]
      >;

      const firstArg = calls[0][0];
      expect(firstArg.dataInicio).toBeInstanceOf(Date);

      expect(mockRepository.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('listar', () => {
    it('deve retornar lista de execuções', async () => {
      const execucoes = [{ id: '1' }];
      mockRepository.find.mockResolvedValue(execucoes);

      const result = await controller.listar();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(execucoes);
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar execução pelo id', async () => {
      const execucao = { id: '1' };
      mockRepository.findOne.mockResolvedValue(execucao);

      const result = await controller.buscarPorId('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(execucao);
    });
  });

  describe('finalizar', () => {
    it('deve finalizar execução e calcular duração', async () => {
      const dataInicio = new Date('2024-01-01');
      const execucao = {
        id: '1',
        status: 'EM_EXECUCAO' as const,
        dataInicio,
      };

      mockRepository.findOne.mockResolvedValue(execucao);
      mockRepository.save.mockResolvedValue(execucao);

      const result = await controller.finalizar('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });

      expect(result.status).toBe('FINALIZADA');
      expect(result.dataFim).toBeInstanceOf(Date);
      expect(typeof result.duracaoDias).toBe('number');
      expect(result.duracaoDias).toBeGreaterThanOrEqual(1);
      expect(mockRepository.save).toHaveBeenCalledWith(execucao);
    });

    it('deve finalizar execução sem calcular duração quando dataInicio for nulo', async () => {
      const execucao = {
        id: '1',
        status: 'EM_EXECUCAO' as const,
        dataInicio: null,
        duracaoDias: undefined,
      };

      mockRepository.findOne.mockResolvedValue(execucao);
      mockRepository.save.mockResolvedValue(execucao);

      const result = await controller.finalizar('1');

      expect(result.status).toBe('FINALIZADA');
      expect(result.dataFim).toBeInstanceOf(Date);
      expect(result.duracaoDias).toBeUndefined();
      expect(mockRepository.save).toHaveBeenCalledWith(execucao);
    });

    it('deve lançar erro quando execução não encontrada', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(controller.finalizar('1')).rejects.toThrow(
        'Execução não encontrada',
      );
    });
  });
});
