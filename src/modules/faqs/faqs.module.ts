import { Module } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { FaqsController } from './faqs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FAQ } from './entities/faq.entity';
import { Product } from '../products/entities/product-new.entity';
import { Category } from '../categories/entities/category.entity';
@Module({
  imports: [TypeOrmModule.forFeature([FAQ, Product, Category])],
  controllers: [FaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule { }
