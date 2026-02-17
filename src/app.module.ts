import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health/health.controller';
import { ExecucaoController } from './presentation/controllers/execucao.controller';
import { FilaExecucao } from './domain/entities/fila-execucao.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || '',
      entities: [FilaExecucao],
      synchronize: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([FilaExecucao]),
  ],
  controllers: [HealthController, ExecucaoController],
})
export class AppModule {}
