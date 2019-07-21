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
import { EventListOldComponent } from './pages/event-list-old/event-list-old.component';
import { EventShellComponent } from './pages/event-shell/event-shell.component';
import { EventShellOldComponent } from './pages/event-shell-old/event-shell-old.component';
import { Waveform2Component } from './components/waveform-2/waveform-2.component';
import { EventUpdateDialogComponent } from './dialogs/event-update-dialog/event-update-dialog.component';

@NgModule({
  declarations: [
    EventDetailComponent,
    EventListComponent,
    EventListOldComponent,
    NotifierComponent,
    SidebarComponent,
    EventsTreeComponent,
    WaveformComponent,
    Waveform2Component,
    EventShellComponent,
    EventShellOldComponent,
    EventUpdateDialogComponent
  ],
  imports: [
    SharedModule,
    FlexLayoutModule,
    NgxLoadingModule,
    NgxPaginationModule
  ],
  exports: [
    SidebarComponent
  ],
  entryComponents: [
    EventUpdateDialogComponent
  ]
})
export class EventsModule { }
