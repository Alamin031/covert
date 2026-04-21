import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorporateDeal } from './entities/corporate-deal.entity';
import { CreateCorporateDealDto } from './dto/corporate-deal.dto';
import {
  Notification,
  NotificationType,
} from '../notifications/entities/notification.entity';

@Injectable()
export class CorporateDealService {
  constructor(
    @InjectRepository(CorporateDeal)
    private readonly corporateDealRepository: Repository<CorporateDeal>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAll(): Promise<CorporateDeal[]> {
    return this.corporateDealRepository.find();
  }

  async findOne(id: string): Promise<CorporateDeal> {
    const deal = await this.corporateDealRepository.findOneBy({
      id,
    });
    if (!deal) throw new NotFoundException('Corporate deal not found');
    return deal;
  }

  async create(dto: CreateCorporateDealDto): Promise<CorporateDeal> {
    const deal = this.corporateDealRepository.create({
      ...dto,
      createdAt: new Date(),
      status: 'new',
    });
    const savedDeal = await this.corporateDealRepository.save(deal);

    // Create notification for new corporate deal
    const notification = this.notificationRepository.create({
      type: NotificationType.SYSTEM,
      title: 'New Corporate Deal',
      message: `A new corporate deal has been submitted by ${savedDeal.fullName} (${savedDeal.companyName}).`,
      resolved: false,
      read: false,
      isAdmin: true,
      link: '/admin/corporate',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.notificationRepository.save(notification);

    return savedDeal;
  }

  async remove(id: string): Promise<void> {
    await this.corporateDealRepository.delete({ id });
  }
}
