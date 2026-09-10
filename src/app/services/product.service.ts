import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { Product, ProductsResponse } from '../features/products/products.component';

export { Product };


@Injectable({ providedIn: 'root' })

export class ProductService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }


  // GET - Get all products
  getProducts(page: number, pageSize: number): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(
      this.buildUrl(`products/?page=${page}&page_size=${pageSize}`)
    );
  }

  // GET - Get product by ID
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(
      this.buildUrl(`products/${id}`)
    );
  }


  // POST - Add new product
  addProduct(
    product: Omit<Product, 'id' | 'stock_status'>)
    : Observable<Product> {

    return this.http.post<Product>(
      this.buildUrl('products/'),
      product
    );

  }


  // PUT - Update product
  updateProduct(
    id: string,
    product: Omit<Product, 'id' | 'stock_status'>
  ): Observable<Product> {

    return this.http.put<Product>(
      this.buildUrl(`products/${id}`),
      product
    );

  }


  // DELETE - Delete product
  deleteProduct(id: string): Observable<void> {

    return this.http.delete<void>(
      this.buildUrl(`products/${id}`)
    );

  }

}