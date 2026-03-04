import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsIn } from 'class-validator';
import { Permission } from '../../../common/enums/permission.enum';

export class AddPermissionsDto {
  @ApiProperty({ type: [String], example: [Permission.CREATE_PRODUCT, Permission.READ_PRODUCT] })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(Object.values(Permission), { each: true })
  permissions: Permission[];
}
