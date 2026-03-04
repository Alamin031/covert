import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions(Permission.MANAGE_SYSTEM)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard stats (Admin/Management)' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics (Admin/Management)' })
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('stock-alerts')
  @ApiOperation({ summary: 'Get stock alerts (Admin/Management)' })
  getStockAlerts() {
    return this.adminService.getStockAlerts();
  }
}
