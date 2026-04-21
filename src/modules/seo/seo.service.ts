import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Product } from '../products/entities/product-new.entity';

@Injectable()
export class SeoService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
  ) { }

  async getProductSeo(id: string) {
    const product = await this.productRepo.findOne({
      where: { id },
      select: ['seoTitle', 'seoDescription', 'seoKeywords', 'slug'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getCategorySeo(id: string) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      select: ['name', 'description', 'slug'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async getBrandSeo(id: string) {
    const brand = await this.brandRepo.findOne({
      where: { id },
      select: ['name', 'slug'],
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async generateSitemap() {
    const [products, categories, brands] = await Promise.all([
      this.productRepo.find({ select: ['slug', 'updatedAt'] }),
      this.categoryRepo.find({ select: ['slug', 'updatedAt'] }),
      this.brandRepo.find({ select: ['slug', 'updatedAt'] }),
    ]);

    return {
      products: products.map((p) => ({
        url: `/products/${p.slug}`,
        lastMod: p.updatedAt,
      })),
      categories: categories.map((c) => ({
        url: `/categories/${c.slug}`,
        lastMod: c.updatedAt,
      })),
      brands: brands.map((b) => ({
        url: `/brands/${b.slug}`,
        lastMod: b.updatedAt,
      })),
    };
  }
}
