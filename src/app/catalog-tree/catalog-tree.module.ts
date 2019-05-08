import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemoMaterialModule} from '../material-modules';
import { EventsTreeComponent } from '../events-tree.component';

@NgModule({
  declarations: [EventsTreeComponent],
  imports: [
    CommonModule,
    DemoMaterialModule,
    FormsModule
  ],
  exports: [EventsTreeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CatalogTreeModule { }
