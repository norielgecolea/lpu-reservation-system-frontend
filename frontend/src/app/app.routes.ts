import { Routes } from '@angular/router';

import { authGuard, facilitiesGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'users',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/users/users').then((m) => m.Users),
  },
  {
    path: 'users/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/users/add-user').then((m) => m.AddUser),
  },
  {
    path: 'users/:employeeId/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/users/edit-user').then((m) => m.EditUser),
  },
  {
    path: 'equipments',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/equipments/equipments').then((m) => m.Equipments),
  },
  {
    path: 'equipments/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/equipments/add-equipment').then((m) => m.AddEquipment),
  },
  {
    path: 'equipments/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/equipments/edit-equipment').then((m) => m.EditEquipment),
  },
  {
    path: 'vehicles',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/vehicles/vehicles').then((m) => m.Vehicles),
  },
  {
    path: 'vehicles/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/vehicles/add-vehicle').then((m) => m.AddVehicle),
  },
  {
    path: 'vehicles/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/vehicles/edit-vehicle').then((m) => m.EditVehicle),
  },
  {
    path: 'reservation/flt',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/reservations/flt/flt-reservations').then((m) => m.FltReservations),
  },
  // ── Facilities Admin (/facilities/*) ──────────────────────────────────────
  {
    path: 'facilities/dashboard',
    canActivate: [facilitiesGuard],
    loadComponent: () =>
      import('./features/facilities/dashboard/facilities-dashboard').then((m) => m.FacilitiesDashboard),
  },
  {
    path: 'facilities/users',
    canActivate: [facilitiesGuard],
    loadComponent: () =>
      import('./features/facilities/users/facilities-users').then((m) => m.FacilitiesUsers),
  },
  {
    path: 'facilities/users/new',
    canActivate: [facilitiesGuard],
    loadComponent: () =>
      import('./features/facilities/users/facilities-add-user').then((m) => m.FacilitiesAddUser),
  },
  {
    path: 'facilities/users/:id/edit',
    canActivate: [facilitiesGuard],
    loadComponent: () =>
      import('./features/facilities/users/facilities-edit-user').then((m) => m.FacilitiesEditUser),
  },
  {
    path: 'facilities/reservation/flt',
    canActivate: [facilitiesGuard],
    loadComponent: () =>
      import('./features/admin/reservations/flt/flt-reservations').then((m) => m.FltReservations),
  },
  {
    path: 'facilities/reservation/gymnasium',
    canActivate: [facilitiesGuard],
    loadComponent: () =>
      import('./features/facilities/gymnasium/facilities-gym').then((m) => m.FacilitiesGym),
  },
  {
    path: 'facilities/reservation/van',
    canActivate: [facilitiesGuard],
    loadComponent: () =>
      import('./features/facilities/van/facilities-van').then((m) => m.FacilitiesVan),
  },
  // ─────────────────────────────────────────────────────────────────────────

  {
    path: 'customer',
    loadChildren: () =>
      import('./features/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
