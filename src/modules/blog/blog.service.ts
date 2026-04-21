import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';
import { Blog } from './entities/blog.entity';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) {}

  async findAll(page = 1, limit = 10, search?: string, category?: string) {
    const where: any = {};
    if (search) {
      where.title = Like(`%${search}%`);
    }
    if (category) {
      where.category = category;
    }
    const [data, total] = await this.blogRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { publishedAt: 'DESC' },
    });
    return { data, total, page, limit };
  }
  async findOneById(id: string) {
    return this.blogRepository.findOne({ where: { id } });
  }

  async findOneBySlug(slug: string) {
    return this.blogRepository.findOne({ where: { slug } });
  }

  async create(blogData: Partial<Blog>) {
    const blog = this.blogRepository.create(blogData);
    return this.blogRepository.save(blog);
  }

  async update(id: string, blogData: Partial<Blog>) {
    await this.blogRepository.update({ id }, blogData);
    return this.blogRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    return this.blogRepository.delete({ id });
  }
}
