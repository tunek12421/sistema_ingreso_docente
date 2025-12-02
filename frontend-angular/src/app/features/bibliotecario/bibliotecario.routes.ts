import { Routes } from '@angular/router';
import { BibliotecarioLayout } from './layout/layout';
import { roleGuard } from '../../core/guards/role.guard';

export const BIBLIOTECARIO_ROUTES: Routes = [
  {
    path: '',
    component: BibliotecarioLayout,
    canActivate: [roleGuard(['bibliotecario'])],
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.BibliotecarioDashboard)
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
