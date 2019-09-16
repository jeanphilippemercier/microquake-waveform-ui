import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '@app/shared/shared.module';
import { InventorySiteListPageComponent } from './pages/inventory-site-list-page/inventory-site-list-page.component';
import { InventorySiteDetailPageComponent } from './pages/inventory-site-detail-page/inventory-site-detail-page.component';
import { InventorySensorListPageComponent } from './pages/inventory-sensor-list-page/inventory-sensor-list-page.component';
import { InventorySensorDetailPageComponent } from './pages/inventory-sensor-detail-page/inventory-sensor-detail-page.component';
import { InventoryComponentListComponent } from './components/inventory-component-list/inventory-component-list.component';
import { InventorySensorDetailComponent } from './components/inventory-sensor-detail/inventory-sensor-detail.component';
import { InventoryComponentDetailComponent } from './components/inventory-component-detail/inventory-component-detail.component';
import { InventoryStationListPageComponent } from './pages/inventory-station-list-page/inventory-station-list-page.component';
import { InventoryStationDetailPageComponent } from './pages/inventory-station-detail-page/inventory-station-detail-page.component';
import { InventoryStationDetailComponent } from './components/inventory-station-detail/inventory-station-detail.component';
import { InventorySensorTypeListPageComponent } from './pages/inventory-sensor-type-list-page/inventory-sensor-type-list-page.component';
import { InventorySensorTypeDetailComponent } from './components/inventory-sensor-type-detail/inventory-sensor-type-detail.component';
import { InventoryCableTypeListPageComponent } from './pages/inventory-cable-type-list-page/inventory-cable-type-list-page.component';
import { InventoryCableTypeDetailComponent } from './components/inventory-cable-type-detail/inventory-cable-type-detail.component';

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
    InventoryStationDetailComponent,
    InventorySensorListPageComponent,
    InventorySensorDetailPageComponent,
    InventorySensorDetailComponent,
    InventorySensorTypeListPageComponent,
    InventoryComponentListComponent,
    InventoryComponentDetailComponent,
    InventorySensorTypeDetailComponent,
    InventoryCableTypeListPageComponent,
    InventoryCableTypeDetailComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(ROUTES),
  ],
  exports: [RouterModule]
})
export class InventoryModule { }
