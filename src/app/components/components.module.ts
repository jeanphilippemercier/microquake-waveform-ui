import { NgModule } from '@angular/core';
import { CatalogTreeModule } from '../catalog-tree/catalog-tree.module';

import { SidebarComponent } from './sidebar/sidebar.component';
import { NotifierComponent } from '../notifier/notifier.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CatalogTreeModule
  ],
  declarations: [
    SidebarComponent,
    NotifierComponent
  ],
  exports: [
    SidebarComponent,
    NotifierComponent
  ]
})
export class ComponentsModule { }
