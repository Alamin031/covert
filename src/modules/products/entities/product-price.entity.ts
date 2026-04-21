import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ProductStorage } from './product-storage.entity';

@Entity('product_prices')
export class ProductPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  storageId: string;

  @Column()
  regularPrice: number;

  @Column({ nullable: true })
  comparePrice?: number;

  @Column({ nullable: true })
  discountPrice?: number;

  @Column({ nullable: true })
  discountPercent?: number;

  @Column({ nullable: true })
  campaignPrice?: number;

  @Column({ nullable: true })
  campaignStart?: Date;

  @Column({ nullable: true })
  campaignEnd?: Date;

  @Column({ default: 0 })
  stockQuantity: number;

  @Column({ default: 5 })
  lowStockAlert: number;

  // Relations
  @OneToOne(() => ProductStorage, (storage) => storage.price, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storageId' })
  storage: ProductStorage;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
