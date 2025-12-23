import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminRoleGuard } from './guards/admin-role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [authGuard],
  },

  // --------------------------------------------------------------------------
  // 1. RUTA DE LECTURA (Listado de Ingredientes): REQUIERE SÓLO AUTENTICACIÓN
  // --------------------------------------------------------------------------
  {
    path: 'pages/ingredientes',
    loadComponent: () => import('./pages/ingredientes/ingredientes.page').then(m => m.IngredientesPage),
    // 🚨 Permite acceso a todos los usuarios logueados ('user' y 'administrador')
    canActivate: [authGuard],
  },

  // -------------------------------------------------------------------------
  // 2. RUTAS DE ESCRITURA (Formularios CRUD): REQUIERE ROL DE ADMINISTRADOR
  // -------------------------------------------------------------------------
  {
    path: 'ingredientes/new',
    loadComponent: () => import('./pages/ingredientes/ingrediente-form/ingrediente-form.page').then(m => m.IngredienteFormPage),
    // Requiere autenticación Y rol de administrador
    canActivate: [authGuard, adminRoleGuard]
  },
  {
    path: 'ingredientes/:id',
    loadComponent: () => import('./pages/ingredientes/ingrediente-form/ingrediente-form.page').then(m => m.IngredienteFormPage),
    // Requiere autenticación Y rol de administrador
    canActivate: [authGuard, adminRoleGuard]
  },
  {
    path: 'cotizacion',
    loadComponent: () => import('./pages/cotizacion/cotizacion.page').then(m => m.CotizacionPage),
    canActivate: [authGuard],
  },
];
