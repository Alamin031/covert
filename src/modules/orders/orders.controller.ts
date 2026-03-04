import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  EMICalculationDto,
} from './dto/order.dto';
import { AssignOrderItemUnitsDto } from './dto/assign-units.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('by-customer-email/:email')
  @ApiOperation({ summary: 'Get orders by customer email' })
  async getOrdersByCustomerEmail(@Param('email') email: string) {
    const orders = await this.ordersService.getOrdersByCustomerEmail(email);
    return orders.map((order) => ({
      ...order,
      id: order.id?.toString?.() ?? String(order.id),
      orderItems:
        order.orderItems?.map((item) => ({
          ...item,
          id: item.id?.toString?.() ?? String(item.id),
        })) ?? [],
    }));
  }
  @Post()
  @ApiOperation({ summary: 'Create order' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.READ_ORDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders (Admin/Management)' })
  async findAll() {
    const orders = await this.ordersService.findAll();
    return orders.map((order) => ({
      ...order,
      id: order.id?.toString?.() ?? String(order.id),
      orderItems:
        order.orderItems?.map((item) => ({
          ...item,
          id: item.id?.toString?.() ?? String(item.id),
        })) ?? [],
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
    return {
      ...order,
      id: order.id?.toString?.() ?? String(order.id),
      orderItems:
        order.orderItems?.map((item) => ({
          ...item,
          id: item.id?.toString?.() ?? String(item.id),
        })) ?? [],
    };
  }

  @Get('tracking/:orderNumber')
  @ApiOperation({ summary: 'Get order tracking info by order number (User)' })
  async getOrderTracking(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getOrderTracking(orderNumber);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_ORDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (Admin/Management)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Post('admin/:id/assign-units')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_ORDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign IMEI/Serial units to order items (Admin)' })
  async assignUnits(
    @Param('id') id: string,
    @Body() dto: AssignOrderItemUnitsDto[],
  ) {
    return this.ordersService.assignUnits(id, dto);
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Generate invoice for order' })
  generateInvoice(@Param('id') id: string) {
    return this.ordersService.generateInvoice(id);
  }

  @Post('calculate-emi')
  @ApiOperation({ summary: 'Calculate EMI for amount' })
  calculateEMI(@Body() dto: EMICalculationDto) {
    return this.ordersService.calculateEMI(dto);
  }
}
