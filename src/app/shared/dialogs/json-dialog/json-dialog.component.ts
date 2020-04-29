import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { JsonDialogData } from '@interfaces/dialogs.interface';

@Component({
  selector: 'app-json-dialog',
  templateUrl: './json-dialog.component.html',
  styleUrls: ['./json-dialog.component.scss']
})
export class JsonDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: JsonDialogData,
    private _matDialogRef: MatDialogRef<JsonDialogComponent>
  ) {
    dialogData.header = dialogData.header ?? 'JSON';
  }

  close() {
    this._matDialogRef.close();
  }

}
