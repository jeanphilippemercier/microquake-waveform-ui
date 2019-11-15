import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '@app/shared/shared.module';
import { MaintenanceFormComponent } from './components/maintenance-form/maintenance-form.component';
import { MaintenanceListPageComponent } from './pages/maintenance-list-page/maintenance-list-page.component';
import { MaintenanceTableComponent } from './components/maintenance-table/maintenance-table.component';
import { MaintenanceInputComponent } from './components/maintenance-input/maintenance-input.component';
import { MaintenanceDialogComponent } from './dialogs/maintenance-dialog/maintenance-dialog.component';
import { MaintenanceFormDialogComponent } from './dialogs/maintenance-form-dialog/maintenance-form-dialog.component';
import { MaintenanceTable2Component } from './components/maintenance-table-2/maintenance-table-2.component';


const ROUTES: Routes = [
  {
    path: 'maintenance',
    redirectTo: 'maintenance/',
    pathMatch: 'full'
  },
  {
    path: 'maintenance/:maintenanceEventId',
    component: MaintenanceListPageComponent,
  },
];

@NgModule({
  declarations: [
    MaintenanceFormComponent,
    MaintenanceTableComponent,
    MaintenanceTable2Component,
    MaintenanceListPageComponent,
    MaintenanceInputComponent,
    MaintenanceDialogComponent,
    MaintenanceFormDialogComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(ROUTES),
  ],
  exports: [
    MaintenanceTableComponent,
    MaintenanceTable2Component,
    MaintenanceFormComponent,
    MaintenanceListPageComponent,
    MaintenanceInputComponent,
    MaintenanceDialogComponent,
    MaintenanceFormDialogComponent
  ],
  entryComponents: [
    MaintenanceDialogComponent,
    MaintenanceFormDialogComponent
  ]
})
export class MaintenanceModule { }
