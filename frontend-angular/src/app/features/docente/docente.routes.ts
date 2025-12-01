import { Routes } from '@angular/router';

export const DOCENTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)
  }
];
