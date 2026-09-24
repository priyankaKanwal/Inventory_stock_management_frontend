import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { isSuperAdmin, currentRole, hasRoles, MANAGER_ROLES } from '../../auth/utils/roles';

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

  get canViewMyTasks(): boolean {
    return !isSuperAdmin();
  }

  get canManageTasks(): boolean {
    return isSuperAdmin() || hasRoles(...MANAGER_ROLES);
  }

  get canManageUsers(): boolean {
    return isSuperAdmin();
  }

  get roleBadge(): string {
    return currentRole();
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