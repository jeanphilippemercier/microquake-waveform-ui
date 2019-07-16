import { NgModule } from '@angular/core';

import { SharedModule } from '@app/shared/shared.module';
import { EventListComponent } from './pages/event-list/event-list.component';
import { SiteNetworkComponent } from './components/site-network/site-network.component';
import { NotifierComponent } from './components/notifier/notifier.component';

@NgModule({
  declarations: [
    EventListComponent,
    SiteNetworkComponent,
    NotifierComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    NotifierComponent
  ]
})
export class EventsModule { }
