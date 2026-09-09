import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { ProductService } from '../../services/product.service';


// Product interface
export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string | null;
  category_id: number;
  category_name?: string | null;
  supplier_id: number;
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
}


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit, OnDestroy {

  // Store products received from backend
  products: Product[] = [];

  // Store subscription so we can unsubscribe later
  private productSubscription?: Subscription;

  // Whether current user is an admin (full CRUD access)
  isAdmin =
    localStorage.getItem('role')?.toUpperCase() === 'ADMIN';


  constructor(
    private productService: ProductService
  ) {}


  // Component initialization
  ngOnInit(): void {
    this.getProducts();
  }


  // GET - Get all products
  getProducts(): void {

    this.productSubscription = this.productService
      .getProducts()
      .subscribe({

        // API success
        next: (response: ProductsResponse) => {

          this.products = response.items;

          console.log('Products:', this.products);
        },

        // API error
        error: (error: any) => {
          console.error('Error loading products:', error);
        }

      });
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