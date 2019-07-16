import { NgModule } from '@angular/core';

import { SharedModule } from '@app/shared/shared.module';
import { EventListComponent } from './pages/event-list/event-list.component';
import { SiteNetworkComponent } from './components/site-network/site-network.component';
import { NotifierComponent } from './components/notifier/notifier.component';
import { EventsTreeComponent } from './components/catalog-tree/events-tree.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@NgModule({
  declarations: [
    EventListComponent,
    SiteNetworkComponent,
    NotifierComponent,
    SidebarComponent,
    EventsTreeComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    SidebarComponent
  ]
})
export class EventsModule { }
