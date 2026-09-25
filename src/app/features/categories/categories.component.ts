import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { TaskService, Task } from '../../services/task.service';
import { hasFullInventoryAccess, isWorker } from '../../auth/utils/roles';
import { canCreateRecord } from '../../auth/utils/task-access';

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at?: string | null;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {

  categories: Category[] = [];

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;

  // My assigned tasks (staff use these for per-record access gating)
  myTasks: Task[] = [];

  canManage = hasFullInventoryAccess();

  constructor(
    private categoryService: CategoryService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadMyTasks();
    this.getCategories();
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
    return this.canManage || canCreateRecord(this.myTasks, 'CATEGORY');
  }

  getCategories(): void {
    this.categoryService
      .getCategories({ page: this.currentPage, pageSize: this.pageSize })
      .subscribe({
        next: (response) => {
          this.categories = response.items;
          this.currentPage = response.page;
          this.pageSize = response.page_size ?? this.pageSize;
          this.total = response.total;
          this.totalPages = response.total_pages;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.getCategories();
  }

  deleteCategory(id: string): void {
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.categories = this.categories.filter(
          category => category.id !== id
        );
      },
      error: (error) => {
        console.error('Error deleting category:', error);
      }
    });
  }
}
