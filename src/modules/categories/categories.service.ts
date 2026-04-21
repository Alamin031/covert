import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryFilterDto,
} from './dto/category.dto';
import { Category } from './entities/category.entity';
import { Subcategory } from './entities/subcategory.entity';
import { Product } from '../products/entities/product-new.entity';

@Injectable()
export class CategoriesService {

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getById(id: string): Promise<Category | null> {
    return this.categoryRepository.findOne({ where: { id } });
  }
  // SUBCATEGORY METHODS
  async createSubcategory(dto: any) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-');
    const subcategory = this.subcategoryRepository.create({ ...dto, slug });
    return this.subcategoryRepository.save(subcategory);
  }

  async updateSubcategory(id: string, dto: any) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.name) {
      data.slug = dto.name.toLowerCase().replace(/\s+/g, '-');
    }
    await this.subcategoryRepository.update({ id }, data);
    return this.subcategoryRepository.findOne({ where: { id } });
  }

  async getSubcategoriesByCategory(categoryId: string) {
    return this.subcategoryRepository.find({ where: { categoryId } });
  }

  async getSubcategory(id: string) {
    return this.subcategoryRepository.findOne({ where: { id } });
  }


  async create(dto: CreateCategoryDto) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-');
    const category = this.categoryRepository.create({ ...dto, slug });
    return this.categoryRepository.save(category);
  }


  async findAll(options?: { relations?: string[] }) {
    return this.categoryRepository.find({
      order: { priority: 'ASC' },
      ...(options?.relations ? { relations: options.relations } : {}),
    });
  }


  async findOne(slug: string, options?: { relations?: string[] }) {
    const category = await this.categoryRepository.findOne({
      where: { slug },
      ...(options?.relations ? { relations: options.relations } : {}),
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }


  // To implement findProducts, use ProductRepository in controller/service if needed
  async findProducts(slug: string, filters?: CategoryFilterDto) {
    const category = await this.categoryRepository.findOne({ where: { slug } });
    if (!category) throw new NotFoundException('Category not found');
    const query: any[] = [
      { categoryId: category.id },
      { categoryIds: ArrayContains([category.id]) },
    ];
    const where = filters ? query.map((condition) => ({ ...condition, ...filters })) : query;
    return this.productRepository.find({ where });
  }



  async update(id: string, dto: UpdateCategoryDto) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.name) {
      data.slug = dto.name.toLowerCase().replace(/\s+/g, '-');
    }
    await this.categoryRepository.update({ id }, data);
    return this.categoryRepository.findOne({ where: { id } });
  }



  async remove(id: string) {
    await this.categoryRepository.delete({ id });
    return { success: true };
  }


  async getFeatured() {
    return this.categoryRepository.find({
      where: { priority: 10 },
      order: { priority: 'ASC' },
      take: 6,
    });
  }

  async findByBrandId(brandsId: string) {
    return this.categoryRepository.find({ where: { brandsId } });
  }
}
