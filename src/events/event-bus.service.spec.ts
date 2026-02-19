import { Logger } from '@nestjs/common';
import { EventBusService } from './event-bus.service';

const sendMock = jest.fn();

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation(() => ({
    send: sendMock,
  })),
  SendMessageCommand: jest.fn().mockImplementation((input) => ({ input })),
  ReceiveMessageCommand: jest.fn().mockImplementation((input) => ({ input })),
  DeleteMessageCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

describe('EventBusService', () => {
  let service: EventBusService;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    process.env.SQS_QUEUE_URL = 'http://localhost/queue';
    process.env.AWS_REGION = 'us-east-1';

    service = new EventBusService();
  });

  afterEach(() => {
    (service as any).polling = false;
    jest.restoreAllMocks();
    delete process.env.SQS_QUEUE_URL;
    delete process.env.AWS_REGION;
  });

  describe('onModuleInit', () => {
    it('deve chamar startPolling quando houver queueUrl', () => {
      const spy = jest
        .spyOn(service as any, 'startPolling')
        .mockResolvedValue(undefined);

      service.onModuleInit();

      expect(spy).toHaveBeenCalled();
    });

    it('deve logar warning quando não houver queueUrl', () => {
      delete process.env.SQS_QUEUE_URL;
      const serviceNoQueue = new EventBusService();

      serviceNoQueue.onModuleInit();

      expect(Logger.prototype.warn).toHaveBeenCalled();
    });
  });

  describe('registerHandler', () => {
    it('deve registrar handler', () => {
      const handler = jest.fn();
      service.registerHandler('TEST', handler);

      const handlers = (service as any).handlers;
      expect(handlers.get('TEST')).toBe(handler);
    });
  });

  describe('publish', () => {
    it('deve publicar evento', async () => {
      sendMock.mockResolvedValue({});

      await service.publish('EVENT', '1', {});

      expect(sendMock).toHaveBeenCalled();
    });

    it('não deve publicar sem queueUrl', async () => {
      delete process.env.SQS_QUEUE_URL;
      const serviceNoQueue = new EventBusService();

      await serviceNoQueue.publish('EVENT', '1', {});

      expect(sendMock).not.toHaveBeenCalled();
    });

    it('deve tratar erro ao publicar', async () => {
      sendMock.mockRejectedValue(new Error('erro'));

      await service.publish('EVENT', '1', {});

      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('startPolling (1 iteração controlada)', () => {
    it('deve processar mensagens recebidas', async () => {
      const processSpy = jest
        .spyOn(service as any, 'processMessage')
        .mockResolvedValue(undefined);

      sendMock.mockResolvedValueOnce({
        Messages: [
          {
            Body: JSON.stringify({
              eventType: 'X',
              aggregateId: '1',
            }),
            ReceiptHandle: 'abc',
          },
        ],
      });

      (service as any).polling = true;

      const pollingPromise = (service as any).startPolling();

      await Promise.resolve();
      (service as any).polling = false;

      await pollingPromise;

      expect(processSpy).toHaveBeenCalled();
    });

    it('deve tratar erro no polling', async () => {
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => fn());

      sendMock.mockRejectedValueOnce(new Error('polling error'));

      (service as any).polling = true;

      const pollingPromise = (service as any).startPolling();

      await Promise.resolve();
      (service as any).polling = false;

      await pollingPromise;

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Erro no polling SQS'),
      );
    });
  });

  describe('processMessage', () => {
    it('deve executar handler e deletar mensagem', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      service.registerHandler('TEST_EVENT', handler);

      sendMock.mockResolvedValue({});

      await (service as any).processMessage({
        Body: JSON.stringify({
          eventType: 'TEST_EVENT',
          aggregateId: '1',
        }),
        ReceiptHandle: 'abc',
      });

      expect(handler).toHaveBeenCalled();
      expect(sendMock).toHaveBeenCalled();
    });

    it('deve continuar mesmo sem handler', async () => {
      sendMock.mockResolvedValue({});

      await (service as any).processMessage({
        Body: JSON.stringify({
          eventType: 'NONE',
          aggregateId: '1',
        }),
        ReceiptHandle: 'abc',
      });

      expect(sendMock).toHaveBeenCalled();
    });

    it('deve tratar erro no processamento', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('erro'));
      service.registerHandler('TEST_EVENT', handler);

      sendMock.mockResolvedValue({});

      await (service as any).processMessage({
        Body: JSON.stringify({
          eventType: 'TEST_EVENT',
          aggregateId: '1',
        }),
        ReceiptHandle: 'abc',
      });

      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });
});
