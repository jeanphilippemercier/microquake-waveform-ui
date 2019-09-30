import { Component, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { EventInteractiveProcessingDialog } from '@interfaces/dialogs.interface';
import { IEvent } from '@app/core/interfaces/event.interface';

@Component({
  selector: 'app-event-interactive-processing-dialog',
  templateUrl: './event-interactive-processing-dialog.component.html',
  styleUrls: ['./event-interactive-processing-dialog.component.scss']
})
export class EventInteractiveProcessingDialogComponent {

  onAcceptClicked: EventEmitter<void> = new EventEmitter();
  onRejectClicked: EventEmitter<void> = new EventEmitter();

  oldEvent: IEvent;
  newEvent: IEvent;

  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: EventInteractiveProcessingDialog,
    private _matDialogRef: MatDialogRef<EventInteractiveProcessingDialogComponent>
  ) {
    this.oldEvent = { ...dialogData.oldEvent };

    if (dialogData.newEvent) {
      this.newEvent = { ...dialogData.newEvent };
    }
  }

  onRejectClick() {
    this.onRejectClicked.emit();
  }

  onAcceptClick() {
    this.onAcceptClicked.emit();
  }
}
