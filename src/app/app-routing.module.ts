import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@guards/auth.guard';
import { UnauthGuard } from '@guards/unauth.guard';
import { EventsModule } from './events/events.module';

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
        loadChildren: () => EventsModule,
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
