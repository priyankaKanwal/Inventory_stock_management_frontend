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
        localStorage.removeItem('access_token');
        this.router.navigate(['/login']);
      },

      error: () => {
        localStorage.removeItem('access_token');
        this.router.navigate(['/login']);
      }
    });
  }
}