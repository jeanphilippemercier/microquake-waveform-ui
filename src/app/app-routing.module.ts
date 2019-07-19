import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WaveformComponent } from '@app/events/pages/waveform/waveform.component';
import { AuthGuard } from '@guards/auth.guard';
import { UnauthGuard } from '@guards/unauth.guard';
import { EventListComponent } from '@app/events/pages/event-list/event-list.component';
import { EventDetailComponent } from './events/pages/event-detail/event-detail.component';
import { EventListOldComponent } from './events/pages/event-list-old/event-list-old.component';
import { EventShellOldComponent } from './events/pages/event-shell-old/event-shell-old.component';
import { EventShellComponent } from './events/pages/event-shell/event-shell.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [UnauthGuard],
    redirectTo: 'v1',
    pathMatch: 'full',
  },
  {
    path: 'v1',
    redirectTo: 'v1/events',
    pathMatch: 'full',
  },
  {
    path: 'v1',
    canActivate: [],
    component: EventShellOldComponent,
    canActivateChild: [AuthGuard],
    children: [
      { path: 'events', component: EventListOldComponent, canActivate: [AuthGuard] },
      { path: 'dashboard/:reload', component: WaveformComponent, canActivate: [AuthGuard] },
      { path: 'dashboard#', component: WaveformComponent, canActivate: [AuthGuard] },
      { path: 'dashboard', component: WaveformComponent, canActivate: [AuthGuard] },
    ]
  },
  {
    path: 'v2',
    redirectTo: 'v2/events',
    canActivate: [AuthGuard],
    pathMatch: 'full',
  },
  {
    path: 'v2',
    canActivate: [],
    component: EventShellComponent,
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
