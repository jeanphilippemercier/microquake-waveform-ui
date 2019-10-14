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
import { InventoryCableTypeDetailComponent } from './components/cable-type/inventory-cable-type-detail/inventory-cable-type-detail.component';
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
    path: 'inventory/stations/:stationId',
    component: InventoryStationDetailPageComponent,
  },
  {
    path: 'inventory/sensors',
    component: InventorySensorListPageComponent,
  },
  {
    path: 'inventory/sensors/:sensorId',
    component: InventorySensorDetailPageComponent,
  },
  {
    path: 'inventory/sensors/:sensorId/:pageMode',
    component: InventorySensorDetailPageComponent,
  },
  {
    path: 'inventory/sensor-types',
    component: InventorySensorTypeListPageComponent,
  },
  {
    path: 'inventory/cable-types',
    component: InventoryCableTypeListPageComponent,
  },
  {
    path: 'inventory/boreholes',
    component: InventoryBoreholeListPageComponent,
  },
  {
    path: 'inventory/boreholes/:boreholeId',
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
@NgModule({
  declarations: [
    InventorySiteListPageComponent,
    InventorySiteDetailPageComponent,
    InventoryStationListPageComponent,
    InventoryStationDetailPageComponent,
    InventorySensorListPageComponent,
    InventorySensorDetailPageComponent,
    InventorySensorTypeListPageComponent,
    InventoryCableTypeListPageComponent,
    InventoryCableTypeDetailComponent,
    StationFormComponent,
    SensorFormComponent,
    ComponentTableComponent,
    ComponentFormComponent,
    SensorTypeFormComponent,
    StationTableComponent,
    SensorTableComponent,
    InventoryBoreholeDetailPageComponent,
    InventoryBoreholeListPageComponent,
    BoreholeFormComponent,
    BoreholeTableComponent,
    MicroquakeEventTypeTableComponent,
    MicroquakeEventTypeFormComponent,
    InventoryMicroquakeEventTypeListPageComponent,
    MicroquakeEventTypeFormDialogComponent
  ],
  imports: [
    SharedModule,
    MaintenanceModule,
    RouterModule.forChild(ROUTES),
  ],
  exports: [RouterModule],
  entryComponents: [
    MicroquakeEventTypeFormDialogComponent
  ]
})
export class InventoryModule { }
