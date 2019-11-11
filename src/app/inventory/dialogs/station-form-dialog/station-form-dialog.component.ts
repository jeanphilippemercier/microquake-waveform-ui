import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { StationFormDialogData } from '@interfaces/dialogs.interface';
import { FormDialog } from '@core/classes/form-dialog.class';

@Component({
  selector: 'app-station-form-dialog',
  templateUrl: './station-form-dialog.component.html',
  styleUrls: ['./station-form-dialog.component.scss']
})
export class StationFormDialogComponent extends FormDialog<StationFormDialogComponent, StationFormDialogData> {

  constructor(
    protected _matDialogRef: MatDialogRef<StationFormDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public dialogData: StationFormDialogData
  ) {
    super(_matDialogRef, dialogData);
  }
}
