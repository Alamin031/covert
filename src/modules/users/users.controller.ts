import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  UploadedFiles,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CloudflareService } from 'src/config/cloudflare-video.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import {
  FileFieldsUpload,
  UploadType,
} from 'src/common/decorators/file-upload.decorator';
import { isUuid } from '../../common/utils/id.util';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudflareService: CloudflareService,
  ) {}

  // =======================
  // UTIL
  // =======================
  private validateUuid(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid ID');
    }
  }

  private mapUser(user: any) {
    return {
      ...user,
      id: user.id?.toString?.() ?? String(user.id),
      roles: user.role ? [String(user.role)] : [],
    };
  }

  // =======================
  // CREATE
  // =======================
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(dto);
    return this.mapUser(user);
  }

  // =======================
  // CURRENT USER
  // =======================
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: User) {
    const foundUser = await this.usersService.findOne(user.id.toString());
    return this.mapUser(foundUser);
  }
  @Get('reward-points')
  @UseGuards(JwtAuthGuard)
  async getMyRewardPoints(@CurrentUser() user: User) {
    return this.usersService.getMyRewardPoints(user.id.toString());
  }

  // =======================
  // GET ALL
  // =======================
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => this.mapUser(user));
  }

  // =======================
  // GET ONE
  // =======================
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    this.validateUuid(id);
    const user = await this.usersService.findOne(id);
    return this.mapUser(user);
  }

  // =======================
  // UPDATE
  // =======================
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @FileFieldsUpload(
    [{ name: 'image', maxCount: 1 }],
    undefined,
    UploadType.IMAGE,
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
  ) {
    this.validateUuid(id);

    const maybeRole = (dto as { role?: unknown }).role;
    if (typeof maybeRole === 'string') {
      return this.usersService.updateRole(id, maybeRole);
    }

    if (files?.image?.length) {
      const file = files.image[0];
      try {
        const upload = await this.cloudflareService.uploadImage(
          file.buffer,
          file.originalname,
        );
        dto.image = upload.variants?.[0] || upload.id || upload.filename || '';
      } catch (err) {
        throw new Error(`Cloudflare image upload failed: ${err}`);
      }
    }

    const updated = await this.usersService.update(id, dto);
    return this.mapUser(updated);
  }

  // =======================
  // DELETE
  // =======================
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    this.validateUuid(id);
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  // =======================
  // WISHLIST (USER ONLY)
  // =======================
  @Get('wishlist')
  @UseGuards(JwtAuthGuard)
  async getWishlist(@CurrentUser() user: User) {
    return this.usersService.getWishlist(user.id.toString());
  }

  @Post('wishlist')
  @UseGuards(JwtAuthGuard)
  async addToWishlist(
    @CurrentUser() user: User,
    @Body('productId') productId: string,
  ) {
    return this.usersService.addToWishlist(user.id.toString(), productId);
  }

  @Delete('wishlist/:productId')
  @UseGuards(JwtAuthGuard)
  async removeFromWishlist(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ) {
    return this.usersService.removeFromWishlist(user.id.toString(), productId);
  }

  // =======================
  // COMPARE (USER ONLY)
  // =======================
  @Get('compare')
  @UseGuards(JwtAuthGuard)
  async getCompare(@CurrentUser() user: User) {
    return this.usersService.getCompare(user.id.toString());
  }

  @Post('compare')
  @UseGuards(JwtAuthGuard)
  async addToCompare(
    @CurrentUser() user: User,
    @Body('productId') productId: string,
  ) {
    return this.usersService.addToCompare(user.id.toString(), productId);
  }

  @Delete('compare/:productId')
  @UseGuards(JwtAuthGuard)
  async removeFromCompare(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ) {
    return this.usersService.removeFromCompare(user.id.toString(), productId);
  }

  // =======================
  // ORDERS (USER ONLY)
  // =======================
  @Get('orders')
  @UseGuards(JwtAuthGuard)
  async getOrders(@CurrentUser() user: User) {
    return this.usersService.getOrders(user.id.toString());
  }
}
