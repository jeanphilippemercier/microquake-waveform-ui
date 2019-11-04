import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PageMode } from '@interfaces/core.interface';
import { SensorFormDialogData } from '@interfaces/dialogs.interface';

@Component({
  selector: 'app-sensor-form-dialog',
  templateUrl: './sensor-form-dialog.component.html',
  styleUrls: ['./sensor-form-dialog.component.scss']
})
export class SensorFormDialogComponent {
  PageMode = PageMode;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: SensorFormDialogData,
    private _matDialogRef: MatDialogRef<SensorFormDialogComponent, boolean>,
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
