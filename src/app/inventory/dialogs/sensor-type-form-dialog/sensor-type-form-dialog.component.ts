import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PageMode } from '@interfaces/core.interface';
import { SensorTypeFormDialogData } from '@interfaces/dialogs.interface';

@Component({
  selector: 'app-sensor-type-form-dialog',
  templateUrl: './sensor-type-form-dialog.component.html',
  styleUrls: ['./sensor-type-form-dialog.component.scss']
})
export class SensorTypeFormDialogComponent {
  PageMode = PageMode;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: SensorTypeFormDialogData,
    private _matDialogRef: MatDialogRef<SensorTypeFormDialogComponent, boolean>,
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
