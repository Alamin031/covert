import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/role.entity';
import { Wishlist } from './entities/wishlist.entity';
import { Compare } from './entities/compare.entity';
import { Order } from '../orders/entities/order.entity';
import { CloudflareService } from 'src/config/cloudflare-video.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Wishlist, Compare, Order, Role])],
  providers: [UsersService, CloudflareService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }
