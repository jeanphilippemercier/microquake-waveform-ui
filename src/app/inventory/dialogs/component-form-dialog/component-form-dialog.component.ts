import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ComponentFormDialogData } from '@interfaces/dialogs.interface';
import { FormDialog } from '@core/classes/form-dialog.class';

@Component({
  selector: 'app-component-form-dialog',
  templateUrl: './component-form-dialog.component.html',
  styleUrls: ['./component-form-dialog.component.scss']
})
export class ComponentFormDialogComponent extends FormDialog<ComponentFormDialogComponent, ComponentFormDialogData> {

  constructor(
    protected _matDialogRef: MatDialogRef<ComponentFormDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public dialogData: ComponentFormDialogData
  ) {
    super(_matDialogRef, dialogData);
  }
}
