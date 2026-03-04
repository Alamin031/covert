import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GiveawaysService } from './giveaways.service';
import { CreateGiveawayEntryDto } from './dto/giveaway.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';

@ApiTags('giveaways')
@Controller('giveaways')
export class GiveawaysController {
  constructor(private readonly giveawaysService: GiveawaysService) { }

  @Post()
  @ApiOperation({ summary: 'Create giveaway entry' })
  async createEntry(@Body() dto: CreateGiveawayEntryDto) {
    const entry = await this.giveawaysService.createEntry(dto);
    return {
      ...entry,
      id: entry.id?.toString?.() ?? String(entry.id),
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.READ_GIVEAWAY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all entries (Admin only)' })
  async findAll() {
    const entries = await this.giveawaysService.findAll();
    return entries.map(entry => ({
      ...entry,
      id: entry.id?.toString?.() ?? String(entry.id),
    }));
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.READ_GIVEAWAY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export entries (Admin only)' })
  export() {
    return this.giveawaysService.export();
  }
}
