import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product-new.entity';
import { ProductColor } from './product-color.entity';
import { ProductStorage } from './product-storage.entity';

@Entity('product_networks')
@Index(['productId', 'networkType'], { unique: true })
export class ProductNetwork {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column()
  networkType: string; // 'WiFi', 'WiFi+ Cellular', etc.

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  // Optional: Base price adjustment for this network type
  @Column({ nullable: true })
  priceAdjustment?: number; // e.g., +5000 for cellular version

  // Relations
  @ManyToOne(() => Product, (product) => product.networks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @OneToMany(() => ProductColor, (color) => color.network, { cascade: true })
  colors: ProductColor[];

  @OneToMany(() => ProductStorage, (storage) => storage.network, { cascade: true })
  storages: ProductStorage[]; // For direct network-storage pricing (without color variants)

  @CreateDateColumn()
  createdAt: Date;
}
