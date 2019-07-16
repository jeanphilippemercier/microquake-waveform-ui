import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WaveformComponent } from './waveform/waveform.component';
import { NotifierComponent } from './notifier/notifier.component';
import { AuthGuard } from '@guards/auth.guard';
import { UnauthGuard } from '@guards/unauth.guard';
import { EventListComponent } from './events/pages/event-list/event-list.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [UnauthGuard],
    redirectTo: '',
    pathMatch: 'full'
  },
  { path: 'dashboard/:reload', component: WaveformComponent, canActivate: [AuthGuard] },
  { path: 'dashboard#', component: WaveformComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: WaveformComponent, canActivate: [AuthGuard] },
  { path: 'events', component: EventListComponent, canActivate: [AuthGuard] },
  { path: 'notifier', component: NotifierComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
