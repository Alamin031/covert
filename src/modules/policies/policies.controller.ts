import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto, UpdatePolicyDto } from './dto/policy.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';

@ApiTags('policies')
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_POLICY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create policy (Admin only)' })
  async create(@Body() dto: CreatePolicyDto) {
    const policy = await this.policiesService.create(dto);
    return { ...policy, id: policy.id?.toString?.() ?? String(policy.id) };
  }

  @Get()
  @ApiOperation({ summary: 'Get all policies' })
  async findAll() {
    const policies = await this.policiesService.findAll();
    return policies.map(p => ({ ...p, id: p.id?.toString?.() ?? String(p.id) }));
  }


  @Get(':id')
  @ApiOperation({ summary: 'Get policy by id' })
  async findOne(@Param('id') id: string) {
    const policy = await this.policiesService.findOne(id);
    return { ...policy, id: policy.id?.toString?.() ?? String(policy.id) };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get policy by slug' })
  async findOneBySlug(@Param('slug') slug: string) {
    const policy = await this.policiesService.findOneBySlug(slug);
    return { ...policy, id: policy.id?.toString?.() ?? String(policy.id) };
  }


  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_POLICY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update policy (Admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdatePolicyDto) {
    const policy = await this.policiesService.update(id, dto);
    return { ...policy, id: policy.id?.toString?.() ?? String(policy.id) };
  }


  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_POLICY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete policy (Admin only)' })
  async remove(@Param('id') id: string) {
    return await this.policiesService.remove(id);
  }
}
