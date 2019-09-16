import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmationDialogData } from '@interfaces/dialogs.interface';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: ConfirmationDialogData,
    private _matDialogRef: MatDialogRef<ConfirmationDialogComponent>
  ) { }

  close() {
    this._matDialogRef.close();
  }

}
