import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '@app/shared/shared.module';
import { InventorySiteListPageComponent } from './pages/site/inventory-site-list-page/inventory-site-list-page.component';
import { InventorySiteDetailPageComponent } from './pages/site/inventory-site-detail-page/inventory-site-detail-page.component';
import { InventorySensorListPageComponent } from './pages/sensor/inventory-sensor-list-page/inventory-sensor-list-page.component';
import { InventorySensorDetailPageComponent } from './pages/sensor/inventory-sensor-detail-page/inventory-sensor-detail-page.component';
import { ComponentTableComponent } from './components/component/component-table/component-table.component';
import { SensorFormComponent } from './components/sensor/sensor-form/sensor-form.component';
import { ComponentFormComponent } from './components/component/component-form/component-form.component';
import { InventoryStationListPageComponent } from './pages/station/inventory-station-list-page/inventory-station-list-page.component';
import { InventoryStationDetailPageComponent } from './pages/station/inventory-station-detail-page/inventory-station-detail-page.component';
import { StationFormComponent } from './components/station/station-form/station-form.component';
import { InventorySensorTypeListPageComponent } from './pages/sensor-type/inventory-sensor-type-list-page/inventory-sensor-type-list-page.component';
import { SensorTypeFormComponent } from './components/sensor-type/sensor-type-form/sensor-type-form.component';
import { InventoryCableTypeListPageComponent } from './pages/cable-type/inventory-cable-type-list-page/inventory-cable-type-list-page.component';
import { CableTypeFormComponent } from './components/cable-type/cable-type-form/cable-type-form.component';
import { MaintenanceModule } from '@app/maintenance/maintenance.module';
import { StationTableComponent } from './components/station/station-table/station-table.component';
import { SensorTableComponent } from './components/sensor/sensor-table/sensor-table.component';
import { InventoryBoreholeDetailPageComponent } from './pages/borehole/inventory-borehole-detail-page/inventory-borehole-detail-page.component';
import { InventoryBoreholeListPageComponent } from './pages/borehole/inventory-borehole-list-page/inventory-borehole-list-page.component';
import { BoreholeFormComponent } from './components/borehole/borehole-form/borehole-form.component';
import { BoreholeTableComponent } from './components/borehole/borehole-table/borehole-table.component';
import { MicroquakeEventTypeFormComponent } from './components/microquake-event-type/microquake-event-type-form/microquake-event-type-form.component';
import { InventoryMicroquakeEventTypeListPageComponent } from './pages/microquake-event-type/inventory-microquake-event-type-list-page/inventory-microquake-event-type-list-page.component';
import { MicroquakeEventTypeTableComponent } from './components/microquake-event-type/microquake-event-type-table/microquake-event-type-table.component';
import { MicroquakeEventTypeFormDialogComponent } from './dialogs/microquake-event-type-form-dialog/microquake-event-type-form-dialog.component';
import { BoreholeSurveyFileDialogComponent } from './dialogs/borehole-survey-file-dialog/borehole-survey-file-dialog.component';
import { BoreholeInterpolationDialogComponent } from './dialogs/borehole-interpolation-dialog/borehole-interpolation-dialog.component';
import { SensorFormDialogComponent } from './dialogs/sensor-form-dialog/sensor-form-dialog.component';
import { CableTypeTableComponent } from './components/cable-type/cable-type-table/cable-type-table.component';
import { CableTypeFormDialogComponent } from './dialogs/cable-type-form-dialog/cable-type-form-dialog.component';
import { SensorTypeFormDialogComponent } from './dialogs/sensor-type-form-dialog/sensor-type-form-dialog.component';
import { SensorTypeTableComponent } from './components/sensor-type/sensor-type-table/sensor-type-table.component';
import { StationFormDialogComponent } from './dialogs/station-form-dialog/station-form-dialog.component';
import { BoreholeFormDialogComponent } from './dialogs/borehole-form-dialog/borehole-form-dialog.component';
import { ComponentTable2Component } from './components/component/component-table-2/component-table-2.component';
import { ComponentFormDialogComponent } from './dialogs/component-form-dialog/component-form-dialog.component';
import { PageMode } from '@interfaces/core.interface';

const ROUTES: Routes = [
  {
    path: 'inventory',
    redirectTo: 'inventory/sites',
    pathMatch: 'full'
  },
  {
    path: 'inventory/sites',
    component: InventorySiteListPageComponent,
  },
  {
    path: 'inventory/sites/:siteId',
    component: InventorySiteDetailPageComponent,
  },
  {
    path: 'inventory/stations',
    component: InventoryStationListPageComponent,
  },
  {
    path: 'inventory/stations/create',
    component: InventoryStationDetailPageComponent,
    data: {
      mode: PageMode.CREATE
    }
  },
  {
    path: 'inventory/stations/:id',
    redirectTo: 'inventory/stations/:id/',
  },
  {
    path: 'inventory/stations/:id/:tabId',
    component: InventoryStationDetailPageComponent,
  },
  {
    path: 'inventory/sensors',
    component: InventorySensorListPageComponent,
  },
  {
    path: 'inventory/sensors/:id',
    redirectTo: 'inventory/sensors/:id/',
  },
  {
    path: 'inventory/sensors/:id/:tabId',
    component: InventorySensorDetailPageComponent,
  },
  {
    path: 'inventory/sensor-types',
    redirectTo: 'inventory/sensor-types/',
  },
  {
    path: 'inventory/sensor-types/:sensorTypeId',
    component: InventorySensorTypeListPageComponent,
  },
  {
    path: 'inventory/cable-types',
    redirectTo: 'inventory/cable-types/',
  },
  {
    path: 'inventory/cable-types/:cableTypeId',
    component: InventoryCableTypeListPageComponent,
  },
  {
    path: 'inventory/boreholes',
    component: InventoryBoreholeListPageComponent,
  },
  {
    path: 'inventory/boreholes/:id',
    redirectTo: 'inventory/boreholes/:id/'
  },
  {
    path: 'inventory/boreholes/:id/:tabId',
    component: InventoryBoreholeDetailPageComponent,
  },
  {
    path: 'inventory/microquake-event-types',
    redirectTo: 'inventory/microquake-event-types/',
  },
  {
    path: 'inventory/microquake-event-types/:microquakeEventTypeId',
    component: InventoryMicroquakeEventTypeListPageComponent,
  },
];

const pageDetailComponents = [
  InventorySiteDetailPageComponent,
  InventoryStationDetailPageComponent,
  InventorySensorDetailPageComponent,
  InventoryBoreholeDetailPageComponent
];

const pageListComponents = [
  InventorySiteListPageComponent,
  InventoryStationListPageComponent,
  InventorySensorListPageComponent,
  InventorySensorTypeListPageComponent,
  InventoryCableTypeListPageComponent,
  InventoryBoreholeListPageComponent,
  InventoryMicroquakeEventTypeListPageComponent
];

const formComponents = [
  CableTypeFormComponent,
  StationFormComponent,
  SensorFormComponent,
  ComponentFormComponent,
  SensorTypeFormComponent,
  BoreholeFormComponent,
  MicroquakeEventTypeFormComponent
];

const tableComponents = [
  ComponentTableComponent,
  ComponentTable2Component,
  StationTableComponent,
  SensorTableComponent,
  BoreholeTableComponent,
  MicroquakeEventTypeTableComponent,
  CableTypeTableComponent,
  SensorTypeTableComponent
];

const formDialogComponents = [
  MicroquakeEventTypeFormDialogComponent,
  SensorFormDialogComponent,
  CableTypeFormDialogComponent,
  SensorTypeFormDialogComponent,
  StationFormDialogComponent,
  BoreholeFormDialogComponent,
  ComponentFormDialogComponent
];

const otherDialogComponents = [
  BoreholeSurveyFileDialogComponent,
  BoreholeInterpolationDialogComponent
];
@NgModule({
  declarations: [
    ...pageDetailComponents,
    ...pageListComponents,
    ...formComponents,
    ...tableComponents,
    ...formDialogComponents,
    ...otherDialogComponents
  ],
  imports: [
    SharedModule,
    MaintenanceModule,
    RouterModule.forChild(ROUTES),
  ],
  exports: [RouterModule],
  entryComponents: [
    ...formDialogComponents,
    ...otherDialogComponents
  ]
})
export class InventoryModule { }
