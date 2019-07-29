import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@guards/auth.guard';
import { UnauthGuard } from '@guards/unauth.guard';
import { EventListComponent } from '@app/events/pages/event-list/event-list.component';
import { EventDetailComponent } from './events/pages/event-detail/event-detail.component';
import { EventShellComponent } from './events/pages/event-shell/event-shell.component';

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
      { path: 'events', component: EventListComponent, canActivate: [AuthGuard] },
      { path: 'events/:eventId', component: EventDetailComponent, canActivate: [AuthGuard] },
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
