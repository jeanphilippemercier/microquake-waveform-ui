import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-event-help-dialog',
  templateUrl: './event-help-dialog.component.html',
  styleUrls: ['./event-help-dialog.component.scss']
})
export class EventHelpDialogComponent {

  constructor(
    private _matDialogRef: MatDialogRef<EventHelpDialogComponent>
  ) { }

  close() {
    this._matDialogRef.close();
  }

}
