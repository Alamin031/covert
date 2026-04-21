import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'json', nullable: true })
  customer?: any;

  // Delivery fields
  @Column({ nullable: true })
  fullName?: string;
  @Column({ nullable: true })
  email?: string;
  @Column({ nullable: true })
  phone?: string;
  @Column({ nullable: true })
  division?: string;
  @Column({ nullable: true })
  district?: string;
  @Column({ nullable: true })
  upzila?: string;
  @Column({ nullable: true })
  postCode?: string;
  @Column({ nullable: true })
  address?: string;
  @Column({ nullable: true })
  paymentMethod?: string;
  @Column({ nullable: true })
  deliveryMethod?: string;


  // Order items will be loaded via service, not stored as JSON
  orderItems?: any[];

  // Reward points earned or used for this order
  @Column({ type: 'int', default: 0 })
  totalRewardPoints: number;

  @Column()
  total: number;

  @Column({ default: 'pending' })
  status: string;

  // Track all status changes for timeline
  @Column({ type: 'json', default: [] })
  statusHistory: { status: string; date: Date }[];

  @Column({ default: 'pending' })
  paymentStatus: string;

  @Column({ nullable: true, unique: true })
  orderNumber?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
