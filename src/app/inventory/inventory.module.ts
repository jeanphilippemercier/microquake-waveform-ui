import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '@app/shared/shared.module';
import { InventorySiteListPageComponent } from './pages/site/inventory-site-list-page/inventory-site-list-page.component';
import { InventorySiteDetailPageComponent } from './pages/site/inventory-site-detail-page/inventory-site-detail-page.component';
import { InventorySensorListPageComponent } from './pages/sensor/inventory-sensor-list-page/inventory-sensor-list-page.component';
import { InventorySensorDetailPageComponent } from './pages/sensor/inventory-sensor-detail-page/inventory-sensor-detail-page.component';
import { InventoryComponentListComponent } from './components/component/inventory-component-list/inventory-component-list.component';
import { SensorFormComponent } from './components/sensor/sensor-form/sensor-form.component';
import { InventoryComponentDetailComponent } from './components/component/inventory-component-detail/inventory-component-detail.component';
import { InventoryStationListPageComponent } from './pages/station/inventory-station-list-page/inventory-station-list-page.component';
import { InventoryStationDetailPageComponent } from './pages/station/inventory-station-detail-page/inventory-station-detail-page.component';
import { StationFormComponent } from './components/station/station-form/station-form.component';
import { InventorySensorTypeListPageComponent } from './pages/sensor-type/inventory-sensor-type-list-page/inventory-sensor-type-list-page.component';
import { InventorySensorTypeDetailComponent } from './components/sensor-type/inventory-sensor-type-detail/inventory-sensor-type-detail.component';
import { InventoryCableTypeListPageComponent } from './pages/cable-type/inventory-cable-type-list-page/inventory-cable-type-list-page.component';
import { InventoryCableTypeDetailComponent } from './components/cable-type/inventory-cable-type-detail/inventory-cable-type-detail.component';
import { MaintenanceModule } from '@app/maintenance/maintenance.module';
import { StationTableComponent } from './components/station/station-table/station-table.component';
import { SensorTableComponent } from './components/sensor/sensor-table/sensor-table.component';

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
];
@NgModule({
  declarations: [
    InventorySiteListPageComponent,
    InventorySiteDetailPageComponent,
    InventoryStationListPageComponent,
    InventoryStationDetailPageComponent,
    StationFormComponent,
    InventorySensorListPageComponent,
    InventorySensorDetailPageComponent,
    SensorFormComponent,
    InventorySensorTypeListPageComponent,
    InventoryComponentListComponent,
    InventoryComponentDetailComponent,
    InventorySensorTypeDetailComponent,
    InventoryCableTypeListPageComponent,
    InventoryCableTypeDetailComponent,
    StationTableComponent,
    SensorTableComponent
  ],
  imports: [
    SharedModule,
    MaintenanceModule,
    RouterModule.forChild(ROUTES),
  ],
  exports: [RouterModule]
})
export class InventoryModule { }
