import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-becario-layout',
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class BecarioLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  sidebarOpen = signal(true);

  menuItems = [
    { path: '/becario', label: 'Dashboard', icon: 'home' },
    { path: '/becario/registro-entrada', label: 'Registrar Entrada', icon: 'login' },
    { path: '/becario/registro-salida', label: 'Registrar Salida', icon: 'logout' },
    { path: '/becario/llaves-actuales', label: 'Llaves Actuales', icon: 'key' },
    { path: '/becario/historial', label: 'Historial', icon: 'clipboard-list' }
  ];

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  logout(): void {
    this.authService.logout();
  }
}
