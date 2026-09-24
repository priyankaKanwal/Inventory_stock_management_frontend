import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  OrderService,
  Order,
  OrderStatus,
  NEXT_ORDER_STATUSES
} from '../../services/order.service';
import { CustomerService, Customer } from '../../services/customers.service';
import { ProductService, Product } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { formatINR } from '../../shared/utils/format';
import { canManageOrders, canTransitionOrderStatus } from '../../auth/utils/roles';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit, OnDestroy {

  orders: Order[] = [];
  customers: Customer[] = [];
  products: Product[] = [];

  isLoading = false;
  errorMessage = '';

  showCreateModal = false;
  showDetailsModal = false;
  showStatusModal = false;

  selectedOrder: Order | null = null;
  selectedStatus = '';

  isSaving = false;

  private subscriptions: Subscription[] = [];

  canManage = canManageOrders();
  canTransition = canTransitionOrderStatus();

  createForm = this.fb.group({
    customer_id: ['', Validators.required],
    items: this.fb.array([])
  });

  private customerNames = new Map<string, string>();
  private productNames = new Map<string, string>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private orderService: OrderService,
    private customerService: CustomerService,
    private productService: ProductService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
    this.loadCustomers();
    this.loadProducts();
  }

  get items(): FormArray {
    return this.createForm.get('items') as FormArray;
  }

  get nextStatuses(): OrderStatus[] {
    return this.selectedOrder
      ? NEXT_ORDER_STATUSES[this.selectedOrder.status]
      : [];
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptions.push(this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.detail ||
          'Failed to load orders. The order service may not be available yet.';
      }
    }));
  }

  loadCustomers(): void {
    this.subscriptions.push(this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers || [];
        this.customerNames.clear();
        this.customers.forEach((c) => this.customerNames.set(c.id, c.name));
      },
      error: () => {
        this.customers = [];
      }
    }));
  }

  loadProducts(): void {
    this.subscriptions.push(
      this.productService.getProducts({ page: 1, pageSize: 100 }).subscribe({
        next: (response) => {
          this.products = response.items || [];
          this.productNames.clear();
          this.products.forEach((p) => {
            this.productNames.set(p.id, p.name);
            p.quantity_in_stock = p.quantity_in_stock ?? 0;
          });
        },
        error: () => {
          this.products = [];
        }
      })
    );
  }

  customerName(id: string): string {
    return this.customerNames.get(id) || '#'.concat(id);
  }

  productName(id: string): string {
    return this.productNames.get(id) || '#'.concat(id);
  }

  shortId(id: string): string {
    return id ? id.slice(0, 8) : '—';
  }

  totalInr(order: Order): string {
    return formatINR(order.total_amount);
  }

  subtotalInr(value: string): string {
    return formatINR(value);
  }

  statusClass(status: OrderStatus): string {
    switch (status) {
      case 'DELIVERED':
        return 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700';
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'PACKED':
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return 'rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700';
      case 'AWAITING_STOCK':
      case 'SUPPLIER_ORDER_PLACED':
      case 'STOCK_RECEIVED':
        return 'rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700';
      case 'CANCELLED':
        return 'rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700';
      default:
        return 'rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600';
    }
  }

  openCreate(): void {
    this.createForm.reset();
    this.items.clear();
    this.addItem();

    if (this.customers.length > 0) {
      this.createForm.patchValue({ customer_id: '' });
    }

    this.showCreateModal = true;
  }

  addItem(): void {
    this.items.push(this.fb.group({
      product_id: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    }));
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  productStock(id: string): number {
    const product = this.products.find((p) => p.id === id);
    return product ? Number(product.quantity_in_stock) : 0;
  }

  createOrder(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const value = this.createForm.value;

    const rawItems = (value.items ?? []) as Array<{ product_id: string; quantity: number }>;

    const payload = {
      customer_id: value.customer_id as string,
      items: rawItems.map((item) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity)
      }))
    };

    this.isSaving = true;

    this.subscriptions.push(this.orderService.createOrder(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.showCreateModal = false;
        this.createForm.reset();
        this.items.clear();
        this.toast.success('Order created successfully.');
        this.loadOrders();
      },
      error: (error) => {
        this.isSaving = false;
        this.toast.error(
          error.error?.detail ||
          'Failed to create order.'
        );
      }
    }));
  }

  openDetails(order: Order): void {
    this.selectedOrder = order;
    this.showDetailsModal = true;
  }

  openStatus(order: Order): void {
    this.selectedOrder = order;
    this.selectedStatus = '';
    this.showStatusModal = true;
  }

  updateStatus(): void {
    if (!this.selectedOrder || !this.selectedStatus) {
      return;
    }

    this.isSaving = true;

    this.subscriptions.push(
      this.orderService
        .updateOrderStatus(this.selectedOrder.id, this.selectedStatus as OrderStatus)
        .subscribe({
          next: (updated) => {
            this.isSaving = false;
            this.showStatusModal = false;
            this.toast.success('Order status updated.');
            this.selectedOrder = null;

            const index = this.orders.findIndex((o) => o.id === updated.id);
            if (index >= 0) {
              this.orders[index] = updated;
            }
          },
          error: (error) => {
            this.isSaving = false;
            this.toast.error(
              error.error?.detail ||
              'Failed to update order status.'
            );
          }
        })
    );
  }

  openPredictions(order: Order): void {
    this.router.navigate(['/predictions'], {
      queryParams: { orderId: order.id }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}