import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupplierService, Supplier } from '../../../../services/supplier.service';
import { Task } from '../../../../services/task.service';
import { hasFullInventoryAccess } from '../../../../auth/utils/roles';
import { canEditRecord as canEditByTasks } from '../../../../auth/utils/task-access';

@Component({
  selector: 'app-suppliers-list',
  templateUrl: './supplier-list.component.html',
  styleUrl: './supplier-list.component.css'
})
export class SupplierListComponent implements OnInit, OnDestroy {

  // Suppliers received from parent component
  @Input() suppliers: Supplier[] = [];

  // Tasks received from parent component (staff access gating)
  @Input() myTasks: Task[] = [];

  // Pagination state from parent component
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() total = 0;
  @Input() totalPages = 1;

  // Emitted when the user requests a different page
  @Output() pageChange = new EventEmitter<number>();

  canManage = hasFullInventoryAccess();

  constructor(
    private supplierService: SupplierService,
    private route: ActivatedRoute
  ) {}

  canEditRecord(supplier: Supplier): boolean {
    return this.canManage || canEditByTasks(this.myTasks, 'SUPPLIER', supplier.id);
  }

  get showActions(): boolean {
    return this.canManage || this.suppliers.some((s) => canEditByTasks(this.myTasks, 'SUPPLIER', s.id));
  }

  // First visible item number (1-based)
  get startItem(): number {
    if (this.total === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  // Last visible item number (1-based)
  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.total);
  }

  // Go to a specific page via the pagination controls
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.pageChange.emit(page);
  }

  // Search values
  searchQuery = '';
  showSuggestions = false;
  selectedSuggestionIndex = -1;

  // Store route subscription
  private routeSubscription?: Subscription;

  ngOnInit(): void {

    // Get search value from URL
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = params.get('search') ?? '';
    });

    // Load suppliers if parent has not provided them
    if (!this.suppliers.length) {

      this.supplierService.getSuppliers({ page: 1, pageSize: 10 }).subscribe({
        next: (response) => {
          this.suppliers = response.items;
        },

        error: (error) => {
          console.error('Error loading suppliers:', error);
        }
      });
    }
  }


  // Filter suppliers based on search

    get filteredSuppliers(): Supplier[] {
  
      const query = this.searchQuery.trim().toLowerCase();
  
      // If search is empty, show all suppliers
      if (!query) {
        return this.suppliers;
      }
  
      // Search by supplier name or contact email
      const result = this.suppliers.filter((supplier) => {
  
        let descriptionMatches = false;
  
        // Check description only if it exists
        if (supplier.description) {
          descriptionMatches =
            supplier.description.toLowerCase().includes(query);
        }
  
        return (
          supplier.name.toLowerCase().includes(query) ||
          supplier.contact_email.toLowerCase().includes(query) ||
          descriptionMatches
        );
  
      });
  
      return result;
    }
  
  
    // Get search suggestions
    get suggestions(): Supplier[] {
  
      const query = this.searchQuery.trim().toLowerCase();
  
      // If search is empty, show no suggestions
      if (!query) {
        return [];
      }
  
      // Find matching suppliers
      const matches = this.suppliers.filter((supplier) => {
  
        let descriptionMatches = false;
  
        // Check description only if it exists
        if (supplier.description) {
          descriptionMatches =
            supplier.description.toLowerCase().includes(query);
        }
  
        return (
          supplier.name.toLowerCase().includes(query) ||
          supplier.contact_email.toLowerCase().includes(query) ||
          descriptionMatches
        );
  
      });
  
      // Remove duplicate supplier names
      const uniqueSuppliers = this.dedupe(matches);
  
      // Show maximum 8 suggestions
      const result = uniqueSuppliers.slice(0, 8);
  
      return result;
    }
  
  
    // When user types in search box
    onSearchInput(query: string): void {
  
      this.searchQuery = query;
  
      this.showSuggestions = true;
  
      this.selectedSuggestionIndex = -1;
    }
  
  
    // When user selects a suggestion
    selectSuggestion(supplier: Supplier): void {
  
      this.searchQuery = supplier.name;
  
      this.showSuggestions = false;
  
      this.selectedSuggestionIndex = -1;
    }
  
  
    // Handle keyboard events
    onSearchKeydown(event: KeyboardEvent): void {
  
      const list = this.suggestions;
  
      // Stop if there are no suggestions
      if (list.length === 0) {
        return;
      }
  
      // Arrow Down
      if (event.key === 'ArrowDown') {
  
        event.preventDefault();
  
        this.selectedSuggestionIndex =
          (this.selectedSuggestionIndex + 1) % list.length;
      }
  
      // Arrow Up
      else if (event.key === 'ArrowUp') {
  
        event.preventDefault();
  
        if (this.selectedSuggestionIndex <= 0) {
          this.selectedSuggestionIndex = list.length - 1;
        } else {
          this.selectedSuggestionIndex =
            this.selectedSuggestionIndex - 1;
        }
      }
  
      // Enter
      else if (
        event.key === 'Enter' &&
        this.selectedSuggestionIndex >= 0
      ) {
  
        event.preventDefault();
  
        this.selectSuggestion(
          list[this.selectedSuggestionIndex]
        );
      }
  
      // Escape
      else if (event.key === 'Escape') {
  
        this.showSuggestions = false;
      }
    }
  
  
    // Hide suggestions when search box loses focus
    onBlurSuggestions(): void {
  
      setTimeout(() => {
  
        this.showSuggestions = false;
        this.selectedSuggestionIndex = -1;
  
      }, 150);
    }
  
  
    // Remove duplicate suppliers
    private dedupe(items: Supplier[]): Supplier[] {
  
      const seen = new Set<string>();
  
      const result = items.filter((supplier) => {
  
        const key = supplier.name.toLowerCase();
  
        // Supplier already exists
        if (seen.has(key)) {
          return false;
        }
  
        // Add supplier name to Set
        seen.add(key);
  
        return true;
      });
  
      return result;
    }
  
  
    // Delete supplier
    deleteSupplier(id: string): void {
  
      // Find supplier that user wants to delete
      const supplier = this.suppliers.find((item) => {
  
        return item.id === id;
  
      });
  
      // Stop if supplier was not found
      if (!supplier) {
        return;
      }
  
      // Ask user for confirmation
      const confirmed = window.confirm(
        `Are you sure you want to delete "${supplier.name}"?`
      );
  
      // Stop if user cancels
      if (!confirmed) {
        return;
      }
  
      // Delete supplier using API
      this.supplierService.deleteSupplier(id).subscribe({
        next: () => {
  
          // Remove deleted supplier from UI
          this.suppliers = this.suppliers.filter((item) => {
  
            return item.id !== id;
  
          });
  
        },
  
        error: (error) => {
          console.error('Error deleting supplier:', error);
        }
      });
    }
  
  
    // Unsubscribe from route subscription
    ngOnDestroy(): void {
  
      this.routeSubscription?.unsubscribe();
  
    }
  
}