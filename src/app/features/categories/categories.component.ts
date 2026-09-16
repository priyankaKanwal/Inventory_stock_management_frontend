import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { TaskCoverageService } from '../../services/task-coverage.service';
import { hasFullInventoryAccess } from '../../auth/utils/roles';

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

  canManage = hasFullInventoryAccess();

  constructor(
    private categoryService: CategoryService,
    private taskCoverage: TaskCoverageService
  ) {}

  ngOnInit(): void {
    this.taskCoverage.reload();
    this.getCategories();
  }

  canCreateType(): boolean {
    return this.canManage || this.taskCoverage.canCreate('CATEGORY');
  }

  getCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories = response;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
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
