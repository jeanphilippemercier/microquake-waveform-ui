import { NgModule } from '@angular/core';

import { SharedModule } from '@app/shared/shared.module';
import { EventListComponent } from './pages/event-list/event-list.component';
import { SiteNetworkComponent } from './components/site-network/site-network.component';

@NgModule({
  declarations: [
    EventListComponent,
    SiteNetworkComponent
  ],
  imports: [
    SharedModule
  ]
})
export class EventsModule { }
