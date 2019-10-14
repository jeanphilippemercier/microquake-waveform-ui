import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PageMode } from '@interfaces/core.interface';
import { MaintenanceFormDialogData, MicroquakeEventTypeFormDialogData } from '@interfaces/dialogs.interface';
import { MaintenanceEvent } from '@interfaces/maintenance.interface';

@Component({
  selector: 'app-microquake-event-type-form-dialog',
  templateUrl: './microquake-event-type-form-dialog.component.html',
  styleUrls: ['./microquake-event-type-form-dialog.component.scss']
})
export class MicroquakeEventTypeFormDialogComponent {
  PageMode = PageMode;
  model: MaintenanceEvent;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: MicroquakeEventTypeFormDialogData,
    private _matDialogRef: MatDialogRef<MicroquakeEventTypeFormDialogComponent, boolean>,
  ) { }

  close() {
    this._matDialogRef.close();
  }

  onCancelClicked() {
    this._matDialogRef.close();
  }

  onSaveClicked() {
    this._matDialogRef.close(true);
  }
}
