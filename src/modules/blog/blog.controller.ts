import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { Blog } from './entities/blog.entity';
import {
  FileFieldsUpload,
  UploadType,
} from '../../common/decorators/file-upload.decorator';
import { CloudflareService } from 'src/config/cloudflare-video.service';
import { UploadedFiles } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';

@Controller('blogs')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly cloudflareService: CloudflareService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.blogService.findAll(page, limit, search, category);
  }
  _;
  //GET_BY_ID
  @Get('id/:id')
  async findOneById(@Param('id') id: string) {
    return this.blogService.findOneById(id);
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.blogService.findOneBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_BLOG)
  @FileFieldsUpload(
    [{ name: 'image', maxCount: 1 }],
    undefined,
    UploadType.IMAGE,
  )
  async create(
    @Body() blogData: Partial<Blog>,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
  ) {
    // You may want to use a CreateBlogDto instead of Partial<Blog>
    if (files?.image?.length) {
      const file = files.image[0];
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        blogData.image =
          upload.variants?.[0] || upload.id || upload.filename || '';
      } catch (err) {
        throw new Error(`Cloudflare image upload failed: ${err}`);
      }
    }
    return this.blogService.create(blogData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_BLOG)
  @FileFieldsUpload(
    [{ name: 'image', maxCount: 1 }],
    undefined,
    UploadType.IMAGE,
  )
  async update(
    @Param('id') id: string,
    @Body() blogData: Partial<Blog>,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
  ) {
    if (files?.image?.length) {
      const file = files.image[0];
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        blogData.image =
          upload.variants?.[0] || upload.id || upload.filename || '';
      } catch (err) {
        throw new Error(`Cloudflare image upload failed: ${err}`);
      }
    }
    return this.blogService.update(id, blogData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_BLOG)
  async remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }

  @Post('upload-image')
  @FileFieldsUpload(
    [{ name: 'image', maxCount: 1 }],
    undefined,
    UploadType.IMAGE,
  )
  async uploadImage(@UploadedFiles() files: { image?: Express.Multer.File[] }) {
    if (!files?.image?.length) {
      throw new BadRequestException('No image uploaded');
    }
    const file = files.image[0];
    const upload = await this.cloudflareService.uploadImage(
      file.buffer,
      file.originalname,
    );
  
    // Return the public URL
    return { url: upload.variants?.[0] || upload.id || upload.filename || '' };
  }
}
