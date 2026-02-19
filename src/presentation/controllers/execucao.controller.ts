import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilaExecucao } from '../../domain/entities/fila-execucao.entity';
import { IniciarExecucaoDto } from '../../application/dto/iniciar-execucao.dto';
import { ExecucaoFinalizadaPublisher } from '../../events/publishers/execucao-finalizada.publisher';

@ApiTags('execucoes')
@Controller('execucoes')
export class ExecucaoController {
  constructor(
    @InjectRepository(FilaExecucao)
    private execucaoRepository: Repository<FilaExecucao>,
    private readonly execucaoFinalizadaPublisher: ExecucaoFinalizadaPublisher,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Iniciar execução de uma OS manualmente' })
  @ApiResponse({ status: 201, description: 'Execução iniciada' })
  async iniciar(@Body() dto: IniciarExecucaoDto) {
    const execucao = this.execucaoRepository.create({
      osId: dto.osId,
      status: 'EM_EXECUCAO',
      dataInicio: new Date(),
    });

    return this.execucaoRepository.save(execucao);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as execuções' })
  @ApiResponse({ status: 200, description: 'Lista de execuções' })
  async listar() {
    return this.execucaoRepository.find();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar execução por ID' })
  @ApiParam({ name: 'id', description: 'ID da execução' })
  @ApiResponse({ status: 200, description: 'Execução encontrada' })
  async buscarPorId(@Param('id') id: string) {
    return this.execucaoRepository.findOne({ where: { id } });
  }

  @Post(':id/finalizar')
  @ApiOperation({ summary: 'Finalizar execução e publicar evento' })
  @ApiParam({ name: 'id', description: 'ID da execução' })
  @ApiResponse({ status: 200, description: 'Execução finalizada' })
  async finalizar(@Param('id') id: string) {
    const execucao = await this.execucaoRepository.findOne({ where: { id } });

    if (!execucao) {
      throw new Error('Execução não encontrada');
    }

    execucao.status = 'FINALIZADA';
    execucao.dataFim = new Date();

    if (execucao.dataInicio) {
      const diff = execucao.dataFim.getTime() - execucao.dataInicio.getTime();
      execucao.duracaoDias = Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
    }

    const salva = await this.execucaoRepository.save(execucao);

    await this.execucaoFinalizadaPublisher.publish(
      salva.osId,
      salva.id,
      salva.dataInicio,
      salva.dataFim,
      salva.duracaoDias,
    );

    return salva;
  }
}
