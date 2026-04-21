import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('corporate_deals')
export class CorporateDeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column()
  companyName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  message?: string;

  @Column({ default: 'new' })
  status: string; // e.g., new, contacted, closed

  @CreateDateColumn()
  createdAt: Date;
}
