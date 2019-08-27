import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '@app/shared/shared.module';
import { InventorySiteListPageComponent } from './pages/inventory-site-list-page/inventory-site-list-page.component';
import { InventorySiteDetailPageComponent } from './pages/inventory-site-detail-page/inventory-site-detail-page.component';
import { InventorySensorListPageComponent } from './pages/inventory-sensor-list-page/inventory-sensor-list-page.component';
import { InventorySensorDetailPageComponent } from './pages/inventory-sensor-detail-page/inventory-sensor-detail-page.component';
import { InventoryComponentListPageComponent } from './pages/inventory-component-list-page/inventory-component-list-page.component';
import { InventoryComponentListComponent } from './components/inventory-component-list/inventory-component-list.component';
import { InventorySensorDetailComponent } from './components/inventory-sensor-detail/inventory-sensor-detail.component';
import { InventoryComponentDetailComponent } from './components/inventory-component-detail/inventory-component-detail.component';


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
    path: 'inventory/components',
    component: InventoryComponentListPageComponent,
  },
];
@NgModule({
  declarations: [
    InventorySiteListPageComponent,
    InventorySiteDetailPageComponent,
    InventorySensorListPageComponent,
    InventorySensorDetailPageComponent,
    InventorySensorDetailComponent,
    InventoryComponentListPageComponent,
    InventoryComponentListComponent,
    InventoryComponentDetailComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(ROUTES),
  ],
  exports: [RouterModule]
})
export class InventoryModule { }
