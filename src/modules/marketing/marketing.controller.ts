import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarketingService } from './marketing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';

interface EmailData {
  to: string;
  subject: string;
  body: string;
}

@ApiTags('marketing')
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post('email')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_MARKETING)
  @ApiOperation({ summary: 'Send marketing email' })
  sendEmail(@Body() emailData: EmailData) {
    return this.marketingService.sendEmail(
      emailData.to,
      emailData.subject,
      emailData.body,
    );
  }
}
