import { NgModule } from '@angular/core';
import {CatalogTreeModule} from '../catalog-tree/catalog-tree.module';

import { FooterComponent } from './footer/footer.component';
import { NavbarComponent } from './navbar/navbar.component';
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
    NavbarComponent,
    SidebarComponent,
    NotifierComponent
  ],
  exports: [
    FooterComponent,
    NavbarComponent,
    SidebarComponent,
    NotifierComponent
  ]
})
export class ComponentsModule { }
