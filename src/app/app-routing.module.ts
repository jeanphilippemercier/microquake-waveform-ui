import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WaveformComponent } from '@app/waveform/waveform.component';
import { AuthGuard } from '@guards/auth.guard';
import { UnauthGuard } from '@guards/unauth.guard';
import { EventListComponent } from '@app/events/pages/event-list/event-list.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [UnauthGuard],
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: '',
    canActivate: [],
    canActivateChild: [AuthGuard],
    children: [
      { path: 'dashboard/:reload', component: WaveformComponent, canActivate: [AuthGuard] },
      { path: 'dashboard#', component: WaveformComponent, canActivate: [AuthGuard] },
      { path: 'dashboard', component: WaveformComponent, canActivate: [AuthGuard] },
      { path: 'events', component: EventListComponent, canActivate: [AuthGuard] },
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
