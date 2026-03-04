import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HerobannerService } from './herobanner.service';
import { CreateHerobannerDto } from './dto/create.dto';
import {
  FileUpload,
  FileFieldsUpload,
  UploadType,
} from '../../common/decorators/file-upload.decorator';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CloudflareService } from 'src/config/cloudflare-video.service';

// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
@Controller('herobanner')
export class HerobannerController {
  // BottomBanner Endpoints
  @Post('bottom')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_HEROBANNER)
  @FileFieldsUpload(
    [{ name: 'img', maxCount: 10 }],
    undefined,
    UploadType.IMAGE,
  )
  async createBottom(
    @Body() dto: CreateHerobannerDto,
    @CurrentUser() user: User,
    @UploadedFiles() files: { img?: Express.Multer.File[] },
  ) {
    if (!user || !user.id)
      throw new UnauthorizedException('Authentication required');
    if (files?.img?.length) {
      const file = files.img[0];
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        dto.img = upload.variants?.[0] || upload.id || upload.filename || '';
      } catch (err) {
        throw new InternalServerErrorException(
          `Cloudflare image upload failed: ${err}`,
        );
      }
    }
    return await this.herobannerService.createBottomBanner(dto);
  }

  @Get('bottom')
  async findAllBottom() {
    const all = await this.herobannerService.findAllBottomBanners();
    return all.map((b) => ({ ...b, id: b.id?.toString?.() ?? String(b.id) }));
  }

  @Get('bottom/:id')
  async findOneBottom(@Param('id') id: string) {
    const banner = await this.herobannerService.findOneBottomBanner(id);
    return { ...banner, id: banner.id?.toString?.() ?? String(banner.id) };
  }

  @Patch('bottom/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_HEROBANNER)
  @FileUpload('img', 1, { storage: memoryStorage() }, UploadType.IMAGE)
  async updateBottom(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let updateData = {};
    if (file && file.buffer) {
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        updateData = {
          img: upload.variants?.[0] || upload.id || upload.filename || '',
        };
      } catch (err) {
        throw new InternalServerErrorException(
          `Cloudflare image upload failed: ${err}`,
        );
      }
    }
    const banner = await this.herobannerService.updateBottomBanner(
      id,
      updateData,
    );
    return { ...banner, id: banner.id?.toString?.() ?? String(banner.id) };
  }

  @Delete('bottom/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_HEROBANNER)
  async removeBottom(@Param('id') id: string) {
    return await this.herobannerService.removeBottomBanner(id);
  }

  // MiddleBanner Endpoints
  @Post('middle')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_HEROBANNER)
  @FileFieldsUpload(
    [{ name: 'img', maxCount: 10 }],
    undefined,
    UploadType.IMAGE,
  )
  async createMiddle(
    @Body() dto: CreateHerobannerDto,
    @CurrentUser() user: User,
    @UploadedFiles() files: { img?: Express.Multer.File[] },
  ) {
    if (!user || !user.id)
      throw new UnauthorizedException('Authentication required');
    if (files?.img?.length) {
      const file = files.img[0];
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        dto.img = upload.variants?.[0] || upload.id || upload.filename || '';
      } catch (err) {
        throw new InternalServerErrorException(
          `Cloudflare image upload failed: ${err}`,
        );
      }
    }
    return await this.herobannerService.createMiddleBanner(dto);
  }

  @Get('middle')
  async findAllMiddle() {
    const all = await this.herobannerService.findAllMiddleBanners();
    return all.map((b) => ({ ...b, id: b.id?.toString?.() ?? String(b.id) }));
  }

  @Get('middle/:id')
  async findOneMiddle(@Param('id') id: string) {
    const banner = await this.herobannerService.findOneMiddleBanner(id);
    return { ...banner, id: banner.id?.toString?.() ?? String(banner.id) };
  }

  @Patch('middle/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_HEROBANNER)
  @FileUpload('img', 1, { storage: memoryStorage() }, UploadType.IMAGE)
  async updateMiddle(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let updateData = {};
    if (file && file.buffer) {
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        updateData = {
          img: upload.variants?.[0] || upload.id || upload.filename || '',
        };
      } catch (err) {
        throw new InternalServerErrorException(
          `Cloudflare image upload failed: ${err}`,
        );
      }
    }
    const banner = await this.herobannerService.updateMiddleBanner(
      id,
      updateData,
    );
    return { ...banner, id: banner.id?.toString?.() ?? String(banner.id) };
  }

  @Delete('middle/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_HEROBANNER)
  async removeMiddle(@Param('id') id: string) {
    return await this.herobannerService.removeMiddleBanner(id);
  }
  constructor(
    private readonly herobannerService: HerobannerService,
    private readonly cloudflareService: CloudflareService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_HEROBANNER)
  @FileFieldsUpload(
    [{ name: 'img', maxCount: 10 }],
    undefined,
    UploadType.IMAGE,
  )
  async create(
    @Body() createHerobannerDto: CreateHerobannerDto,
    @CurrentUser() user: User,
    @UploadedFiles() files: { img?: Express.Multer.File[] },
  ) {
    if (!user || !user.id) {
      throw new UnauthorizedException(
        'Authentication required to create a course',
      );
    }
    if (files?.img?.length) {
      const file = files.img[0];
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        createHerobannerDto.img =
          upload.variants?.[0] || upload.id || upload.filename || '';
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new InternalServerErrorException(
          `Cloudflare image upload failed: ${message}`,
        );
      }
    }
    return await this.herobannerService.create(createHerobannerDto);
  }

  @Get()
  async findAll() {
    const all = await this.herobannerService.findAll();
    return all.map((banner) => ({
      ...banner,
      id: banner.id?.toString?.() ?? String(banner.id),
    }));
  }

  @Get('give')
  async findAllGive() {
    const all = await this.herobannerService.findAllGiveBanners();
    return all.map((b) => ({ ...b, id: b.id?.toString?.() ?? String(b.id) }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const banner = await this.herobannerService.findOne(id);
    return { ...banner, id: banner.id?.toString?.() ?? String(banner.id) };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_HEROBANNER)
  @FileUpload('img', 1, { storage: memoryStorage() }, UploadType.IMAGE)
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let updateData = {};
    if (file && file.buffer) {
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        updateData = {
          img: upload.variants?.[0] || upload.id || upload.filename || '',
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new InternalServerErrorException(
          `Cloudflare image upload failed: ${message}`,
        );
      }
    }
    const banner = await this.herobannerService.update(id, updateData);
    return { ...banner, id: banner.id?.toString?.() ?? String(banner.id) };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_HEROBANNER)
  async remove(@Param('id') id: string) {
    return await this.herobannerService.remove(id);
  }

  // GiveBanner Endpoints
  @Post('give')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_HEROBANNER)
  @FileFieldsUpload(
    [{ name: 'img', maxCount: 10 }],
    undefined,
    UploadType.IMAGE,
  )
  async createGive(
    @Body() dto: CreateHerobannerDto,
    @CurrentUser() user: User,
    @UploadedFiles() files: { img?: Express.Multer.File[] },
  ) {
    if (!user || !user.id)
      throw new UnauthorizedException('Authentication required');
    if (files?.img?.length) {
      const file = files.img[0];
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        dto.img = upload.variants?.[0] || upload.id || upload.filename || '';
      } catch (err) {
        throw new InternalServerErrorException(
          `Cloudflare image upload failed: ${err}`,
        );
      }
    }
    return await this.herobannerService.createGiveBanner(dto);
  }

  @Get('give/:id')
  async findOneGive(@Param('id') id: string) {
    const banner = await this.herobannerService.findOneGiveBanner(id);
    return { ...banner, id: banner.id?.toString?.() ?? String(banner.id) };
  }

  @Patch('give/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_HEROBANNER)
  @FileUpload('img', 1, { storage: memoryStorage() }, UploadType.IMAGE)
  async updateGive(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let updateData = {};
    if (file && file.buffer) {
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        updateData = {
          img: upload.variants?.[0] || upload.id || upload.filename || '',
        };
      } catch (err) {
        throw new InternalServerErrorException(
          `Cloudflare image upload failed: ${err}`,
        );
      }
    }
    const banner = await this.herobannerService.updateGiveBanner(
      id,
      updateData,
    );
    return { ...banner, id: banner.id?.toString?.() ?? String(banner.id) };
  }

  @Delete('give/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_HEROBANNER)
  async removeGive(@Param('id') id: string) {
    return await this.herobannerService.removeGiveBanner(id);
  }
}
