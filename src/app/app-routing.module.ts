import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@guards/auth.guard';
import { UnauthGuard } from '@guards/unauth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '',
    canActivate: [UnauthGuard],
    pathMatch: 'full',
  },
  {
    path: '',
    canActivate: [],
    canActivateChild: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./events/events.module').then(m => m.EventsModule),
      },
      {
        path: '',
        loadChildren: () => import('./inventory/inventory.module').then(m => m.InventoryModule),
      }
    ]
  },
  {
    path: '**',
    redirectTo: '',
    canActivate: [],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
