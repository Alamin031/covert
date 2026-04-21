import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProductRegion } from './product-region.entity';
import { ProductColor } from './product-color.entity';
import { ProductImage } from './product-image.entity';
import { ProductVideo } from './product-video.entity';
import { ProductSpecification } from './product-specification.entity';
import { ProductNetwork } from './product-network.entity';
import { Category } from '../../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  slug: string;

  @Column({ nullable: true })
  shortDescription?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Column('uuid', { array: true, nullable: true })
  categoryIds?: string[];

  @Column({ type: 'uuid', nullable: true })
  brandId?: string;

  @ManyToOne(() => Brand, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brandId' })
  brand?: Brand;

  @Column('uuid', { array: true, nullable: true })
  brandIds?: string[];

  @Column({ nullable: true, unique: true })
  productCode?: string;

  @Column({ nullable: true, unique: true })
  sku?: string;

  @Column({ nullable: true })
  warranty?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isOnline: boolean;

  @Column({ default: true })
  isPos: boolean;

  @Column({ default: false })
  isPreOrder: boolean;

  @Column({ default: false })
  isOfficial: boolean;

  @Column({ default: false })
  freeShipping: boolean;

  @Column({ default: false })
  isEmi: boolean;

  @Column({ default: false })
  isCare: boolean;

  @Column({ nullable: true })
  delivery?: string;

  @Column({ nullable: true })
  easyReturns?: string;

  @Column({ default: 0 })
  rewardPoints: number;

  @Column({ default: 0, nullable: true })
  ratingPoint?: number;

  @Column({ default: 0 })
  minBookingPrice: number;

  @Column({ default: 'basic' })
  productType: 'basic' | 'network' | 'region';

  // Direct price fields (for simple products without variants)
  @Column({ nullable: true })
  price?: number;

  @Column({ nullable: true })
  comparePrice?: number;

  @Column({ nullable: true })
  stockQuantity?: number;

  @Column({ nullable: true })
  lowStockAlert?: number;

  @Column({ nullable: true })
  seoTitle?: string;

  @Column({ nullable: true })
  seoDescription?: string;

  @Column('text', { array: true, nullable: true })
  seoKeywords?: string[];

  @Column({ nullable: true })
  seoCanonical?: string;

  @Column('text', { array: true, nullable: true })
  tags?: string[];

  @OneToMany(() => ProductRegion, (r) => r.product, {
    cascade: ['insert', 'update'],
  })
  regions: ProductRegion[]; // Optional: For region-based variants

  @OneToMany(() => ProductNetwork, (n) => n.product, {
    cascade: ['insert', 'update'],
  })
  networks: ProductNetwork[]; // Optional: For network-based variants (WiFi, WiFi+Cellular)

  @OneToMany(() => ProductColor, (c) => c.product, {
    cascade: ['insert', 'update'],
  })
  directColors: ProductColor[]; // Optional: For direct color variants

  @OneToMany(() => ProductImage, (i) => i.product, {
    cascade: ['insert', 'update'],
  })
  images: ProductImage[];

  @OneToMany(() => ProductVideo, (v) => v.product, {
    cascade: ['insert', 'update'],
  })
  videos: ProductVideo[];

  @OneToMany(() => ProductSpecification, (s) => s.product, {
    cascade: ['insert', 'update'],
  })
  specifications: ProductSpecification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column('uuid', { array: true, nullable: true })
  faqIds?: string[];
  
    // Field for client SEO-related HTML code
    @Column({ nullable: true, type: 'text' })
    schemaCode?: string;
}
