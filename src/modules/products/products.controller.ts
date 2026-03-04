import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UploadedFiles,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { 
  CreateBasicProductDto, 
  CreateNetworkProductDto, 
  CreateRegionProductDto 
} from './dto/create-product-new.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { FileFieldsUpload, UploadType } from '../../common/decorators/file-upload.decorator';
import { CloudflareService } from '../../config/cloudflare-video.service';
import { ProductService } from './products.service';

@ApiTags('Products (New Architecture)')
@Controller('products-new')
export class ProductsController {
  constructor(
    private readonly productsService: ProductService,
    private readonly cloudflareService: CloudflareService,
  ) {}

  @Post('basic')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create basic product with variants, pricing, images, and specs',
    description: 'Create a simple product with direct color variants',
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @FileFieldsUpload(
    [
      { name: 'thumbnail', maxCount: 1 },
      { name: 'galleryImages', maxCount: 20 },
      // Allow dynamic color images (up to 20 colors)
      ...Array.from({ length: 20 }, (_, i) => ({ name: `colors[${i}][colorImage]`, maxCount: 1 })),
    ],
    undefined,
    UploadType.IMAGE,
  )
  async createBasic(
    @Body() createProductDto: CreateBasicProductDto,
    @UploadedFiles() files: any,
  ) {
    const processedDto = await this.processFileUploads(createProductDto, files);
    return this.productsService.createBasicProduct(processedDto);
  }

  @Post('network')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create network-based product',
    description: 'Create a product with network variants (e.g. WiFi, Cellular)',
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @FileFieldsUpload(
    [
      { name: 'thumbnail', maxCount: 1 },
      { name: 'galleryImages', maxCount: 20 },
      { name: 'colors', maxCount: 20 },
    ],
    undefined,
    UploadType.IMAGE,
  )
  async createNetwork(
    @Body() createProductDto: CreateNetworkProductDto,
    @UploadedFiles() files: any,
  ) {
    const processedDto = await this.processFileUploads(createProductDto, files);
    return this.productsService.createNetworkProduct(processedDto);
  }

  @Post('region')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create region-based product',
    description: 'Create a product with regional variants (e.g. International, USA)',
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @FileFieldsUpload(
    [
      { name: 'thumbnail', maxCount: 1 },
      { name: 'galleryImages', maxCount: 20 },
      { name: 'colors', maxCount: 20 },
    ],
    undefined,
    UploadType.IMAGE,
  )
  async createRegion(
    @Body() createProductDto: CreateRegionProductDto,
    @UploadedFiles() files: any,
  ) {
    const processedDto = await this.processFileUploads(createProductDto, files);
    return this.productsService.createRegionProduct(processedDto);
  }

  @Patch('basic/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update basic product',
    description: 'Update an existing basic product with variants, pricing, images, and specs',
  })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @FileFieldsUpload(
    [
      { name: 'thumbnail', maxCount: 1 },
      { name: 'galleryImages', maxCount: 20 },
      ...Array.from({ length: 20 }, (_, i) => ({ name: `colors[${i}][colorImage]`, maxCount: 1 })),
    ],
    undefined,
    UploadType.IMAGE,
  )
  async updateBasic(
    @Param('id') id: string,
    @Body() updateProductDto: CreateBasicProductDto,
    @UploadedFiles() files: any,
  ) {
    const processedDto = await this.processFileUploads(updateProductDto, files);
    return this.productsService.updateBasicProduct(id, processedDto);
  }

  @Patch('network/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update network-based product',
    description: 'Update an existing network-based product',
  })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @FileFieldsUpload(
    [
      { name: 'thumbnail', maxCount: 1 },
      { name: 'galleryImages', maxCount: 20 },
      { name: 'colors', maxCount: 20 },
    ],
    undefined,
    UploadType.IMAGE,
  )
  async updateNetwork(
    @Param('id') id: string,
    @Body() updateProductDto: CreateNetworkProductDto,
    @UploadedFiles() files: any,
  ) {
    const processedDto = await this.processFileUploads(updateProductDto, files);
    return this.productsService.updateNetworkProduct(id, processedDto);
  }

  @Patch('region/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update region-based product',
    description: 'Update an existing region-based product',
  })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @FileFieldsUpload(
    [
      { name: 'thumbnail', maxCount: 1 },
      { name: 'galleryImages', maxCount: 20 },
      { name: 'colors', maxCount: 20 },
    ],
    undefined,
    UploadType.IMAGE,
  )
  async updateRegion(
    @Param('id') id: string,
    @Body() updateProductDto: CreateRegionProductDto,
    @UploadedFiles() files: any,
  ) {
    const processedDto = await this.processFileUploads(updateProductDto, files);
    return this.productsService.updateRegionProduct(id, processedDto);
  }

  /**
   * Helper to process file uploads and JSON parsing
   */
private async processFileUploads(dto: any, files: any) {
  // 1. Parse JSON fields
  const jsonFields = ['specifications', 'seoKeywords', 'tags', 'videos', 'colors', 'networks', 'regions', 'categoryIds', 'brandIds', 'images', 'keepImageIds'];
  
  for (const field of jsonFields) {
    if (typeof dto[field] === 'string') {
      try {
        dto[field] = JSON.parse(dto[field]);
      } catch (e) {
        if (field === 'keepImageIds' && Array.isArray(dto[field])) {
          continue;
        }
        throw new BadRequestException(`Invalid JSON format for field: ${field}`);
      }
    }
  }

  // Get existing images from dto (if any)
  const existingImages = dto.images || [];
  const keepImageIds = dto.keepImageIds || [];

  // Separate thumbnail and gallery images
  const existingThumbnail = existingImages.find((img: any) => img.isThumbnail);
  const existingGalleryImages = existingImages.filter((img: any) => !img.isThumbnail);

  // Filter gallery images to keep (based on keepImageIds)
  const galleryImagesToKeep = existingGalleryImages.filter((img: any) => 
    img.id && keepImageIds.includes(img.id)
  );

  // Initialize result images array
  const resultImages: any[] = [];

  // 2. Handle Thumbnail (CRITICAL - must be first)
  if (files?.thumbnail?.length) {
    try {
      const upload = await this.cloudflareService.uploadImage(
        files.thumbnail[0].buffer,
        files.thumbnail[0].originalname,
      );
      
      // Add/Update thumbnail as first image
      resultImages.push({
        url: upload.variants?.[0] || upload.id || '',
        isThumbnail: true,
        altText: files.thumbnail[0].originalname,
        displayOrder: 0,
        // Preserve ID if updating existing thumbnail
        id: existingThumbnail?.id || undefined
      });
    } catch (err) {
      throw new InternalServerErrorException(`Thumbnail upload failed: ${err.message}`);
    }
  } else if (existingThumbnail) {
    // No new thumbnail, but keep existing one
    resultImages.push({
      ...existingThumbnail,
      displayOrder: 0,
      isThumbnail: true // Ensure it's marked as thumbnail
    });
  }

  // 3. Add kept gallery images
  galleryImagesToKeep.forEach((img: any, index: number) => {
    resultImages.push({
      ...img,
      isThumbnail: false, // Ensure it's NOT thumbnail
      displayOrder: resultImages.length
    });
  });

  // 4. Handle new Gallery Images upload
  if (files?.galleryImages?.length) {
    try {
      const uploadedGallery = await Promise.all(
        files.galleryImages.map(async (file: any, index: number) => {
          const upload = await this.cloudflareService.uploadImage(
            file.buffer,
            file.originalname,
          );
          return {
            url: upload.variants?.[0] || upload.id || '',
            isThumbnail: false,
            altText: file.originalname,
            displayOrder: resultImages.length + index,
          };
        }),
      );
      
      // Add new gallery images to result
      resultImages.push(...uploadedGallery);
    } catch (err) {
      throw new InternalServerErrorException(`Gallery upload failed: ${err.message}`);
    }
  }

  // 5. Ensure proper display order for all images
  resultImages.forEach((img, index) => {
    img.displayOrder = index;
  });

  // 6. Update dto.images with the complete array
  dto.images = resultImages;

  // 7. Handle Color Images (Basic Product)
  if (files && dto.colors) {
    for (let i = 0; i < dto.colors.length; i++) {
      const fileKey = `colors[${i}][colorImage]`;
      if (files[fileKey]?.length) {
        try {
          const upload = await this.cloudflareService.uploadImage(
            files[fileKey][0].buffer,
            files[fileKey][0].originalname,
          );
          dto.colors[i].colorImage = upload.variants?.[0] || upload.id || '';
        } catch (err) {
          console.error(`Color image upload failed for index ${i}`, err);
        }
      }
    }
  }

  // 8. Handle Network/Region Product Color Images
  if (files?.colors?.length) {
    try {
      const uploadedColorImages = await Promise.all(
        files.colors.map(async (file: any) => {
          const upload = await this.cloudflareService.uploadImage(
            file.buffer,
            file.originalname,
          );
          return upload.variants?.[0] || upload.id || '';
        }),
      );

      // Map uploaded images to network colors using colorImageIndex
      if (dto.networks) {
        for (const network of dto.networks) {
          if (network.colors) {
            for (const color of network.colors) {
              if (typeof (color as any).colorImageIndex === 'number') {
                const index = (color as any).colorImageIndex;
                if (index >= 0 && index < uploadedColorImages.length) {
                  color.colorImage = uploadedColorImages[index];
                }
              }
            }
          }
        }
      }

      // Map uploaded images to region colors using colorImageIndex
      if (dto.regions) {
        for (const region of dto.regions) {
          if (region.colors) {
            for (const color of region.colors) {
              if (typeof (color as any).colorImageIndex === 'number') {
                const index = (color as any).colorImageIndex;
                if (index >= 0 && index < uploadedColorImages.length) {
                  color.colorImage = uploadedColorImages[index];
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Network/Region color images upload failed', err);
    }
  }

  return dto;
}

@Get()
@ApiOperation({ summary: 'Get all products with filters and pagination' })
@ApiQuery({ name: 'categoryIds', required: false, type: String })
@ApiQuery({ name: 'brandId', required: false, type: String })
@ApiQuery({ name: 'isActive', required: false, type: Boolean })
@ApiQuery({ name: 'isOnline', required: false, type: Boolean })
@ApiQuery({ name: 'minPrice', required: false, type: Number })
@ApiQuery({ name: 'maxPrice', required: false, type: Number })
@ApiQuery({ name: 'search', required: false, type: String })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'offset', required: false, type: Number })
@ApiQuery({ name: 'productType', required: false, enum: ['basic', 'network', 'region'] })
@ApiQuery({ name: 'fields', required: false, type: String, description: 'Comma-separated fields for lightweight response' })
@ApiResponse({
  status: 200,
  description: 'List of products',
})
findAll(
  @Query('categoryIds') categoryIds?: string,
  @Query('brandId') brandId?: string,
  @Query('isActive') isActive?: boolean,
  @Query('isOnline') isOnline?: boolean,
  @Query('minPrice') minPrice?: number,
  @Query('maxPrice') maxPrice?: number,
  @Query('search') search?: string,
  @Query('limit') limit?: number,
  @Query('offset') offset?: number,
  @Query('productType') productType?: string,
  @Query('fields') fields?: string,
) {
  return this.productsService.findAll({
    categoryIds,
    brandId,
    isActive,
    isOnline,
    minPrice,
    maxPrice,
    search,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
    productType,
    fields,
  });
}

  @Get('search')
  @ApiOperation({ summary: 'Search products by name, description, or code' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Search results',
  })
  search(@Query('q') query: string) {
    return this.productsService.search(query);
  }

  // ==================== Product Care Endpoints ====================
  // IMPORTANT: Must be before :slug route to avoid "care" being treated as a slug

  @Post('care')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product care plan' })
  @ApiResponse({ status: 201, description: 'Care plan created successfully' })
  createCare(
    @Body() createCareDto: {
      productIds?: string[];
      categoryIds?: string[];
      planName: string;
      price: number;
      duration?: string;
      description?: string;
      features?: string[];
    },
  ) {
    return this.productsService.createProductCare(createCareDto);
  }

  @Patch('care/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product care plan' })
  @ApiResponse({ status: 200, description: 'Care plan updated successfully' })
  updateCare(
    @Param('id') id: string,
    @Body() updateCareDto: {
      productIds?: string[];
      categoryIds?: string[];
      planName?: string;
      price?: number;
      duration?: string;
      description?: string;
      features?: string[];
    },
  ) {
    return this.productsService.updateProductCare(id, updateCareDto);
  }

  @Get('care')
  @ApiOperation({ summary: 'Get all product care plans' })
  @ApiResponse({ status: 200, description: 'List of all care plans' })
  getAllCares() {
    return this.productsService.getAllProductCares();
  }

  @Get('care/:id')
  @ApiOperation({ summary: 'Get product care plan by ID' })
  @ApiResponse({ status: 200, description: 'Care plan details' })
  @ApiResponse({ status: 404, description: 'Care plan not found' })
  getCareById(@Param('id') id: string) {
    return this.productsService.getProductCareById(id);
  }

  @Get('care/product/:productId')
  @ApiOperation({ summary: 'Get care plans for a specific product' })
  @ApiResponse({ status: 200, description: 'List of care plans for the product' })
  getCaresByProductId(@Param('productId') productId: string) {
    return this.productsService.getProductCaresByProductId(productId);
  }

  @Delete('care/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product care plan' })
  @ApiResponse({ status: 200, description: 'Care plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Care plan not found' })
  deleteCare(@Param('id') id: string) {
    return this.productsService.deleteProductCare(id);
  }

  // ==================== Generic Product Routes ====================
  // IMPORTANT: Must be after specific routes like "care" to avoid conflicts

  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug with full details' })
  @ApiResponse({
    status: 200,
    description: 'Product details with variants, pricing, images, and specs',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  findOne(@Param('slug') slug: string) {
    return this.productsService.findOne(slug);
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get product by ID with full details' })
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get(':productId/variant-price')
  @ApiOperation({ summary: 'Get specific variant price' })
  @ApiQuery({ name: 'regionId', required: false, type: String })
  @ApiQuery({ name: 'colorId', required: false, type: String })
  @ApiQuery({ name: 'storageId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Variant price and stock information',
  })
  getVariantPrice(
    @Param('productId') productId: string,
    @Query('regionId') regionId?: string,
    @Query('colorId') colorId?: string,
    @Query('storageId') storageId?: string,
  ) {
    return this.productsService.getVariantPrice(
      productId,
      regionId,
      colorId,
      storageId,
    );
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete product (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
