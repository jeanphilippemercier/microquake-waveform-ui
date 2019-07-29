import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@guards/auth.guard';
import { UnauthGuard } from '@guards/unauth.guard';
import { EventShellComponent } from './events/pages/event-shell/event-shell.component';
import { EventsModule } from './events/events.module';

const routes: Routes = [
  {
    path: '',
    component: EventShellComponent,
    canActivate: [UnauthGuard],
    pathMatch: 'full',
  },
  {
    path: '',
    component: EventShellComponent,
    canActivate: [],
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'events',
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
