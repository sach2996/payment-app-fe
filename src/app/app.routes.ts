import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'payments' },
  {
    path: 'payments',
    loadComponent: () =>
      import('./components/payment-list/payment-list.component').then(
        (m) => m.PaymentListComponent
      ),
  },
  {
    path: 'payments/add',
    loadComponent: () =>
      import('./components/add-payment/add-payment.component').then(
        (m) => m.AddPaymentComponent
      ),
  },
  {
    path: 'payments/view/:id',
    loadComponent: () =>
      import('./components/view-payment/view-payment.component').then(
        (m) => m.ViewPaymentComponent
      ),
  },
  {
    path: 'payments/edit/:id',
    loadComponent: () =>
      import('./components/edit-payment/edit-payment.component').then(
        (m) => m.EditPaymentComponent
      ),
  },
];
