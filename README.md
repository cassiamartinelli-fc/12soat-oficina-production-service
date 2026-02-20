# Production Service

Microsserviço responsável pela gestão da fila de execução e produção dos serviços na oficina.

## Responsabilidades

- Gerenciar a fila de Ordens de Serviço que aguardam execução.
- Atualizar o status da OS durante as fases de diagnóstico e reparo.
- Comunicar a finalização do serviço ao `OS Service` através de eventos.

## Tecnologias

- **Framework**: NestJS (Node.js + TypeScript)
- **Banco de Dados**: PostgreSQL (via TypeORM)
- **Mensageria**: AWS SQS

## Variáveis de Ambiente (Secrets)

As seguintes variáveis de ambiente devem ser configuradas como secrets no repositório do GitHub:

- `AWS_ACCESS_KEY_ID` — AWS Access Key
- `AWS_SECRET_ACCESS_KEY` — AWS Secret Key
- `DATABASE_URL`: Connection string PostgreSQL (Neon)
- `KUBECONFIG` — Obtido no Passo 1.3
- `SONAR_TOKEN`:  Token do Sonar
- `SQS_OS_QUEUE_URL`: URL da fila SQS de OS Service
- `SQS_PRODUCTION_QUEUE_URL`: URL da fila SQS de OS Production
- `NEON_DATABASE_URL` — Connection string PostgreSQL (Neon)
- `RABBITMQ_URL` — URL do RabbitMQ (mesma dos outros serviços)
- `NEW_RELIC_LICENSE_KEY` — License key New Relic
