import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';

@ApiTags('faqs')
@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_FAQ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create FAQ (Admin/Management)' })
  async create(@Body() dto: CreateFaqDto) {
    const faq = await this.faqsService.create(dto);
    return {
      ...faq,
      id: faq.id?.toString?.() ?? String(faq.id),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all global FAQs' })
  async findAll(@Query('productId') productId?: string) {
    let faqs;
    if (productId) {
      faqs = await this.faqsService.findByProduct(productId);
    } else {
      faqs = await this.faqsService.findAll();
    }
    return faqs.map(faq => ({
      ...faq,
      id: faq.id?.toString?.() ?? String(faq.id),
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get FAQ by ID' })
  async findOne(@Param('id') id: string) {
    const faq = await this.faqsService.findOne(id);
    return {
      ...faq,
      id: faq.id?.toString?.() ?? String(faq.id),
    };
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_FAQ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update FAQ (Admin/Management)' })
  async update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    const faq = await this.faqsService.update(id, dto);
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }
    return {
      ...faq,
      id: faq.id?.toString?.() ?? String(faq.id),
    };
  }
  

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_FAQ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete FAQ (Admin only)' })
  remove(@Param('id') id: string) {
    return this.faqsService.remove(id);
  }

   @Get('product/:productId')
  @ApiOperation({ summary: 'Get all FAQs for a specific product' })
  async findByProduct(@Param('productId') productId: string) {
    const faqs = await this.faqsService.findByProduct(productId);
    return faqs.map(faq => ({
      ...faq,
      id: faq.id?.toString?.() ?? String(faq.id),
    }));
  }
}
