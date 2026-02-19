import { ExecucaoFinalizadaPublisher } from './execucao-finalizada.publisher';
import { EventBusService } from '../event-bus.service';

describe('ExecucaoFinalizadaPublisher', () => {
  let publisher: ExecucaoFinalizadaPublisher;
  let eventBusMock: jest.Mocked<EventBusService>;

  beforeEach(() => {
    eventBusMock = {
      publish: jest.fn(),
    } as any;

    delete process.env.SQS_OS_QUEUE_URL;

    publisher = new ExecucaoFinalizadaPublisher(eventBusMock);
  });

  it('deve publicar evento EXECUCAO_FINALIZADA com payload correto', async () => {
    const dataInicio = new Date('2024-01-01T00:00:00.000Z');
    const dataFim = new Date('2024-01-05T00:00:00.000Z');

    await publisher.publish('OS123', 'EXEC1', dataInicio, dataFim, 4);

    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'EXECUCAO_FINALIZADA',
      'OS123',
      {
        osId: 'OS123',
        execucaoId: 'EXEC1',
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        duracaoDias: 4,
      },
      [],
    );
  });
});
