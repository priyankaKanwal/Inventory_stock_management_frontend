import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupplierService, Supplier } from '../../../../services/supplier.service';

@Component({
  selector: 'app-suppliers-list',
  templateUrl: './supplier-list.component.html',
  styleUrl: './supplier-list.component.css'
})
export class SupplierListComponent implements OnInit, OnDestroy {

  // Suppliers received from parent component
  @Input() suppliers: Supplier[] = [];

  // Whether current user is an admin (full CRUD access)
  isAdmin =
    localStorage.getItem('role')?.toUpperCase() === 'ADMIN';

  // Search values
  searchQuery = '';
  showSuggestions = false;
  selectedSuggestionIndex = -1;

  // Store route subscription
  private routeSubscription?: Subscription;

  constructor(
    private supplierService: SupplierService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    // Get search value from URL
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = params.get('search') ?? '';
    });

    // Load suppliers if parent has not provided them
    if (!this.suppliers.length) {

      this.supplierService.getSuppliers().subscribe({
        next: (suppliers) => {
          this.suppliers = suppliers;
        },

        error: (error) => {
          console.error('Error loading suppliers:', error);
        }
      });
    }
  }

  ngOnDestroy(): void {

    // Unsubscribe when component is destroyed
    this.routeSubscription?.unsubscribe();
  }

  // Filter suppliers based on search
  get filteredSuppliers(): Supplier[] {

    const query = this.searchQuery.trim().toLowerCase();

    // If search is empty, show all suppliers
    if (!query) {
      return this.suppliers;
    }

    // Filter by name, email, phone or address
    return this.suppliers.filter((supplier) => {

      return (
        supplier.name.toLowerCase().includes(query) ||
        supplier.contact_email.toLowerCase().includes(query) ||
        supplier.phone.toLowerCase().includes(query) ||
        supplier.address.toLowerCase().includes(query)
      );

    });
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

      return (
        supplier.name.toLowerCase().includes(query) ||
        supplier.contact_email.toLowerCase().includes(query) ||
        supplier.phone.toLowerCase().includes(query) ||
        supplier.address.toLowerCase().includes(query)
      );

    });

    // Show maximum 8 suggestions
    return matches.slice(0, 8);
  }

  // When user types in search box
  onSearchInput(query: string): void {

    this.searchQuery = query;

    this.showSuggestions = true;

    this.selectedSuggestionIndex = -1;
  }

  // When user selects a suggestion
  selectSuggestion(suggestion: Supplier): void {

    this.searchQuery = suggestion.name;

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

  // Delete supplier
  deleteSupplier(id: number): void {

    this.supplierService.deleteSupplier(id).subscribe({

      next: () => {

        // Remove deleted supplier from UI
        this.suppliers = this.suppliers.filter((supplier) => {

          return supplier.id !== id;

        });
      },

      error: (error) => {

        console.error('Error deleting supplier:', error);
      }
    });
  }
}