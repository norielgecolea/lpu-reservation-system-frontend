import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing-page/landing-page').then((m) => m.LandingPage),
  },
  {
    path: 'book/boardroom',
    loadComponent: () =>
      import('./boardroom-reservation/boardroom-reservation').then((m) => m.BoardroomReservation),
  },
];
