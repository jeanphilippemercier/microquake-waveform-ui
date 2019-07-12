import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { WaveformComponent } from './waveform/waveform.component';
import { NotifierComponent } from './notifier/notifier.component';
import { SiteNetworkComponent } from './site-network/site-network.component';

const routes: Routes = [
  {
    path: '',
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
