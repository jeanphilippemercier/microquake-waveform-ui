import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { FormDialog } from '@core/classes/form-dialog.class';
import { TraceLabelFormDialogData } from '@interfaces/dialogs.interface';

@Component({
  selector: 'app-trace-label-form-dialog',
  templateUrl: './trace-label-form-dialog.component.html',
  styleUrls: ['./trace-label-form-dialog.component.scss']
})
export class TraceLabelFormDialogComponent extends FormDialog<TraceLabelFormDialogComponent, TraceLabelFormDialogData> {

  constructor(
    protected _matDialogRef: MatDialogRef<TraceLabelFormDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public dialogData: TraceLabelFormDialogData
  ) {
    super(_matDialogRef, dialogData);
  }
}
