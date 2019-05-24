import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DemoMaterialModule} from '../material-modules';
import {CatalogTreeModule} from '../catalog-tree/catalog-tree.module';

import { FooterComponent } from './footer/footer.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NotifierComponent } from '../notifier/notifier.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DemoMaterialModule,
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
