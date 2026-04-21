import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('delivery_methods')
export class DeliveryMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  minDays: number;

  @Column()
  maxDays: number;

  @Column({ default: 0 })
  extraFee: number;
}
