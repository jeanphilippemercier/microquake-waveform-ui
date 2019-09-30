import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { MaintenanceFormComponent } from './components/maintenance-form/maintenance-form.component';
import { RouterModule, Routes } from '@angular/router';
import { MaintenanceListPageComponent } from './pages/maintenance-list-page/maintenance-list-page.component';
import { MaintenanceTableComponent } from './components/maintenance-table/maintenance-table.component';
import { MaintenanceInputComponent } from './components/maintenance-input/maintenance-input.component';
import { MaintenanceDialogComponent } from './dialogs/maintenance-dialog/maintenance-dialog.component';


const ROUTES: Routes = [
  {
    path: 'maintenance',
    redirectTo: 'maintenance',
    pathMatch: 'full'
  },
  {
    path: 'maintenance',
    component: MaintenanceListPageComponent,
  },
];

@NgModule({
  declarations: [
    MaintenanceFormComponent,
    MaintenanceTableComponent,
    MaintenanceListPageComponent,
    MaintenanceInputComponent,
    MaintenanceDialogComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(ROUTES),
  ],
  exports: [
    MaintenanceTableComponent,
    MaintenanceFormComponent,
    MaintenanceListPageComponent,
    MaintenanceInputComponent,
    MaintenanceDialogComponent
  ],
  entryComponents: [
    MaintenanceDialogComponent
  ]
})
export class MaintenanceModule { }
