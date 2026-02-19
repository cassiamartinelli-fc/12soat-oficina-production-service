import { ExecucaoIniciadaPublisher } from './execucao-iniciada.publisher';
import { EventBusService } from '../event-bus.service';

describe('ExecucaoIniciadaPublisher', () => {
  let publisher: ExecucaoIniciadaPublisher;
  let eventBusMock: jest.Mocked<EventBusService>;

  beforeEach(() => {
    eventBusMock = {
      publish: jest.fn(),
    } as any;

    delete process.env.SQS_OS_QUEUE_URL;

    publisher = new ExecucaoIniciadaPublisher(eventBusMock);
  });

  it('deve publicar evento EXECUCAO_INICIADA com payload correto', async () => {
    const dataInicio = new Date('2024-01-01T00:00:00.000Z');

    await publisher.publish('OS123', 'EXEC1', dataInicio);

    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'EXECUCAO_INICIADA',
      'OS123',
      {
        osId: 'OS123',
        execucaoId: 'EXEC1',
        dataInicio: dataInicio.toISOString(),
      },
      [],
    );
  });
});
