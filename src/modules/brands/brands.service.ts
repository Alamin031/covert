import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { Brand } from './entities/brand.entity';
import { ProductService } from '../products/products.service';
import { isUuid } from '../../common/utils/id.util';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly productService: ProductService,
  ) {}

  async create(dto: CreateBrandDto) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-');

    // Check if brand with same name OR slug already exists
    const exists = await this.brandRepository.findOne({
      where: [{ name: dto.name }, { slug }],
    });

    if (exists) {
      throw new BadRequestException(
        'This brand is already added. Please use another name.',
      );
    }

    const brand = this.brandRepository.create({ ...dto, slug });
    return this.brandRepository.save(brand);
  }

  async findAll() {
    const brands = await this.brandRepository.find({ order: { name: 'ASC' } });
    return brands.map((brand) => ({
      id: brand.id?.toString?.() ?? String(brand.id),
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      indexNumber: brand.indexNumber,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    }));
  }

  async findOne(idOrSlug: string) {
    const brand = isUuid(idOrSlug)
      ? await this.brandRepository.findOne({ where: { id: idOrSlug } })
      : await this.brandRepository.findOne({ where: { slug: idOrSlug } });
    if (!brand) throw new NotFoundException('Brand not found');
    return {
      id: brand.id?.toString?.() ?? String(brand.id),
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      indexNumber: brand.indexNumber,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };
  }

  // To implement findProducts, use ProductService to fetch products by brandId
  async findProducts(slug: string) {
    const brand = await this.brandRepository.findOne({ where: { slug } });
    if (!brand) throw new NotFoundException('Brand not found');
    const products = await this.productService.findByBrandIds([
      brand.id?.toString?.() ?? String(brand.id),
    ]);
    return products || [];
  }

  async update(id: string, dto: UpdateBrandDto) {
    const data: UpdateBrandDto & { slug?: string } = { ...dto };
    if (dto.name) {
      data.slug = dto.name.toLowerCase().replace(/\s+/g, '-');
    }
    await this.brandRepository.update({ id }, data);
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');
    return {
      id: brand.id?.toString?.() ?? String(brand.id),
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      indexNumber: brand.indexNumber,

      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };
  }

  async remove(id: string) {
    await this.brandRepository.delete({ id });
    return { success: true };
  }

  async getFeatured() {
    const brands = await this.brandRepository.find({
      take: 12,
      order: { name: 'ASC' },
    });
    return brands.map((brand) => ({
      id: brand.id?.toString?.() ?? String(brand.id),
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      indexNumber: brand.indexNumber,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    }));
  }
}
