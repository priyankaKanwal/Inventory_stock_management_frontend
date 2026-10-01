import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SupplierService } from '../../services/supplier.service';
import { CategoryService } from '../../services/category.service';
import { CustomerService } from '../../services/customers.service';
import { OrderService } from '../../services/order.service';
import { AppRole, currentRole } from '../../auth/utils/role-auth';
import { currentUser } from '../../auth/utils/auth-state';

export interface Suggestion {
  type: 'product' | 'supplier' | 'category' | 'customer' | 'order';
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
  customers: { id: string; name: string; email: string; phone?: string | null }[] = [];
  orders: { id: string; customerId: string; customerName?: string; status: string; totalAmount: string }[] = [];

  searchQuery = '';
  showSuggestions = false;
  selectedSuggestionIndex = -1;

  get userName(): string {
    return currentUser()?.username || '';
  }

  get currentRole(): AppRole | null {
    return currentRole();
  }

  constructor(
    private router: Router,
    private productService: ProductService,
    private supplierService: SupplierService,
    private categoryService: CategoryService,
    private customerService: CustomerService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {

    // Get products
    this.productService.getProducts({ page: 1, pageSize: 10 }).subscribe({
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
        console.error('Error loading products for topbar search:', error);
      }
    });

    // Get suppliers
    this.supplierService.getAllSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.contact_email
        }));
      },
      error: (error) => {
        console.error('Error loading suppliers for topbar search:', error);
      }
    });

    // Get categories
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description
        }));
      },
      error: (error) => {
        console.error('Error loading categories for topbar search:', error);
      }
    });

    // Get customers
    this.customerService.getAllCustomers().subscribe({
      next: (customers) => {
        this.customers = (customers || []).map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone
        }));
      },
      error: (error) => {
        console.error('Error loading customers for topbar search:', error);
      }
    });

    // Get orders
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = (orders || []).map((o) => ({
          id: o.id,
          customerId: o.customer_id,
          customerName: o.customer_name || undefined,
          status: o.status,
          totalAmount: o.total_amount
        }));
      },
      error: (error) => {
        console.error('Error loading orders for topbar search:', error);
      }
    });
  }

  private getCustomerName(customerId: string, fallback?: string): string {
    if (fallback) {
      return fallback;
    }
    const found = this.customers.find((c) => c.id === customerId);
    return found ? found.name : '';
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

    this.customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          (c.phone ? c.phone.toLowerCase().includes(query) : false)
      )
      .forEach((c) => {
        result.push({
          type: 'customer',
          id: c.id,
          name: c.name,
          sub: c.email || c.phone || 'Customer'
        });
      });

    this.orders
      .filter((o) => {
        const custName = this.getCustomerName(o.customerId, o.customerName).toLowerCase();
        const shortId = o.id.length > 8 ? o.id.slice(0, 8).toLowerCase() : o.id.toLowerCase();
        return (
          o.id.toLowerCase().includes(query) ||
          shortId.includes(query) ||
          custName.includes(query) ||
          o.status.toLowerCase().includes(query)
        );
      })
      .forEach((o) => {
        const custName = this.getCustomerName(o.customerId, o.customerName);
        const shortId = o.id.length > 8 ? o.id.slice(0, 8) : o.id;
        result.push({
          type: 'order',
          id: o.id,
          name: `Order #${shortId}`,
          sub: (custName ? `${custName} • ` : '') + o.status
        });
      });

    return this.dedupe(result).slice(0, 8);
  }

  // Global search
  onSearchInput(query: string): void {
    this.searchQuery = query;
    this.showSuggestions = true;
    this.selectedSuggestionIndex = -1;
  }

  selectSuggestion(suggestion: Suggestion): void {
    this.searchQuery = suggestion.name;
    this.showSuggestions = false;

    if (suggestion.type === 'customer') {
      this.router.navigate(['/customers'], {
        queryParams: { search: suggestion.name }
      });
      return;
    }

    if (suggestion.type === 'order') {
      const shortId = suggestion.id.length > 8 ? suggestion.id.slice(0, 8) : suggestion.id;
      this.router.navigate(['/orders'], {
        queryParams: { search: shortId }
      });
      return;
    }

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

    } else if (event.key === 'Enter') {
      event.preventDefault();
      const targetIndex = this.selectedSuggestionIndex >= 0 ? this.selectedSuggestionIndex : 0;
      this.selectSuggestion(list[targetIndex]);

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