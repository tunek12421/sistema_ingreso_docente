import { Routes } from '@angular/router';
import { BecarioLayout } from './layout/layout';

export const BECARIO_ROUTES: Routes = [
  {
    path: '',
    component: BecarioLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.BecarioDashboard)
      },
      {
        path: 'registro-entrada',
        loadComponent: () => import('./registro-entrada/registro-entrada').then(m => m.RegistroEntrada)
      },
      {
        path: 'registro-salida',
        loadComponent: () => import('./registro-salida/registro-salida').then(m => m.RegistroSalida)
      },
      {
        path: 'llaves-actuales',
        loadComponent: () => import('./llaves-actuales/llaves-actuales').then(m => m.LlavesActuales)
      },
      {
        path: 'historial',
        loadComponent: () => import('./historial/historial').then(m => m.Historial)
      }
    ]
  }
];
