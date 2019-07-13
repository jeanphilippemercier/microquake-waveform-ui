import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WaveformComponent } from './waveform/waveform.component';
import { NotifierComponent } from './notifier/notifier.component';
import { SiteNetworkComponent } from './site-network/site-network.component';

import { AuthGuard } from '@guards/auth.guard';
import { UnauthGuard } from '@guards/unauth.guard';

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
  { path: 'access', component: SiteNetworkComponent, canActivate: [AuthGuard] },
  { path: 'notifier', component: NotifierComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
