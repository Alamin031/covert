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
@Entity('product_regions')
@Index(['productId', 'regionName'], { unique: true })
export class ProductRegion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column()
  regionName: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  // Relations
  @ManyToOne(() => Product, (product) => product.regions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @OneToMany(() => ProductColor, (color) => color.region, { cascade: true })
  colors: ProductColor[];

  @OneToMany(() => ProductStorage, (storage) => storage.region, { cascade: true })
  defaultStorages: ProductStorage[]; // Shared storages for all colors in this region

  @CreateDateColumn()
  createdAt: Date;
}
