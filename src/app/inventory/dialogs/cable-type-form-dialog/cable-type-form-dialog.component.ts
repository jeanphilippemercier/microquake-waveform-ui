import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { FormDialog } from '@core/classes/form-dialog.class';
import { CableTypeFormDialogData } from '@interfaces/dialogs.interface';

@Component({
  selector: 'app-cable-type-form-dialog',
  templateUrl: './cable-type-form-dialog.component.html',
  styleUrls: ['./cable-type-form-dialog.component.scss']
})
export class CableTypeFormDialogComponent extends FormDialog<CableTypeFormDialogComponent, CableTypeFormDialogData> {

  constructor(
    protected _matDialogRef: MatDialogRef<CableTypeFormDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public dialogData: CableTypeFormDialogData
  ) {
    super(_matDialogRef, dialogData);
  }
}
