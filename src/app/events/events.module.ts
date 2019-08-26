import { NgModule } from '@angular/core';

import { SharedModule } from '@app/shared/shared.module';
import { EventDetailComponent } from './pages/event-detail/event-detail.component';
import { EventListComponent } from './pages/event-list/event-list.component';

import { Waveform2Component } from './components/waveform-2/waveform-2.component';
import { EventUpdateDialogComponent } from './dialogs/event-update-dialog/event-update-dialog.component';
import { EventFilterDialogComponent } from './dialogs/event-filter-dialog/event-filter-dialog.component';
import { RouterModule, Routes } from '@angular/router';
import { WaveformToolbarComponent } from './components/waveform-toolbar/waveform-toolbar.component';
// tslint:disable-next-line:max-line-length
import { EventInteractiveProcessingDialogComponent } from './dialogs/event-interactive-processing-dialog/event-interactive-processing-dialog.component';

const ROUTES: Routes = [
  {
    path: 'events',
    component: EventListComponent,
    pathMatch: 'full'
  },
  {
    path: 'events/:eventId',
    component: EventDetailComponent
  },
];

@NgModule({
  declarations: [
    EventDetailComponent,
    EventListComponent,
    Waveform2Component,
    WaveformToolbarComponent,
    EventFilterDialogComponent,
    EventUpdateDialogComponent,
    EventInteractiveProcessingDialogComponent
  ],
  imports: [
    RouterModule.forChild(ROUTES),
    SharedModule
  ],
  exports: [
    RouterModule
  ],
  entryComponents: [
    EventFilterDialogComponent,
    EventUpdateDialogComponent,
    EventInteractiveProcessingDialogComponent
  ]
})
export class EventsModule { }
