import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SupplierService } from '../../services/supplier.service';
import { CategoryService } from '../../services/category.service';

export interface Suggestion {
  type: 'product' | 'supplier' | 'category';
  id: string;
  name: string;
  sub: string;
}

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent implements OnInit {

  @Output() toggleSidebar = new EventEmitter<void>();

  products: { id: string; name: string; sku: string }[] = [];
  suppliers: { id: string; name: string; email: string }[] = [];
  categories: { id: string; name: string; description?: string }[] = [];

  searchQuery = '';
  showSuggestions = false;
  selectedSuggestionIndex = -1;

  get userName(): string {
    return localStorage.getItem('username') || '';
  }

  constructor(
    private router: Router,
    private productService: ProductService,
    private supplierService: SupplierService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {

    // Get products
    this.productService.getProducts(1, 10).subscribe({
      next: (response) => {
        this.products = response.items.map(
          (p: { id: string; name: string; sku: string }) => ({
            id: p.id,
            name: p.name,
            sku: p.sku
          })
        );
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });

    // Get suppliers
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.contact_email
        }));
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });

    // Get categories
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description
        }));
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  get suggestions(): Suggestion[] {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const result: Suggestion[] = [];

    this.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query)
      )
      .forEach((p) => {
        result.push({
          type: 'product',
          id: p.id,
          name: p.name,
          sub: p.sku
        });
      });

    this.suppliers
      .filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query)
      )
      .forEach((s) => {
        result.push({
          type: 'supplier',
          id: s.id,
          name: s.name,
          sub: s.email
        });
      });

    this.categories
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.description
            ? c.description.toLowerCase().includes(query)
            : false)
      )
      .forEach((c) => {
        result.push({
          type: 'category',
          id: c.id,
          name: c.name,
          sub: c.description ?? ''
        });
      });

    return this.dedupe(result).slice(0, 8);
  }

  //global Search
  onSearchInput(query: string): void {
    this.searchQuery = query;
    this.showSuggestions = true;
    this.selectedSuggestionIndex = -1;
  }

  selectSuggestion(suggestion: Suggestion): void {
    this.searchQuery = suggestion.name;
    this.showSuggestions = false;

    const route =
      suggestion.type === 'product'
        ? ['/products']
        : suggestion.type === 'supplier'
          ? ['/suppliers']
          : ['/categories'];

    this.router.navigate(route, {
      queryParams: { search: suggestion.name }
    });
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const list = this.suggestions;

    if (list.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedSuggestionIndex =
        (this.selectedSuggestionIndex + 1) % list.length;

    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedSuggestionIndex =
        this.selectedSuggestionIndex <= 0
          ? list.length - 1
          : this.selectedSuggestionIndex - 1;

    } else if (
      event.key === 'Enter' &&
      this.selectedSuggestionIndex >= 0
    ) {
      event.preventDefault();
      this.selectSuggestion(list[this.selectedSuggestionIndex]);

    } else if (event.key === 'Escape') {
      this.showSuggestions = false;
    }
  }

  onBlurSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
      this.selectedSuggestionIndex = -1;
    }, 150);
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  private dedupe(items: Suggestion[]): Suggestion[] {
    const seen = new Set<string>();

    return items.filter((item) => {
      const key = `${item.type}:${item.id}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }
}