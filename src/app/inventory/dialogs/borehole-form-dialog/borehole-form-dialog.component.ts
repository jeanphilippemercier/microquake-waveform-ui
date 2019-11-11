import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { BoreholeFormDialogData } from '@interfaces/dialogs.interface';
import { FormDialog } from '@core/classes/form-dialog.class';

@Component({
  selector: 'app-borehole-form-dialog',
  templateUrl: './borehole-form-dialog.component.html',
  styleUrls: ['./borehole-form-dialog.component.scss']
})
export class BoreholeFormDialogComponent extends FormDialog<BoreholeFormDialogComponent, BoreholeFormDialogData> {

  constructor(
    protected _matDialogRef: MatDialogRef<BoreholeFormDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public dialogData: BoreholeFormDialogData
  ) {
    super(_matDialogRef, dialogData);
  }
}
