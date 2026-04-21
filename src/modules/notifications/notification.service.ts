 
import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationReadDto } from './dto/update-notification-read.dto';
import { Notification, NotificationType } from './entities/notification.entity';
import { UsersService } from '../users/users.service';
import { ProductService } from '../products/products.service';

@Injectable()
export class NotificationService {

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
  ) {}
  // Get only unread notifications for a all read=false
  async findUnreadNotifications() {
    return this.notificationRepository.find({
      where: { read: false },
      order: { createdAt: 'DESC' },
    });
  }

  // Update a notification as read (auto-update to true)
  async markNotificationAsRead(id: string) {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create(createNotificationDto);
    return this.notificationRepository.save(notification);
  }

  //PRODUCT_STOCK_OUT notification can be added similarly if needed
  async createStockOutNotification(productId?: string, userId?: string,) {
    return this.create({
      userId,
      isAdmin: true, // If no userId, treat as admin/global notification
      type: NotificationType.PRODUCT_STOCK_OUT as NotificationType,
      title: 'Product Stock Out',
      message: 'A product you are interested in is out of stock.',
      productId,
    });
  }
  // Mark notification as resolved
  async markAsResolved(id: string) {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.resolved = true;
    notification.status = 'resolved';
    return this.notificationRepository.save(notification);
  }

// get all notifications for a userid and/or productid (both optional)
async findAllByUserAndProduct(userId?: string, productId?: string) {
    const where: any = {};
    if (userId && userId !== 'null' && userId !== '') where.userId = userId;
    if (productId && productId !== 'null' && productId !== '') where.productId = productId;
    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }



  async findAllByUser(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll() {
    const notifications = await this.notificationRepository.find({
      order: { createdAt: 'DESC' },
    });
    // Collect unique userIds and productIds
    const userIds = Array.from(new Set(notifications.map(n => n.userId).filter(Boolean)));
    const productIds = Array.from(new Set(notifications.map(n => n.productId).filter(Boolean)));

    // Fetch users and products
    const users = userIds.length
      ? await Promise.all(
          userIds
            .filter((id): id is string => typeof id === 'string' && !!id)
            .map(id => this.usersService.findOne(id).catch(() => null))
        )
      : [];
    const products = productIds.length
      ? await Promise.all(
          productIds
            .filter((id): id is string => typeof id === 'string' && !!id)
            .map(id => this.productService.findById(id).catch(() => null))
        )
      : [];

    // Create lookup maps
    const userMap = new Map(users.filter(Boolean).map(u => [u!.id?.toString?.() ?? String(u!.id), u!.name]));
    const productMap = new Map(products.filter(Boolean).map(p => [p!.id?.toString?.() ?? String(p!.id), p!.name]));

    // Attach names to notifications
    return notifications.map(n => ({
      ...n,
      userName: n.userId ? userMap.get(n.userId) : undefined,
      productName: n.productId ? productMap.get(n.productId) : undefined,
    }));
  }


  async findUnreadByUser(userId: string) {
    return this.notificationRepository.find({
      where: { userId, read: false },
      order: { createdAt: 'DESC' },
    });
  }



  async markAsRead(id: string) {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.read = true;
    return this.notificationRepository.save(notification);
  }



  async remove(id: string) {
    await this.notificationRepository.delete({ id });
    return { success: true };
  }

  // Helper for order update notification
  async notifyOrderUpdate(userId: string, title: string, message: string, link?: string) {
    return this.create({
      userId,
      type: NotificationType.ORDER_UPDATE as NotificationType,
      title,
      message,
      link,
    });
  }

  // Helper for promotion notification
  async notifyPromotion(userId: string, title: string, message: string, link?: string) {
    return this.create({
      userId,
      type: NotificationType.PROMOTION as NotificationType,
      title,
      message,
      link,
    });
  }

  // Helper for giveaway notification
  async notifyGiveaway(userId: string, title: string, message: string, link?: string) {
    return this.create({
      userId,
      type: NotificationType.GIVEAWAY as NotificationType,
      title,
      message,
      link,
    });
  }

  // Helper for system notification
  async notifySystem(userId: string, title: string, message: string, link?: string) {
    return this.create({
      userId,
      type: NotificationType.SYSTEM as NotificationType,
      title,
      message,
      link,
    });
  }


  

   // For notification bell: get latest 10 notifications for user (or all if admin)
  /**
   * Get latest 10 notifications for user (by userId or email) or all if admin
   */
  async getHeaderNotifications(userIdentifier?: string, isAdmin?: boolean) {
    const where: any = {};
    if (isAdmin) {
      where.isAdmin = true;
    } else if (userIdentifier) {
      // userIdentifier can be userId or email
      where.userId = userIdentifier;
    }
    const notifications = await this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 10,
    });
    // Only return fields needed for bell
    return notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt,
      type: n.type,
    }));
  }
}
