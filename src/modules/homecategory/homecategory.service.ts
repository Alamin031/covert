import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeCategory } from './entities/homecategory.entity';
import { ProductService } from '../products/products.service';

@Injectable()
export class HomecategoryService {
  constructor(
    @InjectRepository(HomeCategory)
    private readonly homeCategoryRepository: Repository<HomeCategory>,
    private readonly productService: ProductService,
  ) { }

  // Create a new HomeCategory
  async create(data: {
    name: string;
    priority?: number;
    categoryIds?: string[];
    productIds?: string[];
  }) {
    const homeCategory = this.homeCategoryRepository.create({
      name: data.name,
      priority: data.priority,
      categoryIds: data.categoryIds || [],
      productIds: data.productIds || [],
    });
    const saved = await this.homeCategoryRepository.save(homeCategory);
    return { ...saved, id: String(saved.id) };
  }


  // Get all HomeCategories (relations are manual, so just return the entity)
  async findAll() {
    const all = await this.homeCategoryRepository.find({ order: { priority: 'ASC' } });
    return Promise.all(
      all.map(async hc => {
        let products: any[] = [];
        if (hc.productIds && hc.productIds.length > 0) {
          products = await this.productService.findByIds(hc.productIds);
        }
        return { ...hc, id: String(hc.id), products };
      })
    );
  }


  // Get a single HomeCategory by ID
  async findOne(id: string) {
    const homeCategory = await this.homeCategoryRepository.findOne({ where: { id } });
    if (!homeCategory) throw new NotFoundException('HomeCategory not found');
    return { ...homeCategory, id: String(homeCategory.id) };
  }


  // Update a HomeCategory
  async update(id: string, data: {
    name?: string;
    priority?: number;
    categoryIds?: string[];
    productIds?: string[];
  }) {
    const homeCategory = await this.homeCategoryRepository.findOne({ where: { id } });
    if (!homeCategory) throw new NotFoundException('HomeCategory not found');
    if (data.name !== undefined) homeCategory.name = data.name;
    if (data.priority !== undefined) homeCategory.priority = data.priority;
    if (data.categoryIds !== undefined) homeCategory.categoryIds = data.categoryIds;
    if (data.productIds !== undefined) homeCategory.productIds = data.productIds;
    const saved = await this.homeCategoryRepository.save(homeCategory);
    return { ...saved, id: String(saved.id) };
  }


  // Assign products to a HomeCategory (update productIds array)
  async assignProducts(homeCategoryId: string, productIds: string[]) {
    const homeCategory = await this.homeCategoryRepository.findOne({ where: { id: homeCategoryId } });
    if (!homeCategory) throw new NotFoundException('HomeCategory not found');
    homeCategory.productIds = productIds;
    const saved = await this.homeCategoryRepository.save(homeCategory);
    return { ...saved, id: String(saved.id) };
  }


  // Delete a HomeCategory
  async remove(id: string) {
    const homeCategory = await this.homeCategoryRepository.findOne({ where: { id } });
    if (!homeCategory) throw new NotFoundException('HomeCategory not found');
    await this.homeCategoryRepository.delete({ id });
    return { message: 'HomeCategory deleted successfully' };
  }

}
