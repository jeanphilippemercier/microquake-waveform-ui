import { NgModule } from '@angular/core';

import { SharedModule } from '@app/shared/shared.module';
import { EventDetailComponent } from './pages/event-detail/event-detail.component';
import { EventListComponent } from './pages/event-list/event-list.component';
import { NotifierComponent } from './components/notifier/notifier.component';
import { EventsTreeComponent } from './components/catalog-tree/events-tree.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { WaveformComponent } from './pages/waveform/waveform.component';

import { NgxLoadingModule } from 'ngx-loading';
import { NgxPaginationModule } from 'ngx-pagination';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [
    EventDetailComponent,
    EventListComponent,
    NotifierComponent,
    SidebarComponent,
    EventsTreeComponent,
    WaveformComponent
  ],
  imports: [
    SharedModule,
    FlexLayoutModule,
    NgxLoadingModule,
    NgxPaginationModule
  ],
  exports: [
    SidebarComponent
  ]
})
export class EventsModule { }
