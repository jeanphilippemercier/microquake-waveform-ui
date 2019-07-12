import { NgModule } from '@angular/core';
import { CatalogTreeModule } from '../catalog-tree/catalog-tree.module';

import { FooterComponent } from './footer/footer.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NotifierComponent } from '../notifier/notifier.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CatalogTreeModule
  ],
  declarations: [
    FooterComponent,
    SidebarComponent,
    NotifierComponent
  ],
  exports: [
    FooterComponent,
    SidebarComponent,
    NotifierComponent
  ]
})
export class ComponentsModule { }
