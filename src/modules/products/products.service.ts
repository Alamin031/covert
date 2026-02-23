// ...existing imports...
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ObjectId } from 'mongodb';
import {
  CreateBasicProductDto,
  CreateNetworkProductDto,
  CreateRegionProductDto,
} from './dto/create-product-new.dto';
import { Product } from './entities/product-new.entity';
import { ProductRegion } from './entities/product-region.entity';
import { ProductNetwork } from './entities/product-network.entity';
import { ProductColor } from './entities/product-color.entity';
import { ProductStorage } from './entities/product-storage.entity';
import { ProductPrice } from './entities/product-price.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVideo } from './entities/product-video.entity';
import { ProductSpecification } from './entities/product-specification.entity';
import { ProductCare } from './entities/product.care.entity';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { CloudflareService } from 'src/config/cloudflare-video.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCare)
    private readonly productCareRepository: Repository<ProductCare>,
    private readonly dataSource: DataSource,
    @Inject(CloudflareService)
    private readonly cloudflareService: CloudflareService,
  ) {}

  private generateRandomAlphaNum(length = 6) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async generateUniqueCode(field: 'productCode' | 'sku', length = 6) {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const candidate = this.generateRandomAlphaNum(length);
      const where: any = {};
      where[field] = candidate;
      const existing = await this.productRepository.findOne({ where } as any);
      if (!existing) return candidate;
    }
    throw new InternalServerErrorException(
      `Unable to generate unique ${field}`,
    );
  }

  /**
   * Create Basic Product
   */

  async findByIds(ids: string | string[] | any): Promise<any[]> {
    if (!ids) return [];

    // Normalize different possible input shapes into an array of ids
    let idArray: any[] = [];
    if (Array.isArray(ids)) {
      idArray = ids;
    } else if (typeof ids === 'string') {
      try {
        const parsed = JSON.parse(ids);
        if (Array.isArray(parsed)) idArray = parsed;
        else idArray = [ids];
      } catch {
        // fallback: comma-separated string
        idArray = ids
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    } else if (typeof ids === 'object' && ids !== null) {
      // handle array-like objects or objects with numeric keys
      if (typeof (ids as any).toArray === 'function') {
        idArray = (ids as any).toArray();
      } else {
        const vals = Object.values(ids).filter(
          (v) => typeof v === 'string' || typeof v === 'number',
        );
        if (vals.length > 0) idArray = vals;
      }
    }

    if (!Array.isArray(idArray) || idArray.length === 0) return [];

    const objectIds = idArray.map((id) =>
      typeof id === 'string' && id.length === 24 ? new ObjectId(id) : id,
    );

    // Use Mongo repository to ensure $in query works reliably
    const mongoRepo =
      this.productRepository.manager.getMongoRepository(Product);
    let products = await mongoRepo.find({
      where: { _id: { $in: objectIds } },
    } as any);

    products = await Promise.all(
      products.map(async (product) => {
        await this.loadProductRelations(product);
        return product;
      }),
    );
    return products;
  }

  //product find by brandids
  async findByBrandIds(brandIds: string[]): Promise<any[]> {
    if (!brandIds || brandIds.length === 0) return [];
    const objectBrandIds = brandIds.map((id) =>
      id.length === 24 ? new ObjectId(id) : id,
    );

    // Use native MongoDB query for reliability
    const mongoRepo =
      this.productRepository.manager.getMongoRepository(Product);
    const query = { brandIds: { $in: objectBrandIds } };
    let products = await mongoRepo.find({ where: query });

    products = await Promise.all(
      products.map(async (product) => {
        await this.loadProductRelations(product);
        return product;
      }),
    );
    return products;
  }

  async createBasicProduct(createProductDto: CreateBasicProductDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Product
      const product = new Product();
      Object.assign(product, createProductDto);

      if (typeof createProductDto.ratingPoint !== 'undefined') {
        product.ratingPoint = createProductDto.ratingPoint;
      }
      product.productType = 'basic';

      // Generate productCode and sku on backend if not provided by FE
      if (!product.productCode) {
        product.productCode = await this.generateUniqueCode('productCode', 6);
      }
      if (!product.sku) {
        product.sku = await this.generateUniqueCode('sku', 6);
      }

      // Handle multiple categories and brands
      if ((createProductDto as any).categoryIds) {
        product.categoryIds = (createProductDto as any).categoryIds.map(
          (id: string) => new ObjectId(id),
        );
      }
      if ((createProductDto as any).brandIds) {
        product.brandIds = (createProductDto as any).brandIds.map(
          (id: string) => new ObjectId(id),
        );
      }

      // Remove relations from product object to save them separately
      delete (product as any).colors;
      delete (product as any).images;
      delete (product as any).videos;
      delete (product as any).specifications;

      const savedProduct = await queryRunner.manager.save(Product, product);

      // 2. Save Images
      if ((createProductDto as any).images) {
        const images = (createProductDto as any).images.map((img: any) => {
          const image = new ProductImage();
          image.productId = savedProduct.id;
          image.imageUrl = img.url;
          image.isThumbnail = img.isThumbnail;
          image.altText = img.altText;
          image.displayOrder = img.displayOrder;
          return image;
        });
        await queryRunner.manager.save(ProductImage, images);
      }

      // 3. Save Videos
      if ((createProductDto as any).videos) {
        const videos = (createProductDto as any).videos.map((vid: any) => {
          const video = new ProductVideo();
          video.productId = savedProduct.id;
          video.videoUrl = vid.videoUrl;
          video.videoType = vid.videoType;
          video.displayOrder = vid.displayOrder;
          return video;
        });
        await queryRunner.manager.save(ProductVideo, videos);
      }

      // 4. Save Specifications
      if ((createProductDto as any).specifications) {
        const specs = (createProductDto as any).specifications.map((s: any) => {
          const spec = new ProductSpecification();
          spec.productId = savedProduct.id;
          spec.specKey = s.specKey;
          spec.specValue = s.specValue;
          spec.displayOrder = s.displayOrder;
          return spec;
        });
        await queryRunner.manager.save(ProductSpecification, specs);
      }

      // 5. Save Direct Colors (Basic Product Variants)
      if ((createProductDto as any).colors) {
        for (const c of (createProductDto as any).colors) {
          const color = new ProductColor();
          color.productId = savedProduct.id;
          color.colorName = c.colorName;
          color.colorImage = c.colorImage;
          color.hasStorage = c.hasStorage ?? false;
          color.singlePrice = c.singlePrice;
          color.singleComparePrice = c.singleComparePrice;
          color.singleStockQuantity = c.singleStockQuantity;
          // Map new fields
          color.regularPrice = c.regularPrice ?? c.singlePrice;
          color.discountPrice = c.discountPrice ?? c.singleDiscountPrice;
          color.stockQuantity = c.stockQuantity ?? c.singleStockQuantity;
          color.isDefault = c.isDefault ?? false;

          color.displayOrder = c.displayOrder ?? 0;

          const savedColor = await queryRunner.manager.save(
            ProductColor,
            color,
          );

          // Save Storages for this Color
          if (c.storages && c.storages.length > 0) {
            for (const s of c.storages) {
              const storage = new ProductStorage();
              storage.colorId = savedColor.id;
              storage.storageSize = s.storageSize;
              storage.isDefault = s.isDefault ?? false;
              storage.displayOrder = s.displayOrder ?? 0;

              const savedStorage = await queryRunner.manager.save(
                ProductStorage,
                storage,
              );

              // Save Price for this Storage
              const price = new ProductPrice();
              price.storageId = savedStorage.id;
              price.regularPrice = s.regularPrice ?? 0;
              price.comparePrice = s.comparePrice;
              price.discountPrice = s.discountPrice;
              price.discountPercent = s.discountPercent;
              price.stockQuantity = s.stockQuantity ?? 0;
              price.lowStockAlert = s.lowStockAlert ?? 0;

              await queryRunner.manager.save(ProductPrice, price);
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedProduct.slug);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err.code === 11000) {
        throw new BadRequestException(this.extractDuplicateField(err));
      }
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create Network Product
   */
  async createNetworkProduct(createProductDto: CreateNetworkProductDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Product
      const product = new Product();
      Object.assign(product, createProductDto);
      // serial and imei fields removed from Product entity
      // Ensure ratingPoint is set if provided
      if (typeof createProductDto.ratingPoint !== 'undefined') {
        product.ratingPoint = createProductDto.ratingPoint;
      }
      product.productType = 'network';

      // Generate productCode and sku on backend if not provided by FE
      if (!product.productCode) {
        product.productCode = await this.generateUniqueCode('productCode', 6);
      }
      if (!product.sku) {
        product.sku = await this.generateUniqueCode('sku', 6);
      }

      // Handle multiple categories and brands
      if ((createProductDto as any).categoryIds) {
        product.categoryIds = (createProductDto as any).categoryIds.map(
          (id: string) => new ObjectId(id),
        );
      }
      if ((createProductDto as any).brandIds) {
        product.brandIds = (createProductDto as any).brandIds.map(
          (id: string) => new ObjectId(id),
        );
      }

      delete (product as any).networks;
      delete (product as any).images;
      delete (product as any).videos;
      delete (product as any).specifications;

      const savedProduct = await queryRunner.manager.save(Product, product);

      // 2. Save Images, Videos, Specs (Same as Basic)
      if ((createProductDto as any).images) {
        const images = (createProductDto as any).images.map((img: any) => {
          const image = new ProductImage();
          image.productId = savedProduct.id;
          image.imageUrl = img.url;
          image.isThumbnail = img.isThumbnail;
          image.altText = img.altText;
          image.displayOrder = img.displayOrder;
          return image;
        });
        await queryRunner.manager.save(ProductImage, images);
      }

      if ((createProductDto as any).videos) {
        const videos = (createProductDto as any).videos.map((vid: any) => {
          const video = new ProductVideo();
          video.productId = savedProduct.id;
          video.videoUrl = vid.videoUrl;
          video.videoType = vid.videoType;
          video.displayOrder = vid.displayOrder;
          return video;
        });
        await queryRunner.manager.save(ProductVideo, videos);
      }

      if ((createProductDto as any).specifications) {
        const specs = (createProductDto as any).specifications.map((s: any) => {
          const spec = new ProductSpecification();
          spec.productId = savedProduct.id;
          spec.specKey = s.specKey;
          spec.specValue = s.specValue;
          spec.displayOrder = s.displayOrder;
          return spec;
        });
        await queryRunner.manager.save(ProductSpecification, specs);
      }

      // 3. Save Networks
      if (createProductDto.networks) {
        for (const n of createProductDto.networks) {
          const network = new ProductNetwork();
          network.productId = savedProduct.id;
          // Handle multiple field name variations from frontend
          network.networkType =
            n.networkName || n.name || (n as any).networkType || '';

          // Validate networkType is not empty
          if (!network.networkType || network.networkType.trim() === '') {
            throw new BadRequestException('Network type/name is required');
          }

          network.priceAdjustment = n.priceAdjustment;
          network.isDefault = n.isDefault ?? false;
          network.displayOrder = n.displayOrder ?? 0;

          const savedNetwork = await queryRunner.manager.save(
            ProductNetwork,
            network,
          );

          // Save Default Storages for Network
          if (n.defaultStorages) {
            for (const ds of n.defaultStorages) {
              const storage = new ProductStorage();
              storage.networkId = savedNetwork.id; // Linked to network directly
              storage.storageSize = ds.storageSize;
              storage.isDefault = ds.isDefault ?? false;
              storage.displayOrder = ds.displayOrder ?? 0;

              const savedStorage = await queryRunner.manager.save(
                ProductStorage,
                storage,
              );

              const price = new ProductPrice();
              price.storageId = savedStorage.id;
              price.regularPrice = ds.regularPrice ?? 0;
              price.comparePrice = ds.comparePrice;
              price.discountPrice = ds.discountPrice;
              price.discountPercent = (ds as any).discountPercent;
              price.stockQuantity = ds.stockQuantity ?? 0;
              price.lowStockAlert = ds.lowStockAlert ?? 0;

              await queryRunner.manager.save(ProductPrice, price);
            }
          }

          // Save Colors for Network
          if (n.colors) {
            for (const c of n.colors) {
              const color = new ProductColor();
              color.networkId = savedNetwork.id;
              color.colorName = c.colorName;
              color.colorImage = c.colorImage;
              color.hasStorage = (c as any).hasStorage ?? true;
              color.useDefaultStorages = (c as any).useDefaultStorages ?? true;
              color.singlePrice = c.regularPrice; // Map regularPrice to singlePrice if no storage
              color.singleComparePrice = c.comparePrice;
              color.singleStockQuantity = c.stockQuantity;
              // Map new fields
              color.regularPrice = c.regularPrice;
              color.discountPrice = c.discountPrice;
              color.stockQuantity = c.stockQuantity;
              color.isDefault = c.isDefault ?? false;

              color.displayOrder = c.displayOrder ?? 0;

              const savedColor = await queryRunner.manager.save(
                ProductColor,
                color,
              );

              // Save Custom Storages if not using defaults
              if (c.storages && !color.useDefaultStorages) {
                for (const s of c.storages) {
                  const storage = new ProductStorage();
                  storage.colorId = savedColor.id;
                  storage.storageSize = s.storageSize;
                  storage.isDefault = s.isDefault ?? false;
                  storage.displayOrder = s.displayOrder ?? 0;

                  const savedStorage = await queryRunner.manager.save(
                    ProductStorage,
                    storage,
                  );

                  const price = new ProductPrice();
                  price.storageId = savedStorage.id;
                  price.regularPrice = s.regularPrice ?? 0;
                  price.comparePrice = s.comparePrice;
                  price.discountPrice = s.discountPrice;
                  price.discountPercent = (s as any).discountPercent;
                  price.stockQuantity = s.stockQuantity ?? 0;
                  price.lowStockAlert = s.lowStockAlert ?? 0;

                  await queryRunner.manager.save(ProductPrice, price);
                }
              }
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedProduct.slug);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err.code === 11000) {
        throw new BadRequestException(this.extractDuplicateField(err));
      }
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create Region Product
   */
  async createRegionProduct(createProductDto: CreateRegionProductDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Product
      const product = new Product();
      Object.assign(product, createProductDto);
      // serial and imei fields removed from Product entity
      // Ensure ratingPoint is set if provided
      if (typeof createProductDto.ratingPoint !== 'undefined') {
        product.ratingPoint = createProductDto.ratingPoint;
      }
      product.productType = 'region';

      // Generate productCode and sku on backend if not provided by FE
      if (!product.productCode) {
        product.productCode = await this.generateUniqueCode('productCode', 6);
      }
      if (!product.sku) {
        product.sku = await this.generateUniqueCode('sku', 6);
      }

      // Handle multiple categories and brands
      if ((createProductDto as any).categoryIds) {
        product.categoryIds = (createProductDto as any).categoryIds.map(
          (id: string) => new ObjectId(id),
        );
      }
      if ((createProductDto as any).brandIds) {
        product.brandIds = (createProductDto as any).brandIds.map(
          (id: string) => new ObjectId(id),
        );
      }

      delete (product as any).regions;
      delete (product as any).images;
      delete (product as any).videos;
      delete (product as any).specifications;

      const savedProduct = await queryRunner.manager.save(Product, product);

      // 2. Save Images, Videos, Specs
      if ((createProductDto as any).images) {
        const images = (createProductDto as any).images.map((img: any) => {
          const image = new ProductImage();
          image.productId = savedProduct.id;
          image.imageUrl = img.url;
          image.isThumbnail = img.isThumbnail;
          image.altText = img.altText;
          image.displayOrder = img.displayOrder;
          return image;
        });
        await queryRunner.manager.save(ProductImage, images);
      }

      if ((createProductDto as any).videos) {
        const videos = (createProductDto as any).videos.map((vid: any) => {
          const video = new ProductVideo();
          video.productId = savedProduct.id;
          video.videoUrl = vid.videoUrl;
          video.videoType = vid.videoType;
          video.displayOrder = vid.displayOrder;
          return video;
        });
        await queryRunner.manager.save(ProductVideo, videos);
      }

      if ((createProductDto as any).specifications) {
        const specs = (createProductDto as any).specifications.map((s: any) => {
          const spec = new ProductSpecification();
          spec.productId = savedProduct.id;
          spec.specKey = s.specKey;
          spec.specValue = s.specValue;
          spec.displayOrder = s.displayOrder;
          return spec;
        });
        await queryRunner.manager.save(ProductSpecification, specs);
      }

      // 3. Save Regions
      if (createProductDto.regions) {
        for (const r of createProductDto.regions) {
          const region = new ProductRegion();
          region.productId = savedProduct.id;
          // Handle multiple field name variations from frontend
          region.regionName = r.regionName || r.name || (r as any).region || '';

          // Validate regionName is not empty
          if (!region.regionName || region.regionName.trim() === '') {
            throw new BadRequestException('Region name is required');
          }

          region.isDefault = r.isDefault ?? false;
          region.displayOrder = r.displayOrder ?? 0;

          const savedRegion = await queryRunner.manager.save(
            ProductRegion,
            region,
          );

          // Save Default Storages for Region
          // Note: DTO might have defaultStorages as strings or objects depending on FE.
          // Based on FE code: defaultStorages is array of objects with prices.
          if ((r as any).defaultStorages) {
            for (const ds of (r as any).defaultStorages) {
              const storage = new ProductStorage();
              storage.regionId = savedRegion.id;
              storage.storageSize = ds.storageSize;
              storage.isDefault = ds.isDefault ?? false;
              storage.displayOrder = ds.displayOrder ?? 0;

              const savedStorage = await queryRunner.manager.save(
                ProductStorage,
                storage,
              );

              const price = new ProductPrice();
              price.storageId = savedStorage.id;
              price.regularPrice = ds.regularPrice ?? 0;
              price.comparePrice = ds.comparePrice;
              price.discountPrice = ds.discountPrice;
              price.discountPercent = ds.discountPercent;
              price.stockQuantity = ds.stockQuantity ?? 0;
              price.lowStockAlert = ds.lowStockAlert ?? 0;

              await queryRunner.manager.save(ProductPrice, price);
            }
          }

          // Save Colors for Region
          if ((r as any).colors) {
            for (const c of (r as any).colors) {
              const color = new ProductColor();
              color.regionId = savedRegion.id;
              color.colorName = c.colorName;
              color.colorImage = c.colorImage;
              color.hasStorage = c.hasStorage ?? true;
              color.useDefaultStorages = c.useDefaultStorages ?? true;
              color.singlePrice = c.singlePrice;
              color.singleComparePrice = c.comparePrice;
              color.singleStockQuantity = c.singleStockQuantity;
              // Map new fields
              color.regularPrice = c.regularPrice ?? c.singlePrice;
              color.discountPrice = c.discountPrice ?? c.singleDiscountPrice;
              color.stockQuantity = c.stockQuantity ?? c.singleStockQuantity;
              color.isDefault = c.isDefault ?? false;

              color.displayOrder = c.displayOrder ?? 0;

              const savedColor = await queryRunner.manager.save(
                ProductColor,
                color,
              );

              // Save Custom Storages if not using defaults
              if (c.storages && !color.useDefaultStorages) {
                for (const s of c.storages) {
                  const storage = new ProductStorage();
                  storage.colorId = savedColor.id;
                  storage.storageSize = s.storageSize;
                  storage.isDefault = s.isDefault ?? false;
                  storage.displayOrder = s.displayOrder ?? 0;

                  const savedStorage = await queryRunner.manager.save(
                    ProductStorage,
                    storage,
                  );

                  const price = new ProductPrice();
                  price.storageId = savedStorage.id;
                  price.regularPrice = s.regularPrice ?? 0;
                  price.comparePrice = s.comparePrice;
                  price.discountPrice = s.discountPrice;
                  price.discountPercent = (s as any).discountPercent;
                  price.stockQuantity = s.stockQuantity ?? 0;
                  price.lowStockAlert = s.lowStockAlert ?? 0;

                  await queryRunner.manager.save(ProductPrice, price);
                }
              }
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedProduct.slug);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err.code === 11000) {
        throw new BadRequestException(this.extractDuplicateField(err));
      }
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update Basic Product
   */
  async updateBasicProduct(
    id: string,
    updateProductDto: CreateBasicProductDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const productObjectId = new ObjectId(id);

      // 1️⃣ Find product
      const product = await this.productRepository.findOne({
        where: { _id: productObjectId } as any,
      });

      if (!product) throw new NotFoundException('Product not found');
      if (product.productType !== 'basic')
        throw new BadRequestException('Product is not basic');

      // 2️⃣ Update main product fields
      Object.assign(product, updateProductDto);
      // serial and imei fields removed from Product entity
      product.productType = 'basic';

      if ((updateProductDto as any).categoryIds) {
        product.categoryIds = (updateProductDto as any).categoryIds.map(
          (c: string) => new ObjectId(c),
        );
      }

      if ((updateProductDto as any).brandIds) {
        product.brandIds = (updateProductDto as any).brandIds.map(
          (b: string) => new ObjectId(b),
        );
      }

      // Remove nested arrays; we will handle them separately
      delete (product as any).images;
      delete (product as any).videos;
      delete (product as any).specifications;
      delete (product as any).colors;

      await queryRunner.manager.save(Product, product);

      // 3️⃣ IMAGES - FIXED LOGIC
      const imagesInput = (updateProductDto as any).images || [];
      const keepImageIds: string[] = Array.isArray(
        (updateProductDto as any).keepImageIds,
      )
        ? (updateProductDto as any).keepImageIds
        : [];

      console.log('Images input:', imagesInput);
      console.log('Keep Image IDs:', keepImageIds);

      // Separate existing and new images
      const existingImagesWithIds = imagesInput.filter((img) => img.id);
      const newImagesWithoutIds = imagesInput.filter((img) => !img.id);

      // For existing images: fetch and update
      const existingImagesToUpdate: ProductImage[] = [];
      let newImagesToCreate: ProductImage[] = [];

      if (existingImagesWithIds.length > 0) {
        const existingIds = existingImagesWithIds.map(
          (img) => new ObjectId(img.id),
        );

        // Fetch existing images from database
        const existingDbImages = await queryRunner.manager
          .getMongoRepository(ProductImage)
          .find({
            where: {
              _id: { $in: existingIds },
              productId: productObjectId,
            } as any,
          });

        // Map input to database images
        for (const imgInput of existingImagesWithIds) {
          const existingImage = existingDbImages.find(
            (dbImg) => dbImg.id.toString() === imgInput.id,
          );

          if (existingImage) {
            // Update existing image
            existingImage.imageUrl = imgInput.url || existingImage.imageUrl;
            existingImage.isThumbnail =
              imgInput.isThumbnail ?? existingImage.isThumbnail;
            existingImage.altText = imgInput.altText ?? existingImage.altText;
            existingImage.displayOrder =
              imgInput.displayOrder ?? existingImage.displayOrder;
            existingImagesToUpdate.push(existingImage);
          } else {
            // Image ID exists in input but not in DB - treat as new
            const image = new ProductImage();
            image.productId = productObjectId;
            image.imageUrl = imgInput.url;
            image.isThumbnail = imgInput.isThumbnail ?? false;
            image.altText = imgInput.altText ?? '';
            image.displayOrder = imgInput.displayOrder ?? 0;
            newImagesToCreate.push(image);
          }
        }
      }

      // For new images: create fresh, but only upload to Cloudflare if not already a Cloudflare URL
      const additionalNewImages = await Promise.all(
        newImagesWithoutIds.map(async (imgInput, index) => {
          const image = new ProductImage();
          image.productId = productObjectId;
          // If imgInput.url is already a Cloudflare URL, use as is
          if (imgInput.url && imgInput.url.includes('imagedelivery.net')) {
            image.imageUrl = imgInput.url;
          } else if (imgInput.file) {
            // If file buffer provided, upload to Cloudflare
            try {
              const uploadResult = await this.cloudflareService.uploadImage(imgInput.file, imgInput.fileName || `product-img-${Date.now()}`);
              image.imageUrl = uploadResult.variants?.[0] || uploadResult.id || '';
            } catch (err) {
              console.error('Cloudflare upload failed:', err);
              image.imageUrl = imgInput.url || '';
            }
          } else {
            image.imageUrl = imgInput.url || '';
          }
          image.isThumbnail = imgInput.isThumbnail ?? false;
          image.altText = imgInput.altText ?? '';
          image.displayOrder =
            imgInput.displayOrder ?? existingImagesToUpdate.length + index;
          return image;
        })
      );
      newImagesToCreate = [...newImagesToCreate, ...additionalNewImages];

      // Combine all images to save
      const allImagesToSave = [...existingImagesToUpdate, ...newImagesToCreate];

      // Delete images that are not in the input (but respect keepImageIds if provided)
      let deletedImages: ProductImage[] = [];
      if (keepImageIds.length > 0) {
        // Find images to delete
        const keepObjectIds = keepImageIds.map((id) => new ObjectId(id));
        const imageIdsToKeep = [
          ...keepObjectIds,
          ...newImagesToCreate.map((img) => img.id).filter((id) => id),
        ];
        deletedImages = await queryRunner.manager.getMongoRepository(ProductImage).find({
          where: {
            productId: productObjectId,
            _id: { $nin: imageIdsToKeep },
          } as any,
        });
        await queryRunner.manager.getMongoRepository(ProductImage).deleteMany({
          productId: productObjectId,
          _id: { $nin: imageIdsToKeep },
        } as any);
      } else {
        // If no keepImageIds provided, delete all existing images and recreate
        deletedImages = await queryRunner.manager.getMongoRepository(ProductImage).find({
          where: { productId: productObjectId } as any,
        });
        await queryRunner.manager.getMongoRepository(ProductImage).deleteMany({
          productId: productObjectId,
        });
      }

      // Remove from Cloudflare
      for (const img of deletedImages) {
        if (img.imageUrl) {
          try {
            await this.cloudflareService.deleteImageFromCloudflare(img.imageUrl);
          } catch (err) {
            console.error('Cloudflare image delete failed:', err);
          }
        }
      }

      // Save all images
      if (allImagesToSave.length > 0) {
        await queryRunner.manager.save(ProductImage, allImagesToSave);
      }

      // 4️⃣ VIDEOS
      await queryRunner.manager
        .getMongoRepository(ProductVideo)
        .deleteMany({ productId: productObjectId });

      if ((updateProductDto as any).videos) {
        const videos = (updateProductDto as any).videos.map(
          (v: any, idx: number) => {
            const video = new ProductVideo();
            video.productId = productObjectId;
            video.videoUrl = v.videoUrl;
            video.videoType = v.videoType;
            video.displayOrder = v.displayOrder ?? idx;
            return video;
          },
        );
        if (videos.length > 0) {
          await queryRunner.manager.save(ProductVideo, videos);
        }
      }

      // 5️⃣ SPECIFICATIONS
      await queryRunner.manager
        .getMongoRepository(ProductSpecification)
        .deleteMany({ productId: productObjectId });

      if ((updateProductDto as any).specifications) {
        const specs = (updateProductDto as any).specifications.map(
          (s: any, index: number) => {
            const spec = new ProductSpecification();
            spec.productId = productObjectId;
            spec.specKey = s.specKey;
            spec.specValue = s.specValue;
            spec.displayOrder = s.displayOrder ?? index;
            return spec;
          },
        );
        if (specs.length > 0) {
          await queryRunner.manager.save(ProductSpecification, specs);
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(product.slug);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('Update basic product error:', err);
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update Network Product
   */
  async updateNetworkProduct(
    id: string,
    updateProductDto: CreateNetworkProductDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Find existing product
      const product = await this.productRepository.findOne({
        where: { _id: new ObjectId(id) } as any,
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.productType !== 'network') {
        throw new BadRequestException('Product is not a network product');
      }

      // 2. Update Product
      Object.assign(product, updateProductDto);
      // serial and imei fields removed from Product entity
      // Ensure ratingPoint is set if provided
      if (typeof updateProductDto.ratingPoint !== 'undefined') {
        product.ratingPoint = updateProductDto.ratingPoint;
      }
      product.productType = 'network';

      // Handle multiple categories and brands
      if ((updateProductDto as any).categoryIds) {
        product.categoryIds = (updateProductDto as any).categoryIds.map(
          (id: string) => new ObjectId(id),
        );
      }
      if ((updateProductDto as any).brandIds) {
        product.brandIds = (updateProductDto as any).brandIds.map(
          (id: string) => new ObjectId(id),
        );
      }

      delete (product as any).networks;
      delete (product as any).images;
      delete (product as any).videos;
      delete (product as any).specifications;

      const savedProduct = await queryRunner.manager.save(Product, product);

      // 3. Delete existing related data
      await queryRunner.manager.delete(ProductImage, {
        productId: new ObjectId(id),
      });
      await queryRunner.manager.delete(ProductVideo, {
        productId: new ObjectId(id),
      });
      // Use deleteMany for MongoDB to ensure all specs are deleted
      await queryRunner.manager
        .getMongoRepository(ProductSpecification)
        .deleteMany({
          productId: new ObjectId(id),
        });

      // Load existing networks and preserve color images
      const existingNetworks = await queryRunner.manager.find(ProductNetwork, {
        where: { productId: new ObjectId(id) } as any,
      });

      // Create a map to store existing color images by network type and color name
      const existingNetworkColorImages = new Map<string, Map<string, string>>();

      for (const network of existingNetworks) {
        const networkColors = await queryRunner.manager.find(ProductColor, {
          where: { networkId: new ObjectId(network.id) } as any,
        });

        const colorImageMap = new Map<string, string>();
        networkColors.forEach((color) => {
          if (color.colorImage) {
            colorImageMap.set(
              color.colorName.toLowerCase().trim(),
              color.colorImage,
            );
          }
        });

        if (colorImageMap.size > 0) {
          existingNetworkColorImages.set(
            network.networkType.toLowerCase().trim(),
            colorImageMap,
          );
        }
      }

      // Delete existing networks and their related data (MongoDB-specific)
      for (const network of existingNetworks) {
        const networkObjectId = new ObjectId(network.id);

        // Delete default storages for network
        const networkStorages = await queryRunner.manager.find(ProductStorage, {
          where: { networkId: networkObjectId } as any,
        });

        for (const storage of networkStorages) {
          const storageObjectId = new ObjectId(storage.id);
          await queryRunner.manager
            .getMongoRepository(ProductPrice)
            .deleteMany({
              storageId: storageObjectId,
            });
        }

        await queryRunner.manager
          .getMongoRepository(ProductStorage)
          .deleteMany({
            networkId: networkObjectId,
          });

        // Delete colors and their storages
        const networkColors = await queryRunner.manager.find(ProductColor, {
          where: { networkId: networkObjectId } as any,
        });

        for (const color of networkColors) {
          const colorObjectId = new ObjectId(color.id);

          const colorStorages = await queryRunner.manager.find(ProductStorage, {
            where: { colorId: colorObjectId } as any,
          });

          for (const storage of colorStorages) {
            const storageObjectId = new ObjectId(storage.id);
            await queryRunner.manager
              .getMongoRepository(ProductPrice)
              .deleteMany({
                storageId: storageObjectId,
              });
          }

          await queryRunner.manager
            .getMongoRepository(ProductStorage)
            .deleteMany({
              colorId: colorObjectId,
            });
        }

        await queryRunner.manager.getMongoRepository(ProductColor).deleteMany({
          networkId: networkObjectId,
        });
      }

      await queryRunner.manager.getMongoRepository(ProductNetwork).deleteMany({
        productId: new ObjectId(id),
      });

      // 4. Save new Images (upsert/delete logic)
      const imagesInput = (updateProductDto as any).images || [];
      const keepImageIds: string[] = Array.isArray(
        (updateProductDto as any).keepImageIds,
      )
        ? (updateProductDto as any).keepImageIds
        : [];

      // Separate existing and new images
      const existingImagesWithIds = imagesInput.filter((img: any) => img.id);
      const newImagesWithoutIds = imagesInput.filter((img: any) => !img.id);

      // For existing images: fetch and update
      const existingImagesToUpdate: ProductImage[] = [];
      let newImagesToCreate: ProductImage[] = [];
      if (existingImagesWithIds.length > 0) {
        const existingIds = existingImagesWithIds.map(
          (img: any) => new ObjectId(img.id),
        );
        const existingDbImages = await queryRunner.manager
          .getMongoRepository(ProductImage)
          .find({
            where: {
              _id: { $in: existingIds },
              productId: savedProduct.id,
            } as any,
          });
        for (const imgInput of existingImagesWithIds) {
          const existingImage = existingDbImages.find(
            (dbImg) => dbImg.id.toString() === imgInput.id,
          );
          if (existingImage) {
            existingImage.imageUrl = imgInput.url || existingImage.imageUrl;
            existingImage.isThumbnail =
              imgInput.isThumbnail ?? existingImage.isThumbnail;
            existingImage.altText = imgInput.altText ?? existingImage.altText;
            existingImage.displayOrder =
              imgInput.displayOrder ?? existingImage.displayOrder;
            existingImagesToUpdate.push(existingImage);
          } else {
            // If ID provided but not found, create new (fallback)
            const newImage = new ProductImage();
            newImage.productId = savedProduct.id;
            newImage.imageUrl = imgInput.url;
            newImage.isThumbnail = imgInput.isThumbnail ?? false;
            newImage.altText = imgInput.altText ?? '';
            newImage.displayOrder = imgInput.displayOrder ?? 0;
            newImagesToCreate.push(newImage);
          }
        }
      }

      // For new images: create fresh, but only upload to Cloudflare if not already a Cloudflare URL
      const additionalNewImages = await Promise.all(
        newImagesWithoutIds.map(async (imgInput: any, index: number) => {
          const image = new ProductImage();
          image.productId = savedProduct.id;
          // If imgInput.url is already a Cloudflare URL, use as is
          if (imgInput.url && imgInput.url.includes('imagedelivery.net')) {
            image.imageUrl = imgInput.url;
          } else if (imgInput.file) {
            // If file buffer provided, upload to Cloudflare
            try {
              const uploadResult = await this.cloudflareService.uploadImage(imgInput.file, imgInput.fileName || `product-img-${Date.now()}`);
              image.imageUrl = uploadResult.variants?.[0] || uploadResult.id || '';
            } catch (err) {
              console.error('Cloudflare upload failed:', err);
              image.imageUrl = imgInput.url || '';
            }
          } else {
            image.imageUrl = imgInput.url || '';
          }
          image.isThumbnail = imgInput.isThumbnail ?? false;
          image.altText = imgInput.altText ?? '';
          image.displayOrder =
            imgInput.displayOrder ?? existingImagesToUpdate.length + index;
          return image;
        })
      );
      newImagesToCreate = [...newImagesToCreate, ...additionalNewImages];

      // Combine all images to save
      const allImagesToSave = [...existingImagesToUpdate, ...newImagesToCreate];

      // Delete images that are not in the input (but respect keepImageIds if provided)
      let deletedImages: ProductImage[] = [];
      if (keepImageIds.length > 0) {
        const keepObjectIds = keepImageIds.map((id) => new ObjectId(id));
        const imageIdsToKeep = [
          ...keepObjectIds,
          ...newImagesToCreate.map((img) => img.id).filter((id) => id),
        ];
        deletedImages = await queryRunner.manager.getMongoRepository(ProductImage).find({
          where: {
            productId: savedProduct.id,
            _id: { $nin: imageIdsToKeep },
          } as any,
        });
        await queryRunner.manager.getMongoRepository(ProductImage).deleteMany({
          productId: savedProduct.id,
          _id: { $nin: imageIdsToKeep },
        } as any);
      } else {
        deletedImages = await queryRunner.manager.getMongoRepository(ProductImage).find({
          where: { productId: savedProduct.id } as any,
        });
        await queryRunner.manager.getMongoRepository(ProductImage).deleteMany({
          productId: savedProduct.id,
        });
      }

      // Remove from Cloudflare
      for (const img of deletedImages) {
        if (img.imageUrl) {
          try {
            await this.cloudflareService.deleteImageFromCloudflare(img.imageUrl);
          } catch (err) {
            console.error('Cloudflare image delete failed:', err);
          }
        }
      }

      if (allImagesToSave.length > 0) {
        await queryRunner.manager.save(ProductImage, allImagesToSave);
      }

      if ((updateProductDto as any).videos) {
        const videos = (updateProductDto as any).videos.map((vid: any) => {
          const video = new ProductVideo();
          video.productId = savedProduct.id;
          video.videoUrl = vid.videoUrl;
          video.videoType = vid.videoType;
          video.displayOrder = vid.displayOrder;
          return video;
        });
        await queryRunner.manager.save(ProductVideo, videos);
      }

      if ((updateProductDto as any).specifications) {
        // Deduplicate specifications by specKey (keep last occurrence)
        const specMap = new Map();
        (updateProductDto as any).specifications.forEach((s: any) => {
          if (s.specKey && s.specValue) {
            specMap.set(s.specKey, s);
          }
        });

        const specs = Array.from(specMap.values()).map(
          (s: any, index: number) => {
            const spec = new ProductSpecification();
            spec.productId = savedProduct.id;
            spec.specKey = s.specKey;
            spec.specValue = s.specValue;
            spec.displayOrder = s.displayOrder ?? index;
            return spec;
          },
        );

        if (specs.length > 0) {
          await queryRunner.manager.save(ProductSpecification, specs);
        }
      }

      // 5. Save new Networks
      if (updateProductDto.networks) {
        for (const n of updateProductDto.networks) {
          const network = new ProductNetwork();
          network.productId = savedProduct.id;
          // Handle multiple field name variations from frontend
          network.networkType =
            n.networkName || n.name || (n as any).networkType || '';

          // Validate networkType is not empty
          if (!network.networkType || network.networkType.trim() === '') {
            throw new BadRequestException('Network type/name is required');
          }

          network.priceAdjustment = n.priceAdjustment;
          network.isDefault = n.isDefault ?? false;
          network.displayOrder = n.displayOrder ?? 0;

          const savedNetwork = await queryRunner.manager.save(
            ProductNetwork,
            network,
          );

          // Save Default Storages for Network
          if (n.defaultStorages) {
            for (const ds of n.defaultStorages) {
              const storage = new ProductStorage();
              storage.networkId = savedNetwork.id;
              storage.storageSize = ds.storageSize;
              storage.isDefault = ds.isDefault ?? false;
              storage.displayOrder = ds.displayOrder ?? 0;

              const savedStorage = await queryRunner.manager.save(
                ProductStorage,
                storage,
              );

              const price = new ProductPrice();
              price.storageId = savedStorage.id;
              price.regularPrice = ds.regularPrice ?? 0;
              price.comparePrice = ds.comparePrice;
              price.discountPrice = ds.discountPrice;
              price.discountPercent = (ds as any).discountPercent;
              price.stockQuantity = ds.stockQuantity ?? 0;
              price.lowStockAlert = ds.lowStockAlert ?? 0;

              await queryRunner.manager.save(ProductPrice, price);
            }
          }

          // Save Colors for Network
          if (n.colors) {
            for (const c of n.colors) {
              const color = new ProductColor();
              color.networkId = savedNetwork.id;
              color.colorName = c.colorName;
              // Preserve existing color image if a new one is not provided
              if (c.colorImage) {
                color.colorImage = c.colorImage;
              } else {
                const networkKey = network.networkType
                  ? network.networkType.toLowerCase().trim()
                  : '';
                const colorKey = c.colorName
                  ? c.colorName.toLowerCase().trim()
                  : '';

                if (networkKey && colorKey) {
                  const existingColorsMap =
                    existingNetworkColorImages.get(networkKey);
                  const existingImage = existingColorsMap
                    ? existingColorsMap.get(colorKey)
                    : undefined;

                  if (existingImage) {
                    color.colorImage = existingImage;
                  }
                }
              }
              color.hasStorage = (c as any).hasStorage ?? true;
              color.useDefaultStorages = (c as any).useDefaultStorages ?? true;
              color.singlePrice = c.regularPrice;
              color.singleComparePrice = c.comparePrice;
              color.singleStockQuantity = c.stockQuantity;
              // Map new fields
              color.regularPrice = c.regularPrice;
              color.discountPrice = c.discountPrice;
              color.stockQuantity = c.stockQuantity;
              color.isDefault = c.isDefault ?? false;

              color.displayOrder = c.displayOrder ?? 0;

              const savedColor = await queryRunner.manager.save(
                ProductColor,
                color,
              );

              // Save Custom Storages if not using defaults
              if (c.storages && !color.useDefaultStorages) {
                for (const s of c.storages) {
                  const storage = new ProductStorage();
                  storage.colorId = savedColor.id;
                  storage.storageSize = s.storageSize;
                  storage.isDefault = s.isDefault ?? false;
                  storage.displayOrder = s.displayOrder ?? 0;

                  const savedStorage = await queryRunner.manager.save(
                    ProductStorage,
                    storage,
                  );

                  const price = new ProductPrice();
                  price.storageId = savedStorage.id;
                  price.regularPrice = s.regularPrice ?? 0;
                  price.comparePrice = s.comparePrice;
                  price.discountPrice = s.discountPrice;
                  price.discountPercent = (s as any).discountPercent;
                  price.stockQuantity = s.stockQuantity ?? 0;
                  price.lowStockAlert = s.lowStockAlert ?? 0;

                  await queryRunner.manager.save(ProductPrice, price);
                }
              }
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedProduct.slug);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err.code === 11000) {
        throw new BadRequestException(this.extractDuplicateField(err));
      }
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update Region Product
   */
  async updateRegionProduct(
    id: string,
    updateProductDto: CreateRegionProductDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Find existing product
      const product = await this.productRepository.findOne({
        where: { _id: new ObjectId(id) } as any,
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.productType !== 'region') {
        throw new BadRequestException('Product is not a region product');
      }

      // 2. Update Product
      Object.assign(product, updateProductDto);
      // serial and imei fields removed from Product entity
      // Ensure ratingPoint is set if provided
      if (typeof updateProductDto.ratingPoint !== 'undefined') {
        product.ratingPoint = updateProductDto.ratingPoint;
      }
      product.productType = 'region';

      // Handle multiple categories and brands
      if ((updateProductDto as any).categoryIds) {
        product.categoryIds = (updateProductDto as any).categoryIds.map(
          (id: string) => new ObjectId(id),
        );
      }
      if ((updateProductDto as any).brandIds) {
        product.brandIds = (updateProductDto as any).brandIds.map(
          (id: string) => new ObjectId(id),
        );
      }

      delete (product as any).regions;
      delete (product as any).images;
      delete (product as any).videos;
      delete (product as any).specifications;

      const savedProduct = await queryRunner.manager.save(Product, product);

      // 3. Delete existing related data
      await queryRunner.manager.delete(ProductImage, {
        productId: new ObjectId(id),
      });
      await queryRunner.manager.delete(ProductVideo, {
        productId: new ObjectId(id),
      });
      // Use deleteMany for MongoDB to ensure all specs are deleted
      await queryRunner.manager
        .getMongoRepository(ProductSpecification)
        .deleteMany({
          productId: new ObjectId(id),
        });

      // Load existing regions and preserve color images
      const existingRegions = await queryRunner.manager.find(ProductRegion, {
        where: { productId: new ObjectId(id) } as any,
      });

      // Create a map to store existing color images by region name and color name
      const existingRegionColorImages = new Map<string, Map<string, string>>();

      for (const region of existingRegions) {
        const regionColors = await queryRunner.manager.find(ProductColor, {
          where: { regionId: new ObjectId(region.id) } as any,
        });

        const colorImageMap = new Map<string, string>();
        regionColors.forEach((color) => {
          if (color.colorImage) {
            colorImageMap.set(
              color.colorName.toLowerCase().trim(),
              color.colorImage,
            );
          }
        });

        if (colorImageMap.size > 0) {
          existingRegionColorImages.set(
            region.regionName.toLowerCase().trim(),
            colorImageMap,
          );
        }
      }

      // Delete existing regions and their related data (MongoDB-specific)
      for (const region of existingRegions) {
        const regionObjectId = new ObjectId(region.id);

        // Delete default storages for region
        const regionStorages = await queryRunner.manager.find(ProductStorage, {
          where: { regionId: regionObjectId } as any,
        });

        for (const storage of regionStorages) {
          const storageObjectId = new ObjectId(storage.id);
          await queryRunner.manager
            .getMongoRepository(ProductPrice)
            .deleteMany({
              storageId: storageObjectId,
            });
        }

        await queryRunner.manager
          .getMongoRepository(ProductStorage)
          .deleteMany({
            regionId: regionObjectId,
          });

        // Delete colors and their storages
        const regionColors = await queryRunner.manager.find(ProductColor, {
          where: { regionId: regionObjectId } as any,
        });

        for (const color of regionColors) {
          const colorObjectId = new ObjectId(color.id);

          const colorStorages = await queryRunner.manager.find(ProductStorage, {
            where: { colorId: colorObjectId } as any,
          });

          for (const storage of colorStorages) {
            const storageObjectId = new ObjectId(storage.id);
            await queryRunner.manager
              .getMongoRepository(ProductPrice)
              .deleteMany({
                storageId: storageObjectId,
              });
          }

          await queryRunner.manager
            .getMongoRepository(ProductStorage)
            .deleteMany({
              colorId: colorObjectId,
            });
        }

        await queryRunner.manager.getMongoRepository(ProductColor).deleteMany({
          regionId: regionObjectId,
        });
      }

      await queryRunner.manager.getMongoRepository(ProductRegion).deleteMany({
        productId: new ObjectId(id),
      });

      // 4. Save new Images, Videos, Specs
      const imagesInput = (updateProductDto as any).images || [];
      const keepImageIds: string[] = Array.isArray(
        (updateProductDto as any).keepImageIds,
      )
        ? (updateProductDto as any).keepImageIds
        : [];

      // Separate existing and new images
      const existingImagesWithIds = imagesInput.filter((img: any) => img.id);
      const newImagesWithoutIds = imagesInput.filter((img: any) => !img.id);

      // For existing images: fetch and update
      const existingImagesToUpdate: ProductImage[] = [];
      let newImagesToCreate: ProductImage[] = [];
      if (existingImagesWithIds.length > 0) {
        const existingIds = existingImagesWithIds.map(
          (img: any) => new ObjectId(img.id),
        );
        const existingDbImages = await queryRunner.manager
          .getMongoRepository(ProductImage)
          .find({
            where: {
              _id: { $in: existingIds },
              productId: savedProduct.id,
            } as any,
          });
        for (const imgInput of existingImagesWithIds) {
          const existingImage = existingDbImages.find(
            (dbImg) => dbImg.id.toString() === imgInput.id,
          );
          if (existingImage) {
            // Update existing image
            existingImage.imageUrl = imgInput.url;
            existingImage.isThumbnail = imgInput.isThumbnail ?? false;
            existingImage.altText = imgInput.altText ?? '';
            existingImage.displayOrder = imgInput.displayOrder ?? 0;
            existingImagesToUpdate.push(existingImage);
          } else {
            // If ID provided but not found, create new (fallback)
            const newImage = new ProductImage();
            newImage.productId = savedProduct.id;
            newImage.imageUrl = imgInput.url;
            newImage.isThumbnail = imgInput.isThumbnail ?? false;
            newImage.altText = imgInput.altText ?? '';
            newImage.displayOrder = imgInput.displayOrder ?? 0;
            newImagesToCreate.push(newImage);
          }
        }
      }

      // For new images: create fresh, but only upload to Cloudflare if not already a Cloudflare URL
      const additionalNewImages = await Promise.all(
        newImagesWithoutIds.map(async (imgInput: any, index: number) => {
          const image = new ProductImage();
          image.productId = savedProduct.id;
          // If imgInput.url is already a Cloudflare URL, use as is
          if (imgInput.url && imgInput.url.includes('imagedelivery.net')) {
            image.imageUrl = imgInput.url;
          } else if (imgInput.file) {
            // If file buffer provided, upload to Cloudflare
            try {
              const uploadResult = await this.cloudflareService.uploadImage(imgInput.file, imgInput.fileName || `product-img-${Date.now()}`);
              image.imageUrl = uploadResult.variants?.[0] || uploadResult.id || '';
            } catch (err) {
              console.error('Cloudflare upload failed:', err);
              image.imageUrl = imgInput.url || '';
            }
          } else {
            image.imageUrl = imgInput.url || '';
          }
          image.isThumbnail = imgInput.isThumbnail ?? false;
          image.altText = imgInput.altText ?? '';
          image.displayOrder =
            imgInput.displayOrder ?? existingImagesToUpdate.length + index;
          return image;
        })
      );
      newImagesToCreate = [...newImagesToCreate, ...additionalNewImages];

      // Combine all images to save
      const allImagesToSave = [...existingImagesToUpdate, ...newImagesToCreate];

      // Delete images that are not in the input (but respect keepImageIds if provided)
      let deletedImages: ProductImage[] = [];
      if (keepImageIds.length > 0) {
        const keepObjectIds = keepImageIds.map((id) => new ObjectId(id));
        const imageIdsToKeep = [
          ...keepObjectIds,
          ...newImagesToCreate.map((img) => img.id).filter((id) => id),
        ];
        deletedImages = await queryRunner.manager.getMongoRepository(ProductImage).find({
          where: {
            productId: savedProduct.id,
            _id: { $nin: imageIdsToKeep },
          } as any,
        });
        await queryRunner.manager.getMongoRepository(ProductImage).deleteMany({
          productId: savedProduct.id,
          _id: { $nin: imageIdsToKeep },
        } as any);
      } else {
        deletedImages = await queryRunner.manager.getMongoRepository(ProductImage).find({
          where: { productId: savedProduct.id } as any,
        });
        await queryRunner.manager.getMongoRepository(ProductImage).deleteMany({
          productId: savedProduct.id,
        });
      }

      // Remove from Cloudflare
      for (const img of deletedImages) {
        if (img.imageUrl) {
          try {
            await this.cloudflareService.deleteImageFromCloudflare(img.imageUrl);
          } catch (err) {
            console.error('Cloudflare image delete failed:', err);
          }
        }
      }

      // Save all images
      if (allImagesToSave.length > 0) {
        await queryRunner.manager.save(ProductImage, allImagesToSave);
      }

      if ((updateProductDto as any).videos) {
        const videos = (updateProductDto as any).videos.map((vid: any) => {
          const video = new ProductVideo();
          video.productId = savedProduct.id;
          video.videoUrl = vid.videoUrl;
          video.videoType = vid.videoType;
          video.displayOrder = vid.displayOrder;
          return video;
        });
        await queryRunner.manager.save(ProductVideo, videos);
      }

      if ((updateProductDto as any).specifications) {
        // Deduplicate specifications by specKey (keep last occurrence)
        const specMap = new Map();
        (updateProductDto as any).specifications.forEach((s: any) => {
          if (s.specKey && s.specValue) {
            specMap.set(s.specKey, s);
          }
        });

        const specs = Array.from(specMap.values()).map(
          (s: any, index: number) => {
            const spec = new ProductSpecification();
            spec.productId = savedProduct.id;
            spec.specKey = s.specKey;
            spec.specValue = s.specValue;
            spec.displayOrder = s.displayOrder ?? index;
            return spec;
          },
        );

        if (specs.length > 0) {
          await queryRunner.manager.save(ProductSpecification, specs);
        }
      }

      // 5. Save new Regions
      if (updateProductDto.regions) {
        for (const r of updateProductDto.regions) {
          const region = new ProductRegion();
          region.productId = savedProduct.id;
          // Handle multiple field name variations from frontend
          region.regionName = r.regionName || r.name || (r as any).region || '';

          // Validate regionName is not empty
          if (!region.regionName || region.regionName.trim() === '') {
            throw new BadRequestException('Region name is required');
          }

          region.isDefault = r.isDefault ?? false;
          region.displayOrder = r.displayOrder ?? 0;

          const savedRegion = await queryRunner.manager.save(
            ProductRegion,
            region,
          );

          // Save Default Storages for Region
          if ((r as any).defaultStorages) {
            for (const ds of (r as any).defaultStorages) {
              const storage = new ProductStorage();
              storage.regionId = savedRegion.id;
              storage.storageSize = ds.storageSize;
              storage.isDefault = ds.isDefault ?? false;
              storage.displayOrder = ds.displayOrder ?? 0;

              const savedStorage = await queryRunner.manager.save(
                ProductStorage,
                storage,
              );

              const price = new ProductPrice();
              price.storageId = savedStorage.id;
              price.regularPrice = ds.regularPrice ?? 0;
              price.comparePrice = ds.comparePrice;
              price.discountPrice = ds.discountPrice;
              price.discountPercent = ds.discountPercent;
              price.stockQuantity = ds.stockQuantity ?? 0;
              price.lowStockAlert = ds.lowStockAlert ?? 0;

              await queryRunner.manager.save(ProductPrice, price);
            }
          }

          // Save Colors for Region
          if ((r as any).colors) {
            for (const c of (r as any).colors) {
              const color = new ProductColor();
              color.regionId = savedRegion.id;
              color.colorName = c.colorName;
              // Preserve existing color image if a new one is not provided
              if (c.colorImage) {
                color.colorImage = c.colorImage;
              } else {
                const regionKey = region.regionName
                  ? region.regionName.toLowerCase().trim()
                  : '';
                const colorKey = c.colorName
                  ? c.colorName.toLowerCase().trim()
                  : '';

                if (regionKey && colorKey) {
                  const existingColorsMap =
                    existingRegionColorImages.get(regionKey);
                  const existingImage = existingColorsMap
                    ? existingColorsMap.get(colorKey)
                    : undefined;

                  if (existingImage) {
                    color.colorImage = existingImage;
                  }
                }
              }
              color.hasStorage = c.hasStorage ?? true;
              color.useDefaultStorages = c.useDefaultStorages ?? true;
              color.singlePrice = c.singlePrice;
              color.singleComparePrice = c.comparePrice;
              color.singleStockQuantity = c.singleStockQuantity;
              // Map new fields
              color.regularPrice = c.regularPrice ?? c.singlePrice;
              color.discountPrice = c.discountPrice ?? c.singleDiscountPrice;
              color.stockQuantity = c.stockQuantity ?? c.singleStockQuantity;
              color.isDefault = c.isDefault ?? false;

              color.displayOrder = c.displayOrder ?? 0;

              const savedColor = await queryRunner.manager.save(
                ProductColor,
                color,
              );

              // Save Custom Storages if not using defaults
              if (c.storages && !color.useDefaultStorages) {
                for (const s of c.storages) {
                  const storage = new ProductStorage();
                  storage.colorId = savedColor.id;
                  storage.storageSize = s.storageSize;
                  storage.isDefault = s.isDefault ?? false;
                  storage.displayOrder = s.displayOrder ?? 0;

                  const savedStorage = await queryRunner.manager.save(
                    ProductStorage,
                    storage,
                  );

                  const price = new ProductPrice();
                  price.storageId = savedStorage.id;
                  price.regularPrice = s.regularPrice ?? 0;
                  price.comparePrice = s.comparePrice;
                  price.discountPrice = s.discountPrice;
                  price.discountPercent = s.discountPercent;
                  price.stockQuantity = s.stockQuantity ?? 0;
                  price.lowStockAlert = s.lowStockAlert ?? 0;

                  await queryRunner.manager.save(ProductPrice, price);
                }
              }
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedProduct.slug);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err.code === 11000) {
        throw new BadRequestException(this.extractDuplicateField(err));
      }
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters?: {
    categoryIds?: string;
    brandId?: string;
    isActive?: boolean;
    isOnline?: boolean;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    limit?: number;
    offset?: number;
    productType?: string;
    fields?: string;
  }) {
    const whereConditions: any = {};

    if (filters?.categoryIds) {
      whereConditions.categoryIds = new ObjectId(filters.categoryIds);
    }
    if (filters?.brandId) {
      whereConditions.brandId = new ObjectId(filters.brandId);
    }
    if (filters?.isActive !== undefined) {
      whereConditions.isActive = filters.isActive;
    }
    if (filters?.isOnline !== undefined) {
      whereConditions.isOnline = filters.isOnline;
    }
    if (filters?.productType) {
      whereConditions.productType = filters.productType;
    }

    // FAST PATH: Lightweight response for list views (admin products page)
    if (filters?.fields) {
      const fieldsArray = filters.fields.split(',').map((f) => f.trim());

      const products = await this.productRepository.find({
        where: whereConditions,
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
        order: { createdAt: 'DESC' },
      });

      const total = await this.productRepository.count({
        where: whereConditions,
      });

      // Manually load images for MongoDB
      const needsImages = fieldsArray.includes('images');
      if (needsImages && products.length > 0) {
        const productIds = products.map((p) => new ObjectId(p.id));
        const allImages = await this.dataSource
          .getMongoRepository(ProductImage)
          .find({
            where: { productId: { $in: productIds } } as any,
            order: { displayOrder: 'ASC' },
          });

        // Group images by productId
        const imagesByProduct = new Map<string, ProductImage[]>();
        allImages.forEach((img) => {
          const key = img.productId.toString();
          if (!imagesByProduct.has(key)) {
            imagesByProduct.set(key, []);
          }
          imagesByProduct.get(key)!.push(img);
        });

        // Assign images to products
        products.forEach((product) => {
          product.images = imagesByProduct.get(product.id.toString()) || [];
        });
      }

      const data = products.map((product) => {
        const result: any = {};

        fieldsArray.forEach((field) => {
          if (field === 'images') {
            result.images =
              product.images?.map((img) => ({
                id: img.id,
                url: img.imageUrl,
                isThumbnail: img.isThumbnail,
                altText: img.altText,
              })) || [];
          } else if (product.hasOwnProperty(field)) {
            result[field] = (product as any)[field];
          }
        });

        return result;
      });

      return {
        data,
        total,
        page: Math.floor((filters?.offset || 0) / (filters?.limit || 20)) + 1,
        limit: filters?.limit || 20,
      };
    }

    // SLOW PATH: Full details with all nested relations (for detail pages)
    const products = await this.productRepository.find({
      where: whereConditions,
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
      order: { createdAt: 'DESC' },
    });

    if (products.length === 0) {
      return {
        data: [],
        total: 0,
        page: 1,
        limit: filters?.limit || 50,
      };
    }

    // Manually load all nested relations for each product (ONLY for full detail requests)
    const productsWithFullRelations = await Promise.all(
      products.map(async (product) => {
        await this.loadProductRelations(product);
        return product;
      }),
    );

    const formatted = productsWithFullRelations.map((product) =>
      this.formatProductResponse(product),
    );

    const total = await this.productRepository.count({
      where: whereConditions,
    });

    return {
      data: formatted,
      total,
      page: Math.floor((filters?.offset || 0) / (filters?.limit || 50)) + 1,
      limit: filters?.limit || 50,
    };
  }
  /**
   * Get product details by ID with optional region/network context
   */
  async findProductDetails(
    productId: string,
    regionId?: string,
    networkId?: string,
  ) {
    const product = await this.productRepository.findOne({
      where: { _id: new ObjectId(productId) } as any,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.loadProductRelations(product);

    return this.formatProductResponse(product);
  }

  /**
   * Get single product by slug with all details
   */
  async findOne(slug: string) {
    const product = await this.productRepository.findOne({
      where: { slug },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.loadProductRelations(product);
    return product;
  }

  /**
   * Get specific variant price
   */
  async getVariantPrice(
    productId: string,
    regionId?: string,
    colorId?: string,
    storageId?: string,
  ) {
    // For MongoDB, we need to manually query and filter
    // This is a simplified version - you may need to implement more complex logic
    const product = await this.productRepository.findOne({
      where: { _id: new ObjectId(productId) } as any,
    });

    if (!product || !product.regions || product.regions.length === 0) {
      throw new NotFoundException('Product variant not found');
    }

    // Extract the specific price
    const region = product.regions[0];
    const color = region?.colors?.[0];
    const storage = color?.storages?.[0];
    const price = storage?.price;

    if (!price) {
      throw new NotFoundException('Price not found for this variant');
    }

    return {
      region: { id: region.id, name: region.regionName },
      color: { id: color.id, name: color.colorName, image: color.colorImage },
      storage: { id: storage.id, size: storage.storageSize },
      price: {
        regular: price.regularPrice,
        compare: price.comparePrice,
        discount: price.discountPrice,
        discountPercent: price.discountPercent,
        campaign: price.campaignPrice,
        campaignActive: this.isCampaignActive(
          price.campaignStart,
          price.campaignEnd,
        ),
        final: this.calculateFinalPrice(price),
      },
      stock: {
        quantity: price.stockQuantity,
        lowStockAlert: price.lowStockAlert,
        inStock: price.stockQuantity > 0,
        isLowStock: price.stockQuantity <= price.lowStockAlert,
      },
    };
  }

  /**
   * Soft delete product
   */
  async remove(id: string) {
    const product = await this.productRepository.findOne({
      where: { _id: new ObjectId(id) } as any,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete all related data
    // Colors (direct)
    await this.dataSource
      .getMongoRepository(ProductColor)
      .deleteMany({ productId: new ObjectId(id) });

    // Images: delete from Cloudflare first
    const images = await this.dataSource
      .getMongoRepository(ProductImage)
      .find({ where: { productId: new ObjectId(id) } });
    for (const img of images) {
      if (img.imageUrl) {
        try {
          await this.cloudflareService.deleteImageFromCloudflare(img.imageUrl);
        } catch (err) {
          console.error('Cloudflare image delete failed:', err);
        }
      }
    }
    await this.dataSource
      .getMongoRepository(ProductImage)
      .deleteMany({ productId: new ObjectId(id) });

    // Videos
    await this.dataSource
      .getMongoRepository(ProductVideo)
      .deleteMany({ productId: new ObjectId(id) });
    // Specifications
    await this.dataSource
      .getMongoRepository(ProductSpecification)
      .deleteMany({ productId: new ObjectId(id) });
    // Networks
    const networks = await this.dataSource
      .getMongoRepository(ProductNetwork)
      .find({ where: { productId: new ObjectId(id) } });
    for (const network of networks) {
      // Colors for network
      const networkColors = await this.dataSource
        .getMongoRepository(ProductColor)
        .find({ where: { networkId: network.id } });
      for (const color of networkColors) {
        // Storages for color
        const storages = await this.dataSource
          .getMongoRepository(ProductStorage)
          .find({ where: { colorId: color.id } });
        for (const storage of storages) {
          await this.dataSource
            .getMongoRepository(ProductPrice)
            .deleteMany({ storageId: storage.id });
        }
        await this.dataSource
          .getMongoRepository(ProductStorage)
          .deleteMany({ colorId: color.id });
      }
      await this.dataSource
        .getMongoRepository(ProductColor)
        .deleteMany({ networkId: network.id });
      // Default storages for network
      const defaultStorages = await this.dataSource
        .getMongoRepository(ProductStorage)
        .find({ where: { networkId: network.id } });
      for (const storage of defaultStorages) {
        await this.dataSource
          .getMongoRepository(ProductPrice)
          .deleteMany({ storageId: storage.id });
      }
      await this.dataSource
        .getMongoRepository(ProductStorage)
        .deleteMany({ networkId: network.id });
    }
    await this.dataSource
      .getMongoRepository(ProductNetwork)
      .deleteMany({ productId: new ObjectId(id) });
    // Regions
    const regions = await this.dataSource
      .getMongoRepository(ProductRegion)
      .find({ where: { productId: new ObjectId(id) } });
    for (const region of regions) {
      // Colors for region
      const regionColors = await this.dataSource
        .getMongoRepository(ProductColor)
        .find({ where: { regionId: region.id } });
      for (const color of regionColors) {
        // Storages for color
        const storages = await this.dataSource
          .getMongoRepository(ProductStorage)
          .find({ where: { colorId: color.id } });
        for (const storage of storages) {
          await this.dataSource
            .getMongoRepository(ProductPrice)
            .deleteMany({ storageId: storage.id });
        }
        await this.dataSource
          .getMongoRepository(ProductStorage)
          .deleteMany({ colorId: color.id });
      }
      await this.dataSource
        .getMongoRepository(ProductColor)
        .deleteMany({ regionId: region.id });
      // Default storages for region
      const defaultStorages = await this.dataSource
        .getMongoRepository(ProductStorage)
        .find({ where: { regionId: region.id } });
      for (const storage of defaultStorages) {
        await this.dataSource
          .getMongoRepository(ProductPrice)
          .deleteMany({ storageId: storage.id });
      }
      await this.dataSource
        .getMongoRepository(ProductStorage)
        .deleteMany({ regionId: region.id });
    }
    await this.dataSource
      .getMongoRepository(ProductRegion)
      .deleteMany({ productId: new ObjectId(id) });
    // Direct storages for direct colors
    const directColors = await this.dataSource
      .getMongoRepository(ProductColor)
      .find({ where: { productId: new ObjectId(id) } });
    for (const color of directColors) {
      const storages = await this.dataSource
        .getMongoRepository(ProductStorage)
        .find({ where: { colorId: color.id } });
      for (const storage of storages) {
        await this.dataSource
          .getMongoRepository(ProductPrice)
          .deleteMany({ storageId: storage.id });
      }
      await this.dataSource
        .getMongoRepository(ProductStorage)
        .deleteMany({ colorId: color.id });
    }
    // Finally, delete the product itself
    await this.productRepository.delete(id);

    return {
      success: true,
      message: 'Product and all related data deleted successfully',
    };
  }

  /**
   * Search products
   */
  async search(query: string) {
    return this.findAll({ search: query, limit: 20 });
  }

  // ============ Helper Methods ============

  private async loadProductRelations(product: Product) {
    const productId = product.id;

    // 1. Load Top-level Relations manually
    if (!product.networks || product.networks.length === 0) {
      product.networks = await this.dataSource
        .getMongoRepository(ProductNetwork)
        .find({
          where: { productId: new ObjectId(productId) } as any,
          order: { displayOrder: 'ASC' },
        });
    }
    if (!product.regions || product.regions.length === 0) {
      product.regions = await this.dataSource
        .getMongoRepository(ProductRegion)
        .find({
          where: { productId: new ObjectId(productId) } as any,
          order: { displayOrder: 'ASC' },
        });
    }
    if (!product.directColors || product.directColors.length === 0) {
      product.directColors = await this.dataSource
        .getMongoRepository(ProductColor)
        .find({
          where: { productId: new ObjectId(productId) } as any,
          order: { displayOrder: 'ASC' },
        });
    }
    if (!product.images || product.images.length === 0) {
      product.images = await this.dataSource
        .getMongoRepository(ProductImage)
        .find({
          where: { productId: new ObjectId(productId) } as any,
          order: { displayOrder: 'ASC' },
        });
    }
    if (!product.videos || product.videos.length === 0) {
      product.videos = await this.dataSource
        .getMongoRepository(ProductVideo)
        .find({
          where: { productId: new ObjectId(productId) } as any,
          order: { displayOrder: 'ASC' },
        });
    }
    if (!product.specifications || product.specifications.length === 0) {
      product.specifications = await this.dataSource
        .getMongoRepository(ProductSpecification)
        .find({
          where: { productId: new ObjectId(productId) } as any,
          order: { displayOrder: 'ASC' },
        });
    }

    // 2. Load nested relations for networks (colors with storages)
    if (product.networks && product.networks.length > 0) {
      for (const network of product.networks) {
        // Load default storages for network
        const defaultStorages = await this.dataSource
          .getMongoRepository(ProductStorage)
          .find({
            where: { networkId: network.id } as any,
            order: { displayOrder: 'ASC' },
          });

        for (const storage of defaultStorages) {
          const price = await this.dataSource
            .getMongoRepository(ProductPrice)
            .findOne({
              where: { storageId: storage.id } as any,
            });
          (storage as any).price = price;
        }
        (network as any).defaultStorages = defaultStorages;

        // Load colors for this network
        const colors = await this.dataSource
          .getMongoRepository(ProductColor)
          .find({
            where: { networkId: network.id } as any,
            order: { displayOrder: 'ASC' },
          });

        for (const color of colors) {
          // Load storages for this color
          const storages = await this.dataSource
            .getMongoRepository(ProductStorage)
            .find({
              where: { colorId: color.id } as any,
              order: { displayOrder: 'ASC' },
            });

          // Load prices for storages
          for (const storage of storages) {
            const price = await this.dataSource
              .getMongoRepository(ProductPrice)
              .findOne({
                where: { storageId: storage.id } as any,
              });
            (storage as any).price = price;
          }
          (color as any).storages = storages;
        }
        (network as any).colors = colors;
      }
    }

    // 3. Load nested relations for regions (defaultStorages and colors with their storages)
    if (product.regions && product.regions.length > 0) {
      for (const region of product.regions) {
        // Load default storages
        const defaultStorages = await this.dataSource
          .getMongoRepository(ProductStorage)
          .find({
            where: { regionId: region.id } as any,
            order: { displayOrder: 'ASC' },
          });

        // Load prices for default storages
        for (const storage of defaultStorages) {
          const price = await this.dataSource
            .getMongoRepository(ProductPrice)
            .findOne({
              where: { storageId: storage.id } as any,
            });
          (storage as any).price = price;
        }
        (region as any).defaultStorages = defaultStorages;

        // Load colors with their custom storages
        const colors = await this.dataSource
          .getMongoRepository(ProductColor)
          .find({
            where: { regionId: region.id } as any,
            order: { displayOrder: 'ASC' },
          });

        for (const color of colors) {
          // Load custom storages for this color
          const storages = await this.dataSource
            .getMongoRepository(ProductStorage)
            .find({
              where: { colorId: color.id } as any,
              order: { displayOrder: 'ASC' },
            });

          // Load prices for custom storages
          for (const storage of storages) {
            const price = await this.dataSource
              .getMongoRepository(ProductPrice)
              .findOne({
                where: { storageId: storage.id } as any,
              });
            (storage as any).price = price;
          }
          (color as any).storages = storages;
        }
        (region as any).colors = colors;
      }
    }

    // 4. Load storages for directColors
    if (product.directColors && product.directColors.length > 0) {
      for (const color of product.directColors) {
        const storages = await this.dataSource
          .getMongoRepository(ProductStorage)
          .find({
            where: { colorId: color.id } as any,
            order: { displayOrder: 'ASC' },
          });

        for (const storage of storages) {
          const price = await this.dataSource
            .getMongoRepository(ProductPrice)
            .findOne({
              where: { storageId: storage.id } as any,
            });
          (storage as any).price = price;
        }
        (color as any).storages = storages;
      }
    }

    // 5. Load Categories and Brands
    if (product.categoryIds && product.categoryIds.length > 0) {
      const categories = await this.dataSource
        .getMongoRepository(Category)
        .find({
          where: {
            _id: { $in: product.categoryIds },
          } as any,
        });
      (product as any).categories = categories;
    }

    if (product.brandIds && product.brandIds.length > 0) {
      const brands = await this.dataSource.getMongoRepository(Brand).find({
        where: {
          _id: { $in: product.brandIds },
        } as any,
      });
      (product as any).brands = brands;
    }
  }

  private formatProductResponse(product: Product) {
    const prices = this.extractAllPrices(product);
    const totalStock = this.calculateTotalStock(product);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      productType: product.productType,
      description: product.description,
      categoryId: product.categoryId,
      categoryIds: product.categoryIds,
      categories: (product as any).categories?.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      })),
      brandId: product.brandId,
      brandIds: product.brandIds,
      brands: (product as any).brands?.map((brand: any) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
      })),
      productCode: product.productCode,
      sku: product.sku,
      warranty: product.warranty,
      // Simple product fields
      price: product.price,
      comparePrice: product.comparePrice,
      stockQuantity: product.stockQuantity,
      lowStockAlert: product.lowStockAlert,
      isActive: product.isActive,
      isOnline: product.isOnline,
      isPos: product.isPos,
      isPreOrder: product.isPreOrder,
      isOfficial: product.isOfficial,
      freeShipping: product.freeShipping,
      isEmi: product.isEmi,
      isCare: product.isCare,
      delivery: product.delivery,
      easyReturns: product.easyReturns,
      rewardPoints: product.rewardPoints,
      minBookingPrice: product.minBookingPrice,
      seo: {
        title: product.seoTitle,
        description: product.seoDescription,
        keywords: product.seoKeywords,
        canonical: product.seoCanonical,
      },
      tags: product.tags,
      faqIds: product.faqIds,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        currency: 'BDT',
      },
      totalStock,
      images: product.images?.map((img) => ({
        id: img.id,
        url: img.imageUrl,
        isThumbnail: img.isThumbnail,
        altText: img.altText,
      })),
      videos: product.videos?.map((vid) => ({
        id: vid.id,
        url: vid.videoUrl,
        type: vid.videoType,
      })),
      directColors: product.directColors?.map((color) => ({
        id: color.id,
        name: color.colorName,
        image: color.colorImage,
        hasStorage: color.hasStorage,
        isDefault: color.isDefault,
        singlePrice: color.singlePrice,
        singleComparePrice: color.singleComparePrice,
        singleDiscountPercent: color.singleDiscountPercent,
        singleDiscountPrice: color.singleDiscountPrice,
        singleStockQuantity: color.singleStockQuantity,
        singleLowStockAlert: color.singleLowStockAlert,
        // New fields
        regularPrice: color.regularPrice,
        discountPrice: color.discountPrice,
        stockQuantity: color.stockQuantity,

        features: color.features,
        storages: color.hasStorage
          ? color.storages?.map((storage) => ({
              id: storage.id,
              size: storage.storageSize,
              isDefault: storage.isDefault,
              price: {
                regular: storage.price?.regularPrice,
                compare: storage.price?.comparePrice,
                discount: storage.price?.discountPrice,
                discountPercent: storage.price?.discountPercent,
                campaign: storage.price?.campaignPrice,
                campaignActive: this.isCampaignActive(
                  storage.price?.campaignStart,
                  storage.price?.campaignEnd,
                ),
                final: this.calculateFinalPrice(storage.price),
              },
              stock: storage.price?.stockQuantity,
              inStock: (storage.price?.stockQuantity ?? 0) > 0,
            }))
          : undefined,
      })),
      networks: product.networks?.map((network: any) => ({
        id: network.id,
        name: network.networkType,
        priceAdjustment: network.priceAdjustment,
        isDefault: network.isDefault,
        defaultStorages: network.defaultStorages?.map((storage: any) => ({
          id: storage.id,
          size: storage.storageSize,
          isDefault: storage.isDefault,
          price: {
            regular: storage.price?.regularPrice,
            compare: storage.price?.comparePrice,
            discount: storage.price?.discountPrice,
            discountPercent: storage.price?.discountPercent,
            campaign: storage.price?.campaignPrice,
            campaignActive: this.isCampaignActive(
              storage.price?.campaignStart,
              storage.price?.campaignEnd,
            ),
            final: this.calculateFinalPrice(storage.price),
          },
          stock: storage.price?.stockQuantity,
          inStock: (storage.price?.stockQuantity ?? 0) > 0,
        })),
        colors: network.colors?.map((color: any) => ({
          id: color.id,
          name: color.colorName,
          image: color.colorImage,
          hasStorage: color.hasStorage,
          isDefault: color.isDefault,
          singlePrice: color.singlePrice,
          singleComparePrice: color.singleComparePrice,
          singleStockQuantity: color.singleStockQuantity,
          // New fields
          regularPrice: color.regularPrice,
          discountPrice: color.discountPrice,
          stockQuantity: color.stockQuantity,

          features: color.features,
          storages: color.hasStorage
            ? color.storages?.map((storage: any) => ({
                id: storage.id,
                size: storage.storageSize,
                isDefault: storage.isDefault,
                price: {
                  regular: storage.price?.regularPrice,
                  compare: storage.price?.comparePrice,
                  discount: storage.price?.discountPrice,
                  discountPercent: storage.price?.discountPercent,
                  campaign: storage.price?.campaignPrice,
                  campaignActive: this.isCampaignActive(
                    storage.price?.campaignStart,
                    storage.price?.campaignEnd,
                  ),
                  final: this.calculateFinalPrice(storage.price),
                },
                stock: storage.price?.stockQuantity,
                inStock: (storage.price?.stockQuantity ?? 0) > 0,
              }))
            : undefined,
        })),
      })),
      regions: product.regions?.map((region: any) => ({
        id: region.id,
        name: region.regionName,
        isDefault: region.isDefault,
        defaultStorages: region.defaultStorages?.map((storage: any) => ({
          id: storage.id,
          size: storage.storageSize,
          isDefault: storage.isDefault,
          price: {
            regular: storage.price?.regularPrice,
            compare: storage.price?.comparePrice,
            discount: storage.price?.discountPrice,
            discountPercent: storage.price?.discountPercent,
            campaign: storage.price?.campaignPrice,
            campaignActive: this.isCampaignActive(
              storage.price?.campaignStart,
              storage.price?.campaignEnd,
            ),
            final: this.calculateFinalPrice(storage.price),
          },
          stock: storage.price?.stockQuantity,
          inStock: (storage.price?.stockQuantity ?? 0) > 0,
        })),
        colors: region.colors?.map((color: any) => ({
          id: color.id,
          name: color.colorName,
          image: color.colorImage,
          hasStorage: color.hasStorage,
          useDefaultStorages: color.useDefaultStorages,
          isDefault: color.isDefault,
          singlePrice: color.singlePrice,
          singleComparePrice: color.singleComparePrice,
          singleStockQuantity: color.singleStockQuantity,
          // New fields
          regularPrice: color.regularPrice,
          discountPrice: color.discountPrice,
          stockQuantity: color.stockQuantity,

          features: color.features,
          // Include custom storages only if useDefaultStorages = false
          customStorages:
            color.hasStorage && !color.useDefaultStorages
              ? color.storages?.map((storage: any) => ({
                  id: storage.id,
                  size: storage.storageSize,
                  isDefault: storage.isDefault,
                  price: {
                    regular: storage.price?.regularPrice,
                    compare: storage.price?.comparePrice,
                    discount: storage.price?.discountPrice,
                    discountPercent: storage.price?.discountPercent,
                    campaign: storage.price?.campaignPrice,
                    campaignActive: this.isCampaignActive(
                      storage.price?.campaignStart,
                      storage.price?.campaignEnd,
                    ),
                    final: this.calculateFinalPrice(storage.price),
                  },
                  stock: storage.price?.stockQuantity,
                  inStock: (storage.price?.stockQuantity ?? 0) > 0,
                }))
              : undefined,
        })),
      })),
      specifications: this.groupSpecifications(product.specifications),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private extractAllPrices(product: Product): number[] {
    const prices: number[] = [];

    // Simple product price
    if (product.price) {
      prices.push(product.price);
    }

    // Direct colors prices
    product.directColors?.forEach((color) => {
      if (color.singlePrice) {
        prices.push(color.singlePrice);
      }
      if (color.hasStorage) {
        color.storages?.forEach((storage) => {
          if (storage.price) {
            const finalPrice = this.calculateFinalPrice(storage.price);
            prices.push(finalPrice);
          }
        });
      }
    });

    // Network-based prices
    product.networks?.forEach((network) => {
      network.colors?.forEach((color) => {
        if (color.singlePrice) {
          prices.push(color.singlePrice);
        }
        if (color.hasStorage) {
          color.storages?.forEach((storage) => {
            if (storage.price) {
              const finalPrice = this.calculateFinalPrice(storage.price);
              prices.push(finalPrice);
            }
          });
        }
      });
    });

    // Region-based prices
    product.regions?.forEach((region) => {
      region.colors?.forEach((color) => {
        if (color.singlePrice) {
          prices.push(color.singlePrice);
        }
        if (color.hasStorage) {
          color.storages?.forEach((storage) => {
            if (storage.price) {
              const finalPrice = this.calculateFinalPrice(storage.price);
              prices.push(finalPrice);
            }
          });
        }
      });
    });

    return prices.length > 0 ? prices : [0];
  }

  private calculateTotalStock(product: Product): number {
    let total = 0;

    // Simple product stock
    if (product.stockQuantity) {
      total += product.stockQuantity;
    }

    // Direct colors stock
    product.directColors?.forEach((color) => {
      if (color.singleStockQuantity) {
        total += color.singleStockQuantity;
      }
      if (color.hasStorage) {
        color.storages?.forEach((storage) => {
          total += storage.price?.stockQuantity ?? 0;
        });
      }
    });

    // Network-based stock
    product.networks?.forEach((network) => {
      network.colors?.forEach((color) => {
        if (color.singleStockQuantity) {
          total += color.singleStockQuantity;
        }
        if (color.hasStorage) {
          color.storages?.forEach((storage) => {
            total += storage.price?.stockQuantity ?? 0;
          });
        }
      });
    });

    // Region-based stock
    product.regions?.forEach((region) => {
      region.colors?.forEach((color) => {
        if (color.singleStockQuantity) {
          total += color.singleStockQuantity;
        }
        if (color.hasStorage) {
          color.storages?.forEach((storage) => {
            total += storage.price?.stockQuantity ?? 0;
          });
        }
      });
    });

    return total;
  }

  private calculateFinalPrice(price: ProductPrice | undefined): number {
    if (!price) return 0;

    // Check if campaign is active
    if (
      price.campaignPrice &&
      this.isCampaignActive(price.campaignStart, price.campaignEnd)
    ) {
      return price.campaignPrice;
    }

    // Check discount price
    if (price.discountPrice) {
      return price.discountPrice;
    }

    // Return regular price
    return price.regularPrice;
  }

  private isCampaignActive(start?: Date, end?: Date): boolean {
    if (!start || !end) return false;

    const now = new Date();
    return now >= new Date(start) && now <= new Date(end);
  }

  private groupSpecifications(specs?: ProductSpecification[]) {
    if (!specs || specs.length === 0) return [];

    // Return specs as simple array of key-value pairs, sorted by displayOrder
    return specs
      .map((spec) => ({
        key: spec.specKey,
        value: spec.specValue,
        displayOrder: spec.displayOrder,
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  private extractDuplicateField(error: any): string {
    const errorMessage = error.message || '';
    const errorString = JSON.stringify(error);

    // Check for slug duplicate
    if (
      errorMessage.includes('slug') ||
      (errorMessage.includes('UQ_') && errorMessage.includes('slug'))
    ) {
      return 'Product slug';
    }

    // Check for productCode duplicate
    if (errorMessage.includes('productCode')) {
      return 'Product code';
    }

    // Check for sku duplicate
    if (errorMessage.includes('sku')) {
      return 'SKU';
    }

    // Check for region name duplicate
    if (
      errorMessage.includes('regionName') ||
      errorMessage.includes('productId_1_regionName')
    ) {
      return 'Region name (duplicate region name for this product)';
    }

    // Check for color name duplicate
    if (errorMessage.includes('colorName')) {
      if (errorMessage.includes('productId')) {
        return 'Color name (duplicate color name for this product)';
      }
      if (errorMessage.includes('regionId')) {
        return 'Color name (duplicate color name for this region)';
      }
      return 'Color name';
    }

    // Check for storage size duplicate
    if (errorMessage.includes('storageSize')) {
      if (errorMessage.includes('productId')) {
        return 'Storage size (duplicate storage size for this product)';
      }
      if (errorMessage.includes('regionId')) {
        return 'Storage size (duplicate storage size for this region)';
      }
      return 'Storage size';
    }

    return 'Duplicate value';
  }

  //find by id
  async findById(id: string) {
    try {
      const objectId = new ObjectId(id);

      const product = await this.productRepository.findOne({
        where: { _id: objectId } as any,
      });

      if (!product) {
        return null;
      }

      // Manually load all relations for MongoDB
      await this.loadProductRelations(product);

      return product;
    } catch (error) {
      // If ObjectId conversion fails, return null
      console.error('Error in findById:', error);
      return null;
    }
  }

  // ==================== Product Care CRUD Methods ====================

  /**
   * Create a new product care plan
   */
  async createProductCare(createCareDto: {
    productIds?: string[];
    categoryIds?: string[];
    planName: string;
    price: number;
    duration?: string;
    description?: string;
    features?: string[];
  }) {
    try {
      const care = new ProductCare();

      if (createCareDto.productIds) {
        care.productIds = createCareDto.productIds;
      }
      if (createCareDto.categoryIds) {
        care.categoryIds = createCareDto.categoryIds;
      }

      care.planName = createCareDto.planName;
      care.price = createCareDto.price;
      care.duration = createCareDto.duration;
      care.description = createCareDto.description;
      care.features = createCareDto.features;

      const savedCare = await this.productCareRepository.save(care);
      return savedCare;
    } catch (error) {
      console.error('Error creating product care:', error);
      throw new InternalServerErrorException(
        'Failed to create product care plan',
      );
    }
  }

  /**
   * Update an existing product care plan
   */
  async updateProductCare(
    id: string,
    updateCareDto: {
      productIds?: string[];
      categoryIds?: string[];
      planName?: string;
      price?: number;
      duration?: string;
      description?: string;
      features?: string[];
    },
  ) {
    try {
      const objectId = new ObjectId(id);
      const care = await this.productCareRepository.findOne({
        where: { _id: objectId } as any,
      });

      if (!care) {
        throw new NotFoundException('Product care plan not found');
      }

      // Update fields
      if (updateCareDto.productIds !== undefined) {
        care.productIds = updateCareDto.productIds;
      }
      if (updateCareDto.categoryIds !== undefined) {
        care.categoryIds = updateCareDto.categoryIds;
      }
      if (updateCareDto.planName) {
        care.planName = updateCareDto.planName;
      }
      if (updateCareDto.price !== undefined) {
        care.price = updateCareDto.price;
      }
      if (updateCareDto.duration !== undefined) {
        care.duration = updateCareDto.duration;
      }
      if (updateCareDto.description !== undefined) {
        care.description = updateCareDto.description;
      }
      if (updateCareDto.features !== undefined) {
        care.features = updateCareDto.features;
      }

      const updatedCare = await this.productCareRepository.save(care);
      return updatedCare;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating product care:', error);
      throw new InternalServerErrorException(
        'Failed to update product care plan',
      );
    }
  }

  /**
   * Get all product care plans
   */
  async getAllProductCares() {
    try {
      const cares = await this.productCareRepository.find({
        order: { createdAt: -1 } as any,
      });
      return cares;
    } catch (error) {
      console.error('Error fetching product cares:', error);
      throw new InternalServerErrorException(
        'Failed to fetch product care plans',
      );
    }
  }

  /**
   * Get a single product care plan by ID
   */
  async getProductCareById(id: string) {
    try {
      const objectId = new ObjectId(id);
      const care = await this.productCareRepository.findOne({
        where: { _id: objectId } as any,
      });

      if (!care) {
        throw new NotFoundException('Product care plan not found');
      }

      return care;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching product care:', error);
      throw new InternalServerErrorException(
        'Failed to fetch product care plan',
      );
    }
  }

  /**
   * Get product care plans by product ID
   */
  async getProductCaresByProductId(productId: string) {
    try {
      // Find all care plans that include this product ID
      const cares = await this.productCareRepository.find();

      // Filter care plans that contain the product ID in their productIds array
      const matchingCares = cares.filter(
        (care) => care.productIds && care.productIds.includes(productId),
      );

      // Also check if the product belongs to a category that has care plans
      const product = await this.findById(productId);
      if (product && product.categoryIds) {
        const categoryIdStrings = product.categoryIds.map((id) =>
          id.toString(),
        );
        const categoryCares = cares.filter(
          (care) =>
            care.categoryIds &&
            care.categoryIds.some((catId) => categoryIdStrings.includes(catId)),
        );

        // Merge and deduplicate
        const allCares = [...matchingCares, ...categoryCares];
        const uniqueCares = Array.from(
          new Map(allCares.map((care) => [care.id.toString(), care])).values(),
        );

        return uniqueCares;
      }

      return matchingCares;
    } catch (error) {
      console.error('Error fetching product cares by product ID:', error);
      throw new InternalServerErrorException(
        'Failed to fetch product care plans for this product',
      );
    }
  }

  /**
   * Delete a product care plan
   */
  async deleteProductCare(id: string) {
    try {
      const objectId = new ObjectId(id);
      const care = await this.productCareRepository.findOne({
        where: { _id: objectId } as any,
      });

      if (!care) {
        throw new NotFoundException('Product care plan not found');
      }

      await this.productCareRepository.remove(care);
      return { message: 'Product care plan deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting product care:', error);
      throw new InternalServerErrorException(
        'Failed to delete product care plan',
      );
    }
  }
}
