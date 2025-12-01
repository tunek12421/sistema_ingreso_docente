import { Routes } from '@angular/router';

export const JEFE_CARRERA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)
  }
];
