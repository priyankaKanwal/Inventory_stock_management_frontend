import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { ProductService } from '../../services/product.service';
import { TaskService, Task } from '../../services/task.service';
import { hasFullInventoryAccess, isWorker } from '../../auth/utils/roles';
import { canCreateRecord } from '../../auth/utils/task-access';


// Product interface
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  category_id: string;
  category_name?: string | null;
  supplier_id: string;
  supplier_name?: string | null;
  unit_price: number;
  quantity_in_stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  stock_status: string;
}


// Backend response interface
export interface ProductsResponse {
  stock_status: string;
  items: Product[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit, OnDestroy {

  // Pagination properties
  currentPage = 1;
  pageSize = 10;

  total = 0;
  totalPages = 0;

  // Store products received from backend
  products: Product[] = [];

  // Store subscription so we can unsubscribe later
  private productSubscription?: Subscription;

  // My assigned tasks (staff use these for per-record access gating)
  myTasks: Task[] = [];

  canManage = hasFullInventoryAccess();

  constructor(
    private productService: ProductService,
    private taskService: TaskService
  ) { }


  // Component initialization
  ngOnInit(): void {
    this.loadMyTasks();
    this.getProducts();
  }

  loadMyTasks(): void {
    if (!isWorker()) {
      return;
    }

    this.taskService.getMyTasks().subscribe({
      next: (tasks) => {
        this.myTasks = tasks || [];
      },
      error: () => {
        this.myTasks = [];
      }
    });
  }

  canCreateType(): boolean {
    return this.canManage || canCreateRecord(this.myTasks, 'PRODUCT');
  }


  // GET - Get all products
  getProducts(): void {

    this.productSubscription = this.productService
      .getProducts({ page: this.currentPage, pageSize: this.pageSize })
      .subscribe({

        // API success
        next: (response: ProductsResponse) => {

          this.products = response.items;

          this.currentPage = response.page;

          this.pageSize = response.page_size ?? this.pageSize;

          this.total = response.total;

          this.totalPages = response.total_pages;

          console.log('Products:', this.products);
        },

        // API error
        error: (error: any) => {
          console.error('Error loading products:', error);
        }

      });
  }


  // Go to a specific page via the pagination controls

  goToPage(page: number): void {

    if (page < 1 || page > this.totalPages) {

      return;

    }

    this.currentPage = page;

    this.getProducts();

  }


  // Count products by stock status
  countByStatus(status: string): number {

    const statusLower = status.toLowerCase();

    return this.products.filter(
      product => product.stock_status.toLowerCase() === statusLower
    ).length;
  }


  // Component destruction
  ngOnDestroy(): void {

    this.productSubscription?.unsubscribe();

  }

}