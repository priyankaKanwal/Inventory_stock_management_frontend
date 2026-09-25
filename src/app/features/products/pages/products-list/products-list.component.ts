import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../../../services/category.service';
import { SupplierService } from '../../../../services/supplier.service';
import { ProductService } from '../../../../services/product.service';
import { Task } from '../../../../services/task.service';
import { hasFullInventoryAccess } from '../../../../auth/utils/roles';
import { canEditRecord as canEditByTasks } from '../../../../auth/utils/task-access';
import { Product } from '../../products.component';
import { Category } from '../../../categories/categories.component';
import { Supplier } from '../../../suppliers/suppliers.component';


@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css'
})

export class ProductsListComponent implements OnInit {
  // Products received from ProductsComponent
  @Input() products: Product[] = [];

  // Tasks received from ProductsComponent (staff access gating)
  @Input() myTasks: Task[] = [];

  // Pagination state from ProductsComponent
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() total = 0;
  @Input() totalPages = 1;

  // Emitted when the user requests a different page
  @Output() pageChange = new EventEmitter<number>();

  canManage = hasFullInventoryAccess();

  // Inline toast notifications
  toastMessage: string | null = null;
  toastType: 'success' | 'error' | 'info' = 'info';
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  // Stock adjustment modal state
  adjustProduct: Product | null = null;
  adjustOperation: 'IN' | 'OUT' = 'IN';
  isAdjusting = false;

  adjustForm: FormGroup = this.fb.group({
    quantity: [1, [Validators.required, Validators.min(1)]],
    reason: ['', Validators.required],
    operation: ['IN']
  });

  constructor(
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) { }

  canEditRecord(product: Product): boolean {
    return this.canManage || canEditByTasks(this.myTasks, 'PRODUCT', product.id);
  }

  get showActions(): boolean {
    return this.canManage || this.products.some((p) => canEditByTasks(this.myTasks, 'PRODUCT', p.id));
  }

  // Search / Filter
  selectedStatus = 'All Status';

  searchQuery = '';

  showSuggestions = false;

  selectedSuggestionIndex = -1;

  // Category / Supplier name maps
  private categoryNames =
    new Map<string, string>();

  private supplierNames =
    new Map<string, string>();

  ngOnInit(): void {

    // Get search value from URL
    this.route.queryParamMap.subscribe((params) => {

      this.searchQuery =
        params.get('search') || '';

    });

    // Get categories (all pages, needed for name lookups)
    this.categoryService
      .getAllCategories()
      .subscribe({

        next: (categories: Category[]) => {

          this.categoryNames = new Map<string, string>();

          categories.forEach((category) => {

            this.categoryNames.set(
              category.id,
              category.name
            );

          });

        },

        error: (error) => {

          console.error(
            'Error loading categories:',
            error
          );

        }

      });


    // Get suppliers (all pages, needed for name lookups)
    this.supplierService
      .getAllSuppliers()
      .subscribe({

        next: (suppliers: Supplier[]) => {

          suppliers.forEach((supplier) => {

            this.supplierNames.set(
              supplier.id,
              supplier.name
            );

          });

        },

        error: (error) => {

          console.error(
            'Error loading suppliers:',
            error
          );

        }

      });

  }


  //filter Products based on status and search query
  get filteredProducts(): Product[] {

    let result = this.products;


    // -------------------------------------------------------
    // Filter by status
    // -------------------------------------------------------

    if (
      this.selectedStatus !== 'All Status'
    ) {

      const selectedStatus = this.selectedStatus.toLowerCase();

      result = result.filter((product) => {

        return (
          product.stock_status
            .toLowerCase() ===
          selectedStatus
        );

      });

    }

    //search query filter
    const query =
      this.searchQuery
        .trim()
        .toLowerCase();


    if (query) {

      result = result.filter((product) => {

        return (

          product.name
            .toLowerCase()
            .includes(query)

          ||

          product.sku
            .toLowerCase()
            .includes(query)

          ||

          this.getCategoryName(product)
            .toLowerCase()
            .includes(query)

          ||

          this.getSupplierName(product)
            .toLowerCase()
            .includes(query)

        );

      });

    }


    return result;

  }


  get suggestions(): Product[] {

    const query =
      this.searchQuery
        .trim()
        .toLowerCase();


    if (!query) {

      return [];

    }


    return this.products.filter((product) => {

      return (

        product.name
          .toLowerCase()
          .includes(query)

        ||

        product.sku
          .toLowerCase()
          .includes(query)

        ||

        this.getCategoryName(product)
          .toLowerCase()
          .includes(query)

        ||

        this.getSupplierName(product)
          .toLowerCase()
          .includes(query)

      );

    });

  }


  //get category name
  getCategoryName(
    product: Product
  ): string {

    const categoryName =
      this.categoryNames.get(
        product.category_id
      );


    return (
      categoryName ||
      `#${product.category_id}`
    );

  }


  // Normalize stock status from API (e.g. 'in stock') to title case
  getStatusLabel(
    status: string
  ): string {

    switch (status.toLowerCase()) {

      case 'in stock':
        return 'In Stock';

      case 'low stock':
        return 'Low Stock';

      case 'out of stock':
        return 'Out of Stock';

      default:
        return status;

    }

  }


  //get supplier name
  getSupplierName(
    product: Product
  ): string {

    const supplierName =
      this.supplierNames.get(
        product.supplier_id
      );


    return (
      supplierName ||
      `#${product.supplier_id}`
    );

  }


  onSearchInput(
    query: string
  ): void {

    this.searchQuery = query;

    this.showSuggestions = true;

    this.selectedSuggestionIndex = -1;

  }

  selectSuggestion(
    product: Product
  ): void {

    this.searchQuery =
      product.name;

    this.showSuggestions =
      false;

  }

  onSearchKeydown(
    event: KeyboardEvent
  ): void {

    const list =
      this.suggestions;


    if (list.length === 0) {

      return;

    }


    //arrow down
    if (
      event.key === 'ArrowDown'
    ) {

      event.preventDefault();


      this.selectedSuggestionIndex =
        (
          this.selectedSuggestionIndex +
          1
        ) % list.length;

    }



    //arrow up
    else if (
      event.key === 'ArrowUp'
    ) {

      event.preventDefault();


      if (
        this.selectedSuggestionIndex <= 0
      ) {

        this.selectedSuggestionIndex =
          list.length - 1;

      } else {

        this.selectedSuggestionIndex--;

      }

    }

    //enter key
    else if (
      event.key === 'Enter' &&
      this.selectedSuggestionIndex >= 0
    ) {

      event.preventDefault();


      this.selectSuggestion(
        list[
        this.selectedSuggestionIndex
        ]
      );

    }

  }



  //status filter change

  onStatusChange(status: string): void {
    this.selectedStatus = status;
  }

  // Go to a specific page via the pagination controls

  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.currentPage
    ) {

      return;

    }

    this.pageChange.emit(page);

  }

  // First visible product number (1-based)

  get startItem(): number {

    if (this.total === 0) {

      return 0;

    }

    return (this.currentPage - 1) * this.pageSize + 1;

  }

  // Last visible product number (1-based)

  get endItem(): number {

    return Math.min(this.currentPage * this.pageSize, this.total);

  }

  //format price as INR

  formatPrice(value: number): string {
    return this.formatINR(value);
  }

  private formatINR(value: number | string | null | undefined): string {
    const num = Number(value ?? 0);

    if (isNaN(num)) {
      return '₹0.00';
    }

    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  //open stock adjustment modal for a product

  openAdjust(product: Product): void {
    this.adjustProduct = product;
    this.adjustOperation = 'IN';
    this.adjustForm.reset({
      quantity: 1,
      reason: '',
      operation: 'IN'
    });
  }

  onOperationChange(operation: string): void {
    this.adjustOperation = operation === 'OUT' ? 'OUT' : 'IN';
    this.adjustForm.patchValue({ operation: this.adjustOperation });
  }

  closeAdjust(): void {
    this.adjustProduct = null;
    this.isAdjusting = false;
  }

  showToast(type: 'success' | 'error' | 'info', message: string): void {
    this.toastType = type;
    this.toastMessage = message;

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }

  submitAdjust(): void {
    if (!this.adjustProduct) {
      return;
    }

    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      return;
    }

    const value = this.adjustForm.value;
    const operation = value.operation === 'OUT' ? 'OUT' : 'IN';

    this.isAdjusting = true;

    this.productService.adjustStock(this.adjustProduct.id, {
      quantity: Number(value.quantity),
      operation,
      reason: value.reason
    }).subscribe({
      next: (updated) => {
        this.isAdjusting = false;

        const index = this.products.findIndex(
          (item) => String(item.id) === String(this.adjustProduct?.id)
        );

        if (index >= 0) {
          this.products[index] = updated;
        }

        this.showToast(
          'success',
          operation === 'IN'
            ? 'Stock added successfully.'
            : 'Stock deducted successfully.'
        );

        this.closeAdjust();
      },
      error: (error) => {
        this.isAdjusting = false;
        this.showToast(
          'error',
          error.error?.detail ||
          'Failed to adjust stock.'
        );
      }
    });
  }

  //delete product
  deleteProduct(
    id: string
  ): void {

    const product = this.products.find(
      (item) => String(item.id) === String(id)
    );

    if (!product) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(
          (item) => String(item.id) !== String(id)
        );
      },
      error: (error) => {
        console.error('Error deleting product:', error);
      }
    });
  }

}