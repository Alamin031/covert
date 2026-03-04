/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Eye,
  MoreVertical,
  Download,
  Printer,
  Plus,
  Mail,
  X,
} from 'lucide-react';
import {withProtectedRoute} from '../../lib/auth/protected-route';
import {Card, CardContent} from '../../components/ui/card';
import {Button} from '../../components/ui/button';
import {Input} from '../../components/ui/input';
import {Badge} from '../../components/ui/badge';
import {Checkbox} from '../../components/ui/checkbox';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import {Label} from '../../components/ui/label';
import {Textarea} from '../../components/ui/textarea';
import {formatPrice} from '../../lib/utils/format';
import {ordersService, productsService} from '../../lib/api/services';
import {AssignUnitsModal} from '../../components/admin/assign-units-modal';

import type {Order as ApiOrder, Product as BaseProduct} from '../../types/index';

// Extend Product type locally to include variant fields for admin UI
type Region = {
  id: string;
  regionName?: string;
  name?: string;
  defaultStorages?: { id: string; storageSize?: string; name?: string }[];
  colors?: { id: string; colorName?: string; name?: string }[];
};
type Network = {
  id: string;
  networkName?: string;
  name?: string;
  defaultStorages?: { id: string; storageSize?: string; name?: string }[];
  colors?: { id: string; colorName?: string; name?: string }[];
};
type Product = BaseProduct & {
  regions?: Region[];
  networks?: Network[];
  basicColors?: { id: string; colorName?: string; name?: string }[];
  defaultStorages?: { id: string; storageSize?: string; name?: string ; size?: string }[];
};

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  region?: string;
  storage?: string;
  color?: string;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  items: number;
  total: number;
  status: string;
  payment: string;
  date: string;
  address?: string;
  phone?: string;
  orderItems?: OrderItem[];
  orderNumber?: string;
  size?: string;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'order placed':
      return 'bg-orange-500/10 text-orange-600';
    case 'processing':
      return 'bg-yellow-500/10 text-yellow-600';
    case 'preparing to ship':
      return 'bg-purple-500/10 text-purple-600';
    case 'shipped':
      return 'bg-blue-500/10 text-blue-600';
    case 'delivered':
      return 'bg-green-500/10 text-green-600';
    case 'cancelled':
      return 'bg-red-500/10 text-red-600';
    case 'returned':
      return 'bg-gray-500/10 text-gray-600';
    default:
      return '';
  }
}

function getPaymentColor(payment: string) {
  switch (payment) {
    case 'Paid':
      return 'bg-green-500/10 text-green-600';
    case 'Pending':
      return 'bg-yellow-500/10 text-yellow-600';
    case 'Refunded':
      return 'bg-gray-500/10 text-gray-600';
    default:
      return '';
  }
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignUnitsModalOpen, setAssignUnitsModalOpen] = useState(false);
  const [selectedOrderForUnits, setSelectedOrderForUnits] = useState<ApiOrder | null>(null);
  const [warrantyResults, setWarrantyResults] = useState<any[] | null>(null);
  const [showWarrantyResults, setShowWarrantyResults] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState({
    orderId: '',
    newStatus: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newOrderForm, setNewOrderForm] = useState({
    customer: '',
    email: '',
    phone: '',
    address: '',
    items: [{
      productId: '',
      name: '',
      quantity: 1,
      price: 0,
      region: '',
      storage: '',
      color: '',
    }],
    status: 'order placed',
    payment: 'Pending',
  });
  const [products, setProducts] = useState<Product[]>([]);

  const ORDER_STATUSES = [
    'order placed',
    'processing',
    'preparing to ship',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ordersService.getAll(1, 100);
        let fetchedOrders: any[] = [];

        if (Array.isArray(res)) {
          fetchedOrders = res;
        } else if (res && res.data && Array.isArray(res.data)) {
          fetchedOrders = res.data;
        }

        // Ensure 'id' is always the backend's unique id, not orderNumber
        const mappedOrders = fetchedOrders.map((order: any) => ({
          id: order.id, // backend unique id
          orderNumber:
            order.orderNumber ||
            order.order_number ||
            order.orderNo ||
            order.order_no ||
            '', // fallback to empty string if not present
          customer: order.fullName || order.customer?.fullName || 'Unknown',
          email: order.email || order.customer?.email || '',
          items: (order.orderItems || []).length,
          total: order.total,
          status: order.status ? order.status : 'order placed',
          payment: order.paymentStatus
            ? order.paymentStatus.charAt(0).toUpperCase() +
              order.paymentStatus.slice(1)
            : 'Pending',
          date: order.createdAt
            ? new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '',
          address: order.address || order.customer?.address || '',
          phone: order.phone || order.customer?.phone || '',
          orderItems: (order.orderItems || []).map(
            (item: any, idx: number) => ({
              id: item.id || String(idx),
              name: item.productName || 'Product',
              quantity: item.quantity,
              price: item.price,
            }),
          ),
        }));

        setOrders(mappedOrders);
      } catch (err) {
        setError('Failed to load orders. Please try again.');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productsService.getAll();
        let productsArr: Product[] = [];

        if (Array.isArray(res)) {
          productsArr = res as Product[];
        } else if (Array.isArray((res as {data?: Product[]})?.data)) {
          productsArr = (res as {data: Product[]}).data;
        }

        setProducts(productsArr);
      } catch (err) {
        console.error('Error fetching products for manual order:', err);
      }
    };

    fetchProducts();
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newOrderForm.customer.trim()) {
      errors.customer = 'Customer name is required';
    }
    if (!newOrderForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newOrderForm.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!newOrderForm.phone.trim()) {
      errors.phone = 'Phone is required';
    }
    if (!newOrderForm.address.trim()) {
      errors.address = 'Address is required';
    }

    const validItems = newOrderForm.items.filter(
      item => item.name.trim() !== '',
    );
    if (validItems.length === 0) {
      errors.items = 'At least one item is required';
    }

    validItems.forEach((item, index) => {
      if (item.quantity < 1) {
        errors[`item-qty-${index}`] = 'Quantity must be at least 1';
      }
      if (item.price < 0) {
        errors[`item-price-${index}`] = 'Price cannot be negative';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleViewClick = (order: Order) => {
    setSelectedOrder(order);
    setViewOpen(true);
  };

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${order.id}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: white; }
              .invoice-container { max-width: 800px; margin: 0 auto; padding: 40px; }
              .header { text-align: center; margin-bottom: 40px; }
              .header h1 { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
              .header p { color: #666; font-size: 14px; }
              .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
              .invoice-section h3 { font-weight: bold; margin-bottom: 10px; font-size: 14px; }
              .invoice-section p { font-size: 13px; color: #666; line-height: 1.8; }
              .invoice-section .label { font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin: 30px 0; }
              table thead { background-color: #f5f5f5; }
              table th { padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
              table td { padding: 12px; border-bottom: 1px solid #eee; }
              table tr:last-child td { border-bottom: 2px solid #ddd; }
              .total-section { display: flex; justify-content: flex-end; margin-top: 30px; margin-bottom: 30px; }
              .total-box { width: 300px; padding: 20px; border-top: 2px solid #333; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .total-row.final { font-size: 18px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px; }
              .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
              @media print { body { margin: 0; padding: 0; } .invoice-container { padding: 20px; } }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="header">
                <h1>INVOICE</h1>
                <p>${order.id}</p>
              </div>

              <div class="invoice-details">
                <div class="invoice-section">
                  <h3>From:</h3>
                  <p><span class="label">Friend's Telecom</span><br>Bashundhara City Shopping Complex Basement 2, Shop 25, Dhaka, Bangladesh</p>
                </div>
                <div class="invoice-section">
                  <h3>Bill To:</h3>
                  <p>
                    <span class="label">${order.customer}</span><br>
                    ${order.email}<br>
                    ${order.phone}<br>
                    ${order.address}
                  </p>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th style="text-align: right; width: 80px;">Qty</th>
                    <th style="text-align: right; width: 100px;">Price</th>
                    <th style="text-align: right; width: 120px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.orderItems
                    ?.map(
                      item => `
                    <tr>
                      <td>${item.name}</td>
                      <td style="text-align: right;">${item.quantity}</td>
                      <td style="text-align: right;">৳ ${item.price.toLocaleString(
                        'en-BD',
                      )}</td>
                      <td style="text-align: right;">৳ ${(
                        item.price * item.quantity
                      ).toLocaleString('en-BD')}</td>
                    </tr>
                  `,
                    )
                    .join('')}
                </tbody>
              </table>

              <div class="total-section">
                <div class="total-box">
                  <div class="total-row">
                    <span>Subtotal:</span>
                    <span>৳ ${order.total.toLocaleString('en-BD')}</span>
                  </div>
                  <div class="total-row final">
                    <span>Total:</span>
                    <span>৳ ${order.total.toLocaleString('en-BD')}</span>
                  </div>
                </div>
              </div>

              <div style="margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Payment Status:</strong> ${order.payment}</p>
              </div>

              <div class="footer">
                <p>Thank you for your business!</p>
                <p>Invoice generated on ${new Date().toLocaleDateString(
                  'en-BD',
                  {year: 'numeric', month: 'long', day: 'numeric'},
                )}</p>
              </div>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendInvoiceEmail = (order: Order) => {
    alert(`Invoice email sent to ${order.email}`);
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdateData.newStatus) {
      setFormErrors({status: 'Please select a status'});
      return;
    }

    setStatusUpdating(true);
    try {
      // Always send lowercase status to backend
      const resp: any = await ordersService.updateStatus(statusUpdateData.orderId, {
        status:
          statusUpdateData.newStatus as import('../../lib/api/types').OrderStatus,
      });

      // If backend returned warrantyResults attach and show them
      if (resp && resp.warrantyResults) {
        setWarrantyResults(resp.warrantyResults);
        setShowWarrantyResults(true);
      }

      // Use returned response if it contains order fields, otherwise fetch
      const updatedOrder = resp && resp.id ? resp : await ordersService.getById(statusUpdateData.orderId);

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === statusUpdateData.orderId
            ? {
                ...order,
                status: updatedOrder.status,
                payment: updatedOrder.paymentStatus
                  ? updatedOrder.paymentStatus.charAt(0).toUpperCase() + updatedOrder.paymentStatus.slice(1)
                  : order.payment,
              }
            : order,
        ),
      );

      setStatusUpdateOpen(false);
      setStatusUpdateData({orderId: '', newStatus: ''});
      setFormErrors({});
    } catch (err) {
      setFormErrors({status: 'Failed to update status. Please try again.'});
      console.error('Error updating status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const openStatusUpdateDialog = (order: Order) => {
    setStatusUpdateData({
      orderId: order.id,
      newStatus: order.status.toLowerCase(),
    });
    setStatusUpdateOpen(true);
    setFormErrors({});
  };

  const openAssignUnitsModal = async (order: Order) => {
    try {
      // Fetch full order details from API
      const fullOrder = await ordersService.getById(order.id);
      setSelectedOrderForUnits(fullOrder as any);
      setAssignUnitsModalOpen(true);
    } catch (err) {
      console.error('Error fetching order details:', err);
    }
  };

  const handleAssignUnitsSuccess = () => {
    // Refresh orders list after successful unit assignment
    // Trigger refetch (you can call the fetch function or use a different approach)
  };

  const renderOrdersTable = (statusFilter: string) => {
    const filteredOrders =
      statusFilter === 'all'
        ? orders
        : orders.filter(
            o =>
              o.status &&
              o.status.toLowerCase() === statusFilter.toLowerCase(),
          );

    if (filteredOrders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm text-muted-foreground">
              <th className="pb-3 pr-4">
                <Checkbox />
              </th>
              <th className="pb-3 pr-4">Order</th>
              <th className="pb-3 pr-4">Customer</th>
              <th className="pb-3 pr-4">Items</th>
              <th className="pb-3 pr-4">Total</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Payment</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id} className="border-b border-border">
                <td className="py-4 pr-4">
                  <Checkbox />
                </td>
                <td className="py-4 pr-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium hover:underline">
                    {order.id}
                  </Link>
                </td>
                <td className="py-4 pr-4">
                  <div>
                    <p className="font-medium">{order.customer}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.email}
                    </p>
                  </div>
                </td>
                <td className="py-4 pr-4">{order.items}</td>
                <td className="py-4 pr-4 font-medium">
                  {formatPrice(order.total)}
                </td>
                <td className="py-4 pr-4">
                  <Badge
                    variant="secondary"
                    className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </td>
                <td className="py-4 pr-4">
                  <Badge
                    variant="secondary"
                    className={getPaymentColor(order.payment)}>
                    {order.payment}
                  </Badge>
                </td>
                <td className="py-4 pr-4 text-sm text-muted-foreground">
                  {order.date}
                </td>
                <td className="py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewClick(order)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openStatusUpdateDialog(order)}>
                        <span className="mr-2">📊</span>
                        Update Status
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openAssignUnitsModal(order)}>
                        <span className="mr-2">🔐</span>
                        Assign Units (IMEI/Serial)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePrintInvoice(order)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Invoice
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSendInvoiceEmail(order)}>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleAddOrder = async () => {
    if (!validateForm()) {
      return;
    }

    const validItems = newOrderForm.items.filter(
      item => item.name.trim() !== '',
    );
    const totalAmount = validItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    try {
      const orderData = {
        fullName: newOrderForm.customer,
        email: newOrderForm.email,
        phone: newOrderForm.phone,
        address: newOrderForm.address,
        orderItems: validItems.map(item => ({
          productId: (item as any).productId,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          region: item.region || '',
          storage: item.storage || '',
          color: item.color || '',
        })),
        total: totalAmount,
      };

      // Get the backend response after creating the order
      const created: any = await ordersService.create(orderData as any);
      // Try to extract the backend id and other info
      let backendOrder: any = created;
      // If response is wrapped in .data
      if (created && typeof created === 'object' && 'data' in created) backendOrder = created.data;

      const newOrder: Order = {
        id: backendOrder.id || '',
        orderNumber: backendOrder.orderNumber || backendOrder.order_number || backendOrder.orderNo || backendOrder.order_no || '',
        customer: backendOrder.fullName || (backendOrder.customer && backendOrder.customer.fullName) || newOrderForm.customer,
        email: backendOrder.email || (backendOrder.customer && backendOrder.customer.email) || newOrderForm.email,
        items: (backendOrder.orderItems || validItems).length,
        total: backendOrder.total || totalAmount,
        status: backendOrder.status || newOrderForm.status,
        payment: backendOrder.paymentStatus
          ? backendOrder.paymentStatus.charAt(0).toUpperCase() + backendOrder.paymentStatus.slice(1)
          : newOrderForm.payment,
        date: backendOrder.createdAt
          ? new Date(backendOrder.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
        address: backendOrder.address || (backendOrder.customer && backendOrder.customer.address) || newOrderForm.address,
        phone: backendOrder.phone || (backendOrder.customer && backendOrder.customer.phone) || newOrderForm.phone,
        orderItems: (backendOrder.orderItems || validItems).map((item: any, idx: number) => ({
          id: item.id || String(idx),
          name: item.productName || item.name || 'Product',
          quantity: item.quantity,
          price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
          region: item.region || '',
          storage: item.storage || '',
          color: item.color || '',
        })),
      };
      setOrders([newOrder, ...orders]);
      setAddDrawerOpen(false);
      setFormErrors({});
      setNewOrderForm({
        customer: '',
        email: '',
        phone: '',
        address: '',
        items: [{productId: '', name: '', quantity: 1, price: 0, region: '', storage: '', color: ''}],
        status: 'order placed',
        payment: 'Pending',
      });
    } catch (err) {
      setFormErrors({submit: 'Failed to create order. Please try again.'});
      console.error('Error creating order:', err);
    }
  };

  const addOrderItem = () => {
    setNewOrderForm({
      ...newOrderForm,
      items: [
        ...newOrderForm.items,
        {productId: '', name: '', quantity: 1, price: 0, region: '', storage: '', color: ''},
      ],
    });
  };

  const removeOrderItem = (index: number) => {
    setNewOrderForm({
      ...newOrderForm,
      items: newOrderForm.items.filter((_, i) => i !== index),
    });
  };

  const updateOrderItem = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const updatedItems = [...newOrderForm.items];
    updatedItems[index] = {...updatedItems[index], [field]: value};
    setNewOrderForm({...newOrderForm, items: updatedItems});
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    const updatedItems = [...newOrderForm.items];
    updatedItems[index] = {
      ...updatedItems[index],
      productId,
      name: product ? product.name : '',
      price:
        product && typeof product.price === 'number' ? product.price : 0,
    };
    setNewOrderForm({...newOrderForm, items: updatedItems});
  };

  return (
    <div className="space-y-6">
      {/* Bangla IMEI/Status warning message */}
      {assignUnitsModalOpen && (
        <div className="mb-4">
          <p style={{ color: 'red', fontWeight: 'bold', fontSize: '1rem' }}>
            ⚠️ দয়া করে খেয়াল রাখুন: আপনি যদি IMEI/Serial অ্যাসাইন করার আগে Order Status &quot;Delivered&quot; করে দেন, তাহলে দয়া করে IMEI/Serial অ্যাসাইন করার পর আবার &quot;Delivered&quot; স্ট্যাটাস সিলেক্ট করে Update করুন, না হলে IMEI/Serial Active হবে না।<br />
            এবং সবসময় চেষ্টা করুন IMEI/Serial অ্যাসাইন করার পরেই Order Status &quot;Delivered&quot; করুন, তাহলে প্রোডাক্ট Delivered হলে IMEI/Serial অটো Active হয়ে যাবে।
          </p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage and process customer orders.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => setAddDrawerOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Order
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-red-500">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="all">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList>
                  <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
                  <TabsTrigger value="order placed">
                    Order Placed (
                    {
                      orders.filter(
                        o =>
                          o.status &&
                          o.status.toLowerCase() === 'order placed',
                      ).length
                    }
                    )
                  </TabsTrigger>
                  <TabsTrigger value="processing">
                    Processing (
                    {
                      orders.filter(
                        o =>
                          o.status &&
                          o.status.toLowerCase() === 'processing',
                      ).length
                    }
                    )
                  </TabsTrigger>
                  <TabsTrigger value="preparing to ship">
                    Preparing to Ship (
                    {
                      orders.filter(
                        o =>
                          o.status &&
                          o.status.toLowerCase() === 'preparing to ship',
                      ).length
                    }
                    )
                  </TabsTrigger>
                  <TabsTrigger value="shipped">
                    Shipped (
                    {
                      orders.filter(
                        o =>
                          o.status &&
                          o.status.toLowerCase() === 'shipped',
                      ).length
                    }
                    )
                  </TabsTrigger>
                  <TabsTrigger value="delivered">
                    Delivered (
                    {
                      orders.filter(
                        o =>
                          o.status &&
                          o.status.toLowerCase() === 'delivered',
                      ).length
                    }
                    )
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    Cancelled (
                    {
                      orders.filter(
                        o =>
                          o.status &&
                          o.status.toLowerCase() === 'cancelled',
                      ).length
                    }
                    )
                  </TabsTrigger>
                  <TabsTrigger value="returned">
                    Returned (
                    {
                      orders.filter(
                        o =>
                          o.status &&
                          o.status.toLowerCase() === 'returned',
                      ).length
                    }
                    )
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search orders..." className="pl-9" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent">
                  <Filter className="h-4 w-4" />
                  More Filters
                </Button>
              </div>

              <TabsContent value="all">{renderOrdersTable('all')}</TabsContent>
              <TabsContent value="order placed">
                {renderOrdersTable('order placed')}
              </TabsContent>
              <TabsContent value="processing">
                {renderOrdersTable('processing')}
              </TabsContent>
              <TabsContent value="preparing to ship">
                {renderOrdersTable('preparing to ship')}
              </TabsContent>
              <TabsContent value="shipped">
                {renderOrdersTable('shipped')}
              </TabsContent>
              <TabsContent value="delivered">
                {renderOrdersTable('delivered')}
              </TabsContent>
              <TabsContent value="cancelled">
                {renderOrdersTable('cancelled')}
              </TabsContent>
              <TabsContent value="returned">
                {renderOrdersTable('returned')}
              </TabsContent>
            </Tabs>
          )}

          {!loading && !error && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {orders.length} of {orders.length} orders
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <p className="py-2 font-mono text-lg font-semibold">
              {selectedOrder?.orderNumber}
            </p>
            <DialogDescription>
              Complete order information and items
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">
                    Order Number
                  </Label>
                  <p className="mt-1 font-mono font-medium">
                    {selectedOrder.orderNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">
                    Order ID
                  </Label>
                  <p className="mt-1 font-medium">{selectedOrder.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">
                    Order Date
                  </Label>
                  <p className="mt-1 font-medium">{selectedOrder.date}</p>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-border p-4">
                <h3 className="font-semibold">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase">
                      Name
                    </Label>
                    <p className="mt-1 font-medium">{selectedOrder.customer}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase">
                      Email
                    </Label>
                    <p className="mt-1 font-medium text-sm">
                      {selectedOrder.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase">
                      Phone
                    </Label>
                    <p className="mt-1 font-medium">{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase">
                      Address
                    </Label>
                    <p className="mt-1 font-medium text-sm">
                      {selectedOrder.address}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-border p-4">
                <h3 className="font-semibold">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.orderItems?.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b pb-3 last:border-b-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-border p-4">
                <h3 className="font-semibold">Order Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase">
                      Status
                    </Label>
                    <div className="mt-1">
                      <Badge
                        variant="secondary"
                        className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status ? selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1) : ''}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase">
                      Payment
                    </Label>
                    <div className="mt-1">
                      <Badge
                        variant="secondary"
                        className={getPaymentColor(selectedOrder.payment)}>
                        {selectedOrder.payment}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-lg font-bold">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Manual Order Drawer */}
      <Sheet
        open={addDrawerOpen}
        onOpenChange={open => {
          setAddDrawerOpen(open);
          if (!open) {
            setFormErrors({});
          }
        }}>
        <SheetContent
          side="right"
          className="w-full sm:w-[650px] overflow-y-auto flex flex-col">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-2xl">Add Manual Order</SheetTitle>
            <SheetDescription>
              Create a new order by filling in the customer and order details
              below
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 py-4">
              {/* Customer Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <h3 className="text-lg font-semibold">
                    Customer Information
                  </h3>
                  <span className="text-sm text-red-500">*</span>
                </div>
                <div className="rounded-lg border border-border bg-card/50 p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="order-customer" className="flex gap-1">
                      Customer Name
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="order-customer"
                      value={newOrderForm.customer}
                      onChange={e => {
                        setNewOrderForm({
                          ...newOrderForm,
                          customer: e.target.value,
                        });
                        if (formErrors.customer)
                          setFormErrors({...formErrors, customer: ''});
                      }}
                      placeholder="John Doe"
                      className={
                        formErrors.customer
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      }
                    />
                    {formErrors.customer && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span>•</span> {formErrors.customer}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="order-email" className="flex gap-1">
                        Email
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="order-email"
                        type="email"
                        value={newOrderForm.email}
                        onChange={e => {
                          setNewOrderForm({
                            ...newOrderForm,
                            email: e.target.value,
                          });
                          if (formErrors.email)
                            setFormErrors({...formErrors, email: ''});
                        }}
                        placeholder="john@example.com"
                        className={
                          formErrors.email
                            ? 'border-red-500 focus-visible:ring-red-500'
                            : ''
                        }
                      />
                      {formErrors.email && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <span>•</span> {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="order-phone" className="flex gap-1">
                        Phone
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="order-phone"
                        value={newOrderForm.phone}
                        onChange={e => {
                          setNewOrderForm({
                            ...newOrderForm,
                            phone: e.target.value,
                          });
                          if (formErrors.phone)
                            setFormErrors({...formErrors, phone: ''});
                        }}
                        placeholder="+880 1234567890"
                        className={
                          formErrors.phone
                            ? 'border-red-500 focus-visible:ring-red-500'
                            : ''
                        }
                      />
                      {formErrors.phone && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <span>•</span> {formErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order-address" className="flex gap-1">
                      Delivery Address
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="order-address"
                      value={newOrderForm.address}
                      onChange={e => {
                        setNewOrderForm({
                          ...newOrderForm,
                          address: e.target.value,
                        });
                        if (formErrors.address)
                          setFormErrors({...formErrors, address: ''});
                      }}
                      placeholder="Enter full delivery address"
                      rows={3}
                      className={
                        formErrors.address
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      }
                    />
                    {formErrors.address && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span>•</span> {formErrors.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Order Items</h3>
                    <span className="text-sm text-red-500">*</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addOrderItem}
                    className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {formErrors.items && (
                  <p className="text-sm text-red-500 flex items-center gap-1 bg-red-50 border border-red-200 rounded px-3 py-2">
                    <span>•</span> {formErrors.items}
                  </p>
                )}

                <div className="space-y-3">
                  {newOrderForm.items.map((item, index) => {
                    const product = products.find((p) => p.id === item.productId) as Product | undefined;
                    return (
                      <div
                        key={index}
                        className="space-y-3 rounded-lg border border-border bg-card/30 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Item {index + 1}
                          </span>
                          {newOrderForm.items.length > 1 && (
                            <button
                              onClick={() => removeOrderItem(index)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove item">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor={`item-product-${index}`}
                            className="text-xs font-medium">
                            Product
                          </Label>
                          <Select
                            value={item.productId || ''}
                            onValueChange={value => handleProductSelect(index, value)}>
                            <SelectTrigger
                              id={`item-product-${index}`}
                              className="text-sm">
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.length === 0 ? (
                                  <SelectItem value="__none" disabled>
                                    No products available
                                  </SelectItem>
                                ) : (
                                products.filter((product: Product) => product.id && product.id !== '').map((product: Product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Price input for manual price entry */}
                        <div className="space-y-2">
                          <Label htmlFor={`item-price-${index}`} className="text-xs font-medium">Price</Label>
                          <Input
                            id={`item-price-${index}`}
                            type="text"
                            value={item.price}
                            onChange={e => updateOrderItem(index, 'price', e.target.value)}
                            placeholder="Enter price"
                            className="text-sm"
                          />
                        </div>

                        {/* Variant dropdowns for region/network/basic */}
                        {item.productId && product && (() => {
                          // Region products
                          if (product.regions && product.regions.length > 0) {
                            return (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor={`item-region-${index}`} className="text-xs font-medium">Region</Label>
                                  <Select
                                    value={item.region || ''}
                                    onValueChange={value => updateOrderItem(index, 'region', value)}>
                                    <SelectTrigger id={`item-region-${index}`} className="text-sm">
                                      <SelectValue placeholder="Select region" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {product.regions.filter((region: Region) => region.id && region.id !== '').map((region: Region) => (
                                        <SelectItem key={region.id} value={region.id}>{region.regionName || region.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {/* Storage and color depend on region */}
                                {item.region && (() => {
                                  const regionObj = product.regions!.find((r: Region) => r.id === item.region);
                                  // Storage
                                  const storages = regionObj?.defaultStorages || [];
                                  if (storages.length > 0) {
                                    return (
                                      <div className="space-y-2">
                                        <Label htmlFor={`item-storage-${index}`} className="text-xs font-medium">Storage</Label>
                                        <Select
                                          value={item.storage || ''}
                                          onValueChange={value => updateOrderItem(index, 'storage', value)}>
                                          <SelectTrigger id={`item-storage-${index}`} className="text-sm">
                                            <SelectValue placeholder="Select storage" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {storages.filter((storage: { id: string }) => storage.id && storage.id !== '').map((storage: { id: string; storageSize?: string; name?: string ; size?: string }) => (
                                              <SelectItem key={storage.id} value={storage.id}>{storage.size || storage.storageSize || storage.name || storage.id}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                {/* Color for region */}
                                {item.region && (() => {
                                  const regionObj = product.regions!.find((r: Region) => r.id === item.region);
                                  const colors = regionObj?.colors || [];
                                  if (colors.length > 0) {
                                    return (
                                      <div className="space-y-2">
                                        <Label htmlFor={`item-color-${index}`} className="text-xs font-medium">Color</Label>
                                        <Select
                                          value={item.color || ''}
                                          onValueChange={value => updateOrderItem(index, 'color', value)}>
                                          <SelectTrigger id={`item-color-${index}`} className="text-sm">
                                            <SelectValue placeholder="Select color" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {colors.filter((color: { id: string }) => color.id && color.id !== '').map((color: { id: string; colorName?: string; name?: string }) => (
                                              <SelectItem key={color.id} value={color.id}>{color.colorName || color.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </>
                            );
                          }
                          // Network products
                          if (product.networks && product.networks.length > 0) {
                            return (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor={`item-network-${index}`} className="text-xs font-medium">Network</Label>
                                  <Select
                                    value={item.region || ''}
                                    onValueChange={value => updateOrderItem(index, 'region', value)}>
                                    <SelectTrigger id={`item-network-${index}`} className="text-sm">
                                      <SelectValue placeholder="Select network" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {product.networks.filter((network: Network) => network.id && network.id !== '').map((network: Network) => (
                                        <SelectItem key={network.id} value={network.id}>{network.networkName || network.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {/* Storage and color depend on network */}
                                {item.region && (() => {
                                  const networkObj = product.networks!.find((n: Network) => n.id === item.region);
                                  // Storage
                                  const storages = networkObj?.defaultStorages || [];
                                  if (storages.length > 0) {
                                    return (
                                      <div className="space-y-2">
                                        <Label htmlFor={`item-storage-${index}`} className="text-xs font-medium">Storage</Label>
                                        <Select
                                          value={item.storage || ''}
                                          onValueChange={value => updateOrderItem(index, 'storage', value)}>
                                          <SelectTrigger id={`item-storage-${index}`} className="text-sm">
                                            <SelectValue placeholder="Select storage" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {storages.filter((storage: { id: string }) => storage.id && storage.id !== '').map((storage: { id: string; storageSize?: string; name?: string ; size?: string }) => (
                                              <SelectItem key={storage.id} value={storage.id}>{storage.size || storage.storageSize || storage.name || storage.id}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                {/* Color for network */}
                                {item.region && (() => {
                                  const networkObj = product.networks!.find((n: Network) => n.id === item.region);
                                  const colors = networkObj?.colors || [];
                                  if (colors.length > 0) {
                                    return (
                                      <div className="space-y-2">
                                        <Label htmlFor={`item-color-${index}`} className="text-xs font-medium">Color</Label>
                                        <Select
                                          value={item.color || ''}
                                          onValueChange={value => updateOrderItem(index, 'color', value)}>
                                          <SelectTrigger id={`item-color-${index}`} className="text-sm">
                                            <SelectValue placeholder="Select color" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {colors.filter((color: { id: string }) => color.id && color.id !== '').map((color: { id: string; colorName?: string; name?: string }) => (
                                              <SelectItem key={color.id} value={color.id}>{color.colorName || color.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </>
                            );
                          }
                          // Basic products
                          if (product.basicColors && product.basicColors.length > 0) {
                            return (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor={`item-color-${index}`} className="text-xs font-medium">Color</Label>
                                  <Select
                                    value={item.color || ''}
                                    onValueChange={value => updateOrderItem(index, 'color', value)}>
                                    <SelectTrigger id={`item-color-${index}`} className="text-sm">
                                      <SelectValue placeholder="Select color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {product.basicColors.filter((color: { id: string }) => color.id && color.id !== '').map((color: { id: string; colorName?: string; name?: string }) => (
                                        <SelectItem key={color.id} value={color.id}>{color.colorName || color.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {/* Storage for basic products if available */}
                                {product.defaultStorages && product.defaultStorages.length > 0 && (
                                  <div className="space-y-2">
                                    <Label htmlFor={`item-storage-${index}`} className="text-xs font-medium">Storage</Label>
                                    <Select
                                      value={item.storage || ''}
                                      onValueChange={value => updateOrderItem(index, 'storage', value)}>
                                      <SelectTrigger id={`item-storage-${index}`} className="text-sm">
                                        <SelectValue placeholder="Select storage" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {product.defaultStorages.filter((storage: { id: string }) => storage.id && storage.id !== '').map((storage: { id: string; storageSize?: string; name?: string ; size?: string }) => (
                                          <SelectItem key={storage.id} value={storage.id}>{storage.size || storage.storageSize || storage.name || storage.id}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Status Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold pb-2">Order Status</h3>
                <div className="rounded-lg border border-border bg-card/50 p-4 grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="order-status"
                      className="text-sm font-medium">
                      Order Status
                    </Label>
                    <Select
                      value={newOrderForm.status}
                      onValueChange={value =>
                        setNewOrderForm({...newOrderForm, status: value})
                      }>
                      <SelectTrigger id="order-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order placed">
                          Order Placed
                        </SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="preparing to ship">
                          Preparing to Ship
                        </SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="order-payment"
                      className="text-sm font-medium">
                      Payment Status
                    </Label>
                    <Select
                      value={newOrderForm.payment}
                      onValueChange={value =>
                        setNewOrderForm({...newOrderForm, payment: value})
                      }>
                      <SelectTrigger id="order-payment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Total Amount Section */}
              <div className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Total Amount
                  </span>
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                    {formatPrice(
                      newOrderForm.items.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t pt-4 gap-2">
            {formErrors.submit && (
              <p className="text-sm text-red-500 w-full text-center py-2">
                {formErrors.submit}
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => setAddDrawerOpen(false)}
              className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddOrder} className="flex-1">
              Create Order
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status for order {statusUpdateData.orderId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {formErrors.status && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{formErrors.status}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status-select" className="text-sm font-medium">
                New Status
              </Label>
              <Select
                value={statusUpdateData.newStatus}
                onValueChange={value => {
                  setStatusUpdateData({...statusUpdateData, newStatus: value});
                  if (formErrors.status) {
                    setFormErrors({...formErrors, status: ''});
                  }
                }}>
                <SelectTrigger id="status-select">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusUpdateOpen(false)}
              disabled={statusUpdating}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={statusUpdating}>
              {statusUpdating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warranty Results Dialog */}
      <Dialog open={showWarrantyResults} onOpenChange={setShowWarrantyResults}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Warranty Activation Results</DialogTitle>
            <DialogDescription>Summary of warranty activations for this order</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {warrantyResults && warrantyResults.length > 0 ? (
            warrantyResults.map((r, idx) => {
              const res = r.result || r.error || r;
              const skipped = !!(res && (res as any).skipped);
              const reason = (res && (res as any).reason) || '';
              const existing = (res && (res as any).existing) || null;
              const existingId = (existing && existing.id) || (res && (res as any).existingId) || null;
              const createdId = (res && (res as any).id) || null;

              // Friendly product/unit labels
              const product = products.find((p) => p.id === r.productId) as Product | undefined;
              const productName = product?.name || (r as any).productName || r.productId || 'Unknown product';
              const productCode = (product && ((product as any).sku || (product as any).code)) || (r as any).productCode || null;
              const unitLabel = (r as any).unitCode || (r as any).unitSerial || r.unitId || 'n/a';

              // Useful fields from result/existing to display instead of raw id only
              const imei = (existing && existing.imei) || (res && (res as any).imei) || (r as any).imei || '';
              const phone = (existing && existing.phone) || (res && (res as any).phone) || (r as any).phone || '';
              const orderNo = (existing && existing.orderNumber) || (res && (res as any).orderNumber) || (r as any).orderNumber || '';
              const purchaseRaw = (existing && existing.purchaseDate) || (res && (res as any).purchaseDate) || (existing && existing.createdAt) || (res && (res as any).createdAt) || null;
              const expiryRaw = (existing && existing.expiryDate) || (res && (res as any).expiryDate) || null;
              const purchaseDate = purchaseRaw ? new Date(purchaseRaw).toLocaleString() : null;
              const expiryDate = expiryRaw ? new Date(expiryRaw).toLocaleString() : null;

              return (
                <div key={idx} className="rounded-md border p-3">
                  <p className="text-sm">
                    <strong>Product:</strong> {productName}
                    {productCode && (
                      <span className="ml-2 font-mono text-sm text-muted-foreground">{productCode}</span>
                    )}
                  </p>
                  <p className="text-sm mt-1"><strong>Unit:</strong> {unitLabel} <span className="ml-2 text-xs text-muted-foreground">({r.unitId})</span></p>

                  <p className="text-sm mt-2">
                    <strong>IMEI:</strong> {imei || '—'}
                    {phone ? <span className="ml-4"><strong>Phone:</strong> {phone}</span> : null}
                    {orderNo ? <span className="ml-4"><strong>Order:</strong> {orderNo}</span> : null}
                  </p>

                  {purchaseDate && (
                    <p className="text-sm text-muted-foreground mt-1">Purchase: {purchaseDate}</p>
                  )}
                  {expiryDate && (
                    <p className="text-sm text-muted-foreground">Expiry: {expiryDate}</p>
                  )}

                  {skipped ? (
                    <>
                      {reason === 'already_active' ? (
                        <>
                          <p className="text-sm text-yellow-700 mt-2">This product is already covered by an active warranty.</p>
                          {existingId && (
                            <div className="mt-2 flex items-center gap-3">
                              <Link href={`/admin/warranty/${existingId}`} className="font-mono text-sm text-blue-600 hover:underline">View Warranty: {existingId}</Link>
                              <Link href={`/admin/warranty/${existingId}`}>
                                <Button size="sm">Open Warranty</Button>
                              </Link>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">If this is incorrect, change the IMEI/Serial and try again.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-yellow-700 mt-2">Skipped: {reason || 'duplicate'}</p>
                          {existingId && (
                            <p className="text-sm mt-1">Existing Warranty: <Link href={`/admin/warranty/${existingId}`} className="font-mono text-sm text-blue-600 hover:underline">{existingId}</Link></p>
                          )}
                        </>
                      )}
                    </>
                  ) : createdId ? (
                    <p className="text-sm text-green-700 mt-2">Created Warranty: <Link href={`/admin/warranty/${createdId}`} className="font-mono text-sm text-blue-600 hover:underline">{createdId}</Link></p>
                  ) : (
                    <p className="text-sm text-red-700 mt-2">Error</p>
                  )}
                </div>
              );
            })
          ) : (
            <p>No warranty results to show.</p>
          )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarrantyResults(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Units Modal */}
      <AssignUnitsModal
        open={assignUnitsModalOpen}
        order={selectedOrderForUnits}
        onClose={() => {
          setAssignUnitsModalOpen(false);
          setSelectedOrderForUnits(null);
        }}
        onSuccess={handleAssignUnitsSuccess}
      />
    </div>
  );
}

export default withProtectedRoute(AdminOrdersPage, {
  requiredRoles: ['admin'],
  fallbackTo: '/login',
  showLoader: true,
});
