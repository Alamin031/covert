import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { Bank } from './bank.entity';

@Entity('emis')
export class Emi {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column({ type: 'uuid' })
  bankId: string; // Reference to Bank entity

  @ManyToOne(() => Bank, (bank) => bank.emis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bankId' })
  bank?: Bank;

  @Column()
  months: number;

  @Column()
  planName: string;

  @Column('float')
  interestRate: number;
}
