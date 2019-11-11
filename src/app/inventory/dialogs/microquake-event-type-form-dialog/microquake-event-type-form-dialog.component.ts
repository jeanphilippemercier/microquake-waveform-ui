import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { FormDialog } from '@core/classes/form-dialog.class';
import { MicroquakeEventTypeFormDialogData } from '@interfaces/dialogs.interface';

@Component({
  selector: 'app-microquake-event-type-form-dialog',
  templateUrl: './microquake-event-type-form-dialog.component.html',
  styleUrls: ['./microquake-event-type-form-dialog.component.scss']
})
export class MicroquakeEventTypeFormDialogComponent extends FormDialog<MicroquakeEventTypeFormDialogComponent, MicroquakeEventTypeFormDialogData> {

  constructor(
    protected _matDialogRef: MatDialogRef<MicroquakeEventTypeFormDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public dialogData: MicroquakeEventTypeFormDialogData
  ) {
    super(_matDialogRef, dialogData);
  }
}
