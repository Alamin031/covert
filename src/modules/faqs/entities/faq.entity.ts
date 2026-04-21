import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('faqs')
export class FAQ {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  question: string;

  @Column()
  answer: string;

  @Column('uuid', { array: true, nullable: true })
  productIds?: string[];

  @Column('uuid', { array: true, nullable: true })
  categoryIds?: string[];

  @Column({ nullable: true })
  orderIndex?: number;

  @CreateDateColumn()
  createdAt: Date;
}
