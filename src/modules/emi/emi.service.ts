import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Emi } from './entities/emi.entity';
import { Bank } from './entities/bank.entity';

@Injectable()
export class EmiService {
  constructor(
    @InjectRepository(Emi)
    private readonly emiRepository: Repository<Emi>,
    @InjectRepository(Bank)
    private readonly bankRepository: Repository<Bank>,
  ) {}

  async createEmi(dto: any) {
    const emi = this.emiRepository.create(dto);
    return this.emiRepository.save(emi);
  }

  async updateEmi(id: string, dto: any) {
    await this.emiRepository.update({ id }, dto);
    return this.emiRepository.findOne({ where: { id } });
  }

  async getAllEmis() {
    const emis = await this.emiRepository.find();
    const result: any[] = [];
    for (const emi of emis) {
      let bankName: string = '';
      if (emi.bankId) {
        const bank = await this.bankRepository.findOne({ where: { id: emi.bankId } });
        bankName = bank?.bankname || '';
      }
      result.push({
        ...emi,
        bankName,
      });
    }
    return result;
  }

  async getEmi(id: string) {
    const emi = await this.emiRepository.findOne({ where: { id } });
    let bankName: string = '';
    if (emi?.bankId) {
      const bank = await this.bankRepository.findOne({ where: { id: emi.bankId } });
      bankName = bank?.bankname || '';
    }
    return {
      ...emi,
      bankName,
    };
  }

  async removeEmi(id: string) {
    await this.emiRepository.delete({ id });
    return { success: true };
  }

  async getAllBanks() {
    return this.bankRepository.find();
  }

  async getBank(id: string) {
    return this.bankRepository.findOne({ where: { id } });
  }

  async createBank(dto: any) {
    if (!dto.bankname || typeof dto.bankname !== 'string' || !dto.bankname.trim()) {
      throw new BadRequestException('Bank name (bankname) is required and must be a non-empty string.');
    }
    const bank = this.bankRepository.create(dto);
    return this.bankRepository.save(bank);
  }

  async updateBank(id: string, dto: any) {
    await this.bankRepository.update({ id }, dto);
    return this.bankRepository.findOne({ where: { id } });
  }

  async removeBank(id: string) {
    await this.bankRepository.delete({ id });
    return { success: true };
  }
}
