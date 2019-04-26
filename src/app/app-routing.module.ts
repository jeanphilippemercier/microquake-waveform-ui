import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { WaveformComponent } from './waveform/waveform.component';
import { NotifierComponent } from './notifier/notifier.component';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  // { path: 'dashboard', component: WaveformComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: WaveformComponent },
  { path: 'notifier', component: NotifierComponent },
  { path: 'login', component: LoginComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
