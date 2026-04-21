import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { Emi } from './emi.entity';

@Entity('banks')
export class Bank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  bankname: string;

  @OneToMany(() => Emi, emi => emi.bank)
  emis?: Emi[];
}
