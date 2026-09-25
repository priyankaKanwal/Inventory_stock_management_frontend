import { Component, OnInit } from '@angular/core';
import { SupplierService } from '../../services/supplier.service';
import { TaskService, Task } from '../../services/task.service';
import { hasFullInventoryAccess, isWorker } from '../../auth/utils/roles';
import { canCreateRecord } from '../../auth/utils/task-access';

//supplier interface
export interface Supplier {
  description: any;
  id: string;
  name: string;
  contact_email: string;
  phone: string;
  address: string;
  created_at: string;
}

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css'
})


export class SuppliersComponent implements OnInit {

  //array to hold suppliers
  suppliers: Supplier[] = [];

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;

  // My assigned tasks (staff use these for per-record access gating)
  myTasks: Task[] = [];

  canManage = hasFullInventoryAccess();

  constructor(
    private supplierService: SupplierService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadMyTasks();
    this.getSuppliers();
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
    return this.canManage || canCreateRecord(this.myTasks, 'SUPPLIER');
  }

  // fetch all suppliers
  getSuppliers(): void {
    this.supplierService
      .getSuppliers({ page: this.currentPage, pageSize: this.pageSize })
      .subscribe({
        next: (response) => {
          this.suppliers = response.items;
          this.currentPage = response.page;
          this.pageSize = response.page_size ?? this.pageSize;
          this.total = response.total;
          this.totalPages = response.total_pages;
        },
        error: (error) => {
          console.error('Error loading suppliers:', error);
        }
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.getSuppliers();
  }

  // Delete supplier
   deleteSupplier(id: string): void {
    this.supplierService.deleteSupplier(id).subscribe({
      next: () => {
        this.suppliers = this.suppliers.filter(
          supplier => supplier.id !== id
        );
      },
      error: (error) => {
        console.error('Error deleting supplier:', error);
      }
    });
  }
}