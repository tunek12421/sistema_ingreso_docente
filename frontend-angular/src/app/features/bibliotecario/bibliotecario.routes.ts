import { Routes } from '@angular/router';

export const BIBLIOTECARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)
  }
];
