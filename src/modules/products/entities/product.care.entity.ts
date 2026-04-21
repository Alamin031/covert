
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('product_cares')
export class ProductCare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { array: true, nullable: true })
  productIds?: string[];

  @Column('uuid', { array: true, nullable: true })
  categoryIds?: string[];

  @Column()
  planName: string;

  @Column()
  price: number; // e.g., 14400

  @Column({ nullable: true })
  duration?: string; // e.g., '2 years'

  @Column({ nullable: true })
  description?: string; // e.g., '2 years of extended warranty...'

  @Column('text', { array: true, nullable: true })
  features?: string[]; // e.g., ['Accidental damage', 'Battery replacement', 'Express repair']

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
