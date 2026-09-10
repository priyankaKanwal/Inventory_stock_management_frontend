import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  @Input() isOpen = false;
  @Output() sidebarClosed = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  closeSidebar(): void {
    this.sidebarClosed.emit();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.clearSession();
        this.router.navigate(['/login']);
      },

      error: () => {
        this.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }

  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
  }
}