import { NgModule } from '@angular/core';

import { SharedModule } from '@app/shared/shared.module';
import { EventDetailComponent } from './pages/event-detail/event-detail.component';
import { EventListComponent } from './pages/event-list/event-list.component';

import { NgxLoadingModule } from 'ngx-loading';
import { NgxPaginationModule } from 'ngx-pagination';
import { FlexLayoutModule } from '@angular/flex-layout';
import { EventShellComponent } from './pages/event-shell/event-shell.component';
import { Waveform2Component } from './components/waveform-2/waveform-2.component';
import { EventUpdateDialogComponent } from './dialogs/event-update-dialog/event-update-dialog.component';
import { EventFilterDialogComponent } from './dialogs/event-filter-dialog/event-filter-dialog.component';

@NgModule({
  declarations: [
    EventDetailComponent,
    EventListComponent,
    Waveform2Component,
    EventShellComponent,
    EventFilterDialogComponent,
    EventUpdateDialogComponent
  ],
  imports: [
    SharedModule,
    FlexLayoutModule,
    NgxLoadingModule,
    NgxPaginationModule
  ],
  exports: [
  ],
  entryComponents: [
    EventFilterDialogComponent,
    EventUpdateDialogComponent
  ]
})
export class EventsModule { }
