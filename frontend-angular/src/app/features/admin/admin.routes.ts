import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout').then(m => m.Layout),
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./usuarios/usuarios-list/usuarios-list').then(m => m.UsuariosList)
      },
      {
        path: 'turnos',
        loadComponent: () => import('./turnos/turnos-list').then(m => m.TurnosList)
      }
    ]
  }
];
