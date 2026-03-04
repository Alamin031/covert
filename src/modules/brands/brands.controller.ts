import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
  UploadedFiles,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { FileFieldsUpload, UploadType } from '../../common/decorators/file-upload.decorator';
import { CloudflareService } from '../../config/cloudflare-video.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly cloudflareService: CloudflareService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create brand (Admin only)' })
  @FileFieldsUpload(
    [{ name: 'logo', maxCount: 1 }],
    undefined,
    UploadType.IMAGE,
  )
  async create(
    @Body() dto: CreateBrandDto,
    @UploadedFiles() files: { logo?: Express.Multer.File[] },
  ) {
    if (files?.logo?.length) {
      const file = files.logo[0];
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        dto.logo = upload.variants?.[0] || upload.id || upload.filename || '';
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new InternalServerErrorException(
          `Cloudflare image upload failed: ${message}`,
        );
      }
    }
    const brand = await this.brandsService.create(dto);
    return {
      ...brand,
      id: brand.id,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all brands' })
  async findAll() {
    const brands = await this.brandsService.findAll();
    return brands.map(brand => ({
      ...brand,
      id: brand.id,
    }));
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured brands' })
  getFeatured() {
    return this.brandsService.getFeatured();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get brand by slug' })
  async findOne(@Param('slug') slug: string) {
    const brand = await this.brandsService.findOne(slug);
    return {
      ...brand,
      id: brand.id,
    };
  }

  @Get(':slug/products')
  @ApiOperation({ summary: 'Get products by brand' })
  findProducts(@Param('slug') slug: string) {
    return this.brandsService.findProducts(slug);
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update brand (Admin only)' })
  @FileFieldsUpload(
    [{ name: 'logo', maxCount: 1 }],
    undefined,
    UploadType.IMAGE,
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @UploadedFiles() files: { logo?: Express.Multer.File[] },
  ) {
    if (files?.logo?.length) {
      const file = files.logo[0];
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        dto.logo = upload.variants?.[0] || upload.id || upload.filename || '';
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new InternalServerErrorException(
          `Cloudflare image upload failed: ${message}`,
        );
      }
    }
    const brand = await this.brandsService.update(id, dto);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return {
      ...brand,
      id: brand.id,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete brand (Admin only)' })
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
