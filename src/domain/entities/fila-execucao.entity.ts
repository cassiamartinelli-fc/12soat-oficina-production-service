import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('fila_execucao')
export class FilaExecucao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  osId: string;

  @Column({ default: 'EM_EXECUCAO' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  dataInicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  dataFim: Date;

  @Column({ nullable: true })
  duracaoDias: number;

  @CreateDateColumn()
  createdAt: Date;
}
