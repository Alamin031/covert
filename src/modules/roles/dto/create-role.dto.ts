import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'manager', description: 'Unique role name' })
  name: string;

  @ApiProperty({ example: ['MANAGE_USERS', 'READ_PRODUCTS'], description: 'List of permission keys', required: false, isArray: true })
  permissions?: string[];
}
