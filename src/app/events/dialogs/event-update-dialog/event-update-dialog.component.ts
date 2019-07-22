import { Component, Input, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { IEvent } from '@app/core/interfaces/event.interface';

interface DialogData {
  event: IEvent;
}
@Component({
  selector: 'app-event-update-dialog',
  templateUrl: './event-update-dialog.component.html',
  styleUrls: ['./event-update-dialog.component.scss']
})
export class EventUpdateDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: DialogData,
    private _matDialogRef: MatDialogRef<EventUpdateDialogComponent>
  ) { }
}
