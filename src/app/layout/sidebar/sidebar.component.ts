import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  canManageCategories,
  canManageCustomers,
  canManageSuppliers,
  canManageTasks,
  canViewOrders,
  canViewPredictions,
  canViewProducts,
  currentRole,
  isSuperAdmin,
  roleLabel
} from '../../auth/utils/roles';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() sidebarClosed = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get canViewProducts(): boolean {
    return canViewProducts();
  }

  get canViewCategories(): boolean {
    return canManageCategories();
  }

  get canViewSuppliers(): boolean {
    return canManageSuppliers();
  }

  get canViewOrders(): boolean {
    return canViewOrders();
  }

  get canViewCustomers(): boolean {
    return canManageCustomers();
  }

  get canManageTaskDelegation(): boolean {
    return canManageTasks();
  }

  get canViewPredictions(): boolean {
    return canViewPredictions();
  }

  get canViewUsers(): boolean {
    return isSuperAdmin();
  }

  get roleBadge(): string {
    return roleLabel(currentRole());
  }

  closeSidebar(): void {
    this.sidebarClosed.emit();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.clearSession();
        this.router.navigate(['/login']);
      },

      error: () => {
        this.authService.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }
}