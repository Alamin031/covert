
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { FAQ } from './entities/faq.entity';
import { Product } from '../products/entities/product-new.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class FaqsService {

  constructor(
    @InjectRepository(FAQ)
    private readonly faqRepository: Repository<FAQ>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }


  async create(dto: CreateFaqDto) {
    const faq = this.faqRepository.create(dto);
    const savedFaq = await this.faqRepository.save(faq);

    // If productIds are provided, update those products' faqIds
    if (dto.productIds && Array.isArray(dto.productIds)) {
      await Promise.all(
        dto.productIds.map(async (productId) => {
          const product = await this.productRepository.findOne({ where: { id: productId } });
          if (product) {
            if (!product.faqIds) product.faqIds = [];
            if (!product.faqIds.includes(savedFaq.id)) {
              product.faqIds.push(savedFaq.id);
              await this.productRepository.save(product);
            }
          }
        })
      );
    }
    // If categoryIds are provided, update those categories' faqIds
    if (dto.categoryIds && Array.isArray(dto.categoryIds)) {
      await Promise.all(
        dto.categoryIds.map(async (categoryId) => {
          const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
          if (category) {
            if (!category.faqIds) category.faqIds = [];
            if (!category.faqIds.includes(savedFaq.id)) {
              category.faqIds.push(savedFaq.id);
              await this.categoryRepository.save(category);
            }
          }
        })
      );
    }
    return savedFaq;
  }


  async findAll() {
    return this.faqRepository.find({
      order: {
        orderIndex: 'ASC',
        createdAt: 'DESC',
      },
    });
  }


  async findByProduct(productId: string) {
    return this.faqRepository.find({
      where: { productIds: ArrayContains([productId]) },
      order: { createdAt: 'DESC' },
    });
  }



  async findOne(id: string) {
    const faq = await this.faqRepository.findOne({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ not found');
    return faq;
  }



  async update(id: string, dto: UpdateFaqDto) {
    await this.faqRepository.update({ id }, dto);
    const updatedFaq = await this.faqRepository.findOne({ where: { id } });

    // Sync productIds if provided
    if (dto.productIds && Array.isArray(dto.productIds)) {
      // Remove this FAQ from all products' faqIds first
      const allProducts = await this.productRepository.find();
      await Promise.all(
        allProducts.map(async (product) => {
          if (product.faqIds?.includes(id)) {
            product.faqIds = product.faqIds.filter((fid) => fid !== id);
            await this.productRepository.save(product);
          }
        })
      );
      // Add this FAQ to selected products' faqIds
      await Promise.all(
        dto.productIds.map(async (productId) => {
          const product = await this.productRepository.findOne({ where: { id: productId } });
          if (product) {
            if (!product.faqIds) product.faqIds = [];
            if (!product.faqIds.includes(id)) {
              product.faqIds.push(id);
              await this.productRepository.save(product);
            }
          }
        })
      );
    }

    // Sync categoryIds if provided
    if (dto.categoryIds && Array.isArray(dto.categoryIds)) {
      const allCategories = await this.categoryRepository.find();
      await Promise.all(
        allCategories.map(async (category) => {
          if (category.faqIds?.includes(id)) {
            category.faqIds = category.faqIds.filter(fid => fid !== id);
            await this.categoryRepository.save(category);
          }
        })
      );
      // Add this FAQ to selected categories' faqIds
      await Promise.all(
        dto.categoryIds.map(async (categoryId) => {
          const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
          if (category) {
            if (!category.faqIds) category.faqIds = [];
            if (!category.faqIds.includes(id)) {
              category.faqIds.push(id);
              await this.categoryRepository.save(category);
            }
          }
        })
      );
    }

    return updatedFaq;
  }



  async remove(id: string) {
    await this.faqRepository.delete({ id });
    return { success: true };
  }
}
