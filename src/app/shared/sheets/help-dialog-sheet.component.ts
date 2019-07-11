import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-help-dialog-dialog',
  templateUrl: './help-dialog-sheet.component.html',
})
export class HelpDialogSheetComponent {

  constructor(
    public dialogRef: MatDialogRef<HelpDialogSheetComponent>
  ) { }

  closeModal() {
    this.dialogRef.close();
  }

}
