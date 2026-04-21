import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyPage } from './entities/policy.entity';
import { CreatePolicyDto, UpdatePolicyDto } from './dto/policy.dto';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(PolicyPage)
    private readonly policyRepo: Repository<PolicyPage>,
  ) {}
  async create(dto: CreatePolicyDto) {
    const existing = await this.policyRepo.findOne({
      where: { type: dto.type },
    });
    if (existing) {
      throw new ConflictException(`Policy of type ${dto.type} already exists.`);
    }
    const policy = this.policyRepo.create(dto);
    return this.policyRepo.save(policy);
  }

  async findAll() {
    return this.policyRepo.find({ order: { orderIndex: 'ASC' } });
  }
  async findOne(id: string) {
    const policy = await this.policyRepo.findOne({
      where: { id },
    });
    if (!policy) throw new NotFoundException('Policy not found');
    return policy;
  }

  async findOneBySlug(slug: string) {
    const policy = await this.policyRepo.findOne({
      where: { slug },
    });
    if (!policy) throw new NotFoundException('Policy not found');
    return policy;
  }

  async update(id: string, dto: UpdatePolicyDto) {
    const policy = await this.policyRepo.findOne({
      where: { id },
    });
    if (!policy) throw new NotFoundException('Policy not found');
    Object.assign(policy, dto);
    return this.policyRepo.save(policy);
  }

  async remove(id: string) {
    const policy = await this.policyRepo.findOne({
      where: { id },
    });
    if (!policy) throw new NotFoundException('Policy not found');
    await this.policyRepo.delete({ id });
    return { message: 'Policy deleted successfully' };
  }
}
