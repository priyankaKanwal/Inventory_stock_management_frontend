import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { UserService, User } from '../../../../services/user.service';
import { ALL_ROLES, AppRole } from '../../../../auth/utils/roles';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit, OnDestroy {

  users: User[] = [];

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;

  searchQuery = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  updatingId: string | null = null;

  roleOptions: AppRole[] = ALL_ROLES;

  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  get filteredUsers(): User[] {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      return this.users;
    }

    return this.users.filter((user) =>
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptions.push(
      this.userService
        .getUsers({ page: this.currentPage, pageSize: this.pageSize })
        .subscribe({
          next: (response) => {
            this.users = response.items || [];
            this.currentPage = response.page;
            this.pageSize = response.page_size ?? this.pageSize;
            this.total = response.total;
            this.totalPages = response.total_pages;
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage =
              error.error?.detail ||
              'Failed to load users. The user service may not be available yet.';
          }
        })
    );
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

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.loadUsers();
  }

  roleClass(role: string): string {
    const r = (role || '').toUpperCase();

    if (r === 'SUPER_ADMIN') {
      return 'rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700';
    }

    if (r === 'INVENTORY_MANAGER' || r === 'ORDER_MANAGER') {
      return 'rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700';
    }

    if (r === 'INVENTORY_STAFF' || r === 'ORDER_STAFF') {
      return 'rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700';
    }

    return 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700';
  }

  changeRole(user: User, role: string): void {
    if (!role || role === user.role) {
      return;
    }

    const confirmed = window.confirm(
      `Change role of "${user.username}" from ${user.role} to ${role}?`
    );

    if (!confirmed) {
      return;
    }

    this.updatingId = user.id;
    this.successMessage = '';
    this.errorMessage = '';

    this.subscriptions.push(this.userService.changeRole(user.id, role).subscribe({
      next: (updated) => {
        this.updatingId = null;
        user.role = updated.role;
        this.successMessage = `Role updated for ${user.username}.`;
      },
      error: (error) => {
        this.updatingId = null;
        this.errorMessage =
          error.error?.detail ||
          'Failed to change role.';
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}