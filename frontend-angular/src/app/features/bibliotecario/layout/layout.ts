import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-bibliotecario-layout',
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class BibliotecarioLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  sidebarOpen = signal(true);

  menuItems = [
    { path: '/bibliotecario', label: 'Dashboard', icon: 'home' },
    { path: '/bibliotecario/registro-entrada', label: 'Registrar Entrada', icon: 'login' },
    { path: '/bibliotecario/registro-salida', label: 'Registrar Salida', icon: 'logout' },
    { path: '/bibliotecario/llaves-actuales', label: 'Llaves Actuales', icon: 'key' },
    { path: '/bibliotecario/historial', label: 'Historial', icon: 'clipboard-list' }
  ];

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  logout(): void {
    this.authService.logout();
  }
}
