import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('order_item_units')
export class OrderItemUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  orderItemId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ nullable: true })
  imei?: string;

  @Column({ nullable: true })
  serial?: string;

  @Column({ default: 'assigned' })
  status: 'assigned' | 'delivered' | 'returned';

  @CreateDateColumn()
  createdAt: Date;
}
