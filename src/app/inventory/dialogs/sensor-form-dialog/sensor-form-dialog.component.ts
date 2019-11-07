import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { SensorFormDialogData } from '@interfaces/dialogs.interface';
import { FormDialog } from '@core/classes/form-dialog.class';

@Component({
  selector: 'app-sensor-form-dialog',
  templateUrl: './sensor-form-dialog.component.html',
  styleUrls: ['./sensor-form-dialog.component.scss']
})
export class SensorFormDialogComponent extends FormDialog<SensorFormDialogComponent, SensorFormDialogData> {

  constructor(
    protected _matDialogRef: MatDialogRef<SensorFormDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public dialogData: SensorFormDialogData
  ) {
    super(_matDialogRef, dialogData);
  }
}
