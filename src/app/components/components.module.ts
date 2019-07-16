import { NgModule } from '@angular/core';

import { CatalogTreeModule } from '@app/catalog-tree/catalog-tree.module';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { SharedModule } from '@app/shared/shared.module';
import { EventsModule } from '@app/events/events.module';

@NgModule({
  imports: [
    SharedModule,
    EventsModule,
    CatalogTreeModule
  ],
  declarations: [
    SidebarComponent
  ],
  exports: [
    SidebarComponent
  ]
})
export class ComponentsModule { }
