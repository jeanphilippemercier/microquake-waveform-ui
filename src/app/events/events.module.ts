import { NgModule } from '@angular/core';

import { SharedModule } from '@app/shared/shared.module';
import { EventDetailComponent } from './pages/event-detail/event-detail.component';
import { EventListComponent } from './pages/event-list/event-list.component';

import { Waveform2Component } from './components/waveform-2/waveform-2.component';
import { RouterModule, Routes } from '@angular/router';
import { WaveformToolbarComponent } from './components/waveform-toolbar/waveform-toolbar.component';
// tslint:disable-next-line:max-line-length
import { EventInteractiveProcessingDialogComponent } from './dialogs/event-interactive-processing-dialog/event-interactive-processing-dialog.component';
import { EventSitePickerComponent } from './components/events-site-picker/event-site-picker.component';
import { EventSitePickerDialogComponent } from './dialogs/event-site-picker-dialog/event-site-picker-dialog.component';

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
    EventInteractiveProcessingDialogComponent,
    EventSitePickerComponent,
    EventSitePickerDialogComponent
  ],
  imports: [
    RouterModule.forChild(ROUTES),
    SharedModule
  ],
  exports: [
    RouterModule
  ],
  entryComponents: [
    EventInteractiveProcessingDialogComponent,
    EventSitePickerDialogComponent
  ]
})
export class EventsModule { }
