import { NgModule } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemoMaterialModule} from '../material-modules';
import { EventsTreeComponent } from '../events-tree.component';

@NgModule({
  declarations: [EventsTreeComponent],
  imports: [
    CommonModule,
    DemoMaterialModule
  ],
  exports: [EventsTreeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CatalogTreeModule { }
