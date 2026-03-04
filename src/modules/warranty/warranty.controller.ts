import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarrantyService } from './warranty.service';
import { ActivateWarrantyDto, WarrantyLookupDto } from './dto/warranty.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('warranty')
@Controller('warranty')
export class WarrantyController {
  constructor(private readonly warrantyService: WarrantyService) {}

  @Post('activate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_WARRANTY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate warranty (Admin/Management)' })
  async activate(
    @Body() dto: ActivateWarrantyDto,
    @CurrentUser() user: { email: string },
  ) {
    const warranty = await this.warrantyService.activate(dto, user.email);
    if ((warranty as any)?.skipped) {
      return warranty;
    }
    return {
      ...warranty,
      id: (warranty as any).id?.toString?.() ?? String((warranty as any).id),
    };
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Lookup warranty by IMEI/Serial and Phone' })
  async lookup(@Body() dto: WarrantyLookupDto) {
    const warranty = await this.warrantyService.lookup(dto);
    return {
      ...warranty,
      id: warranty.id?.toString?.() ?? String(warranty.id),
    };
  }

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.READ_WARRANTY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get warranty logs (Admin/Management)' })
  async getLogs(@Param('id') id: string) {
    return await this.warrantyService.getLogs(id);
  }

  @Delete('logs/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_WARRANTY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a warranty log (Admin/Management)' })
  async deleteLog(
    @Param('id') id: string,
    @CurrentUser() user: { email: string },
  ) {
    return await this.warrantyService.deleteLog(id, user.email);
  }

  @Post('add')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_WARRANTY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add warranty (Admin/Management)' })
  async add(
    @Body() dto: ActivateWarrantyDto,
    @CurrentUser() user: { email: string },
  ) {
    const warranty = await this.warrantyService.activate(dto, user.email);
    if ((warranty as any)?.skipped) {
      return warranty;
    }
    return {
      ...warranty,
      id: (warranty as any).id?.toString?.() ?? String((warranty as any).id),
    };
  }

  @Post('update/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_WARRANTY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update warranty (Admin/Management)' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<ActivateWarrantyDto>,
    @CurrentUser() user: { email: string },
  ) {
    const warranty = await this.warrantyService.update(id, dto, user.email);
    return {
      ...warranty,
      id: warranty.id?.toString?.() ?? String(warranty.id),
    };
  }

  @Post('delete/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_WARRANTY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete warranty (Admin/Management)' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { email: string },
  ) {
    return await this.warrantyService.delete(id, user.email);
  }

  @Get()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin', 'management')
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all warranties (Admin/Management) with pagination' })
  async findAll(
    @Param('page') page?: number,
    @Param('limit') limit?: number,
    @Body() body?: any,
  ) {
    const req = (body && body.req) || {};
    const query = req.query || {};
    const pageNum = Number((query.page ?? (typeof page !== 'undefined' ? page : 1)) || 1);
    const limitNum = Number((query.limit ?? (typeof limit !== 'undefined' ? limit : 100)) || 100);
    return await this.warrantyService.findAll({ page: pageNum, limit: limitNum });
  }
}
