import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';
import { SagaEvent } from './events.types';

@Injectable()
export class EventBusService implements OnModuleInit {
  private readonly logger = new Logger(EventBusService.name);
  private readonly client: SQSClient;
  private readonly queueUrl: string;
  private handlers: Map<string, (event: SagaEvent) => Promise<void>> =
    new Map();
  private polling = false;

  constructor() {
    this.client = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.queueUrl = process.env.SQS_QUEUE_URL || '';
  }

  onModuleInit() {
    if (this.queueUrl) {
      this.startPolling();
    } else {
      this.logger.warn('SQS_QUEUE_URL não configurada — eventos desabilitados');
    }
  }

  registerHandler(
    eventType: string,
    handler: (event: SagaEvent) => Promise<void>,
  ) {
    this.handlers.set(eventType, handler);
    this.logger.log(`Handler registrado para: ${eventType}`);
  }

  async publish(eventType: string, aggregateId: string, payload: object) {
    if (!this.queueUrl) return;

    const event: SagaEvent = {
      eventId: randomUUID(),
      eventType,
      aggregateId,
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'production-service',
      payload,
    } as SagaEvent;

    try {
      await this.client.send(
        new SendMessageCommand({
          QueueUrl: this.queueUrl,
          MessageBody: JSON.stringify(event),
          MessageAttributes: {
            eventType: { DataType: 'String', StringValue: eventType },
            source: {
              DataType: 'String',
              StringValue: 'production-service',
            },
          },
        }),
      );
      this.logger.log(`Evento publicado: ${eventType} [${aggregateId}]`);
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Erro ao publicar evento ${eventType}: ${error.message}`,
      );
    }
  }

  private async startPolling() {
    this.polling = true;
    this.logger.log('Iniciando polling SQS...');

    while (this.polling) {
      try {
        const result = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
            MessageAttributeNames: ['All'],
          }),
        );

        for (const message of result.Messages || []) {
          await this.processMessage(message);
        }
      } catch (err) {
        const error = err as Error;
        this.logger.error(`Erro no polling SQS: ${error.message}`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  private async processMessage(message: Message) {
    try {
      const event: SagaEvent = JSON.parse(message.Body ?? '{}') as SagaEvent;
      const handler = this.handlers.get(event.eventType);

      if (handler) {
        this.logger.log(
          `Processando evento: ${event.eventType} [${event.aggregateId}]`,
        );
        await handler(event);
      }

      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl: this.queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Erro ao processar mensagem: ${error.message}`);
    }
  }
}
