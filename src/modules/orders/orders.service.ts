import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  EMICalculationDto,
} from './dto/order.dto';
import { AssignOrderItemUnitsDto } from './dto/assign-units.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderitem.entity';
import { OrderItemUnit } from './entities/order-item-unit.entity';

import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { WarrantyService } from '../warranty/warranty.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderItemUnit)
    private readonly orderItemUnitRepo: Repository<OrderItemUnit>,
    private readonly notificationService: NotificationService,
    private readonly warrantyService: WarrantyService,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const orderNumber =
      'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    // Order create
    const order = this.orderRepository.create({
      customer: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        division: dto.division,
        district: dto.district,
        upzila: dto.upzila,
        postCode: dto.postCode,
        address: dto.address,
        paymentMethod: dto.paymentMethod,
        deliveryMethod: dto.deliveryMethod,
      },
      total: dto.total,
      orderNumber,
      status: 'order placed',
      paymentStatus: 'pending',
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      division: dto.division,
      district: dto.district,
      upzila: dto.upzila,
      postCode: dto.postCode,
      address: dto.address,
      paymentMethod: dto.paymentMethod,
      deliveryMethod: dto.deliveryMethod,
      statusHistory: [{ status: 'pending', date: new Date() }],
      totalRewardPoints: dto.totalRewardPoints || 0,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Order Items create with ALL data from frontend
    if (dto.orderItems && dto.orderItems.length > 0) {
          const items = dto.orderItems.map((item) => {
        // Create order item with ALL properties from frontend
        return this.orderItemRepository.create({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          color: item.color,
          colorName: item.colorName, // Store color name
          storage: item.storage,
          storageName: item.storageName, // Store storage name
          region: item.region,
          regionName: item.regionName, // Store region name
          priceType: item.priceType, // Store price type
            carePlanId: item.carePlanId, // Store care plan selection
            carePlanName: item.carePlanName,
            carePrice: item.carePrice,
            careDuration: item.careDuration,
          image: item.image,
              // imei/serial removed from OrderItem; units should be assigned later
          dynamicInputs: item.dynamicInputs || {},
          selectedVariants: item.selectedVariants || {}, // Store complete variant info
          orderId: String(savedOrder.id),
        });
      });

      await this.orderItemRepository.save(items);
    }

    // Load saved order items
    savedOrder.orderItems = await this.orderItemRepository.find({
      where: { orderId: String(savedOrder.id) },
    });

    // Decrement stock for each order item
    try {
      const productPriceRepo =
        this.orderRepository.manager.getRepository('ProductPrice');
      const productColorRepo =
        this.orderRepository.manager.getRepository('ProductColor');
      const productRepo = this.orderRepository.manager.getRepository('Product');
      for (const item of savedOrder.orderItems) {
        if (item.storage) {
          // Query ProductPrice by storageId, not id
          const storageId = item.storage;

          const price = await productPriceRepo.findOne({
            where: { storageId },
          });
          if (price && price.stockQuantity != null) {
            price.stockQuantity = Math.max(
              0,
              price.stockQuantity - item.quantity,
            );
            await productPriceRepo.save(price);
          } else {
          }
        } else if (item.color) {
          // Find ProductColor by region/network/productId+colorName if present, else by id
          let colorQuery: any = {};
          let color: any = null;
          if (item.region) {
            const regionId = item.region;
            colorQuery = { regionId, colorName: item.colorName };

            color = await productColorRepo.findOne({ where: colorQuery });
            if (!color) {
              // Try fallback: productId + colorName
              const productId = item.productId;
              const fallbackQuery = { productId, colorName: item.colorName };

              color = await productColorRepo.findOne({ where: fallbackQuery });
            }
          } else if (item.network) {
            const networkId = item.network;
            colorQuery = { networkId, colorName: item.colorName };

            color = await productColorRepo.findOne({ where: colorQuery });
            if (!color) {
              // Try fallback: productId + colorName
              const productId = item.productId;
              const fallbackQuery = { productId, colorName: item.colorName };

              color = await productColorRepo.findOne({ where: fallbackQuery });
            }
          } else if (item.productId && item.colorName) {
            const productId = item.productId;
            colorQuery = { productId, colorName: item.colorName };

            color = await productColorRepo.findOne({ where: colorQuery });
          } else {
            const colorId = item.color;
            colorQuery = { id: colorId };

            color = await productColorRepo.findOne({ where: colorQuery });
          }
          if (color && color.singleStockQuantity != null) {
            color.singleStockQuantity = Math.max(
              0,
              color.singleStockQuantity - item.quantity,
            );
            await productColorRepo.save(color);
          } else if (color && color.stockQuantity != null) {
            // Fallback: decrement stockQuantity if singleStockQuantity is null

            color.stockQuantity = Math.max(
              0,
              color.stockQuantity - item.quantity,
            );
            await productColorRepo.save(color);
          } else {
            // If no ProductColor found, try to decrement main Product stock (for basic products)
            const productId = item.productId;

            const product = await productRepo.findOne({
              where: { id: productId },
            });
            if (product && product.stockQuantity != null) {
              product.stockQuantity = Math.max(
                0,
                product.stockQuantity - item.quantity,
              );
              await productRepo.save(product);
            } else {
            }
          }
        } else {
          // If neither storage nor color, try to decrement main Product stock
          const productId = item.productId;

          const product = await productRepo.findOne({
            where: { id: productId },
          });
          if (product && product.stockQuantity != null) {
            product.stockQuantity = Math.max(
              0,
              product.stockQuantity - item.quantity,
            );
            await productRepo.save(product);
          } else {
          }
        }
      }
    } catch (e) {}

    // Create notification for new order (user)
    try {
      // User notification
      await this.notificationService.create({
        userId: savedOrder.customer?.email,
        type: NotificationType.ORDER_UPDATE,
        title: 'Order Placed',
        message: `Your order ${savedOrder.orderNumber} has been placed successfully!`,
        link: `/account/orders/${savedOrder.id}`,
        status: 'pending',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // Admin notification (no userId field)
      await this.notificationService.create({
        type: NotificationType.ADMIN_ORDER_PLACED,
        title: 'New Order Placed',
        message: `A new order (${savedOrder.orderNumber}) has been placed by ${savedOrder.customer?.fullName || 'a customer'}.`,
        link: `/admin/orders`,
        status: 'pending',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAdmin: true,
      });
    } catch (e) {
      // Optionally log notification error
    }
    return savedOrder;
  }



  async findAll(): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      order: { createdAt: 'DESC' },
    });
    await Promise.all(
      orders.map(async (order) => {
        const items = await this.orderItemRepository.find({
          where: { orderId: String(order.id) },
        });
        // Only pick important fields for admin
        order.orderItems = items.map((item) => ({
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          colorName: item.colorName,
          storageName: item.storageName,
          regionName: item.regionName,
          priceType: item.priceType,
          carePlanId: item.carePlanId,
          carePlanName: item.carePlanName,
          carePrice: item.carePrice,
          careDuration: item.careDuration,
          image: item.image,
        }));
      }),
    );
    return orders;
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    const items = await this.orderItemRepository.find({
      where: { orderId: String(order.id) },
    });
    order.orderItems = items.map((item) => ({
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      colorName: item.colorName,
      storageName: item.storageName,
      regionName: item.regionName,
      priceType: item.priceType,
      carePlanId: item.carePlanId,
      carePlanName: item.carePlanName,
      carePrice: item.carePrice,
      careDuration: item.careDuration,
      image: item.image,
    }));
    return order;
  }

  //order get by user id
  async findByUserId(userId: string): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      where: { customer: { id: userId } },
      order: { createdAt: 'DESC' },
    });
    await Promise.all(
      orders.map(async (order) => {
        const items = await this.orderItemRepository.find({
          where: { orderId: String(order.id) },
        });
        // Only pick important fields for user
        order.orderItems = items.map((item) => ({
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          colorName: item.colorName,
          storageName: item.storageName,
          regionName: item.regionName,
          priceType: item.priceType,
          carePlanId: item.carePlanId,
          carePlanName: item.carePlanName,
          carePrice: item.carePrice,
          careDuration: item.careDuration,
          image: item.image,
        }));
      }),
    );
    return orders;
  }

  async getOrderTracking(id: string) {
    // Fetch by order number for the public tracking endpoint.
    const order = await this.orderRepository.findOne({
      where: { orderNumber: id },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Helper to get date from statusHistory
    const getStatusDate = (status: string) => {
      if (!Array.isArray(order.statusHistory)) return null;
      const entry = order.statusHistory.find((s: any) => s.status === status);
      return entry ? entry.date : null;
    };

    const timeline = [
      {
        label: 'Order Placed',
        date: order.createdAt,
        completed: true,
      },
      {
        label: 'Order Confirmed',
        date: getStatusDate('confirmed'),
        completed: [
          'confirmed',
          'processing',
          'preparing-to-ship',
          'shipped',
          'out-for-delivery',
          'delivered',
        ].includes(order.status),
      },
      {
        label: 'Processing',
        date: getStatusDate('processing'),
        completed: [
          'processing',
          'preparing-to-ship',
          'shipped',
          'out-for-delivery',
          'delivered',
        ].includes(order.status),
      },
      {
        label: 'Preparing to Ship',
        date: getStatusDate('preparing-to-ship'),
        completed: [
          'preparing-to-ship',
          'shipped',
          'out-for-delivery',
          'delivered',
        ].includes(order.status),
      },
      {
        label: 'Shipped',
        date: getStatusDate('shipped'),
        completed: ['shipped', 'out-for-delivery', 'delivered'].includes(
          order.status,
        ),
      },
      {
        label: 'Out for Delivery',
        date: getStatusDate('out-for-delivery'),
        completed: ['out-for-delivery', 'delivered'].includes(order.status),
      },
      {
        label: 'Delivered',
        date: getStatusDate('delivered'),
        completed: order.status === 'delivered',
      },
    ];

    // Shipping address
    const shippingAddress = {
      fullName: order.fullName,
      address: order.address,
      division: order.division,
      district: order.district,
      upzila: order.upzila,
      postCode: order.postCode,
      phone: order.phone,
      email: order.email,
    };

    // Payment summary (expand as needed)
    const paymentSummary = {
      subtotal: order.total, // You can split subtotal, tax, discount if you store them
      shipping: order.deliveryMethod === 'free' ? 'FREE' : order.deliveryMethod,
      tax: 0, // Add tax if you store it
      discount: 0, // Add discount if you store it
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    };

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      timeline,
      shippingAddress,
      paymentSummary,
    };
  }

    async assignUnits(orderId: string, dto: AssignOrderItemUnitsDto[]) {
    console.log('[Orders] assignUnits called', { orderId, items: dto?.length ?? 0 });
    for (const item of dto) {
      let orderItem: OrderItem | null = null as any;
      try {
        if (typeof item.orderItemId === 'string' && !item.orderItemId.startsWith('item-')) {
          orderItem = await this.orderItemRepository.findOne({
            where: { id: item.orderItemId },
          });
        } else if (typeof item.orderItemId === 'string') {
          // Support client temporary ids like `item-0` by mapping to saved order items by index
          const idxMatch = /^item-(\d+)$/.exec(item.orderItemId);
          if (idxMatch) {
            const idx = parseInt(idxMatch[1], 10);
            const savedItems = await this.orderItemRepository.find({ where: { orderId: String(orderId) } });
            if (Array.isArray(savedItems) && savedItems.length > idx) {
              orderItem = savedItems[idx] as any;
              if (!orderItem) {
                console.warn('[Orders] assignUnits: mapped temp id but orderItem is null', { orderItemId: item.orderItemId, orderId });
                continue;
              }
              console.log('[Orders] assignUnits: mapped temp id to saved orderItem', { tempId: item.orderItemId, mappedId: orderItem.id?.toString?.() ?? String(orderItem.id) });
            } else {
              console.warn('[Orders] assignUnits: cannot map temp id to orderItem (index out of range)', { orderItemId: item.orderItemId, orderId });
              continue;
            }
          } else {
            console.warn('[Orders] assignUnits: invalid orderItemId', { orderItemId: item.orderItemId });
            continue;
          }
        } else {
          console.warn('[Orders] assignUnits: invalid orderItemId type', { orderItemId: item.orderItemId });
          continue;
        }
      } catch (err) {
        console.error('[Orders] assignUnits: error finding orderItem', { orderItemId: item.orderItemId, err });
        continue;
      }

      if (!orderItem) {
        console.warn('[Orders] assignUnits: orderItem not found', { orderItemId: item.orderItemId });
        continue;
      }

      for (const unit of item.units) {
        const saved = await this.orderItemUnitRepo.save(
          this.orderItemUnitRepo.create({
            orderId,
            orderItemId: String(orderItem.id),
            productId: orderItem.productId,
            imei: unit.imei,
            serial: unit.serial,
            status: 'assigned',
          }),
        );
        console.log('[Orders] assignUnits: unit assigned', {
          id: saved?.id?.toString?.() ?? String(saved?.id),
          orderId,
          orderItemId: item.orderItemId,
          productId: saved.productId,
          imei: saved.imei,
          serial: saved.serial,
        });
      }
    }
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    // Update status and push to statusHistory
    const newStatusEntry = { status: dto.status, date: new Date() };
    const updatedHistory = Array.isArray(order.statusHistory)
      ? [...order.statusHistory, newStatusEntry]
      : [newStatusEntry];

    // Payment status logic
    let paymentStatus = order.paymentStatus;
    if (dto.status === 'returned') {
      paymentStatus = 'refunded'; // Returned order, payment refunded
    } else if (dto.status === 'cancelled') {
      paymentStatus = 'void'; // Cancelled order, payment voided
    } else if (dto.status === 'delivered') {
      paymentStatus = 'completed';
    }

    await this.orderRepository.update({ id }, {
      status: dto.status,
      statusHistory: updatedHistory,
      paymentStatus,
    });

    // অর্ডার delivered হলে অটো ওয়ারেন্টি এন্ট্রি এবং reward points যোগ
    if (dto.status === 'delivered') {
      // একাধিক অর্ডার আইটেম থাকলে প্রত্যেকটির জন্য ওয়ারেন্টি এন্ট্রি
      const updatedOrder = await this.orderRepository.findOne({ where: { id } });
      console.log('[Warranty] updatedOrder:', updatedOrder);
      if (!updatedOrder || !updatedOrder.id) {
        console.error('[Warranty] Cannot process warranty: updatedOrder or updatedOrder.id missing. id:', id, 'updatedOrder:', updatedOrder);
        // Return the original order object after update
        return order;
      } else {
        console.log('[Warranty] updatedOrder.id:', updatedOrder.id, 'typeof:', typeof updatedOrder.id);
        const orderIdStr = String(updatedOrder.id);
        // Use unit-based warranty activation: gather all units assigned to this order
        const units = await this.orderItemUnitRepo.find({ where: { orderId: orderIdStr } });
        const warrantyResults: any[] = [];
        for (const unit of units || []) {
          try {
            const imei = unit.imei || '';
            const serial = unit.serial || '';
            console.log('[Warranty] Creating for productId:', unit.productId, 'IMEI:', imei, 'Serial:', serial, 'OrderId:', orderIdStr);
            if (!unit.productId) {
              console.warn('[Warranty] Skipping: productId missing for unit:', unit);
              continue;
            }
            if (!imei && !serial) {
              console.warn('[Warranty] Skipping: Both IMEI and Serial are missing for unit:', unit);
              continue;
            }
            const result = await this.warrantyService.activate(
              {
                productId: unit.productId,
                imei,
                serial,
                phone: updatedOrder.phone ?? '',
                orderId: orderIdStr,
                orderNumber: updatedOrder.orderNumber,
              },
              'system',
            );
            warrantyResults.push({ unitId: unit.id, productId: unit.productId, result });
            // Post-activation cleanup:
            // - If warranty was created: mark this unit delivered and remove other assigned units with same IMEI.
            // - If activation was skipped due to existing warranty (duplicate_imei or already_active) and an existing warranty is present,
            //   remove other assigned units with same IMEI (keep current unit so admin can correct IMEI if needed).
            try {
              const createdId = result && (result as any).id;
              const skipped = result && (result as any).skipped;
              const reason = skipped ? (result as any).reason : null;
              const existing = skipped ? (result as any).existing : null;
              const thisUnitId = typeof unit.id === 'string' ? String(unit.id) : String(unit.id);

              if (createdId) {
                // Mark this unit as delivered (status)
                try {
                  await this.orderItemUnitRepo.update({ id: String(unit.id) }, { status: 'delivered' } as any);
                } catch (e) {
                  console.warn('[Warranty] Failed to update unit status for', unit.id, e);
                }
                // Remove other assigned units with same IMEI
                if (imei) {
                  try {
                    // Find all units with same IMEI (do not restrict by status here to catch unexpected status values)
                    const duplicates = await this.orderItemUnitRepo.find({ where: { imei: imei } as any });
                    console.log('[Warranty] duplicates found for IMEI', imei, 'count', (duplicates || []).length);
                    for (const dup of duplicates || []) {
                      const dupId = String(dup.id);
                      console.log('[Warranty] duplicate unit', { id: dupId, status: dup.status, orderId: dup.orderId });
                      if (dupId !== thisUnitId && dup.status !== 'delivered') {
                        try {
                          await this.orderItemUnitRepo.delete({ id: String(dup.id) });
                          console.log('[Warranty] removed duplicate unit', dupId, 'for IMEI', imei, 'status', dup.status);
                        } catch (e) {
                          console.warn('[Warranty] failed to delete duplicate unit', dupId, e);
                        }
                      }
                    }
                  } catch (e) {
                    console.warn('[Warranty] Failed to cleanup duplicate units for IMEI', imei, e);
                  }
                }
              } else if (skipped && (reason === 'duplicate_imei' || reason === 'already_active') && existing && imei) {
                // If skipped because IMEI already has a warranty, remove other assigned units with the same IMEI (keep current unit)
                try {
                  const duplicates = await this.orderItemUnitRepo.find({ where: { imei: imei } as any });
                  console.log('[Warranty] duplicates found for IMEI (skipped case)', imei, 'count', (duplicates || []).length);
                  for (const dup of duplicates || []) {
                    const dupId = String(dup.id);
                    console.log('[Warranty] duplicate unit (skipped case)', { id: dupId, status: dup.status, orderId: dup.orderId });
                    if (dupId !== thisUnitId && dup.status !== 'delivered') {
                      try {
                        await this.orderItemUnitRepo.delete({ id: String(dup.id) });
                        console.log('[Warranty] removed assigned unit', dupId, 'because IMEI already has warranty', existing && existing.id);
                      } catch (e) {
                        console.warn('[Warranty] failed to delete assigned unit', dupId, e);
                      }
                    }
                  }
                } catch (e) {
                  console.warn('[Warranty] Failed to cleanup assigned units for IMEI', imei, e);
                }
              }
            } catch (e) {
              console.warn('[Warranty] post-activation unit cleanup failed', e);
            }
            console.log('[Warranty] Activation result for productId:', unit.productId, result);
          } catch (e) {
            console.error('[Warranty] Error creating for productId (unit):', unit.productId, e);
            warrantyResults.push({ unitId: unit.id, productId: unit.productId, error: e });
          }
        }
        // Reward points যোগ করা
        try {
          // User repository lazily loaded to avoid circular dependency
          const userRepo = this.orderRepository.manager.getRepository('User');
          // Find user by email (from order)
          const user = await userRepo.findOne({ where: { email: updatedOrder.email } });
          if (user) {
            const currentPoints = user.myrewardPoints || 0;
            const orderPoints = updatedOrder.totalRewardPoints || 0;
            user.myrewardPoints = currentPoints + orderPoints;
            await userRepo.save(user);
            console.log('[RewardPoints] Added', orderPoints, 'to user', user.email, 'Total now:', user.myrewardPoints);
          } else {
            console.warn('[RewardPoints] No user found for email:', updatedOrder.email);
          }
        } catch (e) {
          console.error('[RewardPoints] Error updating user points:', e);
        }
        const orderResponse = await this.findOne(id);
        return { ...orderResponse, warrantyResults } as any;
      }
    }
    return this.findOne(id);
  }

  calculateEMI(dto: EMICalculationDto) {
    const interestRate = 0.12;
    const monthlyRate = interestRate / 12;
    const monthlyPayment =
      (dto.amount * monthlyRate * Math.pow(1 + monthlyRate, dto.months)) /
      (Math.pow(1 + monthlyRate, dto.months) - 1);
    return {
      amount: dto.amount,
      months: dto.months,
      monthlyPayment: Math.round(monthlyPayment),
      totalPayment: Math.round(monthlyPayment * dto.months),
      interestTotal: Math.round(monthlyPayment * dto.months - dto.amount),
    };
  }

  async generateInvoice(orderNumber: string) {
    // Find order by orderNumber
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
    });
    if (!order) throw new NotFoundException('Order not found');
    return {
      ...order,
      invoiceNumber: 'INV-' + order.orderNumber,
      generatedAt: new Date(),
    };
  }

  async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    // Find orders where the email field matches
    const orders = await this.orderRepository.find({
      where: { email },
      order: { createdAt: 'DESC' },
    });
    await Promise.all(
      orders.map(async (order) => {
        const items = await this.orderItemRepository.find({
          where: { orderId: String(order.id) },
        });
        order.orderItems = items.map((item) => ({
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          colorName: item.colorName,
          storageName: item.storageName,
          regionName: item.regionName,
          priceType: item.priceType,
          carePlanId: item.carePlanId,
          carePlanName: item.carePlanName,
          carePrice: item.carePrice,
          careDuration: item.careDuration,
          image: item.image,
        }));
      }),
    );
    return orders;
  }
}
