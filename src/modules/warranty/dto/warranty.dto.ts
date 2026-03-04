import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ActivateWarrantyDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  imei: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  serial?: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  orderNumber?: string;
}

export class WarrantyLookupDto {
  @ApiProperty({ required: false })
  @IsString()
  imei?: string;

  @ApiProperty({ required: false })
  @IsString()
  serial?: string;

  @ApiProperty()
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  orderNumber?: string; // <-- add this line
  // ...other fields if any...
  phone: string;
}
