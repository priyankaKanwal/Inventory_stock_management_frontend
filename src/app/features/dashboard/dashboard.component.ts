import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardService } from '../../services/dashboard.service';
import { TaskService, Task } from '../../services/task.service';
import { OrderService, Order } from '../../services/order.service';
import { CustomerService, Customer } from '../../services/customers.service';
import { canViewOrders } from '../../auth/utils/roles';

export interface DashboardSummary {
  total_products: number;
  total_stock_value: string;
  low_stock_count: number;
  out_of_stock_count: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  summary: DashboardSummary | null = null;
  tasks: Task[] = [];
  orders: Order[] = [];

  isLoading = true;
  errorMessage = '';

  canViewOrdersSection = canViewOrders();

  private customerNames = new Map<string, string>();

  constructor(
    private dashboardService: DashboardService,
    private taskService: TaskService,
    private orderService: OrderService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {

    this.dashboardService.getSummary().subscribe({

      next: (summary) => {
        this.summary = summary;
        this.isLoading = false;
      },

      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.status === 0
          ? 'Unable to reach the inventory API. Check that the backend is running and allows CORS requests.'
          : `Unable to load inventory summary (HTTP ${error.status}).`;

        this.isLoading = false;
      }

    });

    this.loadMyTasks();
    this.loadCustomers();
    this.loadRecentOrders();
  }

  loadMyTasks(): void {
    this.taskService.getMyTasks().subscribe({
      next: (tasks) => {
        this.tasks = (tasks || []).slice(0, 5);
      },
      error: () => {
        this.tasks = [];
      }
    });
  }

  loadCustomers(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (customers) => {
        this.customerNames.clear();
        (customers || []).forEach((c: Customer) => {
          this.customerNames.set(c.id, c.name);
        });
      },
      error: () => {
        this.customerNames.clear();
      }
    });
  }

  loadRecentOrders(): void {
    if (!this.canViewOrdersSection) {
      return;
    }

    this.orderService.getOrders({ page: 1, pageSize: 5 }).subscribe({
      next: (response) => {
        this.orders = (response.items || []).slice(0, 5);
      },
      error: () => {
        this.orders = [];
      }
    });
  }

  customerName(id: string): string {
    return this.customerNames.get(id) || '#'.concat(id);
  }

  totalInr(order: Order): string {
    return this.formatINR(order.total_amount);
  }

  stockValueInr(): string {
    return this.summary ? this.formatINR(this.summary.total_stock_value) : '₹0.00';
  }

  private formatINR(value: number | string | null | undefined): string {
    const num = Number(value ?? 0);

    if (isNaN(num)) {
      return '₹0.00';
    }

    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  statusClass(status: string): string {
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
}