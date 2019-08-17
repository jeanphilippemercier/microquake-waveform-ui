import { Component, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { EventUpdateDialog } from '@interfaces/dialogs.interface';
import { IEvent, EventType, EvaluationStatus, EvaluationMode } from '@app/core/interfaces/event.interface';
import { EventUpdateInput } from '@app/core/interfaces/event-dto.interface';

@Component({
  selector: 'app-event-update-dialog',
  templateUrl: './event-update-dialog.component.html',
  styleUrls: ['./event-update-dialog.component.scss']
})
export class EventUpdateDialogComponent {

  onSave: EventEmitter<EventUpdateInput> = new EventEmitter();

  event: IEvent;
  editedEvent: IEvent;
  editedValues: EventUpdateInput;
  eventTypes: EventType[];
  evaluationStatuses: EvaluationStatus[];
  eventEvaluationModes: EvaluationMode[];

  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: EventUpdateDialog,
    private _matDialogRef: MatDialogRef<EventUpdateDialogComponent>
  ) {
    this.event = { ...dialogData.event };
    this.editedEvent = { ...dialogData.event };
    this.eventTypes = dialogData.eventTypes;
    this.evaluationStatuses = dialogData.evaluationStatuses;
    this.eventEvaluationModes = dialogData.eventEvaluationModes;
  }

  async onEventChange(event: IEvent) {
    this.editedEvent = event;
    this.editedValues = this.getEditedValues(this.event, this.editedEvent);
  }

  getEditedValues(origEvent: IEvent, editedEvent: IEvent): EventUpdateInput | null {
    const eventUpdateInput: EventUpdateInput = {
      event_resource_id: origEvent.event_resource_id
    };
    const keys = Object.keys(editedEvent);
    let changes = false;

    keys.forEach(key => {
      const origVal = origEvent[key];
      const editedVal = editedEvent[key];

      if (origVal && editedVal && origVal !== editedVal) {
        eventUpdateInput[key] = editedVal;
        changes = true;
      }
    });

    if (changes) {
      return eventUpdateInput;
    }

    return null;
  }

  onSaveClick(event: EventUpdateInput) {
    this.onSave.emit(event);
  }
}
