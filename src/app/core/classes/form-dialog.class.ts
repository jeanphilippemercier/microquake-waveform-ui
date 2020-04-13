import { MatDialogRef } from '@angular/material/dialog';
import { PageMode } from '@interfaces/core.interface';


export class FormDialog<T, R> {
  PageMode = PageMode;

  constructor(
    protected _matDialogRef: MatDialogRef<T, boolean>,
    public dialogData: R,
  ) { }

  close() {
    this._matDialogRef.close();
  }

  onCancelClicked() {
    this._matDialogRef.close();
  }

  onSaveClicked() {
    this._matDialogRef.close(true);
  }
}
