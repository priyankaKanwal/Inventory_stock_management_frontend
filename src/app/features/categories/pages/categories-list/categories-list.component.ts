import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../categories.component';


@Component({
  selector: 'app-categories-list',
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.css'
})
export class CategoriesListComponent implements OnInit, OnDestroy {

  // Categories received from parent component
  @Input() categories: Category[] = [];

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
    private categoryService: CategoryService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    // Get search value from URL
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = params.get('search') ?? '';
    });
  }


  // Filter categories based on search
  get filteredCategories(): Category[] {

    const query = this.searchQuery.trim().toLowerCase();

    // If search is empty, show all categories
    if (!query) {
      return this.categories;
    }

    // Search by category name or description
    const result = this.categories.filter((category) => {

      let descriptionMatches = false;

      // Check description only if it exists
      if (category.description) {
        descriptionMatches =
          category.description.toLowerCase().includes(query);
      }

      return (
        category.name.toLowerCase().includes(query) ||
        descriptionMatches
      );

    });

    return result;
  }


  // Get search suggestions
  get suggestions(): Category[] {

    const query = this.searchQuery.trim().toLowerCase();

    // If search is empty, show no suggestions
    if (!query) {
      return [];
    }

    // Find matching categories
    const matches = this.categories.filter((category) => {

      let descriptionMatches = false;

      // Check description only if it exists
      if (category.description) {
        descriptionMatches =
          category.description.toLowerCase().includes(query);
      }

      return (
        category.name.toLowerCase().includes(query) ||
        descriptionMatches
      );

    });

    // Remove duplicate category names
    const uniqueCategories = this.dedupe(matches);

    // Show maximum 8 suggestions
    const result = uniqueCategories.slice(0, 8);

    return result;
  }


  // When user types in search box
  onSearchInput(query: string): void {

    this.searchQuery = query;

    this.showSuggestions = true;

    this.selectedSuggestionIndex = -1;
  }


  // When user selects a suggestion
  selectSuggestion(category: Category): void {

    this.searchQuery = category.name;

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


  // Remove duplicate categories
  private dedupe(items: Category[]): Category[] {

    const seen = new Set<string>();

    const result = items.filter((category) => {

      const key = category.name.toLowerCase();

      // Category already exists
      if (seen.has(key)) {
        return false;
      }

      // Add category name to Set
      seen.add(key);

      return true;
    });

    return result;
  }


  // Delete category
  deleteCategory(id: string): void {

    // Find category that user wants to delete
    const category = this.categories.find((item) => {

      return item.id === id;

    });

    // Stop if category was not found
    if (!category) {
      return;
    }

    // Ask user for confirmation
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    // Stop if user cancels
    if (!confirmed) {
      return;
    }

    // Delete category using API
    this.categoryService.deleteCategory(id).subscribe({

      next: () => {

        // Remove deleted category from UI
        this.categories = this.categories.filter((item) => {

          return item.id !== id;

        });

      },

      error: (error) => {
        console.error('Error deleting category:', error);
      }
    });
  }


  // Unsubscribe from route subscription
  ngOnDestroy(): void {

    this.routeSubscription?.unsubscribe();

  }
}