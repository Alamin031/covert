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
  NotFoundException,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import {
  FileFieldsUpload,
  UploadType,
} from '../../common/decorators/file-upload.decorator';
import { CloudflareService } from '../../config/cloudflare-video.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryFilterDto,
} from './dto/category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly cloudflareService: CloudflareService,
  ) {}

  @Get('brand/:brandsId')
  @ApiOperation({ summary: 'Get all categories for a brand' })
  async getCategoriesByBrand(@Param('brandsId') brandsId: string) {
    const categories = await this.categoriesService.findByBrandId(brandsId);
    return categories.map((category) => ({
      ...category,
      id: category.id,
      subcategories: category.subcategories ?? [],
    }));
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  async getById(@Param('id') id: string) {
    const category = await this.categoriesService.getById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return {
      ...category,
      id: category.id,
      brandsId: category.brandsId,
      subcategories: category.subcategories ?? [],
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_CATEGORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (Admin only)' })
  @FileFieldsUpload(
    [{ name: 'banner', maxCount: 1 }],
    undefined,
    UploadType.IMAGE,
  )
  async create(
    @Body() dto: CreateCategoryDto,
    @UploadedFiles() files: { banner?: Express.Multer.File[] },
  ) {
    if (files?.banner?.length) {
      const file = files.banner[0];
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        dto.banner = upload.variants?.[0] || upload.id || upload.filename || '';
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new NotFoundException(
          `Cloudflare image upload failed: ${message}`,
        );
      }
    }
    const category = await this.categoriesService.create(dto);
    return {
      ...category,
      id: category.id,
      brandsId: category.brandsId,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  async findAll() {
    const categories = await this.categoriesService.findAll({
      relations: ['subcategories'],
    });
    return categories.map((category) => ({
      ...category,
      id: category.id,
      subcategories: category.subcategories ?? [],
    }));
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured categories' })
  getFeatured() {
    return this.categoriesService.getFeatured();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get category by slug' })
  async findOne(@Param('slug') slug: string) {
    const category = await this.categoriesService.findOne(slug, {
      relations: ['subcategories'],
    });
    return {
      ...category,
      id: category.id,
      brandsId: category.brandsId,
      subcategories: category.subcategories ?? [],
    };
  }

  @Get(':slug/products')
  @ApiOperation({ summary: 'Get products in category with filters' })
  findProducts(
    @Param('slug') slug: string,
    @Query() filters: CategoryFilterDto,
  ) {
    return this.categoriesService.findProducts(slug, filters);
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_CATEGORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (Admin only)' })
  @FileFieldsUpload(
    [{ name: 'banner', maxCount: 1 }],
    undefined,
    UploadType.IMAGE,
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @UploadedFiles() files: { banner?: Express.Multer.File[] },
  ) {
    if (files?.banner?.length) {
      const file = files.banner[0];
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        dto.banner = upload.variants?.[0] || upload.id || upload.filename || '';
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new NotFoundException(
          `Cloudflare image upload failed: ${message}`,
        );
      }
    }
    const category = await this.categoriesService.update(id, dto);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return {
      ...category,
      id: category.id,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_CATEGORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // SUBCATEGORY ENDPOINTS

  @Post(':categoryId/subcategories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_CATEGORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create subcategory (Admin only)' })
  async createSubcategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: any, // You should create a CreateSubcategoryDto for type safety
  ) {
    dto.categoryId = categoryId;
    return this.categoriesService.createSubcategory(dto);
  }

  @Patch('subcategories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_CATEGORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subcategory (Admin only)' })
  async updateSubcategory(
    @Param('id') id: string,
    @Body() dto: any, // You should create an UpdateSubcategoryDto for type safety
  ) {
    return this.categoriesService.updateSubcategory(id, dto);
  }

  @Get(':categoryId/subcategories')
  @ApiOperation({ summary: 'Get all subcategories for a category' })
  async getSubcategoriesByCategory(@Param('categoryId') categoryId: string) {
    return this.categoriesService.getSubcategoriesByCategory(categoryId);
  }

  @Get('subcategories/:id')
  @ApiOperation({ summary: 'Get subcategory by id' })
  async getSubcategory(@Param('id') id: string) {
    return this.categoriesService.getSubcategory(id);
  }
}
