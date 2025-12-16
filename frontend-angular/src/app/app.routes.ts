import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['administrador'])],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'jefe-carrera',
    canActivate: [roleGuard(['jefe_carrera'])],
    loadChildren: () => import('./features/jefe-carrera/jefe-carrera.routes').then(m => m.JEFE_CARRERA_ROUTES)
  },
  {
    path: 'bibliotecario',
    canActivate: [roleGuard(['bibliotecario'])],
    loadChildren: () => import('./features/bibliotecario/bibliotecario.routes').then(m => m.BIBLIOTECARIO_ROUTES)
  },
  {
    path: 'becario',
    canActivate: [roleGuard(['becario'])],
    loadChildren: () => import('./features/becario/becario.routes').then(m => m.BECARIO_ROUTES)
  },
  {
    path: 'docente',
    canActivate: [roleGuard(['docente'])],
    loadChildren: () => import('./features/docente/docente.routes').then(m => m.DOCENTE_ROUTES)
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
