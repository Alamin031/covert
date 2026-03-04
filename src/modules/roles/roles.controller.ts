import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AddPermissionsDto } from './dto/add-permissions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions(Permission.CREATE_ROLE)
//   @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a role' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto as any);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.READ_ROLE)
  @ApiBearerAuth()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions/list')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.READ_ROLE)
  @ApiBearerAuth()
  listPermissions() {
    return Object.values(Permission);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.READ_ROLE)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_ROLE)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto as any);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_ROLE)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/assign-user/:userId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.ASSIGN_ROLE_PERMISSIONS)
  @ApiBearerAuth()
  assignToUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.rolesService.assignRoleToUser(id, userId);
  }

  @Post(':id/permissions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.ASSIGN_ROLE_PERMISSIONS)
  @ApiBearerAuth()
  addPermissions(@Param('id') id: string, @Body() dto: AddPermissionsDto) {
    return this.rolesService.addPermissions(id, dto.permissions as any);
  }

 
}
