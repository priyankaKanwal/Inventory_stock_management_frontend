import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { ApiService } from './api.service';
import { Category } from '../features/categories/categories.component';

export { Category };

@Injectable({
  providedIn: 'root'
})
export class CategoryService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  // GET - Get all categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(
      this.buildUrl('categories/')
    );
  }

  // GET - Get category by ID
  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(
      this.buildUrl(`categories/${id}`)
    );
  }

  // POST - Add category
  addCategory(category: Omit<Category, 'id' | 'created_at'>): Observable<Category> {
    return this.http.post<Category>(
      this.buildUrl('categories/'),
      category
    );
  }

  // PUT - Update category
  updateCategory(
    id: string,
    category: Partial<Omit<Category, 'id' | 'created_at'>>
  ): Observable<Category> {
    return this.http.put<Category>(
      this.buildUrl(`categories/${id}`),
      category
    );
  }

  // DELETE - Delete category
  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(
      this.buildUrl(`categories/${id}`)
    );
  }
}