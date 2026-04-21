
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) { }


  async create(userId: string, dto: CreateReviewDto) {
    const review = this.reviewRepository.create({
      userId,
      productId: dto.productId,
      rating: dto.rating,
      comment: dto.comment,
    });
    const saved = await this.reviewRepository.save(review);
    // await this.updateProductRating(dto.productId); // Product rating update logic should be handled in ProductService
    return saved;
  }


  async findByProduct(productId: string) {
    return this.reviewRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }


  async remove(id: string) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviewRepository.delete({ id });
    // await this.updateProductRating(review.productId); // Product rating update logic should be handled in ProductService
    return { success: true };
  }

  // Product rating update logic should be handled in ProductService if needed
}
