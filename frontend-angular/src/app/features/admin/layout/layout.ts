import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  sidebarOpen = signal(true);

  menuItems = [
    { path: '/admin', label: 'Dashboard', icon: 'home' },
    { path: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
    { path: '/admin/docentes', label: 'Docentes', icon: 'academic-cap' },
    { path: '/admin/turnos', label: 'Turnos', icon: 'clock' },
    { path: '/admin/llaves', label: 'Llaves', icon: 'key' }
  ];

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  logout(): void {
    this.authService.logout();
  }
}
