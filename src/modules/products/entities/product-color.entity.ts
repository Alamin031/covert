// product-color.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Product } from './product-new.entity';
import { ProductRegion } from './product-region.entity';
import { ProductNetwork } from './product-network.entity';
import { ProductStorage } from './product-storage.entity';

@Entity('product_colors')
@Index('IDX_product_color_product_unique', ['productId', 'colorName'], {
  unique: true,
  where: '"productId" IS NOT NULL',
})
@Index('IDX_product_color_region_unique', ['regionId', 'colorName'], {
  unique: true,
  where: '"regionId" IS NOT NULL',
})
@Index('IDX_product_color_network_unique', ['networkId', 'colorName'], {
  unique: true,
  where: '"networkId" IS NOT NULL',
})
export class ProductColor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  productId?: string; // For products without region variant (direct color)

  @Column({ type: 'uuid', nullable: true })
  regionId?: string; // For products with region variant

  @Column({ type: 'uuid', nullable: true })
  networkId?: string; // For products with network variant (WiFi, WiFi+Cellular)

  @Column()
  colorName: string;

  @Column({ nullable: true })
  colorImage?: string; // Image URL for this specific color variant

  @Column({ default: true })
  hasStorage: boolean; // false for color-only products (headphones)

  @Column({ default: true })
  useDefaultStorages: boolean; // true = use region's defaultStorages, false = use custom storages

  @Column({ nullable: true })
  singlePrice?: number; // Used when hasStorage = false (color-only)

  @Column({ nullable: true })
  singleComparePrice?: number;

  @Column({ nullable: true })
  singleDiscountPercent?: number;

  @Column({ nullable: true })
  singleDiscountPrice?: number;

  @Column({ nullable: true })
  singleStockQuantity?: number;

  @Column({ nullable: true })
  singleLowStockAlert?: number;

  @Column({ nullable: true })
  regularPrice?: number;

  @Column({ nullable: true })
  discountPrice?: number;

  @Column({ nullable: true })
  stockQuantity?: number;

  @Column({ type: 'simple-array', nullable: true })
  features?: string[]; // Color-specific features

  @Column({ default: false })
  isDefault: boolean; // true = this color's price will be shown by default in UI

  @Column({ default: 0 })
  displayOrder: number;

  // Relations
  @ManyToOne(() => Product, (product) => product.directColors, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product?: Product; // For direct product-to-color (no region)

  @ManyToOne(() => ProductRegion, (region) => region.colors, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'regionId' })
  region?: ProductRegion; // For region-based colors

  @ManyToOne(() => ProductNetwork, (network) => network.colors, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'networkId' })
  network?: ProductNetwork; // For network-based colors

  @OneToMany(() => ProductStorage, (storage) => storage.color, {
    cascade: true,
  })
  storages: ProductStorage[];

  @CreateDateColumn()
  createdAt: Date;

  // ========== IMPORTANT: Helper methods to prevent duplicate key errors ==========
  @BeforeInsert()
  @BeforeUpdate()
  validateVariantType() {
    // Keep only the relevant nullable foreign key for partial unique indexes.
    if (!this.productId) delete this.productId;
    if (!this.regionId) delete this.regionId;
    if (!this.networkId) delete this.networkId;

    // Ensure only one of productId, regionId, or networkId is set
    const idsSet = [this.productId, this.regionId, this.networkId].filter(
      (id) => id != null,
    ).length;

    if (idsSet > 1) {
      throw new Error(
        'ProductColor can only belong to one of: product, region, or network',
      );
    }

    // Ensure that colorName is unique for the given variant type
    if (!this.colorName) {
      throw new Error('Color name is required');
    }
  }

  // Helper method to check variant type
  getVariantType(): 'direct' | 'region' | 'network' | 'none' {
    if (this.productId) return 'direct';
    if (this.regionId) return 'region';
    if (this.networkId) return 'network';
    return 'none';
  }
}
