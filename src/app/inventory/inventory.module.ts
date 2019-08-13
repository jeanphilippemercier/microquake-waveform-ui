import { NgModule } from '@angular/core';

import { SharedModule } from '@app/shared/shared.module';
import { InventorySiteListPageComponent } from './pages/inventory-site-list-page/inventory-site-list-page.component';
import { RouterModule, Routes } from '@angular/router';
import { InventorySiteDetailPageComponent } from './pages/inventory-site-detail-page/inventory-site-detail-page.component';


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
  }
];
@NgModule({
  declarations: [
    InventorySiteListPageComponent,
    InventorySiteDetailPageComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(ROUTES),
  ],
  exports: [RouterModule]
})
export class InventoryModule { }
