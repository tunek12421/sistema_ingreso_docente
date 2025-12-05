import { Routes } from '@angular/router';
import { JefeCarreraLayout } from './layout/layout';
import { roleGuard } from '../../core/guards/role.guard';

export const JEFE_CARRERA_ROUTES: Routes = [
  {
    path: '',
    component: JefeCarreraLayout,
    canActivate: [roleGuard(['jefe_carrera'])],
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.JefeCarreraDashboard)
      },
      {
        path: 'docentes',
        loadComponent: () => import('../admin/docentes/docentes-list').then(m => m.DocentesList)
      },
      {
        path: 'registros',
        loadComponent: () => import('./registros/registros').then(m => m.JefeCarreraRegistros)
      }
    ]
  }
];
