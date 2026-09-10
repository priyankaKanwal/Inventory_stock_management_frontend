import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../services/category.service';

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

  // Whether current user is an admin (full CRUD access)
  isAdmin =
    localStorage.getItem('role')?.toUpperCase() === 'ADMIN';

  constructor(
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.getCategories();
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
