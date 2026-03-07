import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray, IsEnum } from 'class-validator';

export class OrderItemDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ required: false })
  region?: string;

  @ApiProperty({ required: false })
  regionName?: string;

  @ApiProperty({ required: false })
  carePlanId?: string;

  @ApiProperty({ required: false })
  carePlanName?: string;

  @ApiProperty({ required: false })
  carePrice?: number;

  @ApiProperty({ required: false })
  careDuration?: string;

  @ApiProperty({ required: false })
  color?: string;

  @ApiProperty({ required: false })
  colorName?: string;

  @ApiProperty({ required: false })
  storage?: string;

  @ApiProperty({ required: false })
  storageName?: string;

  @ApiProperty({ required: false })
  priceType?: string;

  @ApiProperty({ required: false })
  image?: string;

  @ApiProperty({ required: false })
  dynamicInputs?: any;

  @ApiProperty({ required: false })
  selectedVariants?: any;

}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  VOID = 'void',
}

export class CreateOrderDto {
  @ApiProperty()
  customer: any;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  orderItems: OrderItemDto[];

  @ApiProperty()
  @IsNumber()
  total: number;

  // Separate delivery fields for admin/reporting/analytics
  @ApiProperty({ required: false })
  fullName?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  division?: string;

  @ApiProperty({ required: false })
  district?: string;

  @ApiProperty({ required: false })
  upzila?: string;

  @ApiProperty({ required: false })
  postCode?: string;

  @ApiProperty({ required: false })
  totalRewardPoints?: number;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  paymentMethod?: string;

  @ApiProperty({ required: false })
  deliveryMethod?: string;



  @ApiProperty({
    required: false,
    type: 'array',
    description: 'Order status history for timeline',
    example: [
      { status: 'pending', date: '2025-12-15T12:00:00Z' },
      { status: 'confirmed', date: '2025-12-15T13:00:00Z' },
    ],
  })
  statusHistory?: { status: string; date: Date }[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class EMICalculationDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNumber()
  months: number;
}
