import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HeroBanner } from './entities/herobanner.entity';
import { BottomBanner } from './entities/botombanner.entity';
import { MiddleBanner } from './entities/middelbanner.entity';
import { GiveBanner } from './entities/givebanner.entity';

type BannerEntity = { id: string; img: string };

@Injectable()
export class HerobannerService {
  constructor(
    @InjectRepository(HeroBanner)
    private readonly heroBannerRepository: Repository<HeroBanner>,
    @InjectRepository(BottomBanner)
    private readonly bottomBannerRepository: Repository<BottomBanner>,
    @InjectRepository(MiddleBanner)
    private readonly middleBannerRepository: Repository<MiddleBanner>,
    @InjectRepository(GiveBanner)
    private readonly giveBannerRepository: Repository<GiveBanner>,
  ) {}

  private serialize<T extends BannerEntity>(banner: T) {
    return { ...banner, id: String(banner.id) };
  }

  private async findRequired<T extends BannerEntity>(
    repository: Repository<T>,
    id: string,
    label: string,
  ) {
    const banner = await repository.findOne({ where: { id } as any });
    if (!banner) throw new NotFoundException(`${label} not found`);
    return banner;
  }

  async createBottomBanner(data: { img: string }) {
    const saved = await this.bottomBannerRepository.save(
      this.bottomBannerRepository.create(data),
    );
    return this.serialize(saved);
  }

  async findAllBottomBanners() {
    const all = await this.bottomBannerRepository.find();
    return all.map((bb) => this.serialize(bb));
  }

  async findOneBottomBanner(id: string) {
    return this.serialize(
      await this.findRequired(this.bottomBannerRepository, id, 'BottomBanner'),
    );
  }

  async updateBottomBanner(id: string, data: { img?: string }) {
    const bottomBanner = await this.findRequired(
      this.bottomBannerRepository,
      id,
      'BottomBanner',
    );
    Object.assign(bottomBanner, data);
    return this.serialize(await this.bottomBannerRepository.save(bottomBanner));
  }

  async removeBottomBanner(id: string) {
    await this.bottomBannerRepository.delete({ id });
    return { success: true };
  }

  async createMiddleBanner(data: { img: string }) {
    const saved = await this.middleBannerRepository.save(
      this.middleBannerRepository.create(data),
    );
    return this.serialize(saved);
  }

  async findAllMiddleBanners() {
    const all = await this.middleBannerRepository.find();
    return all.map((mb) => this.serialize(mb));
  }

  async findOneMiddleBanner(id: string) {
    return this.serialize(
      await this.findRequired(this.middleBannerRepository, id, 'MiddleBanner'),
    );
  }

  async updateMiddleBanner(id: string, data: { img?: string }) {
    const middleBanner = await this.findRequired(
      this.middleBannerRepository,
      id,
      'MiddleBanner',
    );
    Object.assign(middleBanner, data);
    return this.serialize(await this.middleBannerRepository.save(middleBanner));
  }

  async removeMiddleBanner(id: string) {
    await this.middleBannerRepository.delete({ id });
    return { success: true };
  }

  async create(data: { img: string }) {
    const saved = await this.heroBannerRepository.save(
      this.heroBannerRepository.create(data),
    );
    return this.serialize(saved);
  }

  async findAll() {
    const all = await this.heroBannerRepository.find();
    return all.map((hb) => this.serialize(hb));
  }

  async findOne(id: string) {
    return this.serialize(
      await this.findRequired(this.heroBannerRepository, id, 'HeroBanner'),
    );
  }

  async update(id: string, data: { img?: string }) {
    const heroBanner = await this.findRequired(
      this.heroBannerRepository,
      id,
      'HeroBanner',
    );
    Object.assign(heroBanner, data);
    return this.serialize(await this.heroBannerRepository.save(heroBanner));
  }

  async remove(id: string) {
    await this.heroBannerRepository.delete({ id });
    return { success: true };
  }

  async createGiveBanner(data: { img: string }) {
    const saved = await this.giveBannerRepository.save(
      this.giveBannerRepository.create(data),
    );
    return this.serialize(saved);
  }

  async findAllGiveBanners() {
    const all = await this.giveBannerRepository.find();
    return all.map((gb) => this.serialize(gb));
  }

  async findOneGiveBanner(id: string) {
    return this.serialize(
      await this.findRequired(this.giveBannerRepository, id, 'GiveBanner'),
    );
  }

  async updateGiveBanner(id: string, data: { img?: string }) {
    const giveBanner = await this.findRequired(
      this.giveBannerRepository,
      id,
      'GiveBanner',
    );
    Object.assign(giveBanner, data);
    return this.serialize(await this.giveBannerRepository.save(giveBanner));
  }

  async removeGiveBanner(id: string) {
    await this.giveBannerRepository.delete({ id });
    return { success: true };
  }
}
