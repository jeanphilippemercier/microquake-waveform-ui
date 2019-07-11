import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { EventsTreeComponent } from './events-tree.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [EventsTreeComponent],
  imports: [
    SharedModule
  ],
  exports: [EventsTreeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CatalogTreeModule { }
