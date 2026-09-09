import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoryService } from '../../../../services/category.service';
import { SupplierService } from '../../../../services/supplier.service';
import { ProductService } from '../../../../services/product.service';
import { Product } from '../../products.component';
import { Category } from '../../../categories/categories.component';
import { Supplier } from '../../../suppliers/suppliers.component';


@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css'
})

export class ProductsListComponent implements OnInit {
  nextPage() {
    throw new Error('Method not implemented.');
  }
  previousPage() {
    throw new Error('Method not implemented.');
  }

  // Products received from ProductsComponent
  @Input() products: Product[] = [];

  // Whether current user is an admin (full CRUD access)
  isAdmin =
    localStorage.getItem('role')?.toUpperCase() === 'ADMIN';

  // Search / Filter
  selectedStatus = 'All Status';

  searchQuery = '';

  showSuggestions = false;

  selectedSuggestionIndex = -1;

  // Category / Supplier name maps
  private categoryNames =
    new Map<number, string>();

  private supplierNames =
    new Map<number, string>();

  // Pagination variables
  currentPage: number = 1;
  pageSize: number = 10;
  total: number = 0;
  totalPages: number = 0;


  constructor(
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private productService: ProductService,
    private route: ActivatedRoute
  ) { }


  ngOnInit(): void {

    // Get search value from URL
    this.route.queryParamMap.subscribe((params) => {

      this.searchQuery =
        params.get('search') || '';

    });

    // Get categories
    this.categoryService
      .getCategories()
      .subscribe({

        next: (categories: Category[]) => {

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


    // Get suppliers  
    this.supplierService
      .getSuppliers()
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

  //delete product
  deleteProduct(
    id: number
  ): void {

    const product = this.products.find((item) => item.id === id);

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
        this.products = this.products.filter((item) => item.id !== id);
      },
      error: (error) => {
        console.error('Error deleting product:', error);
      }
    });
  }

}