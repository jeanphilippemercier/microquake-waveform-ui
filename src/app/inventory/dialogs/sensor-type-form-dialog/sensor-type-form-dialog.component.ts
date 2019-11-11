import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { SensorTypeFormDialogData } from '@interfaces/dialogs.interface';
import { FormDialog } from '@core/classes/form-dialog.class';

@Component({
  selector: 'app-sensor-type-form-dialog',
  templateUrl: './sensor-type-form-dialog.component.html',
  styleUrls: ['./sensor-type-form-dialog.component.scss']
})
export class SensorTypeFormDialogComponent extends FormDialog<SensorTypeFormDialogComponent, SensorTypeFormDialogData> {

  constructor(
    protected _matDialogRef: MatDialogRef<SensorTypeFormDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public dialogData: SensorTypeFormDialogData
  ) {
    super(_matDialogRef, dialogData);
  }

}
