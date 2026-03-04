import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Min,
  IsDateString,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== Basic Product DTO ====================
export class CreateBasicProductDto {
  @ApiProperty({ description: 'Product name', example: 'iPhone 15 Pro Max' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Serial number', example: 'SN123456789' })
  @IsOptional()
  @IsString()
  // serial and imei removed

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'iphone-15-pro-max',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
    description: 'Short product description',
    example: 'Powerful A17 Pro chip with titanium design',
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Latest flagship phone',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category UUID',
    example: 'uuid-category',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Category UUIDs',
    example: ['uuid-category-1', 'uuid-category-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Brand UUID', example: 'uuid-brand' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({
    description: 'Brand UUIDs',
    example: ['uuid-brand-1', 'uuid-brand-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brandIds?: string[];

  @ApiPropertyOptional({ description: 'Product code', example: 'IPHONE15PM' })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({ description: 'SKU', example: 'IPH-15-PM-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({
    description: 'Warranty information',
    example: '1 Year Official Warranty',
  })
  @IsOptional()
  @IsString()
  warranty?: string;

  @ApiPropertyOptional({ description: 'Is product active?', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Visible online?', example: true })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ description: 'Visible in POS?', example: true })
  @IsOptional()
  @IsBoolean()
  isPos?: boolean;

  @ApiPropertyOptional({ description: 'Is pre-order?', example: false })
  @IsOptional()
  @IsBoolean()
  isPreOrder?: boolean;

  @ApiPropertyOptional({ description: 'Official product?', example: true })
  @IsOptional()
  @IsBoolean()
  isOfficial?: boolean;

  @ApiPropertyOptional({ description: 'Free shipping?', example: true })
  @IsOptional()
  @IsBoolean()
  freeShipping?: boolean;

  @ApiPropertyOptional({ description: 'EMI available?', example: false })
  @IsOptional()
  @IsBoolean()
  isEmi?: boolean;


  @ApiPropertyOptional({ description: 'Reward points', example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rewardPoints?: number;

  @ApiPropertyOptional({ description: 'Product rating point', example: 4.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ratingPoint?: number;

  @ApiPropertyOptional({
    description: 'Minimum booking price for pre-order',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBookingPrice?: number;

  @ApiPropertyOptional({
    description: 'SEO title',
    example: 'Buy iPhone 15 Pro Max - Best Price',
  })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional({ description: 'SEO description' })
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ApiPropertyOptional({
    description: 'SEO keywords',
    example: ['iphone', 'apple', 'flagship'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoKeywords?: string[];

  @ApiPropertyOptional({ description: 'Canonical URL' })
  @IsOptional()
  @IsString()
  seoCanonical?: string;

  @ApiPropertyOptional({
    description: 'Product tags',
    example: ['flagship', 'premium'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Direct price (for simple products)',
    example: 2990,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Direct compare price', example: 3990 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @ApiPropertyOptional({ description: 'Direct stock quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Is Care product?', example: false })
  @IsOptional()
  @IsBoolean()
  isCare?: boolean;

  @ApiPropertyOptional({
    description: 'Delivery info',
    example: 'Delivered in 3-5 days',
  })
  @IsOptional()
  @IsString()
  delivery?: string;

  @ApiPropertyOptional({
    description: 'Easy returns available?',
    example: '7 days',
  })
  @IsOptional()
  @IsString()
  easyReturns?: string;

  @ApiPropertyOptional({ description: 'Low stock alert', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  lowStockAlert?: number;

  @ApiPropertyOptional({ description: 'Campaign price', example: 2490 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  campaignPrice?: number;

  @ApiPropertyOptional({
    description: 'Campaign start date',
    example: '2025-12-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  campaignStart?: string;

  @ApiPropertyOptional({
    description: 'Campaign end date',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  campaignEnd?: string;

  @ApiPropertyOptional({ description: 'Product colors', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

    @ApiPropertyOptional({
      description: 'Client SEO related HTML code',
      example: '<script type="application/ld+json">{...}</script>',
    })
    @IsOptional()
    @IsString()
    schemaCode?: string;
}

// ==================== Network Product DTO ====================
// ==================== Product Network DTO ====================
// Adding NetworkStorageDto
export class NetworkStorageDto {
  @ApiProperty({ description: 'Storage size', example: '128GB' })
  @IsString()
  storageSize: string;

  @ApiPropertyOptional({
    description: 'Is this the default storage?',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Regular price', example: 100 })
  @IsOptional()
  @IsNumber()
  regularPrice?: number;

  @ApiPropertyOptional({ description: 'Compare price', example: 120 })
  @IsOptional()
  @IsNumber()
  comparePrice?: number;

  @ApiPropertyOptional({ description: 'Discount price', example: 90 })
  @IsOptional()
  @IsNumber()
  discountPrice?: number;

  @ApiPropertyOptional({ description: 'Stock quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Low stock alert', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  lowStockAlert?: number;
}

// Adding NetworkColorDto
export class NetworkColorDto {
  @ApiProperty({ description: 'Color name', example: 'Red' })
  @IsString()
  colorName: string;

  @ApiPropertyOptional({
    description: 'Color image URL',
    example: 'http://example.com/red.png',
  })
  @IsOptional()
  @IsString()
  colorImage?: string;

  @ApiPropertyOptional({ description: 'Regular price', example: 100 })
  @IsOptional()
  @IsNumber()
  regularPrice?: number;

  @ApiPropertyOptional({ description: 'Compare price', example: 120 })
  @IsOptional()
  @IsNumber()
  comparePrice?: number;

  @ApiPropertyOptional({ description: 'Discount price', example: 90 })
  @IsOptional()
  @IsNumber()
  discountPrice?: number;

  @ApiPropertyOptional({ description: 'Stock quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Low stock alert', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  lowStockAlert?: number;

  @ApiPropertyOptional({
    description: 'Is this the default color?',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Storages for the color',
    type: [NetworkStorageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NetworkStorageDto)
  storages?: NetworkStorageDto[];
}

export class CreateProductNetworkDto {
  @ApiProperty({ description: 'Network name', example: '5G' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Network code', example: '5G-001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Network price adjustment',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  priceAdjustment?: number;

  @ApiPropertyOptional({ description: 'Network name', example: '5G' })
  @IsOptional()
  @IsString()
  networkName?: string;

  @ApiPropertyOptional({ description: 'Has default storages', example: true })
  @IsOptional()
  @IsBoolean()
  hasDefaultStorages?: boolean;

  @ApiPropertyOptional({ description: 'Default storages', type: [Object] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NetworkStorageDto)
  defaultStorages?: NetworkStorageDto[];

  @ApiPropertyOptional({ description: 'Is default network', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Colors for the network',
    type: [NetworkColorDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NetworkColorDto)
  colors?: NetworkColorDto[];

  @ApiPropertyOptional({
    description: 'Storages for the network',
    type: [NetworkStorageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NetworkStorageDto)
  storages?: NetworkStorageDto[];
}

// ==================== Region Product DTO ====================
// ==================== Product Region DTO ====================
export class CreateProductRegionDto {
  @ApiProperty({ description: 'Region name', example: 'EU' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Region code', example: 'EU-001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Region price adjustment', example: 200 })
  @IsOptional()
  @IsNumber()
  priceAdjustment?: number;

  @ApiPropertyOptional({ description: 'Region name', example: 'EU' })
  @IsOptional()
  @IsString()
  regionName?: string;

  @ApiPropertyOptional({ description: 'Default storages', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultStorages?: string[];

  @ApiPropertyOptional({ description: 'Is default region', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Colors for the region', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];
}

export class CreateRegionProductDto extends CreateBasicProductDto {
  @ApiPropertyOptional({
    description: 'Product regions with variants (for region-based products)',
    type: [CreateProductRegionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductRegionDto)
  regions?: CreateProductRegionDto[];
}

// ==================== Update Product DTO ====================
import { PartialType } from '@nestjs/swagger';

export class UpdateProductNewDto extends PartialType(CreateBasicProductDto) {
  // serial and imei removed
  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Updated iPhone 15 Pro Max',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug',
    example: 'updated-iphone-15-pro-max',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Short product description',
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Updated flagship phone',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category UUID',
    example: 'updated-uuid-category',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Brand UUID',
    example: 'updated-uuid-brand',
  })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({
    description: 'Product code',
    example: 'UPDATED-IPHONE15PM',
  })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({ description: 'SKU', example: 'UPDATED-IPH-15-PM-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({
    description: 'Warranty information',
    example: 'Updated 1 Year Warranty',
  })
  @IsOptional()
  @IsString()
  warranty?: string;

  @ApiPropertyOptional({ description: 'Is product active?', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Visible online?', example: true })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ description: 'Visible in POS?', example: true })
  @IsOptional()
  @IsBoolean()
  isPos?: boolean;

  @ApiPropertyOptional({ description: 'Is pre-order?', example: false })
  @IsOptional()
  @IsBoolean()
  isPreOrder?: boolean;

  @ApiPropertyOptional({ description: 'Official product?', example: true })
  @IsOptional()
  @IsBoolean()
  isOfficial?: boolean;

  @ApiPropertyOptional({ description: 'Free shipping?', example: true })
  @IsOptional()
  @IsBoolean()
  freeShipping?: boolean;

  @ApiPropertyOptional({ description: 'EMI available?', example: false })
  @IsOptional()
  @IsBoolean()
  isEmi?: boolean;


  @ApiPropertyOptional({ description: 'Reward points', example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rewardPoints?: number;

  @ApiPropertyOptional({ description: 'Product rating point', example: 4.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ratingPoint?: number;

  @ApiPropertyOptional({
    description: 'Minimum booking price for pre-order',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBookingPrice?: number;

  @ApiPropertyOptional({
    description: 'SEO title',
    example: 'Buy iPhone 15 Pro Max - Best Price',
  })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional({ description: 'SEO description' })
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ApiPropertyOptional({
    description: 'SEO keywords',
    example: ['iphone', 'apple', 'flagship'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoKeywords?: string[];

  @ApiPropertyOptional({ description: 'Canonical URL' })
  @IsOptional()
  @IsString()
  seoCanonical?: string;

  @ApiPropertyOptional({
    description: 'Product tags',
    example: ['flagship', 'premium'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Direct price (for simple products)',
    example: 2990,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Direct compare price', example: 3990 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @ApiPropertyOptional({ description: 'Direct stock quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Is Care product?', example: false })
  @IsOptional()
  @IsBoolean()
  isCare?: boolean;

  @ApiPropertyOptional({
    description: 'Delivery info',
    example: 'Delivered in 3-5 days',
  })
  @IsOptional()
  @IsString()
  delivery?: string;

  @ApiPropertyOptional({
    description: 'Easy returns available?',
    example: '7 days',
  })
  @IsOptional()
  @IsString()
  easyReturns?: string;

  @ApiPropertyOptional({ description: 'Low stock alert', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  lowStockAlert?: number;

  @ApiPropertyOptional({ description: 'Campaign price', example: 2490 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  campaignPrice?: number;

  @ApiPropertyOptional({
    description: 'Campaign start date',
    example: '2025-12-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  campaignStart?: string;

  @ApiPropertyOptional({
    description: 'Campaign end date',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  campaignEnd?: string;

  @ApiPropertyOptional({ description: 'Product colors', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

    @ApiPropertyOptional({
      description: 'Client SEO related HTML code',
      example: '<script type="application/ld+json">{...}</script>',
    })
    @IsOptional()
    @IsString()
    schemaCode?: string;
}

// Adding CreateNetworkProductDto
export class CreateNetworkProductDto extends CreateBasicProductDto {
  @ApiPropertyOptional({
    description:
      'Product networks with variants (for network-based products like iPads)',
    type: [CreateProductNetworkDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductNetworkDto)
  networks?: CreateProductNetworkDto[];
}

// Adding CreateProductStorageDto
export class CreateProductStorageDto {
  @ApiProperty({ description: 'Storage size', example: '128GB' })
  @IsString()
  storageSize: string;

  @ApiPropertyOptional({
    description: 'Is this the default storage?',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Regular price', example: 100 })
  @IsOptional()
  @IsNumber()
  regularPrice?: number;

  @ApiPropertyOptional({ description: 'Compare price', example: 120 })
  @IsOptional()
  @IsNumber()
  comparePrice?: number;

  @ApiPropertyOptional({ description: 'Discount price', example: 90 })
  @IsOptional()
  @IsNumber()
  discountPrice?: number;

  @ApiPropertyOptional({ description: 'Discount percent', example: 10 })
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Stock quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Low stock alert', example: 5 })
  @IsOptional()
  @IsNumber()
  lowStockAlert?: number;
}

// Adding CreateProductColorDto
export class CreateProductColorDto {
  @ApiProperty({ description: 'Color name', example: 'Red' })
  @IsString()
  colorName: string;

  @ApiPropertyOptional({
    description: 'Color image URL',
    example: 'http://example.com/red.png',
  })
  @IsOptional()
  @IsString()
  colorImage?: string;

  @ApiPropertyOptional({ description: 'Regular price', example: 100 })
  @IsOptional()
  @IsNumber()
  regularPrice?: number;

  @ApiPropertyOptional({ description: 'Compare price', example: 120 })
  @IsOptional()
  @IsNumber()
  comparePrice?: number;

  @ApiPropertyOptional({ description: 'Discount price', example: 90 })
  @IsOptional()
  @IsNumber()
  discountPrice?: number;

  @ApiPropertyOptional({ description: 'Stock quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Low stock alert', example: 5 })
  @IsOptional()
  @IsNumber()
  lowStockAlert?: number;

  @ApiPropertyOptional({
    description: 'Is this the default color?',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Has storage', example: true })
  @IsOptional()
  @IsBoolean()
  hasStorage?: boolean;

  @ApiPropertyOptional({ description: 'Use default storages', example: false })
  @IsOptional()
  @IsBoolean()
  useDefaultStorages?: boolean;

  @ApiPropertyOptional({
    description: 'Storages for the color',
    type: [CreateProductStorageDto],
  })
  @IsOptional()
  @Type(() => CreateProductStorageDto)
  storages?: CreateProductStorageDto[];
}
