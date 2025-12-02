import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-jefe-carrera-layout',
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class JefeCarreraLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  sidebarOpen = signal(true);

  menuItems = [
    { path: '/jefe-carrera', label: 'Dashboard', icon: 'home' },
    { path: '/jefe-carrera/docentes', label: 'Docentes', icon: 'academic-cap' },
    { path: '/jefe-carrera/registros', label: 'Registros', icon: 'clipboard-list' }
  ];

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  logout(): void {
    this.authService.logout();
  }
}
