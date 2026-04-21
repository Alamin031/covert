import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ProductColor } from './product-color.entity';
import { ProductRegion } from './product-region.entity';
import { ProductNetwork } from './product-network.entity';
import { ProductPrice } from './product-price.entity';

@Entity('product_storages')
@Index('IDX_product_storage_color_unique', ['colorId', 'storageSize'], {
  unique: true,
  where: '"colorId" IS NOT NULL',
})
@Index('IDX_product_storage_region_unique', ['regionId', 'storageSize'], {
  unique: true,
  where: '"regionId" IS NOT NULL',
})
@Index('IDX_product_storage_network_unique', ['networkId', 'storageSize'], {
  unique: true,
  where: '"networkId" IS NOT NULL',
})
export class ProductStorage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  colorId?: string; // Null if this is a region default storage

  @Column({ type: 'uuid', nullable: true })
  regionId?: string; // For region-level default storages

  @Column({ type: 'uuid', nullable: true })
  networkId?: string; // For network-specific storage pricing (WiFi vs Cellular)

  @Column()
  storageSize: string;

  @Column({ default: false })
  isDefault: boolean; // true = this storage will be shown by default in UI

  @Column({ default: 0 })
  displayOrder: number;

  // Relations
  @ManyToOne(() => ProductColor, (color) => color.storages, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'colorId' })
  color?: ProductColor; // Null if this is a region default storage

  @ManyToOne(() => ProductRegion, (region) => region.defaultStorages, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'regionId' })
  region?: ProductRegion; // For region-level default storages

  @ManyToOne(() => ProductNetwork, (network) => network.storages, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'networkId' })
  network?: ProductNetwork; // Optional: for network-based storage variants

  @OneToOne(() => ProductPrice, (price) => price.storage, { cascade: true })
  price: ProductPrice;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  removeNulls() {
    if (!this.colorId) delete this.colorId;
    if (!this.regionId) delete this.regionId;
    if (!this.networkId) delete this.networkId;
  }
}
