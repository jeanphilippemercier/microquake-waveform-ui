import { NgModule } from '@angular/core';

import { SharedModule } from '@app/shared/shared.module';
import { EventListComponent } from './pages/event-list/event-list.component';

@NgModule({
  declarations: [
    EventListComponent
  ],
  imports: [
    SharedModule,
  ]
})
export class EventsModule { }
