
import { Controller, Get, Post, Patch, Delete, Param, Body, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationReadDto } from './dto/update-notification-read.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';

@Controller('notifications')

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  // GET /notifications/header?userId=xxx&isAdmin=true - Get latest 10 notifications for bell (user or admin)
  @Get('header')
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'isAdmin', required: false, type: Boolean })
  async getHeaderNotifications(
    @Query('userId') userId?: string,
    @Query('isAdmin') isAdmin?: string,
  ) {
    // Convert isAdmin to boolean (query params are strings)
    const isAdminBool = isAdmin === 'true';
    console.log('Controller getHeaderNotifications', { userId, isAdmin, isAdminBool });
    const notifications = await this.notificationService.getHeaderNotifications(userId, isAdminBool);
    return notifications.map(n => ({
      ...n,
      id: n.id?.toString?.() ?? String(n.id),
    }));
  }

  // GET /notifications/by?userId=xxx&productId=yyy - Fetch notifications by userId and/or productId (both optional)
  @Get('by')
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: String })
  async getAllByUserAndProduct(
    @Query('userId') userId?: string,
    @Query('productId') productId?: string,
  ) {
    const notifications = await this.notificationService.findAllByUserAndProduct(userId, productId);
    return notifications.map(n => ({
      ...n,
      id: n.id?.toString?.() ?? String(n.id),
    }));
  }

    // Get only unread notifications for a all read=false
    @Get('unread')
    async getUnreadNotifications() {
      const notifications = await this.notificationService.findUnreadNotifications();
      return notifications.map(n => ({
        ...n,
        id: n.id?.toString?.() ?? String(n.id),
      }));
    }

      // Update a notification as read (auto-update to true)
  @Patch(':id/read')
  async markNotificationAsRead(@Param('id') id: string) {
    const notification = await this.notificationService.markNotificationAsRead(id);
    return {
      ...notification,
      id: notification.id?.toString?.() ?? String(notification.id),
    };
  }
    // GET /notifications - Fetch all notifications (no filter)
  @Get()
  async getAllNotifications() {
    const notifications = await this.notificationService.findAll();
    return notifications.map(n => ({
      ...n,
      id: n.id?.toString?.() ?? String(n.id),
    }));
  }
  // PATCH /notifications/:id/resolve - Mark notification as resolved
  @Patch(':id/resolve')
  async markAsResolved(@Param('id') id: string) {
    const notification = await this.notificationService.markAsResolved(id);
    return {
      ...notification,
      id: notification.id?.toString?.() ?? String(notification.id),
    };
  }
  // GET /notifications/:userId - Fetch all notifications for a user
  @Get(':userId')
  async getAll(@Param('userId') userId: string) {
    const notifications = await this.notificationService.findAllByUser(userId);
    return notifications.map(n => ({
      ...n,
      id: n.id?.toString?.() ?? String(n.id),
    }));
  }

  // GET /notifications/:userId/unread - Fetch unread notifications
  @Get(':userId/unread')
  async getUnread(@Param('userId') userId: string) {
    const notifications = await this.notificationService.findUnreadByUser(userId);
    return notifications.map(n => ({
      ...n,
      id: n.id?.toString?.() ?? String(n.id),
    }));
  }

  // POST /notifications - Create new notification (admin or system)
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_NOTIFICATION)
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    const notification = await this.notificationService.create(createNotificationDto);
    return {
      ...notification,
      id: notification.id?.toString?.() ?? String(notification.id),
    };
  }


  // PATCH /notifications/:id/read - Mark notification as read
  @Patch(':id/read')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MARK_NOTIFICATION_READ)
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationService.markAsRead(id);
    return {
      ...notification,
      id: notification.id?.toString?.() ?? String(notification.id),
    };
  }

  // POST /notifications/stock-out - Create stock out notification (productId in body, user from @CurrentUser)
  @Post('stock-out')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_NOTIFICATION)
  async createStockOutNotification(
    @Body() body: { productId?: string },
    @CurrentUser() user: User,
  ) {
    const productId = body.productId;
    const userId = user?.id?.toString?.();
    const notification = await this.notificationService.createStockOutNotification(productId, userId);
    return {
      ...notification,
      id: notification.id?.toString?.() ?? String(notification.id),
    };
  }

  // DELETE /notifications/:id - Delete notification
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_NOTIFICATION)
  async remove(@Param('id') id: string) {
    return this.notificationService.remove(id);
  }

}
