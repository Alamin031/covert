import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryMethod } from './entities/delivery-method.entity';
import { CreateDeliveryMethodDto, UpdateDeliveryMethodDto } from './dto/delivery-method.dto';

@Injectable()
export class DeliveryMethodService {
  constructor(
    @InjectRepository(DeliveryMethod)
    private readonly deliveryMethodRepository: Repository<DeliveryMethod>,
  ) {}

  async findAll(): Promise<DeliveryMethod[]> {
    return this.deliveryMethodRepository.find();
  }

  async findOne(id: string): Promise<DeliveryMethod> {
    const method = await this.deliveryMethodRepository.findOneBy({ id });
    if (!method) throw new NotFoundException('Delivery method not found');
    return method;
  }

  async create(dto: CreateDeliveryMethodDto): Promise<DeliveryMethod> {
    const method = this.deliveryMethodRepository.create(dto);
    return this.deliveryMethodRepository.save(method);
  }

  async update(id: string, dto: UpdateDeliveryMethodDto): Promise<DeliveryMethod> {
    await this.deliveryMethodRepository.update({ id }, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.deliveryMethodRepository.delete({ id });
  }
}
